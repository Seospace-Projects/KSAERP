import type {
  AppSettings,
  AuthUser,
  BankReconciliation,
  ChartOfAccount,
  CompanyProfile,
  CustomAppFeature,
  Customer,
  Expense,
  Invoice,
  JournalEntry,
  Product,
  ReservedInvoiceNumber,
  Role,
  Supplier,
  Voucher,
  Warehouse,
} from '../types';
import { hydrateRoles, initialAppSettings, initialRoles, initialUsers } from '../auth';
import { mergeDataResetSettings } from '../dataReset';
import { getSupabase } from './client';
import { APP_SETTINGS_ROW_ID } from './schemaRegistry';

export type UserPreferences = {
  theme: 'green' | 'gold' | 'dark' | 'teal';
  language: 'en' | 'ar';
  activeCompanyId: string | null;
};

export type ErpSnapshot = {
  users: AuthUser[];
  roles: Role[];
  appSettings: AppSettings;
  customFeatures: CustomAppFeature[];
  companies: CompanyProfile[];
  customers: Customer[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  products: Product[];
  invoices: Invoice[];
  reservedInvoices: ReservedInvoiceNumber[];
  expenses: Expense[];
  accounts: ChartOfAccount[];
  journalEntries: JournalEntry[];
  vouchers: Voucher[];
  bankReconciliations: BankReconciliation[];
  preferences: UserPreferences | null;
};

function toCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
}

function rowToCamel<T>(row: Record<string, unknown> | null | undefined): T {
  if (!row) return {} as T;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[toCamelKey(key)] = value;
  }
  return out as T;
}

function rowToSnake(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    out[toSnakeKey(key)] = value;
  }
  return out;
}

function asRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? data.map(item => rowToCamel<T>(item as Record<string, unknown>)) : [];
}

function mapProfile(row: Record<string, unknown>): AuthUser {
  const camel = rowToCamel<AuthUser & { lastLoginAt?: string | null }>(row);
  return {
    id: camel.id,
    username: camel.username,
    email: camel.email,
    nameEn: camel.nameEn,
    nameAr: camel.nameAr,
    roleId: camel.roleId,
    isActive: camel.isActive,
    createdAt: camel.createdAt,
    lastLoginAt: camel.lastLoginAt || undefined,
  };
}

function mapSettings(row: Record<string, unknown> | null): AppSettings {
  if (!row) return initialAppSettings;
  const camel = rowToCamel<AppSettings & { maxCompanyProfiles?: number }>(row);
  return {
    ...initialAppSettings,
    ...camel,
    modules: { ...initialAppSettings.modules, ...(camel.modules || {}) },
    dataReset: mergeDataResetSettings(camel.dataReset),
    maxCompanyProfiles: Number(camel.maxCompanyProfiles) >= 1
      ? Math.trunc(Number(camel.maxCompanyProfiles))
      : initialAppSettings.maxCompanyProfiles,
  };
}

export async function lookupLoginEmail(usernameOrEmail: string): Promise<string | null> {
  const lookup = usernameOrEmail.trim();
  if (!lookup) return null;
  if (lookup.includes('@')) return lookup;

  const known = initialUsers.find(
    user => user.username.toLowerCase() === lookup.toLowerCase()
      || user.email.toLowerCase() === lookup.toLowerCase()
  );
  if (known) return known.email;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('login_email_for', { lookup });
    if (!error && typeof data === 'string' && data) return data;
  } catch {
    // Function missing until schema.sql is applied — fall through.
  }

  try {
    const res = await fetch('/api/auth/lookup-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lookup }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && typeof body.email === 'string' && body.email) return body.email;
  } catch {
    // Service lookup unavailable.
  }

  return null;
}

