# 🇨🇷 Clima CR - Extensión de Chrome

Extensión de clima para Costa Rica que muestra datos en tiempo real de todas las provincias.

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Data Flow](#data-flow)
4. [Cómo Mantener sin AI](#cómo-mantener-sin-ai)
5. [Guía de Desarrollo](#guía-de-desarrollo)

---

## 🏗️ Arquitectura

La aplicación sigue una **arquitectura modular basada en servicios** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────┐
│          popup.ts (Punto de entrada)        │
└─────────────┬───────────────────────────────┘
              │
        ┌─────┴─────┐
        │           │
   ┌────▼────┐  ┌───▼──────────┐
   │ Services │  │ UIController │
   └────┬────┘  └───┬──────────┘
        │           │
    ┌───┴────┬──────┘
    │        │
┌───▼───┐ ┌──▼──────────┐
│ Cache │ │ DOM Render  │
└───────┘ └─────────────┘
```

### Componentes Principales

#### 1. **Services** (Capa de datos)
   - `WeatherService`: Integración con Open-Meteo API
   - `StorageService`: Caché con TTL y validación de fecha

#### 2. **UIController** (Gestión de estado y UI)
   - Mantiene estado centralizado (`AppState`)
   - Controla transiciones entre vistas
   - Renderiza dinámicamente

#### 3. **popup.ts** (Orquestador)
   - Inicia servicios
   - Coordina la carga de datos
   - Maneja eventos del usuario

---

## 📁 Estructura de Archivos

```
ClimaTiquicia extension/
├── src/
│   ├── popup.ts              ← Punto de entrada del popup
│   ├── background.ts         ← Service Worker (reset a medianoche)
│   ├── weather.service.ts    ← Fetch de API Open-Meteo
│   ├── storage.service.ts    ← Caché con Chrome Storage API
│   ├── ui.controller.ts      ← Gestor de estado y vistas
│   ├── types.ts              ← Tipos TypeScript (interfaces)
│   ├── constants.ts          ← Provincias, URLs, constantes
│   └── build.mjs             ← Script de build (esbuild)
│
├── public/
│   ├── popup.html            ← Estructura HTML
│   └── styles.css            ← Estilos (tema oscuro)
│
├── manifest.json             ← Manifiesto de la extensión
├── tsconfig.json             ← Config TypeScript
└── package.json              ← Dependencias

```

---

## 🔄 Data Flow

```
1. INICIALIZACIÓN
   popup.ts → startClock() + startDate() → loadWeatherData()

2. CARGA DE CLIMA
   popup.ts → StorageService.get() ─┬─→ [Caché válido] → Render
                                     └─→ [Caché expirado/vacío]
                                            ↓
                                     WeatherService.getWeather()
                                            ↓
                                     StorageService.set() → Render

3. RENDERIZADO
   UIController.setLoading("loading") → renderLoading()
   UIController.updateProvinceWeather() → updateState() → render()
   UIController.selectProvince() → renderDetail()

4. RESET AUTOMÁTICO
   background.ts (Service Worker)
   chrome.alarms → medianoche → StorageService.clearAll()
```

---

## 🔧 Cómo Mantener sin AI

### ✅ Principios Clave

1. **Tipos estrictos**: Todo tiene interfaz en `types.ts`
2. **Responsabilidades claras**: Cada archivo tiene un propósito único
3. **Métodos documentados**: Todos tienen JSDoc comments
4. **Estado centralizado**: `UIController` es la fuente única de verdad
5. **API consistente**: Métodos siempre retornan tipos esperados

### 🛠️ Tareas Comunes

#### **Agregar una nueva provincia**

```typescript
// 1. Editar constants.ts
export const PROVINCES: Province[] = [
  // ... existentes
  { id: "new-province", name: "Nueva Provincia", lat: 10.5, lon: -84.5 },
];

// ¡Listo! Aparecerá automáticamente en la lista.
```

#### **Cambiar la API de clima**

```typescript
// 1. Actualizar API_BASE_URL en constants.ts
export const API_BASE_URL = "https://nueva-api.com/forecast";

// 2. Actualizar WeatherService.getWeather() si respuesta cambia
// 3. Actualizar types.ts → OpenMeteoResponse según nueva API
```

#### **Agregar un campo a WeatherData**

```typescript
// 1. Editar types.ts → WeatherData
export interface WeatherData {
  // ... existentes
  windSpeed?: number;  // nuevo campo
}

// 2. Editar weather.service.ts → asignar valor
return {
  // ... existentes
  windSpeed: data.hourly.windSpeed_10m[hourIndex] ?? 0,
};

// 3. Editar ui.controller.ts → renderDetail() para mostrar
<div class="detail-item">
  <span class="label">Viento</span>
  <span class="value">${w.windSpeed} km/h</span>
</div>
```

#### **Cambiar tiempo de caché**

```typescript
// constants.ts
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora en lugar de 30 min
```

#### **Personalizar estilos**

```css
/* styles.css - Variables ya configuradas */
:root {
  --accent-cyan: #38bdf8;      /* Cambiar color principal */
  --bg-base: #0d1117;          /* Cambiar fondo base */
  --text-primary: #e2e8f0;     /* Cambiar texto */
}
```

#### **Agregar un nuevo evento/interacción**

En `ui.controller.ts`, el método `render()` ya maneja event listeners. Para agregar uno:

```typescript
// En renderMenu(), después de renderizar:
this.container.querySelectorAll(".nueva-clase").forEach((el) => {
  el.addEventListener("click", () => {
    // Tu lógica aquí
  });
});
```

### 🐛 Debugging

```bash
# 1. Abrir DevTools del popup
# Click derecho en popup → Inspeccionar elemento

# 2. Revisar errores en console
# Todos tienen prefijo "[Clima CR]"

# 3. Storage (DevTools → Application → Extension Storage)
# Clave: "weather_[province-id]"

# 4. Service Worker
# chrome://extensions/ → Clima CR → "Inspect views"
```

---

## 📚 Guía de Desarrollo

### Instalación

```bash
# 1. Clonar / descargar
# 2. npm install (si es necesario para dependencias)
# 3. npm run build (compilar)
# 4. chrome://extensions/ → Cargar extensión sin empaquetar → select "dist/"
```

### Build

```bash
npm run build      # Build de producción (minificado)
npm run dev        # Watch mode (recompila al guardar)
```

### Archivo de Salida

Después de `npm run build`, revisar `dist/`:
- `dist/popup.js` - Código compilado del popup
- `dist/background.js` - Service Worker compilado
- `dist/popup.html` - HTML copiado
- `dist/styles.css` - CSS copiado
- `dist/manifest.json` - Manifest copiado

### Estructura de Tipos

Todos los tipos están en **`types.ts`**:

```typescript
// Tipos primitivos
type ProvinceId = "san-jose" | "alajuela" | ... ;

// Interfaces de dominio
interface Province { id, name, lat, lon }
interface WeatherData { temperature, humidity, ... }

// Interfaces de contrato
interface IWeatherService { getWeather(...), getMultipleWeather(...) }
interface IStorageService { get(...), set(...), clearAll(...) }
```

Si agregas un nuevo tipo, decláralo aquí primero.

### Estado de la Aplicación

El `AppState` en `ui.controller.ts` es la **fuente única de verdad**:

```typescript
interface AppState {
  provinces: ProvinceContext[];      // Datos + estado de cada provincia
  selectedProvince: Province | null; // Cuál está seleccionada
  loadingState: LoadingState;        // "idle" | "loading" | "success" | "error"
  globalError: string | null;        // Error general
  lastUpdated: number | null;        // Timestamp última actualización
}
```

Todos los métodos públicos de `UIController` actualizan este estado.

### Vistas Renderizadas

El `UIController` maneja 4 vistas:

1. **Menu** - Lista de todas las provincias con clima
2. **Detail** - Detalle de una provincia seleccionada
3. **Loading** - Spinner mientras carga
4. **Error** - Mensaje de error con botón reintentar

### Service Worker (background.ts)

Se ejecuta en background. Responsabilidades:
- ✅ Crear alarma a medianoche
- ✅ Limpiar caché cuando suena alarma
- ✅ Re-programar alarma siguiente día

No tiene UI. Solo eventos y storage.

---

## 🚀 Mejoras Futuras (Sin AI)

Si necesitas expandir:

1. **Agregar notificaciones**: Usar `chrome.notifications` en `background.ts`
2. **Gráfica histórica**: Guardar array de valores en storage con timestamp
3. **Favoritos**: Guardar provincias favoritas en `StorageService`
4. **Tema claro**: Agregar toggle en header, usar `prefers-color-scheme` CSS
5. **Más datos**: Extender `WeatherData` y actualizar `WeatherService`

---

## 📝 Notas Importantes

- ⏰ **Timezone**: Costa Rica UTC-6 (configurado en `WeatherService` y `StorageService`)
- 🔄 **TTL**: Cache válido por 30 minutos O hasta medianoche
- 🌐 **API**: Open-Meteo (gratuita, sin API key)
- 📦 **Build**: esbuild con formato ESM (requerido por Manifest V3)
- 🔒 **Strict Mode**: TypeScript en modo strict = tipos seguros

---

## ❓ FAQ

**P: ¿Por qué 2 archivos de servicio?**  
R: Separación de responsabilidades. `WeatherService` = datos externos, `StorageService` = datos locales.

**P: ¿Qué pasa si la API falla?**  
R: Se intenta caché. Si también falla, error en UI con botón "Reintentar".

**P: ¿Cómo agrego lógica nueva sin romper nada?**  
R: Siempre a través de `UIController.setLoading()` → `updateProvinceWeather()` → `render()`.

**P: ¿Puedo cambiar los colores?**  
R: Sí, editar variables CSS en `:root` de `styles.css`.

---

## 📞 Soporte

Si necesitas ayuda manteniendo este código:

1. Leer JSDoc de cada método
2. Revisar tipos en `types.ts`
3. Seguir el flujo de datos (ver "Data Flow")
4. Usar console.log con prefijo `[Clima CR]`

¡Código listo para mantenimiento! 🎉
