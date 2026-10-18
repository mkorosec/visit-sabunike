// Inquiry form. There is no backend: submitting builds a readable message and
// opens the guest's own e-mail app (or WhatsApp/Viber when the owner has
// configured them). Other sections prefill it via bus 'inquiry:prefill'.

import './inquiry.css';
import { APARTMENTS } from '../content/site.js';
import { esc, icon, monthName, prefersReducedMotion, scrollToSection, toast } from '../lib/util.js';
import { addressLine, contactChannels, isConfirmed, mapLinks, ownerTodo, ownerValue, plural } from './core-shared.js';

const DRAFT_KEY = 'visit-sabunike:inquiry-draft:v1';
const MAX_ADULTS = 16;
const MAX_CHILDREN = 10;

const T = {
  eyebrow: { en: 'Ask about dates', de: 'Termine anfragen', sl: 'Povpraševanje', hr: 'Upit', it: 'Richiesta' },
  title: { en: 'Tell us when — we’ll reply personally', de: 'Sagen Sie uns wann — wir antworten persönlich', sl: 'Povejte nam, kdaj — odgovorimo osebno', hr: 'Recite nam kada — odgovaramo osobno', it: 'Diteci quando — rispondiamo di persona' },
  lede: { en: 'No account, no payment, no obligation. Your message opens in your own e-mail app, ready to send.', de: 'Kein Konto, keine Zahlung, unverbindlich. Ihre Nachricht öffnet sich fertig in Ihrem E-Mail-Programm.', sl: 'Brez registracije, brez plačila, brez obveznosti. Sporočilo se odpre v vašem e-poštnem programu, pripravljeno za pošiljanje.', hr: 'Bez registracije, bez plaćanja, bez obveze. Poruka se otvara u vašem programu za e-poštu, spremna za slanje.', it: 'Niente registrazione, niente pagamenti, nessun impegno. Il messaggio si apre nella vostra app di posta, pronto da inviare.' },
  when: { en: 'When', de: 'Wann', sl: 'Kdaj', hr: 'Kada', it: 'Quando' },
  who: { en: 'Who is coming', de: 'Wer kommt', sl: 'Kdo pride', hr: 'Tko dolazi', it: 'Chi viene' },
  where: { en: 'Where to stay', de: 'Welche Unterkunft', sl: 'Kje bivati', hr: 'Smještaj', it: 'Dove alloggiare' },
  why: { en: 'What brings you here', de: 'Was führt Sie her', sl: 'Kaj vas pripelje', hr: 'Što vas dovodi', it: 'Cosa vi porta qui' },
  you: { en: 'About you', de: 'Über Sie', sl: 'O vas', hr: 'O vama', it: 'Su di voi' },
  arrival: { en: 'Arrival', de: 'Anreise', sl: 'Prihod', hr: 'Dolazak', it: 'Arrivo' },
  departure: { en: 'Departure', de: 'Abreise', sl: 'Odhod', hr: 'Odlazak', it: 'Partenza' },
  pickDates: { en: 'Pick your dates', de: 'Termine wählen', sl: 'Izberite datume', hr: 'Odaberite datume', it: 'Scegliete le date' },
  flexMonth: { en: 'Dates flexible? Preferred month', de: 'Flexibel? Bevorzugter Monat', sl: 'Prilagodljivi? Želeni mesec', hr: 'Fleksibilni? Željeni mjesec', it: 'Date flessibili? Mese preferito' },
  noMonth: { en: '— not sure yet —', de: '— noch offen —', sl: '— še ne vem —', hr: '— još ne znam —', it: '— non so ancora —' },
  childAge: { en: 'Age of child', de: 'Alter Kind', sl: 'Starost otroka', hr: 'Dob djeteta', it: 'Età del bambino' },
  ages: { en: 'ages', de: 'Alter', sl: 'starost', hr: 'dob', it: 'età' },
  agePick: { en: 'Age…', de: 'Alter…', sl: 'Starost…', hr: 'Dob…', it: 'Età…' },
  under1: { en: 'under 1', de: 'unter 1', sl: 'manj kot 1 leto', hr: 'manje od 1 godine', it: 'meno di 1 anno' },
  fewer: { en: 'Fewer', de: 'Weniger', sl: 'Manj', hr: 'Manje', it: 'Meno' },
  more: { en: 'More', de: 'Mehr', sl: 'Več', hr: 'Više', it: 'Più' },
  anyApt: { en: 'Any apartment', de: 'Egal welches', sl: 'Kateri koli', hr: 'Bilo koji', it: 'Qualsiasi' },
  anyAptMeta: { en: 'We suggest the best fit', de: 'Wir schlagen das passende vor', sl: 'Predlagamo najboljšega', hr: 'Predložit ćemo najbolji', it: 'Vi suggeriamo il migliore' },
  house: { en: 'Whole house', de: 'Ganzes Haus', sl: 'Cela hiša', hr: 'Cijela kuća', it: 'Tutta la casa' },
  houseMeta: { en: 'All four apartments', de: 'Alle vier Apartments', sl: 'Vsi štirje apartmaji', hr: 'Sva četiri apartmana', it: 'Tutti e quattro gli appartamenti' },
  ground: { en: 'ground floor', de: 'Erdgeschoss', sl: 'pritličje', hr: 'prizemlje', it: 'piano terra' },
  upper: { en: 'upstairs', de: 'Obergeschoss', sl: 'nadstropje', hr: 'kat', it: 'piano superiore' },
  bikes: { en: 'Bikes you’re bringing', de: 'Mitgebrachte Fahrräder', sl: 'Število koles', hr: 'Broj bicikala', it: 'Bici al seguito' },
  company: { en: 'Company name', de: 'Firmenname', sl: 'Ime podjetja', hr: 'Naziv tvrtke', it: 'Azienda' },
  r1: { en: 'We need a company invoice (R1 in Croatia)', de: 'Wir brauchen eine Firmenrechnung (R1)', sl: 'Potrebujemo račun za podjetje (R1)', hr: 'Trebamo R1 račun', it: 'Ci serve una fattura aziendale (R1)' },
  name: { en: 'Your name', de: 'Ihr Name', sl: 'Vaše ime', hr: 'Vaše ime', it: 'Il vostro nome' },
  message: { en: 'Anything else we should know?', de: 'Noch etwas, das wir wissen sollten?', sl: 'Še kaj, kar bi morali vedeti?', hr: 'Još nešto što trebamo znati?', it: 'C’è altro che dovremmo sapere?' },
  messagePh: { en: 'Arrival time, ages, special wishes, questions…', de: 'Ankunftszeit, Wünsche, Fragen…', sl: 'Čas prihoda, starost otrok, posebne želje, vprašanja…', hr: 'Vrijeme dolaska, dob djece, posebne želje, pitanja…', it: 'Orario di arrivo, età dei bambini, richieste particolari, domande…' },
  replyVia: { en: 'Reply to me via', de: 'Antwort bitte per', sl: 'Odgovor prek', hr: 'Odgovor putem', it: 'Rispondetemi via' },
  send: { en: 'Send inquiry', de: 'Anfrage senden', sl: 'Pošlji povpraševanje', hr: 'Pošalji upit', it: 'Invia richiesta' },
  copy: { en: 'Copy message', de: 'Nachricht kopieren', sl: 'Kopiraj sporočilo', hr: 'Kopiraj poruku', it: 'Copia messaggio' },
  copied: { en: 'Message copied', de: 'Nachricht kopiert', sl: 'Sporočilo kopirano', hr: 'Poruka kopirana', it: 'Messaggio copiato' },
  clear: { en: 'Clear form', de: 'Formular leeren', sl: 'Počisti', hr: 'Očisti', it: 'Svuota' },
  draftNote: { en: 'Your draft is saved in this browser only.', de: 'Ihr Entwurf bleibt nur in diesem Browser gespeichert.', sl: 'Osnutek je shranjen samo v tem brskalniku.', hr: 'Skica je spremljena samo u ovom pregledniku.', it: 'La bozza resta solo in questo browser.' },
  readyTitle: { en: 'Your message is ready', de: 'Ihre Nachricht ist fertig', sl: 'Sporočilo je pripravljeno', hr: 'Poruka je spremna', it: 'Il messaggio è pronto' },
  readyText: { en: 'If your e-mail app did not open, copy the text below and send it to', de: 'Falls sich Ihr E-Mail-Programm nicht geöffnet hat, kopieren Sie den Text und senden Sie ihn an', sl: 'Če se e-poštni program ni odprl, kopirajte besedilo in ga pošljite na', hr: 'Ako se e-mail nije otvorio, kopirajte tekst i pošaljite ga na', it: "Se l'app e-mail non si è aperta, copiate il testo e inviatelo a" },
  openAgain: { en: 'Open again', de: 'Erneut öffnen', sl: 'Odpri znova', hr: 'Otvori ponovno', it: 'Riapri' },
  required: { en: 'required', de: 'Pflichtfeld', sl: 'obvezno', hr: 'obavezno', it: 'obbligatorio' },
  errName: { en: 'Please tell us your name.', de: 'Bitte nennen Sie Ihren Namen.', sl: 'Vpišite ime.', hr: 'Upišite ime.', it: 'Inserite il nome.' },
  errDates: { en: 'Departure must be after arrival.', de: 'Die Abreise muss nach der Anreise liegen.', sl: 'Odhod mora biti po prihodu.', hr: 'Odlazak mora biti nakon dolaska.', it: "La partenza dev'essere dopo l'arrivo." },
  errWhen: { en: 'Pick dates, or a preferred month if you are flexible.', de: 'Bitte Termine oder einen Wunschmonat wählen.', sl: 'Izberite datume ali, če ste prilagodljivi, želeni mesec.', hr: 'Odaberite datume ili, ako ste fleksibilni, željeni mjesec.', it: 'Scegliete le date o, se siete flessibili, un mese preferito.' },
  fixThese: { en: 'Please check:', de: 'Bitte prüfen:', sl: 'Preverite:', hr: 'Provjerite:', it: 'Controllate:' },
  nextTitle: { en: 'What happens next', de: 'Wie es weitergeht', sl: 'Kaj sledi', hr: 'Što slijedi', it: 'Cosa succede dopo' },
  step1: { en: 'You send the request', de: 'Sie senden die Anfrage', sl: 'Pošljete povpraševanje', hr: 'Pošaljete upit', it: 'Inviate la richiesta' },
  step1t: { en: 'Everything is filled in for you. Nothing is booked or paid yet.', de: 'Alles ist vorausgefüllt. Noch ist nichts gebucht oder bezahlt.', sl: 'Vse je že izpolnjeno. Ničesar še niste rezervirali ali plačali.', hr: 'Sve je već ispunjeno. Još ništa nije rezervirano ni plaćeno.', it: 'È tutto già compilato. Non avete ancora prenotato né pagato nulla.' },
  step2: { en: 'We reply personally', de: 'Wir antworten persönlich', sl: 'Odgovorimo osebno', hr: 'Odgovaramo osobno', it: 'Rispondiamo di persona' },
  step2t: { en: 'with availability and our best direct price for your dates.', de: 'mit Verfügbarkeit und unserem besten Direktpreis.', sl: 'z razpoložljivostjo in našo najboljšo neposredno ceno za vaš termin.', hr: 's dostupnošću i našom najboljom izravnom cijenom za vaš termin.', it: 'con la disponibilità e il nostro miglior prezzo diretto per le vostre date.' },
  step3: { en: 'You secure the dates', de: 'Sie sichern die Termine', sl: 'Potrdite termin', hr: 'Potvrdite termin', it: 'Confermate le date' },
  step3t: {
    en: (d) => `A deposit of ${d} % confirms the booking. No payment before you say yes.`,
    de: (d) => `Eine Anzahlung von ${d} % bestätigt die Buchung. Keine Zahlung, bevor Sie zusagen.`,
    sl: (d) => `Rezervacijo potrdi predujem v višini ${d} %. Nič ne plačate, dokler ne rečete da.`,
    hr: (d) => `Rezervaciju potvrđuje predujam od ${d} %. Ništa ne plaćate dok ne pristanete.`,
    it: (d) => `Un acconto del ${d} % conferma la prenotazione. Nessun pagamento prima del vostro sì.`,
  },
  step3open: { en: 'We tell you in writing how to secure the dates. No payment before you say yes.', de: 'Wir sagen Ihnen schriftlich, wie Sie den Termin sichern. Keine Zahlung, bevor Sie zusagen.', sl: 'Pisno vam sporočimo, kako potrdite termin. Nič ne plačate, dokler ne rečete da.', hr: 'Pisanim putem javit ćemo vam kako potvrditi termin. Ništa ne plaćate dok ne pristanete.', it: 'Vi spieghiamo per iscritto come confermare le date. Nessun pagamento prima del vostro sì.' },
  step4: { en: 'You arrive', de: 'Sie reisen an', sl: 'Prispete', hr: 'Stižete', it: 'Arrivate' },
  step4open: { en: 'We confirm check-in and check-out times with your booking. Free parking inside the gate.', de: 'Check-in- und Check-out-Zeiten bestätigen wir mit Ihrer Buchung. Kostenloser Parkplatz hinter dem Tor.', sl: 'Čas prihoda in odhoda potrdimo skupaj z rezervacijo. Brezplačno parkiranje za vrati.', hr: 'Vrijeme prijave i odjave potvrđujemo uz rezervaciju. Besplatan parking iza vrata.', it: 'Gli orari di check-in e check-out ve li confermiamo con la prenotazione. Parcheggio gratuito dentro il cancello.' },
  step4t: {
    en: (i, o) => `Check-in from ${i}, check-out by ${o}. Free parking inside the gate.`,
    de: (i, o) => `Check-in ab ${i}, Check-out bis ${o}. Kostenloser Parkplatz hinter dem Tor.`,
    sl: (i, o) => `Prihod od ${i}, odhod do ${o}. Brezplačno parkiranje za vrati.`,
    hr: (i, o) => `Prijava od ${i}, odjava do ${o}. Besplatan parking iza vrata.`,
    it: (i, o) => `Check-in dalle ${i}, check-out entro le ${o}. Parcheggio gratuito dentro il cancello.`,
  },
  findUs: { en: 'Find us', de: 'So finden Sie uns', sl: 'Kje smo', hr: 'Gdje smo', it: 'Dove siamo' },
  directions: { en: 'Directions', de: 'Route', sl: 'Navodila', hr: 'Upute', it: 'Indicazioni' },
  weSpeak: { en: 'We speak', de: 'Wir sprechen', sl: 'Govorimo', hr: 'Govorimo', it: 'Parliamo' },
  prefMonth: { en: 'Preferred month', de: 'Wunschmonat', sl: 'Želeni mesec', hr: 'Željeni mjesec', it: 'Mese preferito' },
  guests: { en: 'Guests', de: 'Gäste', sl: 'Gosti', hr: 'Gosti', it: 'Ospiti' },
  apartment: { en: 'Apartment', de: 'Apartment', sl: 'Apartma', hr: 'Apartman', it: 'Appartamento' },
  purpose: { en: 'Purpose', de: 'Anlass', sl: 'Namen', hr: 'Svrha', it: 'Motivo' },
  hello: { en: 'Hello,', de: 'Guten Tag,', sl: 'Pozdravljeni,', hr: 'Poštovani,', it: 'Buongiorno,' },
  // Continues the letter after the greeting's comma, hence lower case outside English.
  intro: {
    en: (b) => `I would like to ask about a stay at ${b}.`,
    de: (b) => `ich interessiere mich für einen Aufenthalt bei ${b}.`,
    sl: (b) => `zanima me bivanje v nastanitvi ${b}.`,
    hr: (b) => `zanima me boravak u objektu ${b}.`,
    it: (b) => `vorrei informazioni per un soggiorno presso ${b}.`,
  },
  thanks: { en: 'Thank you, ', de: 'Vielen Dank, ', sl: 'Hvala in lep pozdrav, ', hr: 'Hvala i lijep pozdrav, ', it: 'Grazie e cordiali saluti, ' },
  subject: { en: 'Inquiry', de: 'Anfrage', sl: 'Povpraševanje', hr: 'Upit', it: 'Richiesta' },
  osm: { en: '© OpenStreetMap contributors', de: '© OpenStreetMap-Mitwirkende', sl: '© sodelavci OpenStreetMap', hr: '© suradnici OpenStreetMapa', it: '© contributori di OpenStreetMap' },
};

