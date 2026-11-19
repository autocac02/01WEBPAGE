/* KANDO · comportamiento del sitio.
   Se puede montar muchas veces (la vista previa del editor lo hace en cada cambio).
   Todo queda atado a un AbortController para poder desmontar sin fugas. */
(function () {
  'use strict';

  var Art = window.KandoArt;

  function mount(root, opts) {
    opts = opts || {};
    var doc = root.ownerDocument;
    var win = doc.defaultView || window;
    var ac = new AbortController();
    var on = function (el, ev, fn, o) {
      if (!el) return;
      var cfg = Object.assign({}, o || {}, { signal: ac.signal });
      el.addEventListener(ev, fn, cfg);
    };
    var q = function (sel) { return root.querySelector(sel); };
    var qa = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
    var editing = opts.mode === 'edit';
    var noMotion = !!(opts.reduceMotion || root.getAttribute('data-motion') === '0');

    /* ---- nav ---- */
    var nav = q('[data-nav]');
    var onScrollNav = function () {
      if (!nav) return;
      var y = win.scrollY || win.pageYOffset || 0;
      nav.classList.toggle('is-stuck', y > 24);
    };
    on(win, 'scroll', onScrollNav, { passive: true });
    onScrollNav();

    var burger = q('[data-burger]');
    var mobile = q('[data-nav-mobile]');
    if (burger && mobile) {
      on(burger, 'click', function () {
        var open = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', String(!open));
        mobile.classList.toggle('is-open', !open);
      });
      qa('a').filter(function (a) { return mobile.contains(a); }).forEach(function (a) {
        on(a, 'click', function () {
          burger.setAttribute('aria-expanded', 'false');
          mobile.classList.remove('is-open');
        });
      });
    }

    /* ---- link activo ---- */
    var navLinks = qa('.nav-links a');
    if (navLinks.length && 'IntersectionObserver' in win) {
      var secIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      qa('main > section[id]').forEach(function (s) { secIO.observe(s); });
      ac.signal.addEventListener('abort', function () { secIO.disconnect(); });
    }

    /* ---- revelado ---- */
    var reveals = qa('[data-reveal]');
    if ('IntersectionObserver' in win && !noMotion) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            ro.unobserve(en.target);
          }
        });
      }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach(function (el) { ro.observe(el); });
      ac.signal.addEventListener('abort', function () { ro.disconnect(); });
      // red de seguridad: si algo quedó fuera de vista por un salto, se muestra igual
      win.setTimeout(function () {
        reveals.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < win.innerHeight * 1.15) el.classList.add('is-in');
        });
      }, 900);
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---- contadores ---- */
    var counters = qa('[data-count]');
    var animateCount = function (el) {
      var raw = el.getAttribute('data-count') || '';
      var target = parseFloat(String(raw).replace(/\./g, '').replace(',', '.'));
      if (!isFinite(target)) return;
      var decimals = (String(raw).split(',')[1] || '').length;
      var start = win.performance ? win.performance.now() : Date.now();
      var dur = 1300;
      var tick = function (now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        var val = target * e;
        el.textContent = decimals
          ? val.toFixed(decimals).replace('.', ',')
          : Math.round(val).toLocaleString('es-AR');
        if (t < 1) win.requestAnimationFrame(tick);
        else el.textContent = raw;
      };
      win.requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in win && counters.length && !noMotion) {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); }
        });
      }, { threshold: .6 });
      counters.forEach(function (c) { co.observe(c); });
      ac.signal.addEventListener('abort', function () { co.disconnect(); });
    }

    /* ---- pestañas ---- */
    qa('[data-tabs]').forEach(function (wrap) {
      var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[data-tab]'));
      var panels = Array.prototype.slice.call(wrap.querySelectorAll('[data-panel]'));
      var ink = wrap.querySelector('[data-tab-ink]');

      var moveInk = function () {
        var active = wrap.querySelector('[data-tab][aria-selected="true"]');
        if (!ink || !active) return;
        ink.style.width = active.offsetWidth + 'px';
        ink.style.transform = 'translateX(' + (active.offsetLeft - 5) + 'px)';
      };

      var select = function (i) {
        tabs.forEach(function (t, j) {
          t.setAttribute('aria-selected', String(i === j));
          t.tabIndex = i === j ? 0 : -1;
        });
        panels.forEach(function (p, j) {
          var active = i === j;
          p.classList.toggle('is-active', active);
          if (active) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
        moveInk();
        if (opts.onTab) opts.onTab(wrap, i);
      };

      tabs.forEach(function (t, i) {
        on(t, 'click', function () { select(i); });
        on(t, 'keydown', function (e) {
          var k = e.key;
          if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
          e.preventDefault();
          var next = (i + (k === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          tabs[next].focus();
          select(next);
        });
      });

      win.requestAnimationFrame(function () { moveInk(); });
      on(win, 'resize', moveInk, { passive: true });
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(moveInk).catch(function () {});
      ac.signal.addEventListener('abort', function () {});
    });

    /* ---- acordeón ---- */
    qa('[data-acc]').forEach(function (acc) {
      var items = Array.prototype.slice.call(acc.querySelectorAll('.acc-item'));
      items.forEach(function (item) {
        var btn = item.querySelector('.acc-btn');
        if (!btn) return;
        on(btn, 'click', function () {
          var isOpen = item.classList.contains('is-open');
          items.forEach(function (it) {
            it.classList.remove('is-open');
            var b = it.querySelector('.acc-btn');
            if (b) b.setAttribute('aria-expanded', 'false');
          });
          if (!isOpen) {
            item.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });

    /* ---- comparador antes/después ---- */
    qa('[data-compare]').forEach(function (cmp) {
      var range = cmp.querySelector('.cmp-range');
      if (!range) return;
      var apply = function () { cmp.style.setProperty('--pos', range.value + '%'); };
      on(range, 'input', apply);
      apply();
    });

    /* ---- lightbox ---- */
    var lb = doc.querySelector('[data-lightbox-root]');
    if (!lb) {
      lb = doc.createElement('div');
      lb.className = 'lightbox';
      lb.setAttribute('data-lightbox-root', '');
      lb.innerHTML = '<div class="lightbox-inner" data-lb-inner></div>' +
        '<button class="lightbox-close" type="button" aria-label="Cerrar">✕</button>';
      doc.body.appendChild(lb);
    }
    var lbInner = lb.querySelector('[data-lb-inner]');
    var closeLb = function () {
      lb.classList.remove('is-open');
      doc.body.classList.remove('is-locked');
    };
    on(lb, 'click', function (e) {
      if (e.target === lb || e.target.closest('.lightbox-close')) closeLb();
    });
    on(doc, 'keydown', function (e) { if (e.key === 'Escape') closeLb(); });
    qa('[data-lightbox]').forEach(function (btn) {
      on(btn, 'click', function () {
        var src = btn.getAttribute('data-lightbox');
        lbInner.innerHTML = Art.image(src, 'Imagen ampliada');
        lb.classList.add('is-open');
        doc.body.classList.add('is-locked');
      });
    });

    /* ---- formulario → whatsapp ---- */
    qa('[data-contact-form]').forEach(function (form) {
      on(form, 'submit', function (e) {
        e.preventDefault();
        var data = new FormData(form);
        var name = String(data.get('name') || '').trim();
        var phone = String(data.get('phone') || '').trim();
        var space = String(data.get('space') || '').trim();
        var msg = String(data.get('message') || '').trim();
        if (!name || !phone) {
          var first = form.querySelector('input');
          if (first) first.focus();
          return;
        }
        var wa = (form.getAttribute('data-wa') || '').replace(/\D/g, '');
        var text = 'Hola! Soy ' + name + '. Me interesa ordenar: ' + space + '.' +
          (msg ? '\n' + msg : '') + '\nMi WhatsApp: ' + phone;
        var url = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(text);
        if (editing) {
          win.parent.postMessage({ type: 'kando:toast', text: 'En el sitio publicado esto abre WhatsApp.' }, '*');
          return;
        }
        win.open(url, '_blank', 'noopener');
      });
    });

    /* ---- spotlight + parallax del hero ---- */
    var hero = q('.sec-hero');
    var spot = q('[data-spot]');
    var fine = win.matchMedia && win.matchMedia('(pointer:fine)').matches;
    if (hero && spot && fine && !noMotion) {
      var raf = null;
      on(hero, 'pointermove', function (e) {
        if (raf) return;
        raf = win.requestAnimationFrame(function () {
          var r = hero.getBoundingClientRect();
          spot.style.transform = 'translate(' + (e.clientX - r.left) + 'px,' + (e.clientY - r.top) + 'px) translate(-50%,-50%)';
          raf = null;
        });
      });
    }

    var heroInner = q('.hero-media .frame-inner');
    if (heroInner && !noMotion) {
      var ticking = false;
      on(win, 'scroll', function () {
        if (ticking) return;
        ticking = true;
        win.requestAnimationFrame(function () {
          var y = win.scrollY || 0;
          if (y < win.innerHeight * 1.2) {
            heroInner.style.transform = 'translate3d(0,' + (y * 0.055) + 'px,0) scale(1.06)';
          }
          ticking = false;
        });
      }, { passive: true });
    }

    /* ---- año del footer / datos dinámicos ---- */
    qa('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

    return function destroy() {
      try { ac.abort(); } catch (e) {}
    };
  }

  var FONT_LINKS = {
    'fraunces-inter': 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Inter:wght@300..600&display=swap',
    'cormorant-jost': 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..600;1,300..600&family=Jost:wght@300..500&display=swap',
    'playfair-work': 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..600;1,400..600&family=Work+Sans:wght@300..500&display=swap',
    'dmsans': 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..600&display=swap'
  };

  function applyTheme(root) {
    if (!root) return;
    var doc = root.ownerDocument;
    var pair = root.getAttribute('data-font') || 'fraunces-inter';
    var href = FONT_LINKS[pair];
    if (!href) return;
    var link = doc.querySelector('link[data-font-pair]');
    if (!link) {
      link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-font-pair', '');
      doc.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }

  window.KandoApp = { mount: mount, applyTheme: applyTheme, fonts: FONT_LINKS };
})();
