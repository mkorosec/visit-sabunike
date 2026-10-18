// Company retreats: the whole house for one team. Key numbers and the room
// planner come from site.js (sync, cheap); agendas, activities, the venue
// checklist, tax notes and the off-season box come from src/data/retreats.json
// and listing.json, which are loaded in mount() to keep the main bundle small.
//
// Honesty: prices only where the research has a source, low-confidence leads are
// hidden behind a toggle, and every owner unknown reads "Ask us".
import './retreat.css';
import { APARTMENTS } from '../content/site.js';
import { esc, icon, monthName, photo, formatKm, formatMinutes, travelMinutes } from '../lib/util.js';
import { airportKm, euro, ownerTodo } from './core-shared.js';
import CLIMATE from '../data/climate.json';

// Plural form of a noun for n (Intl rules: Slovenian has a dual, Croatian a
// paucal). A translation that needs it is a function of the placeholder values
// instead of a template string; tt() and fill() accept both.
const plural = (lang, n, forms) => forms[new Intl.PluralRules(lang).select(n)] ?? forms.other;
const count = (lang, n, forms) => `${n} ${plural(lang, n, forms)}`;
const PEOPLE = {
  sl: { one: 'oseba', two: 'osebi', few: 'osebe', other: 'oseb' },
  hr: { one: 'osoba', few: 'osobe', other: 'osoba' },
  it: { one: 'persona', other: 'persone' },
};
const people = (lang, n) => count(lang, n, PEOPLE[lang]);
// After "za" (for) in Slovenian: accusative.
const PEOPLE_SL_ACC = { one: 'osebo', two: 'osebi', few: 'osebe', other: 'oseb' };
// After "do" (up to) in Croatian: genitive.
const PEOPLE_HR_GEN = { one: 'osobe', few: 'osobe', other: 'osoba' };
const BEDROOM_FORMS = {
  sl: { one: 'spalnica', two: 'spalnici', few: 'spalnice', other: 'spalnic' },
  hr: { one: 'spavaća soba', few: 'spavaće sobe', other: 'spavaćih soba' },
  it: { one: 'camera', other: 'camere' },
};

