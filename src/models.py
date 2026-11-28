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
    # FEAT-74 — the project's users follow Pilot's directory: Pilot's changes
    # are applied here, and the users it sends are read-only but for their
    # accounts. Off by default; set from the Users tab, never by a project save.
    users_pilot_sync = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    meta_rel = relationship("ProjectMeta", back_populates="project", uselist=False, cascade="all, delete-orphan")
    settings_rel = relationship("ProjectSettings", back_populates="project", uselist=False, cascade="all, delete-orphan")
    controls = relationship("ProjectControl", back_populates="project", cascade="all, delete-orphan", order_by="ProjectControl.sort_order")
    measures = relationship("ProjectMeasure", back_populates="project", cascade="all, delete-orphan", order_by="ProjectMeasure.sort_order")
    proofs = relationship("ProjectProof", back_populates="project", cascade="all, delete-orphan", order_by="ProjectProof.sort_order")
    # FEAT-73 — deleting a project deletes its connections (and, through
    # them, everything collected): the database cascades, the ORM follows.
    collection_connections = relationship("CollectionConnection", cascade="all, delete-orphan", passive_deletes=True)


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
# tags…) and its expiration is classified via evidence_common.py
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
    # FEAT-73 — `manual` (added by a person) or `collected` (written by the
    # server from a connector). Never taken from the client.
    source = Column(String(20), nullable=False, default="manual", server_default=text("'manual'"))

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    project = relationship("Project", back_populates="proofs")

    __table_args__ = (
        Index("ix_project_proofs_project", "project_id"),
    )


PROOF_SOURCES = ("manual", "collected")


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
    # FEAT-51 — where the framework comes from: `catalogue` is what the
    # migrations seed and nobody may delete; `custom` is what a user imported
    # from a CSV or built from the register. Nothing else distinguishes them —
    # that is the point: an imported framework IS a framework.
    origin = Column(String(20), nullable=False, default="catalogue", server_default=text("'catalogue'"))
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





# ── Automated monitoring (FEAT-73) ─────────────────────────────────────
# A connection holds the access to one provider account (an AWS account, a
# GitHub organization) for ONE project: visible, proposed and used there
# only. Its secrets are encrypted (settings_crypto, refused without
# ENCRYPTION_KEY) and never served. No foreign key to measures or proofs:
# a whole-project save deletes and re-inserts those rows.
class CollectionConnection(Base):
    __tablename__ = "collection_connections"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(20), nullable=False)          # aws | github (the catalog's providers)
    label = Column(String(255), nullable=False)
    mode = Column(String(10), nullable=False, default="demo", server_default=text("'demo'"))  # demo | live
    settings = Column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))
    secrets_enc = Column(Text, nullable=False, default="", server_default=text("''"))
    last_test_at = Column(DateTime(timezone=True), nullable=True)
    last_test_ok = Column(Boolean, nullable=True)
    last_test_message = Column(Text, nullable=False, default="", server_default=text("''"))
    missing_permissions = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    created_by = Column(String(255), nullable=False, default="", server_default=text("''"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    __table_args__ = (
        Index("uq_collection_connections_label", "project_id", "provider", "label", unique=True),
    )


# One collector activated on one measure, backed by one collected proof.
# measure_id / proof_id are the module's business ids, without foreign key
# (see above); the recurrence lock of the measure is derived from an active
# monitor. The last_* columns cache the latest version for the status.
class CollectionMonitor(Base):
    __tablename__ = "collection_monitors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id = Column(UUID(as_uuid=True), ForeignKey("collection_connections.id"), nullable=False, index=True)
    measure_id = Column(String(30), nullable=False)
    proof_id = Column(String(30), nullable=False)
    collector_code = Column(String(20), nullable=False)
    params = Column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))
    retention = Column(JSONB, nullable=True)                   # null: the collector's profile
    active = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    activated_by = Column(String(255), nullable=False, default="", server_default=text("''"))
    activated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    deactivated_by = Column(String(255), nullable=False, default="", server_default=text("''"))
    deactivated_at = Column(DateTime(timezone=True), nullable=True)
    deactivation_reason = Column(Text, nullable=False, default="", server_default=text("''"))
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    last_version_id = Column(UUID(as_uuid=True), nullable=True)
    last_result = Column(String(20), nullable=True)
    last_collected_at = Column(DateTime(timezone=True), nullable=True)
    state_since = Column(DateTime(timezone=True), nullable=True)
    error_since = Column(DateTime(timezone=True), nullable=True)    # first of the errors in a row
    alerted_at = Column(DateTime(timezone=True), nullable=True)     # the alert of the current error streak
    __table_args__ = (
        Index("uq_collection_monitors_active", "project_id", "measure_id", "collector_code", "connection_id",
              unique=True, postgresql_where=text("active"), sqlite_where=text("active")),
    )


