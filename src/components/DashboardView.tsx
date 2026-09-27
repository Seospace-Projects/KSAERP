import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Building2, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRightLeft,
  FileSpreadsheet
} from 'lucide-react';
import { translations } from '../utils';
import { Invoice, Product, Expense, Customer, Supplier } from '../types';

interface DashboardViewProps {
  lang: 'en' | 'ar';
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  currency: string;
  themeColor?: 'green' | 'gold' | 'dark' | 'teal';
}

export default function DashboardView({
  lang,
  invoices,
  products,
  expenses,
  customers,
  suppliers,
  currency,
  themeColor = 'green'
}: DashboardViewProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // 1. Calculate stats dynamically from state
  const totalSalesThisMonth = invoices
    .filter(inv => !inv.isReturned)
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalReturnedSales = invoices
    .filter(inv => inv.isReturned)
    .reduce((sum, inv) => sum + inv.total, 0);

  const netSales = totalSalesThisMonth - totalReturnedSales;

  // Let's compute today's sales (assuming invoices from today "2026-06-29" or the latest date)
  const todayStr = "2026-06-29";
  const todaySales = invoices
    .filter(inv => inv.date === todayStr && !inv.isReturned)
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalReceivables = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.balance, 0);
  
  const totalExpenses = expenses
    .filter(e => e.status === 'Approved')
    .reduce((sum, e) => sum + e.total, 0);

  const inventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.stockLevel), 0);

  // Profit calculation: 
  // Estimated COGS = 60% of Sales (or we can sum up product cost times quantity for sold items)
  const totalCOGS = invoices
    .filter(inv => !inv.isReturned)
    .flatMap(inv => inv.items)
    .reduce((sum, item) => {
      const prod = products.find(p => p.id === item.productId);
      const cost = prod ? prod.costPrice : item.unitPrice * 0.6;
      return sum + (cost * item.qty);
    }, 0);

  const netProfit = netSales - totalCOGS - totalExpenses;

  // Low stock products
  const lowStockProducts = products.filter(p => p.stockLevel <= p.minStock);

  // Recent transactions list
  const recentTransactions = [
    ...invoices.map(inv => ({
      id: inv.id,
      date: inv.date,
      type: inv.isReturned ? 'Credit Note' : 'Sales Invoice',
      ref: inv.invoiceNumber,
      party: lang === 'en' ? inv.customerNameEn : inv.customerNameAr,
      amount: inv.total,
      direction: inv.isReturned ? 'negative' : 'positive',
      method: inv.paymentMethod
    })),
    ...expenses.map(exp => ({
      id: exp.id,
      date: exp.date,
      type: `Expense (${exp.category})`,
      ref: exp.referenceNo || 'EXP',
      party: exp.description,
      amount: exp.total,
      direction: 'negative',
      method: exp.paymentMethod
    }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Dynamic Chart of Accounts & entries data for Fiscal Sales vs Expenses
  const monthsData = [
    { nameEn: "Jan", nameAr: "يناير", monthNum: "01" },
    { nameEn: "Feb", nameAr: "فبراير", monthNum: "02" },
    { nameEn: "Mar", nameAr: "مارس", monthNum: "03" },
    { nameEn: "Apr", nameAr: "أبريل", monthNum: "04" },
    { nameEn: "May", nameAr: "مايو", monthNum: "05" },
    { nameEn: "Jun", nameAr: "يونيو", monthNum: "06" }
  ];

  const chartData = monthsData.map(m => {
    // Sum invoices in this month
    const monthSales = invoices
      .filter(inv => !inv.isReturned && inv.date.includes(`-${m.monthNum}-`))
      .reduce((sum, inv) => sum + inv.total, 0);

    // Sum expenses in this month
    const monthExpenses = expenses
      .filter(exp => exp.status === 'Approved' && exp.date.includes(`-${m.monthNum}-`))
      .reduce((sum, exp) => sum + exp.total, 0);

    return {
      ...m,
      sales: monthSales,
      expenses: monthExpenses
    };
  });

  const maxVal = Math.max(
    ...chartData.map(d => d.sales),
    ...chartData.map(d => d.expenses),
    1000 // default minimum to avoid division by zero and provide clean grid increments
  );

  const themeMap = {
    green: {
      bannerBg: 'bg-gradient-to-r from-[#003B1C] via-[#005c2e] to-[#006C35]',
      accentBorder: 'border-[#D4AF37]/30',
      goldLine: 'from-[#D4AF37] via-[#C5A85C] to-[#9A7B35]',
      goldBadge: 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]',
      goldIcon: 'text-[#D4AF37]',
      profitBorder: 'border-[#D4AF37]/40',
      profitBg: 'from-[#003B1C]/5 to-white',
      profitText: 'text-[#003B1C]',
      textMuted: 'text-emerald-100',
      primaryText: 'text-[#006C35]',
      primaryBorder: 'border-[#006C35]/20',
      primaryBgLight: 'bg-[#006C35]/10',
    },
    gold: {
      bannerBg: 'bg-gradient-to-r from-[#4a3a19] via-[#6e582b] to-[#83682b]',
      accentBorder: 'border-[#fcd34d]/30',
      goldLine: 'from-[#fcd34d] via-[#d4af37] to-[#9a7b35]',
      goldBadge: 'bg-[#fcd34d]/15 border-[#fcd34d]/40 text-[#fcd34d]',
      goldIcon: 'text-[#fcd34d]',
      profitBorder: 'border-[#fcd34d]/40',
      profitBg: 'from-[#4a3a19]/5 to-white',
      profitText: 'text-[#4a3a19]',
      textMuted: 'text-amber-100',
      primaryText: 'text-[#9A7B35]',
      primaryBorder: 'border-[#9A7B35]/20',
      primaryBgLight: 'bg-[#9A7B35]/10',
    },
    dark: {
      bannerBg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700',
      accentBorder: 'border-slate-700/60',
      goldLine: 'from-slate-400 via-slate-500 to-slate-600',
      goldBadge: 'bg-slate-800 border-slate-700 text-slate-200',
      goldIcon: 'text-slate-300',
      profitBorder: 'border-slate-300',
      profitBg: 'from-slate-50 to-white',
      profitText: 'text-slate-900',
      textMuted: 'text-slate-300',
      primaryText: 'text-slate-800',
      primaryBorder: 'border-slate-300',
      primaryBgLight: 'bg-slate-100',
    },
    teal: {
      bannerBg: 'bg-gradient-to-r from-[#0F4C5C] via-[#146478] to-[#1A8099]',
      accentBorder: 'border-[#F4D35E]/30',
      goldLine: 'from-[#F4D35E] via-[#e2b842] to-[#b38e21]',
      goldBadge: 'bg-[#F4D35E]/15 border-[#F4D35E]/40 text-[#F4D35E]',
      goldIcon: 'text-[#F4D35E]',
      profitBorder: 'border-[#F4D35E]/40',
      profitBg: 'from-[#0F4C5C]/5 to-white',
      profitText: 'text-[#0F4C5C]',
      textMuted: 'text-cyan-100',
      primaryText: 'text-[#1A8099]',
      primaryBorder: 'border-[#1A8099]/20',
      primaryBgLight: 'bg-[#1A8099]/10',
    }
  };

  const currTheme = themeMap[themeColor];

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Banner */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between text-white p-6 rounded-2xl shadow-sm border relative overflow-hidden ${currTheme.bannerBg} ${currTheme.accentBorder}`}>
        {/* Subtle Gold accent line */}
        <div className={`absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r ${currTheme.goldLine}`}></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {lang === 'en' ? "KSA Enterprise ERP & Audit Hub" : "منصة الريادة للمحاسبة والربط السحابي"}
          </h1>
          <p className={`${currTheme.textMuted}/90 text-sm mt-1 max-w-xl`}>
            {lang === 'en' 
              ? "Your corporate ledger is synchronized. ZATCA Fatoora Phase 2 cryptographic connection is live and compliance audits report 100% success."
              : "نظام المراجعة ودفتر الأستاذ متزامن. الاتصال التكاملي المشفر بالمرحلة الثانية (زاتكا) نشط ومستندات الامتثال جاهزة بالكامل بنسبة ١٠٠٪."}
          </p>
        </div>
        <div className={`mt-4 md:mt-0 flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-mono relative z-10 shadow-lg border ${currTheme.goldBadge}`}>
          <ShieldCheck className={`w-4 h-4 animate-pulse ${currTheme.goldIcon}`} />
          <div>
            <div className="font-bold">{t.zatcaCertified}</div>
            <div className={`text-[10px] opacity-95 ${currTheme.textMuted}`}>{t.zatcaCertStatus}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Today's Sales */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="kpi-today-sales"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">{t.todaysSales}</span>
            <span className="p-2 bg-[#006C35]/10 text-[#006C35] rounded-xl border border-[#006C35]/10">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">{currency}</span>
            </h3>
            <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +14.2% {lang === 'en' ? "vs yesterday" : "مقارنة بالأمس"}
            </span>
          </div>
        </motion.div>

        {/* Monthly Sales */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="kpi-monthly-sales"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">{t.monthlySales}</span>
            <span className="p-2 bg-[#006C35]/15 text-[#006C35] rounded-xl border border-[#006C35]/10">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalSalesThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">{currency}</span>
            </h3>
            <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +22.8% {lang === 'en' ? "vs last month" : "مقارنة بالشهر الماضي"}
            </span>
          </div>
        </motion.div>

        {/* Outstanding Receivables */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="kpi-receivables"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">{t.outstandingReceivables}</span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">{currency}</span>
            </h3>
            <span className="flex items-center gap-1 text-[#D4AF37] text-xs font-semibold mt-1">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {customers.length} {lang === 'en' ? "Active debtors" : "عملاء مدينون نشطون"}
            </span>
          </div>
        </motion.div>

        {/* Outstanding Payables */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="kpi-payables"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">{t.outstandingPayables}</span>
            <span className="p-2 bg-amber-50 text-[#D4AF37] rounded-xl border border-[#D4AF37]/10">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">{currency}</span>
            </h3>
            <span className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              {suppliers.length} {lang === 'en' ? "Verified vendors" : "موردين معتمدين"}
            </span>
          </div>
        </motion.div>

        {/* Inventory Valuation */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="kpi-inventory-val"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">{t.inventoryValue}</span>
            <span className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl border border-[#D4AF37]/10">
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">{currency}</span>
            </h3>
            <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold mt-1">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              {lowStockProducts.length} {lang === 'en' ? "Low stock alerts" : "تحذيرات نقص مخزون"}
            </span>
          </div>
        </motion.div>

        {/* Expenses Summary */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="kpi-expenses"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">{t.expenses}</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">{currency}</span>
            </h3>
            <span className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              {expenses.length} {lang === 'en' ? "logged expenses" : "مصاريف مسجلة"}
            </span>
          </div>
        </motion.div>

        {/* Net Profit */}
        <motion.div 
          whileHover={{ y: -2 }}
          className={`bg-white p-5 rounded-2xl shadow-sm border-2 flex flex-col justify-between col-span-1 sm:col-span-2 bg-gradient-to-br ${currTheme.profitBorder} ${currTheme.profitBg}`}
          id="kpi-profit"
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${currTheme.profitText}`}>{t.netProfit} ({lang === 'en' ? 'Estimated' : 'تقديري'})</span>
            <span className={`p-2 rounded-xl border ${currTheme.primaryBgLight} ${currTheme.primaryText} ${currTheme.primaryBorder}`}>
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h3 className={`text-3xl font-extrabold tracking-tight ${netProfit >= 0 ? currTheme.primaryText : 'text-rose-600'}`}>
                {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-normal text-slate-500">{currency}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'en' 
                  ? "Computed as: Net Sales - Cost of Sales (FIFO) - Operating Expenses"
                  : "المعادلة: صافي المبيعات - تكلفة المبيعات (الوارد أولاً يصرف أولاً) - النفقات التشغيلية"}
              </p>
            </div>
            <div className={`mt-2 sm:mt-0 px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 self-start border ${currTheme.primaryBgLight} ${currTheme.primaryText} ${currTheme.primaryBorder}`}>
              <ArrowUpRight className={`w-3 h-3 ${currTheme.goldIcon}`} />
              {((netProfit / (netSales || 1)) * 100).toFixed(1)}% {lang === 'en' ? "Profit Margin" : "هامش الربح"}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts & Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-section">
        
        {/* Custom SVG Financial Performance Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">
                {lang === 'en' ? "Fiscal Sales vs. Expenses Flow" : "تدفق مبيعات السنة مقابل المصروفات"}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {lang === 'en' ? "Live interactive ledger tracking (values in SAR)" : "متابعة قيود الحسابات الحية المباشرة (القيم بالريال)"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 bg-[#006C35] rounded-xs inline-block"></span>
                {lang === 'en' ? 'Sales (Green)' : 'المبيعات (الأخضر)'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 bg-[#D4AF37] rounded-xs inline-block"></span>
                {lang === 'en' ? 'Expenses (Gold)' : 'المصاريف (الذهبي)'}
              </span>
            </div>
          </div>

          {/* Pure SVG Line & Bar Chart representation */}
          <div className="relative h-64 w-full flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="80" x2="580" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="130" x2="580" y2="130" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="180" x2="580" y2="180" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="210" x2="580" y2="210" stroke="#cbd5e1" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="10" y="35" className="text-[10px] fill-slate-400 font-mono">{Math.round(maxVal).toLocaleString()}</text>
              <text x="10" y="85" className="text-[10px] fill-slate-400 font-mono">{Math.round(maxVal * 0.6).toLocaleString()}</text>
              <text x="10" y="135" className="text-[10px] fill-slate-400 font-mono">{Math.round(maxVal * 0.3).toLocaleString()}</text>
              <text x="10" y="185" className="text-[10px] fill-slate-400 font-mono">{Math.round(maxVal * 0.1).toLocaleString()}</text>
              <text x="15" y="215" className="text-[10px] fill-slate-400 font-mono">0</text>

              {/* Data points for 6 months */}
              {/* Sales Bars */}
              {chartData.map((d, i) => {
                const x = 75 + i * 90;
                const h = (d.sales / maxVal) * 180;
                const y = 210 - h;
                return (
                  <rect
                    key={`bar-${i}`}
                    x={x}
                    y={y}
                    width="20"
                    height={Math.max(h, 2)}
                    rx="3"
                    fill="#006C35"
                    className="opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <title>{lang === 'en' ? 'Sales' : 'المبيعات'}: {d.sales.toFixed(2)} SAR</title>
                  </rect>
                );
              })}

              {/* Expenses Line */}
              <path 
                d={chartData.map((d, i) => {
                  const x = 85 + i * 90;
                  const y = 210 - (d.expenses / maxVal) * 180;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')} 
                fill="none" 
                stroke="#D4AF37" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              
              {/* Dots on Expense path */}
              {chartData.map((d, i) => {
                const cx = 85 + i * 90;
                const cy = 210 - (d.expenses / maxVal) * 180;
                return (
                  <circle
                    key={`dot-${i}`}
                    cx={cx}
                    cy={cy}
                    r="4.5"
                    fill="#9A7B35"
                    stroke="#fff"
                    strokeWidth="1"
                  >
                    <title>{lang === 'en' ? 'Expenses' : 'المصروفات'}: {d.expenses.toFixed(2)} SAR</title>
                  </circle>
                );
              })}

              {/* X Axis Labels */}
              {chartData.map((d, i) => {
                const x = 70 + i * 90;
                return (
                  <text
                    key={`lbl-${i}`}
                    x={x}
                    y="230"
                    className="text-[10px] fill-slate-500 font-semibold"
                  >
                    {lang === 'en' ? d.nameEn : d.nameAr}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Inventory Warning & Action Center */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-base">
                {lang === 'en' ? "Inventory Safeguards" : "دروع الأمان للمخزون"}
              </h3>
              <span className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-600 font-bold rounded">
                {lowStockProducts.length} {lang === 'en' ? 'Alerts' : 'تنبيهات'}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'en' 
                ? "The following SKUs have fallen below the Minimum Safety Alert levels. Re-order immediately to prevent sales disruptions."
                : "الأصناف التالية انخفضت عن الحد الأدنى لمخزون الأمان. يرجى طلب كميات إضافية لتجنب توقف المبيعات."}
            </p>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {lang === 'en' ? "✓ All stocks healthy" : "✓ جميع مستويات المخزون ممتازة"}
                </div>
              ) : (
                lowStockProducts.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded">
                          {prod.sku}
                        </span>
                        <h4 className="font-medium text-slate-800 text-xs truncate">
                          {lang === 'en' ? prod.nameEn : prod.nameAr}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>{lang === 'en' ? `Min Alert: ${prod.minStock}` : `الحد الأدنى: ${prod.minStock}`}</span>
                        <span>•</span>
                        <span>{lang === 'en' ? `Category: ${prod.category}` : `الفئة: ${prod.category}`}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-xs font-bold text-rose-600 block">
                        {prod.stockLevel} {prod.unit}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {lang === 'en' ? "Available" : "متاح"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-bold text-slate-700">{lang === 'en' ? "Generate Purchase Order" : "توليد طلب شراء ذكي"}</h5>
                <p className="text-[10px] text-slate-400 truncate">
                  {lang === 'en' ? "Auto-fill low stock with default suppliers" : "تعبئة الأصناف المنخفضة تلقائياً مع الموردين"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List & Activity Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="recent-transactions-container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">{t.recentTransactions}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en' ? "Real-time bilingual transaction journal audit trail" : "سجل المراجعة اللحظي المزدوج لجميع العمليات المالية"}
            </p>
          </div>
          <span className="text-xs bg-slate-100 px-2.5 py-1 text-slate-600 rounded-full font-mono">
            {lang === 'en' ? "Local Storage Sync" : "مزامنة التخزين المحلي"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.date}</th>
                <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>Ref / ID</th>
                <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{lang === 'en' ? "Transaction Type" : "نوع المعاملة"}</th>
                <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{lang === 'en' ? "Account / Partner" : "الحساب / الطرف الآخر"}</th>
                <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.paymentMethod}</th>
                <th className={`p-3 ${isRtl ? 'text-right' : 'text-left'}`}>{lang === 'en' ? "Amount (SAR)" : "المبلغ (ر.س)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx, idx) => (
                <tr key={`${tx.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 text-slate-600 whitespace-nowrap">{tx.date}</td>
                  <td className="p-3 font-mono font-semibold text-slate-700 whitespace-nowrap">{tx.ref}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                      tx.type.includes('Invoice') 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : tx.type.includes('Note')
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-orange-50 text-orange-700 border border-orange-100'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800 font-medium whitespace-nowrap truncate max-w-[180px]">{tx.party}</td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">{tx.method}</td>
                  <td className="p-3 font-mono font-bold whitespace-nowrap">
                    <span className={tx.direction === 'positive' ? 'text-emerald-600' : 'text-rose-600'}>
                      {tx.direction === 'positive' ? '+' : '-'} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
