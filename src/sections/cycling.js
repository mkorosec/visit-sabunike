// Cycling: eight routes that start and finish at the driveway. Route cards with
// a sparkline, a Leaflet map (selected route bold, the others faint), an
// interactive elevation profile that scrubs a marker along the map, GPX export
// and a share link (#cycling&route=<id>). Month-aware: a riding calendar and
// conditions for state.month. Route data (≈100 kB) is loaded in mount().
import './cycling.css';
import CLIMATE from '../data/climate.json';
import { esc, icon, monthName, fromVilla, formatKm, formatMinutes, haversineKm, toast, prefersReducedMotion } from '../lib/util.js';
import { ownerTodo } from './core-shared.js';
import { monthVars } from './live-weather.js';

// ---------------------------------------------------------------- strings
// Month templates: {m} month name, {mIn} month after "in" (sl/hr locative), {M} capitalised (see monthVars).
const L = {
  eyebrow: { en: 'Cycling from the door', de: 'Radfahren ab Haustür', sl: 'S kolesom izpred vrat', hr: 'Biciklom od kućnih vrata', it: 'In bici da casa' },
  title: {
    en: 'Eight rides that start at our driveway',
    de: 'Acht Touren, die an unserer Einfahrt beginnen',
    sl: 'Osem tur, ki se začnejo na našem dvorišču',
    hr: 'Osam tura koje počinju u našem dvorištu',
    it: 'Otto giri che partono dal nostro vialetto',
  },
  titleStar: {
    en: 'Clip in at the gate: eight routes from flat lagoon loops to the Velebit',
    de: 'Am Tor einklicken: acht Routen von der flachen Lagunenrunde bis zum Velebit',
    sl: 'Vpnite se pred vrati: osem poti, od ravnih krogov ob laguni do Velebita',
    hr: 'Uklopite pedale pred vratima: osam ruta, od ravnih krugova uz lagunu do Velebita',
    it: 'Agganciate i pedali al cancello: otto percorsi, dagli anelli piatti della laguna al Velebit',
  },
  lede: {
    en: 'Flat coastal roads to warm up, quiet villages inland, island bridges and one big mountain. Every route below starts and finishes at the house, with a GPX file you can load onto your bike computer.',
    de: 'Flache Küstenstraßen zum Einrollen, ruhige Dörfer im Hinterland, Inselbrücken und ein großer Berg. Jede Route startet und endet am Haus, mit GPX-Datei für Ihren Radcomputer.',
    sl: 'Ravne obalne ceste za ogrevanje, mirne vasi v zaledju, mostovi na otoke in ena velika gora. Vsaka spodnja pot se začne in konča pri hiši, z datoteko GPX za vaš kolesarski računalnik.',
    hr: 'Ravne obalne ceste za zagrijavanje, mirna sela u zaleđu, mostovi prema otocima i jedna velika planina. Svaka ruta u nastavku počinje i završava kod kuće, s GPX datotekom za vaše biciklističko računalo.',
    it: 'Strade costiere pianeggianti per scaldarsi, paesini tranquilli nell’entroterra, ponti verso le isole e una grande montagna. Ogni percorso qui sotto parte e arriva alla casa, con un file GPX da caricare sul vostro ciclocomputer.',
  },
  statRoutes: { en: 'routes from the driveway', de: 'Routen ab der Einfahrt', sl: 'poti z dvorišča', hr: 'ruta iz dvorišta', it: 'percorsi dal vialetto' },
  statRange: { en: 'shortest to longest', de: 'kürzeste bis längste', sl: 'od najkrajše do najdaljše', hr: 'od najkraće do najduže', it: 'dal più corto al più lungo' },
  statClimb: { en: 'climbing on the Velebit epic (±15 %)', de: 'Höhenmeter auf der Velebit-Tour (±15 %)', sl: 'vzpona na veliki turi na Velebit (±15 %)', hr: 'uspona na velikoj turi na Velebit (±15 %)', it: 'di dislivello sul grande giro del Velebit (±15 %)' },
  statOfficial: { en: 'official tourist-board routes nearby', de: 'offizielle Routen des Tourismusverbands in der Nähe', sl: 'uradnih poti turistične zveze v bližini', hr: 'službenih ruta turističke zajednice u blizini', it: 'percorsi ufficiali dell’ente turistico nei dintorni' },
  calendarTitle: { en: 'When to ride', de: 'Wann fahren', sl: 'Kdaj kolesariti', hr: 'Kada voziti', it: 'Quando pedalare' },
  calendarHint: {
    en: 'Bar height: how many of our 8 routes are at their best that month (lighter: summer evenings only). Tap a month.',
    de: 'Balkenhöhe: wie viele unserer 8 Routen in diesem Monat ideal sind (heller: nur Sommerabende). Monat antippen.',
    sl: 'Višina stolpca: koliko od naših 8 poti je ta mesec v najboljši sezoni (svetlejše: samo poletni večeri). Tapnite mesec.',
    hr: 'Visina stupca: koliko je od naših 8 ruta taj mjesec u najboljoj sezoni (svjetlije: samo ljetne večeri). Dodirnite mjesec.',
    it: 'Altezza della barra: quanti dei nostri 8 percorsi sono al meglio in quel mese (più chiaro: solo le sere d’estate). Toccate un mese.',
  },
  calendarGroup: { en: 'Riding calendar: choose your travel month', de: 'Radkalender: Reisemonat wählen', sl: 'Kolesarski koledar: izberite mesec potovanja', hr: 'Biciklistički kalendar: odaberite mjesec putovanja', it: 'Calendario ciclistico: scegliete il mese del viaggio' },
  routesBest: { en: '{n} of 8 routes at their best', de: '{n} von 8 Routen ideal', sl: '{n} od 8 poti v najboljši sezoni', hr: '{n} od 8 ruta u najboljoj sezoni', it: '{n} su 8 percorsi al meglio' },
  avgHigh: { en: 'average high', de: 'mittleres Maximum', sl: 'povprečna najvišja', hr: 'prosječni maksimum', it: 'massima media' },
  anyMonthTitle: { en: 'Best riding: spring and early autumn', de: 'Beste Radzeit: Frühling und Frühherbst', sl: 'Najlepše kolesarjenje: pomlad in zgodnja jesen', hr: 'Najbolja vožnja: proljeće i rana jesen', it: 'Il periodo migliore: primavera e inizio autunno' },
  anyMonthText: {
    en: 'April to June and mid-September to October bring highs of 18–27 °C. March and November are mild but windier and wetter. In July and August highs reach about 30 °C, so ride before 10:00 and swim after.',
    de: 'April bis Juni und Mitte September bis Oktober bringen 18–27 °C. März und November sind mild, aber windiger und nasser. Im Juli und August werden es etwa 30 °C: vor 10 Uhr fahren, danach baden.',
    sl: 'Od aprila do junija in od sredine septembra do oktobra so najvišje temperature 18–27 °C. Marec in november sta mila, a bolj vetrovna in deževna. Julija in avgusta se temperature povzpnejo do približno 30 °C, zato kolesarite pred 10.00 in se nato kopajte.',
    hr: 'Od travnja do lipnja i od sredine rujna do listopada maksimumi su 18–27 °C. Ožujak i studeni su blagi, ali vjetrovitiji i kišovitiji. U srpnju i kolovozu maksimumi dosežu oko 30 °C, pa vozite prije 10 sati, a zatim se kupajte.',
    it: 'Da aprile a giugno e da metà settembre a ottobre le massime sono di 18–27 °C. Marzo e novembre sono miti ma più ventosi e piovosi. A luglio e agosto si arriva a circa 30 °C: pedalate prima delle 10:00 e poi fate il bagno.',
  },
  pickMonth: {
    en: 'Pick a month to see riding conditions and which routes are in season.',
    de: 'Wählen Sie einen Monat, um Bedingungen und passende Routen zu sehen.',
    sl: 'Izberite mesec in poglejte razmere za kolesarjenje ter katere poti so takrat v sezoni.',
    hr: 'Odaberite mjesec i pogledajte uvjete za vožnju te koje su rute tada u sezoni.',
    it: 'Scegliete un mese per vedere le condizioni e quali percorsi sono di stagione.',
  },
  ridingIn: { en: 'Riding in {m}', de: 'Radfahren im {m}', sl: 'Kolesarjenje v {mIn}', hr: 'Vožnja biciklom u {mIn}', it: 'Pedalare in {m}' },
  high: { en: 'High', de: 'Max.', sl: 'Najv.', hr: 'Maks.', it: 'Max' },
  low: { en: 'Low', de: 'Min.', sl: 'Najn.', hr: 'Min.', it: 'Min' },
  rainDays: { en: 'Rain days', de: 'Regentage', sl: 'Deževni dnevi', hr: 'Kišni dani', it: 'Giorni di pioggia' },
  neDays: { en: 'Days with NE wind over 20 km/h', de: 'Tage mit NO-Wind über 20 km/h', sl: 'Dnevi s SV vetrom nad 20 km/h', hr: 'Dani sa SI vjetrom iznad 20 km/h', it: 'Giorni con vento da NE oltre 20 km/h' },
  sea: { en: 'Sea, for the swim after', de: 'Meer, fürs Bad danach', sl: 'Morje, za kopanje po vožnji', hr: 'More, za kupanje nakon vožnje', it: 'Mare, per il bagno dopo' },
  wind: { en: 'Wind', de: 'Wind', sl: 'Veter', hr: 'Vjetar', it: 'Vento' },
  climateSource: {
    en: 'Air and wind: averages 2016–2025 for the house location (Open-Meteo archive). Sea: 2021–2025 (Open-Meteo marine API).',
    de: 'Luft und Wind: Mittelwerte 2016–2025 für den Standort des Hauses (Open-Meteo-Archiv). Meer: 2021–2025 (Open-Meteo-Marine-API).',
    sl: 'Zrak in veter: povprečja 2016–2025 za lokacijo hiše (arhiv Open-Meteo). Morje: 2021–2025 (morski API Open-Meteo).',
    hr: 'Zrak i vjetar: prosjeci 2016.–2025. za lokaciju kuće (arhiv Open-Meteo). More: 2021.–2025. (Open-Meteo API za more).',
    it: 'Aria e vento: medie 2016–2025 per la posizione della casa (archivio Open-Meteo). Mare: 2021–2025 (API marina di Open-Meteo).',
  },
  routesBestEve: {
    en: '{n} of 8 routes at their best, {e} more on summer evenings',
    de: '{n} von 8 Routen ideal, {e} weitere an Sommerabenden',
    sl: '{n} od 8 poti v najboljši sezoni, še {e} ob poletnih večerih',
    hr: '{n} od 8 ruta u najboljoj sezoni, još {e} ljetnim večerima',
    it: '{n} su 8 percorsi al meglio, +{e} nelle sere d’estate',
  },
  filterType: { en: 'Route type', de: 'Routentyp', sl: 'Vrsta poti', hr: 'Vrsta rute', it: 'Tipo di percorso' },
  filterDist: { en: 'Distance', de: 'Distanz', sl: 'Razdalja', hr: 'Udaljenost', it: 'Distanza' },
  all: { en: 'All', de: 'Alle', sl: 'Vse', hr: 'Sve', it: 'Tutti' },
  anyLength: { en: 'Any length', de: 'Jede Länge', sl: 'Katera koli dolžina', hr: 'Bilo koja duljina', it: 'Qualsiasi lunghezza' },
  showing: { en: '{n} of {total} routes', de: '{n} von {total} Routen', sl: '{n} od {total} poti', hr: '{n} od {total} ruta', it: '{n} di {total} percorsi' },
  noMatch: { en: 'No route matches these filters.', de: 'Keine Route passt zu diesen Filtern.', sl: 'Tem filtrom ne ustreza nobena pot.', hr: 'Nijedna ruta ne odgovara ovim filtrima.', it: 'Nessun percorso corrisponde a questi filtri.' },
  reset: { en: 'Reset filters', de: 'Filter zurücksetzen', sl: 'Ponastavi filtre', hr: 'Poništi filtre', it: 'Azzera i filtri' },
  routesList: { en: 'Routes', de: 'Routen', sl: 'Poti', hr: 'Rute', it: 'Percorsi' },
  difficulty: { en: 'Difficulty {n} of 5', de: 'Schwierigkeit {n} von 5', sl: 'Zahtevnost {n} od 5', hr: 'Zahtjevnost {n} od 5', it: 'Difficoltà {n} su 5' },
  distance: { en: 'Distance', de: 'Distanz', sl: 'Razdalja', hr: 'Udaljenost', it: 'Distanza' },
  climbing: { en: 'Climbing', de: 'Anstieg', sl: 'Vzpon', hr: 'Uspon', it: 'Dislivello' },
  highPoint: { en: 'High point', de: 'Höchster Punkt', sl: 'Najvišja točka', hr: 'Najviša točka', it: 'Punto più alto' },
  rideTime: { en: 'Riding time', de: 'Fahrzeit', sl: 'Čas vožnje', hr: 'Vrijeme vožnje', it: 'Tempo in sella' },
  rideTimeNote: { en: 'router estimate, without stops', de: 'Schätzung des Routers, ohne Pausen', sl: 'ocena načrtovalnika poti, brez postankov', hr: 'procjena planera rute, bez zaustavljanja', it: 'stima del navigatore, senza soste' },
  climbNote: { en: '±15 %, from a terrain model', de: '±15 %, aus einem Geländemodell', sl: '±15 %, iz modela terena', hr: '±15 %, iz modela terena', it: '±15 %, da un modello del terreno' },
  approxM: { en: '≈ {m} m', de: '≈ {m} m', sl: '≈ {m} m', hr: '≈ {m} m', it: '≈ {m} m' },
  upM: { en: '↑ ≈ {m} m', de: '↑ ≈ {m} m', sl: '↑ ≈ {m} m', hr: '↑ ≈ {m} m', it: '↑ ≈ {m} m' },
  kmAt: { en: 'km {km}', de: 'km {km}', sl: 'km {km}', hr: 'km {km}', it: 'km {km}' },
  wpReadout: { en: 'km {km} · ≈ {ele} m', de: 'km {km} · ≈ {ele} m', sl: 'km {km} · ≈ {ele} m', hr: 'km {km} · ≈ {ele} m', it: 'km {km} · ≈ {ele} m' },
  tipReadout: { en: '≈ {ele} m · km {km}', de: '≈ {ele} m · km {km}', sl: '≈ {ele} m · km {km}', hr: '≈ {ele} m · km {km}', it: '≈ {ele} m · km {km}' },
  sliderText: { en: 'km {km}, about {ele} m', de: 'km {km}, etwa {ele} m', sl: 'km {km}, približno {ele} m', hr: 'km {km}, oko {ele} m', it: 'km {km}, circa {ele} m' },
  reported: { en: 'Reported: {text}', de: 'Berichtet: {text}', sl: 'Po poročilih: {text}', hr: 'Prema navodima: {text}', it: 'Segnalato: {text}' },
  bestIn: { en: 'Best in {m}', de: 'Ideal im {m}', sl: 'Idealna v {mIn}', hr: 'Idealna u {mIn}', it: 'Ideale in {m}' },
  eveningsIn: { en: '{m}: evenings only', de: '{m}: nur abends', sl: '{M}: samo zvečer', hr: '{M}: samo navečer', it: '{M}: solo di sera' },
  offIn: { en: 'Not at its best in {m}', de: 'Im {m} nicht ideal', sl: 'V {mIn} ni idealna', hr: 'U {mIn} nije idealna', it: 'Non ideale in {m}' },
  bestMonths: { en: 'Best months', de: 'Beste Monate', sl: 'Najboljši meseci', hr: 'Najbolji mjeseci', it: 'Mesi migliori' },
  evenings: { en: 'summer evenings', de: 'Sommerabende', sl: 'poletni večeri', hr: 'ljetne večeri', it: 'sere d’estate' },
  plusEvenings: { en: '{n} on summer evenings', de: '{n} an Sommerabenden', sl: 'še {n} ob poletnih večerih', hr: 'još {n} ljetnim večerima', it: '+{n} nelle sere d’estate' },
  goodFor: { en: 'Good for', de: 'Geeignet für', sl: 'Primerno za', hr: 'Dobro za', it: 'Ideale per' },
  highlights: { en: 'On the way', de: 'Unterwegs', sl: 'Na poti', hr: 'Usput', it: 'Lungo il percorso' },
  surface: { en: 'Surface', de: 'Belag', sl: 'Podlaga', hr: 'Podloga', it: 'Fondo' },
  heads: { en: 'Heads-up', de: 'Gut zu wissen', sl: 'Dobro je vedeti', hr: 'Dobro je znati', it: 'Da sapere' },
  routerNote: {
    en: 'Planned with a cycle router on OpenStreetMap data. Check surfaces and conditions locally before you ride.',
    de: 'Mit einem Fahrrad-Router auf OpenStreetMap-Daten geplant. Belag und Bedingungen vor Ort prüfen.',
    sl: 'Načrtovano s kolesarskim načrtovalnikom poti na podatkih OpenStreetMap. Pred vožnjo na kraju preverite podlago in razmere.',
    hr: 'Isplanirano biciklističkim planerom ruta na podacima OpenStreetMapa. Prije vožnje na licu mjesta provjerite podlogu i uvjete.',
    it: 'Pianificato con un navigatore per bici sui dati di OpenStreetMap. Prima di partire verificate sul posto fondo e condizioni.',
  },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  gpx: { en: 'Download GPX', de: 'GPX herunterladen', sl: 'Prenesi GPX', hr: 'Preuzmi GPX', it: 'Scarica GPX' },
  gpxNote: {
    en: 'Simplified track for planning ({n} points). Let your bike computer route along it; the distance it shows can be a few per cent shorter.',
    de: 'Vereinfachter Track zur Planung ({n} Punkte). Lassen Sie Ihren Radcomputer daran entlang routen; die angezeigte Distanz kann einige Prozent kürzer sein.',
    sl: 'Poenostavljena sled za načrtovanje (število točk: {n}). Naj kolesarski računalnik načrtuje pot vzdolž nje; prikazana razdalja je lahko nekaj odstotkov krajša.',
    hr: 'Pojednostavljeni trag za planiranje (broj točaka: {n}). Neka biciklističko računalo planira rutu duž njega; prikazana udaljenost može biti nekoliko posto kraća.',
    it: 'Traccia semplificata per la pianificazione ({n} punti). Lasciate che il ciclocomputer calcoli il percorso lungo la traccia; la distanza indicata può risultare più corta di qualche punto percentuale.',
  },
  gpxDesc: {
    en: '{km} km, about {up} m climbing. Start and finish: {brand}, Put kandelica 60, Sabunike. Simplified track for planning ({n} points), made with a cycle router on OpenStreetMap data: let your device route along it. Elevation interpolated from the route profile. Check local conditions before riding.',
    de: '{km} km, etwa {up} Höhenmeter. Start und Ziel: {brand}, Put kandelica 60, Sabunike. Vereinfachter Track zur Planung ({n} Punkte), mit einem Fahrrad-Router auf OpenStreetMap-Daten erstellt: lassen Sie Ihr Gerät daran entlang routen. Höhen aus dem Routenprofil interpoliert. Bedingungen vor Ort prüfen.',
    sl: '{km} km, približno {up} m vzpona. Start in cilj: {brand}, Put kandelica 60, Sabunike. Poenostavljena sled za načrtovanje (število točk: {n}), izdelana s kolesarskim načrtovalnikom poti na podatkih OpenStreetMap: naj naprava načrtuje pot vzdolž nje. Nadmorske višine so interpolirane iz profila poti. Pred vožnjo preverite razmere na kraju.',
    hr: '{km} km, oko {up} m uspona. Start i cilj: {brand}, Put kandelica 60, Sabunike. Pojednostavljeni trag za planiranje (broj točaka: {n}), izrađen biciklističkim planerom ruta na podacima OpenStreetMapa: neka uređaj planira rutu duž njega. Visine su interpolirane iz profila rute. Prije vožnje provjerite uvjete na licu mjesta.',
    it: '{km} km, circa {up} m di dislivello. Partenza e arrivo: {brand}, Put kandelica 60, Sabunike. Traccia semplificata per la pianificazione ({n} punti), creata con un navigatore per bici sui dati di OpenStreetMap: lasciate che il dispositivo calcoli il percorso lungo la traccia. Quote interpolate dal profilo del percorso. Verificate le condizioni sul posto prima di partire.',
  },
  share: { en: 'Send route to my phone', de: 'Route aufs Handy schicken', sl: 'Pošlji pot na moj telefon', hr: 'Pošalji rutu na moj mobitel', it: 'Invia il percorso al mio telefono' },
  mailIt: { en: 'or e-mail it to yourself', de: 'oder per E-Mail an sich selbst', sl: 'ali si jo pošljite po e-pošti', hr: 'ili je pošaljite sebi e-poštom', it: 'oppure inviatevelo per e-mail' },
  copied: { en: 'Link copied. Open it on your phone.', de: 'Link kopiert. Auf dem Handy öffnen.', sl: 'Povezava je kopirana. Odprite jo na telefonu.', hr: 'Poveznica je kopirana. Otvorite je na mobitelu.', it: 'Link copiato. Apritelo sul telefono.' },
  ask: { en: 'Ask about a cycling stay', de: 'Radurlaub anfragen', sl: 'Povprašajte za kolesarske počitnice', hr: 'Pošaljite upit za biciklistički odmor', it: 'Chiedeteci di una vacanza in bici' },
  askMessage: {
    en: 'We would like to ride "{route}". Is there lockable storage for our bikes?',
    de: 'Wir möchten „{route}“ fahren. Gibt es einen abschließbaren Platz für unsere Räder?',
    sl: 'Radi bi prevozili pot »{route}«. Ali imate prostor za kolesa, ki ga je mogoče zakleniti?',
    hr: 'Željeli bismo voziti rutu „{route}”. Imate li prostor za bicikle koji se može zaključati?',
    it: 'Vorremmo percorrere «{route}». C’è un posto chiudibile a chiave per le nostre bici?',
  },
  gpxSaved: { en: 'GPX saved: {file}', de: 'GPX gespeichert: {file}', sl: 'GPX je shranjen: {file}', hr: 'GPX je spremljen: {file}', it: 'GPX salvato: {file}' },
  mapLabel: { en: 'Map of the selected cycling route', de: 'Karte der gewählten Radroute', sl: 'Zemljevid izbrane kolesarske poti', hr: 'Karta odabrane biciklističke rute', it: 'Mappa del percorso in bici selezionato' },
  legendSel: { en: 'Selected route', de: 'Gewählte Route', sl: 'Izbrana pot', hr: 'Odabrana ruta', it: 'Percorso selezionato' },
  legendOther: { en: 'Other routes (tap to select)', de: 'Andere Routen (antippen)', sl: 'Druge poti (tapnite za izbiro)', hr: 'Druge rute (dodirnite za odabir)', it: 'Altri percorsi (toccate per selezionare)' },
  legendHouse: { en: 'Start & finish: the house', de: 'Start & Ziel: das Haus', sl: 'Start in cilj: hiša', hr: 'Start i cilj: kuća', it: 'Partenza e arrivo: la casa' },
  legendWp: { en: 'Waypoints', de: 'Wegpunkte', sl: 'Točke na poti', hr: 'Točke na ruti', it: 'Punti di passaggio' },
  shopsToggle: { en: 'Bike shops & repair stands', de: 'Radläden & Reparaturstationen', sl: 'Kolesarske trgovine in servisna stojala', hr: 'Trgovine za bicikle i servisni stalci', it: 'Negozi di bici e stazioni di riparazione' },
  loadingMap: { en: 'Loading the route map…', de: 'Routenkarte wird geladen…', sl: 'Nalagamo zemljevid poti…', hr: 'Učitavamo kartu ruta…', it: 'Caricamento della mappa dei percorsi…' },
  loading: { en: 'Loading routes…', de: 'Routen werden geladen…', sl: 'Nalagamo poti…', hr: 'Učitavamo rute…', it: 'Caricamento dei percorsi…' },
  profile: { en: 'Elevation profile', de: 'Höhenprofil', sl: 'Višinski profil', hr: 'Visinski profil', it: 'Profilo altimetrico' },
  profileHint: {
    en: 'Move along the profile to follow the route on the map.',
    de: 'Über das Profil fahren, um der Route auf der Karte zu folgen.',
    sl: 'Premikajte se po profilu in spremljajte pot na zemljevidu.',
    hr: 'Pomičite se po profilu i pratite rutu na karti.',
    it: 'Scorrete lungo il profilo per seguire il percorso sulla mappa.',
  },
  profileSlider: { en: 'Position along the route', de: 'Position auf der Route', sl: 'Položaj na poti', hr: 'Položaj na ruti', it: 'Posizione lungo il percorso' },
  gradient: { en: '≈ {g} % around here', de: '≈ {g} % in diesem Abschnitt', sl: '≈ {g} % na tem odseku', hr: '≈ {g} % na ovoj dionici', it: '≈ {g} % in questo tratto' },
  waypoints: { en: 'Waypoints', de: 'Wegpunkte', sl: 'Točke na poti', hr: 'Točke na ruti', it: 'Punti di passaggio' },
  start: { en: 'Start at the house', de: 'Start am Haus', sl: 'Start pri hiši', hr: 'Start kod kuće', it: 'Partenza dalla casa' },
  finish: { en: 'Back at the house', de: 'Zurück am Haus', sl: 'Spet pri hiši', hr: 'Povratak do kuće', it: 'Ritorno alla casa' },
  ridersTitle: { en: 'Built for riders', de: 'Für Radfahrer', sl: 'Po meri kolesarjev', hr: 'Po mjeri biciklista', it: 'Pensato per chi pedala' },
  ridersLede: {
    en: 'What the house offers today, and what to ask us about before you pack.',
    de: 'Was das Haus heute bietet und was Sie vor dem Packen fragen sollten.',
    sl: 'Kaj hiša ponuja danes in kaj nas vprašati, preden se odpravite na pot.',
    hr: 'Što kuća danas nudi i što nas pitati prije nego što spakirate stvari.',
    it: 'Cosa offre oggi la casa, e cosa chiederci prima di fare i bagagli.',
  },
  askUs: { en: 'Ask us', de: 'Fragen Sie uns', sl: 'Vprašajte nas', hr: 'Pitajte nas', it: 'Chiedeteci' },
  shopsTitle: { en: 'Bike shops & rentals', de: 'Radläden & Verleih', sl: 'Kolesarske trgovine in izposoja', hr: 'Trgovine i najam bicikala', it: 'Negozi e noleggio bici' },
  shopsLede: { en: 'Straight-line distances from the house.', de: 'Luftlinie vom Haus.', sl: 'Zračne razdalje od hiše.', hr: 'Zračne udaljenosti od kuće.', it: 'Distanze in linea d’aria dalla casa.' },
  shopsAll: { en: 'Show all {n} shops', de: 'Alle {n} Läden zeigen', sl: 'Pokaži vse trgovine ({n})', hr: 'Prikaži sve trgovine ({n})', it: 'Mostra tutti i {n} negozi' },
  hoursOsm: { en: 'Hours (OpenStreetMap): {h}', de: 'Öffnungszeiten (OpenStreetMap): {h}', sl: 'Delovni čas (OpenStreetMap): {h}', hr: 'Radno vrijeme (OpenStreetMap): {h}', it: 'Orari (OpenStreetMap): {h}' },
  website: { en: 'Website', de: 'Website', sl: 'Spletna stran', hr: 'Web-stranica', it: 'Sito web' },
  repairStands: {
    en: 'Public repair stands (pump and tools) are listed in OpenStreetMap at Starigrad-Paklenica and Maslenica, on the longer routes. Toggle them on the map.',
    de: 'Öffentliche Reparaturstationen (Pumpe und Werkzeug) sind in OpenStreetMap in Starigrad-Paklenica und Maslenica verzeichnet. Auf der Karte einblenden.',
    sl: 'Javna servisna stojala (tlačilka in orodje) so v OpenStreetMap navedena v Starigradu-Paklenici in Maslenici, na daljših poteh. Prikažete jih lahko na zemljevidu.',
    hr: 'Javni servisni stalci (pumpa i alat) navedeni su u OpenStreetMapu u Starigradu-Paklenici i Maslenici, na duljim rutama. Možete ih uključiti na karti.',
    it: 'In OpenStreetMap sono indicate stazioni di riparazione pubbliche (pompa e attrezzi) a Starigrad-Paklenica e Maslenica, lungo i percorsi più lunghi. Attivatele sulla mappa.',
  },
  rentNinDesc: {
    en: 'Bikes for all ages, child seats, helmets and maps. Advertises free delivery to holiday apartments in Nin; ask whether they deliver to Sabunike.',
    de: 'Räder für alle Altersgruppen, Kindersitze, Helme und Karten. Wirbt mit kostenloser Lieferung zu Ferienwohnungen in Nin; fragen Sie, ob auch nach Sabunike geliefert wird.',
    sl: 'Kolesa za vse starosti, otroški sedeži, čelade in zemljevidi. Oglašujejo brezplačno dostavo do počitniških apartmajev v Ninu; vprašajte, ali dostavijo tudi v Sabunike.',
    hr: 'Bicikli za sve uzraste, dječje sjedalice, kacige i karte. Oglašavaju besplatnu dostavu do apartmana u Ninu; pitajte dostavljaju li i u Sabunike.',
    it: 'Bici per tutte le età, seggiolini, caschi e mappe. Pubblicizzano la consegna gratuita agli appartamenti per le vacanze di Nin; chiedete se consegnano anche a Sabunike.',
  },
  zatonDesc: {
    en: 'Reported by kroati.de: rents bikes to non-guests too (entry fee to the grounds). Check before you go.',
    de: 'Laut kroati.de: verleiht Räder auch an Nicht-Gäste (Eintritt zum Gelände). Vorher prüfen.',
    sl: 'Po navedbah kroati.de: kolesa izposojajo tudi gostom, ki tam ne bivajo (vstopnina v kompleks). Preverite pred odhodom.',
    hr: 'Prema kroati.de: bicikle iznajmljuju i onima koji tamo ne borave (ulaznica u kompleks). Provjerite prije polaska.',
    it: 'Secondo kroati.de: noleggia bici anche a chi non vi soggiorna (ingresso a pagamento al complesso). Verificate prima di andare.',
  },
  roadTitle: { en: 'On the road in Croatia', de: 'Unterwegs in Kroatien', sl: 'Na cesti na Hrvaškem', hr: 'Na cesti u Hrvatskoj', it: 'Su strada in Croazia' },
  rules: { en: 'Rules', de: 'Regeln', sl: 'Pravila', hr: 'Pravila', it: 'Regole' },
  traffic: { en: 'Traffic', de: 'Verkehr', sl: 'Promet', hr: 'Promet', it: 'Traffico' },
  officialTitle: {
    en: '{n} more official routes nearby',
    de: '{n} weitere offizielle Routen in der Nähe',
    sl: 'Uradne poti v bližini: še {n}',
    hr: 'Službene rute u blizini: još {n}',
    it: 'Altri {n} percorsi ufficiali nei dintorni',
  },
  officialText: {
    en: 'The Zadar County tourist board publishes the "Zadar Bike Magic" routes with GPS tracks. It notes they are not formal bikeways and their condition is not guaranteed.',
    de: 'Der Tourismusverband Zadar veröffentlicht die „Zadar Bike Magic“-Routen mit GPS-Tracks. Laut Verband sind es keine offiziellen Radwege, ihr Zustand wird nicht garantiert.',
    sl: 'Turistična zveza Zadrske županije objavlja poti »Zadar Bike Magic« s sledmi GPS. Navaja, da to niso uradne kolesarske steze in da njihovo stanje ni zagotovljeno.',
    hr: 'Turistička zajednica Zadarske županije objavljuje rute „Zadar Bike Magic” s GPS tragovima. Navodi da to nisu službene biciklističke staze i da njihovo stanje nije zajamčeno.',
    it: 'L’ente turistico della contea di Zadar pubblica i percorsi «Zadar Bike Magic» con tracce GPS. Precisa che non sono piste ciclabili ufficiali e che il loro stato non è garantito.',
  },
  colCode: { en: 'Route', de: 'Route', sl: 'Pot', hr: 'Ruta', it: 'Percorso' },
  colStart: { en: 'Start / finish', de: 'Start / Ziel', sl: 'Start / cilj', hr: 'Start / cilj', it: 'Partenza / arrivo' },
  colVia: { en: 'Via', de: 'Über', sl: 'Prek', hr: 'Preko', it: 'Via' },
  colKm: { en: 'km', de: 'km', sl: 'km', hr: 'km', it: 'km' },
  colUp: { en: 'Climb', de: 'Anstieg', sl: 'Vzpon', hr: 'Uspon', it: 'Dislivello' },
  colLevel: { en: 'Fitness', de: 'Kondition', sl: 'Kondicija', hr: 'Kondicija', it: 'Forma fisica' },
  notMarked: { en: 'not yet marked', de: 'noch nicht markiert', sl: 'še ni označena', hr: 'još nije označena', it: 'non ancora segnalato' },
  eventTitle: { en: 'Race weekend', de: 'Rennwochenende', sl: 'Dirkaški vikend', hr: 'Trkaći vikend', it: 'Weekend di gara' },
  eventUpcoming: {
    en: '{date}. Start and finish at Borik, Zadar; the course passes Nin and crosses the Vir bridge.',
    de: '{date}. Start und Ziel in Borik, Zadar; die Strecke führt an Nin vorbei und über die Vir-Brücke.',
    sl: '{date}. Start in cilj na Boriku v Zadru; proga vodi mimo Nina in čez most na Vir.',
    hr: '{date}. Start i cilj na Boriku u Zadru; staza prolazi pokraj Nina i preko mosta za Vir.',
    it: '{date}. Partenza e arrivo a Borik, Zadar; il tracciato passa da Nin e attraversa il ponte di Vir.',
  },
  eventPast: {
    en: 'The {year} edition was on {date}; the next date has not been announced yet. The course passes Nin and crosses the Vir bridge.',
    de: 'Die Ausgabe {year} fand am {date} statt; der nächste Termin steht noch nicht fest. Die Strecke führt an Nin vorbei und über die Vir-Brücke.',
    sl: 'Izvedba {year} je bila {date}; naslednji datum še ni objavljen. Proga vodi mimo Nina in čez most na Vir.',
    hr: 'Izdanje {year}. održano je {date}; sljedeći datum još nije objavljen. Staza prolazi pokraj Nina i preko mosta za Vir.',
    it: 'L’edizione {year} si è svolta {date}; la prossima data non è ancora stata annunciata. Il tracciato passa da Nin e attraversa il ponte di Vir.',
  },
  eventClosures: {
    en: 'Police close the course to traffic on race day (in 2023 this included streets in Nin), so expect closures around Nin and on the Vir road.',
    de: 'Die Polizei sperrt die Strecke am Renntag für den Verkehr (2023 auch Straßen in Nin): rechnen Sie mit Sperrungen rund um Nin und auf der Straße nach Vir.',
    sl: 'Na dan dirke policija progo zapre za promet (leta 2023 tudi ulice v Ninu), zato računajte na zapore okoli Nina in na cesti proti Viru.',
    hr: 'Na dan utrke policija zatvara stazu za promet (2023. i ulice u Ninu), pa računajte na zatvaranja oko Nina i na cesti prema Viru.',
    it: 'Il giorno della gara la polizia chiude il tracciato al traffico (nel 2023 anche alcune vie di Nin): aspettatevi chiusure intorno a Nin e sulla strada per Vir.',
  },
  eventDistances: {
    en: 'A 56 km course and a long one (sources give 112 or 128 km). Up to 500 riders.',
    de: 'Eine 56-km-Strecke und eine lange (Quellen nennen 112 oder 128 km). Bis zu 500 Starter.',
    sl: 'Proga 56 km in dolga proga (viri navajajo 112 ali 128 km). Do 500 kolesarjev.',
    hr: 'Staza od 56 km i duga staza (izvori navode 112 ili 128 km). Do 500 biciklista.',
    it: 'Un percorso di 56 km e uno lungo (le fonti indicano 112 o 128 km). Fino a 500 partecipanti.',
  },
  mountError: {
    en: 'The interactive route map could not start. Reload the page, or ask us and we will send you the GPX files.',
    de: 'Die interaktive Routenkarte konnte nicht starten. Laden Sie die Seite neu, oder fragen Sie uns nach den GPX-Dateien.',
    sl: 'Interaktivnega zemljevida poti ni bilo mogoče zagnati. Osvežite stran ali nam pišite in poslali vam bomo datoteke GPX.',
    hr: 'Interaktivna karta ruta nije se mogla pokrenuti. Osvježite stranicu ili nam se javite pa ćemo vam poslati GPX datoteke.',
    it: 'Non è stato possibile avviare la mappa interattiva dei percorsi. Ricaricate la pagina o scriveteci e vi invieremo i file GPX.',
  },
};

