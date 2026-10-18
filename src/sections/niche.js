// "For you": a spotlight for one niche audience (kitesurfers, reunions, remote
// workers, …). The audience's `nicheSegment` picks a segment of
// src/data/niches.json; without one, the section shows a compact "Who stays
// with us" grid that links every niche version.
//
// Guest-facing copy lives here (translatable); the research file supplies the
// sources and the confidence, loaded in mount().
// Every fact below is taken from that segment's whyItFits / risks, and each
// fact names the source URLs it rests on (matched by substring).
import './niche.css';
import { APARTMENTS } from '../content/site.js';
import { AUDIENCES } from '../content/audiences.js';
import { esc, icon, monthName } from '../lib/util.js';
import { ownerTodo } from './core-shared.js';

// Plural form of a noun for n (Intl rules: Slovenian has a dual, Croatian a
// paucal), so "{n} bedrooms" reads right in every language. A translation that
// needs this is a function of the placeholder values instead of a string.
const plural = (lang, n, forms) => forms[new Intl.PluralRules(lang).select(n)] ?? forms.other;
const count = (lang, n, forms) => `${n} ${plural(lang, n, forms)}`;
const BEDROOMS_SL = { one: 'spalnica', two: 'spalnici', few: 'spalnice', other: 'spalnic' };
const BEDROOMS_HR = { one: 'spavaća soba', few: 'spavaće sobe', other: 'spavaćih soba' };
const BEDROOMS_IT = { one: 'camera', other: 'camere' };

// ---------------------------------------------------------------------------
// UI strings
// ---------------------------------------------------------------------------
const L = {
  why: { en: 'Why this place fits', de: 'Warum es hier passt', sl: 'Zakaj je kraj kot nalašč za vas', hr: 'Zašto vam ovo mjesto odgovara', it: 'Perché questo posto fa per voi' },
  offer: { en: 'What we offer you', de: 'Was wir Ihnen bieten', sl: 'Kaj vam ponujamo', hr: 'Što vam nudimo', it: 'Cosa vi offriamo' },
  season: { en: 'Best time to come', de: 'Beste Reisezeit', sl: 'Najboljši čas za obisk', hr: 'Najbolje vrijeme za dolazak', it: 'Il periodo migliore' },
  caveats: { en: 'Honest caveats', de: 'Ehrlich gesagt', sl: 'Iskreno povedano', hr: 'Iskreno rečeno', it: 'Detto onestamente' },
  caveatsLede: { en: 'What you should know before you book.', de: 'Was Sie vor der Buchung wissen sollten.', sl: 'Kaj morate vedeti pred rezervacijo.', hr: 'Što trebate znati prije rezervacije.', it: 'Cosa sapere prima di prenotare.' },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  source: { en: 'Source', de: 'Quelle', sl: 'Vir', hr: 'Izvor', it: 'Fonte' },
  stYes: { en: 'We have this', de: 'Haben wir', sl: 'To imamo', hr: 'Imamo', it: 'Disponibile' },
  stPartial: { en: 'Partly', de: 'Teilweise', sl: 'Delno', hr: 'Djelomično', it: 'In parte' },
  stAsk: { en: 'Ask us', de: 'Fragen Sie uns', sl: 'Vprašajte nas', hr: 'Pitajte nas', it: 'Chiedeteci' },
  stNo: { en: 'Not available', de: 'Nicht möglich', sl: 'Ni na voljo', hr: 'Nije moguće', it: 'Non disponibile' },
  stInfo: { en: 'Good to know', de: 'Gut zu wissen', sl: 'Dobro je vedeti', hr: 'Dobro je znati', it: 'Buono a sapersi' },
  yourMonth: { en: 'Your month', de: 'Ihr Monat', sl: 'Vaš mesec', hr: 'Vaš mjesec', it: 'Il vostro mese' },
  // {m} is the month name in the nominative, so it never opens the sentence in sl/hr/it.
  monthBest: { en: '{m} is one of the best months for this.', de: 'Der {m} gehört zu den besten Monaten dafür.', sl: 'Mesec {m} je med najboljšimi za to.', hr: 'Mjesec {m} jedan je od najboljih za to.', it: 'Il mese di {m} è tra i migliori per questo.' },
  monthGood: { en: '{m} works too.', de: 'Der {m} passt auch.', sl: 'Tudi mesec {m} je primeren.', hr: 'I mjesec {m} je dobar izbor.', it: 'Anche {m} va bene.' },
  monthOff: {
    en: '{m} is outside the main season for this. Best: {best}.',
    de: 'Der {m} liegt außerhalb der Hauptsaison dafür. Am besten: {best}.',
    sl: 'Mesec {m} je zunaj glavne sezone za to. Najbolje: {best}.',
    hr: 'Mjesec {m} izvan je glavne sezone za to. Najbolje: {best}.',
    it: 'Il mese di {m} è fuori dalla stagione migliore per questo. Meglio: {best}.',
  },
  pickMonth: {
    en: 'Choose a travel month at the top of the page to see how it fits.',
    de: 'Wählen Sie oben einen Reisemonat, um zu sehen, wie er passt.',
    sl: 'Na vrhu strani izberite mesec potovanja in preverite, kako ustreza.',
    hr: 'Na vrhu stranice odaberite mjesec putovanja i provjerite koliko odgovara.',
    it: 'Scegliete un mese di viaggio in cima alla pagina per vedere se fa al caso vostro.',
  },
  ask: { en: 'Ask about your stay', de: 'Ihren Aufenthalt anfragen', sl: 'Povprašajte za bivanje', hr: 'Pošaljite upit za boravak', it: 'Chiedete informazioni sul soggiorno' },
  askMsg: { en: 'I found you via the page for {label}.', de: 'Ich habe Sie über die Seite für {label} gefunden.', sl: 'Pišem vam prek strani »{label}«.', hr: 'Javljam vam se preko stranice „{label}”.', it: 'Vi ho trovato tramite la pagina «{label}».' },
  lowConf: {
    en: 'Much of what we know here comes from third-party sources only. Please treat it as a lead and check before you travel.',
    de: 'Vieles hier stammt nur aus Quellen Dritter. Bitte als Hinweis verstehen und vor der Reise prüfen.',
    sl: 'Velik del teh informacij izhaja le iz virov tretjih oseb. Upoštevajte jih kot namig in jih pred potovanjem preverite.',
    hr: 'Velik dio ovih podataka dolazi samo iz vanjskih izvora. Shvatite ih kao smjernicu i provjerite ih prije putovanja.',
    it: 'Molte di queste informazioni provengono solo da fonti terze. Consideratele un punto di partenza e verificatele prima di partire.',
  },
  notYou: { en: 'Not you? Other ways to stay', de: 'Nicht Ihr Thema? Andere Arten, hier zu wohnen', sl: 'Ni za vas? Drugi načini bivanja', hr: 'Nije za vas? Drugi načini boravka', it: 'Non fa per voi? Altri modi di soggiornare' },
  whoTitle: { en: 'Who stays with us', de: 'Wer bei uns wohnt', sl: 'Kdo biva pri nas', hr: 'Tko boravi kod nas', it: 'Chi soggiorna da noi' },
  whoLede: {
    en: 'The same house works for very different trips. Pick yours and the whole page adapts: what matters, when to come, and what we still need to confirm.',
    de: 'Dasselbe Haus passt zu ganz unterschiedlichen Reisen. Wählen Sie Ihre, und die ganze Seite passt sich an: was zählt, wann man kommt und was wir noch bestätigen müssen.',
    sl: 'Ista hiša ustreza zelo različnim potovanjem. Izberite svoje in vsa stran se prilagodi: kaj je pomembno, kdaj priti in kaj moramo še potrditi.',
    hr: 'Ista kuća odgovara vrlo različitim putovanjima. Odaberite svoje i cijela se stranica prilagodi: što je važno, kada doći i što još moramo potvrditi.',
    it: 'La stessa casa si presta a viaggi molto diversi. Scegliete il vostro e tutta la pagina si adatta: cosa conta, quando venire e cosa dobbiamo ancora confermare.',
  },
  whoEyebrow: { en: 'For you', de: 'Für Sie', sl: 'Za vas', hr: 'Za vas', it: 'Per voi' },
  open: { en: 'See your version', de: 'Ihre Version ansehen', sl: 'Oglejte si svojo različico', hr: 'Pogledajte svoju verziju', it: 'Scoprite la vostra versione' },
  bestLegend: { en: 'Best', de: 'Ideal', sl: 'Najbolje', hr: 'Najbolje', it: 'Ideale' },
  goodLegend: { en: 'Good', de: 'Gut', sl: 'Dobro', hr: 'Dobro', it: 'Buono' },
  loadError: {
    en: 'The source links could not load. The text above is still accurate; ask us for details.',
    de: 'Die Quellenlinks konnten nicht geladen werden. Der Text oben stimmt trotzdem; fragen Sie uns nach Details.',
    sl: 'Povezav do virov ni bilo mogoče naložiti. Besedilo zgoraj kljub temu drži; za podrobnosti nas vprašajte.',
    hr: 'Poveznice na izvore nije bilo moguće učitati. Tekst iznad i dalje je točan; za detalje nas pitajte.',
    it: 'Non è stato possibile caricare i link alle fonti. Il testo qui sopra resta valido; chiedeteci i dettagli.',
  },
};

const STATUS = {
  yes: { icon: 'check', label: L.stYes },
  partial: { icon: 'info', label: L.stPartial },
  ask: { icon: 'chat', label: L.stAsk },
  no: { icon: 'close', label: L.stNo },
  info: { icon: 'info', label: L.stInfo },
};

