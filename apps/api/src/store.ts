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
    { id: uuid(), email: "admin@flex.local", name: "Flex Admin", role: "admin" },
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
      message: "Jane Doe enrolled in Flexible Rent for unit 4B.",
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
