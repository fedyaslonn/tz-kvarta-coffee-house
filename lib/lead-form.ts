import type { Interest } from './content';

export type FieldErrors = Record<string, string>;
export interface LeadFields { name: string; phone: string; interest: Interest; comment: string }
export type LeadResult = { ok: true; duplicate: boolean } | { ok: false; errors: FieldErrors };
export const COMMENT_LIMIT = 600;
export const FORM_TIMEOUT_MS = 15_000;

/** Format only complete Belarus numbers, so typing and editing stay predictable. */
export function formatBelarusPhone(value: string): string {
  if (!/^\+?[0-9() -]+$/.test(value.trim())) return value;
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 9 && !value.trim().startsWith('+')
    ? digits : digits.length === 12 && digits.startsWith('375') ? digits.slice(3) : null;
  return local === null ? value : `+375 (${local.slice(0, 2)}) ${local.slice(2, 5)}-${local.slice(5, 7)}-${local.slice(7)}`;
}

export function composeComment(comment: string, product?: string): string {
  return [product ? `Выбран кофе: ${product}.` : '', comment.trim()].filter(Boolean).join('\n');
}

export function validateFields(fields: LeadFields, product?: string): FieldErrors {
  const errors: FieldErrors = {};
  if (fields.name.trim().length < 2 || fields.name.trim().length > 60) errors.name = 'Напишите имя: от 2 до 60 символов.';
  if (!fields.phone.trim()) errors.phone = 'Оставьте белорусский номер, чтобы мы могли перезвонить.';
  if (composeComment(fields.comment, product).length > COMMENT_LIMIT) {
    errors.comment = 'Комментарий вместе с выбранным кофе должен быть не длиннее 600 символов. Сократите текст или уберите выбор.';
  }
  return errors;
}

/** Treat upstream JSON as untrusted; a broken response must not look successful. */
export function parseLeadResult(value: unknown, status: number): LeadResult {
  if (value && typeof value === 'object') {
    const result = value as Record<string, unknown>;
    if (status === 201 && result.ok === true && Number.isInteger(result.id) && Number(result.id) > 0) {
      return { ok: true, duplicate: false };
    }
    if (status === 200 && result.ok === true && result.duplicate === true) return { ok: true, duplicate: true };
    if (result.ok === false && status >= 400) {
      if (result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)) {
        const errors = Object.fromEntries(Object.entries(result.errors).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
        if (Object.keys(errors).length) return { ok: false, errors };
      }
      if (typeof result.error === 'string') return { ok: false, errors: { _form: result.error } };
    }
  }
  return { ok: false, errors: { _form: 'Не удалось подтвердить отправку. Попробуйте ещё раз — повторная заявка не создаст дубль.' } };
}
