// "Explore the area": one big map of the places around the house (POIs,
// beaches, activities and the owner's own photos) with layer chips, area
// presets, a searchable list sorted by distance and an "everyday essentials"
// panel. The map engine follows state.mapEngine: Leaflet (2D, follows
// state.basemap) or the three.js terrain (3D). Data and both engines are
// loaded in mount(); render() only draws the shell and skeletons.
import './explore.css';
import { PHOTOS } from '../content/site.js';
import { esc, icon, fromVilla, travelMinutes, formatKm, formatMinutes, bestMode, monthName, photo, prefersReducedMotion, bus } from '../lib/util.js';
import { openLightbox } from '../lib/lightbox.js';
import { roadMinutes } from '../maps/road.js';
import beaches from '../data/beaches.json';
import { getState } from '../state.js';
import { plural, inMonth } from '../lib/lang-forms.js';

/* ------------------------------------------------------------------ */
/* Copy (grouped for translation: add sl / hr / it next to en / de)    */
/* ------------------------------------------------------------------ */

const L = {
  eyebrow: { en: 'Explore the area', de: 'Die Umgebung entdecken', sl: 'Raziščite okolico', hr: 'Istražite okolicu', it: 'Scoprite i dintorni' },
  search: { en: 'Search places', de: 'Orte suchen', sl: 'Iskanje krajev', hr: 'Pretraži mjesta', it: 'Cerca luoghi' },
  searchPh: { en: 'Search: church, bakery, Pag…', de: 'Suche: Kirche, Bäckerei, Pag…', sl: 'Npr. cerkev, pekarna, Pag …', hr: 'Npr. crkva, pekara, Pag…', it: 'Es. chiesa, panetteria, Pag…' },
  searchHidden: {
    en: { one: 'Show {n} match in hidden layers', other: 'Show {n} matches in hidden layers' },
    de: '{n} Treffer in ausgeblendeten Ebenen zeigen',
    sl: { one: 'Prikaži {n} zadetek v skritih slojih', two: 'Prikaži {n} zadetka v skritih slojih', few: 'Prikaži {n} zadetke v skritih slojih', other: 'Prikaži {n} zadetkov v skritih slojih' },
    hr: { one: 'Prikaži {n} rezultat u skrivenim slojevima', few: 'Prikaži {n} rezultata u skrivenim slojevima', other: 'Prikaži {n} rezultata u skrivenim slojevima' },
    it: { one: 'Mostra {n} risultato nei livelli nascosti', other: 'Mostra {n} risultati nei livelli nascosti' },
  },
  mapHint: {
    en: 'Use the list next to the map to choose a place with the keyboard.',
    de: 'Mit der Tastatur wählen Sie Orte über die Liste neben der Karte.',
    sl: 'S tipkovnico izberete kraj na seznamu ob zemljevidu.',
    hr: 'Tipkovnicom odaberite mjesto s popisa pokraj karte.',
    it: "Con la tastiera scegliete un luogo dall'elenco accanto alla mappa.",
  },
  layers: { en: 'Show on the map', de: 'Auf der Karte zeigen', sl: 'Prikaži na zemljevidu', hr: 'Prikaži na karti', it: 'Mostra sulla mappa' },
  areas: { en: 'Jump to', de: 'Springen zu', sl: 'Skoči na', hr: 'Skoči na', it: 'Vai a' },
  engine: { en: 'Map type', de: 'Kartentyp', sl: 'Vrsta zemljevida', hr: 'Vrsta karte', it: 'Tipo di mappa' },
  map2d: { en: '2D map', de: '2D-Karte', sl: '2D-zemljevid', hr: '2D karta', it: 'Mappa 2D' },
  map3d: { en: '3D terrain', de: '3D-Gelände', sl: '3D-teren', hr: '3D teren', it: 'Rilievo 3D' },
  basemap: { en: 'Map style', de: 'Kartenstil', sl: 'Slog zemljevida', hr: 'Stil karte', it: 'Stile della mappa' },
  basemaps: {
    light: { en: 'Streets', de: 'Straßen', sl: 'Ulice', hr: 'Ulice', it: 'Stradale' },
    satellite: { en: 'Satellite', de: 'Satellit', sl: 'Satelit', hr: 'Satelit', it: 'Satellite' },
    topo: { en: 'Topographic', de: 'Topografisch', sl: 'Topografski', hr: 'Topografska', it: 'Topografica' },
  },
  // Plural forms (lib/lang-forms.js); a single result shows just "1 place".
  count: {
    en: { one: '{n} place', other: '{n} places · nearest first' },
    de: { one: '{n} Ort', other: '{n} Orte · die nächsten zuerst' },
    sl: { one: '{n} kraj', two: '{n} kraja · najbližji najprej', few: '{n} kraji · najbližji najprej', other: '{n} krajev · najbližji najprej' },
    hr: { one: '{n} mjesto', few: '{n} mjesta · najbliža prva', other: '{n} mjesta · najbliža prva' },
    it: { one: '{n} luogo', other: '{n} luoghi · prima i più vicini' },
  },
  countQ: {
    en: { one: '{n} place', other: '{n} places · best matches first' },
    de: { one: '{n} Ort', other: '{n} Orte · beste Treffer zuerst' },
    sl: { one: '{n} kraj', two: '{n} kraja · najboljši zadetki najprej', few: '{n} kraji · najboljši zadetki najprej', other: '{n} krajev · najboljši zadetki najprej' },
    hr: { one: '{n} mjesto', few: '{n} mjesta · najbolji rezultati prvi', other: '{n} mjesta · najbolji rezultati prvi' },
    it: { one: '{n} luogo', other: '{n} luoghi · prima i risultati migliori' },
  },
  none: {
    en: 'Nothing matches. Clear the search or switch on more layers.',
    de: 'Keine Treffer. Suche löschen oder mehr Ebenen einschalten.',
    sl: 'Ni zadetkov. Počistite iskanje ali vklopite več slojev.',
    hr: 'Nema rezultata. Očistite pretragu ili uključite više slojeva.',
    it: 'Nessun risultato. Cancellate la ricerca o attivate altri livelli.',
  },
  clear: { en: 'Clear filters', de: 'Filter zurücksetzen', sl: 'Počisti filtre', hr: 'Poništi filtre', it: 'Azzera i filtri' },
  showMore: { en: 'Show {n} more', de: '{n} weitere zeigen', sl: 'Prikaži še {n}', hr: 'Prikaži još {n}', it: 'Mostrane altri {n}' },
  loading: { en: 'Loading the map and {n}+ places…', de: 'Karte und über {n} Orte werden geladen…', sl: 'Nalagamo zemljevid in več kot {n} krajev …', hr: 'Učitavamo kartu i više od {n} mjesta…', it: 'Caricamento della mappa e di oltre {n} luoghi…' },
  loading3d: { en: 'Loading the 3D terrain…', de: '3D-Gelände wird geladen…', sl: 'Nalagamo 3D-teren …', hr: 'Učitavamo 3D teren…', it: 'Caricamento del rilievo 3D…' },
  back2d: { en: 'Back to the 2D map', de: 'Zurück zur 2D-Karte', sl: 'Nazaj na 2D-zemljevid', hr: 'Natrag na 2D kartu', it: 'Torna alla mappa 2D' },
  mapLabel: { en: 'Map of places around the house', de: 'Karte der Orte rund um das Haus', sl: 'Zemljevid krajev v okolici hiše', hr: 'Karta mjesta oko kuće', it: 'Mappa dei luoghi intorno alla casa' },
  listLabel: { en: 'Places, nearest first', de: 'Orte, die nächsten zuerst', sl: 'Kraji, najbližji najprej', hr: 'Mjesta, najbliža prva', it: 'Luoghi, prima i più vicini' },
  why: { en: 'Why go', de: 'Warum hin', sl: 'Zakaj tja', hr: 'Zašto ići', it: 'Perché andarci' },
  tip: { en: 'Tip', de: 'Tipp', sl: 'Nasvet', hr: 'Savjet', it: 'Consiglio' },
  allow: { en: 'Allow {t}', de: 'Dauer ca. {t}', sl: 'Predvidoma {t}', hr: 'Trajanje oko {t}', it: 'Durata circa {t}' },
  season: { en: 'When', de: 'Wann', sl: 'Kdaj', hr: 'Kada', it: 'Quando' },
  directions: { en: 'Directions', de: 'Route', sl: 'Navodila za pot', hr: 'Upute za put', it: 'Indicazioni' },
  website: { en: 'Website', de: 'Website', sl: 'Spletna stran', hr: 'Web stranica', it: 'Sito web' },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  unverified: { en: 'Not fully verified', de: 'Nicht ganz bestätigt', sl: 'Ni povsem preverjeno', hr: 'Nije potpuno provjereno', it: 'Non del tutto verificato' },
  unverifiedNote: {
    en: 'We could not fully verify this place. Please check before you go, or ask us.',
    de: 'Diesen Ort konnten wir nicht ganz überprüfen. Bitte vorher prüfen oder uns fragen.',
    sl: 'Tega kraja nismo mogli povsem preveriti. Pred obiskom ga preverite ali vprašajte nas.',
    hr: 'Ovo mjesto nismo uspjeli u potpunosti provjeriti. Provjerite prije polaska ili pitajte nas.',
    it: 'Non siamo riusciti a verificare del tutto questo luogo. Controllate prima di andarci, o chiedete a noi.',
  },
  hoursUnknown: { en: 'Opening hours not verified: ask us', de: 'Öffnungszeiten nicht bestätigt: fragen Sie uns', sl: 'Delovni čas ni preverjen: vprašajte nas', hr: 'Radno vrijeme nije provjereno: pitajte nas', it: 'Orari non verificati: chiedeteci' },
  openPhoto: { en: 'Open photo', de: 'Foto öffnen', sl: 'Odpri fotografijo', hr: 'Otvori fotografiju', it: 'Apri la foto' },
  ourPhoto: { en: 'Photo by the owners', de: 'Foto der Gastgeber', sl: 'Fotografija gostiteljev', hr: 'Fotografija domaćina', it: 'Foto dei proprietari' },
  selected: { en: 'Selected place', de: 'Ausgewählter Ort', sl: 'Izbrani kraj', hr: 'Odabrano mjesto', it: 'Luogo selezionato' },
  closeDetail: { en: 'Close details', de: 'Details schließen', sl: 'Zapri podrobnosti', hr: 'Zatvori pojedinosti', it: 'Chiudi i dettagli' },
  showOnMap: { en: 'Show on map', de: 'Auf der Karte', sl: 'Pokaži na zemljevidu', hr: 'Prikaži na karti', it: 'Mostra sulla mappa' },
  outside3d: { en: 'Outside the 3D area: shown in the list only', de: 'Außerhalb des 3D-Bereichs: nur in der Liste', sl: 'Zunaj območja 3D: prikazano samo na seznamu', hr: 'Izvan 3D područja: prikazano samo na popisu', it: "Fuori dall'area 3D: solo nell'elenco" },
  distanceNote: {
    en: 'Beach distances follow the road, as in the Beaches section. Other distances are measured in a straight line from the house; times add a typical detour. All times are approximate. Facts come from OpenStreetMap, official sites and other public sources, linked under each place.',
    de: 'Strandentfernungen folgen der Straße, wie im Abschnitt Strände. Andere Entfernungen sind Luftlinie vom Haus; die Zeiten enthalten einen üblichen Umweg. Alle Zeiten sind ungefähr. Die Angaben stammen aus OpenStreetMap, offiziellen Seiten und anderen öffentlichen Quellen, verlinkt bei jedem Ort.',
    sl: 'Razdalje do plaž sledijo cesti, tako kot v razdelku Plaže. Druge razdalje so merjene zračno od hiše; časi vključujejo običajen ovinek. Vsi časi so približni. Podatki so iz OpenStreetMap, uradnih strani in drugih javnih virov, povezanih pri vsakem kraju.',
    hr: 'Udaljenosti do plaža prate cestu, kao u odjeljku Plaže. Ostale udaljenosti mjerene su zračnom linijom od kuće; vremena uključuju uobičajeni zaobilazak. Sva su vremena približna. Podaci potječu iz OpenStreetMapa, službenih stranica i drugih javnih izvora, povezanih uz svako mjesto.',
    it: "Le distanze dalle spiagge seguono la strada, come nella sezione Spiagge. Le altre sono misurate in linea d'aria dalla casa; i tempi includono una deviazione tipica. Tutti i tempi sono indicativi. I dati provengono da OpenStreetMap, siti ufficiali e altre fonti pubbliche, citate sotto ogni luogo.",
  },
  openGmaps: { en: 'Open in Google Maps', de: 'In Google Maps öffnen', sl: 'Odpri v Google Zemljevidih', hr: 'Otvori u Google kartama', it: 'Apri in Google Maps' },
  mountError: {
    en: 'The interactive map could not start. Please reload the page, or open the area in Google Maps.',
    de: 'Die interaktive Karte konnte nicht starten. Bitte die Seite neu laden oder die Gegend in Google Maps öffnen.',
    sl: 'Interaktivnega zemljevida ni bilo mogoče zagnati. Znova naložite stran ali odprite okolico v Google Zemljevidih.',
    hr: 'Interaktivna karta nije se mogla pokrenuti. Ponovno učitajte stranicu ili otvorite okolicu u Google kartama.',
    it: 'Non è stato possibile avviare la mappa interattiva. Ricaricate la pagina o aprite la zona in Google Maps.',
  },
  // Month awareness. {m} is the whole "in <month>" phrase from inMonth() (lib/lang-forms.js).
  inMonth: { en: 'Available {m}', de: 'Möglich {m}', sl: 'Na voljo {m}', hr: 'Dostupno {m}', it: 'Disponibili {m}' },
  status: {
    best: { en: 'Best {m}', de: 'Ideal {m}', sl: 'Najlepše {m}', hr: 'Najljepše {m}', it: 'Ideale {m}' },
    in: { en: 'On {m}', de: 'Geöffnet {m}', sl: 'Na voljo {m}', hr: 'Dostupno {m}', it: 'Disponibile {m}' },
    off: { en: 'Out of season {m}', de: 'Außerhalb der Saison {m}', sl: 'Zunaj sezone {m}', hr: 'Izvan sezone {m}', it: 'Fuori stagione {m}' },
    offApprox: { en: 'Probably closed {m}', de: 'Wohl geschlossen {m}', sl: 'Verjetno zaprto {m}', hr: 'Vjerojatno zatvoreno {m}', it: 'Probabilmente chiuso {m}' },
  },
  // Essentials panel
  essTitle: { en: 'Everyday essentials, a short walk away', de: 'Alles für den Alltag, wenige Schritte entfernt', sl: 'Vse za vsakdan, le kratek sprehod stran', hr: 'Sve za svaki dan, na kratkoj šetnji od kuće', it: 'Il necessario di ogni giorno, a breve distanza a piedi' },
  essLede: {
    en: 'You do not need the car for breakfast. A small supermarket, a bakery, a fish shop, a cash machine and the bus stop are all a few minutes’ walk from the gate.',
    de: 'Für das Frühstück brauchen Sie kein Auto. Ein kleiner Supermarkt, eine Bäckerei, ein Fischgeschäft, ein Geldautomat und die Bushaltestelle sind wenige Gehminuten vom Tor entfernt.',
    sl: 'Za zajtrk ne potrebujete avta. Majhna trgovina, pekarna, ribarnica, bankomat in avtobusna postaja so le nekaj minut hoje od vrat.',
    hr: 'Za doručak vam ne treba auto. Mali supermarket, pekara, ribarnica, bankomat i autobusna stanica udaljeni su nekoliko minuta hoda od kapije.',
    it: "Per la colazione non serve l'auto. Un piccolo supermercato, una panetteria, una pescheria, un bancomat e la fermata dell'autobus sono a pochi minuti a piedi dal cancello.",
  },
  // Plural on {n}; {t} is the walking time.
  essStat: {
    en: { one: '{n} essential within a {t} walk', other: '{n} essentials within a {t} walk' },
    de: { one: '{n} Ding des Alltags in {t} zu Fuß', other: '{n} Dinge des Alltags in {t} zu Fuß' },
    sl: { one: '{n} stvar za vsakdan do {t} hoje', other: '{n} stvari za vsakdan do {t} hoje' },
    hr: { one: '{n} mjesto za svakodnevne potrebe do {t} hoda', other: '{n} mjesta za svakodnevne potrebe do {t} hoda' },
    it: { one: '{n} servizio essenziale entro {t} a piedi', other: '{n} servizi essenziali entro {t} a piedi' },
  },
  essWalk: { en: 'On foot', de: 'Zu Fuß', sl: 'Peš', hr: 'Pješice', it: 'A piedi' },
  essDrive: { en: 'By car', de: 'Mit dem Auto', sl: 'Z avtom', hr: 'Autom', it: 'In auto' },
  essHours: {
    en: 'Opening hours of the small shops in Sabunike are not published and some may be seasonal.',
    de: 'Die Öffnungszeiten der kleinen Läden in Sabunike sind nicht veröffentlicht, manche haben vielleicht nur in der Saison offen.',
    sl: 'Delovni čas majhnih trgovin v Sabunikah ni objavljen, nekatere so morda odprte le v sezoni.',
    hr: 'Radno vrijeme malih trgovina u Sabunikama nije objavljeno, a neke možda rade samo u sezoni.',
    it: 'Gli orari dei piccoli negozi di Sabunike non sono pubblicati e alcuni potrebbero essere stagionali.',
  },
  essHoursMonth: {
    en: 'Coming {m}? Some of the small shops in Sabunike may be closed outside the summer season. Ask us and we will tell you what is open.',
    de: 'Sie kommen {m}? Manche kleinen Läden in Sabunike haben außerhalb der Sommersaison vielleicht zu. Fragen Sie uns, wir sagen Ihnen, was offen ist.',
    sl: 'Pridete {m}? Nekatere majhne trgovine v Sabunikah so zunaj poletne sezone morda zaprte. Vprašajte nas in povedali vam bomo, kaj je odprto.',
    hr: 'Dolazite {m}? Neke male trgovine u Sabunikama izvan ljetne sezone možda ne rade. Pitajte nas i reći ćemo vam što radi.',
    it: 'Venite {m}? Alcuni piccoli negozi di Sabunike potrebbero essere chiusi fuori dalla stagione estiva. Chiedeteci e vi diremo cosa è aperto.',
  },
  askOpen: { en: 'Ask us what is open', de: 'Fragen, was offen ist', sl: 'Vprašajte, kaj je odprto', hr: 'Pitajte što radi', it: 'Chiedeteci cosa è aperto' },
  // Prefilled inquiry message, written in the guest's voice.
  askOpenMsg: {
    en: 'We are thinking of coming {m}. Which shops, the bakery and restaurants near the house are open then?',
    de: 'Wir denken an einen Aufenthalt {m}. Welche Läden, die Bäckerei und Restaurants in der Nähe haben dann geöffnet?',
    sl: 'Razmišljamo o obisku {m}. Katere trgovine, pekarna in restavracije v bližini hiše so takrat odprte?',
    hr: 'Razmišljamo o dolasku {m}. Koje trgovine, pekara i restorani u blizini kuće tada rade?',
    it: 'Pensiamo di venire {m}. Quali negozi, la panetteria e i ristoranti vicino alla casa sono aperti in quel periodo?',
  },
};

