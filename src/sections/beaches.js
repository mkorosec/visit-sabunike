// Beaches: the owner's five favourites and the rest of the coast, as filterable
// cards next to a Leaflet map. Hovering or focusing a card highlights its pin,
// clicking a pin brings its card into view. A sea-temperature strip follows
// state.month, and the healing-mud note sits under the list.
import './beaches.css';
import beachData from '../data/beaches.json';
import climate from '../data/climate.json';
import { PHOTOS } from '../content/site.js';
import { esc, icon, photo, formatKm, formatMinutes, travelMinutes, bestMode, monthName, haversineKm, prefersReducedMotion } from '../lib/util.js';
import { openLightbox } from '../lib/lightbox.js';
import { roadMinutes } from '../maps/road.js';
import { plural, inMonth } from '../lib/lang-forms.js';

// ---------------------------------------------------------------------------
// UI strings. Grouped here so they can be translated in one place.
// ---------------------------------------------------------------------------
const L = {
  eyebrow: { en: 'Beaches', de: 'Strände', sl: 'Plaže', hr: 'Plaže', it: 'Spiagge' },
  favourites: { en: 'Our five favourites', de: 'Unsere fünf Lieblingsstrände', sl: 'Naših pet najljubših', hr: 'Naših pet omiljenih', it: 'Le nostre cinque preferite' },
  favouritesSub: {
    en: 'The beaches we go to ourselves, from the one down the lane to a snorkelling cove across the bay.',
    de: 'Die Strände, an die wir selbst gehen: vom Strand am Ende der Straße bis zur Schnorchelbucht auf der anderen Seite der Bucht.',
    sl: 'Plaže, na katere hodimo sami: od tiste na koncu naše ulice do zalivčka za potapljanje z masko na drugi strani zaliva.',
    hr: 'Plaže na koje i sami idemo: od one na kraju naše ulice do uvale za ronjenje s maskom s druge strane zaljeva.',
    it: "Le spiagge dove andiamo noi stessi: da quella in fondo alla via a una caletta per lo snorkeling dall'altra parte della baia.",
  },
  more: { en: 'More beaches nearby', de: 'Weitere Strände in der Nähe', sl: 'Še več plaž v bližini', hr: 'Još plaža u blizini', it: 'Altre spiagge nei dintorni' },
  moreSub: {
    en: 'Sorted by distance. Vir island and the Vrsi shore look close on the map but are further by road.',
    de: 'Nach Entfernung sortiert. Die Insel Vir und die Küste von Vrsi wirken auf der Karte nah, sind auf der Straße aber weiter.',
    sl: 'Razvrščene po oddaljenosti. Otok Vir in obala pri Vrsih se na zemljevidu zdita blizu, po cesti pa sta dlje.',
    hr: 'Poredane po udaljenosti. Otok Vir i obala kod Vrsi na karti izgledaju blizu, ali cestom su dalje.',
    it: "In ordine di distanza. L'isola di Vir e la costa di Vrsi sembrano vicine sulla mappa, ma su strada sono più lontane.",
  },
  naturist: { en: 'Naturist (FKK)', de: 'FKK', sl: 'Naturistična (FKK)', hr: 'Naturistička (FKK)', it: 'Naturista (FKK)' },
  confidence: {
    medium: { en: 'Medium confidence in the sources', de: 'Quellenlage: mittel', sl: 'Srednja zanesljivost virov', hr: 'Srednja pouzdanost izvora', it: 'Affidabilità delle fonti: media' },
    low: { en: 'Low confidence in the sources', de: 'Quellenlage: schwach', sl: 'Nizka zanesljivost virov', hr: 'Niska pouzdanost izvora', it: 'Affidabilità delle fonti: bassa' },
  },
  lessCertain: { en: 'Some details unconfirmed', de: 'Teils unbestätigt', sl: 'Nekateri podatki niso potrjeni', hr: 'Neki podaci nisu potvrđeni', it: 'Alcuni dettagli non confermati' },
  filterLabel: { en: 'Show beaches for', de: 'Strände anzeigen für', sl: 'Prikaži plaže za', hr: 'Prikaži plaže za', it: 'Mostra le spiagge per' },
  modeLabel: { en: 'Travel times', de: 'Fahrzeiten', sl: 'Čas poti', hr: 'Vrijeme putovanja', it: 'Tempi di percorrenza' },
  best: { en: 'Best way', de: 'Am besten', sl: 'Najbolje', hr: 'Najbolje', it: 'Consigliato' },
  walk: { en: 'Walk', de: 'Zu Fuß', sl: 'Peš', hr: 'Pješice', it: 'A piedi' },
  bike: { en: 'Bike', de: 'Rad', sl: 'Kolo', hr: 'Bicikl', it: 'Bici' },
  car: { en: 'Car', de: 'Auto', sl: 'Avto', hr: 'Auto', it: 'Auto' },
  about: { en: 'about', de: 'ca.', sl: 'pribl.', hr: 'oko', it: 'circa' },
  byMode: {
    walk: { en: 'walk', de: 'zu Fuß', sl: 'peš', hr: 'pješice', it: 'a piedi' },
    bike: { en: 'by bike', de: 'mit dem Rad', sl: 's kolesom', hr: 'biciklom', it: 'in bici' },
    car: { en: 'by car', de: 'mit dem Auto', sl: 'z avtom', hr: 'autom', it: 'in auto' },
  },
  byRoad: { en: 'by road', de: 'Wegstrecke', sl: 'po poti', hr: 'po putu', it: 'di percorso' },
  straight: { en: 'straight line', de: 'Luftlinie', sl: 'zračne razdalje', hr: 'zračne udaljenosti', it: "in linea d'aria" },
  // Plural on {n} (the total); {shown} is filled in afterwards.
  count: {
    en: '{shown} of {n} beaches',
    de: '{shown} von {n} Stränden',
    sl: { one: '{shown} od {n} plaže', other: '{shown} od {n} plaž' },
    hr: { one: '{shown} od {n} plaže', few: '{shown} od {n} plaže', other: '{shown} od {n} plaža' },
    it: '{shown} di {n} spiagge',
  },
  noneHere: { en: 'None of these match this filter.', de: 'Keiner davon passt zu diesem Filter.', sl: 'Nobena od teh ne ustreza temu filtru.', hr: 'Nijedna od ovih ne odgovara ovom filtru.', it: 'Nessuna di queste corrisponde al filtro.' },
  noneAtAll: { en: 'No beach matches this filter yet.', de: 'Noch kein Strand passt zu diesem Filter.', sl: 'Temu filtru zaenkrat ne ustreza nobena plaža.', hr: 'Ovom filtru zasad ne odgovara nijedna plaža.', it: 'Per ora nessuna spiaggia corrisponde a questo filtro.' },
  showAll: { en: 'Show all beaches', de: 'Alle Strände zeigen', sl: 'Prikaži vse plaže', hr: 'Prikaži sve plaže', it: 'Mostra tutte le spiagge' },
  showOnMap: { en: 'Show on map', de: 'Auf der Karte', sl: 'Pokaži na zemljevidu', hr: 'Prikaži na karti', it: 'Mostra sulla mappa' },
  route: { en: 'Route', de: 'Route', sl: 'Pot', hr: 'Ruta', it: 'Percorso' },
  tipsSources: { en: 'Tips & sources', de: 'Tipps & Quellen', sl: 'Nasveti in viri', hr: 'Savjeti i izvori', it: 'Consigli e fonti' },
  moreTips: { en: 'About, tips & sources', de: 'Infos, Tipps & Quellen', sl: 'Opis, nasveti in viri', hr: 'Opis, savjeti i izvori', it: 'Descrizione, consigli e fonti' },
  tip: { en: 'Tip', de: 'Tipp', sl: 'Nasvet', hr: 'Savjet', it: 'Consiglio' },
  showMore: {
    en: { one: 'Show {n} more beach', other: 'Show {n} more beaches' },
    de: { one: '{n} weiteren Strand zeigen', other: '{n} weitere Strände zeigen' },
    sl: { one: 'Prikaži še {n} plažo', two: 'Prikaži še {n} plaži', few: 'Prikaži še {n} plaže', other: 'Prikaži še {n} plaž' },
    hr: { one: 'Prikaži još {n} plažu', few: 'Prikaži još {n} plaže', other: 'Prikaži još {n} plaža' },
    it: { one: "Mostra un'altra spiaggia", other: 'Mostra altre {n} spiagge' },
  },
  sources: { en: 'Sources', de: 'Quellen', sl: 'Viri', hr: 'Izvori', it: 'Fonti' },
  surface: { en: 'Surface', de: 'Untergrund', sl: 'Podlaga', hr: 'Podloga', it: 'Fondo' },
  shade: { en: 'Shade', de: 'Schatten', sl: 'Senca', hr: 'Hlad', it: 'Ombra' },
  crowds: { en: 'Summer crowds', de: 'Andrang im Sommer', sl: 'Gneča poleti', hr: 'Gužva ljeti', it: 'Affollamento in estate' },
  dogs: { en: 'Dogs', de: 'Hunde', sl: 'Psi', hr: 'Psi', it: 'Cani' },
  kids: { en: 'Kids', de: 'Kinder', sl: 'Otroci', hr: 'Djeca', it: 'Bambini' },
  snorkel: { en: 'Snorkelling', de: 'Schnorcheln', sl: 'Potapljanje z masko', hr: 'Ronjenje s maskom', it: 'Snorkeling' },
  snorkelShort: { en: 'Snorkel', de: 'Schnorchel', sl: 'Maska', hr: 'Maska', it: 'Snorkeling' },
  favSwipe: { en: 'Our five favourites, swipe sideways for more', de: 'Unsere fünf Favoriten, seitlich wischen für mehr', sl: 'Naših pet najljubših, za več podrsajte vstran', hr: 'Naših pet omiljenih, za više povucite u stranu', it: 'Le nostre cinque preferite: scorrete di lato per vederne altre' },
  outOf: { en: '{n} of 5', de: '{n} von 5', sl: '{n} od 5', hr: '{n} od 5', it: '{n} su 5' },
  noFacilities: { en: 'No facilities: bring water and shade', de: 'Keine Infrastruktur: Wasser und Schatten mitbringen', sl: 'Brez infrastrukture: s seboj prinesite vodo in senčnik', hr: 'Bez sadržaja: ponesite vodu i suncobran', it: 'Nessun servizio: portate acqua e ombrellone' },
  seasonal: { en: 'seasonal, probably closed now', de: 'saisonal, jetzt vermutlich geschlossen', sl: 'sezonsko, zdaj verjetno zaprto', hr: 'sezonski, sada vjerojatno zatvoreno', it: 'stagionale, ora probabilmente chiuso' },
  descMore: { en: 'More', de: 'Mehr', sl: 'Več', hr: 'Više', it: 'Altro' },
  descLess: { en: 'Less', de: 'Weniger', sl: 'Manj', hr: 'Manje', it: 'Meno' },
  // sl/hr: "back to the list" keeps the beach name in the nominative.
  backTo: { en: 'Back to {name}', de: 'Zurück zu {name}', sl: 'Nazaj na seznam: {name}', hr: 'Natrag na popis: {name}', it: 'Torna a {name}' },
  dogsYes: { en: 'Welcome, says the resort', de: 'Willkommen laut Resort', sl: 'Dobrodošli, po navedbah letovišča', hr: 'Dobrodošli, prema navodima resorta', it: 'Ammessi, secondo il resort' },
  dogsAsk: { en: 'No rule found, ask locally', de: 'Keine Regel bekannt, vor Ort fragen', sl: 'Pravil nismo našli, povprašajte na kraju samem', hr: 'Pravila nismo pronašli, pitajte na licu mjesta', it: 'Nessuna regola trovata, chiedete sul posto' },
  openPhoto: { en: 'Open photo', de: 'Foto öffnen', sl: 'Odpri fotografijo', hr: 'Otvori fotografiju', it: 'Apri la foto' },
  ownerPhoto: { en: 'Our photo', de: 'Unser Foto', sl: 'Naša fotografija', hr: 'Naša fotografija', it: 'Foto nostra' },
  house: { en: 'Our house', de: 'Unser Haus', sl: 'Naša hiša', hr: 'Naša kuća', it: 'La nostra casa' },
  walkLine: { en: 'about {t} walk', de: 'ca. {t} zu Fuß', sl: 'pribl. {t} peš', hr: 'oko {t} pješice', it: 'circa {t} a piedi' },
  legendFav: { en: 'Our favourites', de: 'Unsere Favoriten', sl: 'Naše najljubše', hr: 'Naše omiljene', it: 'Le nostre preferite' },
  legendMore: { en: 'More beaches', de: 'Weitere Strände', sl: 'Druge plaže', hr: 'Ostale plaže', it: 'Altre spiagge' },
  legendMud: { en: 'Healing mud (approx.)', de: 'Heilschlamm (ungefähr)', sl: 'Zdravilno blato (približno)', hr: 'Ljekovito blato (približno)', it: 'Fango curativo (indicativo)' },
  legendWalk: { en: 'Walk to the nearest beach', de: 'Fußweg zum nächsten Strand', sl: 'Pot peš do najbližje plaže', hr: 'Pješice do najbliže plaže', it: 'A piedi fino alla spiaggia più vicina' },
  resetMap: { en: 'Fit all', de: 'Alle zeigen', sl: 'Prikaži vse', hr: 'Prikaži sve', it: 'Mostra tutte' },
  mapLabel: { en: 'Map of the beaches near the house', de: 'Karte der Strände rund um das Haus', sl: 'Zemljevid plaž v okolici hiše', hr: 'Karta plaža oko kuće', it: 'Mappa delle spiagge vicino alla casa' },
  mapLoading: { en: 'Loading the map…', de: 'Karte wird geladen…', sl: 'Nalagamo zemljevid …', hr: 'Učitavamo kartu…', it: 'Caricamento della mappa…' },
  mapError: {
    en: 'The map could not load. The beach list still has every distance and a route link.',
    de: 'Die Karte konnte nicht laden. Die Liste enthält trotzdem alle Entfernungen und Routenlinks.',
    sl: 'Zemljevida ni bilo mogoče naložiti. Na seznamu plaž so še vedno vse razdalje in povezave do poti.',
    hr: 'Karta se nije mogla učitati. Na popisu plaža i dalje su sve udaljenosti i poveznice na rutu.',
    it: "Non è stato possibile caricare la mappa. Nell'elenco trovate comunque tutte le distanze e il link al percorso.",
  },
  mountError: {
    en: 'The interactive filters could not start. All beaches are listed below.',
    de: 'Die Filter konnten nicht starten. Alle Strände sind unten aufgeführt.',
    sl: 'Interaktivnih filtrov ni bilo mogoče zagnati. Vse plaže so navedene spodaj.',
    hr: 'Interaktivni filtri nisu se mogli pokrenuti. Sve plaže navedene su u nastavku.',
    it: 'Non è stato possibile avviare i filtri interattivi. Tutte le spiagge sono elencate qui sotto.',
  },
  aboutData: { en: 'About these distances and ratings', de: 'Zu Entfernungen und Bewertungen', sl: 'O teh razdaljah in ocenah', hr: 'O ovim udaljenostima i ocjenama', it: 'Su queste distanze e valutazioni' },
  aboutDataText: {
    en: 'Distances follow walking, cycling and driving routes from OpenStreetMap (routing.openstreetmap.de, checked October 2026). For Queen’s Beach we route to its nearest (Sabunike) end, not the middle of the strip. Times assume 5 km/h on foot, 16 km/h by bike and 50 km/h by car plus a couple of minutes to park, so they are rough. Kids, snorkelling and crowd ratings are our own 1–5 estimates from the cited descriptions, not measurements. Beach bars, rentals and lifeguards change from year to year.',
    de: 'Die Entfernungen folgen Fuß-, Rad- und Autorouten aus OpenStreetMap (routing.openstreetmap.de, geprüft im Oktober 2026). Beim Queen’s Beach rechnen wir bis zum nächstgelegenen Ende (Sabunike), nicht bis zur Mitte des Strands. Die Zeiten rechnen mit 5 km/h zu Fuß, 16 km/h mit dem Rad und 50 km/h mit dem Auto plus ein paar Minuten zum Parken und sind daher grob. Kinder-, Schnorchel- und Andrang-Werte sind unsere eigenen Schätzungen (1–5) auf Basis der Quellen, keine Messungen. Strandbars, Verleih und Badeaufsicht wechseln von Jahr zu Jahr.',
    sl: 'Razdalje sledijo peš, kolesarskim in avtomobilskim potem iz OpenStreetMap (routing.openstreetmap.de, preverjeno oktobra 2026). Pri Kraljičini plaži računamo pot do njenega najbližjega konca (na strani Sabunik), ne do sredine plaže. Časi predpostavljajo 5 km/h peš, 16 km/h s kolesom in 50 km/h z avtom ter nekaj minut za parkiranje, zato so le okvirni. Ocene za otroke, potapljanje z masko in gnečo so naše lastne ocene od 1 do 5 na podlagi navedenih opisov, ne meritve. Plažni bari, izposoja in reševalci iz vode se iz leta v leto spreminjajo.',
    hr: 'Udaljenosti prate pješačke, biciklističke i automobilske rute iz OpenStreetMapa (routing.openstreetmap.de, provjereno u listopadu 2026.). Za Kraljičinu plažu računamo put do njezina najbližeg kraja (prema Sabunikama), a ne do sredine plaže. Vremena pretpostavljaju 5 km/h pješice, 16 km/h biciklom i 50 km/h autom uz nekoliko minuta za parkiranje, pa su okvirna. Ocjene za djecu, ronjenje s maskom i gužvu naše su vlastite procjene od 1 do 5 na temelju navedenih opisa, a ne mjerenja. Beach barovi, najam opreme i spasioci mijenjaju se iz godine u godinu.',
    it: "Le distanze seguono i percorsi a piedi, in bici e in auto di OpenStreetMap (routing.openstreetmap.de, verificati a ottobre 2026). Per la Kraljičina plaža calcoliamo il percorso fino all'estremità più vicina (lato Sabunike), non fino al centro della spiaggia. I tempi presuppongono 5 km/h a piedi, 16 km/h in bici e 50 km/h in auto più qualche minuto per parcheggiare, quindi sono indicativi. I punteggi per bambini, snorkeling e affollamento sono nostre stime da 1 a 5 basate sulle descrizioni citate, non misurazioni. Bar sulla spiaggia, noleggi e bagnini cambiano di anno in anno.",
  },
  askBeach: { en: 'Not sure which beach suits you? Ask us', de: 'Unsicher, welcher Strand passt? Fragen Sie uns', sl: 'Ne veste, katera plaža vam bo najbolj ustrezala? Vprašajte nas', hr: 'Niste sigurni koja vam plaža najviše odgovara? Pitajte nas', it: 'Non sapete quale spiaggia fa per voi? Chiedeteci' },
  alsoTitle: { en: 'Also in Privlaka village (not on the map yet)', de: 'Außerdem im Dorf Privlaka (noch nicht auf der Karte)', sl: 'Še v vasi Privlaka (zaenkrat ni na zemljevidu)', hr: 'Također u mjestu Privlaka (još nije na karti)', it: 'Anche nel paese di Privlaka (non ancora sulla mappa)' },
};

