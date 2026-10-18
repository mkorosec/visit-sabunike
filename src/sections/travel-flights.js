// "Direct flights to Zadar": route map (Leaflet arcs) or an airport-style
// arrivals board, with month + airline filters and a "find my airport" search.
// Used by travel.js. Data: src/data/travel.json (routes = summer 2026 timetable
// of Zadar Airport, normalised by scripts/build-data.mjs).

import { esc, icon, monthName, haversineKm, prefersReducedMotion } from '../lib/util.js';
import { monthIn } from './live-weather.js';

// ---------------------------------------------------------------------------
// UI strings (en, de, sl, hr, it)
// ---------------------------------------------------------------------------
// Plural form for a count; forms keyed by Intl.PluralRules category (sl has one/two/few/other).
const pl = (lang, n, forms) => forms[new Intl.PluralRules(lang).select(n)] ?? forms.other;
const FLIGHTS = {
  sl: { one: 'let', two: 'leta', few: 'leti', other: 'letov' },
  hr: { one: 'let', few: 'leta', other: 'letova' },
  it: { one: 'volo', other: 'voli' },
};

export const TF = {
  title: { en: 'Direct flights to Zadar', de: 'Direktflüge nach Zadar', sl: 'Neposredni leti do Zadra', hr: 'Izravni letovi za Zadar', it: 'Voli diretti per Zadar' },
  sub: {
    en: (r) => `Zadar Airport (ZAD) is about ${r} minutes from our gate by car. Pick your travel month and see who flies in.`,
    de: (r) => `Der Flughafen Zadar (ZAD) liegt etwa ${r} Autominuten von unserem Tor entfernt. Wählen Sie Ihren Reisemonat und sehen Sie, wer hierher fliegt.`,
    sl: (r) => `Letališče Zadar (ZAD) je od naših vrat oddaljeno približno ${r} minut vožnje. Izberite mesec potovanja in poglejte, kdo leti sem.`,
    hr: (r) => `Zračna luka Zadar (ZAD) udaljena je od naših vrata oko ${r} minuta vožnje. Odaberite mjesec putovanja i pogledajte tko leti ovamo.`,
    it: (r) => `L’aeroporto di Zadar (ZAD) è a circa ${r} minuti d’auto dal nostro cancello. Scegliete il mese del viaggio e scoprite chi vola qui.`,
  },
  view: { en: 'View', de: 'Ansicht', sl: 'Prikaz', hr: 'Prikaz', it: 'Vista' },
  viewMap: { en: 'Map', de: 'Karte', sl: 'Zemljevid', hr: 'Karta', it: 'Mappa' },
  viewBoard: { en: 'Board', de: 'Anzeigetafel', sl: 'Tabla', hr: 'Ploča', it: 'Tabellone' },
  month: { en: 'Travel month', de: 'Reisemonat', sl: 'Mesec potovanja', hr: 'Mjesec putovanja', it: 'Mese del viaggio' },
  any: { en: 'Any', de: 'Alle', sl: 'Vsi', hr: 'Svi', it: 'Tutti' },
  routesIn: {
    en: (n, m) => `${n} direct routes in ${m}`,
    de: (n, m) => `${n} Direktverbindungen im ${m}`,
    sl: (n, m, k) => `${n} ${pl('sl', n, { one: 'neposredna linija', two: 'neposredni liniji', few: 'neposredne linije', other: 'neposrednih linij' })} v ${monthIn(k, 'sl')}`,
    hr: (n, m, k) => `${n} ${pl('hr', n, { one: 'izravna linija', few: 'izravne linije', other: 'izravnih linija' })} u ${monthIn(k, 'hr')}`,
    it: (n, m) => `${n} ${pl('it', n, { one: 'collegamento diretto', other: 'collegamenti diretti' })} in ${m}`,
  },
  airline: { en: 'Airline', de: 'Fluggesellschaft', sl: 'Letalska družba', hr: 'Zrakoplovna kompanija', it: 'Compagnia aerea' },
  allAirlines: { en: 'All airlines', de: 'Alle Airlines', sl: 'Vse letalske družbe', hr: 'Sve kompanije', it: 'Tutte le compagnie' },
  moreAirlines: { en: (n) => `+ ${n} more`, de: (n) => `+ ${n} weitere`, sl: (n) => `+ še ${n}`, hr: (n) => `+ još ${n}`, it: (n) => `+ altre ${n}` },
  fewerAirlines: { en: 'Fewer', de: 'Weniger', sl: 'Manj', hr: 'Manje', it: 'Meno' },
  find: { en: 'Find my airport', de: 'Mein Flughafen', sl: 'Poiščite svoje letališče', hr: 'Pronađite svoju zračnu luku', it: 'Trovate il vostro aeroporto' },
  findBtn: { en: 'Find', de: 'Suchen', sl: 'Poišči', hr: 'Traži', it: 'Cerca' },
  findPh: { en: 'City or code, e.g. Vienna, STN', de: 'Stadt oder Code, z. B. Wien', sl: 'Mesto ali koda, npr. Dunaj, STN', hr: 'Grad ili kod, npr. Beč, STN', it: 'Città o codice, es. Vienna, STN' },
  clear: { en: 'Clear search', de: 'Suche löschen', sl: 'Počisti iskanje', hr: 'Očisti pretragu', it: 'Cancella la ricerca' },
  matches: {
    en: (n) => `${n} matching airports`,
    de: (n) => `${n} passende Flughäfen`,
    sl: (n) => `Ujemajoča se letališča: ${n}`,
    hr: (n) => `Pronađene zračne luke: ${n}`,
    it: (n) => `Aeroporti trovati: ${n}`,
  },
  // Labels under a number: the noun agrees with the count (sl/hr plural forms).
  statRoutes: {
    en: 'direct routes',
    de: 'Direktverbindungen',
    sl: (n) => pl('sl', n, { one: 'neposredna linija', two: 'neposredni liniji', few: 'neposredne linije', other: 'neposrednih linij' }),
    hr: (n) => pl('hr', n, { one: 'izravna linija', few: 'izravne linije', other: 'izravnih linija' }),
    it: (n) => pl('it', n, { one: 'collegamento diretto', other: 'collegamenti diretti' }),
  },
  statCountries: {
    en: 'countries',
    de: 'Länder',
    sl: (n) => pl('sl', n, { one: 'država', two: 'državi', few: 'države', other: 'držav' }),
    hr: (n) => pl('hr', n, { one: 'zemlja', few: 'zemlje', other: 'zemalja' }),
    it: (n) => pl('it', n, { one: 'paese', other: 'paesi' }),
  },
  statAirlines: {
    en: 'airlines',
    de: 'Airlines',
    sl: (n) => pl('sl', n, { one: 'letalska družba', two: 'letalski družbi', few: 'letalske družbe', other: 'letalskih družb' }),
    hr: (n) => pl('hr', n, { one: 'zrakoplovna kompanija', few: 'zrakoplovne kompanije', other: 'zrakoplovnih kompanija' }),
    it: (n) => pl('it', n, { one: 'compagnia aerea', other: 'compagnie aeree' }),
  },
  statWeekly: {
    en: 'flights in a busy week',
    de: 'Flüge in einer starken Woche',
    sl: (n) => `${pl('sl', n, FLIGHTS.sl)} v prometnem tednu`,
    hr: (n) => `${pl('hr', n, FLIGHTS.hr)} u prometnom tjednu`,
    it: (n) => `${pl('it', n, FLIGHTS.it)} in una settimana di punta`,
  },
  statWeeklyPeak: {
    en: 'flights a week in midsummer',
    de: 'Flüge pro Woche im Hochsommer',
    sl: (n) => `${pl('sl', n, FLIGHTS.sl)} na teden sredi poletja`,
    hr: (n) => `${pl('hr', n, FLIGHTS.hr)} tjedno usred ljeta`,
    it: (n) => `${pl('it', n, FLIGHTS.it)} a settimana in piena estate`,
  },
  inMonth: {
    en: (m) => `in ${m}`,
    de: (m) => `im ${m}`,
    sl: (m, k) => `v ${monthIn(k, 'sl')}`,
    hr: (m, k) => `u ${monthIn(k, 'hr')}`,
    it: (m) => `in ${m}`,
  },
  summerPeak: { en: 'summer 2026', de: 'Sommer 2026', sl: 'poletje 2026', hr: 'ljeto 2026.', it: 'estate 2026' },
  atLeast: { en: 'at least', de: 'mindestens', sl: 'vsaj', hr: 'najmanje', it: 'almeno' },
  byCountry: {
    en: (n) => `All ${n} airports by country`,
    de: (n) => `Alle ${n} Flughäfen nach Land`,
    sl: (n) => `Vsa letališča po državah (${n})`,
    hr: (n) => `Sve zračne luke po zemljama (${n})`,
    it: (n) => `Tutti i ${n} aeroporti per paese`,
  },
  perWeek: { en: '/wk', de: '/Wo.', sl: '/teden', hr: '/tj.', it: '/sett.' },
  perWeekLong: {
    en: (n) => `up to ${n} ${n === 1 ? 'flight' : 'flights'} a week`,
    de: (n) => `bis zu ${n} ${n === 1 ? 'Flug' : 'Flüge'} pro Woche`,
    sl: (n) => `do ${n} ${pl('sl', n, { one: 'leta', other: 'letov' })} na teden`,
    hr: (n) => `do ${n} ${pl('hr', n, { one: 'leta', few: 'leta', other: 'letova' })} tjedno`,
    it: (n) => `fino a ${n} ${pl('it', n, FLIGHTS.it)} a settimana`,
  },
  freqUnknown: { en: 'frequency not published', de: 'Frequenz nicht veröffentlicht', sl: 'pogostost ni objavljena', hr: 'učestalost nije objavljena', it: 'frequenza non pubblicata' },
  pickHint: {
    en: 'Tap an airport on the map, choose one from the list, or search for your city.',
    de: 'Tippen Sie auf einen Flughafen in der Karte, wählen Sie ihn aus der Liste oder suchen Sie Ihre Stadt.',
    sl: 'Tapnite letališče na zemljevidu, ga izberite s seznama ali poiščite svoje mesto.',
    hr: 'Dodirnite zračnu luku na karti, odaberite je s popisa ili potražite svoj grad.',
    it: 'Toccate un aeroporto sulla mappa, sceglietelo dall’elenco o cercate la vostra città.',
  },
  busiest: {
    en: (m) => `Busiest routes ${m}`,
    de: (m) => `Meistbeflogene Strecken ${m}`,
    sl: (m) => `Najbolj prometne linije ${m}`,
    hr: (m) => `Najprometnije linije ${m}`,
    it: (m) => `Rotte più frequentate ${m}`,
  },
  fliesIn: {
    en: (m, n) => `Flies in ${m}${n ? ` · up to ${n} ${n === 1 ? 'flight' : 'flights'} a week` : ''}`,
    de: (m, n) => `Fliegt im ${m}${n ? ` · bis zu ${n} ${n === 1 ? 'Flug' : 'Flüge'} pro Woche` : ''}`,
    sl: (m, n, k) => `Leti v ${monthIn(k, 'sl')}${n ? ` · do ${n} ${pl('sl', n, { one: 'leta', other: 'letov' })} na teden` : ''}`,
    hr: (m, n, k) => `Leti u ${monthIn(k, 'hr')}${n ? ` · do ${n} ${pl('hr', n, { one: 'leta', few: 'leta', other: 'letova' })} tjedno` : ''}`,
    it: (m, n) => `Vola in ${m}${n ? ` · fino a ${n} ${pl('it', n, FLIGHTS.it)} a settimana` : ''}`,
  },
  notIn: {
    en: (m, s) => `No flights in ${m}. Season: ${s}`,
    de: (m, s) => `Keine Flüge im ${m}. Saison: ${s}`,
    sl: (m, s, k) => `V ${monthIn(k, 'sl')} ni letov. Sezona: ${s}`,
    hr: (m, s, k) => `U ${monthIn(k, 'hr')} nema letova. Sezona: ${s}`,
    it: (m, s) => `Nessun volo in ${m}. Stagione: ${s}`,
  },
  notWithAirline: { en: (a) => `Not flown by ${a}`, de: (a) => `Nicht mit ${a}`, sl: (a) => `${a} na tej liniji ne leti`, hr: (a) => `${a} ne leti na ovoj liniji`, it: (a) => `Non operato da ${a}` },
  season: { en: 'Season', de: 'Saison', sl: 'Sezona', hr: 'Sezona', it: 'Stagione' },
  yearRound: { en: 'Year-round', de: 'Ganzjährig', sl: 'Vse leto', hr: 'Cijele godine', it: 'Tutto l’anno' },
  winterLeg: {
    en: (n) => `winter 2026/27${n ? `, about ${n} flights a week` : ''} (exact dates not published)`,
    de: (n) => `Winter 2026/27${n ? `, etwa ${n} Flüge pro Woche` : ''} (genaue Daten nicht veröffentlicht)`,
    sl: (n) => `zima 2026/27${n ? `, približno ${n} ${pl('sl', n, FLIGHTS.sl)} na teden` : ''} (točni datumi niso objavljeni)`,
    hr: (n) => `zima 2026./27.${n ? `, oko ${n} ${pl('hr', n, FLIGHTS.hr)} tjedno` : ''} (točni datumi nisu objavljeni)`,
    it: (n) => `inverno 2026/27${n ? `, circa ${n} ${pl('it', n, FLIGHTS.it)} a settimana` : ''} (date esatte non pubblicate)`,
  },
  lowConf: {
    en: 'Unconfirmed: this may be a tour-operator charter rather than a flight you can book on your own.',
    de: 'Unbestätigt: möglicherweise ein Charter eines Reiseveranstalters und nicht einzeln buchbar.',
    sl: 'Ni potrjeno: morda gre za čarterski let turistične agencije in ne za let, ki ga lahko rezervirate sami.',
    hr: 'Nije potvrđeno: možda je riječ o čarteru turoperatora, a ne o letu koji možete sami rezervirati.',
    it: 'Non confermato: potrebbe essere un charter di un tour operator e non un volo prenotabile da soli.',
  },
  charterLeg: { en: 'charter: may not be bookable as a seat only', de: 'Charter: evtl. nicht als Einzelplatz buchbar', sl: 'čarter: samega sedeža morda ni mogoče rezervirati', hr: 'čarter: samo sjedalo možda nije moguće rezervirati', it: 'charter: forse non prenotabile come solo volo' },
  unconfirmed: { en: '(unconfirmed)', de: '(unbestätigt)', sl: '(ni potrjeno)', hr: '(nije potvrđeno)', it: '(non confermato)' },
  boardFoot: {
    en: '* Unconfirmed: may be a tour-operator charter.',
    de: '* Unbestätigt: möglicherweise ein Charter eines Reiseveranstalters.',
    sl: '* Ni potrjeno: morda čarterski let turistične agencije.',
    hr: '* Nije potvrđeno: možda čarter turoperatora.',
    it: '* Non confermato: potrebbe essere un charter di un tour operator.',
  },
  noRowsQuery: {
    en: 'Press “Find” to look up the nearest airport with a direct flight.',
    de: 'Drücken Sie „Suchen“, um den nächsten Flughafen mit Direktflug zu finden.',
    sl: 'Pritisnite »Poišči« in poiskali bomo najbližje letališče z neposrednim letom.',
    hr: 'Pritisnite „Traži” i pronaći ćemo najbližu zračnu luku s izravnim letom.',
    it: 'Premete «Cerca» per trovare l’aeroporto più vicino con un volo diretto.',
  },
  mediumConf: {
    en: 'Winter frequency is not published yet; check with the airline.',
    de: 'Die Winterfrequenz ist noch nicht veröffentlicht; bitte bei der Airline prüfen.',
    sl: 'Zimska pogostost še ni objavljena; preverite pri letalski družbi.',
    hr: 'Zimska učestalost još nije objavljena; provjerite kod zrakoplovne kompanije.',
    it: 'La frequenza invernale non è ancora pubblicata; verificate con la compagnia aerea.',
  },
  useFlight: { en: 'Plan my arrival with this flight', de: 'Anreise mit diesem Flug planen', sl: 'Načrtujte prihod s tem letom', hr: 'Isplanirajte dolazak ovim letom', it: 'Organizzate l’arrivo con questo volo' },
  close: { en: 'Close', de: 'Schließen', sl: 'Zapri', hr: 'Zatvori', it: 'Chiudi' },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  searching: { en: 'Looking up that place…', de: 'Ort wird gesucht…', sl: 'Iščemo ta kraj…', hr: 'Tražimo to mjesto…', it: 'Ricerca del luogo…' },
  noDirect: {
    en: (p) => `No direct flight from ${p} to Zadar`,
    de: (p) => `Kein Direktflug von ${p} nach Zadar`,
    sl: (p) => `Ni neposrednega leta do Zadra (${p})`,
    hr: (p) => `Nema izravnog leta za Zadar (${p})`,
    it: (p) => `Nessun volo diretto da ${p} per Zadar`,
  },
  nearestIntro: {
    en: (m) => `Nearest airports with a direct flight${m ? ` ${m}` : ''}:`,
    de: (m) => `Nächste Flughäfen mit Direktflug${m ? ` ${m}` : ''}:`,
    sl: (m) => `Najbližja letališča z neposrednim letom${m ? ` ${m}` : ''}:`,
    hr: (m) => `Najbliže zračne luke s izravnim letom${m ? ` ${m}` : ''}:`,
    it: (m) => `Aeroporti più vicini con un volo diretto${m ? ` ${m}` : ''}:`,
  },
  kmFrom: {
    en: (km, p) => `about ${km} km from ${p}`,
    de: (km, p) => `ca. ${km} km von ${p}`,
    sl: (km, p) => `približno ${km} km od kraja ${p}`,
    hr: (km, p) => `oko ${km} km od mjesta ${p}`,
    it: (km, p) => `a circa ${km} km da ${p}`,
  },
  orDrive: {
    en: (p, t) => `Or drive from ${p}: about ${t} to our gate.`,
    de: (p, t) => `Oder mit dem Auto ab ${p}: ca. ${t} bis zu uns.`,
    sl: (p, t) => `Ali pa se pripeljite z avtom (${p}): približno ${t} do naših vrat.`,
    hr: (p, t) => `Ili dođite automobilom (${p}): oko ${t} do naših vrata.`,
    it: (p, t) => `Oppure in auto da ${p}: circa ${t} fino al nostro cancello.`,
  },
  zagTip: {
    en: 'Another option: fly to Zagreb (ZAG) and connect on Croatia Airlines, or drive about 3.5 hours down the A1.',
    de: 'Alternative: nach Zagreb (ZAG) fliegen und mit Croatia Airlines weiterfliegen, oder ca. 3,5 Stunden über die A1 fahren.',
    sl: 'Druga možnost: letite do Zagreba (ZAG) in nadaljujte s Croatia Airlines ali pa se približno 3,5 ure peljite po A1.',
    hr: 'Druga mogućnost: letite do Zagreba (ZAG) i presjednite na Croatia Airlines ili vozite oko 3,5 sata autocestom A1.',
    it: 'Un’altra possibilità: volate a Zagabria (ZAG) e proseguite con Croatia Airlines, oppure guidate circa 3,5 ore sulla A1.',
  },
  notFound: {
    en: 'We could not find that place. Try a nearby city or an airport code.',
    de: 'Diesen Ort konnten wir nicht finden. Versuchen Sie eine Stadt in der Nähe oder einen Flughafencode.',
    sl: 'Tega kraja nismo našli. Poskusite z bližnjim mestom ali kodo letališča.',
    hr: 'To mjesto nismo pronašli. Pokušajte s obližnjim gradom ili kodom zračne luke.',
    it: 'Non abbiamo trovato questo luogo. Provate con una città vicina o con un codice aeroportuale.',
  },
  offline: {
    en: 'The place search needs a connection. Try an airport code from the list instead.',
    de: 'Die Ortssuche braucht eine Internetverbindung. Versuchen Sie stattdessen einen Flughafencode aus der Liste.',
    sl: 'Iskanje krajev potrebuje internetno povezavo. Poskusite raje s kodo letališča s seznama.',
    hr: 'Za traženje mjesta potrebna je internetska veza. Pokušajte radije s kodom zračne luke s popisa.',
    it: 'La ricerca dei luoghi richiede una connessione. Provate invece con un codice aeroportuale dall’elenco.',
  },
  boardTitle: { en: 'Arrivals', de: 'Ankunft', sl: 'Prihodi', hr: 'Dolasci', it: 'Arrivi' },
  boardSub: { en: 'Direct flights to Zadar ZAD', de: 'Direktflüge nach Zadar ZAD', sl: 'Neposredni leti do Zadra ZAD', hr: 'Izravni letovi za Zadar ZAD', it: 'Voli diretti per Zadar ZAD' },
  localTime: { en: 'Local time in Zadar', de: 'Ortszeit in Zadar', sl: 'Lokalni čas v Zadru', hr: 'Lokalno vrijeme u Zadru', it: 'Ora locale a Zadar' },
  colFrom: { en: 'From', de: 'Von', sl: 'Od koder', hr: 'Polazište', it: 'Da' },
  colCode: { en: 'Code', de: 'Code', sl: 'Koda', hr: 'Kod', it: 'Codice' },
  colAirlines: { en: 'Airlines', de: 'Airlines', sl: 'Letalske družbe', hr: 'Kompanije', it: 'Compagnie' },
  colWeekly: { en: 'Flights/wk', de: 'Flüge/Wo.', sl: 'Leti/teden', hr: 'Letovi/tj.', it: 'Voli/sett.' },
  colSeason: { en: 'Season', de: 'Saison', sl: 'Sezona', hr: 'Sezona', it: 'Stagione' },
  sortBy: { en: (c) => `Sort by ${c}`, de: (c) => `Nach ${c} sortieren`, sl: (c) => `Razvrsti: ${c}`, hr: (c) => `Poredaj: ${c}`, it: (c) => `Ordina per: ${c}` },
  noRows: {
    en: 'No direct flights match these filters. Try another month or “All airlines”.',
    de: 'Keine Direktflüge für diese Filter. Versuchen Sie einen anderen Monat oder „Alle Airlines“.',
    sl: 'Tem filtrom ne ustreza noben neposreden let. Poskusite z drugim mesecem ali »Vse letalske družbe«.',
    hr: 'Nijedan izravni let ne odgovara ovim filtrima. Pokušajte s drugim mjesecom ili „Sve kompanije”.',
    it: 'Nessun volo diretto corrisponde a questi filtri. Provate un altro mese o «Tutte le compagnie».',
  },
  winterNote: {
    en: 'In winter almost all international flights stop. Zagreb and Pula (Croatia Airlines) keep flying, plus about two flights a week from Munich.',
    de: 'Im Winter ruhen fast alle internationalen Flüge. Zagreb und Pula (Croatia Airlines) fliegen weiter, dazu etwa zwei Flüge pro Woche ab München.',
    sl: 'Pozimi skoraj vsi mednarodni leti odpadejo. Leti iz Zagreba in Pulja (Croatia Airlines) ostanejo, poleg njih pa še približno dva leta na teden iz Münchna.',
    hr: 'Zimi gotovo svi međunarodni letovi prestaju. Letovi iz Zagreba i Pule (Croatia Airlines) ostaju, uz otprilike dva leta tjedno iz Münchena.',
    it: 'D’inverno quasi tutti i voli internazionali si fermano. Restano Zagabria e Pola (Croatia Airlines), più circa due voli a settimana da Monaco di Baviera.',
  },
  marchNote: {
    en: 'Most routes only start in the last days of March (29–31 March in 2026). Before that, only the winter flights from Zagreb, Pula and Munich operate.',
    de: 'Die meisten Strecken beginnen erst Ende März (2026: 29.–31. März). Davor gibt es nur die Winterflüge ab Zagreb, Pula und München.',
    sl: 'Večina linij začne leteti šele v zadnjih dneh marca (leta 2026 od 29. do 31. marca). Pred tem letijo le zimski leti iz Zagreba, Pulja in Münchna.',
    hr: 'Većina linija kreće tek posljednjih dana ožujka (2026. od 29. do 31. ožujka). Prije toga lete samo zimski letovi iz Zagreba, Pule i Münchena.',
    it: 'La maggior parte delle rotte parte solo negli ultimi giorni di marzo (nel 2026 dal 29 al 31 marzo). Prima operano soltanto i voli invernali da Zagabria, Pola e Monaco di Baviera.',
  },
  schedNote: {
    en: 'Based on Zadar Airport’s summer 2026 timetable. Airlines publish their 2027 schedules over the winter and routes do change — always check with the airline before you book.',
    de: 'Grundlage ist der Sommerflugplan 2026 des Flughafens Zadar. Die Airlines veröffentlichen ihre Flugpläne für 2027 im Laufe des Winters, und Strecken ändern sich — prüfen Sie vor der Buchung immer bei der Airline.',
    sl: 'Na podlagi poletnega voznega reda 2026 letališča Zadar. Letalske družbe objavijo vozne rede za 2027 čez zimo in linije se spreminjajo — pred rezervacijo vedno preverite pri letalski družbi.',
    hr: 'Prema ljetnom redu letenja 2026. Zračne luke Zadar. Zrakoplovne kompanije objavljuju redove letenja za 2027. tijekom zime, a linije se mijenjaju — prije rezervacije uvijek provjerite kod kompanije.',
    it: 'In base all’orario estivo 2026 dell’aeroporto di Zadar. Le compagnie pubblicano gli orari 2027 durante l’inverno e le rotte cambiano: verificate sempre con la compagnia prima di prenotare.',
  },
  mapLabel: { en: 'Map of direct flight routes to Zadar', de: 'Karte der Direktflüge nach Zadar', sl: 'Zemljevid neposrednih letov do Zadra', hr: 'Karta izravnih letova za Zadar', it: 'Mappa dei voli diretti per Zadar' },
  mapError: {
    en: 'The map could not load. The list of airports next to it is complete.',
    de: 'Die Karte konnte nicht geladen werden. Die Liste der Flughäfen daneben ist vollständig.',
    sl: 'Zemljevida ni bilo mogoče naložiti. Seznam letališč ob njem je popoln.',
    hr: 'Karta se nije mogla učitati. Popis zračnih luka pokraj nje je potpun.',
    it: 'Non è stato possibile caricare la mappa. L’elenco degli aeroporti accanto è completo.',
  },
  zad: { en: 'Zadar Airport (ZAD)', de: 'Flughafen Zadar (ZAD)', sl: 'Letališče Zadar (ZAD)', hr: 'Zračna luka Zadar (ZAD)', it: 'Aeroporto di Zadar (ZAD)' },
  youSearched: { en: 'Your search', de: 'Ihre Suche', sl: 'Vaše iskanje', hr: 'Vaša pretraga', it: 'La vostra ricerca' },
  prefillRoute: {
    en: (city, iata, air) => `Flying in from ${city} (${iata}) with ${air}. Our arrival time at Zadar Airport: `,
    de: (city, iata, air) => `Wir fliegen von ${city} (${iata}) mit ${air}. Ankunftszeit am Flughafen Zadar: `,
    sl: (city, iata, air) => `Priletimo iz: ${city} (${iata}), letalska družba ${air}. Naš čas prihoda na letališče Zadar: `,
    hr: (city, iata, air) => `Dolazimo letom iz: ${city} (${iata}), zrakoplovna kompanija ${air}. Naše vrijeme dolaska u Zračnu luku Zadar: `,
    it: (city, iata, air) => `Arriviamo in volo da ${city} (${iata}) con ${air}. Il nostro orario di arrivo all’aeroporto di Zadar: `,
  },
  and: { en: 'or', de: 'oder', sl: 'ali', hr: 'ili', it: 'o' },
};

