# 💜 Para Victoria

Una pequeña experiencia web interactiva, inspirada en *«Un ramito de violetas»* (Manzanita).
HTML + CSS + JavaScript puro: sin dependencias, sin backend, sin servicios externos
(las tipografías están autoalojadas). Lista para GitHub Pages.

> El enunciado original del proyecto está en [`BRIEF.md`](BRIEF.md).

## Estructura

```text
flors/
├── index.html          Estructura de las 7 escenas
├── style.css           Diseño, paleta y animaciones
├── script.js           Estados de escena, interacciones, ramo SVG, mensaje y partículas
├── .nojekyll           Evita el procesado de Jekyll en GitHub Pages
├── assets/fonts/       Cormorant Garamond (serif) + Pinyon Script (manuscrita)
└── images/
    └── foto-01.jpg … foto-11.jpg   Fotos optimizadas que usa la web
```

## La historia (7 escenas)

| # | Escena | Interacción |
|---|--------|-------------|
| 1 | **Intriga** · «Victoria… ¿Creías que me había olvidado?» | Tocar la flecha |
| 2 | **Primera pista** · cuatro frases que aparecen una a una | Tocar «¿Cuál?» |
| 3 | **Conexión** · foto desenfocada del espejo («Qué bien volver a verte») | Tocar la foto para enfocarla |
| 4 | **Recuerdos** · pila de polaroids | Tocar «Otro recuerdo» (5 fotos) |
| 5 | **Sentimientos** · foto con velas | Encender 3 luces, una frase por cada una |
| 6 | **Anticipación** · «Ya casi, Victoria.» | Tocar la luz |
| 7 | **Revelación** · el ramo de violetas se forma flor a flor con el mensaje | Tocar para avanzar cada párrafo → canción → fotos finales |

No aparecen flores, violetas ni la canción hasta la escena 7. No hay música automática.
Se puede volver atrás con la flecha superior o con el botón «atrás» del móvil.

## Probarlo en local

```bash
cd flors
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicar en GitHub Pages

Esta carpeta es la raíz del sitio. Dos opciones:

**A) Repositorio propio (recomendado, URL más corta)**

1. Crea un repositorio nuevo en GitHub (por ejemplo `victoria`).
2. Sube el contenido de esta carpeta a la raíz del repositorio.
3. En GitHub: **Settings → Pages → Build and deployment**.
   Source: *Deploy from a branch* · Branch: `main` · Folder: `/ (root)` → **Save**.
4. En 1-2 minutos estará en `https://TU-USUARIO.github.io/victoria/`.

**B) Desde este repositorio**: usa **Folder: `/flors`**. GitHub Pages solo permite `/` o `/docs`,
así que en ese caso mueve el contenido a `docs/` o usa la opción A.

Después, envía el enlace por WhatsApp. Se abre en el navegador, sin instalar nada.

> Las fotos son personales: el repositorio debería ser **privado** si tu plan de GitHub permite
> Pages en repos privados; si no, ten en cuenta que el sitio será accesible para quien tenga el enlace.
> La página lleva `noindex` para que los buscadores no la indexen.

## Ajustes rápidos

- **Textos**: en `index.html` (escenas 1-6 y mensaje final dentro de `#message`).
- **Fotos**: sustituye `images/foto-XX.jpg` manteniendo el nombre y la orientación.
- **Canción**: el enlace de Spotify está en `index.html` (dos botones, busca `open.spotify.com`).
- **Velocidad del mensaje final**: constante `STEP` en `script.js` (ms por palabra).

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion`: sin pétalos, transiciones cortas y sin desenfoques.
- Mobile-first, con `svh` y *safe-area* para iPhone; probado a 320 px de ancho.
- Fotos de ~150-280 KB cada una (≈2,2 MB en total) cargadas progresivamente.
