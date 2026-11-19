/* KANDO · editor del sitio.
   Un solo archivo, sin dependencias. Flujo: login → cargar borrador → editar en el lienzo
   → guardar → publicar. Funciona contra la API de /api (Vercel) o en modo local. */
(function () {
  'use strict';

  var S = window.KandoSchema;
  var Art = window.KandoArt;

  /* =========================================================
     0 · utilidades
     ========================================================= */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function uid(prefix) {
    return (prefix || 'b') + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function getPath(obj, path) {
    if (!path) return obj;
    var parts = String(path).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function setPath(obj, path, val) {
    var parts = String(path).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (cur[k] == null || typeof cur[k] !== 'object') {
        cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      }
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = val;
    return obj;
  }

  var ICONS = {
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    copy: 'M9 9h10v10H9zM5 15V5h10',
    gear: 'M4 8h8M16 8h4M4 16h4M12 16h8M14 6v4M10 14v4',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z',
    eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.2 4.3M6.1 6.1A17 17 0 0 0 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 4-.8',
    trash: 'M4 7h16M9.5 7V5h5v2M6 7l1 13h10l1-13',
    plus: 'M12 5v14M5 12h14',
    close: 'M6 6l12 12M18 6 6 18',
    check: 'm4 12 5 5L20 6',
    image: 'M4 5h16v14H4z M4 15.5l4.5-4.5 4 4 2.5-2.5 5 5 M15 9.5a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z',
    link: 'M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2-2a4.5 4.5 0 0 0-6.4-6.4l-1 1M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2 2a4.5 4.5 0 0 0 6.4 6.4l1-1'
  };

  function icon(name, size) {
    var d = ICONS[name] || '';
    return '<svg class="ic" viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }

  /* =========================================================
     1 · estado
     ========================================================= */
  var st = {
    server: false,
    status: null,
    token: '',
    content: null,
    savedJson: '',
    sel: { id: null, field: null },
    device: 'desktop',
    mode: 'edit',
    tab: 'secciones',
    gateMode: 'login',
    mq: null,
    ready: false
  };

  function fitCanvas() {
    if (!els.canvasScroll || !els.deviceFit || !els.device) return;
    var availW = els.canvasScroll.clientWidth - (st.mode === 'preview' ? 0 : 44);
    var availH = els.canvasScroll.clientHeight - (st.mode === 'preview' ? 0 : 22);
    if (availW < 120 || availH < 200) return;

    var target = st.mode === 'preview' ? Math.round(availW)
      : st.device === 'mobile' ? 390
      : st.device === 'tablet' ? 834
      : 1440;

    var scale = st.mode === 'preview' ? 1 : Math.min(1, availW / target);
    var h = Math.min(1150, Math.round(availH / scale));

    els.device.style.width = target + 'px';
    els.device.style.height = h + 'px';
    els.device.style.transform = 'scale(' + scale + ')';
    els.deviceFit.style.width = Math.round(target * scale) + 'px';
    els.deviceFit.style.height = Math.round(h * scale) + 'px';
  }

  var els = {};
  var frameDoc = null;
  var frameWin = null;
  var toolsEl = null;
  var editing = null;
  var renderTimer = null;
  var histTimer = null;
  var localTimer = null;
  var hStack = [];
  var hIndex = -1;

  /* =========================================================
     2 · API
     ========================================================= */
  function req(method, url, body) {
    var headers = { 'Content-Type': 'application/json' };
    if (st.token) headers.Authorization = 'Bearer ' + st.token;
    return fetch(url, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    }).then(function (r) {
      return r.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
        if (!r.ok) {
          var msg = (data && (data.error || data.message)) || ('Error ' + r.status);
          var err = new Error(msg);
          err.status = r.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  var Api = {
    status: function () { return req('GET', '/api/auth?action=status'); },
    login: function (password) { return req('POST', '/api/auth', { action: 'login', password: password }); },
    setup: function (setupToken, password) { return req('POST', '/api/auth', { action: 'setup', setupToken: setupToken, password: password }); },
    me: function () { return req('GET', '/api/auth?action=me'); },
    content: function (scope) { return req('GET', '/api/content?scope=' + encodeURIComponent(scope)); },
    save: function (content) { return req('POST', '/api/content', { action: 'save', content: content }); },
    publish: function () { return req('POST', '/api/content', { action: 'publish' }); },
    logout: function () { return req('POST', '/api/auth', { action: 'logout' }); }
  };

  /* =========================================================
     3 · toasts
     ========================================================= */
  function toast(text, kind) {
    var t = el('div', 'toast' + (kind ? ' is-' + kind : ''), (kind === 'ok' ? icon('check', 14) : '') + '<span>' + esc(text) + '</span>');
    els.toasts.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, 2600);
  }

  /* =========================================================
     4 · arranque
     ========================================================= */
  function boot() {
    els.gate = $('[data-gate]');
    els.gateForm = $('[data-gate-form]');
    els.app = $('[data-app]');
    els.leftBody = $('[data-left-body]');
    els.rightBody = $('[data-right-body]');
    els.frame = $('[data-frame]');
    els.toasts = $('[data-toasts]');
    els.saveState = $('[data-save-state]');
    els.saveText = $('[data-save-text]');
    els.canvasScroll = $('.canvas-scroll');
    els.deviceFit = $('[data-device-fit]');
    els.device = $('[data-device-frame]');
    els.inspectorTitle = $('[data-inspector-title]');
    els.inspectorChip = $('[data-inspector-chip]');
    els.pop = $('[data-pop]');

    bindStatic();
    bindGate();

    els.frame.addEventListener('load', function () {
      bindFrame();
      if (st.content) mountCanvas();
    });

    if (window.ResizeObserver && els.canvasScroll) {
      new ResizeObserver(function () { fitCanvas(); }).observe(els.canvasScroll);
    } else {
      window.addEventListener('resize', fitCanvas);
    }

    Api.status().then(function (data) {
      st.status = data || {};
      st.server = !!(data && data.ok && data.backend !== 'none');
      if (!st.server) return startLocal();

      st.token = localStorage.getItem('kando:token') || '';
      if (!st.token) return showGate(data.setupRequired ? 'setup' : 'login');

      return Api.me().then(function () {
        return loadContent();
      }).catch(function () {
        st.token = '';
        localStorage.removeItem('kando:token');
        showGate('login');
      });
    }).catch(function () {
      st.server = false;
      startLocal();
    });
  }

  function startLocal() {
    st.server = false;
    var local = readLocalDraft();
    st.content = local && local.content ? local.content : clone(window.KANDO_CONTENT);
    afterLoad();
    toast('Modo local: los cambios se guardan en este navegador', 'ok');
  }

  function loadContent() {
    return Api.content('draft').then(function (d) {
      st.content = normalize(d && d.content);
      afterLoad();
    }).catch(function () {
      return Api.content('published').then(function (p) {
        st.content = normalize(p && p.content);
        afterLoad();
      }).catch(function () {
        var local = readLocalDraft();
        st.content = normalize(local && local.content ? local.content : window.KANDO_CONTENT);
        afterLoad();
      });
    });
  }

  function normalize(c) {
    if (!c || typeof c !== 'object') c = clone(window.KANDO_CONTENT);
    if (!Array.isArray(c.sections)) c.sections = [];
    c.theme = c.theme || {};
    c.brand = c.brand || {};
    c.settings = c.settings || {};
    c.settings.contact = c.settings.contact || {};
    c.settings.seo = c.settings.seo || {};
    c.settings.nav = c.settings.nav || {};
    c.settings.footer = c.settings.footer || {};
    c.meta = c.meta || {};
    c.sections.forEach(function (b) {
      if (!b.id) b.id = uid();
      if (b.visible == null) b.visible = true;
    });
    return c;
  }

  function afterLoad() {
    els.gate.classList.add('is-hidden');
    els.app.classList.remove('u-hide');
    st.ready = true;
    st.savedJson = JSON.stringify(st.content);
    hStack = [st.savedJson];
    hIndex = 0;
    paintBrand();
    paintLeft();
    paintInspector();
    setSaveState('idle', 'Borrador cargado');
    fitCanvas();
    if (frameDoc) mountCanvas();
    setTimeout(fitCanvas, 120);
  }

  function paintBrand() {
    var b = st.content.brand || {};
    var initials = (b.monogram || 'K').slice(0, 2).toUpperCase();
    $$('[data-brand-monogram], [data-brand-monogram2]').forEach(function (n) { n.textContent = initials; });
    $$('[data-brand-name]').forEach(function (n) { n.textContent = b.name || 'KANDO'; });
    $('[data-avatar]').textContent = (st.server ? 'AD' : 'LO');
    $('[data-pop-meta]').textContent = st.server ? 'Administrador del sitio' : 'Modo local · sin servidor';
    var host = location.host || '';
    var isWeb = location.protocol === 'http:' || location.protocol === 'https:';
    $('[data-url]').textContent = (isWeb && host ? host.replace(/^www\./, '') : 'kando.com.ar');
  }

  /* =========================================================
     5 · acceso
     ========================================================= */
  function bindGate() {
    els.gateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      gateSubmit();
    });
    $('[data-gate-go]').addEventListener('click', function (e) {
      e.preventDefault();
      gateSubmit();
    });
  }

  function showGate(mode) {
    st.gateMode = mode || 'login';
    els.gate.classList.remove('is-hidden');
    els.app.classList.add('u-hide');
    var isSetup = st.gateMode === 'setup';
    $('[data-gate-title]').textContent = isSetup ? 'Primera puesta en marcha' : 'Entrá a tu editor';
    $('[data-gate-sub]').textContent = isSetup
      ? 'Definí la contraseña del administrador. Se guarda cifrada y no se puede recuperar desde acá.'
      : 'Ingresá tu contraseña para editar el sitio y publicar los cambios.';
    $('[data-setup-block]').classList.toggle('u-hide', !isSetup);
    $('[data-setup-block2]').classList.toggle('u-hide', !isSetup);
    $('[data-gate-note]').classList.toggle('u-hide', !isSetup);
    $('[data-gate-note]').innerHTML = isSetup
      ? 'Necesitás el valor de <b>ADMIN_SETUP_TOKEN</b> que cargaste en Vercel → Settings → Environment Variables.'
      : '';
    $('[data-gate-go]').textContent = isSetup ? 'Crear contraseña y entrar' : 'Entrar';
    setTimeout(function () { $('[data-pass]').focus(); }, 60);
    gateMsg('');
  }

  function gateMsg(text, ok) {
    var m = $('[data-gate-msg]');
    m.textContent = text || '';
    m.classList.toggle('is-ok', !!ok);
  }

  var gateBusy = false;
  function gateSubmit() {
    if (gateBusy) return;
    var pass = $('[data-pass]').value.trim();
    if (pass.length < 6) return gateMsg('La contraseña necesita al menos 6 caracteres.');

    gateBusy = true;
    gateMsg('Verificando…', true);

    var p = st.gateMode === 'setup'
      ? (function () {
          var p2 = $('[data-pass2]').value.trim();
          var token = $('[data-setup-token]').value.trim();
          if (!token) return Promise.reject(new Error('Falta el token de instalación.'));
          if (p2 !== pass) return Promise.reject(new Error('Las contraseñas no coinciden.'));
          return Api.setup(token, pass);
        })()
      : Api.login(pass);

    p.then(function (r) {
      st.token = (r && r.token) || '';
      if (st.token) localStorage.setItem('kando:token', st.token);
      return loadContent();
    }).catch(function (err) {
      gateMsg(err.message || 'No pudimos entrar.');
    }).then(function () {
      gateBusy = false;
    });
  }

  /* =========================================================
     6 · guardar / publicar
     ========================================================= */
  function readLocalDraft() {
    try {
      var raw = localStorage.getItem('kando:draft');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  var saveLocalSoon = debounce(function () {
    try {
      localStorage.setItem('kando:draft', JSON.stringify({ at: Date.now(), content: st.content }));
    } catch (e) {
      toast('No hay espacio en el navegador para guardar el borrador', 'error');
    }
  }, 700);

  function setSaveState(kind, text) {
    els.saveState.className = 'save-state is-' + kind;
    els.saveText.textContent = text;
  }

  function isDirty() {
    return JSON.stringify(st.content) !== st.savedJson;
  }

  function markChange() {
    if (isDirty()) setSaveState('dirty', 'Cambios sin guardar');
    else setSaveState('idle', 'Todo guardado');
    saveLocalSoon();
    scheduleHistory();
  }

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function () {
      mountCanvas();
      paintToolsNow();
    }, 70);
  }

  function scheduleHistory() {
    clearTimeout(histTimer);
    histTimer = setTimeout(function () {
      var snap = JSON.stringify(st.content);
      if (hIndex >= 0 && hStack[hIndex] === snap) return;
      hStack = hStack.slice(0, hIndex + 1);
      hStack.push(snap);
      if (hStack.length > 60) hStack.shift();
      hIndex = hStack.length - 1;
    }, 450);
  }

  function undo() {
    if (hIndex <= 0) return toast('No hay más para deshacer');
    hIndex--;
    applySnapshot(hStack[hIndex]);
  }

  function redo() {
    if (hIndex >= hStack.length - 1) return toast('No hay más para rehacer');
    hIndex++;
    applySnapshot(hStack[hIndex]);
  }

  function applySnapshot(snap) {
    st.content = JSON.parse(snap);
    paintLeft();
    paintInspector();
    mountCanvas();
    markChange();
  }

  function doSave() {
    if (!st.server) {
      try {
        localStorage.setItem('kando:draft', JSON.stringify({ at: Date.now(), content: st.content }));
      } catch (e) {}
      setSaveState('saved', 'Guardado en este navegador');
      toast('Borrador guardado en este navegador', 'ok');
      return;
    }
    setSaveState('saving', 'Guardando…');
    Api.save(st.content).then(function () {
      st.savedJson = JSON.stringify(st.content);
      setSaveState('saved', 'Borrador guardado');
      toast('Borrador guardado en el repositorio', 'ok');
    }).catch(function (err) {
      setSaveState('error', 'No se pudo guardar');
      toast(err.message || 'No se pudo guardar', 'error');
    });
  }

  function openPublish() {
    $('[data-publish-server]').classList.toggle('u-hide', !st.server);
    $('[data-publish-local]').classList.toggle('u-hide', st.server);
    $('[data-publish-copy]').textContent = st.server
      ? 'Vamos a publicar el borrador actual como versión pública del sitio.'
      : 'Estás en modo local: al publicar se descarga el archivo content.js para subirlo a mano.';
    openModal('[data-modal-publish]');
  }

  function doPublish() {
    closeModals();
    if (!st.server) {
      downloadContent();
      return;
    }
    toast('Publicando…');
    Api.publish().then(function () {
      st.savedJson = JSON.stringify(st.content);
      setSaveState('saved', 'Publicado');
      toast('Publicado. Vercel lo actualiza en un minuto', 'ok');
    }).catch(function (err) {
      toast(err.message || 'No se pudo publicar', 'error');
    });
  }

  function downloadContent() {
    var src = '/* KANDO · contenido publicado */\nwindow.KANDO_CONTENT = ' +
      JSON.stringify(st.content, null, 2) + ';\n';
    var blob = new Blob([src], { type: 'text/javascript;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    toast('Se descargó content.js', 'ok');
  }

  function downloadJson() {
    var blob = new Blob([JSON.stringify(st.content, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kando-contenido.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* =========================================================
     7 · barra superior
     ========================================================= */
  function bindStatic() {
    $$('[data-device-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        st.device = btn.getAttribute('data-device-btn');
        els.app.setAttribute('data-device', st.device);
        $$('[data-device-btn]').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
        fitCanvas();
      });
    });

    $$('[data-mode-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.getAttribute('data-mode-btn'));
      });
    });

    $$('[data-left-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        st.tab = btn.getAttribute('data-left-tab');
        $$('[data-left-tab]').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
        paintLeft();
      });
    });

    $('[data-btn-undo]').addEventListener('click', undo);
    $('[data-btn-redo]').addEventListener('click', redo);
    $('[data-btn-save]').addEventListener('click', doSave);
    $('[data-btn-publish]').addEventListener('click', openPublish);
    $('[data-publish-go]').addEventListener('click', doPublish);

    $('[data-avatar]').addEventListener('click', function (e) {
      e.stopPropagation();
      els.pop.classList.toggle('is-on');
    });

    var toggleRight = $('[data-toggle-right]');
    if (toggleRight) toggleRight.addEventListener('click', function () { els.app.classList.toggle('is-inspector'); });
    var toggleLeft = $('[data-toggle-left]');
    if (toggleLeft) toggleLeft.addEventListener('click', function () { els.app.classList.toggle('is-library'); });
    var inspClose = $('[data-insp-close]');
    if (inspClose) inspClose.addEventListener('click', function () { els.app.classList.remove('is-inspector'); });
    document.addEventListener('click', function (e) {
      if (!els.pop.contains(e.target) && !e.target.closest('[data-avatar]')) els.pop.classList.remove('is-on');
    });

    $('[data-pop-view]').addEventListener('click', function () {
      els.pop.classList.remove('is-on');
      window.open('index.html', '_blank', 'noopener');
    });
    $('[data-pop-download]').addEventListener('click', function () {
      els.pop.classList.remove('is-on');
      downloadJson();
    });
    $('[data-pop-import]').addEventListener('click', function () {
      els.pop.classList.remove('is-on');
      $('[data-import]').click();
    });
    $('[data-pop-help]').addEventListener('click', function () {
      els.pop.classList.remove('is-on');
      openModal('[data-modal-help]');
    });
    $('[data-pop-logout]').addEventListener('click', function () {
      els.pop.classList.remove('is-on');
      logout();
    });

    $('[data-modal-library]').addEventListener('click', function (e) {
      if (e.target === this) closeModals();
    });
    $$('[data-modal-library] [data-close], [data-modal-publish] [data-close], [data-modal-help] [data-close]')
      .forEach(function (b) { b.addEventListener('click', closeModals); });
    $$('.overlay').forEach(function (ov) {
      ov.inert = true;
      ov.addEventListener('click', function (e) { if (e.target === ov) closeModals(); });
    });

    $('[data-import]').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var txt = String(reader.result);
          var start = txt.indexOf('{');
          var end = txt.lastIndexOf('}');
          if (start < 0 || end < 0) throw new Error('El archivo no tiene contenido');
          var obj = JSON.parse(txt.slice(start, end + 1));
          if (!obj.sections) throw new Error('Ese archivo no parece un contenido de KANDO');
          st.content = normalize(obj);
          hStack = [JSON.stringify(st.content)];
          hIndex = 0;
          paintBrand(); paintLeft(); paintInspector(); mountCanvas();
          markChange();
          toast('Contenido importado', 'ok');
        } catch (err) {
          toast(err.message || 'No pudimos leer el archivo', 'error');
        }
      };
      reader.readAsText(file);
    });

    $('[data-file]').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (f && window.__kandoImgCb) window.__kandoImgCb(f);
    });

    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); doSave(); }
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if (e.key === 'Escape') {
        closeModals();
        els.pop.classList.remove('is-on');
        els.app.classList.remove('is-inspector');
        els.app.classList.remove('is-library');
        if (editing) { editing.el.blur(); }
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if (st.ready && isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'kando:preview-ready') {
        bindFrame();
        if (st.content) mountCanvas();
      }
    });
  }

  function setMode(mode) {
    st.mode = mode;
    $$('[data-mode-btn]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-mode-btn') === mode); });
    els.app.classList.toggle('is-preview', mode === 'preview');
    $('[data-canvas-hint]').textContent = mode === 'preview'
      ? 'Así se ve el sitio publicado. Cambiá de dispositivo para revisar.'
      : 'Hacé clic en una sección para editarla · doble clic en un texto para escribir';
    fitCanvas();
    mountCanvas();
    setTimeout(fitCanvas, 380);
  }

  function logout() {
    if (isDirty() && !confirm('Hay cambios sin guardar. ¿Cerrar sesión igual?')) return;
    if (st.token) Api.logout().catch(function () {});
    st.token = '';
    localStorage.removeItem('kando:token');
    location.reload();
  }

  /* =========================================================
     8 · modales
     ========================================================= */
  function openModal(sel) {
    var m = $(sel);
    if (!m) return;
    $$('.overlay.is-open').forEach(function (o) { o.classList.remove('is-open'); o.inert = true; });
    m.classList.add('is-open');
    m.inert = false;
  }

  function closeModals() {
    $$('.overlay.is-open').forEach(function (o) { o.classList.remove('is-open'); o.inert = true; });
  }

  function confirmDialog(title, text, onYes) {
    $('[data-confirm-title]').textContent = title;
    $('[data-confirm-text]').textContent = text;
    var yes = $('[data-confirm-yes]');
    var no = $('[data-confirm-no]');
    var cleanup = function () { yes.removeEventListener('click', handler); no.removeEventListener('click', closer); };
    var handler = function () { cleanup(); closeModals(); onYes(); };
    var closer = function () { cleanup(); closeModals(); };
    yes.addEventListener('click', handler);
    no.addEventListener('click', closer);
    openModal('[data-modal-confirm]');
  }

  /* =========================================================
     9 · panel izquierdo
     ========================================================= */
  function paintLeft() {
    if (!st.content) return;
    var body = els.leftBody;
    body.innerHTML = '';
    if (st.tab === 'secciones') paintSections(body);
    else if (st.tab === 'diseno') paintDesign(body);
    else paintSettings(body);
  }

  function sectionMeta(type) {
    var def = S.LIBRARY.filter(function (l) { return l.type === type; })[0];
    return def || { name: type, group: '' };
  }

  function paintSections(body) {
    var list = el('div', 'sec-list');
    list.setAttribute('data-sec-list', '');

    st.content.sections.forEach(function (b, i) {
      var meta = sectionMeta(b.type);
      var row = el('div', 'sec-row' + (st.sel.id === b.id ? ' is-on' : '') + (b.visible === false ? ' is-off' : ''));
      row.setAttribute('data-id', b.id);
      row.setAttribute('data-index', String(i));
      row.setAttribute('draggable', 'true');

      row.innerHTML =
        '<span class="drag" title="Arrastrar"><i></i></span>' +
        '<span class="sec-ico">' + icon(typeIcon(b.type), 16) + '</span>' +
        '<span class="sec-main">' +
          '<span class="sec-name">' + esc(b.label || meta.name) + '</span>' +
          '<span class="sec-type">' + esc(meta.name === (b.label || meta.name) ? 'sección' : meta.name) + '</span>' +
        '</span>' +
        '<span class="sec-tools">' +
          '<button class="icon-btn" type="button" data-act="up" title="Subir">' + icon('up', 14) + '</button>' +
          '<button class="icon-btn" type="button" data-act="down" title="Bajar">' + icon('down', 14) + '</button>' +
          '<button class="icon-btn" type="button" data-act="vis" title="' + (b.visible === false ? 'Mostrar' : 'Ocultar') + '">' +
            icon(b.visible === false ? 'eyeOff' : 'eye', 14) + '</button>' +
        '</span>';

      row.addEventListener('click', function (e) {
        if (e.target.closest('[data-act]') || e.target.closest('.drag')) return;
        selectBlock(b.id);
      });

      $$('[data-act]', row).forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var act = btn.getAttribute('data-act');
          if (act === 'up') moveBlock(i, -1);
          if (act === 'down') moveBlock(i, 1);
          if (act === 'vis') { b.visible = b.visible === false; paintLeft(); mountCanvas(); markChange(); }
        });
      });

      row.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', b.id);
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('is-drag');
      });
      row.addEventListener('dragend', function () {
        row.classList.remove('is-drag');
        $$('.sec-row').forEach(function (r) { r.classList.remove('drop-before', 'drop-after'); });
      });
      row.addEventListener('dragover', function (e) {
        e.preventDefault();
        var r = row.getBoundingClientRect();
        var after = (e.clientY - r.top) > r.height / 2;
        row.classList.toggle('drop-after', after);
        row.classList.toggle('drop-before', !after);
      });
      row.addEventListener('dragleave', function () {
        row.classList.remove('drop-before', 'drop-after');
      });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        var id = e.dataTransfer.getData('text/plain');
        var r = row.getBoundingClientRect();
        var after = (e.clientY - r.top) > r.height / 2;
        var from = st.content.sections.findIndex(function (x) { return x.id === id; });
        if (from < 0) return;
        if (id === b.id) return;
        var moved = st.content.sections.splice(from, 1)[0];
        var to = st.content.sections.findIndex(function (x) { return x.id === b.id; });
        if (to < 0) to = st.content.sections.length;
        st.content.sections.splice(after ? to + 1 : to, 0, moved);
        paintLeft();
        mountCanvas();
        markChange();
      });

      list.appendChild(row);
    });

    body.appendChild(list);

    var add = el('div', 'sec-actions');
    var addBtn = el('button', 'add-btn', icon('plus', 13) + ' Agregar sección');
    addBtn.type = 'button';
    addBtn.addEventListener('click', openLibrary);
    add.appendChild(addBtn);
    body.appendChild(add);

    var tip = el('p', 'f-hint', 'Arrastrá las secciones para cambiarlas de lugar. El ojo las oculta sin borrarlas.');
    tip.style.padding = '10px 4px';
    body.appendChild(tip);
  }

  function typeIcon(type) {
    var map = {
      hero: 'M4 5h16v6H4zM4 13h7v6H4zM13 13h7v6h-7z',
      band: 'M3 12h18M6 8h12M8 16h8',
      manifesto: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
      services: 'M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z',
      tabs: 'M3 6h18M6 6v3h4V6M6 12h12M6 17h12',
      principles: 'M5 6h3v3H5zM11 6h8M5 12h3v3H5zM11 12h8M5 18h3v3H5zM11 18h8',
      process: 'M6 4v16M6 8h12M6 16h12',
      gallery: 'M4 5h16v14H4zM4 15l4-4 3 3 3-3 6 6',
      packages: 'M4 8h16v12H4zM8 8V5h8v3M12 8v12',
      quote: 'M6 8h4v5H6zM14 8h4v5h-4zM6 13c0 2 1 3 3 3M14 13c0 2 1 3 3 3',
      testimonials: 'M4 5h16v10H9l-5 4z',
      faq: 'M12 18h.01M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.7-.7 1.2v.4',
      cta: 'M4 6h16v12H4zM10 10l4 2-4 2z',
      contact: 'M4 6h16v12H4zM4 7l8 6 8-6'
    };
    return map[type] || 'M4 5h16v14H4z';
  }

  function moveBlock(index, dir) {
    var to = index + dir;
    if (to < 0 || to >= st.content.sections.length) return;
    var arr = st.content.sections;
    var tmp = arr[index];
    arr[index] = arr[to];
    arr[to] = tmp;
    paintLeft();
    mountCanvas();
    markChange();
  }

  function openLibrary() {
    var body = $('[data-library-body]');
    body.innerHTML = '';
    var groups = {};
    S.LIBRARY.forEach(function (l) { (groups[l.group] = groups[l.group] || []).push(l); });
    Object.keys(groups).forEach(function (g) {
      body.appendChild(el('div', 'lib-group', esc(g)));
      var grid = el('div', 'lib-grid');
      groups[g].forEach(function (l) {
        var card = el('button', 'lib-card',
          '<span class="lib-ico">' + icon(typeIcon(l.type), 17) + '</span>' +
          '<span class="lib-name">' + esc(l.name) + '</span>' +
          '<span class="lib-desc">' + esc(l.desc) + '</span>');
        card.type = 'button';
        card.addEventListener('click', function () {
          var block = l.create(uid());
          st.content.sections.push(block);
          closeModals();
          paintLeft();
          mountCanvas();
          markChange();
          selectBlock(block.id);
          toast('Sección agregada al final', 'ok');
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    });
    openModal('[data-modal-library]');
  }

  function paintDesign(body) {
    var head = el('p', 'f-hint', 'Los cambios de diseño se aplican a todo el sitio.');
    head.style.padding = '2px 2px 8px';
    body.appendChild(head);
    S.DESIGN.forEach(function (group) {
      var wrap = el('div', 'form-group');
      wrap.appendChild(el('h3', '', esc(group.title)));
      var target = getPath(st.content, group.base);
      group.fields.forEach(function (f) { wrap.appendChild(renderField(target, f, onChangeDesign)); });
      body.appendChild(wrap);
    });
    var reset = el('button', 'add-btn', 'Volver a la paleta original');
    reset.type = 'button';
    reset.style.marginTop = '8px';
    reset.addEventListener('click', function () {
      st.content.theme = clone(window.KANDO_CONTENT.theme);
      paintLeft();
      mountCanvas();
      markChange();
    });
    body.appendChild(reset);
  }

  function paintSettings(body) {
    S.SETTINGS.forEach(function (group) {
      var wrap = el('div', 'form-group');
      wrap.appendChild(el('h3', '', esc(group.title)));
      var target = getPath(st.content, group.base);
      group.fields.forEach(function (f) { wrap.appendChild(renderField(target, f, onChangeDesign)); });
      body.appendChild(wrap);
    });
  }

  function onChangeDesign() {
    paintBrand();
    mountCanvas();
    markChange();
  }

  /* =========================================================
     10 · lienzo
     ========================================================= */
  function bindFrame() {
    try {
      frameDoc = els.frame.contentDocument || els.frame.contentWindow.document;
      frameWin = els.frame.contentWindow;
    } catch (e) {
      return;
    }
    if (!frameDoc || frameDoc.__kandoBound) return;
    frameDoc.__kandoBound = true;

    frameDoc.addEventListener('click', function (e) {
      if (st.mode === 'preview') return;
      if (editing) { endEdit(); return; }
      var target = e.target.closest ? e.target.closest('[data-block]') : null;
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      selectBlock(target.getAttribute('data-block'));
    }, true);

    frameDoc.addEventListener('dblclick', function (e) {
      if (st.mode === 'preview') return;
      var f = e.target.closest ? e.target.closest('[data-field]') : null;
      if (!f) return;
      var blk = f.closest('[data-block]');
      if (!blk) return;
      e.preventDefault();
      e.stopPropagation();
      var id = blk.getAttribute('data-block');
      selectBlock(id, f.getAttribute('data-field'));
      startEdit(f, id);
    }, true);

    frameWin.addEventListener('scroll', paintToolsNow, { passive: true });
    frameWin.addEventListener('resize', paintToolsNow);
  }

  function mountCanvas() {
    if (!st.content) return;
    var pv = els.frame.contentWindow && els.frame.contentWindow.KandoPreview;
    if (!pv) return;
    try {
      pv.mount(st.content, { mode: st.mode === 'preview' ? 'view' : 'edit', reduceMotion: false });
      frameDoc = els.frame.contentDocument;
      frameWin = els.frame.contentWindow;
      ensureTools();
      if (st.sel.id) {
        var node = frameDoc.querySelector('[data-block="' + cssEsc(st.sel.id) + '"]');
        if (!node) st.sel = { id: null, field: null };
      }
      paintToolsNow();
    } catch (err) {
      if (window.console) console.error(err);
    }
  }

  function cssEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  function ensureTools() {
    if (!frameDoc) return;
    toolsEl = frameDoc.querySelector('.k-tools');
    if (toolsEl) return;
    toolsEl = frameDoc.createElement('div');
    toolsEl.className = 'k-tools';
    toolsEl.innerHTML =
      '<span class="k-name" data-k-name></span>' +
      '<button type="button" data-k="up" title="Subir">' + icon('up', 14) + '</button>' +
      '<button type="button" data-k="down" title="Bajar">' + icon('down', 14) + '</button>' +
      '<button type="button" data-k="copy" title="Duplicar">' + icon('copy', 14) + '</button>' +
      '<button type="button" data-k="hide" title="Ocultar">' + icon('eyeOff', 14) + '</button>' +
      '<button type="button" data-k="del" class="is-danger" title="Eliminar">' + icon('trash', 14) + '</button>';
    frameDoc.body.appendChild(toolsEl);

    toolsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-k]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var act = btn.getAttribute('data-k');
      var id = st.sel.id;
      var idx = st.content.sections.findIndex(function (x) { return x.id === id; });
      if (idx < 0) return;
      if (act === 'up') moveBlock(idx, -1);
      if (act === 'down') moveBlock(idx, 1);
      if (act === 'copy') {
        var cp = clone(st.content.sections[idx]);
        cp.id = uid();
        cp.label = (cp.label || 'Sección') + ' (copia)';
        st.content.sections.splice(idx + 1, 0, cp);
        paintLeft(); mountCanvas(); markChange(); selectBlock(cp.id);
      }
      if (act === 'hide') {
        st.content.sections[idx].visible = false;
        paintLeft(); mountCanvas(); markChange();
      }
      if (act === 'del') {
        confirmDialog('Eliminar sección', 'Se va a quitar "' + (st.content.sections[idx].label || 'esta sección') + '" de la página. Podés volver con Ctrl+Z.', function () {
          st.content.sections.splice(idx, 1);
          st.sel = { id: null, field: null };
          paintLeft(); paintInspector(); mountCanvas(); markChange();
        });
      }
    });
  }

  function paintToolsNow() {
    if (!toolsEl || !frameDoc) return;
    if (st.mode === 'preview' || !st.sel.id) {
      toolsEl.classList.remove('is-on');
      return;
    }
    var node = frameDoc.querySelector('[data-block="' + cssEsc(st.sel.id) + '"]');
    if (!node) { toolsEl.classList.remove('is-on'); return; }
    var r = node.getBoundingClientRect();
    if (r.bottom < 0 || r.top > frameWin.innerHeight) { toolsEl.classList.remove('is-on'); return; }
    var block = findBlock(st.sel.id);
    var nameEl = toolsEl.querySelector('[data-k-name]');
    if (nameEl) nameEl.textContent = (block && (block.label || sectionMeta(block.type).name)) || '';
    toolsEl.classList.add('is-on');
    var top = Math.max(74, Math.min(r.top - 34, frameWin.innerHeight - 44));
    var left = Math.max(6, Math.min(r.left + 4, frameWin.innerWidth - 220));
    toolsEl.style.top = top + 'px';
    toolsEl.style.left = left + 'px';

    $$('[data-block]', frameDoc).forEach(function (n) {
      n.setAttribute('data-selected', n === node ? 'true' : 'false');
    });
  }

  function findBlock(id) {
    return st.content.sections.filter(function (b) { return b.id === id; })[0];
  }

  function selectBlock(id, field) {
    st.sel = { id: id, field: field || null };
    paintLeft();
    paintInspector();
    paintToolsNow();
    if (window.innerWidth <= 1000) els.app.classList.add('is-inspector');
  }

  function startEdit(node, blockId) {
    var block = findBlock(blockId);
    if (!block) return;
    var path = node.getAttribute('data-field');
    if (!path) return;
    var raw = getPath(block, path);
    editing = { el: node, blockId: blockId, path: path, original: raw };

    if (node.__kandoBlur) node.removeEventListener('blur', node.__kandoBlur);
    node.__kandoBlur = function () { endEdit(); };
    node.addEventListener('blur', node.__kandoBlur);

    node.classList.add('is-editing');
    node.setAttribute('contenteditable', 'true');
    node.textContent = raw == null ? '' : String(raw);
    try { node.focus(); } catch (e) {}

    var range = frameDoc.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    var sel = frameWin.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    node.__kandoKey = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); node.blur(); }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); node.blur(); }
      e.stopPropagation();
    };
    node.addEventListener('keydown', node.__kandoKey);
  }

  function endEdit() {
    if (!editing) return;
    var node = editing.el;
    var block = findBlock(editing.blockId);
    var value = String(node.innerText == null ? node.textContent : node.innerText)
      .replace(/\u00a0/g, ' ')
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    node.removeEventListener('keydown', node.__kandoKey);
    if (node.__kandoBlur) node.removeEventListener('blur', node.__kandoBlur);
    node.removeAttribute('contenteditable');
    node.classList.remove('is-editing');

    var changed = block && value !== String(editing.original == null ? '' : editing.original);
    editing = null;

    if (changed) {
      setPath(block, node.getAttribute('data-field'), value);
      mountCanvas();
      paintInspector();
      markChange();
    } else {
      mountCanvas();
    }
    paintLeft();
  }

  /* =========================================================
     11 · panel derecho (inspector)
     ========================================================= */
  function paintInspector(keepScroll) {
    var body = els.rightBody;
    var y = keepScroll ? body.scrollTop : 0;
    body.innerHTML = '';
    var block = st.sel.id ? findBlock(st.sel.id) : null;

    if (!block) {
      els.inspectorTitle.textContent = 'Diseño';
      els.inspectorChip.classList.add('u-hide');
      var empty = el('div', 'canvas-empty', 'Elegí una sección de la izquierda<br>o hacé clic sobre la página.');
      empty.style.height = 'auto';
      empty.style.padding = '26px 18px';
      body.appendChild(empty);
      body.scrollTop = y;
      return;
    }

    var meta = sectionMeta(block.type);
    els.inspectorTitle.textContent = block.label || meta.name;
    els.inspectorChip.textContent = meta.name;
    els.inspectorChip.classList.remove('u-hide');

    var head = el('div', 'form-group');
    var nameField = { key: 'label', label: 'Nombre en el panel', type: 'text', hint: 'Solo lo ves vos. No aparece en el sitio.' };
    head.appendChild(renderField(block, nameField, onChangeBlock));
    var vis = { key: 'visible', label: 'Mostrar esta sección', type: 'toggle' };
    head.appendChild(renderField(block, vis, function () {
      paintLeft(); mountCanvas(); markChange();
    }));
    body.appendChild(head);

    var groups = S.FORMS[block.type] || [];
    groups.forEach(function (group) {
      var wrap = el('div', 'form-group');
      if (group.title) wrap.appendChild(el('h3', '', esc(group.title)));
      group.fields.forEach(function (f) {
        wrap.appendChild(renderField(block, f, onChangeBlock));
      });
      body.appendChild(wrap);
    });

    var danger = el('div', 'sec-actions');
    var del = el('button', 'add-btn', icon('trash', 13) + ' Eliminar esta sección');
    del.type = 'button';
    del.style.color = 'var(--u-danger)';
    del.addEventListener('click', function () {
      confirmDialog('Eliminar sección', 'Se va a quitar esta sección de la página. Podés volver con Ctrl+Z.', function () {
        var idx = st.content.sections.findIndex(function (x) { return x.id === block.id; });
        if (idx >= 0) st.content.sections.splice(idx, 1);
        st.sel = { id: null, field: null };
        paintLeft(); paintInspector(); mountCanvas(); markChange();
      });
    });
    danger.appendChild(del);
    body.appendChild(danger);
    body.scrollTop = y;
  }

  function onChangeBlock() {
    var block = findBlock(st.sel.id);
    if (block && block.label) els.inspectorTitle.textContent = block.label;
    scheduleRender();
    scheduleLeft();
    markChange();
  }

  var leftTimer = null;
  function scheduleLeft() {
    clearTimeout(leftTimer);
    leftTimer = setTimeout(function () { paintLeft(); }, 520);
  }

  /* =========================================================
     12 · constructores de campos
     ========================================================= */
  function renderField(obj, f, onChange) {
    if (!obj) obj = {};
    var wrap = el('div', 'f-field');

    if (f.type !== 'toggle' && f.type !== 'group') {
      var lab = el('div', 'f-label');
      lab.innerHTML = '<span>' + esc(f.label) + '</span>';
      wrap.appendChild(lab);
    }

    if (f.type === 'textarea') {
      var ta = el('textarea', 'f-area');
      ta.rows = f.rows || 3;
      ta.value = obj[f.key] == null ? '' : obj[f.key];
      ta.addEventListener('input', function () { obj[f.key] = ta.value; onChange(); });
      wrap.appendChild(ta);
    } else if (f.type === 'select') {
      var sel = el('select', 'f-select');
      (f.options || []).forEach(function (o) {
        var op = el('option');
        op.value = o.value;
        op.textContent = o.label;
        sel.appendChild(op);
      });
      sel.value = obj[f.key] == null ? '' : obj[f.key];
      sel.addEventListener('change', function () {
        obj[f.key] = sel.value;
        onChange();
        if (f.swatch) paintLeft();
      });
      wrap.appendChild(sel);
      if (f.swatch) wrap.appendChild(swatches(obj, f, onChange));
    } else if (f.type === 'number') {
      var num = el('input', 'f-input');
      num.type = 'number';
      if (f.min != null) num.min = f.min;
      if (f.max != null) num.max = f.max;
      num.value = obj[f.key] == null ? '' : obj[f.key];
      num.addEventListener('input', function () {
        obj[f.key] = num.value === '' ? '' : Number(num.value);
        onChange();
      });
      wrap.appendChild(num);
    } else if (f.type === 'toggle') {
      var row = el('div', 'f-field f-toggle');
      row.innerHTML = '<div><div class="f-label" style="margin:0"><span>' + esc(f.label) + '</span></div>' +
        (f.hint ? '<div class="f-hint">' + esc(f.hint) + '</div>' : '') + '</div>';
      var sw = el('button', 'switch' + (obj[f.key] === false ? '' : ' is-on'));
      sw.type = 'button';
      sw.setAttribute('aria-pressed', String(obj[f.key] !== false));
      sw.addEventListener('click', function () {
        var next = !(obj[f.key] !== false);
        obj[f.key] = next;
        sw.classList.toggle('is-on', next);
        sw.setAttribute('aria-pressed', String(next));
        onChange();
      });
      row.appendChild(sw);
      return row;
    } else if (f.type === 'image') {
      wrap.appendChild(imageField(obj, f, onChange));
    } else if (f.type === 'group') {
      var g = el('div', 'form-group');
      g.appendChild(el('h3', '', esc(f.label)));
      if (!obj[f.key] || typeof obj[f.key] !== 'object') obj[f.key] = {};
      (f.fields || []).forEach(function (sub) {
        g.appendChild(renderField(obj[f.key], sub, onChange));
      });
      return g;
    } else if (f.type === 'list') {
      wrap.appendChild(listField(obj, f, onChange));
    } else {
      var inp = el('input', 'f-input');
      inp.type = 'text';
      inp.value = obj[f.key] == null ? '' : obj[f.key];
      inp.addEventListener('input', function () { obj[f.key] = inp.value; onChange(); });
      wrap.appendChild(inp);
    }

    if (f.hint && f.type !== 'toggle') {
      wrap.appendChild(el('div', 'f-hint', esc(f.hint)));
    }
    return wrap;
  }

  function swatches(obj, f, onChange) {
    var colors = {
      durazno: '#EED9CB', salvia: '#D9E5D3', lavanda: '#E1D9EC',
      arena: '#EADCC3', cielo: '#D6E5E7', rosa: '#EFD6DB'
    };
    var row = el('div', 'f-swatches');
    row.style.marginTop = '8px';
    Object.keys(colors).forEach(function (key) {
      var b = el('button', 'f-swatch' + (obj[f.key] === key ? ' is-on' : ''));
      b.type = 'button';
      b.title = key;
      b.innerHTML = '<i style="background:' + colors[key] + '"></i>';
      b.addEventListener('click', function () {
        obj[f.key] = key;
        onChange();
        paintLeft();
      });
      row.appendChild(b);
    });
    return row;
  }

  function imageField(obj, f, onChange) {
    var box = el('div', 'img-field');
    var thumb = el('div', 'img-thumb');
    var ops = el('div', 'img-ops');
    var rowBtns = el('div', 'row');
    var size = el('div', 'img-size');

    var paint = function () {
      var src = obj[f.key];
      thumb.innerHTML = '';
      if (src) {
        var holder = el('div');
        holder.innerHTML = Art.image(src, '');
        thumb.appendChild(holder.firstChild || holder);
        if (src.indexOf('data:') === 0) {
          var kb = Math.round(src.length * 0.75 / 1024);
          size.textContent = kb + ' KB' + (kb > 700 ? ' · conviene achicar' : '');
          size.style.color = kb > 700 ? 'var(--u-warn)' : '';
        } else {
          size.textContent = src.indexOf('art:') === 0 ? 'Ilustración del sistema' : 'Imagen externa';
        }
      } else {
        thumb.innerHTML = '<span class="placeholder">Sin imagen</span>';
        size.textContent = '';
      }
    };

    var uploadBtn = el('button', 'btn-u is-sm', icon('image', 13) + ' Subir');
    uploadBtn.type = 'button';
    uploadBtn.addEventListener('click', function () {
      window.__kandoImgCb = function (file) {
        uploadImage(file).then(function (dataUrl) {
          obj[f.key] = dataUrl;
          paint();
          onChange();
          toast('Imagen cargada', 'ok');
        }).catch(function (err) {
          toast(err.message || 'No pudimos procesar la imagen', 'error');
        });
      };
      $('[data-file]').click();
    });

    var urlBtn = el('button', 'btn-u is-sm', icon('link', 13) + ' Link');
    urlBtn.type = 'button';
    urlBtn.addEventListener('click', function () {
      var v = window.prompt('Pegá la dirección de la imagen (https://…) o una ilustración: art:hero, art:vestidor, art:cocina', obj[f.key] || '');
      if (v == null) return;
      obj[f.key] = v.trim();
      paint();
      onChange();
    });

    var clearBtn = el('button', 'btn-u is-sm', 'Quitar');
    clearBtn.type = 'button';
    clearBtn.addEventListener('click', function () {
      obj[f.key] = '';
      paint();
      onChange();
    });

    rowBtns.appendChild(uploadBtn);
    rowBtns.appendChild(urlBtn);
    rowBtns.appendChild(clearBtn);
    ops.appendChild(rowBtns);
    ops.appendChild(size);
    box.appendChild(thumb);
    box.appendChild(ops);
    paint();
    return box;
  }

  function uploadImage(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error('Ese archivo no es una imagen'));
      if (file.size > 12 * 1024 * 1024) return reject(new Error('La imagen supera los 12 MB'));
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 1400;
        var w = img.naturalWidth || 800;
        var h = img.naturalHeight || 600;
        var scale = Math.min(1, max / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch (e) {
          reject(new Error('No pudimos comprimir la imagen'));
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('No pudimos leer la imagen'));
      };
      img.src = url;
    });
  }

  function blankItem(fields) {
    var o = {};
    (fields || []).forEach(function (f) {
      if (f.type === 'number') o[f.key] = 5;
      else if (f.type === 'toggle') o[f.key] = false;
      else if (f.type === 'list') o[f.key] = [];
      else if (f.type === 'group') o[f.key] = {};
      else if (f.type === 'select') o[f.key] = (f.options && f.options[0] && f.options[0].value) || '';
      else o[f.key] = '';
    });
    return o;
  }

  function summarize(item, fields, i, label) {
    var first = (fields || []).filter(function (f) {
      return (f.type === 'text' || f.type === 'textarea') && item[f.key];
    })[0];
    var txt = first ? String(item[first.key]) : '';
    txt = txt.replace(/\s+/g, ' ').trim();
    if (txt.length > 34) txt = txt.slice(0, 34) + '…';
    return txt || ((label || 'Ítem') + ' ' + (i + 1));
  }

  function listField(obj, f, onChange) {
    var arr = obj[f.key];
    if (!Array.isArray(arr)) { arr = []; obj[f.key] = arr; }

    var wrap = el('div');
    if (!arr.length) wrap.appendChild(el('div', 'rep-empty', 'Sin elementos todavía'));

    arr.forEach(function (item, i) {
      if (!item || typeof item !== 'object') { item = blankItem(f.itemFields); arr[i] = item; }
      var box = el('div', 'rep-item');
      var head = el('div', 'rep-head is-open');
      head.innerHTML = '<span class="rep-num">' + (i + 1) + '</span>';
      var title = el('span', 'rep-title', esc(summarize(item, f.itemFields, i, f.itemLabel)));
      title.addEventListener('click', function () {
        head.classList.toggle('is-open');
      });
      head.appendChild(title);

      var up = el('button', 'icon-btn', icon('up', 13));
      up.type = 'button'; up.title = 'Subir';
      up.addEventListener('click', function () {
        if (i === 0) return;
        var tmp = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = tmp;
        onChange(); paintLeft(); paintInspector(true);
      });

      var down = el('button', 'icon-btn', icon('down', 13));
      down.type = 'button'; down.title = 'Bajar';
      down.addEventListener('click', function () {
        if (i >= arr.length - 1) return;
        var tmp = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = tmp;
        onChange(); paintLeft(); paintInspector(true);
      });

      var del = el('button', 'icon-btn is-danger', icon('trash', 13));
      del.type = 'button'; del.title = 'Quitar';
      del.addEventListener('click', function () {
        arr.splice(i, 1);
        onChange(); paintLeft(); paintInspector(true);
      });

      head.appendChild(up);
      head.appendChild(down);
      head.appendChild(del);
      box.appendChild(head);

      var body = el('div', 'rep-body');
      (f.itemFields || []).forEach(function (sub) {
        body.appendChild(renderField(item, sub, function () {
          onChange();
          title.textContent = summarize(item, f.itemFields, i, f.itemLabel);
        }));
      });
      box.appendChild(body);
      wrap.appendChild(box);
    });

    var add = el('button', 'add-btn', icon('plus', 13) + ' ' + (f.addLabel || 'Agregar'));
    add.type = 'button';
    add.addEventListener('click', function () {
      if (f.max && arr.length >= f.max) return toast('Máximo ' + f.max + ' elementos');
      arr.push(blankItem(f.itemFields));
      onChange();
      paintLeft();
      paintInspector(true);
    });
    wrap.appendChild(add);
    return wrap;
  }

  /* =========================================================
     13 · arranque
     ========================================================= */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
