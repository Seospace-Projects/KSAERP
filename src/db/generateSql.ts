import { initialAppSettings, initialRoles } from '../auth';
import { APP_SETTINGS_ROW_ID, SCHEMA_TABLES, type SchemaColumn, type SchemaTable } from './schemaRegistry';

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function columnSql(col: SchemaColumn): string {
  const parts = [quoteIdent(col.name), col.sqlType];
  if (col.pk) parts.push('PRIMARY KEY');
  if (col.notNull && !col.pk) parts.push('NOT NULL');
  if (col.unique) parts.push('UNIQUE');
  if (col.defaultSql) parts.push(`DEFAULT ${col.defaultSql}`);
  if (col.references) {
    parts.push(`REFERENCES ${col.references}`);
    if (col.onDelete) parts.push(`ON DELETE ${col.onDelete.toUpperCase()}`);
  }
  return `  ${parts.join(' ')}`;
}

function addColumnsSql(table: SchemaTable): string {
  return table.columns
    .filter(col => !col.pk)
    .map(col => {
      const extra = [
        col.sqlType,
        col.notNull ? 'NOT NULL' : '',
        col.defaultSql ? `DEFAULT ${col.defaultSql}` : '',
      ].filter(Boolean).join(' ');
      return `ALTER TABLE public.${quoteIdent(table.name)} ADD COLUMN IF NOT EXISTS ${quoteIdent(col.name)} ${extra};`;
    })
    .join('\n');
}

function createTableSql(table: SchemaTable): string {
  return [
    `CREATE TABLE IF NOT EXISTS public.${quoteIdent(table.name)} (`,
    table.columns.map(columnSql).join(',\n'),
    ');',
    `COMMENT ON TABLE public.${quoteIdent(table.name)} IS ${sqlString(table.comment)};`,
  ].join('\n');
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function seedRolesSql(): string {
  const rows = initialRoles.map(role => {
    return `(${[
      sqlString(role.id),
      sqlString(role.nameEn),
      sqlString(role.nameAr),
      sqlString(role.descriptionEn),
      sqlString(role.descriptionAr),
      sqlJson(role.permissions),
      role.isSystem ? 'true' : 'false',
      role.isLocked ? 'true' : 'false',
    ].join(', ')})`;
  });
  return `INSERT INTO public.roles (id, name_en, name_ar, description_en, description_ar, permissions, is_system, is_locked)
VALUES
${rows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  description_en = EXCLUDED.description_en,
  description_ar = EXCLUDED.description_ar,
  permissions = EXCLUDED.permissions,
  is_system = EXCLUDED.is_system,
  is_locked = EXCLUDED.is_locked;`;
}

function seedSettingsSql(): string {
  const s = initialAppSettings;
  return `INSERT INTO public.app_settings (
  id, app_name_en, app_name_ar, default_language, default_theme,
  allow_remember_me, require_strong_password, min_password_length,
  session_timeout_minutes, max_company_profiles, modules, data_reset
) VALUES (
  ${sqlString(APP_SETTINGS_ROW_ID)},
  ${sqlString(s.appNameEn)},
  ${sqlString(s.appNameAr)},
  ${sqlString(s.defaultLanguage)},
  ${sqlString(s.defaultTheme)},
  ${s.allowRememberMe ? 'true' : 'false'},
  ${s.requireStrongPassword ? 'true' : 'false'},
  ${s.minPasswordLength},
  ${s.sessionTimeoutMinutes},
  ${s.maxCompanyProfiles},
  ${sqlJson(s.modules)},
  ${sqlJson(s.dataReset)}
)
ON CONFLICT (id) DO NOTHING;`;
}

function rlsSql(table: SchemaTable): string {
  const t = quoteIdent(table.name);
  const lines = [
    `ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS ${quoteIdent(`${table.name}_select_auth`)} ON public.${t};`,
    `CREATE POLICY ${quoteIdent(`${table.name}_select_auth`)} ON public.${t} FOR SELECT TO authenticated USING (true);`,
  ];

  if (table.rls === 'operational') {
    lines.push(
      `DROP POLICY IF EXISTS ${quoteIdent(`${table.name}_write_auth`)} ON public.${t};`,
      `CREATE POLICY ${quoteIdent(`${table.name}_write_auth`)} ON public.${t} FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    );
  } else if (table.rls === 'super_admin_write') {
    lines.push(
      `DROP POLICY IF EXISTS ${quoteIdent(`${table.name}_write_sa`)} ON public.${t};`,
      `CREATE POLICY ${quoteIdent(`${table.name}_write_sa`)} ON public.${t} FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());`,
    );
  } else if (table.rls === 'preferences') {
    lines.push(
      `DROP POLICY IF EXISTS ${quoteIdent(`${table.name}_own`)} ON public.${t};`,
      `CREATE POLICY ${quoteIdent(`${table.name}_own`)} ON public.${t} FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`,
    );
  }
  return lines.join('\n');
}

export function generateSchemaSql(tables: SchemaTable[] = SCHEMA_TABLES): string {
  const header = `-- KSA ERP schema
-- Generated from src/db/schemaRegistry.ts
-- Run this in the Supabase SQL Editor, then: npm run seed:auth
-- Do not insert into auth.users from this file.

`;

  const functions = `
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
`;

  const grants = tables.map(table => {
    const t = `public.${quoteIdent(table.name)}`;
    return `GRANT SELECT, INSERT, UPDATE, DELETE ON ${t} TO authenticated;`;
  }).join('\n');

  const body = [
    tables.map(createTableSql).join('\n\n'),
    tables.map(addColumnsSql).filter(Boolean).join('\n'),
    seedRolesSql(),
    seedSettingsSql(),
    functions.trim(),
    tables.map(rlsSql).join('\n\n'),
    grants,
    `GRANT USAGE ON SCHEMA public TO authenticated, anon;`,
    `CREATE INDEX IF NOT EXISTS invoices_number_idx ON public.invoices (invoice_number);`,
    `CREATE INDEX IF NOT EXISTS reserved_invoices_company_idx ON public.reserved_invoices (company_id);`,
    `CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));`,
    `NOTIFY pgrst, 'reload schema';`,
  ].join('\n\n');

  return `${header}${body}\n`;
}
