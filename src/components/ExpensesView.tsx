import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, 
  Plus, 
  CheckCircle, 
  Clock, 
  Paperclip, 
  Trash2, 
  PlusCircle, 
  TrendingDown,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { translations } from '../utils';
import { Expense, ChartOfAccount, JournalEntry } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ExpensesViewProps {
  lang: 'en' | 'ar';
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  accounts: ChartOfAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<ChartOfAccount[]>>;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  currency: string;
}

export default function ExpensesView({
  lang,
  expenses,
  setExpenses,
  accounts,
  setAccounts,
  journalEntries,
  setJournalEntries,
  currency
}: ExpensesViewProps) {
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

  const handleDeleteExpense = (id: string) => {
    triggerConfirm(
      lang === 'en' ? "Confirm Expense Deletion" : "تأكيد حذف المصروف",
      lang === 'en' ? "Are you sure you want to delete this expense record?" : "هل أنت متأكد من حذف هذا المصروف؟",
      () => {
        setExpenses(expenses.filter(exp => exp.id !== id));
        if (setJournalEntries) {
          setJournalEntries(journalEntries.filter(je => je.reference !== id && je.id !== id));
        }
      }
    );
  };

  const [showAddForm, setShowAddForm] = useState(false);

  // Expense form fields
  const [category, setCategory] = useState('Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [vatPercentage, setVatPercentage] = useState<number>(15);
  const [paymentMethod, setPaymentMethod] = useState<'Petty Cash' | 'Bank' | 'Credit Card'>('Petty Cash');
  const [referenceNo, setReferenceNo] = useState('');

  const computedVat = vatPercentage > 0 ? amount * 0.15 : 0;
  const computedTotal = amount + computedVat;

  const handlePostExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0 || !description.trim()) {
      alert(lang === 'en' ? "Please input a valid amount and description" : "يرجى إدخال مبلغ صحيح ووصف المصروف");
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category,
      description,
      amount,
      vatPercentage,
      vatAmount: computedVat,
      total: computedTotal,
      paymentMethod,
      referenceNo: referenceNo || `TXN-${Date.now().toString().slice(-5)}`,
      status: 'Approved'
    };

    setExpenses([newExpense, ...expenses]);

    // Update Accounts state
    // Debit Expense Account & Debit Input VAT Asset
    // Credit Cash on Hand Asset or Bank Asset
    let expenseAccount = 'acc-5202'; // default Utilities
    if (category === 'Rent') expenseAccount = 'acc-5201';
    if (category === 'Government Fees') expenseAccount = 'acc-5203';

    const cashAccount = paymentMethod === 'Petty Cash' ? 'acc-1001' : 'acc-1002'; // cash or bank
    const inputVatAccount = 'acc-2151'; // VAT input asset

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === expenseAccount) return { ...acc, balance: acc.balance + amount };
      if (acc.id === inputVatAccount) return { ...acc, balance: acc.balance + computedVat };
      if (acc.id === cashAccount) return { ...acc, balance: acc.balance - computedTotal };
      return acc;
    });
    setAccounts(updatedAccounts);

    // Create journal entries double entry log
    const expAccObj = accounts.find(a => a.id === expenseAccount)!;
    const vatAccObj = accounts.find(a => a.id === inputVatAccount)!;
    const cashAccObj = accounts.find(a => a.id === cashAccount)!;

    const newJournal: JournalEntry = {
      id: `je-expense-${Date.now()}`,
      date: newExpense.date,
      reference: newExpense.referenceNo!,
      description: `Expense approved: ${description} (Opex)`,
      isSystem: true,
      lines: [
        {
          accountId: expenseAccount,
          accountNameEn: expAccObj.nameEn,
          accountNameAr: expAccObj.nameAr,
          debit: amount,
          credit: 0
        },
        ...(computedVat > 0 ? [{
          accountId: inputVatAccount,
          accountNameEn: vatAccObj.nameEn,
          accountNameAr: vatAccObj.nameAr,
          debit: computedVat,
          credit: 0
        }] : []),
        {
          accountId: cashAccount,
          accountNameEn: cashAccObj.nameEn,
          accountNameAr: cashAccObj.nameAr,
          debit: 0,
          credit: computedTotal
        }
      ]
    };
    setJournalEntries([newJournal, ...journalEntries]);

    // Reset Form
    setDescription('');
    setAmount(0);
    setReferenceNo('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="expenses-workspace">
      
      {/* Upper toggle panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">{lang === 'en' ? "Operating Expenses Log (Opex)" : "سجل نفقات ومصاريف التشغيل"}</h3>
          <p className="text-[10px] text-slate-400">
            {lang === 'en' ? "Add expenses to claim VAT Input and calculate accurate Net Profit margins" : "سجل نفقاتك للمطالبة بخصم ضريبة المدخلات وحساب صافي هامش الأرباح الفعلي"}
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'en' ? "Record Expense" : "تسجيل مصروف جديد"}
          </button>
        )}
      </div>

      {showAddForm ? (
        <form onSubmit={handlePostExpense} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs text-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm">{lang === 'en' ? "Record Operational Expenditure" : "تسجيل مستند صرف مالي تشغيلي"}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Expense Category" : "فئة المصروف"}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Utilities">Utilities & Electric (الكهرباء والمرافق)</option>
                <option value="Rent">Office Rental (إيجار المكاتب)</option>
                <option value="Government Fees">Government Fees & Sijil (رسوم حكومية وسجل)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Description" : "بيان المصروف"}</label>
              <input
                type="text"
                placeholder="e.g., June internet or electricity bill"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-50 p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Transaction Reference No" : "رقم مرجع التحويل"}</label>
              <input
                type="text"
                placeholder="e.g. Bank TXN-9988"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full bg-slate-50 p-2 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Amount (Excl. VAT)" : "المبلغ (غير شامل الضريبة)"}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full bg-slate-50 p-2 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Saudi VAT Applicable" : "الضريبة الخاضعة لها"}</label>
              <select
                value={vatPercentage}
                onChange={(e) => setVatPercentage(Number(e.target.value))}
                className="w-full bg-slate-50 p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={15}>Standard KSA VAT 15% (ضريبة شاملة)</option>
                <option value={0}>Zero-Rated / Exempt (معفاة / معفاة بقرار)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Paid Via Account" : "الدفع من خلال حساب"}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Petty Cash">Petty Cash Account (صندوق النقدية)</option>
                <option value="Bank">Al Rajhi Corporate Bank Account (مصرف الراجحي)</option>
                <option value="Credit Card">Corporate Credit Card (بطاقة الائتمان)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between font-mono font-bold">
            <div>
              <span className="opacity-75 block text-[10px] uppercase">{lang === 'en' ? "Input VAT Claim (15%):" : "الضريبة المستردة المطالب بها:"}</span>
              <span className="text-blue-400">{computedVat.toFixed(2)} SAR</span>
            </div>
            <div className="text-right">
              <span className="opacity-75 block text-[10px] uppercase">{lang === 'en' ? "Total Expended:" : "المبلغ الكلي المنصرف:"}</span>
              <span className="text-amber-400">{computedTotal.toFixed(2)} SAR</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer hover:bg-slate-200"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all cursor-pointer"
            >
              {lang === 'en' ? "Authorize Operational Expense" : "اعتماد وصرف المصروف المالي"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs">{lang === 'en' ? "Expenditure Ledger Logs" : "سجل المصروفات المصنفة والمدققة"}</h4>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{expenses.length} Records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenses.map(exp => (
              <div key={exp.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col justify-between shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded font-mono uppercase">
                      {exp.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {lang === 'en' ? "Approved" : "معتمد"}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title={lang === 'en' ? "Delete Expense" : "حذف المصروف"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 text-xs truncate">{exp.description}</h5>
                    <span className="text-[10px] text-slate-400 block font-mono">{exp.date} • {exp.referenceNo}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span className="block font-medium">{lang === 'en' ? `Paid via: ${exp.paymentMethod}` : `دفع بواسطة: ${exp.paymentMethod}`}</span>
                    {exp.vatAmount > 0 && (
                      <span className="block text-blue-600 font-semibold">{lang === 'en' ? `Includes 15% VAT: ${exp.vatAmount.toFixed(2)} SAR` : `يشمل ضريبة ١٥٪: ${exp.vatAmount.toFixed(2)} ر.س`}</span>
                    )}
                  </div>
                </div>

                <div className="text-right pt-3 mt-3 border-t border-slate-200">
                  <span className="text-[9px] text-slate-400 block">{lang === 'en' ? "Amount Expended" : "المبلغ المنصرف شامل الضريبة"}</span>
                  <span className="font-mono text-xs font-extrabold text-slate-900">{exp.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
