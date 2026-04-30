// ============================================================
// popup.js
// ============================================================

import { PROVINCES } from "./constants.js";
import { WeatherService } from "./weather.service.js";
import { StorageService } from "./storage.service.js";
import { UIController } from "./ui.controller.js";

const weatherService = new WeatherService();
const storageService = new StorageService();
const uiController = new UIController(PROVINCES, "view-container");

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento no encontrado: #${id}`);
  return el;
}

async function init() {
  try {
    console.log("[Clima CR] ✅ popup.js loaded successfully");
    console.log("[Clima CR] PROVINCES:", PROVINCES);
    console.log("[Clima CR] Starting init...");
    
    startClock();
    startDate();
    await loadWeatherData();
  } catch (error) {
    console.error("[Clima CR] ❌ Error en init:", error);
    uiController.setLoading("error", "Error al inicializar");
  }
}

function startClock() {
  const clockEl = getEl("clock");

  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Costa_Rica",
    });
    clockEl.textContent = time;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

function startDate() {
  const dateEl = getEl("date");

  function updateDate() {
    const now = new Date();
    const date = now.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Costa_Rica",
    });
    dateEl.textContent = date.charAt(0).toUpperCase() + date.slice(1);
  }

  updateDate();
  setInterval(updateDate, 60000);
}

async function loadWeatherData() {
  uiController.setLoading("loading");

  try {
    const weatherDataPromises = PROVINCES.map(async (province) => {
      try {
        console.log(`[Clima CR] Loading weather for ${province.name}...`);
        
        const cached = await storageService.get(province.id);

        if (cached && !storageService.isStale(cached)) {
          console.log(`[Clima CR] Using cache for ${province.name}`);
          uiController.updateProvinceWeather(province.id, cached.data, cached);
          return;
        }

        if (cached && storageService.isStale(cached)) {
          console.log(`[Clima CR] Cache is stale for ${province.name}`);
          uiController.markStale(province.id);
        }

        console.log(`[Clima CR] Fetching fresh data for ${province.name}`);
        const weather = await weatherService.getWeather(province);
        await storageService.set(province.id, weather);
        uiController.updateProvinceWeather(province.id, weather, null);
        console.log(`[Clima CR] ✅ Success for ${province.name}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Error desconocido";
        console.error(`[Clima CR] ❌ Failed to load ${province.name}:`, errorMsg);
        uiController.setProvinceError(province.id, errorMsg);
      }
    });

    const results = await Promise.allSettled(weatherDataPromises);
    console.log(`[Clima CR] All requests completed:`, results);
    
    uiController.setLoading("success");
    console.log(`[Clima CR] ✅ All weather data loaded`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al cargar clima";
    console.error("[Clima CR] ❌ Fatal error in loadWeatherData:", errorMsg);
    uiController.setLoading("error", errorMsg);
  }
}

function setupRetryListener() {
  window.addEventListener("retry-weather", async () => {
    console.log("[Clima CR] Reintentando carga de datos...");
    await loadWeatherData();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
    setupRetryListener();
  });
} else {
  init();
  setupRetryListener();
}