// Counted nouns, by Intl.PluralRules category (see plural() in core-shared.js).
const N = {
  nights: { en: { one: 'night', other: 'nights' }, de: { one: 'Nacht', other: 'Nächte' }, sl: { one: 'noč', two: 'noči', few: 'noči', other: 'noči' }, hr: { one: 'noćenje', few: 'noćenja', other: 'noćenja' }, it: { one: 'notte', other: 'notti' } },
  adults: { en: { one: 'adult', other: 'adults' }, de: { one: 'Erwachsener', other: 'Erwachsene' }, sl: { one: 'odrasla oseba', two: 'odrasli osebi', few: 'odrasle osebe', other: 'odraslih oseb' }, hr: { one: 'odrasla osoba', few: 'odrasle osobe', other: 'odraslih osoba' }, it: { one: 'adulto', other: 'adulti' } },
  children: { en: { one: 'child', other: 'children' }, de: { one: 'Kind', other: 'Kinder' }, sl: { one: 'otrok', two: 'otroka', few: 'otroci', other: 'otrok' }, hr: { one: 'dijete', few: 'djeteta', other: 'djece' }, it: { one: 'bambino', other: 'bambini' } },
  guests: { en: { one: 'guest', other: 'guests' }, de: { one: 'Gast', other: 'Gäste' }, sl: { one: 'gost', two: 'gosta', few: 'gostje', other: 'gostov' }, hr: { one: 'gost', few: 'gosta', other: 'gostiju' }, it: { one: 'ospite', other: 'ospiti' } },
  bedrooms: { en: { one: 'bedroom', other: 'bedrooms' }, de: { one: 'Schlafzimmer', other: 'Schlafzimmer' }, sl: { one: 'spalnica', two: 'spalnici', few: 'spalnice', other: 'spalnic' }, hr: { one: 'spavaća soba', few: 'spavaće sobe', other: 'spavaćih soba' }, it: { one: 'camera', other: 'camere' } },
  years: { en: { one: 'year', other: 'years' }, de: { one: 'Jahr', other: 'Jahre' }, sl: { one: 'leto', two: 'leti', few: 'leta', other: 'let' }, hr: { one: 'godina', few: 'godine', other: 'godina' }, it: { one: 'anno', other: 'anni' } },
};

