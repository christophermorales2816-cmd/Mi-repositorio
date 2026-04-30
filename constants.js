// ============================================================
// constants.js
// ============================================================

export const PROVINCES = [
  { id: "san-jose",    name: "San José",    lat: 9.9281,   lon: -84.0907 },
  { id: "alajuela",    name: "Alajuela",    lat: 10.0162,  lon: -84.2145 },
  { id: "cartago",     name: "Cartago",     lat: 9.8641,   lon: -83.9196 },
  { id: "heredia",     name: "Heredia",     lat: 9.9995,   lon: -84.1169 },
  { id: "guanacaste",  name: "Guanacaste",  lat: 10.6349,  lon: -85.4397 },
  { id: "puntarenas",  name: "Puntarenas",  lat: 9.9760,   lon: -84.8382 },
  { id: "limon",       name: "Limón",       lat: 10.0035,  lon: -83.0338 },
];

export const CACHE_TTL_MS = 30 * 60 * 1000;
export const API_BASE_URL = "https://api.open-meteo.com/v1/forecast";
export const MIDNIGHT_ALARM_NAME = "midnight-reset";
