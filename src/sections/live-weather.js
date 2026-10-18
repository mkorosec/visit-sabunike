// "Right now in Sabunike": live weather, wind (named the local way) and sea
// temperature from Open-Meteo, plus a 5-day mini forecast. Reusable helper:
//
//   import { liveWeatherHtml, mountLiveWeather } from './live-weather.js';
//   render: `<div data-live-weather>${liveWeatherHtml(ctx)}</div>`
//   mount:  const stop = mountLiveWeather(el.querySelector('[data-live-weather]'), ctx, { climate });
//
// Responses are cached in sessionStorage for 30 minutes. Any failure shows a
// short message instead of an empty box. Styles live in seasons.css.

import { esc, icon, monthName } from '../lib/util.js';

const FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=44.2587&longitude=15.1589&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe/Zagreb&forecast_days=5';
const MARINE_URL =
  'https://marine-api.open-meteo.com/v1/marine?latitude=44.27&longitude=15.15&current=sea_surface_temperature,wave_height&timezone=Europe/Zagreb';
// Month names after "in" for languages that decline them (sl/hr locative):
// "v juliju", "u srpnju". Shared by the travel, seasons, cycling and activities sections.
const MONTH_IN = {
  sl: ['januarju', 'februarju', 'marcu', 'aprilu', 'maju', 'juniju', 'juliju', 'avgustu', 'septembru', 'oktobru', 'novembru', 'decembru'],
  hr: ['siječnju', 'veljači', 'ožujku', 'travnju', 'svibnju', 'lipnju', 'srpnju', 'kolovozu', 'rujnu', 'listopadu', 'studenome', 'prosincu'],
};
export const monthIn = (m, lang) => MONTH_IN[lang]?.[m - 1] ?? monthName(m, lang, true);
// Placeholders for month templates: {m} long name, {mIn} after "in", {M} capitalised.
export function monthVars(m, lang) {
  const name = monthName(m, lang, true);
  return { m: name, mIn: monthIn(m, lang), M: name.charAt(0).toUpperCase() + name.slice(1) };
}

const CACHE_KEY = 'visit-sabunike:live-weather:v1';
const CACHE_MS = 30 * 60 * 1000;

