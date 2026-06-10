const TOKEN_KEY = "unleashed_demo_token";

export type UserRole = "tenant" | "landlord" | "admin";
export type RiskTier = "low" | "medium" | "high";
export type PaymentMethodType = "credit_card" | "cash_app";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
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
  listLandlords() {
    return request<{ landlords: Array<{ id: string; name: string }> }>("/api/public/landlords");
  },
  paymentOptions() {
    return request<PublicPaymentOptions>("/api/public/payment-options");
  },
  adminPaymentSettings() {
    return request<{ settings: PlatformPaymentSettings }>("/api/public/admin/payment-settings");
  },
  saveAdminPaymentSettings(settings: PlatformPaymentSettings) {
    return request<{ ok: boolean; settings: PlatformPaymentSettings; message: string }>(
      "/api/public/admin/payment-settings",
      { method: "PUT", body: JSON.stringify(settings) },
    );
  },
  registerLandlord(name: string, email: string) {
    return request<{ token: string; user: User }>("/api/auth/register-landlord", {
      method: "POST",
      body: JSON.stringify({ name, email }),
    });
  },
  registerTenant(input: { name: string; email: string }) {
    return request<{ token: string; user: User }>("/api/auth/register-tenant", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  logout() {
    return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  },
  me() {
    return request<{ user: User }>("/api/me");
  },
  tenantOnboarding() {
    return request<TenantOnboarding>("/api/tenant/onboarding");
  },
  submitTenantProperty(input: {
    landlordId: string;
    unit: string;
    propertyAddress: string;
    monthlyRent: number;
  }) {
    return request<{ tenant: TenantProfile; landlord: { id: string; name: string } | null }>(
      "/api/tenant/property",
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  submitCreditCheck(input: {
    fullLegalName: string;
    dateOfBirth: string;
    ssnLast4: string;
    annualIncome: number;
  }) {
    return request<{ message: string; tenant: TenantProfile; check: CreditCheckResult }>(
      "/api/tenant/credit-check",
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  submitRentalHistory(input: RentalHistoryInput) {
    return request<{ tenant: TenantProfile; entry: RentalHistoryEntry }>("/api/tenant/rental-history", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  tenantDashboard() {
    return request<TenantDashboard>("/api/tenant/dashboard");
  },
  payInstallment(
    paymentId: string,
    payload: {
      method: PaymentMethodType;
      cardNumber?: string;
      expiry?: string;
      cvc?: string;
      nameOnCard?: string;
    },
  ) {
    return request<{ ok: boolean; message: string }>(`/api/tenant/payments/${paymentId}/pay`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  uploadUtilityBill(formData: FormData) {
    return request<{ bill: UtilityBill; message: string }>("/api/tenant/utility-bills", {
      method: "POST",
      body: formData,
    });
  },
  payUtilityBill(
    billId: string,
    payload: {
      method: PaymentMethodType;
      cardNumber?: string;
      expiry?: string;
      cvc?: string;
      nameOnCard?: string;
    },
  ) {
    return request<{ ok: boolean; message: string }>(`/api/tenant/utility-bills/${billId}/pay`, {
      method: "POST",
      body: JSON.stringify(payload),
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

export interface TenantProfile {
  name: string;
  unit: string;
  propertyAddress: string;
  monthlyRent: number;
  rentDueDay: number;
  bankLast4: string;
  creditLimit: number;
  enrolled: boolean;
  riskTier: RiskTier | null;
  creditScore: number | null;
  splitCount: 2 | 4;
  propertySetupComplete: boolean;
  creditCheckComplete: boolean;
  rentalHistoryComplete: boolean;
  onboardingComplete: boolean;
}

export interface CreditCheckResult {
  score: number;
  riskTier: RiskTier;
  fee: number;
  checkedAt: string;
}

export interface RentalHistoryInput {
  previousAddress: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  monthlyRent: number;
  moveInDate: string;
  moveOutDate: string;
  reasonForLeaving: string;
}

export interface RentalHistoryEntry extends RentalHistoryInput {
  id: string;
  tenantId: string;
  submittedAt: string;
}

export interface TenantOnboarding {
  tenant: TenantProfile;
  landlord: { id: string; name: string } | null | undefined;
  creditCheck: CreditCheckResult | null;
  rentalHistory: RentalHistoryEntry | null;
  landlords: Array<{ id: string; name: string }>;
  creditCheckFee: number;
  steps: {
    property: boolean;
    creditCheck: boolean;
    rentalHistory: boolean;
    complete: boolean;
  };
}

export interface UtilityBill {
  id: string;
  provider: string;
  amount: number;
  dueDate: string;
  fileName: string;
  status: string;
  paidAt: string | null;
  submittedAt: string;
}

export interface TenantDashboard {
  tenant: TenantProfile;
  landlord: { name: string } | undefined;
  payments: Array<{
    id: string;
    label: string;
    amount: number;
    dueDate: string;
    status: string;
    installment: number;
  }>;
  fees: {
    creditCheckFee: number;
    perPayment: number;
    paymentCount: number;
    monthlyPaymentFees: number;
    total: number;
  };
  creditCheck: CreditCheckResult | null;
  utilityBills: UtilityBill[];
  summary: {
    monthlyRent: number;
    splitCount: 2 | 4;
    riskTier: RiskTier | null;
    creditScore: number | null;
    landlordPaidOnDueDate: boolean;
    nextPayment: { id: string; label: string; amount: number; dueDate: string } | null;
  };
}

export interface LandlordDashboard {
  landlord: { name: string; payoutAccountLast4: string };
  fees: { perPayment: number; totalPayments: number; monthlyTotal: number };
  tenants: Array<{
    name: string;
    unit: string;
    monthlyRent: number;
    enrolled: boolean;
    riskTier: RiskTier | null;
    splitCount: 2 | 4;
    creditScore: number | null;
    onboardingComplete: boolean;
    fees: { perPayment: number; paymentCount: number; total: number };
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
    pendingOnboarding: number;
    totalMonthlyRent: number;
    onTimePayoutRate: number;
  };
}

export interface PublicPaymentOptions {
  creditCardEnabled: boolean;
  cashAppEnabled: boolean;
  cashAppCashtag: string;
  businessName: string;
  configured: boolean;
}

export interface PlatformPaymentSettings {
  businessName: string;
  bankName: string;
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  cashAppCashtag: string;
  creditCardEnabled: boolean;
  cashAppEnabled: boolean;
  configuredAt: string | null;
}

export interface AdminOverview {
  stats: {
    tenants: number;
    landlords: number;
    enrolledTenants: number;
    paymentsCompleted: number;
    paymentsScheduled: number;
    utilityBillsPaid: number;
    volumeProcessed: number;
  };
  activity: Array<{ at: string; message: string; role?: string }>;
}