// ---------------------------------------------------------------------------
// UI strings
// ---------------------------------------------------------------------------
const L = {
  eyebrow: { en: 'Company retreats', de: 'Firmen-Retreats', sl: 'Poslovni retreati', hr: 'Retreati za tvrtke', it: 'Ritiri aziendali' },
  title: { en: 'The whole house for your team', de: 'Das ganze Haus für Ihr Team', sl: 'Cela hiša za vašo ekipo', hr: 'Cijela kuća za vaš tim', it: 'Tutta la casa per il vostro team' },
  lede: {
    en: 'Four self-contained apartments around one garden: sessions on the terrace in the morning, the lagoon in the afternoon, the grill at sunset. No hotel lobby, and one contact who answers personally. When you book all four apartments, no other guests share the garden.',
    de: 'Vier eigenständige Apartments rund um einen Garten: morgens Sessions auf der Terrasse, nachmittags die Lagune, abends der Grill. Keine Hotellobby und ein persönlicher Ansprechpartner. Wenn Sie alle vier Apartments buchen, teilen keine anderen Gäste den Garten.',
    sl: 'Štirje samostojni apartmaji okoli enega vrta: zjutraj delo na terasi, popoldne laguna, ob sončnem zahodu žar. Brez hotelske avle in z eno kontaktno osebo, ki odgovarja osebno. Ko rezervirate vse štiri apartmaje, vrta ne delite z drugimi gosti.',
    hr: 'Četiri samostalna apartmana oko jednog vrta: ujutro radionice na terasi, poslijepodne laguna, u sumrak roštilj. Bez hotelskog predvorja, s jednom osobom za kontakt koja odgovara osobno. Kad rezervirate sva četiri apartmana, vrt ne dijelite s drugim gostima.',
    it: 'Quattro appartamenti indipendenti intorno a un unico giardino: sessioni in terrazza al mattino, la laguna nel pomeriggio, il barbecue al tramonto. Nessuna hall d’albergo e un unico referente che risponde di persona. Se prenotate tutti e quattro gli appartamenti, il giardino è solo vostro.',
  },
  // Wording when another audience (e.g. field trips) shows this section.
  groupEyebrow: { en: 'Group stays', de: 'Gruppenaufenthalte', sl: 'Skupinska bivanja', hr: 'Grupni boravci', it: 'Soggiorni di gruppo' },
  groupTitle: { en: 'The whole house for your group', de: 'Das ganze Haus für Ihre Gruppe', sl: 'Cela hiša za vašo skupino', hr: 'Cijela kuća za vašu grupu', it: 'Tutta la casa per il vostro gruppo' },
  groupLede: {
    en: 'Four self-contained apartments around one garden: sessions on the terrace, days out in the lagoon and the hills, the grill in the evening. One contact who answers personally. When you book all four apartments, no other guests share the garden.',
    de: 'Vier eigenständige Apartments rund um einen Garten: Sessions auf der Terrasse, Ausflüge an die Lagune und in die Berge, abends der Grill. Ein persönlicher Ansprechpartner. Wenn Sie alle vier Apartments buchen, teilen keine anderen Gäste den Garten.',
    sl: 'Štirje samostojni apartmaji okoli enega vrta: delo na terasi, izleti v laguno in hribe, zvečer žar. Ena kontaktna oseba, ki odgovarja osebno. Ko rezervirate vse štiri apartmaje, vrta ne delite z drugimi gosti.',
    hr: 'Četiri samostalna apartmana oko jednog vrta: radionice na terasi, izleti do lagune i u brda, navečer roštilj. Jedna osoba za kontakt koja odgovara osobno. Kad rezervirate sva četiri apartmana, vrt ne dijelite s drugim gostima.',
    it: 'Quattro appartamenti indipendenti intorno a un unico giardino: sessioni in terrazza, gite in laguna e sulle colline, il barbecue la sera. Un unico referente che risponde di persona. Se prenotate tutti e quattro gli appartamenti, il giardino è solo vostro.',
  },
  groupCtaProposal: { en: 'Request a group proposal', de: 'Gruppenangebot anfordern', sl: 'Zahtevajte ponudbo za skupino', hr: 'Zatražite ponudu za grupu', it: 'Richiedete una proposta per il gruppo' },
  groupCheckTitle: { en: 'What group organisers ask us', de: 'Was Gruppenleiter uns fragen', sl: 'Kaj nas sprašujejo organizatorji skupin', hr: 'Što nas pitaju organizatori grupa', it: 'Cosa ci chiedono gli organizzatori di gruppi' },
  groupCheckLede: {
    en: 'The questions group organisers ask a venue, with honest answers. Where we do not know yet, it says so.',
    de: 'Die Fragen, die Gruppenleiter einem Ort stellen, mit ehrlichen Antworten. Was wir noch nicht wissen, steht auch so da.',
    sl: 'Vprašanja, ki jih organizatorji skupin zastavijo gostitelju, z iskrenimi odgovori. Kjer česa še ne vemo, tako tudi piše.',
    hr: 'Pitanja koja organizatori grupa postavljaju domaćinu, s iskrenim odgovorima. Gdje nešto još ne znamo, to i piše.',
    it: 'Le domande che gli organizzatori di gruppi fanno a una struttura, con risposte sincere. Dove non lo sappiamo ancora, lo diciamo.',
  },
  groupCtaTitle: { en: 'Tell us about your group', de: 'Erzählen Sie uns von Ihrer Gruppe', sl: 'Povejte nam o svoji skupini', hr: 'Recite nam nešto o svojoj grupi', it: 'Raccontateci del vostro gruppo' },
  groupCtaText: {
    en: 'Group size, dates and plans are enough. We reply personally with availability and a proposal for your group. No obligation.',
    de: 'Gruppengröße, Termine und Pläne genügen. Wir antworten persönlich mit Verfügbarkeit und einem Vorschlag für Ihre Gruppe. Unverbindlich.',
    sl: 'Dovolj so velikost skupine, termini in načrti. Osebno vam odgovorimo z razpoložljivostjo in predlogom za vašo skupino. Brez obveznosti.',
    hr: 'Dovoljni su veličina grupe, termini i planovi. Osobno odgovaramo s dostupnošću i prijedlogom za vašu grupu. Bez obveze.',
    it: 'Bastano dimensioni del gruppo, date e programmi. Vi rispondiamo di persona con disponibilità e una proposta per il vostro gruppo. Senza impegno.',
  },
  // Stat labels sit next to their number ({n}), so sl/hr/it pick the plural form.
  statApts: {
    en: 'apartments, each with its own entrance',
    de: 'Apartments mit eigenem Eingang',
    sl: ({ n }) => plural('sl', n, { one: 'apartma z lastnim vhodom', two: 'apartmaja, vsak z lastnim vhodom', few: 'apartmaji, vsak z lastnim vhodom', other: 'apartmajev, vsak z lastnim vhodom' }),
    hr: ({ n }) => plural('hr', n, { one: 'apartman s vlastitim ulazom', few: 'apartmana, svaki s vlastitim ulazom', other: 'apartmana, svaki s vlastitim ulazom' }),
    it: ({ n }) => plural('it', n, { one: 'appartamento con ingresso indipendente', other: 'appartamenti, ognuno con ingresso indipendente' }),
  },
  statBedrooms: {
    en: 'bedrooms with 180 cm double beds',
    de: 'Schlafzimmer mit 180-cm-Doppelbett',
    sl: ({ n }) => `${plural('sl', n, BEDROOM_FORMS.sl)} z zakonsko posteljo 180 cm`,
    hr: ({ n }) => `${plural('hr', n, BEDROOM_FORMS.hr)} s bračnim krevetom od 180 cm`,
    it: ({ n }) => `${plural('it', n, BEDROOM_FORMS.it)} con letto matrimoniale da 180 cm`,
  },
  statGuests: {
    en: 'guests at most, incl. sofa beds',
    de: 'Gäste maximal, inkl. Schlafsofas',
    sl: ({ n }) => `${plural('sl', n, { one: 'gost', two: 'gosta', few: 'gostje', other: 'gostov' })} največ, vključno z raztegljivimi kavči`,
    hr: ({ n }) => `${plural('hr', n, { one: 'gost', few: 'gosta', other: 'gostiju' })} najviše, uključujući kauče na razvlačenje`,
    it: ({ n }) => `${plural('it', n, { one: 'ospite', other: 'ospiti' })} al massimo, divani letto inclusi`,
  },
  statAirport: { en: 'min by car from Zadar Airport', de: 'Min. mit dem Auto vom Flughafen Zadar', sl: 'min z avtom od letališča Zadar', hr: 'min autom od Zračne luke Zadar', it: 'min in auto dall’aeroporto di Zadar' },
  statGarden: { en: 'Garden + grill for team dinners', de: 'Garten + Grill für Team-Abende', sl: 'Vrt in žar za ekipne večerje', hr: 'Vrt i roštilj za timske večere', it: 'Giardino e barbecue per le cene di team' },
  photoAlt: {
    en: 'Covered terrace of Apartment 1 with a table set for lunch',
    de: 'Überdachte Terrasse von Apartment 1 mit gedecktem Tisch',
    sl: 'Pokrita terasa apartmaja 1 z mizo, pogrnjeno za kosilo',
    hr: 'Natkrivena terasa apartmana 1 sa stolom postavljenim za ručak',
    it: 'Terrazza coperta dell’appartamento 1 con la tavola apparecchiata per il pranzo',
  },
  photoAlt2: { en: 'Grill area in the garden', de: 'Grillplatz im Garten', sl: 'Prostor z žarom na vrtu', hr: 'Prostor s roštiljem u vrtu', it: 'Zona barbecue in giardino' },
  ctaProposal: { en: 'Request a retreat proposal', de: 'Retreat-Angebot anfordern', sl: 'Zahtevajte ponudbo za retreat', hr: 'Zatražite ponudu za retreat', it: 'Richiedete una proposta per il ritiro' },
  ctaPlanner: { en: 'Plan the rooms', de: 'Zimmer planen', sl: 'Razporedite sobe', hr: 'Rasporedite sobe', it: 'Organizzate le camere' },
  aptShort: { en: 'Apt', de: 'Apt.' },

  // Room planner
  plannerTitle: { en: 'Who sleeps where?', de: 'Wer schläft wo?', sl: 'Kdo spi kje?', hr: 'Tko gdje spava?', it: 'Chi dorme dove?' },
  plannerLede: {
    en: 'Enter your team size and how you want to sleep. The plan fills the bedrooms first (with sharing: two per bedroom), and only then the sofa beds in the living rooms of Apartments 1 and 4.',
    de: 'Teamgröße und Schlafwunsch eingeben. Der Plan belegt zuerst die Schlafzimmer (beim Teilen: zwei pro Zimmer) und erst dann die Schlafsofas in den Wohnzimmern von Apartment 1 und 4.',
    sl: 'Vnesite velikost ekipe in način spanja. Načrt najprej zapolni spalnice (pri deljenju: dve osebi na spalnico), šele nato raztegljive kavče v dnevnih sobah apartmajev 1 in 4.',
    hr: 'Unesite veličinu tima i kako želite spavati. Plan najprije popunjava spavaće sobe (uz dijeljenje: dvije osobe po sobi), a tek onda kauče na razvlačenje u dnevnim boravcima apartmana 1 i 4.',
    it: 'Inserite le dimensioni del team e come volete dormire. Il piano riempie prima le camere (in condivisione: due per camera) e solo dopo i divani letto nei soggiorni degli appartamenti 1 e 4.',
  },
  teamSize: { en: 'Team size', de: 'Teamgröße', sl: 'Velikost ekipe', hr: 'Veličina tima', it: 'Dimensioni del team' },
  fewer: { en: 'One person fewer', de: 'Eine Person weniger', sl: 'Ena oseba manj', hr: 'Jedna osoba manje', it: 'Una persona in meno' },
  more: { en: 'One person more', de: 'Eine Person mehr', sl: 'Ena oseba več', hr: 'Jedna osoba više', it: 'Una persona in più' },
  // Unit after the number field (2–30): the genitive plural reads as a unit label.
  people: { en: 'people', de: 'Personen', sl: 'oseb', hr: 'osoba', it: 'persone' },
  modeLabel: { en: 'Sleeping arrangement', de: 'Schlafwunsch', sl: 'Način spanja', hr: 'Način spavanja', it: 'Sistemazione per la notte' },
  modeOwn: { en: 'Everyone gets their own bedroom', de: 'Jeder ein eigenes Schlafzimmer', sl: 'Vsak dobi svojo spalnico', hr: 'Svatko dobiva svoju spavaću sobu', it: 'Ognuno ha la propria camera' },
  modeShare: { en: 'Couples / sharing OK', de: 'Paare / Teilen in Ordnung', sl: 'Pari / deljenje je v redu', hr: 'Parovi / dijeljenje je u redu', it: 'Coppie / condivisione ok' },
  bedroom: { en: 'Bedroom', de: 'Schlafzimmer', sl: 'Spalnica', hr: 'Spavaća soba', it: 'Camera' },
  bed180: { en: '180 cm double bed', de: '180-cm-Doppelbett', sl: 'Zakonska postelja 180 cm', hr: 'Bračni krevet od 180 cm', it: 'Letto matrimoniale da 180 cm' },
  sofa: { en: 'Sofa bed', de: 'Schlafsofa', sl: 'Raztegljiv kavč', hr: 'Kauč na razvlačenje', it: 'Divano letto' },
  sofaWhere: { en: 'for 2, in the living room', de: 'für 2, im Wohnzimmer', sl: 'za 2, v dnevni sobi', hr: 'za 2 osobe, u dnevnom boravku', it: 'per 2, in soggiorno' },
  free: { en: 'free', de: 'frei' },
  taken: { en: 'taken', de: 'belegt', sl: 'zasedeno', hr: 'zauzeto', it: 'occupato' },
  sumOwnRoom: {
    en: '{n} in their own bedroom',
    de: '{n} im eigenen Schlafzimmer',
    sl: ({ n }) => `${people('sl', n)} v lastni spalnici`,
    hr: ({ n }) => `${people('hr', n)} u vlastitoj spavaćoj sobi`,
    it: ({ n }) => `${people('it', n)} con una camera tutta per sé`,
  },
  sumSofa: {
    en: '{n} on a sofa bed of their own (living room, not private)',
    de: '{n} allein auf einem Schlafsofa (Wohnzimmer, nicht privat)',
    sl: ({ n }) => `${people('sl', n)}${n === 1 ? '' : ', vsaka'} na svojem raztegljivem kavču (dnevna soba, ni zasebno)`,
    hr: ({ n }) => `${people('hr', n)} na vlastitom kauču na razvlačenje (dnevni boravak, nije privatno)`,
    it: ({ n }) => `${people('it', n)}${n === 1 ? '' : ', ciascuna'} su un divano letto tutto per sé (in soggiorno, non privato)`,
  },
  sumShared: {
    en: '{n} sharing a double bed or sofa bed',
    de: '{n} teilen sich ein Doppelbett oder Schlafsofa',
    sl: ({ n }) => `${people('sl', n)} v skupni zakonski postelji ali na raztegljivem kavču`,
    hr: ({ n }) => `${people('hr', n)} u zajedničkom bračnom krevetu ili na kauču na razvlačenje`,
    it: ({ n }) => `${people('it', n)} in un letto matrimoniale o divano letto condiviso`,
  },
  sumOver: {
    en: '{n} without a bed in the house',
    de: '{n} ohne Bett im Haus',
    sl: ({ n }) => `${people('sl', n)} brez postelje v hiši`,
    hr: ({ n }) => `${people('hr', n)} bez kreveta u kući`,
    it: ({ n }) => `${people('it', n)} senza un letto in casa`,
  },
  fits: { en: 'Fits', de: 'Passt', sl: 'Prostora je dovolj', hr: 'Ima mjesta', it: 'Ci state' },
  fitsText: {
    en: 'Your team of {n} fits into the house.',
    de: 'Ihr Team mit {n} Personen passt ins Haus.',
    sl: ({ n }) => `Vaša ekipa (${people('sl', n)}) ima v hiši dovolj prostora.`,
    hr: ({ n }) => `Vaš tim (${people('hr', n)}) ima dovoljno mjesta u kući.`,
    it: ({ n }) => `La casa ha posto per tutto il vostro team di ${people('it', n)}.`,
  },
  tight: { en: 'Fits with sofa beds', de: 'Passt mit Schlafsofas', sl: 'Prostora je dovolj z raztegljivimi kavči', hr: 'Ima mjesta uz kauče na razvlačenje', it: 'Ci state con i divani letto' },
  tightText: {
    en: 'Only {r} bedrooms: {s} people sleep on sofa beds in a living room, which is their own bed but not a private room.',
    de: 'Nur {r} Schlafzimmer: {s} Personen schlafen auf Schlafsofas im Wohnzimmer, ein eigenes Bett, aber kein eigenes Zimmer.',
    sl: ({ r, s }) => `Le ${count('sl', r, BEDROOM_FORMS.sl)}: ${people('sl', s)} ${plural('sl', s, { one: 'spi', two: 'spita', few: 'spijo', other: 'spi' })} na raztegljivih kavčih v dnevni sobi – lastno ležišče, a ne zasebna soba.`,
    hr: ({ r, s }) => `Samo ${count('hr', r, BEDROOM_FORMS.hr)}: ${people('hr', s)} ${plural('hr', s, { one: 'spava', few: 'spavaju', other: 'spava' })} na kaučima na razvlačenje u dnevnom boravku – vlastiti ležaj, ali ne i zasebna soba.`,
    it: ({ r, s }) => `Solo ${count('it', r, BEDROOM_FORMS.it)}: ${people('it', s)} dormono sui divani letto in soggiorno, un letto proprio ma non una camera privata.`,
  },
  tightText1: {
    en: 'Only {r} bedrooms: one person sleeps on a sofa bed in a living room, which is their own bed but not a private room.',
    de: 'Nur {r} Schlafzimmer: Eine Person schläft auf einem Schlafsofa im Wohnzimmer, ein eigenes Bett, aber kein eigenes Zimmer.',
    sl: ({ r }) => `Le ${count('sl', r, BEDROOM_FORMS.sl)}: ena oseba spi na raztegljivem kavču v dnevni sobi – lastno ležišče, a ne zasebna soba.`,
    hr: ({ r }) => `Samo ${count('hr', r, BEDROOM_FORMS.hr)}: jedna osoba spava na kauču na razvlačenje u dnevnom boravku – vlastiti ležaj, ali ne i zasebna soba.`,
    it: ({ r }) => `Solo ${count('it', r, BEDROOM_FORMS.it)}: una persona dorme sul divano letto in soggiorno, un letto proprio ma non una camera privata.`,
  },
  over: { en: 'Too many for this setting', de: 'Zu viele für diese Einstellung', sl: 'Preveč oseb za to nastavitev', hr: 'Previše osoba za ovu postavku', it: 'Troppe persone per questa opzione' },
  overOwn: {
    en: 'With one person per bed the house sleeps {cap}. Options:',
    de: 'Mit einer Person pro Bett schläft das Haus {cap}. Möglichkeiten:',
    sl: ({ cap }) => `Če ima vsak svoje ležišče, je v hiši prostora za ${count('sl', cap, PEOPLE_SL_ACC)}. Možnosti:`,
    hr: ({ cap }) => `Ako svatko ima svoj ležaj, kuća prima ${people('hr', cap)}. Mogućnosti:`,
    it: ({ cap }) => `Con una persona per letto la casa ospita ${people('it', cap)}. Le opzioni:`,
  },
  overShare: {
    en: 'The house sleeps {cap} at most. Options:',
    de: 'Das Haus schläft maximal {cap}. Möglichkeiten:',
    sl: ({ cap }) => `V hiši je prostora za največ ${count('sl', cap, PEOPLE_SL_ACC)}. Možnosti:`,
    hr: ({ cap }) => `Kuća prima najviše ${people('hr', cap)}. Mogućnosti:`,
    it: ({ cap }) => `La casa ospita al massimo ${people('it', cap)}. Le opzioni:`,
  },
  optShare: {
    en: 'Allow couples or colleagues to share: up to {cap} people sleep here.',
    de: 'Paare oder Kollegen teilen lassen: bis zu {cap} Personen schlafen hier.',
    sl: 'Dovolite, da si pari ali sodelavci delijo ležišče: tako tu prespi do {cap} oseb.',
    hr: ({ cap }) => `Dopustite parovima ili kolegama da dijele ležaj: tako ovdje može spavati do ${count('hr', cap, PEOPLE_HR_GEN)}.`,
    it: 'Lasciate che coppie o colleghi condividano il letto: qui dormono fino a {cap} persone.',
  },
  optSwitch: { en: 'Switch to sharing', de: 'Auf Teilen umstellen', sl: 'Preklopi na deljenje', hr: 'Prebaci na dijeljenje', it: 'Passa alla condivisione' },
  optWaves: {
    en: 'Split into two smaller retreats, for example leadership first, then the wider team.',
    de: 'In zwei kleinere Retreats aufteilen, z. B. erst die Führung, dann das ganze Team.',
    sl: 'Razdelite se v dva manjša retreata, na primer najprej vodstvo, nato širša ekipa.',
    hr: 'Podijelite se u dva manja retreata, npr. najprije uprava, a zatim ostatak tima.',
    it: 'Dividetevi in due ritiri più piccoli, ad esempio prima il management e poi il resto del team.',
  },
  optOverflow: {
    en: 'Ask us about extra rooms nearby for the overflow.',
    de: 'Fragen Sie uns nach zusätzlichen Zimmern in der Nähe.',
    sl: 'Vprašajte nas za dodatne sobe v bližini za preostale.',
    hr: 'Pitajte nas za dodatne sobe u blizini za ostale.',
    it: 'Chiedeteci di camere extra nei dintorni per chi non ci sta.',
  },
  askPlan: { en: 'Ask about this room plan', de: 'Diesen Zimmerplan anfragen', sl: 'Povprašajte za to razporeditev', hr: 'Pošaljite upit za ovaj raspored', it: 'Chiedete per questa sistemazione' },
  planMsgOwn: {
    en: 'Room plan: {n} people, everyone in their own bed.',
    de: 'Zimmerplan: {n} Personen, jede Person im eigenen Bett.',
    sl: ({ n }) => `Razporeditev sob: ${people('sl', n)}, vsak na svojem ležišču.`,
    hr: ({ n }) => `Raspored soba: ${people('hr', n)}, svatko u svom krevetu.`,
    it: ({ n }) => `Piano camere: ${people('it', n)}, ognuno nel proprio letto.`,
  },
  planMsgShare: {
    en: 'Room plan: {n} people, couples or colleagues can share a bed.',
    de: 'Zimmerplan: {n} Personen, Paare oder Kollegen können ein Bett teilen.',
    sl: ({ n }) => `Razporeditev sob: ${people('sl', n)}, pari ali sodelavci si lahko delijo posteljo.`,
    hr: ({ n }) => `Raspored soba: ${people('hr', n)}, parovi ili kolege mogu dijeliti krevet.`,
    it: ({ n }) => `Piano camere: ${people('it', n)}, coppie o colleghi possono condividere il letto.`,
  },
  planMsgOver: {
    en: 'We are a team of {n}; the house sleeps {cap}. What can you suggest?',
    de: 'Wir sind ein Team von {n} Personen; das Haus schläft {cap}. Was schlagen Sie vor?',
    sl: ({ n, cap }) => `Naša ekipa šteje ${people('sl', n)}, v hiši pa je prostora za ${count('sl', cap, PEOPLE_SL_ACC)}. Kaj predlagate?`,
    hr: ({ n, cap }) => `Naš tim broji ${people('hr', n)}, a kuća prima ${people('hr', cap)}. Što predlažete?`,
    it: ({ n, cap }) => `Siamo un team di ${people('it', n)} e la casa ne ospita ${cap}. Cosa ci proponete?`,
  },
  plannerNote: {
    en: 'Bed set-up as listed on the booking platforms we use. Trip.com lists no cots or extra beds; ask us.',
    de: 'Betten laut den Buchungsplattformen, auf denen wir inseriert sind. Trip.com nennt keine Babybetten oder Zustellbetten; fragen Sie uns.',
    sl: 'Postelje, kot so navedene na platformah, na katerih oglašujemo. Trip.com ne navaja otroških posteljic ali dodatnih ležišč; vprašajte nas.',
    hr: 'Raspored kreveta prema platformama na kojima oglašavamo. Trip.com ne navodi dječje krevetiće ni pomoćne ležajeve; pitajte nas.',
    it: 'Disposizione dei letti come indicata sulle piattaforme dove siamo presenti. Trip.com non indica culle né letti aggiuntivi: chiedeteci.',
  },

  // Agendas
  agendaEyebrow: { en: 'Sample agendas', de: 'Beispiel-Programme', sl: 'Primeri programov', hr: 'Primjeri programa', it: 'Programmi di esempio' },
  agendaTitle: { en: 'Three offsites that work here', de: 'Drei Offsites, die hier funktionieren', sl: 'Trije programi, ki se tu obnesejo', hr: 'Tri programa koja ovdje funkcioniraju', it: 'Tre offsite che qui funzionano' },
  agendaLede: {
    en: 'Researched itineraries with real drive times and operators. Take one as it is or let us adapt it to your goals and dates.',
    de: 'Recherchierte Programme mit echten Fahrzeiten und Anbietern. Übernehmen Sie eines oder wir passen es an Ihre Ziele und Termine an.',
    sl: 'Preverjeni programi z dejanskimi časi vožnje in ponudniki. Vzemite enega takšnega, kot je, ali pa ga prilagodimo vašim ciljem in terminom.',
    hr: 'Istraženi programi sa stvarnim vremenima vožnje i pružateljima usluga. Uzmite jedan kakav jest ili ćemo ga prilagoditi vašim ciljevima i terminima.',
    it: 'Itinerari studiati con tempi di guida e operatori reali. Sceglietene uno così com’è o lasciate che lo adattiamo ai vostri obiettivi e alle vostre date.',
  },
  // The agenda details come from the research file, which is in English.
  agendaLang: { en: '', de: 'Programmdetails auf Englisch.', sl: 'Podrobnosti programa so v angleščini.', hr: 'Detalji programa su na engleskom.', it: 'I dettagli del programma sono in inglese.' },
  day: { en: 'Day', de: 'Tag', sl: 'Dan', hr: 'Dan', it: 'Giorno' },
  customise: { en: 'Customise this agenda', de: 'Dieses Programm anpassen', sl: 'Prilagodite ta program', hr: 'Prilagodite ovaj program', it: 'Personalizzate questo programma' },
  agendaMsg: {
    en: 'We like the sample agenda "{t}" and would like to adapt it:',
    de: 'Uns gefällt das Beispielprogramm „{t}“ und wir möchten es anpassen:',
    sl: 'Všeč nam je primer programa »{t}« in bi ga radi prilagodili:',
    hr: 'Sviđa nam se primjer programa „{t}” i željeli bismo ga prilagoditi:',
    it: 'Ci piace il programma di esempio «{t}» e vorremmo adattarlo:',
  },
  kindWork: { en: 'Work session', de: 'Arbeitsblock', sl: 'Delovni del', hr: 'Radni dio', it: 'Sessione di lavoro' },
  kindFood: { en: 'Food', de: 'Essen', sl: 'Hrana', hr: 'Hrana', it: 'Pasti' },
  kindActivity: { en: 'Activity', de: 'Aktivität', sl: 'Aktivnost', hr: 'Aktivnost', it: 'Attività' },
  kindTravel: { en: 'Travel', de: 'Anreise / Fahrt', sl: 'Pot', hr: 'Putovanje', it: 'Spostamento' },
  kindFree: { en: 'Free time', de: 'Freie Zeit', sl: 'Prosti čas', hr: 'Slobodno vrijeme', it: 'Tempo libero' },
  bestIn: { en: 'Best in', de: 'Ideal im' },
  yourMonth: { en: 'Fits your month', de: 'Passt zu Ihrem Monat', sl: 'Ustreza vašemu mesecu', hr: 'Odgovara vašem mjesecu', it: 'Adatto al vostro mese' },

  // Activities
  actEyebrow: { en: 'Team activities', de: 'Team-Aktivitäten', sl: 'Aktivnosti za ekipe', hr: 'Timske aktivnosti', it: 'Attività di team' },
  actTitle: { en: 'Things to do together, with real operators', de: 'Gemeinsame Aktivitäten mit echten Anbietern', sl: 'Skupne aktivnosti z resničnimi ponudniki', hr: 'Zajedničke aktivnosti sa stvarnim pružateljima usluga', it: 'Cose da fare insieme, con operatori reali' },
  actLede: {
    en: 'Distances and drive times are by road from the house, from a routing service, so treat them as approximate. Prices appear only where the operator publishes them.',
    de: 'Entfernungen und Fahrzeiten auf der Straße ab dem Haus, laut Routenplaner, also ungefähr. Preise nur, wo der Anbieter sie veröffentlicht.',
    sl: 'Razdalje in časi vožnje so po cesti od hiše, po podatkih načrtovalnika poti, zato so približni. Cene navajamo le tam, kjer jih ponudnik objavlja.',
    hr: 'Udaljenosti i vremena vožnje računaju se cestom od kuće, prema servisu za rute, pa su približni. Cijene navodimo samo ondje gdje ih pružatelj objavljuje.',
    it: 'Distanze e tempi di guida sono calcolati su strada dalla casa con un servizio di percorsi, quindi sono indicativi. I prezzi compaiono solo dove l’operatore li pubblica.',
  },
  actLang: { en: '', de: 'Beschreibungen auf Englisch.', sl: 'Opisi so v angleščini.', hr: 'Opisi su na engleskom.', it: 'Le descrizioni sono in inglese.' },
  all: { en: 'All', de: 'Alle', sl: 'Vse', hr: 'Sve', it: 'Tutte' },
  teambuilding: { en: 'Teambuilding', de: 'Teambuilding', sl: 'Teambuilding', hr: 'Team building', it: 'Team building' },
  catering: { en: 'Food & catering', de: 'Essen & Catering', sl: 'Hrana in catering', hr: 'Hrana i catering', it: 'Cibo e catering' },
  workspace: { en: 'Workspace', de: 'Arbeitsplatz', sl: 'Delovni prostor', hr: 'Radni prostor', it: 'Spazi di lavoro' },
  transport: { en: 'Transport', de: 'Transport', sl: 'Prevoz', hr: 'Prijevoz', it: 'Trasporti' },
  wellness: { en: 'Wellness', de: 'Wellness', sl: 'Dobro počutje', hr: 'Wellness', it: 'Benessere' },
  groupUpTo: { en: 'up to {n}', de: 'bis {n}', sl: 'do {n}', hr: 'do {n}', it: 'fino a {n}' },
  groupFrom: { en: 'from {n}', de: 'ab {n}', sl: 'od {n}', hr: 'od {n}', it: 'da {n}' },
  groupRange: {
    en: '{a}–{b} people',
    de: '{a}–{b} Personen',
    sl: ({ a, b }) => `${a}–${people('sl', b)}`,
    hr: ({ a, b }) => `${a}–${people('hr', b)}`,
    it: '{a}–{b} persone',
  },
  groupAsk: { en: 'group size: ask', de: 'Gruppengröße: anfragen', sl: 'velikost skupine: vprašajte', hr: 'veličina grupe: pitajte', it: 'dimensione del gruppo: chiedete' },
  atHouse: { en: 'at the house', de: 'am Haus', sl: 'pri hiši', hr: 'kod kuće', it: 'in casa' },
  comesToYou: { en: 'comes to the house', de: 'kommt ins Haus', sl: 'pride v hišo', hr: 'dolazi u kuću', it: 'viene a casa vostra' },
  byCar: { en: 'by car', de: 'mit dem Auto', sl: 'z avtom', hr: 'autom', it: 'in auto' },
  monthsAsk: { en: 'Season: ask', de: 'Saison: anfragen', sl: 'Sezona: vprašajte', hr: 'Sezona: pitajte', it: 'Stagione: chiedete' },
  price: { en: 'Published price', de: 'Veröffentlichter Preis', sl: 'Objavljena cena', hr: 'Objavljena cijena', it: 'Prezzo pubblicato' },
  priceFrom: { en: 'from {p}', de: 'ab {p}', sl: 'od {p}', hr: 'od {p}', it: 'da {p}' },
  priceNote: { en: 'Price note (research, English)', de: 'Preishinweis (Recherche, Englisch)', sl: 'Opomba o ceni (raziskava, v angleščini)', hr: 'Napomena o cijeni (istraživanje, na engleskom)', it: 'Nota sul prezzo (ricerca, in inglese)' },
  freeTour: { en: 'Free', de: 'Kostenlos', sl: 'Brezplačno', hr: 'Besplatno', it: 'Gratuito' },
  noPrice: { en: 'Price on request', de: 'Preis auf Anfrage', sl: 'Cena na povpraševanje', hr: 'Cijena na upit', it: 'Prezzo su richiesta' },
  // {m}: the month in the nominative, hence the colon form in sl/hr.
  inMonth: { en: 'Runs in {m}', de: 'Im {m} möglich', sl: 'Na voljo: {m}', hr: 'Dostupno: {m}', it: 'Disponibile in {m}' },
  notInMonth: { en: 'Not in {m}', de: 'Nicht im {m}', sl: 'Ni na voljo: {m}', hr: 'Nije dostupno: {m}', it: 'Non disponibile in {m}' },
  unverified: { en: 'Unverified lead', de: 'Ungeprüfter Hinweis', sl: 'Nepreverjen namig', hr: 'Neprovjeren prijedlog', it: 'Segnalazione non verificata' },
  unverifiedText: {
    en: 'Not confirmed for 2026. We will check it for you.',
    de: 'Für 2026 nicht bestätigt. Wir prüfen es für Sie.',
    sl: 'Za 2026 ni potrjeno. Preverili bomo za vas.',
    hr: 'Nije potvrđeno za 2026. Provjerit ćemo za vas.',
    it: 'Non confermato per il 2026. Lo verifichiamo noi per voi.',
  },
  showLeads: {
    en: 'Show {n} unverified leads',
    de: '{n} ungeprüfte Hinweise zeigen',
    sl: ({ n }) => `Pokaži ${count('sl', n, { one: 'nepreverjen namig', two: 'nepreverjena namiga', few: 'nepreverjene namige', other: 'nepreverjenih namigov' })}`,
    hr: ({ n }) => `Prikaži ${count('hr', n, { one: 'neprovjeren prijedlog', few: 'neprovjerena prijedloga', other: 'neprovjerenih prijedloga' })}`,
    it: ({ n }) => `Mostra ${count('it', n, { one: 'segnalazione non verificata', other: 'segnalazioni non verificate' })}`,
  },
  hideLeads: { en: 'Hide unverified leads', de: 'Ungeprüfte Hinweise ausblenden', sl: 'Skrij nepreverjene namige', hr: 'Sakrij neprovjerene prijedloge', it: 'Nascondi le segnalazioni non verificate' },
  operator: { en: 'Operator', de: 'Anbieter', sl: 'Ponudnik', hr: 'Pružatelj usluge', it: 'Operatore' },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  noneInCat: { en: 'Nothing verified in this category yet.', de: 'In dieser Kategorie noch nichts geprüft.', sl: 'V tej kategoriji še ni ničesar preverjenega.', hr: 'U ovoj kategoriji još ništa nije provjereno.', it: 'In questa categoria non c’è ancora nulla di verificato.' },
  shownCount: { en: '{n} shown', de: '{n} angezeigt', sl: 'Prikazano: {n}', hr: 'Prikazano: {n}', it: 'Visualizzate: {n}' },
  showAll: {
    en: 'Show all {n} activities',
    de: 'Alle {n} Aktivitäten zeigen',
    sl: ({ n }) => plural('sl', n, { one: `Pokaži ${n} aktivnost`, two: 'Pokaži obe aktivnosti', few: `Pokaži vse ${n} aktivnosti`, other: `Pokaži vseh ${n} aktivnosti` }),
    hr: ({ n }) => plural('hr', n, { one: `Prikaži ${n} aktivnost`, few: `Prikaži sve ${n} aktivnosti`, other: `Prikaži svih ${n} aktivnosti` }),
    it: ({ n }) => (n === 1 ? 'Mostra l’attività' : `Mostra tutte le ${n} attività`),
  },
  showFewer: { en: 'Show fewer', de: 'Weniger zeigen', sl: 'Pokaži manj', hr: 'Prikaži manje', it: 'Mostra meno' },
  bedsUsed: { en: '{n} of {total} beds used', de: '{n} von {total} Betten belegt', sl: 'Zasedene postelje: {n} od {total}', hr: 'Zauzeti kreveti: {n} od {total}', it: 'Letti occupati: {n} su {total}' },
  bedsUsedShare: { en: '{n} of {total} sleeping places used', de: '{n} von {total} Schlafplätzen belegt', sl: 'Zasedena ležišča: {n} od {total}', hr: 'Zauzeta mjesta za spavanje: {n} od {total}', it: 'Posti letto occupati: {n} su {total}' },
  places: { en: 'places', de: 'Plätze', sl: 'mest', hr: 'mjesta', it: 'posti' },

  // Checklist
  checkEyebrow: { en: 'Venue checklist', de: 'Checkliste', sl: 'Kontrolni seznam', hr: 'Popis za provjeru', it: 'Checklist della struttura' },
  checkTitle: { en: 'What companies ask us', de: 'Was Firmen uns fragen', sl: 'Kaj nas sprašujejo podjetja', hr: 'Što nas pitaju tvrtke', it: 'Cosa ci chiedono le aziende' },
  checkLede: {
    en: 'The questions offsite planners ask a venue, with honest answers. Where we do not know yet, it says so.',
    de: 'Die Fragen, die Offsite-Planer einem Ort stellen, mit ehrlichen Antworten. Was wir noch nicht wissen, steht auch so da.',
    sl: 'Vprašanja, ki jih organizatorji poslovnih srečanj zastavijo gostitelju, z iskrenimi odgovori. Kjer česa še ne vemo, tako tudi piše.',
    hr: 'Pitanja koja organizatori offsitea postavljaju domaćinu, s iskrenim odgovorima. Gdje nešto još ne znamo, to i piše.',
    it: 'Le domande che chi organizza un offsite fa a una struttura, con risposte sincere. Dove non lo sappiamo ancora, lo diciamo.',
  },
  stYes: { en: 'Answered', de: 'Beantwortet', sl: 'Odgovorjeno', hr: 'Odgovoreno', it: 'Risposta' },
  stPartial: { en: 'Partly answered', de: 'Teilweise beantwortet', sl: 'Delno odgovorjeno', hr: 'Djelomično odgovoreno', it: 'Risposta parziale' },
  stAsk: { en: 'Ask us', de: 'Fragen Sie uns', sl: 'Vprašajte nas', hr: 'Pitajte nas', it: 'Chiedeteci' },
  fromListings: { en: 'From our platform listings', de: 'Aus unseren Plattform-Inseraten', sl: 'Iz naših oglasov na platformah', hr: 'Iz naših oglasa na platformama', it: 'Dai nostri annunci sulle piattaforme' },
  // Invoicing
  invTitle: { en: 'Invoices & VAT', de: 'Rechnung & MwSt.', sl: 'Računi in DDV', hr: 'Računi i PDV', it: 'Fatture e IVA' },
  invLead: {
    en: 'Whether we issue an R1 invoice with VAT shown, or an invoice without VAT, depends on our tax status. Please ask us before you budget.',
    de: 'Ob wir eine R1-Rechnung mit ausgewiesener MwSt. oder eine Rechnung ohne MwSt. ausstellen, hängt von unserem Steuerstatus ab. Bitte fragen Sie uns vor der Budgetplanung.',
    sl: 'Ali izstavimo račun R1 z izkazanim DDV ali račun brez DDV, je odvisno od našega davčnega statusa. Vprašajte nas, preden pripravite proračun.',
    hr: 'Hoćemo li izdati R1 račun s iskazanim PDV-om ili račun bez PDV-a, ovisi o našem poreznom statusu. Pitajte nas prije izrade budžeta.',
    it: 'Se emettiamo una fattura R1 con IVA esposta o una fattura senza IVA dipende dal nostro regime fiscale. Chiedeteci prima di definire il budget.',
  },
  invGeneral: {
    en: 'Background for your finance team (general rules, not tax advice):',
    de: 'Hintergrund für Ihre Buchhaltung (allgemeine Regeln, keine Steuerberatung):',
    sl: 'Ozadje za vaše računovodstvo (splošna pravila, ne davčni nasvet):',
    hr: 'Pozadina za vaše računovodstvo (opća pravila, ne porezni savjet):',
    it: 'Contesto per il vostro ufficio amministrativo (regole generali, non consulenza fiscale):',
  },
  unconfirmed: { en: 'unconfirmed', de: 'unbestätigt', sl: 'nepotrjeno', hr: 'nepotvrđeno', it: 'non confermato' },

  // Off-season
  offTitle: { en: 'Why spring and autumn', de: 'Warum Frühling und Herbst', sl: 'Zakaj pomlad in jesen', hr: 'Zašto proljeće i jesen', it: 'Perché primavera e autunno' },
  offLead: {
    en: 'April to June and September to October bring warm days, quiet beaches and easier availability. Whole-house prices for these months: ask us.',
    de: 'April bis Juni und September bis Oktober: warme Tage, ruhige Strände und mehr freie Termine. Preise für das ganze Haus in diesen Monaten: auf Anfrage.',
    sl: 'Od aprila do junija ter od septembra do oktobra so dnevi topli, plaže mirne, prostih terminov pa več. Cene za celo hišo v teh mesecih: vprašajte nas.',
    hr: 'Od travnja do lipnja te od rujna do listopada dani su topli, plaže mirne, a slobodnih termina više. Cijene za cijelu kuću u tim mjesecima: pitajte nas.',
    it: 'Da aprile a giugno e da settembre a ottobre: giornate calde, spiagge tranquille e più disponibilità. Prezzi per tutta la casa in questi mesi: chiedeteci.',
  },
  maxC: { en: 'day', de: 'Tag', sl: 'dan', hr: 'dan', it: 'giorno' },
  seaC: { en: 'sea', de: 'Meer', sl: 'morje', hr: 'more', it: 'mare' },
  peak: { en: 'peak', de: 'Hochsaison', sl: 'visoka sezona', hr: 'glavna sezona', it: 'alta stagione' },
  climateNote: {
    en: 'Average day maximum and sea temperature for our coordinates (Open-Meteo).',
    de: 'Durchschnittliche Tageshöchst- und Meerestemperatur für unsere Koordinaten (Open-Meteo).',
    sl: 'Povprečna najvišja dnevna temperatura in temperatura morja za naše koordinate (Open-Meteo).',
    hr: 'Prosječna najviša dnevna temperatura i temperatura mora za naše koordinate (Open-Meteo).',
    it: 'Temperatura massima diurna media e temperatura del mare per le nostre coordinate (Open-Meteo).',
  },

  // Final CTA / errors
  ctaTitle: { en: 'Tell us about your team', de: 'Erzählen Sie uns von Ihrem Team', sl: 'Povejte nam o svoji ekipi', hr: 'Recite nam nešto o svom timu', it: 'Raccontateci del vostro team' },
  ctaText: {
    en: 'Team size, dates and goals are enough. We reply personally with availability and a proposal for your group. No obligation.',
    de: 'Teamgröße, Termine und Ziele genügen. Wir antworten persönlich mit Verfügbarkeit und einem Vorschlag für Ihre Gruppe. Unverbindlich.',
    sl: 'Dovolj so velikost ekipe, termini in cilji. Osebno vam odgovorimo z razpoložljivostjo in predlogom za vašo skupino. Brez obveznosti.',
    hr: 'Dovoljni su veličina tima, termini i ciljevi. Osobno odgovaramo s dostupnošću i prijedlogom za vašu grupu. Bez obveze.',
    it: 'Bastano dimensioni del team, date e obiettivi. Vi rispondiamo di persona con disponibilità e una proposta per il vostro gruppo. Senza impegno.',
  },
  loading: { en: 'Loading retreat details…', de: 'Retreat-Details werden geladen…', sl: 'Nalaganje podrobnosti …', hr: 'Učitavanje detalja…', it: 'Caricamento dei dettagli…' },
  mountError: {
    en: 'Part of this section could not load. The numbers and the room planner above are still accurate; ask us for the programme.',
    de: 'Ein Teil dieses Abschnitts konnte nicht geladen werden. Zahlen und Zimmerplaner oben stimmen trotzdem; fragen Sie uns nach dem Programm.',
    sl: 'Dela tega razdelka ni bilo mogoče naložiti. Številke in načrtovalnik sob zgoraj kljub temu držijo; za program nas vprašajte.',
    hr: 'Dio ovog odjeljka nije se mogao učitati. Brojke i planer soba iznad i dalje su točni; pitajte nas za program.',
    it: 'Non è stato possibile caricare parte di questa sezione. I numeri e il planner delle camere qui sopra restano validi; chiedeteci il programma.',
  },
};

