import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  TrendingDown, 
  Package, 
  Users, 
  Percent, 
  Settings, 
  Globe, 
  Search, 
  Calculator, 
  Sparkles, 
  User, 
  ChevronRight, 
  ChevronLeft,
  Bell,
  HelpCircle,
  Menu,
  X,
  Plus,
  BookOpen,
  LogOut,
  RotateCcw,
  Building,
  Trash2,
  Upload,
  Shield,
  KeyRound,
  SlidersHorizontal,
  Database
} from 'lucide-react';

// Subcomponents
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import SalesInvoiceView from './components/SalesInvoiceView';
import InventoryView from './components/InventoryView';
import DirectoryView from './components/DirectoryView';
import AccountingView from './components/AccountingView';
import VATCenterView from './components/VATCenterView';
import ExpensesView from './components/ExpensesView';
import SuperAdminView, { CustomFeatureWorkspace } from './components/SuperAdminView';
import SqlSchemaView from './components/SqlSchemaView';
import DataResetView from './components/DataResetView';
import ReservedInvoicesModal from './components/ReservedInvoicesModal';
import { ConfirmModal } from './components/ConfirmModal';

// Initial Mock Data and Utilities
import { 
  initialCompany, 
  initialCompanies, 
  initialCustomers, 
  initialSuppliers, 
  initialProducts, 
  initialWarehouses, 
  initialChartOfAccounts, 
  initialInvoices, 
  initialExpenses, 
  initialJournalEntries,
  translations,
  LOGO_PRESETS 
} from './utils';

import {
  canAccessMenu,
  firstAllowedMenu,
  hasPermission,
  initialAppSettings,
  initialCustomFeatures,
  initialRoles,
  isSuperAdmin,
} from './auth';
import { applyDataReset, buildDataResetNextState, dataResetSyncJobs } from './dataReset';
import { getSupabase, isSupabaseConfigured } from './db/client';
import { setPersistAcrossSessions } from './db/cookieStorage';
import {
  clearActiveSessionId,
  readActiveSessionId,
  remoteSessionIdFromUser,
  storeActiveSessionId,
} from './db/sessionGuard';
import {
  loadAll,
  loadProfile,
  lookupLoginEmail,
  syncCollection,
  touchLastLogin,
  upsertAppSettings,
  upsertPreferences,
} from './db/persist';

import { 
  CompanyProfile, 
  Customer, 
  Supplier, 
  Product, 
  Warehouse, 
  Invoice, 
  ChartOfAccount, 
  JournalEntry, 
  Expense,
  Voucher,
  BankReconciliation,
  AuthUser,
  Role,
  AppSettings,
  CustomAppFeature,
  MenuId,
  DataResetTargetId,
  ReservedInvoiceNumber,
} from './types';

const themes = {
  green: {
    sidebarBg: 'bg-[#003B1C] text-emerald-100',
    sidebarHeaderBg: 'bg-[#002f16]',
    sidebarHeaderBorder: 'border-[#002B14]',
    quickInvoiceBtn: 'bg-[#006C35] hover:bg-[#005c2e] text-white border-[#D4AF37]/30',
    quickExpenseBtn: 'bg-emerald-950/60 hover:bg-emerald-950 text-[#D4AF37] border-[#D4AF37]/20',
    itemActive: 'bg-[#006C35] text-white border-l-4 border-[#D4AF37] font-bold shadow-md',
    itemInactive: 'text-emerald-200/70 hover:bg-[#002f16] hover:text-white',
    sidebarIconActive: 'text-[#D4AF37]',
    sidebarIconInactive: 'text-emerald-300',
    footerText: 'text-emerald-300/60',
    footerBorder: 'border-[#002B14]',
  },
  gold: {
    sidebarBg: 'bg-[#4a3a19] text-amber-100',
    sidebarHeaderBg: 'bg-[#3d3014]',
    sidebarHeaderBorder: 'border-[#2f240e]',
    quickInvoiceBtn: 'bg-[#9A7B35] hover:bg-[#83682b] text-white border-[#fcd34d]/30',
    quickExpenseBtn: 'bg-amber-950/60 hover:bg-amber-950 text-[#fcd34d] border-[#fcd34d]/20',
    itemActive: 'bg-[#9A7B35] text-white border-l-4 border-[#fcd34d] font-bold shadow-md',
    itemInactive: 'text-amber-200/70 hover:bg-[#3d3014] hover:text-white',
    sidebarIconActive: 'text-[#fcd34d]',
    sidebarIconInactive: 'text-amber-300',
    footerText: 'text-amber-300/60',
    footerBorder: 'border-[#2f240e]',
  },
  dark: {
    sidebarBg: 'bg-slate-900 text-slate-200',
    sidebarHeaderBg: 'bg-slate-950',
    sidebarHeaderBorder: 'border-slate-800',
    quickInvoiceBtn: 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700/60',
    quickExpenseBtn: 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800',
    itemActive: 'bg-slate-800 text-white border-l-4 border-slate-400 font-bold shadow-md',
    itemInactive: 'text-slate-400 hover:bg-slate-800 hover:text-white',
    sidebarIconActive: 'text-slate-200',
    sidebarIconInactive: 'text-slate-500',
    footerText: 'text-slate-500',
    footerBorder: 'border-slate-800',
  },
  teal: {
    sidebarBg: 'bg-[#0F4C5C] text-cyan-100',
    sidebarHeaderBg: 'bg-[#0a3540]',
    sidebarHeaderBorder: 'border-[#05222b]',
    quickInvoiceBtn: 'bg-[#1A8099] hover:bg-[#146478] text-white border-[#F4D35E]/30',
    quickExpenseBtn: 'bg-[#05222b]/60 hover:bg-[#05222b] text-[#F4D35E] border-[#F4D35E]/20',
    itemActive: 'bg-[#1A8099] text-white border-l-4 border-[#F4D35E] font-bold shadow-md',
    itemInactive: 'text-cyan-200/70 hover:bg-[#0a3540] hover:text-white',
    sidebarIconActive: 'text-[#F4D35E]',
    sidebarIconInactive: 'text-cyan-300',
    footerText: 'text-cyan-300/60',
    footerBorder: 'border-[#05222b]',
  }
};

function useDebouncedSync(table: string, rows: unknown[], enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      syncCollection(table, rows as Record<string, unknown>[]).catch(err => {
        const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'unknown');
        console.warn(`Supabase sync failed for ${table}: ${message}`);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [table, rows, enabled]);
}

