# Loopy — Documento de producto y diseño

> **Two lives, one loop.** · *Dos vidas, un mismo lazo.*
> El espacio privado y compartido para parejas: música, películas, cartas, planes y recuerdos, en un solo lugar que es solo de ustedes.

**Nombre provisorio:** Loopy (app y mascota). Pendiente verificar dominio, tiendas y marca (INPI).

---

## Índice

1. Visión
2. Marca y mascota
3. Sistema de diseño
4. Modelo SaaS
5. Flujos
6. Landing page
7. Módulos de la app
8. Ideas a futuro
9. Navegación
10. Modelo de datos
11. Stack técnico
12. Roadmap
13. Riesgos
14. Próximos pasos

---

## 1. Visión

Las apps de citas terminan cuando empieza la relación. Después, la pareja comparte su vida en mil lugares (WhatsApp, Spotify, Instagram, notas sueltas) y todo se pierde en el scroll.

**Loopy es el rincón digital de la pareja:** un espacio compartido donde se guardan canciones, películas, cartas, planes, comidas, ideas y momentos, y que con el tiempo se convierte en el archivo de la relación.

**Modelo:** SaaS web (luego app móvil), con una suscripción por pareja.

---

## 2. Marca y mascota

### 2.1 Concepto

Un *loop* es un lazo: dos hilos que se cruzan y forman uno solo. Separados son finos; entrelazados, son fuertes. Toda la marca sale de esa imagen.

### 2.2 Personalidad de marca

| Somos | No somos |
|---|---|
| Tiernos | Empalagosos |
| Juguetones | Infantiles |
| Íntimos | Invasivos |
| Simples | Básicos |
| Cálidos | Cursis |

### 2.3 Tono de voz

- Hablamos en **"ustedes" y "nosotros"**, nunca de forma impersonal.
- Frases cortas, cálidas, con humor suave.
- Celebramos lo pequeño ("¡Primera canción dedicada! 🎶").
- Nunca culpamos ni presionamos.

**Ejemplos**

| Situación | ✅ Así | ❌ Así no |
|---|---|---|
| Estado vacío | "Todavía no hay cartas. ¿Escribimos la primera?" | "No hay elementos." |
| Invitación | "Loopy está esperando a tu otra mitad 🧶" | "Invitación pendiente." |
| Error | "Uy, se nos enredó el hilo. Probá de nuevo." | "Error 500." |
| Inactividad | "Loopy se quedó dormidito esperándolos 💤" | "No usaste la app en 5 días." |

### 2.4 La mascota: Loopy

**Qué es:** un ovillito de lana redondo, hecho de **dos hilos de colores distintos** (uno por cada miembro de la pareja), entrelazados.

**Rasgos visuales**
- Forma redonda, levemente achatada, suave.
- Dos ojitos ovalados negros con un brillo blanco.
- Mejillas rosadas.
- Un hilito suelto que sale de arriba, como un mechón o una antena (su rasgo distintivo).
- Sin boca o con una boca mínima; expresa con ojos, mejillas y el hilito.
- Trazo redondeado, sin líneas duras, relleno con gradiente suave.

**Colores del ovillo**
- Por defecto: Lavanda + Durazno.
- Personalizable: cada persona elige su color de hilo en el onboarding, y el Loopy de esa pareja combina los dos.

**Expresiones (set mínimo)**
| Estado | Uso |
|---|---|
| Feliz | Dashboard por defecto |
| Enamorado (ojos de corazón) | Al recibir una carta, aniversario |
| Festejando (saltando, confeti) | Logros, vinculación exitosa |
| Dormido 💤 | Inactividad, modo noche |
| Pensativo | Estados vacíos, "¿qué vemos hoy?" |
| Esperando (mirando un costado) | Esperando a la pareja |
| Enredado | Errores |

**Momento estrella:** cuando la pareja acepta la invitación, aparecen dos hilos sueltos, se entrelazan en pantalla y forman a Loopy. Es el momento más compartible de la app.

