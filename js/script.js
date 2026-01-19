// ============================================
// Solar calculator — FULL working version
// Map + finance + charts (25 years)
// ============================================

// ---------- EDITABLE CONSTANTS ----------
const COST_PER_KW = 3000;         // $ per kW
const BASE_KWH_PER_KW = 1800;     // annual kWh per kW
const YEARS = 25;
const PANEL_DEGRADATION = 0.5 / 100; // 0.5% annual output loss

// ============================================
// Historical cost trend data (context charts)
// ============================================
const electricityCostData = {
  years: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  costPerKWh: [0.0824, 0.0858, 0.0844, 0.0872, 0.0895, 0.0945, 0.104, 0.1065, 0.1126, 0.1151, 0.1154, 0.1172, 0.1188, 0.1213, 0.1252, 0.1265, 0.1255, 0.1289, 0.1287, 0.1301, 0.1315, 0.1366, 0.1504, 0.16, 0.1648]
};

const solarCostData = {
  years: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  costPerKW: [15300, 14800, 15100, 13400, 12400, 11700, 12000, 12200, 11700, 11100, 9500, 8400, 7100, 6100, 5600, 5400, 5200, 4900, 4700, 4600, 4600, 4600, 4500, 4300, 4000]
};

// ============================================
// State display names (for UI text)
// ============================================
const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DC: "Washington DC", DE: "Delaware", FL: "Florida",
  GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
  MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming"
};

// ============================================
// Site efficiency settings
// ============================================
const SITE_EFFICIENCY_LEVELS = [
  { label: "Poor", factor: 0.8 },
  { label: "Fair", factor: 0.9 },
  { label: "Average", factor: 1.0 },
  { label: "Good", factor: 1.1 },
  { label: "Excellent", factor: 1.2 }
];

// ============================================
// State solar potential
// ============================================
const solarPotential = {
  "AL": 0.80, "AK": 0.50, "AZ": 1.00, "AR": 0.78, "CA": 0.90,
  "CO": 0.86, "CT": 0.66, "DC": 0.78, "DE": 0.75, "FL": 0.88,
  "GA": 0.83, "HI": 0.92, "ID": 0.65, "IL": 0.70, "IN": 0.72,
  "IA": 0.63, "KS": 0.85, "KY": 0.75, "LA": 0.80, "ME": 0.59,
  "MD": 0.75, "MA": 0.67, "MI": 0.64, "MN": 0.63, "MS": 0.80,
  "MO": 0.80, "MT": 0.70, "NE": 0.81, "NV": 0.98, "NH": 0.60,
  "NJ": 0.75, "NM": 0.97, "NY": 0.68, "NC": 0.82, "ND": 0.68,
  "OH": 0.72, "OK": 0.87, "OR": 0.65, "PA": 0.70, "RI": 0.66,
  "SC": 0.83, "SD": 0.81, "TN": 0.77, "TX": 0.92, "UT": 0.88,
  "VT": 0.60, "VA": 0.78, "WA": 0.58, "WV": 0.74, "WI": 0.64,
  "WY": 0.70
};

// ============================================
// Solar tiers + map styling
// ============================================
const solarTiers = [
  { min: 0.0,  max: 0.59, color: "#ffeab8" },
  { min: 0.6, max: 0.69, color: "#ffdc8a" },
  { min: 0.7, max: 0.79, color: "#ffce5c" },
  { min: 0.8, max: 0.89, color: "#ffc02e" },
  { min: 0.9, max: 1.0, color: "#ffb400" }
];

const HOVER_COLOR = "#e65100";
const SELECTED_COLOR = "#e65100";

function getSolarTier(value) {
  return solarTiers.find(t => value >= t.min && value <= t.max) || { color: "#ccc" };
}

// ============================================
// DOM ELEMENTS
// ============================================
const statePaths = document.querySelectorAll("svg path[id]");
const stateSelect = document.getElementById("stateSelect");

const homeSizeSlider = document.getElementById("homeSizeSlider");
const homeSizeLabel = document.getElementById("homeSizeLabel");
const systemCostDisplay = document.getElementById("systemCostDisplay");
const dailyKwhDisplay = document.getElementById("dailyKwhDisplay");

const siteEfficiencySlider = document.getElementById("siteEfficiencySlider");
const siteEfficiencyDisplay = document.getElementById("siteEfficiencyDisplay");

