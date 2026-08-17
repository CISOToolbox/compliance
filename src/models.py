from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ── Auth & Settings (unchanged) ─────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    picture = Column(String(500), nullable=True)
    provider = Column(String(50), nullable=False)
    provider_id = Column(String(255), nullable=False)
    role = Column(String(50), default="user", server_default=text("'user'"))
    ai_enabled = Column(String(5), default="false", server_default=text("'false'"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    last_login = Column(DateTime(timezone=True), nullable=True)


class AppSettings(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False, default="")


# ── Project (data column kept for backwards compat, deprecated) ─

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    name = Column(String(255), nullable=False, default="")
    organization = Column(String(255), nullable=True)
    owner_id = Column(UUID(as_uuid=True),
                      # SET NULL, not the NO ACTION default: deleting a user must
                      # not be blocked by the objects they happen to own. The
                      # ownership idiom already tolerates a null owner.
                      ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    shared_with = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    # FEAT-33 — bumped ONLY by server-initiated writers (Pilot write-back,
    # restore, schedulers). Guards the blob PUT against stale-tab overwrite.
    server_rev = Column(Integer, nullable=False, default=0, server_default=text("0"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    meta_rel = relationship("ProjectMeta", back_populates="project", uselist=False, cascade="all, delete-orphan")
    settings_rel = relationship("ProjectSettings", back_populates="project", uselist=False, cascade="all, delete-orphan")
    controls = relationship("ProjectControl", back_populates="project", cascade="all, delete-orphan", order_by="ProjectControl.sort_order")
    measures = relationship("ProjectMeasure", back_populates="project", cascade="all, delete-orphan", order_by="ProjectMeasure.sort_order")
    proofs = relationship("ProjectProof", back_populates="project", cascade="all, delete-orphan", order_by="ProjectProof.sort_order")


# ── Project Meta (1:1) ─────────────────────────────────────────

class ProjectMeta(Base):
    __tablename__ = "project_meta"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    societe = Column(String(255), nullable=True, default="")
    date_evaluation = Column(String(20), nullable=True, default="")
    evaluateur = Column(String(255), nullable=True, default="")
    perimetre = Column(Text, nullable=True, default="")
    commentaires = Column(Text, nullable=True, default="")

    project = relationship("Project", back_populates="meta_rel")


# ── Project Settings (1:1) ─────────────────────────────────────

class ProjectSettings(Base):
    __tablename__ = "project_settings"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    referentiels_actifs = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))

    project = relationship("Project", back_populates="settings_rel")


# ── Project Control ────────────────────────────────────────────

class ProjectControl(Base):
    __tablename__ = "project_controls"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    id = Column(Integer, primary_key=True, autoincrement=True)
    sort_order = Column(Integer, nullable=False, default=0)

    framework_id = Column(String(50), nullable=False, default="")
    ref = Column(String(50), nullable=True, default="")
    thematique = Column(String(500), nullable=True, default="")
    mesure = Column(Text, nullable=True, default="")
    applicable = Column(String(10), nullable=True, default="")
    conformite = Column(String(20), nullable=True, default="")
    ecart = Column(Text, nullable=True, default="")
    mesures_prevues = Column(Text, nullable=True, default="")
    mesures_ids = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    thematique_en = Column(String(500), nullable=True, default="")
    mesure_en = Column(Text, nullable=True, default="")

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    project = relationship("Project", back_populates="controls")

    __table_args__ = (
        Index("ix_project_controls_framework", "project_id", "framework_id"),
    )


# ── Project Measure ────────────────────────────────────────────

class ProjectMeasure(Base):
    __tablename__ = "project_measures"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(30), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)

    description = Column(Text, nullable=True, default="")
    details = Column(Text, nullable=True, default="")
    statut = Column(String(50), nullable=False, default="")
    date_cible = Column(String(20), nullable=True, default="")
    responsable = Column(String(255), nullable=True, default="")
    recurrence = Column(String(50), nullable=True, default="")
    dernier_controle = Column(String(20), nullable=True, default="")
    preuves_ids = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    # FEAT-12 — timestamped progress journal: [{at, by, text}]
    progress_log = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    # Dedup signature "<proof_id>:<date_expiration>" for measures auto-created
    # by the proof-expiry notifier; NULL for manual measures. Unique per
    # project so the daily tick is idempotent (same pattern as Asset FEAT-22).
    auto_key = Column(String(160), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    project = relationship("Project", back_populates="measures")

    __table_args__ = (
        Index("ix_project_measures_project", "project_id"),
        Index("uq_project_measures_auto_key", "project_id", "auto_key", unique=True),
    )


# ── Project Proof ──────────────────────────────────────────────

# FEAT-08: ProjectProof is the module's first-class *evidence* — a proof that
# can back compliance measures (and, later, other objects). The table name
# stays `project_proofs` (the frontend/API contract is `proofs` / D.preuves),
# but the model now carries the richer shared evidence shape (kind, owner,
# tags…) and its expiration is classified via shared/python/evidence_common.py
# so it can be consolidated in Pilot's evidence registry.
class ProjectProof(Base):
    __tablename__ = "project_proofs"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(30), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)

    label = Column(String(500), nullable=True, default="")
    url = Column(String(1000), nullable=True, default="")
    date_obtention = Column(String(20), nullable=True, default="")
    date_expiration = Column(String(20), nullable=True, default="")
    commentaire = Column(Text, nullable=True, default="")

    # FEAT-08 evidence fields.
    kind = Column(String(20), nullable=False, default="link", server_default=text("'link'"))  # file|link|observation
    file_ref = Column(String(500), nullable=True, default="")
    owner = Column(String(255), nullable=True, default="")
    tags = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    project = relationship("Project", back_populates="proofs")

    __table_args__ = (
        Index("ix_project_proofs_project", "project_id"),
    )


# ── Reference Frameworks (read-only catalog) ─────────────────────

class Framework(Base):
    __tablename__ = "frameworks"

    id = Column(String(50), primary_key=True)
    version = Column(String(20), nullable=False, default="")
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    description_en = Column(Text, nullable=True, default="")
    color = Column(String(20), nullable=True, default="")
    is_active = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    requirements = relationship("FrameworkRequirement", back_populates="framework", cascade="all, delete-orphan", order_by="FrameworkRequirement.sort_order")


class FrameworkRequirement(Base):
    __tablename__ = "framework_requirements"

    framework_id = Column(String(50), ForeignKey("frameworks.id", ondelete="CASCADE"), primary_key=True)
    ref = Column(String(50), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)

    theme = Column(String(500), nullable=True, default="")
    theme_en = Column(String(500), nullable=True, default="")
    mesure = Column(Text, nullable=True, default="")
    mesure_en = Column(Text, nullable=True, default="")
    description = Column(Text, nullable=True, default="")
    description_en = Column(Text, nullable=True, default="")
    type = Column(String(50), nullable=True, default="")
    category = Column(String(50), nullable=True, default="")
    linked_controls = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    metadata_extra = Column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))

    framework = relationship("Framework", back_populates="requirements")


