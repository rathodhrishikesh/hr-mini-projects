import { create } from "zustand";
import type { LoanRecord } from "./loan-types";
import { isDefault, isClosed } from "./loan-types";

export type Filters = {
  loanAmount: [number, number] | null;
  intRate: [number, number] | null;
  status: "all" | "default" | "current" | "paid";
  grades: string[];
  purposes: string[];
  states: string[];
};

const emptyFilters: Filters = {
  loanAmount: null,
  intRate: null,
  status: "all",
  grades: [],
  purposes: [],
  states: [],
};

type Bounds = {
  loanMin: number; loanMax: number;
  rateMin: number; rateMax: number;
  grades: string[];
  purposes: string[];
  states: string[];
};

type DataState = {
  rows: LoanRecord[];
  columns: string[];
  fileName: string | null;
  filters: Filters;
  bounds: Bounds | null;
  setData: (rows: LoanRecord[], columns: string[], fileName: string) => void;
  clearData: () => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  filtered: () => LoanRecord[];
};

function computeBounds(rows: LoanRecord[]): Bounds {
  let loanMin = Infinity, loanMax = -Infinity;
  let rateMin = Infinity, rateMax = -Infinity;
  const grades = new Set<string>();
  const purposes = new Set<string>();
  const states = new Set<string>();
  for (const r of rows) {
    const la = r.loan_amnt as number | null | undefined;
    if (typeof la === "number") {
      if (la < loanMin) loanMin = la;
      if (la > loanMax) loanMax = la;
    }
    const ir = r.int_rate as number | null | undefined;
    if (typeof ir === "number") {
      if (ir < rateMin) rateMin = ir;
      if (ir > rateMax) rateMax = ir;
    }
    if (r.grade) grades.add(String(r.grade));
    if (r.purpose) purposes.add(String(r.purpose));
    if (r.addr_state) states.add(String(r.addr_state));
  }
  if (!isFinite(loanMin)) { loanMin = 0; loanMax = 0; }
  if (!isFinite(rateMin)) { rateMin = 0; rateMax = 0; }
  return {
    loanMin: Math.floor(loanMin), loanMax: Math.ceil(loanMax),
    rateMin: Math.floor(rateMin), rateMax: Math.ceil(rateMax),
    grades: Array.from(grades).sort(),
    purposes: Array.from(purposes).sort(),
    states: Array.from(states).sort(),
  };
}

export const useDataStore = create<DataState>((set, get) => ({
  rows: [],
  columns: [],
  fileName: null,
  filters: emptyFilters,
  bounds: null,
  setData: (rows, columns, fileName) => {
    const bounds = computeBounds(rows);
    set({
      rows,
      columns,
      fileName,
      bounds,
      filters: {
        ...emptyFilters,
        loanAmount: [bounds.loanMin, bounds.loanMax],
        intRate: [bounds.rateMin, bounds.rateMax],
      },
    });
  },
  clearData: () => set({ rows: [], columns: [], fileName: null, bounds: null, filters: emptyFilters }),
  setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
  resetFilters: () => {
    const b = get().bounds;
    set({
      filters: {
        ...emptyFilters,
        loanAmount: b ? [b.loanMin, b.loanMax] : null,
        intRate: b ? [b.rateMin, b.rateMax] : null,
      },
    });
  },
  filtered: () => {
    const { rows, filters } = get();
    if (!rows.length) return rows;
    const gradeSet = new Set(filters.grades);
    const purposeSet = new Set(filters.purposes);
    const stateSet = new Set(filters.states);
    return rows.filter((r) => {
      const la = r.loan_amnt as number | null | undefined;
      if (filters.loanAmount && typeof la === "number") {
        if (la < filters.loanAmount[0] || la > filters.loanAmount[1]) return false;
      }
      const ir = r.int_rate as number | null | undefined;
      if (filters.intRate && typeof ir === "number") {
        if (ir < filters.intRate[0] || ir > filters.intRate[1]) return false;
      }
      if (filters.status !== "all") {
        const s = r.loan_status as string | undefined;
        if (filters.status === "default" && !isDefault(s)) return false;
        if (filters.status === "paid" && s !== "Fully Paid") return false;
        if (filters.status === "current" && (isClosed(s) || s === "Late (31-120 days)")) return false;
      }
      if (gradeSet.size && !gradeSet.has(String(r.grade))) return false;
      if (purposeSet.size && !purposeSet.has(String(r.purpose))) return false;
      if (stateSet.size && !stateSet.has(String(r.addr_state))) return false;
      return true;
    });
  },
}));