const TYPES = {
  family: { icon: 'users', label: { en: 'Family', de: 'Familie', sl: 'Družinska', hr: 'Obiteljska', it: 'Famiglia' } },
  road: { icon: 'bike', label: { en: 'Road', de: 'Rennrad', sl: 'Cestna', hr: 'Cestovna', it: 'Strada' } },
  gravel: { icon: 'mountain', label: { en: 'Gravel', de: 'Gravel', sl: 'Gravel', hr: 'Gravel', it: 'Gravel' } },
  touring: { icon: 'pin', label: { en: 'Touring', de: 'Tour', sl: 'Turna', hr: 'Turistička', it: 'Cicloturismo' } },
};

const DISTANCES = [
  { id: 'short', min: 0, max: 35, label: { en: 'Under 35 km', de: 'Unter 35 km', sl: 'Do 35 km', hr: 'Do 35 km', it: 'Meno di 35 km' } },
  { id: 'half', min: 35, max: 80, label: { en: '35–80 km', de: '35–80 km', sl: '35–80 km', hr: '35–80 km', it: '35–80 km' } },
  { id: 'long', min: 80, max: Infinity, label: { en: '80 km +', de: '80 km +', sl: '80 km +', hr: '80 km +', it: '80 km +' } },
];

const DIFFICULTY = {
  1: { en: 'Easy', de: 'Leicht', sl: 'Lahka', hr: 'Lagana', it: 'Facile' },
  2: { en: 'Easy–moderate', de: 'Leicht–mittel', sl: 'Lahka do srednja', hr: 'Lagana do srednja', it: 'Facile–media' },
  3: { en: 'Moderate', de: 'Mittel', sl: 'Srednja', hr: 'Srednja', it: 'Media' },
  4: { en: 'Hard', de: 'Schwer', sl: 'Zahtevna', hr: 'Zahtjevna', it: 'Impegnativa' },
  5: { en: 'Very hard', de: 'Sehr schwer', sl: 'Zelo zahtevna', hr: 'Vrlo zahtjevna', it: 'Molto impegnativa' },
};

