// "The house": interactive 3D model next to the apartment cards, shared
// amenities and the photo gallery. Selecting a card highlights the unit in 3D
// and the other way round. The 3D viewer (three.js) is loaded only in mount().
import './villa.css';
import { APARTMENTS, PHOTOS } from '../content/site.js';
import { esc, icon, photo, prefersReducedMotion, whenNear } from '../lib/util.js';
import { plural } from '../lib/lang-forms.js';
import { openLightbox } from '../lib/lightbox.js';

const POSTER = '20210720_171634.jpg';
const MOBILE = '(max-width: 900px)';

const L = {
  eyebrow: { en: 'The house', de: 'Das Haus', sl: 'Hiša', hr: 'Kuća', it: 'La casa' },
  ground: { en: 'Ground floor', de: 'Erdgeschoss', sl: 'Pritličje', hr: 'Prizemlje', it: 'Piano terra' },
  upper: { en: 'Upper floor', de: 'Obergeschoss', sl: 'Nadstropje', hr: 'Kat', it: 'Primo piano' },
  guests: { en: 'Guests', de: 'Gäste', sl: 'Gostje', hr: 'Gosti', it: 'Ospiti' },
  // Plural forms (see lib/lang-forms.js): Slovenian has a dual, Croatian a "few" form.
  upTo: {
    en: { one: 'Up to {n} guest', other: 'Up to {n} guests' },
    de: { one: 'Bis zu {n} Gast', other: 'Bis zu {n} Gäste' },
    sl: { one: 'Do {n} gosta', other: 'Do {n} gostov' },
    hr: { one: 'Do {n} gosta', few: 'Do {n} gosta', other: 'Do {n} gostiju' },
    it: { one: 'Fino a {n} ospite', other: 'Fino a {n} ospiti' },
  },
  listed: { en: 'as listed on booking platforms', de: 'laut Buchungsplattformen', sl: 'po podatkih rezervacijskih portalov', hr: 'prema podacima s portala za rezervacije', it: 'secondo i portali di prenotazione' },
  areaAsk: { en: 'Floor area: ask us', de: 'Wohnfläche: auf Anfrage', sl: 'Površina: povprašajte nas', hr: 'Površina: pitajte nas', it: 'Superficie: chiedeteci' },
  ask: { en: 'Ask about this apartment', de: 'Nach diesem Apartment fragen', sl: 'Povprašajte o tem apartmaju', hr: 'Pošaljite upit za ovaj apartman', it: 'Chiedeteci di questo appartamento' },
  inModel: { en: 'Show in 3D', de: 'In 3D zeigen', sl: 'Prikaži v 3D', hr: 'Prikaži u 3D-u', it: 'Mostra in 3D' },
  photos: {
    en: { one: '{n} photo', other: '{n} photos' },
    de: { one: '{n} Foto', other: '{n} Fotos' },
    sl: { one: '{n} fotografija', two: '{n} fotografiji', few: '{n} fotografije', other: '{n} fotografij' },
    hr: { one: '{n} fotografija', few: '{n} fotografije', other: '{n} fotografija' },
    it: { one: '{n} foto', other: '{n} foto' },
  },
  openPhoto: { en: 'Open photo', de: 'Foto öffnen', sl: 'Odpri fotografijo', hr: 'Otvori fotografiju', it: 'Apri la foto' },
  loading: { en: 'Loading the 3D model…', de: '3D-Modell wird geladen…', sl: 'Nalagamo 3D-model …', hr: 'Učitavamo 3D model…', it: 'Caricamento del modello 3D…' },
  howTo: {
    en: 'Drag to turn the house, tap an apartment to select it.',
    de: 'Ziehen Sie, um das Haus zu drehen, und tippen Sie auf ein Apartment, um es auszuwählen.',
    sl: 'Hišo zavrtite s potegom, apartma izberete z dotikom.',
    hr: 'Povucite da biste okrenuli kuću, a dodirnite apartman da biste ga odabrali.',
    it: 'Trascinate per ruotare la casa, toccate un appartamento per selezionarlo.',
  },
  twin: { en: 'See the whole house in 3D', de: 'Das ganze Haus in 3D ansehen', sl: 'Oglejte si celo hišo v 3D', hr: 'Pogledajte cijelu kuću u 3D-u', it: 'Guardate tutta la casa in 3D' },
  twinText: {
    en: 'With every photo where it was taken, and a look inside both floors.',
    de: 'Jedes Foto an seinem Aufnahmeort, dazu ein Blick in beide Etagen.',
    sl: 'Vsaka fotografija na mestu, kjer je nastala, in pogled v notranjost obeh etaž.',
    hr: 'Svaka fotografija na mjestu gdje je snimljena i pogled u unutrašnjost obiju etaža.',
    it: "Ogni foto nel punto in cui è stata scattata, e uno sguardo all'interno di entrambi i piani.",
  },
  shared: { en: 'Shared by everyone in the house', de: 'Für alle im Haus', sl: 'Skupno vsem gostom v hiši', hr: 'Zajedničko svim gostima u kući', it: 'In comune per tutti gli ospiti' },
  gallery: { en: 'Photos of the house', de: 'Fotos vom Haus', sl: 'Fotografije hiše', hr: 'Fotografije kuće', it: 'Foto della casa' },
  all: { en: 'All', de: 'Alle', sl: 'Vse', hr: 'Sve', it: 'Tutte' },
  outside: { en: 'House & garden', de: 'Haus & Garten', sl: 'Hiša in vrt', hr: 'Kuća i vrt', it: 'Casa e giardino' },
  bikes: { en: 'Lockable bike storage: on request', de: 'Abschließbarer Radplatz: auf Anfrage', sl: 'Zaklenjen prostor za kolesa: na povpraševanje', hr: 'Zaključani prostor za bicikle: na upit', it: 'Deposito bici chiuso a chiave: su richiesta' },
  noPhotos: { en: 'Interior photos on request', de: 'Innenfotos auf Anfrage', sl: 'Fotografije notranjosti na povpraševanje', hr: 'Fotografije interijera na upit', it: 'Foto degli interni su richiesta' },
  morePhotos: { en: 'More photos on request', de: 'Weitere Fotos auf Anfrage', sl: 'Več fotografij na povpraševanje', hr: 'Više fotografija na upit', it: 'Altre foto su richiesta' },
  // Count in brackets in sl/hr: the noun would otherwise have to agree with {n}.
  showAll: { en: 'Show all {n} photos', de: 'Alle {n} Fotos zeigen', sl: 'Prikaži vse fotografije ({n})', hr: 'Prikaži sve fotografije ({n})', it: 'Mostra tutte le {n} foto' },
  unitsNav: { en: 'Apartments', de: 'Apartments', sl: 'Apartmaji', hr: 'Apartmani', it: 'Appartamenti' },
  prev: { en: 'Previous apartment', de: 'Vorheriges Apartment', sl: 'Prejšnji apartma', hr: 'Prethodni apartman', it: 'Appartamento precedente' },
  next: { en: 'Next apartment', de: 'Nächstes Apartment', sl: 'Naslednji apartma', hr: 'Sljedeći apartman', it: 'Appartamento successivo' },
  mountError: {
    en: 'The interactive part of this section could not start. The apartment details and photos above are still accurate.',
    de: 'Der interaktive Teil dieses Abschnitts konnte nicht starten. Die Angaben und Fotos oben stimmen trotzdem.',
    sl: 'Interaktivnega dela tega razdelka ni bilo mogoče zagnati. Podatki o apartmajih in fotografije zgoraj ostajajo točni.',
    hr: 'Interaktivni dio ovog odjeljka nije se mogao pokrenuti. Podaci o apartmanima i fotografije iznad i dalje su točni.',
    it: 'La parte interattiva di questa sezione non si è avviata. I dettagli e le foto degli appartamenti qui sopra restano validi.',
  },
  wholeAsk: { en: 'Ask about the whole house', de: 'Das ganze Haus anfragen', sl: 'Povprašajte za celo hišo', hr: 'Pošaljite upit za cijelu kuću', it: "Chiedeteci dell'intera casa" },
  // {n}: apartment number(s) whose floor area is not confirmed (APARTMENTS areaM2: null).
  wholeNote: {
    en: 'Not counting Apartment {n}: its floor area is not confirmed yet.',
    de: 'Ohne Apartment {n}, dessen Wohnfläche noch nicht bestätigt ist.',
    sl: 'Brez apartmaja {n}, katerega površina še ni potrjena.',
    hr: 'Bez apartmana {n}, čija površina još nije potvrđena.',
    it: "Escluso l'appartamento {n}, la cui superficie non è ancora confermata.",
  },
};