const paymentTypeRadios = document.getElementsByName("paymentType");
const financingInputs = document.getElementById("financingInputs");
const downpaymentInput = document.getElementById("downpayment");
const interestRateInput = document.getElementById("interestRate");
const interestRateDisplay = document.getElementById("interestRateDisplay");
const repaymentYearsInput = document.getElementById("repaymentYears");
const repaymentYearsDisplay = document.getElementById("repaymentYearsDisplay");

const currentKwhCostInput = document.getElementById("currentKwhCost");
const currentKwhCostDisplay = document.getElementById("currentKwhCostDisplay");
const annualIncreaseInput = document.getElementById("annualIncrease");
const annualIncreaseDisplay = document.getElementById("annualIncreaseDisplay");

const singleIncentiveInput = document.getElementById("singleIncentive");

let netYearlyChart;
let netCumulativeChart;
let electricityCostChart;
let solarCostChart;

// ============================================
// STATE
// ============================================
let selectedState = "AZ";

// ============================================
// Tooltip for map
// ============================================
const tooltip = document.createElement("div");
tooltip.id = "tooltip";
document.body.appendChild(tooltip);

// ============================================
// Helpers
// ============================================
function formatMoney(x) {
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================
// GEO-SPECIFIC NEXT STEPS
// ============================================
function updateNextStepsForState(stateCode) {
  const sections = document.querySelectorAll(".geo-section");
  let matched = false;

  sections.forEach(section => {
    section.style.display = "none";
    const states = section.dataset.states;
    if (states) {
      const stateList = states.split(",").map(s => s.trim());
      if (stateList.includes(stateCode)) {
        section.style.display = "block";
        matched = true;
      }
    }
  });

  if (!matched) {
    const generic = document.querySelector(".geo-generic");
    if (generic) generic.style.display = "block";
  }

  const stateNameEl = document.getElementById("nextStepsStateName");
  if (stateNameEl) {
    stateNameEl.textContent = STATE_NAMES[stateCode] || stateCode;
  }
}

// ============================================
// MAP BEHAVIOUR
// ============================================
function setSelectedState(stateCode) {
  selectedState = stateCode;
  statePaths.forEach(p => {
    const tier = getSolarTier(solarPotential[p.id]);
    p.style.fill = (p.id === stateCode) ? SELECTED_COLOR : tier.color;
  });
  if (stateSelect && stateSelect.value !== stateCode) {
    stateSelect.value = stateCode;
  }
  refreshDisplays();
  updateAndRender();
  updateNextStepsForState(stateCode);
}

statePaths.forEach(path => {
  const tier = getSolarTier(solarPotential[path.id]);
  path.style.fill = tier.color;
  path.dataset.baseColor = tier.color;

  path.addEventListener("mouseenter", () => {
    if (path.id !== selectedState) path.style.fill = HOVER_COLOR;
    tooltip.textContent = path.id;
    tooltip.style.display = "block";
  });

  path.addEventListener("mousemove", e => {
    tooltip.style.left = e.pageX + 10 + "px";
    tooltip.style.top = e.pageY + 10 + "px";
  });

  path.addEventListener("mouseleave", () => {
    path.style.fill = (path.id === selectedState) ? SELECTED_COLOR : path.dataset.baseColor;
    tooltip.style.display = "none";
  });

  path.addEventListener("click", () => setSelectedState(path.id));
});

if (stateSelect) {
  stateSelect.addEventListener("change", e => setSelectedState(e.target.value));
}

// ============================================
// UI DISPLAY UPDATES
// ============================================
function refreshDisplays() {
  if (homeSizeSlider && homeSizeLabel && systemCostDisplay && dailyKwhDisplay) {
    const kw = parseInt(homeSizeSlider.value, 10);
    homeSizeLabel.textContent = `${kw} kW`;
    systemCostDisplay.textContent = `$${formatMoney(kw * COST_PER_KW)}`;
    const solarFactor = solarPotential[selectedState] || 0.30;
    const siteEfficiency = siteEfficiencySlider ? SITE_EFFICIENCY_LEVELS[parseInt(siteEfficiencySlider.value, 10)] : SITE_EFFICIENCY_LEVELS[2];
    if (siteEfficiencyDisplay) siteEfficiencyDisplay.textContent = siteEfficiency.label;
    const annualKWh = kw * BASE_KWH_PER_KW * solarFactor * siteEfficiency.factor;
    dailyKwhDisplay.textContent = `${(annualKWh / 365).toFixed(1)} kWh/day`;
  }

  if (interestRateInput && interestRateDisplay) interestRateDisplay.textContent = `${parseFloat(interestRateInput.value).toFixed(1)}%`;
  if (repaymentYearsInput && repaymentYearsDisplay) repaymentYearsDisplay.textContent = `${repaymentYearsInput.value} years`;

  if (currentKwhCostInput && currentKwhCostDisplay) currentKwhCostDisplay.textContent = `$${parseFloat(currentKwhCostInput.value).toFixed(2)}`;
  if (annualIncreaseInput && annualIncreaseDisplay) annualIncreaseDisplay.textContent = `${parseFloat(annualIncreaseInput.value).toFixed(1)}%`;
}

// ============================================
// PAYMENT TYPE UI
// ============================================
function handlePaymentTypeUI() {
  if (paymentTypeRadios && financingInputs) {
    const checked = Array.from(paymentTypeRadios).find(r => r.checked);
    if (checked) financingInputs.style.display = (checked.value === "financing") ? "block" : "none";
  }
}

// ============================================
// CORE CALCULATION
// ============================================
function calculateNetSavings(inputs) {
  const systemCost = inputs.systemKW * COST_PER_KW;
  const solarFactor = solarPotential[selectedState] || 0.30;
  const siteEfficiency = SITE_EFFICIENCY_LEVELS[inputs.siteEfficiencyIndex];
  const annualKWh = inputs.systemKW * BASE_KWH_PER_KW * solarFactor * siteEfficiency.factor;

  let monthlyPayment = 0;
  if (inputs.paymentType === "financing") {
    const principal = Math.max(0, systemCost - inputs.downpayment);
    const r = (inputs.interestRate / 100) / 12;
    const n = inputs.repaymentYears * 12;
    monthlyPayment = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  }

  let cumulative = 0;
  const rows = [];

  for (let y = 1; y <= YEARS; y++) {
    let payment = 0;
    if (inputs.paymentType === "upfront" && y === 1) payment = systemCost;
    if (inputs.paymentType === "financing") {
      if (y === 1) payment += inputs.downpayment;
      if (y <= inputs.repaymentYears) payment += monthlyPayment * 12;
    }
    const price = inputs.currentKwhCost * Math.pow(1 + inputs.annualIncrease / 100, y - 1);
    const degradedAnnualKWh = annualKWh * Math.pow(1 - PANEL_DEGRADATION, y - 1);
    const value = degradedAnnualKWh * price;
    const incentive = (y === 1) ? inputs.incentive : 0;
    const net = value - payment + incentive;
    cumulative += net;
    rows.push({ year: y, net, cumulative });
  }

  return rows;
}

// ============================================
// RENDER CHARTS + TOTAL SAVINGS
// ============================================
function renderResults(rows) {
  const netYearlyCanvas = document.getElementById("netYearlyChart");
  const netCumulativeCanvas = document.getElementById("netCumulativeChart");
  if (!netYearlyCanvas || !netCumulativeCanvas) return;

  const netYearlyCtx = netYearlyCanvas.getContext("2d");
  const netCumulativeCtx = netCumulativeCanvas.getContext("2d");

  const labels = rows.map(r => `Y${r.year}`);
  const netVals = rows.map(r => r.net);
  const cumVals = rows.map(r => r.cumulative);

  const totalSavingsDisplay = document.getElementById("totalSavingsDisplay");
  if (totalSavingsDisplay) totalSavingsDisplay.textContent = `$${formatMoney(cumVals[cumVals.length - 1] || 0)}`;

  if (netYearlyChart) netYearlyChart.destroy();
  if (netCumulativeChart) netCumulativeChart.destroy();

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { font: { size: 12 } } },
      y: { ticks: { font: { size: 12 } } }
    }
  };

  netYearlyChart = new Chart(netYearlyCtx, {
    type: "bar",
    data: { labels, datasets: [{ data: netVals, backgroundColor: netVals.map(v => v >= 0 ? "#4caf50" : "#f44336") }] },
    options: baseOptions
  });

  netCumulativeChart = new Chart(netCumulativeCtx, {
    type: "line",
    data: { labels, datasets: [{ data: cumVals, borderColor: "#1565c0", borderWidth: 2, tension: 0.2, pointRadius: 3, fill: false }] },
    options: baseOptions
  });
}

