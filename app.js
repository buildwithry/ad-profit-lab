const defaults = {
  budget: 10000,
  cpm: 28,
  ctr: 1.8,
  cvr: 3.2,
  aov: 145,
  cogs: 32,
  refund: 6,
};

const presets = {
  ecommerce: defaults,
  leadgen: { budget: 8000, cpm: 34, ctr: 1.4, cvr: 6.5, aov: 220, cogs: 18, refund: 3 },
  affiliate: { budget: 12000, cpm: 42, ctr: 2.3, cvr: 2.1, aov: 190, cogs: 45, refund: 8 },
};

const fields = [...document.querySelectorAll("#campaignForm input")];
const scaleRange = document.querySelector("#scaleRange");

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function readInputs() {
  return Object.fromEntries(fields.map((field) => [field.name, Math.max(0, Number(field.value) || 0)]));
}

function calculate(input) {
  const impressions = input.cpm > 0 ? (input.budget / input.cpm) * 1000 : 0;
  const clicks = impressions * (input.ctr / 100);
  const orders = clicks * (input.cvr / 100);
  const grossRevenue = orders * input.aov;
  const revenue = grossRevenue * (1 - input.refund / 100);
  const productCost = revenue * (input.cogs / 100);
  const contribution = revenue - productCost;
  const profit = contribution - input.budget;
  const roas = input.budget > 0 ? revenue / input.budget : 0;
  const cpa = orders > 0 ? input.budget / orders : 0;
  const cpc = clicks > 0 ? input.budget / clicks : 0;
  const contributionRate = (1 - input.refund / 100) * (1 - input.cogs / 100);
  const breakEvenCpa = input.aov * contributionRate;
  const breakEvenRoas = contributionRate > 0 ? 1 / contributionRate : 0;
  const marginOfSafety = breakEvenCpa > 0 ? ((breakEvenCpa - cpa) / breakEvenCpa) * 100 : 0;

  return { impressions, clicks, orders, revenue, productCost, profit, roas, cpa, cpc, breakEvenCpa, breakEvenRoas, marginOfSafety };
}

function verdictFor(metrics) {
  if (metrics.profit <= 0 || metrics.marginOfSafety < 0) return "Fix before scaling";
  if (metrics.marginOfSafety < 15) return "Hold and validate";
  if (metrics.marginOfSafety < 35) return "Scale carefully";
  return "Strong scale signal";
}

function buildActions(input, metrics) {
  const actions = [];

  if (input.ctr < 1.5) {
    actions.push({ title: "Refresh the first three seconds", detail: `CTR is ${input.ctr.toFixed(1)}%. Test clearer hooks and stronger problem-aware creative before adding spend.`, impact: "High impact" });
  } else {
    actions.push({ title: "Protect the winning creative", detail: `CTR is holding at ${input.ctr.toFixed(1)}%. Build 3–5 variations around the same angle instead of replacing it.`, impact: "Maintain" });
  }

  if (input.cvr < 2.5) {
    actions.push({ title: "Close the landing-page leak", detail: `Only ${input.cvr.toFixed(1)}% of clicks convert. Match the page headline to the ad promise and tighten proof near the CTA.`, impact: "High impact" });
  } else {
    actions.push({ title: "Raise conversion value", detail: `The page converts at ${input.cvr.toFixed(1)}%. Test a bundle, order bump, or stronger upsell before chasing more traffic.`, impact: "Growth" });
  }

  if (metrics.cpa > metrics.breakEvenCpa) {
    actions.push({ title: "Cut loss-making segments", detail: `CPA is ${money.format(metrics.cpa)} against a ${money.format(metrics.breakEvenCpa)} ceiling. Pause placements and audiences above break-even.`, impact: "Urgent" });
  } else {
    const headroom = Math.max(0, metrics.breakEvenCpa - metrics.cpa);
    actions.push({ title: "Scale inside the headroom", detail: `You have ${money.format(headroom)} of CPA room. Increase budget in 15–25% steps and watch whether CPA stays below the ceiling.`, impact: "Next move" });
  }

  return actions;
}

