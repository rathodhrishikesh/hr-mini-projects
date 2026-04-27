// Credit risk modeling engine — runs entirely in-browser on a sampled subset.
// Logistic Regression trained with batch gradient descent + L2 regularization.

export type Row = Record<string, string | number | null>;

export interface DatasetSummary {
  totalRows: number;
  sampledRows: number;
  columns: string[];
  missingByColumn: Record<string, number>;
  defaultRate: number;
  positives: number;
  negatives: number;
}

export interface ModelResult {
  features: string[];
  weights: number[];      // length = features.length + 1 (bias at index 0)
  means: number[];
  stds: number[];
  predictions: { pd: number; el: number; loanAmnt: number; actual: 0 | 1 }[];
  metrics: {
    auc: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    threshold: number;
    confusion: { tp: number; fp: number; tn: number; fn: number };
  };
  rocCurve: { fpr: number; tpr: number }[];
  calibration: { bucket: number; predicted: number; actual: number; count: number }[];
  pdHistogram: { bin: string; count: number }[];
  segments: {
    segment: "Low" | "Medium" | "High";
    count: number;
    avgPd: number;
    avgEl: number;
    defaultRate: number;
    totalEl: number;
  }[];
  featureImportance: { feature: string; weight: number; absWeight: number }[];
  totalExpectedLoss: number;
  portfolioSize: number;
}

const LGD = 0.6;

// ---------- Helpers ----------

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/[%,$]/g, "");
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const parseTermMonths = (v: unknown): number | null => {
  if (v == null) return null;
  const m = String(v).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
};

const parseEmpLength = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const s = String(v).toLowerCase();
  if (s.includes("< 1")) return 0;
  if (s.includes("10+")) return 10;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
};

const isDefaultStatus = (s: unknown): 0 | 1 => {
  const v = String(s ?? "").toLowerCase();
  if (v.includes("charged off") || v === "default") return 1;
  return 0;
};

// Stratified random sample
function sample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr.slice();
  const out: T[] = new Array(n);
  const len = arr.length;
  const taken = new Set<number>();
  let i = 0;
  while (i < n) {
    const idx = Math.floor(Math.random() * len);
    if (taken.has(idx)) continue;
    taken.add(idx);
    out[i++] = arr[idx];
  }
  return out;
}

// ---------- Feature engineering ----------

const NUMERIC_FEATURES = [
  "loan_amnt", "int_rate", "installment", "annual_inc", "dti",
  "delinq_2yrs", "fico_range_low", "fico_range_high", "inq_last_6mths",
  "open_acc", "pub_rec", "revol_bal", "revol_util", "total_acc",
  "term_months", "emp_length_years",
];

const CATEGORICAL_FEATURES: { col: string; values: string[] }[] = [
  { col: "grade", values: ["A", "B", "C", "D", "E", "F", "G"] },
  { col: "home_ownership", values: ["MORTGAGE", "RENT", "OWN", "OTHER", "NONE", "ANY"] },
  { col: "verification_status", values: ["Verified", "Source Verified", "Not Verified"] },
  { col: "purpose", values: ["debt_consolidation", "credit_card", "home_improvement", "major_purchase", "small_business", "car", "medical", "moving", "vacation", "house", "wedding", "other"] },
];

interface FeatureBuild {
  X: number[][];
  y: (0 | 1)[];
  loanAmnts: number[];
  featureNames: string[];
}

function buildFeatures(rows: Row[]): FeatureBuild {
  const featureNames: string[] = [...NUMERIC_FEATURES];
  for (const c of CATEGORICAL_FEATURES) {
    // drop first level as baseline
    for (let i = 1; i < c.values.length; i++) featureNames.push(`${c.col}=${c.values[i]}`);
  }

  // Pre-compute medians for numeric imputation
  const colVals: Record<string, number[]> = {};
  for (const f of NUMERIC_FEATURES) colVals[f] = [];

  const enriched = rows.map((r) => {
    const e: Record<string, number | null> = {};
    e.loan_amnt = num(r.loan_amnt);
    e.int_rate = num(r.int_rate);
    e.installment = num(r.installment);
    e.annual_inc = num(r.annual_inc);
    e.dti = num(r.dti);
    e.delinq_2yrs = num(r.delinq_2yrs);
    e.fico_range_low = num(r.fico_range_low);
    e.fico_range_high = num(r.fico_range_high);
    e.inq_last_6mths = num(r.inq_last_6mths);
    e.open_acc = num(r.open_acc);
    e.pub_rec = num(r.pub_rec);
    e.revol_bal = num(r.revol_bal);
    e.revol_util = num(r.revol_util);
    e.total_acc = num(r.total_acc);
    e.term_months = parseTermMonths(r.term);
    e.emp_length_years = parseEmpLength(r.emp_length);
    for (const f of NUMERIC_FEATURES) {
      const v = e[f];
      if (v != null) colVals[f].push(v);
    }
    return e;
  });

  const medians: Record<string, number> = {};
  for (const f of NUMERIC_FEATURES) {
    const arr = colVals[f].slice().sort((a, b) => a - b);
    medians[f] = arr.length ? arr[Math.floor(arr.length / 2)] : 0;
  }

  const X: number[][] = [];
  const y: (0 | 1)[] = [];
  const loanAmnts: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const e = enriched[i];
    const row: number[] = [];
    for (const f of NUMERIC_FEATURES) row.push(e[f] != null ? (e[f] as number) : medians[f]);
    for (const c of CATEGORICAL_FEATURES) {
      const v = String(r[c.col] ?? "").trim();
      for (let k = 1; k < c.values.length; k++) row.push(v === c.values[k] ? 1 : 0);
    }
    X.push(row);
    y.push(isDefaultStatus(r.loan_status));
    loanAmnts.push(e.loan_amnt ?? medians.loan_amnt ?? 0);
  }

  return { X, y, loanAmnts, featureNames };
}

