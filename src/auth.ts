/**
 * Client-side RBAC. Passwords live in Supabase Auth; profiles/roles live in Postgres.
 */

import { initialDataResetSettings } from './dataReset';
import {
  AppSettings,
  AuthUser,
  BuiltInModuleKey,
  CustomAppFeature,
  MenuId,
  Permission,
  Role,
  StoredUser,
} from './types';

export const ALL_PERMISSIONS: { id: Permission; nameEn: string; nameAr: string; group: string }[] = [
  { id: 'dashboard.view', nameEn: 'View dashboard', nameAr: 'عرض لوحة التحكم', group: 'Operations' },
  { id: 'sales.view', nameEn: 'View sales invoices', nameAr: 'عرض فواتير المبيعات', group: 'Operations' },
  { id: 'sales.create', nameEn: 'Issue tax invoices', nameAr: 'إصدار الفواتير الضريبية', group: 'Operations' },
  { id: 'sales.return', nameEn: 'Issue credit notes', nameAr: 'إصدار إشعارات دائنة', group: 'Operations' },
  { id: 'sales.reserved.view', nameEn: 'View reserved invoice numbers', nameAr: 'عرض أرقام الفواتير المحجوزة', group: 'Operations' },
  { id: 'expenses.view', nameEn: 'View expenses', nameAr: 'عرض المصروفات', group: 'Operations' },
  { id: 'expenses.create', nameEn: 'Log expenses', nameAr: 'تسجيل المصروفات', group: 'Operations' },
  { id: 'inventory.view', nameEn: 'View inventory', nameAr: 'عرض المخزون', group: 'Operations' },
  { id: 'inventory.manage', nameEn: 'Manage stock & warehouses', nameAr: 'إدارة المخزون والمستودعات', group: 'Operations' },
  { id: 'contacts.view', nameEn: 'View customers & suppliers', nameAr: 'عرض العملاء والموردين', group: 'Operations' },
  { id: 'contacts.manage', nameEn: 'Manage customers & suppliers', nameAr: 'إدارة العملاء والموردين', group: 'Operations' },
  { id: 'accounting.view', nameEn: 'View ledger & reports', nameAr: 'عرض دفتر الأستاذ والتقارير', group: 'Operations' },
  { id: 'accounting.manage', nameEn: 'Post journals & vouchers', nameAr: 'ترحيل القيود والسندات', group: 'Operations' },
  { id: 'vat.view', nameEn: 'View VAT center', nameAr: 'عرض مركز ضريبة القيمة المضافة', group: 'Operations' },
  { id: 'dataReset.execute', nameEn: 'Reset operational data', nameAr: 'إعادة تعيين البيانات التشغيلية', group: 'Operations' },
  { id: 'company.settings', nameEn: 'Company profile settings', nameAr: 'إعدادات ملف المنشأة', group: 'Company' },
  { id: 'platform.dashboard', nameEn: 'Super Admin dashboard', nameAr: 'لوحة المشرف العام', group: 'Platform' },
  { id: 'platform.users', nameEn: 'Manage users', nameAr: 'إدارة المستخدمين', group: 'Platform' },
  { id: 'platform.roles', nameEn: 'Manage roles & permissions', nameAr: 'إدارة الأدوار والصلاحيات', group: 'Platform' },
  { id: 'platform.app_settings', nameEn: 'App settings', nameAr: 'إعدادات التطبيق', group: 'Platform' },
  { id: 'platform.features', nameEn: 'Feature catalog', nameAr: 'كتالوج الميزات', group: 'Platform' },
  { id: 'platform.data_reset', nameEn: 'Configure data reset catalog', nameAr: 'إعداد كتالوج إعادة تعيين البيانات', group: 'Platform' },
  { id: 'platform.schema', nameEn: 'SQL schema', nameAr: 'مخطط SQL', group: 'Platform' },
];

const PLATFORM_PERMISSIONS: Permission[] = [
  'platform.dashboard',
  'platform.users',
  'platform.roles',
  'platform.app_settings',
  'platform.features',
  'platform.data_reset',
  'platform.schema',
];

const ADMIN_EXCLUDED_PERMISSIONS: Permission[] = [
  ...PLATFORM_PERMISSIONS,
  'dataReset.execute',
];

const ALL_PERMISSION_IDS: Permission[] = ALL_PERMISSIONS.map(p => p.id);