// ============================================
// RENDER CONTEXT CHARTS (STATIC) — FIXED Y-AXIS
// ============================================

function renderElectricityCostChart() {
  const canvas = document.getElementById("electricityCostChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (electricityCostChart) electricityCostChart.destroy();

  electricityCostChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: electricityCostData.years,
      datasets: [{
        data: electricityCostData.costPerKWh,
        borderColor: "#1565c0",
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          type: 'linear',     // ? ensure numeric scale
          min: 0,             // ? force axis to start at 0
          ticks: { callback: v => `$${v.toFixed(2)}` }
        },
        x: {
        }
      }
    }
  });
}

function renderSolarCostChart() {
  const canvas = document.getElementById("solarCostChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (solarCostChart) solarCostChart.destroy();

  solarCostChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: solarCostData.years,
      datasets: [{
        data: solarCostData.costPerKW,
        borderColor: "#f9a825",
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          type: 'linear',     // ? ensure numeric scale
          min: 0,             // ? force axis to start at 0
          ticks: { callback: v => `$${v.toLocaleString()}` }
        },
        x: {
        }
      }
    }
  });
}

// ============================================
// MAIN UPDATE
// ============================================
function updateAndRender() {
  if (!homeSizeSlider || !siteEfficiencySlider || !currentKwhCostInput || !annualIncreaseInput || !paymentTypeRadios) return;

  const paymentType = Array.from(paymentTypeRadios).find(r => r.checked).value;

  const rows = calculateNetSavings({
    systemKW: parseInt(homeSizeSlider.value, 10),
    siteEfficiencyIndex: parseInt(siteEfficiencySlider.value, 10),
    paymentType,
    downpayment: downpaymentInput ? parseFloat(downpaymentInput.value || 0) : 0,
    interestRate: interestRateInput ? parseFloat(interestRateInput.value || 0) : 0,
    repaymentYears: repaymentYearsInput ? parseInt(repaymentYearsInput.value || 0, 10) : 0,
    currentKwhCost: parseFloat(currentKwhCostInput.value),
    annualIncrease: parseFloat(annualIncreaseInput.value),
    incentive: singleIncentiveInput ? parseFloat(singleIncentiveInput.value || 0) : 0
  });

  renderResults(rows);
}

