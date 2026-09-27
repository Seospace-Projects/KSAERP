import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  Layers, 
  Calendar, 
  Check, 
  FileCheck, 
  AlertCircle, 
  ShieldAlert,
  ArrowRightLeft,
  FileSpreadsheet,
  Trash2,
  Edit,
  RotateCcw
} from 'lucide-react';
import { translations, initialChartOfAccounts } from '../utils';
import { ChartOfAccount, JournalEntry, JournalLine, Voucher, BankReconciliation, Customer, Supplier } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface AccountingViewProps {
  lang: 'en' | 'ar';
  accounts: ChartOfAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<ChartOfAccount[]>>;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  currency: string;
  vouchers?: Voucher[];
  setVouchers?: React.Dispatch<React.SetStateAction<Voucher[]>>;
  bankReconciliations?: BankReconciliation[];
  setBankReconciliations?: React.Dispatch<React.SetStateAction<BankReconciliation[]>>;
  customers?: Customer[];
  suppliers?: Supplier[];
}

export default function AccountingView({
  lang,
  accounts,
  setAccounts,
  journalEntries,
  setJournalEntries,
  currency,
  vouchers = [],
  setVouchers = () => {},
  bankReconciliations = [],
  setBankReconciliations = () => {},
  customers = [],
  suppliers = []
}: AccountingViewProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, action: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteJournalEntry = (id: string) => {
    triggerConfirm(
      lang === 'en' ? "Confirm Entry Deletion" : "تأكيد حذف القيد",
      lang === 'en' ? "Are you sure you want to delete this journal entry?" : "هل أنت متأكد من حذف قيد اليومية هذا؟",
      () => {
        setJournalEntries(journalEntries.filter(je => je.id !== id));
      }
    );
  };

  // Chart of Accounts (COA) modification & design states
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

  const [newAccCode, setNewAccCode] = useState('');
  const [newAccNameEn, setNewAccNameEn] = useState('');
  const [newAccNameAr, setNewAccNameAr] = useState('');
  const [newAccType, setNewAccType] = useState<'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'>('Asset');
  const [newAccSubType, setNewAccSubType] = useState('');
  const [newAccBalance, setNewAccBalance] = useState(0);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode || !newAccNameEn || !newAccNameAr || !newAccSubType) {
      alert(lang === 'en' ? "Please fill all required fields." : "يرجى ملء جميع الحقول المطلوبة.");
      return;
    }
    const exists = accounts.some(acc => acc.code === newAccCode);
    if (exists) {
      alert(lang === 'en' ? "An account with this code already exists." : "يوجد حساب آخر بنفس هذا الرمز.");
      return;
    }

    const newAcc: ChartOfAccount = {
      id: `acc-custom-${Date.now()}`,
      code: newAccCode,
      nameEn: newAccNameEn,
      nameAr: newAccNameAr,
      type: newAccType,
      subType: newAccSubType,
      balance: Number(newAccBalance) || 0,
      isSystem: false
    };

    setAccounts([...accounts, newAcc]);
    setShowAddAccountModal(false);
    // Reset fields
    setNewAccCode('');
    setNewAccNameEn('');
    setNewAccNameAr('');
    setNewAccType('Asset');
    setNewAccSubType('');
    setNewAccBalance(0);
  };

  const handleEditAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editingAccount.code || !editingAccount.nameEn || !editingAccount.nameAr || !editingAccount.subType) {
      alert(lang === 'en' ? "Please fill all required fields." : "يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    const exists = accounts.some(acc => acc.code === editingAccount.code && acc.id !== editingAccount.id);
    if (exists) {
      alert(lang === 'en' ? "An account with this code already exists." : "يوجد حساب آخر بنفس هذا الرمز.");
      return;
    }

    setAccounts(accounts.map(acc => acc.id === editingAccount.id ? { ...editingAccount, balance: Number(editingAccount.balance) || 0 } : acc));
    setShowEditAccountModal(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    triggerConfirm(
      lang === 'en' ? "Confirm Account Deletion" : "تأكيد حذف الحساب",
      lang === 'en'
        ? `Are you sure you want to delete the account "${acc.nameEn}" (${acc.code})?\n\nThis will remove the account from the Chart of Accounts. Any journal entries referencing this account code might show errors or mismatch.`
        : `هل أنت متأكد من حذف الحساب "${acc.nameAr}" (${acc.code})؟\n\nسيؤدي ذلك لإزالة الحساب من دليل الحسابات. قد تظهر أخطاء أو عدم توازن في قيود اليومية التي تشير لهذا الحساب.`,
      () => {
        setAccounts(accounts.filter(a => a.id !== id));
      }
    );
  };

  const handleResetToStandardCoA = () => {
    triggerConfirm(
      lang === 'en' ? "Confirm Reset to Standard CoA" : "تأكيد إعادة تعيين دليل الحسابات",
      lang === 'en'
        ? "Are you sure you want to reset your Chart of Accounts to the ZATCA Standard CoA?\n\nWarning: This will delete ALL custom accounts and reset the balances of standard accounts back to initial template values. This cannot be undone."
        : "هل أنت متأكد من إعادة ضبط دليل الحسابات إلى الدليل المعتمد للهيئة؟\n\nتنبيه: سيؤدي هذا إلى حذف كافة الحسابات المخصصة وإعادة أرصدة الحسابات القياسية إلى قيمها الافتراضية. لا يمكن التراجع عن هذا الإجراء.",
      () => {
        setAccounts(JSON.parse(JSON.stringify(initialChartOfAccounts)));
      }
    );
  };

  const [activeTab, setActiveTab] = useState<'coa' | 'journal' | 'trial' | 'pl' | 'balance' | 'vouchers' | 'bank_rec'>('coa');
  const [showNewJournalForm, setShowNewJournalForm] = useState(false);

  // Voucher state & form fields
  const [showNewVoucherForm, setShowNewVoucherForm] = useState(false);
  const [vType, setVType] = useState<'CashReceipt' | 'CashPayment' | 'BankReceipt' | 'BankPayment'>('CashReceipt');
  const [vDate, setVDate] = useState(new Date().toISOString().split('T')[0]);
  const [vAmount, setVAmount] = useState<number>(0);
  const [vDesc, setVDesc] = useState('');
  const [vContactId, setVContactId] = useState('');
  const [vDebitAcc, setVDebitAcc] = useState('');
  const [vCreditAcc, setVCreditAcc] = useState('');
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<Voucher | null>(null);

  // Bank Reconciliation state
  const [recStatementDate, setRecStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [recStatementBalance, setRecStatementBalance] = useState<number>(0);
  const [recSelectedTxIds, setRecSelectedTxIds] = useState<string[]>([]);

  // Automatically pre-fill logical accounts based on voucher type selection
  React.useEffect(() => {
    if (vType === 'CashReceipt') {
      setVDebitAcc('acc-1001'); // Cash on Hand
      setVCreditAcc('acc-4001'); // Product Sales Income / Sales
    } else if (vType === 'CashPayment') {
      setVDebitAcc('acc-5201'); // Office Rental or general expense
      setVCreditAcc('acc-1001'); // Cash on Hand
    } else if (vType === 'BankReceipt') {
      setVDebitAcc('acc-1002'); // Al Rajhi Bank Account
      setVCreditAcc('acc-4001'); // Product Sales Income / Sales
    } else if (vType === 'BankPayment') {
      setVDebitAcc('acc-5201'); // Office Rental or general expense
      setVCreditAcc('acc-1002'); // Al Rajhi Bank Account
    }
  }, [vType]);

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vAmount || vAmount <= 0) {
      alert(lang === 'en' ? "Please enter a valid amount" : "الرجاء إدخال مبلغ صحيح");
      return;
    }
    if (!vDebitAcc || !vCreditAcc) {
      alert(lang === 'en' ? "Please select both debit and credit accounts" : "الرجاء اختيار الحساب المدين والدائن");
      return;
    }
    if (vDebitAcc === vCreditAcc) {
      alert(lang === 'en' ? "Debit and Credit accounts must be different" : "يجب أن يكون الحساب المدين والدائن مختلفين");
      return;
    }

    const nextVoucherNum = vouchers.length + 1;
    const typePrefix = vType === 'CashReceipt' ? 'CR' : vType === 'CashPayment' ? 'CP' : vType === 'BankReceipt' ? 'BR' : 'BP';
    const voucherNo = `${typePrefix}-2026-000${nextVoucherNum}`;
    
    const debAcc = accounts.find(a => a.id === vDebitAcc)!;
    const credAcc = accounts.find(a => a.id === vCreditAcc)!;

    const newVoucher: Voucher = {
      id: `vouch-${Date.now()}`,
      voucherNo,
      type: vType,
      date: vDate,
      amount: Number(vAmount),
      description: vDesc || `${vType} Voucher`,
      debitAccountId: vDebitAcc,
      creditAccountId: vCreditAcc,
      contactId: vContactId || undefined,
      contactType: vContactId ? (vType.endsWith('Receipt') ? 'Customer' : 'Supplier') : undefined
    };

    // 1. Post to double-entry ledger accounts!
    const updatedAccounts = accounts.map(acc => {
      let balanceAdjustment = 0;
      
      // Debit line
      if (acc.id === vDebitAcc) {
        if (acc.type === 'Asset' || acc.type === 'Expense') {
          balanceAdjustment += Number(vAmount);
        } else {
          balanceAdjustment -= Number(vAmount);
        }
      }
      
      // Credit line
      if (acc.id === vCreditAcc) {
        if (acc.type === 'Asset' || acc.type === 'Expense') {
          balanceAdjustment -= Number(vAmount);
        } else {
          balanceAdjustment += Number(vAmount);
        }
      }

      if (balanceAdjustment !== 0) {
        return {
          ...acc,
          balance: acc.balance + balanceAdjustment
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);

    // 2. Add as a Journal Entry under the hood for clean ledger auditing!
    const matchingJournal: JournalEntry = {
      id: newVoucher.id, // match voucher ID
      date: vDate,
      reference: voucherNo,
      description: `[Voucher: ${vType}] ${vDesc}`,
      isSystem: true,
      lines: [
        {
          accountId: vDebitAcc,
          accountNameEn: debAcc.nameEn,
          accountNameAr: debAcc.nameAr,
          debit: Number(vAmount),
          credit: 0
        },
        {
          accountId: vCreditAcc,
          accountNameEn: credAcc.nameEn,
          accountNameAr: credAcc.nameAr,
          debit: 0,
          credit: Number(vAmount)
        }
      ]
    };

    setJournalEntries([matchingJournal, ...journalEntries]);
    setVouchers([newVoucher, ...vouchers]);

    // Reset Form
    setVAmount(0);
    setVDesc('');
    setVContactId('');
    setShowNewVoucherForm(false);
  };

  // Journal form fields
  const [jeDate, setJeDate] = useState(new Date().toISOString().split('T')[0]);
  const [jeRef, setJeRef] = useState('');
  const [jeDesc, setJeDesc] = useState('');
  const [jeLines, setJeLines] = useState<JournalLine[]>([
    { accountId: '', accountNameEn: '', accountNameAr: '', debit: 0, credit: 0 },
    { accountId: '', accountNameEn: '', accountNameAr: '', debit: 0, credit: 0 }
  ]);

  const totalDebits = jeLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = jeLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  // Add line to journal
  const addJeLine = () => {
    setJeLines([...jeLines, { accountId: '', accountNameEn: '', accountNameAr: '', debit: 0, credit: 0 }]);
  };

  // Remove line from journal
  const removeJeLine = (index: number) => {
    if (jeLines.length <= 2) return;
    setJeLines(jeLines.filter((_, i) => i !== index));
  };

  // Update line field
  const updateJeLine = (index: number, field: string, value: any) => {
    const updated = [...jeLines];
    if (field === 'accountId') {
      const acc = accounts.find(a => a.id === value);
      if (acc) {
        updated[index].accountId = value;
        updated[index].accountNameEn = acc.nameEn;
        updated[index].accountNameAr = acc.nameAr;
      }
    } else if (field === 'debit') {
      updated[index].debit = Number(value);
      updated[index].credit = 0; // standard double entry line helper
    } else if (field === 'credit') {
      updated[index].credit = Number(value);
      updated[index].debit = 0;
    }
    setJeLines(updated);
  };

  // Submit Journal Entry (Ledger Posting)
  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      alert(lang === 'en' 
        ? "Mismatched Journal Entry! Debits must exactly equal Credits to preserve ledger balance." 
        : "خطأ في توازن القيد! يجب أن يتساوى المدين مع الدائن لحفظ توازن شجرة الحسابات.");
      return;
    }

    if (jeLines.some(l => !l.accountId)) {
      alert(lang === 'en' ? "Please select accounts for all lines" : "يرجى تحديد حساب لكل سطر");
      return;
    }

    const newJournal: JournalEntry = {
      id: `je-manual-${Date.now()}`,
      date: jeDate,
      reference: jeRef || `JE-${Date.now().toString().slice(-4)}`,
      description: jeDesc,
      isSystem: false,
      lines: jeLines
    };

    // Update Account balances based on manual entry debits/credits
    const updatedAccounts = accounts.map(acc => {
      const lineDebits = jeLines.filter(l => l.accountId === acc.id).reduce((sum, l) => sum + l.debit, 0);
      const lineCredits = jeLines.filter(l => l.accountId === acc.id).reduce((sum, l) => sum + l.credit, 0);
      
      if (lineDebits > 0 || lineCredits > 0) {
        // Debit increases Asset & Expense, Credit decreases them
        // Credit increases Liability, Equity, & Revenue, Debit decreases them
        let balanceAdjustment = 0;
        if (acc.type === 'Asset' || acc.type === 'Expense') {
          balanceAdjustment = lineDebits - lineCredits;
        } else {
          balanceAdjustment = lineCredits - lineDebits;
        }
        return {
          ...acc,
          balance: acc.balance + balanceAdjustment
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setJournalEntries([newJournal, ...journalEntries]);

    // Reset Form
    setJeRef('');
    setJeDesc('');
    setJeLines([
      { accountId: '', accountNameEn: '', accountNameAr: '', debit: 0, credit: 0 },
      { accountId: '', accountNameEn: '', accountNameAr: '', debit: 0, credit: 0 }
    ]);
    setShowNewJournalForm(false);
  };

  // Computations for Financial Reports
  // 1. Profit & Loss: Revenues vs COGS vs Expenses
  const revenueAccounts = accounts.filter(a => a.type === 'Revenue');
  const cogsAccounts = accounts.filter(a => a.subType === 'COGS');
  const expenseAccounts = accounts.filter(a => a.type === 'Expense' && a.subType !== 'COGS');

  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCOGS = cogsAccounts.reduce((sum, a) => sum + a.balance, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
  const netIncome = grossProfit - totalExpenses;

  // 2. Balance Sheet Assets vs Liabilities vs Equity
  const assetAccounts = accounts.filter(a => a.type === 'Asset');
  const liabilityAccounts = accounts.filter(a => a.type === 'Liability');
  const equityAccounts = accounts.filter(a => a.type === 'Equity');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
  
  // Note: Net income is added to Retained Earnings on the Balance Sheet dynamically!
  const baseEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = baseEquity + netIncome; // dynamically balanced!

  return (
    <div className="space-y-6" id="accounting-workspace">
      
      {/* Tab Navigation bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-2">
        {[
          { id: 'coa', labelEn: "Chart of Accounts", labelAr: "دليل الحسابات" },
          { id: 'journal', labelEn: "Journal Entries", labelAr: "قيود اليومية" },
          { id: 'trial', labelEn: "Trial Balance", labelAr: "ميزان المراجعة" },
          { id: 'pl', labelEn: "Profit & Loss", labelAr: "الأرباح والخسائر" },
          { id: 'balance', labelEn: "Balance Sheet", labelAr: "الميزانية العمومية" },
          { id: 'vouchers', labelEn: "Vouchers & Receipts", labelAr: "السندات والمقبوضات" },
          { id: 'bank_rec', labelEn: "Bank Reconciliation", labelAr: "المطابقة البنكية" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setShowNewJournalForm(false); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {lang === 'en' ? tab.labelEn : tab.labelAr}
          </button>
        ))}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* TAB 1: Chart of Accounts */}
        {activeTab === 'coa' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {lang === 'en' ? "KSA Standardized Chart of Accounts" : "دليل الحسابات المعتمد للمملكة"}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {lang === 'en' ? "Integrated system ledger supporting multi-dimensional ledger mappings" : "نظام حسابات مالي متكامل يدعم التقارير ومطابقة القيد المالي"}
                </p>
              </div>

              {/* COA Designer Actions Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToStandardCoA}
                  className="px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title={lang === 'en' ? "Reset to ZATCA Standard CoA" : "إعادة تعيين لدليل حسابات الهيئة القياسي"}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'en' ? "Standard CoA" : "الدليل القياسي"}</span>
                </button>

                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? "Add Account" : "إضافة حساب"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => {
                const accountsOfType = accounts.filter(acc => acc.type === type);
                const sumType = accountsOfType.reduce((sum, acc) => sum + acc.balance, 0);
                return (
                  <div key={type} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{type}</span>
                      <h4 className="text-slate-800 font-bold text-xs mt-1">
                        {lang === 'en' 
                          ? `${accountsOfType.length} Accounts` 
                          : `${accountsOfType.length} حسابات`}
                      </h4>
                    </div>
                    <div className="mt-3 text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {sumType.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tree Table */}
            <div className="overflow-x-auto border border-slate-50 rounded-xl mt-4">
              <table className="w-full text-left text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                    <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.accountCode}</th>
                    <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.accountName}</th>
                    <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.accountType}</th>
                    <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{lang === 'en' ? "Balance (SAR)" : "الرصيد (ر.س)"}</th>
                    <th className={`p-3 text-center w-24`}>{lang === 'en' ? "Actions" : "العمليات"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-500">{acc.code}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">
                          {lang === 'en' ? acc.nameEn : acc.nameAr}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{acc.subType}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.type === 'Asset' ? 'bg-blue-50 text-blue-700' :
                          acc.type === 'Liability' ? 'bg-orange-50 text-orange-700' :
                          acc.type === 'Equity' ? 'bg-purple-50 text-purple-700' :
                          acc.type === 'Revenue' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingAccount(acc);
                              setShowEditAccountModal(true);
                            }}
                            className="p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'en' ? "Edit Account" : "تعديل الحساب"}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'en' ? "Delete Account" : "حذف الحساب"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal for Add Account */}
            {showAddAccountModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 text-start space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                    <h3 className="font-bold text-slate-950 text-base">
                      {lang === 'en' ? "Add New Account" : "إضافة حساب جديد"}
                    </h3>
                    <button 
                      onClick={() => setShowAddAccountModal(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-lg text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleAddAccount} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'en' ? "Account Code *" : "رمز الحساب *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={newAccCode}
                          onChange={(e) => setNewAccCode(e.target.value)}
                          placeholder="e.g. 1005"
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'en' ? "Account Type *" : "نوع الحساب *"}
                        </label>
                        <select
                          value={newAccType}
                          onChange={(e: any) => setNewAccType(e.target.value)}
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        >
                          <option value="Asset">Asset (أصول)</option>
                          <option value="Liability">Liability (خصوم)</option>
                          <option value="Equity">Equity (حقوق ملكية)</option>
                          <option value="Revenue">Revenue (إيرادات)</option>
                          <option value="Expense">Expense (مصروفات)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Account Sub-Type / Category *" : "التصنيف الفرعي للحساب *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccSubType}
                        onChange={(e) => setNewAccSubType(e.target.value)}
                        placeholder="e.g. Cash, Bank, COGS, Utilities"
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Account Name (English) *" : "اسم الحساب (إنجليزي) *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccNameEn}
                        onChange={(e) => setNewAccNameEn(e.target.value)}
                        placeholder="e.g. Petty Cash Box B"
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Account Name (Arabic) *" : "اسم الحساب (عربي) *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccNameAr}
                        onChange={(e) => setNewAccNameAr(e.target.value)}
                        placeholder="مثال: صندوق النثرية ب"
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Initial Balance (SAR)" : "الرصيد الافتتاحي (ر.س)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newAccBalance}
                        onChange={(e) => setNewAccBalance(Number(e.target.value))}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-3 border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddAccountModal(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      >
                        {lang === 'en' ? "Cancel" : "إلغاء"}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl transition-colors cursor-pointer"
                      >
                        {lang === 'en' ? "Create Account" : "إنشاء الحساب"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Edit Account */}
            {showEditAccountModal && editingAccount && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 text-start space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                    <h3 className="font-bold text-slate-950 text-base">
                      {lang === 'en' ? "Edit Account" : "تعديل الحساب"}
                    </h3>
                    <button 
                      onClick={() => { setShowEditAccountModal(false); setEditingAccount(null); }}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-lg text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleEditAccountSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'en' ? "Account Code *" : "رمز الحساب *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={editingAccount.code}
                          onChange={(e) => setEditingAccount({ ...editingAccount, code: e.target.value })}
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'en' ? "Account Type *" : "نوع الحساب *"}
                        </label>
                        <select
                          value={editingAccount.type}
                          onChange={(e: any) => setEditingAccount({ ...editingAccount, type: e.target.value })}
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        >
                          <option value="Asset">Asset (أصول)</option>
                          <option value="Liability">Liability (خصوم)</option>
                          <option value="Equity">Equity (حقوق ملكية)</option>
                          <option value="Revenue">Revenue (إيرادات)</option>
                          <option value="Expense">Expense (مصروفات)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Account Sub-Type / Category *" : "التصنيف الفرعي للحساب *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAccount.subType}
                        onChange={(e) => setEditingAccount({ ...editingAccount, subType: e.target.value })}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Account Name (English) *" : "اسم الحساب (إنجليزي) *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAccount.nameEn}
                        onChange={(e) => setEditingAccount({ ...editingAccount, nameEn: e.target.value })}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Account Name (Arabic) *" : "اسم الحساب (عربي) *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAccount.nameAr}
                        onChange={(e) => setEditingAccount({ ...editingAccount, nameAr: e.target.value })}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'en' ? "Account Balance (SAR)" : "الرصيد المالي الحالي (ر.س)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingAccount.balance}
                        onChange={(e) => setEditingAccount({ ...editingAccount, balance: Number(e.target.value) })}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-3 border-slate-100">
                      <button
                        type="button"
                        onClick={() => { setShowEditAccountModal(false); setEditingAccount(null); }}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      >
                        {lang === 'en' ? "Cancel" : "إلغاء"}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl transition-colors cursor-pointer"
                      >
                        {lang === 'en' ? "Save Changes" : "حفظ التعديلات"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Journal Entries */}
        {activeTab === 'journal' && (
          <div className="space-y-4">
            
            {/* Entry Form Toggle */}
            {!showNewJournalForm ? (
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'en' ? "Journal Ledger Journal" : "دفتر اليومية العام للقيود المالية"}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'en' ? "Verify manual adjustments or system posted transactions" : "مراجعة تسويات القيود اليدوية والمعاملات المصدرة آلياً"}
                  </p>
                </div>
                <button
                  onClick={() => setShowNewJournalForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-indigo-700 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'en' ? "Post Journal Entry" : "إضافة قيد يومية يدوي"}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePostJournal} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {lang === 'en' ? "New Double-Entry Journal Document" : "مستند قيد محاسبي مزدوج جديد"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">{t.date}</label>
                    <input
                      type="date"
                      value={jeDate}
                      onChange={(e) => setJeDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 p-2 border border-slate-100 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">{t.reference}</label>
                    <input
                      type="text"
                      placeholder="e.g. JE-RENT-Q2"
                      value={jeRef}
                      onChange={(e) => setJeRef(e.target.value)}
                      required
                      className="w-full bg-slate-50 p-2 border border-slate-100 rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">{t.description}</label>
                    <input
                      type="text"
                      placeholder="Narrative explanation"
                      value={jeDesc}
                      onChange={(e) => setJeDesc(e.target.value)}
                      required
                      className="w-full bg-slate-50 p-2 border border-slate-100 rounded-xl"
                    />
                  </div>
                </div>

                {/* JOURNAL LINES */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{lang === 'en' ? "Debit & Credit Lines" : "الأطراف المدينة والدائنة"}</span>
                    <button
                      type="button"
                      onClick={addJeLine}
                      className="text-[10px] text-indigo-600 font-bold hover:underline animate-pulse"
                    >
                      + {lang === 'en' ? "Add Entry Line" : "إضافة سطر حساب"}
                    </button>
                  </div>

                  {jeLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="col-span-5 text-xs">
                        <select
                          value={line.accountId}
                          onChange={(e) => updateJeLine(idx, 'accountId', e.target.value)}
                          required
                          className="w-full bg-white p-1.5 border border-slate-100 rounded-lg text-xs"
                        >
                          <option value="">-- {lang === 'en' ? 'Select General Ledger Account' : 'اختر الحساب'} --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {lang === 'en' ? acc.nameEn : acc.nameAr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3 text-xs">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={t.debit}
                          value={line.debit || ''}
                          onChange={(e) => updateJeLine(idx, 'debit', e.target.value)}
                          disabled={line.credit > 0}
                          className="w-full bg-slate-100 p-1.5 border-none rounded-xl text-xs text-right font-mono disabled:opacity-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-3 text-xs">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={t.credit}
                          value={line.credit || ''}
                          onChange={(e) => updateJeLine(idx, 'credit', e.target.value)}
                          disabled={line.debit > 0}
                          className="w-full bg-slate-100 p-1.5 border-none rounded-xl text-xs text-right font-mono disabled:opacity-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeJeLine(idx)}
                          disabled={jeLines.length <= 2}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BALANCE CHECKS */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-slate-900 text-white rounded-xl text-xs gap-3">
                  <div className="flex gap-4">
                    <div>
                      <div className="opacity-70">{lang === 'en' ? "Total Debits" : "إجمالي المدين"}</div>
                      <div className="font-mono text-sm font-bold text-blue-300">{totalDebits.toFixed(2)} SAR</div>
                    </div>
                    <div>
                      <div className="opacity-70">{lang === 'en' ? "Total Credits" : "إجمالي الدائن"}</div>
                      <div className="font-mono text-sm font-bold text-blue-300">{totalCredits.toFixed(2)} SAR</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBalanced ? (
                      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        {lang === 'en' ? "Balanced & Ready" : "متوازن وجاهز للترحيل"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-lg font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {lang === 'en' 
                          ? `Unbalanced: Diff ${Math.abs(totalDebits - totalCredits).toFixed(2)}` 
                          : `غير متوازن: الفرق ${Math.abs(totalDebits - totalCredits).toFixed(2)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => setShowNewJournalForm(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!isBalanced}
                    className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                  >
                    {lang === 'en' ? "Post to Ledger" : "ترحيل قيد اليومية"}
                  </button>
                </div>
              </form>
            )}

            {/* List of journal entries */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h4 className="font-bold text-slate-800 text-xs">
                {lang === 'en' ? "Chronological Journal History" : "سجل قيود اليومية التاريخية"}
              </h4>

              <div className="space-y-4">
                {journalEntries.map(je => (
                  <div key={je.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/20">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-2 mb-3 text-xs gap-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{je.reference}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-medium">{je.date}</span>
                          {je.isSystem && (
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              {lang === 'en' ? 'Auto-System' : 'آلي للنظام'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteJournalEntry(je.id)}
                          className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title={lang === 'en' ? "Delete Journal Entry" : "حذف قيد اليومية"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-slate-600 italic font-medium">{je.description}</span>
                    </div>

                    <div className="space-y-1.5 text-[10px]">
                      {je.lines.map((l, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 text-slate-700">
                          <span className="col-span-6 font-semibold">
                            {lang === 'en' ? l.accountNameEn : l.accountNameAr}
                          </span>
                          <span className="col-span-3 text-right font-mono font-bold">
                            {l.debit > 0 ? l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </span>
                          <span className="col-span-3 text-right font-mono font-bold text-slate-500">
                            {l.credit > 0 ? l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Trial Balance */}
        {activeTab === 'trial' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{t.trialBalance}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Consolidated balance sheet listing for verification" : "ميزان المراجعة المطابق مجمعاً لكافة الحسابات الفرعية والرئيسية"}
              </p>
            </div>

            <table className="w-full text-xs text-left" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">{t.accountCode}</th>
                  <th className="p-3">{t.accountName}</th>
                  <th className="p-3 text-right">{t.debit} (SAR)</th>
                  <th className="p-3 text-right">{t.credit} (SAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map(acc => {
                  const isDebitNature = acc.type === 'Asset' || acc.type === 'Expense';
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/30 font-medium">
                      <td className="p-3 font-mono text-slate-500">{acc.code}</td>
                      <td className="p-3">{lang === 'en' ? acc.nameEn : acc.nameAr}</td>
                      <td className="p-3 text-right font-mono text-slate-900">
                        {isDebitNature ? acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {!isDebitNature ? acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {/* Aggregate totals */}
                <tr className="bg-slate-900 text-white font-bold font-mono">
                  <td className="p-3" colSpan={2}>{lang === 'en' ? 'Balanced Totals' : 'الإجمالي المتطابق'}</td>
                  <td className="p-3 text-right">
                    {accounts
                      .filter(a => a.type === 'Asset' || a.type === 'Expense')
                      .reduce((s, a) => s + a.balance, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-blue-400">
                    {accounts
                      .filter(a => a.type !== 'Asset' && a.type !== 'Expense')
                      .reduce((s, a) => s + a.balance, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: Profit & Loss (Income Statement) */}
        {activeTab === 'pl' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{t.profitLoss}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Standard format for June fiscal period" : "قائمة الأرباح والخسائر الدورية للفترة المالية الحالية"}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* REVENUE SECTION */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 mb-2 uppercase text-blue-600">
                  {lang === 'en' ? "1. REVENUES & INCOME" : "١. الإيرادات والمبيعات"}
                </h4>
                {revenueAccounts.map(acc => (
                  <div key={acc.id} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                    <span>{lang === 'en' ? acc.nameEn : acc.nameAr}</span>
                    <span className="font-mono font-semibold">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 bg-slate-50 font-extrabold border-t border-slate-200 mt-2">
                  <span>{lang === 'en' ? 'Total Operating Revenue' : 'إجمالي المبيعات والتشغيل'}</span>
                  <span className="font-mono">{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>

              {/* COGS SECTION */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 mb-2 uppercase text-rose-500">
                  {lang === 'en' ? "2. COST OF SALES" : "٢. تكلفة المبيعات والبضائع"}
                </h4>
                {cogsAccounts.map(acc => (
                  <div key={acc.id} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                    <span>{lang === 'en' ? acc.nameEn : acc.nameAr}</span>
                    <span className="font-mono font-semibold">-{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 bg-slate-50 font-extrabold border-t border-slate-200 mt-2">
                  <span>{lang === 'en' ? 'Gross Profit Margin' : 'هامش إجمالي الربح'}</span>
                  <span className="font-mono text-emerald-600">{grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>

              {/* EXPENSES SECTION */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 mb-2 uppercase text-orange-600">
                  {lang === 'en' ? "3. GENERAL & ADMINISTRATIVE EXPENSES" : "٣. المصاريف الإدارية والعمومية"}
                </h4>
                {expenseAccounts.map(acc => (
                  <div key={acc.id} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                    <span>{lang === 'en' ? acc.nameEn : acc.nameAr}</span>
                    <span className="font-mono font-semibold">-{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 bg-slate-50 font-extrabold border-t border-slate-200 mt-2">
                  <span>{lang === 'en' ? 'Total Operating Expenses' : 'إجمالي النفقات التشغيلية'}</span>
                  <span className="font-mono">-{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>

              {/* NET INCOME */}
              <div className="bg-slate-950 text-white p-4 rounded-xl flex items-center justify-between font-bold text-sm">
                <span>{lang === 'en' ? "NET PERIOD INCOME / PROFIT" : "صافي ربح الفترة المالية الحالية"}</span>
                <span className={`font-mono ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Balance Sheet */}
        {activeTab === 'balance' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t.balanceSheet}</h3>
                <p className="text-[10px] text-slate-400">
                  {lang === 'en' ? "Unadjusted dynamic balance sheet audit" : "الميزانية العمومية الكلية المطابقة للممتلكات والخصوم وحقوق الملكية"}
                </p>
              </div>

              {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.05 ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded flex items-center gap-1 border border-emerald-100">
                  <FileCheck className="w-3 h-3" /> Balanced (أصول متطابقة)
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded flex items-center gap-1 border border-rose-100">
                  <AlertCircle className="w-3 h-3" /> Mismatched Equation
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* ASSETS COLUMN */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 uppercase text-blue-600">
                  {lang === 'en' ? "A. ASSETS" : "أ. الأصول والممتلكات"}
                </h4>
                {assetAccounts.map(acc => (
                  <div key={acc.id} className="flex justify-between py-1 hover:bg-slate-50 px-2 rounded">
                    <span>{lang === 'en' ? acc.nameEn : acc.nameAr}</span>
                    <span className="font-mono font-semibold">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 bg-slate-50 font-extrabold border-t border-slate-200">
                  <span>{lang === 'en' ? 'Total Assets (الكلية)' : 'إجمالي الأصول والموجودات'}</span>
                  <span className="font-mono text-blue-700">{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY COLUMN */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 uppercase text-orange-600">
                  {lang === 'en' ? "B. LIABILITIES & EQUITIES" : "ب. الالتزامات وحقوق الملكية"}
                </h4>
                
                {/* Liabilities */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'en' ? 'Current Liabilities' : 'الالتزامات المطلوبة'}</span>
                  {liabilityAccounts.map(acc => (
                    <div key={acc.id} className="flex justify-between py-1 hover:bg-slate-50 px-2 rounded">
                      <span>{lang === 'en' ? acc.nameEn : acc.nameAr}</span>
                      <span className="font-mono font-semibold">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    </div>
                  ))}
                </div>

                {/* Equities */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'en' ? 'Shareholder Equity' : 'حقوق الملكية ورأس المال'}</span>
                  {equityAccounts.map(acc => (
                    <div key={acc.id} className="flex justify-between py-1 hover:bg-slate-50 px-2 rounded">
                      <span>{lang === 'en' ? acc.nameEn : acc.nameAr}</span>
                      <span className="font-mono font-semibold">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    </div>
                  ))}
                  {/* Dynamic Net Profit Line */}
                  <div className="flex justify-between py-1 hover:bg-slate-50 px-2 rounded text-blue-600 font-medium">
                    <span>{lang === 'en' ? 'Net Income (Year-to-Date)' : 'صافي الدخل السنوي للعام'}</span>
                    <span className="font-mono font-semibold">{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                  </div>
                </div>

                <div className="flex justify-between py-2 px-2 bg-slate-50 font-extrabold border-t border-slate-200">
                  <span>{lang === 'en' ? 'Total Liabilities & Equity' : 'إجمالي الخصوم وحقوق الملكية'}</span>
                  <span className="font-mono text-blue-700">{(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Vouchers & Receipts */}
        {activeTab === 'vouchers' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {lang === 'en' ? "Accounting Cash/Bank Vouchers & Receipts" : "إدارة السندات المحاسبية والمقبوضات"}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {lang === 'en' 
                    ? "Generate and print certified Cash Receipts, Payments, and Bank transfer vouchers integrated directly with ledger balances."
                    : "إصدار وطباعة سندات القبض والصرف النقدية والبنكية مع ترحيلها تلقائياً لدليل الحسابات ودفاتر الأستاذ."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewVoucherForm(!showNewVoucherForm)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {lang === 'en' ? "Create New Voucher" : "إنشاء سند جديد"}
              </button>
            </div>

            {showNewVoucherForm && (
              <form onSubmit={handleCreateVoucher} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs animate-fadeIn">
                <div className="col-span-1 md:col-span-4 flex items-center justify-between border-b border-slate-200 pb-2 mb-1">
                  <h4 className="font-bold text-slate-900">
                    {lang === 'en' ? "New Voucher Details" : "تفاصيل السند الجديد"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowNewVoucherForm(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ×
                  </button>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'en' ? "Voucher Type" : "نوع السند"}</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value as any)}
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="CashReceipt">{lang === 'en' ? "Cash Receipt" : "سند قبض نقدي"}</option>
                    <option value="CashPayment">{lang === 'en' ? "Cash Payment" : "سند صرف نقدي"}</option>
                    <option value="BankReceipt">{lang === 'en' ? "Bank Receipt" : "سند قبض بنكي"}</option>
                    <option value="BankPayment">{lang === 'en' ? "Bank Payment" : "سند صرف بنكي"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'en' ? "Date" : "التاريخ"}</label>
                  <input
                    type="date"
                    value={vDate}
                    onChange={(e) => setVDate(e.target.value)}
                    required
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === 'en' ? "Amount (SAR)" : "المبلغ (ريال)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={vAmount || ''}
                    onChange={(e) => setVAmount(Number(e.target.value))}
                    required
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === 'en' ? "Contact / Third Party" : "الجهة / الطرف الثالث"}
                  </label>
                  <select
                    value={vContactId}
                    onChange={(e) => setVContactId(e.target.value)}
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- {lang === 'en' ? "None / General" : "لا يوجد / عام"} --</option>
                    {vType.endsWith('Receipt') ? (
                      customers.map(c => (
                        <option key={c.id} value={c.id}>{lang === 'en' ? c.nameEn : c.nameAr}</option>
                      ))
                    ) : (
                      suppliers.map(s => (
                        <option key={s.id} value={s.id}>{lang === 'en' ? s.nameEn : s.nameAr}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === 'en' ? "Debit Account (Receives Value)" : "الحساب المدين (المستلم للقيمة)"}
                  </label>
                  <select
                    value={vDebitAcc}
                    onChange={(e) => setVDebitAcc(e.target.value)}
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {lang === 'en' ? acc.nameEn : acc.nameAr} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === 'en' ? "Credit Account (Provides Value)" : "الحساب الدائن (المعطي للقيمة)"}
                  </label>
                  <select
                    value={vCreditAcc}
                    onChange={(e) => setVCreditAcc(e.target.value)}
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {lang === 'en' ? acc.nameEn : acc.nameAr} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 md:col-span-4">
                  <label className="block text-slate-500 font-bold mb-1">
                    {lang === 'en' ? "Description / Particulars" : "البيان / تفاصيل السند"}
                  </label>
                  <textarea
                    rows={2}
                    value={vDesc}
                    onChange={(e) => setVDesc(e.target.value)}
                    required
                    placeholder={lang === 'en' ? "Type narrative description for voucher posting" : "اكتب بياناً تفصيلياً لأغراض الترحيل المحاسبي"}
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="col-span-1 md:col-span-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewVoucherForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    {lang === 'en' ? "Cancel" : "إلغاء"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                  >
                    {lang === 'en' ? "Post & Save Voucher" : "ترحيل وحفظ السند"}
                  </button>
                </div>
              </form>
            )}

            {/* Voucher List Table */}
            {vouchers.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                {lang === 'en' ? "No vouchers found. Click 'Create New Voucher' to start posting." : "لا توجد سندات مسجلة حالياً. اضغط على 'إنشاء سند جديد' للبدء."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-start border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-start">
                      <th className="p-3 text-start">{lang === 'en' ? "Voucher No" : "رقم السند"}</th>
                      <th className="p-3 text-start">{lang === 'en' ? "Date" : "التاريخ"}</th>
                      <th className="p-3 text-start">{lang === 'en' ? "Type" : "نوع السند"}</th>
                      <th className="p-3 text-start">{lang === 'en' ? "Particulars" : "البيان"}</th>
                      <th className="p-3 text-end">{lang === 'en' ? "Debit Account" : "المدين"}</th>
                      <th className="p-3 text-end">{lang === 'en' ? "Credit Account" : "الدائن"}</th>
                      <th className="p-3 text-end font-bold">{lang === 'en' ? "Amount" : "القيمة"}</th>
                      <th className="p-3 text-center">{lang === 'en' ? "Actions" : "الإجراءات"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => {
                      const debName = accounts.find(a => a.id === v.debitAccountId);
                      const credName = accounts.find(a => a.id === v.creditAccountId);
                      return (
                        <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-900">{v.voucherNo}</td>
                          <td className="p-3 text-slate-500">{v.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold ${
                              v.type === 'CashReceipt' ? 'bg-green-100 text-green-800' :
                              v.type === 'CashPayment' ? 'bg-orange-100 text-orange-800' :
                              v.type === 'BankReceipt' ? 'bg-blue-100 text-blue-800' :
                              'bg-indigo-100 text-indigo-800'
                            }`}>
                              {v.type === 'CashReceipt' ? (lang === 'en' ? "Cash Receipt" : "سند قبض نقدي") :
                               v.type === 'CashPayment' ? (lang === 'en' ? "Cash Payment" : "سند صرف نقدي") :
                               v.type === 'BankReceipt' ? (lang === 'en' ? "Bank Receipt" : "سند قبض بنكي") :
                               (lang === 'en' ? "Bank Payment" : "سند صرف بنكي")}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-medium max-w-[180px] truncate" title={v.description}>{v.description}</td>
                          <td className="p-3 text-end font-mono text-slate-500">
                            {debName ? (lang === 'en' ? debName.nameEn : debName.nameAr) : "General Asset"}
                          </td>
                          <td className="p-3 text-end font-mono text-slate-500">
                            {credName ? (lang === 'en' ? credName.nameEn : credName.nameAr) : "General Income"}
                          </td>
                          <td className="p-3 text-end font-mono font-extrabold text-slate-950 text-xs">
                            {v.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                          </td>
                          <td className="p-3 text-center flex justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedVoucherForPrint(v)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title={lang === 'en' ? "Print Voucher" : "طباعة السند"}
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                triggerConfirm(
                                  lang === 'en' ? "Confirm Voucher Deletion" : "تأكيد حذف السند",
                                  lang === 'en' ? "Are you sure you want to delete this voucher? This will reverse the associated ledger posting." : "هل أنت متأكد من حذف هذا السند؟ سيؤدي ذلك لعكس حركات دفتر الأستاذ المرتبطة به.",
                                  () => {
                                    // Reverse posting
                                    const reversedAccounts = accounts.map(acc => {
                                      let balanceAdjustment = 0;
                                      if (acc.id === v.debitAccountId) {
                                        if (acc.type === 'Asset' || acc.type === 'Expense') {
                                          balanceAdjustment -= Number(v.amount);
                                        } else {
                                          balanceAdjustment += Number(v.amount);
                                        }
                                      }
                                      if (acc.id === v.creditAccountId) {
                                        if (acc.type === 'Asset' || acc.type === 'Expense') {
                                          balanceAdjustment += Number(v.amount);
                                        } else {
                                          balanceAdjustment -= Number(v.amount);
                                        }
                                      }
                                      if (balanceAdjustment !== 0) {
                                        return { ...acc, balance: acc.balance + balanceAdjustment };
                                      }
                                      return acc;
                                    });
                                    setAccounts(reversedAccounts);
                                    setVouchers(vouchers.filter(item => item.id !== v.id));
                                    setJournalEntries(journalEntries.filter(je => je.id !== v.id));
                                  }
                                );
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title={lang === 'en' ? "Delete & Reverse" : "حذف السند وعكس أثره"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Voucher Printer Modal overlay */}
            {selectedVoucherForPrint && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 text-xs">
                      {lang === 'en' ? "Print preview: " : "معاينة الطباعة: "} {selectedVoucherForPrint.voucherNo}
                    </span>
                    <button
                      onClick={() => setSelectedVoucherForPrint(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                    >
                      ×
                    </button>
                  </div>

                  {/* Certified Voucher A4 Printout Sheet */}
                  <div id="voucher-printout-sheet" className="p-5 border border-slate-100 bg-amber-50/5 rounded-xl space-y-4 text-xs text-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                          {selectedVoucherForPrint.type.includes('Receipt') ? "Receipt Voucher" : "Payment Voucher"}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {selectedVoucherForPrint.type.includes('Receipt') ? "سند قبض محاسبي معتمد" : "سند صرف محاسبي معتمد"}
                        </span>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold text-slate-900 text-sm">{selectedVoucherForPrint.voucherNo}</div>
                        <div className="text-[10px] text-slate-500">Date/التاريخ: {selectedVoucherForPrint.date}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg text-[10px]">
                      <div>
                        <span className="text-slate-400 block font-bold">DEBIT ACCOUNT / الحساب المدين</span>
                        <span className="font-mono text-slate-800">
                          {accounts.find(a => a.id === selectedVoucherForPrint.debitAccountId)?.code} - {
                            lang === 'en' 
                              ? accounts.find(a => a.id === selectedVoucherForPrint.debitAccountId)?.nameEn 
                              : accounts.find(a => a.id === selectedVoucherForPrint.debitAccountId)?.nameAr
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">CREDIT ACCOUNT / الحساب الدائن</span>
                        <span className="font-mono text-slate-800">
                          {accounts.find(a => a.id === selectedVoucherForPrint.creditAccountId)?.code} - {
                            lang === 'en' 
                              ? accounts.find(a => a.id === selectedVoucherForPrint.creditAccountId)?.nameEn 
                              : accounts.find(a => a.id === selectedVoucherForPrint.creditAccountId)?.nameAr
                          }
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border-b border-slate-100 pb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{lang === 'en' ? "Amount: " : "المبلغ: "}</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {selectedVoucherForPrint.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{lang === 'en' ? "Narration / Particulars:" : "البيان التفصيلي للعملية:"}</span>
                        <p className="bg-slate-50 p-2 rounded text-slate-700 font-medium">{selectedVoucherForPrint.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[9px] pt-4 text-slate-500 font-bold">
                      <div>
                        <div className="h-10 border-b border-slate-300 border-dashed"></div>
                        <span className="mt-1 block">{lang === 'en' ? "Prepared By" : "أعد بواسطة"}</span>
                      </div>
                      <div>
                        <div className="h-10 border-b border-slate-300 border-dashed"></div>
                        <span className="mt-1 block">{lang === 'en' ? "Reviewed By" : "راجع بواسطة"}</span>
                      </div>
                      <div>
                        <div className="h-10 border-b border-slate-300 border-dashed"></div>
                        <span className="mt-1 block">{lang === 'en' ? "Authorized Stamp" : "الختم الرسمي"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setSelectedVoucherForPrint(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      {lang === 'en' ? "Close" : "إغلاق"}
                    </button>
                    <button
                      onClick={() => {
                        const printContent = document.getElementById('voucher-printout-sheet');
                        if (printContent) {
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.write(`
                              <html>
                                <head>
                                  <title>Print Voucher - ${selectedVoucherForPrint.voucherNo}</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; color: #333; }
                                    .p-5 { padding: 20px; border: 1px solid #ddd; border-radius: 12px; }
                                    .flex { display: flex; justify-content: space-between; }
                                    .text-end { text-align: right; }
                                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                                    .bg-slate-50 { background: #f8fafc; padding: 15px; border-radius: 8px; }
                                    .border-b { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
                                    .font-mono { font-family: monospace; }
                                    .font-extrabold { font-weight: 800; }
                                    .text-sm { font-size: 14px; }
                                    .text-slate-400 { color: #94a3b8; }
                                    .text-slate-500 { color: #64748b; }
                                    .h-10 { height: 40px; }
                                    .border-dashed { border-style: dashed; }
                                    .border-slate-300 { border-color: #cbd5e1; }
                                    .block { display: block; }
                                    .mt-1 { margin-top: 4px; }
                                    .pt-4 { padding-top: 16px; }
                                    .grid-cols-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
                                    .gap-2 { gap: 8px; }
                                    .text-center { text-align: center; }
                                  </style>
                                </head>
                                <body onload="window.print(); window.close();">
                                  ${printContent.innerHTML}
                                </body>
                              </html>
                            `);
                            win.document.close();
                          }
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      {lang === 'en' ? "Print Now" : "طباعة الآن"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: Bank Reconciliation */}
        {activeTab === 'bank_rec' && (() => {
          // Find Rajhi bank account
          const bankAccount = accounts.find(a => a.id === 'acc-1002') || { balance: 0 };
          
          // Get bank-affecting journal entry lines
          const bankTransactions: {
            id: string;
            date: string;
            ref: string;
            desc: string;
            debit: number;
            credit: number;
          }[] = [];

          journalEntries.forEach(entry => {
            entry.lines.forEach((line, idx) => {
              if (line.accountId === 'acc-1002') {
                bankTransactions.push({
                  id: `${entry.id}-${idx}`,
                  date: entry.date,
                  ref: entry.reference,
                  desc: entry.description,
                  debit: line.debit,
                  credit: line.credit
                });
              }
            });
          });

          const reconciledSum = bankTransactions
            .filter(tx => recSelectedTxIds.includes(tx.id))
            .reduce((sum, tx) => sum + (tx.debit - tx.credit), 0);

          // Al Rajhi bank balance defaults to 342000 SAR as starting point
          const reconciledLedgerBalance = 342000 + reconciledSum;
          const diff = recStatementBalance - reconciledLedgerBalance;
          const isReconciled = Math.abs(diff) < 0.01;

          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {lang === 'en' ? "Bank Statement Reconciliation Centre" : "مركز مطابقة كشوفات الحسابات البنكية"}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {lang === 'en' 
                    ? "Verify bank statements against general ledger accounts. Tick transactions that appear on your statement to clear them."
                    : "مطابقة كشوفات الحساب البنكي الرسمية مع الأرصدة وقيود اليومية. حدد الحركات التي تظهر في كشف حسابك لتسويتها."}
                </p>
              </div>

              {/* KPI metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold uppercase">{lang === 'en' ? "Ledger Bank Balance" : "رصيد البنك بالدفاتر"}</span>
                  <span className="text-sm font-mono font-extrabold text-slate-800">
                    {bankAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold uppercase">{lang === 'en' ? "Reconciled Ledger Balance" : "الرصيد المالي المُطابق"}</span>
                  <span className="text-sm font-mono font-extrabold text-blue-700">
                    {reconciledLedgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">{lang === 'en' ? "Statement Ending Balance" : "رصيد كشف الحساب النهائي"}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={recStatementBalance || ''}
                    onChange={(e) => setRecStatementBalance(Number(e.target.value))}
                    className="w-full bg-white p-1 border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800 mt-1"
                    placeholder="0.00"
                  />
                </div>

                <div className={`${isReconciled ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'} p-3 rounded-xl border`}>
                  <span className="text-slate-400 block font-bold uppercase">{lang === 'en' ? "Unreconciled Difference" : "فرق المطابقة (الفرق)"}</span>
                  <span className={`text-sm font-mono font-extrabold ${isReconciled ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {diff.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                  </span>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>{lang === 'en' ? "Select Cleared Transactions" : "حدد العمليات التي تمت تسويتها"}</span>
                  <button
                    onClick={() => {
                      if (recSelectedTxIds.length === bankTransactions.length) {
                        setRecSelectedTxIds([]);
                      } else {
                        setRecSelectedTxIds(bankTransactions.map(t => t.id));
                      }
                    }}
                    className="text-blue-600 hover:underline text-[10px] font-bold"
                  >
                    {recSelectedTxIds.length === bankTransactions.length 
                      ? (lang === 'en' ? "Deselect All" : "إلغاء تحديد الكل") 
                      : (lang === 'en' ? "Select All" : "تحديد الكل")}
                  </button>
                </div>

                {bankTransactions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-400 text-[11px]">
                    {lang === 'en' ? "No bank ledger entries found to reconcile." : "لا توجد قيود أستاذ بنكية لمطابقتها حالياً."}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-start">
                          <th className="p-2.5 text-center w-10">✓</th>
                          <th className="p-2.5 text-start">{lang === 'en' ? "Date" : "التاريخ"}</th>
                          <th className="p-2.5 text-start">{lang === 'en' ? "Reference" : "المرجع"}</th>
                          <th className="p-2.5 text-start">{lang === 'en' ? "Particulars" : "البيان"}</th>
                          <th className="p-2.5 text-end">{lang === 'en' ? "Deposit (Debit)" : "إيداع (مدين)"}</th>
                          <th className="p-2.5 text-end">{lang === 'en' ? "Withdrawal (Credit)" : "سحب (دائن)"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankTransactions.map((tx) => {
                          const isChecked = recSelectedTxIds.includes(tx.id);
                          return (
                            <tr
                              key={tx.id}
                              onClick={() => {
                                if (isChecked) {
                                  setRecSelectedTxIds(recSelectedTxIds.filter(id => id !== tx.id));
                                } else {
                                  setRecSelectedTxIds([...recSelectedTxIds, tx.id]);
                                }
                              }}
                              className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                                isChecked ? 'bg-blue-50/20' : ''
                              }`}
                            >
                              <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setRecSelectedTxIds(recSelectedTxIds.filter(id => id !== tx.id));
                                    } else {
                                      setRecSelectedTxIds([...recSelectedTxIds, tx.id]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                />
                              </td>
                              <td className="p-2.5 text-slate-500">{tx.date}</td>
                              <td className="p-2.5 font-mono font-bold text-slate-800">{tx.ref}</td>
                              <td className="p-2.5 text-slate-600 font-medium">{tx.desc}</td>
                              <td className="p-2.5 text-end font-mono text-emerald-600 font-bold">
                                {tx.debit > 0 ? `+${tx.debit.toFixed(2)} SAR` : "-"}
                              </td>
                              <td className="p-2.5 text-end font-mono text-rose-600 font-bold">
                                {tx.credit > 0 ? `-${tx.credit.toFixed(2)} SAR` : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Save action */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 text-xs">
                {isReconciled && bankTransactions.length > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <Check className="w-4 h-4" />
                    <span>{lang === 'en' ? "Reconciliation Matched Perfect! Difference is 0.00." : "المطابقة تمت بنجاح! فرق التسوية صفر."}</span>
                  </div>
                )}
                <button
                  type="button"
                  disabled={!isReconciled || bankTransactions.length === 0}
                  onClick={() => {
                    const newRec: BankReconciliation = {
                      id: `rec-${Date.now()}`,
                      statementDate: recStatementDate,
                      bankStatementBalance: recStatementBalance,
                      reconciledTxIds: recSelectedTxIds,
                      isCompleted: true
                    };
                    setBankReconciliations([newRec, ...bankReconciliations]);
                    alert(lang === 'en' ? "Bank Reconciliation Saved & Completed Successfully!" : "تم حفظ وإتمام عملية التسوية والمطابقة البنكية بنجاح!");
                  }}
                  className="px-4 py-2 bg-emerald-600 disabled:opacity-40 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  {lang === 'en' ? "Post Bank Reconciliation" : "اعتماد وترحيل تسوية البنك"}
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        lang={lang}
      />
    </div>
  );
}

// Quick helper icon for removal
function Trash2Icon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
