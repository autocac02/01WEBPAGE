# KANDO — Landing page + editor propio

Sitio de una One Person Company que ordena vestidores, placares y roperos con el método
de Marie Kondo, adaptado a hogares argentinos. Incluye la landing pública y un editor
tipo Wix con login, vista previa en vivo y publicación.

Todo el proyecto es **estático y sin build**: no hay `npm install`, ni framework, ni
dependencias externas. Se abre con doble clic y se publica en Vercel tal como está.

---

## 1 · Verlo ahora

| Cómo | Qué pasa |
| --- | --- |
| Doble clic en `index.html` | Se ve la landing completa. Funciona sin servidor. |
| Doble clic en `1-INICIAR-LOCAL.bat` | Levanta un servidor local en `http://localhost:5173` y abre el navegador. |
| `editor.html` | Abre el editor. Sin servidor entra en **modo local**: podés editar y descargar el `content.js` resultante. |

> El único requisito para ver el sitio es un navegador. Las tipografías se cargan de
> Google Fonts; si no hay internet, el diseño usa tipografías del sistema y sigue
> funcionando igual.

---

## 2 · Publicarlo en Vercel

### Paso 1 · Subir el proyecto a GitHub

1. Creá un repositorio **privado** (recomendado) en GitHub, por ejemplo `kando-web`.
2. Subí todos los archivos de esta carpeta a la raíz del repositorio
   (arrastrándolos en la web de GitHub alcanza).

### Paso 2 · Crear el token de GitHub

El editor guarda los cambios en el repositorio, por eso necesita permiso de escritura.

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. **Generate new token**.
3. *Repository access*: **Only select repositories** → elegí `kando-web`.
4. *Permissions → Repository permissions → Contents*: **Read and write**.
5. Generá y copiá el token (`github_pat_…`). No se vuelve a mostrar.

### Paso 3 · Importar en Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → elegí el repo.
2. *Framework preset*: **Other**. Sin build command, sin output directory.
3. Antes de darle *Deploy*, abrí **Environment Variables** y cargá las cinco:

| Variable | Ejemplo | Para qué |
| --- | --- | --- |
| `ADMIN_SECRET` | `a7f3…` (40+ caracteres al azar) | Firma las sesiones del editor. Si cambia, hay que volver a entrar. |
| `ADMIN_SETUP_TOKEN` | `kando-primera-vez-2026` | Habilita la creación de la contraseña la primera vez. |
| `GITHUB_TOKEN` | `github_pat_…` | Permiso de escritura sobre el repositorio. |
| `GITHUB_REPO` | `camila/kando-web` | Repositorio donde se guarda el contenido. |
| `GITHUB_BRANCH` | `main` | Rama a usar (opcional). |

4. **Deploy**. En menos de un minuto el sitio está online.

### Paso 4 · Entrar al editor por primera vez

1. Abrí `https://tu-proyecto.vercel.app/editor.html`.
2. La pantalla de bienvenida pide el **token de instalación** (el de `ADMIN_SETUP_TOKEN`)
   y la **contraseña nueva** que quieras usar (mínimo 8 caracteres).
3. Se crea `users.json` en el repositorio con la contraseña cifrada (PBKDF2 + sal).
4. Listo: a partir de ahí entrás solo con la contraseña.

> Después de configurar podés borrar `ADMIN_SETUP_TOKEN` de Vercel. Si algún día
> necesitás restablecer la contraseña, borrá `users.json` del repositorio y volvé a
> entrar con el token.

---

## 3 · Cómo se edita

Resumen rápido (la guía completa está en `GUIA-DEL-EDITOR.md`):

1. **Clic en una sección** de la página → el panel derecho muestra sus campos.
2. **Doble clic en un texto** → se edita ahí mismo, sobre el diseño real.
3. **Guardar** (Ctrl+S) → deja el borrador en el repositorio, sin publicar.
4. **Publicar** → pasa el borrador a la versión pública. Vercel tarda ~1 minuto.

El borrador también se guarda solo en el navegador mientras trabajás, así que si se
cierra la pestaña no perdés lo último que tocaste.

---

## 4 · Cómo está hecho

```
Navegador
├── index.html          landing pública
├── editor.html         panel de administración
└── preview.html        documento que el editor muestra dentro de un iframe

Contenido
└── content.js          único origen de verdad (window.KANDO_CONTENT)

Motor
├── art.js              ilustraciones SVG generativas (no hay fotos de archivo)
├── render.js           plantillas: convierte contenido en HTML
├── app.js              comportamiento: scroll, pestañas, acordeón, comparador, formulario
├── site.css            sistema visual completo (paletas, tipografía, efectos)
└── editor.css          interfaz del editor

Editor
├── editor-schema.js    qué campos tiene cada bloque
└── editor.js           login, lienzo, paneles, historial, guardado y publicación

Servidor
└── middleware.js       API /api/* (Routing Middleware de Vercel, runtime Node)

Diario de cambios
├── draft.js            borrador (lo crea el editor)
└── users.json          contraseña cifrada (lo crea el editor)
```

