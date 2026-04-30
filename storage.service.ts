// ============================================================
// storage.service.ts — Caché con TTL y reset a medianoche
// Implementa IStorageService usando chrome.storage.local.
//
// Estrategia de invalidación:
//   1. Si la fecha guardada ≠ fecha de hoy → expirado (cambió el día)
//   2. Si fetchedAt > CACHE_TTL_MS atrás   → stale (re-fetch silencioso)
// ============================================================

declare const chrome: any;

import { CACHE_TTL_MS } from "./constants";
import type { IStorageService, ProvinceId, WeatherData, DailyCache } from "./types";

export class StorageService implements IStorageService {
  private readonly PREFIX = "weather_";

  // ── "YYYY-MM-DD" en zona horaria de Costa Rica ─────────────
  private today(): string {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Costa_Rica",
    });
  }

  // ── Leer del storage; null si expirado o inexistente ───────
  async get(provinceId: ProvinceId): Promise<DailyCache | null> {
    const key = `${this.PREFIX}${provinceId}`;

    const result = await chrome.storage.local.get(key);
    const cached = result[key] as DailyCache | undefined;

    if (!cached) return null;

    // Cruzó medianoche → dato del día anterior
    if (cached.date !== this.today()) {
      await this.delete(provinceId);
      return null;
    }

    return cached;
  }

  // ── Guardar en storage con fecha de hoy ───────────────────
  async set(provinceId: ProvinceId, data: WeatherData): Promise<void> {
    const key = `${this.PREFIX}${provinceId}`;
    const cache: DailyCache = {
      date: this.today(),
      data,
    };
    await chrome.storage.local.set({ [key]: cache });
  }

  // ── ¿Superó el TTL de 30 minutos? ─────────────────────────
  isStale(cache: DailyCache): boolean {
    return Date.now() - cache.data.fetchedAt > CACHE_TTL_MS;
  }

  // ── Borrar todo — llamado por background.ts a medianoche ──
  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
  }

  // ── Eliminar entrada individual ────────────────────────────
  private async delete(provinceId: ProvinceId): Promise<void> {
    await chrome.storage.local.remove(`${this.PREFIX}${provinceId}`);
  }
}
