import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { List, X } from 'lucide-react';
import {
  AuthUser,
  CompanyProfile,
  Invoice,
  ReservedInvoiceNumber,
} from '../types';
import {
  nextFreeSequenceNumber,
  reservedForCompany,
  reserveInvoiceNumberRange,
  RESERVE_RANGE_MAX,
} from '../invoiceNumbers';

interface ReservedInvoicesModalProps {
  lang: 'en' | 'ar';
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  invoices: Invoice[];
  reserved: ReservedInvoiceNumber[];
  setReserved: React.Dispatch<React.SetStateAction<ReservedInvoiceNumber[]>>;
  users: AuthUser[];
  currentUser: AuthUser;
  onUseReserved?: (payload: { companyId: string; invoiceNumber: string }) => void;
}

export default function ReservedInvoicesModal({
  lang,
  isOpen,
  onClose,
  company,
  invoices,
  reserved,
  setReserved,
  users,
  currentUser,
  onUseReserved,
}: ReservedInvoicesModalProps) {
  const isRtl = lang === 'ar';
  const prefix = company.invoicePrefix || 'INV-';
  const [fromSeq, setFromSeq] = useState('');
  const [toSeq, setToSeq] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      const next = String(nextFreeSequenceNumber(prefix, invoices, reserved, company));
      setFromSeq(next);
      setToSeq(next);
      setError('');
      setStatus('');
    }
  }, [isOpen, company, prefix, invoices, reserved]);

  const visible = useMemo(() => {
    return [...reservedForCompany(reserved, company.id)].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }, [reserved, company.id]);

  const userName = (userId: string) => {
    const match = users.find(u => u.id === userId);
    if (!match) return userId;
    return lang === 'en' ? match.nameEn : (match.nameAr || match.nameEn);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const from = parseInt(fromSeq, 10);
    const to = parseInt(toSeq, 10);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1) {
      setError(lang === 'en' ? 'Enter valid From and To sequence numbers.' : 'أدخل أرقام تسلسل صحيحة من وإلى.');
      setStatus('');
      return;
    }

    const result = reserveInvoiceNumberRange({
      prefix,
      from,
      to,
      companyId: company.id,
      createdByUserId: currentUser.id,
      invoices,
      reserved,
    });

    if (result.error === 'too_large') {
      setError(
        lang === 'en'
          ? `Range cannot exceed ${RESERVE_RANGE_MAX} numbers.`
          : `لا يمكن أن يتجاوز النطاق ${RESERVE_RANGE_MAX} رقماً.`
      );
      setStatus('');
      return;
    }

    if (result.error === 'invalid') {
      setError(lang === 'en' ? 'Enter valid From and To sequence numbers.' : 'أدخل أرقام تسلسل صحيحة من وإلى.');
      setStatus('');
      return;
    }

    if (result.added === 0) {
      setError(
        lang === 'en'
          ? `No numbers added. Issued: ${result.skippedIssued}, already reserved: ${result.skippedReserved}.`
          : `لم تتم إضافة أرقام. صادر: ${result.skippedIssued}، محجوز مسبقاً: ${result.skippedReserved}.`
      );
      setStatus('');
      return;
    }

    setReserved([...result.items, ...reserved]);
    setError('');
    setStatus(
      lang === 'en'
        ? `Reserved ${result.added}. Skipped issued: ${result.skippedIssued}. Skipped reserved: ${result.skippedReserved}.`
        : `تم حجز ${result.added}. تم تخطي الصادر: ${result.skippedIssued}. تم تخطي المحجوز: ${result.skippedReserved}.`
    );
  };

  const handleRelease = (id: string) => {
    setReserved(prev => prev.filter(item => item.id !== id));
  };

  const handleUse = (item: ReservedInvoiceNumber) => {
    onUseReserved?.({ companyId: item.companyId, invoiceNumber: item.invoiceNumber });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full p-6 text-start space-y-4 z-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl flex-shrink-0 bg-emerald-50 text-[#006C35]">
                  <List className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">
                    {lang === 'en' ? 'Reserved invoice numbers' : 'أرقام الفواتير المحجوزة'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'en' ? company.nameEn : company.nameAr}
                    {' · '}
                    {prefix}
                    {' · '}
                    {visible.length} {lang === 'en' ? 'reserved' : 'محجوز'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  {prefix}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {lang === 'en' ? 'From' : 'من'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={fromSeq}
                    onChange={e => {
                      setFromSeq(e.target.value);
                      setError('');
                      setStatus('');
                    }}
                    className="w-full bg-slate-100 rounded-xl p-2 text-xs font-mono font-bold"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {lang === 'en' ? 'To' : 'إلى'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={toSeq}
                    onChange={e => {
                      setToSeq(e.target.value);
                      setError('');
                      setStatus('');
                    }}
                    className="w-full bg-slate-100 rounded-xl p-2 text-xs font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006C35] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {lang === 'en' ? 'Reserve' : 'حجز'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? `Example: ${prefix} From 5 To 12 → ${prefix}0005 … ${prefix}0012 (max ${RESERVE_RANGE_MAX}).`
                  : `مثال: ${prefix} من 5 إلى 12 → ${prefix}0005 … ${prefix}0012 (الحد ${RESERVE_RANGE_MAX}).`}
              </p>
            </form>
            {error ? <p className="text-[11px] text-rose-600 font-semibold">{error}</p> : null}
            {status ? <p className="text-[11px] text-emerald-700 font-semibold">{status}</p> : null}

            <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
              {visible.length === 0 ? (
                <p className="text-xs text-slate-500 p-4">
                  {lang === 'en' ? 'No reserved invoice numbers.' : 'لا توجد أرقام فواتير محجوزة.'}
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="text-start font-bold p-3">{lang === 'en' ? 'Number' : 'الرقم'}</th>
                      <th className="text-start font-bold p-3">{lang === 'en' ? 'Reserved' : 'تاريخ الحجز'}</th>
                      <th className="text-start font-bold p-3">{lang === 'en' ? 'By' : 'بواسطة'}</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(item => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="p-3 font-mono font-bold text-slate-800">{item.invoiceNumber}</td>
                        <td className="p-3 text-slate-500">
                          {item.createdAt.slice(0, 10)} {item.createdAt.slice(11, 16)}
                        </td>
                        <td className="p-3 text-slate-600">{userName(item.createdByUserId)}</td>
                        <td className="p-3 text-end whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleUse(item)}
                            className="text-[#006C35] font-bold cursor-pointer hover:underline me-3"
                          >
                            {lang === 'en' ? 'Use' : 'استخدام'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRelease(item.id)}
                            className="text-rose-600 font-bold cursor-pointer hover:underline"
                          >
                            {lang === 'en' ? 'Release' : 'إلغاء الحجز'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-white bg-[#006C35] hover:bg-[#005c2e] rounded-xl cursor-pointer"
              >
                {lang === 'en' ? 'Close' : 'إغلاق'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
