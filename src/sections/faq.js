// FAQ accordion. Entries are data (FAQ below) so later work can add more,
// e.g. from src/data/*.json. Unknown owner facts say "Ask us" instead of guessing.
//
// Entry shape:
//   id, audiences: ['*'] | [audience ids], q: {en, de, …},
//   a: {en, de, …} | (ctx) => {en, de, …}   — plain text; may contain <a> markup via `html: true`
//   todo: 'what the owner must confirm'      — shows a TODO(owner) badge in dev
//   confirm: key in SITE.directBooking.confirmed — once true, the todo is
//            settled; entries with an open todo stay out of the structured data

import './faq.css';
import { esc, icon } from '../lib/util.js';
import { AIRPORT_DRIVE, isConfirmed, ownerTodo, ownerValue } from './core-shared.js';

export const FAQ = [
  {
    id: 'checkin',
    audiences: ['*'],
    q: { en: 'What are the check-in and check-out times?', de: 'Wann sind Check-in und Check-out?', sl: 'Kdaj je prihod in kdaj odhod?', hr: 'Kada je prijava, a kada odjava?', it: 'Quali sono gli orari di check-in e check-out?' },
    a: (ctx) => ({
      en: `Check-in is from ${ctx.site.directBooking.checkIn} and check-out by ${ctx.site.directBooking.checkOut}. Arriving later or leaving on an evening flight? Tell us — we’ll say honestly what’s possible for your dates.`,
      de: `Check-in ab ${ctx.site.directBooking.checkIn}, Check-out bis ${ctx.site.directBooking.checkOut}. Später Anreise oder Abendflug? Sagen Sie es uns — wir sagen ehrlich, was an Ihrem Termin möglich ist.`,
      sl: `Prihod je od ${ctx.site.directBooking.checkIn}, odhod do ${ctx.site.directBooking.checkOut}. Prispete pozneje ali odhajate z večernim letom? Sporočite nam — iskreno vam povemo, kaj je mogoče v vašem terminu.`,
      hr: `Prijava je od ${ctx.site.directBooking.checkIn}, odjava do ${ctx.site.directBooking.checkOut}. Stižete kasnije ili odlazite večernjim letom? Javite nam — iskreno ćemo vam reći što je moguće u vašem terminu.`,
      it: `Il check-in è dalle ${ctx.site.directBooking.checkIn} e il check-out entro le ${ctx.site.directBooking.checkOut}. Arrivate più tardi o ripartite con un volo serale? Ditecelo: vi diremo sinceramente cosa è possibile per le vostre date.`,
    }),
    todo: 'Confirm check-in/out times for direct stays',
    confirm: 'checkIn',
  },
  {
    id: 'min-stay',
    audiences: ['*'],
    q: { en: 'Is there a minimum stay?', de: 'Gibt es einen Mindestaufenthalt?', sl: 'Ali je določeno najkrajše bivanje?', hr: 'Postoji li minimalni boravak?', it: 'C’è un soggiorno minimo?' },
    a: (ctx) => {
      const n = ctx.site.directBooking.minNights;
      return ownerValue(
        ctx,
        'minNights',
        {
          en: `Direct stays start at ${n} nights. Want something shorter? Ask us — outside the peak weeks it is often possible.`,
          de: `Direktaufenthalte ab ${n} Nächten. Kürzer? Fragen Sie uns — außerhalb der Hauptsaison geht es oft.`,
          sl: `Neposredna bivanja so možna od ${n} noči naprej. Želite krajše? Vprašajte nas — zunaj najbolj obiskanih tednov je to pogosto mogoče.`,
          hr: `Izravni boravci počinju od ${n} noćenja. Želite kraće? Pitajte nas — izvan najtraženijih tjedana to je često moguće.`,
          it: `I soggiorni diretti partono da ${n} notti. Volete qualcosa di più breve? Chiedeteci: fuori dalle settimane di punta spesso si può.`,
        },
        {
          en: `Platform listings use a ${n}-night minimum. Booking directly, just ask us about shorter stays for your dates.`,
          de: `Auf Plattformen gilt ein Mindestaufenthalt von ${n} Nächten. Bei Direktbuchung fragen Sie uns einfach nach kürzeren Aufenthalten.`,
          sl: `Oglasi na platformah zahtevajo najmanj ${n} noči. Pri neposredni rezervaciji nas preprosto vprašajte za krajše bivanje v vašem terminu.`,
          hr: `Oglasi na platformama traže najmanje ${n} noćenja. Kod izravne rezervacije jednostavno nas pitajte za kraći boravak u vašem terminu.`,
          it: `Sui portali il soggiorno minimo è di ${n} notti. Prenotando direttamente, chiedeteci pure se per le vostre date ci si può fermare meno.`,
        },
      );
    },
    todo: 'Minimum stay for direct bookings',
    confirm: 'minNights',
  },
  {
    id: 'how-to-book',
    audiences: ['*'],
    q: { en: 'How does booking directly work?', de: 'Wie funktioniert die Direktbuchung?', sl: 'Kako poteka neposredna rezervacija?', hr: 'Kako funkcionira izravna rezervacija?', it: 'Come funziona la prenotazione diretta?' },
    a: (ctx) => {
      const p = ctx.site.directBooking.depositPercent;
      return ownerValue(
        ctx,
        'deposit',
        {
          en: `Send us an inquiry with your dates. We reply personally with availability and a price. If you like it, a deposit of ${p} % secures the dates. You never pay anything before you have our written confirmation.`,
          de: `Senden Sie uns eine Anfrage mit Ihren Daten. Wir antworten persönlich mit Verfügbarkeit und Preis. Passt es, sichert eine Anzahlung von ${p} % den Termin. Sie zahlen nie, bevor Sie unsere schriftliche Bestätigung haben.`,
          sl: `Pošljite nam povpraševanje s svojim terminom. Osebno vam odgovorimo z razpoložljivostjo in ceno. Če vam ustreza, termin zagotovite s predujmom v višini ${p} %. Ničesar ne plačate, preden prejmete našo pisno potrditev.`,
          hr: `Pošaljite nam upit sa svojim terminom. Osobno vam odgovaramo s dostupnošću i cijenom. Ako vam odgovara, termin osiguravate predujmom od ${p} %. Ništa ne plaćate prije nego što dobijete našu pisanu potvrdu.`,
          it: `Inviateci una richiesta con le vostre date. Vi rispondiamo di persona con disponibilità e prezzo. Se vi va bene, un acconto del ${p} % blocca le date. Non pagate nulla prima di avere la nostra conferma scritta.`,
        },
        {
          en: 'Send us an inquiry with your dates. We reply personally with availability, a price and how to secure the dates. You never pay anything before you have our written confirmation.',
          de: 'Senden Sie uns eine Anfrage mit Ihren Daten. Wir antworten persönlich mit Verfügbarkeit, Preis und wie Sie den Termin sichern. Sie zahlen nie, bevor Sie unsere schriftliche Bestätigung haben.',
          sl: 'Pošljite nam povpraševanje s svojim terminom. Osebno vam odgovorimo z razpoložljivostjo, ceno in navodili, kako termin zagotovite. Ničesar ne plačate, preden prejmete našo pisno potrditev.',
          hr: 'Pošaljite nam upit sa svojim terminom. Osobno vam odgovaramo s dostupnošću, cijenom i uputama kako osigurati termin. Ništa ne plaćate prije nego što dobijete našu pisanu potvrdu.',
          it: 'Inviateci una richiesta con le vostre date. Vi rispondiamo di persona con disponibilità, prezzo e come bloccare le date. Non pagate nulla prima di avere la nostra conferma scritta.',
        },
      );
    },
    todo: 'Confirm deposit % and payment flow',
    confirm: 'deposit',
  },
  {
    id: 'cheaper',
    audiences: ['*'],
    q: { en: 'Is booking directly really cheaper?', de: 'Ist die Direktbuchung wirklich günstiger?', sl: 'Je neposredna rezervacija res cenejša?', hr: 'Je li izravna rezervacija stvarno jeftinija?', it: 'Prenotare direttamente conviene davvero?' },
    a: (ctx) => {
      const [lo, hi] = ctx.site.directBooking.otaCommissionPercentRange;
      const d = ctx.site.directBooking.discountPercent;
      return ownerValue(
        ctx,
        'discount',
        {
          en: `Booking platforms typically charge hosts ${lo}–${hi} % commission. Without that cost we can offer you up to ${d} % below the platform price for the same apartment and dates.`,
          de: `Buchungsplattformen berechnen Gastgebern meist ${lo}–${hi} % Provision. Ohne diese Kosten bieten wir Ihnen bis zu ${d} % unter dem Plattformpreis für dasselbe Apartment und denselben Termin.`,
          sl: `Platforme za rezervacije gostiteljem običajno zaračunajo ${lo}–${hi} % provizije. Brez tega stroška vam lahko za isti apartma in termin ponudimo ceno, ki je do ${d} % nižja od cene na platformi.`,
          hr: `Platforme za rezervacije domaćinima obično naplaćuju ${lo}–${hi} % provizije. Bez tog troška možemo vam za isti apartman i termin ponuditi cijenu do ${d} % nižu od one na platformi.`,
          it: `I portali di prenotazione applicano di solito ai proprietari una commissione del ${lo}–${hi} %. Senza questo costo possiamo offrirvi fino al ${d} % in meno rispetto al prezzo del portale, per lo stesso appartamento e le stesse date.`,
        },
        {
          en: `Booking platforms typically charge hosts ${lo}–${hi} % commission. Without that cost in between, we can pass part of it on to you — ask us for the direct price for your apartment and dates.`,
          de: `Buchungsplattformen berechnen Gastgebern meist ${lo}–${hi} % Provision. Ohne diese Kosten können wir einen Teil an Sie weitergeben — fragen Sie nach dem Direktpreis für Ihr Apartment und Ihren Termin.`,
          sl: `Platforme za rezervacije gostiteljem običajno zaračunajo ${lo}–${hi} % provizije. Ker tega stroška ni, lahko del prihranka namenimo vam — povprašajte nas za neposredno ceno za vaš apartma in termin.`,
          hr: `Platforme za rezervacije domaćinima obično naplaćuju ${lo}–${hi} % provizije. Bez tog troška u sredini dio uštede možemo prepustiti vama — pitajte nas za izravnu cijenu za vaš apartman i termin.`,
          it: `I portali di prenotazione applicano di solito ai proprietari una commissione del ${lo}–${hi} %. Senza questo costo in mezzo possiamo girarvene una parte: chiedeteci il prezzo diretto per il vostro appartamento e le vostre date.`,
        },
      );
    },
    todo: 'Confirm direct discount',
    confirm: 'discount',
  },
  {
    id: 'beach',
    audiences: ['*'],
    q: { en: 'How far is the beach?', de: 'Wie weit ist es zum Strand?', sl: 'Kako daleč je plaža?', hr: 'Koliko je daleko plaža?', it: 'Quanto dista la spiaggia?' },
    a: {
      en: 'The sea is a short walk from the gate. The nearest swimming spot is the Sabunike pier (Sabunike Mol); the shallow sandy beaches of Sabunike and Nin’s Queen’s Beach are close by. See the beach section for distances and a map.',
      de: 'Das Meer ist wenige Gehminuten vom Tor entfernt. Der nächste Badeplatz ist die Mole von Sabunike; die flachen Sandstrände von Sabunike und der Königinnenstrand von Nin liegen in der Nähe. Entfernungen und Karte im Strandbereich.',
      sl: 'Morje je le nekaj minut hoje od vrat. Najbližje kopališče je pomol v Sabunikah (Sabunike Mol); plitve peščene plaže v Sabunikah in ninska Kraljičina plaža so v bližini. Razdalje in zemljevid najdete v razdelku o plažah.',
      hr: 'More je nekoliko minuta hoda od vrata. Najbliže kupalište je mol u Sabunikama (Sabunike Mol); plitke pješčane plaže u Sabunikama i ninska Kraljičina plaža su u blizini. Udaljenosti i kartu pronaći ćete u odjeljku o plažama.',
      it: 'Il mare è a pochi passi dal cancello. Il punto bagno più vicino è il molo di Sabunike (Sabunike Mol); le spiagge di sabbia con acqua bassa di Sabunike e Kraljičina plaža di Nin sono vicine. Distanze e mappa nella sezione sulle spiagge.',
    },
  },
  {
    id: 'parking',
    audiences: ['*'],
    q: { en: 'Is there parking?', de: 'Gibt es Parkplätze?', sl: 'Ali je na voljo parkirišče?', hr: 'Ima li parkinga?', it: 'C’è parcheggio?' },
    a: { en: 'Yes — free private parking on the gated driveway.', de: 'Ja — kostenlose Privatparkplätze in der umzäunten Einfahrt.', sl: 'Da — brezplačno zasebno parkirišče na ograjenem dovozu.', hr: 'Da — besplatan privatni parking na ograđenom prilazu.', it: 'Sì: parcheggio privato gratuito nel vialetto chiuso da un cancello.' },
  },
  {
    id: 'wifi',
    audiences: ['*'],
    q: { en: 'Is there Wi-Fi? Can I work remotely?', de: 'Gibt es WLAN? Kann ich remote arbeiten?', sl: 'Ali je na voljo Wi-Fi? Lahko delam na daljavo?', hr: 'Ima li Wi-Fi? Mogu li raditi na daljinu?', it: 'C’è il Wi-Fi? Posso lavorare da remoto?' },
    a: { en: 'Yes, there is Wi-Fi in the apartments. If you rely on video calls, ask us for the current connection speed before you book.', de: 'Ja, es gibt WLAN in den Apartments. Wenn Sie auf Videocalls angewiesen sind, fragen Sie uns vorab nach der aktuellen Geschwindigkeit.', sl: 'Da, v apartmajih je Wi-Fi. Če ste odvisni od video klicev, nas pred rezervacijo vprašajte za trenutno hitrost povezave.', hr: 'Da, u apartmanima postoji Wi-Fi. Ako ovisite o video pozivima, prije rezervacije pitajte nas za trenutačnu brzinu veze.', it: 'Sì, negli appartamenti c’è il Wi-Fi. Se dipendete dalle videochiamate, chiedeteci la velocità attuale della connessione prima di prenotare.' },
    todo: 'Confirm Wi-Fi speed (Mbit/s) and coverage in all apartments',
  },
  {
    id: 'pets',
    audiences: ['*'],
    q: { en: 'Can we bring a dog?', de: 'Dürfen wir einen Hund mitbringen?', sl: 'Lahko pripeljemo psa?', hr: 'Možemo li dovesti psa?', it: 'Possiamo portare il cane?' },
    a: { en: 'Ask us before you book, please — we’ll give you a straight answer for your dates and apartment.', de: 'Bitte fragen Sie uns vor der Buchung — wir geben Ihnen eine klare Antwort für Termin und Apartment.', sl: 'Prosimo, vprašajte nas pred rezervacijo — jasno vam odgovorimo za vaš termin in apartma.', hr: 'Molimo, pitajte nas prije rezervacije — dat ćemo vam jasan odgovor za vaš termin i apartman.', it: 'Chiedeteci prima di prenotare, per favore: vi daremo una risposta chiara per le vostre date e il vostro appartamento.' },
    todo: 'Pet policy (platform listings currently say no pets)',
  },
  {
    id: 'tourist-tax',
    audiences: ['*'],
    q: { en: 'Is there a tourist tax?', de: 'Gibt es eine Kurtaxe?', sl: 'Ali je treba plačati turistično takso?', hr: 'Plaća li se boravišna pristojba?', it: 'C’è una tassa di soggiorno?' },
    a: {
      en: 'Yes. Croatia charges a tourist tax (boravišna pristojba) per person per night; children are exempt or pay a reduced rate depending on age. Ask us whether it is included in your quote — we always show it clearly.',
      de: 'Ja. Kroatien erhebt eine Kurtaxe (boravišna pristojba) pro Person und Nacht; Kinder sind je nach Alter befreit oder zahlen weniger. Fragen Sie, ob sie in Ihrem Angebot enthalten ist — wir weisen sie immer klar aus.',
      sl: 'Da. Na Hrvaškem se plačuje turistična taksa (boravišna pristojba) na osebo na noč; otroci so glede na starost oproščeni ali plačajo znižan znesek. Vprašajte nas, ali je vključena v ponudbo — vedno jo jasno navedemo.',
      hr: 'Da. U Hrvatskoj se plaća boravišna pristojba po osobi i noćenju; djeca su, ovisno o dobi, oslobođena ili plaćaju umanjeni iznos. Pitajte nas je li uključena u ponudu — uvijek je jasno iskazujemo.',
      it: 'Sì. In Croazia si paga una tassa di soggiorno (boravišna pristojba) per persona e per notte; i bambini, a seconda dell’età, sono esenti o pagano una tariffa ridotta. Chiedeteci se è inclusa nel preventivo: la indichiamo sempre in modo chiaro.',
    },
    todo: 'Tourist tax: included or charged on site? amount?',
  },
  {
    id: 'payment',
    audiences: ['*'],
    q: { en: 'How can I pay?', de: 'Wie kann ich bezahlen?', sl: 'Kako lahko plačam?', hr: 'Kako mogu platiti?', it: 'Come posso pagare?' },
    a: { en: 'Ask us — we confirm the payment options in our reply, together with the price.', de: 'Fragen Sie uns — wir nennen die Zahlungsmöglichkeiten zusammen mit dem Preis.', sl: 'Vprašajte nas — načine plačila vam sporočimo v odgovoru, skupaj s ceno.', hr: 'Pitajte nas — načine plaćanja navest ćemo u odgovoru, zajedno s cijenom.', it: 'Chiedeteci: vi indichiamo le modalità di pagamento nella risposta, insieme al prezzo.' },
    todo: 'Payment methods (bank transfer, card, cash?)',
  },
  {
    id: 'cancellation',
    audiences: ['*'],
    q: { en: 'What if we need to cancel?', de: 'Was, wenn wir stornieren müssen?', sl: 'Kaj, če moramo odpovedati?', hr: 'Što ako moramo otkazati?', it: 'E se dobbiamo annullare?' },
    a: { en: 'Ask us. We put the cancellation terms in writing before you pay anything, so you know exactly where you stand.', de: 'Fragen Sie uns. Wir nennen die Stornobedingungen schriftlich, bevor Sie etwas zahlen.', sl: 'Vprašajte nas. Pogoje odpovedi vam pisno sporočimo, preden karkoli plačate, tako da natančno veste, pri čem ste.', hr: 'Pitajte nas. Uvjete otkazivanja dobit ćete pisano prije nego što išta platite, pa ćete točno znati na čemu ste.', it: 'Chiedeteci. Vi mettiamo per iscritto le condizioni di cancellazione prima che paghiate qualsiasi cosa, così sapete esattamente come stanno le cose.' },
    todo: 'Cancellation policy',
  },
  {
    id: 'children',
    audiences: ['general', 'families'],
    q: { en: 'Is the house suitable for small children?', de: 'Ist das Haus für kleine Kinder geeignet?', sl: 'Ali je hiša primerna za majhne otroke?', hr: 'Je li kuća prikladna za malu djecu?', it: 'La casa è adatta ai bambini piccoli?' },
    a: {
      en: 'Children of all ages are welcome. Apartment 1 is on the ground floor, a few steps up from the garden, and the beaches nearby are shallow and sandy. Platform listings say cots and extra beds are not available — ask us and we’ll tell you what we can arrange.',
      de: 'Kinder jeden Alters sind willkommen. Apartment 1 liegt im Erdgeschoss, ein paar Stufen über dem Garten, und die Strände in der Nähe sind flach und sandig. Laut Plattformen sind Babybetten und Zustellbetten nicht möglich — fragen Sie uns, was wir einrichten können.',
      sl: 'Otroci vseh starosti so dobrodošli. Apartma 1 je v pritličju, nekaj stopnic nad vrtom, plaže v bližini pa so plitve in peščene. Po navedbah platform otroške posteljice in dodatna ležišča niso na voljo — vprašajte nas in povemo vam, kaj lahko uredimo.',
      hr: 'Djeca svih uzrasta su dobrodošla. Apartman 1 nalazi se u prizemlju, nekoliko stepenica iznad vrta, a obližnje plaže su plitke i pješčane. Prema platformama, dječji krevetići i pomoćni ležajevi nisu dostupni — pitajte nas i reći ćemo vam što možemo organizirati.',
      it: 'I bambini di ogni età sono i benvenuti. L’appartamento 1 è al piano terra, pochi gradini sopra il giardino, e le spiagge vicine hanno acqua bassa e sabbia. Secondo i portali culle e letti aggiuntivi non sono disponibili: chiedeteci e vi diremo cosa possiamo organizzare.',
    },
    todo: 'Cots / extra beds / high chairs: really not possible? (Trip.com says no)',
  },
  {
    id: 'whole-house',
    audiences: ['general', 'families', 'retreats'],
    q: { en: 'Can we book the whole house?', de: 'Können wir das ganze Haus buchen?', sl: 'Lahko rezerviramo celo hišo?', hr: 'Možemo li rezervirati cijelu kuću?', it: 'Possiamo prenotare tutta la casa?' },
    a: { en: 'Yes. Choose “Whole house” in the inquiry form and tell us how many of you are coming — we’ll send you one price for all four apartments.', de: 'Ja. Wählen Sie im Formular „Ganzes Haus“ und nennen Sie die Personenzahl — wir schicken einen Preis für alle vier Apartments.', sl: 'Da. V obrazcu za povpraševanje izberite »Cela hiša« in nam sporočite, koliko vas bo — poslali vam bomo eno ceno za vse štiri apartmaje.', hr: 'Da. U obrascu za upit odaberite „Cijela kuća” i javite nam koliko vas dolazi — poslat ćemo vam jednu cijenu za sva četiri apartmana.', it: 'Sì. Nel modulo di richiesta scegliete «Tutta la casa» e diteci quanti siete: vi mandiamo un unico prezzo per tutti e quattro gli appartamenti.' },
  },
  {
    id: 'bikes',
    audiences: ['cyclists'],
    q: { en: 'Where do our bikes stay?', de: 'Wo bleiben unsere Fahrräder?', sl: 'Kje bodo naša kolesa?', hr: 'Gdje ostaju naši bicikli?', it: 'Dove teniamo le bici?' },
    a: { en: 'On the gated property. Tell us how many bikes you bring and we’ll tell you exactly how we store them.', de: 'Auf dem umzäunten Grundstück. Sagen Sie uns, wie viele Räder Sie mitbringen, wir erklären die Unterbringung.', sl: 'Na ograjenem posestvu. Sporočite nam, koliko koles pripeljete, in natančno vam povemo, kako jih shranimo.', hr: 'Na ograđenom imanju. Javite nam koliko bicikala donosite i točno ćemo vam reći kako ih spremamo.', it: 'Nella proprietà recintata. Diteci quante bici portate e vi spieghiamo esattamente come le sistemiamo.' },
    todo: 'Bike storage details (lockable? covered? hose, tools?)',
  },
  {
    id: 'invoice',
    audiences: ['retreats'],
    q: { en: 'Can you invoice our company (R1)?', de: 'Können Sie an unsere Firma fakturieren (R1)?', sl: 'Lahko izstavite račun našemu podjetju (R1)?', hr: 'Možete li izdati račun našoj tvrtki (R1)?', it: 'Potete fatturare alla nostra azienda (R1)?' },
    a: { en: 'Tell us your company name and whether you need an R1 invoice when you send the inquiry, and we confirm what we can issue before you book.', de: 'Nennen Sie uns in der Anfrage Firmennamen und ob Sie eine R1-Rechnung brauchen — wir bestätigen vor der Buchung, was wir ausstellen können.', sl: 'V povpraševanju navedite ime podjetja in ali potrebujete račun R1, mi pa vam pred rezervacijo potrdimo, kaj lahko izstavimo.', hr: 'U upitu navedite naziv tvrtke i trebate li R1 račun, a mi ćemo vam prije rezervacije potvrditi što možemo izdati.', it: 'Nella richiesta indicate il nome dell’azienda e se vi serve una fattura R1: prima della prenotazione vi confermiamo cosa possiamo emettere.' },
    todo: 'Which invoice types Napros d.o.o. can issue (R1? EU VAT?)',
  },
  {
    id: 'airport',
    audiences: ['*'],
    q: { en: 'How do we get here from the airport?', de: 'Wie kommen wir vom Flughafen her?', sl: 'Kako pridemo z letališča?', hr: 'Kako doći iz zračne luke?', it: 'Come arriviamo dall’aeroporto?' },
    a: () => ({
      en: `Zadar Airport (ZAD) is about ${Math.round(AIRPORT_DRIVE.km)} km and ${AIRPORT_DRIVE.min} minutes away by car. A rental car is easiest; taxis and transfers also run. See “Getting here” for flights and options.`,
      de: `Der Flughafen Zadar (ZAD) liegt ca. ${Math.round(AIRPORT_DRIVE.km)} km bzw. ${AIRPORT_DRIVE.min} Autominuten entfernt. Am einfachsten mit dem Mietwagen; auch Taxis und Transfers fahren. Mehr unter „Anreise“.`,
      sl: `Letališče Zadar (ZAD) je z avtom oddaljeno približno ${Math.round(AIRPORT_DRIVE.km)} km oziroma ${AIRPORT_DRIVE.min} minut. Najlažje je z najetim avtom; vozijo tudi taksiji in organizirani prevozi. Lete in možnosti najdete v razdelku »Kako do nas«.`,
      hr: `Zračna luka Zadar (ZAD) udaljena je oko ${Math.round(AIRPORT_DRIVE.km)} km, odnosno ${AIRPORT_DRIVE.min} minuta vožnje autom. Najjednostavnije je s automobilom iz najma; voze i taksiji i transferi. Letove i mogućnosti pronaći ćete u odjeljku „Kako do nas”.`,
      it: `L’aeroporto di Zadar (ZAD) dista circa ${Math.round(AIRPORT_DRIVE.km)} km, ${AIRPORT_DRIVE.min} minuti in auto. La soluzione più comoda è un’auto a noleggio; ci sono anche taxi e transfer. Voli e alternative nella sezione «Come arrivare».`,
    }),
  },
];