const STAT = {
  apartments: { en: 'apartments', de: 'Apartments', sl: 'apartmaji', hr: 'apartmana', it: 'appartamenti' },
  area: { en: 'living space', de: 'Wohnfläche', sl: 'bivalne površine', hr: 'stambenog prostora', it: 'superficie' },
  bedrooms: { en: 'bedrooms', de: 'Schlafzimmer', sl: 'spalnic', hr: 'spavaćih soba', it: 'camere' },
  floors: { en: 'floors', de: 'Etagen', sl: 'etaži', hr: 'etaže', it: 'piani' },
};

// Copy per audience: which apartment to preselect and how to pitch the house.
// TODO(owner): confirm how many steps lead up to Apartment 1. The model shows a few
// entrance steps at the arch, so the copy says "a few steps", not "step-free".
const COPY = {
  general: {
    selected: null,
    title: { en: 'Four apartments, one garden, a quiet lane', de: 'Vier Apartments, ein Garten, eine ruhige Straße', sl: 'Štirje apartmaji, en vrt, mirna ulica', hr: 'Četiri apartmana, jedan vrt, mirna ulica', it: 'Quattro appartamenti, un giardino, una via tranquilla' },
    lede: {
      en: 'Turn the house in 3D and pick an apartment to see where it is, what it has and where you get in. Every apartment has its own outdoor space; the garden, the grill and the parking are shared.',
      de: 'Drehen Sie das Haus in 3D und wählen Sie ein Apartment: Lage, Ausstattung und Eingang auf einen Blick. Jedes Apartment hat einen eigenen Außenbereich; Garten, Grill und Parkplatz teilen sich alle.',
      sl: 'Zavrtite hišo v 3D in izberite apartma, da vidite, kje je, kaj ponuja in kje je vhod. Vsak apartma ima svoj zunanji prostor; vrt, žar in parkirišče so skupni.',
      hr: 'Okrenite kuću u 3D-u i odaberite apartman da vidite gdje je, što nudi i gdje je ulaz. Svaki apartman ima svoj vanjski prostor; vrt, roštilj i parkiralište su zajednički.',
      it: "Ruotate la casa in 3D e scegliete un appartamento per vedere dove si trova, cosa offre e da dove si entra. Ogni appartamento ha il suo spazio all'aperto; giardino, barbecue e parcheggio sono in comune.",
    },
  },
  families: {
    selected: 'apt1',
    title: { en: 'A ground-floor apartment that opens onto the garden', de: 'Erdgeschoss-Apartment direkt am Garten', sl: 'Apartma v pritličju, ki se odpira na vrt', hr: 'Prizemni apartman koji izlazi na vrt', it: 'Un appartamento al piano terra che si apre sul giardino' },
    lede: {
      en: 'Apartment 1 is on the ground floor, a few steps up from the lawn: no long staircase with buggies and beach bags. Behind the arches is a covered terrace for naps in the shade, and it has its own outdoor kitchen. Travelling with grandparents or a second family? Apartment 2 is upstairs.',
      de: 'Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Rasen: keine lange Treppe mit Kinderwagen und Strandtaschen. Hinter den Bögen liegt eine überdachte Terrasse für den Mittagsschlaf im Schatten, dazu eine eigene Außenküche. Mit Großeltern oder einer zweiten Familie unterwegs? Apartment 2 liegt im Obergeschoss.',
      sl: 'Apartma 1 je v pritličju, nekaj stopnic nad trato: brez dolgih stopnic z vozičkom in torbami za plažo. Za loki je pokrita terasa za počitek v senci, ima pa tudi svojo zunanjo kuhinjo. Potujete s starimi starši ali z drugo družino? Apartma 2 je v nadstropju.',
      hr: 'Apartman 1 je u prizemlju, nekoliko stepenica iznad travnjaka: bez dugih stepenica s kolicima i torbama za plažu. Iza lukova je natkrivena terasa za odmor u hladu, a ima i vlastitu vanjsku kuhinju. Putujete s bakom i djedom ili s još jednom obitelji? Apartman 2 je na katu.',
      it: "L'appartamento 1 è al piano terra, pochi gradini sopra il prato: niente lunghe scale con passeggino e borse da spiaggia. Dietro gli archi c'è una terrazza coperta per il riposino all'ombra, e ha una cucina esterna tutta sua. Viaggiate con i nonni o con un'altra famiglia? L'appartamento 2 è al piano di sopra.",
    },
  },
  cyclists: {
    selected: 'apt3',
    title: { en: 'Your own door at the top of the outside stair', de: 'Die eigene Tür oben an der Außentreppe', sl: 'Lastna vrata na vrhu zunanjih stopnic', hr: 'Vlastita vrata na vrhu vanjskih stepenica', it: 'Una porta tutta vostra in cima alla scala esterna' },
    lede: {
      en: 'Apartment 3 has its own entrance from the outside stair and a long terrace under a timber pergola, good for drying kit and stretching after a ride. Ask us about lockable storage for your bikes.',
      de: 'Apartment 3 hat einen eigenen Eingang über die Außentreppe und eine lange Terrasse unter einer Holzpergola, ideal zum Trocknen der Radkleidung und Dehnen nach der Tour. Fragen Sie uns nach einem abschließbaren Platz für Ihre Räder.',
      sl: 'Apartma 3 ima lasten vhod po zunanjih stopnicah in dolgo teraso pod leseno pergolo, kjer lahko po vožnji posušite opremo in se raztegnete. Povprašajte nas o zaklenjenem prostoru za kolesa.',
      hr: 'Apartman 3 ima vlastiti ulaz s vanjskih stepenica i dugu terasu pod drvenom pergolom, za sušenje opreme i istezanje nakon vožnje. Pitajte nas o zaključanom prostoru za bicikle.',
      it: "L'appartamento 3 ha un ingresso indipendente dalla scala esterna e una lunga terrazza sotto un pergolato in legno, per asciugare l'abbigliamento e fare stretching dopo il giro. Chiedeteci di un deposito chiudibile per le bici.",
    },
  },
  retreats: {
    selected: null,
    whole: true,
    title: { en: 'Take all four: the whole house for your team', de: 'Alle vier: das ganze Haus für Ihr Team', sl: 'Vzemite vse štiri: celotna hiša za vašo ekipo', hr: 'Uzmite sva četiri: cijela kuća za vaš tim', it: "Prendete tutti e quattro: l'intera casa per il vostro team" },
    // TODO(owner): confirm how the caretaker room is used during whole-house bookings.
    lede: {
      en: 'Book the four apartments together and there are no other guests in the house. Six bedrooms on two floors, private outdoor space for every apartment, and a lawn for the morning stand-up.',
      de: 'Buchen Sie alle vier Apartments zusammen, dann sind keine anderen Gäste im Haus. Sechs Schlafzimmer auf zwei Etagen, ein eigener Außenbereich für jedes Apartment und ein Rasen für das Stand-up am Morgen.',
      sl: 'Rezervirajte vse štiri apartmaje skupaj in v hiši ne bo drugih gostov. Šest spalnic v dveh etažah, vsak apartma s svojim zunanjim prostorom in trata za jutranji sestanek.',
      hr: 'Rezervirajte sva četiri apartmana zajedno i u kući neće biti drugih gostiju. Šest spavaćih soba na dvije etaže, vlastiti vanjski prostor za svaki apartman i travnjak za jutarnji sastanak.',
      it: 'Prenotate insieme i quattro appartamenti e in casa non ci saranno altri ospiti. Sei camere su due piani, uno spazio esterno per ogni appartamento e un prato per lo stand-up del mattino.',
    },
  },
};

