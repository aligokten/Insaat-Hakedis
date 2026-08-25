/* İnşaat Hakediş Paneli - gorunum yonlendirici ve ekranlar */
(function () {
  const { icon, num, num2, money, moneyShort, pct, donut, arcChart,
          lineChart, barChart, badge, bar, toast } = window.UI;
  const DB = window.DB;

  /* -------------------------------------------------------------- durum */
  const state = {
    rol: 'yonetici',           // yonetici | taseron
    projeFiltre: 'hepsi',
    stripIndex: 0,
    yetkiler: JSON.parse(JSON.stringify(
      DB.taseronlar.reduce((a, t) => (a[t.id] = t.yetkiler.slice(), a), {})
    )),
    yuklenen: []               // oturum icinde eklenen paftalar
  };

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
  const paftalarAll = () => state.yuklenen.concat(DB.paftalar);
  const metrajTutar = (m) => m.miktar * m.birimFiyat;
  const toplamMetraj = () => DB.metraj.reduce((s, m) => s + metrajTutar(m), 0);
  const hakedisNet = (h) => h.imalat - h.kesinti - h.avansMahsup;
  const hakedisBrut = (h) => hakedisNet(h) + h.kdv;
  const sozlesmeToplam = () => DB.projeler.reduce((s, p) => s + p.sozlesme, 0);
  const gerceklesenToplam = () => DB.projeler.reduce((s, p) => s + p.gerceklesen, 0);
  const kritikStok = () => DB.stok.filter((s) => s.mevcut - s.rezerve < s.kritik);
  const taseronAd = (id) => (DB.taseronlar.find((t) => t.id === id) || {}).ad || id;
  const projeAd = (id) => (DB.projeler.find((p) => p.id === id) || {}).ad || id;

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

    const kartlar = DB.projeler.slice(0, 4).map((p, i) => `
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
            <div class="mini-row">${icon('building')}<span>Projeler</span><b>${DB.projeler.length}</b></div>
            <div class="mini-row">${icon('users')}<span>Taşeronlar</span><b>${DB.taseronlar.length}</b></div>
            <div class="mini-row">${icon('layers')}<span>Paftalar</span><b>${paftalarAll().length}</b></div>
            <div class="mini-row">${icon('receipt')}<span>Hakedişler</span><b>${DB.hakedisler.length}</b></div>
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
        <b>0${Math.min(DB.projeler.length, 4)}</b><span>/ ${DB.projeler.length}</span>
        <button data-strip="1">${icon('right')}</button>
      </div>
    </div>

    <div class="card-strip" id="strip">${kartlar}</div>

    <div class="grid cols-4" style="padding:6px 10px 0">
      ${kpi(moneyShort(sozlesmeToplam()), 'Toplam sözleşme bedeli', 'up', '%8,4 yıllık artış')}
      ${kpi(moneyShort(gerceklesenToplam()), 'Gerçekleşen imalat', 'up', pct(gerceklesenToplam() / sozlesmeToplam() * 100) + ' tamamlanma')}
      ${kpi(String(DB.hakedisler.filter((h) => h.durum !== 'Onaylandı').length), 'Onay bekleyen hakediş', 'down', 'aksiyon gerekli')}
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
  function viewPaftalar() {
    const rows = paftalarAll().map((d) => `
      <tr>
        <td><div class="strong">${d.ad}</div><div class="muted">${d.id} · Rev ${d.rev} · ${d.boyut}</div></td>
        <td>${badge(d.tur, 'info')}</td>
        <td>${d.disiplin}</td>
        <td>${projeAd(d.proje)}</td>
        <td class="num">${d.olcek}</td>
        <td class="num">${d.katman}</td>
        <td class="num">${d.alanM2 ? num(d.alanM2) + ' m²' : '—'}</td>
        <td>${badge(d.durum, durumKind(d.durum))}</td>
        <td class="num"><button class="btn ghost sm" data-goto="metraj">Metraja git</button></td>
      </tr>`).join('');

    const turler = ['Kat Planı', 'Kesit', 'Görünüş', 'Detay', 'Kalıp Planı'];
    const sayim = turler.map((t) => ({
      label: t.split(' ')[0],
      short: String(paftalarAll().filter((d) => d.tur === t).length),
      value: paftalarAll().filter((d) => d.tur === t).length || 0.2
    }));

    return `
    ${pageHead('PROJELER & DWG', 'Mimari ve statik paftaları yükleyin; sistem katmanları ayrıştırır ve metraj kuyruğuna alır.')}
    <div class="grid side" style="padding:0 10px">
      <div class="grid" style="gap:14px">
        <div class="dropzone" id="dz">
          <div class="dz-icon">${icon('upload')}</div>
          <h3>Pafta dosyalarını buraya bırakın</h3>
          <p>DWG, DXF, PDF · kat planı, kesit, görünüş, detay, kalıp planı · en fazla 200 MB</p>
          <label class="btn accent">${icon('plus')} Dosya seç
            <input type="file" id="fileInput" multiple hidden accept=".dwg,.dxf,.pdf">
          </label>
        </div>
        <div class="card">
          <div class="card-head"><h3>Yüklenen paftalar</h3><div class="spacer"></div>
            <span class="hint">${paftalarAll().length} dosya</span></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Dosya</th><th>Tür</th><th>Disiplin</th><th>Proje</th>
              <th class="num">Ölçek</th><th class="num">Katman</th><th class="num">Alan</th>
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
          <div class="card-head"><h3>İşleme hattı</h3></div>
          <div class="timeline">
            <div class="tl"><b>Dosya alındı</b><span>Sürüm ve revizyon kaydı oluşturulur</span></div>
            <div class="tl"><b>Katman ayrıştırma</b><span>Duvar, döşeme, donatı katmanları etiketlenir</span></div>
            <div class="tl"><b>Metraj çıkarımı</b><span>Alan, uzunluk ve adet değerleri poz ile eşleşir</span></div>
            <div class="tl"><b>Kontrol ve onay</b><span>Kontrol şefi sapmaları onaylar</span></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ metraj */
  function viewMetraj() {
    const rows = DB.metraj.map((m) => `
      <tr>
        <td><span class="strong">${m.poz}</span></td>
        <td>${m.tanim}<div class="muted">${m.pafta} · ${projeAd(m.proje)}</div></td>
        <td class="num">${num2(m.miktar)} ${m.birim}</td>
        <td class="num">${money(m.birimFiyat)}</td>
        <td class="num strong">${money(metrajTutar(m))}</td>
        <td>${badge(m.kaynak, m.kaynak === 'Otomatik' ? 'info' : '')}</td>
        <td style="min-width:120px">${bar(m.guven * 100, m.guven >= 0.9 ? 'ok' : m.guven >= 0.85 ? 'warn' : 'bad')}</td>
      </tr>`).join('');

    const otomatik = DB.metraj.filter((m) => m.kaynak === 'Otomatik').length;
    const ortGuven = DB.metraj.reduce((s, m) => s + m.guven, 0) / DB.metraj.length * 100;

    return `
    ${pageHead('METRAJ', 'Paftalardan cikarilan poz bazlı miktarlar ve keşif bedeli. Dusuk güven skorlu kalemler manuel doğrulama ister.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(toplamMetraj()), 'Toplam keşif bedeli', 'up', num(DB.metraj.length) + ' poz')}
      ${kpi(num(DB.metraj.length), 'Metraj kalemi', 'up', otomatik + ' otomatik')}
      ${kpi(pct(ortGuven), 'Ortalama güven skoru', ortGuven > 90 ? 'up' : 'down', 'katman eşleşmesi')}
      ${kpi(num(paftalarAll().filter((d) => d.durum === 'İşlendi').length), 'İşlenen pafta', 'up', 'kuyrukta ' + paftalarAll().filter((d) => d.durum === 'Kuyrukta').length)}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Poz bazlı metraj icmali</h3><div class="spacer"></div>
          <button class="btn ghost sm" data-act="export">${icon('download')} Dışa aktar</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Poz No</th><th>Tanım</th><th class="num">Miktar</th>
            <th class="num">Birim Fiyat</th><th class="num">Tutar</th><th>Kaynak</th><th>Güven</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="4">Genel toplam</td>
            <td class="num">${money(toplamMetraj())}</td><td colspan="2"></td></tr></tfoot>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>İmalat gruplarına dagilim</h3></div>
          ${barChart([
            { label: 'Kaba', short: '46%', value: 46 },
            { label: 'Ince', short: '28%', value: 28 },
            { label: 'Cephe', short: '14%', value: 14 },
            { label: 'Mek.', short: '8%', value: 8 },
            { label: 'Elek.', short: '4%', value: 4 }
          ])}
        </div>
        <div class="card">
          <div class="card-head"><h3>Doğrulama bekleyenler</h3></div>
          ${DB.metraj.filter((m) => m.guven < 0.9).map((m) => `
            <div class="list-item">
              <div class="ico">${icon('alert')}</div>
              <div class="txt"><b>${m.poz}</b><span>${m.pafta} · güven ${pct(m.guven * 100)}</span></div>
              <div class="spacer"></div>
              <button class="btn ghost sm" data-act="dogrula">Doğrula</button>
            </div>`).join('') || '<div class="empty">Tüm kalemler doğrulandı.</div>'}
        </div>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------- taşeron */
  function viewTaseron() {
    const kartlar = DB.taseronlar.map((t) => `
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
            const on = state.yetkiler[t.id].indexOf(y.key) > -1;
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
  function viewKalite() {
    const rows = DB.kaliteKontrol.map((q) => `
      <tr>
        <td><span class="strong">${q.id}</span><div class="muted">${q.tarih}</div></td>
        <td>${q.imalat}<div class="muted">${q.notlar}</div></td>
        <td>${taseronAd(q.taseron)}</td>
        <td>${q.kontrolor}</td>
        <td class="num">${q.skor ? q.skor : '—'}</td>
        <td style="min-width:130px">${bar(q.tamamlanma, q.tamamlanma >= 90 ? 'ok' : q.tamamlanma >= 60 ? 'warn' : 'bad')}</td>
        <td>${badge(q.sonuc, durumKind(q.sonuc))}</td>
      </tr>`).join('');

    const onayli = DB.kaliteKontrol.filter((q) => q.sonuc === 'Onaylandı').length;
    const ortTamam = DB.kaliteKontrol.reduce((s, q) => s + q.tamamlanma, 0) / DB.kaliteKontrol.length;

    return `
    ${pageHead('KALİTE KONTROL', 'İmalat bazlı kontrol formları, sapma kayıtları ve tamamlanma durumu.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(onayli + '/' + DB.kaliteKontrol.length, 'Onaylanan kontrol', 'up', 'bu ay')}
      ${kpi(pct(ortTamam), 'Ortalama tamamlanma', 'up', 'tüm imalatlar')}
      ${kpi(String(DB.kaliteKontrol.filter((q) => q.sonuc === 'Red').length), 'Reddedilen imalat', 'down', 'yeniden yapım')}
      ${kpi(String(DB.kaliteKontrol.filter((q) => q.sonuc === 'Beklemede').length), 'Bekleyen kontrol', 'down', 'test raporu')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Kontrol kayıtları</h3><div class="spacer"></div>
          <button class="btn accent sm" data-act="yeni-kontrol">${icon('plus')} Yeni kontrol</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Kayıt</th><th>İmalat</th><th>Taşeron</th><th>Kontrolör</th>
            <th class="num">Skor</th><th>Tamamlanma</th><th>Sonuç</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Taşeron kalite skoru</h3></div>
        ${DB.taseronlar.slice(0, 5).map((t) => {
          const kayit = DB.kaliteKontrol.filter((q) => q.taseron === t.id);
          const sk = kayit.length ? kayit.reduce((s, q) => s + q.skor, 0) / kayit.length : t.puan * 20;
          return `<div style="padding:9px 0;border-top:1px solid var(--line-soft)">
            <div style="display:flex;font-size:12.5px;margin-bottom:6px">
              <span>${t.ad}</span><span style="margin-left:auto;color:var(--ink-3)">${t.brans}</span></div>
            ${bar(sk, sk >= 85 ? 'ok' : sk >= 60 ? 'warn' : 'bad')}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------- hakediş */
  function viewHakedis() {
    const rows = DB.hakedisler.map((h) => `
      <tr>
        <td><span class="strong">${h.no}</span><div class="muted">${h.donem}</div></td>
        <td>${projeAd(h.proje)}<div class="muted">${taseronAd(h.taseron)}</div></td>
        <td class="num">${money(h.imalat)}</td>
        <td class="num">-${money(h.kesinti)}</td>
        <td class="num">-${money(h.avansMahsup)}</td>
        <td class="num">${money(h.kdv)}</td>
        <td class="num strong">${money(hakedisBrut(h))}</td>
        <td>${badge(h.durum, durumKind(h.durum))}</td>
        <td class="num">${h.durum === 'Onay Bekliyor' && state.rol === 'yonetici'
          ? `<button class="btn sm" data-act="onayla" data-no="${h.no}">Onayla</button>`
          : `<span class="muted">${h.onaylayan}</span>`}</td>
      </tr>`).join('');

    const toplamNet = DB.hakedisler.reduce((s, h) => s + hakedisBrut(h), 0);
    const bekleyen = DB.hakedisler.filter((h) => h.durum !== 'Onaylandı');
    const donemler = [12, 15, 13, 18, 16, 21, 19, 24];

    return `
    ${pageHead('HAKEDİŞ', 'Dönemsel imalat bedeli, kesintiler, avans mahsubu ve onay akışı.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(toplamNet), 'Toplam hakediş (KDV dahil)', 'up', DB.hakedisler.length + ' dosya')}
      ${kpi(moneyShort(bekleyen.reduce((s, h) => s + hakedisBrut(h), 0)), 'Onay bekleyen tutar', 'down', bekleyen.length + ' dosya')}
      ${kpi(moneyShort(DB.hakedisler.reduce((s, h) => s + h.kesinti, 0)), 'Toplam kesinti', 'up', 'teminat + stopaj')}
      ${kpi(moneyShort(DB.hakedisler.reduce((s, h) => s + h.avansMahsup, 0)), 'Avans mahsubu', 'up', 'kapatılan')}
    </div>
    <div class="grid side" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Hakediş dosyaları</h3><div class="spacer"></div>
          <button class="btn accent sm" data-act="yeni-hakedis">${icon('plus')} Hakediş oluştur</button></div>
        <div class="table-wrap"><table>
          <thead><tr><th>No</th><th>Proje / Taşeron</th><th class="num">İmalat</th>
            <th class="num">Kesinti</th><th class="num">Avans</th><th class="num">KDV</th>
            <th class="num">Ödenecek</th><th>Durum</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="6">Genel toplam</td>
            <td class="num">${money(toplamNet)}</td><td colspan="2"></td></tr></tfoot>
        </table></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <div class="card-head"><h3>Dönemsel hakediş eğrisi</h3><div class="spacer"></div>
            <span class="hint">son 8 dönem</span></div>
          ${lineChart(donemler)}
        </div>
        <div class="card">
          <div class="card-head"><h3>Onay akışı</h3></div>
          <div class="timeline">
            <div class="tl"><b>Taşeron hazırlar</b><span>Metraj + kalite kaydı eklenir</span></div>
            <div class="tl"><b>Saha şefi kontrolü</b><span>Yerinde imalat doğrulanır</span></div>
            <div class="tl"><b>Kontrol şefi</b><span>Poz ve birim fiyat kontrolü</span></div>
            <div class="tl"><b>Proje müdürü onayı</b><span>Ödeme talimatına dönüşür</span></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------- stok */
  function viewStok() {
    const rows = DB.stok.map((s) => {
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

    const stokDeger = DB.stok.reduce((s, x) => s + x.mevcut * x.birimFiyat, 0);

    return `
    ${pageHead('MALZEME STOK', 'Depo bazlı mevcut, rezerve ve kullanilabilir miktarlar ile kritik seviye uyarıları.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(stokDeger), 'Toplam stok değeri', 'up', DB.stok.length + ' kalem')}
      ${kpi(String(kritikStok().length), 'Kritik seviye', 'down', 'sipariş önerilir')}
      ${kpi(String(new Set(DB.stok.map((s) => s.depo)).size), 'Aktif depo', 'up', 'saha + merkez')}
      ${kpi(moneyShort(DB.stok.reduce((s, x) => s + x.rezerve * x.birimFiyat, 0)), 'Rezerve tutar', 'up', 'imalata ayrılan')}
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
    const rows = DB.siparisler.map((o) => `
      <tr>
        <td><span class="strong">${o.no}</span><div class="muted">${o.sipariş}</div></td>
        <td>${o.tedarikci}</td>
        <td>${o.malzeme}<div class="muted">${o.miktar}</div></td>
        <td class="num">${money(o.tutar)}</td>
        <td class="num">${o.teslim}</td>
        <td style="min-width:130px">${bar(o.ilerleme, o.durum === 'Gecikmeli' ? 'bad' : o.ilerleme === 100 ? 'ok' : '')}</td>
        <td>${badge(o.durum, durumKind(o.durum))}</td>
      </tr>`).join('');

    const toplam = DB.siparisler.reduce((s, o) => s + o.tutar, 0);
    const geciken = DB.siparisler.filter((o) => o.durum === 'Gecikmeli');

    return `
    ${pageHead('TEDARİK & SİPARİŞ', 'Satın alma siparişlerinin onay, sevkiyat ve teslim takibi.')}
    <div class="grid cols-4" style="padding:0 10px 14px">
      ${kpi(moneyShort(toplam), 'Acik sipariş tutari', 'up', DB.siparisler.length + ' sipariş')}
      ${kpi(String(DB.siparisler.filter((o) => o.durum === 'Yolda').length), 'Sevkiyatta', 'up', 'yolda')}
      ${kpi(String(geciken.length), 'Geciken teslim', 'down', 'takip gerekli')}
      ${kpi(String(DB.siparisler.filter((o) => o.durum === 'Onay Bekliyor').length), 'Onay bekleyen', 'down', 'satın alma')}
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
          ${DB.siparisler.slice().sort((a, b) => a.teslim.localeCompare(b.teslim)).map((o) => `
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
      ${DB.raporlar.map(kart).join('')}
    </div>
    <div class="grid cols-3" style="padding:0 10px">
      <div class="card">
        <div class="card-head"><h3>Portföy ilerlemesi</h3></div>
        ${DB.projeler.map((p) => `
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
  function bindView() {
    /* yetki anahtarlari */
    document.querySelectorAll('[data-yetki]').forEach((el) => {
      el.addEventListener('click', () => {
        const [tid, key] = el.dataset.yetki.split('|');
        const list = state.yetkiler[tid];
        const i = list.indexOf(key);
        if (i > -1) list.splice(i, 1); else list.push(key);
        el.classList.toggle('on');
        el.setAttribute('aria-pressed', String(i === -1));
        const ad = (DB.YETKI_LISTESI.find((y) => y.key === key) || {}).ad;
        toast(`${taseronAd(tid)} · "${ad}" yetkisi ${i > -1 ? 'kaldırıldı' : 'verildi'}`);
      });
    });

    /* kart seridi kaydirma */
    document.querySelectorAll('[data-strip]').forEach((b) => {
      b.addEventListener('click', () => {
        const strip = document.getElementById('strip');
        if (strip) strip.scrollBy({ left: Number(b.dataset.strip) * 302, behavior: 'smooth' });
      });
    });

    /* gorunum gecisleri */
    document.querySelectorAll('[data-goto]').forEach((b) => {
      b.addEventListener('click', () => { location.hash = '#' + b.dataset.goto; });
    });

    /* hakediş onayı */
    document.querySelectorAll('[data-act="onayla"]').forEach((b) => {
      b.addEventListener('click', () => {
        const h = DB.hakedisler.find((x) => x.no === b.dataset.no);
        if (!h) return;
        h.durum = 'Onaylandı';
        h.onaylayan = 'Proje Müdürü';
        toast(h.no + ' onaylandı, ödeme talimatı oluşturuldu.');
        render();
      });
    });

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

    /* demo aksiyonlari */
    const mesaj = {
      export: 'Metraj icmali XLSX olarak hazırlanıyor.',
      dogrula: 'Kalem manuel doğrulama kuyruğuna alındı.',
      'yeni-kontrol': 'Yeni kalite kontrol formu oluşturuldu.',
      'yeni-hakedis': 'Yeni hakediş taslağı açıldı.',
      'yeni-siparis': 'Satın alma talebi oluşturuldu.',
      siparis: 'Malzeme talebi satın almaya iletildi.',
      sayim: 'Depo sayımı başlatıldı.',
      gonder: 'Rapor alıcılara gönderildi.',
      pdf: 'PDF çıktısı hazırlanıyor.'
    };
    document.querySelectorAll('[data-act]').forEach((b) => {
      const m = mesaj[b.dataset.act];
      if (m) b.addEventListener('click', () => toast(m));
    });
  }

  function addFiles(files) {
    if (!files || !files.length) return;
    const turTahmin = (ad) => {
      const s = ad.toLowerCase();
      if (s.includes('kesit')) return 'Kesit';
      if (s.includes('gorunus') || s.includes('görünüş') || s.includes('cephe')) return 'Görünüş';
      if (s.includes('detay')) return 'Detay';
      if (s.includes('kalıp') || s.includes('kalıp')) return 'Kalıp Planı';
      return 'Kat Planı';
    };
    Array.from(files).forEach((f, i) => {
      state.yuklenen.unshift({
        id: 'DWG-' + (2000 + state.yuklenen.length + i),
        ad: f.name,
        tur: turTahmin(f.name),
        disiplin: /^s[-_]/i.test(f.name) ? 'Statik' : 'Mimari',
        proje: state.projeFiltre === 'hepsi' ? 'PRJ-01' : state.projeFiltre,
        rev: 'A',
        olcek: '1/50',
        boyut: (f.size / 1048576).toFixed(1) + ' MB',
        tarih: new Date().toISOString().slice(0, 10),
        durum: 'Kuyrukta',
        katman: 0,
        alanM2: 0
      });
    });
    toast(files.length + ' pafta yüklendi, metraj kuyruğuna alındı.');
    render();
  }

  /* -------------------------------------------------------------- iskele */
  function mount() {
    document.querySelector('.nav').innerHTML =
      MENU.map((m) => `<a href="#${m.id}">${m.ad}</a>`).join('');

    document.querySelector('.rail').innerHTML =
      MENU.map((m, i) => (i === 5 ? '<div class="rail-sep"></div>' : '') +
        `<button data-route="${m.id}" title="${m.ad}" aria-label="${m.ad}">${icon(m.ikon)}</button>`).join('') +
      '<div class="rail-sep"></div>' +
      `<button title="Bildirimler">${icon('bell')}</button>` +
      `<button title="Ayarlar">${icon('settings')}</button>`;

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
    render();
  }

  document.addEventListener('DOMContentLoaded', mount);
})();
