#!/usr/bin/env bash
set -euo pipefail

SESSION="buildcheck-final-demo"
OUTPUT="submission/exports/buildcheck-webmcp-demo-raw.webm"
BASE_URL="https://buildcheck-webmcp.vercel.app"

mkdir -p submission/exports
npx --yes agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
npx --yes agent-browser --session "$SESSION" --color-scheme light set viewport 1440 900
npx --yes agent-browser --session "$SESSION" record start "$OUTPUT" "$BASE_URL"
npx --yes agent-browser --session "$SESSION" wait 6000
npx --yes agent-browser --session "$SESSION" scroll down 560
npx --yes agent-browser --session "$SESSION" wait 4000
npx --yes agent-browser --session "$SESSION" scroll down 760
npx --yes agent-browser --session "$SESSION" wait 5000

npx --yes agent-browser --session "$SESSION" open "$BASE_URL/validate"
npx --yes agent-browser --session "$SESSION" wait 3000
npx --yes agent-browser --session "$SESSION" snapshot -i >/dev/null
npx --yes agent-browser --session "$SESSION" fill textarea "An AI CRM for independent freelancers that writes follow-ups, summarizes client conversations, and predicts which leads will close."
npx --yes agent-browser --session "$SESSION" wait 2500
npx --yes agent-browser --session "$SESSION" find role button click --name "Analyze this idea"
npx --yes agent-browser --session "$SESSION" wait 5000
npx --yes agent-browser --session "$SESSION" wait 4000
npx --yes agent-browser --session "$SESSION" find role button click --name "Evidence"
npx --yes agent-browser --session "$SESSION" wait 6500
npx --yes agent-browser --session "$SESSION" find role button click --name "Token ROI"
npx --yes agent-browser --session "$SESSION" wait 6500
npx --yes agent-browser --session "$SESSION" find role button click --name "MVP"
npx --yes agent-browser --session "$SESSION" wait 6500

npx --yes agent-browser --session "$SESSION" open "$BASE_URL/agents"
npx --yes agent-browser --session "$SESSION" wait 5000
npx --yes agent-browser --session "$SESSION" scroll down 650
npx --yes agent-browser --session "$SESSION" wait 5000
npx --yes agent-browser --session "$SESSION" scroll down 650
npx --yes agent-browser --session "$SESSION" wait 5000
npx --yes agent-browser --session "$SESSION" webmcp invoke validate_idea --params '{"idea":"An AI CRM for independent freelancers that writes follow-ups, summarizes every client conversation, and predicts which leads will close.","target_customer":"Independent freelancers","business_model":"Monthly SaaS subscription","allow_external_lookup":false}'
npx --yes agent-browser --session "$SESSION" wait 3500

npx --yes agent-browser --session "$SESSION" open "$BASE_URL/dashboard"
npx --yes agent-browser --session "$SESSION" wait 7000
npx --yes agent-browser --session "$SESSION" scroll down 520
npx --yes agent-browser --session "$SESSION" wait 4000

npx --yes agent-browser --session "$SESSION" open "$BASE_URL/agents"
npx --yes agent-browser --session "$SESSION" wait 3000
npx --yes agent-browser --session "$SESSION" eval 'window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"})'
npx --yes agent-browser --session "$SESSION" wait 6500

npx --yes agent-browser --session "$SESSION" open "$BASE_URL/settings"
npx --yes agent-browser --session "$SESSION" wait 3000
npx --yes agent-browser --session "$SESSION" find role button click --name "Data sources"
npx --yes agent-browser --session "$SESSION" wait 7000

npx --yes agent-browser --session "$SESSION" open "$BASE_URL"
npx --yes agent-browser --session "$SESSION" wait 6000
npx --yes agent-browser --session "$SESSION" record stop
