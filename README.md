# GreenPass TN

**Anyone can claim a sustainability number. GreenPass proves it wasn't changed after the fact.**

AI-assisted, Hedera-anchored sustainability passports for Tunisian SMEs — built as a hackathon POC for the Hedera Cross Campus Challenge 2026 (EMI Campus Edition, AI × Web3 Agents track).

Team: **GreenPass TN** · Team Lead: **KADRI Wadie**

## The problem

SMEs increasingly receive sustainability-data requests from customers, buyers, supply-chain partners and finance. The EU's voluntary SME reporting standard (VSME) is designed to make these requests more proportionate, and CBAM applies to specific goods from 1 January 2026 with core obligations on EU importers — so structured sustainability data is becoming part of normal business conversations for Tunisian exporters, not just a compliance afterthought.

But today that data lives in PDFs, spreadsheets and electricity/fuel invoices. Those documents can contain useful numbers, but they don't by themselves prove **provenance** or show whether the evidence was changed after it was produced. Meanwhile:

- Data is scattered across bills, invoices and spreadsheets.
- Manual extraction and carbon calculations consume time and introduce errors.
- Most SMEs have limited time, expertise or dedicated staff for sustainability reporting.
- The same information gets requested repeatedly by different customers, buyers and partners.

**Why this matters at scale:** ~90% of businesses globally are SMEs (World Bank), Tunisia recorded 836,808 private enterprises in 2024 (INS), and SMEs (6–99 employees) represented 19.8% of Tunisian enterprises and 32.4% of employment in the World Bank's 2019 reference data.

## What GreenPass does

GreenPass turns fragmented SME sustainability data into a structured, shareable, tamper-evident business record:

- **AI extraction** — reads raw activity data (electricity, fuel, dates, supplier info) out of uploaded bills, invoices and spreadsheets.
- **Transparent carbon calculation** — applies documented emission factors to produce a Scope 1 & 2 estimate (MVP scope).
- **SHA-256 fingerprint** — the evidence-backed record is hashed; any later change produces a different fingerprint.
- **Hedera Consensus Service (HCS)** — the fingerprint and GreenPass metadata are anchored to a public topic, creating a timestamped, tamper-evident audit trail.
- **QR-enabled passport** — a shareable GreenPass that any customer, buyer, partner or auditor can scan to check record integrity, without exposing the underlying invoices.

Token holders don't just get a PDF — they get a sustainability claim they can independently re-verify against the ledger.

## How it works — end to end

```
1. UPLOAD    →  Bills, invoices, CSV / spreadsheets
2. EXTRACT   →  AI reads activity data
3. CALCULATE →  Scope 1 & 2 carbon estimate
4. ANCHOR    →  SHA-256 fingerprint + Hedera HCS
5. SHARE     →  QR-enabled GreenPass
6. VERIFY    →  Recompute hash → compare to the anchored hash
```

*AI makes sustainability data usable. Hedera anchors its provenance. GreenPass makes it shareable.*

## The AI × Web3 agents

Three cooperating agents, each with a single responsibility:

| Agent | Role |
|---|---|
| **Document Agent** | Extracts electricity consumption, fuel quantities, dates and supplier information from uploaded documents. |
| **Carbon Engine** | Applies transparent emission factors to produce an evidence-based Scope 1 & 2 estimate. |
| **Trust Agent** | Checks completeness → generates the record hash → submits the record to Hedera HCS → stores the consensus reference → generates the verification data used by the QR flow. |

## Where Hedera fits

Hedera provides evidence **integrity and provenance** — not the truth of the underlying business data itself.

| Layer | What happens |
|---|---|
| **Off-chain — business data** | Invoices, PDFs and detailed company data stay in the application database. Sensitive documents are never placed directly on-chain. |
| **Hash — digital fingerprint** | GreenPass computes a SHA-256 fingerprint of the evidence-backed record. Any change to the underlying numbers produces a different fingerprint. |
| **Hedera HCS — proof** | The fingerprint and GreenPass metadata are submitted to a Hedera Consensus Service topic, creating a timestamped, tamper-evident audit trail anyone can independently check. |

## POC scope

Demo record (sample data for the hackathon demo — not a real client):

```
Company:            Tunisian SME_x
Reporting period:   September 2026
Electricity:        1,850 kWh
Diesel:             420 L
Estimated footprint: 1.96 tCO2e (using the illustrative POC factors below)
Evidence:           2 source documents
Calculation:        v1.0
Hedera anchored:    ✓
```

**The core demo moment:** the dashboard shows a verified GreenPass with a matching hash. A "Tamper with the record" action flips a source value (1,850 kWh → 2,850 kWh) and recomputes the hash live — the dashboard flips from ✓ *Integrity matches* to ❌ *Hash mismatch*, proving the check runs against the real Hedera-anchored hash, not just UI state.

```
Original:   Energy data → carbon calculation → SHA-256 hash → A83F…91CD  → ✓ Integrity matches
Tampered:   1,850 kWh → 2,850 kWh → new SHA-256 hash → 91BD…72AA          → ❌ Hash mismatch
```

