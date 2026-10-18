// Travel times from routed road distances (beaches.json `roadKm`, from the
// OSRM foot/bike/car profiles). Shared so every section shows the same time for
// the same place. Without a routed distance, use travelMinutes() in lib/util.js.

export const SPEED = { walk: 5, bike: 16, car: 50 };

// Minutes for a routed distance in km: walk 5 km/h, bike 16 km/h, car 50 km/h plus ~2 min to park.
export function roadMinutes(km, mode) {
  return (km / SPEED[mode]) * 60 + (mode === 'car' && km > 1 ? 2 : 0);
}