const APT_SHORT = { en: 'Apt', de: 'Apt.', sl: 'Ap.', hr: 'Ap.', it: 'App.' };
const GALLERY_FIRST = 8;

const isDev = import.meta.env.DEV;
const todo = (text) => (isDev ? ` <span class="badge todo" title="Placeholder until the owner confirms">TODO(owner): ${esc(text)}</span>` : '');

function copyFor(ctx) {
  return COPY[ctx.audience.id] || COPY.general;
}

const BEDROOMS = {
  en: { one: '{n} bedroom', other: '{n} bedrooms' },
  de: '{n} Schlafzimmer',
  sl: { one: '{n} spalnica', two: '{n} spalnici', few: '{n} spalnice', other: '{n} spalnic' },
  hr: { one: '{n} spavaća soba', few: '{n} spavaće sobe', other: '{n} spavaćih soba' },
  it: { one: '{n} camera da letto', other: '{n} camere da letto' },
};
function bedroomsText(n, lang) {
  return plural(BEDROOMS, n, lang);
}

function captionFor(file, ctx) {
  const p = PHOTOS.find((x) => x.file === file);
  return p ? ctx.t(p) : '';
}

function areaText(apt, ctx) {
  return apt.areaM2 ? `${apt.areaM2} m²` : ctx.t(L.areaAsk);
}