export const PURPOSES = [
  { id: 'holiday', icon: 'sun', label: { en: 'Holiday', de: 'Urlaub', sl: 'Počitnice', hr: 'Odmor', it: 'Vacanza' } },
  { id: 'family', icon: 'users', label: { en: 'Family holiday', de: 'Familienurlaub', sl: 'Družinske počitnice', hr: 'Obiteljski odmor', it: 'Vacanza in famiglia' } },
  { id: 'cycling', icon: 'bike', label: { en: 'Cycling', de: 'Radfahren', sl: 'Kolesarjenje', hr: 'Biciklizam', it: 'Bici' } },
  { id: 'retreat', icon: 'laptop', label: { en: 'Company retreat', de: 'Firmen-Retreat', sl: 'Poslovni retreat', hr: 'Poslovni retreat', it: 'Ritiro aziendale' } },
  { id: 'kite', icon: 'kite', label: { en: 'Kitesurfing', de: 'Kitesurfen', sl: 'Kajtanje', hr: 'Kitesurfing', it: 'Kitesurf' } },
  { id: 'remote', icon: 'wifi', label: { en: 'Remote work', de: 'Remote-Arbeit', sl: 'Delo na daljavo', hr: 'Rad na daljinu', it: 'Lavoro da remoto' } },
  { id: 'other', icon: 'star', label: { en: 'Something else', de: 'Etwas anderes', sl: 'Drugo', hr: 'Nešto drugo', it: 'Altro' } },
];

