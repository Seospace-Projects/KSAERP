import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Check, 
  Search,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  Percent,
  Trash2,
  Pencil
} from 'lucide-react';
import { translations } from '../utils';
import { Customer, Supplier } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface DirectoryViewProps {
  lang: 'en' | 'ar';
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  currency: string;
}

export default function DirectoryView({
  lang,
  customers,
  setCustomers,
  suppliers,
  setSuppliers,
  currency
}: DirectoryViewProps) {
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

  const handleDeleteCustomer = (id: string) => {
    triggerConfirm(
      lang === 'en' ? "Confirm Customer Deletion" : "تأكيد حذف العميل",
      lang === 'en' ? "Are you sure you want to delete this customer?" : "هل أنت متأكد من حذف هذا العميل؟",
      () => {
        setCustomers(customers.filter(c => c.id !== id));
      }
    );
  };

  const handleDeleteSupplier = (id: string) => {
    triggerConfirm(
      lang === 'en' ? "Confirm Supplier Deletion" : "تأكيد حذف المورد",
      lang === 'en' ? "Are you sure you want to delete this supplier?" : "هل أنت متأكد من حذف هذا المورد؟",
      () => {
        setSuppliers(suppliers.filter(s => s.id !== id));
      }
    );
  };

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Form States
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [openingBalance, setOpeningBalance] = useState(0);

  const resetForm = () => {
    setCode('');
    setNameEn('');
    setNameAr('');
    setVatNumber('');
    setCrNumber('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCreditLimit(50000);
    setPaymentTerms('Net 30');
    setOpeningBalance(0);
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditCustomer = (c: Customer) => {
    setEditingId(c.id);
    setCode(c.code);
    setNameEn(c.nameEn);
    setNameAr(c.nameAr);
    setVatNumber(c.vatNumber || '');
    setCrNumber(c.crNumber || '');
    setPhone(c.phone);
    setEmail(c.email);
    setAddress(c.address);
    setCreditLimit(c.creditLimit);
    setPaymentTerms(c.paymentTerms || 'Net 30');
    setOpeningBalance(c.openingBalance);
    setShowForm(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingId(s.id);
    setCode(s.code);
    setNameEn(s.nameEn);
    setNameAr(s.nameAr);
    setVatNumber(s.vatNumber || '');
    setCrNumber('');
    setPhone(s.phone);
    setEmail(s.email);
    setAddress(s.address);
    setCreditLimit(50000);
    setPaymentTerms('Net 30');
    setOpeningBalance(s.openingBalance);
    setShowForm(true);
  };

  // Submit contact (add or update)
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();

    const finalNameEn = nameEn.trim() || nameAr.trim();
    const finalNameAr = nameAr.trim() || nameEn.trim();

    const errors: string[] = [];
    if (!nameEn.trim() && !nameAr.trim()) {
      errors.push(lang === 'en' 
        ? "• Name: Please enter at least one name (English or Arabic)" 
        : "• الاسم: الرجاء إدخال اسم واحد على الأقل (إنجليزي أو عربي)");
    }
    if (vatNumber && (vatNumber.length !== 15 || !vatNumber.startsWith('3'))) {
      errors.push(lang === 'en' 
        ? "• VAT Number: KSA Tax ID (VAT) must be exactly 15 digits and start with '3'."
        : "• الرقم الضريبي: الرقم الضريبي للمملكة يجب أن يتكون من ١٥ خانة ويبدأ بالرقم ٣.");
    }
    if (crNumber && crNumber.trim().length > 0 && crNumber.trim().length !== 10) {
      errors.push(lang === 'en'
        ? "• CR Number: Commercial Registration number must be exactly 10 digits."
        : "• السجل التجاري: يجب أن يتكون رقم السجل التجاري من ١٠ خانات.");
    }
    if (phone && !/^\+?[0-9\s\-]{7,15}$/.test(phone)) {
      errors.push(lang === 'en'
        ? "• Phone Number: Please enter a valid telephone number."
        : "• رقم الهاتف: الرجاء إدخال رقم هاتف صحيح.");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(lang === 'en'
        ? "• Email: Please enter a valid email address."
        : "• البريد الإلكتروني: الرجاء إدخال بريد إلكتروني صحيح.");
    }

    if (errors.length > 0) {
      setAlertModal({
        isOpen: true,
        title: lang === 'en' ? "Form Input Validation Failed" : "أخطاء في البيانات المدخلة",
        message: lang === 'en' 
          ? `Please correct the following fields before submitting:\n\n${errors.join('\n')}` 
          : `الرجاء تصحيح البيانات التالية قبل إرسال النموذج:\n\n${errors.join('\n')}`
      });
      return;
    }

    const cleanOpeningBalance = isNaN(openingBalance) ? 0 : openingBalance;
    const cleanCreditLimit = isNaN(creditLimit) ? 50000 : creditLimit;
    const isEditing = !!editingId;

    if (activeTab === 'customers') {
      if (isEditing) {
        setCustomers(prev => prev.map(c => {
          if (c.id !== editingId) return c;
          const openingDelta = cleanOpeningBalance - c.openingBalance;
          return {
            ...c,
            code: code.trim() || c.code,
            nameEn: finalNameEn,
            nameAr: finalNameAr,
            vatNumber: vatNumber.trim() || undefined,
            crNumber: crNumber.trim() || undefined,
            phone: phone.trim() || '',
            email: email.trim() || '',
            address: address.trim() || '',
            creditLimit: cleanCreditLimit,
            paymentTerms: paymentTerms || 'Net 30',
            openingBalance: cleanOpeningBalance,
            balance: c.balance + openingDelta,
          };
        }));
        setSuccessMessage(lang === 'en' ? `Customer "${finalNameEn}" has been updated.` : `تم تحديث العميل "${finalNameAr}".`);
      } else {
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          code: code.trim() || `CUST-00${customers.length + 1}`,
          nameEn: finalNameEn,
          nameAr: finalNameAr,
          vatNumber: vatNumber.trim() || undefined,
          crNumber: crNumber.trim() || undefined,
          phone: phone.trim() || '',
          email: email.trim() || '',
          address: address.trim() || '',
          creditLimit: cleanCreditLimit,
          paymentTerms: paymentTerms || 'Net 30',
          openingBalance: cleanOpeningBalance,
          balance: cleanOpeningBalance
        };
        setCustomers([...customers, newCustomer]);
        setSuccessMessage(lang === 'en' ? `Customer "${finalNameEn}" has been successfully added!` : `تمت إضافة العميل "${finalNameAr}" بنجاح!`);
      }
    } else {
      if (isEditing) {
        setSuppliers(prev => prev.map(s => {
          if (s.id !== editingId) return s;
          const openingDelta = cleanOpeningBalance - s.openingBalance;
          return {
            ...s,
            code: code.trim() || s.code,
            nameEn: finalNameEn,
            nameAr: finalNameAr,
            vatNumber: vatNumber.trim() || undefined,
            phone: phone.trim() || '',
            email: email.trim() || '',
            address: address.trim() || '',
            openingBalance: cleanOpeningBalance,
            balance: s.balance + openingDelta,
          };
        }));
        setSuccessMessage(lang === 'en' ? `Supplier "${finalNameEn}" has been updated.` : `تم تحديث المورد "${finalNameAr}".`);
      } else {
        const newSupplier: Supplier = {
          id: `supp-${Date.now()}`,
          code: code.trim() || `SUPP-00${suppliers.length + 1}`,
          nameEn: finalNameEn,
          nameAr: finalNameAr,
          vatNumber: vatNumber.trim() || undefined,
          phone: phone.trim() || '',
          email: email.trim() || '',
          address: address.trim() || '',
          openingBalance: cleanOpeningBalance,
          balance: cleanOpeningBalance
        };
        setSuppliers([...suppliers, newSupplier]);
        setSuccessMessage(lang === 'en' ? `Supplier "${finalNameEn}" has been successfully added!` : `تمت إضافة المورد "${finalNameAr}" بنجاح!`);
      }
    }

    resetForm();

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const filteredCustomers = customers.filter(c => {
    const term = searchQuery.toLowerCase();
    return c.nameEn.toLowerCase().includes(term) ||
           c.nameAr.includes(term) ||
           c.code.toLowerCase().includes(term) ||
           (c.vatNumber && c.vatNumber.includes(term));
  });

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchQuery.toLowerCase();
    return s.nameEn.toLowerCase().includes(term) ||
           s.nameAr.includes(term) ||
           s.code.toLowerCase().includes(term) ||
           (s.vatNumber && s.vatNumber.includes(term));
  });

  return (
    <div className="space-y-6" id="directory-module-container">
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 cursor-pointer font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab Select & Form Trigger */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('customers'); resetForm(); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'customers' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {lang === 'en' ? "Customer Directory (Debtors)" : "دليل العملاء المدينين"}
          </button>
          <button
            onClick={() => { setActiveTab('suppliers'); resetForm(); }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'suppliers' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {lang === 'en' ? "Supplier Directory (Creditors)" : "دليل الموردين الدائنين"}
          </button>
        </div>

        {!showForm && (
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {activeTab === 'customers' 
              ? (lang === 'en' ? "Add Customer" : "تسجيل عميل جديد") 
              : (lang === 'en' ? "Add Supplier" : "تسجيل مورد جديد")}
          </button>
        )}
      </div>

      {/* Directory Main List or Add/Edit Form */}
      <div className="grid grid-cols-1 gap-6">
        {showForm ? (
          <form onSubmit={handleSaveContact} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              {editingId ? <Pencil className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editingId
                  ? (activeTab === 'customers'
                    ? (lang === 'en' ? 'Edit Customer Details' : 'تعديل بيانات العميل')
                    : (lang === 'en' ? 'Edit Supplier Details' : 'تعديل بيانات المورد'))
                  : (activeTab === 'customers'
                    ? (lang === 'en' ? 'Register New Business Customer' : 'تسجيل عميل تجاري جديد')
                    : (lang === 'en' ? 'Register New Wholesale Supplier' : 'تسجيل مورد جملة جديد'))}
              </h3>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  {activeTab === 'customers' ? "Customer Code" : "Supplier Code"}
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'customers' ? "e.g. CUST-004" : "e.g. SUPP-003"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Name (English)" : "الاسم بالإنجليزي"}</label>
                <input
                  type="text"
                  placeholder="e.g. Gulf Tech Est"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Name (Arabic)" : "الاسم بالعربي"}</label>
                <input
                  type="text"
                  placeholder="مثال: مؤسسة التقنية الخليجية"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  {lang === 'en' ? "VAT Registration No (15-digit)" : "الرقم الضريبي (١٥ خانة)"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 310245678900003"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  maxLength={15}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>

              {activeTab === 'customers' && (
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    {lang === 'en' ? "CR Sijil Commercial (10-digit)" : "السجل التجاري (١٠ خانات)"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1010654321"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    maxLength={10}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t.phone}</label>
                <input
                  type="tel"
                  placeholder="+966 5x xxx xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t.email}</label>
                <input
                  type="email"
                  placeholder="info@partner.com.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Postal / Physical Address" : "العنوان الوطني والموقع"}</label>
                <input
                  type="text"
                  placeholder="Building No, Street Name, City, KSA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Customer Credit Fields */}
            {activeTab === 'customers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{t.creditLimit} (SAR)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">{lang === 'en' ? "Payment Credit Terms" : "شروط الدفع الآجل"}</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  >
                    <option value="Cash">Cash On Delivery (كاش)</option>
                    <option value="Net 15">Net 15 Days (خلال ١٥ يوم)</option>
                    <option value="Net 30">Net 30 Days (خلال ٣٠ يوم)</option>
                    <option value="Net 45">Net 45 Days (خلال ٤٥ يوم)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">{t.openingBalance} (SAR)</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Supplier Opening Balance only */}
            {activeTab === 'suppliers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{t.openingBalance} (SAR)</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 block font-bold leading-normal">
                    {lang === 'en' ? "✓ Automatic ledger entries are written on verification." : "✓ يتم ترحيل القيود تلقائياً لدفتر اليومية عند التسجيل."}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 text-xs pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer hover:bg-slate-200"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 cursor-pointer"
              >
                {editingId
                  ? (lang === 'en' ? 'Save Changes' : 'حفظ التعديلات')
                  : (activeTab === 'customers'
                    ? (lang === 'en' ? 'Add Customer' : 'إضافة عميل جديد')
                    : (lang === 'en' ? 'Add Supplier' : 'إضافة مورد جديد'))}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-3 border-b border-slate-200 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {activeTab === 'customers' ? t.customerName : t.supplierName}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {lang === 'en' ? "Registered ledger partners for regulatory invoicing audits" : "شركاء الأعمال والجهات المسجلة الخاضعة لامتثال تدقيق العمليات"}
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className={`absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`py-2 ${isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'} text-xs bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden`}
                />
              </div>
            </div>

            {/* List Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === 'customers' ? (
                filteredCustomers.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                    {lang === 'en' ? "No customers registered." : "لا يوجد عملاء مسجلين."}
                  </div>
                ) : (
                  filteredCustomers.map(c => (
                    <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 shadow-sm flex flex-col justify-between space-y-4 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold font-mono">
                            {c.paymentTerms}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">
                            {lang === 'en' ? c.nameEn : c.nameAr}
                          </h4>
                          {(lang as string) === 'bilingual' && (
                            <h4 className="font-medium text-slate-500 text-[10px] mt-0.5">
                              {lang === 'en' ? c.nameAr : c.nameEn}
                            </h4>
                          )}
                        </div>

                        {/* Contacts details */}
                        <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono">{c.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="font-mono truncate max-w-[180px]">{c.email}</span>
                          </div>
                          {c.vatNumber && (
                            <div className="flex items-center gap-1.5 bg-emerald-500/5 px-2 py-0.5 rounded text-emerald-700 border border-emerald-500/10 font-bold max-w-max">
                              <ShieldCheck className="w-3 h-3" />
                              <span className="font-mono text-[9px]">{lang === 'en' ? `VAT: ${c.vatNumber}` : `ضريبة: ${c.vatNumber}`}</span>
                            </div>
                          )}
                        </div>

                        {/* Credit limits visualization bar */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>{lang === 'en' ? "Credit Progress" : "الحد الائتماني المستخدم"}</span>
                            <span>{((c.balance / c.creditLimit) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${c.balance / c.creditLimit > 0.8 ? 'bg-rose-500' : 'bg-blue-600'}`}
                              style={{ width: `${Math.min(100, (c.balance / c.creditLimit) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-mono font-medium text-slate-400">
                            <span>{lang === 'en' ? "Used: " : "مستغل: "}{c.balance.toLocaleString()} SAR</span>
                            <span>{lang === 'en' ? "Limit: " : "الحد: "}{c.creditLimit.toLocaleString()} SAR</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <div>
                          <span className="text-[9px] text-slate-400 block">{lang === 'en' ? "Outstanding Balance" : "الرصيد المستحق (مدين)"}</span>
                          <span className="font-mono text-xs font-extrabold text-slate-950">
                            {c.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCustomer(c)}
                            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'en' ? "Edit Customer" : "تعديل العميل"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'en' ? "Delete Customer" : "حذف العميل"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                filteredSuppliers.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                    {lang === 'en' ? "No suppliers registered." : "لا يوجد موردين مسجلين."}
                  </div>
                ) : (
                  filteredSuppliers.map(s => (
                    <div key={s.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 shadow-sm flex flex-col justify-between space-y-4 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                            {s.code}
                          </span>
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
                            {lang === 'en' ? "Wholesale Vendor" : "مورد جملة"}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">
                            {lang === 'en' ? s.nameEn : s.nameAr}
                          </h4>
                          {(lang as string) === 'bilingual' && (
                            <h4 className="font-medium text-slate-500 text-[10px] mt-0.5">
                              {lang === 'en' ? s.nameAr : s.nameEn}
                            </h4>
                          )}
                        </div>

                        {/* Contacts details */}
                        <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono">{s.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="font-mono truncate max-w-[180px]">{s.email}</span>
                          </div>
                          {s.vatNumber && (
                            <div className="flex items-center gap-1.5 bg-emerald-500/5 px-2 py-0.5 rounded text-emerald-700 border border-emerald-500/10 font-bold max-w-max">
                              <ShieldCheck className="w-3 h-3" />
                              <span className="font-mono text-[9px]">{lang === 'en' ? `VAT: ${s.vatNumber}` : `ضريبة: ${s.vatNumber}`}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div>
                          <span className="text-[9px] text-slate-400 block">{lang === 'en' ? "Outstanding Payables" : "المستحقات الحالية (دائن)"}</span>
                          <span className="font-mono text-xs font-extrabold text-amber-900">
                            {s.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditSupplier(s)}
                            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'en' ? "Edit Supplier" : "تعديل المورد"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'en' ? "Delete Supplier" : "حذف المورد"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        lang={lang}
      />

      <ConfirmModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        lang={lang}
      />
    </div>
  );
}
