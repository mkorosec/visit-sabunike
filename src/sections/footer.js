// Footer: brand, address and contact, links to every audience version and
// language, legal placeholders and the honest privacy note.

import './footer.css';
import { LISTED_AUDIENCES } from '../content/audiences.js';
import { ENUMS } from '../state.js';
import { esc, icon } from '../lib/util.js';
import { contactChannels, mapLinks, ownerTodo } from './core-shared.js';

const LANG_NAMES = { en: 'English', de: 'Deutsch', sl: 'Slovenščina', hr: 'Hrvatski', it: 'Italiano' };
// Languages with complete copy; any other still falls back to English in places
// and is marked "partial".
const FULL_LANGS = ['en', 'de', 'sl', 'hr', 'it'];

const T = {
  tagline: { en: 'Four apartments on a quiet lane in Sabunike, near Nin and Zadar. Booked directly with the owners.', de: 'Vier Apartments in einer ruhigen Straße in Sabunike, bei Nin und Zadar. Direkt bei den Eigentümern gebucht.', sl: 'Štirje apartmaji na mirni ulici v Sabunikah, blizu Nina in Zadra. Rezervirate jih neposredno pri lastnikih.', hr: 'Četiri apartmana u mirnoj ulici u Sabunikama, blizu Nina i Zadra. Rezervirate ih izravno kod vlasnika.', it: 'Quattro appartamenti in una stradina tranquilla di Sabunike, vicino a Nin e Zadar. Si prenotano direttamente dai proprietari.' },
  pageFor: { en: 'Plan a trip for', de: 'Reiseideen für', sl: 'Načrtujte potovanje za', hr: 'Planirajte putovanje za', it: 'Idee di viaggio per' },
  onPage: { en: 'On this page', de: 'Auf dieser Seite', sl: 'Na tej strani', hr: 'Na ovoj stranici', it: 'In questa pagina' },
  language: { en: 'Language', de: 'Sprache', sl: 'Jezik', hr: 'Jezik', it: 'Lingua' },
  contact: { en: 'Contact', de: 'Kontakt', sl: 'Kontakt', hr: 'Kontakt', it: 'Contatto' },
  operator: { en: 'Operated by', de: 'Betrieben von', sl: 'Upravlja', hr: 'Upravlja', it: 'Gestito da' },
  category: { en: 'Categorisation no.', de: 'Kategorisierungs-Nr.', sl: 'Št. kategorizacije', hr: 'Broj rješenja o kategorizaciji', it: 'N. categorizzazione' },
  privacy: {
    en: 'Privacy: this site sets no cookies and uses no analytics. Your choices (version, language) and an unsent inquiry draft are stored only in your own browser. Inquiries go straight from your e-mail app to us. Fonts, map tiles and weather data are loaded from third-party servers, which see your IP address.',
    de: 'Datenschutz: Diese Seite setzt keine Cookies und nutzt keine Analyse-Tools. Ihre Auswahl (Version, Sprache) und ein ungesendeter Anfrage-Entwurf bleiben nur in Ihrem Browser. Anfragen gehen direkt aus Ihrem E-Mail-Programm an uns. Schriften, Kartenkacheln und Wetterdaten werden von Servern Dritter geladen, die dabei Ihre IP-Adresse sehen.',
    sl: 'Zasebnost: ta stran ne nastavlja piškotkov in ne uporablja analitike. Vaše izbire (različica, jezik) in neposlan osnutek povpraševanja so shranjeni samo v vašem brskalniku. Povpraševanja gredo iz vašega e-poštnega programa neposredno k nam. Pisave, zemljevidne ploščice in vremenski podatki se nalagajo s strežnikov tretjih oseb, ki vidijo vaš naslov IP.',
    hr: 'Privatnost: ova stranica ne postavlja kolačiće i ne koristi analitiku. Vaši odabiri (verzija, jezik) i neposlana skica upita spremaju se samo u vašem pregledniku. Upiti idu izravno iz vašeg programa za e-poštu k nama. Fontovi, pločice karata i podaci o vremenu učitavaju se s poslužitelja trećih strana, koji vide vašu IP adresu.',
    it: 'Privacy: questo sito non usa cookie né strumenti di analisi. Le vostre scelte (versione, lingua) e una bozza di richiesta non inviata restano solo nel vostro browser. Le richieste partono direttamente dalla vostra app di posta verso di noi. Font, tessere delle mappe e dati meteo vengono caricati da server di terzi, che vedono il vostro indirizzo IP.',
  },
  maps: {
    en: 'Map data © OpenStreetMap contributors. Map tiles by CARTO, Esri and OpenTopoMap where shown. Distances are approximate.',
    de: 'Kartendaten © OpenStreetMap-Mitwirkende. Kacheln von CARTO, Esri und OpenTopoMap, wo angezeigt. Entfernungen sind ungefähr.',
    sl: 'Zemljevidni podatki © sodelavci OpenStreetMap. Zemljevidne ploščice CARTO, Esri in OpenTopoMap, kjer so prikazane. Razdalje so približne.',
    hr: 'Podaci karte © suradnici OpenStreetMapa. Pločice karata: CARTO, Esri i OpenTopoMap, gdje su prikazane. Udaljenosti su približne.',
    it: 'Dati cartografici © contributori di OpenStreetMap. Tessere delle mappe di CARTO, Esri e OpenTopoMap, dove indicato. Le distanze sono approssimative.',
  },
  partial: { en: 'partial', de: 'teilweise', sl: 'delno', hr: 'djelomično', it: 'parziale' },
  partialTitle: { en: 'Partly translated — some text is still in English', de: 'Teilweise übersetzt — manche Texte sind noch auf Englisch', sl: 'Delno prevedeno — nekatera besedila so še v angleščini', hr: 'Djelomično prevedeno — neki su tekstovi još na engleskom', it: 'Traduzione parziale: alcuni testi sono ancora in inglese' },
  top: { en: 'Back to top', de: 'Nach oben', sl: 'Na vrh', hr: 'Na vrh', it: 'Torna su' },
};

