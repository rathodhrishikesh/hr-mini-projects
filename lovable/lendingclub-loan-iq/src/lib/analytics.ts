import type { LoanRecord } from "./loan-types";
import { isDefault, isClosed } from "./loan-types";

export function fmtNum(n: number | null | undefined, digits = 0): string {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function fmtCurrency(n: number | null | undefined, compact = false): string {
  if (n == null || isNaN(n)) return "—";
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function mean(values: number[]): number | null {
  const filtered = values.filter((v) => typeof v === "number" && !isNaN(v));
  if (!filtered.length) return null;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => (typeof b === "number" && !isNaN(b) ? a + b : a), 0);
}

export type PortfolioKpis = {
  count: number;
  totalVolume: number;
  avgLoan: number | null;
  avgRate: number | null;
  defaultRate: number;
  paidRate: number;
  totalInterest: number;
  avgFico: number | null;
};

export function computeKpis(rows: LoanRecord[]): PortfolioKpis {
  let totalVolume = 0;
  let loanSum = 0, loanN = 0;
  let rateSum = 0, rateN = 0;
  let ficoSum = 0, ficoN = 0;
  let defaults = 0, paid = 0, closed = 0;
  let interest = 0;
  for (const r of rows) {
    const la = r.loan_amnt as number | null;
    if (typeof la === "number") { totalVolume += la; loanSum += la; loanN++; }
    const ir = r.int_rate as number | null;
    if (typeof ir === "number") { rateSum += ir; rateN++; }
    const fl = r.fico_range_low as number | null;
    const fh = r.fico_range_high as number | null;
    if (typeof fl === "number" && typeof fh === "number") {
      ficoSum += (fl + fh) / 2; ficoN++;
    } else if (typeof fl === "number") { ficoSum += fl; ficoN++; }
    const status = r.loan_status as string | undefined;
    if (isDefault(status)) defaults++;
    if (status === "Fully Paid") paid++;
    if (isClosed(status)) closed++;
    const ti = r.total_rec_int as number | null;
    if (typeof ti === "number") interest += ti;
  }
  const denom = closed || rows.length;
  return {
    count: rows.length,
    totalVolume,
    avgLoan: loanN ? loanSum / loanN : null,
    avgRate: rateN ? rateSum / rateN : null,
    defaultRate: denom ? (defaults / denom) * 100 : 0,
    paidRate: denom ? (paid / denom) * 100 : 0,
    totalInterest: interest,
    avgFico: ficoN ? ficoSum / ficoN : null,
  };
}

export type GroupMetric = {
  key: string;
  count: number;
  defaults: number;
  defaultRate: number;
  avgRate: number | null;
  avgLoan: number | null;
  volume: number;
};

export function groupBy(rows: LoanRecord[], keyFn: (r: LoanRecord) => string | null | undefined): GroupMetric[] {
  const map = new Map<string, { count: number; defaults: number; rateSum: number; rateN: number; loanSum: number; loanN: number; volume: number; closed: number }>();
  for (const r of rows) {
    const k = keyFn(r);
    if (k == null || k === "") continue;
    const key = String(k);
    let agg = map.get(key);
    if (!agg) { agg = { count: 0, defaults: 0, rateSum: 0, rateN: 0, loanSum: 0, loanN: 0, volume: 0, closed: 0 }; map.set(key, agg); }
    agg.count++;
    const status = r.loan_status as string | undefined;
    if (isDefault(status)) agg.defaults++;
    if (isClosed(status)) agg.closed++;
    const ir = r.int_rate as number | null;
    if (typeof ir === "number") { agg.rateSum += ir; agg.rateN++; }
    const la = r.loan_amnt as number | null;
    if (typeof la === "number") { agg.loanSum += la; agg.loanN++; agg.volume += la; }
  }
  const out: GroupMetric[] = [];
  for (const [key, a] of map) {
    const denom = a.closed || a.count;
    out.push({
      key,
      count: a.count,
      defaults: a.defaults,
      defaultRate: denom ? (a.defaults / denom) * 100 : 0,
      avgRate: a.rateN ? a.rateSum / a.rateN : null,
      avgLoan: a.loanN ? a.loanSum / a.loanN : null,
      volume: a.volume,
    });
  }
  return out;
}

// Parse "issue_d" like "Dec-2015" or "Dec-15" → year number
export function parseIssueYear(d?: string | null): number | null {
  if (!d) return null;
  const parts = d.split("-");
  if (parts.length < 2) return null;
  let y = parseInt(parts[1], 10);
  if (isNaN(y)) return null;
  if (y < 100) y += y < 50 ? 2000 : 1900;
  return y;
}

export function downloadCsv(rows: LoanRecord[], columns: string[], filename: string) {
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [columns.join(",")];
  for (const r of rows) {
    lines.push(columns.map((c) => escape(r[c])).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