// ---------- Logistic Regression (gradient descent) ----------

function standardize(X: number[][]) {
  const n = X.length;
  const d = X[0].length;
  const means = new Array(d).fill(0);
  const stds = new Array(d).fill(0);
  for (let j = 0; j < d; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += X[i][j];
    means[j] = s / n;
  }
  for (let j = 0; j < d; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const v = X[i][j] - means[j];
      s += v * v;
    }
    stds[j] = Math.sqrt(s / n) || 1;
  }
  const Xs = X.map((row) => row.map((v, j) => (v - means[j]) / stds[j]));
  return { Xs, means, stds };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));

function trainLogReg(X: number[][], y: (0 | 1)[], opts = { epochs: 200, lr: 0.1, l2: 0.001 }) {
  const n = X.length;
  const d = X[0].length;
  const w = new Array(d + 1).fill(0); // index 0 = bias
  // Class balance via weights
  const pos = y.reduce((a, b) => a + b, 0);
  const neg = n - pos;
  const wPos = pos > 0 ? n / (2 * pos) : 1;
  const wNeg = neg > 0 ? n / (2 * neg) : 1;

  for (let epoch = 0; epoch < opts.epochs; epoch++) {
    const grad = new Array(d + 1).fill(0);
    for (let i = 0; i < n; i++) {
      let z = w[0];
      for (let j = 0; j < d; j++) z += w[j + 1] * X[i][j];
      const p = sigmoid(z);
      const wi = y[i] === 1 ? wPos : wNeg;
      const err = (p - y[i]) * wi;
      grad[0] += err;
      for (let j = 0; j < d; j++) grad[j + 1] += err * X[i][j];
    }
    for (let j = 0; j <= d; j++) {
      const reg = j === 0 ? 0 : opts.l2 * w[j];
      w[j] -= (opts.lr / n) * (grad[j] + reg * n);
    }
  }
  return w;
}

function predictProba(w: number[], X: number[][]): number[] {
  return X.map((row) => {
    let z = w[0];
    for (let j = 0; j < row.length; j++) z += w[j + 1] * row[j];
    return sigmoid(z);
  });
}

// ---------- Metrics ----------

function computeAUC(scores: number[], labels: (0 | 1)[]): number {
  // Mann-Whitney U
  const idx = scores.map((s, i) => ({ s, y: labels[i] })).sort((a, b) => a.s - b.s);
  let rankSumPos = 0;
  let nPos = 0, nNeg = 0;
  for (let i = 0; i < idx.length; i++) {
    // average ranks for ties
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].s === idx[i].s) j++;
    const avgRank = (i + j + 2) / 2; // ranks 1-indexed
    for (let k = i; k <= j; k++) {
      if (idx[k].y === 1) { rankSumPos += avgRank; nPos++; } else nNeg++;
    }
    i = j;
  }
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (rankSumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

function rocPoints(scores: number[], labels: (0 | 1)[]): { fpr: number; tpr: number }[] {
  const arr = scores.map((s, i) => ({ s, y: labels[i] })).sort((a, b) => b.s - a.s);
  const P = labels.reduce((a, b) => a + b, 0);
  const N = labels.length - P;
  const pts: { fpr: number; tpr: number }[] = [{ fpr: 0, tpr: 0 }];
  let tp = 0, fp = 0;
  const step = Math.max(1, Math.floor(arr.length / 200));
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].y === 1) tp++; else fp++;
    if (i % step === 0) pts.push({ fpr: fp / Math.max(1, N), tpr: tp / Math.max(1, P) });
  }
  pts.push({ fpr: 1, tpr: 1 });
  return pts;
}

function calibration(scores: number[], labels: (0 | 1)[], bins = 10) {
  const out: { bucket: number; predicted: number; actual: number; count: number }[] = [];
  for (let b = 0; b < bins; b++) {
    const lo = b / bins, hi = (b + 1) / bins;
    let sumP = 0, sumY = 0, c = 0;
    for (let i = 0; i < scores.length; i++) {
      const s = scores[i];
      if (s >= lo && (s < hi || (b === bins - 1 && s <= hi))) {
        sumP += s; sumY += labels[i]; c++;
      }
    }
    out.push({
      bucket: (lo + hi) / 2,
      predicted: c ? sumP / c : 0,
      actual: c ? sumY / c : 0,
      count: c,
    });
  }
  return out;
}