const TITLES = {
  general: { en: 'Shallow sand, a short walk down the lane', de: 'Flacher Sand, ein kurzer Spaziergang die Straße hinunter', sl: 'Plitva peščena plaža, le kratek sprehod po ulici navzdol', hr: 'Plitka pješčana plaža, samo kratka šetnja niz ulicu', it: 'Sabbia e acqua bassa, a una breve passeggiata lungo la via' },
  // Families: the beach-bar clause only in months when the bars are likely open.
  families: { en: 'Shallow water, soft sand, a beach bar by the pier', de: 'Flaches Wasser, weicher Sand, eine Strandbar am Steg', sl: 'Plitvo morje, mehak pesek in plažni bar ob pomolu', hr: 'Plitko more, mekan pijesak i beach bar uz mol', it: 'Acqua bassa, sabbia morbida e un bar sulla spiaggia accanto al molo' },
  familiesOff: { en: 'Shallow water and soft sand, a short walk away', de: 'Flaches Wasser und weicher Sand, nur ein kurzer Weg', sl: 'Plitvo morje in mehak pesek, le kratek sprehod od hiše', hr: 'Plitko more i mekan pijesak, samo kratka šetnja od kuće', it: 'Acqua bassa e sabbia morbida, a breve distanza a piedi' },
  kite: { en: 'Two kite beaches at Nin, and Ljubač bay when Nin is crowded', de: 'Zwei Kitestrände bei Nin und die Bucht von Ljubač, wenn Nin voll ist', sl: 'Dve plaži za kajtanje pri Ninu in zaliv Ljubač, ko je v Ninu gneča', hr: 'Dvije plaže za kitesurfing kod Nina i uvala Ljubač kad je u Ninu gužva', it: 'Due spiagge per il kite a Nin, e la baia di Ljubač quando Nin è affollata' },
  dogs: { en: 'Beaches for you, and what we know about dogs on them', de: 'Strände für Sie und was wir über Hunde dort wissen', sl: 'Plaže za vas in kaj vemo o psih na njih', hr: 'Plaže za vas i što znamo o psima na njima', it: 'Spiagge per voi, e cosa sappiamo dei cani' },
};
const LEDES = {
  general: {
    en: 'The nearest beach is about {t} on foot. Below are the five we like best and a dozen more within a short ride. Pick what matters to you and the map follows.',
    de: 'Der nächste Strand ist zu Fuß ca. {t} entfernt. Unten finden Sie unsere fünf Favoriten und ein Dutzend weitere in kurzer Fahrt. Wählen Sie, was Ihnen wichtig ist, die Karte folgt.',
    sl: 'Do najbližje plaže je pribl. {t} hoje. Spodaj je naših pet najljubših in še ducat drugih, do katerih je le kratka vožnja. Izberite, kar vam je pomembno, in zemljevid se bo prilagodil.',
    hr: 'Do najbliže plaže ima oko {t} hoda. U nastavku je naših pet omiljenih i još desetak drugih na kratkoj vožnji. Odaberite što vam je važno, a karta će se prilagoditi.',
    it: 'La spiaggia più vicina è a circa {t} a piedi. Qui sotto trovate le nostre cinque preferite e una dozzina di altre a breve distanza. Scegliete ciò che conta per voi e la mappa si adegua.',
  },
  families: {
    en: 'The nearest beach is about {t} on foot, and the seabed slopes so gently that small children can paddle far out. The kids filter is on; switch it off to see every beach.',
    de: 'Der nächste Strand ist zu Fuß ca. {t} entfernt, und der Meeresboden fällt so flach ab, dass kleine Kinder weit hinauswaten können. Der Kinder-Filter ist aktiv; schalten Sie ihn aus, um alle Strände zu sehen.',
    sl: 'Do najbližje plaže je pribl. {t} hoje, morsko dno pa se spušča tako položno, da lahko majhni otroci čofotajo daleč od obale. Filter za otroke je vklopljen; izklopite ga, da vidite vse plaže.',
    hr: 'Do najbliže plaže ima oko {t} hoda, a dno se spušta tako blago da mala djeca mogu daleko gaziti plićakom. Filtar za djecu je uključen; isključite ga da biste vidjeli sve plaže.',
    it: 'La spiaggia più vicina è a circa {t} a piedi e il fondale scende così dolcemente che i più piccoli possono sguazzare anche lontano dalla riva. Il filtro per bambini è attivo: disattivatelo per vedere tutte le spiagge.',
  },
};