export const W = {
  title: { en: 'Right now in Sabunike', de: 'Gerade jetzt in Sabunike', sl: 'Ta trenutek v Sabunikah', hr: 'Upravo sada u Sabunikama', it: 'In questo momento a Sabunike' },
  updated: { en: 'local time', de: 'Ortszeit', sl: 'po lokalnem času', hr: 'po lokalnom vremenu', it: 'ora locale' },
  loading: { en: 'Loading live weather…', de: 'Live-Wetter wird geladen…', sl: 'Nalagam trenutno vreme…', hr: 'Učitavam trenutačno vrijeme…', it: 'Caricamento del meteo in tempo reale…' },
  failed: {
    en: 'Live weather is not available right now. The monthly averages below still apply.',
    de: 'Das Live-Wetter ist gerade nicht verfügbar. Die Monatswerte unten gelten trotzdem.',
    sl: 'Trenutno vreme ta hip ni na voljo. Mesečna povprečja spodaj še vedno veljajo.',
    hr: 'Trenutačno vrijeme sada nije dostupno. Mjesečni prosjeci u nastavku i dalje vrijede.',
    it: 'Il meteo in tempo reale non è disponibile al momento. Le medie mensili qui sotto restano valide.',
  },
  air: { en: 'Air', de: 'Luft', sl: 'Zrak', hr: 'Zrak', it: 'Aria' },
  sea: { en: 'Sea', de: 'Meer', sl: 'Morje', hr: 'More', it: 'Mare' },
  wind: { en: 'Wind', de: 'Wind', sl: 'Veter', hr: 'Vjetar', it: 'Vento' },
  waves: { en: 'waves', de: 'Wellen', sl: 'valovi', hr: 'valovi', it: 'onde' },
  seaMissing: { en: 'Sea temperature unavailable', de: 'Meerestemperatur nicht verfügbar', sl: 'Temperatura morja ni na voljo', hr: 'Temperatura mora nije dostupna', it: 'Temperatura del mare non disponibile' },
  from: { en: 'from', de: 'aus', sl: 'iz smeri', hr: 'iz smjera', it: 'da' },
  today: { en: 'Today', de: 'Heute', sl: 'Danes', hr: 'Danas', it: 'Oggi' },
  next5: { en: 'Next 5 days', de: 'Die nächsten 5 Tage', sl: 'Naslednjih 5 dni', hr: 'Sljedećih 5 dana', it: 'Prossimi 5 giorni' },
  todayVsAvg: {
    en: 'Today {hi}°/{lo}° · {m} average {ahi}°/{alo}°',
    de: 'Heute {hi}°/{lo}° · Mittel im {m}: {ahi}°/{alo}°',
    sl: 'Danes {hi}°/{lo}° · povprečje ({m}): {ahi}°/{alo}°',
    hr: 'Danas {hi}°/{lo}° · prosjek ({m}): {ahi}°/{alo}°',
    it: 'Oggi {hi}°/{lo}° · media ({m}): {ahi}°/{alo}°',
  },
  typicalSea: { en: 'Average for {m}: {v}', de: 'Mittelwert im {m}: {v}', sl: 'Povprečje za {m}: {v}', hr: 'Prosjek za mjesec {m}: {v}', it: 'Media di {m}: {v}' },
  attribution: { en: 'Live data', de: 'Live-Daten', sl: 'Podatki v živo', hr: 'Podaci uživo', it: 'Dati in tempo reale' },
  likely: { en: 'probably', de: 'vermutlich', sl: 'verjetno', hr: 'vjerojatno', it: 'probabilmente' },
  breeze: { en: 'Light breeze from {d}', de: 'Leichte Brise aus {d}', sl: 'Rahel vetrič iz smeri {d}', hr: 'Lagani povjetarac iz smjera {d}', it: 'Brezza leggera da {d}' },
};

const COMPASS = {
  en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  de: ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'],
  sl: ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'],
  hr: ['S', 'SI', 'I', 'JI', 'J', 'JZ', 'Z', 'SZ'],
  it: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
};

// Local wind names by direction the wind comes FROM. A heuristic: bura blows
// from the N–NE off the Velebit, jugo from the SE, maestral from the NW.
export const WINDS = {
  bura: {
    name: 'Bura',
    text: {
      en: 'cold, dry and gusty, off the Velebit',
      de: 'kalt, trocken und böig, vom Velebit',
      sl: 'hladna, suha in sunkovita, z Velebita',
      hr: 'hladna, suha i na jake udare, s Velebita',
      it: 'fredda, secca e a raffiche, dal Velebit',
    },
  },
  jugo: {
    name: 'Jugo',
    text: {
      en: 'warm and humid, often brings clouds and rain',
      de: 'warm und feucht, bringt oft Wolken und Regen',
      sl: 'topel in vlažen, pogosto prinese oblake in dež',
      hr: 'topao i vlažan, često donosi oblake i kišu',
      it: 'caldo e umido, porta spesso nuvole e pioggia',
    },
  },
  maestral: {
    name: 'Maestral',
    text: {
      en: 'the fair-weather breeze from the sea',
      de: 'die Schönwetter-Brise vom Meer',
      sl: 'osvežilni vetrič z morja ob lepem vremenu',
      hr: 'osvježavajući povjetarac s mora za lijepa vremena',
      it: 'la brezza di mare del bel tempo',
    },
  },
  lebic: {
    name: 'Lebić',
    text: {
      en: 'south-westerly, can bring waves and showers',
      de: 'Südwestwind, kann Wellen und Schauer bringen',
      sl: 'jugozahodnik, lahko prinese valove in plohe',
      hr: 'jugozapadnjak, može donijeti valove i pljuskove',
      it: 'vento di sud-ovest, può portare onde e rovesci',
    },
  },
};

