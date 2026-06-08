import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuid } from "uuid";
import type { Activity, Landlord, LandlordPayout, Payment, Store, Tenant, User } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function currentMonthYear() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function formatDate(year: number, month: number, day: number) {
  const d = new Date(year, month, day);
  return d.toISOString().slice(0, 10);
}

function seedStore(): Store {
  const landlordId = uuid();
  const tenantId = uuid();
  const { year, month } = currentMonthYear();
  const dueDay = 1;
  const secondDay = 15;
  const rent = 2000;
  const firstAmount = 1000;
  const secondAmount = 1000;

  const landlord: Landlord = {
    id: landlordId,
    name: "Sunset Apartments",
    email: "owner@sunset.com",
    payoutAccountLast4: "4821",
  };

  const tenant: Tenant = {
    id: tenantId,
    name: "Jane Doe",
    email: "jane@demo.com",
    landlordId,
    unit: "4B",
    monthlyRent: rent,
    rentDueDay: dueDay,
    bankLast4: "9034",
    membershipFee: 14.99,
    billFeePercent: 1,
    secondPaymentDay: secondDay,
    creditLimit: 2500,
    enrolled: true,
  };

  const users: User[] = [
    { id: uuid(), email: "jane@demo.com", name: "Jane Doe", role: "tenant", tenantId },
    { id: uuid(), email: "owner@sunset.com", name: "Sunset Apartments", role: "landlord", landlordId },
    { id: uuid(), email: "admin@theunleashed.app", name: "The Unleashed Admin", role: "admin" },
  ];

  const payments: Payment[] = [
    {
      id: uuid(),
      tenantId,
      label: "1st rent installment",
      amount: firstAmount,
      dueDate: formatDate(year, month, dueDay),
      status: "scheduled",
      paidAt: null,
      installment: 1,
    },
    {
      id: uuid(),
      tenantId,
      label: "2nd rent installment",
      amount: secondAmount,
      dueDate: formatDate(year, month, secondDay),
      status: "scheduled",
      paidAt: null,
      installment: 2,
    },
  ];

  const payouts: LandlordPayout[] = [
    {
      id: uuid(),
      landlordId,
      tenantId,
      tenantName: tenant.name,
      unit: tenant.unit,
      amount: rent,
      paidOn: formatDate(year, month, dueDay),
      status: "pending",
    },
  ];

  const activity: Activity[] = [
    {
      id: uuid(),
      at: new Date().toISOString(),
      message: "Jane Doe enrolled with The Unleashed for unit 4B.",
      role: "tenant",
    },
    {
      id: uuid(),
      at: new Date().toISOString(),
      message: "Rent split scheduled: $1,000 on the 1st and $1,000 on the 15th.",
      role: "tenant",
    },
  ];

  return { users, landlords: [landlord], tenants: [tenant], payments, payouts, activity, sessions: {} };
}

function loadStore(): Store {
  if (!fs.existsSync(DATA_FILE)) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const seeded = seedStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Store;
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
  addActivity(`${name} created a landlord account.`, "landlord");
  return { landlord, user };
}

export function createTenantAccount(input: {
  name: string;
  email: string;
  landlordId: string;
  unit: string;
  monthlyRent: number;
  secondPaymentDay?: number;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const unit = input.unit.trim();
  if (!name || !email || !unit) throw new Error("Name, email, and unit are required");
  if (findUserByEmail(email)) throw new Error("Email already in use");
  if (!findLandlord(input.landlordId)) throw new Error("Landlord not found");
  if (!input.monthlyRent || input.monthlyRent < 100) {
    throw new Error("Monthly rent must be at least $100");
  }

  const rent = input.monthlyRent;
  const secondDay = input.secondPaymentDay ?? 15;
  const dueDay = 1;
  const firstAmount = Math.round((rent / 2) * 100) / 100;
  const secondAmount = Math.round((rent - firstAmount) * 100) / 100;
  const { year, month } = currentMonthYear();
  const tenantId = uuid();

  const tenant: Tenant = {
    id: tenantId,
    name,
    email,
    landlordId: input.landlordId,
    unit,
    monthlyRent: rent,
    rentDueDay: dueDay,
    bankLast4: randomLast4(),
    membershipFee: 14.99,
    billFeePercent: 1,
    secondPaymentDay: secondDay,
    creditLimit: Math.max(2500, rent * 2),
    enrolled: true,
  };

  const user: User = {
    id: uuid(),
    email,
    name,
    role: "tenant",
    tenantId,
  };

  const payments: Payment[] = [
    {
      id: uuid(),
      tenantId,
      label: "1st rent installment",
      amount: firstAmount,
      dueDate: formatDate(year, month, dueDay),
      status: "scheduled",
      paidAt: null,
      installment: 1,
    },
    {
      id: uuid(),
      tenantId,
      label: "2nd rent installment",
      amount: secondAmount,
      dueDate: formatDate(year, month, secondDay),
      status: "scheduled",
      paidAt: null,
      installment: 2,
    },
  ];

  const payout: LandlordPayout = {
    id: uuid(),
    landlordId: input.landlordId,
    tenantId,
    tenantName: name,
    unit,
    amount: rent,
    paidOn: formatDate(year, month, dueDay),
    status: "pending",
  };

  store.tenants.push(tenant);
  store.users.push(user);
  store.payments.push(...payments);
  store.payouts.push(payout);
  addActivity(`${name} created a tenant account for unit ${unit}.`, "tenant");
  return { tenant, user };
}
