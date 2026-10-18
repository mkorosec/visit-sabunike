// "When to come": a month planner. A 12-month selector bound to state.month,
// a climate chart (air high–low band, sea line, sunshine bars) with a table
// fallback, and for the chosen month: what it is like, what it is good for
// (transparent rules), what's on, and a verdict for the current audience.
// The live weather widget (live-weather.js) sits on top when state.weather is on.
import './seasons.css';
import CLIMATE from '../data/climate.json';
import { esc, icon, monthName, formatMinutes } from '../lib/util.js';
import { driveFor } from './activities.js';
import { liveWeatherHtml, mountLiveWeather, monthVars } from './live-weather.js';

const MONTHS = CLIMATE.months;
const T_MAX = 32; // °C at the top of the temperature chart
const SUN_MAX = 12; // h/day at the top of the sunshine chart
const PEAK = [7, 8];
const SWIM_C = 22; // sea °C from which we call it warm and "Swimming" (words, rules and verdicts agree)
const SHOULDER = [4, 5, 6, 9, 10];

// Data-viz series colours (validated with the dataviz palette checker).
const SERIES = { air: '#eb6834', sea: '#2a78d6', sun: '#eda100', jugo: '#e34948', bura: '#6250d6', maestral: '#1baf7a' };

// ---------------------------------------------------------------- strings
// Month templates: {m} month name, {mIn} month after "in" (sl/hr locative), {M} capitalised (see monthVars).
const L = {
  eyebrow: { en: 'When to come', de: 'Reisezeit', sl: 'Kdaj priti', hr: 'Kada doći', it: 'Quando venire' },
  pick: { en: 'Pick your month', de: 'Wählen Sie Ihren Monat', sl: 'Izberite mesec', hr: 'Odaberite mjesec', it: 'Scegliete il mese' },
  anyMonth: { en: 'Any month', de: 'Beliebiger Monat', sl: 'Kateri koli mesec', hr: 'Bilo koji mjesec', it: 'Qualsiasi mese' },
  suggested: {
    en: 'Showing {m}, a good month for you. Pick yours above.',
    de: 'Gezeigt wird {m}, ein guter Monat für Sie. Wählen Sie oben Ihren.',
    sl: 'Prikazujemo {m}, dober mesec za vas. Zgoraj izberite svojega.',
    hr: 'Prikazan je mjesec {m}, dobar izbor za vas. Gore odaberite svoj.',
    it: 'Vi mostriamo {m}, un buon mese per voi. Scegliete il vostro qui sopra.',
  },
  bestFor: { en: 'Good months for {a}', de: 'Gute Monate für {a}', sl: 'Dobri meseci · {a}', hr: 'Dobri mjeseci · {a}', it: 'Mesi ideali · {a}' },
  chartTitle: { en: 'The year in Sabunike', de: 'Das Jahr in Sabunike', sl: 'Leto v Sabunikah', hr: 'Godina u Sabunikama', it: 'L’anno a Sabunike' },
  legendAir: { en: 'Air: day high – night low', de: 'Luft: Tageshöchst- bis Nachtwert', sl: 'Zrak: dnevna najvišja – nočna najnižja', hr: 'Zrak: dnevni maksimum – noćni minimum', it: 'Aria: massima diurna – minima notturna' },
  legendSea: { en: 'Sea surface', de: 'Meeresoberfläche', sl: 'Površina morja', hr: 'Površina mora', it: 'Superficie del mare' },
  sunTitle: { en: 'Sunshine, hours per day', de: 'Sonnenstunden pro Tag', sl: 'Sonce, ur na dan', hr: 'Sunce, sati dnevno', it: 'Sole, ore al giorno' },
  rainRow: { en: 'Rainy days', de: 'Regentage', sl: 'Deževni dnevi', hr: 'Kišni dani', it: 'Giorni di pioggia' },
  table: { en: 'Show the numbers as a table', de: 'Zahlen als Tabelle zeigen', sl: 'Pokaži številke v tabeli', hr: 'Prikaži brojke u tablici', it: 'Mostra i dati in tabella' },
  month: { en: 'Month', de: 'Monat', sl: 'Mesec', hr: 'Mjesec', it: 'Mese' },
  airHigh: { en: 'Air high', de: 'Luft max.', sl: 'Zrak maks.', hr: 'Zrak maks.', it: 'Aria max' },
  airLow: { en: 'Air low', de: 'Luft min.', sl: 'Zrak min.', hr: 'Zrak min.', it: 'Aria min' },
  seaT: { en: 'Sea', de: 'Meer', sl: 'Morje', hr: 'More', it: 'Mare' },
  sunH: { en: 'Sun h/day', de: 'Sonne h/Tag', sl: 'Sonce h/dan', hr: 'Sunce h/dan', it: 'Sole h/giorno' },
  rainD: { en: 'Rainy days', de: 'Regentage', sl: 'Deževni dnevi', hr: 'Kišni dani', it: 'Giorni di pioggia' },
  rainMm: { en: 'Rain mm', de: 'Regen mm', sl: 'Padavine mm', hr: 'Oborine mm', it: 'Pioggia mm' },
  sourcesText: {
    en: 'Monthly averages for the house’s coordinates: Open-Meteo historical weather 2016–2025 and Open-Meteo marine model 2021–2025 (sea surface), cross-checked with:',
    de: 'Monatsmittel für die Koordinaten des Hauses: Open-Meteo-Wetterarchiv 2016–2025 und Open-Meteo-Meeresmodell 2021–2025 (Wasseroberfläche), abgeglichen mit:',
    sl: 'Mesečna povprečja za koordinate hiše: zgodovinski vremenski podatki Open-Meteo 2016–2025 in morski model Open-Meteo 2021–2025 (površina morja), preverjeno še z:',
    hr: 'Mjesečni prosjeci za koordinate kuće: povijesni vremenski podaci Open-Meteo 2016.–2025. i Open-Meteo model mora 2021.–2025. (površina mora), provjereno i prema:',
    it: 'Medie mensili per le coordinate della casa: archivio meteo Open-Meteo 2016–2025 e modello marino Open-Meteo 2021–2025 (superficie del mare), confrontate con:',
  },
  chartAria: {
    en: 'Climate chart: air temperature from {lo} °C in winter nights to {hi} °C on summer days; sea from {slo} to {shi} °C. The table below has all values.',
    de: 'Klimadiagramm: Lufttemperatur von {lo} °C in Winternächten bis {hi} °C an Sommertagen; Meer von {slo} bis {shi} °C. Die Tabelle unten enthält alle Werte.',
    sl: 'Podnebni graf: temperatura zraka od {lo} °C v zimskih nočeh do {hi} °C v poletnih dneh; morje od {slo} do {shi} °C. Vse vrednosti so v tabeli spodaj.',
    hr: 'Klimatski grafikon: temperatura zraka od {lo} °C u zimskim noćima do {hi} °C ljetnih dana; more od {slo} do {shi} °C. Sve vrijednosti nalaze se u tablici ispod.',
    it: 'Grafico climatico: temperatura dell’aria da {lo} °C nelle notti d’inverno a {hi} °C nei giorni d’estate; mare da {slo} a {shi} °C. La tabella qui sotto riporta tutti i valori.',
  },
  inMonth: { en: '{m} in Sabunike', de: '{m} in Sabunike', sl: '{M} v Sabunikah', hr: '{M} u Sabunikama', it: '{M} a Sabunike' },
  air: { en: 'Air', de: 'Luft', sl: 'Zrak', hr: 'Zrak', it: 'Aria' },
  dayNight: { en: 'day / night', de: 'Tag / Nacht', sl: 'dan / noč', hr: 'dan / noć', it: 'giorno / notte' },
  sea: { en: 'Sea', de: 'Meer', sl: 'Morje', hr: 'More', it: 'Mare' },
  sun: { en: 'Sunshine', de: 'Sonne', sl: 'Sonce', hr: 'Sunce', it: 'Sole' },
  hPerDay: { en: 'h per day', de: 'Std. pro Tag', sl: 'h na dan', hr: 'h dnevno', it: 'h al giorno' },
  rain: { en: 'Rain', de: 'Regen', sl: 'Dež', hr: 'Kiša', it: 'Pioggia' },
  rainyDays: { en: 'rainy days', de: 'Regentage', sl: 'deževnih dni', hr: 'kišnih dana', it: 'giorni di pioggia' },
  wind: { en: 'Wind', de: 'Wind', sl: 'Veter', hr: 'Vjetar', it: 'Vento' },
  ofDays: { en: 'of days', de: 'der Tage', sl: 'dni', hr: 'dana', it: 'dei giorni' },
  windOther: { en: 'other / calm', de: 'sonstige / Flaute', sl: 'drugo / brezvetrje', hr: 'ostalo / bez vjetra', it: 'altro / calma' },
  goodFor: { en: 'Good for', de: 'Gut für', sl: 'Primerno za', hr: 'Dobro za', it: 'Ideale per' },
  howDecide: { en: 'How we decide', de: 'So entscheiden wir', sl: 'Kako presojamo', hr: 'Kako odlučujemo', it: 'Come decidiamo' },
  howDecideText: {
    en: 'Simple rules on the averages above, so you can check them yourself:',
    de: 'Einfache Regeln auf Basis der Mittelwerte oben, zum Nachprüfen:',
    sl: 'Preprosta pravila na podlagi zgornjih povprečij, da jih lahko preverite tudi sami:',
    hr: 'Jednostavna pravila prema gornjim prosjecima, da ih možete i sami provjeriti:',
    it: 'Regole semplici basate sulle medie qui sopra, così potete verificarle da soli:',
  },
  verdictFor: { en: 'Our verdict for {a}', de: 'Unser Fazit für {a}', sl: 'Naša ocena ({a})', hr: 'Naša ocjena ({a})', it: 'Il nostro giudizio ({a})' },
  verdict: { en: 'Our verdict', de: 'Unser Fazit', sl: 'Naša ocena', hr: 'Naša ocjena', it: 'Il nostro giudizio' },
  bestGeneral: { en: 'Best months to visit', de: 'Die besten Reisemonate', sl: 'Najboljši meseci za obisk', hr: 'Najbolji mjeseci za posjet', it: 'I mesi migliori per venire' },
  yes: { en: 'yes', de: 'ja', sl: 'da', hr: 'da', it: 'sì' },
  no: { en: 'no', de: 'nein', sl: 'ne', hr: 'ne', it: 'no' },
  whatsOn: { en: 'What’s on in {m}', de: 'Was ist los im {m}', sl: 'Kaj se dogaja v {mIn}', hr: 'Što se događa u {mIn}', it: 'Cosa succede in {m}' },
  seasonal: { en: 'Only around this time', de: 'Nur um diese Zeit', sl: 'Samo v tem času', hr: 'Samo u ovo doba', it: 'Solo in questo periodo' },
  noEvents: {
    en: 'No festivals listed this month: the beaches, lagoon and roads are yours.',
    de: 'Keine Feste in diesem Monat: Strände, Lagune und Straßen gehören Ihnen.',
    sl: 'Ta mesec ni navedenih festivalov: plaže, laguna in ceste so vaše.',
    hr: 'Ovaj mjesec nema navedenih festivala: plaže, laguna i ceste su vaše.',
    it: 'Nessuna festa in calendario questo mese: spiagge, laguna e strade sono tutte vostre.',
  },
  loadingEvents: { en: 'Loading events…', de: 'Veranstaltungen werden geladen…', sl: 'Nalagamo dogodke…', hr: 'Učitavamo događanja…', it: 'Caricamento degli eventi…' },
  drive: { en: 'by car', de: 'mit dem Auto', sl: 'z avtom', hr: 'automobilom', it: 'in auto' },
  about: { en: 'about', de: 'ca.', sl: 'približno', hr: 'oko', it: 'circa' },
  details: { en: 'Dates & details', de: 'Termine & Details', sl: 'Datumi in podrobnosti', hr: 'Datumi i detalji', it: 'Date e dettagli' },
  ask: { en: 'Ask about {m}', de: '{m} anfragen', sl: 'Povprašajte za {m}', hr: 'Pošaljite upit za mjesec {m}', it: 'Chiedeteci per {m}' },
  askNote: { en: 'We reply personally. No booking fees.', de: 'Wir antworten persönlich. Keine Buchungsgebühren.', sl: 'Odgovorimo osebno. Brez provizij za rezervacijo.', hr: 'Odgovaramo osobno. Bez naknada za rezervaciju.', it: 'Rispondiamo di persona. Nessuna commissione di prenotazione.' },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  peak: { en: 'Peak season · busiest weeks', de: 'Hauptsaison · volle Wochen', sl: 'Glavna sezona · najbolj obiskani tedni', hr: 'Glavna sezona · najposjećeniji tjedni', it: 'Alta stagione · settimane più affollate' },
  shoulder: { en: 'Shoulder season · quieter', de: 'Vor- & Nachsaison · ruhiger', sl: 'Pred- in posezona · mirneje', hr: 'Predsezona i posezona · mirnije', it: 'Media stagione · più tranquilla' },
  low: { en: 'Off-season · very quiet', de: 'Nebensaison · sehr ruhig', sl: 'Izven sezone · zelo mirno', hr: 'Izvan sezone · vrlo mirno', it: 'Bassa stagione · molto tranquilla' },
  levels: {
    great: { en: 'Great time', de: 'Beste Zeit', sl: 'Odličen čas', hr: 'Odlično vrijeme', it: 'Periodo ideale' },
    good: { en: 'Good', de: 'Gut', sl: 'Dobro', hr: 'Dobro', it: 'Buono' },
    fair: { en: 'Possible', de: 'Möglich', sl: 'Mogoče', hr: 'Moguće', it: 'Possibile' },
    poor: { en: 'Not ideal', de: 'Nicht ideal', sl: 'Ni idealno', hr: 'Nije idealno', it: 'Non ideale' },
  },
  mountError: {
    en: 'Part of this planner could not load. The climate figures shown are still correct.',
    de: 'Ein Teil des Planers konnte nicht laden. Die Klimawerte stimmen trotzdem.',
    sl: 'Dela tega načrtovalnika ni bilo mogoče naložiti. Prikazani podnebni podatki so kljub temu pravilni.',
    hr: 'Dio ovog planera nije se mogao učitati. Prikazani klimatski podaci ipak su točni.',
    it: 'Una parte di questo planner non si è caricata. I dati climatici mostrati restano corretti.',
  },
  and: { en: 'and', de: 'und', sl: 'in', hr: 'i', it: 'e' },
};