export async function loadAll(userId?: string): Promise<ErpSnapshot> {
  const supabase = getSupabase();
  const [
    profilesRes,
    rolesRes,
    settingsRes,
    featuresRes,
    companiesRes,
    customersRes,
    suppliersRes,
    warehousesRes,
    productsRes,
    invoicesRes,
    reservedRes,
    expensesRes,
    accountsRes,
    journalsRes,
    vouchersRes,
    recsRes,
    prefsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('roles').select('*'),
    supabase.from('app_settings').select('*').eq('id', APP_SETTINGS_ROW_ID).maybeSingle(),
    supabase.from('custom_features').select('*'),
    supabase.from('companies').select('*'),
    supabase.from('customers').select('*'),
    supabase.from('suppliers').select('*'),
    supabase.from('warehouses').select('*'),
    supabase.from('products').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('reserved_invoices').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('accounts').select('*'),
    supabase.from('journal_entries').select('*'),
    supabase.from('vouchers').select('*'),
    supabase.from('bank_reconciliations').select('*'),
    userId
      ? supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const firstError = [
    profilesRes, rolesRes, settingsRes, featuresRes, companiesRes, customersRes,
    suppliersRes, warehousesRes, productsRes, invoicesRes, reservedRes, expensesRes,
    accountsRes, journalsRes, vouchersRes, recsRes, prefsRes,
  ].find(res => res.error)?.error;
  if (firstError) throw firstError;

  const prefsRow = prefsRes.data as Record<string, unknown> | null;
  return {
    users: (profilesRes.data || []).map(row => mapProfile(row as Record<string, unknown>)),
    roles: hydrateRoles(asRows<Role>(rolesRes.data).length ? asRows<Role>(rolesRes.data) : initialRoles),
    appSettings: mapSettings(settingsRes.data as Record<string, unknown> | null),
    customFeatures: asRows<CustomAppFeature>(featuresRes.data),
    companies: asRows<CompanyProfile>(companiesRes.data),
    customers: asRows<Customer>(customersRes.data),
    suppliers: asRows<Supplier>(suppliersRes.data),
    warehouses: asRows<Warehouse>(warehousesRes.data),
    products: asRows<Product>(productsRes.data),
    invoices: asRows<Invoice>(invoicesRes.data),
    reservedInvoices: asRows<ReservedInvoiceNumber>(reservedRes.data),
    expenses: asRows<Expense>(expensesRes.data),
    accounts: asRows<ChartOfAccount>(accountsRes.data),
    journalEntries: asRows<JournalEntry>(journalsRes.data),
    vouchers: asRows<Voucher>(vouchersRes.data),
    bankReconciliations: asRows<BankReconciliation>(recsRes.data),
    preferences: prefsRow
      ? {
          theme: (prefsRow.theme as UserPreferences['theme']) || 'green',
          language: (prefsRow.language as UserPreferences['language']) || 'en',
          activeCompanyId: (prefsRow.active_company_id as string) || null,
        }
      : null,
  };
}

export async function syncCollection(table: string, rows: Record<string, unknown>[]): Promise<void> {
  const supabase = getSupabase();
  const { data: existing, error: readError } = await supabase.from(table).select('id');
  if (readError) throw readError;
  const keep = new Set(rows.map(row => String(row.id)));
  const toDelete = (existing || [])
    .map(item => String((item as { id: string }).id))
    .filter(id => !keep.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from(table).delete().in('id', toDelete);
    if (error) throw error;
  }
  if (!rows.length) return;
  const payload = rows.map(row => rowToSnake(row));
  const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertAppSettings(settings: AppSettings): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('app_settings').upsert({
    id: APP_SETTINGS_ROW_ID,
    ...rowToSnake(settings as unknown as Record<string, unknown>),
  }, { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertPreferences(userId: string, prefs: UserPreferences): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    theme: prefs.theme,
    language: prefs.language,
    active_company_id: prefs.activeCompanyId,
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function touchLastLogin(): Promise<void> {
  const supabase = getSupabase();
  await supabase.rpc('touch_last_login');
}

export async function loadProfile(userId: string): Promise<AuthUser | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfile(data as Record<string, unknown>);
}
