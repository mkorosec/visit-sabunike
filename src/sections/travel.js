// "Getting here": direct flights to Zadar (route map or arrivals board), the
// last 30 km from the airport, drive times from European cities with toll
// notes, ferries / coaches / other airports, and a "tell us your flight" CTA.
// Data: src/data/travel.json (loaded with a dynamic import, ~90 kB).

import './travel.css';
import { SITE } from '../content/site.js';
import { esc, icon, formatKm, formatMinutes, monthName } from '../lib/util.js';
import { ownerTodo, ownerValue } from './core-shared.js';
import { flightsHtml, mountFlights, sourcesHtml, minRange, WINTER_MONTHS } from './travel-flights.js';
import { monthIn } from './live-weather.js';

// ---------------------------------------------------------------------------
// UI strings (en, de, sl, hr, it)
// ---------------------------------------------------------------------------
// Plural form for a count ("3 avtobusi", "5 avtobusov"); forms keyed by Intl.PluralRules category.
const pl = (lang, n, forms) => forms[new Intl.PluralRules(lang).select(n)] ?? forms.other;

const T = {
  eyebrow: { en: 'Getting here', de: 'Anreise', sl: 'Kako do nas', hr: 'Kako do nas', it: 'Come arrivare' },
  title: {
    en: 'Land in Zadar, unpack in Sabunike within the hour',
    de: 'In Zadar landen, keine Stunde später in Sabunike auspacken',
    sl: 'Pristanite v Zadru in v manj kot uri razpakirajte v Sabunikah',
    hr: 'Sletite u Zadar i za manje od sata raspakirajte se u Sabunikama',
    it: 'Atterrate a Zadar e in meno di un’ora disfate le valigie a Sabunike',
  },
  lede: {
    en: (n, c) => `Zadar Airport’s summer 2026 timetable lists direct flights from ${n} airports in ${c} countries. If you drive, it’s motorway almost to the door. Below is everything you need to plan the trip, with sources.`,
    de: (n, c) => `Der Sommerflugplan 2026 des Flughafens Zadar enthält Direktflüge von ${n} Flughäfen in ${c} Ländern. Mit dem Auto geht es fast bis vor die Tür über die Autobahn. Hier steht alles, was Sie für die Planung brauchen, mit Quellen.`,
    sl: (n, c) => `Poletni vozni red 2026 letališča Zadar navaja neposredne lete z ${n} ${pl('sl', n, { one: 'letališča', other: 'letališč' })} v ${c} ${pl('sl', c, { one: 'državi', other: 'državah' })}. Z avtom se po avtocesti pripeljete skoraj do vrat. Spodaj je vse, kar potrebujete za načrtovanje poti, z viri.`,
    hr: (n, c) => `Ljetni red letenja 2026. Zračne luke Zadar navodi izravne letove iz ${n} ${pl('hr', n, { one: 'zračne luke', few: 'zračne luke', other: 'zračnih luka' })} u ${c} ${pl('hr', c, { one: 'zemlji', few: 'zemlje', other: 'zemalja' })}. Automobilom vozite autocestom gotovo do vrata. U nastavku je sve što vam treba za planiranje puta, s izvorima.`,
    it: (n, c) => `L’orario estivo 2026 dell’aeroporto di Zadar elenca voli diretti da ${n} aeroporti in ${c} paesi. In auto si arriva in autostrada quasi fino alla porta. Qui sotto trovate tutto ciò che serve per organizzare il viaggio, con le fonti.`,
  },
  // Before travel.json has loaded (no numbers yet).
  ledeLoading: {
    en: 'Direct flights from all over Europe in summer, and motorway almost to the door if you drive. Below is everything you need to plan the trip, with sources.',
    de: 'Im Sommer Direktflüge aus ganz Europa, und mit dem Auto fast bis vor die Tür Autobahn. Hier steht alles, was Sie für die Planung brauchen, mit Quellen.',
    sl: 'Poleti neposredni leti iz vse Evrope, z avtom pa avtocesta skoraj do vrat. Spodaj je vse, kar potrebujete za načrtovanje poti, z viri.',
    hr: 'Ljeti izravni letovi iz cijele Europe, a automobilom autocesta gotovo do vrata. U nastavku je sve što vam treba za planiranje puta, s izvorima.',
    it: 'D’estate voli diretti da tutta Europa e, in auto, autostrada quasi fino alla porta. Qui sotto trovate tutto ciò che serve per organizzare il viaggio, con le fonti.',
  },
  loading: { en: 'Loading flights and routes…', de: 'Flüge und Strecken werden geladen…', sl: 'Nalagamo lete in poti…', hr: 'Učitavamo letove i rute…', it: 'Caricamento di voli e percorsi…' },
  mountError: {
    en: 'This section could not load. Zadar Airport (ZAD) is about 30 km and 35–40 minutes by car from the house. Ask us and we’ll help you plan your arrival.',
    de: 'Dieser Abschnitt konnte nicht geladen werden. Der Flughafen Zadar (ZAD) liegt ca. 30 km bzw. 35–40 Autominuten vom Haus entfernt. Fragen Sie uns, wir helfen bei der Anreise.',
    sl: 'Tega razdelka ni bilo mogoče naložiti. Letališče Zadar (ZAD) je od hiše oddaljeno približno 30 km oziroma 35–40 minut vožnje. Pišite nam in pomagali vam bomo načrtovati prihod.',
    hr: 'Ovaj odjeljak nije se mogao učitati. Zračna luka Zadar (ZAD) udaljena je od kuće oko 30 km, odnosno 35–40 minuta vožnje. Javite nam se i pomoći ćemo vam isplanirati dolazak.',
    it: 'Non è stato possibile caricare questa sezione. L’aeroporto di Zadar (ZAD) dista dalla casa circa 30 km, cioè 35–40 minuti in auto. Scriveteci e vi aiuteremo a organizzare l’arrivo.',
  },

  // At a glance
  gAirport: { en: 'Zadar Airport (ZAD)', de: 'Flughafen Zadar (ZAD)', sl: 'Letališče Zadar (ZAD)', hr: 'Zračna luka Zadar (ZAD)', it: 'Aeroporto di Zadar (ZAD)' },
  gAirportSub: {
    en: (min) => `about ${min} min by car`,
    de: (min) => `ca. ${min} Min. mit dem Auto`,
    sl: (min) => `približno ${min} min z avtom`,
    hr: (min) => `oko ${min} min automobilom`,
    it: (min) => `circa ${min} min in auto`,
  },
  gRoutes: {
    en: 'direct routes in summer',
    de: 'Direktverbindungen im Sommer',
    sl: (n) => `${pl('sl', n, { one: 'neposredna linija', two: 'neposredni liniji', few: 'neposredne linije', other: 'neposrednih linij' })} poleti`,
    hr: (n) => `${pl('hr', n, { one: 'izravna linija', few: 'izravne linije', other: 'izravnih linija' })} ljeti`,
    it: (n) => `${pl('it', n, { one: 'collegamento diretto', other: 'collegamenti diretti' })} in estate`,
  },
  gRoutesSub: {
    en: (n) => `from ${n} countries`,
    de: (n) => `aus ${n} Ländern`,
    sl: (n) => `iz ${n} ${pl('sl', n, { one: 'države', other: 'držav' })}`,
    hr: (n) => `iz ${n} ${pl('hr', n, { one: 'zemlje', few: 'zemlje', other: 'zemalja' })}`,
    it: (n) => `da ${n} paesi`,
  },
  gDrive: { en: (c) => `by car from ${c}`, de: (c) => `mit dem Auto ab ${c}`, sl: (c) => `z avtom iz mesta ${c}`, hr: (c) => `automobilom iz grada ${c}`, it: (c) => `in auto da ${c}` },
  gDriveSub: {
    en: (km) => `${km}, motorway nearly all the way`,
    de: (km) => `${km}, fast durchgehend Autobahn`,
    sl: (km) => `${km}, skoraj vse po avtocesti`,
    hr: (km) => `${km}, gotovo cijelim putem autocestom`,
    it: (km) => `${km}, quasi tutta autostrada`,
  },
  gFerry: { en: 'fast ferry from Ancona', de: 'Schnellfähre ab Ancona', sl: 'hitri katamaran iz Ancone', hr: 'brzi katamaran iz Ancone', it: 'catamarano veloce da Ancona' },
  gFerrySub: { en: 'summer only, foot passengers', de: 'nur im Sommer, ohne Auto', sl: 'samo poleti, brez avtomobilov', hr: 'samo ljeti, bez automobila', it: 'solo d’estate, senza auto' },

  // Airport -> house
  arrTitle: { en: 'From the airport to the door', de: 'Vom Flughafen bis vor die Tür', sl: 'Od letališča do vrat', hr: 'Od zračne luke do vrata', it: 'Dall’aeroporto alla porta di casa' },
  arrLede: {
    en: (km, min) => `About ${km} and ${min} minutes by car. You skip Zadar’s Old Town completely: ring road, then the Nin road.`,
    de: (km, min) => `Ca. ${km} und ${min} Minuten mit dem Auto. Die Altstadt von Zadar umfahren Sie komplett: Umgehungsstraße, dann die Straße nach Nin.`,
    sl: (km, min) => `Približno ${km} in ${min} minut z avtom. Staro mestno jedro Zadra povsem obidete: najprej obvoznica, nato cesta proti Ninu.`,
    hr: (km, min) => `Oko ${km} i ${min} minuta automobilom. Zadarski stari grad potpuno zaobilazite: obilaznica, pa cesta prema Ninu.`,
    it: (km, min) => `Circa ${km} e ${min} minuti in auto. Il centro storico di Zadar lo evitate del tutto: tangenziale, poi la strada per Nin.`,
  },
  s1: { en: 'Land at Zadar Airport', de: 'Landung in Zadar', sl: 'Pristanek na letališču Zadar', hr: 'Slijetanje u Zračnu luku Zadar', it: 'Atterraggio all’aeroporto di Zadar' },
  s1Text: {
    en: 'A small, easy airport in Zemunik Donji. The taxi rank is directly opposite the arrivals exit, and the car rental desks are in or next to the terminal.',
    de: 'Ein kleiner, übersichtlicher Flughafen in Zemunik Donji. Der Taxistand liegt direkt gegenüber dem Ausgang der Ankunftshalle, die Mietwagenschalter im oder neben dem Terminal.',
    sl: 'Majhno, pregledno letališče v kraju Zemunik Donji. Postajališče taksijev je tik nasproti izhoda iz prihodne dvorane, pulti za najem avtomobilov pa so v terminalu ali tik ob njem.',
    hr: 'Mala, pregledna zračna luka u Zemuniku Donjem. Taksi stajalište nalazi se točno nasuprot izlaza iz dolazne dvorane, a šalteri za najam automobila su u terminalu ili odmah uz njega.',
    it: 'Un aeroporto piccolo e comodo a Zemunik Donji. Il posteggio dei taxi è proprio di fronte all’uscita degli arrivi e i banchi del noleggio auto sono nel terminal o lì accanto.',
  },
  s2: { en: 'Choose your ride', de: 'Weiter nach Sabunike', sl: 'Izberite prevoz', hr: 'Odaberite prijevoz', it: 'Scegliete come proseguire' },
  s3: { en: (km) => `Drive about ${km}`, de: (km) => `Ca. ${km} fahren`, sl: (km) => `Približno ${km} vožnje`, hr: (km) => `Oko ${km} vožnje`, it: (km) => `Circa ${km} in auto` },
  s3Text: {
    en: (min) => `About ${min} minutes in free-flowing traffic. Allow extra time on summer Saturdays, when most holiday rentals change guests.`,
    de: (min) => `Ca. ${min} Minuten bei freier Fahrt. An Sommersamstagen, wenn die meisten Ferienwohnungen die Gäste wechseln, sollten Sie mehr Zeit einplanen.`,
    sl: (min) => `Približno ${min} minut, ko promet teče brez zastojev. Ob poletnih sobotah, ko se v večini počitniških nastanitev menjajo gostje, računajte na več časa.`,
    hr: (min) => `Oko ${min} minuta kad promet teče bez zastoja. Ljeti subotom, kad se u većini apartmana mijenjaju gosti, računajte na više vremena.`,
    it: (min) => `Circa ${min} minuti a traffico scorrevole. Il sabato d’estate, quando nella maggior parte degli alloggi turistici cambiano gli ospiti, calcolate un po’ di tempo in più.`,
  },
  s4: { en: 'Park in our driveway', de: 'Parken in unserer Einfahrt', sl: 'Parkirajte na našem dvorišču', hr: 'Parkirajte u našem dvorištu', it: 'Parcheggiate nel nostro vialetto' },
  s4Text: {
    en: (ci) => `Private parking on the gated driveway, under the vine pergola. Check-in from ${ci}.`,
    de: (ci) => `Privatparkplatz in der Einfahrt mit Tor, unter der Weinlaube. Check-in ab ${ci} Uhr.`,
    sl: (ci) => `Zasebno parkirišče na dvorišču z vrati, pod brajdo. Prijava od ${ci}.`,
    hr: (ci) => `Privatno parkiralište u dvorištu s vratima, ispod odrine. Prijava od ${ci}.`,
    it: (ci) => `Parcheggio privato nel vialetto con cancello, sotto il pergolato di vite. Check-in dalle ${ci}.`,
  },
  s4TextNoCi: {
    en: 'Private parking on the gated driveway, under the vine pergola. Tell us your arrival time and we’ll be there.',
    de: 'Privatparkplatz in der Einfahrt mit Tor, unter der Weinlaube. Sagen Sie uns Ihre Ankunftszeit, wir sind dann da.',
    sl: 'Zasebno parkirišče na dvorišču z vrati, pod brajdo. Sporočite nam, kdaj prispete, in pričakali vas bomo.',
    hr: 'Privatno parkiralište u dvorištu s vratima, ispod odrine. Javite nam vrijeme dolaska i dočekat ćemo vas.',
    it: 'Parcheggio privato nel vialetto con cancello, sotto il pergolato di vite. Diteci a che ora arrivate e saremo lì ad accogliervi.',
  },
  oCar: { en: 'Rental car', de: 'Mietwagen', sl: 'Najem avtomobila', hr: 'Najam automobila', it: 'Auto a noleggio' },
  oCarSum: {
    en: (n) => `${n} rental brands at the airport`,
    de: (n) => `${n} Vermieter am Flughafen`,
    sl: (n) => `${n} ${pl('sl', n, { one: 'ponudnik', two: 'ponudnika', few: 'ponudniki', other: 'ponudnikov' })} na letališču`,
    hr: (n) => `${n} ${pl('hr', n, { one: 'tvrtka', few: 'tvrtke', other: 'tvrtki' })} za najam u zračnoj luci`,
    it: (n) => `${n} ${pl('it', n, { one: 'autonoleggio', other: 'autonoleggi' })} in aeroporto`,
  },
  oCarText: {
    en: 'Worth having here for Nin, Pag, Zadar and Paklenica. Desks at the terminal:',
    de: 'Lohnt sich hier für Nin, Pag, Zadar und Paklenica. Schalter am Terminal:',
    sl: 'Tukaj se avto splača za izlete v Nin, na Pag, v Zadar in Paklenico. Pulti v terminalu:',
    hr: 'Ovdje se auto isplati za Nin, Pag, Zadar i Paklenicu. Šalteri u terminalu:',
    it: 'Qui conviene averla per Nin, Pag, Zadar e Paklenica. Banchi nel terminal:',
  },
  oTaxi: { en: 'Taxi or pre-booked transfer', de: 'Taxi oder vorab gebuchter Transfer', sl: 'Taksi ali vnaprej rezerviran prevoz', hr: 'Taksi ili unaprijed rezerviran transfer', it: 'Taxi o transfer prenotato' },
  oTaxiFixed: {
    en: (car, van) => `Fixed price to Privlaka/Sabunike: about ${car} for a car or ${van} for a van, per vehicle, not per person.`,
    de: (car, van) => `Festpreis nach Privlaka/Sabunike: ca. ${car} pro Pkw oder ${van} pro Kleinbus, pro Fahrzeug, nicht pro Person.`,
    sl: (car, van) => `Fiksna cena do Privlake/Sabunik: približno ${car} za osebni avto ali ${van} za kombi, na vozilo, ne na osebo.`,
    hr: (car, van) => `Fiksna cijena do Privlake/Sabunika: oko ${car} za osobni automobil ili ${van} za kombi, po vozilu, ne po osobi.`,
    it: (car, van) => `Prezzo fisso per Privlaka/Sabunike: circa ${car} per un’auto o ${van} per un minivan, a veicolo, non a persona.`,
  },
  oTaxiSum: {
    en: (car) => `fixed price about ${car} per car`,
    de: (car) => `Festpreis ca. ${car} pro Pkw`,
    sl: (car) => `fiksna cena približno ${car} na avto`,
    hr: (car) => `fiksna cijena oko ${car} po automobilu`,
    it: (car) => `prezzo fisso circa ${car} ad auto`,
  },
  oTaxiNight: { en: '+20 % between midnight and 06:00.', de: '+20 % zwischen Mitternacht und 6 Uhr.', sl: '+20 % med polnočjo in 6.00.', hr: '+20 % od ponoći do 6 sati.', it: '+20 % tra mezzanotte e le 6:00.' },
  oTaxiAgg: {
    en: (a, b) => `Online transfer sites quote about ${a} for a sedan or ${b} for an 8-seat minivan.`,
    de: (a, b) => `Online-Transferportale nennen ca. ${a} für eine Limousine oder ${b} für einen 8-Sitzer.`,
    sl: (a, b) => `Spletni posredniki prevozov navajajo približno ${a} za limuzino ali ${b} za kombi z 8 sedeži.`,
    hr: (a, b) => `Online posrednici za transfere navode oko ${a} za limuzinu ili ${b} za kombi s 8 sjedala.`,
    it: (a, b) => `I siti di transfer online indicano circa ${a} per una berlina o ${b} per un minivan da 8 posti.`,
  },
  oRide: { en: 'Uber / Bolt', de: 'Uber / Bolt', sl: 'Uber / Bolt', hr: 'Uber / Bolt', it: 'Uber / Bolt' },
  oRideSum: { en: 'price shown in the app', de: 'Preis in der App', sl: 'cena v aplikaciji', hr: 'cijena u aplikaciji', it: 'prezzo nell’app' },
  oRideText: {
    en: 'Uber picks up at ZAD, and Bolt is also reported in Zadar. Check the app’s price for Sabunike.',
    de: 'Uber holt am Flughafen ab, Bolt soll es in Zadar ebenfalls geben. Den Preis nach Sabunike zeigt die App.',
    sl: 'Uber pobira potnike na letališču ZAD, v Zadru naj bi vozil tudi Bolt. Ceno do Sabunik preverite v aplikaciji.',
    hr: 'Uber preuzima putnike u zračnoj luci ZAD, a u Zadru navodno vozi i Bolt. Cijenu do Sabunika provjerite u aplikaciji.',
    it: 'Uber effettua il ritiro allo ZAD e a Zadar risulta attivo anche Bolt. Controllate nell’app il prezzo per Sabunike.',
  },
  oBus: { en: 'Bus (budget)', de: 'Bus (günstig)', sl: 'Avtobus (najceneje)', hr: 'Autobus (najjeftinije)', it: 'Autobus (economico)' },
  oBusSum: {
    en: (total) => `about ${total} per person`,
    de: (total) => `ca. ${total} pro Person`,
    sl: (total) => `približno ${total} na osebo`,
    hr: (total) => `oko ${total} po osobi`,
    it: (total) => `circa ${total} a persona`,
  },
  oBusText: {
    en: (shuttle, min, bus, total) => `Airport shuttle to Zadar bus station (${shuttle}, about ${min} min), then the Liburnija suburban bus to Privlaka (${bus}). About ${total} per person.`,
    de: (shuttle, min, bus, total) => `Flughafen-Shuttle zum Busbahnhof Zadar (${shuttle}, ca. ${min} Min.), dann der Liburnija-Vorortbus nach Privlaka (${bus}). Zusammen ca. ${total} pro Person.`,
    sl: (shuttle, min, bus, total) => `Letališki avtobus do avtobusne postaje Zadar (${shuttle}, približno ${min} min), nato primestni avtobus Liburnija do Privlake (${bus}). Skupaj približno ${total} na osebo.`,
    hr: (shuttle, min, bus, total) => `Shuttle iz zračne luke do Autobusnog kolodvora Zadar (${shuttle}, oko ${min} min), zatim prigradski autobus Liburnije do Privlake (${bus}). Ukupno oko ${total} po osobi.`,
    it: (shuttle, min, bus, total) => `Navetta dall’aeroporto alla stazione degli autobus di Zadar (${shuttle}, circa ${min} min), poi l’autobus suburbano Liburnija fino a Privlaka (${bus}). In tutto circa ${total} a persona.`,
  },
  oBusWhen: {
    en: (wd, we) => `About ${wd} buses to Privlaka on weekdays but only ${we} on Saturdays, Sundays and holidays (winter 2025/26 timetable; we couldn’t find a newer one, so ask us).`,
    de: (wd, we) => `Ca. ${wd} Busse nach Privlaka an Werktagen, aber nur ${we} an Samstagen, Sonn- und Feiertagen (Winterfahrplan 2025/26; einen neueren haben wir nicht gefunden, fragen Sie uns).`,
    sl: (wd, we) => `Ob delavnikih vozi do Privlake približno ${wd} ${pl('sl', wd, { one: 'avtobus', two: 'avtobusa', few: 'avtobusi', other: 'avtobusov' })}, ob sobotah, nedeljah in praznikih pa le ${we} (zimski vozni red 2025/26; novejšega nismo našli, zato nas vprašajte).`,
    hr: (wd, we) => `Radnim danom do Privlake vozi oko ${wd} ${pl('hr', wd, { one: 'autobus', few: 'autobusa', other: 'autobusa' })}, a subotom, nedjeljom i praznikom samo ${we} (zimski vozni red 2025./26.; noviji nismo pronašli, pa nas pitajte).`,
    it: (wd, we) => `Nei giorni feriali circa ${wd} ${pl('it', wd, { one: 'corsa', other: 'corse' })} per Privlaka, ma solo ${we} il sabato, la domenica e nei festivi (orario invernale 2025/26; non ne abbiamo trovato uno più recente, quindi chiedeteci).`,
  },
  oBusSabunike: {
    en: (t) => `One weekday run from Zadar (${t}) is signed for Sabunike.`,
    de: (t) => `Eine Fahrt an Werktagen ab Zadar (${t} Uhr) ist bis Sabunike ausgeschildert.`,
    sl: (t) => `Ena delavniška vožnja iz Zadra (ob ${t}) ima kot cilj označene Sabunike.`,
    hr: (t) => `Jedan polazak radnim danom iz Zadra (u ${t}) vozi do Sabunika.`,
    it: (t) => `Una corsa feriale da Zadar (alle ${t}) ha come destinazione Sabunike.`,
  },
  oBusStop: {
    en: 'Ask us which stop is closest to the house.',
    de: 'Fragen Sie uns, welche Haltestelle dem Haus am nächsten liegt.',
    sl: 'Vprašajte nas, katero postajališče je najbližje hiši.',
    hr: 'Pitajte nas koje je stajalište najbliže kući.',
    it: 'Chiedeteci qual è la fermata più vicina alla casa.',
  },
  oPickup: { en: 'A pickup by us?', de: 'Abholung durch uns?', sl: 'Vas pridemo iskat?', hr: 'Da vas mi dočekamo?', it: 'Vi veniamo a prendere noi?' },
  oPickupText: {
    en: 'Arriving late, with a lot of luggage or with small children? Ask us about a pickup from the airport.',
    de: 'Späte Ankunft, viel Gepäck oder kleine Kinder? Fragen Sie uns nach einer Abholung vom Flughafen.',
    sl: 'Prispete pozno, z veliko prtljage ali z majhnimi otroki? Vprašajte nas za prevoz z letališča.',
    hr: 'Stižete kasno, s puno prtljage ili s malom djecom? Pitajte nas za prijevoz iz zračne luke.',
    it: 'Arrivate tardi, con molti bagagli o con bambini piccoli? Chiedeteci se possiamo venirvi a prendere in aeroporto.',
  },
  oPickupBtn: { en: 'Ask about a pickup', de: 'Nach Abholung fragen', sl: 'Vprašajte za prevoz', hr: 'Pitajte za prijevoz', it: 'Chiedeteci un passaggio' },
  prefillPickup: {
    en: 'We would like to ask about a pickup from Zadar Airport. Our flight lands at: ',
    de: 'Wir würden gern nach einer Abholung vom Flughafen Zadar fragen. Unser Flug landet um: ',
    sl: 'Zanima nas prevoz z letališča Zadar. Naše letalo pristane ob: ',
    hr: 'Zanima nas prijevoz iz zračne luke Zadar. Naš let slijeće u: ',
    it: 'Vorremmo chiedere un passaggio dall’aeroporto di Zadar. Il nostro volo atterra alle: ',
  },
  pricesNote: {
    en: 'Prices are what the providers published at the time of research; confirm with them when you book.',
    de: 'Preise wie von den Anbietern zum Zeitpunkt der Recherche veröffentlicht; bitte bei der Buchung bestätigen lassen.',
    sl: 'Cene so takšne, kot so jih ponudniki objavili v času naše raziskave; ob rezervaciji jih preverite pri ponudniku.',
    hr: 'Cijene su one koje su pružatelji usluga objavili u vrijeme našeg istraživanja; provjerite ih pri rezervaciji.',
    it: 'I prezzi sono quelli pubblicati dai fornitori al momento della nostra ricerca; verificateli con loro quando prenotate.',
  },

  // By car
  carTitle: { en: 'Driving down', de: 'Mit dem Auto', sl: 'Z avtom', hr: 'Automobilom', it: 'In auto' },
  carLede: {
    en: 'Driving time to our gate without stops, by fastest route. Plan breaks and border queues on top.',
    de: 'Fahrzeit bis zu unserem Tor ohne Pausen, schnellste Route. Pausen und Wartezeiten an der Grenze kommen dazu.',
    sl: 'Čas vožnje do naših vrat brez postankov, po najhitrejši poti. Postanke in čakanje na meji prištejte.',
    hr: 'Vrijeme vožnje do naših vrata bez zaustavljanja, najbržom rutom. Pauze i čekanje na granici dodajte.',
    it: 'Tempo di guida fino al nostro cancello senza soste, sul percorso più veloce. Pause e code al confine sono da aggiungere.',
  },
  carTeaser: {
    en: (t, c, km, n) => `${t} from ${c} (${km}), drive times from ${n} cities, tolls and the last few kilometres.`,
    de: (t, c, km, n) => `${t} ab ${c} (${km}), Fahrzeiten ab ${n} Städten, Maut und die letzten Kilometer.`,
    sl: (t, c, km, n) => `${t} iz mesta ${c} (${km}), časi vožnje iz ${n} ${pl('sl', n, { one: 'mesta', other: 'mest' })}, cestnine in zadnji kilometri.`,
    hr: (t, c, km, n) => `${t} iz grada ${c} (${km}), vrijeme vožnje iz ${n} ${pl('hr', n, { one: 'grada', few: 'grada', other: 'gradova' })}, cestarine i posljednji kilometri.`,
    it: (t, c, km, n) => `${t} da ${c} (${km}), tempi di guida da ${n} città, pedaggi e gli ultimi chilometri.`,
  },
  carChart: { en: 'Driving time to Sabunike', de: 'Fahrzeit nach Sabunike', sl: 'Čas vožnje do Sabunik', hr: 'Vrijeme vožnje do Sabunika', it: 'Tempo di guida fino a Sabunike' },
  peakWarn: {
    en: (m) => `Travelling in ${m}? On summer Saturdays the Slovenian–Croatian border and the A1 can be much slower than these free-flow times.`,
    de: (m) => `Reise im ${m}? An Sommersamstagen können die slowenisch-kroatische Grenze und die A1 deutlich langsamer sein als diese Zeiten bei freier Fahrt.`,
    sl: (m, n) => `Potujete v ${monthIn(n, 'sl')}? Ob poletnih sobotah je promet na slovensko-hrvaški meji in na A1 lahko precej počasnejši, kot kažejo ti časi brez zastojev.`,
    hr: (m, n) => `Putujete u ${monthIn(n, 'hr')}? Ljeti subotom na slovensko-hrvatskoj granici i na A1 može trebati znatno dulje nego što pokazuju ova vremena bez gužve.`,
    it: (m) => `Viaggiate in ${m}? Il sabato d’estate il confine tra Slovenia e Croazia e la A1 possono essere molto più lenti di questi tempi a traffico scorrevole.`,
  },
  tollsTitle: { en: 'Motorway tolls on the way', de: 'Autobahngebühren unterwegs', sl: 'Cestnine na poti', hr: 'Cestarine na putu', it: 'Pedaggi autostradali lungo il viaggio' },
  tollsShort: { en: 'Tolls', de: 'Maut', sl: 'Cestnine', hr: 'Cestarine', it: 'Pedaggi' },
  vignette: { en: 'vignette', de: 'Vignette', sl: 'vinjeta', hr: 'vinjeta', it: 'vignetta' },
  tollKm: { en: 'toll', de: 'Maut', sl: 'cestnina', hr: 'cestarina', it: 'pedaggio' },
  tollFree: { en: 'free', de: 'frei', sl: 'brezplačno', hr: 'besplatno', it: 'gratis' },
  tollSection: { en: 'tunnel tolls', de: 'Tunnelmaut', sl: 'cestnina za predor', hr: 'cestarina za tunel', it: 'pedaggio galleria' },
  tollNotResearched: { en: 'Prices not researched', de: 'Preise nicht recherchiert', sl: 'Cen nismo preverili', hr: 'Cijene nismo provjerili', it: 'Prezzi non verificati' },
  tollOptional: { en: 'depending on your route', de: 'je nach Route', sl: 'odvisno od poti', hr: 'ovisno o ruti', it: 'a seconda del percorso' },
  tollOr: { en: 'or', de: 'oder', sl: 'ali', hr: 'ili', it: 'o' },
  tollLegend: {
    en: 'Dotted outline: only on some routes.',
    de: 'Gepunkteter Rahmen: nur auf manchen Routen.',
    sl: 'Pikčasta obroba: samo na nekaterih poteh.',
    hr: 'Točkasti obrub: samo na nekim rutama.',
    it: 'Bordo tratteggiato: solo su alcuni percorsi.',
  },
  lastTitle: { en: 'The last few kilometres', de: 'Die letzten Kilometer', sl: 'Zadnji kilometri', hr: 'Posljednji kilometri', it: 'Gli ultimi chilometri' },
  lastText: {
    en: (min) => `Leave the A1 at the Zadar zapad exit (signed Nin / Smilčić) and follow the road to Nin. Nin, the nearest town with shops and restaurants, is about ${min} minutes before you reach us. No narrow old-town lanes, and your car stays in our gated driveway.`,
    de: (min) => `Verlassen Sie die A1 an der Ausfahrt Zadar zapad (Richtung Nin / Smilčić) und folgen Sie der Straße nach Nin. Nin, der nächste Ort mit Geschäften und Restaurants, liegt etwa ${min} Minuten vor uns. Keine engen Altstadtgassen, und Ihr Auto steht in unserer Einfahrt mit Tor.`,
    sl: (min) => `Z A1 zapeljite na izvozu Zadar zapad (smer Nin / Smilčić) in sledite cesti proti Ninu. Nin, najbližji kraj s trgovinami in restavracijami, je približno ${min} minut pred nami. Brez ozkih ulic starega mestnega jedra, avto pa ostane na našem dvorišču z vrati.`,
    hr: (min) => `S A1 siđite na izlazu Zadar zapad (smjer Nin / Smilčić) i pratite cestu prema Ninu. Nin, najbliže mjesto s trgovinama i restoranima, otprilike je ${min} minuta prije nas. Nema uskih uličica starog grada, a auto ostaje u našem dvorištu s vratima.`,
    it: (min) => `Uscite dalla A1 a Zadar zapad (direzione Nin / Smilčić) e seguite la strada per Nin. Nin, il paese più vicino con negozi e ristoranti, si trova circa ${min} minuti prima di noi. Niente vicoli stretti da centro storico, e l’auto resta nel nostro vialetto con cancello.`,
  },
  localTitle: { en: 'From local arrival points', de: 'Von Ankunftspunkten vor Ort', sl: 'Iz krajev prihoda v okolici', hr: 'Od mjesta dolaska u okolici', it: 'Dai punti di arrivo in zona' },
  local: {
    'local-autobusnikolodvorzad': { en: 'Zadar bus station', de: 'Busbahnhof Zadar', sl: 'Avtobusna postaja Zadar', hr: 'Autobusni kolodvor Zadar', it: 'Stazione degli autobus di Zadar' },
    'local-trajektnalukagaenica': { en: 'Gaženica ferry port, Zadar', de: 'Fährhafen Gaženica, Zadar', sl: 'Trajektno pristanišče Gaženica, Zadar', hr: 'Trajektna luka Gaženica, Zadar', it: 'Porto traghetti di Gaženica, Zadar' },
    'local-nincroatia': { en: 'Nin town centre', de: 'Zentrum von Nin', sl: 'Središče Nina', hr: 'Središte Nina', it: 'Centro di Nin' },
  },
  // Toll cards. Numbers mirror travel.json tolls[].description (sources there).
  tolls: {
    'toll-hr-a1': {
      en: (a, b) => `Croatia: the A1 is tolled by distance. A car pays ${a} from Zagreb to Posedarje, or ${b} to Zadar centar. The exact toll to the Zadar zapad exit we use is unconfirmed.`,
      de: (a, b) => `Kroatien: Die A1 ist streckenabhängig mautpflichtig. Ein Pkw zahlt ${a} von Zagreb bis Posedarje bzw. ${b} bis Zadar centar. Die genaue Maut bis zur Ausfahrt Zadar zapad ist nicht bestätigt.`,
      sl: (a, b) => `Hrvaška: cestnina na A1 se plača po prevoženi razdalji. Osebni avto plača ${a} od Zagreba do Posedarja oziroma ${b} do izvoza Zadar centar. Natančna cestnina do izvoza Zadar zapad, ki ga uporabljamo, ni potrjena.`,
      hr: (a, b) => `Hrvatska: cestarina na A1 naplaćuje se prema prijeđenoj udaljenosti. Osobni automobil plaća ${a} od Zagreba do Posedarja, odnosno ${b} do izlaza Zadar centar. Točna cestarina do izlaza Zadar zapad, kojim mi idemo, nije potvrđena.`,
      it: (a, b) => `Croazia: sulla A1 il pedaggio si paga in base alla distanza. Un’auto paga ${a} da Zagabria a Posedarje, oppure ${b} fino a Zadar centar. Il pedaggio esatto fino all’uscita Zadar zapad, quella che usiamo noi, non è confermato.`,
    },
    'toll-si-vignette': {
      en: 'Slovenia: an e-vignette is needed on motorways: €16 for 7 days or €32 for a month (car).',
      de: 'Slowenien: Auf Autobahnen ist eine E-Vignette nötig: 16 € für 7 Tage oder 32 € für einen Monat (Pkw).',
      sl: 'Slovenija: na avtocestah potrebujete e-vinjeto: 16 € za 7 dni ali 32 € za mesec (osebni avto).',
      hr: 'Slovenija: na autocestama je potrebna e-vinjeta: 16 € za 7 dana ili 32 € za mjesec dana (osobni automobil).',
      it: 'Slovenia: in autostrada serve la vignetta elettronica: 16 € per 7 giorni o 32 € per un mese (auto).',
    },
    'toll-at-vignette': {
      en: 'Austria: vignette from €9.60 (1 day) or about €12.80 (10 days) in 2026. The Tauern and Karawanken tunnels charge separately.',
      de: 'Österreich: Vignette ab 9,60 € (1 Tag) bzw. ca. 12,80 € (10 Tage) im Jahr 2026. Tauern- und Karawankentunnel kosten extra.',
      sl: 'Avstrija: vinjeta v letu 2026 od 9,60 € (1 dan) oziroma približno 12,80 € (10 dni). Predora Ture in Karavanke se plačata posebej.',
      hr: 'Austrija: vinjeta u 2026. od 9,60 € (1 dan), odnosno oko 12,80 € (10 dana). Tuneli Tauern i Karavanke naplaćuju se posebno.',
      it: 'Austria: vignetta nel 2026 da 9,60 € (1 giorno) o circa 12,80 € (10 giorni). Le gallerie dei Tauri e delle Caravanche si pagano a parte.',
    },
  },

  // Ferries, coaches, other airports
  moreTitle: {
    en: 'By ferry, coach or another airport',
    de: 'Mit Fähre, Fernbus oder über einen anderen Flughafen',
    sl: 'S trajektom, avtobusom ali prek drugega letališča',
    hr: 'Trajektom, autobusom ili preko druge zračne luke',
    it: 'In traghetto, in pullman o da un altro aeroporto',
  },
  moreTeaser: {
    en: (h, t) => `Fast ferry from Ancona (${h} h), coaches, trains, and other airports from ${t} away.`,
    de: (h, t) => `Schnellfähre ab Ancona (${h} Std.), Fernbusse, Bahn und andere Flughäfen ab ${t} Fahrzeit.`,
    sl: (h, t) => `Hitri katamaran iz Ancone (${h} h), avtobusi, vlaki in druga letališča, oddaljena od ${t} naprej.`,
    hr: (h, t) => `Brzi katamaran iz Ancone (${h} h), autobusi, vlakovi i druge zračne luke udaljene od ${t} nadalje.`,
    it: (h, t) => `Catamarano veloce da Ancona (${h} h), pullman, treni e altri aeroporti a partire da ${t} di distanza.`,
  },
  ferryFast: { en: 'Ancona → Zadar fast catamaran', de: 'Ancona → Zadar Schnellkatamaran', sl: 'Hitri katamaran Ancona → Zadar', hr: 'Brzi katamaran Ancona → Zadar', it: 'Catamarano veloce Ancona → Zadar' },
  ferryFastText: {
    en: (h, min) => `About ${h} hours across the Adriatic with Jadrolinija, foot passengers only (no cars). From Gaženica port it’s a ${min}-minute drive to us.`,
    de: (h, min) => `Ca. ${h} Stunden über die Adria mit Jadrolinija, nur für Passagiere ohne Auto. Vom Hafen Gaženica sind es ${min} Autominuten zu uns.`,
    sl: (h, min) => `Z Jadrolinijo približno ${h} ${pl('sl', h, { one: 'ura', two: 'uri', few: 'ure', other: 'ur' })} čez Jadran, samo za potnike brez avtomobila. Od pristanišča Gaženica do nas je ${min} minut vožnje.`,
    hr: (h, min) => `S Jadrolinijom oko ${h} ${pl('hr', h, { one: 'sat', few: 'sata', other: 'sati' })} preko Jadrana, samo za putnike bez automobila. Od luke Gaženica do nas je ${min} minuta vožnje.`,
    it: (h, min) => `Circa ${h} ore di traversata dell’Adriatico con Jadrolinija, solo passeggeri a piedi (niente auto). Dal porto di Gaženica sono ${min} minuti d’auto fino a noi.`,
  },
  ferryFastWhen: {
    en: (a, b) => `Ran ${a} – ${b} 2026; 2027 dates not announced yet.`,
    de: (a, b) => `Fuhr ${a} – ${b} 2026; Termine für 2027 noch nicht bekannt.`,
    sl: (a, b) => `V letu 2026 je plul ${a} – ${b}; termini za 2027 še niso objavljeni.`,
    hr: (a, b) => `U 2026. plovio je ${a} – ${b}; termini za 2027. još nisu objavljeni.`,
    it: (a, b) => `Nel 2026 ha navigato dal ${a} al ${b}; le date 2027 non sono ancora state annunciate.`,
  },
  ferryCar: { en: 'Ancona → Split car ferry', de: 'Ancona → Split Autofähre', sl: 'Trajekt za avtomobile Ancona → Split', hr: 'Trajekt Ancona → Split (s automobilom)', it: 'Traghetto con auto Ancona → Split' },
  ferryCarText: {
    en: (t) => `Bringing your car from Italy? Overnight sailings with Jadrolinija or SNAV (about 9–11.5 h), then ${t} north on the A1.`,
    de: (t) => `Mit dem eigenen Auto aus Italien? Nachtfähren mit Jadrolinija oder SNAV (ca. 9–11,5 Std.), dann ${t} über die A1 nach Norden.`,
    sl: (t) => `Pripeljete avto iz Italije? Nočne plovbe z Jadrolinijo ali SNAV (približno 9–11,5 h), nato ${t} proti severu po A1.`,
    hr: (t) => `Dolazite automobilom iz Italije? Noćne plovidbe s Jadrolinijom ili SNAV-om (oko 9–11,5 h), zatim ${t} autocestom A1 prema sjeveru.`,
    it: (t) => `Venite in auto dall’Italia? Traversate notturne con Jadrolinija o SNAV (circa 9–11,5 h), poi ${t} verso nord sulla A1.`,
  },
  runsIn: {
    en: (m) => `Ran in ${m} 2026`,
    de: (m) => `Fuhr im ${m} 2026`,
    sl: (m, n) => `V ${monthIn(n, 'sl')} 2026 je plul`,
    hr: (m, n) => `U ${monthIn(n, 'hr')} 2026. je plovio`,
    it: (m) => `In ${m} 2026 era in servizio`,
  },
  notIn: {
    en: (m) => `Not in ${m} (2026 season)`,
    de: (m) => `Nicht im ${m} (Saison 2026)`,
    sl: (m, n) => `V ${monthIn(n, 'sl')} ne pluje (sezona 2026)`,
    hr: (m, n) => `U ${monthIn(n, 'hr')} ne plovi (sezona 2026.)`,
    it: (m) => `Non in servizio in ${m} (stagione 2026)`,
  },
  coach: { en: 'Long-distance coach', de: 'Fernbus', sl: 'Medkrajevni avtobus', hr: 'Međugradski autobus', it: 'Pullman a lunga percorrenza' },
  coachText: {
    en: (km, min) => `FlixBus and other lines reach Zadar bus station from Zagreb, Ljubljana, Vienna, Munich, Prague, Budapest and along the coast. From there we’re ${km} (${min} min) by taxi, or take the Liburnija bus to Privlaka.`,
    de: (km, min) => `FlixBus und andere Linien fahren den Busbahnhof Zadar ab Zagreb, Ljubljana, Wien, München, Prag, Budapest und entlang der Küste an. Von dort sind es ${km} (${min} Min.) mit dem Taxi, oder der Liburnija-Bus nach Privlaka.`,
    sl: (km, min) => `FlixBus in druge linije pripeljejo do avtobusne postaje Zadar iz Zagreba, Ljubljane, Dunaja, Münchna, Prage, Budimpešte in z vse obale. Od tam je do nas ${km} (${min} min) s taksijem, lahko pa vzamete avtobus Liburnija do Privlake.`,
    hr: (km, min) => `FlixBus i druge linije voze do Autobusnog kolodvora Zadar iz Zagreba, Ljubljane, Beča, Münchena, Praga, Budimpešte i duž obale. Odatle smo ${km} (${min} min) taksijem, a možete i autobusom Liburnije do Privlake.`,
    it: (km, min) => `FlixBus e altre linee arrivano alla stazione degli autobus di Zadar da Zagabria, Lubiana, Vienna, Monaco, Praga, Budapest e lungo la costa. Da lì siamo a ${km} (${min} min) in taxi, oppure prendete l’autobus Liburnija per Privlaka.`,
  },
  train: { en: 'Train', de: 'Bahn', sl: 'Vlak', hr: 'Vlak', it: 'Treno' },
  trainText: {
    en: 'No passenger trains run to Zadar. Rail travellers go to Knin and take a bus from there (about 1 h 50 min). A direct coach from Zagreb is usually simpler.',
    de: 'Nach Zadar fahren keine Personenzüge. Bahnreisende fahren bis Knin und von dort mit dem Bus weiter (ca. 1 Std. 50 Min.). Ein Direktbus ab Zagreb ist meist einfacher.',
    sl: 'Do Zadra potniški vlaki ne vozijo. Z vlakom se pripeljete do Knina in naprej nadaljujete z avtobusom (približno 1 h 50 min). Neposredni avtobus iz Zagreba je običajno preprostejši.',
    hr: 'Do Zadra ne voze putnički vlakovi. Vlakom se dolazi do Knina, a odande autobusom (oko 1 h 50 min). Izravni autobus iz Zagreba obično je jednostavniji.',
    it: 'A Zadar non arrivano treni passeggeri. Chi viaggia in treno arriva a Knin e prosegue in autobus (circa 1 h 50 min). Di solito un pullman diretto da Zagabria è più semplice.',
  },
  altTitle: {
    en: 'Other airports within driving distance',
    de: 'Andere Flughäfen in Fahrdistanz',
    sl: 'Druga letališča v dosegu avtomobila',
    hr: 'Druge zračne luke na udaljenosti vožnje',
    it: 'Altri aeroporti raggiungibili in auto',
  },
  altWinter: {
    en: (m) => `In ${m} Zadar has almost no international flights, so Zagreb is the best fallback.`,
    de: (m) => `Im ${m} hat Zadar kaum internationale Flüge, Zagreb ist dann die beste Alternative.`,
    sl: (m, n) => `V ${monthIn(n, 'sl')} v Zadar skoraj ni mednarodnih letov, zato je najboljša rešitev Zagreb.`,
    hr: (m, n) => `U ${monthIn(n, 'hr')} Zadar gotovo nema međunarodnih letova, pa je Zagreb najbolja zamjena.`,
    it: (m) => `In ${m} Zadar non ha quasi voli internazionali: l’alternativa migliore è Zagabria.`,
  },
  alt: {
    SPU: {
      en: 'Larger airport with more routes and dates. Motorway all the way.',
      de: 'Größerer Flughafen mit mehr Strecken und Terminen. Durchgehend Autobahn.',
      sl: 'Večje letališče z več linijami in termini. Ves čas po avtocesti.',
      hr: 'Veća zračna luka s više linija i termina. Cijelim putem autocestom.',
      it: 'Aeroporto più grande, con più rotte e date. Autostrada per tutto il tragitto.',
    },
    RJK: {
      en: 'On the island of Krk; the drive crosses the Krk bridge.',
      de: 'Auf der Insel Krk; die Fahrt führt über die Krk-Brücke.',
      sl: 'Na otoku Krku; pot vodi čez Krški most.',
      hr: 'Na otoku Krku; vozi se preko Krčkog mosta.',
      it: 'Sull’isola di Krk; il tragitto passa sul ponte di Krk.',
    },
    ZAG: {
      en: 'Croatia’s main hub, with connecting Croatia Airlines flights to Zadar.',
      de: 'Kroatiens Drehkreuz, mit Anschlussflügen von Croatia Airlines nach Zadar.',
      sl: 'Glavno hrvaško letališče, s povezovalnimi leti Croatia Airlines do Zadra.',
      hr: 'Glavna hrvatska zračna luka, s presjedanjem na let Croatia Airlinesa za Zadar.',
      it: 'Il principale scalo croato, con voli in coincidenza Croatia Airlines per Zadar.',
    },
    LJU: { en: 'Handy for guests from Slovenia.', de: 'Praktisch für Gäste aus Slowenien.', sl: 'Priročno za goste iz Slovenije.', hr: 'Praktično za goste iz Slovenije.', it: 'Comodo per chi arriva dalla Slovenia.' },
    TRS: { en: 'The drive crosses Slovenia.', de: 'Die Fahrt führt durch Slowenien.', sl: 'Pot vodi čez Slovenijo.', hr: 'Vozi se preko Slovenije.', it: 'Il tragitto attraversa la Slovenia.' },
    PUY: {
      en: 'A long drive, but there’s a direct Croatia Airlines flight to Zadar.',
      de: 'Lange Fahrt, aber mit Direktflug von Croatia Airlines nach Zadar.',
      sl: 'Dolga vožnja, a Croatia Airlines ima neposreden let do Zadra.',
      hr: 'Duga vožnja, ali Croatia Airlines ima izravan let za Zadar.',
      it: 'Lungo in auto, ma c’è un volo diretto Croatia Airlines per Zadar.',
    },
    VCE: {
      en: 'Big gateway; worth it only for long stays or a road trip.',
      de: 'Großes Drehkreuz; lohnt sich nur für lange Aufenthalte oder einen Roadtrip.',
      sl: 'Veliko vozlišče; splača se le za daljše bivanje ali potovanje z avtom.',
      hr: 'Veliko čvorište; isplati se samo za dulji boravak ili putovanje automobilom.',
      it: 'Grande scalo; conviene solo per soggiorni lunghi o un viaggio on the road.',
    },
    TSF: { en: 'Venice’s second airport.', de: 'Der zweite Flughafen von Venedig.', sl: 'Drugo beneško letališče.', hr: 'Druga venecijanska zračna luka.', it: 'Il secondo aeroporto di Venezia.' },
  },
  byCar: { en: 'by car', de: 'mit dem Auto', sl: 'z avtom', hr: 'automobilom', it: 'in auto' },

  // CTA
  ctaTitle: {
    en: 'Tell us your flight and we’ll plan your arrival',
    de: 'Nennen Sie uns Ihren Flug, wir planen Ihre Ankunft',
    sl: 'Sporočite nam svoj let in skupaj načrtujemo vaš prihod',
    hr: 'Javite nam svoj let i isplanirat ćemo vaš dolazak',
    it: 'Diteci il vostro volo e organizziamo insieme l’arrivo',
  },
  ctaText: {
    en: 'Send your flight number and landing time with your enquiry. We’ll reply with directions, the best way from the airport, and when we’ll be at the house to welcome you.',
    de: 'Schicken Sie Flugnummer und Landezeit mit Ihrer Anfrage. Wir antworten mit Wegbeschreibung, dem besten Weg vom Flughafen und wann wir Sie am Haus empfangen.',
    sl: 'Številko leta in čas pristanka pripišite k povpraševanju. Odgovorili vam bomo z navodili za pot, najboljšim prevozom z letališča in časom, ko vas bomo pričakali pri hiši.',
    hr: 'Uz upit pošaljite broj leta i vrijeme slijetanja. Odgovorit ćemo vam s uputama, najboljim načinom dolaska iz zračne luke i vremenom kad ćemo vas dočekati kod kuće.',
    it: 'Inviate numero del volo e orario di atterraggio insieme alla richiesta. Vi risponderemo con le indicazioni, il modo migliore per arrivare dall’aeroporto e l’ora in cui saremo alla casa ad accogliervi.',
  },
  ctaBtn: { en: 'Tell us your flight', de: 'Flug mitteilen', sl: 'Sporočite nam let', hr: 'Javite nam let', it: 'Comunicateci il volo' },
  prefillGeneric: {
    en: 'Flying in from … (flight number / landing time): ',
    de: 'Wir fliegen ab … (Flugnummer / Landezeit): ',
    sl: 'Priletimo iz … (številka leta / čas pristanka): ',
    hr: 'Dolazimo letom iz … (broj leta / vrijeme slijetanja): ',
    it: 'Arriviamo in volo da … (numero del volo / orario di atterraggio): ',
  },
};