const FILTER_LABELS = {
  all: { en: 'All', de: 'Alle', sl: 'Vse', hr: 'Sve', it: 'Tutte' },
  kids: { en: 'Kids & shallow', de: 'Kinder & flach', sl: 'Otroci in plitvo', hr: 'Djeca i plićak', it: 'Bambini e acqua bassa' },
  snorkel: { en: 'Snorkelling', de: 'Schnorcheln', sl: 'Potapljanje z masko', hr: 'Ronjenje s maskom', it: 'Snorkeling' },
  kite: { en: 'Kite & wind', de: 'Kite & Wind', sl: 'Kajt in veter', hr: 'Kite i vjetar', it: 'Kite e vento' },
  dogs: { en: 'Dogs welcome', de: 'Hunde willkommen', sl: 'Psi dobrodošli', hr: 'Psi dobrodošli', it: 'Cani ammessi' },
  sunset: { en: 'Sunset', de: 'Sonnenuntergang', sl: 'Sončni zahod', hr: 'Zalazak sunca', it: 'Tramonto' },
  quiet: { en: 'Quiet', de: 'Ruhig', sl: 'Mirne', hr: 'Mirne', it: 'Tranquille' },
};

// Extra context shown under the chips while a filter is active.
const FILTER_NOTES = {
  kids: {
    en: 'Sandy, shallow entry and a kids rating of 4 or 5. On windy afternoons keep small swimmers close to shore at Queen’s Beach and Ždrijac, where windsurfers and kiters ride.',
    de: 'Sandiger, flacher Einstieg und Kinder-Wert 4 oder 5. An windigen Nachmittagen kleine Schwimmer am Queen’s Beach und in Ždrijac nah am Ufer halten, dort fahren Wind- und Kitesurfer.',
    sl: 'Peščen, plitev vstop v morje in ocena za otroke 4 ali 5. Ob vetrovnih popoldnevih naj mali plavalci na Kraljičini plaži in v Ždrijacu ostanejo blizu obale, saj tam jadrajo deskarji in kajtarji.',
    hr: 'Pješčan, plitak ulaz u more i ocjena za djecu 4 ili 5. Za vjetrovitih poslijepodneva neka mali plivači na Kraljičinoj plaži i Ždrijacu ostanu blizu obale jer ondje voze windsurferi i kiteri.',
    it: 'Ingresso in acqua sabbioso e poco profondo, punteggio bambini 4 o 5. Nei pomeriggi ventosi tenete i piccoli nuotatori vicino alla riva alla Kraljičina plaža e a Ždrijac, dove escono windsurfisti e kiter.',
  },
  snorkel: {
    en: 'Rocky edges and clear water. Bring your own mask and water shoes: we found no rental at these coves.',
    de: 'Felsige Ränder und klares Wasser. Maske und Badeschuhe selbst mitbringen: Verleih haben wir an diesen Buchten nicht gefunden.',
    sl: 'Skalnati robovi in čista voda. Masko in čevlje za vodo prinesite s seboj: izposoje pri teh zalivčkih nismo našli.',
    hr: 'Stjenoviti rubovi i bistro more. Ponesite vlastitu masku i obuću za vodu: na ovim uvalama nismo pronašli najam.',
    it: 'Bordi rocciosi e acqua limpida. Portate maschera e scarpette da scoglio: in queste calette non abbiamo trovato noleggi.',
  },
  kite: {
    en: 'The summer maestral (an afternoon north-west breeze) suits beginners; spring and autumn bring stronger wind for experienced riders. Stay inside the marked kite zones.',
    de: 'Der sommerliche Maestral (Nachmittagswind aus Nordwest) passt für Einsteiger; Frühling und Herbst bringen stärkeren Wind für Erfahrene. Bitte in den markierten Kitezonen bleiben.',
    sl: 'Poletni maestral (popoldanski veter s severozahoda) ustreza začetnikom; spomladi in jeseni piha močnejši veter za izkušene. Ostanite znotraj označenih con za kajtanje.',
    hr: 'Ljetni maestral (poslijepodnevni vjetar sa sjeverozapada) odgovara početnicima; u proljeće i jesen puše jači vjetar za iskusne. Ostanite unutar označenih zona za kitesurfing.',
    it: "Il maestrale estivo (una brezza pomeridiana da nord-ovest) è adatto ai principianti; primavera e autunno portano vento più forte per i più esperti. Restate all'interno delle zone kite segnalate.",
  },
  dogs: {
    en: 'Only one beach in our list is described as pet-friendly, by the resort itself. It is a resort beach: check that day visitors (and dogs) are let in before driving over. For the others we found no official dog rule, so ask locally or ask us. Travel guides also report dog areas next to the Sabunike naturist beach, at Škrapavac and near the Vir bridge in Privlaka, and dogs swimming at Bilotinjak. We have not confirmed any of them.',
    de: 'Nur ein Strand in unserer Liste wird als hundefreundlich beschrieben, und zwar vom Resort selbst. Es ist ein Resort-Strand: Bitte vorher klären, ob Tagesgäste (und Hunde) hineindürfen. Für die anderen haben wir keine offizielle Hunderegel gefunden: bitte vor Ort oder bei uns fragen. Reiseführer melden außerdem Hundebereiche neben dem FKK-Strand von Sabunike, in Škrapavac und nahe der Vir-Brücke in Privlaka sowie badende Hunde in Bilotinjak. Bestätigt haben wir davon noch nichts.',
    sl: 'Le ena plaža na našem seznamu je opisana kot prijazna do psov, in to na spletni strani samega letovišča. Gre za plažo letovišča: preden se odpeljete tja, preverite, ali spuščajo dnevne obiskovalce (in pse). Za druge nismo našli uradnega pravila o psih, zato povprašajte na kraju samem ali pri nas. Turistični vodniki omenjajo tudi območja za pse ob naturistični plaži v Sabunikah, na Škrapavcu in pri mostu na Vir v Privlaki ter pse, ki plavajo na Bilotinjaku. Ničesar od tega še nismo potrdili.',
    hr: 'Samo je jedna plaža na našem popisu opisana kao prilagođena psima, i to od samog resorta. Riječ je o plaži resorta: prije polaska provjerite puštaju li dnevne posjetitelje (i pse). Za ostale nismo pronašli službeno pravilo o psima, pa pitajte na licu mjesta ili nas. Turistički vodiči spominju i zone za pse uz naturističku plažu u Sabunikama, na Škrapavcu i kod Virskog mosta u Privlaci te pse koji se kupaju na Bilotinjaku. Ništa od toga još nismo potvrdili.',
    it: 'Solo una spiaggia della nostra lista è descritta come adatta ai cani, e a dirlo è il resort stesso. È una spiaggia del resort: prima di andarci verificate che facciano entrare i visitatori giornalieri (e i cani). Per le altre non abbiamo trovato regole ufficiali sui cani, quindi chiedete sul posto o chiedete a noi. Le guide segnalano anche aree per cani accanto alla spiaggia naturista di Sabunike, a Škrapavac e vicino al ponte di Vir a Privlaka, e cani che fanno il bagno a Bilotinjak. Non abbiamo ancora verificato nessuna di queste informazioni.',
  },
  sunset: {
    en: 'Our own shore faces north-east: you get pink evening light on the Velebit, not the sun setting into the sea. These beaches look west or south-west.',
    de: 'Unser Ufer schaut nach Nordosten: Abends leuchtet der Velebit rosa, die Sonne versinkt aber nicht im Meer. Diese Strände schauen nach Westen oder Südwesten.',
    sl: 'Naša obala gleda proti severovzhodu: zvečer se Velebit obarva rožnato, sonce pa ne zaide v morje. Te plaže gledajo proti zahodu ali jugozahodu.',
    hr: 'Naša obala gleda prema sjeveroistoku: navečer Velebit zasja ružičasto, ali sunce ne zalazi u more. Ove plaže gledaju na zapad ili jugozapad.',
    it: 'La nostra costa guarda a nord-est: la sera il Velebit si tinge di rosa, ma il sole non tramonta nel mare. Queste spiagge guardano a ovest o a sud-ovest.',
  },
  quiet: {
    en: 'Fewer people even in high season, usually because there is little or no infrastructure. Bring water and shade.',
    de: 'Auch in der Hochsaison weniger Leute, meist weil es kaum Infrastruktur gibt. Wasser und Schatten mitbringen.',
    sl: 'Manj ljudi tudi v glavni sezoni, običajno zato, ker je infrastrukture malo ali je sploh ni. Prinesite vodo in senčnik.',
    hr: 'Manje ljudi čak i u špici sezone, obično zato što sadržaja ima malo ili nimalo. Ponesite vodu i suncobran.',
    it: 'Meno gente anche in alta stagione, di solito perché i servizi sono pochi o assenti. Portate acqua e ombrellone.',
  },
};

const SURFACE = {
  sand: { en: 'Sand', de: 'Sand', sl: 'Pesek', hr: 'Pijesak', it: 'Sabbia' },
  'fine-pebble': { en: 'Fine pebbles', de: 'Feiner Kies', sl: 'Drobni prodniki', hr: 'Sitni šljunak', it: 'Ghiaia fine' },
  pebble: { en: 'Pebbles & rock', de: 'Kiesel & Fels', sl: 'Prodniki in skale', hr: 'Šljunak i stijene', it: 'Ciottoli e scogli' },
  mixed: { en: 'Sand, gravel & rock', de: 'Sand, Kies & Fels', sl: 'Pesek, prod in skale', hr: 'Pijesak, šljunak i stijene', it: 'Sabbia, ghiaia e scogli' },
  rock: { en: 'Rock', de: 'Fels', sl: 'Skale', hr: 'Stijene', it: 'Scogli' },
};
const SHADE = {
  none: { en: 'None', de: 'Keiner', sl: 'Brez sence', hr: 'Nema hlada', it: 'Nessuna' },
  umbrellas: { en: 'Parasols', de: 'Sonnenschirme', sl: 'Senčniki', hr: 'Suncobrani', it: 'Ombrelloni' },
  trees: { en: 'Pine trees', de: 'Pinien', sl: 'Borovci', hr: 'Borovi', it: 'Pini' },
  some: { en: 'A little', de: 'Etwas', sl: 'Malo', hr: 'Malo', it: "Un po'" },
};
// sl gneča / hr gužva are feminine; it agrees with "affollamento" (masculine).
const CROWD = [
  null,
  { en: 'Very quiet', de: 'Sehr ruhig', sl: 'Zelo majhna', hr: 'Vrlo mala', it: 'Molto basso' },
  { en: 'Quiet', de: 'Ruhig', sl: 'Majhna', hr: 'Mala', it: 'Basso' },
  { en: 'Moderate', de: 'Mittel', sl: 'Zmerna', hr: 'Umjerena', it: 'Medio' },
  { en: 'Busy', de: 'Voll', sl: 'Velika', hr: 'Velika', it: 'Alto' },
  { en: 'Very busy', de: 'Sehr voll', sl: 'Zelo velika', hr: 'Vrlo velika', it: 'Molto alto' },
];
const FACILITY = {
  bar: { en: 'Beach bar', de: 'Strandbar', sl: 'Plažni bar', hr: 'Beach bar', it: 'Bar sulla spiaggia' },
  toilets: { en: 'Toilets', de: 'WC', sl: 'Stranišča', hr: 'WC', it: 'Bagni' },
  showers: { en: 'Showers', de: 'Duschen', sl: 'Prhe', hr: 'Tuševi', it: 'Docce' },
  parking: { en: 'Parking', de: 'Parkplatz', sl: 'Parkirišče', hr: 'Parkiralište', it: 'Parcheggio' },
  rentals: { en: 'Rentals', de: 'Verleih', sl: 'Izposoja', hr: 'Najam opreme', it: 'Noleggio' },
};

