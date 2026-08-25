/* Ortak UI yardimcilari: ikonlar, bicimlendirme, SVG grafikler */
window.UI = (function () {

  /* --------------------------------------------------------------- ikon */
  const PATHS = {
    grid:     '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    layers:   '<path d="M12 2 2 7l10 5 10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    ruler:    '<path d="M3 8h18v8H3z"/><path d="M7 8v4M11 8v4M15 8v4M19 8v4"/>',
    users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    receipt:  '<path d="M5 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    box:      '<path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    truck:    '<path d="M1 5h13v11H1z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
    report:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    upload:   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 9 5-5 5 5"/><path d="M12 4v12"/>',
    check:    '<path d="m20 6-11 11-5-5"/>',
    arrowUR:  '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    left:     '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    right:    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    down:     '<path d="m6 9 6 6 6-6"/>',
    filter:   '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    dots:     '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    building: '<path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M15 9h2a2 2 0 0 1 2 2v10"/><path d="M9 7h2M9 11h2M9 15h2"/>',
    briefcase:'<path d="M3 7h18v13H3z"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    trend:    '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    trendDown:'<path d="m3 7 6 6 4-4 8 8"/><path d="M21 17h-6v-6"/>',
    alert:    '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bell:     '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V1a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 17 2.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    file:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    send:     '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    lock:     '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
  };

  function icon(name, cls) {
    const d = PATHS[name] || PATHS.file;
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }

  /* ------------------------------------------------------ bicimlendirme */
  const nf = new Intl.NumberFormat('tr-TR');
  const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const num = (v) => nf.format(Math.round(v || 0));
  const num2 = (v) => nf2.format(v || 0);
  const money = (v) => '₺' + nf.format(Math.round(v || 0));

  function moneyShort(v) {
    v = v || 0;
    const kisa = (x) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: x >= 10 ? 0 : 1 }).format(x);
    if (v >= 1e9) return '₺' + kisa(v / 1e9) + ' mlr';
    if (v >= 1e6) return '₺' + kisa(v / 1e6) + ' mn';
    if (v >= 1e3) return '₺' + nf.format(Math.round(v / 1e3)) + ' bin';
    return money(v);
  }

  const pct = (v) => '%' + nf.format(Math.round(v || 0));

  /* ------------------------------------------------------------- donut */
  function donut(value, opts) {
    opts = opts || {};
    const size = opts.size || 96;
    const stroke = opts.stroke || 7;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
    const col = opts.color || 'url(#donutGrad)';
    return `
      <div class="donut" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <defs>
            <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ff7a4d"/><stop offset="100%" stop-color="#f0421c"/>
            </linearGradient>
          </defs>
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
                  stroke="#eceae7" stroke-width="${stroke}"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
                  stroke="${col}" stroke-width="${stroke}" stroke-linecap="round"
                  stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
        </svg>
        <div class="label"><b>%${Math.round(value)}</b><span>${opts.caption || ''}</span></div>
      </div>`;
  }

  /* ------------------------------- yay grafik (referans hero grafigi) --- */
  function arcChart(series) {
    const W = 780, H = 340, cx = W / 2, cy = 302;
    const n = series.length;
    const rMin = 78, rMax = 268;
    const bands = series.map((s, i) => ({ ...s, i, r: rMin + (rMax - rMin) * (i / (n - 1)) }));

    let out = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Yillara gore hakedis hacmi">
      <defs>
        <linearGradient id="arcG" x1="0.1" y1="1" x2="0.85" y2="0.05">
          <stop offset="0%" stop-color="#ffe7de"/>
          <stop offset="42%" stop-color="#ffa987"/>
          <stop offset="100%" stop-color="#ef3f19"/>
        </linearGradient>
        <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#c4c0bb" stroke-width=".9"/>
        </pattern>
      </defs>`;

    /* disdan ice: en genis yay en koyu, en ictekisi taramali */
    bands.slice().reverse().forEach((b) => {
      const ic = b.i === 0;
      out += `<path d="M ${cx - b.r} ${cy} A ${b.r} ${b.r} 0 0 1 ${cx + b.r} ${cy} Z"
                fill="${ic ? 'url(#hatch)' : 'url(#arcG)'}"
                opacity="${ic ? 1 : (0.42 + 0.19 * b.i).toFixed(2)}"/>`;
      out += `<path d="M ${cx - b.r} ${cy} A ${b.r} ${b.r} 0 0 1 ${cx + b.r} ${cy}"
                fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.1"/>`;
    });

    /* etiketler: yay tepesinde, ic yaylarda hafif sola kacik */
    bands.forEach((b) => {
      const dx = b.i === n - 1 ? 0 : -34 - b.i * 6;
      out += `<circle cx="${(cx + dx).toFixed(0)}" cy="${cy - b.r}" r="3" fill="#ef3f19"/>`;
      out += `<text x="${(cx + dx).toFixed(0)}" y="${cy - b.r - 12}" text-anchor="middle"
                font-size="15" fill="#17161a" font-weight="500">${b.etiket}</text>`;
    });

    out += `<line x1="${cx - rMax - 20}" y1="${cy}" x2="${cx + rMax + 20}" y2="${cy}"
              stroke="rgba(23,22,26,.12)"/>`;
    out += `<text x="${cx - rMax - 20}" y="${cy + 21}" font-size="12" fill="#8b8792">${series[0].yil}</text>`;
    out += `<text x="${cx + rMax + 20}" y="${cy + 21}" font-size="12" fill="#8b8792"
              text-anchor="end">${series[n - 1].yil}</text>`;
    out += `</svg>`;
    return out;
  }

  /* ------------------------------------------------- basit cizgi grafik */
  function lineChart(values, opts) {
    opts = opts || {};
    const W = opts.width || 520, H = opts.height || 150, p = 8;
    const max = Math.max.apply(null, values) * 1.1 || 1;
    const step = (W - p * 2) / (values.length - 1);
    const pts = values.map((v, i) => [p + i * step, H - p - (v / max) * (H - p * 2)]);
    const line = pts.map((pt, i) => (i ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1)).join(' ');
    const area = line + ` L ${W - p} ${H - p} L ${p} ${H - p} Z`;
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
      <defs><linearGradient id="lineG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(240,66,28,.22)"/>
        <stop offset="100%" stop-color="rgba(240,66,28,0)"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#lineG)"/>
      <path d="${line}" fill="none" stroke="#f0421c" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((pt) => `<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="2.6" fill="#fff" stroke="#f0421c" stroke-width="1.6"/>`).join('')}
    </svg>`;
  }

  /* ----------------------------------------------------- sutun grafik */
  function barChart(items, opts) {
    opts = opts || {};
    const max = Math.max.apply(null, items.map((i) => i.value)) || 1;
    return `<div style="display:flex;align-items:flex-end;gap:10px;height:${opts.height || 130}px">
      ${items.map((it) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
          <span style="font-size:10.5px;color:#8b8792">${it.short || ''}</span>
          <div title="${it.label}" style="width:100%;border-radius:8px;height:${(it.value / max) * 78}%;
            background:${it.color || 'linear-gradient(180deg,#ff7a4d,#f0421c)'}"></div>
          <span style="font-size:10.5px;color:#4a4750">${it.label}</span>
        </div>`).join('')}
    </div>`;
  }

  /* --------------------------------------------------------------- misc */
  function badge(text, kind) { return `<span class="badge ${kind || ''}">${text}</span>`; }

  function bar(value, kind) {
    return `<div class="bar-row"><div class="bar ${kind || ''}"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></div><b>%${Math.round(value)}</b></div>`;
  }

  let toastTimer;
  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  return { icon, num, num2, money, moneyShort, pct, donut, arcChart, lineChart, barChart, badge, bar, toast };
})();