// Season classes for the month verdict (research/cycling.json seasonAndWeather + climate.json).
const SEASON = {
  prime: {
    months: [4, 5, 9, 10],
    head: { en: 'Prime riding season', de: 'Beste Radzeit', sl: 'Najboljša kolesarska sezona', hr: 'Najbolja sezona za vožnju', it: 'Stagione ideale per pedalare' },
    tip: {
      en: 'Mild days and less traffic than in July and August.',
      de: 'Milde Tage und weniger Verkehr als im Juli und August.',
      sl: 'Mili dnevi in manj prometa kot julija in avgusta.',
      hr: 'Blagi dani i manje prometa nego u srpnju i kolovozu.',
      it: 'Giornate miti e meno traffico che a luglio e agosto.',
    },
  },
  warm: {
    months: [6],
    head: { en: 'Prime season, getting warm', de: 'Beste Radzeit, schon warm', sl: 'Najboljša sezona, že toplo', hr: 'Najbolja sezona, već toplo', it: 'Stagione ideale, ma fa già caldo' },
    tip: {
      en: 'Highs around {t} °C: start the long routes early and keep the afternoons for the sea. Long days, and less traffic than in July and August.',
      de: 'Um {t} °C: lange Touren früh starten, nachmittags ans Meer. Lange Tage und weniger Verkehr als im Juli und August.',
      sl: 'Najvišje okoli {t} °C: dolge poti začnite zgodaj, popoldneve pa prihranite za morje. Dolgi dnevi in manj prometa kot julija in avgusta.',
      hr: 'Maksimumi oko {t} °C: duge rute krenite rano, a poslijepodneva ostavite za more. Dugi dani i manje prometa nego u srpnju i kolovozu.',
      it: 'Massime di circa {t} °C: partite presto per i giri lunghi e tenete i pomeriggi per il mare. Giornate lunghe e meno traffico che a luglio e agosto.',
    },
  },
  hot: {
    months: [7, 8],
    head: { en: 'Hot: ride early', de: 'Heiß: früh fahren', sl: 'Vroče: kolesarite zgodaj', hr: 'Vruće: vozite rano', it: 'Caldo: pedalate presto' },
    tip: {
      en: 'Highs around 30 °C. Start at dawn, be back by 10:00, then swim. The NW maestral breeze picks up on summer afternoons, and the Nin–Vir road is busy.',
      de: 'Um 30 °C. Im Morgengrauen starten, bis 10 Uhr zurück, dann baden. Nachmittags weht der Maestral (NW), die Straße Nin–Vir ist voll.',
      sl: 'Najvišje okoli 30 °C. Začnite ob zori, vrnite se do 10.00 in se nato kopajte. Poleti popoldne zapiha severozahodni maestral, cesta Nin–Vir pa je prometna.',
      hr: 'Maksimumi oko 30 °C. Krenite u zoru, vratite se do 10 sati, a onda na kupanje. Ljeti poslijepodne zapuše sjeverozapadni maestral, a cesta Nin–Vir je prometna.',
      it: 'Massime di circa 30 °C. Partite all’alba, rientrate entro le 10:00 e poi fate il bagno. Nei pomeriggi d’estate si alza il maestrale da NO e la strada Nin–Vir è trafficata.',
    },
  },
  shoulder: {
    months: [3, 11],
    head: { en: 'Mild but changeable', de: 'Mild, aber wechselhaft', sl: 'Milo, a spremenljivo', hr: 'Blago, ali promjenjivo', it: 'Mite ma variabile' },
    tip: {
      en: 'Pick your days: more wind and rain than in spring and early autumn. Bura (NE) days are common from November to March.',
      de: 'Tage gut wählen: mehr Wind und Regen als im Frühling und Frühherbst. Bura-Tage (NO) sind von November bis März häufig.',
      sl: 'Dneve izbirajte premišljeno: več vetra in dežja kot spomladi in zgodaj jeseni. Od novembra do marca je pogosta burja (SV).',
      hr: 'Dane birajte pažljivo: više vjetra i kiše nego u proljeće i ranu jesen. Od studenoga do ožujka česti su dani s burom (SI).',
      it: 'Scegliete bene i giorni: più vento e pioggia che in primavera e a inizio autunno. Da novembre a marzo sono frequenti le giornate di bora (NE).',
    },
  },
  winter: {
    months: [12, 1, 2],
    head: { en: 'Winter: watch for bura', de: 'Winter: Achtung Bura', sl: 'Zima: pazite na burjo', hr: 'Zima: pazite na buru', it: 'Inverno: attenzione alla bora' },
    tip: {
      en: 'The cold, gusty NE bura blows on many days. Ride the coast loops on calm days, stay off the bridges in bura, and skip the Velebit: the Mali Alan road is not cleared in winter.',
      de: 'Die kalte, böige Bura (NO) weht an vielen Tagen. Küstenrunden an ruhigen Tagen, Brücken bei Bura meiden, Velebit auslassen: die Mali-Alan-Straße wird im Winter nicht geräumt.',
      sl: 'Mrzla, sunkovita severovzhodna burja piha veliko dni. Obalne kroge vozite ob mirnih dneh, ob burji se izogibajte mostovom, Velebit pa izpustite: cesta čez Mali Alan pozimi ni splužena.',
      hr: 'Hladna bura na udare sa sjeveroistoka puše mnogo dana. Obalne krugove vozite za mirnih dana, za bure izbjegavajte mostove, a Velebit preskočite: cesta preko Malog Alana zimi se ne čisti.',
      it: 'La bora fredda e a raffiche da NE soffia per molti giorni. Fate gli anelli costieri nelle giornate calme, evitate i ponti con la bora e lasciate perdere il Velebit: la strada del Mali Alan d’inverno non viene sgomberata.',
    },
  },
};

