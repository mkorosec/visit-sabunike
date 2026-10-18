// "Things to do": owner's picks (kite lessons, Pag 'Life on Mars', healing mud,
// salt works, boat trips), then every verified activity as a filterable card
// (category, who it suits, available in the chosen month), and a "Plan a day"
// tool that turns 2–3 picks into a timed itinerary with drive times and sends
// it to the inquiry form. Data (src/data/activities.json) is loaded in mount().
import './activities.css';
import { esc, icon, monthName, formatMinutes, travelMinutes, haversineKm, photo, toast, prefersReducedMotion } from '../lib/util.js';
import { monthVars } from './live-weather.js';

const MAX_PLAN = 3;
const START_HOURS = [7, 8, 9, 10, 11];
const controllers = new WeakMap(); // section element -> { setMonth }
const FIRST_CARDS = { desktop: 8, mobile: 4 };
const MOBILE_Q = '(max-width: 760px)'; // same breakpoint as the card layout in activities.css
const FULL_DAY_H = 8; // a stop this long fills the day on its own
const LATEST_BACK = 22 * 60; // refuse plans that would get back after 22:00
const LATE_END = 20 * 60; // warn when a stop ends after 20:00
const PLAN_KEY = 'visit-sabunike:dayplan:v1';

// ---------------------------------------------------------------- strings
// Month templates: {m} month name, {mIn} month after "in" (sl/hr locative), {M} capitalised (see monthVars).
const L = {
  eyebrow: { en: 'Things to do', de: 'Erleben', sl: 'Doživetja', hr: 'Doživljaji', it: 'Cosa fare' },
  title: {
    general: {
      en: 'Kite lessons, salt pans and a boat day to the Kornati',
      de: 'Kitekurse, Salinen und ein Bootstag zu den Kornaten',
      sl: 'Tečaji kajtanja, soline in dan z ladjo na Kornate',
      hr: 'Tečajevi kitesurfa, solana i dan brodom na Kornate',
      it: 'Lezioni di kite, saline e una giornata in barca alle Kornati',
    },
    families: {
      en: 'Days out the whole family will remember',
      de: 'Ausflüge, an die sich die ganze Familie erinnert',
      sl: 'Izleti, ki si jih bo zapomnila vsa družina',
      hr: 'Izleti koje će cijela obitelj pamtiti',
      it: 'Gite che tutta la famiglia ricorderà',
    },
    retreats: {
      en: 'Team days out, from lagoon to Velebit',
      de: 'Teamausflüge, von der Lagune bis zum Velebit',
      sl: 'Ekipni izleti, od lagune do Velebita',
      hr: 'Timski izleti, od lagune do Velebita',
      it: 'Giornate di team, dalla laguna al Velebit',
    },
  },
  lede: {
    en: 'Our favourite things to do within half an hour, plus a few day trips worth the drive.',
    de: 'Unsere Lieblingsaktivitäten in höchstens einer halben Stunde Entfernung, dazu ein paar Tagesausflüge, die die Fahrt lohnen.',
    sl: 'Naša najljubša doživetja v pol ure vožnje, pa še nekaj celodnevnih izletov, ki so vredni poti.',
    hr: 'Naši omiljeni doživljaji unutar pola sata vožnje, plus nekoliko jednodnevnih izleta vrijednih puta.',
    it: 'Le nostre attività preferite entro mezz’ora, più qualche gita di un giorno che vale il viaggio.',
  },
  method: {
    en: 'Checked against operators’ and tourist boards’ pages where we could, with the source one tap away; items marked “Check locally” are only partly confirmed. Most drive times are measured road routes from our gate.',
    de: 'Wo möglich mit den Seiten der Anbieter und Tourismusverbände abgeglichen, die Quelle ist einen Tipp entfernt; mit „Vor Ort prüfen“ markierte Einträge sind nur teilweise bestätigt. Die meisten Fahrzeiten sind gemessene Straßenrouten ab unserem Tor.',
    sl: 'Kjer je bilo mogoče, preverjeno na straneh ponudnikov in turističnih zvez, vir je oddaljen le en dotik; postavke z oznako »Preverite na kraju« so potrjene le delno. Večina časov vožnje so izmerjene cestne poti od naših vrat.',
    hr: 'Gdje je bilo moguće, provjereno na stranicama pružatelja usluga i turističkih zajednica, a izvor je udaljen jedan dodir; stavke označene „Provjerite na licu mjesta” potvrđene su samo djelomično. Većina vremena vožnje izmjerene su cestovne rute od naših vrata.',
    it: 'Verificato, dove possibile, sui siti degli operatori e degli enti turistici, con la fonte a portata di tocco; le voci segnate «Da verificare sul posto» sono confermate solo in parte. Quasi tutti i tempi di guida sono percorsi stradali misurati dal nostro cancello.',
  },
  picks: { en: 'Our favourites', de: 'Unsere Favoriten', sl: 'Naši favoriti', hr: 'Naši favoriti', it: 'I nostri preferiti' },
  pick: { en: 'Our pick', de: 'Unser Tipp', sl: 'Naš nasvet', hr: 'Naš izbor', it: 'Il nostro consiglio' },
  all: { en: 'All', de: 'Alle', sl: 'Vse', hr: 'Sve', it: 'Tutte' },
  category: { en: 'Type', de: 'Art', sl: 'Vrsta', hr: 'Vrsta', it: 'Tipo' },
  forWho: { en: 'Good for', de: 'Gut für', sl: 'Primerno za', hr: 'Dobro za', it: 'Ideale per' },
  anyone: { en: 'Anyone', de: 'Alle', sl: 'Vsakogar', hr: 'Svakoga', it: 'Tutti' },
  when: { en: 'Month', de: 'Monat', sl: 'Mesec', hr: 'Mjesec', it: 'Mese' },
  anyMonth: { en: 'Any month', de: 'Beliebiger Monat', sl: 'Kateri koli mesec', hr: 'Bilo koji mjesec', it: 'Qualsiasi mese' },
  onlyMonth: { en: 'Only what’s on in {m}', de: 'Nur was im {m} stattfindet', sl: 'Samo to, kar je na voljo v {mIn}', hr: 'Samo ono što je dostupno u {mIn}', it: 'Solo ciò che c’è in {m}' },
  pickMonthHint: { en: 'Pick a month to see what runs then', de: 'Monat wählen, um zu sehen, was dann läuft', sl: 'Izberite mesec in poglejte, kaj je takrat na voljo', hr: 'Odaberite mjesec i pogledajte što je tada dostupno', it: 'Scegliete un mese per vedere cosa c’è in quel periodo' },
  // Result count by plural category (Intl.PluralRules); {n} is the number.
  results: {
    one: { en: '1 thing to do', de: '1 Erlebnis', sl: '{n} doživetje', hr: '{n} doživljaj', it: '1 attività' },
    two: { sl: '{n} doživetji' },
    few: { sl: '{n} doživetja', hr: '{n} doživljaja' },
    other: { en: '{n} things to do', de: '{n} Erlebnisse', sl: '{n} doživetij', hr: '{n} doživljaja', it: '{n} attività' },
  },
  none: {
    en: 'Nothing matches these filters. Try another month or type.',
    de: 'Nichts passt zu diesen Filtern. Versuchen Sie einen anderen Monat oder eine andere Art.',
    sl: 'Tem filtrom nič ne ustreza. Poskusite z drugim mesecem ali vrsto.',
    hr: 'Ništa ne odgovara ovim filtrima. Pokušajte s drugim mjesecom ili vrstom.',
    it: 'Nessun risultato con questi filtri. Provate un altro mese o un altro tipo.',
  },
  reset: { en: 'Reset filters', de: 'Filter zurücksetzen', sl: 'Ponastavi filtre', hr: 'Poništi filtre', it: 'Azzera i filtri' },
  showAll: { en: 'Show all {n}', de: 'Alle {n} zeigen', sl: 'Pokaži vse ({n})', hr: 'Prikaži sve ({n})', it: 'Mostra tutte ({n})' },
  drive: { en: 'drive', de: 'Fahrt', sl: 'vožnje', hr: 'vožnje', it: 'in auto' },
  about: { en: 'about', de: 'ca.', sl: 'približno', hr: 'oko', it: 'circa' },
  onFoot: { en: 'on foot', de: 'zu Fuß', sl: 'peš', hr: 'pješice', it: 'a piedi' },
  byBike: { en: 'by bike', de: 'mit dem Rad', sl: 's kolesom', hr: 'biciklom', it: 'in bici' },
  hours: { en: 'h', de: 'Std.', sl: 'h', hr: 'h', it: 'h' },
  allYear: { en: 'All year', de: 'Ganzjährig', sl: 'Vse leto', hr: 'Cijele godine', it: 'Tutto l’anno' },
  seasonUnknown: { en: 'Season: check with the operator', de: 'Saison: beim Anbieter prüfen', sl: 'Sezona: preverite pri ponudniku', hr: 'Sezona: provjerite kod pružatelja usluge', it: 'Stagione: verificate con l’operatore' },
  seasonUnknownShort: { en: 'Season varies', de: 'Saison variiert', sl: 'Sezona se spreminja', hr: 'Sezona varira', it: 'Stagione variabile' },
  notIn: { en: 'Not in {m}', de: 'Nicht im {m}', sl: 'Ni na voljo v {mIn}', hr: 'Nije dostupno u {mIn}', it: 'Non disponibile in {m}' },
  free: { en: 'Free', de: 'Kostenlos', sl: 'Brezplačno', hr: 'Besplatno', it: 'Gratis' },
  from: { en: 'from', de: 'ab', sl: 'od', hr: 'od', it: 'da' },
  parkTicket: { en: 'Park ticket', de: 'Parkeintritt', sl: 'Vstopnica za park', hr: 'Ulaznica za park', it: 'Ingresso al parco' },
  parkTicketIn: { en: 'Park ticket in {m}', de: 'Parkeintritt im {m}', sl: 'Vstopnica za park v {mIn}', hr: 'Ulaznica za park u {mIn}', it: 'Ingresso al parco in {m}' },
  meetingPoint: { en: 'Meeting point: ask the operator', de: 'Treffpunkt: beim Anbieter erfragen', sl: 'Zbirno mesto: vprašajte ponudnika', hr: 'Mjesto okupljanja: pitajte organizatora', it: 'Punto d’incontro: chiedete all’operatore' },
  perPerson: { en: 'per person', de: 'pro Person', sl: 'na osebo', hr: 'po osobi', it: 'a persona' },
  priceSource: { en: 'price source', de: 'Preisquelle', sl: 'vir cene', hr: 'izvor cijene', it: 'fonte del prezzo' },
  more: { en: 'Read more', de: 'Mehr lesen', sl: 'Preberite več', hr: 'Pročitajte više', it: 'Leggi di più' },
  less: { en: 'Show less', de: 'Weniger', sl: 'Prikaži manj', hr: 'Prikaži manje', it: 'Mostra meno' },
  howToBook: { en: 'How to book', de: 'So buchen Sie', sl: 'Kako rezervirati', hr: 'Kako rezervirati', it: 'Come prenotare' },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  unverified: { en: 'Check locally', de: 'Vor Ort prüfen', sl: 'Preverite na kraju', hr: 'Provjerite na licu mjesta', it: 'Da verificare sul posto' },
  unverifiedTitle: {
    en: 'Only partly verified: ask us or check locally before you plan around it.',
    de: 'Nur teilweise bestätigt: fragen Sie uns oder prüfen Sie vor Ort.',
    sl: 'Le delno preverjeno: preden načrtujete dan okoli tega, vprašajte nas ali preverite na kraju.',
    hr: 'Samo djelomično provjereno: prije nego što isplanirate dan, pitajte nas ili provjerite na licu mjesta.',
    it: 'Verificato solo in parte: chiedeteci o controllate sul posto prima di organizzarvi.',
  },
  opens: { en: 'opens in a new tab', de: 'öffnet in neuem Tab', sl: 'odpre se v novem zavihku', hr: 'otvara se u novoj kartici', it: 'si apre in una nuova scheda' },
  add: { en: 'Add to my day', de: 'Zu meinem Tag', sl: 'Dodaj v moj dan', hr: 'Dodaj u moj dan', it: 'Aggiungi alla mia giornata' },
  added: { en: 'In my day', de: 'Im Tagesplan', sl: 'V mojem dnevu', hr: 'U mom danu', it: 'Nella mia giornata' },
  addedToast: { en: 'Added to your day plan', de: 'Zum Tagesplan hinzugefügt', sl: 'Dodano v vaš načrt dneva', hr: 'Dodano u vaš plan dana', it: 'Aggiunto al programma della giornata' },
  fullToast: { en: 'A day plan holds up to three things', de: 'Ein Tagesplan hat höchstens drei Punkte', sl: 'Načrt dneva ima lahko največ tri točke', hr: 'Plan dana može imati najviše tri stavke', it: 'Il programma di una giornata contiene al massimo tre attività' },
  fullDayToast: {
    en: 'Full-day trips fill the whole day: plan them on a day of their own.',
    de: 'Ganztagestouren füllen den ganzen Tag: planen Sie sie an einem eigenen Tag.',
    sl: 'Celodnevni izleti zapolnijo ves dan: načrtujte jih za poseben dan.',
    hr: 'Cjelodnevni izleti ispunjavaju cijeli dan: isplanirajte ih za zaseban dan.',
    it: 'Le gite di un giorno intero occupano tutta la giornata: programmatele in un giorno a parte.',
  },
  tooLongToast: {
    en: 'That would not fit in one day. Plan it for another day.',
    de: 'Das passt nicht in einen Tag. Planen Sie es für einen anderen Tag.',
    sl: 'To ne gre v en dan. Načrtujte ga za drug dan.',
    hr: 'To ne stane u jedan dan. Isplanirajte ga za drugi dan.',
    it: 'Non ci sta in una sola giornata. Programmatelo per un altro giorno.',
  },
  map: { en: 'Show on map', de: 'Auf der Karte', sl: 'Pokaži na zemljevidu', hr: 'Prikaži na karti', it: 'Mostra sulla mappa' },
  // Plan a day
  planTitle: { en: 'Plan a day', de: 'Einen Tag planen', sl: 'Načrtujte dan', hr: 'Isplanirajte dan', it: 'Organizzate una giornata' },
  planEmpty: {
    en: 'Tap “Add to my day” on up to three things. You get a timed plan with drive times from the house, ready to send to us for tips.',
    de: 'Tippen Sie bei bis zu drei Erlebnissen auf „Zu meinem Tag“. Sie erhalten einen Zeitplan mit Fahrzeiten ab dem Haus, den Sie uns für Tipps schicken können.',
    sl: 'Pri največ treh doživetjih tapnite »Dodaj v moj dan«. Dobili boste časovni načrt s časi vožnje od hiše, ki nam ga lahko pošljete za nasvete.',
    hr: 'Kod najviše tri doživljaja dodirnite „Dodaj u moj dan”. Dobit ćete vremenski plan s trajanjem vožnje od kuće, koji nam možete poslati za savjete.',
    it: 'Toccate «Aggiungi alla mia giornata» su un massimo di tre attività. Otterrete un programma con orari e tempi di guida dalla casa, pronto da inviarci per qualche consiglio.',
  },
  start: { en: 'Leave at', de: 'Abfahrt', sl: 'Odhod ob', hr: 'Polazak u', it: 'Partenza alle' },
  leave: { en: 'Leave the house', de: 'Abfahrt am Haus', sl: 'Odhod od hiše', hr: 'Polazak od kuće', it: 'Partenza da casa' },
  back: { en: 'Back at the house', de: 'Zurück am Haus', sl: 'Spet pri hiši', hr: 'Povratak kući', it: 'Rientro a casa' },
  samePlace: { en: 'Same place', de: 'Gleicher Ort', sl: 'Isti kraj', hr: 'Isto mjesto', it: 'Stesso posto' },
  totalDrive: { en: 'Driving in total', de: 'Fahrzeit gesamt', sl: 'Skupaj vožnje', hr: 'Ukupno vožnje', it: 'Guida in totale' },
  dayLength: { en: 'Day length', de: 'Tageslänge', sl: 'Dolžina dneva', hr: 'Trajanje dana', it: 'Durata della giornata' },
  longDay: {
    en: 'That is a long day. Consider splitting it over two days.',
    de: 'Das ist ein langer Tag. Vielleicht auf zwei Tage verteilen?',
    sl: 'To je dolg dan. Razmislite, ali bi ga razdelili na dva dni.',
    hr: 'To je dug dan. Razmislite o tome da ga podijelite na dva dana.',
    it: 'È una giornata lunga. Valutate di dividerla in due giorni.',
  },
  eventNote: {
    en: 'Events run on set dates: check the date before you go.',
    de: 'Veranstaltungen finden an festen Terminen statt: Datum vorher prüfen.',
    sl: 'Dogodki potekajo na določene datume: pred odhodom preverite datum.',
    hr: 'Događanja se održavaju na određene datume: prije polaska provjerite datum.',
    it: 'Gli eventi si svolgono in date precise: controllate la data prima di partire.',
  },
  saltNote: {
    en: 'Salt-works tours run on open days only, at set times (in 2025: 09:00, 11:00 and 17:00). Check the dates before you go.',
    de: 'Führungen in der Saline gibt es nur an Tagen der offenen Tür zu festen Zeiten (2025: 09:00, 11:00 und 17:00 Uhr). Termine vorher prüfen.',
    sl: 'Vodeni ogledi solin potekajo le ob dnevih odprtih vrat ob določenih urah (leta 2025: ob 9.00, 11.00 in 17.00). Pred odhodom preverite datume.',
    hr: 'Vođeni obilasci solane održavaju se samo u dane otvorenih vrata, u određeno vrijeme (2025.: u 9:00, 11:00 i 17:00). Prije polaska provjerite datume.',
    it: 'Le visite alle saline si fanno solo nelle giornate di apertura, a orari fissi (nel 2025: 9:00, 11:00 e 17:00). Controllate le date prima di partire.',
  },
  lateEnd: {
    en: '{a} would end at {t}. Most tours and schools finish earlier: leave earlier or drop a stop.',
    de: '{a} würde um {t} enden. Die meisten Touren und Schulen enden früher: früher losfahren oder einen Punkt streichen.',
    sl: '{a}: konec bi bil ob {t}. Večina izletov in šol konča prej: odpravite se prej ali izpustite eno postajo.',
    hr: '{a}: završetak bi bio u {t}. Većina izleta i škola završava ranije: krenite ranije ili izbacite jednu stavku.',
    it: '{a}: finirebbe alle {t}. Quasi tutte le escursioni e le scuole finiscono prima: partite prima o togliete una tappa.',
  },
  driveUnknown: { en: 'plus the trip to the meeting point', de: 'plus Weg zum Treffpunkt', sl: 'plus pot do zbirnega mesta', hr: 'plus put do mjesta okupljanja', it: 'più il tragitto fino al punto d’incontro' },
  outOfSeason: {
    en: '{a} does not usually run in {m}.',
    de: '{a} findet im {m} normalerweise nicht statt.',
    sl: '{a}: v {mIn} običajno ni na voljo.',
    hr: '{a}: u {mIn} obično nije dostupno.',
    it: '{a}: di solito non è disponibile in {m}.',
  },
  remove: { en: 'Remove', de: 'Entfernen', sl: 'Odstrani', hr: 'Ukloni', it: 'Rimuovi' },
  earlier: { en: 'Move earlier', de: 'Früher', sl: 'Premakni prej', hr: 'Pomakni ranije', it: 'Sposta prima' },
  clear: { en: 'Clear plan', de: 'Plan leeren', sl: 'Počisti načrt', hr: 'Očisti plan', it: 'Svuota il programma' },
  send: { en: 'Send this plan to us', de: 'Diesen Plan an uns senden', sl: 'Pošljite nam ta načrt', hr: 'Pošaljite nam ovaj plan', it: 'Inviateci questo programma' },
  sendNote: {
    en: 'We will add local tips and check it fits your dates.',
    de: 'Wir ergänzen lokale Tipps und prüfen, ob er zu Ihren Terminen passt.',
    sl: 'Dodali bomo lokalne nasvete in preverili, ali se ujema z vašimi datumi.',
    hr: 'Dodat ćemo lokalne savjete i provjeriti odgovara li vašim datumima.',
    it: 'Aggiungeremo consigli locali e verificheremo che si adatti alle vostre date.',
  },
  estimate: {
    en: 'Drive times: road routes measured with OpenStreetMap routing (OSRM); between two stops they are estimated. Real times vary with traffic and the Pag bridge in summer.',
    de: 'Fahrzeiten: Straßenrouten gemessen mit OpenStreetMap-Routing (OSRM); zwischen zwei Zielen geschätzt. Echte Zeiten hängen vom Verkehr und im Sommer von der Pag-Brücke ab.',
    sl: 'Časi vožnje: cestne poti, izmerjene z usmerjanjem OpenStreetMap (OSRM); med dvema postajama so ocenjeni. Dejanski časi so odvisni od prometa, poleti pa tudi od Paškega mosta.',
    hr: 'Vrijeme vožnje: cestovne rute izmjerene OpenStreetMap usmjeravanjem (OSRM); između dviju stanica procijenjene su. Stvarno vrijeme ovisi o prometu, a ljeti i o Paškom mostu.',
    it: 'Tempi di guida: percorsi stradali misurati con il routing di OpenStreetMap (OSRM); tra due tappe sono stimati. I tempi reali dipendono dal traffico e, d’estate, dal ponte di Pag.',
  },
  msgHead: { en: 'Day plan idea', de: 'Idee für einen Tagesplan', sl: 'Zamisel za načrt dneva', hr: 'Ideja za plan dana', it: 'Idea per una giornata' },
  msgLeave: { en: 'leave the house', de: 'Abfahrt am Haus', sl: 'odhod od hiše', hr: 'polazak od kuće', it: 'partenza da casa' },
  msgBack: { en: 'back around', de: 'zurück gegen', sl: 'nazaj okoli', hr: 'povratak oko', it: 'rientro verso le' },
  msgAsk: { en: 'Any tips, or does this need changing?', de: 'Haben Sie Tipps, oder sollten wir etwas ändern?', sl: 'Imate kakšen nasvet ali bi morali kaj spremeniti?', hr: 'Imate li savjet ili bismo trebali nešto promijeniti?', it: 'Avete qualche consiglio o c’è da cambiare qualcosa?' },
  loading: { en: 'Loading activities…', de: 'Erlebnisse werden geladen…', sl: 'Nalagamo doživetja…', hr: 'Učitavamo doživljaje…', it: 'Caricamento delle attività…' },
  mountError: {
    en: 'The activity list could not load. Please reload the page, or ask us directly.',
    de: 'Die Liste konnte nicht geladen werden. Bitte neu laden oder direkt bei uns fragen.',
    sl: 'Seznama doživetij ni bilo mogoče naložiti. Osvežite stran ali nas vprašajte neposredno.',
    hr: 'Popis doživljaja nije se mogao učitati. Osvježite stranicu ili nas pitajte izravno.',
    it: 'Non è stato possibile caricare l’elenco delle attività. Ricaricate la pagina o chiedeteci direttamente.',
  },
};