// English country names in the data -> ISO codes, so Intl can localise them.
const COUNTRY_ISO = {
  Austria: 'AT', Belgium: 'BE', Croatia: 'HR', Czechia: 'CZ', Denmark: 'DK', Finland: 'FI', France: 'FR', Germany: 'DE',
  Hungary: 'HU', Ireland: 'IE', Italy: 'IT', Lithuania: 'LT', Luxembourg: 'LU', Netherlands: 'NL', Poland: 'PL',
  Romania: 'RO', Serbia: 'RS', Slovakia: 'SK', Slovenia: 'SI', Spain: 'ES', Sweden: 'SE', Switzerland: 'CH', 'United Kingdom': 'GB',
};

// Data-viz series colours for the map (map marks may use fixed colours).
// On satellite imagery the dark blue disappears, so arcs turn white / amber.
const ARC = '#0b5d8c';
const ARC_ON = '#b5451f';
const ARC_SAT = '#ffffff';
const ARC_ON_SAT = '#ffb703';
const AIRLINES_SHOWN = 5;
// Months when Zadar has (almost) no international flights; shared with travel.js.
export const WINTER_MONTHS = [11, 12, 1, 2];
// The timetable gives each route a midsummer (Jun–Aug) and a shoulder weekly figure.
const MIDSUMMER = [6, 7, 8];
// 36 -> "35–40": the free-flow drive time as a friendly range.
export const minRange = (min) => `${Math.floor(min / 5) * 5}–${Math.floor(min / 5) * 5 + 5}`;
const NEAREST_N = 3;
const GEOCODE = 'https://nominatim.openstreetmap.org/search';