const MONTH_L = {
  // {m} is the whole "in <month>" phrase from inMonth() (lib/lang-forms.js).
  seaIn: { en: 'Sea {m}', de: 'Meer {m}', sl: 'Morje {m}', hr: 'More {m}', it: 'Il mare {m}' },
  airIn: { en: 'Daytime air about {n} °C', de: 'Tagsüber ca. {n} °C Luft', sl: 'Zrak čez dan pribl. {n} °C', hr: 'Zrak danju oko {n} °C', it: "Di giorno l'aria è a circa {n} °C" },
  seaLabel: { en: 'Sea temperature', de: 'Meerestemperatur', sl: 'Temperatura morja', hr: 'Temperatura mora', it: 'Temperatura del mare' },
  chartTitle: { en: 'Average sea temperature by month', de: 'Durchschnittliche Meerestemperatur nach Monat', sl: 'Povprečna temperatura morja po mesecih', hr: 'Prosječna temperatura mora po mjesecima', it: 'Temperatura media del mare mese per mese' },
  chartHint: { en: 'Tap a month to plan around it.', de: 'Tippen Sie auf einen Monat, um danach zu planen.', sl: 'Tapnite mesec in načrtujte po njem.', hr: 'Dodirnite mjesec i planirajte prema njemu.', it: 'Toccate un mese per organizzarvi di conseguenza.' },
  pickMonth: { en: 'Pick your month to see the sea temperature.', de: 'Wählen Sie Ihren Monat, um die Meerestemperatur zu sehen.', sl: 'Izberite mesec, da vidite temperaturo morja.', hr: 'Odaberite mjesec da biste vidjeli temperaturu mora.', it: 'Scegliete il mese per vedere la temperatura del mare.' },
  warmest: { en: 'Warmest in July and August, about {n} °C', de: 'Am wärmsten im Juli und August, ca. {n} °C', sl: 'Najtoplejše v juliju in avgustu, pribl. {n} °C', hr: 'Najtoplije u srpnju i kolovozu, oko {n} °C', it: 'Massima a luglio e agosto, circa {n} °C' },
  feel: [
    { min: 24, en: 'Warm: in the water all day.', de: 'Warm: den ganzen Tag im Wasser.', sl: 'Toplo: v vodi ves dan.', hr: 'Toplo: u vodi cijeli dan.', it: "Calda: si sta in acqua tutto il giorno." },
    { min: 21, en: 'Pleasant for long swims.', de: 'Angenehm für lange Schwimmrunden.', sl: 'Prijetno za dolgo plavanje.', hr: 'Ugodno za duga plivanja.', it: 'Piacevole per lunghe nuotate.' },
    { min: 18, en: 'Fresh: short, bracing swims.', de: 'Frisch: kurze, erfrischende Runden.', sl: 'Sveže: za kratko, poživljajoče plavanje.', hr: 'Svježe: za kratko, osvježavajuće kupanje.', it: 'Fresca: bagni brevi e tonificanti.' },
    { min: -99, en: 'Cold: for the brave, or with a wetsuit.', de: 'Kalt: für Mutige oder mit Neoprenanzug.', sl: 'Mrzlo: za pogumne ali v neoprenu.', hr: 'Hladno: za hrabre ili u neoprenu.', it: 'Fredda: per i più coraggiosi, o con la muta.' },
  ],
  offSeason: {
    en: 'Beach bars, showers and rentals here are mostly seasonal, so from November to April expect most of them to be closed. The beaches themselves are open all year. Ask us what is running.',
    de: 'Strandbars, Duschen und Verleih sind hier meist saisonal, von November bis April sind die meisten vermutlich geschlossen. Die Strände selbst sind ganzjährig zugänglich. Fragen Sie uns, was gerade offen hat.',
    sl: 'Plažni bari, prhe in izposoja so tu večinoma sezonski, zato računajte, da bo od novembra do aprila večina zaprta. Same plaže so odprte vse leto. Vprašajte nas, kaj deluje.',
    hr: 'Beach barovi, tuševi i najam ovdje su uglavnom sezonski, pa od studenoga do travnja računajte da će većina biti zatvorena. Same plaže otvorene su cijele godine. Pitajte nas što radi.',
    it: "Qui bar sulla spiaggia, docce e noleggi sono per lo più stagionali: da novembre ad aprile aspettatevi che siano quasi tutti chiusi. Le spiagge invece sono aperte tutto l'anno. Chiedeteci cosa è aperto.",
  },
  wind: { en: 'Wind', de: 'Wind', sl: 'Veter', hr: 'Vjetar', it: 'Vento' },
  source: {
    en: 'Sea: Open-Meteo Marine 2021–2025 · Air: Open-Meteo archive 2016–2025',
    de: 'Meer: Open-Meteo Marine 2021–2025 · Luft: Open-Meteo-Archiv 2016–2025',
    sl: 'Morje: Open-Meteo Marine 2021–2025 · Zrak: arhiv Open-Meteo 2016–2025',
    hr: 'More: Open-Meteo Marine 2021.–2025. · Zrak: arhiv Open-Meteo 2016.–2025.',
    it: 'Mare: Open-Meteo Marine 2021–2025 · Aria: archivio Open-Meteo 2016–2025',
  },
};

// Beach-relevant wind line per month, condensed from climate.json windNote
// (Open-Meteo archive 2016–2025, share of days by dominant direction).
// Local wind names: bura = sl burja, it bora; jugo = it scirocco; maestral = it maestrale.
const WIND_L = {
  1: { en: 'Often the cold, gusty bura from the north-east; jugo brings rain.', de: 'Oft die kalte, böige Bora aus Nordost; der Jugo bringt Regen.', sl: 'Pogosto mrzla, sunkovita burja s severovzhoda; jugo prinaša dež.', hr: 'Često hladna bura na udare sa sjeveroistoka; jugo donosi kišu.', it: 'Spesso la bora fredda e a raffiche da nord-est; lo scirocco porta pioggia.' },
  2: { en: 'The windiest month: bura and jugo, with a few stormy days.', de: 'Der windigste Monat: Bora und Jugo, mit ein paar stürmischen Tagen.', sl: 'Najbolj vetroven mesec: burja in jugo, z nekaj viharnimi dnevi.', hr: 'Najvjetrovitiji mjesec: bura i jugo, uz nekoliko olujnih dana.', it: 'Il mese più ventoso: bora e scirocco, con qualche giornata di burrasca.' },
  3: { en: 'Changeable: jugo and bura, and the first maestral sea-breeze days.', de: 'Wechselhaft: Jugo und Bora, dazu die ersten Maestral-Tage.', sl: 'Spremenljivo: jugo in burja ter prvi dnevi z maestralom.', hr: 'Promjenjivo: jugo i bura te prvi dani s maestralom.', it: 'Variabile: scirocco e bora, e i primi giorni di maestrale.' },
  4: { en: 'Calmer, with a mix of jugo, bura and the first afternoon breezes.', de: 'Ruhiger, eine Mischung aus Jugo, Bora und ersten Nachmittagsbrisen.', sl: 'Mirneje, mešanica juga, burje in prvih popoldanskih vetričev.', hr: 'Mirnije, mješavina juga, bure i prvih poslijepodnevnih povjetaraca.', it: 'Più calmo, tra scirocco, bora e le prime brezze pomeridiane.' },
  5: { en: 'The afternoon north-west maestral breeze sets in; showers are still common.', de: 'Der nachmittägliche Maestral aus Nordwest setzt ein; Schauer sind noch häufig.', sl: 'Začne pihati popoldanski maestral s severozahoda; plohe so še pogoste.', hr: 'Počinje puhati poslijepodnevni maestral sa sjeverozapada; pljuskovi su još česti.', it: 'Arriva il maestrale pomeridiano da nord-ovest; gli acquazzoni sono ancora frequenti.' },
  6: { en: 'Steady afternoon maestral breeze, calm mornings; strong wind is rare.', de: 'Stetiger Maestral am Nachmittag, ruhige Vormittage; starker Wind ist selten.', sl: 'Stalen popoldanski maestral, mirna jutra; močan veter je redek.', hr: 'Postojan poslijepodnevni maestral, mirna jutra; jak vjetar je rijedak.', it: 'Maestrale costante nel pomeriggio, mattine calme; il vento forte è raro.' },
  7: { en: 'On most days an afternoon north-west maestral breeze cools the hottest hours.', de: 'An den meisten Tagen kühlt nachmittags der Maestral aus Nordwest die heißesten Stunden.', sl: 'Večino dni popoldanski maestral s severozahoda ohladi najbolj vroče ure.', hr: 'Većinu dana poslijepodnevni maestral sa sjeverozapada osvježi najtoplije sate.', it: 'Quasi ogni giorno il maestrale pomeridiano da nord-ovest rinfresca le ore più calde.' },
  8: { en: 'Afternoon maestral on many days; short bura spells after thunderstorms, mostly late in the month.', de: 'Oft nachmittags Maestral; nach Gewittern kurze Bora-Phasen, vor allem Ende des Monats.', sl: 'Pogosto popoldanski maestral; po nevihtah kratka obdobja burje, večinoma konec meseca.', hr: 'Često poslijepodnevni maestral; nakon nevremena kratka razdoblja bure, uglavnom krajem mjeseca.', it: 'Spesso maestrale nel pomeriggio; dopo i temporali brevi episodi di bora, soprattutto a fine mese.' },
  9: { en: 'Mixed winds: bura, maestral and jugo; short, heavy storms are possible.', de: 'Wechselnde Winde: Bora, Maestral und Jugo; kurze, heftige Gewitter sind möglich.', sl: 'Mešani vetrovi: burja, maestral in jugo; možne so kratke, močne nevihte.', hr: 'Promjenjivi vjetrovi: bura, maestral i jugo; moguća su kratka, jaka nevremena.', it: 'Venti variabili: bora, maestrale e scirocco; possibili temporali brevi e intensi.' },
  10: { en: 'Bura and jugo take over as the maestral fades; expect a windy day or two.', de: 'Bora und Jugo übernehmen, der Maestral lässt nach; mit ein, zwei windigen Tagen rechnen.', sl: 'Ko maestral pojenja, prevladata burja in jugo; računajte na dan ali dva vetra.', hr: 'Kako maestral slabi, prevladavaju bura i jugo; računajte na dan-dva vjetra.', it: 'Mentre il maestrale si attenua prevalgono bora e scirocco; mettete in conto un paio di giornate ventose.' },
  11: { en: 'The wettest month: jugo brings rain, bura clears it.', de: 'Der nasseste Monat: Jugo bringt Regen, Bora vertreibt ihn.', sl: 'Najbolj deževen mesec: jugo prinese dež, burja ga prežene.', hr: 'Najkišovitiji mjesec: jugo donosi kišu, bura je rastjera.', it: 'Il mese più piovoso: lo scirocco porta la pioggia, la bora la spazza via.' },
  12: { en: 'Mostly bura: cold, clear and gusty.', de: 'Meist Bora: kalt, klar und böig.', sl: 'Večinoma burja: mrzlo, jasno in sunkovito.', hr: 'Uglavnom bura: hladno, vedro i na udare.', it: 'Soprattutto bora: freddo, cielo limpido e raffiche.' },
};

