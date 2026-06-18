/* ═══ GeoHutan Jabar – Features ═══ */
/** URL Web App Google Apps Script */
var GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCdFIZ3y9BbBiRHJItturR5cSt2RvoQKEbePXXhogpusq_8oID6v6pN654k85sI1kb/exec";

/* UI INTERACTIONS */
window.handleDriveImageError = function(img) {
  if (img.dataset.retried === "1") {
    img.style.display = 'none'; // Give up after 1 retry
    return;
  }
  img.dataset.retried = "1";
  var url = img.src;
  var match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match) {
    // Fallback to thumbnail API if direct link fails
    img.src = 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1000';
  } else {
    img.style.display = 'none';
  }
};

setInterval(function() {
  var d = new Date();
  var h = String(d.getHours()).padStart(2,'0');
  var m = String(d.getMinutes()).padStart(2,'0');
  var s = String(d.getSeconds()).padStart(2,'0');
  var el = document.getElementById('clock');
  if(el) el.textContent = h + ':' + m + ':' + s;
}, 1000);

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function toggleLayer(type) {
  if (!LAYER_VISIBLE.hasOwnProperty(type)) return;
  LAYER_VISIBLE[type] = !LAYER_VISIBLE[type];
  var el = document.getElementById('leg-' + type);
  if (el) { if (LAYER_VISIBLE[type]) el.classList.remove('leg-hidden'); else el.classList.add('leg-hidden'); }
  schedRender();
}

function toggleAutoPoly() {
  AUTOPOLY_ENABLED = !AUTOPOLY_ENABLED;
  var el = document.getElementById('leg-autopoly');
  if (el) { if (AUTOPOLY_ENABLED) el.classList.remove('leg-hidden'); else el.classList.add('leg-hidden'); }
  schedRender();
}

var HEATMAP_ENABLED = false;
var HEATMAP_LAYER = null;

function changeBasemap(style) {
  mapObj.removeLayer(BASEMAPS[CURRENT_BASEMAP]);
  BASEMAPS[style].addTo(mapObj);
  CURRENT_BASEMAP = style;
  showToast('Basemap diubah ke ' + style);
}

function toggleClustering() {
  CLUSTER_ENABLED = document.getElementById('toggle-cluster').checked;
  schedRender();
  showToast('Clustering ' + (CLUSTER_ENABLED ? 'diaktifkan' : 'dinonaktifkan'));
}

function toggleHeatmap() {
  HEATMAP_ENABLED = document.getElementById('toggle-heatmap').checked;
  schedRender();
  showToast('Heatmap ' + (HEATMAP_ENABLED ? 'diaktifkan' : 'dinonaktifkan'));
}

/* Modals & Drawer */
function openExportModal() { document.getElementById('export-modal').classList.add('open'); }
function closeExportModal() { document.getElementById('export-modal').classList.remove('open'); }

/* KMZ / CSV Local File Import */
function importLocalFile() {
  var fileInput = document.getElementById('local-file-import');
  if (!fileInput.files.length) { showToast('Silakan pilih file terlebih dahulu!'); return; }
  var file = fileInput.files[0];
  var type = document.getElementById('new-source-type').value;
  var ext = file.name.split('.').pop().toLowerCase();
  
  if (ext === 'csv') {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: function(res) {
        var rows = res.data.filter(r => r._lat || r.Lat || r.Latitude || r.Y || r.y || r.koordinat || r.Koordinat || getCoord(r));
        if (rows.length === 0) { showToast('Tidak ada data koordinat ditemukan di CSV'); return; }
        rows.forEach(r => {
          var c = getCoord(r);
          if (c) { r._lat = c.lat; r._lng = c.lng; r._kab = getKab(c.lat, c.lng); }
        });
        DATA[type] = DATA[type].concat(rows);
        fillDropdown(); schedRender();
        showToast('Berhasil impor ' + rows.length + ' data CSV ke ' + POP_LABEL[type]);
        closeSourceModal();
      }
    });
  } else if (ext === 'kmz' || ext === 'kml') {
    if (typeof L.kmzLayer === 'undefined') { showToast('Library KMZ belum termuat!'); return; }
    var kmzParser = L.kmzLayer().on('load', function(e) {
      var layer = e.layer;
      layer.addTo(mapObj);
      try { mapObj.fitBounds(layer.getBounds()); } catch(ex){}
      showToast('Berhasil memuat ' + file.name);
      closeSourceModal();
    });
    
    var reader = new FileReader();
    reader.onload = function(e) {
      if (ext === 'kmz') {
        kmzParser.parse(e.target.result, { name: file.name, icons: {} });
      } else {
        kmzParser.parse(e.target.result, { name: file.name, icons: {} });
      }
    };
    if (ext === 'kmz') { reader.readAsArrayBuffer(file); } else { reader.readAsText(file); }
  } else {
    showToast('Format file tidak didukung! Gunakan .csv, .kml, atau .kmz');
  }
}
function closeTableModal() { document.getElementById('table-modal').classList.remove('open'); }
function openSourceModal() { document.getElementById('source-modal').classList.add('open'); renderSourceList(); }
function closeSourceModal() { document.getElementById('source-modal').classList.remove('open'); }
function closeGlobalSearch() { document.getElementById('global-search-results').classList.remove('open'); }
function focusGlobalSearch() { var el = document.getElementById('global-search-input'); if(el) el.focus(); }
function coordText(y, x) { return y && x ? y + ', ' + x : 'Data tidak tersedia'; }
function mapsLink(lat, lng) { return '<a href="https://www.google.com/maps?q='+lat+','+lng+'" target="_blank" class="btn-icon" style="justify-content:center; padding:8px;">Buka di Google Maps</a>'; }

/* Drawer */
function openDrawer(type, r) {
  var dr = document.getElementById('detail-drawer');
  if (dr) dr.classList.remove('minimized');
  var minBtn = document.getElementById('drawer-min-btn');
  if (minBtn) minBtn.innerHTML = '&minus;';

  var t = document.getElementById('drawer-title');
  var c = document.getElementById('drawer-content');
  if (t) t.textContent = POP_LABEL[type] || 'Detail Informasi';

  var cx = r._lng, cy = r._lat;
  var lat = cy, lng = cx;
  var config = [];

  if (type === 'pjl') {
    var cPenanaman = coordText(toFloat(r['Titik Koordinat Penanaman (Y)']), toFloat(r['Titik Koordinat Penanaman (X)']));
    var cPersemaian = coordText(toFloat(r['Titik Koordinat Persemaian (Y)']), toFloat(r['Titik Koordinat Persemaian (X)']));
    config = [
      ['Unit Kerja', r['Unit Kerja']],
      ['Nama Lengkap', r['Nama Lengkap'] || r['Nama Petugas'] || r['Nama']],
      ['NIK', r['NIK']],
      ['Usia', r['Usia']],
      ['Alamat', r['Alamat']],
      ['No Tlp', r['No Tlp']],
      ['Kawasan', r['Kawasan Leuweung/ Gunung']],
      ['Koordinat Penanaman', cPenanaman],
      ['Koordinat Persemaian', cPersemaian],
      ['Pemilik Lahan', r['Pemangku Penanaman/ Pemilik Lahan'] || r['Pemangku Penanaman/Pemilik Lahan'] || r['Pemilik Lahan']],
      ['Wilayah Binaan Kuncen', r['Wilayah Binaan Kuncen']],
      ['Wilayah Binaan JL', r['Wilayah Binaan Jaga Leuweung']],
      ['Penyuluh', r['Penyuluh Kehutanan']],
      ['PEH', r['Pengendali Ekosistem Hutan (PEH)'] || r['PEH']],
      ['Link BA', linkOrNA(r['Upload Link BA Jaga Leuweung (Validasi, surat pengantar desa, dll.)'] || r['Upload Link BA Jaga Leuweung'] || r['Link BA'])],
      ['Link SK', linkOrNA(r['Upload Link SK Penetapan / Penerima Manfaat Jaga Leuweung'] || r['Upload Link SK Penetapan/Penerima Manfaat'] || r['Link SK'])]
    ];
  } else if (type === 'per' || type === 'persemaian') {
    config = [
      ['Unit Kerja', r['Unit Kerja']],
      ['Kecamatan', r['Kecamatan']],
      ['Desa', r['Desa/ Kelurahan'] || r['Desa/Kelurahan'] || r['Desa']],
      ['Blok', r['Blok']],
      ['Nama Petugas', r['Nama Personil Jaga leuweung'] || r['Nama Personil Jaga Leuweung'] || r['Nama']],
      ['Status', r['Status Persemaian']],
      ['Tahapan', r['Tahapan Kegiatan'] || r['Tahapan']],
      ['Luas (Ha)', r['Luas (Ha)'] || r['Luas']],
      ['Target Bibit', r['Target Bibit']],
      ['Realisasi', r['Realisasi Bibit'] || r['Realisasi']],
      ['Koordinat', coordText(lat, lng)],
      ['Keterangan', r['Keterangan']]
    ];
  } else if (type === 'peg' || type === 'pegawai') {
    config = [
      ['Nama', r['Nama'] || r['NAMA']],
      ['Unit Kerja', r['Unit Kerja'] || r['UNIT KERJA']],
      ['Jabatan', r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN']],
      ['Alamat', r['Alamat'] || r['ALAMAT']],
      ['Koordinat', coordText(lat, lng)]
    ];
  } else if (type === 'jum' || type === 'jumat') {
    var cxx = toFloat(r['Titik Koordinat (x)'] || r['Titik Koordinat (X)'] || r['Titik Koordinat Penanaman (X)']); 
    var cyy = toFloat(r['Titik Koordinat (Y)'] || r['Titik Koordinat Penanaman (Y)']);
    var kec = r['Kecamatan'] || r['Kecamatan '] || r['KECAMATAN'] || '';
    var desa = r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || r['DESA'] || '';
    var name = getName(r);
    config = [
      ['Nama Lokasi', name],
      ['Kategori Lojuna', r['Kategori Lojuna']],
      ['Unit Kerja', r['Unit Kerja']],
      ['Kabupaten/Kota', r['Kabupaten/Kota'] || r._kab],
      ['Kecamatan', kec],
      ['Desa', desa],
      ['Blok', r['Blok']],
      ['DAS', r['DAS']],
      ['Sub DAS', r['Sub DAS']],
      ['Koordinat', coordText(cyy, cxx)],
      ['Luas (Ha)', r['Luas Rencana Penanaman  (Ha)'] || r['Luas Rencana Penanaman (Ha)'] || r['Luas']],
      ['Panjang (Km)', r['Panjang Rencana Penanaman (Km)'] || r['Panjang']],
      ['Keterangan', r['Keterangan']]
    ];
    // Photo gallery will be appended after main config render
    var _jumPhotoRow = r; // keep reference for gallery injection
  } else {
    Object.keys(r).forEach(k => { if(!k.startsWith('_')) config.push([k, r[k]]); });
  }

  var html = '';
  config.forEach(function(item) {
    var v = item[1] || 'Data tidak tersedia';
    if (String(v).indexOf('<a') === -1 && item[0].toLowerCase().indexOf('link') > -1 && String(v).indexOf('http') > -1) {
      v = '<a href="'+v+'" target="_blank">Buka Tautan</a>';
    }
    html += '<div class="detail-item"><div class="detail-lbl">'+item[0]+'</div><div class="detail-val">'+v+'</div></div>';
  });
  if (cy && cx) html += '<div style="margin-top:15px">' + mapsLink(cy, cx) + '</div>';

  // Inject photo gallery for Jumat Menanam
  if ((type === 'jum' || type === 'jumat') && typeof _jumPhotoRow !== 'undefined') {
    html += buildJumPhotoSection(_jumPhotoRow);
  }

  if (c) c.innerHTML = html;
  
  // Init gallery state after DOM injection
  if ((type === 'jum' || type === 'jumat') && typeof _jumPhotoRow !== 'undefined') {
    JUM_GALLERY.row = _jumPhotoRow;
    JUM_GALLERY.year = getCurrentPhotoYear(_jumPhotoRow);
    JUM_GALLERY.idx = 0;
    refreshGalleryForYear(JUM_GALLERY.year);
  }
  
  if (dr) dr.classList.add('open');
}
function closeDrawer() { 
  var dr = document.getElementById('detail-drawer');
  if (dr) dr.classList.remove('open'); 
  if (HIGHLIGHT_LAYER && typeof mapObj !== 'undefined') mapObj.removeLayer(HIGHLIGHT_LAYER); 
  if (BUFFER_LAYERS) BUFFER_LAYERS.clearLayers();
}
function toggleMinimizeDrawer() {
  var dr = document.getElementById('detail-drawer');
  if (dr) {
    dr.classList.toggle('minimized');
    var btn = document.getElementById('drawer-min-btn');
    if (dr.classList.contains('minimized')) {
      btn.innerHTML = '&#9633;';
    } else {
      btn.innerHTML = '&minus;';
    }
  }
}

/* Modals */
function showToast(msg) {
  var toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  var cont = document.getElementById('toast-container');
  if (cont) cont.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('toast-hide');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

var HIGHLIGHT_LAYER = null;
var BUFFER_LAYERS = null;
var LINK_POLYGON = null;

function highlightMarker(lat, lng, type) {
  if (HIGHLIGHT_LAYER) mapObj.removeLayer(HIGHLIGHT_LAYER);
  HIGHLIGHT_LAYER = L.circleMarker([lat, lng], {
    radius: 30, color: '#fbc02d', weight: 4, fill: false
  }).addTo(mapObj);

  if (!BUFFER_LAYERS) {
    BUFFER_LAYERS = L.layerGroup().addTo(mapObj);
  }
  BUFFER_LAYERS.clearLayers();

  if (BUFFER_ENABLED && (type === 'pjl' || type === 'per' || type === 'persemaian' || type === 'jum' || type === 'jumat')) {
    [10000, 20000, 30000].forEach(function(radius, i) {
      var colors = ['red', 'orange', 'yellow'];
      var circle = L.circle([lat, lng], {
        radius: radius,
        color: colors[i],
        fillOpacity: 0.05,
        weight: 1
      }).addTo(BUFFER_LAYERS);
      circle.bindTooltip((radius/1000) + ' km', { permanent: true, direction: 'top', opacity: 0.7 });
    });
  }
}

/* Keyboard Shortcuts */
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); focusGlobalSearch(); }
  if (e.key === 'Escape') { 
    if (document.getElementById('photo-lightbox').classList.contains('open')) { closePhotoLightbox(); return; }
    closeGlobalSearch(); closeTableModal(); closeSourceModal(); closeExportModal(); closeDrawer(); 
  }
  if (document.getElementById('photo-lightbox').classList.contains('open')) {
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
  }
});