function tf(ctx, entry, ...args) {
  const v = entry[ctx.lang] || entry.en;
  return typeof v === 'function' ? v(...args) : v;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

// --- render -----------------------------------------------------------------

function stepper(ctx, name, label, value, min, max) {
  return `<div class="inq-stepper">
    <label for="inq-${name}">${esc(label)}</label>
    <div class="inq-stepper-ctl">
      <button type="button" class="inq-step-btn" data-step="${name}" data-delta="-1" aria-label="${esc(`${ctx.t(T.fewer)}: ${label}`)}">−</button>
      <input id="inq-${name}" name="${name}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${value}" />
      <button type="button" class="inq-step-btn" data-step="${name}" data-delta="1" aria-label="${esc(`${ctx.t(T.more)}: ${label}`)}">+</button>
    </div>
  </div>`;
}

function aptMeta(ctx, a) {
  const parts = [];
  if (a.areaM2) parts.push(`${a.areaM2} m²`);
  if (a.bedrooms) parts.push(plural(ctx.lang, a.bedrooms, N.bedrooms));
  parts.push(ctx.t(a.floor === 'ground' ? T.ground : T.upper));
  return parts.join(' · ');
}

function apartmentsHtml(ctx) {
  const options = [
    { id: 'any', name: ctx.t(T.anyApt), meta: ctx.t(T.anyAptMeta), icon: 'star' },
    ...APARTMENTS.map((a) => ({ id: a.id, name: ctx.t(a.name), meta: aptMeta(ctx, a), color: a.color })),
    { id: 'house', name: ctx.t(T.house), meta: ctx.t(T.houseMeta), icon: 'users' },
  ];
  // Whole-house audiences (retreats, reunions, …) preset 'house'.
  const preset = options.some((o) => o.id === ctx.audience.inquiry?.apartment) ? ctx.audience.inquiry.apartment : 'any';
  return options
    .map(
      (o) => `<label class="inq-apt">
        <input type="radio" name="apartment" value="${o.id}" ${o.id === preset ? 'checked' : ''} />
        <span class="inq-apt-card">
          ${o.color ? `<i class="inq-apt-swatch" style="background:${o.color}" aria-hidden="true"></i>` : `<span class="inq-apt-icon">${icon(o.icon, { size: 18 })}</span>`}
          <strong>${esc(o.name)}</strong>
          <small>${esc(o.meta)}</small>
        </span>
      </label>`,
    )
    .join('');
}

function purposeHtml(ctx) {
  const preset = PURPOSES.some((p) => p.id === ctx.audience.inquiry?.purpose) ? ctx.audience.inquiry.purpose : 'holiday';
  return PURPOSES.map(
    (p) => `<label class="inq-chip">
      <input type="radio" name="purpose" value="${p.id}" ${p.id === preset ? 'checked' : ''} />
      <span>${icon(p.icon, { size: 16 })} ${esc(ctx.t(p.label))}</span>
    </label>`,
  ).join('');
}

function channelHtml(ctx) {
  const list = contactChannels();
  if (list.length < 2) return '<input type="hidden" name="channel" value="email" />';
  return `<fieldset class="inq-sub">
    <legend class="label">${esc(ctx.t(T.replyVia))}</legend>
    <div class="chips">${list
      .map(
        (c, i) => `<label class="inq-chip"><input type="radio" name="channel" value="${c.id}" ${i === 0 ? 'checked' : ''} /><span>${icon(c.icon, { size: 16 })} ${esc(c.label)}</span></label>`,
      )
      .join('')}</div>
  </fieldset>`;
}

function monthOptions(ctx) {
  const opts = [`<option value="0">${esc(ctx.t(T.noMonth))}</option>`];
  for (let m = 1; m <= 12; m++) opts.push(`<option value="${m}" ${ctx.state.month === m ? 'selected' : ''}>${esc(monthName(m, ctx.lang, true))}</option>`);
  return opts.join('');
}

function legend(n, text) {
  return `<legend><span class="inq-num" aria-hidden="true">${n}</span>${esc(text)}</legend>`;
}

function formHtml(ctx) {
  const today = todayIso();
  return `<form class="inq-form" data-form novalidate aria-describedby="inq-draft-note">
    <fieldset class="inq-group">
      ${legend(1, ctx.t(T.when))}
      <div class="inq-dates">
        <div class="field"><label for="inq-arrival">${esc(ctx.t(T.arrival))}</label><input id="inq-arrival" name="arrival" type="date" min="${today}" /></div>
        <div class="field"><label for="inq-departure">${esc(ctx.t(T.departure))}</label><input id="inq-departure" name="departure" type="date" min="${today}" /></div>
        <p class="inq-nights" data-nights aria-live="polite">${icon('calendar', { size: 16 })} <span>${esc(ctx.t(T.pickDates))}</span></p>
      </div>
      <div class="field inq-month">
        <label for="inq-month">${esc(ctx.t(T.flexMonth))}</label>
        <select id="inq-month" name="month">${monthOptions(ctx)}</select>
      </div>
    </fieldset>

    <fieldset class="inq-group">
      ${legend(2, ctx.t(T.who))}
      <div class="inq-people">
        ${stepper(ctx, 'adults', ctx.t('adults'), 2, 1, MAX_ADULTS)}
        ${stepper(ctx, 'children', ctx.t('children'), 0, 0, MAX_CHILDREN)}
      </div>
      <div class="inq-ages" data-ages></div>
    </fieldset>

    <fieldset class="inq-group">
      ${legend(3, ctx.t(T.where))}
      <div class="inq-apts">${apartmentsHtml(ctx)}</div>
    </fieldset>

    <fieldset class="inq-group">
      ${legend(4, ctx.t(T.why))}
      <div class="chips inq-purposes">${purposeHtml(ctx)}</div>
      <div class="field inq-cond" data-show-for="cycling" hidden>
        <label for="inq-bikes">${esc(ctx.t(T.bikes))}</label>
        <input id="inq-bikes" name="bikes" type="number" min="0" max="30" value="0" inputmode="numeric" class="inq-short" />
      </div>
      <div class="inq-cond inq-company" data-show-for="retreat" hidden>
        <div class="field"><label for="inq-company">${esc(ctx.t(T.company))}</label><input id="inq-company" name="company" type="text" autocomplete="organization" /></div>
        <label class="inq-check"><input type="checkbox" name="r1" value="yes" /> <span>${esc(ctx.t(T.r1))}</span></label>
      </div>
    </fieldset>

    <fieldset class="inq-group">
      ${legend(5, ctx.t(T.you))}
      <div class="field"><label for="inq-name">${esc(ctx.t(T.name))} <span class="muted">(${esc(ctx.t(T.required))})</span></label><input id="inq-name" name="name" type="text" autocomplete="name" required /></div>
      <div class="field"><label for="inq-message">${esc(ctx.t(T.message))}</label><textarea id="inq-message" name="message" rows="4" placeholder="${esc(ctx.t(ctx.audience.inquiry?.placeholder || T.messagePh))}"></textarea></div>
      ${channelHtml(ctx)}
    </fieldset>

    <div class="inq-errors" data-errors role="alert" hidden></div>
    <div class="inq-actions">
      <button type="submit" class="btn btn-primary btn-lg">${icon('mail', { size: 18 })} ${esc(ctx.t(T.send))}</button>
      <button type="button" class="btn btn-lg" data-copy>${esc(ctx.t(T.copy))}</button>
      <button type="button" class="btn btn-ghost" data-clear>${esc(ctx.t(T.clear))}</button>
    </div>
    <p class="inq-draft-note" id="inq-draft-note">${icon('info', { size: 14 })} ${esc(ctx.t(T.draftNote))}</p>
    <div class="inq-ready" data-ready hidden tabindex="-1">
      <h3>${icon('check', { size: 20 })} ${esc(ctx.t(T.readyTitle))}</h3>
      <p>${esc(ctx.t(T.readyText))} <a href="mailto:${esc(ctx.site.contact.email)}">${esc(ctx.site.contact.email)}</a>.</p>
      <pre data-preview></pre>
      <div class="row"><a class="btn btn-primary" data-open href="#">${esc(ctx.t(T.openAgain))}</a><button type="button" class="btn" data-copy>${esc(ctx.t(T.copy))}</button></div>
    </div>
  </form>`;
}

// A small static map from three map tiles, centred on the house. No JS map
// library needed; the full maps live elsewhere on the page.
function staticMap(ctx) {
  const z = 15;
  const { lat, lon } = ctx.site.location;
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  const tx0 = Math.floor(x) - 1;
  const ty0 = Math.floor(y) - 1;
  const px = Math.round((x - tx0) * 256);
  const py = Math.round((y - ty0) * 256);
  const tiles = [];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      tiles.push(`<img src="https://tile.openstreetmap.org/${z}/${tx0 + i}/${ty0 + j}.png" alt="" width="256" height="256" loading="lazy" style="left:${i * 256}px;top:${j * 256}px" />`);
    }
  }
  const links = mapLinks();
  return `<a class="inq-map" href="${esc(links.google)}" target="_blank" rel="noopener" aria-label="${esc(addressLine(ctx.lang))} — Google Maps">
    <span class="inq-map-tiles" style="left:calc(50% - ${px}px);top:calc(50% - ${py}px)" aria-hidden="true">${tiles.join('')}</span>
    <span class="inq-map-pin" aria-hidden="true">${icon('pin', { size: 34 })}</span>
    <span class="inq-map-attr">${esc(ctx.t(T.osm))}</span>
  </a>`;
}

