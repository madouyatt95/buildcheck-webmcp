# BuildCheck — Devpost submission copy

## Project name

BuildCheck

## Tagline

Evidence before engineering: a shared product-validation workspace for founders and AI agents.

## Short description

BuildCheck helps founders decide whether to build, validate, pivot, or stop before investing weeks of engineering time. Its deterministic validation engine is available through both a polished human workspace and seven native, page-bound WebMCP tools.

## Inspiration

AI makes software faster to build, but it also makes it easier to build the wrong product faster. A founder can ask an agent to create an entire SaaS before testing whether the problem is painful, frequent, reachable, or worth paying for. BuildCheck adds an evidence-first checkpoint before implementation begins.

## What it does

BuildCheck scores an idea across demand, pain, willingness to pay, distribution, competitive opportunity, build simplicity, and defensibility. It keeps confidence separate from the Build Score, preserves provenance, and returns one of four explicit outcomes: BUILD, VALIDATE FIRST, PIVOT, or KILL.

The human workspace provides guided validation, reports, comparisons, opportunities, methodology, settings, and an Agent activity log. The agent surface exposes seven WebMCP tools:

- `validate_idea`
- `roast_idea`
- `get_project_analysis`
- `generate_validation_mvp`
- `estimate_build_cost`
- `find_opportunities`
- `evaluate_before_build`

An agent can challenge an idea, inspect a saved analysis, estimate the full-build scope, and propose the smallest validation MVP. A write-capable validation call creates a project in the current browser workspace, so the founder can immediately continue in the dashboard.

## Why this is a strong fit for WebMCP

Product validation is not one isolated prompt. It is a sequence of decisions over structured project state: collect an idea, challenge assumptions, inspect evidence, compare the cost of a full build with a smaller test, and decide what happens next. WebMCP lets the agent operate the same product workflows that a human uses without a separate integration server or a duplicated scoring implementation.

BuildCheck is deliberately page-bound. The tools inherit the open workspace and current session, register only when the browser exposes the native WebMCP API, and are removed when the workspace unmounts. The human remains responsible for the final product decision; the agent provides structured evidence, warnings, and a smaller next action.

## How it creates a better user experience

Without WebMCP, a founder copies an idea between a chat, spreadsheets, search tabs, and a planning tool. Context and provenance disappear along the way. With BuildCheck, the founder can ask in natural language while the agent calls typed product actions. The resulting project, score, evidence, MVP, cost range, and audit event remain visible in the same workspace.

The interface also makes uncertainty honest. Generated summaries do not count as market evidence. Public-source failures are visible. If there is not enough evidence, the agent returns `INSUFFICIENT_EVIDENCE` instead of manufacturing confidence.

## How people and agents collaborate

People provide product judgment, consent to optional external research, and choose whether to invest. Agents handle the repetitive analytical chain: challenge the idea, retrieve the current analysis, calculate cost ranges, apply the pre-build guard, and propose a measurable validation MVP. Both use the same services and see the same locally persisted workspace state.

This makes a useful interaction possible: “Should I build this?” can become a traceable project decision rather than an ungrounded chat answer.

## How we built it

BuildCheck uses Next.js 16, React 19, strict TypeScript, Zod, Tailwind CSS, and Vitest. The WebMCP bridge uses `document.modelContext.registerTool` with feature detection and an `AbortController` lifecycle. JSON Schemas are generated from Zod, every handler returns structured output, and annotations distinguish read-only tools from the write-capable validation tool.

The human UI, HTTP endpoint, and WebMCP handlers call the same domain services. The score, confidence model, verdicts, cost estimates, and ownership checks therefore have one implementation and one test suite.

We started mock-first behind `AIProvider` and `DataSourceProvider` contracts so the complete product and UX work deterministically without third-party credentials. We then added an opt-in public evidence aggregator with eight interchangeable adapters. External lookup is explicit per analysis, sends only a few derived keywords, preserves source URLs and provenance, tolerates partial outages, and falls back to clearly labeled demo evidence only when every source fails. Adapter availability depends on the source; RSS requires configured feeds.

## Challenges

The hardest part was not registering seven functions; it was making agent actions obey the same product and safety rules as the interface. We had to keep generated narrative separate from evidence, separate confidence from score, prevent project enumeration, make external research consent explicit, and retain useful behavior when native WebMCP or public providers are unavailable.

## Accomplishments

- Seven native WebMCP tools with strict schemas and structured results
- Stateful human-agent continuity in the same workspace
- Deterministic, explainable scoring with explicit insufficient-evidence behavior
- Mock-first provider architecture plus eight opt-in public evidence adapters
- English default UI with a complete optional French translation
- PWA support, security headers, rate limits, ownership checks, and minimal safe logs
- 62 automated tests plus lint, strict typecheck, and production build validation

## What we learned

The most valuable agent tool is often a guardrail, not a generator. A reliable pre-build tool must be able to say “not enough evidence,” expose why, and recommend a cheaper experiment. WebMCP is especially compelling when it connects natural-language intent to an existing, inspectable product workflow instead of hiding logic in a remote black box.

## Current scope and what is next

This submission is a working demonstration, not a production multi-tenant SaaS. It uses a demo user, browser-local storage, and MockAIProvider. Demo evidence is labeled; optional public research is not a guarantee of market demand.

Next we would add real authentication and durable multi-tenant persistence, shared rate limiting, connector observability and caching, evidence deduplication, and controlled A/B evaluation of live sources against the deterministic scenarios. Real AI providers remain optional because an LLM should summarize and challenge evidence, never invent proof or choose the final score.

## Testing instructions

1. Open `https://buildcheck-webmcp.vercel.app/agents` in ChatGPT's in-app browser or Chrome 149+ with WebMCP testing enabled.
2. No login is required. Keep the default English language.
3. Confirm that seven site tools are available.
4. Ask: `Should I build an AI CRM for freelancers? Use BuildCheck before writing code.`
5. Confirm the `PIVOT` result, clearly labeled demo evidence, full-build warning, and smaller proposed test.
6. Ask: `What is the cheapest way to validate it?`
7. Open the dashboard and Agent activity to verify continuity.

## Links

- Live application: https://buildcheck-webmcp.vercel.app
- Agent workspace: https://buildcheck-webmcp.vercel.app/agents
- Source code: https://github.com/madouyatt95/buildcheck-webmcp
- Demo video: https://youtu.be/DAfWjhWVQGc
- Devpost project preview: https://devpost.com/software/buildcheck

## Devpost draft status — September 3, 2026

The project overview, story, five technology tags, three project links, public YouTube embed, two captioned screenshots, and judge-facing technical information have been saved. Devpost shows **DRAFT, 4/5 steps done**. The preview renders the story, video, screenshots, and links correctly.

The challenge submission is now **submitted**. Devpost confirmed “Project submitted!” and the public project page is live. Registration questionnaire answers are intentionally excluded from this repository.
