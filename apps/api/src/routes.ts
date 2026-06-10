import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { landlordPortfolioFees, landlordTenantFees, riskTierLabel, SOFT_CREDIT_CHECK_FEE, tenantPaymentFees } from "./risk.js";
import {
  addActivity,
  createLandlordAccount,
  createTenantAccount,
  createUtilityBill,
  ensureUploadsDir,
  findLandlord,
  findTenant,
  findUserByEmail,
  getPlatformPaymentSettings,
  getPublicPaymentOptions,
  getStore,
  listLandlordsPublic,
  payRentInstallment,
  payUtilityBill,
  persist,
  resetStore,
  runCreditCheck,
  submitRentalHistory,
  submitTenantProperty,
  updatePlatformPaymentSettings,
  validateCreditCardInput,
  UPLOADS_DIR,
} from "./store.js";
import type { PaymentMethodType, UserRole } from "./types.js";

const router = Router();

ensureUploadsDir();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadsDir();
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuid()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const store = getStore();
  const userId = store.sessions[token];
  if (!userId) return null;
  return store.users.find((u) => u.id === userId) ?? null;
}

type AuthResult =
  | { user: NonNullable<ReturnType<typeof getSessionUser>> }
  | { error: string; status: number };

function requireAuth(
  req: { headers: { authorization?: string } },
  roles?: UserRole[],
): AuthResult {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = getSessionUser(token);
  if (!user) return { error: "Unauthorized", status: 401 };
  if (roles && !roles.includes(user.role)) return { error: "Forbidden", status: 403 };
  return { user };
}

function tenantFees(tenant: {
  riskTier: import("./types.js").RiskTier | null;
  splitCount: 2 | 4;
  creditCheckComplete: boolean;
}) {
  return tenantPaymentFees(tenant);
}

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "the-unleashed-api", mode: "demo" });
});

router.get("/public/payment-options", (_req, res) => {
  res.json(getPublicPaymentOptions());
});

router.get("/public/admin/payment-settings", (_req, res) => {
  res.json({ settings: getPlatformPaymentSettings() });
});

router.put("/public/admin/payment-settings", (req, res) => {
  try {
    const body = req.body as {
      businessName?: string;
      bankName?: string;
      accountHolderName?: string;
      routingNumber?: string;
      accountNumber?: string;
      cashAppCashtag?: string;
      creditCardEnabled?: boolean;
      cashAppEnabled?: boolean;
    };
    const settings = updatePlatformPaymentSettings(body);
    res.json({ ok: true, settings, message: "Payment receiving settings saved." });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed to save settings" });
  }
});

router.get("/public/landlords", (_req, res) => {
  res.json({ landlords: listLandlordsPublic() });
});

router.post("/auth/register-landlord", (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  try {
    const { user } = createLandlordAccount({ name: name ?? "", email: email ?? "" });
    const token = uuid();
    const store = getStore();
    store.sessions[token] = user.id;
    persist();
    res.json({ token, user });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Registration failed" });
  }
});

router.post("/auth/register-tenant", (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  try {
    const { user } = createTenantAccount({ name: name ?? "", email: email ?? "" });
    const token = uuid();
    const store = getStore();
    store.sessions[token] = user.id;
    persist();
    res.json({ token, user });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Registration failed" });
  }
});

router.post("/auth/demo-login", (req, res) => {
  const { email, role } = req.body as { email?: string; role?: UserRole };
  const store = getStore();

  let user = email ? findUserByEmail(email) : undefined;
  if (!user && role) {
    user = store.users.find((u) => u.role === role);
  }
  if (!user) {
    res.status(404).json({ error: "Demo user not found" });
    return;
  }

  const token = uuid();
  store.sessions[token] = user.id;
  persist();
  addActivity(`${user.name} signed in (${user.role}).`, user.role);

  res.json({ token, user });
});

router.post("/auth/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    const store = getStore();
    delete store.sessions[token];
    persist();
  }
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const auth = requireAuth(req);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }
  res.json({ user: auth.user });
});

router.get("/tenant/onboarding", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const store = getStore();
  const tenant = store.tenants.find((t) => t.id === auth.user.tenantId);
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  const creditCheck = store.creditChecks.find((c) => c.tenantId === tenant.id) ?? null;
  const rentalHistory = store.rentalHistory.find((r) => r.tenantId === tenant.id) ?? null;
  const landlord = tenant.landlordId ? findLandlord(tenant.landlordId) : null;

  res.json({
    tenant,
    landlord,
    creditCheck,
    rentalHistory,
    landlords: listLandlordsPublic(),
    creditCheckFee: SOFT_CREDIT_CHECK_FEE,
    steps: {
      property: tenant.propertySetupComplete,
      creditCheck: tenant.creditCheckComplete,
      rentalHistory: tenant.rentalHistoryComplete,
      complete: tenant.onboardingComplete,
    },
  });
});

