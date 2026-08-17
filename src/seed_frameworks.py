"""Seed frameworks, requirements, and mappings from JSON files.

Run at container startup (idempotent: upserts all data).
Usage: python -m src.seed_frameworks
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from src.models import Framework

logger = logging.getLogger("seed-frameworks")
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://compliance:compliance@localhost:5438/compliance")
REFERENTIELS_DIR = Path(os.getenv("REFERENTIELS_DIR", str(Path(__file__).resolve().parent.parent / "referentiels")))


async def seed_frameworks(session: AsyncSession) -> None:
    catalog_path = REFERENTIELS_DIR / "catalog.json"
    if not catalog_path.exists():
        logger.warning("No catalog.json found in %s", REFERENTIELS_DIR)
        return

    try:
        with open(catalog_path) as f:
            catalog_raw = json.load(f)
    except json.JSONDecodeError as exc:
        logger.error("Malformed catalog.json: %s", exc)
        return

    if isinstance(catalog_raw, dict):
        catalog = [{"id": k, **v} for k, v in catalog_raw.items()]
    else:
        catalog = catalog_raw

    logger.info("Seeding %d frameworks from %s", len(catalog), REFERENTIELS_DIR)

    for sort_idx, entry in enumerate(catalog):
        fw_id = entry.get("id")
        if not fw_id:
            logger.warning("  SKIP entry %d — no id", sort_idx)
            continue

        fw_path = (REFERENTIELS_DIR / f"{fw_id}.json").resolve()
        if not str(fw_path).startswith(str(REFERENTIELS_DIR.resolve())):
            logger.warning("  SKIP %s — path traversal rejected", fw_id)
            continue
        if not fw_path.exists():
            logger.warning("  SKIP %s — file not found", fw_id)
            continue

        try:
            with open(fw_path) as f:
                fw_data = json.load(f)
        except json.JSONDecodeError as exc:
            logger.error("  SKIP %s — malformed JSON: %s", fw_id, exc)
            continue

        await session.execute(text("""
            INSERT INTO frameworks (id, version, label, description, description_en, color, is_active, sort_order)
            VALUES (:id, :version, :label, :desc, :desc_en, :color, true, :sort)
            ON CONFLICT (id) DO UPDATE SET
                version = EXCLUDED.version, label = EXCLUDED.label,
                description = EXCLUDED.description, description_en = EXCLUDED.description_en,
                color = EXCLUDED.color, sort_order = EXCLUDED.sort_order
        """), {
            "id": fw_id,
            "version": fw_data.get("version", ""),
            "label": fw_data.get("label", entry.get("label", fw_id)),
            "desc": fw_data.get("description", entry.get("description", "")),
            "desc_en": fw_data.get("description_en", entry.get("description_en", "")),
            "color": fw_data.get("color", entry.get("color", "")),
            "sort": sort_idx,
        })

        await session.execute(text("DELETE FROM framework_requirements WHERE framework_id = :fid"), {"fid": fw_id})

        measures = fw_data.get("measures", [])
        params = [
            {
                "fid": fw_id,
                "ref": m.get("ref") or f"{fw_id}-{idx+1}",
                "sort": idx,
                "theme": m.get("theme", ""),
                "theme_en": m.get("theme_en", ""),
                "mesure": m.get("mesure", ""),
                "mesure_en": m.get("mesure_en", ""),
                "desc": m.get("description", ""),
                "desc_en": m.get("description_en", ""),
                "type": m.get("type", ""),
                "cat": m.get("category", ""),
                "linked": json.dumps(m.get("linked_controls", [])),
                "meta": json.dumps(m.get("metadata_extra", {})),
            }
            for idx, m in enumerate(measures)
        ]
        if params:
            await session.execute(text("""
                INSERT INTO framework_requirements
                    (framework_id, ref, sort_order, theme, theme_en, mesure, mesure_en,
                     description, description_en, type, category, linked_controls, metadata_extra)
                VALUES (:fid, :ref, :sort, :theme, :theme_en, :mesure, :mesure_en,
                        :desc, :desc_en, :type, :cat,
                        cast(:linked as jsonb), cast(:meta as jsonb))
            """), params)

        logger.info("  %-15s %4d requirements", fw_id, len(measures))

    await session.commit()


async def seed_mappings(session: AsyncSession) -> None:
    mappings_dir = REFERENTIELS_DIR / "mappings"
    if not mappings_dir.exists():
        logger.info("No mappings directory")
        return

    total = 0
    for fpath in sorted(mappings_dir.glob("*.json")):
        try:
            with open(fpath) as f:
                data = json.load(f)
        except json.JSONDecodeError as exc:
            logger.error("  SKIP %s — malformed JSON: %s", fpath.name, exc)
            continue

        source = data.get("source", "")
        target = data.get("target", "")
        rules = data.get("rules", [])

        res = await session.execute(
            select(Framework.id).where(Framework.id.in_([source, target]))
        )
        existing = {r[0] for r in res.all()}
        if source not in existing or target not in existing:
            logger.warning("  SKIP %s — framework %s not found", fpath.name, source if source not in existing else target)
            continue

        await session.execute(
            text("DELETE FROM framework_mappings WHERE source_framework = :sf AND target_framework = :tf"),
            {"sf": source, "tf": target},
        )

        params = [
            {
                "sf": source, "tf": target,
                "sr": r.get("source_ref", ""),
                "tr": r.get("target_ref", ""),
                "rel": r.get("relationship", ""),
                "rat": r.get("rationale", ""),
            }
            for r in rules
        ]
        if params:
            await session.execute(text("""
                INSERT INTO framework_mappings (source_framework, target_framework, source_ref, target_ref, relationship_type, rationale)
                VALUES (:sf, :tf, :sr, :tr, :rel, :rat)
            """), params)

        total += len(rules)
        logger.info("  %-30s %4d rules", f"{source} → {target}", len(rules))

    await session.commit()
    logger.info("  Total: %d mapping rules", total)


async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_sess = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_sess() as session:
        await seed_frameworks(session)
        await seed_mappings(session)

    await engine.dispose()
    logger.info("Seeding complete")


if __name__ == "__main__":
    asyncio.run(main())