// Survives the Map <-> Board re-render, so switching views keeps the search.
const memory = { query: '', selected: null, airline: '', sort: { key: 'weekly', dir: -1 }, moreAirlines: false, focus: null, place: null };

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
// ctx.t() only accepts strings/objects; function-valued entries go through here.
const tf = (ctx, key, ...args) => {
  const entry = TF[key];
  const fn = entry[ctx.lang] || entry.en;
  return typeof fn === 'function' ? fn(...args) : fn;
};

export const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();

const monthOf = (iso) => Number(iso.slice(5, 7));
function monthsBetween(from, to) {
  const out = [];
  for (let m = monthOf(from); ; m = (m % 12) + 1) {
    out.push(m);
    if (m === monthOf(to) || out.length >= 12) break;
  }
  return out;
}

// Each route becomes a list of "legs" (one per airline and season) so month and
// airline filters can be answered from the same structure.
export function prepareRoutes(routes) {
  return routes.map((r) => {
    const legs = (r.perAirline || []).map((p) => ({
      airline: p.airline,
      weekly: p.peakWeekly,
      from: p.from,
      to: p.to,
      months: monthsBetween(p.from, p.to),
      charter: /charter/i.test(p.airline),
    }));
    const w = r.winter2026_27;
    // Winter 2026/27 runs roughly from late October to late March.
    if (w) legs.push({ airline: w.airline, weekly: w.weeklyFrequency ?? null, months: [11, 12, 1, 2, 3], winter: true });
    const covered = new Set(legs.flatMap((l) => l.months));
    const rest = r.months.filter((m) => !covered.has(m));
    // Year-round domestic routes (ZAG, PUY): months listed, winter frequency unknown.
    if (rest.length) legs.push({ airline: r.airlines[0], weekly: null, months: rest, winter: true });
    const allMonths = [...new Set(legs.flatMap((l) => l.months))].sort((a, b) => a - b);
    return { ...r, legs, allMonths, key: norm([r.destinationCity, r.airportName, r.iata, r.country].join(' ')) };
  });
}