**Loopy como mascota compartida (fase 3)**
- Crece y cambia según cómo usan la app juntos.
- Cuanto más interactúan los dos, más entrelazado y brillante se ve.
- Accesorios desbloqueables: gorritos por estación, bufanda, casita.
- Aparece en el widget del celular.
- **Regla de oro:** Loopy nunca sufre, llora ni culpa. Si no lo usan, se duerme y espera tranquilo.

### 2.5 Logo

- **Isotipo:** un lazo formado por dos líneas de color (lavanda y durazno) que se cruzan y cierran en un loop. Versión alternativa: la carita de Loopy.
- **Logotipo:** "loopy" en minúsculas, en la tipografía display, con la doble "oo" que puede transformarse en dos aros entrelazados.
- Esquinas siempre redondeadas. Nunca en mayúsculas.

### 2.6 Taglines

- *Two lives, one loop.*
- *Your story, all tied together.*
- *Stay in the loop.* (juego de palabras con "estar al tanto")
- En español: *Dos vidas, un mismo lazo.* / *Su rincón, solo de ustedes.*

---

## 3. Sistema de diseño

### 3.1 Principios

1. **Suave antes que brillante.** Pasteles, gradientes delicados, nada estridente.
2. **Bento como estructura.** Todo se organiza en tarjetas de distintos tamaños, como una caja bento: ordenado pero con ritmo.
3. **Aire.** Mucho espacio en blanco; cada tarjeta respira.
4. **Redondo.** Esquinas generosas en todo, sin ángulos duros.
5. **Dos colores, una pareja.** El sistema siempre refleja a los dos (un color por persona).
6. **Tierno, no infantil.** La mascota y los detalles dan calidez; la estructura se mantiene limpia y adulta.

### 3.2 Paleta de colores

#### Base (fondos y superficies)
| Token | Hex | Uso |
|---|---|---|
| `--cream` | `#FFF9F4` | Fondo principal de la app |
| `--surface` | `#FFFFFF` | Tarjetas bento |
| `--surface-soft` | `#FBF5F0` | Tarjetas secundarias, inputs |
| `--line` | `#F0E6DE` | Bordes sutiles |

#### Pasteles principales
| Token | Hex | Personalidad | Uso |
|---|---|---|---|
| `--lavender` | `#C9B8FF` | Calma, intimidad | Color primario, persona A |
| `--peach` | `#FFC2A8` | Calidez, cariño | Color secundario, persona B |
| `--blush` | `#FFB8D1` | Amor | Cartas, corazones, aniversarios |
| `--mint` | `#B5EAD7` | Frescura | Comidas, estados "libre" |
| `--butter` | `#FFE8A3` | Alegría | Ideas, notitas, logros |
| `--sky` | `#B8DCFF` | Tranquilidad | Calendario, eventos |
| `--lilac-mist` | `#E9E0FF` | Suavidad | Fondos de tarjetas lavanda |

#### Tonos profundos (texto y acentos)
| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#2E2440` | Texto principal (violeta muy oscuro, nunca negro puro) |
| `--ink-soft` | `#6B5F7E` | Texto secundario |
| `--ink-muted` | `#A89DB5` | Placeholders, metadatos |
| `--plum` | `#7C5CDB` | Botones primarios, links |
| `--coral` | `#FF8A70` | Acento cálido, CTA secundario |

#### Estados
| Token | Hex |
|---|---|
| `--success` | `#7DD3A8` |
| `--warning` | `#FFD27A` |
| `--error` | `#FF9B9B` |
| `--info` | `#8FC4FF` |

#### Color por módulo (identidad de cada tarjeta)
| Módulo | Color base | Fondo de tarjeta |
|---|---|---|
| Estados | Lavanda | `#F3EEFF` |
| Cartas | Blush | `#FFEEF4` |
| Música | Lavanda → Blush | gradiente |
| Pelis y series | Sky | `#EDF6FF` |
| Links | Peach | `#FFF1EA` |
| Calendario de eventos | Sky | `#EDF6FF` |
| Calendario de comidas | Mint | `#EAF8F2` |
| Ideas | Butter | `#FFF8E1` |
| Notitas | Butter / multicolor | post-its |
| Recuerdos | Peach → Butter | gradiente |