router.post("/tenant/property", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { landlordId, unit, propertyAddress, monthlyRent } = req.body as {
    landlordId?: string;
    unit?: string;
    propertyAddress?: string;
    monthlyRent?: number;
  };

  try {
    const result = submitTenantProperty(auth.user.tenantId!, {
      landlordId: landlordId ?? "",
      unit: unit ?? "",
      propertyAddress: propertyAddress ?? "",
      monthlyRent: Number(monthlyRent),
    });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Property setup failed" });
  }
});

router.post("/tenant/credit-check", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { fullLegalName, dateOfBirth, ssnLast4, annualIncome } = req.body as {
    fullLegalName?: string;
    dateOfBirth?: string;
    ssnLast4?: string;
    annualIncome?: number;
  };

  if (!fullLegalName || !dateOfBirth || !ssnLast4 || !annualIncome) {
    res.status(400).json({ error: "All credit check fields are required" });
    return;
  }
  if (!/^\d{4}$/.test(ssnLast4)) {
    res.status(400).json({ error: "SSN last 4 must be exactly 4 digits" });
    return;
  }

  try {
    const result = runCreditCheck(auth.user.tenantId!, {
      fullLegalName,
      dateOfBirth,
      ssnLast4,
      annualIncome: Number(annualIncome),
    });
    res.json({
      ...result,
      message: `Soft credit check complete ($${SOFT_CREDIT_CHECK_FEE} fee). ${riskTierLabel(result.check.riskTier)} — rent split into ${result.tenant.splitCount} payments.`,
    });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Credit check failed" });
  }
});

router.post("/tenant/rental-history", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const {
    previousAddress,
    landlordName,
    landlordPhone,
    landlordEmail,
    monthlyRent,
    moveInDate,
    moveOutDate,
    reasonForLeaving,
  } = req.body as {
    previousAddress?: string;
    landlordName?: string;
    landlordPhone?: string;
    landlordEmail?: string;
    monthlyRent?: number;
    moveInDate?: string;
    moveOutDate?: string;
    reasonForLeaving?: string;
  };

  if (
    !previousAddress ||
    !landlordName ||
    !landlordPhone ||
    !landlordEmail ||
    !monthlyRent ||
    !moveInDate ||
    !moveOutDate ||
    !reasonForLeaving
  ) {
    res.status(400).json({ error: "All rental history fields are required" });
    return;
  }

  try {
    const result = submitRentalHistory(auth.user.tenantId!, {
      previousAddress,
      landlordName,
      landlordPhone,
      landlordEmail,
      monthlyRent: Number(monthlyRent),
      moveInDate,
      moveOutDate,
      reasonForLeaving,
    });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Submission failed" });
  }
});

router.get("/tenant/dashboard", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const store = getStore();
  const tenant = store.tenants.find((t) => t.id === auth.user.tenantId);
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  if (!tenant.onboardingComplete) {
    res.status(403).json({ error: "Onboarding incomplete", onboardingRequired: true });
    return;
  }

  const landlord = findLandlord(tenant.landlordId);
  const payments = store.payments.filter((p) => p.tenantId === tenant.id);
  const fees = tenantFees(tenant);
  const creditCheck = store.creditChecks.find((c) => c.tenantId === tenant.id) ?? null;
  const utilityBills = store.utilityBills.filter((b) => b.tenantId === tenant.id);

  res.json({
    tenant,
    landlord,
    payments,
    fees,
    creditCheck,
    utilityBills,
    summary: {
      monthlyRent: tenant.monthlyRent,
      splitCount: tenant.splitCount,
      riskTier: tenant.riskTier,
      creditScore: tenant.creditScore,
      landlordPaidOnDueDate: payments.some((p) => p.installment === 1 && p.status === "paid"),
      nextPayment: payments.find((p) => p.status === "scheduled") ?? null,
    },
  });
});

router.post("/tenant/payments/:id/pay", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { method, cardNumber, expiry, cvc, nameOnCard } = req.body as {
    method?: PaymentMethodType;
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
    nameOnCard?: string;
  };

  if (method !== "credit_card" && method !== "cash_app") {
    res.status(400).json({ error: "Choose credit card or Cash App to pay." });
    return;
  }

  try {
    let reference = "";
    if (method === "credit_card") {
      ({ reference } = validateCreditCardInput({ cardNumber, expiry, cvc, nameOnCard }));
    } else {
      const options = getPublicPaymentOptions();
      reference = options.cashAppCashtag;
    }

    const payment = payRentInstallment(auth.user.tenantId!, req.params.id, method, reference);
    const methodLabel = method === "credit_card" ? "Credit card" : "Cash App";
    res.json({ ok: true, payment, message: `${methodLabel} payment processing…` });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Payment failed" });
  }
});

