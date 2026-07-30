/* ═══ GeoHutan Jabar – Core ═══ */

/* 0. Globals */
var mapObj, GEO = null, LOADED = 0, TOTAL = 21, CHARTS = {}, RTIMER = null;
var DATA = { pjl: [], persemaian: [], pegawai: [], jumat: [], pegawaiBinaan: [] };
var FILTER = { cdk: [], pegawaiUnit: [], kab: [], status: [], kawasan: [], jabatan: [], nama_pegawai: [], penyuluh: [], kategori_lojuna: [], binaan_unit: [], binaan_kab: [], binaan_kegiatan: [], binaan_jabatan: [], binaan_pembina: [] };
var LAYER_VISIBLE = { pjl: true, per: true, peg: true, jum: true, pegb: true };
var AUTOPOLY_ENABLED = true;
var LAYERS = {}; // Will hold either LayerGroup or MarkerClusterGroup
var BASEMAPS = {};
var CURRENT_BASEMAP = 'satellite';
var CLUSTER_ENABLED = true;
var HEATMAP_ENABLED = false;
var BUFFER_ENABLED = false;
var PJL_POLYGON_ENABLED = false;
var PJL_POLYGON_LAYER = null;
var HEATMAP_LAYER = null;
var BUFFER_LAYERS = null;
var DYNAMIC_SOURCES = [];

var POP_COLOR = { pjl: '#43a047', per: '#1e88e5', peg: '#fb8c00', jum: '#8e24aa', pegb: '#00897b' };
var POP_LABEL = {
  pjl: 'Petugas Jaga Leuweung',
  per: 'Lokasi Persemaian Jaga Leuweung',
  peg: 'Pegawai Dinas Kehutanan',
  jum: 'Lokasi Permanen Jum\'at Menanam',
  pegb: 'Pegawai Wilayah Hutan Binaan'
};

/* 1. Map Init */
try {
  BASEMAPS = {
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 }),
    gHybrid: L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=id&x={x}&y={y}&z={z}', { attribution: '&copy; Google', maxZoom: 20 }),
    gLight: L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=id&x={x}&y={y}&z={z}', { attribution: '&copy; Google', maxZoom: 20 }),
    gDark: L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=id&x={x}&y={y}&z={z}', { attribution: '&copy; Google', maxZoom: 20, className: 'dark-map-filter' }),
    street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 19 }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenTopoMap', maxZoom: 17 })
  };
  mapObj = L.map('map', { center: [-6.9, 107.6], zoom: 8, layers: [BASEMAPS.satellite], zoomControl: false });
  L.control.zoom({ position: 'bottomright' }).addTo(mapObj);
} catch (e) { console.error('Map init:', e); }

/* 2. Icons */
var SVG_PJL = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 20 24"><path d="M10,0 L20,4 L20,12 C20,18 10,24 10,24 C10,24 0,18 0,12 L0,4 Z" fill="#43a047" stroke="#fff" stroke-width="1.2"/><polygon points="10,6 15,14 11,14 11,18 9,18 9,14 5,14" fill="#fff"/></svg>';
var SVG_PER = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 20 24"><path d="M10,24 L10,12 M10,16 C10,16 6,10 2,12 C4,16 8,16 10,16 M10,14 C10,14 15,8 18,10 C16,14 12,14 10,14" fill="#1e88e5" stroke="#fff" stroke-width="1"/><path d="M10,24 L10,12 M10,16 C10,16 6,10 2,12 C4,16 8,16 10,16 M10,14 C10,14 15,8 18,10 C16,14 12,14 10,14" fill="#1e88e5" stroke="#1565c0" stroke-width="1.5" stroke-linejoin="round"/></svg>';
var SVG_PEG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="22" viewBox="0 0 24 28">' +
              '  <circle cx="12" cy="8.5" r="4.8" fill="#fb8c00" stroke="#fff" stroke-width="1.4"/>' +
              '  <path d="M6.5 14.5 C6.5 19 4.8 23.5 4.8 24.5 L19.2 24.5 C19.2 23.5 17.5 19 17.5 14.5 C17.5 12 15.2 10.5 12 10.5 C8.8 10.5 6.5 12 6.5 14.5 Z" ' +
              '        fill="#fb8c00" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>' +
              '  <path d="M9 14 L12 16 L15 14" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>' +
              '</svg>';