function asideHtml(ctx) {
  const d = ctx.site.directBooking;
  const c = ctx.site.contact;
  const links = mapLinks();
  const { lat, lon } = ctx.site.location;
  const steps = [
    [ctx.t(T.step1), ctx.t(T.step1t), ''],
    [ctx.t(T.step2), ownerValue(ctx, 'replyTime', `${ctx.t('replyIn24h')} ${ctx.t(T.step2t)}`, ctx.t(T.step2t)), isConfirmed('replyTime') ? '' : ownerTodo('Confirm reply time')],
    [ctx.t(T.step3), ownerValue(ctx, 'deposit', tf(ctx, T.step3t, d.depositPercent), ctx.t(T.step3open)), isConfirmed('deposit') ? '' : ownerTodo('Confirm deposit % and payment method')],
    [ctx.t(T.step4), ownerValue(ctx, 'checkIn', tf(ctx, T.step4t, d.checkIn, d.checkOut), ctx.t(T.step4open)), isConfirmed('checkIn') ? '' : ownerTodo('Confirm check-in/out times')],
  ];
  return `<aside class="inq-aside">
    <div class="inq-card">
      <h3>${esc(ctx.t(T.nextTitle))}</h3>
      <ol class="inq-steps">${steps.map(([h, p, todo]) => `<li><strong>${esc(h)}</strong> ${todo}<span class="inq-step-text">${esc(p)}</span></li>`).join('')}</ol>
    </div>
    <div class="inq-card inq-contact">
      <h3>${esc(ctx.t(T.findUs))}</h3>
      ${staticMap(ctx)}
      <address>
        <strong>${esc(ctx.brand)}</strong><br />${esc(ctx.site.address.street)}<br />${esc(`${ctx.site.address.postcode} ${ctx.site.address.place} (${ctx.site.address.municipality})`)}<br />${esc(`${ctx.t(ctx.site.address.region)}, ${ctx.t(ctx.site.address.country)}`)}
      </address>
      <div class="inq-links">
        <a href="${esc(links.google)}" target="_blank" rel="noopener">Google Maps</a>
        <a href="${esc(links.osm)}" target="_blank" rel="noopener">OpenStreetMap</a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener">${esc(ctx.t(T.directions))}</a>
      </div>
      <ul class="inq-contact-list" role="list">
        <li>${icon('mail', { size: 18 })} <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
        ${c.phoneDisplay ? `<li>${icon('chat', { size: 18 })} <a href="tel:${esc(c.phoneDisplay.replace(/\s+/g, ''))}">${esc(c.phoneDisplay)}</a></li>` : ''}
        ${c.languages?.length ? `<li>${icon('users', { size: 18 })} <span>${esc(ctx.t(T.weSpeak))}: ${esc(c.languages.map((code) => new Intl.DisplayNames([ctx.lang], { type: 'language' }).of(code)).join(', '))} ${ownerTodo('Confirm languages')}</span></li>` : ''}
      </ul>
    </div>
  </aside>`;
}