// Search words in the UI language that map to the English data text
// (keys are matched accent-insensitively; a query word of 4+ letters also matches a key it starts).
const SEARCH_SYNONYMS = {
  de: {
    kirche: 'church',
    kathedrale: 'cathedral',
    bäckerei: 'bakery',
    strand: 'beach',
    apotheke: 'pharmacy',
    geldautomat: 'atm',
    supermarkt: 'supermarket',
    burg: 'fortress',
    festung: 'fortress',
    insel: 'island',
    saline: 'salt',
    salz: 'salt',
    wein: 'wine',
    käse: 'cheese',
    fisch: 'fish',
    markt: 'market',
    museum: 'museum',
    krankenhaus: 'hospital',
    bushaltestelle: 'bus stop',
  },
  sl: {
    cerkev: 'church',
    cerkve: 'church',
    katedrala: 'cathedral',
    pekarna: 'bakery',
    kruh: 'bakery',
    plaža: 'beach',
    plaže: 'beach',
    lekarna: 'pharmacy',
    bankomat: 'atm',
    trgovina: 'supermarket',
    trdnjava: 'fortress',
    otok: 'island',
    soline: 'salt',
    sol: 'salt',
    vino: 'wine',
    sir: 'cheese',
    riba: 'fish',
    ribarnica: 'fish',
    tržnica: 'market',
    muzej: 'museum',
    bolnišnica: 'hospital',
    avtobus: 'bus',
    postaja: 'bus stop',
  },
  hr: {
    crkva: 'church',
    crkve: 'church',
    katedrala: 'cathedral',
    pekara: 'bakery',
    pekarnica: 'bakery',
    plaža: 'beach',
    plaže: 'beach',
    ljekarna: 'pharmacy',
    bankomat: 'atm',
    trgovina: 'supermarket',
    tvrđava: 'fortress',
    utvrda: 'fortress',
    otok: 'island',
    solana: 'salt',
    sol: 'salt',
    vino: 'wine',
    sir: 'cheese',
    riba: 'fish',
    ribarnica: 'fish',
    tržnica: 'market',
    muzej: 'museum',
    bolnica: 'hospital',
    autobus: 'bus',
    stanica: 'bus stop',
  },
  it: {
    chiesa: 'church',
    chiese: 'church',
    cattedrale: 'cathedral',
    duomo: 'cathedral',
    panetteria: 'bakery',
    panificio: 'bakery',
    forno: 'bakery',
    spiaggia: 'beach',
    spiagge: 'beach',
    farmacia: 'pharmacy',
    bancomat: 'atm',
    supermercato: 'supermarket',
    fortezza: 'fortress',
    isola: 'island',
    saline: 'salt',
    sale: 'salt',
    vino: 'wine',
    formaggio: 'cheese',
    pesce: 'fish',
    pescheria: 'fish',
    mercato: 'market',
    museo: 'museum',
    ospedale: 'hospital',
    autobus: 'bus',
    fermata: 'bus stop',
  },
};

