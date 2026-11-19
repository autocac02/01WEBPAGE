/* KANDO · esquema del editor.
   Describe qué campos tiene cada bloque. El panel derecho y la librería de bloques
   se generan a partir de esto: para agregar un campo alcanza con declararlo acá. */
(function () {
  'use strict';

  var t = function (key, label, opts) { return Object.assign({ key: key, label: label, type: 'text' }, opts || {}); };
  var ta = function (key, label, opts) { return Object.assign({ key: key, label: label, type: 'textarea' }, opts || {}); };
  var img = function (key, label, opts) { return Object.assign({ key: key, label: label, type: 'image' }, opts || {}); };
  var sel = function (key, label, options, opts) { return Object.assign({ key: key, label: label, type: 'select', options: options }, opts || {}); };
  var tog = function (key, label, opts) { return Object.assign({ key: key, label: label, type: 'toggle' }, opts || {}); };
  var lst = function (key, label, itemFields, opts) {
    return Object.assign({ key: key, label: label, type: 'list', itemFields: itemFields, addLabel: 'Agregar' }, opts || {});
  };
  var grp = function (key, label, fields, opts) {
    return Object.assign({ key: key, label: label, type: 'group', fields: fields }, opts || {});
  };

  var ICON_OPTS = [
    { value: 'hanger', label: 'Percha' },
    { value: 'fold', label: 'Plegado' },
    { value: 'jar', label: 'Frasco' },
    { value: 'spark', label: 'Destello' },
    { value: 'leaf', label: 'Hoja' }
  ];

  /* ---------- plantillas para bloques nuevos ---------- */
  function base(id, type, label, extra) {
    return Object.assign({ id: id, type: type, visible: true, label: label }, extra || {});
  }

  var LIBRARY = [
    {
      type: 'hero', name: 'Portada', group: 'Estructura',
      desc: 'La primera pantalla: título grande, bajada y foto.',
      create: function (uid) {
        return base(uid, 'hero', 'Portada', {
          eyebrow: 'Nueva sección',
          title: 'Un título que *respira*.',
          subtitle: 'Contá en dos o tres líneas qué hacés y para quién.',
          primaryCta: { label: 'Escribinos', href: '#contacto' },
          secondaryCta: { label: 'Ver más', href: '#servicios' },
          image: 'art:hero', imageCaption: '',
          stickyNote: '', stats: []
        });
      }
    },
    {
      type: 'band', name: 'Banda de palabras', group: 'Estructura',
      desc: 'Palabras que se deslizan, como un susurro.',
      create: function (uid) {
        return base(uid, 'band', 'Banda', { words: ['orden', 'calma', 'espacio', 'aire'] });
      }
    },
    {
      type: 'manifesto', name: 'Manifiesto', group: 'Textos',
      desc: 'Imagen al costado y un texto personal, con firma.',
      create: function (uid) {
        return base(uid, 'manifesto', 'Manifiesto', {
          eyebrow: 'Por qué', title: 'Una idea que te *representa*.',
          text: 'Escribí acá tu historia. Separá los párrafos con un salto de línea.',
          signature: 'Tu nombre', signatureRole: 'Fundadora',
          image: 'art:manifiesto',
          pillars: [{ k: 'Menos', v: 'lo que sobra' }, { k: 'Mejor', v: 'lo que queda' }]
        });
      }
    },
    {
      type: 'services', name: 'Servicios', group: 'Oferta',
      desc: 'Tres tarjetas con lo que ofrecés y desde cuánto.',
      create: function (uid) {
        return base(uid, 'services', 'Servicios', {
          eyebrow: 'Qué hacemos', title: 'Tres formas de empezar',
          intro: 'Una línea que ordene la lectura.',
          items: [
            { icon: 'hanger', title: 'Servicio uno', text: 'Qué incluye y para quién es.', detail: 'Detalle corto', priceFrom: 'desde $ 00.000' },
            { icon: 'fold', title: 'Servicio dos', text: 'Qué incluye y para quién es.', detail: 'Detalle corto', priceFrom: 'desde $ 00.000' },
            { icon: 'jar', title: 'Servicio tres', text: 'Qué incluye y para quién es.', detail: 'Detalle corto', priceFrom: 'desde $ 00.000' }
          ]
        });
      }
    },
    {
      type: 'tabs', name: 'Pestañas', group: 'Oferta',
      desc: 'Varias fichas en pestañas, con imagen y checklist.',
      create: function (uid) {
        return base(uid, 'tabs', 'Pestañas', {
          eyebrow: 'Para recorrer', title: 'Un método, varios casos', intro: '',
          tabs: [
            { label: 'Uno', kicker: '2 horas', title: 'Título de la pestaña', text: 'Contá el caso.', image: 'art:vestidor', checklist: ['Punto uno', 'Punto dos'], note: '' },
            { label: 'Dos', kicker: '3 horas', title: 'Título de la pestaña', text: 'Contá el caso.', image: 'art:placard', checklist: ['Punto uno', 'Punto dos'], note: '' }
          ]
        });
      }
    },
    {
      type: 'principles', name: 'Principios', group: 'Textos',
      desc: 'Cinco (o más) ideas numeradas en columnas.',
      create: function (uid) {
        return base(uid, 'principles', 'Principios', {
          eyebrow: 'El método', title: 'Cinco decisiones simples', intro: '',
          items: [
            { num: '01', title: 'Primer principio', text: 'Explicación breve.' },
            { num: '02', title: 'Segundo principio', text: 'Explicación breve.' },
            { num: '03', title: 'Tercer principio', text: 'Explicación breve.' }
          ]
        });
      }
    },
    {
      type: 'process', name: 'Proceso', group: 'Oferta',
      desc: 'Los pasos de tu trabajo, en línea de tiempo.',
      create: function (uid) {
        return base(uid, 'process', 'Proceso', {
          eyebrow: 'Cómo trabajamos', title: 'De la charla al resultado', intro: '',
          steps: [
            { title: 'Primer paso', meta: '30 min', text: 'Qué pasa en este paso.' },
            { title: 'Segundo paso', meta: '48 h', text: 'Qué pasa en este paso.' },
            { title: 'Tercer paso', meta: '1 día', text: 'Qué pasa en este paso.' }
          ]
        });
      }
    },
    {
      type: 'gallery', name: 'Galería', group: 'Prueba',
      desc: 'Fotos con antes/después deslizante.',
      create: function (uid) {
        return base(uid, 'gallery', 'Galería', {
          eyebrow: 'Antes y después', title: 'El mismo lugar, otra sensación', intro: '',
          items: [
            { caption: 'Trabajo uno', place: '1 jornada', image: 'art:galeria-vestidor', before: 'art:galeria-vestidor-antes' },
            { caption: 'Trabajo dos', place: '2 jornadas', image: 'art:galeria-placard', before: '' }
          ],
          note: ''
        });
      }
    },
    {
      type: 'packages', name: 'Planes', group: 'Oferta',
      desc: 'Tres planes con precio y beneficios.',
      create: function (uid) {
        return base(uid, 'packages', 'Planes', {
          eyebrow: 'Planes', title: 'Elegí por dónde empezar', intro: '',
          plans: [
            { name: 'Plan uno', price: '$ 00.000', unit: 'pago único', description: 'Para quién es.', features: ['Beneficio uno', 'Beneficio dos'], ctaLabel: 'Elegir', href: '#contacto', featured: false, badge: '' },
            { name: 'Plan dos', price: '$ 00.000', unit: 'desde', description: 'Para quién es.', features: ['Beneficio uno', 'Beneficio dos'], ctaLabel: 'Elegir', href: '#contacto', featured: true, badge: 'El más elegido' }
          ],
          note: ''
        });
      }
    },
    {
      type: 'quote', name: 'Frase', group: 'Textos',
      desc: 'Una frase grande para respirar entre secciones.',
      create: function (uid) {
        return base(uid, 'quote', 'Frase', { text: 'Una frase que resuma tu forma de ver las cosas.', author: 'Tu nombre', role: 'KANDO' });
      }
    },
    {
      type: 'testimonials', name: 'Testimonios', group: 'Prueba',
      desc: 'Opiniones de clientas con puntaje.',
      create: function (uid) {
        return base(uid, 'testimonials', 'Testimonios', {
          eyebrow: 'Voces', title: 'Lo que dicen', intro: '',
          items: [{ quote: 'Una reseña real.', name: 'Nombre', meta: 'Ciudad', rating: 5 }]
        });
      }
    },
    {
      type: 'faq', name: 'Preguntas', group: 'Textos',
      desc: 'Preguntas frecuentes desplegables.',
      create: function (uid) {
        return base(uid, 'faq', 'Preguntas', {
          eyebrow: 'Antes de escribir', title: 'Preguntas frecuentes', intro: '',
          items: [{ q: '¿Una pregunta?', a: 'La respuesta, en dos o tres líneas.' }]
        });
      }
    },
    {
      type: 'cta', name: 'Llamado final', group: 'Contacto',
      desc: 'Panel grande con botón a WhatsApp.',
      create: function (uid) {
        return base(uid, 'cta', 'Llamado final', {
          eyebrow: 'Empezá hoy', title: 'Un título que invite a escribir.',
          text: 'Una línea con la promesa concreta.',
          button: { label: 'Escribir por WhatsApp', href: '' },
          secondary: { label: '', href: '#contacto' },
          image: 'art:cta'
        });
      }
    },
    {
      type: 'contact', name: 'Contacto', group: 'Contacto',
      desc: 'Formulario que abre WhatsApp con el mensaje listo.',
      create: function (uid) {
        return base(uid, 'contact', 'Contacto', {
          eyebrow: 'Hablemos', title: 'Contame qué necesitás',
          text: 'Completá el formulario y te respondo.',
          formTitle: 'Tu consulta', formNote: 'Respondo en el día.',
          fields: { name: 'Nombre y apellido', phone: 'WhatsApp', space: '¿Qué espacio querés ordenar?', message: 'Contame un poco más' },
          spaceOptions: ['Vestidor', 'Placard', 'Cocina', 'Otro'],
          submitLabel: 'Enviar por WhatsApp',
          privacy: 'Usamos tus datos solo para responderte.'
        });
      }
    }
  ];

  /* ---------- formularios de cada bloque ---------- */
  var FORMS = {
    hero: [
      { title: 'Textos', fields: [
        t('eyebrow', 'Antetítulo'),
        ta('title', 'Título', { rows: 2, hint: 'Envolvé una palabra con *asteriscos* para destacarla en color.' }),
        ta('subtitle', 'Bajada', { rows: 3 }),
        grp('primaryCta', 'Botón principal', [t('label', 'Texto'), t('href', 'Destino', { hint: '#contacto o un link completo' })]),
        grp('secondaryCta', 'Botón secundario', [t('label', 'Texto'), t('href', 'Destino')])
      ]},
      { title: 'Imagen', fields: [
        img('image', 'Foto principal'),
        t('imageCaption', 'Epígrafe de la foto'),
        ta('stickyNote', 'Papelito', { rows: 2 })
      ]},
      { title: 'Cifras', fields: [
        lst('stats', 'Cifras', [t('value', 'Valor'), t('suffix', 'Sufijo'), t('label', 'Etiqueta')], { addLabel: 'Agregar cifra', max: 4 })
      ]}
    ],
    band: [
      { title: 'Palabras', fields: [lst('words', 'Palabras', [t('label', 'Palabra')], { addLabel: 'Agregar palabra', itemLabel: 'palabra' })] }
    ],
    manifesto: [
      { title: 'Textos', fields: [
        t('eyebrow', 'Antetítulo'),
        ta('title', 'Título', { rows: 2 }),
        ta('text', 'Texto', { rows: 8, hint: 'Separar párrafos con una línea en blanco. **Negrita** y *énfasis*.' }),
        t('signature', 'Firma'),
        t('signatureRole', 'Rol de la firma')
      ]},
      { title: 'Imagen', fields: [img('image', 'Foto')] },
      { title: 'Pilares', fields: [lst('pillars', 'Pilares', [t('k', 'Palabra'), t('v', 'Texto')], { addLabel: 'Agregar pilar' })] }
    ],
    services: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 3 })] },
      { title: 'Servicios', fields: [
        lst('items', 'Tarjetas', [
          sel('icon', 'Ícono', ICON_OPTS),
          t('title', 'Título'),
          ta('text', 'Texto', { rows: 3 }),
          t('detail', 'Detalle'),
          t('priceFrom', 'Desde')
        ], { addLabel: 'Agregar servicio', itemLabel: 'servicio' })
      ]}
    ],
    tabs: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 2 })] },
      { title: 'Pestañas', fields: [
        lst('tabs', 'Pestañas', [
          t('label', 'Nombre de la pestaña'),
          t('kicker', 'Etiqueta de tiempo'),
          t('title', 'Título'),
          ta('text', 'Texto', { rows: 4 }),
          img('image', 'Imagen'),
          lst('checklist', 'Lista', [t('label', 'Ítem')], { addLabel: 'Agregar ítem' }),
          ta('note', 'Nota al pie', { rows: 2 })
        ], { addLabel: 'Agregar pestaña', itemLabel: 'pestaña' })
      ]}
    ],
    principles: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 3 })] },
      { title: 'Principios', fields: [
        lst('items', 'Principios', [t('num', 'Número'), t('title', 'Título'), ta('text', 'Texto', { rows: 3 })], { addLabel: 'Agregar principio', itemLabel: 'principio' })
      ]}
    ],
    process: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 2 })] },
      { title: 'Pasos', fields: [
        lst('steps', 'Pasos', [t('meta', 'Duración'), t('title', 'Título'), ta('text', 'Texto', { rows: 3 })], { addLabel: 'Agregar paso', itemLabel: 'paso' })
      ]}
    ],
    gallery: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 3 })] },
      { title: 'Fotos', fields: [
        lst('items', 'Trabajos', [img('image', 'Después'), img('before', 'Antes (opcional)'), t('caption', 'Título'), t('place', 'Detalle')], { addLabel: 'Agregar trabajo', itemLabel: 'trabajo', hint: 'Si cargás una foto "antes", el bloque muestra el comparador deslizante.' })
      ]},
      { title: 'Pie', fields: [ta('note', 'Nota al pie', { rows: 2 })] }
    ],
    packages: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 3 })] },
      { title: 'Planes', fields: [
        lst('plans', 'Planes', [
          t('name', 'Nombre'),
          t('price', 'Precio'),
          t('unit', 'Aclaración del precio'),
          ta('description', 'Descripción', { rows: 2 }),
          lst('features', 'Incluye', [t('label', 'Ítem')], { addLabel: 'Agregar ítem' }),
          t('ctaLabel', 'Texto del botón'),
          t('href', 'Destino'),
          t('badge', 'Cinta'),
          tog('featured', 'Destacado')
        ], { addLabel: 'Agregar plan', itemLabel: 'plan' })
      ]},
      { title: 'Pie', fields: [ta('note', 'Nota al pie', { rows: 2 })] }
    ],
    quote: [
      { title: 'Frase', fields: [ta('text', 'Texto', { rows: 3 }), t('author', 'Autor'), t('role', 'Rol')] }
    ],
    testimonials: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 2 })] },
      { title: 'Testimonios', fields: [
        lst('items', 'Testimonios', [ta('quote', 'Reseña', { rows: 4 }), t('name', 'Nombre'), t('meta', 'Detalle'), t('rating', 'Estrellas (1 a 5)', { type: 'number', min: 1, max: 5 })], { addLabel: 'Agregar testimonio', itemLabel: 'testimonio' })
      ]}
    ],
    faq: [
      { title: 'Encabezado', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('intro', 'Bajada', { rows: 2 })] },
      { title: 'Preguntas', fields: [
        lst('items', 'Preguntas', [t('q', 'Pregunta'), ta('a', 'Respuesta', { rows: 4 })], { addLabel: 'Agregar pregunta', itemLabel: 'pregunta' })
      ]}
    ],
    cta: [
      { title: 'Textos', fields: [
        t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('text', 'Bajada', { rows: 3 }),
        grp('button', 'Botón principal', [t('label', 'Texto'), t('href', 'Destino', { hint: 'Vacío = WhatsApp del sitio' })]),
        grp('secondary', 'Botón secundario', [t('label', 'Texto'), t('href', 'Destino')])
      ]},
      { title: 'Imagen', fields: [img('image', 'Imagen')] }
    ],
    contact: [
      { title: 'Textos', fields: [t('eyebrow', 'Antetítulo'), ta('title', 'Título', { rows: 2 }), ta('text', 'Bajada', { rows: 3 })] },
      { title: 'Formulario', fields: [
        t('formTitle', 'Título del formulario'),
        t('formNote', 'Aclaración'),
        grp('fields', 'Etiquetas de los campos', [t('name', 'Nombre'), t('phone', 'WhatsApp'), t('space', 'Espacio'), t('message', 'Mensaje')]),
        lst('spaceOptions', 'Opciones de espacio', [t('label', 'Opción')], { addLabel: 'Agregar opción' }),
        t('submitLabel', 'Texto del botón'),
        ta('privacy', 'Aviso de privacidad', { rows: 2 })
      ]}
    ]
  };

  /* ---------- ajustes globales ---------- */
  var SETTINGS = [
    { title: 'Marca', base: 'brand', fields: [
      t('name', 'Nombre'),
      t('tagline', 'Bajada de marca'),
      t('monogram', 'Monograma', { hint: '1 o 2 letras' }),
      img('logoImage', 'Logo (opcional)')
    ]},
    { title: 'Contacto', base: 'settings.contact', fields: [
      t('whatsapp', 'WhatsApp', { hint: 'Solo números, con código de país. Ej: 5491122334455' }),
      ta('whatsappMessage', 'Mensaje inicial de WhatsApp', { rows: 2 }),
      t('phone', 'Teléfono visible'),
      t('email', 'Email'),
      t('city', 'Ciudad / zona'),
      t('hours', 'Horarios'),
      t('instagram', 'Instagram (URL)')
    ]},
    { title: 'Navegación', base: 'settings.nav', fields: [
      t('ctaLabel', 'Texto del botón del menú'),
      t('ctaHref', 'Destino del botón')
    ]},
    { title: 'SEO', base: 'settings.seo', fields: [
      t('title', 'Título de la pestaña'),
      ta('description', 'Descripción para Google', { rows: 3 })
    ]},
    { title: 'Pie de página', base: 'settings.footer', fields: [
      ta('note', 'Texto institucional', { rows: 3 }),
      t('legal', 'Copyright'),
      ta('legalSmall', 'Aclaración legal', { rows: 2 }),
      lst('links', 'Links', [t('label', 'Texto'), t('href', 'Destino')], { addLabel: 'Agregar link' })
    ]}
  ];

  var DESIGN = [
    { title: 'Color', base: 'theme', fields: [
      sel('palette', 'Paleta', [
        { value: 'durazno', label: 'Durazno' },
        { value: 'salvia', label: 'Salvia' },
        { value: 'lavanda', label: 'Lavanda' },
        { value: 'arena', label: 'Arena' },
        { value: 'cielo', label: 'Cielo' },
        { value: 'rosa', label: 'Rosa' }
      ], { swatch: true })
    ]},
    { title: 'Tipografía', base: 'theme', fields: [
      sel('fontPair', 'Combinación', [
        { value: 'fraunces-inter', label: 'Fraunces + Inter (cálida)' },
        { value: 'cormorant-jost', label: 'Cormorant + Jost (clásica)' },
        { value: 'playfair-work', label: 'Playfair + Work Sans (editorial)' },
        { value: 'dmsans', label: 'DM Sans (moderna)' }
      ])
    ]},
    { title: 'Formas', base: 'theme', fields: [
      sel('radius', 'Bordes', [
        { value: 'suave', label: 'Suaves' },
        { value: 'redondo', label: 'Muy redondeados' },
        { value: 'recto', label: 'Rectos' }
      ]),
      sel('pattern', 'Textura', [
        { value: 'enso', label: 'Círculo zen' },
        { value: 'none', label: 'Sin textura' }
      ])
    ]},
    { title: 'Movimiento', base: 'theme', fields: [
      tog('motion', 'Animaciones al scrollear', { hint: 'Apagalas si preferís una página más quieta.' })
    ]}
  ];

  window.KandoSchema = {
    LIBRARY: LIBRARY,
    FORMS: FORMS,
    SETTINGS: SETTINGS,
    DESIGN: DESIGN,
    iconOptions: ICON_OPTS
  };
})();