function activeLegs(route, month, airline) {
  return route.legs.filter((l) => (!month || l.months.includes(month)) && (!airline || l.airline === airline));
}

// Weekly flights in a busy week of that month ("any month" = midsummer).
// Per-airline figures are each airline's own peak, and those peaks don't always
// fall in the same week, so the summer part is capped by the route's midsummer
// or shoulder figure from the timetable.
function weeklyOf(r, legs, month) {
  const use = month || !legs.some((l) => !l.winter) ? legs : legs.filter((l) => !l.winter);
  const known = use.filter((l) => l.weekly != null);
  const sum = (list) => list.reduce((s, l) => s + l.weekly, 0);
  const summer = sum(known.filter((l) => !l.winter));
  const cap = !month || MIDSUMMER.includes(month) ? r.weeklyFrequencyMidsummer : r.weeklyFrequencyShoulder || r.weeklyFrequencyMidsummer;
  return { n: (cap ? Math.min(summer, cap) : summer) + sum(known.filter((l) => l.winter)), unknown: known.length < use.length };
}

// Low-confidence routes, or months in which only a charter leg flies.
const isUnconfirmed = (r, legs) => r.confidence === 'low' || (legs.length > 0 && legs.every((l) => l.charter));

function visibleRoutes(routes, month, airline) {
  return routes
    .map((r) => {
      const legs = activeLegs(r, month, airline);
      return legs.length ? { r, legs, weekly: weeklyOf(r, legs, month) } : null;
    })
    .filter(Boolean);
}

function seasonLabel(ctx, months) {
  if (months.length >= 12) return ctx.t(TF.yearRound);
  const set = new Set(months);
  const runs = [];
  for (const m of months) {
    const prev = ((m + 10) % 12) + 1;
    if (set.has(prev)) continue;
    let end = m;
    while (set.has((end % 12) + 1) && runs.length < 12) end = (end % 12) + 1;
    runs.push(m === end ? monthName(m, ctx.lang) : `${monthName(m, ctx.lang)}–${monthName(end, ctx.lang)}`);
  }
  return runs.join(', ');
}

function countryName(ctx, name) {
  const iso = COUNTRY_ISO[name];
  try {
    return iso ? new Intl.DisplayNames([ctx.lang], { type: 'region' }).of(iso) : name;
  } catch {
    return name;
  }
}

