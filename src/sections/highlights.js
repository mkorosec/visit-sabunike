// Highlights: 3–4 benefit tiles right under the hero. Audiences can supply
// their own (audience.highlights); otherwise the defaults below apply.

import './highlights.css';
import { esc, icon } from '../lib/util.js';
import { AIRPORT_DRIVE, ownerTodo } from './core-shared.js';

const HEADINGS = {
  general: { en: 'The short version', de: 'Kurz gesagt', sl: 'Na kratko', hr: 'Ukratko', it: 'In breve' },
  families: { en: 'Made for small feet and long summer days', de: 'Für kleine Füße und lange Sommertage', sl: 'Za majhne nožice in dolge poletne dni', hr: 'Za male nožice i duge ljetne dane', it: 'Per piedi piccoli e lunghe giornate d’estate' },
  cyclists: { en: 'Built around riding days', de: 'Rund um Radtage gebaut', sl: 'Ustvarjeno za dneve na kolesu', hr: 'Stvoreno za dane na biciklu', it: 'Pensata per le giornate in sella' },
  retreats: { en: 'A house that works for a team', de: 'Ein Haus, das für Teams funktioniert', sl: 'Hiša, ki ustreza ekipi', hr: 'Kuća po mjeri tima', it: 'Una casa che funziona per un team' },
};
const EYEBROW = { en: 'Why stay here', de: 'Warum hier', sl: 'Zakaj pri nas', hr: 'Zašto kod nas', it: 'Perché da noi' };