// Small extra glyphs not in the shared icon set (same 24px stroke style).
const GLYPHS = {
  bird: '<path d="M3 13c3 0 5-1 7-4 1.5-2.2 3.5-3 5.5-3 1.4 0 2.5.6 3.5 1.5L21 8l-2 1c0 5-4 9-10 9H5l3-3"/><circle cx="16" cy="8.5" r=".6"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
};
function glyph(name, size = 20) {
  if (!GLYPHS[name]) return icon(name, { size });
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name]}</svg>`;
}

// ---------------------------------------------------------------------------
// Segment copy. Placeholders: {max} guests, {bedrooms}, {split}, {checkIn}.
// src: substrings of URLs in the segment's `sources` (research/niches.json).
// season months: 1..12.
// ---------------------------------------------------------------------------
const SEGMENTS = {
  kitesurfers: {
    icon: 'kite',
    purpose: 'kite',
    label: { en: 'Kite & windsurf', de: 'Kite & Windsurf', sl: 'Kajt in windsurf', hr: 'Kite i windsurf', it: 'Kite e windsurf' },
    teaser: {
      en: 'Nin’s shallow lagoon, two schools, spring and autumn wind',
      de: 'Flache Lagune von Nin, zwei Schulen, Wind im Frühling und Herbst',
      sl: 'Plitva laguna v Ninu, dve šoli, veter spomladi in jeseni',
      hr: 'Plitka ninska laguna, dvije škole, vjetar u proljeće i jesen',
      it: 'La laguna bassa di Nin, due scuole, vento in primavera e autunno',
    },
    title: {
      en: 'Why kiters and windsurfers stay here',
      de: 'Warum Kiter und Windsurfer hier wohnen',
      sl: 'Zakaj kajterji in windsurferji bivajo pri nas',
      hr: 'Zašto kiteri i windsurferi odsjedaju ovdje',
      it: 'Perché kiter e windsurfisti scelgono questa casa',
    },
    lede: {
      en: 'Learn in waist-deep water on a sandy bottom, ride the afternoon breeze, then rinse your gear in the garden and park it behind the gate.',
      de: 'Lernen im hüfttiefen Wasser auf Sandboden, nachmittags die Brise nutzen, danach die Ausrüstung im Garten abspülen und hinter dem Tor abstellen.',
      sl: 'Učite se v vodi do pasu na peščenem dnu, popoldne ujemite vetrič, nato opremo sperite na vrtu in jo shranite za dvoriščnimi vrati.',
      hr: 'Učite u vodi do pojasa na pješčanom dnu, poslijepodne uhvatite povjetarac, a zatim opremu isperite u vrtu i ostavite iza kapije.',
      it: 'Imparate con l’acqua alla vita su un fondale sabbioso, cavalcate la brezza del pomeriggio, poi sciacquate l’attrezzatura in giardino e lasciatela al sicuro oltre il cancello.',
    },
    facts: [
      {
        en: 'The nearest end of Queen’s Beach (Kraljičina plaža) is about 1.4 km on foot, around 17 minutes. Ždrijac, Nin’s kite beach, is about 5 km by bike, around 19 minutes.',
        de: 'Das nächste Ende des Königinnenstrands (Kraljičina plaža) liegt etwa 1,4 km zu Fuß entfernt, rund 17 Minuten. Ždrijac, der Kitestrand von Nin, etwa 5 km mit dem Rad, rund 19 Minuten.',
        sl: 'Najbližji konec Kraljičine plaže je približno 1,4 km peš, okoli 17 minut. Ždrijac, ninska plaža za kajtanje, je s kolesom oddaljen približno 5 km, okoli 19 minut.',
        hr: 'Najbliži kraj Kraljičine plaže udaljen je oko 1,4 km pješice, otprilike 17 minuta. Ždrijac, ninska kite plaža, udaljen je oko 5 km biciklom, otprilike 19 minuta.',
        it: 'L’estremità più vicina di Kraljičina plaža (la Spiaggia della Regina) è a circa 1,4 km a piedi (17 minuti circa). Ždrijac, la spiaggia del kite di Nin, è a circa 5 km in bici (19 minuti circa).',
        src: ['way/231022098', 'way/229300369', 'routing.openstreetmap.de'],
      },
      {
        en: 'Two schools teach here: Surfmania (windsurfing on Queen’s Beach, kitesurfing at Ždrijac, VDWS licences) and Kiteboarding Croatia, an IKO member school at Ždrijac.',
        de: 'Zwei Schulen unterrichten hier: Surfmania (Windsurfen am Königinnenstrand, Kitesurfen in Ždrijac, VDWS-Lizenzen) und Kiteboarding Croatia, eine IKO-Mitgliedsschule in Ždrijac.',
        sl: 'Tu poučujeta dve šoli: Surfmania (windsurfanje na Kraljičini plaži, kajtanje na Ždrijacu, licence VDWS) in Kiteboarding Croatia, šola članica IKO na Ždrijacu.',
        hr: 'Ovdje rade dvije škole: Surfmania (windsurf na Kraljičinoj plaži, kitesurf na Ždrijacu, VDWS licence) i Kiteboarding Croatia, škola članica IKO-a na Ždrijacu.',
        it: 'Qui insegnano due scuole: Surfmania (windsurf a Kraljičina plaža, kitesurf a Ždrijac, licenze VDWS) e Kiteboarding Croatia, scuola affiliata IKO a Ždrijac.',
        src: ['surfcenter-surfmania', 'kitesurfcenter-kiteboarding'],
      },
      {
        en: 'The lagoon is large and shallow. In summer the thermal maestral blows from the north-west at about 8–12 knots, which suits first sessions.',
        de: 'Die Lagune ist groß und flach. Im Sommer weht der thermische Maestral aus Nordwest mit etwa 8–12 Knoten, gut für die ersten Stunden.',
        sl: 'Laguna je velika in plitva. Poleti piha termični maestral s severozahoda s hitrostjo približno 8–12 vozlov, kar je kot nalašč za prve ure na vodi.',
        hr: 'Laguna je velika i plitka. Ljeti puše termički maestral sa sjeverozapada, oko 8–12 čvorova, što odgovara prvim satima na vodi.',
        it: 'La laguna è ampia e poco profonda. In estate il maestrale termico soffia da nord-ovest a circa 8–12 nodi, l’ideale per le prime uscite.',
        src: ['kitejungle', 'surfcenter-surfmania'],
      },
      {
        en: 'The Surfmania page names April, May, September and October as the months with the best wind.',
        de: 'Surfmania nennt April, Mai, September und Oktober als die Monate mit dem besten Wind.',
        sl: 'Surfmania kot mesece z najboljšim vetrom navaja april, maj, september in oktober.',
        hr: 'Surfmania kao mjesece s najboljim vjetrom navodi travanj, svibanj, rujan i listopad.',
        it: 'Surfmania indica aprile, maggio, settembre e ottobre come i mesi con il vento migliore.',
        src: ['surfcenter-surfmania'],
      },
    ],
    offers: [
      {
        status: 'yes',
        need: { en: 'Rinse kites, boards and wetsuits', de: 'Kites, Boards und Neoprens abspülen', sl: 'Spiranje kajtov, desk in neoprenov', hr: 'Ispiranje kiteova, dasaka i neoprena', it: 'Sciacquare kite, tavole e mute' },
        answer: { en: 'Outdoor shower in the garden, as listed on kroati.de.', de: 'Außendusche im Garten, laut kroati.de.', sl: 'Zunanji tuš na vrtu, kot navaja kroati.de.', hr: 'Vanjski tuš u vrtu, prema kroati.de.', it: 'Doccia esterna in giardino, come indicato su kroati.de.' },
        todo: 'confirm outdoor shower',
      },
      {
        status: 'yes',
        need: { en: 'Parking for a car with a roof box', de: 'Parkplatz für ein Auto mit Dachbox', sl: 'Parkirišče za avto s strešnim kovčkom', hr: 'Parking za auto s krovnom kutijom', it: 'Parcheggio per un’auto con box da tetto' },
        answer: { en: 'Free private parking on the gated driveway.', de: 'Kostenloser Privatparkplatz in der Einfahrt hinter dem Tor.', sl: 'Brezplačno zasebno parkirišče na dvorišču za vrati.', hr: 'Besplatan privatni parking na dvorištu iza kapije.', it: 'Parcheggio privato gratuito nel vialetto chiuso da un cancello.' },
      },
      {
        status: 'partial',
        need: { en: 'Wash and dry kit', de: 'Ausrüstung waschen und trocknen', sl: 'Pranje in sušenje opreme', hr: 'Pranje i sušenje opreme', it: 'Lavare e asciugare l’attrezzatura' },
        answer: { en: 'Apartment 1 has its own washing machine. A drying line: ask us.', de: 'Apartment 1 hat eine eigene Waschmaschine. Eine Wäscheleine: auf Anfrage.', sl: 'Apartma 1 ima svoj pralni stroj. Vrv za sušenje: vprašajte nas.', hr: 'Apartman 1 ima vlastitu perilicu rublja. Konop za sušenje: pitajte nas.', it: 'L’appartamento 1 ha una lavatrice propria. Uno stendibiancheria: chiedeteci.' },
      },
      {
        status: 'ask',
        need: { en: 'Lockable, shaded gear storage', de: 'Abschließbarer, schattiger Platz für Ausrüstung', sl: 'Zaklenjen, senčen prostor za opremo', hr: 'Zaključan prostor u hladu za opremu', it: 'Deposito chiuso a chiave e all’ombra per l’attrezzatura' },
        answer: { en: 'Ask us what we can offer for kites and boards.', de: 'Fragen Sie uns, was wir für Kites und Boards anbieten können.', sl: 'Vprašajte nas, kaj lahko ponudimo za kajte in deske.', hr: 'Pitajte nas što možemo ponuditi za kiteove i daske.', it: 'Chiedeteci cosa possiamo offrire per kite e tavole.' },
        todo: 'gear storage',
      },
      {
        status: 'ask',
        need: { en: 'Book when a wind window opens', de: 'Kurzfristig buchen, wenn der Wind passt', sl: 'Rezervacija, ko zapiha', hr: 'Rezervacija kad zapuše vjetar', it: 'Prenotare quando arriva il vento' },
        answer: {
          en: 'Short stays at short notice in spring and autumn: ask us. kroati.de and Interhome list a 5-night minimum.',
          de: 'Kurze Aufenthalte kurzfristig im Frühling und Herbst: auf Anfrage. kroati.de und Interhome nennen 5 Nächte Minimum.',
          sl: 'Kratka bivanja v zadnjem trenutku spomladi in jeseni: vprašajte nas. kroati.de in Interhome navajata najmanj 5 noči.',
          hr: 'Kraći boravci u zadnji čas u proljeće i jesen: pitajte nas. kroati.de i Interhome navode najmanje 5 noćenja.',
          it: 'Soggiorni brevi con poco preavviso in primavera e autunno: chiedeteci. kroati.de e Interhome indicano un minimo di 5 notti.',
        },
        todo: 'direct minimum stay',
      },
    ],
    season: {
      best: [4, 5, 9, 10],
      good: [6, 7, 8],
      bestLabel: { en: 'Best wind months (per Surfmania)', de: 'Beste Windmonate (laut Surfmania)', sl: 'Meseci z najboljšim vetrom (po navedbah Surfmanie)', hr: 'Mjeseci s najboljim vjetrom (prema Surfmaniji)', it: 'Mesi con il vento migliore (secondo Surfmania)' },
      goodLabel: { en: 'Gentle summer maestral, good for beginners', de: 'Sanfter Sommer-Maestral, gut für Anfänger', sl: 'Blag poletni maestral, primeren za začetnike', hr: 'Blagi ljetni maestral, dobar za početnike', it: 'Maestrale estivo leggero, adatto ai principianti' },
    },
    caveats: [
      {
        en: 'Wind is never guaranteed, and sources disagree on how strong it gets. Check the forecast before you travel.',
        de: 'Wind ist nie garantiert, und die Quellen sind sich über die Stärke uneinig. Prüfen Sie vor der Reise die Vorhersage.',
        sl: 'Veter ni nikoli zagotovljen, viri pa si niso enotni, kako močan je. Pred potovanjem preverite napoved.',
        hr: 'Vjetar nikad nije zajamčen, a izvori se ne slažu oko njegove jačine. Prije puta provjerite prognozu.',
        it: 'Il vento non è mai garantito e le fonti non concordano sulla sua intensità. Controllate le previsioni prima di partire.',
      },
      {
        en: 'Kiteboarding Croatia publishes its 2026 prices; we could not confirm Surfmania’s 2026 schedule and prices. Please check lesson times with the schools directly.',
        de: 'Kiteboarding Croatia veröffentlicht seine Preise für 2026; Zeiten und Preise von Surfmania für 2026 konnten wir nicht bestätigen. Bitte Kurszeiten direkt bei den Schulen erfragen.',
        sl: 'Kiteboarding Croatia objavlja cene za 2026; urnika in cen Surfmanie za 2026 nismo mogli potrditi. Termine tečajev preverite neposredno pri šolah.',
        hr: 'Kiteboarding Croatia objavljuje cijene za 2026.; raspored i cijene Surfmanije za 2026. nismo mogli potvrditi. Termine tečajeva provjerite izravno sa školama.',
        it: 'Kiteboarding Croatia pubblica i prezzi 2026; non abbiamo potuto confermare orari e prezzi 2026 di Surfmania. Verificate gli orari dei corsi direttamente con le scuole.',
      },
      {
        en: 'The lagoon is a protected Natura 2000 bird area. Ride only in the marked kite zones.',
        de: 'Die Lagune ist ein geschütztes Natura-2000-Vogelgebiet. Nur in den markierten Kitezonen fahren.',
        sl: 'Laguna je zavarovano območje Natura 2000 za ptice. Kajtajte le v označenih conah.',
        hr: 'Laguna je zaštićeno područje za ptice Natura 2000. Vozite samo u označenim kite zonama.',
        it: 'La laguna è un’area protetta Natura 2000 per gli uccelli. Uscite solo nelle zone kite segnalate.',
      },
    ],
  },

  'multigen-family-reunion': {
    icon: 'users',
    purpose: 'family',
    label: { en: 'Family reunions', de: 'Familientreffen', sl: 'Družinska srečanja', hr: 'Obiteljska okupljanja', it: 'Riunioni di famiglia' },
    teaser: { en: 'Four front doors, one long table at the grill', de: 'Vier Haustüren, ein langer Tisch am Grill', sl: 'Štirje vhodi, ena dolga miza ob žaru', hr: 'Četvora ulazna vrata, jedan dugi stol uz roštilj', it: 'Quattro ingressi, una lunga tavolata al barbecue' },
    title: { en: 'Four front doors, one long table', de: 'Vier Haustüren, ein langer Tisch', sl: 'Štirje vhodi, ena dolga miza', hr: 'Četvora ulazna vrata, jedan dugi stol', it: 'Quattro ingressi, una lunga tavolata' },
    lede: {
      en: 'Each household gets its own apartment with its own entrance and outdoor space. Everyone meets in the garden: grandparents on the terrace, children in the shallows, dinner at the grill.',
      de: 'Jeder Haushalt bekommt ein eigenes Apartment mit eigenem Eingang und Außenbereich. Getroffen wird sich im Garten: Großeltern auf der Terrasse, Kinder im flachen Wasser, Abendessen am Grill.',
      sl: 'Vsako gospodinjstvo dobi svoj apartma z lastnim vhodom in zunanjim prostorom. Vsi se srečajo na vrtu: stari starši na terasi, otroci v plitvini, večerja ob žaru.',
      hr: 'Svako kućanstvo dobiva vlastiti apartman s posebnim ulazom i vanjskim prostorom. Svi se nalaze u vrtu: bake i djedovi na terasi, djeca u plićaku, večera uz roštilj.',
      it: 'Ogni nucleo familiare ha il proprio appartamento, con ingresso e spazio esterno indipendenti. Ci si ritrova tutti in giardino: i nonni in terrazza, i bambini in acqua bassa, la cena al barbecue.',
    },
    facts: [
      {
        en: 'Four separate apartments in one house ({split} bedrooms), a shared grill area, Apartment 1’s own outdoor kitchen and parking on the driveway.',
        de: 'Vier getrennte Apartments in einem Haus ({split} Schlafzimmer), ein gemeinsamer Grillplatz, die eigene Außenküche von Apartment 1 und Parkplätze in der Einfahrt.',
        sl: 'Štirje ločeni apartmaji v eni hiši (spalnice: {split}), skupni prostor z žarom, lastna zunanja kuhinja apartmaja 1 in parkiranje na dvorišču.',
        hr: 'Četiri odvojena apartmana u jednoj kući (spavaće sobe: {split}), zajednički prostor s roštiljem, vlastita vanjska kuhinja apartmana 1 i parking na dvorištu.',
        it: 'Quattro appartamenti separati in un’unica casa (camere: {split}), una zona barbecue in comune, la cucina esterna dell’appartamento 1 e il parcheggio nel vialetto.',
        src: [],
      },
      {
        en: 'Shallow, sandy, warm-water beaches are within about 3 km: Sabunike Mol (a 6-minute walk), Queen’s Beach and Škrapavac, good for toddlers and grandparents.',
        de: 'Flache, sandige Strände mit warmem Wasser liegen im Umkreis von etwa 3 km: Sabunike Mol (6 Minuten zu Fuß), Königinnenstrand und Škrapavac, ideal für Kleinkinder und Großeltern.',
        sl: 'Plitve peščene plaže s toplo vodo so v radiju približno 3 km: Sabunike Mol (6 minut peš), Kraljičina plaža in Škrapavac, kot nalašč za malčke in stare starše.',
        hr: 'Plitke pješčane plaže s toplim morem nalaze se u krugu od oko 3 km: Sabunike Mol (6 minuta pješice), Kraljičina plaža i Škrapavac, idealne za malu djecu te bake i djedove.',
        it: 'Spiagge sabbiose, basse e con acqua calda entro circa 3 km: Sabunike Mol (6 minuti a piedi), Kraljičina plaža e Škrapavac, perfette per i più piccoli e per i nonni.',
        src: ['secretcroatia'],
      },
      {
        en: 'A flat 9.5 km family bike loop starts at our gate (Queen’s Beach, Nin, Solana Nin; about 30 m of climbing).',
        de: 'Eine flache, 9,5 km lange Familien-Radrunde startet an unserem Tor (Königinnenstrand, Nin, Saline Nin; etwa 30 Höhenmeter).',
        sl: 'Ravna, 9,5 km dolga družinska kolesarska pot se začne pred našimi vrati (Kraljičina plaža, Nin, Solana Nin; približno 30 m vzpona).',
        hr: 'Ravna obiteljska biciklistička tura od 9,5 km kreće od naše kapije (Kraljičina plaža, Nin, Solana Nin; oko 30 m uspona).',
        it: 'Un anello in bici per famiglie, pianeggiante, di 9,5 km parte dal nostro cancello (Kraljičina plaža, Nin, Solana Nin; circa 30 m di dislivello).',
        src: ['ZBM_2024', 'zadarbikemagic'],
      },
    ],
    offers: [
      {
        status: 'yes',
        need: { en: 'Book the whole house in one go', de: 'Das ganze Haus auf einmal buchen', sl: 'Celotna hiša naenkrat', hr: 'Cijela kuća odjednom', it: 'Prenotare tutta la casa in una volta' },
        answer: {
          en: 'Ask for all four apartments in one inquiry and get one reply.',
          de: 'Alle vier Apartments in einer Anfrage, eine Antwort.',
          sl: 'Za vse štiri apartmaje povprašajte v enem sporočilu in dobite en odgovor.',
          hr: 'Pošaljite jedan upit za sva četiri apartmana i dobijte jedan odgovor.',
          it: 'Chiedete tutti e quattro gli appartamenti con un’unica richiesta e ricevete un’unica risposta.',
        },
      },
      {
        status: 'yes',
        need: { en: 'Know who sleeps where', de: 'Wissen, wer wo schläft', sl: 'Kdo spi kje', hr: 'Tko gdje spava', it: 'Sapere chi dorme dove' },
        answer: {
          en: '{bedrooms} bedrooms with 180 cm double beds and two sofa beds: up to {max} guests.',
          de: '{bedrooms} Schlafzimmer mit 180-cm-Doppelbett und zwei Schlafsofas: bis zu {max} Gäste.',
          sl: (v) => `${count('sl', v.bedrooms, BEDROOMS_SL)} z zakonsko posteljo širine 180 cm in dva raztegljiva kavča: do ${v.max} gostov.`,
          hr: (v) => `${count('hr', v.bedrooms, BEDROOMS_HR)} s bračnim krevetom od 180 cm i dva kauča na razvlačenje: do ${count('hr', v.max, { one: 'gosta', few: 'gosta', other: 'gostiju' })}.`,
          it: (v) => `${count('it', v.bedrooms, BEDROOMS_IT)} con letto matrimoniale da 180 cm e due divani letto: fino a ${v.max} ospiti.`,
        },
      },
      {
        status: 'partial',
        need: { en: 'Few stairs for grandparents', de: 'Wenig Treppen für Großeltern', sl: 'Malo stopnic za stare starše', hr: 'Malo stepenica za bake i djedove', it: 'Poche scale per i nonni' },
        answer: {
          en: 'Apartment 1 is on the ground floor, a few steps up from the garden. The other three are upstairs.',
          de: 'Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Garten. Die anderen drei liegen oben.',
          sl: 'Apartma 1 je v pritličju, nekaj stopnic nad vrtom. Ostali trije so v nadstropju.',
          hr: 'Apartman 1 je u prizemlju, nekoliko stepenica iznad vrta. Ostala tri su na katu.',
          it: 'L’appartamento 1 è al piano terra, qualche gradino sopra il giardino. Gli altri tre sono al piano di sopra.',
        },
        todo: 'steps to Apartment 1',
      },
      {
        status: 'ask',
        need: { en: 'Cots and extra beds', de: 'Babybetten und Zustellbetten', sl: 'Otroške posteljice in dodatna ležišča', hr: 'Dječji krevetići i pomoćni ležajevi', it: 'Culle e letti aggiuntivi' },
        answer: {
          en: 'Trip.com lists no cots or extra beds. For a direct stay, and for high chairs: ask us.',
          de: 'Trip.com nennt keine Babybetten oder Zustellbetten. Für einen Direktaufenthalt und für Hochstühle: auf Anfrage.',
          sl: 'Trip.com ne navaja otroških posteljic ali dodatnih ležišč. Za neposredno bivanje in otroške stolčke: vprašajte nas.',
          hr: 'Trip.com ne navodi dječje krevetiće ni pomoćne ležajeve. Za izravni boravak i hranilice: pitajte nas.',
          it: 'Trip.com non indica culle né letti aggiuntivi. Per un soggiorno diretto, e per i seggioloni: chiedeteci.',
        },
        todo: 'cot / high chair policy for direct stays',
      },
      {
        status: 'ask',
        need: { en: 'One table for everyone', de: 'Ein Tisch für alle', sl: 'Ena miza za vse', hr: 'Jedan stol za sve', it: 'Un tavolo per tutti' },
        answer: {
          en: 'A long table for the whole family at the grill: ask us.',
          de: 'Ein langer Tisch für die ganze Familie am Grill: auf Anfrage.',
          sl: 'Dolga miza za vso družino ob žaru: vprašajte nas.',
          hr: 'Dugi stol za cijelu obitelj uz roštilj: pitajte nas.',
          it: 'Una lunga tavolata per tutta la famiglia al barbecue: chiedeteci.',
        },
        todo: 'outdoor table for 15+',
      },
    ],
    season: {
      best: [7, 8],
      good: [4, 5, 6, 9],
      bestLabel: { en: 'School holidays', de: 'Schulferien', sl: 'Šolske počitnice', hr: 'Školski praznici', it: 'Vacanze scolastiche' },
      goodLabel: {
        en: 'Easter, Whitsun, June and September: quieter, for little ones and retirees',
        de: 'Ostern, Pfingsten, Juni und September: ruhiger, für Kleine und Ruheständler',
        sl: 'Velika noč, binkošti, junij in september: mirneje, za malčke in upokojence',
        hr: 'Uskrs, Duhovi, lipanj i rujan: mirnije, za mališane i umirovljenike',
        it: 'Pasqua, Pentecoste, giugno e settembre: più tranquilli, per i piccoli e i pensionati',
      },
    },
    caveats: [
      {
        en: 'Whole-house weeks in July and August go first. Ask early.',
        de: 'Wochen mit dem ganzen Haus im Juli und August sind zuerst weg. Früh anfragen.',
        sl: 'Tedni s celo hišo julija in avgusta so oddani prvi. Povprašajte zgodaj.',
        hr: 'Tjedni s cijelom kućom u srpnju i kolovozu prvi se popune. Javite se na vrijeme.',
        it: 'Le settimane con tutta la casa a luglio e agosto vanno via per prime. Chiedete per tempo.',
      },
      {
        en: 'Our platform listings say no parties or events. Tell us what you are planning, a reunion dinner or a birthday, and we will answer honestly.',
        de: 'Laut Plattform-Inseraten sind Partys und Events nicht erlaubt. Sagen Sie uns, was Sie planen, ein Familienessen oder einen Geburtstag, und wir antworten ehrlich.',
        sl: 'Naši oglasi na platformah ne dovoljujejo zabav ali dogodkov. Povejte nam, kaj načrtujete, družinsko večerjo ali rojstni dan, in iskreno vam bomo odgovorili.',
        hr: 'Naši oglasi na platformama ne dopuštaju zabave ni događanja. Recite nam što planirate, obiteljsku večeru ili rođendan, i iskreno ćemo vam odgovoriti.',
        it: 'I nostri annunci sulle piattaforme escludono feste ed eventi. Diteci cosa avete in mente, una cena di famiglia o un compleanno, e vi risponderemo con sincerità.',
      },
    ],
  },

  'cyclists-and-clubs': {
    icon: 'bike',
    purpose: 'cycling',
    label: { en: 'Cyclists & clubs', de: 'Radfahrer & Vereine', sl: 'Kolesarji in klubi', hr: 'Biciklisti i klubovi', it: 'Ciclisti e club' },
    teaser: {
      en: 'Flat coast for base miles, the Velebit for climbing',
      de: 'Flache Küste für Grundlage, der Velebit zum Klettern',
      sl: 'Ravna obala za osnovne kilometre, Velebit za vzpone',
      hr: 'Ravna obala za bazne kilometre, Velebit za uspone',
      it: 'Costa piatta per macinare chilometri, il Velebit per le salite',
    },
    title: {
      en: 'Flat coast for base miles, the Velebit for climbing',
      de: 'Flache Küste für Grundlage, der Velebit zum Klettern',
      sl: 'Ravna obala za osnovne kilometre, Velebit za vzpone',
      hr: 'Ravna obala za bazne kilometre, Velebit za uspone',
      it: 'Costa piatta per macinare chilometri, il Velebit per le salite',
    },
    lede: {
      en: 'Spring and autumn are the quiet months here and the best for riding. Take one apartment, or all four for a club camp.',
      de: 'Frühling und Herbst sind hier die ruhigen Monate und die besten zum Radfahren. Ein Apartment, oder alle vier für ein Vereinstrainingslager.',
      sl: 'Pomlad in jesen sta tu mirni sezoni in najboljši čas za kolesarjenje. Vzemite en apartma ali vse štiri za klubske priprave.',
      hr: 'Proljeće i jesen ovdje su mirni mjeseci i najbolji za vožnju. Uzmite jedan apartman ili sva četiri za klupske pripreme.',
      it: 'Primavera e autunno sono qui i mesi tranquilli e i migliori per pedalare. Prendete un appartamento, o tutti e quattro per un ritiro del club.',
    },
    facts: [
      {
        en: 'The Zadar County bike map (Zadar Bike Magic) has routes from Privlaka, for example T&F Privlaka 1 via Sabunike (17.0 km, 72 m), MTB Vrsi 1 (15.9 km, 105 m) and Road Zadar via Vrsi and Nin (44.7 km, 181 m).',
        de: 'Die Radkarte des Bezirks Zadar (Zadar Bike Magic) hat Routen ab Privlaka, etwa T&F Privlaka 1 über Sabunike (17,0 km, 72 Hm), MTB Vrsi 1 (15,9 km, 105 Hm) und Road Zadar über Vrsi und Nin (44,7 km, 181 Hm).',
        sl: 'Kolesarski zemljevid Zadrske županije (Zadar Bike Magic) ima poti iz Privlake, na primer T&F Privlaka 1 prek Sabunik (17,0 km, 72 m), MTB Vrsi 1 (15,9 km, 105 m) in Road Zadar prek Vrsi in Nina (44,7 km, 181 m).',
        hr: 'Biciklistička karta Zadarske županije (Zadar Bike Magic) ima rute iz Privlake, npr. T&F Privlaka 1 preko Sabunika (17,0 km, 72 m), MTB Vrsi 1 (15,9 km, 105 m) i Road Zadar preko Vrsi i Nina (44,7 km, 181 m).',
        it: 'La mappa ciclistica della Contea di Zadar (Zadar Bike Magic) propone percorsi da Privlaka, ad esempio T&F Privlaka 1 via Sabunike (17,0 km, 72 m), MTB Vrsi 1 (15,9 km, 105 m) e Road Zadar via Vrsi e Nin (44,7 km, 181 m).',
        src: ['ZBM_2024'],
      },
      {
        en: 'On the Velebit: the historic Majstorska cesta, finished in 1832 and designed for at most 5.5 % gradient, and the 1,044 m Mali Alan pass, gravel on its upper section according to riders.',
        de: 'Am Velebit: die historische Majstorska cesta, 1832 fertiggestellt und für höchstens 5,5 % Steigung angelegt, und der 1.044 m hohe Mali-Alan-Pass, laut Radfahrern oben geschottert.',
        sl: 'Na Velebitu: zgodovinska Majstorska cesta, dokončana leta 1832 in zasnovana z naklonom največ 5,5 %, ter 1.044 m visok prelaz Mali Alan, ki je po poročanju kolesarjev v zgornjem delu makadamski.',
        hr: 'Na Velebitu: povijesna Majstorska cesta, dovršena 1832. i projektirana za nagib od najviše 5,5 %, te prijevoj Mali Alan na 1.044 m, prema biciklistima makadamski na gornjem dijelu.',
        it: 'Sul Velebit: la storica Majstorska cesta, completata nel 1832 e progettata per una pendenza massima del 5,5 %, e il passo Mali Alan a 1.044 m, sterrato nella parte alta secondo chi lo ha percorso.',
        src: ['pp-velebit', 'quaeldich'],
      },
      {
        en: 'Spring and autumn suit riding: the mean air temperature in Zadar is about 13 °C in April and 17 °C in October.',
        de: 'Frühling und Herbst passen zum Radfahren: Die mittlere Lufttemperatur in Zadar liegt im April bei etwa 13 °C, im Oktober bei 17 °C.',
        sl: 'Pomlad in jesen sta kot nalašč za kolesarjenje: povprečna temperatura zraka v Zadru je aprila približno 13 °C, oktobra 17 °C.',
        hr: 'Proljeće i jesen pogoduju vožnji: srednja temperatura zraka u Zadru u travnju je oko 13 °C, a u listopadu 17 °C.',
        it: 'Primavera e autunno sono ideali per pedalare: la temperatura media dell’aria a Zadar è di circa 13 °C ad aprile e 17 °C a ottobre.',
        src: ['climate-zone'],
      },
    ],
    offers: [
      {
        status: 'yes',
        need: { en: 'Room for the whole club', de: 'Platz für den ganzen Verein', sl: 'Prostor za ves klub', hr: 'Mjesta za cijeli klub', it: 'Spazio per tutto il club' },
        answer: {
          en: 'All four apartments: {bedrooms} bedrooms, up to {max} riders including sofa beds.',
          de: 'Alle vier Apartments: {bedrooms} Schlafzimmer, bis zu {max} Personen inklusive Schlafsofas.',
          sl: (v) => `Vsi štirje apartmaji: ${count('sl', v.bedrooms, BEDROOMS_SL)}, do ${v.max} kolesarjev skupaj z raztegljivimi kavči.`,
          hr: (v) => `Sva četiri apartmana: ${count('hr', v.bedrooms, BEDROOMS_HR)}, do ${v.max} biciklista uključujući kauče na razvlačenje.`,
          it: (v) => `Tutti e quattro gli appartamenti: ${count('it', v.bedrooms, BEDROOMS_IT)}, fino a ${v.max} ciclisti divani letto compresi.`,
        },
      },
      {
        status: 'yes',
        need: { en: 'Cook big meals', de: 'Große Portionen kochen', sl: 'Kuhanje za veliko lačnih ust', hr: 'Kuhanje velikih obroka', it: 'Cucinare per tanti' },
        answer: {
          en: 'Every apartment has its own kitchen or kitchenette, and there is a grill in the garden.',
          de: 'Jedes Apartment hat eine eigene Küche oder Küchenzeile, dazu der Grill im Garten.',
          sl: 'Vsak apartma ima svojo kuhinjo ali čajno kuhinjo, na vrtu pa je žar.',
          hr: 'Svaki apartman ima vlastitu kuhinju ili čajnu kuhinju, a u vrtu je roštilj.',
          it: 'Ogni appartamento ha la propria cucina o angolo cottura, e in giardino c’è il barbecue.',
        },
      },
      {
        status: 'partial',
        need: { en: 'Rinse bikes, wash kit', de: 'Räder abspülen, Kleidung waschen', sl: 'Spiranje koles, pranje opreme', hr: 'Pranje bicikala i opreme', it: 'Lavare bici e abbigliamento' },
        answer: {
          en: 'Outdoor shower in the garden; Apartment 1 has a washing machine.',
          de: 'Außendusche im Garten; Apartment 1 hat eine Waschmaschine.',
          sl: 'Zunanji tuš na vrtu; apartma 1 ima pralni stroj.',
          hr: 'Vanjski tuš u vrtu; apartman 1 ima perilicu rublja.',
          it: 'Doccia esterna in giardino; l’appartamento 1 ha la lavatrice.',
        },
        todo: 'confirm outdoor shower',
      },
      {
        status: 'ask',
        need: { en: 'Lockable bike storage', de: 'Abschließbarer Radraum', sl: 'Zaklenjen prostor za kolesa', hr: 'Zaključano spremište za bicikle', it: 'Deposito bici chiuso a chiave' },
        answer: {
          en: 'Ask us; we will describe exactly what we have.',
          de: 'Fragen Sie uns; wir beschreiben genau, was es gibt.',
          sl: 'Vprašajte nas; natančno vam bomo opisali, kaj imamo.',
          hr: 'Pitajte nas; točno ćemo vam opisati što imamo.',
          it: 'Chiedeteci: vi descriveremo esattamente cosa abbiamo.',
        },
        todo: 'bike storage, workstand, tools',
      },
      {
        status: 'ask',
        need: { en: 'Airport transfer with bike boxes', de: 'Flughafentransfer mit Radkoffern', sl: 'Letališki prevoz s kovčki za kolesa', hr: 'Transfer iz zračne luke s kutijama za bicikle', it: 'Transfer dall’aeroporto con le valigie bici' },
        answer: {
          en: 'Ask us about a van for the group.',
          de: 'Fragen Sie uns nach einem Transporter für die Gruppe.',
          sl: 'Vprašajte nas za kombi za skupino.',
          hr: 'Pitajte nas za kombi za grupu.',
          it: 'Chiedeteci di un furgone per il gruppo.',
        },
      },
    ],
    season: {
      best: [4, 5, 10],
      good: [3, 9, 11],
      bestLabel: { en: 'Prime riding months, quiet roads', de: 'Beste Radmonate, ruhige Straßen', sl: 'Najboljši meseci za kolesarjenje, mirne ceste', hr: 'Najbolji mjeseci za vožnju, mirne ceste', it: 'I mesi migliori per pedalare, strade tranquille' },
      goodLabel: { en: 'Good riding, cooler or busier', de: 'Gutes Radwetter, kühler oder voller', sl: 'Dobro za kolesarjenje, a hladneje ali bolj živahno', hr: 'Dobro za vožnju, ali svježije ili s više prometa', it: 'Buono per pedalare, più fresco o più affollato' },
    },
    caveats: [
      {
        en: 'Parts of the Velebit backcountry are still suspected minefields. Stay on paved roads and marked routes, respect warning signs and check MINE.info before going off-road.',
        de: 'Teile des Velebit-Hinterlands gelten noch als minenverdächtig. Auf asphaltierten Straßen und markierten Routen bleiben, Warnschilder beachten und vor Offroad-Touren MINE.info prüfen.',
        sl: 'Deli velebitskega zaledja so še vedno minsko sumljiva območja. Ostanite na asfaltiranih cestah in označenih poteh, upoštevajte opozorilne table in pred vožnjo po brezpotjih preverite MINE.info.',
        hr: 'Dijelovi velebitskog zaleđa još su minski sumnjiva područja. Držite se asfaltiranih cesta i označenih ruta, poštujte znakove upozorenja i prije vožnje izvan cesta provjerite MINE.info.',
        it: 'Alcune zone dell’entroterra del Velebit sono ancora sospettate di essere minate. Restate su strade asfaltate e percorsi segnalati, rispettate i cartelli di pericolo e consultate MINE.info prima di andare fuoristrada.',
      },
      {
        en: 'Zadar Airport is mainly seasonal. For March or November camps, also check flights to Split or Zagreb.',
        de: 'Der Flughafen Zadar ist vor allem saisonal. Für Camps im März oder November auch Flüge nach Split oder Zagreb prüfen.',
        sl: 'Letališče Zadar deluje predvsem sezonsko. Za priprave marca ali novembra preverite tudi lete v Split ali Zagreb.',
        hr: 'Zračna luka Zadar uglavnom radi sezonski. Za pripreme u ožujku ili studenom provjerite i letove za Split ili Zagreb.',
        it: 'L’aeroporto di Zadar è soprattutto stagionale. Per ritiri a marzo o novembre controllate anche i voli per Split o Zagreb.',
      },
      {
        en: 'The Mali Alan road surface can be unpaved or broken; not every road bike will enjoy it.',
        de: 'Die Straße über den Mali Alan kann unbefestigt oder kaputt sein; nicht jedes Rennrad mag das.',
        sl: 'Cestišče čez Mali Alan je lahko neasfaltirano ali poškodovano; ni za vsako cestno kolo.',
        hr: 'Cesta preko Malog Alana može biti neasfaltirana ili oštećena; ne odgovara svakom cestovnom biciklu.',
        it: 'Il fondo stradale del Mali Alan può essere sterrato o dissestato; non tutte le bici da corsa lo apprezzeranno.',
      },
    ],
  },

  'remote-workers-monthly': {
    icon: 'laptop',
    purpose: 'remote',
    label: { en: 'Remote work', de: 'Remote-Arbeit', sl: 'Delo na daljavo', hr: 'Rad na daljinu', it: 'Lavoro da remoto' },
    teaser: { en: 'A month by the Adriatic, October to May', de: 'Ein Monat an der Adria, Oktober bis Mai', sl: 'Mesec dni ob Jadranu, od oktobra do maja', hr: 'Mjesec dana na Jadranu, od listopada do svibnja', it: 'Un mese sull’Adriatico, da ottobre a maggio' },
    title: { en: 'A month by the sea, in the quiet season', de: 'Ein Monat am Meer, in der ruhigen Saison', sl: 'Mesec dni ob morju, v mirni sezoni', hr: 'Mjesec dana uz more, u mirnoj sezoni', it: 'Un mese al mare, nella stagione tranquilla' },
    lede: {
      en: 'From October to May the house is calm and Zadar is half an hour away. Ask us about a monthly rate.',
      de: 'Von Oktober bis Mai ist es im Haus ruhig, und Zadar ist eine halbe Stunde entfernt. Fragen Sie uns nach einem Monatspreis.',
      sl: 'Od oktobra do maja je v hiši mirno, Zadar pa je oddaljen pol ure. Vprašajte nas za mesečno ceno.',
      hr: 'Od listopada do svibnja u kući je mirno, a Zadar je udaljen pola sata. Pitajte nas za mjesečnu cijenu.',
      it: 'Da ottobre a maggio la casa è tranquilla e Zadar è a mezz’ora. Chiedeteci una tariffa mensile.',
    },
    facts: [
      {
        en: 'Croatia grants non-EU/EEA digital nomads a temporary stay of up to 18 months. In 2026 the requirement is at least €3,622.50 a month, or €43,470 in savings for 12 months.',
        de: 'Kroatien gewährt digitalen Nomaden aus Nicht-EU/EWR-Staaten einen befristeten Aufenthalt von bis zu 18 Monaten. 2026 sind mindestens 3.622,50 € im Monat oder 43.470 € Ersparnisse für 12 Monate nötig.',
        sl: 'Hrvaška digitalnim nomadom iz držav zunaj EU/EGP odobri začasno bivanje do 18 mesecev. Leta 2026 je pogoj najmanj 3.622,50 € na mesec ali 43.470 € prihrankov za 12 mesecev.',
        hr: 'Hrvatska digitalnim nomadima iz zemalja izvan EU-a/EGP-a odobrava privremeni boravak do 18 mjeseci. U 2026. uvjet je najmanje 3.622,50 € mjesečno ili 43.470 € ušteđevine za 12 mjeseci.',
        it: 'La Croazia concede ai nomadi digitali extra UE/SEE un soggiorno temporaneo fino a 18 mesi. Nel 2026 il requisito è di almeno 3.622,50 € al mese, oppure 43.470 € di risparmi per 12 mesi.',
        src: ['mup.gov.hr', 'wiki.private.law'],
      },
      {
        en: 'After arrival you register your address within 3 days, with a lease contract or an owner statement. That is possible with a direct booking, not with a platform booking.',
        de: 'Nach der Ankunft melden Sie Ihre Adresse innerhalb von 3 Tagen an, mit Mietvertrag oder Erklärung des Eigentümers. Das geht bei einer Direktbuchung, nicht bei einer Plattformbuchung.',
        sl: 'Po prihodu morate v 3 dneh prijaviti naslov, z najemno pogodbo ali izjavo lastnika. To je mogoče pri neposredni rezervaciji, ne pa pri rezervaciji prek platforme.',
        hr: 'Nakon dolaska u roku od 3 dana prijavljujete adresu, uz ugovor o najmu ili izjavu vlasnika. To je moguće uz izravnu rezervaciju, ali ne i uz rezervaciju preko platforme.',
        it: 'Dopo l’arrivo dovete registrare l’indirizzo entro 3 giorni, con un contratto di locazione o una dichiarazione del proprietario. È possibile con una prenotazione diretta, non con una prenotazione tramite piattaforma.',
        src: ['mup.gov.hr', 'wiki.private.law'],
      },
      {
        en: 'COIN coworking in Zadar (Put Murvice 16, about 35 workstations) is within driving distance.',
        de: 'Der Coworking-Space COIN in Zadar (Put Murvice 16, etwa 35 Arbeitsplätze) ist mit dem Auto gut erreichbar.',
        sl: 'Coworking COIN v Zadru (Put Murvice 16, približno 35 delovnih mest) je z avtom hitro dosegljiv.',
        hr: 'Coworking COIN u Zadru (Put Murvice 16, oko 35 radnih mjesta) lako je dostupan autom.',
        it: 'Il coworking COIN a Zadar (Put Murvice 16, circa 35 postazioni) è comodamente raggiungibile in auto.',
        src: ['freakingnomads', 'coworker.com'],
      },
    ],
    offers: [
      {
        status: 'partial',
        need: { en: 'Fast, reliable internet', de: 'Schnelles, stabiles Internet', sl: 'Hiter, zanesljiv internet', hr: 'Brz, pouzdan internet', it: 'Internet veloce e affidabile' },
        answer: {
          en: 'Wi-Fi in every apartment. Measured download and upload speed: ask us.',
          de: 'WLAN in jedem Apartment. Gemessene Download- und Upload-Werte: auf Anfrage.',
          sl: 'Wi-Fi v vsakem apartmaju. Izmerjena hitrost prenosa in nalaganja: vprašajte nas.',
          hr: 'Wi-Fi u svakom apartmanu. Izmjerena brzina preuzimanja i slanja: pitajte nas.',
          it: 'Wi-Fi in ogni appartamento. Velocità misurata in download e upload: chiedeteci.',
        },
        todo: 'speed test per apartment',
      },
      {
        status: 'partial',
        need: { en: 'Warm in winter', de: 'Warm im Winter', sl: 'Toplo pozimi', hr: 'Toplo zimi', it: 'Caldo d’inverno' },
        answer: {
          en: 'Heating is listed on kroati.de, air conditioning on Interhome (“in part”). How warm the apartments stay in winter: ask us.',
          de: 'Heizung ist auf kroati.de angegeben, Klimaanlage bei Interhome („teilweise“). Wie warm es im Winter bleibt: auf Anfrage.',
          sl: 'Ogrevanje navaja kroati.de, klimatsko napravo Interhome (»deloma«). Kako toplo je pozimi v apartmajih: vprašajte nas.',
          hr: 'Grijanje navodi kroati.de, klimu Interhome („djelomično”). Koliko je toplo u apartmanima zimi: pitajte nas.',
          it: 'Il riscaldamento è indicato su kroati.de, l’aria condizionata su Interhome («in parte»). Quanto restano caldi gli appartamenti d’inverno: chiedeteci.',
        },
        todo: 'winter heating per apartment',
      },
      {
        status: 'ask',
        need: { en: 'A real desk and chair', de: 'Ein richtiger Schreibtisch und Stuhl', sl: 'Prava pisalna miza in stol', hr: 'Pravi radni stol i stolica', it: 'Una vera scrivania con sedia' },
        answer: {
          en: 'Ask us which apartment has the best work spot.',
          de: 'Fragen Sie uns, welches Apartment den besten Arbeitsplatz hat.',
          sl: 'Vprašajte nas, kateri apartma ima najboljši delovni kotiček.',
          hr: 'Pitajte nas koji apartman ima najbolji kutak za rad.',
          it: 'Chiedeteci quale appartamento ha la postazione di lavoro migliore.',
        },
        todo: 'desk & chair',
      },
      {
        status: 'ask',
        need: { en: 'Lease contract for address registration', de: 'Mietvertrag für die Anmeldung', sl: 'Najemna pogodba za prijavo naslova', hr: 'Ugovor o najmu za prijavu adrese', it: 'Contratto di locazione per registrare l’indirizzo' },
        answer: {
          en: 'Ask us before you apply for the permit.',
          de: 'Fragen Sie uns, bevor Sie die Genehmigung beantragen.',
          sl: 'Vprašajte nas, preden zaprosite za dovoljenje.',
          hr: 'Pitajte nas prije nego što podnesete zahtjev za dozvolu.',
          it: 'Chiedeteci prima di presentare la domanda di permesso.',
        },
        todo: 'lease contract for MUP registration',
      },
      {
        status: 'ask',
        need: { en: 'Monthly rate with utilities', de: 'Monatspreis inkl. Nebenkosten', sl: 'Mesečna cena s stroški', hr: 'Mjesečna cijena s režijama', it: 'Tariffa mensile con utenze' },
        answer: {
          en: 'Ask us for a monthly price for your dates.',
          de: 'Fragen Sie uns nach einem Monatspreis für Ihre Termine.',
          sl: 'Vprašajte nas za mesečno ceno za vaše termine.',
          hr: 'Pitajte nas za mjesečnu cijenu za vaše termine.',
          it: 'Chiedeteci un prezzo mensile per le vostre date.',
        },
        todo: 'monthly rates',
      },
    ],
    season: {
      best: [10, 11, 3, 4, 5],
      good: [12, 1, 2],
      bestLabel: { en: 'Mild and quiet', de: 'Mild und ruhig', sl: 'Milo in mirno', hr: 'Blago i mirno', it: 'Mite e tranquillo' },
      goodLabel: { en: 'Quiet winter months', de: 'Ruhige Wintermonate', sl: 'Mirni zimski meseci', hr: 'Mirni zimski mjeseci', it: 'Mesi invernali tranquilli' },
    },
    caveats: [
      {
        en: 'Internet speed and winter comfort are not measured yet. We will tell you honestly before you book.',
        de: 'Internetgeschwindigkeit und Komfort im Winter sind noch nicht gemessen. Wir sagen es Ihnen ehrlich vor der Buchung.',
        sl: 'Hitrosti interneta in udobja pozimi še nismo izmerili. Pred rezervacijo vam bomo iskreno povedali, kako je.',
        hr: 'Brzinu interneta i udobnost zimi još nismo izmjerili. Iskreno ćemo vam reći prije rezervacije.',
        it: 'Velocità di internet e comfort invernale non sono ancora stati misurati. Ve lo diremo con sincerità prima della prenotazione.',
      },
      {
        en: 'EU and EEA citizens do not need the digital nomad permit; the rules above are for everyone else. Check the current rules on the Croatian Ministry of the Interior (MUP) website before you apply.',
        de: 'EU- und EWR-Bürger brauchen die Nomaden-Genehmigung nicht; die Regeln oben gelten für alle anderen. Prüfen Sie die aktuellen Regeln vor dem Antrag auf der Website des kroatischen Innenministeriums (MUP).',
        sl: 'Državljani EU in EGP dovoljenja za digitalne nomade ne potrebujejo; zgornja pravila veljajo za vse druge. Pred vlogo preverite veljavna pravila na spletni strani hrvaškega ministrstva za notranje zadeve (MUP).',
        hr: 'Državljanima EU-a i EGP-a dozvola za digitalne nomade nije potrebna; gornja pravila vrijede za sve ostale. Prije podnošenja zahtjeva provjerite važeća pravila na stranicama Ministarstva unutarnjih poslova (MUP).',
        it: 'I cittadini UE e SEE non hanno bisogno del permesso per nomadi digitali; le regole qui sopra valgono per tutti gli altri. Prima di fare domanda verificate le regole in vigore sul sito del Ministero dell’Interno croato (MUP).',
      },
      {
        en: 'Liburnija buses run from Zadar to Privlaka (about 14 on weekdays, 3 at weekends), with a stop about 430 m from the house; for day trips a car is much easier.',
        de: 'Liburnija-Busse fahren von Zadar nach Privlaka (werktags etwa 14, am Wochenende 3), mit einer Haltestelle etwa 430 m vom Haus; für Tagesausflüge ist ein Auto viel einfacher.',
        sl: 'Avtobusi Liburnija vozijo iz Zadra v Privlako (ob delavnikih približno 14, ob koncih tedna 3), postajališče je približno 430 m od hiše; za izlete je avto veliko bolj praktičen.',
        hr: 'Autobusi Liburnije voze od Zadra do Privlake (radnim danom oko 14, vikendom 3), sa stanicom oko 430 m od kuće; za izlete je auto puno praktičniji.',
        it: 'Gli autobus Liburnija collegano Zadar a Privlaka (circa 14 corse nei giorni feriali, 3 nel fine settimana), con una fermata a circa 430 m dalla casa; per le gite l’auto è molto più comoda.',
      },
    ],
  },

  'healing-mud-wellness-seniors': {
    icon: 'wave',
    purpose: 'other',
    label: { en: 'Healing mud & slow stays', de: 'Heilschlamm & ruhige Aufenthalte', sl: 'Zdravilno blato in počasno bivanje', hr: 'Ljekovito blato i opušteni boravci', it: 'Fango curativo e soggiorni lenti' },
    teaser: { en: 'Nin’s lagoon mud, and long quiet stays', de: 'Heilschlamm in Nin und lange, ruhige Aufenthalte', sl: 'Blato ninske lagune in dolga, mirna bivanja', hr: 'Blato ninske lagune i dugi, mirni boravci', it: 'Il fango della laguna di Nin e lunghi soggiorni tranquilli' },
    title: { en: 'Nin’s lagoon mud, a short walk away', de: 'Der Schlamm der Lagune von Nin, ein kurzer Spaziergang', sl: 'Blato ninske lagune, le kratek sprehod stran', hr: 'Blato ninske lagune, na kratkoj šetnji od kuće', it: 'Il fango della laguna di Nin, a una breve passeggiata' },
    lede: {
      en: 'A local summer tradition for generations, and a quiet base for long, slow stays in spring and autumn.',
      de: 'Eine örtliche Sommertradition seit Generationen und ein ruhiger Ort für lange Aufenthalte im Frühling und Herbst.',
      sl: 'Lokalna poletna tradicija že več generacij in miren kraj za dolga, počasna bivanja spomladi in jeseni.',
      hr: 'Lokalna ljetna tradicija stara generacijama i miran kutak za duge, opuštene boravke u proljeće i jesen.',
      it: 'Una tradizione estiva locale da generazioni e una base tranquilla per lunghi soggiorni lenti in primavera e autunno.',
    },
    facts: [
      {
        en: 'The Nin lagoon beside Queen’s Beach is described as the largest healing-mud (peloid) site in Croatia. Nin was listed as a thalassotherapy resort in 1960, and local use of the mud is much older.',
        de: 'Die Lagune von Nin am Königinnenstrand gilt als größtes Heilschlamm-Vorkommen (Peloid) Kroatiens. 1960 wurde Nin als Thalassotherapie-Kurort eingestuft, die örtliche Nutzung des Schlamms ist viel älter.',
        sl: 'Ninska laguna ob Kraljičini plaži velja za največje nahajališče zdravilnega blata (peloida) na Hrvaškem. Nin je bil leta 1960 razglašen za talasoterapevtsko zdravilišče, domačini pa blato uporabljajo že veliko dlje.',
        hr: 'Ninska laguna uz Kraljičinu plažu opisuje se kao najveće nalazište ljekovitog blata (peloida) u Hrvatskoj. Nin je 1960. uvršten među lječilišta za talasoterapiju, a mještani blato koriste mnogo dulje.',
        it: 'La laguna di Nin accanto a Kraljičina plaža è descritta come il più grande giacimento di fango curativo (peloide) della Croazia. Nin è stata riconosciuta località di talassoterapia nel 1960, ma l’uso locale del fango è molto più antico.',
        src: ['zaton.hr', 'novilist'],
      },
      {
        en: 'Two sources report a supervised peloid therapy season run by Zadar General Hospital staff at Nin from early July to 31 August. Courses usually last 10–20 days.',
        de: 'Zwei Quellen berichten von einer betreuten Peloid-Therapiesaison durch Personal des Allgemeinkrankenhauses Zadar in Nin, Anfang Juli bis 31. August. Kuren dauern meist 10–20 Tage.',
        sl: 'Dva vira poročata o nadzorovani sezoni peloidne terapije, ki jo v Ninu vodi osebje Splošne bolnišnice Zadar od začetka julija do 31. avgusta. Kure običajno trajajo 10–20 dni.',
        hr: 'Dva izvora navode nadziranu sezonu peloidne terapije koju u Ninu vodi osoblje Opće bolnice Zadar, od početka srpnja do 31. kolovoza. Tretmani obično traju 10–20 dana.',
        it: 'Due fonti riportano una stagione di peloidoterapia assistita dal personale dell’Ospedale generale di Zadar a Nin, da inizio luglio al 31 agosto. I cicli durano di solito 10–20 giorni.',
        src: ['novilist', 'camping.info'],
      },
      {
        en: 'The mud is traditionally used for rheumatic, joint and skin complaints. These are traditional claims; we found no clinical trial of Nin mud.',
        de: 'Der Schlamm wird traditionell bei rheumatischen, Gelenk- und Hautbeschwerden genutzt. Das sind überlieferte Angaben; eine klinische Studie zum Schlamm von Nin haben wir nicht gefunden.',
        sl: 'Blato se tradicionalno uporablja pri revmatičnih težavah ter težavah s sklepi in kožo. To so ljudska izročila; klinične študije o ninskem blatu nismo našli.',
        hr: 'Blato se tradicionalno koristi kod reumatskih tegoba te tegoba sa zglobovima i kožom. To su tradicionalne tvrdnje; kliničko ispitivanje ninskog blata nismo pronašli.',
        it: 'Il fango è usato tradizionalmente per disturbi reumatici, articolari e della pelle. Si tratta di indicazioni tradizionali: non abbiamo trovato studi clinici sul fango di Nin.',
        src: ['hrcak', 'tportal'],
      },
    ],
    offers: [
      {
        status: 'partial',
        need: { en: 'Rinse off the mud', de: 'Den Schlamm abspülen', sl: 'Spiranje blata', hr: 'Ispiranje blata', it: 'Sciacquarsi dal fango' },
        answer: { en: 'Outdoor shower in the garden, as listed on kroati.de.', de: 'Außendusche im Garten, laut kroati.de.', sl: 'Zunanji tuš na vrtu, kot navaja kroati.de.', hr: 'Vanjski tuš u vrtu, prema kroati.de.', it: 'Doccia esterna in giardino, come indicato su kroati.de.' },
        todo: 'confirm outdoor shower',
      },
      {
        status: 'partial',
        need: { en: 'Few steps', de: 'Wenige Stufen', sl: 'Malo stopnic', hr: 'Malo stepenica', it: 'Pochi gradini' },
        answer: {
          en: 'Apartment 1 is on the ground floor, a few steps up from the garden.',
          de: 'Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Garten.',
          sl: 'Apartma 1 je v pritličju, nekaj stopnic nad vrtom.',
          hr: 'Apartman 1 je u prizemlju, nekoliko stepenica iznad vrta.',
          it: 'L’appartamento 1 è al piano terra, qualche gradino sopra il giardino.',
        },
        todo: 'steps to Apartment 1',
      },
      {
        status: 'ask',
        need: { en: 'A 2–3 week stay', de: 'Ein Aufenthalt von 2–3 Wochen', sl: 'Bivanje za 2–3 tedne', hr: 'Boravak od 2–3 tjedna', it: 'Un soggiorno di 2–3 settimane' },
        answer: {
          en: 'Ask us for a long-stay price that matches a mud course.',
          de: 'Fragen Sie uns nach einem Preis für einen längeren Aufenthalt passend zur Kur.',
          sl: 'Vprašajte nas za ceno daljšega bivanja, usklajeno s kuro.',
          hr: 'Pitajte nas za cijenu duljeg boravka usklađenu s terapijom.',
          it: 'Chiedeteci un prezzo per un soggiorno lungo in linea con il ciclo di fanghi.',
        },
        todo: 'long-stay rates',
      },
    ],
    season: {
      best: [7, 8],
      good: [5, 6, 9, 10],
      bestLabel: { en: 'Supervised mud season (2026 dates unconfirmed)', de: 'Betreute Schlammsaison (Termine 2026 unbestätigt)', sl: 'Nadzorovana sezona blata (termini za 2026 niso potrjeni)', hr: 'Nadzirana sezona blata (termini za 2026. nisu potvrđeni)', it: 'Stagione dei fanghi assistita (date 2026 non confermate)' },
      goodLabel: { en: 'Quiet, mild long stays', de: 'Ruhige, milde Langzeitaufenthalte', sl: 'Mirna, mila daljša bivanja', hr: 'Mirni, blagi dulji boravci', it: 'Soggiorni lunghi, miti e tranquilli' },
    },
    caveats: [
      {
        en: 'Ask your doctor first. Mud therapy is not recommended for everyone, for example with heart conditions or high blood pressure.',
        de: 'Fragen Sie zuerst Ihren Arzt. Schlammtherapie ist nicht für jeden geeignet, etwa bei Herzerkrankungen oder Bluthochdruck.',
        sl: 'Najprej se posvetujte z zdravnikom. Terapija z blatom ni priporočljiva za vse, na primer pri srčnih boleznih ali visokem krvnem tlaku.',
        hr: 'Najprije pitajte svog liječnika. Terapija blatom ne preporučuje se svima, npr. kod srčanih bolesti ili visokog tlaka.',
        it: 'Chiedete prima al vostro medico. La fangoterapia non è consigliata a tutti, ad esempio in caso di problemi cardiaci o pressione alta.',
      },
      {
        en: 'The 2026 therapy dates, prices and referral rules are not confirmed.',
        de: 'Termine, Preise und Überweisungsregeln für 2026 sind nicht bestätigt.',
        sl: 'Termini, cene in pravila napotitve za terapijo v 2026 niso potrjeni.',
        hr: 'Termini, cijene i pravila o uputnicama za terapiju u 2026. nisu potvrđeni.',
        it: 'Date, prezzi e regole per l’impegnativa della terapia 2026 non sono confermati.',
      },
      {
        en: 'The lagoon is a protected area; digging or taking mud may be restricted.',
        de: 'Die Lagune ist geschützt; Graben oder Mitnehmen von Schlamm kann eingeschränkt sein.',
        sl: 'Laguna je zavarovano območje; kopanje ali odnašanje blata je lahko omejeno.',
        hr: 'Laguna je zaštićeno područje; kopanje ili odnošenje blata može biti ograničeno.',
        it: 'La laguna è un’area protetta: scavare o portare via il fango può essere soggetto a limitazioni.',
      },
    ],
  },

  'birders-nature-photographers': {
    icon: 'bird',
    purpose: 'other',
    label: { en: 'Birders & photographers', de: 'Vogelbeobachter & Fotografen', sl: 'Opazovalci ptic in fotografi', hr: 'Promatrači ptica i fotografi', it: 'Birdwatcher e fotografi' },
    teaser: { en: '158 species at the Nin salt pans, 3 km away', de: '158 Arten in der Saline Nin, 3 km entfernt', sl: '158 vrst v Solani Nin, 3 km stran', hr: '158 vrsta na Solani Nin, 3 km od kuće', it: '158 specie alle saline di Nin, a 3 km' },
    title: { en: '158 bird species, 3 km from your bed', de: '158 Vogelarten, 3 km von Ihrem Bett', sl: '158 vrst ptic, 3 km od vaše postelje', hr: '158 vrsta ptica, 3 km od vašeg kreveta', it: '158 specie di uccelli, a 3 km dal vostro letto' },
    lede: {
      en: 'Stilts and Kentish plovers by day, a quiet terrace in the evening: a spring and autumn base for birding and landscape photography.',
      de: 'Stelzenläufer und Seeregenpfeifer am Tag, eine ruhige Terrasse am Abend: ein Standort für Vogelbeobachtung und Landschaftsfotografie im Frühling und Herbst.',
      sl: 'Polojniki in beločeli deževniki podnevi, mirna terasa zvečer: izhodišče za opazovanje ptic in krajinsko fotografijo spomladi in jeseni.',
      hr: 'Vlastelice i morski kulici danju, mirna terasa navečer: baza za promatranje ptica i pejzažnu fotografiju u proljeće i jesen.',
      it: 'Cavalieri d’Italia e fratini di giorno, una terrazza tranquilla la sera: una base per birdwatching e fotografia di paesaggio in primavera e autunno.',
    },
    facts: [
      {
        en: 'The Solana Nin salt pans are about 3.3 km away, and part of the saltworks is an ornithological reserve.',
        de: 'Die Saline Nin liegt etwa 3,3 km entfernt, ein Teil davon ist ornithologisches Reservat.',
        sl: 'Soline Solana Nin so oddaljene približno 3,3 km, del solin pa je ornitološki rezervat.',
        hr: 'Solana Nin udaljena je oko 3,3 km, a dio solane je ornitološki rezervat.',
        it: 'Le saline di Solana Nin sono a circa 3,3 km e una parte è riserva ornitologica.',
        src: ['solananin.hr/en/nature/wildlife', 'relation/9904654'],
      },
      {
        en: 'The saltworks record 158 species (2019), 41 of them endangered, including black-winged stilt, little egret, Kentish plover and kingfisher.',
        de: 'In der Saline sind 158 Arten erfasst (2019), 41 davon gefährdet, darunter Stelzenläufer, Seidenreiher, Seeregenpfeifer und Eisvogel.',
        sl: 'V solinah so zabeležili 158 vrst (2019), od tega 41 ogroženih, med njimi polojnika, malo belo čapljo, beločelega deževnika in vodomca.',
        hr: 'Na solani je zabilježeno 158 vrsta (2019.), od toga 41 ugrožena, među njima vlastelica, mala bijela čaplja, morski kulik i vodomar.',
        it: 'Nelle saline sono state censite 158 specie (2019), 41 delle quali minacciate, tra cui cavaliere d’Italia, garzetta, fratino e martin pescatore.',
        src: ['solananin.hr/en/nature/wildlife'],
      },
      {
        en: 'Birdingplaces.eu recommends the observation platform on the west side, with small parking and the best light in the late afternoon. Spring and autumn migration are the peak seasons.',
        de: 'Birdingplaces.eu empfiehlt die Beobachtungsplattform auf der Westseite mit kleinem Parkplatz; das beste Licht ist am späten Nachmittag. Hauptsaison sind Frühjahrs- und Herbstzug.',
        sl: 'Birdingplaces.eu priporoča opazovalno ploščad na zahodni strani z majhnim parkiriščem; najboljša svetloba je pozno popoldne. Vrhunec sezone sta spomladanska in jesenska selitev.',
        hr: 'Birdingplaces.eu preporučuje promatračku platformu na zapadnoj strani s malim parkiralištem; najbolje svjetlo je kasno poslijepodne. Vrhunac sezone su proljetna i jesenska selidba.',
        it: 'Birdingplaces.eu consiglia la piattaforma di osservazione sul lato ovest, con un piccolo parcheggio e la luce migliore nel tardo pomeriggio. Le migrazioni di primavera e d’autunno sono l’alta stagione.',
        src: ['birdingplaces'],
      },
    ],
    offers: [
      {
        status: 'yes',
        need: { en: 'Early starts', de: 'Früh los', sl: 'Zgodnji odhodi', hr: 'Rani polasci', it: 'Partenze all’alba' },
        answer: { en: 'Your own kitchen, so breakfast is whenever you like.', de: 'Eigene Küche, Frühstück also wann Sie wollen.', sl: 'Lastna kuhinja, zato je zajtrk takrat, ko vam ustreza.', hr: 'Vlastita kuhinja, pa doručkujete kad god želite.', it: 'Cucina propria: la colazione è quando volete voi.' },
      },
      {
        status: 'yes',
        need: { en: 'A car full of gear', de: 'Ein Auto voller Ausrüstung', sl: 'Avto, poln opreme', hr: 'Auto pun opreme', it: 'Un’auto piena di attrezzatura' },
        answer: { en: 'Free private parking on the gated driveway.', de: 'Kostenloser Privatparkplatz in der Einfahrt hinter dem Tor.', sl: 'Brezplačno zasebno parkirišče na dvorišču za vrati.', hr: 'Besplatan privatni parking na dvorištu iza kapije.', it: 'Parcheggio privato gratuito nel vialetto chiuso da un cancello.' },
      },
      {
        status: 'partial',
        need: { en: 'Flexible arrival', de: 'Flexible Anreise', sl: 'Prilagodljiv prihod', hr: 'Fleksibilan dolazak', it: 'Arrivo flessibile' },
        answer: { en: 'Check-in from {checkIn}; earlier: ask us.', de: 'Check-in ab {checkIn}; früher: auf Anfrage.', sl: 'Prijava od {checkIn}; prej: vprašajte nas.', hr: 'Prijava od {checkIn}; ranije: pitajte nas.', it: 'Check-in dalle {checkIn}; prima: chiedeteci.' },
      },
      {
        status: 'info',
        need: { en: 'Into the salt fields', de: 'In die Salzfelder', sl: 'V solna polja', hr: 'U solna polja', it: 'Dentro le saline' },
        answer: {
          en: 'Walking in the salt fields is allowed only with a guide; Solana Nin runs educational tours.',
          de: 'Die Salzfelder darf man nur mit Führung betreten; die Saline Nin bietet Führungen an.',
          sl: 'Hoja po solnih poljih je dovoljena le z vodnikom; Solana Nin organizira izobraževalne oglede.',
          hr: 'Šetnja solnim poljima dopuštena je samo uz vodiča; Solana Nin organizira edukativne ture.',
          it: 'Nelle vasche delle saline si entra solo con una guida; Solana Nin organizza visite didattiche.',
        },
      },
    ],
    season: {
      best: [3, 4, 5, 8, 9, 10],
      good: [6],
      bestLabel: { en: 'Spring and autumn migration', de: 'Frühjahrs- und Herbstzug', sl: 'Spomladanska in jesenska selitev', hr: 'Proljetna i jesenska selidba', it: 'Migrazione primaverile e autunnale' },
      goodLabel: { en: 'Late breeding season', de: 'Späte Brutzeit', sl: 'Pozno gnezdenje', hr: 'Kasna sezona gniježđenja', it: 'Fine della stagione riproduttiva' },
    },
    caveats: [
      {
        en: 'Species counts differ by source (158, 220, more than 280). We quote the official saltworks figure.',
        de: 'Die Artenzahlen unterscheiden sich je nach Quelle (158, 220, über 280). Wir nennen die offizielle Zahl der Saline.',
        sl: 'Število vrst se med viri razlikuje (158, 220, več kot 280). Navajamo uradni podatek solin.',
        hr: 'Broj vrsta razlikuje se ovisno o izvoru (158, 220, više od 280). Navodimo službeni podatak solane.',
        it: 'Il numero di specie varia a seconda della fonte (158, 220, oltre 280). Citiamo il dato ufficiale delle saline.',
      },
      {
        en: 'Pag is often recommended for night-sky photos, but there is no official dark-sky status.',
        de: 'Pag wird oft für Nachthimmelfotos empfohlen, hat aber keinen offiziellen Dark-Sky-Status.',
        sl: 'Pag se pogosto priporoča za fotografiranje nočnega neba, a nima uradnega statusa območja temnega neba.',
        hr: 'Pag se često preporučuje za fotografiranje noćnog neba, ali nema službeni status područja tamnog neba.',
        it: 'Pag è spesso consigliata per le foto del cielo notturno, ma non ha uno status ufficiale di cielo buio (dark-sky).',
      },
    ],
  },

  'dog-owners': {
    icon: 'dog',
    purpose: 'holiday',
    label: { en: 'Travelling with a dog', de: 'Mit Hund reisen', sl: 'Potovanje s psom', hr: 'Putovanje sa psom', it: 'In viaggio con il cane' },
    teaser: {
      en: 'Please ask first: what we know about dog beaches',
      de: 'Bitte vorher fragen: was wir über Hundestrände wissen',
      sl: 'Prosimo, najprej vprašajte: kaj vemo o pasjih plažah',
      hr: 'Molimo, najprije pitajte: što znamo o plažama za pse',
      it: 'Chiedeteci prima: cosa sappiamo delle spiagge per cani',
    },
    title: { en: 'What we know, and what we don’t', de: 'Was wir wissen, und was nicht', sl: 'Kaj vemo in česa ne', hr: 'Što znamo, a što ne', it: 'Cosa sappiamo, e cosa no' },
    lede: {
      en: 'Our platform listings currently say no pets, so please write to us before you plan. Here is what we found about the area so far.',
      de: 'Über die Plattformen sind Haustiere derzeit nicht erlaubt, bitte schreiben Sie uns also vor der Planung. Hier steht, was wir bisher über die Gegend wissen.',
      sl: 'Naši oglasi na platformah trenutno ne dovoljujejo hišnih ljubljenčkov, zato nam pred načrtovanjem pišite. Tukaj je, kar smo doslej izvedeli o okolici.',
      hr: 'Naši oglasi na platformama trenutno ne dopuštaju kućne ljubimce, pa nam se javite prije planiranja. Evo što smo dosad saznali o okolici.',
      it: 'Al momento i nostri annunci sulle piattaforme non ammettono animali, quindi scriveteci prima di organizzarvi. Ecco cosa abbiamo scoperto finora sulla zona.',
    },
    facts: [
      {
        en: 'A pet-travel guide says Privlaka has a dog-friendly section at Škrapavac beach, and that the far ends of Queen’s Beach tolerate dogs outside peak hours.',
        de: 'Ein Reiseführer für Haustiere nennt einen hundefreundlichen Abschnitt am Strand Škrapavac in Privlaka; an den äußeren Enden des Königinnenstrands würden Hunde außerhalb der Stoßzeiten geduldet.',
        sl: 'Vodnik za potovanja z ljubljenčki navaja, da ima Privlaka na plaži Škrapavac del, prijazen do psov, in da so na skrajnih koncih Kraljičine plaže psi zunaj najbolj obleganih ur tolerirani.',
        hr: 'Vodič za putovanja s ljubimcima navodi da Privlaka ima dio plaže Škrapavac prilagođen psima te da se na krajnjim dijelovima Kraljičine plaže psi toleriraju izvan najprometnijih sati.',
        it: 'Una guida per chi viaggia con animali indica che a Privlaka c’è un tratto della spiaggia di Škrapavac aperto ai cani e che alle estremità di Kraljičina plaža i cani sono tollerati fuori dalle ore di punta.',
        src: ['bookiscout'],
      },
      {
        en: 'OpenStreetMap marks a dog beach near Povljana on Pag (about 12 km in a straight line, longer by road) and a dog-park area near Zaton.',
        de: 'OpenStreetMap verzeichnet einen Hundestrand bei Povljana auf Pag (etwa 12 km Luftlinie, auf der Straße weiter) und eine Hundewiese bei Zaton.',
        sl: 'OpenStreetMap označuje pasjo plažo pri Povljani na Pagu (približno 12 km zračne črte, po cesti dlje) in pasji park pri Zatonu.',
        hr: 'OpenStreetMap označava plažu za pse kod Povljane na Pagu (oko 12 km zračnom linijom, cestom dalje) i park za pse kod Zatona.',
        it: 'OpenStreetMap segna una spiaggia per cani vicino a Povljana, sull’isola di Pag (circa 12 km in linea d’aria, di più su strada), e un’area cani vicino a Zaton.',
        src: ['way/1559853964', 'way/1209189288'],
      },
      {
        en: 'Zaton Holiday Resort describes its own beach as pet-friendly (about 4 km by road). Check that day visitors with dogs are let in.',
        de: 'Das Zaton Holiday Resort bezeichnet seinen eigenen Strand als haustierfreundlich (etwa 4 km auf der Straße). Fragen Sie nach, ob Tagesgäste mit Hund hineindürfen.',
        sl: 'Zaton Holiday Resort svojo plažo opisuje kot prijazno do ljubljenčkov (približno 4 km po cesti). Preverite, ali spustijo noter tudi dnevne obiskovalce s psi.',
        hr: 'Zaton Holiday Resort svoju plažu opisuje kao prilagođenu ljubimcima (oko 4 km cestom). Provjerite puštaju li i dnevne posjetitelje sa psima.',
        it: 'Lo Zaton Holiday Resort descrive la propria spiaggia come pet-friendly (circa 4 km su strada). Verificate che facciano entrare anche i visitatori giornalieri con cani.',
        src: ['zaton.hr'],
      },
    ],
    offers: [
      {
        status: 'no',
        need: { en: 'Can my dog come?', de: 'Darf mein Hund mit?', sl: 'Ali lahko pride tudi moj pes?', hr: 'Smije li moj pas sa mnom?', it: 'Il mio cane può venire?' },
        answer: {
          en: 'Our platform listings say no pets. Ask us before you book; we will answer honestly.',
          de: 'Laut Plattform-Inseraten keine Haustiere. Fragen Sie uns vor der Buchung; wir antworten ehrlich.',
          sl: 'Naši oglasi na platformah ne dovoljujejo ljubljenčkov. Vprašajte nas pred rezervacijo; iskreno vam bomo odgovorili.',
          hr: 'Naši oglasi na platformama ne dopuštaju ljubimce. Pitajte nas prije rezervacije; iskreno ćemo vam odgovoriti.',
          it: 'I nostri annunci sulle piattaforme non ammettono animali. Chiedeteci prima di prenotare: vi risponderemo con sincerità.',
        },
        todo: 'direct-booking pet policy',
      },
      {
        status: 'ask',
        need: { en: 'A garden for the dog', de: 'Ein Garten für den Hund', sl: 'Vrt za psa', hr: 'Vrt za psa', it: 'Un giardino per il cane' },
        answer: {
          en: 'The lawn garden is shared by the four apartments, and the driveway is gated. Whether the garden is fully fenced: ask us.',
          de: 'Der Rasengarten wird von den vier Apartments geteilt, die Einfahrt hat ein Tor. Ob der Garten ganz eingezäunt ist: auf Anfrage.',
          sl: 'Travnati vrt si delijo vsi štirje apartmaji, dovoz pa ima vrata. Ali je vrt v celoti ograjen: vprašajte nas.',
          hr: 'Travnati vrt dijele sva četiri apartmana, a prilaz ima kapiju. Je li vrt potpuno ograđen: pitajte nas.',
          it: 'Il prato del giardino è in comune tra i quattro appartamenti e il vialetto ha un cancello. Se il giardino sia completamente recintato: chiedeteci.',
        },
        todo: 'fenced garden?',
      },
      {
        status: 'ask',
        need: { en: 'Nearest vet', de: 'Nächster Tierarzt', sl: 'Najbližji veterinar', hr: 'Najbliži veterinar', it: 'Il veterinario più vicino' },
        answer: { en: 'Ask us; we have not verified one yet.', de: 'Fragen Sie uns; wir haben noch keinen geprüft.', sl: 'Vprašajte nas; nobenega še nismo preverili.', hr: 'Pitajte nas; još nijednog nismo provjerili.', it: 'Chiedeteci: non ne abbiamo ancora verificato uno.' },
      },
    ],
    season: {
      best: [5, 6, 9, 10],
      good: [4, 11],
      bestLabel: { en: 'Quieter beaches, cooler days', de: 'Ruhigere Strände, kühlere Tage', sl: 'Mirnejše plaže, hladnejši dnevi', hr: 'Mirnije plaže, svježiji dani', it: 'Spiagge più tranquille, giornate più fresche' },
      goodLabel: { en: 'Cool and empty', de: 'Kühl und leer', sl: 'Hladno in prazno', hr: 'Svježe i prazno', it: 'Fresco e deserto' },
    },
    caveats: [
      {
        en: 'We found no official municipal dog-beach rules. All dog-beach information here is from third parties.',
        de: 'Offizielle Hundestrand-Regeln der Gemeinde haben wir nicht gefunden. Alle Angaben hier stammen von Dritten.',
        sl: 'Uradnih občinskih pravil za pasje plaže nismo našli. Vse informacije o pasjih plažah so od tretjih oseb.',
        hr: 'Službena općinska pravila za plaže za pse nismo pronašli. Svi podaci o plažama za pse ovdje su iz vanjskih izvora.',
        it: 'Non abbiamo trovato regole comunali ufficiali sulle spiagge per cani. Tutte le informazioni qui provengono da terzi.',
      },
      {
        en: 'A news report mentions fines of about €150 for dogs on a Croatian beach (town not named). Check the signs on each beach.',
        de: 'Ein Nachrichtenbericht erwähnt Bußgelder von etwa 150 € für Hunde an einem kroatischen Strand (Ort nicht genannt). Achten Sie auf die Schilder an jedem Strand.',
        sl: 'Novica omenja globe približno 150 € za pse na hrvaški plaži (kraj ni naveden). Na vsaki plaži bodite pozorni na table.',
        hr: 'Jedan novinski članak spominje kazne od oko 150 € za pse na hrvatskoj plaži (mjesto nije navedeno). Pratite oznake na svakoj plaži.',
        it: 'Un articolo di cronaca cita multe di circa 150 € per cani su una spiaggia croata (località non indicata). Controllate i cartelli su ogni spiaggia.',
      },
    ],
  },

  naturists: {
    icon: 'sun',
    purpose: 'holiday',
    label: { en: 'Naturists (FKK)', de: 'FKK', sl: 'Naturisti (FKK)', hr: 'Naturisti (FKK)', it: 'Naturisti (FKK)' },
    teaser: { en: 'A naturist beach about 1 km on foot', de: 'Ein FKK-Strand etwa 1 km zu Fuß', sl: 'Naturistična plaža približno 1 km peš', hr: 'Naturistička plaža oko 1 km pješice', it: 'Una spiaggia naturista a circa 1 km a piedi' },
    title: { en: 'A naturist beach about 1 km away on foot', de: 'Ein FKK-Strand etwa 1 km zu Fuß', sl: 'Naturistična plaža le približno 1 km peš', hr: 'Naturistička plaža na oko 1 km pješice', it: 'Una spiaggia naturista a circa 1 km a piedi' },
    lede: {
      en: 'Walk down to the FKK section of Sabunike beach, then come back to your own apartment and terrace.',
      de: 'Zu Fuß zum FKK-Abschnitt des Strands von Sabunike, danach zurück ins eigene Apartment und auf die Terrasse.',
      sl: 'Sprehodite se do naturističnega dela plaže Sabunike, nato pa se vrnite v svoj apartma in na svojo teraso.',
      hr: 'Prošetajte do naturističkog dijela plaže Sabunike, a zatim se vratite u svoj apartman i na svoju terasu.',
      it: 'Scendete a piedi fino al tratto FKK della spiaggia di Sabunike, poi tornate al vostro appartamento e alla vostra terrazza.',
    },
    facts: [
      {
        en: 'OpenStreetMap maps two FKK sections of Sabunike beach, about 0.8 km and 1.4 km from the house in a straight line. The nearer one is about 1.1 km (13 minutes) on foot.',
        de: 'OpenStreetMap verzeichnet zwei FKK-Abschnitte am Strand von Sabunike, etwa 0,8 km und 1,4 km Luftlinie vom Haus. Der nähere ist etwa 1,1 km (13 Minuten) zu Fuß entfernt.',
        sl: 'OpenStreetMap ima vrisana dva naturistična dela plaže Sabunike, približno 0,8 km in 1,4 km zračne črte od hiše. Bližji je približno 1,1 km (13 minut) peš.',
        hr: 'OpenStreetMap bilježi dva naturistička dijela plaže Sabunike, oko 0,8 km i 1,4 km zračnom linijom od kuće. Bliži je oko 1,1 km (13 minuta) pješice.',
        it: 'OpenStreetMap riporta due tratti FKK della spiaggia di Sabunike, a circa 0,8 km e 1,4 km in linea d’aria dalla casa. Il più vicino è a circa 1,1 km (13 minuti) a piedi.',
        src: ['way/1209174534', 'way/1209174533', 'routing.openstreetmap.de'],
      },
      {
        en: 'Sandee describes the Sabunike FKK beach as a favourite among naturists for decades, facing the island of Pag within a larger family beach area.',
        de: 'Sandee beschreibt den FKK-Strand von Sabunike als seit Jahrzehnten beliebt bei Naturisten, mit Blick auf Pag, innerhalb eines größeren Familienstrands.',
        sl: 'Sandee opisuje naturistično plažo Sabunike kot priljubljeno med naturisti že desetletja, s pogledom na otok Pag, znotraj večje družinske plaže.',
        hr: 'Sandee opisuje FKK plažu Sabunike kao desetljećima omiljenu među naturistima, s pogledom na otok Pag, unutar većeg obiteljskog kupališta.',
        it: 'Sandee descrive la spiaggia FKK di Sabunike come una delle preferite dai naturisti da decenni, rivolta verso l’isola di Pag, all’interno di una spiaggia per famiglie più ampia.',
        src: ['sandee'],
      },
      {
        en: 'Croatia has a long naturism tradition.',
        de: 'Kroatien hat eine lange FKK-Tradition.',
        sl: 'Hrvaška ima dolgo naturistično tradicijo.',
        hr: 'Hrvatska ima dugu naturističku tradiciju.',
        it: 'La Croazia ha una lunga tradizione naturista.',
        src: ['total-croatia-news'],
      },
    ],
    offers: [
      {
        status: 'yes',
        need: { en: 'Walk to the beach', de: 'Zu Fuß zum Strand', sl: 'Peš na plažo', hr: 'Pješice do plaže', it: 'A piedi in spiaggia' },
        answer: {
          en: 'About 13 minutes on foot to the nearer FKK section.',
          de: 'Etwa 13 Minuten zu Fuß zum näheren FKK-Abschnitt.',
          sl: 'Približno 13 minut peš do bližjega naturističnega dela.',
          hr: 'Oko 13 minuta pješice do bližeg FKK dijela.',
          it: 'Circa 13 minuti a piedi fino al tratto FKK più vicino.',
        },
      },
      {
        status: 'info',
        need: { en: 'Beach surface', de: 'Strandbeschaffenheit', sl: 'Podlaga plaže', hr: 'Podloga plaže', it: 'Fondo della spiaggia' },
        answer: {
          en: 'OpenStreetMap tags the nearer section as gravel, and descriptions vary. Bring beach shoes.',
          de: 'OpenStreetMap führt den näheren Abschnitt als Kies, die Beschreibungen schwanken. Badeschuhe mitnehmen.',
          sl: 'OpenStreetMap bližji del označuje kot gramozen, opisi pa se razlikujejo. Vzemite čevlje za vodo.',
          hr: 'OpenStreetMap bliži dio označava kao šljunčani, a opisi se razlikuju. Ponesite obuću za plažu.',
          it: 'OpenStreetMap classifica il tratto più vicino come ghiaia e le descrizioni variano. Portate le scarpette da mare.',
        },
      },
      {
        status: 'ask',
        need: { en: 'Privacy at the house', de: 'Privatsphäre am Haus', sl: 'Zasebnost pri hiši', hr: 'Privatnost u kući', it: 'Privacy in casa' },
        answer: {
          en: 'The garden is shared when other apartments are let. Ask us before you plan anything beyond the beach.',
          de: 'Der Garten wird geteilt, wenn andere Apartments vermietet sind. Fragen Sie uns, bevor Sie mehr als den Strand planen.',
          sl: 'Vrt je skupen, kadar so oddani tudi drugi apartmaji. Vprašajte nas, preden načrtujete kaj več kot plažo.',
          hr: 'Vrt je zajednički kad su iznajmljeni i drugi apartmani. Pitajte nas prije nego što planirate išta osim plaže.',
          it: 'Il giardino è in comune quando gli altri appartamenti sono occupati. Chiedeteci prima di programmare qualcosa oltre alla spiaggia.',
        },
      },
    ],
    season: {
      best: [6, 7, 8, 9],
      good: [5, 10],
      bestLabel: { en: 'Swimming season', de: 'Badesaison', sl: 'Kopalna sezona', hr: 'Sezona kupanja', it: 'Stagione balneare' },
      goodLabel: { en: 'Warm days, cool sea', de: 'Warme Tage, kühles Meer', sl: 'Topli dnevi, hladno morje', hr: 'Topli dani, hladno more', it: 'Giornate calde, mare fresco' },
    },
    caveats: [
      {
        en: 'The FKK section is not officially signed, and its official status is unconfirmed with the municipality.',
        de: 'Der FKK-Abschnitt ist nicht offiziell ausgeschildert, sein offizieller Status bei der Gemeinde ist unbestätigt.',
        sl: 'Naturistični del ni uradno označen, njegov uradni status pri občini pa ni potrjen.',
        hr: 'FKK dio nije službeno označen, a njegov službeni status kod općine nije potvrđen.',
        it: 'Il tratto FKK non è segnalato ufficialmente e il suo status presso il comune non è confermato.',
      },
      {
        en: 'The surface is described inconsistently (sand, pebbles, gravel).',
        de: 'Der Untergrund wird unterschiedlich beschrieben (Sand, Kiesel, Kies).',
        sl: 'Podlaga je opisana različno (pesek, prod, gramoz).',
        hr: 'Podloga se različito opisuje (pijesak, oblutci, šljunak).',
        it: 'Il fondo è descritto in modi diversi (sabbia, ciottoli, ghiaia).',
      },
    ],
  },

  'school-university-field-trips': {
    icon: 'book',
    purpose: 'other',
    label: { en: 'Field trips & study groups', de: 'Exkursionen & Studiengruppen', sl: 'Ekskurzije in študijske skupine', hr: 'Terenska nastava i studijske grupe', it: 'Viaggi di istruzione e gruppi di studio' },
    teaser: { en: 'Salt pans, Roman Nin and a protected lagoon', de: 'Saline, römisches Nin und eine geschützte Lagune', sl: 'Soline, rimski Nin in zavarovana laguna', hr: 'Solana, rimski Nin i zaštićena laguna', it: 'Saline, la Nin romana e una laguna protetta' },
    title: { en: 'A living classroom within 3 km', de: 'Ein lebendiges Klassenzimmer im Umkreis von 3 km', sl: 'Živa učilnica v radiju 3 km', hr: 'Živa učionica u krugu od 3 km', it: 'Un’aula a cielo aperto entro 3 km' },
    lede: {
      en: 'Salt-pan ecology, a Natura 2000 lagoon and 1,200 years of Croatian history, all a short ride from a house that sleeps a seminar group.',
      de: 'Salinen-Ökologie, eine Natura-2000-Lagune und 1.200 Jahre kroatische Geschichte, alles nah an einem Haus, das eine Seminargruppe beherbergt.',
      sl: 'Ekologija solin, laguna Natura 2000 in 1.200 let hrvaške zgodovine, vse le kratko vožnjo od hiše, ki sprejme seminarsko skupino.',
      hr: 'Ekologija solane, laguna Natura 2000 i 1.200 godina hrvatske povijesti, sve na kratkoj vožnji od kuće u kojoj može spavati seminarska grupa.',
      it: 'L’ecologia delle saline, una laguna Natura 2000 e 1.200 anni di storia croata, tutto a breve distanza da una casa che ospita un gruppo di seminario.',
    },
    facts: [
      {
        en: 'Solana Nin runs a 45-minute educational salt tour on weekdays in English and Croatian. Groups over 15 pay €5 per student and €8 per adult.',
        de: 'Die Saline Nin bietet werktags eine 45-minütige Salzführung auf Englisch und Kroatisch. Gruppen über 15 zahlen 5 € pro Schüler und 8 € pro Erwachsenem.',
        sl: 'Solana Nin ob delavnikih organizira 45-minutni izobraževalni ogled v angleščini in hrvaščini. Skupine z več kot 15 udeleženci plačajo 5 € na učenca in 8 € na odraslega.',
        hr: 'Solana Nin radnim danom organizira 45-minutnu edukativnu turu na engleskom i hrvatskom. Grupe veće od 15 osoba plaćaju 5 € po učeniku i 8 € po odrasloj osobi.',
        it: 'Solana Nin propone nei giorni feriali una visita didattica di 45 minuti in inglese e croato. I gruppi oltre le 15 persone pagano 5 € per studente e 8 € per adulto.',
        src: ['educational-salt-tour'],
      },
      {
        en: 'The Salt House museum has an interactive model of the nature reserve.',
        de: 'Das Salzmuseum hat ein interaktives Modell des Naturreservats.',
        sl: 'Muzej Hiša soli ima interaktivno maketo naravnega rezervata.',
        hr: 'Muzej Kuća soli ima interaktivnu maketu prirodnog rezervata.',
        it: 'Il museo Casa del sale ha un plastico interattivo della riserva naturale.',
        src: ['museum-and-house-of-salt'],
      },
      {
        en: 'Nin’s heritage is about 3 km away: the 9th-century Church of the Holy Cross, Roman temple remains from the 1st century AD and the Museum of Nin Antiquities.',
        de: 'Das Erbe von Nin liegt etwa 3 km entfernt: die Heilig-Kreuz-Kirche aus dem 9. Jahrhundert, Reste eines römischen Tempels aus dem 1. Jahrhundert und das Museum der Altertümer von Nin.',
        sl: 'Dediščina Nina je oddaljena približno 3 km: cerkev sv. Križa iz 9. stoletja, ostanki rimskega templja iz 1. stoletja n. št. in Muzej ninskih starin.',
        hr: 'Ninska baština udaljena je oko 3 km: crkva Svetog Križa iz 9. stoljeća, ostaci rimskog hrama iz 1. stoljeća poslije Krista i Muzej ninskih starina.',
        it: 'Il patrimonio di Nin è a circa 3 km: la chiesa della Santa Croce del IX secolo, i resti di un tempio romano del I secolo d.C. e il Museo delle antichità di Nin.',
        src: ['wikipedia', 'viamichelin'],
      },
      {
        en: 'The lagoon is a Natura 2000 habitat with healing-mud deposits, salt-pan ecology and 158 recorded bird species.',
        de: 'Die Lagune ist ein Natura-2000-Gebiet mit Heilschlamm, Salinen-Ökologie und 158 erfassten Vogelarten.',
        sl: 'Laguna je habitat Natura 2000 z nahajališči zdravilnega blata, ekologijo solin in 158 zabeleženimi vrstami ptic.',
        hr: 'Laguna je stanište Natura 2000 s nalazištima ljekovitog blata, ekologijom solane i 158 zabilježenih vrsta ptica.',
        it: 'La laguna è un habitat Natura 2000 con depositi di fango curativo, l’ecologia delle saline e 158 specie di uccelli censite.',
        src: ['solananin.hr/en/nature/wildlife'],
      },
    ],
    offers: [
      {
        status: 'partial',
        need: { en: 'Beds for students and supervisors', de: 'Betten für Studierende und Betreuer', sl: 'Ležišča za študente in spremljevalce', hr: 'Kreveti za studente i voditelje', it: 'Letti per studenti e accompagnatori' },
        answer: {
          en: 'Up to {max} people in {bedrooms} bedrooms and two sofa beds: right for a seminar group, too small for a full school class.',
          de: 'Bis zu {max} Personen in {bedrooms} Schlafzimmern und zwei Schlafsofas: passend für eine Seminargruppe, zu klein für eine ganze Schulklasse.',
          sl: (v) => `Do ${v.max} oseb v ${count('sl', v.bedrooms, { one: 'spalnici', other: 'spalnicah' })} in na dveh raztegljivih kavčih: ravno prav za seminarsko skupino, premalo za cel šolski razred.`,
          hr: (v) => `Do ${count('hr', v.max, { one: 'osobe', few: 'osobe', other: 'osoba' })} u ${count('hr', v.bedrooms, { one: 'spavaćoj sobi', few: 'spavaće sobe', other: 'spavaćih soba' })} i na dva kauča na razvlačenje: taman za seminarsku grupu, premalo za cijeli školski razred.`,
          it: (v) => `Fino a ${v.max} persone in ${count('it', v.bedrooms, BEDROOMS_IT)} e due divani letto: adatto a un gruppo di seminario, troppo piccolo per un’intera classe.`,
        },
      },
      {
        status: 'yes',
        need: { en: 'Cook as a group', de: 'Gemeinsam kochen', sl: 'Skupno kuhanje', hr: 'Zajedničko kuhanje', it: 'Cucinare in gruppo' },
        answer: { en: 'Four kitchens and the garden grill.', de: 'Vier Küchen und der Grill im Garten.', sl: 'Štiri kuhinje in žar na vrtu.', hr: 'Četiri kuhinje i roštilj u vrtu.', it: 'Quattro cucine e il barbecue in giardino.' },
      },
      {
        status: 'ask',
        need: { en: 'Invoice to an institution', de: 'Rechnung an eine Institution', sl: 'Račun za ustanovo', hr: 'Račun na ustanovu', it: 'Fattura a un istituto' },
        answer: {
          en: 'Ask us about invoicing and payment terms.',
          de: 'Fragen Sie uns nach Rechnung und Zahlungsbedingungen.',
          sl: 'Vprašajte nas o izdaji računa in plačilnih pogojih.',
          hr: 'Pitajte nas o izdavanju računa i uvjetima plaćanja.',
          it: 'Chiedeteci di fatturazione e condizioni di pagamento.',
        },
        todo: 'institutional invoice',
      },
      {
        status: 'ask',
        need: { en: 'A ready-made programme', de: 'Ein fertiges Programm', sl: 'Pripravljen program', hr: 'Gotov program', it: 'Un programma pronto' },
        answer: {
          en: 'Ask us for a draft: salt works, museum, lagoon walk, bike loop.',
          de: 'Fragen Sie uns nach einem Entwurf: Saline, Museum, Lagunenrundgang, Radrunde.',
          sl: 'Vprašajte nas za osnutek: soline, muzej, sprehod ob laguni, kolesarski krog.',
          hr: 'Pitajte nas za prijedlog: solana, muzej, šetnja uz lagunu, biciklistička tura.',
          it: 'Chiedeteci una bozza: saline, museo, passeggiata in laguna, giro in bici.',
        },
      },
    ],
    season: {
      best: [4, 5, 6, 9, 10],
      good: [3, 11],
      bestLabel: { en: 'Term time, outside peak season', de: 'Semesterzeit, außerhalb der Hochsaison', sl: 'Med šolskim letom, zunaj glavne sezone', hr: 'Tijekom nastave, izvan glavne sezone', it: 'Durante l’anno scolastico, fuori dall’alta stagione' },
      goodLabel: { en: 'Cooler, fewer services open', de: 'Kühler, weniger geöffnet', sl: 'Hladneje, manj odprtega', hr: 'Svježije, manje toga otvoreno', it: 'Più fresco, meno servizi aperti' },
    },
    caveats: [
      {
        en: 'Groups with minors: please discuss supervision, safeguarding and insurance with us before booking.',
        de: 'Gruppen mit Minderjährigen: bitte Aufsicht, Schutzkonzept und Versicherung vor der Buchung mit uns besprechen.',
        sl: 'Skupine z mladoletniki: nadzor, zaščito otrok in zavarovanje se z nami dogovorite pred rezervacijo.',
        hr: 'Grupe s maloljetnicima: nadzor, zaštitu djece i osiguranje dogovorite s nama prije rezervacije.',
        it: 'Gruppi con minori: concordate con noi sorveglianza, tutela e assicurazione prima di prenotare.',
      },
      {
        en: 'Museum opening hours and group rules are not confirmed. Check with the venues.',
        de: 'Öffnungszeiten der Museen und Gruppenregeln sind nicht bestätigt. Bitte bei den Einrichtungen nachfragen.',
        sl: 'Delovni čas muzejev in pravila za skupine niso potrjeni. Preverite pri ustanovah.',
        hr: 'Radno vrijeme muzeja i pravila za grupe nisu potvrđeni. Provjerite izravno s ustanovama.',
        it: 'Orari dei musei e regole per i gruppi non sono confermati. Verificate con le strutture.',
      },
    ],
  },

  'small-company-retreats': {
    icon: 'briefcase',
    purpose: 'retreat',
    label: { en: 'Company retreats', de: 'Firmen-Retreats', sl: 'Poslovni retreati', hr: 'Retreati za tvrtke', it: 'Ritiri aziendali' },
    teaser: { en: 'Your offsite without the hotel', de: 'Ihr Offsite ohne Hotel', sl: 'Delo izven pisarne, brez hotela', hr: 'Vaš offsite bez hotela', it: 'Il vostro offsite senza hotel' },
    title: { en: 'Your offsite, without the hotel', de: 'Ihr Offsite, ohne Hotel', sl: 'Delo izven pisarne, brez hotela', hr: 'Vaš offsite, bez hotela', it: 'Il vostro offsite, senza hotel' },
    lede: {
      en: 'Strategy in the morning, a kite lesson in the afternoon, the team grill at sunset. Four apartments, one garden.',
      de: 'Morgens Strategie, nachmittags eine Kitestunde, abends der Team-Grill. Vier Apartments, ein Garten.',
      sl: 'Zjutraj strategija, popoldne ura kajtanja, ob sončnem zahodu ekipni žar. Štirje apartmaji, en vrt.',
      hr: 'Ujutro strategija, poslijepodne sat kitesurfa, u sumrak timski roštilj. Četiri apartmana, jedan vrt.',
      it: 'Strategia al mattino, una lezione di kite nel pomeriggio, il barbecue del team al tramonto. Quattro appartamenti, un giardino.',
    },
    facts: [
      {
        en: 'Taking the whole house gives you a private venue: four apartments to sleep in, the grill and an outdoor kitchen for team dinners, and parking.',
        de: 'Mit dem ganzen Haus haben Sie einen privaten Ort: vier Apartments zum Schlafen, Grill und Außenküche für Team-Abende und Parkplätze.',
        sl: 'S celo hišo dobite zasebno prizorišče: štiri apartmaje za spanje, žar in zunanjo kuhinjo za ekipne večerje ter parkirišče.',
        hr: 'S cijelom kućom dobivate privatni prostor: četiri apartmana za spavanje, roštilj i vanjsku kuhinju za timske večere te parking.',
        it: 'Prendendo tutta la casa avete uno spazio privato: quattro appartamenti per dormire, il barbecue e una cucina esterna per le cene di team, e il parcheggio.',
        src: [],
      },
      {
        en: 'Zadar Airport is about 22 km in a straight line, about 35–40 minutes by road.',
        de: 'Der Flughafen Zadar liegt etwa 22 km Luftlinie entfernt, etwa 35–40 Minuten auf der Straße.',
        sl: 'Letališče Zadar je oddaljeno približno 22 km zračne črte, po cesti približno 35–40 minut.',
        hr: 'Zračna luka Zadar udaljena je oko 22 km zračnom linijom, cestom oko 35–40 minuta.',
        it: 'L’aeroporto di Zadar è a circa 22 km in linea d’aria, circa 35–40 minuti su strada.',
        src: ['Zadar_Airport'],
      },
      {
        en: 'Kite and windsurf tasters, the Solana Nin group tour and flat bike loops are all within about 3.5 km.',
        de: 'Kite- und Windsurf-Schnupperstunden, die Gruppenführung in der Saline Nin und flache Radrunden liegen alle im Umkreis von etwa 3,5 km.',
        sl: 'Poskusne ure kajtanja in windsurfanja, skupinski ogled Solane Nin in ravne kolesarske poti so vse v radiju približno 3,5 km.',
        hr: 'Probni satovi kitesurfa i windsurfa, grupna tura Solane Nin i ravne biciklističke ture sve su u krugu od oko 3,5 km.',
        it: 'Lezioni di prova di kite e windsurf, la visita di gruppo a Solana Nin e anelli in bici pianeggianti: tutto entro circa 3,5 km.',
        src: ['surfcenter-surfmania', 'educational-salt-tour', 'ZBM_2024'],
      },
    ],
    offers: [
      {
        status: 'partial',
        need: { en: 'Meeting space for 12', de: 'Meetingplatz für 12', sl: 'Prostor za sestanek za 12', hr: 'Prostor za sastanak za 12 osoba', it: 'Spazio riunioni per 12' },
        answer: {
          en: 'Covered terraces, and the living rooms as breakouts. A table for 12 with a screen: ask us.',
          de: 'Überdachte Terrassen und die Wohnzimmer als Breakout-Räume. Ein Tisch für 12 mit Bildschirm: auf Anfrage.',
          sl: 'Pokrite terase, dnevne sobe pa za delo v manjših skupinah. Miza za 12 z zaslonom: vprašajte nas.',
          hr: 'Natkrivene terase, a dnevni boravci za rad u manjim grupama. Stol za 12 osoba s ekranom: pitajte nas.',
          it: 'Terrazze coperte e i soggiorni per i lavori in piccoli gruppi. Un tavolo per 12 con schermo: chiedeteci.',
        },
      },
      {
        status: 'partial',
        need: { en: 'Wi-Fi for video calls', de: 'WLAN für Videocalls', sl: 'Wi-Fi za videoklice', hr: 'Wi-Fi za videopozive', it: 'Wi-Fi per le videochiamate' },
        answer: {
          en: 'Wi-Fi in every apartment; capacity and speed: ask us.',
          de: 'WLAN in jedem Apartment; Kapazität und Geschwindigkeit: auf Anfrage.',
          sl: 'Wi-Fi v vsakem apartmaju; zmogljivost in hitrost: vprašajte nas.',
          hr: 'Wi-Fi u svakom apartmanu; kapacitet i brzina: pitajte nas.',
          it: 'Wi-Fi in ogni appartamento; capacità e velocità: chiedeteci.',
        },
        todo: 'Wi-Fi capacity',
      },
      {
        status: 'ask',
        need: { en: 'Company invoice (R1)', de: 'Firmenrechnung (R1)', sl: 'Račun za podjetje (R1)', hr: 'Račun za tvrtku (R1)', it: 'Fattura aziendale (R1)' },
        answer: {
          en: 'Depends on our tax status. Ask us before you budget.',
          de: 'Hängt von unserem Steuerstatus ab. Fragen Sie vor der Budgetplanung.',
          sl: 'Odvisno od našega davčnega statusa. Vprašajte nas, preden pripravite proračun.',
          hr: 'Ovisi o našem poreznom statusu. Pitajte nas prije izrade budžeta.',
          it: 'Dipende dal nostro regime fiscale. Chiedeteci prima di definire il budget.',
        },
        todo: 'R1 invoice',
      },
      {
        status: 'ask',
        need: { en: 'Transfer, chef, workshops', de: 'Transfer, Koch, Workshops', sl: 'Prevoz, kuhar, delavnice', hr: 'Transfer, kuhar, radionice', it: 'Transfer, chef, workshop' },
        answer: { en: 'Ask us what we can arrange.', de: 'Fragen Sie uns, was wir organisieren können.', sl: 'Vprašajte nas, kaj lahko uredimo.', hr: 'Pitajte nas što možemo organizirati.', it: 'Chiedeteci cosa possiamo organizzare.' },
      },
    ],
    season: {
      best: [5, 6, 9, 10],
      good: [4],
      bestLabel: { en: 'Shoulder season: warm, quiet, flights running', de: 'Nebensaison: warm, ruhig, Flüge verfügbar', sl: 'Pred- in posezona: toplo, mirno, leti delujejo', hr: 'Predsezona i posezona: toplo, mirno, ima letova', it: 'Mezza stagione: caldo, tranquillità, voli attivi' },
      goodLabel: { en: 'Cooler, still good', de: 'Kühler, trotzdem gut', sl: 'Hladneje, a še vedno dobro', hr: 'Svježije, ali i dalje dobro', it: 'Più fresco, ma ancora buono' },
    },
    caveats: [
      {
        en: 'There is no dedicated meeting room; living rooms and covered terraces are the workspace, so plan for bad weather.',
        de: 'Es gibt keinen eigenen Meetingraum; Wohnzimmer und überdachte Terrassen sind der Arbeitsplatz, planen Sie also für schlechtes Wetter.',
        sl: 'Posebne sejne sobe ni; delovni prostor so dnevne sobe in pokrite terase, zato imejte načrt tudi za slabo vreme.',
        hr: 'Nema posebne dvorane za sastanke; radni prostor su dnevni boravci i natkrivene terase, pa planirajte i za loše vrijeme.',
        it: 'Non c’è una sala riunioni dedicata: si lavora nei soggiorni e sulle terrazze coperte, quindi prevedete un piano per il maltempo.',
      },
      {
        en: 'Which invoice we can issue depends on our tax status. Ask before you budget.',
        de: 'Welche Rechnung wir ausstellen können, hängt von unserem Steuerstatus ab. Vor der Budgetplanung fragen.',
        sl: 'Kakšen račun lahko izstavimo, je odvisno od našega davčnega statusa. Vprašajte pred pripravo proračuna.',
        hr: 'Koji račun možemo izdati ovisi o našem poreznom statusu. Pitajte prije izrade budžeta.',
        it: 'Il tipo di fattura che possiamo emettere dipende dal nostro regime fiscale. Chiedete prima di definire il budget.',
      },
    ],
  },
};

// Audiences without a nicheSegment field that still match a segment.
const ALIASES = { cyclists: 'cyclists-and-clubs', retreats: 'small-company-retreats' };
// Opt-in pages that are never cross-linked from other versions.
const DISCREET = new Set(['naturists']);

// A translation is a template string, or a function of the values when it needs plural forms.
const fill = (s, vars) => (typeof s === 'function' ? s(vars) : String(s).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`)));