### 3.3 Gradientes

Siempre suaves, de dos o tres pasteles vecinos, con ángulo diagonal. Nunca saturados ni con más de tres colores.

```css
--grad-loop:     linear-gradient(135deg, #C9B8FF 0%, #FFC2A8 100%);  /* marca: la pareja */
--grad-love:     linear-gradient(135deg, #FFB8D1 0%, #FFC2A8 100%);  /* cartas, aniversario */
--grad-dream:    linear-gradient(135deg, #B8DCFF 0%, #C9B8FF 100%);  /* calendario, noche */
--grad-fresh:    linear-gradient(135deg, #B5EAD7 0%, #B8DCFF 100%);  /* comidas */
--grad-sunny:    linear-gradient(135deg, #FFE8A3 0%, #FFC2A8 100%);  /* ideas, recuerdos */
--grad-hero:     linear-gradient(160deg, #FFF9F4 0%, #F3EEFF 45%, #FFEEF4 100%); /* fondo hero */
```

**Gradientes de malla (mesh / blobs)**
Para fondos de la landing y del dashboard: 2–3 manchas difusas de lavanda, durazno y blush, muy desenfocadas (`filter: blur(80px)`, opacidad 40–60%), que se mueven lentamente. Dan profundidad sin ensuciar.

**Reglas**
- El texto sobre gradiente siempre en `--ink`, nunca blanco (los pasteles no dan contraste suficiente).
- Botones primarios: `--plum` sólido o `--grad-loop` con texto `--ink`.
- Máximo 1–2 tarjetas con gradiente por pantalla; el resto, blancas o con fondo pastel plano.

### 3.4 Tipografía

Tres familias, cada una con un rol claro. Todas disponibles en Google Fonts.

| Rol | Fuente | Por qué |
|---|---|---|
| **Display / títulos** | **Fraunces** (peso 500–700, eje SOFT al máximo, WONK activado) | Serif suave y con carácter, muy memorable, romántica sin ser cursi |
| **UI / texto** | **Plus Jakarta Sans** (400–700) | Redondeada, moderna, muy legible en tamaños chicos |
| **Manuscrita / acento** | **Caveat** (500–700) | Para cartas, notitas, firmas y detalles a mano |

**Alternativas si se busca otro tono**
- Display más juguetón: *Bricolage Grotesque* o *Gochi Hand* para acentos.
- UI más redondeada: *Nunito* o *Quicksand*.

**Escala tipográfica**
| Token | Tamaño / interlineado | Fuente | Uso |
|---|---|---|---|
| `display-xl` | 64 / 68 | Fraunces 600 | Hero de la landing |
| `display-l` | 48 / 54 | Fraunces 600 | Títulos de sección |
| `h1` | 32 / 38 | Fraunces 600 | Título de página |
| `h2` | 24 / 30 | Fraunces 500 | Título de tarjeta grande |
| `h3` | 18 / 24 | Plus Jakarta 700 | Título de tarjeta chica |
| `body` | 16 / 24 | Plus Jakarta 400 | Texto general |
| `small` | 14 / 20 | Plus Jakarta 500 | Metadatos, etiquetas |
| `micro` | 12 / 16 | Plus Jakarta 600, mayúsculas, +4% tracking | Badges, overlines |
| `hand` | 22 / 28 | Caveat 600 | Cartas, notitas, firmas |

En móvil, los display bajan un 30–40% (hero 40px).

**Reglas**
- Títulos en Fraunces, en minúsculas con mayúscula inicial ("Nuestras cartas").
- Caveat solo para contenido "humano" (lo que escribe la pareja), nunca para botones ni navegación.
- Números grandes (contadores, días juntos) en Fraunces: son protagonistas.

### 3.5 Estilo Bento

La interfaz se arma con **grillas de tarjetas de distintos tamaños**, como una caja bento. Cada tarjeta es un módulo con su color y su propósito.

