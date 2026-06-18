/* ═══ GeoHutan Jabar – Core ═══ */

/* 0. Globals */
var mapObj, GEO = null, LOADED = 0, TOTAL = 20, CHARTS = {}, RTIMER = null;
var DATA = { pjl: [], persemaian: [], pegawai: [], jumat: [] };
var FILTER = { cdk: [], pegawaiUnit: [], kab: [], status: [], kawasan: [], jabatan: [], nama_pegawai: [], penyuluh: [], kategori_lojuna: [] };
var LAYER_VISIBLE = { pjl: true, per: true, peg: true, jum: true };
var AUTOPOLY_ENABLED = true;
var LAYERS = {}; // Will hold either LayerGroup or MarkerClusterGroup
var BASEMAPS = {};
var CURRENT_BASEMAP = 'satellite';
var CLUSTER_ENABLED = true;
var DYNAMIC_SOURCES = [];

var POP_COLOR = { pjl: '#43a047', per: '#1e88e5', peg: '#fb8c00', jum: '#8e24aa' };
var POP_LABEL = {
  pjl: 'Petugas Jaga Leuweung',
  per: 'Lokasi Persemaian Jaga Leuweung',
  peg: 'Pegawai Dinas Kehutanan',
  jum: 'Lokasi Permanen Jum\'at Menanam'
};

/* 1. Map Init */
try {
  BASEMAPS = {
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 }),
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
  if (v === null || v === undefined || v === '') return null;
  var n = parseFloat(String(v).trim().replace(',', '.'));
  return isNaN(n) ? null : n;
}
function getCDK(val) {
  if (!val) return '';
  var m = String(val).match(/CDK\s*(?:WILAYAH\s*)?([IVX]+)/i);
  return m ? 'CDK WILAYAH ' + m[1].toUpperCase() : '';
}
function getName(r) {
  if (!r) return 'Data tidak tersedia';
  var n = r['Nama Kawasan'] || r['Nama Lokasi'] || r['Lokasi Penanaman'] || r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi'] || r['Unit Kerja'] || r['UNIT KERJA'] || '';
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