// What the house offers riders. 'ok' = verified in the listings; 'ask' = owner has not confirmed.
const RIDER_KIT = [
  {
    status: 'ok',
    icon: 'grill',
    text: {
      en: 'A kitchen or kitchenette in every apartment: breakfast whenever you leave, pasta when you are back',
      de: 'Küche oder Küchenzeile in jedem Apartment: Frühstück, wann Sie losfahren, Pasta, wenn Sie zurück sind',
      sl: 'Kuhinja ali čajna kuhinja v vsakem apartmaju: zajtrk, kadar koli odrinete, testenine, ko se vrnete',
      hr: 'Kuhinja ili čajna kuhinja u svakom apartmanu: doručak kad god krenete, tjestenina kad se vratite',
      it: 'Una cucina o un angolo cottura in ogni appartamento: colazione a qualsiasi ora partiate, pasta al ritorno',
    },
  },
  {
    status: 'ok',
    icon: 'wave',
    text: { en: 'Outdoor shower in the courtyard (kroati.de listing)', de: 'Außendusche im Hof (laut kroati.de)', sl: 'Zunanja prha na dvorišču (po oglasu na kroati.de)', hr: 'Vanjski tuš u dvorištu (prema oglasu na kroati.de)', it: 'Doccia esterna nel cortile (secondo l’annuncio su kroati.de)' },
  },
  {
    status: 'ok',
    icon: 'check',
    text: { en: 'Washing machine in Apartment 1, for that apartment’s guests', de: 'Waschmaschine in Apartment 1, für dessen Gäste', sl: 'Pralni stroj v apartmaju 1, za goste tega apartmaja', hr: 'Perilica rublja u apartmanu 1, za goste tog apartmana', it: 'Lavatrice nell’appartamento 1, per gli ospiti di quell’appartamento' },
  },
  { status: 'ok', icon: 'parking', text: { en: 'Private parking on the gated driveway', de: 'Privatparkplatz in der Einfahrt', sl: 'Zasebno parkirišče na dvorišču z vrati', hr: 'Privatno parkiralište u dvorištu s vratima', it: 'Parcheggio privato nel vialetto con cancello' } },
  { status: 'ok', icon: 'pin', text: { en: 'Every apartment has its own entrance', de: 'Jedes Apartment hat einen eigenen Eingang', sl: 'Vsak apartma ima svoj vhod', hr: 'Svaki apartman ima vlastiti ulaz', it: 'Ogni appartamento ha un ingresso indipendente' } },
  { status: 'ok', icon: 'wifi', text: { en: 'Wi-Fi in all apartments, to upload the ride', de: 'WLAN in allen Apartments, für den Upload der Tour', sl: 'Wi-Fi v vseh apartmajih, da naložite turo', hr: 'Wi-Fi u svim apartmanima, za učitavanje vožnje', it: 'Wi-Fi in tutti gli appartamenti, per caricare il giro' } },
  { status: 'ask', icon: 'bike', text: { en: 'Lockable bike storage', de: 'Abschließbarer Radraum', sl: 'Prostor za kolesa, ki se zaklene', hr: 'Prostor za bicikle koji se zaključava', it: 'Deposito bici chiudibile a chiave' }, todo: 'lockable bike storage' },
  { status: 'ask', icon: 'wave', text: { en: 'Hose or a spot to wash bikes', de: 'Schlauch oder Platz zum Radwaschen', sl: 'Cev ali prostor za pranje koles', hr: 'Crijevo ili mjesto za pranje bicikala', it: 'Tubo o un posto per lavare le bici' }, todo: 'hose / bike wash spot' },
  { status: 'ask', icon: 'info', text: { en: 'Track pump and basic tools', de: 'Standpumpe und Werkzeug', sl: 'Stoječa tlačilka in osnovno orodje', hr: 'Stajaća pumpa i osnovni alat', it: 'Pompa a pavimento e attrezzi di base' }, todo: 'track pump and tools' },
  { status: 'ask', icon: 'car', text: { en: 'Room for a van or bike trailer', de: 'Platz für Van oder Radanhänger', sl: 'Prostor za kombi ali prikolico za kolesa', hr: 'Mjesto za kombi ili prikolicu za bicikle', it: 'Spazio per un furgone o un carrello portabici' }, todo: 'van / trailer parking' },
];

// Route-specific heads-up notes, matched by keyword against info.trafficNotes / info.winds.
const ROUTE_NOTES = {
  'nin-queens-beach-family': ['Nin old town'],
  'privlaka-vir-island-loop': ['Vir bridge'],
  'pag-bridge-pag-town': ['D106', 'Pag bridge closures'],
  'paklenica-velebit-channel': ['D8'],
  'velebit-mali-alan-epic': ['landmines'],
};

// Default route per audience (a #cycling&route=<id> link wins).
const DEFAULT_ROUTE = { cyclists: 'zadar-coast-sea-organ', families: 'nin-queens-beach-family' };

// Shops left out: low confidence and only seen on resellers / a dead website.
const HIDDEN_SHOPS = ['Enduro Bike Service', 'Zadar old-town bike rental (Špire Brusine 8)'];
// Shop descriptions we reword: the research text overstates (Nin delivery) or needs hedging (Zaton, low confidence).
const SHOP_DESC = { 'Rent a Bike Nin': L.rentNinDesc, 'Zaton Holiday Resort bike rental': L.zatonDesc };

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ROUTE_COLOR_WP = '#1f3a4d';
const HOUSE_M = 0.08; // waypoints closer than this (km) to the house are start/finish

// ---------------------------------------------------------------- helpers
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const fmt = (n, lang, digits = 0) => new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(n);
// Climbing comes from a 90 m terrain model (±15 %), so round it to 10 m.
const climbText = (m, lang) => fmt(Math.round(m / 10) * 10, lang);
// Research notes call the house "the villa"; the brand is Apartments.
const deVilla = (s) => (typeof s === 'string' ? s.replace(/\bthe villa\b/g, 'the house') : s);
const kmText = (km, lang) => `${fmt(km, lang, km < 20 ? 1 : 0)} km`;
const isStar = (ctx) => ctx.audience.id === 'cyclists';
// Phones and small tablets (single-column layout): the conditions panel and
// "On the road" start folded, and the shop list shows SHOPS_SHOWN shops.
const isNarrow = () => window.matchMedia('(max-width: 900px)').matches;
const SHOPS_SHOWN = 3;
const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

// bestMonths mixes 'Apr' tokens and phrases like 'summer evenings Jul-Aug'.
function seasonOf(route) {
  const best = new Set();
  const evenings = new Set();
  for (const s of route.bestMonths || []) {
    const i = MONTH_ABBR.indexOf(s);
    if (i >= 0) {
      best.add(i + 1);
      continue;
    }
    const range = s.match(/([A-Z][a-z]{2})-([A-Z][a-z]{2})/);
    if (range) {
      const a = MONTH_ABBR.indexOf(range[1]) + 1;
      const b = MONTH_ABBR.indexOf(range[2]) + 1;
      for (let m = a; a && b && m <= b; m++) (/evening/i.test(s) ? evenings : best).add(m);
    }
  }
  return { best, evenings };
}

// "Apr–Jun, Sep–Oct" from a set of month numbers.
function monthRanges(set, lang) {
  const ms = [...set].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < ms.length; i++) {
    let j = i;
    while (j + 1 < ms.length && ms[j + 1] === ms[j] + 1) j++;
    out.push(i === j ? monthName(ms[i], lang) : `${monthName(ms[i], lang)}–${monthName(ms[j], lang)}`);
    i = j;
  }
  return out.join(', ');
}