**Grilla**
- Desktop: 12 columnas, gap `20px`, márgenes laterales `32–48px`, ancho máximo `1200px`.
- Tablet: 6 columnas, gap `16px`.
- Móvil: 2 columnas (o 1), gap `12px`, márgenes `16px`.

**Tamaños de tarjeta (desktop)**
| Tamaño | Columnas × filas | Uso típico |
|---|---|---|
| XL | 8 × 2 | Héroe del dashboard (estado de la pareja + Loopy) |
| L | 6 × 2 | Música, calendario |
| M | 4 × 2 | Cartas, pelis |
| S | 4 × 1 | Contador, canción del día |
| XS | 2 × 1 | Accesos rápidos, "pensando en vos" |
| Alta | 4 × 3 | Lista de notitas, feed de recuerdos |

**Ejemplo de dashboard en bento (desktop)**

```
┌──────────────────────────────────┬───────────────┐
│                                  │  💭 Pensando   │
│   ESTADO DE TU PAREJA  + Loopy   │   en vos       │
│   (XL, gradiente loop)           ├───────────────┤
│                                  │  ⏳ 432 días   │
│                                  │   juntos       │
├────────────────┬─────────────────┴───────────────┤
│ 🎵 Canción del │  📅 Próximo: Cena aniversario    │
│    día         │     en 3 días                    │
├────────────────┼─────────────────┬───────────────┤
│ 💌 Última      │ 🎬 Para ver     │ 🍝 Hoy        │
│    carta       │    hoy          │    cenamos    │
├────────────────┴─────────────────┼───────────────┤
│ 🗒️ Notitas (tablero)             │ ✨ Recuerdo   │
│                                  │    del día    │
└──────────────────────────────────┴───────────────┘
```

**Reglas del bento**
- Una tarjeta protagonista por pantalla (la más grande, con gradiente o con Loopy).
- Alternar tarjetas blancas con tarjetas de fondo pastel para dar ritmo.
- Nunca dos tarjetas del mismo color pegadas.
- Cada tarjeta tiene: ícono o emoji + título corto + contenido + (opcional) acción en la esquina.
- Las tarjetas son clickeables enteras y llevan al módulo completo.
- En móvil, la tarjeta protagonista ocupa el ancho completo y el resto se acomoda en 2 columnas.

### 3.6 Forma, bordes y sombras

**Radios**
| Token | Valor | Uso |
|---|---|---|
| `--r-sm` | 12px | Inputs, chips, badges |
| `--r-md` | 20px | Botones, tarjetas chicas |
| `--r-lg` | 28px | Tarjetas bento |
| `--r-xl` | 36px | Tarjeta protagonista, modales |
| `--r-full` | 999px | Avatares, pills, botones redondos |

**Sombras** (siempre tintadas de violeta, nunca grises)
```css
--shadow-sm:  0 2px 8px rgba(124, 92, 219, 0.06);
--shadow-md:  0 8px 24px rgba(124, 92, 219, 0.08);
--shadow-lg:  0 16px 48px rgba(124, 92, 219, 0.12);
--shadow-glow: 0 8px 32px rgba(255, 184, 209, 0.45); /* para tarjetas de amor / destacados */
```

**Bordes:** 1px `--line` en tarjetas blancas; sin borde en tarjetas con color o gradiente.

### 3.7 Espaciado

