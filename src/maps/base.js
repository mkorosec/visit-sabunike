// Shared Leaflet setup: basemaps that follow the global `basemap` toggle, the
// house marker, and a pin icon factory. Every Leaflet map on the page should be
// created through createMap() so they look and behave the same.

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './maps.css';
import { SITE } from '../content/site.js';
import { esc, tr } from '../lib/util.js';
import { getState } from '../state.js';

export { L };

export const BASEMAPS = {
  light: {
    // CARTO basemaps now answer every keyless tile request with an "API KEY REQUIRED"
    // image (checked 2026-10-16), so the light map uses the standard OSM tiles.
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    },
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      subdomains: 'abc',
      maxZoom: 17,
      attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    },
  },
};

export const HOUSE = [SITE.location.lat, SITE.location.lon];

export { CATEGORY_COLORS } from './colors.js';

// Round pin with an optional short label (1–2 chars or a tiny SVG).
export function pinIcon({ color = '#0b6fa4', label = '', size = 30, ring = false } = {}) {
  return L.divIcon({
    className: 'vs-pin-wrap',
    html: `<span class="vs-pin${ring ? ' ring' : ''}" style="--pin:${color};--size:${size}px">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function houseMarker(brandName) {
  const icon = L.divIcon({
    className: 'vs-pin-wrap',
    html: `<span class="vs-house" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 11 12 3l9 8v10H3z" fill="#fff"/><path d="M9 21v-6h6v6" fill="#b5451f"/></svg></span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
  return L.marker(HOUSE, { icon, zIndexOffset: 1000, title: brandName, keyboard: true }).bindTooltip(esc(brandName), {
    permanent: false,
    direction: 'top',
    offset: [0, -18],
  });
}

const TAP_HINT = { en: 'Tap the map to move it', de: 'Tippen Sie auf die Karte, um sie zu bewegen' };

// Create a Leaflet map. Returns { map, setBasemap(name), destroy() }.
export function createMap(el, { center = HOUSE, zoom = 13, basemap = 'light', brandName = SITE.names.apartments, house = true, scrollWheelZoom = false, ...rest } = {}) {
  // Touch: one-finger drag scrolls the page until the map is tapped (pinch-zoom still works).
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const map = L.map(el, {
    center,
    zoom,
    scrollWheelZoom,
    dragging: !touch,
    zoomControl: true,
    attributionControl: true,
    ...rest,
  });
  let layer = null;
  const setBasemap = (name) => {
    const def = BASEMAPS[name] || BASEMAPS.light;
    if (layer) map.removeLayer(layer);
    layer = L.tileLayer(def.url, def.options).addTo(map);
    el.dataset.basemap = name;
  };
  setBasemap(basemap);
  if (house) houseMarker(brandName).addTo(map);
  // Two-finger hint: enable wheel zoom only after the user clicks the map.
  if (!scrollWheelZoom) {
    map.once('focus click', () => map.scrollWheelZoom.enable());
  }
  if (touch && !map.dragging.enabled()) {
    const hint = L.DomUtil.create('p', 'vs-map-hint', el);
    hint.textContent = tr(TAP_HINT, getState().lang);
    map.once('click', () => {
      map.dragging.enable();
      hint.remove();
    });
  }
  const ro = new ResizeObserver(() => map.invalidateSize());
  ro.observe(el);
  return {
    map,
    setBasemap,
    destroy() {
      ro.disconnect();
      map.remove();
    },
  };
}
