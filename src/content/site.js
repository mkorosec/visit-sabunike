// Facts about the property and the owner's contact channels.
// Anything marked TODO(owner) is a placeholder the owner must confirm before
// the site goes live. The UI shows these values; it never invents others.

export const SITE = {
  names: {
    apartments: 'Apartments Napros',
    villa: 'Villa Napros',
  },
  company: 'Napros d.o.o.',
  address: {
    street: 'Put kandelica 60',
    postcode: '23233',
    place: 'Sabunike',
    municipality: 'Privlaka',
    region: { en: 'Zadar County', de: 'Gespanschaft Zadar', sl: 'Zadrska županija', hr: 'Zadarska županija', it: 'Contea di Zadar' },
    country: { en: 'Croatia', de: 'Kroatien', sl: 'Hrvaška', hr: 'Hrvatska', it: 'Croazia' },
  },
  // Pin from the owner's Google Maps link; the gate plate shows "60".
  location: { lat: 44.2587142, lon: 15.1589155 },

  contact: {
    // TODO(owner): real inbox and numbers. The inquiry form builds a prefilled
    // e-mail / WhatsApp / Viber message from these, so no backend is needed.
    email: 'info@napros.si',
    whatsapp: null, // e.g. '38640123456' (digits only, with country code)
    viber: null,
    phoneDisplay: null,
    // ISO 639-1 codes; the page names them in the visitor's language (Intl.DisplayNames).
    languages: ['sl', 'hr', 'en', 'de'], // TODO(owner): confirm
  },

  // Booking.com and similar OTAs typically take 15–20 % commission from the host.
  // TODO(owner): set the real direct-booking discount you want to offer.
  directBooking: {
    discountPercent: 10,
    otaCommissionPercentRange: [15, 20],
    depositPercent: 30, // TODO(owner)
    // kroati.de and Trip.com both list check-in from 14:00, check-out by 10:00;
    // Interhome says "flexible" (research/listing.json houseRules).
    // TODO(owner): confirm for direct stays, then set confirmed.checkIn.
    checkIn: '14:00',
    checkOut: '10:00',
    // Platform minimum stay (kroati.de / Interhome). TODO(owner): direct minimum?
    minNights: 5,
    // Which of the values above the site may state as fact. Unconfirmed ones
    // are replaced by neutral wording ("ask us") on the page and in the FAQ
    // structured data. TODO(owner): flip to true once confirmed.
    confirmed: {
      discount: false,
      deposit: false,
      replyTime: false,
      checkIn: false,
      minNights: false,
    },
  },

  // Sample nightly rates for the price explainer. Clearly labelled as examples
  // in the UI until the owner fills in real ones. null = "on request".
  // TODO(owner): replace with real seasonal prices.
  sampleRates: null,

  shared: [
    { id: 'grill', icon: 'grill', en: 'Garden grill area with built-in barbecue', de: 'Grillplatz im Garten', sl: 'Prostor za žar na vrtu z zidanim žarom', hr: 'Prostor za roštilj u vrtu sa zidanim roštiljem', it: 'Zona barbecue in giardino con barbecue in muratura' },
    { id: 'garden', icon: 'leaf', en: 'Lawn garden with fruit trees and a vine pergola over the drive', de: 'Rasengarten mit Obstbäumen und Weinlaube', sl: 'Vrt s trato, sadnim drevjem in brajdo nad dovozom', hr: 'Vrt s travnjakom, voćkama i odrinom nad prilazom', it: 'Giardino con prato, alberi da frutto e pergolato di vite sul vialetto' },
    { id: 'parking', icon: 'parking', en: 'Private parking on the gated driveway', de: 'Privatparkplatz in der Einfahrt', sl: 'Zasebno parkirišče na ograjenem dovozu', hr: 'Privatni parking na ograđenom prilazu', it: 'Parcheggio privato nel vialetto chiuso da un cancello' },
  ],
};

