/* Proje asamasi ve asamayi anlatan 2B animasyonlu sahne.
   Sahne saf SVG + CSS animasyonudur; harici kutuphane kullanmaz. */
window.Asama = (function () {

  /* Ilerleme yuzdesine gore insaat asamalari */
  const ASAMALAR = [
    { id: 'hazirlik', ad: 'Hazırlık ve Kazı',    alt: 0,  ust: 12,
      aciklama: 'Şantiye kurulumu, hafriyat ve zemin hazırlığı' },
    { id: 'temel',    ad: 'Temel ve Perde',      alt: 12, ust: 30,
      aciklama: 'Grobeton, radye temel ve bodrum perdeleri' },
    { id: 'kaba',     ad: 'Kaba Yapı',           alt: 30, ust: 55,
      aciklama: 'Kolon, kiriş ve döşeme betonarme imalatı' },
    { id: 'cephe',    ad: 'Cephe ve Çatı',       alt: 55, ust: 72,
      aciklama: 'Duvar örgüsü, mantolama, doğrama ve çatı' },
    { id: 'ince',     ad: 'İnce İşler',          alt: 72, ust: 90,
      aciklama: 'Sıva, şap, kaplama, mekanik ve elektrik tesisatı' },
    { id: 'teslim',   ad: 'Teslime Hazırlık',    alt: 90, ust: 101,
      aciklama: 'Son kontroller, temizlik, kabul ve teslim' }
  ];

  const asamaBul = (ilerleme) =>
    ASAMALAR.find((a) => ilerleme >= a.alt && ilerleme < a.ust) || ASAMALAR[ASAMALAR.length - 1];

  /* ---------------------------------------------------------- sahneler */
  /* Ortak zemin: saha çizgisi ve ızgara */
  const zemin = `
    <defs>
      <linearGradient id="asGok" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,.35)"/>
      </linearGradient>
      <linearGradient id="asBeton" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d9d5d0"/><stop offset="100%" stop-color="#bdb8b1"/>
      </linearGradient>
      <linearGradient id="asVurgu" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff7a4d"/><stop offset="100%" stop-color="#f0421c"/>
      </linearGradient>
      <pattern id="asTarama" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(23,22,26,.16)" stroke-width="1.4"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="640" height="330" fill="url(#asGok)"/>
    <line x1="30" y1="286" x2="610" y2="286" stroke="rgba(23,22,26,.3)" stroke-width="2"/>
    <g stroke="rgba(23,22,26,.08)" stroke-width="1">
      ${[70, 110, 150, 190, 230, 270].map((y) => `<line x1="30" y1="${y}" x2="610" y2="${y}"/>`).join('')}
    </g>`;

  /* Her sahne kendi animasyonunu CSS sinifiyla surdurur */
  /* Her sahnede yapi KALICI cizilir; yalnizca ekipman ve isaretler animasyonludur.
     Boylece dongu tekrar ettiginde bina yanip sonmez. */
  const SAHNE = {
    /* --- Hazırlık ve kazı: ekskavatör kepçesi çalışır, kamyon geçer --- */
    hazirlik: `
      <path d="M120 286 q40 -30 92 -6 q34 16 70 2 q40 -16 84 4 l0 6 z"
            fill="url(#asTarama)"/>
      <path d="M120 286 q40 -30 92 -6 q34 16 70 2 q40 -16 84 4"
            fill="none" stroke="rgba(23,22,26,.35)" stroke-width="2"/>
      <g class="as-kamyon">
        <rect x="360" y="240" width="84" height="32" rx="5" fill="#2c2a30"/>
        <rect x="444" y="248" width="32" height="24" rx="4" fill="url(#asVurgu)"/>
        <circle cx="382" cy="277" r="10" fill="#17161a"/><circle cx="382" cy="277" r="4" fill="#8b8792"/>
        <circle cx="458" cy="277" r="10" fill="#17161a"/><circle cx="458" cy="277" r="4" fill="#8b8792"/>
      </g>
      <g>
        <rect x="150" y="230" width="92" height="42" rx="7" fill="#2c2a30"/>
        <rect x="162" y="238" width="34" height="20" rx="3" fill="#8fb7d6" opacity=".8"/>
        <rect x="140" y="272" width="112" height="12" rx="6" fill="#17161a"/>
        <circle cx="164" cy="278" r="7" fill="#3a373f"/><circle cx="196" cy="278" r="7" fill="#3a373f"/>
        <circle cx="228" cy="278" r="7" fill="#3a373f"/>
        <g class="as-kol">
          <rect x="238" y="222" width="86" height="11" rx="5" fill="url(#asVurgu)"/>
          <g class="as-kepce">
            <path d="M318 226 l30 16 l-10 26 l-30 -20 z" fill="#2c2a30"/>
            <path d="M320 262 l22 6" stroke="#17161a" stroke-width="4" stroke-linecap="round"/>
          </g>
        </g>
      </g>
      <g class="as-toz">
        <ellipse cx="352" cy="276" rx="16" ry="7" fill="rgba(23,22,26,.13)"/>
        <ellipse cx="374" cy="270" rx="10" ry="5" fill="rgba(23,22,26,.09)"/>
      </g>
      <g class="as-kazik" stroke="rgba(23,22,26,.4)" stroke-width="2" stroke-dasharray="5 5">
        <line x1="470" y1="286" x2="470" y2="238"/><line x1="520" y1="286" x2="520" y2="238"/>
        <line x1="460" y1="238" x2="530" y2="238"/>
      </g>`,

    /* --- Temel ve perde: mikser döner, beton akar, donatı işaretlenir --- */
    temel: `
      <rect x="150" y="248" width="360" height="38" fill="url(#asBeton)"/>
      <rect x="150" y="248" width="360" height="6" fill="rgba(23,22,26,.2)"/>
      <g stroke="rgba(240,66,28,.85)" stroke-width="2.5">
        ${[178, 214, 250, 286, 322, 358, 394, 430, 466].map((x) =>
          `<line x1="${x}" y1="248" x2="${x}" y2="222"/>`).join('')}
        <line x1="168" y1="230" x2="478" y2="230"/>
      </g>
      <g class="as-donati-parla">
        ${[214, 322, 430].map((x) => `<circle cx="${x}" cy="222" r="5" fill="url(#asVurgu)"/>`).join('')}
      </g>
      <rect x="150" y="212" width="10" height="76" fill="#2c2a30"/>
      <rect x="500" y="212" width="10" height="76" fill="#2c2a30"/>
      <g>
        <rect x="70" y="206" width="64" height="30" rx="5" fill="#2c2a30"/>
        <rect x="80" y="212" width="26" height="16" rx="3" fill="#8fb7d6" opacity=".8"/>
        <g class="as-tambur">
          <ellipse cx="168" cy="208" rx="40" ry="27" fill="url(#asVurgu)"/>
          <path d="M136 194 l64 26 M138 220 l62 -26" stroke="rgba(255,255,255,.55)" stroke-width="2.5"/>
        </g>
        <circle cx="96" cy="246" r="11" fill="#17161a"/><circle cx="132" cy="246" r="11" fill="#17161a"/>
        <circle cx="176" cy="246" r="11" fill="#17161a"/>
        <path d="M196 222 l26 20" stroke="#2c2a30" stroke-width="7" stroke-linecap="round"/>
        <g class="as-akis">
          <circle cx="226" cy="248" r="4.5" fill="#c9c5c0"/>
          <circle cx="226" cy="248" r="3.5" fill="#c9c5c0" style="animation-delay:.45s"/>
        </g>
      </g>`,

    /* --- Kaba yapı: katlar kalıcı, en üst kat dökülüyor; vinç çalışır --- */
    kaba: `
      <rect x="150" y="270" width="330" height="16" fill="#b3aea7"/>
      ${[230, 194, 158].map((y) => `
        <rect x="176" y="${y}" width="278" height="36" fill="url(#asBeton)"/>
        <rect x="176" y="${y}" width="278" height="5" fill="rgba(23,22,26,.22)"/>`).join('')}
      <g stroke="#9a948c" stroke-width="7">
        <line x1="190" y1="158" x2="190" y2="270"/><line x1="315" y1="158" x2="315" y2="270"/>
        <line x1="440" y1="158" x2="440" y2="270"/>
      </g>
      <g class="as-yeni-kat">
        <rect x="176" y="122" width="278" height="36" fill="url(#asBeton)" opacity=".55"/>
        <rect x="176" y="122" width="278" height="36" fill="url(#asTarama)" opacity=".5"/>
        <g stroke="url(#asVurgu)" stroke-width="2">
          ${[206, 246, 286, 326, 366, 406].map((x) =>
            `<line x1="${x}" y1="122" x2="${x}" y2="104"/>`).join('')}
        </g>
      </g>
      <g>
        <line x1="524" y1="286" x2="524" y2="72" stroke="#2c2a30" stroke-width="7"/>
        <path d="M518 286 l6 -18 l6 18 z" fill="#2c2a30"/>
        <g class="as-bom">
          <line x1="300" y1="72" x2="596" y2="72" stroke="url(#asVurgu)" stroke-width="7"/>
          <line x1="524" y1="72" x2="524" y2="40" stroke="#2c2a30" stroke-width="4"/>
          <path d="M300 72 L524 40 L596 72" fill="none" stroke="#2c2a30" stroke-width="2.5"/>
          <rect x="560" y="64" width="30" height="16" rx="3" fill="#2c2a30"/>
          <g class="as-yuk">
            <line x1="340" y1="72" x2="340" y2="96" stroke="#2c2a30" stroke-width="2"/>
            <rect x="318" y="96" width="44" height="18" rx="3" fill="url(#asVurgu)"/>
            <rect x="318" y="96" width="44" height="18" rx="3" fill="url(#asTarama)" opacity=".35"/>
          </g>
        </g>
      </g>`,

    /* --- Cephe ve çatı: bina kalıcı, camlar sırayla ışıldar, iskele durur --- */
    cephe: `
      <rect x="180" y="118" width="264" height="168" fill="url(#asBeton)"/>
      <polygon points="166,118 312,64 458,118" fill="#2c2a30"/>
      <rect x="180" y="270" width="264" height="16" fill="#b3aea7"/>
      <g>
        ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) =>
          `<rect class="as-cam" style="--i:${r * 4 + c}" x="${196 + c * 62}" y="${134 + r * 38}"
             width="46" height="26" rx="2" fill="#8fb7d6"/>`).join('')).join('')}
      </g>
      <g>
        <rect x="444" y="118" width="30" height="168" fill="url(#asVurgu)" opacity=".85"/>
        <rect x="444" y="118" width="30" height="168" fill="url(#asTarama)" opacity=".45"/>
        <g class="as-dubel" fill="#fff" opacity=".85">
          ${[150, 190, 230, 262].map((y) => `<circle cx="459" cy="${y}" r="3.5"/>`).join('')}
        </g>
      </g>
      <g stroke="#6f6a63" stroke-width="3" opacity=".7">
        <line x1="164" y1="112" x2="164" y2="286"/><line x1="482" y1="112" x2="482" y2="286"/>
        ${[150, 194, 238, 276].map((y) => `<line x1="164" y1="${y}" x2="482" y2="${y}"/>`).join('')}
      </g>
      <g class="as-asansor">
        <rect x="486" y="180" width="34" height="40" rx="4" fill="#2c2a30"/>
        <line x1="503" y1="112" x2="503" y2="286" stroke="#6f6a63" stroke-width="2"/>
      </g>`,

    /* --- İnce işler: mahal kalıcı, rulo gezer, tesisat akar, priz yanar --- */
    ince: `
      <rect x="150" y="96" width="350" height="190" fill="#fff" opacity=".6"/>
      <rect x="150" y="266" width="350" height="20" fill="url(#asBeton)"/>
      <rect x="150" y="96" width="350" height="190" fill="none"
            stroke="rgba(23,22,26,.3)" stroke-width="3"/>
      <rect x="168" y="112" width="164" height="154" fill="url(#asVurgu)" opacity=".2"/>
      <rect x="168" y="112" width="164" height="154" fill="none" stroke="url(#asVurgu)"
            stroke-width="1.5" opacity=".5"/>
      <g class="as-rulo">
        <rect x="300" y="150" width="50" height="18" rx="4" fill="url(#asVurgu)"/>
        <path d="M325 168 l0 28 l24 18" stroke="#2c2a30" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <g stroke="#3b6fd4" stroke-width="4" fill="none" stroke-linecap="round">
        <path d="M378 266 L378 176 L446 176" stroke-dasharray="9 9" class="as-akar"/>
      </g>
      <g fill="#2c2a30">
        <rect x="438" y="164" width="26" height="26" rx="4"/>
        <circle cx="451" cy="177" r="4.5" fill="#fff" class="as-yanip"/>
      </g>
      <g>
        <rect x="440" y="196" width="46" height="70" rx="3" fill="#a9835f"/>
        <rect x="444" y="202" width="38" height="28" rx="2" fill="rgba(255,255,255,.25)"/>
        <circle cx="478" cy="232" r="3" fill="#f6f4f2"/>
      </g>
      <g class="as-fayans">
        ${[0, 1, 2, 3, 4, 5].map((i) => `<rect style="--i:${i}" x="${176 + i * 30}" y="238"
          width="26" height="26" rx="2" fill="#cfd8dd" stroke="rgba(23,22,26,.15)"/>`).join('')}
      </g>`,

    /* --- Teslim: bina tamam, onay işareti ve konfeti --- */
    teslim: `
      <rect x="180" y="118" width="264" height="168" fill="url(#asBeton)"/>
      <polygon points="166,118 312,64 458,118" fill="#2c2a30"/>
      <rect x="180" y="270" width="264" height="16" fill="#b3aea7"/>
      ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) =>
        `<rect x="${196 + c * 62}" y="${134 + r * 38}" width="46" height="26" rx="2"
           fill="#8fb7d6" opacity=".92"/>`).join('')).join('')}
      <rect x="288" y="222" width="48" height="64" rx="3" fill="#a9835f"/>
      <circle cx="326" cy="256" r="3.5" fill="#f6f4f2"/>
      <g class="as-onay">
        <circle cx="512" cy="150" r="44" fill="url(#asVurgu)" opacity=".15"/>
        <circle cx="512" cy="150" r="31" fill="url(#asVurgu)"/>
        <path d="M497 150 l11 12 l21 -24" stroke="#fff" stroke-width="5.5" fill="none"
              stroke-linecap="round" stroke-linejoin="round" class="as-tik"/>
      </g>
      <g class="as-konfeti">
        ${[[206, 96, 0], [258, 74, 1], [326, 90, 2], [386, 70, 3], [430, 98, 4], [176, 80, 5]].map(
          ([x, y, i]) => `<rect x="${x}" y="${y}" width="7" height="11" rx="2"
            style="--i:${i}" fill="${i % 2 ? '#f0421c' : '#2c2a30'}"/>`).join('')}
      </g>`
  };

  /* Asama sahnesini ve ilerleme seridini uretir */
  function sahne(proje) {
    const ilerleme = proje ? proje.ilerleme : 0;
    const a = asamaBul(ilerleme);
    return `
      <div class="asama-sahne" data-asama="${a.id}">
        <svg viewBox="0 0 640 330" role="img"
             aria-label="${a.ad} aşaması: ${a.aciklama}">
          ${zemin}
          ${SAHNE[a.id]}
        </svg>
      </div>`;
  }

  return { ASAMALAR, asamaBul, sahne };
})();
