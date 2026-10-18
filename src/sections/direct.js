// "Why book directly with us": honest benefits plus an optional interactive
// explainer (state.priceCompare) showing what a platform commission does to the
// price. Every number in the explainer is an illustration, never a quote.

import './direct.css';
import { esc, icon } from '../lib/util.js';
import { euro, isConfirmed, ownerTodo, ownerValue } from './core-shared.js';

const T = {
  eyebrow: { en: 'Book direct', de: 'Direkt buchen', sl: 'Rezervirajte neposredno', hr: 'Rezervirajte izravno', it: 'Prenotate direttamente' },
  title: { en: 'Why book directly with us', de: 'Warum direkt bei uns buchen', sl: 'Zakaj rezervirati neposredno pri nas', hr: 'Zašto rezervirati izravno kod nas', it: 'Perché prenotare direttamente da noi' },
  lede: {
    en: (lo, hi) => `Booking platforms typically charge hosts ${lo}–${hi} % commission on every stay. That cost is built into the price you see there. When you write to us directly, nobody sits in between — so we can pass the difference on to you.`,
    de: (lo, hi) => `Buchungsplattformen berechnen Gastgebern meist ${lo}–${hi} % Provision pro Aufenthalt. Diese Kosten stecken im Preis, den Sie dort sehen. Schreiben Sie uns direkt, sitzt niemand dazwischen — und wir geben den Unterschied an Sie weiter.`,
    sl: (lo, hi) => `Platforme za rezervacije gostiteljem običajno zaračunajo ${lo}–${hi} % provizije za vsako bivanje. Ta strošek je vključen v ceno, ki jo vidite tam. Ko nam pišete neposredno, vmes ni nikogar — zato lahko razliko namenimo vam.`,
    hr: (lo, hi) => `Platforme za rezervacije domaćinima obično naplaćuju ${lo}–${hi} % provizije za svaki boravak. Taj je trošak uključen u cijenu koju ondje vidite. Kad nam pišete izravno, između nas nema nikoga — pa razliku možemo prepustiti vama.`,
    it: (lo, hi) => `I portali di prenotazione applicano di solito ai proprietari una commissione del ${lo}–${hi} % su ogni soggiorno. Questo costo è compreso nel prezzo che vedete lì. Se ci scrivete direttamente, non c’è nessuno in mezzo, e la differenza possiamo lasciarla a voi.`,
  },
  calcTitle: { en: 'Where a platform’s commission goes', de: 'Wohin die Plattformprovision geht', sl: 'Kam gre provizija platforme', hr: 'Kamo ide provizija platforme', it: 'Dove va la commissione' },
  illustration: { en: 'Illustration · not a quote', de: 'Veranschaulichung · kein Angebot', sl: 'Ponazoritev · ni ponudba', hr: 'Ilustracija · nije ponuda', it: 'Esempio · non è un preventivo' },
  nights: { en: 'Nights', de: 'Nächte', sl: 'Noči', hr: 'Noćenja', it: 'Notti' },
  rate: { en: 'Example platform price per night', de: 'Beispielpreis pro Nacht auf der Plattform', sl: 'Primer cene na noč na platformi', hr: 'Primjer cijene po noći na platformi', it: 'Prezzo di esempio a notte' },
  commission: { en: 'Platform commission', de: 'Plattformprovision', sl: 'Provizija platforme', hr: 'Provizija platforme', it: 'Commissione' },
  viaPlatform: { en: 'Via a platform', de: 'Über eine Plattform', sl: 'Prek platforme', hr: 'Preko platforme', it: 'Tramite piattaforma' },
  direct: { en: 'Directly with us', de: 'Direkt bei uns', sl: 'Neposredno pri nas', hr: 'Izravno kod nas', it: 'Direttamente da noi' },
  hostGets: { en: 'we receive', de: 'wir erhalten', sl: 'prejmemo', hr: 'primamo', it: 'riceviamo' },
  platformGets: { en: 'platform keeps', de: 'Plattform behält', sl: 'platforma zadrži', hr: 'platforma zadržava', it: 'la piattaforma trattiene' },
  youSave: { en: 'you save', de: 'Sie sparen', sl: 'prihranite', hr: 'uštedite', it: 'risparmiate' },
  youPay: { en: 'You pay', de: 'Sie zahlen', sl: 'Plačate', hr: 'Plaćate', it: 'Pagate' },
  winWin: {
    en: 'You pay less, and we still receive more than through the platform. That is the whole idea.',
    de: 'Sie zahlen weniger — und wir erhalten trotzdem mehr als über die Plattform. Das ist die ganze Idee.',
    sl: 'Plačate manj, mi pa vseeno prejmemo več kot prek platforme. V tem je vsa ideja.',
    hr: 'Vi platite manje, a mi ipak primimo više nego preko platforme. U tome je cijela ideja.',
    it: 'Voi pagate meno e noi riceviamo comunque più che tramite il portale. L’idea è tutta qui.',
  },
  fine: {
    en: (d) => `Example numbers only. The discount shown is “up to ${d} %”; your real price depends on dates, apartment and length of stay — ask us for it.`,
    de: (d) => `Nur Beispielzahlen. Der Rabatt beträgt „bis zu ${d} %“; Ihr echter Preis hängt von Termin, Apartment und Aufenthaltsdauer ab — fragen Sie uns.`,
    sl: (d) => `Samo primer. Prikazani popust znaša »do ${d} %«; vaša dejanska cena je odvisna od termina, apartmaja in dolžine bivanja — povprašajte nas zanjo.`,
    hr: (d) => `Samo primjer. Prikazani popust iznosi „do ${d} %”; vaša stvarna cijena ovisi o terminu, apartmanu i duljini boravka — pitajte nas za nju.`,
    it: (d) => `Cifre puramente indicative. Lo sconto indicato è «fino al ${d} %»; il prezzo reale dipende da date, appartamento e durata del soggiorno: chiedetecelo.`,
  },
  fineExample: {
    en: 'Example numbers only. Your real price depends on dates, apartment and length of stay — ask us for it.',
    de: 'Nur Beispielzahlen. Ihr echter Preis hängt von Termin, Apartment und Aufenthaltsdauer ab — fragen Sie uns.',
    sl: 'Samo primer. Vaša dejanska cena je odvisna od termina, apartmaja in dolžine bivanja — povprašajte nas zanjo.',
    hr: 'Samo primjer. Vaša stvarna cijena ovisi o terminu, apartmanu i duljini boravka — pitajte nas za nju.',
    it: 'Cifre puramente indicative. Il prezzo reale dipende da date, appartamento e durata del soggiorno: chiedetecelo.',
  },
  askPrice: {
    en: 'No commission in the price, so ask us for your direct price.',
    de: 'Keine Provision im Preis — fragen Sie uns nach Ihrem Direktpreis.',
    sl: 'V ceni ni provizije, zato nas vprašajte za neposredno ceno.',
    hr: 'U cijeni nema provizije, pa nas pitajte za izravnu cijenu.',
    it: 'Nessuna commissione nel prezzo: chiedeteci il prezzo diretto.',
  },
  cheaper: {
    en: 'Lower than what you would pay on booking platforms — ask us for your direct price.',
    de: 'Günstiger als auf Buchungsplattformen — fragen Sie nach Ihrem Direktpreis.',
    sl: 'Nižja kot na platformah za rezervacije — povprašajte nas za neposredno ceno.',
    hr: 'Niža nego na platformama za rezervacije — pitajte nas za izravnu cijenu.',
    it: 'Più basso che sui portali di prenotazione: chiedeteci il prezzo diretto.',
  },
  promiseTitle: { en: 'One e-mail, a real answer', de: 'Eine E-Mail, eine echte Antwort', sl: 'En e-mail, pravi odgovor', hr: 'Jedan e-mail, pravi odgovor', it: 'Una e-mail, una vera risposta' },
  promiseText: {
    en: 'Tell us your dates and who is coming. We reply personally with availability and our best direct price — no account, no payment, no obligation.',
    de: 'Nennen Sie uns Termin und Personen. Wir antworten persönlich mit Verfügbarkeit und unserem besten Direktpreis — ohne Konto, ohne Zahlung, unverbindlich.',
    sl: 'Sporočite nam termin in kdo pride. Osebno vam odgovorimo z razpoložljivostjo in našo najboljšo neposredno ceno — brez registracije, brez plačila, brez obveznosti.',
    hr: 'Javite nam termin i tko dolazi. Osobno vam odgovaramo s dostupnošću i našom najboljom izravnom cijenom — bez registracije, bez plaćanja, bez obveze.',
    it: 'Diteci le date e chi viene. Vi rispondiamo di persona con la disponibilità e il nostro miglior prezzo diretto: niente registrazione, niente pagamenti, nessun impegno.',
  },
};