const CATEGORIES = {
  water: { label: { en: 'On the water', de: 'Auf dem Wasser', sl: 'Na vodi', hr: 'Na vodi', it: 'In acqua' }, icon: 'wave' },
  land: { label: { en: 'Hiking & outdoors', de: 'Wandern & Natur', sl: 'Pohodi in narava', hr: 'Planinarenje i priroda', it: 'Escursioni e natura' }, icon: 'mountain' },
  wellness: { label: { en: 'Wellness', de: 'Wellness', sl: 'Dobro počutje', hr: 'Wellness', it: 'Benessere' }, icon: 'leaf' },
  culture: { label: { en: 'Culture', de: 'Kultur', sl: 'Kultura', hr: 'Kultura', it: 'Cultura' }, icon: 'columns' },
  food: { label: { en: 'Food & wine', de: 'Essen & Wein', sl: 'Hrana in vino', hr: 'Hrana i vino', it: 'Cibo e vino' }, icon: 'glass' },
  event: { label: { en: 'Festivals & events', de: 'Feste & Events', sl: 'Festivali in dogodki', hr: 'Festivali i događanja', it: 'Feste ed eventi' }, icon: 'calendar' },
  nightlife: { label: { en: 'Nightlife', de: 'Nachtleben', sl: 'Nočno življenje', hr: 'Noćni život', it: 'Vita notturna' }, icon: 'music' },
};

