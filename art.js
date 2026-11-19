/* KANDO · arte generativo.
   Las imágenes por defecto no son fotos: son escenas SVG dibujadas en el momento.
   Así el sitio pesa nada, se adapta a la paleta elegida y no depende de archivos.
   Cada valor de imagen puede ser: "art:clave", una URL o un data URI. */
(function () {
  'use strict';

  var V = function (n) { return 'var(--art-' + n + ')'; };

  function rnd(seed) {
    var s = seed || 1;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  function defs(id) {
    return '<defs>' +
      '<linearGradient id="bg' + id + '" x1="0" y1="0" x2="0.35" y2="1">' +
        '<stop offset="0" stop-color="' + V('bg1') + '"/>' +
        '<stop offset="1" stop-color="' + V('bg2') + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="lt' + id + '" x1="0" y1="0" x2="0.8" y2="1">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".55"/>' +
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
      '</linearGradient>' +
      '<linearGradient id="sh' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + V('4') + '" stop-opacity=".18"/>' +
        '<stop offset="1" stop-color="' + V('4') + '" stop-opacity="0"/>' +
      '</linearGradient>' +
      '</defs>';
  }

  /* ---------- piezas ---------- */

  function niche(x, y, w, h, r, fill, op) {
    return '<path d="M' + x + ' ' + (y + h) + ' V' + (y + r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) + ' V' + (y + h) + ' Z" ' +
      'fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : '') + '/>' +
      '<path d="M' + x + ' ' + (y + h) + ' V' + (y + r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) + ' V' + (y + h) + '" ' +
      'fill="none" stroke="' + V('ink') + '" stroke-opacity=".14" stroke-width="2.5"/>';
  }

  function rail(x1, x2, y) {
    return '<path d="M' + x1 + ' ' + y + ' H' + x2 + '" stroke="' + V('ink') + '" stroke-opacity=".42" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="' + x1 + '" cy="' + y + '" r="5" fill="' + V('4') + '"/>' +
      '<circle cx="' + x2 + '" cy="' + y + '" r="5" fill="' + V('4') + '"/>';
  }

  /* kind: 0 remera · 1 vestido · 2 camisa */
  function garment(x, y, w, len, color, kind, flip) {
    var cx = x + w / 2;
    var hemY = y + len;
    var out = '<g>';
    /* gancho */
    out += '<path d="M' + cx + ' ' + (y + 10) + ' v-5 a7 7 0 1 0 7 -7" fill="none" stroke="' + V('ink') + '" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/>';
    /* barra de la percha */
    out += '<path d="M' + (x + 5) + ' ' + (y + 12) + ' L' + cx + ' ' + (y - 1) + ' L' + (x + w - 5) + ' ' + (y + 12) + '" fill="none" stroke="' + V('ink') + '" stroke-opacity=".34" stroke-width="2.4" stroke-linejoin="round"/>';

    if (kind === 1) {
      /* vestido: hombros angostos, ruedo ancho */
      out += '<path d="M' + (x + 10) + ' ' + (y + 14) + ' L' + (x + w - 10) + ' ' + (y + 14) +
        ' L' + (x + w + 10) + ' ' + hemY + ' Q' + cx + ' ' + (hemY + 14) + ' ' + (x - 10) + ' ' + hemY + ' Z" fill="' + color + '"/>';
    } else if (kind === 2) {
      /* camisa: mangas cortas */
      out += '<path d="M' + (x + 12) + ' ' + (y + 14) + ' L' + (x - 6) + ' ' + (y + 52) + ' L' + (x + 6) + ' ' + (y + 62) + ' L' + (x + 18) + ' ' + (y + 40) + ' L' + (x + 18) + ' ' + hemY + ' L' + (x + w - 18) + ' ' + hemY + ' L' + (x + w - 18) + ' ' + (y + 40) + ' L' + (x + w - 6) + ' ' + (y + 62) + ' L' + (x + w + 6) + ' ' + (y + 52) + ' L' + (x + w - 12) + ' ' + (y + 14) + ' Z" fill="' + color + '"/>';
    } else {
      /* remera / prenda simple */
      out += '<path d="M' + (x + 8) + ' ' + (y + 14) + ' L' + (x + w - 8) + ' ' + (y + 14) +
        ' L' + (x + w + 4) + ' ' + (hemY - 12) + ' Q' + cx + ' ' + (hemY + 10) + ' ' + (x - 4) + ' ' + (hemY - 12) + ' Z" fill="' + color + '"/>';
    }

    /* pliegue central y brillo */
    out += '<path d="M' + cx + ' ' + (y + 18) + ' V' + (hemY - 6) + '" stroke="#000" stroke-opacity=".06" stroke-width="2"/>';
    out += '<path d="M' + (x + 14) + ' ' + (y + 20) + ' L' + (x + 6) + ' ' + (hemY - 18) + '" stroke="#fff" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>';
    out += '</g>';
    return out;
  }

  function folded(x, y, w, color) {
    var h = 17;
    return '<g>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" fill="' + color + '"/>' +
      '<path d="M' + (x + 8) + ' ' + (y + h * 0.62) + ' H' + (x + w - 8) + '" stroke="#000" stroke-opacity=".07" stroke-width="2"/>' +
      '<path d="M' + (x + 10) + ' ' + (y + 3) + ' H' + (x + w * 0.42) + '" stroke="#fff" stroke-opacity=".3" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g>';
  }

  function stack(x, y, w, n, seed) {
    var r = rnd(seed);
    var tones = [1, 3, 4, 2];
    var out = '';
    for (var i = 0; i < n; i++) {
      var c = V(String(tones[Math.floor(r() * 4)]));
      out += folded(x + (i % 2 ? 3 : 0), y - i * 21, w - (i % 3) * 5, c);
    }
    return out;
  }

  function jar(x, y, w, h, body, cap) {
    return '<g>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (w * 0.24) + '" fill="' + body + '"/>' +
      '<rect x="' + x + '" y="' + (y + h * 0.42) + '" width="' + w + '" height="' + (h * 0.58) + '" rx="' + (w * 0.24) + '" fill="' + V('bg1') + '" opacity=".28"/>' +
      '<rect x="' + (x + 2) + '" y="' + (y - 7) + '" width="' + (w - 4) + '" height="9" rx="4.5" fill="' + cap + '"/>' +
      '<path d="M' + (x + 7) + ' ' + (y + 10) + ' v' + (h * 0.3) + '" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>' +
      '</g>';
  }

  function basket(x, y, w, h) {
    return '<g>' +
      '<path d="M' + x + ' ' + y + ' L' + (x + w) + ' ' + y + ' L' + (x + w - 10) + ' ' + (y + h) + ' L' + (x + 10) + ' ' + (y + h) + ' Z" fill="' + V('4') + '" opacity=".55"/>' +
      '<path d="M' + (x + 3) + ' ' + (y + h * 0.34) + ' H' + (x + w - 3) + ' M' + (x + 6) + ' ' + (y + h * 0.68) + ' H' + (x + w - 6) + '" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>' +
      '<rect x="' + (x - 3) + '" y="' + (y - 6) + '" width="' + (w + 6) + '" height="9" rx="4.5" fill="' + V('3') + '"/>' +
      '</g>';
  }

  function shelf(x, y, w) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="8" rx="4" fill="' + V('4') + '" opacity=".5"/>' +
      '<rect x="' + x + '" y="' + (y + 8) + '" width="' + w + '" height="6" fill="url(#shSCENE)" opacity=".5"/>';
  }

  function plant(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M0 0 h56 l-8 48 h-40 z" fill="' + V('4') + '" opacity=".7"/>' +
      '<path d="M28 0 C28 -34 12 -50 -6 -58 M28 0 C28 -38 46 -54 64 -62 M28 -4 C14 -44 0 -34 2 -20" fill="none" stroke="' + V('4') + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<ellipse cx="-9" cy="-62" rx="12" ry="7.5" fill="' + V('1') + '" transform="rotate(-26 -9 -62)"/>' +
      '<ellipse cx="66" cy="-66" rx="13" ry="7.5" fill="' + V('1') + '" transform="rotate(16 66 -66)"/>' +
      '<ellipse cx="1" cy="-24" rx="10" ry="6" fill="' + V('3') + '" transform="rotate(-54 1 -24)"/>' +
      '</g>';
  }

  function beamBox() {
    return '<path d="M0 0 L340 0 L190 1000 L-40 1000 Z" fill="url(#ltSCENE)"/>';
  }

  function ensoRing(cx, cy, r, w) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + V('1') + '" stroke-width="' + (w || 2.5) + '" stroke-linecap="round" ' +
      'stroke-dasharray="' + (r * 5.1) + ' ' + (r * 0.5) + '" transform="rotate(-80 ' + cx + ' ' + cy + ')" opacity=".55"/>';
  }

  function floorShadow(cx, y, rx) {
    return '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + rx + '" ry="24" fill="#000" opacity=".055"/>';
  }

  /* ---------- escenas ---------- */

  var SCENES = {
    hero: function () {
      return niche(84, 96, 632, 790, 300, V('5'), 0.72) +
        '<path d="M84 96 h632 v300 H84 Z" fill="url(#shSCENE)" opacity=".6"/>' +
        rail(150, 650, 250) +
        garment(152, 258, 92, 210, V('2'), 0) +
        garment(258, 258, 104, 250, V('3'), 1) +
        garment(376, 258, 88, 190, V('4'), 2) +
        garment(478, 258, 100, 236, V('1'), 0) +
        garment(590, 258, 84, 205, V('3'), 2) +
        shelf(120, 560, 560) +
        stack(140, 700, 132, 4, 7) +
        stack(292, 700, 126, 3, 11) +
        stack(438, 700, 132, 4, 3) +
        '<g>' + jar(600, 600, 66, 96, V('3'), V('1')) + '</g>' +
        shelf(120, 736, 560) +
        basket(150, 790, 168, 92) +
        jar(350, 772, 70, 108, V('4'), V('3')) +
        jar(438, 792, 58, 88, V('2'), V('4')) +
        'PLANT' +
        floorShadow(400, 900, 300) +
        ensoRing(668, 214, 92, 2.2);
    },

    manifiesto: function () {
      return '<rect x="40" y="120" width="720" height="700" rx="44" fill="' + V('5') + '" opacity=".6"/>' +
        '<rect x="40" y="120" width="720" height="230" rx="44" fill="url(#shSCENE)" opacity=".5"/>' +
        '<rect x="110" y="330" width="580" height="330" rx="34" fill="' + V('bg1') + '"/>' +
        '<rect x="110" y="330" width="580" height="330" rx="34" fill="none" stroke="' + V('ink') + '" stroke-opacity=".1" stroke-width="2.5"/>' +
        '<rect x="110" y="330" width="580" height="86" rx="34" fill="' + V('3') + '" opacity=".55"/>' +
        stack(160, 596, 138, 4, 21) +
        stack(324, 596, 128, 3, 5) +
        stack(472, 596, 150, 4, 9) +
        '<rect x="80" y="660" width="640" height="16" rx="8" fill="' + V('4') + '" opacity=".45"/>' +
        '<rect x="136" y="676" width="16" height="126" rx="8" fill="' + V('4') + '" opacity=".45"/>' +
        '<rect x="648" y="676" width="16" height="126" rx="8" fill="' + V('4') + '" opacity=".45"/>' +
        '<circle cx="152" cy="212" r="62" fill="' + V('2') + '" opacity=".8"/>' +
        '<circle cx="248" cy="186" r="36" fill="' + V('5') + '"/>' +
        'PLANT' +
        '<path d="M0 902 q200 -46 400 0 t400 0 v98 H0 z" fill="' + V('1') + '" opacity=".14"/>' +
        ensoRing(660, 240, 70, 2);
    },

    vestidor: function () {
      return niche(70, 80, 660, 820, 26, V('5'), 0.7) +
        rail(130, 660, 230) +
        garment(134, 238, 92, 218, V('2'), 0) +
        garment(240, 238, 100, 262, V('3'), 1) +
        garment(354, 238, 86, 200, V('4'), 2) +
        garment(452, 238, 98, 244, V('1'), 0) +
        garment(562, 238, 88, 216, V('3'), 1) +
        shelf(120, 600, 560) +
        stack(146, 742, 132, 4, 31) +
        stack(300, 742, 126, 3, 17) +
        '<rect x="470" y="620" width="140" height="120" rx="14" fill="' + V('2') + '" opacity=".85"/>' +
        '<rect x="470" y="620" width="140" height="120" rx="14" fill="none" stroke="' + V('ink') + '" stroke-opacity=".12" stroke-width="2"/>' +
        '<path d="M540 620 v120" stroke="' + V('ink') + '" stroke-opacity=".1" stroke-width="2"/>' +
        basket(600, 760, 100, 120) +
        'PLANT' +
        ensoRing(676, 156, 62, 2);
    },

    placard: function () {
      return '<rect x="84" y="90" width="632" height="820" rx="20" fill="' + V('5') + '" opacity=".7"/>' +
        '<rect x="84" y="90" width="632" height="820" rx="20" fill="none" stroke="' + V('ink') + '" stroke-opacity=".14" stroke-width="2.5"/>' +
        '<path d="M400 90 v820" stroke="' + V('ink') + '" stroke-opacity=".16" stroke-width="3"/>' +
        rail(160, 350, 250) +
        garment(164, 258, 84, 220, V('2'), 0) +
        garment(258, 258, 92, 250, V('3'), 1) +
        shelf(160, 560, 190) +
        stack(180, 700, 140, 4, 43) +
        shelf(450, 190, 210) +
        shelf(450, 380, 210) +
        shelf(450, 570, 210) +
        folded(468, 212, 96, V('2')) + folded(572, 212, 80, V('1')) +
        folded(468, 402, 104, V('3')) + folded(580, 402, 72, V('4')) +
        folded(468, 592, 84, V('2')) + folded(560, 592, 92, V('3')) +
        basket(462, 700, 186, 150) +
        '<path d="M170 800 h170" stroke="' + V('ink') + '" stroke-opacity=".14" stroke-width="3"/>' +
        floorShadow(400, 930, 290) +
        ensoRing(400, 130, 40, 2);
    },

    cocina: function () {
      var out = '<rect x="70" y="110" width="660" height="780" rx="26" fill="' + V('5') + '" opacity=".75"/>';
      out += '<path d="M110 330 h590 M110 570 h590" stroke="' + V('4') + '" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>';
      out += '<path d="M110 330 h590 M110 570 h590" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>';
      var caps = [V('1'), V('4'), V('3'), V('2'), V('1')];
      var bodies = [V('3'), V('2'), V('4'), V('3'), V('1')];
      for (var i = 0; i < 5; i++) out += jar(128 + i * 114, 214, 62, 108, bodies[i], caps[i]);
      for (var j = 0; j < 4; j++) out += jar(152 + j * 132, 452, 78, 110, bodies[(j + 2) % 5], caps[j]);
      out += basket(116, 642, 190, 150);
      out += stack(352, 776, 138, 3, 61);
      out += 'PLANT';
      out += ensoRing(632, 200, 52, 2);
      return out;
    },

    infantil: function () {
      return '<rect x="80" y="200" width="640" height="620" rx="30" fill="' + V('5') + '" opacity=".78"/>' +
        '<path d="M110 430 h580 M110 626 h580" stroke="' + V('4') + '" stroke-opacity=".45" stroke-width="10" stroke-linecap="round"/>' +
        basket(122, 250, 152, 160) +
        folded(304, 300, 94, V('1')) + folded(304, 322, 94, V('3')) +
        folded(412, 304, 94, V('2')) + folded(412, 326, 94, V('1')) +
        basket(532, 250, 160, 160) +
        '<circle cx="180" cy="520" r="54" fill="' + V('1') + '" opacity=".85"/>' +
        '<circle cx="252" cy="550" r="32" fill="' + V('5') + '"/>' +
        '<rect x="330" y="480" width="120" height="112" rx="16" fill="' + V('2') + '"/>' +
        '<rect x="470" y="490" width="150" height="102" rx="18" fill="' + V('3') + '" opacity=".85"/>' +
        '<rect x="130" y="666" width="180" height="132" rx="16" fill="' + V('4') + '" opacity=".45"/>' +
        '<rect x="340" y="676" width="120" height="120" rx="14" fill="' + V('2') + '"/>' +
        '<rect x="490" y="656" width="150" height="140" rx="16" fill="' + V('3') + '" opacity=".5"/>' +
        '<path d="M566 344 q40 -46 80 0" fill="none" stroke="' + V('4') + '" stroke-width="4" stroke-linecap="round"/>';
    },

    lavadero: function () {
      return '<rect x="70" y="120" width="660" height="780" rx="24" fill="' + V('5') + '" opacity=".75"/>' +
        '<path d="M110 252 h580" stroke="' + V('4') + '" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>' +
        jar(132, 154, 60, 88, V('3'), V('1')) +
        jar(210, 164, 54, 78, V('2'), V('4')) +
        basket(304, 142, 140, 100) +
        folded(476, 164, 92, V('3')) + folded(476, 186, 92, V('2')) +
        '<rect x="120" y="386" width="264" height="330" rx="24" fill="' + V('3') + '"/>' +
        '<circle cx="252" cy="552" r="86" fill="' + V('bg1') + '" opacity=".95"/>' +
        '<circle cx="252" cy="552" r="62" fill="' + V('2') + '" opacity=".8"/>' +
        '<path d="M252 500 a52 52 0 0 1 40 84" fill="none" stroke="' + V('1') + '" stroke-width="6" stroke-linecap="round"/>' +
        '<rect x="142" y="408" width="220" height="24" rx="12" fill="' + V('bg1') + '" opacity=".6"/>' +
        '<rect x="424" y="476" width="220" height="240" rx="22" fill="' + V('2') + '" opacity=".9"/>' +
        '<path d="M446 528 h176 M446 578 h176 M446 628 h176" stroke="' + V('ink') + '" stroke-opacity=".1" stroke-width="3"/>' +
        basket(470, 744, 160, 118) +
        'PLANT' +
        floorShadow(400, 910, 285);
    },

    cta: function () {
      return '<rect x="120" y="250" width="560" height="450" rx="30" fill="' + V('3') + '" opacity=".55"/>' +
        '<rect x="150" y="280" width="500" height="390" rx="20" fill="' + V('bg1') + '"/>' +
        '<rect x="150" y="280" width="500" height="390" rx="20" fill="none" stroke="' + V('ink') + '" stroke-opacity=".1" stroke-width="2"/>' +
        stack(190, 566, 118, 4, 71) +
        stack(322, 566, 118, 3, 73) +
        stack(452, 566, 118, 4, 79) +
        '<rect x="150" y="606" width="500" height="6" rx="3" fill="' + V('4') + '" opacity=".35"/>' +
        '<circle cx="400" cy="170" r="72" fill="' + V('1') + '" opacity=".3"/>' +
        'PLANT' +
        ensoRing(400, 172, 132, 2.2);
    },

    'galeria-vestidor': function () {
      return '<rect x="50" y="60" width="700" height="880" rx="22" fill="' + V('5') + '" opacity=".75"/>' +
        rail(120, 690, 220) +
        garment(124, 228, 84, 214, V('2'), 0) +
        garment(214, 228, 90, 250, V('3'), 1) +
        garment(310, 228, 78, 196, V('4'), 2) +
        garment(392, 228, 92, 240, V('1'), 0) +
        garment(490, 228, 82, 210, V('3'), 1) +
        garment(578, 228, 88, 232, V('2'), 2) +
        shelf(120, 574, 560) +
        stack(146, 730, 126, 4, 101) +
        stack(294, 730, 126, 3, 103) +
        stack(440, 730, 126, 4, 107) +
        basket(596, 700, 84, 140) +
        '<rect x="120" y="610" width="180" height="104" rx="12" fill="' + V('2') + '" opacity=".8"/>' +
        floorShadow(400, 950, 320);
    },

    'galeria-vestidor-antes': function () {
      return '<rect x="50" y="60" width="700" height="880" rx="22" fill="' + V('5') + '" opacity=".75"/>' +
        '<path d="M110 220 h580" stroke="' + V('ink') + '" stroke-opacity=".34" stroke-width="7" stroke-linecap="round"/>' +
        '<g opacity=".95">' +
        garment(96, 226, 76, 200, V('mess'), 0) +
        garment(158, 262, 82, 220, V('3'), 1) +
        garment(252, 216, 88, 208, V('mess'), 2) +
        garment(326, 272, 74, 190, V('5'), 0) +
        garment(408, 222, 92, 246, V('mess'), 1) +
        garment(498, 268, 78, 200, V('2'), 2) +
        garment(572, 212, 88, 234, V('mess'), 0) +
        garment(628, 276, 68, 188, V('3'), 1) +
        '</g>' +
        '<rect x="120" y="560" width="560" height="10" rx="5" fill="' + V('4') + '" opacity=".4"/>' +
        stack(130, 760, 136, 5, 111) +
        folded(286, 704, 126, V('mess')) + folded(276, 726, 116, V('2')) + folded(282, 748, 120, V('3')) +
        folded(424, 692, 132, V('3')) + folded(444, 714, 122, V('mess')) + folded(414, 736, 112, V('5')) +
        basket(568, 660, 100, 160) +
        '<rect x="120" y="600" width="160" height="104" rx="12" fill="' + V('mess') + '" opacity=".4" transform="rotate(-4 200 650)"/>' +
        '<circle cx="258" cy="646" r="22" fill="' + V('mess') + '" opacity=".55"/>' +
        '<circle cx="520" cy="640" r="14" fill="' + V('4') + '" opacity=".35"/>' +
        floorShadow(400, 950, 320);
    },

    'galeria-placard': function () {
      return '<rect x="84" y="80" width="632" height="840" rx="18" fill="' + V('5') + '" opacity=".75"/>' +
        '<rect x="84" y="80" width="632" height="840" rx="18" fill="none" stroke="' + V('ink') + '" stroke-opacity=".12" stroke-width="2.5"/>' +
        '<path d="M400 80 v840" stroke="' + V('ink') + '" stroke-opacity=".14" stroke-width="3"/>' +
        rail(160, 352, 244) +
        garment(164, 252, 82, 216, V('2'), 0) +
        garment(258, 252, 90, 246, V('1'), 1) +
        shelf(160, 556, 190) +
        stack(180, 720, 148, 4, 127) +
        shelf(450, 170, 210) + shelf(450, 360, 210) + shelf(450, 550, 210) +
        folded(468, 192, 92, V('2')) + folded(570, 192, 80, V('4')) +
        folded(468, 382, 86, V('1')) + folded(566, 382, 84, V('3')) +
        folded(468, 572, 90, V('3')) + folded(568, 572, 82, V('2')) +
        basket(460, 700, 200, 160) +
        ensoRing(634, 118, 44, 2);
    },

    'galeria-cocina': function () {
      var out = '<rect x="80" y="140" width="640" height="720" rx="22" fill="' + V('5') + '" opacity=".78"/>';
      out += '<path d="M110 340 h580 M110 580 h580" stroke="' + V('4') + '" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>';
      for (var i = 0; i < 5; i++) out += jar(128 + i * 114, 226, 62, 104, [V('3'), V('2'), V('4'), V('3'), V('1')][i], [V('1'), V('4'), V('3'), V('2'), V('4')][i]);
      for (var j = 0; j < 4; j++) out += jar(158 + j * 132, 458, 78, 110, [V('4'), V('3'), V('2'), V('3')][j], [V('1'), V('2'), V('4'), V('3')][j]);
      out += basket(118, 660, 190, 148) + stack(356, 784, 148, 2, 131) + 'PLANT';
      return out;
    },

    'galeria-infantil': function () {
      return '<rect x="90" y="210" width="620" height="620" rx="28" fill="' + V('5') + '" opacity=".78"/>' +
        '<path d="M120 448 h560 M120 636 h560" stroke="' + V('4') + '" stroke-opacity=".45" stroke-width="10" stroke-linecap="round"/>' +
        basket(130, 262, 160, 160) + basket(320, 262, 150, 160) + basket(502, 262, 168, 160) +
        '<rect x="140" y="488" width="140" height="120" rx="14" fill="' + V('2') + '"/>' +
        '<circle cx="382" cy="548" r="50" fill="' + V('1') + '" opacity=".8"/>' +
        '<rect x="462" y="478" width="150" height="130" rx="16" fill="' + V('3') + '" opacity=".85"/>' +
        '<rect x="160" y="676" width="170" height="130" rx="16" fill="' + V('4') + '" opacity=".45"/>' +
        '<rect x="382" y="686" width="120" height="120" rx="14" fill="' + V('2') + '"/>';
    }
  };

  /* coloca la planta en el lugar correcto de cada escena */
  var PLANT_AT = {
    hero: [600, 806, 1.05],
    manifiesto: [596, 268, 0.95],
    vestidor: [110, 830, 0.9],
    cocina: [566, 752, 1.05],
    lavadero: [126, 786, 0.95],
    cta: [596, 648, 1.05],
    'galeria-cocina': [580, 762, 1]
  };

  function pick(key) {
    return SCENES[key] ? key : 'hero';
  }

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
    return h;
  }

  function render(key) {
    var k = pick(key);
    var id = 'k' + Math.abs(hash(k)).toString(36);
    var body = SCENES[k]();
    var at = PLANT_AT[k];
    if (body.indexOf('PLANT') >= 0) {
      body = body.split('PLANT').join(at ? plant(at[0], at[1], at[2]) : '');
    }
    body = body.split('SCENE').join(id);
    return '<svg class="art" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false">' +
      defs(id) +
      '<rect width="800" height="1000" fill="url(#bg' + id + ')"/>' +
      body +
      '</svg>';
  }

  function image(src, alt, cls) {
    if (!src) {
      return '<div class="img-empty ' + (cls || '') + '"><span>Sin imagen</span></div>';
    }
    if (String(src).indexOf('art:') === 0) {
      return render(String(src).slice(4));
    }
    return '<img class="art ' + (cls || '') + '" src="' + String(src).replace(/"/g, '&quot;') + '" alt="' +
      String(alt || '').replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">';
  }

  var API = { render: render, image: image, scenes: SCENES };
  if (typeof window !== 'undefined') window.KandoArt = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
