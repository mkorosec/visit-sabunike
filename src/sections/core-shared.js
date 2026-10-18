// Helpers shared by the core conversion sections (hero, highlights, direct,
// inquiry, faq, footer) and the sticky CTA.

import { SITE } from '../content/site.js';
import { esc, fromVilla, formatKm, formatMinutes, tr } from '../lib/util.js';

// Zadar Airport (ZAD) apron.
export const AIRPORT_ZAD = { lat: 44.1083, lon: 15.3467 };

export function airportKm() {
  return fromVilla(AIRPORT_ZAD.lat, AIRPORT_ZAD.lon);
}

// Zadar Airport by road, from travel.json transfers 'transfer-drive'. Copied
// here so the hero does not pull in the 90 kB travel data; tests/core.test.mjs
// keeps the two in sync. Visitors plan by road, not by straight line.
export const AIRPORT_DRIVE = { km: 29.7, min: 36 };

export function airportRoadLabel() {
  return `${formatKm(AIRPORT_DRIVE.km)} · ${formatMinutes(AIRPORT_DRIVE.min)}`;
}

// A visible marker for facts the owner still has to confirm. Only shown in
// development so the live site never looks unfinished.
export function ownerTodo(note) {
  if (!import.meta.env.DEV) return '';
  return `<span class="badge todo" title="${esc(note)}">TODO(owner)</span>`;
}

export function isConfirmed(key) {
  return Boolean(SITE.directBooking.confirmed?.[key]);
}

// Text that states an owner value (discount, deposit, …) as fact is only used
// once that value is confirmed in SITE.directBooking.confirmed; otherwise the
// neutral fallback (default "on request") is shown, also on the live site.
export function ownerValue(ctx, key, text, fallback = ctx.t('onRequest')) {
  return isConfirmed(key) ? text : fallback;
}

// Reply channels the owner has configured. E-mail is always available.
export function contactChannels() {
  const c = SITE.contact;
  return [
    { id: 'email', label: 'E-mail', icon: 'mail', href: `mailto:${c.email}` },
    c.whatsapp && { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', href: `https://wa.me/${c.whatsapp}` },
    c.viber && { id: 'viber', label: 'Viber', icon: 'chat', href: `viber://chat?number=%2B${c.viber}` },
  ].filter(Boolean);
}

export function mapLinks() {
  const { lat, lon } = SITE.location;
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
  };
}

export function addressLine(lang = 'en') {
  const a = SITE.address;
  return `${a.street}, ${a.postcode} ${a.place} (${a.municipality}), ${tr(a.country, lang)}`;
}

// "<n> <noun>" with the noun in the right plural form. forms are keyed by
// Intl.PluralRules categories: en/de/it use one/other, Croatian adds few
// (2–4), Slovenian adds two (dual) and few (3–4).
export function plural(lang, n, forms) {
  const f = forms[lang] || forms.en;
  return `${n} ${f[new Intl.PluralRules(lang).select(n)] ?? f.other}`;
}

const SECONDARY = {
  families: { section: 'beaches', label: { en: 'See the beaches', de: 'Zu den Stränden', sl: 'Oglejte si plaže', hr: 'Pogledajte plaže', it: 'Scoprite le spiagge' } },
  cyclists: { section: 'cycling', label: { en: 'Ride routes', de: 'Radrouten', sl: 'Kolesarske poti', hr: 'Biciklističke rute', it: 'Percorsi in bici' } },
  retreats: { section: 'retreat', label: { en: 'Plan a retreat', de: 'Retreat planen', sl: 'Načrtujte retreat', hr: 'Planirajte retreat', it: 'Organizzate un ritiro' } },
};
const EXPLORE = { en: 'Explore the house', de: 'Das Haus entdecken', sl: 'Oglejte si hišo', hr: 'Pogledajte kuću', it: 'Scoprite la casa' };

// Second hero button: audience-specific, but only if that section is on the page.
export function secondaryCta(ctx) {
  const own = ctx.audience.hero?.ctas?.[0];
  if (own) return { href: own.href, label: ctx.t(own.label) };
  const pick = SECONDARY[ctx.audience.id];
  if (pick && ctx.audience.sections.includes(pick.section)) return { href: `#${pick.section}`, label: ctx.t(pick.label) };
  if (ctx.audience.sections.includes('villa')) return { href: '#villa', label: ctx.t(EXPLORE) };
  return null;
}

export function euro(value, lang) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}