function dateShort(ctx, iso) {
  try {
    return new Intl.DateTimeFormat(ctx.lang, { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

function matchRoutes(routes, query) {
  const q = norm(query);
  if (!q) return [];
  const scored = [];
  for (const r of routes) {
    let s = 0;
    if (norm(r.iata) === q) s = 100;
    else if (norm(r.destinationCity).startsWith(q)) s = 80;
    else if (q.length >= 3 && r.key.includes(q)) s = 50;
    if (s) scored.push({ r, s: s + Math.min(r.weeklyFrequency, 20) / 100 });
  }
  return scored.sort((a, b) => b.s - a.s).map((x) => x.r);
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
export function sourcesHtml(ctx, urls, label = ctx.t(TF.sources)) {
  const list = [...new Set(urls || [])];
  if (!list.length) return '';
  return `<details class="tr-src"><summary>${icon('info', { size: 15 })} ${esc(label)}</summary><ul>${list
    .map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(hostOf(u))}</a></li>`)
    .join('')}</ul></details>`;
}

const flap = (text, cls = '') => `<span class="tr-flap ${cls}" aria-hidden="true">${[...String(text)].map((c) => `<span>${esc(c)}</span>`).join('')}</span>`;

// ---------------------------------------------------------------------------
// HTML (pure functions of the filter state)
// ---------------------------------------------------------------------------
function monthStripHtml(ctx, routes, month, airline) {
  const counts = Array.from({ length: 12 }, (_, i) => visibleRoutes(routes, i + 1, airline).length);
  const max = Math.max(1, ...counts);
  const total = visibleRoutes(routes, 0, airline).length;
  const btn = (m, n) => {
    const label = m ? monthName(m, ctx.lang) : ctx.t(TF.any);
    const aria = m ? tf(ctx, 'routesIn', n, monthName(m, ctx.lang, true), m) : `${ctx.t(TF.any)} · ${n}`;
    return `<button type="button" class="tr-mon" data-month="${m}" aria-pressed="${month === m}" aria-label="${esc(aria)}" title="${esc(aria)}">
      <span class="tr-mon-bar" aria-hidden="true"><i style="--h:${Math.round((n / (m ? max : total || 1)) * 100)}%"></i></span>
      <span class="tr-mon-n" aria-hidden="true">${n}</span>
      <span class="tr-mon-l">${esc(label)}</span>
    </button>`;
  };
  return btn(0, total) + counts.map((n, i) => btn(i + 1, n)).join('');
}

function airlineChipsHtml(ctx, routes, month, airline) {
  const counts = new Map();
  for (const r of routes) for (const l of r.legs) counts.set(l.airline, counts.get(l.airline) || 0);
  for (const { legs } of visibleRoutes(routes, month, '')) for (const a of new Set(legs.map((l) => l.airline))) counts.set(a, counts.get(a) + 1);
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  // Collapsed: only airlines that fly in the chosen month (zero-count chips sort last).
  const collapsed = Math.min(AIRLINES_SHOWN, list.filter(([, n]) => n).length);
  const shownCount = memory.moreAirlines ? list.length : collapsed;
  const chip = ([name, n], i) => {
    const hidden = i >= shownCount && name !== airline;
    return `<button type="button" class="chip tr-air${n ? '' : ' is-empty'}" data-airline="${esc(name)}" aria-pressed="${airline === name}"${hidden ? ' hidden' : ''}>${esc(name)} <span class="tr-air-n">${n}</span></button>`;
  };
  const more = list.length > collapsed
    ? `<button type="button" class="chip tr-more" data-more aria-expanded="${memory.moreAirlines}">${esc(memory.moreAirlines ? ctx.t(TF.fewerAirlines) : tf(ctx, 'moreAirlines', list.length - collapsed))}</button>`
    : '';
  return `<button type="button" class="chip" data-airline="" aria-pressed="${!airline}">${esc(ctx.t(TF.allAirlines))}</button>${list.map(chip).join('')}${more}`;
}

function statsHtml(ctx, vis, month) {
  const countries = new Set(vis.map((v) => v.r.country)).size;
  const airlines = new Set(vis.flatMap((v) => v.legs.map((l) => l.airline))).size;
  const weekly = vis.reduce((s, v) => s + v.weekly.n, 0);
  const unknown = vis.some((v) => v.weekly.unknown);
  const when = month ? tf(ctx, 'inMonth', monthName(month, ctx.lang, true), month) : ctx.t(TF.summerPeak);
  const tile = (value, label, note = '') =>
    `<div class="tr-stat"><b>${value}</b><span>${esc(label)}${note ? ` <em>${esc(note)}</em>` : ''}</span></div>`;
  return [
    tile(vis.length, tf(ctx, 'statRoutes', vis.length), when),
    tile(countries, tf(ctx, 'statCountries', countries)),
    tile(airlines, tf(ctx, 'statAirlines', airlines)),
    tile(`${unknown ? '≥ ' : ''}${weekly}`, tf(ctx, month ? 'statWeekly' : 'statWeeklyPeak', weekly)),
  ].join('');
}

function routeButton(ctx, v, selected) {
  const { r, weekly } = v;
  return `<li><button type="button" class="tr-rt" data-route="${r.iata}" aria-pressed="${selected === r.iata}">
    <span class="tr-rt-city">${esc(r.destinationCity)}</span>
    <span class="tr-rt-iata">${r.iata}</span>
    <span class="tr-rt-freq">${weekly.n ? `${weekly.n}${esc(ctx.t(TF.perWeek))}` : '–'}</span>
  </button></li>`;
}

function countryListHtml(ctx, vis, selected) {
  const groups = new Map();
  for (const v of vis) {
    if (!groups.has(v.r.country)) groups.set(v.r.country, []);
    groups.get(v.r.country).push(v);
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  if (!sorted.length) return `<p class="muted">${esc(ctx.t(TF.noRows))}</p>`;
  return sorted
    .map(([country, list]) => {
      list.sort((a, b) => b.weekly.n - a.weekly.n || a.r.destinationCity.localeCompare(b.r.destinationCity));
      return `<div class="tr-cty"><h4>${esc(countryName(ctx, country))} <span class="muted">${list.length}</span></h4><ul>${list.map((v) => routeButton(ctx, v, selected)).join('')}</ul></div>`;
    })
    .join('');
}

function monthDots(ctx, months, month) {
  return `<span class="tr-dots" aria-label="${esc(`${ctx.t(TF.season)}: ${seasonLabel(ctx, months)}`)}" role="img">${Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return `<span class="${months.includes(m) ? 'on' : ''}${m === month ? ' cur' : ''}" title="${esc(monthName(m, ctx.lang, true))}">${esc(monthName(m, ctx.lang).slice(0, 1))}</span>`;
  }).join('')}</span>`;
}

function detailHtml(ctx, r, month, airline) {
  const legs = activeLegs(r, month, '');
  const w = weeklyOf(r, legs, month);
  const mName = month ? monthName(month, ctx.lang, true) : '';
  const status = !month
    ? ''
    : legs.length
      ? `<p class="tr-status ok">${icon('check', { size: 18 })} ${esc(tf(ctx, 'fliesIn', mName, w.n, month))}</p>`
      : `<p class="tr-status no">${icon('close', { size: 18 })} ${esc(tf(ctx, 'notIn', mName, seasonLabel(ctx, r.allMonths), month))}</p>`;
  const airlineNote = airline && !r.legs.some((l) => l.airline === airline) ? `<p class="tr-status no">${esc(tf(ctx, 'notWithAirline', airline))}</p>` : '';
  const legRows = r.legs
    .map((l) => {
      const when = l.winter ? tf(ctx, 'winterLeg', l.weekly) : `${dateShort(ctx, l.from)} – ${dateShort(ctx, l.to)} 2026`;
      const freq = l.winter ? '' : ` · ${tf(ctx, 'perWeekLong', l.weekly)}`;
      const on = month && l.months.includes(month);
      const charter = l.charter ? `<em class="tr-leg-charter">${esc(ctx.t(TF.charterLeg))}</em>` : '';
      return `<li class="${on ? 'on' : ''}"><b>${esc(l.airline)}</b><span>${esc(when + freq)}</span>${charter}</li>`;
    })
    .join('');
  const conf = isUnconfirmed(r, legs.length ? legs : r.legs)
    ? `<p class="tr-warn">${icon('info', { size: 16 })} ${esc(ctx.t(TF.lowConf))}</p>`
    : r.legs.some((l) => l.winter && l.weekly == null) ? `<p class="source-note">${esc(ctx.t(TF.mediumConf))}</p>` : '';
  return `<div class="tr-detail" data-detail-route="${r.iata}" tabindex="-1">
    <div class="tr-detail-head">
      <div>
        <h4>${esc(r.destinationCity)} ${flap(r.iata)}<span class="visually-hidden">${r.iata}</span></h4>
        <p class="meta"><span>${esc(r.airportName)}</span><span>${esc(countryName(ctx, r.country))}</span></p>
      </div>
      <button type="button" class="btn btn-ghost btn-small tr-x" data-clear aria-label="${esc(ctx.t(TF.close))}">${icon('close', { size: 18 })}</button>
    </div>
    ${status}${airlineNote}
    ${monthDots(ctx, r.allMonths, month)}
    <ul class="tr-legs">${legRows}</ul>
    ${conf}
    <div class="tr-detail-foot">
      <button type="button" class="btn btn-accent btn-small" data-use="${r.iata}">${icon('plane', { size: 16 })} ${esc(ctx.t(TF.useFlight))}</button>
      ${sourcesHtml(ctx, r.sources)}
    </div>
  </div>`;
}

function introHtml(ctx, vis, month) {
  const top = [...vis].sort((a, b) => b.weekly.n - a.weekly.n).slice(0, 5);
  const when = month ? tf(ctx, 'inMonth', monthName(month, ctx.lang, true), month) : `· ${ctx.t(TF.summerPeak)}`;
  const note = WINTER_MONTHS.includes(month) ? TF.winterNote : month === 3 ? TF.marchNote : null;
  const winter = note ? `<p class="tr-warn">${icon('info', { size: 16 })} ${esc(ctx.t(note))}</p>` : '';
  return `<div class="tr-intro">
    <p class="muted">${esc(ctx.t(TF.pickHint))}</p>
    ${winter}
    ${top.length ? `<div class="tr-busiest"><h4>${esc(tf(ctx, 'busiest', when))}</h4><ul class="tr-rts">${top.map((v) => routeButton(ctx, v, null)).join('')}</ul></div>` : ''}
  </div>`;
}

function placeHtml(ctx, place, nearest, month) {
  if (place.error) return `<div class="tr-detail"><p class="tr-warn">${icon('info', { size: 16 })} ${esc(ctx.t(TF[place.error]))}</p></div>`;
  if (place.loading) return `<div class="tr-detail"><p class="muted">${esc(ctx.t(TF.searching))}</p></div>`;
  const mText = month ? tf(ctx, 'inMonth', monthName(month, ctx.lang, true), month) : '';
  return `<div class="tr-detail">
    <div class="tr-detail-head">
      <h4>${esc(tf(ctx, 'noDirect', place.name))}</h4>
      <button type="button" class="btn btn-ghost btn-small tr-x" data-clear aria-label="${esc(ctx.t(TF.close))}">${icon('close', { size: 18 })}</button>
    </div>
    <p>${esc(tf(ctx, 'nearestIntro', mText))}</p>
    <ul class="tr-near">${nearest
      .map(
        ({ v, km }) => `<li><button type="button" class="tr-rt" data-route="${v.r.iata}">
          <span class="tr-rt-city">${esc(v.r.destinationCity)}</span><span class="tr-rt-iata">${v.r.iata}</span>
          <span class="tr-rt-sub">${esc(tf(ctx, 'kmFrom', Math.round(km), place.name))} · ${esc([...new Set(v.legs.map((l) => l.airline))].join(', '))}</span>
        </button></li>`,
      )
      .join('')}</ul>
    ${place.drive ? `<p class="small tr-drive-alt">${icon('car', { size: 16 })} <span>${esc(tf(ctx, 'orDrive', place.name, place.drive))}</span></p>` : ''}
    <p class="source-note">${esc(ctx.t(TF.zagTip))}</p>
  </div>`;
}

const SORTS = {
  city: (v) => v.r.destinationCity,
  iata: (v) => v.r.iata,
  airlines: (v) => v.legs[0]?.airline || '',
  weekly: (v) => v.weekly.n,
  season: (v) => v.r.allMonths[0] * 100 - v.r.allMonths.length,
};

// The selected route's detail card opens as an extra row right under it, so it
// is never off-screen on a long board.
function boardRowsHtml(ctx, vis, selected, { month, airline, query }) {
  if (!vis.length) {
    const hint = query ? `<br />${esc(ctx.t(TF.noRowsQuery))}` : '';
    return `<tr><td colspan="5" class="tr-b-empty">${esc(ctx.t(TF.noRows))}${hint}</td></tr>`;
  }
  const { key, dir } = memory.sort;
  const get = SORTS[key] || SORTS.weekly;
  const rows = [...vis].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    const c = typeof x === 'string' ? x.localeCompare(y) : x - y;
    return c * dir || a.r.destinationCity.localeCompare(b.r.destinationCity);
  });
  return rows
    .map((v) => {
      const air = [...new Set(v.legs.map((l) => l.airline))].join(', ');
      const sel = selected === v.r.iata;
      const low = isUnconfirmed(v.r, v.legs);
      const star = low ? `<span class="tr-b-star" aria-hidden="true">*</span><span class="visually-hidden">${esc(ctx.t(TF.unconfirmed))}</span>` : '';
      const detail = sel ? `<tr class="tr-b-detail"><td colspan="5">${detailHtml(ctx, v.r, month, airline)}</td></tr>` : '';
      return `<tr data-route="${v.r.iata}" class="${sel ? 'is-sel' : ''}${low ? ' is-low' : ''}">
        <th scope="row"><button type="button" class="tr-b-city" data-route="${v.r.iata}" aria-pressed="${sel}">${esc(v.r.destinationCity)}${star}</button><span class="tr-b-air-m">${esc(air)} · ${esc(seasonLabel(ctx, v.r.allMonths))}</span></th>
        <td>${flap(v.r.iata)}<span class="visually-hidden">${v.r.iata}</span></td>
        <td class="tr-b-air">${esc(air)}</td>
        <td class="tr-b-num">${v.weekly.n ? flap(String(v.weekly.n), 'num') : '–'}<span class="visually-hidden">${v.weekly.n || ''}</span></td>
        <td class="tr-b-season">${esc(seasonLabel(ctx, v.r.allMonths))}</td>
      </tr>${detail}`;
    })
    .join('');
}

function boardHtml(ctx) {
  const th = (key, label, cls = '') => {
    const on = memory.sort.key === key;
    const sort = on ? (memory.sort.dir > 0 ? 'ascending' : 'descending') : 'none';
    return `<th scope="col" class="${cls}" aria-sort="${sort}"><button type="button" data-sort="${key}" aria-label="${esc(tf(ctx, 'sortBy', label))}">${esc(label)}<span class="tr-sort" aria-hidden="true">${on ? (memory.sort.dir > 0 ? '▲' : '▼') : '↕'}</span></button></th>`;
  };
  return `<div class="tr-board">
    <div class="tr-board-top">
      <div><b>${icon('plane', { size: 20 })} ${esc(ctx.t(TF.boardTitle))}</b><span>${esc(ctx.t(TF.boardSub))}</span></div>
      <div class="tr-clock" aria-label="${esc(ctx.t(TF.localTime))}"><span class="small">${esc(ctx.t(TF.localTime))}</span><b data-clock>--:--</b></div>
    </div>
    <div class="tr-board-scroll">
      <table>
        <thead><tr>${th('city', ctx.t(TF.colFrom))}${th('iata', ctx.t(TF.colCode))}${th('airlines', ctx.t(TF.colAirlines), 'tr-b-air')}${th('weekly', ctx.t(TF.colWeekly))}${th('season', ctx.t(TF.colSeason), 'tr-b-season')}</tr></thead>
        <tbody data-board-rows></tbody>
      </table>
    </div>
    <p class="source-note tr-b-foot" data-board-foot hidden>${esc(ctx.t(TF.boardFoot))}</p>
  </div>`;
}

// Static shell of the flights panel; the dynamic parts are filled by mountFlights().
export function flightsHtml(ctx, d) {
  const drive = d.transfers.find((x) => x.id === 'transfer-drive');
  const view = ctx.state.flightsView === 'board' ? 'board' : 'map';
  const seg = (v, label, ic) => `<button type="button" class="tr-seg-btn" data-view="${v}" aria-pressed="${view === v}">${icon(ic, { size: 17 })} ${esc(label)}</button>`;
  const body =
    view === 'board'
      ? `<div class="tr-fl-board"><div data-detail aria-live="polite"></div>${boardHtml(ctx)}</div>`
      : `<div class="tr-fl-map">
          <div class="map-frame tr-map"><div class="tr-map-el" data-map role="region" aria-label="${esc(ctx.t(TF.mapLabel))}"></div>
            <p class="error-box tr-map-err" data-map-error hidden>${esc(ctx.t(TF.mapError))}</p></div>
          <aside class="tr-aside">
            <div data-detail aria-live="polite"></div>
            <details class="tr-countries" open><summary data-countries-sum></summary><div data-countries></div></details>
          </aside>
        </div>`;
  return `<div class="tr-flights card" data-flights>
    <div class="tr-fl-head">
      <div>
        <h3>${icon('plane', { size: 22 })} ${esc(ctx.t(TF.title))}</h3>
        <p class="muted">${esc(tf(ctx, 'sub', minRange(drive.durationMin)))}</p>
      </div>
      <div class="tr-seg" role="group" aria-label="${esc(ctx.t(TF.view))}">${seg('map', ctx.t(TF.viewMap), 'pin')}${seg('board', ctx.t(TF.viewBoard), 'layers')}</div>
    </div>
    <div class="tr-filters">
      <div class="tr-months" role="group" aria-label="${esc(ctx.t(TF.month))}" data-months></div>
      <div class="tr-filter-row">
        <form class="tr-search" role="search" data-search autocomplete="off">
          <label for="tr-q" class="tr-q-label">${esc(ctx.t(TF.find))}</label>
          <div class="tr-q-row">
            <input id="tr-q" type="search" name="q" placeholder="${esc(ctx.t(TF.findPh))}" enterkeyhint="search" aria-describedby="tr-q-live" role="combobox" aria-autocomplete="list" aria-controls="tr-sg-list" aria-expanded="false" />
            <button type="submit" class="btn btn-primary">${esc(ctx.t(TF.findBtn))}</button>
          </div>
          <ul class="tr-suggest" id="tr-sg-list" role="listbox" aria-label="${esc(ctx.t(TF.find))}" data-suggest></ul>
          <span id="tr-q-live" class="visually-hidden" aria-live="polite" data-live></span>
        </form>
        <div class="tr-airlines">
          <span class="tr-q-label" id="tr-air-l">${esc(ctx.t(TF.airline))}</span>
          <div class="chips" role="group" aria-labelledby="tr-air-l" data-airlines></div>
        </div>
      </div>
    </div>
    <div class="tr-stats" data-stats aria-live="polite"></div>
    ${body}
    <p class="source-note tr-sched">${icon('info', { size: 15 })} ${esc(ctx.t(TF.schedNote))}</p>
  </div>`;
}

// ---------------------------------------------------------------------------
// Arcs
// ---------------------------------------------------------------------------
const mercY = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
const invMercY = (y) => (Math.atan(Math.exp((y * Math.PI) / 180)) * 360) / Math.PI - 90;

// Quadratic Bézier in Mercator space, bent to the left of the travel direction.
export function arcPoints([lat1, lon1], [lat2, lon2], steps = 28) {
  const a = [lon1, mercY(lat1)];
  const b = [lon2, mercY(lat2)];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const bend = 0.16 * len;
  const c = [(a[0] + b[0]) / 2 - (dy / len) * bend, (a[1] + b[1]) / 2 + (dx / len) * bend];
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0];
    const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1];
    out.push([invMercY(y), x]);
  }
  return out;
}

const PLANE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 21 12 15l-7-2v-2l7 1V5.5a1.5 1.5 0 0 1 3 0V12l7-1v2l-7 2 1.5 6L15 22l-1.5-2L12 22z"/></svg>';

async function createRouteMap(host, ctx, data, routes, { onSelect }) {
  const maps = await import('../maps/base.js');
  const { L } = maps;
  const zad = [data.airport.lat, data.airport.lon];
  const reduced = prefersReducedMotion();
  const inst = maps.createMap(host, { center: [48.5, 12], zoom: 4, minZoom: 3, maxZoom: 10, basemap: ctx.state.basemap, house: false, brandName: ctx.brand });
  const { map } = inst;
  map.createPane('arcs').style.zIndex = 410;
  map.createPane('origins').style.zIndex = 420;

  L.marker(zad, {
    icon: maps.pinIcon({ color: maps.CATEGORY_COLORS.airport, label: PLANE_SVG, size: 36, ring: true }),
    zIndexOffset: 1000,
    keyboard: false,
    title: ctx.t(TF.zad),
  })
    .bindTooltip(esc(ctx.t(TF.zad)), { direction: 'top', offset: [0, -18] })
    .addTo(map);

  const layers = new Map();
  for (const r of routes) {
    const pts = arcPoints([r.lat, r.lon], zad);
    const line = L.polyline(pts, { pane: 'arcs', color: ARC, weight: 2, opacity: 0.55, lineCap: 'round', interactive: false });
    const hit = L.polyline(pts, { pane: 'arcs', color: ARC, weight: 14, opacity: 0, interactive: true });
    const dot = L.circleMarker([r.lat, r.lon], { pane: 'origins', radius: 5, color: '#ffffff', weight: 2, fillColor: ARC, fillOpacity: 1 });
    dot.bindTooltip(r.iata, { permanent: true, direction: 'right', offset: [6, 0], className: 'tr-iata' });
    hit.bindTooltip('', { sticky: true, className: 'tr-arc-tip' });
    const pick = () => onSelect(r.iata);
    dot.on('click', pick);
    hit.on('click', pick);
    hit.on('mouseover', () => line.setStyle({ opacity: 1 }));
    hit.on('mouseout', () => layers.get(r.iata)?.restyle());
    layers.set(r.iata, { r, line, hit, dot, on: false });
  }

  const syncZoom = () => host.classList.toggle('tr-show-iata', map.getZoom() >= 5);
  map.on('zoomend', syncZoom);
  syncZoom();

  let placeLayer = null;
  let first = true;
  let basemap = ctx.state.basemap;
  let last = null;
  return {
    inst,
    setBasemap(name) {
      basemap = name;
      inst.setBasemap(name);
      if (last) this.apply(...last);
    },
    apply(vis, selected) {
      last = [vis, selected];
      const sat = basemap === 'satellite';
      const arc = sat ? ARC_SAT : ARC;
      const arcOn = sat ? ARC_ON_SAT : ARC_ON;
      const base = sat ? 0.75 : 0.55;
      const byIata = new Map(vis.map((v) => [v.r.iata, v]));
      for (const [iata, l] of layers) {
        const v = byIata.get(iata);
        const want = Boolean(v);
        if (want !== l.on) {
          for (const layer of [l.line, l.hit, l.dot]) want ? layer.addTo(map) : layer.remove();
          l.on = want;
        }
        if (!v) continue;
        const sel = selected === iata;
        const dim = selected && !sel;
        const w = 1.2 + Math.sqrt(v.weekly.n || 1) * 0.8;
        l.restyle = () => l.line.setStyle({ color: sel ? arcOn : arc, weight: sel ? w + 1.5 : w, opacity: dim ? (sat ? 0.35 : 0.22) : sel ? 1 : base });
        l.restyle();
        l.dot.setStyle({ fillColor: sel ? arcOn : ARC, radius: (sel ? 7 : 3.5) + Math.sqrt(v.weekly.n || 1) * 0.5, fillOpacity: dim ? 0.55 : 1 });
        l.dot.getTooltip()?.getElement()?.classList.toggle('is-sel', sel);
        l.hit.setTooltipContent(`<b>${esc(v.r.destinationCity)}</b> ${v.r.iata}${v.weekly.n ? ` · ${v.weekly.n}${esc(ctx.t(TF.perWeek))}` : ''}`);
        if (sel) {
          l.line.bringToFront();
          l.dot.bringToFront();
        }
      }
      if (first) {
        first = false;
        const pts = [zad, ...vis.map((v) => [v.r.lat, v.r.lon])];
        if (pts.length > 1) map.fitBounds(pts, { padding: [24, 24], maxZoom: 6, animate: false });
      }
    },
    focus(iata) {
      const l = layers.get(iata);
      if (!l) return;
      map.flyToBounds([[l.r.lat, l.r.lon], zad], { padding: [48, 48], maxZoom: 6, animate: !reduced, duration: 0.8 });
    },
    showPlace(place, nearest) {
      placeLayer?.remove();
      placeLayer = null;
      if (!place?.lat) return;
      placeLayer = L.layerGroup().addTo(map);
      L.circleMarker([place.lat, place.lon], { radius: 7, color: '#ffffff', weight: 2, fillColor: '#1f3a4d', fillOpacity: 1 })
        .bindTooltip(esc(place.name), { permanent: true, direction: 'left', offset: [-8, 0], className: 'tr-iata tr-place' })
        .addTo(placeLayer);
      if (nearest) {
        L.polyline([[place.lat, place.lon], [nearest.r.lat, nearest.r.lon]], { color: '#1f3a4d', weight: 2, dashArray: '4 6', interactive: false }).addTo(placeLayer);
        map.flyToBounds([[place.lat, place.lon], [nearest.r.lat, nearest.r.lon], zad], { padding: [48, 48], maxZoom: 6, animate: !reduced, duration: 0.8 });
      }
    },
    destroy() {
      inst.destroy();
    },
  };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export async function mountFlights(root, ctx, data, { onPrefill }) {
  const routes = prepareRoutes(data.routes);
  const byIata = new Map(routes.map((r) => [r.iata, r]));
  const view = ctx.state.flightsView === 'board' ? 'board' : 'map';
  const $ = (sel) => root.querySelector(sel);
  const els = {
    months: $('[data-months]'),
    airlines: $('[data-airlines]'),
    stats: $('[data-stats]'),
    detail: $('[data-detail]'),
    countries: $('[data-countries]'),
    countriesSum: $('[data-countries-sum]'),
    rows: $('[data-board-rows]'),
    suggest: $('[data-suggest]'),
    live: $('[data-live]'),
    form: $('[data-search]'),
    input: $('#tr-q'),
    clock: $('[data-clock]'),
    boardFoot: $('[data-board-foot]'),
  };
  let month = ctx.state.month || 0;
  if (!byIata.has(memory.selected)) memory.selected = null;
  if (memory.airline && !routes.some((r) => r.legs.some((l) => l.airline === memory.airline))) memory.airline = '';
  els.input.value = memory.query;

  let routeMap = null;
  let abort = null;
  let timer = 0;

  const nearestTo = (lat, lon) =>
    visibleRoutes(routes, month, '')
      .map((v) => ({ v, km: haversineKm([lat, lon], [v.r.lat, v.r.lon]) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, NEAREST_N);

  // Board: the search narrows the rows. A place found by "Find" (no direct
  // flight) keeps all rows, since the panel above lists the nearest airports.
  const boardQueryFilter = (vis) => {
    if (view !== 'board' || !memory.query || memory.place) return vis;
    const hits = new Set(matchRoutes(routes, memory.query).map((r) => r.iata));
    return vis.filter((v) => hits.has(v.r.iata));
  };

  // refresh() rebuilds the chip/list/row markup; put keyboard focus back on the
  // control that had it (or on the detail card it opened).
  function focusKeeper() {
    const a = document.activeElement;
    if (!a || !root.contains(a)) return () => {};
    const boxes = [['data-month', els.months], ['data-airline', els.airlines], ['data-route', els.countries], ['data-route', els.rows], ['data-route', els.detail]];
    const hit = boxes.find(([attr, box]) => box && box.contains(a) && a.hasAttribute(attr));
    if (!hit) return () => {};
    const [attr, box] = hit;
    const value = a.getAttribute(attr);
    return () => {
      if (root.contains(a)) return;
      const next = box.querySelector(`button[${attr}="${CSS.escape(value)}"]`) || root.querySelector('.tr-detail[tabindex]');
      next?.focus({ preventScroll: true });
    };
  }

  function renderDetail(vis) {
    if (memory.place) {
      const nearest = memory.place.lat ? nearestTo(memory.place.lat, memory.place.lon) : [];
      els.detail.innerHTML = placeHtml(ctx, memory.place, nearest, month);
      routeMap?.showPlace(memory.place, nearest[0]?.v);
      return;
    }
    routeMap?.showPlace(null);
    const r = byIata.get(memory.selected);
    // On the board the selected route opens inline (see boardRowsHtml).
    if (view === 'board') els.detail.innerHTML = '';
    else els.detail.innerHTML = r ? detailHtml(ctx, r, month, memory.airline) : introHtml(ctx, vis, month);
  }

  function refresh({ detail = true, flip = true } = {}) {
    const restoreFocus = focusKeeper();
    const vis = visibleRoutes(routes, month, memory.airline);
    els.months.innerHTML = monthStripHtml(ctx, routes, month, memory.airline);
    els.airlines.innerHTML = airlineChipsHtml(ctx, routes, month, memory.airline);
    els.stats.innerHTML = statsHtml(ctx, vis, month);
    if (els.countries) {
      els.countries.innerHTML = countryListHtml(ctx, vis, memory.selected);
      els.countriesSum.textContent = tf(ctx, 'byCountry', vis.length);
    }
    if (els.rows) {
      const rows = boardQueryFilter(vis);
      els.rows.innerHTML = boardRowsHtml(ctx, rows, memory.selected, { month, airline: memory.airline, query: memory.query && !memory.place });
      els.boardFoot.hidden = !rows.some((v) => isUnconfirmed(v.r, v.legs));
      if (flip && !prefersReducedMotion()) {
        els.rows.classList.remove('is-flip');
        void els.rows.offsetWidth;
        els.rows.classList.add('is-flip');
      }
      for (const th of root.querySelectorAll('.tr-board th[aria-sort]')) {
        const key = th.querySelector('[data-sort]').dataset.sort;
        const on = memory.sort.key === key;
        th.setAttribute('aria-sort', on ? (memory.sort.dir > 0 ? 'ascending' : 'descending') : 'none');
        th.querySelector('.tr-sort').textContent = on ? (memory.sort.dir > 0 ? '▲' : '▼') : '↕';
      }
    }
    routeMap?.apply(vis, memory.selected);
    if (detail) renderDetail(vis);
    restoreFocus();
  }

  function select(iata, { fly = true, scroll = false } = {}) {
    memory.selected = iata;
    memory.place = null;
    refresh({ flip: view !== 'board' });
    if (iata && fly) routeMap?.focus(iata);
    if (iata && view === 'board') {
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      if (scroll) root.querySelector(`tr[data-route="${iata}"]`)?.scrollIntoView({ block: 'nearest' });
      root.querySelector('.tr-b-detail')?.scrollIntoView({ block: 'nearest', behavior });
    }
  }

  function closeSuggest() {
    els.suggest.innerHTML = '';
    els.input.setAttribute('aria-expanded', 'false');
  }

  function suggest() {
    const hits = matchRoutes(routes, memory.query).slice(0, 6);
    els.input.setAttribute('aria-expanded', String(hits.length > 0));
    els.suggest.innerHTML = hits
      .map((r) => `<li role="presentation"><button type="button" class="tr-sg" role="option" tabindex="-1" data-route="${r.iata}"><b>${esc(r.destinationCity)}</b> <span class="tr-rt-iata">${r.iata}</span> <span class="muted">${esc(r.airportName)}</span></button></li>`)
      .join('');
    els.live.textContent = memory.query ? tf(ctx, 'matches', hits.length) : '';
    return hits;
  }

  async function geocode(q) {
    abort?.abort();
    // Known cities from the drive table work offline (and give a drive time).
    const drive = data.drives.find((d) => norm(d.from) === norm(q));
    if (drive) {
      memory.place = { name: drive.from, lat: drive.fromLat, lon: drive.fromLon, drive: drive.durationText };
      return refresh();
    }
    memory.place = { name: q, loading: true };
    renderDetail([]);
    abort = new AbortController();
    try {
      const url = `${GEOCODE}?format=jsonv2&limit=1&q=${encodeURIComponent(q)}&accept-language=${encodeURIComponent(ctx.lang)}`;
      const res = await fetch(url, { signal: abort.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const [hit] = await res.json();
      if (!hit) memory.place = { name: q, error: 'notFound' };
      else memory.place = { name: String(hit.name || hit.display_name || q).split(',')[0], lat: Number(hit.lat), lon: Number(hit.lon) };
    } catch (err) {
      if (err.name === 'AbortError') return;
      memory.place = { name: q, error: 'offline' };
    }
    refresh();
  }

  const onInput = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      memory.query = els.input.value;
      if (!memory.query) {
        memory.place = null;
      }
      suggest();
      if (view === 'board') refresh({ detail: !memory.query });
    }, 120);
  };
  const onSubmit = (e) => {
    e.preventDefault();
    clearTimeout(timer);
    memory.query = els.input.value.trim();
    if (!memory.query) return;
    const hits = suggest();
    closeSuggest();
    if (hits.length) select(hits[0].iata, { scroll: true });
    else {
      memory.selected = null;
      geocode(memory.query);
    }
  };

  const onClick = (e) => {
    const t = e.target;
    const v = t.closest('[data-view]');
    if (v) {
      if (v.dataset.view === view) return;
      memory.focus = v.dataset.view;
      return ctx.setState({ flightsView: v.dataset.view });
    }
    const m = t.closest('[data-month]');
    if (m) return ctx.setState({ month: Number(m.dataset.month) });
    const a = t.closest('[data-airline]');
    if (a) {
      memory.airline = a.dataset.airline;
      return refresh();
    }
    if (t.closest('[data-more]')) {
      memory.moreAirlines = !memory.moreAirlines;
      refresh({ detail: false });
      return els.airlines.querySelector('[data-more]')?.focus();
    }
    const s = t.closest('[data-sort]');
    if (s) {
      const key = s.dataset.sort;
      memory.sort = { key, dir: memory.sort.key === key ? -memory.sort.dir : key === 'weekly' ? -1 : 1 };
      refresh({ detail: false });
      return root.querySelector(`[data-sort="${key}"]`)?.focus();
    }
    const use = t.closest('[data-use]');
    if (use) {
      const r = byIata.get(use.dataset.use);
      const air = [...new Set(activeLegs(r, month, memory.airline).map((l) => l.airline))];
      return onPrefill(tf(ctx, 'prefillRoute', r.destinationCity, r.iata, (air.length ? air : r.airlines).join(` ${ctx.t(TF.and)} `)), month);
    }
    if (t.closest('[data-clear]')) {
      memory.selected = null;
      memory.place = null;
      memory.query = '';
      els.input.value = '';
      closeSuggest();
      refresh();
      return els.input.focus();
    }
    const r = t.closest('[data-route]');
    if (r) {
      const fromSuggest = r.classList.contains('tr-sg');
      if (fromSuggest) {
        closeSuggest();
        els.input.value = byIata.get(r.dataset.route).destinationCity;
        memory.query = els.input.value;
      }
      const iata = r.dataset.route;
      select(view === 'board' && memory.selected === iata && !fromSuggest ? null : iata, { scroll: fromSuggest });
      if (fromSuggest) root.querySelector('.tr-detail[tabindex]')?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 900px)').matches && view === 'map' && !fromSuggest) root.querySelector('.tr-map')?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  // Suggestion list as a combobox: arrows move through it, Escape closes it.
  const onKey = (e) => {
    const items = [...els.suggest.querySelectorAll('.tr-sg')];
    if (!items.length) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      clearTimeout(timer);
      closeSuggest();
      return els.input.focus();
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown' ? Math.min(i + 1, items.length - 1) : i - 1;
    (next < 0 ? els.input : items[next]).focus();
  };
  const onFocusOut = (e) => {
    if (!els.form.contains(e.relatedTarget)) closeSuggest();
  };
  // Keep focus in the input while a suggestion is clicked (Safari does not focus buttons).
  const onSuggestDown = (e) => e.preventDefault();

  root.addEventListener('click', onClick);
  els.input.addEventListener('input', onInput);
  els.form.addEventListener('submit', onSubmit);
  els.form.addEventListener('keydown', onKey);
  els.form.addEventListener('focusout', onFocusOut);
  els.suggest.addEventListener('mousedown', onSuggestDown);

  // Phones: start with the long country list folded away.
  if (window.matchMedia('(max-width: 900px)').matches) root.querySelector('.tr-countries')?.removeAttribute('open');

  let clockTimer = 0;
  if (els.clock) {
    const fmt = new Intl.DateTimeFormat(ctx.lang, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zagreb' });
    const tick = () => (els.clock.textContent = fmt.format(new Date()));
    tick();
    clockTimer = setInterval(tick, 30000);
  }

  refresh();

  if (memory.focus) {
    root.querySelector(`[data-view="${memory.focus}"]`)?.focus();
    memory.focus = null;
  }

  if (view === 'map') {
    const host = $('[data-map]');
    try {
      routeMap = await createRouteMap(host, ctx, data, routes, { onSelect: (iata) => select(iata, { fly: false }) });
      refresh({ detail: false });
      if (memory.place?.lat) renderDetail();
      else if (memory.selected) routeMap.focus(memory.selected);
    } catch (err) {
      console.error('[travel] flight map failed', err);
      $('[data-map-error]')?.removeAttribute('hidden');
    }
  }

  return {
    setMonth(m) {
      month = m || 0;
      refresh();
    },
    setBasemap(name) {
      routeMap?.setBasemap(name);
    },
    destroy() {
      root.removeEventListener('click', onClick);
      els.input.removeEventListener('input', onInput);
      els.form.removeEventListener('submit', onSubmit);
      els.form.removeEventListener('keydown', onKey);
      els.form.removeEventListener('focusout', onFocusOut);
      els.suggest.removeEventListener('mousedown', onSuggestDown);
      clearTimeout(timer);
      clearInterval(clockTimer);
      abort?.abort();
      routeMap?.destroy();
    },
  };
}
