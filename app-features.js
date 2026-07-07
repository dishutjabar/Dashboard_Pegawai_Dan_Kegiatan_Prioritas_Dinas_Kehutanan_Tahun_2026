/* ═══ GeoHutan Jabar – Features ═══ */
/** URL Web App Google Apps Script */
var GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCdFIZ3y9BbBiRHJItturR5cSt2RvoQKEbePXXhogpusq_8oID6v6pN654k85sI1kb/exec";
var AUTH_TOKEN_STORAGE_KEY = "geohutan_auth_token";
var AUTH_USER_STORAGE_KEY = "geohutan_auth_user";

function getAuthToken() {
  try { return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ""; }
  catch (e) { return ""; }
}

function setStoredAuth(token, user) {
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token || "");
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user || {}));
  } catch (e) {}
}

function clearStoredAuth() {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch (e) {}
}

function appendAuthParam(url) {
  var token = getAuthToken();
  if (!token) return url;
  return url + (url.indexOf("?") === -1 ? "?" : "&") + "token=" + encodeURIComponent(token);
}

function withAuthPayload(payload) {
  payload = payload || {};
  payload.authToken = getAuthToken();
  return payload;
}

function setAuthStatus(message, isError) {
  var el = document.getElementById("auth-status");
  if (!el) return;
  el.textContent = message || "";
  el.className = "auth-status" + (isError ? " error" : "");
}

function getStoredAuthUser() {
  try {
    var raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function getUserInitials(user) {
  var label = (user && (user.nama || user.username)) ? String(user.nama || user.username).trim() : "GH";
  var parts = label.split(/\s+/).filter(Boolean);
  if (!parts.length) return "GH";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function updateAuthUserUI(user) {
  var pill = document.getElementById("auth-user-pill");
  var profileMenu = document.getElementById("profile-menu");
  var profileName = document.getElementById("profile-name");
  var profileRole = document.getElementById("profile-role");
  var profileAvatar = document.querySelector("#profile-menu .profile-avatar");
  if (user && user.username) {
    if (pill) pill.textContent = user.nama || user.username;
    if (profileName) profileName.textContent = user.nama || user.username;
    if (profileRole) {
      var roleParts = [];
      if (user.jabatan) roleParts.push(user.jabatan);
      if (user.role) roleParts.push(user.role);
      profileRole.textContent = roleParts.join(" - ") || "Pengguna Dashboard";
    }
    if (profileAvatar) profileAvatar.textContent = getUserInitials(user);
    if (profileMenu) profileMenu.style.display = "block";
  } else {
    if (pill) pill.textContent = "";
    if (profileName) profileName.textContent = "GeoHutan";
    if (profileRole) profileRole.textContent = "Pengguna Dashboard";
    if (profileAvatar) profileAvatar.textContent = "GH";
    if (profileMenu) {
      profileMenu.style.display = "none";
      profileMenu.classList.remove("open");
    }
  }
}

function unlockDashboard(user) {
  var portal = document.getElementById("auth-portal");
  if (portal) portal.classList.add("hidden");
  document.body.classList.add("auth-unlocked");
  updateAuthUserUI(user);
  if (typeof fetchSpatialFileList === "function") fetchSpatialFileList();
}

function lockDashboard(message) {
  clearStoredAuth();
  document.body.classList.remove("auth-unlocked");
  updateAuthUserUI(null);
  var portal = document.getElementById("auth-portal");
  if (portal) portal.classList.remove("hidden");
  setAuthStatus(message || "", !!message);
}

function postAuthAction(payload) {
  return fetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(function(r) { return r.json(); });
}

function initAuthPortal() {
  var portal = document.getElementById("auth-portal");
  if (!portal) return;
  var token = getAuthToken();
  if (!token) {
    lockDashboard("");
    return;
  }
  var cachedUser = getStoredAuthUser();
  if (cachedUser && cachedUser.username) {
    document.body.classList.add("auth-unlocked");
    updateAuthUserUI(cachedUser);
  }
  postAuthAction({ action: "verifySession", authToken: token })
    .then(function(res) {
      if (res.success) {
        setStoredAuth(token, res.user);
        unlockDashboard(res.user);
      } else {
        lockDashboard("");
      }
    })
    .catch(function() { lockDashboard(""); });
}

function toggleProfileMenu(event) {
  if (event) event.stopPropagation();
  var menu = document.getElementById("profile-menu");
  var trigger = menu ? menu.querySelector(".profile-trigger") : null;
  if (!menu) return;
  menu.classList.toggle("open");
  if (trigger) trigger.setAttribute("aria-expanded", menu.classList.contains("open") ? "true" : "false");
}

function closeProfileMenu() {
  var menu = document.getElementById("profile-menu");
  var trigger = menu ? menu.querySelector(".profile-trigger") : null;
  if (!menu) return;
  menu.classList.remove("open");
  if (trigger) trigger.setAttribute("aria-expanded", "false");
}

function submitLogin(event) {
  if (event) event.preventDefault();
  var username = (document.getElementById("login-username") || {}).value || "";
  var password = (document.getElementById("login-password") || {}).value || "";
  var captcha = document.getElementById("login-captcha");
  var btn = document.getElementById("login-submit");
  username = username.trim();
  if (!username || !password) { setAuthStatus("Username dan password wajib diisi.", true); return; }
  if (captcha && !captcha.checked) { setAuthStatus("Centang verifikasi keamanan terlebih dahulu.", true); return; }
  if (btn) { btn.disabled = true; btn.textContent = "Memeriksa akses..."; }
  setAuthStatus("Memverifikasi akun...", false);
  postAuthAction({ action: "login", username: username, password: password })
    .then(function(res) {
      if (!res.success) throw new Error(res.error || "Login gagal.");
      setStoredAuth(res.token, res.user);
      setAuthStatus("", false);
      unlockDashboard(res.user);
      if (typeof showToast === "function") showToast("Login berhasil. Selamat datang, " + (res.user.nama || res.user.username) + ".", "success");
    })
    .catch(function(err) {
      setAuthStatus(err.message || "Login gagal.", true);
    })
    .finally(function() {
      if (btn) { btn.disabled = false; btn.textContent = "Masuk Dashboard"; }
    });
}

function logoutGeoHutan() {
  var token = getAuthToken();
  if (token && GAS_WEB_APP_URL.indexOf("script.google.com") !== -1) {
    postAuthAction({ action: "logout", authToken: token }).catch(function() {});
  }
  lockDashboard("Anda sudah keluar dari dashboard.");
}

function togglePasswordVisibility(inputId, btn) {
  var input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  if (btn) btn.textContent = input.type === "password" ? "Tampilkan" : "Sembunyikan";
}

function toggleCredentialPanel() {
  var panel = document.getElementById("credential-panel");
  if (!panel) return;
  panel.classList.toggle("open");
  setAuthStatus("", false);
}

function submitCredentialChange(event) {
  if (event) event.preventDefault();
  var oldUsername = (document.getElementById("old-username") || {}).value || "";
  var oldPassword = (document.getElementById("old-password") || {}).value || "";
  var newUsername = (document.getElementById("new-username") || {}).value || "";
  var newPassword = (document.getElementById("new-password") || {}).value || "";
  var confirmPassword = (document.getElementById("confirm-new-password") || {}).value || "";
  var captcha = document.getElementById("change-captcha");
  var btn = document.getElementById("change-submit");
  if (!oldUsername.trim() || !oldPassword || !newUsername.trim() || !newPassword) {
    setAuthStatus("Lengkapi semua field perubahan akun.", true);
    return;
  }
  if (newPassword !== confirmPassword) {
    setAuthStatus("Konfirmasi password baru belum sama.", true);
    return;
  }
  if (captcha && !captcha.checked) {
    setAuthStatus("Centang konfirmasi perubahan terlebih dahulu.", true);
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = "Menyimpan..."; }
  postAuthAction({
    action: "changeCredentials",
    oldUsername: oldUsername.trim(),
    oldPassword: oldPassword,
    newUsername: newUsername.trim(),
    newPassword: newPassword
  }).then(function(res) {
    if (!res.success) throw new Error(res.error || "Gagal memperbarui akun.");
    clearStoredAuth();
    var form = document.getElementById("credential-form");
    if (form) form.reset();
    var loginUser = document.getElementById("login-username");
    if (loginUser) loginUser.value = newUsername.trim();
    setAuthStatus("Akun berhasil diperbarui. Silakan login dengan username dan password baru.", false);
  }).catch(function(err) {
    setAuthStatus(err.message || "Gagal memperbarui akun.", true);
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.textContent = "Simpan Perubahan"; }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  initAuthPortal();
  document.addEventListener("click", closeProfileMenu);
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") closeProfileMenu();
  });
  var profileMenu = document.getElementById("profile-menu");
  if (profileMenu) {
    profileMenu.addEventListener("click", function(event) { event.stopPropagation(); });
  }
});

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

function togglePjlPolygons() {
  PJL_POLYGON_ENABLED = document.getElementById('toggle-pjl-polygon').checked;
  if (PJL_POLYGON_ENABLED) {
    if (PJL_POLYGON_LAYER && mapObj) PJL_POLYGON_LAYER.addTo(mapObj);
  } else {
    if (PJL_POLYGON_LAYER && mapObj) mapObj.removeLayer(PJL_POLYGON_LAYER);
  }
  showToast('Area Tanam 2 Ha (Jaga Leuweung) ' + (PJL_POLYGON_ENABLED ? 'ditampilkan' : 'disembunyikan'));
}

/* ════════════════════════════════════════════════════════════
   🗺️  SPATIAL UPLOAD SYSTEM
   ════════════════════════════════════════════════════════════ */
var SPATIAL_UPLOAD_LAYER = null;
var SPATIAL_ENABLED = false;
var SPATIAL_FILES_CACHE = []; // [{fileId, filename, url, uploaded, sizeKB, cdkTag, geojson}]
var SPATIAL_RENDER_TOKEN = 0;
var SPATIAL_LIST_ALL = [];
var SPATIAL_LIST_PAGE = 0;
var SPATIAL_LIST_PAGE_SIZE = 10;
var SPATIAL_LIST_QUERY = '';
var SPATIAL_FETCH_CONCURRENCY = 4;
var SPATIAL_LOAD_QUEUE = null;
var SPATIAL_MAP_MOVE_BOUND = false;
var SPATIAL_GEOJSON_MEM = {}; // fileId -> geojson (session cache)
var SHP_SIDECAR_EXTS = ['shp','shx','dbf','prj','cpg','sbn','sbx','qix','xml'];

function getShpBaseName(filename) {
  var name = String(filename || '').split(/[/\\]/).pop();
  return name.replace(/\.[^.]+$/i, '');
}

function getShpGroupSidecars(group) {
  var sidecars = {};
  SHP_SIDECAR_EXTS.forEach(function(ext) {
    if (group[ext] instanceof Blob) sidecars[ext] = group[ext];
  });
  return sidecars;
}

function readBlobAsArrayBuffer(f) {
  return new Promise(function(res, rej) {
    var r = new FileReader();
    r.onload = function(e) { res(e.target.result); };
    r.onerror = function() { rej(new Error('Gagal membaca file')); };
    r.readAsArrayBuffer(f);
  });
}

function readBlobAsText(f) {
  return new Promise(function(res, rej) {
    var r = new FileReader();
    r.onload = function(e) { res(e.target.result); };
    r.onerror = function() { rej(new Error('Gagal membaca file')); };
    r.readAsText(f);
  });
}

function normalizeGeoJSON(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.type === 'FeatureCollection' && Array.isArray(data.features)) return data;
  if (data.type === 'Feature' && data.geometry) {
    return { type: 'FeatureCollection', features: [data] };
  }
  var geomTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
  if (geomTypes.indexOf(data.type) !== -1) {
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: data, properties: {} }] };
  }
  if (Array.isArray(data) && data.length && data[0] && data[0].type === 'Feature') {
    return { type: 'FeatureCollection', features: data };
  }
  return null;
}

function parseKmlFromZipEntry(kmlFile, cb) {
  kmlFile.async('string').then(function(kmlStr) {
    var kmlDoc = (new DOMParser()).parseFromString(kmlStr, 'text/xml');
    var gj = (typeof toGeoJSON !== 'undefined') ? toGeoJSON.kml(kmlDoc) : null;
    if (gj) cb(gj, null);
    else cb(null, 'Gagal parse KML dalam zip');
  }).catch(function(err) { cb(null, err.message); });
}

/** Parse shapefile dengan file apa pun yang tersedia (.shp saja, atau paket lengkap/sebagian) */
function parseShpGroupFlexible(group, base, cb) {
  if (typeof shp === 'undefined') { cb(null, 'Library shpjs tidak tersedia'); return; }

  var sidecars = getShpGroupSidecars(group);
  if (!sidecars.shp) {
    cb(null, 'File .shp tidak ditemukan untuk ' + base);
    return;
  }

  function tryZipParse() {
    if (typeof JSZip === 'undefined') return Promise.reject(new Error('JSZip tidak tersedia'));
    var zipBuilder = new JSZip();
    return Promise.all(Object.keys(sidecars).map(function(ext) {
      return readBlobAsArrayBuffer(sidecars[ext]).then(function(ab) {
        zipBuilder.file(base + '.' + ext, ab);
      });
    })).then(function() {
      return zipBuilder.generateAsync({ type: 'arraybuffer' });
    }).then(function(ab) {
      return shp(ab);
    });
  }

  function tryManualParse() {
    return Promise.all([
      readBlobAsArrayBuffer(sidecars.shp),
      sidecars.prj ? readBlobAsText(sidecars.prj) : Promise.resolve(null),
      sidecars.dbf ? readBlobAsArrayBuffer(sidecars.dbf) : Promise.resolve(null),
      sidecars.cpg ? readBlobAsText(sidecars.cpg) : Promise.resolve(null)
    ]).then(function(results) {
      var geometries = shp.parseShp(results[0], results[1] || undefined);
      var properties = results[2] ? shp.parseDbf(results[2], results[3] || undefined) : null;
      return shp.combine([geometries, properties]);
    });
  }

  tryZipParse()
    .then(function(gj) { cb(gj, null); })
    .catch(function() {
      tryManualParse()
        .then(function(gj) { cb(gj, null); })
        .catch(function(err) { cb(null, err.message || String(err)); });
    });
}


function toggleSpatialPolygons() {
  SPATIAL_ENABLED = document.getElementById('toggle-spatial').checked;
  if (SPATIAL_ENABLED) renderSpatialPolygons(true);
  else {
    if (SPATIAL_UPLOAD_LAYER && mapObj) { try { mapObj.removeLayer(SPATIAL_UPLOAD_LAYER); } catch(e) {} }
    SPATIAL_UPLOAD_LAYER = null;
    SPATIAL_RENDER_TOKEN = Date.now();
  }
  showToast('Polygon Spasial ' + (SPATIAL_ENABLED ? 'ditampilkan' : 'disembunyikan'));
}

function openSpatialModal() {
  var m = document.getElementById('spatial-modal');
  if (m) {
    m.style.display = 'flex';
    var searchEl = document.getElementById('sp-file-search');
    if (searchEl) searchEl.value = '';
    SPATIAL_LIST_QUERY = '';
    fetchSpatialFileList();
  }
}
function closeSpatialModal() {
  var m = document.getElementById('spatial-modal');
  if (m) m.style.display = 'none';
}

/* ── Handle Drop (supports folder drag via webkitGetAsEntry) ── */
function handleSpatialDrop(event) {
  event.preventDefault();
  var dz = document.getElementById('spatial-dropzone');
  if (dz) dz.classList.remove('active');
  var items = event.dataTransfer.items;
  if (items && items.length && items[0].webkitGetAsEntry) {
    var entries = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        var entry = items[i].webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }
    if (entries.length) {
      collectSpatialEntryFiles(entries, function(files) {
        if (files.length) handleSpatialFiles(files);
        else showToast('Tidak ada file spasial yang valid dalam drop.');
      });
      return;
    }
  }
  var files = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : [];
  if (files.length > 0) handleSpatialFiles(files);
}