// ============================================
// EVENT WIRING (SAFE)
// ============================================
if (homeSizeSlider) homeSizeSlider.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
if (siteEfficiencySlider) siteEfficiencySlider.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });

if (interestRateInput) interestRateInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
if (repaymentYearsInput) repaymentYearsInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
if (currentKwhCostInput) currentKwhCostInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
if (annualIncreaseInput) annualIncreaseInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });

if (downpaymentInput) downpaymentInput.addEventListener("input", updateAndRender);
if (singleIncentiveInput) singleIncentiveInput.addEventListener("input", updateAndRender);

if (paymentTypeRadios) paymentTypeRadios.forEach(r => r.addEventListener("change", () => {
  handlePaymentTypeUI();
  updateAndRender();
}));

// ============================================
// CHARTS RESIZE FIX
// ============================================
window.addEventListener("resize", () => {
  if (netYearlyChart) netYearlyChart.resize();
  if (netCumulativeChart) netCumulativeChart.resize();
  if (electricityCostChart) electricityCostChart.resize();
  if (solarCostChart) solarCostChart.resize();
});

// ============================================
// INITIALISE (SAFE)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  refreshDisplays();
  handlePaymentTypeUI();
  setSelectedState(selectedState);
  updateAndRender();
  renderElectricityCostChart();
  renderSolarCostChart();
});

// ============================================
// SLIDER DYNAMIC FILL FOR CHROME/SAFARI
// ============================================
document.querySelectorAll('input[type="range"]').forEach(slider => {
  function updateSliderFill() {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value);
    const percent = ((val - min) / (max - min)) * 100;

    slider.style.background =
      `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
  }

  slider.addEventListener("input", updateSliderFill);
  updateSliderFill();
});