// Per-audience header copy. Facts stay in the data; this is the pitch.
const COPY = {
  general: {
    title: { en: 'Everything nearby, on one map', de: 'Alles in der Nähe, auf einer Karte', sl: 'Vse v bližini na enem zemljevidu', hr: 'Sve u blizini na jednoj karti', it: 'Tutto nei dintorni, su una sola mappa' },
    lede: {
      en: 'Nin’s 9th-century Holy Cross church and its salt pans, Zadar’s Sea Organ, Pag and the Velebit, each linked to its sources. Tap any place to see why it is worth it, how far it is, and the route from our gate.',
      de: 'Die Heilig-Kreuz-Kirche von Nin aus dem 9. Jahrhundert und die Salinen, die Meeresorgel von Zadar, Pag und der Velebit, jeweils mit Quellen. Tippen Sie auf einen Ort: warum er sich lohnt, wie weit er ist und die Route ab unserem Tor.',
      sl: 'Cerkev sv. Križa v Ninu iz 9. stoletja in ninske soline, Morske orgle v Zadru, Pag in Velebit, vsak s povezavami do virov. Tapnite kateri koli kraj in videli boste, zakaj je vreden obiska, kako daleč je in pot od naših vrat.',
      hr: 'Ninska crkva sv. Križa iz 9. stoljeća i solana, zadarske Morske orgulje, Pag i Velebit, svako s poveznicama na izvore. Dodirnite bilo koje mjesto i vidjet ćete zašto vrijedi otići, koliko je daleko i put od naše kapije.',
      it: "La chiesa di Santa Croce di Nin, del IX secolo, e le sue saline, l'Organo marino di Zadar, Pag e il Velebit, ciascuno con le sue fonti. Toccate un luogo per scoprire perché merita, quanto dista e il percorso dal nostro cancello.",
    },
  },
  families: {
    title: { en: 'Easy days out, most of them under 15 minutes away', de: 'Leichte Ausflüge, die meisten unter 15 Minuten entfernt', sl: 'Lahki izleti, večina manj kot 15 minut stran', hr: 'Lagani izleti, većina na manje od 15 minuta', it: 'Gite facili, quasi tutte a meno di 15 minuti' },
    lede: {
      en: 'Shallow beaches, pools, mini golf and Nin, a former royal town on a lagoon island. Family-friendly places are pre-selected; switch the filter off to see everything.',
      de: 'Flache Strände, Pools, Minigolf und Nin, eine ehemalige Königsstadt auf einer Laguneninsel. Familienfreundliche Orte sind vorausgewählt; Filter ausschalten für alles.',
      sl: 'Plitve plaže, bazeni, mini golf in Nin, nekdanje kraljevo mesto na otočku v laguni. Kraji, primerni za družine, so že izbrani; izklopite filter, da vidite vse.',
      hr: 'Plitke plaže, bazeni, mini golf i Nin, nekadašnji kraljevski grad na otočiću u laguni. Mjesta prilagođena obiteljima već su odabrana; isključite filtar da biste vidjeli sve.',
      it: 'Spiagge con acqua bassa, piscine, minigolf e Nin, antica città regia su un isolotto nella laguna. I luoghi adatti alle famiglie sono già selezionati: disattivate il filtro per vederli tutti.',
    },
  },
  cyclists: {
    title: { en: 'Where the rides go: old towns, bridges, the Velebit', de: 'Wohin die Touren führen: Altstädte, Brücken, der Velebit', sl: 'Kam vodijo ture: stara mesta, mostovi, Velebit', hr: 'Kamo vode ture: stari gradovi, mostovi, Velebit', it: 'Dove portano i giri: centri storici, ponti, il Velebit' },
    lede: {
      en: 'Coffee stops, viewpoints and climbs within cycling distance. Places that suit a ride are pre-selected; the essentials panel shows where to refuel near the house.',
      de: 'Kaffeestopps, Aussichtspunkte und Anstiege in Raddistanz. Orte, die zu einer Tour passen, sind vorausgewählt; unten sehen Sie, wo Sie nahe dem Haus einkaufen.',
      sl: 'Postanki za kavo, razgledišča in vzponi na kolesarski razdalji. Kraji, primerni za turo, so že izbrani; spodaj vidite, kje se blizu hiše okrepčate.',
      hr: 'Pauze za kavu, vidikovci i usponi na biciklističkoj udaljenosti. Mjesta pogodna za turu već su odabrana; ispod vidite gdje se u blizini kuće opskrbiti.',
      it: 'Soste per un caffè, belvedere e salite a distanza di bici. I luoghi adatti a un giro sono già selezionati; più sotto trovate dove rifornirvi vicino alla casa.',
    },
  },
  retreats: {
    title: { en: 'Team outings within an hour of the house', de: 'Team-Ausflüge innerhalb einer Stunde vom Haus', sl: 'Ekipni izleti do ene ure od hiše', hr: 'Timski izleti do sat vremena od kuće', it: "Uscite di gruppo entro un'ora dalla casa" },
    lede: {
      en: 'Wineries, national parks, old towns for a dinner out. Places that work for a group are pre-selected.',
      de: 'Weingüter, Nationalparks, Altstädte für ein Abendessen. Gruppentaugliche Orte sind vorausgewählt.',
      sl: 'Vinske kleti, narodni parki, stara mesta za večerjo zunaj. Kraji, primerni za skupine, so že izbrani.',
      hr: 'Vinarije, nacionalni parkovi, stari gradovi za večeru vani. Mjesta pogodna za grupe već su odabrana.',
      it: 'Cantine, parchi nazionali, centri storici per una cena fuori. I luoghi adatti ai gruppi sono già selezionati.',
    },
  },
};

// Labels for the audience pre-filter (ctx.audience.focus; named after the first poiTag).
const FOCUS = {
  family: { en: 'Family picks', de: 'Für Familien', sl: 'Za družine', hr: 'Za obitelji', it: 'Per famiglie' },
  cyclist: { en: 'Good by bike', de: 'Gut mit dem Rad', sl: 'Primerno za kolo', hr: 'Za bicikliste', it: 'Ideali in bici' },
  retreat: { en: 'Good for groups', de: 'Gut für Gruppen', sl: 'Za skupine', hr: 'Za grupe', it: 'Per gruppi' },
  culture: { en: 'Culture picks', de: 'Kultur', sl: 'Kultura', hr: 'Kultura', it: 'Cultura' },
  food: { en: 'Food & wine picks', de: 'Essen & Wein', sl: 'Hrana in vino', hr: 'Hrana i vino', it: 'Cibo e vino' },
  kite: { en: 'Kite & wind', de: 'Kite & Wind', sl: 'Kajt in veter', hr: 'Kite i vjetar', it: 'Kite e vento' },
  dog: { en: 'Dog-friendly', de: 'Hundefreundlich', sl: 'Prijazno do psov', hr: 'Prilagođeno psima', it: 'Cani ammessi' },
  wellness: { en: 'Wellness picks', de: 'Wellness', sl: 'Dobro počutje', hr: 'Wellness', it: 'Benessere' },
  default: { en: 'Picked for you', de: 'Für Sie ausgewählt', sl: 'Izbrano za vas', hr: 'Odabrano za vas', it: 'Scelti per voi' },
};

// Area preset labels (pois.json areas[] has the coordinates).
const AREAS = {
  sabunike: { en: 'Sabunike', de: 'Sabunike', sl: 'Sabunike', hr: 'Sabunike', it: 'Sabunike' },
  nin: { en: 'Nin & lagoon', de: 'Nin & Lagune', sl: 'Nin in laguna', hr: 'Nin i laguna', it: 'Nin e laguna' },
  'privlaka-vir': { en: 'Privlaka & Vir', de: 'Privlaka & Vir', sl: 'Privlaka in Vir', hr: 'Privlaka i Vir', it: 'Privlaka e Vir' },
  zadar: { en: 'Zadar', de: 'Zadar', sl: 'Zadar', hr: 'Zadar', it: 'Zadar' },
  pag: { en: 'Pag', de: 'Pag', sl: 'Pag', hr: 'Pag', it: 'Pag' },
  velebit: { en: 'Velebit', de: 'Velebit', sl: 'Velebit', hr: 'Velebit', it: 'Velebit' },
  region: { en: 'Whole region', de: 'Ganze Region', sl: 'Vsa regija', hr: 'Cijela regija', it: "Tutta l'area" },
};