**Por qué así.** El editor no inventa una vista previa: renderiza la página real con
`render.js` dentro de un iframe y le monta los mismos comportamientos de `app.js`. Lo
que ves editando es exactamente el sitio publicado, píxel por píxel.

**Dónde se guarda.** GitHub funciona como base de datos: cada guardado y cada
publicación son commits, así que todo el historial queda versionado y se puede volver
atrás desde GitHub.

**Dos archivos sueltos.** `_qa.html` y `_ok.txt` son residuos del instalador: se pueden
borrar sin afectar nada.

**Sin base de datos ni servicios extra.** El login se valida en `middleware.js`
(PBKDF2 + token HMAC de 12 h), y el contenido viaja a la API de GitHub con el token del
servidor, que nunca llega al navegador.

---

## 5 · Las imágenes

Las fotos por defecto **no son archivos**: son escenas SVG que dibuja `art.js` a partir
de la paleta elegida (`art:hero`, `art:vestidor`, `art:cocina`…). Pesan casi nada, se
adaptan a los seis colores del sitio y no dependen de ninguna imagen externa.

Para poner fotos reales: seleccioná la sección → campo de imagen → **Subir**.
La imagen se comprime en el navegador a 1400 px y JPEG 0.82 antes de guardarse. También
podés pegar una URL externa con **Link**.

Recomendaciones:

- Una foto vertical (4:5) para la portada y el manifiesto.
- Una horizontal (5:4) para las pestañas de ambientes.
- Tratá de no pasar de 700 KB por imagen: el contenido completo tiene un techo de 3,2 MB.

---

## 6 · Seguridad, con las cartas sobre la mesa

- La contraseña **no se guarda**: se guarda un hash PBKDF2-SHA256 con 150.000
  iteraciones y sal aleatoria, en `users.json`.
- Las sesiones son tokens firmados con `ADMIN_SECRET` (HMAC-SHA256) y vencen a las 12 h.
- El `GITHUB_TOKEN` vive solo en las variables de entorno de Vercel; el navegador nunca
  lo ve ni lo puede pedir.
- Solo se puede escribir en `/api/content` con una sesión válida; el resto del sitio es
  público, como corresponde a una landing.
- `users.json` y `draft.js` están en `.vercelignore`: no se sirven como archivos
  estáticos, solo los lee el servidor desde GitHub.
- Hay límite de intentos de login (8 cada 10 minutos por IP y por instancia).

Lo que **no** hace: no hay 2FA, ni invitados con permisos distintos, ni edición
simultánea. Es un editor para una sola persona, que es exactamente el caso de una OPC.

---

## 7 · Problemas frecuentes

| Síntoma | Causa y solución |
| --- | --- |
| Aparece «Modo local: los cambios se guardan en este navegador» | La API no está activa: faltan variables de entorno o hubo un error en el deploy. Revisá *Deployments → Functions* en Vercel. |
| «Sesión vencida. Volvé a entrar.» | Pasaron 12 h o cambió `ADMIN_SECRET`. Entrá de nuevo. |
| Publiqué y el sitio no cambió | Vercel está redeployando (1-2 min). Mirá *Deployments* y recargá con Ctrl+F5. |
| «Contraseña incorrecta» y estoy seguro | Borrá `users.json` del repo y volvé a configurar con `ADMIN_SETUP_TOKEN`. |
| El guardado dice que el contenido es muy grande | Hay imágenes pesadas. Re-subilas (se comprimen solas) o usá links externos. |
| Quiero volver a una versión anterior | GitHub → *Commits* → elegí el commit → copiá su `content.js` o revertí el commit. |
| Cambié `ADMIN_SECRET` y no entra nadie | Es esperable: invalida todas las sesiones. Volvé a entrar con la contraseña. |

---

## 8 · Personalización rápida

- **Marca, textos de contacto, SEO y pie**: editor → pestaña **Ajustes**.
- **Paleta, tipografía, bordes, animaciones**: editor → pestaña **Diseño**.
- **Secciones**: agregar, duplicar, ocultar, borrar y reordenar arrastrando.
- **Colores exactos o tipografías nuevas**: `site.css`, bloque 2 (`--paper`, `--ink`,
  `--accent`, `--art-*`). Cada paleta es un bloque de variables.
- **Textos de la landing sin abrir el editor**: `content.js` es JSON legible.

La marca **KANDO**, los textos y los precios son un punto de partida profesional:
cambialos por los reales desde el editor en diez minutos.

---

## 9 · Créditos y alcance

El método KonMari es una marca de KonMari Media Inc. Este sitio es un servicio
independiente: describe una adaptación profesional del método y no está avalado por
KonMari Media Inc. El texto del pie lo aclara y se puede editar en **Ajustes → Pie**.