// Icon untuk Pegawai Wilayah Hutan Binaan - teal diamond/forest shape
var SVG_PEGB = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="22" viewBox="0 0 24 28">' +
               '  <circle cx="12" cy="8.5" r="4.8" fill="#00897b" stroke="#fff" stroke-width="1.4"/>' +
               '  <path d="M6.5 14.5 C6.5 19 4.8 23.5 4.8 24.5 L19.2 24.5 C19.2 23.5 17.5 19 17.5 14.5 C17.5 12 15.2 10.5 12 10.5 C8.8 10.5 6.5 12 6.5 14.5 Z" ' +
               '        fill="#00897b" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>' +
               '  <path d="M9 14 L12 17 L15 14" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
               '  <path d="M10 11 L12 9 L14 11" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>' +
               '</svg>';
var SVG_JUM_TEMPLATE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 20 24"><polygon points="10,2 18,14 14,14 16,20 4,20 6,14 2,14" fill="{COLOR}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><rect x="8" y="20" width="4" height="4" rx="1" fill="#5d4037"/></svg>';

function makeIcon(svg) {
  return L.divIcon({ html: svg, iconSize: [16, 20], iconAnchor: [8, 20], className: '' });
}
function makeJumIcon(color) {
  return makeIcon(SVG_JUM_TEMPLATE.replace('{COLOR}', color));
}
var ICONS = { 
  pjl: makeIcon(SVG_PJL), 
  per: makeIcon(SVG_PER), 
  peg: makeIcon(SVG_PEG), 
  pegb: L.divIcon({ html: SVG_PEGB, iconSize: [16, 22], iconAnchor: [8, 22], className: '' }),
  jum_unggulan: makeJumIcon('#8e24aa'), 
  jum_biasa: makeJumIcon('#1e88e5'), 
  jum_permanen: makeJumIcon('#8e24aa') 
};