Emission factors and document parsing are simplified for the POC — no production-grade OCR/LLM pipeline or live utility-provider integration is wired up yet.

## Architecture

```
Frontend (public/index.html, public/verify.html)
        │
        ▼
Node.js / Express backend (server.js)
        │
        ├──► Document Agent  ──► parses uploaded bills/invoices/CSV into structured activity data
        │
        ├──► Carbon Engine   ──► applies emissionFactors.json → Scope 1 & 2 tCO2e estimate
        │
        ├──► Trust Agent     ──► builds canonical record → SHA-256 hash ──► Hedera JS SDK ──► HCS topic
        │                                                                │
        │                                                                └──► stores consensus timestamp + sequence number
        │
        └──► Mirror Node (read-only, public REST) ──► fetches anchored message for the verify/QR flow
```

Reads (balance/history/verification lookups) go through the Mirror Node's REST API to avoid gRPC/firewall issues on restrictive networks. Submitting a new HCS message requires the Hedera SDK directly, since only the SDK can sign and submit transactions. `hfsService.js` and `htsService.js` exist as ready-to-use wrappers for the V4+ roadmap items but aren't called anywhere in the MVP pipeline yet.

## Project structure

```
greenpass-tn/
├── .env.example                # copy to .env and fill in your credentials — never commit .env
├── .gitignore
├── package.json
├── index.js                    # connection test: operator credentials + Mirror Node balance check
├── create-topic.js             # one-time: creates the GreenPass HCS topic
├── submit-record.js            # CLI: run the full pipeline against a sample document set
├── verify-record.js            # CLI: recompute a record's hash and compare vs the Hedera-anchored hash
├── emissionFactors.json        # documented, editable Scope 1 & 2 emission factors
├── app.js                      # Express app assembly (middleware + routes)
├── server.js                   # loads env vars, starts the HTTP server
├── src/
│   ├── config/
│   │   └── client.js           # Hedera client singleton (parses DER/ECDSA/ED25519 keys)
│   ├── routes/
│   │   └── api.js              # POST /api/records, GET /api/records, GET/POST .../verify, .../tamper
│   ├── services/
│   │   ├── dbService.js        # off-chain JSON-file store (POC-grade; swap for a real DB later)
│   │   ├── hashService.js      # canonical stringify + SHA-256
│   │   ├── hcsService.js       # create topic + submit record hashes
│   │   ├── hfsService.js       # optional — document storage (not in MVP path)
│   │   ├── htsService.js       # optional — tokenized credentials (roadmap V4)
│   │   └── mirrorService.js    # Mirror Node REST reads (balances, topic messages)
│   └── agents/
│       ├── documentAgent.js    # extracts activity data from uploaded documents
│       ├── carbonEngine.js     # Scope 1 & 2 calculation using emissionFactors.json
│       └── trustAgent.js       # hashes the record, submits to HCS, verifies against the Mirror Node
└── public/
    ├── index.html               # upload + dashboard UI
    └── verify.html               # QR-scanned verification page
```

## Setup

Requires **Node.js v20+**.

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```env
HEDERA_NETWORK=testnet
DEMO_MODE=true  # local demonstration; no Hedera credentials required
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=your_private_key   # DER or raw ECDSA/ED25519 hex, both work
HEDERA_TOPIC_ID=0.0.xxxxx             # filled in after running create-topic.js
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
PORT=3000
```