// Same hues as CATEGORY_COLORS in src/maps/base.js (not imported, to keep Leaflet out of this chunk).
const CATEGORY_COLORS = { water: '#0b6fa4', land: '#2c7a3f', culture: '#7a4b9a', food: '#a3590c', wellness: '#0e7c7b', nightlife: '#9d174d', event: '#b45309' };

// "Good for" groups over the free-text audienceTags in the data.
const TAG_GROUPS = {
  family: { label: { en: 'Families', de: 'Familien', sl: 'Družine', hr: 'Obitelji', it: 'Famiglie' }, tags: ['families', 'kids', 'families with kids 7+', 'families with kids 8+', 'families with older kids', 'families with teens', 'fathers and kids'] },
  couples: { label: { en: 'Couples', de: 'Paare', sl: 'Pari', hr: 'Parovi', it: 'Coppie' }, tags: ['couples', 'sporty couples'] },
  groups: { label: { en: 'Teams & groups', de: 'Teams & Gruppen', sl: 'Ekipe in skupine', hr: 'Timovi i grupe', it: 'Team e gruppi' }, tags: ['companies/retreats', 'team building', 'small groups', 'groups of friends'] },
  cyclist: { label: { en: 'Cyclists', de: 'Radfahrer', sl: 'Kolesarji', hr: 'Biciklisti', it: 'Ciclisti' }, tags: ['cyclists', 'e-bikers'] },
  active: { label: { en: 'Active & adventure', de: 'Aktiv & Abenteuer', sl: 'Aktivno in pustolovsko', hr: 'Aktivno i avanturistički', it: 'Sport e avventura' }, tags: ['hikers', 'climbers', 'trail runners', 'adrenaline', 'kitesurfers', 'windsurfers', 'divers'] },
  nature: { label: { en: 'Nature & photo', de: 'Natur & Foto', sl: 'Narava in fotografija', hr: 'Priroda i fotografija', it: 'Natura e foto' }, tags: ['bird watchers', 'nature lovers', 'photographers', 'stargazers'] },
  slow: { label: { en: 'Slow & wellness', de: 'Gemütlich & Wellness', sl: 'Počasi in sproščeno', hr: 'Polako i opušteno', it: 'Slow e benessere' }, tags: ['seniors', 'wellness seekers', 'long-stay guests', 'slow travellers'] },
};

// Audience focus.activityTags → default filter. Tags listed here set the filter
// directly; any other tags pick the "Good for" group they overlap most.
const FOCUS = {
  kitesurfers: { category: 'water' },
  windsurfers: { category: 'water' },
};