Escala de 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96`.
- Padding interno de tarjeta: `24px` (desktop), `16–20px` (móvil).
- Separación entre secciones de la landing: `96–128px`.

### 3.8 Componentes

**Botones**
| Tipo | Estilo |
|---|---|
| Primario | Fondo `--plum`, texto blanco, `--r-full`, alto 48px, sombra md |
| Primario suave | Fondo `--grad-loop`, texto `--ink` |
| Secundario | Fondo `--lilac-mist`, texto `--plum` |
| Fantasma | Transparente, texto `--ink-soft`, hover con fondo `--surface-soft` |
| Redondo de acción | 56px, `--r-full`, ícono centrado (ej. "pensando en vos" 💭) |

Hover: se eleva 2px y la sombra crece. Click: se achica levemente (scale 0.97).

**Inputs:** fondo `--surface-soft`, sin borde visible, `--r-sm`, alto 48px; al enfocar, borde 2px `--lavender` y halo suave.

**Avatares de pareja:** dos círculos superpuestos, cada uno con un aro de su color (lavanda / durazno). Es un patrón que se repite en toda la app.

**Chips / etiquetas:** pills con fondo pastel del módulo y texto `--ink`.

**Tarjeta de carta:** fondo crema con textura sutil de papel, título en Fraunces, cuerpo en Caveat, sello de cera circular con el color de quien la escribió.

**Notitas:** post-its cuadrados con leve rotación aleatoria (−3° a 3°), colores butter / blush / mint / sky, texto en Caveat, sombra sm.

**Estados vacíos:** siempre con Loopy en una expresión acorde + una frase cálida + un botón de acción.

**Íconos:** línea redondeada, trazo 1.75–2px, extremos redondos (ej. *Phosphor Icons* en estilo "Regular" o "Duotone", o *Lucide*). Se combinan con emojis en títulos de tarjetas.

### 3.9 Ilustración

- Estilo: formas redondas, planas con gradientes suaves, sin contornos negros.
- Motivo recurrente: **hilos y lazos** que conectan elementos (por ejemplo, un hilo que une dos tarjetas en la landing o recorre la línea de tiempo).
- Personajes humanos: si aparecen, siliuetas simples y diversas, sin rasgos detallados, para que cualquier pareja se identifique.
- Inclusiva: parejas de todo tipo (heterosexuales, del mismo género, de distintas edades y orígenes).

### 3.10 Movimiento

- **Suave y elástico:** easing `cubic-bezier(0.34, 1.56, 0.64, 1)` para elementos que aparecen; duración 250–400ms.
- Tarjetas bento entran escalonadas (stagger de 60ms) al cargar.
- Blobs de gradiente del fondo se mueven en loops lentos (20–30s).
- Loopy respira (escala 1 → 1.03) en reposo y parpadea cada tanto.
- Micro-celebraciones: confeti pastel al vincularse, al cumplir aniversarios y al desbloquear logros.
- Respetar `prefers-reduced-motion`: sin blobs animados ni confeti.

### 3.11 Modo oscuro ("modo noche")

No es negro: es un violeta muy profundo, como una noche cálida.
| Token | Hex |
|---|---|
| Fondo | `#1E1830` |
| Superficie (tarjetas) | `#2A2240` |
| Superficie suave | `#342B4D` |
| Texto | `#F5EFFF` |
| Texto secundario | `#B8ADCC` |

Los pasteles se mantienen pero bajan un 15–20% de luminosidad. Loopy aparece con gorrito de dormir 🌙.

### 3.12 Accesibilidad

- Contraste mínimo AA (4.5:1) para texto: por eso el texto va en `--ink` sobre pasteles, nunca blanco.
- El color nunca es la única forma de transmitir información (los estados llevan ícono + texto).
- Áreas táctiles mínimas de 44×44px.
- Foco visible en todos los elementos interactivos.

---

## 4. Modelo SaaS

### Cuentas y roles
- **Cuenta madre (titular):** crea el espacio, gestiona la suscripción, envía la invitación, puede desvincular.
- **Pareja (invitada):** entra por invitación; dentro del espacio tiene los mismos permisos de contenido.
- **Espacio de pareja:** la unidad central. Todo el contenido pertenece al espacio.

> Cada persona tiene su propio login, pero ambos entran al mismo espacio. Así se sabe quién escribió cada carta o dedicó cada canción, y es más seguro que compartir una contraseña.

