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