Get the account ID and private key from a free [Hedera Testnet account](https://portal.hedera.com/) — it comes pre-funded with test HBAR.

## Running the POC

### Quick local demo (no Hedera account required)

1. Copy `.env.example` to `.env` and leave `DEMO_MODE=true`.
2. Run `npm install` and then `npm start`.
3. Open `http://localhost:3000` and upload the sample text files in `sample-documents/`.
4. Click **Verify integrity**, then **Tamper with record (demo)**, then verify again.

In local demo mode, the anchor is simulated locally and is **not** a Hedera transaction. This mode demonstrates extraction, calculation, hashing, QR flow, and tamper detection only.

### Connect to Hedera testnet

Set `DEMO_MODE=false`, enter your testnet account ID and private key in `.env`, and then continue with the one-time setup below.

One-time setup (run once, save the printed topic ID into `.env`):

```bash
npm run test-connection   # node index.js — confirms testnet connection + balance
npm run create-topic      # node create-topic.js — creates the GreenPass HCS topic
```

Run the pipeline against the sample documents and anchor a record (useful for a quick sanity check without the UI):

```bash
npm run submit-record
npm run verify-record -- <recordId>   # recordId is printed by the command above
```

Start the dashboard:

```bash
npm start
```

Open `http://localhost:3000`. Upload one or more `.txt` documents (the demo parser reads lines like `Supplier: STEG. Consumption: 1850 kWh.`) to watch Document Agent → Carbon Engine → Trust Agent run end to end, producing a GreenPass record with a QR code. Click **Verify integrity** to recompute the hash live, or **Tamper with record (demo)** first to see the check genuinely fail — that button edits the stored value directly, the way an attacker touching the database would, without updating the anchored hash. Scanning the QR code (or opening `/verify/<recordId>` directly) runs the same check on the public verification page.

## Hedera services used

| Service | Role | Status |
|---|---|---|
| HCS | Anchors the SHA-256 fingerprint + GreenPass metadata as a timestamped, tamper-evident record | ✅ Core |
| Mirror Node | Reads back anchored messages for the verify/QR flow | ✅ Core |
| HTS | Hedera-native credentials / tokenized certificates | ⏳ Roadmap (V4) |
| HFS | Storing source documents / inspection-grade evidence files | ⏳ Optional / not in POC |
| HSCS | Automated actions on verification failure (e.g. flag/notify) | ⏳ Optional / not in POC |

## Why this matters

Generic sustainability reporting stops at:

```
Raw documents → Manual entry → Spreadsheet / PDF report
```

GreenPass extends it to:

```
Raw documents → AI extraction → Carbon estimate → SHA-256 fingerprint → Hedera-anchored proof → Shareable, verifiable GreenPass
```

A report can look complete while being fully opaque about whether it was edited after the fact. GreenPass closes that gap without asking the SME to change how they already collect their data.

## Competitive landscape

GreenPass sits at the intersection of carbon measurement, SME usability and verifiable evidence — most competitors are strong on only one or two of those axes.

**Tunisia**

| Solution | Carbon / ESG | SME focus | AI / automation | Evidence / DLT |
|---|---|---|---|---|
| RMA Carbone (Kabaun) | ✓ Scope 1–3 | ✓ | ✓ OCR + AI | Audit trail; no DLT |
| CarbonScope | ✓ Carbon + ESG | ✓ | ✓ ML/anomaly detection | Security; no DLT |
| DecarboTech | ✓ ESG + carbon | ✓ | ✓ AI action plans | Reporting/audit only |
| Green Genius | ✓ Scope 1–3 | ✓ | Automation | Traceability; no DLT |
| AFRICARBON | ✓ Carbon + ESG | — | Platform automation | Market/certificate focus |

**Global**

| Solution | Core offer | Segment | AI | Verification / blockchain |
|---|---|---|---|---|
| Greenly | Carbon + ESG | SME | ✓ | Audit/reporting |
| Normative | Carbon + Scope 3 | Mid/enterprise | ✓ | Audit-ready data |
| Sweep | Carbon + ESG + supply chain | Mid/enterprise | ✓ | Data lineage |
| Watershed | Enterprise carbon platform | Enterprise | ✓ | Audit-ready workflows |
| Persefoni | Carbon accounting | Mid/enterprise | ✓ AI | Audit-grade data |
| ImpactScope GWI | Greenwashing detection | Enterprise/regulators | ✓ AI | ✓ AI + blockchain |
| Spiro Carbon | Sustainability verification / MRV | Project/enterprise | ✓ AI | ✓ Blockchain |

**Positioning:** most carbon platforms compete on measurement depth (Scope 1–3 accounting, dashboards, enterprise integrations). GreenPass isn't trying to out-measure them — it's an evidence-first workflow (AI extraction → transparent estimate → SHA-256 fingerprint → Hedera timestamp → QR-enabled passport) that can coexist with the accounting/ERP tools an SME already uses, rather than replacing them.

*Competitive features are based on publicly described offerings reviewed in September 2026; this is a feature map, not a ranking, and does not imply superiority.*

## Business model

| Tier | Price | Includes |
|---|---|---|
| **Free** | €0 | 3 documents/month, basic carbon estimate, basic dashboard, verification demo |
| **Pro** | €15–30/month | More documents, GreenPass history, QR verification, monthly reports |
| **Business** | Custom | Multiple users, supplier records, custom reports, API/branded GreenPass |
| **B2B2B** | Sponsored | A large buyer sponsors the platform for its SME suppliers; optional per-record verification fees and network subscriptions |

*Pricing is an early business concept, not validated pricing.*

## Who benefits

- **SMEs** — less manual work, faster sustainability-data prep, reusable evidence-backed records, lower reporting friction.
- **Exporters & suppliers** — a standardized passport to share with customers and supply-chain partners, faster responses to recurring data requests, and readiness for EU-linked sustainability information needs.
- **Customers, buyers & partners** — a QR code that gives a simple path to check record integrity and access the information an SME chooses to share.

## Roadmap

1. **MVP** — Documents → Scope 1/2 → HCS → QR verification → shareable SME passport
2. **V2** — More document types, richer Scope 3 evidence, VSME-aligned reporting support
3. **V3** — Supplier-to-buyer sustainability network and recurring data requests
4. **V4** — Hedera-native credentials / tokenized certificates where justified
5. **V5** — IoT data, anomaly detection and predictive emissions

## The 30-second pitch

> "GreenPass TN helps Tunisian SMEs turn fragmented energy documents into structured, shareable sustainability evidence. AI extracts and calculates the data; Hedera anchors a tamper-evident record of the evidence-backed result. Instead of sending another spreadsheet or PDF, an SME can share a reusable GreenPass with customers, buyers and partners."

**AI makes sustainability data usable. Hedera makes its provenance auditable. GreenPass makes it shareable.**

---

GreenPass TN • Hedera Cross Campus Challenge 2026 • AI × Web3 Agents • Tunisia
