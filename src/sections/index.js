// Section registry. Each section lives in its own module; audiences decide
// which ones appear and in which order (src/content/audiences.js).
import hero from './hero.js';
import highlights from './highlights.js';
import direct from './direct.js';
import villa from './villa.js';
import beaches from './beaches.js';
import explore from './explore.js';
import activities from './activities.js';
import seasons from './seasons.js';
import cycling from './cycling.js';
import retreat from './retreat.js';
import niche from './niche.js';
import travel from './travel.js';
import inquiry from './inquiry.js';
import faq from './faq.js';
import footer from './footer.js';

export const SECTIONS = Object.fromEntries(
  [hero, highlights, direct, villa, beaches, explore, activities, seasons, cycling, retreat, niche, travel, inquiry, faq, footer].map((s) => [s.id, s]),
);