const PEAK_MONTHS = [6, 7, 8];
const GLANCE_DRIVE = 'drive-zagreb';

// Toll keywords in travel.json drives[].tolls (English) -> country chips.
const TOLL_KEYS = [
  { re: /Croatian/i, cc: 'HR', kind: 'tollKm' },
  { re: /Slovenian/i, cc: 'SI', kind: 'vignette' },
  { re: /Austrian/i, cc: 'AT', kind: 'vignette' },
  { re: /Tauern|Karawanken/i, cc: 'AT', kind: 'tollSection' },
  { re: /Hungarian/i, cc: 'HU', kind: 'vignette' },
  { re: /Slovak/i, cc: 'SK', kind: 'vignette' },
  { re: /Czech/i, cc: 'CZ', kind: 'vignette' },
  { re: /Italian/i, cc: 'IT', kind: 'tollKm' },
  { re: /German motorways/i, cc: 'DE', kind: 'tollFree' },
];

let cache = null; // travel.json once loaded, so a re-render (Map <-> Board) is instant
const live = new WeakMap(); // section element -> { flights, month }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const f = (ctx, entry, ...args) => {
  const v = entry[ctx.lang] || entry.en;
  return typeof v === 'function' ? v(...args) : v;
};
const eur = (v, lang) =>
  new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }).format(v);
