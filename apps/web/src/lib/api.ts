const TOKEN_KEY = "flex_demo_token";

export type UserRole = "tenant" | "landlord" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = {
  demoLogin(role: UserRole, email?: string) {
    return request<{ token: string; user: User }>("/api/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ role, email }),
    });
  },
  logout() {
    return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  },
  me() {
    return request<{ user: User }>("/api/me");
  },
  tenantDashboard() {
    return request<TenantDashboard>("/api/tenant/dashboard");
  },
  updateSchedule(secondPaymentDay: number) {
    return request<{ ok: boolean }>("/api/tenant/schedule", {
      method: "PATCH",
      body: JSON.stringify({ secondPaymentDay }),
    });
  },
  payInstallment(paymentId: string) {
    return request<{ ok: boolean; message: string }>(`/api/tenant/payments/${paymentId}/pay`, {
      method: "POST",
    });
  },
  landlordDashboard() {
    return request<LandlordDashboard>("/api/landlord/dashboard");
  },
  adminOverview() {
    return request<AdminOverview>("/api/admin/overview");
  },
  resetDemo() {
    return request<{ ok: boolean; message: string }>("/api/admin/reset-demo", {
      method: "POST",
    });
  },
};

export interface TenantDashboard {
  tenant: {
    name: string;
    unit: string;
    monthlyRent: number;
    rentDueDay: number;
    secondPaymentDay: number | null;
    bankLast4: string;
    creditLimit: number;
  };
  landlord: { name: string } | undefined;
  payments: Array<{
    id: string;
    label: string;
    amount: number;
    dueDate: string;
    status: string;
    installment: number;
  }>;
  fees: { membershipFee: number; billFee: number; total: number };
  summary: {
    monthlyRent: number;
    splitCount: number;
    landlordPaidOnDueDate: boolean;
    nextPayment: { id: string; label: string; amount: number; dueDate: string } | null;
  };
}

export interface LandlordDashboard {
  landlord: { name: string; payoutAccountLast4: string };
  tenants: Array<{
    name: string;
    unit: string;
    monthlyRent: number;
    enrolled: boolean;
    secondPaymentDay: number | null;
  }>;
  payouts: Array<{
    tenantName: string;
    unit: string;
    amount: number;
    paidOn: string;
    status: string;
  }>;
  stats: {
    enrolledTenants: number;
    totalMonthlyRent: number;
    onTimePayoutRate: number;
  };
}

export interface AdminOverview {
  stats: {
    tenants: number;
    landlords: number;
    enrolledTenants: number;
    paymentsCompleted: number;
    paymentsScheduled: number;
    volumeProcessed: number;
  };
  activity: Array<{ at: string; message: string; role?: string }>;
}