function histogram(scores: number[], bins = 20) {
  const out: { bin: string; count: number }[] = [];
  for (let b = 0; b < bins; b++) {
    const lo = b / bins, hi = (b + 1) / bins;
    let c = 0;
    for (const s of scores) {
      if (s >= lo && (s < hi || (b === bins - 1 && s <= hi))) c++;
    }
    out.push({ bin: `${(lo * 100).toFixed(0)}–${(hi * 100).toFixed(0)}%`, count: c });
  }
  return out;
}

// ---------- Public API ----------

export function summarize(rows: Row[], totalRows: number): DatasetSummary {
  const cols = rows.length ? Object.keys(rows[0]) : [];
  const missing: Record<string, number> = {};
  for (const c of cols) missing[c] = 0;
  for (const r of rows) for (const c of cols) {
    const v = r[c];
    if (v === null || v === undefined || v === "") missing[c]++;
  }
  let pos = 0;
  for (const r of rows) pos += isDefaultStatus(r.loan_status);
  return {
    totalRows,
    sampledRows: rows.length,
    columns: cols,
    missingByColumn: missing,
    defaultRate: rows.length ? pos / rows.length : 0,
    positives: pos,
    negatives: rows.length - pos,
  };
}

export function trainAndScore(rows: Row[], maxTrain = 30000): ModelResult {
  // Sample for training to keep things fast, but score the full portfolio.
  const trainRows = rows.length > maxTrain ? sample(rows, maxTrain) : rows;
  const built = buildFeatures(trainRows);
  const { Xs, means, stds } = standardize(built.X);
  const weights = trainLogReg(Xs, built.y, { epochs: 250, lr: 0.2, l2: 0.001 });
  const probs = predictProba(weights, Xs);

  // Score every row in the uploaded dataset using the trained weights & training-set scaling.
  const fullBuilt = rows.length === trainRows.length ? built : buildFeatures(rows);
  const fullXs = fullBuilt.X.map((row) => row.map((v, j) => (v - means[j]) / stds[j]));
  const fullProbs = predictProba(weights, fullXs);

  // Metrics computed across the FULL uploaded dataset so confusion matrix matches portfolio size.
  const auc = computeAUC(fullProbs, fullBuilt.y);
  const roc = rocPoints(fullProbs, fullBuilt.y);
  const cal = calibration(fullProbs, fullBuilt.y);
  const hist = histogram(fullProbs);

  const threshold = 0.5;
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < fullProbs.length; i++) {
    const pred = fullProbs[i] >= threshold ? 1 : 0;
    if (pred === 1 && fullBuilt.y[i] === 1) tp++;
    else if (pred === 1 && fullBuilt.y[i] === 0) fp++;
    else if (pred === 0 && fullBuilt.y[i] === 0) tn++;
    else fn++;
  }
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (tp + tn) / Math.max(1, fullProbs.length);

  // Per-loan PD / EL — across the FULL uploaded dataset, not just the training sample.
  const predictions = fullProbs.map((p, i) => ({
    pd: p,
    el: p * LGD * fullBuilt.loanAmnts[i],
    loanAmnt: fullBuilt.loanAmnts[i],
    actual: fullBuilt.y[i],
  }));

  // Segments
  const segDefs = [
    { name: "Low" as const, lo: 0, hi: 0.1 },
    { name: "Medium" as const, lo: 0.1, hi: 0.3 },
    { name: "High" as const, lo: 0.3, hi: 1.01 },
  ];
  const segments = segDefs.map((s) => {
    const inSeg = predictions.filter((p) => p.pd >= s.lo && p.pd < s.hi);
    const sumPd = inSeg.reduce((a, b) => a + b.pd, 0);
    const sumEl = inSeg.reduce((a, b) => a + b.el, 0);
    const defs = inSeg.reduce((a, b) => a + b.actual, 0);
    return {
      segment: s.name,
      count: inSeg.length,
      avgPd: inSeg.length ? sumPd / inSeg.length : 0,
      avgEl: inSeg.length ? sumEl / inSeg.length : 0,
      defaultRate: inSeg.length ? defs / inSeg.length : 0,
      totalEl: sumEl,
    };
  });

  // Feature importance — weight magnitude (features are standardized so comparable)
  const featureImportance = built.featureNames
    .map((f, i) => ({ feature: f, weight: weights[i + 1], absWeight: Math.abs(weights[i + 1]) }))
    .sort((a, b) => b.absWeight - a.absWeight)
    .slice(0, 12);

  const totalExpectedLoss = predictions.reduce((a, b) => a + b.el, 0);

  return {
    features: built.featureNames,
    weights,
    means,
    stds,
    predictions,
    metrics: { auc, accuracy, precision, recall, f1, threshold, confusion: { tp, fp, tn, fn } },
    rocCurve: roc,
    calibration: cal,
    pdHistogram: hist,
    segments,
    featureImportance,
    totalExpectedLoss,
    portfolioSize: predictions.length,
  };
}