function collectSpatialEntryFiles(entries, cb) {
  var allFiles = [];
  var pending = 0;
  function tick() { if (pending <= 0) cb(allFiles); }

  function readDir(dirEntry) {
    pending++;
    var reader = dirEntry.createReader();
    var batch = [];
    function readBatch() {
      reader.readEntries(function(results) {
        if (!results.length) {
          var subPending = batch.length;
          if (!subPending) { pending--; tick(); return; }
          batch.forEach(function(entry) { walk(entry); });
          return;
        }
        batch = batch.concat(Array.prototype.slice.call(results));
        readBatch();
      }, function() { pending--; tick(); });
    }
    readBatch();
  }

  function walk(entry) {
    if (entry.isFile) {
      pending++;
      entry.file(function(f) { allFiles.push(f); pending--; tick(); }, function() { pending--; tick(); });
    } else if (entry.isDirectory) {
      readDir(entry);
    }
  }

  entries.forEach(walk);
  tick();
}

/* ── Handle Files (from input or drop) ── */
function handleSpatialFiles(fileList) {
  // Reset render layer to avoid stale artifacts on re-upload
  if (SPATIAL_UPLOAD_LAYER && mapObj) { try { mapObj.removeLayer(SPATIAL_UPLOAD_LAYER); } catch(e) {} }
  SPATIAL_UPLOAD_LAYER = null;
  var files = Array.from(fileList);
  if (!files.length) return;

  // Collect all relevant spatial files
  var toProcess = [];
  var zipFiles = [];
  var shpGroup = {}; // {baseName: {shp, dbf, prj, shx, ...}}

  files.forEach(function(f) {
    var nameLower = f.name.toLowerCase();
    var ext = nameLower.split('.').pop();
    if (nameLower.endsWith('.zip') || nameLower.endsWith('.kmz') || nameLower.endsWith('.rar')) {
      zipFiles.push(f);
    } else if (nameLower.endsWith('.geojson') || nameLower.endsWith('.json')) {
      toProcess.push({type: 'geojson', file: f, name: f.name});
    } else if (nameLower.endsWith('.kml')) {
      toProcess.push({type: 'kml', file: f, name: f.name});
    } else if (SHP_SIDECAR_EXTS.indexOf(ext) !== -1) {
      var baseKey = getShpBaseName(f.name).toLowerCase();
      if (!shpGroup[baseKey]) shpGroup[baseKey] = { baseName: getShpBaseName(f.name) };
      shpGroup[baseKey][ext] = f;
    }
  });

  var allJobs = [];
  zipFiles.forEach(function(f) {
    var nl = f.name.toLowerCase();
    if (nl.endsWith('.kmz')) allJobs.push({type: 'kmz', file: f, name: f.name});
    else if (nl.endsWith('.rar')) allJobs.push({type: 'rar', file: f, name: f.name});
    else allJobs.push({type: 'zip', file: f, name: f.name});
  });
  Object.keys(shpGroup).forEach(function(baseKey) {
    var grp = shpGroup[baseKey];
    if (grp.shp) {
      var displayBase = grp.baseName || baseKey;
      allJobs.push({type: 'shp_group', group: grp, name: displayBase + '.shp', base: displayBase});
    }
  });
  allJobs = allJobs.concat(toProcess);

  if (!allJobs.length) { showToast('Format file tidak didukung.'); return; }

  showSpatialProgress(0, 'Mempersiapkan ' + allJobs.length + ' file...');
  var processed = 0;

  function processNext(idx) {
    if (idx >= allJobs.length) {
      hideSpatialProgress();
      fetchSpatialFileList();
      return;
    }
    var job = allJobs[idx];
    showSpatialProgress(Math.round(idx / allJobs.length * 100), 'Memproses: ' + job.name);
    parseSpatialFile(job, function(geojson, err) {
      processed++;
      if (geojson) {
        uploadSpatialToBackend(geojson, job.name, function() {
          showSpatialProgress(Math.round((idx+1) / allJobs.length * 100), 'Berhasil: ' + job.name);
          processNext(idx + 1);
        });
      } else {
        showToast('Gagal parse: ' + job.name + (err ? ' — ' + err : ''));
        processNext(idx + 1);
      }
    });
  }
  processNext(0);
}

/* ── Parse single file/group to GeoJSON ── */
function parseSpatialFile(job, cb) {
  try {
    if (job.type === 'geojson') {
      var fr = new FileReader();
      fr.onload = function(e) {
        try {
          var parsed = JSON.parse(e.target.result);
          var gj = normalizeGeoJSON(parsed);
          if (gj) cb(gj, null);
          else cb(null, 'Format JSON tidak dikenali sebagai GeoJSON');
        } catch(err) { cb(null, err.message); }
      };
      fr.readAsText(job.file);

    } else if (job.type === 'kml') {
      var fr2 = new FileReader();
      fr2.onload = function(e) {
        try {
          var kmlDoc = (new DOMParser()).parseFromString(e.target.result, 'text/xml');
          var gj = (typeof toGeoJSON !== 'undefined') ? toGeoJSON.kml(kmlDoc) : null;
          if (!gj) { cb(null, 'Library toGeoJSON tidak tersedia'); return; }
          cb(gj, null);
        } catch(err) { cb(null, err.message); }
      };
      fr2.readAsText(job.file);

    } else if (job.type === 'zip') {
      var fr3 = new FileReader();
      fr3.onload = function(e) {
        if (typeof shp === 'undefined') { cb(null, 'Library shpjs tidak tersedia'); return; }
        shp(e.target.result).then(function(gj) { cb(gj, null); }).catch(function() {
          JSZip.loadAsync(e.target.result).then(function(zip) {
            var jsonFile = null;
            var kmlFile = null;
            zip.forEach(function(path, file) {
              var pl = path.toLowerCase();
              if (!jsonFile && (pl.endsWith('.geojson') || pl.endsWith('.json'))) jsonFile = file;
              if (!kmlFile && pl.endsWith('.kml')) kmlFile = file;
            });
            if (jsonFile) {
              jsonFile.async('string').then(function(str) {
                try {
                  var gj = normalizeGeoJSON(JSON.parse(str));
                  if (gj) cb(gj, null);
                  else if (kmlFile) parseKmlFromZipEntry(kmlFile, cb);
                  else cb(null, 'Format JSON dalam zip tidak valid');
                } catch(err) { cb(null, err.message); }
              });
              return;
            }
            if (kmlFile) { parseKmlFromZipEntry(kmlFile, cb); return; }
            cb(null, 'Zip tidak berisi SHP, GeoJSON, atau KML');
          }).catch(function(e2) { cb(null, e2.message); });
        });
      };
      fr3.readAsArrayBuffer(job.file);

    } else if (job.type === 'kmz') {
      var fr4 = new FileReader();
      fr4.onload = function(e) {
        JSZip.loadAsync(e.target.result).then(function(zip) {
          var kmlFile = null;
          zip.forEach(function(path, file) { if (path.toLowerCase().endsWith('.kml')) kmlFile = file; });
          if (!kmlFile) { cb(null, 'KMZ tidak berisi file KML'); return; }
          kmlFile.async('string').then(function(kmlStr) {
            var kmlDoc = (new DOMParser()).parseFromString(kmlStr, 'text/xml');
            var gj = (typeof toGeoJSON !== 'undefined') ? toGeoJSON.kml(kmlDoc) : null;
            if (gj) cb(gj, null); else cb(null, 'Gagal parse KML dalam KMZ');
          });
        }).catch(function(e2) { cb(null, e2.message); });
      };
      fr4.readAsArrayBuffer(job.file);

    } else if (job.type === 'rar') {
      cb(null, 'Format .rar belum didukung langsung. Ekstrak terlebih dahulu ke .zip atau upload folder shapefile.');

    } else if (job.type === 'shp_group') {
      parseShpGroupFlexible(job.group, job.base, cb);

    } else { cb(null, 'Tipe tidak dikenal'); }
  } catch(e) { cb(null, e.message); }
}

/* ── Upload GeoJSON ke Backend GAS ── */
function uploadSpatialToBackendLegacy(geojson, filename, done) {
  // Ensure we remove any existing cached polygons with same filename to force re-fetch.
  // (Drive may return cached/forbidden responses for old IDs.)

  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.indexOf('script.google.com') === -1) {
    showToast('Backend GAS belum dikonfigurasi!'); if (done) done(); return;
  }
  var geoStr = JSON.stringify(geojson);
  var cdkTag = FILTER.cdk && FILTER.cdk.length ? FILTER.cdk.join(',') : '';
  var bbox = computeGeoJSONBBox(geojson);

  // Paksa ekstensi menjadi .geojson supaya backend menyimpan file dengan tipe yang benar,
  // dan agar getSpatialFiles bisa membaca/parse tanpa ambiguitas.
  var safeBase = String(filename || 'spasial');
  safeBase = safeBase.replace(/\.(shp|zip|rar|kmz|kml|json|geojson)$/i, '');
  var geojsonFilename = safeBase + '.geojson';

  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'uploadSpatial',
      geojson: geoStr,
      filename: geojsonFilename,
      cdk_tag: cdkTag,
      kategori: typeof SPATIAL_ACTIVE_TAB !== 'undefined' ? SPATIAL_ACTIVE_TAB : 'Jaga Leuweung',
      bbox_w: bbox ? bbox.west : '',
      bbox_s: bbox ? bbox.south : '',
      bbox_e: bbox ? bbox.east : '',
      bbox_n: bbox ? bbox.north : ''
    })
  }).then(function(r) { return r.json(); })
  .then(function(res) {
    if (res.success) {
      // Cache locally
      var entry = {
        fileId: res.fileId,
        filename: res.filename,
        url: res.url,
        uploaded: res.uploaded,
        sizeKB: res.sizeKB,
        cdkTag: cdkTag,
        kategori: typeof SPATIAL_ACTIVE_TAB !== 'undefined' ? SPATIAL_ACTIVE_TAB : 'Jaga Leuweung',
        geojson: geojson,
        bbox: bbox
      };
      SPATIAL_FILES_CACHE.push(entry);
      SPATIAL_GEOJSON_MEM[res.fileId] = geojson;
      if (bbox) saveSpatialBBoxToLS(res.fileId, bbox);
      if (SPATIAL_ENABLED) scheduleSpatialPolygonLoad(50);
      showToast('✓ Tersimpan: ' + filename);
    } else { showToast('Gagal simpan: ' + (res.error || 'Error')); }
    if (done) done();
  }).catch(function(err) { showToast('Error upload: ' + err.message); if (done) done(); });
}

/* ── Fetch daftar file spasial dari backend ── */
var SPATIAL_MAX_POST_BYTES = 3500000;

function estimateJSONBytes(value) {
  try {
    var str = typeof value === 'string' ? value : JSON.stringify(value);
    return new Blob([str]).size;
  } catch (e) {
    return String(value || '').length;
  }
}

function getSpatialUploadBaseName(filename) {
  var safeBase = String(filename || 'spasial').split(/[/\\]/).pop();
  safeBase = safeBase.replace(/\.(shp|zip|rar|kmz|kml|json|geojson)$/i, '');
  return safeBase.replace(/[^\w\s.-]/g, '_').trim() || 'spasial';
}

function buildSpatialFeatureCollection(features, sourceName, partIndex, partTotal) {
  return {
    type: 'FeatureCollection',
    properties: {
      uploadSource: sourceName,
      uploadPart: partIndex,
      uploadTotalParts: partTotal
    },
    features: features || []
  };
}

function prepareSpatialGeoJSONForUpload(geojson) {
  var normalized = normalizeGeoJSON(geojson);
  if (!normalized || !Array.isArray(normalized.features)) return null;
  try {
    if (typeof turf !== 'undefined' && turf.truncate) {
      normalized = turf.truncate(normalized, { precision: 6, coordinates: 2, mutate: false });
    }
  } catch (e) {}
  try {
    if (typeof turf !== 'undefined' && turf.flatten) {
      normalized = turf.flatten(normalized);
    }
  } catch (e2) {}
  return normalizeGeoJSON(normalized);
}

function splitGeoJSONForUpload(geojson, filename) {
  var normalized = prepareSpatialGeoJSONForUpload(geojson);
  if (!normalized || !Array.isArray(normalized.features)) return [];
  var baseName = getSpatialUploadBaseName(filename);
  if (estimateJSONBytes(normalized) <= SPATIAL_MAX_POST_BYTES) {
    return [{ geojson: normalized, filename: baseName + '.geojson', part: 1, total: 1 }];
  }

  var chunks = [];
  var current = [];
  var currentBytes = estimateJSONBytes(buildSpatialFeatureCollection([], baseName, 1, 1));
  normalized.features.forEach(function(feature) {
    var featureBytes = estimateJSONBytes(feature) + 2;
    if (current.length && currentBytes + featureBytes > SPATIAL_MAX_POST_BYTES) {
      chunks.push(current);
      current = [];
      currentBytes = estimateJSONBytes(buildSpatialFeatureCollection([], baseName, 1, 1));
    }
    current.push(feature);
    currentBytes += featureBytes;
  });
  if (current.length) chunks.push(current);

  var total = chunks.length || 1;
  return chunks.map(function(features, idx) {
    var part = idx + 1;
    var suffix = '_part' + String(part).padStart(3, '0') + 'of' + String(total).padStart(3, '0');
    return {
      geojson: buildSpatialFeatureCollection(features, baseName, part, total),
      filename: baseName + suffix + '.geojson',
      part: part,
      total: total
    };
  });
}

function uploadSpatialToBackend(geojson, filename, done) {
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.indexOf('script.google.com') === -1) {
    showToast('Backend GAS belum dikonfigurasi!'); if (done) done(); return;
  }
  if (!getAuthToken()) {
    showToast('Silakan login ulang sebelum upload polygon.', 'error');
    lockDashboard('Sesi login diperlukan untuk upload.');
    if (done) done();
    return;
  }

  var chunks = splitGeoJSONForUpload(geojson, filename);
  if (!chunks.length) { showToast('GeoJSON tidak valid atau kosong.', 'error'); if (done) done(); return; }

  var cdkTag = FILTER.cdk && FILTER.cdk.length ? FILTER.cdk.join(',') : '';
  var kategori = typeof SPATIAL_ACTIVE_TAB !== 'undefined' ? SPATIAL_ACTIVE_TAB : 'Jaga Leuweung';
  var uploadedCount = 0;

  function uploadNext(idx) {
    if (idx >= chunks.length) {
      if (SPATIAL_ENABLED) scheduleSpatialPolygonLoad(50);
      showToast('Tersimpan: ' + filename + (chunks.length > 1 ? ' (' + chunks.length + ' bagian GeoJSON)' : ''), 'success');
      if (done) done();
      return;
    }

    var chunk = chunks[idx];
    var bbox = computeGeoJSONBBox(chunk.geojson);
    if (chunks.length > 1) {
      showSpatialProgress(Math.round((idx / chunks.length) * 100), 'Mengupload bagian ' + chunk.part + '/' + chunk.total + ': ' + chunk.filename);
    }

    fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(withAuthPayload({
        action: 'uploadSpatial',
        geojson: JSON.stringify(chunk.geojson),
        filename: chunk.filename,
        cdk_tag: cdkTag,
        kategori: kategori,
        bbox_w: bbox ? bbox.west : '',
        bbox_s: bbox ? bbox.south : '',
        bbox_e: bbox ? bbox.east : '',
        bbox_n: bbox ? bbox.north : ''
      }))
    }).then(function(r) { return r.json(); })
    .then(function(res) {
      if (!res.success) throw new Error(res.error || 'Error backend');
      uploadedCount++;
      var entry = {
        fileId: res.fileId,
        filename: res.filename,
        url: res.url,
        uploaded: res.uploaded,
        sizeKB: res.sizeKB,
        cdkTag: cdkTag,
        kategori: kategori,
        geojson: chunk.geojson,
        bbox: bbox
      };
      SPATIAL_FILES_CACHE.push(entry);
      SPATIAL_GEOJSON_MEM[res.fileId] = chunk.geojson;
      if (bbox) saveSpatialBBoxToLS(res.fileId, bbox);
      uploadNext(idx + 1);
    }).catch(function(err) {
      showToast('Gagal upload bagian ' + (idx + 1) + '/' + chunks.length + ': ' + err.message, 'error');
      if (uploadedCount > 0) fetchSpatialFileList();
      if (done) done();
    });
  }

  uploadNext(0);
}

