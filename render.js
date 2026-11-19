/* KANDO · plantillas.
   Convierte el objeto de contenido en HTML. Lo usan la landing y la vista previa del editor.
   Cada texto editable queda anotado con data-field (ruta dentro del bloque). */
(function () {
  'use strict';

  var Art = window.KandoArt;

  /* ---------- utilidades ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Formato mínimo: **negrita**, *énfasis*, saltos de línea, [texto](url) */
  function fmt(s) {
    var out = esc(s);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    out = out.replace(/\n/g, '<br>');
    return out;
  }

  function F(path, value, tag, cls, fmtOn) {
    var c = cls ? ' class="' + cls + '"' : '';
    var f = fmtOn === false ? ' data-plain="1"' : '';
    return '<' + tag + c + ' data-field="' + esc(path) + '"' + f + '>' + (fmtOn === false ? esc(value) : fmt(value)) + '</' + tag + '>';
  }

  function img(src, alt, cls) {
    return Art.image(src, alt, cls || '');
  }

  function anchor(label, href, cls) {
    var h = href || '#contacto';
    return '<a class="' + (cls || 'btn btn-primary') + '" href="' + esc(h) + '">' + fmt(label) + '</a>';
  }

  function isOut(href) { return /^https?:/i.test(href || ''); }

  function linkAttrs(href) {
    return isOut(href) ? ' target="_blank" rel="noopener"' : '';
  }

  /* ---------- iconos ---------- */
  var ICONS = {
    hanger: '<path d="M12 7a2.6 2.6 0 1 1 3.4 2.5c-1 .3-1.4 1-1.4 2v.6"/><path d="M12 12.1 3.9 17c-1.2.8-.7 2.6.8 2.6h14.6c1.5 0 2-1.8.8-2.6L12 12.1Z"/>',
    fold: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 3v18M16 3v18" opacity=".45"/>',
    jar: '<path d="M8 8h8M9 4h6v2H9z"/><path d="M8 8v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8"/>',
    spark: '<path d="M12 3v18M3 12h18"/><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" opacity=".45"/>',
    leaf: '<path d="M20 4c0 9-5 14-12 14H5c0-8 5-13 12-13h3Z"/><path d="M5 20c1-6 5-10 11-11"/>',
    check: '<path d="m4 12.5 5 5L20 6.5"/>',
    arrow: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    whatsapp: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z"/><path d="M8.8 8.4c-.3.7-.2 1.8.6 2.9.9 1.2 2 1.8 2.7 1.9.6.1 1.2 0 1.5-.5.2-.4.3-.9.1-1l-1.5-.8-.7.6c-.6-.2-1.3-.9-1.6-1.5l.6-.7-.8-1.4c-.2-.2-.7 0-.9.5Z"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };

  function icon(name, cls) {
    var d = ICONS[name] || ICONS.spark;
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  /* ---------- navegación ---------- */
  var NAV_LABELS = {
    manifiesto: 'La calma',
    servicios: 'Servicios',
    ambientes: 'Ambientes',
    metodo: 'Método',
    proceso: 'Cómo trabajamos',
    galeria: 'Antes y después',
    planes: 'Planes',
    testimonios: 'Testimonios',
    preguntas: 'Preguntas',
    contacto: 'Contacto'
  };
  var NAV_ORDER = ['manifiesto', 'servicios', 'ambientes', 'galeria', 'planes', 'preguntas', 'proceso', 'metodo', 'contacto'];

  function nav(c) {
    var brand = c.brand || {};
    var links = [];
    NAV_ORDER.forEach(function (key) {
      var b = (c.sections || []).filter(function (s) { return s.id === key && s.visible !== false; })[0];
      if (b && NAV_LABELS[key]) links.push({ id: key, label: NAV_LABELS[key] });
    });
    links = links.slice(0, 5);
    var cta = (c.settings && c.settings.nav) || {};
    var logo = brand.logoImage
      ? '<span class="brand-logo"><img src="' + esc(brand.logoImage) + '" alt="' + esc(brand.name) + '"></span>'
      : '<span class="brand-mark">' + esc((brand.monogram || 'K').slice(0, 2)) + '</span>';

    return '' +
      '<header class="nav" data-nav>' +
        '<div class="wrap nav-in">' +
          '<a class="brand" href="#top" aria-label="' + esc(brand.name) + '">' + logo +
            '<span class="brand-txt"><b>' + esc(brand.name) + '</b><i>' + esc(brand.tagline) + '</i></span>' +
          '</a>' +
          '<nav class="nav-links" aria-label="Secciones">' +
            links.map(function (l) { return '<a href="#' + l.id + '">' + esc(l.label) + '</a>'; }).join('') +
          '</nav>' +
          '<div class="nav-actions">' +
            '<a class="btn btn-primary btn-sm" href="' + esc(cta.ctaHref || '#contacto') + '">' + esc(cta.ctaLabel || 'Escribinos') + '</a>' +
            '<button class="burger" type="button" aria-label="Abrir menú" aria-expanded="false" data-burger><span></span><span></span></button>' +
          '</div>' +
        '</div>' +
        '<div class="nav-mobile" data-nav-mobile>' +
          links.map(function (l) { return '<a href="#' + l.id + '">' + esc(l.label) + '</a>'; }).join('') +
          '<a class="btn btn-primary" href="' + esc(cta.ctaHref || '#contacto') + '">' + esc(cta.ctaLabel || 'Escribinos') + '</a>' +
        '</div>' +
      '</header>';
  }

  /* ---------- bloques ---------- */

  function hero(b, c) {
    var stats = b.stats || [];
    return '' +
      '<section class="sec sec-hero" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="hero">' +
        '<div class="hero-decor" aria-hidden="true">' +
          '<span class="blob blob-1"></span><span class="blob blob-2"></span><span class="blob blob-3"></span>' +
          '<span class="ring ring-1"></span><span class="ring ring-2"></span>' +
          '<span class="hero-spot" data-spot></span>' +
        '</div>' +
        '<div class="wrap hero-grid">' +
          '<div class="hero-copy">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h1 class="display" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h1>' +
            '<p class="lead" data-reveal data-delay="2">' + F('subtitle', b.subtitle, 'span') + '</p>' +
            '<div class="hero-actions" data-reveal data-delay="3">' +
              '<a class="btn btn-primary btn-lg" href="' + esc((b.primaryCta || {}).href || '#contacto') + '">' +
                '<span>' + fmt((b.primaryCta || {}).label || 'Empezar') + '</span>' + icon('arrow') + '</a>' +
              '<a class="btn btn-ghost btn-lg" href="' + esc((b.secondaryCta || {}).href || '#proceso') + '">' +
                fmt((b.secondaryCta || {}).label || 'Ver más') + '</a>' +
            '</div>' +
            (stats.length ?
            '<ul class="hero-stats" data-reveal data-delay="4">' + stats.map(function (s, i) {
              return '<li><b data-count="' + esc(s.value) + '">' + esc(s.value) + '</b><i>' + esc(String(s.suffix || '').trim()) + '</i><span>' + esc(s.label) + '</span></li>';
            }).join('') + '</ul>' : '') +
          '</div>' +
          '<div class="hero-media" data-reveal data-delay="2">' +
            '<figure class="hero-frame">' +
              '<div class="frame-inner">' + img(b.image, b.imageCaption || 'Espacio ordenado') + '</div>' +
              (b.imageCaption ? '<figcaption>' + esc(b.imageCaption) + '</figcaption>' : '') +
            '</figure>' +
            (b.stickyNote ? '<div class="sticky-note"><span>' + fmt(b.stickyNote) + '</span></div>' : '') +
            '<div class="hero-badge"><span class="dot"></span> Agenda abierta</div>' +
          '</div>' +
        '</div>' +
        '<a class="scroll-cue" href="#' + esc(((c.sections || [])[1] || {}).id || 'manifiesto') + '" aria-label="Bajar">' +
          '<span>Deslizá</span><i></i></a>' +
      '</section>';
  }

  function band(b) {
    var words = (b.words && b.words.length ? b.words : ['orden', 'calma']);
    var row = words.map(function (w) {
      return '<span>' + esc(w) + '</span><i aria-hidden="true">✦</i>';
    }).join('');
    return '' +
      '<section class="sec sec-band" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="band" aria-hidden="true">' +
        '<div class="marquee"><div class="marquee-track">' + row + row + '</div></div>' +
      '</section>';
  }

  function manifesto(b) {
    var paras = String(b.text || '').split(/\n{2,}/).filter(Boolean);
    return '' +
      '<section class="sec sec-manifesto" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="manifesto">' +
        '<div class="wrap split">' +
          '<div class="split-media" data-reveal>' +
            '<div class="media-frame media-tall">' + img(b.image, 'Detalle de un espacio ordenado') + '</div>' +
            '<span class="media-accent" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="split-copy">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<div class="prose" data-field="text" data-reveal data-delay="2">' +
              paras.map(function (p) {
                return '<p>' + fmt(p) + '</p>';
              }).join('') +
            '</div>' +
            ((b.pillars || []).length ?
            '<ul class="pillars" data-reveal data-delay="3">' + b.pillars.map(function (p) {
              return '<li><b>' + esc(p.k) + '</b><span>' + esc(p.v) + '</span></li>';
            }).join('') + '</ul>' : '') +
            ((b.signature) ?
            '<div class="signature" data-reveal data-delay="4">' +
              '<span class="sig-line" aria-hidden="true"></span>' +
              '<div><b>' + esc(b.signature) + '</b><i>' + esc(b.signatureRole) + '</i></div>' +
            '</div>' : '') +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function services(b) {
    var items = b.items || [];
    return '' +
      '<section class="sec sec-services" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="services">' +
        '<div class="wrap">' +
          '<header class="sec-head">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
          '</header>' +
          '<div class="cards-3">' + items.map(function (it, i) {
            return '<article class="card card-service" data-reveal data-delay="' + (i + 1) + '" data-item="items.' + i + '">' +
              '<span class="card-ico">' + icon(it.icon || 'spark') + '</span>' +
              '<h3 class="h3">' + F('items.' + i + '.title', it.title, 'span') + '</h3>' +
              '<p>' + F('items.' + i + '.text', it.text, 'span') + '</p>' +
              '<p class="card-detail">' + icon('check') + '<span>' + F('items.' + i + '.detail', it.detail, 'span', '', false) + '</span></p>' +
              '<footer class="card-foot"><span class="price-tag">' + F('items.' + i + '.priceFrom', it.priceFrom, 'span', '', false) + '</span>' +
              '<a class="mini-link" href="#contacto">Consultar' + icon('arrow') + '</a></footer>' +
            '</article>';
          }).join('') + '</div>' +
        '</div>' +
      '</section>';
  }

  function tabs(b) {
    var items = b.tabs || [];
    return '' +
      '<section class="sec sec-tabs" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="tabs">' +
        '<div class="wrap">' +
          '<header class="sec-head">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
          '</header>' +
          '<div class="tabs" data-tabs>' +
            '<div class="tablist" role="tablist" aria-label="Ambientes">' +
              items.map(function (t, i) {
                return '<button class="tab" role="tab" type="button" id="tab-' + esc(b.id) + '-' + i + '" ' +
                  'aria-controls="panel-' + esc(b.id) + '-' + i + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '" ' +
                  'tabindex="' + (i === 0 ? '0' : '-1') + '" data-tab="' + i + '">' + esc(t.label) + '</button>';
              }).join('') +
              '<span class="tab-ink" data-tab-ink aria-hidden="true"></span>' +
            '</div>' +
            '<div class="tabpanels">' + items.map(function (t, i) {
              return '<div class="tabpanel' + (i === 0 ? ' is-active' : '') + '" role="tabpanel" id="panel-' + esc(b.id) + '-' + i + '" ' +
                'aria-labelledby="tab-' + esc(b.id) + '-' + i + '" data-panel="' + i + '"' + (i === 0 ? '' : ' hidden') + '>' +
                '<div class="tab-media"><div class="media-frame media-tab">' + img(t.image, t.title) + '</div>' +
                  '<span class="tab-kicker">' + icon('clock') + '<span>' + F('tabs.' + i + '.kicker', t.kicker, 'span', '', false) + '</span></span>' +
                '</div>' +
                '<div class="tab-copy">' +
                  '<h3 class="h3">' + F('tabs.' + i + '.title', t.title, 'span') + '</h3>' +
                  '<p>' + F('tabs.' + i + '.text', t.text, 'span') + '</p>' +
                  '<ul class="checks">' + (t.checklist || []).map(function (li, j) {
                    return '<li>' + icon('check') + '<span>' + (j === 0 ? F('tabs.' + i + '.checklist.' + j, li, 'span', '', false) : esc(li)) + '</span></li>';
                  }).join('') + '</ul>' +
                  '<p class="note">' + F('tabs.' + i + '.note', t.note, 'span') + '</p>' +
                '</div>' +
              '</div>';
            }).join('') + '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function principles(b) {
    var items = b.items || [];
    return '' +
      '<section class="sec sec-principles" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="principles">' +
        '<div class="wrap">' +
          '<header class="sec-head sec-head-wide">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
          '</header>' +
          '<ol class="principles">' + items.map(function (p, i) {
            return '<li class="principle" data-reveal data-delay="' + (i % 3 + 1) + '">' +
              '<span class="p-num" aria-hidden="true">' + esc(p.num || ('0' + (i + 1))) + '</span>' +
              '<h3 class="h4">' + F('items.' + i + '.title', p.title, 'span') + '</h3>' +
              '<p>' + F('items.' + i + '.text', p.text, 'span') + '</p>' +
            '</li>';
          }).join('') + '</ol>' +
        '</div>' +
      '</section>';
  }

  function process(b) {
    var steps = b.steps || [];
    return '' +
      '<section class="sec sec-process" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="process">' +
        '<div class="wrap">' +
          '<header class="sec-head">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
          '</header>' +
          '<ol class="steps">' + steps.map(function (s, i) {
            return '<li class="step" data-reveal data-delay="' + (i + 1) + '">' +
              '<span class="step-dot" aria-hidden="true">' + (i + 1) + '</span>' +
              '<span class="step-meta">' + F('steps.' + i + '.meta', s.meta, 'span', '', false) + '</span>' +
              '<h3 class="h4">' + F('steps.' + i + '.title', s.title, 'span') + '</h3>' +
              '<p>' + F('steps.' + i + '.text', s.text, 'span') + '</p>' +
            '</li>';
          }).join('') + '</ol>' +
        '</div>' +
      '</section>';
  }

  function gallery(b) {
    var items = b.items || [];
    return '' +
      '<section class="sec sec-gallery" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="gallery">' +
        '<div class="wrap">' +
          '<header class="sec-head sec-head-row">' +
            '<div>' +
              '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
              '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '</div>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
          '</header>' +
          '<div class="gallery-grid">' + items.map(function (g, i) {
            var hasBefore = g.before && String(g.before).trim();
            if (hasBefore) {
              return '<figure class="gal gal-wide" data-reveal data-item="items.' + i + '">' +
                '<div class="compare" data-compare style="--pos:56%">' +
                  '<div class="cmp-layer cmp-before">' + img(g.before, 'Antes: ' + g.caption) + '</div>' +
                  '<div class="cmp-layer cmp-after">' + img(g.image, 'Después: ' + g.caption) + '</div>' +
                  '<span class="cmp-tag cmp-tag-b">Antes</span><span class="cmp-tag cmp-tag-a">Después</span>' +
                  '<span class="cmp-handle" aria-hidden="true"><i></i></span>' +
                  '<input class="cmp-range" type="range" min="0" max="100" value="56" aria-label="Comparar antes y después: ' + esc(g.caption) + '">' +
                '</div>' +
                '<figcaption><b>' + F('items.' + i + '.caption', g.caption, 'span', '', false) + '</b>' +
                  '<span>' + F('items.' + i + '.place', g.place, 'span', '', false) + '</span></figcaption>' +
              '</figure>';
            }
            return '<figure class="gal" data-reveal data-gallery-item data-item="items.' + i + '">' +
              '<button class="gal-btn" type="button" data-lightbox="' + esc(g.image) + '" aria-label="Ampliar: ' + esc(g.caption) + '">' +
                '<span class="gal-media">' + img(g.image, g.caption) + '</span>' +
                '<span class="gal-zoom" aria-hidden="true">' + icon('plus') + '</span>' +
              '</button>' +
              '<figcaption><b>' + F('items.' + i + '.caption', g.caption, 'span', '', false) + '</b>' +
                '<span>' + F('items.' + i + '.place', g.place, 'span', '', false) + '</span></figcaption>' +
            '</figure>';
            }).join('') +
          '</div>' +
          (b.note ? '<p class="sec-foot" data-reveal>' + F('note', b.note, 'span') + '</p>' : '') +
        '</div>' +
      '</section>';
  }

  function packages(b) {
    var plans = b.plans || [];
    return '' +
      '<section class="sec sec-packages" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="packages">' +
        '<div class="wrap">' +
          '<header class="sec-head">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
          '</header>' +
          '<div class="plans">' + plans.map(function (p, i) {
            return '<article class="plan' + (p.featured ? ' is-featured' : '') + '" data-reveal data-delay="' + (i + 1) + '" data-item="plans.' + i + '">' +
              (p.featured && p.badge ? '<span class="plan-badge">' + esc(p.badge) + '</span>' : '') +
              '<h3 class="plan-name">' + F('plans.' + i + '.name', p.name, 'span') + '</h3>' +
              '<p class="plan-desc">' + F('plans.' + i + '.description', p.description, 'span') + '</p>' +
              '<p class="plan-price"><b>' + F('plans.' + i + '.price', p.price, 'span', '', false) + '</b><i>' + F('plans.' + i + '.unit', p.unit, 'span', '', false) + '</i></p>' +
              '<ul class="plan-features">' + (p.features || []).map(function (f, j) {
                return '<li>' + icon('check') + '<span' + (j === 0 ? ' data-field="plans.' + i + '.features.' + j + '" data-plain="1"' : '') + '>' + esc(f) + '</span></li>';
              }).join('') + '</ul>' +
              '<a class="btn ' + (p.featured ? 'btn-primary' : 'btn-outline') + ' btn-block" href="' + esc(p.href || '#contacto') + '">' +
                esc(p.ctaLabel || 'Elegir') + icon('arrow') + '</a>' +
            '</article>';
          }).join('') + '</div>' +
          (b.note ? '<p class="sec-foot" data-reveal>' + F('note', b.note, 'span') + '</p>' : '') +
        '</div>' +
      '</section>';
  }

  function quote(b) {
    return '' +
      '<section class="sec sec-quote" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="quote">' +
        '<div class="wrap quote-in" data-reveal>' +
          '<span class="quote-mark" aria-hidden="true">”</span>' +
          '<blockquote>' + F('text', b.text, 'span') + '</blockquote>' +
          '<footer><b>' + F('author', b.author, 'span', '', false) + '</b><span>' + F('role', b.role, 'span', '', false) + '</span></footer>' +
        '</div>' +
      '</section>';
  }

  function testimonials(b) {
    var items = b.items || [];
    return '' +
      '<section class="sec sec-testimonials" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="testimonials">' +
        '<div class="wrap">' +
          '<header class="sec-head">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
          '</header>' +
          '<div class="cards-3 quotes">' + items.map(function (q, i) {
            var stars = '';
            for (var s = 0; s < (q.rating || 5); s++) stars += icon('star', 'star');
            return '<figure class="card quote-card" data-reveal data-delay="' + (i + 1) + '" data-item="items.' + i + '">' +
              '<div class="stars" aria-label="' + (q.rating || 5) + ' de 5">' + stars + '</div>' +
              '<blockquote>' + F('items.' + i + '.quote', q.quote, 'span') + '</blockquote>' +
              '<figcaption><b>' + F('items.' + i + '.name', q.name, 'span', '', false) + '</b><span>' + F('items.' + i + '.meta', q.meta, 'span', '', false) + '</span></figcaption>' +
            '</figure>';
          }).join('') + '</div>' +
        '</div>' +
      '</section>';
  }

  function faq(b) {
    var items = b.items || [];
    return '' +
      '<section class="sec sec-faq" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="faq">' +
        '<div class="wrap split split-faq">' +
          '<div class="faq-head">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="sec-intro" data-reveal data-delay="2">' + F('intro', b.intro, 'span') + '</p>' +
            '<a class="btn btn-outline" href="#contacto" data-reveal data-delay="3">Hacer mi pregunta' + icon('arrow') + '</a>' +
          '</div>' +
          '<div class="acc" data-acc>' + items.map(function (q, i) {
            return '<div class="acc-item" data-reveal data-delay="' + (i % 3 + 1) + '" data-item="items.' + i + '">' +
              '<button class="acc-btn" type="button" aria-expanded="false" aria-controls="acc-' + esc(b.id) + '-' + i + '">' +
                '<span data-field="items.' + i + '.q" data-plain="1">' + esc(q.q) + '</span>' + icon('plus', 'acc-ico') +
              '</button>' +
              '<div class="acc-panel" id="acc-' + esc(b.id) + '-' + i + '" role="region">' +
                '<div class="acc-inner"><p data-field="items.' + i + '.a">' + fmt(q.a) + '</p></div>' +
              '</div>' +
            '</div>';
          }).join('') + '</div>' +
        '</div>' +
      '</section>';
  }

  function cta(b, c) {
    var wa = (c.settings && c.settings.contact) || {};
    var href = b.button && b.button.href ? b.button.href : waLink(wa);
    return '' +
      '<section class="sec sec-cta" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="cta">' +
        '<div class="wrap">' +
          '<div class="cta-panel" data-reveal>' +
            '<div class="cta-copy">' +
              '<p class="eyebrow">' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
              '<h2 class="h2">' + F('title', b.title, 'span') + '</h2>' +
              '<p class="lead">' + F('text', b.text, 'span') + '</p>' +
              '<div class="hero-actions">' +
                '<a class="btn btn-primary btn-lg" href="' + esc(href) + '"' + linkAttrs(href) + '>' + icon('whatsapp') + '<span>' + esc((b.button || {}).label || 'Escribir') + '</span></a>' +
                ((b.secondary || {}).label ? '<a class="btn btn-ghost btn-lg" href="' + esc(b.secondary.href || '#contacto') + '">' + esc(b.secondary.label) + '</a>' : '') +
              '</div>' +
            '</div>' +
            '<div class="cta-media">' + img(b.image, 'Espacio en calma') + '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function waLink(contact) {
    var phone = String((contact && contact.whatsapp) || '').replace(/[^\d]/g, '');
    var msg = (contact && contact.whatsappMessage) || 'Hola! Quiero ordenar un espacio de mi casa.';
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
  }

  function contact(b, c) {
    var ct = (c.settings && c.settings.contact) || {};
    var f = b.fields || {};
    var opts = b.spaceOptions || [];
    return '' +
      '<section class="sec sec-contact" id="' + esc(b.id) + '" data-block="' + esc(b.id) + '" data-type="contact">' +
        '<div class="wrap contact-grid">' +
          '<div class="contact-copy">' +
            '<p class="eyebrow" data-reveal>' + F('eyebrow', b.eyebrow, 'span') + '</p>' +
            '<h2 class="h2" data-reveal data-delay="1">' + F('title', b.title, 'span') + '</h2>' +
            '<p class="lead" data-reveal data-delay="2">' + F('text', b.text, 'span') + '</p>' +
            '<ul class="contact-list" data-reveal data-delay="3">' +
              '<li>' + icon('whatsapp') + '<a href="' + esc(waLink(ct)) + '" target="_blank" rel="noopener">' + esc(ct.phone || '') + '</a></li>' +
              '<li>' + icon('mail') + '<a href="mailto:' + esc(ct.email || '') + '">' + esc(ct.email || '') + '</a></li>' +
              '<li>' + icon('instagram') + '<a href="' + esc(ct.instagram || '#') + '" target="_blank" rel="noopener">Instagram</a></li>' +
              '<li>' + icon('pin') + '<span>' + esc(ct.city || '') + '</span></li>' +
              '<li>' + icon('clock') + '<span>' + esc(ct.hours || '') + '</span></li>' +
            '</ul>' +
          '</div>' +
          '<div class="contact-card" data-reveal data-delay="2">' +
            '<h3 class="h3">' + esc(b.formTitle || 'Escribinos') + '</h3>' +
            '<p class="contact-note">' + esc(b.formNote || '') + '</p>' +
            '<form class="form" data-contact-form data-wa="' + esc((ct.whatsapp || '').replace(/[^\d]/g, '')) + '">' +
              '<label class="field"><span>' + esc(f.name || 'Nombre') + '</span>' +
                '<input type="text" name="name" autocomplete="name" required placeholder="Cómo te llamás"></label>' +
              '<label class="field"><span>' + esc(f.phone || 'WhatsApp') + '</span>' +
                '<input type="tel" name="phone" autocomplete="tel" required placeholder="11 5555 5555"></label>' +
              '<label class="field"><span>' + esc(f.space || 'Espacio') + '</span>' +
                '<span class="select-wrap"><select name="space">' +
                  opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') +
                '</select></span></label>' +
              '<label class="field"><span>' + esc(f.message || 'Mensaje') + '</span>' +
                '<textarea name="message" rows="3" placeholder="Contame qué te molesta del espacio"></textarea></label>' +
              '<button class="btn btn-primary btn-block btn-lg" type="submit">' + esc(b.submitLabel || 'Enviar') + icon('whatsapp') + '</button>' +
              '<p class="form-privacy">' + esc(b.privacy || '') + '</p>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function footer(c) {
    var brand = c.brand || {};
    var ft = (c.settings && c.settings.footer) || {};
    var ct = (c.settings && c.settings.contact) || {};
    return '' +
      '<footer class="foot" data-footer>' +
        '<div class="wrap foot-grid">' +
          '<div class="foot-brand">' +
            '<a class="brand" href="#top">' +
              '<span class="brand-mark">' + esc((brand.monogram || 'K').slice(0, 2)) + '</span>' +
              '<span class="brand-txt"><b>' + esc(brand.name) + '</b><i>' + esc(brand.tagline) + '</i></span>' +
            '</a>' +
            '<p>' + esc(ft.note || '') + '</p>' +
            '<div class="foot-social">' +
              '<a href="' + esc(ct.instagram || '#') + '" target="_blank" rel="noopener" aria-label="Instagram">' + icon('instagram') + '</a>' +
              '<a href="' + esc(waLink(ct)) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon('whatsapp') + '</a>' +
              '<a href="mailto:' + esc(ct.email || '') + '" aria-label="Email">' + icon('mail') + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="foot-cols">' +
            '<div><h4>Secciones</h4><ul>' +
              NAV_ORDER.slice(0, 6).map(function (k) {
                var b = (c.sections || []).filter(function (s) { return s.id === k && s.visible !== false; })[0];
                return b ? '<li><a href="#' + k + '">' + esc(NAV_LABELS[k] || k) + '</a></li>' : '';
              }).join('') +
            '</ul></div>' +
            '<div><h4>Contacto</h4><ul>' +
              '<li><a href="' + esc(waLink(ct)) + '" target="_blank" rel="noopener">' + esc(ct.phone || '') + '</a></li>' +
              '<li><a href="mailto:' + esc(ct.email || '') + '">' + esc(ct.email || '') + '</a></li>' +
              '<li><span>' + esc(ct.city || '') + '</span></li>' +
            '</ul></div>' +
            '<div><h4>Legales</h4><ul>' +
              (ft.links || []).map(function (l) {
                return '<li><a href="' + esc(l.href) + '"' + linkAttrs(l.href) + '>' + esc(l.label) + '</a></li>';
              }).join('') +
            '</ul></div>' +
          '</div>' +
        '</div>' +
        '<div class="wrap foot-bottom">' +
          '<p>' + esc(ft.legal || '') + '</p>' +
          '<p class="foot-small">' + esc(ft.legalSmall || '') + '</p>' +
        '</div>' +
      '</footer>' +
      '<a class="wa-float" href="' + esc(waLink(ct)) + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">' +
        icon('whatsapp') + '<span>Escribinos</span></a>';
  }

  /* ---------- página ---------- */

  var BLOCKS = {
    hero: hero,
    band: band,
    manifesto: manifesto,
    services: services,
    tabs: tabs,
    principles: principles,
    process: process,
    gallery: gallery,
    packages: packages,
    quote: quote,
    testimonials: testimonials,
    faq: faq,
    cta: cta,
    contact: contact
  };

  function block(b, c) {
    if (!b || b.visible === false) return '';
    var fn = BLOCKS[b.type];
    if (!fn) return '';
    return fn(b, c);
  }

  function body(c) {
    return (c.sections || []).map(function (b) { return block(b, c); }).join('');
  }

  function page(c) {
    var t = c.theme || {};
    return '<div class="page" data-page data-palette="' + esc(t.palette || 'durazno') + '" data-font="' + esc(t.fontPair || 'fraunces-inter') + '" data-radius="' + esc(t.radius || 'suave') + '" data-pattern="' + esc(t.pattern || 'enso') + '" data-motion="' + (t.motion === false ? '0' : '1') + '">' +
      nav(c) + '<main id="top">' + body(c) + '</main>' + footer(c) + '</div>';
  }

  var API = { page: page, body: body, block: block, fmt: fmt, esc: esc, icon: icon, waLink: waLink, NAV_LABELS: NAV_LABELS };
  if (typeof window !== 'undefined') window.KandoRender = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
