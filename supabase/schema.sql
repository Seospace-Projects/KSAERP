-- KSA ERP schema
-- Generated from src/db/schemaRegistry.ts
-- Run this in the Supabase SQL Editor, then: npm run seed:auth
-- Do not insert into auth.users from this file.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role_id = 'super_admin'
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.login_email_for(lookup text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles
  WHERE lower(username) = lower(trim(lookup))
     OR lower(email) = lower(trim(lookup))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.login_email_for(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_email_for(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_last_login()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET last_login_at = now()
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.touch_last_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_last_login() TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS public."roles" (
  "id" text PRIMARY KEY,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "description_en" text NOT NULL DEFAULT '',
  "description_ar" text NOT NULL DEFAULT '',
  "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_system" boolean NOT NULL DEFAULT false,
  "is_locked" boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public."roles" IS 'RBAC roles and permission lists';

CREATE TABLE IF NOT EXISTS public."profiles" (
  "id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "username" text NOT NULL UNIQUE,
  "email" text NOT NULL UNIQUE,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL DEFAULT '',
  "role_id" text NOT NULL REFERENCES public.roles(id),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_login_at" timestamptz
);
COMMENT ON TABLE public."profiles" IS 'App user profiles mapped 1:1 to auth.users';

CREATE TABLE IF NOT EXISTS public."user_preferences" (
  "user_id" uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  "theme" text NOT NULL DEFAULT 'green',
  "language" text NOT NULL DEFAULT 'en',
  "active_company_id" text
);
COMMENT ON TABLE public."user_preferences" IS 'Per-user theme, language, and active company';

CREATE TABLE IF NOT EXISTS public."app_settings" (
  "id" text PRIMARY KEY,
  "app_name_en" text NOT NULL,
  "app_name_ar" text NOT NULL,
  "default_language" text NOT NULL DEFAULT 'en',
  "default_theme" text NOT NULL DEFAULT 'green',
  "allow_remember_me" boolean NOT NULL DEFAULT true,
  "require_strong_password" boolean NOT NULL DEFAULT true,
  "min_password_length" integer NOT NULL DEFAULT 8,
  "session_timeout_minutes" integer NOT NULL DEFAULT 480,
  "max_company_profiles" integer NOT NULL DEFAULT 5,
  "modules" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "data_reset" jsonb NOT NULL DEFAULT '{}'::jsonb
);
COMMENT ON TABLE public."app_settings" IS 'Single-row product settings';

CREATE TABLE IF NOT EXISTS public."custom_features" (
  "id" text PRIMARY KEY,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "description_en" text NOT NULL DEFAULT '',
  "description_ar" text NOT NULL DEFAULT '',
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public."custom_features" IS 'Super Admin custom feature catalog';

CREATE TABLE IF NOT EXISTS public."companies" (
  "id" text PRIMARY KEY,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "cr_number" text NOT NULL DEFAULT '',
  "vat_number" text NOT NULL DEFAULT '',
  "building_no" text NOT NULL DEFAULT '',
  "additional_no" text NOT NULL DEFAULT '',
  "street" text NOT NULL DEFAULT '',
  "district" text NOT NULL DEFAULT '',
  "city" text NOT NULL DEFAULT '',
  "postal_code" text NOT NULL DEFAULT '',
  "country" text NOT NULL DEFAULT 'SA',
  "bank_name" text NOT NULL DEFAULT '',
  "bank_iban" text NOT NULL DEFAULT '',
  "bank_account_no" text NOT NULL DEFAULT '',
  "logo_url" text,
  "show_logo" boolean DEFAULT true,
  "show_bank_details" boolean DEFAULT true,
  "invoice_footer_en" text NOT NULL DEFAULT '',
  "invoice_footer_ar" text NOT NULL DEFAULT '',
  "invoice_template" text NOT NULL DEFAULT 'professional',
  "qr_position" text NOT NULL DEFAULT 'bottom-right',
  "logo_position" text NOT NULL DEFAULT 'left',
  "show_stamp" boolean NOT NULL DEFAULT true,
  "show_signature" boolean NOT NULL DEFAULT true,
  "currency" text NOT NULL DEFAULT 'SAR',
  "invoice_prefix" text DEFAULT 'INV-'
);
COMMENT ON TABLE public."companies" IS 'Company profiles';

CREATE TABLE IF NOT EXISTS public."customers" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "vat_number" text,
  "cr_number" text,
  "phone" text NOT NULL DEFAULT '',
  "email" text NOT NULL DEFAULT '',
  "address" text NOT NULL DEFAULT '',
  "credit_limit" numeric NOT NULL DEFAULT 0,
  "payment_terms" text NOT NULL DEFAULT '',
  "opening_balance" numeric NOT NULL DEFAULT 0,
  "balance" numeric NOT NULL DEFAULT 0
);
COMMENT ON TABLE public."customers" IS 'Customer directory';

CREATE TABLE IF NOT EXISTS public."suppliers" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "vat_number" text,
  "phone" text NOT NULL DEFAULT '',
  "email" text NOT NULL DEFAULT '',
  "address" text NOT NULL DEFAULT '',
  "opening_balance" numeric NOT NULL DEFAULT 0,
  "balance" numeric NOT NULL DEFAULT 0
);
COMMENT ON TABLE public."suppliers" IS 'Supplier directory';

CREATE TABLE IF NOT EXISTS public."warehouses" (
  "id" text PRIMARY KEY,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "location" text NOT NULL DEFAULT ''
);
COMMENT ON TABLE public."warehouses" IS 'Warehouses';

CREATE TABLE IF NOT EXISTS public."products" (
  "id" text PRIMARY KEY,
  "sku" text NOT NULL,
  "barcode" text NOT NULL DEFAULT '',
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "brand" text NOT NULL DEFAULT '',
  "category" text NOT NULL DEFAULT '',
  "unit" text NOT NULL DEFAULT 'Pcs',
  "cost_price" numeric NOT NULL DEFAULT 0,
  "selling_price" numeric NOT NULL DEFAULT 0,
  "vat_percentage" numeric NOT NULL DEFAULT 15,
  "min_stock" numeric NOT NULL DEFAULT 0,
  "max_stock" numeric NOT NULL DEFAULT 0,
  "stock_level" numeric NOT NULL DEFAULT 0,
  "warehouse_stock" jsonb NOT NULL DEFAULT '{}'::jsonb
);
COMMENT ON TABLE public."products" IS 'Inventory products and warehouse stock';

CREATE TABLE IF NOT EXISTS public."invoices" (
  "id" text PRIMARY KEY,
  "invoice_number" text NOT NULL,
  "invoice_type" text NOT NULL,
  "date" text NOT NULL,
  "due_date" text,
  "customer_id" text NOT NULL DEFAULT '',
  "customer_name_en" text NOT NULL DEFAULT '',
  "customer_name_ar" text NOT NULL DEFAULT '',
  "customer_vat" text,
  "payment_method" text NOT NULL,
  "payment_terms" text,
  "warehouse_id" text NOT NULL DEFAULT '',
  "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "subtotal" numeric NOT NULL DEFAULT 0,
  "vat_amount" numeric NOT NULL DEFAULT 0,
  "total" numeric NOT NULL DEFAULT 0,
  "uuid" text NOT NULL DEFAULT '',
  "invoice_counter" integer NOT NULL DEFAULT 0,
  "invoice_hash" text NOT NULL DEFAULT '',
  "is_returned" boolean NOT NULL DEFAULT false,
  "return_reason" text,
  "notes" text,
  "terms_en" text,
  "terms_ar" text,
  "timestamp" text,
  "qr_code_tlv" text,
  "company_details" jsonb,
  "company_id" text,
  "company_name_en" text,
  "company_name_ar" text
);
COMMENT ON TABLE public."invoices" IS 'Sales tax invoices and credit notes';

CREATE TABLE IF NOT EXISTS public."reserved_invoices" (
  "id" text PRIMARY KEY,
  "company_id" text NOT NULL,
  "invoice_number" text NOT NULL,
  "created_at" text NOT NULL,
  "created_by_user_id" text NOT NULL DEFAULT ''
);
COMMENT ON TABLE public."reserved_invoices" IS 'Reserved invoice numbers per company';

CREATE TABLE IF NOT EXISTS public."expenses" (
  "id" text PRIMARY KEY,
  "date" text NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "amount" numeric NOT NULL DEFAULT 0,
  "vat_percentage" numeric NOT NULL DEFAULT 15,
  "vat_amount" numeric NOT NULL DEFAULT 0,
  "total" numeric NOT NULL DEFAULT 0,
  "payment_method" text NOT NULL,
  "reference_no" text,
  "status" text NOT NULL DEFAULT 'Approved',
  "attachment_url" text
);
COMMENT ON TABLE public."expenses" IS 'Expense log';

CREATE TABLE IF NOT EXISTS public."accounts" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "name_en" text NOT NULL,
  "name_ar" text NOT NULL,
  "type" text NOT NULL,
  "sub_type" text NOT NULL DEFAULT '',
  "balance" numeric NOT NULL DEFAULT 0,
  "is_system" boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public."accounts" IS 'Chart of accounts';

CREATE TABLE IF NOT EXISTS public."journal_entries" (
  "id" text PRIMARY KEY,
  "date" text NOT NULL,
  "reference" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "lines" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_system" boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public."journal_entries" IS 'General ledger journals';

CREATE TABLE IF NOT EXISTS public."vouchers" (
  "id" text PRIMARY KEY,
  "voucher_no" text NOT NULL,
  "type" text NOT NULL,
  "date" text NOT NULL,
  "amount" numeric NOT NULL DEFAULT 0,
  "description" text NOT NULL DEFAULT '',
  "contact_id" text,
  "contact_type" text,
  "reference_no" text,
  "debit_account_id" text NOT NULL DEFAULT '',
  "credit_account_id" text NOT NULL DEFAULT ''
);
COMMENT ON TABLE public."vouchers" IS 'Cash and bank vouchers';

CREATE TABLE IF NOT EXISTS public."bank_reconciliations" (
  "id" text PRIMARY KEY,
  "statement_date" text NOT NULL,
  "bank_statement_balance" numeric NOT NULL DEFAULT 0,
  "reconciled_tx_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_completed" boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public."bank_reconciliations" IS 'Bank statement reconciliations';

ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS "description_en" text NOT NULL DEFAULT '';
ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS "description_ar" text NOT NULL DEFAULT '';
ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false;
ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS "is_locked" boolean NOT NULL DEFAULT false;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "username" text NOT NULL;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "email" text NOT NULL;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL DEFAULT '';
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "role_id" text NOT NULL;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "last_login_at" timestamptz;
ALTER TABLE public."user_preferences" ADD COLUMN IF NOT EXISTS "theme" text NOT NULL DEFAULT 'green';
ALTER TABLE public."user_preferences" ADD COLUMN IF NOT EXISTS "language" text NOT NULL DEFAULT 'en';
ALTER TABLE public."user_preferences" ADD COLUMN IF NOT EXISTS "active_company_id" text;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "app_name_en" text NOT NULL;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "app_name_ar" text NOT NULL;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "default_language" text NOT NULL DEFAULT 'en';
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "default_theme" text NOT NULL DEFAULT 'green';
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "allow_remember_me" boolean NOT NULL DEFAULT true;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "require_strong_password" boolean NOT NULL DEFAULT true;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "min_password_length" integer NOT NULL DEFAULT 8;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "session_timeout_minutes" integer NOT NULL DEFAULT 480;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "max_company_profiles" integer NOT NULL DEFAULT 5;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "modules" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public."app_settings" ADD COLUMN IF NOT EXISTS "data_reset" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public."custom_features" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."custom_features" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."custom_features" ADD COLUMN IF NOT EXISTS "description_en" text NOT NULL DEFAULT '';
ALTER TABLE public."custom_features" ADD COLUMN IF NOT EXISTS "description_ar" text NOT NULL DEFAULT '';
ALTER TABLE public."custom_features" ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true;
ALTER TABLE public."custom_features" ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "cr_number" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "vat_number" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "building_no" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "additional_no" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "street" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "district" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "city" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "postal_code" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "country" text NOT NULL DEFAULT 'SA';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "bank_name" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "bank_iban" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "bank_account_no" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "show_logo" boolean DEFAULT true;
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "show_bank_details" boolean DEFAULT true;
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "invoice_footer_en" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "invoice_footer_ar" text NOT NULL DEFAULT '';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "invoice_template" text NOT NULL DEFAULT 'professional';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "qr_position" text NOT NULL DEFAULT 'bottom-right';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "logo_position" text NOT NULL DEFAULT 'left';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "show_stamp" boolean NOT NULL DEFAULT true;
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "show_signature" boolean NOT NULL DEFAULT true;
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'SAR';
ALTER TABLE public."companies" ADD COLUMN IF NOT EXISTS "invoice_prefix" text DEFAULT 'INV-';
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "code" text NOT NULL;
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "vat_number" text;
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "cr_number" text;
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "phone" text NOT NULL DEFAULT '';
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "email" text NOT NULL DEFAULT '';
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "address" text NOT NULL DEFAULT '';
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "credit_limit" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "payment_terms" text NOT NULL DEFAULT '';
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "opening_balance" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."customers" ADD COLUMN IF NOT EXISTS "balance" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "code" text NOT NULL;
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "vat_number" text;
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "phone" text NOT NULL DEFAULT '';
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "email" text NOT NULL DEFAULT '';
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "address" text NOT NULL DEFAULT '';
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "opening_balance" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."suppliers" ADD COLUMN IF NOT EXISTS "balance" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."warehouses" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."warehouses" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."warehouses" ADD COLUMN IF NOT EXISTS "location" text NOT NULL DEFAULT '';
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "sku" text NOT NULL;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "barcode" text NOT NULL DEFAULT '';
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "brand" text NOT NULL DEFAULT '';
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "category" text NOT NULL DEFAULT '';
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "unit" text NOT NULL DEFAULT 'Pcs';
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "cost_price" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "selling_price" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "vat_percentage" numeric NOT NULL DEFAULT 15;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "min_stock" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "max_stock" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "stock_level" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."products" ADD COLUMN IF NOT EXISTS "warehouse_stock" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "invoice_number" text NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "invoice_type" text NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "date" text NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "due_date" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_id" text NOT NULL DEFAULT '';
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_name_en" text NOT NULL DEFAULT '';
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_name_ar" text NOT NULL DEFAULT '';
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_vat" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "payment_method" text NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "payment_terms" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "warehouse_id" text NOT NULL DEFAULT '';
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "items" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "subtotal" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "vat_amount" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "total" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "uuid" text NOT NULL DEFAULT '';
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "invoice_counter" integer NOT NULL DEFAULT 0;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "invoice_hash" text NOT NULL DEFAULT '';
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "is_returned" boolean NOT NULL DEFAULT false;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "return_reason" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "terms_en" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "terms_ar" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "timestamp" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "qr_code_tlv" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "company_details" jsonb;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "company_id" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "company_name_en" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "company_name_ar" text;
ALTER TABLE public."reserved_invoices" ADD COLUMN IF NOT EXISTS "company_id" text NOT NULL;
ALTER TABLE public."reserved_invoices" ADD COLUMN IF NOT EXISTS "invoice_number" text NOT NULL;
ALTER TABLE public."reserved_invoices" ADD COLUMN IF NOT EXISTS "created_at" text NOT NULL;
ALTER TABLE public."reserved_invoices" ADD COLUMN IF NOT EXISTS "created_by_user_id" text NOT NULL DEFAULT '';
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "date" text NOT NULL;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "category" text NOT NULL;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "amount" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "vat_percentage" numeric NOT NULL DEFAULT 15;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "vat_amount" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "total" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "payment_method" text NOT NULL;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "reference_no" text;
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'Approved';
ALTER TABLE public."expenses" ADD COLUMN IF NOT EXISTS "attachment_url" text;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "code" text NOT NULL;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "name_en" text NOT NULL;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "name_ar" text NOT NULL;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "type" text NOT NULL;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "sub_type" text NOT NULL DEFAULT '';
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "balance" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "date" text NOT NULL;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "reference" text NOT NULL;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "lines" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "voucher_no" text NOT NULL;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "type" text NOT NULL;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "date" text NOT NULL;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "amount" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "contact_id" text;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "contact_type" text;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "reference_no" text;
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "debit_account_id" text NOT NULL DEFAULT '';
ALTER TABLE public."vouchers" ADD COLUMN IF NOT EXISTS "credit_account_id" text NOT NULL DEFAULT '';
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "statement_date" text NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "bank_statement_balance" numeric NOT NULL DEFAULT 0;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "reconciled_tx_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "is_completed" boolean NOT NULL DEFAULT false;

INSERT INTO public.roles (id, name_en, name_ar, description_en, description_ar, permissions, is_system, is_locked)
VALUES
('super_admin', 'Super Admin', 'المشرف العام', 'Full platform control: users, roles, app settings, feature flags, and every operational module.', 'صلاحية كاملة على المنصة: المستخدمون والأدوار وإعدادات التطبيق وميزات النظام وجميع الوحدات التشغيلية.', '["dashboard.view","sales.view","sales.create","sales.return","sales.reserved.view","expenses.view","expenses.create","inventory.view","inventory.manage","contacts.view","contacts.manage","accounting.view","accounting.manage","vat.view","dataReset.execute","company.settings","platform.dashboard","platform.users","platform.roles","platform.app_settings","platform.features","platform.data_reset","platform.schema"]'::jsonb, true, true),
('admin', 'Company Admin', 'مدير المنشأة', 'All operational modules and company profile. No platform / app-level settings.', 'جميع الوحدات التشغيلية وملف المنشأة. بدون إعدادات المنصة أو التطبيق.', '["dashboard.view","sales.view","sales.create","sales.return","sales.reserved.view","expenses.view","expenses.create","inventory.view","inventory.manage","contacts.view","contacts.manage","accounting.view","accounting.manage","vat.view","company.settings"]'::jsonb, true, false),
('accountant', 'Accountant', 'محاسب', 'Dashboard, expenses, ledger, and VAT returns.', 'لوحة التحكم والمصروفات ودفتر الأستاذ والإقرارات الضريبية.', '["dashboard.view","expenses.view","expenses.create","accounting.view","accounting.manage","vat.view"]'::jsonb, true, false),
('sales', 'Sales Officer', 'موظف مبيعات', 'Invoices and customer directory.', 'الفواتير ودليل العملاء.', '["dashboard.view","sales.view","sales.create","sales.return","contacts.view","contacts.manage"]'::jsonb, true, false),
('inventory', 'Inventory Officer', 'أمين المخزون', 'Products, warehouses, and stock movements.', 'المنتجات والمستودعات وحركة المخزون.', '["dashboard.view","inventory.view","inventory.manage"]'::jsonb, true, false),
('viewer', 'Viewer', 'مستعرض', 'Read-only dashboard.', 'لوحة التحكم للعرض فقط.', '["dashboard.view"]'::jsonb, true, false)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  description_en = EXCLUDED.description_en,
  description_ar = EXCLUDED.description_ar,
  permissions = EXCLUDED.permissions,
  is_system = EXCLUDED.is_system,
  is_locked = EXCLUDED.is_locked;

INSERT INTO public.app_settings (
  id, app_name_en, app_name_ar, default_language, default_theme,
  allow_remember_me, require_strong_password, min_password_length,
  session_timeout_minutes, max_company_profiles, modules, data_reset
) VALUES (
  'default',
  'KSA Enterprise ERP',
  'نظام الريادة السحابي للمحاسبة',
  'en',
  'green',
  true,
  true,
  8,
  480,
  5,
  '{"dashboard":true,"sales":true,"expenses":true,"inventory":true,"contacts":true,"accounting":true,"vat":true,"companySettings":true}'::jsonb,
  '{"companies":{"enabled":true,"defaultChecked":false},"customers":{"enabled":true,"defaultChecked":false},"suppliers":{"enabled":true,"defaultChecked":false},"products":{"enabled":true,"defaultChecked":true},"warehouses":{"enabled":true,"defaultChecked":false},"invoices":{"enabled":true,"defaultChecked":true},"expenses":{"enabled":true,"defaultChecked":true},"accounts":{"enabled":true,"defaultChecked":false},"journalEntries":{"enabled":true,"defaultChecked":true},"vouchers":{"enabled":true,"defaultChecked":true},"bankReconciliations":{"enabled":true,"defaultChecked":true}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public."roles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select_auth" ON public."roles";
CREATE POLICY "roles_select_auth" ON public."roles" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "roles_write_sa" ON public."roles";
CREATE POLICY "roles_write_sa" ON public."roles" FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_auth" ON public."profiles";
CREATE POLICY "profiles_select_auth" ON public."profiles" FOR SELECT TO authenticated USING (true);

ALTER TABLE public."user_preferences" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_preferences_select_auth" ON public."user_preferences";
CREATE POLICY "user_preferences_select_auth" ON public."user_preferences" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "user_preferences_own" ON public."user_preferences";
CREATE POLICY "user_preferences_own" ON public."user_preferences" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public."app_settings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_select_auth" ON public."app_settings";
CREATE POLICY "app_settings_select_auth" ON public."app_settings" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "app_settings_write_sa" ON public."app_settings";
CREATE POLICY "app_settings_write_sa" ON public."app_settings" FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

ALTER TABLE public."custom_features" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_features_select_auth" ON public."custom_features";
CREATE POLICY "custom_features_select_auth" ON public."custom_features" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "custom_features_write_sa" ON public."custom_features";
CREATE POLICY "custom_features_write_sa" ON public."custom_features" FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

ALTER TABLE public."companies" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_select_auth" ON public."companies";
CREATE POLICY "companies_select_auth" ON public."companies" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "companies_write_auth" ON public."companies";
CREATE POLICY "companies_write_auth" ON public."companies" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."customers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_select_auth" ON public."customers";
CREATE POLICY "customers_select_auth" ON public."customers" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "customers_write_auth" ON public."customers";
CREATE POLICY "customers_write_auth" ON public."customers" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."suppliers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_select_auth" ON public."suppliers";
CREATE POLICY "suppliers_select_auth" ON public."suppliers" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "suppliers_write_auth" ON public."suppliers";
CREATE POLICY "suppliers_write_auth" ON public."suppliers" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."warehouses" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouses_select_auth" ON public."warehouses";
CREATE POLICY "warehouses_select_auth" ON public."warehouses" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "warehouses_write_auth" ON public."warehouses";
CREATE POLICY "warehouses_write_auth" ON public."warehouses" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."products" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select_auth" ON public."products";
CREATE POLICY "products_select_auth" ON public."products" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "products_write_auth" ON public."products";
CREATE POLICY "products_write_auth" ON public."products" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."invoices" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_select_auth" ON public."invoices";
CREATE POLICY "invoices_select_auth" ON public."invoices" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "invoices_write_auth" ON public."invoices";
CREATE POLICY "invoices_write_auth" ON public."invoices" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."reserved_invoices" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reserved_invoices_select_auth" ON public."reserved_invoices";
CREATE POLICY "reserved_invoices_select_auth" ON public."reserved_invoices" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "reserved_invoices_write_auth" ON public."reserved_invoices";
CREATE POLICY "reserved_invoices_write_auth" ON public."reserved_invoices" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."expenses" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select_auth" ON public."expenses";
CREATE POLICY "expenses_select_auth" ON public."expenses" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "expenses_write_auth" ON public."expenses";
CREATE POLICY "expenses_write_auth" ON public."expenses" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."accounts" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_select_auth" ON public."accounts";
CREATE POLICY "accounts_select_auth" ON public."accounts" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "accounts_write_auth" ON public."accounts";
CREATE POLICY "accounts_write_auth" ON public."accounts" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."journal_entries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_entries_select_auth" ON public."journal_entries";
CREATE POLICY "journal_entries_select_auth" ON public."journal_entries" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "journal_entries_write_auth" ON public."journal_entries";
CREATE POLICY "journal_entries_write_auth" ON public."journal_entries" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."vouchers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vouchers_select_auth" ON public."vouchers";
CREATE POLICY "vouchers_select_auth" ON public."vouchers" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "vouchers_write_auth" ON public."vouchers";
CREATE POLICY "vouchers_write_auth" ON public."vouchers" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public."bank_reconciliations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_reconciliations_select_auth" ON public."bank_reconciliations";
CREATE POLICY "bank_reconciliations_select_auth" ON public."bank_reconciliations" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "bank_reconciliations_write_auth" ON public."bank_reconciliations";
CREATE POLICY "bank_reconciliations_write_auth" ON public."bank_reconciliations" FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public."roles" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."profiles" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."user_preferences" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."app_settings" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."custom_features" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."companies" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."customers" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."suppliers" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."warehouses" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."products" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."invoices" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."reserved_invoices" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."expenses" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."accounts" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."journal_entries" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."vouchers" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."bank_reconciliations" TO authenticated;

CREATE INDEX IF NOT EXISTS invoices_number_idx ON public.invoices (invoice_number);

CREATE INDEX IF NOT EXISTS invoices_date_idx ON public.invoices (date);

CREATE INDEX IF NOT EXISTS invoices_company_id_idx ON public.invoices (company_id);

CREATE INDEX IF NOT EXISTS reserved_invoices_company_idx ON public.reserved_invoices (company_id);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));