// Local wind names with the direction they blow from.
const WIND_NAMES = {
  en: { bura: 'Bura (NE)', jugo: 'Jugo (SE)', maestral: 'Maestral (NW)' },
  de: { bura: 'Bura (NO)', jugo: 'Jugo (SO)', maestral: 'Maestral (NW)' },
  sl: { bura: 'Burja (SV)', jugo: 'Jugo (JV)', maestral: 'Maestral (SZ)' },
  hr: { bura: 'Bura (SI)', jugo: 'Jugo (JI)', maestral: 'Maestral (SZ)' },
  it: { bura: 'Bora (NE)', jugo: 'Scirocco (SE)', maestral: 'Maestrale (NO)' },
};
const windNames = (lang) => WIND_NAMES[lang] || WIND_NAMES.en;

// "In words" building blocks.
const WORDS = {
  air: [
    [12, { en: 'Cold days', de: 'Kalte Tage', sl: 'Hladni dnevi', hr: 'Hladni dani', it: 'Giornate fredde' }],
    [16, { en: 'Cool days', de: 'Kühle Tage', sl: 'Sveži dnevi', hr: 'Svježi dani', it: 'Giornate fresche' }],
    [20, { en: 'Mild days', de: 'Milde Tage', sl: 'Mili dnevi', hr: 'Blagi dani', it: 'Giornate miti' }],
    [25, { en: 'Warm days', de: 'Warme Tage', sl: 'Topli dnevi', hr: 'Topli dani', it: 'Giornate calde' }],
    [29, { en: 'Hot days', de: 'Heiße Tage', sl: 'Vroči dnevi', hr: 'Vrući dani', it: 'Giornate molto calde' }],
    [99, { en: 'Very hot days', de: 'Sehr heiße Tage', sl: 'Zelo vroči dnevi', hr: 'Vrlo vrući dani', it: 'Giornate torride' }],
  ],
  sea: [
    [16, { en: 'the sea is cold', de: 'das Meer ist kalt', sl: 'morje je hladno', hr: 'more je hladno', it: 'il mare è freddo' }],
    [19, { en: 'the sea is fresh', de: 'das Meer ist frisch', sl: 'morje je sveže', hr: 'more je svježe', it: 'il mare è fresco' }],
    [22, { en: 'the sea is refreshing', de: 'das Meer ist erfrischend', sl: 'morje je osvežilno', hr: 'more je osvježavajuće', it: 'il mare è rinfrescante' }],
    [25, { en: 'the sea is warm', de: 'das Meer ist warm', sl: 'morje je toplo', hr: 'more je toplo', it: 'il mare è caldo' }],
    [99, { en: 'the sea is at its warmest', de: 'das Meer ist am wärmsten', sl: 'morje je najtoplejše', hr: 'more je najtoplije', it: 'il mare è al massimo del calore' }],
  ],
  rain: [
    [6, { en: 'Mostly dry', de: 'Meist trocken', sl: 'Večinoma suho', hr: 'Uglavnom suho', it: 'Per lo più asciutto' }],
    [10, { en: 'Some showers', de: 'Einige Schauer', sl: 'Občasne plohe', hr: 'Povremeni pljuskovi', it: 'Qualche rovescio' }],
    [99, { en: 'Rain is frequent', de: 'Häufig Regen', sl: 'Pogosto dežuje', hr: 'Kiša je česta', it: 'Piove spesso' }],
  ],
  windLead: {
    bura: {
      en: 'bura is the main wind: cold, dry and gusty, with clear air',
      de: 'Bura ist der Hauptwind: kalt, trocken, böig, mit klarer Sicht',
      sl: 'prevladuje burja: hladna, suha in sunkovita, z bistrim zrakom',
      hr: 'prevladava bura: hladna, suha i na udare, uz čist zrak',
      it: 'il vento principale è la bora: fredda, secca e a raffiche, con aria tersa',
    },
    jugo: {
      en: 'jugo is the main wind: mild, humid and often rainy',
      de: 'Jugo ist der Hauptwind: mild, feucht, oft mit Regen',
      sl: 'prevladuje jugo: mil, vlažen in pogosto deževen',
      hr: 'prevladava jugo: blag, vlažan i često kišovit',
      it: 'il vento principale è lo scirocco: mite, umido e spesso piovoso',
    },
    maestral: {
      en: 'an afternoon maestral breeze cools the coast, mornings are calm',
      de: 'eine Maestral-Brise kühlt die Nachmittage, die Vormittage sind ruhig',
      sl: 'popoldne obalo hladi maestral, jutra so mirna',
      hr: 'poslijepodne obalu hladi maestral, jutra su mirna',
      it: 'nel pomeriggio il maestrale rinfresca la costa, le mattine sono calme',
    },
  },
};