function benefits(ctx) {
  const d = ctx.site.directBooking;
  return [
    {
      icon: 'euro',
      title: { en: 'A better price', de: 'Ein besserer Preis', sl: 'Boljša cena', hr: 'Bolja cijena', it: 'Un prezzo migliore' },
      text: ownerValue(ctx, 'discount', { en: `Up to ${d.discountPercent} % below what you would pay on booking platforms.`, de: `Bis zu ${d.discountPercent} % unter dem Preis auf Buchungsplattformen.`, sl: `Do ${d.discountPercent} % ceneje kot na platformah za rezervacije.`, hr: `Do ${d.discountPercent} % jeftinije nego na platformama za rezervacije.`, it: `Fino al ${d.discountPercent} % in meno rispetto ai portali di prenotazione.` }, T.cheaper),
      todo: !isConfirmed('discount') && 'Confirm the direct-booking discount (site.js directBooking.discountPercent + confirmed.discount)',
    },
    { icon: 'chat', title: { en: 'Talk to the owners', de: 'Mit den Eigentümern sprechen', sl: 'Pogovorite se z lastniki', hr: 'Razgovarajte s vlasnicima', it: 'Parlate con i proprietari' }, text: { en: 'Ask anything before you book. You deal with the people who know the house.', de: 'Fragen Sie alles vor der Buchung — direkt bei den Menschen, die das Haus kennen.', sl: 'Pred rezervacijo vprašajte karkoli. Dogovarjate se z ljudmi, ki hišo poznajo.', hr: 'Prije rezervacije pitajte što god želite. Dogovarate se s ljudima koji poznaju kuću.', it: 'Chiedete tutto quello che volete prima di prenotare. Parlate con chi conosce la casa.' } },
    { icon: 'calendar', title: { en: 'Flexible arrival', de: 'Flexible Anreise', sl: 'Prilagodljiv prihod', hr: 'Fleksibilan dolazak', it: 'Arrivo flessibile' }, text: { en: 'Other arrival days, an early check-in, a late check-out: ask, and we’ll tell you honestly what’s possible.', de: 'Andere Anreisetage, früher Check-in, später Check-out: fragen Sie, wir sagen ehrlich, was geht.', sl: 'Drug dan prihoda, zgodnja prijava, pozna odjava: vprašajte in iskreno vam povemo, kaj je mogoče.', hr: 'Drugi dan dolaska, rana prijava, kasna odjava: pitajte i iskreno ćemo vam reći što je moguće.', it: 'Altri giorni di arrivo, check-in anticipato, check-out posticipato: chiedete e vi diremo sinceramente cosa è possibile.' } },
    { icon: 'pin', title: { en: 'Local tips', de: 'Tipps von hier', sl: 'Nasveti domačinov', hr: 'Savjeti domaćina', it: 'Consigli del posto' }, text: { en: 'Where to swim when the wind turns, which beach suits small children, where to eat in Nin.', de: 'Wo man bei Wind badet, welcher Strand für Kleinkinder passt, wo man in Nin isst.', sl: 'Kje se kopati, ko se veter obrne, katera plaža je primerna za majhne otroke, kje dobro jesti v Ninu.', hr: 'Gdje se kupati kad vjetar okrene, koja plaža odgovara maloj djeci, gdje dobro jesti u Ninu.', it: 'Dove fare il bagno quando gira il vento, quale spiaggia è adatta ai bambini piccoli, dove mangiare a Nin.' } },
    { icon: 'users', title: { en: 'Whole-house deals', de: 'Angebote fürs ganze Haus', sl: 'Ponudbe za celo hišo', hr: 'Ponude za cijelu kuću', it: 'Offerte per tutta la casa' }, text: { en: 'Coming as a big family or a team? Ask for all four apartments together.', de: 'Große Familie oder Team? Fragen Sie nach allen vier Apartments zusammen.', sl: 'Prihajate kot velika družina ali ekipa? Povprašajte za vse štiri apartmaje skupaj.', hr: 'Dolazite kao velika obitelj ili tim? Pitajte za sva četiri apartmana zajedno.', it: 'Arrivate come famiglia numerosa o come team? Chiedete tutti e quattro gli appartamenti insieme.' } },
    { icon: 'check', title: { en: 'No hidden fees', de: 'Keine versteckten Gebühren', sl: 'Brez skritih stroškov', hr: 'Bez skrivenih troškova', it: 'Nessun costo nascosto' }, text: { en: 'The price we quote is the price you pay; the local tourist tax is shown separately.', de: 'Der genannte Preis ist der Endpreis; die Kurtaxe wird separat ausgewiesen.', sl: 'Cena, ki vam jo ponudimo, je cena, ki jo plačate; turistična taksa je prikazana posebej.', hr: 'Cijena koju vam ponudimo cijena je koju plaćate; boravišna pristojba iskazana je zasebno.', it: 'Il prezzo che vi indichiamo è quello che pagate; la tassa di soggiorno è indicata a parte.' }, todo: 'Confirm how tourist tax is shown in quotes' },
  ];
}