// Sample-agenda labels and their best months (from each agenda's `season`).
const AGENDA_META = {
  'strategy-offsite-3d': {
    months: [9],
    icon: 'star',
    title: { en: '3-day strategy offsite', de: '3-tägiges Strategie-Offsite', sl: '3-dnevno strateško srečanje', hr: '3-dnevni strateški offsite', it: 'Offsite strategico di 3 giorni' },
    who: { en: '10–12 people · mid-September', de: '10–12 Personen · Mitte September', sl: '10–12 oseb · sredina septembra', hr: '10–12 osoba · sredina rujna', it: '10–12 persone · metà settembre' },
  },
  'hack-week-4d': {
    months: [10],
    icon: 'laptop',
    title: { en: '4-day hack week', de: '4-tägige Hack-Week', sl: '4-dnevni hekaton', hr: '4-dnevni hackathon', it: 'Hack week di 4 giorni' },
    who: { en: '8–14 engineers · early October', de: '8–14 Entwickler · Anfang Oktober', sl: '8–14 razvijalcev · začetek oktobra', hr: '8–14 programera · početak listopada', it: '8–14 sviluppatori · inizio ottobre' },
  },
  'leadership-retreat-2d': {
    months: [4, 5],
    icon: 'mountain',
    title: { en: '2-day leadership retreat', de: '2-tägiges Führungs-Retreat', sl: '2-dnevni retreat za vodstvo', hr: '2-dnevni retreat za menadžment', it: 'Ritiro di leadership di 2 giorni' },
    who: { en: '6–8 people · late April or May', de: '6–8 Personen · Ende April oder Mai', sl: '6–8 oseb · konec aprila ali maja', hr: '6–8 osoba · krajem travnja ili u svibnju', it: '6–8 persone · fine aprile o maggio' },
  },
};

const CATEGORIES = [
  { id: 'teambuilding', icon: 'users' },
  { id: 'catering', icon: 'grill' },
  { id: 'workspace', icon: 'laptop' },
  { id: 'transport', icon: 'car' },
  { id: 'wellness', icon: 'leaf' },
];

// Not shown as activity cards: the house itself (its description gives a 68 m²
// terrace, the listings 16 m²), and the national 5G explainer, whose facts feed
// the Wi-Fi answer in the checklist instead.
const HIDDEN_ITEMS = new Set(['villa-onsite-workspace', 'mobile-fixed-connectivity']);
// Card order: things a team does together first, venues last.
const CATEGORY_ORDER = ['teambuilding', 'catering', 'wellness', 'transport', 'workspace'];