function audienceLinks(ctx) {
  return LISTED_AUDIENCES.map((a) => {
    const current = a.id === ctx.audience.id;
    return `<li><a href="${esc(ctx.linkFor({ audience: a.id }))}" data-audience="${esc(a.id)}"${current ? ' aria-current="page"' : ''}>${esc(ctx.t(a.label))}</a></li>`;
  }).join('');
}

// Only fully translated languages are offered; a partial one stays reachable
// with ?lang= (and is listed while it is the current language).
function langLinks(ctx) {
  return ENUMS.lang.filter((l) => FULL_LANGS.includes(l) || l === ctx.lang).map((l) => {
    const full = FULL_LANGS.includes(l);
    const note = full ? '' : ` <small>(${esc(ctx.t(T.partial))})</small>`;
    return `<li><a href="${esc(ctx.linkFor({ lang: l }))}" data-lang="${l}" hreflang="${l}"${full ? '' : ` title="${esc(ctx.t(T.partialTitle))}"`}${l === ctx.lang ? ' aria-current="true"' : ''}><span lang="${l}">${esc(LANG_NAMES[l] || l)}</span>${note}</a></li>`;
  }).join('');
}

export default {
  id: 'footer',
  nav: null,
  eager: true, // cheap; fills section labels from the header nav right away

  render(ctx) {
    const a = ctx.site.address;
    const sections = ctx.audience.sections.filter((id) => !['hero', 'footer'].includes(id));
    const links = mapLinks();
    const channels = contactChannels();
    return `<footer class="footer" role="contentinfo">
      <div class="container">
        <div class="ft-cta">
          <h2>${esc(ctx.t({ en: 'Your dates, our best direct price.', de: 'Ihr Termin, unser bester Direktpreis.', sl: 'Vaš termin, naša najboljša neposredna cena.', hr: 'Vaš termin, naša najbolja izravna cijena.', it: 'Le vostre date, il nostro miglior prezzo diretto.' }))}</h2>
          <a class="btn btn-primary btn-lg" href="#inquiry">${icon('calendar', { size: 18 })} ${esc(ctx.t('askDates'))}</a>
        </div>
        <div class="ft-grid">
          <div class="ft-brand">
            <strong class="ft-name">${esc(ctx.brand)}</strong>
            <p>${esc(ctx.t(T.tagline))}</p>
            <address>
              ${esc(a.street)}<br />${esc(`${a.postcode} ${a.place} (${a.municipality})`)}<br />${esc(`${ctx.t(a.region)}, ${ctx.t(a.country)}`)}<br />
              <a href="${esc(links.google)}" target="_blank" rel="noopener">${icon('pin', { size: 16 })} Google Maps</a>
            </address>
          </div>
          <div>
            <h3>${esc(ctx.t(T.contact))}</h3>
            <ul class="ft-list" role="list">
              ${channels.map((c) => `<li><a href="${esc(c.href)}">${icon(c.icon, { size: 16 })} ${esc(c.id === 'email' ? ctx.site.contact.email : c.label)}</a></li>`).join('')}
              ${ctx.site.contact.phoneDisplay ? `<li>${esc(ctx.site.contact.phoneDisplay)}</li>` : ''}
            </ul>
            <h3>${esc(ctx.t(T.language))}</h3>
            <ul class="ft-list ft-inline" role="list">${langLinks(ctx)}</ul>
          </div>
          <nav aria-label="${esc(ctx.t(T.pageFor))}">
            <h3>${esc(ctx.t(T.pageFor))}</h3>
            <ul class="ft-list" role="list">${audienceLinks(ctx)}</ul>
          </nav>
          <nav aria-label="${esc(ctx.t(T.onPage))}">
            <h3>${esc(ctx.t(T.onPage))}</h3>
            <ul class="ft-list" role="list">${sections.map((id) => `<li><a href="#${id}" data-footer-link="${id}">${esc(id)}</a></li>`).join('')}</ul>
          </nav>
        </div>
        <div class="ft-legal">
          <p>${esc(ctx.t(T.operator))} ${esc(ctx.site.company)} · ${esc(ctx.t(T.category))} ${esc(ctx.t('onRequest'))} ${ownerTodo('Categorisation number (rješenje o kategorizaciji), company address/registration for the Impressum')}</p>
          <p>${esc(ctx.t(T.privacy))}</p>
          <p>${esc(ctx.t(T.maps))}</p>
          <p class="ft-bottom"><span>© ${new Date().getFullYear()} ${esc(ctx.site.company)}</span><a href="#top" data-top>${esc(ctx.t(T.top))} ↑</a></p>
        </div>
      </div>
    </footer>`;
  },

  mount(el, ctx) {
    // Section labels come from the live nav so they match the header.
    for (const a of el.querySelectorAll('[data-footer-link]')) {
      const label = document.querySelector(`#site-nav [data-nav="${a.dataset.footerLink}"]`)?.textContent;
      if (label) a.textContent = label;
      else a.parentElement.remove();
    }
    const onClick = (e) => {
      const aud = e.target.closest('[data-audience]');
      const lang = e.target.closest('[data-lang]');
      if (e.target.closest('[data-top]')) {
        e.preventDefault();
        window.scrollTo({ top: 0 });
        return;
      }
      if (!aud && !lang) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
      e.preventDefault();
      ctx.setState(aud ? { audience: aud.dataset.audience } : { lang: lang.dataset.lang });
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  },
};