### Planes
| | **Gratis** | **Loopy Plus** (por pareja) |
|---|---|---|
| Estados, notitas, links | ✅ | ✅ |
| Playlist y lista de pelis | ✅ | ✅ |
| Calendario de eventos | ✅ | ✅ |
| Cartas | 5 por mes | Ilimitadas |
| Cartas programadas | ❌ | ✅ |
| Calendario de comidas | Básico | Recetas + lista de compras |
| Fotos / recuerdos | 100 MB | 20 GB |
| Temas y accesorios de Loopy | Básicos | Todos |
| Cápsula del tiempo | ❌ | ✅ |
| Exportar el espacio | ❌ | ✅ |

Precio orientativo: USD 3–5/mes o USD 30–40/año por pareja.

---

## 5. Flujos

### 5.1 Cuenta madre
```
Landing → "Crear nuestro espacio"
   ↓
Registro (email / Google / Apple)
   ↓
Onboarding
   - Tu nombre / apodo
   - Elegí tu color de hilo 🧶
   - Nombre del espacio ("Juli & Tomi")
   - Fecha de aniversario (opcional)
   ↓
Invitación: link único + código de 6 dígitos (vence en 7 días)
   - Compartir por WhatsApp / copiar
   ↓
Espacio en "modo espera": Loopy con un solo hilo, mirando la puerta
```

### 5.2 Pareja invitada
```
Abre el link → "[Nombre] te invitó a su Loopy"
   ↓
Crea cuenta o inicia sesión
   ↓
Onboarding corto: nombre, foto, color de hilo
   ↓
Animación: los dos hilos se entrelazan y nace su Loopy 🎉
   ↓
Entra al espacio compartido
```

### 5.3 Reglas
- Un usuario pertenece a un solo espacio activo.
- Máximo 2 miembros por espacio.
- Invitación de un solo uso; la titular puede regenerarla.

### 5.4 Desvinculación
- Cualquiera puede salir del espacio.
- Antes de salir: opción de exportar su copia del contenido.
- El espacio se archiva 30 días y luego se elimina.
- Mensajes neutros y respetuosos; Loopy no aparece triste.

---

## 6. Landing page

Estructura en bento, fondo crema con blobs de gradiente animados.

1. **Hero**
   - Título (Fraunces, display-xl): *"Su rincón, solo de ustedes."*
   - Subtítulo: "Música, películas, cartas y planes. Todo lo que comparten, en un mismo lazo."
   - CTA primario: "Crear nuestro espacio" · CTA fantasma: "Ver cómo funciona"
   - A la derecha: Loopy grande flotando + mockup del dashboard bento.
2. **El problema:** "Se mandan canciones por un lado, links por otro, planes en el chat… y todo se pierde." (ilustración de hilos desordenados que se ordenan al hacer scroll).
3. **Funciones en grilla bento:** cada módulo en una tarjeta con su color, ícono y mini-preview (la tarjeta de música con una mini playlist, la de cartas con un sobre, etc.).
4. **Cómo funciona (3 pasos):** Creá tu espacio → Invitá a tu pareja → Empiecen a compartir. Un hilo dibujado conecta los tres pasos.
5. **Conocé a Loopy:** la mascota con sus expresiones, explicando que crece con ustedes.
6. **Para parejas a distancia:** contadores, dos zonas horarias, cartas programadas.
7. **Privacidad:** "Lo que pasa en Loopy, queda entre ustedes." Sin anuncios, sin vender datos.
8. **Precios:** dos tarjetas (Gratis / Loopy Plus), la Plus con gradiente loop.
9. **Testimonios** (cuando existan), en tarjetas tipo notita.
10. **FAQ** en acordeones redondeados.
11. **CTA final:** Loopy saludando + "Empiecen hoy, es gratis."
12. **Footer** simple en crema.

---

## 7. Módulos de la app

### 7.1 Inicio (dashboard bento)
Estado de la pareja + Loopy (protagonista) · botón "Pensando en vos" · días juntos · canción del día · próximo evento · última carta · peli para hoy · comida de hoy · notitas · recuerdo del día.

### 7.2 Estados mutuos
Ánimo (emoji + color), actividad, disponibilidad (libre / ocupado / no molestar), mensaje corto, botón rápido **"Pensando en vos" 💭** que envía una notificación.