function computeGeoJSONBBox(gj) {
  if (!gj) return null;
  try {
    var bb = turf.bbox(gj);
    return { west: bb[0], south: bb[1], east: bb[2], north: bb[3] };
  } catch (e) { return null; }
}

function normalizeSpatialBBox(b) {
  if (!b) return null;
  if (typeof b.west === 'number') return b;
  if (Array.isArray(b) && b.length >= 4) {
    return { west: b[0], south: b[1], east: b[2], north: b[3] };
  }
  return null;
}

function getSpatialBBoxFromLS(fileId) {
  try {
    var raw = localStorage.getItem('sp_bbox_' + fileId);
    return raw ? normalizeSpatialBBox(JSON.parse(raw)) : null;
  } catch (e) { return null; }
}

function saveSpatialBBoxToLS(fileId, bbox) {
  try { localStorage.setItem('sp_bbox_' + fileId, JSON.stringify(bbox)); } catch (e) {}
}

function bboxIntersectsMap(bbox, mapBounds) {
  if (!bbox || !mapBounds) return true;
  var sw = mapBounds.getSouthWest();
  var ne = mapBounds.getNorthEast();
  return !(bbox.east < sw.lng || bbox.west > ne.lng || bbox.north < sw.lat || bbox.south > ne.lat);
}

function getSpatialFileBBox(fileObj) {
  return normalizeSpatialBBox(fileObj.bbox) || fileObj._bbox || getSpatialBBoxFromLS(fileObj.fileId);
}

function scheduleSpatialPolygonLoad(delay) {
  clearTimeout(SPATIAL_LOAD_QUEUE);
  SPATIAL_LOAD_QUEUE = setTimeout(function() {
    if (SPATIAL_ENABLED) renderSpatialPolygons();
  }, delay || 200);
}

function bindSpatialMapEvents() {
  if (SPATIAL_MAP_MOVE_BOUND || !mapObj) return;
  SPATIAL_MAP_MOVE_BOUND = true;
  var debounceTimer = null;
  mapObj.on('moveend zoomend', function() {
    if (!SPATIAL_ENABLED) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() { renderSpatialPolygons(false); }, 450);
  });
}

function fetchSpatialGeoJSONFromBackend(fileId) {
  var fileObj = SPATIAL_FILES_CACHE.find(function(c) { return c.fileId === fileId; });
  return fetch(appendAuthParam(GAS_WEB_APP_URL + '?action=getSpatialGeoJSON&fileId=' + encodeURIComponent(fileId)))
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (res.success && res.geojson) return res.geojson;
      throw new Error(res.error || 'Gagal memuat GeoJSON');
    })
    .catch(function() {
      if (!fileObj || !fileObj.url) throw new Error('Gagal memuat GeoJSON');
      return fetch(fileObj.url, { method: 'GET' })
        .then(function(r) { return r.text(); })
        .then(function(txt) {
          var gj = JSON.parse(txt);
          if (!gj) throw new Error('Format GeoJSON tidak valid');
          return gj;
        });
    });
}

function loadSpatialGeoJSONForFile(fileObj) {
  if (fileObj.geojson) return Promise.resolve(fileObj.geojson);
  if (SPATIAL_GEOJSON_MEM[fileObj.fileId]) {
    fileObj.geojson = SPATIAL_GEOJSON_MEM[fileObj.fileId];
    return Promise.resolve(fileObj.geojson);
  }
  return fetchSpatialGeoJSONFromBackend(fileObj.fileId).then(function(gj) {
    fileObj.geojson = gj;
    SPATIAL_GEOJSON_MEM[fileObj.fileId] = gj;
    fileObj._bbox = computeGeoJSONBBox(gj);
    if (fileObj._bbox) saveSpatialBBoxToLS(fileObj.fileId, fileObj._bbox);
    return gj;
  });
}

function passesCdkSpatialFilter(gj, activeCDKs, activePJLPoints, fileInfo) {
  if (!activeCDKs.length) return true;

  if (fileInfo && fileInfo.cdkTag) {
    var fileCdkTags = fileInfo.cdkTag.toLowerCase().split(',').map(function(s) { return s.trim(); });
    var match = activeCDKs.some(function(cdk) {
      return fileCdkTags.indexOf(cdk.toLowerCase()) !== -1;
    });
    if (match) return true;
    return false;
  }

  if (!activePJLPoints.length) return false;
  if (!gj || !gj.features || !gj.features.length) return false;
  try {
    var fileBbox = turf.bbox(gj);
    var anyNear = activePJLPoints.some(function(pt) {
      return pt[1] >= fileBbox[0] && pt[1] <= fileBbox[2] && pt[0] >= fileBbox[1] && pt[0] <= fileBbox[3];
    });
    if (!anyNear) return false;
    for (var i = 0; i < gj.features.length; i++) {
      var geom = gj.features[i].geometry;
      if (!geom) continue;
      var turfFeat = turf.feature(geom);
      var fb = turf.bbox(turfFeat);
      for (var j = 0; j < activePJLPoints.length; j++) {
        var pt = activePJLPoints[j];
        if (pt[1] < fb[0] || pt[1] > fb[2] || pt[0] < fb[1] || pt[0] > fb[3]) continue;
        try {
          if (turf.booleanPointInPolygon(turf.point([pt[1], pt[0]]), turfFeat)) return true;
        } catch (e) { return true; }
      }
    }
    return false;
  } catch (e) { return true; }
}

var SPATIAL_ACTIVE_TAB = 'Jaga Leuweung';
var SPATIAL_VISIBLE_CACHE = {};
var RENDERED_SPATIAL_FILES = {};

/* Warna polygon spasial per kategori upload */
var SPATIAL_CATEGORY_STYLES = {
  'Jaga Leuweung': {
    polygon: { color: '#c62828', weight: 2, fillColor: '#ef5350', fillOpacity: 0.3 },
    /* Hanya geometri garis murni (LineString) — tanpa isi/fill */
    line: { color: '#A4C639', weight: 5, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#e53935'
  },
  'Kawasan Hutan': {
    /* Biru telor asin cerah transparan + garis sisi hitam pudar */
    polygon: { color: '#2e2e2e', weight: 1.5, opacity: 0.52, fillColor: '#EAF8FD', fillOpacity: 0.34 },
    /* Hanya geometri LineString/MultiLineString — bukan greenbelt */
    line: { color: '#6BBAD4', weight: 3.5, fillOpacity: 0, opacity: 0.88 },
    popupColor: '#4A90A4'
  },
  'Lahan Kritis': {
    polygon: { color: '#C9A045', weight: 1.5, fillColor: '#F5CA7A', fillOpacity: 0.78 },
    line: { color: '#F5CA7A', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#C9A045'
  }
};

function isSpatialLineGeometry(geom) {
  return geom && (geom.type === 'LineString' || geom.type === 'MultiLineString');
}

function getSpatialFeatureStyle(feature, fileInfo) {
  var kategori = (fileInfo && fileInfo.kategori) ? fileInfo.kategori : 'Jaga Leuweung';
  var palette = SPATIAL_CATEGORY_STYLES[kategori] || SPATIAL_CATEGORY_STYLES['Jaga Leuweung'];
  var geom = feature && feature.geometry;

  /* Kuning kehijauan (#A4C639) hanya untuk garis murni tanpa isi — bukan polygon tipis */
  if (isSpatialLineGeometry(geom)) {
    return Object.assign({ dashArray: null }, palette.line || palette.polygon);
  }
  return Object.assign({ dashArray: null }, palette.polygon);
}

function getSpatialPopupAccent(fileInfo) {
  var kategori = (fileInfo && fileInfo.kategori) ? fileInfo.kategori : 'Jaga Leuweung';
  var palette = SPATIAL_CATEGORY_STYLES[kategori] || SPATIAL_CATEGORY_STYLES['Jaga Leuweung'];
  return palette.popupColor || '#e53935';
}

function switchSpatialTab(tabName) {
  SPATIAL_ACTIVE_TAB = tabName;
  var tabs = document.querySelectorAll('.sp-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
  }
  var jl = document.getElementById('sptab-jl');
  var kh = document.getElementById('sptab-kh');
  var lk = document.getElementById('sptab-lk');
  if (tabName === 'Jaga Leuweung' && jl) jl.classList.add('active');
  if (tabName === 'Kawasan Hutan' && kh) kh.classList.add('active');
  if (tabName === 'Lahan Kritis' && lk) lk.classList.add('active');
  SPATIAL_LIST_PAGE = 0;
  if (typeof renderSpatialFileListPage === 'function') renderSpatialFileListPage();
  if (typeof updateSpatialFileCount === 'function') updateSpatialFileCount();
}

function toggleSpatialFile(fileId, checked) {
  SPATIAL_VISIBLE_CACHE[fileId] = checked;
  if (!checked && RENDERED_SPATIAL_FILES[fileId] && SPATIAL_UPLOAD_LAYER) {
    SPATIAL_UPLOAD_LAYER.removeLayer(RENDERED_SPATIAL_FILES[fileId]);
    delete RENDERED_SPATIAL_FILES[fileId];
  } else if (checked) {
    if (RENDERED_SPATIAL_FILES[fileId] && SPATIAL_UPLOAD_LAYER) {
      SPATIAL_UPLOAD_LAYER.removeLayer(RENDERED_SPATIAL_FILES[fileId]);
      delete RENDERED_SPATIAL_FILES[fileId];
    }
    scheduleSpatialPolygonLoad(50);
  }
}

function getSpatialFilteredFiles() {
  var q = (SPATIAL_LIST_QUERY || '').trim().toLowerCase();
  return SPATIAL_LIST_ALL.filter(function(f) {
    var kat = f.kategori || 'Jaga Leuweung';
    if (kat !== SPATIAL_ACTIVE_TAB) return false;
    if (!q) return true;
    return (f.filename || '').toLowerCase().indexOf(q) !== -1 ||
           (f.cdkTag || '').toLowerCase().indexOf(q) !== -1;
  });
}

function updateSpatialFileCount() {
  var countEl = document.getElementById('sp-file-count');
  if (!countEl) return;
  var filtered = getSpatialFilteredFiles();
  var total = SPATIAL_LIST_ALL.length;
  countEl.textContent = filtered.length === total ? total + ' file' : filtered.length + ' / ' + total + ' file';
}

function spatialFileListSearch(val) {
  SPATIAL_LIST_QUERY = val || '';
  SPATIAL_LIST_PAGE = 0;
  renderSpatialFileListPage();
  updateSpatialFileCount();
}

function fetchSpatialFileList() {
  var listEl = document.getElementById('spatial-file-list');
  var countEl = document.getElementById('sp-file-count');
  if (!getAuthToken()) {
    if (listEl) listEl.innerHTML = '<div class="sp-file-list-empty">Login diperlukan untuk memuat daftar polygon.</div>';
    if (countEl) countEl.textContent = '';
    return;
  }
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.indexOf('script.google.com') === -1) {
    if (listEl) listEl.innerHTML = '<div class="sp-file-list-error">Backend GAS belum dikonfigurasi.</div>';
    return;
  }
  fetch(appendAuthParam(GAS_WEB_APP_URL + '?action=getSpatialFiles'))
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (!res.success) { if (listEl) listEl.innerHTML = '<div class="sp-file-list-error">Gagal memuat: ' + (res.error||'') + '</div>'; return; }
      var files = res.files || [];
      files.forEach(function(f) {
        if (typeof SPATIAL_VISIBLE_CACHE[f.fileId] === 'undefined') {
          SPATIAL_VISIBLE_CACHE[f.fileId] = (f.kategori === 'Kawasan Hutan' || f.kategori === 'Lahan Kritis') ? false : true;
        }
        var existing = SPATIAL_FILES_CACHE.find(function(c) { return c.fileId === f.fileId; });
        if (existing && existing.geojson) f.geojson = existing.geojson;
        if (existing && existing._bbox) f._bbox = existing._bbox;
        if (!f.bbox && !f._bbox) {
          var lsBbox = getSpatialBBoxFromLS(f.fileId);
          if (lsBbox) f.bbox = lsBbox;
        }
        f.bbox = normalizeSpatialBBox(f.bbox);
      });
      SPATIAL_FILES_CACHE = files;
      renderSpatialFileList(files);
      updateSpatialFileCount();
      scheduleSpatialPolygonLoad(150);
    })
    .catch(function(err) { if (listEl) listEl.innerHTML = '<div class="sp-file-list-error">Gagal terhubung ke backend.</div>'; });
}

/* ── Render daftar file di modal (scroll + pagination) ── */
function renderSpatialFileList(files) {
  SPATIAL_LIST_ALL = files || [];
  SPATIAL_LIST_PAGE = 0;
  renderSpatialFileListPage();
  updateSpatialFileCount();
}

function spatialListGoPage(page) {
  var maxPage = Math.max(0, Math.ceil(SPATIAL_LIST_ALL.length / SPATIAL_LIST_PAGE_SIZE) - 1);
  SPATIAL_LIST_PAGE = Math.max(0, Math.min(page, maxPage));
  renderSpatialFileListPage();
}

