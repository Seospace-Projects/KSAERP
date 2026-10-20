import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSchemaSql } from './generateSql';
import {
  APP_COLLECTIONS,
  SCHEMA_TABLES,
  TYPE_INTERFACE_TO_TABLE,
  type SchemaColumn,
  type SchemaTable,
} from './schemaRegistry';

export type RecheckResult = {
  sql: string;
  scannedInterfaces: string[];
  addedTables: string[];
  addedColumns: { table: string; column: string }[];
  knownCollections: string[];
};

function toSnake(name: string): string {
  return name.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`).replace(/^_/, '');
}

function sqlTypeFromTs(type: string): string {
  const t = type.replace(/\s+/g, ' ').trim();
  if (t.includes('{') || t.includes('[') || t.startsWith('Record') || t.includes('|')) {
    if (t === "'en' | 'ar'" || t.includes("'green'") || t.includes("'professional'")) return 'text';
  }
  if (t === 'number') return 'numeric';
  if (t === 'boolean') return 'boolean';
  if (t.includes('[]') || t.includes('Record<') || t.includes('{')) return 'jsonb';
  return 'text';
}

function parseInterfaces(source: string): { name: string; fields: { name: string; type: string }[] }[] {
  const out: { name: string; fields: { name: string; type: string }[] }[] = [];
  const re = /export interface (\w+) \{([\s\S]*?)\n\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const name = match[1];
    const body = match[2];
    const fields: { name: string; type: string }[] = [];
    for (const line of body.split('\n')) {
      const field = line.trim().match(/^([A-Za-z0-9_]+)\??:\s*(.+?);?(?:\s*\/\/.*)?$/);
      if (!field) continue;
      fields.push({ name: field[1], type: field[2].replace(/;$/, '').trim() });
    }
    out.push({ name, fields });
  }
  return out;
}

export function recheckAppSchema(rootDir: string, options?: { persist?: boolean }): RecheckResult {
  const typesPath = join(rootDir, 'src', 'types.ts');
  const source = readFileSync(typesPath, 'utf8');
  const interfaces = parseInterfaces(source);
  const tables: SchemaTable[] = SCHEMA_TABLES.map(table => ({
    ...table,
    columns: table.columns.map(col => ({ ...col })),
  }));
  const addedTables: string[] = [];
  const addedColumns: { table: string; column: string }[] = [];

  for (const iface of interfaces) {
    const tableName = TYPE_INTERFACE_TO_TABLE[iface.name];
    if (!tableName) continue;
    let table = tables.find(item => item.name === tableName);
    if (!table) {
      table = {
        name: tableName,
        comment: `Auto-detected from ${iface.name}`,
        rls: 'operational',
        columns: [{ name: 'id', sqlType: 'text', pk: true }],
      };
      tables.push(table);
      addedTables.push(tableName);
    }
    const existing = new Set(table.columns.map(col => col.name));
    for (const field of iface.fields) {
      const colName = toSnake(field.name);
      if (existing.has(colName)) continue;
      const col: SchemaColumn = {
        name: colName,
        sqlType: sqlTypeFromTs(field.type),
      };
      table.columns.push(col);
      existing.add(colName);
      addedColumns.push({ table: tableName, column: colName });
    }
  }

  const sql = generateSchemaSql(tables);
  if (options?.persist !== false) {
    const schemaDir = join(rootDir, 'supabase');
    writeFileSync(join(schemaDir, 'schema.sql'), sql, 'utf8');
  }

  return {
    sql,
    scannedInterfaces: interfaces.map(item => item.name),
    addedTables,
    addedColumns,
    knownCollections: [...APP_COLLECTIONS],
  };
}

export function writeSchemaFromRegistry(rootDir: string): string {
  const sql = generateSchemaSql();
  writeFileSync(join(rootDir, 'supabase', 'schema.sql'), sql, 'utf8');
  return sql;
}

export function projectRootFromThisFile(): string {
  // Prefer cwd (Vercel / local). Avoid import.meta so CJS serverless bundles work.
  if (typeof process !== 'undefined' && process.cwd) return process.cwd();
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..');
}
