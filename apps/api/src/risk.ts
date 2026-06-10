import type { RiskTier } from "./types.js";

export function mockCreditScore(input: {
  annualIncome: number;
  ssnLast4: string;
  dateOfBirth: string;
}): number {
  let score = 520;

  if (input.annualIncome >= 90000) score += 180;
  else if (input.annualIncome >= 65000) score += 120;
  else if (input.annualIncome >= 45000) score += 60;
  else if (input.annualIncome >= 30000) score += 20;
  else score -= 80;

  const birthYear = new Date(input.dateOfBirth).getFullYear();
  const age = new Date().getFullYear() - birthYear;
  if (age >= 28 && age <= 55) score += 40;
  else if (age < 22) score -= 40;

  const ssnFactor = Number.parseInt(input.ssnLast4.slice(0, 2), 10) || 0;
  score += ssnFactor % 45;

  return Math.min(850, Math.max(300, Math.round(score)));
}

export function scoreToRiskTier(score: number): RiskTier {
  if (score < 620) return "high";
  if (score < 700) return "medium";
  return "low";
}

export function riskTierToSplitCount(risk: RiskTier): 2 | 4 {
  return risk === "high" ? 2 : 4;
}

export function riskTierLabel(risk: RiskTier): string {
  if (risk === "high") return "High risk";
  if (risk === "medium") return "Medium risk";
  return "Low risk";
}

export const LANDLORD_FEE_PER_PAYMENT = 50;
export const SOFT_CREDIT_CHECK_FEE = 5;

/** High risk (2 payments): $10/payment. Low/medium (4 payments): $5/payment. Total $20/mo either way. */
export function feePerPayment(riskTier: RiskTier | null, splitCount: 2 | 4): number {
  if (riskTier === "high" || splitCount === 2) return 10;
  return 5;
}

export function tenantPaymentFees(tenant: {
  riskTier: RiskTier | null;
  splitCount: 2 | 4;
  creditCheckComplete: boolean;
}) {
  const perPayment = feePerPayment(tenant.riskTier, tenant.splitCount);
  const paymentCount = tenant.splitCount;
  const creditCheckFee = tenant.creditCheckComplete ? SOFT_CREDIT_CHECK_FEE : 0;
  const monthlyPaymentFees = perPayment * paymentCount;
  return {
    creditCheckFee,
    perPayment,
    paymentCount,
    monthlyPaymentFees,
    total: creditCheckFee + monthlyPaymentFees,
  };
}

export function landlordTenantFees(tenant: { enrolled: boolean; onboardingComplete: boolean; splitCount: 2 | 4 }) {
  if (!tenant.enrolled || !tenant.onboardingComplete) {
    return { perPayment: LANDLORD_FEE_PER_PAYMENT, paymentCount: 0, total: 0 };
  }
  return {
    perPayment: LANDLORD_FEE_PER_PAYMENT,
    paymentCount: tenant.splitCount,
    total: LANDLORD_FEE_PER_PAYMENT * tenant.splitCount,
  };
}

export function landlordPortfolioFees(
  tenants: Array<{ enrolled: boolean; onboardingComplete: boolean; splitCount: 2 | 4 }>,
) {
  const enrolled = tenants.filter((t) => t.enrolled && t.onboardingComplete);
  const totalPayments = enrolled.reduce((sum, t) => sum + t.splitCount, 0);
  return {
    perPayment: LANDLORD_FEE_PER_PAYMENT,
    totalPayments,
    monthlyTotal: LANDLORD_FEE_PER_PAYMENT * totalPayments,
  };
}