function seasonClass(m) {
  return Object.entries(SEASON).find(([, s]) => s.months.includes(m))?.[0] || 'prime';
}

// Geometry: cumulative distance along the (simplified) track, so a fraction of
// the route maps to a map position and to the elevation profile.
function prepare(route) {
  const c = route.coordinates;
  const cum = [0];
  for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + haversineKm(c[i - 1], c[i]));
  const prof = route.elevationProfile;
  const profKm = prof[prof.length - 1][0] || 1;
  const eleAt = (f) => {
    const km = f * profKm;
    let i = prof.findIndex((p) => p[0] >= km);
    if (i <= 0) return prof[Math.max(i, 0)][1];
    const [k0, e0] = prof[i - 1];
    const [k1, e1] = prof[i];
    return e0 + ((e1 - e0) * (km - k0)) / (k1 - k0 || 1);
  };
  const total = cum[cum.length - 1] || 1;
  const posAt = (f) => {
    const target = Math.min(Math.max(f, 0), 1) * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid;
      else hi = mid;
    }
    const t = (target - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return [c[lo][0] + (c[hi][0] - c[lo][0]) * t, c[lo][1] + (c[hi][1] - c[lo][1]) * t];
  };
  const fracOfIndex = (i) => cum[i] / total;
  // Waypoints: start/finish at the house are not numbered; repeated places (out and back) share a number.
  const numbers = new Map();
  const waypoints = route.waypoints.map((w) => {
    const atHouse = fromVilla(w.lat, w.lon) < HOUSE_M;
    const key = `${w.lat.toFixed(4)},${w.lon.toFixed(4)}`;
    if (!atHouse && !numbers.has(key)) numbers.set(key, numbers.size + 1);
    return { ...w, atHouse, n: atHouse ? null : numbers.get(key), key, f: Math.min(Math.max(w.km / route.distanceKm, 0), 1) };
  });
  const maxEle = Math.max(...prof.map((p) => p[1]));
  return { ...route, description: deVilla(route.description), cum, eleAt, posAt, fracOfIndex, waypoints, maxEle, season: seasonOf(route) };
}

// Average gradient over roughly ±1 km (the profile has 100 samples, so this is coarse).
function gradientAt(r, f) {
  const span = Math.max(1 / r.distanceKm, 0.012);
  const a = Math.max(f - span, 0);
  const b = Math.min(f + span, 1);
  const dKm = (b - a) * r.distanceKm;
  return dKm > 0 ? ((r.eleAt(b) - r.eleAt(a)) / (dKm * 1000)) * 100 : 0;
}