// Only photos captioned as this apartment: site.js also lists house shots
// (driveway, street) for Apartment 4, which would read as its interior.
function ownPhotos(apt) {
  return apt.photos.filter((f) => PHOTOS.find((p) => p.file === f)?.kind === apt.id);
}

function stripHtml(apt, ctx) {
  const t = ctx.t;
  const files = ownPhotos(apt);
  if (!files.length) return `<p class="villa-nophotos">${icon('info', { size: 18 })}<span>${esc(t(L.noPhotos))}${todo(`photos of apartment ${apt.number}`)}</span></p>`;
  const shown = files.slice(0, 4);
  const more = files.length - shown.length;
  return `
      <div class="villa-strip" role="group" aria-label="${esc(t(apt.name))}: ${esc(plural(L.photos, files.length, ctx.lang))}">
        ${shown
          .map(
            (f, i) => `<button type="button" class="villa-thumb" data-strip="${apt.id}" data-i="${i}" aria-label="${esc(t(L.openPhoto))}: ${esc(captionFor(f, ctx) || t(apt.name))}">
              <img src="${photo(f, 'thumb')}" alt="" loading="lazy" decoding="async" />
              ${i === shown.length - 1 && more > 0 ? `<span class="villa-more">+${more}</span>` : ''}
            </button>`,
          )
          .join('')}
      </div>
      ${files.length === 1 ? `<p class="small muted villa-morephotos">${esc(t(L.morePhotos))}${todo(`more photos of apartment ${apt.number}`)}</p>` : ''}`;
}

