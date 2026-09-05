// ─────────────────────────────────────────────────────────────────────────
// Catalog of granular security measures.
//
// ATOMIC measures (each a concrete, verifiable action), written
// in-house, inspired by the "key reference controls" taxonomy (category ×
// csf_function + expected proofs) with NO verbatim reuse of third-party content.
//
// Each measure declares framework_refs = { fwId: [refs] }: the requirements
// it covers, per framework. The same measure is thus REUSED across
// several frameworks. Pass 1: ISO 27001:2022 refs (coverage 123/123).
// Pass 2: adding nis2 / secnumcloud / dora / … refs (reuse).
//
// Loaded on demand by _ensureReferenceControls() (js/Compliance_reference_controls.js).
// ─────────────────────────────────────────────────────────────────────────
window.COMPLIANCE_REFERENCE_CONTROLS = [
    {
        "id": "MS.CONTEXT.FACTORS",
        "category": "process",
        "csf_function": "identify",
        "name": "Analyse des enjeux internes et externes",
        "name_en": "Analysis of internal and external issues",
        "description": "Recenser et tenir à jour les enjeux internes et externes (réglementaires, technologiques, contractuels, organisationnels) susceptibles d'affecter l'atteinte des objectifs du SMSI.",
        "description_en": "Identify and maintain the internal and external issues (regulatory, technological, contractual, organizational) that may affect achievement of the ISMS objectives.",
        "typical_evidence": [
            "Analyse de contexte / matrice PESTEL ou SWOT datée"
        ],
        "typical_evidence_en": [
            "Context analysis / dated PESTEL or SWOT matrix"
        ],
        "framework_refs": {
            "iso": [
                "4.1"
            ],
            "soc2": [
                "CC3.2.2",
                "CC3.4.1",
                "CC3.4.2",
                "CC3.4.3"
            ],
            "hds": [
                "EXI-02"
            ],
            "nis2": [
                "21.1.sp2"
            ]
        }
    },
    {
        "id": "MS.CONTEXT.STAKEHOLDERS",
        "category": "process",
        "csf_function": "identify",
        "name": "Registre des parties intéressées et de leurs exigences",
        "name_en": "Register of interested parties and their requirements",
        "description": "Tenir un registre des parties intéressées pertinentes pour le SMSI, précisant leurs besoins, attentes et exigences légales ou contractuelles à prendre en compte.",
        "description_en": "Maintain a register of parties relevant to the ISMS, stating their needs, expectations and the legal or contractual requirements to be taken into account.",
        "typical_evidence": [
            "Registre des parties intéressées et exigences associées"
        ],
        "typical_evidence_en": [
            "Interested-parties register with associated requirements"
        ],
        "framework_refs": {
            "iso": [
                "4.2"
            ],
            "soc2": [
                "CC1.3.5",
                "CC2.3.1"
            ],
            "hds": [
                "EXI-03"
            ]
        }
    },
    {
        "id": "MS.SCOPE.STATEMENT",
        "category": "policy",
        "csf_function": "govern",
        "name": "Déclaration du domaine d'application du SMSI",
        "name_en": "ISMS scope statement",
        "description": "Formaliser et faire approuver une déclaration de périmètre du SMSI précisant les sites, activités, actifs et technologies inclus et exclus, avec justification des exclusions.",
        "description_en": "Formalize and approve an ISMS scope statement listing the sites, activities, assets and technologies included and excluded, with justification of exclusions.",
        "typical_evidence": [
            "Document de périmètre du SMSI approuvé"
        ],
        "typical_evidence_en": [
            "Approved ISMS scope document"
        ],
        "framework_refs": {
            "iso": [
                "4.3"
            ],
            "soc2": [
                "CC1.3.1",
                "CC2.2.11",
                "CC2.3.9"
            ],
            "recyf": [
                "1.1",
                "1.2",
                "1.3"
            ],
            "hds": [
                "EXI-01.b",
                "EXI-04"
            ]
        }
    },
    {
        "id": "MS.SCOPE.INTERFACES",
        "category": "process",
        "csf_function": "identify",
        "name": "Identification des interfaces et dépendances du périmètre",
        "name_en": "Identification of scope interfaces and dependencies",
        "description": "Cartographier les interfaces et dépendances entre le périmètre du SMSI et les activités, prestataires ou entités externes afin de délimiter clairement les responsabilités.",
        "description_en": "Map the interfaces and dependencies between the ISMS scope and external activities, providers or entities to clearly delimit responsibilities.",
        "typical_evidence": [
            "Cartographie des interfaces et dépendances"
        ],
        "typical_evidence_en": [
            "Map of interfaces and dependencies"
        ],
        "framework_refs": {
            "iso": [
                "4.3"
            ],
            "soc2": [
                "CC2.1.5",
                "CC2.2.11"
            ],
            "recyf": [
                "1.2",
                "3.A.1",
                "3.A.2",
                "5.A.1",
                "7.A.1",
                "7.A.7",
                "7.B.1"
            ],
            "secnumcloud": [
                "13.1.a",
                "13.1.b"
            ],
            "hds": [
                "EXI-01.b",
                "EXI-13"
            ],
            "lpm": [
                "3.4",
                "3.5",
                "16.4"
            ]
        }
    },
    {
        "id": "MS.ISMS.ESTABLISH",
        "category": "process",
        "csf_function": "govern",
        "name": "Établissement et maintien du SMSI",
        "name_en": "Establishment and maintenance of the ISMS",
        "description": "Établir, documenter et maintenir les processus du SMSI et leurs interactions afin de gérer les risques de sécurité et d'en assurer l'amélioration continue.",
        "description_en": "Establish, document and maintain the ISMS processes and their interactions to manage security risks and ensure continual improvement.",
        "typical_evidence": [
            "Cartographie des processus du SMSI",
            "Manuel du SMSI"
        ],
        "typical_evidence_en": [
            "ISMS process map",
            "ISMS manual"
        ],
        "framework_refs": {
            "iso": [
                "4.4"
            ],
            "soc2": [
                "CC1.3.1",
                "CC3.1.1"
            ],
            "recyf": [
                "1.3",
                "2.A.3"
            ],
            "secnumcloud": [
                "6.1.a"
            ],
            "cra": [
                "8.1.1",
                "8.4.1",
                "8.4.2",
                "8.4.3.1.3",
                "8.4.3.2",
                "8.4.3.4",
                "8.4.4.2.1"
            ],
            "hds": [
                "EXI-01.a"
            ],
            "nis2": [
                "21.1"
            ],
            "dora": [
                "DORA-6",
                "DORA-16"
            ]
        }
    },
    {
        "id": "MS.LEADERSHIP.COMMITMENT",
        "category": "process",
        "csf_function": "govern",
        "name": "Engagement de la direction envers le SMSI",
        "name_en": "Top management commitment to the ISMS",
        "description": "Démontrer l'engagement de la direction en approuvant les orientations du SMSI, en l'intégrant aux processus métier et en soutenant activement la culture de sécurité.",
        "description_en": "Demonstrate management commitment by approving ISMS direction, integrating it into business processes and actively supporting the security culture.",
        "typical_evidence": [
            "Compte rendu de direction validant les orientations SMSI"
        ],
        "typical_evidence_en": [
            "Management minutes endorsing ISMS direction"
        ],
        "framework_refs": {
            "iso": [
                "5.1"
            ],
            "soc2": [
                "CC1.1.1",
                "CC1.2.1",
                "CC1.2.3",
                "CC1.5.4"
            ],
            "recyf": [
                "2.A.1",
                "2.B.2",
                "16.1"
            ],
            "secnumcloud": [
                "5.2.d",
                "5.3.g"
            ],
            "cra": [
                "8.4.3.2.1"
            ],
            "hds": [
                "EXI-01.a"
            ],
            "nis2": [
                "21.1"
            ],
            "dora": [
                "DORA-5"
            ]
        }
    },
    {
        "id": "MS.POLICY.ESTABLISH",
        "category": "policy",
        "csf_function": "govern",
        "name": "Établissement de la politique de sécurité de l'information",
        "name_en": "Establishment of the information security policy",
        "description": "Rédiger et faire approuver par la direction une politique de sécurité de l'information fixant les engagements de conformité et d'amélioration continue et le cadre des objectifs.",
        "description_en": "Draft and obtain management approval of an information security policy stating the commitments to compliance and continual improvement and the framework for objectives.",
        "typical_evidence": [
            "Politique de sécurité approuvée et datée"
        ],
        "typical_evidence_en": [
            "Approved and dated security policy"
        ],
        "framework_refs": {
            "iso": [
                "5.2"
            ],
            "recyf": [
                "2.B.1",
                "2.B.2",
                "2.B.3",
                "2.B.4"
            ],
            "secnumcloud": [
                "5.2.a",
                "5.2.b",
                "5.2.c",
                "5.2.d",
                "5.2.e"
            ],
            "hds": [
                "EXI-01.a"
            ],
            "lpm": [
                "1.1",
                "1.2",
                "1.3"
            ],
            "loi0520": [
                "ART-4",
                "ART-14"
            ],
            "nis2": [
                "21.2.a"
            ]
        }
    },
    {
        "id": "MS.POLICY.COMMUNICATE",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Diffusion et disponibilité de la politique",
        "name_en": "Communication and availability of the policy",
        "description": "Diffuser la politique de sécurité aux personnels concernés et la rendre disponible aux parties intéressées pertinentes, avec preuve de sa prise de connaissance.",
        "description_en": "Distribute the security policy to relevant staff and make it available to relevant interested parties, with evidence of acknowledgement.",
        "typical_evidence": [
            "Preuve de diffusion / accusés de lecture"
        ],
        "typical_evidence_en": [
            "Distribution evidence / read receipts"
        ],
        "framework_refs": {
            "iso": [
                "5.2"
            ],
            "soc2": [
                "CC2.2.1",
                "CC2.2.5"
            ],
            "secnumcloud": [
                "5.2.a"
            ]
        }
    },
    {
        "id": "MS.ROLES.ASSIGN",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Attribution et communication des rôles et responsabilités",
        "name_en": "Assignment and communication of roles and responsibilities",
        "description": "Définir, attribuer et communiquer les rôles, responsabilités et autorités liés au SMSI, y compris via une matrice de type RACI tenue à jour.",
        "description_en": "Define, assign and communicate the ISMS-related roles, responsibilities and authorities, including through a maintained RACI-type matrix.",
        "typical_evidence": [
            "Matrice RACI / fiches de rôles SMSI"
        ],
        "typical_evidence_en": [
            "RACI matrix / ISMS role descriptions"
        ],
        "framework_refs": {
            "iso": [
                "5.3"
            ],
            "soc2": [
                "CC1.3.2",
                "CC1.3.3",
                "CC1.3.4",
                "CC1.5.1",
                "CC2.2.5",
                "CC5.3.2"
            ],
            "recyf": [
                "2.A.3"
            ],
            "secnumcloud": [
                "6.1.a",
                "6.1.b",
                "6.1.c",
                "6.1.d"
            ],
            "hds": [
                "EXI-13"
            ],
            "lpm": [
                "1.4"
            ],
            "loi0520": [
                "ART-6"
            ],
            "dora": [
                "DORA-5"
            ]
        }
    },
    {
        "id": "MS.RISKOPP.DETERMINE",
        "category": "process",
        "csf_function": "identify",
        "name": "Détermination des risques et opportunités",
        "name_en": "Determination of risks and opportunities",
        "description": "Établir un processus déterminant les risques et opportunités à traiter à partir du contexte et des exigences des parties intéressées, afin d'assurer les résultats attendus du SMSI.",
        "description_en": "Establish a process that determines the risks and opportunities to be addressed from the context and interested-party requirements, to ensure the ISMS intended outcomes.",
        "typical_evidence": [
            "Registre des risques et opportunités"
        ],
        "typical_evidence_en": [
            "Risks and opportunities register"
        ],
        "framework_refs": {
            "iso": [
                "6.1.1"
            ],
            "soc2": [
                "CC3.1.2",
                "CC3.1.16",
                "CC3.2.3"
            ],
            "recyf": [
                "16.1"
            ],
            "secnumcloud": [
                "5.3.a",
                "5.3.b",
                "5.3.h"
            ],
            "nis2": [
                "21.1",
                "21.1.sp2",
                "21.2.a"
            ]
        }
    },
    {
        "id": "MS.RISK.CRITERIA",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Définition des critères d'appréciation et d'acceptation des risques",
        "name_en": "Definition of risk assessment and acceptance criteria",
        "description": "Définir les critères d'appréciation des risques et les critères d'acceptation permettant d'obtenir des résultats cohérents, valides et comparables dans le temps.",
        "description_en": "Define the risk assessment criteria and the acceptance criteria that produce consistent, valid and comparable results over time.",
        "typical_evidence": [
            "Critères d'appréciation et d'acceptation documentés"
        ],
        "typical_evidence_en": [
            "Documented assessment and acceptance criteria"
        ],
        "framework_refs": {
            "iso": [
                "6.1.2"
            ],
            "soc2": [
                "CC3.1.2",
                "CC3.1.6",
                "CC3.1.15"
            ],
            "recyf": [
                "16.1",
                "16.4"
            ],
            "secnumcloud": [
                "5.3.b"
            ],
            "anssi": [
                "41.R"
            ],
            "lpm": [
                "2.2",
                "2.8",
                "2.11"
            ],
            "nis2": [
                "21.1.sp2",
                "21.2.a"
            ]
        }
    },
    {
        "id": "MS.RISK.METHOD",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Méthode d'appréciation des risques CIA",
        "name_en": "CIA risk assessment method",
        "description": "Documenter une méthode d'appréciation des risques évaluant les atteintes à la confidentialité, l'intégrité et la disponibilité et estimant vraisemblance et impact.",
        "description_en": "Document a risk assessment method that evaluates breaches of confidentiality, integrity and availability and estimates likelihood and impact.",
        "typical_evidence": [
            "Procédure méthodologique d'appréciation des risques"
        ],
        "typical_evidence_en": [
            "Risk assessment methodology procedure"
        ],
        "framework_refs": {
            "iso": [
                "6.1.2"
            ],
            "soc2": [
                "CC3.1.16",
                "CC3.2.1",
                "CC3.2.4",
                "CC3.2.8"
            ],
            "recyf": [
                "16.2"
            ],
            "secnumcloud": [
                "5.3.a",
                "5.3.b",
                "5.3.c",
                "5.3.h",
                "6.1.h",
                "6.5.a"
            ],
            "cra": [
                "7.3"
            ],
            "hds": [
                "EXI-30.c"
            ],
            "anssi": [
                "41.R"
            ],
            "lpm": [
                "2.8"
            ],
            "nis2": [
                "21.1.sp2",
                "21.2",
                "21.2.a"
            ],
            "dora": [
                "DORA-6"
            ]
        }
    },
    {
        "id": "MS.RISK.TREATMENT.PLAN",
        "category": "process",
        "csf_function": "protect",
        "name": "Plan de traitement des risques",
        "name_en": "Risk treatment plan",
        "description": "Sélectionner les options et mesures de traitement des risques et les consigner dans un plan de traitement approuvé par les propriétaires de risques.",
        "description_en": "Select the risk treatment options and controls and record them in a treatment plan approved by the risk owners.",
        "typical_evidence": [
            "Plan de traitement des risques approuvé"
        ],
        "typical_evidence_en": [
            "Approved risk treatment plan"
        ],
        "framework_refs": {
            "iso": [
                "6.1.3"
            ],
            "soc2": [
                "CC3.2.5",
                "CC5.1.1",
                "CC5.1.2",
                "CC5.1.3",
                "CC5.1.4"
            ],
            "recyf": [
                "16.3"
            ],
            "secnumcloud": [
                "5.3.d",
                "5.3.g"
            ],
            "hds": [
                "EXI-30.b",
                "EXI-30.c"
            ],
            "lpm": [
                "2.1",
                "2.2",
                "2.7",
                "2.9",
                "2.11",
                "4.7",
                "11.2",
                "12.10",
                "14.6"
            ],
            "loi0520": [
                "ART-4",
                "ART-24",
                "ART-32"
            ],
            "nis2": [
                "21.1"
            ],
            "dora": [
                "DORA-6"
            ]
        }
    },
    {
        "id": "MS.RISK.SOA",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Déclaration d'applicabilité",
        "name_en": "Statement of Applicability",
        "description": "Établir et maintenir une déclaration d'applicabilité justifiant l'inclusion ou l'exclusion des mesures et leur état de mise en œuvre.",
        "description_en": "Establish and maintain a Statement of Applicability justifying the inclusion or exclusion of controls and their implementation status.",
        "typical_evidence": [
            "Déclaration d'applicabilité versionnée"
        ],
        "typical_evidence_en": [
            "Versioned Statement of Applicability"
        ],
        "framework_refs": {
            "iso": [
                "6.1.3"
            ],
            "soc2": [
                "CC3.1.8",
                "CC4.1.3",
                "CC5.1.2",
                "CC5.1.4"
            ],
            "recyf": [
                "1.2",
                "2.C.1",
                "2.C.3"
            ],
            "secnumcloud": [
                "5.3.g"
            ],
            "hds": [
                "EXI-01.a",
                "EXI-08"
            ],
            "lpm": [
                "1.7",
                "2.1",
                "2.2",
                "2.7",
                "2.9",
                "11.3",
                "12.10",
                "16.5",
                "17.7"
            ],
            "loi0520": [
                "ART-19"
            ]
        }
    },
    {
        "id": "MS.OBJECTIVES.SET",
        "category": "process",
        "csf_function": "govern",
        "name": "Objectifs de sécurité mesurables",
        "name_en": "Measurable security objectives",
        "description": "Fixer des objectifs de sécurité de l'information mesurables, cohérents avec la politique, et suivre périodiquement leur atteinte.",
        "description_en": "Set measurable information security objectives aligned with the policy and periodically track their achievement.",
        "typical_evidence": [
            "Tableau des objectifs et cibles"
        ],
        "typical_evidence_en": [
            "Objectives and targets table"
        ],
        "framework_refs": {
            "iso": [
                "6.2"
            ],
            "soc2": [
                "CC1.5.2",
                "CC1.5.3",
                "CC2.2.7",
                "CC2.2.12",
                "CC2.3.10",
                "CC3.1.1",
                "CC3.1.3",
                "CC3.1.14",
                "CC3.1.16"
            ],
            "cra": [
                "8.4.3.2.1"
            ],
            "hds": [
                "EXI-09"
            ],
            "lpm": [
                "1.3",
                "20.1"
            ]
        }
    },
    {
        "id": "MS.OBJECTIVES.PLAN",
        "category": "process",
        "csf_function": "govern",
        "name": "Plans d'action pour atteindre les objectifs",
        "name_en": "Action plans to achieve objectives",
        "description": "Établir pour chaque objectif un plan d'action précisant les activités, ressources, responsables, échéances et méthodes d'évaluation des résultats.",
        "description_en": "For each objective, establish an action plan stating the activities, resources, responsibilities, deadlines and methods to evaluate results.",
        "typical_evidence": [
            "Plans d'action liés aux objectifs"
        ],
        "typical_evidence_en": [
            "Action plans linked to objectives"
        ],
        "framework_refs": {
            "iso": [
                "6.2"
            ],
            "soc2": [
                "CC3.1.3",
                "CC3.1.4"
            ],
            "recyf": [
                "2.C.2",
                "16.3",
                "17.5"
            ]
        }
    },
    {
        "id": "MS.CHANGE.PLANNING",
        "category": "process",
        "csf_function": "protect",
        "name": "Planification des modifications du SMSI",
        "name_en": "Planning of changes to the ISMS",
        "description": "Planifier de manière maîtrisée les modifications du SMSI en évaluant leur objet, leurs conséquences sur la sécurité, les ressources et les responsabilités affectées.",
        "description_en": "Plan ISMS changes in a controlled manner by assessing their purpose, consequences on security, resources and the responsibilities affected.",
        "typical_evidence": [
            "Fiches de changement du SMSI"
        ],
        "typical_evidence_en": [
            "ISMS change records"
        ],
        "framework_refs": {
            "iso": [
                "6.3"
            ],
            "soc2": [
                "CC2.2.13",
                "CC3.4.2",
                "CC3.4.3",
                "CC3.4.4"
            ],
            "secnumcloud": [
                "6.1.d",
                "17.1.b"
            ],
            "cra": [
                "2.8.b",
                "8.2.c",
                "8.4.3.5"
            ],
            "lpm": [
                "2.12"
            ]
        }
    },
    {
        "id": "MS.RESOURCES.PROVISION",
        "category": "process",
        "csf_function": "govern",
        "name": "Allocation des ressources du SMSI",
        "name_en": "Provision of ISMS resources",
        "description": "Déterminer et fournir les ressources humaines, techniques et financières nécessaires à l'établissement, au fonctionnement et à l'amélioration du SMSI.",
        "description_en": "Determine and provide the human, technical and financial resources needed to establish, operate and improve the ISMS.",
        "typical_evidence": [
            "Budget et plan de ressources du SMSI"
        ],
        "typical_evidence_en": [
            "ISMS budget and resource plan"
        ],
        "framework_refs": {
            "iso": [
                "7.1"
            ],
            "soc2": [
                "CC1.4.4",
                "CC1.5.4",
                "CC3.1.4"
            ]
        }
    },
    {
        "id": "MS.COMPETENCE",
        "category": "training",
        "csf_function": "protect",
        "name": "Gestion des compétences des acteurs du SMSI",
        "name_en": "Competence management for ISMS actors",
        "description": "Déterminer les compétences requises pour les rôles affectant la sécurité, combler les écarts par formation ou recrutement et conserver les preuves de compétence.",
        "description_en": "Determine the competencies required for security-affecting roles, close gaps through training or recruitment and retain competence evidence.",
        "typical_evidence": [
            "Matrice de compétences",
            "Attestations de formation"
        ],
        "typical_evidence_en": [
            "Competence matrix",
            "Training certificates"
        ],
        "framework_refs": {
            "iso": [
                "7.2"
            ],
            "soc2": [
                "CC1.2.2",
                "CC1.2.4",
                "CC1.4.1",
                "CC1.4.2",
                "CC1.4.3",
                "CC1.4.4",
                "CC1.4.6",
                "CC1.4.7",
                "CC4.1.4",
                "CC5.3.5"
            ],
            "recyf": [
                "4.5"
            ],
            "secnumcloud": [
                "7.3.b",
                "7.3.c"
            ],
            "cra": [
                "8.4.3.c"
            ],
            "anssi": [
                "1"
            ],
            "lpm": [
                "1.5"
            ],
            "loi0520": [
                "ART-43"
            ],
            "dora": [
                "DORA-27"
            ]
        }
    },
    {
        "id": "MS.AWARENESS",
        "category": "training",
        "csf_function": "protect",
        "name": "Programme de sensibilisation à la sécurité",
        "name_en": "Security awareness program",
        "description": "Sensibiliser régulièrement le personnel à la politique, à son rôle dans la sécurité de l'information et aux conséquences des non-conformités.",
        "description_en": "Regularly raise staff awareness of the policy, their role in information security and the consequences of nonconformities.",
        "typical_evidence": [
            "Supports et registre de participation aux sensibilisations"
        ],
        "typical_evidence_en": [
            "Awareness materials and attendance records"
        ],
        "framework_refs": {
            "iso": [
                "7.3"
            ],
            "soc2": [
                "CC1.4.3",
                "CC2.2.8",
                "CC2.2.9"
            ],
            "recyf": [
                "4.2",
                "15.1"
            ],
            "secnumcloud": [
                "7.3.a"
            ],
            "hds": [
                "EXI-10.a"
            ],
            "anssi": [
                "2"
            ],
            "lpm": [
                "1.5"
            ],
            "loi0520": [
                "ART-44"
            ],
            "nis2": [
                "21.2.g"
            ]
        }
    },
    {
        "id": "MS.COMMUNICATION",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Plan de communication interne et externe",
        "name_en": "Internal and external communication plan",
        "description": "Déterminer les communications internes et externes pertinentes pour le SMSI en précisant sujet, moment, destinataires et moyens.",
        "description_en": "Determine the internal and external communications relevant to the ISMS, specifying topic, timing, recipients and means.",
        "typical_evidence": [
            "Plan de communication du SMSI"
        ],
        "typical_evidence_en": [
            "ISMS communication plan"
        ],
        "framework_refs": {
            "iso": [
                "7.4"
            ],
            "soc2": [
                "CC1.3.2",
                "CC2.1.1",
                "CC2.2.1",
                "CC2.2.2",
                "CC2.2.7",
                "CC2.2.11",
                "CC2.2.12",
                "CC2.2.13",
                "CC2.3.1",
                "CC2.3.2",
                "CC2.3.5",
                "CC2.3.6",
                "CC2.3.9",
                "CC2.3.10",
                "CC2.3.11",
                "P8.1.3"
            ],
            "recyf": [
                "14.9"
            ],
            "secnumcloud": [
                "5.3.e",
                "6.3.a",
                "6.5.b",
                "7.2.d",
                "7.4.b",
                "12.2.b",
                "12.2.c",
                "12.2.d",
                "12.6.d",
                "15.1.b",
                "15.4.b",
                "16.1.b",
                "18.1.d",
                "19.1.e",
                "19.1.m",
                "19.1.o",
                "19.6.f"
            ],
            "cra": [
                "8.2.9",
                "8.2.d",
                "8.2.e",
                "8.4.7",
                "8.4.a"
            ],
            "hds": [
                "EXI-12.a",
                "EXI-12.b",
                "EXI-15.b",
                "EXI-15.d",
                "EXI-29.b",
                "EXI-29.c",
                "EXI-31.a",
                "EXI-31.b",
                "EXI-31.e"
            ],
            "dora": [
                "DORA-14"
            ]
        }
    },
    {
        "id": "MS.DOC.DETERMINE",
        "category": "process",
        "csf_function": "govern",
        "name": "Détermination des informations documentées nécessaires",
        "name_en": "Determination of required documented information",
        "description": "Identifier les informations documentées exigées par la norme et jugées nécessaires à l'efficacité du SMSI et en tenir un inventaire.",
        "description_en": "Identify the documented information required by the standard and deemed necessary for ISMS effectiveness and keep an inventory of it.",
        "typical_evidence": [
            "Inventaire des documents du SMSI"
        ],
        "typical_evidence_en": [
            "ISMS documents inventory"
        ],
        "framework_refs": {
            "iso": [
                "7.5.1"
            ],
            "soc2": [
                "CC2.1.1"
            ],
            "cra": [
                "7.2",
                "7.a",
                "8.1.2",
                "8.2.3.3",
                "8.4.3.1.2"
            ]
        }
    },
    {
        "id": "MS.DOC.CREATE",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Création et mise à jour maîtrisées des documents",
        "name_en": "Controlled creation and update of documents",
        "description": "Assurer une identification, une revue et une approbation appropriées lors de la création et de la mise à jour des documents, avec gestion des versions.",
        "description_en": "Ensure appropriate identification, review and approval when creating and updating documents, with version management.",
        "typical_evidence": [
            "Documents avec référence, version et approbation"
        ],
        "typical_evidence_en": [
            "Documents bearing reference, version and approval"
        ],
        "framework_refs": {
            "iso": [
                "7.5.2"
            ],
            "cra": [
                "2.1",
                "2.3",
                "2.4",
                "2.5",
                "2.6",
                "2.7",
                "2.8",
                "5.1",
                "5.3",
                "5.4",
                "5.5",
                "5.8",
                "6.a",
                "6.b",
                "7.1",
                "7.1.a",
                "7.1.c",
                "7.2",
                "7.4",
                "7.7",
                "7.a",
                "8.1.2",
                "8.1.4.1",
                "8.1.4.2",
                "8.2.3",
                "8.2.3.3",
                "8.2.3.4",
                "8.2.5",
                "8.2.a",
                "8.3.3.1",
                "8.3.3.2",
                "8.4.3.1",
                "8.4.3.1.2",
                "8.4.3.1.3",
                "8.4.3.a",
                "8.4.3.e",
                "8.4.5.1",
                "8.4.5.2"
            ],
            "hds": [
                "EXI-29.c"
            ],
            "lpm": [
                "1.14"
            ]
        }
    },
    {
        "id": "MS.DOC.CONTROL",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Contrôle et protection des informations documentées",
        "name_en": "Control and protection of documented information",
        "description": "Maîtriser la distribution, l'accès, le stockage, la conservation et l'élimination des documents afin d'en garantir la disponibilité et de les protéger.",
        "description_en": "Control the distribution, access, storage, retention and disposal of documents to ensure their availability and protect them.",
        "typical_evidence": [
            "Règles d'accès et de conservation documentaire"
        ],
        "typical_evidence_en": [
            "Document access and retention rules"
        ],
        "framework_refs": {
            "iso": [
                "7.5.3"
            ],
            "soc2": [
                "CC2.1.4",
                "CC2.1.8"
            ],
            "secnumcloud": [
                "12.1.a",
                "18.1.d"
            ],
            "cra": [
                "2.1",
                "2.6",
                "5.4",
                "5.8",
                "6.b",
                "7.7",
                "7.a",
                "8.1.2",
                "8.1.4.2",
                "8.2.3.3",
                "8.2.10",
                "8.2.a",
                "8.2.e",
                "8.3.3.2",
                "8.4.3.2.7",
                "8.4.3.a",
                "8.4.4.2.1",
                "8.4.4.2.2",
                "8.4.4.2.3",
                "8.4.5.2",
                "8.4.5.a",
                "8.4.6",
                "8.4.6.1",
                "8.4.6.2",
                "8.4.6.3",
                "8.4.6.4"
            ],
            "hds": [
                "EXI-08",
                "EXI-12.a",
                "EXI-15.d",
                "EXI-31.e"
            ],
            "lpm": [
                "1.14",
                "2.10",
                "2.13",
                "3.10",
                "20.15"
            ],
            "loi0520": [
                "ART-22"
            ]
        }
    },
    {
        "id": "MS.OPS.PLANNING",
        "category": "process",
        "csf_function": "protect",
        "name": "Planification et maîtrise opérationnelles",
        "name_en": "Operational planning and control",
        "description": "Planifier, mettre en œuvre et maîtriser les processus opérationnels du SMSI, y compris les processus externalisés, selon des critères définis.",
        "description_en": "Plan, implement and control the ISMS operational processes, including outsourced processes, against defined criteria.",
        "typical_evidence": [
            "Procédures opérationnelles et critères de maîtrise"
        ],
        "typical_evidence_en": [
            "Operational procedures and control criteria"
        ],
        "framework_refs": {
            "iso": [
                "8.1"
            ],
            "soc2": [
                "CC5.1.3",
                "CC5.2.1"
            ],
            "cra": [
                "7.2.c",
                "8.1.1",
                "8.3.1",
                "8.3.2",
                "8.4.1",
                "8.4.3.2.5"
            ]
        }
    },
    {
        "id": "MS.OPS.RISK.ASSESS",
        "category": "process",
        "csf_function": "identify",
        "name": "Réalisation des appréciations de risques",
        "name_en": "Performing risk assessments",
        "description": "Réaliser les appréciations des risques de sécurité aux intervalles planifiés et lors de changements significatifs, et en conserver les résultats.",
        "description_en": "Perform information security risk assessments at planned intervals and upon significant changes, and retain the results.",
        "typical_evidence": [
            "Rapports d'appréciation des risques datés"
        ],
        "typical_evidence_en": [
            "Dated risk assessment reports"
        ],
        "framework_refs": {
            "iso": [
                "8.2"
            ],
            "soc2": [
                "A1.2.1",
                "CC3.2.1",
                "CC3.2.2",
                "CC3.2.3",
                "CC3.2.4",
                "CC3.2.6",
                "CC3.2.8",
                "CC3.3.1",
                "CC3.3.2",
                "CC3.3.3",
                "CC3.3.4",
                "CC3.3.5",
                "CC3.4.4",
                "CC3.4.6"
            ],
            "recyf": [
                "16.2",
                "16.4",
                "17.1"
            ],
            "secnumcloud": [
                "5.3.a",
                "5.3.c",
                "5.3.d",
                "5.3.e",
                "5.3.f",
                "5.3.h",
                "6.2.a",
                "6.5.a",
                "11.4.a",
                "14.4.b"
            ],
            "cra": [
                "2.5",
                "7.3"
            ],
            "hds": [
                "EXI-05.a",
                "EXI-05.b",
                "EXI-30.c"
            ],
            "anssi": [
                "41.R"
            ],
            "lpm": [
                "1.13",
                "2.1",
                "2.8",
                "2.12"
            ],
            "loi0520": [
                "ART-4",
                "ART-14",
                "ART-17",
                "ART-19",
                "ART-32"
            ],
            "nis2": [
                "21.1",
                "21.1.sp2",
                "21.2",
                "21.2.a"
            ],
            "dora": [
                "DORA-8",
                "DORA-16"
            ]
        }
    },
    {
        "id": "MS.OPS.RISK.TREAT",
        "category": "process",
        "csf_function": "protect",
        "name": "Mise en œuvre du traitement des risques",
        "name_en": "Implementation of risk treatment",
        "description": "Mettre en œuvre le plan de traitement des risques et suivre l'avancement des mesures jusqu'à ce que le risque résiduel soit acceptable.",
        "description_en": "Implement the risk treatment plan and track control progress until the residual risk is acceptable.",
        "typical_evidence": [
            "Suivi d'avancement du plan de traitement"
        ],
        "typical_evidence_en": [
            "Treatment plan progress tracking"
        ],
        "framework_refs": {
            "iso": [
                "8.3"
            ],
            "soc2": [
                "CC3.2.5",
                "CC5.1.1"
            ],
            "recyf": [
                "16.3"
            ],
            "secnumcloud": [
                "12.11.b"
            ],
            "loi0520": [
                "ART-24",
                "ART-32"
            ],
            "nis2": [
                "21.1",
                "21.1.sp2"
            ]
        }
    },
    {
        "id": "MS.MONITOR.EVAL",
        "category": "process",
        "csf_function": "detect",
        "name": "Surveillance, mesure et évaluation de la performance",
        "name_en": "Monitoring, measurement and performance evaluation",
        "description": "Déterminer ce qui doit être surveillé et mesuré, les méthodes et les échéances, puis analyser et évaluer la performance et l'efficacité du SMSI.",
        "description_en": "Determine what to monitor and measure, the methods and timing, then analyze and evaluate ISMS performance and effectiveness.",
        "typical_evidence": [
            "Tableau de bord d'indicateurs et rapports d'évaluation"
        ],
        "typical_evidence_en": [
            "Metrics dashboard and evaluation reports"
        ],
        "framework_refs": {
            "iso": [
                "9.1"
            ],
            "soc2": [
                "CC1.4.2",
                "CC1.5.2",
                "CC1.5.3",
                "CC1.5.5",
                "CC3.1.11",
                "CC4.1.1",
                "CC4.1.2",
                "CC4.1.3",
                "CC4.1.5",
                "CC4.2.1",
                "CC7.2.4",
                "P8.1.6"
            ],
            "secnumcloud": [
                "18.3.a"
            ],
            "cra": [
                "8.2.7",
                "8.4.3.2.8",
                "8.4.4.1"
            ],
            "lpm": [
                "1.12",
                "1.13",
                "20.1",
                "20.2",
                "20.3",
                "20.4",
                "20.5",
                "20.6",
                "20.7",
                "20.8",
                "20.9",
                "20.10",
                "20.11",
                "20.12",
                "20.15"
            ],
            "nis2": [
                "21.2.f"
            ]
        }
    },
    {
        "id": "MS.AUDIT.PROGRAM",
        "category": "process",
        "csf_function": "detect",
        "name": "Programme d'audit interne",
        "name_en": "Internal audit program",
        "description": "Établir un programme d'audit interne pluriannuel définissant fréquence, périmètre, critères, méthodes et responsabilités, en tenant compte de l'importance des processus.",
        "description_en": "Establish a multi-year internal audit program defining frequency, scope, criteria, methods and responsibilities, considering the importance of processes.",
        "typical_evidence": [
            "Programme d'audit interne planifié"
        ],
        "typical_evidence_en": [
            "Planned internal audit program"
        ],
        "framework_refs": {
            "iso": [
                "9.2.2"
            ],
            "soc2": [
                "CC4.1.1",
                "CC4.1.2",
                "CC4.1.6",
                "CC4.1.8"
            ],
            "recyf": [
                "17.1"
            ],
            "secnumcloud": [
                "18.1.e"
            ],
            "cra": [
                "8.2.4.5",
                "8.2.5",
                "8.2.8",
                "8.4.3.1",
                "8.4.3.3",
                "8.4.3.c",
                "8.4.4.1",
                "8.4.4.3"
            ],
            "hds": [
                "EXI-16.a"
            ],
            "lpm": [
                "1.8",
                "2.4"
            ],
            "loi0520": [
                "ART-4",
                "ART-20"
            ],
            "nis2": [
                "21.2.f"
            ],
            "dora": [
                "DORA-6"
            ]
        }
    },
    {
        "id": "MS.AUDIT.CONDUCT",
        "category": "process",
        "csf_function": "detect",
        "name": "Réalisation des audits internes et restitution",
        "name_en": "Conduct of internal audits and reporting",
        "description": "Conduire les audits internes par des auditeurs objectifs pour vérifier la conformité et l'efficacité du SMSI, et rapporter les constats à la direction concernée.",
        "description_en": "Carry out internal audits by objective auditors to verify ISMS conformity and effectiveness, and report findings to the relevant management.",
        "typical_evidence": [
            "Rapports d'audit interne et constats"
        ],
        "typical_evidence_en": [
            "Internal audit reports and findings"
        ],
        "framework_refs": {
            "iso": [
                "9.2.1"
            ],
            "soc2": [
                "CC4.1.4",
                "CC4.1.7",
                "CC4.2.2"
            ],
            "recyf": [
                "17.2",
                "17.3",
                "17.4"
            ],
            "secnumcloud": [
                "18.2.2.a",
                "18.2.3.a",
                "18.3.a",
                "19.1.p",
                "19.1.r"
            ],
            "cra": [
                "5.7",
                "8.2.1",
                "8.2.4.1",
                "8.2.4.2",
                "8.2.5",
                "8.4.3.3",
                "8.4.3.e",
                "8.4.3.f",
                "8.4.4.1",
                "8.4.4.3"
            ],
            "hds": [
                "EXI-16.a",
                "EXI-16.b"
            ],
            "lpm": [
                "2.3",
                "2.5",
                "2.6",
                "2.10"
            ],
            "loi0520": [
                "ART-20"
            ],
            "nis2": [
                "21.2.f"
            ]
        }
    },
    {
        "id": "MS.MGMTREVIEW.HOLD",
        "category": "process",
        "csf_function": "govern",
        "name": "Tenue de revues de direction périodiques",
        "name_en": "Holding periodic management reviews",
        "description": "Organiser à intervalles planifiés des revues de direction pour statuer sur la pertinence, l'adéquation et l'efficacité du SMSI.",
        "description_en": "Hold management reviews at planned intervals to decide on the suitability, adequacy and effectiveness of the ISMS.",
        "typical_evidence": [
            "Planning et convocations des revues de direction"
        ],
        "typical_evidence_en": [
            "Management review schedule and invitations"
        ],
        "framework_refs": {
            "iso": [
                "9.3.1"
            ],
            "lpm": [
                "1.12"
            ],
            "nis2": [
                "21.2.f"
            ]
        }
    },
    {
        "id": "MS.MGMTREVIEW.INPUTS",
        "category": "process",
        "csf_function": "govern",
        "name": "Ordre du jour couvrant les entrées requises",
        "name_en": "Agenda covering the required inputs",
        "description": "S'assurer que la revue de direction examine les entrées requises : suites des revues précédentes, changements de contexte, retours sur la performance, audits, risques et opportunités d'amélioration.",
        "description_en": "Ensure the management review examines the required inputs: previous review actions, context changes, performance feedback, audits, risks and improvement opportunities.",
        "typical_evidence": [
            "Ordre du jour et dossier d'entrée de la revue"
        ],
        "typical_evidence_en": [
            "Review agenda and input pack"
        ],
        "framework_refs": {
            "iso": [
                "9.3.2"
            ],
            "soc2": [
                "CC2.3.3",
                "CC3.1.11",
                "CC4.2.1"
            ],
            "recyf": [
                "2.B.4"
            ],
            "lpm": [
                "1.13"
            ]
        }
    },
    {
        "id": "MS.MGMTREVIEW.OUTPUTS",
        "category": "process",
        "csf_function": "govern",
        "name": "Décisions et actions de la revue de direction",
        "name_en": "Management review decisions and actions",
        "description": "Consigner les résultats de la revue de direction : décisions d'amélioration, changements du SMSI et besoins en ressources, avec responsables et échéances.",
        "description_en": "Record the management review outputs: improvement decisions, ISMS changes and resource needs, with owners and deadlines.",
        "typical_evidence": [
            "Compte rendu de revue de direction avec plan d'actions"
        ],
        "typical_evidence_en": [
            "Management review minutes with action plan"
        ],
        "framework_refs": {
            "iso": [
                "9.3.3"
            ],
            "soc2": [
                "CC2.2.2",
                "CC4.2.2",
                "P8.1.4"
            ]
        }
    },
    {
        "id": "MS.IMPROVE.CONTINUAL",
        "category": "process",
        "csf_function": "govern",
        "name": "Amélioration continue du SMSI",
        "name_en": "Continual improvement of the ISMS",
        "description": "Identifier et exploiter les opportunités d'amélioration pour accroître de façon continue la pertinence, l'adéquation et l'efficacité du SMSI.",
        "description_en": "Identify and act on improvement opportunities to continually enhance the suitability, adequacy and effectiveness of the ISMS.",
        "typical_evidence": [
            "Registre des améliorations et suivi associé"
        ],
        "typical_evidence_en": [
            "Improvement register and associated tracking"
        ],
        "framework_refs": {
            "iso": [
                "10.1"
            ],
            "soc2": [
                "CC4.2.3"
            ],
            "recyf": [
                "14.5",
                "20.2"
            ],
            "secnumcloud": [
                "16.5.a"
            ],
            "dora": [
                "DORA-6"
            ]
        }
    },
    {
        "id": "MS.NC.CORRECTIVE",
        "category": "process",
        "csf_function": "respond",
        "name": "Non-conformités et actions correctives",
        "name_en": "Nonconformities and corrective actions",
        "description": "Traiter les non-conformités en corrigeant l'écart, en analysant la cause racine et en mettant en œuvre des actions correctives pour éviter la récurrence, le tout documenté.",
        "description_en": "Handle nonconformities by correcting the deviation, analyzing the root cause and implementing corrective actions to prevent recurrence, all documented.",
        "typical_evidence": [
            "Registre des non-conformités et actions correctives"
        ],
        "typical_evidence_en": [
            "Nonconformity and corrective action log"
        ],
        "framework_refs": {
            "iso": [
                "10.2"
            ],
            "soc2": [
                "CC1.1.4",
                "CC1.5.6",
                "CC4.2.2",
                "CC4.2.3",
                "CC5.3.4",
                "CC7.5.4",
                "P8.1.2",
                "P8.1.3",
                "P8.1.5"
            ],
            "recyf": [
                "2.C.2",
                "12.5",
                "17.5"
            ],
            "cra": [
                "8.2.b"
            ],
            "anssi": [
                "38.R"
            ],
            "lpm": [
                "2.6"
            ],
            "loi0520": [
                "ART-24",
                "ART-34"
            ],
            "dora": [
                "DORA-42"
            ]
        }
    },
    {
        "id": "POL.MASTER",
        "category": "policy",
        "csf_function": "govern",
        "name": "Politique générale de sécurité de l'information",
        "name_en": "Overarching information security policy",
        "description": "Rédiger, faire approuver par la direction et diffuser une politique générale de sécurité de l'information définissant la portée, les objectifs et les principes directeurs.",
        "description_en": "Draft, obtain management approval for and distribute an overarching information security policy setting out scope, objectives and guiding principles.",
        "typical_evidence": [
            "Politique générale approuvée et datée",
            "Preuve d'approbation par la direction"
        ],
        "typical_evidence_en": [
            "Approved and dated overarching policy",
            "Evidence of management approval"
        ],
        "framework_refs": {
            "iso": [
                "A.5.1"
            ],
            "soc2": [
                "CC1.1.1",
                "CC1.1.2",
                "CC5.3.1"
            ],
            "recyf": [
                "2.B.1",
                "2.B.2",
                "2.B.3"
            ],
            "secnumcloud": [
                "5.1.b",
                "5.2.a",
                "5.2.b",
                "5.2.c",
                "5.2.e"
            ],
            "lpm": [
                "1.1",
                "1.2",
                "1.3"
            ],
            "loi0520": [
                "ART-4"
            ],
            "nis2": [
                "21.2.a"
            ],
            "dora": [
                "DORA-5"
            ]
        }
    },
    {
        "id": "POL.TOPIC",
        "category": "policy",
        "csf_function": "govern",
        "name": "Politiques thématiques dérivées",
        "name_en": "Derived topic-specific policies",
        "description": "Décliner la politique générale en politiques thématiques (accès, cryptographie, sauvegarde, etc.) cohérentes avec les objectifs de l'organisation.",
        "description_en": "Break down the overarching policy into topic-specific policies (access, cryptography, backup, etc.) consistent with organizational objectives.",
        "typical_evidence": [
            "Recueil des politiques thématiques",
            "Table de correspondance avec la politique générale"
        ],
        "typical_evidence_en": [
            "Set of topic-specific policies",
            "Mapping table to the overarching policy"
        ],
        "framework_refs": {
            "iso": [
                "A.5.1"
            ],
            "soc2": [
                "CC1.4.1",
                "CC5.3.1"
            ],
            "recyf": [
                "2.B.5"
            ],
            "secnumcloud": [
                "5.2.c"
            ],
            "lpm": [
                "1.2",
                "1.6",
                "1.7",
                "1.9"
            ],
            "nis2": [
                "21.2.a"
            ]
        }
    },
    {
        "id": "POL.REVIEW",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Revue périodique des politiques",
        "name_en": "Periodic policy review",
        "description": "Revoir les politiques de sécurité à intervalles planifiés et lors de changements majeurs, puis tracer les mises à jour et ré-approbations.",
        "description_en": "Review security policies at planned intervals and upon major changes, then record updates and re-approvals.",
        "typical_evidence": [
            "Historique des versions",
            "Comptes rendus de revue de politique"
        ],
        "typical_evidence_en": [
            "Version history",
            "Policy review records"
        ],
        "framework_refs": {
            "iso": [
                "A.5.1"
            ],
            "soc2": [
                "CC5.3.6"
            ],
            "recyf": [
                "2.B.4"
            ],
            "secnumcloud": [
                "5.2.e",
                "9.1.b",
                "17.1.b"
            ],
            "lpm": [
                "1.1",
                "2.12"
            ],
            "nis2": [
                "21.2.a"
            ]
        }
    },
    {
        "id": "ROLE.DEFINE",
        "category": "policy",
        "csf_function": "govern",
        "name": "Définition des rôles de sécurité",
        "name_en": "Definition of security roles",
        "description": "Documenter les rôles et responsabilités de sécurité de l'information et les rattacher à des postes ou fonctions identifiés.",
        "description_en": "Document information security roles and responsibilities and tie them to identified positions or functions.",
        "typical_evidence": [
            "Matrice des rôles et responsabilités",
            "Fiches de fonction sécurité"
        ],
        "typical_evidence_en": [
            "Roles and responsibilities matrix",
            "Security role descriptions"
        ],
        "framework_refs": {
            "iso": [
                "A.5.2"
            ],
            "soc2": [
                "CC1.2.1",
                "CC1.2.2",
                "CC1.3.1",
                "CC1.3.2",
                "CC1.3.4"
            ],
            "recyf": [
                "2.A.2",
                "2.A.3"
            ],
            "secnumcloud": [
                "6.1.a",
                "6.1.b",
                "6.1.c",
                "6.1.e",
                "6.1.f",
                "6.1.g",
                "7.5.a",
                "15.2.c"
            ],
            "cra": [
                "8.1.a",
                "8.2.11",
                "8.3.4",
                "8.4.3.2.1",
                "8.4.8"
            ],
            "anssi": [
                "39"
            ],
            "lpm": [
                "1.4"
            ],
            "loi0520": [
                "ART-6"
            ]
        }
    },
    {
        "id": "ROLE.ASSIGN",
        "category": "process",
        "csf_function": "govern",
        "name": "Attribution nominative des responsabilités",
        "name_en": "Named assignment of responsibilities",
        "description": "Attribuer nominativement chaque responsabilité de sécurité à une personne, la lui notifier et obtenir son acceptation formelle.",
        "description_en": "Assign each security responsibility to a named person, notify them and obtain formal acceptance.",
        "typical_evidence": [
            "Lettres de mission signées",
            "Registre des responsables désignés"
        ],
        "typical_evidence_en": [
            "Signed assignment letters",
            "Register of designated owners"
        ],
        "framework_refs": {
            "iso": [
                "A.5.2"
            ],
            "soc2": [
                "CC1.3.3",
                "CC1.3.6",
                "CC1.5.1",
                "CC2.2.5",
                "CC5.3.2",
                "CC9.2.4"
            ],
            "recyf": [
                "2.A.2"
            ],
            "secnumcloud": [
                "6.1.b",
                "6.1.c",
                "6.1.d",
                "6.1.e",
                "6.1.f",
                "6.1.g",
                "7.3.c"
            ],
            "cra": [
                "8.1.a",
                "8.2.11",
                "8.3.4",
                "8.4.8"
            ],
            "anssi": [
                "39"
            ],
            "lpm": [
                "1.4"
            ],
            "loi0520": [
                "ART-6"
            ]
        }
    },
    {
        "id": "SOD.MATRIX",
        "category": "policy",
        "csf_function": "protect",
        "name": "Matrice de séparation des tâches",
        "name_en": "Segregation of duties matrix",
        "description": "Établir une matrice identifiant les combinaisons de tâches incompatibles à ne jamais confier à une même personne.",
        "description_en": "Establish a matrix identifying incompatible task combinations that must never be granted to a single person.",
        "typical_evidence": [
            "Matrice de séparation des tâches",
            "Liste des combinaisons interdites"
        ],
        "typical_evidence_en": [
            "Segregation of duties matrix",
            "List of prohibited combinations"
        ],
        "framework_refs": {
            "iso": [
                "A.5.3"
            ],
            "soc2": [
                "CC1.3.3",
                "CC3.3.1",
                "CC3.3.3",
                "CC5.1.6",
                "CC6.3.3",
                "CC8.1.9"
            ],
            "recyf": [
                "11.A.1",
                "11.A.2"
            ],
            "secnumcloud": [
                "6.2.a",
                "9.3.f"
            ]
        }
    },
    {
        "id": "SOD.MONITOR",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Détection des conflits de séparation des tâches",
        "name_en": "Detection of segregation of duties conflicts",
        "description": "Contrôler périodiquement les attributions réelles pour repérer et corriger les cumuls de fonctions incompatibles.",
        "description_en": "Periodically check actual assignments to detect and remediate accumulations of incompatible duties.",
        "typical_evidence": [
            "Rapports d'analyse des conflits SoD",
            "Plans de remédiation des cumuls"
        ],
        "typical_evidence_en": [
            "SoD conflict analysis reports",
            "Remediation plans for accumulations"
        ],
        "framework_refs": {
            "iso": [
                "A.5.3"
            ],
            "soc2": [
                "CC5.1.6"
            ],
            "secnumcloud": [
                "6.2.a",
                "9.3.f"
            ]
        }
    },
    {
        "id": "MGMT.COMMIT",
        "category": "policy",
        "csf_function": "govern",
        "name": "Engagement formel de la direction",
        "name_en": "Formal management commitment",
        "description": "Faire porter par la direction une déclaration d'engagement exigeant que le personnel applique les règles de sécurité de l'information.",
        "description_en": "Have management issue a commitment statement requiring personnel to apply information security rules.",
        "typical_evidence": [
            "Déclaration d'engagement de la direction",
            "Compte rendu de revue de direction"
        ],
        "typical_evidence_en": [
            "Management commitment statement",
            "Management review minutes"
        ],
        "framework_refs": {
            "iso": [
                "A.5.4"
            ],
            "soc2": [
                "CC1.1.1",
                "CC1.2.1"
            ],
            "recyf": [
                "2.A.1",
                "2.B.1",
                "2.B.3"
            ],
            "secnumcloud": [
                "5.2.d"
            ],
            "cra": [
                "5.3",
                "8.4.3.4"
            ],
            "anssi": [
                "39"
            ],
            "nis2": [
                "21.1"
            ],
            "dora": [
                "DORA-5"
            ]
        }
    },
    {
        "id": "MGMT.RESOURCES",
        "category": "process",
        "csf_function": "govern",
        "name": "Allocation des ressources de sécurité",
        "name_en": "Allocation of security resources",
        "description": "Allouer les budgets, effectifs et outils nécessaires au SMSI et vérifier leur adéquation lors des revues de direction.",
        "description_en": "Allocate the budget, staffing and tooling required for the ISMS and verify adequacy during management reviews.",
        "typical_evidence": [
            "Budget sécurité approuvé",
            "Plan de ressources du SMSI"
        ],
        "typical_evidence_en": [
            "Approved security budget",
            "ISMS resource plan"
        ],
        "framework_refs": {
            "iso": [
                "A.5.4"
            ],
            "soc2": [
                "CC3.1.4"
            ]
        }
    },
    {
        "id": "CONTACT.AUTH.LIST",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Annuaire des autorités compétentes",
        "name_en": "Directory of relevant authorities",
        "description": "Tenir à jour une liste des autorités à contacter (régulateur, CERT national, forces de l'ordre) avec coordonnées et champ de compétence.",
        "description_en": "Maintain an up-to-date list of authorities to contact (regulator, national CERT, law enforcement) with contact details and remit.",
        "typical_evidence": [
            "Annuaire des autorités à jour",
            "Date de dernière vérification des coordonnées"
        ],
        "typical_evidence_en": [
            "Up-to-date authority directory",
            "Last verification date of contact details"
        ],
        "framework_refs": {
            "iso": [
                "A.5.5"
            ],
            "recyf": [
                "2.A.2",
                "14.4"
            ],
            "secnumcloud": [
                "6.3.a"
            ],
            "hds": [
                "EXI-11.b"
            ],
            "lpm": [
                "9.1",
                "9.3"
            ],
            "loi0520": [
                "ART-8",
                "ART-36",
                "ART-38",
                "ART-42",
                "ART-46"
            ],
            "dora": [
                "DORA-19"
            ]
        }
    },
    {
        "id": "CONTACT.AUTH.PROC",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Procédure de notification aux autorités",
        "name_en": "Authority notification procedure",
        "description": "Définir qui contacte quelle autorité, dans quel délai et selon quel canal en cas d'incident de sécurité déclarable.",
        "description_en": "Define who contacts which authority, within what deadline and through which channel in case of a reportable security incident.",
        "typical_evidence": [
            "Procédure de notification documentée",
            "Journal des contacts avec les autorités"
        ],
        "typical_evidence_en": [
            "Documented notification procedure",
            "Log of contacts with authorities"
        ],
        "framework_refs": {
            "iso": [
                "A.5.5"
            ],
            "soc2": [
                "CC2.3.5",
                "CC2.3.8",
                "CC7.4.13",
                "P6.6.1",
                "P6.6.2"
            ],
            "secnumcloud": [
                "6.3.a",
                "16.1.c",
                "16.2.d"
            ],
            "cra": [
                "8.2.9",
                "8.4.7"
            ],
            "hds": [
                "EXI-11.b"
            ],
            "lpm": [
                "9.3"
            ],
            "loi0520": [
                "ART-8",
                "ART-30",
                "ART-33",
                "ART-42",
                "ART-50"
            ],
            "dora": [
                "DORA-19",
                "DORA-20",
                "DORA-21"
            ]
        }
    },
    {
        "id": "CONTACT.SIG.MEMBER",
        "category": "process",
        "csf_function": "identify",
        "name": "Adhésion à des groupes d'intérêt spécialisés",
        "name_en": "Membership in special interest groups",
        "description": "Adhérer et participer à des forums, ISAC ou associations professionnelles pour recueillir alertes et bonnes pratiques de sécurité.",
        "description_en": "Join and participate in forums, ISACs or professional associations to gather security alerts and good practices.",
        "typical_evidence": [
            "Preuves d'adhésion",
            "Comptes rendus de participation aux forums"
        ],
        "typical_evidence_en": [
            "Proof of membership",
            "Records of forum participation"
        ],
        "framework_refs": {
            "iso": [
                "A.5.6"
            ],
            "soc2": [
                "CC1.2.4"
            ],
            "secnumcloud": [
                "6.4.a"
            ],
            "cra": [
                "1.2.5",
                "1.2.6",
                "2.2",
                "8.2.d",
                "8.4.a"
            ],
            "lpm": [
                "4.3"
            ],
            "loi0520": [
                "ART-45",
                "ART-46",
                "ART-47"
            ],
            "dora": [
                "DORA-45"
            ]
        }
    },
    {
        "id": "TI.COLLECT",
        "category": "process",
        "csf_function": "identify",
        "name": "Collecte de renseignements sur les menaces",
        "name_en": "Threat intelligence collection",
        "description": "Recueillir des renseignements sur les menaces à partir de sources internes et externes pertinentes pour l'organisation.",
        "description_en": "Collect threat intelligence from internal and external sources relevant to the organization.",
        "typical_evidence": [
            "Liste des sources de renseignement",
            "Flux de menaces consolidés"
        ],
        "typical_evidence_en": [
            "List of intelligence sources",
            "Consolidated threat feeds"
        ],
        "framework_refs": {
            "iso": [
                "A.5.7"
            ],
            "soc2": [
                "CC2.1.2",
                "CC3.4.6"
            ],
            "recyf": [
                "5.B.3"
            ],
            "secnumcloud": [
                "6.4.a"
            ],
            "lpm": [
                "4.3"
            ],
            "loi0520": [
                "ART-47"
            ],
            "dora": [
                "DORA-13",
                "DORA-22",
                "DORA-26",
                "DORA-45"
            ]
        }
    },
    {
        "id": "TI.ANALYZE",
        "category": "process",
        "csf_function": "detect",
        "name": "Analyse et diffusion du renseignement",
        "name_en": "Threat intelligence analysis and dissemination",
        "description": "Analyser le renseignement collecté, en évaluer la pertinence et diffuser des éléments exploitables aux équipes concernées.",
        "description_en": "Analyze collected intelligence, assess its relevance and disseminate actionable items to the relevant teams.",
        "typical_evidence": [
            "Notes d'analyse de menaces",
            "Bulletins de diffusion internes"
        ],
        "typical_evidence_en": [
            "Threat analysis notes",
            "Internal dissemination bulletins"
        ],
        "framework_refs": {
            "iso": [
                "A.5.7"
            ],
            "recyf": [
                "5.B.3"
            ],
            "cra": [
                "1.2.4"
            ],
            "loi0520": [
                "ART-31"
            ],
            "dora": [
                "DORA-22",
                "DORA-45"
            ]
        }
    },
    {
        "id": "PROJ.RISK",
        "category": "process",
        "csf_function": "identify",
        "name": "Appréciation des risques dans les projets",
        "name_en": "Risk assessment within projects",
        "description": "Intégrer une appréciation des risques de sécurité de l'information dès le lancement de chaque projet significatif.",
        "description_en": "Embed an information security risk assessment from the start of every significant project.",
        "typical_evidence": [
            "Appréciations de risque projet",
            "Registre des risques par projet"
        ],
        "typical_evidence_en": [
            "Project risk assessments",
            "Per-project risk register"
        ],
        "framework_refs": {
            "iso": [
                "A.5.8"
            ],
            "recyf": [
                "16.2"
            ],
            "secnumcloud": [
                "6.5.a"
            ],
            "cra": [
                "1.1.1",
                "2.5",
                "7.3"
            ]
        }
    },
    {
        "id": "PROJ.GATE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Points de contrôle sécurité du cycle projet",
        "name_en": "Security checkpoints in the project lifecycle",
        "description": "Instaurer des jalons de validation sécurité aux étapes clés d'un projet avant tout passage en phase suivante.",
        "description_en": "Set up security validation gates at key project milestones before moving to the next phase.",
        "typical_evidence": [
            "Comptes rendus de jalons sécurité",
            "Grille de contrôle sécurité projet"
        ],
        "typical_evidence_en": [
            "Security gate review records",
            "Project security checklist"
        ],
        "framework_refs": {
            "iso": [
                "A.5.8"
            ],
            "secnumcloud": [
                "6.5.b"
            ],
            "loi0520": [
                "ART-19"
            ]
        }
    },
    {
        "id": "ASSET.INVENTORY",
        "category": "process",
        "csf_function": "identify",
        "name": "Inventaire des informations et actifs associés",
        "name_en": "Inventory of information and associated assets",
        "description": "Constituer et tenir à jour un inventaire des informations et des actifs associés, avec identifiant unique et localisation.",
        "description_en": "Build and maintain an inventory of information and associated assets, each with a unique identifier and location.",
        "typical_evidence": [
            "Registre d'inventaire des actifs",
            "Rapport de rapprochement périodique"
        ],
        "typical_evidence_en": [
            "Asset inventory register",
            "Periodic reconciliation report"
        ],
        "framework_refs": {
            "iso": [
                "A.5.9"
            ],
            "soc2": [
                "CC2.1.5",
                "CC2.1.6",
                "CC2.1.9",
                "CC5.2.1",
                "CC6.1.1",
                "CC7.1.4"
            ],
            "recyf": [
                "1.1",
                "1.3",
                "3.A.1",
                "5.A.1",
                "9.1",
                "9.2",
                "11.B.2"
            ],
            "secnumcloud": [
                "8.1.a",
                "8.1.b",
                "8.1.c",
                "8.3.a",
                "9.3.c",
                "13.1.a",
                "13.1.b",
                "15.1.a"
            ],
            "cra": [
                "1.2.1",
                "2.3",
                "2.9",
                "5.1",
                "5.4",
                "7.1",
                "7.1.c",
                "7.8"
            ],
            "hds": [
                "EXI-04"
            ],
            "anssi": [
                "4",
                "7",
                "35"
            ],
            "lpm": [
                "3.1",
                "3.2",
                "3.3",
                "3.4",
                "3.6",
                "3.8",
                "3.10",
                "19.2"
            ],
            "loi0520": [
                "ART-16",
                "ART-17",
                "ART-18"
            ],
            "nis2": [
                "21.2.i"
            ],
            "dora": [
                "DORA-8"
            ]
        }
    },
    {
        "id": "ASSET.OWNER",
        "category": "process",
        "csf_function": "govern",
        "name": "Attribution d'un propriétaire par actif",
        "name_en": "Assignment of an owner per asset",
        "description": "Désigner pour chaque actif un propriétaire responsable de sa protection tout au long de son cycle de vie.",
        "description_en": "Designate for each asset an owner accountable for its protection throughout its lifecycle.",
        "typical_evidence": [
            "Registre propriétaire-actif",
            "Preuves d'acceptation de responsabilité"
        ],
        "typical_evidence_en": [
            "Owner-asset register",
            "Evidence of ownership acceptance"
        ],
        "framework_refs": {
            "iso": [
                "A.5.9"
            ],
            "soc2": [
                "CC2.1.6",
                "CC6.1.1"
            ],
            "recyf": [
                "1.1",
                "5.A.1"
            ],
            "secnumcloud": [
                "8.1.a"
            ],
            "cra": [
                "2.3",
                "7.1"
            ],
            "lpm": [
                "3.1"
            ],
            "nis2": [
                "21.2.i"
            ],
            "dora": [
                "DORA-8"
            ]
        }
    },
    {
        "id": "ASSET.AUP",
        "category": "policy",
        "csf_function": "protect",
        "name": "Charte d'utilisation acceptable",
        "name_en": "Acceptable use policy",
        "description": "Publier une charte définissant les usages autorisés et interdits des informations et des actifs, et la faire accepter par les utilisateurs.",
        "description_en": "Publish a charter defining permitted and prohibited use of information and assets, and have users acknowledge it.",
        "typical_evidence": [
            "Charte d'utilisation signée",
            "Registre des acceptations"
        ],
        "typical_evidence_en": [
            "Signed acceptable use charter",
            "Register of acknowledgements"
        ],
        "framework_refs": {
            "iso": [
                "A.5.10"
            ],
            "soc2": [
                "CC1.1.2"
            ],
            "recyf": [
                "4.1"
            ],
            "secnumcloud": [
                "7.2.a",
                "7.2.b",
                "7.2.c",
                "7.2.d"
            ],
            "hds": [
                "EXI-05.m",
                "EXI-07.a"
            ],
            "anssi": [
                "2.R"
            ]
        }
    },
    {
        "id": "ASSET.HANDLING",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Règles de manipulation par niveau de sensibilité",
        "name_en": "Handling rules per sensitivity level",
        "description": "Définir les règles de manipulation, stockage et destruction des actifs selon leur niveau de sensibilité.",
        "description_en": "Define handling, storage and disposal rules for assets according to their sensitivity level.",
        "typical_evidence": [
            "Procédure de manipulation des actifs",
            "Consignes de stockage et destruction"
        ],
        "typical_evidence_en": [
            "Asset handling procedure",
            "Storage and disposal guidelines"
        ],
        "framework_refs": {
            "iso": [
                "A.5.10"
            ],
            "soc2": [
                "CC2.1.9"
            ],
            "secnumcloud": [
                "8.4.a",
                "11.8.a"
            ],
            "hds": [
                "EXI-05.d",
                "EXI-05.e"
            ],
            "loi0520": [
                "ART-5"
            ]
        }
    },
    {
        "id": "ASSET.RETURN",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Restitution des actifs au départ",
        "name_en": "Return of assets upon departure",
        "description": "Appliquer une liste de contrôle de restitution des actifs lors du départ ou du changement de rôle d'un collaborateur ou sous-traitant.",
        "description_en": "Apply an asset return checklist when an employee or contractor leaves or changes role.",
        "typical_evidence": [
            "Fiches de restitution signées",
            "Suivi des actifs restitués"
        ],
        "typical_evidence_en": [
            "Signed return forms",
            "Returned asset tracking"
        ],
        "framework_refs": {
            "iso": [
                "A.5.11"
            ],
            "soc2": [
                "CC6.4.3"
            ],
            "secnumcloud": [
                "8.2.a"
            ]
        }
    },
    {
        "id": "CLASS.SCHEME",
        "category": "policy",
        "csf_function": "identify",
        "name": "Schéma de classification des informations",
        "name_en": "Information classification scheme",
        "description": "Définir un schéma de classification (par ex. public, interne, confidentiel, secret) fondé sur la sensibilité et la valeur métier.",
        "description_en": "Define a classification scheme (e.g. public, internal, confidential, secret) based on sensitivity and business value.",
        "typical_evidence": [
            "Schéma de classification approuvé",
            "Critères de classification documentés"
        ],
        "typical_evidence_en": [
            "Approved classification scheme",
            "Documented classification criteria"
        ],
        "framework_refs": {
            "iso": [
                "A.5.12"
            ],
            "soc2": [
                "C1.1.1",
                "CC2.1.7"
            ],
            "secnumcloud": [
                "8.3.a"
            ],
            "anssi": [
                "4"
            ],
            "lpm": [
                "2.14",
                "3.9"
            ],
            "loi0520": [
                "ART-5"
            ],
            "nis2": [
                "21.2.i"
            ]
        }
    },
    {
        "id": "CLASS.APPLY",
        "category": "process",
        "csf_function": "identify",
        "name": "Classification effective des informations",
        "name_en": "Effective classification of information",
        "description": "Attribuer un niveau de classification à chaque information ou actif et le maintenir cohérent au fil de son cycle de vie.",
        "description_en": "Assign a classification level to each piece of information or asset and keep it consistent over its lifecycle.",
        "typical_evidence": [
            "Registre des informations classifiées",
            "Échantillon de contrôle de classification"
        ],
        "typical_evidence_en": [
            "Register of classified information",
            "Classification control sample"
        ],
        "framework_refs": {
            "iso": [
                "A.5.12"
            ],
            "soc2": [
                "C1.1.1",
                "CC2.1.7",
                "CC6.1.1",
                "CC7.3.4",
                "P6.7.2",
                "PP1.1"
            ],
            "secnumcloud": [
                "8.3.a",
                "8.3.b"
            ],
            "cra": [
                "1.1.2.g"
            ],
            "anssi": [
                "4"
            ],
            "lpm": [
                "3.9",
                "8.5",
                "20.14"
            ],
            "loi0520": [
                "ART-5",
                "ART-17",
                "ART-18"
            ],
            "dora": [
                "DORA-8"
            ]
        }
    },
    {
        "id": "LABEL.PROC",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Procédure de marquage des informations",
        "name_en": "Information labelling procedure",
        "description": "Standardiser le marquage des informations (en-têtes, filigranes, métadonnées) reflétant leur niveau de classification.",
        "description_en": "Standardize information labelling (headers, watermarks, metadata) reflecting its classification level.",
        "typical_evidence": [
            "Procédure et modèles de marquage",
            "Audit d'échantillons marqués"
        ],
        "typical_evidence_en": [
            "Labelling procedure and templates",
            "Audit of labelled samples"
        ],
        "framework_refs": {
            "iso": [
                "A.5.13"
            ],
            "soc2": [
                "CC2.1.7"
            ],
            "secnumcloud": [
                "8.4.a"
            ]
        }
    },
    {
        "id": "XFER.RULES",
        "category": "policy",
        "csf_function": "protect",
        "name": "Règles de transfert des informations",
        "name_en": "Information transfer rules",
        "description": "Établir des règles et accords encadrant le transfert d'informations en interne et vers l'extérieur selon leur classification.",
        "description_en": "Establish rules and agreements governing internal and external information transfers according to classification.",
        "typical_evidence": [
            "Politique de transfert d'informations",
            "Accords de transfert signés"
        ],
        "typical_evidence_en": [
            "Information transfer policy",
            "Signed transfer agreements"
        ],
        "framework_refs": {
            "iso": [
                "A.5.14"
            ],
            "soc2": [
                "CC6.7.1"
            ],
            "hds": [
                "EXI-01.d",
                "EXI-05.o",
                "EXI-28",
                "EXI-29.a",
                "EXI-29.b",
                "EXI-29.c",
                "EXI-31.a"
            ],
            "anssi": [
                "18"
            ]
        }
    },
    {
        "id": "XFER.SECURE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Protection des informations en transfert",
        "name_en": "Protection of information in transit",
        "description": "Appliquer chiffrement et contrôles d'intégrité aux échanges d'informations sensibles quel que soit le canal utilisé.",
        "description_en": "Apply encryption and integrity controls to sensitive information exchanges regardless of the channel used.",
        "typical_evidence": [
            "Configuration de chiffrement des canaux",
            "Journaux de transferts sécurisés"
        ],
        "typical_evidence_en": [
            "Channel encryption configuration",
            "Secure transfer logs"
        ],
        "framework_refs": {
            "iso": [
                "A.5.14"
            ],
            "soc2": [
                "CC6.1.10",
                "CC6.6.2",
                "CC6.7.2"
            ],
            "recyf": [
                "8.1",
                "19.9",
                "19.10",
                "19.11"
            ],
            "secnumcloud": [
                "9.6.e",
                "10.2.a",
                "10.2.b",
                "10.2.c",
                "10.2.d",
                "10.2.e",
                "11.8.a",
                "12.7.c",
                "13.2.c"
            ],
            "cra": [
                "1.1.2.e",
                "1.1.2.f",
                "3.1.15",
                "3.1.17",
                "3.1.18"
            ],
            "hds": [
                "EXI-05.f",
                "EXI-30.b"
            ],
            "anssi": [
                "18"
            ],
            "lpm": [
                "15.7"
            ],
            "nis2": [
                "21.2.h",
                "21.2.j"
            ],
            "dora": [
                "DORA-9"
            ]
        }
    },
    {
        "id": "AC.POLICY",
        "category": "policy",
        "csf_function": "govern",
        "name": "Politique de contrôle d'accès",
        "name_en": "Access control policy",
        "description": "Définir et faire approuver une politique de contrôle d'accès fondée sur le moindre privilège et le besoin d'en connaître.",
        "description_en": "Define and approve an access control policy based on least privilege and need-to-know.",
        "typical_evidence": [
            "Politique de contrôle d'accès approuvée"
        ],
        "typical_evidence_en": [
            "Approved access control policy"
        ],
        "framework_refs": {
            "iso": [
                "A.5.15"
            ],
            "soc2": [
                "CC5.2.3",
                "CC6.1.3"
            ],
            "recyf": [
                "2.B.5",
                "10.A.1",
                "10.A.2",
                "10.A.4",
                "10.C.1"
            ],
            "secnumcloud": [
                "9.1.a",
                "9.1.b",
                "9.3.a"
            ],
            "hds": [
                "EXI-05.g",
                "EXI-23"
            ],
            "lpm": [
                "1.6",
                "12.1",
                "13.1",
                "14.2"
            ],
            "nis2": [
                "21.2.i"
            ],
            "dora": [
                "DORA-9"
            ]
        }
    },
    {
        "id": "AC.LEASTPRIV",
        "category": "process",
        "csf_function": "protect",
        "name": "Application du moindre privilège",
        "name_en": "Enforcement of least privilege",
        "description": "Restreindre les droits accordés au strict nécessaire pour exercer chaque fonction et supprimer les privilèges par défaut superflus.",
        "description_en": "Restrict granted rights to the strict minimum required for each function and remove superfluous default privileges.",
        "typical_evidence": [
            "Cartographie des privilèges",
            "Rapport de réduction des droits excessifs"
        ],
        "typical_evidence_en": [
            "Privilege mapping",
            "Report on reduction of excessive rights"
        ],
        "framework_refs": {
            "iso": [
                "A.5.15"
            ],
            "soc2": [
                "CC3.3.3",
                "CC3.3.5",
                "CC5.2.3",
                "CC6.1.3",
                "CC6.1.12",
                "CC6.1.13"
            ],
            "recyf": [
                "6.3",
                "10.B.6",
                "10.C.2",
                "10.C.3",
                "10.C.4",
                "11.A.1",
                "11.A.4"
            ],
            "secnumcloud": [
                "5.1.b",
                "9.1.a",
                "12.7.e",
                "13.2.e"
            ],
            "cra": [
                "1.1.2.d"
            ],
            "anssi": [
                "8",
                "9",
                "29"
            ],
            "lpm": [
                "10.8",
                "12.6",
                "12.9",
                "13.2",
                "13.3",
                "14.3",
                "14.6"
            ],
            "nis2": [
                "21.2.i"
            ]
        }
    },
    {
        "id": "AC.RBAC",
        "category": "process",
        "csf_function": "protect",
        "name": "Modèle d'accès fondé sur les rôles",
        "name_en": "Role-based access model",
        "description": "Structurer les autorisations autour de rôles alignés sur les fonctions métier afin de standardiser l'octroi des accès.",
        "description_en": "Structure authorizations around roles aligned with business functions to standardize access granting.",
        "typical_evidence": [
            "Catalogue des rôles et droits associés",
            "Matrice rôles-permissions"
        ],
        "typical_evidence_en": [
            "Catalogue of roles and associated rights",
            "Role-permission matrix"
        ],
        "framework_refs": {
            "iso": [
                "A.5.15"
            ],
            "soc2": [
                "CC6.1.7",
                "CC6.3.3"
            ],
            "recyf": [
                "10.C.2",
                "11.A.7"
            ],
            "secnumcloud": [
                "9.3.b",
                "9.3.d",
                "9.3.e",
                "9.4.b"
            ],
            "cra": [
                "3.1.1"
            ],
            "anssi": [
                "9"
            ],
            "lpm": [
                "11.2",
                "13.1",
                "13.3"
            ]
        }
    },
    {
        "id": "IDM.LIFECYCLE",
        "category": "process",
        "csf_function": "protect",
        "name": "Gestion du cycle de vie des identités",
        "name_en": "Identity lifecycle management",
        "description": "Gérer la création, la modification et la désactivation des identités en synchronisation avec les mouvements de personnel.",
        "description_en": "Manage creation, modification and deactivation of identities in sync with personnel movements.",
        "typical_evidence": [
            "Procédure de gestion des identités",
            "Journal des créations/désactivations de comptes"
        ],
        "typical_evidence_en": [
            "Identity management procedure",
            "Account creation/deactivation log"
        ],
        "framework_refs": {
            "iso": [
                "A.5.16"
            ],
            "soc2": [
                "CC6.1.4",
                "CC6.1.8",
                "CC6.1.9",
                "CC6.2.1",
                "CC6.2.3",
                "CC6.3.1"
            ],
            "recyf": [
                "4.4",
                "10.A.1",
                "10.A.5",
                "10.A.6"
            ],
            "secnumcloud": [
                "9.2.a",
                "9.2.c"
            ],
            "cra": [
                "3.1.1"
            ],
            "hds": [
                "EXI-05.h"
            ],
            "anssi": [
                "6",
                "6.R"
            ],
            "lpm": [
                "11.1",
                "11.4"
            ]
        }
    },
    {
        "id": "IDM.UNIQUE",
        "category": "process",
        "csf_function": "identify",
        "name": "Unicité et traçabilité des identités",
        "name_en": "Uniqueness and traceability of identities",
        "description": "Attribuer une identité unique et nominative à chaque utilisateur et proscrire le partage de comptes.",
        "description_en": "Assign a unique, named identity to each user and prohibit account sharing.",
        "typical_evidence": [
            "Référentiel d'identités",
            "Contrôle d'absence de comptes partagés"
        ],
        "typical_evidence_en": [
            "Identity repository",
            "Check for absence of shared accounts"
        ],
        "framework_refs": {
            "iso": [
                "A.5.16"
            ],
            "soc2": [
                "CC6.1.4",
                "CC6.1.8",
                "P5.1.2"
            ],
            "recyf": [
                "8.2",
                "10.A.1",
                "10.A.2",
                "10.A.3",
                "10.A.4",
                "10.B.1",
                "10.C.1",
                "11.A.3"
            ],
            "secnumcloud": [
                "9.2.b",
                "9.5.d"
            ],
            "hds": [
                "EXI-05.i",
                "EXI-05.j",
                "EXI-15.c"
            ],
            "anssi": [
                "5",
                "8"
            ],
            "lpm": [
                "3.7",
                "11.1",
                "11.2",
                "11.3",
                "12.5",
                "14.1",
                "20.7"
            ]
        }
    },
    {
        "id": "AUTH.PWDPOLICY",
        "category": "policy",
        "csf_function": "protect",
        "name": "Politique de mots de passe",
        "name_en": "Password policy",
        "description": "Fixer des exigences de robustesse, de renouvellement et de non-réutilisation des mots de passe et secrets d'authentification.",
        "description_en": "Set requirements for strength, renewal and non-reuse of passwords and authentication secrets.",
        "typical_evidence": [
            "Politique de mots de passe",
            "Configuration des règles de complexité"
        ],
        "typical_evidence_en": [
            "Password policy",
            "Complexity rule configuration"
        ],
        "framework_refs": {
            "iso": [
                "A.5.17"
            ],
            "soc2": [
                "CC6.1.8"
            ],
            "recyf": [
                "10.B.1",
                "10.B.2",
                "10.B.3",
                "10.B.4",
                "10.B.5",
                "10.B.6"
            ],
            "secnumcloud": [
                "9.5.a",
                "9.5.b"
            ],
            "cra": [
                "3.1.3"
            ],
            "anssi": [
                "10",
                "12.R"
            ],
            "lpm": [
                "12.1",
                "12.2",
                "12.3",
                "12.4",
                "12.5",
                "12.6",
                "12.7",
                "12.8",
                "20.9"
            ],
            "nis2": [
                "21.2.j"
            ]
        }
    },
    {
        "id": "AUTH.SECRETSTORE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Stockage sécurisé des secrets d'authentification",
        "name_en": "Secure storage of authentication secrets",
        "description": "Protéger les informations d'authentification par hachage ou chiffrement et bannir leur stockage ou transmission en clair.",
        "description_en": "Protect authentication information through hashing or encryption and forbid storing or transmitting it in clear text.",
        "typical_evidence": [
            "Preuve de hachage/chiffrement des secrets",
            "Résultat de scan d'absence de secrets en clair"
        ],
        "typical_evidence_en": [
            "Evidence of hashing/encryption of secrets",
            "Result of clear-text secret scan"
        ],
        "framework_refs": {
            "iso": [
                "A.5.17"
            ],
            "soc2": [
                "CC6.1.9",
                "CC6.6.2"
            ],
            "recyf": [
                "10.A.3",
                "10.B.3",
                "10.B.4"
            ],
            "secnumcloud": [
                "9.5.a",
                "10.3.a",
                "10.3.b",
                "10.3.c",
                "10.3.d"
            ],
            "cra": [
                "3.1.3",
                "3.1.9",
                "3.2.3",
                "3.2.4",
                "4.1",
                "4.3"
            ],
            "hds": [
                "EXI-05.i"
            ],
            "anssi": [
                "11"
            ],
            "lpm": [
                "12.2",
                "12.3",
                "12.6",
                "12.9",
                "15.8"
            ]
        }
    },
    {
        "id": "AUTH.MFA",
        "category": "process",
        "csf_function": "protect",
        "name": "Authentification multifacteur",
        "name_en": "Multi-factor authentication",
        "description": "Exiger une authentification à plusieurs facteurs pour les accès sensibles, distants et à privilèges élevés.",
        "description_en": "Require multi-factor authentication for sensitive, remote and highly privileged access.",
        "typical_evidence": [
            "Configuration MFA",
            "Liste des accès couverts par le MFA"
        ],
        "typical_evidence_en": [
            "MFA configuration",
            "List of access covered by MFA"
        ],
        "framework_refs": {
            "iso": [
                "A.5.17",
                "A.8.5"
            ],
            "soc2": [
                "CC6.1.4",
                "CC6.6.3"
            ],
            "recyf": [
                "8.2",
                "8.3",
                "8.4",
                "11.A.3",
                "19.10"
            ],
            "secnumcloud": [
                "9.5.a",
                "9.5.c",
                "9.6.e",
                "9.6.h"
            ],
            "cra": [
                "1.1.2.d"
            ],
            "hds": [
                "EXI-05.i"
            ],
            "anssi": [
                "13",
                "13.R",
                "30.R",
                "32.R"
            ],
            "lpm": [
                "12.1",
                "18.1",
                "18.3",
                "18.4"
            ],
            "nis2": [
                "21.2.j"
            ]
        }
    },
    {
        "id": "RIGHTS.PROVISION",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Octroi des droits d'accès sur approbation",
        "name_en": "Access rights provisioning upon approval",
        "description": "N'attribuer, modifier ou étendre un droit d'accès qu'après demande formelle et approbation du propriétaire concerné.",
        "description_en": "Grant, modify or extend an access right only after a formal request and approval by the relevant owner.",
        "typical_evidence": [
            "Demandes d'accès approuvées",
            "Journal d'octroi des droits"
        ],
        "typical_evidence_en": [
            "Approved access requests",
            "Access grant log"
        ],
        "framework_refs": {
            "iso": [
                "A.5.18"
            ],
            "soc2": [
                "CC5.2.3",
                "CC6.2.1",
                "CC6.3.1"
            ],
            "recyf": [
                "10.C.1",
                "11.A.2"
            ],
            "secnumcloud": [
                "9.2.a",
                "9.3.a",
                "9.3.b",
                "9.3.f"
            ],
            "hds": [
                "EXI-05.g",
                "EXI-05.h"
            ],
            "anssi": [
                "6"
            ],
            "lpm": [
                "13.1",
                "13.2",
                "13.3"
            ],
            "loi0520": [
                "ART-5"
            ]
        }
    },
    {
        "id": "RIGHTS.REVIEW",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Revue périodique des droits d'accès",
        "name_en": "Periodic access rights review",
        "description": "Revoir périodiquement les droits attribués et retirer les accès inutiles ou excessifs.",
        "description_en": "Periodically review granted rights and remove unnecessary or excessive access.",
        "typical_evidence": [
            "Comptes rendus de revue des accès"
        ],
        "typical_evidence_en": [
            "Access review records"
        ],
        "framework_refs": {
            "iso": [
                "A.5.18"
            ],
            "soc2": [
                "CC6.2.2",
                "CC6.3.4",
                "CC6.4.4"
            ],
            "recyf": [
                "10.A.6",
                "10.C.4"
            ],
            "secnumcloud": [
                "9.1.b",
                "9.3.d",
                "9.3.e",
                "9.3.g",
                "9.4.a",
                "9.4.b",
                "9.4.c",
                "12.5.b"
            ],
            "hds": [
                "EXI-05.g"
            ],
            "anssi": [
                "9"
            ],
            "lpm": [
                "3.7",
                "13.4",
                "13.5",
                "14.7"
            ],
            "nis2": [
                "21.2.i"
            ]
        }
    },
    {
        "id": "RIGHTS.REVOKE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Révocation des droits au départ ou changement",
        "name_en": "Rights revocation upon departure or change",
        "description": "Retirer sans délai les droits d'accès lors d'un départ, d'une suspension ou d'un changement de fonction.",
        "description_en": "Promptly remove access rights upon departure, suspension or change of role.",
        "typical_evidence": [
            "Tickets de révocation horodatés",
            "Rapport de comptes désactivés"
        ],
        "typical_evidence_en": [
            "Time-stamped revocation tickets",
            "Report of disabled accounts"
        ],
        "framework_refs": {
            "iso": [
                "A.5.18"
            ],
            "soc2": [
                "CC6.2.3",
                "CC6.3.2"
            ],
            "recyf": [
                "4.4",
                "10.A.5"
            ],
            "secnumcloud": [
                "9.2.a",
                "9.2.c",
                "9.3.a",
                "9.3.g"
            ],
            "hds": [
                "EXI-05.h"
            ],
            "anssi": [
                "6"
            ],
            "lpm": [
                "10.8",
                "11.4"
            ]
        }
    },
    {
        "id": "SUP.POLICY",
        "category": "policy",
        "csf_function": "govern",
        "name": "Politique de sécurité fournisseurs",
        "name_en": "Supplier security policy",
        "description": "Définir une politique fixant les exigences de sécurité applicables aux relations avec les fournisseurs et prestataires.",
        "description_en": "Define a policy setting security requirements applicable to relationships with suppliers and service providers.",
        "typical_evidence": [
            "Politique de sécurité fournisseurs approuvée"
        ],
        "typical_evidence_en": [
            "Approved supplier security policy"
        ],
        "framework_refs": {
            "iso": [
                "A.5.19"
            ],
            "soc2": [
                "CC1.1.5",
                "CC1.3.5",
                "CC9.2.1",
                "CC9.2.4"
            ],
            "recyf": [
                "3.A.2"
            ],
            "secnumcloud": [
                "15.1.a",
                "15.2.a"
            ],
            "anssi": [
                "3"
            ],
            "loi0520": [
                "ART-10",
                "ART-13",
                "ART-25"
            ],
            "nis2": [
                "21.2.d"
            ],
            "dora": [
                "DORA-28"
            ]
        }
    },
    {
        "id": "SUP.DUEDIL",
        "category": "process",
        "csf_function": "identify",
        "name": "Diligence raisonnable avant engagement",
        "name_en": "Due diligence before engagement",
        "description": "Évaluer le niveau de sécurité d'un fournisseur avant contractualisation, proportionnellement au risque qu'il représente.",
        "description_en": "Assess a supplier's security posture before contracting, proportionate to the risk it represents.",
        "typical_evidence": [
            "Questionnaires de sécurité fournisseurs",
            "Rapports d'évaluation d'entrée en relation"
        ],
        "typical_evidence_en": [
            "Supplier security questionnaires",
            "Onboarding assessment reports"
        ],
        "framework_refs": {
            "iso": [
                "A.5.19"
            ],
            "soc2": [
                "CC3.2.7",
                "CC9.2.2",
                "CC9.2.3"
            ],
            "recyf": [
                "3.B.1"
            ],
            "hds": [
                "EXI-12.b",
                "EXI-22"
            ],
            "anssi": [
                "3",
                "42.R"
            ],
            "lpm": [
                "2.5"
            ],
            "loi0520": [
                "ART-10",
                "ART-25",
                "ART-49"
            ],
            "nis2": [
                "21.2.d"
            ],
            "dora": [
                "DORA-27",
                "DORA-29"
            ]
        }
    },
    {
        "id": "SUP.MONITOR",
        "category": "process",
        "csf_function": "detect",
        "name": "Surveillance continue des fournisseurs",
        "name_en": "Continuous supplier monitoring",
        "description": "Suivre dans la durée la performance et la conformité sécurité des fournisseurs et traiter les écarts constatés.",
        "description_en": "Continuously track suppliers' security performance and compliance and address identified gaps.",
        "typical_evidence": [
            "Tableau de suivi des fournisseurs",
            "Comptes rendus de revue périodique fournisseur"
        ],
        "typical_evidence_en": [
            "Supplier tracking dashboard",
            "Periodic supplier review records"
        ],
        "framework_refs": {
            "iso": [
                "A.5.19"
            ],
            "soc2": [
                "CC3.4.5",
                "CC9.2.6",
                "CC9.2.7",
                "CC9.2.8",
                "CC9.2.11",
                "P6.4.2",
                "P6.5.1"
            ],
            "recyf": [
                "3.A.2",
                "3.B.2",
                "14.4"
            ],
            "secnumcloud": [
                "15.1.b",
                "15.3.a"
            ],
            "hds": [
                "EXI-06",
                "EXI-14"
            ],
            "nis2": [
                "21.2.d"
            ],
            "dora": [
                "DORA-28",
                "DORA-31",
                "DORA-32",
                "DORA-34",
                "DORA-42"
            ]
        }
    },
    {
        "id": "SUP.CONTRACT",
        "category": "process",
        "csf_function": "protect",
        "name": "Clauses de sécurité dans les contrats fournisseurs",
        "name_en": "Security clauses in supplier contracts",
        "description": "Inscrire dans les accords fournisseurs des clauses explicites de sécurité, de confidentialité et de notification d'incident.",
        "description_en": "Include explicit security, confidentiality and incident notification clauses in supplier agreements.",
        "typical_evidence": [
            "Contrats comportant des clauses de sécurité",
            "Modèle de clauses sécurité type"
        ],
        "typical_evidence_en": [
            "Contracts containing security clauses",
            "Standard security clause template"
        ],
        "framework_refs": {
            "iso": [
                "A.5.20"
            ],
            "soc2": [
                "CC1.1.5",
                "CC1.3.5",
                "CC2.3.6",
                "CC2.3.11",
                "CC2.3.12",
                "CC9.2.1",
                "CC9.2.5",
                "CC9.2.10",
                "CC9.2.12",
                "P6.1.1",
                "P6.1.3",
                "P6.4.3",
                "P6.5.2"
            ],
            "recyf": [
                "3.B.1"
            ],
            "secnumcloud": [
                "14.5.a",
                "15.2.a",
                "15.5.a",
                "19.1.a",
                "19.1.b",
                "19.1.c",
                "19.1.e",
                "19.1.f",
                "19.1.g",
                "19.1.j",
                "19.1.l",
                "19.1.n",
                "19.1.q",
                "19.5.c"
            ],
            "cra": [
                "2.7",
                "7.4"
            ],
            "hds": [
                "EXI-01.c",
                "EXI-06",
                "EXI-10.b",
                "EXI-17",
                "EXI-18",
                "EXI-19",
                "EXI-20",
                "EXI-21",
                "EXI-22",
                "EXI-23",
                "EXI-24.a",
                "EXI-24.b",
                "EXI-25",
                "EXI-26",
                "EXI-27",
                "EXI-27.a",
                "EXI-27.c",
                "EXI-27.d",
                "EXI-30"
            ],
            "anssi": [
                "3"
            ],
            "lpm": [
                "6.3",
                "7.3",
                "8.2"
            ],
            "loi0520": [
                "ART-12"
            ],
            "nis2": [
                "21.2.d"
            ],
            "dora": [
                "DORA-30",
                "DORA-43"
            ]
        }
    },
    {
        "id": "SUP.AUDIT",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Droit d'audit et contrôle de conformité fournisseur",
        "name_en": "Supplier audit right and compliance check",
        "description": "Prévoir un droit d'audit contractuel et vérifier périodiquement le respect des engagements de sécurité du fournisseur.",
        "description_en": "Provide a contractual audit right and periodically verify the supplier's compliance with security commitments.",
        "typical_evidence": [
            "Clause de droit d'audit",
            "Rapports d'audit fournisseur"
        ],
        "typical_evidence_en": [
            "Audit right clause",
            "Supplier audit reports"
        ],
        "framework_refs": {
            "iso": [
                "A.5.20"
            ],
            "soc2": [
                "CC9.2.8",
                "CC9.2.11",
                "CC9.2.13",
                "P6.4.1"
            ],
            "recyf": [
                "3.B.2"
            ],
            "secnumcloud": [
                "15.2.b",
                "19.1.o",
                "19.1.p",
                "19.1.q",
                "19.1.r"
            ],
            "cra": [
                "8.2.8",
                "8.4.4.2"
            ],
            "anssi": [
                "3"
            ],
            "loi0520": [
                "ART-12"
            ],
            "nis2": [
                "21.2.d"
            ],
            "dora": [
                "DORA-33",
                "DORA-35",
                "DORA-37"
            ]
        }
    },
    {
        "id": "SUP.ICT_RISK",
        "category": "process",
        "csf_function": "identify",
        "name": "Analyse des risques de la chaîne d'approvisionnement TIC",
        "name_en": "ICT supply chain risk analysis",
        "description": "Identifier et évaluer les risques de sécurité introduits par les fournisseurs, sous-traitants et composants de la chaîne d'approvisionnement TIC, et les tracer dans le registre des risques.",
        "description_en": "Identify and assess the security risks introduced by suppliers, subcontractors and components across the ICT supply chain, and record them in the risk register.",
        "typical_evidence": [
            "Analyse de risque fournisseurs TIC",
            "Registre des risques chaîne d'approvisionnement"
        ],
        "typical_evidence_en": [
            "ICT supplier risk assessment",
            "Supply chain risk register"
        ],
        "framework_refs": {
            "iso": [
                "A.5.21"
            ],
            "soc2": [
                "CC3.2.7",
                "CC9.2.2",
                "CC9.2.3"
            ],
            "recyf": [
                "3.A.1"
            ],
            "secnumcloud": [
                "15.1.a",
                "19.6.a"
            ],
            "hds": [
                "EXI-05.o",
                "EXI-14",
                "EXI-30",
                "EXI-30.a"
            ],
            "nis2": [
                "21.2.d"
            ],
            "dora": [
                "DORA-8",
                "DORA-28",
                "DORA-29",
                "DORA-31",
                "DORA-33",
                "DORA-44"
            ]
        }
    },
    {
        "id": "SUP.CONTRACT_REQ",
        "category": "policy",
        "csf_function": "govern",
        "name": "Exigences de sécurité dans les contrats fournisseurs TIC",
        "name_en": "Security requirements in ICT supplier contracts",
        "description": "Intégrer des clauses de sécurité de l'information (obligations, droits d'audit, notification d'incident) dans les contrats des fournisseurs de produits et services TIC.",
        "description_en": "Embed information security clauses (obligations, audit rights, incident notification) into contracts with ICT product and service suppliers.",
        "typical_evidence": [
            "Clauses de sécurité contractuelles",
            "Modèle de contrat fournisseur"
        ],
        "typical_evidence_en": [
            "Contractual security clauses",
            "Supplier contract template"
        ],
        "framework_refs": {
            "iso": [
                "A.5.21"
            ],
            "soc2": [
                "CC9.2.1",
                "CC9.2.12",
                "P6.1.3",
                "P6.4.3"
            ],
            "recyf": [
                "3.B.1"
            ],
            "secnumcloud": [
                "15.2.a",
                "15.2.b",
                "15.5.a"
            ],
            "hds": [
                "EXI-22"
            ],
            "anssi": [
                "42.R"
            ],
            "loi0520": [
                "ART-10",
                "ART-12"
            ],
            "nis2": [
                "21.2.d"
            ],
            "dora": [
                "DORA-30",
                "DORA-35",
                "DORA-37",
                "DORA-41"
            ]
        }
    },
    {
        "id": "SUP.COMPONENT_PROV",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Traçabilité et provenance des composants TIC",
        "name_en": "Traceability and provenance of ICT components",
        "description": "Vérifier l'origine, l'authenticité et l'intégrité des matériels, logiciels et composants acquis afin de prévenir l'introduction d'éléments compromis.",
        "description_en": "Verify the origin, authenticity and integrity of acquired hardware, software and components to prevent introduction of tampered elements.",
        "typical_evidence": [
            "Attestations de provenance des composants",
            "Contrôles d'intégrité à la réception"
        ],
        "typical_evidence_en": [
            "Component provenance attestations",
            "Integrity checks at delivery"
        ],
        "framework_refs": {
            "iso": [
                "A.5.21"
            ],
            "recyf": [
                "5.B.8"
            ],
            "secnumcloud": [
                "12.10.c"
            ],
            "lpm": [
                "4.5"
            ],
            "loi0520": [
                "ART-25"
            ],
            "nis2": [
                "21.2.d"
            ]
        }
    },
    {
        "id": "SUP.SLA_MONITOR",
        "category": "process",
        "csf_function": "detect",
        "name": "Surveillance des niveaux de service fournisseurs",
        "name_en": "Monitoring of supplier service levels",
        "description": "Suivre en continu les indicateurs de service et de sécurité des fournisseurs par rapport aux accords de niveau de service convenus.",
        "description_en": "Continuously track supplier service and security indicators against the agreed service level agreements.",
        "typical_evidence": [
            "Tableau de bord SLA",
            "Rapports de suivi fournisseurs"
        ],
        "typical_evidence_en": [
            "SLA dashboard",
            "Supplier monitoring reports"
        ],
        "framework_refs": {
            "iso": [
                "A.5.22"
            ],
            "soc2": [
                "CC9.2.5",
                "CC9.2.7"
            ],
            "secnumcloud": [
                "15.3.a",
                "19.1.j"
            ],
            "hds": [
                "EXI-21"
            ],
            "dora": [
                "DORA-30"
            ]
        }
    },
    {
        "id": "SUP.PERIODIC_REVIEW",
        "category": "process",
        "csf_function": "govern",
        "name": "Revue périodique des fournisseurs",
        "name_en": "Periodic supplier review",
        "description": "Conduire des revues régulières des fournisseurs pour réévaluer leur posture de sécurité, leur conformité et l'évolution des risques associés.",
        "description_en": "Conduct regular supplier reviews to reassess their security posture, compliance and evolving associated risks.",
        "typical_evidence": [
            "Compte rendu de revue fournisseur",
            "Plan d'actions correctives fournisseur"
        ],
        "typical_evidence_en": [
            "Supplier review minutes",
            "Supplier corrective action plan"
        ],
        "framework_refs": {
            "iso": [
                "A.5.22"
            ],
            "soc2": [
                "CC3.4.5",
                "CC9.2.3",
                "CC9.2.7",
                "CC9.2.13",
                "P6.4.1"
            ],
            "recyf": [
                "3.B.2"
            ],
            "secnumcloud": [
                "15.3.a"
            ],
            "hds": [
                "EXI-14"
            ],
            "dora": [
                "DORA-28"
            ]
        }
    },
    {
        "id": "SUP.CHANGE_MGMT",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Gestion des changements des services fournisseurs",
        "name_en": "Change management of supplier services",
        "description": "Encadrer les modifications apportées aux services fournisseurs (périmètre, technologies, sous-traitance) par une évaluation d'impact sécurité et une validation formelle.",
        "description_en": "Govern changes to supplier services (scope, technology, subcontracting) through a security impact assessment and formal approval.",
        "typical_evidence": [
            "Demandes de changement fournisseur validées",
            "Évaluation d'impact sécurité"
        ],
        "typical_evidence_en": [
            "Approved supplier change requests",
            "Security impact assessment"
        ],
        "framework_refs": {
            "iso": [
                "A.5.22"
            ],
            "soc2": [
                "CC3.4.5",
                "CC9.2.4",
                "CC9.2.6",
                "CC9.2.9"
            ],
            "secnumcloud": [
                "15.2.c",
                "15.4.a",
                "15.4.b",
                "19.6.f"
            ],
            "hds": [
                "EXI-06",
                "EXI-24.a",
                "EXI-24.b"
            ]
        }
    },
    {
        "id": "CLD.POLICY",
        "category": "policy",
        "csf_function": "govern",
        "name": "Politique d'utilisation des services en nuage",
        "name_en": "Cloud services usage policy",
        "description": "Définir les règles d'acquisition, de configuration et d'usage des services cloud, incluant les données autorisées et les exigences de sécurité minimales.",
        "description_en": "Define rules for acquiring, configuring and using cloud services, including permitted data and minimum security requirements.",
        "typical_evidence": [
            "Politique d'usage du cloud",
            "Catalogue de services cloud approuvés"
        ],
        "typical_evidence_en": [
            "Cloud usage policy",
            "Approved cloud services catalogue"
        ],
        "framework_refs": {
            "iso": [
                "A.5.23"
            ],
            "hds": [
                "EXI-28"
            ],
            "loi0520": [
                "ART-49"
            ]
        }
    },
    {
        "id": "CLD.ONBOARDING",
        "category": "process",
        "csf_function": "identify",
        "name": "Évaluation et sélection des fournisseurs cloud",
        "name_en": "Cloud provider evaluation and selection",
        "description": "Évaluer les fournisseurs cloud avant adoption sur la base de leurs certifications, garanties contractuelles et mesures de sécurité offertes.",
        "description_en": "Assess cloud providers before adoption based on their certifications, contractual guarantees and offered security measures.",
        "typical_evidence": [
            "Grille d'évaluation fournisseur cloud",
            "Certifications du fournisseur (ISO 27001, SOC 2)"
        ],
        "typical_evidence_en": [
            "Cloud provider evaluation matrix",
            "Provider certifications (ISO 27001, SOC 2)"
        ],
        "framework_refs": {
            "iso": [
                "A.5.23"
            ],
            "hds": [
                "EXI-31.b"
            ]
        }
    },
    {
        "id": "CLD.SHARED_RESP",
        "category": "policy",
        "csf_function": "govern",
        "name": "Modèle de responsabilité partagée cloud",
        "name_en": "Cloud shared responsibility model",
        "description": "Documenter la répartition des responsabilités de sécurité entre l'organisation et le fournisseur cloud pour chaque service utilisé.",
        "description_en": "Document the split of security responsibilities between the organization and the cloud provider for each service used.",
        "typical_evidence": [
            "Matrice de responsabilité partagée",
            "Cartographie des services cloud"
        ],
        "typical_evidence_en": [
            "Shared responsibility matrix",
            "Cloud services mapping"
        ],
        "framework_refs": {
            "iso": [
                "A.5.23"
            ],
            "soc2": [
                "CC2.3.9",
                "CC2.3.11"
            ],
            "secnumcloud": [
                "9.1.a",
                "9.4.b",
                "17.6.a",
                "19.1.a",
                "19.1.b",
                "19.1.c",
                "19.1.f",
                "19.1.k",
                "19.1.m",
                "19.6.a"
            ],
            "hds": [
                "EXI-13"
            ]
        }
    },
    {
        "id": "CLD.EXIT",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Stratégie de sortie et réversibilité cloud",
        "name_en": "Cloud exit and reversibility strategy",
        "description": "Prévoir les modalités de récupération, migration et suppression sécurisée des données en cas de changement ou de résiliation d'un service cloud.",
        "description_en": "Plan the arrangements for recovery, migration and secure deletion of data upon changing or terminating a cloud service.",
        "typical_evidence": [
            "Plan de réversibilité cloud",
            "Procédure d'export et de suppression des données"
        ],
        "typical_evidence_en": [
            "Cloud reversibility plan",
            "Data export and deletion procedure"
        ],
        "framework_refs": {
            "iso": [
                "A.5.23"
            ],
            "soc2": [
                "CC9.2.9"
            ],
            "secnumcloud": [
                "19.1.g",
                "19.1.h",
                "19.1.i",
                "19.4.a",
                "19.4.b"
            ],
            "hds": [
                "EXI-27",
                "EXI-27.a",
                "EXI-27.b",
                "EXI-27.c",
                "EXI-27.d"
            ],
            "loi0520": [
                "ART-12"
            ],
            "dora": [
                "DORA-29",
                "DORA-30"
            ]
        }
    },
    {
        "id": "INC.PLAN",
        "category": "policy",
        "csf_function": "respond",
        "name": "Plan de gestion des incidents de sécurité",
        "name_en": "Information security incident management plan",
        "description": "Établir un plan documenté couvrant les phases de préparation, détection, réponse et rétablissement des incidents de sécurité de l'information.",
        "description_en": "Establish a documented plan covering the preparation, detection, response and recovery phases of information security incidents.",
        "typical_evidence": [
            "Plan de gestion des incidents",
            "Politique de réponse aux incidents"
        ],
        "typical_evidence_en": [
            "Incident management plan",
            "Incident response policy"
        ],
        "framework_refs": {
            "iso": [
                "A.5.24"
            ],
            "soc2": [
                "CC7.3.1",
                "CC7.4.1",
                "CC7.4.12"
            ],
            "recyf": [
                "12.1",
                "13.7",
                "14.1",
                "14.6",
                "14.7"
            ],
            "secnumcloud": [
                "16.1.a",
                "16.1.b",
                "16.2.b"
            ],
            "cra": [
                "1.2.5",
                "2.2",
                "7.2.b"
            ],
            "hds": [
                "EXI-25"
            ],
            "anssi": [
                "40"
            ],
            "lpm": [
                "1.10",
                "1.11",
                "8.1",
                "10.1",
                "10.12"
            ],
            "loi0520": [
                "ART-8",
                "ART-30",
                "ART-33",
                "ART-36",
                "ART-50"
            ],
            "nis2": [
                "21.1",
                "21.2.b"
            ],
            "dora": [
                "DORA-16",
                "DORA-17"
            ]
        }
    },
    {
        "id": "INC.ROLES",
        "category": "process",
        "csf_function": "govern",
        "name": "Rôles et responsabilités de la réponse aux incidents",
        "name_en": "Incident response roles and responsibilities",
        "description": "Désigner l'équipe de réponse aux incidents et définir clairement les rôles, autorités et responsabilités de chaque intervenant.",
        "description_en": "Designate the incident response team and clearly define the roles, authorities and responsibilities of each participant.",
        "typical_evidence": [
            "Organigramme de l'équipe de réponse",
            "Matrice RACI des incidents"
        ],
        "typical_evidence_en": [
            "Incident response team chart",
            "Incident RACI matrix"
        ],
        "framework_refs": {
            "iso": [
                "A.5.24"
            ],
            "soc2": [
                "CC1.3.4",
                "CC7.4.1"
            ],
            "recyf": [
                "12.1",
                "14.2",
                "14.3",
                "14.9"
            ],
            "secnumcloud": [
                "16.1.b"
            ],
            "lpm": [
                "1.10",
                "8.2",
                "9.1"
            ],
            "dora": [
                "DORA-14",
                "DORA-17"
            ]
        }
    },
    {
        "id": "INC.CONTACT",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Point de contact et signalement des incidents",
        "name_en": "Incident point of contact and reporting",
        "description": "Mettre à disposition un point de contact unique et des canaux permettant à tout collaborateur de signaler rapidement un incident ou événement suspect.",
        "description_en": "Provide a single point of contact and channels enabling any employee to promptly report an incident or suspicious event.",
        "typical_evidence": [
            "Procédure de signalement d'incident",
            "Coordonnées du point de contact"
        ],
        "typical_evidence_en": [
            "Incident reporting procedure",
            "Point of contact details"
        ],
        "framework_refs": {
            "iso": [
                "A.5.24"
            ],
            "soc2": [
                "CC2.2.3",
                "CC2.2.6",
                "CC2.2.10",
                "CC2.3.2",
                "CC2.3.4",
                "CC2.3.8",
                "CC2.3.12"
            ],
            "recyf": [
                "12.1",
                "12.2",
                "14.2",
                "14.3",
                "14.4"
            ],
            "secnumcloud": [
                "16.2.a",
                "16.2.b"
            ],
            "cra": [
                "1.2.5",
                "1.2.6",
                "2.2"
            ],
            "hds": [
                "EXI-07.b",
                "EXI-11.a",
                "EXI-20"
            ],
            "anssi": [
                "40"
            ],
            "lpm": [
                "9.1"
            ],
            "nis2": [
                "21.2.b"
            ]
        }
    },
    {
        "id": "INC.EXERCISE",
        "category": "training",
        "csf_function": "respond",
        "name": "Exercices et simulations d'incidents",
        "name_en": "Incident exercises and simulations",
        "description": "Entraîner régulièrement les équipes par des exercices et simulations afin d'éprouver le plan de réponse et d'entretenir la préparation.",
        "description_en": "Regularly train teams through exercises and simulations to test the response plan and maintain readiness.",
        "typical_evidence": [
            "Scénario d'exercice de crise",
            "Compte rendu de simulation d'incident"
        ],
        "typical_evidence_en": [
            "Crisis exercise scenario",
            "Incident simulation report"
        ],
        "framework_refs": {
            "iso": [
                "A.5.24"
            ],
            "soc2": [
                "CC7.4.10",
                "CC7.5.6"
            ],
            "recyf": [
                "15.1",
                "15.2",
                "15.3",
                "15.4"
            ],
            "loi0520": [
                "ART-43"
            ]
        }
    },
    {
        "id": "INC.TRIAGE",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Qualification des événements de sécurité",
        "name_en": "Security event triage",
        "description": "Analyser les événements de sécurité remontés pour déterminer s'ils constituent des incidents nécessitant une réponse.",
        "description_en": "Analyze reported security events to determine whether they constitute incidents requiring a response.",
        "typical_evidence": [
            "Critères de qualification d'incident",
            "Journal de triage des événements"
        ],
        "typical_evidence_en": [
            "Incident qualification criteria",
            "Event triage log"
        ],
        "framework_refs": {
            "iso": [
                "A.5.25"
            ],
            "soc2": [
                "CC7.3.2",
                "CC7.3.3",
                "CC7.4.7"
            ],
            "recyf": [
                "12.3"
            ],
            "secnumcloud": [
                "12.9.c",
                "16.3.a",
                "16.3.b"
            ],
            "lpm": [
                "8.1",
                "9.2"
            ],
            "loi0520": [
                "ART-33"
            ],
            "nis2": [
                "21.2.b"
            ],
            "dora": [
                "DORA-17",
                "DORA-18"
            ]
        }
    },
    {
        "id": "INC.PRIORITIZE",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Catégorisation et priorisation des incidents",
        "name_en": "Incident categorization and prioritization",
        "description": "Classer les incidents confirmés selon leur gravité et leur impact afin d'allouer les ressources de réponse de manière proportionnée.",
        "description_en": "Classify confirmed incidents by severity and impact to allocate response resources proportionately.",
        "typical_evidence": [
            "Échelle de gravité des incidents",
            "Matrice de priorisation"
        ],
        "typical_evidence_en": [
            "Incident severity scale",
            "Prioritization matrix"
        ],
        "framework_refs": {
            "iso": [
                "A.5.25"
            ],
            "soc2": [
                "CC7.3.3",
                "CC7.3.4",
                "CC7.3.6",
                "CC7.4.2"
            ],
            "recyf": [
                "12.3"
            ],
            "secnumcloud": [
                "16.3.b"
            ],
            "nis2": [
                "21.2.b"
            ],
            "dora": [
                "DORA-17",
                "DORA-18",
                "DORA-20"
            ]
        }
    },
    {
        "id": "INC.RESPOND",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Confinement et traitement des incidents",
        "name_en": "Incident containment and handling",
        "description": "Appliquer les actions de confinement, d'éradication et de rétablissement pour limiter l'impact d'un incident et restaurer un état sûr.",
        "description_en": "Apply containment, eradication and recovery actions to limit an incident's impact and restore a safe state.",
        "typical_evidence": [
            "Fiches de réponse par type d'incident",
            "Journal de traitement de l'incident"
        ],
        "typical_evidence_en": [
            "Response playbooks by incident type",
            "Incident handling log"
        ],
        "framework_refs": {
            "iso": [
                "A.5.26"
            ],
            "soc2": [
                "A1.2.5",
                "CC7.3.1",
                "CC7.4.2",
                "CC7.4.3",
                "CC7.4.4",
                "CC7.4.5",
                "CC7.4.7",
                "CC7.4.8",
                "CC7.5.1",
                "CC8.1.11",
                "CC8.1.13",
                "P6.4.2",
                "P6.5.1"
            ],
            "recyf": [
                "12.4",
                "14.8"
            ],
            "secnumcloud": [
                "16.1.a",
                "16.4.a",
                "16.4.c"
            ],
            "cra": [
                "1.1.2.k"
            ],
            "anssi": [
                "40"
            ],
            "lpm": [
                "8.1",
                "8.2",
                "9.2",
                "10.2",
                "10.3",
                "10.4",
                "10.5",
                "10.6",
                "10.7",
                "10.8",
                "10.10",
                "10.11"
            ],
            "loi0520": [
                "ART-29",
                "ART-37",
                "ART-41"
            ],
            "nis2": [
                "21.2.b"
            ],
            "dora": [
                "DORA-11",
                "DORA-17"
            ]
        }
    },
    {
        "id": "INC.ESCALATE",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Escalade des incidents",
        "name_en": "Incident escalation",
        "description": "Définir les seuils et circuits d'escalade vers la direction et les intervenants spécialisés en fonction de la gravité de l'incident.",
        "description_en": "Define the thresholds and escalation paths to management and specialist responders based on incident severity.",
        "typical_evidence": [
            "Procédure d'escalade",
            "Arbre de décision d'escalade"
        ],
        "typical_evidence_en": [
            "Escalation procedure",
            "Escalation decision tree"
        ],
        "framework_refs": {
            "iso": [
                "A.5.26"
            ],
            "soc2": [
                "CC7.3.2",
                "CC7.4.6"
            ],
            "recyf": [
                "12.4",
                "14.1",
                "14.6"
            ],
            "secnumcloud": [
                "16.4.a",
                "16.4.c"
            ],
            "lpm": [
                "10.1"
            ],
            "loi0520": [
                "ART-36",
                "ART-37"
            ],
            "nis2": [
                "21.2.b"
            ],
            "dora": [
                "DORA-19"
            ]
        }
    },
    {
        "id": "INC.COMMS",
        "category": "process",
        "csf_function": "respond",
        "name": "Communication et notification lors d'un incident",
        "name_en": "Incident communication and notification",
        "description": "Gérer la communication interne et externe pendant un incident, y compris les notifications réglementaires et aux parties prenantes concernées.",
        "description_en": "Manage internal and external communication during an incident, including regulatory and stakeholder notifications.",
        "typical_evidence": [
            "Plan de communication de crise",
            "Registre des notifications d'incident"
        ],
        "typical_evidence_en": [
            "Crisis communication plan",
            "Incident notification log"
        ],
        "framework_refs": {
            "iso": [
                "A.5.26"
            ],
            "soc2": [
                "A1.2.6",
                "CC7.3.5",
                "CC7.3.7",
                "CC7.4.6",
                "CC7.4.9",
                "CC7.4.12",
                "CC7.4.13",
                "CC7.5.2",
                "P6.5.2",
                "P6.6.1",
                "P6.6.2"
            ],
            "recyf": [
                "14.9",
                "14.10"
            ],
            "secnumcloud": [
                "16.1.a",
                "16.1.c",
                "16.2.b",
                "16.2.c",
                "16.2.d",
                "16.4.a"
            ],
            "cra": [
                "1.2.4"
            ],
            "hds": [
                "EXI-19",
                "EXI-20"
            ],
            "loi0520": [
                "ART-8",
                "ART-27",
                "ART-30"
            ],
            "nis2": [
                "21.2.b"
            ],
            "dora": [
                "DORA-14",
                "DORA-19"
            ]
        }
    },
    {
        "id": "INC.REVIEW",
        "category": "process",
        "csf_function": "respond",
        "name": "Retour d'expérience post-incident",
        "name_en": "Post-incident review",
        "description": "Analyser après clôture chaque incident significatif pour identifier les causes profondes et les enseignements exploitables.",
        "description_en": "Analyze each significant incident after closure to identify root causes and actionable lessons learned.",
        "typical_evidence": [
            "Compte rendu de revue post-incident",
            "Analyse des causes profondes"
        ],
        "typical_evidence_en": [
            "Post-incident review report",
            "Root cause analysis"
        ],
        "framework_refs": {
            "iso": [
                "A.5.27"
            ],
            "soc2": [
                "CC7.3.5",
                "CC7.3.7",
                "CC7.4.9",
                "CC7.4.10",
                "CC7.4.11",
                "CC7.5.3",
                "CC7.5.5",
                "P6.3.1"
            ],
            "recyf": [
                "12.5",
                "14.5",
                "15.2"
            ],
            "secnumcloud": [
                "16.5.a"
            ],
            "anssi": [
                "40"
            ],
            "nis2": [
                "21.2.b"
            ],
            "dora": [
                "DORA-13",
                "DORA-22"
            ]
        }
    },
    {
        "id": "INC.KNOWLEDGE",
        "category": "process",
        "csf_function": "identify",
        "name": "Capitalisation et amélioration après incident",
        "name_en": "Post-incident capitalization and improvement",
        "description": "Traduire les enseignements des incidents en actions d'amélioration des mesures, procédures et formations, et suivre leur mise en œuvre.",
        "description_en": "Translate incident lessons into improvement actions on controls, procedures and training, and track their implementation.",
        "typical_evidence": [
            "Plan d'action d'amélioration",
            "Base de connaissances des incidents"
        ],
        "typical_evidence_en": [
            "Improvement action plan",
            "Incident knowledge base"
        ],
        "framework_refs": {
            "iso": [
                "A.5.27"
            ],
            "soc2": [
                "CC7.4.11",
                "CC7.5.2",
                "CC7.5.4",
                "CC7.5.5"
            ],
            "recyf": [
                "12.5",
                "14.5"
            ],
            "secnumcloud": [
                "16.4.b",
                "16.4.c",
                "16.5.a"
            ],
            "loi0520": [
                "ART-47"
            ],
            "dora": [
                "DORA-13",
                "DORA-44"
            ]
        }
    },
    {
        "id": "INC.EVIDENCE",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Collecte et préservation des preuves",
        "name_en": "Evidence collection and preservation",
        "description": "Collecter et préserver les preuves lors d'un incident selon des méthodes garantissant leur intégrité et leur recevabilité.",
        "description_en": "Collect and preserve evidence during an incident using methods that ensure its integrity and admissibility.",
        "typical_evidence": [
            "Procédure de collecte de preuves",
            "Journal d'acquisition des preuves"
        ],
        "typical_evidence_en": [
            "Evidence collection procedure",
            "Evidence acquisition log"
        ],
        "framework_refs": {
            "iso": [
                "A.5.28"
            ],
            "soc2": [
                "CC7.4.7"
            ],
            "recyf": [
                "12.6"
            ],
            "secnumcloud": [
                "16.4.b",
                "16.6.a"
            ],
            "lpm": [
                "8.3",
                "8.4"
            ],
            "loi0520": [
                "ART-41",
                "ART-48"
            ]
        }
    },
    {
        "id": "INC.CUSTODY",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Chaîne de conservation des preuves",
        "name_en": "Evidence chain of custody",
        "description": "Assurer la traçabilité, le stockage sécurisé et le contrôle d'accès des preuves collectées tout au long de leur cycle de vie.",
        "description_en": "Ensure traceability, secure storage and access control of collected evidence throughout its lifecycle.",
        "typical_evidence": [
            "Registre de chaîne de conservation",
            "Coffre de stockage sécurisé des preuves"
        ],
        "typical_evidence_en": [
            "Chain of custody register",
            "Secure evidence storage vault"
        ],
        "framework_refs": {
            "iso": [
                "A.5.28"
            ],
            "recyf": [
                "12.6",
                "12.7",
                "13.3",
                "20.6"
            ],
            "secnumcloud": [
                "16.6.a"
            ],
            "lpm": [
                "8.4",
                "8.5"
            ],
            "loi0520": [
                "ART-41"
            ]
        }
    },
    {
        "id": "BC.DISRUPT_PLAN",
        "category": "process",
        "csf_function": "protect",
        "name": "Maintien de la sécurité pendant une perturbation",
        "name_en": "Maintaining security during disruption",
        "description": "Planifier le maintien d'un niveau de sécurité de l'information adéquat lors des perturbations et des activations de plans de continuité.",
        "description_en": "Plan the maintenance of an adequate information security level during disruptions and continuity plan activations.",
        "typical_evidence": [
            "Plan de continuité intégrant la sécurité",
            "Analyse d'impact sur la sécurité"
        ],
        "typical_evidence_en": [
            "Continuity plan covering security",
            "Security impact analysis"
        ],
        "framework_refs": {
            "iso": [
                "A.5.29"
            ],
            "soc2": [
                "A1.3.1",
                "CC7.4.5",
                "CC9.1.1"
            ],
            "recyf": [
                "13.4",
                "13.6",
                "13.7",
                "14.1",
                "14.7"
            ],
            "secnumcloud": [
                "17.1.a",
                "17.1.b"
            ],
            "cra": [
                "1.1.2.h"
            ],
            "hds": [
                "EXI-25"
            ],
            "lpm": [
                "1.11",
                "10.1",
                "10.2",
                "10.12"
            ],
            "loi0520": [
                "ART-9",
                "ART-37"
            ],
            "nis2": [
                "21.2.c"
            ],
            "dora": [
                "DORA-11",
                "DORA-16"
            ]
        }
    },
    {
        "id": "BC.CONTROLS_DEGRADED",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Mesures de sécurité en mode dégradé",
        "name_en": "Security controls in degraded mode",
        "description": "Définir les mesures compensatoires à appliquer lorsque des contrôles habituels sont indisponibles pendant une perturbation.",
        "description_en": "Define the compensating measures to apply when usual controls are unavailable during a disruption.",
        "typical_evidence": [
            "Procédure de fonctionnement en mode dégradé",
            "Liste des mesures compensatoires"
        ],
        "typical_evidence_en": [
            "Degraded mode operating procedure",
            "List of compensating measures"
        ],
        "framework_refs": {
            "iso": [
                "A.5.29"
            ],
            "recyf": [
                "12.4"
            ],
            "secnumcloud": [
                "17.2.a"
            ],
            "cra": [
                "1.1.2.k"
            ],
            "lpm": [
                "4.7",
                "10.3",
                "10.11"
            ],
            "dora": [
                "DORA-11"
            ]
        }
    },
    {
        "id": "BC.RTO_RPO",
        "category": "process",
        "csf_function": "identify",
        "name": "Objectifs de continuité et de reprise TIC",
        "name_en": "ICT continuity and recovery objectives",
        "description": "Déterminer les objectifs de temps et de point de reprise (RTO/RPO) des services TIC à partir de l'analyse d'impact sur l'activité.",
        "description_en": "Determine the recovery time and recovery point objectives (RTO/RPO) of ICT services from the business impact analysis.",
        "typical_evidence": [
            "Analyse d'impact sur l'activité (BIA)",
            "Objectifs RTO/RPO documentés"
        ],
        "typical_evidence_en": [
            "Business impact analysis (BIA)",
            "Documented RTO/RPO objectives"
        ],
        "framework_refs": {
            "iso": [
                "A.5.30"
            ],
            "soc2": [
                "A1.2.11",
                "CC9.1.1"
            ],
            "recyf": [
                "13.4",
                "13.5"
            ],
            "secnumcloud": [
                "17.1.a",
                "19.1.j"
            ],
            "hds": [
                "EXI-05.n",
                "EXI-18"
            ],
            "lpm": [
                "1.11"
            ],
            "loi0520": [
                "ART-9"
            ],
            "nis2": [
                "21.2.c"
            ],
            "dora": [
                "DORA-11",
                "DORA-12"
            ]
        }
    },
    {
        "id": "BC.REDUNDANCY",
        "category": "process",
        "csf_function": "protect",
        "name": "Redondance et bascule des services TIC",
        "name_en": "ICT redundancy and failover",
        "description": "Mettre en place des composants redondants et des mécanismes de basculement pour soutenir la disponibilité des services TIC critiques.",
        "description_en": "Implement redundant components and failover mechanisms to support the availability of critical ICT services.",
        "typical_evidence": [
            "Architecture de redondance",
            "Configuration de bascule (failover)"
        ],
        "typical_evidence_en": [
            "Redundancy architecture",
            "Failover configuration"
        ],
        "framework_refs": {
            "iso": [
                "A.5.30"
            ],
            "soc2": [
                "A1.2.10",
                "CC8.1.15",
                "CC9.1.1"
            ],
            "recyf": [
                "13.6",
                "14.8",
                "14.10"
            ],
            "secnumcloud": [
                "17.1.a",
                "17.2.a",
                "17.4.a"
            ],
            "cra": [
                "1.1.2.h"
            ],
            "loi0520": [
                "ART-9"
            ],
            "nis2": [
                "21.2.c"
            ],
            "dora": [
                "DORA-12"
            ]
        }
    },
    {
        "id": "BC.DR_TEST",
        "category": "procedure",
        "csf_function": "respond",
        "name": "Tests des plans de reprise TIC",
        "name_en": "ICT recovery plan testing",
        "description": "Tester périodiquement les plans de reprise TIC pour vérifier l'atteinte des objectifs de reprise et corriger les écarts constatés.",
        "description_en": "Periodically test ICT recovery plans to verify achievement of recovery objectives and remediate observed gaps.",
        "typical_evidence": [
            "Rapport de test de reprise",
            "Planning des tests DR"
        ],
        "typical_evidence_en": [
            "Recovery test report",
            "DR test schedule"
        ],
        "framework_refs": {
            "iso": [
                "A.5.30"
            ],
            "soc2": [
                "A1.3.1",
                "CC7.5.6"
            ],
            "recyf": [
                "13.2",
                "13.6",
                "15.2",
                "15.3",
                "15.4"
            ],
            "secnumcloud": [
                "17.3.a"
            ],
            "hds": [
                "EXI-05.n"
            ],
            "anssi": [
                "37.R"
            ],
            "loi0520": [
                "ART-9"
            ],
            "nis2": [
                "21.2.c"
            ],
            "dora": [
                "DORA-11",
                "DORA-24"
            ]
        }
    },
    {
        "id": "LEG.REGISTER",
        "category": "process",
        "csf_function": "govern",
        "name": "Registre des exigences légales et réglementaires",
        "name_en": "Register of legal and regulatory requirements",
        "description": "Identifier, documenter et tenir à jour les exigences légales, statutaires, réglementaires et contractuelles applicables à la sécurité de l'information.",
        "description_en": "Identify, document and keep up to date the legal, statutory, regulatory and contractual requirements applicable to information security.",
        "typical_evidence": [
            "Registre des exigences de conformité",
            "Veille réglementaire"
        ],
        "typical_evidence_en": [
            "Compliance requirements register",
            "Regulatory watch"
        ],
        "framework_refs": {
            "iso": [
                "A.5.31"
            ],
            "soc2": [
                "CC1.3.6",
                "CC3.1.8",
                "CC3.1.14",
                "CC3.4.1"
            ],
            "secnumcloud": [
                "5.2.b",
                "5.3.d",
                "5.3.e",
                "5.3.f",
                "8.3.b",
                "18.1.c",
                "18.1.e",
                "19.1.a",
                "19.1.b",
                "19.1.c",
                "19.1.e",
                "19.1.f",
                "19.2.c",
                "19.2.e",
                "19.6.a",
                "19.6.f"
            ],
            "cra": [
                "2.1",
                "5.6",
                "7.5",
                "8.4.3.b"
            ],
            "hds": [
                "EXI-01.c",
                "EXI-01.d",
                "EXI-03",
                "EXI-05.o",
                "EXI-09",
                "EXI-17",
                "EXI-29.a",
                "EXI-30",
                "EXI-30.a"
            ],
            "lpm": [
                "2.14"
            ],
            "loi0520": [
                "ART-3"
            ]
        }
    },
    {
        "id": "LEG.CRYPTO_EXPORT",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Conformité réglementaire de la cryptographie",
        "name_en": "Cryptography regulatory compliance",
        "description": "Vérifier la conformité de l'usage des moyens cryptographiques aux réglementations d'import, d'export et d'usage applicables.",
        "description_en": "Verify that the use of cryptographic means complies with applicable import, export and usage regulations.",
        "typical_evidence": [
            "Analyse de conformité cryptographique",
            "Autorisations d'usage réglementaire"
        ],
        "typical_evidence_en": [
            "Cryptographic compliance analysis",
            "Regulatory usage authorizations"
        ],
        "framework_refs": {
            "iso": [
                "A.5.31"
            ]
        }
    },
    {
        "id": "LEG.IPR",
        "category": "policy",
        "csf_function": "govern",
        "name": "Respect des droits de propriété intellectuelle",
        "name_en": "Compliance with intellectual property rights",
        "description": "Établir des règles garantissant le respect des droits de propriété intellectuelle des tiers et la protection de ceux de l'organisation.",
        "description_en": "Establish rules ensuring respect for third-party intellectual property rights and protection of the organization's own.",
        "typical_evidence": [
            "Politique de propriété intellectuelle",
            "Sensibilisation aux droits d'auteur"
        ],
        "typical_evidence_en": [
            "Intellectual property policy",
            "Copyright awareness"
        ],
        "framework_refs": {
            "iso": [
                "A.5.32"
            ],
            "secnumcloud": [
                "8.1.c"
            ]
        }
    },
    {
        "id": "LEG.LICENSE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Gestion des licences logicielles",
        "name_en": "Software license management",
        "description": "Inventorier les logiciels utilisés et vérifier la conformité aux conditions de licence pour éviter tout usage non autorisé.",
        "description_en": "Inventory the software used and verify compliance with license terms to prevent any unauthorized use.",
        "typical_evidence": [
            "Inventaire des licences logicielles",
            "Rapport de conformité des licences"
        ],
        "typical_evidence_en": [
            "Software license inventory",
            "License compliance report"
        ],
        "framework_refs": {
            "iso": [
                "A.5.32"
            ],
            "secnumcloud": [
                "8.1.b",
                "8.1.c"
            ]
        }
    },
    {
        "id": "REC.RETENTION",
        "category": "policy",
        "csf_function": "govern",
        "name": "Politique de rétention des enregistrements",
        "name_en": "Records retention policy",
        "description": "Définir les durées de conservation et les modalités d'archivage et de destruction des enregistrements selon les exigences légales et métier.",
        "description_en": "Define retention periods and the arrangements for archiving and destroying records according to legal and business requirements.",
        "typical_evidence": [
            "Politique de rétention et d'archivage",
            "Calendrier de conservation"
        ],
        "typical_evidence_en": [
            "Retention and archiving policy",
            "Retention schedule"
        ],
        "framework_refs": {
            "iso": [
                "A.5.33"
            ],
            "soc2": [
                "C1.1.2",
                "C1.2.1",
                "P3.2.2",
                "P4.2.1"
            ],
            "recyf": [
                "20.5"
            ],
            "secnumcloud": [
                "12.6.a",
                "12.6.c",
                "16.4.b"
            ],
            "cra": [
                "7.7",
                "8.2.10",
                "8.4.3.2.7",
                "8.4.4.2.2",
                "8.4.4.2.3",
                "8.4.5.a",
                "8.4.6",
                "8.4.6.1",
                "8.4.6.2",
                "8.4.6.4"
            ],
            "loi0520": [
                "ART-26"
            ]
        }
    },
    {
        "id": "REC.PROTECT",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Protection et intégrité des enregistrements",
        "name_en": "Records protection and integrity",
        "description": "Protéger les enregistrements contre la perte, l'altération, la falsification et l'accès non autorisé sur toute leur durée de conservation.",
        "description_en": "Protect records against loss, alteration, falsification and unauthorized access throughout their retention period.",
        "typical_evidence": [
            "Contrôles d'accès aux archives",
            "Mécanismes d'intégrité des enregistrements"
        ],
        "typical_evidence_en": [
            "Archive access controls",
            "Records integrity mechanisms"
        ],
        "framework_refs": {
            "iso": [
                "A.5.33"
            ],
            "soc2": [
                "C1.1.3",
                "CC2.1.4",
                "CC2.1.8",
                "P4.2.2",
                "P6.2.1",
                "P6.3.1",
                "P7.1.1",
                "PP1.5"
            ],
            "secnumcloud": [
                "16.6.a"
            ],
            "cra": [
                "1.1.2.f"
            ],
            "lpm": [
                "1.14",
                "2.13",
                "3.9",
                "8.5",
                "20.14"
            ],
            "loi0520": [
                "ART-22"
            ]
        }
    },
    {
        "id": "PRIV.PII_INVENTORY",
        "category": "process",
        "csf_function": "identify",
        "name": "Inventaire des données à caractère personnel",
        "name_en": "Personal data inventory",
        "description": "Cartographier les traitements et flux de données à caractère personnel pour identifier les obligations de protection de la vie privée applicables.",
        "description_en": "Map personal data processing activities and flows to identify the applicable privacy protection obligations.",
        "typical_evidence": [
            "Registre des traitements de DCP",
            "Cartographie des flux de données"
        ],
        "typical_evidence_en": [
            "PII processing register",
            "Data flow mapping"
        ],
        "framework_refs": {
            "iso": [
                "A.5.34"
            ],
            "soc2": [
                "CC1.3.6",
                "CC7.3.6",
                "P4.3.1",
                "P6.2.1",
                "P6.7.2"
            ],
            "secnumcloud": [
                "5.2.b",
                "5.3.c",
                "5.3.f",
                "6.1.h",
                "8.3.b",
                "15.1.b",
                "19.5.a",
                "19.5.b",
                "19.5.c"
            ],
            "cra": [
                "1.1.2.g"
            ],
            "hds": [
                "EXI-01.d",
                "EXI-04",
                "EXI-28",
                "EXI-31.a"
            ],
            "loi0520": [
                "ART-45"
            ]
        }
    },
    {
        "id": "PRIV.PII_CONTROLS",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Mesures de protection de la vie privée",
        "name_en": "Privacy protection measures",
        "description": "Appliquer des mesures techniques et organisationnelles (minimisation, pseudonymisation, chiffrement) protégeant les données à caractère personnel.",
        "description_en": "Apply technical and organizational measures (minimization, pseudonymization, encryption) protecting personal data.",
        "typical_evidence": [
            "Mesures de protection des DCP",
            "Analyse d'impact vie privée (AIPD)"
        ],
        "typical_evidence_en": [
            "PII protection measures",
            "Data protection impact assessment (DPIA)"
        ],
        "framework_refs": {
            "iso": [
                "A.5.34"
            ],
            "soc2": [
                "CC6.1.13",
                "CC8.1.18",
                "P3.2.2",
                "P4.1.1",
                "P4.2.2",
                "P5.1.2",
                "P6.1.1",
                "P6.1.2",
                "P7.1.1",
                "P8.1.2"
            ],
            "secnumcloud": [
                "6.1.e",
                "6.1.f",
                "6.1.g",
                "6.1.h",
                "7.3.a",
                "16.1.c",
                "18.1.c",
                "19.1.q",
                "19.5.a",
                "19.5.b",
                "19.5.c"
            ],
            "cra": [
                "1.1.2.g",
                "3.1.15",
                "3.1.17",
                "3.1.18",
                "4.2"
            ],
            "hds": [
                "EXI-09",
                "EXI-19",
                "EXI-26",
                "EXI-27.d"
            ],
            "loi0520": [
                "ART-45"
            ]
        }
    },
    {
        "id": "REV.INDEPENDENT",
        "category": "process",
        "csf_function": "govern",
        "name": "Revue indépendante de la sécurité de l'information",
        "name_en": "Independent review of information security",
        "description": "Faire réaliser à intervalles planifiés une revue indépendante de l'approche et de la mise en œuvre de la sécurité de l'information.",
        "description_en": "Have an independent review of the information security approach and implementation carried out at planned intervals.",
        "typical_evidence": [
            "Rapport de revue indépendante",
            "Plan d'actions de suivi"
        ],
        "typical_evidence_en": [
            "Independent review report",
            "Follow-up action plan"
        ],
        "framework_refs": {
            "iso": [
                "A.5.35"
            ],
            "soc2": [
                "CC1.2.3",
                "CC1.2.4",
                "CC2.3.3",
                "CC4.1.7"
            ],
            "recyf": [
                "17.1",
                "17.2"
            ],
            "secnumcloud": [
                "15.2.b",
                "18.1.e",
                "18.2.2.a",
                "18.2.3.a",
                "19.1.o",
                "19.1.p",
                "19.1.r"
            ],
            "cra": [
                "5.7",
                "8.2.1",
                "8.2.2",
                "8.2.4.1",
                "8.2.6",
                "8.4.3.3",
                "8.4.4.3"
            ],
            "hds": [
                "EXI-15.b"
            ],
            "anssi": [
                "38.R"
            ],
            "lpm": [
                "1.8",
                "2.4",
                "2.5"
            ],
            "nis2": [
                "21.2.f"
            ],
            "dora": [
                "DORA-24",
                "DORA-27"
            ]
        }
    },
    {
        "id": "CMP.POLICY_CHECK",
        "category": "process",
        "csf_function": "govern",
        "name": "Contrôle de conformité aux politiques de sécurité",
        "name_en": "Compliance check against security policies",
        "description": "Vérifier régulièrement que les activités et systèmes respectent les politiques, règles et normes de sécurité internes.",
        "description_en": "Regularly verify that activities and systems comply with internal security policies, rules and standards.",
        "typical_evidence": [
            "Rapport de contrôle de conformité",
            "Registre des écarts et actions"
        ],
        "typical_evidence_en": [
            "Compliance check report",
            "Non-conformity and action log"
        ],
        "framework_refs": {
            "iso": [
                "A.5.36"
            ],
            "soc2": [
                "CC1.1.3",
                "CC1.5.1",
                "CC1.5.5",
                "CC4.1.5",
                "CC5.3.3",
                "P8.1.4",
                "P8.1.6"
            ],
            "recyf": [
                "2.C.1",
                "2.C.3"
            ],
            "secnumcloud": [
                "18.1.c",
                "18.1.d",
                "18.3.a",
                "18.4.a"
            ],
            "cra": [
                "2.6",
                "5.5",
                "5.6",
                "5.7",
                "6.a",
                "7.5",
                "8.1.1",
                "8.1.3",
                "8.1.4.1",
                "8.2.1",
                "8.2.3",
                "8.2.6",
                "8.2.b",
                "8.3.1",
                "8.3.3.1",
                "8.4.1",
                "8.4.3.2",
                "8.4.3.b",
                "8.4.5.1"
            ],
            "lpm": [
                "1.8",
                "1.12",
                "2.6"
            ],
            "loi0520": [
                "ART-3",
                "ART-34",
                "ART-40"
            ],
            "nis2": [
                "21.2.f"
            ]
        }
    },
    {
        "id": "CMP.TECH_COMPLIANCE",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Vérification technique de conformité",
        "name_en": "Technical compliance verification",
        "description": "Contrôler la conformité technique des systèmes aux référentiels de configuration et de durcissement par des vérifications automatisées.",
        "description_en": "Check the technical compliance of systems against configuration and hardening baselines through automated verification.",
        "typical_evidence": [
            "Rapport de scan de conformité",
            "Référentiels de durcissement"
        ],
        "typical_evidence_en": [
            "Compliance scan report",
            "Hardening baselines"
        ],
        "framework_refs": {
            "iso": [
                "A.5.36"
            ],
            "soc2": [
                "CC4.1.8",
                "CC7.1.2"
            ],
            "recyf": [
                "2.C.1",
                "7.B.5",
                "11.B.6",
                "11.B.7",
                "17.3",
                "18.4"
            ],
            "secnumcloud": [
                "18.2.1.b",
                "18.4.a"
            ],
            "cra": [
                "5.5",
                "7.6",
                "8.2.4.2",
                "8.2.4.3",
                "8.2.4.4",
                "8.2.6",
                "8.4.3.2.5",
                "8.4.3.2.8"
            ],
            "anssi": [
                "38.R"
            ],
            "lpm": [
                "2.3"
            ],
            "loi0520": [
                "ART-3",
                "ART-40"
            ],
            "nis2": [
                "21.2.f"
            ]
        }
    },
    {
        "id": "OPS.PROCEDURES",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Procédures d'exploitation documentées",
        "name_en": "Documented operating procedures",
        "description": "Rédiger et maintenir des procédures d'exploitation pour les activités opérationnelles de traitement de l'information afin d'en assurer la cohérence.",
        "description_en": "Write and maintain operating procedures for information processing operational activities to ensure consistency.",
        "typical_evidence": [
            "Procédures d'exploitation",
            "Modes opératoires documentés"
        ],
        "typical_evidence_en": [
            "Operating procedures",
            "Documented work instructions"
        ],
        "framework_refs": {
            "iso": [
                "A.5.37"
            ],
            "soc2": [
                "CC5.3.1",
                "CC5.3.3",
                "CC8.1.4"
            ],
            "recyf": [
                "5.B.1",
                "13.1"
            ],
            "secnumcloud": [
                "12.1.a"
            ],
            "cra": [
                "2.8",
                "2.8.a",
                "2.8.b",
                "2.8.c",
                "2.8.e",
                "2.8.f",
                "7.1.b",
                "7.2.c",
                "8.3.2",
                "8.4.3.2.3"
            ],
            "hds": [
                "EXI-05.l",
                "EXI-07.a",
                "EXI-07.b"
            ],
            "anssi": [
                "6.R"
            ],
            "lpm": [
                "1.9",
                "4.1"
            ]
        }
    },
    {
        "id": "OPS.VERSION_CTRL",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Gestion des versions et accès aux procédures",
        "name_en": "Procedure versioning and access management",
        "description": "Assurer le contrôle des versions, l'approbation et la mise à disposition des procédures d'exploitation aux personnes autorisées.",
        "description_en": "Ensure version control, approval and availability of operating procedures to authorized personnel.",
        "typical_evidence": [
            "Historique des versions des procédures",
            "Registre d'approbation documentaire"
        ],
        "typical_evidence_en": [
            "Procedure version history",
            "Document approval register"
        ],
        "framework_refs": {
            "iso": [
                "A.5.37"
            ],
            "soc2": [
                "CC5.3.6"
            ],
            "secnumcloud": [
                "12.1.a",
                "14.2.c"
            ],
            "cra": [
                "2.8",
                "2.9",
                "5.1",
                "7.1.b",
                "7.8"
            ]
        }
    },
    {
        "id": "HR.BACKGROUND_CHECK",
        "category": "process",
        "csf_function": "identify",
        "name": "Vérification des antécédents des candidats",
        "name_en": "Candidate background verification",
        "description": "Conduire des contrôles proportionnés au poste (casier, références professionnelles, historique d'emploi) avant l'embauche afin de réduire le risque lié aux personnes accédant aux informations sensibles.",
        "description_en": "Run role-proportionate checks (criminal record, professional references, employment history) before hiring to reduce the risk posed by people accessing sensitive information.",
        "typical_evidence": [
            "Politique de vérification préembauche",
            "Rapports de contrôle archivés"
        ],
        "typical_evidence_en": [
            "Pre-employment screening policy",
            "Archived check reports"
        ],
        "framework_refs": {
            "iso": [
                "A.6.1"
            ],
            "soc2": [
                "CC1.4.5"
            ],
            "secnumcloud": [
                "6.5.b"
            ],
            "lpm": [
                "1.6"
            ],
            "nis2": [
                "21.2.i"
            ]
        }
    },
    {
        "id": "HR.IDENTITY_VERIF",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Vérification d'identité et des qualifications",
        "name_en": "Identity and qualification verification",
        "description": "Confirmer l'identité officielle du candidat et authentifier ses diplômes et certifications déterminants pour le poste au moyen de justificatifs originaux.",
        "description_en": "Confirm the candidate's official identity and authenticate the diplomas and certifications material to the role using original supporting documents.",
        "typical_evidence": [
            "Copies de pièces d'identité vérifiées",
            "Attestations de diplômes contrôlées"
        ],
        "typical_evidence_en": [
            "Verified identity documents",
            "Checked qualification attestations"
        ],
        "framework_refs": {
            "iso": [
                "A.6.1"
            ],
            "soc2": [
                "CC1.4.5",
                "CC1.4.6"
            ],
            "secnumcloud": [
                "6.5.b"
            ]
        }
    },
    {
        "id": "HR.CONTRACT_SECURITY_CLAUSE",
        "category": "policy",
        "csf_function": "govern",
        "name": "Clauses de sécurité dans le contrat de travail",
        "name_en": "Security clauses in the employment contract",
        "description": "Intégrer dans le contrat de travail les obligations de sécurité de l'information, l'engagement à respecter les politiques internes et les conséquences en cas de manquement.",
        "description_en": "Embed information security obligations, a commitment to comply with internal policies, and the consequences of breaches into the employment contract.",
        "typical_evidence": [
            "Modèle de contrat avec clauses sécurité",
            "Contrats signés"
        ],
        "typical_evidence_en": [
            "Contract template with security clauses",
            "Signed contracts"
        ],
        "framework_refs": {
            "iso": [
                "A.6.2"
            ],
            "soc2": [
                "CC1.1.2"
            ],
            "recyf": [
                "4.1",
                "4.3"
            ],
            "secnumcloud": [
                "7.2.a",
                "7.2.b",
                "7.2.c"
            ],
            "nis2": [
                "21.2.i"
            ]
        }
    },
    {
        "id": "HR.AWARENESS_PROGRAM",
        "category": "training",
        "csf_function": "protect",
        "name": "Programme de sensibilisation à la sécurité",
        "name_en": "Security awareness programme",
        "description": "Déployer un programme récurrent de sensibilisation couvrant les bonnes pratiques, les menaces courantes et les politiques, avec suivi de la participation du personnel.",
        "description_en": "Deploy a recurring awareness programme covering good practices, common threats and policies, tracking staff participation.",
        "typical_evidence": [
            "Calendrier de sensibilisation",
            "Registre de participation"
        ],
        "typical_evidence_en": [
            "Awareness schedule",
            "Attendance register"
        ],
        "framework_refs": {
            "iso": [
                "A.6.3"
            ],
            "soc2": [
                "CC2.2.8",
                "CC2.2.9"
            ],
            "recyf": [
                "4.2",
                "15.1"
            ],
            "secnumcloud": [
                "7.3.a",
                "7.3.b",
                "7.3.c"
            ],
            "hds": [
                "EXI-05.m",
                "EXI-10.a",
                "EXI-10.b"
            ],
            "anssi": [
                "2",
                "30"
            ],
            "lpm": [
                "1.5"
            ],
            "loi0520": [
                "ART-44"
            ],
            "nis2": [
                "21.2.g"
            ]
        }
    },
    {
        "id": "HR.PHISHING_SIM",
        "category": "training",
        "csf_function": "detect",
        "name": "Exercices d'hameçonnage simulé",
        "name_en": "Simulated phishing exercises",
        "description": "Organiser des campagnes d'hameçonnage fictif pour mesurer la vigilance des employés et déclencher une remédiation ciblée auprès des personnes ayant échoué.",
        "description_en": "Run mock phishing campaigns to measure employee vigilance and trigger targeted remediation for those who fail.",
        "typical_evidence": [
            "Rapports de campagnes de phishing",
            "Taux de clic et de signalement"
        ],
        "typical_evidence_en": [
            "Phishing campaign reports",
            "Click and report rates"
        ],
        "framework_refs": {
            "iso": [
                "A.6.3"
            ],
            "anssi": [
                "24"
            ],
            "nis2": [
                "21.2.g"
            ]
        }
    },
    {
        "id": "HR.ROLE_TRAINING",
        "category": "training",
        "csf_function": "protect",
        "name": "Formation ciblée selon le rôle",
        "name_en": "Role-specific training",
        "description": "Dispenser des formations adaptées aux responsabilités de chaque fonction sensible (administrateurs, développeurs, RH) afin d'ancrer les exigences de sécurité propres au poste.",
        "description_en": "Deliver training tailored to the responsibilities of each sensitive function (administrators, developers, HR) to embed role-specific security requirements.",
        "typical_evidence": [
            "Parcours de formation par rôle",
            "Attestations de suivi"
        ],
        "typical_evidence_en": [
            "Role-based training paths",
            "Completion certificates"
        ],
        "framework_refs": {
            "iso": [
                "A.6.3"
            ],
            "soc2": [
                "CC1.4.3",
                "CC1.4.6",
                "CC1.4.7",
                "CC5.3.5"
            ],
            "recyf": [
                "4.5"
            ],
            "secnumcloud": [
                "7.3.b"
            ],
            "anssi": [
                "1"
            ],
            "lpm": [
                "1.5"
            ],
            "loi0520": [
                "ART-43"
            ],
            "nis2": [
                "21.2.g"
            ]
        }
    },
    {
        "id": "HR.DISCIPLINARY_PROCESS",
        "category": "process",
        "csf_function": "respond",
        "name": "Procédure disciplinaire formalisée",
        "name_en": "Formal disciplinary process",
        "description": "Définir un processus disciplinaire documenté et appliqué de manière cohérente pour traiter les violations avérées des politiques de sécurité, avec paliers d'escalade proportionnés.",
        "description_en": "Define a documented and consistently applied disciplinary process to handle confirmed security policy violations, with proportionate escalation tiers.",
        "typical_evidence": [
            "Procédure disciplinaire",
            "Dossiers de sanctions anonymisés"
        ],
        "typical_evidence_en": [
            "Disciplinary procedure",
            "Anonymised sanction records"
        ],
        "framework_refs": {
            "iso": [
                "A.6.4"
            ],
            "soc2": [
                "CC1.1.3",
                "CC1.1.4",
                "CC1.5.5",
                "CC1.5.6",
                "CC7.4.14",
                "P8.1.5"
            ],
            "secnumcloud": [
                "7.4.a",
                "7.4.b"
            ]
        }
    },
    {
        "id": "HR.OFFBOARDING_ACCESS",
        "category": "process",
        "csf_function": "protect",
        "name": "Révocation des accès au départ",
        "name_en": "Access revocation on departure",
        "description": "Retirer sans délai les droits d'accès logiques et physiques lors d'un départ ou d'un changement de fonction, en coordination entre RH, IT et sécurité.",
        "description_en": "Promptly remove logical and physical access rights on departure or role change, coordinated between HR, IT and security.",
        "typical_evidence": [
            "Procédure de départ (offboarding)",
            "Journaux de désactivation de comptes"
        ],
        "typical_evidence_en": [
            "Offboarding procedure",
            "Account deactivation logs"
        ],
        "framework_refs": {
            "iso": [
                "A.6.5"
            ],
            "soc2": [
                "CC6.2.3",
                "CC6.3.2",
                "CC6.4.2"
            ],
            "recyf": [
                "4.4",
                "10.A.5"
            ],
            "secnumcloud": [
                "7.5.a",
                "9.2.c",
                "9.3.g"
            ],
            "anssi": [
                "6"
            ],
            "lpm": [
                "11.4"
            ],
            "nis2": [
                "21.2.i"
            ]
        }
    },
    {
        "id": "HR.ASSET_RETURN",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Restitution des actifs au départ",
        "name_en": "Return of assets on departure",
        "description": "Récupérer et enregistrer la remise de tous les actifs confiés (matériel, badges, supports, documents) avant la fin effective du contrat.",
        "description_en": "Recover and record the handover of all assigned assets (equipment, badges, media, documents) before the contract effectively ends.",
        "typical_evidence": [
            "Formulaire de restitution d'actifs signé",
            "Inventaire des équipements rendus"
        ],
        "typical_evidence_en": [
            "Signed asset return form",
            "Inventory of returned equipment"
        ],
        "framework_refs": {
            "iso": [
                "A.6.5"
            ],
            "soc2": [
                "CC6.4.3"
            ],
            "recyf": [
                "4.4"
            ],
            "secnumcloud": [
                "8.2.a"
            ],
            "anssi": [
                "6"
            ]
        }
    },
    {
        "id": "HR.EXIT_OBLIGATIONS",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Rappel des obligations persistantes au départ",
        "name_en": "Reminder of surviving obligations on departure",
        "description": "Rappeler formellement lors de l'entretien de départ les engagements qui perdurent après le contrat, notamment la confidentialité et la non-divulgation.",
        "description_en": "Formally remind departing staff during the exit interview of commitments that survive the contract, notably confidentiality and non-disclosure.",
        "typical_evidence": [
            "Compte rendu d'entretien de départ",
            "Accusé de rappel des obligations"
        ],
        "typical_evidence_en": [
            "Exit interview record",
            "Acknowledgement of surviving obligations"
        ],
        "framework_refs": {
            "iso": [
                "A.6.5"
            ],
            "recyf": [
                "4.3"
            ],
            "secnumcloud": [
                "7.5.a",
                "8.2.a"
            ]
        }
    },
    {
        "id": "HR.NDA",
        "category": "policy",
        "csf_function": "protect",
        "name": "Accords de non-divulgation",
        "name_en": "Non-disclosure agreements",
        "description": "Faire signer des accords de confidentialité aux personnes accédant à des informations sensibles, dès le début de la relation et à leur renouvellement, avec recours juridique en cas de violation.",
        "description_en": "Have people accessing sensitive information sign confidentiality agreements at the start of the relationship and on renewal, with legal recourse in case of breach.",
        "typical_evidence": [
            "Modèle de NDA",
            "Registre des accords signés"
        ],
        "typical_evidence_en": [
            "NDA template",
            "Register of signed agreements"
        ],
        "framework_refs": {
            "iso": [
                "A.6.6"
            ],
            "soc2": [
                "CC1.1.5",
                "CC2.3.6",
                "CC9.2.10"
            ],
            "recyf": [
                "4.3"
            ],
            "secnumcloud": [
                "7.2.a",
                "7.2.b",
                "7.2.c",
                "15.5.a",
                "19.1.k",
                "19.1.l"
            ],
            "loi0520": [
                "ART-21",
                "ART-39"
            ],
            "nis2": [
                "21.2.i"
            ]
        }
    },
    {
        "id": "HR.REMOTE_POLICY",
        "category": "policy",
        "csf_function": "protect",
        "name": "Politique de travail à distance",
        "name_en": "Remote working policy",
        "description": "Encadrer par une politique les conditions de télétravail, incluant la protection des données hors site, l'environnement de travail et l'usage des équipements personnels.",
        "description_en": "Govern remote-working conditions through a policy covering off-site data protection, the working environment and the use of personal devices.",
        "typical_evidence": [
            "Politique de télétravail",
            "Charte d'engagement des télétravailleurs"
        ],
        "typical_evidence_en": [
            "Remote working policy",
            "Teleworker acceptance charter"
        ],
        "framework_refs": {
            "iso": [
                "A.6.7"
            ],
            "recyf": [
                "4.1",
                "8.5"
            ],
            "secnumcloud": [
                "12.12.c",
                "19.1.n"
            ],
            "anssi": [
                "30",
                "33"
            ],
            "lpm": [
                "18.2"
            ]
        }
    },
    {
        "id": "HR.REMOTE_SECURE_ACCESS",
        "category": "process",
        "csf_function": "protect",
        "name": "Accès distant sécurisé et chiffré",
        "name_en": "Secure encrypted remote access",
        "description": "Imposer un accès aux systèmes de l'entreprise via un canal chiffré (VPN) avec authentification forte pour toute connexion effectuée depuis l'extérieur des locaux.",
        "description_en": "Require access to corporate systems through an encrypted channel (VPN) with strong authentication for any connection made from outside the premises.",
        "typical_evidence": [
            "Configuration VPN et MFA",
            "Journaux de connexions distantes"
        ],
        "typical_evidence_en": [
            "VPN and MFA configuration",
            "Remote connection logs"
        ],
        "framework_refs": {
            "iso": [
                "A.6.7"
            ],
            "soc2": [
                "CC6.6.2",
                "CC6.6.3"
            ],
            "recyf": [
                "8.1",
                "8.2",
                "8.3"
            ],
            "secnumcloud": [
                "12.12.c",
                "12.13.a",
                "19.1.n",
                "19.2.c",
                "19.2.e"
            ],
            "cra": [
                "3.1.5"
            ],
            "hds": [
                "EXI-29.a"
            ],
            "anssi": [
                "32",
                "32.R"
            ],
            "lpm": [
                "15.4",
                "15.7",
                "18.1",
                "18.2",
                "18.3"
            ],
            "nis2": [
                "21.2.j"
            ]
        }
    },
    {
        "id": "HR.EVENT_REPORTING",
        "category": "process",
        "csf_function": "detect",
        "name": "Canal de signalement des événements de sécurité",
        "name_en": "Security event reporting channel",
        "description": "Mettre à disposition un canal clair et accessible permettant à tout employé de signaler rapidement un événement de sécurité, avec prise en charge et suivi.",
        "description_en": "Provide a clear, accessible channel allowing any employee to promptly report a security event, with intake and follow-up.",
        "typical_evidence": [
            "Procédure de signalement d'événements",
            "Registre des signalements traités"
        ],
        "typical_evidence_en": [
            "Event reporting procedure",
            "Register of handled reports"
        ],
        "framework_refs": {
            "iso": [
                "A.6.8"
            ],
            "soc2": [
                "CC2.2.3",
                "CC2.2.6",
                "CC2.2.10",
                "CC2.3.2",
                "CC2.3.4"
            ],
            "recyf": [
                "12.2"
            ],
            "secnumcloud": [
                "16.2.a"
            ],
            "cra": [
                "1.2.6"
            ]
        }
    },
    {
        "id": "HR.REPORTING_AWARENESS",
        "category": "training",
        "csf_function": "detect",
        "name": "Sensibilisation au réflexe de signalement",
        "name_en": "Reporting-reflex awareness",
        "description": "Communiquer régulièrement sur ce qui constitue un événement à signaler et sur la manière de le faire, afin d'ancrer le réflexe de remontée sans crainte de sanction.",
        "description_en": "Communicate regularly on what constitutes a reportable event and how to report it, embedding the reporting reflex without fear of sanction.",
        "typical_evidence": [
            "Supports de communication sur le signalement",
            "Indicateurs de volume de signalements"
        ],
        "typical_evidence_en": [
            "Reporting communication materials",
            "Reporting-volume indicators"
        ],
        "framework_refs": {
            "iso": [
                "A.6.8"
            ],
            "soc2": [
                "CC2.2.6"
            ],
            "recyf": [
                "12.2"
            ],
            "secnumcloud": [
                "16.2.a"
            ],
            "anssi": [
                "2"
            ],
            "loi0520": [
                "ART-44"
            ]
        }
    },
    {
        "id": "PHY.PERIMETER_DEFINITION",
        "category": "policy",
        "csf_function": "protect",
        "name": "Définition des périmètres de sécurité physique",
        "name_en": "Definition of physical security perimeters",
        "description": "Identifier et documenter les périmètres protégeant les zones critiques, en distinguant les niveaux de sensibilité et les exigences d'accès associées.",
        "description_en": "Identify and document the perimeters protecting critical areas, distinguishing sensitivity levels and associated access requirements.",
        "typical_evidence": [
            "Plan des zones et périmètres",
            "Classification des locaux sensibles"
        ],
        "typical_evidence_en": [
            "Zone and perimeter map",
            "Classification of sensitive premises"
        ],
        "framework_refs": {
            "iso": [
                "A.7.1"
            ],
            "recyf": [
                "6.1"
            ],
            "secnumcloud": [
                "11.1.1.a",
                "11.1.3.a",
                "11.1.a",
                "11.1.b",
                "11.2.1.a",
                "11.2.1.c",
                "11.2.1.d",
                "11.2.2.a",
                "11.2.2.c",
                "11.2.2.d",
                "11.2.2.j",
                "11.4.a",
                "11.5.a",
                "11.5.b",
                "11.10.a"
            ],
            "lpm": [
                "1.6"
            ],
            "nis2": [
                "21.2"
            ]
        }
    },
    {
        "id": "PHY.PHYSICAL_BARRIERS",
        "category": "process",
        "csf_function": "protect",
        "name": "Barrières physiques de protection",
        "name_en": "Physical protection barriers",
        "description": "Mettre en place des barrières matérielles (murs, clôtures, portes renforcées) délimitant les périmètres et empêchant le franchissement non autorisé.",
        "description_en": "Install physical barriers (walls, fences, reinforced doors) that delimit perimeters and prevent unauthorised crossing.",
        "typical_evidence": [
            "Inventaire des barrières et accès",
            "Constats de contrôle d'intégrité"
        ],
        "typical_evidence_en": [
            "Inventory of barriers and access points",
            "Integrity inspection records"
        ],
        "framework_refs": {
            "iso": [
                "A.7.1"
            ],
            "recyf": [
                "6.2"
            ],
            "secnumcloud": [
                "11.1.1.a",
                "11.1.a",
                "11.2.2.j",
                "11.5.b"
            ]
        }
    },
    {
        "id": "PHY.ENTRY_ACCESS_CONTROL",
        "category": "process",
        "csf_function": "protect",
        "name": "Contrôle d'accès des entrées physiques",
        "name_en": "Physical entry access control",
        "description": "Contrôler les points d'entrée par un dispositif de badges ou d'authentification n'autorisant l'accès qu'aux personnes habilitées, avec journalisation des passages.",
        "description_en": "Control entry points with a badge or authentication system granting access only to authorised people, logging each passage.",
        "typical_evidence": [
            "Matrice des habilitations d'accès",
            "Journaux du système de badges"
        ],
        "typical_evidence_en": [
            "Access authorisation matrix",
            "Badge system logs"
        ],
        "framework_refs": {
            "iso": [
                "A.7.2"
            ],
            "soc2": [
                "CC6.4.1",
                "CC6.4.2",
                "CC6.4.4"
            ],
            "recyf": [
                "6.1",
                "6.3"
            ],
            "secnumcloud": [
                "11.1.1.a",
                "11.1.3.a",
                "11.1.a",
                "11.2.1.a",
                "11.2.1.b",
                "11.2.1.c",
                "11.2.1.d",
                "11.2.1.e",
                "11.2.1.g",
                "11.2.1.h",
                "11.2.2.a",
                "11.2.2.b",
                "11.2.2.c",
                "11.2.2.d",
                "11.2.2.e",
                "11.2.2.g",
                "11.2.2.h",
                "11.2.2.i",
                "11.2.2.j",
                "11.5.b"
            ],
            "cra": [
                "3.1.16"
            ],
            "anssi": [
                "26"
            ]
        }
    },
    {
        "id": "PHY.VISITOR_MANAGEMENT",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Gestion et enregistrement des visiteurs",
        "name_en": "Visitor management and logging",
        "description": "Enregistrer les visiteurs, leur remettre un badge distinctif et les accompagner dans les zones non publiques, en conservant une traçabilité des entrées et sorties.",
        "description_en": "Register visitors, issue a distinctive badge and escort them in non-public areas, keeping traceability of entries and exits.",
        "typical_evidence": [
            "Registre des visiteurs",
            "Procédure d'accueil et d'escorte"
        ],
        "typical_evidence_en": [
            "Visitor log",
            "Reception and escort procedure"
        ],
        "framework_refs": {
            "iso": [
                "A.7.2"
            ],
            "recyf": [
                "6.1",
                "6.4"
            ],
            "secnumcloud": [
                "11.2.1.f",
                "11.2.1.g",
                "11.2.2.f",
                "11.2.2.g"
            ],
            "anssi": [
                "26"
            ]
        }
    },
    {
        "id": "PHY.SECURE_ROOMS",
        "category": "process",
        "csf_function": "protect",
        "name": "Sécurisation des bureaux et salles sensibles",
        "name_en": "Securing offices and sensitive rooms",
        "description": "Protéger les bureaux, salles serveurs et locaux techniques par un verrouillage et une restriction d'accès adaptés à la sensibilité des ressources hébergées.",
        "description_en": "Protect offices, server rooms and technical premises with locking and access restrictions matched to the sensitivity of the resources they host.",
        "typical_evidence": [
            "Liste des zones restreintes",
            "Registre d'attribution des clés et badges"
        ],
        "typical_evidence_en": [
            "List of restricted areas",
            "Key and badge assignment register"
        ],
        "framework_refs": {
            "iso": [
                "A.7.3"
            ],
            "soc2": [
                "CC6.4.1"
            ],
            "recyf": [
                "6.3",
                "6.4"
            ],
            "secnumcloud": [
                "11.1.3.a",
                "11.2.1.a",
                "11.2.2.a",
                "11.10.a"
            ],
            "anssi": [
                "26"
            ]
        }
    },
    {
        "id": "PHY.CCTV",
        "category": "process",
        "csf_function": "detect",
        "name": "Vidéosurveillance des zones sensibles",
        "name_en": "Video surveillance of sensitive areas",
        "description": "Déployer une vidéosurveillance couvrant les accès et zones critiques, avec conservation des enregistrements conforme aux exigences légales et exploitables en cas d'incident.",
        "description_en": "Deploy video surveillance covering access points and critical areas, retaining recordings in line with legal requirements and usable in case of incident.",
        "typical_evidence": [
            "Plan d'implantation des caméras",
            "Politique de conservation des enregistrements"
        ],
        "typical_evidence_en": [
            "Camera placement plan",
            "Recording retention policy"
        ],
        "framework_refs": {
            "iso": [
                "A.7.4"
            ],
            "recyf": [
                "6.2"
            ],
            "secnumcloud": [
                "11.2.1.h",
                "11.2.2.h",
                "11.2.2.i"
            ],
            "cra": [
                "3.1.16"
            ]
        }
    },
    {
        "id": "PHY.INTRUSION_DETECTION",
        "category": "process",
        "csf_function": "detect",
        "name": "Détection d'intrusion physique",
        "name_en": "Physical intrusion detection",
        "description": "Installer des détecteurs de mouvement et d'ouverture reliés à un système d'alerte générant une notification en temps réel vers les équipes de sécurité.",
        "description_en": "Install motion and opening sensors linked to an alerting system that generates real-time notifications to security teams.",
        "typical_evidence": [
            "Configuration du système d'alarme",
            "Journal des alertes d'intrusion"
        ],
        "typical_evidence_en": [
            "Alarm system configuration",
            "Intrusion alert log"
        ],
        "framework_refs": {
            "iso": [
                "A.7.4"
            ],
            "soc2": [
                "CC7.2.2"
            ],
            "recyf": [
                "6.2"
            ],
            "secnumcloud": [
                "11.2.1.h",
                "11.2.2.h"
            ]
        }
    },
    {
        "id": "PHY.FIRE_SUPPRESSION",
        "category": "process",
        "csf_function": "protect",
        "name": "Protection et suppression incendie",
        "name_en": "Fire protection and suppression",
        "description": "Équiper les locaux sensibles de systèmes de détection et de suppression d'incendie adaptés, contrôlés périodiquement pour garantir leur efficacité.",
        "description_en": "Equip sensitive premises with suitable fire detection and suppression systems, periodically inspected to ensure their effectiveness.",
        "typical_evidence": [
            "Rapports de contrôle des systèmes incendie",
            "Plan de détection et d'extinction"
        ],
        "typical_evidence_en": [
            "Fire system inspection reports",
            "Detection and extinguishing plan"
        ],
        "framework_refs": {
            "iso": [
                "A.7.5"
            ],
            "soc2": [
                "A1.2.2",
                "A1.2.3",
                "A1.2.5"
            ],
            "secnumcloud": [
                "11.3.a",
                "11.3.b",
                "11.3.e",
                "11.7.d"
            ],
            "hds": [
                "EXI-05.a"
            ],
            "nis2": [
                "21.2"
            ]
        }
    },
    {
        "id": "PHY.ENV_PROTECTION",
        "category": "process",
        "csf_function": "protect",
        "name": "Protection contre les menaces environnementales",
        "name_en": "Protection against environmental threats",
        "description": "Protéger les équipements contre les risques environnementaux par le contrôle de la température, de l'humidité et des dispositifs anti-inondation dans les zones critiques.",
        "description_en": "Protect equipment against environmental risks through temperature and humidity control and anti-flood devices in critical areas.",
        "typical_evidence": [
            "Relevés de température et d'humidité",
            "Dispositifs de détection de fuite d'eau"
        ],
        "typical_evidence_en": [
            "Temperature and humidity readings",
            "Water-leak detection devices"
        ],
        "framework_refs": {
            "iso": [
                "A.7.5"
            ],
            "soc2": [
                "A1.2.1",
                "A1.2.2",
                "A1.2.3",
                "A1.2.4",
                "A1.2.5"
            ],
            "secnumcloud": [
                "11.3.a",
                "11.3.b",
                "11.3.d",
                "11.3.e"
            ],
            "hds": [
                "EXI-05.a"
            ],
            "nis2": [
                "21.2"
            ]
        }
    },
    {
        "id": "PHY.SECURE_AREA_WORK",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Règles de travail en zones sécurisées",
        "name_en": "Rules for working in secure areas",
        "description": "Encadrer les activités menées en zones sécurisées par des règles d'accès restreint, l'escorte des tiers et l'interdiction d'appareils d'enregistrement non autorisés.",
        "description_en": "Govern activities in secure areas through restricted-access rules, escorting of third parties and a ban on unauthorised recording devices.",
        "typical_evidence": [
            "Consignes affichées en zone sécurisée",
            "Registre des interventions escortées"
        ],
        "typical_evidence_en": [
            "Posted secure-area instructions",
            "Register of escorted interventions"
        ],
        "framework_refs": {
            "iso": [
                "A.7.6"
            ],
            "recyf": [
                "6.4"
            ],
            "secnumcloud": [
                "11.2.1.c",
                "11.2.1.g",
                "11.2.2.c",
                "11.2.2.g",
                "11.4.b"
            ]
        }
    },
    {
        "id": "PHY.CLEARDESK",
        "category": "policy",
        "csf_function": "protect",
        "name": "Bureau et écran nets",
        "name_en": "Clear desk and clear screen",
        "description": "Imposer le rangement sécurisé des documents sensibles et le verrouillage des écrans lorsque le poste est laissé sans surveillance.",
        "description_en": "Require sensitive documents to be securely stored and screens locked when a workstation is left unattended.",
        "typical_evidence": [
            "Règle bureau et écran nets",
            "Constats de contrôles ponctuels"
        ],
        "typical_evidence_en": [
            "Clear desk and screen rule",
            "Spot-check findings"
        ],
        "framework_refs": {
            "iso": [
                "A.7.7"
            ],
            "hds": [
                "EXI-05.d"
            ]
        }
    },
    {
        "id": "PHY.EQUIPMENT_SITING",
        "category": "process",
        "csf_function": "protect",
        "name": "Emplacement et protection du matériel",
        "name_en": "Equipment siting and protection",
        "description": "Positionner les équipements sensibles à l'abri des regards et des dommages, en recourant à des fixations et armoires verrouillées dans des zones à accès restreint.",
        "description_en": "Position sensitive equipment away from view and damage, using secure mounts and locked cabinets in restricted-access areas.",
        "typical_evidence": [
            "Plan d'implantation des équipements",
            "Inventaire des armoires verrouillées"
        ],
        "typical_evidence_en": [
            "Equipment layout plan",
            "Inventory of locked cabinets"
        ],
        "framework_refs": {
            "iso": [
                "A.7.8"
            ],
            "secnumcloud": [
                "11.10.a"
            ],
            "cra": [
                "4.1"
            ]
        }
    },
    {
        "id": "PHY.OFFSITE_ASSETS",
        "category": "policy",
        "csf_function": "protect",
        "name": "Sécurité des actifs hors des locaux",
        "name_en": "Security of assets off-premises",
        "description": "Protéger les actifs utilisés ou transportés hors des locaux par le chiffrement, des règles de transport sécurisé et un suivi de leur localisation.",
        "description_en": "Protect assets used or transported off-premises through encryption, secure-transport rules and location tracking.",
        "typical_evidence": [
            "Politique d'usage nomade des actifs",
            "Registre de suivi des équipements hors site"
        ],
        "typical_evidence_en": [
            "Mobile asset usage policy",
            "Off-site equipment tracking register"
        ],
        "framework_refs": {
            "iso": [
                "A.7.9"
            ],
            "soc2": [
                "A1.2.9",
                "CC2.1.9"
            ],
            "recyf": [
                "8.5"
            ],
            "secnumcloud": [
                "10.1.d",
                "11.8.a",
                "12.5.d"
            ],
            "hds": [
                "EXI-05.b"
            ],
            "anssi": [
                "30",
                "31"
            ]
        }
    },
    {
        "id": "PHY.STORAGE_MEDIA",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Gestion sécurisée des supports de stockage",
        "name_en": "Secure storage media management",
        "description": "Encadrer le cycle de vie des supports de stockage amovibles par le chiffrement, un stockage protégé et une restriction d'accès selon la classification des données.",
        "description_en": "Govern the lifecycle of removable storage media through encryption, protected storage and access restrictions based on data classification.",
        "typical_evidence": [
            "Procédure de gestion des supports amovibles",
            "Registre des supports chiffrés"
        ],
        "typical_evidence_en": [
            "Removable media management procedure",
            "Register of encrypted media"
        ],
        "framework_refs": {
            "iso": [
                "A.7.10"
            ],
            "soc2": [
                "CC6.7.3"
            ],
            "recyf": [
                "9.5"
            ],
            "secnumcloud": [
                "8.4.a",
                "10.1.d"
            ],
            "hds": [
                "EXI-05.b",
                "EXI-05.c"
            ],
            "anssi": [
                "15",
                "27.R"
            ],
            "lpm": [
                "10.4",
                "19.2",
                "19.3",
                "19.4"
            ]
        }
    },
    {
        "id": "PHY.SUPPORTING_UTILITIES",
        "category": "process",
        "csf_function": "protect",
        "name": "Fiabilité des services supports",
        "name_en": "Reliability of supporting utilities",
        "description": "Assurer la continuité des utilitaires essentiels (alimentation électrique, refroidissement) par des dispositifs redondants et une protection physique contre les perturbations.",
        "description_en": "Ensure continuity of essential utilities (power, cooling) through redundant devices and physical protection against disruptions.",
        "typical_evidence": [
            "Schéma de redondance électrique (onduleurs, groupe)",
            "Rapports de test des utilitaires"
        ],
        "typical_evidence_en": [
            "Power redundancy diagram (UPS, generator)",
            "Utility test reports"
        ],
        "framework_refs": {
            "iso": [
                "A.7.11"
            ],
            "soc2": [
                "A1.2.3"
            ],
            "secnumcloud": [
                "11.3.a",
                "11.3.c",
                "11.3.d",
                "11.7.d",
                "17.4.a"
            ],
            "hds": [
                "EXI-05.a"
            ],
            "nis2": [
                "21.2"
            ]
        }
    },
    {
        "id": "PHY.CABLING_SECURITY",
        "category": "process",
        "csf_function": "protect",
        "name": "Sécurité du câblage",
        "name_en": "Cabling security",
        "description": "Protéger les câbles d'alimentation et de télécommunication contre l'interception et les dommages au moyen de conduits, d'un cheminement sécurisé et d'un étiquetage rigoureux.",
        "description_en": "Protect power and telecommunication cabling against interception and damage through conduits, secure routing and rigorous labelling.",
        "typical_evidence": [
            "Plan de cheminement des câbles",
            "Contrôles d'intégrité du câblage"
        ],
        "typical_evidence_en": [
            "Cable routing plan",
            "Cabling integrity checks"
        ],
        "framework_refs": {
            "iso": [
                "A.7.12"
            ],
            "secnumcloud": [
                "11.6.a",
                "11.6.b",
                "11.6.c"
            ]
        }
    },
    {
        "id": "PHY.EQUIPMENT_MAINTENANCE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Maintenance sécurisée du matériel",
        "name_en": "Secure equipment maintenance",
        "description": "Entretenir régulièrement les équipements selon les recommandations du fabricant, en réservant les interventions à du personnel autorisé et en encadrant la maintenance externe.",
        "description_en": "Regularly maintain equipment per manufacturer recommendations, restricting interventions to authorised personnel and governing external maintenance.",
        "typical_evidence": [
            "Calendrier de maintenance préventive",
            "Comptes rendus d'intervention"
        ],
        "typical_evidence_en": [
            "Preventive maintenance schedule",
            "Intervention reports"
        ],
        "framework_refs": {
            "iso": [
                "A.7.13"
            ],
            "soc2": [
                "CC5.2.4"
            ],
            "secnumcloud": [
                "11.3.c",
                "11.3.d",
                "11.3.e",
                "11.7.a",
                "11.7.b",
                "11.7.d"
            ]
        }
    },
    {
        "id": "PHY.SECURE_DISPOSAL",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Élimination ou réutilisation sécurisée du matériel",
        "name_en": "Secure disposal or re-use of equipment",
        "description": "Effacer de façon irréversible ou détruire physiquement les données présentes sur les équipements avant leur mise au rebut, leur réaffectation ou leur revente.",
        "description_en": "Irreversibly wipe or physically destroy data on equipment before disposal, reassignment or resale.",
        "typical_evidence": [
            "Procédure d'effacement et de destruction",
            "Certificats de destruction de données"
        ],
        "typical_evidence_en": [
            "Wiping and destruction procedure",
            "Data destruction certificates"
        ],
        "framework_refs": {
            "iso": [
                "A.7.14"
            ],
            "soc2": [
                "C1.2.2",
                "CC6.5.1",
                "P4.3.3"
            ],
            "secnumcloud": [
                "11.7.c",
                "11.9.a"
            ],
            "cra": [
                "1.1.2.m",
                "2.8.d"
            ],
            "hds": [
                "EXI-05.d",
                "EXI-05.e"
            ],
            "anssi": [
                "15.R"
            ]
        }
    },
    {
        "id": "EP.HARDENING",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Durcissement des terminaux utilisateurs",
        "name_en": "User endpoint hardening",
        "description": "Appliquer une configuration de durcissement aux postes de travail et appareils mobiles : désactivation des services inutiles, restriction des ports, verrouillage automatique et suppression des comptes locaux superflus.",
        "description_en": "Apply a hardening configuration to workstations and mobile devices: disabling unused services, restricting ports, automatic locking and removal of unnecessary local accounts.",
        "typical_evidence": [
            "Guide de durcissement des postes",
            "Rapports de conformité des terminaux"
        ],
        "typical_evidence_en": [
            "Endpoint hardening guide",
            "Endpoint compliance reports"
        ],
        "framework_refs": {
            "iso": [
                "A.8.1"
            ],
            "soc2": [
                "CC6.7.4"
            ],
            "recyf": [
                "9.5",
                "11.B.4",
                "18.3",
                "19.4",
                "19.5",
                "19.6"
            ],
            "secnumcloud": [
                "12.12.a",
                "12.12.b"
            ],
            "cra": [
                "1.1.2.b",
                "1.1.2.j",
                "2.8.a",
                "3.1.2",
                "3.1.8",
                "3.1.10",
                "3.1.12",
                "3.1.13",
                "3.1.14",
                "3.1.15",
                "3.1.16",
                "3.1.17",
                "3.2.1",
                "3.2.3",
                "3.2.4"
            ],
            "anssi": [
                "12",
                "14",
                "17",
                "33",
                "33.R"
            ],
            "lpm": [
                "12.4",
                "18.5",
                "19.1"
            ],
            "nis2": [
                "21.2.g"
            ],
            "dora": [
                "DORA-9"
            ]
        }
    },
    {
        "id": "EP.DISK_ENCRYPTION",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Chiffrement des disques des terminaux",
        "name_en": "Endpoint disk encryption",
        "description": "Chiffrer intégralement le stockage des ordinateurs portables et appareils mobiles afin de protéger les données en cas de perte ou de vol de l'équipement.",
        "description_en": "Fully encrypt storage on laptops and mobile devices to protect data in the event of equipment loss or theft.",
        "typical_evidence": [
            "Rapport d'état du chiffrement des disques",
            "Politique de chiffrement des terminaux"
        ],
        "typical_evidence_en": [
            "Disk encryption status report",
            "Endpoint encryption policy"
        ],
        "framework_refs": {
            "iso": [
                "A.8.1"
            ],
            "soc2": [
                "CC6.1.10",
                "CC6.7.3"
            ],
            "recyf": [
                "8.5"
            ],
            "secnumcloud": [
                "12.12.c"
            ],
            "cra": [
                "1.1.2.e"
            ],
            "hds": [
                "EXI-05.c"
            ],
            "anssi": [
                "14",
                "31"
            ],
            "nis2": [
                "21.2.h"
            ]
        }
    },
    {
        "id": "EP.MDM",
        "category": "process",
        "csf_function": "protect",
        "name": "Gestion centralisée des terminaux",
        "name_en": "Centralized endpoint management",
        "description": "Enrôler les terminaux dans une solution de gestion centralisée (MDM/UEM) permettant d'appliquer les politiques, de contrôler la conformité et d'effacer à distance un appareil compromis.",
        "description_en": "Enroll endpoints in a centralized management solution (MDM/UEM) to enforce policies, monitor compliance and remotely wipe a compromised device.",
        "typical_evidence": [
            "Console MDM avec inventaire des terminaux",
            "Journaux d'effacement à distance"
        ],
        "typical_evidence_en": [
            "MDM console with device inventory",
            "Remote wipe logs"
        ],
        "framework_refs": {
            "iso": [
                "A.8.1"
            ],
            "soc2": [
                "CC6.7.4"
            ],
            "recyf": [
                "9.1",
                "9.2",
                "9.3",
                "9.4"
            ],
            "anssi": [
                "7",
                "7.R",
                "16",
                "33",
                "33.R"
            ],
            "lpm": [
                "15.1",
                "18.5"
            ]
        }
    },
    {
        "id": "PRIV.LEAST",
        "category": "process",
        "csf_function": "protect",
        "name": "Attribution restreinte des droits privilégiés",
        "name_en": "Restricted allocation of privileged rights",
        "description": "Accorder les droits d'accès à privilèges au strict nécessaire, sur la base d'une demande formelle approuvée, pour une durée limitée et via des comptes distincts des comptes nominatifs standard.",
        "description_en": "Grant privileged access rights on a strict need basis through a formally approved request, for a limited duration and via accounts separate from standard named accounts.",
        "typical_evidence": [
            "Registre des attributions de privilèges",
            "Formulaires de demande approuvés"
        ],
        "typical_evidence_en": [
            "Privilege allocation register",
            "Approved request forms"
        ],
        "framework_refs": {
            "iso": [
                "A.8.2"
            ],
            "soc2": [
                "CC3.3.5"
            ],
            "recyf": [
                "11.A.1",
                "11.A.2",
                "11.A.3",
                "11.A.4",
                "11.A.5",
                "11.A.6",
                "11.A.7",
                "11.B.3"
            ],
            "secnumcloud": [
                "9.3.c",
                "9.4.c",
                "9.5.d",
                "9.6.a",
                "9.6.c",
                "12.7.e"
            ],
            "anssi": [
                "5",
                "8",
                "29"
            ],
            "lpm": [
                "13.5",
                "14.1",
                "14.2",
                "14.3",
                "14.4",
                "14.5",
                "14.7",
                "20.10"
            ]
        }
    },
    {
        "id": "PRIV.REVIEW",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Revue périodique des comptes à privilèges",
        "name_en": "Periodic review of privileged accounts",
        "description": "Réexaminer à intervalles réguliers l'ensemble des comptes disposant de droits élevés afin de retirer les accès obsolètes, injustifiés ou liés à des départs.",
        "description_en": "Regularly re-examine all accounts with elevated rights to remove obsolete, unjustified or leaver-related access.",
        "typical_evidence": [
            "Comptes rendus de revue des privilèges",
            "Liste des accès révoqués"
        ],
        "typical_evidence_en": [
            "Privilege review reports",
            "List of revoked access"
        ],
        "framework_refs": {
            "iso": [
                "A.8.2"
            ],
            "soc2": [
                "CC6.2.2",
                "CC6.3.4"
            ],
            "recyf": [
                "10.A.6",
                "11.A.6",
                "11.A.7"
            ],
            "secnumcloud": [
                "9.3.c",
                "9.3.d",
                "9.3.e",
                "9.4.c"
            ],
            "anssi": [
                "5"
            ],
            "lpm": [
                "3.7",
                "13.4",
                "13.5",
                "14.7",
                "20.8"
            ]
        }
    },
    {
        "id": "PRIV.PAM",
        "category": "process",
        "csf_function": "protect",
        "name": "Coffre-fort de gestion des accès à privilèges",
        "name_en": "Privileged access management vault",
        "description": "Centraliser et sécuriser les identifiants privilégiés dans une solution PAM assurant le stockage chiffré, la rotation automatique des secrets et l'enregistrement des sessions administrateur.",
        "description_en": "Centralize and secure privileged credentials in a PAM solution providing encrypted storage, automatic secret rotation and administrator session recording.",
        "typical_evidence": [
            "Configuration de la solution PAM",
            "Enregistrements de sessions privilégiées"
        ],
        "typical_evidence_en": [
            "PAM solution configuration",
            "Privileged session recordings"
        ],
        "framework_refs": {
            "iso": [
                "A.8.2"
            ],
            "recyf": [
                "10.B.4",
                "11.A.4",
                "11.B.3",
                "11.B.4",
                "19.1",
                "19.2",
                "19.3",
                "19.4",
                "19.5"
            ],
            "secnumcloud": [
                "9.5.d",
                "9.6.a",
                "9.6.b",
                "10.5.c",
                "10.5.d",
                "12.12.a",
                "12.12.b",
                "12.13.a"
            ],
            "cra": [
                "3.1.1"
            ],
            "hds": [
                "EXI-05.l"
            ],
            "anssi": [
                "11",
                "28"
            ],
            "lpm": [
                "3.6",
                "12.5",
                "12.9",
                "14.2",
                "14.4",
                "14.6",
                "15.1",
                "15.2",
                "15.3",
                "15.4"
            ]
        }
    },
    {
        "id": "ACC.RBAC",
        "category": "policy",
        "csf_function": "protect",
        "name": "Contrôle d'accès basé sur les rôles",
        "name_en": "Role-based access control",
        "description": "Structurer les autorisations d'accès aux informations et fonctions applicatives autour de rôles métier définis, afin d'aligner les permissions sur les responsabilités réelles des utilisateurs.",
        "description_en": "Structure access authorizations to information and application functions around defined business roles, aligning permissions with users' actual responsibilities.",
        "typical_evidence": [
            "Matrice des rôles et permissions",
            "Politique de contrôle d'accès"
        ],
        "typical_evidence_en": [
            "Role-to-permission matrix",
            "Access control policy"
        ],
        "framework_refs": {
            "iso": [
                "A.8.3"
            ],
            "soc2": [
                "CC6.3.3"
            ],
            "secnumcloud": [
                "9.3.b",
                "9.6.g"
            ],
            "lpm": [
                "14.1"
            ]
        }
    },
    {
        "id": "ACC.NEED_TO_KNOW",
        "category": "policy",
        "csf_function": "protect",
        "name": "Principe du besoin d'en connaître",
        "name_en": "Need-to-know principle",
        "description": "Limiter l'accès aux informations sensibles aux seules personnes dont les fonctions le justifient, en cloisonnant les données selon leur classification et le périmètre d'intervention.",
        "description_en": "Limit access to sensitive information to those whose duties justify it, compartmentalizing data according to its classification and scope of work.",
        "typical_evidence": [
            "Règles de cloisonnement documentées",
            "Matrice de classification et d'accès"
        ],
        "typical_evidence_en": [
            "Documented compartmentalization rules",
            "Classification and access matrix"
        ],
        "framework_refs": {
            "iso": [
                "A.8.3"
            ],
            "soc2": [
                "CC6.1.3",
                "CC6.1.7",
                "CC6.1.12",
                "CC6.1.13",
                "P4.1.1",
                "P6.1.2"
            ],
            "recyf": [
                "10.C.2",
                "10.C.3"
            ],
            "secnumcloud": [
                "9.6.b",
                "9.6.c",
                "9.7.a",
                "9.7.b",
                "9.7.c",
                "19.1.k",
                "19.2.c",
                "19.2.e"
            ],
            "hds": [
                "EXI-11.a",
                "EXI-23",
                "EXI-26"
            ],
            "anssi": [
                "9"
            ],
            "lpm": [
                "13.2"
            ],
            "loi0520": [
                "ART-5",
                "ART-16",
                "ART-18"
            ]
        }
    },
    {
        "id": "SRC.REPO_ACCESS",
        "category": "process",
        "csf_function": "protect",
        "name": "Contrôle d'accès aux dépôts de code source",
        "name_en": "Source code repository access control",
        "description": "Restreindre l'accès en lecture et en écriture aux dépôts de code source aux développeurs habilités, avec authentification forte et permissions granulaires par branche ou projet.",
        "description_en": "Restrict read and write access to source code repositories to authorized developers, with strong authentication and granular per-branch or per-project permissions.",
        "typical_evidence": [
            "Configuration des permissions du dépôt",
            "Journal des accès au code source"
        ],
        "typical_evidence_en": [
            "Repository permission configuration",
            "Source code access log"
        ],
        "framework_refs": {
            "iso": [
                "A.8.4"
            ],
            "secnumcloud": [
                "14.4.a"
            ]
        }
    },
    {
        "id": "SRC.CHANGE_TRACE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Traçabilité des modifications du code source",
        "name_en": "Source code change traceability",
        "description": "Exiger que toute modification du code source soit tracée, associée à un auteur identifié et validée par une revue de code avant fusion dans les branches protégées.",
        "description_en": "Require every source code change to be traced, tied to an identified author and validated through code review before merging into protected branches.",
        "typical_evidence": [
            "Historique des commits et pull requests",
            "Règles de protection de branche"
        ],
        "typical_evidence_en": [
            "Commit and pull request history",
            "Branch protection rules"
        ],
        "framework_refs": {
            "iso": [
                "A.8.4"
            ],
            "soc2": [
                "CC8.1.5"
            ],
            "secnumcloud": [
                "14.2.c"
            ],
            "cra": [
                "7.1.b"
            ]
        }
    },
    {
        "id": "AUTH.SECURE_LOGON",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Ouverture de session sécurisée",
        "name_en": "Secure log-on",
        "description": "Concevoir les procédures de connexion pour ne révéler aucune information exploitable en cas d'échec, masquer la saisie des secrets et n'afficher aucun message distinguant identifiant et mot de passe erronés.",
        "description_en": "Design log-on procedures to reveal no exploitable information on failure, mask secret entry and display no message distinguishing a wrong username from a wrong password.",
        "typical_evidence": [
            "Spécification des écrans de connexion",
            "Résultats de tests d'ouverture de session"
        ],
        "typical_evidence_en": [
            "Log-on screen specification",
            "Log-on procedure test results"
        ],
        "framework_refs": {
            "iso": [
                "A.8.5"
            ],
            "recyf": [
                "10.B.1",
                "10.B.5"
            ],
            "secnumcloud": [
                "9.5.b",
                "9.6.h"
            ],
            "cra": [
                "1.1.2.d"
            ],
            "anssi": [
                "10"
            ],
            "nis2": [
                "21.2.j"
            ]
        }
    },
    {
        "id": "AUTH.BRUTEFORCE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Protection anti-force brute et anti-rejeu",
        "name_en": "Brute-force and replay protection",
        "description": "Mettre en place le verrouillage progressif des comptes, la temporisation après échecs répétés et des mécanismes empêchant la réutilisation de jetons d'authentification interceptés.",
        "description_en": "Implement progressive account lockout, throttling after repeated failures and mechanisms preventing reuse of intercepted authentication tokens.",
        "typical_evidence": [
            "Configuration du verrouillage de comptes",
            "Journaux de tentatives d'authentification bloquées"
        ],
        "typical_evidence_en": [
            "Account lockout configuration",
            "Blocked authentication attempt logs"
        ],
        "framework_refs": {
            "iso": [
                "A.8.5"
            ],
            "recyf": [
                "8.4"
            ],
            "secnumcloud": [
                "9.5.b",
                "9.6.h"
            ],
            "anssi": [
                "10"
            ],
            "lpm": [
                "12.8"
            ],
            "nis2": [
                "21.2.j"
            ]
        }
    },
    {
        "id": "CAP.MONITOR",
        "category": "process",
        "csf_function": "detect",
        "name": "Surveillance de l'utilisation des capacités",
        "name_en": "Capacity utilization monitoring",
        "description": "Suivre en continu l'utilisation des ressources critiques (processeur, mémoire, stockage, bande passante) et déclencher des alertes lorsque des seuils de saturation sont approchés.",
        "description_en": "Continuously track usage of critical resources (CPU, memory, storage, bandwidth) and trigger alerts when saturation thresholds are approached.",
        "typical_evidence": [
            "Tableaux de bord de supervision des ressources",
            "Alertes de dépassement de seuil"
        ],
        "typical_evidence_en": [
            "Resource monitoring dashboards",
            "Threshold breach alerts"
        ],
        "framework_refs": {
            "iso": [
                "A.8.6"
            ],
            "soc2": [
                "A1.1.1",
                "CC5.2.2"
            ],
            "secnumcloud": [
                "12.7.b"
            ],
            "cra": [
                "1.1.2.i"
            ],
            "dora": [
                "DORA-7"
            ]
        }
    },
    {
        "id": "CAP.PLANNING",
        "category": "process",
        "csf_function": "identify",
        "name": "Planification prévisionnelle des capacités",
        "name_en": "Capacity forecasting and planning",
        "description": "Projeter l'évolution des besoins en ressources à partir des tendances d'usage et des objectifs métier afin d'anticiper les acquisitions et d'éviter les ruptures de service.",
        "description_en": "Project the evolution of resource needs from usage trends and business objectives to anticipate procurement and avoid service disruptions.",
        "typical_evidence": [
            "Plan de capacité prévisionnel",
            "Analyses de tendances d'utilisation"
        ],
        "typical_evidence_en": [
            "Forward capacity plan",
            "Usage trend analyses"
        ],
        "framework_refs": {
            "iso": [
                "A.8.6"
            ],
            "soc2": [
                "A1.1.2",
                "A1.1.3"
            ],
            "secnumcloud": [
                "12.7.b"
            ],
            "dora": [
                "DORA-7"
            ]
        }
    },
    {
        "id": "MAL.ENDPOINT_PROTECTION",
        "category": "process",
        "csf_function": "protect",
        "name": "Protection anti-programmes malveillants",
        "name_en": "Anti-malware protection",
        "description": "Déployer une solution de protection contre les codes malveillants (antivirus/EDR) sur les serveurs et terminaux, avec analyse en temps réel et blocage automatique des menaces détectées.",
        "description_en": "Deploy malicious code protection (antivirus/EDR) on servers and endpoints, with real-time scanning and automatic blocking of detected threats.",
        "typical_evidence": [
            "Console de gestion anti-malware",
            "Rapports de détection et de blocage"
        ],
        "typical_evidence_en": [
            "Anti-malware management console",
            "Detection and blocking reports"
        ],
        "framework_refs": {
            "iso": [
                "A.8.7"
            ],
            "soc2": [
                "CC6.6.4",
                "CC6.7.4",
                "CC6.8.4",
                "CC6.8.5"
            ],
            "recyf": [
                "5.B.2",
                "9.6",
                "9.7"
            ],
            "secnumcloud": [
                "12.4.a"
            ],
            "cra": [
                "3.1.4"
            ],
            "anssi": [
                "14",
                "15",
                "22.R",
                "24"
            ],
            "lpm": [
                "7.2",
                "19.4"
            ],
            "loi0520": [
                "ART-29"
            ],
            "nis2": [
                "21.2.g"
            ]
        }
    },
    {
        "id": "MAL.SIGNATURE_UPDATE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Mise à jour des signatures anti-malware",
        "name_en": "Anti-malware signature updates",
        "description": "Garantir la mise à jour automatique et fréquente des signatures et moteurs de détection, et vérifier que l'ensemble du parc reçoit bien les dernières définitions.",
        "description_en": "Ensure automatic and frequent updating of detection signatures and engines, and verify that the whole estate receives the latest definitions.",
        "typical_evidence": [
            "Rapport d'état des versions de signatures",
            "Alertes sur postes non à jour"
        ],
        "typical_evidence_en": [
            "Signature version status report",
            "Out-of-date endpoint alerts"
        ],
        "framework_refs": {
            "iso": [
                "A.8.7"
            ],
            "soc2": [
                "CC6.8.4",
                "CC6.8.5"
            ],
            "recyf": [
                "5.B.2",
                "9.6"
            ],
            "secnumcloud": [
                "12.4.a"
            ],
            "cra": [
                "3.1.4"
            ],
            "lpm": [
                "19.4"
            ]
        }
    },
    {
        "id": "MAL.AWARENESS",
        "category": "training",
        "csf_function": "protect",
        "name": "Sensibilisation aux codes malveillants",
        "name_en": "Malware awareness training",
        "description": "Former régulièrement les utilisateurs à reconnaître les vecteurs d'infection courants (pièces jointes, liens, supports amovibles) et à signaler tout comportement suspect.",
        "description_en": "Regularly train users to recognize common infection vectors (attachments, links, removable media) and to report any suspicious behavior.",
        "typical_evidence": [
            "Supports de sensibilisation",
            "Taux de participation aux formations"
        ],
        "typical_evidence_en": [
            "Awareness materials",
            "Training completion rates"
        ],
        "framework_refs": {
            "iso": [
                "A.8.7"
            ],
            "soc2": [
                "CC2.2.8"
            ],
            "recyf": [
                "4.2",
                "9.6"
            ],
            "secnumcloud": [
                "12.4.a",
                "12.4.b"
            ],
            "cra": [
                "3.1.4"
            ],
            "anssi": [
                "15",
                "24"
            ],
            "nis2": [
                "21.2.g"
            ]
        }
    },
    {
        "id": "VULN.SCAN",
        "category": "process",
        "csf_function": "detect",
        "name": "Analyse des vulnérabilités techniques",
        "name_en": "Technical vulnerability scanning",
        "description": "Exécuter des analyses régulières et automatisées des systèmes et applications afin d'identifier les failles techniques connues et d'en évaluer la criticité.",
        "description_en": "Run regular automated scans of systems and applications to identify known technical flaws and assess their severity.",
        "typical_evidence": [
            "Rapports d'analyse de vulnérabilités",
            "Planning des scans récurrents"
        ],
        "typical_evidence_en": [
            "Vulnerability scan reports",
            "Recurring scan schedule"
        ],
        "framework_refs": {
            "iso": [
                "A.8.8"
            ],
            "soc2": [
                "CC3.2.6",
                "CC4.1.8",
                "CC7.1.5"
            ],
            "recyf": [
                "5.B.4",
                "5.B.5",
                "11.B.1",
                "17.2",
                "17.3",
                "18.4"
            ],
            "secnumcloud": [
                "12.11.a",
                "12.11.b"
            ],
            "cra": [
                "1.1.2.a",
                "1.2.1",
                "1.2.3",
                "7.2.b"
            ],
            "anssi": [
                "34"
            ],
            "nis2": [
                "21.2.e"
            ],
            "dora": [
                "DORA-24",
                "DORA-25",
                "DORA-26"
            ]
        }
    },
    {
        "id": "VULN.PATCH",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Application des correctifs de sécurité",
        "name_en": "Security patch remediation",
        "description": "Corriger les vulnérabilités identifiées dans des délais fixés selon leur criticité, en priorisant les failles activement exploitées et en documentant les exceptions justifiées.",
        "description_en": "Remediate identified vulnerabilities within timeframes set by severity, prioritizing actively exploited flaws and documenting justified exceptions.",
        "typical_evidence": [
            "Registre de suivi des correctifs",
            "Indicateurs de délai de remédiation"
        ],
        "typical_evidence_en": [
            "Patch tracking register",
            "Remediation time metrics"
        ],
        "framework_refs": {
            "iso": [
                "A.8.8"
            ],
            "soc2": [
                "CC7.1.5",
                "CC7.4.4",
                "CC7.4.8",
                "CC7.5.1",
                "CC8.1.14"
            ],
            "recyf": [
                "5.B.1",
                "5.B.4",
                "5.B.5",
                "5.B.6",
                "5.B.7",
                "5.B.9",
                "11.B.1",
                "17.5"
            ],
            "secnumcloud": [
                "5.1.a",
                "5.1.b",
                "11.7.b",
                "12.10.b",
                "12.11.a",
                "12.11.b"
            ],
            "cra": [
                "1.1.2.a",
                "1.1.2.c",
                "1.2.2",
                "1.2.7",
                "1.2.8",
                "2.7",
                "2.8.c",
                "2.8.e",
                "3.1.10",
                "7.2.b",
                "7.4",
                "8.1.3",
                "8.2.8",
                "8.4.2"
            ],
            "anssi": [
                "27.R",
                "34",
                "35"
            ],
            "lpm": [
                "1.9",
                "4.1",
                "4.2",
                "4.4",
                "4.5",
                "4.6",
                "4.7",
                "10.5",
                "20.2",
                "20.3",
                "20.4",
                "20.5",
                "20.6"
            ],
            "nis2": [
                "21.2.e",
                "21.2.g"
            ]
        }
    },
    {
        "id": "VULN.INTEL",
        "category": "process",
        "csf_function": "identify",
        "name": "Veille sur les vulnérabilités",
        "name_en": "Vulnerability intelligence watch",
        "description": "Collecter et exploiter les sources d'information sur les nouvelles vulnérabilités et menaces affectant les technologies utilisées, afin d'anticiper les actions de remédiation.",
        "description_en": "Collect and use intelligence sources on new vulnerabilities and threats affecting the technologies in use, to anticipate remediation actions.",
        "typical_evidence": [
            "Abonnements aux flux d'alertes",
            "Bulletins de veille diffusés"
        ],
        "typical_evidence_en": [
            "Alert feed subscriptions",
            "Distributed watch bulletins"
        ],
        "framework_refs": {
            "iso": [
                "A.8.8"
            ],
            "soc2": [
                "CC3.2.6",
                "CC3.4.6"
            ],
            "recyf": [
                "5.B.3",
                "5.B.4",
                "5.B.7"
            ],
            "secnumcloud": [
                "5.1.a",
                "6.4.a",
                "11.7.b",
                "12.11.a"
            ],
            "cra": [
                "1.1.2.c",
                "1.2.2",
                "1.2.4",
                "1.2.8",
                "8.2.7"
            ],
            "anssi": [
                "34"
            ],
            "lpm": [
                "4.2",
                "4.3",
                "4.6",
                "9.2"
            ],
            "loi0520": [
                "ART-27"
            ],
            "nis2": [
                "21.2.e"
            ],
            "dora": [
                "DORA-13"
            ]
        }
    },
    {
        "id": "CFG.BASELINE",
        "category": "policy",
        "csf_function": "protect",
        "name": "Référentiels de configuration sécurisée",
        "name_en": "Secure configuration baselines",
        "description": "Établir et maintenir des configurations de référence sécurisées pour les systèmes, réseaux et applications, servant de socle obligatoire lors de tout déploiement.",
        "description_en": "Establish and maintain secure baseline configurations for systems, networks and applications, serving as a mandatory foundation for every deployment.",
        "typical_evidence": [
            "Modèles de configuration de référence",
            "Registre des configurations approuvées"
        ],
        "typical_evidence_en": [
            "Baseline configuration templates",
            "Approved configuration register"
        ],
        "framework_refs": {
            "iso": [
                "A.8.9"
            ],
            "soc2": [
                "CC5.2.2",
                "CC6.1.9",
                "CC7.1.1",
                "CC8.1.6",
                "CC8.1.12"
            ],
            "recyf": [
                "5.B.1",
                "10.B.2",
                "11.B.7",
                "18.1",
                "18.2",
                "18.3",
                "20.3"
            ],
            "secnumcloud": [
                "5.1.a",
                "5.1.b",
                "8.1.a",
                "8.1.b",
                "12.10.a",
                "12.10.b",
                "12.12.b",
                "17.5.a",
                "18.2.1.b"
            ],
            "cra": [
                "1.1.2.b",
                "2.8.a",
                "2.8.e",
                "3.1.8",
                "3.1.10"
            ],
            "anssi": [
                "12",
                "16"
            ],
            "lpm": [
                "4.1",
                "4.4",
                "10.3",
                "12.4",
                "15.1",
                "17.4",
                "17.6",
                "18.5"
            ],
            "loi0520": [
                "ART-40"
            ]
        }
    },
    {
        "id": "CFG.DRIFT",
        "category": "process",
        "csf_function": "detect",
        "name": "Détection des écarts de configuration",
        "name_en": "Configuration drift detection",
        "description": "Comparer périodiquement les configurations en production aux référentiels approuvés et alerter sur toute dérive non autorisée pour la corriger.",
        "description_en": "Periodically compare production configurations against approved baselines and alert on any unauthorized drift for correction.",
        "typical_evidence": [
            "Rapports d'écarts de configuration",
            "Journaux de remédiation des dérives"
        ],
        "typical_evidence_en": [
            "Configuration drift reports",
            "Drift remediation logs"
        ],
        "framework_refs": {
            "iso": [
                "A.8.9"
            ],
            "soc2": [
                "CC6.8.2",
                "CC7.1.2",
                "CC7.1.3",
                "CC7.1.4"
            ],
            "recyf": [
                "7.B.5",
                "11.B.6",
                "18.4"
            ],
            "secnumcloud": [
                "18.2.1.b",
                "18.4.a"
            ],
            "cra": [
                "1.1.2.f"
            ],
            "lpm": [
                "17.5",
                "20.3"
            ]
        }
    },
    {
        "id": "DEL.SECURE_ERASE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Effacement sécurisé des informations",
        "name_en": "Secure information deletion",
        "description": "Supprimer de manière irréversible les informations qui ne sont plus nécessaires, en utilisant des méthodes d'effacement adaptées au support et en couvrant les copies et sauvegardes.",
        "description_en": "Irreversibly delete information that is no longer needed, using erasure methods suited to the medium and covering copies and backups.",
        "typical_evidence": [
            "Certificats d'effacement",
            "Procédure de suppression sécurisée"
        ],
        "typical_evidence_en": [
            "Erasure certificates",
            "Secure deletion procedure"
        ],
        "framework_refs": {
            "iso": [
                "A.8.10"
            ],
            "soc2": [
                "C1.2.2",
                "CC6.5.1",
                "P4.3.2",
                "P4.3.3"
            ],
            "secnumcloud": [
                "10.1.a",
                "11.7.c",
                "11.9.a",
                "19.4.a",
                "19.4.b"
            ],
            "cra": [
                "1.1.2.m",
                "2.8.d"
            ],
            "hds": [
                "EXI-05.e",
                "EXI-27.b"
            ],
            "anssi": [
                "15.R"
            ]
        }
    },
    {
        "id": "DEL.RETENTION",
        "category": "policy",
        "csf_function": "govern",
        "name": "Respect des durées de conservation",
        "name_en": "Retention period enforcement",
        "description": "Définir des durées de conservation par catégorie d'information et déclencher la suppression à leur échéance, conformément aux obligations légales et contractuelles.",
        "description_en": "Define retention periods per information category and trigger deletion at expiry, in line with legal and contractual obligations.",
        "typical_evidence": [
            "Politique de conservation des données",
            "Journal des suppressions programmées"
        ],
        "typical_evidence_en": [
            "Data retention policy",
            "Scheduled deletion log"
        ],
        "framework_refs": {
            "iso": [
                "A.8.10"
            ],
            "soc2": [
                "C1.1.2",
                "C1.2.1",
                "P4.2.1",
                "P4.3.1"
            ],
            "secnumcloud": [
                "19.4.a",
                "19.4.b",
                "19.5.a",
                "19.5.b"
            ],
            "cra": [
                "1.1.2.m",
                "2.8.d"
            ]
        }
    },
    {
        "id": "MASK.DATA",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Masquage des données sensibles",
        "name_en": "Sensitive data masking",
        "description": "Appliquer des techniques de masquage, pseudonymisation ou anonymisation aux données sensibles exposées dans les environnements hors production et les affichages non essentiels.",
        "description_en": "Apply masking, pseudonymization or anonymization techniques to sensitive data exposed in non-production environments and non-essential displays.",
        "typical_evidence": [
            "Règles de masquage configurées",
            "Jeux de données pseudonymisés"
        ],
        "typical_evidence_en": [
            "Configured masking rules",
            "Pseudonymized data sets"
        ],
        "framework_refs": {
            "iso": [
                "A.8.11"
            ],
            "soc2": [
                "CC8.1.18",
                "P4.3.2"
            ],
            "secnumcloud": [
                "14.7.b"
            ]
        }
    },
    {
        "id": "DLP.CONTROL",
        "category": "process",
        "csf_function": "protect",
        "name": "Prévention de la fuite de données",
        "name_en": "Data leakage prevention",
        "description": "Déployer des mécanismes de détection et de blocage des transferts non autorisés d'informations sensibles via la messagerie, le web et les supports amovibles.",
        "description_en": "Deploy mechanisms to detect and block unauthorized transfers of sensitive information via email, web and removable media.",
        "typical_evidence": [
            "Politiques DLP configurées",
            "Rapports d'incidents de fuite détectés"
        ],
        "typical_evidence_en": [
            "Configured DLP policies",
            "Detected leakage incident reports"
        ],
        "framework_refs": {
            "iso": [
                "A.8.12"
            ],
            "soc2": [
                "CC6.7.1"
            ],
            "recyf": [
                "9.5",
                "9.7"
            ],
            "secnumcloud": [
                "12.14.a"
            ],
            "hds": [
                "EXI-05.c"
            ],
            "lpm": [
                "10.9",
                "19.3"
            ]
        }
    },
    {
        "id": "BKP.POLICY",
        "category": "policy",
        "csf_function": "protect",
        "name": "Politique de sauvegarde",
        "name_en": "Backup policy",
        "description": "Définir le périmètre, la fréquence, la rétention et les niveaux de reprise des sauvegardes en fonction de la criticité des informations et des objectifs RPO/RTO.",
        "description_en": "Define the scope, frequency, retention and recovery levels of backups according to information criticality and RPO/RTO objectives.",
        "typical_evidence": [
            "Politique de sauvegarde documentée",
            "Planning des jobs de sauvegarde"
        ],
        "typical_evidence_en": [
            "Documented backup policy",
            "Backup job schedule"
        ],
        "framework_refs": {
            "iso": [
                "A.8.13"
            ],
            "soc2": [
                "A1.2.7",
                "A1.2.8",
                "A1.2.9",
                "C1.1.3",
                "PP1.5"
            ],
            "recyf": [
                "12.7",
                "13.1",
                "13.3",
                "13.4",
                "13.5",
                "20.6"
            ],
            "secnumcloud": [
                "12.5.a",
                "12.5.d",
                "12.7.d",
                "17.5.a",
                "17.6.a",
                "19.1.m"
            ],
            "anssi": [
                "14.R",
                "37"
            ],
            "loi0520": [
                "ART-9"
            ],
            "nis2": [
                "21.2.c"
            ],
            "dora": [
                "DORA-12"
            ]
        }
    },
    {
        "id": "BKP.ENCRYPTION",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Chiffrement des sauvegardes",
        "name_en": "Backup encryption",
        "description": "Chiffrer les données de sauvegarde au repos et lors de leur transfert vers des sites ou services externes, avec une gestion sécurisée des clés distincte des données.",
        "description_en": "Encrypt backup data at rest and in transit to external sites or services, with secure key management kept separate from the data.",
        "typical_evidence": [
            "Configuration du chiffrement des sauvegardes",
            "Procédure de gestion des clés"
        ],
        "typical_evidence_en": [
            "Backup encryption configuration",
            "Key management procedure"
        ],
        "framework_refs": {
            "iso": [
                "A.8.13"
            ],
            "soc2": [
                "A1.2.8",
                "A1.2.11"
            ],
            "recyf": [
                "13.3"
            ],
            "secnumcloud": [
                "10.1.d",
                "12.5.b",
                "12.5.d",
                "17.5.a"
            ],
            "anssi": [
                "37"
            ],
            "nis2": [
                "21.2.c",
                "21.2.h"
            ],
            "dora": [
                "DORA-12"
            ]
        }
    },
    {
        "id": "BKP.RESTORE_TEST",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Tests de restauration des sauvegardes",
        "name_en": "Backup restoration testing",
        "description": "Tester périodiquement la restauration des sauvegardes pour vérifier leur intégrité, leur exhaustivité et le respect des délais de reprise attendus.",
        "description_en": "Periodically test backup restoration to verify integrity, completeness and adherence to expected recovery times.",
        "typical_evidence": [
            "Comptes rendus de tests de restauration",
            "Mesures de délai de reprise"
        ],
        "typical_evidence_en": [
            "Restore test records",
            "Recovery time measurements"
        ],
        "framework_refs": {
            "iso": [
                "A.8.13"
            ],
            "soc2": [
                "A1.2.11",
                "A1.3.2",
                "CC7.5.1"
            ],
            "recyf": [
                "13.1",
                "13.2"
            ],
            "secnumcloud": [
                "12.5.c",
                "17.2.a",
                "17.6.a"
            ],
            "anssi": [
                "14.R",
                "37.R"
            ],
            "loi0520": [
                "ART-9"
            ],
            "nis2": [
                "21.2.c"
            ],
            "dora": [
                "DORA-12"
            ]
        }
    },
    {
        "id": "RED.HIGH_AVAILABILITY",
        "category": "process",
        "csf_function": "protect",
        "name": "Redondance des moyens de traitement",
        "name_en": "Processing facility redundancy",
        "description": "Mettre en place des composants redondants (serveurs, réseaux, alimentation, sites) pour les services critiques afin de maintenir la disponibilité en cas de défaillance d'un élément.",
        "description_en": "Implement redundant components (servers, networks, power, sites) for critical services to maintain availability when a single element fails.",
        "typical_evidence": [
            "Schéma d'architecture redondante",
            "Résultats de tests de bascule"
        ],
        "typical_evidence_en": [
            "Redundant architecture diagram",
            "Failover test results"
        ],
        "framework_refs": {
            "iso": [
                "A.8.14"
            ],
            "soc2": [
                "A1.2.10",
                "CC8.1.15"
            ],
            "secnumcloud": [
                "11.3.c",
                "17.4.a"
            ],
            "cra": [
                "1.1.2.h",
                "1.1.2.i"
            ],
            "hds": [
                "EXI-05.n"
            ],
            "nis2": [
                "21.2",
                "21.2.c"
            ],
            "dora": [
                "DORA-7"
            ]
        }
    },
    {
        "id": "LOG.CENTRAL",
        "category": "process",
        "csf_function": "detect",
        "name": "Journalisation centralisée des événements",
        "name_en": "Centralized event logging",
        "description": "Collecter et centraliser les journaux d'événements des systèmes, applications et équipements réseau, en enregistrant les activités des utilisateurs, les erreurs et les événements de sécurité.",
        "description_en": "Collect and centralize event logs from systems, applications and network devices, recording user activities, errors and security events.",
        "typical_evidence": [
            "Architecture de collecte des journaux",
            "Inventaire des sources journalisées"
        ],
        "typical_evidence_en": [
            "Log collection architecture",
            "Inventory of logged sources"
        ],
        "framework_refs": {
            "iso": [
                "A.8.15"
            ],
            "soc2": [
                "CC2.1.2",
                "CC2.1.3",
                "CC7.2.1",
                "P6.2.1",
                "P6.3.1"
            ],
            "recyf": [
                "10.A.3",
                "10.B.7",
                "11.A.5",
                "19.12",
                "20.1",
                "20.3",
                "20.4",
                "20.5"
            ],
            "secnumcloud": [
                "11.2.2.i",
                "12.6.a",
                "12.6.b",
                "12.6.c",
                "12.6.d",
                "12.6.e",
                "12.7.c",
                "12.7.d",
                "12.8.b",
                "12.13.a"
            ],
            "cra": [
                "1.1.2.l",
                "3.1.6",
                "3.1.7"
            ],
            "hds": [
                "EXI-05.j",
                "EXI-15.c",
                "EXI-16.b"
            ],
            "anssi": [
                "8.R",
                "36",
                "36.R"
            ],
            "lpm": [
                "5.1",
                "5.2",
                "5.3",
                "5.4",
                "5.5",
                "5.6",
                "5.7",
                "5.8",
                "5.9",
                "5.11",
                "5.12",
                "6.1"
            ],
            "loi0520": [
                "ART-7",
                "ART-26",
                "ART-28"
            ],
            "dora": [
                "DORA-10"
            ]
        }
    },
    {
        "id": "LOG.PROTECT",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Protection et rétention des journaux",
        "name_en": "Log protection and retention",
        "description": "Protéger les journaux contre la modification et la suppression non autorisées, restreindre leur accès et les conserver pendant une durée définie pour les besoins d'investigation.",
        "description_en": "Protect logs against unauthorized alteration and deletion, restrict their access and retain them for a defined period to support investigations.",
        "typical_evidence": [
            "Contrôles d'intégrité des journaux",
            "Politique de rétention des logs"
        ],
        "typical_evidence_en": [
            "Log integrity controls",
            "Log retention policy"
        ],
        "framework_refs": {
            "iso": [
                "A.8.15"
            ],
            "soc2": [
                "CC2.1.4"
            ],
            "recyf": [
                "10.B.7",
                "12.7",
                "20.5",
                "20.6"
            ],
            "secnumcloud": [
                "12.5.b",
                "12.6.a",
                "12.6.b",
                "12.6.c",
                "12.6.d",
                "12.7.a",
                "12.7.b",
                "12.7.c",
                "12.7.d",
                "12.7.e"
            ],
            "cra": [
                "1.1.2.l"
            ],
            "hds": [
                "EXI-05.j",
                "EXI-15.c",
                "EXI-16.b"
            ],
            "anssi": [
                "36",
                "36.R"
            ],
            "lpm": [
                "5.1",
                "5.2",
                "5.11",
                "5.12",
                "8.4",
                "15.8"
            ],
            "loi0520": [
                "ART-26",
                "ART-50"
            ]
        }
    },
    {
        "id": "MON.SIEM",
        "category": "process",
        "csf_function": "detect",
        "name": "Surveillance des activités via SIEM",
        "name_en": "Activity monitoring via SIEM",
        "description": "Corréler et analyser en continu les journaux et flux réseau dans un SIEM pour détecter les comportements anormaux et les indicateurs de compromission.",
        "description_en": "Continuously correlate and analyze logs and network flows in a SIEM to detect anomalous behavior and indicators of compromise.",
        "typical_evidence": [
            "Règles de corrélation SIEM",
            "Tableaux de bord de surveillance"
        ],
        "typical_evidence_en": [
            "SIEM correlation rules",
            "Monitoring dashboards"
        ],
        "framework_refs": {
            "iso": [
                "A.8.16"
            ],
            "soc2": [
                "CC2.1.3",
                "CC6.8.2",
                "CC7.1.3",
                "CC7.2.1",
                "CC7.2.3",
                "CC7.2.4"
            ],
            "recyf": [
                "20.1",
                "20.2",
                "20.3",
                "20.4"
            ],
            "secnumcloud": [
                "12.6.b",
                "12.8.b",
                "12.9.a",
                "12.9.b",
                "12.9.c",
                "13.3.a"
            ],
            "cra": [
                "3.1.7"
            ],
            "anssi": [
                "36.R"
            ],
            "lpm": [
                "6.1",
                "6.2",
                "6.3",
                "7.1",
                "7.3"
            ],
            "loi0520": [
                "ART-7"
            ],
            "dora": [
                "DORA-9",
                "DORA-10",
                "DORA-16"
            ]
        }
    },
    {
        "id": "MON.ALERT",
        "category": "process",
        "csf_function": "detect",
        "name": "Détection d'anomalies et alertes",
        "name_en": "Anomaly detection and alerting",
        "description": "Définir des seuils et scénarios de détection déclenchant des alertes qualifiées, transmises aux équipes de réponse pour prise en charge dans des délais définis.",
        "description_en": "Define thresholds and detection scenarios that trigger qualified alerts, routed to response teams for handling within defined timeframes.",
        "typical_evidence": [
            "Catalogue des scénarios de détection",
            "Journal des alertes traitées"
        ],
        "typical_evidence_en": [
            "Detection scenario catalogue",
            "Handled alert log"
        ],
        "framework_refs": {
            "iso": [
                "A.8.16"
            ],
            "soc2": [
                "A1.2.4",
                "A1.2.6",
                "CC7.2.2",
                "CC7.2.3",
                "CC7.3.2"
            ],
            "recyf": [
                "12.3",
                "20.1"
            ],
            "secnumcloud": [
                "12.9.a",
                "12.9.c",
                "16.3.b"
            ],
            "cra": [
                "1.1.2.l",
                "3.1.7",
                "7.2.c"
            ],
            "hds": [
                "EXI-05.m"
            ],
            "anssi": [
                "8.R"
            ],
            "lpm": [
                "6.1",
                "6.3"
            ],
            "loi0520": [
                "ART-7"
            ],
            "dora": [
                "DORA-10"
            ]
        }
    },
    {
        "id": "TIME.SYNC",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Synchronisation des horloges",
        "name_en": "Clock synchronization",
        "description": "Synchroniser les horloges de l'ensemble des systèmes sur une source de temps fiable et unique afin de garantir la cohérence des horodatages dans les journaux.",
        "description_en": "Synchronize the clocks of all systems to a single reliable time source to ensure timestamp consistency across logs.",
        "typical_evidence": [
            "Configuration des serveurs NTP",
            "Rapport de conformité de synchronisation horaire"
        ],
        "typical_evidence_en": [
            "NTP server configuration",
            "Time synchronization compliance report"
        ],
        "framework_refs": {
            "iso": [
                "A.8.17"
            ],
            "recyf": [
                "20.4"
            ],
            "secnumcloud": [
                "12.8.a",
                "12.8.b"
            ],
            "anssi": [
                "36"
            ],
            "lpm": [
                "5.10"
            ],
            "loi0520": [
                "ART-26"
            ]
        }
    },
    {
        "id": "PRIV.UTIL-RESTRICT",
        "category": "process",
        "csf_function": "protect",
        "name": "Restriction des utilitaires à privilèges",
        "name_en": "Restriction of privileged utility programs",
        "description": "Limiter l'accès aux programmes utilitaires capables de contourner les contrôles système ou applicatifs aux seuls administrateurs autorisés et pour des besoins justifiés.",
        "description_en": "Restrict access to utility programs able to bypass system or application controls to authorized administrators only and for justified needs.",
        "typical_evidence": [
            "Liste des utilitaires à privilèges recensés",
            "Matrice des droits d'accès aux utilitaires"
        ],
        "typical_evidence_en": [
            "Inventory of privileged utility programs",
            "Access rights matrix for utilities"
        ],
        "framework_refs": {
            "iso": [
                "A.8.18"
            ],
            "soc2": [
                "CC6.8.1"
            ],
            "lpm": [
                "14.5"
            ]
        }
    },
    {
        "id": "PRIV.UTIL-LOG",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Journalisation de l'usage des utilitaires à privilèges",
        "name_en": "Logging of privileged utility usage",
        "description": "Enregistrer et revoir périodiquement chaque exécution d'un programme utilitaire à privilèges afin de détecter les abus ou les actions non autorisées.",
        "description_en": "Record and periodically review each execution of a privileged utility program to detect misuse or unauthorized actions.",
        "typical_evidence": [
            "Journaux d'exécution des utilitaires",
            "Rapports de revue des usages privilégiés"
        ],
        "typical_evidence_en": [
            "Utility execution logs",
            "Privileged usage review reports"
        ],
        "framework_refs": {
            "iso": [
                "A.8.18"
            ],
            "recyf": [
                "11.A.5",
                "19.12"
            ],
            "lpm": [
                "5.9"
            ]
        }
    },
    {
        "id": "SW.INSTALL-POLICY",
        "category": "policy",
        "csf_function": "govern",
        "name": "Politique d'installation de logiciels",
        "name_en": "Software installation policy",
        "description": "Définir les règles autorisant qui peut installer des logiciels sur les systèmes opérationnels, selon quelles sources et quel processus d'approbation.",
        "description_en": "Define rules governing who may install software on operational systems, from which sources and through which approval process.",
        "typical_evidence": [
            "Politique d'installation de logiciels",
            "Liste des sources logicielles approuvées"
        ],
        "typical_evidence_en": [
            "Software installation policy",
            "List of approved software sources"
        ],
        "framework_refs": {
            "iso": [
                "A.8.19"
            ],
            "soc2": [
                "CC6.8.1"
            ],
            "recyf": [
                "5.B.8",
                "18.1"
            ],
            "secnumcloud": [
                "12.10.a",
                "12.10.b"
            ],
            "anssi": [
                "29"
            ]
        }
    },
    {
        "id": "SW.INSTALL-ALLOWLIST",
        "category": "process",
        "csf_function": "protect",
        "name": "Liste d'autorisation des applications",
        "name_en": "Application allow-listing",
        "description": "Contrôler l'exécution des logiciels sur les systèmes de production au moyen d'une liste d'applications autorisées pour bloquer les binaires non validés.",
        "description_en": "Control software execution on production systems through an allow-list of authorized applications to block unvetted binaries.",
        "typical_evidence": [
            "Configuration de la liste d'autorisation",
            "Rapport des tentatives d'exécution bloquées"
        ],
        "typical_evidence_en": [
            "Allow-list configuration",
            "Report of blocked execution attempts"
        ],
        "framework_refs": {
            "iso": [
                "A.8.19"
            ],
            "soc2": [
                "CC6.8.1",
                "CC7.1.4"
            ],
            "recyf": [
                "18.1"
            ],
            "secnumcloud": [
                "12.10.a",
                "12.10.c"
            ],
            "cra": [
                "3.1.2"
            ],
            "anssi": [
                "14",
                "15.R"
            ],
            "lpm": [
                "19.1",
                "19.2"
            ]
        }
    },
    {
        "id": "NET.PERIMETER",
        "category": "process",
        "csf_function": "protect",
        "name": "Protection périmétrique et pare-feu",
        "name_en": "Perimeter protection and firewalling",
        "description": "Déployer et maintenir des pare-feu filtrant les flux entrants et sortants selon des règles fondées sur le principe du moindre privilège réseau.",
        "description_en": "Deploy and maintain firewalls filtering inbound and outbound traffic through rules based on the least-privilege network principle.",
        "typical_evidence": [
            "Ensemble de règles de pare-feu",
            "Rapport de revue périodique des règles"
        ],
        "typical_evidence_en": [
            "Firewall rule set",
            "Periodic rule review report"
        ],
        "framework_refs": {
            "iso": [
                "A.8.20"
            ],
            "soc2": [
                "CC5.2.2",
                "CC6.1.6",
                "CC6.6.1",
                "CC6.6.4"
            ],
            "recyf": [
                "7.A.5",
                "7.A.6",
                "7.A.7",
                "7.A.8",
                "7.B.1",
                "7.B.2",
                "7.B.3",
                "7.B.4",
                "7.B.5",
                "9.3",
                "9.4",
                "11.B.5",
                "19.8"
            ],
            "secnumcloud": [
                "9.6.d",
                "9.6.e",
                "9.6.i",
                "9.6.j",
                "9.6.k",
                "13.2.d",
                "13.2.e"
            ],
            "cra": [
                "3.1.5",
                "3.1.11",
                "3.2.2"
            ],
            "hds": [
                "EXI-05.f"
            ],
            "anssi": [
                "17",
                "17.R",
                "19",
                "22",
                "23",
                "25",
                "25.R"
            ],
            "lpm": [
                "3.2",
                "3.5",
                "10.7",
                "10.9",
                "16.4",
                "17.1",
                "17.2",
                "17.3",
                "17.4",
                "17.5",
                "17.6",
                "17.7",
                "18.1"
            ],
            "loi0520": [
                "ART-29"
            ]
        }
    },
    {
        "id": "NET.IDS",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Détection d'intrusion réseau",
        "name_en": "Network intrusion detection",
        "description": "Surveiller le trafic réseau à l'aide de sondes de détection d'intrusion afin d'identifier les comportements anormaux ou malveillants.",
        "description_en": "Monitor network traffic using intrusion detection sensors to identify anomalous or malicious behavior.",
        "typical_evidence": [
            "Configuration des sondes IDS/IPS",
            "Alertes et tickets d'investigation"
        ],
        "typical_evidence_en": [
            "IDS/IPS sensor configuration",
            "Alerts and investigation tickets"
        ],
        "framework_refs": {
            "iso": [
                "A.8.20"
            ],
            "soc2": [
                "CC6.6.4",
                "CC7.2.1",
                "CC7.2.2"
            ],
            "recyf": [
                "7.A.6"
            ],
            "secnumcloud": [
                "12.9.a",
                "13.3.a"
            ],
            "cra": [
                "3.2.2"
            ],
            "anssi": [
                "25.R"
            ],
            "lpm": [
                "7.1",
                "7.2",
                "7.3"
            ],
            "loi0520": [
                "ART-7",
                "ART-31"
            ],
            "dora": [
                "DORA-10"
            ]
        }
    },
    {
        "id": "NET.MONITOR",
        "category": "process",
        "csf_function": "detect",
        "name": "Supervision et journalisation réseau",
        "name_en": "Network monitoring and logging",
        "description": "Collecter et corréler les journaux des équipements réseau pour maintenir une visibilité continue sur les flux et les événements de sécurité.",
        "description_en": "Collect and correlate network device logs to maintain continuous visibility over flows and security events.",
        "typical_evidence": [
            "Tableau de bord de supervision réseau",
            "Politique de conservation des journaux réseau"
        ],
        "typical_evidence_en": [
            "Network monitoring dashboard",
            "Network log retention policy"
        ],
        "framework_refs": {
            "iso": [
                "A.8.20"
            ],
            "soc2": [
                "CC6.1.6"
            ],
            "recyf": [
                "7.A.5",
                "7.A.6",
                "20.4"
            ],
            "secnumcloud": [
                "12.14.a"
            ],
            "cra": [
                "3.1.6",
                "3.2.2"
            ],
            "anssi": [
                "17.R"
            ],
            "lpm": [
                "5.5",
                "5.6",
                "5.8",
                "7.2"
            ],
            "loi0520": [
                "ART-28",
                "ART-31"
            ]
        }
    },
    {
        "id": "NET.SVC-AGREEMENT",
        "category": "policy",
        "csf_function": "govern",
        "name": "Accords de sécurité des services réseau",
        "name_en": "Network service security agreements",
        "description": "Formaliser les mécanismes de sécurité, niveaux de service et exigences de gestion attendus des services réseau internes et fournis par des tiers.",
        "description_en": "Formalize the security mechanisms, service levels and management requirements expected from internal and third-party network services.",
        "typical_evidence": [
            "Accords de niveau de service réseau",
            "Fiche des exigences de sécurité des services réseau"
        ],
        "typical_evidence_en": [
            "Network service level agreements",
            "Network service security requirements sheet"
        ],
        "framework_refs": {
            "iso": [
                "A.8.21"
            ],
            "recyf": [
                "7.B.1"
            ],
            "hds": [
                "EXI-18",
                "EXI-21"
            ]
        }
    },
    {
        "id": "NET.SVC-HARDEN",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Durcissement des services réseau",
        "name_en": "Network service hardening",
        "description": "Désactiver les services et protocoles réseau inutiles et appliquer des configurations sécurisées aux services actifs.",
        "description_en": "Disable unnecessary network services and protocols and apply secure configurations to active services.",
        "typical_evidence": [
            "Guides de configuration sécurisée des services réseau",
            "Rapport de scan de services exposés"
        ],
        "typical_evidence_en": [
            "Secure network service configuration baselines",
            "Exposed service scan report"
        ],
        "framework_refs": {
            "iso": [
                "A.8.21"
            ],
            "soc2": [
                "CC6.1.7",
                "CC6.6.1",
                "CC7.1.1"
            ],
            "recyf": [
                "7.B.3",
                "18.2",
                "18.3",
                "19.2"
            ],
            "secnumcloud": [
                "13.2.d"
            ],
            "cra": [
                "1.1.2.b",
                "1.1.2.j",
                "3.1.6",
                "3.1.9'",
                "3.1.11"
            ],
            "anssi": [
                "12",
                "21",
                "24.R"
            ],
            "lpm": [
                "3.8",
                "17.2",
                "19.1"
            ]
        }
    },
    {
        "id": "NET.SEGMENT",
        "category": "process",
        "csf_function": "protect",
        "name": "Segmentation réseau",
        "name_en": "Network segmentation",
        "description": "Découper le réseau en zones distinctes selon la sensibilité et la fonction afin de limiter la propagation latérale des menaces.",
        "description_en": "Divide the network into distinct zones based on sensitivity and function to limit the lateral spread of threats.",
        "typical_evidence": [
            "Schéma de segmentation réseau",
            "Matrice des flux inter-zones autorisés"
        ],
        "typical_evidence_en": [
            "Network segmentation diagram",
            "Authorized inter-zone flow matrix"
        ],
        "framework_refs": {
            "iso": [
                "A.8.22"
            ],
            "soc2": [
                "CC6.1.5"
            ],
            "recyf": [
                "5.B.6",
                "7.A.1",
                "7.A.2",
                "7.A.3",
                "7.A.4",
                "7.A.7",
                "7.A.8",
                "7.B.2",
                "7.B.3",
                "7.B.4",
                "11.B.5",
                "19.1",
                "19.7",
                "19.8"
            ],
            "secnumcloud": [
                "5.3.c",
                "9.6.a",
                "9.6.d",
                "9.6.g",
                "9.6.i",
                "9.6.j",
                "9.6.k",
                "9.7.a",
                "9.7.b",
                "9.7.c",
                "13.1.a",
                "13.2.a",
                "13.2.b",
                "13.2.c",
                "13.2.e"
            ],
            "cra": [
                "1.1.2.i",
                "1.1.2.j",
                "3.1.9'",
                "3.1.11",
                "4.2"
            ],
            "hds": [
                "EXI-05.f"
            ],
            "anssi": [
                "7",
                "7.R",
                "19",
                "20",
                "23",
                "28",
                "28.R"
            ],
            "lpm": [
                "3.3",
                "3.5",
                "10.6",
                "10.7",
                "15.5",
                "15.6",
                "16.1",
                "16.2",
                "16.3",
                "16.4",
                "16.5",
                "17.1",
                "17.3"
            ]
        }
    },
    {
        "id": "NET.ISOLATION",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Isolation des zones sensibles",
        "name_en": "Isolation of sensitive zones",
        "description": "Isoler les systèmes traitant des données critiques dans des segments dédiés dont les accès sont strictement filtrés.",
        "description_en": "Isolate systems handling critical data in dedicated segments whose access is strictly filtered.",
        "typical_evidence": [
            "Règles de filtrage des zones sensibles",
            "Inventaire des systèmes par zone de sensibilité"
        ],
        "typical_evidence_en": [
            "Sensitive zone filtering rules",
            "Inventory of systems per sensitivity zone"
        ],
        "framework_refs": {
            "iso": [
                "A.8.22"
            ],
            "soc2": [
                "CC6.1.5"
            ],
            "recyf": [
                "5.B.6",
                "5.B.9",
                "7.A.1",
                "7.A.2",
                "7.A.3",
                "7.A.4",
                "11.B.2",
                "11.B.4",
                "11.B.5",
                "14.8",
                "18.2",
                "19.1",
                "19.3",
                "19.6",
                "19.7",
                "19.9"
            ],
            "secnumcloud": [
                "9.6.b",
                "9.6.c",
                "9.6.d",
                "9.6.g",
                "9.6.i",
                "9.6.j",
                "9.6.k",
                "9.7.a",
                "9.7.b",
                "9.7.c",
                "12.10.c",
                "12.12.a",
                "12.14.a",
                "13.2.a",
                "13.2.b"
            ],
            "cra": [
                "1.1.2.k",
                "3.1.9'",
                "3.2.1"
            ],
            "anssi": [
                "19",
                "20",
                "23",
                "24.R",
                "25",
                "27",
                "27.R",
                "28",
                "28.R"
            ],
            "lpm": [
                "6.2",
                "8.3",
                "10.6",
                "10.10",
                "10.11",
                "15.2",
                "15.5",
                "15.6",
                "16.1",
                "16.2",
                "16.3",
                "17.3",
                "20.11"
            ]
        }
    },
    {
        "id": "WEB.FILTER",
        "category": "process",
        "csf_function": "protect",
        "name": "Filtrage des accès web",
        "name_en": "Web access filtering",
        "description": "Filtrer les connexions sortantes vers Internet pour empêcher l'accès aux sites malveillants ou non autorisés.",
        "description_en": "Filter outbound Internet connections to prevent access to malicious or unauthorized websites.",
        "typical_evidence": [
            "Configuration du proxy de filtrage web",
            "Journaux d'accès web bloqués"
        ],
        "typical_evidence_en": [
            "Web filtering proxy configuration",
            "Blocked web access logs"
        ],
        "framework_refs": {
            "iso": [
                "A.8.23"
            ],
            "recyf": [
                "7.A.5",
                "9.7"
            ],
            "cra": [
                "3.1.2"
            ],
            "anssi": [
                "22",
                "27"
            ],
            "lpm": [
                "10.9"
            ]
        }
    },
    {
        "id": "WEB.CATEGORIES",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Catégorisation et blocage de contenus web",
        "name_en": "Web content categorization and blocking",
        "description": "Maintenir des catégories de contenus interdits et mettre à jour régulièrement les listes de blocage utilisées par les outils de filtrage.",
        "description_en": "Maintain categories of prohibited content and regularly update the block-lists used by filtering tools.",
        "typical_evidence": [
            "Politique des catégories web bloquées",
            "Historique de mise à jour des listes de blocage"
        ],
        "typical_evidence_en": [
            "Blocked web category policy",
            "Block-list update history"
        ],
        "framework_refs": {
            "iso": [
                "A.8.23"
            ],
            "anssi": [
                "22.R"
            ]
        }
    },
    {
        "id": "CRY.POLICY",
        "category": "policy",
        "csf_function": "protect",
        "name": "Politique cryptographique",
        "name_en": "Cryptographic policy",
        "description": "Définir les règles d'emploi de la cryptographie : cas d'usage, algorithmes acceptés, longueurs de clés et responsabilités associées.",
        "description_en": "Define the rules for using cryptography: use cases, accepted algorithms, key lengths and associated responsibilities.",
        "typical_evidence": [
            "Politique cryptographique",
            "Registre des usages cryptographiques"
        ],
        "typical_evidence_en": [
            "Cryptographic policy",
            "Register of cryptographic uses"
        ],
        "framework_refs": {
            "iso": [
                "A.8.24"
            ],
            "soc2": [
                "CC6.1.10",
                "CC6.7.2"
            ],
            "recyf": [
                "2.B.5",
                "8.1",
                "19.10",
                "19.11"
            ],
            "secnumcloud": [
                "10.1.a",
                "10.1.b",
                "10.1.c",
                "10.2.a",
                "10.2.b",
                "10.2.c",
                "10.2.d",
                "10.2.e",
                "10.3.b",
                "10.3.c",
                "10.3.d",
                "10.4.a",
                "10.4.b",
                "10.5.a",
                "10.5.b",
                "10.5.c",
                "10.5.d",
                "10.6.a"
            ],
            "cra": [
                "1.1.2.e"
            ],
            "hds": [
                "EXI-30.b"
            ],
            "anssi": [
                "18",
                "21",
                "25",
                "31",
                "32"
            ],
            "lpm": [
                "15.7",
                "18.3",
                "20.12"
            ],
            "nis2": [
                "21.2.h"
            ],
            "dora": [
                "DORA-9"
            ]
        }
    },
    {
        "id": "CRY.KEYMGMT",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Gestion du cycle de vie des clés",
        "name_en": "Key lifecycle management",
        "description": "Gérer la génération, la distribution, le stockage, la rotation et la révocation des clés cryptographiques de manière sécurisée.",
        "description_en": "Manage the secure generation, distribution, storage, rotation and revocation of cryptographic keys.",
        "typical_evidence": [
            "Procédure de gestion des clés",
            "Inventaire des clés et certificats"
        ],
        "typical_evidence_en": [
            "Key management procedure",
            "Key and certificate inventory"
        ],
        "framework_refs": {
            "iso": [
                "A.8.24"
            ],
            "soc2": [
                "CC6.1.11"
            ],
            "secnumcloud": [
                "10.1.a",
                "10.1.b",
                "10.1.c",
                "10.4.a",
                "10.4.b",
                "10.5.a",
                "10.5.b",
                "10.5.c",
                "10.5.d",
                "10.6.a"
            ],
            "cra": [
                "3.1.3",
                "3.1.9",
                "3.1.12",
                "3.1.13",
                "3.2.3",
                "3.2.4",
                "4.1",
                "4.3"
            ],
            "anssi": [
                "12.R",
                "13.R",
                "30.R"
            ],
            "lpm": [
                "12.2"
            ],
            "nis2": [
                "21.2.h"
            ]
        }
    },
    {
        "id": "CRY.ALGO",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Sélection des algorithmes cryptographiques",
        "name_en": "Cryptographic algorithm selection",
        "description": "Choisir et maintenir des algorithmes et longueurs de clés conformes à l'état de l'art, en retirant ceux devenus obsolètes.",
        "description_en": "Select and maintain algorithms and key lengths compliant with the state of the art, retiring those that become obsolete.",
        "typical_evidence": [
            "Liste des algorithmes approuvés",
            "Rapport de revue des algorithmes obsolètes"
        ],
        "typical_evidence_en": [
            "List of approved algorithms",
            "Obsolete algorithm review report"
        ],
        "framework_refs": {
            "iso": [
                "A.8.24"
            ],
            "soc2": [
                "CC6.1.11"
            ],
            "secnumcloud": [
                "10.1.b",
                "10.1.c",
                "10.2.a",
                "10.2.b",
                "10.2.c",
                "10.2.d",
                "10.2.e",
                "10.3.b",
                "10.3.c",
                "10.3.d",
                "10.4.a",
                "10.4.b",
                "10.5.a",
                "10.5.b",
                "10.6.a"
            ],
            "cra": [
                "1.1.2.e",
                "1.1.2.f",
                "1.2.7",
                "3.1.5",
                "3.1.8",
                "3.1.9",
                "3.1.12",
                "3.1.13",
                "3.1.18",
                "4.2",
                "4.3"
            ],
            "anssi": [
                "20",
                "21"
            ],
            "nis2": [
                "21.2.h"
            ]
        }
    },
    {
        "id": "DEV.SDLC",
        "category": "policy",
        "csf_function": "govern",
        "name": "Cycle de développement sécurisé",
        "name_en": "Secure development life cycle",
        "description": "Intégrer des exigences et points de contrôle de sécurité à chaque phase du cycle de vie de développement logiciel.",
        "description_en": "Embed security requirements and control points at every phase of the software development life cycle.",
        "typical_evidence": [
            "Politique de développement sécurisé",
            "Jalons de sécurité du SDLC"
        ],
        "typical_evidence_en": [
            "Secure development policy",
            "SDLC security gates"
        ],
        "framework_refs": {
            "iso": [
                "A.8.25"
            ],
            "soc2": [
                "CC5.2.4",
                "CC8.1.1",
                "CC8.1.10"
            ],
            "secnumcloud": [
                "12.3.a",
                "14.1.a",
                "14.2.a",
                "14.2.c"
            ],
            "cra": [
                "1.1.1",
                "7.2",
                "7.2.a",
                "8.1.3",
                "8.4.2",
                "8.4.3.2",
                "8.4.3.2.3"
            ],
            "nis2": [
                "21.2.e"
            ]
        }
    },
    {
        "id": "DEV.REPO-SECURE",
        "category": "process",
        "csf_function": "protect",
        "name": "Sécurisation des dépôts de code",
        "name_en": "Source code repository protection",
        "description": "Contrôler les accès aux dépôts de code source, tracer les modifications et protéger les branches critiques.",
        "description_en": "Control access to source code repositories, track changes and protect critical branches.",
        "typical_evidence": [
            "Règles de protection de branches",
            "Journal des accès au dépôt"
        ],
        "typical_evidence_en": [
            "Branch protection rules",
            "Repository access log"
        ],
        "framework_refs": {
            "iso": [
                "A.8.25"
            ],
            "secnumcloud": [
                "14.4.a"
            ]
        }
    },
    {
        "id": "DEV.APP-REQ",
        "category": "process",
        "csf_function": "identify",
        "name": "Définition des exigences de sécurité applicative",
        "name_en": "Definition of application security requirements",
        "description": "Identifier et documenter les exigences de sécurité de chaque application dès la phase de spécification, en fonction de sa criticité.",
        "description_en": "Identify and document the security requirements of each application from the specification phase, based on its criticality.",
        "typical_evidence": [
            "Cahier des exigences de sécurité applicative",
            "Analyse de risque de l'application"
        ],
        "typical_evidence_en": [
            "Application security requirements document",
            "Application risk analysis"
        ],
        "framework_refs": {
            "iso": [
                "A.8.26"
            ],
            "soc2": [
                "CC8.1.18",
                "PP1.1",
                "PP1.2",
                "PP1.4",
                "PP1.5"
            ],
            "cra": [
                "1.1.1",
                "2.4",
                "2.8.f",
                "3.1.14",
                "7.1.a",
                "7.2.a",
                "8.4.3.2.2"
            ]
        }
    },
    {
        "id": "DEV.APP-AUTHCTRL",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Contrôles d'authentification et d'autorisation applicatifs",
        "name_en": "Application authentication and authorization controls",
        "description": "Mettre en œuvre dans les applications des mécanismes robustes d'authentification, de gestion de session et de contrôle d'accès.",
        "description_en": "Implement robust authentication, session management and access control mechanisms within applications.",
        "typical_evidence": [
            "Spécifications des contrôles d'accès applicatifs",
            "Résultats de tests d'authentification"
        ],
        "typical_evidence_en": [
            "Application access control specifications",
            "Authentication test results"
        ],
        "framework_refs": {
            "iso": [
                "A.8.26"
            ],
            "cra": [
                "1.1.2.d"
            ]
        }
    },
    {
        "id": "DEV.SEC-ARCH",
        "category": "policy",
        "csf_function": "protect",
        "name": "Principes d'architecture sécurisée",
        "name_en": "Secure architecture principles",
        "description": "Formaliser les principes de conception sécurisée (défense en profondeur, moindre privilège, sécurité par défaut) applicables aux nouveaux systèmes.",
        "description_en": "Formalize secure design principles (defense in depth, least privilege, secure by default) applicable to new systems.",
        "typical_evidence": [
            "Référentiel des principes d'architecture sécurisée",
            "Modèles d'architecture de référence"
        ],
        "typical_evidence_en": [
            "Secure architecture principles reference",
            "Reference architecture patterns"
        ],
        "framework_refs": {
            "iso": [
                "A.8.27"
            ],
            "soc2": [
                "CC6.1.2",
                "CC8.1.3"
            ],
            "secnumcloud": [
                "14.1.a"
            ],
            "cra": [
                "1.1.1",
                "2.4",
                "2.8.f",
                "3.1.14",
                "7.2.a",
                "8.4.3.2.2"
            ]
        }
    },
    {
        "id": "DEV.ARCH-REVIEW",
        "category": "process",
        "csf_function": "protect",
        "name": "Revue d'architecture de sécurité",
        "name_en": "Security architecture review",
        "description": "Soumettre les conceptions de systèmes à une revue de sécurité vérifiant l'application des principes d'ingénierie sécurisée avant réalisation.",
        "description_en": "Submit system designs to a security review verifying the application of secure engineering principles before build.",
        "typical_evidence": [
            "Comptes rendus de revue d'architecture",
            "Modélisation des menaces (threat modeling)"
        ],
        "typical_evidence_en": [
            "Architecture review minutes",
            "Threat modeling records"
        ],
        "framework_refs": {
            "iso": [
                "A.8.27"
            ],
            "soc2": [
                "CC6.1.2"
            ],
            "cra": [
                "8.2.2",
                "8.4.3.2.4"
            ],
            "lpm": [
                "2.3"
            ]
        }
    },
    {
        "id": "DEV.SEC-CODE",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Standards de codage sécurisé",
        "name_en": "Secure coding standards",
        "description": "Établir et diffuser des règles de codage sécurisé couvrant la validation des entrées, la gestion des erreurs et les vulnérabilités courantes.",
        "description_en": "Establish and distribute secure coding rules covering input validation, error handling and common vulnerabilities.",
        "typical_evidence": [
            "Guide de codage sécurisé",
            "Configuration des règles d'analyse statique"
        ],
        "typical_evidence_en": [
            "Secure coding guideline",
            "Static analysis rule configuration"
        ],
        "framework_refs": {
            "iso": [
                "A.8.28"
            ],
            "soc2": [
                "CC8.1.3",
                "PP1.2",
                "PP1.3"
            ],
            "secnumcloud": [
                "14.1.a"
            ],
            "nis2": [
                "21.2.e"
            ]
        }
    },
    {
        "id": "DEV.CODE-REVIEW",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Revue de code sécurisée",
        "name_en": "Secure code review",
        "description": "Réaliser des revues de code, manuelles et automatisées, pour identifier les failles avant l'intégration des modifications.",
        "description_en": "Perform manual and automated code reviews to identify flaws before changes are merged.",
        "typical_evidence": [
            "Traces de revues de code (pull requests)",
            "Rapports d'analyse statique (SAST)"
        ],
        "typical_evidence_en": [
            "Code review records (pull requests)",
            "Static analysis (SAST) reports"
        ],
        "framework_refs": {
            "iso": [
                "A.8.28"
            ],
            "secnumcloud": [
                "14.6.a"
            ],
            "cra": [
                "1.2.3",
                "8.4.3.2.4"
            ],
            "nis2": [
                "21.2.e"
            ],
            "dora": [
                "DORA-25"
            ]
        }
    },
    {
        "id": "DEV.SCA-DEPS",
        "category": "process",
        "csf_function": "identify",
        "name": "Analyse des composants et dépendances tiers",
        "name_en": "Third-party component and dependency analysis",
        "description": "Recenser les bibliothèques tierces et analyser leurs vulnérabilités connues avant leur intégration dans le code.",
        "description_en": "Inventory third-party libraries and analyze their known vulnerabilities before integrating them into the code.",
        "typical_evidence": [
            "Nomenclature logicielle (SBOM)",
            "Rapports d'analyse de composition (SCA)"
        ],
        "typical_evidence_en": [
            "Software bill of materials (SBOM)",
            "Software composition analysis (SCA) reports"
        ],
        "framework_refs": {
            "iso": [
                "A.8.28"
            ],
            "recyf": [
                "5.B.8"
            ],
            "cra": [
                "1.2.1",
                "2.9",
                "7.8"
            ],
            "nis2": [
                "21.2.e"
            ],
            "dora": [
                "DORA-25"
            ]
        }
    },
    {
        "id": "DEV.DEV-TRAINING",
        "category": "training",
        "csf_function": "protect",
        "name": "Formation des développeurs au codage sécurisé",
        "name_en": "Developer secure coding training",
        "description": "Former régulièrement les développeurs aux vulnérabilités logicielles courantes et aux bonnes pratiques de codage sécurisé.",
        "description_en": "Regularly train developers on common software vulnerabilities and secure coding best practices.",
        "typical_evidence": [
            "Support de formation au codage sécurisé",
            "Registre de participation des développeurs"
        ],
        "typical_evidence_en": [
            "Secure coding training material",
            "Developer attendance register"
        ],
        "framework_refs": {
            "iso": [
                "A.8.25"
            ],
            "soc2": [
                "CC1.4.7"
            ],
            "recyf": [
                "4.5"
            ],
            "secnumcloud": [
                "14.1.b"
            ],
            "anssi": [
                "1"
            ]
        }
    },
    {
        "id": "DEV.SEC-TEST",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Tests de sécurité durant le développement",
        "name_en": "Security testing during development",
        "description": "Exécuter des tests de sécurité automatisés (SAST, DAST) au fil du développement pour détecter les vulnérabilités au plus tôt.",
        "description_en": "Run automated security tests (SAST, DAST) throughout development to detect vulnerabilities as early as possible.",
        "typical_evidence": [
            "Rapports de tests de sécurité intégrés au pipeline",
            "Suivi de correction des vulnérabilités"
        ],
        "typical_evidence_en": [
            "Pipeline-integrated security test reports",
            "Vulnerability remediation tracking"
        ],
        "framework_refs": {
            "iso": [
                "A.8.29"
            ],
            "soc2": [
                "CC8.1.7",
                "PP1.3"
            ],
            "secnumcloud": [
                "14.3.a",
                "14.6.a",
                "18.2.2.a"
            ],
            "cra": [
                "1.1.2.a",
                "1.2.3",
                "7.6",
                "8.2.3.4",
                "8.2.4.3",
                "8.2.4.4",
                "8.4.3.2.6"
            ],
            "nis2": [
                "21.2.e"
            ],
            "dora": [
                "DORA-24",
                "DORA-25",
                "DORA-26"
            ]
        }
    },
    {
        "id": "DEV.ACCEPT-TEST",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Tests de sécurité à l'acceptation",
        "name_en": "Security acceptance testing",
        "description": "Définir et valider des critères de sécurité conditionnant l'acceptation d'un système avant sa mise en production.",
        "description_en": "Define and validate security criteria conditioning the acceptance of a system before it goes into production.",
        "typical_evidence": [
            "Critères d'acceptation de sécurité",
            "Procès-verbal de recette de sécurité"
        ],
        "typical_evidence_en": [
            "Security acceptance criteria",
            "Security acceptance sign-off record"
        ],
        "framework_refs": {
            "iso": [
                "A.8.29"
            ],
            "soc2": [
                "CC8.1.7",
                "PP1.4"
            ],
            "secnumcloud": [
                "14.2.b",
                "14.3.a",
                "14.6.a"
            ],
            "cra": [
                "7.6",
                "8.4.3.2.6"
            ],
            "loi0520": [
                "ART-4",
                "ART-19",
                "ART-49"
            ]
        }
    },
    {
        "id": "DEV.OUTSOURCE-GOV",
        "category": "process",
        "csf_function": "govern",
        "name": "Encadrement du développement externalisé",
        "name_en": "Governance of outsourced development",
        "description": "Inscrire dans les contrats de développement externalisé les exigences de sécurité, droits d'audit et obligations de conformité du prestataire.",
        "description_en": "Include in outsourced development contracts the security requirements, audit rights and compliance obligations of the supplier.",
        "typical_evidence": [
            "Clauses de sécurité contractuelles",
            "Cahier des charges de sécurité du prestataire"
        ],
        "typical_evidence_en": [
            "Contractual security clauses",
            "Supplier security requirements specification"
        ],
        "framework_refs": {
            "iso": [
                "A.8.30"
            ],
            "secnumcloud": [
                "14.5.a"
            ]
        }
    },
    {
        "id": "DEV.OUTSOURCE-VERIFY",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Vérification des livrables externalisés",
        "name_en": "Verification of outsourced deliverables",
        "description": "Contrôler la sécurité du code et des livrables fournis par les prestataires avant leur acceptation et leur intégration.",
        "description_en": "Verify the security of code and deliverables provided by suppliers before acceptance and integration.",
        "typical_evidence": [
            "Rapports de tests de sécurité des livrables tiers",
            "Attestations de conformité du prestataire"
        ],
        "typical_evidence_en": [
            "Security test reports of third-party deliverables",
            "Supplier compliance attestations"
        ],
        "framework_refs": {
            "iso": [
                "A.8.30"
            ],
            "secnumcloud": [
                "14.5.a"
            ]
        }
    },
    {
        "id": "ENV.SEPARATION",
        "category": "process",
        "csf_function": "protect",
        "name": "Séparation des environnements",
        "name_en": "Environment separation",
        "description": "Cloisonner les environnements de développement, de test et de production pour éviter les interférences et les accès croisés.",
        "description_en": "Segregate development, test and production environments to prevent interference and cross-access.",
        "typical_evidence": [
            "Schéma de séparation des environnements",
            "Matrice des accès par environnement"
        ],
        "typical_evidence_en": [
            "Environment separation diagram",
            "Access matrix per environment"
        ],
        "framework_refs": {
            "iso": [
                "A.8.31"
            ],
            "soc2": [
                "CC8.1.7",
                "CC8.1.16"
            ],
            "secnumcloud": [
                "12.3.a",
                "14.4.a",
                "14.4.b"
            ],
            "cra": [
                "3.2.1"
            ],
            "lpm": [
                "6.2",
                "8.3",
                "14.4",
                "15.2",
                "15.3",
                "15.4",
                "15.5"
            ]
        }
    },
    {
        "id": "ENV.PROMOTION",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Contrôle des promotions entre environnements",
        "name_en": "Control of promotions between environments",
        "description": "Encadrer le passage du code et des configurations d'un environnement à l'autre par un processus contrôlé et tracé.",
        "description_en": "Govern the movement of code and configurations from one environment to another through a controlled and traced process.",
        "typical_evidence": [
            "Procédure de promotion vers la production",
            "Journal des mises en production"
        ],
        "typical_evidence_en": [
            "Promotion-to-production procedure",
            "Production release log"
        ],
        "framework_refs": {
            "iso": [
                "A.8.31"
            ],
            "soc2": [
                "CC8.1.9"
            ],
            "secnumcloud": [
                "12.3.a",
                "14.2.b"
            ]
        }
    },
    {
        "id": "CHG.MGMT",
        "category": "process",
        "csf_function": "protect",
        "name": "Processus de gestion des changements",
        "name_en": "Change management process",
        "description": "Encadrer toute modification des systèmes d'information par un processus formel d'enregistrement, d'évaluation et de suivi.",
        "description_en": "Govern any modification to information systems through a formal process of registration, assessment and tracking.",
        "typical_evidence": [
            "Procédure de gestion des changements",
            "Registre des demandes de changement"
        ],
        "typical_evidence_en": [
            "Change management procedure",
            "Change request register"
        ],
        "framework_refs": {
            "iso": [
                "A.8.32"
            ],
            "soc2": [
                "A1.1.3",
                "CC2.2.13",
                "CC5.2.4",
                "CC6.8.3",
                "CC8.1.1",
                "CC8.1.4",
                "CC8.1.5",
                "CC8.1.6",
                "CC8.1.9",
                "CC8.1.11",
                "CC8.1.14",
                "PP1.3"
            ],
            "secnumcloud": [
                "12.2.a",
                "12.2.b",
                "12.2.c",
                "12.2.d",
                "14.2.a"
            ],
            "cra": [
                "1.1.2.c",
                "1.2.2",
                "1.2.7",
                "1.2.8",
                "2.8.b",
                "2.8.c"
            ],
            "hds": [
                "EXI-05.l",
                "EXI-24.a"
            ],
            "lpm": [
                "4.2",
                "4.6",
                "17.4",
                "17.5"
            ]
        }
    },
    {
        "id": "CHG.APPROVAL",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Autorisation et évaluation d'impact des changements",
        "name_en": "Change approval and impact assessment",
        "description": "Soumettre chaque changement à une évaluation d'impact sécurité et à une autorisation formelle avant sa mise en œuvre.",
        "description_en": "Submit each change to a security impact assessment and formal authorization before implementation.",
        "typical_evidence": [
            "Fiches d'évaluation d'impact des changements",
            "Comptes rendus du comité de changement (CAB)"
        ],
        "typical_evidence_en": [
            "Change impact assessment forms",
            "Change advisory board (CAB) minutes"
        ],
        "framework_refs": {
            "iso": [
                "A.8.32"
            ],
            "soc2": [
                "CC3.4.4",
                "CC6.8.3",
                "CC8.1.2",
                "CC8.1.8",
                "CC8.1.10",
                "CC8.1.13"
            ],
            "secnumcloud": [
                "12.2.a",
                "12.2.b",
                "12.2.c",
                "12.2.d",
                "14.2.a",
                "14.2.b",
                "14.3.a",
                "18.2.3.a"
            ],
            "cra": [
                "8.2.c",
                "8.4.3.5",
                "8.4.3.f",
                "8.4.6.3"
            ],
            "hds": [
                "EXI-24.b"
            ],
            "lpm": [
                "4.5"
            ]
        }
    },
    {
        "id": "CHG.ROLLBACK",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Procédures de retour arrière des changements",
        "name_en": "Change rollback procedures",
        "description": "Prévoir et tester des procédures de retour arrière permettant de rétablir l'état antérieur en cas d'échec d'un changement.",
        "description_en": "Plan and test rollback procedures allowing restoration of the previous state in case of a failed change.",
        "typical_evidence": [
            "Plans de retour arrière documentés",
            "Résultats des tests de rollback"
        ],
        "typical_evidence_en": [
            "Documented rollback plans",
            "Rollback test results"
        ],
        "framework_refs": {
            "iso": [
                "A.8.32"
            ],
            "secnumcloud": [
                "12.2.a"
            ]
        }
    },
    {
        "id": "TEST.DATA-PROTECT",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Protection des données de test",
        "name_en": "Test data protection",
        "description": "Sélectionner, protéger et contrôler l'accès aux jeux de données utilisés pour les tests afin d'éviter toute exposition d'informations sensibles.",
        "description_en": "Select, protect and control access to datasets used for testing to prevent any exposure of sensitive information.",
        "typical_evidence": [
            "Procédure de gestion des données de test",
            "Registre des jeux de données de test"
        ],
        "typical_evidence_en": [
            "Test data management procedure",
            "Register of test datasets"
        ],
        "framework_refs": {
            "iso": [
                "A.8.33"
            ],
            "soc2": [
                "CC8.1.16",
                "CC8.1.17"
            ],
            "secnumcloud": [
                "14.7.a",
                "14.7.b"
            ]
        }
    },
    {
        "id": "TEST.DATA-MASK",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Anonymisation et masquage des données de test",
        "name_en": "Test data anonymization and masking",
        "description": "Anonymiser ou masquer les données de production réutilisées en test afin de supprimer les éléments identifiants ou confidentiels.",
        "description_en": "Anonymize or mask production data reused for testing to remove identifying or confidential elements.",
        "typical_evidence": [
            "Règles d'anonymisation des données de test",
            "Rapport de masquage appliqué"
        ],
        "typical_evidence_en": [
            "Test data anonymization rules",
            "Applied masking report"
        ],
        "framework_refs": {
            "iso": [
                "A.8.33"
            ],
            "soc2": [
                "CC8.1.17"
            ],
            "secnumcloud": [
                "14.7.b"
            ]
        }
    },
    {
        "id": "AUD.ACCESS-READONLY",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Accès en lecture seule pour les tests d'audit",
        "name_en": "Read-only access for audit testing",
        "description": "Restreindre les accès accordés aux auditeurs sur les systèmes en production à des consultations en lecture seule pour préserver l'intégrité des données.",
        "description_en": "Restrict access granted to auditors on production systems to read-only consultation to preserve data integrity.",
        "typical_evidence": [
            "Comptes d'audit en lecture seule",
            "Journal des accès des auditeurs"
        ],
        "typical_evidence_en": [
            "Read-only audit accounts",
            "Auditor access log"
        ],
        "framework_refs": {
            "iso": [
                "A.8.34"
            ],
            "cra": [
                "8.4.4.2"
            ],
            "hds": [
                "EXI-05.k",
                "EXI-15.a"
            ],
            "loi0520": [
                "ART-21"
            ]
        }
    },
    {
        "id": "AUD.SCOPE-PLAN",
        "category": "process",
        "csf_function": "govern",
        "name": "Périmètre et calendrier d'audit convenus",
        "name_en": "Agreed audit scope and schedule",
        "description": "Convenir à l'avance avec les auditeurs du périmètre, des systèmes concernés et du calendrier des tests pour limiter l'impact sur la production.",
        "description_en": "Agree in advance with auditors on the scope, systems involved and testing schedule to limit the impact on production.",
        "typical_evidence": [
            "Plan d'audit validé",
            "Convention de périmètre et de calendrier des tests"
        ],
        "typical_evidence_en": [
            "Approved audit plan",
            "Scope and testing schedule agreement"
        ],
        "framework_refs": {
            "iso": [
                "A.8.34"
            ],
            "cra": [
                "8.2.4.5"
            ],
            "hds": [
                "EXI-05.k",
                "EXI-15.a"
            ],
            "loi0520": [
                "ART-20",
                "ART-21",
                "ART-34"
            ]
        }
    },
    {
        "id": "AUD.SUPERVISION",
        "category": "procedure",
        "csf_function": "detect",
        "name": "Supervision des activités d'audit",
        "name_en": "Supervision of audit activities",
        "description": "Superviser et journaliser les tests d'audit réalisés sur les systèmes opérationnels afin de détecter tout dépassement de périmètre.",
        "description_en": "Supervise and log audit tests carried out on operational systems to detect any scope overrun.",
        "typical_evidence": [
            "Journal de supervision des tests d'audit",
            "Compte rendu de fin de tests d'audit"
        ],
        "typical_evidence_en": [
            "Audit test supervision log",
            "Audit testing closure report"
        ],
        "framework_refs": {
            "iso": [
                "A.8.34"
            ],
            "hds": [
                "EXI-05.k",
                "EXI-15.a"
            ],
            "loi0520": [
                "ART-21"
            ]
        }
    },
    {
        "id": "PRIV.NOTICE",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Information et transparence envers les personnes concernées",
        "name_en": "Privacy notice and transparency to data subjects",
        "description": "Rédiger, publier et tenir à jour une information claire sur les pratiques de traitement des données personnelles (finalités, catégories de données, destinataires, durées, droits, coordonnées de contact) et communiquer aux personnes et aux clients toute évolution significative de ces pratiques.",
        "description_en": "Draft, publish and keep up to date a clear notice on personal-data processing practices (purposes, data categories, recipients, retention, rights, contact details) and inform data subjects and customers of any significant change to those practices.",
        "typical_evidence": [
            "Politique de confidentialité datée et versionnée",
            "Historique des mises à jour de l'information et preuve de communication aux personnes"
        ],
        "typical_evidence_en": [
            "Dated and versioned privacy notice",
            "Change log of the notice with evidence of communication to data subjects"
        ],
        "framework_refs": {
            "iso": [
                "A.5.34"
            ],
            "soc2": [
                "CC2.2.9",
                "CC2.3.7",
                "CC2.3.8",
                "P1.1",
                "P8.1.1"
            ]
        }
    },
    {
        "id": "PRIV.CONSENT",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Recueil et gestion du consentement",
        "name_en": "Consent capture and management",
        "description": "Mettre en place un mécanisme de recueil, de traçabilité et de retrait du consentement, informer les personnes des choix offerts et des conséquences d'un refus, et n'utiliser ou ne divulguer les données pour une nouvelle finalité qu'après consentement approprié.",
        "description_en": "Implement a mechanism to capture, record and withdraw consent, inform data subjects of the available choices and the consequences of refusal, and use or disclose data for a new purpose only after obtaining appropriate consent.",
        "typical_evidence": [
            "Journal horodaté des consentements et des retraits",
            "Écrans ou formulaires de recueil du consentement avec mention des conséquences du refus"
        ],
        "typical_evidence_en": [
            "Time-stamped log of consents and withdrawals",
            "Consent capture screens or forms stating the consequences of refusal"
        ],
        "framework_refs": {
            "iso": [
                "A.5.34"
            ],
            "soc2": [
                "P2.1",
                "P3.2.1",
                "P3.2.2",
                "P6.1.4"
            ]
        }
    },
    {
        "id": "PRIV.DSR",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Exercice des droits des personnes concernées",
        "name_en": "Data subject rights fulfilment",
        "description": "Traiter les demandes d'accès, de rectification, de mise à jour, d'effacement et d'obtention d'un relevé des communications de données, dans un délai raisonnable et sous une forme compréhensible, après authentification du demandeur ; motiver et notifier par écrit tout refus ainsi que les voies de recours.",
        "description_en": "Handle requests for access, rectification, update, erasure and an accounting of data disclosures within a reasonable time and in an understandable form, after authenticating the requester; justify and notify in writing any denial together with the available means of appeal.",
        "typical_evidence": [
            "Procédure de traitement des demandes de droits avec délais cibles",
            "Registre des demandes reçues, réponses apportées et refus motivés"
        ],
        "typical_evidence_en": [
            "Documented data-subject-request procedure with target timelines",
            "Register of requests received, responses provided and reasoned denials"
        ],
        "framework_refs": {
            "iso": [
                "A.5.34"
            ],
            "soc2": [
                "P5.1.1",
                "P5.1.2",
                "P5.1.3",
                "P5.1.4",
                "P5.1.5",
                "P5.2.1",
                "P5.2.2",
                "P5.2.3",
                "P5.2.4",
                "P6.7.1",
                "P6.7.3"
            ]
        }
    },
    {
        "id": "PRIV.ROPA",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Registre des traitements et base légale",
        "name_en": "Records of processing and lawful basis",
        "description": "Tenir un registre des traitements précisant, pour chaque traitement, la finalité, la base légale, les catégories de données et de personnes, le rôle de l'organisation (responsable, sous-traitant ou co-responsable) et la justification documentée des mesures techniques et organisationnelles retenues, en veillant à ne collecter que des données pertinentes au regard des finalités.",
        "description_en": "Maintain records of processing stating, for each activity, the purpose, lawful basis, categories of data and of individuals, the organisation's role (controller, processor or joint controller) and the documented justification of the technical and organisational measures selected, ensuring only data relevant to the purposes is collected.",
        "typical_evidence": [
            "Registre des activités de traitement à jour",
            "Note justifiant les mesures retenues selon le rôle dans le traitement"
        ],
        "typical_evidence_en": [
            "Up-to-date records of processing activities",
            "Memo justifying the measures selected according to the processing role"
        ],
        "framework_refs": {
            "iso": [
                "A.5.34"
            ],
            "soc2": [
                "P3.1",
                "P4.1.1",
                "P7.1.1",
                "P7.1.2"
            ],
            "secnumcloud": [
                "18.1.b",
                "19.1.d"
            ]
        }
    },
    {
        "id": "PRIV.TRANSFERS",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Transferts internationaux de données",
        "name_en": "International data transfers",
        "description": "Cartographier les transferts de données vers des pays tiers, encadrer chaque transfert par des garanties appropriées en l'absence de décision d'adéquation, et rendre publiques et communiquer aux clients les informations sur l'existence, la destination et les garanties de ces transferts ainsi que la présentation formalisée des garanties.",
        "description_en": "Map data transfers to third countries, frame each transfer with appropriate safeguards where no adequacy decision exists, and make public and communicate to customers the information on the existence, destination and safeguards of those transfers as well as the formalised presentation of guarantees.",
        "typical_evidence": [
            "Cartographie publiée des transferts hors de l'espace de résidence",
            "Garanties encadrant les transferts (clauses, mécanismes) et information des clients"
        ],
        "typical_evidence_en": [
            "Published mapping of transfers outside the residency area",
            "Safeguards framing the transfers (clauses, mechanisms) and customer notice"
        ],
        "framework_refs": {
            "iso": [
                "A.5.34"
            ],
            "hds": [
                "EXI-01.e",
                "EXI-28",
                "EXI-29.a",
                "EXI-29.b",
                "EXI-29.c",
                "EXI-30",
                "EXI-31.a",
                "EXI-31.b",
                "EXI-31.c",
                "EXI-31.d",
                "EXI-31.e"
            ]
        }
    },
    {
        "id": "SOV.DATA_LOCATION",
        "category": "policy",
        "csf_function": "govern",
        "name": "Localisation et résidence des données",
        "name_en": "Data location and residency",
        "description": "Documenter et communiquer au client la localisation du stockage et du traitement de ses données, y compris les données techniques et les opérations d'administration et de supervision, et garantir le maintien de ces données dans la zone géographique exigée (Union européenne ou territoire national selon le cadre applicable).",
        "description_en": "Document and communicate to the customer the location where their data is stored and processed, including technical data and administration and supervision operations, and guarantee that such data remains within the required geographic area (European Union or national territory depending on the applicable framework).",
        "typical_evidence": [
            "Document de localisation des données remis au client",
            "Preuve d'hébergement et d'administration dans la zone géographique exigée"
        ],
        "typical_evidence_en": [
            "Data-location statement provided to the customer",
            "Evidence of hosting and administration within the required geographic area"
        ],
        "framework_refs": {
            "secnumcloud": [
                "19.2.a",
                "19.2.b",
                "19.2.c",
                "19.2.d",
                "19.2.e"
            ],
            "loi0520": [
                "ART-11"
            ]
        }
    },
    {
        "id": "SOV.EXTRA_EU_LAW",
        "category": "policy",
        "csf_function": "govern",
        "name": "Protection vis-à-vis des lois extra-européennes",
        "name_en": "Protection against extra-EU laws",
        "description": "Réduire l'exposition du service au droit extra-européen en s'appuyant sur une implantation, une administration et une détention capitalistique établies dans l'Union, en respectant les droits fondamentaux et les valeurs de l'Union, et en informant le client de tout risque d'accès par une autorité étrangère.",
        "description_en": "Reduce the service's exposure to extra-EU law by relying on an establishment, administration and capital ownership located in the Union, respecting fundamental rights and the values of the Union, and informing the customer of any risk of access by a foreign authority.",
        "typical_evidence": [
            "Analyse d'exposition aux législations extra-européennes",
            "Justification de l'implantation et de la structure de détention dans l'Union"
        ],
        "typical_evidence_en": [
            "Analysis of exposure to extra-EU legislation",
            "Justification of establishment and ownership structure within the Union"
        ],
        "framework_refs": {
            "secnumcloud": [
                "19.6.a",
                "19.6.e",
                "19.6.f"
            ]
        }
    },
    {
        "id": "SOV.LANG",
        "category": "process",
        "csf_function": "govern",
        "name": "Localisation linguistique des interfaces et du support",
        "name_en": "Language localisation of interfaces and support",
        "description": "Mettre à disposition du client les interfaces du service et la documentation contractuelle dans la langue exigée par le cadre applicable, et fournir un support de premier niveau dans cette même langue.",
        "description_en": "Provide the customer with the service interfaces and contractual documentation in the language required by the applicable framework, and deliver first-level support in that same language.",
        "typical_evidence": [
            "Captures des interfaces et documents dans la langue requise",
            "Organisation du support de premier niveau dans la langue exigée"
        ],
        "typical_evidence_en": [
            "Screenshots of interfaces and documents in the required language",
            "First-level support organisation in the required language"
        ],
        "framework_refs": {
            "secnumcloud": [
                "19.3.a",
                "19.3.b"
            ],
            "hds": [
                "EXI-08"
            ]
        }
    },
    {
        "id": "LEG.REG_WATCH",
        "category": "process",
        "csf_function": "identify",
        "name": "Veille réglementaire et identification des exigences légales",
        "name_en": "Regulatory watch and legal requirements identification",
        "description": "Identifier et tenir à jour les textes légaux, réglementaires et contractuels applicables au service, en connaître le champ d'application, les définitions et les sanctions encourues, suivre leur entrée en vigueur au moyen d'un processus de veille actif, et documenter les procédures permettant d'en respecter les exigences.",
        "description_en": "Identify and keep up to date the legal, regulatory and contractual texts applicable to the service, understand their scope, definitions and applicable penalties, track their entry into force through an active watch process, and document the procedures that ensure compliance with their requirements.",
        "typical_evidence": [
            "Registre des exigences légales et réglementaires applicables, daté",
            "Compte rendu de veille réglementaire et procédures de conformité associées"
        ],
        "typical_evidence_en": [
            "Dated register of applicable legal and regulatory requirements",
            "Regulatory-watch report and associated compliance procedures"
        ],
        "framework_refs": {
            "iso": [
                "A.5.31"
            ],
            "secnumcloud": [
                "18.1.a",
                "18.1.c",
                "18.1.e"
            ],
            "loi0520": [
                "ART-1",
                "ART-2",
                "ART-15",
                "ART-51",
                "ART-52",
                "ART-53"
            ]
        }
    },
    {
        "id": "GOV.IC_REPORTING",
        "category": "process",
        "csf_function": "govern",
        "name": "Reporting périodique du contrôle interne",
        "name_en": "Periodic internal-control reporting",
        "description": "Produire un reporting périodique du contrôle interne à destination de la direction et de l'organe de gouvernance, couvrant les objectifs de reporting financier, non financier et interne, en veillant à la conformité aux référentiels applicables, au niveau de précision requis et au choix d'un mode de communication adapté à l'audience et au moment.",
        "description_en": "Produce periodic internal-control reporting to management and the governance body, covering financial, non-financial and internal reporting objectives, ensuring conformity with applicable frameworks, the required level of precision and the choice of a communication method suited to the audience and timing.",
        "typical_evidence": [
            "Rapports périodiques de contrôle interne présentés à la gouvernance",
            "Note définissant les objectifs de reporting, le niveau de précision et les canaux"
        ],
        "typical_evidence_en": [
            "Periodic internal-control reports presented to governance",
            "Memo defining reporting objectives, level of precision and channels"
        ],
        "framework_refs": {
            "soc2": [
                "CC2.2.1",
                "CC2.2.2",
                "CC2.2.4",
                "CC3.1.5",
                "CC3.1.6",
                "CC3.1.7",
                "CC3.1.8",
                "CC3.1.9",
                "CC3.1.10",
                "CC3.1.11",
                "CC3.1.12",
                "CC3.1.13"
            ]
        }
    },
    {
        "id": "GOV.CONTROL_DEPLOY",
        "category": "process",
        "csf_function": "govern",
        "name": "Déploiement des activités de contrôle interne",
        "name_en": "Deployment of internal-control activities",
        "description": "Sélectionner et déployer un ensemble équilibré d'activités de contrôle aux différents niveaux de l'organisation, en tenant compte des processus métier concernés, des facteurs propres à l'entité et d'une combinaison appropriée de contrôles préventifs et détectifs, manuels et automatisés.",
        "description_en": "Select and deploy a balanced set of control activities across the various levels of the organisation, taking into account the relevant business processes, entity-specific factors and an appropriate mix of preventive and detective, manual and automated controls.",
        "typical_evidence": [
            "Matrice des activités de contrôle par processus et par niveau",
            "Justification de la couverture et de la nature des contrôles retenus"
        ],
        "typical_evidence_en": [
            "Matrix of control activities by process and by level",
            "Justification of the coverage and nature of the selected controls"
        ],
        "framework_refs": {
            "soc2": [
                "CC5.1.2",
                "CC5.1.3",
                "CC5.1.4",
                "CC5.1.5"
            ]
        }
    },
    {
        "id": "RISK.INSURANCE",
        "category": "process",
        "csf_function": "govern",
        "name": "Assurance et transfert financier du risque",
        "name_en": "Insurance and financial risk transfer",
        "description": "Évaluer et, le cas échéant, souscrire des couvertures d'assurance destinées à réduire l'impact financier des sinistres susceptibles d'affecter l'atteinte des objectifs, dans le cadre des activités de traitement du risque.",
        "description_en": "Assess and, where relevant, subscribe insurance coverage intended to reduce the financial impact of loss events that could affect the achievement of objectives, as part of risk-treatment activities.",
        "typical_evidence": [
            "Analyse d'opportunité de couverture assurantielle du risque",
            "Polices d'assurance en vigueur et périmètre couvert"
        ],
        "typical_evidence_en": [
            "Assessment of insurance coverage opportunities for risk",
            "Active insurance policies and covered scope"
        ],
        "framework_refs": {
            "soc2": [
                "CC9.1.1",
                "CC9.1.2"
            ]
        }
    },
    {
        "id": "SEC.METRICS",
        "category": "process",
        "csf_function": "govern",
        "name": "Indicateurs de sécurité et méthode de mesure",
        "name_en": "Security indicators and measurement method",
        "description": "Définir, mesurer et tenir à jour un jeu d'indicateurs de sécurité, en précisant pour chacun la méthode d'évaluation employée et, le cas échéant, la marge d'incertitude, en expliquant les évolutions significatives, et en communiquant périodiquement les résultats aux parties habilitées tout en protégeant leur confidentialité.",
        "description_en": "Define, measure and maintain a set of security indicators, specifying for each the evaluation method used and, where relevant, the measurement uncertainty, explaining significant variations, and periodically communicating the results to authorised parties while protecting their confidentiality.",
        "typical_evidence": [
            "Tableau de bord d'indicateurs avec fiche méthodologique par indicateur",
            "Communication périodique des indicateurs aux parties habilitées"
        ],
        "typical_evidence_en": [
            "Indicator dashboard with a methodology sheet per indicator",
            "Periodic communication of indicators to authorised parties"
        ],
        "framework_refs": {
            "iso": [
                "9.1"
            ],
            "lpm": [
                "20.1",
                "20.13",
                "20.14",
                "20.15"
            ]
        }
    },
    {
        "id": "GOV.AUTHORITY_COOP",
        "category": "process",
        "csf_function": "govern",
        "name": "Coopération avec les autorités et instances de gouvernance",
        "name_en": "Cooperation with authorities and governance bodies",
        "description": "Coopérer avec les autorités de contrôle et de supervision compétentes en facilitant leurs demandes d'information, enquêtes et inspections sur site, en accueillant les équipes d'examen, en prenant en charge les coûts d'audit réglementaire à la charge de l'organisation, et en contribuant aux instances de gouvernance et de coordination de la cybersécurité.",
        "description_en": "Cooperate with the competent supervisory and oversight authorities by facilitating their information requests, investigations and on-site inspections, hosting review teams, bearing the regulatory audit costs assigned to the organisation, and contributing to cybersecurity governance and coordination bodies.",
        "typical_evidence": [
            "Procédure de coopération avec les autorités et points de contact désignés",
            "Comptes rendus d'inspections, d'enquêtes ou de participation aux instances"
        ],
        "typical_evidence_en": [
            "Procedure for cooperation with authorities and designated points of contact",
            "Records of inspections, investigations or participation in governance bodies"
        ],
        "framework_refs": {
            "dora": [
                "DORA-35",
                "DORA-36",
                "DORA-37",
                "DORA-38",
                "DORA-39",
                "DORA-40"
            ],
            "loi0520": [
                "ART-23",
                "ART-35"
            ]
        }
    },
    {
        "id": "PROD.CONFORMITY",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Évaluation de conformité et déclaration UE du produit",
        "name_en": "Product conformity assessment and EU declaration",
        "description": "Réaliser la procédure d'évaluation de conformité applicable au produit, établir et signer la déclaration UE de conformité (identification du produit, nom et adresse du fabricant ou de son mandataire, référentiels appliqués, responsabilité du fabricant) et apposer le marquage attestant la conformité aux exigences essentielles.",
        "description_en": "Carry out the applicable product conformity-assessment procedure, draw up and sign the EU declaration of conformity (product identification, name and address of the manufacturer or its authorised representative, standards applied, manufacturer's responsibility) and affix the marking attesting conformity with the essential requirements.",
        "typical_evidence": [
            "Déclaration UE de conformité signée et datée",
            "Preuve d'apposition du marquage et procédure d'évaluation retenue"
        ],
        "typical_evidence_en": [
            "Signed and dated EU declaration of conformity",
            "Evidence of marking affixed and the chosen assessment procedure"
        ],
        "framework_refs": {
            "cra": [
                "5.1",
                "5.2",
                "5.3",
                "5.4",
                "5.5",
                "5.6",
                "5.7",
                "5.8",
                "7.7",
                "8.1.4.1",
                "8.1.4.2",
                "8.3.3.1",
                "8.3.3.2"
            ]
        }
    },
    {
        "id": "PROD.TECHDOC",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Dossier technique du produit",
        "name_en": "Product technical documentation",
        "description": "Constituer et tenir à jour le dossier technique du produit comprenant sa description générale et sa finalité, les versions affectant la conformité, les informations et instructions destinées à l'utilisateur, la description de la conception et du développement, l'évaluation des risques de cybersécurité, la période de support, les normes appliquées et les rapports d'essais.",
        "description_en": "Compile and maintain the product's technical documentation including its general description and intended purpose, the versions affecting compliance, the user information and instructions, the design and development description, the cybersecurity risk assessment, the support period, the standards applied and the test reports.",
        "typical_evidence": [
            "Dossier technique complet et versionné",
            "Informations et instructions utilisateur intégrées au dossier"
        ],
        "typical_evidence_en": [
            "Complete and versioned technical documentation file",
            "User information and instructions included in the file"
        ],
        "framework_refs": {
            "cra": [
                "7.1",
                "7.1.a",
                "7.1.b",
                "7.1.c",
                "7.1.d",
                "7.2",
                "7.3",
                "7.4",
                "7.5",
                "7.6",
                "7.8",
                "7.a",
                "8.1.2"
            ]
        }
    },
    {
        "id": "PROD.NOTIFIED_BODY",
        "category": "procedure",
        "csf_function": "govern",
        "name": "Recours à un organisme notifié",
        "name_en": "Engagement of a notified body",
        "description": "Déposer auprès d'un unique organisme notifié la demande d'évaluation (examen de type ou système qualité complet) comprenant l'identité du fabricant ou de son mandataire, le dossier technique et une déclaration écrite attestant qu'aucune demande identique n'a été déposée auprès d'un autre organisme, puis recueillir et conserver la notification de la décision motivée de l'organisme.",
        "description_en": "Lodge with a single notified body the assessment application (EU-type examination or full quality system) comprising the identity of the manufacturer or its authorised representative, the technical documentation and a written declaration that no identical application has been lodged with another body, then obtain and retain the notification of the body's reasoned decision.",
        "typical_evidence": [
            "Dossier de demande déposé auprès de l'organisme notifié avec déclaration d'unicité",
            "Notification de la décision motivée de l'organisme notifié conservée"
        ],
        "typical_evidence_en": [
            "Application file lodged with the notified body including the single-application declaration",
            "Retained notification of the notified body's reasoned decision"
        ],
        "framework_refs": {
            "cra": [
                "8.2.3",
                "8.2.3.2",
                "8.2.3.3",
                "8.2.3.4",
                "8.2.6",
                "8.2.8",
                "8.4.3.1",
                "8.4.3.1.1",
                "8.4.3.1.2",
                "8.4.3.1.3",
                "8.4.3.1.4",
                "8.4.3.3",
                "8.4.3.d",
                "8.4.3.g",
                "8.4.4.3"
            ]
        }
    },
    {
        "id": "MAIL.AUTHENTICATION",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Authentification des courriels (SPF, DKIM, DMARC) et chiffrement des flux de messagerie",
        "name_en": "Email authentication (SPF, DKIM, DMARC) and encryption of mail flows",
        "description": "Publier et tenir à jour les enregistrements DNS d'authentification du domaine de messagerie (SPF, DKIM, DMARC, y compris une politique DMARC en rejet ou quarantaine) afin de contrer l'usurpation d'adresse et l'hameçonnage, et imposer le chiffrement TLS des échanges entre serveurs de messagerie ainsi qu'entre les postes et les boîtes aux lettres (protocoles SMTPS, IMAPS, POP3S).",
        "description_en": "Publish and maintain the DNS authentication records for the mail domain (SPF, DKIM, DMARC, including a DMARC policy set to reject or quarantine) to counter address spoofing and phishing, and enforce TLS encryption of exchanges between mail servers and between endpoints and mailboxes (SMTPS, IMAPS, POP3S protocols).",
        "typical_evidence": [
            "Extraction des enregistrements DNS SPF, DKIM et DMARC du domaine avec politique DMARC appliquée",
            "Rapports d'agrégation DMARC (RUA) analysés périodiquement",
            "Configuration TLS des serveurs de messagerie et vérification de son application"
        ],
        "typical_evidence_en": [
            "Export of the domain's SPF, DKIM and DMARC DNS records with enforced DMARC policy",
            "DMARC aggregate (RUA) reports reviewed periodically",
            "Mail servers' TLS configuration and evidence of its enforcement"
        ],
        "framework_refs": {
            "iso": [
                "A.5.14"
            ],
            "anssi": [
                "21",
                "24.R"
            ]
        }
    },
    {
        "id": "MAIL.GATEWAY",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Passerelle de messagerie sécurisée (anti-pourriel, anti-hameçonnage, analyse antivirale)",
        "name_en": "Secure mail gateway (anti-spam, anti-phishing, antivirus scanning)",
        "description": "Mettre en place, en amont des boîtes aux lettres, une passerelle de filtrage des courriels entrants et sortants assurant l'analyse antivirale des messages et des pièces jointes, le blocage du pourriel et des tentatives d'hameçonnage, ainsi que la neutralisation des liens et contenus malveillants, avec un relais de messagerie dédié n'exposant pas directement les serveurs de boîtes aux lettres sur Internet.",
        "description_en": "Deploy, upstream of the mailboxes, a gateway filtering inbound and outbound email that scans messages and attachments for malware, blocks spam and phishing attempts, and neutralises malicious links and content, with a dedicated mail relay that does not expose mailbox servers directly to the Internet.",
        "typical_evidence": [
            "Configuration de la passerelle de messagerie (règles anti-pourriel, anti-hameçonnage, moteurs antivirus)",
            "Journaux de messages bloqués ou mis en quarantaine",
            "Schéma montrant le relais de messagerie en coupure d'Internet"
        ],
        "typical_evidence_en": [
            "Mail gateway configuration (anti-spam, anti-phishing and antivirus engine rules)",
            "Logs of blocked or quarantined messages",
            "Diagram showing the mail relay isolating the mailbox servers from the Internet"
        ],
        "framework_refs": {
            "iso": [
                "A.8.7",
                "A.8.20"
            ],
            "anssi": [
                "24",
                "24.R"
            ],
            "recyf": [
                "9.6",
                "9.7"
            ]
        }
    },
    {
        "id": "NAC.ADMISSION",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Contrôle d'accès au réseau et admission des seuls équipements maîtrisés (802.1X)",
        "name_en": "Network access control and admission of managed equipment only (802.1X)",
        "description": "Restreindre la connexion aux réseaux filaires et sans fil de l'entité aux seuls équipements maîtrisés, en authentifiant les postes au raccordement (standard 802.1X ou équivalent), en isolant les terminaux personnels et visiteurs sur un réseau dédié, et en désactivant ou restreignant les prises réseau des zones accessibles au public.",
        "description_en": "Restrict connection to the entity's wired and wireless networks to managed equipment only, by authenticating endpoints at connection time (802.1X standard or equivalent), isolating personal and visitor devices on a dedicated network, and disabling or restricting network sockets in publicly accessible areas.",
        "typical_evidence": [
            "Configuration 802.1X des commutateurs et bornes Wi-Fi",
            "Politique de séparation des réseaux (SSID dédié invités, VLAN de mise en quarantaine)",
            "Inventaire des prises réseau désactivées ou restreintes en zones publiques"
        ],
        "typical_evidence_en": [
            "802.1X configuration of switches and Wi-Fi access points",
            "Network separation policy (dedicated guest SSID, quarantine VLAN)",
            "Inventory of disabled or restricted network sockets in public areas"
        ],
        "framework_refs": {
            "iso": [
                "A.8.20",
                "A.8.22"
            ],
            "anssi": [
                "7",
                "7.R",
                "20",
                "26"
            ]
        }
    },
    {
        "id": "ADMENV.DEDICATED",
        "category": "procedure",
        "csf_function": "protect",
        "name": "Environnement d'administration dédié et cloisonné (postes, réseau, bastion)",
        "name_en": "Dedicated and segregated administration environment (workstations, network, bastion)",
        "description": "Réaliser les opérations d'administration depuis des postes et un réseau dédiés exclusivement à cet usage, cloisonnés du système bureautique, sans accès direct à Internet ni à la messagerie, en canalisant les accès privilégiés au travers d'un point de passage maîtrisé (bastion ou poste de rebond) et en protégeant les flux d'administration.",
        "description_en": "Perform administration tasks from workstations and a network dedicated exclusively to that purpose, segregated from the office environment, with no direct access to the Internet or email, channelling privileged access through a controlled jump point (bastion or jump host) and protecting administration flows.",
        "typical_evidence": [
            "Description technique du réseau d'administration cloisonné et des postes d'administration dédiés",
            "Configuration du bastion / poste de rebond et journalisation des sessions d'administration",
            "Règles de filtrage interdisant l'accès Internet et messagerie depuis l'environnement d'administration"
        ],
        "typical_evidence_en": [
            "Technical description of the segregated administration network and dedicated administration workstations",
            "Bastion / jump host configuration and logging of administration sessions",
            "Filtering rules denying Internet and email access from the administration environment"
        ],
        "framework_refs": {
            "iso": [
                "A.8.2",
                "A.8.22"
            ],
            "anssi": [
                "27",
                "27.R",
                "28",
                "28.R"
            ],
            "lpm": [
                "15.1",
                "15.2",
                "15.3",
                "15.4",
                "15.6"
            ],
            "recyf": [
                "11.B.3",
                "11.B.4"
            ],
            "secnumcloud": [
                "12.12.a",
                "13.2.c"
            ]
        }
    },
    {
        "id": "PENTEST.INTRUSION",
        "category": "process",
        "csf_function": "identify",
        "name": "Tests d'intrusion et de résilience (pentest, red team, TLPT)",
        "name_en": "Intrusion and resilience testing (pentest, red team, TLPT)",
        "description": "Planifier et conduire régulièrement des tests offensifs sur les systèmes en exploitation (tests d'intrusion, exercices d'équipe rouge, et pour les entités concernées tests avancés fondés sur la menace TLPT), réalisés par des testeurs qualifiés et distincts des tests menés en phase de développement, puis suivre la remédiation des vulnérabilités identifiées.",
        "description_en": "Plan and regularly conduct offensive testing against systems in operation (penetration tests, red team exercises, and for the entities concerned advanced threat-led penetration testing, TLPT), performed by qualified testers and distinct from testing carried out during development, then track remediation of the vulnerabilities found.",
        "typical_evidence": [
            "Programme annuel de tests d'intrusion et rapports associés",
            "Rapport de test TLPT ou d'exercice red team avec périmètre et scénarios de menace",
            "Plan d'actions correctives et suivi de la remédiation des vulnérabilités"
        ],
        "typical_evidence_en": [
            "Annual penetration testing programme and associated reports",
            "TLPT or red team exercise report with scope and threat scenarios",
            "Corrective action plan and tracking of vulnerability remediation"
        ],
        "framework_refs": {
            "iso": [
                "A.8.29"
            ],
            "anssi": [
                "38.R"
            ],
            "dora": [
                "DORA-24",
                "DORA-25",
                "DORA-26",
                "DORA-27"
            ],
            "recyf": [
                "17.3"
            ]
        }
    },
    {
        "id": "CARTO.SYSTEM",
        "category": "procedure",
        "csf_function": "identify",
        "name": "Cartographie du système d'information et schéma d'architecture réseau",
        "name_en": "Information system mapping and network architecture diagram",
        "description": "Élaborer et tenir à jour une cartographie du système d'information comprenant un schéma d'architecture réseau (zones et plages IP, équipements de routage et de filtrage, points d'interconnexion avec l'extérieur et les tiers, services exposés, réseaux d'administration) ainsi que la localisation des serveurs et données sensibles, et la réviser périodiquement.",
        "description_en": "Build and maintain an information system map including a network architecture diagram (zones and IP ranges, routing and filtering equipment, interconnection points with the outside and third parties, exposed services, administration networks) as well as the location of sensitive servers and data, and review it periodically.",
        "typical_evidence": [
            "Schéma d'architecture réseau daté avec zones, plages IP et interconnexions",
            "Cartographie du SI liée à l'inventaire des actifs et localisant les données sensibles",
            "Trace de la révision périodique de la cartographie"
        ],
        "typical_evidence_en": [
            "Dated network architecture diagram with zones, IP ranges and interconnections",
            "IS map linked to the asset inventory and locating sensitive data",
            "Record of the periodic review of the mapping"
        ],
        "framework_refs": {
            "iso": [
                "A.5.9"
            ],
            "anssi": [
                "4"
            ],
            "lpm": [
                "3.1",
                "3.2",
                "3.3",
                "3.4",
                "3.5",
                "3.6",
                "3.8"
            ],
            "secnumcloud": [
                "13.1.a",
                "13.1.b"
            ],
            "recyf": [
                "5.A.1"
            ],
            "dora": [
                "DORA-8"
            ]
        }
    }
];