// ---------------------------------------------------------------- HTML parts
function diffDots(n, ctx) {
  const dots = [1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('');
  return `<span class="cyc-dots" role="img" aria-label="${esc(fill(ctx.t(L.difficulty), { n }))}">${dots}</span>`;
}

function typeBadge(type, ctx) {
  const t = TYPES[type] || TYPES.touring;
  return `<span class="badge cyc-type cyc-type-${esc(type)}">${icon(t.icon, { size: 15 })}${esc(ctx.t(t.label))}</span>`;
}

function sparkline(r, yMax) {
  const w = 140;
  const h = 34;
  const pts = r.elevationProfile;
  const last = pts[pts.length - 1][0] || 1;
  const xy = pts.map(([km, m]) => `${((km / last) * w).toFixed(1)},${(h - 2 - (m / yMax) * (h - 4)).toFixed(1)}`);
  return `<svg class="cyc-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path class="cyc-spark-area" d="M0,${h} L${xy.join(' L')} L${w},${h} Z"/>
    <path class="cyc-spark-line" d="M${xy.join(' L')}" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function seasonBadge(r, ctx) {
  const m = ctx.state.month;
  if (!m) return `<span class="cyc-card-season muted">${icon('calendar', { size: 15 })}${esc(monthRanges(r.season.best, ctx.lang))}</span>`;
  const mv = monthVars(m, ctx.lang);
  if (r.season.best.has(m)) return `<span class="badge cyc-in">${icon('check', { size: 14 })}${esc(fill(ctx.t(L.bestIn), mv))}</span>`;
  if (r.season.evenings.has(m)) return `<span class="badge cyc-eve">${icon('sun', { size: 14 })}${esc(fill(ctx.t(L.eveningsIn), mv))}</span>`;
  return `<span class="badge neutral">${esc(fill(ctx.t(L.offIn), mv))}</span>`;
}

function cardHtml(r, ctx, selected, yMax) {
  const mins = Math.round((r.routerRideTimeH * 60) / 15) * 15;
  return `<li class="cyc-card-li" data-route-li="${esc(r.id)}">
    <button type="button" class="cyc-card${selected ? ' is-selected' : ''}" data-route="${esc(r.id)}" aria-pressed="${selected}">
      <span class="cyc-card-top">${typeBadge(r.type, ctx)}${diffDots(r.difficulty, ctx)}</span>
      <span class="cyc-card-name">${esc(r.name)}</span>
      ${sparkline(r, yMax)}
      <span class="cyc-card-meta">
        <span><b>${esc(kmText(r.distanceKm, ctx.lang))}</b></span>
        <span>${esc(fill(ctx.t(L.upM), { m: climbText(r.elevationGainM, ctx.lang) }))}</span>
        <span>≈ ${esc(formatMinutes(mins))}</span>
      </span>
      <span class="cyc-card-foot" data-season-for="${esc(r.id)}">${seasonBadge(r, ctx)}</span>
    </button>
  </li>`;
}

function monthCells(r, ctx) {
  const cur = ctx.state.month;
  return `<ol class="cyc-months" aria-label="${esc(ctx.t(L.bestMonths))}">${MONTH_ABBR.map((_, i) => {
    const m = i + 1;
    const cls = r.season.best.has(m) ? 'best' : r.season.evenings.has(m) ? 'eve' : '';
    const state = cls === 'best' ? ` (${ctx.t(L.bestMonths)})` : cls === 'eve' ? ` (${ctx.t(L.evenings)})` : '';
    return `<li class="${cls}${m === cur ? ' is-current' : ''}" title="${esc(monthName(m, ctx.lang, true) + state)}"><span aria-hidden="true">${esc(monthName(m, ctx.lang).slice(0, 1))}</span><span class="visually-hidden">${esc(monthName(m, ctx.lang, true) + state)}</span></li>`;
  }).join('')}</ol>`;
}

function sourcesHtml(list, ctx) {
  if (!list?.length) return '';
  return `<details class="cyc-src">
    <summary>${icon('info', { size: 15 })}${esc(ctx.t(L.sources))} (${list.length})</summary>
    <ul>${list.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a></li>`).join('')}</ul>
  </details>`;
}

function notesFor(r, info) {
  const keys = ROUTE_NOTES[r.id] || [];
  const pool = [
    ...info.trafficNotes.map((n) => ({ text: n.text, sources: n.sources, confidence: n.confidence })),
    ...info.winds.map((w) => ({ text: `${w.name}: ${w.description}`, sources: w.sources, name: w.name, confidence: w.confidence })),
  ];
  return pool.filter((n) => keys.some((k) => n.text.includes(k) || n.name === k));
}

// Low-confidence notes are hedged.
const noteText = (n, ctx) => (n.confidence === 'low' ? fill(ctx.t(L.reported), { text: n.text }) : n.text);

function mailHref(r, ctx) {
  return `mailto:?subject=${encodeURIComponent(r.name)}&body=${encodeURIComponent(shareUrl(ctx, r.id))}`;
}

function detailHtml(r, ctx, info) {
  const t = ctx.t;
  const mins = Math.round((r.routerRideTimeH * 60) / 15) * 15;
  const notes = notesFor(r, info);
  const cautious = r.confidence !== 'high' || /router/i.test(r.surface);
  return `
    <div class="cyc-detail-head">
      <p class="cyc-detail-tags">${typeBadge(r.type, ctx)}<span class="cyc-diff">${diffDots(r.difficulty, ctx)}<span>${esc(t(DIFFICULTY[r.difficulty]))}</span></span></p>
      <h3 id="cyc-detail-title">${esc(r.name)}</h3>
    </div>
    <dl class="cyc-stats-route">
      <div><dt>${esc(t(L.distance))}</dt><dd>${esc(kmText(r.distanceKm, ctx.lang))}</dd></div>
      <div><dt>${esc(t(L.climbing))}<small>${esc(t(L.climbNote))}</small></dt><dd>${esc(fill(t(L.approxM), { m: climbText(r.elevationGainM, ctx.lang) }))}</dd></div>
      <div><dt>${esc(t(L.highPoint))}</dt><dd>${esc(fmt(r.maxElevationM, ctx.lang))} m</dd></div>
      <div><dt>${esc(t(L.rideTime))}<small>${esc(t(L.rideTimeNote))}</small></dt><dd>≈ ${esc(formatMinutes(mins))}</dd></div>
    </dl>
    <p class="cyc-desc">${esc(r.description)}</p>
    <div class="cyc-actions">
      <button type="button" class="btn btn-primary" data-gpx="${esc(r.id)}">${icon('download', { size: 18 })}${esc(t(L.gpx))}</button>
      <button type="button" class="btn" data-share="${esc(r.id)}">${icon('arrow', { size: 18 })}${esc(t(L.share))}</button>
      <a class="cyc-mail small" href="${esc(mailHref(r, ctx))}">${esc(t(L.mailIt))}</a>
    </div>
    <p class="source-note cyc-gpxnote">${esc(fill(t(L.gpxNote), { n: r.coordinates.length }))}</p>
    <div class="cyc-block">
      <h4>${esc(t(L.bestMonths))}</h4>
      ${monthCells(r, ctx)}
    </div>
    <div class="cyc-block">
      <h4>${esc(t(L.highlights))}</h4>
      <ul class="cyc-hl">${r.highlights.map((h) => `<li>${icon('pin', { size: 16 })}<span>${esc(h)}</span></li>`).join('')}</ul>
    </div>
    <div class="cyc-block">
      <h4>${esc(t(L.goodFor))}</h4>
      <p class="cyc-good">${r.suitableFor.map((s) => `<span class="badge neutral">${esc(s)}</span>`).join('')}</p>
    </div>
    <div class="cyc-block cyc-facts">
      <p>${icon('layers', { size: 18 })}<span><strong>${esc(t(L.surface))}.</strong> ${esc(r.surface)}</span></p>
      <p>${icon('wind', { size: 18 })}<span><strong>${esc(t(L.wind))}.</strong> ${esc(r.windNote)}</span></p>
    </div>
    ${notes.length
      ? `<div class="cyc-block cyc-warn" role="note"><h4>${icon('info', { size: 18 })}${esc(t(L.heads))}</h4><ul>${notes.map((n) => `<li>${esc(noteText(n, ctx))}</li>`).join('')}</ul></div>`
      : ''}
    ${r.id === 'velebit-mali-alan-epic' ? `<p class="small">${ownerTodo('Promote Mali Alan, or only the car-assisted Obrovac start?')}</p>` : ''}
    ${cautious ? `<p class="source-note">${esc(t(L.routerNote))}</p>` : ''}
    ${sourcesHtml(r.sources, ctx)}
    <button type="button" class="btn btn-accent cyc-ask" data-ask="${esc(r.id)}">${icon('chat', { size: 18 })}${esc(t(L.ask))}</button>`;
}

function calendarHtml(routes, ctx) {
  const cur = ctx.state.month;
  const counts = MONTH_ABBR.map((_, i) => [
    routes.filter((r) => r.season.best.has(i + 1)).length,
    routes.filter((r) => !r.season.best.has(i + 1) && r.season.evenings.has(i + 1)).length,
  ]);
  return `<div class="cyc-cal" role="group" aria-label="${esc(ctx.t(L.calendarGroup))}">
    ${counts
      .map(([n, e], i) => {
        const m = i + 1;
        const c = CLIMATE.months.find((x) => x.month === m);
        const routesLabel = e ? fill(ctx.t(L.routesBestEve), { n, e }) : fill(ctx.t(L.routesBest), { n });
        const label = `${monthName(m, ctx.lang, true)}: ${routesLabel}, ${ctx.t(L.avgHigh)} ${Math.round(c.airMaxC)} °C`;
        const bar = n || e ? '' : '<i class="is-empty" style="height:4%"></i>';
        return `<button type="button" class="cyc-cal-m${m === cur ? ' is-current' : ''}" data-month="${m}" aria-pressed="${m === cur}" aria-label="${esc(label)}" title="${esc(label)}">
          <span class="cyc-cal-bar">${bar}${e ? `<i class="is-eve" style="height:${(e / 8) * 100}%"></i>` : ''}${n ? `<i style="height:${(n / 8) * 100}%"></i>` : ''}</span>
          <span class="cyc-cal-n">${n}${e ? `<small>+${e}</small>` : ''}</span>
          <span class="cyc-cal-name">${esc(monthName(m, ctx.lang))}</span>
          <span class="cyc-cal-t">${Math.round(c.airMaxC)}°</span>
        </button>`;
      })
      .join('')}
  </div>`;
}

function eventHtml(info, ctx) {
  const ev = info?.events?.[0];
  if (!ev) return '';
  const m = ctx.state.month;
  if (m && m !== 10) return '';
  const d = new Date(`${ev.date}T12:00:00`);
  const date = new Intl.DateTimeFormat(ctx.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const past = d.getTime() < Date.now() - 12 * 3600e3;
  const text = fill(ctx.t(past ? L.eventPast : L.eventUpcoming), { date, year: d.getFullYear() });
  return `<div class="cyc-event">
    <p class="cyc-event-k">${icon('star', { size: 16 })}${esc(ctx.t(L.eventTitle))}</p>
    <h4>${esc(ev.name)}</h4>
    <p>${esc(text)} ${esc(ctx.t(L.eventDistances))}</p>
    ${past ? '' : `<p class="cyc-event-warn">${icon('info', { size: 16 })}<span>${esc(ctx.t(L.eventClosures))}</span></p>`}
    ${sourcesHtml(ev.sources, ctx)}
  </div>`;
}

function conditionsHtml(ctx, info, routes) {
  const t = ctx.t;
  const m = ctx.state.month;
  if (!m) {
    return `<h3>${esc(t(L.anyMonthTitle))}</h3>
      <p>${esc(t(L.anyMonthText))}</p>
      <p class="muted small">${esc(t(L.pickMonth))}</p>
      ${eventHtml(info, ctx)}`;
  }
  const c = CLIMATE.months.find((x) => x.month === m);
  const w = info?.seasonAndWeather?.monthly?.[m - 1];
  const s = SEASON[seasonClass(m)];
  const n = routes ? routes.filter((r) => r.season.best.has(m)).length : null;
  const eve = routes ? routes.filter((r) => !r.season.best.has(m) && r.season.evenings.has(m)).length : 0;
  return `<p class="cyc-cond-k">${esc(fill(t(L.ridingIn), monthVars(m, ctx.lang)))}</p>
    <h3 class="cyc-verdict cyc-verdict-${seasonClass(m)}">${esc(t(s.head))}</h3>
    <p>${esc(fill(t(s.tip), { t: Math.round(c.airMaxC) }))}${n != null ? ` <strong>${esc(fill(t(L.routesBest), { n }))}${eve ? `, ${esc(fill(t(L.plusEvenings), { n: eve }))}` : ''}.</strong>` : ''}</p>
    <dl class="cyc-cond">
      <div><dt>${icon('thermometer', { size: 16 })}${esc(t(L.high))} / ${esc(t(L.low))}</dt><dd>${Math.round(c.airMaxC)}° / ${Math.round(c.airMinC)} °C</dd></div>
      <div><dt>${icon('calendar', { size: 16 })}${esc(t(L.rainDays))}</dt><dd>≈ ${fmt(c.rainDays, ctx.lang)}</dd></div>
      ${w ? `<div><dt>${icon('wind', { size: 16 })}${esc(t(L.neDays))}</dt><dd>≈ ${fmt(w.daysNEwindOver20kmh, ctx.lang)}</dd></div>` : ''}
      <div><dt>${icon('wave', { size: 16 })}${esc(t(L.sea))}</dt><dd>${Math.round(c.seaC)} °C</dd></div>
    </dl>
    <p class="small cyc-windnote"><strong>${esc(t(L.wind))}:</strong> ${esc(c.windNote)}</p>
    ${eventHtml(info, ctx)}
    <p class="source-note">${esc(t(L.climateSource))}</p>`;
}

// Folded conditions panel (phones): "Riding in May: Prime riding season".
function condSummary(ctx) {
  const m = ctx.state.month;
  if (!m) return ctx.t(L.anyMonthTitle);
  return `${fill(ctx.t(L.ridingIn), monthVars(m, ctx.lang))}: ${ctx.t(SEASON[seasonClass(m)].head)}`;
}

function ridersHtml(ctx) {
  const t = ctx.t;
  return `<div class="cyc-panel cyc-riders">
    <h3>${icon('bike', { size: 22 })}${esc(t(L.ridersTitle))}</h3>
    <p class="muted">${esc(t(L.ridersLede))}</p>
    <ul class="cyc-kit">
      ${RIDER_KIT.map(
        (k) => `<li class="is-${k.status}">${icon(k.status === 'ok' ? 'check' : k.icon, { size: 18 })}<span>${esc(t(k.text))}${
          k.status === 'ask' ? ` <span class="badge accent">${esc(t(L.askUs))}</span>${ownerTodo(k.todo)}` : ''
        }</span></li>`,
      ).join('')}
    </ul>
  </div>`;
}

function shopsHtml(info, ctx, narrow) {
  const t = ctx.t;
  const shops = info.bikeShopsAndRentals
    .filter((s) => !HIDDEN_SHOPS.includes(s.name))
    .map((s) => ({ ...s, km: s.lat != null ? fromVilla(s.lat, s.lon) : null }))
    .sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
  return `<div class="cyc-panel cyc-shops">
    <h3>${icon('pin', { size: 22 })}${esc(t(L.shopsTitle))}</h3>
    <p class="muted small">${esc(t(L.shopsLede))}</p>
    <ul class="cyc-shoplist">
      ${shops
        .map((s, i) => {
          const desc = t(SHOP_DESC[s.name] || {}) || s.description;
          return `<li${narrow && i >= SHOPS_SHOWN ? ' hidden' : ''}>
            <p class="cyc-shop-head"><strong>${esc(s.name)}</strong><span class="badge neutral">${esc(s.kind)}</span>${s.km != null ? `<span class="muted small">${esc(t('about'))} ${esc(formatKm(s.km))}</span>` : ''}</p>
            <p class="cyc-shop-desc">${esc(desc)}</p>
            <p class="cyc-shop-links small">
              <span>${esc(s.address)}</span>
              ${s.openingHours ? `<span>${esc(fill(t(L.hoursOsm), { h: s.openingHours.replace(/\s*\(OSM\)\s*$/, '') }))}</span>` : ''}
              ${s.phone ? `<a href="tel:${esc(s.phone.replace(/\s+/g, ''))}">${esc(s.phone)}</a>` : ''}
              ${s.website ? `<a href="${esc(s.website)}" target="_blank" rel="noopener">${esc(t(L.website))}</a>` : ''}
            </p>
          </li>`;
        })
        .join('')}
    </ul>
    ${narrow && shops.length > SHOPS_SHOWN ? `<button type="button" class="btn btn-small cyc-shops-all" data-shops-all>${esc(fill(t(L.shopsAll), { n: shops.length }))}</button>` : ''}
    <p class="small muted cyc-standnote">${icon('info', { size: 16 })}<span>${esc(t(L.repairStands))}</span></p>
  </div>`;
}

function roadHtml(info, ctx, open) {
  const t = ctx.t;
  return `<details class="cyc-panel cyc-road"${open ? ' open' : ''}>
    <summary><h3>${icon('info', { size: 22 })}${esc(t(L.roadTitle))}</h3></summary>
    <h4>${esc(t(L.rules))}</h4>
    <ul class="cyc-rules">${info.roadRules.map((r) => `<li>${esc(r.rule)}</li>`).join('')}</ul>
    <h4>${esc(t(L.traffic))}</h4>
    <ul class="cyc-rules">${info.trafficNotes.map((n) => `<li${n.confidence === 'low' ? ' class="muted"' : ''}>${esc(noteText(n, ctx))}</li>`).join('')}</ul>
    ${sourcesHtml([...new Set([...info.roadRules, ...info.trafficNotes].flatMap((x) => x.sources))], ctx)}
  </details>`;
}

function officialHtml(info, ctx) {
  const t = ctx.t;
  const o = info.officialRoutesNearby;
  if (!o?.routes?.length) return '';
  return `<details class="cyc-panel cyc-official">
    <summary><h3>${icon('layers', { size: 22 })}${esc(fill(t(L.officialTitle), { n: o.routes.length }))}</h3></summary>
    <p class="small">${esc(t(L.officialText))} <a href="https://zadarbikemagic.com/" target="_blank" rel="noopener">zadarbikemagic.com</a></p>
    <div class="cyc-table-wrap" tabindex="0" role="region" aria-label="${esc(fill(t(L.officialTitle), { n: o.routes.length }))}">
      <table class="cyc-table">
        <thead><tr><th scope="col">${esc(t(L.colCode))}</th><th scope="col">${esc(t(L.colStart))}</th><th scope="col">${esc(t(L.colVia))}</th><th scope="col" class="num">${esc(t(L.colKm))}</th><th scope="col" class="num">${esc(t(L.colUp))}</th><th scope="col">${esc(t(L.colLevel))}</th></tr></thead>
        <tbody>${o.routes
          .map((r) => `<tr><th scope="row">${esc(r.code)}${r.note ? ` <small class="muted">(${esc(t(L.notMarked))})</small>` : ''}</th><td>${esc(r.startFinish)}</td><td>${esc(r.via || '–')}</td><td class="num">${esc(fmt(r.km, ctx.lang, 1))}</td><td class="num">${r.elevationM != null ? `${esc(fmt(r.elevationM, ctx.lang))} m` : '–'}</td><td>${esc(r.physical || '–')}</td></tr>`)
          .join('')}</tbody>
      </table>
    </div>
    ${sourcesHtml(o.sources, ctx)}
  </details>`;
}

// ---------------------------------------------------------------- elevation profile
// Inline SVG area chart at the host's pixel width. Returns { setCursor(f|null), destroy }.
function createProfile(hostEl, r, ctx, { onScrub }) {
  const t = ctx.t;
  const tip = hostEl.querySelector('.cyc-tip');
  const svgBox = hostEl.querySelector('.cyc-prof-svg');
  let geom = null;
  let cursorF = null;

  const draw = () => {
    const w = Math.max(svgBox.clientWidth, 280);
    const h = isStar(ctx) && w > 600 ? 240 : 200;
    const pad = { l: 46, r: 14, t: 24, b: 30 };
    const iw = w - pad.l - pad.r;
    const ih = h - pad.t - pad.b;
    const yNeed = Math.max(Math.max(r.maxEle, r.maxElevationM) * 1.2, 60); // a floor so flat routes still look flat
    const yStep = niceStep(yNeed / 4);
    const yTop = Math.ceil(yNeed / yStep) * yStep;
    const x = (f) => pad.l + f * iw;
    const y = (m) => pad.t + ih - (m / yTop) * ih;
    const prof = r.elevationProfile;
    const last = prof[prof.length - 1][0] || 1;
    const line = prof.map(([km, m]) => `${x(km / last).toFixed(1)},${y(m).toFixed(1)}`).join(' L');
    const xStep = niceStep(r.distanceKm / Math.max(Math.floor(iw / 70), 2));
    const xTicks = [];
    for (let k = 0; k <= r.distanceKm + 1e-6; k += xStep) xTicks.push(k);
    const yTicks = [];
    for (let m = 0; m <= yTop + 1e-6; m += yStep) yTicks.push(m);
    // High point: the stated maximum, placed at the highest (smoothed) profile sample.
    const hi = prof.reduce((a, p) => (p[1] > a[1] ? p : a), prof[0]);
    const hiX = x(hi[0] / last);
    const hiAnchor = hiX > w - 80 ? 'end' : hiX < pad.l + 40 ? 'start' : 'middle';
    // Waypoints (numbered; skip a label that would collide with the previous one).
    let lastLabelX = -99;
    const wps = r.waypoints
      .filter((wp) => !wp.atHouse)
      .map((wp) => {
        const px = x(wp.f);
        const py = y(r.eleAt(wp.f));
        const showLabel = px - lastLabelX >= 18 && Math.abs(px - hiX) > 34;
        if (showLabel) lastLabelX = px;
        return `<g class="cyc-wp" data-wpf="${wp.f}">
          <line x1="${px}" x2="${px}" y1="${py}" y2="${pad.t + ih}" />
          <circle cx="${px}" cy="${py}" r="5" />
          ${showLabel ? `<text x="${px}" y="${Math.max(py - 10, 11)}" text-anchor="middle">${wp.n}</text>` : ''}
        </g>`;
      })
      .join('');
    svgBox.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">
      <g class="cyc-grid">${yTicks.map((m) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(m)}" y2="${y(m)}"/>`).join('')}</g>
      <g class="cyc-axis">
        ${yTicks.map((m) => `<text x="${pad.l - 8}" y="${y(m) + 4}" text-anchor="end">${fmt(m, ctx.lang)}${m === yTop ? ' m' : ''}</text>`).join('')}
        ${xTicks.map((k, i) => `<text x="${x(k / r.distanceKm)}" y="${h - 8}" text-anchor="${i === 0 ? 'start' : 'middle'}">${fmt(k, ctx.lang, 1)}${i === xTicks.length - 1 ? ' km' : ''}</text>`).join('')}
      </g>
      <path class="cyc-parea" d="M${x(0)},${y(0)} L${line} L${x(1)},${y(0)} Z"/>
      <path class="cyc-pline" d="M${line}"/>
      <text class="cyc-hi" x="${hiX}" y="${Math.max(y(hi[1]) - 8, 12)}" text-anchor="${hiAnchor}">▲ ${fmt(r.maxElevationM, ctx.lang)} m</text>
      ${wps}
      <g class="cyc-cursor" display="none">
        <line class="cyc-cursor-line" y1="${pad.t}" y2="${pad.t + ih}"/>
        <circle class="cyc-cursor-dot" r="6"/>
      </g>
      <rect class="cyc-hit" x="${pad.l}" y="0" width="${iw}" height="${h}" />
    </svg>`;
    geom = { w, h, pad, iw, x, y };
    if (cursorF != null) place(cursorF);
  };

  const place = (f) => {
    const g = svgBox.querySelector('.cyc-cursor');
    if (!g || !geom) return;
    if (f == null) {
      g.setAttribute('display', 'none');
      tip.hidden = true;
      return;
    }
    const px = geom.x(f);
    const ele = r.eleAt(f);
    g.removeAttribute('display');
    g.querySelector('line').setAttribute('x1', px);
    g.querySelector('line').setAttribute('x2', px);
    const dot = g.querySelector('circle');
    dot.setAttribute('cx', px);
    dot.setAttribute('cy', geom.y(ele));
    // Tooltip: values lead, the nearest waypoint follows. textContent only.
    const km = f * r.distanceKm;
    const near = r.waypoints.find((wp) => Math.abs(wp.f - f) * r.distanceKm < Math.max(r.distanceKm * 0.015, 0.25));
    const grad = gradientAt(r, f);
    tip.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = fill(t(L.tipReadout), { ele: fmt(Math.round(ele), ctx.lang), km: fmt(km, ctx.lang, 1) });
    const g2 = document.createElement('span');
    g2.textContent = fill(t(L.gradient), { g: fmt(grad, ctx.lang, 1) });
    tip.append(strong, g2);
    if (near) {
      const n = document.createElement('span');
      n.className = 'cyc-tip-wp';
      n.textContent = near.atHouse ? ctx.brand : `${near.n} · ${near.name}`;
      tip.append(n);
    }
    tip.hidden = false;
    const tw = tip.offsetWidth;
    tip.style.left = `${Math.min(Math.max(px - tw / 2, 0), geom.w - tw)}px`;
    hostEl.setAttribute('aria-valuenow', km.toFixed(1));
    const readout = fill(t(L.sliderText), { km: fmt(km, ctx.lang, 1), ele: fmt(Math.round(ele), ctx.lang) });
    hostEl.setAttribute('aria-valuetext', near && !near.atHouse ? `${readout}, ${near.name}` : readout);
  };

  const setCursor = (f) => {
    cursorF = f;
    place(f);
  };

  const fracFromEvent = (e) => {
    const rect = svgBox.getBoundingClientRect();
    return Math.min(Math.max((e.clientX - rect.left - geom.pad.l) / geom.iw, 0), 1);
  };
  const onMove = (e) => {
    if (!geom) return;
    const f = fracFromEvent(e);
    setCursor(f);
    onScrub(f);
  };
  const onLeave = (e) => {
    if (e.pointerType === 'touch') return; // keep the readout after a tap
    setCursor(null);
    onScrub(null);
  };
  const onKey = (e) => {
    const step = e.shiftKey || e.key === 'PageUp' || e.key === 'PageDown' ? 0.1 : 0.01;
    const cur = cursorF ?? 0;
    const next = {
      ArrowRight: cur + step,
      ArrowUp: cur + step,
      PageUp: cur + step,
      ArrowLeft: cur - step,
      ArrowDown: cur - step,
      PageDown: cur - step,
      Home: 0,
      End: 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const f = Math.min(Math.max(next, 0), 1);
    setCursor(f);
    onScrub(f);
  };
  const onBlur = () => {
    setCursor(null);
    onScrub(null);
  };
  svgBox.addEventListener('pointermove', onMove);
  svgBox.addEventListener('pointerdown', onMove);
  svgBox.addEventListener('pointerleave', onLeave);
  hostEl.addEventListener('keydown', onKey);
  hostEl.addEventListener('blur', onBlur);
  hostEl.setAttribute('aria-valuemax', String(r.distanceKm));
  draw();
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  });
  ro.observe(svgBox);
  return {
    setCursor,
    destroy() {
      ro.disconnect();
      cancelAnimationFrame(raf);
      svgBox.removeEventListener('pointermove', onMove);
      svgBox.removeEventListener('pointerdown', onMove);
      svgBox.removeEventListener('pointerleave', onLeave);
      hostEl.removeEventListener('keydown', onKey);
      hostEl.removeEventListener('blur', onBlur);
    },
  };
}

function waypointListHtml(r, ctx) {
  const t = ctx.t;
  return r.waypoints
    .map((wp, i) => {
      const label = wp.atHouse ? t(i === 0 ? L.start : L.finish) : wp.name;
      const num = wp.atHouse ? icon('bed', { size: 14 }) : wp.n;
      return `<li><button type="button" class="cyc-wpbtn${wp.atHouse ? ' is-house' : ''}" data-wp="${i}">
        <span class="cyc-wpnum" aria-hidden="true">${num}</span>
        <span class="cyc-wpname">${esc(label)}</span>
        <span class="cyc-wpkm">${esc(fill(t(L.wpReadout), { km: fmt(wp.km, ctx.lang, 1), ele: fmt(Math.round(r.eleAt(wp.f)), ctx.lang) }))}</span>
      </button></li>`;
    })
    .join('');
}

// ---------------------------------------------------------------- GPX + share
function xml(s) {
  return esc(s);
}

function buildGpx(r, url, ctx) {
  const brand = ctx.brand;
  const n = r.coordinates.length;
  const pts = r.coordinates
    .map(([lat, lon], i) => `      <trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${r.eleAt(r.fracOfIndex(i)).toFixed(1)}</ele></trkpt>`)
    .join('\n');
  const seen = new Set();
  const wpts = r.waypoints
    .filter((w) => !w.atHouse && !seen.has(w.key) && seen.add(w.key))
    .map((w) => `  <wpt lat="${w.lat}" lon="${w.lon}"><ele>${r.eleAt(w.f).toFixed(1)}</ele><name>${xml(w.name)}</name></wpt>`)
    .join('\n');
  const desc = fill(ctx.t(L.gpxDesc), { km: fmt(r.distanceKm, ctx.lang, 1), up: climbText(r.elevationGainM, ctx.lang), brand, n });
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${xml(brand)}" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${xml(r.name)}</name>
    <desc>${xml(desc)}</desc>
    <author><name>${xml(brand)}</name></author>
    <link href="${xml(url)}"><text>${xml(r.name)}</text></link>
    <time>${new Date().toISOString()}</time>
  </metadata>
${wpts}
  <trk>
    <name>${xml(r.name)}</name>
    <desc>${xml(desc)}</desc>
    <link href="${xml(url)}"><text>${xml(brand)}</text></link>
    <type>cycling</type>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>
`;
}

function shareUrl(ctx, id) {
  const u = new URL(ctx.linkFor({}));
  u.searchParams.set('audience', ctx.audience.id);
  u.hash = `cycling&route=${id}`;
  return u.toString();
}

function routeFromUrl() {
  const m = location.hash.slice(1).match(/(?:^|&)route=([\w-]+)/);
  return m?.[1] || new URLSearchParams(location.search).get('route');
}

// ---------------------------------------------------------------- section
const controllers = new WeakMap();

export default {
  id: 'cycling',
  nav: { en: 'Cycling', de: 'Radfahren', sl: 'Kolesarjenje', hr: 'Biciklizam', it: 'In bici' },

  render(ctx) {
    const t = ctx.t;
    const star = isStar(ctx);
    const skeletonCards = Array.from({ length: 4 }, () => '<li class="cyc-card-li"><span class="cyc-card cyc-skel"></span></li>').join('');
    return `
    <div class="container cyc${star ? ' cyc-star' : ''}">
      <header class="section-head">
        <span class="eyebrow">${icon('bike', { size: 16 })}${esc(t(L.eyebrow))}</span>
        <h2>${esc(t(star ? L.titleStar : L.title))}</h2>
        <p class="lede">${esc(t(L.lede))}</p>
      </header>
      <dl class="cyc-headstats" data-headstats aria-busy="true"></dl>

      <div class="cyc-season" id="cyc-season">
        <div class="cyc-cal-wrap">
          <h3 class="cyc-mini-h">${icon('calendar', { size: 18 })}${esc(t(L.calendarTitle))}</h3>
          <div data-calendar><p class="muted">${esc(t(L.loading))}</p></div>
          <p class="small muted">${esc(t(L.calendarHint))}</p>
        </div>
        ${
          isNarrow()
            ? `<details class="cyc-conditions cyc-cond-fold"><summary data-cond-sum>${esc(condSummary(ctx))}</summary><div data-conditions aria-live="polite">${conditionsHtml(ctx, null, null)}</div></details>`
            : `<div class="cyc-conditions" data-conditions aria-live="polite">${conditionsHtml(ctx, null, null)}</div>`
        }
      </div>

      <div class="toolbar cyc-toolbar" data-toolbar>
        <div class="chips" role="group" aria-label="${esc(t(L.filterType))}">
          <button type="button" class="chip" data-type="all" aria-pressed="true">${esc(t(L.all))}</button>
          ${Object.entries(TYPES).map(([id, ty]) => `<button type="button" class="chip" data-type="${id}" aria-pressed="false">${icon(ty.icon, { size: 16 })}${esc(t(ty.label))}</button>`).join('')}
        </div>
        <div class="chips" role="group" aria-label="${esc(t(L.filterDist))}">
          <button type="button" class="chip" data-dist="all" aria-pressed="true">${esc(t(L.anyLength))}</button>
          ${DISTANCES.map((d) => `<button type="button" class="chip" data-dist="${d.id}" aria-pressed="false">${esc(t(d.label))}</button>`).join('')}
        </div>
        <p class="cyc-count small muted" data-count aria-live="polite"></p>
      </div>

      <ul class="cyc-cards" data-cards aria-label="${esc(t(L.routesList))}">${skeletonCards}</ul>
      <div class="cyc-empty" data-empty hidden><p>${esc(t(L.noMatch))}</p><button type="button" class="btn" data-reset>${esc(t(L.reset))}</button></div>

      <div class="cyc-main">
        <div class="cyc-mapcol">
          <div class="map-frame cyc-map" data-map role="region" aria-label="${esc(t(L.mapLabel))}"><p class="cyc-maploading">${esc(t(L.loadingMap))}</p></div>
          <div class="cyc-legend">
            <span><i class="k-sel"></i>${esc(t(L.legendSel))}</span>
            <span><i class="k-other"></i>${esc(t(L.legendOther))}</span>
            <span><i class="k-house"></i>${esc(t(L.legendHouse))}</span>
            <span><i class="k-wp">1</i>${esc(t(L.legendWp))}</span>
            <button type="button" class="chip cyc-shops-toggle" data-shops aria-pressed="false">${icon('pin', { size: 16 })}${esc(t(L.shopsToggle))}</button>
          </div>
          <div class="cyc-profile">
            <div class="cyc-prof-head">
              <h3 class="cyc-mini-h">${icon('mountain', { size: 18 })}${esc(t(L.profile))}</h3>
              <p class="small muted">${esc(t(L.profileHint))}</p>
            </div>
            <div class="cyc-prof" data-profile tabindex="0" role="slider" aria-label="${esc(t(L.profileSlider))}" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">
              <div class="cyc-prof-svg"></div>
              <div class="cyc-tip" hidden></div>
            </div>
            <h4 class="visually-hidden">${esc(t(L.waypoints))}</h4>
            <ol class="cyc-wplist" data-wplist></ol>
          </div>
        </div>
        <article class="cyc-detail card" data-detail aria-labelledby="cyc-detail-title"><div class="card-body cyc-detail-skel"><p class="muted">${esc(t(L.loading))}</p></div></article>
      </div>

      <div class="cyc-extra" data-extra></div>
      <p class="error-box" data-mount-error hidden>${esc(t(L.mountError))}</p>
    </div>`;
  },

  async mount(el, ctx) {
    let liveCtx = ctx;
    const t = (x) => liveCtx.t(x);
    const { default: data } = await import('../data/cycling.json');
    const info = data.info;
    for (const n of info.trafficNotes || []) n.text = deVilla(n.text);
    const routes = data.routes.map(prepare).sort((a, b) => a.distanceKm - b.distanceKm);
    const byId = new Map(routes.map((r) => [r.id, r]));
    const yMaxSpark = Math.max(...routes.map((r) => r.maxEle));
    const filters = { type: 'all', dist: 'all' };
    const pick = (id) => (byId.has(id) ? id : null);
    // A shared link wins; otherwise the audience default, unless a travel month is set
    // and that route is not in season then (fall back to the first route that is).
    const inSeason = (r, m) => r.season.best.has(m) || r.season.evenings.has(m);
    const seasonalPick = (id) => {
      const m = ctx.state.month;
      if (!m || (id && inSeason(byId.get(id), m))) return id;
      return (routes.find((r) => r.season.best.has(m)) || routes.find((r) => inSeason(r, m)))?.id || id;
    };
    let selected = pick(routeFromUrl()) || seasonalPick(pick(DEFAULT_ROUTE[ctx.audience.id]) || routes[0].id);

    const $ = (s) => el.querySelector(s);
    const cardsEl = $('[data-cards]');
    const detailEl = $('[data-detail]');
    const profEl = $('[data-profile]');
    const wpListEl = $('[data-wplist]');

    // Header stats.
    const head = $('[data-headstats]');
    const longest = routes[routes.length - 1];
    const climb = Math.max(...routes.map((r) => r.elevationGainM));
    head.innerHTML = [
      [routes.length, L.statRoutes],
      [`${fmt(routes[0].distanceKm, ctx.lang, 1)}–${fmt(longest.distanceKm, ctx.lang)} km`, L.statRange],
      [fill(t(L.approxM), { m: climbText(climb, ctx.lang) }), L.statClimb],
      [info.officialRoutesNearby?.routes?.length || 0, L.statOfficial],
    ]
      .map(([v, label]) => `<div class="stat"><dt>${esc(t(label))}</dt><dd><b>${esc(v)}</b></dd></div>`)
      .join('');
    head.removeAttribute('aria-busy');

    const renderSeason = () => {
      // Rebuilding the calendar drops the focused month button: restore focus to its replacement.
      const focusedMonth = el.querySelector('[data-calendar]').contains(document.activeElement) ? document.activeElement.dataset.month : null;
      $('[data-calendar]').innerHTML = calendarHtml(routes, liveCtx);
      if (focusedMonth) el.querySelector(`[data-calendar] [data-month="${focusedMonth}"]`)?.focus();
      $('[data-conditions]').innerHTML = conditionsHtml(liveCtx, info, routes);
      const sum = $('[data-cond-sum]');
      if (sum) sum.textContent = condSummary(liveCtx);
    };
    renderSeason();

    const visible = () =>
      routes.filter((r) => {
        if (filters.type !== 'all' && r.type !== filters.type) return false;
        const d = DISTANCES.find((x) => x.id === filters.dist);
        return !d || (r.distanceKm >= d.min && r.distanceKm < d.max);
      });

    const renderCards = () => {
      const list = visible();
      cardsEl.innerHTML = list.map((r) => cardHtml(r, liveCtx, r.id === selected, yMaxSpark)).join('');
      $('[data-empty]').hidden = list.length > 0;
      $('[data-count]').textContent = fill(t(L.showing), { n: list.length, total: routes.length });
      return list;
    };

    // ---- map
    let mapApi = null;
    let Lf = null;
    let pinIconFn = null;
    const lines = new Map();
    let selLayer = null;
    let wpLayer = null;
    let cursorMarker = null;
    let shopsLayer = null;
    let profile = null;
    const mapEl = $('[data-map]');

    const reduced = prefersReducedMotion();

    const drawSelected = (r, { fit = true } = {}) => {
      if (!mapApi) return;
      const map = mapApi.map;
      selLayer?.remove();
      wpLayer?.remove();
      for (const [id, line] of lines) {
        const shown = id !== r.id && visible().some((v) => v.id === id);
        if (shown && !map.hasLayer(line)) line.addTo(map);
        if (!shown && map.hasLayer(line)) line.remove();
      }
      const casing = Lf.polyline(r.coordinates, { className: 'cyc-casing', weight: 9, interactive: false });
      const sel = Lf.polyline(r.coordinates, { className: 'cyc-sel', weight: 5, bubblingMouseEvents: false });
      sel.on('mousemove', (e) => {
        let best = 0;
        let bd = Infinity;
        r.coordinates.forEach(([la, lo], i) => {
          const d = (la - e.latlng.lat) ** 2 + (lo - e.latlng.lng) ** 2;
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        const f = r.fracOfIndex(best);
        profile?.setCursor(f);
        moveCursor(f);
      });
      sel.on('mouseout', () => {
        profile?.setCursor(null);
        moveCursor(null);
      });
      selLayer = Lf.layerGroup([casing, sel]).addTo(map);
      const seen = new Set();
      wpLayer = Lf.layerGroup(
        r.waypoints
          .filter((w) => !w.atHouse && !seen.has(w.key) && seen.add(w.key))
          .map((w) => {
            const kms = r.waypoints.filter((x) => x.key === w.key).map((x) => fmt(x.km, liveCtx.lang, 1)).join(' · ');
            return Lf.marker([w.lat, w.lon], { icon: pinIconFn({ color: ROUTE_COLOR_WP, label: String(w.n), size: 26 }), title: w.name, keyboard: false })
              .bindTooltip(`<strong>${esc(w.n)} · ${esc(w.name)}</strong><br>${esc(fill(t(L.kmAt), { km: kms }))}`, { direction: 'top', offset: [0, -12] });
          }),
      ).addTo(map);
      if (fit) {
        const bounds = Lf.latLngBounds(r.coordinates);
        const opts = { padding: [36, 36], maxZoom: 14 };
        if (reduced) map.fitBounds(bounds, opts);
        else map.flyToBounds(bounds, { ...opts, duration: 0.8 });
      }
    };

    const moveCursor = (f) => {
      if (!mapApi) return;
      const r = byId.get(selected);
      if (f == null) {
        cursorMarker?.remove();
        cursorMarker = null;
        return;
      }
      const pos = r.posAt(f);
      if (!cursorMarker) cursorMarker = Lf.circleMarker(pos, { radius: 8, weight: 3, className: 'cyc-cursor-m', interactive: false }).addTo(mapApi.map);
      else cursorMarker.setLatLng(pos);
    };

    const select = (id, { fit = true } = {}) => {
      const r = byId.get(id);
      if (!r) return;
      selected = id;
      for (const b of cardsEl.querySelectorAll('[data-route]')) {
        const on = b.dataset.route === id;
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle('is-selected', on);
      }
      detailEl.innerHTML = `<div class="card-body">${detailHtml(r, liveCtx, info)}</div>`;
      wpListEl.innerHTML = waypointListHtml(r, liveCtx);
      profile?.destroy();
      profile = createProfile(profEl, r, liveCtx, { onScrub: moveCursor });
      cursorMarker?.remove();
      cursorMarker = null;
      drawSelected(r, { fit });
    };

    const applyFilters = () => {
      for (const b of el.querySelectorAll('[data-type]')) b.setAttribute('aria-pressed', String(b.dataset.type === filters.type));
      for (const b of el.querySelectorAll('[data-dist]')) b.setAttribute('aria-pressed', String(b.dataset.dist === filters.dist));
      const list = renderCards();
      if (list.length && !list.some((r) => r.id === selected)) select(list[0].id);
      else if (byId.get(selected)) drawSelected(byId.get(selected), { fit: false });
    };

    renderCards();
    select(selected, { fit: false });
    // Phone rail: show the preselected card without scrolling the page.
    const selCard = cardsEl.querySelector('[aria-pressed="true"]')?.parentElement;
    if (selCard && cardsEl.scrollWidth > cardsEl.clientWidth) cardsEl.scrollLeft = selCard.offsetLeft - cardsEl.offsetLeft - 16;
    const narrow = isNarrow();
    $('[data-extra]').innerHTML = `<div class="cyc-extra-col">${ridersHtml(liveCtx)}${roadHtml(info, liveCtx, isStar(liveCtx) && !narrow)}</div><div class="cyc-extra-col">${shopsHtml(info, liveCtx, narrow)}</div>${officialHtml(info, liveCtx)}`;

    // Map last: Leaflet is a separate chunk and tiles may be slow.
    try {
      const base = await import('../maps/base.js');
      Lf = base.L;
      pinIconFn = base.pinIcon;
      mapEl.querySelector('.cyc-maploading')?.remove();
      mapApi = base.createMap(mapEl, { basemap: ctx.state.basemap, brandName: ctx.brand, zoom: 11 });
      for (const r of routes) {
        const line = Lf.polyline(r.coordinates, { className: 'cyc-line', weight: 4 })
          .bindTooltip(esc(r.name), { sticky: true })
          .on('click', () => {
            select(r.id);
            cardsEl.querySelector(`[data-route="${r.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
          });
        lines.set(r.id, line);
      }
      drawSelected(byId.get(selected), { fit: false });
      mapApi.map.fitBounds(Lf.latLngBounds(byId.get(selected).coordinates), { padding: [36, 36], maxZoom: 14 });
    } catch (err) {
      console.error('[cycling] map failed', err);
      mapEl.innerHTML = `<p class="error-box cyc-maperr">${esc(liveCtx.t('mapLoadError'))}</p>`;
    }

    const toggleShops = (btn) => {
      if (!mapApi) return;
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      if (!on) {
        shopsLayer?.remove();
        return;
      }
      if (!shopsLayer) {
        const shops = info.bikeShopsAndRentals.filter((s) => s.lat != null && !HIDDEN_SHOPS.includes(s.name));
        const stands = (info.publicRepairStations || []).filter((s) => s.confidence !== 'low');
        shopsLayer = Lf.layerGroup([
          ...shops.map((s) =>
            Lf.marker([s.lat, s.lon], { icon: pinIconFn({ color: '#4b5563', label: 'B', size: 24 }), title: s.name }).bindTooltip(`<strong>${esc(s.name)}</strong><br>${esc(s.kind)}`, { direction: 'top', offset: [0, -10] }),
          ),
          ...stands.map((s) =>
            Lf.marker([s.lat, s.lon], { icon: pinIconFn({ color: '#4b5563', label: 'R', size: 22 }), title: s.name }).bindTooltip(`<strong>${esc(s.name)}</strong><br>${esc(s.description)}`, { direction: 'top', offset: [0, -10] }),
          ),
        ]);
      }
      shopsLayer.addTo(mapApi.map);
    };

    const download = (r) => {
      const blob = new Blob([buildGpx(r, shareUrl(liveCtx, r.id), liveCtx)], { type: 'application/gpx+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${r.id}.gpx`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(fill(t(L.gpxSaved), { file: a.download }));
    };

    const share = async (r) => {
      const url = shareUrl(liveCtx, r.id);
      if (navigator.share) {
        try {
          await navigator.share({ title: r.name, text: `${r.name} · ${kmText(r.distanceKm, liveCtx.lang)}`, url });
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        toast(t(L.copied));
      } catch {
        toast(url, 8000);
      }
    };

    const onClick = (e) => {
      const card = e.target.closest('[data-route]');
      if (card) return select(card.dataset.route);
      const ty = e.target.closest('[data-type]');
      if (ty) {
        filters.type = ty.dataset.type;
        return applyFilters();
      }
      const di = e.target.closest('[data-dist]');
      if (di) {
        filters.dist = di.dataset.dist;
        return applyFilters();
      }
      if (e.target.closest('[data-reset]')) {
        filters.type = 'all';
        filters.dist = 'all';
        applyFilters();
        el.querySelector('[data-type="all"]')?.focus();
        return;
      }
      const mo = e.target.closest('[data-month]');
      if (mo) {
        const m = Number(mo.dataset.month);
        return liveCtx.setState({ month: liveCtx.state.month === m ? 0 : m });
      }
      const g = e.target.closest('[data-gpx]');
      if (g) return download(byId.get(g.dataset.gpx));
      const s = e.target.closest('[data-share]');
      if (s) return share(byId.get(s.dataset.share));
      const ask = e.target.closest('[data-ask]');
      if (ask) {
        const r = byId.get(ask.dataset.ask);
        return liveCtx.bus.emit('inquiry:prefill', { purpose: 'cycling', month: liveCtx.state.month || undefined, message: fill(t(L.askMessage), { route: r.name }) });
      }
      const wp = e.target.closest('[data-wp]');
      if (wp) {
        const r = byId.get(selected);
        const w = r.waypoints[Number(wp.dataset.wp)];
        profile?.setCursor(w.f);
        moveCursor(w.f);
        if (mapApi) mapApi.map.panTo([w.lat, w.lon], { animate: !reduced });
        return;
      }
      const all = e.target.closest('[data-shops-all]');
      if (all) {
        const rest = [...all.previousElementSibling.querySelectorAll('li[hidden]')];
        for (const li of rest) li.hidden = false;
        // The button goes away: move focus to the first shop it revealed.
        rest[0]?.querySelector('a')?.focus();
        return all.remove();
      }
      const sh = e.target.closest('[data-shops]');
      if (sh) return toggleShops(sh);
    };
    el.addEventListener('click', onClick);

    const onHash = () => {
      const id = pick(routeFromUrl());
      if (id && id !== selected) {
        filters.type = 'all';
        filters.dist = 'all';
        applyFilters();
        select(id);
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      }
    };
    window.addEventListener('hashchange', onHash);

    controllers.set(el, {
      setMonth(c) {
        liveCtx = c;
        renderSeason();
        for (const r of routes) {
          const slot = cardsEl.querySelector(`[data-season-for="${r.id}"]`);
          if (slot) slot.innerHTML = seasonBadge(r, c);
        }
        const months = detailEl.querySelector('.cyc-months');
        if (months) months.outerHTML = monthCells(byId.get(selected), c);
      },
      setBasemap(name) {
        mapApi?.setBasemap(name);
      },
    });

    return () => {
      controllers.delete(el);
      el.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHash);
      profile?.destroy();
      mapApi?.destroy();
    };
  },

  update(el, ctx, changed) {
    const c = controllers.get(el);
    if (!c) return;
    if (changed.includes('month')) c.setMonth(ctx);
    if (changed.includes('basemap')) c.setBasemap(ctx.state.basemap);
  },
};
