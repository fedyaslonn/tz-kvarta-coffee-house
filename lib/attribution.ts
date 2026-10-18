export const ATTRIBUTION_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'yclid',
] as const;

export type Attribution = {
  utm: Record<string, string>;
  referrer: string;
  landing_path: string;
};

const STORAGE_KEY = 'kvarta:first-touch:v1';

function bounded(value: string, limit: number): string {
  return Array.from(value.replaceAll('\0', '').trim()).slice(0, limit).join('');
}

function sanitize(value: Attribution): Attribution {
  return {
    utm: Object.fromEntries(Object.entries(value.utm).map(([key, item]) => [key, bounded(item, 255)])),
    referrer: bounded(value.referrer, 2048),
    landing_path: bounded(value.landing_path, 2048),
  };
}

export function firstTouch(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  href: string,
  referrer: string,
): Attribution {
  const url = new URL(href);
  const current: Attribution = sanitize({
    utm: Object.fromEntries(
      ATTRIBUTION_KEYS.flatMap(key => {
        const value = url.searchParams.get(key);
        return value === null ? [] : [[key, value]];
      }),
    ),
    referrer,
    landing_path: url.pathname + url.search,
  });
  try {
    let saved: unknown = null;
    try {
      saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
    } catch {
      // Corrupted or inaccessible sessionStorage starts a fresh attribution record.
    }
    if (saved && typeof saved === 'object') {
      const value = saved as Partial<Attribution>;
      if (typeof value.referrer === 'string' && typeof value.landing_path === 'string' &&
          value.utm && typeof value.utm === 'object' && !Array.isArray(value.utm) &&
          Object.entries(value.utm).every(([key, item]) =>
            (ATTRIBUTION_KEYS as readonly string[]).includes(key) && typeof item === 'string')) {
        return sanitize(value as Attribution);
      }
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
  return current;
}