// Distances are phrased, never invented; the airport drive is from travel.json.
const DEFAULTS = {
  general: () => [
    { icon: 'wave', href: '#beaches', title: { en: 'Shallow sandy beaches', de: 'Flache Sandstrände', sl: 'Plitve peščene plaže', hr: 'Plitke pješčane plaže', it: 'Spiagge di sabbia con acqua bassa' }, text: { en: 'Sabunike’s knee-deep sandbars begin a short walk from the gate.', de: 'Die knietiefen Sandbänke von Sabunike beginnen wenige Gehminuten vom Tor.', sl: 'Peščine v Sabunikah z vodo do kolen so le nekaj minut hoje od vrat.', hr: 'Sprudovi u Sabunikama s vodom do koljena počinju nekoliko minuta hoda od vrata.', it: 'I banchi di sabbia di Sabunike, con l’acqua alle ginocchia, iniziano a pochi passi dal cancello.' } },
    { icon: 'mountain', title: { en: 'Velebit across the water', de: 'Velebit gegenüber', sl: 'Velebit na drugi strani morja', hr: 'Velebit preko mora', it: 'Il Velebit oltre il mare' }, text: { en: 'Sea and mountain views from the shore, and a partial sea view from Apartment 2’s loggia.', de: 'Meer- und Bergblick vom Ufer, dazu teilweise Meerblick von der Loggia von Apartment 2.', sl: 'Z obale pogled na morje in gore, z lože apartmaja 2 pa delni pogled na morje.', hr: 'S obale pogled na more i planine, a s lođe apartmana 2 djelomičan pogled na more.', it: 'Vista mare e montagne dalla riva, e vista mare parziale dalla loggia dell’appartamento 2.' } },
    { icon: 'users', href: '#villa', title: { en: 'Four apartments, one garden', de: 'Vier Apartments, ein Garten', sl: 'Štirje apartmaji, en vrt', hr: 'Četiri apartmana, jedan vrt', it: 'Quattro appartamenti, un giardino' }, text: { en: 'Book one apartment, or the whole house for family and friends.', de: 'Ein Apartment buchen — oder das ganze Haus für Familie und Freunde.', sl: 'Rezervirajte en apartma ali celo hišo za družino in prijatelje.', hr: 'Rezervirajte jedan apartman ili cijelu kuću za obitelj i prijatelje.', it: 'Prenotate un appartamento o tutta la casa per famiglia e amici.' } },
    { icon: 'euro', href: '#direct', title: { en: 'Book direct, pay less', de: 'Direkt buchen, weniger zahlen', sl: 'Rezervirajte neposredno, plačajte manj', hr: 'Rezervirajte izravno, platite manje', it: 'Prenotate direttamente, pagate meno' }, text: { en: 'No platform commission between us — so we can offer you a better price.', de: 'Keine Plattformprovision zwischen uns — darum ein besserer Preis für Sie.', sl: 'Med nami ni provizije platforme, zato vam lahko ponudimo boljšo ceno.', hr: 'Između nas nema provizije platforme, pa vam možemo ponuditi bolju cijenu.', it: 'Nessuna commissione di piattaforma tra noi: per questo possiamo offrirvi un prezzo migliore.' } },
  ],
  families: () => [
    { icon: 'wave', href: '#beaches', title: { en: 'Shallow, sandy beaches', de: 'Flache Sandstrände', sl: 'Plitve peščene plaže', hr: 'Plitke pješčane plaže', it: 'Spiagge di sabbia con acqua bassa' }, text: { en: 'Knee-deep water and sandbars, a short walk from the house.', de: 'Knietiefes Wasser und Sandbänke, wenige Gehminuten vom Haus.', sl: 'Voda do kolen in peščine, le nekaj minut hoje od hiše.', hr: 'Voda do koljena i pješčani sprudovi, nekoliko minuta hoda od kuće.', it: 'Acqua alle ginocchia e banchi di sabbia, a pochi passi da casa.' } },
    { icon: 'grill', title: { en: 'Garden & grill', de: 'Garten & Grill', sl: 'Vrt in žar', hr: 'Vrt i roštilj', it: 'Giardino e barbecue' }, text: { en: 'A lawn to run around on, fruit trees and a built-in barbecue for slow evenings.', de: 'Rasen zum Toben, Obstbäume und ein gemauerter Grill für lange Abende.', sl: 'Trata za tekanje naokrog, sadno drevje in zidan žar za lagodne večere.', hr: 'Travnjak za trčanje, voćke i zidani roštilj za opuštene večeri.', it: 'Un prato dove correre, alberi da frutto e un barbecue in muratura per serate senza fretta.' } },
    { icon: 'bed', href: '#villa', title: { en: 'Ground-floor apartment', de: 'Wohnung im Erdgeschoss', sl: 'Pritlični apartma', hr: 'Apartman u prizemlju', it: 'Appartamento al piano terra' }, text: { en: 'Apartment 1 is on the ground floor, a few steps up from the garden, with its own outdoor kitchen.', de: 'Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Garten, mit eigener Außenküche.', sl: 'Apartma 1 je v pritličju, nekaj stopnic nad vrtom, in ima lastno zunanjo kuhinjo.', hr: 'Apartman 1 nalazi se u prizemlju, nekoliko stepenica iznad vrta, i ima vlastitu vanjsku kuhinju.', it: 'L’appartamento 1 è al piano terra, pochi gradini sopra il giardino, con una cucina esterna tutta sua.' } },
    { icon: 'leaf', title: { en: 'A quiet lane', de: 'Eine ruhige Straße', sl: 'Mirna ulica', hr: 'Mirna ulica', it: 'Una stradina tranquilla' }, text: { en: 'Put kandelica is a residential lane, with parking inside the gate.', de: 'Put kandelica ist eine Wohnstraße, geparkt wird hinter dem Tor.', sl: 'Put kandelica je stanovanjska ulica, parkirate pa za vrati.', hr: 'Put kandelica je stambena ulica, a parkira se iza vrata.', it: 'Put kandelica è una via residenziale, con parcheggio dentro il cancello.' } },
  ],
  cyclists: () => [
    { icon: 'bike', href: '#cycling', title: { en: 'Ride from the door', de: 'Ab Haustür losfahren', sl: 'Na kolo kar pred hišo', hr: 'Na bicikl odmah ispred kuće', it: 'In sella da casa' }, text: { en: 'Flat coastal roads to Nin and Privlaka start at the gate — no car needed to warm up.', de: 'Flache Küstenstraßen nach Nin und Privlaka beginnen am Tor.', sl: 'Ravne obalne ceste proti Ninu in Privlaki se začnejo pri vratih — za ogrevanje ne potrebujete avta.', hr: 'Ravne obalne ceste prema Ninu i Privlaci počinju kod vrata — za zagrijavanje auto vam ne treba.', it: 'Le strade costiere pianeggianti verso Nin e Privlaka partono dal cancello: niente auto per scaldarsi.' } },
    { icon: 'sun', href: '#seasons', title: { en: 'Quiet shoulder-season roads', de: 'Ruhige Straßen in der Nebensaison', sl: 'Mirne ceste zunaj glavne sezone', hr: 'Mirne ceste izvan glavne sezone', it: 'Strade tranquille in bassa stagione' }, text: { en: 'Spring and autumn bring mild days and far less traffic than high summer.', de: 'Frühling und Herbst: milde Tage und viel weniger Verkehr als im Hochsommer.', sl: 'Pomlad in jesen prineseta mile dni in veliko manj prometa kot sredi poletja.', hr: 'Proljeće i jesen donose blage dane i mnogo manje prometa nego usred ljeta.', it: 'Primavera e autunno portano giornate miti e molto meno traffico che in piena estate.' } },
    { icon: 'mountain', title: { en: 'Velebit climbs', de: 'Velebit-Anstiege', sl: 'Vzponi na Velebit', hr: 'Usponi na Velebit', it: 'Salite sul Velebit' }, text: { en: 'The range across the channel is the backdrop — and the challenge — of every long ride.', de: 'Das Gebirge gegenüber ist Kulisse — und Herausforderung — jeder langen Tour.', sl: 'Gorovje na drugi strani kanala je kulisa — in izziv — vsake dolge ture.', hr: 'Planina preko kanala kulisa je — i izazov — svake duge vožnje.', it: 'La catena oltre il canale è lo sfondo, e la sfida, di ogni lunga uscita.' } },
    { icon: 'parking', title: { en: 'Bikes stay with you', de: 'Räder bleiben bei Ihnen', sl: 'Kolesa ostanejo pri vas', hr: 'Bicikli ostaju uz vas', it: 'Le bici restano con voi' }, text: { en: 'Secure storage on the gated property — ask us how we set it up for your group.', de: 'Sicher abgestellt auf dem umzäunten Grundstück — fragen Sie uns nach Details.', sl: 'Varna hramba na ograjenem posestvu — vprašajte nas, kako jo uredimo za vašo skupino.', hr: 'Sigurno spremanje na ograđenom imanju — pitajte nas kako ga organiziramo za vašu grupu.', it: 'Deposito sicuro nella proprietà recintata: chiedeteci come lo organizziamo per il vostro gruppo.' }, todo: 'Confirm bike storage (lockable room? hose? tools?)' },
  ],
  retreats: () => [
    { icon: 'users', href: '#villa', title: { en: 'The whole house, no other guests', de: 'Das ganze Haus, keine anderen Gäste', sl: 'Cela hiša, brez drugih gostov', hr: 'Cijela kuća, bez drugih gostiju', it: 'Tutta la casa, nessun altro ospite' }, text: { en: 'Four apartments with their own entrances: privacy at night, together in the garden by day.', de: 'Vier Apartments mit eigenem Eingang: nachts Privatsphäre, tagsüber zusammen im Garten.', sl: 'Štirje apartmaji z ločenimi vhodi: ponoči zasebnost, podnevi skupaj na vrtu.', hr: 'Četiri apartmana s vlastitim ulazima: noću privatnost, danju zajedno u vrtu.', it: 'Quattro appartamenti con ingressi indipendenti: privacy la notte, tutti insieme in giardino di giorno.' } },
    { icon: 'bed', href: '#villa', title: { en: 'Up to 16 guests', de: 'Bis zu 16 Gäste', sl: 'Do 16 gostov', hr: 'Do 16 gostiju', it: 'Fino a 16 ospiti' }, text: { en: 'Six bedrooms with 180\u00a0cm double beds, plus two sofa beds for two.', de: 'Sechs Schlafzimmer mit 180-cm-Doppelbett, dazu zwei Schlafsofas für je zwei.', sl: 'Šest spalnic z zakonskimi posteljami 180\u00a0cm in še dva raztegljiva kavča za dva.', hr: 'Šest spavaćih soba s bračnim krevetima od 180\u00a0cm te dva kauča na razvlačenje za po dvije osobe.', it: 'Sei camere con letti matrimoniali da 180\u00a0cm, più due divani letto da due.' } },
    { icon: 'plane', href: '#travel', title: { en: 'Close to Zadar Airport', de: 'Nah am Flughafen Zadar', sl: 'Blizu letališča Zadar', hr: 'Blizu Zračne luke Zadar', it: 'Vicino all’aeroporto di Zadar' }, text: { en: `About ${AIRPORT_DRIVE.min} minutes by car from ZAD (${Math.round(AIRPORT_DRIVE.km)} km), easy for colleagues flying in.`, de: `Ca. ${AIRPORT_DRIVE.min} Minuten mit dem Auto vom Flughafen ZAD (${Math.round(AIRPORT_DRIVE.km)} km), bequem für anreisende Kollegen.`, sl: `Približno ${AIRPORT_DRIVE.min} minut z avtom od letališča ZAD (${Math.round(AIRPORT_DRIVE.km)} km), priročno za sodelavce, ki priletijo.`, hr: `Oko ${AIRPORT_DRIVE.min} minuta autom od zračne luke ZAD (${Math.round(AIRPORT_DRIVE.km)} km), praktično za kolege koji dolaze avionom.`, it: `Circa ${AIRPORT_DRIVE.min} minuti in auto dall’aeroporto ZAD (${Math.round(AIRPORT_DRIVE.km)} km), comodo per i colleghi in arrivo in aereo.` } },
    { icon: 'mail', href: '#inquiry', title: { en: 'One contact for everything', de: 'Ein Ansprechpartner für alles', sl: 'En stik za vse', hr: 'Jedna osoba za sve', it: 'Un unico referente per tutto' }, text: { en: 'You plan the stay with us directly. Need one invoice for the whole group? Ask us.', de: 'Sie planen den Aufenthalt direkt mit uns. Eine Rechnung für die ganze Gruppe? Fragen Sie uns.', sl: 'Bivanje načrtujete neposredno z nami. Potrebujete en račun za vso skupino? Vprašajte nas.', hr: 'Boravak planirate izravno s nama. Trebate jedan račun za cijelu grupu? Pitajte nas.', it: 'Organizzate il soggiorno direttamente con noi. Vi serve un’unica fattura per tutto il gruppo? Chiedeteci.' }, todo: 'Confirm one invoice for the whole house (R1 for companies?)' },
  ],
};

