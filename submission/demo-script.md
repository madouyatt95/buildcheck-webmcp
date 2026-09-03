# BuildCheck WebMCP demo — final narration and sync map

Duration: **144.9 seconds (2:24.9)**. Format: 1920 × 1080, 30 fps, English narration, Peter voice, no music.

Status: twelve narration clips generated and placed in the editable montage. Source footage is unchanged. All spoken words fit inside their visual windows; five clips use modest playback adjustments (1.04–1.10×). Exact asset IDs, placed-frame ranges and checks are in [narration-sync.json](narration-sync.json).

| Visual window | Visual anchor | Narration |
| --- | --- | --- |
| 00:00.6–00:21.1 | Landing hero, sample analysis and pre-build value proposition | AI makes software faster to build. BuildCheck helps us decide what is worth building. It is an evidence-first product validation workspace, where founders and agents can challenge an idea before investing in a full product. |
| 00:21.4–00:33.4 | Validate form, idea entry, analysis loading | Let's test an AI CRM for freelancers. Enter the idea in plain English. We are using clearly labeled demo evidence here, with no external lookup. |
| 00:33.7–00:43.8 | Report overview, 53 Build Score, PIVOT, confidence 70 | The result is PIVOT. Score and confidence are separate. Each dimension explains its contribution, so the recommendation can be inspected. |
| 00:44.1–00:51.9 | Evidence tab with demo labels and provenance | Provenance stays visible. Curated examples are not live proof. Generated text never counts as evidence. |
| 00:52.2–00:59.9 | Token ROI tab, directional estimate 31–51 hours | The full build is estimated at thirty-one to fifty-one hours. These are directional estimates. |
| 01:00.2–01:08.1 | MVP tab, concierge test 4–6 hours | Start smaller: a landing page, paid pilots, and manual delivery. Four to six hours. |
| 01:08.5–01:22.1 | Agent page shows native API detected and seven tools available | Here is the WebMCP integration. BuildCheck registers seven native tools on the open page, using document model context. Tools are page-bound, and share the same business services as the human interface. |
| 01:22.5–01:34.7 | Tool catalog then successful validate_idea activity appears | An agent can validate, challenge, estimate, and propose a smaller MVP. We now invoke the validation tool through WebMCP. It saves the result in this workspace. |
| 01:35.0–01:48.7 | Dashboard shows agent-created project and earlier human-created project | The agent-created project is now in the dashboard. The founder can open the report and continue from the same state. There is no separate chat-only copy of the project. |
| 01:49.1–02:02.4 | Agent page, pre-build guard description and activity log | The pre-build guard can recommend against a full product. Strict schemas and structured outputs make the tools predictable, while the activity log records outcomes without storing prompts or secrets. |
| 02:05.0–02:16.8 | Settings profile then public data-source registry | Here are the provider settings. Eight public adapters require consent, with transparent source failures. This workspace remains demo-only. |
| 02:17.4–02:24.3 | Final landing hero | BuildCheck. Humans keep the decision. Agents help find the smallest next step worth building. |

## Verification

- English interface, clean demo workspace, live production URL.
- Actual native WebMCP validation call during recording; success is visible in the activity log and the created project appears in the dashboard.
- Human and agent examples use different input detail, so their scores should not be compared as identical-input runs.
- Demo evidence remains explicitly labeled. Eight public adapters are available, not eight guaranteed live responses.
- All twelve audio transcripts checked against the placed source ranges; no spoken ending is cut off.
- Composed montage images inspected at 10.0, 73.5 and 130.0 seconds.
- No third-party music; only the product screen capture and generated narration.
- Final export verification and publication status are recorded in [submission-checklist.md](submission-checklist.md).
