// ============================================================
// weather.service.js
// ============================================================

import { API_BASE_URL } from "./constants.js";

export class WeatherService {
  async getWeather(province) {
    try {
      console.log(`[Clima CR] 🌐 Fetching weather for ${province.name}...`);
      
      // Use current weather endpoint instead of hourly
      const params = new URLSearchParams({
        latitude: province.lat.toString(),
        longitude: province.lon.toString(),
        current: "temperature_2m,relative_humidity_2m,weather_code",
        timezone: "America/Costa_Rica",
      });

      const url = `${API_BASE_URL}?${params.toString()}`;
      console.log(`[Clima CR] 📡 API URL:`, url);
      
      const response = await fetch(url);
      console.log(`[Clima CR] 📊 Response status:`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Clima CR] 📦 API Response:`, data);
      
      // Check current weather data
      if (!data.current) {
        console.error("[Clima CR] ❌ No current data in response:", data);
        throw new Error("Datos incompletos de API");
      }

      const temp = data.current.temperature_2m ?? 0;
      const humidity = data.current.relative_humidity_2m ?? 0;
      const weatherCode = data.current.weather_code ?? 0;

      const result = {
        temperature: Math.round(temp * 10) / 10,
        feelsLike: Math.round((temp - 2) * 10) / 10,
        humidity: Math.round(humidity),
        condition: this.decodeWeatherCode(weatherCode),
        icon: this.getWeatherIcon(weatherCode),
        fetchedAt: Date.now(),
      };

      console.log(`[Clima CR] ✅ Success for ${province.name}:`, result);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Clima CR] ❌ Error for ${province.name}:`, msg);
      throw new Error(msg);
    }
  }

  async getMultipleWeather(provinces) {
    return Promise.all(
      provinces.map((province) => this.getWeather(province))
    );
  }

  decodeWeatherCode(code) {
    const codes = {
      0: "Despejado",
      1: "Mayormente despejado",
      2: "Parcialmente nublado",
      3: "Nublado",
      45: "Brumoso",
      48: "Neblina",
      51: "Llovizna ligera",
      53: "Llovizna moderada",
      55: "Llovizna densa",
      61: "Lluvia ligera",
      63: "Lluvia moderada",
      65: "Lluvia intensa",
      71: "Nieve ligera",
      73: "Nieve moderada",
      75: "Nieve intensa",
      80: "Chubascos ligeros",
      81: "Chubascos moderados",
      82: "Chubascos intensos",
      85: "Chubascos de nieve ligeros",
      86: "Chubascos de nieve intensos",
      95: "Tormenta",
      96: "Tormenta con granizo ligero",
      99: "Tormenta con granizo intenso",
    };
    return codes[code] || "Desconocido";
  }

  getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "⛈️";
    if (code >= 85 && code <= 86) return "🌨️";
    if (code >= 95 && code <= 99) return "⛈️";
    return "🌡️";
  }
}