# A dated version of a collected proof. Immutable but for the purge, which
# empties the detail and the raw data of a version its retention no longer
# keeps and leaves its result, counts, dates and fingerprint.
class CollectionVersion(Base):
    __tablename__ = "collection_versions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    monitor_id = Column(UUID(as_uuid=True), ForeignKey("collection_monitors.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    seq = Column(Integer, nullable=False)
    collected_at = Column(DateTime(timezone=True), nullable=False)
    data_as_of = Column(DateTime(timezone=True), nullable=True)
    trigger = Column(String(20), nullable=False, default="schedule")   # activation | schedule | manual
    collector_code = Column(String(20), nullable=False)
    collector_version = Column(Integer, nullable=False)
    rule_text = Column(Text, nullable=False, default="")
    connection_label = Column(String(255), nullable=False, default="")
    result = Column(String(20), nullable=False)                         # conforme | non_conforme | erreur | sans_objet
    reason = Column(Text, nullable=True)
    missing_permission = Column(String(200), nullable=True)
    partial = Column(Boolean, nullable=False, default=False)
    evaluated = Column(Integer, nullable=False, default=0)
    n_findings = Column(Integer, nullable=False, default=0)
    n_excluded = Column(Integer, nullable=False, default=0)
    n_unreadable = Column(Integer, nullable=False, default=0)
    scope = Column(JSONB, nullable=True)
    findings = Column(JSONB, nullable=True)
    excluded = Column(JSONB, nullable=True)
    unreadable = Column(JSONB, nullable=True)
    raw = Column(JSONB, nullable=True)
    raw_sha256 = Column(String(64), nullable=False)
    result_changed = Column(Boolean, nullable=False, default=False)
    purged_at = Column(DateTime(timezone=True), nullable=True)
    __table_args__ = (
        Index("uq_collection_versions_seq", "monitor_id", "seq", unique=True),
        Index("ix_collection_versions_monitor_at", "monitor_id", "collected_at"),
    )


# A finding set aside, with a justification: per resource, collector and
# connection, so it survives a deactivation. A temporary one takes effect
# through an approved derogation of the FEAT-45 register.
class CollectionExclusion(Base):
    __tablename__ = "collection_exclusions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id = Column(UUID(as_uuid=True), ForeignKey("collection_connections.id", ondelete="CASCADE"), nullable=False)
    collector_code = Column(String(20), nullable=False)
    resource = Column(Text, nullable=False)
    resource_hash = Column(String(64), nullable=False)
    justification = Column(Text, nullable=False)
    kind = Column(String(20), nullable=False, default="permanent")        # permanent | temporary
    derogation_id = Column(UUID(as_uuid=True), nullable=True)
    created_by = Column(String(255), nullable=False, default="", server_default=text("''"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    revoked_by = Column(String(255), nullable=False, default="", server_default=text("''"))
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(Text, nullable=False, default="", server_default=text("''"))
    __table_args__ = (
        Index("uq_collection_exclusions_live", "connection_id", "collector_code", "resource_hash",
              unique=True, postgresql_where=text("revoked_at IS NULL"), sqlite_where=text("revoked_at IS NULL")),
    )


# A suggested link between a collector and a requirement, deduced from the
# mappings to ISO, confirmed or rejected by the project (FEAT-73): confirmed,
# it counts as the collector's own; rejected, it is no longer proposed.
class CollectionSuggestionDecision(Base):
    __tablename__ = "collection_suggestion_decisions"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    collector_code = Column(String(20), primary_key=True)
    requirement_key = Column(String(120), primary_key=True)      # <framework>:<ref>
    decision = Column(String(20), nullable=False)               # confirmed | rejected
    decided_by = Column(String(255), nullable=False, default="", server_default=text("''"))
    decided_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))


# The users of one project (FEAT-74), with the fields of Pilot's directory
# (nom, prenom, email, statut recrutement | actif | inactif, type de contrat
# interne | externe | alternant | stagiaire) so that a sync maps
# them one to one, and their accounts as in Access: a perimeter (GitHub, an
# application…), an account name on it and an optional role. GH-04 reads the
# accounts on the GitHub perimeter. Entered by hand or imported from a CSV
# file; the email is the key, unique within the project. `sync_source` says
# where the identity comes from: "" (entered here) or "pilot".
class SiUser(Base):
    __tablename__ = "si_users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False)                 # lower case
    nom = Column(String(255), nullable=False, default="", server_default=text("''"))
    prenom = Column(String(255), nullable=False, default="", server_default=text("''"))
    statut = Column(String(20), nullable=False, default="actif", server_default=text("'actif'"))  # recrutement | actif | inactif
    type_contrat = Column(String(20), nullable=False, default="interne", server_default=text("'interne'"))  # interne | externe | alternant | stagiaire
    date_depart = Column(String(10), nullable=True)             # ISO date, when inactif
    comptes = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))  # [{perimetre, compte, role}]
    sync_source = Column(String(20), nullable=False, default="", server_default=text("''"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    __table_args__ = (
        Index("uq_si_users_email", "project_id", "email", unique=True),
    )


# ── Append-only server-side write journal (FEAT-30 P1.6) ──────────────
# Created by Base.metadata.create_all at startup (no migration needed for
# a new table). Written via src.audit.log_write — see audit_common.
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


# FEAT-45 — declared non-conformities and derogations (shared mechanics).
from src.nonconformity_common import define_models as _define_nc_models  # noqa: E402

Nonconformity, Derogation = _define_nc_models(Base)