function cardHtml(apt, ctx, selected) {
  const t = ctx.t;
  const extras = apt.extras.map((x) => `<li>${icon('check', { size: 18 })}${esc(t(x))}</li>`).join('');
  const bikes = ctx.audience.id === 'cyclists' && apt.id === 'apt3'
    ? `<li>${icon('bike', { size: 18 })}<span>${esc(t(L.bikes))}${todo('confirm bike storage')}</span></li>`
    : '';
  return `
  <article class="villa-card${selected ? ' is-selected' : ''}" data-apt="${apt.id}" style="--c:${apt.color}" role="listitem">
    <button type="button" class="villa-pick" data-pick="${apt.id}" aria-pressed="${selected}">
      <span class="villa-num" aria-hidden="true">${apt.number}</span>
      <span class="villa-pick-text">
        <span class="villa-floor">${esc(t(L[apt.floor]))}</span>
        <span class="villa-name">${esc(t(apt.name))}</span>
      </span>
      <span class="villa-3d" aria-hidden="true">${icon('cube', { size: 18 })}<span>${esc(t(L.inModel))}</span></span>
    </button>
    <div class="villa-card-body">
      <p class="meta villa-meta">
        <span>${icon('layers', { size: 18 })}${esc(areaText(apt, ctx))}${apt.areaM2 ? '' : todo(`area of apartment ${apt.number}`)}</span>
        <span>${icon('bed', { size: 18 })}${esc(bedroomsText(apt.bedrooms, ctx.lang))}</span>
        <span>${icon('users', { size: 18 })}${apt.maxGuests
          ? `<span>${esc(plural(L.upTo, apt.maxGuests, ctx.lang))} <small class="muted">(${esc(t(L.listed))})</small></span>`
          : `${esc(t(L.guests))}: ${esc(t('onRequest'))}`}</span>
      </p>
      <p class="villa-highlight">${esc(t(apt.highlights))}</p>
      <ul class="villa-extras">
        <li>${icon('sun', { size: 18 })}${esc(t(apt.outdoor))}</li>
        ${extras}${bikes}
      </ul>
      ${stripHtml(apt, ctx)}
      <button type="button" class="btn btn-primary villa-ask" data-ask="${apt.id}">${icon('chat', { size: 18 })}${esc(t(L.ask))}</button>
    </div>
  </article>`;
}

