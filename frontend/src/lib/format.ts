import type { DocStatus, DocType } from './api';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function formatBytes(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function formatDateTime(iso: string | null | undefined): string {
  const d = parse(iso);
  return d
    ? d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—';
}

export function formatTime(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
}

export function formatNumber(n: number | null | undefined): string {
  return n == null ? '—' : n.toLocaleString('en-GB');
}

export function formatPercent(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${Math.round(v <= 1 ? v * 100 : v)}%`;
}

export function shortHash(h: string | null | undefined, len = 10): string {
  if (!h) return '—';
  return h.length > len ? `${h.slice(0, len)}…` : h;
}

export function humanize(s: string | null | undefined): string {
  if (!s) return '—';
  const t = s.replace(/[_.-]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  policy: 'Policy',
  use_case: 'Use case',
  governance: 'Governance',
  audit_report: 'Audit report',
  technical_log: 'Technical log',
  contract: 'Contract',
  other: 'Other',
};

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  queued: 'Queued',
  parsing: 'Parsing',
  chunking: 'Chunking',
  embedding: 'Embedding',
  tagging: 'Tagging',
  ready: 'Ready',
  failed: 'Failed',
};

export const DOC_STATUSES: DocStatus[] = ['queued', 'parsing', 'chunking', 'embedding', 'tagging', 'ready', 'failed'];

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