// Short guest-facing price labels per item (research units are long notes,
// which stay in the card's Sources disclosure). from: the price is a "from" price.
const PER_PERSON = { en: 'per person', de: 'pro Person', sl: 'na osebo', hr: 'po osobi', it: 'a persona' };
const PER_ADULT = { en: 'per adult (children €35)', de: 'pro Erwachsenem (Kinder 35 €)', sl: 'na odraslega (otroci 35 €)', hr: 'po odrasloj osobi (djeca 35 €)', it: 'per adulto (bambini 35 €)' };
const PRICE_UNITS = {
  'kite-intro-nin': { en: 'per person, 2 h intro lesson', de: 'pro Person, 2 Std. Einsteigerkurs', sl: 'na osebo, 2-urni uvodni tečaj', hr: 'po osobi, uvodni tečaj od 2 sata', it: 'a persona, lezione introduttiva di 2 ore' },
  'sup-safari-nin': { en: 'per person, 2 h', de: 'pro Person, 2 Std.', sl: 'na osebo, 2 uri', hr: 'po osobi, 2 sata', it: 'a persona, 2 ore' },
  'zrmanja-kayak': PER_ADULT,
  'zrmanja-rafting': PER_ADULT,
  'zadar-sea-kayak': { from: true, ...PER_PERSON },
  'kotari-polaca-tasting': {
    en: 'per person, tasting with 3 wines (smaller tastings from €15)',
    de: 'pro Person, Verkostung mit 3 Weinen (kleinere ab 15 €)',
    sl: 'na osebo, degustacija 3 vin (manjše degustacije od 15 €)',
    hr: 'po osobi, degustacija 3 vina (manje degustacije od 15 €)',
    it: 'a persona, degustazione di 3 vini (degustazioni più piccole da 15 €)',
  },
  'solana-nin-tour': { en: 'guided tour on Open Days', de: 'Führung an den Open Days', sl: 'vodeni ogled ob dnevih odprtih vrat', hr: 'vođena tura na Dane otvorenih vrata', it: 'visita guidata negli Open Days' },
  'paklenica-hike': {
    en: 'adult day ticket in Mar, Apr and Oct (€10 May–Sep)',
    de: 'Tageskarte Erwachsene im März, April, Oktober (10 € Mai–Sep.)',
    sl: 'dnevna vstopnica za odrasle marca, aprila in oktobra (10 € maj–sep.)',
    hr: 'dnevna ulaznica za odrasle u ožujku, travnju i listopadu (10 € svibanj–rujan)',
    it: 'biglietto giornaliero adulti a marzo, aprile e ottobre (10 € maggio–settembre)',
  },
  'kornati-boat-day': { from: true, en: 'per person, shared excursion boat', de: 'pro Person, Ausflugsboot mit anderen Gästen', sl: 'na osebo, izletniška ladja z drugimi gosti', hr: 'po osobi, izletnički brod s drugim gostima', it: 'a persona, barca da escursione condivisa' },
  'pag-life-on-mars-hike': { from: true, ...PER_PERSON },
  'private-chef-takeachef': { en: 'per guest for 7–12 guests, platform average', de: 'pro Gast bei 7–12 Gästen, Plattform-Durchschnitt', sl: 'na gosta pri 7–12 gostih, povprečje platforme', hr: 'po gostu za 7–12 gostiju, prosjek platforme', it: 'a ospite per 7–12 ospiti, media della piattaforma' },
  'code-hub-zadar': { en: 'coworking desk', de: 'Coworking-Platz', sl: 'coworking mesto', hr: 'coworking mjesto', it: 'postazione in coworking' },
  'zadar-airport-shuttle': { en: 'per person, one way, airport to Zadar', de: 'pro Person, einfach, Flughafen–Zadar', sl: 'na osebo, v eno smer, letališče–Zadar', hr: 'po osobi, u jednom smjeru, zračna luka – Zadar', it: 'a persona, sola andata, aeroporto–Zadar' },
};

// Agenda step -> operator link. A step links its item's operator only when the
// step text names that operator or its product (never for travel steps, and
// at most once per day).
const LINK_MATCH = {
  'kite-intro-nin': /Kitesurf|kite intro/i,
  'sup-safari-nin': /SUP Safari/i,
  'zrmanja-rafting': /rafting/i,
  'zrmanja-kayak': /kayak/i,
  'solana-nin-tour': /Solana/i,
  'paklenica-hike': /canyon|hike/i,
  'kotari-polaca-tasting': /Kotari/i,
  'wine-kraljevski-vinogradi': /Kraljevski/i,
  'private-chef-takeachef': /chef/i,
  'coin-zadar-coworking': /COIN/,
};

// Venue checklist answers, matched to research/retreats.json venueChecklist
// questions. status: yes | partial | ask. `listing: true` = answer comes from
// the platform listings (src/data/listing.json).
const CHECKS = [
  {
    match: /private bedrooms/i,
    status: 'yes',
    q: {
      en: 'How many people get a private bedroom, and how many beds in total?',
      de: 'Wie viele bekommen ein eigenes Schlafzimmer, wie viele Betten gibt es?',
      sl: 'Koliko oseb dobi svojo spalnico in koliko je vseh postelj?',
      hr: 'Koliko osoba dobiva vlastitu spavaću sobu i koliko je ukupno kreveta?',
      it: 'Quante persone hanno una camera propria e quanti letti ci sono in tutto?',
    },
    a: (f) => ({
      en: `${f.bedrooms} bedrooms, each with a 180 cm double bed, plus ${f.sofas} sofa beds for two: ${f.bedrooms} private rooms, ${f.ownBeds} people in a bed of their own, ${f.max} guests at most. Try the room planner above.`,
      de: `${f.bedrooms} Schlafzimmer mit je einem 180-cm-Doppelbett, dazu ${f.sofas} Schlafsofas für zwei: ${f.bedrooms} eigene Zimmer, ${f.ownBeds} Personen mit eigenem Bett, maximal ${f.max} Gäste. Probieren Sie den Zimmerplaner oben.`,
      sl: `${count('sl', f.bedrooms, BEDROOM_FORMS.sl)}, vsaka z zakonsko posteljo 180 cm, in še ${count('sl', f.sofas, { one: 'raztegljiv kavč', two: 'raztegljiva kavča', few: 'raztegljivi kavči', other: 'raztegljivih kavčev' })} za dve osebi: ${count('sl', f.bedrooms, { one: 'zasebna soba', two: 'zasebni sobi', few: 'zasebne sobe', other: 'zasebnih sob' })}, ${people('sl', f.ownBeds)} s svojim ležiščem, največ ${count('sl', f.max, { one: 'gost', two: 'gosta', few: 'gostje', other: 'gostov' })}. Preizkusite načrtovalnik sob zgoraj.`,
      hr: `${count('hr', f.bedrooms, BEDROOM_FORMS.hr)}, svaka s bračnim krevetom od 180 cm, te ${count('hr', f.sofas, { one: 'kauč', few: 'kauča', other: 'kauča' })} na razvlačenje za dvoje: ${count('hr', f.bedrooms, { one: 'zasebna soba', few: 'zasebne sobe', other: 'zasebnih soba' })}, ${people('hr', f.ownBeds)} s vlastitim ležajem, najviše ${count('hr', f.max, { one: 'gost', few: 'gosta', other: 'gostiju' })}. Isprobajte planer soba iznad.`,
      it: `${count('it', f.bedrooms, BEDROOM_FORMS.it)}, ognuna con letto matrimoniale da 180 cm, più ${count('it', f.sofas, { one: 'divano letto', other: 'divani letto' })} per due: ${count('it', f.bedrooms, { one: 'camera privata', other: 'camere private' })}, ${people('it', f.ownBeds)} con un letto proprio, al massimo ${count('it', f.max, { one: 'ospite', other: 'ospiti' })}. Provate il planner delle camere qui sopra.`,
    }),
    listing: true,
  },
  {
    match: /Wi-Fi/i,
    status: 'partial',
    q: { en: 'How fast is the internet, and is there a backup?', de: 'Wie schnell ist das Internet, gibt es ein Backup?', sl: 'Kako hiter je internet in ali obstaja rezervna povezava?', hr: 'Koliko je brz internet i postoji li rezervna veza?', it: 'Quanto è veloce internet e c’è un backup?' },
    a: (f) => ({
      en: `Wi-Fi is listed in all ${f.wifi} apartments. Measured download and upload speeds: ask us. As a backup, all three Croatian mobile networks (A1, Hrvatski Telekom, Telemach) offer 5G; check their coverage for the address on the HAKOM map.`,
      de: `WLAN ist in allen ${f.wifi} Apartments angegeben. Gemessene Download- und Upload-Werte: auf Anfrage. Als Backup bieten alle drei kroatischen Mobilfunknetze (A1, Hrvatski Telekom, Telemach) 5G an; ihre Abdeckung an der Adresse zeigt die HAKOM-Karte.`,
      sl: `Wi-Fi je naveden v ${plural('sl', f.wifi, { one: `${f.wifi} apartmaju`, two: 'obeh apartmajih', few: `vseh ${f.wifi} apartmajih`, other: `vseh ${f.wifi} apartmajih` })}. Izmerjena hitrost prenosa in nalaganja: vprašajte nas. Kot rezervo vsa tri hrvaška mobilna omrežja (A1, Hrvatski Telekom, Telemach) ponujajo 5G; pokritost na naslovu preverite na zemljevidu HAKOM.`,
      hr: `Wi-Fi je naveden ${plural('hr', f.wifi, { one: `u ${f.wifi} apartmanu`, few: `u sva ${f.wifi} apartmana`, other: `u svih ${f.wifi} apartmana` })}. Izmjerena brzina preuzimanja i slanja: pitajte nas. Kao rezervu sve tri hrvatske mobilne mreže (A1, Hrvatski Telekom, Telemach) nude 5G; pokrivenost za adresu provjerite na HAKOM-ovoj karti.`,
      it: `Il Wi-Fi è indicato ${f.wifi === 1 ? 'in 1 appartamento' : `in tutti e ${f.wifi} gli appartamenti`}. Velocità misurata in download e upload: chiedeteci. Come backup, tutte e tre le reti mobili croate (A1, Hrvatski Telekom, Telemach) offrono il 5G; verificate la copertura all’indirizzo sulla mappa HAKOM.`,
    }),
    todo: 'measured Wi-Fi speed per apartment',
    listing: true,
    srcItem: 'mobile-fixed-connectivity',
    link: { href: 'https://ekarta.hakom.hr/HR_HAKOM_MapePokrivanja/', label: { en: 'HAKOM coverage map', de: 'HAKOM-Abdeckungskarte', sl: 'Zemljevid pokritosti HAKOM', hr: 'HAKOM-ova karta pokrivenosti', it: 'Mappa di copertura HAKOM' } },
  },
  {
    match: /exclusively/i,
    status: 'ask',
    q: { en: 'Can we have the whole house to ourselves?', de: 'Haben wir das Haus für uns allein?', sl: 'Ali imamo lahko celo hišo samo zase?', hr: 'Možemo li imati cijelu kuću samo za sebe?', it: 'Possiamo avere tutta la casa solo per noi?' },
    a: () => ({
      en: 'The four apartments are the whole guest house. Ask us to confirm exclusive use for your dates.',
      de: 'Die vier Apartments sind das ganze Gästehaus. Fragen Sie uns, ob Sie es zu Ihren Terminen exklusiv nutzen können.',
      sl: 'Štirje apartmaji so celotna hiša za goste. Vprašajte nas, da vam potrdimo izključno uporabo za vaše termine.',
      hr: 'Četiri apartmana čine cijelu kuću za goste. Pitajte nas da vam potvrdimo isključivo korištenje za vaše termine.',
      it: 'I quattro appartamenti sono l’intera casa per gli ospiti. Chiedeteci di confermarvi l’uso esclusivo per le vostre date.',
    }),
    todo: 'exclusive use / caretaker on site during whole-house stays',
  },
  {
    match: /plenary/i,
    status: 'partial',
    q: { en: 'Where does a group of 14 meet?', de: 'Wo trifft sich eine Gruppe von 14?', sl: 'Kje se lahko sestane skupina 14 oseb?', hr: 'Gdje se može okupiti grupa od 14 osoba?', it: 'Dove si riunisce un gruppo di 14 persone?' },
    a: () => ({
      en: 'Apartment 1 has a 16 m² covered terrace and Apartment 2 a 16 m² covered loggia, plus the lawn garden; the living rooms work as breakouts. A table for 14 and heaters for cool evenings: ask us.',
      de: 'Apartment 1 hat eine überdachte Terrasse mit 16 m², Apartment 2 eine überdachte Loggia mit 16 m², dazu der Rasengarten; die Wohnzimmer dienen als Breakout-Räume. Ein Tisch für 14 und Heizstrahler für kühle Abende: auf Anfrage.',
      sl: 'Apartma 1 ima 16 m² veliko pokrito teraso, apartma 2 pa 16 m² veliko pokrito ložo, poleg tega je tu travnati vrt; dnevne sobe so primerne za delo v manjših skupinah. Miza za 14 oseb in grelniki za hladne večere: vprašajte nas.',
      hr: 'Apartman 1 ima natkrivenu terasu od 16 m², a apartman 2 natkrivenu ložu od 16 m², uz to i travnati vrt; dnevni boravci služe za rad u manjim grupama. Stol za 14 osoba i grijalice za svježe večeri: pitajte nas.',
      it: 'L’appartamento 1 ha una terrazza coperta di 16 m² e l’appartamento 2 una loggia coperta di 16 m², oltre al prato del giardino; i soggiorni vanno bene per i lavori in piccoli gruppi. Un tavolo per 14 e stufe per le sere fresche: chiedeteci.',
    }),
    todo: 'plenary table for 14, shade, outdoor heating',
    listing: true,
  },
  {
    match: /projector|HDMI/i,
    status: 'partial',
    q: { en: 'Screen, projector, whiteboard, power?', de: 'Bildschirm, Beamer, Whiteboard, Steckdosen?', sl: 'Zaslon, projektor, tabla, vtičnice?', hr: 'Ekran, projektor, ploča, utičnice?', it: 'Schermo, proiettore, lavagna, prese?' },
    a: () => ({
      en: 'Every apartment has a satellite TV. HDMI, a projector, a whiteboard and extension leads: ask us.',
      de: 'Jedes Apartment hat Sat-TV. HDMI, Beamer, Whiteboard und Verlängerungskabel: auf Anfrage.',
      sl: 'Vsak apartma ima satelitsko televizijo. HDMI, projektor, tablo in podaljške: vprašajte nas.',
      hr: 'Svaki apartman ima satelitsku televiziju. HDMI, projektor, ploču i produžne kabele: pitajte nas.',
      it: 'Ogni appartamento ha la TV satellitare. HDMI, proiettore, lavagna e prolunghe: chiedeteci.',
    }),
    todo: 'AV kit',
    listing: true,
  },
  {
    match: /Grill area/i,
    status: 'partial',
    q: { en: 'Can we cook together or bring a chef?', de: 'Können wir zusammen kochen oder einen Koch mitbringen?', sl: 'Ali lahko kuhamo skupaj ali pripeljemo kuharja?', hr: 'Možemo li kuhati zajedno ili dovesti kuhara?', it: 'Possiamo cucinare insieme o portare uno chef?' },
    a: () => ({
      en: 'The grill in the courtyard is free for all guests, and Apartment 1 has its own outdoor kitchen. Whether an outside chef can use them: ask us.',
      de: 'Der Grill im Hof ist für alle Gäste kostenlos, Apartment 1 hat eine eigene Außenküche. Ob ein externer Koch sie nutzen darf: auf Anfrage.',
      sl: 'Žar na dvorišču lahko brezplačno uporabljajo vsi gostje, apartma 1 pa ima svojo zunanjo kuhinjo. Ali ju lahko uporablja zunanji kuhar: vprašajte nas.',
      hr: 'Roštilj u dvorištu besplatan je za sve goste, a apartman 1 ima vlastitu vanjsku kuhinju. Smije li ih koristiti vanjski kuhar: pitajte nas.',
      it: 'Il barbecue in cortile è gratuito per tutti gli ospiti e l’appartamento 1 ha una cucina esterna propria. Se uno chef esterno possa usarli: chiedeteci.',
    }),
    todo: 'outside chef / caterer allowed?',
  },
  {
    match: /R-1|invoice/i,
    status: 'ask',
    q: { en: 'Which invoice can you issue?', de: 'Welche Rechnung stellen Sie aus?', sl: 'Kakšen račun lahko izstavite?', hr: 'Koji račun možete izdati?', it: 'Che tipo di fattura potete emettere?' },
    a: () => ({
      en: 'Depends on our tax status: see “Invoices & VAT” below.',
      de: 'Hängt von unserem Steuerstatus ab: siehe „Rechnung & MwSt.“ unten.',
      sl: 'Odvisno od našega davčnega statusa: glejte »Računi in DDV« spodaj.',
      hr: 'Ovisi o našem poreznom statusu: pogledajte „Računi i PDV” niže.',
      it: 'Dipende dal nostro regime fiscale: vedete «Fatture e IVA» più sotto.',
    }),
    todo: 'R1 with 13 % VAT or invoice without VAT; eRačun',
  },
  {
    match: /Tourist tax/i,
    status: 'ask',
    q: { en: 'Is the tourist tax included?', de: 'Ist die Kurtaxe enthalten?', sl: 'Ali je turistična taksa vključena?', hr: 'Je li boravišna pristojba uključena?', it: 'La tassa di soggiorno è inclusa?' },
    a: () => ({
      en: 'Tourist tax is set locally per person and night; the 2026 amount for Privlaka is not confirmed. Ask us to show it as its own line in the quote.',
      de: 'Die Kurtaxe wird pro Person und Nacht lokal festgelegt; der Betrag 2026 für Privlaka ist nicht bestätigt. Wir weisen sie auf Wunsch im Angebot separat aus.',
      sl: 'Turistična taksa se določi lokalno na osebo in noč; znesek za Privlako v 2026 ni potrjen. Prosite nas, naj jo v ponudbi navedemo kot ločeno postavko.',
      hr: 'Boravišna pristojba određuje se lokalno po osobi i noćenju; iznos za Privlaku u 2026. nije potvrđen. Zamolite nas da je u ponudi iskažemo kao zasebnu stavku.',
      it: 'La tassa di soggiorno è stabilita localmente per persona e per notte; l’importo 2026 per Privlaka non è confermato. Chiedeteci di indicarla come voce separata nel preventivo.',
    }),
    todo: '2026 tourist tax Privlaka',
  },
  {
    match: /Parking/i,
    status: 'partial',
    q: { en: 'How many cars can we park?', de: 'Wie viele Autos können parken?', sl: 'Koliko avtomobilov lahko parkiramo?', hr: 'Koliko automobila možemo parkirati?', it: 'Quante auto possiamo parcheggiare?' },
    a: (f) => ({
      en: `Free private parking on the gated driveway. Interhome lists ${f.parkingSplit('en')}. The total for your group: ask us.`,
      de: `Kostenlose Privatparkplätze in der Einfahrt hinter dem Tor. Interhome nennt ${f.parkingSplit('de')}. Die Gesamtzahl für Ihre Gruppe: auf Anfrage.`,
      sl: `Brezplačno zasebno parkirišče na dvorišču za vrati. Interhome navaja ${f.parkingSplit('sl')}. Skupno število za vašo skupino: vprašajte nas.`,
      hr: `Besplatan privatni parking na dvorištu iza kapije. Interhome navodi ${f.parkingSplit('hr')}. Ukupan broj za vašu grupu: pitajte nas.`,
      it: `Parcheggio privato gratuito nel vialetto chiuso da un cancello. Interhome indica ${f.parkingSplit('it')}. Il totale per il vostro gruppo: chiedeteci.`,
    }),
    todo: 'total parking spaces for a whole-house stay',
    listing: true,
  },
  {
    match: /Airport transfer/i,
    status: 'partial',
    q: { en: 'How does the team get here from the airport?', de: 'Wie kommt das Team vom Flughafen her?', sl: 'Kako pride ekipa z letališča?', hr: 'Kako tim stiže iz zračne luke?', it: 'Come arriva il team dall’aeroporto?' },
    a: (f) => ({
      en: `About ${f.airportRange} min by car from Zadar Airport (ZAD). The airport shuttle only goes to Zadar bus station; from there Liburnija buses run to Privlaka. A minibus for the whole group: ask us.`,
      de: `Ca. ${f.airportRange} Min. mit dem Auto vom Flughafen Zadar (ZAD). Der Flughafenbus fährt nur bis zum Busbahnhof Zadar; von dort fahren Liburnija-Busse nach Privlaka. Ein Kleinbus für die Gruppe: auf Anfrage.`,
      sl: `Približno ${f.airportRange} min z avtom od letališča Zadar (ZAD). Letališki avtobus vozi le do avtobusne postaje Zadar; od tam vozijo avtobusi Liburnija v Privlako. Minibus za vso skupino: vprašajte nas.`,
      hr: `Oko ${f.airportRange} min autom od Zračne luke Zadar (ZAD). Autobus iz zračne luke vozi samo do autobusnog kolodvora Zadar; odande autobusi Liburnije voze do Privlake. Minibus za cijelu grupu: pitajte nas.`,
      it: `Circa ${f.airportRange} min in auto dall’aeroporto di Zadar (ZAD). La navetta dell’aeroporto arriva solo alla stazione degli autobus di Zadar; da lì gli autobus Liburnija proseguono per Privlaka. Un minibus per tutto il gruppo: chiedeteci.`,
    }),
    todo: 'licensed minibus partner',
  },
  {
    match: /Quiet hours/i,
    status: 'partial',
    q: { en: 'Can we have a late team dinner?', de: 'Dürfen wir lange gemeinsam essen?', sl: 'Ali lahko imamo pozno ekipno večerjo?', hr: 'Možemo li imati kasnu timsku večeru?', it: 'Possiamo fare una cena di team fino a tardi?' },
    a: () => ({
      en: 'The house is on a quiet residential lane, and our platform listings say no parties or events. A long dinner at the grill: ask us what works with the neighbours.',
      de: 'Das Haus liegt in einer ruhigen Wohnstraße, und unsere Plattform-Inserate schließen Partys und Events aus. Ein langes Abendessen am Grill: fragen Sie uns, was mit den Nachbarn passt.',
      sl: 'Hiša stoji v mirni stanovanjski ulici, naši oglasi na platformah pa ne dovoljujejo zabav ali dogodkov. Dolga večerja ob žaru: vprašajte nas, kaj je sprejemljivo za sosede.',
      hr: 'Kuća je u mirnoj stambenoj ulici, a naši oglasi na platformama ne dopuštaju zabave ni događanja. Duga večera uz roštilj: pitajte nas što je u redu sa susjedima.',
      it: 'La casa si trova in una tranquilla stradina residenziale e i nostri annunci sulle piattaforme escludono feste ed eventi. Una lunga cena al barbecue: chiedeteci cosa va bene con i vicini.',
    }),
    todo: 'quiet hours, late dinners',
    listing: true,
  },
  {
    match: /Off-season prices/i,
    status: 'ask',
    q: { en: 'Prices, minimum stay and cancellation?', de: 'Preise, Mindestaufenthalt und Storno?', sl: 'Cene, minimalno bivanje in odpoved?', hr: 'Cijene, minimalni boravak i otkazivanje?', it: 'Prezzi, soggiorno minimo e cancellazione?' },
    a: () => ({
      en: 'Whole-house prices, minimum stay and cancellation terms for your dates come with the proposal.',
      de: 'Preise für das ganze Haus, Mindestaufenthalt und Stornobedingungen für Ihre Termine erhalten Sie mit dem Angebot.',
      sl: 'Cene za celo hišo, minimalno bivanje in odpovedne pogoje za vaše termine prejmete s ponudbo.',
      hr: 'Cijene za cijelu kuću, minimalni boravak i uvjete otkazivanja za vaše termine dobivate uz ponudu.',
      it: 'Prezzi per tutta la casa, soggiorno minimo e condizioni di cancellazione per le vostre date arrivano con la proposta.',
    }),
    todo: 'whole-house off-season price, min stay, cancellation',
  },
  {
    match: /Step-free/i,
    status: 'partial',
    q: { en: 'Is there step-free access?', de: 'Gibt es einen stufenlosen Zugang?', sl: 'Ali je dostop brez stopnic?', hr: 'Postoji li pristup bez stepenica?', it: 'C’è un accesso senza gradini?' },
    a: () => ({
      en: 'Apartment 1 is on the ground floor, a few steps up from the garden, so not fully step-free. The others are upstairs. Ask us for details.',
      de: 'Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Garten, also nicht ganz stufenlos. Die anderen liegen oben. Details auf Anfrage.',
      sl: 'Apartma 1 je v pritličju, nekaj stopnic nad vrtom, zato ni povsem brez stopnic. Ostali so v nadstropju. Za podrobnosti nas vprašajte.',
      hr: 'Apartman 1 je u prizemlju, nekoliko stepenica iznad vrta, pa nije potpuno bez stepenica. Ostali su na katu. Za detalje nas pitajte.',
      it: 'L’appartamento 1 è al piano terra, qualche gradino sopra il giardino, quindi non del tutto senza gradini. Gli altri sono al piano di sopra. Chiedeteci i dettagli.',
    }),
    todo: 'number of steps to Apartment 1',
  },
  {
    match: /pharmacy/i,
    status: 'yes',
    q: { en: 'How far are the shops, the doctor, Nin and Zadar?', de: 'Wie weit sind Geschäfte, Arzt, Nin und Zadar?', sl: 'Kako daleč so trgovine, zdravnik, Nin in Zadar?', hr: 'Koliko su udaljeni dućani, liječnik, Nin i Zadar?', it: 'Quanto distano negozi, medico, Nin e Zadar?' },
    a: (f) => ({
      en: `By car: ${f.drives('en')}. Supermarket ${f.near.shop} on foot; pharmacy and GP in Nin ≈ ${f.near.pharmacy}; hospital in Zadar ≈ ${f.near.hospital}.`,
      de: `Mit dem Auto: ${f.drives('de')}. Supermarkt ${f.near.shop} zu Fuß; Apotheke und Hausarzt in Nin ≈ ${f.near.pharmacy}; Krankenhaus in Zadar ≈ ${f.near.hospital}.`,
      sl: `Z avtom: ${f.drives('sl')}. Supermarket ${f.near.shop} peš; lekarna in splošni zdravnik v Ninu ≈ ${f.near.pharmacy}; bolnišnica v Zadru ≈ ${f.near.hospital}.`,
      hr: `Autom: ${f.drives('hr')}. Supermarket ${f.near.shop} pješice; ljekarna i liječnik opće prakse u Ninu ≈ ${f.near.pharmacy}; bolnica u Zadru ≈ ${f.near.hospital}.`,
      it: `In auto: ${f.drives('it')}. Supermercato ${f.near.shop} a piedi; farmacia e medico di base a Nin ≈ ${f.near.pharmacy}; ospedale a Zadar ≈ ${f.near.hospital}.`,
    }),
  },
  {
    match: /book on the team/i,
    status: 'ask',
    q: { en: 'Can you book activities for us?', de: 'Buchen Sie Aktivitäten für uns?', sl: 'Ali lahko za nas rezervirate aktivnosti?', hr: 'Možete li rezervirati aktivnosti za nas?', it: 'Potete prenotare le attività per noi?' },
    a: () => ({
      en: 'Tell us what you would like from the list above and we will tell you what we can arrange.',
      de: 'Sagen Sie uns, was Sie aus der Liste oben interessiert, und wir sagen Ihnen, was wir organisieren können.',
      sl: 'Povejte nam, kaj vas zanima s seznama zgoraj, in povedali vam bomo, kaj lahko uredimo.',
      hr: 'Recite nam što vas zanima s gornjeg popisa, a mi ćemo vam reći što možemo organizirati.',
      it: 'Diteci cosa vi interessa nell’elenco qui sopra e vi diremo cosa possiamo organizzare.',
    }),
    todo: 'which activities the owner books, commission',
  },
];

