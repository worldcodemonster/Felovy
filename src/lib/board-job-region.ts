/** Country / location → coarse region for job board filters (from felovy-search). */

const US_CODES = new Set(['US', 'USA', 'UM']);

const EU_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'GB', 'UK', 'CH', 'NO', 'IS', 'LI', 'AL', 'BA', 'MK', 'ME', 'RS', 'XK', 'MD', 'UA', 'BY',
]);

const LATAM_CODES = new Set([
  'MX', 'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA',
  'CU', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'PR',
  'CO', 'VE', 'GY', 'SR', 'GF',
  'EC', 'PE', 'BO', 'CL', 'AR', 'PY', 'UY', 'BR',
]);

const US_LOCATION = /\b(united states|u\.?s\.?a\.?|u\.?s\.?\b|america)\b/i;
const EU_LOCATION =
  /\b(europe|european|united kingdom|u\.?k\.?|england|scotland|wales|ireland|germany|france|spain|italy|netherlands|belgium|sweden|norway|denmark|finland|poland|portugal|austria|switzerland|czech|romania|hungary|greece)\b/i;
const LATAM_LOCATION =
  /\b(latin america|latam|mexico|brazil|argentina|chile|colombia|peru|uruguay|paraguay|bolivia|ecuador|venezuela|guatemala|costa rica|panama)\b/i;

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim().toUpperCase();
  if (!t) return null;
  if (t === 'UNITED STATES' || t === 'UNITED STATES OF AMERICA') return 'US';
  if (t === 'UNITED KINGDOM' || t === 'GREAT BRITAIN') return 'GB';
  if (t.length === 2 || t.length === 3) {
    return t.slice(0, 2) === 'UK' ? 'GB' : t.length === 3 && t === 'USA' ? 'US' : t.slice(0, 2);
  }
  return t.slice(0, 2);
}

export function inferRegion(
  countryCode: string | null | undefined,
  locationName: string | null | undefined,
): 'US' | 'EU' | 'LATAM' | 'OTHER' {
  const code = normalizeCountryCode(countryCode);
  if (code) {
    if (US_CODES.has(code) || code === 'US') return 'US';
    if (EU_CODES.has(code)) return 'EU';
    if (LATAM_CODES.has(code)) return 'LATAM';
  }
  const loc = locationName || '';
  if (US_LOCATION.test(loc)) return 'US';
  if (LATAM_LOCATION.test(loc)) return 'LATAM';
  if (EU_LOCATION.test(loc)) return 'EU';
  return 'OTHER';
}