const MUD_L = {
  title: { en: 'Healing mud at the Nin lagoon', de: 'Heilschlamm in der Lagune von Nin', sl: 'Zdravilno blato v ninski laguni', hr: 'Ljekovito blato u ninskoj laguni', it: 'Il fango curativo della laguna di Nin' },
  body: {
    en: 'Right behind Queen’s Beach, the shallow Nin lagoon holds what is described as Croatia’s largest deposit of sea mud (peloid). Visitors coat themselves in the black mud, let it dry in the sun and rinse it off in the warm shallows. In summer, open-air mud and sea-water therapy is offered by the beach.',
    de: 'Direkt hinter dem Queen’s Beach liegt die flache Lagune von Nin, beschrieben als größtes Vorkommen von Meeresschlamm (Peloid) in Kroatien. Besucher bestreichen sich mit dem schwarzen Schlamm, lassen ihn in der Sonne trocknen und waschen ihn im warmen Flachwasser ab. Im Sommer wird am Strand eine Schlamm- und Meerwassertherapie unter freiem Himmel angeboten.',
    sl: 'Tik za Kraljičino plažo leži plitva ninska laguna, ki naj bi skrivala največje nahajališče morskega blata (peloida) na Hrvaškem. Obiskovalci se namažejo s črnim blatom, ga pustijo, da se posuši na soncu, in ga sperejo v toplem plitvem morju. Poleti ob plaži ponujajo terapijo z blatom in morsko vodo na prostem.',
    hr: 'Odmah iza Kraljičine plaže nalazi se plitka ninska laguna, za koju se navodi da ima najveće nalazište morskog blata (peloida) u Hrvatskoj. Posjetitelji se premažu crnim blatom, puste ga da se osuši na suncu i isperu ga u toplom plićaku. Ljeti se uz plažu nudi terapija blatom i morskom vodom na otvorenom.',
    it: "Proprio dietro la Kraljičina plaža, la laguna poco profonda di Nin custodisce quello che viene descritto come il più grande giacimento di fango marino (peloide) della Croazia. I visitatori si spalmano di fango nero, lo lasciano asciugare al sole e lo sciacquano nell'acqua bassa e tiepida. D'estate, vicino alla spiaggia, si offrono trattamenti all'aperto con fango e acqua di mare.",
  },
  care: {
    en: 'This is a local tradition, not medical advice, and we make no health promises. The local tourist board advises skipping it with a heart condition or high blood pressure; ask your doctor if unsure. Wear old swimwear, the mud stains.',
    de: 'Das ist eine lokale Tradition, keine medizinische Empfehlung, und wir versprechen keine Heilwirkung. Laut örtlichem Tourismusverband besser verzichten bei Herzerkrankungen oder hohem Blutdruck; im Zweifel den Arzt fragen. Alte Badesachen tragen, der Schlamm färbt.',
    sl: 'Gre za lokalno tradicijo, ne za zdravniški nasvet, in ne obljubljamo nobenih učinkov na zdravje. Lokalna turistična skupnost ga odsvetuje ljudem s srčnimi boleznimi ali visokim krvnim tlakom; če niste prepričani, vprašajte zdravnika. Oblecite stare kopalke, blato pušča madeže.',
    hr: 'Riječ je o lokalnoj tradiciji, a ne o liječničkom savjetu, i ne obećavamo nikakve zdravstvene učinke. Lokalna turistička zajednica savjetuje da ga izbjegavate ako imate srčanih tegoba ili visok krvni tlak; ako niste sigurni, pitajte liječnika. Odjenite stari kupaći kostim jer blato ostavlja mrlje.',
    it: "È una tradizione locale, non un consiglio medico, e non promettiamo alcun beneficio per la salute. L'ente turistico locale lo sconsiglia a chi soffre di cuore o di pressione alta; nel dubbio chiedete al vostro medico. Indossate un costume vecchio: il fango macchia.",
  },
  more: { en: 'What it is and how it is done', de: 'Was es ist und wie es geht', sl: 'Kaj je to in kako poteka', hr: 'Što je to i kako se radi', it: "Che cos'è e come si fa" },
  pin: {
    en: 'The pin is approximate: the mud field is not mapped. Ask us for the exact spot.',
    de: 'Die Markierung ist ungefähr, das Schlammfeld ist nicht kartiert. Fragen Sie uns nach der genauen Stelle.',
    sl: 'Oznaka je približna: polje z blatom ni vrisano na zemljevid. Za natančno mesto vprašajte nas.',
    hr: 'Oznaka je približna: polje s blatom nije ucrtano na kartu. Pitajte nas za točno mjesto.',
    it: 'Il segnaposto è indicativo: la zona del fango non è mappata. Chiedeteci il punto esatto.',
  },
};

// Smaller Privlaka beaches with good descriptions but no map pin yet
// (research/beaches.json unmappedCandidates, medium confidence).
const ALSO = [
  {
    id: 'privlaka-mostina',
    en: 'Mostina: sandy and suited to small children, with showers, changing booths and a separate barrier-free way into the sea.',
    de: 'Mostina: sandig und für kleine Kinder geeignet, mit Duschen, Umkleiden und einem separaten barrierefreien Zugang ins Meer.',
    sl: 'Mostina: peščena in primerna za majhne otroke, s prhami, kabinami za preoblačenje in ločenim dostopom v morje brez ovir.',
    hr: 'Mostina: pješčana i pogodna za malu djecu, s tuševima, kabinama za presvlačenje i zasebnim pristupom moru bez prepreka.',
    it: 'Mostina: sabbiosa e adatta ai bambini piccoli, con docce, cabine e un accesso al mare separato senza barriere.',
  },
  {
    id: 'privlaka-selo',
    en: 'Selo: golden sand and a flat entry next to the small fishing harbour, with loungers and a restaurant terrace. No parking at the beach.',
    de: 'Selo: goldener Sand und flacher Einstieg am kleinen Fischerhafen, mit Liegen und Restaurantterrasse. Kein Parkplatz am Strand.',
    sl: 'Selo: zlat pesek in plitev vstop ob malem ribiškem pristanišču, z ležalniki in teraso restavracije. Ob plaži ni parkirišča.',
    hr: 'Selo: zlatni pijesak i plitak ulaz uz malu ribarsku luku, s ležaljkama i terasom restorana. Uz plažu nema parkirališta.',
    it: 'Selo: sabbia dorata e ingresso in acqua graduale accanto al piccolo porto dei pescatori, con lettini e la terrazza di un ristorante. Niente parcheggio in spiaggia.',
  },
  {
    id: 'privlaka-partenza',
    en: 'Partenza: sandy, with a gentle shelf for non-swimmers, next to the Vir bridge.',
    de: 'Partenza: sandig, mit sanft abfallendem Ufer für Nichtschwimmer, an der Vir-Brücke.',
    sl: 'Partenza: peščena, s položnim dnom, primernim za neplavalce, ob mostu na Vir.',
    hr: 'Partenza: pješčana, s blagim spuštanjem dna pogodnim za neplivače, uz Virski most.',
    it: 'Partenza: sabbiosa, con un fondale che scende dolcemente, adatta a chi non sa nuotare, accanto al ponte di Vir.',
  },
];

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const isDev = import.meta.env.DEV;
const todo = (text) => (isDev ? ` <span class="badge todo" title="Placeholder until the owner confirms">TODO(owner): ${esc(text)}</span>` : '');

// Beaches the owner named, nearest first (Ričina and Duboka Draga are a drive away).
const OWNER_PICKS = ['sabunike-mol', 'kraljicina-plaza', 'bilotinjak', 'duboka-draga-vrsi', 'ricina-vrsi'];
const OWNER_TODO = {
  'ricina-vrsi': 'confirm this is the Ričina you meant (Vrsi, not Pag)',
  'duboka-draga-vrsi': 'confirm this Duboka Draga (Vrsi, not Vir)',
};
const MUD_ID = 'nin-lagoon-healing-mud';

// Road distances from the house (b.roadKm {walk, bike, car}) come with beaches.json;
// see research/beaches.json methodNotes. Queen's Beach is routed to ACCESS (below), not to its map pin.
// Where you actually reach a long beach, if not at its pin: the north-west end of
// the OSM 'Kraljičina plaža' polygon (way/231022098), the end nearest the house.
const ACCESS = { 'kraljicina-plaza': [44.25567, 15.16936] };
const MODES = ['walk', 'bike', 'car'];
const GMAPS_MODE = { walk: 'walking', bike: 'bicycling', car: 'driving' };

// Walking path from the gate to Sabunike Mol (same OSRM foot route, 537 m).
const WALK_PATH = [
  [44.25871, 15.15892], [44.25928, 15.15964], [44.2603, 15.16092], [44.26047, 15.16114], [44.26074, 15.16147],
  [44.26093, 15.1617], [44.26126, 15.16215], [44.26144, 15.16244], [44.26153, 15.16279], [44.26156, 15.16288],
  [44.26174, 15.16313], [44.26143, 15.16367],
];

// Pin colours (map pins may use fixed colours, see ARCHITECTURE.md).
const PIN = { fav: '#a15c07', more: '#0b6fa4', mud: '#0e7c7b', walk: '#b5451f' };
// Marker stacking: favourites above the house marker (1000 in maps/base.js), the active pin on top.
const Z = { fav: 1100, more: 0, active: 1500 };
// First map view: beaches within this straight-line radius; "Fit all" shows the rest.
const NEAR_KM = 5;

const FILTERS = {
  all: () => true,
  kids: (b) => b.shallowEntry && b.kidFriendly >= 4,
  snorkel: (b) => b.snorkeling >= 3,
  kite: (b) => b.kiteSpot,
  dogs: (b) => b.dogsAllowed === true,
  sunset: (b) => b.sunsetView,
  quiet: (b) => b.crowdLevel <= 2 || b.bestFor.includes('quiet'),
};
// Audience focus tags (audiences.js focus.beachTags) -> default filter.
const TAG_FILTER = { family: 'kids', kids: 'kids', kite: 'kite', wind: 'kite', snorkel: 'snorkel', dogs: 'dogs', dog: 'dogs', sunset: 'sunset', quiet: 'quiet' };

// Pin numbers: the favourites are 1–5, the other beaches follow nearest first.
const BY_KM = beachData.items.filter((b) => b.id !== MUD_ID).sort((a, b) => a.km - b.km);
const BEACHES = [...OWNER_PICKS.map((id) => BY_KM.find((b) => b.id === id)).filter(Boolean), ...BY_KM.filter((b) => !OWNER_PICKS.includes(b.id))]
  .map((b, i) => ({ ...b, n: i + 1, fav: OWNER_PICKS.includes(b.id) }));
const MUD = beachData.items.find((b) => b.id === MUD_ID);
const FAVS = BEACHES.filter((b) => b.fav);
const OTHERS = BEACHES.filter((b) => !b.fav);
const AREA_PHOTOS = PHOTOS.filter((p) => p.kind === 'area' && p.lat != null);

// Owner photos taken within ~400 m of a beach pin.
function photosNear(b) {
  return AREA_PHOTOS.filter((p) => haversineKm([b.lat, b.lon], [p.lat, p.lon]) <= 0.4);
}

function roadKm(b, mode) {
  return b.roadKm?.[mode];
}
function minutesFor(b, mode) {
  const km = roadKm(b, mode);
  if (km == null) return travelMinutes(b.km, mode);
  return roadMinutes(km, mode);
}
function modeFor(b, mode) {
  return mode === 'best' ? bestMode(roadKm(b, 'walk') ?? b.km) : mode;
}

// Filter / travel-mode choice survives a re-render (month change) within one audience.
const memory = { audience: null, filter: 'all', mode: 'best', expanded: false };
// "More beaches" rows shown before "Show N more".
const FIRST_MORE = 3;
const MOBILE_Q = '(max-width: 900px)';
function defaultFilter(ctx) {
  for (const tag of ctx.audience.focus?.beachTags || []) if (TAG_FILTER[tag]) return TAG_FILTER[tag];
  return 'all';
}
function viewState(ctx) {
  if (memory.audience !== ctx.audience.id) Object.assign(memory, { audience: ctx.audience.id, filter: defaultFilter(ctx), mode: 'best', expanded: false });
  return memory;
}

const OFF_SEASON = new Set([11, 12, 1, 2, 3, 4]);
// Live map per mounted section element, so update() can switch the basemap.
const instances = new WeakMap();

