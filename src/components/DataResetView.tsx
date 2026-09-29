import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, List, RotateCcw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';
import {
  DataResetPreviewRow,
  DataResetRecords,
  DataResetTargetMeta,
  getDataResetPreviewRows,
  getDataResetRecordCount,
  getDefaultCheckedIds,
  getEnabledTargets,
} from '../dataReset';
import { AppSettings, DataResetTargetId } from '../types';

interface DataResetViewProps {
  lang: 'en' | 'ar';
  appSettings: AppSettings;
  records: DataResetRecords;
  onReset: (selectedIds: DataResetTargetId[]) => void;
}

export default function DataResetView({
  lang,
  appSettings,
  records,
  onReset,
}: DataResetViewProps) {
  const enabledTargets = useMemo(
    () => getEnabledTargets(appSettings.dataReset),
    [appSettings.dataReset]
  );
  const defaultChecked = useMemo(
    () => getDefaultCheckedIds(appSettings.dataReset),
    [appSettings.dataReset]
  );
  const defaultKey = defaultChecked.join('|');

  const [selected, setSelected] = useState<Set<DataResetTargetId>>(
    () => new Set(defaultChecked)
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [previewTarget, setPreviewTarget] = useState<DataResetTargetMeta | null>(null);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    setSelected(new Set(defaultChecked));
  }, [defaultKey, defaultChecked]);

  const toggle = (id: DataResetTargetId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(enabledTargets.map(t => t.id)));
  const clearAll = () => setSelected(new Set());

  const selectedList = enabledTargets.filter(t => selected.has(t.id));
  const selectedNames = selectedList
    .map(t => (lang === 'en' ? t.nameEn : t.nameAr))
    .join(lang === 'en' ? ', ' : '، ');

  const previewRows = previewTarget
    ? getDataResetPreviewRows(previewTarget.id, records, lang)
    : [];

  const openConfirm = () => {
    setAgreed(false);
    setConfirmText('');
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setAgreed(false);
    setConfirmText('');
  };

  const handleConfirm = () => {
    const ids = selectedList.map(t => t.id);
    onReset(ids);
    closeConfirm();
    setNotice({
      open: true,
      title: lang === 'en' ? 'Data reset complete' : 'تم إعادة تعيين البيانات',
      message: lang === 'en'
        ? `Cleared: ${selectedNames}.`
        : `تم مسح: ${selectedNames}.`,
    });
  };

  return (
    <div className="space-y-5" id="data-reset-workspace">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-rose-600" />
          {lang === 'en' ? 'Data Reset' : 'إعادة تعيين البيانات'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'en'
            ? 'Select the datasets to wipe. Click a record count to preview exactly what will be reset. Users, roles, and app settings are never included.'
            : 'حدد مجموعات البيانات لمسحها. انقر عدد السجلات لمعاينة ما سيتم إعادة تعيينه. المستخدمون والأدوار وإعدادات التطبيق غير مشمولة.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        {enabledTargets.length === 0 ? (
          <p className="text-xs text-slate-500">
            {lang === 'en'
              ? 'No datasets are enabled. Ask Super Admin to enable checkboxes in Platform → Data Reset.'
              : 'لا توجد مجموعات بيانات مفعّلة. اطلب من المشرف العام تفعيل المربعات من المنصة ← إعادة تعيين البيانات.'}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                {lang === 'en' ? 'Select all' : 'تحديد الكل'}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                {lang === 'en' ? 'Clear all' : 'إلغاء التحديد'}
              </button>
            </div>

            <div className="space-y-1">
              {enabledTargets.map(target => {
                const count = getDataResetRecordCount(target.id, records);
                return (
                  <div
                    key={target.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50"
                  >
                    <label className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selected.has(target.id)}
                        onChange={() => toggle(target.id)}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-800">
                          {lang === 'en' ? target.nameEn : target.nameAr}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {lang === 'en' ? target.descriptionEn : target.descriptionAr}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewTarget(target)}
                      className="text-[10px] font-bold text-[#006C35] hover:text-[#005c2e] hover:underline shrink-0 cursor-pointer px-2 py-1 rounded-lg hover:bg-emerald-50"
                    >
                      {count} {lang === 'en' ? 'records' : 'سجل'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={selectedList.length === 0}
                onClick={openConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {lang === 'en' ? 'Reset selected data' : 'إعادة تعيين المحدد'}
              </button>
            </div>
          </>
        )}
      </div>

      <RecordPreviewModal
        lang={lang}
        target={previewTarget}
        rows={previewRows}
        onClose={() => setPreviewTarget(null)}
      />

      <ResetConfirmModal
        lang={lang}
        isOpen={confirmOpen}
        selectedList={selectedList}
        records={records}
        agreed={agreed}
        confirmText={confirmText}
        onAgreedChange={setAgreed}
        onConfirmTextChange={setConfirmText}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      <ConfirmModal
        isOpen={notice.open}
        title={notice.title}
        message={notice.message}
        onConfirm={() => setNotice(prev => ({ ...prev, open: false }))}
        lang={lang}
        type="success"
      />
    </div>
  );
}

function ResetConfirmModal({
  lang,
  isOpen,
  selectedList,
  records,
  agreed,
  confirmText,
  onAgreedChange,
  onConfirmTextChange,
  onConfirm,
  onCancel,
}: {
  lang: 'en' | 'ar';
  isOpen: boolean;
  selectedList: DataResetTargetMeta[];
  records: DataResetRecords;
  agreed: boolean;
  confirmText: string;
  onAgreedChange: (value: boolean) => void;
  onConfirmTextChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isRtl = lang === 'ar';
  const canContinue = agreed && confirmText.trim().toLowerCase() === 'delete';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 text-start space-y-4 z-50 overflow-hidden"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-1 flex-1">
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  {lang === 'en' ? 'Confirm data reset' : 'تأكيد إعادة تعيين البيانات'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === 'en'
                    ? 'These datasets will be permanently cleared. This cannot be undone.'
                    : 'سيتم مسح مجموعات البيانات التالية نهائياً. لا يمكن التراجع عن هذا الإجراء.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-rose-100 bg-rose-50/40 rounded-xl divide-y divide-rose-100">
              {selectedList.map(target => {
                const count = getDataResetRecordCount(target.id, records);
                return (
                  <div key={target.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-800">
                      {lang === 'en' ? target.nameEn : target.nameAr}
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 font-mono shrink-0">
                      {count} {lang === 'en' ? 'records' : 'سجل'}
                    </span>
                  </div>
                );
              })}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => onAgreedChange(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-slate-700 font-medium leading-relaxed">
                {lang === 'en'
                  ? 'I understand and agree to permanently delete the selected data'
                  : 'أوافق على حذف البيانات المحددة نهائياً'}
              </span>
            </label>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600">
                {lang === 'en' ? 'Type delete to confirm' : 'اكتب delete للتأكيد'}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => onConfirmTextChange(e.target.value)}
                placeholder="delete"
                autoComplete="off"
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-300"
              />
            </div>

            <div className={`flex items-center gap-2 pt-2 border-t border-slate-100 ${isRtl ? 'justify-start' : 'justify-end'}`}>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={onConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-rose-500/10 rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Reset data' : 'إعادة تعيين البيانات'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function RecordPreviewModal({
  lang,
  target,
  rows,
  onClose,
}: {
  lang: 'en' | 'ar';
  target: DataResetTargetMeta | null;
  rows: DataResetPreviewRow[];
  onClose: () => void;
}) {
  const isRtl = lang === 'ar';
  const isOpen = target !== null;

  return (
    <AnimatePresence>
      {isOpen && target && (
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
            className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 text-start space-y-4 z-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl flex-shrink-0 bg-emerald-50 text-[#006C35]">
                  <List className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">
                    {lang === 'en' ? target.nameEn : target.nameAr}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rows.length} {lang === 'en' ? 'records currently stored' : 'سجل محفوظ حالياً'}
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

            <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
              {rows.length === 0 ? (
                <p className="text-xs text-slate-500 p-4">
                  {lang === 'en' ? 'No records in this dataset.' : 'لا توجد سجلات في هذه المجموعة.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <li key={`${row.primary}-${index}`} className="px-4 py-2.5">
                      <div className="text-xs font-semibold text-slate-800">{row.primary}</div>
                      {row.secondary ? (
                        <div className="text-[10px] text-slate-500 mt-0.5">{row.secondary}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`flex items-center pt-1 ${isRtl ? 'justify-start' : 'justify-end'}`}>
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