export default function App() {
  const persistEnabledRef = React.useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [appSettings, setAppSettings] = useState<AppSettings>(initialAppSettings);
  const [customFeatures, setCustomFeatures] = useState<CustomAppFeature[]>(initialCustomFeatures);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [themeColor, setThemeColor] = useState<'green' | 'gold' | 'dark' | 'teal'>('green');
  const [companies, setCompanies] = useState<CompanyProfile[]>(initialCompanies);
  const [company, setCompany] = useState<CompanyProfile>(initialCompany);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [reservedInvoices, setReservedInvoices] = useState<ReservedInvoiceNumber[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(initialChartOfAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const applySnapshot = async (userId: string) => {
    persistEnabledRef.current = false;
    setHydrated(false);
    const snap = await loadAll(userId);
    const profile = snap.users.find(u => u.id === userId) || await loadProfile(userId);
    if (!profile || !profile.isActive) {
      throw new Error('inactive');
    }
    const nextCompanies = snap.companies.length ? snap.companies : initialCompanies;
    const nextAccounts = snap.accounts.length ? snap.accounts : initialChartOfAccounts;
    const activeId = snap.preferences?.activeCompanyId;
    const nextCompany = (activeId && nextCompanies.find(c => c.id === activeId)) || nextCompanies[0] || initialCompany;
    setUsers(snap.users);
    setRoles(snap.roles.length ? snap.roles : initialRoles);
    setAppSettings(snap.appSettings);
    setCustomFeatures(snap.customFeatures);
    setCompanies(nextCompanies);
    setCompany(nextCompany);
    setCustomers(snap.customers);
    setSuppliers(snap.suppliers);
    setProducts(snap.products);
    setWarehouses(snap.warehouses);
    setInvoices(snap.invoices);
    setReservedInvoices(snap.reservedInvoices);
    setExpenses(snap.expenses);
    setAccounts(nextAccounts);
    setJournalEntries(snap.journalEntries);
    setVouchers(snap.vouchers);
    setBankReconciliations(snap.bankReconciliations);
    if (snap.preferences?.theme) setThemeColor(snap.preferences.theme);
    if (snap.preferences?.language) setLang(snap.preferences.language);
    setCurrentUser(profile);
    setActiveMenu(firstAllowedMenu(profile, snap.roles.length ? snap.roles : initialRoles, snap.appSettings));
    await new Promise(resolve => setTimeout(resolve, 0));
    persistEnabledRef.current = true;
    setHydrated(true);
    if (!snap.companies.length) {
      await syncCollection('companies', nextCompanies as unknown as Record<string, unknown>[]);
    }
    if (!snap.accounts.length) {
      await syncCollection('accounts', nextAccounts as unknown as Record<string, unknown>[]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured()) {
        setBootstrapping(false);
        return;
      }
      try {
        const { data } = await getSupabase().auth.getSession();
        if (cancelled) return;
        if (data.session?.user) {
          const { data: userData } = await getSupabase().auth.getUser();
          const remoteId = remoteSessionIdFromUser(userData.user);
          const localId = readActiveSessionId();
          // Single-device: only the fingerprint from the latest successful login may stay
          if (remoteId && (!localId || remoteId !== localId)) {
            clearActiveSessionId();
            await getSupabase().auth.signOut({ scope: 'local' });
            if (!cancelled) {
              setIsLoggedIn(false);
              setCurrentUser(null);
            }
          } else {
            await applySnapshot(data.session.user.id);
            if (!cancelled) setIsLoggedIn(true);
          }
        }
      } catch {
        if (!cancelled) {
          setIsLoggedIn(false);
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Force-logout when this account signs in on another device
  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured()) return;

    const forceLocalLogout = async () => {
      persistEnabledRef.current = false;
      setHydrated(false);
      clearActiveSessionId();
      setIsLoggedIn(false);
      setCurrentUser(null);
      try {
        await getSupabase().auth.signOut({ scope: 'local' });
      } catch {
        // ignore
      }
    };

    const checkSingleSession = async () => {
      try {
        const localId = readActiveSessionId();
        if (!localId) return;
        const { data, error } = await getSupabase().auth.getUser();
        if (error || !data.user) {
          await forceLocalLogout();
          return;
        }
        const remoteId = remoteSessionIdFromUser(data.user);
        if (remoteId && remoteId !== localId) {
          await forceLocalLogout();
          return;
        }
        // Profile column check when available (schema upgrade)
        const { data: profile } = await getSupabase()
          .from('profiles')
          .select('active_session_id, is_active')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profile && profile.is_active === false) {
          await forceLocalLogout();
          return;
        }
        if (
          profile
          && typeof profile.active_session_id === 'string'
          && profile.active_session_id
          && profile.active_session_id !== localId
        ) {
          await forceLocalLogout();
        }
      } catch {
        // Network blips should not kick the user out
      }
    };

    const { data: sub } = getSupabase().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        persistEnabledRef.current = false;
        setHydrated(false);
        clearActiveSessionId();
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    void checkSingleSession();
    const timer = window.setInterval(() => { void checkSingleSession(); }, 12_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkSingleSession();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      sub.subscription.unsubscribe();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isLoggedIn]);

  const persistOn = hydrated && persistEnabledRef.current && isLoggedIn;
  const persistPlatform = persistOn && currentUser?.roleId === 'super_admin';
  useDebouncedSync('roles', roles, persistPlatform);
  useDebouncedSync('custom_features', customFeatures, persistPlatform);
  useDebouncedSync('companies', companies, persistOn);
  useDebouncedSync('customers', customers, persistOn);
  useDebouncedSync('suppliers', suppliers, persistOn);
  useDebouncedSync('products', products, persistOn);
  useDebouncedSync('warehouses', warehouses, persistOn);
  useDebouncedSync('invoices', invoices, persistOn);
  useDebouncedSync('reserved_invoices', reservedInvoices, persistOn);
  useDebouncedSync('expenses', expenses, persistOn);
  useDebouncedSync('accounts', accounts, persistOn);
  useDebouncedSync('journal_entries', journalEntries, persistOn);
  useDebouncedSync('vouchers', vouchers, persistOn);
  useDebouncedSync('bank_reconciliations', bankReconciliations, persistOn);

  useEffect(() => {
    if (!persistOn || currentUser?.roleId !== 'super_admin') return;
    const timer = window.setTimeout(() => {
      upsertAppSettings(appSettings).catch(err => {
        const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'unknown');
        console.warn(`Supabase sync failed for app_settings: ${message}`);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [appSettings, persistOn]);

  useEffect(() => {
    if (!persistOn || !currentUser) return;
    const timer = window.setTimeout(() => {
      upsertPreferences(currentUser.id, {
        theme: themeColor,
        language: lang,
        activeCompanyId: company.id,
      }).catch(err => {
        const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'unknown');
        console.warn(`Supabase sync failed for preferences: ${message}`);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [themeColor, lang, company.id, persistOn, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const live = users.find(u => u.id === currentUser.id);
    if (!live) return;
    if (!live.isActive) {
      persistEnabledRef.current = false;
      setHydrated(false);
      setIsLoggedIn(false);
      setCurrentUser(null);
      if (isSupabaseConfigured()) void getSupabase().auth.signOut();
      return;
    }
    if (live.roleId !== currentUser.roleId || live.nameEn !== currentUser.nameEn || live.isActive !== currentUser.isActive) {
      setCurrentUser(live);
    }
  }, [users, currentUser]);

  useEffect(() => {
    if (company && company.id) {
      setCompanies(prev => {
        const exists = prev.some(c => c.id === company.id);
        if (!exists) return prev;
        return prev.map(c => c.id === company.id ? company : c);
      });
    }
  }, [company]);

  const handleLogin = async (username: string, password: string, rememberMe: boolean) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false as const,
        error: lang === 'en'
          ? 'Sign-in is unavailable. Contact the administrator.'
          : 'تعذر تسجيل الدخول. تواصل مع المسؤول.',
      };
    }
    try {
      setPersistAcrossSessions(rememberMe);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup: username.trim(), password }),
      });
      const contentType = res.headers.get('content-type') || '';
      const apiMissing = res.status === 404 || res.status === 405 || !contentType.includes('application/json');
      const body = apiMissing ? {} : await res.json().catch(() => ({}));

      if (!apiMissing) {
        if (res.status === 429) {
          return {
            ok: false as const,
            error: lang === 'en' ? 'Too many sign-in attempts. Try again in a minute.' : 'محاولات كثيرة. أعد المحاولة بعد دقيقة.',
          };
        }
        if (res.status === 403) {
          return { ok: false as const, error: lang === 'en' ? 'This account is disabled.' : 'هذا الحساب معطّل.' };
        }
        if (res.ok && body.session?.access_token && body.session?.refresh_token) {
          const { error } = await getSupabase().auth.setSession({
            access_token: body.session.access_token,
            refresh_token: body.session.refresh_token,
          });
          if (error) {
            return { ok: false as const, error: lang === 'en' ? 'Sign-in failed.' : 'فشل تسجيل الدخول.' };
          }
          if (typeof body.activeSessionId === 'string' && body.activeSessionId) {
            storeActiveSessionId(body.activeSessionId);
          }
          // Ensure prior devices are revoked from this browser session too
          try {
            await getSupabase().auth.signOut({ scope: 'others' });
          } catch {
            // ignore if Auth host does not support scope=others
          }
        } else if (res.status === 401) {
          return {
            ok: false as const,
            error: lang === 'en' ? 'Invalid username or password.' : 'اسم المستخدم أو كلمة المرور غير صحيحة.',
          };
        } else {
          return { ok: false as const, error: lang === 'en' ? 'Sign-in failed.' : 'فشل تسجيل الدخول.' };
        }
      } else {
        const supabase = getSupabase();
        const email = (await lookupLoginEmail(username)) || username.trim();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          return {
            ok: false as const,
            error: lang === 'en' ? 'Invalid username or password.' : 'اسم المستخدم أو كلمة المرور غير صحيحة.',
          };
        }
        try {
          await supabase.auth.signOut({ scope: 'others' });
        } catch {
          // ignore
        }
        const fallbackSessionId = crypto.randomUUID();
        storeActiveSessionId(fallbackSessionId);
      }

      const { data } = await getSupabase().auth.getUser();
      if (!data.user) {
        return { ok: false as const, error: lang === 'en' ? 'Sign-in failed.' : 'فشل تسجيل الدخول.' };
      }
      const remoteId = remoteSessionIdFromUser(data.user);
      if (remoteId) storeActiveSessionId(remoteId);
      await applySnapshot(data.user.id);
      await touchLastLogin();
      setIsLoggedIn(true);
      return { ok: true as const };
    } catch (err) {
      if (err instanceof Error && err.message === 'inactive') {
        clearActiveSessionId();
        await getSupabase().auth.signOut();
        return { ok: false as const, error: lang === 'en' ? 'This account is disabled.' : 'هذا الحساب معطّل.' };
      }
      return {
        ok: false as const,
        error: lang === 'en' ? 'Sign-in failed.' : 'فشل تسجيل الدخول.',
      };
    }
  };

  const handleForgotPassword = async (username: string) => {
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup: username.trim() }),
      });
      if (res.status === 429) {
        return {
          ok: false as const,
          error: lang === 'en' ? 'Too many reset attempts. Try again later.' : 'محاولات كثيرة لإعادة التعيين. حاول لاحقاً.',
        };
      }
      if (!res.ok) {
        return {
          ok: false as const,
          error: lang === 'en' ? 'Could not send a reset email.' : 'تعذر إرسال رسالة إعادة التعيين.',
        };
      }
      return { ok: true as const };
    } catch {
      return {
        ok: false as const,
        error: lang === 'en' ? 'Could not send a reset email.' : 'تعذر إرسال رسالة إعادة التعيين.',
      };
    }
  };

  const handleLogout = async () => {
    persistEnabledRef.current = false;
    setHydrated(false);
    setIsLoggedIn(false);
    setCurrentUser(null);
    clearActiveSessionId();
    if (isSupabaseConfigured()) {
      await getSupabase().auth.signOut({ scope: 'local' });
    }
  };

  const [genericAlertModal, setGenericAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // 3. Global Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Dynamic layout directions
  const isRtl = lang === 'ar';
  const t = translations[lang];
  const superAdmin = isSuperAdmin(currentUser);
  const currentRole = roles.find(r => r.id === currentUser?.roleId);

  useEffect(() => {
    if (!currentUser || !isLoggedIn) return;
    if (!canAccessMenu(currentUser, roles, appSettings, activeMenu)) {
      const feature = activeMenu.startsWith('feature-')
        ? customFeatures.find(f => `feature-${f.id}` === activeMenu)
        : undefined;
      if (feature && feature.enabled) return;
      setActiveMenu(firstAllowedMenu(currentUser, roles, appSettings));
    }
  }, [currentUser, roles, appSettings, activeMenu, isLoggedIn, customFeatures]);

  // Set document title and html dir on mount / language switch
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.title = lang === 'en' ? appSettings.appNameEn : appSettings.appNameAr;
  }, [lang, isRtl, appSettings.appNameEn, appSettings.appNameAr]);

  // Global search implementation
  const handleGlobalSearch = (term: string) => {
    setGlobalSearch(term);
    if (term.trim().length > 0) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  // Quick Action menu triggers
  const triggerQuickInvoice = () => {
    setActiveMenu('sales');
    // We can trigger creation view inside SalesInvoiceView if needed
  };

  const triggerQuickExpense = () => {
    setActiveMenu('expenses');
  };

  const [companyToDelete, setCompanyToDelete] = useState<CompanyProfile | null>(null);
  const [reservedListOpen, setReservedListOpen] = useState(false);
  const [reservedListCompanyId, setReservedListCompanyId] = useState<string | null>(null);
  const [pendingUseReserved, setPendingUseReserved] = useState<{ companyId: string; invoiceNumber: string } | null>(null);
  const reservedListCompany = companies.find(c => c.id === reservedListCompanyId) || company;

  const executeDataReset = async (selectedIds: DataResetTargetId[]) => {
    const next = buildDataResetNextState(selectedIds, {
      companies,
      company,
      customers,
      suppliers,
      products,
      warehouses,
      invoices,
      reservedInvoices,
      expenses,
      accounts,
      journalEntries,
      vouchers,
      bankReconciliations,
    });

    applyDataReset(selectedIds, {
      setCompanies,
      setCompany,
      setCustomers,
      setSuppliers,
      setProducts,
      setWarehouses,
      setInvoices,
      setExpenses,
      setAccounts,
      setJournalEntries,
      setVouchers,
      setBankReconciliations,
      setReservedInvoices,
    });

    // Immediate DB wipe/sync so reset survives refresh (do not rely on debounce only)
    if (persistOn) {
      const jobs = dataResetSyncJobs(selectedIds, next);
      const results = await Promise.allSettled(
        jobs.map(job => syncCollection(job.table, job.rows)),
      );
      const failed = results.find(r => r.status === 'rejected');
      if (failed && failed.status === 'rejected') {
        const reason = failed.reason;
        const message = reason instanceof Error
          ? reason.message
          : (reason && typeof reason === 'object' && 'message' in reason
            ? String((reason as { message: unknown }).message)
            : 'Database sync failed');
        throw new Error(message);
      }
    }
  };

  const executeDeleteCompany = () => {
    if (!companyToDelete) return;
    const remaining = companies.filter(x => x.id !== companyToDelete.id);
    setCompanies(remaining);
    if (companyToDelete.id === company.id) {
      const nextActive = remaining[0] || initialCompany;
      setCompany(nextActive);
    }
    setCompanyToDelete(null);
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-900 text-emerald-100 flex items-center justify-center text-sm font-semibold">
        {lang === 'en' ? 'Loading ERP…' : 'جاري تحميل النظام…'}
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        onForgotPassword={handleForgotPassword}
        lang={lang}
        setLang={setLang}
        appNameEn={appSettings.appNameEn}
        appNameAr={appSettings.appNameAr}
        allowRememberMe={appSettings.allowRememberMe}
        supabaseConfigured={isSupabaseConfigured()}
      />
    );
  }

  return (
    <div className={`h-screen overflow-hidden bg-slate-100 text-slate-800 flex font-sans ${isRtl ? 'font-serif' : ''}`}>
      
      {/* 1. SIDE NAVIGATION BAR */}
      <aside 
        className={`w-64 fixed inset-y-0 z-40 transition-all duration-300 ease-in-out border-r flex flex-col justify-between ${themes[themeColor].sidebarBg} ${themes[themeColor].footerBorder} ${
          isRtl ? 'right-0 border-l border-r-0' : 'left-0 border-r border-l-0'
        } ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:h-full lg:shrink-0`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Sidebar Header */}
          <div className={`p-5 flex items-center justify-between border-b ${themes[themeColor].footerBorder} ${themes[themeColor].sidebarHeaderBg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-black/20 border flex items-center justify-center font-extrabold shadow-md tracking-wider ${themeColor === 'green' || themeColor === 'gold' || themeColor === 'teal' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-slate-700 text-slate-300'}`}>
                🇸🇦
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm text-white truncate max-w-[140px]">
                  {isRtl ? company.nameAr : company.nameEn}
                </h2>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${themes[themeColor].sidebarIconActive}`}>
                  {lang === 'en' ? appSettings.appNameEn : appSettings.appNameAr}
                </span>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className={`p-1 rounded-lg lg:hidden ${themeColor === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-black/10'}`}
            >
              <X className="w-4 h-4 text-emerald-200" />
            </button>
          </div>

          {/* Quick Action Buttons on Sidebar */}
          {((hasPermission(currentUser, roles, 'sales.create') && (appSettings.modules.sales || superAdmin)) ||
          (hasPermission(currentUser, roles, 'expenses.create') && (appSettings.modules.expenses || superAdmin))) ? (
          <div className={`px-4 py-4 space-y-2 border-b ${themes[themeColor].footerBorder}`}>
            {hasPermission(currentUser, roles, 'sales.create') && (appSettings.modules.sales || superAdmin) && (
            <button 
              onClick={triggerQuickInvoice}
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${themes[themeColor].quickInvoiceBtn}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {lang === 'en' ? "Quick Tax Invoice" : "فاتورة ضريبية سريعة"}
            </button>
            )}
            {hasPermission(currentUser, roles, 'expenses.create') && (appSettings.modules.expenses || superAdmin) && (
            <button 
              onClick={triggerQuickExpense}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${themes[themeColor].quickExpenseBtn}`}
            >
              <Calculator className="w-3.5 h-3.5" />
              {lang === 'en' ? "Log Expense" : "تسجيل مصروف"}
            </button>
            )}
          </div>
          ) : null}

          {/* Menu Items */}
          <nav className="p-4 space-y-1 flex-1">
            {(() => {
              const platformItems = [
                { id: 'platform' as const, label: t.superAdmin, icon: Shield },
                { id: 'platform-users' as const, label: t.platformUsers, icon: Users },
                { id: 'platform-roles' as const, label: t.platformRoles, icon: KeyRound },
                { id: 'platform-settings' as const, label: t.appSettingsMenu, icon: SlidersHorizontal },
                { id: 'platform-schema' as const, label: t.sqlSchema, icon: Database },
                { id: 'platform-features' as const, label: t.appFeatures, icon: Sparkles },
                { id: 'platform-data-reset' as const, label: t.platformDataReset, icon: RotateCcw },
              ].filter(item => canAccessMenu(currentUser, roles, appSettings, item.id));

              if (platformItems.length === 0) return null;

              return (
                <>
                  <div className={`px-3 pt-1 pb-2 text-[9px] font-bold uppercase tracking-widest ${themes[themeColor].footerText}`}>
                    {lang === 'en' ? 'Platform' : 'المنصة'}
                  </div>
                  {platformItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveMenu(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive 
                            ? themes[themeColor].itemActive 
                            : themes[themeColor].itemInactive
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? themes[themeColor].sidebarIconActive : themes[themeColor].sidebarIconInactive}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                  <div className={`px-3 pt-3 pb-2 text-[9px] font-bold uppercase tracking-widest ${themes[themeColor].footerText}`}>
                    {lang === 'en' ? 'Company ERP' : 'نظام المنشأة'}
                  </div>
                </>
              );
            })()}
            {[
              { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
              { id: 'sales', label: t.sales, icon: FileText },
              { id: 'expenses', label: t.expenses, icon: TrendingDown },
              { id: 'inventory', label: t.inventory, icon: Package },
              { id: 'contacts', label: t.customers + " / " + t.suppliers, icon: Users },
              { id: 'accounting', label: t.chartOfAccounts, icon: BookOpen },
              { id: 'vat', label: t.vatReturns, icon: Percent },
              { id: 'settings', label: t.settings, icon: Settings },
              { id: 'data-reset', label: t.dataReset, icon: RotateCcw },
            ].filter(item => canAccessMenu(currentUser, roles, appSettings, item.id)).map(item => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMenu(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive 
                      ? themes[themeColor].itemActive 
                      : themes[themeColor].itemInactive
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? themes[themeColor].sidebarIconActive : themes[themeColor].sidebarIconInactive}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
            {customFeatures.filter(f => f.enabled).length > 0 && (
              <>
                <div className={`px-3 pt-3 pb-2 text-[9px] font-bold uppercase tracking-widest ${themes[themeColor].footerText}`}>
                  {lang === 'en' ? 'Added features' : 'ميزات مضافة'}
                </div>
                {customFeatures.filter(f => f.enabled).map(feature => {
                  const id = `feature-${feature.id}`;
                  const isActive = activeMenu === id;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => {
                        setActiveMenu(id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive 
                          ? themes[themeColor].itemActive 
                          : themes[themeColor].itemInactive
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 ${isActive ? themes[themeColor].sidebarIconActive : themes[themeColor].sidebarIconInactive}`} />
                      <span className="truncate">{lang === 'en' ? feature.nameEn : feature.nameAr}</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className={`p-4 border-t bg-black/15 text-[10px] space-y-1 font-mono ${themes[themeColor].footerText} ${themes[themeColor].footerBorder}`}>
          <div>C.R.: <span className={`${themes[themeColor].sidebarIconActive} font-bold`}>{company.crNumber}</span></div>
          <div>VAT No: <span className={`${themes[themeColor].sidebarIconActive} font-bold`}>{company.vatNumber}</span></div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block ${themeColor === 'green' || themeColor === 'teal' ? 'bg-emerald-400' : 'bg-[#D4AF37]'}`}></span>
            <span>GAZT/ZATCA Phase 2 Verified</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        
        {/* Header Block */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Global Search Bar */}
            <div className="relative max-w-md w-full hidden md:block">
              <Search className={`absolute top-2.5 ${isRtl ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-slate-400`} />
              <input
                type="text"
                placeholder={lang === 'en' ? "Global search across customers, products, and invoices..." : "بحث عام في الفواتير والعملاء والمنتجات والمخازن..."}
                value={globalSearch}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className={`w-full py-2 ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'} text-xs bg-slate-100 border-none rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all`}
              />
              
              {/* Quick Dropdown Search Results Simulation */}
              {showSearchResults && (
                <div className="absolute top-11 inset-x-0 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs max-h-60 overflow-y-auto space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pb-1 border-b border-slate-50">
                    <span>{lang === 'en' ? "Search Results" : "نتائج البحث السريع"}</span>
                    <button onClick={() => setShowSearchResults(false)} className="hover:underline text-rose-500 font-bold">Close</button>
                  </div>
                  {/* Customers Matching */}
                  {customers.filter(c => c.nameEn.toLowerCase().includes(globalSearch.toLowerCase())).slice(0,2).map(c => (
                    <div key={c.id} onClick={() => { setActiveMenu('contacts'); setShowSearchResults(false); }} className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between">
                      <span className="font-semibold">{c.nameEn} ({c.nameAr})</span>
                      <span className="text-slate-400 font-mono">Customer</span>
                    </div>
                  ))}
                  {/* Products Matching */}
                  {products.filter(p => p.nameEn.toLowerCase().includes(globalSearch.toLowerCase())).slice(0,2).map(p => (
                    <div key={p.id} onClick={() => { setActiveMenu('inventory'); setShowSearchResults(false); }} className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between">
                      <span className="font-semibold">{p.nameEn}</span>
                      <span className="text-slate-400 font-mono">Stock: {p.stockLevel} Pcs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Dynamic Theme Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 mr-1">{lang === 'en' ? 'Theme' : 'المظهر'}:</span>
              {[
                { key: 'green', label: 'Green', colorBg: 'bg-[#006C35]', tooltip: 'KSA Green / أخضر سعودي' },
                { key: 'gold', label: 'Gold', colorBg: 'bg-[#9A7B35]', tooltip: 'Royal Gold / ذهبي ملكي' },
                { key: 'dark', label: 'Dark', colorBg: 'bg-slate-900', tooltip: 'Cosmic Slate / رمادي كوني' },
                { key: 'teal', label: 'Teal', colorBg: 'bg-[#0F4C5C]', tooltip: 'ZATCA Teal / كحلي زكاتي' },
              ].map((th) => (
                <button
                  key={th.key}
                  onClick={() => {
                    setThemeColor(th.key as any);
                  }}
                  title={th.tooltip}
                  className={`w-3.5 h-3.5 rounded-full ${th.colorBg} cursor-pointer transition-all ${
                    themeColor === th.key 
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110 shadow-sm' 
                      : 'opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                />
              ))}
            </div>

            {/* Dynamic Bilingual Swapper */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="p-2.5 bg-slate-50 hover:bg-[#006C35]/10 hover:text-[#006C35] text-slate-600 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              id="language-toggle-btn"
            >
              <Globe className="w-4 h-4 text-[#006C35] animate-spin-slow" />
              <span>{t.toggleLanguage}</span>
            </button>

            {/* Notifications Indicator */}
            <button className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl relative hidden sm:block">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            </button>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2 border-l pl-3 border-slate-200 select-none">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-[#006C35]/30 flex items-center justify-center text-slate-600 font-semibold">
                <span className="text-[10px] text-[#006C35] font-bold">🇸🇦</span>
              </div>
              <div className="hidden lg:block text-start">
                <div className="text-[11px] font-bold text-slate-800">{lang === 'en' ? currentUser.nameEn : (currentUser.nameAr || currentUser.nameEn)}</div>
                <div className="text-[9px] text-slate-400 font-mono">{currentRole ? (lang === 'en' ? currentRole.nameEn : currentRole.nameAr) : currentUser.roleId}</div>
              </div>

              {/* Secure Log Out Button */}
              <button
                onClick={handleLogout}
                title={lang === 'en' ? "Sign Out" : "تسجيل الخروج"}
                className="ml-2 p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTROLLER CONTAINER */}
        <main className="p-6 max-w-7xl mx-auto w-full flex-1 min-h-0 overflow-y-auto">
          {(activeMenu === 'platform' || activeMenu === 'platform-users' || activeMenu === 'platform-roles' || activeMenu === 'platform-settings' || activeMenu === 'platform-features' || activeMenu === 'platform-data-reset') && canAccessMenu(currentUser, roles, appSettings, activeMenu) && (
            <SuperAdminView
              lang={lang}
              section={
                activeMenu === 'platform-users' ? 'users'
                : activeMenu === 'platform-roles' ? 'roles'
                : activeMenu === 'platform-settings' ? 'app_settings'
                : activeMenu === 'platform-features' ? 'features'
                : activeMenu === 'platform-data-reset' ? 'data_reset'
                : 'overview'
              }
              currentUser={currentUser}
              users={users}
              setUsers={setUsers}
              roles={roles}
              setRoles={setRoles}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
              customFeatures={customFeatures}
              setCustomFeatures={setCustomFeatures}
              companies={companies}
              onOpenCompanySettings={() => setActiveMenu('settings')}
            />
          )}

          {activeMenu === 'platform-schema' && canAccessMenu(currentUser, roles, appSettings, 'platform-schema') && currentUser && (
            <SqlSchemaView
              lang={lang}
              users={users}
              onImported={async () => {
                if (currentUser) await applySnapshot(currentUser.id);
              }}
            />
          )}

          {activeMenu.startsWith('feature-') && (() => {
            const feature = customFeatures.find(f => `feature-${f.id}` === activeMenu);
            return feature ? <CustomFeatureWorkspace lang={lang} feature={feature} /> : null;
          })()}

          {/* Dashboard View */}
          {activeMenu === 'dashboard' && (
            <DashboardView 
              lang={lang}
              invoices={invoices}
              products={products}
              expenses={expenses}
              customers={customers}
              suppliers={suppliers}
              currency={company.currency}
              themeColor={themeColor}
            />
          )}

          {/* Sales View */}
          {activeMenu === 'sales' && (
            <SalesInvoiceView 
              lang={lang}
              company={company}
              companies={companies}
              invoices={invoices}
              setInvoices={setInvoices}
              customers={customers}
              setCustomers={setCustomers}
              products={products}
              setProducts={setProducts}
              warehouses={warehouses}
              accounts={accounts}
              setAccounts={setAccounts}
              journalEntries={journalEntries}
              setJournalEntries={setJournalEntries}
              reservedInvoices={reservedInvoices}
              setReservedInvoices={setReservedInvoices}
              currentUserId={currentUser.id}
              canSkipInvoiceNumber={hasPermission(currentUser, roles, 'sales.create')}
              canViewReservedList={hasPermission(currentUser, roles, 'sales.reserved.view')}
              pendingUseReserved={pendingUseReserved}
              onPendingUseReservedConsumed={() => setPendingUseReserved(null)}
              onOpenReservedList={(companyId) => {
                setReservedListCompanyId(companyId);
                setReservedListOpen(true);
              }}
              currency={company.currency}
              themeColor={themeColor}
            />
          )}

          {/* Expenses View */}
          {activeMenu === 'expenses' && (
            <ExpensesView 
              lang={lang}
              expenses={expenses}
              setExpenses={setExpenses}
              accounts={accounts}
              setAccounts={setAccounts}
              journalEntries={journalEntries}
              setJournalEntries={setJournalEntries}
              currency={company.currency}
            />
          )}

          {/* Inventory View */}
          {activeMenu === 'inventory' && (
            <InventoryView 
              lang={lang}
              products={products}
              setProducts={setProducts}
              warehouses={warehouses}
              setWarehouses={setWarehouses}
              currency={company.currency}
            />
          )}

          {/* Directory View */}
          {activeMenu === 'contacts' && (
            <DirectoryView 
              lang={lang}
              customers={customers}
              setCustomers={setCustomers}
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              currency={company.currency}
            />
          )}

          {/* Accounting View */}
          {activeMenu === 'accounting' && (
            <AccountingView 
              lang={lang}
              accounts={accounts}
              setAccounts={setAccounts}
              journalEntries={journalEntries}
              setJournalEntries={setJournalEntries}
              currency={company.currency}
              vouchers={vouchers}
              setVouchers={setVouchers}
              bankReconciliations={bankReconciliations}
              setBankReconciliations={setBankReconciliations}
              customers={customers}
              suppliers={suppliers}
            />
          )}

          {/* VAT Center View */}
          {activeMenu === 'vat' && (
            <VATCenterView 
              lang={lang}
              invoices={invoices}
              expenses={expenses}
              currency={company.currency}
            />
          )}

          {activeMenu === 'data-reset' && (
            <DataResetView
              lang={lang}
              appSettings={appSettings}
              records={{
                companies,
                customers,
                suppliers,
                products,
                warehouses,
                invoices,
                expenses,
                accounts,
                journalEntries,
                vouchers,
                bankReconciliations,
              }}
              onReset={executeDataReset}
            />
          )}

          {/* Settings / Profile Configurator View */}
          {activeMenu === 'settings' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-800" id="settings-workspace">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">{t.companyProfile}</h3>
                <p className="text-[10px] text-slate-400">
                  {lang === 'en' ? "Customize invoice layouts, tax IDs, and bank ibans cascading throughout document printers" : "إعداد وتخصيص بيانات المنشأة والرقم الضريبي والآيبان والتي تنعكس فوراً على فواتير المبيعات ونماذج زاتكا"}
                </p>
              </div>

              {/* Multi-Company Management Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {lang === 'en' ? "Active Company Profile" : "الملف التعريفي النشط للمنشأة"}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'en' ? "Choose the active company profile to view or edit its settings, bank accounts, and printouts." : "اختر الملف التعريفي النشط للمنشأة لعرض أو تعديل بياناتها وحساباتها المصرفية ومطبوعاتها."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!superAdmin && companies.length >= appSettings.maxCompanyProfiles) {
                        setGenericAlertModal({
                          isOpen: true,
                          title: lang === 'en'
                            ? 'Maximum Limit reached. Unable to add new company'
                            : 'تم الوصول للحد الأقصى. تعذر إضافة منشأة جديدة',
                          message: lang === 'en'
                            ? 'Maximum Limit reached. Unable to add new company'
                            : 'تم الوصول للحد الأقصى. تعذر إضافة منشأة جديدة',
                          type: 'error',
                        });
                        return;
                      }
                      const newId = `comp-${Date.now()}`;
                      const newComp = {
                        id: newId,
                        nameEn: `New Company Profile ${companies.length + 1}`,
                        nameAr: `ملف تعريف منشأة جديدة ${companies.length + 1}`,
                        crNumber: "1010000000",
                        vatNumber: "311111111111113",
                        buildingNo: "1234",
                        additionalNo: "0000",
                        street: "King Fahd Road",
                        district: "Al Olaya",
                        city: "Riyadh",
                        postalCode: "12211",
                        country: "Saudi Arabia (المملكة العربية السعودية)",
                        currency: "SAR",
                        bankName: "Riyad Bank",
                        bankAccountNo: "1234567890123",
                        bankIban: "SA1234567890123456789012",
                        invoiceFooterEn: "Thank you for doing business with us.",
                        invoiceFooterAr: "نشكركم على حسن تعاملكم معنا.",
                        invoicePrefix: "INV-",
                        invoiceTemplate: 'professional' as const,
                        qrPosition: 'bottom-right' as const,
                        logoPosition: 'left' as const,
                        showStamp: true,
                        showSignature: true
                      };
                      setCompanies([...companies, newComp]);
                      setCompany(newComp);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold flex items-center gap-1.5 self-stretch sm:self-auto justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {lang === 'en' ? "Add New Company Profile" : "إضافة ملف منشأة جديد"}
                  </button>
                </div>

                <div className="flex gap-2 items-center flex-wrap">
                  {companies.map((c) => {
                    const isActive = c.id === company.id;
                    return (
                      <div key={c.id} className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setCompany(c)}
                          className={`px-3 py-1.5 rounded-lg text-left text-[11px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-extrabold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lang === 'en' ? c.nameEn : c.nameAr}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        </button>
                        
                        {companies.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompanyToDelete(c);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title={lang === 'en' ? "Delete Profile" : "حذف الملف"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Company Logo Configuration Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {lang === 'en' ? "Company Logo & Branding" : "شعار المنشأة والهوية البصرية"}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'en' ? "Upload a custom company logo or select an elegant preset brand emblem to print at the start of the invoice header, before the company name." : "حمّل شعار المنشأة الخاص بك أو اختر شعاراً جاهزاً ليظهر في بداية رأس الفاتورة قبل اسم المنشأة."}
                    </p>
                  </div>
                  
                  {/* Logo visibility checkbox */}
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={company.showLogo !== false}
                      onChange={(e) => setCompany({ ...company, showLogo: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    <span>{lang === 'en' ? "Show Logo on Invoices" : "إظهار الشعار على الفاتورة"}</span>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-5 items-center">
                  {/* Logo Preview box */}
                  <div className="w-24 h-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-xs relative overflow-hidden group">
                    {(company.showLogo !== false && company.logoUrl) ? (
                      <img 
                        src={company.logoUrl} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <span className="text-lg font-bold block">{company.nameEn ? company.nameEn.charAt(0) : "C"}</span>
                        <span className="text-[8px]">{lang === 'en' ? "No Logo" : "بلا شعار"}</span>
                      </div>
                    )}
                    {company.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setCompany({ ...company, logoUrl: undefined })}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer"
                      >
                        {lang === 'en' ? "Remove Logo" : "إزالة الشعار"}
                      </button>
                    )}
                  </div>

                  {/* Logo Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    {/* File Uploader */}
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        {lang === 'en' ? "Upload Custom Logo (.png, .jpg, .svg)" : "رفع شعار مخصص (PNG, JPG, SVG)"}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          id="company-logo-file-input"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setCompany({ ...company, logoUrl: event.target.result as string, showLogo: true });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label
                          htmlFor="company-logo-file-input"
                          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm text-[11px]"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          {lang === 'en' ? "Choose Image File" : "اختر ملف الصورة"}
                        </label>
                        {company.logoUrl && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ {lang === 'en' ? "Custom logo active" : "تم تفعيل الشعار المخصص"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preset Emblems Selector */}
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        {lang === 'en' ? "Or Select an Elegant Preset Brand Emblem" : "أو اختر أحد شعارات الهوية الجاهزة"}
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCompany({ ...company, logoUrl: LOGO_PRESETS.goldCrest, showLogo: true })}
                          className={`p-1.5 rounded-lg border-2 bg-white transition-all flex items-center gap-1 cursor-pointer ${
                            company.logoUrl === LOGO_PRESETS.goldCrest ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img src={LOGO_PRESETS.goldCrest} className="w-7 h-7 rounded-md object-contain" referrerPolicy="no-referrer" />
                          <span className="text-[9px] font-medium">{lang === 'en' ? "Gold Crest" : "الدرع الذهبي"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompany({ ...company, logoUrl: LOGO_PRESETS.blueCorporate, showLogo: true })}
                          className={`p-1.5 rounded-lg border-2 bg-white transition-all flex items-center gap-1 cursor-pointer ${
                            company.logoUrl === LOGO_PRESETS.blueCorporate ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img src={LOGO_PRESETS.blueCorporate} className="w-7 h-7 rounded-md object-contain" referrerPolicy="no-referrer" />
                          <span className="text-[9px] font-medium">{lang === 'en' ? "Blue Corp" : "مؤسسي أزرق"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompany({ ...company, logoUrl: LOGO_PRESETS.techHexagon, showLogo: true })}
                          className={`p-1.5 rounded-lg border-2 bg-white transition-all flex items-center gap-1 cursor-pointer ${
                            company.logoUrl === LOGO_PRESETS.techHexagon ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img src={LOGO_PRESETS.techHexagon} className="w-7 h-7 rounded-md object-contain" referrerPolicy="no-referrer" />
                          <span className="text-[9px] font-medium">{lang === 'en' ? "Tech Hex" : "تقني سداسي"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompany({ ...company, logoUrl: LOGO_PRESETS.emeraldLeaf, showLogo: true })}
                          className={`p-1.5 rounded-lg border-2 bg-white transition-all flex items-center gap-1 cursor-pointer ${
                            company.logoUrl === LOGO_PRESETS.emeraldLeaf ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img src={LOGO_PRESETS.emeraldLeaf} className="w-7 h-7 rounded-md object-contain" referrerPolicy="no-referrer" />
                          <span className="text-[9px] font-medium">{lang === 'en' ? "Emerald Leaf" : "ورقة زمردية"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{t.companyNameEn}</label>
                  <input
                    type="text"
                    value={company.nameEn}
                    onChange={(e) => setCompany({ ...company, nameEn: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{t.companyNameAr}</label>
                  <input
                    type="text"
                    value={company.nameAr}
                    onChange={(e) => setCompany({ ...company, nameAr: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{t.crNumber}</label>
                  <input
                    type="text"
                    value={company.crNumber}
                    onChange={(e) => setCompany({ ...company, crNumber: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{t.vatNumber}</label>
                  <input
                    type="text"
                    value={company.vatNumber}
                    onChange={(e) => setCompany({ ...company, vatNumber: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Fiscal Currency" : "العملة المالية الرئيسية"}</label>
                  <input
                    type="text"
                    value={company.currency}
                    onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Invoice Format / Prefix" : "صيغة / بادئة الفاتورة"}</label>
                  <input
                    type="text"
                    placeholder="e.g. INV- or INV-2026-"
                    value={company.invoicePrefix || ''}
                    onChange={(e) => setCompany({ ...company, invoicePrefix: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                  {(superAdmin || hasPermission(currentUser, roles, 'sales.reserved.view')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setReservedListCompanyId(company.id);
                        setReservedListOpen(true);
                      }}
                      className="mt-1.5 text-[11px] font-bold text-[#006C35] hover:underline cursor-pointer"
                    >
                      {lang === 'en' ? 'Reserved Invoices no.' : 'أرقام الفواتير المحجوزة'}
                    </button>
                  )}
                </div>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{t.buildingNo}</label>
                  <input
                    type="text"
                    value={company.buildingNo}
                    onChange={(e) => setCompany({ ...company, buildingNo: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? "Street" : "الشارع"}</label>
                  <input
                    type="text"
                    value={company.street}
                    onChange={(e) => setCompany({ ...company, street: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">{t.district}</label>
                  <input
                    type="text"
                    value={company.district}
                    onChange={(e) => setCompany({ ...company, district: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">{t.city}</label>
                  <input
                    type="text"
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">
                      {lang === 'en' ? "Bank Accounts & Settlement Details" : "الحسابات البنكية وبيانات التسوية"}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'en' ? "Add the bank account used by your company to receive customer invoice payments." : "أضف الحساب البنكي المستخدم لتلقي دفعات فواتير العملاء."}
                    </p>
                  </div>
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={company.showBankDetails !== false}
                      onChange={(e) => setCompany({ ...company, showBankDetails: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500/20"
                    />
                    <span>{lang === 'en' ? "Show Bank Details on Invoices" : "إظهار تفاصيل البنك على الفواتير"}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">{t.bankName}</label>
                    <input
                      type="text"
                      value={company.bankName}
                      onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                      className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">{t.bankIban}</label>
                    <input
                      type="text"
                      value={company.bankIban}
                      onChange={(e) => setCompany({ ...company, bankIban: e.target.value })}
                      className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">{t.bankAccountNo}</label>
                    <input
                      type="text"
                      value={company.bankAccountNo}
                      onChange={(e) => setCompany({ ...company, bankAccountNo: e.target.value })}
                      className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Invoice Footer (English)</label>
                  <textarea
                    rows={2}
                    value={company.invoiceFooterEn}
                    onChange={(e) => setCompany({ ...company, invoiceFooterEn: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Invoice Footer (Arabic)</label>
                  <textarea
                    rows={2}
                    value={company.invoiceFooterAr}
                    onChange={(e) => setCompany({ ...company, invoiceFooterAr: e.target.value })}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Success button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGenericAlertModal({
                      isOpen: true,
                      title: lang === 'en' ? "Branding & Details Saved" : "تم حفظ الهوية والبيانات",
                      message: lang === 'en' 
                        ? "Company profile details updated and locked successfully! Your logo and business details will now automatically show on your future invoices." 
                        : "تم حفظ وتعميد إعدادات المنشأة بنجاح! سيتم إدراج شعار وبيانات المنشأة تلقائياً في جميع فواتيرك القادمة.",
                      type: 'success'
                    });
                  }}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  {t.saveProfile}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmModal
        isOpen={companyToDelete !== null}
        title={lang === 'en' ? "Confirm Deletion of Company Profile" : "تأكيد حذف ملف تعريف المنشأة"}
        message={
          lang === 'en' 
            ? `Are you sure you want to delete the company profile "${companyToDelete?.nameEn || companyToDelete?.nameAr || ''}"?\n\nThis action cannot be undone.` 
            : `هل أنت متأكد من رغبتك في حذف ملف تعريف المنشأة "${companyToDelete?.nameAr || companyToDelete?.nameEn || ''}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`
        }
        onConfirm={executeDeleteCompany}
        onCancel={() => setCompanyToDelete(null)}
        lang={lang}
      />

      <ReservedInvoicesModal
        lang={lang}
        isOpen={reservedListOpen}
        onClose={() => setReservedListOpen(false)}
        company={reservedListCompany}
        invoices={invoices}
        reserved={reservedInvoices}
        setReserved={setReservedInvoices}
        users={users}
        currentUser={currentUser}
        onUseReserved={(payload) => {
          setReservedListOpen(false);
          setPendingUseReserved(payload);
          setActiveMenu('sales');
        }}
      />

      <ConfirmModal
        isOpen={genericAlertModal.isOpen}
        title={genericAlertModal.title}
        message={genericAlertModal.message}
        onConfirm={() => setGenericAlertModal(prev => ({ ...prev, isOpen: false }))}
        lang={lang}
        type={genericAlertModal.type}
      />
    </div>
  );
}