// "Good for" rules. Each one is shown with its rule text under "How we decide".
// act = the activities dataset (null until loaded): windSeasons and item months.
const itemMonths = (act, id) => act?.items.find((x) => x.id === id)?.months || [];
const RULES = [
  {
    id: 'swim',
    icon: 'wave',
    label: { en: 'Swimming', de: 'Baden', sl: 'Kopanje', hr: 'Kupanje', it: 'Nuoto' },
    rule: { en: 'sea at least 22 °C', de: 'Meer mindestens 22 °C', sl: 'morje vsaj 22 °C', hr: 'more najmanje 22 °C', it: 'mare almeno 22 °C' },
    test: (c) => c.seaC >= SWIM_C,
  },
  {
    id: 'dip',
    icon: 'wave',
    label: { en: 'Brisk swims', de: 'Erfrischende Bäder', sl: 'Osvežilno kopanje', hr: 'Osvježavajuće kupanje', it: 'Bagni rinfrescanti' },
    rule: {
      en: 'sea 18–22 °C and day high at least 18 °C',
      de: 'Meer 18–22 °C und Tageshöchstwert ab 18 °C',
      sl: 'morje 18–22 °C in dnevna najvišja temperatura vsaj 18 °C',
      hr: 'more 18–22 °C i dnevni maksimum najmanje 18 °C',
      it: 'mare 18–22 °C e massima diurna di almeno 18 °C',
    },
    test: (c) => c.seaC >= 18 && c.seaC < SWIM_C && c.airMaxC >= 18,
  },
  {
    id: 'beach',
    icon: 'sun',
    label: { en: 'Lazy beach days', de: 'Faule Strandtage', sl: 'Lenarjenje na plaži', hr: 'Lijeni dani na plaži', it: 'Giornate pigre in spiaggia' },
    rule: {
      en: 'day high at least 25 °C and at most 6 rainy days',
      de: 'Tageshöchstwert ab 25 °C und höchstens 6 Regentage',
      sl: 'dnevna najvišja temperatura vsaj 25 °C in največ 6 deževnih dni',
      hr: 'dnevni maksimum najmanje 25 °C i najviše 6 kišnih dana',
      it: 'massima diurna di almeno 25 °C e al massimo 6 giorni di pioggia',
    },
    test: (c) => c.airMaxC >= 25 && c.rainDays <= 6,
  },
  {
    id: 'cycle',
    icon: 'bike',
    label: { en: 'Cycling', de: 'Radfahren', sl: 'Kolesarjenje', hr: 'Biciklizam', it: 'Ciclismo' },
    rule: { en: 'day high 14–27 °C', de: 'Tageshöchstwert 14–27 °C', sl: 'dnevna najvišja temperatura 14–27 °C', hr: 'dnevni maksimum 14–27 °C', it: 'massima diurna 14–27 °C' },
    test: (c) => c.airMaxC >= 14 && c.airMaxC <= 27,
  },
  {
    id: 'hike',
    icon: 'mountain',
    label: { en: 'Hiking Velebit & Pag', de: 'Wandern Velebit & Pag', sl: 'Pohodi na Velebitu in Pagu', hr: 'Planinarenje na Velebitu i Pagu', it: 'Escursioni sul Velebit e a Pag' },
    rule: {
      en: 'day high 12–26 °C (the Pag and Paklenica trails have little shade)',
      de: 'Tageshöchstwert 12–26 °C (auf Pag und in Paklenica gibt es wenig Schatten)',
      sl: 'dnevna najvišja temperatura 12–26 °C (poti na Pagu in v Paklenici imajo malo sence)',
      hr: 'dnevni maksimum 12–26 °C (staze na Pagu i u Paklenici imaju malo hlada)',
      it: 'massima diurna 12–26 °C (i sentieri di Pag e Paklenica hanno poca ombra)',
    },
    test: (c) => c.airMaxC >= 12 && c.airMaxC <= 26,
  },
  {
    id: 'kite',
    icon: 'kite',
    label: { en: 'Kite lessons', de: 'Kitekurse', sl: 'Tečaji kajtanja', hr: 'Tečajevi kitesurfa', it: 'Lezioni di kite' },
    rule: {
      en: 'beginner wind season at Ždrijac (maestral) and the school is open',
      de: 'Anfänger-Windsaison in Ždrijac (Maestral) und die Schule hat geöffnet',
      sl: 'sezona vetra za začetnike na Ždrijcu (maestral) in šola je odprta',
      hr: 'sezona vjetra za početnike na Ždrijacu (maestral) i škola radi',
      it: 'stagione di vento per principianti a Ždrijac (maestrale) e scuola aperta',
    },
    test: (c, act) => /beginner/.test(act?.windSeasons?.months.find((w) => w.month === c.month)?.kiteSuitability || ''),
  },
  {
    id: 'kitepro',
    icon: 'kite',
    label: { en: 'Kiting for experienced riders', de: 'Kiten für Erfahrene', sl: 'Kajtanje za izkušene', hr: 'Kitesurf za iskusne', it: 'Kite per esperti' },
    rule: {
      en: 'stronger, changeable jugo or bura days, no beginner season',
      de: 'stärkere, wechselhafte Jugo- oder Bura-Tage, keine Anfängersaison',
      sl: 'močnejši, spremenljivi dnevi z jugom ali burjo, ni sezona za začetnike',
      hr: 'jači, promjenjivi dani s jugom ili burom, nije sezona za početnike',
      it: 'giornate di scirocco o bora più forti e variabili, non è stagione per principianti',
    },
    test: (c, act) => (act?.windSeasons?.months.find((w) => w.month === c.month)?.kiteSuitability || '') === 'experienced',
  },
  {
    id: 'mud',
    icon: 'leaf',
    label: { en: 'Nin healing mud', de: 'Heilschlamm in Nin', sl: 'Zdravilno blato v Ninu', hr: 'Ljekovito blato u Ninu', it: 'Fango curativo di Nin' },
    rule: { en: 'traditional mud season in the lagoon', de: 'traditionelle Schlammsaison in der Lagune', sl: 'tradicionalna sezona blata v laguni', hr: 'tradicionalna sezona blata u laguni', it: 'stagione tradizionale dei fanghi nella laguna' },
    test: (c, act) => itemMonths(act, 'nin-healing-mud').includes(c.month),
  },
  {
    id: 'birds',
    icon: 'star',
    label: { en: 'Birdwatching', de: 'Vogelbeobachtung', sl: 'Opazovanje ptic', hr: 'Promatranje ptica', it: 'Birdwatching' },
    rule: { en: 'migration months at the Nin salt pans', de: 'Zugmonate an der Saline Nin', sl: 'meseci selitve ptic na ninskih solinah', hr: 'mjeseci seobe ptica na ninskoj solani', it: 'mesi di migrazione alle saline di Nin' },
    test: (c, act) => itemMonths(act, 'nin-birdwatching').includes(c.month),
  },
  {
    id: 'town',
    icon: 'pin',
    label: { en: 'Old towns: Nin & Zadar', de: 'Altstädte: Nin & Zadar', sl: 'Stara mestna jedra: Nin in Zadar', hr: 'Stari gradovi: Nin i Zadar', it: 'Centri storici: Nin e Zadar' },
    rule: {
      en: 'day high 14–28 °C, comfortable for walking around',
      de: 'Tageshöchstwert 14–28 °C, angenehm zum Bummeln',
      sl: 'dnevna najvišja temperatura 14–28 °C, prijetno za sprehode',
      hr: 'dnevni maksimum 14–28 °C, ugodno za šetnju',
      it: 'massima diurna 14–28 °C, piacevole per passeggiare',
    },
    test: (c) => c.airMaxC >= 14 && c.airMaxC <= 28,
  },
  {
    id: 'quiet',
    icon: 'leaf',
    label: { en: 'Quiet roads & beaches', de: 'Ruhige Straßen & Strände', sl: 'Mirne ceste in plaže', hr: 'Mirne ceste i plaže', it: 'Strade e spiagge tranquille' },
    rule: { en: 'outside July and August', de: 'außerhalb von Juli und August', sl: 'zunaj julija in avgusta', hr: 'izvan srpnja i kolovoza', it: 'fuori da luglio e agosto' },
    test: (c) => !PEAK.includes(c.month),
  },
];

// Audience profiles: who they are, which number the month buttons show, the verdict.
// Niche audience ids are matched loosely so new versions get a sensible verdict.
const PROFILES = [
  { re: /famil|multi|reunion/, kind: 'families' },
  { re: /cycl/, kind: 'cyclists' },
  { re: /retreat|compan/, kind: 'retreats' },
  { re: /kite|wind/, kind: 'kite' },
  { re: /mud|well|senior/, kind: 'wellness' },
  { re: /^nature$|bird|photo/, kind: 'birders' },
  { re: /remote|nomad/, kind: 'remote' },
  { re: /dog/, kind: 'dogs' },
  { re: /field|school|study/, kind: 'fieldtrips' },
  { re: /naturist/, kind: 'beach' },
];
const profileKind = (audience) => PROFILES.find((p) => p.re.test(audience.id))?.kind || 'general';

const TITLES = {
  general: {
    en: 'Pick a month, see what it’s really like',
    de: 'Monat wählen und sehen, wie es wirklich ist',
    sl: 'Izberite mesec in poglejte, kakšen je v resnici',
    hr: 'Odaberite mjesec i pogledajte kakav je zaista',
    it: 'Scegliete un mese e scoprite com’è davvero',
  },
  families: {
    en: 'When is the sea warm enough for the kids?',
    de: 'Wann ist das Meer warm genug für die Kinder?',
    sl: 'Kdaj je morje dovolj toplo za otroke?',
    hr: 'Kada je more dovoljno toplo za djecu?',
    it: 'Quando il mare è abbastanza caldo per i bambini?',
  },
  cyclists: {
    en: 'When to ride: the spring and autumn sweet spots',
    de: 'Wann radeln: die besten Wochen im Frühling und Herbst',
    sl: 'Kdaj kolesariti: najlepši tedni spomladi in jeseni',
    hr: 'Kada voziti bicikl: najbolji tjedni u proljeće i jesen',
    it: 'Quando pedalare: le settimane migliori di primavera e autunno',
  },
  retreats: { en: 'When to bring the team', de: 'Wann das Team kommen sollte', sl: 'Kdaj pripeljati ekipo', hr: 'Kada dovesti tim', it: 'Quando portare il team' },
  kite: { en: 'When the wind is right', de: 'Wann der Wind passt', sl: 'Kdaj je veter pravi', hr: 'Kada je vjetar pravi', it: 'Quando il vento è quello giusto' },
};
const LEDES = {
  kite: {
    en: 'From May to September (sometimes into October) a thermal maestral builds in the Nin lagoon late in the morning and fades towards sunset: beginner season. Spring and autumn bring stronger jugo and bura days for experienced riders.',
    de: 'Von Mai bis September (manchmal bis in den Oktober) baut sich in der Lagune von Nin am späten Vormittag ein thermischer Maestral auf und lässt gegen Abend nach: Anfängersaison. Frühling und Herbst bringen stärkere Jugo- und Bura-Tage für Erfahrene.',
    sl: 'Od maja do septembra (včasih tudi v oktobru) se v ninski laguni pozno dopoldne okrepi termični maestral, ki proti sončnemu zahodu pojenja: sezona za začetnike. Pomlad in jesen prineseta močnejše dneve z jugom in burjo za izkušene.',
    hr: 'Od svibnja do rujna (ponekad i u listopadu) u ninskoj laguni kasno prijepodne zapuše termički maestral i stiša se prema zalasku sunca: sezona za početnike. Proljeće i jesen donose jače dane s jugom i burom za iskusne.',
    it: 'Da maggio a settembre (a volte fino a ottobre) nella laguna di Nin a fine mattinata si alza un maestrale termico che cala verso il tramonto: è la stagione per principianti. Primavera e autunno portano giornate di scirocco e bora più forti per i rider esperti.',
  },
  general: {
    en: 'Weather for our coordinates, month by month (air 2016–2025, sea 2021–2025): air and sea temperature, sunshine, rain and the winds locals plan their day around.',
    de: 'Wetter für unsere Koordinaten, Monat für Monat (Luft 2016–2025, Meer 2021–2025): Luft- und Wassertemperatur, Sonne, Regen und die Winde, nach denen sich hier der Tag richtet.',
    sl: 'Vreme za naše koordinate, mesec za mesecem (zrak 2016–2025, morje 2021–2025): temperatura zraka in morja, sonce, dež in vetrovi, po katerih domačini načrtujejo svoj dan.',
    hr: 'Vrijeme za naše koordinate, mjesec po mjesec (zrak 2016.–2025., more 2021.–2025.): temperatura zraka i mora, sunce, kiša i vjetrovi prema kojima mještani planiraju dan.',
    it: 'Il meteo per le nostre coordinate, mese per mese (aria 2016–2025, mare 2021–2025): temperatura dell’aria e del mare, sole, pioggia e i venti su cui la gente del posto organizza la giornata.',
  },
  families: {
    en: 'The shallow lagoon warms up fast, and the sea stays warm into September (about 23 °C, warmer than June). Here is when it is bath-warm, and what else is on.',
    de: 'Die flache Lagune wärmt sich schnell auf, und das Meer bleibt bis in den September warm (ca. 23 °C, wärmer als im Juni). Hier sehen Sie, wann es badewannenwarm ist und was sonst los ist.',
    sl: 'Plitva laguna se hitro segreje, morje pa ostane toplo vse do septembra (približno 23 °C, topleje kot junija). Tukaj vidite, kdaj je toplo kot v kadi in kaj se še dogaja.',
    hr: 'Plitka laguna brzo se zagrije, a more ostaje toplo sve do rujna (oko 23 °C, toplije nego u lipnju). Ovdje vidite kada je toplo kao u kadi i što se još događa.',
    it: 'La laguna bassa si scalda in fretta e il mare resta caldo fino a settembre (circa 23 °C, più che a giugno). Qui vedete quando l’acqua è calda come in vasca e cos’altro succede.',
  },
  cyclists: {
    en: 'Day highs of 17–24 °C, quiet roads and light winds: here is when that happens, and when bura or summer heat change the plan.',
    de: 'Tageshöchstwerte von 17–24 °C, ruhige Straßen, wenig Wind: wann das so ist und wann Bura oder Sommerhitze den Plan ändern.',
    sl: 'Dnevne najvišje temperature 17–24 °C, mirne ceste in šibek veter: tukaj vidite, kdaj je tako in kdaj načrte spremenita burja ali poletna vročina.',
    hr: 'Dnevni maksimumi od 17–24 °C, mirne ceste i slab vjetar: ovdje vidite kada je tako, a kada bura ili ljetna vrućina mijenjaju plan.',
    it: 'Massime di 17–24 °C, strade tranquille e vento leggero: ecco quando succede, e quando la bora o il caldo estivo cambiano i piani.',
  },
  retreats: {
    en: 'Spring and early autumn give you mild garden sessions, empty roads and quieter restaurants than July and August.',
    de: 'Frühling und Frühherbst bieten milde Sessions im Garten, leere Straßen und ruhigere Restaurants als Juli und August.',
    sl: 'Pomlad in zgodnja jesen prinašata prijetna srečanja na vrtu, prazne ceste in mirnejše restavracije kot julij in avgust.',
    hr: 'Proljeće i rana jesen donose ugodne sastanke u vrtu, prazne ceste i mirnije restorane nego srpanj i kolovoz.',
    it: 'Primavera e inizio autunno offrono sessioni miti in giardino, strade vuote e ristoranti più tranquilli che a luglio e agosto.',
  },
};

