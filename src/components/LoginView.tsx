import React, { useState } from 'react';
import { Shield, Key, User, Globe, Sparkles, Building2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
  onForgotPassword?: (username: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  appNameEn?: string;
  appNameAr?: string;
  allowRememberMe?: boolean;
  supabaseConfigured?: boolean;
}

export default function LoginView({
  onLogin,
  // onForgotPassword — hidden for now; keep prop for easy restore
  lang,
  setLang,
  appNameEn = 'KSA ENTERPRISE',
  appNameAr = 'نظام الريادة',
  allowRememberMe = true,
  supabaseConfigured = true,
}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setNotice('');

    const result = await onLogin(username.trim(), password, allowRememberMe && rememberMe);
    if (result.ok === false) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#D4AF37] selection:text-slate-900">
      {/* Decorative Saudi Inspired Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#006C35]/15 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#006C35]/10 blur-3xl pointer-events-none"></div>

      {/* Subtle geometric line pattern in background representing modern Saudi infrastructure */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Main Glassmorphic Container with Split Layout */}
      <div className="w-full max-w-5xl bg-slate-950/40 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: Glorious KSA & ZATCA Theme Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#005c2e] via-[#006C35] to-[#00381b] p-8 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#D4AF37]/20">
          {/* Accent Gold Stripe */}
          <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] via-[#C5A85C] to-[#9A7B35]"></div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

          {/* Top Branding Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-wider font-sans">{lang === 'en' ? appNameEn : appNameAr}</h1>
                <p className="text-[9px] text-emerald-300 font-mono font-bold tracking-widest uppercase">
                  {lang === 'en' ? "ZATCA PHASE II READY" : "جاهز للمرحلة الثانية هيئة الزكاة"}
                </p>
              </div>
            </div>
            
            {/* National Crest Simulation (Green and Gold badge) */}
            <div className="w-8 h-8 rounded-full bg-slate-900/40 border border-[#D4AF37]/50 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
              🇸🇦
            </div>
          </div>

          {/* Center Informational Content */}
          <div className="my-12 space-y-6 relative z-10 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-xs text-[#D4AF37] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? "FATOORA Smart ERP" : "نظام الفاتورة الإلكترونية الذكي"}</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl lg:text-3xl font-extrabold leading-tight text-white">
                {lang === 'en' ? (
                  <>Secure, Compliant <br />& Saudi-First</>
                ) : (
                  <>نظام محاسبي آمن <br />متوافق بالكامل</>
                )}
              </h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed max-w-sm">
                {lang === 'en' 
                  ? "Fully integrated cloud solution designed strictly according to the guidelines of the Zakat, Tax and Customs Authority (ZATCA) for Phase 2 integration."
                  : "حل سحابي متكامل تماماً ومصمم خصيصاً للتوافق مع معايير ومتطلبات هيئة الزكاة والضريبة والجمارك للمرحلة الثانية الربط والتكامل."}
              </p>
            </div>

            <div className="space-y-2.5 text-[11px] pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-emerald-50/90">{lang === 'en' ? "Role-based access (RBAC) with Super Admin" : "صلاحيات حسب الدور مع مشرف عام"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-emerald-50/90">{lang === 'en' ? "TLV Compliant QR Code Generation" : "توليد رمز الاستجابة السريع المتوافق مع TLV"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-emerald-50/90">{lang === 'en' ? "Bilingual interface (English & Arabic)" : "واجهة ثنائية اللغة بالكامل"}</span>
              </div>
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 border-t border-white/10 pt-4 flex items-center justify-between text-[10px] text-emerald-200/60 font-mono">
            <span>{lang === 'en' ? "System Version: v4.2.0" : "إصدار النظام: ٤.٢.٠"}</span>
            <span>2026 KSA ERP</span>
          </div>
        </div>

        {/* Right Side: The Premium Login Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between bg-slate-950/80">
          
          {/* Form Header Area */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white text-start">
                {lang === 'en' ? "Portal Authentication" : "بوابة تسجيل الدخول الآمن"}
              </h3>
              <p className="text-xs text-slate-400 text-start">
                {lang === 'en' ? "Enter your enterprise credentials below" : "الرجاء إدخال بيانات الاعتماد المعتمدة للمنشأة"}
              </p>
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'en' ? "العربية" : "English"}</span>
            </button>
          </div>

          {/* Form Area */}
          <form onSubmit={handleLoginSubmit} className="space-y-5 text-start">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-start gap-2.5">
                <span className="font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {notice && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs">
                {notice}
              </div>
            )}
            {!supabaseConfigured && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs">
                {lang === 'en'
                  ? 'Supabase is not configured. Copy .env.example to .env, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, run SQL Schema in the dashboard, then npm run seed:auth.'
                  : 'لم يُضبط Supabase. انسخ .env.example إلى .env وأضف المفاتيح ثم نفّذ مخطط SQL وnpm run seed:auth.'}
              </div>
            )}

            {/* Username field */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">
                {lang === 'en' ? "Username" : "اسم المستخدم"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={lang === 'en' ? "superadmin" : "اسم المستخدم"}
                  required
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#006C35]/50 focus:border-[#006C35] transition-all font-mono"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">
                {lang === 'en' ? "Secure Password" : "كلمة المرور الآمنة"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#006C35]/50 focus:border-[#006C35] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  aria-label={showPassword
                    ? (lang === 'en' ? 'Hide password' : 'إخفاء كلمة المرور')
                    : (lang === 'en' ? 'Show password' : 'إظهار كلمة المرور')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {allowRememberMe && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-[#006C35] focus:ring-[#006C35] focus:ring-offset-slate-900"
                />
                <span>{lang === 'en' ? "Keep me authorized on this device" : "إبقاء تسجيل الدخول نشطاً على هذا الجهاز"}</span>
              </label>
            </div>
            )}

            {/* Login Trigger */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#006C35] hover:bg-[#005c2e] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 border border-[#D4AF37]/30 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{lang === 'en' ? "Please wait..." : "يرجى الانتظار..."}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-[#D4AF37]" />
                  <span>{lang === 'en' ? "Access Cloud ERP Dashboard" : "دخول لوحة تحكم النظام السحابي"}</span>
                </>
              )}
            </button>
          </form>

          {/* KSA Compliance Disclaimer */}
          <div className="mt-8 flex items-center gap-1.5 justify-center text-[9px] text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>{lang === 'en' ? "Approved Cryptographic Signatures & GAZT Compliance Certificate v2.1" : "معتمد لدى هيئة الزكاة والضريبة والجمارك رقم ٢.١"}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