// Owner-requested highlights. Our own short copy; facts from the data.
const FEATURED = [
  {
    id: 'kite-school-zdrijac',
    size: 'lg',
    photo: 'napros/20210918_155653.jpg',
    photoAlt: {
      en: 'Sandbars in knee-deep water near Ždrijac beach',
      de: 'Sandbänke im knietiefen Wasser bei Ždrijac',
      sl: 'Peščine v vodi do kolen pri plaži Ždrijac',
      hr: 'Pješčani sprudovi u vodi do koljena kod plaže Ždrijac',
      it: 'Banchi di sabbia nell’acqua alta fino al ginocchio vicino alla spiaggia di Ždrijac',
    },
    title: { en: 'Kitesurf lessons in the Nin lagoon', de: 'Kitesurfkurse in der Lagune von Nin', sl: 'Tečaji kajtanja v ninski laguni', hr: 'Tečajevi kitesurfa u ninskoj laguni', it: 'Lezioni di kitesurf nella laguna di Nin' },
    text: {
      en: 'Ždrijac is one of the best-known learning spots on the Croatian coast: a closed, shallow lagoon with a steady afternoon maestral in summer. From a 2-hour Discover session to IKO-certified courses.',
      de: 'Ždrijac ist einer der bekanntesten Lernspots der kroatischen Küste: eine geschlossene, flache Lagune mit stetigem Nachmittags-Maestral im Sommer. Vom 2-stündigen Schnupperkurs bis zum IKO-zertifizierten Kurs.',
      sl: 'Ždrijac je eno najbolj znanih mest za učenje na hrvaški obali: zaprta, plitva laguna, kjer poleti popoldne enakomerno piha maestral. Od 2-urnega uvodnega tečaja Discover do tečajev s certifikatom IKO.',
      hr: 'Ždrijac je jedno od najpoznatijih mjesta za učenje na hrvatskoj obali: zatvorena, plitka laguna u kojoj ljeti poslijepodne stalno puše maestral. Od dvosatnog uvodnog tečaja Discover do tečajeva s IKO certifikatom.',
      it: 'Ždrijac è uno dei posti più noti della costa croata per imparare: una laguna chiusa e bassa, con un maestrale costante nei pomeriggi d’estate. Da una sessione Discover di 2 ore ai corsi certificati IKO.',
    },
  },
  {
    id: 'pag-life-on-mars-trail',
    size: 'lg',
    art: 'mars',
    tint: '#a3590c', // ochre: Pag's bare karst reads warmer than the green "outdoors" hue
    title: { en: 'Pag: hiking on “Mars”', de: 'Pag: Wandern auf dem „Mars“', sl: 'Pag: pohod po »Marsu«', hr: 'Pag: planinarenje po „Marsu”', it: 'Pag: escursioni su «Marte»' },
    text: {
      en: 'Four marked trails (16 km in all) cross the bare white karst above Metajna, scoured so clean by the bura that the Novalja tourist board calls it “Life on Mars”. The loops link wild beaches, and Croatia’s first coastal via ferrata crosses the cliff at Slana bay. Free, all year, almost no shade.',
      de: 'Vier markierte Wege (insgesamt 16 km) führen durch den kahlen weißen Karst über Metajna, von der Bura so blank gefegt, dass der Tourismusverband Novalja ihn „Life on Mars“ nennt. Die Runden verbinden wilde Strände, und Kroatiens erster Küsten-Klettersteig quert die Klippe an der Bucht Slana. Kostenlos, ganzjährig, fast ohne Schatten.',
      sl: 'Štiri označene poti (skupaj 16 km) vodijo čez gol bel kras nad Metajno, ki ga je burja ostrgala tako do golega, da ga turistična zveza Novalja imenuje »Life on Mars«. Krožne poti povezujejo divje plaže, čez klif v zalivu Slana pa vodi prva obalna ferata na Hrvaškem. Brezplačno, vse leto, skoraj brez sence.',
      hr: 'Četiri označene staze (ukupno 16 km) prolaze golim bijelim kršem iznad Metajne, koji je bura toliko ogolila da ga Turistička zajednica Novalja zove „Life on Mars”. Kružne staze povezuju divlje plaže, a preko litice u uvali Slana vodi prva obalna ferata u Hrvatskoj. Besplatno, cijele godine, gotovo bez hlada.',
      it: 'Quattro sentieri segnati (16 km in tutto) attraversano il carso bianco e spoglio sopra Metajna, ripulito a tal punto dalla bora che l’ente turistico di Novalja lo chiama «Life on Mars». Gli anelli collegano spiagge selvagge e la prima via ferrata costiera della Croazia attraversa la scogliera della baia di Slana. Gratis, tutto l’anno, quasi senza ombra.',
    },
  },
  {
    id: 'nin-healing-mud',
    art: 'mud',
    title: { en: 'Nin’s healing mud', de: 'Heilschlamm von Nin', sl: 'Zdravilno blato iz Nina', hr: 'Ninsko ljekovito blato', it: 'Il fango curativo di Nin' },
    text: {
      en: 'Coat yourself in the lagoon’s famous peloid, bake dry on the sand, rinse off in warm shallow water: the local summer ritual, traditionally in July and August.',
      de: 'Mit dem berühmten Peloid der Lagune einreiben, auf dem Sand trocknen lassen, im warmen flachen Wasser abspülen: das sommerliche Ritual hier, traditionell im Juli und August.',
      sl: 'Namažite se s slavnim peloidom iz lagune, pustite, da se posuši na pesku, in ga sperite v topli plitvi vodi: domači poletni obred, po tradiciji julija in avgusta.',
      hr: 'Namažite se poznatim peloidom iz lagune, pustite da se osuši na pijesku i isperite ga u toploj plitkoj vodi: domaći ljetni ritual, tradicionalno u srpnju i kolovozu.',
      it: 'Spalmatevi il celebre peloide della laguna, lasciatelo asciugare al sole sulla sabbia e sciacquatevi nell’acqua bassa e tiepida: il rito estivo del posto, per tradizione a luglio e agosto.',
    },
  },
  {
    id: 'nin-salt-works-tour',
    art: 'salt',
    title: { en: 'Nin salt works', de: 'Saline Nin', sl: 'Ninske soline', hr: 'Solana Nin', it: 'Le saline di Nin' },
    text: {
      en: 'Walk the working salt pans with a guide, then the small Salt House museum. On the summer open days, tours, museum and shop are free.',
      de: 'Mit Führung durch die aktiven Salzfelder, danach ins kleine Salzhaus-Museum. An den Tagen der offenen Tür im Sommer sind Führung, Museum und Laden kostenlos.',
      sl: 'Z vodnikom se sprehodite med delujočimi solnimi polji, nato pa še po majhnem muzeju Hiša soli. Ob poletnih dnevih odprtih vrat so ogledi, muzej in trgovina brezplačni.',
      hr: 'S vodičem prošetajte aktivnim solanama, a zatim i malim muzejom Kuća soli. U ljetne dane otvorenih vrata obilasci, muzej i trgovina su besplatni.',
      it: 'Passeggiate con una guida tra le saline ancora in attività, poi visitate il piccolo museo della Casa del Sale. Nelle giornate di apertura estive visite, museo e negozio sono gratuiti.',
    },
  },
  {
    id: 'boat-kornati-telascica',
    art: 'boat',
    title: { en: 'Boat day to the Kornati', de: 'Bootstag zu den Kornaten', sl: 'Dan z ladjo na Kornate', hr: 'Dan brodom na Kornate', it: 'Una giornata in barca alle Kornati' },
    text: {
      en: 'A full day from Zadar’s waterfront through the bare Kornati islands and Telašćica bay, with swim stops. Check whether park tickets and lunch are included.',
      de: 'Ein ganzer Tag ab Zadars Uferpromenade durch die kahlen Kornaten und die Bucht Telašćica, mit Badestopps. Prüfen Sie, ob Parkeintritt und Mittagessen inklusive sind.',
      sl: 'Cel dan od zadrskega nabrežja med golimi otoki Kornatov in v zaliv Telašćica, s postanki za kopanje. Preverite, ali sta vstopnina za park in kosilo vključena.',
      hr: 'Cijeli dan od zadarske rive među golim kornatskim otocima i u uvalu Telašćica, sa stankama za kupanje. Provjerite jesu li ulaznice za park i ručak uključeni.',
      it: 'Una giornata intera dal lungomare di Zadar tra le isole spoglie delle Kornati e la baia di Telašćica, con soste per il bagno. Verificate se ingresso al parco e pranzo sono inclusi.',
    },
  },
];
const FEATURED_IDS = new Set(FEATURED.map((f) => f.id));

// Health notes shown on the card and the pick. The mud advice comes from the
// Zaton resort blog (research/activities.json notes), not a medical body.
const CAUTION = {
  'nin-healing-mud': {
    en: 'If you have a heart condition or high blood pressure, ask your doctor first.',
    de: 'Bei Herzerkrankungen oder Bluthochdruck vorher ärztlich abklären.',
    sl: 'Če imate bolezen srca ali visok krvni tlak, se prej posvetujte z zdravnikom.',
    hr: 'Ako imate srčanih tegoba ili visok krvni tlak, prije se posavjetujte s liječnikom.',
    it: 'Se avete problemi cardiaci o pressione alta, consultate prima il vostro medico.',
  },
};

// Price wording where "from {min}" would mislead; facts from each item's priceDetails.
const PRICE = {
  'dolphin-watching-molat': { en: 'about €50 incl. park fees', de: 'ca. 50 € inkl. Parkgebühren', sl: 'približno 50 € z vstopnino za park', hr: 'oko 50 € s ulaznicom za park', it: 'circa 50 € ingresso al parco incluso' },
  'gligora-cheese-tour': { en: '€15 (under-10s free)', de: '15 € (unter 10 Jahren frei)', sl: '15 € (otroci do 10 let brezplačno)', hr: '15 € (djeca do 10 godina besplatno)', it: '15 € (gratis sotto i 10 anni)' },
  'kite-school-zdrijac': { en: '€95 / h · Discover 2 h €165', de: '95 € / Std. · Schnupperkurs 2 Std. 165 €', sl: '95 € / h · Discover 2 h 165 €', hr: '95 € / h · Discover 2 h 165 €', it: '95 € / h · Discover 2 h 165 €' },
};
// Paklenica adult 1-day ticket by month (official 2026 price list).
const PARK_FEE = { 1: 5, 2: 5, 3: 8, 4: 8, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10, 10: 8, 11: 5, 12: 5 };

// Tours whose meeting point is not published: no drive time from the house.
const NO_MEETING_POINT = new Set(['pag-mars-day-tour-from-razanac']);

// Copy fixes where the research text was written for us, not for guests.
const OVERRIDES = {
  'pag-life-on-mars-trail': { description: FEATURED[1].text },
  'sup-kayak-nin-lagoon': {
    howToBook: {
      en: 'No SUP or kayak rental in Nin has been verified yet. Bring your own board, or ask us before you come.',
      de: 'Ein SUP- oder Kajakverleih in Nin ist noch nicht bestätigt. Bringen Sie Ihr eigenes Board mit oder fragen Sie uns vorher.',
      sl: 'Izposoje SUP-ov ali kajakov v Ninu še nismo preverili. Prinesite svojo desko ali nas vprašajte pred prihodom.',
      hr: 'Najam SUP-a ili kajaka u Ninu još nismo provjerili. Ponesite svoju dasku ili nas pitajte prije dolaska.',
      it: 'Non abbiamo ancora verificato un noleggio di SUP o kayak a Nin. Portate la vostra tavola o chiedeteci prima di venire.',
    },
  },
  'event-privlaka-fishermen-night': {
    description: {
      en: 'Privlaka’s own summer evening, in our home municipality. Photo exhibitions and films celebrate the village’s fishermen and its “sabunjari”, with local food and klapa singing.',
      de: 'Privlakas eigener Sommerabend, in unserer Heimatgemeinde. Fotoausstellungen und Filme feiern die Fischer des Dorfes und seine „Sabunjari“, mit lokalem Essen und Klapa-Gesang.',
      sl: 'Poletni večer Privlake, v naši domači občini. Fotografske razstave in filmi slavijo vaške ribiče in njihove »sabunjare«, ob domači hrani in petju klap.',
      hr: 'Privlačka ljetna večer, u našoj općini. Izložbe fotografija i filmovi slave mjesne ribare i njihove „sabunjare”, uz domaću hranu i klapsko pjevanje.',
      it: 'La serata estiva di Privlaka, il nostro comune. Mostre fotografiche e film celebrano i pescatori del paese e i suoi «sabunjari», con cucina locale e canto a cappella delle klape.',
    },
  },
};