// Guest-facing wording for research invoicingAndTax facts, matched by content.
const INVOICE = [
  {
    match: /VAT rate is 25/i,
    en: 'Croatian VAT is 25 %; accommodation is taxed at the reduced rate of 13 %.',
    de: 'Die kroatische MwSt. beträgt 25 %; Unterkünfte werden mit dem ermäßigten Satz von 13 % besteuert.',
    sl: 'Hrvaški DDV znaša 25 %; nastanitev je obdavčena po znižani stopnji 13 %.',
    hr: 'Hrvatski PDV iznosi 25 %; smještaj se oporezuje sniženom stopom od 13 %.',
    it: 'L’IVA croata è del 25 %; l’alloggio è tassato con l’aliquota ridotta del 13 %.',
  },
  {
    match: /R-1/i,
    en: 'Croatian companies usually ask for an “R1 račun”: an invoice with VAT shown separately, made out to the company name and OIB, so the VAT can be deducted.',
    de: 'Kroatische Firmen verlangen meist eine „R1 račun“: eine Rechnung mit separat ausgewiesener MwSt. auf Firmenname und OIB, damit die Vorsteuer abziehbar ist.',
    sl: 'Hrvaška podjetja običajno zahtevajo »R1 račun«: račun z ločeno izkazanim DDV, izstavljen na ime podjetja in OIB, da lahko DDV odbijejo.',
    hr: 'Hrvatske tvrtke obično traže „R1 račun”: račun s posebno iskazanim PDV-om, izdan na naziv tvrtke i OIB, kako bi mogle odbiti pretporez.',
    it: 'Le aziende croate di solito chiedono una «R1 račun»: una fattura con IVA esposta separatamente, intestata alla ragione sociale e all’OIB, così da poter detrarre l’IVA.',
  },
  {
    match: /eRačun/i,
    en: 'Since 1 January 2026, VAT-registered businesses in Croatia exchange domestic B2B invoices as structured e-invoices (eRačun).',
    de: 'Seit 1. Januar 2026 tauschen umsatzsteuerpflichtige Firmen in Kroatien Inlandsrechnungen als strukturierte E-Rechnung (eRačun) aus.',
    sl: 'Od 1. januarja 2026 si zavezanci za DDV na Hrvaškem domače račune B2B izmenjujejo kot strukturirane e-račune (eRačun).',
    hr: 'Od 1. siječnja 2026. obveznici PDV-a u Hrvatskoj domaće B2B račune razmjenjuju kao strukturirane e-račune (eRačun).',
    it: 'Dal 1° gennaio 2026 le imprese croate soggette a IVA si scambiano le fatture B2B nazionali come fatture elettroniche strutturate (eRačun).',
  },
  {
    match: /Foreign/i,
    en: 'Companies from outside Croatia cannot deduct Croatian VAT in their home return; they reclaim it through the EU VAT refund procedure, which needs an invoice showing the supplier’s Croatian VAT number.',
    de: 'Firmen außerhalb Kroatiens können kroatische MwSt. nicht in der eigenen Erklärung abziehen; sie erstatten sie über das EU-Vorsteuervergütungsverfahren, das eine Rechnung mit kroatischer USt-Nummer des Anbieters erfordert.',
    sl: 'Podjetja zunaj Hrvaške hrvaškega DDV ne morejo odbiti v domačem obračunu; povrnejo ga po postopku vračila DDV v EU, za kar potrebujejo račun s hrvaško identifikacijsko številko za DDV dobavitelja.',
    hr: 'Tvrtke izvan Hrvatske ne mogu odbiti hrvatski PDV u svojoj domaćoj prijavi; povrat ostvaruju kroz EU postupak povrata PDV-a, za koji je potreban račun s hrvatskim PDV identifikacijskim brojem dobavljača.',
    it: 'Le aziende con sede fuori dalla Croazia non possono detrarre l’IVA croata nella propria dichiarazione; la recuperano con la procedura UE di rimborso IVA, che richiede una fattura con il numero di partita IVA croato del fornitore.',
  },
  {
    match: /flat-rate/i,
    en: 'A host outside the VAT system issues invoices without VAT: a valid expense receipt, but no VAT to reclaim. Check the details with your accountant.',
    de: 'Ein Gastgeber ohne MwSt.-Pflicht stellt Rechnungen ohne MwSt. aus: ein gültiger Beleg, aber keine Vorsteuer. Details bitte mit Ihrer Buchhaltung klären.',
    sl: 'Gostitelj zunaj sistema DDV izstavlja račune brez DDV: veljavno dokazilo o strošku, a brez DDV za vračilo. Podrobnosti preverite pri svojem računovodji.',
    hr: 'Domaćin izvan sustava PDV-a izdaje račune bez PDV-a: valjan dokaz troška, ali bez PDV-a za povrat. Detalje provjerite sa svojim računovođom.',
    it: 'Un host fuori dal regime IVA emette fatture senza IVA: un giustificativo di spesa valido, ma senza IVA da recuperare. Verificate i dettagli con il vostro commercialista.',
  },
  {
    match: /tourist tax/i,
    en: 'Tourist tax is charged per person and night and set locally; the 2026 amount for Privlaka is not confirmed yet.',
    de: 'Die Kurtaxe wird pro Person und Nacht lokal festgelegt; der Betrag 2026 für Privlaka ist noch nicht bestätigt.',
    sl: 'Turistična taksa se obračuna na osebo in noč ter se določi lokalno; znesek za Privlako v 2026 še ni potrjen.',
    hr: 'Boravišna pristojba naplaćuje se po osobi i noćenju i određuje se lokalno; iznos za Privlaku u 2026. još nije potvrđen.',
    it: 'La tassa di soggiorno si paga per persona e per notte ed è stabilita localmente; l’importo 2026 per Privlaka non è ancora confermato.',
  },
];