// ---------------------------------------------------------------------------
// Small local icons (the shared set in util.js stays small).
// ---------------------------------------------------------------------------
const FICONS = {
  bar: '<path d="M5 4h14l-1.5 8a5.5 5.5 0 0 1-11 0z"/><path d="M12 17.5V21M8 21h8"/>',
  toilets: '<circle cx="7" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><path d="M5 9h4l1 6H8v6M6 15v6M15 9h4v6h-1v6h-2v-6h-1z"/>',
  showers: '<path d="M4 4h6a5 5 0 0 1 5 5v1M11 10h8"/><path d="M13 14v1M17 14v1M15 17v1M13 20v1M17 20v1"/>',
  parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  rentals: '<path d="M3 11a9 9 0 0 1 18 0z"/><path d="M12 11v9a2 2 0 0 1-4 0"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  back: '<path d="M12 5v14M6 13l6 6 6-6"/>',
};
function ficon(name, size = 18) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${FICONS[name]}</svg>`;
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------
const fill = (s, vars) => Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v), s);
const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

function timeHtml(b, mode, ctx) {
  const t = ctx.t;
  const m = modeFor(b, mode);
  const km = roadKm(b, m);
  const nb = (x) => x.replace(/ /g, "\u00a0");
  const dist = km != null ? `${nb(formatKm(km))} ${t(L.byRoad)}` : `${nb(formatKm(b.km))} ${t(L.straight)}`;
  return `${icon(m, { size: 20 })}<span><strong>${esc(t(L.about))} ${esc(nb(formatMinutes(minutesFor(b, m))))}</strong> ${esc(t(L.byMode[m]))}<span class="bch-dist"> · ${esc(dist)}</span></span>`;
}

// One-line version for the collapsed rows on phones: "about 13 min walk".
function shortTimeHtml(b, mode, ctx) {
  const m = modeFor(b, mode);
  return `${esc(ctx.t(L.about))} ${esc(formatMinutes(minutesFor(b, m)).replace(/ /g, '\u00a0'))} ${esc(ctx.t(L.byMode[m]))}`;
}
function tipHtml(b, mode, ctx) {
  const m = modeFor(b, mode);
  const mud = b.id === MUD_ID;
  return `<strong>${mud ? '' : `${b.n}. `}${esc(mud ? ctx.t(MUD_L.title) : b.name)}</strong><br>${shortTimeHtml(b, mode, ctx)}`;
}
function routeUrl(b, mode, ctx) {
  const [lat, lon] = ACCESS[b.id] || [b.lat, b.lon];
  return `https://www.google.com/maps/dir/?api=1&origin=${ctx.site.location.lat},${ctx.site.location.lon}&destination=${lat},${lon}&travelmode=${GMAPS_MODE[modeFor(b, mode)]}`;
}

function dotsHtml(value, label, ctx, shortLabel = label) {
  const v = Math.max(0, Math.min(5, value || 0));
  const text = `${ctx.t(label)}: ${fill(ctx.t(L.outOf), { n: v })}`;
  return `<span class="bch-rating"><span class="bch-rating-label" aria-hidden="true">${esc(ctx.t(shortLabel))}</span><span class="bch-dots" role="img" aria-label="${esc(text)}">${[1, 2, 3, 4, 5].map((i) => `<i${i <= v ? ' class="on"' : ''}></i>`).join('')}</span></span>`;
}

function mediaHtml(b, ctx) {
  const t = ctx.t;
  const pics = photosNear(b);
  const num = `<span class="bch-num" aria-hidden="true">${b.n}</span>`;
  if (pics.length) {
    const p = pics[0];
    return `<button type="button" class="bch-media bch-photo" data-photos="${esc(b.id)}" aria-label="${esc(t(L.openPhoto))}: ${esc(t(p))}">
      <img src="${photo(p.file, 'thumb')}" srcset="${photo(p.file, 'thumb')} 480w, ${photo(p.file, 'web')} 1600w" sizes="(max-width: 600px) 100vw, 320px" alt="" loading="lazy" decoding="async" />
      ${num}<span class="bch-media-tag">${ficon('camera', 16)}${esc(t(L.ownerPhoto))}${pics.length > 1 ? ` · ${pics.length}` : ''}</span>
    </button>`;
  }
  // Illustrated header: sea-depth gradient over a band of the beach surface.
  const depth = b.shallowEntry ? 'shallow' : 'deep';
  return `<div class="bch-media bch-illu" data-surface="${esc(b.surface)}" data-depth="${depth}" aria-hidden="true">
      <span class="bch-illu-sea"></span><span class="bch-illu-shore"></span>
      ${num}
    </div>`;
}

function facilitiesHtml(b, ctx) {
  const t = ctx.t;
  if (!b.facilities.length) return `<p class="bch-fac bch-fac-none">${icon('info', { size: 18 })}${esc(t(L.noFacilities))}</p>`;
  const off = OFF_SEASON.has(ctx.state.month);
  return `<ul class="bch-fac">${b.facilities
    .filter((f) => FACILITY[f])
    .map((f) => {
      // Off-season: dashed chip; the month panel carries the one "probably closed" note.
      const seasonal = off && f !== 'parking';
      return `<li${seasonal ? ` class="is-seasonal" title="${esc(t(L.seasonal))}"` : ''}>${ficon(f)}${esc(t(FACILITY[f]))}${seasonal ? `<span class="visually-hidden"> (${esc(t(L.seasonal))})</span>` : ''}</li>`;
    })
    .join('')}</ul>`;
}

function cardHtml(b, ctx, mode) {
  const t = ctx.t;
  const naturist = /naturist|fkk/i.test(`${b.name} ${b.localName}`);
  const crowd = CROWD[b.crowdLevel];
  const badges = [
    naturist ? `<span class="badge neutral">${esc(t(L.naturist))}</span>` : '',
    b.confidence !== 'high' ? `<span class="badge neutral bch-conf" title="${esc(t(L.confidence[b.confidence] || L.confidence.low))}">${esc(t(L.lessCertain))}</span>` : '',
  ].join('');
  const route = routeUrl(b, mode, ctx);
  const desc = `<p class="bch-desc">${esc(b.description)}</p>`;
  // Favourites: description clamped to three lines on phones, with a toggle.
  const favDesc = `<div class="bch-desc-wrap" id="bch-d-${esc(b.id)}">${desc}</div><button type="button" class="bch-desc-more" data-desc-toggle aria-expanded="false" aria-controls="bch-d-${esc(b.id)}" hidden>${esc(t(L.descMore))}</button>`;
  // "More beaches" collapse to one row on phones (the button is hidden on desktop).
  const row = b.fav
    ? ''
    : `<h4 class="bch-row-h"><button type="button" class="bch-row" data-row="${esc(b.id)}" aria-expanded="false" aria-controls="bch-in-${esc(b.id)}">
        <span class="bch-row-num" aria-hidden="true">${b.n}</span>
        <span class="bch-row-main">
          <span class="bch-row-name">${esc(b.name)}</span>
          <span class="bch-row-time" data-time-short>${shortTimeHtml(b, mode, ctx)}</span>
          <span class="bch-row-dots">${dotsHtml(b.kidFriendly, L.kids, ctx)}${dotsHtml(b.snorkeling, L.snorkel, ctx, L.snorkelShort)}</span>
        </span>
        <span class="bch-row-chev">${ficon('chevron', 20)}</span>
      </button></h4>`;
  return `
  <article class="bch-card${b.fav ? ' is-fav' : ' is-compact'}" data-beach="${esc(b.id)}" tabindex="-1" aria-labelledby="bch-${esc(b.id)}">
    ${row}
    <div class="bch-card-in" id="bch-in-${esc(b.id)}">
    ${mediaHtml(b, ctx)}
    <div class="bch-body">
      ${badges ? `<p class="bch-badges">${badges}</p>` : ''}
      <h4 class="bch-name" id="bch-${esc(b.id)}"><span class="visually-hidden">${b.n}. </span>${esc(b.name)}</h4>
      <p class="bch-local"><span lang="hr">${esc(b.localName)}</span> · ${esc(b.municipality)}${OWNER_TODO[b.id] ? todo(OWNER_TODO[b.id]) : ''}</p>
      <p class="bch-time" data-time>${timeHtml(b, mode, ctx)}</p>
      ${b.fav ? favDesc : ''}
      <ul class="bch-facts">
        <li><span class="bch-k">${esc(t(L.surface))}</span> ${esc(t(SURFACE[b.surface] || SURFACE.mixed))}</li>
        <li><span class="bch-k">${esc(t(L.shade))}</span> ${esc(t(SHADE[b.shade] || SHADE.none))}</li>
        <li><span class="bch-k">${esc(t(L.crowds))}</span> <span class="bch-crowd" data-level="${b.crowdLevel}" aria-hidden="true"></span>${esc(crowd ? t(crowd) : '–')}</li>
      </ul>
      <div class="bch-ratings">${dotsHtml(b.kidFriendly, L.kids, ctx)}${dotsHtml(b.snorkeling, L.snorkel, ctx)}</div>
      ${facilitiesHtml(b, ctx)}
      <div class="bch-foot">
        <button type="button" class="btn btn-small" data-focus="${esc(b.id)}">${icon('pin', { size: 18 })}${esc(t(L.showOnMap))}</button>
        <a class="btn btn-small btn-ghost" data-route="${esc(b.id)}" href="${esc(route)}" target="_blank" rel="noopener">${ficon('route')}${esc(t(L.route))}</a>
        <details class="bch-more">
          <summary>${esc(t(b.fav ? L.tipsSources : L.moreTips))}</summary>
          ${b.fav ? '' : desc}
          <p><strong>${esc(t(L.tip))}:</strong> ${esc(b.tips)}</p>
          <p><strong>${esc(t(L.dogs))}:</strong> ${esc(t(b.dogsAllowed === true ? L.dogsYes : L.dogsAsk))}</p>
          <p class="source-note">${esc(t(L.sources))}: ${b.sources.map((s) => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(host(s))}</a>`).join(' · ')}</p>
        </details>
      </div>
    </div>
    </div>
  </article>`;
}

function seaChartHtml(ctx) {
  const t = ctx.t;
  const m = ctx.state.month;
  const W = 336;
  const H = 120;
  const top = 18;
  const base = H - 20;
  const max = 28;
  const slot = W / 12;
  const bw = Math.min(18, slot - 6);
  const bars = climate.months
    .map((c) => {
      const h = ((base - top) * c.seaC) / max;
      const x = (c.month - 1) * slot + (slot - bw) / 2;
      const y = base - h;
      const on = c.month === m;
      const r = 4;
      // Rounded data-end, square at the baseline.
      const d = `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${base}Z`;
      return `<g class="bch-bar${on ? ' is-on' : ''}">
        <path d="${d}"/>
        ${on ? `<text class="bch-bar-val" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${Math.round(c.seaC)}°</text>` : ''}
        <text class="bch-bar-month" x="${x + bw / 2}" y="${H - 5}" text-anchor="middle">${esc(monthName(c.month, ctx.lang).slice(0, 1))}</text>
      </g>`;
    })
    .join('');
  // HTML buttons on top of the SVG: bigger hit targets, keyboard and screen-reader access.
  const hits = climate.months
    .map((c) => {
      const label = `${monthName(c.month, ctx.lang, true)}: ${Math.round(c.seaC)} °C`;
      // Roving tabindex: one tab stop for the whole chart, arrow keys move between months.
      const stop = c.month === (m || 1);
      return `<button type="button" class="bch-hit" data-month="${c.month}" tabindex="${stop ? 0 : -1}" aria-pressed="${c.month === m}" aria-label="${esc(label)}"><span class="bch-tip" aria-hidden="true">${esc(label)}</span></button>`;
    })
    .join('');
  return `<figure class="bch-chart">
      <figcaption class="small muted">${esc(t(MONTH_L.chartTitle))}</figcaption>
      <div class="bch-chart-plot">
        <svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
          <line class="bch-base" x1="0" x2="${W}" y1="${base + 0.5}" y2="${base + 0.5}"/>
          ${bars}
        </svg>
        <div class="bch-hits" role="group" aria-label="${esc(t(MONTH_L.chartTitle))}">${hits}</div>
      </div>
      <p class="source-note">${esc(t(MONTH_L.chartHint))} ${esc(t(MONTH_L.source))}.</p>
    </figure>`;
}

function monthPanelHtml(ctx) {
  const t = ctx.t;
  const m = ctx.state.month;
  const c = climate.months.find((x) => x.month === m);
  let headline;
  if (c) {
    const feel = MONTH_L.feel.find((f) => c.seaC >= f.min);
    headline = `<p class="bch-sea-label">${esc(fill(t(MONTH_L.seaIn), { m: inMonth(m, ctx.lang) }))}</p>
      <p class="bch-sea-value">${icon('thermometer', { size: 26 })}<span>${esc(t(L.about))} ${Math.round(c.seaC)} °C</span></p>
      <p class="bch-sea-feel">${esc(t(feel))} <span class="muted">${esc(fill(t(MONTH_L.airIn), { n: Math.round(c.airMaxC) }))}.</span></p>
      ${WIND_L[m] ? `<p class="bch-sea-wind"><strong>${icon('wind', { size: 18 })}${esc(t(MONTH_L.wind))}:</strong> ${esc(t(WIND_L[m]))}</p>` : ''}`;
  } else {
    const peak = Math.round(Math.max(...climate.months.map((x) => x.seaC)));
    headline = `<p class="bch-sea-label">${esc(t(MONTH_L.seaLabel))}</p>
      <p class="bch-sea-value is-long">${icon('thermometer', { size: 26 })}<span>${esc(fill(t(MONTH_L.warmest), { n: peak }))}</span></p>
      <p class="bch-sea-feel muted">${esc(t(MONTH_L.pickMonth))}</p>`;
  }
  return `<div class="bch-sea">
      <div class="bch-sea-text">${headline}</div>
      ${seaChartHtml(ctx)}
    </div>
    ${offSeasonHtml(ctx)}`;
}

function offSeasonHtml(ctx) {
  return OFF_SEASON.has(ctx.state.month) ? `<p class="bch-offseason">${icon('info', { size: 20 })}<span>${esc(ctx.t(MONTH_L.offSeason))}</span></p>` : '';
}

function mudHtml(ctx) {
  if (!MUD) return '';
  const t = ctx.t;
  const pics = photosNear(MUD);
  return `
  <aside class="bch-mud" data-beach="${esc(MUD.id)}" tabindex="-1" aria-labelledby="bch-mud-title">
    ${pics.length
      ? `<button type="button" class="bch-mud-media" data-photos="${esc(MUD.id)}" aria-label="${esc(t(L.openPhoto))}: ${esc(t(pics[0]))}"><img src="${photo(pics[0].file, 'thumb')}" alt="" loading="lazy" decoding="async" /></button>`
      : ''}
    <div class="bch-mud-body">
      <p class="eyebrow">${icon('leaf', { size: 16 })}<span lang="hr">${esc(MUD.localName)}</span></p>
      <h4 id="bch-mud-title">${esc(t(MUD_L.title))}</h4>
      <p class="bch-mud-care">${icon('info', { size: 20 })}<span>${esc(t(MUD_L.care))}</span></p>
      <p class="bch-time" data-time>${timeHtml(MUD, viewState(ctx).mode, ctx)}</p>
      <details class="bch-more bch-mud-more" data-mud-more>
        <summary>${esc(t(MUD_L.more))}</summary>
        <p>${esc(t(MUD_L.body))}</p>
        <p class="source-note">${esc(t(MUD_L.pin))}${todo('drop a pin for the mud field')} ${esc(t(L.sources))}: ${MUD.sources.map((s) => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(host(s))}</a>`).join(' · ')}</p>
      </details>
      <div class="bch-actions">
        <button type="button" class="btn btn-small" data-focus="${esc(MUD.id)}">${icon('pin', { size: 18 })}${esc(t(L.showOnMap))}</button>
      </div>
    </div>
  </aside>`;
}

