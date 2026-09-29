import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Plus, 
  Search, 
  FileText, 
  Check, 
  Printer, 
  Undo2, 
  Trash2, 
  Clock, 
  Building, 
  Tag, 
  FileCheck,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  Settings,
  X
} from 'lucide-react';
import { translations, generateZatcaTlvQr, validateZatcaCompliance } from '../utils';
import { ConfirmModal } from './ConfirmModal';
import { 
  Invoice, 
  Customer, 
  Product, 
  Warehouse, 
  CompanyProfile, 
  InvoiceItem, 
  JournalEntry,
  ChartOfAccount,
  ReservedInvoiceNumber,
} from '../types';
import {
  buildReservedInvoiceNumber,
  invoiceNumberConflict,
  normalizeInvoiceNumber,
  suggestNextInvoiceNumber,
} from '../invoiceNumbers';

interface SalesInvoiceViewProps {
  lang: 'en' | 'ar';
  company: CompanyProfile;
  companies?: CompanyProfile[];
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: Warehouse[];
  accounts: ChartOfAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<ChartOfAccount[]>>;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  reservedInvoices: ReservedInvoiceNumber[];
  setReservedInvoices: React.Dispatch<React.SetStateAction<ReservedInvoiceNumber[]>>;
  currentUserId: string;
  canSkipInvoiceNumber?: boolean;
  canViewReservedList?: boolean;
  pendingUseReserved?: { companyId: string; invoiceNumber: string } | null;
  onPendingUseReservedConsumed?: () => void;
  onOpenReservedList?: (companyId: string) => void;
  currency: string;
  themeColor?: 'green' | 'gold' | 'dark' | 'teal';
}

type TemplateType = 'professional' | 'corporate' | 'minimal' | 'modern' | 'luxury' | 'elegant-serif' | 'compact-dense' | 'royal-executive' | 'creative-orange' | 'nordic-sage' | 'crimson-classic' | 'monochrome-stark' | 'saldo-blue' | 'elaf-classic' | 'buyp-tech';

const getTemplateStyles = (template: TemplateType) => {
  switch (template) {
    case 'saldo-blue':
      return {
        container: 'border-t-8 border-blue-600 bg-white font-sans rounded-3xl',
        headerBg: 'bg-blue-50/20 text-blue-950',
        badge: 'bg-blue-100 text-blue-900 border border-blue-200',
        primaryText: 'text-blue-600',
        titleColor: 'text-blue-600 font-extrabold',
        accentBorder: 'border-blue-100',
        tableHeader: 'bg-blue-600 text-white',
      };
    case 'elaf-classic':
      return {
        container: 'border-t-8 border-amber-700 bg-slate-50/20 font-serif',
        headerBg: 'bg-amber-50 text-slate-900 border-b border-slate-200',
        badge: 'bg-amber-100 text-amber-900 border border-amber-200',
        primaryText: 'text-[#9A7B35] font-serif font-bold',
        titleColor: 'text-[#9A7B35] font-serif font-extrabold',
        accentBorder: 'border-slate-200',
        tableHeader: 'bg-slate-100 text-slate-800 font-serif font-bold border-y border-slate-300',
      };
    case 'buyp-tech':
      return {
        container: 'border-t-8 border-cyan-500 bg-white font-sans',
        headerBg: 'bg-cyan-50/50 text-slate-800',
        badge: 'bg-cyan-100 text-cyan-900 border border-cyan-200',
        primaryText: 'text-cyan-600 font-semibold',
        titleColor: 'text-cyan-700 font-extrabold',
        accentBorder: 'border-cyan-100',
        tableHeader: 'bg-cyan-500/10 text-cyan-900 border-b-2 border-cyan-500',
      };
    case 'luxury':
      return {
        container: 'border-t-8 border-amber-600 bg-amber-50/5 font-sans',
        headerBg: 'bg-amber-50 text-amber-900',
        badge: 'bg-amber-100 text-amber-900 border border-amber-200',
        primaryText: 'text-amber-600',
        titleColor: 'text-amber-600',
        accentBorder: 'border-amber-200',
        tableHeader: 'bg-amber-50 text-amber-900',
      };
    case 'corporate':
      return {
        container: 'border-t-8 border-indigo-900 bg-white font-sans',
        headerBg: 'bg-indigo-50/50 text-indigo-900',
        badge: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
        primaryText: 'text-indigo-900',
        titleColor: 'text-indigo-900',
        accentBorder: 'border-indigo-100',
        tableHeader: 'bg-indigo-50/50 text-indigo-900',
      };
    case 'minimal':
      return {
        container: 'border-t border-b border-slate-200 bg-white font-sans',
        headerBg: 'bg-slate-50 text-slate-700',
        badge: 'bg-slate-100 text-slate-800 border border-slate-200',
        primaryText: 'text-slate-800',
        titleColor: 'text-slate-800',
        accentBorder: 'border-slate-100',
        tableHeader: 'bg-slate-50 text-slate-600',
      };
    case 'modern':
      return {
        container: 'border-t-8 border-purple-600 bg-white font-sans',
        headerBg: 'bg-purple-50 text-purple-900',
        badge: 'bg-purple-100 text-purple-900 border border-purple-200',
        primaryText: 'text-purple-600',
        titleColor: 'text-purple-600',
        accentBorder: 'border-purple-100',
        tableHeader: 'bg-purple-50 text-purple-600',
      };
    case 'elegant-serif':
      return {
        container: 'border-t-8 border-emerald-800 bg-[#fefdfa] font-serif-elegant',
        headerBg: 'bg-emerald-50/70 text-emerald-950',
        badge: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
        primaryText: 'text-emerald-800',
        titleColor: 'text-emerald-800',
        accentBorder: 'border-emerald-200/60',
        tableHeader: 'bg-emerald-50/50 text-emerald-900',
      };
    case 'compact-dense':
      return {
        container: 'border-t-8 border-slate-900 bg-white font-mono text-[9px] leading-tight',
        headerBg: 'bg-slate-100 text-slate-950',
        badge: 'bg-slate-200 text-slate-950 border border-slate-300',
        primaryText: 'text-slate-950',
        titleColor: 'text-slate-950',
        accentBorder: 'border-slate-300',
        tableHeader: 'bg-slate-100 text-slate-950',
      };
    case 'royal-executive':
      return {
        container: 'border-t-8 border-blue-800 border-b-8 border-double bg-white font-sans',
        headerBg: 'bg-blue-50 text-blue-900',
        badge: 'bg-blue-100 text-blue-900 border border-blue-200',
        primaryText: 'text-blue-800',
        titleColor: 'text-blue-800 font-extrabold',
        accentBorder: 'border-blue-200',
        tableHeader: 'bg-blue-850 text-white',
      };
    case 'creative-orange':
      return {
        container: 'border-t-8 border-orange-500 bg-orange-50/5 font-sans',
        headerBg: 'bg-orange-50 text-orange-950',
        badge: 'bg-orange-100 text-orange-950 border border-orange-200',
        primaryText: 'text-orange-600',
        titleColor: 'text-orange-600',
        accentBorder: 'border-orange-200',
        tableHeader: 'bg-orange-500 text-white',
      };
    case 'nordic-sage':
      return {
        container: 'border-t-8 border-teal-700 bg-teal-50/5 font-sans',
        headerBg: 'bg-teal-50 text-teal-950',
        badge: 'bg-teal-100 text-teal-950 border border-teal-200',
        primaryText: 'text-teal-700',
        titleColor: 'text-teal-700',
        accentBorder: 'border-teal-200',
        tableHeader: 'bg-teal-50 text-teal-950',
      };
    case 'crimson-classic':
      return {
        container: 'border-t-8 border-rose-800 bg-white font-sans',
        headerBg: 'bg-rose-50 text-rose-950',
        badge: 'bg-rose-100 text-rose-950 border border-rose-200',
        primaryText: 'text-rose-800',
        titleColor: 'text-rose-800',
        accentBorder: 'border-rose-100',
        tableHeader: 'bg-rose-50 text-rose-950',
      };
    case 'monochrome-stark':
      return {
        container: 'border-2 border-black bg-white font-mono',
        headerBg: 'bg-black text-white',
        badge: 'bg-black text-white border border-black',
        primaryText: 'text-black font-bold',
        titleColor: 'text-black font-extrabold',
        accentBorder: 'border-black',
        tableHeader: 'bg-black text-white',
      };
    case 'professional':
    default:
      return {
        container: 'border-t-8 border-slate-900 bg-white font-sans',
        headerBg: 'bg-slate-50 text-slate-700',
        badge: 'bg-slate-100 text-slate-800 border border-slate-200',
        primaryText: 'text-slate-900',
        titleColor: 'text-slate-900',
        accentBorder: 'border-slate-200',
        tableHeader: 'bg-slate-50 text-slate-600',
      };
  }
};

interface ZatcaQRCodeProps {
  value: string;
  sizeClass?: string;
}

