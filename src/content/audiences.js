// Audience versions. Each version reorders and re-words the same building
// blocks (sections) for one kind of guest. Copy here is the marketing layer;
// facts live in src/data/*.json and src/content/site.js.
//
// Shape:
//   id, label, short (Lab chip), season, months (best travel months),
//   titleSuffix: browser-tab title after the brand (main.js),
//   hero: { kicker, title, subtitle, photo, slides?, ctas: [{label, href}] },
//   highlights: [{ icon, title, text, href?, todo? }],  // [] = defaults in highlights.js
//     A highlight with a todo is an unconfirmed owner fact: phrase it as "ask us".
//   highlightsHeading: heading above the highlight tiles (highlights.js),
//   sections: [...section ids in display order],
//   focus: { beachTags, poiTags, activityTags }  // default filters
//   inquiry: { purpose, apartment?, placeholder? } // inquiry form preset ('house' = whole house)
//   hero.primaryLabel: optional label of the main hero button (default "Ask about dates")
//   nicheSegment: segment id in src/data/niches.json (read by the niche section)
//   unlisted: true = reachable by link only, not offered in audience lists
//
// Strings may be plain or { en, de, sl, hr, it } objects.
// Place names stay in their local form in every language (Nin, Kraljičina
// plaža, Velebit, Pag, Zadar); German keeps its established "Königinnenstrand".
//
// Every number in this file is backed by src/data/*.json or site.js:
//   nearest beach (Sabunike Mol) ~500 m / 6 min on foot, beaches.json
//   Queen's Beach nearest end ~1.4 km / 17 min on foot (5 km/h, beaches.js ROAD table)
//   Nin lagoon mud ~2.3 km by road / ~9 min by bike (beaches.js ROAD table)
//   Solana Nin 3.31 km straight line (niches.json); Nin old town ~2.6 km (pois.json)
//   Ždrijac ~5 km / 19 min by bike (16 km/h, beaches.js ROAD table); ZAD ~30 km / 36 min by road, travel.json
//   up to 16 guests = 6 + 4 + 2 + 4 platform maxGuests, site.js APARTMENTS
//   temperatures, climate.json; route lengths, cycling.json
//
// Focus tags use the data's own vocabulary:
//   beaches.json bestFor: family swimming kite quiet sunset snorkel dogs party
//   pois.json audienceTags: family cyclist retreat culture food kite dog wellness
//   activities.json audienceTags: free text, e.g. 'families', 'kitesurfers', 'bird watchers'

// The form follows the "book direct" pitch; travel logistics come after it.
const CORE_END = ['inquiry', 'travel', 'faq', 'footer'];