function houseVars(ctx) {
  return {
    max: APARTMENTS.reduce((s, a) => s + (a.maxGuests || 0), 0),
    bedrooms: APARTMENTS.reduce((s, a) => s + (a.bedrooms || 0), 0),
    split: APARTMENTS.map((a) => a.bedrooms).join(' + '),
    checkIn: ctx.site.directBooking.checkIn,
  };
}

function segmentIdFor(audience) {
  const id = audience?.nicheSegment || ALIASES[audience?.id] || audience?.id;
  return SEGMENTS[id] ? id : null;
}

// The audience that shows a segment's version, or null if there is none.
function audienceFor(segId) {
  return AUDIENCES.find((a) => segmentIdFor(a) === segId && a.sections?.length) || null;
}

function versionLinks(ctx, exceptId) {
  return Object.keys(SEGMENTS)
    .filter((id) => id !== exceptId && !DISCREET.has(id))
    .map((id) => ({ id, seg: SEGMENTS[id], aud: audienceFor(id) }))
    .filter((x) => x.aud && !x.aud.unlisted && x.aud.id !== ctx.audience.id);
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function sourceLinks(ctx, urls) {
  if (!urls.length) return '';
  return `<span class="nc-src">${urls
    .map(
      (u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener" title="${esc(hostname(u))}" aria-label="${esc(ctx.t(L.source))} ${i + 1}: ${esc(hostname(u))}">${i + 1}</a>`,
    )
    .join('')}</span>`;
}

function seasonStripHtml(ctx, season) {
  const t = ctx.t;
  const sel = ctx.state.month;
  const level = (m) => (season.best.includes(m) ? 'best' : season.good.includes(m) ? 'good' : 'off');
  const bestNames = [...season.best].sort((a, b) => a - b).map((m) => monthName(m, ctx.lang)).join(', ');
  let note;
  if (!sel) note = t(L.pickMonth);
  else {
    const m = monthName(sel, ctx.lang, true);
    const lv = level(sel);
    note = fill(t(lv === 'best' ? L.monthBest : lv === 'good' ? L.monthGood : L.monthOff), { m, best: bestNames });
  }
  return `
  <div class="nc-season">
    <h3>${icon('calendar', { size: 20 })}${esc(t(L.season))}</h3>
    <ol class="nc-months">
      ${Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const lv = level(m);
        const lvLabel = lv === 'best' ? t(L.bestLegend) : lv === 'good' ? t(L.goodLegend) : '';
        return `<li class="nc-m nc-m-${lv}${sel === m ? ' is-sel' : ''}">
          <span class="nc-m-name">${esc(monthName(m, ctx.lang))}</span>
          <span class="visually-hidden">${esc(lvLabel)}${sel === m ? `, ${esc(t(L.yourMonth))}` : ''}</span>
        </li>`;
      }).join('')}
    </ol>
    <ul class="nc-legend">
      <li><span class="nc-key nc-m-best"></span><b>${esc(t(L.bestLegend))}:</b> ${esc(t(season.bestLabel))}</li>
      ${season.good.length ? `<li><span class="nc-key nc-m-good"></span><b>${esc(t(L.goodLegend))}:</b> ${esc(t(season.goodLabel))}</li>` : ''}
    </ul>
    <p class="nc-season-note${sel ? ' has-month' : ''}">${esc(note)}</p>
  </div>`;
}

function spotlightHtml(ctx, segId) {
  const t = ctx.t;
  const seg = SEGMENTS[segId];
  const vars = houseVars(ctx);
  const others = versionLinks(ctx, segId);
  return `
  <div class="container">
    <header class="section-head">
      <span class="eyebrow">${glyph(seg.icon, 16)}${esc(t(L.whoEyebrow))} · ${esc(t(seg.label))}</span>
      <h2>${esc(t(seg.title))}</h2>
      <p class="lede">${esc(t(seg.lede))}</p>
    </header>
    <p class="nc-lowconf" data-lowconf hidden>${icon('info', { size: 20 })}<span>${esc(t(L.lowConf))}</span></p>
    <div class="nc-grid">
      <div class="nc-why">
        <h3>${icon('star', { size: 20 })}${esc(t(L.why))}</h3>
        <ol class="nc-facts">
          ${seg.facts.map((f, i) => `<li><span>${esc(fill(t(f), vars))}</span><span data-src="${i}"></span></li>`).join('')}
        </ol>
      </div>
      <div class="nc-offer">
        <h3>${icon('check', { size: 20 })}${esc(t(L.offer))}</h3>
        <ul class="nc-offers">
          ${seg.offers
            .map((o) => {
              const st = STATUS[o.status] || STATUS.ask;
              return `<li class="nc-o nc-o-${o.status}">
                <span class="nc-o-st">${icon(st.icon, { size: 14 })}${esc(t(st.label))}</span>
                <b>${esc(t(o.need))}</b>
                <span>${esc(fill(t(o.answer), vars))}${o.todo ? ownerTodo(o.todo) : ''}</span>
              </li>`;
            })
            .join('')}
        </ul>
        <button type="button" class="btn btn-primary btn-lg nc-ask" data-ask>${icon('chat', { size: 18 })}${esc(t(L.ask))}</button>
      </div>
    </div>
    <div class="nc-lower">
      ${seasonStripHtml(ctx, seg.season)}
      <div class="nc-caveats">
        <h3>${icon('info', { size: 20 })}${esc(t(L.caveats))}</h3>
        <p class="muted">${esc(t(L.caveatsLede))}</p>
        <ul>${seg.caveats.map((c) => `<li>${esc(fill(t(c), vars))}</li>`).join('')}</ul>
      </div>
    </div>
    ${others.length
      ? `<nav class="nc-others" aria-label="${esc(t(L.notYou))}">
      <h3>${esc(t(L.notYou))}</h3>
      <div class="chips">
        ${others.map((o) => `<a class="chip" href="${esc(ctx.linkFor({ audience: o.aud.id }))}" data-audience="${esc(o.aud.id)}">${glyph(o.seg.icon, 16)}${esc(t(o.seg.label))}</a>`).join('')}
      </div>
    </nav>`
      : ''}
    <p class="error-box" data-mount-error hidden>${esc(t(L.loadError))}</p>
  </div>`;
}

function whoHtml(ctx) {
  const t = ctx.t;
  const links = versionLinks(ctx, null);
  return `
  <div class="container">
    <header class="section-head">
      <span class="eyebrow">${icon('users', { size: 16 })}${esc(t(L.whoEyebrow))}</span>
      <h2>${esc(t(L.whoTitle))}</h2>
      <p class="lede">${esc(t(L.whoLede))}</p>
    </header>
    <ul class="nc-who">
      ${links
        .map(
          (o) => `<li>
          <a class="nc-who-card" href="${esc(ctx.linkFor({ audience: o.aud.id }))}" data-audience="${esc(o.aud.id)}">
            <span class="nc-who-icon">${glyph(o.seg.icon, 24)}</span>
            <span class="nc-who-text"><b>${esc(t(o.seg.label))}</b><span>${esc(t(o.seg.teaser))}</span></span>
            <span class="nc-who-go" aria-hidden="true">${icon('arrow', { size: 18 })}</span>
          </a>
        </li>`,
        )
        .join('')}
    </ul>
  </div>`;
}

export default {
  id: 'niche',
  nav: { en: 'For you', de: 'Für Sie', sl: 'Za vas', hr: 'Za vas', it: 'Per voi' },
  rerenderOn: ['month'],

  render(ctx) {
    const segId = segmentIdFor(ctx.audience);
    return segId ? spotlightHtml(ctx, segId) : whoHtml(ctx);
  },

  async mount(el, ctx) {
    // Audience links switch the version in place (the href still works for new tabs).
    const onClick = (e) => {
      // Only links inside this section: main.js also sets data-audience on <html>.
      const a = e.target.closest('a[data-audience]');
      if (a && el.contains(a) && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
        e.preventDefault();
        ctx.setState({ audience: a.dataset.audience });
        return;
      }
      if (e.target.closest('[data-ask]')) {
        const seg = SEGMENTS[segmentIdFor(ctx.audience)];
        ctx.bus.emit('inquiry:prefill', {
          purpose: ctx.audience.inquiry?.purpose || seg.purpose,
          ...(ctx.state.month ? { month: ctx.state.month } : {}),
          message: fill(ctx.t(L.askMsg), { label: ctx.t(seg.label) }),
        });
      }
    };
    el.addEventListener('click', onClick);
    const cleanup = () => el.removeEventListener('click', onClick);

    const segId = segmentIdFor(ctx.audience);
    if (!segId) return cleanup;
    const seg = SEGMENTS[segId];
    let data;
    try {
      ({ default: data } = await import('../data/niches.json'));
    } catch (err) {
      cleanup();
      throw err;
    }
    const research = (data.segments || []).find((s) => s.id === segId);
    const urls = research?.sources || [];
    seg.facts.forEach((f, i) => {
      const slot = el.querySelector(`[data-src="${i}"]`);
      const matched = urls.filter((u) => f.src.some((p) => u.includes(p)));
      if (slot) slot.outerHTML = sourceLinks(ctx, matched);
    });
    if (research?.confidence === 'low') el.querySelector('[data-lowconf]')?.removeAttribute('hidden');
    return cleanup;
  },
};
