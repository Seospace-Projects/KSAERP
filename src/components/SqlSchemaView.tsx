import React, { useMemo, useState } from 'react';
import { Copy, Download, RefreshCw, Database, Upload } from 'lucide-react';
import { generateSchemaSql } from '../db/generateSql';
import { APP_COLLECTIONS } from '../db/schemaRegistry';
import { getSupabase } from '../db/client';
import { hasLegacyBrowserData } from '../db/legacyStorage';
import { migrateLegacyBrowserData, type MigrateResult } from '../db/migrateLocal';
import type { AuthUser } from '../types';

export default function SqlSchemaView({
  lang,
  users,
  onImported,
}: {
  lang: 'en' | 'ar';
  users: AuthUser[];
  onImported: () => Promise<void>;
}) {
  const initialSql = useMemo(() => generateSchemaSql(), []);
  const [sql, setSql] = useState(initialSql);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [legacyOpen, setLegacyOpen] = useState(hasLegacyBrowserData());
  const [migrateResult, setMigrateResult] = useState<MigrateResult | null>(null);

  const copySql = async () => {
    await navigator.clipboard.writeText(sql);
    setNotice(lang === 'en' ? 'SQL copied. Paste it in the Supabase SQL Editor and run.' : 'تم نسخ SQL. الصقه في محرر SQL في Supabase ثم نفّذه.');
    setError('');
  };

  const downloadSql = () => {
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ksa-erp-schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const authHeaders = async (): Promise<HeadersInit> => {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(lang === 'en' ? 'Not signed in.' : 'غير مسجّل الدخول.');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const recheck = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/schema/recheck', { method: 'POST', headers: await authHeaders() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Recheck failed');
      setSql(body.sql);
      const extras = [
        ...(body.addedTables || []).map((t: string) => `table ${t}`),
        ...(body.addedColumns || []).map((c: { table: string; column: string }) => `${c.table}.${c.column}`),
      ];
      setNotice(
        lang === 'en'
          ? `Rechecked ${body.scannedInterfaces?.length || 0} types. ${extras.length ? `Added: ${extras.join(', ')}.` : 'Registry already matched the app.'} Copy the SQL and run it in Supabase.`
          : `تمت مراجعة ${body.scannedInterfaces?.length || 0} نوعاً. ${extras.length ? `أُضيف: ${extras.join(', ')}.` : 'المخطط محدّث.'} انسخ SQL ونفّذه في Supabase.`
      );
    } catch (err: any) {
      setError(err?.message || 'Recheck failed');
    } finally {
      setBusy(false);
    }
  };

  const importLegacy = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await migrateLegacyBrowserData([...users]);
      setMigrateResult(result);
      setLegacyOpen(false);
      await onImported();
      const extra = result.createdUsers.filter(u => u.password).map(u => `${u.username} / ${u.password}`).join('\n');
      setNotice(
        (lang === 'en'
          ? `Imported ${result.imported.join(', ') || 'no leftover tables'}. Browser localStorage keys were cleared.`
          : `تم استيراد ${result.imported.join(', ') || 'لا جداول'}. تم مسح بيانات المتصفح المحلية.`)
        + (extra ? `\n${lang === 'en' ? 'New passwords (shown once)' : 'كلمات مرور جديدة (مرة واحدة)'}:\n${extra}` : '')
      );
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#006C35]" />
            {lang === 'en' ? 'SQL Schema' : 'مخطط SQL'}
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            {lang === 'en'
              ? 'Always-current Postgres schema for this app. Copy and run it in the Supabase SQL Editor. Recheck scans types.ts and known collections, then rewrites supabase/schema.sql.'
              : 'مخطط Postgres الحالي للتطبيق. انسخه ونفّذه في محرر SQL في Supabase. زر المراجعة يفحص الأنواع والمجموعات ثم يحدّث ملف المخطط.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copySql} className="px-3 py-2 bg-[#006C35] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Copy className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Copy SQL' : 'نسخ SQL'}
          </button>
          <button type="button" onClick={downloadSql} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Download' : 'تنزيل'}
          </button>
          <button type="button" disabled={busy} onClick={recheck} className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            {lang === 'en' ? 'Recheck whole app' : 'إعادة فحص التطبيق'}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
        {lang === 'en' ? 'Collections' : 'المجموعات'}: {APP_COLLECTIONS.join(', ')}
      </div>

      {legacyOpen && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-2">
          <div className="font-bold text-amber-900 text-sm">
            {lang === 'en' ? 'Leftover browser data found' : 'وُجدت بيانات متصفح قديمة'}
          </div>
          <p className="text-xs text-amber-800">
            {lang === 'en'
              ? 'Import this browser’s localStorage once into Supabase, then those keys are deleted. Newly created users get a generated password shown once — it is not stored in source.'
              : 'استورد بيانات هذا المتصفح مرة واحدة إلى Supabase ثم تُحذف المفاتيح. المستخدمون الجدد يحصلون على كلمة مرور مولّدة تُعرض مرة واحدة.'}
          </p>
          <button type="button" disabled={busy} onClick={importLegacy} className="px-3 py-2 bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Import this browser’s data' : 'استيراد بيانات هذا المتصفح'}
          </button>
        </div>
      )}

      {notice && <pre className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-3 whitespace-pre-wrap">{notice}</pre>}
      {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">{error}</div>}
      {migrateResult?.createdUsers.length ? (
        <div className="text-xs text-slate-600">
          {lang === 'en' ? 'Auth accounts created during import:' : 'حسابات أُنشئت أثناء الاستيراد:'} {migrateResult.createdUsers.map(u => u.username).join(', ')}
        </div>
      ) : null}

      <textarea
        readOnly
        value={sql}
        className="w-full min-h-[480px] font-mono text-[11px] bg-slate-950 text-emerald-100 rounded-2xl p-4 border border-slate-800"
      />
    </div>
  );
}