/* ------------------------------------------------------------------ */
/* Layers, glyphs, essentials                                          */
/* ------------------------------------------------------------------ */

// Small stroke glyphs (24px grid) for categories and essentials.
const GLYPHS = {
  history: '<path d="M3 21h18M5 21v-9M9.7 21v-9M14.3 21v-9M19 21v-9M3 12h18M12 3 3 9h18z"/>',
  nature: '<path d="m12 2-6 9h3l-4 6h14l-4-6h3z"/><path d="M12 17v5"/>',
  'food-drink': '<path d="M7 3h10l-1 6a4 4 0 0 1-8 0zM12 13v7M8 21h8"/>',
  practical: '<path d="M4 9h16l-1.6 10.4A2 2 0 0 1 16.4 21H7.6a2 2 0 0 1-2-1.6zM8.5 9 12 3l3.5 6"/>',
  family: '<circle cx="8" cy="6" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M4 21v-5a4 4 0 0 1 8 0v5M13.5 21v-3.5a3 3 0 0 1 6 0V21"/>',
  town: '<path d="M3 21h18M5 21V10l5-3v14M10 21V4l9 4v13M13 11h3M13 15h3"/>',
  beach: '<path d="M3 12a9 9 0 0 1 18 0zM12 12v7a2 2 0 0 0 4 0"/>',
  activity: '<path d="M5 22V3M5 4h12l-2.5 4.5L17 13H5"/>',
  photo: '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13.5" r="3.5"/>',
  supermarket: '<path d="M4 9h16l-1.6 10.4A2 2 0 0 1 16.4 21H7.6a2 2 0 0 1-2-1.6zM8.5 9 12 3l3.5 6"/>',
  bigSupermarket: '<path d="M2 4h3l2.6 11.5h11L21 7H6.3"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  bakery: '<path d="M3 15c0-5 4-9 9-9s9 4 9 9l-3 3H6z"/><path d="M9.5 7.5 11 17M14.5 7.5 13 17"/>',
  fish: '<path d="M2 12c3-4 7-6 11-6 4 0 7 3 9 6-2 3-5 6-9 6-4 0-8-2-11-6zM2 12l-1 4M2 12 1 8"/><circle cx="16" cy="11" r="1"/>',
  market: '<path d="M4 4h16l1 5H3zM5 9v11h14V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5"/>',
  atm: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14.5h4"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
  pharmacy: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  doctor: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v9M7.5 12h9"/>',
  hospital: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8v8M15 8v8M9 12h6"/>',
  post: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
};
function glyph(name, size = 18) {
  return `<svg class="ex-glyph-svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name] || GLYPHS.practical}</svg>`;
}

// Map layers in chip order. `color` is a CATEGORY_COLORS key from maps/base.js.
const LAYERS = [
  { id: 'beach', color: 'beach', label: { en: 'Beaches', de: 'Strände', sl: 'Plaže', hr: 'Plaže', it: 'Spiagge' } },
  { id: 'history', color: 'history', label: { en: 'History', de: 'Geschichte', sl: 'Zgodovina', hr: 'Povijest', it: 'Storia' } },
  { id: 'nature', color: 'nature', label: { en: 'Nature', de: 'Natur', sl: 'Narava', hr: 'Priroda', it: 'Natura' } },
  { id: 'town', color: 'town', label: { en: 'Towns', de: 'Orte', sl: 'Kraji', hr: 'Mjesta', it: 'Località' } },
  { id: 'food-drink', color: 'food-drink', label: { en: 'Food & drink', de: 'Essen & Trinken', sl: 'Hrana in pijača', hr: 'Hrana i piće', it: 'Cibo e bevande' } },
  { id: 'family', color: 'family', label: { en: 'Family fun', de: 'Familienspaß', sl: 'Zabava za družine', hr: 'Zabava za obitelj', it: 'Divertimento in famiglia' } },
  { id: 'practical', color: 'practical', label: { en: 'Shops & services', de: 'Läden & Service', sl: 'Trgovine in storitve', hr: 'Trgovine i usluge', it: 'Negozi e servizi' } },
  { id: 'activity', color: 'nightlife', label: { en: 'Activities & events', de: 'Aktivitäten & Events', sl: 'Aktivnosti in dogodki', hr: 'Aktivnosti i događanja', it: 'Attività ed eventi' } },
  { id: 'photo', color: 'photo', label: { en: 'Our photos', de: 'Unsere Fotos', sl: 'Naše fotografije', hr: 'Naše fotografije', it: 'Le nostre foto' } },
];
const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l]));
// Layers that start hidden: shops repeat the essentials panel (whose buttons
// switch the layer on), activities are 40+ pins and come on once a month is chosen.
const DEFAULT_OFF = ['activity', 'practical'];
const MONTH_ON = ['activity'];

// Essentials: nearest verified practical POI of each kind. `walk` kinds are the
// promise of the panel; the rest are "a short drive".
const ESSENTIALS = [
  { kind: 'supermarket', match: /lito|konzum|plodine|tommy/, label: { en: 'Supermarket', de: 'Supermarkt', sl: 'Trgovina z živili', hr: 'Trgovina', it: 'Supermercato' } },
  { kind: 'bakery', match: /bakery/, label: { en: 'Bakery', de: 'Bäckerei', sl: 'Pekarna', hr: 'Pekara', it: 'Panetteria' } },
  { kind: 'fish', match: /-fish$/, label: { en: 'Fish shop', de: 'Fischgeschäft', sl: 'Ribarnica', hr: 'Ribarnica', it: 'Pescheria' } },
  { kind: 'market', match: /-market$/, label: { en: 'Market stalls', de: 'Marktstände', sl: 'Stojnice', hr: 'Štandovi', it: 'Bancarelle' } },
  { kind: 'atm', match: /-atm$/, label: { en: 'Cash machine', de: 'Geldautomat', sl: 'Bankomat', hr: 'Bankomat', it: 'Bancomat' } },
  { kind: 'bus', match: /-bus-/, label: { en: 'Bus stop', de: 'Bushaltestelle', sl: 'Avtobusna postaja', hr: 'Autobusna stanica', it: "Fermata dell'autobus" } },
  { kind: 'bigSupermarket', match: /konzum|plodine/, label: { en: 'Large supermarket', de: 'Großer Supermarkt', sl: 'Velika trgovina', hr: 'Veliki supermarket', it: 'Grande supermercato' } },
  { kind: 'pharmacy', match: /pharmacy/, label: { en: 'Pharmacy', de: 'Apotheke', sl: 'Lekarna', hr: 'Ljekarna', it: 'Farmacia' } },
  { kind: 'doctor', match: /ambulanta/, label: { en: 'GP clinic', de: 'Arztpraxis', sl: 'Ambulanta splošne medicine', hr: 'Ambulanta obiteljske medicine', it: 'Ambulatorio medico' } },
  { kind: 'post', match: /-post$/, label: { en: 'Post office', de: 'Post', sl: 'Pošta', hr: 'Pošta', it: 'Ufficio postale' } },
  { kind: 'hospital', match: /hospital/, label: { en: 'Hospital (emergency dept.)', de: 'Krankenhaus (Notaufnahme)', sl: 'Bolnišnica (urgenca)', hr: 'Bolnica (hitni prijem)', it: 'Ospedale (pronto soccorso)' } },
];
const WALK_KM = 1.5;

const HOUSE = { lat: 44.2587142, lon: 15.1589155 };
const GMAPS_HOUSE = `https://www.google.com/maps/search/?api=1&query=${HOUSE.lat},${HOUSE.lon}`;
// Area covered by the 3D terrain heightmap (public/terrain/meta.json bbox).
const TERRAIN_BBOX = { west: 14.86, south: 43.98, east: 15.72, north: 44.6 };
const LIST_PAGE = { desktop: 60, mobile: 8 };
const MOBILE = '(max-width: 900px)';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// Walking directions for places within walking distance, driving otherwise.
const directionsMode = (km) => (bestMode(km) === 'walk' ? 'walk' : 'car');
const directionsUrl = (lat, lon, km) =>
  `https://www.google.com/maps/dir/?api=1&origin=${HOUSE.lat},${HOUSE.lon}&destination=${lat},${lon}&travelmode=${directionsMode(km) === 'walk' ? 'walking' : 'driving'}`;
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Seasonality is free text in the research data ("Year-round; best Mar-Jun and
// Sep-Nov", "Boat excursions mainly Apr/May-Oct"). Pull out what the text says
// about months; opening-hours text and "busiest Jul-Aug" never close a place.
const MONTH_RE = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)';
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const SEASON_WORDS = { spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11], winter: [12, 1, 2] };
function monthSpan(a, b) {
  const out = [];
  for (let m = a; out.length < 12; m = (m % 12) + 1) {
    out.push(m);
    if (m === b) break;
  }
  return out;
}
function monthsIn(text, singles) {
  const out = new Set();
  const range = new RegExp(`(?:late |early )?${MONTH_RE}[a-z]*(?:/${MONTH_RE}[a-z]*)?\\s*(?:-|–|to)\\s*(?:late |early )?${MONTH_RE}[a-z]*`, 'g');
  const rest = text.replace(range, (_, a, _b, c) => {
    monthSpan(MON.indexOf(a) + 1, MON.indexOf(c) + 1).forEach((m) => out.add(m));
    return ' ';
  });
  if (singles) {
    for (const m of rest.matchAll(new RegExp(`\\b${MONTH_RE}\\b`, 'g'))) out.add(MON.indexOf(m[1]) + 1);
    for (const [word, ms] of Object.entries(SEASON_WORDS)) if (rest.includes(word)) ms.forEach((m) => out.add(m));
  }
  return out;
}
function parseSeason(text, category) {
  const s = String(text || '').toLowerCase();
  let yearRound = false;
  const open = new Set();
  const best = new Set();
  for (const part of s.split(';')) {
    if (/year-round|24\/7/.test(part)) yearRound = true;
    if (/\bbest\b/.test(part)) monthsIn(part.slice(part.indexOf('best')).replace(/\([^)]*\)/g, ''), true).forEach((m) => best.add(m));
    else if (/busiest|liveliest|avoid|\d\d:\d\d|hours/.test(part)) continue;
    else if (/summer season/.test(part)) [6, 7, 8, 9].forEach((m) => open.add(m));
    else monthsIn(part, false).forEach((m) => open.add(m));
  }
  // Towns and anything open all year never count as "out of season".
  const known = !yearRound && category !== 'town' && open.size > 0;
  if (!yearRound && !known && !best.size) return null;
  return { open: known ? open : null, best: best.size ? best : null, approx: /assumed|not verified|mainly|varies/.test(s) };
}

