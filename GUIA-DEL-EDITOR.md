# Guía del editor

La guía de todos los días. Si es tu primera vez, mirá primero el punto 1.

---

## 1 · Entrar

1. Abrí `tu-sitio.vercel.app/editor.html`.
2. Escribí tu contraseña. Listo.

La primera vez te va a pedir el **token de instalación** (el valor de
`ADMIN_SETUP_TOKEN` en Vercel) y la contraseña que quieras usar de ahí en adelante.

Si abrís `editor.html` con doble clic en tu computadora, entrás en **modo local**:
podés editar y probar todo, pero los cambios se guardan en ese navegador y se publican
descargando un archivo, no directo a internet.

---

## 2 · La pantalla

```
┌──────────── barra: dispositivo · editar/preview · guardar · publicar ────────────┐
│                                                                                │
│  secciones        ┌──────────────────────────────┐        campos de la sección  │
│  diseño           │                              │        elegida              │
│  ajustes          │   tu página, en vivo         │                             │
│                   │                              │                             │
│                   └──────────────────────────────┘                             │
└────────────────────────────────────────────────────────────────────────────────┘
```

- **Izquierda**: la lista de secciones en el orden en que aparecen. Arriba, las pestañas
  *Diseño* y *Ajustes* para lo global.
- **Centro**: la página real. No es una maqueta.
- **Derecha**: los campos de lo que tengas seleccionado.

Arriba a la derecha: **Guardar** deja el borrador y **Publicar** lo pone online. El
ícono de escritorio / tablet / celular cambia el ancho para revisar el responsive.

---

## 3 · Editar

### Cambiar un texto

**Doble clic** sobre el título o párrafo y escribí.

- `Enter` confirma. `Shift+Enter` hace un salto de línea.
- `Escape` cancela.
- En títulos y bajadas podés usar `*palabra*` para que esa palabra se vea en cursiva
  destacada, y `**palabra**` para negrita.

### Cambiar cualquier otra cosa

**Un clic** en la sección (o en la lista de la izquierda) y usá el panel derecho:
textos, botones, fotos, listas, precios, preguntas.

- Los campos con **＋ Agregar** suman elementos (una pestaña más, un plan más).
- Las flechas ↑ ↓ de cada elemento lo mueven; el tachito lo borra.
- Todo se ve en la página al instante.

### Mover, duplicar, ocultar, borrar secciones

- **Arrastrá** una fila de la lista para cambiarla de lugar.
- Sobre la sección seleccionada aparece una barra negra flotante con subir, bajar,
  duplicar, ocultar y eliminar.
- El **ojo** de la lista la oculta sin borrarla: podés recuperarla cuando quieras.

### Agregar una sección nueva

Botón **Agregar sección** (abajo de la lista). Se suma al final y después la movés donde
quiera. Hay catorce tipos: portada, manifiesto, servicios, pestañas, principios, proceso,
galería, planes, frase, testimonios, preguntas, llamado final, banda de palabras y
contacto.

---

## 4 · Diseño global

Pestaña **Diseño**:

| Opción | Qué cambia |
| --- | --- |
| Paleta | Seis climas pastel: durazno, salvia, lavanda, arena, cielo, rosa. |
| Tipografía | Cuatro combinaciones (una cálida, una clásica, una editorial, una moderna). |
| Bordes | Suaves, muy redondeados o rectos. |
| Textura | Círculo zen de fondo o sin textura. |
| Animaciones | Apaga o prende las apariciones al scrollear. |

Se aplica a todo el sitio de una vez, incluidas las ilustraciones.

---

## 5 · Ajustes del sitio

Pestaña **Ajustes**: marca (nombre, bajada, monograma, logo), WhatsApp y mail, horarios,
Instagram, textos del menú, SEO y pie de página.

> El **WhatsApp** se escribe solo con números y código de país: `5491122334455`.
> De ahí salen el botón flotante, el formulario y todos los llamados.

---

## 6 · Guardar, publicar y deshacer

| Acción | Qué hace |
| --- | --- |
| Guardar (Ctrl+S) | Manda el borrador al repositorio. No lo ve nadie. |
| Publicar | Convierte el borrador en la versión pública. |
| Ctrl+Z / Ctrl+Shift+Z | Deshacer y rehacer mientras trabajás. |
| Descargar copia | Baja un JSON con todo el contenido, por las dudas. |
| Importar copia | Restaura un JSON descargado antes. |

El estado arriba a la derecha te dice si hay cambios sin guardar. Además, el borrador se
guarda solo en tu navegador: si se cierra la pestaña por accidente, al volver está.

**Después de publicar**, Vercel reconstruye el sitio. Tarda entre 30 y 90 segundos. Si
recargás y no ves el cambio, esperá un poco y usá Ctrl+F5.

---

## 7 · Las fotos

Cada campo de imagen tiene tres botones:

- **Subir**: elegís una foto de tu computadora. Se achica a 1400 px y se comprime sola.
- **Link**: pegás una dirección (`https://…`) o una ilustración del sistema
  (`art:hero`, `art:vestidor`, `art:cocina`, `art:placard`, `art:infantil`,
  `art:lavadero`, `art:manifiesto`, `art:cta`).
- **Quitar**: deja el espacio vacío con una trama.

En la galería, si cargás una foto en **Antes** además de **Después**, el bloque muestra
el comparador deslizante. Si dejás *Antes* vacío, se ve como foto simple con lightbox.

---

## 8 · Cosas que conviene saber

- **No hay botón de "borrar todo"**: para empezar de cero, importá el `content.js`
  original del repositorio o pedí una copia.
- **Los cambios no se pierden** al cambiar de dispositivo o de sección: están en memoria
  hasta que cerrás la pestaña, y en el borrador del navegador todo el tiempo.
- **Los textos con asteriscos** son la única sintaxis. Nada de HTML.
- **El orden de las secciones** es el orden de la página. La portada conviene que quede
  primera.
- **El menú** se arma solo con las secciones visibles, en un orden pensado. Si ocultás
  una, desaparece del menú.
- **Para revisar el celular** no hace falta el teléfono: cambiá a la vista móvil arriba.