function renderSpatialFileListPage() {
  var listEl = document.getElementById('spatial-file-list');
  if (!listEl) return;
  var files = getSpatialFilteredFiles();
  if (!files.length) {
    listEl.innerHTML = SPATIAL_LIST_QUERY
      ? '<div class="sp-file-list-empty">Tidak ada file yang cocok dengan pencarian.</div>'
      : '<div class="sp-file-list-empty">Belum ada polygon yang diupload.</div>';
    return;
  }
  var totalPages = Math.ceil(files.length / SPATIAL_LIST_PAGE_SIZE);
  if (SPATIAL_LIST_PAGE > totalPages - 1) SPATIAL_LIST_PAGE = Math.max(0, totalPages - 1);
  var start = SPATIAL_LIST_PAGE * SPATIAL_LIST_PAGE_SIZE;
  var pageFiles = files.slice(start, start + SPATIAL_LIST_PAGE_SIZE);
  var icons = {geojson:'🗺️', json:'🗺️', kml:'📍', kmz:'📍', shp:'🟫', zip:'📦'};
  var html = pageFiles.map(function(f) {
    var ext = f.filename.split('.').pop().toLowerCase();
    var icon = icons[ext] || '📄';
    var cdkBadge = f.cdkTag ? '<span class="sp-upload-badge">' + f.cdkTag + '</span>' : '';
    return '<div class="sp-file-item" id="sp-item-' + f.fileId + '">' +
      '<div class="sp-file-icon">' + icon + '</div>' +
      '<div class="sp-file-info">' +
        '<div class="sp-file-name">' + f.filename + cdkBadge + '</div>' +
        '<div class="sp-file-meta">Diunggah: ' + f.uploaded + ' &bull; ' + (f.sizeKB||'?') + ' KB</div>' +
      '</div>' +
      '<div class="sp-file-actions">' +
        '<label class="sp-switch"><input type="checkbox" onchange="toggleSpatialFile(\'' + f.fileId + '\', this.checked)" ' + (SPATIAL_VISIBLE_CACHE[f.fileId] ? 'checked' : '') + '><span class="sp-slider"></span></label>' +
        '<button class="sp-btn-view" onclick="zoomToSpatialFile(\'' + f.fileId + '\')">&#128269; Lihat</button>' +
        '<button class="sp-btn-del" onclick="deleteSpatialFile(\'' + f.fileId + '\', \'' + f.filename.replace(/'/g,"\\'") + '\')">&#128465; Hapus</button>' +
      '</div>' +
    '</div>';
  }).join('');
  if (totalPages > 1) {
    html += '<div class="sp-file-pagination">' +
      '<button type="button" class="sp-page-btn" onclick="spatialListGoPage(' + (SPATIAL_LIST_PAGE - 1) + ')" ' + (SPATIAL_LIST_PAGE <= 0 ? 'disabled' : '') + '>&#8249; Sebelumnya</button>' +
      '<span class="sp-page-info">Hal ' + (SPATIAL_LIST_PAGE + 1) + ' / ' + totalPages + ' (' + files.length + ' file)</span>' +
      '<button type="button" class="sp-page-btn" onclick="spatialListGoPage(' + (SPATIAL_LIST_PAGE + 1) + ')" ' + (SPATIAL_LIST_PAGE >= totalPages - 1 ? 'disabled' : '') + '>Berikutnya &#8250;</button>' +
      '</div>';
  }
  listEl.innerHTML = html;
}

/* ── Render polygon ke peta dengan filter CDK (lazy + viewport) ── */
function renderSpatialPolygons(forceRebuild) {
  if (forceRebuild) {
    if (SPATIAL_UPLOAD_LAYER && mapObj) { try { mapObj.removeLayer(SPATIAL_UPLOAD_LAYER); } catch(e) {} }
    SPATIAL_UPLOAD_LAYER = null;
    RENDERED_SPATIAL_FILES = {};
  }
  var fetchToken = Date.now();
  SPATIAL_RENDER_TOKEN = fetchToken;

  if (!SPATIAL_ENABLED || !mapObj) return;
  bindSpatialMapEvents();
  if (!SPATIAL_UPLOAD_LAYER) {
    SPATIAL_UPLOAD_LAYER = L.layerGroup().addTo(mapObj);
  }

  var mapBounds = mapObj.getBounds();
  var activeCDKs = FILTER.cdk && FILTER.cdk.length ? FILTER.cdk.map(function(c){ return c.toLowerCase(); }) : [];
  var activePJLPoints = [];
  if (activeCDKs.length > 0) {
    DATA.pjl.forEach(function(r) {
      if (!r._lat || !r._lng) return;
      var cdk = String(r['Unit Kerja'] || r['CDK'] || '').toLowerCase();
      var cdkTags = cdk.split(',').map(function(s) { return s.trim(); });
      var match = activeCDKs.some(function(f) { return cdkTags.indexOf(f) !== -1; });
      if (match) activePJLPoints.push([r._lat, r._lng]);
    });
  }

  var candidates = SPATIAL_FILES_CACHE.filter(function(f) {
    if (SPATIAL_VISIBLE_CACHE[f.fileId] === false) return false;
    var bb = getSpatialFileBBox(f);
    if (bb) return bboxIntersectsMap(bb, mapBounds);
    return true;
  });

  var idx = 0;
  function processBatch() {
    if (SPATIAL_RENDER_TOKEN !== fetchToken) return;
    var batch = candidates.slice(idx, idx + SPATIAL_FETCH_CONCURRENCY);
    if (!batch.length) return;
    idx += SPATIAL_FETCH_CONCURRENCY;
    Promise.all(batch.map(function(f) {
      if (RENDERED_SPATIAL_FILES[f.fileId]) return Promise.resolve(); // Already loaded and rendered
      return loadSpatialGeoJSONForFile(f).then(function(gj) {
        if (SPATIAL_RENDER_TOKEN !== fetchToken || !SPATIAL_UPLOAD_LAYER) return;
        if (!passesCdkSpatialFilter(gj, activeCDKs, activePJLPoints, f)) return;
        var bb = getSpatialFileBBox(f) || computeGeoJSONBBox(gj);
        f._bbox = bb;
        if (bb) {
          f.bbox = bb;
          saveSpatialBBoxToLS(f.fileId, bb);
        }
        if (bb && !bboxIntersectsMap(bb, mapBounds)) return;
        var layer = addGeoJSONToSpatialLayer(gj, f, activeCDKs, activePJLPoints);
        if (layer) { RENDERED_SPATIAL_FILES[f.fileId] = layer; }
      }).catch(function() {});
    })).then(function() {
      if (idx < candidates.length && SPATIAL_RENDER_TOKEN === fetchToken) {
        setTimeout(processBatch, 16);
      }
    });
  }
  processBatch();
}

/* ── Add one GeoJSON to the spatial layer with CDK spatial filter ── */
function addGeoJSONToSpatialLayer(gj, fileInfo, activeCDKs, activePJLPoints) {
  if (!gj || !gj.features || !SPATIAL_UPLOAD_LAYER) return null;
  
  var hasCdkTagMatch = false;
  if (activeCDKs.length > 0 && fileInfo && fileInfo.cdkTag) {
    var fileCdkTags = fileInfo.cdkTag.toLowerCase().split(',').map(function(s) { return s.trim(); });
    hasCdkTagMatch = activeCDKs.some(function(cdk) {
      return fileCdkTags.indexOf(cdk.toLowerCase()) !== -1;
    });
  }
  
  var useFeatureFilter = activeCDKs.length > 0 && activePJLPoints.length > 0 && !hasCdkTagMatch;
  if (fileInfo && SPATIAL_VISIBLE_CACHE[fileInfo.fileId] === false) return; // Hidden by toggle

  try {
    var filteredGj = gj;
    if (useFeatureFilter) {
      filteredGj = { type: 'FeatureCollection', features: gj.features.filter(function(feature) {
        var geom = feature.geometry;
        if (!geom) return false;
        try {
          var turfFeat = turf.feature(geom);
          var fb = turf.bbox(turfFeat);
          return activePJLPoints.some(function(pt) {
            if (pt[1] < fb[0] || pt[1] > fb[2] || pt[0] < fb[1] || pt[0] > fb[3]) return false;
            try { return turf.booleanPointInPolygon(turf.point([pt[1], pt[0]]), turfFeat); }
            catch (e) {
              return pt[1] >= fb[0] && pt[1] <= fb[2] && pt[0] >= fb[1] && pt[0] <= fb[3];
            }
          });
        } catch (e) { return true; }
      }) };
    }

    var isLarge = fileInfo && (fileInfo.sizeKB > 1500);
    var renderer = isLarge ? L.canvas({ padding: 0.5 }) : L.svg({ padding: 0.5 });

    var popupAccent = getSpatialPopupAccent(fileInfo);
    var geojsonLayer = L.geoJSON(filteredGj, {
      renderer: renderer,
      style: function(feature) { return getSpatialFeatureStyle(feature, fileInfo); },
      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, { icon: L.divIcon({ className: 'custom-diamond-icon', html: '<svg width="10" height="10" viewBox="0 0 100 100" style="overflow:visible;"><polygon points="50,0 100,50 50,100 0,50" fill="#ff9800" stroke="#d84315" stroke-width="10" stroke-linejoin="round"/></svg>', iconSize: [10, 10], iconAnchor: [5, 5] }) });
      },
      onEachFeature: function(feature, layer) {
        var props = feature.properties || {};
        var keys = Object.keys(props).filter(function(k) { return props[k] != null && props[k] !== ''; });
        if (!keys.length) { layer.bindPopup('<b>' + (fileInfo ? fileInfo.filename : '') + '</b>'); return; }
        var rows = keys.slice(0, 20).map(function(k) {
          return '<tr><td style="padding:2px 8px 2px 0; font-weight:600; color:#43a047; white-space:nowrap;">' + k + '</td><td style="padding:2px 0;">' + props[k] + '</td></tr>';
        }).join('');
        var html = '<div style="font-size:11px; font-family:Inter; max-height:220px; overflow-y:auto;">' +
          '<b style="font-size:12px; color:' + popupAccent + '; display:block; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">📄 ' + (fileInfo ? fileInfo.filename : '') + '</b>' +
          '<table>' + rows + '</table></div>';
        layer.bindPopup(html);
      }
    });
    geojsonLayer.addTo(SPATIAL_UPLOAD_LAYER);
    return geojsonLayer;
  } catch(e) { return null; }
}

/* ── Zoom ke polygon tertentu ── */
function zoomToSpatialFile(fileId) {
  var f = SPATIAL_FILES_CACHE.find(function(c) { return c.fileId === fileId; });
  if (!f) { showToast('File tidak ditemukan.'); return; }
  loadSpatialGeoJSONForFile(f).then(function(gj) {
    try {
      var gjLayer = L.geoJSON(gj);
      if (gjLayer) { mapObj.fitBounds(gjLayer.getBounds(), {padding: [40,40]}); closeSpatialModal(); }
    } catch(e) { showToast('Gagal zoom: ' + e.message); }
  }).catch(function(err) { showToast('Gagal memuat file: ' + err.message); });
}

/* ── Hapus polygon dari Drive, Sheet, dan peta ── */
function deleteSpatialFile(fileId, filename) {
  if (!confirm('Yakin ingin menghapus polygon "' + filename + '"?\nFile akan dihapus dari Google Drive dan Database secara permanen.')) return;
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.indexOf('script.google.com') === -1) { showToast('Backend GAS belum dikonfigurasi!'); return; }
  var itemEl = document.getElementById('sp-item-' + fileId);
  if (itemEl) { itemEl.style.opacity = '0.4'; itemEl.style.pointerEvents = 'none'; }
  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify(withAuthPayload({ action: 'deleteSpatial', fileId: fileId }))
  }).then(function(r) { return r.json(); })
  .then(function(res) {
    if (res.success) {
      SPATIAL_FILES_CACHE = SPATIAL_FILES_CACHE.filter(function(c) { return c.fileId !== fileId; });
      delete SPATIAL_GEOJSON_MEM[fileId];
      try { localStorage.removeItem('sp_bbox_' + fileId); } catch (e) {}
      renderSpatialPolygons();
      fetchSpatialFileList();
      showToast('✓ Polygon "' + filename + '" berhasil dihapus.');
    } else { showToast('Gagal hapus: ' + (res.error || 'Error backend')); if (itemEl) { itemEl.style.opacity = '1'; itemEl.style.pointerEvents = ''; } }
  }).catch(function(err) { showToast('Error: ' + err.message); if (itemEl) { itemEl.style.opacity = '1'; itemEl.style.pointerEvents = ''; } });
}

/* ── Progress helpers ── */
function showSpatialProgress(pct, text) {
  var pw = document.getElementById('spatial-progress-wrap');
  var pb = document.getElementById('sp-progress-bar');
  var pt = document.getElementById('sp-progress-text');
  if (pw) pw.style.display = 'block';
  if (pb) pb.style.width = pct + '%';
  if (pt) pt.textContent = text || '';
}
function hideSpatialProgress() {
  var pw = document.getElementById('spatial-progress-wrap');
  setTimeout(function() { if (pw) pw.style.display = 'none'; }, 1500);
}

/* ── Auto-fetch saat halaman selesai dimuat ── */
function initSpatialSystem() {
  if (!getAuthToken()) return;
  if (GAS_WEB_APP_URL && GAS_WEB_APP_URL.indexOf('script.google.com') !== -1) {
    fetch(appendAuthParam(GAS_WEB_APP_URL + '?action=getSpatialFiles'))
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.success && res.files) {
          res.files.forEach(function(f) {
            f.bbox = normalizeSpatialBBox(f.bbox) || getSpatialBBoxFromLS(f.fileId);
          });
          SPATIAL_FILES_CACHE = res.files;
          if (res.files.length) {
            var toggle = document.getElementById('toggle-spatial');
            if (toggle && !toggle.checked) { toggle.checked = true; SPATIAL_ENABLED = true; }
          }
          bindSpatialMapEvents();
          scheduleSpatialPolygonLoad(800);
        }
      }).catch(function() {});
  }
}


/**
 * Generator Poligon Organik 2 Ha
 * Luas 2 Ha = 20.000 meter persegi.
 * Jari-jari lingkaran ekuivalen = ~79.8 meter.
 */
function generateOrganicPolygon(lat, lng, areaHa) {
  var areaSqm = (areaHa || 2) * 10000;
  var baseRadiusM = Math.sqrt(areaSqm / Math.PI); // ~79.8m
  var points = 8; // Octagon
  var latlngs = [];
  
  // Konversi meter ke derajat
  var rEarth = 6378137; // radius bumi
  
  for (var i = 0; i < points; i++) {
    var angle = (i * 360 / points) * (Math.PI / 180);
    // Tambahkan variasi acak agar terlihat tidak beraturan (-15% sampai +15%)
    var randomRadius = baseRadiusM * (0.85 + Math.random() * 0.3);
    
    var dLat = randomRadius * Math.cos(angle) / rEarth;
    var dLng = randomRadius * Math.sin(angle) / (rEarth * Math.cos(lat * Math.PI / 180));
    
    latlngs.push([lat + (dLat * 180 / Math.PI), lng + (dLng * 180 / Math.PI)]);
  }
  return latlngs;
}