const ZatcaQRCode: React.FC<ZatcaQRCodeProps> = ({ value, sizeClass = "w-16 h-16" }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M', // Optimal density & high scan rate
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    .then(url => {
      if (active) setSrc(url);
    })
    .catch(() => {
      console.error("Error generating local ZATCA QR");
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src) {
    return <div className={`${sizeClass} bg-slate-100 animate-pulse rounded border border-slate-200`} />;
  }

  return (
    <div className="bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center shadow-xs">
      <img 
        src={src} 
        alt="ZATCA Compliant QR Code" 
        className={sizeClass}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default function SalesInvoiceView({
  lang,
  company,
  companies = [],
  invoices,
  setInvoices,
  customers,
  setCustomers,
  products,
  setProducts,
  warehouses,
  accounts,
  setAccounts,
  journalEntries,
  setJournalEntries,
  reservedInvoices,
  setReservedInvoices,
  currentUserId,
  canSkipInvoiceNumber = false,
  canViewReservedList = false,
  pendingUseReserved = null,
  onPendingUseReservedConsumed,
  onOpenReservedList,
  currency,
  themeColor = 'green'
}: SalesInvoiceViewProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Component States
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(pendingUseReserved ? 'create' : 'list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const invCompany = selectedInvoice?.companyDetails || company;
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterInvoiceType, setFilterInvoiceType] = useState<'All' | 'Standard' | 'Simplified'>('All');
  
  // Invoice Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState(pendingUseReserved?.companyId || company.id || 'comp-1');
  const [invoiceType, setInvoiceType] = useState<'Standard' | 'Simplified' | 'POS'>('Simplified');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit' | 'Bank Transfer' | 'Mada' | 'Visa' | 'Mastercard'>('Cash');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState(pendingUseReserved?.invoiceNumber || '');
  const [isManualNumberEdited, setIsManualNumberEdited] = useState(!!pendingUseReserved);
  const [notes, setNotes] = useState('');
  const issuingCompany = companies.find(c => c.id === selectedCompanyId) || company;

  // Auto calculate/suggest invoice number based on date and company format prefix
  useEffect(() => {
    if (!isManualNumberEdited) {
      const selectedCompany = companies.find(c => c.id === selectedCompanyId) || company;
      const customPrefix = selectedCompany?.invoicePrefix || 'INV-';
      setManualInvoiceNumber(
        suggestNextInvoiceNumber(customPrefix, invoices, reservedInvoices, selectedCompany, invoiceDate)
      );
    }
  }, [invoiceDate, selectedCompanyId, invoices, reservedInvoices, companies, company, isManualNumberEdited]);

  useEffect(() => {
    if (!pendingUseReserved) return;
    setActiveTab('create');
    setSelectedCompanyId(pendingUseReserved.companyId);
    setManualInvoiceNumber(pendingUseReserved.invoiceNumber);
    setIsManualNumberEdited(true);
  }, [pendingUseReserved]);
  const [items, setItems] = useState<{ 
    productId: string; 
    qty: number; 
    unitPrice: number;
    customNameEn?: string;
    customNameAr?: string;
    customSku?: string;
    customUnit?: string;
  }[]>([
    { productId: '', qty: 1, unitPrice: 0 }
  ]);

  // Invoice Designer Options (Local states for instant layout toggling on the detail pane)
  const [designerTemplate, setDesignerTemplate] = useState<TemplateType>('professional');
  const [designerQrPos, setDesignerQrPos] = useState<'top-right' | 'bottom-right' | 'bottom-left' | 'footer' | 'top-left'>('top-right');
  const [designerShowNotice, setDesignerShowNotice] = useState(true);
  const [designerShowLogo, setDesignerShowLogo] = useState(company.showLogo !== false);
  const [designerShowBankDetails, setDesignerShowBankDetails] = useState(company.showBankDetails !== false);
  const [designerLanguage, setDesignerLanguage] = useState<'bilingual' | 'en' | 'ar'>('bilingual');
  const [showZatcaDetails, setShowZatcaDetails] = useState(false);
  const tpl = getTemplateStyles(designerTemplate);

  useEffect(() => {
    setDesignerShowLogo(company.showLogo !== false);
    setDesignerShowBankDetails(company.showBankDetails !== false);
  }, [company]);

  const renderQrCode = (sizeClass = "w-16 h-16") => {
    if (!selectedInvoice) return null;
    const invCompany = selectedInvoice.companyDetails || company;
    const qrCodeBase64 = generateZatcaTlvQr(
      invCompany.nameEn || invCompany.nameAr || "My Company Ltd",
      invCompany.vatNumber || "300000000000003",
      selectedInvoice.timestamp || `${selectedInvoice.date}T12:00:00Z`,
      selectedInvoice.total.toFixed(2),
      selectedInvoice.vatAmount.toFixed(2),
      selectedInvoice.invoiceHash,
      undefined,
      undefined,
      undefined,
      true // forceStandard
    );
    return (
      <ZatcaQRCode value={qrCodeBase64} sizeClass={sizeClass} />
    );
  };

  // Custom confirm state
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

  const handleSkipInvoiceNumber = () => {
    const numberToSkip = manualInvoiceNumber.trim();
    const selectedCompany = companies.find(c => c.id === selectedCompanyId) || company;
    const conflict = invoiceNumberConflict(numberToSkip, invoices, reservedInvoices, selectedCompany);
    if (conflict === 'empty') {
      alert(lang === 'en' ? 'Enter an invoice number to skip.' : 'أدخل رقم فاتورة لتخطيّه.');
      return;
    }
    if (conflict === 'issued') {
      alert(lang === 'en'
        ? `Invoice number "${numberToSkip}" is already issued.`
        : `رقم الفاتورة "${numberToSkip}" صادر مسبقاً.`);
      return;
    }
    if (conflict === 'reserved') {
      alert(lang === 'en'
        ? `Invoice number "${numberToSkip}" is already reserved.`
        : `رقم الفاتورة "${numberToSkip}" محجوز مسبقاً.`);
      return;
    }

    triggerConfirm(
      lang === 'en' ? 'Skip invoice number' : 'تخطي رقم الفاتورة',
      lang === 'en'
        ? `Reserve ${numberToSkip} and use the next available number?`
        : `حجز ${numberToSkip} واستخدام الرقم التالي المتاح؟`,
      () => {
        setReservedInvoices((prev: ReservedInvoiceNumber[]) => [
          buildReservedInvoiceNumber({
            companyId: selectedCompany.id,
            invoiceNumber: numberToSkip,
            createdByUserId: currentUserId,
          }),
          ...prev,
        ]);
        setIsManualNumberEdited(false);
      }
    );
  };

  const handleDeleteInvoice = (id: string) => {
    triggerConfirm(
      lang === 'en' ? "Confirm Invoice Deletion" : "تأكيد حذف الفاتورة",
      lang === 'en' ? "Are you sure you want to delete this invoice? This will also remove associated ledger transactions." : "هل أنت متأكد من حذف هذه الفاتورة؟ سيؤدي ذلك أيضاً إلى إزالة المعاملات المرتبطة في دفتر الأستاذ.",
      () => {
        setInvoices(invoices.filter(inv => inv.id !== id));
        if (setJournalEntries) {
          setJournalEntries(journalEntries.filter(je => je.reference !== id && je.id !== id));
        }
        if (selectedInvoice?.id === id) {
          setSelectedInvoice(null);
        }
      }
    );
  };

  // Return/Credit Note State
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);

  const handleAutoTranslate = async (index: number, englishText: string) => {
    if (!englishText || englishText.trim() === '') return;
    setTranslatingIdx(index);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: englishText })
      });
      const data = await response.json();
      if (data.translatedText) {
        // Update the item's customNameAr
        const updated = [...items];
        updated[index].customNameAr = data.translatedText;
        setItems(updated);
      }
    } catch {
      console.error("AI translation error");
    } finally {
      setTranslatingIdx(null);
    }
  };

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnInvoiceId, setReturnInvoiceId] = useState('');

  // 1. Calculations for Form
  const formSubtotal = items.reduce((sum, item) => {
    if (!item.productId) return sum;
    if (item.productId === 'custom') {
      return sum + (item.qty * item.unitPrice);
    }
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return sum;
    return sum + (item.qty * item.unitPrice);
  }, 0);

  const formVat = formSubtotal * 0.15; // KSA standard 15% VAT
  const formTotal = formSubtotal + formVat;

  // 2. Add item row
  const addItemRow = () => {
    setItems([...items, { productId: '', qty: 1, unitPrice: 0 }]);
  };

  // 3. Remove item row
  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // 4. Update item row field
  const updateItemRow = (index: number, field: string, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      if (value === 'custom') {
        updated[index].productId = 'custom';
        updated[index].unitPrice = 0;
        updated[index].customNameEn = '';
        updated[index].customNameAr = '';
        updated[index].customSku = 'SKU-GEN-' + Math.floor(Math.random() * 9000 + 1000);
        updated[index].customUnit = 'Pcs';
      } else {
        const prod = products.find(p => p.id === value);
        updated[index].productId = value;
        updated[index].unitPrice = prod ? prod.sellingPrice : 0;
        delete updated[index].customNameEn;
        delete updated[index].customNameAr;
        delete updated[index].customSku;
        delete updated[index].customUnit;
      }
    } else if (field === 'qty') {
      updated[index].qty = Number(value);
    } else if (field === 'unitPrice') {
      updated[index].unitPrice = Number(value);
    } else if (field === 'customNameEn') {
      updated[index].customNameEn = value;
    } else if (field === 'customNameAr') {
      updated[index].customNameAr = value;
    } else if (field === 'customSku') {
      updated[index].customSku = value;
    } else if (field === 'customUnit') {
      updated[index].customUnit = value;
    }
    setItems(updated);
  };

  // 5. Submit Form (ZATCA Compliant Invoice Generation)
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert(lang === 'en' ? "Please select a customer" : "الرجاء اختيار العميل");
      return;
    }

    const selectedCompany = companies.find(c => c.id === selectedCompanyId) || company;
    const finalInvoiceNumber = manualInvoiceNumber.trim() || suggestNextInvoiceNumber(
      selectedCompany?.invoicePrefix || 'INV-',
      invoices,
      reservedInvoices,
      selectedCompany,
      invoiceDate
    );

    const conflict = invoiceNumberConflict(finalInvoiceNumber, invoices, reservedInvoices, selectedCompany);
    if (conflict === 'issued') {
      alert(lang === 'en'
        ? `Error: The invoice number "${finalInvoiceNumber}" is already issued! Please input a unique invoice number.`
        : `خطأ: رقم الفاتورة "${finalInvoiceNumber}" صادر مسبقاً! يرجى إدخال رقم فاتورة فريد.`);
      return;
    }

    if (items.some(item => !item.productId || (item.productId === 'custom' && !item.customNameEn && !item.customNameAr) || item.qty <= 0)) {
      alert(lang === 'en' ? "Please select products or type custom items and input valid quantities" : "الرجاء اختيار الأصناف أو كتابة صنف مخصص وإدخال كميات صحيحة");
      return;
    }

    if (dueDate < invoiceDate) {
      alert(lang === 'en' ? "Due date cannot be before invoice date" : "تاريخ الاستحقاق لا يمكن أن يكون قبل تاريخ الفاتورة");
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId)!;
    const dateStr = invoiceDate;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestampStr = `${invoiceDate}T${hours}:${minutes}:${seconds}Z`; // compliant UTC ZATCA formatting with selected date

    // Build items payload
    const invoiceItems: InvoiceItem[] = items.map((formItem, idx) => {
      const isCustom = formItem.productId === 'custom';
      const prod = isCustom ? null : products.find(p => p.id === formItem.productId)!;
      const subtotal = formItem.qty * formItem.unitPrice;
      const vatAmount = subtotal * 0.15;
      return {
        id: `item-gen-${Date.now()}-${idx}`,
        productId: isCustom ? 'custom' : prod!.id,
        sku: isCustom ? (formItem.customSku || 'CUSTOM') : prod!.sku,
        nameEn: isCustom ? (formItem.customNameEn || 'Custom Product') : prod!.nameEn,
        nameAr: isCustom ? (formItem.customNameAr || '') : (prod!.nameAr || ''),
        unit: isCustom ? (formItem.customUnit || 'Pcs') : prod!.unit,
        qty: formItem.qty,
        unitPrice: formItem.unitPrice,
        vatPercentage: 15,
        vatAmount,
        subtotal,
        total: subtotal + vatAmount
      };
    });

    const subtotal = invoiceItems.reduce((s, i) => s + i.subtotal, 0);
    const vatAmount = invoiceItems.reduce((s, i) => s + i.vatAmount, 0);
    const total = subtotal + vatAmount;

    // Cryptographic signatures (UUID + SHA256 Invoice Hash simulation for ZATCA Phase 2 compliance)
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const invoiceCounter = invoices.length + 1;
    const dummyHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    // Generate compliant QR Code
    const qrCodeTlv = generateZatcaTlvQr(
      selectedCompany.nameEn || selectedCompany.nameAr,
      selectedCompany.vatNumber,
      timestampStr,
      total.toFixed(2),
      vatAmount.toFixed(2),
      dummyHash
    );

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: finalInvoiceNumber,
      invoiceType,
      date: dateStr,
      dueDate,
      customerId: customer.id,
      customerNameEn: customer.nameEn,
      customerNameAr: customer.nameAr,
      customerVat: customer.vatNumber,
      paymentMethod,
      paymentTerms: customer.paymentTerms,
      warehouseId: selectedWarehouseId,
      items: invoiceItems,
      subtotal,
      vatAmount,
      total,
      uuid,
      invoiceCounter,
      invoiceHash: dummyHash,
      isReturned: false,
      notes,
      timestamp: timestampStr,
      qrCodeTlv,
      companyDetails: selectedCompany,
      companyId: selectedCompany.id,
      companyNameEn: selectedCompany.nameEn,
      companyNameAr: selectedCompany.nameAr,
    };

    // Update state
    setInvoices([newInvoice, ...invoices]);
    if (conflict === 'reserved') {
      const usedNumber = normalizeInvoiceNumber(finalInvoiceNumber);
      setReservedInvoices((prev: ReservedInvoiceNumber[]) =>
        prev.filter((item: ReservedInvoiceNumber) => !(
          item.companyId === selectedCompany.id
          && normalizeInvoiceNumber(item.invoiceNumber) === usedNumber
        ))
      );
    }

    // 6. Hook A: Deduct inventory stock levels
    const updatedProducts = products.map(prod => {
      const soldItem = invoiceItems.find(item => item.productId === prod.id);
      if (soldItem) {
        // deduct from total and from specific warehouse
        const currentWhStock = prod.warehouseStock[selectedWarehouseId] || 0;
        const newWhStock = Math.max(0, currentWhStock - soldItem.qty);
        return {
          ...prod,
          stockLevel: Math.max(0, prod.stockLevel - soldItem.qty),
          warehouseStock: {
            ...prod.warehouseStock,
            [selectedWarehouseId]: newWhStock
          }
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // 7. Hook B: Update customer balance if payment is 'Credit'
    if (paymentMethod === 'Credit') {
      const updatedCustomers = customers.map(c => {
        if (c.id === customer.id) {
          return { ...c, balance: c.balance + total };
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }

    // 8. Hook C: Insert balanced system double-entry journal logs
    // Determine accounts
    const debitAccount = paymentMethod === 'Credit' ? 'acc-1200' : 'acc-1002'; // AR asset or Al Rajhi Bank asset
    const creditSalesAccount = 'acc-4001'; // Revenue
    const creditVatLiabilityAccount = 'acc-2150'; // Sales VAT Liability
    
    // Update chart of accounts balance
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === debitAccount) return { ...acc, balance: acc.balance + total };
      if (acc.id === creditSalesAccount) return { ...acc, balance: acc.balance + subtotal };
      if (acc.id === creditVatLiabilityAccount) return { ...acc, balance: acc.balance + vatAmount };
      return acc;
    });
    setAccounts(updatedAccounts);

    // Create journal entry lines
    const activeDebitAccountObj = accounts.find(a => a.id === debitAccount)!;
    const activeSalesAccountObj = accounts.find(a => a.id === creditSalesAccount)!;
    const activeVatAccountObj = accounts.find(a => a.id === creditVatLiabilityAccount)!;

    const newJournal: JournalEntry = {
      id: `je-${Date.now()}`,
      date: dateStr,
      reference: newInvoice.invoiceNumber,
      description: `Sales recognition for ${newInvoice.invoiceNumber} to ${customer.nameEn}`,
      isSystem: true,
      lines: [
        {
          accountId: debitAccount,
          accountNameEn: activeDebitAccountObj.nameEn,
          accountNameAr: activeDebitAccountObj.nameAr,
          debit: total,
          credit: 0
        },
        {
          accountId: creditSalesAccount,
          accountNameEn: activeSalesAccountObj.nameEn,
          accountNameAr: activeSalesAccountObj.nameAr,
          debit: 0,
          credit: subtotal
        },
        {
          accountId: creditVatLiabilityAccount,
          accountNameEn: activeVatAccountObj.nameEn,
          accountNameAr: activeVatAccountObj.nameAr,
          debit: 0,
          credit: vatAmount
        }
      ]
    };
    setJournalEntries([newJournal, ...journalEntries]);

    // Reset Form
    setSelectedCustomerId('');
    setItems([{ productId: '', qty: 1, unitPrice: 0 }]);
    setNotes('');
    const today = new Date().toISOString().split('T')[0];
    setInvoiceDate(today);
    setDueDate(today);
    setManualInvoiceNumber('');
    setIsManualNumberEdited(false);
    setSelectedInvoice(newInvoice);
    setActiveTab('list');
    onPendingUseReservedConsumed?.();
  };

  // 9. Process Credit Note / Return
  const handleIssueReturn = () => {
    if (!returnReason.trim()) {
      alert(lang === 'en' ? "Please specify a return reason" : "يرجى تحديد سبب الإرجاع");
      return;
    }

    const targetInvoice = invoices.find(inv => inv.id === returnInvoiceId);
    if (!targetInvoice) return;

    // Mark invoice as returned
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === targetInvoice.id) {
        return {
          ...inv,
          isReturned: true,
          returnReason: returnReason
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);

    // Hook A: Add returned quantities back to inventory stock
    const updatedProducts = products.map(prod => {
      const returnedItem = targetInvoice.items.find(item => item.productId === prod.id);
      if (returnedItem) {
        const currentWhStock = prod.warehouseStock[targetInvoice.warehouseId] || 0;
        return {
          ...prod,
          stockLevel: prod.stockLevel + returnedItem.qty,
          warehouseStock: {
            ...prod.warehouseStock,
            [targetInvoice.warehouseId]: currentWhStock + returnedItem.qty
          }
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // Hook B: Adjust customer balances back if invoice was Credit
    if (targetInvoice.paymentMethod === 'Credit') {
      const updatedCustomers = customers.map(c => {
        if (c.id === targetInvoice.customerId) {
          return { ...c, balance: Math.max(0, c.balance - targetInvoice.total) };
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }

    // Hook C: Balance Ledger (Reversed Entry)
    const debitAccount = targetInvoice.paymentMethod === 'Credit' ? 'acc-1200' : 'acc-1002';
    const creditSalesAccount = 'acc-4001';
    const creditVatLiabilityAccount = 'acc-2150';

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === debitAccount) return { ...acc, balance: acc.balance - targetInvoice.total };
      if (acc.id === creditSalesAccount) return { ...acc, balance: acc.balance - targetInvoice.subtotal };
      if (acc.id === creditVatLiabilityAccount) return { ...acc, balance: acc.balance - targetInvoice.vatAmount };
      return acc;
    });
    setAccounts(updatedAccounts);

    const activeDebitAccountObj = accounts.find(a => a.id === debitAccount)!;
    const activeSalesAccountObj = accounts.find(a => a.id === creditSalesAccount)!;
    const activeVatAccountObj = accounts.find(a => a.id === creditVatLiabilityAccount)!;

    const newJournal: JournalEntry = {
      id: `je-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      reference: `CN-${targetInvoice.invoiceNumber}`,
      description: `Credit Note for returns on ${targetInvoice.invoiceNumber}: ${returnReason}`,
      isSystem: true,
      lines: [
        {
          accountId: creditSalesAccount,
          accountNameEn: activeSalesAccountObj.nameEn,
          accountNameAr: activeSalesAccountObj.nameAr,
          debit: targetInvoice.subtotal,
          credit: 0
        },
        {
          accountId: creditVatLiabilityAccount,
          accountNameEn: activeVatAccountObj.nameEn,
          accountNameAr: activeVatAccountObj.nameAr,
          debit: targetInvoice.vatAmount,
          credit: 0
        },
        {
          accountId: debitAccount,
          accountNameEn: activeDebitAccountObj.nameEn,
          accountNameAr: activeDebitAccountObj.nameAr,
          debit: 0,
          credit: targetInvoice.total
        }
      ]
    };
    setJournalEntries([newJournal, ...journalEntries]);

    // Close Return Drawer
    setShowReturnModal(false);
    setReturnReason('');
    // Refresh currently viewed invoice in state
    setSelectedInvoice({
      ...targetInvoice,
      isReturned: true,
      returnReason: returnReason
    });
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    const printContent = document.getElementById('printable-a4-area');
    if (!printContent) return;
    const printWindow = window.open(
      'about:blank',
      String(Date.now()),
      'left=50,top=50,width=850,height=950,toolbar=0,scrollbars=1,status=0'
    );
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedInvoice.invoiceNumber}</title>
          <script src="https://cdn.tailwindcss.com"><\/script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: { blue: { 850: '#1e3a8a' } },
                  fontFamily: {
                    sans: ['Inter', 'Tajawal', 'Cairo', 'sans-serif'],
                    mono: ['JetBrains Mono', 'Fira Code', 'monospace']
                  }
                }
              }
            }
          <\/script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700&display=swap');
            * { box-sizing: border-box; }
            body {
              font-family: 'Inter', 'Tajawal', 'Cairo', sans-serif;
              margin: 0; padding: 0; background: #ffffff; color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .font-serif-elegant { font-family: 'Playfair Display', Georgia, serif !important; }
            @media print {
              @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
              body { background: #ffffff; }
              #printable-a4-area {
                min-height: 0 !important; height: auto !important; padding: 0 !important;
                border: none !important; box-shadow: none !important;
                max-width: 100% !important; width: 100% !important;
              }
              table { page-break-inside: avoid; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 500);
            }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getInvoiceCompanyId = (inv: Invoice) =>
    inv.companyId || inv.companyDetails?.id || '';


  const getInvoiceCompanyName = (inv: Invoice) => {
    if (lang === 'en') {
      return inv.companyNameEn || inv.companyDetails?.nameEn || '';
    }
    return inv.companyNameAr || inv.companyDetails?.nameAr || inv.companyNameEn || inv.companyDetails?.nameEn || '';
  };

  const openInvoicePreview = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowPreviewModal(true);
  };

  const clearRegistryFilters = () => {
    setFilterInvoiceNumber('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCompanyId('');
    setFilterCustomer('');
    setFilterInvoiceType('All');
  };

  const recentInvoices = [...invoices]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 3);

  const filteredInvoices = invoices.filter(inv => {
    const numberQ = filterInvoiceNumber.trim().toLowerCase();
    if (numberQ && !inv.invoiceNumber.toLowerCase().includes(numberQ)) return false;

    if (filterDateFrom && inv.date < filterDateFrom) return false;
    if (filterDateTo && inv.date > filterDateTo) return false;

    if (filterCompanyId) {
      const invCompanyId = getInvoiceCompanyId(inv);
      if (invCompanyId !== filterCompanyId) return false;
    }

    const customerQ = filterCustomer.trim().toLowerCase();
    if (customerQ) {
      const matchCustomer =
        inv.customerNameEn.toLowerCase().includes(customerQ)
        || inv.customerNameAr.toLowerCase().includes(customerQ);
      if (!matchCustomer) return false;
    }

    if (filterInvoiceType !== 'All' && inv.invoiceType !== filterInvoiceType) return false;

    return true;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="invoice-module-container">
      {/* LEFT COLUMN: Controls, list, or Creation Form */}
      <div className={`${activeTab === 'list' ? 'xl:col-span-12' : 'xl:col-span-7'} flex flex-col space-y-4`}>
        
        {/* Toggle Panel Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'list' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {lang === 'en' ? "Invoice Registry" : "سجل الفواتير"}
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'create' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {lang === 'en' ? "Issue Tax Invoice" : "إصدار فاتورة ضريبية"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">
              {lang === 'en' ? "ZATCA Sandboxed" : "الربط التجريبي فعال"}
            </span>
          </div>
        </div>

        {/* Tab 1: Invoice Registry */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Audit-Ready — last 3 invoices only */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  {lang === 'en' ? "Audit-Ready Tax Invoices" : "الفواتير الضريبية المعتمدة للمراجعة"}
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                  {lang === 'en' ? 'Last 3' : 'آخر 3'}
                </span>
              </div>

              {recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {lang === 'en' ? "No invoices issued yet." : "لا توجد فواتير صادرة بعد."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recentInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className="border border-slate-200 rounded-xl p-3 space-y-2 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-800 text-xs truncate">{inv.invoiceNumber}</span>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          inv.invoiceType === 'Standard'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {inv.invoiceType === 'Standard' ? t.standard : t.simplified}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {lang === 'en' ? inv.customerNameEn : inv.customerNameAr}
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">{inv.date}</span>
                        <span className={`font-mono font-bold ${inv.isReturned ? 'text-rose-600 line-through' : 'text-slate-900'}`}>
                          {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openInvoicePreview(inv)}
                        className="w-full mt-1 py-1.5 text-[10px] font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        {lang === 'en' ? 'View' : 'عرض'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full registry table with filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'en' ? "Invoice Registry Records" : "سجلات سجل الفواتير"}
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                  {filteredInvoices.length} {lang === 'en' ? 'Records' : 'سجل'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    {lang === 'en' ? 'Invoice Number' : 'رقم الفاتورة'}
                  </label>
                  <div className="relative">
                    <Search className={`absolute top-2.5 ${isRtl ? 'right-2.5' : 'left-2.5'} w-3.5 h-3.5 text-slate-400`} />
                    <input
                      type="text"
                      value={filterInvoiceNumber}
                      onChange={(e) => setFilterInvoiceNumber(e.target.value)}
                      placeholder={lang === 'en' ? 'Search number…' : 'بحث بالرقم…'}
                      className={`w-full py-2 ${isRtl ? 'pr-8 pl-2' : 'pl-8 pr-2'} bg-slate-100 border-none rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    {lang === 'en' ? 'Date From' : 'من تاريخ'}
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full py-2 px-2 bg-slate-100 border-none rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    {lang === 'en' ? 'Date To' : 'إلى تاريخ'}
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full py-2 px-2 bg-slate-100 border-none rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    {lang === 'en' ? 'Company' : 'الشركة'}
                  </label>
                  <select
                    value={filterCompanyId}
                    onChange={(e) => setFilterCompanyId(e.target.value)}
                    className="w-full py-2 px-2 bg-slate-100 border-none rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">{lang === 'en' ? 'All companies' : 'كل الشركات'}</option>
                    {(companies.length ? companies : [company]).map(c => (
                      <option key={c.id} value={c.id}>
                        {lang === 'en' ? c.nameEn : c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    {lang === 'en' ? 'Customer' : 'العميل'}
                  </label>
                  <input
                    type="text"
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    placeholder={lang === 'en' ? 'Customer name…' : 'اسم العميل…'}
                    className="w-full py-2 px-2 bg-slate-100 border-none rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    {lang === 'en' ? 'Invoice Type' : 'نوع الفاتورة'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={filterInvoiceType}
                      onChange={(e) => setFilterInvoiceType(e.target.value as 'All' | 'Standard' | 'Simplified')}
                      className="flex-1 py-2 px-2 bg-slate-100 border-none rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="All">{lang === 'en' ? 'All types' : 'كل الأنواع'}</option>
                      <option value="Simplified">{t.simplified}</option>
                      <option value="Standard">{t.standard}</option>
                    </select>
                    <button
                      type="button"
                      onClick={clearRegistryFilters}
                      className="px-2.5 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 cursor-pointer"
                      title={lang === 'en' ? 'Clear filters' : 'مسح الفلاتر'}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-start min-w-[900px]">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Invoice #' : 'رقم الفاتورة'}</th>
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Date' : 'التاريخ'}</th>
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Due Date' : 'الاستحقاق'}</th>
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Company' : 'الشركة'}</th>
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Customer' : 'العميل'}</th>
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Type' : 'النوع'}</th>
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Payment' : 'الدفع'}</th>
                      <th className="px-3 py-2.5 font-bold text-end">{lang === 'en' ? 'Total' : 'الإجمالي'}</th>
                      <th className="px-3 py-2.5 font-bold">{lang === 'en' ? 'Status' : 'الحالة'}</th>
                      <th className="px-3 py-2.5 font-bold text-center">{lang === 'en' ? 'Actions' : 'إجراءات'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-12 text-center text-slate-400">
                          {lang === 'en' ? 'No invoices match the current filters.' : 'لا توجد فواتير مطابقة للفلاتر الحالية.'}
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">{inv.date}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">{inv.dueDate || inv.date}</td>
                          <td className="px-3 py-2.5 text-slate-700 max-w-[140px] truncate" title={getInvoiceCompanyName(inv)}>
                            {getInvoiceCompanyName(inv) || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 max-w-[140px] truncate">
                            {lang === 'en' ? inv.customerNameEn : inv.customerNameAr}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              inv.invoiceType === 'Standard'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {inv.invoiceType === 'Standard' ? t.standard : t.simplified}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{inv.paymentMethod}</td>
                          <td className={`px-3 py-2.5 font-mono font-bold text-end ${inv.isReturned ? 'text-rose-600 line-through' : 'text-slate-900'}`}>
                            {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                          </td>
                          <td className="px-3 py-2.5">
                            {inv.isReturned ? (
                              <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {lang === 'en' ? 'Returned' : 'مرتجع'}
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {lang === 'en' ? 'Active' : 'نشط'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => openInvoicePreview(inv)}
                                className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'en' ? 'View' : 'عرض'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'en' ? 'Delete Invoice' : 'حذف الفاتورة'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Create Tax Invoice */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitInvoice} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                {lang === 'en' ? "Create Saudi ZATCA Compliant Invoice" : "إنشاء فاتورة متوافقة مع هيئة الزكاة"}
              </h3>
            </div>

            {/* Quick Header Grid — 9 fields, 3 per row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-indigo-600 font-bold mb-1">
                  {lang === 'en' ? "Issue from Company *" : "إصدار من شركة *"}
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full bg-indigo-50/50 p-2 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden font-bold text-indigo-950"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {lang === 'en' ? c.nameEn : c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t.invoiceType}</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as any)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                >
                  <option value="Simplified">{t.simplified} (B2C)</option>
                  <option value="Standard">{t.standard} (B2B)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t.customer}</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                >
                  <option value="">-- {lang === 'en' ? 'Select Customer' : 'اختر العميل'} --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {lang === 'en' ? `${c.code} - ${c.nameEn}` : `${c.code} - ${c.nameAr}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t.warehouse}</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {lang === 'en' ? w.nameEn : w.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t.paymentMethod}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                >
                  <option value="Cash">Cash (كاش)</option>
                  <option value="Credit">Credit (على الحساب)</option>
                  <option value="Bank Transfer">Bank Transfer (تحويل بنكي)</option>
                  <option value="Mada">Mada (مدى)</option>
                  <option value="Visa">Visa (فيزا)</option>
                  <option value="Mastercard">Mastercard (ماستركارد)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1 flex items-center justify-between">
                  <span>{lang === 'en' ? "Invoice Number *" : "رقم الفاتورة *"}</span>
                  <span className="flex items-center gap-2">
                    {canSkipInvoiceNumber && (
                      <button
                        type="button"
                        onClick={handleSkipInvoiceNumber}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-extrabold hover:underline cursor-pointer"
                        title={lang === 'en' ? "Reserve this number and use the next one" : "حجز هذا الرقم واستخدام الرقم التالي"}
                      >
                        {lang === 'en' ? "Skip" : "تخطي"}
                      </button>
                    )}
                    {isManualNumberEdited && (
                      <button
                        type="button"
                        onClick={() => setIsManualNumberEdited(false)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold hover:underline cursor-pointer"
                        title={lang === 'en' ? "Reset to Auto-suggested Number" : "إعادة التعيين إلى الرقم التلقائي"}
                      >
                        {lang === 'en' ? "Auto" : "تلقائي"}
                      </button>
                    )}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={manualInvoiceNumber}
                  onChange={(e) => {
                    setManualInvoiceNumber(e.target.value);
                    setIsManualNumberEdited(true);
                  }}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden font-mono font-bold text-slate-800"
                />
                {invoiceNumberConflict(manualInvoiceNumber, invoices, reservedInvoices, issuingCompany) === 'reserved' && (
                  <p className="mt-1 text-[11px] text-amber-700 font-semibold">
                    {lang === 'en'
                      ? 'This number is reserved. Issuing it will use the reservation.'
                      : 'هذا الرقم محجوز. إصداره سيستخدم الحجز.'}
                  </p>
                )}
                {canViewReservedList && onOpenReservedList && (
                  <button
                    type="button"
                    onClick={() => onOpenReservedList(selectedCompanyId)}
                    className="mt-1 text-[10px] text-[#006C35] hover:text-[#005c2e] font-extrabold hover:underline cursor-pointer"
                  >
                    {lang === 'en' ? 'Reserved list' : 'قائمة المحجوز'}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  {lang === 'en' ? "Invoice Date *" : "تاريخ الفاتورة *"}
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDueDate(prev => (prev === invoiceDate || prev < next ? next : prev));
                    setInvoiceDate(next);
                  }}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  {lang === 'en' ? "Due Date *" : "تاريخ الاستحقاق *"}
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  min={invoiceDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Vat Percentage" : "نسبة الضريبة"}</label>
                <input
                  type="text"
                  disabled
                  value="15% (Saudi Standard VAT)"
                  className="w-full bg-slate-100 p-2 border-none rounded-xl text-slate-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* LINE ITEMS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700">{t.items}</span>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  + {lang === 'en' ? "Add Item Line" : "إضافة سطر صنف"}
                </button>
              </div>

              {items.map((item, idx) => {
                const isCustom = item.productId === 'custom';
                const prod = isCustom ? null : products.find(p => p.id === item.productId);
                const sub = item.qty * item.unitPrice;
                const vat = sub * 0.15;
                const tot = sub + vat;

                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                    <div className="col-span-4 text-xs">
                      <label className="block text-[10px] text-slate-500 mb-0.5">{t.productName}</label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                        required
                        className="w-full bg-white p-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      >
                        <option value="">-- {lang === 'en' ? 'Select Product' : 'اختر المنتج'} --</option>
                        <option value="custom">✍️ {lang === 'en' ? '-- Custom Item (Manual Entry) --' : '-- صنف مخصص (إدخال يدوي) --'}</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stockLevel <= 0}>
                            {lang === 'en' ? p.nameEn : p.nameAr} ({p.stockLevel} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 text-xs">
                      <label className="block text-[10px] text-slate-500 mb-0.5">{t.qty}</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItemRow(idx, 'qty', e.target.value)}
                        required
                        className="w-full bg-white p-1.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div className="col-span-3 text-xs">
                      <label className="block text-[10px] text-slate-500 mb-0.5">{t.unitPrice}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItemRow(idx, 'unitPrice', e.target.value)}
                        required
                        className="w-full bg-white p-1.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div className="col-span-2 text-[10px] text-slate-500 pb-2">
                      <div className="font-mono text-slate-800 font-bold">{tot.toFixed(2)}</div>
                      <div className="opacity-80">Inc. 15%</div>
                    </div>

                    <div className="col-span-1 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isCustom && (
                      <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-200 bg-white p-2.5 rounded-lg">
                        <div className="text-xs">
                          <label className="block text-[9px] text-slate-400 mb-0.5 font-bold">
                            {lang === 'en' ? "Item Name (English) *" : "اسم الصنف (إنجليزي) *"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Custom Consulting"
                            value={item.customNameEn || ''}
                            onChange={(e) => updateItemRow(idx, 'customNameEn', e.target.value)}
                            onBlur={(e) => {
                              if (!item.customNameAr || item.customNameAr.trim() === '') {
                                handleAutoTranslate(idx, e.target.value);
                              }
                            }}
                            className="w-full bg-slate-50 p-1 border border-slate-200 rounded-md text-[10px]"
                          />
                        </div>
                        <div className="text-xs">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[9px] text-slate-400 font-bold">
                              {lang === 'en' ? "Item Name (Arabic) (Optional)" : "اسم الصنف (عربي) (اختياري)"}
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAutoTranslate(idx, item.customNameEn || '')}
                              className="text-[8px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                              title={lang === 'en' ? "Translate via Gemini AI" : "ترجمة عبر الذكاء الاصطناعي"}
                            >
                              {translatingIdx === idx ? (
                                <span className="w-2 h-2 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                              ) : "✨"}
                              {lang === 'en' ? "AI Translate" : "ترجمة بالذكاء"}
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="مثال: استشارة خاصة"
                            value={item.customNameAr || ''}
                            onChange={(updateVal) => updateItemRow(idx, 'customNameAr', updateVal.target.value)}
                            className="w-full bg-slate-50 p-1 border border-slate-200 rounded-md text-[10px] text-right animate-pulse-once"
                          />
                        </div>
                        <div className="text-xs font-mono">
                          <label className="block text-[9px] text-slate-400 mb-0.5 font-sans font-bold">
                            {lang === 'en' ? "SKU Code (Optional)" : "رمز SKU (اختياري)"}
                          </label>
                          <input
                            type="text"
                            value={item.customSku || ''}
                            onChange={(e) => updateItemRow(idx, 'customSku', e.target.value)}
                            className="w-full bg-slate-50 p-1 border border-slate-200 rounded-md text-[10px]"
                          />
                        </div>
                        <div className="text-xs">
                          <label className="block text-[9px] text-slate-400 mb-0.5 font-bold">
                            {lang === 'en' ? "Unit Label" : "رمز الوحدة"}
                          </label>
                          <input
                            type="text"
                            value={item.customUnit || ''}
                            onChange={(e) => updateItemRow(idx, 'customUnit', e.target.value)}
                            className="w-full bg-slate-50 p-1 border border-slate-200 rounded-md text-[10px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footnote Notes */}
            <div className="text-xs">
              <label className="block text-slate-500 font-semibold mb-1">{t.notes}</label>
              <textarea
                placeholder={lang === 'en' ? "Invoice footer notes, custom terms, etc." : "ملاحظات تذييل الفاتورة، شروط الدفع، الخ"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              />
            </div>

            {/* Grand Totals */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="opacity-80">{t.subtotal}</div>
                <div className="font-mono text-sm font-semibold">{formSubtotal.toFixed(2)} SAR</div>
              </div>
              <div>
                <div className="opacity-80">{t.vatAmount}</div>
                <div className="font-mono text-sm font-semibold text-blue-400">{formVat.toFixed(2)} SAR</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-amber-400">{t.invoiceTotal}</div>
                <div className="font-mono text-lg font-bold text-amber-400">{formTotal.toFixed(2)} SAR</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {lang === 'en' ? "Issue & Certify Invoice" : "إصدار واعتماد الفاتورة"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* RIGHT COLUMN: Print designer + ZATCA status (create tab only) */}
      {activeTab === 'create' && (
      <div className="xl:col-span-5 flex flex-col space-y-4">
        
        {/* Designer / Quick Layout Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
            <Settings className="w-4 h-4 text-slate-500 animate-spin-slow" />
            <h4 className="font-bold text-slate-800 text-xs">
              {lang === 'en' ? "Live Print & Layout Designer" : "مصمم القوالب والطباعة المباشر"}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Vibe/Theme Style" : "أسلوب وتنسيق القالب"}</label>
              <select
                value={designerTemplate}
                onChange={(e) => setDesignerTemplate(e.target.value as any)}
                className="w-full bg-slate-50 p-1.5 border border-slate-100 rounded-lg text-[10px]"
              >
                <option value="professional">📋 Professional Classic</option>
                <option value="corporate">🏢 Modern Corporate</option>
                <option value="minimal">🏳️ Sleek Minimalist</option>
                <option value="modern">⚡ Bold Tech Modern</option>
                <option value="luxury">💎 Golden Luxury</option>
                <option value="elegant-serif">🏛️ Classic Elegant Serif</option>
                <option value="compact-dense">📊 Compact Dense</option>
                <option value="royal-executive">👑 Royal Executive</option>
                <option value="creative-orange">🍊 Sunset Creative</option>
                <option value="nordic-sage">🌿 Nordic Sage</option>
                <option value="crimson-classic">🍷 Crimson Classic</option>
                <option value="monochrome-stark">◼️ Monochrome Stark</option>
                <option value="saldo-blue">🔹 Saldo Blue / Arabic Invoice</option>
                <option value="elaf-classic">🕌 Elaf Classic / فاتورة إيلاف الكلاسيكية</option>
                <option value="buyp-tech">🚀 Buyp Tech / فاتورة بايب للتقنية</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Template Lang" : "لغة مستند الطباعة"}</label>
              <select
                value={designerLanguage}
                onChange={(e) => setDesignerLanguage(e.target.value as any)}
                className="w-full bg-slate-50 p-1.5 border border-slate-100 rounded-lg text-[10px]"
              >
                <option value="bilingual">🌐 Bilingual (English & العربي)</option>
                <option value="en">🇬🇧 English Only</option>
                <option value="ar">🇸🇦 العربي فقط</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "QR Code Position" : "موضع رمز QR"}</label>
              <select
                value={designerQrPos}
                onChange={(e) => setDesignerQrPos(e.target.value as any)}
                className="w-full bg-slate-50 p-1.5 border border-slate-100 rounded-lg text-[10px]"
              >
                <option value="top-right">↗️ {lang === 'en' ? "Top Right" : "أعلى اليمين"}</option>
                <option value="top-left">↖️ {lang === 'en' ? "Top Left" : "أعلى اليسار"}</option>
                <option value="bottom-right">↘️ {lang === 'en' ? "Bottom Right" : "أسفل اليمين"}</option>
                <option value="bottom-left">↙️ {lang === 'en' ? "Bottom Left" : "أسفل اليسار"}</option>
                <option value="footer">⬇️ {lang === 'en' ? "Centered Footer" : "تذييل المنتصف"}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "System Generated Notice" : "تنويه النظام"}</label>
              <div className="flex items-center h-[28px]">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={designerShowNotice}
                    onChange={(e) => setDesignerShowNotice(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>{lang === 'en' ? "Show Notice" : "عرض التنويه"}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Company Logo Visibility" : "عرض شعار المنشأة"}</label>
              <div className="flex items-center h-[28px]">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={designerShowLogo}
                    onChange={(e) => setDesignerShowLogo(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>{lang === 'en' ? "Show Logo" : "عرض الشعار"}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Bank Details Visibility" : "عرض الحساب البنكي"}</label>
              <div className="flex items-center h-[28px]">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={designerShowBankDetails}
                    onChange={(e) => setDesignerShowBankDetails(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>{lang === 'en' ? "Show Bank Details" : "إظهار الحساب البنكي"}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ZATCA Compliance Validator & Status Badge Widget */}
        {selectedInvoice && (() => {
          const zatcaResult = validateZatcaCompliance(selectedInvoice, company);
          return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${zatcaResult.isCompliant ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      {lang === 'en' ? "ZATCA Compliance Hub" : "مركز امتثال هيئة الزكاة والضريبة"}
                    </h4>
                    <p className="text-[9px] text-slate-400">
                      {lang === 'en' ? "KSA VAT & ZATCA Phase 1 & 2 Regulations" : "المرحلة الأولى والثانية لفوترة هيئة الزكاة والجمارك"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                    zatcaResult.isCompliant 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {zatcaResult.isCompliant 
                      ? (lang === 'en' ? "✓ ZATCA Compliant" : "✓ مطابق للزكاة والضريبة")
                      : (lang === 'en' ? "⚠ Action Required" : "⚠ يتطلب مراجعة")
                    }
                  </span>
                  <span className="text-xs font-bold text-slate-600 font-mono">
                    {zatcaResult.score}/100
                  </span>
                </div>
              </div>

              {/* Progress Bar / Animated Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-semibold text-slate-400">
                  <span>{lang === 'en' ? "Compliance Metric Score" : "مقياس درجة الامتثال"}</span>
                  <span className="font-mono">{zatcaResult.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${zatcaResult.score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      zatcaResult.score === 100 
                        ? 'bg-emerald-500' 
                        : zatcaResult.score >= 70 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                    }`} 
                  />
                </div>
              </div>

              {/* Collapsible toggle */}
              <button
                onClick={() => setShowZatcaDetails(!showZatcaDetails)}
                className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>{showZatcaDetails ? (lang === 'en' ? "Hide Regulatory Rules Checklist" : "إخفاء قائمة تدقيق اللوائح") : (lang === 'en' ? "Show Regulatory Rules Checklist" : "عرض قائمة تدقيق اللوائح")}</span>
                <span className="text-[7px] text-slate-400">({zatcaResult.rules.length} checks)</span>
              </button>

              {/* Rule lists */}
              <AnimatePresence>
                {showZatcaDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-2 pt-1"
                  >
                    <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                      {zatcaResult.rules.map((rule) => (
                        <div key={rule.id} className="py-2 flex items-start gap-2 text-[10px]">
                          <div className="mt-0.5">
                            {rule.status === 'passed' ? (
                              <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            ) : rule.status === 'warning' ? (
                              <div className="w-3.5 h-3.5 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 font-bold text-[8px]">
                                <span>!</span>
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 font-bold text-[8px]">
                                <span>×</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5 text-start">
                            <div className="flex items-center justify-between font-bold text-slate-700 text-[9px]">
                              <span>{lang === 'en' ? rule.nameEn : rule.nameAr}</span>
                              <span className={`text-[7px] font-bold uppercase ${
                                rule.status === 'passed' ? 'text-emerald-600' : rule.status === 'warning' ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {rule.status === 'passed' ? (lang === 'en' ? "PASS" : "ناجح") : rule.status === 'warning' ? (lang === 'en' ? "WARN" : "تنبيه") : (lang === 'en' ? "FAIL" : "مرفوض")}
                              </span>
                            </div>
                            <div className="text-[8px] text-slate-500 leading-normal">
                              {lang === 'en' ? rule.messageEn : rule.messageAr}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-slate-50 p-2 rounded-lg text-[8px] text-slate-400 leading-normal text-start">
                      {lang === 'en' 
                        ? "* ZATCA Phase 1 & 2 regulations mandate exact 15-digit Seller tax IDs starting/ending with '3', precise 15% VAT, and sequential invoice counter traceability. Standard tax invoices require customer TRNs."
                        : "* تتطلب لوائح المرحلة الأولى والثانية من هيئة الزكاة والضريبة والجمارك أرقاماً ضريبية صحيحة من 15 خانة تبدأ وتنتهي بـ '3'، ضريبة بنسبة 15%، وتسلسل مشفر للفواتير. تتطلب الفواتير الضريبية العادية الرقم الضريبي للعميل."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}
      </div>
      )}

      {/* Invoice preview: inline on Issue tab, popup from Registry View */}
      {selectedInvoice && (showPreviewModal || activeTab === 'create') && (
        <>
          {showPreviewModal && (
            <div
              className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm"
              onClick={() => setShowPreviewModal(false)}
            />
          )}
          <div
            className={
              showPreviewModal
                ? 'fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none'
                : 'xl:col-span-12'
            }
          >
            <div
              className={
                showPreviewModal
                  ? 'pointer-events-auto bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col'
                  : 'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between'
              }
            >
              <div className={`bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs ${showPreviewModal ? 'shrink-0' : ''}`}>
                <span className="font-medium text-slate-700">
                  {lang === 'en' ? `Viewing: ${selectedInvoice.invoiceNumber}` : `عرض: ${selectedInvoice.invoiceNumber}`}
                </span>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {lang === 'en' ? 'Print' : 'طباعة'}
                  </button>
                  <button
                    type="button"
                    disabled={selectedInvoice.isReturned}
                    onClick={() => {
                      setReturnInvoiceId(selectedInvoice.id);
                      setShowReturnModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    {lang === 'en' ? 'Credit Note' : 'إشعار دائن'}
                  </button>
                  {showPreviewModal && (
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(false)}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                      title={lang === 'en' ? 'Close' : 'إغلاق'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className={showPreviewModal ? 'overflow-y-auto p-4 bg-slate-100/80' : ''}>

            {/* A4 Container */}
            <div 
              id="printable-a4-area" 
              className={`p-5 text-slate-800 text-[10px] relative flex flex-col justify-between min-h-[700px] shadow-xs duration-300 transition-all bg-white ${tpl.container}`}
              dir={designerLanguage === 'ar' ? 'rtl' : 'ltr'}
            >
              <div>
                {/* HEADER AREA */}
                <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-200 items-start">
                  {/* Top Left QR Position */}
                  {designerQrPos === 'top-left' && (
                    <div className="col-span-3 flex justify-start">
                      {renderQrCode("w-14 h-14")}
                    </div>
                  )}

                  {/* Logo & Seller Info */}
                  <div className={`${designerQrPos === 'top-left' ? 'col-span-5' : 'col-span-8'} space-y-1 text-start`}>
                    <div className="flex items-start gap-2">
                      {designerShowLogo && invCompany.logoUrl && (
                        <img
                          src={invCompany.logoUrl}
                          alt="Company Logo"
                          className="max-h-12 max-w-[48px] object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="mb-2">
                          {designerLanguage !== 'ar' && <h3 className="font-extrabold text-slate-900 text-xs tracking-tight">{invCompany.nameEn}</h3>}
                          {designerLanguage !== 'en' && <h3 className="font-bold text-slate-800 text-xs tracking-tight">{invCompany.nameAr}</h3>}
                        </div>

                        {designerLanguage !== 'ar' && (
                          <div className="text-slate-500 leading-normal text-[9px] space-y-0.5">
                            <div>VAT Registration: <span className="font-mono font-bold text-slate-800">{invCompany.vatNumber}</span></div>
                            <div>C.R. Number: <span className="font-mono">{invCompany.crNumber}</span></div>
                            <div>{invCompany.buildingNo}, {invCompany.street}, {invCompany.district}</div>
                            <div>{invCompany.city}, {invCompany.postalCode}, KSA</div>
                          </div>
                        )}

                        {designerLanguage !== 'en' && (
                          <div className="text-slate-500 leading-normal text-[9px] space-y-0.5 mt-0.5">
                            <div>الرقم الضريبي: <span className="font-mono font-bold text-slate-800">{invCompany.vatNumber}</span></div>
                            <div>سجل تجاري: <span className="font-mono">{invCompany.crNumber}</span></div>
                            <div>المبنى {invCompany.buildingNo}، {invCompany.street}، حي {invCompany.district}</div>
                            <div>{invCompany.city}، {invCompany.postalCode}، المملكة العربية السعودية</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title & QR Code */}
                  <div className="col-span-4 flex flex-col items-end space-y-2 text-end">
                    <div className="space-y-0.5">
                      <h2 className={`text-xs sm:text-sm font-extrabold uppercase tracking-tight ${tpl.titleColor}`}>
                        {designerLanguage === 'ar'
                          ? (selectedInvoice.invoiceType === 'Standard' ? "فاتورة ضريبية" : "فاتورة ضريبية مبسطة")
                          : (selectedInvoice.invoiceType === 'Standard' ? "Tax Invoice" : "Simplified Tax Invoice")
                        }
                      </h2>
                      {designerLanguage === 'bilingual' && (
                        <span className="text-slate-500 font-bold text-[8.5px] -mt-0.5 block">
                          {selectedInvoice.invoiceType === 'Standard' ? "فاتورة ضريبية" : "فاتورة ضريبية مبسطة"}
                        </span>
                      )}
                    </div>

                    {/* QR Code top-right */}
                    {designerQrPos === 'top-right' && (
                      <div className="flex justify-end">
                        {renderQrCode("w-16 h-16")}
                      </div>
                    )}
                  </div>
                </div>

                {/* THREE COLUMN BILLING & METADATA DETAILS */}
                <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-200 items-start">
                  {/* Column 1: Bill To */}
                  <div className="space-y-1 text-start">
                    <h4 className="text-slate-400 font-bold uppercase text-[8px] border-b border-slate-100 pb-0.5">
                      {designerLanguage === 'ar' ? 'فاتورة لـ / Bill To:' : (designerLanguage === 'en' ? 'Bill To:' : 'Bill To / فاتورة لـ:')}
                    </h4>
                    <div className="text-[10px] font-extrabold text-slate-900 leading-tight">
                      {designerLanguage !== 'ar' && <div>{selectedInvoice.customerNameEn}</div>}
                      {designerLanguage !== 'en' && <div>{selectedInvoice.customerNameAr}</div>}
                    </div>
                    <div className="text-slate-500 space-y-0.5 text-[9px] mt-1">
                      {selectedInvoice.customerVat && (
                        <div>
                          {designerLanguage === 'ar' ? 'الرقم الضريبي للعميل: ' : 'Customer VAT: '}
                          <span className="font-mono font-bold text-slate-800">{selectedInvoice.customerVat}</span>
                        </div>
                      )}
                      <div>
                        {designerLanguage === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia'}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Ship To */}
                  <div className="space-y-1 text-start">
                    <h4 className="text-slate-400 font-bold uppercase text-[8px] border-b border-slate-100 pb-0.5">
                      {designerLanguage === 'ar' ? 'الشحن إلى / Ship To:' : (designerLanguage === 'en' ? 'Ship To:' : 'Ship To / الشحن إلى:')}
                    </h4>
                    <div className="text-[10px] font-extrabold text-slate-900 leading-tight">
                      {designerLanguage !== 'ar' && <div>{selectedInvoice.customerNameEn}</div>}
                      {designerLanguage !== 'en' && <div>{selectedInvoice.customerNameAr}</div>}
                    </div>
                    <div className="text-slate-500 space-y-0.5 text-[9px] mt-1">
                      <div>
                        {designerLanguage === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia'}
                      </div>
                      <div className="font-mono text-slate-400 text-[8px]">00000000</div>
                    </div>
                  </div>

                  {/* Column 3: Invoice Metadata */}
                  <div className="space-y-1 text-end">
                    <h4 className="text-slate-400 font-bold uppercase text-[8px] border-b border-slate-100 pb-0.5">
                      {designerLanguage === 'ar' ? 'تفاصيل الفاتورة / Invoice Info:' : (designerLanguage === 'en' ? 'Invoice Info:' : 'Invoice Info / تفاصيل:')}
                    </h4>
                    <div className="space-y-1 text-slate-600 text-[9px] pt-1">
                      <div className="flex justify-between gap-1">
                        <span className="text-slate-400">{designerLanguage === 'ar' ? 'الرقم:' : 'Number:'}</span>
                        <span className="font-mono font-bold text-slate-800">{selectedInvoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className="text-slate-400">{designerLanguage === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                        <span className="font-mono text-slate-800">{selectedInvoice.date}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className="text-slate-400">{designerLanguage === 'ar' ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>
                        <span className="font-mono text-slate-800">{selectedInvoice.dueDate || selectedInvoice.date}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className="text-slate-400">{designerLanguage === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
                        <span className="font-medium text-slate-800">{selectedInvoice.paymentMethod}</span>
                      </div>
                      {selectedInvoice.isReturned && (
                        <div className="text-rose-600 font-bold text-[8px] mt-0.5">
                          {designerLanguage === 'ar' ? '⚠️ مرتجع ملغى' : '⚠️ Returned'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* TABLE AREA */}
                <div className="py-3">
                  <table className="w-full text-start text-[9px] border-collapse" dir={designerLanguage === 'ar' ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className={`border-b font-bold ${tpl.tableHeader}`}>
                        <th className="p-1.5 text-start w-8">#</th>
                        <th className="p-1.5 text-start">
                          {designerLanguage === 'ar' ? 'الوصف' : (designerLanguage === 'en' ? 'Item Description' : 'Item Description / الوصف')}
                        </th>
                        <th className="p-1.5 text-center w-14">
                          {designerLanguage === 'ar' ? 'الوحدة' : (designerLanguage === 'en' ? 'Unit' : 'Unit / الوحدة')}
                        </th>
                        <th className="p-1.5 text-end w-20">
                          {designerLanguage === 'ar' ? 'السعر' : (designerLanguage === 'en' ? 'Price' : 'Price / السعر')}
                        </th>
                        <th className="p-1.5 text-end w-24">
                          {designerLanguage === 'ar' ? 'المجموع الفرعي' : (designerLanguage === 'en' ? 'Sub Total' : 'Sub Total / المجموع')}
                        </th>
                        <th className="p-1.5 text-end w-20">
                          {designerLanguage === 'ar' ? 'الضريبة' : (designerLanguage === 'en' ? 'Tax' : 'Tax / الضريبة')}
                        </th>
                        <th className="p-1.5 text-end w-24">
                          {designerLanguage === 'ar' ? 'المجموع' : (designerLanguage === 'en' ? 'Total' : 'Total / المجموع')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="p-1.5 text-start text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-1.5 text-start">
                            <div className="font-bold text-slate-900">
                              {designerLanguage !== 'ar' && <span>{item.nameEn}</span>}
                              {designerLanguage === 'bilingual' && <span className="mx-1 text-slate-400">•</span>}
                              {designerLanguage !== 'en' && <span>{item.nameAr}</span>}
                            </div>
                          </td>
                          <td className="p-1.5 text-center font-mono text-slate-600">{item.qty} {item.unit}</td>
                          <td className="p-1.5 text-end font-mono">{item.unitPrice.toFixed(2)}</td>
                          <td className="p-1.5 text-end font-mono">{(item.qty * item.unitPrice).toFixed(2)}</td>
                          <td className="p-1.5 text-end font-mono text-slate-500">
                            <div>{item.vatAmount.toFixed(2)}</div>
                            <div className="text-[7px] text-slate-400">15%</div>
                          </td>
                          <td className="p-1.5 text-end font-mono font-bold text-slate-900">{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                {/* BOTTOM SUMMARY & BANK DETAILS SECTION */}
                <div className="grid grid-cols-12 gap-4 py-3 border-t border-slate-200 items-start">
                  {/* Bank Account details (Left) */}
                  {designerShowBankDetails ? (
                    <div className={`${
                      designerQrPos === 'bottom-left' 
                        ? 'col-span-4' 
                        : designerQrPos === 'bottom-right'
                        ? 'col-span-5'
                        : 'col-span-7'
                    } space-y-1.5 text-start`}>
                      <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-100 pb-0.5">
                        {designerLanguage === 'ar' 
                          ? 'الرجاء إيداع المبلغ في الحساب المصرفي التالي' 
                          : (designerLanguage === 'en' 
                            ? 'Please deposit your payment in the following bank account' 
                            : 'الرجاء إيداع المبلغ في الحساب المصرفي التالي / Please deposit your payment in the following bank account')}
                      </div>
                      
                      <div className="grid grid-cols-12 gap-y-0.5 text-[9px] text-slate-600 leading-relaxed">
                        <div className="col-span-4 font-semibold text-slate-400">{designerLanguage === 'ar' ? 'اسم البنك:' : 'Bank Name:'}</div>
                        <div className="col-span-8 font-medium text-slate-800">{invCompany.bankName || "بنك الرياض"}</div>
                        
                        <div className="col-span-4 font-semibold text-slate-400">{designerLanguage === 'ar' ? 'اسم الحساب:' : 'Account Name:'}</div>
                        <div className="col-span-8 font-medium text-slate-800">{invCompany.nameEn} {invCompany.nameAr && `(${invCompany.nameAr})`}</div>

                        <div className="col-span-4 font-semibold text-slate-400">{designerLanguage === 'ar' ? 'رقم الحساب:' : 'Account Number:'}</div>
                        <div className="col-span-8 font-mono text-slate-800">{invCompany.bankAccountNo || "2131724229940"}</div>

                        <div className="col-span-4 font-semibold text-slate-400">{designerLanguage === 'ar' ? 'الآيبان:' : 'IBAN:'}</div>
                        <div className="col-span-8 font-mono text-slate-800">{invCompany.bankIban || "SA8920000002131724229940"}</div>
                      </div>
                    </div>
                  ) : (
                    <div className={`${
                      designerQrPos === 'bottom-left' 
                        ? 'col-span-4' 
                        : designerQrPos === 'bottom-right'
                        ? 'col-span-5'
                        : 'col-span-7'
                    }`} />
                  )}

                  {/* Bottom Left QR position option */}
                  {designerQrPos === 'bottom-left' && (
                    <div className="col-span-3 flex justify-center pt-2">
                      {renderQrCode("w-16 h-16")}
                    </div>
                  )}

                  {/* Financial Summary (Right) */}
                  <div className={`${
                    designerQrPos === 'bottom-left' 
                      ? 'col-span-5' 
                      : designerQrPos === 'bottom-right'
                      ? 'col-span-4'
                      : 'col-span-5'
                  } space-y-1 text-end`}>
                    <div className="flex justify-between text-slate-500 text-[9px] py-0.5 border-b border-slate-100">
                      <span>{designerLanguage === 'ar' ? 'المجموع الفرعي' : 'Sub Total'}</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedInvoice.subtotal.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[9px] py-0.5 border-b border-slate-100">
                      <span>{designerLanguage === 'ar' ? 'الضريبة (١٥٪)' : 'Tax (15%)'}</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedInvoice.vatAmount.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold text-[10px] py-0.5 border-b border-slate-200">
                      <span>{designerLanguage === 'ar' ? 'المجموع' : 'Total'}</span>
                      <span className="font-mono text-slate-900">{selectedInvoice.total.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[9px] py-0.5 border-b border-slate-100">
                      <span>{designerLanguage === 'ar' ? 'المبلغ المدفوع' : 'Payment Made'}</span>
                      <span className="font-mono font-semibold text-rose-500">(-) 0.00 SAR</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-lg text-slate-950 font-extrabold text-[10px] mt-1">
                      <span>{designerLanguage === 'ar' ? 'المستحق' : 'Due Amount'}</span>
                      <span className="font-mono text-xs">{selectedInvoice.total.toFixed(2)} SAR</span>
                    </div>

                    {/* Return reason if applicable */}
                    {selectedInvoice.isReturned && (
                      <div className="bg-rose-50 p-1 rounded-lg text-rose-800 text-[8px] text-start mt-1">
                        <strong>{designerLanguage === 'ar' ? 'سبب الإرجاع: ' : 'Return Reason: '}</strong>
                        {selectedInvoice.returnReason}
                      </div>
                    )}
                  </div>

                  {/* Bottom Right QR position option */}
                  {designerQrPos === 'bottom-right' && (
                    <div className="col-span-3 flex justify-end pt-2">
                      {renderQrCode("w-16 h-16")}
                    </div>
                  )}
                </div>

                {/* Centered Footer QR position option */}
                {designerQrPos === 'footer' && (
                  <div className="my-2 flex justify-center">
                    {renderQrCode("w-14 h-14")}
                  </div>
                )}

                {/* SYSTEM GENERATED ELECTRONIC NOTICE */}
                {designerShowNotice && (
                  <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-[8.5px] text-slate-500 space-y-0.5 leading-normal">
                    <div className="font-extrabold text-slate-700 flex items-center justify-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {designerLanguage === 'ar' 
                        ? "فاتورة إلكترونية معتمدة - مستند منشأ تلقائياً" 
                        : (designerLanguage === 'en' 
                          ? "Certified Electronic Invoice - System Generated Document" 
                          : "فاتورة إلكترونية معتمدة - مستند منشأ تلقائياً / Certified Electronic Invoice")}
                    </div>
                    <div className="text-slate-500">
                      {designerLanguage === 'ar' 
                        ? "هذه الفاتورة صدرت بشكل آلي من النظام وتعتبر معتمدة قانونياً دون الحاجة إلى توقيع خطي أو ختم رسمي." 
                        : (designerLanguage === 'en' 
                          ? "This document is generated automatically by an authorized electronic system and is legally valid without requiring a physical signature or official company stamp." 
                          : "هذه الفاتورة صدرت آلياً من نظام إلكتروني معتمد وتعتبر معتمدة قانونياً دون الحاجة إلى توقيع أو ختم / Automatically generated by an authorized system, legally valid without signature or stamp.")}
                    </div>
                  </div>
                )}

                {/* FOOTER */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex justify-center items-center text-[8.5px] text-slate-400 text-center w-full">
                  <div className="space-y-0.5 max-w-[500px] mx-auto font-medium">
                    {invCompany.invoiceFooterEn && <div>{invCompany.invoiceFooterEn}</div>}
                    {invCompany.invoiceFooterAr && <div>{invCompany.invoiceFooterAr}</div>}
                  </div>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'create' && !selectedInvoice && (
        <div className="xl:col-span-12">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center text-slate-400 text-xs">
            {lang === 'en'
              ? 'Issue an invoice to preview the certified ZATCA document here.'
              : 'أصدر فاتورة لعرض وثيقة زاتكا المعتمدة هنا.'}
          </div>
        </div>
      )}

      {/* MODAL / DRAWER FOR RETURNING INVOICES (CREDIT NOTES) */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[70]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 max-w-md w-full shadow-xl space-y-4 text-xs text-slate-800"
            >
              <div className="flex items-center gap-2 text-rose-600 border-b border-slate-50 pb-2">
                <Undo2 className="w-5 h-5" />
                <h3 className="font-extrabold text-base">
                  {lang === 'en' ? "Issue Saudi Credit Note / Return" : "إصدار إشعار دائن مرتجع مبيعات"}
                </h3>
              </div>

              <p className="text-slate-500">
                {lang === 'en' 
                  ? "This is an audit-ready action. Issuing a credit note will reverse the associated financial ledger records and restock products back to the warehouse."
                  : "هذا الإجراء مسجل في التدقيق المالي. إصدار الإشعار الدائن سيعكس جميع القيود المحاسبية ويعيد البضائع للمستودع المحدد."}
              </p>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {lang === 'en' ? "Reason for Return (ZATCA compliance required)" : "سبب المرتجع (متطلب إلزامي لهيئة الزكاة)"}
                </label>
                <textarea
                  required
                  placeholder={lang === 'en' ? "e.g., Defective item, customer cancelled order" : "مثال: بضاعة تالفة، إلغاء الطلب من قبل العميل"}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 p-2 border border-slate-100 rounded-xl focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="flex gap-2 justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleIssueReturn}
                  className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-sm hover:bg-rose-700"
                >
                  {lang === 'en' ? "Confirm Credit Note" : "تأكيد الإشعار الدائن"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