// Road drive times from the house, measured 2026-10-16 with the OSRM demo
// server (car profile): router.project-osrm.org/route/v1/driving/15.1589,44.2587;<lon>,<lat>
// [minutes, km]. Locations missing here (an islet, one implausible route) fall
// back to the straight-line estimate in util.travelMinutes().
const ROAD = {
  'kite-school-zdrijac': [10, 5.6], 'windsurf-nin-lagoon': [8, 2.1], 'pag-life-on-mars-trail': [102, 88.7], 'pag-life-on-mars-guided-hikes': [102, 88.7],
  'event-life-on-mars-trail-race': [99, 87.7], 'nin-healing-mud': [6, 1.8], 'nin-salt-works-tour': [7, 4.3],
  'event-nin-salt-festival': [7, 4.3], 'nin-birdwatching': [7, 4.3], 'sup-kayak-nin-lagoon': [9, 5.4], 'boat-kornati-telascica': [26, 20.5],
  'boat-sakarun-dugi-otok': [26, 20.5], 'islands-silba-molat-ferry': [27, 20.4], 'dolphin-watching-molat': [9, 6.4], 'diving-zadar-archipelago': [36, 28.2],
  'snorkeling-duboka-draga': [25, 11.4], 'fishing-trips': [7, 4.9], 'sailing-regatta-teambuilding': [23, 17.5], 'horse-riding-nin-zaton': [9, 6.4],
  'zrmanja-rafting-kayak': [85, 78.6], 'paklenica-hiking': [65, 57.1], 'paklenica-climbing': [69, 58.5], 'wine-kraljevski-vinogradi': [18, 10.3],
  'wine-ravni-kotari-route': [50, 40], 'olive-lun-ancient-groves': [107, 96.1], 'olive-harvest-ljubac': [28, 21.7], 'cooking-class-ninski-stanovi': [10, 7.1],
  'cooking-class-zadar-market': [26, 20], 'gligora-cheese-tour': [75, 68.9], 'zrce-nightlife': [83, 75.6], 'nin-cycling-network': [9, 5.4],
  'event-festival-sun-light': [9, 5.1], 'event-ninska-sokolijada': [9, 5.4], 'event-nin-patron-days': [9, 5.4], 'event-privlaka-fishermen-night': [7, 4.9],
  'event-pag-summer-carnival': [60, 53.7], 'event-kolan-cheese-festival': [74, 67.9], 'event-zadar-full-moon-festival': [26, 20.5], 'event-musical-evenings-st-donatus': [29, 21.3],
};

// Routed walking km from the gate for spots close enough to walk or cycle to:
// the same OSRM foot routes as beaches.js ROAD ('kraljicina-plaza' to its
// nearest end, 'nin-lagoon-healing-mud'), so both sections give the same times.
const WALK_KM = { 'windsurf-nin-lagoon': 1.38, 'nin-healing-mud': 2.34 };
const WALK_MAX_KM = 1.6; // longer than this: show the bike time (bestMode in util.js)
const SPEED = { walk: 5, bike: 16 }; // km/h, as in beaches.js

// Park entry fees are not activity prices; label them as such.
const PARK_TICKET = new Set(['paklenica-hiking', 'paklenica-climbing']);

// Extra icons for categories (same 24px stroke style as util.icon).
const EXTRA_ICONS = {
  glass: '<path d="M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v7M8 21h8"/>',
  columns: '<path d="M3 9h18L12 4zM5 9v9M10 9v9M14 9v9M19 9v9M3 21h18M4 18h16"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
};
function ic(name, size = 18) {
  if (!EXTRA_ICONS[name]) return icon(name, { size });
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA_ICONS[name]}</svg>`;
}

// Decorative illustrations for the picks, drawn in the category colour (--c).
const ART = {
  mars: `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="200" fill="color-mix(in srgb, var(--c) 10%, var(--surface))"/>
    <g fill="var(--c)" opacity=".5">${[[40, 30], [90, 18], [150, 40], [230, 22], [300, 34], [360, 16], [330, 60], [70, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>
    <circle cx="318" cy="52" r="20" fill="color-mix(in srgb, var(--c) 22%, var(--surface))"/>
    <path d="M0 150 60 104l40 26 50-50 60 54 40-24 70 44 80-44v90H0z" fill="color-mix(in srgb, var(--c) 18%, var(--surface))"/>
    <path d="M0 176 70 136l44 22 66-40 56 40 48-20 116 30v32H0z" fill="color-mix(in srgb, var(--c) 30%, var(--surface))"/>
    <path d="M0 200v-14l100-14 90 10 110-18 100 16v20z" fill="color-mix(in srgb, var(--c) 45%, var(--surface))"/>
    <path d="M120 158l6-4 6 3M210 140l5-3 7 4M300 166l6-3 5 2" stroke="var(--surface)" stroke-width="2" fill="none"/>
  </svg>`,
  mud: `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="200" fill="color-mix(in srgb, var(--c) 9%, var(--surface))"/>
    ${[90, 70, 50, 30].map((r, k) => `<ellipse cx="200" cy="120" rx="${r * 2}" ry="${r * 0.7}" fill="none" stroke="var(--c)" stroke-opacity="${0.15 + k * 0.12}" stroke-width="3"/>`).join('')}
    <ellipse cx="200" cy="120" rx="34" ry="12" fill="color-mix(in srgb, var(--c) 40%, var(--surface))"/>
    <circle cx="320" cy="50" r="18" fill="color-mix(in srgb, var(--c) 22%, var(--surface))"/>
  </svg>`,
  salt: `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="200" fill="color-mix(in srgb, var(--c) 8%, var(--surface))"/>
    ${Array.from({ length: 18 }, (_, k) => {
      const x = 10 + (k % 6) * 65;
      const y = 40 + Math.floor(k / 6) * 52;
      return `<rect x="${x}" y="${y}" width="58" height="44" rx="4" fill="color-mix(in srgb, var(--c) ${10 + ((k * 7) % 4) * 9}%, var(--surface))" stroke="var(--c)" stroke-opacity=".25"/>`;
    }).join('')}
    <path d="M300 150l16-22 16 22z" fill="var(--surface)" stroke="var(--c)" stroke-opacity=".5"/>
  </svg>`,
  boat: `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="200" fill="color-mix(in srgb, var(--c) 9%, var(--surface))"/>
    <path d="M0 120c60-40 90-36 130 0zM150 124c40-30 80-34 120-4 20-6 40-10 60 4z" fill="color-mix(in srgb, var(--c) 26%, var(--surface))"/>
    <path d="M0 124h400v76H0z" fill="color-mix(in srgb, var(--c) 16%, var(--surface))"/>
    <path d="M0 150c30-6 50 6 80 0s50 6 80 0 50 6 80 0 50 6 80 0 50 6 80 0M0 176c30-6 50 6 80 0s50 6 80 0 50 6 80 0 50 6 80 0 50 6 80 0" stroke="var(--surface)" stroke-width="2" fill="none" opacity=".8"/>
    <path d="M250 140h70l-10 12h-52z" fill="var(--c)" opacity=".75"/><path d="M282 140v-32l22 32z" fill="color-mix(in srgb, var(--c) 45%, var(--surface))"/>
  </svg>`,
};

// ---------------------------------------------------------------- helpers
const fill = (s, vars) => Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v), s);
const fmtEUR = (v, lang) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: v % 1 ? 2 : 0 }).format(v);
const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};
const txt = (item, key, t) => t(OVERRIDES[item.id]?.[key] || item[key] || '');

// Drive from the house: measured road route, else the straight-line estimate.
// Unknown meeting point: { min: null, unknown: true }.
export function driveFor(item) {
  if (NO_MEETING_POINT.has(item.id)) return { min: null, km: null, measured: false, unknown: true };
  const r = ROAD[item.id];
  if (r) return { min: r[0], km: r[1], measured: true };
  return { min: travelMinutes(item.km, 'car'), km: item.km * 1.35, measured: false };
}

// Between two stops: never less than the difference of their drive times from
// the house (triangle inequality), nor less than the straight-line estimate, nor
// under 5 min (parking; the Nin lagoon forces road detours between its shores).
// null when either end has no known meeting point.
function legMinutes(a, b) {
  const [da, db] = [driveFor(a), driveFor(b)];
  if (da.unknown || db.unknown) return null;
  const straight = haversineKm([a.location.lat, a.location.lon], [b.location.lat, b.location.lon]);
  if (straight < 0.3) return 0;
  return Math.max(5, travelMinutes(straight, 'car'), Math.abs(da.min - db.min));
}

const isFullDay = (item) => (item.durationHours || 0) >= FULL_DAY_H;

function monthState(item, m) {
  if (!m) return 'any';
  if (!item.months) return 'unknown';
  return item.months.includes(m) ? 'on' : 'off';
}

function seasonText(item, ctx) {
  const t = ctx.t;
  const ms = item.months;
  if (!ms) return t(L.seasonUnknownShort);
  if (ms.length === 12) return t(L.allYear);
  const sorted = [...ms].sort((a, b) => a - b);
  const contiguous = sorted.every((m, k) => k === 0 || m === sorted[k - 1] + 1);
  if (contiguous && sorted.length > 1) return `${monthName(sorted[0], ctx.lang)}–${monthName(sorted[sorted.length - 1], ctx.lang)}`;
  return sorted.map((m) => monthName(m, ctx.lang)).join(', ');
}

function monthsStrip(item, ctx, sel) {
  const ms = item.months;
  const label = ms ? seasonText(item, ctx) : ctx.t(L.seasonUnknown);
  return `<div class="act-months${ms ? '' : ' is-unknown'}" role="img" aria-label="${esc(label)}">
    <span class="act-dots" aria-hidden="true">${Array.from({ length: 12 }, (_, k) => {
      const m = k + 1;
      const cls = [ms?.includes(m) ? 'on' : '', sel === m ? 'sel' : ''].filter(Boolean).join(' ');
      return `<i class="${cls}" title="${esc(monthName(m, ctx.lang))}"></i>`;
    }).join('')}</span>
    <span class="act-season">${esc(ms ? label : ctx.t(L.seasonUnknownShort))}</span>
  </div>`;
}

function priceHtml(item, ctx, m) {
  const p = item.typicalPriceEUR;
  if (!p || p.min == null) return '';
  const t = ctx.t;
  const src = item.operators?.[0]?.url || item.sources?.[0];
  const srcLink = src ? ` <a class="act-src" href="${esc(src)}" target="_blank" rel="noopener" title="${esc(t(L.priceSource))}: ${esc(host(src))}">${ic('info', 14)}<span class="visually-hidden">${esc(t(L.priceSource))}: ${esc(host(src))} (${esc(t(L.opens))})</span></a>` : '';
  let label;
  if (PRICE[item.id]) label = t(PRICE[item.id]);
  else if (p.min === 0 && !p.max) label = t(L.free);
  else if (PARK_TICKET.has(item.id))
    label = m ? `${fill(t(L.parkTicketIn), monthVars(m, ctx.lang))} ${fmtEUR(PARK_FEE[m], ctx.lang)}` : `${t(L.parkTicket)} ${fmtEUR(p.min, ctx.lang)}–${fmtEUR(p.max, ctx.lang)}`;
  else if (p.min === 0) label = `${t(L.free)} – ${fmtEUR(p.max, ctx.lang)}`;
  else label = `${t(L.from)} ${fmtEUR(p.min, ctx.lang)}`;
  return `<span class="act-price">${ic('euro', 16)}${esc(label)}${srcLink}</span>`;
}

function driveHtml(item, ctx) {
  const d = driveFor(item);
  const t = ctx.t;
  if (d.unknown) return `<span>${ic('pin', 16)}${esc(t(L.meetingPoint))}</span>`;
  const walk = WALK_KM[item.id];
  if (walk) {
    const mode = walk <= WALK_MAX_KM ? 'walk' : 'bike';
    return `<span>${ic(mode, 16)}${esc(t(L.about))} ${esc(formatMinutes((walk / SPEED[mode]) * 60))} ${esc(t(mode === 'walk' ? L.onFoot : L.byBike))}</span>`;
  }
  return `<span>${ic('car', 16)}${d.measured ? '' : `${esc(t(L.about))} `}${esc(formatMinutes(d.min))} ${esc(t(L.drive))} · ${Math.round(d.km)} km</span>`;
}

function durationText(h, ctx) {
  return `${new Intl.NumberFormat(ctx.lang, { maximumFractionDigits: 1 }).format(h)} ${ctx.t(L.hours)}`;
}

function addBtn(item, ctx, plan, cls = '') {
  const inPlan = plan.includes(item.id);
  const full = !inPlan && plan.length >= MAX_PLAN;
  return `<button type="button" class="btn btn-small act-add ${cls}" data-add="${esc(item.id)}" aria-pressed="${inPlan}"${full ? ' aria-disabled="true"' : ''}>
    ${ic(inPlan ? 'check' : 'plus', 16)}<span>${esc(ctx.t(inPlan ? L.added : L.add))}</span></button>`;
}

function cardHtml(item, ctx, view) {
  const t = ctx.t;
  const cat = CATEGORIES[item.category] || CATEGORIES.land;
  const ms = monthState(item, view.month);
  const featured = FEATURED_IDS.has(item.id);
  const ops = (item.operators || []).filter((o) => o.url);
  const howTo = txt(item, 'howToBook', t);
  return `<article class="act-card${ms === 'off' ? ' is-off' : ''}" id="act-${esc(item.id)}" style="--c:${CATEGORY_COLORS[item.category] || '#4b5563'}">
    <div class="act-band">
      <span class="act-cat">${ic(cat.icon, 16)}${esc(t(cat.label))}</span>
      <span class="act-flags">
        ${featured ? `<span class="act-flag">${icon('star', { size: 14 })}${esc(t(L.pick))}</span>` : ''}
        ${item.confidence === 'low' ? `<span class="act-flag act-flag-warn" title="${esc(t(L.unverifiedTitle))}">${ic('info', 14)}${esc(t(L.unverified))}</span>` : ''}
      </span>
    </div>
    <div class="act-body">
      <h3 class="act-name">${esc(item.name)}</h3>
      <p class="meta act-meta">
        <span>${ic('pin', 16)}${esc(item.location?.name || '')}</span>
      </p>
      <p class="meta act-meta">
        ${driveHtml(item, ctx)}
        ${item.durationHours ? `<span>${ic('clock', 16)}${esc(durationText(item.durationHours, ctx))}</span>` : ''}
        ${priceHtml(item, ctx, view.month)}
      </p>
      ${monthsStrip(item, ctx, view.month)}
      ${ms === 'off' ? `<p class="act-off">${esc(fill(t(L.notIn), monthVars(view.month, ctx.lang)))}</p>` : ''}
      <div class="act-desc" data-desc><p>${esc(txt(item, 'description', t))}</p></div>
      <button type="button" class="act-more" data-more aria-expanded="false" hidden>${esc(t(L.more))}</button>
      ${cautionHtml(item, t)}
      ${ops.length ? `<p class="act-ops">${ops.map((o) => `<a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.name)}${ic('ext', 14)}<span class="visually-hidden"> (${esc(t(L.opens))})</span></a>`).join('')}</p>` : ''}
      <div class="act-extra">
      ${howTo || item.priceDetails ? `<details class="act-details"><summary>${esc(t(L.howToBook))}</summary>${howTo ? `<p>${esc(howTo)}</p>` : ''}${item.priceDetails ? `<p class="small">${esc(item.priceDetails)}</p>` : ''}</details>` : ''}
      ${item.sources?.length ? `<details class="act-details act-sources"><summary>${esc(t(L.sources))} (${item.sources.length})</summary><ul>${item.sources.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a></li>`).join('')}</ul></details>` : ''}
      </div>
    </div>
    <div class="act-actions">
      ${addBtn(item, ctx, view.plan)}
      ${view.hasMap && item.location ? `<button type="button" class="btn btn-small btn-ghost" data-map="${esc(item.id)}">${ic('pin', 16)}${esc(t(L.map))}</button>` : ''}
    </div>
  </article>`;
}