router.get("/tenant/utility-bills", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const store = getStore();
  const bills = store.utilityBills.filter((b) => b.tenantId === auth.user.tenantId);
  res.json({ bills });
});

router.post("/tenant/utility-bills", upload.single("billFile"), (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { provider, amount, dueDate } = req.body as {
    provider?: string;
    amount?: string;
    dueDate?: string;
  };

  if (!provider || !amount || !dueDate) {
    res.status(400).json({ error: "Provider, amount, and due date are required" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "Bill file upload is required" });
    return;
  }

  try {
    const bill = createUtilityBill(auth.user.tenantId!, {
      provider,
      amount: Number(amount),
      dueDate,
      fileName: req.file.originalname,
      filePath: req.file.filename,
    });
    res.json({ bill, message: "Utility bill uploaded successfully." });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: e instanceof Error ? e.message : "Upload failed" });
  }
});

router.post("/tenant/utility-bills/:id/pay", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { method, cardNumber, expiry, cvc, nameOnCard } = req.body as {
    method?: PaymentMethodType;
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
    nameOnCard?: string;
  };

  if (method !== "credit_card" && method !== "cash_app") {
    res.status(400).json({ error: "Choose credit card or Cash App to pay." });
    return;
  }

  try {
    let reference = "";
    if (method === "credit_card") {
      ({ reference } = validateCreditCardInput({ cardNumber, expiry, cvc, nameOnCard }));
    } else {
      const options = getPublicPaymentOptions();
      reference = options.cashAppCashtag;
    }

    const bill = payUtilityBill(auth.user.tenantId!, req.params.id, method, reference);
    const methodLabel = method === "credit_card" ? "Credit card" : "Cash App";
    res.json({ ok: true, bill, message: `${methodLabel} payment processing…` });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Payment failed" });
  }
});

router.get("/landlord/dashboard", (req, res) => {
  const auth = requireAuth(req, ["landlord"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const store = getStore();
  const landlord = store.landlords.find((l) => l.id === auth.user.landlordId);
  if (!landlord) {
    res.status(404).json({ error: "Landlord not found" });
    return;
  }

  const tenants = store.tenants.filter((t) => t.landlordId === landlord.id);
  const payouts = store.payouts.filter((p) => p.landlordId === landlord.id);
  const fees = landlordPortfolioFees(tenants);
  const tenantsWithFees = tenants.map((t) => ({
    ...t,
    fees: landlordTenantFees(t),
  }));

  res.json({
    landlord,
    tenants: tenantsWithFees,
    payouts,
    fees,
    stats: {
      enrolledTenants: tenants.filter((t) => t.enrolled).length,
      pendingOnboarding: tenants.filter((t) => !t.onboardingComplete).length,
      totalMonthlyRent: tenants.filter((t) => t.enrolled).reduce((sum, t) => sum + t.monthlyRent, 0),
      onTimePayoutRate: payouts.length
        ? Math.round(
            (payouts.filter((p) => p.status === "completed").length / payouts.length) * 100,
          )
        : 100,
    },
  });
});

router.get("/admin/overview", (req, res) => {
  const auth = requireAuth(req, ["admin"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const store = getStore();
  const paidPayments = store.payments.filter((p) => p.status === "paid");
  const scheduledPayments = store.payments.filter((p) => p.status === "scheduled");
  const paidBills = store.utilityBills.filter((b) => b.status === "paid");

  res.json({
    stats: {
      tenants: store.tenants.length,
      landlords: store.landlords.length,
      enrolledTenants: store.tenants.filter((t) => t.enrolled).length,
      paymentsCompleted: paidPayments.length,
      paymentsScheduled: scheduledPayments.length,
      utilityBillsPaid: paidBills.length,
      volumeProcessed:
        paidPayments.reduce((sum, p) => sum + p.amount, 0) +
        paidBills.reduce((sum, b) => sum + b.amount, 0),
    },
    users: store.users,
    tenants: store.tenants,
    activity: store.activity.slice(0, 20),
  });
});

router.post("/admin/reset-demo", (req, res) => {
  const auth = requireAuth(req, ["admin"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }
  resetStore();
  addActivity("Demo data reset by admin.", "admin");
  res.json({ ok: true, message: "Demo data reset to defaults." });
});

export default router;