// ---------------------------------------------------------------- helpers
const fmt = (v, lang, d = 0) => new Intl.NumberFormat(lang, { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
const fill = (s, vars) => Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v), s);
const pick = (table, v) => table.find(([max]) => v < max)[1];

// Wind shares are stated in the climate notes as "bura ~45%" etc.
function windShares(note) {
  const out = {};
  for (const m of String(note).matchAll(/(bura|jugo|maestral)\b[^%;.]{0,40}?~(\d+)%/gi)) {
    const k = m[1].toLowerCase();
    if (!(k in out)) out[k] = Number(m[2]);
  }
  return out;
}

function seasonKind(m) {
  if (PEAK.includes(m)) return 'peak';
  if (SHOULDER.includes(m)) return 'shoulder';
  return 'low';
}

// Next good month for this audience, counting from today.
function suggestedMonth(audience) {
  const list = audience.months?.length ? audience.months : [6];
  const now = new Date().getMonth() + 1;
  for (let i = 0; i < 12; i += 1) {
    const m = ((now - 1 + i) % 12) + 1;
    if (list.includes(m)) return m;
  }
  return list[0];
}

// Verdict text per language. Optional suffixes ({ en, de, sl, hr, it }) are appended to each language.
const EMPTY = { en: '', de: '', sl: '', hr: '', it: '' };
function verdict(kind, c) {
  const { airMaxC: hi, seaC: sea, rainDays: rd, month: m } = c;
  const deg = (v) => `${Math.round(v)} °C`;
  const V = (level, text, ...suffixes) => ({
    level,
    text: Object.fromEntries(Object.entries(text).map(([k, s]) => [k, s + suffixes.map((x) => x[k] || '').join('')])),
  });
  switch (kind) {
    case 'families': {
      const heat = hi >= 29
        ? {
            en: ' Middays are hot: beach in the morning and late afternoon, shade at noon.',
            de: ' Mittags ist es heiß: morgens und am späten Nachmittag an den Strand, mittags in den Schatten.',
            sl: ' Opoldne je vroče: na plažo zjutraj in pozno popoldne, opoldne v senco.',
            hr: ' U podne je vruće: na plažu ujutro i kasno poslijepodne, u podne u hlad.',
            it: ' A mezzogiorno fa caldo: spiaggia al mattino e nel tardo pomeriggio, all’ombra nelle ore centrali.',
          }
        : EMPTY;
      const peak = PEAK.includes(m)
        ? {
            en: ' School-holiday peak: ask early for these weeks.',
            de: ' Ferien-Hochsaison: für diese Wochen früh anfragen.',
            sl: ' Vrhunec šolskih počitnic: za te tedne povprašajte zgodaj.',
            hr: ' Vrhunac školskih praznika: za ove tjedne pošaljite upit na vrijeme.',
            it: ' Picco delle vacanze scolastiche: per queste settimane chiedeteci per tempo.',
          }
        : EMPTY;
      if (sea >= 24)
        return V('great', {
          en: `The sea is bath-warm (about ${deg(sea)}), perfect for long splashing sessions in knee-deep water.`,
          de: `Das Meer ist badewannenwarm (ca. ${deg(sea)}), ideal zum stundenlangen Planschen im knietiefen Wasser.`,
          sl: `Morje je toplo kot v kadi (približno ${deg(sea)}), kot nalašč za dolgo čofotanje v vodi do kolen.`,
          hr: `More je toplo kao u kadi (oko ${deg(sea)}), savršeno za dugo brčkanje u vodi do koljena.`,
          it: `Il mare è caldo come una vasca da bagno (circa ${deg(sea)}), perfetto per sguazzare a lungo nell’acqua alta fino al ginocchio.`,
        }, heat, peak);
      if (sea >= SWIM_C)
        return V('good', {
          en: `The sea is warm enough for most kids (about ${deg(sea)}); the shallow lagoon is warmer still on sunny days.`,
          de: `Das Meer ist für die meisten Kinder warm genug (ca. ${deg(sea)}); die flache Lagune ist an sonnigen Tagen noch wärmer.`,
          sl: `Morje je dovolj toplo za večino otrok (približno ${deg(sea)}); plitva laguna je ob sončnih dneh še toplejša.`,
          hr: `More je dovoljno toplo za većinu djece (oko ${deg(sea)}); plitka laguna za sunčanih je dana još toplija.`,
          it: `Il mare è abbastanza caldo per la maggior parte dei bambini (circa ${deg(sea)}); nelle giornate di sole la laguna bassa è ancora più calda.`,
        }, heat, peak);
      if (sea >= 19)
        return V('fair', {
          en: `The sea is refreshing rather than warm (about ${deg(sea)}): fine for quick dips, a bit cold for toddlers. Great for beach walks, the salt works and bike rides.`,
          de: `Das Meer ist eher erfrischend als warm (ca. ${deg(sea)}): gut für kurze Bäder, für Kleinkinder etwas kalt. Ideal für Strandspaziergänge, die Saline und Radtouren.`,
          sl: `Morje je bolj osvežilno kot toplo (približno ${deg(sea)}): primerno za hitro namakanje, za malčke nekoliko hladno. Odlično za sprehode po plaži, ogled solin in izlete s kolesom.`,
          hr: `More je više osvježavajuće nego toplo (oko ${deg(sea)}): dobro za kratko kupanje, za malu djecu malo hladno. Odlično za šetnje plažom, solanu i vožnje biciklom.`,
          it: `Il mare è più rinfrescante che caldo (circa ${deg(sea)}): va bene per un tuffo veloce, un po’ freddo per i più piccoli. Ottimo per passeggiate in spiaggia, le saline e giri in bici.`,
        });
      return V('poor', {
        en: `Too cold for most kids to swim (sea about ${deg(sea)}). A quiet time for walks, Nin’s old town and nature, not a beach holiday.`,
        de: `Für die meisten Kinder zu kalt zum Baden (Meer ca. ${deg(sea)}). Ruhige Zeit für Spaziergänge, Nins Altstadt und Natur, aber kein Strandurlaub.`,
        sl: `Za kopanje je za večino otrok prehladno (morje približno ${deg(sea)}). Miren čas za sprehode, staro jedro Nina in naravo, ne pa za počitnice na plaži.`,
        hr: `Za kupanje je većini djece prehladno (more oko ${deg(sea)}). Mirno doba za šetnje, stari Nin i prirodu, ali ne za odmor na plaži.`,
        it: `Troppo freddo per far fare il bagno alla maggior parte dei bambini (mare circa ${deg(sea)}). Un periodo tranquillo per passeggiate, il centro storico di Nin e la natura, non per una vacanza al mare.`,
      });
    }
    case 'cyclists': {
      const r = Math.round(rd);
      const wet = rd >= 11
        ? {
            en: ` Expect a wet day or two each week (${r} rainy days).`,
            de: ` Rechnen Sie mit ein, zwei nassen Tagen pro Woche (${r} Regentage).`,
            sl: ` Računajte na dan ali dva dežja na teden (deževnih dni: ${r}).`,
            hr: ` Računajte na dan-dva kiše tjedno (kišnih dana: ${r}).`,
            it: ` Mettete in conto uno o due giorni di pioggia a settimana (${r} giorni di pioggia).`,
          }
        : EMPTY;
      if (hi >= 17 && hi <= 24)
        return V('great', {
          en: `Ideal riding weather: day highs around ${deg(hi)}, warm enough for short sleeves by late morning.`,
          de: `Ideales Radwetter: Höchstwerte um ${deg(hi)}, ab dem späten Vormittag reicht kurzes Trikot.`,
          sl: `Idealno vreme za kolesarjenje: dnevne najvišje temperature okoli ${deg(hi)}, do poznega dopoldneva dovolj toplo za kratke rokave.`,
          hr: `Idealno vrijeme za vožnju: dnevni maksimumi oko ${deg(hi)}, do kasnog prijepodneva dovoljno toplo za kratke rukave.`,
          it: `Tempo ideale per pedalare: massime di circa ${deg(hi)}, a fine mattinata basta la maglia a maniche corte.`,
        }, wet);
      if (hi >= 14 && hi < 17)
        return V('good', {
          en: `Good riding with a layer: highs around ${deg(hi)}, cool mornings, watch for bura days on the Velebit climbs.`,
          de: `Gutes Radwetter mit Jacke: Höchstwerte um ${deg(hi)}, kühle Morgen, an Bura-Tagen Vorsicht an den Velebit-Anstiegen.`,
          sl: `Dobro za kolesarjenje z dodatno plastjo: najvišje okoli ${deg(hi)}, hladna jutra, ob burji bodite previdni na vzponih na Velebit.`,
          hr: `Dobro za vožnju uz dodatni sloj: maksimumi oko ${deg(hi)}, svježa jutra, za bure oprez na usponima na Velebit.`,
          it: `Buono per pedalare con uno strato in più: massime di circa ${deg(hi)}, mattine fresche, attenzione alle giornate di bora sulle salite del Velebit.`,
        }, wet);
      if (hi > 24 && hi <= 27)
        return V('good', {
          en: `Good riding if you start early: highs around ${deg(hi)}, the coast road gets warm after noon.`,
          de: `Gut, wenn Sie früh starten: Höchstwerte um ${deg(hi)}, ab Mittag wird die Küstenstraße warm.`,
          sl: `Dobro, če začnete zgodaj: najvišje okoli ${deg(hi)}, obalna cesta se po poldnevu segreje.`,
          hr: `Dobro ako krenete rano: maksimumi oko ${deg(hi)}, obalna cesta poslije podneva postaje topla.`,
          it: `Buono se partite presto: massime di circa ${deg(hi)}, la strada costiera si scalda dopo mezzogiorno.`,
        }, wet);
      if (hi > 27)
        return V(hi > 29 ? 'poor' : 'fair', {
          en: `Hot: highs around ${deg(hi)}. Ride at dawn and swim in the afternoon; the long climbs are hard work in this heat.`,
          de: `Heiß: Höchstwerte um ${deg(hi)}. Im Morgengrauen fahren, nachmittags baden; lange Anstiege sind bei dieser Hitze hart.`,
          sl: `Vroče: najvišje okoli ${deg(hi)}. Kolesarite ob zori, popoldne se kopajte; dolgi vzponi so v tej vročini naporni.`,
          hr: `Vruće: maksimumi oko ${deg(hi)}. Vozite u zoru, a poslijepodne se kupajte; dugi usponi po ovoj su vrućini naporni.`,
          it: `Caldo: massime di circa ${deg(hi)}. Pedalate all’alba e fate il bagno il pomeriggio; con questo caldo le salite lunghe sono faticose.`,
        });
      return V('fair', {
        en: `Cold and often windy: highs around ${deg(hi)} and bura gusts. For hardy riders with winter kit.`,
        de: `Kalt und oft windig: Höchstwerte um ${deg(hi)} und Bura-Böen. Für Hartgesottene mit Winterausrüstung.`,
        sl: `Hladno in pogosto vetrovno: najvišje okoli ${deg(hi)} in sunki burje. Za utrjene kolesarje z zimsko opremo.`,
        hr: `Hladno i često vjetrovito: maksimumi oko ${deg(hi)} i udari bure. Za izdržljive bicikliste sa zimskom opremom.`,
        it: `Freddo e spesso ventoso: massime di circa ${deg(hi)} e raffiche di bora. Per ciclisti tenaci con abbigliamento invernale.`,
      }, wet);
    }
    case 'retreats': {
      // TODO(owner): off-season whole-house pricing (open question in research/retreats.json)
      if (SHOULDER.includes(m) && hi >= 17 && hi <= 28)
        return V('great', {
          en: `Mild enough for sessions in the garden (highs around ${deg(hi)}), and the roads and restaurants are quieter. Ask us about shoulder-season rates for the whole house.`,
          de: `Mild genug für Sessions im Garten (Höchstwerte um ${deg(hi)}), Straßen und Restaurants sind ruhiger. Fragen Sie uns nach Vor- und Nachsaisonpreisen für das ganze Haus.`,
          sl: `Dovolj milo za srečanja na vrtu (najvišje okoli ${deg(hi)}), ceste in restavracije pa so mirnejše. Vprašajte nas za cene celotne hiše v pred- in posezoni.`,
          hr: `Dovoljno blago za sastanke u vrtu (maksimumi oko ${deg(hi)}), a ceste i restorani su mirniji. Pitajte nas za cijene cijele kuće u predsezoni i posezoni.`,
          it: `Abbastanza mite per sessioni in giardino (massime di circa ${deg(hi)}), con strade e ristoranti più tranquilli. Chiedeteci le tariffe di media stagione per tutta la casa.`,
        });
      if (PEAK.includes(m))
        return V('fair', {
          en: `Peak season: hot (around ${deg(hi)}) and busy. Possible, but book early and plan work for the morning.`,
          de: `Hauptsaison: heiß (um ${deg(hi)}) und voll. Möglich, aber früh buchen und morgens arbeiten.`,
          sl: `Glavna sezona: vroče (okoli ${deg(hi)}) in polno ljudi. Mogoče, a rezervirajte zgodaj in delo načrtujte za dopoldne.`,
          hr: `Glavna sezona: vruće (oko ${deg(hi)}) i gužva. Moguće, ali rezervirajte rano i rad planirajte za jutro.`,
          it: `Alta stagione: caldo (circa ${deg(hi)}) e affollato. Si può fare, ma prenotate presto e lavorate al mattino.`,
        });
      return V('good', {
        en: `Very quiet and cool (highs around ${deg(hi)}): good for focused indoor work and walks. Ask us about heating and long-table space.`,
        de: `Sehr ruhig und kühl (Höchstwerte um ${deg(hi)}): gut für konzentriertes Arbeiten drinnen und Spaziergänge. Fragen Sie uns nach Heizung und Platz für lange Tische.`,
        sl: `Zelo mirno in hladno (najvišje okoli ${deg(hi)}): primerno za zbrano delo v zaprtih prostorih in sprehode. Vprašajte nas o ogrevanju in prostoru za dolgo mizo.`,
        hr: `Vrlo mirno i svježe (maksimumi oko ${deg(hi)}): dobro za usredotočen rad u zatvorenom i šetnje. Pitajte nas o grijanju i prostoru za dugi stol.`,
        it: `Molto tranquillo e fresco (massime di circa ${deg(hi)}): adatto al lavoro concentrato al chiuso e alle passeggiate. Chiedeteci di riscaldamento e spazio per un tavolo lungo.`,
      });
    }
    case 'kite': {
      const s = c.kite || '';
      if (/beginner/.test(s))
        return V('great', {
          en: 'Beginner season at Ždrijac: a steady thermal maestral builds late morning and fades towards sunset, in a shallow, closed lagoon.',
          de: 'Anfängersaison in Ždrijac: ein stetiger thermischer Maestral setzt am späten Vormittag ein und lässt gegen Abend nach, in einer flachen, geschlossenen Lagune.',
          sl: 'Sezona za začetnike na Ždrijcu: enakomeren termični maestral se okrepi pozno dopoldne in pojenja proti sončnemu zahodu, v plitvi, zaprti laguni.',
          hr: 'Sezona za početnike na Ždrijacu: stalni termički maestral zapuše kasno prijepodne i stiša se prema zalasku sunca, u plitkoj, zatvorenoj laguni.',
          it: 'Stagione per principianti a Ždrijac: un maestrale termico costante si alza a fine mattinata e cala verso il tramonto, in una laguna bassa e chiusa.',
        });
      if (s === 'experienced')
        return V('good', {
          en: 'For experienced riders: stronger, more changeable jugo and bura days, no daily thermal. The school season runs from May to late October.',
          de: 'Für Erfahrene: stärkere, wechselhafte Jugo- und Bura-Tage, keine tägliche Thermik. Die Schule hat von Mai bis Ende Oktober geöffnet.',
          sl: 'Za izkušene: močnejši, bolj spremenljivi dnevi z jugom in burjo, brez vsakodnevnega termičnega vetra. Šola je odprta od maja do konca oktobra.',
          hr: 'Za iskusne: jači, promjenjiviji dani s jugom i burom, bez svakodnevnog termičkog vjetra. Škola radi od svibnja do kraja listopada.',
          it: 'Per rider esperti: giornate di scirocco e bora più forti e variabili, senza il vento termico quotidiano. La scuola è aperta da maggio a fine ottobre.',
        });
      return V('poor', {
        en: 'Winter bura is strong, gusty and most dangerous in the Nin bay. Experts only, and the school is closed.',
        de: 'Die Winter-Bura ist stark, böig und in der Bucht von Nin am gefährlichsten. Nur für Experten, die Schule ist geschlossen.',
        sl: 'Zimska burja je močna, sunkovita in v ninskem zalivu najnevarnejša. Samo za strokovnjake, šola je zaprta.',
        hr: 'Zimska bura je jaka, na udare i u ninskom zaljevu najopasnija. Samo za stručnjake, a škola ne radi.',
        it: 'La bora invernale è forte, a raffiche e particolarmente pericolosa nella baia di Nin. Solo per esperti, e la scuola è chiusa.',
      });
    }
    case 'wellness': {
      if (c.mud)
        return V('great', {
          en: `Healing-mud season in the Nin lagoon, a short walk from the house; the sea is warm (about ${deg(sea)}) for rinsing off.`,
          de: `Heilschlamm-Saison in der Lagune von Nin, nur ein kurzer Spaziergang vom Haus; das Meer ist zum Abspülen warm (ca. ${deg(sea)}).`,
          sl: `Sezona zdravilnega blata v ninski laguni, le kratek sprehod od hiše; morje je za izpiranje toplo (približno ${deg(sea)}).`,
          hr: `Sezona ljekovitog blata u ninskoj laguni, u kratkoj šetnji od kuće; more je toplo za ispiranje (oko ${deg(sea)}).`,
          it: `Stagione dei fanghi curativi nella laguna di Nin, a una breve passeggiata dalla casa; il mare è caldo (circa ${deg(sea)}) per sciacquarsi.`,
        });
      if (hi >= 17 && hi <= 27)
        return V('good', {
          en: `Mild days around ${deg(hi)}: good for long stays, walks and gentle rides. The mud tradition is a July–August thing.`,
          de: `Milde Tage um ${deg(hi)}: gut für lange Aufenthalte, Spaziergänge und gemütliche Radtouren. Die Schlammtradition gehört in den Juli und August.`,
          sl: `Mili dnevi okoli ${deg(hi)}: primerno za daljše bivanje, sprehode in lagodne vožnje s kolesom. Tradicija blata je stvar julija in avgusta.`,
          hr: `Blagi dani oko ${deg(hi)}: dobro za dulji boravak, šetnje i lagane vožnje biciklom. Tradicija blata vezana je uz srpanj i kolovoz.`,
          it: `Giornate miti, con massime di circa ${deg(hi)}: ideali per soggiorni lunghi, passeggiate e giri in bici tranquilli. La tradizione dei fanghi è cosa di luglio e agosto.`,
        });
      return V('fair', {
        en: `Cool and quiet (highs around ${deg(hi)}). Restful, but no mud season.`,
        de: `Kühl und ruhig (Höchstwerte um ${deg(hi)}). Erholsam, aber keine Schlammsaison.`,
        sl: `Sveže in mirno (najvišje okoli ${deg(hi)}). Sproščujoče, a zunaj sezone blata.`,
        hr: `Svježe i mirno (maksimumi oko ${deg(hi)}). Opuštajuće, ali izvan sezone blata.`,
        it: `Fresco e tranquillo (massime di circa ${deg(hi)}). Rilassante, ma fuori stagione per i fanghi.`,
      });
    }
    case 'birders':
      if (c.birds)
        return V('great', {
          en: 'Migration months at the Nin salt pans and lagoon (Natura 2000), and soft light on Velebit for photographers.',
          de: 'Zugmonate an der Saline und Lagune von Nin (Natura 2000) und weiches Licht am Velebit für Fotografen.',
          sl: 'Meseci selitve ptic na ninskih solinah in v laguni (Natura 2000), za fotografe pa mehka svetloba na Velebitu.',
          hr: 'Mjeseci seobe ptica na ninskoj solani i u laguni (Natura 2000), a za fotografe meko svjetlo na Velebitu.',
          it: 'Mesi di migrazione alle saline e nella laguna di Nin (Natura 2000), e luce morbida sul Velebit per i fotografi.',
        });
      return V('fair', {
        en: 'Outside the main migration months. Still good for landscapes, the Pag moonscape and Velebit light.',
        de: 'Außerhalb der Hauptzugzeit. Trotzdem gut für Landschaften, die Mondlandschaft von Pag und das Velebit-Licht.',
        sl: 'Zunaj glavnih mesecev selitve. Še vedno lepo za pokrajino, lunino pokrajino Paga in svetlobo na Velebitu.',
        hr: 'Izvan glavnih mjeseci seobe. Ipak dobro za krajolike, paški mjesečev krajolik i svjetlo Velebita.',
        it: 'Fuori dai mesi principali di migrazione. Comunque ottimo per i paesaggi, il paesaggio lunare di Pag e la luce del Velebit.',
      });
    case 'remote':
      if (!PEAK.includes(m) && !SHOULDER.includes(m))
        return V('good', {
          en: `Off-season quiet: highs around ${deg(hi)} and empty beaches for lunch walks. Ask us about monthly stays.`,
          de: `Ruhige Nebensaison: Höchstwerte um ${deg(hi)} und leere Strände für die Mittagspause. Fragen Sie nach Monatsaufenthalten.`,
          sl: `Mir zunaj sezone: najvišje okoli ${deg(hi)} in prazne plaže za sprehod med kosilom. Vprašajte nas za mesečno bivanje.`,
          hr: `Mir izvan sezone: maksimumi oko ${deg(hi)} i prazne plaže za šetnju u pauzi za ručak. Pitajte nas za mjesečni boravak.`,
          it: `La quiete della bassa stagione: massime di circa ${deg(hi)} e spiagge vuote per la passeggiata in pausa pranzo. Chiedeteci dei soggiorni mensili.`,
        });
      if (PEAK.includes(m))
        return V('fair', {
          en: 'Peak season: hot and busy. Spring, autumn and winter suit long stays better.',
          de: 'Hauptsaison: heiß und voll. Für lange Aufenthalte passen Frühling, Herbst und Winter besser.',
          sl: 'Glavna sezona: vroče in polno ljudi. Za daljše bivanje so bolj primerni pomlad, jesen in zima.',
          hr: 'Glavna sezona: vruće i gužva. Za dulji boravak bolji su proljeće, jesen i zima.',
          it: 'Alta stagione: caldo e affollato. Per i soggiorni lunghi sono più adatti primavera, autunno e inverno.',
        });
      return V('great', {
        en: `Mild (around ${deg(hi)}) and quieter than summer: swim or ride after work. Ask us about longer stays.`,
        de: `Mild (um ${deg(hi)}) und ruhiger als im Sommer: nach Feierabend baden oder radeln. Fragen Sie nach längeren Aufenthalten.`,
        sl: `Milo (okoli ${deg(hi)}) in mirneje kot poleti: po službi na kopanje ali kolo. Vprašajte nas za daljše bivanje.`,
        hr: `Blago (oko ${deg(hi)}) i mirnije nego ljeti: poslije posla kupanje ili bicikl. Pitajte nas za dulji boravak.`,
        it: `Mite (circa ${deg(hi)}) e più tranquillo dell’estate: dopo il lavoro un bagno o un giro in bici. Chiedeteci dei soggiorni più lunghi.`,
      });
    case 'dogs':
      if (hi <= 26)
        return V(hi >= 14 ? 'great' : 'good', {
          en: `Comfortable for dogs: highs around ${deg(hi)}, long walks along the shore are easy.`,
          de: `Angenehm für Hunde: Höchstwerte um ${deg(hi)}, lange Spaziergänge am Ufer sind leicht.`,
          sl: `Prijetno za pse: najvišje okoli ${deg(hi)}, dolgi sprehodi ob obali so lahki.`,
          hr: `Ugodno za pse: maksimumi oko ${deg(hi)}, duge šetnje uz obalu su lagane.`,
          it: `Piacevole per i cani: massime di circa ${deg(hi)}, le lunghe passeggiate lungo la riva sono facili.`,
        });
      return V('fair', {
        en: `Hot (around ${deg(hi)}): walk early and late, and carry water.`,
        de: `Heiß (um ${deg(hi)}): früh und spät Gassi gehen und Wasser mitnehmen.`,
        sl: `Vroče (okoli ${deg(hi)}): na sprehod zgodaj zjutraj in pozno zvečer, s seboj imejte vodo.`,
        hr: `Vruće (oko ${deg(hi)}): u šetnju rano ujutro i kasno navečer, i ponesite vodu.`,
        it: `Caldo (circa ${deg(hi)}): passeggiate presto al mattino e la sera tardi, e portate dell’acqua.`,
      });
    case 'fieldtrips': {
      const birds = c.birds
        ? { en: ' Bird migration at the salt pans.', de: ' Vogelzug an der Saline.', sl: ' Na solinah poteka selitev ptic.', hr: ' Na solani je seoba ptica.', it: ' Migrazione degli uccelli alle saline.' }
        : EMPTY;
      if (SHOULDER.includes(m) && !PEAK.includes(m))
        return V('great', {
          en: `Mild for fieldwork (highs around ${deg(hi)}) and outside the summer peak.`,
          de: `Mild für Feldarbeit (Höchstwerte um ${deg(hi)}) und außerhalb der Sommerspitze.`,
          sl: `Milo za terensko delo (najvišje okoli ${deg(hi)}) in zunaj poletne gneče.`,
          hr: `Blago za terenski rad (maksimumi oko ${deg(hi)}) i izvan ljetne gužve.`,
          it: `Mite per il lavoro sul campo (massime di circa ${deg(hi)}) e fuori dal picco estivo.`,
        }, birds);
      if (PEAK.includes(m))
        return V('fair', {
          en: 'Hot and busy: possible, but plan outdoor work for early mornings.',
          de: 'Heiß und voll: möglich, aber Arbeit im Freien früh am Morgen planen.',
          sl: 'Vroče in polno ljudi: mogoče, a delo na prostem načrtujte za zgodnja jutra.',
          hr: 'Vruće i gužva: moguće, ali rad na otvorenom planirajte za rano jutro.',
          it: 'Caldo e affollato: si può fare, ma programmate il lavoro all’aperto nelle prime ore del mattino.',
        });
      return V('good', {
        en: `Cool (highs around ${deg(hi)}) and very quiet; pack rain gear.`,
        de: `Kühl (Höchstwerte um ${deg(hi)}) und sehr ruhig; Regenkleidung einpacken.`,
        sl: `Sveže (najvišje okoli ${deg(hi)}) in zelo mirno; vzemite opremo za dež.`,
        hr: `Svježe (maksimumi oko ${deg(hi)}) i vrlo mirno; ponesite opremu za kišu.`,
        it: `Fresco (massime di circa ${deg(hi)}) e molto tranquillo; portate l’attrezzatura da pioggia.`,
      });
    }
    default: {
      if (sea >= SWIM_C && rd <= 8)
        return V('great', {
          en: `Beach-holiday weather: highs around ${deg(hi)} and a sea of about ${deg(sea)}.`,
          de: `Strandurlaubswetter: Höchstwerte um ${deg(hi)} und Meer um ${deg(sea)}.`,
          sl: `Vreme za počitnice na plaži: najvišje okoli ${deg(hi)} in morje s približno ${deg(sea)}.`,
          hr: `Vrijeme za odmor na plaži: maksimumi oko ${deg(hi)} i more od oko ${deg(sea)}.`,
          it: `Tempo da vacanza al mare: massime di circa ${deg(hi)} e mare a circa ${deg(sea)}.`,
        });
      if (hi >= 16 && hi <= 27) {
        const warmSea = sea >= SWIM_C;
        const brisk = !warmSea && sea >= 18 && hi >= 18;
        const tail = warmSea
          ? { en: ', and the sea is still warm', de: ', und das Meer ist noch warm', sl: ', morje pa je še toplo', hr: ', a more je još toplo', it: ', e il mare è ancora caldo' }
          : brisk
            ? { en: ', with brisk swims still possible', de: ', und erfrischende Bäder gehen noch', sl: ', osvežilno kopanje pa je še mogoče', hr: ', a osvježavajuće kupanje još je moguće', it: ', e un bagno rinfrescante è ancora possibile' }
            : EMPTY;
        return V('good', {
          en: `Active-holiday weather: around ${deg(hi)}, ideal for riding, hiking and the old towns`,
          de: `Aktivurlaubswetter: um ${deg(hi)}, ideal zum Radeln, Wandern und für die Altstädte`,
          sl: `Vreme za aktivne počitnice: okoli ${deg(hi)}, idealno za kolesarjenje, pohode in stara mestna jedra`,
          hr: `Vrijeme za aktivni odmor: oko ${deg(hi)}, idealno za bicikl, planinarenje i stare gradove`,
          it: `Tempo da vacanza attiva: circa ${deg(hi)}, ideale per bici, escursioni e centri storici`,
        }, tail, { en: '.', de: '.', sl: '.', hr: '.', it: '.' });
      }
      return V('fair', {
        en: `Off-season: highs around ${deg(hi)}, cool nights, few visitors. Restful, not a beach holiday.`,
        de: `Nebensaison: Höchstwerte um ${deg(hi)}, kühle Nächte, wenige Besucher. Erholsam, aber kein Strandurlaub.`,
        sl: `Izven sezone: najvišje okoli ${deg(hi)}, hladne noči, malo obiskovalcev. Sproščujoče, a ne za počitnice na plaži.`,
        hr: `Izvan sezone: maksimumi oko ${deg(hi)}, svježe noći, malo posjetitelja. Opuštajuće, ali ne za odmor na plaži.`,
        it: `Bassa stagione: massime di circa ${deg(hi)}, notti fresche, pochi visitatori. Rilassante, ma non da vacanza al mare.`,
      });
    }
  }
}