// Below this speed we do not put a local name on the wind: a light breeze from
// the SE at night is a land breeze, not jugo.
const NAME_KMH = 15;

const STRENGTH = [
  [6, { en: 'Almost calm', de: 'Fast windstill', sl: 'Skoraj brezvetrje', hr: 'Gotovo bez vjetra', it: 'Quasi calma' }],
  [20, { en: 'Light', de: 'Leicht', sl: 'Šibek', hr: 'Slab', it: 'Debole' }],
  [30, { en: 'Moderate', de: 'Mäßig', sl: 'Zmeren', hr: 'Umjeren', it: 'Moderato' }],
  [40, { en: 'Fresh', de: 'Frisch', sl: 'Svež', hr: 'Svjež', it: 'Teso' }],
  [55, { en: 'Strong', de: 'Stark', sl: 'Močan', hr: 'Jak', it: 'Forte' }],
  [Infinity, { en: 'Gale-force', de: 'Stürmisch', sl: 'Viharen', hr: 'Olujni', it: 'Burrascoso' }],
];

// WMO weather codes → label + icon.
const CODES = [
  [[0], 'clear', { en: 'Clear sky', de: 'Klar', sl: 'Jasno', hr: 'Vedro', it: 'Sereno' }],
  [[1], 'clear', { en: 'Mostly sunny', de: 'Überwiegend sonnig', sl: 'Pretežno jasno', hr: 'Pretežno sunčano', it: 'Prevalentemente soleggiato' }],
  [[2], 'partly', { en: 'Partly cloudy', de: 'Teils bewölkt', sl: 'Delno oblačno', hr: 'Djelomično oblačno', it: 'Parzialmente nuvoloso' }],
  [[3], 'cloud', { en: 'Overcast', de: 'Bedeckt', sl: 'Oblačno', hr: 'Oblačno', it: 'Coperto' }],
  [[45, 48], 'fog', { en: 'Fog', de: 'Nebel', sl: 'Megla', hr: 'Magla', it: 'Nebbia' }],
  [[51, 53, 55, 56, 57], 'rain', { en: 'Drizzle', de: 'Nieselregen', sl: 'Rosenje', hr: 'Rosulja', it: 'Pioggerella' }],
  [[61, 63, 65, 66, 67], 'rain', { en: 'Rain', de: 'Regen', sl: 'Dež', hr: 'Kiša', it: 'Pioggia' }],
  [[80, 81, 82], 'rain', { en: 'Showers', de: 'Schauer', sl: 'Plohe', hr: 'Pljuskovi', it: 'Rovesci' }],
  [[71, 73, 75, 77, 85, 86], 'snow', { en: 'Snow', de: 'Schnee', sl: 'Sneg', hr: 'Snijeg', it: 'Neve' }],
  [[95, 96, 99], 'storm', { en: 'Thunderstorms', de: 'Gewitter', sl: 'Nevihte', hr: 'Grmljavinsko nevrijeme', it: 'Temporali' }],
];

const WX_ICONS = {
  clear: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  partly: '<path d="M8 3.5v1.2M3.8 8H2.6M4.7 4.7l.9.9M12.3 4.7l-.9.9"/><path d="M5.3 10.6A3.5 3.5 0 0 1 11.6 7"/><path d="M7 20h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.5A3.3 3.3 0 0 0 7 20z"/>',
  cloud: '<path d="M6.5 19h11a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 1.8A3.7 3.7 0 0 0 6.5 19z"/>',
  fog: '<path d="M4 9h16M3 13h18M5 17h14"/>',
  rain: '<path d="M6.5 15h11a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 1.8A3.7 3.7 0 0 0 6.5 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  snow: '<path d="M6.5 14h11a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 1.8A3.7 3.7 0 0 0 6.5 14z"/><path d="M8 18h.01M12 20h.01M16 18h.01"/>',
  storm: '<path d="M6.5 14h11a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 1.8A3.7 3.7 0 0 0 6.5 14z"/><path d="m12.5 15-2 3.5h3l-2 3.5"/>',
};