/** Placeholder Import Data GeoJSON Resmi PJL */
var OFFICIAL_PJL_GEOJSON_URL = ''; // Isi dengan link GeoJSON/SHP asli nanti
function loadOfficialPjlPolygons() {
  if(!OFFICIAL_PJL_GEOJSON_URL) return;
  fetch(OFFICIAL_PJL_GEOJSON_URL)
    .then(res => res.json())
    .then(data => {
      // Ganti logika poligon fiktif dengan render GeoJSON asli
      console.log('GeoJSON Resmi Dimuat', data);
    }).catch(err => console.error('Gagal memuat GeoJSON Resmi:', err));
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
function mapsLink(lat, lng) { return '<a href="https://www.google.com/maps?q='+lat+','+lng+'" target="_blank" class="drawer-maps-link">Buka di Google Maps</a>'; }

function buildMarkerTipPanel(title, rows, titleColor) {
  var color = titleColor || '#333';
  var html = '<div class="marker-tip-panel">';
  if (title) html += '<div class="marker-tip-title" style="color:' + color + '">' + title + '</div>';
  (rows || []).forEach(function(row) {
    var v = row[1];
    if (v == null || v === '') v = '-';
    html += '<div class="marker-tip-row"><span class="marker-tip-lbl">' + row[0] + '</span><span class="marker-tip-val">' + v + '</span></div>';
  });
  return html + '</div>';
}

function buildFeatureHoverTooltip(feat, mode) {
  if (!feat) return null;
  var title = feat.Nama || feat['Nama'] || feat['Nama Lengkap'] || feat['Nama Petugas'] || 'Detail Kegiatan';
  var rows = [];
  if (mode === 'point') {
    rows = [
      ['Kegiatan', feat.Kegiatan || feat['Kegiatan'] || '-'],
      ['Lokasi', feat.Lokasi || feat['Lokasi'] || '-'],
      ['Kabupaten', feat.Kabupaten || feat['Kabupaten'] || '-'],
      ['Koordinat', coordText(feat.Latitude || feat._lat || '', feat.Longitude || feat._lng || '')]
    ];
  } else {
    rows = [
      ['Kegiatan', feat.Kegiatan || feat['Kegiatan'] || '-'],
      ['Luas (Ha)', feat.Luas_Ha || feat['Luas_Ha'] || feat.Luas || '-'],
      ['Jenis Bibit', feat.Jenis_Bibit || feat['Jenis_Bibit'] || '-'],
      ['Kabupaten', feat.Kabupaten || feat['Kabupaten'] || '-']
    ];
  }
  return buildMarkerTipPanel(title, rows, '#2e7d32');
}

function buildPjlPopupRow(label, value) {
  var v = value == null || value === '' ? '-' : value;
  return '<div class="pjl-popup-row"><span class="pjl-popup-lbl">' + label + '</span><span class="pjl-popup-val">' + v + '</span></div>';
}

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
      ['Petugas Lapangan', r['Penyuluh Kehutanan']],
      ['PEH', r['Pengendali Ekosistem Hutan (PEH)'] || r['PEH']],
      ['Link BA', linkOrNA(r['Upload Link BA Jaga Leuweung (Validasi, surat pengantar desa, dll.)'] || r['Upload Link BA Jaga Leuweung'] || r['Link BA'])],
      ['Link SK', linkOrNA(r['Upload Link SK Penetapan / Penerima Manfaat Jaga Leuweung'] || r['Upload Link SK Penetapan/Penerima Manfaat'] || r['Link SK'])]
    ];
    var _pjlPhotoRow = r;
  } else if (type === 'per' || type === 'persemaian') {
    var ket = String(r['Keterangan'] || '');
    var totalBibit = 0;
    var matches = ket.match(/\(\s*(\d+)\s*\)/g);
    if (matches) {
      matches.forEach(function(m) {
        totalBibit += parseInt(m.replace(/\D/g, ''), 10);
      });
    }
    var totalBibitStr = '<strong style="color:#43a047; font-size:12px;">' + totalBibit.toLocaleString('id-ID') + '</strong>';

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
      ['Ket.(Jenis & Jumlah Bibit) :', ket],
      ['Total Bibit', totalBibit > 0 ? totalBibitStr : '0']
    ];
  } else if (type === 'peg' || type === 'pegawai') {
    config = [
      ['Nama', r['Nama'] || r['NAMA']],
      ['Unit Kerja', r['Unit Kerja'] || r['UNIT KERJA']],
      ['Jabatan', r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN']],
      ['Alamat', r['Alamat'] || r['ALAMAT']],
      ['Koordinat', coordText(lat, lng)]
    ];
    var _pegPhotoRow = r;
  } else if (type === 'pohon' || type === 'polygon_kegiatan') {
    var pgLat = toFloat(r['Latitude']) || lat;
    var pgLng = toFloat(r['Longitude']) || lng;
    config = [
      ['CDK Wilayah', r['CDK_Wilayah'] || r['CDK Wilayah']],
      ['Nama', r['Nama']],
      ['Kabupaten', r['Kabupaten']],
      ['Kecamatan', r['Kecamatan']],
      ['Desa/Blok', r['Desa_Blok'] || r['Desa/Blok']],
      ['Lokasi', r['Lokasi']],
      ['Kegiatan', r['Kegiatan']],
      ['Luas (Ha)', r['Luas_Ha'] || r['Luas']],
      ['Jenis Bibit', r['Jenis_Bibit'] || r['Jenis Bibit']],
      ['Jumlah Bibit', r['Jumlah_Bibit'] || r['Jumlah Bibit']],
      ['Koordinat', coordText(pgLat, pgLng)],
      ['Keterangan', r['Keterangan']],
      ['Tanggal Input', formatDateIndo(r['Tanggal_Input'] || r['Tanggal Input'])]
    ];
    var _pohonPhotoRow = r;
    cy = pgLat; cx = pgLng;
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
    html += '<div class="detail-item"><span class="detail-lbl">'+item[0]+'</span><span class="detail-val">'+v+'</span></div>';
  });
  if (cy && cx) html += '<div class="drawer-maps-wrap">' + mapsLink(cy, cx) + '</div>';

  if (type === 'pohon' || type === 'polygon_kegiatan') {
    var featId = String(r['ID'] || r.featureId || r.id || '');
    if (featId) {
      html += '<div class="drawer-action-row"><button class="drawer-delete-btn" onclick="deletePolygonKegiatan(\'' + featId + '\')">Hapus Kegiatan</button></div>';
    }
  }

  // Inject photo gallery for Jumat Menanam & PJL & Pegawai & Pohon
  if ((type === 'jum' || type === 'jumat') && typeof _jumPhotoRow !== 'undefined') {
    html += buildPhotoSection(_jumPhotoRow, 'juna');
  }
  if (type === 'pjl' && typeof _pjlPhotoRow !== 'undefined') {
    html += buildPhotoSection(_pjlPhotoRow, 'pjl');
  }
  if ((type === 'peg' || type === 'pegawai') && typeof _pegPhotoRow !== 'undefined') {
    html += buildPhotoSection(_pegPhotoRow, 'pegawai');
  }
  if ((type === 'pohon' || type === 'polygon_kegiatan') && typeof _pohonPhotoRow !== 'undefined') {
    html += buildPhotoSection(_pohonPhotoRow, 'polygon');
  }

  if (c) c.innerHTML = html;
  
  // Init gallery state after DOM injection
  if ((type === 'jum' || type === 'jumat') && typeof _jumPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'juna';
    PHOTO_GALLERY.row = _jumPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_jumPhotoRow, 'juna');
    PHOTO_GALLERY.idx = 0;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  if (type === 'pjl' && typeof _pjlPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'pjl';
    PHOTO_GALLERY.row = _pjlPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_pjlPhotoRow, 'pjl');
    PHOTO_GALLERY.idx = 0;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  if ((type === 'peg' || type === 'pegawai') && typeof _pegPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'pegawai';
    PHOTO_GALLERY.row = _pegPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_pegPhotoRow, 'pegawai');
    PHOTO_GALLERY.idx = 0;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  if ((type === 'pohon' || type === 'polygon_kegiatan') && typeof _pohonPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'polygon';
    PHOTO_GALLERY.row = _pohonPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_pohonPhotoRow, 'polygon');
    PHOTO_GALLERY.idx = 0;
    refreshGalleryForYear(PHOTO_GALLERY.year);
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

  if (type === 'pjl') {
    var coordKey = lat + ',' + lng;
    var polyCoords = GLOBAL_POLY_COORDS[coordKey];
    if (polyCoords && polyCoords.length > 0) {
      var measureLine = L.polyline([[lat, lng], polyCoords[0]], {
        color: '#ffb74d', weight: 2, dashArray: '4, 4'
      }).bindTooltip('r ≈ 79.8m<br>Luas ±2 Ha', {permanent: true, direction: 'center', className: 'measure-tooltip'});
      measureLine.addTo(BUFFER_LAYERS);
    }
  }

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
    var gidMatch = String(url || '').match(/[?&]gid=([^&]+)/);
    var sourceGid = gidMatch ? decodeURIComponent(gidMatch[1]) : '';
    Papa.parse(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: function(res) {
        var rows = Array.isArray(res.data) ? res.data : [];
        rows.forEach(function(r, idx) {
          if (!r || typeof r !== 'object') return;
          r._source_gid = sourceGid;
          r._row_idx = idx + 2;
          r._data_type = type;
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
      // Inisialisasi sistem polygon spasial setelah semua data siap
      if (typeof initSpatialSystem === 'function') initSpatialSystem();
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
  pop('f_penyuluh', S.penyuluh, 'Semua Petugas Lapangan'); pop('f_kategori_lojuna', S.kategori_lojuna, 'Semua Kategori');
}

var GLOBAL_POLY_COORDS = {};
/* Render Engine */
function schedRender() { clearTimeout(RTIMER); RTIMER = setTimeout(doRender, 100); }
function doRender() {
  var cnt = { pjl: 0, per: 0, peg: 0, jum: 0 };
  
  if (HEATMAP_LAYER) { mapObj.removeLayer(HEATMAP_LAYER); HEATMAP_LAYER = null; }
  var heatData = [];
  var pegJumPoints = [];
  var pegNames = [];
  var jumNames = [];
  GLOBAL_POLY_COORDS = {};
  var isFilterActive = Object.values(FILTER).some(arr => arr.length > 0);

  ['pjl', 'per', 'peg', 'jum'].forEach(type => {
    if(LAYERS[type]) mapObj.removeLayer(LAYERS[type]);
    if(CLUSTER_ENABLED && typeof L.markerClusterGroup !== 'undefined') {
      LAYERS[type] = L.markerClusterGroup({ disableClusteringAtZoom: 16, maxClusterRadius: 50 });
    } else {
      LAYERS[type] = L.layerGroup();
    }
  });
  
  if (PJL_POLYGON_LAYER) { mapObj.removeLayer(PJL_POLYGON_LAYER); PJL_POLYGON_LAYER = null; }
  PJL_POLYGON_LAYER = L.layerGroup();

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
            var thumbYear = getCurrentPhotoYear(r, 'juna');
            var thumbMerged = getMergedData(r, thumbYear, 'juna');
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
                '<div class="jum-tooltip-thumb-year">&#128247; Foto ' + thumbYear + ' &bull; ' + (thumbMerged.dates[0] ? formatDateIndo(thumbMerged.dates[0]) : kat2) + '</div>' +
                infoHtml +
                '</div>';
            } else {
              hoverHTML = '<div class="jum-tooltip-no-img">' +
                '<div style="font-weight:700;font-size:11px;margin-bottom:3px;">' + name + '</div>' +
                '<div style="font-size:10px;color:#8e24aa;font-weight:600;">' + kat2 + '</div>' +
                infoHtml +
                '</div>';
            }
          } else if (type === 'pjl') {
            var pjlYear = getCurrentPhotoYear(r, 'pjl');
            var pjlMerged = getMergedData(r, pjlYear, 'pjl');
            var pjlThumb = pjlMerged.photos.length > 0 ? pjlMerged.photos[0] : null;
            var pjlCdk = r['Unit Kerja'] || '-';
            var pjlAlamat = r['Alamat'] || '-';
            var cPen = coordText(toFloat(r['Titik Koordinat Penanaman (Y)']), toFloat(r['Titik Koordinat Penanaman (X)']));
            var cPer = coordText(toFloat(r['Titik Koordinat Persemaian (Y)']), toFloat(r['Titik Koordinat Persemaian (X)']));
            var pjlInfo = '<div class="pjl-tooltip-info">' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">CDK</span><span class="marker-tip-val">' + pjlCdk + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Alamat</span><span class="marker-tip-val">' + pjlAlamat + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Koord. Penanaman</span><span class="marker-tip-val">' + cPen + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Koord. Persemaian</span><span class="marker-tip-val">' + cPer + '</span></div>' +
              '</div>';
            if (pjlThumb) {
              hoverHTML = '<div class="jum-tooltip-thumb pjl-tooltip-thumb">' +
                '<img src="' + pjlThumb + '" alt="foto PJL" onerror="handleDriveImageError(this);" />' +
                '<div class="jum-tooltip-thumb-name">' + name + '</div>' +
                '<div class="jum-tooltip-thumb-year">&#128247; ' + (pjlMerged.dates[0] ? formatDateIndo(pjlMerged.dates[0]) : 'Foto ' + pjlYear) + '</div>' +
                pjlInfo +
                '</div>';
            } else {
              hoverHTML = '<div class="jum-tooltip-no-img">' +
                '<div style="font-weight:700;font-size:11px;margin-bottom:3px;">' + name + '</div>' +
                '<div style="font-size:10px;color:#2e7d32;font-weight:600;">Petugas Jaga Leuweung</div>' +
                pjlInfo +
                '</div>';
            }
          } else if (type === 'per') {
            var ketTip = String(r['Keterangan'] || '');
            var totalBibitTip = 0;
            var matchesTip = ketTip.match(/\(\s*(\d+)\s*\)/g);
            if (matchesTip) {
              matchesTip.forEach(function(m) { totalBibitTip += parseInt(m.replace(/\D/g, ''), 10); });
            }
            var totalBibitStrTip = '<strong style="color:#43a047;">' + totalBibitTip.toLocaleString('id-ID') + '</strong>';

            hoverHTML = buildMarkerTipPanel(
              name || 'Lokasi Persemaian',
              [
                ['Unit Kerja', r['Unit Kerja']],
                ['Kecamatan', r['Kecamatan']],
                ['Desa/Kelurahan', r['Desa/ Kelurahan'] || r['Desa/Kelurahan'] || r['Desa']],
                ['Blok', r['Blok']],
                ['Petugas JL', r['Nama Personil Jaga leuweung'] || r['Nama Personil Jaga Leuweung'] || r['Nama']],
                ['Status', r['Status Persemaian']],
                ['Tahapan', r['Tahapan Kegiatan'] || r['Tahapan']],
                ['Luas (Ha)', r['Luas (Ha)'] || r['Luas']],
                ['Target Bibit', r['Target Bibit']],
                ['Realisasi', r['Realisasi Bibit'] || r['Realisasi']],
                ['Ket.(Jenis & Jumlah Bibit) :', ketTip],
                ['Total Bibit', totalBibitTip > 0 ? totalBibitStrTip : '0']
              ],
              '#1e88e5'
            );
          } else if (type === 'peg') {
            var pegYear = getCurrentPhotoYear(r, 'pegawai');
            var pegMerged = getMergedData(r, pegYear, 'pegawai');
            var pegThumb = pegMerged.photos.length > 0 ? pegMerged.photos[0] : null;
            var pegUnit = r['Unit Kerja'] || r['UNIT KERJA'] || '-';
            var pegJabatan = r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN'] || '-';
            var pegAlamat = r['Alamat'] || r['ALAMAT'] || '-';
            var pegInfo = '<div class="pjl-tooltip-info">' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Unit</span><span class="marker-tip-val">' + pegUnit + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Jabatan</span><span class="marker-tip-val">' + pegJabatan + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Alamat</span><span class="marker-tip-val">' + String(pegAlamat).substring(0,50) + (pegAlamat.length>50?'...':'') + '</span></div>' +
              '</div>';
            if (pegThumb) {
              hoverHTML = '<div class="jum-tooltip-thumb pjl-tooltip-thumb" style="border-top:2px solid #fb8c00;">' +
                '<img src="' + pegThumb + '" alt="foto pegawai" onerror="handleDriveImageError(this);" />' +
                '<div class="jum-tooltip-thumb-name">' + name + '</div>' +
                '<div class="jum-tooltip-thumb-year" style="color:#fb8c00;">&#128247; ' + (pegMerged.dates[0] ? formatDateIndo(pegMerged.dates[0]) : 'Foto ' + pegYear) + '</div>' +
                pegInfo +
                '</div>';
            } else {
              hoverHTML = '<div class="jum-tooltip-no-img">' +
                '<div style="font-weight:700;font-size:11px;margin-bottom:3px;">' + name + '</div>' +
                '<div style="font-size:10px;color:#fb8c00;font-weight:600;">Pegawai Dinas Kehutanan</div>' +
                pegInfo +
                '</div>';
            }
          }
          mk.bindTooltip(hoverHTML, { className: 'marker-tooltip', direction: 'top', offset: [0, -8], opacity: 0.95 });
        }
        mk.addTo(LAYERS[type]);
        
        // Auto-generate 2 Ha Area for PJL
        if (type === 'pjl' && typeof generateOrganicPolygon === 'function') {
           var coordKey = r._lat + ',' + r._lng;
           if (!GLOBAL_POLY_COORDS[coordKey]) {
             var polyCoords = generateOrganicPolygon(r._lat, r._lng, 2);
             GLOBAL_POLY_COORDS[coordKey] = polyCoords;
             var poly = L.polygon(polyCoords, {
               color: '#2E7D32',
               weight: 2,
               fillColor: '#81C784',
               fillOpacity: 0.3,
               dashArray: '40, 4'
             });

             var cPenanaman = r['Titik Koordinat Penanaman (Y)'] && r['Titik Koordinat Penanaman (X)'] ? 
                              r['Titik Koordinat Penanaman (Y)'] + ', ' + r['Titik Koordinat Penanaman (X)'] : 'Data tidak tersedia';
             var cPersemaian = r['Titik Koordinat Persemaian (Y)'] && r['Titik Koordinat Persemaian (X)'] ? 
                               r['Titik Koordinat Persemaian (Y)'] + ', ' + r['Titik Koordinat Persemaian (X)'] : 'Data tidak tersedia';

             var popHtml = '<div class="pjl-popup-content">' +
               '<div class="pjl-popup-title">Area Tanam 2 Ha</div>' +
               buildPjlPopupRow('Petugas', name) +
               buildPjlPopupRow('Nama Lengkap', r['Nama Lengkap'] || r['Nama Petugas'] || r['Nama']) +
               buildPjlPopupRow('Alamat', r['Alamat']) +
               buildPjlPopupRow('Koord. Penanaman', cPenanaman) +
               buildPjlPopupRow('Koord. Persemaian', cPersemaian) +
               buildPjlPopupRow('Kawasan', r['Kawasan Leuweung/ Gunung']) +
               buildPjlPopupRow('Wil. Binaan Kuncen', r['Wilayah Binaan Kuncen']) +
               buildPjlPopupRow('Wil. Binaan JL', r['Wilayah Binaan Jaga Leuweung']) +
               buildPjlPopupRow('Petugas Lapangan', r['Penyuluh Kehutanan']) +
               buildPjlPopupRow('PEH', r['PEH']) +
               '</div>';

             poly.bindPopup(popHtml, { maxWidth: 340, minWidth: 260, className: 'pjl-leaflet-popup' });
             poly.addTo(PJL_POLYGON_LAYER);
           }
        }
        
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

  // Adding polygon layer back if toggle is active
  if (PJL_POLYGON_ENABLED && PJL_POLYGON_LAYER) {
    PJL_POLYGON_LAYER.addTo(mapObj);
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
  if (typeof renderSpatialPolygons === 'function') renderSpatialPolygons(true);
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
    if (item.t === 'pjl') jabat = 'Petugas Lapangan';
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
   📸 PHOTO GALLERY – JUNA PERMANEN & PJL
   ═══════════════════════════════════════════════════════════ */

var PHOTO_YEARS = ['2026','2027','2028','2029','2030'];
var BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

var PHOTO_GALLERY = { context: 'juna', row: null, year: '2026', idx: 0, photos: [], dates: [], sheetCount: 0, localCount: 0 };
var JUM_GALLERY = PHOTO_GALLERY;
var LB_STATE = { photos: [], dates: [], idx: 0, year: '2026', locName: '', context: 'juna' };

function getPhotoContextPrefix(context) {
  if (context === 'pjl') return 'pjl';
  if (context === 'pegawai') return 'peg';
  if (context === 'polygon') return 'poly';
  return 'jum';
}

function getPhotoRowId(r) {
  return r._row_idx || r.id || r['No'] || (r._lat + '_' + r._lng);
}

function getPhotoCoords(r) {
  var lat = toFloat(r['Titik Koordinat Penanaman (Y)']) || toFloat(r['Titik Koordinat (Y)']) ||
            toFloat(r['latitude']) || toFloat(r['Latitude']) || toFloat(r['Latitude']) || r._lat;
  var lng = toFloat(r['Titik Koordinat Penanaman (X)']) || toFloat(r['Titik Koordinat (x)']) ||
            toFloat(r['Titik Koordinat (X)']) || toFloat(r['longitude']) || toFloat(r['Longitude']) || r._lng;
  return {
    lat: parseFloat(String(lat).replace(',', '.')),
    lng: parseFloat(String(lng).replace(',', '.'))
  };
}

/** Format tanggal ke Bahasa Indonesia, mis. 17/06/2026 → 17 Juni 2026 */
function formatDateIndo(dStr) {
  if (!dStr) return '';
  var s = String(dStr).trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    var day = parseInt(m[1], 10);
    var monthIdx = parseInt(m[2], 10) - 1;
    var year = m[3];
    if (monthIdx >= 0 && monthIdx < 12) {
      var out = day + ' ' + BULAN_ID[monthIdx] + ' ' + year;
      if (m[4]) out += ' · ' + String(m[4]).padStart(2, '0') + ':' + m[5];
      return out;
    }
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (m) {
    var day2 = parseInt(m[3], 10);
    var monthIdx2 = parseInt(m[2], 10) - 1;
    if (monthIdx2 >= 0 && monthIdx2 < 12) {
      var out2 = day2 + ' ' + BULAN_ID[monthIdx2] + ' ' + m[1];
      if (m[4]) out2 += ' · ' + m[4] + ':' + m[5];
      return out2;
    }
  }
  return s;
}

/** Parse DD/MM/YYYY [HH:mm] into timestamp for sorting */
function parseExifDate(dStr) {
  if (!dStr) return 0;
  var s = String(dStr).trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    var h = m[4] ? parseInt(m[4], 10) : 0;
    var min = m[5] ? parseInt(m[5], 10) : 0;
    return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), h, min).getTime();
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)).getTime();
  var ts = Date.parse(s);
  return isNaN(ts) ? 0 : ts;
}