/* Global Search (Local + Nominatim) */
var searchTimeout;
document.getElementById('global-search-input').addEventListener('input', function(e) {
  var q = e.target.value.trim();
  var results = document.getElementById('global-search-results');
  var clearBtn = document.getElementById('global-search-clear');
  
  if (q.length > 0) clearBtn.classList.add('visible');
  else clearBtn.classList.remove('visible');
  
  if (!q) { results.classList.remove('open'); return; }
  
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(function() { performGlobalSearch(q, results); }, 400);
});

document.getElementById('global-search-input').addEventListener('focus', function(e) {
  if (e.target.value.trim().length > 0) document.getElementById('global-search-results').classList.add('open');
});

document.addEventListener('click', function(e) {
  var container = document.querySelector('.global-search-container');
  if (container && !container.contains(e.target)) closeGlobalSearch();
});

document.getElementById('global-search-clear').addEventListener('click', function() {
  var input = document.getElementById('global-search-input');
  input.value = '';
  this.classList.remove('visible');
  closeGlobalSearch();
  input.focus();
});

function parseCoordinate(q) {
  var parts = q.split(/[,;\s]+/);
  if (parts.length >= 2) {
    var lat = parseFloat(parts[0]); var lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng];
  }
  return null;
}

var TEMP_SEARCH_MARKER = null;
function flyToLocation(lat, lng, name) {
  closeGlobalSearch();
  mapObj.setView([lat, lng], 16);
  if (TEMP_SEARCH_MARKER) mapObj.removeLayer(TEMP_SEARCH_MARKER);
  TEMP_SEARCH_MARKER = L.marker([lat, lng]).addTo(mapObj);
  TEMP_SEARCH_MARKER.bindPopup('<div style="font-family:Inter;font-size:12px;"><b>Lokasi Pencarian</b><br>' + name + '</div>').openPopup();
}

function flyToLocalItem(t, idx) {
  var allData = [].concat(
    DATA.pjl.map(r=>({t:'pjl',r:r})), DATA.persemaian.map(r=>({t:'per',r:r})),
    DATA.pegawai.map(r=>({t:'peg',r:r})), DATA.jumat.map(r=>({t:'jum',r:r}))
  );
  var item = allData[idx];
  if (item && item.r) {
    closeGlobalSearch();
    mapObj.setView([item.r._lat, item.r._lng], 16);
    highlightMarker(item.r._lat, item.r._lng, item.t);
    openDrawer(item.t, item.r);
  }
}

