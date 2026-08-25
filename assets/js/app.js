/* İnşaat Hakediş Paneli - gorunum yonlendirici ve ekranlar */
(function () {
  const { icon, num, num2, money, moneyShort, pct, donut, arcChart,
          lineChart, barChart, badge, bar, toast } = window.UI;
  const DB = window.DB;          // sabit tanimlar (yetki listesi, grafik serisi)
  const S = window.Store;        // kalici veri

  /* -------------------------------------------------------------- durum */
  const state = {
    metrajProje: 'hepsi',
    hakedisDurum: 'hepsi',
    kaliteSonuc: 'hepsi',
    stokDepo: 'hepsi',
    siparisDurum: 'hepsi',
    isProje: 'hepsi',
    personelFirma: 'hepsi',
    puantajTarihi: new Date().toISOString().slice(0, 10),
    raporTaseron: '',
    acikTaseron: null
  };

  /* Hakedis onay akisi ve rol yetkileri */
  const AKIS = {
    'Taslak':        { sonraki: 'Kontrolde',     eylem: 'Kontrole gönder', rol: 'her' },
    'Kontrolde':     { sonraki: 'Onay Bekliyor', eylem: 'Onaya gönder',    rol: 'onay' },
    'Onay Bekliyor': { sonraki: 'Onaylandı',     eylem: 'Onayla',          rol: 'onay' },
    'Reddedildi':    { sonraki: 'Taslak',        eylem: 'Revize et',       rol: 'her' }
  };
  const KESINTI_ORANI = 0.10;   // teminat + stopaj
  const KDV_ORANI = 0.20;

  const MENU = [
    { id: 'ozet',     ad: 'Genel Bakış',  ikon: 'grid' },
    { id: 'paftalar', ad: 'Projeler & DWG', ikon: 'layers' },
    { id: 'metraj',   ad: 'Metraj',       ikon: 'ruler' },
    { id: 'isler',    ad: 'İşler',        ikon: 'briefcase' },
    { id: 'taseron',  ad: 'Taşeronlar',   ikon: 'users' },
    { id: 'personel', ad: 'Personel',     ikon: 'kimlik' },
    { id: 'kalite',   ad: 'Kalite Kontrol', ikon: 'shield' },
    { id: 'hakedis',  ad: 'Hakediş',      ikon: 'receipt' },
    { id: 'stok',     ad: 'Stok',         ikon: 'box' },
    { id: 'tedarik',  ad: 'Tedarik',      ikon: 'truck' },
    { id: 'rapor',    ad: 'Raporlar',     ikon: 'report' },
    { id: 'kullanici', ad: 'Kullanıcılar', ikon: 'users' }
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
          <div class="card-head"><h3>Projeler</h3><div class="spacer"></div>
            <button class="btn accent sm" data-act="proje-ekle">${icon('plus')} Proje ekle</button></div>
          ${S.get('projeler').map((p) => `
            <div class="list-item">
              <div class="ico">${icon('building')}</div>
              <div class="txt"><b>${p.ad}</b>
                <span>${p.blok || '—'} · ${p.isveren || '—'} · ${moneyShort(p.sozlesme)}</span></div>
              <div class="spacer"></div>
              ${badge(p.durum, durumKind(p.durum))}
              <div class="satir-islem">
                <button class="ikon-btn" title="Düzenle" data-proje-duzenle="${p._id}">${icon('kalem')}</button>
                <button class="ikon-btn tehlike" title="Sil" data-proje-sil="${p._id}">${icon('cop')}</button>
              </div>
            </div>`).join('') || '<div class="empty">Kayıtlı proje yok.</div>'}
        </div>
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
    const kartlar = S.get('taseronlar').map((t) => {
      const isleri = S.get('isler').filter((i) => i.taseron === t.id);
      const devamEden = isleri.filter((i) => i.durum === 'Devam').length;
      const acik = state.acikTaseron === t._id;
      const izin = S.yetkiler(t.id);

      const isSatirlari = isleri.map((i) => `
        <div class="is-satir">
          <div class="txt">
            <b>${i.ad}</b>
            <span>${projeAd(i.proje)}${i.mahal ? ' · ' + i.mahal : ''} · ${moneyShort(i.planlanan)}</span>
          </div>
          <div class="is-satir-sag">
            ${badge(i.durum, durumKind(i.durum))}
            <div class="bar ${i.ilerleme >= 80 ? 'ok' : i.ilerleme >= 40 ? 'warn' : 'bad'}">
              <span style="width:${Math.max(0, Math.min(100, i.ilerleme))}%"></span></div>
            <b class="oran">${pct(i.ilerleme)}</b>
          </div>
        </div>`).join('');

      return `
      <div class="card taseron-karti ${acik ? 'izin-acik' : ''}">
        <div class="satir-islem taseron-islem">
          <button class="ikon-btn" title="Düzenle" data-taseron-duzenle="${t._id}">${icon('kalem')}</button>
          <button class="ikon-btn tehlike" title="Sil" data-taseron-sil="${t._id}">${icon('cop')}</button>
        </div>
        <button class="taseron-bas" data-taseron-ac="${t._id}"
                aria-expanded="${acik}" title="Panel yetkilerini göster/gizle">
          <span class="taseron-kimlik">
            <b>${t.ad}</b>
            <em>${t.brans} · ${t.yetkili || '—'} · Puan ${num2(t.puan)}</em>
          </span>
          <span class="spacer"></span>
          ${badge(t.durum, durumKind(t.durum))}
          <span class="chevron">${icon('down')}</span>
        </button>

        <div class="stat-inline">
          <div><span>Sözleşme</span><b>${moneyShort(t.sozlesme)}</b></div>
          <div><span>Devam eden iş</span><b>${devamEden} / ${isleri.length}</b></div>
          <div><span>SGK</span><b style="font-size:12.5px">${t.sgk}</b></div>
          <div><span>Bitiş</span><b style="font-size:12.5px">${t.sozlesmeBitis || '—'}</b></div>
        </div>

        <div class="taseron-isler">
          <h4>Üstlendiği işler <em>(${isleri.length})</em></h4>
          ${isSatirlari || '<div class="empty">Bu taşerona atanmış iş yok.</div>'}
        </div>

        <div class="izin-bolum" ${acik ? '' : 'hidden'}>
          <h4>Panel yetkileri</h4>
          ${DB.YETKI_LISTESI.map((y) => {
            const on = izin.indexOf(y.key) > -1;
            return `<div class="perm-row">
              ${icon('lock')}<span>${y.ad}</span><div class="spacer"></div>
              <button class="switch ${on ? 'on' : ''}" data-yetki="${t.id}|${y.key}"
                      aria-pressed="${on}" aria-label="${y.ad}"></button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');

    return `
    ${pageHead('TAŞERONLAR', 'Alt yüklenici tanımları, üstlendikleri işler ve panel yetkileri. Kart başlığına tıklayarak yetkileri açıp kapatabilirsiniz.',
               `<button class="btn accent sm" data-act="taseron-ekle">${icon('plus')} Taşeron ekle</button>`)}
    <div class="grid cols-2" style="padding:0 10px">
      ${kartlar || '<div class="empty">Kayıtlı taşeron yok.</div>'}
    </div>`;
  }


  /* --------------------------------------------------------------- işler */
  const IS_DURUM = ['Planlandı', 'Devam', 'Durduruldu', 'Tamamlandı'];

  const isAd = (id) => (S.get('isler').find((i) => i.id === id) || {}).ad || '—';
  const personelAd = (id) => (S.get('personel').find((p) => p.id === id) || {}).ad || id;

  function isListesi() {
    const hepsi = S.get('isler');
    return state.isProje === 'hepsi' ? hepsi : hepsi.filter((i) => i.proje === state.isProje);
  }

  /* Ise bagli metraj kalemlerinin toplam bedeli */
  const isMetrajTutari = (is) => (is.metrajIds || [])
    .map((mid) => S.bul('metraj', mid)).filter(Boolean)
    .reduce((t, m) => t + metrajTutar(m), 0);

  /* Ise tahsis edilen malzemenin toplam degeri */
  const isMalzemeTutari = (is) => (is.malzemeler || []).reduce((t, k) => {
    const m = S.get('stok').find((s) => s.kod === k.kod);
    return t + (m ? m.birimFiyat * k.miktar : 0);
  }, 0);

  /* Puantajdan gunluk isgucu maliyeti */
  function isIsgucuMaliyeti(isId) {
    return S.get('puantaj').filter((p) => p.is === isId).reduce((t, p) => {
      const kisi = S.get('personel').find((x) => x.id === p.personel);
      const k = (DB.PUANTAJ_DURUM[p.durum] || {}).katsayi || 0;
      return t + (kisi ? kisi.yevmiye * k : 0);
    }, 0);
  }

  function viewIsler() {
    const liste = isListesi();

    const kartlar = liste.map((is) => {
      const kisiler = (is.personelIds || []).length;
      const gecikme = is.bitis < bugun() && is.durum !== 'Tamamlandı';
      return `
      <div class="card is-karti">
        <div class="card-head">
          <div style="min-width:0">
            <h3>${is.ad}</h3>
            <div class="muted" style="font-size:11px;color:var(--ink-3)">
              ${is.id} · ${projeAd(is.proje)} · ${is.mahal || '—'}</div>
          </div>
          <div class="spacer"></div>
          ${gecikme ? badge('Süre aştı', 'bad') : ''}
          ${badge(is.durum, durumKind(is.durum))}
          <div class="satir-islem">
            <button class="ikon-btn" title="Detay ve atamalar" data-is-detay="${is._id}">${icon('goz')}</button>
            <button class="ikon-btn" title="Düzenle" data-is-duzenle="${is._id}">${icon('kalem')}</button>
            <button class="ikon-btn tehlike" title="Sil" data-is-sil="${is._id}">${icon('cop')}</button>
          </div>
        </div>
        <div style="margin:4px 0 14px">${bar(is.ilerleme,
          is.ilerleme >= 80 ? 'ok' : is.ilerleme >= 40 ? 'warn' : 'bad')}</div>
        <div class="stat-inline">
          <div><span>Taşeron</span><b style="font-size:12.5px">${taseronAd(is.taseron)}</b></div>
          <div><span>Planlanan</span><b style="font-size:12.5px">${moneyShort(is.planlanan)}</b></div>
          <div><span>Personel</span><b style="font-size:12.5px">${kisiler} kişi</b></div>
          <div><span>Malzeme</span><b style="font-size:12.5px">${(is.malzemeler || []).length} kalem</b></div>
          <div><span>Süre</span><b style="font-size:12.5px">${is.baslangic} → ${is.bitis}</b></div>
        </div>
      </div>`;
    }).join('') || '<div class="empty">Bu projede iş kaydı yok. “İş ekle” ile başlayın.</div>';

    const toplamPlan = liste.reduce((t, i) => t + i.planlanan, 0);
    const devam = liste.filter((i) => i.durum === 'Devam').length;
    const gecikenler = liste.filter((i) => i.bitis < bugun() && i.durum !== 'Tamamlandı');
    const ortIlerleme = liste.length ? liste.reduce((t, i) => t + i.ilerleme, 0) / liste.length : 0;

    return `
    ${pageHead('İŞLER', 'Proje altındaki imalat paketleri; taşeron ataması, malzeme tahsisi, personel görevlendirmesi ve ilerleme takibi.',
      `<div class="arac-cubugu">
         <select id="isProje" aria-label="Proje filtresi">
           <option value="hepsi">Tüm projeler</option>
           ${S.get('projeler').map((p) => `<option value="${p.id}" ${state.isProje === p.id ? 'selected' : ''}>${p.ad}</option>`).join('')}
         </select>
         <button class="btn ghost sm" data-act="is-csv">${icon('download')} CSV</button>
         <button class="btn accent sm" data-act="is-ekle">${icon('plus')} İş ekle</button>
       </div>`)}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(toplamPlan), 'Planlanan iş bedeli', 'up', liste.length + ' iş paketi')}
      ${kpi(num(devam), 'Devam eden iş', 'up', 'sahada aktif')}
      ${kpi(pct(ortIlerleme), 'Ortalama ilerleme', ortIlerleme >= 50 ? 'up' : 'down', 'ağırlıksız')}
      ${kpi(num(gecikenler.length), 'Süresi aşan iş', gecikenler.length ? 'down' : 'up', 'termin takibi')}
    </div>
    <div class="grid cols-2" style="padding:0 10px">${kartlar}</div>`;
  }

  async function isFormu(id) {
    const is = id ? S.bul('isler', id) : null;
    const sonuc = await UI.form({
      baslik: is ? 'İşi düzenle' : 'Yeni iş paketi',
      aciklama: 'İş, bir projenin altındaki imalat paketidir. Kaydettikten sonra malzeme ve personel atayabilirsiniz.',
      kaydetEtiketi: is ? 'Güncelle' : 'İşi ekle',
      alanlar: [
        { ad: 'ad', etiket: 'İş tanımı', zorunlu: true, genis: true, deger: is ? is.ad : '',
          ipucu: 'örn. 3-6. kat duvar örgüsü' },
        { ad: 'proje', etiket: 'Proje', tur: 'secim', deger: is ? is.proje : (state.isProje !== 'hepsi' ? state.isProje : ''),
          secenekler: S.get('projeler').map((p) => ({ deger: p.id, ad: p.ad })) },
        { ad: 'taseron', etiket: 'Taşeron', tur: 'secim', deger: is ? is.taseron : '',
          secenekler: [{ deger: '', ad: 'Atanmadı' }]
            .concat(S.get('taseronlar').map((t) => ({ deger: t.id, ad: t.ad }))) },
        { ad: 'mahal', etiket: 'Mahal / blok', deger: is ? is.mahal : '' },
        { ad: 'sorumlu', etiket: 'Saha sorumlusu', deger: is ? is.sorumlu : '' },
        { ad: 'baslangic', etiket: 'Başlangıç', tur: 'date', deger: is ? is.baslangic : bugun() },
        { ad: 'bitis', etiket: 'Planlanan bitiş', tur: 'date', deger: is ? is.bitis : '' },
        { ad: 'planlanan', etiket: 'Planlanan bedel (₺)', tur: 'number', min: 0, adim: '1000',
          zorunlu: true, deger: is ? is.planlanan : '' },
        { ad: 'ilerleme', etiket: 'İlerleme (%)', tur: 'number', min: 0, deger: is ? is.ilerleme : 0 },
        { ad: 'durum', etiket: 'Durum', tur: 'secim', deger: is ? is.durum : 'Planlandı', secenekler: IS_DURUM }
      ],
      dogrula: (c) => (c.bitis && c.bitis < c.baslangic) ? 'Bitiş tarihi başlangıçtan önce olamaz.' : null
    });
    if (!sonuc) return;
    const kayit = { ...sonuc, ilerleme: Math.max(0, Math.min(100, sonuc.ilerleme)) };
    if (is) { S.guncelle('isler', id, kayit); toast(kayit.ad + ' güncellendi.'); }
    else {
      S.ekle('isler', { ...kayit, id: 'IS-' + String(S.get('isler').length + 1).padStart(3, '0'),
                        metrajIds: [], malzemeler: [], personelIds: [] });
      toast(kayit.ad + ' iş paketi oluşturuldu.');
    }
  }

  /* --------------------------------------------- iş detayı ve atamalar */
  async function isDetay(id) {
    const is = S.bul('isler', id);
    if (!is) return;

    const secim = await UI.modal({
      baslik: is.ad,
      aciklama: `${is.id} · ${projeAd(is.proje)} · ${is.mahal || '—'} · ${taseronAd(is.taseron)}`,
      icerik: `
        <div class="grid cols-2" style="gap:10px">
          <div class="ozet-satir"><span>Planlanan bedel</span><b>${money(is.planlanan)}</b></div>
          <div class="ozet-satir"><span>İlerleme</span><b>${pct(is.ilerleme)}</b></div>
          <div class="ozet-satir"><span>Metraj karşılığı</span><b>${money(isMetrajTutari(is))}</b></div>
          <div class="ozet-satir"><span>Malzeme tahsisi</span><b>${money(isMalzemeTutari(is))}</b></div>
          <div class="ozet-satir"><span>İşgücü maliyeti (puantaj)</span><b>${money(isIsgucuMaliyeti(is.id))}</b></div>
          <div class="ozet-satir"><span>Termin</span><b>${is.baslangic} → ${is.bitis || '—'}</b></div>
        </div>

        <div class="kalem-tablo">
          <h4>Görevli personel (${(is.personelIds || []).length})</h4>
          ${(is.personelIds || []).length ? `<div class="table-wrap"><table>
            <thead><tr><th>Ad</th><th>Görev</th><th>Firma</th><th class="num">Yevmiye</th><th></th></tr></thead>
            <tbody>${(is.personelIds || []).map((pid) => {
              const k = S.get('personel').find((x) => x.id === pid);
              if (!k) return '';
              return `<tr><td class="strong">${k.ad}</td><td>${k.gorev}</td>
                <td>${k.firma === 'Kendi bünyemiz' ? k.firma : taseronAd(k.firma)}</td>
                <td class="num">${money(k.yevmiye)}</td>
                <td class="num"><button class="ikon-btn tehlike" title="Görevden al"
                  data-is-personel-cikar="${pid}">${icon('cop')}</button></td></tr>`;
            }).join('')}</tbody></table></div>`
            : '<div class="empty">Bu işe personel atanmadı.</div>'}
          <button class="btn ghost sm" style="margin-top:8px" data-is-personel-ata>${icon('plus')} Personel ata</button>
        </div>

        <div class="kalem-tablo">
          <h4>Tahsis edilen malzeme (${(is.malzemeler || []).length})</h4>
          ${(is.malzemeler || []).length ? `<div class="table-wrap"><table>
            <thead><tr><th>Malzeme</th><th class="num">Tahsis</th><th class="num">Stokta</th>
              <th class="num">Tutar</th><th></th></tr></thead>
            <tbody>${(is.malzemeler || []).map((k, i) => {
              const m = S.get('stok').find((s) => s.kod === k.kod);
              return `<tr>
                <td class="strong">${m ? m.ad : k.kod}<div class="muted">${k.kod}</div></td>
                <td class="num">${num2(k.miktar)} ${m ? m.birim : ''}</td>
                <td class="num">${m ? num2(m.mevcut) : '—'}</td>
                <td class="num">${m ? money(m.birimFiyat * k.miktar) : '—'}</td>
                <td class="num"><button class="ikon-btn tehlike" title="Tahsisi kaldır"
                  data-is-malzeme-cikar="${i}">${icon('cop')}</button></td></tr>`;
            }).join('')}</tbody></table></div>`
            : '<div class="empty">Bu işe malzeme tahsis edilmedi.</div>'}
          <button class="btn ghost sm" style="margin-top:8px" data-is-malzeme-ekle>${icon('plus')} Malzeme tahsis et</button>
        </div>

        <div class="kalem-tablo">
          <h4>Bağlı metraj kalemleri (${(is.metrajIds || []).length})</h4>
          ${(is.metrajIds || []).length ? `<div class="table-wrap"><table>
            <thead><tr><th>Poz</th><th>Tanım</th><th class="num">Miktar</th><th class="num">Tutar</th></tr></thead>
            <tbody>${(is.metrajIds || []).map((mid) => {
              const m = S.bul('metraj', mid);
              return m ? `<tr><td class="strong">${m.poz}</td><td>${m.tanim}</td>
                <td class="num">${num2(m.miktar)} ${m.birim}</td>
                <td class="num">${money(metrajTutar(m))}</td></tr>` : '';
            }).join('')}</tbody></table></div>` : '<div class="empty">Metraj kalemi bağlanmadı.</div>'}
          <button class="btn ghost sm" style="margin-top:8px" data-is-metraj>${icon('plus')} Metraj kalemi bağla</button>
        </div>`,
      hazir: (kutu, bitir) => {
        kutu.querySelector('.modal').classList.add('genis');
        kutu.querySelector('[data-is-personel-ata]').addEventListener('click', () => bitir('personel'));
        kutu.querySelector('[data-is-malzeme-ekle]').addEventListener('click', () => bitir('malzeme'));
        kutu.querySelector('[data-is-metraj]').addEventListener('click', () => bitir('metraj'));
        kutu.querySelectorAll('[data-is-personel-cikar]').forEach((b) =>
          b.addEventListener('click', () => bitir('personel-cikar:' + b.dataset.isPersonelCikar)));
        kutu.querySelectorAll('[data-is-malzeme-cikar]').forEach((b) =>
          b.addEventListener('click', () => bitir('malzeme-cikar:' + b.dataset.isMalzemeCikar)));
      },
      dugmeler: [{ ad: 'Düzenle', deger: 'duzenle' }, { ad: 'Kapat', tur: 'accent', deger: null }]
    });

    if (!secim) return;
    if (secim === 'duzenle') return isFormu(id);
    if (secim === 'personel') return isPersonelAta(id);
    if (secim === 'malzeme') return isMalzemeTahsis(id);
    if (secim === 'metraj') return isMetrajBagla(id);
    if (secim.startsWith('personel-cikar:')) {
      const pid = secim.split(':')[1];
      S.guncelle('isler', id, { personelIds: (is.personelIds || []).filter((x) => x !== pid) });
      toast(personelAd(pid) + ' işten çıkarıldı.');
      return isDetay(id);
    }
    if (secim.startsWith('malzeme-cikar:')) {
      const i = Number(secim.split(':')[1]);
      const kalan = (is.malzemeler || []).slice();
      const [cikan] = kalan.splice(i, 1);
      S.guncelle('isler', id, { malzemeler: kalan });
      /* tahsis kaldirilinca rezerve serbest birakilir */
      const m = S.get('stok').find((s) => s.kod === cikan.kod);
      if (m) {
        S.guncelle('stok', m._id, { rezerve: Math.max(0, m.rezerve - cikan.miktar) });
        S.ekle('hareketler', { malzeme: m.kod, tur: 'Rezerve İptal', miktar: cikan.miktar,
          tarih: bugun(), kaynak: 'İş', aciklama: is.id + ' tahsisi kaldırıldı' });
      }
      toast('Tahsis kaldırıldı, rezerve serbest bırakıldı.');
      return isDetay(id);
    }
  }

  async function isPersonelAta(id) {
    const is = S.bul('isler', id);
    const aday = S.get('personel').filter((p) => !(is.personelIds || []).includes(p.id) && p.durum !== 'Ayrıldı');
    if (!aday.length) { toast('Atanabilecek personel kalmadı.'); return; }
    const sonuc = await UI.form({
      baslik: 'Personel ata · ' + is.ad,
      kaydetEtiketi: 'Ata',
      alanlar: [{ ad: 'personel', etiket: 'Personel', tur: 'secim',
        secenekler: aday.map((p) => ({ deger: p.id,
          ad: `${p.ad} — ${p.gorev} (${p.firma === 'Kendi bünyemiz' ? p.firma : taseronAd(p.firma)})` })) }]
    });
    if (!sonuc) return;
    S.guncelle('isler', id, { personelIds: (is.personelIds || []).concat(sonuc.personel) });
    toast(personelAd(sonuc.personel) + ' işe atandı.');
    isDetay(id);
  }

  async function isMalzemeTahsis(id) {
    const is = S.bul('isler', id);
    const stoklar = S.get('stok');
    if (!stoklar.length) { toast('Önce stok kartı tanımlayın.'); return; }
    const sonuc = await UI.form({
      baslik: 'Malzeme tahsis et · ' + is.ad,
      aciklama: 'Tahsis edilen miktar stokta rezerve olarak ayrılır.',
      kaydetEtiketi: 'Tahsis et',
      alanlar: [
        { ad: 'kod', etiket: 'Malzeme', tur: 'secim', genis: true,
          secenekler: stoklar.map((s) => ({ deger: s.kod,
            ad: `${s.ad} — kullanılabilir ${num2(kullanilabilir(s))} ${s.birim}` })) },
        { ad: 'miktar', etiket: 'Tahsis miktarı', tur: 'number', min: 0, adim: '0.01', zorunlu: true }
      ],
      dogrula: (c) => {
        const m = stoklar.find((s) => s.kod === c.kod);
        if (!m) return 'Malzeme bulunamadı.';
        if (!(c.miktar > 0)) return 'Miktar sıfırdan büyük olmalı.';
        if (c.miktar > kullanilabilir(m)) {
          return `Kullanılabilir miktar ${num2(kullanilabilir(m))} ${m.birim}; daha fazlası tahsis edilemez.`;
        }
        return null;
      }
    });
    if (!sonuc) return;

    const m = stoklar.find((s) => s.kod === sonuc.kod);
    const mevcutTahsis = (is.malzemeler || []).slice();
    const idx = mevcutTahsis.findIndex((k) => k.kod === sonuc.kod);
    if (idx > -1) mevcutTahsis[idx].miktar += Number(sonuc.miktar);
    else mevcutTahsis.push({ kod: sonuc.kod, miktar: Number(sonuc.miktar) });

    S.guncelle('isler', id, { malzemeler: mevcutTahsis });
    S.guncelle('stok', m._id, { rezerve: m.rezerve + Number(sonuc.miktar), sonHareket: bugun() });
    S.ekle('hareketler', { malzeme: m.kod, tur: 'Rezerve', miktar: Number(sonuc.miktar),
      tarih: bugun(), kaynak: 'İş', aciklama: is.id + ' · ' + is.ad });
    toast(`${num2(sonuc.miktar)} ${m.birim} ${m.ad} işe tahsis edildi (rezerve).`);
    isDetay(id);
  }

  async function isMetrajBagla(id) {
    const is = S.bul('isler', id);
    const aday = S.get('metraj').filter((m) => m.proje === is.proje && !(is.metrajIds || []).includes(m._id));
    if (!aday.length) { toast('Bu projede bağlanabilecek metraj kalemi yok.'); return; }
    const sonuc = await UI.form({
      baslik: 'Metraj kalemi bağla · ' + is.ad,
      kaydetEtiketi: 'Bağla',
      alanlar: [{ ad: 'metraj', etiket: 'Metraj kalemi', tur: 'secim', genis: true,
        secenekler: aday.map((m) => ({ deger: m._id,
          ad: `${m.poz} — ${m.tanim} (${num2(m.miktar)} ${m.birim})` })) }]
    });
    if (!sonuc) return;
    S.guncelle('isler', id, { metrajIds: (is.metrajIds || []).concat(sonuc.metraj) });
    toast('Metraj kalemi işe bağlandı.');
    isDetay(id);
  }

  function isCSV() {
    const basliklar = ['Kod', 'İş', 'Proje', 'Taşeron', 'Mahal', 'Başlangıç', 'Bitiş',
                       'Planlanan', 'İlerleme', 'Durum', 'Personel', 'Malzeme kalemi'];
    const satirlar = isListesi().map((i) => [i.id, i.ad, projeAd(i.proje), taseronAd(i.taseron),
      i.mahal, i.baslangic, i.bitis, i.planlanan, i.ilerleme, i.durum,
      (i.personelIds || []).length, (i.malzemeler || []).length]);
    indir('isler.csv', 'text/csv;charset=utf-8',
      '﻿' + [basliklar].concat(satirlar)
        .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'));
    toast('İş listesi indirildi.');
  }

  /* ----------------------------------------------------------- personel */
  const gunFarki = (t) => Math.round((new Date(t) - new Date(bugun())) / 864e5);

  /* Ozluk evraklarinin gecerlilik durumu */
  function personelUyarilari(k) {
    const u = [];
    if (k.sgkDurum !== 'Geçerli') u.push({ metin: 'SGK: ' + k.sgkDurum, kind: 'bad' });
    else if (k.sgkBitis && gunFarki(k.sgkBitis) < 30) u.push({ metin: `SGK ${gunFarki(k.sgkBitis)} gün sonra bitiyor`, kind: 'warn' });
    if (k.isgGecerlilik) {
      const g = gunFarki(k.isgGecerlilik);
      if (g < 0) u.push({ metin: 'İSG eğitimi süresi doldu', kind: 'bad' });
      else if (g < 60) u.push({ metin: `İSG eğitimi ${g} gün sonra bitiyor`, kind: 'warn' });
    }
    if (k.saglikRaporu && gunFarki(k.saglikRaporu) < -365) {
      u.push({ metin: 'Sağlık raporu 1 yılı aştı', kind: 'warn' });
    }
    return u;
  }

  const personelPuantaji = (pid) => S.get('puantaj').filter((p) => p.personel === pid);

  function puantajOzeti(kayitlar) {
    const o = { gun: 0, yevmiyeGunu: 0, devamsiz: 0, izinli: 0 };
    kayitlar.forEach((p) => {
      const d = DB.PUANTAJ_DURUM[p.durum] || { katsayi: 0 };
      o.gun++;
      o.yevmiyeGunu += d.katsayi;
      if (p.durum === 'Devamsız') o.devamsiz++;
      if (p.durum === 'İzinli' || p.durum === 'Raporlu') o.izinli++;
    });
    return o;
  }

  function personelListesi() {
    const hepsi = S.get('personel');
    if (state.personelFirma === 'hepsi') return hepsi;
    return hepsi.filter((p) => p.firma === state.personelFirma);
  }

  function viewPersonel() {
    const liste = personelListesi();
    const hepsi = S.get('personel');
    const firmalar = [...new Set(hepsi.map((p) => p.firma))];
    const bugunPuantaj = S.get('puantaj').filter((p) => p.tarih === state.puantajTarihi);

    const rows = liste.map((k) => {
      const uyari = personelUyarilari(k);
      const kayit = bugunPuantaj.find((p) => p.personel === k.id);
      const isSayisi = S.get('isler').filter((i) => (i.personelIds || []).includes(k.id)).length;
      return `<tr>
        <td><span class="strong">${k.ad}</span><div class="muted">${k.sicil} · ${k.gorev}</div></td>
        <td>${k.firma === 'Kendi bünyemiz' ? k.firma : taseronAd(k.firma)}</td>
        <td class="num">${money(k.yevmiye)}</td>
        <td class="num">${isSayisi}</td>
        <td>${uyari.length ? uyari.map((u) => badge(u.metin, u.kind)).join(' ') : badge('Evraklar tamam', 'ok')}</td>
        <td>${kayit ? badge(kayit.durum, (DB.PUANTAJ_DURUM[kayit.durum] || {}).kind)
                    : `<button class="btn ghost sm" data-puantaj-gir="${k._id}">Puantaj gir</button>`}</td>
        <td>${badge(k.durum, k.durum === 'Aktif' ? 'ok' : k.durum === 'İzinli' ? 'warn' : '')}</td>
        <td>
          <div class="satir-islem">
            <button class="ikon-btn" title="Personel kartı" data-personel-kart="${k._id}">${icon('goz')}</button>
            <button class="ikon-btn" title="Düzenle" data-personel-duzenle="${k._id}">${icon('kalem')}</button>
            <button class="ikon-btn tehlike" title="Sil" data-personel-sil="${k._id}">${icon('cop')}</button>
          </div>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="8"><div class="empty">Bu filtrede personel yok.</div></td></tr>';

    const gunlukMaliyet = bugunPuantaj.reduce((t, p) => {
      const k = hepsi.find((x) => x.id === p.personel);
      return t + (k ? k.yevmiye * ((DB.PUANTAJ_DURUM[p.durum] || {}).katsayi || 0) : 0);
    }, 0);
    const evrakUyari = hepsi.filter((k) => personelUyarilari(k).some((u) => u.kind === 'bad'));

    return `
    ${pageHead('PERSONEL', 'Saha personeli özlük kartları, evrak geçerlilikleri, iş görevlendirmeleri ve günlük puantaj.',
      `<div class="arac-cubugu">
         <select id="personelFirma" aria-label="Firma filtresi">
           <option value="hepsi">Tüm firmalar</option>
           ${firmalar.map((f) => `<option value="${f}" ${state.personelFirma === f ? 'selected' : ''}>${f === 'Kendi bünyemiz' ? f : taseronAd(f)}</option>`).join('')}
         </select>
         <button class="btn ghost sm" data-act="personel-csv">${icon('download')} CSV</button>
         <button class="btn accent sm" data-act="personel-ekle">${icon('plus')} Personel ekle</button>
       </div>`)}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(num(hepsi.filter((k) => k.durum === 'Aktif').length), 'Aktif personel', 'up', hepsi.length + ' kayıt')}
      ${kpi(num(bugunPuantaj.length), 'Puantaj girilen', bugunPuantaj.length >= liste.length ? 'up' : 'down', state.puantajTarihi)}
      ${kpi(moneyShort(gunlukMaliyet), 'Günlük işgücü maliyeti', 'up', 'puantaja göre')}
      ${kpi(num(evrakUyari.length), 'Evrak uyarısı', evrakUyari.length ? 'down' : 'up', 'SGK / İSG')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Personel listesi</h3><div class="spacer"></div>
          <div class="arac-cubugu">
            <input type="date" id="puantajTarihi" value="${state.puantajTarihi}" aria-label="Puantaj tarihi">
            <button class="btn ghost sm" data-act="puantaj-toplu">${icon('check')} Tümüne tam gün</button>
          </div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Personel</th><th>Firma</th><th class="num">Yevmiye</th><th class="num">İş</th>
            <th>Evrak durumu</th><th>Puantaj (${state.puantajTarihi})</th><th>Durum</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Görev dağılımı</h3></div>
          ${barChart(DB.PERSONEL_GOREV.map((g) => ({
            label: g.split(' ')[0], short: String(hepsi.filter((k) => k.gorev === g).length),
            value: hepsi.filter((k) => k.gorev === g).length
          })).filter((x) => x.value), { height: 130 })}
        </div>
        <div class="card">
          <div class="card-head"><h3>Evrak uyarıları</h3></div>
          ${hepsi.map((k) => {
            const u = personelUyarilari(k);
            return u.length ? `<div class="list-item">
              <div class="ico">${icon('alert')}</div>
              <div class="txt"><b>${k.ad}</b><span>${u.map((x) => x.metin).join(' · ')}</span></div>
              <div class="spacer"></div>
              <button class="btn ghost sm" data-personel-duzenle="${k._id}">Düzelt</button>
            </div>` : '';
          }).join('') || '<div class="empty">Tüm evraklar geçerli.</div>'}
        </div>
      </div>
    </div>`;
  }

  async function personelFormu(id) {
    const k = id ? S.bul('personel', id) : null;
    const firmalar = [{ deger: 'Kendi bünyemiz', ad: 'Kendi bünyemiz' }]
      .concat(S.get('taseronlar').map((t) => ({ deger: t.id, ad: t.ad })));
    const sonuc = await UI.form({
      baslik: k ? 'Personel kartını düzenle' : 'Yeni personel',
      kaydetEtiketi: k ? 'Güncelle' : 'Personeli ekle',
      alanlar: [
        { ad: 'ad', etiket: 'Ad soyad', zorunlu: true, genis: true, deger: k ? k.ad : '' },
        { ad: 'sicil', etiket: 'Sicil no', zorunlu: true,
          deger: k ? k.sicil : String(1100 + S.get('personel').length) },
        { ad: 'gorev', etiket: 'Görev', tur: 'secim', deger: k ? k.gorev : 'Usta',
          secenekler: DB.PERSONEL_GOREV },
        { ad: 'firma', etiket: 'Bağlı olduğu firma', tur: 'secim',
          deger: k ? k.firma : 'Kendi bünyemiz', secenekler: firmalar },
        { ad: 'telefon', etiket: 'Telefon', deger: k ? k.telefon : '' },
        { ad: 'girisTarihi', etiket: 'İşe giriş', tur: 'date', deger: k ? k.girisTarihi : bugun() },
        { ad: 'yevmiye', etiket: 'Günlük yevmiye (₺)', tur: 'number', min: 0, zorunlu: true,
          deger: k ? k.yevmiye : '' },
        { ad: 'sgkDurum', etiket: 'SGK durumu', tur: 'secim', deger: k ? k.sgkDurum : 'Geçerli',
          secenekler: ['Geçerli', 'Süresi Doldu', 'Eksik Evrak'] },
        { ad: 'sgkBitis', etiket: 'SGK bitiş', tur: 'date', deger: k ? k.sgkBitis : '' },
        { ad: 'isgTarih', etiket: 'İSG eğitim tarihi', tur: 'date', deger: k ? k.isgTarih : '' },
        { ad: 'isgGecerlilik', etiket: 'İSG geçerlilik', tur: 'date', deger: k ? k.isgGecerlilik : '' },
        { ad: 'saglikRaporu', etiket: 'Sağlık raporu', tur: 'date', deger: k ? k.saglikRaporu : '' },
        { ad: 'kanGrubu', etiket: 'Kan grubu', deger: k ? k.kanGrubu : '' },
        { ad: 'durum', etiket: 'Durum', tur: 'secim', deger: k ? k.durum : 'Aktif',
          secenekler: ['Aktif', 'İzinli', 'Ayrıldı'] },
        { ad: 'acilKisi', etiket: 'Acil durumda aranacak', deger: k ? k.acilKisi : '' },
        { ad: 'acilTelefon', etiket: 'Acil telefon', deger: k ? k.acilTelefon : '' },
        { ad: 'notlar', etiket: 'Notlar / sertifikalar', tur: 'metin-uzun', genis: true, deger: k ? k.notlar : '' }
      ]
    });
    if (!sonuc) return;
    if (k) { S.guncelle('personel', id, sonuc); toast(sonuc.ad + ' güncellendi.'); }
    else {
      S.ekle('personel', { ...sonuc, id: 'PRS-' + String(S.get('personel').length + 1).padStart(3, '0') });
      toast(sonuc.ad + ' personel kartı oluşturuldu.');
    }
  }

  /* --------------------------------------------------- personel kartı */
  async function personelKarti(id) {
    const k = S.bul('personel', id);
    if (!k) return;
    const uyari = personelUyarilari(k);
    const kayitlar = personelPuantaji(k.id).sort((a, b) => b.tarih.localeCompare(a.tarih));
    const ozet = puantajOzeti(kayitlar);
    const isleri = S.get('isler').filter((i) => (i.personelIds || []).includes(k.id));

    const secim = await UI.modal({
      baslik: k.ad,
      aciklama: `${k.sicil} · ${k.gorev} · ${k.firma === 'Kendi bünyemiz' ? k.firma : taseronAd(k.firma)}`,
      icerik: `
        ${uyari.length ? `<div class="uyari-kutu">${icon('alert')}
          <div><b>Evrak uyarısı</b><span>${uyari.map((u) => u.metin).join(' · ')}</span></div></div>` : ''}
        <div class="ozluk-izgara">
          <div><span>Telefon</span><b>${k.telefon || '—'}</b></div>
          <div><span>İşe giriş</span><b>${k.girisTarihi || '—'}</b></div>
          <div><span>Günlük yevmiye</span><b>${money(k.yevmiye)}</b></div>
          <div><span>Kan grubu</span><b>${k.kanGrubu || '—'}</b></div>
          <div><span>SGK</span><b>${k.sgkDurum} · ${k.sgkBitis || '—'}</b></div>
          <div><span>İSG eğitimi</span><b>${k.isgTarih || '—'} → ${k.isgGecerlilik || '—'}</b></div>
          <div><span>Sağlık raporu</span><b>${k.saglikRaporu || '—'}</b></div>
          <div><span>Acil durum</span><b>${k.acilKisi || '—'} ${k.acilTelefon || ''}</b></div>
        </div>
        ${k.notlar ? `<p class="modal-metin" style="margin-top:10px"><b>Not:</b> ${k.notlar}</p>` : ''}

        <div class="kalem-tablo">
          <h4>Görevli olduğu işler (${isleri.length})</h4>
          ${isleri.length ? isleri.map((i) => `<div class="list-item">
            <div class="ico">${icon('briefcase')}</div>
            <div class="txt"><b>${i.ad}</b><span>${projeAd(i.proje)} · ${i.mahal || '—'} · ${i.durum}</span></div>
            <div class="spacer"></div>${badge(pct(i.ilerleme), '')}
          </div>`).join('') : '<div class="empty">Herhangi bir işe atanmamış.</div>'}
        </div>

        <div class="kalem-tablo">
          <h4>Puantaj özeti</h4>
          <div class="ozluk-izgara">
            <div><span>Kayıtlı gün</span><b>${ozet.gun}</b></div>
            <div><span>Hak edilen yevmiye günü</span><b>${num2(ozet.yevmiyeGunu)}</b></div>
            <div><span>Devamsız</span><b>${ozet.devamsiz}</b></div>
            <div><span>İzin / rapor</span><b>${ozet.izinli}</b></div>
            <div><span>Toplam hak ediş</span><b>${money(ozet.yevmiyeGunu * k.yevmiye)}</b></div>
          </div>
          ${kayitlar.length ? `<div class="table-wrap" style="margin-top:10px"><table>
            <thead><tr><th>Tarih</th><th>Durum</th><th>İş</th><th>Açıklama</th><th class="num">Tutar</th></tr></thead>
            <tbody>${kayitlar.slice(0, 12).map((p) => {
              const d = DB.PUANTAJ_DURUM[p.durum] || { katsayi: 0 };
              return `<tr><td class="nowrap">${p.tarih}</td>
                <td>${badge(p.durum, d.kind)}</td>
                <td>${p.is ? isAd(p.is) : '—'}</td>
                <td class="muted">${p.aciklama || '—'}</td>
                <td class="num">${money(d.katsayi * k.yevmiye)}</td></tr>`;
            }).join('')}</tbody></table></div>` : '<div class="empty">Puantaj kaydı yok.</div>'}
        </div>`,
      hazir: (kutu) => kutu.querySelector('.modal').classList.add('genis'),
      dugmeler: [
        { ad: 'Puantaj gir', deger: 'puantaj' },
        { ad: 'Kartı düzenle', deger: 'duzenle' },
        { ad: 'Kapat', tur: 'accent', deger: null }
      ]
    });
    if (secim === 'duzenle') personelFormu(id);
    else if (secim === 'puantaj') puantajFormu(id);
  }

  async function puantajFormu(id) {
    const k = S.bul('personel', id);
    if (!k) return;
    const isleri = S.get('isler').filter((i) => (i.personelIds || []).includes(k.id));
    const sonuc = await UI.form({
      baslik: 'Puantaj · ' + k.ad,
      aciklama: `Günlük yevmiye ${money(k.yevmiye)}. Tutar, duruma göre katsayıyla hesaplanır.`,
      kaydetEtiketi: 'Puantajı kaydet',
      alanlar: [
        { ad: 'tarih', etiket: 'Tarih', tur: 'date', deger: state.puantajTarihi },
        { ad: 'durum', etiket: 'Devam durumu', tur: 'secim', deger: 'Tam gün',
          secenekler: Object.keys(DB.PUANTAJ_DURUM) },
        { ad: 'is', etiket: 'Çalıştığı iş', tur: 'secim',
          secenekler: [{ deger: '', ad: 'Belirtilmedi' }]
            .concat(isleri.map((i) => ({ deger: i.id, ad: i.ad }))) },
        { ad: 'aciklama', etiket: 'Açıklama', genis: true }
      ]
    });
    if (!sonuc) return;
    const eski = S.get('puantaj').find((p) => p.personel === k.id && p.tarih === sonuc.tarih);
    if (eski) S.guncelle('puantaj', eski._id, { ...sonuc, personel: k.id });
    else S.ekle('puantaj', { ...sonuc, personel: k.id });
    const kat = (DB.PUANTAJ_DURUM[sonuc.durum] || {}).katsayi || 0;
    toast(`${k.ad} · ${sonuc.durum} (${money(kat * k.yevmiye)}) kaydedildi.`);
  }

  /* Listedeki herkese secili tarih icin tam gun puantaj yazar */
  function puantajToplu() {
    const tarih = state.puantajTarihi;
    let yeni = 0;
    personelListesi().filter((k) => k.durum === 'Aktif').forEach((k) => {
      if (S.get('puantaj').some((p) => p.personel === k.id && p.tarih === tarih)) return;
      S.ekle('puantaj', { personel: k.id, tarih, durum: 'Tam gün', is: '', aciklama: 'Toplu giriş' });
      yeni++;
    });
    toast(yeni ? `${yeni} personel için tam gün puantajı girildi.` : 'Bu tarihte eksik puantaj yok.');
  }

  function personelCSV() {
    const basliklar = ['Sicil', 'Ad', 'Görev', 'Firma', 'Telefon', 'İşe giriş', 'Yevmiye',
                       'SGK', 'SGK bitiş', 'İSG geçerlilik', 'Sağlık raporu', 'Durum',
                       'Yevmiye günü', 'Hak ediş'];
    const satirlar = personelListesi().map((k) => {
      const o = puantajOzeti(personelPuantaji(k.id));
      return [k.sicil, k.ad, k.gorev, k.firma === 'Kendi bünyemiz' ? k.firma : taseronAd(k.firma),
        k.telefon, k.girisTarihi, k.yevmiye, k.sgkDurum, k.sgkBitis, k.isgGecerlilik,
        k.saglikRaporu, k.durum, o.yevmiyeGunu, o.yevmiyeGunu * k.yevmiye];
    });
    indir('personel-listesi.csv', 'text/csv;charset=utf-8',
      '﻿' + [basliklar].concat(satirlar)
        .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'));
    toast('Personel listesi indirildi.');
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
    if (adim.rol === 'onay' && !yetkiVar('hakedis', 'onayla')) return '';
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
      dogrula: (c) => c.kalemler.length ? null
        : 'En az bir kalem seçip bu dönem miktarını girmelisiniz.',
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
  const HAREKET_TURU = ['Giriş', 'Çıkış', 'Rezerve', 'Rezerve İptal', 'Sayım Düzeltme'];

  const kullanilabilir = (s) => s.mevcut - s.rezerve;
  const stokKritikMi = (s) => kullanilabilir(s) < s.kritik;

  function stokListesi() {
    const hepsi = S.get('stok');
    return state.stokDepo === 'hepsi' ? hepsi : hepsi.filter((s) => s.depo === state.stokDepo);
  }

  function viewStok() {
    const liste = stokListesi();
    const hepsi = S.get('stok');
    const depolar = [...new Set(hepsi.map((s) => s.depo))];

    const rows = liste.map((s) => {
      const kalan = kullanilabilir(s);
      const oran = (kalan / (s.kritik || 1)) * 100;          // kritik seviyeye gore doluluk
      const kind = stokKritikMi(s) ? 'bad' : oran > 150 ? 'ok' : 'warn';
      return `<tr>
        <td style="min-width:180px"><span class="strong">${s.ad}</span>
            <div class="muted">${s.kod} · ${s.depo}</div></td>
        <td class="num">${num2(s.mevcut)} ${s.birim}</td>
        <td class="num">${num2(s.rezerve)}</td>
        <td class="num strong">${num2(kalan)}</td>
        <td class="num">${num2(s.kritik)}</td>
        <td style="min-width:120px">${bar(Math.min(100, oran), kind)}</td>
        <td class="num">${money(s.mevcut * s.birimFiyat)}</td>
        <td>${stokKritikMi(s) ? badge('Kritik', 'bad') : badge('Yeterli', 'ok')}</td>
        <td>
          <div class="satir-islem">
            <button class="ikon-btn" title="Stok hareketi" data-stok-hareket="${s._id}">${icon('trend')}</button>
            <button class="ikon-btn" title="Düzenle" data-stok-duzenle="${s._id}">${icon('kalem')}</button>
            <button class="ikon-btn tehlike" title="Sil" data-stok-sil="${s._id}">${icon('cop')}</button>
          </div>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="9"><div class="empty">Bu depoda malzeme kaydı yok.</div></td></tr>';

    const stokDeger = hepsi.reduce((t, x) => t + x.mevcut * x.birimFiyat, 0);
    const kritikler = hepsi.filter(stokKritikMi);
    const sonHareketler = S.get('hareketler').slice(0, 6);

    return `
    ${pageHead('MALZEME STOK', 'Depo bazlı mevcut, rezerve ve kullanılabilir miktarlar; giriş/çıkış hareketleri ve kritik seviye uyarıları.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(stokDeger), 'Toplam stok değeri', 'up', hepsi.length + ' kalem')}
      ${kpi(num(kritikler.length), 'Kritik seviye', kritikler.length ? 'down' : 'up', 'sipariş önerilir')}
      ${kpi(num(depolar.length), 'Aktif depo', 'up', depolar.join(' · ') || '—')}
      ${kpi(moneyShort(hepsi.reduce((t, x) => t + x.rezerve * x.birimFiyat, 0)), 'Rezerve tutar', 'up', 'imalata ayrılan')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Stok durumu</h3><div class="spacer"></div>
          <div class="arac-cubugu">
            <select id="stokDepo" aria-label="Depo filtresi">
              <option value="hepsi">Tüm depolar</option>
              ${depolar.map((d) => `<option value="${d}" ${state.stokDepo === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
            <button class="btn ghost sm" data-act="stok-csv">${icon('download')} CSV</button>
            <button class="btn accent sm" data-act="stok-ekle">${icon('plus')} Malzeme ekle</button>
          </div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Malzeme</th><th class="num">Mevcut</th><th class="num">Rezerve</th>
            <th class="num">Kullanılabilir</th><th class="num">Kritik</th><th>Seviye</th>
            <th class="num">Değer</th><th>Durum</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Sipariş önerileri</h3></div>
          ${kritikler.map((s) => `
            <div class="list-item">
              <div class="ico">${icon('box')}</div>
              <div class="txt"><b>${s.ad}</b>
                <span>Eksik ${num2(s.kritik - kullanilabilir(s))} ${s.birim}</span></div>
              <div class="spacer"></div>
              <button class="btn sm" data-stok-talep="${s._id}">Talep</button>
            </div>`).join('') || '<div class="empty">Kritik seviyede malzeme yok.</div>'}
        </div>
        <div class="card">
          <div class="card-head"><h3>Son hareketler</h3><div class="spacer"></div>
            <span class="hint">${S.get('hareketler').length} kayıt</span></div>
          ${sonHareketler.map((h) => {
            const m = S.get('stok').find((s) => s.kod === h.malzeme);
            const artan = h.tur === 'Giriş' || h.tur === 'Rezerve İptal';
            return `<div class="list-item">
              <div class="ico">${icon(artan ? 'trend' : 'trendDown')}</div>
              <div class="txt"><b>${m ? m.ad : h.malzeme}</b>
                <span>${h.tur} · ${num2(h.miktar)} · ${h.tarih}${h.aciklama ? ' · ' + h.aciklama : ''}</span></div>
            </div>`;
          }).join('') || '<div class="empty">Hareket kaydı yok.</div>'}
        </div>
      </div>
    </div>`;
  }

  async function stokFormu(id) {
    const s = id ? S.bul('stok', id) : null;
    const depolar = [...new Set(S.get('stok').map((x) => x.depo))];
    const sonuc = await UI.form({
      baslik: s ? 'Malzemeyi düzenle' : 'Yeni malzeme',
      kaydetEtiketi: s ? 'Güncelle' : 'Ekle',
      alanlar: [
        { ad: 'ad', etiket: 'Malzeme adı', zorunlu: true, genis: true, deger: s ? s.ad : '' },
        { ad: 'kod', etiket: 'Stok kodu', zorunlu: true,
          deger: s ? s.kod : 'MLZ-' + String(S.get('stok').length + 1).padStart(3, '0') },
        { ad: 'birim', etiket: 'Birim', tur: 'secim', deger: s ? s.birim : 'adet', secenekler: BIRIMLER },
        { ad: 'mevcut', etiket: 'Mevcut miktar', tur: 'number', min: 0, adim: '0.01', deger: s ? s.mevcut : 0 },
        { ad: 'rezerve', etiket: 'Rezerve miktar', tur: 'number', min: 0, adim: '0.01', deger: s ? s.rezerve : 0 },
        { ad: 'kritik', etiket: 'Kritik seviye', tur: 'number', min: 0, adim: '0.01', deger: s ? s.kritik : 0,
          not: 'Kullanılabilir miktar bu değerin altına düşünce uyarı verilir.' },
        { ad: 'birimFiyat', etiket: 'Birim fiyat (₺)', tur: 'number', min: 0, adim: '0.01', deger: s ? s.birimFiyat : 0 },
        { ad: 'depo', etiket: 'Depo', zorunlu: true, deger: s ? s.depo : (depolar[0] || 'Saha Depo A'),
          not: depolar.length ? 'Mevcut depolar: ' + depolar.join(', ') : '' }
      ]
    });
    if (!sonuc) return;
    const kayit = { ...sonuc, sonHareket: new Date().toISOString().slice(0, 10) };
    if (s) { S.guncelle('stok', id, kayit); toast(kayit.ad + ' güncellendi.'); }
    else { S.ekle('stok', kayit); toast(kayit.ad + ' stok kartı oluşturuldu.'); }
  }

  /* Giris/cikis/rezerve hareketi; miktarlar stok kartina islenir */
  async function stokHareketi(id, onTur, onMiktar, onAciklama) {
    const s = S.bul('stok', id);
    if (!s) return;
    const sonuc = await UI.form({
      baslik: 'Stok hareketi · ' + s.ad,
      aciklama: `Mevcut ${num2(s.mevcut)} ${s.birim} · rezerve ${num2(s.rezerve)} · kullanılabilir ${num2(kullanilabilir(s))}`,
      kaydetEtiketi: 'Hareketi işle',
      alanlar: [
        { ad: 'tur', etiket: 'Hareket türü', tur: 'secim', deger: onTur || 'Giriş', secenekler: HAREKET_TURU },
        { ad: 'miktar', etiket: 'Miktar (' + s.birim + ')', tur: 'number', min: 0, adim: '0.01',
          zorunlu: true, deger: onMiktar || '' },
        { ad: 'tarih', etiket: 'Tarih', tur: 'date', deger: new Date().toISOString().slice(0, 10) },
        { ad: 'aciklama', etiket: 'Açıklama', genis: true, deger: onAciklama || '',
          ipucu: 'örn. 3. kat duvar imalatı' }
      ],
      /* Sinir asimlarinda pencere kapanmaz, girilenler korunur */
      dogrula: (c) => {
        const m = Number(c.miktar);
        if (!(m > 0)) return 'Miktar sıfırdan büyük olmalı.';
        if (c.tur === 'Çıkış' && m > kullanilabilir(s)) {
          return `Kullanılabilir miktar ${num2(kullanilabilir(s))} ${s.birim}; daha fazlası çıkılamaz.`;
        }
        if (c.tur === 'Rezerve' && m > kullanilabilir(s)) {
          return 'Rezerve, kullanılabilir miktarı aşamaz.';
        }
        return null;
      }
    });
    if (!sonuc) return;

    const m = Number(sonuc.miktar);
    let mevcut = s.mevcut, rezerve = s.rezerve;
    if (sonuc.tur === 'Giriş') mevcut += m;
    else if (sonuc.tur === 'Çıkış') mevcut -= m;
    else if (sonuc.tur === 'Rezerve') rezerve += m;
    else if (sonuc.tur === 'Rezerve İptal') rezerve = Math.max(0, rezerve - m);
    else if (sonuc.tur === 'Sayım Düzeltme') mevcut = m;

    S.guncelle('stok', id, { mevcut, rezerve, sonHareket: sonuc.tarih });
    S.ekle('hareketler', { malzeme: s.kod, tur: sonuc.tur, miktar: m,
                           tarih: sonuc.tarih, aciklama: sonuc.aciklama, kaynak: 'Manuel' });
    toast(`${s.ad} · ${sonuc.tur} ${num2(m)} ${s.birim} işlendi.`);
  }

  function stokCSV() {
    const basliklar = ['Kod', 'Malzeme', 'Depo', 'Mevcut', 'Rezerve', 'Kullanılabilir',
                       'Kritik', 'Birim', 'Birim Fiyat', 'Değer'];
    const satirlar = stokListesi().map((s) => [s.kod, s.ad, s.depo, s.mevcut, s.rezerve,
      kullanilabilir(s), s.kritik, s.birim, s.birimFiyat, s.mevcut * s.birimFiyat]);
    indir('stok-durumu.csv', 'text/csv;charset=utf-8',
      '﻿' + [basliklar].concat(satirlar)
        .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'));
    toast('Stok durumu indirildi.');
  }


  /* ---------------------------------------------------------- tedarik */
  const SIPARIS_AKIS = {
    'Onay Bekliyor': { sonraki: 'Onaylandı',     eylem: 'Onayla',      ilerleme: 30, rol: 'onay' },
    'Onaylandı':     { sonraki: 'Yolda',         eylem: 'Sevk edildi', ilerleme: 65, rol: 'her' },
    'Yolda':         { sonraki: 'Teslim Edildi', eylem: 'Teslim al',   ilerleme: 100, rol: 'her' }
  };

  const bugun = () => new Date().toISOString().slice(0, 10);

  /* Teslim tarihi gecmis ve tamamlanmamis siparis gecikmeli sayilir */
  function etkinDurum(o) {
    if (o.durum === 'Teslim Edildi' || o.durum === 'İptal') return o.durum;
    return o.teslim < bugun() ? 'Gecikmeli' : o.durum;
  }

  function siparisListesi() {
    const hepsi = S.get('siparisler');
    return state.siparisDurum === 'hepsi'
      ? hepsi : hepsi.filter((o) => etkinDurum(o) === state.siparisDurum);
  }

  function viewTedarik() {
    const liste = siparisListesi();
    const hepsi = S.get('siparisler');

    const rows = liste.map((o) => {
      const durum = etkinDurum(o);
      const adim = SIPARIS_AKIS[o.durum];
      const ilerletilebilir = adim && (adim.rol !== 'onay' || yetkiVar('tedarik', 'onayla'));
      return `<tr>
        <td><span class="strong nowrap">${o.no}</span><div class="muted nowrap">${o.siparis}</div></td>
        <td>${o.tedarikci}</td>
        <td>${o.malzeme}<div class="muted">${o.miktar}</div></td>
        <td class="num">${money(o.tutar)}</td>
        <td class="num nowrap">${o.teslim}</td>
        <td style="min-width:120px">${bar(o.ilerleme, durum === 'Gecikmeli' ? 'bad' : o.ilerleme === 100 ? 'ok' : '')}</td>
        <td>${badge(durum, durumKind(durum))}</td>
        <td>
          <div class="satir-islem">
            ${ilerletilebilir ? `<button class="btn sm" data-siparis-ilerlet="${o._id}">${adim.eylem}</button>` : ''}
            <button class="ikon-btn" title="Düzenle" data-siparis-duzenle="${o._id}">${icon('kalem')}</button>
            <button class="ikon-btn tehlike" title="Sil" data-siparis-sil="${o._id}">${icon('cop')}</button>
          </div>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="8"><div class="empty">Bu filtrede sipariş yok.</div></td></tr>';

    const acik = hepsi.filter((o) => etkinDurum(o) !== 'Teslim Edildi');
    const geciken = hepsi.filter((o) => etkinDurum(o) === 'Gecikmeli');

    return `
    ${pageHead('TEDARİK & SİPARİŞ', 'Satın alma siparişlerinin onay, sevkiyat ve teslim takibi. Teslim alınan sipariş stok girişine dönüşür.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(acik.reduce((t, o) => t + o.tutar, 0)), 'Açık sipariş tutarı', 'up', acik.length + ' sipariş')}
      ${kpi(num(hepsi.filter((o) => etkinDurum(o) === 'Yolda').length), 'Sevkiyatta', 'up', 'yolda')}
      ${kpi(num(geciken.length), 'Geciken teslim', geciken.length ? 'down' : 'up', 'takip gerekli')}
      ${kpi(num(hepsi.filter((o) => o.durum === 'Onay Bekliyor').length), 'Onay bekleyen', 'down', 'satın alma')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Sipariş listesi</h3><div class="spacer"></div>
          <div class="arac-cubugu">
            <select id="siparisDurum" aria-label="Durum filtresi">
              <option value="hepsi">Tüm durumlar</option>
              ${['Onay Bekliyor', 'Onaylandı', 'Yolda', 'Gecikmeli', 'Teslim Edildi'].map((d) =>
                `<option value="${d}" ${state.siparisDurum === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
            <button class="btn ghost sm" data-act="siparis-csv">${icon('download')} CSV</button>
            <button class="btn accent sm" data-act="siparis-ekle">${icon('plus')} Sipariş oluştur</button>
          </div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>No</th><th>Tedarikçi</th><th>Malzeme</th><th class="num">Tutar</th>
            <th class="num">Teslim</th><th>İlerleme</th><th>Durum</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="3">Listelenen toplam</td>
            <td class="num">${money(liste.reduce((t, o) => t + o.tutar, 0))}</td>
            <td colspan="4"></td></tr></tfoot>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Teslim takvimi</h3></div>
          <div class="timeline">
            ${hepsi.filter((o) => o.durum !== 'Teslim Edildi')
                   .sort((a, b) => a.teslim.localeCompare(b.teslim)).slice(0, 6).map((o) => `
              <div class="tl"><b>${o.teslim} · ${o.malzeme}</b>
                <span>${o.tedarikci} · ${o.miktar} · ${etkinDurum(o)}</span></div>`).join('') ||
              '<div class="empty">Bekleyen teslimat yok.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Sipariş akışı</h3></div>
          <div class="timeline">
            <div class="tl"><b>Onay Bekliyor</b><span>Saha talebi satın almaya iletildi</span></div>
            <div class="tl"><b>Onaylandı</b><span>Tedarikçiye sipariş geçildi</span></div>
            <div class="tl"><b>Yolda</b><span>Sevkiyat başladı</span></div>
            <div class="tl"><b>Teslim Edildi</b><span>İrsaliye girildi, stok girişi yapıldı</span></div>
          </div>
          <p class="modal-metin" style="margin-top:10px">
            Teslim tarihi geçen ve tamamlanmamış siparişler otomatik <b>Gecikmeli</b> gösterilir.</p>
        </div>
      </div>
    </div>`;
  }

  async function siparisFormu(id, onDeger) {
    const o = id ? S.bul('siparisler', id) : null;
    const stoklar = S.get('stok');
    const varsayilanTeslim = new Date(Date.now() + 12096e5).toISOString().slice(0, 10);  // +14 gün

    const sonuc = await UI.form({
      baslik: o ? 'Siparişi düzenle' : 'Yeni satın alma siparişi',
      aciklama: 'Malzemeyi stok kartından seçerseniz teslim alındığında stok girişi otomatik yapılır.',
      kaydetEtiketi: o ? 'Güncelle' : 'Siparişi oluştur',
      alanlar: [
        { ad: 'tedarikci', etiket: 'Tedarikçi', zorunlu: true, deger: o ? o.tedarikci : '' },
        { ad: 'malzemeKod', etiket: 'Stok kartı', tur: 'secim',
          deger: o ? (o.malzemeKod || '') : ((onDeger && onDeger.malzemeKod) || ''),
          secenekler: [{ deger: '', ad: 'Stok kartı dışı (serbest)' }]
            .concat(stoklar.map((s) => ({ deger: s.kod, ad: `${s.ad} (${s.kod})` }))) },
        { ad: 'malzeme', etiket: 'Malzeme açıklaması', zorunlu: true, genis: true,
          deger: o ? o.malzeme : ((onDeger && onDeger.malzeme) || '') },
        { ad: 'siparisMiktar', etiket: 'Miktar', tur: 'number', min: 0, adim: '0.01', zorunlu: true,
          deger: o ? (o.siparisMiktar || '') : ((onDeger && onDeger.siparisMiktar) || '') },
        { ad: 'birim', etiket: 'Birim', tur: 'secim', deger: o ? (o.birim || 'adet')
            : ((onDeger && onDeger.birim) || 'adet'), secenekler: BIRIMLER },
        { ad: 'tutar', etiket: 'Sipariş tutarı (₺)', tur: 'number', min: 0, adim: '0.01', zorunlu: true,
          deger: o ? o.tutar : ((onDeger && onDeger.tutar) || '') },
        { ad: 'siparis', etiket: 'Sipariş tarihi', tur: 'date', deger: o ? o.siparis : bugun() },
        { ad: 'teslim', etiket: 'Planlanan teslim', tur: 'date', deger: o ? o.teslim : varsayilanTeslim }
      ]
    });
    if (!sonuc) return;

    const kayit = {
      ...sonuc,
      miktar: num2(sonuc.siparisMiktar) + ' ' + sonuc.birim
    };
    if (o) { S.guncelle('siparisler', id, kayit); toast(o.no + ' güncellendi.'); }
    else {
      const yeni = S.ekle('siparisler', {
        ...kayit,
        no: 'SIP-' + (3301 + S.get('siparisler').length),
        durum: 'Onay Bekliyor', ilerleme: 10
      });
      toast(yeni.no + ' oluşturuldu, onay bekliyor.');
    }
  }

  /* Kritik stoktan dogrudan siparis talebi */
  function stokTalebi(stokId) {
    const s = S.bul('stok', stokId);
    if (!s) return;
    const eksik = Math.max(0, s.kritik - kullanilabilir(s));
    const oneri = Math.ceil(eksik * 1.2);        // %20 emniyet payı
    siparisFormu(null, {
      malzemeKod: s.kod, malzeme: s.ad, siparisMiktar: oneri,
      birim: s.birim, tutar: Math.round(oneri * s.birimFiyat)
    });
  }

  async function siparisIlerlet(id) {
    const o = S.bul('siparisler', id);
    if (!o) return;
    const adim = SIPARIS_AKIS[o.durum];
    if (!adim) return;

    /* Teslim alma: irsaliye miktari girilir ve stok girisine donusur */
    if (adim.sonraki === 'Teslim Edildi') {
      const stokKarti = o.malzemeKod ? S.get('stok').find((s) => s.kod === o.malzemeKod) : null;
      const sonuc = await UI.form({
        baslik: 'Teslim alma · ' + o.no,
        aciklama: stokKarti
          ? `${stokKarti.ad} stok kartına giriş yapılacak (mevcut ${num2(stokKarti.mevcut)} ${stokKarti.birim}).`
          : 'Bu sipariş bir stok kartına bağlı değil; yalnızca sipariş durumu güncellenir.',
        kaydetEtiketi: 'Teslim al',
        alanlar: [
          { ad: 'gelenMiktar', etiket: 'İrsaliye miktarı' + (stokKarti ? ' (' + stokKarti.birim + ')' : ''),
            tur: 'number', min: 0, adim: '0.01', deger: o.siparisMiktar || 0,
            not: stokKarti ? 'Bu miktar stok girişi olarak işlenir.' : 'Stok kartı yok, giriş yapılmaz.' },
          { ad: 'teslimTarihi', etiket: 'Teslim tarihi', tur: 'date', deger: bugun() },
          { ad: 'irsaliye', etiket: 'İrsaliye no', deger: '', genis: true }
        ]
      });
      if (!sonuc) return;

      if (stokKarti && Number(sonuc.gelenMiktar) > 0) {
        S.guncelle('stok', stokKarti._id, {
          mevcut: stokKarti.mevcut + Number(sonuc.gelenMiktar),
          sonHareket: sonuc.teslimTarihi
        });
        S.ekle('hareketler', {
          malzeme: stokKarti.kod, tur: 'Giriş', miktar: Number(sonuc.gelenMiktar),
          tarih: sonuc.teslimTarihi, kaynak: 'Tedarik',
          aciklama: o.no + ' teslimatı' + (sonuc.irsaliye ? ' · irsaliye ' + sonuc.irsaliye : '')
        });
      }
      S.guncelle('siparisler', id, { durum: 'Teslim Edildi', ilerleme: 100,
                                     teslim: sonuc.teslimTarihi, irsaliye: sonuc.irsaliye });
      toast(stokKarti && Number(sonuc.gelenMiktar) > 0
        ? `${o.no} teslim alındı · ${num2(sonuc.gelenMiktar)} ${stokKarti.birim} stoğa girdi.`
        : `${o.no} teslim alındı.`);
      return;
    }

    S.guncelle('siparisler', id, { durum: adim.sonraki, ilerleme: adim.ilerleme });
    toast(o.no + ' → ' + adim.sonraki);
  }

  function siparisCSV() {
    const basliklar = ['No', 'Tedarikçi', 'Malzeme', 'Miktar', 'Tutar', 'Sipariş', 'Teslim', 'Durum'];
    const satirlar = siparisListesi().map((o) => [o.no, o.tedarikci, o.malzeme, o.miktar,
      o.tutar, o.siparis, o.teslim, etkinDurum(o)]);
    indir('siparisler.csv', 'text/csv;charset=utf-8',
      '﻿' + [basliklar].concat(satirlar)
        .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'));
    toast('Sipariş listesi indirildi.');
  }


  /* ----------------------------------------------------------- rapor */

  /* Rapor govdesini gercek verilerden uretir: {baslik, altbaslik, bloklar:[{ad, satirlar|tablo}]} */
  function raporUret(tur, kapsam) {
    const t = new Date().toLocaleString('tr-TR');

    if (tur === 'yonetim') {
      const projeler = S.get('projeler');
      const hakedisler = S.get('hakedisler');
      const isler = S.get('isler');
      const onayli = hakedisler.filter((h) => h.durum === 'Onaylandı');
      const bekleyen = hakedisler.filter((h) => h.durum !== 'Onaylandı' && h.durum !== 'Reddedildi');
      const acikSapma = S.get('kaliteKontrol').filter((q) =>
        (q.sonuc === 'Red' || q.sonuc === 'Şartlı Onay') && !q.tekrarKayit);
      const geciken = S.get('siparisler').filter((o) => etkinDurum(o) === 'Gecikmeli');
      const kritik = S.get('stok').filter(stokKritikMi);

      return {
        baslik: 'Üst Yönetim Özeti', altbaslik: 'Tüm projeler · ' + t,
        ozet: [
          { ad: 'Sözleşme bedeli', deger: money(projeler.reduce((a, p) => a + p.sozlesme, 0)) },
          { ad: 'Gerçekleşen imalat', deger: money(projeler.reduce((a, p) => a + p.gerceklesen, 0)) },
          { ad: 'Onaylanan hakediş', deger: money(onayli.reduce((a, h) => a + hakedisBrut(h), 0)) },
          { ad: 'Süreçteki hakediş', deger: money(bekleyen.reduce((a, h) => a + hakedisBrut(h), 0)) },
          { ad: 'Açık kalite sapması', deger: acikSapma.length + ' kayıt' },
          { ad: 'Geciken tedarik', deger: geciken.length + ' sipariş' }
        ],
        bloklar: [
          { ad: 'Proje ilerlemesi',
            basliklar: ['Proje', 'İşveren', 'Sözleşme', 'Gerçekleşen', 'İlerleme', 'Durum'],
            satirlar: projeler.map((p) => [p.ad, p.isveren || '—', money(p.sozlesme),
              money(p.gerceklesen), pct(p.ilerleme), p.durum]) },
          { ad: 'İş paketleri',
            basliklar: ['İş', 'Proje', 'Taşeron', 'Planlanan', 'İlerleme', 'Durum'],
            satirlar: isler.map((i) => [i.ad, projeAd(i.proje), taseronAd(i.taseron),
              money(i.planlanan), pct(i.ilerleme), i.durum]) },
          { ad: 'Hakediş durumu',
            basliklar: ['No', 'Dönem', 'Proje', 'Taşeron', 'Ödenecek', 'Durum'],
            satirlar: hakedisler.map((h) => [h.no, h.donem, projeAd(h.proje),
              taseronAd(h.taseron), money(hakedisBrut(h)), h.durum]) },
          { ad: 'Risk gündemi',
            basliklar: ['Konu', 'Ayrıntı', 'Seviye'],
            satirlar: acikSapma.map((q) => [q.imalat, taseronAd(q.taseron) + ' · ' + q.sonuc,
                        q.sonuc === 'Red' ? 'Yüksek' : 'Orta'])
              .concat(geciken.map((o) => [o.malzeme, o.tedarikci + ' · teslim ' + o.teslim, 'Yüksek']))
              .concat(kritik.map((s) => [s.ad, 'Kullanılabilir ' + num2(kullanilabilir(s)) + ' ' + s.birim +
                        ' (kritik ' + num2(s.kritik) + ')', 'Orta'])) }
        ]
      };
    }

    if (tur === 'taseron') {
      const t2 = S.get('taseronlar').find((x) => x.id === kapsam) || S.get('taseronlar')[0];
      if (!t2) return null;
      const isleri = S.get('isler').filter((i) => i.taseron === t2.id);
      const hakedisleri = S.get('hakedisler').filter((h) => h.taseron === t2.id);
      const kalite = S.get('kaliteKontrol').filter((q) => q.taseron === t2.id);
      const kisiler = S.get('personel').filter((p) => p.firma === t2.id);
      const puanli = kalite.filter((q) => q.skor);

      return {
        baslik: 'Taşeron Bilgi Raporu', altbaslik: t2.ad + ' · ' + t,
        ozet: [
          { ad: 'Sözleşme bedeli', deger: money(t2.sozlesme) },
          { ad: 'Aktif iş paketi', deger: isleri.filter((i) => i.durum === 'Devam').length + ' / ' + isleri.length },
          { ad: 'Onaylanan hakediş', deger: money(hakedisleri.filter((h) => h.durum === 'Onaylandı')
              .reduce((a, h) => a + hakedisBrut(h), 0)) },
          { ad: 'Bekleyen hakediş', deger: money(hakedisleri.filter((h) => h.durum !== 'Onaylandı')
              .reduce((a, h) => a + hakedisBrut(h), 0)) },
          { ad: 'Ortalama kalite puanı', deger: puanli.length
              ? '%' + Math.round(puanli.reduce((a, q) => a + q.skor, 0) / puanli.length) : '—' },
          { ad: 'Sahadaki personel', deger: kisiler.length + ' kişi' }
        ],
        bloklar: [
          { ad: 'İş paketleri',
            basliklar: ['İş', 'Mahal', 'Başlangıç', 'Bitiş', 'İlerleme', 'Durum'],
            satirlar: isleri.map((i) => [i.ad, i.mahal || '—', i.baslangic, i.bitis || '—',
              pct(i.ilerleme), i.durum]) },
          { ad: 'Hakediş durumu',
            basliklar: ['No', 'Dönem', 'İmalat', 'Kesinti', 'Ödenecek', 'Durum'],
            satirlar: hakedisleri.map((h) => [h.no, h.donem, money(h.imalat),
              money(h.kesinti), money(hakedisBrut(h)), h.durum]) },
          { ad: 'Kalite kayıtları',
            basliklar: ['Kayıt', 'İmalat', 'Tarih', 'Puan', 'Sonuç'],
            satirlar: kalite.map((q) => [q.id, q.imalat, q.tarih, q.skor ? '%' + q.skor : '—', q.sonuc]) },
          { ad: 'Personel ve evrak durumu',
            basliklar: ['Ad', 'Görev', 'SGK', 'İSG geçerlilik', 'Durum'],
            satirlar: kisiler.map((p) => [p.ad, p.gorev, p.sgkDurum, p.isgGecerlilik || '—', p.durum]) }
        ]
      };
    }

    if (tur === 'personel') {
      const liste = S.get('personel');
      const toplamHak = liste.reduce((a, k) =>
        a + puantajOzeti(personelPuantaji(k.id)).yevmiyeGunu * k.yevmiye, 0);
      return {
        baslik: 'Personel ve Puantaj Raporu', altbaslik: 'Tüm firmalar · ' + t,
        ozet: [
          { ad: 'Toplam personel', deger: liste.length + ' kişi' },
          { ad: 'Aktif', deger: liste.filter((k) => k.durum === 'Aktif').length + ' kişi' },
          { ad: 'Puantaj kaydı', deger: S.get('puantaj').length + ' gün' },
          { ad: 'Toplam hak ediş', deger: money(toplamHak) },
          { ad: 'Evrak uyarısı', deger: liste.filter((k) => personelUyarilari(k).length).length + ' kişi' }
        ],
        bloklar: [
          { ad: 'Personel dökümü',
            basliklar: ['Sicil', 'Ad', 'Görev', 'Firma', 'Yevmiye', 'Yevmiye günü', 'Hak ediş', 'Durum'],
            satirlar: liste.map((k) => {
              const o = puantajOzeti(personelPuantaji(k.id));
              return [k.sicil, k.ad, k.gorev,
                k.firma === 'Kendi bünyemiz' ? k.firma : taseronAd(k.firma),
                money(k.yevmiye), num2(o.yevmiyeGunu), money(o.yevmiyeGunu * k.yevmiye), k.durum];
            }) },
          { ad: 'Evrak uyarıları',
            basliklar: ['Ad', 'Uyarı'],
            satirlar: liste.map((k) => {
              const u = personelUyarilari(k);
              return u.length ? [k.ad, u.map((x) => x.metin).join(' · ')] : null;
            }).filter(Boolean) }
        ]
      };
    }

    /* stok ve tedarik bulteni */
    const stoklar = S.get('stok');
    const siparisler = S.get('siparisler');
    return {
      baslik: 'Malzeme ve Tedarik Bülteni', altbaslik: 'Tüm depolar · ' + t,
      ozet: [
        { ad: 'Stok değeri', deger: money(stoklar.reduce((a, s) => a + s.mevcut * s.birimFiyat, 0)) },
        { ad: 'Kritik kalem', deger: stoklar.filter(stokKritikMi).length + ' malzeme' },
        { ad: 'Açık sipariş', deger: money(siparisler.filter((o) => etkinDurum(o) !== 'Teslim Edildi')
            .reduce((a, o) => a + o.tutar, 0)) },
        { ad: 'Geciken teslim', deger: siparisler.filter((o) => etkinDurum(o) === 'Gecikmeli').length + ' sipariş' }
      ],
      bloklar: [
        { ad: 'Stok durumu',
          basliklar: ['Kod', 'Malzeme', 'Depo', 'Mevcut', 'Rezerve', 'Kullanılabilir', 'Kritik', 'Durum'],
          satirlar: stoklar.map((s) => [s.kod, s.ad, s.depo, num2(s.mevcut), num2(s.rezerve),
            num2(kullanilabilir(s)), num2(s.kritik), stokKritikMi(s) ? 'Kritik' : 'Yeterli']) },
        { ad: 'Sipariş takibi',
          basliklar: ['No', 'Tedarikçi', 'Malzeme', 'Tutar', 'Teslim', 'Durum'],
          satirlar: siparisler.map((o) => [o.no, o.tedarikci, o.malzeme, money(o.tutar),
            o.teslim, etkinDurum(o)]) },
        { ad: 'Son stok hareketleri',
          basliklar: ['Malzeme', 'Hareket', 'Miktar', 'Tarih', 'Kaynak', 'Açıklama'],
          satirlar: S.get('hareketler').slice(0, 20).map((h) => {
            const m = stoklar.find((s) => s.kod === h.malzeme);
            return [m ? m.ad : h.malzeme, h.tur, num2(h.miktar), h.tarih, h.kaynak || '—', h.aciklama || '—'];
          }) }
      ]
    };
  }

  /* Raporu sayfa icinde, arka plani bulaniklastirilmis bir pencerede acar.
     Yazdirmada yalnizca rapor govdesi kagida gider (bkz. @media print). */
  function raporGoster(r) {
    const govde = `
      <div class="rapor">
        <div class="rapor-ozet">
          ${(r.ozet || []).map((o) => `<div><span>${o.ad}</span><b>${o.deger}</b></div>`).join('')}
        </div>
        ${r.bloklar.map((b) => `
          <section class="rapor-blok">
            <h4>${b.ad}</h4>
            ${b.satirlar.length ? `<div class="table-wrap"><table>
              <thead><tr>${b.basliklar.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${b.satirlar.map((sat) =>
                `<tr>${sat.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
            </table></div>` : '<div class="empty">Kayıt yok.</div>'}
          </section>`).join('')}
        <div class="rapor-imza">
          <div>Hazırlayan</div><div>Kontrol eden</div><div>Onaylayan</div>
        </div>
      </div>`;

    UI.modal({
      baslik: r.baslik,
      aciklama: r.altbaslik,
      icerik: govde,
      hazir: (kutu) => kutu.querySelector('.modal').classList.add('genis', 'rapor-pencere'),
      dugmeler: [
        { ad: 'CSV indir', deger: 'csv' },
        /* pencere acik kalir, yalnizca yazdirma iletisim kutusu acilir */
        { ad: 'Yazdır / PDF', tur: 'accent',
          oncePolitika: () => { window.print(); return false; } }
      ]
    }).then((secim) => { if (secim === 'csv') raporCSV(r); });
  }

  function raporCSV(r) {
    const satirlar = [[r.baslik], [r.altbaslik], []];
    (r.ozet || []).forEach((o) => satirlar.push([o.ad, o.deger]));
    r.bloklar.forEach((b) => {
      satirlar.push([], [b.ad], b.basliklar);
      b.satirlar.forEach((s) => satirlar.push(s));
    });
    indir(r.baslik.toLowerCase().replace(/\s+/g, '-') + '.csv', 'text/csv;charset=utf-8',
      '﻿' + satirlar.map((s) => s.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n'));
    toast(r.baslik + ' CSV olarak indirildi.');
  }

  const RAPOR_TURU = {
    yonetim:  { ad: 'Üst Yönetim Özeti', hedef: 'Üst Yetkili', periyot: 'Aylık',
                icerik: ['Portföy ilerlemesi', 'İş paketleri', 'Hakediş durumu', 'Risk gündemi'] },
    taseron:  { ad: 'Taşeron Bilgi Raporu', hedef: 'Alt Taşeron', periyot: 'Haftalık',
                icerik: ['İş paketleri', 'Hakediş durumu', 'Kalite kayıtları', 'Personel evrakları'] },
    personel: { ad: 'Personel ve Puantaj Raporu', hedef: 'Üst Yetkili', periyot: 'Haftalık',
                icerik: ['Personel dökümü', 'Puantaj hak edişi', 'Evrak uyarıları'] },
    tedarik:  { ad: 'Malzeme ve Tedarik Bülteni', hedef: 'Alt Taşeron', periyot: 'Haftalık',
                icerik: ['Stok durumu', 'Sipariş takibi', 'Stok hareketleri'] }
  };

  function viewRapor() {
    const kart = (anahtar) => {
      const r = RAPOR_TURU[anahtar];
      return `
      <div class="card">
        <div class="card-head">
          <div><h3>${r.ad}</h3>
            <div class="muted" style="font-size:11px;color:var(--ink-3)">${r.periyot} · canlı veriden üretilir</div></div>
          <div class="spacer"></div>
          ${badge(r.hedef, r.hedef === 'Üst Yetkili' ? 'accent' : 'info')}
        </div>
        ${anahtar === 'taseron' ? `
          <label class="alan" style="margin-bottom:12px">
            <span>Taşeron</span>
            <select id="raporTaseron">
              ${S.get('taseronlar').map((t) => `<option value="${t.id}" ${state.raporTaseron === t.id ? 'selected' : ''}>${t.ad}</option>`).join('')}
            </select></label>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
          ${r.icerik.map((i) => `<span class="badge">${i}</span>`).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn sm" data-rapor-ac="${anahtar}">${icon('report')} Raporu aç</button>
          <button class="btn ghost sm" data-rapor-csv="${anahtar}">${icon('download')} CSV</button>
        </div>
      </div>`;
    };

    const projeler = S.get('projeler');
    const hakedisler = S.get('hakedisler');
    const donemler = {};
    hakedisler.forEach((h) => { donemler[h.donem] = (donemler[h.donem] || 0) + hakedisBrut(h) / 1e6; });

    return `
    ${pageHead('RAPORLAMA', 'Üst yetkiliye yönetim özeti, alt taşerona bilgi raporu. Raporlar panel verisinden anlık üretilir; yazdırılabilir ya da CSV olarak indirilebilir.')}
    <div class="grid cols-2" style="padding:0 10px 14px">
      ${Object.keys(RAPOR_TURU).map(kart).join('')}
    </div>
    <div class="grid cols-3" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Portföy ilerlemesi</h3></div>
        ${projeler.map((p) => `
          <div style="padding:9px 0;border-top:1px solid var(--line-soft)">
            <div style="display:flex;font-size:12.5px;margin-bottom:6px">
              <span>${p.ad}</span>
              <span style="margin-left:auto;color:var(--ink-3)">${moneyShort(p.gerceklesen)}</span></div>
            ${bar(p.ilerleme, p.ilerleme >= 80 ? 'ok' : p.ilerleme >= 60 ? 'warn' : 'bad')}
          </div>`).join('') || '<div class="empty">Proje yok.</div>'}
      </div>
      <div class="card">
        <div class="card-head"><h3>Dönemsel hakediş</h3><div class="spacer"></div>
          <span class="hint">milyon ₺</span></div>
        ${Object.keys(donemler).length > 1 ? lineChart(Object.values(donemler))
          : '<div class="empty">Eğri için en az iki dönem gerekir.</div>'}
        <div class="legend" style="margin-top:10px">
          <span><i style="background:#f0421c"></i>Dönem başına ödenecek tutar</span>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Risk gündemi</h3></div>
        ${riskGundemi().map((r) => `<div class="list-item">
          <div class="ico">${icon('alert')}</div>
          <div class="txt"><b>${r.baslik}</b><span>${r.ayrinti}</span></div>
          <div class="spacer"></div>${badge(r.seviye, r.seviye === 'Yüksek' ? 'bad' : 'warn')}
        </div>`).join('') || '<div class="empty">Açık risk yok.</div>'}
      </div>
    </div>`;
  }

  /* Panel genelindeki riskleri tek listede toplar */
  function riskGundemi() {
    const liste = [];
    S.get('kaliteKontrol').filter((q) => (q.sonuc === 'Red' || q.sonuc === 'Şartlı Onay') && !q.tekrarKayit)
      .forEach((q) => liste.push({ baslik: q.imalat, ayrinti: taseronAd(q.taseron) + ' · kalite ' + q.sonuc,
                                   seviye: q.sonuc === 'Red' ? 'Yüksek' : 'Orta' }));
    S.get('siparisler').filter((o) => etkinDurum(o) === 'Gecikmeli')
      .forEach((o) => liste.push({ baslik: o.malzeme + ' teslimi gecikti',
                                   ayrinti: o.tedarikci + ' · planlanan ' + o.teslim, seviye: 'Yüksek' }));
    S.get('stok').filter(stokKritikMi)
      .forEach((s) => liste.push({ baslik: s.ad + ' kritik seviyede',
                                   ayrinti: 'Kullanılabilir ' + num2(kullanilabilir(s)) + ' ' + s.birim,
                                   seviye: 'Orta' }));
    S.get('personel').forEach((k) => personelUyarilari(k).filter((u) => u.kind === 'bad')
      .forEach((u) => liste.push({ baslik: k.ad, ayrinti: u.metin, seviye: 'Yüksek' })));
    S.get('isler').filter((i) => i.bitis && i.bitis < bugun() && i.durum !== 'Tamamlandı')
      .forEach((i) => liste.push({ baslik: i.ad + ' süresi aştı',
                                   ayrinti: projeAd(i.proje) + ' · termin ' + i.bitis, seviye: 'Orta' }));
    return liste;
  }


  function pageHead(baslik, aciklama, ek) {
    return `<div class="page-head">
      <div><h2>${baslik}</h2><p>${aciklama}</p></div>
      <div class="spacer"></div>
      ${ek || `<button class="chip">${icon('filter')} Filtre</button>
               <button class="chip">${icon('search')} Ara</button>`}
    </div>`;
  }

  const VIEWS = {
    ozet: viewOzet, paftalar: viewPaftalar, metraj: viewMetraj, isler: viewIsler,
    taseron: viewTaseron, personel: viewPersonel, kalite: viewKalite, hakedis: viewHakedis,
    stok: viewStok, tedarik: viewTedarik, rapor: viewRapor, kullanici: viewKullanici
  };

  /* ============================================ proje ve taşeron kayıtları */

  /* Bir kaydin baska modullerde kullanilip kullanilmadigini sayar */
  function bagliKayitlar(tur, id) {
    if (tur === 'proje') {
      return [
        { ad: 'metraj kalemi', n: S.get('metraj').filter((m) => m.proje === id).length },
        { ad: 'pafta', n: S.get('paftalar').filter((p) => p.proje === id).length },
        { ad: 'hakediş', n: S.get('hakedisler').filter((h) => h.proje === id).length }
      ].filter((x) => x.n);
    }
    return [
      { ad: 'hakediş', n: S.get('hakedisler').filter((h) => h.taseron === id).length },
      { ad: 'kalite kaydı', n: S.get('kaliteKontrol').filter((q) => q.taseron === id).length }
    ].filter((x) => x.n);
  }

  async function projeFormu(id) {
    const p = id ? S.bul('projeler', id) : null;
    const sonuc = await UI.form({
      baslik: p ? 'Projeyi düzenle' : 'Yeni proje',
      kaydetEtiketi: p ? 'Güncelle' : 'Projeyi ekle',
      alanlar: [
        { ad: 'ad', etiket: 'Proje adı', zorunlu: true, genis: true, deger: p ? p.ad : '' },
        { ad: 'id', etiket: 'Proje kodu', zorunlu: true,
          deger: p ? p.id : 'PRJ-' + String(S.get('projeler').length + 1).padStart(2, '0'),
          not: p ? 'Kodu değiştirmek bağlı kayıtları etkiler.' : '' },
        { ad: 'blok', etiket: 'Blok / kısım', deger: p ? p.blok : '' },
        { ad: 'isveren', etiket: 'İşveren', deger: p ? p.isveren : '' },
        { ad: 'sehir', etiket: 'Şehir', deger: p ? p.sehir : '' },
        { ad: 'sozlesme', etiket: 'Sözleşme bedeli (₺)', tur: 'number', min: 0, adim: '1000',
          zorunlu: true, deger: p ? p.sozlesme : '' },
        { ad: 'gerceklesen', etiket: 'Gerçekleşen imalat (₺)', tur: 'number', min: 0, adim: '1000',
          deger: p ? p.gerceklesen : 0 },
        { ad: 'ilerleme', etiket: 'İlerleme (%)', tur: 'number', min: 0, deger: p ? p.ilerleme : 0 },
        { ad: 'durum', etiket: 'Durum', tur: 'secim', deger: p ? p.durum : 'Devam',
          secenekler: ['Devam', 'Riskli', 'Beklemede', 'Tamamlandı'] },
        { ad: 'etiketlerMetin', etiket: 'Etiketler', genis: true,
          deger: p ? (p.etiketler || []).join(', ') : '', ipucu: 'Kaba Yapı, Mekanik, İnce İşler' }
      ]
    });
    if (!sonuc) return;
    const kayit = {
      ...sonuc,
      ilerleme: Math.max(0, Math.min(100, sonuc.ilerleme)),
      etiketler: sonuc.etiketlerMetin.split(',').map((x) => x.trim()).filter(Boolean),
      guncelleme: 'az önce'
    };
    delete kayit.etiketlerMetin;
    if (p) { S.guncelle('projeler', id, kayit); toast(kayit.ad + ' güncellendi.'); }
    else { S.ekle('projeler', kayit); toast(kayit.ad + ' projesi eklendi.'); }
  }

  async function projeSil(id) {
    const p = S.bul('projeler', id);
    if (!p) return;
    const bagli = bagliKayitlar('proje', p.id);
    const uyari = bagli.length
      ? `Bu projeye bağlı ${bagli.map((b) => b.n + ' ' + b.ad).join(', ')} var. ` +
        'Proje silinince bu kayıtlar projesiz kalır.'
      : 'Bu projeye bağlı başka kayıt yok.';
    if (!await UI.onay('Projeyi sil', `${p.ad} silinecek. ${uyari}`, 'Sil')) return;
    S.sil('projeler', id);
    toast(p.ad + ' silindi.');
  }

  async function taseronFormu(id) {
    const t = id ? S.bul('taseronlar', id) : null;
    const sonuc = await UI.form({
      baslik: t ? 'Taşeronu düzenle' : 'Yeni taşeron',
      kaydetEtiketi: t ? 'Güncelle' : 'Taşeronu ekle',
      alanlar: [
        { ad: 'ad', etiket: 'Firma adı', zorunlu: true, genis: true, deger: t ? t.ad : '' },
        { ad: 'id', etiket: 'Taşeron kodu', zorunlu: true,
          deger: t ? t.id : 'TSR-' + String(S.get('taseronlar').length + 1).padStart(2, '0') },
        { ad: 'brans', etiket: 'Branş', tur: 'secim', deger: t ? t.brans : 'Kaba Yapı',
          secenekler: ['Kaba Yapı', 'İnce İşler', 'Mekanik', 'Elektrik', 'Cephe', 'Altyapı', 'Tadilat'] },
        { ad: 'yetkili', etiket: 'Yetkili kişi', deger: t ? t.yetkili : '' },
        { ad: 'sozlesme', etiket: 'Sözleşme bedeli (₺)', tur: 'number', min: 0, adim: '1000',
          zorunlu: true, deger: t ? t.sozlesme : '' },
        { ad: 'aktifIs', etiket: 'Aktif iş sayısı', tur: 'number', min: 0, deger: t ? t.aktifIs : 0 },
        { ad: 'puan', etiket: 'Değerlendirme puanı (0-5)', tur: 'number', min: 0, adim: '0.1',
          deger: t ? t.puan : 4 },
        { ad: 'sgk', etiket: 'SGK durumu', tur: 'secim', deger: t ? t.sgk : 'Geçerli',
          secenekler: ['Geçerli', 'Süresi Doldu', 'Eksik Evrak'] },
        { ad: 'sozlesmeBitis', etiket: 'Sözleşme bitişi', tur: 'date', deger: t ? t.sozlesmeBitis : '' },
        { ad: 'durum', etiket: 'Durum', tur: 'secim', deger: t ? t.durum : 'Aktif',
          secenekler: ['Aktif', 'Uyarı', 'Askıda'] }
      ]
    });
    if (!sonuc) return;
    const kayit = { ...sonuc, puan: Math.max(0, Math.min(5, sonuc.puan)) };
    if (t) { S.guncelle('taseronlar', id, kayit); toast(kayit.ad + ' güncellendi.'); }
    else {
      S.ekle('taseronlar', { ...kayit, yetkiler: [] });
      toast(kayit.ad + ' eklendi. Yetkileri karttan tanımlayabilirsiniz.');
    }
  }

  async function taseronSil(id) {
    const t = S.bul('taseronlar', id);
    if (!t) return;
    const bagli = bagliKayitlar('taseron', t.id);
    const uyari = bagli.length
      ? `Bu taşerona bağlı ${bagli.map((b) => b.n + ' ' + b.ad).join(', ')} var; kayıtlar silinmez ama taşeron adı görünmez olur.`
      : 'Bu taşerona bağlı başka kayıt yok.';
    if (!await UI.onay('Taşeronu sil', `${t.ad} silinecek. ${uyari}`, 'Sil')) return;
    S.sil('taseronlar', id);
    toast(t.ad + ' silindi.');
  }

  /* ======================================================= kullanıcılar */
  const yetkiVar = (modul, gereken) => Yetki.var(modul, gereken);

  function kullaniciListesi() { return S.get('kullanicilar'); }

  function viewKullanici() {
    const liste = kullaniciListesi();
    const gunluk = S.get('gunluk').slice(0, 12);
    const ben = Yetki.kullanici();
    const duzenleyebilir = yetkiVar('kullanici', 'duzenle');

    const rows = liste.map((k) => {
      const izin = Yetki.izinler(k);
      const acikModul = Yetki.MODULLER.filter((m) => izin[m.id] !== 'yok').length;
      const ozel = k.izinler && Object.keys(k.izinler).length;
      return `<tr>
        <td><span class="strong">${k.ad}</span>
            <div class="muted">${k.kullaniciAdi}${k.eposta ? ' · ' + k.eposta : ''}</div></td>
        <td>${badge(k.rol, k.rol === 'Sistem Yöneticisi' ? 'accent' : 'info')}
            ${ozel ? badge('özel izin', 'warn') : ''}</td>
        <td class="num">${acikModul} / ${Yetki.MODULLER.length}</td>
        <td class="nowrap">${k.sonGiris ? k.sonGiris.slice(0, 16).replace('T', ' ') : '—'}</td>
        <td>${badge(k.durum, k.durum === 'Aktif' ? 'ok' : '')}
            ${ben && ben._id === k._id ? badge('siz', '') : ''}</td>
        <td>
          <div class="satir-islem">
            <button class="ikon-btn" title="İzinler" data-kullanici-izin="${k._id}">${icon('lock')}</button>
            ${duzenleyebilir ? `
              <button class="ikon-btn" title="Düzenle" data-kullanici-duzenle="${k._id}">${icon('kalem')}</button>
              <button class="ikon-btn" title="Şifre sıfırla" data-kullanici-sifre="${k._id}">${icon('shield')}</button>
              <button class="ikon-btn tehlike" title="Sil" data-kullanici-sil="${k._id}">${icon('cop')}</button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="6"><div class="empty">Kayıtlı kullanıcı yok.</div></td></tr>';

    const rolSayim = Object.keys(Yetki.ROLLER).map((r) => ({
      label: r.split(' ')[0], short: String(liste.filter((k) => k.rol === r).length),
      value: liste.filter((k) => k.rol === r).length
    })).filter((x) => x.value);

    return `
    ${pageHead('KULLANICILAR', 'Panele erişecek kişiler, rolleri ve modül bazlı yetkileri. Yetkiler menüyü ve düzenleme/onay düğmelerini belirler.',
      duzenleyebilir ? `<button class="btn accent sm" data-act="kullanici-ekle">${icon('plus')} Kullanıcı ekle</button>` : '')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(num(liste.length), 'Tanımlı kullanıcı', 'up', liste.filter((k) => k.durum === 'Aktif').length + ' aktif')}
      ${kpi(num(new Set(liste.map((k) => k.rol)).size), 'Kullanılan rol', 'up', Object.keys(Yetki.ROLLER).length + ' rol şablonu')}
      ${kpi(num(liste.filter((k) => k.izinler && Object.keys(k.izinler).length).length), 'Özel izinli', 'up', 'rol dışı ayar')}
      ${kpi(num(S.get('gunluk').length), 'İşlem kaydı', 'up', 'son 500 hareket')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Kullanıcı listesi</h3></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Kullanıcı</th><th>Rol</th><th class="num">Erişilen modül</th>
            <th>Son giriş</th><th>Durum</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Rol dağılımı</h3></div>
          ${rolSayim.length ? barChart(rolSayim, { height: 120 }) : '<div class="empty">Veri yok.</div>'}
        </div>
        <div class="card">
          <div class="card-head"><h3>Son işlemler</h3><div class="spacer"></div>
            <span class="hint">kim, neyi, ne zaman</span></div>
          ${gunluk.map((g) => `<div class="list-item">
            <div class="ico">${icon('clock')}</div>
            <div class="txt"><b>${g.kullanici} · ${g.eylem}</b>
              <span>${g.koleksiyon}${g.kayit ? ' · ' + g.kayit : ''} · ${g.tarih.slice(0, 16).replace('T', ' ')}</span></div>
          </div>`).join('') || '<div class="empty">Henüz işlem kaydı yok.</div>'}
        </div>
      </div>
    </div>`;
  }

  async function kullaniciFormu(id) {
    const k = id ? S.bul('kullanicilar', id) : null;
    const alanlar = [
      { ad: 'ad', etiket: 'Ad soyad', zorunlu: true, genis: true, deger: k ? k.ad : '' },
      { ad: 'kullaniciAdi', etiket: 'Kullanıcı adı', zorunlu: true, deger: k ? k.kullaniciAdi : '' },
      { ad: 'eposta', etiket: 'E-posta', deger: k ? k.eposta : '' },
      { ad: 'rol', etiket: 'Rol', tur: 'secim', deger: k ? k.rol : 'İzleyici',
        secenekler: Object.keys(Yetki.ROLLER),
        not: 'Rol, modül yetkilerinin şablonunu belirler.' },
      { ad: 'durum', etiket: 'Durum', tur: 'secim', deger: k ? k.durum : 'Aktif',
        secenekler: ['Aktif', 'Pasif'] }
    ];
    if (!k) alanlar.push(
      { ad: 'sifre', etiket: 'Şifre', tur: 'password', zorunlu: true, genis: true,
        not: 'En az 6 karakter. Şifre PBKDF2 ile özetlenerek saklanır.' });

    const sonuc = await UI.form({
      baslik: k ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı',
      kaydetEtiketi: k ? 'Güncelle' : 'Kullanıcıyı ekle',
      alanlar,
      dogrula: (c) => {
        const ayni = kullaniciListesi().find((x) =>
          x.kullaniciAdi.toLowerCase() === c.kullaniciAdi.trim().toLowerCase() && (!k || x._id !== k._id));
        if (ayni) return 'Bu kullanıcı adı zaten kullanılıyor.';
        if (!k && (c.sifre || '').length < 6) return 'Şifre en az 6 karakter olmalı.';
        return null;
      }
    });
    if (!sonuc) return;

    if (k) {
      /* Son yoneticinin yetkisini dusurmeyi engelle */
      const yoneticiSayisi = kullaniciListesi().filter((x) =>
        x.rol === 'Sistem Yöneticisi' && x.durum === 'Aktif').length;
      if (k.rol === 'Sistem Yöneticisi' && yoneticiSayisi === 1 &&
          (sonuc.rol !== 'Sistem Yöneticisi' || sonuc.durum !== 'Aktif')) {
        toast('Tek sistem yöneticisi pasife alınamaz veya rolü değiştirilemez.');
        return;
      }
      S.guncelle('kullanicilar', id, { ad: sonuc.ad, kullaniciAdi: sonuc.kullaniciAdi.trim(),
                                       eposta: sonuc.eposta, rol: sonuc.rol, durum: sonuc.durum });
      toast(sonuc.ad + ' güncellendi.');
      if (Yetki.kullanici() && Yetki.kullanici()._id === id) Yetki.oturumYukle(kullaniciListesi());
    } else {
      const { salt, sifreHash } = await Yetki.sifreAta(sonuc.sifre);
      S.ekle('kullanicilar', {
        ad: sonuc.ad, kullaniciAdi: sonuc.kullaniciAdi.trim(), eposta: sonuc.eposta,
        rol: sonuc.rol, durum: sonuc.durum, izinler: {}, salt, sifreHash,
        olusturma: new Date().toISOString(), sonGiris: ''
      });
      toast(sonuc.ad + ' eklendi. Kullanıcı adı ve şifresini kendisine iletin.');
    }
  }

  /* --------------------------------------------- modül bazlı izin matrisi */
  async function kullaniciIzin(id) {
    const k = S.bul('kullanicilar', id);
    if (!k) return;
    const duzenleyebilir = yetkiVar('kullanici', 'duzenle');
    const mevcut = Yetki.izinler(k);
    const rolTaban = Yetki.ROLLER[k.rol] || {};

    const secim = await UI.modal({
      baslik: k.ad + ' · yetkiler',
      aciklama: `${k.rol} rolü temel alınır; aşağıdan modül bazında değiştirebilirsiniz.`,
      icerik: `<div class="table-wrap"><table>
          <thead><tr><th>Modül</th>
            ${Yetki.SEVIYE.map((s) => `<th class="num">${Yetki.SEVIYE_ADI[s]}</th>`).join('')}
            <th>Rol şablonu</th></tr></thead>
          <tbody>${Yetki.MODULLER.map((m) => `<tr data-modul="${m.id}">
            <td class="strong">${m.ad}</td>
            ${Yetki.SEVIYE.map((s) => `<td class="num"><label class="secim-hucre">
              <input type="radio" name="izin_${m.id}" value="${s}"
                ${mevcut[m.id] === s ? 'checked' : ''} ${duzenleyebilir ? '' : 'disabled'}>
            </label></td>`).join('')}
            <td class="muted">${Yetki.SEVIYE_ADI[rolTaban[m.id] || 'yok']}</td>
          </tr>`).join('')}</tbody>
        </table></div>
        <p class="modal-metin" style="margin-top:10px">
          Rol şablonundan farklı seçtiğiniz satırlar bu kullanıcıya özel izin olarak kaydedilir.</p>`,
      hazir: (kutu) => kutu.querySelector('.modal').classList.add('genis'),
      dugmeler: duzenleyebilir
        ? [{ ad: 'Rol şablonuna dön', deger: 'sifirla' },
           { ad: 'İzinleri kaydet', tur: 'accent', deger: (kutu) => {
             const ozel = {};
             Yetki.MODULLER.forEach((m) => {
               const sec = kutu.querySelector(`input[name="izin_${m.id}"]:checked`);
               const deger = sec ? sec.value : 'yok';
               if (deger !== (rolTaban[m.id] || 'yok')) ozel[m.id] = deger;
             });
             return { ozel };
           } }]
        : [{ ad: 'Kapat', tur: 'accent', deger: null }]
    });
    if (!secim) return;

    if (secim === 'sifirla') {
      S.guncelle('kullanicilar', id, { izinler: {} });
      toast(k.ad + ' rol şablonuna döndürüldü.');
    } else if (secim.ozel) {
      /* Kendi yonetici yetkisini kapatmayi engelle */
      const ben = Yetki.kullanici();
      if (ben && ben._id === id && (secim.ozel.kullanici === 'yok' || secim.ozel.kullanici === 'goruntule')) {
        toast('Kendi kullanıcı yönetimi yetkinizi kaldıramazsınız.');
        return;
      }
      S.guncelle('kullanicilar', id, { izinler: secim.ozel });
      const n = Object.keys(secim.ozel).length;
      toast(n ? `${k.ad} için ${n} modülde özel izin kaydedildi.` : k.ad + ' rol şablonunu kullanıyor.');
    }
    if (Yetki.kullanici() && Yetki.kullanici()._id === id) Yetki.oturumYukle(kullaniciListesi());
  }

  async function kullaniciSifre(id) {
    const k = S.bul('kullanicilar', id);
    if (!k) return;
    const sonuc = await UI.form({
      baslik: k.ad + ' · şifre sıfırla',
      aciklama: 'Yeni şifreyi kullanıcıya siz iletmelisiniz; şifre geri okunamaz.',
      kaydetEtiketi: 'Şifreyi güncelle',
      alanlar: [{ ad: 'sifre', etiket: 'Yeni şifre', tur: 'password', zorunlu: true, genis: true }],
      dogrula: (c) => (c.sifre || '').length < 6 ? 'Şifre en az 6 karakter olmalı.' : null
    });
    if (!sonuc) return;
    const { salt, sifreHash } = await Yetki.sifreAta(sonuc.sifre);
    S.guncelle('kullanicilar', id, { salt, sifreHash });
    toast(k.ad + ' için şifre güncellendi.');
  }

  async function kullaniciSil(id) {
    const k = S.bul('kullanicilar', id);
    if (!k) return;
    const ben = Yetki.kullanici();
    if (ben && ben._id === id) { toast('Kendi hesabınızı silemezsiniz.'); return; }
    const yoneticiSayisi = kullaniciListesi().filter((x) =>
      x.rol === 'Sistem Yöneticisi' && x.durum === 'Aktif').length;
    if (k.rol === 'Sistem Yöneticisi' && yoneticiSayisi === 1) {
      toast('Tek sistem yöneticisi silinemez.'); return;
    }
    if (!await UI.onay('Kullanıcıyı sil', `${k.ad} (${k.kullaniciAdi}) silinecek.`, 'Sil')) return;
    S.sil('kullanicilar', id);
    toast(k.ad + ' silindi.');
  }

  /* =========================================== kurulum ve oturum ekranları */

  function kabukGoster(goster) {
    document.querySelector('.shell').style.display = goster ? '' : 'none';
    const g = document.getElementById('girisEkrani');
    if (g) g.remove();
  }

  function girisKabugu(icerik) {
    kabukGoster(false);
    const el = document.createElement('div');
    el.id = 'girisEkrani';
    el.className = 'giris-ekrani';
    el.innerHTML = `
      <div class="giris-kart">
        <div class="giris-marka">
          <div class="brand-mark">H</div>
          <div><b>Hakediş Panel</b><span>İnşaat proje yönetimi</span></div>
        </div>
        ${icerik}
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  /* Ilk acilis: sistem yoneticisi hesabi olusturulur */
  function kurulumEkrani() {
    const el = girisKabugu(`
      <h2>Kurulum</h2>
      <p class="giris-not">Panel ilk kez açılıyor. Yönetici hesabını oluşturun;
         diğer kullanıcıları sonra bu hesapla ekleyebilirsiniz.</p>
      <form id="kurulumForm" class="giris-form">
        <label class="alan"><span>Ad soyad *</span><input name="ad" required></label>
        <label class="alan"><span>Kullanıcı adı *</span><input name="kullaniciAdi" required autocomplete="username"></label>
        <label class="alan"><span>Şifre *</span><input name="sifre" type="password" required
          autocomplete="new-password"><em>En az 6 karakter</em></label>
        <label class="alan"><span>Şifre tekrar *</span><input name="sifre2" type="password" required
          autocomplete="new-password"></label>
        <button class="btn accent" type="submit">Hesabı oluştur ve başla</button>
        <div class="giris-hata" hidden></div>
      </form>`);

    el.querySelector('#kurulumForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const hata = el.querySelector('.giris-hata');
      const goster = (m) => { hata.textContent = m; hata.hidden = false; };
      if (String(f.get('sifre')).length < 6) return goster('Şifre en az 6 karakter olmalı.');
      if (f.get('sifre') !== f.get('sifre2')) return goster('Şifreler eşleşmiyor.');

      const { salt, sifreHash } = await Yetki.sifreAta(String(f.get('sifre')));
      const k = S.ekle('kullanicilar', {
        ad: String(f.get('ad')).trim(), kullaniciAdi: String(f.get('kullaniciAdi')).trim(),
        eposta: '', rol: 'Sistem Yöneticisi', durum: 'Aktif', izinler: {},
        salt, sifreHash, olusturma: new Date().toISOString(), sonGiris: new Date().toISOString()
      });
      Yetki.oturumAc(k);
      S.gunlukYaz('kurulum yaptı', 'kullanicilar', k);
      kabukGoster(true);
      mountPanel();
      toast('Hoş geldiniz ' + k.ad + '. Kullanıcılar ekranından ekip arkadaşlarınızı ekleyebilirsiniz.');
    });
  }

  function girisEkrani(mesaj) {
    const el = girisKabugu(`
      <h2>Giriş</h2>
      <p class="giris-not">Panele erişmek için kullanıcı adınızı ve şifrenizi girin.</p>
      <form id="girisForm" class="giris-form">
        <label class="alan"><span>Kullanıcı adı</span><input name="kullaniciAdi" required autocomplete="username"></label>
        <label class="alan"><span>Şifre</span><input name="sifre" type="password" required autocomplete="current-password"></label>
        <button class="btn accent" type="submit">Giriş yap</button>
        <div class="giris-hata" ${mesaj ? '' : 'hidden'}>${mesaj || ''}</div>
      </form>`);

    el.querySelector('#girisForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const hata = el.querySelector('.giris-hata');
      const dugme = e.target.querySelector('button');
      dugme.disabled = true; dugme.textContent = 'Kontrol ediliyor…';

      const ad = String(f.get('kullaniciAdi')).trim().toLowerCase();
      const k = S.get('kullanicilar').find((x) => x.kullaniciAdi.toLowerCase() === ad);
      const gecerli = k && k.durum === 'Aktif' && await Yetki.dogrula(String(f.get('sifre')), k);

      dugme.disabled = false; dugme.textContent = 'Giriş yap';
      if (!gecerli) {
        hata.textContent = k && k.durum !== 'Aktif'
          ? 'Bu hesap pasif durumda. Yöneticinizle görüşün.'
          : 'Kullanıcı adı veya şifre hatalı.';
        hata.hidden = false;
        return;
      }
      Yetki.oturumAc(k);
      S.guncelle('kullanicilar', k._id, { sonGiris: new Date().toISOString() });
      kabukGoster(true);
      mountPanel();
      toast('Hoş geldiniz, ' + k.ad + ' · ' + k.rol);
    });
  }

  function cikisYap() {
    const k = Yetki.kullanici();
    if (k) S.gunlukYaz('çıkış yaptı', 'oturum', k);   // once gunluge yaz, sonra oturumu kapat
    Yetki.oturumKapat();
    document.querySelector('.view').innerHTML = '';
    girisEkrani('');
  }

  /* ------------------------------------------------------- yonlendirme */
  function currentRoute() {
    const id = (location.hash || '#ozet').slice(1);
    if (!VIEWS[id]) return ilkYetkiliRota();
    return yetkiVar(id, 'goruntule') ? id : ilkYetkiliRota();
  }

  /* Kullanicinin gorebildigi ilk modul */
  function ilkYetkiliRota() {
    const m = Yetki.gorunurModuller().find((x) => VIEWS[x.id]);
    return m ? m.id : 'ozet';
  }

  function render() {
    if (!Yetki.kullanici()) return;
    menuyuYaz();
    const route = currentRoute();
    if (location.hash.slice(1) !== route) { location.hash = '#' + route; return; }
    document.getElementById('view').innerHTML = VIEWS[route]();
    izinleriUygula(route);
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

    /* --- kullanıcılar --- */
    tikla('[data-act="kullanici-ekle"]', () => kullaniciFormu(null));
    tikla('[data-kullanici-duzenle]', (b) => kullaniciFormu(b.dataset.kullaniciDuzenle));
    tikla('[data-kullanici-izin]', (b) => kullaniciIzin(b.dataset.kullaniciIzin));
    tikla('[data-kullanici-sifre]', (b) => kullaniciSifre(b.dataset.kullaniciSifre));
    tikla('[data-kullanici-sil]', (b) => kullaniciSil(b.dataset.kullaniciSil));

    /* --- işler --- */
    tikla('[data-act="is-ekle"]', () => isFormu(null));
    tikla('[data-act="is-csv"]', isCSV);
    tikla('[data-is-detay]', (b) => isDetay(b.dataset.isDetay));
    tikla('[data-is-duzenle]', (b) => isFormu(b.dataset.isDuzenle));
    tikla('[data-is-sil]', async (b) => {
      const is = S.bul('isler', b.dataset.isSil);
      if (!is) return;
      const tahsis = (is.malzemeler || []).length;
      if (!await UI.onay('İşi sil',
        `${is.ad} silinecek.` + (tahsis ? ` ${tahsis} malzeme tahsisi rezerveden düşülecek.` : ''), 'Sil')) return;
      (is.malzemeler || []).forEach((k) => {
        const m = S.get('stok').find((x) => x.kod === k.kod);
        if (m) S.guncelle('stok', m._id, { rezerve: Math.max(0, m.rezerve - k.miktar) });
      });
      S.sil('isler', is._id);
      toast(is.ad + ' silindi.');
    });
    const isProje = document.getElementById('isProje');
    if (isProje) isProje.addEventListener('change', () => { state.isProje = isProje.value; render(); });

    /* --- personel --- */
    tikla('[data-act="personel-ekle"]', () => personelFormu(null));
    tikla('[data-act="personel-csv"]', personelCSV);
    tikla('[data-act="puantaj-toplu"]', puantajToplu);
    tikla('[data-personel-kart]', (b) => personelKarti(b.dataset.personelKart));
    tikla('[data-personel-duzenle]', (b) => personelFormu(b.dataset.personelDuzenle));
    tikla('[data-puantaj-gir]', (b) => puantajFormu(b.dataset.puantajGir));
    tikla('[data-personel-sil]', async (b) => {
      const k = S.bul('personel', b.dataset.personelSil);
      if (!k) return;
      const gorevli = S.get('isler').filter((i) => (i.personelIds || []).includes(k.id)).length;
      if (!await UI.onay('Personeli sil',
        `${k.ad} silinecek.` + (gorevli ? ` ${gorevli} işteki görevlendirmesi kaldırılacak.` : ''), 'Sil')) return;
      S.get('isler').forEach((i) => {
        if ((i.personelIds || []).includes(k.id)) {
          S.guncelle('isler', i._id, { personelIds: i.personelIds.filter((x) => x !== k.id) });
        }
      });
      S.sil('personel', k._id);
      toast(k.ad + ' silindi.');
    });
    const puantajTarihi = document.getElementById('puantajTarihi');
    if (puantajTarihi) puantajTarihi.addEventListener('change', () => {
      state.puantajTarihi = puantajTarihi.value; render();
    });
    const personelFirma = document.getElementById('personelFirma');
    if (personelFirma) personelFirma.addEventListener('change', () => {
      state.personelFirma = personelFirma.value; render();
    });

    /* --- raporlar --- */
    const raporTaseron = document.getElementById('raporTaseron');
    if (raporTaseron) {
      if (!state.raporTaseron) state.raporTaseron = raporTaseron.value;
      raporTaseron.addEventListener('change', () => { state.raporTaseron = raporTaseron.value; });
    }
    tikla('[data-rapor-ac]', (b) => {
      const r = raporUret(b.dataset.raporAc, state.raporTaseron);
      if (r) raporGoster(r); else toast('Rapor için yeterli veri yok.');
    });
    tikla('[data-rapor-csv]', (b) => {
      const r = raporUret(b.dataset.raporCsv, state.raporTaseron);
      if (r) raporCSV(r); else toast('Rapor için yeterli veri yok.');
    });

    /* --- stok --- */
    tikla('[data-act="stok-ekle"]', () => stokFormu(null));
    tikla('[data-act="stok-csv"]', stokCSV);
    tikla('[data-stok-duzenle]', (b) => stokFormu(b.dataset.stokDuzenle));
    tikla('[data-stok-hareket]', (b) => stokHareketi(b.dataset.stokHareket));
    tikla('[data-stok-talep]', (b) => stokTalebi(b.dataset.stokTalep));
    tikla('[data-stok-sil]', async (b) => {
      const s2 = S.bul('stok', b.dataset.stokSil);
      if (!s2) return;
      if (await UI.onay('Malzemeyi sil', `${s2.ad} (${s2.kod}) stok kartı silinecek.`, 'Sil')) {
        S.sil('stok', s2._id); toast(s2.ad + ' silindi.');
      }
    });
    const stokDepo = document.getElementById('stokDepo');
    if (stokDepo) stokDepo.addEventListener('change', () => { state.stokDepo = stokDepo.value; render(); });

    /* --- tedarik --- */
    tikla('[data-act="siparis-ekle"]', () => siparisFormu(null));
    tikla('[data-act="siparis-csv"]', siparisCSV);
    tikla('[data-siparis-duzenle]', (b) => siparisFormu(b.dataset.siparisDuzenle));
    tikla('[data-siparis-ilerlet]', (b) => siparisIlerlet(b.dataset.siparisIlerlet));
    tikla('[data-siparis-sil]', async (b) => {
      const o = S.bul('siparisler', b.dataset.siparisSil);
      if (!o) return;
      if (await UI.onay('Siparişi sil', `${o.no} · ${o.malzeme} siparişi silinecek.`, 'Sil')) {
        S.sil('siparisler', o._id); toast(o.no + ' silindi.');
      }
    });
    const siparisDurum = document.getElementById('siparisDurum');
    if (siparisDurum) siparisDurum.addEventListener('change', () => {
      state.siparisDurum = siparisDurum.value; render();
    });

    /* Taşeron kartı başlığı: yetki bölümünü açar/kapatır */
    tikla('[data-taseron-ac]', (b) => {
      const id = b.dataset.taseronAc;
      state.acikTaseron = state.acikTaseron === id ? null : id;
      render();
    });

    /* --- proje ve taşeron kayıtları --- */
    tikla('[data-act="proje-ekle"]', () => projeFormu(null));
    tikla('[data-proje-duzenle]', (b) => projeFormu(b.dataset.projeDuzenle));
    tikla('[data-proje-sil]', (b) => projeSil(b.dataset.projeSil));
    tikla('[data-act="taseron-ekle"]', () => taseronFormu(null));
    tikla('[data-taseron-duzenle]', (b) => taseronFormu(b.dataset.taseronDuzenle));
    tikla('[data-taseron-sil]', (b) => taseronSil(b.dataset.taseronSil));

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
    const mesaj = { dogrula: 'Kalem manuel doğrulama kuyruğuna alındı.' };
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
  /* Menu ve ikon rayi yalnizca yetkili modulleri gosterir */
  function menuyuYaz() {
    const gorunur = MENU.filter((m) => yetkiVar(m.id, 'goruntule'));
    document.querySelector('.nav').innerHTML =
      gorunur.map((m) => `<a href="#${m.id}">${m.ad}</a>`).join('');

    const ayrac = Math.min(7, gorunur.length);
    document.querySelector('.rail').innerHTML =
      gorunur.map((m, i) => (i === ayrac ? '<div class="rail-sep"></div>' : '') +
        `<button data-route="${m.id}" title="${m.ad}" aria-label="${m.ad}">${icon(m.ikon)}</button>`).join('') +
      '<div class="rail-sep"></div>' +
      `<button title="Bildirimler" data-rail="bildirim">${icon('bell')}</button>` +
      `<button title="Veri yönetimi" data-rail="veri">${icon('veri')}</button>`;

    document.querySelectorAll('.rail button[data-route]').forEach((b) =>
      b.addEventListener('click', () => { location.hash = '#' + b.dataset.route; }));
    document.querySelector('[data-rail="veri"]').addEventListener('click', veriYonetimi);
    document.querySelector('[data-rail="bildirim"]').addEventListener('click', () => {
      const bekleyen = S.get('hakedisler').filter((h) => h.durum === 'Onay Bekliyor').length;
      const kritik = kritikStok().length;
      toast(`${bekleyen} hakediş onay bekliyor · ${kritik} malzeme kritik seviyede`);
    });
    kullaniciCubugu();
  }

  /* Ust cubukta aktif kullanici ve cikis */
  function kullaniciCubugu() {
    const k = Yetki.kullanici();
    const kutu = document.querySelector('.role-switch');
    if (!k || !kutu) return;
    const bas = k.ad.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
    kutu.innerHTML = `
      <span class="aktif-kullanici" title="${k.ad} · ${k.rol}">
        <i>${bas}</i><div><b>${k.ad}</b><small>${k.rol}</small></div>
      </span>
      <button data-cikis title="Çıkış yap">${icon('lock')} Çıkış</button>`;
    kutu.querySelector('[data-cikis]').addEventListener('click', cikisYap);
    const marka = document.querySelector('.brand-avatar');
    if (marka) marka.textContent = bas;
  }

  /* Yetkisi olmayan islemlerin dugmelerini gizler */
  function izinleriUygula(route) {
    const duzenle = yetkiVar(route, 'duzenle');
    const onayla = yetkiVar(route, 'onayla');
    const kok = document.getElementById('view');

    if (!duzenle) {
      kok.querySelectorAll(
        '[data-act$="-ekle"], [class*="ikon-btn"][data-metraj-duzenle], .satir-islem .ikon-btn.tehlike,' +
        '[data-metraj-duzenle], [data-metraj-sil], [data-metraj-dogrula],' +
        '[data-pafta-sil], [data-is-duzenle], [data-is-sil],' +
        '[data-taseron-duzenle], [data-taseron-sil], [data-proje-duzenle], [data-proje-sil],' +
        '[data-personel-duzenle], [data-personel-sil], [data-puantaj-gir],' +
        '[data-kalite-tekrar], [data-kalite-sil], [data-hakedis-sil],' +
        '[data-stok-duzenle], [data-stok-sil], [data-stok-hareket], [data-stok-talep],' +
        '[data-siparis-duzenle], [data-siparis-sil],' +
        '[data-kullanici-duzenle], [data-kullanici-sil], [data-kullanici-sifre],' +
        '[data-act="puantaj-toplu"]'
      ).forEach((el) => el.remove());
    }
    if (!onayla) {
      kok.querySelectorAll('[data-hakedis-ilerlet], [data-hakedis-red], [data-siparis-ilerlet]')
         .forEach((el) => el.remove());
    }
    if (!duzenle) {
      const bos = kok.querySelectorAll('.satir-islem');
      bos.forEach((el) => { if (!el.children.length) el.remove(); });
    }
  }

  function mountPanel() {
    if (!Yetki.kullanici()) return;
    menuyuYaz();
    render();
  }

  /* Acilis: kullanici yoksa kurulum, oturum yoksa giris, varsa panel */
  function mount() {
    window.addEventListener('hashchange', render);
    S.abone(() => { if (Yetki.kullanici()) render(); });

    if (!S.get('kullanicilar').length) { kurulumEkrani(); return; }
    if (!Yetki.oturumYukle(S.get('kullanicilar'))) { girisEkrani(''); return; }
    kabukGoster(true);
    mountPanel();
  }

  document.addEventListener('DOMContentLoaded', mount);
})();
