# NutriChat · StrengthLab

Diario nutricional local con experiencia móvil, recetas y aprendizaje básico de etiquetas.

- **Hoy:** balance, agua y registros de la fecha seleccionada.
- **Registrar:** consulta un alimento y su cantidad; confirma para guardarlo.
- **Recetas:** 24 preparaciones nuevas, búsqueda por ingrediente, categorías, favoritas y cantidades para 1, 2 o 4 porciones. Los menús anteriores siguen disponibles en un bloque desplegable.
- **Aprender:** porciones, columnas por 100 g y por porción, nutrientes, ejemplo interactivo y ejercicio. El formulario para guardar productos es opcional al final.
- **Más:** alimentos, respaldos e instalación en la pantalla de inicio.

## Uso local

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abrir http://127.0.0.1:8765. No requiere dependencias ni compilación. Para instalación y acceso sin conexión en un teléfono, publicar con HTTPS (por ejemplo, GitHub Pages). Después de una primera carga completa, el service worker conserva los archivos y las imágenes de la app. Los enlaces externos de referencia necesitan conexión.

Los datos existentes permanecen en IndexedDB sin cambios de esquema. Las favoritas se guardan en localStorage en este navegador y no forman parte del respaldo del diario. No hay cuenta ni sincronización entre dispositivos. La instalación no convierte la app en una aplicación nativa de App Store/Play Store.

## Archivos

- `index.html`: diario, almacenamiento, menús de referencia y formularios existentes.
- `mobile.css`: navegación, diseño adaptable, chat y pantallas nuevas.
- `mobile.js`: navegación, aprendizaje de etiquetas, búsqueda y presentación de recetas e instalación.
- `recipes.js`: 24 recetas con ingredientes vinculados al catálogo existente.
- `manifest.webmanifest`, `sw.js`: instalación y caché sin conexión.

Al cambiar archivos publicados, incrementar la versión `CACHE` de `sw.js`. La nueva versión se activa después de cerrar las pestañas de la versión anterior; no interrumpe el guardado del diario. Los cachés eliminados se limitan al prefijo `nutrichat-shell-`.

## Verificación

`tests/browser-smoke.mjs` usa Node 22+ y Chrome mediante su protocolo de depuración, sin paquetes adicionales. Ejecutar Chrome con un perfil temporal independiente y el servidor local anterior:

```sh
# macOS; en otros sistemas usar la ruta del ejecutable Chrome correspondiente.
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --remote-debugging-port=9222 --user-data-dir=/tmp/nutrichat-test-profile about:blank
node tests/browser-smoke.mjs http://127.0.0.1:8765/ http://127.0.0.1:9222
```

El test borra exclusivamente los datos del origen local de prueba en ese perfil. No ejecutarlo sobre un navegador o un origen local con registros personales. Cubre 57 comprobaciones: seis anchos de pantalla (320–1280 px), visibilidad del compositor, recetas, favoritas, porciones, etiqueta educativa, alta/edición/eliminación/deshacer, fechas, agua, metas, persistencia y funcionamiento sin conexión.

Validado con Chromium emulando tamaños móviles. La instalación y el teclado de Safari/iOS necesitan comprobación en un teléfono real; la emulación no los reproduce completamente.
