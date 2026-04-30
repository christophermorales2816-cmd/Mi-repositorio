// ============================================================
// background.js - Service Worker
// ============================================================

import { StorageService } from "./storage.service.js";
import { MIDNIGHT_ALARM_NAME } from "./constants.js";

const storage = new StorageService();

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Clima CR] Extensión instalada. Programando reset de medianoche.");
  scheduleMidnightAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleMidnightAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === MIDNIGHT_ALARM_NAME) {
    console.log("[Clima CR] Medianoche detectada. Limpiando caché.");
    await storage.clearAll();
    scheduleMidnightAlarm();
  }
});

function scheduleMidnightAlarm() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  chrome.alarms.create(MIDNIGHT_ALARM_NAME, {
    when: midnight.getTime(),
  });

  const msUntil = midnight.getTime() - Date.now();
  const hoursUntil = (msUntil / 1000 / 60 / 60).toFixed(1);
  console.log(`[Clima CR] Reset programado en ${hoursUntil}h (medianoche).`);
}