// 'best' | 'in' | 'off' | 'offApprox' | null for the chosen month.
function monthStatus(item, month) {
  if (!month) return null;
  // Activity `months` are often best months, not opening months: only events
  // are "off" outside them.
  if (item.months) {
    const event = item.activityCategory === 'event';
    return item.months.includes(month) ? (event ? 'in' : 'best') : event ? 'off' : null;
  }
  const s = item.season;
  if (!s) return null;
  if (s.open && !s.open.has(month)) return s.approx ? 'offApprox' : 'off';
  if (s.best?.has(month)) return 'best';
  if (s.open) return 'in';
  return null;
}

/* ------------------------------------------------------------------ */
/* Data normalisation                                                   */
/* ------------------------------------------------------------------ */

function buildItems(pois, beaches, activities, t) {
  const items = [];
  for (const p of pois.items) {
    items.push({
      key: p.id,
      layer: p.category,
      name: p.name,
      lat: p.lat,
      lon: p.lon,
      km: p.km ?? fromVilla(p.lat, p.lon),
      town: p.town,
      description: p.description,
      whyGo: p.whyGo,
      durationHours: p.durationHours,
      seasonText: p.seasonality,
      season: parseSeason(p.seasonality, p.category),
      tags: p.audienceTags || [],
      sources: p.sources || [],
      website: p.website,
      confidence: p.confidence,
    });
  }
  for (const b of beaches.items) {
    items.push({
      key: `b:${b.id}`,
      id: b.id,
      layer: 'beach',
      name: b.name,
      lat: b.lat,
      lon: b.lon,
      km: b.km ?? fromVilla(b.lat, b.lon),
      town: b.municipality,
      description: b.description,
      tip: b.tips,
      road: b.roadKm,
      tags: b.bestFor || [],
      sources: b.sources || [],
      confidence: b.confidence,
    });
  }
  for (const a of activities.items) {
    if (!a.location || !Number.isFinite(a.location.lat)) continue;
    items.push({
      key: `a:${a.id}`,
      id: a.id,
      layer: 'activity',
      name: a.name,
      lat: a.location.lat,
      lon: a.location.lon,
      km: a.km ?? fromVilla(a.location.lat, a.location.lon),
      town: a.location.name,
      description: a.description,
      durationHours: a.durationHours,
      months: Array.isArray(a.months) && a.months.length ? a.months : null,
      activityCategory: a.category,
      tags: a.audienceTags || [],
      sources: a.sources || [],
      website: a.operators?.[0]?.url,
      confidence: a.confidence,
    });
  }
  PHOTOS.filter((p) => p.kind === 'area' && Number.isFinite(p.lat)).forEach((p, i) => {
    items.push({
      key: `ph:${i}`,
      layer: 'photo',
      name: t(p),
      lat: p.lat,
      lon: p.lon,
      km: fromVilla(p.lat, p.lon),
      file: p.file,
      photoIndex: i,
      sources: [],
      confidence: 'high',
    });
  });
  // Nearest first, by the distance the list shows.
  items.sort((a, b) => trip(a).km - trip(b).km);
  return items;
}

// The audience's focus tags for an item's kind: beaches use beachTags (vs
// bestFor), activities activityTags (vs audienceTags), POIs poiTags.
function focusTagsFor(item, focus) {
  if (item.layer === 'photo') return [];
  if (item.layer === 'beach') return focus.beachTags || [];
  if (item.layer === 'activity') return focus.activityTags || [];
  return focus.poiTags || [];
}
function matchesFocus(item, focus) {
  const tags = focusTagsFor(item, focus);
  return !tags.length || tags.some((tag) => item.tags?.includes(tag));
}

/* ------------------------------------------------------------------ */
/* HTML                                                                 */
/* ------------------------------------------------------------------ */

// Beaches carry routed road distances (same numbers as the Beaches section);
// everything else uses the straight-line estimate.
function trip(item) {
  const mode = bestMode(item.road?.walk ?? item.km);
  const road = item.road?.[mode];
  return road != null ? { mode, km: road, min: roadMinutes(road, mode) } : { mode, km: item.km, min: travelMinutes(item.km, mode) };
}
function distanceText(item, t) {
  const { mode, km, min } = trip(item);
  return `${t('about')} ${formatKm(km)} · ${formatMinutes(min)} ${t(mode)}`;
}
function durationText(h, t) {
  return h > 0 ? fill(t(L.allow), { t: formatMinutes(h * 60) }) : '';
}
function seasonText(item, t) {
  if (!item.seasonText) return '';
  return /not in osm; verify/i.test(item.seasonText) ? t(L.hoursUnknown) : item.seasonText;
}
function statusBadge(status, month, t, lang) {
  if (!status) return '';
  const cls = status === 'best' ? 'ok' : status === 'in' ? 'in' : 'off';
  return `<span class="ex-status ex-status-${cls}">${esc(fill(t(L.status[status]), { m: inMonth(month, lang) }))}</span>`;
}

function popupHtml(item, ctx, colors, month) {
  const t = ctx.t;
  const layer = LAYER_BY_ID[item.layer];
  const color = colors[layer?.color] || '#4b5563';
  if (item.layer === 'photo') {
    return `<div class="ex-pop ex-pop-photo">
      <button type="button" class="ex-pop-img" data-lightbox="${item.photoIndex}" aria-label="${esc(t(L.openPhoto))}: ${esc(item.name)}">
        <img src="${photo(item.file, 'thumb')}" alt="${esc(item.name)}" width="480" height="360" loading="lazy" />
      </button>
      <span class="ex-pop-cat" style="--c:${color}">${glyph('photo', 14)}${esc(t(L.ourPhoto))}</span>
      <p class="ex-pop-name">${esc(item.name)}</p>
      <p class="ex-pop-meta">${esc(distanceText(item, t))}</p>
    </div>`;
  }
  const meta = [distanceText(item, t), durationText(item.durationHours, t)].filter(Boolean).join(' · ');
  const season = seasonText(item, t);
  const monthsTxt = item.months ? item.months.map((m) => monthName(m, ctx.lang)).join(', ') : '';
  const low = item.confidence === 'low';
  const sources = item.sources.length
    ? `<details class="ex-src"><summary>${esc(t(L.sources))} (${item.sources.length})</summary><ul>${item.sources
        .map((s) => `<li><a href="${esc(s)}" target="_blank" rel="noopener">${esc(hostOf(s))}</a></li>`)
        .join('')}</ul></details>`
    : '';
  return `<div class="ex-pop">
    <span class="ex-pop-cat" style="--c:${color}">${glyph(item.layer, 14)}${esc(t(layer?.label))}</span>
    <h4 class="ex-pop-name">${esc(item.name)}</h4>
    <p class="ex-pop-meta">${esc(meta)}</p>
    ${statusBadge(monthStatus(item, month), month, t, ctx.lang)}
    ${low ? `<p class="ex-pop-low">${icon('info', { size: 16 })}${esc(t(L.unverifiedNote))}</p>` : ''}
    ${item.description ? `<p class="ex-pop-desc">${esc(item.description)}</p>` : ''}
    ${item.whyGo ? `<p class="ex-pop-why"><strong>${esc(t(L.why))}:</strong> ${esc(item.whyGo)}</p>` : ''}
    ${item.tip ? `<p class="ex-pop-why"><strong>${esc(t(L.tip))}:</strong> ${esc(item.tip)}</p>` : ''}
    ${season ? `<p class="ex-pop-season"><strong>${esc(t(L.season))}:</strong> ${esc(season)}</p>` : ''}
    ${monthsTxt ? `<p class="ex-pop-season"><strong>${esc(t(L.season))}:</strong> ${esc(monthsTxt)}</p>` : ''}
    <div class="ex-pop-actions">
      <a class="btn btn-small btn-primary" href="${esc(directionsUrl(item.lat, item.lon, item.km))}" target="_blank" rel="noopener">${icon(directionsMode(item.km), { size: 16 })}${esc(t(L.directions))}</a>
      ${item.website ? `<a class="btn btn-small" href="${esc(item.website)}" target="_blank" rel="noopener">${esc(t(L.website))}</a>` : ''}
    </div>
    ${sources}
  </div>`;
}

function listItemHtml(item, ctx, colors, month, active) {
  const t = ctx.t;
  const layer = LAYER_BY_ID[item.layer];
  const color = colors[layer?.color] || '#4b5563';
  const status = monthStatus(item, month);
  const meta = [item.layer === 'photo' ? t(L.ourPhoto) : item.town, distanceText(item, t), durationText(item.durationHours, t)].filter(Boolean);
  const lead = item.layer === 'photo'
    ? `<span class="ex-thumb"><img src="${photo(item.file, 'thumb')}" alt="" loading="lazy" decoding="async" /></span>`
    : `<span class="ex-glyph" style="--c:${color}">${glyph(item.layer, 18)}</span>`;
  return `<li><button type="button" class="ex-item${active ? ' is-active' : ''}${status === 'off' || status === 'offApprox' ? ' is-off' : ''}" data-key="${esc(item.key)}" aria-current="${active}">
    ${lead}
    <span class="ex-item-main">
      <span class="ex-item-name">${esc(item.name)}</span>
      <span class="ex-item-meta">${esc(meta.join(' · '))}</span>
      ${item.whyGo ? `<span class="ex-item-why">${esc(item.whyGo)}</span>` : ''}
      ${status || item.confidence === 'low'
        ? `<span class="ex-item-badges">${statusBadge(status, month, t, ctx.lang)}${item.confidence === 'low' ? `<span class="ex-status ex-status-low">${esc(t(L.unverified))}</span>` : ''}</span>`
        : ''}
    </span>
  </button></li>`;
}

