// ============================================================
// weather.service.ts — Integración con Open-Meteo API
// Servicio de clima sin API key, actualizado cada 30 minutos
// ============================================================

import { API_BASE_URL } from "./constants";
import type { Province, WeatherData, OpenMeteoResponse, IWeatherService } from "./types";

export class WeatherService implements IWeatherService {
  /**
   * Obtiene datos de clima para una provincia
   * @param province Provincia con coordenadas
   * @returns Datos de clima con timestamp
   * @throws Error si falla la petición a la API
   */
  async getWeather(province: Province): Promise<WeatherData> {
    try {
      const params = new URLSearchParams({
        latitude: province.lat.toString(),
        longitude: province.lon.toString(),
        hourly: "temperature_2m,relative_humidity_2m,weather_code",
        timezone: "America/Costa_Rica",
      });

      const url = `${API_BASE_URL}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenMeteoResponse = await response.json();
      const now = new Date();
      const hourIndex = now.getHours();

      // Usar el dato de la hora actual
      const temperature = data.hourly.temperature_2m[hourIndex] ?? 0;
      const humidity = data.hourly.relativehumidity_2m[hourIndex] ?? 0;
      const weatherCode = data.hourly.weathercode[hourIndex] ?? 0;

      return {
        temperature: Math.round(temperature * 10) / 10,
        feelsLike: Math.round((temperature - 2) * 10) / 10, // Aproximado
        humidity: Math.round(humidity),
        condition: this.decodeWeatherCode(weatherCode),
        icon: this.getWeatherIcon(weatherCode),
        fetchedAt: Date.now(),
      };
    } catch (error) {
      console.error("[Clima CR] Error fetching weather:", error);
      throw error;
    }
  }

  /**
   * Obtiene clima para múltiples provincias en paralelo
   * @param provinces Lista de provincias
   * @returns Array de datos de clima
   */
  async getMultipleWeather(provinces: Province[]): Promise<WeatherData[]> {
    return Promise.all(
      provinces.map((province) => this.getWeather(province))
    );
  }

  /**
   * Convierte código WMO a descripción legible
   * @param code Código de clima WMO
   * @returns Descripción en español
   */
  private decodeWeatherCode(code: number): string {
    const codes: Record<number, string> = {
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

  /**
   * Retorna emoji del clima basado en código WMO
   * @param code Código de clima WMO
   * @returns Emoji representativo
   */
  private getWeatherIcon(code: number): string {
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