function alsoHtml(ctx) {
  const t = ctx.t;
  const known = new Set(beachData.unmapped.map((u) => u.id));
  const rows = ALSO.filter((a) => known.has(a.id));
  if (!rows.length) return '';
  return `<details class="bch-also">
      <summary>${esc(t(L.alsoTitle))}</summary>
      <ul>${rows.map((a) => `<li>${esc(t(a))}</li>`).join('')}</ul>
      <p class="source-note">${esc(t(L.sources))}: zadar.hr · kroati.de · placesofjuma.com</p>
    </details>`;
}

function toolbarHtml(ctx, vs) {
  const t = ctx.t;
  return `
  <div class="bch-toolbar">
    <div class="bch-filters">
      <p class="bch-tool-label" id="bch-filter-label">${esc(t(L.filterLabel))}</p>
      <div class="chips" role="group" aria-labelledby="bch-filter-label">
        ${Object.keys(FILTERS)
          .map((id) => `<button type="button" class="chip bch-chip" data-filter="${id}" aria-pressed="${vs.filter === id}">${esc(t(FILTER_LABELS[id]))} <span class="bch-chip-n">${BEACHES.filter(FILTERS[id]).length}</span></button>`)
          .join('')}
      </div>
    </div>
    <div class="bch-modes">
      <p class="bch-tool-label" id="bch-mode-label">${esc(t(L.modeLabel))}</p>
      <div class="bch-seg" role="group" aria-labelledby="bch-mode-label">
        ${['best', ...MODES]
          .map((m) => `<button type="button" data-mode="${m}" aria-pressed="${vs.mode === m}">${m === 'best' ? icon('star', { size: 18 }) : icon(m, { size: 18 })}<span>${esc(t(L[m]))}</span></button>`)
          .join('')}
      </div>
    </div>
  </div>
  <p class="bch-note" data-filter-note ${FILTER_NOTES[vs.filter] ? '' : 'hidden'}>${icon('info', { size: 20 })}<span>${FILTER_NOTES[vs.filter] ? esc(t(FILTER_NOTES[vs.filter])) : ''}</span></p>
  <p class="bch-count" data-count aria-live="polite"></p>`;
}

function headCopy(ctx) {
  const id = ctx.audience.id;
  const focus = defaultFilter(ctx);
  const families = OFF_SEASON.has(ctx.state.month) ? TITLES.familiesOff : TITLES.families;
  const title = id === 'families' ? families : TITLES[id] || (focus === 'kite' ? TITLES.kite : focus === 'dogs' ? TITLES.dogs : TITLES.general);
  const lede = LEDES[id] || LEDES.general;
  const mol = BEACHES[0];
  return { title, lede: fill(ctx.t(lede), { t: formatMinutes(minutesFor(mol, 'walk')) }) };
}