class FrameworkMapping(Base):
    __tablename__ = "framework_mappings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_framework = Column(String(50), ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False)
    target_framework = Column(String(50), ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False)
    source_ref = Column(String(50), nullable=False)
    target_ref = Column(String(50), nullable=False)
    relationship_type = Column(String(30), nullable=True, default="")
    rationale = Column(Text, nullable=True, default="")

    __table_args__ = (
        Index("ix_fw_mapping_source", "source_framework", "source_ref"),
        Index("ix_fw_mapping_target", "target_framework", "target_ref"),
    )


class MeasureCatalog(Base):
    __tablename__ = "measure_catalog"

    id = Column(String(20), primary_key=True)
    domain = Column(String(100), nullable=False, default="")
    title = Column(Text, nullable=False, default="")
    title_en = Column(Text, nullable=True, default="")
    description = Column(Text, nullable=True, default="")
    description_en = Column(Text, nullable=True, default="")
    evidence_types = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    measure_type = Column(String(30), nullable=True, default="")
    framework_refs = Column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))





# ── Append-only server-side write journal (FEAT-30 P1.6) ──────────────
# Created by Base.metadata.create_all at startup (no migration needed for
# a new table). Written via src.audit.log_write — see audit_common master.
class AuditLog(Base):
    """Append-only: never UPDATEd/DELETEd (retention purge excepted).
    entity_type/entity_id tie a line to the exact restorable object."""
    __tablename__ = "audit_log"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"), index=True)
    user_email = Column(String(255), nullable=False, default="")
    user_name = Column(String(255), nullable=False, default="")
    action = Column(String(100), nullable=False, index=True)
    target = Column(String(500), nullable=False, default="")
    entity_type = Column(String(50), nullable=False, default="")
    entity_id = Column(String(64), nullable=False, default="", index=True)
    details = Column(Text, nullable=False, default="")
    ip_address = Column(String(64), nullable=False, default="")
