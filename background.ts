// ============================================================
// background.ts — Service Worker (Manifest V3)
// Responsabilidades:
//   1. Al instalar la extensión: programar alarma de medianoche
//   2. Al dispararse la alarma: limpiar todo el storage
//   3. Re-programar la siguiente alarma para la próxima noche
// ============================================================

declare const chrome: any;

import { StorageService } from "./storage.service";
import { MIDNIGHT_ALARM_NAME } from "./constants";

const storage = new StorageService();

// ── Instalación ───────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Clima CR] Extensión instalada. Programando reset de medianoche.");
  scheduleMidnightAlarm();
});

// ── Arranque del Service Worker ───────────────────────────────
// Se vuelve a programar la alarma en caso de que el SW se reinicie
chrome.runtime.onStartup.addListener(() => {
  scheduleMidnightAlarm();
});

// ── Listener de alarmas ───────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm: { name: string }) => {
  if (alarm.name === MIDNIGHT_ALARM_NAME) {
    console.log("[Clima CR] Medianoche detectada. Limpiando caché.");
    await storage.clearAll();
    scheduleMidnightAlarm(); // Programar la siguiente noche
  }
});

// ── Calcular próxima medianoche en Costa Rica ─────────────────
function scheduleMidnightAlarm(): void {
  const now = new Date();

  // Próxima medianoche local (Costa Rica, UTC-6)
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  chrome.alarms.create(MIDNIGHT_ALARM_NAME, {
    when: midnight.getTime(),
  });

  const msUntil = midnight.getTime() - Date.now();
  const hoursUntil = (msUntil / 1000 / 60 / 60).toFixed(1);
  console.log(`[Clima CR] Reset programado en ${hoursUntil}h (medianoche).`);
}