// Apartments. Stated facts come from the owner (NOTES.md). Guest counts and
// bed types are not yet confirmed and are shown as "on request".
export const APARTMENTS = [
  {
    id: 'apt1',
    number: 1,
    name: { en: 'Apartment 1 · Garden terrace', de: 'Apartment 1 · Gartenterrasse', sl: 'Apartma 1 · vrtna terasa', hr: 'Apartman 1 · vrtna terasa', it: 'Appartamento 1 · terrazza sul giardino' },
    floor: 'ground',
    areaM2: 68,
    bedrooms: 2,
    outdoor: { en: 'Covered terrace behind the arches', de: 'Überdachte Terrasse hinter den Bögen', sl: 'Pokrita terasa za loki', hr: 'Natkrivena terasa iza lukova', it: 'Terrazza coperta dietro gli archi' },
    extras: [{ en: 'Separate outdoor kitchen', de: 'Separate Außenküche', sl: 'Ločena zunanja kuhinja', hr: 'Odvojena vanjska kuhinja', it: 'Cucina esterna separata' }, { en: 'Wood-burning stove', de: 'Holzofen', sl: 'Peč na drva', hr: 'Peć na drva', it: 'Stufa a legna' }, { en: 'Dining table for six', de: 'Esstisch für sechs', sl: 'Jedilna miza za šest', hr: 'Blagovaonski stol za šest osoba', it: 'Tavolo da pranzo per sei' }],
    maxGuests: 6, // Interhome / kroati.de listings (research/listing.json)
    beds: [{ en: "2 bedrooms with 180 cm double beds", de: "2 Schlafzimmer mit 180-cm-Doppelbett", sl: '2 spalnici z zakonsko posteljo 180 cm', hr: '2 spavaće sobe s bračnim krevetom od 180 cm', it: '2 camere con letto matrimoniale da 180 cm' }, { en: "Sofa bed for 2 in the living room", de: "Schlafsofa für 2 im Wohnzimmer", sl: 'Raztegljiv kavč za 2 v dnevni sobi', hr: 'Kauč na razvlačenje za 2 osobe u dnevnom boravku', it: 'Divano letto per 2 in soggiorno' }],
    // Platforms list 62 m²; the owner figure above may include terrace/balcony. TODO(owner): confirm.
    listedM2: 62,
    // TODO(owner): confirm the number of steps from the garden up to Apartment 1.
    highlights: {
      en: 'Ground floor, a few steps up from the garden, with its own outdoor kitchen. The easiest unit for small children and grandparents.',
      de: 'Erdgeschoss, ein paar Stufen über dem Garten, mit eigener Außenküche. Ideal für kleine Kinder und Großeltern.',
      sl: 'Pritličje, nekaj stopnic nad vrtom, z lastno zunanjo kuhinjo. Najbolj praktičen apartma za majhne otroke in stare starše.',
      hr: 'Prizemlje, nekoliko stepenica iznad vrta, s vlastitom vanjskom kuhinjom. Najpraktičniji apartman za malu djecu te bake i djedove.',
      it: 'Piano terra, pochi gradini sopra il giardino, con cucina esterna propria. L’appartamento più comodo per bambini piccoli e nonni.',
    },
    photos: ['app1-terrace.jpg', 'app1-livingroom.jpg', 'app1-kitchen.jpg', 'app1-bedroom.jpg', 'app1-bathroom.jpg'],
    color: '#d9653b',
  },
  {
    id: 'apt2',
    number: 2,
    // Listings disagree on the view: partial sea view (Interhome/houfy),
    // courtyard (kroati.de), garden (Booking). TODO(owner): confirm before
    // calling it "sea view" again.
    name: { en: 'Apartment 2 · Loggia', de: 'Apartment 2 · Loggia', sl: 'Apartma 2 · loža', hr: 'Apartman 2 · lođa', it: 'Appartamento 2 · loggia' },
    floor: 'upper',
    areaM2: 57,
    bedrooms: 2,
    outdoor: { en: 'Covered front loggia, partial sea view', de: 'Überdachte Loggia mit teilweisem Meerblick', sl: 'Pokrita loža na sprednji strani, delni pogled na morje', hr: 'Natkrivena prednja lođa, djelomičan pogled na more', it: 'Loggia coperta sul fronte, vista mare parziale' },
    extras: [{ en: 'Air conditioning', de: 'Klimaanlage', sl: 'Klimatska naprava', hr: 'Klima-uređaj', it: 'Aria condizionata' }, { en: 'Dining table for four', de: 'Esstisch für vier', sl: 'Jedilna miza za štiri', hr: 'Blagovaonski stol za četiri osobe', it: 'Tavolo da pranzo per quattro' }],
    maxGuests: 4, // Interhome / kroati.de listings (research/listing.json)
    beds: [{ en: "2 bedrooms with 180 cm double beds", de: "2 Schlafzimmer mit 180-cm-Doppelbett", sl: '2 spalnici z zakonsko posteljo 180 cm', hr: '2 spavaće sobe s bračnim krevetom od 180 cm', it: '2 camere con letto matrimoniale da 180 cm' }],
    // Platforms list 47 m²; the owner figure above may include terrace/balcony. TODO(owner): confirm.
    listedM2: 47,
    highlights: {
      en: 'Upstairs, with a partial sea view towards the Velebit from the loggia.',
      de: 'Obergeschoss, von der Loggia teilweiser Meerblick Richtung Velebit.',
      sl: 'V nadstropju, z delnim pogledom z lože na morje proti Velebitu.',
      hr: 'Na katu, s djelomičnim pogledom s lođe na more prema Velebitu.',
      it: 'Al piano superiore, con vista mare parziale verso il Velebit dalla loggia.',
    },
    photos: ['app2-terrace.jpg', 'app2-terrace2.jpg', 'app2-livingroom.jpg', 'app2-bathroom.jpg'],
    color: '#2f74c0',
  },
  {
    id: 'apt3',
    number: 3,
    name: { en: 'Apartment 3 · Pergola terrace', de: 'Apartment 3 · Pergola-Terrasse', sl: 'Apartma 3 · terasa s pergolo', hr: 'Apartman 3 · terasa s pergolom', it: 'Appartamento 3 · terrazza con pergola' },
    floor: 'upper',
    // TODO(owner): area of apartment 3. Platforms list 22 m² (2 guests, 5 m²
    // balcony); the owner brief says 46 m², which napros.si gives for Apt 4.
    areaM2: null,
    bedrooms: 1,
    // TODO(owner): the listings describe a roofed 5 m² balcony, not a long terrace.
    outdoor: { en: 'Long covered terrace under a timber pergola', de: 'Lange überdachte Terrasse unter Holzpergola', sl: 'Dolga pokrita terasa pod leseno pergolo', hr: 'Duga natkrivena terasa pod drvenom pergolom', it: 'Lunga terrazza coperta sotto una pergola in legno' },
    extras: [{ en: 'Own entrance via the outside stair', de: 'Eigener Eingang über die Außentreppe', sl: 'Lasten vhod po zunanjih stopnicah', hr: 'Vlastiti ulaz vanjskim stubištem', it: 'Ingresso indipendente dalla scala esterna' }],
    maxGuests: 2, // Interhome / kroati.de listings (research/listing.json)
    beds: [{ en: "1 bedroom with a 180 cm double bed", de: "1 Schlafzimmer mit 180-cm-Doppelbett", sl: '1 spalnica z zakonsko posteljo 180 cm', hr: '1 spavaća soba s bračnim krevetom od 180 cm', it: '1 camera con letto matrimoniale da 180 cm' }],
    listedM2: 22,
    highlights: {
      en: 'A private one-bedroom with its own entrance from the outside stair. Good for couples and cyclists.',
      de: 'Privates Apartment mit eigenem Eingang über die Außentreppe. Ideal für Paare und Radfahrer.',
      sl: 'Zaseben apartma z eno spalnico in lastnim vhodom po zunanjih stopnicah. Primeren za pare in kolesarje.',
      hr: 'Privatan apartman s jednom spavaćom sobom i vlastitim ulazom vanjskim stubištem. Odličan za parove i bicikliste.',
      it: 'Un bilocale riservato con ingresso indipendente dalla scala esterna. Ideale per coppie e ciclisti.',
    },
    photos: ['app3-entrance.jpg'],
    color: '#2c9a6b',
  },
  {
    id: 'apt4',
    number: 4,
    name: { en: 'Apartment 4 · Balcony', de: 'Apartment 4 · Balkon', sl: 'Apartma 4 · balkon', hr: 'Apartman 4 · balkon', it: 'Appartamento 4 · balcone' },
    floor: 'upper',
    areaM2: 46, // owner site napros.si
    bedrooms: 1,
    outdoor: { en: 'Balcony above the vine pergola', de: 'Balkon über der Weinlaube', sl: 'Balkon nad brajdo', hr: 'Balkon iznad odrine', it: 'Balcone sopra il pergolato di vite' },
    extras: [],
    maxGuests: 4, // Interhome / kroati.de listings (research/listing.json)
    beds: [{ en: "1 bedroom with a 180 cm double bed", de: "1 Schlafzimmer mit 180-cm-Doppelbett", sl: '1 spalnica z zakonsko posteljo 180 cm', hr: '1 spavaća soba s bračnim krevetom od 180 cm', it: '1 camera con letto matrimoniale da 180 cm' }, { en: "Sofa bed for 2 in the living room", de: "Schlafsofa für 2 im Wohnzimmer", sl: 'Raztegljiv kavč za 2 v dnevni sobi', hr: 'Kauč na razvlačenje za 2 osobe u dnevnom boravku', it: 'Divano letto per 2 in soggiorno' }],
    // Platforms list 44 m²; the owner figure above may include terrace/balcony. TODO(owner): confirm.
    listedM2: 44,
    highlights: {
      en: 'One bedroom and a living room with a sofa bed, with a balcony over the garden.',
      de: 'Ein Schlafzimmer und ein Wohnzimmer mit Schlafsofa, dazu ein Balkon über dem Garten.',
      sl: 'Ena spalnica in dnevna soba z raztegljivim kavčem ter balkon nad vrtom.',
      hr: 'Jedna spavaća soba i dnevni boravak s kaučem na razvlačenje te balkon iznad vrta.',
      it: 'Una camera e un soggiorno con divano letto, più un balcone sul giardino.',
    },
    // TODO(owner): interior photos (living room, bedroom, bathroom) for apartments 3 and 4.
    photos: ['driveway.jpg', '414970668.jpg'],
    color: '#8a5cc7',
  },
];

