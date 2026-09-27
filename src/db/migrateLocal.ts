import { initialUsers, hydrateRoles } from '../auth';
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
  StoredUser,
  Supplier,
  Voucher,
  Warehouse,
} from '../types';
import { createUserAccount } from './authApi';
import { clearLegacyBrowserData, readLegacyJson } from './legacyStorage';
import { syncCollection, upsertAppSettings } from './persist';

export type MigrateResult = {
  imported: string[];
  createdUsers: { username: string; password?: string; id: string }[];
  userIdMap: Record<string, string>;
};

function randomPassword(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return `Tmp${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}A1`;
}

export async function migrateLegacyBrowserData(existingUsers: AuthUser[]): Promise<MigrateResult> {
  const imported: string[] = [];
  const createdUsers: MigrateResult['createdUsers'] = [];
  const userIdMap: Record<string, string> = {};

  for (const live of existingUsers) {
    userIdMap[live.id] = live.id;
    userIdMap[live.username.toLowerCase()] = live.id;
    userIdMap[live.email.toLowerCase()] = live.id;
  }
  for (const seed of initialUsers) {
    const match = existingUsers.find(
      u => u.username.toLowerCase() === seed.username.toLowerCase() || u.email.toLowerCase() === seed.email.toLowerCase()
    );
    if (match) userIdMap[seed.id] = match.id;
  }

  const legacyUsers = readLegacyJson<StoredUser[]>('ksa_erp_users', []);
  for (const legacy of legacyUsers) {
    const byName = existingUsers.find(
      u => u.username.toLowerCase() === legacy.username.toLowerCase() || u.email.toLowerCase() === legacy.email.toLowerCase()
    );
    if (byName) {
      userIdMap[legacy.id] = byName.id;
      continue;
    }
    const password = randomPassword();
    const created = await createUserAccount({
      username: legacy.username,
      email: legacy.email,
      nameEn: legacy.nameEn,
      nameAr: legacy.nameAr,
      roleId: legacy.roleId,
      isActive: legacy.isActive,
      password,
    });
    userIdMap[legacy.id] = created.id;
    createdUsers.push({ username: created.username, password, id: created.id });
    existingUsers.push(created);
  }

  const roles = readLegacyJson<Role[] | null>('ksa_erp_roles', null);
  if (roles?.length) {
    await syncCollection('roles', hydrateRoles(roles) as unknown as Record<string, unknown>[]);
    imported.push('roles');
  }

  const settings = readLegacyJson<AppSettings | null>('ksa_erp_app_settings', null);
  if (settings) {
    await upsertAppSettings(settings);
    imported.push('app_settings');
  }

  const features = readLegacyJson<CustomAppFeature[]>('ksa_erp_custom_features', []);
  if (features.length) {
    await syncCollection('custom_features', features as unknown as Record<string, unknown>[]);
    imported.push('custom_features');
  }

  const collections: { key: string; table: string }[] = [
    { key: 'ksa_erp_companies', table: 'companies' },
    { key: 'ksa_erp_customers', table: 'customers' },
    { key: 'ksa_erp_suppliers', table: 'suppliers' },
    { key: 'ksa_erp_products', table: 'products' },
    { key: 'ksa_erp_warehouses', table: 'warehouses' },
    { key: 'ksa_erp_invoices', table: 'invoices' },
    { key: 'ksa_erp_expenses', table: 'expenses' },
    { key: 'ksa_erp_accounts', table: 'accounts' },
    { key: 'ksa_erp_journal_entries', table: 'journal_entries' },
    { key: 'ksa_erp_vouchers', table: 'vouchers' },
    { key: 'ksa_erp_bank_reconciliations', table: 'bank_reconciliations' },
  ];

  for (const { key, table } of collections) {
    const rows = readLegacyJson<Record<string, unknown>[]>(key, []);
    if (!rows.length) continue;
    await syncCollection(table, rows);
    imported.push(table);
  }

  const reserved = readLegacyJson<ReservedInvoiceNumber[]>('ksa_erp_reserved_invoices', []);
  if (reserved.length) {
    const mapped = reserved.map(row => ({
      ...row,
      createdByUserId: userIdMap[row.createdByUserId] || row.createdByUserId,
    }));
    await syncCollection('reserved_invoices', mapped as unknown as Record<string, unknown>[]);
    imported.push('reserved_invoices');
  }

  clearLegacyBrowserData();
  return { imported, createdUsers, userIdMap };
}

export type {
  CompanyProfile,
  Customer,
  Supplier,
  Product,
  Warehouse,
  Invoice,
  Expense,
  ChartOfAccount,
  JournalEntry,
  Voucher,
  BankReconciliation,
};