/* 3. Helpers */
function safe(v) {
  if (v === null || v === undefined) return 'Data tidak tersedia';
  var s = String(v).trim();
  return s || 'Data tidak tersedia';
}
function toFloat(v) {
  if (v === null || v === undefined) return null;
  var s = String(v).trim();
  if (!s) return null;
  // Remove common wrapping quotes/backticks that may appear from spreadsheet strings
  s = s.replace(/^['"`\s]+|['"`\s]+$/g, '');
  // Also trim any leading/trailing spaces again
  s = s.trim();
  // Support comma decimal separator
  var n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

function getCDK(val) {
  if (!val) return '';
  var m = String(val).match(/CDK\s*(?:WILAYAH\s*)?([IVX]+)/i);
  return m ? 'CDK WILAYAH ' + m[1].toUpperCase() : '';
}
function getName(r) {
  if (!r) return 'Data tidak tersedia';
  var n = r['Nama Lengkap'] || r['Nama Kawasan'] || r['Nama Lokasi'] || r['Lokasi Penanaman'] || r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi'] || r['Unit Kerja'] || r['UNIT KERJA'] || '';
  return String(n).trim() || 'Data tidak tersedia';
}
function linkOrNA(url, label) {
  if (!url || !String(url).trim() || url === '-') return 'Data tidak tersedia';
  return '<a class="doc-link" href="' + url + '" target="_blank">' + (label || 'Lihat Dokumen') + '</a>';
}
function coordText(lat, lng) {
  if (lat && lng) return Number(lat).toFixed(5) + ', ' + Number(lng).toFixed(5);
  return 'Data tidak tersedia';
}
function mapsLink(lat, lng) {
  return '<a class="pop-link" href="https://www.google.com/maps?q=' + lat + ',' + lng + '" target="_blank">&#128205; Buka Google Maps</a>';
}

/**
 * Normalizes any Google Drive or other image URL into a directly embeddable format.
 * Handles: /file/d/ID/view, /uc?id=..., /open?id=..., thumbnail links.
 */
function normalizeImageUrl(url) {
  if (!url) return '';
  url = String(url).trim();

  // Normalize Google Drive file URLs to a direct embeddable thumbnail URL.
  var match = null;
  match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1200';
  match = url.match(/drive\.google\.com\/uc[^?]*\?.*?id=([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1200';
  match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1200';
  match = url.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1200';

  return url;
}

/**
 * Fallback handler for Drive image URLs that fail to load.
 * Tries the alternate Drive embed format once before giving up.
 */
function handleDriveImageError(img) {
  if (!img || img.dataset.driveFallback === '1') return;
  var src = String(img.src || '');
  var driveId = null;
  var m = src.match(/drive\.google\.com\/(?:uc\?export=view|thumbnail\?id=)(?:.*?id=)?([a-zA-Z0-9_-]+)/);
  if (m) driveId = m[1];
  if (!driveId) {
    m = src.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) driveId = m[1];
  }
  if (!driveId) {
    m = src.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (m) driveId = m[1];
  }
  if (!driveId) return;

  img.dataset.driveFallback = '1';
  if (src.indexOf('thumbnail?id=') !== -1) {
    img.src = 'https://drive.google.com/uc?export=view&id=' + driveId;
  } else {
    img.src = 'https://drive.google.com/thumbnail?id=' + driveId + '&sz=w1200';
  }
}

function getCoord(r) {
  if (!r || typeof r !== 'object') return null;
  var LK = ['latitude','Latitude','lat','Lat','Titik Koordinat (Y)','Titik Koordinat Penanaman (Y)','Titik Koordinat Persemaian (Y)','Koordinat Y','LATITUDE','LAT','y','Y'];
  var LG = ['longitude','Longitude','lng','Lng','lon','Lon','Titik Koordinat (x)','Titik Koordinat (X)','Titik Koordinat Penanaman (X)','Titik Koordinat Persemaian (X)','Koordinat X','LONGITUDE','LNG','LON','x','X'];
  var lat = null, lng = null;
  for (var i = 0; i < LK.length; i++) { var v = toFloat(r[LK[i]]); if (v !== null) { lat = v; break; } }
  for (var j = 0; j < LG.length; j++) { var w = toFloat(r[LG[j]]); if (w !== null) { lng = w; break; } }
  function ok(la, lo) { return la !== null && lo !== null && la > -8 && la < -5.5 && lo > 105.5 && lo < 109.5; }
  if (ok(lat, lng)) return { lat: lat, lng: lng };
  if (ok(lng, lat)) return { lat: lng, lng: lat };
  return null;
}



function getKab(lat, lng) {
  if (!GEO || !GEO.features) return '';
  try {
    var pt = turf.point([lng, lat]);
    for (var i = 0; i < GEO.features.length; i++) {
      var f = GEO.features[i];
      if (!f || !f.geometry) continue;
      if (turf.booleanPointInPolygon(pt, f)) {
        var p = f.properties || {};
        return p.KAB_KOTA || p.KABKOTA || p.NAME_2 || p.WADMKK || '';
      }
    }
  } catch (e) {}
  return '';
}

fetch('Jawa Barattt.geojson')
  .then(res => res.json())
  .then(data => {
    GEO = data;

    // tampilkan ke peta (opsional tapi penting)
    L.geoJSON(GEO, {
      style: {
        color: "#2e7d32",
        weight: 1,
        fillOpacity: 0.1
      }
    }).addTo(mapObj);

    console.log("GeoJSON berhasil dimuat");
  })
  .catch(err => {
    console.error("Gagal load GeoJSON:", err);
  });


/* ═══════════════════════════════════════════════════════════════
   PWA INTEGRATION — Auto-Update + Install Prompt
   ═══════════════════════════════════════════════════════════════ */

// ── Toast notifikasi update ─────────────────────────────────────
function showUpdateToast(onReload) {
  // Hapus toast lama jika ada
  const old = document.getElementById('pwa-update-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'pwa-update-toast';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="pwa-toast-content">
      <span class="pwa-toast-icon">🔄</span>
      <div class="pwa-toast-text">
        <strong>Pembaruan Tersedia!</strong>
        <small>Versi terbaru GeoHutan siap digunakan.</small>
      </div>
      <button id="pwa-reload-btn" class="pwa-toast-btn pwa-btn-primary">Perbarui Sekarang</button>
      <button id="pwa-dismiss-btn" class="pwa-toast-btn pwa-btn-secondary" title="Tutup">✕</button>
    </div>
  `;

  // Inject style jika belum ada
  if (!document.getElementById('pwa-toast-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-toast-style';
    style.textContent = `
      #pwa-update-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(120px);
        z-index: 99999;
        background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
        color: #fff;
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(46,125,50,0.4);
        padding: 0;
        min-width: 320px;
        max-width: 92vw;
        transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
        opacity: 0;
        border: 1px solid rgba(255,255,255,0.15);
      }
      #pwa-update-toast.visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      .pwa-toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
      }
      .pwa-toast-icon { font-size: 22px; flex-shrink: 0; }
      .pwa-toast-text { flex: 1; line-height: 1.3; }
      .pwa-toast-text strong { display: block; font-size: 13.5px; }
      .pwa-toast-text small { font-size: 11.5px; opacity: 0.85; }
      .pwa-toast-btn {
        border: none;
        border-radius: 8px;
        padding: 7px 14px;
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.2s, transform 0.1s;
        flex-shrink: 0;
      }
      .pwa-toast-btn:active { transform: scale(0.96); }
      .pwa-btn-primary {
        background: #fff;
        color: #1b5e20;
      }
      .pwa-btn-primary:hover { background: #e8f5e9; }
      .pwa-btn-secondary {
        background: rgba(255,255,255,0.15);
        color: #fff;
        padding: 7px 10px;
      }
      .pwa-btn-secondary:hover { background: rgba(255,255,255,0.25); }

      /* Toast install PWA */
      #pwa-install-toast {
        position: fixed;
        bottom: 24px;
        right: 20px;
        z-index: 99998;
        background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
        color: #fff;
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        padding: 14px 16px;
        min-width: 260px;
        max-width: 88vw;
        transform: translateY(120px);
        opacity: 0;
        transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
        border: 1px solid rgba(255,255,255,0.15);
      }
      #pwa-install-toast.visible {
        transform: translateY(0);
        opacity: 1;
      }
      .pwa-install-content { display: flex; align-items: center; gap: 10px; }
      .pwa-install-icon { font-size: 24px; }
      .pwa-install-text { flex: 1; line-height: 1.3; }
      .pwa-install-text strong { display: block; font-size: 13.5px; }
      .pwa-install-text small { font-size: 11px; opacity: 0.85; }
      .pwa-install-actions { display: flex; gap: 6px; margin-top: 10px; justify-content: flex-end; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  // Trigger animasi masuk
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });

  document.getElementById('pwa-reload-btn').addEventListener('click', () => {
    toast.classList.remove('visible');
    setTimeout(() => {
      if (typeof onReload === 'function') onReload();
    }, 300);
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  });

  // Auto-dismiss setelah 30 detik
  setTimeout(() => {
    if (document.getElementById('pwa-update-toast')) {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }
  }, 30000);
}

// ── Toast install PWA (muncul otomatis saat browser siap) ───────
function showInstallToast(onInstall, onDismiss) {
  const old = document.getElementById('pwa-install-toast');
  if (old) return; // sudah tampil

  const toast = document.createElement('div');
  toast.id = 'pwa-install-toast';
  toast.setAttribute('role', 'dialog');
  toast.setAttribute('aria-label', 'Instal GeoHutan sebagai aplikasi');
  toast.innerHTML = `
    <div class="pwa-install-content">
      <span class="pwa-install-icon">📲</span>
      <div class="pwa-install-text">
        <strong>Instal GeoHutan</strong>
        <small>Tambahkan ke layar utama untuk akses lebih cepat & offline</small>
      </div>
    </div>
    <div class="pwa-install-actions">
      <button id="pwa-install-dismiss" class="pwa-toast-btn pwa-btn-secondary">Nanti</button>
      <button id="pwa-install-confirm" class="pwa-toast-btn pwa-btn-primary" style="background:#fff;color:#0d47a1;">Instal</button>
    </div>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });

  document.getElementById('pwa-install-confirm').addEventListener('click', () => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.remove(); if (typeof onInstall === 'function') onInstall(); }, 300);
  });

  document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.remove(); if (typeof onDismiss === 'function') onDismiss(); }, 300);
    // Tunda tampil lagi 3 hari
    localStorage.setItem('pwa_install_dismiss_ts', Date.now().toString());
  });
}

// ── Registrasi Service Worker ───────────────────────────────────
let deferredPrompt = null;
let swRegistration  = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async function () {
    try {
      swRegistration = await navigator.serviceWorker.register('service-worker.js', {
        updateViaCache: 'none'   // Paksa browser selalu cek SW terbaru dari server
      });
      console.log('[PWA] Service Worker terdaftar, scope:', swRegistration.scope);

      // Cek update saat halaman load & setiap 60 detik
      swRegistration.update().catch(() => {});
      setInterval(() => swRegistration.update().catch(() => {}), 60 * 1000);

      // SW baru sedang menunggu → tawarkan update
      if (swRegistration.waiting) {
        console.log('[PWA] SW baru sudah menunggu aktivasi');
        showUpdateToast(() => {
          swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
      }

      // SW baru ditemukan saat install
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        if (!newWorker) return;
        console.log('[PWA] SW baru sedang diinstal...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] SW baru siap — tampilkan notifikasi update');
            showUpdateToast(() => {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            });
          }
        });
      });

      // ⚡ Terima sinyal dari SW bahwa versi baru sudah aktif → reload
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('[PWA] SW versi baru aktif:', event.data.version, '— reload halaman');
          window.location.reload(true);
        }
      });

      // Reload otomatis saat SW controller berganti (tab lama)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] Controller berubah — reload halaman');
          window.location.reload(true);
        }
      });

    } catch (err) {
      console.warn('[PWA] Registrasi Service Worker gagal:', err);
    }
  });
}

// ── Install Prompt (Android Chrome & kompatibel) ────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] beforeinstallprompt ditangkap — siap menampilkan prompt instal');

  // Sembunyikan tombol install di UI (pakai toast kita sendiri)
  const installBtn = document.getElementById('btn-install-pwa');
  if (installBtn) installBtn.style.display = 'none';

  // Cek apakah user pernah dismiss (tunda 3 hari)
  const dismissTs  = parseInt(localStorage.getItem('pwa_install_dismiss_ts') || '0');
  const threeDays  = 3 * 24 * 60 * 60 * 1000;
  const shouldShow = Date.now() - dismissTs > threeDays;

  if (shouldShow && !window.matchMedia('(display-mode: standalone)').matches) {
    // Tunda sedikit agar halaman selesai render
    setTimeout(() => {
      showInstallToast(
        // onInstall
        () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(choice => {
              console.log('[PWA] Pilihan user:', choice.outcome);
              deferredPrompt = null;
            });
          }
        },
        // onDismiss
        () => { console.log('[PWA] User menunda instalasi'); }
      );
    }, 3000);
  }
});

// ── Tombol install manual di UI ─────────────────────────────────
window.addEventListener('load', () => {
  const installBtn = document.getElementById('btn-install-pwa');
  if (!installBtn) return;

  // Sembunyikan jika sudah terinstal sebagai standalone
  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  ) {
    installBtn.style.display = 'none';
    return;
  }

  installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') {
          installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      });
    } else {
      // iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert(
          '📲 Untuk pengguna iOS:\n' +
          'Ketuk ikon "Bagikan" (kotak dengan panah ke atas) di bawah browser,\n' +
          'lalu pilih "Tambahkan ke Layar Utama".'
        );
      } else {
        alert(
          '📲 Untuk menginstal GeoHutan:\n' +
          'Buka menu browser (⋮ titik tiga di pojok kanan atas),\n' +
          'lalu pilih "Instal Aplikasi" atau "Tambah ke Layar Utama".'
        );
      }
    }
  });
});

// ── Sembunyikan tombol install setelah terpasang ────────────────
window.addEventListener('appinstalled', () => {
  console.log('[PWA] GeoHutan berhasil diinstal!');
  const installBtn = document.getElementById('btn-install-pwa');
  if (installBtn) installBtn.style.display = 'none';
  const installToast = document.getElementById('pwa-install-toast');
  if (installToast) installToast.remove();
  deferredPrompt = null;
});
