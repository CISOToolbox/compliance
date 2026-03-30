# Compliance Tracking -- Multi-Framework Assessment Web Application

A 100% client-side web application for assessing and tracking compliance against multiple security frameworks simultaneously.

> This tool is part of the **[CISO Toolbox](https://www.cisotoolbox.org)** suite -- a collection of open-source, browser-based security tools designed for CISOs, risk analysts, and compliance officers. All tools share the same design principles: no backend, no account required, data stays in your browser.
>
> Other tools in the suite: [EBIOS RM Risk Analysis](https://ebiosrm.cisotoolbox.org)

---

# Suivi de Conformité — Application d'évaluation multi-référentiels

Application web interactive pour évaluer et suivre la conformité à plusieurs référentiels de sécurité simultanément.

> Cet outil fait partie de la suite **[CISO Toolbox](https://www.cisotoolbox.org)** -- une collection d'outils open-source de sécurité utilisables directement dans le navigateur, conçus pour les RSSI, analystes de risques et responsables conformité. Tous les outils partagent les mêmes principes : pas de serveur, pas de compte utilisateur, les données restent dans votre navigateur.
>
> Autres outils de la suite : [EBIOS RM Analyse de risques](https://ebiosrm.cisotoolbox.org)

---

## Pourquoi un outil de conformité 100% local ?

Les outils de GRC du marché sont souvent complexes à déployer, nécessitent un hébergement et peuvent poser des problèmes de confidentialité pour les données d'audit. Cette application répond à deux principes :

**1) Aucune donnée ne quitte le navigateur**

- Pas de serveur applicatif, pas de base de données, pas de compte utilisateur
- Tout le traitement se fait côté client, en JavaScript
- Les données restent sur le poste de l'évaluateur
- L'application fonctionne hors-ligne une fois chargée
- Le chiffrement/déchiffrement des sauvegardes (AES-256-GCM) est réalisé localement

**2) Aucune dépendance à l'outil**

- Format de données JSON ouvert et documenté
- Compatible avec l'application EBIOS RM pour l'import/export des données de conformité
- Outil et format de données ouverts

## Référentiels supportés

L'application couvre 11 référentiels de sécurité, tous évaluables simultanément :

| Référentiel | Exigences | Domaine |
|---|---|---|
| **ANSSI** — Guide d'hygiène | 42 | Socle de sécurité (France) |
| **ISO 27001** — Clauses 4-10 + Annexe A | 120 | Management de la sécurité de l'information (27 exigences SMSI + 93 mesures Annexe A) |
| **SOC 2** — Trust Services Criteria | 37 | Audit de confiance (AICPA) |
| **DORA** | 12 | Résilience numérique du secteur financier (UE) |
| **NIS 2** | 11 | Cybersécurité des entités essentielles (UE) |
| **LPM** | 24 | Sécurité des OIV (France) |
| **SecNumCloud** | 17 | Qualification cloud ANSSI |
| **HDS** | 11 | Hébergement de données de santé (France) |
| **GAMP 5** | 10 | Systèmes validés (industrie pharmaceutique) |
| **Loi 05-20** | 10 | Cybersécurité (Maroc) |
| **Cyber Resilience Act** | 13 | Produits numériques (UE) |

## Fonctionnalités

**Par référentiel :**
- **Dashboard** — conformité globale, actions en cours, preuves expirant sous 90 jours
- **Exigences** — évaluation de chaque exigence avec slider de conformité, applicabilité, commentaires
- **Mesures** — gestion des mesures de sécurité liées aux exigences, avec statut, responsable, échéance
- **Preuves** — gestion des preuves de conformité avec dates d'obtention et d'expiration

**Suivi global :**
- **Tableau de bord** — vue consolidée de tous les référentiels actifs
- **Plan d'action** — toutes les mesures avec édition, recherche, tri par colonnes
- **Contrôles** — suivi des récurrences et alertes sur les preuves expirant

**Mesures types :**
- 71 mesures types pré-définies couvrant 100% des exigences de chaque référentiel
- Bouton **Proposer** sur chaque exigence pour instancier des mesures types adaptées
- Liaison automatique aux exigences correspondantes dans tous les référentiels actifs

**Interopérabilité EBIOS RM :**
- Import des données depuis un fichier JSON EBIOS RM (contexte, conformité, mesures)
- Format de données compatible pour l'échange entre les deux outils

## Import / Export

| Format | Import | Export | Usage |
|---|---|---|---|
| **JSON** | Ouvrir | Enregistrer / Enregistrer sous | Format natif, sauvegarde complète |
| **JSON chiffré** | Ouvrir (mot de passe) | Enregistrer sous (mot de passe) | Sauvegarde sécurisée (AES-256-GCM) |
| **EBIOS RM** | Import EBIOS RM | — | Récupérer conformité et mesures depuis une analyse de risques |

## Déploiement

L'application est un ensemble de fichiers statiques. Aucun serveur applicatif n'est nécessaire.

```
Compliance.html            Page principale
css/Compliance.css         Feuille de styles
js/cisotoolbox.js          Bibliothèque commune (partagée avec EBIOS RM)
js/Compliance_app.js       Logique applicative
js/Compliance_data.js      Données initiales (évaluation vide)
js/Compliance_*.js         Assets chargés à la demande (référentiels, descriptions, mesures types)
```

Options de déploiement :
- **Serveur web** (Apache, Nginx, hébergement statique) — déposer les fichiers
- **Poste local** — ouvrir `Compliance.html` dans un navigateur
- **Intranet** — fonctionne entièrement hors-ligne

## Licence

MIT