function essentialsHtml(items, ctx, month) {
  const t = ctx.t;
  const practical = items.filter((i) => i.layer === 'practical' && i.confidence !== 'low');
  const rows = ESSENTIALS.map((e) => ({ ...e, item: practical.find((i) => e.match.test(i.key)) })).filter((e) => e.item);
  const walk = rows.filter((r) => r.kind !== 'bigSupermarket' && r.item.km < WALK_KM);
  const drive = rows.filter((r) => !walk.includes(r));
  const maxWalk = Math.max(...walk.map((r) => travelMinutes(r.item.km, 'walk')));
  const row = (r, mode) => `<li>
      <span class="ex-ess-icon">${glyph(r.kind, 20)}</span>
      <span class="ex-ess-text"><strong>${esc(t(r.label))}</strong><span>${esc(r.item.name)}</span></span>
      <span class="ex-ess-dist"><b>${esc(mode === 'walk' ? formatMinutes(travelMinutes(r.item.km, 'walk')) : formatKm(r.item.km))}</b><span>${esc(mode === 'walk' ? formatKm(r.item.km) : `${formatMinutes(travelMinutes(r.item.km, 'car'))} ${t('car')}`)}</span></span>
      <button type="button" class="btn btn-ghost btn-small ex-ess-go" data-key="${esc(r.item.key)}" aria-label="${esc(t(L.showOnMap))}: ${esc(r.item.name)}">${icon('pin', { size: 18 })}</button>
    </li>`;
  const offSeason = month && (month < 6 || month > 9);
  return `
    <div class="ex-ess-head">
      <div>
        <h3>${esc(t(L.essTitle))}</h3>
        <p>${esc(t(L.essLede))}</p>
      </div>
      ${walk.length ? `<p class="ex-ess-stat"><b>${walk.length}</b><span>${esc(fill(plural(L.essStat, walk.length, ctx.lang), { t: formatMinutes(maxWalk) }))}</span></p>` : ''}
    </div>
    <div class="ex-ess-cols">
      <section aria-labelledby="ex-ess-walk"><h4 id="ex-ess-walk">${icon('walk', { size: 18 })}${esc(t(L.essWalk))}</h4><ul class="ex-ess-list">${walk.map((r) => row(r, 'walk')).join('')}</ul></section>
      <section aria-labelledby="ex-ess-drive"><h4 id="ex-ess-drive">${icon('car', { size: 18 })}${esc(t(L.essDrive))}</h4><ul class="ex-ess-list">${drive.map((r) => row(r, 'car')).join('')}</ul></section>
    </div>
    <p class="ex-ess-note${offSeason ? ' is-warn' : ''}">${icon('info', { size: 18 })}<span>${esc(offSeason ? fill(t(L.essHoursMonth), { m: inMonth(month, ctx.lang) }) : t(L.essHours))}</span>
      ${offSeason ? `<button type="button" class="btn btn-small" data-ask-open>${icon('chat', { size: 16 })}${esc(t(L.askOpen))}</button>` : ''}</p>`;
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

const controllers = new WeakMap(); // section element -> controller (for update())
let live = null; // the mounted controller, for map:focus
let pendingFocus = null;

// A map:focus sent before the section has mounted (it mounts lazily): remember
// it, scroll there, and let mount() pick it up.
bus.on('map:focus', (payload) => {
  if (live) return;
  const el = document.getElementById('explore');
  if (!el) return;
  pendingFocus = payload;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
});

function copyFor(ctx) {
  return COPY[ctx.audience.id] || COPY.general;
}

// The whole mount; mount() below wraps it so a failure never looks like a hang.
async function mountExplore(el, ctx) {
  const t = ctx.t;
  const [{ default: pois }, { default: activities }, base] = await Promise.all([
    import('../data/pois.json'),
    import('../data/activities.json'),
    import('../maps/base.js'),
  ]);
  if (!el.isConnected) return undefined;
  const { L: Leaflet, createMap, pinIcon, CATEGORY_COLORS } = base;
  const colors = CATEGORY_COLORS;
  const items = buildItems(pois, beaches, activities, t);
  const byKey = new Map(items.map((i) => [i.key, i]));
  const photoItems = items.filter((i) => i.layer === 'photo').sort((a, b) => a.photoIndex - b.photoIndex);
  const focus = ctx.audience.focus || {};
  // The audience filter only narrows layers it has something to say about
  // (cyclist picks should not empty the beach layer).
  const focusLayers = new Set(items.filter((i) => focusTagsFor(i, focus).length && matchesFocus(i, focus)).map((i) => i.layer));
  const hasFocus = focusLayers.size > 0;
  const synonyms = Object.entries(SEARCH_SYNONYMS[ctx.lang] || {}).map(([k, v]) => [fold(k), fold(v)]);
  // A query word matches its own text or, from 4 letters on, the English word
  // of any synonym it starts (so "kirch" already finds churches).
  const wordAlts = (w) => [w, ...synonyms.filter(([k]) => k === w || (w.length >= 4 && k.startsWith(w))).map(([, v]) => v)];
  const mobile = window.matchMedia(MOBILE);
  const reduced = prefersReducedMotion();

  const $ = (s) => el.querySelector(s);
  const mapEl = $('[data-map]');
  const listEl = $('[data-list]');
  const countEl = $('[data-count]');
  const detailEl = $('[data-detail]');
  const qEl = $('[data-q]');

  let month = ctx.state.month || 0;
  const filter = {
    layers: new Set(LAYERS.map((l) => l.id).filter((id) => !DEFAULT_OFF.includes(id) || (month && MONTH_ON.includes(id)))),
    q: '',
    focus: hasFocus,
    inMonth: month > 0,
  };
  let selectedKey = null;
  let shown = 0;
  let engine = null; // { kind, ... }
  let engineToken = 0;
  let basemap = ctx.state.basemap;

  /* ---------- filtering ---------- */
  const passes = (item, { ignoreLayer = false } = {}) => {
    if (!ignoreLayer && !filter.layers.has(item.layer)) return false;
    if (filter.focus && focusLayers.has(item.layer) && !matchesFocus(item, focus)) return false;
    if (filter.inMonth && month) {
      const s = monthStatus(item, month);
      if (s === 'off' || s === 'offApprox') return false;
    }
    if (filter.q) {
      const hay = fold(`${item.name} ${item.town || ''} ${item.description || ''} ${item.whyGo || ''} ${t(LAYER_BY_ID[item.layer]?.label)}`);
      if (!queryWords().every((alts) => alts.some((w) => hay.includes(w)))) return false;
    }
    return true;
  };
  const queryWords = () => filter.q.split(/\s+/).filter(Boolean).map(wordAlts);
  // Search results: name has the whole query (0), every word (1), else (2); then nearest.
  const relevance = (item) => {
    const name = fold(item.name);
    const words = queryWords();
    if (words.length && name.includes(filter.q)) return 0;
    return words.every((alts) => alts.some((w) => name.includes(w))) ? 1 : 2;
  };
  const visibleItems = () => {
    const vis = items.filter((i) => passes(i));
    if (!filter.q) return vis;
    const rank = new Map(vis.map((i) => [i.key, relevance(i)]));
    return vis.sort((a, b) => rank.get(a.key) - rank.get(b.key) || a.km - b.km);
  };

  /* ---------- toolbar ---------- */
  const layersEl = $('[data-layers]');
  const filtersEl = $('[data-filters]');
  function renderChips() {
    const extra = [];
    if (hasFocus) {
      const label = FOCUS[focus.poiTags?.[0]] || FOCUS.default;
      extra.push(`<button type="button" class="chip ex-toggle" data-toggle="focus" aria-pressed="${filter.focus}">${icon(filter.focus ? 'check' : 'star', { size: 16 })}${esc(t(label))}</button>`);
    }
    if (month) {
      extra.push(`<button type="button" class="chip ex-toggle" data-toggle="inMonth" aria-pressed="${filter.inMonth}">${icon(filter.inMonth ? 'check' : 'calendar', { size: 16 })}${esc(fill(t(L.inMonth), { m: inMonth(month, ctx.lang) }))}</button>`);
    }
    filtersEl.innerHTML = extra.join('');
    filtersEl.hidden = !extra.length;
    layersEl.innerHTML = `${LAYERS.map((l) => {
      const n = items.filter((i) => i.layer === l.id && passes(i, { ignoreLayer: true })).length;
      return `<button type="button" class="chip ex-layer" data-layer="${l.id}" aria-pressed="${filter.layers.has(l.id)}" style="--c:${colors[l.color]}">
        <span class="ex-dot" aria-hidden="true"></span>${esc(t(l.label))}<span class="ex-n">${n}</span></button>`;
    }).join('')}`;
  }
  const areasEl = $('[data-areas]');
  areasEl.insertAdjacentHTML(
    'beforeend',
    pois.areas.map((a) => `<button type="button" class="chip ex-area" data-area="${esc(a.id)}" title="${esc(a.description)}">${esc(t(AREAS[a.id] || { en: a.name }))}</button>`).join(''),
  );

  /* ---------- list ---------- */
  function renderList({ keepShown = false } = {}) {
    const vis = visibleItems();
    const page = mobile.matches ? LIST_PAGE.mobile : LIST_PAGE.desktop;
    if (!keepShown) shown = page;
    // Keep the selected place in view even when it is past the first page.
    const selIndex = vis.findIndex((i) => i.key === selectedKey);
    if (selIndex >= shown) shown = selIndex + 1;
    countEl.textContent = plural(filter.q ? L.countQ : L.count, vis.length, ctx.lang);
    // A search can also match places in switched-off layers (e.g. "bakery").
    const hidden = filter.q ? items.filter((i) => !filter.layers.has(i.layer) && passes(i, { ignoreLayer: true })).length : 0;
    const hiddenBtn = hidden ? `<button type="button" class="btn btn-small btn-primary" data-all-layers>${esc(plural(L.searchHidden, hidden, ctx.lang))}</button>` : '';
    if (!vis.length) {
      listEl.innerHTML = `<li class="ex-empty"><p>${esc(t(L.none))}</p>${hiddenBtn} <button type="button" class="btn btn-small" data-reset>${esc(t(L.clear))}</button></li>`;
      return;
    }
    const rest = vis.length - shown;
    listEl.innerHTML =
      vis.slice(0, shown).map((i) => listItemHtml(i, ctx, colors, month, i.key === selectedKey)).join('') +
      (rest > 0 ? `<li class="ex-more"><button type="button" class="btn btn-small" data-more>${esc(fill(t(L.showMore), { n: Math.min(rest, page * 2) }))}</button></li>` : '') +
      (hiddenBtn ? `<li class="ex-more">${hiddenBtn}</li>` : '');
  }
  function markActive() {
    for (const b of listEl.querySelectorAll('.ex-item')) {
      const on = b.dataset.key === selectedKey;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-current', String(on));
    }
  }
  function revealInList(key) {
    const b = listEl.querySelector(`.ex-item[data-key="${CSS.escape(key)}"]`);
    if (!b || mobile.matches) return; // on phones the list is not a scroll box
    const top = b.offsetTop - listEl.offsetTop;
    if (top < listEl.scrollTop || top + b.offsetHeight > listEl.scrollTop + listEl.clientHeight) {
      listEl.scrollTo({ top: top - 12, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  /* ---------- 3D detail card ---------- */
  function showDetail(item) {
    if (!item || engine?.kind !== 'terrain3d') {
      detailEl.hidden = true;
      detailEl.innerHTML = '';
      return;
    }
    detailEl.innerHTML = `<div class="ex-detail-head"><span class="ex-detail-label">${esc(t(L.selected))}</span>
      <button type="button" class="btn btn-ghost btn-small" data-close-detail aria-label="${esc(t(L.closeDetail))}">${icon('close', { size: 18 })}</button></div>
      ${popupHtml(item, ctx, colors, month)}
      ${inTerrain(item) ? '' : `<p class="source-note">${esc(t(L.outside3d))}</p>`}`;
    detailEl.hidden = false;
  }
  const inTerrain = (i) => i.lat > TERRAIN_BBOX.south && i.lat < TERRAIN_BBOX.north && i.lon > TERRAIN_BBOX.west && i.lon < TERRAIN_BBOX.east;

  /* ---------- engines ---------- */
  function leafletEngine() {
    mapEl.innerHTML = '';
    const holder = document.createElement('div');
    holder.className = 'ex-leaflet';
    mapEl.append(holder);
    const small = mobile.matches;
    const m = createMap(holder, { zoom: small ? 12 : 13, basemap, brandName: ctx.brand });
    const { map } = m;
    const group = Leaflet.layerGroup().addTo(map);
    const markers = new Map();
    const markerFor = (item) => {
      if (markers.has(item.key)) return markers.get(item.key);
      const layer = LAYER_BY_ID[item.layer];
      const mk = Leaflet.marker([item.lat, item.lon], {
        icon: pinIcon({ color: colors[layer?.color], label: glyph(item.layer, 16), size: item.layer === 'town' ? 32 : 28 }),
        title: item.name,
        keyboard: false, // 100+ pins would be tab stops before the list; the list is the keyboard way in
        riseOnHover: true,
      });
      // Long descriptions scroll inside the popup instead of overflowing the map.
      mk.bindPopup(() => popupHtml(item, ctx, colors, month), { maxWidth: 320, minWidth: 240, maxHeight: Math.max(240, holder.clientHeight - 110), autoPanPadding: [16, 16], className: 'ex-popup' });
      mk.on('popupopen', (e) => {
        setActive(item.key, { from: 'map' });
        const node = e.popup.getElement();
        node?.querySelector('[data-lightbox]')?.addEventListener('click', (ev) => {
          openLightbox(photoItems.map((p) => ({ src: photo(p.file, 'web'), caption: p.name })), Number(ev.currentTarget.dataset.lightbox));
        });
      });
      mk.on('popupclose', () => {
        if (selectedKey === item.key) setActive(null, { from: 'map' });
      });
      markers.set(item.key, mk);
      return mk;
    };
    const sync = () => {
      const want = new Set(visibleItems().map((i) => i.key));
      for (const [key, mk] of markers) if (!want.has(key) && group.hasLayer(mk)) group.removeLayer(mk);
      for (const key of want) {
        const mk = markerFor(byKey.get(key));
        if (!group.hasLayer(mk)) group.addLayer(mk);
      }
    };
    const highlight = (key) => {
      for (const [k, mk] of markers) mk.getElement()?.classList.toggle('is-active', k === key);
    };
    return {
      kind: 'leaflet',
      sync,
      setBasemap: (name) => m.setBasemap(name),
      select(item) {
        const mk = markerFor(item);
        if (!group.hasLayer(mk)) group.addLayer(mk);
        const target = [item.lat, item.lon];
        const zoom = Math.max(map.getZoom(), item.km > 30 ? 11 : 14);
        const open = () => {
          mk.openPopup();
          highlight(item.key);
        };
        if (reduced) {
          map.setView(target, zoom, { animate: false });
          open();
        } else if (zoom === map.getZoom() && map.getBounds().pad(-0.2).contains(target)) {
          open(); // already in view: the popup pans the map itself if needed
        } else {
          map.once('moveend', open);
          map.flyTo(target, zoom, { duration: 0.9 });
        }
      },
      clear() {
        map.closePopup();
        highlight(null);
      },
      highlight,
      fit(list) {
        if (!list.length) return;
        const b = Leaflet.latLngBounds(list.map((i) => [i.lat, i.lon]));
        map.flyToBounds(b, { padding: [48, 48], maxZoom: 14, animate: !reduced, duration: 0.8 });
      },
      flyTo(lat, lon, zoom) {
        if (reduced) map.setView([lat, lon], zoom, { animate: false });
        else map.flyTo([lat, lon], zoom, { duration: 1 });
      },
      destroy: () => m.destroy(),
    };
  }

  async function terrainEngine(token) {
    mapEl.innerHTML = `<div class="ex-map-loading"><span class="ex-spinner" aria-hidden="true"></span>${esc(t(L.loading3d))}</div>`;
    const holder = document.createElement('div');
    holder.className = 'ex-terrain';
    const toPois = () =>
      visibleItems()
        .filter(inTerrain)
        .map((i) => ({ id: i.key, name: i.name, lat: i.lat, lon: i.lon, category: i.layer, color: colors[LAYER_BY_ID[i.layer]?.color], important: i.layer === 'town' }));
    let terrain;
    try {
      const { createTerrain } = await import('../maps/terrain3d.js');
      if (token !== engineToken) return null;
      mapEl.innerHTML = '';
      mapEl.append(holder);
      terrain = await createTerrain(holder, {
        pois: toPois(),
        selected: selectedKey,
        onSelect: (id) => setActive(id === 'house' ? null : id, { from: 'map' }),
      });
    } catch (err) {
      if (token !== engineToken) return null;
      console.warn('[explore] 3D terrain unavailable', err);
      if (!holder.isConnected) {
        mapEl.innerHTML = '';
        mapEl.append(holder);
      }
      holder.insertAdjacentHTML('beforeend', `<div class="ex-back2d"><button type="button" class="btn btn-primary" data-engine="leaflet">${esc(t(L.back2d))}</button></div>`);
      return { kind: 'terrain3d', sync() {}, select() {}, clear() {}, highlight() {}, flyTo() {}, destroy: () => holder.remove() };
    }
    return {
      kind: 'terrain3d',
      sync: () => terrain.setPois(toPois()),
      select(item) {
        terrain.setSelected(inTerrain(item) ? item.key : null);
        if (inTerrain(item)) terrain.focus(item.key);
      },
      clear: () => terrain.setSelected(null),
      highlight: (key) => terrain.setSelected(key),
      flyTo: (lat, lon, zoom) => terrain.focus([lat, lon], { zoom }),
      destroy: () => terrain.dispose(),
    };
  }

  async function setEngine(kind) {
    const token = ++engineToken;
    engine?.destroy();
    engine = null;
    for (const b of el.querySelectorAll('.ex-seg [data-engine]')) b.setAttribute('aria-pressed', String(b.dataset.engine === kind));
    const bm = $('.ex-basemap');
    if (bm) bm.hidden = kind === 'terrain3d';
    const next = kind === 'terrain3d' ? await terrainEngine(token) : leafletEngine();
    if (token !== engineToken) {
      next?.destroy();
      return;
    }
    engine = next;
    engine.sync();
    const item = byKey.get(selectedKey);
    if (item) {
      if (kind === 'terrain3d') {
        engine.highlight(selectedKey);
        showDetail(item);
      } else {
        showDetail(null);
        engine.select(item);
      }
    } else showDetail(null);
  }

  /* ---------- selection ---------- */
  function setActive(key, { from } = {}) {
    selectedKey = key && byKey.has(key) ? key : null;
    markActive();
    const item = byKey.get(selectedKey);
    if (from === 'map') {
      if (item) revealInList(item.key);
      if (engine?.kind === 'terrain3d') showDetail(item);
      else engine?.highlight(selectedKey);
    }
  }
  function selectItem(item, { scroll = false, refocus = false } = {}) {
    // Make sure the place is visible with the current filters.
    if (!passes(item)) {
      filter.layers.add(item.layer);
      if (!passes(item)) {
        filter.q = '';
        qEl.value = '';
      }
      if (!passes(item)) filter.focus = false;
      if (!passes(item)) filter.inMonth = false;
      refresh();
    }
    selectedKey = item.key;
    renderList({ keepShown: true });
    // The list was rebuilt: give keyboard focus back to the pressed row.
    if (refocus) listEl.querySelector(`.ex-item[data-key="${CSS.escape(item.key)}"]`)?.focus({ preventScroll: true });
    revealInList(item.key);
    if (scroll || mobile.matches) {
      const r = mapEl.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight) mapEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    engine?.select(item);
    if (engine?.kind === 'terrain3d') showDetail(item);
  }

  function refresh() {
    renderChips();
    renderList();
    engine?.sync();
    if (selectedKey && !visibleItems().some((i) => i.key === selectedKey)) {
      selectedKey = null;
      engine?.clear();
      showDetail(null);
    }
  }

  function focusPayload({ lat, lon, zoom, id } = {}) {
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    // Ids can repeat across datasets (an activity and a POI): prefer the one at the sent position.
    const found = id ? [id, `b:${id}`, `a:${id}`].map((k) => byKey.get(k)).filter(Boolean) : [];
    const near = (i) => Number.isFinite(lat) && Math.abs(i.lat - lat) < 1e-4 && Math.abs(i.lon - lon) < 1e-4;
    const item = found.find(near) || found[0];
    if (item) selectItem(item);
    else if (Number.isFinite(lat) && Number.isFinite(lon)) engine?.flyTo(lat, lon, zoom || 14);
  }

  /* ---------- events ---------- */
  const onClick = (e) => {
    const layerBtn = e.target.closest('[data-layer]');
    if (layerBtn) {
      const id = layerBtn.dataset.layer;
      if (filter.layers.has(id)) filter.layers.delete(id);
      else filter.layers.add(id);
      refresh();
      el.querySelector(`[data-layer="${id}"]`)?.focus();
      return;
    }
    const toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      const k = toggle.dataset.toggle;
      filter[k] = !filter[k];
      refresh();
      el.querySelector(`[data-toggle="${k}"]`)?.focus();
      return;
    }
    const area = e.target.closest('[data-area]');
    if (area) {
      const a = pois.areas.find((x) => x.id === area.dataset.area);
      if (a) engine?.flyTo(a.lat, a.lon, mobile.matches ? a.zoom - 1 : a.zoom);
      return;
    }
    const eng = e.target.closest('[data-engine]');
    if (eng) {
      ctx.setState({ mapEngine: eng.dataset.engine });
      return;
    }
    const item = e.target.closest('.ex-item, .ex-ess-go');
    if (item) {
      const fromList = item.classList.contains('ex-item');
      selectItem(byKey.get(item.dataset.key), { scroll: !fromList, refocus: fromList });
      return;
    }
    if (e.target.closest('[data-all-layers]')) {
      filter.layers = new Set(LAYERS.map((l) => l.id));
      refresh();
      listEl.querySelector('.ex-item')?.focus();
      if (filter.q) engine?.fit?.(visibleItems());
      return;
    }
    if (e.target.closest('[data-more]')) {
      const before = shown;
      shown += (mobile.matches ? LIST_PAGE.mobile : LIST_PAGE.desktop) * 2;
      renderList({ keepShown: true });
      listEl.querySelectorAll('.ex-item')[before]?.focus();
      return;
    }
    if (e.target.closest('[data-reset]')) {
      filter.layers = new Set(LAYERS.map((l) => l.id));
      filter.q = '';
      qEl.value = '';
      filter.focus = false;
      filter.inMonth = false;
      refresh();
      return;
    }
    if (e.target.closest('[data-close-detail]')) {
      setActive(null);
      engine?.clear();
      showDetail(null);
      return;
    }
    const lb = e.target.closest('[data-lightbox]');
    if (lb) {
      openLightbox(photoItems.map((p) => ({ src: photo(p.file, 'web'), caption: p.name })), Number(lb.dataset.lightbox));
      return;
    }
    if (e.target.closest('[data-ask-open]')) {
      bus.emit('inquiry:prefill', { month: month || undefined, message: fill(t(L.askOpenMsg), { m: inMonth(month, ctx.lang) }) });
    }
  };
  const onBasemap = (e) => ctx.setState({ basemap: e.target.value });
  let qTimer;
  const onInput = () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      filter.q = fold(qEl.value.trim());
      refresh();
      // Bring the matches into view (2D only; the terrain keeps its camera).
      if (filter.q) engine?.fit?.(visibleItems());
    }, 120);
  };
  el.addEventListener('click', onClick);
  qEl.addEventListener('input', onInput);
  $('[data-ex-basemap]')?.addEventListener('change', onBasemap);
  const offFocus = bus.on('map:focus', (p) => focusPayload(p));

  /* ---------- first paint ---------- */
  $('[data-ess]').innerHTML = essentialsHtml(items, ctx, month);
  refresh();
  await setEngine(ctx.state.mapEngine === 'terrain3d' ? 'terrain3d' : 'leaflet');

  const controller = {
    setBasemap(name) {
      basemap = name;
      const sel = $('[data-ex-basemap]');
      if (sel) sel.value = name;
      if (engine?.kind === 'leaflet') engine.setBasemap(name);
    },
    setEngine(kind) {
      if (kind !== engine?.kind) setEngine(kind);
    },
    setMonth(m) {
      const had = month;
      month = m || 0;
      filter.inMonth = month > 0;
      if (month && !had) MONTH_ON.forEach((id) => filter.layers.add(id));
      $('[data-ess]').innerHTML = essentialsHtml(items, ctx, month);
      refresh();
      const item = byKey.get(selectedKey);
      if (engine?.kind === 'terrain3d') showDetail(item);
    },
  };
  controllers.set(el, controller);
  live = controller;
  // State may have changed while this lazy mount was loading (update() is a no-op until now).
  const now = getState();
  if (now.basemap !== basemap) controller.setBasemap(now.basemap);
  if ((now.month || 0) !== month) controller.setMonth(now.month);
  controller.setEngine(now.mapEngine === 'terrain3d' ? 'terrain3d' : 'leaflet');
  if (pendingFocus) {
    const p = pendingFocus;
    pendingFocus = null;
    focusPayload(p);
  }

  return () => {
    clearTimeout(qTimer);
    engineToken++;
    el.removeEventListener('click', onClick);
    offFocus();
    engine?.destroy();
    engine = null;
    controllers.delete(el);
    if (live === controller) live = null;
  };
}

export default {
  id: 'explore',
  nav: { en: 'Explore', de: 'Umgebung', sl: 'Okolica', hr: 'Okolica', it: 'Dintorni' },
  className: 'water',

  render(ctx) {
    const t = ctx.t;
    const copy = copyFor(ctx);
    const engine = ctx.state.mapEngine;
    return `
    <div class="container ex">
      <header class="section-head">
        <span class="eyebrow">${icon('pin', { size: 16 })}${esc(t(L.eyebrow))}</span>
        <h2>${esc(t(copy.title))}</h2>
        <p class="lede">${esc(t(copy.lede))}</p>
      </header>
      <div class="ex-toolbar">
        <div class="ex-row ex-filters" data-filters hidden></div>
        <div class="ex-row ex-layers" role="group" aria-label="${esc(t(L.layers))}" data-layers>
          ${LAYERS.map(() => '<span class="ex-skel ex-skel-chip"></span>').join('')}
        </div>
        <div class="ex-row ex-controls">
          <div class="ex-areas" role="group" aria-label="${esc(t(L.areas))}" data-areas>
            <span class="ex-areas-label" aria-hidden="true">${esc(t(L.areas))}</span>
          </div>
          <div class="ex-view">
            <div class="ex-seg" role="group" aria-label="${esc(t(L.engine))}">
              <button type="button" data-engine="leaflet" aria-pressed="${engine !== 'terrain3d'}">${icon('pin', { size: 18 })}${esc(t(L.map2d))}</button>
              <button type="button" data-engine="terrain3d" aria-pressed="${engine === 'terrain3d'}">${icon('mountain', { size: 18 })}${esc(t(L.map3d))}</button>
            </div>
            <label class="ex-basemap"${engine === 'terrain3d' ? ' hidden' : ''}>
              <span class="visually-hidden">${esc(t(L.basemap))}</span>
              ${icon('layers', { size: 18 })}
              <select data-ex-basemap>
                ${Object.entries(L.basemaps).map(([k, v]) => `<option value="${k}"${ctx.state.basemap === k ? ' selected' : ''}>${esc(t(v))}</option>`).join('')}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div class="ex-main">
        <div class="ex-stage">
          <p class="visually-hidden" id="ex-map-hint">${esc(t(L.mapHint))}</p>
          <div class="map-frame ex-map" data-map role="region" aria-label="${esc(t(L.mapLabel))}" aria-describedby="ex-map-hint">
            <div class="ex-map-loading" data-map-loading><span class="ex-spinner" aria-hidden="true"></span>${esc(fill(t(L.loading), { n: 80 }))}</div>
          </div>
          <div class="ex-detail" data-detail hidden></div>
        </div>
        <div class="ex-panel card">
          <div class="ex-search">
            <label class="visually-hidden" for="ex-q">${esc(t(L.search))}</label>
            <span class="ex-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg></span>
            <input id="ex-q" type="search" placeholder="${esc(t(L.searchPh))}" autocomplete="off" data-q />
          </div>
          <p class="ex-count" aria-live="polite" data-count>&nbsp;</p>
          <ol class="ex-list" aria-label="${esc(t(L.listLabel))}" data-list>
            ${Array.from({ length: 6 }, () => '<li><span class="ex-skel ex-skel-row"></span></li>').join('')}
          </ol>
        </div>
      </div>
      <div class="ex-ess card" data-ess>
        <span class="ex-skel ex-skel-ess"></span>
      </div>
      <p class="source-note ex-note">${esc(t(L.distanceNote))}</p>
    </div>`;
  },

  async mount(el, ctx) {
    try {
      return await mountExplore(el, ctx);
    } catch (err) {
      const mapEl = el.querySelector('[data-map]');
      if (mapEl) {
        mapEl.innerHTML = `<div class="ex-map-loading" role="alert"><p>${esc(ctx.t(L.mountError))}</p><a class="btn btn-primary" href="${GMAPS_HOUSE}" target="_blank" rel="noopener">${icon('pin', { size: 18 })}${esc(ctx.t(L.openGmaps))}</a></div>`;
      }
      for (const s of el.querySelectorAll('.ex-skel')) s.remove();
      throw err;
    }
  },

  update(el, ctx, changed) {
    const c = controllers.get(el);
    if (!c) return;
    if (changed.includes('basemap')) c.setBasemap(ctx.state.basemap);
    if (changed.includes('mapEngine')) c.setEngine(ctx.state.mapEngine === 'terrain3d' ? 'terrain3d' : 'leaflet');
    if (changed.includes('month')) c.setMonth(ctx.state.month);
  },
};