function performGlobalSearch(q, resultsContainer) {
  var html = ''; var count = 0;
  var coord = parseCoordinate(q);
  if (coord) {
    count++;
    html += '<div class="search-res-item" onclick="flyToLocation('+coord[0]+', '+coord[1]+', \'Koordinat: '+coord[0]+', '+coord[1]+'\')">' +
            '<div class="search-res-title">Lompat ke Koordinat</div>' +
            '<div class="search-res-sub">'+coord[0]+', '+coord[1]+'</div>' +
            '<div class="search-res-source" style="background:#546e7a">Koordinat</div></div>';
  }
  
  var qLower = q.toLowerCase();
  var allData = [].concat(
    DATA.pjl.map(r=>({t:'pjl',r:r})), DATA.persemaian.map(r=>({t:'per',r:r})),
    DATA.pegawai.map(r=>({t:'peg',r:r})), DATA.jumat.map(r=>({t:'jum',r:r}))
  );
  
  for (var i = 0; i < allData.length; i++) {
    var item = allData[i]; var r = item.r;
    if (!r || !r._lat || !r._lng) continue;
    var name = safe(r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi'] || '');
    var unit = safe(r['Unit Kerja'] || r['UNIT KERJA']);
    var textSearch = (name + ' ' + unit + ' ' + (r._kab||'')).toLowerCase();
    
    if (textSearch.indexOf(qLower) > -1) {
      count++;
      html += '<div class="search-res-item" onclick="flyToLocalItem(\''+item.t+'\', '+i+')">' +
              '<div class="search-res-title">'+name+'</div>' +
              '<div class="search-res-sub">'+unit+'</div>' +
              '<div class="search-res-source" style="background:'+POP_COLOR[item.t]+'">'+POP_LABEL[item.t]+'</div></div>';
      if (count >= 5) break; 
    }
  }
  
  resultsContainer.innerHTML = html;
  resultsContainer.classList.add('open');
  
  if (count === 0) resultsContainer.innerHTML = '<div id="nom-loader" style="padding:15px;color:#888;text-align:center;font-size:12px;">Mencari lokasi di peta...</div>';
  else resultsContainer.innerHTML += '<div id="nom-loader" style="padding:10px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;">Mencari lokasi luar...</div>';
  
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&countrycodes=id&limit=5')
    .then(res => res.json())
    .then(data => {
      var loader = document.getElementById('nom-loader'); if (loader) loader.remove();
      if (data && data.length > 0) {
        var nomHtml = '';
        data.forEach(function(place) {
          nomHtml += '<div class="search-res-item" onclick="flyToLocation('+place.lat+', '+place.lon+', \''+place.display_name.replace(/'/g, "\\'")+'\')">' +
                     '<div class="search-res-title">'+place.name+'</div>' +
                     '<div class="search-res-sub">'+place.display_name+'</div>' +
                     '<div class="search-res-source nominatim">Peta Publik</div></div>';
        });
        if (count === 0) resultsContainer.innerHTML = nomHtml;
        else resultsContainer.innerHTML += nomHtml;
      } else if (count === 0) {
        resultsContainer.innerHTML = '<div style="padding:15px;color:#888;text-align:center;font-size:12px;">Tidak ada hasil ditemukan.</div>';
      }
    })
    .catch(e => {
      var loader = document.getElementById('nom-loader'); if (loader) loader.remove();
      if (count === 0) resultsContainer.innerHTML = '<div style="padding:15px;color:#888;text-align:center;font-size:12px;">Tidak ada hasil ditemukan.</div>';
    });
}

/* Filter */
function applyFilter() {
  var getVals = function(id) { 
    var val = $('#'+id).val(); 
    return (val && Array.isArray(val)) ? val : (val ? [val] : []); 
  };
  FILTER.cdk = getVals('f_cdk');
  FILTER.pegawaiUnit = getVals('f_pegawai');
  FILTER.kab = getVals('f_kab');
  FILTER.status = getVals('f_status');
  FILTER.kawasan = getVals('f_kawasan');
  FILTER.jabatan = getVals('f_jabatan');
  FILTER.nama_pegawai = getVals('f_nama_pegawai');
  FILTER.penyuluh = getVals('f_penyuluh');
  FILTER.kategori_lojuna = getVals('f_kategori_lojuna');
  schedRender();
}
function resetFilter() {
  FILTER = { cdk: [], pegawaiUnit: [], kab: [], status: [], kawasan: [], jabatan: [], nama_pegawai: [], penyuluh: [], kategori_lojuna: [] };
  ['f_cdk','f_pegawai','f_kab','f_status','f_kawasan','f_jabatan', 'f_nama_pegawai', 'f_penyuluh', 'f_kategori_lojuna'].forEach(function(id) {
    try { 
      var el = document.getElementById(id);
      if (el) {
        if (window.jQuery && $(el).hasClass('select2-hidden-accessible')) {
          $(el).val(null).trigger('change');
        } else {
          el.value = '';
        }
      }
    } catch(e) {}
  });
  schedRender();
}
function forceRefresh() { try { mapObj.invalidateSize(); } catch(e) {} schedRender(); showToast('Tampilan disegarkan'); }
function passFilter(r, type) {
  if (!r || typeof r !== 'object') return false;
  var cdk = getCDK(r['Unit Kerja'] || r['UNIT KERJA'] || ''); var unit = String(r['Unit Kerja'] || r['UNIT KERJA'] || '').trim(); var kab = String(r._kab || '');
  if (FILTER.cdk && FILTER.cdk.length > 0 && !FILTER.cdk.includes(cdk)) return false;
  if (FILTER.kab && FILTER.kab.length > 0 && !FILTER.kab.includes(kab)) return false;
  
  if (type === 'pegawai') {
    if (FILTER.pegawaiUnit && FILTER.pegawaiUnit.length > 0 && !FILTER.pegawaiUnit.includes(unit)) return false;
    var jabatan = String(r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN'] || '').trim();
    if (FILTER.jabatan && FILTER.jabatan.length > 0 && !FILTER.jabatan.includes(jabatan)) return false;
    var nama_peg = String(r['Nama'] || r['NAMA'] || '').trim();
    if (FILTER.nama_pegawai && FILTER.nama_pegawai.length > 0 && !FILTER.nama_pegawai.includes(nama_peg)) return false;
  }
  
  if (type === 'persemaian' && FILTER.status && FILTER.status.length > 0 && !FILTER.status.includes(String(r['Status Persemaian'] || '').trim())) return false;
  if (type === 'pjl') {
    if (FILTER.kawasan && FILTER.kawasan.length > 0 && !FILTER.kawasan.includes(String(r['Kawasan Leuweung/ Gunung'] || '').trim())) return false;
    if (FILTER.penyuluh && FILTER.penyuluh.length > 0 && !FILTER.penyuluh.includes(String(r['Penyuluh Kehutanan'] || '').trim())) return false;
  }
  if (type === 'jumat') {
    if (FILTER.kategori_lojuna && FILTER.kategori_lojuna.length > 0 && !FILTER.kategori_lojuna.includes(String(r['Kategori Lojuna'] || '').trim())) return false;
  }
  return true;
}

var BUFFER_ENABLED = false;
var BUFFER_LAYERS = null;
function toggleBuffer() {
  var el = document.getElementById('toggle-buffer');
  if (el) BUFFER_ENABLED = el.checked;
  if (!BUFFER_ENABLED && BUFFER_LAYERS) {
    BUFFER_LAYERS.clearLayers();
  } else if (BUFFER_ENABLED && HIGHLIGHT_LAYER) {
    // If we enable it while a point is already selected, redraw buffer
    // This is optional but good UX
  }
}

/* GeoJSON */
fetch('Jawa Barattt.geojson').then(res => res.json()).then(gj => {
  GEO = gj;
  try { L.geoJSON(gj, { style: { color: '#222222', weight: 1.5, fillOpacity: 0.02, fillColor: '#43a047', opacity: 0.8, dashArray: '' } }).addTo(mapObj); } catch(e) {}
  ['pjl','persemaian','pegawai','jumat'].forEach(function(t) {
    DATA[t].forEach(function(r) { if (r._lat && r._lng && !r._kab) r._kab = getKab(r._lat, r._lng); });
  });
  fillDropdown(); schedRender();
}).catch(e => console.warn('GeoJSON:', e));

/* CSV Loader */
function loadCSV(url, type) {
  try {
    Papa.parse(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: function(res) {
        var rows = Array.isArray(res.data) ? res.data : [];
        rows.forEach(function(r) {
          if (!r || typeof r !== 'object') return;
          var c = getCoord(r);
          if (c) { r._lat = c.lat; r._lng = c.lng; r._kab = getKab(c.lat, c.lng); } else { r._lat = null; r._lng = null; r._kab = ''; }
        });
        DATA[type] = DATA[type].concat(rows);
        onLoaded();
      },
      error: function() { onLoaded(); }
    });
  } catch(e) { onLoaded(); }
}
function onLoaded() {
  LOADED++;
  var pct = Math.min(Math.round(LOADED / TOTAL * 100), 100);
  var loaderText = document.getElementById('loader-text');
  if (loaderText) loaderText.textContent = 'Memuat GeoHutan Jabar... ' + pct + '%';
  if (LOADED >= TOTAL) {
    fillDropdown(); schedRender();
    setTimeout(function() { 
      var overlay = document.getElementById('loader-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.style.display = 'none'; }, 500);
      }
      showToast('Data berhasil dimuat sepenuhnya');
    }, 1000);
  }
}

/* Dropdown setup */
function fillDropdown() {
  var S = { cdk: new Set(), unit: new Set(), kab: new Set(), status: new Set(), kawasan: new Set(), jabatan: new Set(), nama_pegawai: new Set(), penyuluh: new Set(), kategori_lojuna: new Set() };
  ['pjl','persemaian','pegawai','jumat'].forEach(t => {
    DATA[t].forEach(r => {
      if(!r) return;
      var c = getCDK(r['Unit Kerja']); if(c) S.cdk.add(c);
      if(r._kab) S.kab.add(r._kab);
      if(t==='pjl') { 
        var kw=r['Kawasan Leuweung/ Gunung']; if(kw) S.kawasan.add(kw.trim()); 
        var py=r['Penyuluh Kehutanan']; if(py) S.penyuluh.add(py.trim());
      }
      if(t==='persemaian') { var st=r['Status Persemaian']; if(st) S.status.add(st.trim()); }
      if(t==='pegawai') { 
        var uk=r['Unit Kerja']||r['UNIT KERJA']; if(uk) S.unit.add(uk.trim()); 
        var jb=r['Nama Jabatan']||r['Jabatan']||r['JABATAN']; if(jb) S.jabatan.add(jb.trim());
        var nm=r['Nama']||r['NAMA']; if(nm) S.nama_pegawai.add(nm.trim());
      }
      if(t==='jumat') {
        var kl=r['Kategori Lojuna']; if(kl) S.kategori_lojuna.add(kl.trim());
      }
    });
  });
  S.kategori_lojuna.add('Lokasi Juna Unggulan');
  S.kategori_lojuna.add('Lokasi Juna Biasa');
  S.kategori_lojuna.add('Lokasi Juna Permanen');
  function pop(id, set, def) {
    var el = document.getElementById(id); if(!el) return;
    var cur = window.jQuery ? $(el).val() : null;
    
    if (window.jQuery && $(el).hasClass('select2-hidden-accessible')) {
      $(el).select2('destroy');
    }
    
    el.innerHTML = '';
    Array.from(set).sort().forEach(v => { var o=document.createElement('option'); o.value=v; o.textContent=v; el.appendChild(o); });
    
    if (window.jQuery && $.fn.select2) {
      function formatResult(state) {
        if (!state.id) return state.text;
        return $('<span><input type="checkbox" style="margin-right:8px; pointer-events:none;" ' + (state.selected ? 'checked' : '') + '/>' + state.text + '</span>');
      }
      $(el).select2({ 
        width: '100%', placeholder: def, allowClear: true, multiple: true,
        closeOnSelect: false, templateResult: formatResult
      });
      if(cur && cur.length) $(el).val(cur).trigger('change');
    }
  }
  pop('f_cdk', S.cdk, 'Semua CDK'); pop('f_pegawai', S.unit, 'Semua Unit'); pop('f_kab', S.kab, 'Semua Kab/Kota');
  pop('f_status', S.status, 'Semua Status'); pop('f_kawasan', S.kawasan, 'Semua Kawasan');
  pop('f_jabatan', S.jabatan, 'Semua Jabatan'); pop('f_nama_pegawai', S.nama_pegawai, 'Semua Nama Pegawai');
  pop('f_penyuluh', S.penyuluh, 'Semua Penyuluh'); pop('f_kategori_lojuna', S.kategori_lojuna, 'Semua Kategori');
}

/* Render Engine */
function schedRender() { clearTimeout(RTIMER); RTIMER = setTimeout(doRender, 100); }
function doRender() {
  var cnt = { pjl: 0, per: 0, peg: 0, jum: 0 };
  
  if (HEATMAP_LAYER) { mapObj.removeLayer(HEATMAP_LAYER); HEATMAP_LAYER = null; }
  var heatData = [];
  var pegJumPoints = [];
  var pegNames = [];
  var jumNames = [];
  var isFilterActive = Object.values(FILTER).some(arr => arr.length > 0);

  ['pjl', 'per', 'peg', 'jum'].forEach(type => {
    if(LAYERS[type]) mapObj.removeLayer(LAYERS[type]);
    if(CLUSTER_ENABLED && typeof L.markerClusterGroup !== 'undefined') {
      LAYERS[type] = L.markerClusterGroup({ disableClusteringAtZoom: 16, maxClusterRadius: 50 });
    } else {
      LAYERS[type] = L.layerGroup();
    }
  });

  function addMarkers(arr, type, defaultIcon) {
    if (!LAYER_VISIBLE[type]) return;
    arr.forEach(function(r) {
      if (!r || !passFilter(r, type === 'per' ? 'persemaian' : (type === 'jum' ? 'jumat' : (type === 'peg' ? 'pegawai' : type))) || !r._lat || !r._lng) return;
      cnt[type]++;
      if (HEATMAP_ENABLED) heatData.push([r._lat, r._lng, 1]);
      try {
        var name = getName(r);
        var icon = defaultIcon;
        if (type === 'jum') {
          var kat = String(r['Kategori Lojuna'] || '').trim();
          if (kat === 'Lokasi Juna Biasa') icon = ICONS.jum_biasa;
          else if (kat === 'Lokasi Juna Permanen') icon = ICONS.jum_permanen;
          else icon = ICONS.jum_unggulan;
        }
        var mk = L.marker([r._lat, r._lng], { icon: icon });
        mk.on('click', (function(capturedR, capturedType) { return function() {
          mapObj.setView([capturedR._lat, capturedR._lng], 16);
          highlightMarker(capturedR._lat, capturedR._lng, capturedType);
          openDrawer(capturedType, capturedR);
        }; })(r, type));
        if (name && name !== 'Data tidak tersedia') {
          var hoverHTML = name;
          if (type === 'jum') {
            // Build rich thumbnail tooltip for JUM markers
            var thumbYear = getCurrentPhotoYear(r);
            var thumbMerged = getMergedData(r, thumbYear);
            var thumbUrl = thumbMerged.photos.length > 0 ? thumbMerged.photos[0] : null;
            var desa = r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || r['DESA'] || '-';
            var kat2 = String(r['Kategori Lojuna'] || '').trim() || 'Lokasi Juna';
            var cdk = r['Unit Kerja'] || r._cdk || '-';
            var ket = r['Keterangan'] || '-';

            var infoHtml = '<div style="font-size:9px; color:#555; margin-top:6px; text-align:left; line-height:1.3; border-top:1px solid #eee; padding-top:4px;">' +
                           '<b>CDK:</b> ' + cdk + '<br>' +
                           '<b>Desa:</b> ' + desa + '<br>' +
                           '<div style="white-space:normal;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;"><b>Ket:</b> ' + ket + '</div>' +
                           '</div>';

            if (thumbUrl) {
              hoverHTML = '<div class="jum-tooltip-thumb">' +
                '<img src="' + thumbUrl + '" alt="foto" onerror="handleDriveImageError(this);" />' +
                '<div class="jum-tooltip-thumb-name">' + name + '</div>' +
                '<div class="jum-tooltip-thumb-year">&#128247; Foto ' + thumbYear + ' &bull; ' + kat2 + '</div>' +
                infoHtml +
                '</div>';
            } else {
              hoverHTML = '<div class="jum-tooltip-no-img">' +
                '<div style="font-weight:700;font-size:11px;margin-bottom:3px;">' + name + '</div>' +
                '<div style="font-size:10px;color:#8e24aa;font-weight:600;">' + kat2 + '</div>' +
                infoHtml +
                '</div>';
            }
          } else if (type === 'per') {
            var kec = r['Kecamatan'] || '-';
            var desa = r['Desa/ Kelurahan'] || r['Desa/Kelurahan'] || r['Desa'] || '-';
            var blok = r['Blok'] || '-';
            var namaPersonil = r['Nama Personil Jaga leuweung'] || r['Nama Personil Jaga Leuweung'] || r['Nama'] || '-';
            var statusPer = r['Status Persemaian'] || '-';
            var tahapan = r['Tahapan Kegiatan'] || r['Tahapan'] || '-';
            hoverHTML = '<div style="text-align:left; line-height:1.4;">' +
                        '<b>Kecamatan:</b> ' + kec + '<br>' +
                        '<b>Desa/Kelurahan:</b> ' + desa + '<br>' +
                        '<b>Blok:</b> ' + blok + '<br>' +
                        '<b>Nama Personil Jaga Leuweung:</b> ' + namaPersonil + '<br>' +
                        '<b>Status Persemaian:</b> ' + statusPer + '<br>' +
                        '<b>Tahapan Kegiatan:</b> ' + tahapan + '</div>';
          }
          mk.bindTooltip(hoverHTML, { className: 'marker-tooltip', direction: 'top', offset: [0, -8], opacity: 0.95 });
        }
        mk.addTo(LAYERS[type]);
        
        if (type === 'peg') { 
          var jabat = String(r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN'] || '').trim();
          var dispName = name + (jabat ? ' (' + jabat + ')' : '');
          pegJumPoints.push(turf.point([r._lng, r._lat])); 
          pegNames.push(dispName); 
        }
        if (type === 'jum') { pegJumPoints.push(turf.point([r._lng, r._lat])); jumNames.push(name); }
      } catch(e) {}
    });
    if(LAYER_VISIBLE[type]) LAYERS[type].addTo(mapObj);
  }

  addMarkers(DATA.pjl, 'pjl', ICONS.pjl);
  addMarkers(DATA.persemaian, 'per', ICONS.per);
  addMarkers(DATA.pegawai, 'peg', ICONS.peg);
  addMarkers(DATA.jumat, 'jum', null);

  if (HEATMAP_ENABLED && typeof L.heatLayer !== 'undefined') {
    HEATMAP_LAYER = L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 14 }).addTo(mapObj);
  }

  if (typeof LINK_POLYGON !== 'undefined' && LINK_POLYGON) { mapObj.removeLayer(LINK_POLYGON); LINK_POLYGON = null; }
  if (AUTOPOLY_ENABLED && isFilterActive && pegJumPoints.length >= 2 && typeof turf !== 'undefined') {
    var popupHTML = '<div style="font-family:Inter; font-size:12px;"><b>Area Filter Aktif</b><br>';
    popupHTML += '<div style="max-height:150px; overflow-y:auto; margin-top:5px; border-top:1px solid #ddd; padding-top:5px;">';
    if (jumNames.length > 0) popupHTML += '<b style="color:#8e24aa;">Lokasi Jum\'at Menanam:</b><br>' + [...new Set(jumNames)].join('<br>') + '<br><br>';
    if (pegNames.length > 0) popupHTML += '<b style="color:#fb8c00;">Pegawai:</b><br>' + [...new Set(pegNames)].join('<br>') + '</div></div>';
    
    var pts = turf.featureCollection(pegJumPoints);
    if (pegJumPoints.length >= 3) {
      try { 
        var hull = turf.convex(pts); 
        if (hull) LINK_POLYGON = L.geoJSON(hull, { style: { color: '#00acc1', weight: 2, fillOpacity: 0.1, dashArray: '5,5' } }).bindPopup(popupHTML).addTo(mapObj);
      } catch(e){}
    } else if (pegJumPoints.length === 2) {
      LINK_POLYGON = L.polyline([[pegJumPoints[0].geometry.coordinates[1], pegJumPoints[0].geometry.coordinates[0]], [pegJumPoints[1].geometry.coordinates[1], pegJumPoints[1].geometry.coordinates[0]]], { color: '#00acc1', weight: 2, dashArray: '5,5' }).bindPopup(popupHTML).addTo(mapObj);
    }
  }

  try {
    document.getElementById('cnt-pjl').textContent = cnt.pjl;
    document.getElementById('cnt-per').textContent = cnt.per;
    document.getElementById('cnt-peg').textContent = cnt.peg;
    document.getElementById('cnt-jum').textContent = cnt.jum;
  } catch(e) {}
  updateCharts(cnt);
}

/* Charts */
var CLRS = ['#43a047','#1e88e5','#fb8c00','#8e24aa','#e53935','#00acc1','#6d4c41','#546e7a'];
function killChart(id) { if (CHARTS[id]) { try { CHARTS[id].destroy(); } catch(e) {} CHARTS[id] = null; } }
function mkChart(id, cfg) { killChart(id); var el = document.getElementById(id); if (!el) return; try { CHARTS[id] = new Chart(el.getContext('2d'), cfg); } catch(e) {} }

function updateCharts(cnt) {
  if (typeof Chart === 'undefined') return;
  cnt = cnt || { pjl: 0, per: 0, peg: 0, jum: 0 };
  Chart.defaults.color = '#7f8c8d'; Chart.defaults.font.family = 'Inter';
  
  mkChart('c-layer', { type: 'bar', data: { labels: ['Petugas Jaga Leuweung','Lokasi Persemaian Jaga Leuweung','Pegawai Dinas Kehutanan','Lokasi Permanen Jum\'at Menanam'], datasets: [{ data: [cnt.pjl, cnt.per, cnt.peg, cnt.jum], backgroundColor: ['#43a047','#1e88e5','#fb8c00','#8e24aa'], borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: {display:false}, ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45 } }, y: { beginAtZero: true, grid: {color:'rgba(0,0,0,0.05)'}, ticks: { font: { size: 10 } } } } } });

  var sc = {};
  DATA.persemaian.forEach(function(r) { if (!r || !passFilter(r, 'persemaian')) return; var s = String(r['Status Persemaian'] || 'Tidak Diketahui').trim() || 'Tidak Diketahui'; sc[s] = (sc[s] || 0) + 1; });
  var sk = Object.keys(sc); if (!sk.length) { sk = ['(kosong)']; sc['(kosong)'] = 0; }
  mkChart('c-status', { type: 'doughnut', data: { labels: sk, datasets: [{ data: sk.map(k=>sc[k]), backgroundColor: CLRS.slice(0, Math.max(sk.length, 1)), borderWidth:2 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } } } } });

  var cc = {};
  DATA.pjl.forEach(function(r) { if (!r || !passFilter(r, 'pjl')) return; var c = getCDK(r['Unit Kerja']) || 'Lainnya'; cc[c] = (cc[c] || 0) + 1; });
  var ck = Object.keys(cc); if (!ck.length) { ck = ['(kosong)']; cc['(kosong)'] = 0; }
  mkChart('c-cdk', { type: 'bar', data: { labels: ck, datasets: [{ data: ck.map(k=>cc[k]), backgroundColor: '#43a047', borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: {color:'rgba(0,0,0,0.05)'}, ticks: { font: { size: 10 } } }, y: { grid: {display:false}, ticks: { font: { size: 9 } } } } } });
}