function tr2(ctx, entry, ...args) {
  const fn = entry[ctx.lang] || entry.en;
  return typeof fn === 'function' ? fn(...args) : fn;
}

function calcHtml(ctx) {
  const [lo, hi] = ctx.site.directBooking.otaCommissionPercentRange;
  const mid = Math.round((lo + hi) / 2);
  const d = ctx.site.directBooking;
  const minNights = isConfirmed('minNights') ? d.minNights : 1;
  return `<aside class="direct-calc" aria-labelledby="direct-calc-title">
    <div class="direct-calc-head">
      <h3 id="direct-calc-title">${esc(ctx.t(T.calcTitle))}</h3>
      <span class="badge neutral">${icon('info', { size: 14 })} ${esc(ctx.t(T.illustration))}</span>
    </div>
    <form class="direct-calc-form" data-calc onsubmit="return false">
      <div class="dc-field">
        <label for="dc-nights">${esc(ctx.t(T.nights))}</label>
        <output for="dc-nights" data-out="nights">${Math.max(7, minNights)}</output>
        <input id="dc-nights" name="nights" type="range" min="${minNights}" max="21" value="${Math.max(7, minNights)}" />
      </div>
      <div class="dc-field">
        <label for="dc-rate">${esc(ctx.t(T.rate))}</label>
        <div class="dc-money"><input id="dc-rate" name="rate" type="number" min="20" max="2000" step="5" value="100" inputmode="numeric" /><span>€</span></div>
      </div>
      <div class="dc-field">
        <label for="dc-comm">${esc(ctx.t(T.commission))}</label>
        <output for="dc-comm" data-out="comm">${mid} %</output>
        <input id="dc-comm" name="comm" type="range" min="${lo}" max="${hi}" value="${mid}" />
      </div>
    </form>
    <div class="dc-bars" data-bars aria-live="polite"></div>
    <p class="dc-winwin" data-winwin${isConfirmed('discount') ? '' : ' hidden'}>${icon('check', { size: 18 })} <span>${esc(ctx.t(T.winWin))}</span></p>
    <p class="dc-fine">${esc(isConfirmed('discount') ? tr2(ctx, T.fine, d.discountPercent) : ctx.t(T.fineExample))} ${ownerTodo('Real seasonal prices (site.js sampleRates)')}</p>
  </aside>`;
}