export function highlightsFor(audience) {
  if (audience.highlights?.length) return audience.highlights;
  return (DEFAULTS[audience.id] || DEFAULTS.general)();
}

function tile(item, ctx, i) {
  const linked = item.href && ctx.audience.sections.includes(item.href.slice(1));
  const tag = linked ? 'a' : 'div';
  const attrs = linked ? ` href="${esc(item.href)}"` : '';
  return `<${tag} class="hl-tile"${attrs}>
    <span class="hl-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
    <span class="hl-icon">${icon(item.icon, { size: 26 })}</span>
    <h3>${esc(ctx.t(item.title))}${item.todo ? ` ${ownerTodo(item.todo)}` : ''}</h3>
    <p>${esc(ctx.t(item.text))}</p>
    ${linked ? `<span class="hl-more" aria-hidden="true">${icon('arrow', { size: 18 })}</span>` : ''}
  </${tag}>`;
}

export default {
  id: 'highlights',
  nav: null,
  render(ctx) {
    const items = highlightsFor(ctx.audience);
    const heading = ctx.audience.highlightsHeading || HEADINGS[ctx.audience.id] || HEADINGS.general;
    return `<div class="container">
      <div class="hl-layout">
        <div class="section-head hl-head">
          <p class="eyebrow">${esc(ctx.t(EYEBROW))}</p>
          <h2>${esc(ctx.t(heading))}</h2>
        </div>
        <div class="hl-grid" style="--hl-count:${items.length}">${items.map((it, i) => tile(it, ctx, i)).join('')}</div>
      </div>
    </div>`;
  },
};