// Guest-facing wording for offSeason advantages, matched by content.
const ADVANTAGES = [
  {
    match: /Paklenica/i,
    icon: 'mountain',
    en: 'Paklenica National Park: adult day ticket €8 in March, April and October instead of €10 in summer (2026 price list).',
    de: 'Nationalpark Paklenica: Tageskarte für Erwachsene 8 € im März, April und Oktober statt 10 € im Sommer (Preisliste 2026).',
    sl: 'Narodni park Paklenica: dnevna vstopnica za odrasle 8 € marca, aprila in oktobra namesto 10 € poleti (cenik 2026).',
    hr: 'Nacionalni park Paklenica: dnevna ulaznica za odrasle 8 € u ožujku, travnju i listopadu umjesto 10 € ljeti (cjenik za 2026.).',
    it: 'Parco nazionale di Paklenica: biglietto giornaliero adulti 8 € a marzo, aprile e ottobre invece di 10 € in estate (listino 2026).',
  },
  {
    match: /Big-raft/i,
    icon: 'wave',
    en: 'Big rafts on the Zrmanja run when the water is high, usually October to May; summer is kayak season.',
    de: 'Große Raftingboote fahren auf der Zrmanja bei hohem Wasserstand, meist Oktober bis Mai; im Sommer wird Kajak gefahren.',
    sl: 'Veliki rafting čolni se po Zrmanji spuščajo ob visokem vodostaju, običajno od oktobra do maja; poletje je sezona kajakov.',
    hr: 'Veliki raftovi na Zrmanji voze kad je vodostaj visok, obično od listopada do svibnja; ljeto je sezona kajaka.',
    it: 'I gommoni grandi da rafting scendono la Zrmanja quando l’acqua è alta, di solito da ottobre a maggio; l’estate è la stagione del kayak.',
  },
  {
    match: /6-day/i,
    icon: 'calendar',
    en: 'Riva Rafting Centar sells its 6-day “From the Sea to Velebit” active package only in April, September and October.',
    de: 'Riva Rafting Centar bietet das 6-tägige Aktivpaket „Vom Meer zum Velebit“ nur im April, September und Oktober an.',
    sl: 'Riva Rafting Centar svoj 6-dnevni aktivni paket »Od morja do Velebita« prodaja le aprila, septembra in oktobra.',
    hr: 'Riva Rafting Centar svoj 6-dnevni aktivni paket „Od mora do Velebita” nudi samo u travnju, rujnu i listopadu.',
    it: 'Riva Rafting Centar vende il pacchetto attivo di 6 giorni «Dal mare al Velebit» solo ad aprile, settembre e ottobre.',
  },
  {
    match: /kite school/i,
    icon: 'kite',
    en: 'The Nin kite school runs from May to late October.',
    de: 'Die Kiteschule in Nin ist von Mai bis Ende Oktober geöffnet.',
    sl: 'Šola kajtanja v Ninu deluje od maja do konca oktobra.',
    hr: 'Kite škola u Ninu radi od svibnja do kraja listopada.',
    it: 'La scuola di kite di Nin è aperta da maggio a fine ottobre.',
  },
  {
    match: /Pag/i,
    icon: 'sun',
    en: 'Pag’s lunar karst is best walked in March to May; in summer the shadeless trails pass 30 °C.',
    de: 'Pags Mondlandschaft erwandert man am besten von März bis Mai; im Sommer wird es auf den schattenlosen Wegen über 30 °C heiß.',
    sl: 'Lunarni kras na Pagu je najlepše prehoditi od marca do maja; poleti se na poteh brez sence temperatura povzpne čez 30 °C.',
    hr: 'Paški mjesečev krš najbolje je obići pješice od ožujka do svibnja; ljeti na stazama bez hlada temperatura prelazi 30 °C.',
    it: 'Il carso lunare di Pag si percorre meglio da marzo a maggio; d’estate sui sentieri senz’ombra si superano i 30 °C.',
  },
  {
    match: /Solana/i,
    icon: 'info',
    en: 'Good to know: the free Solana Nin salt-pan tours run only on Open Days, June to September.',
    de: 'Gut zu wissen: Die kostenlosen Führungen in der Saline Nin gibt es nur an den Open Days, Juni bis September.',
    sl: 'Dobro je vedeti: brezplačni ogledi Solane Nin so le ob dnevih odprtih vrat, od junija do septembra.',
    hr: 'Dobro je znati: besplatne ture Solanom Nin održavaju se samo na Dane otvorenih vrata, od lipnja do rujna.',
    it: 'Buono a sapersi: le visite gratuite alle saline di Solana Nin si svolgono solo negli Open Days, da giugno a settembre.',
  },
  {
    match: /Airport/i,
    icon: 'plane',
    en: 'Zadar Airport’s summer schedule starts at the end of March, so direct flights already run for April retreats.',
    de: 'Der Sommerflugplan in Zadar beginnt Ende März, Direktflüge gibt es also schon für Retreats im April.',
    sl: 'Poletni vozni red letališča Zadar se začne konec marca, zato so direktni leti na voljo že za retreate aprila.',
    hr: 'Ljetni red letenja Zračne luke Zadar počinje krajem ožujka, pa izravni letovi postoje već za retreate u travnju.',
    it: 'L’orario estivo dell’aeroporto di Zadar parte a fine marzo, quindi i voli diretti ci sono già per i ritiri di aprile.',
  },
];

// Words for the parking split sentence (facts come from listing.json).
// sp: the noun "parking space" by plural form; "one"/"many" are templates.
const PARKING_WORDS = {
  en: { one: '{n} {sp} for Apartment {a}', many: '{n} {sp} {each} for Apartments {a}', each: 'each', sp: { one: 'space', other: 'spaces' }, and: 'and', total: '{n} in all' },
  de: { one: '{n} {sp} für Apartment {a}', many: '{each} {n} {sp} für die Apartments {a}', each: 'je', sp: { one: 'Stellplatz', other: 'Stellplätze' }, and: 'und', total: 'insgesamt {n}' },
  sl: { one: '{n} {sp} za apartma {a}', many: '{each} {n} {sp} za apartmaje {a}', each: 'po', sp: { one: 'parkirno mesto', two: 'parkirni mesti', few: 'parkirna mesta', other: 'parkirnih mest' }, and: 'in', total: 'skupaj {n}' },
  hr: { one: '{n} {sp} za apartman {a}', many: '{each} {n} {sp} za apartmane {a}', each: 'po', sp: { one: 'parkirno mjesto', few: 'parkirna mjesta', other: 'parkirnih mjesta' }, and: 'i', total: 'ukupno {n}' },
  it: { one: '{n} {sp} per l’appartamento {a}', many: '{n} {sp} {each} per gli appartamenti {a}', each: 'ciascuno', sp: { one: 'posto auto', other: 'posti auto' }, and: 'e', total: '{n} in tutto' },
};
// Zadar Airport in the "By car: …" drive list.
const AIRPORT_NAME = { en: 'Zadar Airport (ZAD)', de: 'Flughafen Zadar (ZAD)', sl: 'letališče Zadar (ZAD)', hr: 'Zračna luka Zadar (ZAD)', it: 'aeroporto di Zadar (ZAD)' };

const SHOULDER = new Set([4, 5, 6, 9, 10]);

// ---------------------------------------------------------------------------
// Capacity, derived from site.js
// ---------------------------------------------------------------------------
const UNITS = APARTMENTS.map((a) => ({
  id: a.id,
  number: a.number,
  name: a.name,
  color: a.color,
  bedrooms: a.bedrooms || 0,
  sofas: (a.beds || []).filter((b) => /sofa/i.test(b.en)).length,
}));
const BEDROOMS = UNITS.reduce((s, u) => s + u.bedrooms, 0);
const SOFAS = UNITS.reduce((s, u) => s + u.sofas, 0);
const MAX_GUESTS = APARTMENTS.reduce((s, a) => s + (a.maxGuests || 0), 0);
const OWN_BEDS = BEDROOMS + SOFAS;
const TEAM_MIN = 2;
const TEAM_MAX = 30;

// Planner state survives a re-render (month change) within the page session.
const memo = { team: 10, mode: 'share', agenda: null, cat: 'all', leads: false, all: false };
const ACT_FIRST = { desktop: 6, mobile: 3 };
// Phones: fewer activity cards, checklist answers and the off-season box start closed.
const MOBILE_Q = '(max-width: 760px)';
const isMobile = () => matchMedia(MOBILE_Q).matches;

// A translation is a template string, or a function of the values when it needs plural forms.
const fill = (s, vars) => (typeof s === 'function' ? s(vars) : String(s).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`)));
const tt = (ctx, entry, vars = {}) => fill(ctx.t(entry), vars);
// Research text (agendas, activity descriptions) is English only; mark it so.
const enLang = (ctx) => (ctx.lang === 'en' ? '' : ' lang="en"');
// Companies vs other groups (field trips also show this section).
const isCompany = (ctx) => (ctx.audience.inquiry?.purpose || 'retreat') === 'retreat';
const purposeOf = (ctx) => ctx.audience.inquiry?.purpose || 'retreat';
// One airport figure for the whole page: a 5-minute band around the drive time.
const minuteBand = (min) => {
  const lo = Math.floor(min / 5) * 5;
  return `${lo}–${lo + 5}`;
};
// Road distance and minutes from research text such as "88.7 km, about 1 h 42 min"
// or "about 21 km, about 27-30 min"; null when the text has no drive time.
function parseDrive(text) {
  if (!text) return null;
  const t = String(text);
  const m = t.match(/about (?:(\d+) h )?(\d+)(?:[-–](\d+))? min/) || t.match(/(?:(\d+) h )?(\d+)(?:[-–](\d+))? min/);
  if (!m) return null;
  const km = t.match(/(\d+(?:\.\d+)?) km/);
  return { km: km ? Number(km[1]) : null, min: Number(m[1] || 0) * 60 + Number(m[2]), max: m[3] ? Number(m[3]) : null };
}

// Bed slots in fill order: one person per bedroom first. Own bed: then one per
// sofa bed. Sharing: a second person in each bedroom before any sofa bed is
// used, so the living rooms stay free as breakouts as long as possible.
function allocate(n, mode) {
  const slots = [];
  for (const u of UNITS) {
    for (let i = 0; i < u.bedrooms; i++) slots.push({ unit: u.id, kind: 'bedroom', i, people: 0 });
    for (let i = 0; i < u.sofas; i++) slots.push({ unit: u.id, kind: 'sofa', i, people: 0 });
  }
  const bedrooms = slots.filter((s) => s.kind === 'bedroom');
  const sofas = slots.filter((s) => s.kind === 'sofa');
  const order = mode === 'share' ? [...bedrooms, ...bedrooms, ...sofas, ...sofas] : [...bedrooms, ...sofas];
  let left = n;
  for (const s of order) {
    if (!left) break;
    s.people += 1;
    left -= 1;
  }
  const ownRoom = slots.filter((s) => s.kind === 'bedroom' && s.people === 1).length;
  const soloSofa = slots.filter((s) => s.kind === 'sofa' && s.people === 1).length;
  const shared = slots.filter((s) => s.people === 2).length * 2;
  return { slots, ownRoom, soloSofa, shared, over: left, cap: mode === 'share' ? MAX_GUESTS : OWN_BEDS };
}

function person(filled, color) {
  return `<svg class="rt-person${filled ? ' is-filled' : ''}" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" style="${filled ? `color:${color}` : ''}"><circle cx="8" cy="4.6" r="3"/><path d="M2.4 15.2a5.6 5.6 0 0 1 11.2 0z"/></svg>`;
}

function plannerUnitsHtml(ctx, plan, mode) {
  const t = ctx.t;
  const perBed = mode === 'share' ? 2 : 1;
  return UNITS.map((u) => {
    const slots = plan.slots.filter((s) => s.unit === u.id);
    const used = slots.reduce((s, x) => s + x.people, 0);
    return `
    <li class="rt-unit${used ? ' is-used' : ''}" style="--c:${u.color}">
      <div class="rt-unit-head">
        <span class="rt-unit-num" aria-hidden="true">${u.number}</span>
        <span class="rt-unit-name">${esc(t(u.name))}</span>
        <span class="rt-unit-count">${used}/${slots.length * perBed}<span class="visually-hidden"> ${esc(t(L.places))}</span></span>
      </div>
      <ul class="rt-beds">
        ${slots
          .map((s) => {
            const label = s.kind === 'bedroom' ? `${t(L.bedroom)}${u.bedrooms > 1 ? ` ${s.i + 1}` : ''}` : t(L.sofa);
            const sub = s.kind === 'bedroom' ? t(L.bed180) : t(L.sofaWhere);
            const state = `${s.people}/${perBed} ${t(L.taken)}`;
            return `<li class="rt-bed rt-bed-${s.kind}${s.people ? ' is-filled' : ''}">
              <span class="rt-bed-icon">${icon('bed', { size: 20 })}</span>
              <span class="rt-bed-text"><b>${esc(label)}</b><small>${esc(sub)}</small></span>
              <span class="rt-bed-people" role="img" aria-label="${esc(state)}">${person(s.people >= 1, u.color)}${perBed === 2 ? person(s.people >= 2, u.color) : ''}</span>
            </li>`;
          })
          .join('')}
      </ul>
    </li>`;
  }).join('');
}

function plannerSummaryHtml(ctx, plan, n, mode) {
  const lines = [];
  if (plan.ownRoom) lines.push(tt(ctx, L.sumOwnRoom, { n: plan.ownRoom }));
  if (plan.soloSofa) lines.push(tt(ctx, L.sumSofa, { n: plan.soloSofa }));
  if (plan.shared) lines.push(tt(ctx, L.sumShared, { n: plan.shared }));
  if (plan.over) lines.push(tt(ctx, L.sumOver, { n: plan.over }));
  let status;
  if (plan.over) {
    const opts = [
      mode === 'own' && n <= MAX_GUESTS
        ? `<li>${esc(tt(ctx, L.optShare, { cap: MAX_GUESTS }))} <button type="button" class="btn btn-small rt-tap" data-mode-switch="share">${esc(ctx.t(L.optSwitch))}</button></li>`
        : '',
      `<li>${esc(ctx.t(L.optWaves))}</li>`,
      `<li>${esc(ctx.t(L.optOverflow))}</li>`,
    ].join('');
    status = `<div class="rt-status is-over" role="status">
      <strong>${icon('info', { size: 20 })}${esc(ctx.t(L.over))}</strong>
      <p>${esc(tt(ctx, mode === 'own' ? L.overOwn : L.overShare, { cap: plan.cap }))}</p>
      <ul>${opts}</ul>
    </div>`;
  } else if (mode === 'own' && plan.soloSofa) {
    status = `<div class="rt-status is-tight"><strong>${icon('info', { size: 20 })}${esc(ctx.t(L.tight))}</strong>
      <p>${esc(tt(ctx, plan.soloSofa === 1 ? L.tightText1 : L.tightText, { r: BEDROOMS, s: plan.soloSofa }))}</p></div>`;
  } else {
    status = `<div class="rt-status is-ok"><strong>${icon('check', { size: 20 })}${esc(ctx.t(L.fits))}</strong>
      <p>${esc(tt(ctx, L.fitsText, { n }))}</p></div>`;
  }
  const total = (mode === 'share' ? MAX_GUESTS : OWN_BEDS);
  const pct = Math.min(100, (Math.min(n, total) / total) * 100);
  return `
    ${status}
    <div class="rt-meter-wrap">
      <span class="rt-meter-label">${esc(tt(ctx, mode === 'share' ? L.bedsUsedShare : L.bedsUsed, { n: Math.min(n, total), total }))}</span>
      <div class="rt-meter" aria-hidden="true"><span style="width:${pct}%"></span></div>
    </div>
    <ul class="rt-sum">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
}

function plannerHtml(ctx) {
  const t = ctx.t;
  const plan = allocate(memo.team, memo.mode);
  return `
  <div class="rt-planner" id="retreat-planner">
    <div class="rt-planner-controls">
      <h3>${esc(t(L.plannerTitle))}</h3>
      <p class="muted">${esc(t(L.plannerLede))}</p>
      <div class="field">
        <label for="rt-team">${esc(t(L.teamSize))}</label>
        <div class="rt-stepper">
          <button type="button" class="btn rt-step" data-step="-1" aria-label="${esc(t(L.fewer))}" aria-controls="rt-team">−</button>
          <input id="rt-team" type="number" inputmode="numeric" min="${TEAM_MIN}" max="${TEAM_MAX}" value="${memo.team}" />
          <button type="button" class="btn rt-step" data-step="1" aria-label="${esc(t(L.more))}" aria-controls="rt-team">+</button>
          <span class="rt-step-unit">${esc(t(L.people))}</span>
        </div>
      </div>
      <fieldset class="rt-modes">
        <legend>${esc(t(L.modeLabel))}</legend>
        ${[
          ['own', L.modeOwn],
          ['share', L.modeShare],
        ]
          .map(
            ([id, label]) => `<label class="rt-mode"><input type="radio" name="rt-mode" value="${id}" ${memo.mode === id ? 'checked' : ''} /><span>${esc(t(label))}</span></label>`,
          )
          .join('')}
      </fieldset>
      <div class="rt-summary" data-summary aria-live="polite">${plannerSummaryHtml(ctx, plan, memo.team, memo.mode)}</div>
      <button type="button" class="btn btn-primary" data-ask-plan>${icon('chat', { size: 18 })}${esc(t(L.askPlan))}</button>
      <p class="source-note">${esc(t(L.plannerNote))}</p>
    </div>
    <ul class="rt-units" data-units>${plannerUnitsHtml(ctx, plan, memo.mode)}</ul>
  </div>`;
}

function introHtml(ctx) {
  const t = ctx.t;
  const company = isCompany(ctx);
  const garden = ctx.site.shared.some((s) => s.id === 'garden') && ctx.site.shared.some((s) => s.id === 'grill');
  const airportMin = minuteBand(travelMinutes(airportKm(), 'car'));
  const stats = [
    ['cube', APARTMENTS.length, L.statApts],
    ['bed', BEDROOMS, L.statBedrooms],
    ['users', MAX_GUESTS, L.statGuests],
    ['plane', `<span data-airport-min>${airportMin}</span>`, L.statAirport, true],
  ];
  return `
  <div class="rt-intro">
    <div class="rt-intro-text">
      <header class="section-head">
        <span class="eyebrow">${icon(company ? 'laptop' : 'users', { size: 16 })}${esc(t(company ? L.eyebrow : L.groupEyebrow))}</span>
        <h2>${esc(t(company ? L.title : L.groupTitle))}</h2>
        <p class="lede">${esc(t(company ? L.lede : L.groupLede))}</p>
      </header>
      <dl class="rt-stats">
        ${stats
          .map(([ic, v, label, raw]) => `<div class="rt-stat"><dt>${esc(tt(ctx, label, { n: v }))}</dt><dd>${icon(ic, { size: 22 })}<b>${raw ? v : esc(v)}</b></dd></div>`)
          .join('')}
        ${garden ? `<div class="rt-stat rt-stat-wide"><dt class="visually-hidden">${esc(t(L.statGarden))}</dt><dd>${icon('grill', { size: 22 })}<span>${esc(t(L.statGarden))}</span></dd></div>` : ''}
      </dl>
      <div class="row">
        <button type="button" class="btn btn-accent btn-lg" data-proposal>${icon('mail', { size: 18 })}${esc(t(company ? L.ctaProposal : L.groupCtaProposal))}</button>
        <a class="btn btn-lg" href="#retreat-planner">${icon('bed', { size: 18 })}${esc(t(L.ctaPlanner))}</a>
      </div>
    </div>
    <figure class="rt-intro-media">
      <img class="rt-photo-main" src="${photo('app1-terrace.jpg', 'web')}" srcset="${photo('app1-terrace.jpg', 'thumb')} 480w, ${photo('app1-terrace.jpg', 'web')} 1600w" sizes="(max-width: 900px) 100vw, 46vw" alt="${esc(t(L.photoAlt))}" loading="lazy" decoding="async" />
      <img class="rt-photo-inset" src="${photo('grillarea.jpg', 'thumb')}" alt="${esc(t(L.photoAlt2))}" loading="lazy" decoding="async" />
    </figure>
  </div>`;
}

// ---------------------------------------------------------------------------
// Data-driven parts (painted in mount)
// ---------------------------------------------------------------------------
function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function sourcesHtml(ctx, urls, extra = '') {
  const list = [...new Set(urls || [])];
  if (!list.length) return '';
  return `<details class="rt-sources"><summary>${icon('info', { size: 16 })}${esc(ctx.t(L.sources))} (${list.length})</summary>
    ${extra}<ul>${list.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(hostname(u))}</a></li>`).join('')}</ul></details>`;
}

