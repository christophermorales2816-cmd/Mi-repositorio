// ============================================================
// ui.controller.js
// ============================================================

export class UIController {
  constructor(provinces, containerId) {
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

  getState() {
    return Object.freeze({ ...this.state });
  }

  setLoading(loading, error) {
    this.state.loadingState = loading;
    if (error) {
      this.state.globalError = error;
    } else if (loading === "success") {
      this.state.globalError = null;
      this.state.lastUpdated = Date.now();
    }
    this.render();
  }

  updateProvinceWeather(provinceId, weather, cache = null) {
    const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
    if (ctx) {
      ctx.weather = weather;
      ctx.cache = cache;
      ctx.error = null;
    }
    this.render();
  }

  markStale(provinceId) {
    const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
    if (ctx) {
      ctx.isStale = true;
    }
  }

  setProvinceError(provinceId, error) {
    const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
    if (ctx) {
      ctx.error = error;
    }
    this.render();
  }

  selectProvince(province) {
    this.state.selectedProvince = province;
    this.render();
  }

  render() {
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

  renderMenu() {
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
                ${ctx.weather ? `${ctx.weather.icon} ${ctx.weather.temperature}°C` : (ctx.error ? `❌ Error` : "Cargando...")}
              </div>
              ${ctx.error ? `<div class="error-badge" title="${ctx.error}">Error</div>` : ""}
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `;

    this.container.querySelectorAll(".province-item").forEach((el) => {
      el.addEventListener("click", () => {
        const provinceId = el.getAttribute("data-province-id");
        const ctx = this.state.provinces.find((p) => p.province.id === provinceId);
        if (ctx && ctx.weather) {
          this.selectProvince(ctx.province);
        } else if (ctx && ctx.error) {
          // Don't show alert, just select to show detail view with error
          this.selectProvince(ctx.province);
        }
      });
    });
  }

  renderDetail(province) {
    const ctx = this.state.provinces.find((p) => p.province.id === province.id);
    if (!ctx) {
      this.renderMenu();
      return;
    }

    if (ctx.error) {
      // Show error detail
      this.container.innerHTML = `
        <div class="detail-view">
          <button class="back-btn">← Volver</button>
          <div class="detail-header">
            <h1>${province.name}</h1>
          </div>
          <div class="error-view" style="min-height: auto; padding: 40px 20px;">
            <div class="error-icon">⚠️</div>
            <h2>Error al cargar</h2>
            <p>${ctx.error}</p>
            <button class="retry-btn" onclick="window.dispatchEvent(new CustomEvent('retry-weather'))">Reintentar</button>
          </div>
        </div>
      `;
      this.container.querySelector(".back-btn")?.addEventListener("click", () => {
        this.selectProvince(null);
      });
      return;
    }

    if (!ctx.weather) {
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
      </div>
    `;

    this.container.querySelector(".back-btn")?.addEventListener("click", () => {
      this.selectProvince(null);
    });
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="loading-view">
        <div class="spinner"></div>
        <p>Cargando clima...</p>
      </div>
    `;
  }

  renderError(error) {
    this.container.innerHTML = `
      <div class="error-view">
        <div class="error-icon">⚠️</div>
        <h2>Error al cargar</h2>
        <p>${error}</p>
        <button class="retry-btn">Reintentar</button>
      </div>
    `;

    this.container.querySelector(".retry-btn")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("retry-weather"));
    });
  }

  formatTime(timestamp) {
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