### 7.3 Cartas
Editor con papel, sobre y sello · cartas programadas ("abrir el 14/02") · cartas "abrir cuando…" (estés triste, no puedas dormir, me extrañes) · animación de abrir el sobre · buzón.

### 7.4 Música
Playlist compartida (Spotify / Apple Music / YouTube) · canción del día dedicada con nota · "nuestra canción" destacada · historial.

### 7.5 Películas y series
Lista "para ver juntos" (datos de TMDB) · estados por ver / viendo / vista · puntuación de cada uno y comparación · ruleta **"¿Qué vemos hoy?"** con Loopy pensativo.

### 7.6 Links
Vista previa automática · categorías (lugares, recetas, compras, memes, viajes, videos) · marcar como "hecho".

### 7.7 Calendario de eventos
Citas, aniversarios, viajes, cumpleaños · recurrentes · recordatorios a los dos · cuentas regresivas · colores por tipo · (futuro) sincronización con Google Calendar.

### 7.8 Calendario de comidas
Vista semanal (desayuno, almuerzo, cena) · quién cocina · recetas guardadas · **lista de compras automática** · banco de "comidas para probar" · "¿Qué comemos?" aleatorio.

### 7.9 Ideas
Ideas de citas, viajes soñados, proyectos, regalos (modo privado) · votos con 👍 / ❤️.

### 7.10 Notitas
Post-its en una "heladera virtual" · colores y stickers · tiernas, recordatorios o chistes internos.

---

## 8. Ideas a futuro

**Conexión emocional**
- Pregunta del día (respuestas visibles cuando los dos contestan)
- Check-in de la relación, opcional y privado
- Test de lenguajes del amor

**Recuerdos**
- Línea de tiempo de la relación (con un hilo que la recorre)
- Álbum de fotos compartido
- Cápsula del tiempo (abrir en 1 o 5 años)
- Recuerdos automáticos ("hace un año…")
- **Loopy Wrapped:** resumen anual (canciones, pelis, cartas, días juntos)

**Vida práctica**
- Bucket list · lista de deseos · gastos compartidos · tareas del hogar · cuidados de mascotas y plantas

**Distancia**
- Contador "nos vemos en…" · doble zona horaria · ver pelis sincronizados · widget con Loopy y el estado del otro

**Gamificación suave**
- Rachas y logros en equipo, accesorios para Loopy. Nunca competencia entre ellos.

---

## 9. Navegación

```
Loopy (espacio de pareja)
├── Inicio
├── Nosotros
│   ├── Estados
│   ├── Cartas
│   └── Notitas
├── Compartir
│   ├── Música
│   ├── Pelis y series
│   └── Links
├── Planear
│   ├── Calendario de eventos
│   ├── Calendario de comidas
│   └── Ideas
├── Recuerdos
│   ├── Línea de tiempo
│   └── Fotos
└── Ajustes
    ├── Perfil y color de hilo
    ├── Espacio (nombre, aniversario, tema)
    ├── Loopy (accesorios)
    ├── Suscripción (solo titular)
    ├── Notificaciones
    └── Privacidad / desvincular
```

Desktop: barra lateral izquierda con íconos + etiquetas, fondo crema.
Móvil: barra inferior con 5 ítems (Inicio · Nosotros · Compartir · Planear · Recuerdos) y botón flotante "+" para crear rápido.

---

## 10. Modelo de datos (borrador)

