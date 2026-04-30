// ============================================================
// ui.controller.ts — Controlador de estado y renderizado
// Responsable de:
//   1. Mantener estado de la UI (loading, error, data)
//   2. Renderizar vistas dinámicamente
//   3. Manejar interacciones del usuario
// ============================================================

import type { Province, WeatherData, DailyCache } from "./types";

/** Estado de carga */
export type LoadingState = "idle" | "loading" | "success" | "error";

/** Contexto de una provincia con su clima */
export interface ProvinceContext {
  province: Province;
  weather: WeatherData | null;
  cache: DailyCache | null;
  isStale: boolean;
  error: string | null;
}

/** Estado global de la aplicación */
export interface AppState {
  provinces: ProvinceContext[];
  selectedProvince: Province | null;
  loadingState: LoadingState;
  globalError: string | null;
  lastUpdated: number | null;
}

export class UIController {
  private state: AppState;
  private container: HTMLElement;

  /**
   * Inicializa el controlador con el contenedor principal
   * @param provinces Lista inicial de provincias
   * @param containerId ID del contenedor principal (#view-container)
   */
  constructor(provinces: Province[], containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Contenedor no encontrado: #${containerId}`);

    this.container = el;
    this.state = {
      provinces: provinces.map((p) => ({
        province: p,
        weather: null,
        cache: null,
        isStale: false,
        error: null,
      })),
      selectedProvince: provinces[0] || null,
      loadingState: "idle",
      globalError: null,
      lastUpdated: null,
    };
  }

  /**
   * Obtiene el estado actual
   */
  getState(): Readonly<AppState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Actualiza el estado de carga
   */
  setLoading(loading: LoadingState, error?: string): void {
    this.state.loadingState = loading;
    if (error) {
      this.state.globalError = error;
    } else if (loading === "success") {
      this.state.globalError = null;
      this.state.lastUpdated = Date.now();
    }
    this.render();
  }

  /**
   * Actualiza datos de clima para una provincia
   */
  updateProvinceWeather(
    provinceId: string,
    weather: WeatherData,
    cache: DailyCache | null = null
  ): void {
    const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
    if (ctx) {
      ctx.weather = weather;
      ctx.cache = cache;
      ctx.error = null;
    }
    this.render();
  }

  /**
   * Marca una provincia como estale (necesita refetch)
   */
  markStale(provinceId: string): void {
    const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
    if (ctx) {
      ctx.isStale = true;
    }
  }

  /**
   * Establece error para una provincia
   */
  setProvinceError(provinceId: string, error: string): void {
    const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
    if (ctx) {
      ctx.error = error;
    }
    this.render();
  }

  /**
   * Selecciona una provincia para ver detalle
   */
  selectProvince(province: Province): void {
    this.state.selectedProvince = province;
    this.render();
  }

  /**
   * Renderiza la vista actual
   */
  private render(): void {
    if (this.state.loadingState === "loading") {
      this.renderLoading();
    } else if (this.state.loadingState === "error" && this.state.globalError) {
      this.renderError(this.state.globalError);
    } else if (this.state.selectedProvince) {
      this.renderDetail(this.state.selectedProvince);
    } else {
      this.renderMenu();
    }
  }

  /**
   * Vista de menú (lista de provincias)
   */
  private renderMenu(): void {
    this.container.innerHTML = `
      <div class="menu-view">
        <div class="menu-header">
          <h2>Selecciona una provincia</h2>
          ${this.state.lastUpdated ? `<p class="last-updated">Actualizado hace ${this.formatTime(this.state.lastUpdated)}</p>` : ""}
        </div>
        <ul class="province-list">
          ${this.state.provinces
            .map(
              (ctx) => `
            <li class="province-item" data-province-id="${ctx.province.id}">
              <div class="province-name">${ctx.province.name}</div>
              <div class="province-weather">
                ${ctx.weather ? `${ctx.weather.icon} ${ctx.weather.temperature}°C` : "Cargando..."}
              </div>
              ${ctx.error ? `<div class="error-badge">Error</div>` : ""}
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll(".province-item").forEach((el) => {
      el.addEventListener("click", () => {
        const provinceId = el.getAttribute("data-province-id");
        const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
        if (ctx) {
          this.selectProvince(ctx.province);
        }
      });
    });
  }

  /**
   * Vista de detalle (clima completo de una provincia)
   */
  private renderDetail(province: Province): void {
    const ctx = this.state.provinces.find((p) => p.province.id === province.id);
    if (!ctx || !ctx.weather) {
      this.renderMenu();
      return;
    }

    const w = ctx.weather;
    this.container.innerHTML = `
      <div class="detail-view">
        <button class="back-btn">← Volver</button>
        <div class="detail-header">
          <h1>${province.name}</h1>
          <p class="detail-coords">Lat: ${province.lat.toFixed(4)}, Lon: ${province.lon.toFixed(4)}</p>
        </div>
        
        <div class="weather-card">
          <div class="weather-main">
            <div class="weather-icon">${w.icon}</div>
            <div class="weather-temp">
              <span class="temp">${w.temperature}°C</span>
              <span class="condition">${w.condition}</span>
            </div>
          </div>
          
          <div class="weather-details">
            <div class="detail-item">
              <span class="label">Sensación térmica</span>
              <span class="value">${w.feelsLike}°C</span>
            </div>
            <div class="detail-item">
              <span class="label">Humedad</span>
              <span class="value">${w.humidity}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Actualizado</span>
              <span class="value">${this.formatTime(w.fetchedAt)}</span>
            </div>
          </div>
        </div>

        ${ctx.isStale ? `<p class="stale-warning">⚠️ Datos de hace más de 30 minutos</p>` : ""}
        ${ctx.error ? `<p class="error-message">❌ ${ctx.error}</p>` : ""}
      </div>
    `;

    // Back button
    this.container.querySelector(".back-btn")?.addEventListener("click", () => {
      this.selectProvince(null as any);
    });
  }

  /**
   * Vista de carga
   */
  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="loading-view">
        <div class="spinner"></div>
        <p>Cargando clima...</p>
      </div>
    `;
  }

  /**
   * Vista de error
   */
  private renderError(error: string): void {
    this.container.innerHTML = `
      <div class="error-view">
        <div class="error-icon">⚠️</div>
        <h2>Error al cargar</h2>
        <p>${error}</p>
        <button class="retry-btn">Reintentar</button>
      </div>
    `;

    this.container.querySelector(".retry-btn")?.addEventListener("click", () => {
      // Dispara evento para reintentar (será capturado en popup.ts)
      window.dispatchEvent(new CustomEvent("retry-weather"));
    });
  }

  /**
   * Formatea un timestamp a texto relativo
   */
  private formatTime(timestamp: number): string {
    const ms = Date.now() - timestamp;
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);

    if (secs < 60) return "hace unos segundos";
    if (mins < 60) return `hace ${mins}m`;
    if (hours < 24) return `hace ${hours}h`;
    return "hace 1+ días";
  }
}
