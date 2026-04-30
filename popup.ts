// ============================================================
// popup.ts — Controlador principal de la UI del popup
// Flujo:
//   1. Inicia reloj y fecha
//   2. Carga clima de todas las provincias (con caché)
//   3. Renderiza menú de provincias
//   4. Maneja selección y detalle
// ============================================================

import { PROVINCES } from "./constants";
import { WeatherService } from "./weather.service";
import { StorageService } from "./storage.service";
import { UIController } from "./ui.controller";
import type { Province } from "./types";

// ── Servicios ──────────────────────────────────────────────
const weatherService = new WeatherService();
const storageService = new StorageService();
const uiController = new UIController(PROVINCES, "view-container");

// ── Elementos del DOM ──────────────────────────────────────
function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Elemento no encontrado: #${id}`);
  return el;
}

// ── Ciclo de vida ──────────────────────────────────────────

/**
 * Punto de entrada: inicia la aplicación
 */
async function init(): Promise<void> {
  try {
    startClock();
    startDate();
    await loadWeatherData();
  } catch (error) {
    console.error("[Clima CR] Error en init:", error);
    uiController.setLoading("error", "Error al inicializar la aplicación");
  }
}

/**
 * Actualiza reloj cada segundo
 */
function startClock(): void {
  const clockEl = getEl<HTMLDivElement>("clock");

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

/**
 * Actualiza fecha cada minuto
 */
function startDate(): void {
  const dateEl = getEl<HTMLDivElement>("date");

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

/**
 * Carga clima para todas las provincias
 * Intenta leer caché primero, luego fetch de API si necesario
 */
async function loadWeatherData(): Promise<void> {
  uiController.setLoading("loading");

  try {
    const weatherDataPromises = PROVINCES.map(async (province) => {
      try {
        // Intentar leer caché
        const cached = await storageService.get(province.id);

        if (cached && !storageService.isStale(cached)) {
          // Caché válido
          uiController.updateProvinceWeather(province.id, cached.data, cached);
          return;
        }

        // Marcar como stale si existe pero expiró
        if (cached && storageService.isStale(cached)) {
          uiController.markStale(province.id);
        }

        // Fetch de API
        const weather = await weatherService.getWeather(province);
        await storageService.set(province.id, weather);
        uiController.updateProvinceWeather(province.id, weather, null);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Error desconocido";
        console.error(`[Clima CR] Error para ${province.name}:`, error);
        uiController.setProvinceError(province.id, errorMsg);
      }
    });

    await Promise.allSettled(weatherDataPromises);
    uiController.setLoading("success");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al cargar clima";
    console.error("[Clima CR] Error en loadWeatherData:", error);
    uiController.setLoading("error", errorMsg);
  }
}

/**
 * Reinicia la carga de datos (botón reintentar)
 */
function setupRetryListener(): void {
  window.addEventListener("retry-weather", async () => {
    console.log("[Clima CR] Reintentando carga de datos...");
    await loadWeatherData();
  });
}

// ── Ejecutar al cargar el DOM ──────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
    setupRetryListener();
  });
} else {
  init();
  setupRetryListener();
}


