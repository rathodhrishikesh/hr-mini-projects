// Loan record type — only fields we actively use are typed strictly,
// the rest accept any value coming from the CSV.
export type LoanRecord = {
  id?: string;
  loan_amnt?: number;
  funded_amnt?: number;
  term?: string;
  int_rate?: number;
  installment?: number;
  grade?: string;
  sub_grade?: string;
  emp_length?: string;
  home_ownership?: string;
  annual_inc?: number;
  verification_status?: string;
  issue_d?: string;
  loan_status?: string;
  purpose?: string;
  addr_state?: string;
  dti?: number;
  fico_range_low?: number;
  fico_range_high?: number;
  total_pymnt?: number;
  total_rec_prncp?: number;
  total_rec_int?: number;
  recoveries?: number;
  [key: string]: string | number | null | undefined;
};

export const DEFAULT_STATUSES = new Set([
  "Charged Off",
  "Default",
  "Late (31-120 days)",
  "Does not meet the credit policy. Status:Charged Off",
]);

export const PAID_STATUSES = new Set([
  "Fully Paid",
  "Does not meet the credit policy. Status:Fully Paid",
]);

export function isDefault(status?: string | null): boolean {
  if (!status) return false;
  return DEFAULT_STATUSES.has(status);
}

export function isClosed(status?: string | null): boolean {
  if (!status) return false;
  return DEFAULT_STATUSES.has(status) || PAID_STATUSES.has(status);
}

export function ficoBand(score?: number): string | null {
  if (score == null || isNaN(score)) return null;
  if (score < 580) return "Poor (<580)";
  if (score < 670) return "Fair (580-669)";
  if (score < 740) return "Good (670-739)";
  if (score < 800) return "Very Good (740-799)";
  return "Excellent (800+)";
}

export const FICO_BAND_ORDER = [
  "Poor (<580)",
  "Fair (580-669)",
  "Good (670-739)",
  "Very Good (740-799)",
  "Excellent (800+)",
];