```
User          id, email, nombre, apodo, avatar, color_hilo, zona_horaria, creado_en
CoupleSpace   id, nombre, fecha_aniversario, tema, owner_id, plan, estado, loopy_nivel, loopy_accesorios, creado_en
Membership    id, user_id, space_id, rol (owner | partner), unido_en
Invitation    id, space_id, codigo, token, creado_por, vence_en, usado
Status        id, space_id, user_id, emoji, color, actividad, disponibilidad, mensaje, actualizado_en
Letter        id, space_id, autor_id, titulo, contenido, estilo, tipo, abrir_en, condicion, leida
Song          id, space_id, agregado_por, titulo, artista, url, plataforma, nota, es_del_dia, fecha
Movie         id, space_id, agregado_por, tmdb_id, titulo, poster, estado, rating_a, rating_b
Link          id, space_id, agregado_por, url, titulo, imagen, categoria, hecho
Event         id, space_id, creado_por, titulo, inicio, fin, tipo, recurrencia, recordatorio
Meal          id, space_id, fecha, momento, receta_id, cocina_user_id
Recipe        id, space_id, nombre, ingredientes, pasos, link
Idea          id, space_id, autor_id, titulo, descripcion, categoria, privada, votos
Note          id, space_id, autor_id, texto, color, posicion, rotacion
Memory        id, space_id, subido_por, url, fecha, descripcion
```

---

## 11. Stack técnico

| Capa | Opción | Por qué |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Landing y app juntas, SEO, tokens de diseño fáciles |
| Componentes | shadcn/ui personalizado + Framer Motion | Base accesible + animaciones suaves |
| Backend / DB | Supabase (Postgres, Auth, Storage, Realtime) | Todo listo para empezar |
| Pagos | Mercado Pago (Latam) + Stripe (internacional) | Suscripciones |
| Emails | Resend | Invitaciones, recordatorios |
| Push | OneSignal / Firebase | "Pensando en vos", cartas programadas |
| Hosting | Vercel | |
| Integraciones | Spotify API, TMDB API, previews de links | |
| Mascota | SVG animado o Lottie / Rive | Loopy con expresiones y estados |
| Móvil | Expo (React Native) o PWA | Widgets requieren app nativa |

**Tokens en Tailwind:** cargar la paleta, radios, sombras y tipografías de la sección 3 en `tailwind.config` para que todo el equipo use los mismos valores.

**Seguridad:** Row Level Security por `space_id`, cifrado en tránsito y en reposo, sin anuncios ni venta de datos.

---

## 12. Roadmap

**Fase 0 — Validación (2–3 semanas)**
Verificar nombre · identidad visual y Loopy · landing con lista de espera · entrevistas con 10–15 parejas.

**Fase 1 — MVP (6–8 semanas)**
Registro, espacio e invitación (con la animación de los hilos) · dashboard bento · estados + "pensando en vos" · cartas básicas · notitas · música · pelis · links.

**Fase 2 — Planear (4–6 semanas)**
Calendario de eventos · calendario de comidas + compras · ideas · cartas programadas · Loopy Plus.

**Fase 3 — Recuerdos y Loopy vivo**
Línea de tiempo y fotos · pregunta del día · cápsula del tiempo · Loopy que crece y accesorios.

**Fase 4 — Móvil y extras**
App móvil + widgets · Loopy Wrapped · bucket list, gastos, tareas · pelis sincronizadas.

---

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| Uno de los dos no la usa | Onboarding conjunto, notificaciones con contenido del otro, widget |
| Abandono tras el inicio | Estados diarios, pregunta del día, recuerdos, Loopy que crece |
| Rupturas | Salida respetuosa, exportación, archivo temporal |
| Privacidad | Seguridad por espacio, sin anuncios, política clara |
| Competencia (Between, Paired, etc.) | Contenido compartido + planificación + cartas + Loopy |
| Demasiadas funciones | MVP enfocado; sumar según uso real |
| Nombre ocupado | Verificar antes de invertir en marca; alternativas: Twyne, Twyni |

---

## 14. Próximos pasos

1. [ ] Verificar disponibilidad de "Loopy" (dominio, tiendas, INPI)
2. [ ] Bocetar a Loopy y sus 7 expresiones
3. [ ] Diseñar logo (isotipo de lazo + logotipo)
4. [ ] Diseñar la landing en bento
5. [ ] Diseñar pantallas: registro, onboarding, invitación, dashboard
6. [ ] Validar con parejas reales
7. [ ] Configurar tokens de diseño en Tailwind y empezar el MVP
