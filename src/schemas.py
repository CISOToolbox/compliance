from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ── User schemas ──────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    picture: str | None
    provider: str
    role: str
    ai_enabled: str
    created_at: datetime
    last_login: datetime | None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    role: str | None = None
    ai_enabled: str | None = None


class ShareRequest(BaseModel):
    email: str
    permissions: list[str] = ["read"]


# ── Project schemas ──────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str = ""
    organization: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    name: str | None = None
    organization: str | None = None
    data: dict[str, Any] | None = None
    # FEAT-33 — server_rev seen at load time; the blob PUT is refused (409)
    # when the server wrote since (stale-tab guard).
    expected_server_rev: int | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    organization: str | None
    owner_id: uuid.UUID | None
    shared_with: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    server_rev: int = 0
    data: dict[str, Any]

    model_config = {"from_attributes": True}


class ProjectListItem(BaseModel):
    id: uuid.UUID
    name: str
    organization: str | None
    owner_id: uuid.UUID | None
    shared_with: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── AI schemas ───────────────────────────────────────────────────

class AICompleteRequest(BaseModel):
    system: str
    user: str
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-6"


class AICompleteResponse(BaseModel):
    text: str


class AIConfigResponse(BaseModel):
    anthropic_configured: bool
    openai_configured: bool
    gemini_configured: bool = False
    providers: dict[str, dict[str, Any]]


class AIRuntimeResponse(BaseModel):
    managed: bool
    can_use: bool
    provider: str
    model: str
    anthropic_configured: bool
    openai_configured: bool
    gemini_configured: bool = False
    custom_configured: bool = False


# ── Project stats ────────────────────────────────────────────────

class ProjectStats(BaseModel):
    total_controls: int
    total_measures: int
    total_proofs: int
    compliance_rate: float | None
    measures_progress: float | None


# ── Project Meta ─────────────────────────────────────────────────

class ProjectMetaCreate(BaseModel):
    societe: str = ""
    date_evaluation: str = ""
    evaluateur: str = ""
    perimetre: str = ""
    commentaires: str = ""


class ProjectMetaResponse(BaseModel):
    project_id: uuid.UUID
    societe: str | None
    date_evaluation: str | None
    evaluateur: str | None
    perimetre: str | None
    commentaires: str | None

    model_config = {"from_attributes": True}


# ── Project Control ──────────────────────────────────────────────

class ControlCreate(BaseModel):
    framework_id: str
    ref: str = ""
    thematique: str = ""
    mesure: str = ""
    applicable: str = ""
    conformite: str = ""
    ecart: str = ""
    mesures_prevues: str = ""
    mesures_ids: list[str] = Field(default_factory=list)
    thematique_en: str = ""
    mesure_en: str = ""
    sort_order: int = 0


class ControlUpdate(BaseModel):
    framework_id: str | None = None
    ref: str | None = None
    thematique: str | None = None
    mesure: str | None = None
    applicable: str | None = None
    conformite: str | None = None
    ecart: str | None = None
    mesures_prevues: str | None = None
    mesures_ids: list[str] | None = None
    thematique_en: str | None = None
    mesure_en: str | None = None
    sort_order: int | None = None


class ControlResponse(BaseModel):
    id: int
    project_id: uuid.UUID
    sort_order: int
    framework_id: str
    ref: str | None
    thematique: str | None
    mesure: str | None
    applicable: str | None
    conformite: str | None
    ecart: str | None
    mesures_prevues: str | None
    mesures_ids: list[Any]
    thematique_en: str | None
    mesure_en: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Project Measure ──────────────────────────────────────────────

# XSS-02: recurrence is interpolated into an i18n key client-side (_recLabel) —
# whitelist the values actually used by the frontend select (Compliance_app.ts).
# MeasureResponse keeps a plain str so rows already stored with other values
# (e.g. via project import) are still returned; only new writes are constrained.
RecurrenceValue = Literal["", "ponctuel", "mensuelle", "trimestrielle", "semestrielle", "annuelle"]


class MeasureCreate(BaseModel):
    id: str
    description: str = ""
    details: str = ""
    statut: str = ""
    date_cible: str = ""
    responsable: str = ""
    recurrence: RecurrenceValue = ""
    dernier_controle: str = ""
    preuves_ids: list[str] = Field(default_factory=list)
    progress_log: list[Any] = Field(default_factory=list)
    sort_order: int = 0


class MeasureUpdate(BaseModel):
    description: str | None = None
    details: str | None = None
    statut: str | None = None
    date_cible: str | None = None
    responsable: str | None = None
    recurrence: RecurrenceValue | None = None
    dernier_controle: str | None = None
    preuves_ids: list[str] | None = None
    progress_log: list[Any] | None = None
    sort_order: int | None = None


class MeasureResponse(BaseModel):
    id: str
    project_id: uuid.UUID
    sort_order: int
    description: str | None
    details: str | None
    statut: str
    date_cible: str | None
    responsable: str | None
    recurrence: str | None
    dernier_controle: str | None
    preuves_ids: list[Any]
    progress_log: list[Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Project Proof ────────────────────────────────────────────────

class ProofCreate(BaseModel):
    id: str
    label: str = ""
    url: str = ""
    date_obtention: str = ""
    date_expiration: str = ""
    commentaire: str = ""
    sort_order: int = 0
    # FEAT-08 evidence fields
    kind: str = "link"
    file_ref: str = ""
    owner: str = ""
    tags: list = []


class ProofUpdate(BaseModel):
    label: str | None = None
    url: str | None = None
    date_obtention: str | None = None
    date_expiration: str | None = None
    commentaire: str | None = None
    sort_order: int | None = None
    kind: str | None = None
    file_ref: str | None = None
    owner: str | None = None
    tags: list | None = None


class ProofResponse(BaseModel):
    id: str
    project_id: uuid.UUID
    sort_order: int
    label: str | None
    url: str | None
    date_obtention: str | None
    date_expiration: str | None
    commentaire: str | None
    kind: str | None = "link"
    file_ref: str | None = ""
    owner: str | None = ""
    tags: list = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
