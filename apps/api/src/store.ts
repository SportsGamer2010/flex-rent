import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuid } from "uuid";
import { mockCreditScore, riskTierToSplitCount, scoreToRiskTier, SOFT_CREDIT_CHECK_FEE } from "./risk.js";
import type {
  Activity,
  CreditCheck,
  Landlord,
  LandlordPayout,
  Payment,
  RentalHistoryEntry,
  Store,
  Tenant,
  User,
  UtilityBill,
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(__dirname, "..", "uploads");

function currentMonthYear() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function formatDate(year: number, month: number, day: number) {
  return new Date(year, month, day).toISOString().slice(0, 10);
}

const SPLIT_DAYS: Record<2 | 4, number[]> = {
  2: [1, 15],
  4: [1, 8, 15, 22],
};

export function generatePaymentsForTenant(tenant: Tenant): Payment[] {
  const { year, month } = currentMonthYear();
  const days = SPLIT_DAYS[tenant.splitCount];
  const baseAmount = Math.floor((tenant.monthlyRent / tenant.splitCount) * 100) / 100;
  let remainder = Math.round((tenant.monthlyRent - baseAmount * tenant.splitCount) * 100) / 100;

  return days.map((day, index) => {
    const installment = (index + 1) as Payment["installment"];
    let amount = baseAmount;
    if (remainder > 0) {
      amount = Math.round((amount + 0.01) * 100) / 100;
      remainder = Math.round((remainder - 0.01) * 100) / 100;
    }
    const ordinals = ["1st", "2nd", "3rd", "4th"];
    return {
      id: uuid(),
      tenantId: tenant.id,
      label: `${ordinals[index]} rent installment`,
      amount,
      dueDate: formatDate(year, month, day),
      status: "scheduled" as const,
      paidAt: null,
      installment,
    };
  });
}

function seedStore(): Store {
  const landlordId = uuid();
  const lowRiskTenantId = uuid();
  const highRiskTenantId = uuid();
  const { year, month } = currentMonthYear();
  const dueDay = 1;
  const rent = 2000;

  const landlord: Landlord = {
    id: landlordId,
    name: "Sunset Apartments",
    email: "owner@sunset.com",
    payoutAccountLast4: "4821",
  };

  const lowRiskTenant: Tenant = {
    id: lowRiskTenantId,
    name: "Jane Doe",
    email: "jane@demo.com",
    landlordId,
    unit: "4B",
    propertyAddress: "100 Sunset Blvd, Austin, TX",
    monthlyRent: rent,
    rentDueDay: dueDay,
    bankLast4: "9034",
    membershipFee: 14.99,
    billFeePercent: 1,
    creditLimit: 2500,
    enrolled: true,
    riskTier: "low",
    creditScore: 742,
    splitCount: 4,
    propertySetupComplete: true,
    creditCheckComplete: true,
    rentalHistoryComplete: true,
    onboardingComplete: true,
  };

  const highRiskTenant: Tenant = {
    id: highRiskTenantId,
    name: "Marcus Lee",
    email: "marcus@demo.com",
    landlordId,
    unit: "2A",
    propertyAddress: "100 Sunset Blvd, Austin, TX",
    monthlyRent: 1600,
    rentDueDay: dueDay,
    bankLast4: "7712",
    membershipFee: 14.99,
    billFeePercent: 1,
    creditLimit: 2000,
    enrolled: true,
    riskTier: "high",
    creditScore: 598,
    splitCount: 2,
    propertySetupComplete: true,
    creditCheckComplete: true,
    rentalHistoryComplete: true,
    onboardingComplete: true,
  };

  const users: User[] = [
    { id: uuid(), email: "jane@demo.com", name: "Jane Doe", role: "tenant", tenantId: lowRiskTenantId },
    { id: uuid(), email: "marcus@demo.com", name: "Marcus Lee", role: "tenant", tenantId: highRiskTenantId },
    { id: uuid(), email: "owner@sunset.com", name: "Sunset Apartments", role: "landlord", landlordId },
    { id: uuid(), email: "admin@theunleashed.app", name: "The Unleashed Admin", role: "admin" },
  ];

  const lowRiskPayments = generatePaymentsForTenant(lowRiskTenant);
  const highRiskPayments = generatePaymentsForTenant(highRiskTenant);

  const payouts: LandlordPayout[] = [
    {
      id: uuid(),
      landlordId,
      tenantId: lowRiskTenantId,
      tenantName: lowRiskTenant.name,
      unit: lowRiskTenant.unit,
      amount: rent,
      paidOn: formatDate(year, month, dueDay),
      status: "pending",
    },
    {
      id: uuid(),
      landlordId,
      tenantId: highRiskTenantId,
      tenantName: highRiskTenant.name,
      unit: highRiskTenant.unit,
      amount: highRiskTenant.monthlyRent,
      paidOn: formatDate(year, month, dueDay),
      status: "pending",
    },
  ];

  const creditChecks: CreditCheck[] = [
    {
      tenantId: lowRiskTenantId,
      fullLegalName: "Jane Doe",
      dateOfBirth: "1992-04-12",
      ssnLast4: "4821",
      annualIncome: 78000,
      score: 742,
      riskTier: "low",
      fee: 5,
      checkedAt: new Date().toISOString(),
    },
    {
      tenantId: highRiskTenantId,
      fullLegalName: "Marcus Lee",
      dateOfBirth: "1998-11-03",
      ssnLast4: "1198",
      annualIncome: 32000,
      score: 598,
      riskTier: "high",
      fee: 5,
      checkedAt: new Date().toISOString(),
    },
  ];

  const rentalHistory: RentalHistoryEntry[] = [
    {
      id: uuid(),
      tenantId: lowRiskTenantId,
      previousAddress: "118 Oak Street, Austin, TX 78701",
      landlordName: "Riverview Properties",
      landlordPhone: "(512) 555-0142",
      landlordEmail: "leasing@riverview.com",
      monthlyRent: 1850,
      moveInDate: "2022-03-01",
      moveOutDate: "2025-02-28",
      reasonForLeaving: "Relocated for work",
      submittedAt: new Date().toISOString(),
    },
  ];

  const activity: Activity[] = [
    {
      id: uuid(),
      at: new Date().toISOString(),
      message: "Jane Doe enrolled — low risk profile, rent split into 4 payments.",
      role: "tenant",
    },
    {
      id: uuid(),
      at: new Date().toISOString(),
      message: "Marcus Lee enrolled — high risk profile, rent split into 2 payments.",
      role: "tenant",
    },
  ];

  return {
    users,
    landlords: [landlord],
    tenants: [lowRiskTenant, highRiskTenant],
    payments: [...lowRiskPayments, ...highRiskPayments],
    payouts,
    creditChecks,
    rentalHistory,
    utilityBills: [],
    activity,
    sessions: {},
  };
}

function migrateStore(raw: Store): Store {
  for (const tenant of raw.tenants) {
    tenant.riskTier ??= tenant.enrolled ? "low" : null;
    tenant.creditScore ??= tenant.enrolled ? 700 : null;
    tenant.propertyAddress ??= "";
    tenant.propertySetupComplete ??= tenant.enrolled && Boolean(tenant.landlordId && tenant.unit);
    tenant.splitCount ??= tenant.riskTier === "high" ? 2 : 4;
    tenant.creditCheckComplete ??= tenant.enrolled;
    tenant.rentalHistoryComplete ??= tenant.enrolled;
    tenant.onboardingComplete ??= tenant.enrolled;
  }
  raw.creditChecks ??= [];
  for (const check of raw.creditChecks) {
    check.fee ??= 5;
  }
  raw.rentalHistory ??= [];
  raw.utilityBills ??= [];
  for (const payment of raw.payments) {
    if (payment.installment !== 1 && payment.installment !== 2 && payment.installment !== 3 && payment.installment !== 4) {
      payment.installment = 1;
    }
  }
  return raw;
}

function loadStore(): Store {
  if (!fs.existsSync(DATA_FILE)) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const seeded = seedStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  return migrateStore(JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Store);
}

let store = loadStore();

export function getStore() {
  return store;
}

export function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

export function resetStore() {
  store = seedStore();
  persist();
}

export function addActivity(message: string, role?: Activity["role"]) {
  store.activity.unshift({
    id: uuid(),
    at: new Date().toISOString(),
    message,
    role,
  });
  store.activity = store.activity.slice(0, 50);
  persist();
}

export function findUserByEmail(email: string) {
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findTenant(id: string) {
  return store.tenants.find((t) => t.id === id);
}

export function findLandlord(id: string) {
  return store.landlords.find((l) => l.id === id);
}

function randomLast4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function listLandlordsPublic() {
  return store.landlords.map((l) => ({ id: l.id, name: l.name }));
}

export function createLandlordAccount(input: { name: string; email: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name || !email) throw new Error("Name and email are required");
  if (findUserByEmail(email)) throw new Error("Email already in use");

  const landlordId = uuid();
  const landlord: Landlord = {
    id: landlordId,
    name,
    email,
    payoutAccountLast4: randomLast4(),
  };
  const user: User = {
    id: uuid(),
    email,
    name,
    role: "landlord",
    landlordId,
  };

  store.landlords.push(landlord);
  store.users.push(user);
  addActivity(`${name} created a landlord account on The Unleashed.`, "landlord");
  return { landlord, user };
}

export function createTenantAccount(input: { name: string; email: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name || !email) throw new Error("Name and email are required");
  if (findUserByEmail(email)) throw new Error("Email already in use");

  const tenantId = uuid();
  const tenant: Tenant = {
    id: tenantId,
    name,
    email,
    landlordId: "",
    unit: "",
    propertyAddress: "",
    monthlyRent: 0,
    rentDueDay: 1,
    bankLast4: randomLast4(),
    membershipFee: 14.99,
    billFeePercent: 1,
    creditLimit: 2500,
    enrolled: false,
    riskTier: null,
    creditScore: null,
    splitCount: 4,
    propertySetupComplete: false,
    creditCheckComplete: false,
    rentalHistoryComplete: false,
    onboardingComplete: false,
  };

  const user: User = {
    id: uuid(),
    email,
    name,
    role: "tenant",
    tenantId,
  };

  store.tenants.push(tenant);
  store.users.push(user);
  addActivity(`${name} created a tenant account. Property setup and verification required.`, "tenant");
  return { tenant, user };
}

export function submitTenantProperty(
  tenantId: string,
  input: {
    landlordId: string;
    unit: string;
    propertyAddress: string;
    monthlyRent: number;
  },
) {
  const tenant = findTenant(tenantId);
  if (!tenant) throw new Error("Tenant not found");
  if (tenant.propertySetupComplete) throw new Error("Property already submitted");

  const unit = input.unit.trim();
  const propertyAddress = input.propertyAddress.trim();
  if (!input.landlordId || !unit || !propertyAddress) {
    throw new Error("Property, unit, and address are required");
  }
  if (!findLandlord(input.landlordId)) throw new Error("Landlord not found");
  if (!input.monthlyRent || input.monthlyRent < 100) {
    throw new Error("Monthly rent must be at least $100");
  }

  tenant.landlordId = input.landlordId;
  tenant.unit = unit;
  tenant.propertyAddress = propertyAddress;
  tenant.monthlyRent = input.monthlyRent;
  tenant.propertySetupComplete = true;
  tenant.creditLimit = Math.max(2500, input.monthlyRent * 2);

  const landlord = findLandlord(input.landlordId);
  addActivity(
    `${tenant.name} linked unit ${unit} at ${landlord?.name ?? "property"}.`,
    "tenant",
  );
  persist();
  return { tenant, landlord };
}

export function runCreditCheck(
  tenantId: string,
  input: {
    fullLegalName: string;
    dateOfBirth: string;
    ssnLast4: string;
    annualIncome: number;
  },
) {
  const tenant = findTenant(tenantId);
  if (!tenant) throw new Error("Tenant not found");
  if (!tenant.propertySetupComplete) throw new Error("Complete property setup before credit check");
  if (tenant.creditCheckComplete) throw new Error("Credit check already completed");

  const score = mockCreditScore(input);
  const riskTier = scoreToRiskTier(score);
  const splitCount = riskTierToSplitCount(riskTier);

  const check: CreditCheck = {
    tenantId,
    fullLegalName: input.fullLegalName.trim(),
    dateOfBirth: input.dateOfBirth,
    ssnLast4: input.ssnLast4,
    annualIncome: input.annualIncome,
    score,
    riskTier,
    fee: SOFT_CREDIT_CHECK_FEE,
    checkedAt: new Date().toISOString(),
  };

  store.creditChecks = store.creditChecks.filter((c) => c.tenantId !== tenantId);
  store.creditChecks.push(check);

  tenant.creditScore = score;
  tenant.riskTier = riskTier;
  tenant.splitCount = splitCount;
  tenant.creditCheckComplete = true;
  tenant.creditLimit = Math.max(tenant.monthlyRent * splitCount, 2500);

  addActivity(
    `${tenant.name} paid $${SOFT_CREDIT_CHECK_FEE} soft credit check fee — ${riskTier} risk (score ${score}), ${splitCount}-payment split.`,
    "tenant",
  );

  maybeCompleteOnboarding(tenant);
  persist();
  return { check, tenant };
}

export function submitRentalHistory(
  tenantId: string,
  input: {
    previousAddress: string;
    landlordName: string;
    landlordPhone: string;
    landlordEmail: string;
    monthlyRent: number;
    moveInDate: string;
    moveOutDate: string;
    reasonForLeaving: string;
  },
) {
  const tenant = findTenant(tenantId);
  if (!tenant) throw new Error("Tenant not found");
  if (tenant.rentalHistoryComplete) throw new Error("Rental history already submitted");

  const entry: RentalHistoryEntry = {
    id: uuid(),
    tenantId,
    previousAddress: input.previousAddress.trim(),
    landlordName: input.landlordName.trim(),
    landlordPhone: input.landlordPhone.trim(),
    landlordEmail: input.landlordEmail.trim(),
    monthlyRent: input.monthlyRent,
    moveInDate: input.moveInDate,
    moveOutDate: input.moveOutDate,
    reasonForLeaving: input.reasonForLeaving.trim(),
    submittedAt: new Date().toISOString(),
  };

  store.rentalHistory = store.rentalHistory.filter((r) => r.tenantId !== tenantId);
  store.rentalHistory.push(entry);
  tenant.rentalHistoryComplete = true;

  addActivity(`${tenant.name} submitted rental history for verification.`, "tenant");
  maybeCompleteOnboarding(tenant);
  persist();
  return { entry, tenant };
}

function maybeCompleteOnboarding(tenant: Tenant) {
  if (
    !tenant.propertySetupComplete ||
    !tenant.creditCheckComplete ||
    !tenant.rentalHistoryComplete ||
    tenant.onboardingComplete
  ) {
    return;
  }

  tenant.onboardingComplete = true;
  tenant.enrolled = true;

  store.payments = store.payments.filter((p) => p.tenantId !== tenant.id);
  const payments = generatePaymentsForTenant(tenant);
  store.payments.push(...payments);

  const { year, month } = currentMonthYear();
  store.payouts.push({
    id: uuid(),
    landlordId: tenant.landlordId,
    tenantId: tenant.id,
    tenantName: tenant.name,
    unit: tenant.unit,
    amount: tenant.monthlyRent,
    paidOn: formatDate(year, month, tenant.rentDueDay),
    status: "pending",
  });

  addActivity(
    `${tenant.name} completed onboarding — rent split into ${tenant.splitCount} payments.`,
    "tenant",
  );
}

export function createUtilityBill(
  tenantId: string,
  input: { provider: string; amount: number; dueDate: string; fileName: string; filePath: string },
) {
  const tenant = findTenant(tenantId);
  if (!tenant) throw new Error("Tenant not found");
  if (!tenant.onboardingComplete) throw new Error("Complete onboarding before uploading bills");

  const bill: UtilityBill = {
    id: uuid(),
    tenantId,
    provider: input.provider.trim(),
    amount: input.amount,
    dueDate: input.dueDate,
    fileName: input.fileName,
    filePath: input.filePath,
    status: "pending",
    paidAt: null,
    submittedAt: new Date().toISOString(),
  };

  store.utilityBills.push(bill);
  addActivity(`${tenant.name} uploaded a ${bill.provider} bill for $${bill.amount}.`, "tenant");
  persist();
  return bill;
}

export function payUtilityBill(tenantId: string, billId: string) {
  const bill = store.utilityBills.find((b) => b.id === billId && b.tenantId === tenantId);
  if (!bill) throw new Error("Bill not found");
  if (bill.status === "paid") throw new Error("Bill already paid");

  bill.status = "processing";
  persist();

  setTimeout(() => {
    const current = store.utilityBills.find((b) => b.id === billId);
    if (!current) return;
    current.status = "paid";
    current.paidAt = new Date().toISOString();
    const tenant = findTenant(tenantId);
    addActivity(
      `${tenant?.name ?? "Tenant"} paid ${current.provider} bill ($${current.amount}).`,
      "tenant",
    );
    persist();
  }, 1200);

  return bill;
}

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
