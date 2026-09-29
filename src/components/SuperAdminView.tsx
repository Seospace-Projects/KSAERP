import React, { useMemo, useState } from 'react';
import {
  Users,
  Sparkles,
  Plus,
  Trash2,
  Lock,
  ToggleLeft,
  ToggleRight,
  Building,
  UserPlus,
  LayoutDashboard,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { ALL_PERMISSIONS, isSuperAdmin, validatePassword } from '../auth';
import { createUserAccount, deleteUserAccount, updateUserAccount } from '../db/authApi';
import { DATA_RESET_TARGETS } from '../dataReset';
import {
  AppSettings,
  AuthUser,
  BuiltInModuleKey,
  CompanyProfile,
  CustomAppFeature,
  DataResetTargetId,
  Permission,
  Role,
} from '../types';
import { ConfirmModal } from './ConfirmModal';

type PlatformSection = 'overview' | 'users' | 'roles' | 'app_settings' | 'features' | 'data_reset';

interface SuperAdminViewProps {
  lang: 'en' | 'ar';
  section: PlatformSection;
  currentUser: AuthUser;
  users: AuthUser[];
  setUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  customFeatures: CustomAppFeature[];
  setCustomFeatures: React.Dispatch<React.SetStateAction<CustomAppFeature[]>>;
  companies: CompanyProfile[];
  onOpenCompanySettings: () => void;
}

const MODULE_LABELS: Record<BuiltInModuleKey, { en: string; ar: string }> = {
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  sales: { en: 'Sales invoices', ar: 'فواتير المبيعات' },
  expenses: { en: 'Expenses', ar: 'المصروفات' },
  inventory: { en: 'Inventory', ar: 'المخزون' },
  contacts: { en: 'Customers & suppliers', ar: 'العملاء والموردون' },
  accounting: { en: 'Accounting', ar: 'المحاسبة' },
  vat: { en: 'VAT center', ar: 'مركز الضريبة' },
  companySettings: { en: 'Company profile', ar: 'ملف المنشأة' },
};

export default function SuperAdminView({
  lang,
  section,
  currentUser,
  users,
  setUsers,
  roles,
  setRoles,
  appSettings,
  setAppSettings,
  customFeatures,
  setCustomFeatures,
  companies,
  onOpenCompanySettings,
}: SuperAdminViewProps) {
  const isRtl = lang === 'ar';
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showNotice = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ open: true, title, message, type });
  };

  return (
    <div className="space-y-6" id="super-admin-workspace">
      {section === 'overview' && (
        <OverviewPanel
          lang={lang}
          users={users}
          roles={roles}
          appSettings={appSettings}
          customFeatures={customFeatures}
          companies={companies}
          onOpenCompanySettings={onOpenCompanySettings}
        />
      )}
      {section === 'users' && (
        <UsersPanel
          lang={lang}
          isRtl={isRtl}
          currentUser={currentUser}
          users={users}
          setUsers={setUsers}
          roles={roles}
          appSettings={appSettings}
          showNotice={showNotice}
          setConfirm={setConfirm}
        />
      )}
      {section === 'roles' && (
        <RolesPanel
          lang={lang}
          roles={roles}
          setRoles={setRoles}
          showNotice={showNotice}
          setConfirm={setConfirm}
        />
      )}
      {section === 'app_settings' && (
        <AppSettingsPanel
          lang={lang}
          appSettings={appSettings}
          setAppSettings={setAppSettings}
          companies={companies}
          onOpenCompanySettings={onOpenCompanySettings}
          showNotice={showNotice}
        />
      )}
      {section === 'features' && (
        <FeaturesPanel
          lang={lang}
          appSettings={appSettings}
          setAppSettings={setAppSettings}
          customFeatures={customFeatures}
          setCustomFeatures={setCustomFeatures}
          showNotice={showNotice}
          setConfirm={setConfirm}
        />
      )}
      {section === 'data_reset' && (
        <DataResetConfigPanel
          lang={lang}
          appSettings={appSettings}
          setAppSettings={setAppSettings}
        />
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => {
          confirm.onConfirm();
          setConfirm(prev => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
        lang={lang}
      />
      <ConfirmModal
        isOpen={notice.open}
        title={notice.title}
        message={notice.message}
        onConfirm={() => setNotice(prev => ({ ...prev, open: false }))}
        lang={lang}
        type={notice.type === 'error' ? 'error' : 'success'}
      />
    </div>
  );
}

function OverviewPanel({
  lang,
  users,
  roles,
  appSettings,
  customFeatures,
  companies,
  onOpenCompanySettings,
}: {
  lang: 'en' | 'ar';
  users: AuthUser[];
  roles: Role[];
  appSettings: AppSettings;
  customFeatures: CustomAppFeature[];
  companies: CompanyProfile[];
  onOpenCompanySettings: () => void;
}) {
  const enabledModules = Object.values(appSettings.modules).filter(Boolean).length;
  const activeUsers = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {lang === 'en' ? 'Super Admin control center' : 'مركز تحكم المشرف العام'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'en'
            ? 'Platform settings, users, roles, and feature flags for this ERP. Company books stay in the operational menus.'
            : 'إعدادات المنصة والمستخدمون والأدوار وميزات هذا النظام. الدفاتر المحاسبية تبقى في القوائم التشغيلية.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: lang === 'en' ? 'Active users' : 'مستخدمون نشطون', value: String(activeUsers), sub: `${users.length} ${lang === 'en' ? 'total' : 'إجمالي'}` },
          { label: lang === 'en' ? 'Roles' : 'الأدوار', value: String(roles.length), sub: lang === 'en' ? 'including Super Admin' : 'بما فيها المشرف العام' },
          { label: lang === 'en' ? 'Enabled modules' : 'الوحدات المفعّلة', value: `${enabledModules}/8`, sub: lang === 'en' ? 'staff visibility' : 'ظهور للموظفين' },
          { label: lang === 'en' ? 'Custom features' : 'ميزات مخصصة', value: String(customFeatures.length), sub: `${customFeatures.filter(f => f.enabled).length} ${lang === 'en' ? 'live' : 'نشطة'}` },
        ].map(card => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{card.value}</div>
            <div className="text-[10px] text-slate-500 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#006C35]" />
            {lang === 'en' ? 'Users by role' : 'المستخدمون حسب الدور'}
          </h3>
          <div className="space-y-2">
            {roles.map(role => {
              const count = users.filter(u => u.roleId === role.id).length;
              return (
                <div key={role.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <span className="font-semibold text-slate-700">{lang === 'en' ? role.nameEn : role.nameAr}</span>
                  <span className="font-mono text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#006C35]" />
              {lang === 'en' ? 'Company profiles' : 'ملفات المنشآت'}
            </h3>
            <button
              type="button"
              onClick={onOpenCompanySettings}
              className="text-[11px] font-bold text-[#006C35] hover:underline cursor-pointer"
            >
              {lang === 'en' ? 'Open company settings' : 'فتح إعدادات المنشأة'}
            </button>
          </div>
          {companies.map(c => (
            <div key={c.id} className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-800">{lang === 'en' ? c.nameEn : c.nameAr}</div>
              <div className="font-mono text-[10px] text-slate-500 mt-0.5">CR {c.crNumber} · VAT {c.vatNumber}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersPanel({
  lang,
  isRtl,
  currentUser,
  users,
  setUsers,
  roles,
  appSettings,
  showNotice,
  setConfirm,
}: {
  lang: 'en' | 'ar';
  isRtl: boolean;
  currentUser: AuthUser;
  users: AuthUser[];
  setUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
  roles: Role[];
  appSettings: AppSettings;
  showNotice: (title: string, message: string, type?: 'success' | 'error') => void;
  setConfirm: React.Dispatch<React.SetStateAction<{ open: boolean; title: string; message: string; onConfirm: () => void }>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    nameEn: '',
    nameAr: '',
    roleId: 'viewer',
    password: '',
    isActive: true,
  });

  const resetForm = () => {
    setForm({ username: '', email: '', nameEn: '', nameAr: '', roleId: 'viewer', password: '', isActive: true });
    setEditingId(null);
    setShowForm(false);
    setShowPassword(false);
  };

  const viewerIsSuperAdmin = isSuperAdmin(currentUser);
  const visibleUsers = users.filter(u => viewerIsSuperAdmin || u.roleId !== 'super_admin');
  const assignableRoles = roles.filter(r => viewerIsSuperAdmin || r.id !== 'super_admin');
  const superAdminCount = users.filter(u => u.roleId === 'super_admin' && u.isActive).length;

  const startEdit = (user: AuthUser) => {
    if (!viewerIsSuperAdmin && user.roleId === 'super_admin') {
      showNotice(lang === 'en' ? 'Blocked' : 'غير مسموح', lang === 'en' ? 'Super Admin accounts are not visible to other roles.' : 'حسابات المشرف العام غير ظاهرة للأدوار الأخرى.', 'error');
      return;
    }
    setEditingId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      roleId: user.roleId,
      password: '',
      isActive: user.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.trim().toLowerCase();
    if (!username || !form.nameEn.trim()) {
      showNotice(lang === 'en' ? 'Missing fields' : 'حقول ناقصة', lang === 'en' ? 'Username and English name are required.' : 'اسم المستخدم والاسم الإنجليزي مطلوبان.', 'error');
      return;
    }
    const taken = users.some(u => u.username.toLowerCase() === username && u.id !== editingId);
    if (taken) {
      showNotice(lang === 'en' ? 'Username taken' : 'اسم المستخدم مستخدم', lang === 'en' ? 'Choose a different username.' : 'اختر اسم مستخدم آخر.', 'error');
      return;
    }
    if (!editingId || form.password) {
      const pwdError = validatePassword(form.password, appSettings);
      if (pwdError) {
        showNotice(lang === 'en' ? 'Password policy' : 'سياسة كلمة المرور', pwdError, 'error');
        return;
      }
    }

    if (!viewerIsSuperAdmin && form.roleId === 'super_admin') {
      showNotice(lang === 'en' ? 'Blocked' : 'غير مسموح', lang === 'en' ? 'Only Super Admin can assign the Super Admin role.' : 'فقط المشرف العام يمكنه تعيين دور المشرف العام.', 'error');
      return;
    }

    if (editingId) {
      const existing = users.find(u => u.id === editingId);
      if (!existing) return;
      if (!viewerIsSuperAdmin && existing.roleId === 'super_admin') {
        showNotice(lang === 'en' ? 'Blocked' : 'غير مسموح', lang === 'en' ? 'Super Admin accounts cannot be edited by other roles.' : 'لا يمكن للأدوار الأخرى تعديل حسابات المشرف العام.', 'error');
        return;
      }
      if (existing.roleId === 'super_admin' && (form.roleId !== 'super_admin' || !form.isActive) && superAdminCount <= 1) {
        showNotice(lang === 'en' ? 'Blocked' : 'غير مسموح', lang === 'en' ? 'The last Super Admin cannot be demoted or disabled.' : 'لا يمكن تخفيض أو تعطيل آخر مشرف عام.', 'error');
        return;
      }
      try {
        const updated = await updateUserAccount(editingId, {
          username,
          email: form.email.trim(),
          nameEn: form.nameEn.trim(),
          nameAr: form.nameAr.trim(),
          roleId: form.roleId,
          isActive: form.isActive,
          password: form.password || undefined,
        });
        setUsers(users.map(u => u.id === editingId ? updated : u));
        showNotice(lang === 'en' ? 'User updated' : 'تم تحديث المستخدم', lang === 'en' ? 'Account details were saved.' : 'تم حفظ بيانات الحساب.');
      } catch (err: any) {
        showNotice(lang === 'en' ? 'Update failed' : 'فشل التحديث', err?.message || 'Error', 'error');
        return;
      }
    } else {
      try {
        const created = await createUserAccount({
          username,
          email: form.email.trim() || `${username}@ksa-erp.sa`,
          nameEn: form.nameEn.trim(),
          nameAr: form.nameAr.trim(),
          roleId: form.roleId,
          isActive: form.isActive,
          password: form.password,
        });
        setUsers([created, ...users]);
        showNotice(lang === 'en' ? 'User created' : 'تم إنشاء المستخدم', lang === 'en' ? `${username} can now sign in.` : `يمكن لـ ${username} تسجيل الدخول الآن.`);
      } catch (err: any) {
        showNotice(lang === 'en' ? 'Create failed' : 'فشل الإنشاء', err?.message || 'Error', 'error');
        return;
      }
    }
    resetForm();
  };

  const handleDelete = (user: AuthUser) => {
    if (user.id === currentUser.id) {
      showNotice(lang === 'en' ? 'Blocked' : 'غير مسموح', lang === 'en' ? 'You cannot delete your own account.' : 'لا يمكنك حذف حسابك.', 'error');
      return;
    }
    if (!viewerIsSuperAdmin && user.roleId === 'super_admin') {
      showNotice(lang === 'en' ? 'Blocked' : 'غير مسموح', lang === 'en' ? 'Super Admin accounts cannot be deleted by other roles.' : 'لا يمكن للأدوار الأخرى حذف حسابات المشرف العام.', 'error');
      return;
    }
    if (user.roleId === 'super_admin' && superAdminCount <= 1) {
      showNotice(lang === 'en' ? 'Blocked' : 'غير مسموح', lang === 'en' ? 'Keep at least one Super Admin.' : 'يجب الإبقاء على مشرف عام واحد على الأقل.', 'error');
      return;
    }
    setConfirm({
      open: true,
      title: lang === 'en' ? 'Delete user' : 'حذف المستخدم',
      message: lang === 'en' ? `Delete ${user.username}? They will no longer be able to sign in.` : `حذف ${user.username}؟ لن يتمكن من تسجيل الدخول.`,
      onConfirm: async () => {
        try {
          await deleteUserAccount(user.id);
          setUsers(users.filter(u => u.id !== user.id));
        } catch (err: any) {
          showNotice(lang === 'en' ? 'Delete failed' : 'فشل الحذف', err?.message || 'Error', 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{lang === 'en' ? 'Users' : 'المستخدمون'}</h2>
          <p className="text-xs text-slate-500">{lang === 'en' ? 'Create accounts and assign RBAC roles.' : 'إنشاء الحسابات وتعيين أدوار الصلاحيات.'}</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-3 py-2 bg-[#006C35] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {lang === 'en' ? 'Add user' : 'إضافة مستخدم'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <Field label={lang === 'en' ? 'Username' : 'اسم المستخدم'}>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-slate-100 rounded-xl p-2 font-mono" required />
          </Field>
          <Field label={lang === 'en' ? 'Email' : 'البريد'}>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-100 rounded-xl p-2" />
          </Field>
          <Field label={lang === 'en' ? 'Name (English)' : 'الاسم إنجليزي'}>
            <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className="w-full bg-slate-100 rounded-xl p-2" required />
          </Field>
          <Field label={lang === 'en' ? 'Name (Arabic)' : 'الاسم عربي'}>
            <input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="w-full bg-slate-100 rounded-xl p-2" dir="rtl" />
          </Field>
          <Field label={lang === 'en' ? 'Role' : 'الدور'}>
            <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className="w-full bg-slate-100 rounded-xl p-2">
              {assignableRoles.map(r => (
                <option key={r.id} value={r.id}>{lang === 'en' ? r.nameEn : r.nameAr}</option>
              ))}
            </select>
          </Field>
          <Field label={editingId ? (lang === 'en' ? 'New password (optional)' : 'كلمة مرور جديدة (اختياري)') : (lang === 'en' ? 'Password' : 'كلمة المرور')}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-100 rounded-xl p-2 pr-9 font-mono"
                required={!editingId}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-2 text-slate-400 cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer md:col-span-2">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
            {lang === 'en' ? 'Active account' : 'حساب نشط'}
          </label>
          <div className={`md:col-span-2 flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button type="submit" className="px-4 py-2 bg-[#006C35] text-white font-bold rounded-xl cursor-pointer">{lang === 'en' ? 'Save user' : 'حفظ المستخدم'}</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer">{lang === 'en' ? 'Cancel' : 'إلغاء'}</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="text-start p-3">{lang === 'en' ? 'User' : 'المستخدم'}</th>
              <th className="text-start p-3">{lang === 'en' ? 'Role' : 'الدور'}</th>
              <th className="text-start p-3">{lang === 'en' ? 'Status' : 'الحالة'}</th>
              <th className="text-end p-3">{lang === 'en' ? 'Actions' : 'إجراءات'}</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map(user => {
              const role = roles.find(r => r.id === user.roleId);
              return (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{lang === 'en' ? user.nameEn : (user.nameAr || user.nameEn)}</div>
                    <div className="font-mono text-[10px] text-slate-400">{user.username} · {user.email}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-600">{role ? (lang === 'en' ? role.nameEn : role.nameAr) : user.roleId}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {user.isActive ? (lang === 'en' ? 'Active' : 'نشط') : (lang === 'en' ? 'Disabled' : 'معطّل')}
                    </span>
                  </td>
                  <td className="p-3 text-end space-x-2">
                    <button type="button" onClick={() => startEdit(user)} className="text-[#006C35] font-bold cursor-pointer">{lang === 'en' ? 'Edit' : 'تعديل'}</button>
                    <button type="button" onClick={() => handleDelete(user)} className="text-rose-600 font-bold cursor-pointer">{lang === 'en' ? 'Delete' : 'حذف'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolesPanel({
  lang,
  roles,
  setRoles,
  showNotice,
  setConfirm,
}: {
  lang: 'en' | 'ar';
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  showNotice: (title: string, message: string, type?: 'success' | 'error') => void;
  setConfirm: React.Dispatch<React.SetStateAction<{ open: boolean; title: string; message: string; onConfirm: () => void }>>;
}) {
  const [selectedId, setSelectedId] = useState(roles[0]?.id || 'super_admin');
  const [showNew, setShowNew] = useState(false);
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const selected = roles.find(r => r.id === selectedId) || roles[0];

  const groups = useMemo(() => {
    const map = new Map<string, typeof ALL_PERMISSIONS>();
    for (const perm of ALL_PERMISSIONS) {
      const list = map.get(perm.group) || [];
      list.push(perm);
      map.set(perm.group, list);
    }
    return Array.from(map.entries());
  }, []);

  const togglePermission = (permission: Permission) => {
    if (!selected || selected.isLocked) return;
    const next = selected.permissions.includes(permission)
      ? selected.permissions.filter(p => p !== permission)
      : [...selected.permissions, permission];
    setRoles(roles.map(r => r.id === selected.id ? { ...r, permissions: next } : r));
  };

  const addRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameEn.trim()) return;
    const id = `role-${Date.now()}`;
    const role: Role = {
      id,
      nameEn: newNameEn.trim(),
      nameAr: newNameAr.trim() || newNameEn.trim(),
      descriptionEn: 'Custom role',
      descriptionAr: 'دور مخصص',
      permissions: ['dashboard.view'],
      isSystem: false,
      isLocked: false,
    };
    setRoles([...roles, role]);
    setSelectedId(id);
    setShowNew(false);
    setNewNameEn('');
    setNewNameAr('');
    showNotice(lang === 'en' ? 'Role created' : 'تم إنشاء الدور', lang === 'en' ? 'Assign permissions on the right.' : 'عيّن الصلاحيات من القائمة.');
  };

  const deleteRole = (role: Role) => {
    if (role.isSystem) {
      showNotice(lang === 'en' ? 'Locked' : 'مقفل', lang === 'en' ? 'System roles cannot be deleted.' : 'لا يمكن حذف الأدوار النظامية.', 'error');
      return;
    }
    setConfirm({
      open: true,
      title: lang === 'en' ? 'Delete role' : 'حذف الدور',
      message: lang === 'en' ? `Delete ${role.nameEn}? Users on this role should be reassigned first.` : `حذف ${role.nameAr}؟ أعد تعيين المستخدمين أولاً.`,
      onConfirm: () => {
        setRoles(roles.filter(r => r.id !== role.id));
        setSelectedId('admin');
      },
    });
  };

  if (!selected) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">{lang === 'en' ? 'Roles' : 'الأدوار'}</h2>
          <button type="button" onClick={() => setShowNew(true)} className="text-[11px] font-bold text-[#006C35] cursor-pointer flex items-center gap-1">
            <Plus className="w-3 h-3" /> {lang === 'en' ? 'New' : 'جديد'}
          </button>
        </div>
        {showNew && (
          <form onSubmit={addRole} className="space-y-2 p-2 bg-slate-50 rounded-xl">
            <input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} placeholder="English name" className="w-full bg-white p-2 rounded-lg text-xs" />
            <input value={newNameAr} onChange={e => setNewNameAr(e.target.value)} placeholder="الاسم العربي" dir="rtl" className="w-full bg-white p-2 rounded-lg text-xs" />
            <button type="submit" className="w-full py-1.5 bg-[#006C35] text-white text-xs font-bold rounded-lg cursor-pointer">{lang === 'en' ? 'Create' : 'إنشاء'}</button>
          </form>
        )}
        {roles.map(role => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedId(role.id)}
            className={`w-full text-start p-3 rounded-xl text-xs cursor-pointer ${selectedId === role.id ? 'bg-[#006C35] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
          >
            <div className="font-bold flex items-center gap-1.5">
              {lang === 'en' ? role.nameEn : role.nameAr}
              {role.isLocked && <Lock className="w-3 h-3" />}
            </div>
            <div className={`text-[10px] mt-0.5 ${selectedId === role.id ? 'text-emerald-100' : 'text-slate-400'}`}>{role.permissions.length} {lang === 'en' ? 'permissions' : 'صلاحية'}</div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{lang === 'en' ? selected.nameEn : selected.nameAr}</h3>
            <p className="text-xs text-slate-500 mt-1">{lang === 'en' ? selected.descriptionEn : selected.descriptionAr}</p>
          </div>
          {!selected.isSystem && (
            <button type="button" onClick={() => deleteRole(selected)} className="text-rose-600 text-xs font-bold cursor-pointer flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> {lang === 'en' ? 'Delete' : 'حذف'}
            </button>
          )}
        </div>
        {selected.isLocked && (
          <div className="text-[11px] bg-amber-50 text-amber-800 border border-amber-100 rounded-xl p-3">
            {lang === 'en' ? 'Super Admin is locked with every permission.' : 'صلاحيات المشرف العام مقفلة وتشمل كل الصلاحيات.'}
          </div>
        )}
        {groups.map(([group, perms]) => (
          <div key={group}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{group}</div>
            <div className="space-y-1">
              {perms.map(perm => {
                const on = selected.permissions.includes(perm.id);
                return (
                  <label key={perm.id} className={`flex items-center justify-between p-2 rounded-xl text-xs ${selected.isLocked ? 'opacity-70' : 'cursor-pointer hover:bg-slate-50'}`}>
                    <span className="font-medium text-slate-700">{lang === 'en' ? perm.nameEn : perm.nameAr}</span>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={selected.isLocked}
                      onChange={() => togglePermission(perm.id)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppSettingsPanel({
  lang,
  appSettings,
  setAppSettings,
  companies,
  onOpenCompanySettings,
  showNotice,
}: {
  lang: 'en' | 'ar';
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  companies: CompanyProfile[];
  onOpenCompanySettings: () => void;
  showNotice: (title: string, message: string, type?: 'success' | 'error') => void;
}) {
  const save = () => {
    showNotice(
      lang === 'en' ? 'App settings saved' : 'تم حفظ إعدادات التطبيق',
      lang === 'en' ? 'Name, defaults, and password policy apply on next login for new sessions.' : 'الاسم والإعدادات الافتراضية وسياسة كلمة المرور تُطبَّق على الجلسات الجديدة.'
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{lang === 'en' ? 'App settings' : 'إعدادات التطبيق'}</h2>
      <p className="text-xs text-slate-500">
        {lang === 'en'
          ? 'These settings control the product itself — not a single company ledger. Company CR, VAT, and invoice branding stay under Company Profile.'
          : 'هذه الإعدادات تخص المنتج نفسه وليست دفتر منشأة واحدة. السجل التجاري والضريبة وهوية الفاتورة تبقى في ملف المنشأة.'}
      </p>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <Field label={lang === 'en' ? 'Product name (English)' : 'اسم المنتج إنجليزي'}>
          <input value={appSettings.appNameEn} onChange={e => setAppSettings({ ...appSettings, appNameEn: e.target.value })} className="w-full bg-slate-100 rounded-xl p-2" />
        </Field>
        <Field label={lang === 'en' ? 'Product name (Arabic)' : 'اسم المنتج عربي'}>
          <input value={appSettings.appNameAr} onChange={e => setAppSettings({ ...appSettings, appNameAr: e.target.value })} className="w-full bg-slate-100 rounded-xl p-2" dir="rtl" />
        </Field>
        <Field label={lang === 'en' ? 'Default language' : 'اللغة الافتراضية'}>
          <select value={appSettings.defaultLanguage} onChange={e => setAppSettings({ ...appSettings, defaultLanguage: e.target.value as 'en' | 'ar' })} className="w-full bg-slate-100 rounded-xl p-2">
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </Field>
        <Field label={lang === 'en' ? 'Default theme' : 'المظهر الافتراضي'}>
          <select value={appSettings.defaultTheme} onChange={e => setAppSettings({ ...appSettings, defaultTheme: e.target.value as AppSettings['defaultTheme'] })} className="w-full bg-slate-100 rounded-xl p-2">
            <option value="green">KSA Green</option>
            <option value="gold">Royal Gold</option>
            <option value="dark">Cosmic Slate</option>
            <option value="teal">ZATCA Teal</option>
          </select>
        </Field>
        <Field label={lang === 'en' ? 'Minimum password length' : 'الحد الأدنى لكلمة المرور'}>
          <input type="number" min={6} max={32} value={appSettings.minPasswordLength} onChange={e => setAppSettings({ ...appSettings, minPasswordLength: Number(e.target.value) || 8 })} className="w-full bg-slate-100 rounded-xl p-2 font-mono" />
        </Field>
        <Field label={lang === 'en' ? 'Session timeout (minutes)' : 'مهلة الجلسة (دقائق)'}>
          <input type="number" min={15} value={appSettings.sessionTimeoutMinutes} onChange={e => setAppSettings({ ...appSettings, sessionTimeoutMinutes: Number(e.target.value) || 480 })} className="w-full bg-slate-100 rounded-xl p-2 font-mono" />
        </Field>
        <Field label={lang === 'en' ? 'Max company profiles' : 'الحد الأقصى لملفات المنشأة'}>
          <input
            type="number"
            min={1}
            value={appSettings.maxCompanyProfiles}
            onChange={e => setAppSettings({
              ...appSettings,
              maxCompanyProfiles: Math.max(1, Math.trunc(Number(e.target.value) || 1)),
            })}
            className="w-full bg-slate-100 rounded-xl p-2 font-mono"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {lang === 'en'
              ? `${companies.length} of ${appSettings.maxCompanyProfiles} in use. Company users cannot add more than this cap.`
              : `${companies.length} من ${appSettings.maxCompanyProfiles} مستخدم. مستخدمو المنشأة لا يمكنهم التجاوز.`}
          </p>
        </Field>
        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
          <input type="checkbox" checked={appSettings.requireStrongPassword} onChange={e => setAppSettings({ ...appSettings, requireStrongPassword: e.target.checked })} />
          {lang === 'en' ? 'Require mixed-case password with a number' : 'اشتراط أحرف كبيرة وصغيرة ورقم'}
        </label>
        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
          <input type="checkbox" checked={appSettings.allowRememberMe} onChange={e => setAppSettings({ ...appSettings, allowRememberMe: e.target.checked })} />
          {lang === 'en' ? 'Allow remember-me on login' : 'السماح بتذكر الجلسة'}
        </label>
        <div className="md:col-span-2">
          <button type="button" onClick={save} className="px-4 py-2 bg-[#006C35] text-white font-bold rounded-xl cursor-pointer">{lang === 'en' ? 'Save app settings' : 'حفظ إعدادات التطبيق'}</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{lang === 'en' ? 'Company profile settings' : 'إعدادات ملف المنشأة'}</h3>
          <button type="button" onClick={onOpenCompanySettings} className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl cursor-pointer">
            {lang === 'en' ? 'Open full company settings' : 'فتح إعدادات المنشأة كاملة'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          {lang === 'en'
            ? `${companies.length} company profile(s) — CR, VAT, IBAN, logo, and invoice footer.`
            : `${companies.length} ملف منشأة — السجل التجاري والضريبة والآيبان والشعار وتذييل الفاتورة.`}
        </p>
        {companies.map(c => (
          <div key={c.id} className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between gap-2">
            <div>
              <div className="font-bold">{lang === 'en' ? c.nameEn : c.nameAr}</div>
              <div className="font-mono text-[10px] text-slate-500">CR {c.crNumber}</div>
            </div>
            <span className="text-[10px] text-slate-400 self-center">{c.currency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesPanel({
  lang,
  appSettings,
  setAppSettings,
  customFeatures,
  setCustomFeatures,
  showNotice,
  setConfirm,
}: {
  lang: 'en' | 'ar';
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  customFeatures: CustomAppFeature[];
  setCustomFeatures: React.Dispatch<React.SetStateAction<CustomAppFeature[]>>;
  showNotice: (title: string, message: string, type?: 'success' | 'error') => void;
  setConfirm: React.Dispatch<React.SetStateAction<{ open: boolean; title: string; message: string; onConfirm: () => void }>>;
}) {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');

  const toggleModule = (key: BuiltInModuleKey) => {
    setAppSettings({
      ...appSettings,
      modules: { ...appSettings.modules, [key]: !appSettings.modules[key] },
    });
  };

  const addFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;
    const feature: CustomAppFeature = {
      id: `feat-${Date.now()}`,
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim() || nameEn.trim(),
      descriptionEn: descEn.trim() || 'Custom workspace',
      descriptionAr: descAr.trim() || 'مساحة عمل مخصصة',
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    setCustomFeatures([feature, ...customFeatures]);
    setNameEn('');
    setNameAr('');
    setDescEn('');
    setDescAr('');
    showNotice(
      lang === 'en' ? 'Feature added' : 'تمت إضافة الميزة',
      lang === 'en' ? 'It now appears as an extra sidebar item for signed-in staff.' : 'ستظهر كعنصر إضافي في القائمة الجانبية للموظفين.'
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{lang === 'en' ? 'App features' : 'ميزات التطبيق'}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'en'
            ? 'Turn built-in modules off for Company Admin and staff. Super Admin still sees them. Add extra sidebar features below.'
            : 'عطّل الوحدات المدمجة عن مدير المنشأة والموظفين. المشرف العام يراها دائماً. أضف ميزات قائمة إضافية أدناه.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
        <h3 className="text-sm font-bold mb-3">{lang === 'en' ? 'Built-in modules' : 'الوحدات المدمجة'}</h3>
        {(Object.keys(MODULE_LABELS) as BuiltInModuleKey[]).map(key => {
          const on = appSettings.modules[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleModule(key)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-xs cursor-pointer"
            >
              <span className="font-semibold text-slate-800">{lang === 'en' ? MODULE_LABELS[key].en : MODULE_LABELS[key].ar}</span>
              <span className={`flex items-center gap-1.5 font-bold ${on ? 'text-emerald-700' : 'text-slate-400'}`}>
                {on ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {on ? (lang === 'en' ? 'On' : 'مفعّل') : (lang === 'en' ? 'Off' : 'متوقف')}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={addFeature} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          {lang === 'en' ? 'Add a custom feature' : 'إضافة ميزة مخصصة'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder={lang === 'en' ? 'Feature name (English)' : 'اسم الميزة إنجليزي'} className="bg-slate-100 rounded-xl p-2" required />
          <input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder={lang === 'en' ? 'Feature name (Arabic)' : 'اسم الميزة عربي'} className="bg-slate-100 rounded-xl p-2" dir="rtl" />
          <input value={descEn} onChange={e => setDescEn(e.target.value)} placeholder={lang === 'en' ? 'Short description (English)' : 'وصف قصير إنجليزي'} className="bg-slate-100 rounded-xl p-2 md:col-span-1" />
          <input value={descAr} onChange={e => setDescAr(e.target.value)} placeholder={lang === 'en' ? 'Short description (Arabic)' : 'وصف قصير عربي'} className="bg-slate-100 rounded-xl p-2" dir="rtl" />
        </div>
        <button type="submit" className="px-4 py-2 bg-[#006C35] text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {lang === 'en' ? 'Add to sidebar' : 'إضافة للقائمة'}
        </button>
      </form>

      <div className="space-y-2">
        {customFeatures.map(feature => (
          <div key={feature.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{lang === 'en' ? feature.nameEn : feature.nameAr}</div>
              <div className="text-xs text-slate-500 mt-0.5">{lang === 'en' ? feature.descriptionEn : feature.descriptionAr}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCustomFeatures(customFeatures.map(f => f.id === feature.id ? { ...f, enabled: !f.enabled } : f))}
                className={`text-xs font-bold cursor-pointer ${feature.enabled ? 'text-emerald-700' : 'text-slate-400'}`}
              >
                {feature.enabled ? (lang === 'en' ? 'Enabled' : 'مفعّل') : (lang === 'en' ? 'Disabled' : 'متوقف')}
              </button>
              <button
                type="button"
                onClick={() => setConfirm({
                  open: true,
                  title: lang === 'en' ? 'Remove feature' : 'إزالة الميزة',
                  message: lang === 'en' ? `Remove ${feature.nameEn} from the sidebar?` : `إزالة ${feature.nameAr} من القائمة؟`,
                  onConfirm: () => setCustomFeatures(customFeatures.filter(f => f.id !== feature.id)),
                })}
                className="text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataResetConfigPanel({
  lang,
  appSettings,
  setAppSettings,
}: {
  lang: 'en' | 'ar';
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  const updateTarget = (id: DataResetTargetId, patch: Partial<AppSettings['dataReset'][DataResetTargetId]>) => {
    const current = appSettings.dataReset[id] ?? { enabled: true, defaultChecked: false };
    const next = { ...current, ...patch };
    if (!next.enabled) next.defaultChecked = false;
    setAppSettings({
      ...appSettings,
      dataReset: { ...appSettings.dataReset, [id]: next },
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-[#006C35]" />
          {lang === 'en' ? 'Data Reset' : 'إعادة تعيين البيانات'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'en'
            ? 'Choose which datasets appear in the Data Reset module, and which boxes are checked by default. Users still need the Reset operational data permission to open that screen.'
            : 'حدد مجموعات البيانات التي تظهر في وحدة إعادة التعيين، وأي مربعات تكون محددة افتراضياً. يحتاج المستخدمون صلاحية إعادة تعيين البيانات التشغيلية لفتح تلك الشاشة.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-start font-bold p-3">{lang === 'en' ? 'Data' : 'البيانات'}</th>
              <th className="text-center font-bold p-3 w-28">{lang === 'en' ? 'Enabled' : 'مفعّل'}</th>
              <th className="text-center font-bold p-3 w-36">{lang === 'en' ? 'Default checked' : 'محدد افتراضياً'}</th>
            </tr>
          </thead>
          <tbody>
            {DATA_RESET_TARGETS.map(target => {
              const row = appSettings.dataReset[target.id];
              return (
                <tr key={target.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{lang === 'en' ? target.nameEn : target.nameAr}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{lang === 'en' ? target.descriptionEn : target.descriptionAr}</div>
                  </td>
                  <td className="p-3 text-center">
                    <label className="inline-flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label={lang === 'en' ? `${target.nameEn} enabled` : `${target.nameAr} مفعّل`}
                        checked={row?.enabled !== false}
                        onChange={e => updateTarget(target.id, { enabled: e.target.checked })}
                      />
                    </label>
                  </td>
                  <td className="p-3 text-center">
                    <label className={`inline-flex items-center justify-center ${row?.enabled === false ? 'opacity-40' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        aria-label={lang === 'en' ? `${target.nameEn} default checked` : `${target.nameAr} محدد افتراضياً`}
                        checked={!!row?.defaultChecked && row?.enabled !== false}
                        disabled={row?.enabled === false}
                        onChange={e => updateTarget(target.id, { defaultChecked: e.target.checked })}
                      />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-slate-500 font-semibold">{label}</span>
      {children}
    </label>
  );
}

export function CustomFeatureWorkspace({
  lang,
  feature,
}: {
  lang: 'en' | 'ar';
  feature: CustomAppFeature;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
      <div className="w-10 h-10 rounded-xl bg-[#006C35]/10 flex items-center justify-center">
        <LayoutDashboard className="w-5 h-5 text-[#006C35]" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{lang === 'en' ? feature.nameEn : feature.nameAr}</h2>
      <p className="text-sm text-slate-600">{lang === 'en' ? feature.descriptionEn : feature.descriptionAr}</p>
      <p className="text-xs text-slate-400">
        {lang === 'en'
          ? 'This workspace was added from Super Admin → Features. Wire screens and data here when the module is ready.'
          : 'أُضيفت هذه المساحة من المشرف العام ← الميزات. اربط الشاشات والبيانات هنا عند جاهزية الوحدة.'}
      </p>
    </div>
  );
}
