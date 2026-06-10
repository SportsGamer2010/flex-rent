export type UserRole = "tenant" | "landlord" | "admin";

export type PaymentStatus = "scheduled" | "paid" | "failed" | "processing";

export type PaymentMethodType = "credit_card" | "cash_app";

export type RiskTier = "low" | "medium" | "high";

export type UtilityBillStatus = "pending" | "paid" | "processing";

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
  propertyAddress: string;
  monthlyRent: number;
  rentDueDay: number;
  bankLast4: string;
  membershipFee: number;
  billFeePercent: number;
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

export interface CreditCheck {
  tenantId: string;
  fullLegalName: string;
  dateOfBirth: string;
  ssnLast4: string;
  annualIncome: number;
  score: number;
  riskTier: RiskTier;
  fee: number;
  checkedAt: string;
}

export interface RentalHistoryEntry {
  id: string;
  tenantId: string;
  previousAddress: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  monthlyRent: number;
  moveInDate: string;
  moveOutDate: string;
  reasonForLeaving: string;
  submittedAt: string;
}

export interface UtilityBill {
  id: string;
  tenantId: string;
  provider: string;
  amount: number;
  dueDate: string;
  fileName: string;
  filePath: string;
  status: UtilityBillStatus;
  paidAt: string | null;
  submittedAt: string;
  paymentMethod: PaymentMethodType | null;
  paymentReference: string | null;
}

export interface Payment {
  id: string;
  tenantId: string;
  label: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt: string | null;
  installment: 1 | 2 | 3 | 4;
  paymentMethod: PaymentMethodType | null;
  paymentReference: string | null;
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
  creditChecks: CreditCheck[];
  rentalHistory: RentalHistoryEntry[];
  utilityBills: UtilityBill[];
  activity: Activity[];
  sessions: Record<string, string>;
  platformPaymentSettings: PlatformPaymentSettings;
}