function renderFunnel(metrics) {
  const stages = [
    ["Impressions", metrics.impressions],
    ["Clicks", metrics.clicks],
    ["Orders", metrics.orders],
    ["Revenue", metrics.revenue, true],
  ];
  const max = Math.max(...stages.map((stage) => stage[1]), 1);

  document.querySelector("#funnel").innerHTML = stages.map(([label, value, isMoney], index) => {
    const visualWidth = Math.max(8, 100 - index * 25);
    const formatted = isMoney ? money.format(value) : number.format(value);
    return `<div class="funnel-row">
      <span class="funnel-label">${label}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${visualWidth}%"></span></span>
      <span class="funnel-value">${formatted}</span>
    </div>`;
  }).join("");
}

function render() {
  const input = readInputs();
  const metrics = calculate(input);
  const scale = 1 + Number(scaleRange.value) / 100;
  const scaled = calculate({ ...input, budget: input.budget * scale });

  document.querySelector("#verdict").textContent = verdictFor(metrics);
  document.querySelector("#safetyMargin").textContent = `${metrics.marginOfSafety.toFixed(1)}%`;
  document.querySelector("#netProfit").textContent = money.format(metrics.profit);
  document.querySelector("#profitDelta").textContent = metrics.profit >= 0 ? "After spend, refunds, and product cost" : "Campaign is below break-even";
  document.querySelector("#revenue").textContent = money.format(metrics.revenue);
  document.querySelector("#orders").textContent = `${number.format(metrics.orders)} estimated orders`;
  document.querySelector("#roas").textContent = `${metrics.roas.toFixed(2)}×`;
  document.querySelector("#breakEvenRoas").textContent = `${metrics.breakEvenRoas.toFixed(2)}× break-even`;
  document.querySelector("#cpa").textContent = money.format(metrics.cpa);
  document.querySelector("#breakEvenCpa").textContent = `${money.format(metrics.breakEvenCpa)} break-even CPA`;
  document.querySelector("#cpcLabel").textContent = `${money.format(metrics.cpc)} CPC`;
  document.querySelector("#scaleValue").textContent = `+${scaleRange.value}%`;
  document.querySelector("#scaledSpend").textContent = money.format(input.budget * scale);
  document.querySelector("#scaledRevenue").textContent = money.format(scaled.revenue);
  document.querySelector("#scaledProfit").textContent = money.format(scaled.profit);
  document.querySelector("#scenarioNote").textContent = `Projection assumes CPM, CTR, and conversion rate stay flat. At this efficiency, every extra ${money.format(input.budget * (scale - 1))} in spend adds about ${money.format(scaled.profit - metrics.profit)} in profit.`;

  document.querySelector("#signal").style.opacity = metrics.profit < 0 ? ".35" : "1";
  renderFunnel(metrics);

  const actions = buildActions(input, metrics);
  document.querySelector("#actionList").innerHTML = actions.map((action) => `<li>
    <div><strong>${action.title}</strong><p>${action.detail}</p></div>
    <span class="impact">${action.impact}</span>
  </li>`).join("");
}

function loadValues(values) {
  fields.forEach((field) => { field.value = values[field.name]; });
  render();
}

fields.forEach((field) => field.addEventListener("input", render));
scaleRange.addEventListener("input", render);
document.querySelector("#resetButton").addEventListener("click", () => {
  scaleRange.value = 25;
  loadValues(defaults);
});
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => loadValues(presets[button.dataset.preset]));
});

render();

const hookTemplates = [
  ["Problem", ({ audience, outcome }) => `${audience}: still trying everything for ${outcome.toLowerCase()}? Start here.`],
  ["Speed", ({ outcome, product }) => `${outcome}—without adding another complicated routine. Meet ${product}.`],
  ["Proof", ({ proof, outcome }) => `${proof}. Built for one job: ${outcome.toLowerCase()}.`],
  ["Contrarian", ({ product, audience }) => `Most ${product.toLowerCase()} options were not made for ${audience.toLowerCase()}. This one was.`],
  ["Curiosity", ({ audience, product }) => `Why are ${audience.toLowerCase()} switching to this ${product.toLowerCase()}?`],
  ["Direct", ({ outcome, proof }) => `Get ${outcome.toLowerCase()}. ${proof}. See how it works.`],
];

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = original; }, 1200);
  } catch {
    button.textContent = "Select + copy";
  }
}