function cautionHtml(item, t) {
  return CAUTION[item.id] ? `<p class="act-caution">${ic('info', 16)}<span>${esc(t(CAUTION[item.id]))}</span></p>` : '';
}

function featuredHtml(f, item, ctx, view) {
  const t = ctx.t;
  const cat = CATEGORIES[item.category] || CATEGORIES.land;
  const media = f.photo
    ? `<img src="${photo(f.photo, 'web')}" alt="${esc(t(f.photoAlt))}" loading="lazy" decoding="async" />`
    : ART[f.art] || '';
  return `<article class="act-pick act-pick-${f.size || 'sm'}" style="--c:${CATEGORY_COLORS[item.category]}">
    <div class="act-pick-media"${f.tint ? ` style="--c:${f.tint}"` : ''}>${media}<span class="act-pick-cat" style="--c:${CATEGORY_COLORS[item.category]}">${ic(cat.icon, 16)}${esc(t(cat.label))}</span></div>
    <div class="act-pick-body">
      <h3>${esc(t(f.title))}</h3>
      <p>${esc(t(f.text))}</p>
      ${cautionHtml(item, t)}
      <p class="meta">
        ${driveHtml(item, ctx)}
        <span>${ic('calendar', 16)}${esc(seasonText(item, ctx))}</span>
        ${priceHtml(item, ctx, view.month)}
      </p>
      <div class="act-pick-actions">
        ${addBtn(item, ctx, view.plan)}
        <a class="btn btn-small btn-ghost" href="#act-${esc(item.id)}" data-jump="${esc(item.id)}">${esc(t(L.howToBook))}${ic('arrow', 16)}</a>
      </div>
    </div>
  </article>`;
}

