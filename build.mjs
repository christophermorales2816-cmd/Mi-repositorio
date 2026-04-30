// ============================================================
// build.mjs — Script de build con esbuild
// Uso:
//   npm run build       → compilación única para producción
//   npm run dev         → modo watch (recompila al guardar)
// ============================================================

import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const isWatch = process.argv.includes("--watch");

// ── Crear directorios de salida ───────────────────────────────
mkdirSync("dist", { recursive: true });
mkdirSync("dist/icons", { recursive: true });

// ── Copiar archivos estáticos ─────────────────────────────────
const staticFiles = [
  { src: "public/popup.html",  dest: "dist/popup.html"  },
  { src: "public/styles.css",  dest: "dist/styles.css"  },
  { src: "manifest.json",      dest: "dist/manifest.json" },
];

for (const { src, dest } of staticFiles) {
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`✓ Copiado: ${src} → ${dest}`);
  }
}

// Copiar íconos si existen
for (const size of [16, 32, 48, 128]) {
  const src  = `public/icons/icon${size}.png`;
  const dest = `dist/icons/icon${size}.png`;
  if (existsSync(src)) {
    copyFileSync(src, dest);
  }
}

// ── Configuración de esbuild ──────────────────────────────────
/** @type {import("esbuild").BuildOptions} */
const buildConfig = {
  entryPoints: {
    popup:      "src/popup.ts",
    background: "src/background.ts",
  },
  bundle:    true,
  outdir:    "dist",
  format:    "esm",          // Requerido por MV3 service worker
  target:    "chrome120",
  sourcemap: isWatch ? "inline" : false,
  minify:    !isWatch,
  logLevel:  "info",
};

// ── Ejecutar ──────────────────────────────────────────────────
if (isWatch) {
  const ctx = await esbuild.context(buildConfig);
  await ctx.watch();
  console.log("\n👀 Modo watch activo. Editá los archivos en src/ para recompilar.");
} else {
  await esbuild.build(buildConfig);
  console.log("\n✅ Build completado. Cargá la carpeta dist/ en chrome://extensions/");
}