function cleanSlug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateHooks() {
  const data = {
    product: document.querySelector("#hookProduct").value.trim() || "your offer",
    audience: document.querySelector("#hookAudience").value.trim() || "your audience",
    outcome: document.querySelector("#hookOutcome").value.trim() || "the result they want",
    proof: document.querySelector("#hookProof").value.trim() || "designed around the outcome",
  };
  const output = document.querySelector("#hookOutput");
  output.innerHTML = hookTemplates.map(([type, template]) => {
    const hook = template(data);
    return `<article class="hook-result"><span class="hook-type">${type}</span><p>${hook}</p><button class="inline-copy" type="button">Copy</button></article>`;
  }).join("");
  output.querySelectorAll(".inline-copy").forEach((button) => {
    button.addEventListener("click", () => copyText(button.previousElementSibling.textContent, button));
  });
}

function buildUtm() {
  const output = document.querySelector("#utmOutput");
  const copyButton = document.querySelector('[data-copy-target="utmOutput"]');
  try {
    const url = new URL(document.querySelector("#utmUrl").value.trim());
    const params = {
      utm_source: document.querySelector("#utmSource").value,
      utm_medium: document.querySelector("#utmMedium").value,
      utm_campaign: document.querySelector("#utmCampaign").value,
      utm_content: document.querySelector("#utmContent").value,
    };
    Object.entries(params).forEach(([key, value]) => {
      const cleaned = cleanSlug(value);
      if (cleaned) url.searchParams.set(key, cleaned);
    });
    output.textContent = url.toString();
    output.classList.add("has-value");
    copyButton.disabled = false;
  } catch {
    output.textContent = "Enter a complete URL, including https://";
    output.classList.remove("has-value");
    copyButton.disabled = true;
  }
}

const pageSignals = [
  { label: "Specific outcome", points: 20, test: (copy) => /\d|increase|save|grow|reduce|faster|more|without/i.test(copy) },
  { label: "Clear call to action", points: 20, test: (copy) => /buy|shop|book|start|get|join|claim|try|apply|schedule/i.test(copy) },
  { label: "Proof or credibility", points: 20, test: (copy) => /review|rated|customer|client|trusted|case study|result|testimonial|proven/i.test(copy) },
  { label: "Risk reversal", points: 15, test: (copy) => /guarantee|refund|risk.free|cancel anytime|money back|trial/i.test(copy) },
  { label: "Audience or problem clarity", points: 15, test: (copy) => /you|your|struggling|tired|problem|for .* who|designed for/i.test(copy) },
  { label: "Urgency or reason to act", points: 10, test: (copy) => /today|now|limited|ends|deadline|spots|before|bonus/i.test(copy) },
];

function scorePage() {
  const copy = document.querySelector("#pageCopy").value.trim();
  const output = document.querySelector("#scoreOutput");
  const checks = document.querySelector("#pageChecks");
  if (!copy) {
    output.innerHTML = '<div class="score-ring"><strong>—</strong><span>/ 100</span></div><p>Paste your landing-page copy first.</p>';
    checks.innerHTML = "";
    return;
  }
  const results = pageSignals.map((signal) => ({ ...signal, pass: signal.test(copy) }));
  const score = results.reduce((total, signal) => total + (signal.pass ? signal.points : 0), 0);
  const missing = results.filter((signal) => !signal.pass).map((signal) => signal.label.toLowerCase());
  const verdict = score >= 80 ? "Strong conversion foundation. Test the offer and creative match next." : score >= 55 ? `Good start. The biggest gaps are ${missing.slice(0, 2).join(" and ")}.` : `The page needs a clearer selling structure. Start with ${missing.slice(0, 2).join(" and ")}.`;
  output.innerHTML = `<div class="score-ring"><strong>${score}</strong><span>/ 100</span></div><p>${verdict}</p>`;
  checks.innerHTML = results.map((signal) => `<li class="${signal.pass ? "pass" : ""}">${signal.label} <span>· ${signal.points} pts</span></li>`).join("");
}

document.querySelector("#generateHooks").addEventListener("click", generateHooks);
document.querySelector("#buildUtm").addEventListener("click", buildUtm);
document.querySelector("#scorePage").addEventListener("click", scorePage);
document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", () => copyText(document.querySelector(`#${button.dataset.copyTarget}`).textContent.trim(), button));
});

generateHooks();
buildUtm();