export const AUDIENCES = [
  // --- Main versions --------------------------------------------------------
  {
    id: 'general',
    label: { en: 'Everyone', de: 'Alle', sl: 'Za vse', hr: 'Za sve', it: 'Per tutti' },
    short: 'General',
    titleSuffix: { en: 'Sabunike, Croatia', de: 'Sabunike, Kroatien', sl: 'Sabunike, Hrvaška', hr: 'Sabunike, Hrvatska', it: 'Sabunike, Croazia' },
    season: { en: 'May – October', de: 'Mai – Oktober', sl: 'maj – oktober', hr: 'svibanj – listopad', it: 'maggio – ottobre' },
    months: [5, 6, 7, 8, 9, 10],
    hero: {
      kicker: { en: 'Sabunike · Nin · Zadar', de: 'Sabunike · Nin · Zadar', sl: 'Sabunike · Nin · Zadar', hr: 'Sabunike · Nin · Zadar', it: 'Sabunike · Nin · Zadar' },
      title: {
        en: 'Four apartments, a six-minute walk from shallow sandy beaches',
        de: 'Vier Apartments, sechs Gehminuten von flachen Sandstränden',
        sl: 'Štirje apartmaji, šest minut hoje do plitvih peščenih plaž',
        hr: 'Četiri apartmana, šest minuta hoda do plitkih pješčanih plaža',
        it: 'Quattro appartamenti a sei minuti a piedi da spiagge di sabbia con acqua bassa',
      },
      subtitle: {
        en: 'A house on a quiet lane in Sabunike, with the Velebit mountains across the water. Book directly with us: no platform in between taking its commission.',
        de: 'Ein Haus in einer ruhigen Straße in Sabunike, gegenüber das Velebit-Gebirge. Buchen Sie direkt bei uns: keine Plattform dazwischen, die Provision kassiert.',
        sl: 'Hiša na mirni ulici v Sabunikah, z Velebitom na drugi strani morja. Rezervirajte neposredno pri nas: vmes ni platforme, ki bi si vzela provizijo.',
        hr: 'Kuća u mirnoj ulici u Sabunikama, s Velebitom s druge strane mora. Rezervirajte izravno kod nas: između nas nema platforme koja uzima proviziju.',
        it: 'Una casa in una stradina tranquilla di Sabunike, con il Velebit al di là del mare. Prenotate direttamente con noi: nessuna piattaforma in mezzo a prendersi la commissione.',
      },
      photo: '20210810_184724.jpg',
    },
    highlights: [
      {
        icon: 'wave',
        href: '#beaches',
        title: { en: 'Shallow sand, six minutes on foot', de: 'Flacher Sand, sechs Minuten zu Fuß', sl: 'Plitev pesek, šest minut peš', hr: 'Plitki pijesak, šest minuta pješice', it: 'Sabbia e acqua bassa, a sei minuti a piedi' },
        text: {
          en: 'The nearest beach is about 500 m from the gate, on a seabed so gentle that children can paddle a long way out.',
          de: 'Der nächste Strand liegt etwa 500 m vom Tor, der Meeresboden fällt so sanft ab, dass Kinder weit hinauswaten können.',
          sl: 'Najbližja plaža je približno 500 m od dvoriščnih vrat, dno pa se spušča tako položno, da lahko otroci zabredejo daleč v morje.',
          hr: 'Najbliža plaža udaljena je oko 500 m od dvorišnih vrata, a dno se spušta tako blago da djeca mogu daleko zagaziti u more.',
          it: 'La spiaggia più vicina è a circa 500 m dal cancello, su un fondale così dolce che i bambini possono camminare in acqua fino a lontano.',
        },
      },
      {
        icon: 'mountain',
        title: { en: 'Velebit across the water', de: 'Velebit gegenüber', sl: 'Velebit na drugi strani morja', hr: 'Velebit preko mora', it: 'Il Velebit oltre il mare' },
        text: {
          en: 'From the Sabunike shore you look across the channel to the Velebit range. Apartment 2’s loggia has a partial sea view.',
          de: 'Vom Ufer von Sabunike blicken Sie über den Kanal auf das Velebit-Gebirge. Die Loggia von Apartment 2 hat teilweise Meerblick.',
          sl: 'Z obale v Sabunikah se čez kanal odpre pogled na Velebit. Z lože apartmaja 2 je delni pogled na morje.',
          hr: 'S obale u Sabunikama pogled seže preko kanala do Velebita. S lođe apartmana 2 pruža se djelomičan pogled na more.',
          it: 'Dalla riva di Sabunike lo sguardo attraversa il canale fino alla catena del Velebit. La loggia dell’appartamento 2 ha una parziale vista mare.',
        },
      },
      {
        icon: 'users',
        href: '#villa',
        title: { en: 'Four apartments, one garden', de: 'Vier Apartments, ein Garten', sl: 'Štirje apartmaji, en vrt', hr: 'Četiri apartmana, jedan vrt', it: 'Quattro appartamenti, un giardino' },
        text: {
          en: 'Book one apartment, or the whole house for up to 16 guests.',
          de: 'Ein Apartment buchen oder das ganze Haus für bis zu 16 Gäste.',
          sl: 'Rezervirajte en apartma ali celo hišo za do 16 gostov.',
          hr: 'Rezervirajte jedan apartman ili cijelu kuću za do 16 gostiju.',
          it: 'Prenotate un appartamento o tutta la casa, fino a 16 ospiti.',
        },
      },
      {
        icon: 'euro',
        href: '#direct',
        title: { en: 'Book directly with us', de: 'Direkt bei uns buchen', sl: 'Rezervirajte neposredno pri nas', hr: 'Rezervirajte izravno kod nas', it: 'Prenotate direttamente con noi' },
        text: {
          en: 'No platform commission in between. Write to us and ask for a direct price.',
          de: 'Keine Plattformprovision dazwischen. Schreiben Sie uns und fragen Sie nach dem Direktpreis.',
          sl: 'Brez provizije platforme vmes. Pišite nam in povprašajte za neposredno ceno.',
          hr: 'Bez provizije platforme u sredini. Pišite nam i pitajte za izravnu cijenu.',
          it: 'Nessuna commissione di piattaforma in mezzo. Scriveteci e chiedete il prezzo diretto.',
        },
      },
    ],
    sections: ['hero', 'highlights', 'villa', 'beaches', 'explore', 'activities', 'seasons', 'direct', ...CORE_END],
    focus: { beachTags: [], poiTags: [], activityTags: [] },
    inquiry: { purpose: 'holiday' },
  },
  {
    id: 'families',
    label: { en: 'Families · summer', de: 'Familien · Sommer', sl: 'Družine · poletje', hr: 'Obitelji · ljeto', it: 'Famiglie · estate' },
    short: 'Families',
    titleSuffix: { en: 'Family beach holidays in Sabunike', de: 'Familienurlaub am Strand in Sabunike', sl: 'Družinske počitnice ob morju v Sabunikah', hr: 'Obiteljski odmor na plaži u Sabunikama', it: 'Vacanze al mare in famiglia a Sabunike' },
    season: { en: 'June – September', de: 'Juni – September', sl: 'junij – september', hr: 'lipanj – rujan', it: 'giugno – settembre' },
    months: [6, 7, 8, 9],
    hero: {
      kicker: { en: 'Summer holidays with kids', de: 'Sommerferien mit Kindern', sl: 'Poletne počitnice z otroki', hr: 'Ljetni odmor s djecom', it: 'Vacanze estive con i bambini' },
      title: {
        en: 'Shallow and sandy: a beach holiday small feet can walk to',
        de: 'Flach und sandig: Strandurlaub, zu dem kleine Füße laufen können',
        sl: 'Plitvo in peščeno: plaža, do katere tudi najmlajši pridejo peš',
        hr: 'Plitko i pješčano: plaža do koje i najmanji stignu pješice',
        it: 'Acqua bassa e sabbia: una spiaggia che anche i più piccoli raggiungono a piedi',
      },
      subtitle: {
        en: 'The nearest beach is a six-minute walk away, on a seabed so gentle that children can paddle a long way out. Back at the house: a lawn, a grill and a ground-floor apartment with its own outdoor kitchen.',
        de: 'Der nächste Strand ist sechs Gehminuten entfernt, der Meeresboden fällt so sanft ab, dass Kinder weit hinauswaten können. Zurück am Haus: Rasen, Grill und ein Apartment im Erdgeschoss mit eigener Außenküche.',
        sl: 'Do najbližje plaže je šest minut hoje, dno pa se spušča tako položno, da lahko otroci zabredejo daleč v morje. Pri hiši vas čakajo trata, žar in pritlični apartma z lastno zunanjo kuhinjo.',
        hr: 'Do najbliže plaže ima šest minuta hoda, a dno se spušta tako blago da djeca mogu daleko zagaziti u more. Kod kuće vas čekaju travnjak, roštilj i apartman u prizemlju s vlastitom vanjskom kuhinjom.',
        it: 'La spiaggia più vicina è a sei minuti a piedi, su un fondale così dolce che i bambini possono camminare in acqua fino a lontano. A casa vi aspettano un prato, il barbecue e un appartamento al piano terra con la sua cucina esterna.',
      },
      photo: 'napros/20210918_155653.jpg',
    },
    highlights: [
      {
        icon: 'wave',
        href: '#beaches',
        title: { en: 'Shallow, sandy beaches', de: 'Flache Sandstrände', sl: 'Plitve peščene plaže', hr: 'Plitke pješčane plaže', it: 'Spiagge di sabbia con acqua bassa' },
        text: {
          en: 'Sabunike’s sand slopes gently into the sea. Škrapavac, about 2.3 km away, adds a playground and a small water park.',
          de: 'Der Sand von Sabunike fällt sanft ins Meer ab. Škrapavac, etwa 2,3 km entfernt, hat dazu einen Spielplatz und einen kleinen Wasserpark.',
          sl: 'Pesek v Sabunikah se položno spušča v morje. Škrapavac, približno 2,3 km stran, ima še otroško igrišče in manjši vodni park.',
          hr: 'Pijesak u Sabunikama blago se spušta u more. Škrapavac, oko 2,3 km dalje, ima i dječje igralište te mali vodeni park.',
          it: 'A Sabunike la sabbia scende dolcemente in mare. Škrapavac, a circa 2,3 km, offre anche un parco giochi e un piccolo parco acquatico.',
        },
      },
      {
        icon: 'grill',
        title: { en: 'Garden & grill', de: 'Garten & Grill', sl: 'Vrt in žar', hr: 'Vrt i roštilj', it: 'Giardino e barbecue' },
        text: {
          en: 'A lawn to run around on, fruit trees and a built-in barbecue for long evenings.',
          de: 'Rasen zum Toben, Obstbäume und ein gemauerter Grill für lange Abende.',
          sl: 'Trata za tekanje naokrog, sadno drevje in zidan žar za dolge večere.',
          hr: 'Travnjak za trčanje, voćke i zidani roštilj za duge večeri.',
          it: 'Un prato dove correre, alberi da frutto e un barbecue in muratura per le lunghe serate.',
        },
      },
      {
        icon: 'bed',
        href: '#villa',
        title: { en: 'Ground-floor apartment', de: 'Apartment im Erdgeschoss', sl: 'Pritlični apartma', hr: 'Apartman u prizemlju', it: 'Appartamento al piano terra' },
        text: {
          en: 'Apartment 1 is on the ground floor, a few steps up from the garden, with its own outdoor kitchen.',
          de: 'Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Garten, mit eigener Außenküche.',
          sl: 'Apartma 1 je v pritličju, nekaj stopnic nad vrtom, in ima lastno zunanjo kuhinjo.',
          hr: 'Apartman 1 nalazi se u prizemlju, nekoliko stepenica iznad vrta, i ima vlastitu vanjsku kuhinju.',
          it: 'L’appartamento 1 è al piano terra, pochi gradini sopra il giardino, con una cucina esterna tutta sua.',
        },
        todo: 'Confirm the number of steps from the garden up to Apartment 1',
      },
      {
        icon: 'leaf',
        title: { en: 'A quiet lane', de: 'Eine ruhige Straße', sl: 'Mirna ulica', hr: 'Mirna ulica', it: 'Una stradina tranquilla' },
        text: {
          en: 'Put kandelica is a residential lane, with parking on the gated driveway.',
          de: 'Put kandelica ist eine Wohnstraße, geparkt wird in der umzäunten Einfahrt.',
          sl: 'Put kandelica je stanovanjska ulica, parkirate pa na ograjenem dovozu.',
          hr: 'Put kandelica je stambena ulica, a parkira se na ograđenom prilazu.',
          it: 'Put kandelica è una via residenziale, con parcheggio nel vialetto chiuso da un cancello.',
        },
      },
    ],
    sections: ['hero', 'highlights', 'beaches', 'villa', 'activities', 'explore', 'seasons', 'direct', ...CORE_END],
    focus: { beachTags: ['family'], poiTags: ['family'], activityTags: ['families', 'kids'] },
    inquiry: { purpose: 'family' },
  },
  {
    id: 'cyclists',
    label: { en: 'Cyclists · spring & autumn', de: 'Radfahrer · Frühling & Herbst', sl: 'Kolesarji · pomlad in jesen', hr: 'Biciklisti · proljeće i jesen', it: 'Ciclisti · primavera e autunno' },
    short: 'Cyclists',
    titleSuffix: { en: 'Cycling base near Nin & Zadar', de: 'Radurlaub bei Nin & Zadar', sl: 'Kolesarsko izhodišče pri Ninu in Zadru', hr: 'Biciklistička baza kod Nina i Zadra', it: 'Base per il ciclismo vicino a Nin e Zadar' },
    season: { en: 'March – June, September – November', de: 'März – Juni, September – November', sl: 'marec – junij, september – november', hr: 'ožujak – lipanj, rujan – studeni', it: 'marzo – giugno, settembre – novembre' },
    months: [3, 4, 5, 6, 9, 10, 11],
    hero: {
      kicker: { en: 'Road · gravel · Velebit climbs', de: 'Straße · Schotter · Velebit-Anstiege', sl: 'Cesta · makadam · vzponi na Velebit', hr: 'Cesta · makadam · usponi na Velebit', it: 'Strada · gravel · salite sul Velebit' },
      title: {
        en: 'Flat coast to warm up, the Velebit to climb, all from the driveway',
        de: 'Flache Küste zum Einrollen, der Velebit zum Klettern, alles ab der Einfahrt',
        sl: 'Ravna obala za ogrevanje, Velebit za vzpone, vse izpred hiše',
        hr: 'Ravna obala za zagrijavanje, Velebit za uspone, sve od kućnog prilaza',
        it: 'Costa pianeggiante per scaldarsi, il Velebit da scalare, tutto dal vialetto di casa',
      },
      subtitle: {
        en: 'Eight routes start at our gate, from a flat 9.5 km loop to Nin to the 172 km ride up the Mali Alan pass. In April, May, September and October, afternoons reach about 18–25 °C.',
        de: 'Acht Routen starten an unserem Tor, von der flachen 9,5-km-Runde nach Nin bis zur 172-km-Tour auf den Mali-Alan-Pass. Im April, Mai, September und Oktober werden es nachmittags etwa 18–25 °C.',
        sl: 'Pri naših vratih se začne osem tras, od ravnega 9,5-kilometrskega kroga do Nina do 172-kilometrske ture na prelaz Mali Alan. Aprila, maja, septembra in oktobra se popoldne ogreje na približno 18–25 °C.',
        hr: 'Osam ruta kreće s naših vrata, od ravnog kruga od 9,5 km do Nina do vožnje od 172 km na prijevoj Mali Alan. U travnju, svibnju, rujnu i listopadu popodne je oko 18–25 °C.',
        it: 'Otto percorsi partono dal nostro cancello, dal giro pianeggiante di 9,5 km fino a Nin ai 172 km della salita al passo Mali Alan. Ad aprile, maggio, settembre e ottobre i pomeriggi arrivano a circa 18–25 °C.',
      },
      photo: 'napros/20210918_110141.jpg',
    },
    highlights: [
      {
        icon: 'bike',
        href: '#cycling',
        title: { en: 'Ride from the gate', de: 'Ab dem Tor losfahren', sl: 'Na kolo kar pred vrati', hr: 'Na bicikl odmah pred vratima', it: 'In sella dal cancello' },
        text: {
          en: 'Flat coastal roads to Nin and Privlaka start outside the house, so you warm up without loading the car.',
          de: 'Flache Küstenstraßen nach Nin und Privlaka beginnen vor dem Haus, zum Einrollen brauchen Sie kein Auto.',
          sl: 'Ravne obalne ceste proti Ninu in Privlaki se začnejo pred hišo, zato se ogrejete brez nalaganja koles v avto.',
          hr: 'Ravne obalne ceste prema Ninu i Privlaci počinju ispred kuće, pa se zagrijavate bez utovara bicikala u auto.',
          it: 'Le strade costiere pianeggianti verso Nin e Privlaka partono davanti a casa: vi scaldate senza caricare l’auto.',
        },
      },
      {
        icon: 'sun',
        href: '#seasons',
        title: { en: 'Mild shoulder seasons', de: 'Milde Nebensaison', sl: 'Mila pred- in posezona', hr: 'Blaga predsezona i posezona', it: 'Mezze stagioni miti' },
        text: {
          en: 'In April, May, September and October afternoons reach about 18–25 °C, and the coast is quieter than in high summer.',
          de: 'Im April, Mai, September und Oktober werden es nachmittags etwa 18–25 °C, und an der Küste ist es ruhiger als im Hochsommer.',
          sl: 'Aprila, maja, septembra in oktobra se popoldne ogreje na približno 18–25 °C, ob obali pa je mirneje kot sredi poletja.',
          hr: 'U travnju, svibnju, rujnu i listopadu popodne je oko 18–25 °C, a na obali je mirnije nego usred ljeta.',
          it: 'Ad aprile, maggio, settembre e ottobre i pomeriggi arrivano a circa 18–25 °C e la costa è più tranquilla che in piena estate.',
        },
      },
      {
        icon: 'mountain',
        href: '#cycling',
        title: { en: 'Velebit climbs', de: 'Velebit-Anstiege', sl: 'Vzponi na Velebit', hr: 'Usponi na Velebit', it: 'Salite sul Velebit' },
        text: {
          en: 'The longest route, about 172 km, tops out at the Mali Alan pass (about 1,050 m), with almost 2,000 m of climbing in all.',
          de: 'Die längste Route, etwa 172 km, führt hinauf zum Mali-Alan-Pass (etwa 1.050 m), mit insgesamt fast 2.000 Höhenmetern.',
          sl: 'Najdaljša trasa, dolga približno 172 km, doseže najvišjo točko na prelazu Mali Alan (približno 1050 m), skupaj pa ima skoraj 2000 višinskih metrov.',
          hr: 'Najdulja ruta, oko 172 km, penje se do prijevoja Mali Alan (oko 1050 m), s ukupno gotovo 2000 m uspona.',
          it: 'Il percorso più lungo, circa 172 km, culmina al passo Mali Alan (circa 1.050 m), con quasi 2.000 m di dislivello complessivo.',
        },
      },
      {
        icon: 'parking',
        href: '#inquiry',
        title: { en: 'Ask us about bike storage', de: 'Fragen Sie nach dem Radabstellplatz', sl: 'Povprašajte nas o hrambi koles', hr: 'Pitajte nas o spremanju bicikala', it: 'Chiedeteci dove riporre le bici' },
        text: {
          en: 'Tell us how many bikes you bring, and we will tell you how we can store them for your group.',
          de: 'Sagen Sie uns, wie viele Räder Sie mitbringen, und wir sagen Ihnen, wie wir sie für Ihre Gruppe unterbringen.',
          sl: 'Sporočite nam, koliko koles pripeljete, mi pa vam povemo, kako jih lahko shranimo za vašo skupino.',
          hr: 'Javite nam koliko bicikala donosite, a mi ćemo vam reći kako ih možemo spremiti za vašu grupu.',
          it: 'Diteci quante bici portate e vi diremo come possiamo sistemarle per il vostro gruppo.',
        },
        todo: 'Confirm bike storage (lockable room? hose? tools?)',
      },
    ],
    sections: ['hero', 'highlights', 'cycling', 'seasons', 'villa', 'explore', 'direct', ...CORE_END],
    focus: { beachTags: [], poiTags: ['cyclist'], activityTags: ['cyclists', 'e-bikers'] },
    inquiry: { purpose: 'cycling' },
  },
  {
    id: 'retreats',
    label: { en: 'Company retreats', de: 'Firmen-Retreats', sl: 'Poslovni retreati', hr: 'Poslovni retreati', it: 'Ritiri aziendali' },
    short: 'Retreats',
    titleSuffix: { en: 'Whole-house team retreats near Zadar', de: 'Team-Retreats im ganzen Haus bei Zadar', sl: 'Cela hiša za ekipne retreate pri Zadru', hr: 'Cijela kuća za timske retreate kod Zadra', it: 'Tutta la casa per ritiri di team vicino a Zadar' },
    season: { en: 'May – June, September – October', de: 'Mai – Juni, September – Oktober', sl: 'maj – junij, september – oktober', hr: 'svibanj – lipanj, rujan – listopad', it: 'maggio – giugno, settembre – ottobre' },
    months: [5, 6, 9, 10],
    hero: {
      kicker: { en: 'Whole-house offsites for small teams', de: 'Das ganze Haus für kleine Teams', sl: 'Cela hiša za manjše ekipe', hr: 'Cijela kuća za manje timove', it: 'Tutta la casa per piccoli team' },
      title: {
        en: 'Take the whole house. Bring the team. Leave the open-plan office behind.',
        de: 'Das ganze Haus für Ihr Team. Das Großraumbüro bleibt zu Hause.',
        sl: 'Vzemite celo hišo. Pripeljite ekipo. Odprto pisarno pustite doma.',
        hr: 'Uzmite cijelu kuću. Povedite tim. Otvoreni ured ostavite iza sebe.',
        it: 'Prendete tutta la casa. Portate il team. Lasciatevi alle spalle l’open space.',
      },
      subtitle: {
        en: 'Four apartments with their own entrances, one garden, one grill, up to 16 guests. About 36 minutes by road from Zadar Airport, with kite lessons, the Nin salt works and wine tastings close by.',
        de: 'Vier Apartments mit eigenem Eingang, ein Garten, ein Grill, bis zu 16 Gäste. Rund 36 Minuten Fahrt vom Flughafen Zadar, mit Kitekursen, den Salinen von Nin und Weinproben in der Nähe.',
        sl: 'Štirje apartmaji z ločenimi vhodi, en vrt, en žar, do 16 gostov. Približno 36 minut vožnje od letališča Zadar, v bližini pa tečaji kajtanja, soline v Ninu in degustacije vin.',
        hr: 'Četiri apartmana s vlastitim ulazima, jedan vrt, jedan roštilj, do 16 gostiju. Oko 36 minuta vožnje od Zračne luke Zadar, a u blizini su tečajevi kitesurfinga, Solana Nin i kušanja vina.',
        it: 'Quattro appartamenti con ingressi indipendenti, un giardino, un barbecue, fino a 16 ospiti. Circa 36 minuti in auto dall’aeroporto di Zadar, con lezioni di kite, le saline di Nin e degustazioni di vino a due passi.',
      },
      photo: '20210720_171634.jpg',
      primaryLabel: { en: 'Request a retreat proposal', de: 'Retreat-Angebot anfragen', sl: 'Zahtevajte ponudbo za retreat', hr: 'Zatražite ponudu za retreat', it: 'Richiedete una proposta' },
    },
    highlights: [],
    // No 'activities': the retreat section already lists the team activities.
    sections: ['hero', 'highlights', 'retreat', 'villa', 'seasons', 'direct', ...CORE_END],
    focus: { beachTags: [], poiTags: ['retreat'], activityTags: ['companies/retreats', 'team building'] },
    inquiry: {
      purpose: 'retreat',
      apartment: 'house',
      placeholder: {
        en: 'Team size, dates, workshop space needed, one invoice for the company?',
        de: 'Teamgröße, Termin, Workshop-Raum nötig, eine Rechnung für die Firma?',
        sl: 'Velikost ekipe, termin, potrebujete prostor za delavnice, en račun za podjetje?',
        hr: 'Veličina tima, termin, treba li prostor za radionice, jedan račun za tvrtku?',
        it: 'Dimensione del team, date, serve uno spazio per workshop, un’unica fattura per l’azienda?',
      },
    },
  },

  // --- Niche versions (each opens with the 'niche' section) -----------------
  {
    id: 'kite',
    label: { en: 'Kite & windsurf', de: 'Kite & Windsurf', sl: 'Kajtanje in jadranje na deski', hr: 'Kite i windsurf', it: 'Kite e windsurf' },
    short: 'Kite',
    titleSuffix: { en: 'Kite & windsurf stays near Nin', de: 'Kite- & Windsurfurlaub bei Nin', sl: 'Kajtanje in jadranje na deski pri Ninu', hr: 'Kite i windsurf odmor kod Nina', it: 'Soggiorni kite e windsurf vicino a Nin' },
    season: { en: 'April – October', de: 'April – Oktober', sl: 'april – oktober', hr: 'travanj – listopad', it: 'aprile – ottobre' },
    months: [4, 5, 6, 7, 8, 9, 10],
    hero: {
      kicker: { en: 'Nin lagoon · Ždrijac · Queen’s Beach', de: 'Lagune von Nin · Ždrijac · Königinnenstrand', sl: 'Ninska laguna · Ždrijac · Kraljičina plaža', hr: 'Ninska laguna · Ždrijac · Kraljičina plaža', it: 'Laguna di Nin · Ždrijac · Kraljičina plaža' },
      title: {
        en: 'Shallow, sandy water to learn on, a short ride from the gate',
        de: 'Flaches, sandiges Wasser zum Lernen, kurz vom Tor entfernt',
        sl: 'Plitvo morje s peščenim dnom za učenje, le kratko vožnjo od vrat',
        hr: 'Plitko more s pješčanim dnom za učenje, kratka vožnja od vrata',
        it: 'Acqua bassa su fondo sabbioso per imparare, a pochi minuti dal cancello',
      },
      subtitle: {
        en: 'Queen’s Beach, where windsurfers ride the afternoon maestral, is about 17 minutes on foot. Ždrijac, Nin’s kite beach, is about 19 minutes by bike. Your car and gear stay behind our gate.',
        de: 'Zum Königinnenstrand, wo Windsurfer den Nachmittags-Maestral nutzen, sind es etwa 17 Minuten zu Fuß. Ždrijac, der Kitestrand von Nin, liegt etwa 19 Minuten mit dem Rad entfernt. Auto und Ausrüstung bleiben hinter unserem Tor.',
        sl: 'Do Kraljičine plaže, kjer jadralci na deski lovijo popoldanski maestral, je približno 17 minut hoje. Do Ždrijaca, ninske plaže za kajtanje, je s kolesom približno 19 minut. Avto in oprema ostaneta za našimi vrati.',
        hr: 'Do Kraljičine plaže, gdje windsurferi hvataju popodnevni maestral, ima oko 17 minuta hoda. Do Ždrijca, ninske kite plaže, ima oko 19 minuta biciklom. Auto i oprema ostaju iza naših vrata.',
        it: 'Kraljičina plaža, dove i windsurfisti cavalcano il maestrale del pomeriggio, è a circa 17 minuti a piedi. Ždrijac, la spiaggia del kite di Nin, è a circa 19 minuti in bici. Auto e attrezzatura restano dietro il nostro cancello.',
      },
      photo: 'napros/20210918_155421.jpg',
      slides: ['napros/20210918_155653.jpg', 'napros/20210918_110141.jpg', 'driveway.jpg'],
      ctas: [{ label: { en: 'Spots & wind', de: 'Spots & Wind', sl: 'Lokacije in veter', hr: 'Spotovi i vjetar', it: 'Spot e vento' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'What kiters need to know', de: 'Was Kiter wissen müssen', sl: 'Kaj morajo vedeti kajterji', hr: 'Što kiteri trebaju znati', it: 'Cosa deve sapere chi fa kite' },
    highlights: [
      {
        icon: 'kite',
        href: '#beaches',
        title: { en: 'Two spots within reach', de: 'Zwei Spots in der Nähe', sl: 'Dve lokaciji v bližini', hr: 'Dva spota nadohvat ruke', it: 'Due spot a portata di mano' },
        text: {
          en: 'Windsurf at Queen’s Beach, about 1.4 km on foot. Kite at Ždrijac, about 5 km by bike. Both have a shallow, sandy bottom.',
          de: 'Windsurfen am Königinnenstrand, etwa 1,4 km zu Fuß. Kiten in Ždrijac, etwa 5 km mit dem Rad. Beide mit flachem Sandboden.',
          sl: 'Jadranje na deski na Kraljičini plaži, približno 1,4 km peš. Kajtanje na Ždrijacu, približno 5 km s kolesom. Obe imata plitvo peščeno dno.',
          hr: 'Windsurf na Kraljičinoj plaži, oko 1,4 km pješice. Kite na Ždrijcu, oko 5 km biciklom. Obje imaju plitko pješčano dno.',
          it: 'Windsurf a Kraljičina plaža, a circa 1,4 km a piedi. Kite a Ždrijac, a circa 5 km in bici. Entrambe hanno un fondale basso e sabbioso.',
        },
      },
      {
        icon: 'wind',
        href: '#seasons',
        title: { en: 'A summer breeze to learn in', de: 'Sommerwind zum Lernen', sl: 'Poletni veter za učenje', hr: 'Ljetni vjetar za učenje', it: 'Una brezza estiva per imparare' },
        text: {
          en: 'In July the maestral blows on more than half of all days: calm mornings, a steady north-westerly in the afternoon. Wind is never guaranteed.',
          de: 'Im Juli weht der Maestral an mehr als der Hälfte der Tage: ruhige Vormittage, nachmittags eine stetige Brise aus Nordwest. Wind ist nie garantiert.',
          sl: 'Julija maestral piha več kot polovico dni: mirna jutra, popoldne pa enakomeren severozahodnik. Vetra nikoli ni mogoče zagotoviti.',
          hr: 'U srpnju maestral puše više od polovice dana: mirna jutra, a popodne stalan sjeverozapadnjak. Vjetar nikad nije zajamčen.',
          it: 'A luglio il maestrale soffia per più di metà dei giorni: mattine calme e, nel pomeriggio, una brezza costante da nord-ovest. Il vento non è mai garantito.',
        },
      },
      {
        icon: 'calendar',
        title: { en: 'Best-wind months, per a local school', de: 'Beste Windmonate laut einer Schule vor Ort', sl: 'Najboljši meseci za veter po mnenju lokalne šole', hr: 'Najbolji mjeseci za vjetar prema lokalnoj školi', it: 'I mesi migliori per il vento, secondo una scuola locale' },
        text: {
          en: 'A windsurf school on Queen’s Beach names April, May, September and October as its best wind months. Check the forecast before you book.',
          de: 'Eine Windsurfschule am Königinnenstrand nennt April, Mai, September und Oktober als ihre besten Windmonate. Prüfen Sie vor der Buchung die Vorhersage.',
          sl: 'Šola jadranja na deski na Kraljičini plaži navaja april, maj, september in oktober kot svoje najboljše mesece za veter. Pred rezervacijo preverite napoved.',
          hr: 'Škola windsurfa na Kraljičinoj plaži navodi travanj, svibanj, rujan i listopad kao svoje najbolje mjesece za vjetar. Prije rezervacije provjerite prognozu.',
          it: 'Una scuola di windsurf su Kraljičina plaža indica aprile, maggio, settembre e ottobre come i suoi mesi migliori per il vento. Controllate le previsioni prima di prenotare.',
        },
      },
      {
        icon: 'parking',
        href: '#inquiry',
        title: { en: 'Ask us about your gear', de: 'Fragen Sie uns nach Ihrer Ausrüstung', sl: 'Povprašajte nas o opremi', hr: 'Pitajte nas za opremu', it: 'Chiedeteci dell’attrezzatura' },
        text: {
          en: 'Park inside the gate. kroati.de lists an outdoor shower for rinsing gear; ask us about storage.',
          de: 'Parken hinter dem Tor. kroati.de nennt eine Außendusche zum Abspülen der Ausrüstung; fragen Sie uns nach einem Abstellplatz.',
          sl: 'Parkirate za vrati. kroati.de navaja zunanjo prho za izpiranje opreme; o shranjevanju nas povprašajte.',
          hr: 'Parkirate iza vrata. kroati.de navodi vanjski tuš za ispiranje opreme; za spremanje nas pitajte.',
          it: 'Parcheggiate dentro il cancello. kroati.de indica una doccia esterna per sciacquare l’attrezzatura; chiedeteci dove riporla.',
        },
        todo: 'Confirm the outdoor shower (kroati.de lists it) and whether there is lockable gear storage',
      },
    ],
    sections: ['hero', 'niche', 'beaches', 'seasons', 'villa', 'explore', 'activities', 'direct', ...CORE_END],
    focus: { beachTags: ['kite'], poiTags: ['kite'], activityTags: ['kitesurfers', 'windsurfers'] },
    inquiry: { purpose: 'kite' },
    nicheSegment: 'kitesurfers',
  },
  {
    id: 'reunion',
    label: { en: 'Family reunions & groups', de: 'Familientreffen & Gruppen', sl: 'Družinska srečanja in skupine', hr: 'Obiteljska okupljanja i grupe', it: 'Riunioni di famiglia e gruppi' },
    short: 'Reunions',
    titleSuffix: { en: 'Family reunions for up to 16 guests', de: 'Familientreffen für bis zu 16 Gäste', sl: 'Družinska srečanja za do 16 gostov', hr: 'Obiteljska okupljanja za do 16 gostiju', it: 'Riunioni di famiglia fino a 16 ospiti' },
    season: { en: 'School holidays, Easter & Whitsun', de: 'Schulferien, Ostern & Pfingsten', sl: 'Šolske počitnice, velika noč in binkošti', hr: 'Školski praznici, Uskrs i Duhovi', it: 'Vacanze scolastiche, Pasqua e Pentecoste' },
    months: [4, 5, 6, 7, 8, 9],
    hero: {
      kicker: { en: 'Family reunions · friend groups', de: 'Familientreffen · Freundesgruppen', sl: 'Družinska srečanja · skupine prijateljev', hr: 'Obiteljska okupljanja · grupe prijatelja', it: 'Riunioni di famiglia · gruppi di amici' },
      title: {
        en: 'One roof for the whole family, a front door for every household',
        de: 'Ein Dach für die ganze Familie, eine Haustür für jeden Haushalt',
        sl: 'Ena streha za vso družino, lastna vhodna vrata za vsako gospodinjstvo',
        hr: 'Jedan krov za cijelu obitelj, vlastita ulazna vrata za svako kućanstvo',
        it: 'Un tetto per tutta la famiglia, una porta d’ingresso per ogni nucleo',
      },
      subtitle: {
        en: 'Four apartments for up to 16 guests, and everyone meets at the grill in the garden. Grandparents take the ground floor; the children head for the shallow sand six minutes away.',
        de: 'Vier Apartments für bis zu 16 Gäste, getroffen wird sich am Grill im Garten. Die Großeltern nehmen das Erdgeschoss, die Kinder laufen in sechs Minuten zum flachen Sandstrand.',
        sl: 'Štirje apartmaji za do 16 gostov, vsi pa se dobite ob žaru na vrtu. Stari starši se namestijo v pritličju, otroci pa stečejo na plitvo peščeno plažo, šest minut stran.',
        hr: 'Četiri apartmana za do 16 gostiju, a svi se nalaze kod roštilja u vrtu. Bake i djedovi smjeste se u prizemlju, a djeca jure na plitku pješčanu plažu šest minuta dalje.',
        it: 'Quattro appartamenti fino a 16 ospiti, e tutti si ritrovano al barbecue in giardino. I nonni prendono il piano terra; i bambini corrono verso la sabbia bassa a sei minuti da casa.',
      },
      photo: 'grillarea.jpg',
      slides: ['20210720_171634.jpg', 'app1-terrace.jpg', 'napros/20210918_155653.jpg'],
      primaryLabel: { en: 'Ask about the whole house', de: 'Nach dem ganzen Haus fragen', sl: 'Povprašajte za celo hišo', hr: 'Upit za cijelu kuću', it: 'Richiedete tutta la casa' },
      ctas: [{ label: { en: 'Plan the whole house', de: 'Das ganze Haus planen', sl: 'Načrtujte celo hišo', hr: 'Planirajte cijelu kuću', it: 'Organizzate tutta la casa' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'Room for the whole family', de: 'Platz für die ganze Familie', sl: 'Prostor za vso družino', hr: 'Mjesta za cijelu obitelj', it: 'Spazio per tutta la famiglia' },
    highlights: [
      {
        icon: 'users',
        href: '#villa',
        title: { en: 'Up to 16 guests in four apartments', de: 'Bis zu 16 Gäste in vier Apartments', sl: 'Do 16 gostov v štirih apartmajih', hr: 'Do 16 gostiju u četiri apartmana', it: 'Fino a 16 ospiti in quattro appartamenti' },
        text: {
          en: 'Two two-bedroom and two one-bedroom apartments, for 6 + 4 + 2 + 4 guests as listed on the booking platforms.',
          de: 'Zwei Apartments mit zwei und zwei mit einem Schlafzimmer, für 6 + 4 + 2 + 4 Gäste laut den Buchungsplattformen.',
          sl: 'Dva apartmaja z dvema spalnicama in dva z eno spalnico, za 6 + 4 + 2 + 4 goste, kot navajajo platforme za rezervacije.',
          hr: 'Dva apartmana s dvije spavaće sobe i dva s jednom, za 6 + 4 + 2 + 4 gosta, kako navode platforme za rezervacije.',
          it: 'Due appartamenti con due camere e due con una, per 6 + 4 + 2 + 4 ospiti, come indicato sui portali di prenotazione.',
        },
      },
      {
        icon: 'grill',
        title: { en: 'One garden, one grill', de: 'Ein Garten, ein Grill', sl: 'En vrt, en žar', hr: 'Jedan vrt, jedan roštilj', it: 'Un giardino, un barbecue' },
        text: {
          en: 'Cook together at the built-in barbecue or in Apartment 1’s outdoor kitchen, then sit down to dinner in the garden.',
          de: 'Gemeinsam am gemauerten Grill oder in der Außenküche von Apartment 1 kochen, danach Abendessen im Garten.',
          sl: 'Skupaj kuhajte na zidanem žaru ali v zunanji kuhinji apartmaja 1, nato pa sedite k večerji na vrtu.',
          hr: 'Kuhajte zajedno na zidanom roštilju ili u vanjskoj kuhinji apartmana 1, a zatim sjednite na večeru u vrtu.',
          it: 'Cucinate insieme al barbecue in muratura o nella cucina esterna dell’appartamento 1, poi tutti a cena in giardino.',
        },
      },
      {
        icon: 'wave',
        href: '#beaches',
        title: { en: 'Beaches for every age', de: 'Strände für jedes Alter', sl: 'Plaže za vse generacije', hr: 'Plaže za svaku dob', it: 'Spiagge per tutte le età' },
        text: {
          en: 'Sabunike’s gently sloping sand is a six-minute walk. Queen’s Beach and Škrapavac, which has a playground, are both within 3 km.',
          de: 'Der sanft abfallende Sand von Sabunike ist sechs Gehminuten entfernt. Der Königinnenstrand und Škrapavac mit Spielplatz liegen beide im Umkreis von 3 km.',
          sl: 'Do položne peščene plaže v Sabunikah je šest minut hoje. Kraljičina plaža in Škrapavac z otroškim igriščem sta manj kot 3 km stran.',
          hr: 'Do blago položene pješčane plaže u Sabunikama ima šest minuta hoda. Kraljičina plaža i Škrapavac s dječjim igralištem udaljeni su manje od 3 km.',
          it: 'La sabbia in dolce pendio di Sabunike è a sei minuti a piedi. Kraljičina plaža e Škrapavac, con il suo parco giochi, sono entrambe entro 3 km.',
        },
      },
      {
        icon: 'chat',
        href: '#direct',
        title: { en: 'One conversation for everyone', de: 'Ein Gespräch für alle', sl: 'En pogovor za vse', hr: 'Jedan razgovor za sve', it: 'Un’unica conversazione per tutti' },
        text: {
          en: 'Book all four apartments directly with the owners, in one request, instead of four separate platform bookings.',
          de: 'Alle vier Apartments direkt bei den Eigentümern buchen, mit einer Anfrage statt vier einzelnen Plattformbuchungen.',
          sl: 'Vse štiri apartmaje rezervirajte neposredno pri lastnikih, z enim povpraševanjem namesto štirih ločenih rezervacij na platformah.',
          hr: 'Rezervirajte sva četiri apartmana izravno kod vlasnika, jednim upitom umjesto četiriju odvojenih rezervacija na platformama.',
          it: 'Prenotate tutti e quattro gli appartamenti direttamente con i proprietari, con un’unica richiesta invece di quattro prenotazioni separate sui portali.',
        },
      },
    ],
    sections: ['hero', 'niche', 'villa', 'beaches', 'activities', 'explore', 'seasons', 'direct', ...CORE_END],
    focus: { beachTags: ['family'], poiTags: ['family', 'food'], activityTags: ['families', 'kids', 'seniors', 'groups of friends'] },
    inquiry: {
      purpose: 'family',
      apartment: 'house',
      placeholder: {
        en: 'How many of you, ages of the children, anyone who needs the ground floor?',
        de: 'Wie viele Personen, Alter der Kinder, braucht jemand das Erdgeschoss?',
        sl: 'Koliko vas bo, koliko so stari otroci, kdo potrebuje pritličje?',
        hr: 'Koliko vas je, koliko su djeca stara, treba li nekome prizemlje?',
        it: 'Quanti siete, età dei bambini, qualcuno ha bisogno del piano terra?',
      },
    },
    nicheSegment: 'multigen-family-reunion',
  },
  {
    id: 'remote',
    label: { en: 'Remote work · monthly stays', de: 'Remote-Arbeit · Monatsaufenthalte', sl: 'Delo na daljavo · mesečna bivanja', hr: 'Rad na daljinu · mjesečni boravci', it: 'Lavoro da remoto · soggiorni mensili' },
    short: 'Remote',
    titleSuffix: { en: 'Monthly stays for remote work', de: 'Monatsaufenthalte für Remote-Arbeit', sl: 'Mesečna bivanja za delo na daljavo', hr: 'Mjesečni boravci za rad na daljinu', it: 'Soggiorni mensili per lavorare da remoto' },
    season: { en: 'March – May, October – November', de: 'März – Mai, Oktober – November', sl: 'marec – maj, oktober – november', hr: 'ožujak – svibanj, listopad – studeni', it: 'marzo – maggio, ottobre – novembre' },
    months: [3, 4, 5, 10, 11],
    hero: {
      kicker: { en: 'Monthly stays outside the summer season', de: 'Monatsaufenthalte außerhalb der Sommersaison', sl: 'Mesečna bivanja zunaj poletne sezone', hr: 'Mjesečni boravci izvan ljetne sezone', it: 'Soggiorni mensili fuori dalla stagione estiva' },
      title: {
        en: 'A working month on the Adriatic, after the summer crowds',
        de: 'Ein Arbeitsmonat an der Adria, nach dem Sommertrubel',
        sl: 'Delovni mesec ob Jadranu, ko poletna gneča mine',
        hr: 'Radni mjesec na Jadranu, nakon ljetnih gužvi',
        it: 'Un mese di lavoro sull’Adriatico, dopo la folla dell’estate',
      },
      subtitle: {
        en: 'Wi-Fi in every apartment, a walk by the sea at lunchtime, Zadar about half an hour by car. In October the sea is still around 21 °C. Ask us for a monthly rate.',
        de: 'WLAN in jedem Apartment, mittags ein Spaziergang am Meer, Zadar etwa eine halbe Stunde mit dem Auto. Im Oktober hat das Meer noch rund 21 °C. Fragen Sie nach einem Monatspreis.',
        sl: 'Wi-Fi v vsakem apartmaju, opoldanski sprehod ob morju, Zadar približno pol ure z avtom. Oktobra ima morje še okoli 21 °C. Povprašajte nas za mesečno ceno.',
        hr: 'Wi-Fi u svakom apartmanu, šetnja uz more u pauzi za ručak, Zadar oko pola sata autom. U listopadu more ima još oko 21 °C. Pitajte nas za mjesečnu cijenu.',
        it: 'Wi-Fi in ogni appartamento, una passeggiata sul mare in pausa pranzo, Zadar a circa mezz’ora d’auto. A ottobre il mare è ancora intorno ai 21 °C. Chiedeteci una tariffa mensile.',
      },
      photo: 'app2-terrace.jpg',
      slides: ['app2-livingroom.jpg', 'napros/20210918_110141.jpg', 'app1-terrace.jpg'],
      primaryLabel: { en: 'Ask about a long stay', de: 'Nach einem langen Aufenthalt fragen', sl: 'Povprašajte za daljše bivanje', hr: 'Upit za dulji boravak', it: 'Informatevi su un soggiorno lungo' },
      ctas: [{ label: { en: 'Long-stay details', de: 'Details zum Langzeitaufenthalt', sl: 'O daljšem bivanju', hr: 'O duljem boravku', it: 'Dettagli sul soggiorno lungo' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'Before you plan a working month', de: 'Bevor Sie einen Arbeitsmonat planen', sl: 'Preden načrtujete delovni mesec', hr: 'Prije nego što isplanirate radni mjesec', it: 'Prima di organizzare un mese di lavoro' },
    highlights: [
      {
        icon: 'wifi',
        title: { en: 'Wi-Fi in every apartment', de: 'WLAN in jedem Apartment', sl: 'Wi-Fi v vsakem apartmaju', hr: 'Wi-Fi u svakom apartmanu', it: 'Wi-Fi in ogni appartamento' },
        text: {
          en: 'Free Wi-Fi is listed throughout the house. Ask us for a current speed test before you book.',
          de: 'Kostenloses WLAN im ganzen Haus laut den Inseraten. Fragen Sie vor der Buchung nach einem aktuellen Speedtest.',
          sl: 'Oglasi navajajo brezplačen Wi-Fi v vsej hiši. Pred rezervacijo nas prosite za aktualen test hitrosti.',
          hr: 'Prema oglasima, besplatan Wi-Fi dostupan je u cijeloj kući. Prije rezervacije zatražite od nas aktualan test brzine.',
          it: 'Gli annunci indicano Wi-Fi gratuito in tutta la casa. Prima di prenotare chiedeteci un test di velocità aggiornato.',
        },
        todo: 'Run a speed test (download, upload, latency) and publish it',
      },
      {
        icon: 'calendar',
        href: '#inquiry',
        title: { en: 'Monthly rates on request', de: 'Monatspreise auf Anfrage', sl: 'Mesečne cene na povpraševanje', hr: 'Mjesečne cijene na upit', it: 'Tariffe mensili su richiesta' },
        text: {
          en: 'Tell us your dates and ask for a price for the whole month rather than per night. Coming in winter? Ask us about heating first.',
          de: 'Nennen Sie uns Ihre Daten und fragen Sie nach einem Preis für den ganzen Monat statt pro Nacht. Sie kommen im Winter? Fragen Sie vorher nach der Heizung.',
          sl: 'Sporočite nam termin in povprašajte za ceno za cel mesec namesto na noč. Pridete pozimi? Najprej nas vprašajte o ogrevanju.',
          hr: 'Javite nam termin i pitajte za cijenu za cijeli mjesec umjesto po noćenju. Dolazite zimi? Najprije nas pitajte za grijanje.',
          it: 'Diteci le vostre date e chiedete un prezzo per tutto il mese anziché a notte. Venite d’inverno? Chiedeteci prima del riscaldamento.',
        },
        todo: 'Confirm winter heating in each apartment and a monthly rate policy',
      },
      {
        icon: 'info',
        href: '#inquiry',
        title: { en: 'Digital-nomad permit', de: 'Visum für digitale Nomaden', sl: 'Dovoljenje za digitalne nomade', hr: 'Dozvola za digitalne nomade', it: 'Permesso per nomadi digitali' },
        text: {
          en: 'Croatia’s permit for non-EU remote workers needs your address registered within 3 days of arrival. Ask us which documents we can provide.',
          de: 'Kroatiens Aufenthaltstitel für digitale Nomaden aus Nicht-EU-Ländern verlangt die Meldung der Adresse binnen 3 Tagen nach Ankunft. Fragen Sie uns, welche Unterlagen wir ausstellen können.',
          sl: 'Hrvaško dovoljenje za delavce na daljavo iz držav zunaj EU zahteva prijavo naslova v 3 dneh po prihodu. Vprašajte nas, katere dokumente vam lahko priskrbimo.',
          hr: 'Hrvatska dozvola boravka za digitalne nomade iz zemalja izvan EU-a traži prijavu adrese u roku od 3 dana od dolaska. Pitajte nas koje dokumente možemo pripremiti.',
          it: 'Il permesso croato per i lavoratori da remoto extra-UE richiede la registrazione dell’indirizzo entro 3 giorni dall’arrivo. Chiedeteci quali documenti possiamo fornirvi.',
        },
        todo: 'Confirm with an accountant whether a lease contract / owner statement can be issued',
      },
      {
        icon: 'laptop',
        title: { en: 'Coworking in Zadar', de: 'Coworking in Zadar', sl: 'Coworking v Zadru', hr: 'Coworking u Zadru', it: 'Coworking a Zadar' },
        text: {
          en: 'COIN Zadar, a coworking space with about 35 desks, is a drive away when you want to work among people.',
          de: 'COIN Zadar, ein Coworking-Space mit rund 35 Arbeitsplätzen, ist mit dem Auto erreichbar, wenn Sie unter Leuten arbeiten möchten.',
          sl: 'COIN Zadar, coworking prostor s približno 35 delovnimi mesti, je dosegljiv z avtom, kadar želite delati med ljudmi.',
          hr: 'COIN Zadar, coworking prostor s oko 35 radnih mjesta, dostupan je autom kad poželite raditi među ljudima.',
          it: 'COIN Zadar, uno spazio di coworking con circa 35 postazioni, è raggiungibile in auto quando avete voglia di lavorare tra la gente.',
        },
      },
    ],
    sections: ['hero', 'niche', 'villa', 'seasons', 'explore', 'direct', ...CORE_END],
    focus: { beachTags: ['quiet'], poiTags: ['culture', 'food'], activityTags: ['off-season', 'long-stay guests', 'slow travellers'] },
    inquiry: {
      purpose: 'remote',
      placeholder: {
        en: 'Which month(s)? Do you need a desk? Upload speed you need?',
        de: 'Welche(r) Monat(e)? Brauchen Sie einen Schreibtisch? Welche Upload-Geschwindigkeit?',
        sl: 'Kateri mesec oz. meseci? Potrebujete delovno mizo? Kakšno hitrost nalaganja (upload) potrebujete?',
        hr: 'Koji mjesec ili mjeseci? Trebate li radni stol? Koja vam brzina uploada treba?',
        it: 'Quale mese (o mesi)? Vi serve una scrivania? Che velocità di upload vi serve?',
      },
    },
    nicheSegment: 'remote-workers-monthly',
  },
  {
    id: 'wellness',
    label: { en: 'Healing mud & slow travel', de: 'Heilschlamm & ruhiges Reisen', sl: 'Zdravilno blato in umirjen oddih', hr: 'Ljekovito blato i opušten odmor', it: 'Fanghi e vacanze lente' },
    short: 'Wellness',
    titleSuffix: { en: 'Nin healing mud & quiet stays', de: 'Heilschlamm von Nin & ruhige Tage', sl: 'Ninsko zdravilno blato in mirni dnevi', hr: 'Ninsko ljekovito blato i mirni dani', it: 'I fanghi di Nin e giornate tranquille' },
    season: { en: 'May – October', de: 'Mai – Oktober', sl: 'maj – oktober', hr: 'svibanj – listopad', it: 'maggio – ottobre' },
    months: [5, 6, 7, 8, 9, 10],
    hero: {
      kicker: { en: 'Nin lagoon mud · quiet shoulder seasons', de: 'Schlamm der Lagune von Nin · ruhige Nebensaison', sl: 'Blato Ninske lagune · mirna pred- in posezona', hr: 'Blato Ninske lagune · mirna predsezona i posezona', it: 'Fanghi della laguna di Nin · mezze stagioni tranquille' },
      title: {
        en: 'The lagoon mud of Nin in summer, flat walks and quiet days either side',
        de: 'Im Sommer der Lagunenschlamm von Nin, davor und danach flache Wege und ruhige Tage',
        sl: 'Poleti blato Ninske lagune, pred tem in po tem ravni sprehodi in mirni dnevi',
        hr: 'Ljeti blato Ninske lagune, prije i poslije ravne šetnje i mirni dani',
        it: 'D’estate i fanghi della laguna di Nin, prima e dopo passeggiate in piano e giornate tranquille',
      },
      subtitle: {
        en: 'For generations people have come to the mud of the Nin lagoon, behind Queen’s Beach. Stay for a full course in July and August, or come in spring and autumn for flat walks and mild days. Ask your doctor first.',
        de: 'Seit Generationen kommen Menschen zum Schlamm der Lagune von Nin hinter dem Königinnenstrand. Bleiben Sie im Juli und August für eine ganze Kur, oder kommen Sie im Frühling und Herbst für flache Wege und milde Tage. Fragen Sie vorher Ihren Arzt.',
        sl: 'Že generacije ljudje prihajajo po blato Ninske lagune za Kraljičino plažo. Julija in avgusta ostanite za celotno kuro ali pa pridite spomladi in jeseni na ravne sprehode in mile dni. Prej se posvetujte z zdravnikom.',
        hr: 'Generacijama ljudi dolaze po blato Ninske lagune iza Kraljičine plaže. U srpnju i kolovozu ostanite za cijelu kuru ili dođite u proljeće i jesen zbog ravnih šetnji i blagih dana. Prije se posavjetujte s liječnikom.',
        it: 'Da generazioni si viene ai fanghi della laguna di Nin, dietro Kraljičina plaža. Fermatevi per un ciclo completo a luglio e agosto, oppure venite in primavera e in autunno per passeggiate in piano e giornate miti. Consultate prima il vostro medico.',
      },
      photo: 'napros/20210918_155653.jpg',
      slides: ['napros/20210918_155421.jpg', 'app1-terrace.jpg', 'napros/20210720_171714.jpg'],
      ctas: [{ label: { en: 'About the mud', de: 'Über den Heilschlamm', sl: 'O zdravilnem blatu', hr: 'O ljekovitom blatu', it: 'Sui fanghi' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'Mud, walks and easy days', de: 'Schlamm, Spaziergänge und ruhige Tage', sl: 'Blato, sprehodi in lagodni dnevi', hr: 'Blato, šetnje i opušteni dani', it: 'Fanghi, passeggiate e giornate tranquille' },
    highlights: [
      {
        icon: 'walk',
        href: '#beaches',
        title: { en: 'About 17 minutes to Queen’s Beach', de: 'Etwa 17 Minuten zum Königinnenstrand', sl: 'Približno 17 minut do Kraljičine plaže', hr: 'Oko 17 minuta do Kraljičine plaže', it: 'Circa 17 minuti fino a Kraljičina plaža' },
        text: {
          en: 'Queen’s Beach is about 1.4 km on foot. The mud field behind it is about 2.3 km, roughly 9 minutes by bike.',
          de: 'Zum Königinnenstrand sind es etwa 1,4 km zu Fuß. Das Schlammfeld dahinter liegt etwa 2,3 km entfernt, rund 9 Minuten mit dem Rad.',
          sl: 'Do Kraljičine plaže je peš približno 1,4 km. Do blatnega polja za njo je približno 2,3 km, s kolesom okoli 9 minut.',
          hr: 'Do Kraljičine plaže ima oko 1,4 km pješice. Polje s blatom iza nje udaljeno je oko 2,3 km, biciklom otprilike 9 minuta.',
          it: 'Kraljičina plaža è a circa 1,4 km a piedi. La distesa di fango alle sue spalle è a circa 2,3 km, più o meno 9 minuti in bici.',
        },
      },
      {
        icon: 'calendar',
        href: '#niche',
        title: { en: 'Stay for a full course', de: 'Bleiben Sie für eine ganze Kur', sl: 'Ostanite za celotno kuro', hr: 'Ostanite za cijelu kuru', it: 'Fermatevi per un ciclo completo' },
        text: {
          en: 'A course usually lasts 10 to 20 days. July and August sessions are reported to run under medical supervision. Mud is not for everyone, for example with heart or blood-pressure problems.',
          de: 'Eine Kur dauert meist 10 bis 20 Tage. Im Juli und August finden die Anwendungen Berichten zufolge unter ärztlicher Aufsicht statt. Schlamm ist nicht für jeden geeignet, etwa bei Herz- oder Blutdruckproblemen.',
          sl: 'Kura običajno traja od 10 do 20 dni. Julija in avgusta naj bi terapije potekale pod zdravniškim nadzorom. Blato ni za vsakogar, na primer ne pri težavah s srcem ali krvnim tlakom.',
          hr: 'Kura obično traje 10 do 20 dana. Prema dostupnim podacima, u srpnju i kolovozu tretmani se provode pod liječničkim nadzorom. Blato nije za svakoga, primjerice kod problema sa srcem ili krvnim tlakom.',
          it: 'Un ciclo dura di solito da 10 a 20 giorni. A luglio e agosto i trattamenti si svolgerebbero sotto controllo medico. I fanghi non sono per tutti, ad esempio in caso di problemi cardiaci o di pressione.',
        },
      },
      {
        icon: 'bed',
        href: '#villa',
        title: { en: 'Ground floor, parking at the door', de: 'Erdgeschoss, Parkplatz vor der Tür', sl: 'Pritličje, parkirišče pred vrati', hr: 'Prizemlje, parking pred vratima', it: 'Piano terra, parcheggio davanti alla porta' },
        text: {
          en: 'Apartment 1 is on the ground floor, a few steps up from the garden, with parking on the gated driveway.',
          de: 'Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Garten, mit Parkplatz in der umzäunten Einfahrt.',
          sl: 'Apartma 1 je v pritličju, nekaj stopnic nad vrtom, parkirišče pa je na ograjenem dovozu.',
          hr: 'Apartman 1 nalazi se u prizemlju, nekoliko stepenica iznad vrta, s parkingom na ograđenom prilazu.',
          it: 'L’appartamento 1 è al piano terra, pochi gradini sopra il giardino, con parcheggio nel vialetto chiuso da un cancello.',
        },
        todo: 'Confirm the number of steps from the garden up to Apartment 1',
      },
      {
        icon: 'sun',
        href: '#seasons',
        title: { en: 'Mild months either side', de: 'Milde Monate davor und danach', sl: 'Mili meseci pred sezono in po njej', hr: 'Blagi mjeseci prije i poslije sezone', it: 'Mesi miti prima e dopo' },
        text: {
          en: 'In October afternoons reach about 20 °C and the sea stays near 21 °C. The lanes are flat for walking and easy cycling.',
          de: 'Im Oktober werden es nachmittags etwa 20 °C, das Meer bleibt bei rund 21 °C. Die Wege sind flach, ideal zum Gehen und für leichte Radtouren.',
          sl: 'Oktobra se popoldne ogreje na približno 20 °C, morje pa ostaja pri okoli 21 °C. Poti so ravne, kot nalašč za sprehode in lahkotno kolesarjenje.',
          hr: 'U listopadu popodne je oko 20 °C, a more se zadržava na oko 21 °C. Putevi su ravni, idealni za šetnju i laganu vožnju biciklom.',
          it: 'A ottobre i pomeriggi arrivano a circa 20 °C e il mare resta intorno ai 21 °C. Le stradine sono pianeggianti, ideali per camminare e pedalare senza fatica.',
        },
      },
    ],
    sections: ['hero', 'niche', 'villa', 'beaches', 'seasons', 'explore', 'activities', 'direct', ...CORE_END],
    focus: { beachTags: ['quiet'], poiTags: ['wellness'], activityTags: ['seniors', 'wellness seekers', 'long-stay guests'] },
    inquiry: {
      purpose: 'holiday',
      placeholder: {
        en: 'Planned mud-course dates, any mobility needs',
        de: 'Geplante Termine der Schlammkur, besondere Bedürfnisse bei der Mobilität',
        sl: 'Načrtovani termin kure z blatom, morebitne potrebe glede gibljivosti',
        hr: 'Planirani termin kure blatom, eventualne potrebe vezane uz pokretljivost',
        it: 'Date previste per il ciclo di fanghi, eventuali esigenze di mobilità',
      },
    },
    nicheSegment: 'healing-mud-wellness-seniors',
  },
  {
    id: 'nature',
    label: { en: 'Birdwatching & photography', de: 'Vogelbeobachtung & Fotografie', sl: 'Opazovanje ptic in fotografija', hr: 'Promatranje ptica i fotografija', it: 'Birdwatching e fotografia' },
    short: 'Nature',
    titleSuffix: { en: 'Birdwatching at the Nin salt pans', de: 'Vogelbeobachtung an den Salinen von Nin', sl: 'Opazovanje ptic na ninskih solinah', hr: 'Promatranje ptica na Ninskoj solani', it: 'Birdwatching alle saline di Nin' },
    season: { en: 'March – May, August – October', de: 'März – Mai, August – Oktober', sl: 'marec – maj, avgust – oktober', hr: 'ožujak – svibanj, kolovoz – listopad', it: 'marzo – maggio, agosto – ottobre' },
    months: [3, 4, 5, 8, 9, 10],
    hero: {
      kicker: { en: 'Solana Nin · Nin lagoon · Pag', de: 'Solana Nin · Lagune von Nin · Pag', sl: 'Solana Nin · Ninska laguna · Pag', hr: 'Solana Nin · Ninska laguna · Pag', it: 'Solana Nin · laguna di Nin · Pag' },
      title: {
        en: 'Spring and autumn migration over the Nin salt pans',
        de: 'Frühjahrs- und Herbstzug über den Salinen von Nin',
        sl: 'Spomladanska in jesenska selitev ptic nad ninskimi solinami',
        hr: 'Proljetna i jesenska seoba ptica iznad Ninske solane',
        it: 'Migrazioni di primavera e d’autunno sulle saline di Nin',
      },
      subtitle: {
        en: 'Black-winged stilts, little egrets and Kentish plovers at Solana Nin, about 3 km from the house. The Velebit across the channel at first light, and Pag’s bare limestone a day trip away.',
        de: 'Stelzenläufer, Seidenreiher und Seeregenpfeifer in der Saline von Nin, etwa 3 km vom Haus. Im ersten Licht der Velebit gegenüber, und Pags kahler Kalkstein als Tagesausflug.',
        sl: 'Polojniki, male bele čaplje in beločeli deževniki na Solani Nin, približno 3 km od hiše. Ob prvi svetlobi Velebit na drugi strani kanala, goli apnenec otoka Pag pa je cilj za celodnevni izlet.',
        hr: 'Vlastelice, male bijele čaplje i morski kulici na Solani Nin, oko 3 km od kuće. Velebit preko kanala u prvom svjetlu, a goli vapnenac Paga cilj je za jednodnevni izlet.',
        it: 'Cavalieri d’Italia, garzette e fratini alla Solana Nin, a circa 3 km da casa. Il Velebit oltre il canale alle prime luci, e il calcare nudo di Pag per una gita in giornata.',
      },
      photo: 'napros/20210918_110141.jpg',
      slides: ['napros/20210918_155421.jpg', 'napros/20210918_155653.jpg', 'app2-terrace.jpg'],
      ctas: [{ label: { en: 'Birding notes', de: 'Hinweise für Vogelbeobachter', sl: 'Napotki za opazovalce ptic', hr: 'Bilješke za promatrače ptica', it: 'Note per il birdwatching' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'Notes for birders and photographers', de: 'Hinweise für Vogelbeobachter und Fotografen', sl: 'Napotki za opazovalce ptic in fotografe', hr: 'Bilješke za promatrače ptica i fotografe', it: 'Note per birdwatcher e fotografi' },
    highlights: [
      {
        icon: 'leaf',
        href: '#explore',
        title: { en: 'An ornithological reserve', de: 'Ein ornithologisches Reservat', sl: 'Ornitološki rezervat', hr: 'Ornitološki rezervat', it: 'Una riserva ornitologica' },
        text: {
          en: 'Part of the working Nin salt pans is a reserve: 158 species recorded there, 41 of them endangered (Solana Nin, 2019).',
          de: 'Ein Teil der Salinen von Nin ist Reservat: 158 Arten wurden dort erfasst, 41 davon gefährdet (Solana Nin, 2019).',
          sl: 'Del delujočih ninskih solin je rezervat: tam so zabeležili 158 vrst, od tega 41 ogroženih (Solana Nin, 2019).',
          hr: 'Dio aktivne Ninske solane je rezervat: ondje je zabilježeno 158 vrsta, od toga 41 ugrožena (Solana Nin, 2019).',
          it: 'Una parte delle saline attive di Nin è una riserva: vi sono state censite 158 specie, 41 delle quali minacciate (Solana Nin, 2019).',
        },
      },
      {
        icon: 'sun',
        title: { en: 'Late-afternoon light', de: 'Licht am späten Nachmittag', sl: 'Svetloba poznega popoldneva', hr: 'Svjetlo kasnog poslijepodneva', it: 'La luce del tardo pomeriggio' },
        text: {
          en: 'The observation platform on the west side of the salt pans has the best light in the late afternoon; in the morning you look into the sun.',
          de: 'Die Beobachtungsplattform an der Westseite der Salinen hat am späten Nachmittag das beste Licht, morgens blickt man gegen die Sonne.',
          sl: 'Opazovalna ploščad na zahodni strani solin ima najlepšo svetlobo pozno popoldne; zjutraj gledate proti soncu.',
          hr: 'Promatračnica na zapadnoj strani solane ima najbolje svjetlo kasno poslijepodne; ujutro gledate prema suncu.',
          it: 'La piattaforma di osservazione sul lato ovest delle saline ha la luce migliore nel tardo pomeriggio; al mattino si guarda controsole.',
        },
      },
      {
        icon: 'bike',
        href: '#explore',
        title: { en: 'Cycle to the salt pans', de: 'Mit dem Rad zu den Salinen', sl: 'S kolesom do solin', hr: 'Biciklom do solane', it: 'In bici fino alle saline' },
        text: {
          en: 'The flat 9.5 km loop from our driveway passes Queen’s Beach, Nin and Solana Nin.',
          de: 'Die flache 9,5-km-Runde ab unserer Einfahrt führt am Königinnenstrand, an Nin und an der Saline vorbei.',
          sl: 'Ravni 9,5-kilometrski krog z našega dovoza pelje mimo Kraljičine plaže, Nina in Solane Nin.',
          hr: 'Ravni krug od 9,5 km s našeg prilaza prolazi pokraj Kraljičine plaže, Nina i Solane Nin.',
          it: 'Il giro pianeggiante di 9,5 km che parte dal nostro vialetto passa per Kraljičina plaža, Nin e la Solana Nin.',
        },
      },
      {
        icon: 'info',
        title: { en: 'Know the rules', de: 'Die Regeln kennen', sl: 'Upoštevajte pravila', hr: 'Poštujte pravila', it: 'Le regole da sapere' },
        text: {
          en: 'You may enter the salt fields only with a guide, and the lagoon is a protected Natura 2000 area.',
          de: 'Die Salzfelder dürfen nur mit Führung betreten werden, die Lagune ist ein geschütztes Natura-2000-Gebiet.',
          sl: 'Na solna polja smete samo z vodnikom, laguna pa je zavarovano območje Natura 2000.',
          hr: 'Na solna polja smije se ući samo uz vodiča, a laguna je zaštićeno područje Natura 2000.',
          it: 'Nelle vasche salanti si entra solo con una guida, e la laguna è un’area protetta Natura 2000.',
        },
      },
    ],
    // The house comes early; the salt-pan bike loop is in the niche section and on the map.
    sections: ['hero', 'niche', 'villa', 'explore', 'seasons', 'activities', 'direct', ...CORE_END],
    focus: { beachTags: ['quiet', 'sunset'], poiTags: [], activityTags: ['bird watchers', 'photographers', 'nature lovers'] },
    inquiry: { purpose: 'holiday' },
    nicheSegment: 'birders-nature-photographers',
  },
  {
    // TODO(owner): all platform listings say "no pets". Keep this version
    // unlisted until a direct-booking pet policy is decided.
    id: 'dogs',
    label: { en: 'Travelling with a dog', de: 'Mit Hund reisen', sl: 'Potovanje s psom', hr: 'Putovanje sa psom', it: 'In viaggio con il cane' },
    short: 'Dogs',
    titleSuffix: { en: 'Travelling with a dog', de: 'Mit Hund reisen', sl: 'Potovanje s psom', hr: 'Putovanje sa psom', it: 'In viaggio con il cane' },
    season: { en: 'May – June, September – October', de: 'Mai – Juni, September – Oktober', sl: 'maj – junij, september – oktober', hr: 'svibanj – lipanj, rujan – listopad', it: 'maggio – giugno, settembre – ottobre' },
    months: [5, 6, 9, 10],
    unlisted: true,
    hero: {
      kicker: { en: 'Dog owners · please ask first', de: 'Mit Hund · bitte vorher fragen', sl: 'S psom · prosimo, najprej vprašajte', hr: 'Sa psom · molimo, najprije pitajte', it: 'Con il cane · chiedete prima, per favore' },
      title: {
        en: 'Coming with your dog? Let’s talk before you book',
        de: 'Sie kommen mit Hund? Sprechen wir vor der Buchung',
        sl: 'Pridete s psom? Pogovorimo se pred rezervacijo',
        hr: 'Dolazite sa psom? Razgovarajmo prije rezervacije',
        it: 'Venite con il cane? Parliamone prima di prenotare',
      },
      subtitle: {
        en: 'Our platform listings do not accept pets, so please write to us first. We will tell you honestly whether we can host you and your dog.',
        de: 'Über die Buchungsplattformen sind Haustiere nicht erlaubt, darum schreiben Sie uns bitte vorher. Wir sagen Ihnen ehrlich, ob wir Sie mit Hund aufnehmen können.',
        sl: 'Naši oglasi na platformah ne sprejemajo hišnih ljubljenčkov, zato nam prosimo najprej pišite. Iskreno vam bomo povedali, ali lahko gostimo vas in vašega psa.',
        hr: 'Naši oglasi na platformama ne primaju kućne ljubimce, zato nam molimo najprije pišite. Iskreno ćemo vam reći možemo li ugostiti vas i vašeg psa.',
        it: 'Sui portali i nostri annunci non accettano animali, quindi scriveteci prima. Vi diremo sinceramente se possiamo ospitare voi e il vostro cane.',
      },
      photo: 'napros/20210720_171714.jpg',
      slides: ['20210720_171634.jpg', 'driveway.jpg', 'napros/20210918_110141.jpg'],
      ctas: [{ label: { en: 'Dog beaches nearby', de: 'Hundestrände in der Nähe', sl: 'Pasje plaže v bližini', hr: 'Plaže za pse u blizini', it: 'Spiagge per cani nei dintorni' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'Before you bring your dog', de: 'Bevor Sie Ihren Hund mitbringen', sl: 'Preden pripeljete psa', hr: 'Prije nego što povedete psa', it: 'Prima di portare il cane' },
    highlights: [
      {
        icon: 'chat',
        href: '#inquiry',
        title: { en: 'Ask before you book', de: 'Vor der Buchung fragen', sl: 'Vprašajte pred rezervacijo', hr: 'Pitajte prije rezervacije', it: 'Chiedete prima di prenotare' },
        text: {
          en: 'Tell us how many dogs, their size and age. We answer before you commit to anything.',
          de: 'Nennen Sie uns Anzahl, Größe und Alter Ihrer Hunde. Wir antworten, bevor Sie sich festlegen.',
          sl: 'Sporočite nam, koliko psov imate ter kako veliki in stari so. Odgovorimo, preden se za kar koli zavežete.',
          hr: 'Javite nam koliko pasa imate, koje su veličine i dobi. Odgovaramo prije nego što se na bilo što obvežete.',
          it: 'Diteci quanti cani avete, di che taglia e di che età. Vi rispondiamo prima che prendiate qualsiasi impegno.',
        },
        todo: 'Decide the pet policy for direct bookings (which apartments, fee, size limits)',
      },
      {
        icon: 'dog',
        title: { en: 'Dog beaches: reported, not verified', de: 'Hundestrände: berichtet, nicht bestätigt', sl: 'Pasje plaže: omenjene, ne preverjene', hr: 'Plaže za pse: spominju se, nisu provjerene', it: 'Spiagge per cani: segnalate, non verificate' },
        text: {
          en: 'One pet-travel guide mentions a dog-friendly section at Škrapavac beach in Privlaka, about 2.3 km away. We have not found an official municipal rule yet.',
          de: 'Ein Reiseführer für Hundebesitzer erwähnt einen hundefreundlichen Abschnitt am Strand Škrapavac in Privlaka, etwa 2,3 km entfernt. Eine offizielle Regelung der Gemeinde haben wir noch nicht gefunden.',
          sl: 'Neki vodnik za potovanja z ljubljenčki omenja del plaže Škrapavac v Privlaki, kjer so psi dobrodošli, približno 2,3 km stran. Uradnega občinskega pravila še nismo našli.',
          hr: 'Jedan vodič za putovanja s ljubimcima spominje dio plaže Škrapavac u Privlaci gdje su psi dobrodošli, oko 2,3 km dalje. Službenu odluku općine još nismo pronašli.',
          it: 'Una guida per chi viaggia con animali cita un tratto della spiaggia di Škrapavac, a Privlaka, aperto ai cani, a circa 2,3 km. Non abbiamo ancora trovato un’ordinanza comunale ufficiale.',
        },
      },
      {
        icon: 'walk',
        title: { en: 'Quiet lanes for walks', de: 'Ruhige Wege für Spaziergänge', sl: 'Mirne ulice za sprehode', hr: 'Mirne ulice za šetnje', it: 'Stradine tranquille per le passeggiate' },
        text: {
          en: 'Put kandelica is a residential lane, and the roads around Sabunike are flat for early and late walks.',
          de: 'Put kandelica ist eine Wohnstraße, und die Wege rund um Sabunike sind flach, gut für Runden am Morgen und Abend.',
          sl: 'Put kandelica je stanovanjska ulica, ceste okoli Sabunik pa so ravne, primerne za jutranje in večerne sprehode.',
          hr: 'Put kandelica je stambena ulica, a ceste oko Sabunika su ravne, za jutarnje i večernje šetnje.',
          it: 'Put kandelica è una via residenziale e le strade intorno a Sabunike sono pianeggianti, ideali per le passeggiate di prima mattina e di sera.',
        },
      },
      {
        icon: 'sun',
        href: '#seasons',
        title: { en: 'Skip the hottest weeks', de: 'Die heißesten Wochen meiden', sl: 'Izognite se najbolj vročim tednom', hr: 'Izbjegnite najtoplije tjedne', it: 'Evitate le settimane più calde' },
        text: {
          en: 'July and August afternoons reach about 30 °C. Late spring and early autumn are cooler and the beaches emptier.',
          de: 'Im Juli und August werden es nachmittags etwa 30 °C. Spätfrühling und Frühherbst sind kühler, die Strände leerer.',
          sl: 'Julija in avgusta se popoldne ogreje na približno 30 °C. Pozna pomlad in zgodnja jesen sta bolj sveži, plaže pa bolj prazne.',
          hr: 'U srpnju i kolovozu popodne je oko 30 °C. Kasno proljeće i rana jesen su svježiji, a plaže praznije.',
          it: 'A luglio e agosto i pomeriggi arrivano a circa 30 °C. Tarda primavera e inizio autunno sono più freschi e le spiagge più vuote.',
        },
      },
    ],
    sections: ['hero', 'niche', 'villa', 'beaches', 'explore', 'seasons', 'direct', ...CORE_END],
    focus: { beachTags: ['dogs'], poiTags: ['dog'], activityTags: [] },
    inquiry: {
      purpose: 'holiday',
      placeholder: {
        en: 'Your dog(s): how many, breed or size, age',
        de: 'Ihr Hund / Ihre Hunde: Anzahl, Rasse oder Größe, Alter',
        sl: 'Vaš pes oz. psi: koliko, pasma ali velikost, starost',
        hr: 'Vaš pas ili psi: koliko, pasmina ili veličina, dob',
        it: 'Il vostro cane (o cani): quanti, razza o taglia, età',
      },
    },
    nicheSegment: 'dog-owners',
  },
  {
    // A separate, opt-in page (niches.json risk: keep it off the family pages).
    id: 'naturists',
    label: { en: 'Naturists (FKK)', de: 'FKK-Urlaub', sl: 'Naturisti (FKK)', hr: 'Naturisti (FKK)', it: 'Naturisti (FKK)' },
    short: 'FKK',
    titleSuffix: { en: 'Naturist (FKK) stays in Sabunike', de: 'FKK-Urlaub in Sabunike', sl: 'Naturistične počitnice (FKK) v Sabunikah', hr: 'Naturistički odmor (FKK) u Sabunikama', it: 'Vacanze naturiste (FKK) a Sabunike' },
    season: { en: 'June – September', de: 'Juni – September', sl: 'junij – september', hr: 'lipanj – rujan', it: 'giugno – settembre' },
    months: [6, 7, 8, 9],
    unlisted: true,
    hero: {
      kicker: { en: 'FKK · Sabunike shore', de: 'FKK · Ufer von Sabunike', sl: 'FKK · obala v Sabunikah', hr: 'FKK · obala u Sabunikama', it: 'FKK · riva di Sabunike' },
      title: {
        en: 'Textile-free days on the Sabunike shore, an apartment to come back to',
        de: 'FKK-Tage am Ufer von Sabunike, ein Apartment für danach',
        sl: 'Dnevi brez kopalk na obali v Sabunikah in apartma, kamor se vrnete',
        hr: 'Dani bez kupaćeg na obali u Sabunikama i apartman u koji se vraćate',
        it: 'Giornate senza costume sulla riva di Sabunike, e un appartamento a cui tornare',
      },
      subtitle: {
        en: 'OpenStreetMap marks two naturist sections of the Sabunike shore; the nearer one is about 1.1 km on foot. It is undeveloped and quiet, with no bar and no shade. The garden at the house is shared with other guests.',
        de: 'OpenStreetMap verzeichnet zwei FKK-Abschnitte am Ufer von Sabunike, der nähere liegt etwa 1,1 km zu Fuß entfernt. Er ist naturbelassen und ruhig, ohne Bar und ohne Schatten. Den Garten am Haus teilen Sie mit anderen Gästen.',
        sl: 'OpenStreetMap označuje dva naturistična dela obale v Sabunikah; bližji je peš približno 1,1 km stran. Je neurejen in miren, brez bara in brez sence. Vrt pri hiši si delite z drugimi gosti.',
        hr: 'OpenStreetMap označava dva naturistička dijela obale u Sabunikama; bliži je oko 1,1 km pješice. Neuređen je i miran, bez bara i bez hlada. Vrt uz kuću dijelite s drugim gostima.',
        it: 'OpenStreetMap segna due tratti naturisti della riva di Sabunike; il più vicino è a circa 1,1 km a piedi. È selvaggio e tranquillo, senza bar e senza ombra. Il giardino della casa è in comune con gli altri ospiti.',
      },
      photo: 'napros/20210918_152134.jpg',
      slides: ['napros/20210918_110141.jpg', '20210810_184724.jpg', 'app3-entrance.jpg'],
      ctas: [{ label: { en: 'Map & practical notes', de: 'Karte & Hinweise', sl: 'Zemljevid in praktični napotki', hr: 'Karta i praktične napomene', it: 'Mappa e note pratiche' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'Good to know before you go', de: 'Gut zu wissen vorab', sl: 'Dobro je vedeti pred odhodom', hr: 'Dobro je znati prije polaska', it: 'Da sapere prima di andare' },
    highlights: [
      {
        icon: 'walk',
        href: '#beaches',
        title: { en: 'About 1.1 km on foot', de: 'Etwa 1,1 km zu Fuß', sl: 'Približno 1,1 km peš', hr: 'Oko 1,1 km pješice', it: 'Circa 1,1 km a piedi' },
        text: {
          en: 'The nearer naturist section is about a 13-minute walk. A second one lies further north, about 1.4 km in a straight line.',
          de: 'Der nähere FKK-Abschnitt ist etwa 13 Gehminuten entfernt. Ein zweiter liegt weiter nördlich, etwa 1,4 km Luftlinie.',
          sl: 'Do bližjega naturističnega dela je približno 13 minut hoje. Drugi leži severneje, približno 1,4 km zračne razdalje.',
          hr: 'Do bližeg naturističkog dijela ima oko 13 minuta hoda. Drugi se nalazi sjevernije, oko 1,4 km zračne linije.',
          it: 'Il tratto naturista più vicino è a circa 13 minuti a piedi. Un secondo si trova più a nord, a circa 1,4 km in linea d’aria.',
        },
      },
      {
        icon: 'leaf',
        title: { en: 'Undeveloped and quiet', de: 'Naturbelassen und ruhig', sl: 'Neurejeno in mirno', hr: 'Neuređeno i mirno', it: 'Selvaggio e tranquillo' },
        text: {
          en: 'No bar, no seating and no shade. Bring water and a sunshade, and water shoes for a shore of gravel and stones.',
          de: 'Keine Bar, keine Liegen, kein Schatten. Wasser und einen Sonnenschirm mitbringen, dazu Badeschuhe für das Ufer aus Kies und Steinen.',
          sl: 'Brez bara, brez ležalnikov in brez sence. Vzemite s seboj vodo, senčnik in čevlje za vodo, saj je obala prodnata in kamnita.',
          hr: 'Bez bara, bez ležaljki i bez hlada. Ponesite vodu, suncobran i obuću za more, jer je obala šljunčana i kamenita.',
          it: 'Niente bar, niente sdraio, niente ombra. Portate acqua, un ombrellone e scarpette da scoglio: la riva è di ghiaia e sassi.',
        },
      },
      {
        icon: 'pin',
        title: { en: 'Check the map first', de: 'Vorher die Karte ansehen', sl: 'Najprej poglejte zemljevid', hr: 'Najprije pogledajte kartu', it: 'Guardate prima la mappa' },
        text: {
          en: 'The section is not clearly signposted, and its official status is unconfirmed.',
          de: 'Der Abschnitt ist kaum ausgeschildert, und sein offizieller Status ist unbestätigt.',
          sl: 'Del obale ni jasno označen, njegov uradni status pa ni potrjen.',
          hr: 'Dio obale nije jasno označen, a njegov službeni status nije potvrđen.',
          it: 'Il tratto non è ben segnalato e il suo status ufficiale non è confermato.',
        },
      },
    ],
    sections: ['hero', 'niche', 'villa', 'beaches', 'explore', 'seasons', 'direct', ...CORE_END],
    focus: { beachTags: ['quiet'], poiTags: [], activityTags: [] },
    inquiry: { purpose: 'holiday' },
    nicheSegment: 'naturists',
  },
  {
    id: 'fieldtrips',
    label: { en: 'Field trips & study groups', de: 'Exkursionen & Studiengruppen', sl: 'Ekskurzije in študijske skupine', hr: 'Terenska nastava i studijske grupe', it: 'Uscite didattiche e gruppi di studio' },
    short: 'Field trips',
    titleSuffix: { en: 'Field trips & study groups', de: 'Exkursionen & Studiengruppen', sl: 'Ekskurzije in študijske skupine', hr: 'Terenska nastava i studijske grupe', it: 'Uscite didattiche e gruppi di studio' },
    season: { en: 'April – June, September – October', de: 'April – Juni, September – Oktober', sl: 'april – junij, september – oktober', hr: 'travanj – lipanj, rujan – listopad', it: 'aprile – giugno, settembre – ottobre' },
    months: [4, 5, 6, 9, 10],
    hero: {
      kicker: { en: 'Biology · archaeology · geography', de: 'Biologie · Archäologie · Geografie', sl: 'Biologija · arheologija · geografija', hr: 'Biologija · arheologija · geografija', it: 'Biologia · archeologia · geografia' },
      title: {
        en: 'Salt pans, Roman Nin and a protected lagoon, all within about 3.5 km',
        de: 'Salinen, das römische Nin und eine geschützte Lagune, alles im Umkreis von etwa 3,5 km',
        sl: 'Soline, rimski Nin in zavarovana laguna, vse v krogu približno 3,5 km',
        hr: 'Solana, rimski Nin i zaštićena laguna, sve u krugu od oko 3,5 km',
        it: 'Saline, la Nin romana e una laguna protetta, tutto nel raggio di circa 3,5 km',
      },
      subtitle: {
        en: 'Take the whole house for a seminar group of up to 16. Solana Nin runs educational salt tours on weekdays, Nin’s museum covers prehistory to the early Croatian state, and the lagoon is a Natura 2000 habitat.',
        de: 'Mieten Sie das ganze Haus für eine Seminargruppe von bis zu 16 Personen. Die Saline von Nin bietet werktags Lehrführungen an, das Museum von Nin reicht von der Vorgeschichte bis zum frühen kroatischen Staat, und die Lagune ist ein Natura-2000-Lebensraum.',
        sl: 'Najemite celo hišo za seminarsko skupino do 16 oseb. Solana Nin ob delavnikih pripravlja izobraževalne oglede, ninski muzej zajema obdobje od prazgodovine do zgodnje hrvaške države, laguna pa je habitat Natura 2000.',
        hr: 'Unajmite cijelu kuću za seminarsku grupu do 16 osoba. Solana Nin radnim danom organizira edukativne obilaske, ninski muzej pokriva razdoblje od prapovijesti do rane hrvatske države, a laguna je stanište Natura 2000.',
        it: 'Prendete tutta la casa per un gruppo di seminario fino a 16 persone. La Solana Nin organizza visite didattiche nei giorni feriali, il museo di Nin va dalla preistoria al primo stato croato e la laguna è un habitat Natura 2000.',
      },
      photo: 'napros/20210918_155421.jpg',
      slides: ['napros/20210918_155653.jpg', '20210720_171634.jpg', 'app2-livingroom.jpg'],
      primaryLabel: { en: 'Ask about the whole house', de: 'Nach dem ganzen Haus fragen', sl: 'Povprašajte za celo hišo', hr: 'Upit za cijelu kuću', it: 'Richiedete tutta la casa' },
      ctas: [{ label: { en: 'Study programme ideas', de: 'Ideen fürs Programm', sl: 'Ideje za študijski program', hr: 'Ideje za program', it: 'Idee per il programma di studio' }, href: '#niche' }],
    },
    highlightsHeading: { en: 'What a study group gets here', de: 'Was eine Studiengruppe hier vorfindet', sl: 'Kaj tu čaka študijsko skupino', hr: 'Što ovdje čeka studijsku grupu', it: 'Cosa trova qui un gruppo di studio' },
    highlights: [
      {
        icon: 'users',
        href: '#villa',
        title: { en: 'Sized for a seminar, not a school', de: 'Groß genug fürs Seminar, nicht für die Schulklasse', sl: 'Za seminar, ne za cel razred', hr: 'Za seminar, ne za cijeli razred', it: 'Su misura per un seminario, non per una classe' },
        text: {
          en: 'Four apartments for up to 16 guests as listed: right for a university seminar or a small study group with supervisors.',
          de: 'Vier Apartments für bis zu 16 Gäste laut Inserat: passend für ein Universitätsseminar oder eine kleine Studiengruppe mit Betreuern.',
          sl: 'Štirje apartmaji za do 16 gostov po navedbah v oglasih: ravno prav za univerzitetni seminar ali manjšo študijsko skupino s spremljevalci.',
          hr: 'Četiri apartmana za do 16 gostiju prema oglasima: taman za sveučilišni seminar ili manju studijsku grupu s voditeljima.',
          it: 'Quattro appartamenti fino a 16 ospiti, come da annuncio: giusti per un seminario universitario o un piccolo gruppo di studio con accompagnatori.',
        },
      },
      {
        icon: 'leaf',
        title: { en: 'Salt-pan ecology', de: 'Ökologie der Salinen', sl: 'Ekologija solin', hr: 'Ekologija solane', it: 'Ecologia delle saline' },
        text: {
          en: 'A 45-minute educational tour of the working salt pans, and 158 bird species recorded in the reserve.',
          de: 'Eine 45-minütige Lehrführung durch die aktive Saline und 158 im Reservat erfasste Vogelarten.',
          sl: '45-minutni izobraževalni ogled delujočih solin in 158 vrst ptic, zabeleženih v rezervatu.',
          hr: 'Edukativni obilazak aktivne solane u trajanju od 45 minuta i 158 vrsta ptica zabilježenih u rezervatu.',
          it: 'Una visita didattica di 45 minuti alle saline attive e 158 specie di uccelli censite nella riserva.',
        },
      },
      {
        icon: 'layers',
        title: { en: 'Two thousand years in one town', de: 'Zwei Jahrtausende in einer Stadt', sl: 'Dva tisoč let v enem mestu', hr: 'Dvije tisuće godina u jednom gradu', it: 'Duemila anni in una sola città' },
        text: {
          en: 'The 9th-century Church of the Holy Cross and the remains of a 1st-century Roman temple stand in Nin, about 3 km away.',
          de: 'Die Heilig-Kreuz-Kirche aus dem 9. Jahrhundert und die Reste eines römischen Tempels aus dem 1. Jahrhundert stehen in Nin, etwa 3 km entfernt.',
          sl: 'Cerkev svetega Križa iz 9. stoletja in ostanki rimskega templja iz 1. stoletja stojijo v Ninu, približno 3 km stran.',
          hr: 'Crkva svetog Križa iz 9. stoljeća i ostaci rimskog hrama iz 1. stoljeća nalaze se u Ninu, oko 3 km dalje.',
          it: 'La chiesa della Santa Croce del IX secolo e i resti di un tempio romano del I secolo si trovano a Nin, a circa 3 km.',
        },
      },
      {
        icon: 'euro',
        href: '#inquiry',
        title: { en: 'Invoicing for institutions', de: 'Rechnung an Institutionen', sl: 'Računi za ustanove', hr: 'Računi za ustanove', it: 'Fatturazione per istituzioni' },
        text: {
          en: 'Booking for a university or school? Ask us how we can invoice your institution.',
          de: 'Sie buchen für eine Universität oder Schule? Fragen Sie uns nach der Rechnungsstellung an Ihre Einrichtung.',
          sl: 'Rezervirate za univerzo ali šolo? Vprašajte nas, kako lahko izstavimo račun vaši ustanovi.',
          hr: 'Rezervirate za sveučilište ili školu? Pitajte nas kako možemo izdati račun vašoj ustanovi.',
          it: 'Prenotate per un’università o una scuola? Chiedeteci come possiamo fatturare al vostro istituto.',
        },
        todo: 'Confirm invoicing to institutions (fiscalisation / VAT)',
      },
    ],
    sections: ['hero', 'niche', 'villa', 'explore', 'activities', 'seasons', 'direct', ...CORE_END],
    focus: { beachTags: [], poiTags: ['culture'], activityTags: ['culture lovers', 'science nerds', 'bird watchers', 'nature lovers'] },
    inquiry: {
      purpose: 'other',
      apartment: 'house',
      placeholder: {
        en: 'Institution, group size, number of supervisors, invoice needed?',
        de: 'Einrichtung, Gruppengröße, Zahl der Betreuer, Rechnung nötig?',
        sl: 'Ustanova, velikost skupine, število spremljevalcev, potrebujete račun?',
        hr: 'Ustanova, veličina grupe, broj voditelja, treba li račun?',
        it: 'Istituto, dimensione del gruppo, numero di accompagnatori, serve la fattura?',
      },
    },
    nicheSegment: 'school-university-field-trips',
  },
];

// Versions offered in public lists (footer, menus). Unlisted ones stay
// reachable through their own link (?audience=naturists).
export const LISTED_AUDIENCES = AUDIENCES.filter((a) => !a.unlisted);

export function audienceById(id) {
  return AUDIENCES.find((a) => a.id === id) || AUDIENCES[0];
}