export const initialRoles: Role[] = [
  {
    id: 'super_admin',
    nameEn: 'Super Admin',
    nameAr: 'المشرف العام',
    descriptionEn: 'Full platform control: users, roles, app settings, feature flags, and every operational module.',
    descriptionAr: 'صلاحية كاملة على المنصة: المستخدمون والأدوار وإعدادات التطبيق وميزات النظام وجميع الوحدات التشغيلية.',
    permissions: ALL_PERMISSION_IDS,
    isSystem: true,
    isLocked: true,
  },
  {
    id: 'admin',
    nameEn: 'Company Admin',
    nameAr: 'مدير المنشأة',
    descriptionEn: 'All operational modules and company profile. No platform / app-level settings.',
    descriptionAr: 'جميع الوحدات التشغيلية وملف المنشأة. بدون إعدادات المنصة أو التطبيق.',
    permissions: ALL_PERMISSION_IDS.filter(p => !ADMIN_EXCLUDED_PERMISSIONS.includes(p)),
    isSystem: true,
    isLocked: false,
  },
  {
    id: 'accountant',
    nameEn: 'Accountant',
    nameAr: 'محاسب',
    descriptionEn: 'Dashboard, expenses, ledger, and VAT returns.',
    descriptionAr: 'لوحة التحكم والمصروفات ودفتر الأستاذ والإقرارات الضريبية.',
    permissions: [
      'dashboard.view',
      'expenses.view',
      'expenses.create',
      'accounting.view',
      'accounting.manage',
      'vat.view',
    ],
    isSystem: true,
    isLocked: false,
  },
  {
    id: 'sales',
    nameEn: 'Sales Officer',
    nameAr: 'موظف مبيعات',
    descriptionEn: 'Invoices and customer directory.',
    descriptionAr: 'الفواتير ودليل العملاء.',
    permissions: [
      'dashboard.view',
      'sales.view',
      'sales.create',
      'sales.return',
      'contacts.view',
      'contacts.manage',
    ],
    isSystem: true,
    isLocked: false,
  },
  {
    id: 'inventory',
    nameEn: 'Inventory Officer',
    nameAr: 'أمين المخزون',
    descriptionEn: 'Products, warehouses, and stock movements.',
    descriptionAr: 'المنتجات والمستودعات وحركة المخزون.',
    permissions: [
      'dashboard.view',
      'inventory.view',
      'inventory.manage',
    ],
    isSystem: true,
    isLocked: false,
  },
  {
    id: 'viewer',
    nameEn: 'Viewer',
    nameAr: 'مستعرض',
    descriptionEn: 'Read-only dashboard.',
    descriptionAr: 'لوحة التحكم للعرض فقط.',
    permissions: ['dashboard.view'],
    isSystem: true,
    isLocked: false,
  },
];

export const initialUsers: StoredUser[] = [
  {
    id: 'user-super',
    username: 'superadmin',
    email: 'superadmin@ksa-erp.sa',
    nameEn: 'Khalid Al-Mutairi',
    nameAr: 'خالد المطيري',
    roleId: 'super_admin',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@alriyadah.sa',
    nameEn: 'Abdulaziz Al-Saud',
    nameAr: 'عبدالعزيز آل سعود',
    roleId: 'admin',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-accountant',
    username: 'accountant',
    email: 'accounts@alriyadah.sa',
    nameEn: 'Noura Al-Harbi',
    nameAr: 'نورة الحربي',
    roleId: 'accountant',
    isActive: true,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'user-sales',
    username: 'sales',
    email: 'sales@alriyadah.sa',
    nameEn: 'Fahad Al-Qahtani',
    nameAr: 'فهد القحطاني',
    roleId: 'sales',
    isActive: true,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'user-inventory',
    username: 'inventory',
    email: 'stores@alriyadah.sa',
    nameEn: 'Saeed Al-Ghamdi',
    nameAr: 'سعيد الغامدي',
    roleId: 'inventory',
    isActive: true,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'user-viewer',
    username: 'viewer',
    email: 'board@alriyadah.sa',
    nameEn: 'Board Observer',
    nameAr: 'مراقب مجلس الإدارة',
    roleId: 'viewer',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z',
  },
];

