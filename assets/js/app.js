/* İnşaat Hakediş Paneli - gorunum yonlendirici ve ekranlar */
(function () {
  const { icon, num, num2, money, moneyShort, pct, donut, arcChart,
          lineChart, barChart, badge, bar, toast } = window.UI;
  const DB = window.DB;          // sabit tanimlar (yetki listesi, grafik serisi)
  const S = window.Store;        // kalici veri

  /* -------------------------------------------------------------- durum */
  const state = {
    rol: 'yonetici',           // yonetici | taseron
    metrajProje: 'hepsi',
    hakedisDurum: 'hepsi',
    kaliteSonuc: 'hepsi'
  };

  /* Hakedis onay akisi ve rol yetkileri */
  const AKIS = {
    'Taslak':        { sonraki: 'Kontrolde',     eylem: 'Kontrole gönder', rol: 'her' },
    'Kontrolde':     { sonraki: 'Onay Bekliyor', eylem: 'Onaya gönder',    rol: 'yonetici' },
    'Onay Bekliyor': { sonraki: 'Onaylandı',     eylem: 'Onayla',          rol: 'yonetici' },
    'Reddedildi':    { sonraki: 'Taslak',        eylem: 'Revize et',       rol: 'her' }
  };
  const KESINTI_ORANI = 0.10;   // teminat + stopaj
  const KDV_ORANI = 0.20;

  const MENU = [
    { id: 'ozet',     ad: 'Genel Bakış',  ikon: 'grid' },
    { id: 'paftalar', ad: 'Projeler & DWG', ikon: 'layers' },
    { id: 'metraj',   ad: 'Metraj',       ikon: 'ruler' },
    { id: 'taseron',  ad: 'Taşeronlar',   ikon: 'users' },
    { id: 'kalite',   ad: 'Kalite Kontrol', ikon: 'shield' },
    { id: 'hakedis',  ad: 'Hakediş',      ikon: 'receipt' },
    { id: 'stok',     ad: 'Stok',         ikon: 'box' },
    { id: 'tedarik',  ad: 'Tedarik',      ikon: 'truck' },
    { id: 'rapor',    ad: 'Raporlar',     ikon: 'report' }
  ];

  /* ------------------------------------------------------- hesaplamalar */
  const paftalarAll = () => S.get('paftalar');
  const metrajTutar = (m) => m.miktar * m.birimFiyat;
  const toplamMetraj = () => S.get('metraj').reduce((s, m) => s + metrajTutar(m), 0);
  const hakedisNet = (h) => h.imalat - h.kesinti - h.avansMahsup;
  const hakedisBrut = (h) => hakedisNet(h) + h.kdv;

  /* Kalemlerden hakedis tutarlarini yeniden hesaplar */
  function hakedisHesapla(kalemler, avansMahsup) {
    const imalat = kalemler.reduce((t, k) => t + k.miktar * k.birimFiyat, 0);
    const kesinti = imalat * KESINTI_ORANI;
    const avans = Math.min(avansMahsup || 0, imalat - kesinti);
    const kdv = (imalat - kesinti - avans) * KDV_ORANI;
    return { imalat, kesinti, avansMahsup: avans, kdv };
  }

  const BIRIMLER = ['m3', 'm2', 'm', 'ton', 'adet', 'kg', 'takım'];
  const sozlesmeToplam = () => S.get('projeler').reduce((s, p) => s + p.sozlesme, 0);
  const gerceklesenToplam = () => S.get('projeler').reduce((s, p) => s + p.gerceklesen, 0);
  const kritikStok = () => S.get('stok').filter((s) => s.mevcut - s.rezerve < s.kritik);
  const taseronAd = (id) => (S.get('taseronlar').find((t) => t.id === id) || {}).ad || id;
  const projeAd = (id) => (S.get('projeler').find((p) => p.id === id) || {}).ad || id;

  const durumKind = (d) => ({
    'Onaylandı': 'ok', 'Teslim Edildi': 'ok', 'Aktif': 'ok', 'Geçerli': 'ok', 'İşlendi': 'ok', 'Devam': 'ok',
    'Onay Bekliyor': 'warn', 'Kontrolde': 'info', 'Şartlı Onay': 'warn', 'Beklemede': 'warn',
    'Yolda': 'info', 'Kuyrukta': 'info', 'Uyarı': 'warn', 'Riskli': 'warn', 'Askıda': 'warn',
    'Reddedildi': 'bad', 'Red': 'bad', 'Gecikmeli': 'bad', 'Hata': 'bad', 'Süresi Doldu': 'bad', 'Eksik Evrak': 'bad'
  }[d] || '');

  /* ============================================================ GORUNUM */

  /* ------------------------------------------------------- genel bakis */
  function viewOzet() {
    const seri = DB.buyume.map((b, i) => ({
      ...b,
      etiket: moneyShort(b.deger / 100 * 1.05e9)
    }));

    const kartlar = S.get('projeler').slice(0, 4).map((p, i) => `
      <article class="match-card ${i === 1 ? 'is-featured' : ''}" data-goto="hakedis">
        <button class="go" aria-label="Ac">${icon('arrowUR')}</button>
        <h3>${p.ad}</h3>
        <div class="sub">${p.blok} · ${p.guncelleme}</div>
        <div class="match-body">
          ${donut(p.ilerleme, { caption: p.ilerleme >= 80 ? 'Yüksek İlerleme' : 'İlerleme', size: i === 1 ? 100 : 92 })}
          <div class="check-list">
            ${p.etiketler.map((e) => `<div>${icon('check')}<span>${e}</span></div>`).join('')}
          </div>
        </div>
      </article>`).join('');

    return `
    <section class="hero">
      <div>
        <div>
          <span class="hero-chip"><i></i> DWG Destekli</span>
        </div>
        <h1>PROJE<br><span class="thin">HAKEDİŞ</span> PANELİ</h1>
        <p>Yüklediğiniz mimari ve statik paftalardan metraj otomatik çıkarılır;
           taşeron yetkisi, kalite kontrolü ve hakediş onayı tek akışta ilerler.</p>
        <div class="hero-actions">
          <div class="circle-group">
            <button class="circle-btn" title="Pafta yukle" data-goto="paftalar">${icon('upload')}</button>
            <button class="circle-btn" title="Metraj" data-goto="metraj">${icon('ruler')}</button>
            <button class="circle-btn" title="Hakediş" data-goto="hakedis">${icon('receipt')}</button>
          </div>
          <button class="circle-btn" title="Daha fazla">${icon('dots')}</button>
        </div>
      </div>

      <div class="arc-wrap">
        ${arcChart(seri)}
        <div class="arc-caption">Platform üzerinde onaylanan hakediş hacminin gelişimi</div>
        <div class="arc-side">
          <div class="mini-card">
            <h4>Portföy Özeti</h4>
            <div class="mini-row">${icon('building')}<span>Projeler</span><b>${S.get('projeler').length}</b></div>
            <div class="mini-row">${icon('users')}<span>Taşeronlar</span><b>${S.get('taseronlar').length}</b></div>
            <div class="mini-row">${icon('layers')}<span>Paftalar</span><b>${paftalarAll().length}</b></div>
            <div class="mini-row">${icon('receipt')}<span>Hakedişler</span><b>${S.get('hakedisler').length}</b></div>
          </div>
          <div class="select-pill">Metraj Endeksi ${icon('down')}</div>
          <div class="select-pill">Nakit Akışı ${icon('down')}</div>
        </div>
      </div>
    </section>

    <div class="strip-head">
      <button class="chip">${icon('filter')} Filtre</button>
      <button class="chip is-active"><span class="dot"></span>Devam Eden</button>
      <button class="chip"><span class="dot"></span>İnce İşler</button>
      <button class="chip"><span class="dot"></span>${moneyShort(1.6e8)}+</button>
      <div class="spacer"></div>
      <div class="pager">
        <button data-strip="-1">${icon('left')}</button>
        <b>0${Math.min(S.get('projeler').length, 4)}</b><span>/ ${S.get('projeler').length}</span>
        <button data-strip="1">${icon('right')}</button>
      </div>
    </div>

    <div class="card-strip" id="strip">${kartlar}</div>

    <div class="grid cols-4" style="padding:6px 10px 0">
      ${kpi(moneyShort(sozlesmeToplam()), 'Toplam sözleşme bedeli', 'up', '%8,4 yıllık artış')}
      ${kpi(moneyShort(gerceklesenToplam()), 'Gerçekleşen imalat', 'up', pct(gerceklesenToplam() / sozlesmeToplam() * 100) + ' tamamlanma')}
      ${kpi(String(S.get('hakedisler').filter((h) => h.durum !== 'Onaylandı').length), 'Onay bekleyen hakediş', 'down', 'aksiyon gerekli')}
      ${kpi(String(kritikStok().length), 'Kritik seviyedeki malzeme', 'down', 'sipariş önerilir')}
    </div>`;
  }

  function kpi(value, label, dir, delta) {
    return `<div class="card kpi">
      <div class="value">${value}</div>
      <div class="label">${label}</div>
      <div class="delta ${dir}">${icon(dir === 'up' ? 'trend' : 'trendDown')} ${delta}</div>
    </div>`;
  }

  /* ---------------------------------------------------------- paftalar */
  const FORMAT_RENK = { DXF: 'ok', DWG: 'info', PDF: '', Bilinmiyor: 'warn' };

  function viewPaftalar() {
    const liste = paftalarAll();

    const rows = liste.map((d) => `
      <tr>
        <td style="width:74px">
          ${d.kucukResim
            ? `<img class="pafta-kucuk" src="${d.kucukResim}" alt="${d.ad} önizleme">`
            : `<div class="pafta-kucuk bos">${icon('file')}</div>`}
        </td>
        <td><div class="strong">${d.ad}</div>
            <div class="muted">${d.id} · Rev ${d.rev} · ${d.boyut}${d.surum ? ' · ' + d.surum : ''}</div></td>
        <td>${badge(d.format || '—', FORMAT_RENK[d.format] !== undefined ? FORMAT_RENK[d.format] : '')}</td>
        <td>${badge(d.tur, 'info')}</td>
        <td>${d.disiplin}</td>
        <td>${projeAd(d.proje)}</td>
        <td class="num">${d.katman || '—'}</td>
        <td class="num">${d.varlikSayisi ? num(d.varlikSayisi) : '—'}</td>
        <td class="num">${d.alanM2 ? num2(d.alanM2) + ' m²' : '—'}</td>
        <td>${badge(d.durum, durumKind(d.durum))}</td>
        <td>
          <div class="satir-islem">
            <button class="ikon-btn" title="Önizleme ve katmanlar" data-pafta-ac="${d._id}">${icon('goz')}</button>
            ${d.dosyaId ? `<button class="ikon-btn" title="İndir" data-pafta-indir="${d._id}">${icon('download')}</button>` : ''}
            <button class="ikon-btn tehlike" title="Sil" data-pafta-sil="${d._id}">${icon('cop')}</button>
          </div>
        </td>
      </tr>`).join('') ||
      '<tr><td colspan="11"><div class="empty">Henüz pafta yüklenmedi.</div></td></tr>';

    const turler = ['Kat Planı', 'Kesit', 'Görünüş', 'Detay', 'Kalıp Planı'];
    const sayim = turler.map((t) => ({
      label: t.split(' ')[0],
      short: String(liste.filter((d) => d.tur === t).length),
      value: liste.filter((d) => d.tur === t).length || 0.2
    }));
    const cozulen = liste.filter((d) => d.format === 'DXF').length;

    return `
    ${pageHead('PROJELER & DWG', 'Mimari ve statik paftaları yükleyin. DXF dosyalarının katmanları ve geometrisi okunur, DWG dosyalarının gömülü önizlemesi çıkarılır.')}
    <div class="grid side" style="padding:0 10px">
      <div class="grid" style="gap:14px">
        <div class="dropzone" id="dz">
          <div class="dz-icon">${icon('upload')}</div>
          <h3>Pafta dosyalarını buraya bırakın</h3>
          <p>DXF · DWG · PDF &nbsp;—&nbsp; kat planı, kesit, görünüş, detay, kalıp planı</p>
          <label class="btn accent">${icon('plus')} Dosya seç
            <input type="file" id="fileInput" multiple hidden accept=".dwg,.dxf,.pdf">
          </label>
          <p style="margin-top:10px;font-size:11px">Dosyalar bu tarayıcıda saklanır, sunucuya gönderilmez.</p>
        </div>
        <div class="card">
          <div class="card-head"><h3>Yüklenen paftalar</h3><div class="spacer"></div>
            <span class="hint" id="depoBilgi">${liste.length} dosya</span></div>
          <div class="table-wrap"><table>
            <thead><tr><th></th><th>Dosya</th><th>Format</th><th>Tür</th><th>Disiplin</th><th>Proje</th>
              <th class="num">Katman</th><th class="num">Varlık</th><th class="num">Alan</th>
              <th>Durum</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
        </div>
      </div>

      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Pafta türü dağılımı</h3></div>
          ${barChart(sayim, { height: 140 })}
        </div>
        <div class="card">
          <div class="card-head"><h3>Format desteği</h3></div>
          <div class="list-item">
            <div class="ico">${icon('layers')}</div>
            <div class="txt"><b>DXF — tam okuma</b><span>Katman, geometri, uzunluk ve alan ölçümü</span></div>
            <div class="spacer"></div>${badge(cozulen + ' dosya', 'ok')}
          </div>
          <div class="list-item">
            <div class="ico">${icon('file')}</div>
            <div class="txt"><b>DWG — gömülü önizleme</b><span>Sürüm bilgisi ve çizim küçük resmi</span></div>
            <div class="spacer"></div>${badge(liste.filter((d) => d.format === 'DWG').length + ' dosya', 'info')}
          </div>
          <div class="list-item">
            <div class="ico">${icon('report')}</div>
            <div class="txt"><b>PDF — arşiv</b><span>Saklanır, indirilir; ölçüm yapılmaz</span></div>
            <div class="spacer"></div>${badge(liste.filter((d) => d.format === 'PDF').length + ' dosya', '')}
          </div>
          <p class="modal-metin" style="margin-top:10px">
            DWG kapalı bir ikili formattır; geometrisi tarayıcıda çözülemez.
            Metraj çıkarımı için CAD programından <b>DXF</b> olarak dışa aktarın.</p>
        </div>
        <div class="card">
          <div class="card-head"><h3>İşleme hattı</h3></div>
          <div class="timeline">
            <div class="tl"><b>Dosya alındı</b><span>İçerik IndexedDB'ye yazılır, revizyon kaydı açılır</span></div>
            <div class="tl"><b>Başlık çözümleme</b><span>Format, sürüm, çizim birimi ve sınırlar okunur</span></div>
            <div class="tl"><b>Katman ayrıştırma</b><span>Katman başına uzunluk, alan ve varlık sayısı</span></div>
            <div class="tl"><b>Metraja aktarım</b><span>Seçilen katman ölçüsü poz olarak metraja yazılır</span></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* -------------------------------------------------- yukleme ve cozumleme */
  function turTahmin(ad) {
    const s = ad.toLowerCase();
    if (s.includes('kesit')) return 'Kesit';
    if (s.includes('gorunus') || s.includes('görünüş') || s.includes('cephe')) return 'Görünüş';
    if (s.includes('detay')) return 'Detay';
    if (s.includes('kalip') || s.includes('kalıp')) return 'Kalıp Planı';
    return 'Kat Planı';
  }

  /* Onizleme kucuk resmi: DWG gomulu goruntusu ya da DXF vektor cizimi */
  function kucukResimUret(coz) {
    return new Promise((coz2) => {
      const tuval = document.createElement('canvas');
      tuval.width = 320; tuval.height = 200;
      const c = tuval.getContext('2d');
      c.fillStyle = '#faf9f8'; c.fillRect(0, 0, 320, 200);

      if (coz.onizleme && coz.onizleme.blob) {
        const url = URL.createObjectURL(coz.onizleme.blob);
        const img = new Image();
        img.onload = () => {
          const o = Math.min(320 / img.naturalWidth, 200 / img.naturalHeight);
          const g = img.naturalWidth * o, y = img.naturalHeight * o;
          c.imageSmoothingEnabled = img.naturalWidth > 40;
          c.drawImage(img, (320 - g) / 2, (200 - y) / 2, g, y);
          URL.revokeObjectURL(url);
          coz2(tuval.toDataURL('image/png'));
        };
        img.onerror = () => { URL.revokeObjectURL(url); coz2(null); };
        img.src = url;
        return;
      }
      if (coz.onizleme && coz.onizleme.tur === 'vektor' && coz.onizleme.cizim.length) {
        PaftaAnaliz.ciz(tuval, coz.onizleme.cizim, coz.onizleme.sinir);
        coz2(tuval.toDataURL('image/png'));
        return;
      }
      coz2(null);
    });
  }

  async function addFiles(files) {
    if (!files || !files.length) return;
    let eklenen = 0, hata = 0;

    for (const f of Array.from(files)) {
      try {
        const coz = await PaftaAnaliz.cozumle(f);
        const kucukResim = await kucukResimUret(coz);

        /* ayni ada sahip onceki surum -> revizyon */
        const oncekiler = S.get('paftalar').filter((p) => p.ad === f.name);
        const rev = oncekiler.length
          ? String.fromCharCode(65 + Math.min(25, oncekiler.length)) : 'A';

        const dosyaId = S.uid('DOS');
        await Dosya.yaz(dosyaId, f, f.name);

        const katmanlar = (coz.katmanlar || []).map((k) =>
          ({ ad: k.ad, uzunluk: k.uzunluk, alan: k.alan, adet: k.adet }));
        const varlikSayisi = Object.values(coz.varliklar || {}).reduce((a, b) => a + b, 0);
        const toplamAlan = katmanlar.reduce((t, k) => t + k.alan, 0);

        S.ekle('paftalar', {
          id: 'DWG-' + (2000 + S.get('paftalar').length),
          ad: f.name,
          tur: turTahmin(f.name),
          disiplin: /^s[-_]/i.test(f.name) ? 'Statik' : 'Mimari',
          proje: state.metrajProje !== 'hepsi' ? state.metrajProje
                 : (S.get('projeler')[0] ? S.get('projeler')[0].id : 'PRJ-01'),
          rev,
          olcek: '1/50',
          boyut: f.size >= 1048576 ? (f.size / 1048576).toFixed(1) + ' MB'
                 : f.size >= 1024 ? Math.round(f.size / 1024) + ' KB' : f.size + ' B',
          tarih: new Date().toISOString().slice(0, 10),
          durum: coz.cozulebilir ? 'İşlendi' : (coz.format === 'DWG' ? 'Önizleme' : 'Arşiv'),
          format: coz.format,
          surum: coz.surum || '',
          birimAdi: coz.birimAdi || '',
          katman: katmanlar.length,
          katmanlar,
          varliklar: coz.varliklar || {},
          varlikSayisi,
          sinir: coz.sinir || null,
          alanM2: toplamAlan,
          kucukResim,
          dosyaId,
          not: coz.not || ''
        });
        eklenen++;
      } catch (e) {
        console.error(e); hata++;
      }
    }
    toast(hata ? `${eklenen} pafta yüklendi, ${hata} dosya okunamadı.`
               : `${eklenen} pafta yüklendi ve çözümlendi.`);
  }

  /* ------------------------------------------------ pafta detay penceresi */
  async function paftaAc(id) {
    const d = S.bul('paftalar', id);
    if (!d) return;
    const katmanlar = d.katmanlar || [];
    const varlikListe = Object.entries(d.varliklar || {})
      .sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ×${v}`).join(' · ');

    const secim = await UI.modal({
      baslik: d.ad,
      aciklama: `${d.format} · ${d.surum || 'sürüm bilinmiyor'} · ${d.boyut}` +
                (d.birimAdi ? ` · çizim birimi ${d.birimAdi}` : ''),
      icerik: `
        <div class="onizleme-alan">
          <canvas id="paftaTuval" width="860" height="440"></canvas>
          <img id="paftaResim" alt="${d.ad} önizleme" hidden>
          <div id="paftaYok" class="empty" hidden>Bu dosya için önizleme üretilemedi.</div>
        </div>
        ${d.not ? `<p class="modal-metin" style="margin-top:10px">${d.not}</p>` : ''}
        ${varlikListe ? `<p class="modal-metin" style="margin-top:8px"><b>Varlıklar:</b> ${varlikListe}</p>` : ''}
        ${katmanlar.length ? `
          <div class="kalem-tablo">
            <h4>Katmanlar ve ölçümler</h4>
            <div class="table-wrap"><table>
              <thead><tr><th>Katman</th><th class="num">Uzunluk</th><th class="num">Alan</th>
                <th class="num">Varlık</th><th></th></tr></thead>
              <tbody>${katmanlar.map((k, i) => `<tr>
                <td class="strong">${k.ad}</td>
                <td class="num">${k.uzunluk ? num2(k.uzunluk) + ' m' : '—'}</td>
                <td class="num">${k.alan ? num2(k.alan) + ' m²' : '—'}</td>
                <td class="num">${k.adet}</td>
                <td class="num"><button class="btn ghost sm" data-vurgu="${i}">Göster</button></td>
              </tr>`).join('')}</tbody>
            </table></div>
          </div>` : ''}`,
      hazir: (kutu) => {
        kutu.querySelector('.modal').classList.add('genis');
        const tuval = kutu.querySelector('#paftaTuval');
        const resim = kutu.querySelector('#paftaResim');
        const yok = kutu.querySelector('#paftaYok');

        /* Vektor cizim localStorage'da tutulmaz; dosya IndexedDB'den yeniden cozulur */
        (async () => {
          try {
            const kayit = d.dosyaId ? await Dosya.oku(d.dosyaId) : null;
            if (!kayit) throw new Error('dosya yok');
            const coz = await PaftaAnaliz.cozumle(new File([kayit.blob], d.ad));
            if (coz.onizleme && coz.onizleme.tur === 'vektor' && coz.onizleme.cizim.length) {
              tuval.hidden = false;
              PaftaAnaliz.ciz(tuval, coz.onizleme.cizim, coz.onizleme.sinir);
              kutu.querySelectorAll('[data-vurgu]').forEach((b) => b.addEventListener('click', () => {
                const k = katmanlar[Number(b.dataset.vurgu)];
                PaftaAnaliz.ciz(tuval, coz.onizleme.cizim, coz.onizleme.sinir, k.ad);
                toast(k.ad + ' katmanı vurgulandı.');
              }));
            } else if (coz.onizleme && coz.onizleme.blob) {
              tuval.hidden = true; resim.hidden = false;
              resim.src = URL.createObjectURL(coz.onizleme.blob);
            } else if (d.kucukResim) {
              tuval.hidden = true; resim.hidden = false; resim.src = d.kucukResim;
            } else {
              tuval.hidden = true; yok.hidden = false;
            }
          } catch (e) {
            tuval.hidden = true;
            if (d.kucukResim) { resim.hidden = false; resim.src = d.kucukResim; }
            else yok.hidden = false;
          }
        })();
      },
      dugmeler: [
        { ad: 'Sil', deger: 'sil' },
        { ad: 'İndir', deger: 'indir' },
        katmanlar.length ? { ad: 'Metraja aktar', tur: 'accent', deger: 'metraj' }
                         : { ad: 'Kapat', tur: 'accent', deger: null }
      ]
    });

    if (secim === 'indir') Dosya.indir(d.dosyaId, d.ad).catch(() => toast('Dosya bulunamadı.'));
    else if (secim === 'sil') paftaSil(id);
    else if (secim === 'metraj') metrajaAktar(id);
  }

  async function paftaSil(id) {
    const d = S.bul('paftalar', id);
    if (!d) return;
    if (!await UI.onay('Paftayı sil', `${d.ad} ve dosya içeriği silinecek.`, 'Sil')) return;
    if (d.dosyaId) { try { await Dosya.sil(d.dosyaId); } catch (e) { /* yoksa gec */ } }
    S.sil('paftalar', id);
    toast(d.ad + ' silindi.');
  }

  /* ---------------------------------------- katman olcusunu metraja yazma */
  async function metrajaAktar(id) {
    const d = S.bul('paftalar', id);
    if (!d || !(d.katmanlar || []).length) return;
    const olculu = d.katmanlar.filter((k) => k.uzunluk > 0 || k.alan > 0 || k.adet > 0);

    const sonuc = await UI.form({
      baslik: 'Katman ölçüsünü metraja aktar',
      aciklama: `${d.ad} · ölçüler çizim biriminden (${d.birimAdi || '—'}) metreye çevrilmiştir.`,
      kaydetEtiketi: 'Metraja ekle',
      alanlar: [
        { ad: 'katman', etiket: 'Katman', tur: 'secim',
          secenekler: olculu.map((k, i) => ({ deger: String(i),
            ad: `${k.ad} — ${num2(k.uzunluk)} m / ${num2(k.alan)} m² / ${k.adet} adet` })) },
        { ad: 'olcu', etiket: 'Aktarılacak ölçü', tur: 'secim',
          secenekler: [{ deger: 'alan', ad: 'Alan (m²)' }, { deger: 'uzunluk', ad: 'Uzunluk (m)' },
                       { deger: 'adet', ad: 'Adet' }] },
        { ad: 'poz', etiket: 'Poz No', zorunlu: true, ipucu: 'örn. 18.233/3' },
        { ad: 'birimFiyat', etiket: 'Birim fiyat (₺)', tur: 'number', min: 0, adim: '0.01', zorunlu: true },
        { ad: 'tanim', etiket: 'İmalat tanımı', zorunlu: true, genis: true,
          deger: '' }
      ]
    });
    if (!sonuc) return;

    const k = olculu[Number(sonuc.katman)];
    const miktar = sonuc.olcu === 'alan' ? k.alan : sonuc.olcu === 'uzunluk' ? k.uzunluk : k.adet;
    if (!miktar) { toast('Seçilen katmanda bu ölçü sıfır.'); return; }

    S.ekle('metraj', {
      poz: sonuc.poz, tanim: sonuc.tanim, proje: d.proje,
      miktar: Math.round(miktar * 100) / 100,
      birim: sonuc.olcu === 'alan' ? 'm2' : sonuc.olcu === 'uzunluk' ? 'm' : 'adet',
      birimFiyat: sonuc.birimFiyat,
      pafta: d.ad.split('_')[0],
      kaynak: 'Otomatik',
      guven: d.format === 'DXF' ? 0.95 : 0.7,
      kaynakDetay: d.ad + ' · ' + k.ad + ' katmanı'
    });
    toast(`${k.ad} katmanından ${num2(miktar)} ${sonuc.olcu === 'alan' ? 'm²' : sonuc.olcu === 'uzunluk' ? 'm' : 'adet'} metraja eklendi.`);
  }


  /* ------------------------------------------------------------ metraj */
  function metrajListesi() {
    const hepsi = S.get('metraj');
    return state.metrajProje === 'hepsi' ? hepsi : hepsi.filter((m) => m.proje === state.metrajProje);
  }

  function viewMetraj() {
    const liste = metrajListesi();
    const toplam = liste.reduce((t, m) => t + metrajTutar(m), 0);

    const rows = liste.map((m) => `
      <tr>
        <td><span class="strong">${m.poz}</span></td>
        <td>${m.tanim}<div class="muted">${m.pafta} · ${projeAd(m.proje)}</div></td>
        <td class="num">${num2(m.miktar)} ${m.birim}</td>
        <td class="num">${money(m.birimFiyat)}</td>
        <td class="num strong">${money(metrajTutar(m))}</td>
        <td>${badge(m.kaynak, m.kaynak === 'Otomatik' ? 'info' : '')}</td>
        <td style="min-width:120px">${bar(m.guven * 100, m.guven >= 0.9 ? 'ok' : m.guven >= 0.85 ? 'warn' : 'bad')}</td>
        <td>
          <div class="satir-islem">
            <button class="ikon-btn" title="Düzenle" data-metraj-duzenle="${m._id}">${icon('kalem')}</button>
            <button class="ikon-btn tehlike" title="Sil" data-metraj-sil="${m._id}">${icon('cop')}</button>
          </div>
        </td>
      </tr>`).join('') ||
      '<tr><td colspan="8"><div class="empty">Bu filtrede metraj kalemi yok. “Poz ekle” ile başlayın.</div></td></tr>';

    const otomatik = liste.filter((m) => m.kaynak === 'Otomatik').length;
    const ortGuven = liste.length ? liste.reduce((t, m) => t + m.guven, 0) / liste.length * 100 : 0;
    const dusukGuven = liste.filter((m) => m.guven < 0.9);

    const grupla = () => {
      const gruplar = {};
      liste.forEach((m) => {
        const g = m.pafta.startsWith('S-') ? 'Kaba' : m.pafta.startsWith('M-') ? 'Mekanik'
                : m.pafta.startsWith('A-3') ? 'Cephe' : 'İnce';
        gruplar[g] = (gruplar[g] || 0) + metrajTutar(m);
      });
      const t = Object.values(gruplar).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(gruplar).map(([ad, v]) => ({ label: ad, short: pct(v / t * 100), value: v }));
    };

    return `
    ${pageHead('METRAJ', 'Paftalardan çıkarılan poz bazlı miktarlar ve keşif bedeli. Düşük güven skorlu kalemler manuel doğrulama ister.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(toplam), 'Toplam keşif bedeli', 'up', num(liste.length) + ' poz')}
      ${kpi(num(liste.length), 'Metraj kalemi', 'up', otomatik + ' otomatik')}
      ${kpi(pct(ortGuven), 'Ortalama güven skoru', ortGuven > 90 ? 'up' : 'down', 'katman eşleşmesi')}
      ${kpi(num(dusukGuven.length), 'Doğrulama bekleyen', dusukGuven.length ? 'down' : 'up', 'güven < %90')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Poz bazlı metraj icmali</h3><div class="spacer"></div>
          <div class="arac-cubugu">
            <select id="metrajProje" aria-label="Proje filtresi">
              <option value="hepsi">Tüm projeler</option>
              ${S.get('projeler').map((p) => `<option value="${p.id}" ${state.metrajProje === p.id ? 'selected' : ''}>${p.ad}</option>`).join('')}
            </select>
            <button class="btn ghost sm" data-act="metraj-csv">${icon('download')} CSV</button>
            <button class="btn accent sm" data-act="metraj-ekle">${icon('plus')} Poz ekle</button>
          </div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Poz No</th><th>Tanım</th><th class="num">Miktar</th>
            <th class="num">Birim Fiyat</th><th class="num">Tutar</th><th>Kaynak</th><th>Güven</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="4">Genel toplam</td>
            <td class="num">${money(toplam)}</td><td colspan="3"></td></tr></tfoot>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>İmalat gruplarına dağılım</h3></div>
          ${liste.length ? barChart(grupla()) : '<div class="empty">Veri yok.</div>'}
        </div>
        <div class="card">
          <div class="card-head"><h3>Doğrulama bekleyenler</h3></div>
          ${dusukGuven.map((m) => `
            <div class="list-item">
              <div class="ico">${icon('alert')}</div>
              <div class="txt"><b>${m.poz}</b><span>${m.pafta} · güven ${pct(m.guven * 100)}</span></div>
              <div class="spacer"></div>
              <button class="btn ghost sm" data-metraj-dogrula="${m._id}">Doğrula</button>
            </div>`).join('') || '<div class="empty">Tüm kalemler doğrulandı.</div>'}
        </div>
      </div>
    </div>`;
  }

  /* poz ekleme / duzenleme formu */
  async function metrajFormu(id) {
    const m = id ? S.bul('metraj', id) : null;
    const paftaSecenek = paftalarAll().map((d) => ({ deger: d.ad.split('_')[0], ad: d.ad }));
    const sonuc = await UI.form({
      baslik: m ? 'Metraj kalemini düzenle' : 'Yeni metraj kalemi',
      aciklama: 'Tutar, miktar × birim fiyat olarak otomatik hesaplanır.',
      kaydetEtiketi: m ? 'Güncelle' : 'Ekle',
      alanlar: [
        { ad: 'poz', etiket: 'Poz No', deger: m ? m.poz : '', zorunlu: true, ipucu: 'örn. 16.058/1A' },
        { ad: 'proje', etiket: 'Proje', tur: 'secim', deger: m ? m.proje : (state.metrajProje !== 'hepsi' ? state.metrajProje : ''),
          secenekler: S.get('projeler').map((p) => ({ deger: p.id, ad: p.ad })) },
        { ad: 'tanim', etiket: 'İmalat tanımı', deger: m ? m.tanim : '', zorunlu: true, genis: true },
        { ad: 'miktar', etiket: 'Miktar', tur: 'number', adim: '0.01', min: 0, deger: m ? m.miktar : '', zorunlu: true },
        { ad: 'birim', etiket: 'Birim', tur: 'secim', deger: m ? m.birim : 'm2', secenekler: BIRIMLER },
        { ad: 'birimFiyat', etiket: 'Birim fiyat (₺)', tur: 'number', adim: '0.01', min: 0, deger: m ? m.birimFiyat : '', zorunlu: true },
        { ad: 'pafta', etiket: 'Kaynak pafta', tur: 'secim', deger: m ? m.pafta : '',
          secenekler: [{ deger: '—', ad: 'Pafta seçilmedi' }].concat(paftaSecenek) }
      ]
    });
    if (!sonuc) return;
    const kayit = { ...sonuc, kaynak: 'Manuel', guven: 1 };
    if (m) { S.guncelle('metraj', id, kayit); toast(kayit.poz + ' güncellendi.'); }
    else { S.ekle('metraj', kayit); toast(kayit.poz + ' metraja eklendi.'); }
  }

  function metrajCSV() {
    const basliklar = ['Poz No', 'Tanım', 'Proje', 'Pafta', 'Miktar', 'Birim', 'Birim Fiyat', 'Tutar', 'Kaynak', 'Güven'];
    const satirlar = metrajListesi().map((m) => [m.poz, m.tanim, projeAd(m.proje), m.pafta,
      m.miktar, m.birim, m.birimFiyat, metrajTutar(m), m.kaynak, m.guven]);
    indir('metraj-icmali.csv', 'text/csv;charset=utf-8',
      '﻿' + [basliklar].concat(satirlar)
        .map((r) => r.map((h) => '"' + String(h).replace(/"/g, '""') + '"').join(';')).join('\n'));
    toast('Metraj icmali CSV olarak indirildi.');
  }

  function indir(adi, tur, icerik) {
    const url = URL.createObjectURL(new Blob([icerik], { type: tur }));
    const a = document.createElement('a');
    a.href = url; a.download = adi; document.body.appendChild(a); a.click();
    a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  /* ---------------------------------------------------------- taşeron */
  function viewTaseron() {
    const kartlar = S.get('taseronlar').map((t) => `
      <div class="card">
        <div class="card-head">
          <div>
            <h3>${t.ad}</h3>
            <div class="muted" style="font-size:11px;color:var(--ink-3)">${t.brans} · ${t.yetkili} · Puan ${num2(t.puan)}</div>
          </div>
          <div class="spacer"></div>
          ${badge(t.durum, durumKind(t.durum))}
        </div>
        <div class="stat-inline" style="margin-bottom:12px">
          <div><span>Sözleşme</span><b>${moneyShort(t.sozlesme)}</b></div>
          <div><span>Aktif iş</span><b>${t.aktifIs}</b></div>
          <div><span>SGK</span><b style="font-size:12.5px">${t.sgk}</b></div>
          <div><span>Bitiş</span><b style="font-size:12.5px">${t.sozlesmeBitis}</b></div>
        </div>
        <div style="border-top:1px solid var(--line-soft);padding-top:6px">
          ${DB.YETKI_LISTESI.map((y) => {
            const on = S.yetkiler(t.id).indexOf(y.key) > -1;
            return `<div class="perm-row">
              ${icon('lock')}<span>${y.ad}</span><div class="spacer"></div>
              <button class="switch ${on ? 'on' : ''}" data-yetki="${t.id}|${y.key}"
                      aria-pressed="${on}" aria-label="${y.ad}"></button>
            </div>`;
          }).join('')}
        </div>
      </div>`).join('');

    return `
    ${pageHead('TAŞERONLAR', 'Alt yüklenici tanımları ve modül bazlı yetkilendirme. Yetki değişiklikleri anında portala yansır.')}
    <div class="grid cols-3" style="padding:0 10px">${kartlar}</div>`;
  }

  /* ----------------------------------------------------------- kalite */
  const KALITE_DURUM = ['Uygun', 'Uygun Değil', 'Kapsam Dışı'];

  function kaliteListesi() {
    const hepsi = S.get('kaliteKontrol');
    return state.kaliteSonuc === 'hepsi' ? hepsi : hepsi.filter((q) => q.sonuc === state.kaliteSonuc);
  }

  /* Maddelerden agirlikli skor; kapsam disi maddeler paydaya girmez */
  function kaliteSkor(maddeler) {
    if (!maddeler || !maddeler.length) return null;
    let payda = 0, pay = 0;
    maddeler.forEach((m) => {
      if (m.durum === 'Kapsam Dışı') return;
      payda += m.agirlik;
      if (m.durum === 'Uygun') pay += m.agirlik;
    });
    return payda ? Math.round(pay / payda * 100) : null;
  }

  const skorSonuc = (skor) => (DB.KALITE_ESIK.find((e) => skor >= e.alt) || { sonuc: 'Red' }).sonuc;

  function viewKalite() {
    const liste = kaliteListesi();
    const hepsi = S.get('kaliteKontrol');

    const rows = liste.map((q) => `
      <tr>
        <td><span class="strong nowrap">${q.id}</span><div class="muted nowrap">${q.tarih}</div></td>
        <td>${q.imalat}<div class="muted">${q.sablon || '—'}${q.duzeltmeAta ? ' · yeniden kontrol' : ''}</div></td>
        <td>${taseronAd(q.taseron)}</td>
        <td>${q.kontrolor}</td>
        <td class="num">${q.skor ? q.skor : '—'}</td>
        <td style="min-width:130px">${bar(q.tamamlanma, q.tamamlanma >= 90 ? 'ok' : q.tamamlanma >= 60 ? 'warn' : 'bad')}</td>
        <td>${badge(q.sonuc, durumKind(q.sonuc))}</td>
        <td>
          <div class="satir-islem">
            <button class="ikon-btn" title="Detay" data-kalite-detay="${q._id}">${icon('goz')}</button>
            ${q.sonuc === 'Red' || q.sonuc === 'Şartlı Onay'
              ? `<button class="ikon-btn" title="Yeniden kontrol" data-kalite-tekrar="${q._id}">${icon('kalem')}</button>` : ''}
            <button class="ikon-btn tehlike" title="Sil" data-kalite-sil="${q._id}">${icon('cop')}</button>
          </div>
        </td>
      </tr>`).join('') ||
      '<tr><td colspan="8"><div class="empty">Bu filtrede kontrol kaydı yok.</div></td></tr>';

    const onayli = hepsi.filter((q) => q.sonuc === 'Onaylandı').length;
    const ortTamam = hepsi.length ? hepsi.reduce((t, q) => t + q.tamamlanma, 0) / hepsi.length : 0;
    /* yeniden kontrolu yapilmis kayit artik acik sapma sayilmaz */
    const acikSapma = hepsi.filter((q) =>
      (q.sonuc === 'Red' || q.sonuc === 'Şartlı Onay') && !q.tekrarKayit);

    return `
    ${pageHead('KALİTE KONTROL', 'Şablona dayalı kontrol formları, ağırlıklı puanlama, sapma kayıtları ve yeniden kontrol takibi.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(onayli + '/' + hepsi.length, 'Onaylanan kontrol', onayli >= hepsi.length / 2 ? 'up' : 'down', 'tüm kayıtlar')}
      ${kpi(pct(ortTamam), 'Ortalama tamamlanma', 'up', 'imalat bazlı')}
      ${kpi(num(acikSapma.length), 'Açık sapma', acikSapma.length ? 'down' : 'up', 'red + şartlı onay')}
      ${kpi(num(hepsi.filter((q) => q.sonuc === 'Beklemede').length), 'Bekleyen kontrol', 'down', 'sonuç girilmedi')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Kontrol kayıtları</h3><div class="spacer"></div>
          <div class="arac-cubugu">
            <select id="kaliteSonuc" aria-label="Sonuç filtresi">
              <option value="hepsi">Tüm sonuçlar</option>
              ${['Onaylandı', 'Şartlı Onay', 'Red', 'Beklemede'].map((d) =>
                `<option value="${d}" ${state.kaliteSonuc === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
            <button class="btn ghost sm" data-act="kalite-csv">${icon('download')} CSV</button>
            <button class="btn accent sm" data-act="kalite-ekle">${icon('plus')} Yeni kontrol</button>
          </div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Kayıt</th><th>İmalat</th><th>Taşeron</th><th>Kontrolör</th>
            <th class="num">Skor</th><th>Tamamlanma</th><th>Sonuç</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Taşeron kalite karnesi</h3></div>
          ${S.get('taseronlar').map((t) => {
            const kayit = hepsi.filter((q) => q.taseron === t.id && q.skor);
            if (!kayit.length) return '';
            const sk = kayit.reduce((s, q) => s + q.skor, 0) / kayit.length;
            return `<div style="padding:9px 0;border-top:1px solid var(--line-soft)">
              <div style="display:flex;font-size:12.5px;margin-bottom:6px">
                <span>${t.ad}</span>
                <span style="margin-left:auto;color:var(--ink-3)">${kayit.length} kontrol</span></div>
              ${bar(sk, sk >= 85 ? 'ok' : sk >= 60 ? 'warn' : 'bad')}
            </div>`;
          }).join('') || '<div class="empty">Puanlı kontrol kaydı yok.</div>'}
        </div>
        <div class="card">
          <div class="card-head"><h3>Açık sapmalar</h3></div>
          ${acikSapma.map((q) => `
            <div class="list-item">
              <div class="ico">${icon('alert')}</div>
              <div class="txt"><b>${q.imalat}</b><span>${taseronAd(q.taseron)} · ${q.sonuc}${q.skor ? ' · puan ' + q.skor : ''}</span></div>
              <div class="spacer"></div>
              <button class="btn ghost sm" data-kalite-tekrar="${q._id}">Yeniden kontrol</button>
            </div>`).join('') || '<div class="empty">Açık sapma yok.</div>'}
        </div>
        <div class="card">
          <div class="card-head"><h3>Puanlama kuralı</h3></div>
          <div class="ozet-satir"><span>Uygun maddelerin ağırlık toplamı / kapsamdaki toplam ağırlık</span></div>
          <div class="ozet-satir"><span>%90 ve üzeri</span><b>${badge('Onaylandı', 'ok')}</b></div>
          <div class="ozet-satir"><span>%60 – %89</span><b>${badge('Şartlı Onay', 'warn')}</b></div>
          <div class="ozet-satir"><span>%60 altı</span><b>${badge('Red', 'bad')}</b></div>
          <p class="modal-metin" style="margin-top:10px">“Kapsam dışı” işaretlenen maddeler paydaya girmez.</p>
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------- kontrol formu (puanli) */
  async function kaliteFormu(oncekiId) {
    const onceki = oncekiId ? S.bul('kaliteKontrol', oncekiId) : null;
    const sablonAdlari = Object.keys(DB.KALITE_SABLON);
    const varsayilanSablon = (onceki && onceki.sablon) || sablonAdlari[0];
    const fotograflar = [];   // {id, ad, kucuk}

    const maddeSatiri = (m, i) => `
      <tr data-madde="${i}">
        <td><b>${m.ad}</b><div class="muted">ağırlık ${m.agirlik}</div></td>
        ${KALITE_DURUM.map((d) => `
          <td class="num"><label class="secim-hucre">
            <input type="radio" name="madde_${i}" value="${d}" ${d === 'Uygun' ? 'checked' : ''}>
          </label></td>`).join('')}
        <td><input type="text" data-not placeholder="sapma notu" class="madde-not"></td>
      </tr>`;

    const sonuc = await UI.form({
      baslik: onceki ? 'Yeniden kontrol · ' + onceki.imalat : 'Yeni kalite kontrolü',
      aciklama: 'Şablon maddelerini işaretleyin; puan ve sonuç ağırlıklara göre otomatik hesaplanır.',
      kaydetEtiketi: 'Kontrolü kaydet',
      alanlar: [
        { ad: 'imalat', etiket: 'İmalat / mahal', zorunlu: true, genis: true,
          deger: onceki ? onceki.imalat : '', ipucu: 'örn. Perde beton dökümü - 4. Kat' },
        { ad: 'sablon', etiket: 'Kontrol şablonu', tur: 'secim', deger: varsayilanSablon, secenekler: sablonAdlari },
        { ad: 'taseron', etiket: 'Taşeron', tur: 'secim', deger: onceki ? onceki.taseron : '',
          secenekler: S.get('taseronlar').map((t) => ({ deger: t.id, ad: t.ad })) },
        { ad: 'kontrolor', etiket: 'Kontrolör', zorunlu: true, deger: onceki ? onceki.kontrolor : '' },
        { ad: 'tarih', etiket: 'Kontrol tarihi', tur: 'date', deger: new Date().toISOString().slice(0, 10) },
        { ad: 'tamamlanma', etiket: 'İmalat tamamlanma (%)', tur: 'number', min: 0,
          deger: onceki ? onceki.tamamlanma : 100 }
      ],
      ek: `<div class="kalem-tablo">
             <h4>Kontrol maddeleri</h4>
             <div class="table-wrap"><table>
               <thead><tr><th>Madde</th>${KALITE_DURUM.map((d) => `<th class="num">${d}</th>`).join('')}<th>Not</th></tr></thead>
               <tbody id="maddeGovde"></tbody>
             </table></div>
             <div class="foto-alan">
               <label class="btn ghost sm">${icon('plus')} Fotoğraf ekle
                 <input type="file" id="fotoGirdi" accept="image/*" multiple hidden></label>
               <div id="fotoSerit" class="foto-serit"></div>
             </div>
             <div class="ozet-blok">
               <div class="ozet-satir"><span>Uygun / kapsamdaki ağırlık</span><b id="ozetAgirlik">—</b></div>
               <div class="ozet-satir vurgu"><span>Kalite puanı</span><b id="ozetSkor">—</b></div>
               <div class="ozet-satir"><span>Önerilen sonuç</span><b id="ozetSonuc">—</b></div>
             </div>
           </div>`,
      hazir: (kutu) => {
        kutu.querySelector('.modal').classList.add('genis');
        const govde = kutu.querySelector('#maddeGovde');
        const sablonSec = kutu.querySelector('#f_sablon');
        const serit = kutu.querySelector('#fotoSerit');

        const ozetle = () => {
          const maddeler = topla(kutu);
          const skor = kaliteSkor(maddeler);
          let payda = 0, pay = 0;
          maddeler.forEach((m) => {
            if (m.durum === 'Kapsam Dışı') return;
            payda += m.agirlik;
            if (m.durum === 'Uygun') pay += m.agirlik;
          });
          kutu.querySelector('#ozetAgirlik').textContent = `${pay} / ${payda}`;
          kutu.querySelector('#ozetSkor').textContent = skor === null ? '—' : '%' + skor;
          const s = skor === null ? '—' : skorSonuc(skor);
          const el = kutu.querySelector('#ozetSonuc');
          el.textContent = s;
          el.style.color = s === 'Onaylandı' ? 'var(--ok)' : s === 'Red' ? 'var(--bad)' : 'var(--warn)';
        };

        const maddeleriYaz = () => {
          const maddeler = DB.KALITE_SABLON[sablonSec.value] || [];
          govde.innerHTML = maddeler.map(maddeSatiri).join('');
          ozetle();
        };

        govde.addEventListener('change', ozetle);
        sablonSec.addEventListener('change', maddeleriYaz);
        maddeleriYaz();

        kutu.querySelector('#fotoGirdi').addEventListener('change', async (e) => {
          for (const f of Array.from(e.target.files)) {
            if (!f.type.startsWith('image/')) continue;
            const id = S.uid('FOT');
            try { await Dosya.yaz(id, f, f.name); } catch (err) { toast('Fotoğraf kaydedilemedi.'); continue; }
            const kucuk = URL.createObjectURL(f);
            fotograflar.push({ id, ad: f.name });
            const kutucuk = document.createElement('div');
            kutucuk.className = 'foto-kutu';
            kutucuk.innerHTML = `<img src="${kucuk}" alt="${f.name}">`;
            serit.appendChild(kutucuk);
          }
          e.target.value = '';
        });
      },
      topla: (kutu) => ({ maddeler: topla(kutu), fotograflar })
    });

    function topla(kutu) {
      const sablonAd = kutu.querySelector('#f_sablon').value;
      const sablon = DB.KALITE_SABLON[sablonAd] || [];
      return sablon.map((m, i) => {
        const secili = kutu.querySelector(`input[name="madde_${i}"]:checked`);
        const not = kutu.querySelector(`[data-madde="${i}"] [data-not]`);
        return { ad: m.ad, agirlik: m.agirlik,
                 durum: secili ? secili.value : 'Uygun',
                 not: not ? not.value.trim() : '' };
      });
    }

    if (!sonuc) return;
    const skor = kaliteSkor(sonuc.maddeler);
    const sira = S.get('kaliteKontrol').length + 2201;
    const kayit = S.ekle('kaliteKontrol', {
      id: 'QC-' + sira,
      imalat: sonuc.imalat,
      sablon: sonuc.sablon,
      taseron: sonuc.taseron,
      kontrolor: sonuc.kontrolor,
      tarih: sonuc.tarih,
      tamamlanma: Math.max(0, Math.min(100, sonuc.tamamlanma)),
      maddeler: sonuc.maddeler,
      fotograflar: sonuc.fotograflar.map((f) => ({ id: f.id, ad: f.ad })),
      skor: skor === null ? 0 : skor,
      sonuc: skor === null ? 'Beklemede' : skorSonuc(skor),
      notlar: sonuc.maddeler.filter((m) => m.durum === 'Uygun Değil')
                .map((m) => m.ad + (m.not ? ' (' + m.not + ')' : '')).join('; ') || 'Sapma kaydedilmedi.',
      duzeltmeAta: onceki ? onceki.id : null
    });

    if (onceki) S.guncelle('kaliteKontrol', onceki._id, { tekrarKayit: kayit.id });
    toast(`${kayit.id} kaydedildi · puan %${kayit.skor} · ${kayit.sonuc}`);
  }

  /* --------------------------------------------------- kontrol detayi */
  async function kaliteDetay(id) {
    const q = S.bul('kaliteKontrol', id);
    if (!q) return;
    const maddeler = q.maddeler || [];
    const fotolar = q.fotograflar || [];

    await UI.modal({
      baslik: q.id + ' · ' + q.imalat,
      aciklama: `${taseronAd(q.taseron)} · ${q.kontrolor} · ${q.tarih}` +
                (q.sablon ? ' · ' + q.sablon : '') +
                (q.duzeltmeAta ? ` · ${q.duzeltmeAta} kaydının yeniden kontrolü` : ''),
      icerik: `
        <div class="ozet-satir"><span>Kalite puanı</span><b>${q.skor ? '%' + q.skor : '—'}</b></div>
        <div class="ozet-satir"><span>Sonuç</span><b>${badge(q.sonuc, durumKind(q.sonuc))}</b></div>
        <div class="ozet-satir"><span>İmalat tamamlanma</span><b>${pct(q.tamamlanma)}</b></div>
        ${maddeler.length ? `
          <div class="kalem-tablo">
            <h4>Kontrol maddeleri</h4>
            <div class="table-wrap"><table>
              <thead><tr><th>Madde</th><th class="num">Ağırlık</th><th>Durum</th><th>Not</th></tr></thead>
              <tbody>${maddeler.map((m) => `<tr>
                <td>${m.ad}</td><td class="num">${m.agirlik}</td>
                <td>${badge(m.durum, m.durum === 'Uygun' ? 'ok' : m.durum === 'Uygun Değil' ? 'bad' : '')}</td>
                <td class="muted">${m.not || '—'}</td></tr>`).join('')}</tbody>
            </table></div>
          </div>`
        : `<p class="modal-metin" style="margin-top:12px"><b>Not:</b> ${q.notlar || '—'}</p>
           <p class="modal-metin">Bu kayıt şablon öncesi girildiği için madde dökümü yok.</p>`}
        ${fotolar.length ? `<div class="kalem-tablo"><h4>Saha fotoğrafları (${fotolar.length})</h4>
           <div class="foto-serit" id="detayFoto"></div></div>` : ''}`,
      hazir: (kutu) => {
        const serit = kutu.querySelector('#detayFoto');
        if (!serit) return;
        fotolar.forEach(async (f) => {
          try {
            const kayit = await Dosya.oku(f.id);
            if (!kayit) return;
            const d = document.createElement('div');
            d.className = 'foto-kutu';
            d.innerHTML = `<img src="${URL.createObjectURL(kayit.blob)}" alt="${f.ad}">`;
            serit.appendChild(d);
          } catch (e) { /* fotograf yoksa atla */ }
        });
      },
      dugmeler: [
        (q.sonuc === 'Red' || q.sonuc === 'Şartlı Onay')
          ? { ad: 'Yeniden kontrol', deger: 'tekrar' } : { ad: 'CSV indir', deger: 'csv' },
        { ad: 'Kapat', tur: 'accent', deger: null }
      ]
    }).then((secim) => {
      if (secim === 'tekrar') kaliteFormu(id);
      else if (secim === 'csv') kaliteCSV([q], q.id + '.csv');
    });
  }

  function kaliteCSV(liste, adi) {
    const basliklar = ['Kayıt', 'İmalat', 'Şablon', 'Taşeron', 'Kontrolör', 'Tarih',
                       'Skor', 'Sonuç', 'Tamamlanma', 'Sapmalar'];
    const satirlar = liste.map((q) => [q.id, q.imalat, q.sablon || '—', taseronAd(q.taseron),
      q.kontrolor, q.tarih, q.skor, q.sonuc, q.tamamlanma, q.notlar || '']);
    indir(adi || 'kalite-kontrol.csv', 'text/csv;charset=utf-8',
      '﻿' + [basliklar].concat(satirlar)
        .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'));
    toast('Kalite kayıtları indirildi.');
  }


  /* ---------------------------------------------------------- hakediş */
  function hakedisListesi() {
    const hepsi = S.get('hakedisler');
    return state.hakedisDurum === 'hepsi' ? hepsi : hepsi.filter((h) => h.durum === state.hakedisDurum);
  }

  function akisDugmesi(h) {
    const adim = AKIS[h.durum];
    if (!adim) return '';
    if (adim.rol === 'yonetici' && state.rol !== 'yonetici') return '';
    const red = h.durum === 'Onay Bekliyor'
      ? `<button class="btn ghost sm" data-hakedis-red="${h._id}">Reddet</button>` : '';
    return `<div class="satir-islem">${red}
      <button class="btn sm" data-hakedis-ilerlet="${h._id}">${adim.eylem}</button></div>`;
  }

  function viewHakedis() {
    const liste = hakedisListesi();
    const rows = liste.map((h) => `
      <tr>
        <td><span class="strong">${h.no}</span><div class="muted">${h.donem}</div></td>
        <td>${projeAd(h.proje)}<div class="muted">${taseronAd(h.taseron)}</div></td>
        <td class="num">${money(h.imalat)}</td>
        <td class="num">-${money(h.kesinti)}</td>
        <td class="num">-${money(h.avansMahsup)}</td>
        <td class="num">${money(h.kdv)}</td>
        <td class="num strong">${money(hakedisBrut(h))}</td>
        <td>${badge(h.durum, durumKind(h.durum))}</td>
        <td>
          <div class="satir-islem">
            <button class="ikon-btn" title="Detay" data-hakedis-detay="${h._id}">${icon('goz')}</button>
            ${h.durum === 'Taslak' || h.durum === 'Reddedildi'
              ? `<button class="ikon-btn tehlike" title="Sil" data-hakedis-sil="${h._id}">${icon('cop')}</button>` : ''}
          </div>
        </td>
        <td>${akisDugmesi(h)}</td>
      </tr>`).join('') ||
      '<tr><td colspan="10"><div class="empty">Bu filtrede hakediş yok.</div></td></tr>';

    const tumu = S.get('hakedisler');
    const toplamNet = tumu.reduce((t, h) => t + hakedisBrut(h), 0);
    const bekleyen = tumu.filter((h) => h.durum !== 'Onaylandı' && h.durum !== 'Reddedildi');
    const onayli = tumu.filter((h) => h.durum === 'Onaylandı');

    /* son 8 donemin onaylanan hakedis toplami (milyon TL) */
    const donemler = {};
    tumu.forEach((h) => { donemler[h.donem] = (donemler[h.donem] || 0) + hakedisBrut(h) / 1e6; });
    const seri = Object.values(donemler);

    return `
    ${pageHead('HAKEDİŞ', 'Dönemsel imalat bedeli, kesintiler, avans mahsubu ve onay akışı.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(toplamNet), 'Toplam hakediş (KDV dahil)', 'up', tumu.length + ' dosya')}
      ${kpi(moneyShort(bekleyen.reduce((t, h) => t + hakedisBrut(h), 0)), 'Süreçteki tutar', 'down', bekleyen.length + ' dosya')}
      ${kpi(moneyShort(onayli.reduce((t, h) => t + hakedisBrut(h), 0)), 'Onaylanan tutar', 'up', onayli.length + ' dosya')}
      ${kpi(moneyShort(tumu.reduce((t, h) => t + h.kesinti, 0)), 'Toplam kesinti', 'up', 'teminat + stopaj')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Hakediş dosyaları</h3><div class="spacer"></div>
          <div class="arac-cubugu">
            <select id="hakedisDurum" aria-label="Durum filtresi">
              <option value="hepsi">Tüm durumlar</option>
              ${['Taslak', 'Kontrolde', 'Onay Bekliyor', 'Onaylandı', 'Reddedildi'].map((d) =>
                `<option value="${d}" ${state.hakedisDurum === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
            <button class="btn accent sm" data-act="hakedis-ekle">${icon('plus')} Hakediş oluştur</button>
          </div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>No</th><th>Proje / Taşeron</th><th class="num">İmalat</th>
            <th class="num">Kesinti</th><th class="num">Avans</th><th class="num">KDV</th>
            <th class="num">Ödenecek</th><th>Durum</th><th></th><th></th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="6">Listelenen toplam</td>
            <td class="num">${money(liste.reduce((t, h) => t + hakedisBrut(h), 0))}</td><td colspan="3"></td></tr></tfoot>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Dönemsel hakediş eğrisi</h3><div class="spacer"></div>
            <span class="hint">milyon ₺</span></div>
          ${seri.length > 1 ? lineChart(seri) : '<div class="empty">Eğri için en az iki dönem gerekir.</div>'}
        </div>
        <div class="card">
          <div class="card-head"><h3>Onay akışı</h3></div>
          <div class="timeline">
            <div class="tl"><b>Taslak</b><span>Taşeron kalemleri seçer, miktar girer</span></div>
            <div class="tl"><b>Kontrolde</b><span>Saha şefi yerinde imalatı doğrular</span></div>
            <div class="tl"><b>Onay Bekliyor</b><span>Poz ve birim fiyat kontrolü tamam</span></div>
            <div class="tl"><b>Onaylandı</b><span>Ödeme talimatına dönüşür</span></div>
          </div>
          <div class="ozet-satir" style="margin-top:10px">
            <span>Kesinti oranı</span><b>${pct(KESINTI_ORANI * 100)}</b></div>
          <div class="ozet-satir"><span>KDV oranı</span><b>${pct(KDV_ORANI * 100)}</b></div>
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------- hakedis olusturma (kalem secimli) --- */
  async function hakedisFormu() {
    const projeler = S.get('projeler');
    const taseronlar = S.get('taseronlar');
    if (!projeler.length || !taseronlar.length) { toast('Önce proje ve taşeron tanımlayın.'); return; }

    const ay = new Date();
    const donemAdi = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
                      'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][ay.getMonth()] + ' ' + ay.getFullYear();

    const kalemSatiri = (m) => `
      <tr data-kalem="${m._id}">
        <td><input type="checkbox" data-sec></td>
        <td><b>${m.poz}</b><div class="muted">${m.tanim}</div></td>
        <td class="num">${num2(m.miktar)} ${m.birim}</td>
        <td class="num">${money(m.birimFiyat)}</td>
        <td class="num"><input type="number" data-miktar min="0" step="0.01" value="0"
          max="${m.miktar}" aria-label="Bu dönem miktarı"></td>
        <td class="num" data-tutar>₺0</td>
      </tr>`;

    const sonuc = await UI.form({
      baslik: 'Yeni hakediş',
      aciklama: 'Proje ve taşeron seçin, ardından bu dönem gerçekleşen imalat miktarlarını girin.',
      kaydetEtiketi: 'Hakedişi oluştur',
      alanlar: [
        { ad: 'proje', etiket: 'Proje', tur: 'secim', secenekler: projeler.map((p) => ({ deger: p.id, ad: p.ad })) },
        { ad: 'taseron', etiket: 'Taşeron', tur: 'secim', secenekler: taseronlar.map((t) => ({ deger: t.id, ad: t.ad })) },
        { ad: 'donem', etiket: 'Dönem', deger: donemAdi, zorunlu: true },
        { ad: 'avansMahsup', etiket: 'Avans mahsubu (₺)', tur: 'number', min: 0, adim: '0.01', deger: 0 }
      ],
      ek: `<div id="kaliteUyari"></div>
           <div class="kalem-tablo">
             <h4>Metraj kalemleri</h4>
             <div class="table-wrap"><table>
               <thead><tr><th></th><th>Poz</th><th class="num">Sözleşme</th>
                 <th class="num">Birim fiyat</th><th class="num">Bu dönem</th><th class="num">Tutar</th></tr></thead>
               <tbody id="kalemGovde"></tbody>
             </table></div>
             <div class="ozet-blok">
               <div class="ozet-satir"><span>İmalat bedeli</span><b id="ozetImalat">₺0</b></div>
               <div class="ozet-satir"><span>Kesinti (${pct(KESINTI_ORANI * 100)})</span><b id="ozetKesinti">₺0</b></div>
               <div class="ozet-satir"><span>KDV (${pct(KDV_ORANI * 100)})</span><b id="ozetKdv">₺0</b></div>
               <div class="ozet-satir vurgu"><span>Ödenecek tutar</span><b id="ozetNet">₺0</b></div>
             </div>
           </div>`,
      hazir: (kutu) => {
        kutu.querySelector('.modal').classList.add('genis');
        const govde = kutu.querySelector('#kalemGovde');
        const projeSec = kutu.querySelector('#f_proje');
        const taseronSec = kutu.querySelector('#f_taseron');
        const avansGirdi = kutu.querySelector('#f_avansMahsup');

        /* Secilen taseronun acik kalite sapmalari hakedis oncesi uyari verir */
        const kaliteUyar = () => {
          const acik = S.get('kaliteKontrol').filter((q) => q.taseron === taseronSec.value &&
            (q.sonuc === 'Red' || q.sonuc === 'Şartlı Onay') && !q.tekrarKayit);
          const kutucuk = kutu.querySelector('#kaliteUyari');
          kutucuk.innerHTML = acik.length ? `
            <div class="uyari-kutu">
              ${icon('alert')}
              <div><b>${acik.length} açık kalite sapması</b>
                <span>${acik.map((q) => q.imalat + ' (' + q.sonuc + ')').join(' · ')}</span></div>
            </div>` : '';
        };
        taseronSec.addEventListener('change', kaliteUyar);
        kaliteUyar();

        const kalemleriYaz = () => {
          const kalemler = S.get('metraj').filter((m) => m.proje === projeSec.value);
          govde.innerHTML = kalemler.map(kalemSatiri).join('') ||
            '<tr><td colspan="6"><div class="empty">Bu projede metraj kalemi yok.</div></td></tr>';
          ozetle();
        };

        const ozetle = () => {
          let imalat = 0;
          govde.querySelectorAll('[data-kalem]').forEach((tr) => {
            const m = S.bul('metraj', tr.dataset.kalem);
            const sec = tr.querySelector('[data-sec]');
            const gir = tr.querySelector('[data-miktar]');
            if (!m || !sec || !gir) return;
            gir.disabled = !sec.checked;
            if (Number(gir.value) > m.miktar) {       // sozlesme miktarini asamaz
              gir.value = m.miktar;
              toast(m.poz + ' için en fazla ' + num2(m.miktar) + ' ' + m.birim + ' girilebilir.');
            }
            const tutar = sec.checked ? Number(gir.value || 0) * m.birimFiyat : 0;
            tr.querySelector('[data-tutar]').textContent = money(tutar);
            imalat += tutar;
          });
          const h = hakedisHesapla([{ miktar: imalat, birimFiyat: 1 }], Number(avansGirdi.value || 0));
          kutu.querySelector('#ozetImalat').textContent = money(h.imalat);
          kutu.querySelector('#ozetKesinti').textContent = '-' + money(h.kesinti);
          kutu.querySelector('#ozetKdv').textContent = money(h.kdv);
          kutu.querySelector('#ozetNet').textContent = money(h.imalat - h.kesinti - h.avansMahsup + h.kdv);
        };

        govde.addEventListener('input', ozetle);
        govde.addEventListener('change', ozetle);
        avansGirdi.addEventListener('input', ozetle);
        projeSec.addEventListener('change', kalemleriYaz);
        kalemleriYaz();
      },
      topla: (kutu) => {
        const kalemler = [];
        kutu.querySelectorAll('[data-kalem]').forEach((tr) => {
          const sec = tr.querySelector('[data-sec]');
          const miktar = Number(tr.querySelector('[data-miktar]').value || 0);
          const m = S.bul('metraj', tr.dataset.kalem);
          if (sec && sec.checked && miktar > 0 && m) {
            kalemler.push({ metrajId: m._id, poz: m.poz, tanim: m.tanim,
                            birim: m.birim, birimFiyat: m.birimFiyat, miktar });
          }
        });
        return { kalemler };
      }
    });

    if (!sonuc) return;
    if (!sonuc.kalemler.length) { toast('En az bir kalem seçip miktar girmelisiniz.'); return; }

    const tutarlar = hakedisHesapla(sonuc.kalemler, sonuc.avansMahsup);
    const sira = S.get('hakedisler').length + 14;
    const kayit = S.ekle('hakedisler', {
      no: 'HK-' + String(sira).padStart(3, '0'),
      donem: sonuc.donem, proje: sonuc.proje, taseron: sonuc.taseron,
      kalemler: sonuc.kalemler, ...tutarlar,
      durum: 'Taslak', onaylayan: '-', tarih: new Date().toISOString().slice(0, 10)
    });
    toast(kayit.no + ' taslak olarak oluşturuldu (' + money(hakedisBrut(kayit)) + ').');
  }

  async function hakedisDetay(id) {
    const h = S.bul('hakedisler', id);
    if (!h) return;
    const kalemler = h.kalemler || [];
    await UI.modal({
      baslik: h.no + ' · ' + h.donem,
      aciklama: projeAd(h.proje) + ' · ' + taseronAd(h.taseron) + ' · ' + h.durum,
      icerik: `
        <div class="table-wrap"><table>
          <thead><tr><th>Poz</th><th>Tanım</th><th class="num">Miktar</th>
            <th class="num">Birim fiyat</th><th class="num">Tutar</th></tr></thead>
          <tbody>${kalemler.map((k) => `<tr>
            <td class="strong">${k.poz}</td><td>${k.tanim}</td>
            <td class="num">${num2(k.miktar)} ${k.birim}</td>
            <td class="num">${money(k.birimFiyat)}</td>
            <td class="num strong">${money(k.miktar * k.birimFiyat)}</td></tr>`).join('') ||
            `<tr><td colspan="5"><div class="empty">Bu hakediş kalem ayrıntısı olmadan (devir kaydı olarak) oluşturulmuş.</div></td></tr>`}
          </tbody>
        </table></div>
        <div class="ozet-satir"><span>İmalat bedeli</span><b>${money(h.imalat)}</b></div>
        <div class="ozet-satir"><span>Kesinti</span><b>-${money(h.kesinti)}</b></div>
        <div class="ozet-satir"><span>Avans mahsubu</span><b>-${money(h.avansMahsup)}</b></div>
        <div class="ozet-satir"><span>KDV</span><b>${money(h.kdv)}</b></div>
        <div class="ozet-satir vurgu"><span>Ödenecek tutar</span><b>${money(hakedisBrut(h))}</b></div>
        <div class="ozet-satir"><span>Onaylayan</span><b>${h.onaylayan || '-'}</b></div>`,
      dugmeler: [{ ad: 'PDF yerine CSV indir', deger: 'csv' }, { ad: 'Kapat', tur: 'accent', deger: null }]
    }).then((secim) => {
      if (secim !== 'csv') return;
      const satirlar = [['Poz', 'Tanım', 'Miktar', 'Birim', 'Birim Fiyat', 'Tutar']]
        .concat(kalemler.map((k) => [k.poz, k.tanim, k.miktar, k.birim, k.birimFiyat, k.miktar * k.birimFiyat]));
      indir(h.no + '.csv', 'text/csv;charset=utf-8',
        '﻿' + satirlar.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'));
      toast(h.no + ' kalem listesi indirildi.');
    });
  }

  async function hakedisIlerlet(id) {
    const h = S.bul('hakedisler', id);
    if (!h) return;
    const adim = AKIS[h.durum];
    if (!adim) return;
    if (adim.sonraki === 'Onaylandı') {
      const onay = await UI.onay('Hakedişi onayla',
        `${h.no} · ${money(hakedisBrut(h))} tutarındaki hakediş onaylanacak ve ödeme talimatına dönüşecek.`,
        'Onayla');
      if (!onay) return;
    }
    S.guncelle('hakedisler', id, {
      durum: adim.sonraki,
      onaylayan: adim.sonraki === 'Onaylandı' ? 'Proje Müdürü'
               : adim.sonraki === 'Onay Bekliyor' ? 'Kontrol Şefi' : (h.onaylayan || '-'),
      tarih: new Date().toISOString().slice(0, 10)
    });
    toast(h.no + ' → ' + adim.sonraki);
  }

  async function hakedisReddet(id) {
    const h = S.bul('hakedisler', id);
    if (!h) return;
    const sonuc = await UI.form({
      baslik: h.no + ' reddedilecek',
      kaydetEtiketi: 'Reddet',
      alanlar: [{ ad: 'gerekce', etiket: 'Red gerekçesi', tur: 'metin-uzun', zorunlu: true, genis: true,
                  ipucu: 'Örn. 3. kat imalat miktarı yerinde doğrulanamadı.' }]
    });
    if (!sonuc) return;
    S.guncelle('hakedisler', id, { durum: 'Reddedildi', onaylayan: 'Proje Müdürü',
                                   redGerekce: sonuc.gerekce, tarih: new Date().toISOString().slice(0, 10) });
    toast(h.no + ' reddedildi.');
  }


  /* ------------------------------------------------------------- stok */
  function viewStok() {
    const rows = S.get('stok').map((s) => {
      const kullanilabilir = s.mevcut - s.rezerve;
      const oran = Math.min(100, (kullanilabilir / (s.kritik || 1)) * 100);
      const kritikMi = kullanilabilir < s.kritik;
      return `<tr>
        <td><span class="strong">${s.ad}</span><div class="muted">${s.kod} · ${s.depo}</div></td>
        <td class="num">${num2(s.mevcut)} ${s.birim}</td>
        <td class="num">${num2(s.rezerve)}</td>
        <td class="num ${kritikMi ? '' : ''}">${num2(kullanilabilir)}</td>
        <td class="num">${num2(s.kritik)}</td>
        <td style="min-width:130px">${bar(oran, kritikMi ? 'bad' : oran > 150 ? 'ok' : 'warn')}</td>
        <td class="num">${money(s.mevcut * s.birimFiyat)}</td>
        <td>${kritikMi ? badge('Sipariş ver', 'bad') : badge('Yeterli', 'ok')}</td>
      </tr>`;
    }).join('');

    const stokDeger = S.get('stok').reduce((s, x) => s + x.mevcut * x.birimFiyat, 0);

    return `
    ${pageHead('MALZEME STOK', 'Depo bazlı mevcut, rezerve ve kullanilabilir miktarlar ile kritik seviye uyarıları.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(stokDeger), 'Toplam stok değeri', 'up', S.get('stok').length + ' kalem')}
      ${kpi(String(kritikStok().length), 'Kritik seviye', 'down', 'sipariş önerilir')}
      ${kpi(String(new Set(S.get('stok').map((s) => s.depo)).size), 'Aktif depo', 'up', 'saha + merkez')}
      ${kpi(moneyShort(S.get('stok').reduce((s, x) => s + x.rezerve * x.birimFiyat, 0)), 'Rezerve tutar', 'up', 'imalata ayrılan')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Stok durumu</h3><div class="spacer"></div>
          <button class="btn ghost sm" data-act="sayim">${icon('check')} Sayım başlat</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Malzeme</th><th class="num">Mevcut</th><th class="num">Rezerve</th>
            <th class="num">Kullanılabilir</th><th class="num">Kritik</th><th>Seviye</th>
            <th class="num">Değer</th><th>Durum</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Sipariş önerileri</h3></div>
        ${kritikStok().map((s) => `
          <div class="list-item">
            <div class="ico">${icon('box')}</div>
            <div class="txt"><b>${s.ad}</b>
              <span>Eksik ${num2(s.kritik - (s.mevcut - s.rezerve))} ${s.birim}</span></div>
            <div class="spacer"></div>
            <button class="btn sm" data-act="siparis">Talep</button>
          </div>`).join('') || '<div class="empty">Kritik seviyede malzeme yok.</div>'}
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------- tedarik */
  function viewTedarik() {
    const rows = S.get('siparisler').map((o) => `
      <tr>
        <td><span class="strong">${o.no}</span><div class="muted">${o.sipariş}</div></td>
        <td>${o.tedarikci}</td>
        <td>${o.malzeme}<div class="muted">${o.miktar}</div></td>
        <td class="num">${money(o.tutar)}</td>
        <td class="num">${o.teslim}</td>
        <td style="min-width:130px">${bar(o.ilerleme, o.durum === 'Gecikmeli' ? 'bad' : o.ilerleme === 100 ? 'ok' : '')}</td>
        <td>${badge(o.durum, durumKind(o.durum))}</td>
      </tr>`).join('');

    const toplam = S.get('siparisler').reduce((s, o) => s + o.tutar, 0);
    const geciken = S.get('siparisler').filter((o) => o.durum === 'Gecikmeli');

    return `
    ${pageHead('TEDARİK & SİPARİŞ', 'Satın alma siparişlerinin onay, sevkiyat ve teslim takibi.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(toplam), 'Acik sipariş tutari', 'up', S.get('siparisler').length + ' sipariş')}
      ${kpi(String(S.get('siparisler').filter((o) => o.durum === 'Yolda').length), 'Sevkiyatta', 'up', 'yolda')}
      ${kpi(String(geciken.length), 'Geciken teslim', 'down', 'takip gerekli')}
      ${kpi(String(S.get('siparisler').filter((o) => o.durum === 'Onay Bekliyor').length), 'Onay bekleyen', 'down', 'satın alma')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Sipariş listesi</h3><div class="spacer"></div>
          <button class="btn accent sm" data-act="yeni-siparis">${icon('plus')} Sipariş oluştur</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th>No</th><th>Tedarikçi</th><th>Malzeme</th><th class="num">Tutar</th>
            <th class="num">Teslim</th><th>İlerleme</th><th>Durum</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="3">Toplam</td><td class="num">${money(toplam)}</td>
            <td colspan="3"></td></tr></tfoot>
        </table></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Teslim takvimi</h3></div>
        <div class="timeline">
          ${S.get('siparisler').slice().sort((a, b) => a.teslim.localeCompare(b.teslim)).map((o) => `
            <div class="tl"><b>${o.teslim} · ${o.malzeme}</b>
              <span>${o.tedarikci} · ${o.miktar} · ${o.durum}</span></div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  /* ----------------------------------------------------------- rapor */
  function viewRapor() {
    const kart = (r) => `
      <div class="card">
        <div class="card-head">
          <div><h3>${r.ad}</h3>
            <div class="muted" style="font-size:11px;color:var(--ink-3)">${r.id} · ${r.periyot} · ${r.kanal}</div></div>
          <div class="spacer"></div>
          ${badge(r.hedef, r.hedef === 'Üst Yetkili' ? 'accent' : 'info')}
        </div>
        <div class="stat-inline" style="margin-bottom:12px">
          <div><span>Kapsam</span><b style="font-size:12.5px">${r.kapsam === 'Tüm Projeler' ? r.kapsam : (projeAd(r.kapsam) !== r.kapsam ? projeAd(r.kapsam) : taseronAd(r.kapsam))}</b></div>
          <div><span>Son gönderim</span><b style="font-size:12.5px">${r.sonGonderim}</b></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
          ${r.icerik.map((i) => `<span class="badge">${i}</span>`).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn sm" data-act="gonder">${icon('send')} Şimdi gönder</button>
          <button class="btn ghost sm" data-act="pdf">${icon('download')} PDF</button>
        </div>
      </div>`;

    return `
    ${pageHead('RAPORLAMA', 'Üst yetkiliye yönetim özeti, alt taşerona bilgi raporu. Periyodik gönderimler otomatik tetiklenir.')}
    <div class="grid cols-2" style="padding:0 10px 14px">
      ${S.get('raporlar').map(kart).join('')}
    </div>
    <div class="grid cols-3" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Portföy ilerlemesi</h3></div>
        ${S.get('projeler').map((p) => `
          <div style="padding:9px 0;border-top:1px solid var(--line-soft)">
            <div style="display:flex;font-size:12.5px;margin-bottom:6px">
              <span>${p.ad}</span>
              <span style="margin-left:auto;color:var(--ink-3)">${moneyShort(p.gerceklesen)}</span></div>
            ${bar(p.ilerleme, p.ilerleme >= 80 ? 'ok' : p.ilerleme >= 60 ? 'warn' : 'bad')}
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-head"><h3>Nakit akış projeksiyonu</h3></div>
        ${lineChart([18, 22, 19, 26, 31, 28, 34, 39])}
        <div class="legend" style="margin-top:10px">
          <span><i style="background:#f0421c"></i>Aylık net hakediş ödemesi (mn ₺)</span>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Risk gündemi</h3></div>
        ${[
          { t: 'Nova Elektrik SGK evrakı süresi doldu', k: 'bad' },
          { t: 'PPRC boru siparişinde 7 gün gecikme', k: 'bad' },
          { t: 'İnşaat demiri stoğu kritik seviyede', k: 'warn' },
          { t: 'Mekanik hat basınç testi red aldı', k: 'warn' },
          { t: 'HK-017 hakedişi reddedildi, revize bekleniyor', k: 'warn' }
        ].map((r) => `<div class="list-item">
            <div class="ico">${icon('alert')}</div>
            <div class="txt"><b>${r.t}</b><span>otomatik tespit</span></div>
            <div class="spacer"></div>${badge(r.k === 'bad' ? 'Yüksek' : 'Orta', r.k)}
          </div>`).join('')}
      </div>
    </div>`;
  }

  function pageHead(baslik, aciklama) {
    return `<div class="page-head">
      <div><h2>${baslik}</h2><p>${aciklama}</p></div>
      <div class="spacer"></div>
      <button class="chip">${icon('filter')} Filtre</button>
      <button class="chip">${icon('search')} Ara</button>
    </div>`;
  }

  const VIEWS = {
    ozet: viewOzet, paftalar: viewPaftalar, metraj: viewMetraj, taseron: viewTaseron,
    kalite: viewKalite, hakedis: viewHakedis, stok: viewStok, tedarik: viewTedarik, rapor: viewRapor
  };

  /* ------------------------------------------------------- yonlendirme */
  function currentRoute() {
    const id = (location.hash || '#ozet').slice(1);
    return VIEWS[id] ? id : 'ozet';
  }

  function render() {
    const route = currentRoute();
    document.getElementById('view').innerHTML = VIEWS[route]();
    document.querySelectorAll('.nav a').forEach((a) =>
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + route));
    document.querySelectorAll('.rail button[data-route]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.route === route));
    bindView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------------------------------ etkilesimler */
  function tikla(secici, isleyici) {
    document.querySelectorAll(secici).forEach((el) =>
      el.addEventListener('click', () => isleyici(el)));
  }

  function bindView() {
    /* yetki anahtarlari - kalici */
    tikla('[data-yetki]', (el) => {
      const [tid, key] = el.dataset.yetki.split('|');
      const acik = S.yetkiDegistir(tid, key);
      el.classList.toggle('on', acik);
      el.setAttribute('aria-pressed', String(acik));
      const ad = (DB.YETKI_LISTESI.find((y) => y.key === key) || {}).ad;
      toast(`${taseronAd(tid)} · "${ad}" yetkisi ${acik ? 'verildi' : 'kaldırıldı'}`);
    });

    /* kart seridi kaydirma */
    tikla('[data-strip]', (b) => {
      const strip = document.getElementById('strip');
      if (strip) strip.scrollBy({ left: Number(b.dataset.strip) * 302, behavior: 'smooth' });
    });

    /* gorunum gecisleri */
    tikla('[data-goto]', (b) => { location.hash = '#' + b.dataset.goto; });

    /* --- metraj --- */
    tikla('[data-act="metraj-ekle"]', () => metrajFormu(null));
    tikla('[data-act="metraj-csv"]', metrajCSV);
    tikla('[data-metraj-duzenle]', (b) => metrajFormu(b.dataset.metrajDuzenle));
    tikla('[data-metraj-sil]', async (b) => {
      const m = S.bul('metraj', b.dataset.metrajSil);
      if (!m) return;
      if (await UI.onay('Metraj kalemini sil', `${m.poz} — ${m.tanim} kalemi silinecek.`, 'Sil')) {
        S.sil('metraj', m._id); toast(m.poz + ' silindi.');
      }
    });
    tikla('[data-metraj-dogrula]', (b) => {
      const m = S.bul('metraj', b.dataset.metrajDogrula);
      if (!m) return;
      S.guncelle('metraj', m._id, { guven: 1, kaynak: 'Manuel' });
      toast(m.poz + ' manuel olarak doğrulandı.');
    });
    const metrajProje = document.getElementById('metrajProje');
    if (metrajProje) metrajProje.addEventListener('change', () => {
      state.metrajProje = metrajProje.value; render();
    });

    /* --- hakediş --- */
    tikla('[data-act="hakedis-ekle"]', hakedisFormu);
    tikla('[data-hakedis-detay]', (b) => hakedisDetay(b.dataset.hakedisDetay));
    tikla('[data-hakedis-ilerlet]', (b) => hakedisIlerlet(b.dataset.hakedisIlerlet));
    tikla('[data-hakedis-red]', (b) => hakedisReddet(b.dataset.hakedisRed));
    tikla('[data-hakedis-sil]', async (b) => {
      const h = S.bul('hakedisler', b.dataset.hakedisSil);
      if (!h) return;
      if (await UI.onay('Hakedişi sil', `${h.no} (${h.donem}) silinecek.`, 'Sil')) {
        S.sil('hakedisler', h._id); toast(h.no + ' silindi.');
      }
    });
    const hakedisDurum = document.getElementById('hakedisDurum');
    if (hakedisDurum) hakedisDurum.addEventListener('change', () => {
      state.hakedisDurum = hakedisDurum.value; render();
    });

    /* --- kalite kontrol --- */
    tikla('[data-act="kalite-ekle"]', () => kaliteFormu(null));
    tikla('[data-act="kalite-csv"]', () => kaliteCSV(kaliteListesi()));
    tikla('[data-kalite-detay]', (b) => kaliteDetay(b.dataset.kaliteDetay));
    tikla('[data-kalite-tekrar]', (b) => kaliteFormu(b.dataset.kaliteTekrar));
    tikla('[data-kalite-sil]', async (b) => {
      const q = S.bul('kaliteKontrol', b.dataset.kaliteSil);
      if (!q) return;
      if (await UI.onay('Kontrol kaydını sil', `${q.id} — ${q.imalat} kaydı silinecek.`, 'Sil')) {
        for (const f of (q.fotograflar || [])) { try { await Dosya.sil(f.id); } catch (e) { /* yoksa geç */ } }
        S.sil('kaliteKontrol', q._id);
        toast(q.id + ' silindi.');
      }
    });
    const kaliteSonuc = document.getElementById('kaliteSonuc');
    if (kaliteSonuc) kaliteSonuc.addEventListener('change', () => {
      state.kaliteSonuc = kaliteSonuc.value; render();
    });

    /* --- paftalar --- */
    tikla('[data-pafta-ac]', (b) => paftaAc(b.dataset.paftaAc));
    tikla('[data-pafta-sil]', (b) => paftaSil(b.dataset.paftaSil));
    tikla('[data-pafta-indir]', (b) => {
      const d = S.bul('paftalar', b.dataset.paftaIndir);
      if (d) Dosya.indir(d.dosyaId, d.ad).catch(() => toast('Dosya içeriği bulunamadı.'));
    });
    depoBilgisiniYaz();

    /* dosya yukleme */
    const dz = document.getElementById('dz');
    const input = document.getElementById('fileInput');
    if (dz) {
      ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => {
        e.preventDefault(); dz.classList.add('is-over');
      }));
      ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => {
        e.preventDefault(); dz.classList.remove('is-over');
      }));
      dz.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
    }
    if (input) input.addEventListener('change', (e) => addFiles(e.target.files));

    /* henuz baglanmamis demo aksiyonlari */
    const mesaj = {
      dogrula: 'Kalem manuel doğrulama kuyruğuna alındı.',
      'yeni-siparis': 'Tedarik modülü bir sonraki adımda bağlanacak.',
      siparis: 'Tedarik modülü bir sonraki adımda bağlanacak.',
      sayim: 'Stok modülü bir sonraki adımda bağlanacak.',
      gonder: 'Raporlama modülü bir sonraki adımda bağlanacak.',
      pdf: 'Raporlama modülü bir sonraki adımda bağlanacak.'
    };
    document.querySelectorAll('[data-act]').forEach((b) => {
      const m = mesaj[b.dataset.act];
      if (m) b.addEventListener('click', () => toast(m));
    });
  }

  /* Depolama kullanimini pafta kartinin basligina yazar */
  async function depoBilgisiniYaz() {
    const el = document.getElementById('depoBilgi');
    if (!el) return;
    const adet = S.get('paftalar').length;
    try {
      const k = await Dosya.kota();
      if (k && k.toplam) {
        el.textContent = `${adet} dosya · ${(k.kullanilan / 1048576).toFixed(1)} MB / ` +
                         `${(k.toplam / 1048576).toFixed(0)} MB kullanılıyor`;
        return;
      }
    } catch (e) { /* kota bilgisi yoksa yalnizca adet */ }
    el.textContent = adet + ' dosya';
  }

  /* --------------------------------------------------------- veri yonetimi */
  async function veriYonetimi() {
    const secim = await UI.modal({
      baslik: 'Veri yönetimi',
      aciklama: 'Kayıtlar bu tarayıcıda saklanır. Yedek alıp başka bir cihazda içe aktarabilirsiniz.',
      icerik: `<div class="ozet-satir"><span>Metraj kalemi</span><b>${S.get('metraj').length}</b></div>
        <div class="ozet-satir"><span>Hakediş dosyası</span><b>${S.get('hakedisler').length}</b></div>
        <div class="ozet-satir"><span>Pafta</span><b>${S.get('paftalar').length}</b></div>
        <div class="ozet-satir"><span>Taşeron</span><b>${S.get('taseronlar').length}</b></div>
        <p class="modal-metin" style="margin-top:12px">Sıfırlama tüm değişiklikleri siler ve örnek veriye döner.</p>`,
      dugmeler: [
        { ad: 'Sıfırla', deger: 'sifirla' },
        { ad: 'İçe aktar', deger: 'ice' },
        { ad: 'Yedek indir', tur: 'accent', deger: 'disa' }
      ]
    });
    if (secim === 'disa') {
      indir('insaat-hakedis-yedek.json', 'application/json', S.disaAktar());
      toast('Yedek indirildi.');
    } else if (secim === 'ice') {
      const girdi = document.createElement('input');
      girdi.type = 'file'; girdi.accept = 'application/json';
      girdi.addEventListener('change', () => {
        const dosya = girdi.files[0];
        if (!dosya) return;
        const okuyucu = new FileReader();
        okuyucu.onload = () => {
          try { S.iceAktar(okuyucu.result); toast('Yedek içe aktarıldı.'); }
          catch (e) { toast('İçe aktarılamadı: ' + e.message); }
        };
        okuyucu.readAsText(dosya);
      });
      girdi.click();
    } else if (secim === 'sifirla') {
      if (await UI.onay('Verileri sıfırla',
          'Tüm kayıtlar silinip örnek veri kümesi geri yüklenecek. Bu işlem geri alınamaz.', 'Sıfırla')) {
        S.sifirla(); toast('Veriler sıfırlandı.');
      }
    }
  }


  /* -------------------------------------------------------------- iskele */
  function mount() {
    document.querySelector('.nav').innerHTML =
      MENU.map((m) => `<a href="#${m.id}">${m.ad}</a>`).join('');

    document.querySelector('.rail').innerHTML =
      MENU.map((m, i) => (i === 5 ? '<div class="rail-sep"></div>' : '') +
        `<button data-route="${m.id}" title="${m.ad}" aria-label="${m.ad}">${icon(m.ikon)}</button>`).join('') +
      '<div class="rail-sep"></div>' +
      `<button title="Bildirimler" data-rail="bildirim">${icon('bell')}</button>` +
      `<button title="Veri yönetimi" data-rail="veri">${icon('veri')}</button>`;

    document.querySelector('[data-rail="veri"]').addEventListener('click', veriYonetimi);
    document.querySelector('[data-rail="bildirim"]').addEventListener('click', () => {
      const bekleyen = S.get('hakedisler').filter((h) => h.durum === 'Onay Bekliyor').length;
      const kritik = kritikStok().length;
      toast(`${bekleyen} hakediş onay bekliyor · ${kritik} malzeme kritik seviyede`);
    });

    document.querySelectorAll('.rail button[data-route]').forEach((b) =>
      b.addEventListener('click', () => { location.hash = '#' + b.dataset.route; }));

    document.querySelectorAll('.role-switch button').forEach((b) => {
      b.addEventListener('click', () => {
        state.rol = b.dataset.rol;
        document.querySelectorAll('.role-switch button').forEach((x) =>
          x.classList.toggle('is-active', x === b));
        toast(state.rol === 'yonetici'
          ? 'Yönetici görünümü: onay ve yetkilendirme açık.'
          : 'Taşeron görünümü: yalnızca kendi işleri ve bilgi raporları.');
        render();
      });
    });

    window.addEventListener('hashchange', render);
    S.abone(() => render());     // veri degistiginde ekran yenilenir
    render();
  }

  document.addEventListener('DOMContentLoaded', mount);
})();
