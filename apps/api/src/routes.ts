import { Router } from "express";
import { v4 as uuid } from "uuid";
import {
  addActivity,
  findLandlord,
  findTenant,
  findUserByEmail,
  getStore,
  persist,
  resetStore,
} from "./store.js";
import type { UserRole } from "./types.js";

const router = Router();

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

function tenantFees(tenant: { monthlyRent: number; membershipFee: number; billFeePercent: number }) {
  const billFee = Math.round(tenant.monthlyRent * (tenant.billFeePercent / 100) * 100) / 100;
  return {
    membershipFee: tenant.membershipFee,
    billFee,
    total: Math.round((tenant.membershipFee + billFee) * 100) / 100,
  };
}

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "flex-rent-api", mode: "demo" });
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

  const landlord = findLandlord(tenant.landlordId);
  const payments = store.payments.filter((p) => p.tenantId === tenant.id);
  const fees = tenantFees(tenant);

  res.json({
    tenant,
    landlord,
    payments,
    fees,
    summary: {
      monthlyRent: tenant.monthlyRent,
      splitCount: 2,
      landlordPaidOnDueDate: payments.some((p) => p.installment === 1 && p.status === "paid"),
      nextPayment: payments.find((p) => p.status === "scheduled") ?? null,
    },
  });
});

router.patch("/tenant/schedule", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { secondPaymentDay } = req.body as { secondPaymentDay?: number };
  if (!secondPaymentDay || secondPaymentDay < 2 || secondPaymentDay > 28) {
    res.status(400).json({ error: "secondPaymentDay must be between 2 and 28" });
    return;
  }

  const store = getStore();
  const tenant = store.tenants.find((t) => t.id === auth.user.tenantId);
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  tenant.secondPaymentDay = secondPaymentDay;
  const now = new Date();
  const secondDue = new Date(now.getFullYear(), now.getMonth(), secondPaymentDay)
    .toISOString()
    .slice(0, 10);

  const second = store.payments.find((p) => p.tenantId === tenant.id && p.installment === 2);
  if (second) second.dueDate = secondDue;

  addActivity(
    `${tenant.name} rescheduled 2nd payment to the ${secondPaymentDay}th.`,
    "tenant",
  );
  persist();

  res.json({ ok: true, tenant, payments: store.payments.filter((p) => p.tenantId === tenant.id) });
});

router.post("/tenant/payments/:id/pay", (req, res) => {
  const auth = requireAuth(req, ["tenant"]);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const store = getStore();
  const payment = store.payments.find(
    (p) => p.id === req.params.id && p.tenantId === auth.user.tenantId,
  );
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  if (payment.status === "paid") {
    res.status(400).json({ error: "Payment already completed" });
    return;
  }

  payment.status = "processing";
  persist();

  setTimeout(() => {
    const s = getStore();
    const p = s.payments.find((x) => x.id === payment.id);
    if (!p) return;
    p.status = "paid";
    p.paidAt = new Date().toISOString();

    const tenant = findTenant(p.tenantId);
    if (p.installment === 1 && tenant) {
      const payout = s.payouts.find(
        (x) => x.tenantId === tenant.id && x.status === "pending",
      );
      if (payout) payout.status = "completed";
      addActivity(
        `Flex paid ${tenant.landlordId ? findLandlord(tenant.landlordId)?.name : "landlord"} $${tenant.monthlyRent} in full for ${tenant.name}.`,
        "tenant",
      );
    }

    addActivity(
      `${tenant?.name ?? "Tenant"} paid ${p.label} ($${p.amount}).`,
      "tenant",
    );
    persist();
  }, 1200);

  res.json({ ok: true, payment, message: "Processing demo payment…" });
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

  res.json({
    landlord,
    tenants,
    payouts,
    stats: {
      enrolledTenants: tenants.filter((t) => t.enrolled).length,
      totalMonthlyRent: tenants.reduce((sum, t) => sum + t.monthlyRent, 0),
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

  res.json({
    stats: {
      tenants: store.tenants.length,
      landlords: store.landlords.length,
      enrolledTenants: store.tenants.filter((t) => t.enrolled).length,
      paymentsCompleted: paidPayments.length,
      paymentsScheduled: scheduledPayments.length,
      volumeProcessed: paidPayments.reduce((sum, p) => sum + p.amount, 0),
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