/** Parse pipe-separated values from a spreadsheet cell */
function parsePipeField(val) {
  if (!val || !String(val).trim()) return [];
  return String(val).split('|').map(function(s) { return s.trim(); }).filter(Boolean);
}

function getRowPhotos(r, year) {
  var urls = parsePipeField(r['Foto_' + year]);
  var res = [];
  urls.forEach(function(u) {
    if (!extractDriveFolderId(u)) res.push(normalizeImageUrl(u));
  });
  return res;
}

function getRowDates(r, year) {
  return parsePipeField(r['Tanggal_' + year]);
}

function getJumPhotos(r, year) { return getRowPhotos(r, year); }
function getJumDates(r, year) { return getRowDates(r, year); }

function getCurrentPhotoYear(r, context) {
  context = context || PHOTO_GALLERY.context || 'juna';
  var todayStr = String(new Date().getFullYear());
  if (getMergedData(r, todayStr, context).photos.length > 0) return todayStr;
  for (var i = 0; i < PHOTO_YEARS.length; i++) {
    if (getMergedData(r, PHOTO_YEARS[i], context).photos.length > 0) return PHOTO_YEARS[i];
  }
  return todayStr;
}

function getGalleryDomIds(context) {
  if (context === 'pjl') {
    return { section: 'pjl-photo-section', timeline: 'pjl-year-timeline', carousel: 'pjl-carousel-wrap' };
  }
  if (context === 'pegawai') {
    return { section: 'peg-photo-section', timeline: 'peg-year-timeline', carousel: 'peg-carousel-wrap' };
  }
  if (context === 'polygon') {
    return { section: 'poly-photo-section', timeline: 'poly-year-timeline', carousel: 'poly-carousel-wrap' };
  }
  return { section: 'jum-photo-section', timeline: 'jum-year-timeline', carousel: 'jum-carousel-wrap' };
}

function buildPhotoSection(r, context) {
  context = context || 'juna';
  var ids = getGalleryDomIds(context);
  var title = 'Dokumentasi Foto Lokasi';
  var accent = '#8e24aa';
  if (context === 'pjl') { title = 'Dokumentasi Tanam & Pelihara Pohon (PJL)'; accent = '#2e7d32'; }
  else if (context === 'pegawai') { title = 'Dokumentasi Foto Pegawai'; accent = '#fb8c00'; }
  else if (context === 'polygon') { title = 'Dokumentasi Kegiatan (Tanam & Pelihara)'; accent = '#388e3c'; }

  var html = '<div class="jum-photo-section" id="' + ids.section + '">';
  html += '<div class="jum-photo-section-title">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + accent + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
    title + '</div>';

  html += '<div class="year-timeline" id="' + ids.timeline + '">';
  PHOTO_YEARS.forEach(function(yr) {
    var mergedYr = getMergedData(r, yr, context);
    var hasPhoto = mergedYr.photos.length > 0;
    var photoCount = mergedYr.photos.length;
    var isActive = (yr === getCurrentPhotoYear(r, context));
    html += '<button class="year-pill' + (isActive ? ' active' : '') + (hasPhoto ? ' has-photo' : '') + '"' +
      ' data-year="' + yr + '"' +
      ' onclick="changeGalleryYear(\'' + yr + '\')"' +
      ' title="' + (hasPhoto ? photoCount + ' foto tersedia' : 'Belum ada foto') + '">' +
      yr + '</button>';
  });
  html += '</div>';

  html += '<div id="' + ids.carousel + '" class="jum-carousel-wrap">' +
    '<div class="jum-no-photo">' +
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
    '<span>Memuat foto...</span></div></div>';

  var deleteBtnHtml = '';
  if (context === 'polygon') {
    var featId = r['ID'] || r.featureId || '';
    deleteBtnHtml = '<button class="jum-upload-btn" style="background:#e53935; color:#fff; border-color:#c62828; margin-right:auto;" onclick="deletePolygonKegiatan(\'' + featId + '\')">' +
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>' +
      ' Hapus Kegiatan</button>';
  }

  html += '<div style="margin-top:10px; display:flex; justify-content:flex-end;">' +
    deleteBtnHtml +
    '<button class="jum-upload-btn" onclick="openUploadModal(PHOTO_GALLERY.row)">' +
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
    ' Upload Foto Baru</button></div>';

  html += '</div>';
  return html;
}

function buildJumPhotoSection(r) { return buildPhotoSection(r, 'juna'); }