export default {
  id: 'beaches',
  nav: { en: 'Beaches', de: 'Strände', sl: 'Plaže', hr: 'Plaže', it: 'Spiagge' },
  className: 'water',
  rerenderOn: ['month'],

  render(ctx) {
    const t = ctx.t;
    const vs = viewState(ctx);
    const head = headCopy(ctx);
    // The seasons section already charts the sea temperature by month.
    const seaCard = !ctx.audience.sections.includes('seasons');
    return `
    <div class="container">
      <div class="bch-head${seaCard ? '' : ' is-solo'}">
        <header class="section-head">
          <span class="eyebrow">${icon('wave', { size: 16 })}${esc(t(L.eyebrow))}</span>
          <h2>${esc(t(head.title))}</h2>
          <p class="lede">${esc(head.lede)}</p>
        </header>
        ${seaCard ? `<div class="bch-month">${monthPanelHtml(ctx)}</div>` : offSeasonHtml(ctx)}
      </div>
      ${toolbarHtml(ctx, vs)}
      <div class="bch-layout">
        <div class="bch-list" data-list>
          <section class="bch-group" aria-labelledby="bch-fav-title" data-group="fav">
            <h3 id="bch-fav-title">${icon('star', { size: 22 })}${esc(t(L.favourites))}</h3>
            <p class="bch-group-sub">${esc(t(L.favouritesSub))}</p>
            <div class="bch-cards is-favs" role="group" aria-label="${esc(t(L.favSwipe))}">${FAVS.map((b) => cardHtml(b, ctx, vs.mode)).join('')}</div>
            <p class="bch-empty" hidden>${esc(t(L.noneHere))}</p>
          </section>
          <section class="bch-group" aria-labelledby="bch-more-title" data-group="more">
            <h3 id="bch-more-title">${esc(t(L.more))}</h3>
            <p class="bch-group-sub">${esc(t(L.moreSub))}</p>
            <div class="bch-cards is-compact">${OTHERS.map((b) => cardHtml(b, ctx, vs.mode)).join('')}</div>
            <p class="bch-showmore" hidden><button type="button" class="btn" data-expand></button></p>
            <p class="bch-empty" hidden>${esc(t(L.noneHere))}</p>
          </section>
          <div class="bch-allnone" hidden><p>${esc(t(L.noneAtAll))}</p><button type="button" class="btn" data-filter="all">${esc(t(L.showAll))}</button></div>
          ${mudHtml(ctx)}
          ${alsoHtml(ctx)}
          <details class="bch-about">
            <summary>${esc(t(L.aboutData))}</summary>
            <p>${esc(t(L.aboutDataText))}</p>
          </details>
          <p class="bch-ask"><button type="button" class="btn btn-primary" data-ask>${icon('chat', { size: 18 })}${esc(t(L.askBeach))}</button></p>
        </div>
        <div class="bch-mapcol">
          <div class="map-frame bch-map" data-map role="region" aria-label="${esc(t(L.mapLabel))}">
            <p class="bch-map-msg" data-map-msg>${esc(t(L.mapLoading))}</p>
          </div>
          <div class="bch-legend" aria-hidden="true">
            <span><i class="bch-key" style="--k:${PIN.fav}"></i>${esc(t(L.legendFav))}</span>
            <span><i class="bch-key" style="--k:${PIN.more}"></i>${esc(t(L.legendMore))}</span>
            ${MUD ? `<span><i class="bch-key" style="--k:${PIN.mud}"></i>${esc(t(L.legendMud))}</span>` : ''}
            <span><i class="bch-key bch-key-line" style="--k:${PIN.walk}"></i>${esc(t(L.legendWalk))}</span>
          </div>
        </div>
      </div>
      <p class="error-box" data-mount-error hidden>${esc(t(L.mountError))}</p>
    </div>`;
  },

  async mount(el, ctx) {
    const t = ctx.t;
    const vs = viewState(ctx);
    const cards = new Map([...el.querySelectorAll('[data-beach]')].map((c) => [c.dataset.beach, c]));
    const all = MUD ? [...BEACHES, MUD] : BEACHES;
    const byId = new Map(all.map((b) => [b.id, b]));
    const mapEl = el.querySelector('[data-map]');
    const mobile = window.matchMedia(MOBILE_Q);
    const behavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');
    const markers = new Map();
    const baseZ = (id) => (byId.get(id)?.fav ? Z.fav : Z.more);
    let mapApi = null;
    let Leaf = null;
    let active = null;
    let backCtl = null;

    // -- list state ---------------------------------------------------------
    // Favourite descriptions are clamped to three lines on phones; the toggle
    // only appears where the text is actually cut.
    const syncClamp = () => {
      for (const btn of el.querySelectorAll('[data-desc-toggle]')) {
        const desc = btn.previousElementSibling.firstElementChild;
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.hidden = !open && desc.scrollHeight <= desc.clientHeight + 1;
      }
    };
    const applyFilter = () => {
      const test = FILTERS[vs.filter] || FILTERS.all;
      const limit = FIRST_MORE;
      let shown = 0;
      let others = 0;
      for (const b of BEACHES) {
        const on = test(b);
        const card = cards.get(b.id);
        if (on && !b.fav) card.dataset.rank = others++;
        card.hidden = !on || (!b.fav && !vs.expanded && Number(card.dataset.rank) >= limit);
        if (on) shown++;
        const mk = markers.get(b.id);
        if (mk && mapApi) on ? mk.addTo(mapApi.map) : mk.remove();
      }
      for (const g of el.querySelectorAll('[data-group]')) {
        const visible = [...g.querySelectorAll('.bch-card')].some((c) => !c.hidden);
        g.querySelector('.bch-empty').hidden = visible || shown === 0;
        g.hidden = shown === 0;
      }
      el.querySelector('.bch-allnone').hidden = shown > 0;
      const more = el.querySelector('.bch-showmore');
      more.hidden = vs.expanded || others <= limit;
      more.querySelector('button').textContent = plural(L.showMore, others - limit, ctx.lang);
      el.querySelector('[data-count]').textContent = fill(plural(L.count, BEACHES.length, ctx.lang), { shown });
      for (const b of el.querySelectorAll('[data-filter]')) if (b.closest('.chips')) b.setAttribute('aria-pressed', String(b.dataset.filter === vs.filter));
      const note = el.querySelector('[data-filter-note]');
      note.hidden = !FILTER_NOTES[vs.filter];
      note.querySelector('span').textContent = FILTER_NOTES[vs.filter] ? t(FILTER_NOTES[vs.filter]) : '';
      syncClamp();
    };
    const applyMode = () => {
      for (const b of all) {
        const card = cards.get(b.id);
        if (!card) continue;
        card.querySelector('[data-time]').innerHTML = timeHtml(b, vs.mode, ctx);
        const short = card.querySelector('[data-time-short]');
        if (short) short.innerHTML = shortTimeHtml(b, vs.mode, ctx);
        const route = card.querySelector('[data-route]');
        if (route) route.href = routeUrl(b, vs.mode, ctx);
        markers.get(b.id)?.setTooltipContent(tipHtml(b, vs.mode, ctx));
      }
      for (const b of el.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === vs.mode));
    };
    const setOpen = (card, open) => {
      card.classList.toggle('is-open', open);
      card.querySelector('[data-row]')?.setAttribute('aria-expanded', String(open));
    };

    // -- highlighting -------------------------------------------------------
    const highlight = (id) => {
      if (active === id) return;
      if (active) {
        cards.get(active)?.classList.remove('is-active');
        const prev = markers.get(active);
        prev?.getElement()?.classList.remove('is-active');
        prev?.setZIndexOffset(baseZ(active));
      }
      active = id;
      if (!id) return;
      cards.get(id)?.classList.add('is-active');
      const mk = markers.get(id);
      mk?.getElement()?.classList.add('is-active');
      mk?.setZIndexOffset(Z.active);
    };
    const revealCard = (id) => {
      const card = cards.get(id);
      if (!card) return;
      if (card.hidden) {
        vs.filter = 'all';
        vs.expanded = true;
        applyFilter();
      }
      if (card.classList.contains('is-compact')) setOpen(card, true);
      highlight(id);
      card.scrollIntoView({ block: 'center', behavior: behavior() });
      card.focus({ preventScroll: true });
    };
    // Phones: the map sits above the list, so "Show on map" leaves a way back.
    const removeBack = () => {
      backCtl?.remove();
      backCtl = null;
    };
    const showBack = (id) => {
      removeBack();
      const b = byId.get(id);
      const Back = Leaf.Control.extend({
        onAdd: () => {
          const btn = Leaf.DomUtil.create('button', 'bch-back');
          btn.type = 'button';
          btn.innerHTML = `${ficon('back', 18)}<span>${esc(fill(t(L.backTo), { name: id === MUD_ID ? t(MUD_L.title) : b.name }))}</span>`;
          Leaf.DomEvent.disableClickPropagation(btn);
          btn.addEventListener('click', () => {
            removeBack();
            revealCard(id);
          });
          return btn;
        },
      });
      backCtl = new Back({ position: 'bottomleft' }).addTo(mapApi.map);
    };
    const showOnMap = (id) => {
      const b = byId.get(id);
      const mk = markers.get(id);
      if (!b || !mapApi) return;
      if (b.id !== MUD_ID && !FILTERS[vs.filter](b)) {
        vs.filter = 'all';
        applyFilter();
      }
      highlight(id);
      if (mobile.matches) {
        mapEl.scrollIntoView({ block: 'center', behavior: behavior() });
        showBack(id);
      }
      const zoom = Math.max(mapApi.map.getZoom(), 14);
      if (prefersReducedMotion()) mapApi.map.setView([b.lat, b.lon], zoom);
      else mapApi.map.flyTo([b.lat, b.lon], zoom, { duration: 0.8 });
      mk?.openTooltip();
    };
    // The first view frames the visible beaches within NEAR_KM (the Vir, Vrsi and
    // Ljubač pins would shrink the nearby ones into a cluster); a filter change or
    // "Fit all" frames every visible beach.
    const fitVisible = (animate = true, nearOnly = false) => {
      if (!mapApi) return;
      const shown = BEACHES.filter(FILTERS[vs.filter]);
      const near = shown.filter((b) => b.km <= NEAR_KM);
      const pts = [[ctx.site.location.lat, ctx.site.location.lon], ...(nearOnly && near.length >= 2 ? near : shown).map((b) => [b.lat, b.lon])];
      if (pts.length === 1) pts.push(...WALK_PATH);
      mapApi.map.fitBounds(Leaf.latLngBounds(pts), { padding: [36, 36], maxZoom: 15, animate: animate && !prefersReducedMotion() });
    };

    // -- events -------------------------------------------------------------
    const onClick = (e) => {
      const f = e.target.closest('[data-filter]');
      if (f) {
        vs.filter = vs.filter === f.dataset.filter && f.dataset.filter !== 'all' ? 'all' : f.dataset.filter;
        applyFilter();
        fitVisible();
        return;
      }
      const m = e.target.closest('[data-mode]');
      if (m) {
        vs.mode = m.dataset.mode;
        return applyMode();
      }
      const row = e.target.closest('[data-row]');
      if (row) {
        const card = row.closest('.bch-card');
        const open = !card.classList.contains('is-open');
        setOpen(card, open);
        if (open) highlight(card.dataset.beach);
        return;
      }
      const dt = e.target.closest('[data-desc-toggle]');
      if (dt) {
        const open = dt.getAttribute('aria-expanded') !== 'true';
        dt.setAttribute('aria-expanded', String(open));
        dt.previousElementSibling.classList.toggle('is-open', open);
        dt.textContent = t(open ? L.descLess : L.descMore);
        return;
      }
      if (e.target.closest('[data-expand]')) {
        vs.expanded = true;
        applyFilter();
        // Keep keyboard focus in the list once the button disappears.
        const next = el.querySelector(`.bch-card.is-compact[data-rank="${FIRST_MORE}"]:not([hidden])`);
        return next?.querySelector('[data-row]')?.focus();
      }
      const focus = e.target.closest('[data-focus]');
      if (focus) return showOnMap(focus.dataset.focus);
      const pics = e.target.closest('[data-photos]');
      if (pics) {
        const items = photosNear(byId.get(pics.dataset.photos)).map((p) => ({ src: photo(p.file, 'web'), caption: t(p) }));
        return openLightbox(items, 0);
      }
      const month = e.target.closest('[data-month]');
      if (month) {
        const n = Number(month.dataset.month);
        return ctx.setState({ month: ctx.state.month === n ? 0 : n });
      }
      if (e.target.closest('[data-ask]')) {
        const b = active && byId.get(active);
        ctx.bus.emit('inquiry:prefill', b ? { message: `${t(L.eyebrow)}: ${b.name}` } : {});
      }
    };
    const onOver = (e) => {
      const card = e.target.closest('[data-beach]');
      if (card) highlight(card.dataset.beach);
    };
    // Sea-temperature chart: arrow keys, Home and End move between the month buttons.
    const onKey = (e) => {
      const hit = e.target.closest('.bch-hit');
      if (!hit) return;
      const hits = [...hit.parentElement.children];
      const i = hits.indexOf(hit);
      const to = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: hits.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault();
      const next = hits[(to + hits.length) % hits.length];
      hit.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    };
    const onMedia = () => {
      applyFilter();
      if (!mobile.matches) removeBack();
    };
    const cleanup = () => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('mouseover', onOver);
      el.removeEventListener('focusin', onOver);
      el.removeEventListener('keydown', onKey);
      mobile.removeEventListener('change', onMedia);
      instances.delete(el);
      mapApi?.destroy();
    };

    try {
      el.addEventListener('click', onClick);
      el.addEventListener('mouseover', onOver);
      el.addEventListener('focusin', onOver);
      el.addEventListener('keydown', onKey);
      mobile.addEventListener('change', onMedia);
      applyFilter();
      // The rows collapse only once the toggles work (see beaches.css).
      el.querySelector('[data-list]').classList.add('is-ready');
    } catch (err) {
      console.error('[beaches] setup failed', err);
      for (const c of cards.values()) c.hidden = false;
      el.querySelector('[data-mount-error]').hidden = false;
      return cleanup;
    }

    // -- map ----------------------------------------------------------------
    try {
      const base = await import('../maps/base.js');
      Leaf = base.L;
      mapApi = base.createMap(mapEl, { basemap: ctx.state.basemap, brandName: ctx.brand, zoom: 13 });
      el.querySelector('[data-map-msg]')?.remove();
      const pinFor = (b) => {
        const fav = b.fav;
        const mud = b.id === MUD_ID;
        const label = mud ? icon('leaf', { size: 16 }) : String(b.n);
        const mk = Leaf.marker([b.lat, b.lon], {
          icon: base.pinIcon({ color: mud ? PIN.mud : fav ? PIN.fav : PIN.more, label, size: fav ? 34 : 28 }),
          title: b.name,
          keyboard: true,
          riseOnHover: true,
          zIndexOffset: baseZ(b.id),
        }).bindTooltip(tipHtml(b, vs.mode, ctx), { direction: 'top', offset: [0, -16] });
        mk.on('click', () => revealCard(b.id));
        mk.on('mouseover', () => highlight(b.id));
        mk.on('add', () => {
          const node = mk.getElement();
          if (!node) return;
          node.setAttribute('role', 'button');
          node.setAttribute('aria-label', mud ? t(MUD_L.title) : `${b.n}. ${b.name}`);
          if (active === b.id) node.classList.add('is-active');
          node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              revealCard(b.id);
            }
          });
        });
        markers.set(b.id, mk);
        return mk;
      };
      for (const b of BEACHES) pinFor(b);
      if (MUD) pinFor(MUD).addTo(mapApi.map);
      const walk = formatMinutes(minutesFor(BEACHES[0], 'walk'));
      Leaf.polyline(WALK_PATH, { color: PIN.walk, weight: 4, dashArray: '2 9', lineCap: 'round', interactive: false }).addTo(mapApi.map);
      // The walking-time label only makes sense once the 500 m path is visible.
      const walkTip = Leaf.tooltip({ permanent: true, direction: 'left', className: 'bch-walk-tip', offset: [-8, 0] })
        .setLatLng(WALK_PATH[3])
        .setContent(esc(fill(t(L.walkLine), { t: walk })));
      const syncWalkTip = () => (mapApi.map.getZoom() >= 14 ? walkTip.addTo(mapApi.map) : walkTip.remove());
      mapApi.map.on('zoomend', syncWalkTip);
      // Reset control.
      const Reset = Leaf.Control.extend({
        onAdd: () => {
          const b = Leaf.DomUtil.create('button', 'bch-reset');
          b.type = 'button';
          b.textContent = t(L.resetMap);
          Leaf.DomEvent.disableClickPropagation(b);
          b.addEventListener('click', () => fitVisible());
          return b;
        },
      });
      new Reset({ position: 'topright' }).addTo(mapApi.map);
      applyFilter();
      fitVisible(false, true);
      syncWalkTip();
    } catch (err) {
      console.error('[beaches] map failed', err);
      const msg = el.querySelector('[data-map-msg]');
      if (msg) {
        msg.textContent = t(L.mapError);
        msg.classList.add('is-error');
      }
    }
    if (mapApi) instances.set(el, mapApi);

    return cleanup;
  },

  update(el, ctx, changed) {
    if (changed.includes('basemap')) instances.get(el)?.setBasemap(ctx.state.basemap);
  },
};