// --- behaviour ----------------------------------------------------------------

function readForm(form) {
  const data = {};
  for (const [k, v] of new FormData(form)) data[k] = v;
  data.r1 = form.elements.r1.checked;
  return data;
}

function writeForm(form, data) {
  for (const [k, v] of Object.entries(data)) {
    const field = form.elements[k];
    if (!field) continue;
    if (field instanceof RadioNodeList) {
      for (const r of field) r.checked = r.value === String(v);
    } else if (field.type === 'checkbox') field.checked = !!v;
    else field.value = v;
  }
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* storage blocked: the form still works */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function nightsBetween(a, b) {
  if (!a || !b) return null;
  const diff = (new Date(b) - new Date(a)) / 86400000;
  return Number.isFinite(diff) ? Math.round(diff) : null;
}

function renderAges(form, ctx, keep = {}) {
  const box = form.querySelector('[data-ages]');
  const count = Math.max(0, Math.min(MAX_CHILDREN, Number(form.elements.children.value) || 0));
  const current = { ...keep };
  for (const sel of box.querySelectorAll('select')) current[sel.name] = sel.value;
  const options = (sel) =>
    `<option value="">${esc(ctx.t(T.agePick))}</option>` +
    Array.from({ length: 18 }, (_, a) => `<option value="${a}" ${String(a) === String(sel) ? 'selected' : ''}>${esc(a === 0 ? ctx.t(T.under1) : plural(ctx.lang, a, N.years))}</option>`).join('');
  box.innerHTML = Array.from({ length: count }, (_, i) => {
    const name = `age${i}`;
    return `<div class="field"><label for="inq-${name}">${esc(ctx.t(T.childAge))} ${i + 1}</label><select id="inq-${name}" name="${name}">${options(current[name] ?? '')}</select></div>`;
  }).join('');
}

function syncConditional(form) {
  const purpose = form.elements.purpose.value;
  for (const el of form.querySelectorAll('[data-show-for]')) el.hidden = el.dataset.showFor !== purpose;
}

function syncNights(form, ctx) {
  const out = form.querySelector('[data-nights] span');
  if (form.elements.arrival.value) form.elements.departure.min = form.elements.arrival.value;
  const n = nightsBetween(form.elements.arrival.value, form.elements.departure.value);
  out.textContent = n > 0 ? plural(ctx.lang, n, N.nights) : ctx.t(T.pickDates);
  form.querySelector('[data-nights]').classList.toggle('is-set', n > 0);
}

function fmtDate(iso, lang) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function buildMessage(data, ctx) {
  const lines = [ctx.t(T.hello), '', tf(ctx, T.intro, ctx.brand), ''];
  const nights = nightsBetween(data.arrival, data.departure);
  if (data.arrival) lines.push(`${ctx.t(T.arrival)}: ${fmtDate(data.arrival, ctx.lang)}`);
  if (data.departure) lines.push(`${ctx.t(T.departure)}: ${fmtDate(data.departure, ctx.lang)}${nights > 0 ? ` (${plural(ctx.lang, nights, N.nights)})` : ''}`);
  if (Number(data.month) && !(data.arrival && data.departure)) lines.push(`${ctx.t(T.prefMonth)}: ${monthName(Number(data.month), ctx.lang, true)}`);
  const kids = Number(data.children) || 0;
  const ages = Array.from({ length: kids }, (_, i) => data[`age${i}`]).filter((a) => a !== '' && a != null);
  const adults = Number(data.adults) || 0;
  lines.push(`${ctx.t(T.guests)}: ${plural(ctx.lang, adults, N.adults)}${kids ? `, ${plural(ctx.lang, kids, N.children)}${ages.length ? ` (${ctx.t(T.ages)} ${ages.join(', ')})` : ''}` : ''}`);
  const apt = data.apartment === 'house' ? ctx.t(T.house) : data.apartment === 'any' ? ctx.t(T.anyApt) : ctx.t(APARTMENTS.find((a) => a.id === data.apartment)?.name);
  lines.push(`${ctx.t(T.apartment)}: ${apt}`);
  const purpose = PURPOSES.find((p) => p.id === data.purpose);
  if (purpose) lines.push(`${ctx.t(T.purpose)}: ${ctx.t(purpose.label)}`);
  if (data.purpose === 'cycling' && Number(data.bikes)) lines.push(`${ctx.t(T.bikes)}: ${data.bikes}`);
  if (data.purpose === 'retreat') {
    if (data.company) lines.push(`${ctx.t(T.company)}: ${data.company}`);
    if (data.r1) lines.push(ctx.t(T.r1));
  }
  const channel = contactChannels().find((c) => c.id === data.channel);
  if (channel && channel.id !== 'email') lines.push(`${ctx.t(T.replyVia)}: ${channel.label}`);
  if (data.message?.trim()) lines.push('', data.message.trim());
  lines.push('', `${ctx.t(T.thanks)}${data.name || ''}`.trim());
  const subject = `${ctx.t(T.subject)} ${ctx.brand}: ${data.arrival && data.departure ? `${data.arrival} – ${data.departure}` : Number(data.month) ? monthName(Number(data.month), ctx.lang, true) : ''}, ${plural(ctx.lang, Number(data.adults) + kids, N.guests)}`;
  return { subject, body: lines.join('\n') };
}

function sendHref(data, msg, ctx) {
  const c = ctx.site.contact;
  if (data.channel === 'whatsapp' && c.whatsapp) return `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(msg.body)}`;
  if (data.channel === 'viber' && c.viber) return `viber://forward?text=${encodeURIComponent(msg.body)}`;
  return `mailto:${c.email}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;
}

function validate(form, data, ctx) {
  const errors = [];
  for (const f of form.querySelectorAll('[aria-invalid]')) {
    f.removeAttribute('aria-invalid');
    f.removeAttribute('aria-describedby');
  }
  if (!data.name?.trim()) errors.push(['inq-name', ctx.t(T.errName)]);
  const nights = nightsBetween(data.arrival, data.departure);
  if (data.arrival && data.departure && !(nights > 0)) errors.push(['inq-departure', ctx.t(T.errDates)]);
  if (!(data.arrival && data.departure) && !Number(data.month)) errors.push([data.arrival ? 'inq-departure' : 'inq-arrival', ctx.t(T.errWhen)]);
  const box = form.querySelector('[data-errors]');
  box.hidden = !errors.length;
  box.innerHTML = errors.length
    ? `<strong>${esc(ctx.t(T.fixThese))}</strong><ul>${errors.map(([id, msg]) => `<li id="err-${id}"><a href="#${id}">${esc(msg)}</a></li>`).join('')}</ul>`
    : '';
  // Each invalid field announces its own message when it gets focus.
  for (const [id] of errors) {
    const field = form.querySelector(`#${id}`);
    field?.setAttribute('aria-invalid', 'true');
    field?.setAttribute('aria-describedby', `err-${id}`);
  }
  return !errors.length;
}