/** Refresh carousel display for selected year */
function refreshGalleryForYear(year) {
  if (!PHOTO_GALLERY.row) return;
  var r = PHOTO_GALLERY.row;
  var context = PHOTO_GALLERY.context || 'juna';
  var ids = getGalleryDomIds(context);
  PHOTO_GALLERY.year = year;
  
  var pills = document.querySelectorAll('#' + ids.timeline + ' .year-pill, #upload-year-pills .year-pill');
  pills.forEach(function(p) {
    p.classList.remove('active');
    if ((p.getAttribute('data-year') || p.textContent.trim()) === year) p.classList.add('active');
  });

  var wrap = document.getElementById(ids.carousel);
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
      fetch(appendAuthParam(GAS_WEB_APP_URL + "?action=getFolder&folderId=" + encodeURIComponent(folderId)))
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
    applyGalleryData(getMergedData(r, year, context));
  }

  function processExtractedFolder(files) {
    var sheetPhotos = files.map(function(f) { return normalizeImageUrl(f.url); });
    var combined = [];
    files.forEach(function(f) {
      combined.push({ url: normalizeImageUrl(f.url), date: f.date, timestamp: parseExifDate(f.date), isLocal: false });
    });
    
    var locals = getLocalPhotos(r, year, context);
    locals.forEach(function(l) {
      var lNorm = normalizeImageUrl(l.url);
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
    PHOTO_GALLERY.photos = _merged.photos;
    PHOTO_GALLERY.dates = _merged.dates;
    PHOTO_GALLERY.sheetCount = _merged.sheetCount;
    PHOTO_GALLERY.localCount = _merged.localCount;
    PHOTO_GALLERY.isLocalMap = _merged.isLocalMap;
    PHOTO_GALLERY.idx = 0;

    if (_merged.photos.length === 0) {
      wrap.innerHTML = '<div class="jum-no-photo">' +
        '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
        '<span>Belum ada foto untuk tahun <strong style="color:#ab47bc">' + year + '</strong></span>' +
        '<span style="font-size:10px;opacity:0.6;">Tambahkan foto di kolom Foto_' + year + ' spreadsheet</span>' +
        '</div>';
      return;
    }
    renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
  }
}

/** Render carousel with photos array */
function renderCarousel(photos, dates) {
  var context = PHOTO_GALLERY.context || 'juna';
  var ids = getGalleryDomIds(context);
  var wrap = document.getElementById(ids.carousel);
  if (!wrap) return;
  var idx = PHOTO_GALLERY.idx;
  var url = photos[idx] || '';
  var date = dates[idx] || '';
  var dateDisplay = formatDateIndo(date);
  var total = photos.length;
  var isLocalPhoto = (PHOTO_GALLERY.isLocalMap && PHOTO_GALLERY.isLocalMap[idx]);

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
      '<img class="jum-carousel-img" id="jum-car-img" src="' + url + '" alt="Foto ' + PHOTO_GALLERY.year + '"' +
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
        (dateDisplay ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' + dateDisplay : '<span style="opacity:0.4;">Tanggal tidak tersedia</span>') +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        deleteBtn +
        '<div class="jum-photo-counter">' + (idx+1) + ' / ' + total + '</div>' +
      '</div>' +
    '</div>';
}

/** Navigate carousel */
function navCarousel(dir) {
  var total = PHOTO_GALLERY.photos.length;
  PHOTO_GALLERY.idx = Math.max(0, Math.min(total - 1, PHOTO_GALLERY.idx + dir));
  renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
  if (document.getElementById('photo-lightbox').classList.contains('open')) {
    LB_STATE.idx = PHOTO_GALLERY.idx;
    refreshLightbox();
  }
}

function jumpCarousel(i) {
  PHOTO_GALLERY.idx = i;
  renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
}

/** Change gallery year from timeline pill click */
function changeGalleryYear(year) {
  refreshGalleryForYear(year);
}

/* ─── FULLSCREEN LIGHTBOX ─── */

/** Open fullscreen lightbox with current gallery state */
function openPhotoLightbox() {
  var photos = PHOTO_GALLERY.photos;
  if (!photos || photos.length === 0) return;
  LB_STATE.photos = photos;
  LB_STATE.dates = PHOTO_GALLERY.dates;
  LB_STATE.idx = PHOTO_GALLERY.idx;
  LB_STATE.year = PHOTO_GALLERY.year;
  LB_STATE.context = PHOTO_GALLERY.context || 'juna';
  
  if (PHOTO_GALLERY.row) {
    var r = PHOTO_GALLERY.row;
    if (LB_STATE.context === 'pjl') {
      var cPen = coordText(toFloat(r['Titik Koordinat Penanaman (Y)']), toFloat(r['Titik Koordinat Penanaman (X)']));
      var cPer = coordText(toFloat(r['Titik Koordinat Persemaian (Y)']), toFloat(r['Titik Koordinat Persemaian (X)']));
      LB_STATE.locName = '<strong style="color:#fff;">' + getName(r) + '</strong><br/>' +
        (r['Unit Kerja'] || '-') + '<br/>' +
        '<span style="opacity:0.85;">' + (r['Alamat'] || '-') + '</span><br/>' +
        '<span style="opacity:0.7;font-size:10px;">Penanaman: ' + cPen + '<br/>Persemaian: ' + cPer + '</span>';
    } else {
      var name = getName(r);
      var cdk = r['Unit Kerja'] || r._cdk || '-';
      var kab = r['Kabupaten/Kota'] || r._kab || '-';
      var desa = r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || r['DESA'] || '-';
      var ket = r['Keterangan'] || '-';
      LB_STATE.locName = '<strong style="color:#fff;">' + name + '</strong><br/>' +
                         cdk + ' &bull; ' + kab + ' &bull; ' + desa + '<br/>' +
                         '<span style="opacity:0.7;font-size:10px;">' + ket + '</span>';
    }
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
  PHOTO_GALLERY.idx = LB_STATE.idx;
  renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
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
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' + formatDateIndo(date) :
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
  PHOTO_GALLERY.idx = i;
  renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
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
function getLocalPhotos(r, year, context) {
  context = context || PHOTO_GALLERY.context || 'juna';
  var key = getPhotoContextPrefix(context) + '_photos_' + getPhotoRowId(r) + '_' + year;
  try {
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function saveLocalPhotosToStorage(r, year, photosData, context) {
  context = context || PHOTO_GALLERY.context || 'juna';
  var key = getPhotoContextPrefix(context) + '_photos_' + getPhotoRowId(r) + '_' + year;
  localStorage.setItem(key, JSON.stringify(photosData));
}

function getDeletedPhotoIds(r, year, context) {
  try {
    context = context || PHOTO_GALLERY.context || 'juna';
    var key = getPhotoContextPrefix(context) + '_deleted_' + getPhotoRowId(r) + '_' + year;
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch(e) { return []; }
}
function addDeletedPhotoId(r, year, id, context) {
  context = context || PHOTO_GALLERY.context || 'juna';
  var ids = getDeletedPhotoIds(r, year, context);
  if (ids.indexOf(id) === -1) {
    ids.push(id);
    var key = getPhotoContextPrefix(context) + '_deleted_' + getPhotoRowId(r) + '_' + year;
    localStorage.setItem(key, JSON.stringify(ids));
  }
}

/** Merge spreadsheet photos and local photos, then sort by date newest first */
function getMergedData(r, year, context) {
  context = context || PHOTO_GALLERY.context || 'juna';
  var sheetPhotos = getRowPhotos(r, year);
  var sheetDates = getRowDates(r, year);
  var locals = getLocalPhotos(r, year, context);
  
  var combined = [];
  var deletedIds = getDeletedPhotoIds(r, year, context);
  
  for(var i=0; i<sheetPhotos.length; i++) {
    var url = sheetPhotos[i];
    var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    var sid = m ? m[1] : url;
    
    if (deletedIds.indexOf(sid) === -1) {
      var d = sheetDates[i] || '';
      combined.push({ url: url, date: d, timestamp: parseExifDate(d), isLocal: false });
    }
  }
  
  locals.forEach(function(l) {
    var lNorm = normalizeImageUrl(l.url);
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
  var r = PHOTO_GALLERY.row;
  var year = PHOTO_GALLERY.year;
  var context = PHOTO_GALLERY.context || 'juna';
  var idx = PHOTO_GALLERY.idx;
  var targetUrl = PHOTO_GALLERY.photos[idx];
  
  var targetMatch = targetUrl.match(/id=([a-zA-Z0-9_-]+)/) || targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  var targetId = targetMatch ? targetMatch[1] : targetUrl;
  
  var locals = getLocalPhotos(r, year, context);
  var filteredLocals = locals.filter(function(l) { 
    var m1 = l.url.match(/id=([a-zA-Z0-9_-]+)/) || l.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    var id1 = m1 ? m1[1] : l.url;
    return id1 !== targetId; 
  });
  saveLocalPhotosToStorage(r, year, filteredLocals, context);
  addDeletedPhotoId(r, year, targetId, context);

  showToast('Menghapus foto...', 'info');
  var btn = document.querySelector('.car-delete-btn');
  if(btn) btn.style.opacity = '0.5';

  var coords = getPhotoCoords(r);
  var catStr = 'juna';
  if (context === 'pjl') catStr = 'pjl';
  else if (context === 'pegawai') catStr = 'pegawai';
  else if (context === 'polygon') catStr = 'polygon';
  var payload = {
    action: "delete",
    url: targetUrl,
    lat: coords.lat,
    lng: coords.lng,
    year: year,
    category: catStr,
    rowIndex: r._row_idx || '',
    sheetGid: r._source_gid || '',
    featureId: r['ID'] || r.featureId || ''
  };

  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify(withAuthPayload(payload))
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
  var context = PHOTO_GALLERY.context || 'juna';
  if (locInfo) {
    if (context === 'pjl') {
      locInfo.innerHTML = '&#128205; ' + getName(r) + ' &bull; ' + (r['Unit Kerja'] || '');
    } else if (context === 'pegawai') {
      locInfo.innerHTML = '&#128205; ' + getName(r) + ' &bull; ' + (r['Unit Kerja'] || r['UNIT KERJA'] || '');
    } else if (context === 'polygon') {
      locInfo.innerHTML = '&#128205; ' + (r['Nama'] || 'Area Kegiatan') + ' &bull; ' + (r['Kegiatan'] || '');
    } else {
      locInfo.innerHTML = '&#128205; ' + getName(r) + ' &bull; ' + (r['Kabupaten/Kota'] || '');
    }
  }
  
  var modalTitle = document.querySelector('#upload-modal .modal-head h2');
  if (modalTitle) {
    if (context === 'pjl') modalTitle.textContent = 'Upload Dokumentasi Tanam & Pelihara (PJL)';
    else if (context === 'pegawai') modalTitle.textContent = 'Upload Foto Pegawai Dinas Kehutanan';
    else if (context === 'polygon') modalTitle.textContent = 'Upload Dokumentasi Kegiatan';
    else modalTitle.textContent = 'Upload Foto Dokumentasi';
  }
  
  var pillsWrap = document.getElementById('upload-year-pills');
  if (pillsWrap) {
    var pillsHtml = '';
    PHOTO_YEARS.forEach(function(yr) {
      var isActive = (yr === PHOTO_GALLERY.year);
      pillsHtml += '<button class="year-pill' + (isActive ? ' active' : '') + '"' +
        ' data-year="' + yr + '"' +
        ' type="button" onclick="selectUploadYear(\''+yr+'\')">' + yr + '</button>';
    });
    pillsWrap.innerHTML = pillsHtml;
  }
  document.getElementById('upload-year').value = PHOTO_GALLERY.year;
  
  // Reset input file
  var fi = document.getElementById('upload-files');
  if (fi) fi.value = '';
  
  m.classList.add('open');
}

function formatUploadDate(dateObj) {
  var d = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}

function parseExifDateString(raw) {
  if (!raw) return '';
  if (raw instanceof Date && !isNaN(raw.getTime())) return formatUploadDate(raw);
  var s = String(raw).trim();
  var m = s.match(/^(\d{4}):(\d{2}):(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' ' + String(m[4]).padStart(2, '0') + ':' + m[5] : '');
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' ' + String(m[4]).padStart(2, '0') + ':' + m[5] : '');
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return ('0' + m[1]).slice(-2) + '/' + ('0' + m[2]).slice(-2) + '/' + m[3] + (m[4] ? ' ' + String(m[4]).padStart(2, '0') + ':' + m[5] : '');
  return '';
}

function getFileExifDate(file) {
  return new Promise(function(resolve) {
    var settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      resolve(value || '');
    }
    var fallbackTimer = setTimeout(function() { finish(''); }, 1500);
    try {
      if (typeof EXIF === 'undefined' || !EXIF.getData) {
        clearTimeout(fallbackTimer);
        finish('');
        return;
      }
      EXIF.getData(file, function() {
        var raw = EXIF.getTag(this, "DateTimeOriginal") || EXIF.getTag(this, "DateTime") || EXIF.getTag(this, "DateTimeDigitized");
        clearTimeout(fallbackTimer);
        finish(parseExifDateString(raw));
      });
    } catch (e) {
      clearTimeout(fallbackTimer);
      finish('');
    }
  });
}

function readFileAsDataUrl(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) { resolve(e.target.result); };
    reader.onerror = function() { reject(new Error('Gagal membaca file foto.')); };
    reader.readAsDataURL(file);
  });
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

  var r = PHOTO_GALLERY.row;
  var year = document.getElementById('upload-year').value;
  var context = PHOTO_GALLERY.context || 'juna';
  var coords = getPhotoCoords(r);
  
  var btn = document.querySelector('#upload-modal .btn-apply');
  var oldText = btn.innerHTML;
  btn.innerHTML = 'Mengekstrak EXIF...';
  btn.disabled = true;

  var files = Array.from(fileInput.files);
  var successCount = 0;
  var failedCount = 0;

  function uploadOne(file, index) {
    btn.innerHTML = 'Menyiapkan foto (' + (index + 1) + '/' + files.length + ')...';
    return getFileExifDate(file)
      .then(function(exifDate) {
        var finalDateStr = exifDate || formatUploadDate(new Date());
        return readFileAsDataUrl(file).then(function(base64Full) {
          var base64Clean = String(base64Full).split(',')[1] || '';
          btn.innerHTML = 'Mengupload (' + (index + 1) + '/' + files.length + ')...';
          var catUpload = 'juna';
          if (context === 'pjl') catUpload = 'pjl';
          else if (context === 'pegawai') catUpload = 'pegawai';
          else if (context === 'polygon') catUpload = 'polygon';
          var payload = {
            action: "upload",
            base64: base64Clean,
            mimeType: file.type || "image/jpeg",
            lat: coords.lat,
            lng: coords.lng,
            year: year,
            date: finalDateStr,
            category: catUpload,
            rowIndex: r._row_idx || '',
            sheetGid: r._source_gid || '',
            featureId: r['ID'] || r.featureId || ''
          };

          return fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(withAuthPayload(payload))
          }).then(function(response) {
            return response.json();
          }).then(function(data) {
            if (!data.success) throw new Error(data.error || 'Upload gagal.');
            successCount++;
            var locals = getLocalPhotos(r, year, context);
            locals.push({ url: data.url, date: data.date || finalDateStr });
            saveLocalPhotosToStorage(r, year, locals, context);
          });
        });
      }).catch(function(err) {
        failedCount++;
        console.error("Upload Error:", err);
      });
  }

  files.reduce(function(chain, file, index) {
    return chain.then(function() { return uploadOne(file, index); });
  }, Promise.resolve()).then(function() {
    closeUploadModal();
    if (successCount > 0) {
      showToast(successCount + ' Foto berhasil diupload ke Spreadsheet!' + (failedCount ? ' ' + failedCount + ' gagal.' : ''), successCount === files.length ? 'success' : 'warning');
      refreshGalleryForYear(year);
    } else {
      showToast('Gagal mengupload foto. Cek console.', 'error');
    }
  }).finally(function() {
    btn.innerHTML = oldText;
    btn.disabled = false;
  });
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
/* ═══════════════════════════════════════════════════════════
   🌲 POLYGON KEGIATAN & POHON MARKER
   ═══════════════════════════════════════════════════════════ */

// ===== Coordinate helpers (supaya render polygon/titik kegiatan tidak tergantung file lain) =====
function toFloat(v) {
  if (v === null || v === undefined) return null;
  var s = String(v).trim();
  if (!s) return null;
  s = s.replace(/^['"`\s]+|['"`\s]+$/g, '');
  s = s.trim();
  var n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

var POLYGON_AREA_LAYER = new L.FeatureGroup();
var POHON_MARKER_LAYER = new L.MarkerClusterGroup({
  iconCreateFunction: function(cluster) {
    return L.divIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>', className: 'marker-cluster marker-cluster-small', iconSize: new L.Point(40, 40) });
  }
});

mapObj.addLayer(POLYGON_AREA_LAYER);
mapObj.addLayer(POHON_MARKER_LAYER);

var SVG_POHON_KECIL = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 20 24"><ellipse cx="10" cy="8" rx="6" ry="7" fill="#388e3c" stroke="#fff" stroke-width="1"/><ellipse cx="10" cy="13" rx="4.5" ry="5" fill="#43a047" stroke="#fff" stroke-width="0.8"/><rect x="8.5" y="18" width="3" height="5" rx="1" fill="#5d4037"/></svg>';
var ICON_POHON = L.divIcon({ html: SVG_POHON_KECIL, iconSize: [16, 20], iconAnchor: [8, 20], className: '' });

function togglePolygonKegiatanLayer() {
  var cb = document.getElementById('toggle-polygon-kegiatan');
  var leg = document.getElementById('leg-polygon-kegiatan');
  // toggle from checkbox if ada, else derive from legend state
  var isChecked = cb ? cb.checked : (leg ? leg.classList.contains('leg-hidden') ? false : true : true);

  if (cb) cb.checked = isChecked;
  if (leg) {
    if (isChecked) leg.classList.remove('leg-hidden');
    else leg.classList.add('leg-hidden');
  }

  if (isChecked) mapObj.addLayer(POLYGON_AREA_LAYER);
  else mapObj.removeLayer(POLYGON_AREA_LAYER);

  // ensure UI & marker/drawer state refresh
  schedRender();
}


function togglePohonMarkerLayer() {
  var cb = document.getElementById('toggle-pohon-marker');
  var leg = document.getElementById('leg-pohon-marker');
  // toggle from checkbox if ada, else derive from legend state
  var isChecked = cb ? cb.checked : (leg ? leg.classList.contains('leg-hidden') ? false : true : true);

  if (cb) cb.checked = isChecked;
  if (leg) {
    if (isChecked) leg.classList.remove('leg-hidden');
    else leg.classList.add('leg-hidden');
  }

  if (isChecked) mapObj.addLayer(POHON_MARKER_LAYER);
  else mapObj.removeLayer(POHON_MARKER_LAYER);

  // ensure UI & marker/drawer state refresh
  schedRender();
}


// Draw mode instances
var drawPolygonKegiatan = new L.Draw.Polygon(mapObj, {
  allowIntersection: false,
  showArea: true,
  shapeOptions: { color: '#388e3c', weight: 3, fillOpacity: 0.3 }
});

var drawGarisKegiatan = new L.Draw.Polyline(mapObj, {
  shapeOptions: { color: '#388e3c', weight: 4 }
});

var drawPohonMarker = new L.Draw.Marker(mapObj, {
  icon: ICON_POHON
});

// Create map buttons for Drawing
var CustomDrawControl = L.Control.extend({
  options: { position: 'topright' },
  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    container.style.backgroundColor = 'white';
    container.style.padding = '5px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '5px';
    container.style.border = '2px solid rgba(0,0,0,0.2)';
    container.style.borderRadius = '5px';
    
    container.innerHTML = 
      '<button type="button" class="btn-icon" style="background:#e8f5e9; border:1px solid #43a047; color:#2e7d32; border-radius:4px; padding:6px; cursor:pointer; font-size:12px; font-weight:bold; width:100%; text-align:left;" onclick="startDrawPolygonKegiatan()" title="Gambar Polygon Area">&#128308; Polygon</button>' +
      '<button type="button" class="btn-icon" style="background:#e8f5e9; border:1px solid #43a047; color:#2e7d32; border-radius:4px; padding:6px; cursor:pointer; font-size:12px; font-weight:bold; width:100%; text-align:left;" onclick="startDrawGarisKegiatan()" title="Gambar Garis Jalur/Greenbelt">&#128312; Garis</button>' +
      '<button type="button" class="btn-icon" style="background:#e8f5e9; border:1px solid #43a047; color:#2e7d32; border-radius:4px; padding:6px; cursor:pointer; font-size:12px; font-weight:bold; width:100%; text-align:left;" onclick="startDrawPohonMarker()" title="Taruh Pohon">&#127807; Taruh Pohon</button>';
    
    L.DomEvent.disableClickPropagation(container);
    return container;
  }
});
mapObj.addControl(new CustomDrawControl());

function startDrawPolygonKegiatan() {
  drawPohonMarker.disable();
  drawGarisKegiatan.disable();
  drawPolygonKegiatan.enable();
  showToast('Silakan gambar area polygon di peta. Klik titik awal untuk selesai.', 'info');
}

function startDrawGarisKegiatan() {
  drawPohonMarker.disable();
  drawPolygonKegiatan.disable();
  drawGarisKegiatan.enable();
  showToast('Silakan gambar garis (jalur/greenbelt) di peta. Klik ganda titik terakhir untuk selesai.', 'info');
}

function startDrawPohonMarker() {
  drawPolygonKegiatan.disable();
  drawGarisKegiatan.disable();
  drawPohonMarker.enable();
  showToast('Silakan klik lokasi di peta untuk menaruh marker pohon kegiatan.', 'info');
}

// Listen to Draw Created Event
mapObj.on(L.Draw.Event.CREATED, function (e) {
  var type = e.layerType;
  var layer = e.layer;
  
  // Deteksi jika dari custom draw (Polygon / Garis / Marker)
  if (drawPolygonKegiatan._enabled || layer instanceof L.Polygon && layer.options.color === '#388e3c') {
    var geojson = layer.toGeoJSON();
    var area = turf.area(geojson) / 10000; // Ha
    var latlngs = layer.getBounds().getCenter();
    openPolygonForm('polygon', latlngs.lat, latlngs.lng, geojson, area);
    drawPolygonKegiatan.disable();
    return; // Cegah analyzePolygon
  }

  if (drawGarisKegiatan._enabled || layer instanceof L.Polyline && layer.options.color === '#388e3c') {
    var geojson = layer.toGeoJSON();
    var length = turf.length(geojson, {units: 'kilometers'}); // Panjang dalam km
    var latlngs = layer.getBounds().getCenter();
    // Kita anggap sebagai polygon di sistem form, tapi area diset 0 (atau bisa diinput manual)
    openPolygonForm('polygon', latlngs.lat, latlngs.lng, geojson, 0); 
    drawGarisKegiatan.disable();
    return;
  }
  
  if (drawPohonMarker._enabled || (layer instanceof L.Marker && layer.options.icon === ICON_POHON)) {
    var latlng = layer.getLatLng();
    openPolygonForm('marker', latlng.lat, latlng.lng, null, 0);
    drawPohonMarker.disable();
    return;
  }

  // Jika draw biasa (analisis area)
  drawnItems.clearLayers();
  drawnItems.addLayer(layer);
  analyzePolygon(layer);
});

// Modal Form Handling
function checkKegiatanCustom() {
  var sel = document.getElementById('pg-kegiatan').value;
  var cust = document.getElementById('pg-kegiatan-custom');
  if (sel === '__custom__') { cust.style.display = 'block'; cust.focus(); }
  else { cust.style.display = 'none'; }
}

document.getElementById('pg-cdk').addEventListener('change', function() {
  var cust = document.getElementById('pg-cdk-custom');
  if (this.value === '__custom__') { cust.style.display = 'block'; cust.focus(); }
  else { cust.style.display = 'none'; }
});

function openPolygonForm(type, lat, lng, geojsonObj, areaHa) {
  document.getElementById('polygon-kegiatan-modal').classList.add('open');
  document.getElementById('pg-feature-id').value = '';
  document.getElementById('pg-type').value = type;
  document.getElementById('pg-geojson').value = geojsonObj ? JSON.stringify(geojsonObj) : '';
  
  // Auto-fill
  document.getElementById('pg-lat').value = lat;
  document.getElementById('pg-lng').value = lng;
  document.getElementById('pg-kabupaten').value = getKab(lat, lng) || '';
  if (type === 'polygon' && areaHa > 0) {
    document.getElementById('pg-luas').value = areaHa.toFixed(2);
  } else {
    document.getElementById('pg-luas').value = '';
  }

  document.getElementById('polygon-modal-title').innerHTML = type === 'polygon' ? '&#128308; Tambah Area Kegiatan (Polygon/Garis)' : '&#127807; Taruh Pohon';
  document.getElementById('pg-lokasi').value = '';
  document.getElementById('pg-kegiatan').value = 'Penanaman';
  document.getElementById('pg-kegiatan-custom').style.display = 'none';
  document.getElementById('pg-kegiatan-custom').value = '';
  document.getElementById('pg-cdk').value = '';
  document.getElementById('pg-cdk-custom').style.display = 'none';
  document.getElementById('pg-cdk-custom').value = '';
  document.getElementById('pg-keterangan').value = '';
  
  // Reset dynamic bibit rows
  document.getElementById('bibit-container').innerHTML = '';
  addBibitRow();
  
  document.getElementById('polygon-modal-title').innerHTML = type === 'polygon' ? '&#128308; Tambah Area Kegiatan (Polygon/Garis)' : '&#127807; Tambah Titik Kegiatan (Marker)';
}

function addBibitRow() {
  var c = document.getElementById('bibit-container');
  var div = document.createElement('div');
  div.className = 'bibit-row';
  div.style.display = 'flex';
  div.style.gap = '10px';
  div.style.marginBottom = '5px';
  div.innerHTML = '<input type="text" class="bibit-jenis" placeholder="Jenis Bibit (Mis: Mangga)" style="flex:2; padding:6px; border-radius:4px; border:1px solid #ccc;">' +
                  '<input type="number" class="bibit-jumlah" placeholder="Jumlah (Mis: 100)" style="flex:1; padding:6px; border-radius:4px; border:1px solid #ccc;">' +
                  '<button type="button" class="btn-icon" onclick="removeBibitRow(this)" style="color:red; font-size:16px; border:none; background:none;">✖</button>';
  c.appendChild(div);
}

function removeBibitRow(btn) {
  var row = btn.parentElement;
  if (row.parentElement.children.length > 1) {
    row.remove();
  } else {
    row.querySelector('.bibit-jenis').value = '';
    row.querySelector('.bibit-jumlah').value = '';
  }
}

function cancelPolygonForm() {
  document.getElementById('polygon-kegiatan-modal').classList.remove('open');
}

function deletePolygonKegiatan(featureId) {
  if (!confirm('HAPUS PERMANEN?\n\nMenghapus kegiatan ini juga akan menghapus:\n- Data di Spreadsheet\n- File Polygon GeoJSON di Google Drive\n- Semua Foto yang ter-upload untuk kegiatan ini.\n\nLanjutkan hapus?')) return;
  
  showToast('Memproses penghapusan (jangan tutup halaman)...', 'info');
  var payload = { action: "deletePolygonFeature", featureId: featureId };
  
  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify(withAuthPayload(payload))
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast('Kegiatan berhasil dihapus sepenuhnya!', 'success');
      document.querySelector('.drawer-backdrop').click(); // Tutup drawer
      fetchPolygonFeatures(); // Reload data
    } else {
      showToast('Gagal menghapus: ' + data.error, 'error');
    }
  })
  .catch(err => {
    showToast('Terjadi kesalahan saat menghapus', 'error');
  });
}

function savePolygonFeature() {
  var cdk = document.getElementById('pg-cdk').value;
  if (cdk === '__custom__') cdk = document.getElementById('pg-cdk-custom').value;
  var keg = document.getElementById('pg-kegiatan').value;
  if (keg === '__custom__') keg = document.getElementById('pg-kegiatan-custom').value;
  
  var bibitArr = [];
  var totalBibit = 0;
  document.querySelectorAll('#bibit-container .bibit-row').forEach(function(row) {
    var j = row.querySelector('.bibit-jenis').value.trim();
    var n = parseInt(row.querySelector('.bibit-jumlah').value) || 0;
    if (j) {
      bibitArr.push(j + (n > 0 ? ' (' + n + ')' : ''));
      totalBibit += n;
    }
  });
  
  var payload = {
    action: "savePolygonFeature",
    type: document.getElementById('pg-type').value,
    cdk_wilayah: cdk,
    nama: document.getElementById('pg-nama').value,
    kabupaten: document.getElementById('pg-kabupaten').value,
    kecamatan: document.getElementById('pg-kecamatan').value,
    desa_blok: document.getElementById('pg-desa').value,
    lokasi: document.getElementById('pg-lokasi').value,
    kegiatan: keg,
    luas: document.getElementById('pg-luas').value,
    jenis_bibit: bibitArr.join(', '),
    jumlah_bibit: totalBibit,
    latitude: document.getElementById('pg-lat').value,
    longitude: document.getElementById('pg-lng').value,
    keterangan: document.getElementById('pg-keterangan').value
  };
  
  var gjStr = document.getElementById('pg-geojson').value;
  if (gjStr) {
    try { payload.geojson = JSON.parse(gjStr); } catch(e) {}
  }
  
  var btn = document.querySelector('#polygon-kegiatan-modal .btn-apply');
  var oldHtml = btn.innerHTML;
  btn.innerHTML = 'Menyimpan...';
  btn.disabled = true;
  
  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify(withAuthPayload(payload))
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast('Data berhasil disimpan!', 'success');
      cancelPolygonForm();
      fetchPolygonFeatures(); // Reload data
    } else {
      showToast('Gagal: ' + data.error, 'error');
    }
  })
  .catch(err => {
    showToast('Terjadi kesalahan jaringan', 'error');
  })
  .finally(() => {
    btn.innerHTML = oldHtml;
    btn.disabled = false;
  });
}