function wholeHouseHtml(ctx) {
  const t = ctx.t;
  // Sum of the confirmed floor areas; apartments without one are named in the note.
  const known = APARTMENTS.reduce((sum, a) => sum + (a.areaM2 || 0), 0);
  const unknown = APARTMENTS.filter((a) => !a.areaM2).map((a) => a.number).join(', ');
  const bedrooms = APARTMENTS.reduce((sum, a) => sum + (a.bedrooms || 0), 0);
  const stats = [
    [APARTMENTS.length, STAT.apartments],
    [unknown ? `${known}+ m²*` : `${known} m²`, STAT.area],
    [bedrooms, STAT.bedrooms],
    [2, STAT.floors],
  ];
  return `
  <div class="villa-whole">
    <dl class="villa-stats">
      ${stats.map(([v, label]) => `<div><dt>${esc(t(label))}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
    <div class="villa-whole-side">
      <button type="button" class="btn btn-accent" data-ask="house">${icon('users', { size: 18 })}${esc(t(L.wholeAsk))}</button>
      ${unknown ? `<p class="source-note">* ${esc(t(L.wholeNote).replace('{n}', unknown))}${todo(`confirm apartment ${unknown} area`)}</p>` : ''}
    </div>
  </div>`;
}

// House and garden first, then the apartments.
function galleryItems() {
  return [...PHOTOS.filter((p) => p.kind === 'house'), ...PHOTOS.filter((p) => p.kind.startsWith('apt'))];
}

function galleryHtml(ctx) {
  const t = ctx.t;
  const kinds = [
    ['all', t(L.all)],
    ['house', t(L.outside)],
    ...APARTMENTS.filter((a) => galleryItems().some((p) => p.kind === a.id)).map((a) => [a.id, `${t(APT_SHORT)} ${a.number}`]),
  ];
  return `
  <div class="villa-gallery-head">
    <h3>${esc(t(L.gallery))}</h3>
    <div class="chips" role="group" aria-label="${esc(t(L.gallery))}">
      ${kinds.map(([k, label], i) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('')}
    </div>
  </div>
  <div class="villa-gallery">
    ${galleryItems()
      .map(
        (p, i) => `<button type="button" class="villa-photo" data-g="${i}" data-kind="${p.kind}"${i >= GALLERY_FIRST ? ' hidden' : ''}>
          <img src="${photo(p.file, 'thumb')}" srcset="${photo(p.file, 'thumb')} 480w, ${photo(p.file, 'web')} 1600w"
            sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 300px" alt="${esc(t(p))}" loading="lazy" decoding="async" />
          <span class="villa-photo-cap">${esc(t(p))}</span>
        </button>`,
      )
      .join('')}
  </div>
  ${galleryItems().length > GALLERY_FIRST
    ? `<p class="villa-gallery-more"><button type="button" class="btn btn-ghost" data-show-all>${esc(t(L.showAll).replace('{n}', galleryItems().length))}</button></p>`
    : ''}`;
}

// Phone/tablet carousel controls: prev/next and one dot per apartment (dots reuse data-pick).
function unitsNavHtml(ctx, selected) {
  const t = ctx.t;
  return `
  <div class="villa-units-nav" role="group" aria-label="${esc(t(L.unitsNav))}">
    <button type="button" class="villa-nav-btn villa-nav-prev" data-step="-1" aria-label="${esc(t(L.prev))}">${icon('arrow', { size: 20 })}</button>
    <div class="villa-dots">
      ${APARTMENTS.map((a) => `<button type="button" class="villa-dot" data-pick="${a.id}" style="--c:${a.color}" aria-pressed="${a.id === selected}" aria-label="${esc(t(a.name))}">${a.number}</button>`).join('')}
    </div>
    <button type="button" class="villa-nav-btn" data-step="1" aria-label="${esc(t(L.next))}">${icon('arrow', { size: 20 })}</button>
  </div>`;
}

export default {
  id: 'villa',
  nav: { en: 'The house', de: 'Das Haus', sl: 'Hiša', hr: 'Kuća', it: 'La casa' },

  render(ctx) {
    const t = ctx.t;
    const copy = copyFor(ctx);
    return `
    <div class="container">
      <header class="section-head">
        <span class="eyebrow">${icon('cube', { size: 16 })}${esc(t(L.eyebrow))}</span>
        <h2>${esc(t(copy.title))}</h2>
        <p class="lede">${esc(t(copy.lede))}</p>
      </header>
      ${copy.whole ? wholeHouseHtml(ctx) : ''}
      <div class="villa-layout">
        <div class="villa-stage">
          <div class="villa-viewer" data-viewer>
            <img class="villa-poster" src="${photo(POSTER, 'web')}" srcset="${photo(POSTER, 'thumb')} 480w, ${photo(POSTER, 'web')} 1600w"
              sizes="(max-width: 900px) 100vw, 480px" alt="" loading="lazy" decoding="async" />
            <p class="villa-loading" data-loading>${esc(t(L.loading))}</p>
          </div>
          <div class="villa-stage-foot">
            <p class="small muted">${esc(t(L.howTo))}</p>
          </div>
        </div>
        <div class="villa-units" role="list">
          ${APARTMENTS.map((a) => cardHtml(a, ctx, a.id === copy.selected)).join('')}
        </div>
        ${unitsNavHtml(ctx, copy.selected)}
      </div>
      <div class="villa-shared">
        <div class="villa-shared-head">
          <h3>${esc(t(L.shared))}</h3>
          <a class="villa-twin" href="./twin.html">${icon('cube', { size: 18 })}<span><strong>${esc(t(L.twin))}</strong><small>${esc(t(L.twinText))}</small></span>${icon('arrow', { size: 18 })}</a>
        </div>
        <ul class="villa-shared-list">
          ${ctx.site.shared.map((s) => `<li><span class="villa-shared-icon">${icon(s.icon, { size: 22 })}</span>${esc(t(s))}</li>`).join('')}
        </ul>
      </div>
      ${galleryHtml(ctx)}
      <p class="error-box" data-mount-error hidden>${esc(t(L.mountError))}</p>
    </div>`;
  },

  mount(el, ctx) {
    const t = ctx.t;
    const copy = copyFor(ctx);
    const cards = [...el.querySelectorAll('.villa-card')];
    const list = el.querySelector('.villa-units');
    const mobile = window.matchMedia(MOBILE);
    let viewer = null;
    let current = copy.selected;
    let swiped = false;

    const markCards = (id) => {
      current = id;
      for (const b of el.querySelectorAll('[data-pick]')) b.setAttribute('aria-pressed', String(b.dataset.pick === id));
      for (const card of cards) card.classList.toggle('is-selected', card.dataset.apt === id);
    };
    const revealCard = (id) => {
      const card = cards.find((c) => c.dataset.apt === id);
      if (!card) return;
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      // In the phone carousel scroll sideways only, never the page.
      if (mobile.matches) {
        swiped = false;
        list.scrollTo({ left: card.offsetLeft - list.offsetLeft, behavior });
      } else card.scrollIntoView({ block: 'nearest', behavior });
    };
    const choose = (id, { fromViewer = false } = {}) => {
      markCards(id);
      if (!fromViewer) viewer?.select(id);
      else if (id) revealCard(id);
    };

    const onClick = (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        choose(pick.dataset.pick);
        if (pick.classList.contains('villa-dot')) revealCard(pick.dataset.pick);
        return;
      }
      const step = e.target.closest('[data-step]');
      if (step) {
        const i = APARTMENTS.findIndex((a) => a.id === current);
        const n = APARTMENTS.length;
        const id = APARTMENTS[i < 0 ? 0 : (i + Number(step.dataset.step) + n) % n].id;
        choose(id);
        return revealCard(id);
      }
      const ask = e.target.closest('[data-ask]');
      if (ask) {
        const apartment = ask.dataset.ask;
        return ctx.bus.emit('inquiry:prefill', apartment === 'house' ? { apartment, purpose: 'retreat' } : { apartment });
      }
      const thumb = e.target.closest('[data-strip]');
      if (thumb) {
        const apt = APARTMENTS.find((a) => a.id === thumb.dataset.strip);
        return openLightbox(ownPhotos(apt).map((f) => ({ src: photo(f, 'web'), caption: captionFor(f, ctx) || t(apt.name) })), Number(thumb.dataset.i));
      }
      const g = e.target.closest('[data-g]');
      if (g) {
        const visible = [...el.querySelectorAll('[data-g]:not([hidden])')];
        const all = galleryItems();
        const items = visible.map((b) => all[Number(b.dataset.g)]).map((p) => ({ src: photo(p.file, 'web'), caption: t(p) }));
        return openLightbox(items, visible.indexOf(g));
      }
      const filter = e.target.closest('[data-filter]');
      if (filter) {
        for (const b of el.querySelectorAll('[data-filter]')) b.setAttribute('aria-pressed', String(b === filter));
        filterGallery(filter.dataset.filter);
        return;
      }
      if (e.target.closest('[data-show-all]')) {
        expanded = true;
        filterGallery('all');
        // Keep keyboard focus in the gallery once the button disappears.
        el.querySelector(`[data-g="${GALLERY_FIRST}"]`)?.focus();
      }
    };
    // A filter chip shows every photo of its kind; "All" shows the first few until expanded.
    let expanded = false;
    const filterGallery = (k) => {
      if (k !== 'all') expanded = true;
      for (const b of el.querySelectorAll('[data-g]')) {
        b.hidden = (k !== 'all' && b.dataset.kind !== k) || (!expanded && Number(b.dataset.g) >= GALLERY_FIRST);
      }
      const more = el.querySelector('[data-show-all]');
      if (more) more.parentElement.hidden = expanded;
    };
    el.addEventListener('click', onClick);

    // Phone carousel: the card swiped into view becomes the selected apartment.
    // Only real touches count, not our own scrollTo() when a unit is picked in 3D.
    const onTouch = () => (swiped = true);
    list.addEventListener('touchstart', onTouch, { passive: true });
    const io = new IntersectionObserver(
      (entries) => {
        if (!mobile.matches || !swiped) return;
        const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = best?.target.dataset.apt;
        if (id && id !== current) choose(id);
      },
      { root: list, threshold: [0.75] },
    );
    for (const card of cards) io.observe(card);
    if (current && mobile.matches) {
      const card = cards.find((c) => c.dataset.apt === current);
      list.scrollLeft = card.offsetLeft - list.offsetLeft;
    }

    // three.js and the WebGL context are the heaviest part of the page, so they start only
    // when the model is about to scroll into view, in idle time. The poster covers the wait.
    const host = el.querySelector('[data-viewer]');
    let disposed = false;
    let cancelIdle = () => {};
    const startViewer = async () => {
      try {
        const { createVillaViewer } = await import('../villa3d/viewer.js');
        if (disposed) return;
        const v = await createVillaViewer(host, {
          mode: 'embed',
          selected: current,
          onSelect: (id) => choose(id, { fromViewer: true }),
        });
        if (disposed) return v.dispose();
        viewer = v;
      } catch (err) {
        console.error('[villa] 3D viewer failed', err);
      }
      host.querySelector('[data-loading]')?.remove();
      if (!viewer || viewer.ok === false) el.querySelector('.villa-stage-foot')?.remove();
      host.classList.add('is-ready');
    };
    const stopNear = whenNear(host, () => {
      if (window.requestIdleCallback) {
        const id = requestIdleCallback(startViewer, { timeout: 2000 });
        cancelIdle = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(startViewer, 0);
        cancelIdle = () => clearTimeout(id);
      }
    }, '150px');

    return () => {
      disposed = true;
      stopNear();
      cancelIdle();
      el.removeEventListener('click', onClick);
      list.removeEventListener('touchstart', onTouch);
      io.disconnect();
      viewer?.dispose();
    };
  },
};
