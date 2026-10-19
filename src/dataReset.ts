import { Dispatch, SetStateAction } from 'react';
import {
  BankReconciliation,
  ChartOfAccount,
  CompanyProfile,
  Customer,
  DataResetTargetConfig,
  DataResetTargetId,
  Expense,
  Invoice,
  JournalEntry,
  Product,
  ReservedInvoiceNumber,
  Supplier,
  Voucher,
  Warehouse,
} from './types';
import { initialCompanies } from './utils';

export interface DataResetTargetMeta {
  id: DataResetTargetId;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export const DATA_RESET_TARGETS: DataResetTargetMeta[] = [
  {
    id: 'companies',
    nameEn: 'Companies',
    nameAr: 'المنشآت',
    descriptionEn: 'Restores the default company profiles. The app always keeps at least one company.',
    descriptionAr: 'يعيد ملفات المنشآت الافتراضية. يبقى ملف منشأة واحد على الأقل.',
  },
  {
    id: 'customers',
    nameEn: 'Customers',
    nameAr: 'العملاء',
    descriptionEn: 'Deletes the customer directory.',
    descriptionAr: 'يحذف دليل العملاء.',
  },
  {
    id: 'suppliers',
    nameEn: 'Suppliers',
    nameAr: 'الموردون',
    descriptionEn: 'Deletes the supplier directory.',
    descriptionAr: 'يحذف دليل الموردين.',
  },
  {
    id: 'products',
    nameEn: 'Products',
    nameAr: 'المنتجات',
    descriptionEn: 'Deletes products and stock levels.',
    descriptionAr: 'يحذف المنتجات ومستويات المخزون.',
  },
  {
    id: 'warehouses',
    nameEn: 'Warehouses',
    nameAr: 'المستودعات',
    descriptionEn: 'Deletes warehouse records.',
    descriptionAr: 'يحذف سجلات المستودعات.',
  },
  {
    id: 'invoices',
    nameEn: 'Sales invoices',
    nameAr: 'فواتير المبيعات',
    descriptionEn: 'Deletes tax invoices and credit notes.',
    descriptionAr: 'يحذف الفواتير الضريبية وإشعارات الائتمان.',
  },
  {
    id: 'expenses',
    nameEn: 'Expenses',
    nameAr: 'المصروفات',
    descriptionEn: 'Deletes expense records.',
    descriptionAr: 'يحذف سجلات المصروفات.',
  },
  {
    id: 'accounts',
    nameEn: 'Chart of accounts',
    nameAr: 'شجرة الحسابات',
    descriptionEn: 'Keeps all accounts, sets every balance to 0, and clears journal entries.',
    descriptionAr: 'يبقي الحسابات، يصفر كل الأرصدة، ويمسح قيود اليومية.',
  },
  {
    id: 'journalEntries',
    nameEn: 'Journal entries',
    nameAr: 'قيود اليومية',
    descriptionEn: 'Deletes ledger journals and zeros account balances.',
    descriptionAr: 'يحذف قيود دفتر الأستاذ ويصفر أرصدة الحسابات.',
  },
  {
    id: 'vouchers',
    nameEn: 'Vouchers',
    nameAr: 'السندات',
    descriptionEn: 'Deletes payment and receipt vouchers.',
    descriptionAr: 'يحذف سندات القبض والصرف.',
  },
  {
    id: 'bankReconciliations',
    nameEn: 'Bank reconciliations',
    nameAr: 'تسويات البنوك',
    descriptionEn: 'Deletes bank reconciliation records.',
    descriptionAr: 'يحذف سجلات التسوية البنكية.',
  },
];

export const DATA_RESET_TARGET_IDS: DataResetTargetId[] = DATA_RESET_TARGETS.map(t => t.id);

const DEFAULT_CHECKED: DataResetTargetId[] = [
  'invoices',
  'expenses',
  'products',
  'journalEntries',
  'vouchers',
  'bankReconciliations',
];

export function buildInitialDataResetSettings(): Record<DataResetTargetId, DataResetTargetConfig> {
  return Object.fromEntries(
    DATA_RESET_TARGET_IDS.map(id => [
      id,
      { enabled: true, defaultChecked: DEFAULT_CHECKED.includes(id) },
    ])
  ) as Record<DataResetTargetId, DataResetTargetConfig>;
}

export const initialDataResetSettings = buildInitialDataResetSettings();

export function mergeDataResetSettings(
  saved?: Partial<Record<DataResetTargetId, Partial<DataResetTargetConfig>>> | null
): Record<DataResetTargetId, DataResetTargetConfig> {
  const merged = buildInitialDataResetSettings();
  if (!saved) return merged;
  for (const id of DATA_RESET_TARGET_IDS) {
    const row = saved[id];
    if (!row) continue;
    merged[id] = {
      enabled: row.enabled !== false,
      defaultChecked: row.defaultChecked === true,
    };
    if (!merged[id].enabled) merged[id].defaultChecked = false;
  }
  return merged;
}

export function getEnabledTargets(
  config: Record<DataResetTargetId, DataResetTargetConfig>
): DataResetTargetMeta[] {
  return DATA_RESET_TARGETS.filter(target => config[target.id]?.enabled !== false);
}

export function getDefaultCheckedIds(
  config: Record<DataResetTargetId, DataResetTargetConfig>
): DataResetTargetId[] {
  return getEnabledTargets(config)
    .filter(target => config[target.id]?.defaultChecked)
    .map(target => target.id);
}

export interface DataResetRecords {
  companies: CompanyProfile[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  warehouses: Warehouse[];
  invoices: Invoice[];
  expenses: Expense[];
  accounts: ChartOfAccount[];
  journalEntries: JournalEntry[];
  vouchers: Voucher[];
  bankReconciliations: BankReconciliation[];
}

export interface DataResetPreviewRow {
  primary: string;
  secondary: string;
}

export function getDataResetRecordCount(id: DataResetTargetId, records: DataResetRecords): number {
  return records[id].length;
}

function money(amount: number, lang: 'en' | 'ar'): string {
  const value = amount.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return lang === 'ar' ? `${value} ر.س` : `SAR ${value}`;
}

function voucherTypeLabel(type: Voucher['type'], lang: 'en' | 'ar'): string {
  const labels: Record<Voucher['type'], { en: string; ar: string }> = {
    CashReceipt: { en: 'Cash receipt', ar: 'سند قبض نقدي' },
    CashPayment: { en: 'Cash payment', ar: 'سند صرف نقدي' },
    BankReceipt: { en: 'Bank receipt', ar: 'سند قبض بنكي' },
    BankPayment: { en: 'Bank payment', ar: 'سند صرف بنكي' },
  };
  return lang === 'en' ? labels[type].en : labels[type].ar;
}

export function getDataResetPreviewRows(
  id: DataResetTargetId,
  records: DataResetRecords,
  lang: 'en' | 'ar'
): DataResetPreviewRow[] {
  switch (id) {
    case 'companies':
      return records.companies.map(item => ({
        primary: lang === 'en' ? item.nameEn : item.nameAr,
        secondary: `CR ${item.crNumber}`,
      }));
    case 'customers':
      return records.customers.map(item => ({
        primary: lang === 'en' ? item.nameEn : item.nameAr,
        secondary: `${item.code} · ${money(item.balance, lang)}`,
      }));
    case 'suppliers':
      return records.suppliers.map(item => ({
        primary: lang === 'en' ? item.nameEn : item.nameAr,
        secondary: `${item.code} · ${money(item.balance, lang)}`,
      }));
    case 'products':
      return records.products.map(item => ({
        primary: lang === 'en' ? item.nameEn : item.nameAr,
        secondary: `${item.sku} · ${item.stockLevel} ${item.unit}`,
      }));
    case 'warehouses':
      return records.warehouses.map(item => ({
        primary: lang === 'en' ? item.nameEn : item.nameAr,
        secondary: item.location,
      }));
    case 'invoices':
      return records.invoices.map(item => ({
        primary: item.invoiceNumber,
        secondary: `${item.date} · ${lang === 'en' ? item.customerNameEn : item.customerNameAr} · ${money(item.total, lang)}`,
      }));
    case 'expenses':
      return records.expenses.map(item => ({
        primary: item.description || item.category,
        secondary: `${item.date} · ${money(item.total, lang)}`,
      }));
    case 'accounts':
      return records.accounts.map(item => ({
        primary: `${item.code} · ${lang === 'en' ? item.nameEn : item.nameAr}`,
        secondary: `${item.type} · ${money(item.balance, lang)}`,
      }));
    case 'journalEntries':
      return records.journalEntries.map(item => ({
        primary: item.reference,
        secondary: `${item.date} · ${item.description}`,
      }));
    case 'vouchers':
      return records.vouchers.map(item => ({
        primary: item.voucherNo,
        secondary: `${voucherTypeLabel(item.type, lang)} · ${item.date} · ${money(item.amount, lang)}`,
      }));
    case 'bankReconciliations':
      return records.bankReconciliations.map(item => ({
        primary: item.statementDate,
        secondary: `${money(item.bankStatementBalance, lang)} · ${
          item.isCompleted
            ? (lang === 'en' ? 'Completed' : 'مكتملة')
            : (lang === 'en' ? 'Open' : 'مفتوحة')
        }`,
      }));
  }
}

export interface DataResetSetters {
  setCompanies: Dispatch<SetStateAction<CompanyProfile[]>>;
  setCompany: Dispatch<SetStateAction<CompanyProfile>>;
  setCustomers: Dispatch<SetStateAction<Customer[]>>;
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>;
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setWarehouses: Dispatch<SetStateAction<Warehouse[]>>;
  setInvoices: Dispatch<SetStateAction<Invoice[]>>;
  setExpenses: Dispatch<SetStateAction<Expense[]>>;
  setAccounts: Dispatch<SetStateAction<ChartOfAccount[]>>;
  setJournalEntries: Dispatch<SetStateAction<JournalEntry[]>>;
  setVouchers: Dispatch<SetStateAction<Voucher[]>>;
  setBankReconciliations: Dispatch<SetStateAction<BankReconciliation[]>>;
  setReservedInvoices: Dispatch<SetStateAction<ReservedInvoiceNumber[]>>;
}

export type DataResetCurrentState = DataResetRecords & {
  company: CompanyProfile;
  reservedInvoices: ReservedInvoiceNumber[];
};

export type DataResetNextState = DataResetCurrentState;

/** Builds post-reset state without seeding demo COA balances. */
export function buildDataResetNextState(
  selectedIds: DataResetTargetId[],
  current: DataResetCurrentState,
): DataResetNextState {
  const selected = new Set(selectedIds);
  const next: DataResetNextState = {
    companies: current.companies,
    company: current.company,
    customers: current.customers,
    suppliers: current.suppliers,
    products: current.products,
    warehouses: current.warehouses,
    invoices: current.invoices,
    reservedInvoices: current.reservedInvoices,
    expenses: current.expenses,
    accounts: current.accounts,
    journalEntries: current.journalEntries,
    vouchers: current.vouchers,
    bankReconciliations: current.bankReconciliations,
  };

  if (selected.has('companies')) {
    const restored = initialCompanies.map(company => ({ ...company }));
    const active = restored[0];
    if (active) {
      next.companies = restored;
      next.company = { ...active };
    }
  }
  if (selected.has('customers')) next.customers = [];
  if (selected.has('suppliers')) next.suppliers = [];
  if (selected.has('products')) next.products = [];
  if (selected.has('warehouses')) next.warehouses = [];
  if (selected.has('invoices')) {
    next.invoices = [];
    next.reservedInvoices = [];
  }
  if (selected.has('expenses')) next.expenses = [];
  // Keep COA structure; zero balances and clear journals (no seed balances)
  if (selected.has('accounts') || selected.has('journalEntries')) {
    next.accounts = current.accounts.map(account => ({ ...account, balance: 0 }));
    next.journalEntries = [];
  }
  if (selected.has('vouchers')) next.vouchers = [];
  if (selected.has('bankReconciliations')) next.bankReconciliations = [];

  return next;
}

export function dataResetSyncJobs(
  selectedIds: DataResetTargetId[],
  next: DataResetNextState,
): { table: string; rows: Record<string, unknown>[] }[] {
  const selected = new Set(selectedIds);
  const jobs: { table: string; rows: Record<string, unknown>[] }[] = [];

  if (selected.has('companies')) {
    jobs.push({ table: 'companies', rows: next.companies as unknown as Record<string, unknown>[] });
  }
  if (selected.has('customers')) {
    jobs.push({ table: 'customers', rows: next.customers as unknown as Record<string, unknown>[] });
  }
  if (selected.has('suppliers')) {
    jobs.push({ table: 'suppliers', rows: next.suppliers as unknown as Record<string, unknown>[] });
  }
  if (selected.has('products')) {
    jobs.push({ table: 'products', rows: next.products as unknown as Record<string, unknown>[] });
  }
  if (selected.has('warehouses')) {
    jobs.push({ table: 'warehouses', rows: next.warehouses as unknown as Record<string, unknown>[] });
  }
  if (selected.has('invoices')) {
    jobs.push({ table: 'invoices', rows: next.invoices as unknown as Record<string, unknown>[] });
    jobs.push({
      table: 'reserved_invoices',
      rows: next.reservedInvoices as unknown as Record<string, unknown>[],
    });
  }
  if (selected.has('expenses')) {
    jobs.push({ table: 'expenses', rows: next.expenses as unknown as Record<string, unknown>[] });
  }
  if (selected.has('accounts') || selected.has('journalEntries')) {
    jobs.push({ table: 'accounts', rows: next.accounts as unknown as Record<string, unknown>[] });
    jobs.push({
      table: 'journal_entries',
      rows: next.journalEntries as unknown as Record<string, unknown>[],
    });
  }
  if (selected.has('vouchers')) {
    jobs.push({ table: 'vouchers', rows: next.vouchers as unknown as Record<string, unknown>[] });
  }
  if (selected.has('bankReconciliations')) {
    jobs.push({
      table: 'bank_reconciliations',
      rows: next.bankReconciliations as unknown as Record<string, unknown>[],
    });
  }

  return jobs;
}

export function applyDataReset(selectedIds: DataResetTargetId[], setters: DataResetSetters): void {
  // Functional updates so COA keep list and only zero balances (no seed restore)
  const selected = new Set(selectedIds);

  if (selected.has('companies')) {
    const restored = initialCompanies.map(company => ({ ...company }));
    const active = restored[0];
    if (active) {
      setters.setCompanies(restored);
      setters.setCompany({ ...active });
    }
  }
  if (selected.has('customers')) setters.setCustomers([]);
  if (selected.has('suppliers')) setters.setSuppliers([]);
  if (selected.has('products')) setters.setProducts([]);
  if (selected.has('warehouses')) setters.setWarehouses([]);
  if (selected.has('invoices')) {
    setters.setInvoices([]);
    setters.setReservedInvoices([]);
  }
  if (selected.has('expenses')) setters.setExpenses([]);
  if (selected.has('accounts') || selected.has('journalEntries')) {
    setters.setAccounts(prev => prev.map(account => ({ ...account, balance: 0 })));
    setters.setJournalEntries([]);
  }
  if (selected.has('vouchers')) setters.setVouchers([]);
  if (selected.has('bankReconciliations')) setters.setBankReconciliations([]);
}