function initSpatialSystem() {
  fetchPolygonFeatures();
}

function fetchPolygonFeatures() {
  fetch(appendAuthParam(GAS_WEB_APP_URL + '?action=getPolygonFeatures'))
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      renderPolygonFeatures(data.features);
    }
  })
  .catch(err => console.error(err));
}

function renderPolygonFeatures(features) {
  // Debug cepat biar bisa cek apakah data polygon memang ter-load dan bisa dirender.
  // (Tidak mengganggu UX karena hanya tampil toast singkat saat render dipanggil.)
  try {
    showToast('Memuat polygon/kegiatan & titik/pohon: ' + (features ? features.length : 0) + ' item...', false);
  } catch(e) {}


  POLYGON_AREA_LAYER.clearLayers();
  POHON_MARKER_LAYER.clearLayers();

  function clearLayersForFeatureId(featId) {
    try {
      if (!featId) return;
      // Hapus marker pohon/overlay polygon yang terkait
      POLYGON_AREA_LAYER.eachLayer(function(l) {
        try {
          if (l && l.featureData && String(l.featureData.ID) === String(featId)) {
            POLYGON_AREA_LAYER.removeLayer(l);
          }
        } catch (e) {}
      });
      POHON_MARKER_LAYER.eachLayer(function(l) {
        try {
          if (l && l.featureData && String(l.featureData.ID) === String(featId)) {
            POHON_MARKER_LAYER.removeLayer(l);
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  function detectGeoType(geojson) {
    try {
      if (!geojson) return '';
      if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features) && geojson.features.length) {
        for (var i = 0; i < geojson.features.length; i++) {
          var g = geojson.features[i];
          if (g && g.geometry && g.geometry.type) return g.geometry.type;
        }
        return 'FeatureCollection';
      }
      if (geojson.geometry && geojson.geometry.type) return geojson.geometry.type;
      if (geojson.type) return geojson.type;
      return '';
    } catch (e) { return ''; }
  }

  function addPolygonOrLineLayer(gjGeojson, feat, lat, lng, popHtml) {
    if (!gjGeojson) return;

    var typeGeo = detectGeoType(gjGeojson);
    var isLine = (typeGeo === 'LineString' || typeGeo === 'MultiLineString');

    var polyLayer = L.geoJSON(gjGeojson, {
      style: function(feature) {
        if (isLine) {
          return { color: '#388e3c', weight: 4, opacity: 0.95, fillOpacity: 0 };
        }
        return { color: '#388e3c', weight: 2, opacity: 0.95, fillColor: '#388e3c', fillOpacity: 0.3 };
      },
      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, { icon: ICON_POHON });
      }
    });

    if (popHtml) polyLayer.bindPopup(popHtml);
    var hoverHtml = buildFeatureHoverTooltip(feat, 'polygon');
    if (hoverHtml) polyLayer.bindTooltip(hoverHtml, {sticky: true, direction: 'top', opacity: 0.95, className: 'feature-hover-tooltip'});
    polyLayer.on('click', function() { openDrawer('polygon_kegiatan', feat); });
    // Tag featureData agar clear bisa tepat
    polyLayer.getLayers().forEach(function(l) { try { l.featureData = feat; } catch (e) {} });

    polyLayer.addTo(POLYGON_AREA_LAYER);
  }

  features.forEach(function(feat) {
    var featId = feat && feat.ID ? String(feat.ID) : '';
    if (!featId) return;

    var lat = toFloat(feat.Latitude);
    var lng = toFloat(feat.Longitude);

    // Bersihkan layer lama untuk featureId ini (aman bila render dipanggil ulang)
    clearLayersForFeatureId(featId);

    var hasGeo = !!(feat.GeoJSON_URL || feat.GeoJSON_FileID);

    // Build popup HTML (dipakai utk polygon/line)
    var pop = '<div style="font-size:12px; line-height:1.4;">' +
      '<b style="font-size:14px; color:#2e7d32;">' + (feat.Nama || 'Area Kegiatan') + '</b><br>' +
      '<b>Kegiatan:</b> ' + (feat.Kegiatan || '-') + '<br>' +
      '<b>Luas:</b> ' + (feat.Luas_Ha || '0') + ' Ha<br>' +
      '<b>Jenis Bibit:</b> ' + (feat.Jenis_Bibit || '-') + '<br>' +
      '<button class="btn-apply" style="margin-top:8px; padding:4px 8px; font-size:11px;" onclick="openDrawerFromFeature(\'' + featId + '\', \'polygon_kegiatan\')">Lihat Detail & Foto</button>' +
      '</div>';

    // Kasus: marker pohon/ titik
    // Frontend sebelumnya pakai else, tapi untuk kasus 'Type=polygon' yang sebenarnya garis/polygon, kita tetap
    // render via GeoJSON fetch jika ada.
    if (!hasGeo || (feat.Type !== 'polygon' && feat.Type !== 'marker')) {
      if (lat && lng) {
        var mk = L.marker([lat, lng], { icon: ICON_POHON }).bindPopup(pop);
        mk.featureData = feat;
        mk.on('click', function() { openDrawer('polygon_kegiatan', feat); });
        POHON_MARKER_LAYER.addLayer(mk);
      }
      return;
    }

    // Jika lat/lng valid, tampilkan marker placeholder dulu agar user lihat titiknya
    if (lat && lng) {
      var hoverHtml = buildFeatureHoverTooltip(feat, 'point');
      var placeholderMarker = L.marker([lat, lng], { icon: ICON_POHON });
      if (hoverHtml) placeholderMarker.bindTooltip(hoverHtml, {sticky: true, direction: 'top', opacity: 0.95, className: 'feature-hover-tooltip'});
      placeholderMarker.featureData = feat;
      placeholderMarker.on('click', function() { openDrawer('polygon_kegiatan', feat); });
      POLYGON_AREA_LAYER.addLayer(placeholderMarker);
    }

    // Async fetch GeoJSON (sumber kebenaran bentuk polygon/garis)
    var fileId = feat.GeoJSON_FileID;
    if (!fileId) {
      // fallback: tidak ada fileId, jadi marker placeholder saja
      return;
    }

    // Pakai auth yang benar: getSpatialGeoJSON sudah memanggil requireAuth_ di backend.
    // Di frontend ini token login tersimpan di localStorage key geohutan_auth_token.
      fetch(GAS_WEB_APP_URL + '?action=getSpatialGeoJSON&fileId=' + encodeURIComponent(fileId) + '&token=' + (localStorage.getItem('geohutan_auth_token') || localStorage.getItem('gh_token') || ''))
      .then(function(r) { return r.json(); })
      .then(function(res) {
        try {
          if (!res || !res.success || !res.geojson) return;

          // Jika ternyata geojson adalah Point/Multiple points, render jadi marker, bukan polygon/line.
          var typeGeo = detectGeoType(res.geojson);
          var isPoint = (typeGeo === 'Point' || typeGeo === 'MultiPoint');

          // Hapus placeholder marker lama utk featureId ini agar tidak dobel
          clearLayersForFeatureId(featId);

          if (isPoint) {
            // render point -> marker pohon cluster (atau layer polygon area)
            var pointLayer = L.geoJSON(res.geojson, {
              pointToLayer: function(feature, latlng) {
                var m = L.marker(latlng, { icon: ICON_POHON });
                var hoverHtml = buildFeatureHoverTooltip(feat, 'point');
                if (hoverHtml) m.bindTooltip(hoverHtml, {sticky: true, direction: 'top', opacity: 0.95, className: 'feature-hover-tooltip'});
                m.featureData = feat;
                m.on('click', function() { openDrawer('polygon_kegiatan', feat); });
                return m;
              }
            });
            pointLayer.eachLayer(function(l) {
              try {
                POHON_MARKER_LAYER.addLayer(l);
              } catch (e) {}
            });
          } else {
            addPolygonOrLineLayer(res.geojson, feat, lat, lng, pop);
          }

          // Invalidate size biar layer langsung kelihatan (kasus overlay baru saja)
          try { mapObj && mapObj.invalidateSize(); } catch (e) {}
        } catch (e) {}
      })
      .catch(function() {
        // jika gagal fetch, placeholderMarker dibiarkan
      });
  });

  // invalidate size sekali setelah render
  try { mapObj && mapObj.invalidateSize(); } catch (e) {}
}


function openDrawerFromFeature(featId, type) {
  var feat = null;
  POHON_MARKER_LAYER.eachLayer(function(l) { if(l.featureData && String(l.featureData.ID) === String(featId)) feat = l.featureData; });
  if(!feat) POLYGON_AREA_LAYER.eachLayer(function(l) { if(l.featureData && String(l.featureData.ID) === String(featId)) feat = l.featureData; });
  
  if(feat) {
    openDrawer(type, feat);
  }
}