const region = (ctx, cc) => {
  try {
    return new Intl.DisplayNames([ctx.lang], { type: 'region' }).of(cc);
  } catch {
    return cc;
  }
};
const dayMonth = (ctx, iso) => {
  try {
    return new Intl.DateTimeFormat(ctx.lang, { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
};
const byId = (list, id) => list.find((x) => x.id === id);
const monthsOf = (from, to) => {
  const out = [];
  for (let m = Number(from.slice(5, 7)); m <= Number(to.slice(5, 7)); m++) out.push(m);
  return out;
};

// ---------------------------------------------------------------------------
// HTML blocks
// ---------------------------------------------------------------------------
function glanceHtml(ctx, d) {
  const car = byId(d.transfers, 'transfer-drive');
  const drive = byId(d.drives, GLANCE_DRIVE);
  const ferry = d.ferries.find((x) => x.crossingHours && !x.vehicles);
  const tile = (ic, value, label, sub) =>
    `<div class="tr-g"><span class="tr-g-ic">${icon(ic, { size: 22 })}</span><div><b>${esc(value)}</b><span>${esc(label)}</span><small>${esc(sub)}</small></div></div>`;
  return `<div class="tr-glance">
    ${tile('plane', `${formatKm(car.distanceKm)}`, ctx.t(T.gAirport), f(ctx, T.gAirportSub, car.durationMin))}
    ${tile('pin', String(d.flightStats.regularRouteCount), f(ctx, T.gRoutes, d.flightStats.regularRouteCount), f(ctx, T.gRoutesSub, d.flightStats.countries))}
    ${tile('car', formatMinutes(drive.durationMin), f(ctx, T.gDrive, drive.from), f(ctx, T.gDriveSub, formatKm(drive.distanceKm)))}
    ${ferry ? tile('wave', `${ferry.crossingHours} h`, ctx.t(T.gFerry), ctx.t(T.gFerrySub)) : ''}
  </div>`;
}

function arrivalHtml(ctx, d, narrow) {
  const car = byId(d.transfers, 'transfer-drive');
  const taxi = byId(d.transfers, 'transfer-taxi-fixed');
  const agg = byId(d.transfers, 'transfer-taxi-aggregators');
  const ride = byId(d.transfers, 'transfer-ridehail');
  const bus = byId(d.transfers, 'transfer-bus');
  const rental = byId(d.transfers, 'transfer-car-rental');
  const L = ctx.lang;
  const km = formatKm(car.distanceKm);
  const range = minRange(car.durationMin);

  // Phones: each option is a closed row with its one-line price as the summary.
  const opt = (ic, title, sum, body, item, extra = '') => {
    const h = `<h4>${icon(ic, { size: 20 })} ${esc(title)}</h4>`;
    const rest = `${body}${extra}${item ? sourcesHtml(ctx, item.sources) : ''}`;
    return narrow
      ? `<li class="tr-opt card"><details class="tr-opt-fold"><summary>${h}<span class="tr-opt-sum">${esc(sum)}</span></summary><div class="card-body">${rest}</div></details></li>`
      : `<li class="tr-opt card"><div class="card-body">${h}${rest}</div></li>`;
  };

  const options = [];
  if (rental) options.push(opt('car', ctx.t(T.oCar), f(ctx, T.oCarSum, rental.companies.length), `<p>${esc(ctx.t(T.oCarText))}</p><p class="tr-tags">${rental.companies.map((c) => `<span class="badge neutral">${esc(c)}</span>`).join('')}</p>`, rental));
  if (taxi || agg) {
    const body = [
      taxi && `<p>${esc(f(ctx, T.oTaxiFixed, eur(taxi.priceEUR.standardCar, L), eur(taxi.priceEUR.passengerVan, L)))} ${esc(ctx.t(T.oTaxiNight))}</p>`,
      agg && `<p class="small">${esc(f(ctx, T.oTaxiAgg, `${eur(agg.priceEUR.standardCarMin, L)}–${eur(Math.round(agg.priceEUR.standardCarMax), L)}`, eur(agg.priceEUR.miniVan8, L)))}</p>`,
    ].filter(Boolean).join('');
    const sum = taxi ? f(ctx, T.oTaxiSum, eur(taxi.priceEUR.standardCar, L)) : '';
    options.push(opt('car', ctx.t(T.oTaxi), sum, body, { sources: [...(taxi?.sources || []), ...(agg?.sources || [])] }));
  }
  if (ride) options.push(opt('chat', ctx.t(T.oRide), ctx.t(T.oRideSum), `<p>${esc(ctx.t(T.oRideText))}</p>`, ride));
  if (bus) {
    const [shuttle, local] = bus.legs;
    const total = eur(Math.round((shuttle.priceEUR + local.priceEUR) * 100) / 100, L);
    const tt = bus.timetableWinter2025_26;
    options.push(
      opt(
        'users',
        ctx.t(T.oBus),
        f(ctx, T.oBusSum, total),
        `<p>${esc(f(ctx, T.oBusText, eur(shuttle.priceEUR, L), shuttle.durationMin, eur(local.priceEUR, L), total))}</p><p class="small">${esc(f(ctx, T.oBusWhen, tt.zadarToPrivlakaWorkdays.length, tt.zadarToPrivlakaSatSunHoliday.length))}${tt.zadarToSabunikeWorkdays?.length ? ` ${esc(f(ctx, T.oBusSabunike, tt.zadarToSabunikeWorkdays.join(', ')))}` : ''}</p>`,
        bus,
        `<p class="small muted">${esc(ctx.t(T.oBusStop))}${ownerTodo('closest bus stop to Put kandelica 60 and walking time')}</p>`,
      ),
    );
  }
  options.push(
    `<li class="tr-opt tr-opt-us card"><div class="card-body"><h4>${icon('chat', { size: 20 })} ${esc(ctx.t(T.oPickup))}${ownerTodo('can you offer an airport pickup, and at what price?')}</h4><p>${esc(ctx.t(T.oPickupText))}</p><button type="button" class="btn btn-small" data-prefill="pickup">${esc(ctx.t(T.oPickupBtn))} ${icon('arrow', { size: 16 })}</button></div></li>`,
  );

  const ci = ownerValue(ctx, 'checkIn', SITE.directBooking.checkIn, null);
  const step = (n, title, body) => `<li class="tr-step"><span class="tr-step-n" aria-hidden="true">${n}</span><div><h4>${esc(title)}</h4>${body}</div></li>`;
  return `<div class="tr-block">
    <div class="tr-block-head">
      <h3>${esc(ctx.t(T.arrTitle))}</h3>
      <p class="muted">${esc(f(ctx, T.arrLede, km, range))}</p>
    </div>
    <div class="tr-route" aria-hidden="true">
      <span class="tr-route-end">${icon('plane', { size: 18 })} ZAD</span>
      <span class="tr-route-line"><span>${esc(km)} · ~${car.durationMin} min</span></span>
      <span class="tr-route-end tr-route-home">${icon('bed', { size: 18 })} Sabunike</span>
    </div>
    <ol class="tr-steps">
      ${step(1, ctx.t(T.s1), `<p>${esc(ctx.t(T.s1Text))}</p>`)}
      ${step(2, ctx.t(T.s2), `<ul class="tr-opts">${options.join('')}</ul><p class="source-note">${esc(ctx.t(T.pricesNote))}</p>`)}
      ${step(3, f(ctx, T.s3, km), `<p>${esc(f(ctx, T.s3Text, range))}</p>${sourcesHtml(ctx, car.sources)}`)}
      ${step(4, ctx.t(T.s4), `<p>${esc(ci ? f(ctx, T.s4Text, ci) : ctx.t(T.s4TextNoCi))}</p>`)}
    </ol>
  </div>`;
}

// "A + B (+ C if routed that way) + D or E": each "+" part becomes chips; a
// part with "or" / "if routed" (outside brackets) is optional and gets one
// dotted chip, e.g. "AT / HU vignette".
function tollChips(ctx, text) {
  const seen = new Set();
  const chips = [];
  for (const part of String(text || '').split(/\s\+\s|\(\+\s?/)) {
    const optional = /\bor\b|if routed/i.test(part.replace(/\([^)]*\)/g, ''));
    const keys = TOLL_KEYS.filter((k) => k.re.test(part) && !seen.has(k.cc + k.kind));
    keys.forEach((k) => seen.add(k.cc + k.kind));
    const groups = optional ? [...new Set(keys.map((k) => k.kind))].map((kind) => keys.filter((k) => k.kind === kind)) : keys.map((k) => [k]);
    for (const g of groups) {
      const names = g.map((k) => region(ctx, k.cc)).join(` ${ctx.t(T.tollOr)} `);
      const note = optional ? ` (${ctx.t(T.tollOptional)})` : '';
      chips.push(
        `<span class="tr-toll tr-toll-${g[0].kind}${optional ? ' tr-toll-opt' : ''}" title="${esc(names + note)}">${g.map((k) => k.cc).join(' / ')} <i>${esc(ctx.t(T[g[0].kind]))}</i>${optional ? `<span class="visually-hidden">${esc(note)}</span>` : ''}</span>`,
      );
    }
  }
  return chips.join('');
}

// Phones get the long "Driving down" / "By ferry…" blocks as a closed <details>
// (heading plus a one-line teaser as the summary); wider screens keep them open.
function foldBlock(narrow, head, teaser, body) {
  return narrow
    ? `<details class="tr-block tr-fold"><summary class="tr-block-head">${head}<p class="tr-teaser">${esc(teaser)}</p></summary>${body}</details>`
    : `<div class="tr-block"><div class="tr-block-head">${head}</div>${body}</div>`;
}

function carHtml(ctx, d, narrow) {
  const month = ctx.state.month;
  const drives = [...d.drives].sort((a, b) => a.durationMin - b.durationMin);
  const max = Math.max(...drives.map((x) => x.durationMin));
  const rows = drives
    .map(
      (x) => `<li class="tr-bar" title="${esc(x.tolls || '')}">
        <span class="tr-bar-city">${esc(x.from)}</span>
        <span class="tr-bar-track"><span class="tr-bar-fill" style="--w:${((x.durationMin / max) * 100).toFixed(1)}%"></span><span class="tr-bar-val"><b>${esc(formatMinutes(x.durationMin))}</b> · ${esc(formatKm(x.distanceKm))}</span></span>
        <span class="tr-bar-tolls" aria-label="${esc(ctx.t(T.tollsShort))}">${tollChips(ctx, x.tolls)}</span>
      </li>`,
    )
    .join('');
  const peak = PEAK_MONTHS.includes(month) ? `<p class="tr-warn">${icon('info', { size: 16 })} ${esc(f(ctx, T.peakWarn, monthName(month, ctx.lang, true), month))}</p>` : '';
  const tolls = d.tolls
    .map((x) => {
      const txt = T.tolls[x.id];
      let body = x.description;
      if (txt && x.id === 'toll-hr-a1') body = f(ctx, txt, eur(x.priceEUR.Zagreb_to_Posedarje_cat_I, ctx.lang), eur(x.priceEUR.Zagreb_to_ZadarCentar_cat_I, ctx.lang));
      else if (txt) body = f(ctx, txt);
      return `<li><p>${esc(body)}</p>${sourcesHtml(ctx, x.sources)}</li>`;
    })
    .join('');
  const local = d.localDrives
    .map((x) => `<li><span>${esc(T.local[x.id] ? ctx.t(T.local[x.id]) : x.from)}</span><b>${esc(formatKm(x.distanceKm))} · ${x.durationMin} min</b></li>`)
    .join('');
  const top = byId(d.drives, GLANCE_DRIVE);
  const teaser = f(ctx, T.carTeaser, formatMinutes(top.durationMin), top.from, formatKm(top.distanceKm), d.drives.length);
  const head = `<h3>${esc(ctx.t(T.carTitle))}</h3><p class="muted">${esc(ctx.t(T.carLede))}</p>`;
  return foldBlock(narrow, head, teaser, `
    ${peak}
    <div class="tr-car">
      <figure class="tr-chart card">
        <figcaption>${icon('car', { size: 18 })} ${esc(ctx.t(T.carChart))}</figcaption>
        <ol class="tr-bars">${rows}</ol>
        ${rows.includes('tr-toll-opt') ? `<p class="source-note">${esc(ctx.t(T.tollLegend))}</p>` : ''}
        ${sourcesHtml(ctx, d.drives.flatMap((x) => x.sources))}
      </figure>
      <div class="tr-car-side">
        <div class="card"><div class="card-body">
          <h4>${esc(ctx.t(T.tollsTitle))}</h4>
          <ul class="tr-tolls">${tolls}</ul>
          <p class="source-note">${esc(ctx.t(T.tollNotResearched))}: HU, SK, CZ, IT.</p>
        </div></div>
        <div class="card tr-last"><div class="card-body">
          <h4>${icon('pin', { size: 18 })} ${esc(ctx.t(T.lastTitle))}</h4>
          <p>${esc(f(ctx, T.lastText, byId(d.localDrives, 'local-nincroatia').durationMin))}</p>
          <h4 class="tr-sub">${esc(ctx.t(T.localTitle))}</h4>
          <ul class="tr-local">${local}</ul>
          ${sourcesHtml(ctx, d.localDrives.flatMap((x) => x.sources))}
        </div></div>
      </div>
    </div>`);
}

function moreHtml(ctx, d, narrow) {
  const month = ctx.state.month;
  const mName = month ? monthName(month, ctx.lang, true) : '';
  const fast = d.ferries.find((x) => x.id === 'ferry-ancona-zadar-fast');
  const carFerry = d.ferries.find((x) => x.id === 'ferry-ancona-split-car');
  const coach = byId(d.publicTransport, 'pt-flixbus');
  const train = byId(d.publicTransport, 'pt-train');
  const busStation = byId(d.localDrives, 'local-autobusnikolodvorzad');
  const card = (ic, title, body, item, badge = '') =>
    `<li class="card tr-mini"><div class="card-body"><h4>${icon(ic, { size: 20 })} ${esc(title)}</h4>${badge}${body}${item ? sourcesHtml(ctx, item.sources) : ''}</div></li>`;

  const cards = [];
  if (fast) {
    const runs = monthsOf(fast.season2026.from, fast.season2026.to);
    const badge = month ? `<p><span class="badge ${runs.includes(month) ? '' : 'neutral'}">${esc(f(ctx, runs.includes(month) ? T.runsIn : T.notIn, mName, month))}</span></p>` : '';
    cards.push(card('wave', ctx.t(T.ferryFast), `<p>${esc(f(ctx, T.ferryFastText, fast.crossingHours, fast.portToVilla.durationMin))}</p><p class="small muted">${esc(f(ctx, T.ferryFastWhen, dayMonth(ctx, fast.season2026.from), dayMonth(ctx, fast.season2026.to)))}</p>`, fast, badge));
  }
  if (carFerry) cards.push(card('car', ctx.t(T.ferryCar), `<p>${esc(f(ctx, T.ferryCarText, formatMinutes(carFerry.portToVilla.durationMin)))}</p>`, carFerry));
  if (coach && busStation) cards.push(card('users', ctx.t(T.coach), `<p>${esc(f(ctx, T.coachText, formatKm(busStation.distanceKm), busStation.durationMin))}</p>`, coach));
  if (train) cards.push(card('info', ctx.t(T.train), `<p>${esc(ctx.t(T.trainText))}</p>`, train));

  const winter = WINTER_MONTHS.includes(month);
  const alts = [...d.alternativeAirports]
    .sort((a, b) => a.driveMin - b.driveMin)
    .map(
      (a) => `<li class="${winter && a.iata === 'ZAG' ? 'is-hl' : ''}">
        <span class="tr-alt-code">${esc(a.iata)}</span>
        <span class="tr-alt-name"><b>${esc(a.name)}</b>${T.alt[a.iata] ? `<span>${esc(ctx.t(T.alt[a.iata]))}</span>` : ''}</span>
        <span class="tr-alt-time"><b>${esc(formatMinutes(a.driveMin))}</b><span>${esc(formatKm(a.driveKm))} ${esc(ctx.t(T.byCar))}</span></span>
      </li>`,
    )
    .join('');
  const teaser = f(ctx, T.moreTeaser, fast?.crossingHours ?? '–', formatMinutes(Math.min(...d.alternativeAirports.map((a) => a.driveMin))));
  return foldBlock(narrow, `<h3>${esc(ctx.t(T.moreTitle))}</h3>`, teaser, `
    <div class="tr-other">
      <ul class="tr-minis">${cards.join('')}</ul>
      <div class="card tr-alts"><div class="card-body">
        <h4>${icon('plane', { size: 20 })} ${esc(ctx.t(T.altTitle))}</h4>
        ${winter ? `<p class="tr-warn">${icon('info', { size: 16 })} ${esc(f(ctx, T.altWinter, mName, month))}</p>` : ''}
        <ul class="tr-alt-list">${alts}</ul>
        ${sourcesHtml(ctx, d.alternativeAirports.flatMap((x) => x.sources))}
      </div></div>
    </div>`);
}

function ctaHtml(ctx) {
  return `<div class="tr-cta">
    <div>
      <h3>${esc(ctx.t(T.ctaTitle))}</h3>
      <p>${esc(ctx.t(T.ctaText))}</p>
    </div>
    <button type="button" class="btn btn-accent btn-lg" data-prefill="flight">${icon('plane', { size: 18 })} ${esc(ctx.t(T.ctaBtn))}</button>
  </div>`;
}

const isNarrow = () => window.matchMedia('(max-width: 900px)').matches;

function bodyHtml(ctx, d) {
  const narrow = isNarrow();
  return `${glanceHtml(ctx, d)}${flightsHtml(ctx, d)}${arrivalHtml(ctx, d, narrow)}${carHtml(ctx, d, narrow)}${moreHtml(ctx, d, narrow)}${ctaHtml(ctx)}`;
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
export default {
  id: 'travel',
  nav: { en: 'Getting here', de: 'Anreise', sl: 'Kako do nas', hr: 'Kako do nas', it: 'Come arrivare' },
  className: 'water',
  // Map <-> Board swaps the whole flights panel. Month and basemap are handled
  // in update() so the map, the search and the scroll position survive.
  rerenderOn: ['flightsView'],

  render(ctx) {
    return `<div class="container">
      <div class="section-head">
        <p class="eyebrow">${icon('plane', { size: 16 })} ${esc(ctx.t(T.eyebrow))}</p>
        <h2>${esc(ctx.t(T.title))}</h2>
        <p class="lede" data-travel-lede>${esc(cache ? f(ctx, T.lede, cache.flightStats.regularRouteCount, cache.flightStats.countries) : ctx.t(T.ledeLoading))}</p>
      </div>
      <div class="tr-root" data-travel-root>${cache ? bodyHtml(ctx, cache) : `<div class="lazy-box tr-skel">${esc(ctx.t(T.loading))}</div>`}</div>
      <p class="error-box" data-mount-error hidden>${esc(ctx.t(T.mountError))}</p>
    </div>`;
  },

  async mount(el, ctx) {
    const state = { flights: null, month: ctx.state.month, dead: false };
    live.set(el, state);
    if (!cache) {
      const { default: data } = await import('../data/travel.json');
      cache = data;
      if (state.dead) return;
      el.querySelector('[data-travel-root]').innerHTML = bodyHtml({ ...ctx, state: { ...ctx.state, month: state.month } }, data);
      el.querySelector('[data-travel-lede]').textContent = f(ctx, T.lede, data.flightStats.regularRouteCount, data.flightStats.countries);
    }
    const root = el.querySelector('[data-travel-root]');

    const prefill = (message, month) => ctx.bus.emit('inquiry:prefill', { message, ...(month ? { month } : {}) });
    const onClick = (e) => {
      const b = e.target.closest('[data-prefill]');
      if (!b) return;
      const msg = b.dataset.prefill === 'pickup' ? f(ctx, T.prefillPickup) : f(ctx, T.prefillGeneric);
      prefill(msg, state.month);
    };
    root.addEventListener('click', onClick);

    state.flights = await mountFlights(root.querySelector('[data-flights]'), { ...ctx, state: { ...ctx.state, month: state.month } }, cache, { onPrefill: prefill });
    if (state.dead) state.flights.destroy();
    else if (state.month !== ctx.state.month) state.flights.setMonth(state.month);

    return () => {
      state.dead = true;
      root.removeEventListener('click', onClick);
      state.flights?.destroy();
      live.delete(el);
    };
  },

  update(el, ctx, changed) {
    const state = live.get(el);
    if (!state) return;
    if (changed.includes('month')) {
      state.month = ctx.state.month;
      state.flights?.setMonth(ctx.state.month);
      // The month-aware cards outside the flights panel are cheap to rebuild.
      if (cache) refreshMonthCards(el, ctx);
    }
    if (changed.includes('basemap')) state.flights?.setBasemap(ctx.state.basemap);
  },
};

function refreshMonthCards(el, ctx) {
  const blocks = el.querySelectorAll('[data-travel-root] > .tr-block');
  // Order in bodyHtml: arrival, car, more.
  const narrow = isNarrow();
  const swap = (node, html) => {
    if (!node) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const next = tmp.firstElementChild;
    // A block the guest unfolded on a phone stays open.
    if (node.open) next.open = true;
    node.replaceWith(next);
  };
  swap(blocks[1], carHtml(ctx, cache, narrow));
  swap(blocks[2], moreHtml(ctx, cache, narrow));
}
