import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSchemaSql } from './generateSql';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'supabase', 'schema.sql');
writeFileSync(out, generateSchemaSql(), 'utf8');
console.log(`Wrote ${out}`);