export function wxIcon(kind, size = 24, label) {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="lw-wx lw-wx-${kind}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${WX_ICONS[kind] || WX_ICONS.cloud}</svg>`;
}

function codeInfo(code) {
  const hit = CODES.find(([codes]) => codes.includes(code));
  return hit ? { kind: hit[1], label: hit[2] } : { kind: 'cloud', label: { en: 'Cloudy', de: 'Bewölkt', sl: 'Oblačno', hr: 'Oblačno', it: 'Nuvoloso' } };
}

export function windNameFor(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 337.5 || d < 90) return 'bura';
  if (d < 180) return 'jugo';
  if (d < 270) return 'lebic';
  return 'maestral';
}

function compass(deg, lang) {
  const table = COMPASS[lang] || COMPASS.en;
  return table[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

function strength(kmh) {
  return STRENGTH.find(([max]) => kmh < max)[1];
}

const fmt = (v, lang, digits = 0) => new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);

function readCache() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.at < CACHE_MS && c.forecast) return c;
  } catch {
    /* storage blocked */
  }
  return null;
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, at: Date.now() }));
  } catch {
    /* storage blocked: we simply fetch again next time */
  }
}

async function getJson(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function load(signal) {
  const cached = readCache();
  if (cached) return cached;
  const [forecast, marine] = await Promise.allSettled([getJson(FORECAST_URL, signal), getJson(MARINE_URL, signal)]);
  if (forecast.status !== 'fulfilled') throw forecast.reason;
  const data = { forecast: forecast.value, marine: marine.status === 'fulfilled' ? marine.value : null };
  writeCache(data);
  return data;
}

// Placeholder for render(): same box size as the loaded widget, no network.
export function liveWeatherHtml(ctx) {
  return `<div class="lw lw-loading" aria-busy="true">
    <p class="lw-title">${icon('sun', { size: 18 })}${esc(ctx.t(W.title))}</p>
    <p class="lw-status muted">${esc(ctx.t(W.loading))}</p>
  </div>`;
}

function weekday(dateStr, lang, i, t) {
  if (i === 0) return t(W.today);
  return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(`${dateStr}T12:00:00`));
}

