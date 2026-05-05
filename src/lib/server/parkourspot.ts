// parkour.spot API adapter (future integration).
//
// This module will proxy requests to the parkour.spot REST API and
// map responses to our internal Spot type.
//
// import { PARKOUR_SPOT_API_URL, PARKOUR_SPOT_API_KEY } from '$env/static/private';
//
// export async function searchSpots(query: string) {
//   const res = await fetch(`${PARKOUR_SPOT_API_URL}/spots?q=${query}`, {
//     headers: { Authorization: `Bearer ${PARKOUR_SPOT_API_KEY}` },
//   });
//   return res.json();
// }

export async function searchSpots(_query: string) {
  // TODO: integrate parkour.spot API
  return [];
}
