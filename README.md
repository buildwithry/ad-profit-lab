# Ad Profit Lab

A fast, standalone marketing toolkit built as a work-sample for an AI vibe-coder
role in affiliate marketing.

## Run it

Open `index.html` directly in a browser. No install, account, API key, or build
step is required.

For a local server instead:

```powershell
node server.mjs
```

Then visit `http://127.0.0.1:4173/`.

## What it demonstrates

- Live campaign unit-economics modeling
- Break-even CPA and ROAS calculations
- Funnel visualization
- Prioritized, rule-based media-buyer recommendations
- Scale scenario modeling
- Channel-specific marketing copywriting prompt builder
- Offer-angle and ad-hook generation
- UTM campaign link building
- Landing-page conversion scorecard
- Responsive, accessible frontend with no framework dependency

The recommendations are intentionally described as a decision engine, not an
LLM. A production version could send the calculated metrics to an n8n webhook
for richer AI analysis while keeping provider keys off the browser.
