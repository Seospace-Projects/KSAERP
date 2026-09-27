export const LEGACY_STORAGE_KEYS = [
  'ksa_erp_users',
  'ksa_erp_roles',
  'ksa_erp_app_settings',
  'ksa_erp_custom_features',
  'ksa_erp_logged_in',
  'ksa_erp_user',
  'ksa_erp_theme',
  'ksa_erp_companies',
  'ksa_erp_active_company_id',
  'ksa_erp_customers',
  'ksa_erp_suppliers',
  'ksa_erp_products',
  'ksa_erp_warehouses',
  'ksa_erp_invoices',
  'ksa_erp_reserved_invoices',
  'ksa_erp_expenses',
  'ksa_erp_accounts',
  'ksa_erp_journal_entries',
  'ksa_erp_vouchers',
  'ksa_erp_bank_reconciliations',
] as const;

export function hasLegacyBrowserData(): boolean {
  if (typeof window === 'undefined') return false;
  return LEGACY_STORAGE_KEYS.some(key =>
    Boolean(localStorage.getItem(key) || sessionStorage.getItem(key))
  );
}

export function readLegacyJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function clearLegacyBrowserData(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