// All photos with captions. 'kind' groups them in the gallery.
export const PHOTOS = [
  { file: '20210810_184724.jpg', kind: 'house', en: 'The house in the evening sun', de: 'Das Haus in der Abendsonne', sl: 'Hiša v večernem soncu', hr: 'Kuća na večernjem suncu', it: 'La casa al sole della sera' },
  { file: '20210720_171634.jpg', kind: 'house', en: 'Front façade and garden', de: 'Vorderseite und Garten', sl: 'Pročelje in vrt', hr: 'Pročelje i vrt', it: 'Facciata e giardino' },
  { file: '20210720_171929.jpg', kind: 'house', en: 'Outside stair to the upper terrace', de: 'Außentreppe zur oberen Terrasse', sl: 'Zunanje stopnice do zgornje terase', hr: 'Vanjsko stubište do gornje terase', it: 'Scala esterna verso la terrazza superiore' },
  { file: '414970668.jpg', kind: 'house', en: 'From the street, gate no. 60', de: 'Von der Straße, Tor Nr. 60', sl: 'Pogled z ulice, vrata št. 60', hr: 'Pogled s ulice, vrata br. 60', it: 'Dalla strada, cancello n. 60' },
  { file: 'driveway.jpg', kind: 'house', en: 'Driveway under the vine pergola', de: 'Einfahrt unter der Weinlaube', sl: 'Dovoz pod brajdo', hr: 'Prilaz pod odrinom', it: 'Vialetto sotto il pergolato di vite' },
  { file: 'grillarea.jpg', kind: 'house', en: 'Grill area in the garden', de: 'Grillplatz im Garten', sl: 'Prostor za žar na vrtu', hr: 'Prostor za roštilj u vrtu', it: 'Zona barbecue in giardino' },
  { file: 'app1-terrace.jpg', kind: 'apt1', en: 'Apartment 1: covered terrace', de: 'Apartment 1: überdachte Terrasse', sl: 'Apartma 1: pokrita terasa', hr: 'Apartman 1: natkrivena terasa', it: 'Appartamento 1: terrazza coperta' },
  { file: 'app1-livingroom.jpg', kind: 'apt1', en: 'Apartment 1: living room with stove', de: 'Apartment 1: Wohnzimmer mit Ofen', sl: 'Apartma 1: dnevna soba s pečjo', hr: 'Apartman 1: dnevni boravak s peći', it: 'Appartamento 1: soggiorno con stufa' },
  { file: 'app1-kitchen.jpg', kind: 'apt1', en: 'Apartment 1: outdoor kitchen', de: 'Apartment 1: Außenküche', sl: 'Apartma 1: zunanja kuhinja', hr: 'Apartman 1: vanjska kuhinja', it: 'Appartamento 1: cucina esterna' },
  { file: 'app1-bedroom.jpg', kind: 'apt1', en: 'Apartment 1: bedroom', de: 'Apartment 1: Schlafzimmer', sl: 'Apartma 1: spalnica', hr: 'Apartman 1: spavaća soba', it: 'Appartamento 1: camera da letto' },
  { file: 'app1-bathroom.jpg', kind: 'apt1', en: 'Apartment 1: bathroom', de: 'Apartment 1: Bad', sl: 'Apartma 1: kopalnica', hr: 'Apartman 1: kupaonica', it: 'Appartamento 1: bagno' },
  { file: 'app2-terrace.jpg', kind: 'apt2', en: 'Apartment 2: covered loggia', de: 'Apartment 2: überdachte Loggia', sl: 'Apartma 2: pokrita loža', hr: 'Apartman 2: natkrivena lođa', it: 'Appartamento 2: loggia coperta' },
  { file: 'app2-terrace2.jpg', kind: 'apt2', en: 'Apartment 2: loggia', de: 'Apartment 2: Loggia', sl: 'Apartma 2: loža', hr: 'Apartman 2: lođa', it: 'Appartamento 2: loggia' },
  { file: 'app2-livingroom.jpg', kind: 'apt2', en: 'Apartment 2: living and dining', de: 'Apartment 2: Wohn- und Essbereich', sl: 'Apartma 2: dnevni prostor z jedilnico', hr: 'Apartman 2: dnevni boravak i blagovaonica', it: 'Appartamento 2: soggiorno e zona pranzo' },
  { file: 'app2-bathroom.jpg', kind: 'apt2', en: 'Apartment 2: bathroom', de: 'Apartment 2: Bad', sl: 'Apartma 2: kopalnica', hr: 'Apartman 2: kupaonica', it: 'Appartamento 2: bagno' },
  { file: 'app3-entrance.jpg', kind: 'apt3', en: 'Apartment 3: pergola terrace and entrance', de: 'Apartment 3: Pergola-Terrasse und Eingang', sl: 'Apartma 3: terasa s pergolo in vhod', hr: 'Apartman 3: terasa s pergolom i ulaz', it: 'Appartamento 3: terrazza con pergola e ingresso' },
  // Owner photos of the surroundings (geotagged, Sept 2021).
  { file: 'napros/20210720_171714.jpg', kind: 'area', en: 'Put kandelica, the quiet lane outside', de: 'Put kandelica, die ruhige Straße vor dem Haus', sl: 'Put kandelica, mirna ulica pred hišo', hr: 'Put kandelica, mirna ulica ispred kuće', it: 'Put kandelica, la stradina tranquilla davanti a casa', lat: 44.25846, lon: 15.15909 },
  { file: 'napros/20210918_110141.jpg', kind: 'area', en: 'Morning on the Sabunike shore, Velebit across the channel', de: 'Morgen am Ufer von Sabunike, gegenüber der Velebit', sl: 'Jutro na obali v Sabunikah, Velebit na drugi strani kanala', hr: 'Jutro na obali u Sabunikama, Velebit preko kanala', it: 'Mattina sulla riva di Sabunike, il Velebit oltre il canale', lat: 44.26188, lon: 15.16257 },
  { file: 'napros/20210918_152134.jpg', kind: 'area', en: 'Steps into the sea near the house', de: 'Stufen ins Meer nahe dem Haus', sl: 'Stopnice v morje blizu hiše', hr: 'Stepenice u more blizu kuće', it: 'Gradini che scendono in mare vicino a casa', lat: 44.26069, lon: 15.16437 },
  { file: 'napros/20210918_155421.jpg', kind: 'area', en: 'Sandbanks and jetties towards Nin', de: 'Sandbänke und Stege Richtung Nin', sl: 'Peščine in pomoli proti Ninu', hr: 'Pješčani sprudovi i mulići prema Ninu', it: 'Banchi di sabbia e pontili verso Nin', lat: 44.24731, lon: 15.17766 },
  { file: 'napros/20210918_155653.jpg', kind: 'area', en: 'Sandbars in knee-deep water', de: 'Sandbänke im knietiefen Wasser', sl: 'Peščine v vodi do kolen', hr: 'Sprudovi u vodi do koljena', it: 'Banchi di sabbia nell’acqua fino alle ginocchia', lat: 44.24649, lon: 15.17847 },
];
