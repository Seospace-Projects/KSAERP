/**
 * One-time: create seed Auth users + profiles after schema.sql has been applied.
 * Passwords come from SEED_PASSWORD_* env vars — never from source.
 * Usage: npm run seed:auth
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { initialUsers } from '../src/auth';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '../src/server/env';

dotenv.config();

const SEED_PASSWORD_ENV: Record<string, string> = {
  superadmin: 'SEED_PASSWORD_SUPERADMIN',
  admin: 'SEED_PASSWORD_ADMIN',
  accountant: 'SEED_PASSWORD_ACCOUNTANT',
  sales: 'SEED_PASSWORD_SALES',
  inventory: 'SEED_PASSWORD_INVENTORY',
  viewer: 'SEED_PASSWORD_VIEWER',
};

const url = getSupabaseUrl();
const serviceKey = getSupabaseServiceRoleKey();

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env first.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

function seedPassword(username: string): string | undefined {
  const envName = SEED_PASSWORD_ENV[username];
  const value = envName ? process.env[envName]?.trim() : undefined;
  return value || undefined;
}

async function main() {
  for (const seed of initialUsers) {
    const envName = SEED_PASSWORD_ENV[seed.username];
    const password = seedPassword(seed.username);
    if (!password) {
      console.warn(`Skip ${seed.username}: set ${envName} in .env.`);
      continue;
    }

    const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
    const existingUsers = listed?.users ?? [];
    let user = existingUsers.find(u => (u.email || '').toLowerCase() === seed.email.toLowerCase());

    if (!user) {
      const created = await admin.auth.admin.createUser({
        email: seed.email,
        password,
        email_confirm: true,
        user_metadata: { username: seed.username },
      });
      if (created.error || !created.data.user) {
        console.error(`Auth create failed for ${seed.username}:`, created.error?.message);
        continue;
      }
      user = created.data.user;
      console.log(`Created auth user ${seed.username} (${user.id})`);
    } else {
      const updated = await admin.auth.admin.updateUserById(user.id, {
        password,
        email: seed.email,
        email_confirm: true,
        user_metadata: { username: seed.username },
      });
      if (updated.error) {
        console.error(`Auth password update failed for ${seed.username}:`, updated.error.message);
        continue;
      }
      console.log(`Updated auth password for ${seed.username}`);
    }

    const { error } = await admin.from('profiles').upsert({
      id: user.id,
      username: seed.username,
      email: seed.email,
      name_en: seed.nameEn,
      name_ar: seed.nameAr,
      role_id: seed.roleId,
      is_active: seed.isActive,
      created_at: seed.createdAt,
    }, { onConflict: 'id' });
    if (error) console.error(`Profile upsert failed for ${seed.username}:`, error.message);
    else console.log(`Profile ready for ${seed.username}`);
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : 'Seed failed');
  process.exit(1);
});