/* Data Table Modal rendering */
function renderTable() {
  var tbody = document.getElementById('data-table-body');
  tbody.innerHTML = '';
  var type = document.getElementById('table-layer-select').value;
  var q = document.getElementById('table-search').value.toLowerCase();
  
  var allData = [];
  if(type === 'all' || type === 'pjl') allData = allData.concat(DATA.pjl.map(r=>({t:'pjl',r:r})));
  if(type === 'all' || type === 'persemaian') allData = allData.concat(DATA.persemaian.map(r=>({t:'per',r:r})));
  if(type === 'all' || type === 'pegawai') allData = allData.concat(DATA.pegawai.map(r=>({t:'peg',r:r})));
  if(type === 'all' || type === 'jumat') allData = allData.concat(DATA.jumat.map(r=>({t:'jum',r:r})));

  var count = 0;
  var html = '';
  for(var i=0; i<allData.length; i++) {
    if(count > 200) break; // limit render for performance
    var item = allData[i]; var r = item.r;
    var name = safe(r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi'] || '');
    var unit = safe(r['Unit Kerja'] || r['UNIT KERJA']);
    var kab = safe(r._kab);
    
    if(q && (name+' '+unit+' '+kab).toLowerCase().indexOf(q) === -1) continue;
    
    count++;
    var aksi = r._lat && r._lng ? '<button style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff;" onclick="closeTableModal();mapObj.setView(['+r._lat+','+r._lng+'], 16);openDrawer(\''+item.t+'\', '+JSON.stringify(r).replace(/"/g, '&quot;')+')">Lihat</button>' : '-';
    html += '<tr><td>'+POP_LABEL[item.t]+'</td><td>'+name+'</td><td>'+unit+'</td><td>'+kab+'</td><td>'+aksi+'</td></tr>';
  }
  if(count === 0) html = '<tr><td colspan="5" style="text-align:center;padding:20px;">Tidak ada data</td></tr>';
  tbody.innerHTML = html;
}
function filterTable() { renderTable(); }

/* Source Management */
function renderSourceList() {
  var list = document.getElementById('source-list');
  var html = '';
  DYNAMIC_SOURCES.forEach((s, idx) => {
    html += '<div class="source-item"><span><b>'+s.type+'</b>: '+s.url.substring(0,40)+'...</span><button style="border:none;background:var(--danger);color:#fff;border-radius:4px;padding:2px 6px;cursor:pointer;" onclick="removeSource('+idx+')">&times;</button></div>';
  });
  if(DYNAMIC_SOURCES.length === 0) html = '<div style="font-size:11px;color:#888;">Belum ada sumber data tambahan.</div>';
  list.innerHTML = html;
}
function addSource() {
  var type = document.getElementById('new-source-type').value;
  var url = document.getElementById('new-source-url').value;
  if(!url) return alert('URL wajib diisi');
  DYNAMIC_SOURCES.push({type: type, url: url});
  TOTAL++; // increment total to wait for load
  loadCSV(url, type);
  showToast('Menambahkan sumber data baru...');
  document.getElementById('new-source-url').value = '';
  renderSourceList();
}
function removeSource(idx) {
  DYNAMIC_SOURCES.splice(idx, 1);
  showToast('Sumber dihapus. Muat ulang halaman untuk menghapus data dari peta.');
  renderSourceList();
}

/* Exports & Fullscreen */
function downloadFile(rows, filename) {
  var fmt = document.querySelector('input[name="export-fmt"]:checked').value;
  if (fmt === 'xlsx') {
    var ws = XLSX.utils.aoa_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename.replace('.csv', '.xlsx'));
  } else {
    var csv = rows.map(function(r) { return '"' + String(r).replace(/"/g, '""') + '"'; }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }
}

function exportCSV(type) {
  if (!LAYER_VISIBLE[type]) return showToast('Lapisan ini sedang disembunyikan di legenda');
  var dataToExport = [];
  var filename = 'export.csv';
  var lbl = '';

  if (type === 'pjl') { dataToExport = DATA.pjl; filename = 'Petugas_Jaga_Leuweung.csv'; lbl = 'Petugas Jaga Leuweung'; }
  else if (type === 'per') { dataToExport = DATA.persemaian; filename = 'Lokasi_Persemaian_Jaga_Leuweung.csv'; lbl = 'Lokasi Persemaian Jaga Leuweung'; }
  else if (type === 'peg') { dataToExport = DATA.pegawai; filename = 'Pegawai_Dinas_Kehutanan.csv'; lbl = 'Pegawai Dinas Kehutanan'; }
  else if (type === 'jum') { dataToExport = DATA.jumat; filename = 'Lokasi_Unggulan_Jumat_Menanam.csv'; lbl = 'Lokasi Permanen Jum\'at Menanam'; }
  else return;

  var rows = [['Kategori','Nama','Unit Kerja','Kab/Kota','Kecamatan','Desa','Lat','Lng']];
  dataToExport.forEach(function(r) {
    if (!r) return;
    if (!passFilter(r, type === 'per' ? 'persemaian' : (type === 'jum' ? 'jumat' : type))) return; 
    var name = safe(r['Nama Kawasan'] || r['Nama Lokasi'] || r['Lokasi Penanaman'] || r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi']);
    var unit = safe(r['Unit Kerja'] || r['UNIT KERJA']);
    var kec = safe(r['Kecamatan'] || r['Kecamatan '] || r['KECAMATAN']);
    var desa = safe(r['Desa/Kelurahan'] || r['Desa'] || r['Kelurahan'] || r['DESA']);
    rows.push([lbl, name, unit, safe(r._kab), kec, desa, r._lat || '', r._lng || '']);
  });
  
  downloadFile(rows, filename);
  showToast('Data berhasil diekspor');
  closeExportModal();
}

function exportAllFiltered() {
  var allRows = [['Kategori','Nama','Unit Kerja','Kab/Kota','Kecamatan','Desa','Lat','Lng']];
  var types = [
    { k: 'pjl', label: 'Petugas Jaga Leuweung', data: DATA.pjl, filterType: 'pjl' },
    { k: 'per', label: 'Persemaian Jaga Leuweung', data: DATA.persemaian, filterType: 'persemaian' },
    { k: 'peg', label: 'Pegawai Dinas Kehutanan', data: DATA.pegawai, filterType: 'pegawai' },
    { k: 'jum', label: 'Lokasi Permanen Jumat Menanam', data: DATA.jumat, filterType: 'jumat' }
  ];
  
  types.forEach(function(t) {
    if (!LAYER_VISIBLE[t.k]) return;
    t.data.forEach(function(r) {
      if (!r || !passFilter(r, t.filterType)) return;
      var name = safe(r['Nama Kawasan'] || r['Nama Lokasi'] || r['Lokasi Penanaman'] || r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi']);
      var unit = safe(r['Unit Kerja'] || r['UNIT KERJA']);
      var kec = safe(r['Kecamatan'] || r['Kecamatan '] || r['KECAMATAN']);
      var desa = safe(r['Desa/Kelurahan'] || r['Desa'] || r['Kelurahan'] || r['DESA']);
      allRows.push([t.label, name, unit, safe(r._kab), kec, desa, r._lat || '', r._lng || '']);
    });
  });

  downloadFile(allRows, 'Semua_Data_Terfilter.csv');
  showToast('Semua data terfilter berhasil diekspor');
  closeExportModal();
}

function downloadMap() {
  var mapContainer = document.getElementById('map');
  showToast('Menyiapkan gambar peta...');
  html2canvas(mapContainer, { useCORS: true, allowTaint: true }).then(canvas => {
    var img = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = img; a.download = 'Screenshot_Peta_GeoHutan.png'; a.click();
    showToast('Peta berhasil diunduh');
  }).catch(e => {
    console.error(e);
    showToast('Gagal mengunduh peta. Pastikan browser mendukung.');
  });
}
function goFullscreen() {
  var el = document.documentElement;
  if(document.fullscreenElement) { document.exitFullscreen(); return; }
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

/* Initialization Loads */
var PJL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPguLQCl8rp7VcrnOK0T_PGisuk-L-fQIKv1dpt5cO3LiN6MWoZ91RI50fhZd-KnXXa5yiOwkd2ezF/pub?gid={G}&single=true&output=csv';
['1107501735','1715712076','1053237933','1784821909','946859661','96096761','1779255843','635466960','360434997'].forEach(function(g) { loadCSV(PJL_URL.replace('{G}', g), 'pjl'); });

var PER_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5Zmpk0bJdGg7tyvKH2RFZk-aD40ZaSMVvjSAHIiQT7jt6hqCYIHqURIjtEQx5jENQ8NvsuV3MlTtg/pub?gid={G}&single=true&output=csv';
['1149553688','1364517698','144675684','1843729244','1981250821','1159710704','1142124495','420074128','1536834083'].forEach(function(g) { loadCSV(PER_URL.replace('{G}', g), 'persemaian'); });

loadCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vSEHhDs2n0UKFjZlPcM4TrWQD9alaw1esFLVxjnKAD9isJ5vbKEQwhXFGYtyp8D2g/pub?gid=738073883&single=true&output=csv', 'pegawai');
loadCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vSPtxo38ft9es4Mt0xn1oqPJQCVmYZcmyYN1GKTUBYz8b4wRX34jbQa5odSjVLwvB-yxuUnDGAV9Pou/pub?gid=2039375183&single=true&output=csv', 'jumat');

/* ── LEAFLET DRAW & POLYGON ANALYSIS ── */
var drawnItems = new L.FeatureGroup();
mapObj.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
  position: 'bottomright',
  edit: { featureGroup: drawnItems },
  draw: {
    polyline: false,
    circle: false,
    circlemarker: false,
    marker: false,
    rectangle: true,
    polygon: {
      allowIntersection: false,
      showArea: true
    }
  }
});
mapObj.addControl(drawControl);

mapObj.on(L.Draw.Event.CREATED, function (e) {
  drawnItems.clearLayers();
  var layer = e.layer;
  drawnItems.addLayer(layer);
  analyzePolygon(layer);
});

function analyzePolygon(layer) {
  if (typeof turf === 'undefined') { showToast('Turf.js tidak termuat.'); return; }
  var geojson = layer.toGeoJSON();
  var poly = geojson.geometry;
  
  var inPoly = { pjl: [], per: [], peg: [], jum: [] };
  var allData = [].concat(
    DATA.pjl.map(r=>({t:'pjl',r:r})), DATA.persemaian.map(r=>({t:'per',r:r})),
    DATA.pegawai.map(r=>({t:'peg',r:r})), DATA.jumat.map(r=>({t:'jum',r:r}))
  );
  
  allData.forEach(function(item) {
    if (item.r._lng && item.r._lat) {
      if (!LAYER_VISIBLE[item.t]) return;
      var fType = item.t === 'per' ? 'persemaian' : (item.t === 'jum' ? 'jumat' : (item.t === 'peg' ? 'pegawai' : item.t));
      if (!passFilter(item.r, fType)) return;
      try {
        var pt = turf.point([item.r._lng, item.r._lat]);
        if (turf.booleanPointInPolygon(pt, poly)) {
          inPoly[item.t].push(item.r);
        }
      } catch(e) {}
    }
  });
  
  showAnalysisModal(inPoly);
}

function showAnalysisModal(inPoly) {
  var modal = document.getElementById('analysis-modal');
  var summary = document.getElementById('analysis-summary');
  var tbody = document.getElementById('analysis-table-body');
  
  var cPjl = inPoly.pjl.length;
  var cPer = inPoly.per.length;
  var cPeg = inPoly.peg.length;
  var cJum = inPoly.jum.length;
  
  summary.innerHTML = 
    '<div style="background:#e8f5e9; padding:8px 12px; border-radius:6px; font-weight:bold; color:#2e7d32; font-size:12px;">Petugas Jaga Leuweung: '+cPjl+'</div>' +
    '<div style="background:#e3f2fd; padding:8px 12px; border-radius:6px; font-weight:bold; color:#1565c0; font-size:12px;">Persemaian Jaga Leuweung: '+cPer+'</div>' +
    '<div style="background:#fff3e0; padding:8px 12px; border-radius:6px; font-weight:bold; color:#e65100; font-size:12px;">Pegawai Kehutanan: '+cPeg+'</div>' +
    '<div style="background:#f3e5f5; padding:8px 12px; border-radius:6px; font-weight:bold; color:#6a1b9a; font-size:12px;">Jum\'at Menanam: '+cJum+'</div>';
  
  var html = '';
  var allFound = [].concat(
    inPoly.pjl.map(r=>({t:'pjl',r:r})), inPoly.per.map(r=>({t:'per',r:r})),
    inPoly.peg.map(r=>({t:'peg',r:r})), inPoly.jum.map(r=>({t:'jum',r:r}))
  );
  
  for(var i=0; i<allFound.length; i++) {
    var item = allFound[i]; var r = item.r;
    var name = safe(r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi'] || '');
    var unit = safe(r['Unit Kerja'] || r['UNIT KERJA']);
    var kab = safe(r._kab);
    var jabat = '-';
    if (item.t === 'peg') jabat = safe(r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN']);
    if (item.t === 'pjl') jabat = 'Pendamping PJL';
    html += '<tr><td>'+POP_LABEL[item.t]+'</td><td>'+name+'</td><td>'+jabat+'</td><td>'+unit+'</td><td>'+kab+'</td></tr>';
  }
  
  if (allFound.length === 0) {
    html = '<tr><td colspan="5" style="text-align:center;padding:20px;">Tidak ada data dalam area ini</td></tr>';
  }
  
  tbody.innerHTML = html;
  modal.classList.add('open');
}

function closeAnalysisModal() {
  var modal = document.getElementById('analysis-modal');
  if (modal) modal.classList.remove('open');
}

function clearDrawnPolygons() {
  if (typeof drawnItems !== 'undefined') {
    drawnItems.clearLayers();
  }
  closeAnalysisModal();
}
function openTableModal() {
  document.getElementById('table-modal').classList.add('open');
  renderTable();
}

/* ═══════════════════════════════════════════════════════════
   📸 PHOTO GALLERY – JUMAT MENANAM PERMANEN
   ═══════════════════════════════════════════════════════════ */

var PHOTO_YEARS = ['2026','2027','2028','2029','2030'];

// Gallery state object
var JUM_GALLERY = { row: null, year: '2026', idx: 0, photos: [], dates: [], sheetCount: 0, localCount: 0 };
// Lightbox state
var LB_STATE = { photos: [], dates: [], idx: 0, year: '2026', locName: '' };

/** Parse pipe-separated values from a spreadsheet cell */
function parsePipeField(val) {
  if (!val || !String(val).trim()) return [];
  return String(val).split('|').map(function(s) { return s.trim(); }).filter(Boolean);
}

/** Get photos array for a given row + year (auto-normalize URLs, ignores folder links) */
function getJumPhotos(r, year) {
  var urls = parsePipeField(r['Foto_' + year]);
  var res = [];
  urls.forEach(function(u) {
    if (!extractDriveFolderId(u)) { // ignore folders here
      res.push(normalizeImageUrl(u));
    }
  });
  return res;
}

/** Get dates array for a given row + year */
function getJumDates(r, year) {
  return parsePipeField(r['Tanggal_' + year]);
}

/** Find the earliest year that has photos (sheet + local), or default to current year */
function getCurrentPhotoYear(r) {
  var todayStr = String(new Date().getFullYear());
  if (getMergedData(r, todayStr).photos.length > 0) return todayStr;
  for (var i = 0; i < PHOTO_YEARS.length; i++) {
    if (getMergedData(r, PHOTO_YEARS[i]).photos.length > 0) return PHOTO_YEARS[i];
  }
  return todayStr;
}

/** Build the entire photo section HTML */
function buildJumPhotoSection(r) {
  var html = '<div class="jum-photo-section" id="jum-photo-section">';
  
  // Section title
  html += '<div class="jum-photo-section-title">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e24aa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
    'Dokumentasi Foto Lokasi' +
    '</div>';

  // Year Timeline Pills
  html += '<div class="year-timeline" id="jum-year-timeline">';
  PHOTO_YEARS.forEach(function(yr) {
    var mergedYr = getMergedData(r, yr);
    var hasPhoto = mergedYr.photos.length > 0;
    var photoCount = mergedYr.photos.length;
    var isActive = (yr === getCurrentPhotoYear(r));
    html += '<button class="year-pill' + (isActive ? ' active' : '') + (hasPhoto ? ' has-photo' : '') + '"' +
      ' data-year="' + yr + '"' +
      ' onclick="changeGalleryYear(\''+yr+'\')"' +
      ' title="' + (hasPhoto ? photoCount + ' foto tersedia' : 'Belum ada foto') + '">' +
      yr + '</button>';
  });
  html += '</div>';

  // Carousel container (will be filled by refreshGalleryForYear)
  html += '<div id="jum-carousel-wrap" class="jum-carousel-wrap">' +
    '<div class="jum-no-photo">' +
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
    '<span>Memuat foto...</span>' +
    '</div>' +
    '</div>';

  // Upload button footer
  html += '<div style="margin-top:10px; display:flex; justify-content:flex-end;">' +
    '<button class="jum-upload-btn" onclick="openUploadModal(JUM_GALLERY.row)">' +
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
    ' Upload Foto Baru' +
    '</button>' +
    '</div>';

  html += '</div>'; // .jum-photo-section
  return html;
}

/** Refresh carousel display for selected year */
function refreshGalleryForYear(year) {
  if (!JUM_GALLERY.row) return;
  var r = JUM_GALLERY.row;
  JUM_GALLERY.year = year;
  
  // Highlight pill early
  var pills = document.querySelectorAll('#jum-year-timeline .year-pill, #upload-year-pills .year-pill');
  pills.forEach(function(p) {
    p.classList.remove('active');
    if ((p.getAttribute('data-year') || p.textContent.trim()) === year) p.classList.add('active');
  });

  var wrap = document.getElementById('jum-carousel-wrap');
  if (!wrap) return;

  var val = String(r['Foto_' + year] || '').trim();
  var folderId = extractDriveFolderId(val);

  if (folderId) {
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">Mengekstrak foto dari Google Drive...</div>';
    
    var cacheKey = "folder_" + folderId;
    if (window[cacheKey]) {
      processExtractedFolder(window[cacheKey]);
    } else {
      if (typeof GAS_WEB_APP_URL === "undefined" || GAS_WEB_APP_URL.indexOf("script.google.com") === -1) {
         wrap.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Backend GAS belum disetting. Tidak bisa membaca folder.</div>';
         return;
      }
      fetch(GAS_WEB_APP_URL + "?action=getFolder&folderId=" + folderId)
        .then(function(res) { return res.json(); })
        .then(function(data) {
           if (data.success) {
             window[cacheKey] = data.files;
             processExtractedFolder(data.files);
           } else {
             wrap.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Gagal membaca folder. Pastikan folder dibagikan publik (Siapa saja memiliki link).</div>';
           }
        }).catch(function(err) {
           wrap.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Error koneksi ke Backend.</div>';
        });
    }
  } else {
    // Normal merge & sort logic
    applyGalleryData(getMergedData(r, year));
  }

  function processExtractedFolder(files) {
    var sheetPhotos = files.map(function(f) { return normalizeImageUrl(f.url); });
    var combined = [];
    files.forEach(function(f) {
      combined.push({ url: normalizeImageUrl(f.url), date: f.date, timestamp: parseExifDate(f.date), isLocal: false });
    });
    
    // Local photos
    var locals = getLocalPhotos(r, year);
    locals.forEach(function(l) {
      // Cek apakah foto lokal ini sudah masuk ke spreadsheet
      var lNorm = normalizeImageUrl(l.url);
      // Ekstrak ID Drive jika memungkinkan untuk perbandingan akurat
      var m = lNorm.match(/\/d\/([a-zA-Z0-9_-]+)/) || lNorm.match(/id=([a-zA-Z0-9_-]+)/);
      var lId = m ? m[1] : lNorm;
      
      var isDuplicate = sheetPhotos.some(function(sUrl) {
         var sm = sUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || sUrl.match(/id=([a-zA-Z0-9_-]+)/);
         var sId = sm ? sm[1] : sUrl;
         return sId === lId;
      });

      if (!isDuplicate) {
        combined.push({ url: lNorm, date: l.date, timestamp: parseExifDate(l.date), isLocal: true });
      }
    });
    
    combined.sort(function(a, b) { return b.timestamp - a.timestamp; });
    
    var allP = [], allD = [], isLocMap = [];
    combined.forEach(function(c) {
      allP.push(c.url); allD.push(c.date); isLocMap.push(c.isLocal);
    });
    
    applyGalleryData({
      photos: allP, dates: allD,
      sheetCount: files.length, localCount: locals.length,
      isLocalMap: isLocMap
    });
  }

  function applyGalleryData(_merged) {
    JUM_GALLERY.photos = _merged.photos;
    JUM_GALLERY.dates = _merged.dates;
    JUM_GALLERY.sheetCount = _merged.sheetCount;
    JUM_GALLERY.localCount = _merged.localCount;
    JUM_GALLERY.isLocalMap = _merged.isLocalMap;
    JUM_GALLERY.idx = 0;

    if (_merged.photos.length === 0) {
      wrap.innerHTML = '<div class="jum-no-photo">' +
        '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
        '<span>Belum ada foto untuk tahun <strong style="color:#ab47bc">' + year + '</strong></span>' +
        '<span style="font-size:10px;opacity:0.6;">Tambahkan foto di kolom Foto_' + year + ' spreadsheet</span>' +
        '</div>';
      return;
    }
    renderCarousel(JUM_GALLERY.photos, JUM_GALLERY.dates);
  }
}

/** Render carousel with photos array */
function renderCarousel(photos, dates) {
  var wrap = document.getElementById('jum-carousel-wrap');
  if (!wrap) return;
  var idx = JUM_GALLERY.idx;
  var url = photos[idx] || '';
  var date = dates[idx] || '';
  var total = photos.length;
  var isLocalPhoto = (JUM_GALLERY.isLocalMap && JUM_GALLERY.isLocalMap[idx]);

  var dotsHtml = '';
  if (total > 1) {
    for (var i = 0; i < Math.min(total, 10); i++) {
      dotsHtml += '<button class="car-dot' + (i === idx ? ' active' : '') + '" onclick="jumpCarousel('+i+')"></button>';
    }
    if (total > 10) dotsHtml += '<span style="font-size:9px;color:rgba(255,255,255,0.4);margin-left:4px;">+' + (total - 10) + '</span>';
  }

  var localBadge = isLocalPhoto ? '<span class="local-photo-badge">&#128247; Lokal</span>' : '';
  var deleteBtn = '<button class="car-delete-btn" onclick="event.stopPropagation();deleteCurrentCarouselPhoto()" title="Hapus foto ini">&#128465;</button>';

  wrap.innerHTML = 
    '<div class="jum-carousel-inner" id="jum-car-inner" onclick="openPhotoLightbox()">' +
      '<img class="jum-carousel-img" id="jum-car-img" src="' + url + '" alt="Foto ' + JUM_GALLERY.year + '"' +
        ' onerror="handleDriveImageError(this); this.parentElement.querySelector(\'.jum-zoom-hint\').style.display=\'none\'; if(this.dataset.driveFallback===\'1\'){this.src=\'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'120\'%3E%3Crect width=\'200\' height=\'120\' fill=\'%23222\'/%3E%3Ctext x=\'100\' y=\'60\' fill=\'%23666\' text-anchor=\'middle\' dominant-baseline=\'middle\' font-size=\'12\' font-family=\'Arial\'%3EGagal memuat foto%3C/text%3E%3C/svg%3E\' }" />' +
      (total > 1 ?
        '<button class="car-nav-btn car-nav-prev" onclick="event.stopPropagation();navCarousel(-1)" ' + (idx === 0 ? 'disabled' : '') + '>&#8249;</button>' +
        '<button class="car-nav-btn car-nav-next" onclick="event.stopPropagation();navCarousel(1)" ' + (idx >= total-1 ? 'disabled' : '') + '>&#8250;</button>' : '') +
      '<div class="jum-zoom-hint">&#128269; Klik untuk perbesar</div>' +
    '</div>' +
    (total > 1 ? '<div class="carousel-dots" style="background:rgba(13,13,26,0.8);padding:5px 0;">' + dotsHtml + '</div>' : '') +
    '<div class="jum-carousel-footer">' +
      '<div class="jum-photo-timestamp">' +
        localBadge +
        (date ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' + date : '<span style="opacity:0.4;">Tanggal tidak tersedia</span>') +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        deleteBtn +
        '<div class="jum-photo-counter">' + (idx+1) + ' / ' + total + '</div>' +
      '</div>' +
    '</div>';
}

/** Navigate carousel */
function navCarousel(dir) {
  var total = JUM_GALLERY.photos.length;
  JUM_GALLERY.idx = Math.max(0, Math.min(total - 1, JUM_GALLERY.idx + dir));
  renderCarousel(JUM_GALLERY.photos, JUM_GALLERY.dates);
  // Sync lightbox if open
  if (document.getElementById('photo-lightbox').classList.contains('open')) {
    LB_STATE.idx = JUM_GALLERY.idx;
    refreshLightbox();
  }
}

/** Jump to specific photo index */
function jumpCarousel(i) {
  JUM_GALLERY.idx = i;
  renderCarousel(JUM_GALLERY.photos, JUM_GALLERY.dates);
}

/** Change gallery year from timeline pill click */
function changeGalleryYear(year) {
  refreshGalleryForYear(year);
}

/* ─── FULLSCREEN LIGHTBOX ─── */

/** Open fullscreen lightbox with current gallery state */
function openPhotoLightbox() {
  var photos = JUM_GALLERY.photos;
  if (!photos || photos.length === 0) return;
  LB_STATE.photos = photos;
  LB_STATE.dates = JUM_GALLERY.dates;
  LB_STATE.idx = JUM_GALLERY.idx;
  LB_STATE.year = JUM_GALLERY.year;
  
  if (JUM_GALLERY.row) {
    var r = JUM_GALLERY.row;
    var name = getName(r);
    var cdk = r['Unit Kerja'] || r._cdk || '-';
    var kab = r['Kabupaten/Kota'] || r._kab || '-';
    var desa = r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || r['DESA'] || '-';
    var ket = r['Keterangan'] || '-';
    LB_STATE.locName = '<strong style="color:#fff;">' + name + '</strong><br/>' +
                       cdk + ' &bull; ' + kab + ' &bull; ' + desa + '<br/>' +
                       '<span style="opacity:0.7;font-size:10px;">' + ket + '</span>';
  } else {
    LB_STATE.locName = '';
  }
  
  document.getElementById('photo-lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshLightbox();
}

/** Close lightbox */
function closePhotoLightbox() {
  document.getElementById('photo-lightbox').classList.remove('open');
  document.body.style.overflow = '';
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.warn(err));
  }
}

/** Toggle Native Fullscreen for Lightbox */
window.toggleLightboxFullscreen = function() {
  var lbContainer = document.querySelector('.lightbox-img-container');
  if (!lbContainer) return;
  if (!document.fullscreenElement) {
    lbContainer.requestFullscreen().catch(err => {
      console.warn("Error attempting to enable fullscreen:", err);
    });
  } else {
    document.exitFullscreen();
  }
};

/** Handle click on lightbox backdrop (close if clicking outside container) */
function handleLightboxBackdropClick(e) {
  if (e.target === document.getElementById('photo-lightbox')) closePhotoLightbox();
}

/** Navigate lightbox */
function lightboxNav(dir) {
  var total = LB_STATE.photos.length;
  LB_STATE.idx = Math.max(0, Math.min(total - 1, LB_STATE.idx + dir));
  // Sync carousel
  JUM_GALLERY.idx = LB_STATE.idx;
  renderCarousel(JUM_GALLERY.photos, JUM_GALLERY.dates);
  refreshLightbox();
}

/** Refresh lightbox to current LB_STATE.idx */
function refreshLightbox() {
  var photos = LB_STATE.photos;
  var dates = LB_STATE.dates;
  var idx = LB_STATE.idx;
  var total = photos.length;
  var url = photos[idx] || '';
  var date = dates[idx] || '';

  // Header
  var yBadge = document.getElementById('lightbox-year-badge');
  var counter = document.getElementById('lightbox-counter');
  var stamp = document.getElementById('lightbox-timestamp');
  var locInfo = document.getElementById('lightbox-loc-info');
  if (yBadge) yBadge.textContent = 'Foto ' + LB_STATE.year;
  if (counter) counter.textContent = (idx + 1) + ' dari ' + total;
  if (stamp) stamp.innerHTML = date ?
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' + date :
    '';
  if (locInfo) locInfo.innerHTML = LB_STATE.locName;

  // Image
  var imgEl = document.getElementById('lightbox-img');
  var loadEl = document.getElementById('lightbox-loading');
  if (imgEl) {
    if (loadEl) { loadEl.classList.add('show'); }
    imgEl.style.opacity = '0';
    imgEl.onload = function() {
      imgEl.style.opacity = '1';
      if (loadEl) loadEl.classList.remove('show');
    };
    imgEl.onerror = function() {
      if (loadEl) loadEl.classList.remove('show');
      imgEl.style.opacity = '1';
    };
    imgEl.src = url;
    
    // Reset zoom and pan
    if (window.lbZoomData) {
      window.lbZoomData.scale = 1;
      window.lbZoomData.x = 0;
      window.lbZoomData.y = 0;
      imgEl.style.transform = 'translate(0px, 0px) scale(1)';
    }
  }

  // Nav buttons
  var prev = document.querySelector('.lb-prev');
  var next = document.querySelector('.lb-next');
  if (prev) prev.disabled = (idx === 0);
  if (next) next.disabled = (idx >= total - 1);

  // Dots
  var dotsWrap = document.getElementById('lightbox-dots');
  if (dotsWrap) {
    var dHtml = '';
    for (var i = 0; i < Math.min(total, 12); i++) {
      dHtml += '<button class="lb-dot' + (i === idx ? ' active' : '') + '" onclick="lightboxJump('+i+')"></button>';
    }
    if (total > 12) dHtml += '<span style="font-size:10px;color:rgba(255,255,255,0.4);margin-left:4px;">+' + (total-12) + '</span>';
    dotsWrap.innerHTML = dHtml;
  }
}

/** Jump lightbox to index */
function lightboxJump(i) {
  LB_STATE.idx = i;
  JUM_GALLERY.idx = i;
  renderCarousel(JUM_GALLERY.photos, JUM_GALLERY.dates);
  refreshLightbox();
}

/* Touch swipe support for lightbox */
(function() {
  var startX = 0;
  var lb = document.getElementById('photo-lightbox');
  if (!lb) return;
  lb.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) lightboxNav(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

/* Zoom and Pan support for lightbox image */
(function() {
  var imgEl = document.getElementById('lightbox-img');
  if (!imgEl) return;
  
  window.lbZoomData = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };
  var z = window.lbZoomData;

  imgEl.addEventListener('wheel', function(e) {
    e.preventDefault();
    z.scale += e.deltaY > 0 ? -0.15 : 0.15;
    z.scale = Math.max(0.5, Math.min(z.scale, 5)); // Allow zoom out to 0.5x, zoom in to 5x
    if(z.scale === 1) { z.x = 0; z.y = 0; }
    updateTransform();
  }, { passive: false });

  imgEl.addEventListener('mousedown', function(e) {
    if (z.scale > 1) {
      z.isDragging = true;
      z.startX = e.clientX - z.x;
      z.startY = e.clientY - z.y;
      imgEl.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', function(e) {
    if (z.isDragging) {
      z.x = e.clientX - z.startX;
      z.y = e.clientY - z.startY;
      updateTransform();
    }
  });

  window.addEventListener('mouseup', function() {
    z.isDragging = false;
    if (imgEl && z.scale > 1) imgEl.style.cursor = 'grab';
    else if (imgEl) imgEl.style.cursor = 'default';
  });

  function updateTransform() {
    imgEl.style.transform = 'translate(' + z.x + 'px, ' + z.y + 'px) scale(' + z.scale + ')';
    if (!z.isDragging) imgEl.style.cursor = z.scale > 1 ? 'grab' : 'default';
  }
})();

/* ═══════════════════════════════════════════════════════════
   📸 LOCAL PHOTO UPLOAD & MANAGEMENT
   ═══════════════════════════════════════════════════════════ */

/** Get local photos from localStorage for a specific row & year */
function getLocalPhotos(r, year) {
  var rowId = r._row_idx || r.id || r['No'] || (r._lat + '_' + r._lng);
  var key = 'jum_photos_' + rowId + '_' + year;
  try {
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

/** Save local photos to localStorage */
function saveLocalPhotosToStorage(r, year, photosData) {
  var rowId = r._row_idx || r.id || r['No'] || (r._lat + '_' + r._lng);
  var key = 'jum_photos_' + rowId + '_' + year;
  localStorage.setItem(key, JSON.stringify(photosData));
}

/** Parse DD/MM/YYYY into timestamp */
function parseExifDate(dStr) {
  if(!dStr) return 0;
  var p = String(dStr).split('/');
  if(p.length === 3) return new Date(p[2], p[1]-1, p[0]).getTime();
  return 0;
}

/** Helper functions for deleted photos tracking (optimistic UI) */
function getDeletedPhotoIds(r, year) {
  try {
    var rowId = r._row_idx || r.id || r['No'] || (r._lat + '_' + r._lng);
    var key = 'jum_deleted_' + rowId + '_' + year;
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch(e) { return []; }
}
function addDeletedPhotoId(r, year, id) {
  var ids = getDeletedPhotoIds(r, year);
  if (ids.indexOf(id) === -1) {
    ids.push(id);
    var rowId = r._row_idx || r.id || r['No'] || (r._lat + '_' + r._lng);
    var key = 'jum_deleted_' + rowId + '_' + year;
    localStorage.setItem(key, JSON.stringify(ids));
  }
}

/** Merge spreadsheet photos and local photos, then sort by date newest first */
function getMergedData(r, year) {
  var sheetPhotos = getJumPhotos(r, year);
  var sheetDates = getJumDates(r, year);
  var locals = getLocalPhotos(r, year);
  
  var combined = [];
  var deletedIds = getDeletedPhotoIds(r, year);
  
  // Sheet photos
  for(var i=0; i<sheetPhotos.length; i++) {
    var url = sheetPhotos[i];
    var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    var sid = m ? m[1] : url;
    
    if (deletedIds.indexOf(sid) === -1) {
      var d = sheetDates[i] || '';
      combined.push({ url: url, date: d, timestamp: parseExifDate(d), isLocal: false });
    }
  }
  
  // Local photos
  locals.forEach(function(l) {
    // Cek apakah foto lokal ini sudah masuk ke spreadsheet
    var lNorm = normalizeImageUrl(l.url);
    // Ekstrak ID Drive jika memungkinkan untuk perbandingan akurat
    var m = lNorm.match(/\/d\/([a-zA-Z0-9_-]+)/) || lNorm.match(/id=([a-zA-Z0-9_-]+)/);
    var lId = m ? m[1] : lNorm;
    
    var isDuplicate = sheetPhotos.some(function(sUrl) {
       var sm = sUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || sUrl.match(/id=([a-zA-Z0-9_-]+)/);
       var sId = sm ? sm[1] : sUrl;
       return sId === lId;
    });

    if (!isDuplicate) {
      combined.push({ url: lNorm, date: l.date, timestamp: parseExifDate(l.date), isLocal: true });
    }
  });
  
  // Sort by date newest first
  combined.sort(function(a, b) {
    return b.timestamp - a.timestamp;
  });
  
  var allPhotos = [], allDates = [], isLocalMap = [];
  var localCount = 0;
  
  combined.forEach(function(c) {
    allPhotos.push(c.url);
    allDates.push(c.date);
    isLocalMap.push(c.isLocal);
    if(c.isLocal) localCount++;
  });
  
  return {
    photos: allPhotos,
    dates: allDates,
    sheetCount: sheetPhotos.length,
    localCount: localCount,
    isLocalMap: isLocalMap
  };
}

/** Delete the currently viewed photo from all sources */
function deleteCurrentCarouselPhoto() {
  if (!confirm('Apakah Anda yakin ingin menghapus foto ini secara permanen dari Dashboard, Google Drive, dan Spreadsheet?')) return;
  var r = JUM_GALLERY.row;
  var year = JUM_GALLERY.year;
  var idx = JUM_GALLERY.idx;
  var targetUrl = JUM_GALLERY.photos[idx];
  
  var targetMatch = targetUrl.match(/id=([a-zA-Z0-9_-]+)/) || targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  var targetId = targetMatch ? targetMatch[1] : targetUrl;
  
  // 1. Remove from local storage immediately (optimistic UI)
  var locals = getLocalPhotos(r, year);
  var filteredLocals = locals.filter(function(l) { 
    var m1 = l.url.match(/id=([a-zA-Z0-9_-]+)/) || l.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    var id1 = m1 ? m1[1] : l.url;
    return id1 !== targetId; 
  });
  saveLocalPhotosToStorage(r, year, filteredLocals);
  addDeletedPhotoId(r, year, targetId);

  showToast('Menghapus foto...', 'info');
  var btn = document.querySelector('.car-delete-btn');
  if(btn) btn.style.opacity = '0.5';

  var payload = {
    action: "delete",
    url: targetUrl,
    lat: parseFloat(String(r._lat).replace(',', '.')),
    lng: parseFloat(String(r._lng).replace(',', '.')),
    year: year
  };

  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.success) {
      showToast('Foto berhasil dihapus dari sistem.', 'success');
      // If it was the last photo, close the modal maybe? Or just refresh
    } else {
      showToast('Gagal menghapus dari server: ' + data.error, 'error');
    }
    refreshGalleryForYear(year);
  })
  .catch(function(err) {
    console.error(err);
    showToast('Terjadi kesalahan jaringan saat menghapus.', 'error');
    refreshGalleryForYear(year);
  });
}

/** Open Upload Modal */
function openUploadModal(r) {
  var m = document.getElementById('upload-modal');
  if (!m || !r) return;
  
  var locInfo = document.getElementById('upload-loc-info');
  if (locInfo) locInfo.innerHTML = '\ud83d\udccd ' + getName(r) + ' &bull; ' + (r['Kabupaten/Kota'] || '');
  
  var pillsWrap = document.getElementById('upload-year-pills');
  if (pillsWrap) {
    var pillsHtml = '';
    PHOTO_YEARS.forEach(function(yr) {
      var isActive = (yr === JUM_GALLERY.year);
      pillsHtml += '<button class="year-pill' + (isActive ? ' active' : '') + '"' +
        ' data-year="' + yr + '"' +
        ' type="button" onclick="selectUploadYear(\''+yr+'\')">' + yr + '</button>';
    });
    pillsWrap.innerHTML = pillsHtml;
  }
  document.getElementById('upload-year').value = JUM_GALLERY.year;
  
  // Reset input file
  var fi = document.getElementById('upload-files');
  if (fi) fi.value = '';
  
  m.classList.add('open');
}

/** Upload foto ke GAS Backend (dengan EXIF otomatis) */
function saveLocalPhoto() {
  var fileInput = document.getElementById('upload-files');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showToast('Pilih minimal satu file foto!', 'error');
    return;
  }
  
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.indexOf('script.google.com') === -1) {
    alert('Backend belum dikonfigurasi! Masukkan URL Web App GAS ke variabel GAS_WEB_APP_URL di file app-features.js');
    return;
  }

  var r = JUM_GALLERY.row;
  var year = document.getElementById('upload-year').value;
  
  var btn = document.querySelector('#upload-modal .btn-apply');
  var oldText = btn.innerHTML;
  btn.innerHTML = 'Mengekstrak EXIF...';
  btn.disabled = true;

  var files = Array.from(fileInput.files);
  var processed = 0;
  var successCount = 0;

  files.forEach(function(file) {
    // 1. Ekstrak EXIF Date
      // Gunakan Promise atau langsung baca FileReader jika gagal
      var proceedWithUpload = function(finalDateStr) {
        if (!finalDateStr) {
          var d = new Date(file.lastModified || Date.now());
          finalDateStr = ('0'+d.getDate()).slice(-2) + '/' + ('0'+(d.getMonth()+1)).slice(-2) + '/' + d.getFullYear();
        }

        var reader = new FileReader();
        reader.onload = function(e) {
          var base64Full = e.target.result;
          var base64Clean = base64Full.split(',')[1];
          btn.innerHTML = 'Mengupload (' + (processed+1) + '/' + files.length + ')...';
          var payload = {
            action: "upload",
            base64: base64Clean,
            mimeType: file.type,
            lat: parseFloat(String(r._lat).replace(',','.')),
            lng: parseFloat(String(r._lng).replace(',','.')),
            year: year,
            date: finalDateStr
          };

          fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
          })
          .then(function(response) { return response.json(); })
          .then(function(data) {
            processed++;
            if (data.success) {
              successCount++;
              var locals = getLocalPhotos(r, year);
              locals.push({ url: data.url, date: data.date });
              saveLocalPhotosToStorage(r, year, locals);
            } else {
              console.error("Upload Error:", data.error);
            }
            checkFinish();
          })
          .catch(function(err) {
            console.error("Fetch Error:", err);
            processed++;
            checkFinish();
          });
        };
        reader.onerror = function() {
          processed++;
          checkFinish();
        };
        reader.readAsDataURL(file);
      };

      try {
        EXIF.getData(file, function() {
          var exifDateStr = EXIF.getTag(this, "DateTimeOriginal") || EXIF.getTag(this, "DateTime") || EXIF.getTag(this, "DateTimeDigitized");
          var fDate = "";
          if (exifDateStr) {
            var parts = exifDateStr.split(" ");
            if (parts.length > 0) {
              var ymd = parts[0].split(":");
              if (ymd.length === 3) fDate = ymd[2] + "/" + ymd[1] + "/" + ymd[0];
            }
          }
          proceedWithUpload(fDate);
        });
      } catch (exifErr) {
        console.warn("EXIF read failed, using current date.", exifErr);
        proceedWithUpload("");
      }
  });

  function checkFinish() {
    if (processed === files.length) {
      closeUploadModal();
      if (successCount > 0) {
        showToast(successCount + ' Foto berhasil diupload ke Spreadsheet!', 'success');
        refreshGalleryForYear(year);
      } else {
        showToast('Gagal mengupload foto. Cek console.', 'error');
      }
      btn.innerHTML = oldText;
      btn.disabled = false;
    }
  }
}

/** Extract Folder ID from URL */
function extractDriveFolderId(url) {
  if (!url) return null;
  // Jika link adalah file sharing biasa, bukan folder
  if (url.indexOf('uc?export') !== -1 || url.indexOf('uc?id=') !== -1 || url.indexOf('export=view') !== -1) {
    return null; // Ini file
  }
  
  var match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  // Format lama folder: /open?id= atau /folderview?id=
  if (url.indexOf('open?id=') !== -1 || url.indexOf('folderview?id=') !== -1) {
    match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  
  return null;
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('open');
}

function selectUploadYear(year) {
  document.getElementById('upload-year').value = year;
  var pills = document.querySelectorAll('#upload-year-pills .year-pill');
  pills.forEach(function(p) {
    p.classList.remove('active');
    if (p.getAttribute('data-year') === year) p.classList.add('active');
  });
}