const LEVEL_ICON = { great: 'star', good: 'check', fair: 'info', poor: 'close' };

// Activities data (events, wind seasons) is loaded lazily and kept here, so a
// re-render after a month change has it immediately.
let ACT = null;
let pendingFocus = null;

function climateFor(m, act) {
  const c = MONTHS.find((x) => x.month === m);
  const kite = act?.windSeasons?.months.find((w) => w.month === m)?.kiteSuitability;
  return { ...c, kite, mud: itemMonths(act, 'nin-healing-mud').includes(m), birds: itemMonths(act, 'nin-birdwatching').includes(m) };
}

// ---------------------------------------------------------------- chart
const xPct = (i) => ((i + 0.5) / 12) * 100;
const yPct = (v) => 100 - (v / T_MAX) * 100;

function chartHtml(ctx, sel) {
  const t = ctx.t;
  const lang = ctx.lang;
  const W = 1200;
  const H = 300;
  const X = (i) => (i + 0.5) * 100;
  const Y = (v) => H - (v / T_MAX) * H;
  const pts = (key) => MONTHS.map((c, i) => `${X(i)},${Y(c[key]).toFixed(1)}`);
  const band = `M${pts('airMaxC').join('L')}L${pts('airMinC').reverse().join('L')}Z`;
  const ticks = [0, 10, 20, 30];
  const i = sel - 1;
  const c = MONTHS[i];
  // Label placement: the highest of the three points is labelled above, the
  // lowest below. The middle one goes to the side, unless it is within CLOSE °C
  // of a neighbour: then it takes the side away from that neighbour, so two
  // labels never stack on the same dots.
  const CLOSE = 3;
  const side = i < 6 ? 'right' : 'left';
  const sorted = [['max', c.airMaxC], ['sea', c.seaC], ['min', c.airMinC]].sort((a, b) => b[1] - a[1]);
  const order = sorted.map(([k]) => k);
  const nearTop = sorted[0][1] - sorted[1][1] < CLOSE;
  const nearBottom = sorted[1][1] - sorted[2][1] < CLOSE;
  const pos = { [order[0]]: 'above', [order[1]]: nearTop && !nearBottom ? 'below' : nearBottom && !nearTop ? 'above' : side, [order[2]]: 'below' };
  const allT = MONTHS.flatMap((m) => [m.airMinC, m.airMaxC]);
  const allS = MONTHS.map((m) => m.seaC);
  const aria = fill(t(L.chartAria), {
    lo: fmt(Math.min(...allT), lang),
    hi: fmt(Math.max(...allT), lang),
    slo: fmt(Math.min(...allS), lang),
    shi: fmt(Math.max(...allS), lang),
  });

  return `
  <div class="ss-chart" style="--air:${SERIES.air};--sea:${SERIES.sea};--sun:${SERIES.sun}">
    <div class="ss-chart-head">
      <h3>${esc(t(L.chartTitle))}</h3>
      <ul class="ss-legend">
        <li><span class="ss-key ss-key-band" aria-hidden="true"></span>${esc(t(L.legendAir))}</li>
        <li><span class="ss-key ss-key-line" aria-hidden="true"></span>${esc(t(L.legendSea))}</li>
      </ul>
    </div>
    <div class="ss-plotwrap">
      <div class="ss-yaxis" aria-hidden="true">${ticks.map((v) => `<span style="top:${yPct(v)}%">${v}°</span>`).join('')}</div>
      <div class="ss-plot" data-plot role="img" aria-label="${esc(aria)}">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect class="ss-hover-col" data-hovercol x="0" y="0" width="100" height="${H}" visibility="hidden" />
          <rect class="ss-sel-col" x="${i * 100 + 2}" y="0" width="96" height="${H}" />
          ${ticks.map((v) => `<line class="ss-grid${v === 0 ? ' ss-base' : ''}" x1="0" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" vector-effect="non-scaling-stroke" />`).join('')}
          <path class="ss-band" d="${band}" />
          <polyline class="ss-air-max" points="${pts('airMaxC').join(' ')}" vector-effect="non-scaling-stroke" />
          <polyline class="ss-air-min" points="${pts('airMinC').join(' ')}" vector-effect="non-scaling-stroke" />
          <polyline class="ss-sea" points="${pts('seaC').join(' ')}" vector-effect="non-scaling-stroke" />
        </svg>
        <span class="ss-dot ss-dot-air" style="left:${xPct(i)}%;top:${yPct(c.airMaxC)}%"></span>
        <span class="ss-dot ss-dot-air ss-dot-min" style="left:${xPct(i)}%;top:${yPct(c.airMinC)}%"></span>
        <span class="ss-dot ss-dot-sea" style="left:${xPct(i)}%;top:${yPct(c.seaC)}%"></span>
        <span class="ss-lab ss-at-${pos.max}" style="left:${xPct(i)}%;top:${yPct(c.airMaxC)}%">${fmt(c.airMaxC, lang)}°</span>
        <span class="ss-lab ss-lab-min ss-at-${pos.min}" style="left:${xPct(i)}%;top:${yPct(c.airMinC)}%">${fmt(c.airMinC, lang)}°</span>
        <span class="ss-lab ss-at-${pos.sea}" style="left:${xPct(i)}%;top:${yPct(c.seaC)}%">${esc(t(L.seaT))} ${fmt(c.seaC, lang)}°</span>
        <div class="ss-tip" data-tip hidden></div>
      </div>
    </div>
    <p class="ss-subtitle">${esc(t(L.sunTitle))}</p>
    <div class="ss-plotwrap ss-plotwrap-sun">
      <div class="ss-yaxis" aria-hidden="true"></div>
      <div class="ss-sun" data-plot-sun aria-hidden="true">
        ${MONTHS.map((m, k) => `<span class="ss-sunbar${k === i ? ' is-sel' : ''}" style="--h:${(m.sunHoursPerDay / SUN_MAX) * 100}%">${k === i ? `<b>${fmt(m.sunHoursPerDay, lang, 1)} h</b>` : ''}</span>`).join('')}
      </div>
    </div>
    <p class="ss-subtitle">${esc(t(L.rainRow))}</p>
    <div class="ss-plotwrap ss-plotwrap-row">
      <div class="ss-yaxis" aria-hidden="true"></div>
      <div class="ss-cols ss-rain" aria-hidden="true">
        ${MONTHS.map((m, k) => `<span class="${k === i ? 'is-sel' : ''}">${fmt(m.rainDays, lang)}</span>`).join('')}
      </div>
    </div>
    <div class="ss-plotwrap ss-plotwrap-row">
      <div class="ss-yaxis" aria-hidden="true"></div>
      <div class="ss-cols ss-xaxis" aria-hidden="true">
        ${MONTHS.map((m, k) => `<button type="button" tabindex="-1" data-month="${m.month}" class="${k === i ? 'is-sel' : ''}"><span class="ss-full">${esc(monthName(m.month, lang))}</span><span class="ss-init">${esc(monthName(m.month, lang).slice(0, 1))}</span></button>`).join('')}
      </div>
    </div>
    <details class="ss-table">
      <summary>${esc(t(L.table))}</summary>
      <div class="ss-table-scroll">
        <table>
          <thead><tr><th scope="col">${esc(t(L.month))}</th><th scope="col">${esc(t(L.airHigh))}</th><th scope="col">${esc(t(L.airLow))}</th><th scope="col">${esc(t(L.seaT))}</th><th scope="col">${esc(t(L.sunH))}</th><th scope="col">${esc(t(L.rainD))}</th><th scope="col">${esc(t(L.rainMm))}</th></tr></thead>
          <tbody>
            ${MONTHS.map((m) => `<tr${m.month === sel ? ' class="is-sel"' : ''}><th scope="row">${esc(monthName(m.month, lang, true))}</th><td>${fmt(m.airMaxC, lang, 1)} °C</td><td>${fmt(m.airMinC, lang, 1)} °C</td><td>${fmt(m.seaC, lang, 1)} °C</td><td>${fmt(m.sunHoursPerDay, lang, 1)}</td><td>${fmt(m.rainDays, lang, 1)}</td><td>${fmt(m.precipMm, lang)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </details>
    <details class="ss-sources source-note">
      <summary>${icon('info', { size: 16 })}${esc(t(L.sources))}</summary>
      <p>${esc(t(L.sourcesText))}</p>
      <ul>${CLIMATE.sources.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname)}</a></li>`).join('')}</ul>
    </details>
  </div>`;
}

function tipHtml(c, ctx) {
  const t = ctx.t;
  const lang = ctx.lang;
  return `<b>${esc(monthName(c.month, lang, true))}</b>
    <span><i class="ss-tk ss-tk-air"></i>${esc(t(L.air))} ${fmt(c.airMaxC, lang)}° / ${fmt(c.airMinC, lang)}°</span>
    <span><i class="ss-tk ss-tk-sea"></i>${esc(t(L.sea))} ${fmt(c.seaC, lang)}°</span>
    <span><i class="ss-tk ss-tk-sun"></i>${esc(t(L.sun))} ${fmt(c.sunHoursPerDay, lang, 1)} h</span>
    <span>${esc(t(L.rainRow))}: ${fmt(c.rainDays, lang)}</span>`;
}

// ---------------------------------------------------------------- month detail
function inWords(c, ctx) {
  const t = ctx.t;
  const shares = windShares(c.windNote);
  const lead = Object.entries(shares).sort((a, b) => b[1] - a[1])[0]?.[0];
  const parts = [`${t(pick(WORDS.air, c.airMaxC))} ${t(L.and)} ${t(pick(WORDS.sea, c.seaC))}.`, `${t(pick(WORDS.rain, c.rainDays))}${lead ? `; ${t(WORDS.windLead[lead])}` : ''}.`];
  return parts.join(' ');
}

function windMixHtml(c, ctx) {
  const t = ctx.t;
  const shares = windShares(c.windNote);
  const order = Object.keys(shares).sort((a, b) => shares[b] - shares[a]);
  if (!order.length) return '';
  const other = Math.max(0, 100 - order.reduce((s, k) => s + shares[k], 0));
  const names = windNames(ctx.lang);
  return `<div class="ss-windmix">
    <div class="ss-windbar" aria-hidden="true">
      ${order.map((k) => `<span style="width:${shares[k]}%;background:${SERIES[k]}"></span>`).join('')}
      ${other ? `<span class="ss-wind-other" style="width:${other}%"></span>` : ''}
    </div>
    <ul class="ss-windkeys">
      ${order.map((k) => `<li><i style="background:${SERIES[k]}"></i>${esc(names[k])} <b>~${shares[k]}%</b></li>`).join('')}
      ${other ? `<li><i class="ss-wind-other"></i>${esc(t(L.windOther))}</li>` : ''}
    </ul>
    <p class="visually-hidden">${order.map((k) => `${names[k]}: ${shares[k]}% ${t(L.ofDays)}`).join(', ')}</p>
  </div>`;
}

function eventsHtml(m, ctx) {
  const t = ctx.t;
  if (!ACT) return `<p class="muted ss-loading">${esc(t(L.loadingEvents))}</p>`;
  const events = ACT.items.filter((x) => x.category === 'event' && x.months?.includes(m)).sort((a, b) => a.km - b.km);
  // Seasonal specials: things that only run a few months a year.
  const seasonal = ACT.items.filter((x) => x.category !== 'event' && x.months && x.months.length <= 4 && x.months.includes(m));
  const list = events.length
    ? `<ul class="ss-events">${events
        .map(
          (e) => `<li>
          <span class="ss-ev-icon" aria-hidden="true">${icon('calendar', { size: 18 })}</span>
          <div>
            <p class="ss-ev-name">${esc(e.name)}${e.confidence === 'low' ? ' <span class="badge neutral">?</span>' : ''}</p>
            <p class="meta"><span>${icon('pin', { size: 16 })}${esc(e.location?.name || '')}</span><span>${icon('car', { size: 16 })}${driveFor(e).measured ? '' : `${esc(t(L.about))} `}${esc(formatMinutes(driveFor(e).min))} ${esc(t(L.drive))}</span></p>
            <details class="ss-ev-more"><summary>${esc(t(L.details))}</summary><p>${esc(e.description)}</p>${e.howToBook ? `<p>${esc(e.howToBook)}</p>` : ''}
              <p class="source-note">${esc(t(L.sources))}: ${(e.sources || []).slice(0, 3).map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname)}</a>`).join(', ')}</p>
            </details>
          </div>
        </li>`,
        )
        .join('')}</ul>`
    : `<p class="muted">${esc(t(L.noEvents))}</p>`;
  const specials = seasonal.length
    ? `<p class="ss-mini-h">${esc(t(L.seasonal))}</p><ul class="chips ss-specials">${seasonal.map((s) => `<li class="badge neutral">${esc(s.name.split(/[(–:]/)[0].trim())}</li>`).join('')}</ul>`
    : '';
  return list + specials;
}

function detailHtml(ctx, m) {
  const t = ctx.t;
  const lang = ctx.lang;
  const c = climateFor(m, ACT);
  const kind = profileKind(ctx.audience);
  const v = verdict(kind, c);
  const shares = windShares(c.windNote);
  const lead = Object.entries(shares).sort((a, b) => b[1] - a[1])[0];
  const season = seasonKind(m);
  const good = RULES.filter((r) => r.test(c, ACT));
  const mv = monthVars(m, lang);
  return `
  <article class="ss-month card">
    <header class="ss-month-head">
      <h3>${esc(fill(t(L.inMonth), mv))}</h3>
      <span class="badge ${season === 'peak' ? 'accent' : season === 'low' ? 'neutral' : ''}">${esc(t(L[season]))}</span>
    </header>
    <p class="ss-words">${esc(inWords(c, ctx))}</p>
    <dl class="ss-stats">
      <div><dt>${icon('thermometer', { size: 18 })}${esc(t(L.air))}</dt><dd>${fmt(c.airMaxC, lang)}° <span>/ ${fmt(c.airMinC, lang)}°</span></dd><dd class="ss-unit">${esc(t(L.dayNight))}</dd></div>
      <div><dt>${icon('wave', { size: 18 })}${esc(t(L.sea))}</dt><dd>${fmt(c.seaC, lang)} °C</dd><dd class="ss-unit">&nbsp;</dd></div>
      <div><dt>${icon('sun', { size: 18 })}${esc(t(L.sun))}</dt><dd>${fmt(c.sunHoursPerDay, lang, 1)} h</dd><dd class="ss-unit">${esc(t(L.hPerDay))}</dd></div>
      <div><dt>${icon('calendar', { size: 18 })}${esc(t(L.rain))}</dt><dd>${fmt(c.rainDays, lang)}</dd><dd class="ss-unit">${esc(t(L.rainyDays))} · <span class="ss-nowrap">${fmt(c.precipMm, lang)} mm</span></dd></div>
    </dl>
    <div class="ss-wind">
      <p class="ss-mini-h">${icon('wind', { size: 18 })}${esc(t(L.wind))}${lead ? ` · <span class="ss-wind-lead">${esc(windNames(lang)[lead[0]].split(' (')[0])}</span>` : ''}</p>
      ${windMixHtml(c, ctx)}
    </div>
    <div class="ss-good">
      <p class="ss-mini-h">${esc(t(L.goodFor))}</p>
      <ul class="ss-tags">${good.map((r) => `<li title="${esc(t(r.rule))}">${icon(r.icon, { size: 16 })}${esc(t(r.label))}</li>`).join('')}</ul>
      <details class="ss-rules">
        <summary>${esc(t(L.howDecide))}</summary>
        <p>${esc(t(L.howDecideText))}</p>
        <ul>${RULES.map((r) => `<li class="${good.includes(r) ? 'is-on' : ''}">${icon(good.includes(r) ? 'check' : 'close', { size: 16, label: t(good.includes(r) ? L.yes : L.no) })}<b>${esc(t(r.label))}</b>: ${esc(t(r.rule))}</li>`).join('')}</ul>
      </details>
    </div>
    <div class="ss-verdict ss-v-${v.level}">
      <p class="ss-verdict-h">${icon(LEVEL_ICON[v.level], { size: 18 })}<span class="ss-verdict-t"><span>${esc(kind === 'general' ? t(L.verdict) : fill(t(L.verdictFor), { a: shortLabel(ctx) }))}:</span> <b>${esc(t(L.levels[v.level]))}</b></span></p>
      <p>${esc(t(v.text))}</p>
    </div>
    <div class="ss-on">
      <p class="ss-mini-h">${icon('calendar', { size: 18 })}${esc(fill(t(L.whatsOn), mv))}</p>
      <div data-events>${eventsHtml(m, ctx)}</div>
    </div>
    <div class="ss-cta">
      <button type="button" class="btn btn-primary" data-ask>${icon('chat', { size: 18 })}${esc(fill(t(L.ask), mv))}</button>
      <span class="small muted">${esc(t(L.askNote))}</span>
    </div>
  </article>`;
}

// "Cyclists · spring & autumn" -> "Cyclists": the season part repeats the month.
const shortLabel = (ctx) => ctx.t(ctx.audience.label).split('·')[0].trim();

function bestLabel(ctx) {
  return profileKind(ctx.audience) === 'general' ? ctx.t(L.bestGeneral) : fill(ctx.t(L.bestFor), { a: shortLabel(ctx) });
}

function monthsHtml(ctx, sel, chosen) {
  const t = ctx.t;
  const lang = ctx.lang;
  const kind = profileKind(ctx.audience);
  const showAir = kind === 'cyclists' || kind === 'retreats' || kind === 'fieldtrips' || kind === 'dogs';
  const best = ctx.audience.months || [];
  return `
  <div class="ss-picker">
    <div class="ss-picker-head">
      <p class="ss-mini-h" id="ss-pick-label">${icon('calendar', { size: 18 })}${esc(t(L.pick))}</p>
      ${best.length ? `<p class="small muted ss-bestkey"><span class="ss-bestdot" aria-hidden="true"></span>${esc(bestLabel(ctx))}</p>` : ''}
    </div>
    <div class="ss-months" role="group" aria-labelledby="ss-pick-label">
      ${MONTHS.map((c) => {
        const m = c.month;
        const pressed = chosen && m === sel;
        const cls = ['ss-mbtn', pressed ? 'is-sel' : '', !chosen && m === sel ? 'is-suggested' : '', best.includes(m) ? 'is-best' : ''].filter(Boolean).join(' ');
        const val = showAir ? `${fmt(c.airMaxC, lang)}°` : `${fmt(c.seaC, lang)}°`;
        return `<button type="button" class="${cls}" data-month="${m}" aria-pressed="${pressed}" aria-label="${esc(monthName(m, lang, true))}${best.includes(m) ? ` (${esc(bestLabel(ctx))})` : ''}">
          <span class="ss-mname">${esc(monthName(m, lang))}</span>
          <span class="ss-mval">${showAir ? icon('thermometer', { size: 13 }) : icon('wave', { size: 13 })}${val}</span>
        </button>`;
      }).join('')}
    </div>
    ${chosen ? `<button type="button" class="btn btn-ghost btn-small ss-any" data-month="0">${icon('close', { size: 16 })}${esc(t(L.anyMonth))}</button>` : `<p class="small muted ss-suggest">${esc(fill(t(L.suggested), monthVars(sel, lang)))}</p>`}
  </div>`;
}

export default {
  id: 'seasons',
  nav: { en: 'When to come', de: 'Reisezeit', sl: 'Kdaj priti', hr: 'Kada doći', it: 'Quando venire' },
  rerenderOn: ['month', 'weather'],

  render(ctx) {
    const t = ctx.t;
    const chosen = ctx.state.month > 0;
    const sel = chosen ? ctx.state.month : suggestedMonth(ctx.audience);
    const kind = profileKind(ctx.audience);
    return `<div class="container">
      <header class="section-head">
        <span class="eyebrow">${icon('calendar', { size: 16 })}${esc(t(L.eyebrow))}</span>
        <h2>${esc(t(TITLES[kind] || TITLES.general))}</h2>
        <p class="lede">${esc(t(LEDES[kind] || LEDES.general))}</p>
      </header>
      ${ctx.state.weather ? `<div class="ss-live" data-live-weather>${liveWeatherHtml(ctx)}</div>` : ''}
      ${monthsHtml(ctx, sel, chosen)}
      <div class="ss-layout">
        <div class="ss-chart-card card">${chartHtml(ctx, sel)}</div>
        <div class="ss-detail" data-detail>${detailHtml(ctx, sel)}</div>
      </div>
      <p class="error-box" data-mount-error hidden>${esc(t(L.mountError))}</p>
    </div>`;
  },

  async mount(el, ctx) {
    const chosen = ctx.state.month > 0;
    const sel = chosen ? ctx.state.month : suggestedMonth(ctx.audience);
    const stopWeather = ctx.state.weather ? mountLiveWeather(el.querySelector('[data-live-weather]'), ctx, { climate: MONTHS }) : () => {};

    const choose = (m) => {
      if (m === ctx.state.month) return;
      pendingFocus = m;
      ctx.setState({ month: m });
    };
    const onClick = (e) => {
      const b = e.target.closest('[data-month]');
      if (b && el.contains(b)) choose(Number(b.dataset.month));
      if (e.target.closest('[data-ask]')) {
        ctx.bus.emit('inquiry:prefill', { month: sel, purpose: ctx.audience.inquiry?.purpose });
      }
    };
    el.addEventListener('click', onClick);

    // Restore keyboard focus after the month change re-rendered the section.
    if (pendingFocus != null) {
      const target = el.querySelector(pendingFocus ? `.ss-months [data-month="${pendingFocus}"]` : '.ss-months [data-month]');
      target?.focus({ preventScroll: true });
      pendingFocus = null;
    }

    // Hover layer on the temperature chart: crosshair column + tooltip; click selects.
    const plot = el.querySelector('[data-plot]');
    const tip = el.querySelector('[data-tip]');
    const hoverCol = el.querySelector('[data-hovercol]');
    const idxAt = (e) => {
      const r = plot.getBoundingClientRect();
      return Math.max(0, Math.min(11, Math.floor(((e.clientX - r.left) / r.width) * 12)));
    };
    const onMove = (e) => {
      const i = idxAt(e);
      const c = MONTHS[i];
      hoverCol.setAttribute('x', String(i * 100));
      hoverCol.setAttribute('visibility', 'visible');
      tip.innerHTML = tipHtml(c, ctx);
      tip.hidden = false;
      tip.style.left = `${xPct(i)}%`;
      tip.classList.toggle('is-left', i >= 6);
    };
    const onLeave = () => {
      tip.hidden = true;
      hoverCol.setAttribute('visibility', 'hidden');
    };
    const onPlotClick = (e) => choose(MONTHS[idxAt(e)].month);
    plot.addEventListener('pointermove', onMove);
    plot.addEventListener('pointerleave', onLeave);
    plot.addEventListener('click', onPlotClick);

    // Events and kite/mud/bird rules need the activities data.
    if (!ACT) {
      try {
        const mod = await import('../data/activities.json');
        ACT = mod.default;
        const detail = el.querySelector('[data-detail]');
        if (detail && el.isConnected) detail.innerHTML = detailHtml(ctx, sel);
      } catch (err) {
        console.error('[seasons] activities data failed', err);
        const box = el.querySelector('[data-events]');
        if (box) box.innerHTML = `<p class="error-box">${esc(ctx.t(L.mountError))}</p>`;
      }
    }

    return () => {
      stopWeather();
      el.removeEventListener('click', onClick);
      plot.removeEventListener('pointermove', onMove);
      plot.removeEventListener('pointerleave', onLeave);
      plot.removeEventListener('click', onPlotClick);
    };
  },
};
