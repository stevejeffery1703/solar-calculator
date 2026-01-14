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

const netYearlyCtx = document.getElementById("netYearlyChart").getContext("2d");
const netCumulativeCtx = document.getElementById("netCumulativeChart").getContext("2d");

let netYearlyChart;
let netCumulativeChart;

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
  const kw = parseInt(homeSizeSlider.value, 10);
  homeSizeLabel.textContent = `${kw} kW`;
  systemCostDisplay.textContent = `$${formatMoney(kw * COST_PER_KW)}`;

  const solarFactor = solarPotential[selectedState] || 0.30;
  const siteEfficiency = SITE_EFFICIENCY_LEVELS[parseInt(siteEfficiencySlider.value, 10)];
  siteEfficiencyDisplay.textContent = siteEfficiency.label;

  const annualKWh =
    kw *
    BASE_KWH_PER_KW *
    solarFactor *
    siteEfficiency.factor;

  const dailyKWh = annualKWh / 365;
  dailyKwhDisplay.textContent = `${dailyKWh.toFixed(1)} kWh/day`;

  interestRateDisplay.textContent = `${parseFloat(interestRateInput.value).toFixed(1)}%`;
  repaymentYearsDisplay.textContent = `${repaymentYearsInput.value} years`;

  currentKwhCostDisplay.textContent = `$${parseFloat(currentKwhCostInput.value).toFixed(2)}`;
  annualIncreaseDisplay.textContent = `${parseFloat(annualIncreaseInput.value).toFixed(1)}%`;
}

function handlePaymentTypeUI() {
  const type = Array.from(paymentTypeRadios).find(r => r.checked).value;
  financingInputs.style.display = (type === "financing") ? "block" : "none";
}

// ============================================
// CORE CALCULATION
// ============================================
function calculateNetSavings(inputs) {
  const systemCost = inputs.systemKW * COST_PER_KW;
  const solarFactor = solarPotential[selectedState] || 0.30;
  const siteEfficiency = SITE_EFFICIENCY_LEVELS[inputs.siteEfficiencyIndex];

  const annualKWh =
    inputs.systemKW *
    BASE_KWH_PER_KW *
    solarFactor *
    siteEfficiency.factor;

  let monthlyPayment = 0;
  if (inputs.paymentType === "financing") {
    const principal = Math.max(0, systemCost - inputs.downpayment);
    const r = (inputs.interestRate / 100) / 12;
    const n = inputs.repaymentYears * 12;
    monthlyPayment = r === 0
      ? principal / n
      : (principal * r) / (1 - Math.pow(1 + r, -n));
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

    const price = inputs.currentKwhCost *
      Math.pow(1 + inputs.annualIncrease / 100, y - 1);

    const degradedAnnualKWh =
      annualKWh * Math.pow(1 - PANEL_DEGRADATION, y - 1);

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
  const labels = rows.map(r => `Y${r.year}`);
  const netVals = rows.map(r => r.net);
  const cumVals = rows.map(r => r.cumulative);

  const totalSavingsDisplay = document.getElementById("totalSavingsDisplay");
  if (totalSavingsDisplay) {
    totalSavingsDisplay.textContent =
      `$${formatMoney(cumVals[cumVals.length - 1] || 0)}`;
  }

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
    data: {
      labels,
      datasets: [{
        data: netVals,
        backgroundColor: netVals.map(v => v >= 0 ? "#4caf50" : "#f44336")
      }]
    },
    options: baseOptions
  });

  netCumulativeChart = new Chart(netCumulativeCtx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: cumVals,
        borderColor: "#1565c0",
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 3,
        fill: false
      }]
    },
    options: baseOptions
  });
}

// ============================================
// MAIN UPDATE
// ============================================
function updateAndRender() {
  const paymentType = Array.from(paymentTypeRadios).find(r => r.checked).value;

  const rows = calculateNetSavings({
    systemKW: parseInt(homeSizeSlider.value, 10),
    siteEfficiencyIndex: parseInt(siteEfficiencySlider.value, 10),
    paymentType,
    downpayment: parseFloat(downpaymentInput.value || 0),
    interestRate: parseFloat(interestRateInput.value || 0),
    repaymentYears: parseInt(repaymentYearsInput.value || 0, 10),
    currentKwhCost: parseFloat(currentKwhCostInput.value),
    annualIncrease: parseFloat(annualIncreaseInput.value),
    incentive: parseFloat(singleIncentiveInput.value || 0)
  });

  renderResults(rows);
}

// ============================================
// EVENT WIRING
// ============================================
homeSizeSlider.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
siteEfficiencySlider.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });

interestRateInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
repaymentYearsInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
currentKwhCostInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });
annualIncreaseInput.addEventListener("input", () => { refreshDisplays(); updateAndRender(); });

downpaymentInput.addEventListener("input", updateAndRender);
singleIncentiveInput.addEventListener("input", updateAndRender);

paymentTypeRadios.forEach(r => r.addEventListener("change", () => {
  handlePaymentTypeUI();
  updateAndRender();
}));

// ============================================
// CHARTS RESIZE FIX
// ============================================
window.addEventListener("resize", () => {
  if (netYearlyChart) netYearlyChart.resize();
  if (netCumulativeChart) netCumulativeChart.resize();
});

// ============================================
// INITIALISE
// ============================================
refreshDisplays();
handlePaymentTypeUI();
setSelectedState(selectedState);
updateAndRender();

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
