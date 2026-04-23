import Papa from "papaparse";
import type { LoanRecord } from "./loan-types";

// Columns we know are numeric (from the spec). Anything else stays as string.
const NUMERIC_COLUMNS = new Set([
  "member_id","loan_amnt","funded_amnt","funded_amnt_inv","int_rate","installment",
  "annual_inc","dti","delinq_2yrs","fico_range_low","fico_range_high","inq_last_6mths",
  "mths_since_last_delinq","mths_since_last_record","open_acc","pub_rec","revol_bal",
  "revol_util","total_acc","out_prncp","out_prncp_inv","total_pymnt","total_pymnt_inv",
  "total_rec_prncp","total_rec_int","total_rec_late_fee","recoveries","collection_recovery_fee",
  "last_pymnt_amnt","last_fico_range_high","last_fico_range_low","collections_12_mths_ex_med",
  "mths_since_last_major_derog","policy_code","annual_inc_joint","dti_joint","acc_now_delinq",
  "tot_coll_amt","tot_cur_bal","total_rev_hi_lim","avg_cur_bal","bc_open_to_buy","bc_util",
  "mort_acc","num_sats","pct_tl_nvr_dlq","percent_bc_gt_75","pub_rec_bankruptcies","tax_liens",
  "tot_hi_cred_lim","total_bal_ex_mort","total_bc_limit","total_il_high_credit_limit",
  "settlement_amount","settlement_percentage","settlement_term","hardship_amount",
]);

function cleanNumeric(value: string): number | null {
  if (value == null || value === "" || value === "NA" || value === "n/a") return null;
  // Strip "%" suffix (int_rate, revol_util) and surrounding whitespace
  const cleaned = value.toString().trim().replace(/%$/, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export type ParseResult = {
  rows: LoanRecord[];
  columns: string[];
  errors: string[];
  missingRecommended: string[];
  truncated: boolean;
  totalScanned: number;
  rowLimit: number;
};

// Hard cap to keep the browser tab from OOM'ing on huge files (e.g. 1.75GB / 2.5M rows).
// Beyond this, ingestion stops and the user is warned. Sampling preserves a representative slice.
export const ROW_LIMIT = 500_000;

const RECOMMENDED = [
  "loan_amnt","int_rate","grade","loan_status","purpose","addr_state","fico_range_low",
];

export function parseCsv(file: File, onProgress?: (rows: number) => void): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const rows: LoanRecord[] = [];
    let columns: string[] = [];
    const errors: string[] = [];
    let count = 0;
    let totalScanned = 0;
    let truncated = false;
    let aborted = false;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      chunk: (results, parser) => {
        if (!columns.length && results.meta.fields) columns = results.meta.fields;
        totalScanned += results.data.length;
        for (const raw of results.data) {
          if (rows.length >= ROW_LIMIT) {
            truncated = true;
            break;
          }
          const rec: LoanRecord = {};
          for (const key of Object.keys(raw)) {
            const v = raw[key];
            if (NUMERIC_COLUMNS.has(key)) {
              rec[key] = cleanNumeric(v as string);
            } else if (key === "int_rate" || key === "revol_util") {
              rec[key] = cleanNumeric(v as string);
            } else {
              rec[key] = (v ?? "").toString().trim() || null;
            }
          }
          rows.push(rec);
        }
        count = rows.length;
        onProgress?.(count);
        if (results.errors?.length) {
          for (const e of results.errors.slice(0, 3)) errors.push(e.message);
        }
        if (truncated && !aborted) {
          aborted = true;
          try { parser.abort(); } catch { /* noop */ }
        }
      },
      complete: () => {
        const missingRecommended = RECOMMENDED.filter((c) => !columns.includes(c));
        resolve({
          rows,
          columns,
          errors: Array.from(new Set(errors)),
          missingRecommended,
          truncated,
          totalScanned,
          rowLimit: ROW_LIMIT,
        });
      },
      error: (err) => reject(err),
    });
  });
}