function widgetHtml(data, ctx, climate) {
  const t = ctx.t;
  const lang = ctx.lang;
  const cur = data.forecast.current;
  const daily = data.forecast.daily;
  const now = codeInfo(cur.weather_code);
  const deg = cur.wind_direction_10m;
  const kmh = cur.wind_speed_10m;
  const wind = WINDS[windNameFor(deg)];
  const calm = kmh < 6;
  const named = kmh >= NAME_KMH;
  const sea = data.marine?.current?.sea_surface_temperature;
  const waves = data.marine?.current?.wave_height;
  const time = String(cur.time || '').slice(11, 16);
  const month = Number(String(cur.time || '').slice(5, 7)) || new Date().getMonth() + 1;
  const typical = climate?.find((m) => m.month === month);
  const typicalLine = (label, v) =>
    typical ? `<span class="lw-typical">${esc(t(label).replace('{m}', monthName(month, lang, true)).replace('{v}', `${fmt(v, lang)} °C`))}</span>` : '';
  const todayLine = typical
    ? `<span class="lw-typical">${esc(
        t(W.todayVsAvg)
          .replace('{hi}', fmt(daily.temperature_2m_max[0], lang))
          .replace('{lo}', fmt(daily.temperature_2m_min[0], lang))
          .replace('{m}', monthName(month, lang))
          .replace('{ahi}', fmt(typical.airMaxC, lang))
          .replace('{alo}', fmt(typical.airMinC, lang)),
      )}</span>`
    : '';

  const days = daily.time
    .map((d, i) => {
      const info = codeInfo(daily.weather_code[i]);
      return `<li>
        <span class="lw-day">${esc(weekday(d, lang, i, t))}</span>
        ${wxIcon(info.kind, 26, t(info.label))}
        <span class="lw-temps"><b>${fmt(daily.temperature_2m_max[i], lang)}°</b> <span>${fmt(daily.temperature_2m_min[i], lang)}°</span></span>
      </li>`;
    })
    .join('');

  return `<div class="lw">
    <p class="lw-title">${icon('sun', { size: 18 })}${esc(t(W.title))}${time ? `<span class="lw-time">${esc(time)} ${esc(t(W.updated))}</span>` : ''}</p>
    <div class="lw-grid">
      <div class="lw-now">
        ${wxIcon(now.kind, 52)}
        <div>
          <p class="lw-big"><span class="visually-hidden">${esc(t(W.air))}: </span>${fmt(cur.temperature_2m, lang)} °C</p>
          <p class="lw-sub">${esc(t(now.label))}</p>
          ${todayLine ? `<p class="lw-sub">${todayLine}</p>` : ''}
        </div>
      </div>
      <div class="lw-cell">
        <p class="lw-label">${icon('wind', { size: 18 })}${esc(t(W.wind))}</p>
        <p class="lw-val">
          <span class="lw-arrow" style="--deg:${(deg + 180) % 360}deg" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3 18 19 12 15.5 6 19z" fill="currentColor"/></svg></span>
          ${fmt(kmh, lang)} km/h <span class="muted">${esc(t(W.from))} ${esc(compass(deg, lang))}</span>
        </p>
        <p class="lw-note">${calm ? esc(t(strength(kmh))) : named ? `${esc(t(strength(kmh)))} · ${esc(t(W.likely))} <b>${esc(wind.name)}</b>: ${esc(t(wind.text))}` : esc(t(W.breeze).replace('{d}', compass(deg, lang)))}</p>
      </div>
      <div class="lw-cell">
        <p class="lw-label">${icon('wave', { size: 18 })}${esc(t(W.sea))}</p>
        ${
          sea != null
            ? `<p class="lw-val">${fmt(sea, lang, 1)} °C${waves != null ? ` <span class="muted">· ${esc(t(W.waves))} ${fmt(waves, lang, 1)} m</span>` : ''}</p>
               <p class="lw-note">${typicalLine(W.typicalSea, typical?.seaC)}</p>`
            : `<p class="lw-note">${esc(t(W.seaMissing))}</p>`
        }
      </div>
    </div>
    <div class="lw-forecast">
      <p class="lw-label">${esc(t(W.next5))}</p>
      <ol>${days}</ol>
    </div>
    <p class="source-note lw-attrib">${esc(t(W.attribution))}: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> (CC BY 4.0)</p>
  </div>`;
}

// Fills `el` with the live widget. Returns a cleanup function.
// opts.climate: the 12 climate months (src/data/climate.json) for "typical" hints.
export function mountLiveWeather(el, ctx, { climate = null } = {}) {
  if (!el) return () => {};
  const ac = new AbortController();
  load(ac.signal)
    .then((data) => {
      if (!ac.signal.aborted) el.innerHTML = widgetHtml(data, ctx, climate);
    })
    .catch((err) => {
      if (ac.signal.aborted) return;
      console.warn('[live-weather] unavailable', err);
      el.innerHTML = `<div class="lw lw-failed" role="status">
        <p class="lw-title">${icon('sun', { size: 18 })}${esc(ctx.t(W.title))}</p>
        <p class="lw-status">${esc(ctx.t(W.failed))}</p>
      </div>`;
    });
  return () => ac.abort();
}