// ---------------------------------------------------------------- plan
function hhmm(min) {
  const m = Math.round(min) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function buildPlan(items, startMin) {
  const steps = [];
  let now = startMin;
  let drive = 0;
  let prev = null;
  for (const it of items) {
    const leg = prev ? legMinutes(prev, it) : driveFor(it).min; // null = meeting point unknown
    drive += leg || 0;
    now += leg || 0;
    const dur = (it.durationHours || 2) * 60;
    steps.push({ item: it, leg, start: now, end: now + dur });
    now += dur;
    prev = it;
  }
  const home = prev ? driveFor(prev).min : 0;
  drive += home || 0;
  const unknown = steps.some((x) => x.leg == null) || home == null;
  return { steps, home, back: now + (home || 0), drive, unknown, length: now + (home || 0) - startMin };
}

function planHtml(ctx, view, data) {
  const t = ctx.t;
  const items = view.plan.map((id) => data.items.find((x) => x.id === id)).filter(Boolean);
  const head = `<div class="act-plan-head"><h3>${ic('calendar', 20)}${esc(t(L.planTitle))}</h3><span class="badge neutral">${items.length} / ${MAX_PLAN}</span></div>`;
  if (!items.length) return `${head}<p class="act-plan-empty">${esc(t(L.planEmpty))}</p>`;
  const p = buildPlan(items, view.start);
  const legLine = (min) =>
    `<li class="act-leg">${ic(min == null ? 'pin' : 'car', 16)}<span>${min == null ? esc(t(L.meetingPoint)) : min ? `${esc(t(L.about))} ${esc(formatMinutes(min))}` : esc(t(L.samePlace))}</span></li>`;
  const warn = [];
  if (p.length > 12 * 60 && items.length > 1) warn.push(t(L.longDay));
  for (const s of p.steps) if (s.end > LATE_END) warn.push(fill(t(L.lateEnd), { a: s.item.name, t: hhmm(s.end) }));
  if (items.some((x) => x.category === 'event')) warn.push(t(L.eventNote));
  if (items.some((x) => x.id === 'nin-salt-works-tour')) warn.push(t(L.saltNote));
  if (view.month) for (const x of items) if (monthState(x, view.month) === 'off') warn.push(fill(t(L.outOfSeason), { a: x.name, ...monthVars(view.month, ctx.lang) }));
  // Start times that would get the plan home after midnight are not offered.
  const starts = START_HOURS.map((h) => {
    const late = buildPlan(items, h * 60).back > 24 * 60;
    return `<option value="${h * 60}"${h * 60 === view.start ? ' selected' : ''}${late ? ' disabled' : ''}>${hhmm(h * 60)}</option>`;
  }).join('');
  return `${head}
    <label class="act-start"><span>${esc(t(L.start))}</span><select data-start>${starts}</select></label>
    <ol class="act-timeline">
      <li class="act-stop act-home"><time>${hhmm(view.start)}</time><span>${ic('bed', 16)}${esc(t(L.leave))}</span></li>
      ${p.steps
        .map(
          (s, k) => `${legLine(s.leg)}
        <li class="act-stop" style="--c:${CATEGORY_COLORS[s.item.category]}">
          <time>${hhmm(s.start)}</time>
          <div>
            <p class="act-stop-name">${esc(s.item.name)}</p>
            <p class="small muted">${esc(durationText(s.item.durationHours || 2, ctx))} · ${esc(hhmm(s.start))}–${esc(hhmm(s.end))}</p>
            <span class="act-stop-tools">
              ${k ? `<button type="button" class="btn btn-small btn-ghost" data-up="${esc(s.item.id)}" aria-label="${esc(t(L.earlier))}: ${esc(s.item.name)}">${ic('up', 16)}</button>` : ''}
              <button type="button" class="btn btn-small btn-ghost" data-remove="${esc(s.item.id)}" aria-label="${esc(t(L.remove))}: ${esc(s.item.name)}">${ic('close', 16)}</button>
            </span>
          </div>
        </li>`,
        )
        .join('')}
      ${legLine(p.home)}
      <li class="act-stop act-home"><time>${hhmm(p.back)}${p.home == null ? "+" : ""}</time><span>${ic('bed', 16)}${esc(t(L.back))}</span></li>
    </ol>
    <dl class="act-plan-sum">
      <div><dt>${esc(t(L.totalDrive))}</dt><dd>${p.drive ? esc(formatMinutes(p.drive)) : ''}${p.unknown ? `<span class="small muted">${p.drive ? ' ' : ''}${esc(t(L.driveUnknown))}</span>` : ''}</dd></div>
      <div><dt>${esc(t(L.dayLength))}</dt><dd>${esc(formatMinutes(p.length))}</dd></div>
    </dl>
    ${warn.length ? `<ul class="act-warn">${warn.map((w) => `<li>${ic('info', 16)}${esc(w)}</li>`).join('')}</ul>` : ''}
    <div class="act-plan-actions">
      <button type="button" class="btn btn-primary" data-send>${icon('chat', { size: 18 })}${esc(t(L.send))}</button>
      <button type="button" class="btn btn-ghost btn-small" data-clear>${esc(t(L.clear))}</button>
    </div>
    <p class="small muted">${esc(t(L.sendNote))}</p>
    <p class="source-note">${esc(t(L.estimate))}</p>`;
}

function planMessage(ctx, view, data) {
  const t = ctx.t;
  const items = view.plan.map((id) => data.items.find((x) => x.id === id)).filter(Boolean);
  const p = buildPlan(items, view.start);
  const head = `${t(L.msgHead)}${view.month ? ` (${monthName(view.month, ctx.lang, true)})` : ''}:`;
  const lines = [head, `${hhmm(view.start)} ${t(L.msgLeave)}`];
  p.steps.forEach((s, k) => lines.push(`${k + 1}. ${hhmm(s.start)} ${s.item.name} (${durationText(s.item.durationHours || 2, ctx)})`));
  lines.push(`${t(L.msgBack)} ${hhmm(p.back)}${p.home == null ? "+" : ""}. ${t(L.msgAsk)}`);
  return lines.join('\n');
}

// Why `id` cannot join `plan` (a toast string key), or null when it fits.
function planBlocker(plan, id, data, start) {
  const get = (x) => data.items.find((i) => i.id === x);
  const items = plan.map(get).filter(Boolean);
  const item = get(id);
  if (!item) return 'missing'; // stale id from an older saved plan
  if (items.length >= MAX_PLAN) return 'fullToast';
  if (items.length && (isFullDay(item) || items.some(isFullDay))) return 'fullDayToast';
  const earliest = Math.min(start, START_HOURS[0] * 60);
  if (buildPlan([...items, item], earliest).back > LATEST_BACK) return 'tooLongToast';
  return null;
}

// Keep only the stops that still fit together (older saved plans may not).
function fitPlan(plan, data, start) {
  return plan.reduce((out, id) => (planBlocker(out, id, data, start) ? out : [...out, id]), []);
}

function loadPlan() {
  try {
    const v = JSON.parse(localStorage.getItem(PLAN_KEY) || '[]');
    return Array.isArray(v) ? v.slice(0, MAX_PLAN) : [];
  } catch {
    return [];
  }
}
function savePlan(plan) {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch {
    /* storage blocked: the plan lives for this page view only */
  }
}

function defaultFilters(ctx) {
  const wanted = ctx.audience.focus?.activityTags || [];
  const short = wanted.map((x) => FOCUS[x]).find(Boolean);
  if (short) return { category: short.category || 'all', tag: short.tag || 'all' };
  let best = 'all';
  let bestHits = 0;
  for (const [id, g] of Object.entries(TAG_GROUPS)) {
    const hits = wanted.filter((x) => g.tags.includes(x)).length;
    if (hits > bestHits) [best, bestHits] = [id, hits];
  }
  return { category: 'all', tag: best };
}

function matches(item, view) {
  if (view.category !== 'all' && item.category !== view.category) return false;
  if (view.tag !== 'all') {
    const tags = TAG_GROUPS[view.tag]?.tags || [];
    if (!item.audienceTags?.some((x) => tags.includes(x))) return false;
  }
  if (view.month && view.onlyMonth && monthState(item, view.month) === 'off') return false;
  return true;
}

// The picks are already shown above the list, so they get no head start here:
// things confirmed for the chosen month first, then the ones tagged for this
// audience (e.g. kite school for kitesurfers), then by drive time.
function sortItems(list, view, focusTags = []) {
  const score = (x) => (view.month && monthState(x, view.month) === 'unknown' ? 1 : 0);
  const fit = (x) => (x.audienceTags?.some((tag) => focusTags.includes(tag)) ? 0 : 1);
  const mins = (x) => driveFor(x).min ?? travelMinutes(x.km, 'car'); // unknown meeting point: sort by distance
  return [...list].sort((a, b) => score(a) - score(b) || fit(a) - fit(b) || mins(a) - mins(b));
}

function toolbarHtml(ctx, view, data) {
  const t = ctx.t;
  const count = (cat) => data.items.filter((x) => cat === 'all' || x.category === cat).length;
  const cats = ['all', ...Object.keys(CATEGORIES).filter((c) => data.items.some((x) => x.category === c))];
  const monthOpts = [`<option value="0">${esc(t(L.anyMonth))}</option>`, ...Array.from({ length: 12 }, (_, k) => `<option value="${k + 1}"${view.month === k + 1 ? ' selected' : ''}>${esc(monthName(k + 1, ctx.lang, true))}</option>`)].join('');
  return `
  <div class="act-filters">
    <div class="act-frow">
      <span class="act-flabel" id="act-cat-l">${esc(t(L.category))}</span>
      <div class="chips" role="group" aria-labelledby="act-cat-l">
        ${cats.map((c) => `<button type="button" class="chip" data-cat="${c}" aria-pressed="${view.category === c}">${c === 'all' ? '' : `<span class="act-chipdot" style="--c:${CATEGORY_COLORS[c]}"></span>`}${esc(c === 'all' ? t(L.all) : t(CATEGORIES[c].label))} <span class="act-n">${count(c)}</span></button>`).join('')}
      </div>
    </div>
    <div class="act-frow">
      <span class="act-flabel" id="act-tag-l">${esc(t(L.forWho))}</span>
      <div class="chips" role="group" aria-labelledby="act-tag-l">
        ${['all', ...Object.keys(TAG_GROUPS)].map((g) => `<button type="button" class="chip" data-tag="${g}" aria-pressed="${view.tag === g}">${esc(g === 'all' ? t(L.anyone) : t(TAG_GROUPS[g].label))}</button>`).join('')}
      </div>
    </div>
    <div class="act-frow act-frow-month">
      <label class="act-flabel" for="act-month">${esc(t(L.when))}</label>
      <select id="act-month" data-month-select>${monthOpts}</select>
      <label class="act-switch${view.month ? '' : ' is-disabled'}">
        <input type="checkbox" data-only ${view.month && view.onlyMonth ? 'checked' : ''} ${view.month ? '' : 'disabled'} />
        <span>${esc(view.month ? fill(t(L.onlyMonth), monthVars(view.month, ctx.lang)) : t(L.pickMonthHint))}</span>
      </label>
    </div>
  </div>`;
}

export default {
  id: 'activities',
  nav: { en: 'Things to do', de: 'Erleben', sl: 'Doživetja', hr: 'Doživljaji', it: 'Cosa fare' },

  render(ctx) {
    const t = ctx.t;
    const title = L.title[ctx.audience.id] || L.title.general;
    return `<div class="container">
      <header class="section-head">
        <span class="eyebrow">${icon('star', { size: 16 })}${esc(t(L.eyebrow))}</span>
        <h2>${esc(t(title))}</h2>
        <p class="lede">${esc(t(L.lede))}</p>
      </header>
      <div data-app>
        <div class="act-skeleton" aria-busy="true">
          <div class="act-sk act-sk-lg"></div><div class="act-sk act-sk-lg"></div>
          <div class="act-sk"></div><div class="act-sk"></div><div class="act-sk"></div>
          <p class="muted">${esc(t(L.loading))}</p>
        </div>
      </div>
      <p class="error-box" data-mount-error hidden>${esc(t(L.mountError))}</p>
    </div>`;
  },

  async mount(el, ctx) {
    const app = el.querySelector('[data-app]');
    let data;
    try {
      ({ default: data } = await import('../data/activities.json'));
    } catch (err) {
      app.innerHTML = ''; // drop the skeleton; main.js then shows [data-mount-error]
      throw err;
    }
    const t = ctx.t;
    const view = {
      ...defaultFilters(ctx),
      month: ctx.state.month,
      onlyMonth: true,
      showAll: false,
      plan: [],
      start: 9 * 60,
      hasMap: ctx.audience.sections.includes('explore'),
    };

    app.innerHTML = `
      <h3 class="act-picks-h">${esc(t(L.picks))}</h3>
      <div class="act-picks" data-picks role="region" tabindex="0" aria-label="${esc(t(L.picks))}"></div>
      <div class="act-main">
        <div class="act-list">
          <div data-toolbar></div>
          <div class="act-count-row"><p class="act-count" data-count aria-live="polite"></p><button type="button" class="btn btn-ghost btn-small" data-reset hidden>${esc(t(L.reset))}</button></div>
          <div class="act-grid" data-grid></div>
          <div class="act-more-row"><button type="button" class="btn" data-showall hidden></button></div>
          <p class="source-note act-method">${esc(t(L.method))}</p>
        </div>
        <aside class="act-plan card" data-plan aria-label="${esc(t(L.planTitle))}"></aside>
      </div>`;

    view.plan = fitPlan(loadPlan(), data, view.start);
    const $ = (s) => app.querySelector(s);
    const drawPicks = () => {
      $('[data-picks]').innerHTML = FEATURED.map((f) => {
        const item = data.items.find((x) => x.id === f.id);
        return item ? featuredHtml(f, item, ctx, view) : '';
      }).join('');
    };
    const drawToolbar = () => ($('[data-toolbar]').innerHTML = toolbarHtml(ctx, view, data));
    const drawPlan = () => ($('[data-plan]').innerHTML = planHtml(ctx, view, data));
    // "Read more" shows when the text is clamped, and on phones also when the
    // card has booking info or sources (hidden there until the card is opened).
    const clampDescriptions = () => {
      const mobile = matchMedia(MOBILE_Q).matches;
      for (const d of app.querySelectorAll('[data-grid] [data-desc]')) {
        const btn = d.parentElement.querySelector('[data-more]');
        const extra = mobile && d.parentElement.querySelector('.act-extra')?.children.length;
        btn.hidden = btn.getAttribute('aria-expanded') !== 'true' && !extra && d.scrollHeight <= d.clientHeight + 2;
      }
    };
    const openCard = (card, open) => {
      const btn = card?.querySelector('[data-more]');
      if (!btn) return;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = t(open ? L.less : L.more);
      card.querySelector('[data-desc]').classList.toggle('is-open', open);
      card.classList.toggle('is-open', open);
    };
    const drawGrid = () => {
      const list = sortItems(data.items.filter((x) => matches(x, view)), view, ctx.audience.focus?.activityTags);
      const shown = view.showAll ? list : list.slice(0, FIRST_CARDS[matchMedia(MOBILE_Q).matches ? 'mobile' : 'desktop']);
      $('[data-grid]').innerHTML = shown.length ? shown.map((x) => cardHtml(x, ctx, view)).join('') : `<p class="act-none">${esc(t(L.none))}</p>`;
      $('[data-count]').textContent = fill(t(L.results[new Intl.PluralRules(ctx.lang).select(list.length)] || L.results.other), { n: String(list.length) });
      const def = defaultFilters(ctx);
      $('[data-reset]').hidden = view.category === def.category && view.tag === def.tag;
      const more = $('[data-showall]');
      more.hidden = list.length <= shown.length;
      more.textContent = fill(t(L.showAll), { n: String(list.length) });
      requestAnimationFrame(clampDescriptions);
    };
    const syncAddButtons = () => {
      for (const b of app.querySelectorAll('[data-add]')) {
        const inPlan = view.plan.includes(b.dataset.add);
        b.setAttribute('aria-pressed', String(inPlan));
        if (!inPlan && view.plan.length >= MAX_PLAN) b.setAttribute('aria-disabled', 'true');
        else b.removeAttribute('aria-disabled');
        b.innerHTML = `${ic(inPlan ? 'check' : 'plus', 16)}<span>${esc(t(inPlan ? L.added : L.add))}</span>`;
      }
    };
    const planChanged = () => {
      savePlan(view.plan);
      drawPlan();
      syncAddButtons();
    };

    drawPicks();
    drawToolbar();
    drawGrid();
    drawPlan();

    const onClick = (e) => {
      const q = (sel) => e.target.closest(sel);
      let b;
      if ((b = q('[data-cat]'))) {
        view.category = b.dataset.cat;
        view.showAll = false;
        drawToolbar();
        drawGrid();
      } else if ((b = q('[data-tag]'))) {
        view.tag = b.dataset.tag;
        view.showAll = false;
        drawToolbar();
        drawGrid();
      } else if (q('[data-reset]')) {
        Object.assign(view, defaultFilters(ctx), { showAll: false });
        drawToolbar();
        drawGrid();
      } else if (q('[data-showall]')) {
        view.showAll = true;
        drawGrid();
      } else if ((b = q('[data-more]'))) {
        openCard(b.closest('.act-card'), b.getAttribute('aria-expanded') !== 'true');
      } else if ((b = q('[data-add]'))) {
        const id = b.dataset.add;
        if (view.plan.includes(id)) view.plan = view.plan.filter((x) => x !== id);
        else {
          const blocked = planBlocker(view.plan, id, data, view.start);
          if (blocked) return toast(t(L[blocked]));
          view.plan = [...view.plan, id];
          // The plan updating in view is feedback enough; the toast would cover its buttons.
          const r = $('[data-plan]').getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) toast(t(L.addedToast), 1800);
        }
        planChanged();
        // A late start can stop fitting once the plan grows: move to the latest start that still fits.
        const stops = view.plan.map((x) => data.items.find((i) => i.id === x));
        if (buildPlan(stops, view.start).back > 24 * 60) {
          view.start = [...START_HOURS].reverse().map((h) => h * 60).find((m) => buildPlan(stops, m).back <= 24 * 60) ?? START_HOURS[0] * 60;
          drawPlan();
        }
      } else if ((b = q('[data-remove]'))) {
        view.plan = view.plan.filter((x) => x !== b.dataset.remove);
        planChanged();
      } else if ((b = q('[data-up]'))) {
        const i = view.plan.indexOf(b.dataset.up);
        if (i > 0) [view.plan[i - 1], view.plan[i]] = [view.plan[i], view.plan[i - 1]];
        planChanged();
      } else if (q('[data-clear]')) {
        view.plan = [];
        planChanged();
      } else if (q('[data-send]')) {
        ctx.bus.emit('inquiry:prefill', { message: planMessage(ctx, view, data), month: view.month || undefined, purpose: ctx.audience.inquiry?.purpose });
      } else if ((b = q('[data-map]'))) {
        const item = data.items.find((x) => x.id === b.dataset.map);
        ctx.bus.emit('map:focus', { id: item.id, lat: item.location.lat, lon: item.location.lon, zoom: 13 });
        document.getElementById('explore')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      } else if ((b = q('[data-jump]'))) {
        // Make sure the card is rendered (filters could hide it), then open its booking info.
        e.preventDefault();
        const id = b.dataset.jump;
        if (!app.querySelector(`#act-${CSS.escape(id)}`)) {
          Object.assign(view, { category: 'all', tag: 'all', showAll: true, onlyMonth: false });
          drawToolbar();
          drawGrid();
        }
        const card = app.querySelector(`#act-${CSS.escape(id)}`);
        if (matchMedia(MOBILE_Q).matches) openCard(card, true);
        card?.querySelector('.act-details')?.setAttribute('open', '');
        card?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        card?.querySelector('summary')?.focus({ preventScroll: true });
      }
    };
    const onChange = (e) => {
      if (e.target.matches('[data-month-select]')) ctx.setState({ month: Number(e.target.value) });
      else if (e.target.matches('[data-only]')) {
        view.onlyMonth = e.target.checked;
        drawGrid();
      } else if (e.target.matches('[data-start]')) {
        view.start = Number(e.target.value);
        drawPlan();
      }
    };
    app.addEventListener('click', onClick);
    app.addEventListener('change', onChange);
    const ro = new ResizeObserver(() => clampDescriptions());
    ro.observe($('[data-grid]'));

    // Called by update() when the global month changes.
    controllers.set(el, {
      setMonth(m) {
        // The month is usually picked further down the page (seasons). If this
        // section sits above the viewport, keep what the visitor sees in place
        // when the list changes height.
        const before = el.getBoundingClientRect();
        // The toolbar is redrawn: keep keyboard focus on the month select.
        const refocus = document.activeElement?.matches?.('[data-month-select]') && app.contains(document.activeElement);
        view.month = m;
        if (m) view.onlyMonth = true;
        drawToolbar();
        if (refocus) app.querySelector('[data-month-select]')?.focus();
        drawGrid();
        drawPlan();
        if (before.bottom < 0) window.scrollBy(0, el.getBoundingClientRect().height - before.height);
      },
    });

    return () => {
      app.removeEventListener('click', onClick);
      app.removeEventListener('change', onChange);
      ro.disconnect();
      controllers.delete(el);
    };
  },

  update(el, ctx, changed) {
    if (changed.includes('month')) controllers.get(el)?.setMonth(ctx.state.month);
  },
};

