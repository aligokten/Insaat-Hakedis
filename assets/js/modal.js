/* Diyalog ve form bileseni: UI.modal / UI.form / UI.onay */
(function () {
  const UI = window.UI;

  function kapat(kutu) {
    kutu.classList.remove('acik');
    setTimeout(() => kutu.remove(), 180);
    document.removeEventListener('keydown', kutu._esc);
  }

  /* icerik: HTML metni. dugmeler: [{ad, tur, deger}] -> secilen degeri dondurur */
  function modal(opts) {
    return new Promise((cozumle) => {
      const kutu = document.createElement('div');
      kutu.className = 'modal-katman';
      kutu.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="${opts.baslik || ''}">
          <div class="modal-bas">
            <h3>${opts.baslik || ''}</h3>
            ${opts.aciklama ? `<p>${opts.aciklama}</p>` : ''}
            <button class="modal-kapat" aria-label="Kapat">&times;</button>
          </div>
          <div class="modal-govde">${opts.icerik || ''}</div>
          <div class="modal-alt">
            ${(opts.dugmeler || [{ ad: 'Kapat', deger: null }]).map((d, i) =>
              `<button class="btn ${d.tur || 'ghost'}" data-i="${i}">${d.ad}</button>`).join('')}
          </div>
        </div>`;
      document.body.appendChild(kutu);
      requestAnimationFrame(() => kutu.classList.add('acik'));

      const bitir = (deger) => { kapat(kutu); cozumle(deger); };

      kutu._esc = (e) => { if (e.key === 'Escape') bitir(null); };
      document.addEventListener('keydown', kutu._esc);
      kutu.querySelector('.modal-kapat').addEventListener('click', () => bitir(null));
      kutu.addEventListener('mousedown', (e) => { if (e.target === kutu) bitir(null); });

      (opts.dugmeler || []).forEach((d, i) => {
        kutu.querySelector(`[data-i="${i}"]`).addEventListener('click', () => {
          if (d.oncePolitika && d.oncePolitika(kutu) === false) return;
          bitir(typeof d.deger === 'function' ? d.deger(kutu) : (d.deger === undefined ? true : d.deger));
        });
      });

      if (opts.hazir) opts.hazir(kutu, bitir);
      const ilk = kutu.querySelector('input, select, textarea');
      if (ilk) setTimeout(() => ilk.focus(), 120);
    });
  }

  function alanHTML(a) {
    const ad = `f_${a.ad}`;
    const ortak = `id="${ad}" name="${a.ad}" ${a.zorunlu ? 'required' : ''} ${a.salt ? 'readonly' : ''}`;
    let girdi;
    if (a.tur === 'secim') {
      girdi = `<select ${ortak}>${a.secenekler.map((s) => {
        const d = typeof s === 'string' ? { deger: s, ad: s } : s;
        return `<option value="${d.deger}" ${String(d.deger) === String(a.deger) ? 'selected' : ''}>${d.ad}</option>`;
      }).join('')}</select>`;
    } else if (a.tur === 'metin-uzun') {
      girdi = `<textarea ${ortak} rows="3">${a.deger || ''}</textarea>`;
    } else {
      girdi = `<input type="${a.tur || 'text'}" ${ortak} value="${a.deger !== undefined ? a.deger : ''}"
        ${a.adim ? `step="${a.adim}"` : ''} ${a.min !== undefined ? `min="${a.min}"` : ''}
        ${a.ipucu ? `placeholder="${a.ipucu}"` : ''}>`;
    }
    return `<label class="alan ${a.genis ? 'genis' : ''}">
      <span>${a.etiket}${a.zorunlu ? ' *' : ''}</span>${girdi}
      ${a.not ? `<em>${a.not}</em>` : ''}</label>`;
  }

  /* alanlar: [{ad, etiket, tur, deger, secenekler, zorunlu, genis}] */
  function form(opts) {
    const icerik = `<div class="form-izgara">${opts.alanlar.map(alanHTML).join('')}</div>` +
                   (opts.ek || '');
    return modal({
      baslik: opts.baslik,
      aciklama: opts.aciklama,
      icerik,
      hazir: opts.hazir,
      dugmeler: [
        { ad: 'Vazgeç', deger: null },
        {
          ad: opts.kaydetEtiketi || 'Kaydet', tur: 'accent',
          oncePolitika: (kutu) => {
            const f = kutu.querySelector('.modal-govde');
            const eksik = [...f.querySelectorAll('[required]')].find((el) => !String(el.value).trim());
            if (eksik) { eksik.focus(); eksik.classList.add('hatali');
              setTimeout(() => eksik.classList.remove('hatali'), 1200);
              UI.toast('Zorunlu alanları doldurun.'); return false; }
            return true;
          },
          deger: (kutu) => {
            const cikti = {};
            opts.alanlar.forEach((a) => {
              const el = kutu.querySelector(`#f_${a.ad}`);
              cikti[a.ad] = (a.tur === 'number') ? Number(el.value) : el.value;
            });
            if (opts.topla) Object.assign(cikti, opts.topla(kutu));
            return cikti;
          }
        }
      ]
    });
  }

  function onay(baslik, mesaj, onayEtiketi) {
    return modal({
      baslik, icerik: `<p class="modal-metin">${mesaj}</p>`,
      dugmeler: [{ ad: 'Vazgeç', deger: false },
                 { ad: onayEtiketi || 'Onaylıyorum', tur: 'accent', deger: true }]
    });
  }

  UI.modal = modal;
  UI.form = form;
  UI.onay = onay;
})();
