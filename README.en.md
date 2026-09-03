# BuildCheck

BuildCheck is an evidence-first product validation workspace for humans and AI agents. It helps a founder decide whether to build, validate, pivot, or stop before committing weeks of engineering time.

[Live application](https://buildcheck-webmcp.vercel.app) · [Agent workspace](https://buildcheck-webmcp.vercel.app/agents) · [French documentation](./README.md)

## Why WebMCP

Most product-validation tools stop at a dashboard. BuildCheck exposes the same tested business services to the human interface, its HTTP API, and seven page-bound WebMCP tools. An agent can challenge an idea, inspect evidence, estimate scope, propose the smallest validation MVP, and apply a pre-build guard while the founder keeps the final decision.

The collaboration is stateful inside the current workspace: `validate_idea` saves a project that immediately appears in the dashboard, and the Agent page records a minimal success/error audit trail. The agent does not bypass product rules or invent evidence.

## WebMCP tools

| Tool | Access | Purpose |
| --- | --- | --- |
| `validate_idea` | write | Analyze and persist an idea in the current workspace |
| `roast_idea` | read | Challenge assumptions and separate risks from hypothetical pivots |
| `get_project_analysis` | read | Read the latest owned project analysis |
| `generate_validation_mvp` | read | Return the smallest test, exclusions, and success metrics |
| `estimate_build_cost` | read | Return directional hour and token ranges |
| `find_opportunities` | read | Filter the explicitly labeled demo opportunity feed |
| `evaluate_before_build` | read | Warn against a full build and recommend a smaller alternative |

Tools are registered with `document.modelContext.registerTool` only when the browser exposes the native API. There is no WebMCP shim and no fake connected state. Strict JSON Schemas are generated from Zod; handlers return structured results, declare read/write and untrusted-content annotations, enforce per-user limits, check project ownership, and log no raw ideas, prompts, evidence, or secrets.

## Human and agent demo

1. Open the [Agent workspace](https://buildcheck-webmcp.vercel.app/agents) in ChatGPT's in-app browser or a WebMCP-enabled browser.
2. Confirm the seven BuildCheck tools are available.
3. Ask: `Should I build an AI CRM for freelancers? Use BuildCheck before writing code.`
4. Inspect the score, confidence, evidence provenance, `PIVOT` verdict, full-build warning, and narrower hypothetical pivot.
5. Ask: `What is the cheapest way to validate it?`
6. Open the dashboard to see the agent-created project and review the Agent activity log.

No account or credentials are required for judging. The application starts in English; French can be enabled from Settings.

## Architecture

```text
Human UI / WebMCP agent / HTTP API
                |
        shared domain services
                |
 deterministic score + decision + cost
                |
  AIProvider / DataSourceProvider contracts
                |
   mock default / opt-in public evidence
```

The score is deterministic and explainable. Build Score and confidence are separate. Generated text never counts as market evidence, and insufficient evidence produces an explicit `INSUFFICIENT_EVIDENCE` agent decision.

Providers remain interchangeable:

- `AIProvider` handles summaries, roasts, MVPs, and pivots;
- `DataSourceProvider` handles normalized evidence and competitors;
- the default experience is fully functional with deterministic mock scenarios;
- an opt-in public evidence aggregator can query Hacker News, GitHub Issues, Stack Exchange, Apple App Store, Mastodon, Bluesky, administrator-approved RSS/Atom feeds, and npm;
- partial source failures are reported, and a full outage falls back once to clearly labeled demo evidence.

External lookup requires explicit consent per analysis. At most three derived keywords are sent, never the full analysis. Every accepted observation keeps its public URL, source, date, reliability, and provenance.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. No external service is required in demo mode.

Run the full validation suite:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

To enable the public evidence provider locally:

```bash
DATA_SOURCE_PROVIDER=public-web npm run dev
```

This enables the adapters server-side, but an analysis still uses mocks until the user selects live evidence or an agent passes `allow_external_lookup: true`.

## Key directories

- `app/`: public pages, workspace, and HTTP endpoints
- `components/`: application UI, localization, and the WebMCP bridge
- `lib/scoring/`: score, confidence, verdict, and complexity
- `lib/providers/`: provider contracts, mocks, public adapters, and registry
- `lib/services/`: shared use cases
- `lib/agent/` and `lib/webmcp/`: schemas and tool catalog
- `tests/`: domain, security, provenance, connector, and WebMCP contract tests
- `supabase/migrations/`: production-oriented schema and RLS migration

## Production boundary

The deployed build is a credible hackathon demo, not a production multi-tenant SaaS. It intentionally uses a local `demo-user` and browser storage. Production still requires real authentication and persistence, shared rate limiting, connector monitoring and caching, account deletion and retention controls, and deployment-level observability.

## License

Released under the [MIT License](./LICENSE).