export const initialAppSettings: AppSettings = {
  appNameEn: 'KSA Enterprise ERP',
  appNameAr: 'نظام الريادة السحابي للمحاسبة',
  defaultLanguage: 'en',
  defaultTheme: 'green',
  allowRememberMe: true,
  requireStrongPassword: true,
  minPasswordLength: 8,
  sessionTimeoutMinutes: 480,
  maxCompanyProfiles: 5,
  modules: {
    dashboard: true,
    sales: true,
    expenses: true,
    inventory: true,
    contacts: true,
    accounting: true,
    vat: true,
    companySettings: true,
  },
  dataReset: initialDataResetSettings,
};

export const initialCustomFeatures: CustomAppFeature[] = [];

export function getRole(roles: Role[], roleId: string): Role | undefined {
  return roles.find(r => r.id === roleId);
}

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.roleId === 'super_admin';
}

export function hasPermission(user: AuthUser | null | undefined, roles: Role[], permission: Permission): boolean {
  if (!user || !user.isActive) return false;
  if (user.roleId === 'super_admin') return true;
  const role = getRole(roles, user.roleId);
  return role?.permissions.includes(permission) ?? false;
}

export function moduleEnabled(settings: AppSettings, key: BuiltInModuleKey): boolean {
  return settings.modules[key] !== false;
}

const MENU_PERMISSION: Record<string, Permission> = {
  dashboard: 'dashboard.view',
  sales: 'sales.view',
  expenses: 'expenses.view',
  inventory: 'inventory.view',
  contacts: 'contacts.view',
  accounting: 'accounting.view',
  vat: 'vat.view',
  settings: 'company.settings',
  platform: 'platform.dashboard',
  'platform-users': 'platform.users',
  'platform-roles': 'platform.roles',
  'platform-settings': 'platform.app_settings',
  'platform-features': 'platform.features',
  'platform-data-reset': 'platform.data_reset',
  'platform-schema': 'platform.schema',
  'data-reset': 'dataReset.execute',
};

const MENU_MODULE: Record<string, BuiltInModuleKey> = {
  dashboard: 'dashboard',
  sales: 'sales',
  expenses: 'expenses',
  inventory: 'inventory',
  contacts: 'contacts',
  accounting: 'accounting',
  vat: 'vat',
  settings: 'companySettings',
};

export function canAccessMenu(
  user: AuthUser | null | undefined,
  roles: Role[],
  settings: AppSettings,
  menuId: MenuId
): boolean {
  if (!user) return false;
  if (typeof menuId === 'string' && menuId.startsWith('feature-')) {
    return hasPermission(user, roles, 'dashboard.view') || isSuperAdmin(user);
  }
  const permission = MENU_PERMISSION[menuId];
  if (!permission) return false;
  if (!hasPermission(user, roles, permission)) return false;
  const moduleKey = MENU_MODULE[menuId];
  if (moduleKey && !moduleEnabled(settings, moduleKey) && !isSuperAdmin(user)) {
    return false;
  }
  return true;
}

export function firstAllowedMenu(
  user: AuthUser | null | undefined,
  roles: Role[],
  settings: AppSettings
): MenuId {
  const order: MenuId[] = isSuperAdmin(user)
    ? ['platform', 'platform-schema', 'dashboard', 'sales', 'expenses', 'inventory', 'contacts', 'accounting', 'vat', 'settings', 'data-reset']
    : ['dashboard', 'sales', 'expenses', 'inventory', 'contacts', 'accounting', 'vat', 'settings', 'data-reset'];
  return order.find(id => canAccessMenu(user, roles, settings, id)) || 'dashboard';
}

export function validatePassword(password: string, settings: AppSettings): string | null {
  if (password.length < settings.minPasswordLength) {
    return `Password must be at least ${settings.minPasswordLength} characters.`;
  }
  if (settings.requireStrongPassword) {
    const strong = /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
    if (!strong) {
      return 'Password must include upper, lower, and a number.';
    }
  }
  return null;
}

export function hydrateRoles(roles: Role[]): Role[] {
  return roles.map(role => {
    if (role.id === 'super_admin') {
      return { ...role, permissions: ALL_PERMISSION_IDS };
    }
    if (role.id === 'admin' && !role.permissions.includes('sales.reserved.view')) {
      return { ...role, permissions: [...role.permissions, 'sales.reserved.view'] };
    }
    return role;
  });
}
