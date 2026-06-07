export type UserRole = "tenant" | "landlord" | "admin";

export type PaymentStatus = "scheduled" | "paid" | "failed" | "processing";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  landlordId?: string;
  tenantId?: string;
}

export interface Landlord {
  id: string;
  name: string;
  email: string;
  payoutAccountLast4: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  landlordId: string;
  unit: string;
  monthlyRent: number;
  rentDueDay: number;
  bankLast4: string;
  membershipFee: number;
  billFeePercent: number;
  secondPaymentDay: number | null;
  creditLimit: number;
  enrolled: boolean;
}

export interface Payment {
  id: string;
  tenantId: string;
  label: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt: string | null;
  installment: 1 | 2;
}

export interface LandlordPayout {
  id: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  unit: string;
  amount: number;
  paidOn: string;
  status: "completed" | "pending";
}

export interface Activity {
  id: string;
  at: string;
  message: string;
  role?: UserRole;
}

export interface Store {
  users: User[];
  landlords: Landlord[];
  tenants: Tenant[];
  payments: Payment[];
  payouts: LandlordPayout[];
  activity: Activity[];
  sessions: Record<string, string>;
}
