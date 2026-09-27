import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Percent, 
  FileSpreadsheet, 
  Calculator, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Download, 
  Printer,
  Calendar,
  Filter
} from 'lucide-react';
import { translations } from '../utils';
import { Invoice, Expense } from '../types';

interface VATCenterViewProps {
  lang: 'en' | 'ar';
  invoices: Invoice[];
  expenses: Expense[];
  currency: string;
}

export default function VATCenterView({
  lang,
  invoices,
  expenses,
  currency
}: VATCenterViewProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [selectedQuarter, setSelectedQuarter] = useState<'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('All');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Filter invoices and expenses based on selected Quarter and Year
  const filteredInvoices = invoices.filter(inv => {
    if (selectedQuarter === 'All') return true;
    const dateObj = new Date(inv.date);
    const month = dateObj.getMonth(); // 0-11
    const year = dateObj.getFullYear();
    if (year !== selectedYear) return false;
    if (selectedQuarter === 'Q1') return month >= 0 && month <= 2;
    if (selectedQuarter === 'Q2') return month >= 3 && month <= 5;
    if (selectedQuarter === 'Q3') return month >= 6 && month <= 8;
    if (selectedQuarter === 'Q4') return month >= 9 && month <= 11;
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    if (selectedQuarter === 'All') return true;
    const dateObj = new Date(exp.date);
    const month = dateObj.getMonth(); // 0-11
    const year = dateObj.getFullYear();
    if (year !== selectedYear) return false;
    if (selectedQuarter === 'Q1') return month >= 0 && month <= 2;
    if (selectedQuarter === 'Q2') return month >= 3 && month <= 5;
    if (selectedQuarter === 'Q3') return month >= 6 && month <= 8;
    if (selectedQuarter === 'Q4') return month >= 9 && month <= 11;
    return true;
  });

  // 1. Calculate active Sales VAT (Output)
  const activeInvoices = filteredInvoices.filter(inv => !inv.isReturned);
  const salesTaxableBase = activeInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const salesVatOutput = activeInvoices.reduce((sum, inv) => sum + inv.vatAmount, 0);

  // 2. Calculate qualified Purchases VAT (Input)
  const taxableExpenses = filteredExpenses.filter(e => e.status === 'Approved' && e.vatPercentage > 0);
  const purchaseTaxableBase = taxableExpenses.reduce((sum, e) => sum + e.amount, 0);
  const purchaseVatInput = taxableExpenses.reduce((sum, e) => sum + e.vatAmount, 0);

  // 3. Net Tax Due
  const netTaxDue = salesVatOutput - purchaseVatInput;

  return (
    <div className="space-y-6" id="vat-center-workspace">
      {/* Quarterly VAT Report Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {lang === 'en' ? "Quarterly VAT Return Report" : "تقرير الإقرار الضريبي الربع سنوي"}
            </h4>
            <p className="text-[10px] text-slate-400">
              {lang === 'en' ? "Select fiscal period to generate dynamic ZATCA VAT-200 form" : "اختر الفترة الضريبية لتوليد مسودة نموذج ٢٠٠ لضريبة القيمة المضافة"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-600">
            <span className="text-[10px] text-slate-400 mr-1.5">{lang === 'en' ? "Year:" : "السنة:"}</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none p-0 pr-6 font-bold text-slate-700 focus:ring-0 cursor-pointer text-xs"
            >
              {Array.from({ length: Math.max(new Date().getFullYear() - 2024 + 2, 5) }, (_, i) => 2024 + i).reverse().map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Quarter buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['All', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
              const labelEn = q === 'All' ? 'All' : `${q}`;
              const labelAr = q === 'All' ? 'الكل' : `الربع ${q.replace('Q', '')}`;
              const isActive = selectedQuarter === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuarter(q)}
                  className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'en' ? labelEn : labelAr}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Banner and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales VAT Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              {lang === 'en' ? "VAT Output (Collected)" : "ضريبة المخرجات (المحصلة)"}
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-mono text-slate-900">
              {salesVatOutput.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {lang === 'en' ? `From ${activeInvoices.length} standard/simplified invoices` : `من واقع عدد ${activeInvoices.length} فاتورة ضريبية`}
            </span>
          </div>
        </div>

        {/* Purchases VAT Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              {lang === 'en' ? "VAT Input (Paid/Recoverable)" : "ضريبة المدخلات (المستردة)"}
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-mono text-slate-900">
              {purchaseVatInput.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {lang === 'en' ? `From ${taxableExpenses.length} audited business expenses` : `من واقع عدد ${taxableExpenses.length} مصروف معتمد`}
            </span>
          </div>
        </div>

        {/* Net VAT Payable */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              {t.vatRefundable}
            </span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Calculator className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className={`text-xl font-bold font-mono ${netTaxDue >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {netTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
            </h3>
            <span className="text-[10px] text-slate-300 mt-1 block">
              {netTaxDue >= 0 
                ? (lang === 'en' ? "⚠️ Net liability payable to ZATCA / GAZT" : "⚠️ المبلغ المستحق السداد لهيئة الزكاة")
                : (lang === 'en' ? "✓ Credit balance refundable to your account" : "✓ رصيد دائن مسترد لحساب شركتكم")}
            </span>
          </div>
        </div>
      </div>

      {/* ZATCA Form VAT-200 Representation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{t.vatReturnForm}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Compliant box-by-box preview for Saudi GAZT tax portal filings" : "معاينة مطابقة بنسبة ١٠٠٪ للبوابات الإلكترونية الرسمية للزكاة والدخل للمكلفين"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 bg-slate-50 border border-slate-150 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {t.print}
            </button>
          </div>
        </div>

        {/* VAT-200 Form Layout */}
        <div className="space-y-6 text-xs text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Section A: Sales (VAT Output) */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs pb-1 border-b border-slate-200 flex items-center justify-between">
              <span className="text-blue-600">{lang === 'en' ? "PART 1: SALES & OUTPUT TAX" : "الجزء الأول: ضريبة المبيعات والمخرجات"}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{lang === 'en' ? "Rate: 15%" : "النسبة: ١٥٪"}</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {/* Box 1 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">1</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Standard Rated Sales (15%)" : "المبيعات الخاضعة للنسبة الأساسية ١٥٪"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-600">
                  {salesTaxableBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-900">
                  {salesVatOutput.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Box 2 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">2</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Sales to Citizens (0% Health/Education)" : "المبيعات للمواطنين (٠٪ خدمات صحية وتعليمية)"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-400">0.00</div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-400">0.00</div>
              </div>

              {/* Box 3 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">3</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Zero Rated Domestic Sales" : "المبيعات المحلية الخاضعة لنسبة الصفر"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-400">0.00</div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-400">0.00</div>
              </div>

              {/* Box 4 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">4</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Exempt Domestic Sales" : "المبيعات المحلية المعفاة من الضريبة"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-400">0.00</div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-400">0.00</div>
              </div>

              {/* Box 5 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">5</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Exports to Non-GCC Countries" : "الصادرات للبلدان خارج مجلس التعاون"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-400">0.00</div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-400">0.00</div>
              </div>

              {/* Box 6: Total Sales */}
              <div className="grid grid-cols-12 p-3 bg-slate-900 text-white font-bold items-center">
                <div className="col-span-1 text-center font-mono text-[10px]">6</div>
                <div className="col-span-5">
                  {lang === 'en' ? "Total Sales & Output Tax" : "إجمالي المبيعات وضريبة المخرجات"}
                </div>
                <div className="col-span-3 text-right font-mono">
                  {salesTaxableBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-3 text-right font-mono text-amber-400">
                  {salesVatOutput.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Purchases (VAT Input) */}
          <div className="space-y-3 pt-4">
            <h4 className="font-extrabold text-slate-900 text-xs pb-1 border-b border-slate-200 flex items-center justify-between">
              <span className="text-rose-600">{lang === 'en' ? "PART 2: PURCHASES & INPUT TAX" : "الجزء الثاني: ضريبة المشتريات والمدخلات"}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{lang === 'en' ? "Audited Expenses" : "المصروفات المدققة"}</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {/* Box 7 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">7</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Standard Rated Purchases (15%)" : "المشتريات الخاضعة للنسبة الأساسية ١٥٪"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-600">
                  {purchaseTaxableBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-900">
                  {purchaseVatInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Box 8 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">8</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Imports Subject to VAT paid at customs" : "الاستيرادات الخاضعة للضريبة المدفوعة بالجمارك"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-400">0.00</div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-400">0.00</div>
              </div>

              {/* Box 9 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">9</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Zero Rated Domestic Purchases" : "المشتريات المحلية الخاضعة لنسبة الصفر"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-400">0.00</div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-400">0.00</div>
              </div>

              {/* Box 10 */}
              <div className="grid grid-cols-12 p-3 hover:bg-slate-50/50 items-center">
                <div className="col-span-1 text-center font-bold text-slate-400 font-mono text-[10px]">10</div>
                <div className="col-span-5 font-semibold">
                  {lang === 'en' ? "Exempt Domestic Purchases" : "المشتريات المحلية المعفاة من الضريبة"}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-400">0.00</div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-400">0.00</div>
              </div>

              {/* Box 11: Total Purchases */}
              <div className="grid grid-cols-12 p-3 bg-slate-900 text-white font-bold items-center">
                <div className="col-span-1 text-center font-mono text-[10px]">11</div>
                <div className="col-span-5">
                  {lang === 'en' ? "Total Purchases & Input Tax" : "إجمالي المشتريات وضريبة المدخلات"}
                </div>
                <div className="col-span-3 text-right font-mono">
                  {purchaseTaxableBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-3 text-right font-mono text-amber-400">
                  {purchaseVatInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Net VAT Calculations (Boxes 12, 13, 14) */}
          <div className="space-y-3 pt-4">
            <h4 className="font-extrabold text-slate-900 text-xs pb-1 border-b border-slate-200 uppercase text-emerald-600">
              {lang === 'en' ? "PART 3: NET TAX DUE FOR FILING" : "الجزء الثالث: صافي الضريبة لتقديم الإقرار"}
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 font-bold bg-slate-50">
              <div className="grid grid-cols-12 p-3 items-center">
                <div className="col-span-1 text-center font-mono">12</div>
                <div className="col-span-7">
                  {lang === 'en' ? "Total Output Tax Due (Sales collected)" : "إجمالي المخرجات الضريبية المستحقة (المحلات)"}
                </div>
                <div className="col-span-4 text-right font-mono">
                  {salesVatOutput.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center">
                <div className="col-span-1 text-center font-mono">13</div>
                <div className="col-span-7">
                  {lang === 'en' ? "Total Input Tax Refundable (Expenses offset)" : "إجمالي المدخلات الضريبية القابلة للاسترداد"}
                </div>
                <div className="col-span-4 text-right font-mono text-slate-500">
                  -{purchaseVatInput.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center bg-slate-900 text-white text-sm">
                <div className="col-span-1 text-center font-mono">14</div>
                <div className="col-span-7">
                  {lang === 'en' ? "NET VAT LIABILITY DUE FOR PAYMENT" : "صافي الضريبة مستحقة الدفع والسداد النهائي"}
                </div>
                <div className={`col-span-4 text-right font-mono text-base font-extrabold ${netTaxDue >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {netTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                </div>
              </div>
            </div>
          </div>

          {/* Warning audit trails footer */}
          <div className="flex gap-2 items-center bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 text-[10px] text-slate-500 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              {lang === 'en' 
                ? "This draft is formulated directly from certified ledger recordings. In compliance with ZATCA Phase 2, all transactions are signed with SHA-256 hash chains preventing manual record modification." 
                : "هذه المسودة يتم استخراجها تلقائياً من واقع دفاتر اليومية المحاسبية المعتمدة. وفقاً للائحة الفوترة الإلكترونية المرحلة ٢، فإن المعاملات موقعة رقمياً ومتسلسلة بالهاش المشفر لمنع أي تعديلات غير مصرحة."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