function promiseHtml(ctx) {
  return `<aside class="direct-calc direct-promise">
    <span class="direct-promise-icon">${icon('mail', { size: 28 })}</span>
    <h3>${esc(ctx.t(T.promiseTitle))}</h3>
    <p>${esc(ctx.t(T.promiseText))}</p>
    <a class="btn btn-primary btn-lg" href="#inquiry">${esc(ctx.t('askDates'))} ${icon('arrow', { size: 18 })}</a>
  </aside>`;
}

function bar(label, total, segments, ctx, scale) {
  const segs = segments
    .map((s) => `<span class="dc-seg dc-seg-${s.kind}" style="width:${((s.value / scale) * 100).toFixed(2)}%" title="${esc(s.label)}: ${esc(euro(s.value, ctx.lang))}"></span>`)
    .join('');
  const legend = segments
    .map((s) => `<span class="dc-key"><i class="dc-dot dc-seg-${s.kind}"></i>${esc(s.label)} <b>${esc(euro(s.value, ctx.lang))}</b></span>`)
    .join('');
  return `<div class="dc-bar">
    <div class="dc-bar-head"><span>${esc(label)}</span><span>${esc(ctx.t(T.youPay))} <b>${esc(euro(total, ctx.lang))}</b></span></div>
    <div class="dc-track" role="img" aria-label="${esc(label)}: ${esc(legend.replace(/<[^>]+>/g, ''))}">${segs}</div>
    <div class="dc-legend">${legend}</div>
  </div>`;
}