async function copyText(text, ctx) {
  try {
    await navigator.clipboard.writeText(text);
    toast(ctx.t(T.copied));
  } catch {
    toast(text.slice(0, 80));
  }
}

function applyPrefill(form, ctx, p = {}) {
  const set = {};
  if (p.apartment) set.apartment = p.apartment;
  if (p.purpose && PURPOSES.some((x) => x.id === p.purpose)) set.purpose = p.purpose;
  if (p.month) set.month = p.month;
  if (typeof p.guests === 'number') set.adults = p.guests;
  else if (p.guests) {
    if (p.guests.adults) set.adults = p.guests.adults;
    if (p.guests.children != null) set.children = p.guests.children;
  }
  writeForm(form, set);
  if (p.message) {
    const cur = form.elements.message.value.trim();
    if (!cur.includes(p.message)) form.elements.message.value = cur ? `${cur}\n${p.message}` : p.message;
  }
  if (set.month) form.elements.month.dataset.touched = '1';
  renderAges(form, ctx);
  syncConditional(form);
  syncNights(form, ctx);
}

export default {
  id: 'inquiry',
  nav: { en: 'Contact', de: 'Kontakt', sl: 'Kontakt', hr: 'Kontakt', it: 'Contatto' },
  className: 'alt',
  // Eager so 'inquiry:prefill' from any section works before the form scrolls into view.
  eager: true,

  render(ctx) {
    return `<div class="container">
      <div class="section-head center">
        <p class="eyebrow">${icon('calendar', { size: 16 })} ${esc(ctx.t(T.eyebrow))}</p>
        <h2>${esc(ctx.t(T.title))}</h2>
        <p class="lede">${esc(ctx.t(T.lede))}</p>
      </div>
      <div class="inq-grid">
        ${formHtml(ctx)}
        ${asideHtml(ctx)}
      </div>
    </div>`;
  },

  mount(el, ctx) {
    const form = el.querySelector('[data-form]');
    let lastMessage = null;

    const draft = loadDraft();
    if (draft) {
      writeForm(form, draft);
      if (Number(draft.month)) form.elements.month.dataset.touched = '1';
    }
    renderAges(form, ctx, draft || {});
    syncConditional(form);
    syncNights(form, ctx);

    let saveTimer;
    const onInput = (e) => {
      if (e.target.name === 'children') renderAges(form, ctx);
      if (e.target.name === 'purpose') syncConditional(form);
      if (e.target.name === 'arrival' || e.target.name === 'departure') syncNights(form, ctx);
      if (e.target.name === 'month') form.elements.month.dataset.touched = '1';
      if (e.target.getAttribute('aria-invalid')) {
        e.target.removeAttribute('aria-invalid');
        e.target.removeAttribute('aria-describedby');
      }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = null;
        saveDraft(readForm(form));
      }, 300);
    };
    form.addEventListener('input', onInput);
    form.addEventListener('change', onInput);

    form.addEventListener('click', (e) => {
      // Error links focus their field without leaving a #hash in shareable URLs.
      const err = e.target.closest('[data-errors] a');
      if (err) {
        e.preventDefault();
        form.querySelector(err.getAttribute('href'))?.focus();
        return;
      }
      const step = e.target.closest('[data-step]');
      if (step) {
        const input = form.elements[step.dataset.step];
        const next = Math.max(Number(input.min), Math.min(Number(input.max), (Number(input.value) || 0) + Number(step.dataset.delta)));
        input.value = next;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      if (e.target.closest('[data-copy]')) {
        copyText((lastMessage || buildMessage(readForm(form), ctx)).body, ctx);
        return;
      }
      if (e.target.closest('[data-clear]')) {
        form.reset();
        delete form.elements.month.dataset.touched;
        clearDraft();
        renderAges(form, ctx);
        syncConditional(form);
        syncNights(form, ctx);
        form.querySelector('[data-ready]').hidden = true;
        form.querySelector('[data-errors]').hidden = true;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = readForm(form);
      if (!validate(form, data, ctx)) {
        form.querySelector('[aria-invalid]')?.focus();
        return;
      }
      lastMessage = buildMessage(data, ctx);
      const href = sendHref(data, lastMessage, ctx);
      const ready = form.querySelector('[data-ready]');
      ready.querySelector('[data-preview]').textContent = lastMessage.body;
      ready.querySelector('[data-open]').href = href;
      ready.hidden = false;
      ready.focus({ preventScroll: true });
      ready.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      if (href.startsWith('mailto:') || href.startsWith('viber:')) window.location.href = href;
      else window.open(href, '_blank', 'noopener');
    });

    const off = ctx.bus.on('inquiry:prefill', (payload) => {
      applyPrefill(form, ctx, payload);
      saveDraft(readForm(form));
      form.classList.remove('is-flash');
      void form.offsetWidth; // restart the highlight animation
      form.classList.add('is-flash');
      const first = !form.elements.arrival.value ? form.elements.arrival : form.elements.name;
      // Lazy sections above the form grow while mounting: focus once the
      // corrected scroll has settled, so focus is never off-screen.
      scrollToSection(el).then(() => first.focus({ preventScroll: true }));
    });

    return () => {
      // A rebuild (language, brand, audience) must not lose the last keystrokes.
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveDraft(readForm(form));
      }
      off();
    };
  },

  update(el, ctx, changed) {
    if (!changed.includes('month')) return;
    const form = el.querySelector('[data-form]');
    if (!form || form.elements.month.dataset.touched) return;
    form.elements.month.value = String(ctx.state.month);
  },
};
