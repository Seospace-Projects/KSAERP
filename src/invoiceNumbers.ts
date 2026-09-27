import { CompanyProfile, Invoice, ReservedInvoiceNumber } from './types';

export type InvoiceCompanyScope = Pick<CompanyProfile, 'id' | 'invoicePrefix'>;

export function normalizeInvoiceNumber(value: string): string {
  return value.toUpperCase().trim();
}

export function invoicesForCompany(
  invoices: Invoice[],
  company: InvoiceCompanyScope
): Invoice[] {
  const prefix = normalizeInvoiceNumber(company.invoicePrefix || 'INV-');
  return invoices.filter(inv => {
    if (inv.companyDetails?.id) return inv.companyDetails.id === company.id;
    const number = normalizeInvoiceNumber(inv.invoiceNumber);
    if (!number.startsWith(prefix)) return false;
    return /^\d+$/.test(number.slice(prefix.length));
  });
}

export function reservedForCompany(
  reserved: ReservedInvoiceNumber[],
  companyId: string
): ReservedInvoiceNumber[] {
  return reserved.filter(item => item.companyId === companyId);
}

export function occupiedInvoiceNumbers(
  invoices: Invoice[],
  reserved: ReservedInvoiceNumber[],
  company: InvoiceCompanyScope
): Set<string> {
  const occupied = new Set<string>();
  for (const invoice of invoicesForCompany(invoices, company)) {
    occupied.add(normalizeInvoiceNumber(invoice.invoiceNumber));
  }
  for (const item of reservedForCompany(reserved, company.id)) {
    occupied.add(normalizeInvoiceNumber(item.invoiceNumber));
  }
  return occupied;
}

export function isInvoiceNumberOccupied(
  invoiceNumber: string,
  invoices: Invoice[],
  reserved: ReservedInvoiceNumber[],
  company: InvoiceCompanyScope
): boolean {
  const normalized = normalizeInvoiceNumber(invoiceNumber);
  if (!normalized) return false;
  return occupiedInvoiceNumbers(invoices, reserved, company).has(normalized);
}

export function invoiceNumberConflict(
  invoiceNumber: string,
  invoices: Invoice[],
  reserved: ReservedInvoiceNumber[],
  company: InvoiceCompanyScope
): 'empty' | 'issued' | 'reserved' | null {
  const normalized = normalizeInvoiceNumber(invoiceNumber);
  if (!normalized) return 'empty';
  if (
    invoicesForCompany(invoices, company).some(
      inv => normalizeInvoiceNumber(inv.invoiceNumber) === normalized
    )
  ) {
    return 'issued';
  }
  if (
    reservedForCompany(reserved, company.id).some(
      item => normalizeInvoiceNumber(item.invoiceNumber) === normalized
    )
  ) {
    return 'reserved';
  }
  return null;
}

export function suggestNextInvoiceNumber(
  prefix: string,
  invoices: Invoice[],
  reserved: ReservedInvoiceNumber[],
  company: InvoiceCompanyScope,
  invoiceDate?: string
): string {
  const customPrefix = prefix || company.invoicePrefix || 'INV-';
  const companyInvoices = invoicesForCompany(invoices, company);
  const dated = invoiceDate
    ? companyInvoices.filter(inv => inv.date <= invoiceDate)
    : companyInvoices;
  let counter = dated.length + 1;
  const occupied = occupiedInvoiceNumbers(invoices, reserved, company);
  let suggested = `${customPrefix}${String(counter).padStart(4, '0')}`;
  while (occupied.has(normalizeInvoiceNumber(suggested))) {
    counter++;
    suggested = `${customPrefix}${String(counter).padStart(4, '0')}`;
  }
  return suggested;
}

export function buildReservedInvoiceNumber(params: {
  companyId: string;
  invoiceNumber: string;
  createdByUserId: string;
}): ReservedInvoiceNumber {
  return {
    id: `rsv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    companyId: params.companyId,
    invoiceNumber: params.invoiceNumber.trim(),
    createdAt: new Date().toISOString(),
    createdByUserId: params.createdByUserId,
  };
}

export const RESERVE_RANGE_MAX = 200;

export function formatInvoiceSequence(prefix: string, sequence: number): string {
  return `${prefix || 'INV-'}${String(sequence).padStart(4, '0')}`;
}

export function parseInvoiceSequence(invoiceNumber: string, prefix: string): number | null {
  const p = prefix || 'INV-';
  const value = invoiceNumber.trim();
  const rest = value.toUpperCase().startsWith(p.toUpperCase())
    ? value.slice(p.length)
    : value.replace(/^[^\d]*/, '');
  const sequence = parseInt(rest, 10);
  return Number.isFinite(sequence) && sequence > 0 ? sequence : null;
}

export function nextFreeSequenceNumber(
  prefix: string,
  invoices: Invoice[],
  reserved: ReservedInvoiceNumber[],
  company: InvoiceCompanyScope,
  invoiceDate?: string
): number {
  const suggested = suggestNextInvoiceNumber(prefix, invoices, reserved, company, invoiceDate);
  return parseInvoiceSequence(suggested, prefix) || 1;
}

export function reserveInvoiceNumberRange(params: {
  prefix: string;
  from: number;
  to: number;
  companyId: string;
  createdByUserId: string;
  invoices: Invoice[];
  reserved: ReservedInvoiceNumber[];
}): {
  items: ReservedInvoiceNumber[];
  added: number;
  skippedIssued: number;
  skippedReserved: number;
  error?: string;
} {
  const from = Math.trunc(params.from);
  const to = Math.trunc(params.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1) {
    return { items: [], added: 0, skippedIssued: 0, skippedReserved: 0, error: 'invalid' };
  }
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  if (end - start + 1 > RESERVE_RANGE_MAX) {
    return { items: [], added: 0, skippedIssued: 0, skippedReserved: 0, error: 'too_large' };
  }

  const prefix = params.prefix || 'INV-';
  const company: InvoiceCompanyScope = { id: params.companyId, invoicePrefix: prefix };
  const scopedInvoices = invoicesForCompany(params.invoices, company);
  const items: ReservedInvoiceNumber[] = [];
  let skippedIssued = 0;
  let skippedReserved = 0;
  let working = reservedForCompany(params.reserved, params.companyId);

  for (let seq = start; seq <= end; seq++) {
    const invoiceNumber = formatInvoiceSequence(prefix, seq);
    const conflict = invoiceNumberConflict(invoiceNumber, scopedInvoices, working, company);
    if (conflict === 'issued') {
      skippedIssued++;
      continue;
    }
    if (conflict === 'reserved') {
      skippedReserved++;
      continue;
    }
    const item = buildReservedInvoiceNumber({
      companyId: params.companyId,
      invoiceNumber,
      createdByUserId: params.createdByUserId,
    });
    items.push(item);
    working = [item, ...working];
  }

  return { items, added: items.length, skippedIssued, skippedReserved };
}