function drawBars(el, ctx) {
  const form = el.querySelector('[data-calc]');
  if (!form) return;
  const nights = Number(form.nights.value);
  const rate = Math.max(0, Number(form.rate.value) || 0);
  const comm = Number(form.comm.value) / 100;
  // The discount is only applied once the owner has confirmed it; until then
  // the direct side shows no figures, only "ask us".
  const discount = isConfirmed('discount');
  const disc = discount ? ctx.site.directBooking.discountPercent / 100 : 0;
  el.querySelector('[data-out="nights"]').textContent = String(nights);
  el.querySelector('[data-out="comm"]').textContent = `${form.comm.value} %`;

  const platformTotal = nights * rate;
  const commission = platformTotal * comm;
  const directTotal = platformTotal * (1 - disc);
  const saving = platformTotal - directTotal;
  // "We still receive more" only holds while the discount is below the commission.
  el.querySelector('[data-winwin]').hidden = !(discount && disc < comm);
  const platform = bar(ctx.t(T.viaPlatform), platformTotal, [
    { kind: 'host', label: ctx.t(T.hostGets), value: platformTotal - commission },
    { kind: 'ota', label: ctx.t(T.platformGets), value: commission },
  ], ctx, platformTotal);
  const direct = discount
    ? bar(ctx.t(T.direct), directTotal, [
        { kind: 'host', label: ctx.t(T.hostGets), value: directTotal },
        { kind: 'save', label: ctx.t(T.youSave), value: saving },
      ], ctx, platformTotal)
    : `<div class="dc-bar"><div class="dc-bar-head"><span>${esc(ctx.t(T.direct))}</span></div><p class="dc-ask">${esc(ctx.t(T.askPrice))}</p></div>`;
  el.querySelector('[data-bars]').innerHTML = platform + direct;
}

export default {
  id: 'direct',
  nav: { en: 'Book direct', de: 'Direkt buchen', sl: 'Neposredno', hr: 'Izravno', it: 'Prenotazione diretta' },
  rerenderOn: ['priceCompare'],

  render(ctx) {
    const [lo, hi] = ctx.site.directBooking.otaCommissionPercentRange;
    const items = benefits(ctx)
      .map(
        (b) => `<li class="direct-benefit">
          <span class="direct-benefit-icon">${icon(b.icon, { size: 22 })}</span>
          <div><h3>${esc(ctx.t(b.title))}${b.todo ? ` ${ownerTodo(b.todo)}` : ''}</h3><p>${esc(ctx.t(b.text))}</p></div>
        </li>`,
      )
      .join('');
    return `<div class="container direct-grid">
      <div class="direct-intro">
        <div class="section-head">
          <p class="eyebrow">${icon('euro', { size: 16 })} ${esc(ctx.t(T.eyebrow))}</p>
          <h2>${esc(ctx.t(T.title))}</h2>
          <p class="lede">${esc(tr2(ctx, T.lede, lo, hi))}</p>
        </div>
        <ul class="direct-benefits" role="list">${items}</ul>
      </div>
      ${ctx.state.priceCompare ? calcHtml(ctx) : promiseHtml(ctx)}
    </div>`;
  },

  mount(el, ctx) {
    const form = el.querySelector('[data-calc]');
    if (!form) return;
    const onInput = () => drawBars(el, ctx);
    form.addEventListener('input', onInput);
    drawBars(el, ctx);
    return () => form.removeEventListener('input', onInput);
  },
};
