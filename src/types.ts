/**
 * KSA Accounting & ERP Software - TypeScript Types
 */

export interface CompanyProfile {
  id: string;
  nameEn: string;
  nameAr: string;
  crNumber: string;
  vatNumber: string;
  buildingNo: string;
  additionalNo: string;
  street: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  bankName: string;
  bankIban: string;
  bankAccountNo: string;
  logoUrl?: string;
  showLogo?: boolean;
  showBankDetails?: boolean;
  invoiceFooterEn: string;
  invoiceFooterAr: string;
  invoiceTemplate: 'professional' | 'corporate' | 'minimal' | 'modern' | 'luxury';
  qrPosition: 'top-right' | 'bottom-right' | 'bottom-left' | 'footer';
  logoPosition: 'left' | 'center' | 'right';
  showStamp: boolean;
  showSignature: boolean;
  currency: string;
  invoicePrefix?: string;
}

export interface Customer {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  vatNumber?: string;
  crNumber?: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  paymentTerms: string;
  openingBalance: number;
  balance: number;
}

export interface Supplier {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  vatNumber?: string;
  phone: string;
  email: string;
  address: string;
  openingBalance: number;
  balance: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  nameEn: string;
  nameAr: string;
  brand: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  vatPercentage: number; // usually 15, or 0, or exempt (0)
  minStock: number;
  maxStock: number;
  stockLevel: number; // overall
  warehouseStock: { [warehouseId: string]: number };
}

export interface Warehouse {
  id: string;
  nameEn: string;
  nameAr: string;
  location: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  qty: number;
  unitPrice: number;
  vatPercentage: number;
  vatAmount: number;
  subtotal: number; // qty * unitPrice
  total: number; // subtotal + vatAmount
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'Standard' | 'Simplified' | 'POS';
  date: string;
  dueDate?: string;
  customerId: string;
  customerNameEn: string;
  customerNameAr: string;
  customerVat?: string;
  paymentMethod: 'Cash' | 'Credit' | 'Bank Transfer' | 'Mada' | 'Visa' | 'Mastercard';
  paymentTerms?: string;
  warehouseId: string;
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  uuid: string; // ZATCA Cryptographic requirement
  invoiceCounter: number; // ICV
  invoiceHash: string;
  isReturned: boolean;
  returnReason?: string;
  notes?: string;
  termsEn?: string;
  termsAr?: string;
  timestamp?: string;
  qrCodeTlv?: string;
  companyDetails?: CompanyProfile;
  companyId?: string;
  companyNameEn?: string;
  companyNameAr?: string;
}

export interface ReservedInvoiceNumber {
  id: string;
  companyId: string;
  invoiceNumber: string;
  createdAt: string;
  createdByUserId: string;
}

export interface ChartOfAccount {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  subType: string;
  balance: number;
  isSystem: boolean;
}

export interface JournalLine {
  accountId: string;
  accountNameEn: string;
  accountNameAr: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  isSystem: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vatPercentage: number;
  vatAmount: number;
  total: number;
  paymentMethod: 'Petty Cash' | 'Bank' | 'Credit Card';
  referenceNo?: string;
  status: 'Approved' | 'Pending';
  attachmentUrl?: string;
}

export interface StockAdjustment {
  id: string;
  date: string;
  productId: string;
  productNameEn: string;
  productSku: string;
  warehouseId: string;
  adjustmentType: 'Addition' | 'Reduction';
  qty: number;
  reason: string;
  referenceNo?: string;
}

export interface StockTransfer {
  id: string;
  date: string;
  productId: string;
  productNameEn: string;
  productSku: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  qty: number;
  referenceNo?: string;
  status: 'Completed' | 'Pending';
}

export interface ZatcaValidationRule {
  id: string;
  nameEn: string;
  nameAr: string;
  status: 'passed' | 'failed' | 'warning';
  messageEn: string;
  messageAr: string;
}

export interface ZatcaValidationResult {
  isCompliant: boolean;
  score: number;
  rules: ZatcaValidationRule[];
}

export interface Voucher {
  id: string;
  voucherNo: string;
  type: 'CashReceipt' | 'CashPayment' | 'BankReceipt' | 'BankPayment';
  date: string;
  amount: number;
  description: string;
  contactId?: string; // customer or supplier ID
  contactType?: 'Customer' | 'Supplier';
  referenceNo?: string;
  debitAccountId: string;
  creditAccountId: string;
}

export interface BankReconciliation {
  id: string;
  statementDate: string;
  bankStatementBalance: number;
  reconciledTxIds: string[]; // transaction / journal line or journal entry IDs
  isCompleted: boolean;
}

export type Permission =
  | 'dashboard.view'
  | 'sales.view'
  | 'sales.create'
  | 'sales.return'
  | 'sales.reserved.view'
  | 'expenses.view'
  | 'expenses.create'
  | 'inventory.view'
  | 'inventory.manage'
  | 'contacts.view'
  | 'contacts.manage'
  | 'accounting.view'
  | 'accounting.manage'
  | 'vat.view'
  | 'company.settings'
  | 'dataReset.execute'
  | 'platform.dashboard'
  | 'platform.users'
  | 'platform.roles'
  | 'platform.app_settings'
  | 'platform.features'
  | 'platform.data_reset'
  | 'platform.schema';

export type BuiltInModuleKey =
  | 'dashboard'
  | 'sales'
  | 'expenses'
  | 'inventory'
  | 'contacts'
  | 'accounting'
  | 'vat'
  | 'companySettings';

export type MenuId =
  | 'dashboard'
  | 'sales'
  | 'expenses'
  | 'inventory'
  | 'contacts'
  | 'accounting'
  | 'vat'
  | 'settings'
  | 'platform'
  | 'platform-users'
  | 'platform-roles'
  | 'platform-settings'
  | 'platform-features'
  | 'platform-data-reset'
  | 'platform-schema'
  | 'data-reset'
  | string;

export type DataResetTargetId =
  | 'companies'
  | 'customers'
  | 'suppliers'
  | 'products'
  | 'warehouses'
  | 'invoices'
  | 'expenses'
  | 'accounts'
  | 'journalEntries'
  | 'vouchers'
  | 'bankReconciliations';

export interface DataResetTargetConfig {
  enabled: boolean;
  defaultChecked: boolean;
}

export interface Role {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  permissions: Permission[];
  isSystem: boolean;
  isLocked: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/** Legacy localStorage user shape used only by the one-time browser importer. */
export interface StoredUser extends AuthUser {
  passwordHash?: string;
}

export interface AppSettings {
  appNameEn: string;
  appNameAr: string;
  defaultLanguage: 'en' | 'ar';
  defaultTheme: 'green' | 'gold' | 'dark' | 'teal';
  allowRememberMe: boolean;
  requireStrongPassword: boolean;
  minPasswordLength: number;
  sessionTimeoutMinutes: number;
  maxCompanyProfiles: number;
  modules: Record<BuiltInModuleKey, boolean>;
  dataReset: Record<DataResetTargetId, DataResetTargetConfig>;
}

export interface CustomAppFeature {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  enabled: boolean;
  createdAt: string;
}