// Compact numbered source links for short facts.
function sourceChips(ctx, urls) {
  const list = [...new Set(urls || [])];
  if (!list.length) return '';
  return `<span class="rt-chipsrc">${list
    .map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener" title="${esc(hostname(u))}" aria-label="${esc(ctx.t(L.sources))} ${i + 1}: ${esc(hostname(u))}">${i + 1}</a>`)
    .join('')}</span>`;
}

// The step text decides the kind first; the referenced item only fills in.
function blockKind(text, item) {
  if (/^(Drive|Transfer|Arriv)/i.test(text)) return 'travel';
  if (/\b(lunch|dinner|BBQ|picnic)\b/i.test(text)) return 'food';
  if (/^Unstructured/i.test(text) || !item) return 'free';
  if (item.category === 'workspace') return 'work';
  if (item.category === 'catering') return 'food';
  if (item.category === 'transport') return 'travel';
  return 'activity';
}

function blockOperator(text, item, kind) {
  if (!item || kind === 'travel' || item.category === 'transport' || item.confidence === 'low') return null;
  const re = LINK_MATCH[item.id];
  if (!re || !re.test(text)) return null;
  return (item.operators || []).find((o) => o.url) || null;
}
const KIND = {
  work: { icon: 'laptop', label: L.kindWork },
  food: { icon: 'grill', label: L.kindFood },
  activity: { icon: 'star', label: L.kindActivity },
  travel: { icon: 'car', label: L.kindTravel },
  free: { icon: 'sun', label: L.kindFree },
};

function agendaMeta(a) {
  return AGENDA_META[a.id] || { months: [], icon: 'calendar', title: { en: a.title }, who: { en: a.season } };
}

function dayBlocksHtml(ctx, day, items) {
  const t = ctx.t;
  const linked = new Set();
  return day.blocks
    .map((b) => {
      const item = b.itemRef ? items.get(b.itemRef) : null;
      const kind = blockKind(b.activity, item);
      let op = blockOperator(b.activity, item, kind);
      if (op && linked.has(op.url)) op = null;
      if (op) linked.add(op.url);
      return `<li class="rt-block rt-k-${kind}">
        <span class="rt-block-dot" aria-hidden="true">${icon(KIND[kind].icon, { size: 14 })}</span>
        <span class="rt-block-time"><span class="visually-hidden">${esc(t(KIND[kind].label))}, </span>${esc(b.time.replace('-', '–'))}</span>
        <span class="rt-block-text"${enLang(ctx)}>${esc(b.activity)}${op ? ` <a class="rt-op" href="${esc(op.url)}" target="_blank" rel="noopener">${esc(op.name.replace(/\s*\(.*\)$/, ''))}<span aria-hidden="true"> ↗</span></a>` : ''}</span>
      </li>`;
    })
    .join('');
}

function agendaPanelHtml(ctx, a, items) {
  const t = ctx.t;
  return `
    <div class="rt-agenda-top">
      <p class="rt-agenda-season">${icon('calendar', { size: 18 })}<span${enLang(ctx)}>${esc(a.season)}</span></p>
      <button type="button" class="btn btn-primary" data-customise="${esc(a.id)}">${icon('chat', { size: 18 })}${esc(t(L.customise))}</button>
    </div>
    <ol class="rt-days" style="--days:${a.days.length}">
      ${a.days
        .map(
          (d) => `<li class="rt-day">
          <h4><span class="rt-day-num">${esc(t(L.day))} ${d.day}</span><span${enLang(ctx)}>${esc(d.theme)}</span></h4>
          <ol class="rt-blocks">${dayBlocksHtml(ctx, d, items)}</ol>
        </li>`,
        )
        .join('')}
    </ol>`;
}

function agendasHtml(ctx, data, items) {
  const t = ctx.t;
  const month = ctx.state.month;
  const agendas = data.sampleAgendas || [];
  if (!agendas.length) return '';
  const fallback = agendas.find((a) => month && agendaMeta(a).months.includes(month))?.id || agendas[0].id;
  const active = agendas.some((a) => a.id === memo.agenda) ? memo.agenda : fallback;
  memo.agenda = active;
  return `
  <header class="section-head">
      <span class="eyebrow">${icon('calendar', { size: 16 })}${esc(t(L.agendaEyebrow))}</span>
      <h3 class="rt-h">${esc(t(L.agendaTitle))}</h3>
      <p class="lede">${esc(t(L.agendaLede))} ${esc(t(L.agendaLang))}</p>
  </header>
  <div class="rt-tabs" role="tablist" aria-label="${esc(t(L.agendaEyebrow))}">
    ${agendas
      .map((a) => {
        const meta = agendaMeta(a);
        const sel = a.id === active;
        const fitsMonth = month && meta.months.includes(month);
        return `<button type="button" role="tab" class="rt-tab" id="rt-tab-${esc(a.id)}" aria-controls="rt-panel" aria-selected="${sel}" tabindex="${sel ? 0 : -1}" data-agenda="${esc(a.id)}">
          <span class="rt-tab-icon">${icon(meta.icon, { size: 20 })}</span>
          <span class="rt-tab-text"><b>${esc(t(meta.title))}</b><small>${esc(t(meta.who))}</small></span>
          ${fitsMonth ? `<span class="badge">${esc(t(L.yourMonth))}</span>` : ''}
        </button>`;
      })
      .join('')}
  </div>
  <div class="rt-panel" id="rt-panel" role="tabpanel" tabindex="0" aria-labelledby="rt-tab-${esc(active)}" data-panel>
    ${agendaPanelHtml(ctx, agendas.find((a) => a.id === active), items)}
  </div>
  <ul class="rt-legend" aria-hidden="true">
    ${Object.entries(KIND)
      .map(([k, v]) => `<li class="rt-k-${k}"><span class="rt-block-dot">${icon(v.icon, { size: 12 })}</span>${esc(t(v.label))}</li>`)
      .join('')}
  </ul>`;
}

function groupText(ctx, g) {
  if (!g || (g.min == null && g.max == null)) return ctx.t(L.groupAsk);
  if (g.min != null && g.max != null) return tt(ctx, L.groupRange, { a: g.min, b: g.max });
  if (g.max != null) return tt(ctx, L.groupUpTo, { n: g.max });
  return tt(ctx, L.groupFrom, { n: g.min });
}

function monthsStrip(ctx, months) {
  const sel = ctx.state.month;
  if (!months?.length) return `<span class="rt-months-ask">${icon('calendar', { size: 16 })}${esc(ctx.t(L.monthsAsk))}</span>`;
  const label = months.map((m) => monthName(m, ctx.lang)).join(', ');
  return `<span class="rt-months" role="img" aria-label="${esc(label)}">${Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const on = months.includes(m);
    return `<span class="${on ? 'on' : ''}${sel === m ? ' sel' : ''}" title="${esc(monthName(m, ctx.lang))}">${esc(monthName(m, ctx.lang).slice(0, 1))}</span>`;
  }).join('')}</span>`;
}

function priceHtml(ctx, item) {
  const p = item.typicalPriceEUR;
  if (!p || item.confidence === 'low') return `<p class="rt-price is-none">${icon('euro', { size: 18 })}${esc(ctx.t(L.noPrice))}</p>`;
  const unit = PRICE_UNITS[item.id];
  const amount = euro(p.amount, ctx.lang);
  const value = p.amount === 0 ? ctx.t(L.freeTour) : unit?.from ? tt(ctx, L.priceFrom, { p: amount }) : amount;
  return `<p class="rt-price">${icon('euro', { size: 18 })}<span><b>${esc(value)}</b> ${unit ? `<span class="rt-price-unit">${esc(ctx.t(unit))}</span>` : ''}<small>${esc(ctx.t(L.price))} · ${esc(p.asOf)}</small></span></p>`;
}

// The research's own price wording, kept for the Sources disclosure.
function priceNote(ctx, item) {
  const p = item.typicalPriceEUR;
  if (!p?.unit || item.confidence === 'low') return '';
  return `<p class="rt-price-note"><b>${esc(ctx.t(L.priceNote))}:</b> <span${enLang(ctx)}>${esc(p.unit)}</span></p>`;
}

// Routed distance and time from the research (driveFromVilla); the
// straight-line estimate is only a fallback when no routed time exists.
function distanceText(ctx, item) {
  if (item.km == null) return '';
  if (item.km < 0.05) return ctx.t(item.category === 'catering' && item.id !== 'villa-grill-self-catering' ? L.comesToYou : L.atHouse);
  const d = parseDrive(item.driveFromVilla);
  if (!d) return `≈ ${formatKm(item.km)} · ≈ ${formatMinutes(travelMinutes(item.km, 'car'))} ${ctx.t(L.byCar)}`;
  const min = d.max ? `${d.min}–${d.max} min` : formatMinutes(d.min);
  return `${d.km != null ? `≈ ${formatKm(d.km)} · ` : ''}≈ ${min} ${ctx.t(L.byCar)}`;
}

function durationText(h) {
  if (!h) return '';
  return formatMinutes(h * 60);
}

function activityCardHtml(ctx, item) {
  const t = ctx.t;
  const cat = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
  const sel = ctx.state.month;
  const low = item.confidence === 'low';
  const inMonth = sel && item.months?.includes(sel);
  const outMonth = sel && item.months?.length && !item.months.includes(sel);
  const ops = (item.operators || []).filter((o) => o.url);
  const meta = [
    `<span>${icon('users', { size: 16 })}${esc(groupText(ctx, item.groupSize))}</span>`,
    item.durationHours ? `<span>${icon('calendar', { size: 16 })}${esc(durationText(item.durationHours))}</span>` : '',
    item.km != null ? `<span>${icon('pin', { size: 16 })}${esc(distanceText(ctx, item))}</span>` : '',
  ].join('');
  return `
  <article class="rt-act${low ? ' is-low' : ''}${outMonth ? ' is-out' : ''}" id="rt-act-${esc(item.id)}" data-cat="${esc(item.category)}" data-low="${low}">
    <div class="rt-act-top">
      <span class="badge neutral">${icon(cat.icon, { size: 14 })}${esc(t(L[cat.id]))}</span>
      ${inMonth ? `<span class="badge">${icon('check', { size: 14 })}${esc(tt(ctx, L.inMonth, { m: monthName(sel, ctx.lang, true) }))}</span>` : ''}
      ${outMonth ? `<span class="badge accent">${esc(tt(ctx, L.notInMonth, { m: monthName(sel, ctx.lang, true) }))}</span>` : ''}
      ${low ? `<span class="badge todo-ish">${esc(t(L.unverified))}</span>` : ''}
    </div>
    <h4>${esc(item.name)}</h4>
    <p class="meta">${meta}</p>
    ${low ? `<p class="rt-act-desc muted">${esc(t(L.unverifiedText))}</p>` : `<p class="rt-act-desc"${enLang(ctx)}>${esc(item.description)}</p>`}
    ${monthsStrip(ctx, item.months)}
    ${priceHtml(ctx, item)}
    <div class="rt-act-foot">
      ${ops.length ? `<p class="rt-ops"><span class="visually-hidden">${esc(t(L.operator))}: </span>${ops.map((o) => `<a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.name)}<span aria-hidden="true"> ↗</span></a>`).join('')}</p>` : ''}
      ${sourcesHtml(ctx, item.sources, priceNote(ctx, item))}
    </div>
  </article>`;
}

function sortedItems(ctx, items) {
  const sel = ctx.state.month;
  const score = (it) => (sel ? (it.months?.includes(sel) ? 0 : it.months?.length ? 2 : 1) : 0);
  const rank = (it) => {
    const r = CATEGORY_ORDER.indexOf(it.category);
    return r < 0 ? CATEGORY_ORDER.length : r;
  };
  return items
    .filter((it) => !HIDDEN_ITEMS.has(it.id))
    .map((it, i) => ({ it, i }))
    .sort((a, b) => score(a.it) - score(b.it) || rank(a.it) - rank(b.it) || (a.it.km ?? 999) - (b.it.km ?? 999) || a.i - b.i)
    .map((x) => x.it);
}

function activitiesHtml(ctx, data) {
  const t = ctx.t;
  const items = sortedItems(ctx, data.items || []);
  const leads = items.filter((i) => i.confidence === 'low').length;
  const verified = items.filter((i) => i.confidence !== 'low');
  const chips = [
    ['all', t(L.all), verified.length, 'layers'],
    ...CATEGORIES.map((c) => [c.id, t(L[c.id]), verified.filter((i) => i.category === c.id).length, c.icon]),
  ];
  return `
  <header class="section-head">
    <span class="eyebrow">${icon('users', { size: 16 })}${esc(t(L.actEyebrow))}</span>
    <h3 class="rt-h">${esc(t(L.actTitle))}</h3>
    <p class="lede">${esc(t(L.actLede))} ${esc(t(L.actLang))}</p>
  </header>
  <div class="toolbar">
    <div class="chips" role="group" aria-label="${esc(t(L.actEyebrow))}">
      ${chips.map(([id, label, n, ic]) => `<button type="button" class="chip" data-cat-filter="${id}" aria-pressed="${memo.cat === id}">${icon(ic, { size: 16 })}${esc(label)} <span class="rt-chip-n">${n}</span></button>`).join('')}
    </div>
    <span class="spacer"></span>
    ${leads ? `<button type="button" class="btn btn-ghost btn-small" data-leads aria-pressed="${memo.leads}">${esc(memo.leads ? t(L.hideLeads) : tt(ctx, L.showLeads, { n: leads }))}</button>` : ''}
  </div>
  <p class="visually-hidden" aria-live="polite" data-act-count></p>
  <div class="rt-acts" data-acts>${items.map((i) => activityCardHtml(ctx, i)).join('')}</div>
  <p class="muted rt-acts-empty" data-acts-empty hidden>${esc(t(L.noneInCat))}</p>
  <p class="rt-acts-more"><button type="button" class="btn" data-acts-all aria-expanded="${memo.all}" hidden></button></p>`;
}

// Everyday essentials from pois.json, timed like the Explore section's list.
function nearFacts(pois) {
  const km = (id) => (pois?.items || []).find((x) => x.id === id)?.km;
  const car = (id) => (km(id) != null ? formatMinutes(travelMinutes(km(id), 'car')) : '?');
  const shop = km('prac-sabunike-lito');
  return {
    shop: shop != null ? `${formatKm(shop)} (${formatMinutes(travelMinutes(shop, 'walk'))})` : '?',
    pharmacy: car('prac-nin-pharmacy'),
    hospital: car('prac-zadar-hospital'),
  };
}

function listingFacts(listing, travel, pois) {
  const apts = listing?.apartments || [];
  const spaces = apts
    .map((a) => ({ n: Number(String(a.parking || '').match(/^(\d+)/)?.[1]) || 0, num: APARTMENTS.find((x) => x.id === a.id)?.number }))
    .filter((x) => x.n && x.num);
  const parking = spaces.reduce((s, x) => s + x.n, 0);
  const wifi = apts.filter((a) => (a.amenities || []).some((x) => /wi-?fi/i.test(x))).length;
  const drive = (travel?.transfers || []).find((x) => x.id === 'transfer-drive');
  return {
    bedrooms: BEDROOMS,
    sofas: SOFAS,
    ownBeds: OWN_BEDS,
    max: MAX_GUESTS,
    parking,
    wifi,
    // "2 spaces for Apartment 1 and 1 each for Apartments 2, 3 and 4 (5 in all)"
    parkingSplit: (lang) => {
      const W = PARKING_WORDS[lang] || PARKING_WORDS.en;
      const groups = [...new Set(spaces.map((x) => x.n))].map((n) => ({ n, nums: spaces.filter((x) => x.n === n).map((x) => x.num) }));
      const list = (nums) => (nums.length > 1 ? `${nums.slice(0, -1).join(', ')} ${W.and} ${nums.at(-1)}` : nums[0]);
      const parts = groups.map((g) => fill(g.nums.length > 1 ? W.many : W.one, { n: g.n, a: list(g.nums), sp: plural(lang, g.n, W.sp), each: W.each }));
      return `${parts.join(` ${W.and} `)} (${fill(W.total, { n: parking })})`;
    },
    airportRange: minuteBand(drive?.durationMin || travelMinutes(airportKm(), 'car')),
    drives: (lang) => {
      const local = travel?.localDrives || [];
      const min = (id) => local.find((x) => x.id === id)?.durationMin;
      return [
        ['Nin', min('local-nincroatia')],
        ['Zadar', min('local-autobusnikolodvorzad')],
        [AIRPORT_NAME[lang] || AIRPORT_NAME.en, drive?.durationMin && minuteBand(drive.durationMin)],
      ]
        .filter(([, m]) => m)
        .map(([name, m]) => `${name} ≈ ${m} min`)
        .join(', ');
    },
    near: nearFacts(pois),
    sources: [...new Set(apts.flatMap((a) => a.sources || []))],
  };
}

function checklistHtml(ctx, data, facts, items) {
  const t = ctx.t;
  const rows = (data.venueChecklist || []).map((row) => ({ row, c: CHECKS.find((c) => c.match.test(row.question)) }));
  const ST = { yes: ['check', L.stYes], partial: ['info', L.stPartial], ask: ['chat', L.stAsk] };
  const counts = { yes: 0, partial: 0, ask: 0 };
  for (const { c } of rows) counts[c?.status || 'ask'] += 1;
  const open = !isMobile();
  return `
  <header class="section-head">
    <span class="eyebrow">${icon('check', { size: 16 })}${esc(t(L.checkEyebrow))}</span>
    <h3 class="rt-h">${esc(t(isCompany(ctx) ? L.checkTitle : L.groupCheckTitle))}</h3>
    <p class="lede">${esc(t(isCompany(ctx) ? L.checkLede : L.groupCheckLede))}</p>
  </header>
  <p class="rt-check-tally">
    ${Object.entries(counts)
      .filter(([, n]) => n)
      .map(([k, n]) => `<span class="rt-st rt-st-${k}">${icon(ST[k][0], { size: 16 })}${n} · ${esc(t(ST[k][1]))}</span>`)
      .join('')}
  </p>
  <ul class="rt-checks">
    ${rows
      .map(({ row, c }) => {
        const status = c?.status || 'ask';
        const q = c ? t(c.q) : row.question;
        const a = c ? t(c.a(facts, row)) : t(L.stAsk);
        return `<li class="rt-check rt-check-${status}"><details${open ? ' open' : ''}>
          <summary>
            <span class="rt-st rt-st-${status}">${icon(ST[status][0], { size: 16 })}${esc(t(ST[status][1]))}</span>
            <h4>${esc(q)}</h4>
          </summary>
          <p>${esc(a)}${c?.srcItem ? sourceChips(ctx, items.get(c.srcItem)?.sources) : ''}${c?.todo ? ownerTodo(c.todo) : ''}</p>
          ${c?.link ? `<p class="small rt-check-link"><a href="${esc(c.link.href)}" target="_blank" rel="noopener">${esc(t(c.link.label))}<span aria-hidden="true"> ↗</span></a></p>` : ''}
          ${c?.listing ? `<p class="source-note">${esc(t(L.fromListings))}</p>` : ''}
        </details></li>`;
      })
      .join('')}
  </ul>
  ${sourcesHtml(ctx, facts.sources)}`;
}

function invoicingHtml(ctx, data) {
  const t = ctx.t;
  const facts = (data.invoicingAndTax || []).map((f) => ({ f, c: INVOICE.find((c) => c.match.test(f.fact)) }));
  return `
  <div class="rt-box rt-invoice">
    <h3>${icon('euro', { size: 22 })}${esc(t(L.invTitle))}</h3>
    <p class="rt-box-lead"><span class="badge">${esc(t(L.stAsk))}</span> ${esc(t(L.invLead))}${ownerTodo('R1 invoice with VAT or invoice without VAT; eRačun readiness')}</p>
    <p class="small muted">${esc(t(L.invGeneral))}</p>
    <ul class="rt-facts">
      ${facts
        .map(
          ({ f, c }) => `<li class="${f.confidence === 'low' ? 'is-low' : ''}">
            <span>${esc(c ? t(c) : f.fact)}${f.confidence === 'low' ? ` <em class="rt-unconf">(${esc(t(L.unconfirmed))})</em>` : ''}${sourceChips(ctx, f.sources)}</span>
          </li>`,
        )
        .join('')}
    </ul>
  </div>`;
}

function offSeasonHtml(ctx, data) {
  const t = ctx.t;
  const off = data.offSeason || {};
  const sel = ctx.state.month;
  // Same Open-Meteo series as the Seasons and Beaches sections, April to October.
  const climate = CLIMATE.months.filter((c) => c.month >= 4 && c.month <= 10).map((c) => ({ m: c.month, maxC: Math.round(c.airMaxC), seaC: Math.round(c.seaC) }));
  const climateSources = CLIMATE.sources.filter((u) => u.includes('open-meteo.com'));
  const adv = (off.advantages || []).map((a) => ({ a, c: ADVANTAGES.find((c) => c.match.test(a.fact)) })).filter((x) => x.a.confidence !== 'low');
  return `
  <details class="rt-box rt-off"${isMobile() ? '' : ' open'}>
    <summary><h3>${icon('sun', { size: 22 })}${esc(t(L.offTitle))}</h3></summary>
    <p class="rt-box-lead">${esc(t(L.offLead))}${ownerTodo('whole-house off-season prices')}</p>
    ${climate.length
      ? `<ol class="rt-climate">
      ${climate
        .map(
          (c) => `<li class="${SHOULDER.has(c.m) ? 'is-shoulder' : 'is-peak'}${sel === c.m ? ' is-sel' : ''}">
          <b>${esc(monthName(c.m, ctx.lang))}</b>
          <span><span class="visually-hidden">${esc(t(L.maxC))}</span>${icon('sun', { size: 14 })}${c.maxC}°</span>
          <span><span class="visually-hidden">${esc(t(L.seaC))}</span>${icon('wave', { size: 14 })}${c.seaC}°</span>
          <small>${SHOULDER.has(c.m) ? '&nbsp;' : esc(t(L.peak))}</small>
        </li>`,
        )
        .join('')}
    </ol>
    <p class="source-note rt-climate-note"><span>${icon('sun', { size: 14 })}${esc(t(L.maxC))}</span><span>${icon('wave', { size: 14 })}${esc(t(L.seaC))}</span><span>${esc(t(L.climateNote))}${sourceChips(ctx, climateSources)}</span></p>`
      : ''}
    <ul class="rt-adv">
      ${adv
        .map(
          ({ a, c }) => `<li>${icon(c?.icon || 'info', { size: 18 })}<span>${esc(c ? t(c) : a.fact)}${sourceChips(ctx, a.sources)}</span></li>`,
        )
        .join('')}
    </ul>
  </details>`;
}

function proposalMessage(ctx) {
  const msg = tt(ctx, memo.mode === 'own' ? L.planMsgOwn : L.planMsgShare, { n: memo.team });
  return memo.team > MAX_GUESTS ? `${msg} ${tt(ctx, L.planMsgOver, { n: memo.team, cap: MAX_GUESTS })}` : msg;
}

export default {
  id: 'retreat',
  nav: { en: 'Retreats', de: 'Retreats', sl: 'Za skupine', hr: 'Za grupe', it: 'Per gruppi' },
  rerenderOn: ['month'],

  render(ctx) {
    const t = ctx.t;
    const company = isCompany(ctx);
    return `
    <div class="container">
      ${introHtml(ctx)}
      ${plannerHtml(ctx)}
      <div class="rt-data" data-rt-data>
        <div class="lazy-box rt-skeleton">${esc(t(L.loading))}</div>
      </div>
      <div class="rt-cta">
        <div>
          <h3>${esc(t(company ? L.ctaTitle : L.groupCtaTitle))}</h3>
          <p>${esc(t(company ? L.ctaText : L.groupCtaText))}</p>
        </div>
        <button type="button" class="btn btn-light btn-lg" data-proposal>${icon('mail', { size: 18 })}${esc(t(company ? L.ctaProposal : L.groupCtaProposal))}</button>
      </div>
      <p class="error-box" data-mount-error hidden>${esc(t(L.mountError))}</p>
    </div>`;
  },

  async mount(el, ctx) {
    const t = ctx.t;
    const input = el.querySelector('#rt-team');
    const summary = el.querySelector('[data-summary]');
    const units = el.querySelector('[data-units]');
    let agendas = [];
    let items = new Map();

    const paintPlan = () => {
      const plan = allocate(memo.team, memo.mode);
      summary.innerHTML = plannerSummaryHtml(ctx, plan, memo.team, memo.mode);
      units.innerHTML = plannerUnitsHtml(ctx, plan, memo.mode);
    };
    const setTeam = (n) => {
      memo.team = Math.max(TEAM_MIN, Math.min(TEAM_MAX, Math.round(Number(n) || TEAM_MIN)));
      input.value = memo.team;
      paintPlan();
    };
    const setMode = (mode) => {
      memo.mode = mode;
      const radio = el.querySelector(`input[name="rt-mode"][value="${mode}"]`);
      if (radio) radio.checked = true;
      paintPlan();
    };

    const applyFilter = () => {
      const cards = [...el.querySelectorAll('.rt-act')];
      const first = ACT_FIRST[isMobile() ? 'mobile' : 'desktop'];
      let shown = 0;
      for (const c of cards) {
        const ok = (memo.cat === 'all' || c.dataset.cat === memo.cat) && (memo.leads || c.dataset.low !== 'true');
        if (ok) shown += 1;
        c.hidden = !ok || (!memo.all && shown > first);
      }
      const more = el.querySelector('[data-acts-all]');
      if (more) {
        more.hidden = shown <= first;
        more.setAttribute('aria-expanded', String(memo.all));
        more.textContent = memo.all ? t(L.showFewer) : tt(ctx, L.showAll, { n: shown });
      }
      const empty = el.querySelector('[data-acts-empty]');
      if (empty) empty.hidden = shown > 0;
      const count = el.querySelector('[data-act-count]');
      if (count) count.textContent = tt(ctx, L.shownCount, { n: shown });
      for (const b of el.querySelectorAll('[data-cat-filter]')) b.setAttribute('aria-pressed', String(b.dataset.catFilter === memo.cat));
    };

    const selectAgenda = (id, focus = false) => {
      const a = agendas.find((x) => x.id === id);
      if (!a) return;
      memo.agenda = id;
      for (const tab of el.querySelectorAll('[data-agenda]')) {
        const sel = tab.dataset.agenda === id;
        tab.setAttribute('aria-selected', String(sel));
        tab.tabIndex = sel ? 0 : -1;
        if (sel && focus) tab.focus();
      }
      const panel = el.querySelector('[data-panel]');
      panel.setAttribute('aria-labelledby', `rt-tab-${id}`);
      panel.innerHTML = agendaPanelHtml(ctx, a, items);
    };

    const proposal = () =>
      ctx.bus.emit('inquiry:prefill', {
        purpose: purposeOf(ctx),
        apartment: 'house',
        guests: Math.min(memo.team, MAX_GUESTS),
        ...(ctx.state.month ? { month: ctx.state.month } : {}),
        message: proposalMessage(ctx),
      });

    const onClick = (e) => {
      const step = e.target.closest('[data-step]');
      if (step) return setTeam(memo.team + Number(step.dataset.step));
      const sw = e.target.closest('[data-mode-switch]');
      if (sw) return setMode(sw.dataset.modeSwitch);
      if (e.target.closest('[data-ask-plan]') || e.target.closest('[data-proposal]')) return proposal();
      const tab = e.target.closest('[data-agenda]');
      if (tab) return selectAgenda(tab.dataset.agenda);
      const cust = e.target.closest('[data-customise]');
      if (cust) {
        const a = agendas.find((x) => x.id === cust.dataset.customise);
        if (!a) return;
        const meta = agendaMeta(a);
        const days = a.days.map((d) => `${t(L.day)} ${d.day}: ${d.theme}`).join('\n');
        return ctx.bus.emit('inquiry:prefill', {
          purpose: purposeOf(ctx),
          apartment: 'house',
          guests: Math.min(memo.team, MAX_GUESTS),
          month: ctx.state.month || meta.months[0],
          message: `${tt(ctx, L.agendaMsg, { t: t(meta.title) })}\n${days}`,
        });
      }
      const chip = e.target.closest('[data-cat-filter]');
      if (chip) {
        memo.cat = chip.dataset.catFilter;
        return applyFilter();
      }
      if (e.target.closest('[data-acts-all]')) {
        memo.all = !memo.all;
        applyFilter();
        if (!memo.all) el.querySelector('[data-acts]')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      const leads = e.target.closest('[data-leads]');
      if (leads) {
        memo.leads = !memo.leads;
        leads.setAttribute('aria-pressed', String(memo.leads));
        const n = el.querySelectorAll('.rt-act[data-low="true"]').length;
        leads.textContent = memo.leads ? t(L.hideLeads) : tt(ctx, L.showLeads, { n });
        return applyFilter();
      }
    };
    const onInput = (e) => {
      if (e.target === input) {
        if (input.value === '') return;
        const n = Number(input.value);
        if (Number.isFinite(n) && n >= TEAM_MIN && n <= TEAM_MAX) {
          memo.team = n;
          paintPlan();
        }
      } else if (e.target.name === 'rt-mode') setMode(e.target.value);
    };
    const onChange = (e) => {
      if (e.target === input) setTeam(input.value);
    };
    const onKey = (e) => {
      const tab = e.target.closest('[data-agenda]');
      if (!tab) return;
      const ids = agendas.map((a) => a.id);
      const i = ids.indexOf(tab.dataset.agenda);
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = ids[(i + 1) % ids.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = ids[(i - 1 + ids.length) % ids.length];
      else if (e.key === 'Home') next = ids[0];
      else if (e.key === 'End') next = ids[ids.length - 1];
      if (next) {
        e.preventDefault();
        selectAgenda(next, true);
      }
    };

    el.addEventListener('click', onClick);
    el.addEventListener('input', onInput);
    el.addEventListener('change', onChange);
    el.addEventListener('keydown', onKey);
    const cleanup = () => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('input', onInput);
      el.removeEventListener('change', onChange);
      el.removeEventListener('keydown', onKey);
    };

    const [{ default: data }, { default: listing }, { default: travel }, { default: pois }] = await Promise.all([
      import('../data/retreats.json'),
      import('../data/listing.json'),
      import('../data/travel.json'),
      import('../data/pois.json'),
    ]).catch((err) => {
      cleanup();
      throw err;
    });
    agendas = data.sampleAgendas || [];
    items = new Map((data.items || []).map((i) => [i.id, i]));
    const facts = listingFacts(listing, travel, pois);
    const airport = el.querySelector('[data-airport-min]');
    if (airport) airport.textContent = facts.airportRange;

    el.querySelector('[data-rt-data]').innerHTML = `
      <div class="rt-part">${agendasHtml(ctx, data, items)}</div>
      <div class="rt-part">${activitiesHtml(ctx, data)}</div>
      <div class="rt-part">${checklistHtml(ctx, data, facts, items)}</div>
      <div class="rt-boxes">
        ${invoicingHtml(ctx, data)}
        ${offSeasonHtml(ctx, data)}
      </div>`;
    applyFilter();
    return cleanup;
  },
};