function answer(entry, ctx) {
  return ctx.t(typeof entry.a === 'function' ? entry.a(ctx) : entry.a);
}

// Entries for this audience plus the general ones. Special-interest versions
// see their own questions first; the general version keeps the FAQ order.
export function faqFor(ctx) {
  const id = ctx.audience.id;
  const list = FAQ.filter((f) => f.audiences.includes('*') || f.audiences.includes(id));
  if (id === 'general') return list;
  const own = list.filter((f) => f.audiences.includes(id));
  return [...own, ...list.filter((f) => !own.includes(f))];
}

function settled(f) {
  return !f.todo || isConfirmed(f.confirm);
}

// Search engines read this as fact, so entries that still wait for the owner stay out.
function jsonLd(list, ctx) {
  list = list.filter(settled);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((f) => ({ '@type': 'Question', name: ctx.t(f.q), acceptedAnswer: { '@type': 'Answer', text: answer(f, ctx) } })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

const T = {
  eyebrow: { en: 'Good to know', de: 'Gut zu wissen', sl: 'Dobro je vedeti', hr: 'Dobro je znati', it: 'Da sapere' },
  title: { en: 'Questions guests ask', de: 'Häufige Fragen', sl: 'Pogosta vprašanja', hr: 'Česta pitanja', it: 'Domande frequenti' },
  lede: { en: 'Something not here, or not answered clearly enough? Ask us — a real person replies.', de: 'Etwas fehlt oder ist unklar? Fragen Sie uns — es antwortet ein echter Mensch.', sl: 'Česa ni tu ali odgovor ni dovolj jasen? Vprašajte nas — odgovori resnična oseba.', hr: 'Nešto nedostaje ili odgovor nije dovoljno jasan? Pitajte nas — odgovara stvarna osoba.', it: 'Manca qualcosa o la risposta non è abbastanza chiara? Chiedeteci: vi risponde una persona vera.' },
};

export default {
  id: 'faq',
  nav: { en: 'FAQ', de: 'FAQ', sl: 'Vprašanja', hr: 'Pitanja', it: 'FAQ' },

  render(ctx) {
    const list = faqFor(ctx);
    const items = list
      .map(
        (f, i) => `<details class="faq-item" ${i === 0 ? 'open' : ''}>
          <summary><span>${esc(ctx.t(f.q))}</span><span class="faq-toggle" aria-hidden="true"></span></summary>
          <div class="faq-answer"><p>${esc(answer(f, ctx))}</p>${settled(f) ? '' : ownerTodo(f.todo)}</div>
        </details>`,
      )
      .join('');
    return `<div class="container faq-layout">
      <div class="section-head faq-head">
        <p class="eyebrow">${icon('info', { size: 16 })} ${esc(ctx.t(T.eyebrow))}</p>
        <h2>${esc(ctx.t(T.title))}</h2>
        <p class="lede">${esc(ctx.t(T.lede))}</p>
        <a class="btn btn-primary" href="#inquiry">${icon('chat', { size: 18 })} ${esc(ctx.t('askUs'))}</a>
      </div>
      <div class="faq-list">${items}</div>
      ${jsonLd(list, ctx)}
    </div>`;
  },
};
