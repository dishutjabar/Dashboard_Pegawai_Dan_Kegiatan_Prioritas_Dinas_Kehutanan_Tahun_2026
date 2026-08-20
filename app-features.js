// Custom ShapeMarker Extension for Canvas
if (typeof L !== 'undefined' && L.Canvas) {
    L.Canvas.include({
        _updateShapeMarker: function (layer) {
            if (!this._drawing || layer._empty()) { return; }
            var p = layer._point, ctx = this._ctx, shape = layer.options.shape;
            
            // Dynamic scale based on zoom
            var zoom = this._map ? this._map.getZoom() : 12;
            var r = layer._radius;
            if (zoom <= 8) r = r * 0.4;
            else if (zoom === 9) r = r * 0.5;
            else if (zoom === 10) r = r * 0.6;
            else if (zoom === 11) r = r * 0.8;
            else if (zoom >= 14) r = r * 1.3;
            else if (zoom >= 16) r = r * 1.5;
            
            r = Math.max(1.5, Math.min(r, 10)); // bounds

            ctx.beginPath();
            if (shape === 'square') {
                ctx.rect(p.x - r, p.y - r, r * 2, r * 2);
            } else if (shape === 'diamond') {
                ctx.moveTo(p.x, p.y - r);
                ctx.lineTo(p.x + r, p.y);
                ctx.lineTo(p.x, p.y + r);
                ctx.lineTo(p.x - r, p.y);
                ctx.closePath();
            } else if (shape === 'pentagon') {
                for (var i = 0; i < 5; i++) {
                    var a = (Math.PI * 2 * i / 5) - Math.PI / 2;
                    var x = p.x + r * Math.cos(a);
                    var y = p.y + r * Math.sin(a);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
            } else if (shape === 'star') {
                var rot = Math.PI / 2 * 3;
                var cx = p.x, cy = p.y;
                var step = Math.PI / 5;
                ctx.moveTo(cx, cy - r);
                for (var i = 0; i < 5; i++) {
                    ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
                    rot += step;
                    ctx.lineTo(cx + Math.cos(rot) * (r * 0.4), cy + Math.sin(rot) * (r * 0.4));
                    rot += step;
                }
                ctx.lineTo(cx, cy - r);
                ctx.closePath();
            } else if (shape === 'triangle') {
                ctx.moveTo(p.x, p.y - r);
                ctx.lineTo(p.x + (r * 0.866), p.y + (r * 0.5));
                ctx.lineTo(p.x - (r * 0.866), p.y + (r * 0.5));
                ctx.closePath();
            } else {
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2, false);
            }
            this._fillStroke(ctx, layer);
        }
    });

    L.ShapeMarker = L.CircleMarker.extend({
        _updatePath: function () {
            if (this._renderer && this._renderer._updateShapeMarker) {
                this._renderer._updateShapeMarker(this);
            } else {
                L.CircleMarker.prototype._updatePath.call(this);
            }
        }
    });

    L.shapeMarker = function (latlng, options) {
        return new L.ShapeMarker(latlng, options);
    };
}

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â GeoHutan Jabar ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Features ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */
/** URL Web App Google Apps Script */
var GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCdFIZ3y9BbBiRHJItturR5cSt2RvoQKEbePXXhogpusq_8oID6v6pN654k85sI1kb/exec";
var REQUIRED_BACKEND_VERSION = "2026-08-21-weekly-report-v7";
var _backendVersionChecked = false;
var _backendVersionOk = null;
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

function getRoleGroup(role) {
  if (!role) return 5; // default most restrictive (group 5)
  var r = String(role).toLowerCase().trim().replace(/\s+/g, ' ');
  r = r.replace(/\bcdk\s*([1-9])\b/g, 'cdk $1');
  var g1 = ['admin', 'superadmin', 'kadis', 'sekdis', 'kabid pdas'];
  var g2 = ['kabid ppkh', 'kabid bupm', 'kabid pksdae'];
  var g3 = ['kepala tahura', 'kepala spth', 'kepala pphh', 'kepala cdk 1', 'kepala cdk 2', 'kepala cdk 3', 'kepala cdk 4', 'kepala cdk 5', 'kepala cdk 6', 'kepala cdk 7', 'kepala cdk 8', 'kepala cdk 9'];
  var g4 = ['pegwai madya', 'pegawai madya'];
  var g5 = ['pegawai', 'kepala tu tahura', 'kepala tu spth', 'kepala tu pphh', 'kepala tu cdk 1', 'kepala tu cdk 2', 'kepala tu cdk 3', 'kepala tu cdk 4', 'kepala tu cdk 5', 'kepala tu cdk 6', 'kepala tu cdk 7', 'kepala tu cdk 8', 'kepala tu cdk 9', 'kepala tu sekretariat', 'kepala tu secretariat'];
  if (g1.indexOf(r) > -1) return 1;
  if (g2.indexOf(r) > -1) return 2;
  if (g3.indexOf(r) > -1) return 3;
  if (g4.indexOf(r) > -1) return 4;
  if (g5.indexOf(r) > -1) return 5;
  return 5;
}

function isAdminRole(role) {
  return String(role || '').toLowerCase().trim().replace(/\s+/g, ' ') === 'admin';
}

function getCurrentAuthUser() {
  return (typeof getStoredAuthUser === 'function') ? getStoredAuthUser() : null;
}

function getCurrentUserNip(user) {
  user = user || getCurrentAuthUser();
  return String((user && (user.nip || user.username)) || '').trim();
}

function getRowNip(row, type) {
  if (!row) return '';
  type = normalizeFilterType(type || (row._data_type || ''));
  if (type === 'pegawaiBinaan') return String(getBinaanField(row, 'nip') || '').trim();
  return String(row.NIP || row.nip || row.Nip || '').trim();
}

function getRowUnit(row, type) {
  if (!row) return '';
  type = normalizeFilterType(type || (row._data_type || ''));
  if (type === 'pegawaiBinaan') return String(getBinaanField(row, 'unit') || '').trim();
  return String(row['Unit Kerja'] || row['UNIT KERJA'] || row.Unit || row.unit || '').trim();
}

function getCurrentUserUnit(user) {
  user = user || getCurrentAuthUser();
  if (!user) return '';
  if (user.unit) return String(user.unit).trim();
  var nip = getCurrentUserNip(user);
  if (!nip) return '';
  var found = null;
  if (DATA && Array.isArray(DATA.pegawai)) {
    found = DATA.pegawai.find(function(row) { return getRowNip(row, 'pegawai') === nip; });
    if (found) return getRowUnit(found, 'pegawai');
  }
  if (DATA && Array.isArray(DATA.pegawaiBinaan)) {
    found = DATA.pegawaiBinaan.find(function(row) { return getRowNip(row, 'pegawaiBinaan') === nip; });
    if (found) return getRowUnit(found, 'pegawaiBinaan');
  }
  return '';
}

function isOwnPegawaiRecord(row, type, user) {
  var nip = getCurrentUserNip(user);
  return !!nip && getRowNip(row, type) === nip;
}

function setLayerVisibleState(types, visible, hideLegend) {
  types.forEach(function(type) {
    if (!LAYER_VISIBLE.hasOwnProperty(type)) return;
    LAYER_VISIBLE[type] = visible;
    var el = document.getElementById('leg-' + type);
    if (el) {
      el.classList.toggle('leg-hidden', !visible);
      el.style.display = hideLegend ? 'none' : '';
    }
  });
}

function resetRbacUiVisibility_() {
  [
    'f_cdk', 'f_status', 'f_kawasan', 'f_penyuluh', 'f_kategori_lojuna',
    'f_binaan_kegiatan', 'f_binaan_jabatan', 'f_binaan_pembina'
  ].forEach(function(id) {
    var el = document.getElementById(id);
    var group = el ? el.closest('.filter-group') : null;
    if (group) group.style.display = '';
  });
  var title = document.getElementById('binaan-filter-title');
  if (title) title.style.display = '';
  var pjlToggle = document.getElementById('toggle-pjl-polygon');
  if (pjlToggle && pjlToggle.closest('label')) pjlToggle.closest('label').style.display = '';
  ['leg-pjl', 'leg-per', 'leg-jum', 'leg-peg', 'leg-pegb'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  setStaffSimpleFilterMode_(false);
}

function setStaffSimpleFilterMode_(enabled) {
  var filterTab = document.getElementById('tab-filter');
  if (!filterTab) return;
  filterTab.querySelectorAll('.filter-group, #binaan-filter-title, .btn-row').forEach(function(el) {
    el.style.display = enabled ? 'none' : '';
  });
  var mapControls = filterTab.querySelector('.map-controls');
  if (mapControls) mapControls.style.display = '';
}

function applyCurrentUserRoleDefaults(user) {
  user = user || getCurrentAuthUser();
  if (!user || !user.username) return;
  var group = getRoleGroup(user.role);
  resetRbacUiVisibility_();

  document.body.classList.remove('rbac-group-1', 'rbac-group-2', 'rbac-group-3', 'rbac-group-4', 'rbac-no-spatial-upload');
  document.body.classList.add('rbac-group-' + group);
  if (group > 1) document.body.classList.add('rbac-no-spatial-upload');
  var reportMenu = document.getElementById('report-menu');
  if (reportMenu) reportMenu.style.display = group <= 3 ? 'block' : 'none';

  var spatialToggle = document.getElementById('toggle-spatial');
  var clusterToggle = document.getElementById('toggle-cluster');
  var pjlPolyToggle = document.getElementById('toggle-pjl-polygon');

  if (spatialToggle && !spatialToggle.checked) {
    spatialToggle.checked = true;
    if (typeof toggleSpatialPolygons === 'function') toggleSpatialPolygons();
    else SPATIAL_ENABLED = true;
  }

  if (!isAdminRole(user.role)) applyNonAdminMapDefaults_();

  if (group === 1) {
    if (!isAdminRole(user.role)) {
      schedRender();
      setTimeout(zoomToCurrentUserLocation, 450);
    }
    return;
  }

  if (group === 2) {
    // kabid ppkh, kabid bupm, kabid pksdae - see all, clustering OFF by default
    setLayerVisibleState(['pjl', 'per', 'jum', 'peg', 'pegb'], true, false);
    schedRender();
    setTimeout(zoomToCurrentUserLocation, 450);
    return;
  }

  if (group === 3) {
    // kepala tahura, spth, pphh, cdk 1-9 - see all layers in their CDK, clustering OFF
    var clkToggle3 = document.getElementById('toggle-cluster');
    if (clkToggle3 && clkToggle3.checked) {
      clkToggle3.checked = false;
      CLUSTER_ENABLED = false;
    }
    setLayerVisibleState(['pjl', 'per', 'jum', 'peg', 'pegb'], true, false);
    schedRender();
    setTimeout(zoomToCurrentUserLocation, 450);
    return;
  }

  if (group === 4) {
    // pegawai madya - pjl/per/jum OFF (can enable), peg/pegb visible
    // Turn off clustering
    var clkToggle4 = document.getElementById('toggle-cluster');
    if (clkToggle4 && clkToggle4.checked) {
      clkToggle4.checked = false;
      CLUSTER_ENABLED = false;
    }
    setLayerVisibleState(['pjl', 'per', 'jum'], false, false); 
    setLayerVisibleState(['peg', 'pegb'], true, false);
    if (pjlPolyToggle && pjlPolyToggle.checked) {
      pjlPolyToggle.checked = false;
      if (typeof togglePjlPolygons === 'function') togglePjlPolygons();
    }
    schedRender();
    setStaffSimpleFilterMode_(true);
    setTimeout(zoomToCurrentUserLocation, 450);
    return;
  }

  if (group === 5) {
    // pegawai, kepala tu - pjl/per/jum OFF (can enable), peg/pegb visible
    var clkToggle5 = document.getElementById('toggle-cluster');
    if (clkToggle5 && clkToggle5.checked) {
      clkToggle5.checked = false;
      CLUSTER_ENABLED = false;
    }
    setLayerVisibleState(['pjl', 'per', 'jum'], false, false);
    setLayerVisibleState(['peg', 'pegb'], true, false);
    if (pjlPolyToggle && pjlPolyToggle.closest('label')) pjlPolyToggle.closest('label').style.display = 'none';
    setStaffSimpleFilterMode_(true);
    schedRender();
    setTimeout(zoomToCurrentUserLocation, 450);
  }
}

function zoomToCurrentUserLocation() {
  var user = getCurrentAuthUser();
  var nip = getCurrentUserNip(user);
  if (!nip || !mapObj) return;
  var targetLatLngs = [];
  var targetFirst = null;
  if (DATA && Array.isArray(DATA.pegawaiBinaan)) {
    var pegb = DATA.pegawaiBinaan.filter(function(row) { return isOwnPegawaiRecord(row, 'pegawaiBinaan', user) && row._lat && row._lng; });
    pegb.forEach(function(p) { targetLatLngs.push([p._lat, p._lng]); if(!targetFirst) { targetFirst = p; targetFirst._dataType = 'pegb'; } });
  }
  if (!targetLatLngs.length && DATA && Array.isArray(DATA.pegawai)) {
    var peg = DATA.pegawai.filter(function(row) { return isOwnPegawaiRecord(row, 'pegawai', user) && row._lat && row._lng; });
    peg.forEach(function(p) { targetLatLngs.push([p._lat, p._lng]); if(!targetFirst) { targetFirst = p; targetFirst._dataType = 'peg'; } });
  }
  if (targetLatLngs.length > 1) {
    mapObj.fitBounds(targetLatLngs, { padding: [20, 20], maxZoom: 16 });
  } else if (targetLatLngs.length === 1 && targetFirst) {
    mapObj.setView(targetLatLngs[0], 16);
    highlightMarker(targetLatLngs[0][0], targetLatLngs[0][1], targetFirst._dataType);
  }
}

function canUploadPhotoForContext(context, row) {
  var user = getCurrentAuthUser();
  if (!user || !user.username) return false;
  
  // Berdasarkan aturan baru, semua user yang terautentikasi (Group 1-5) 
  // diizinkan melakukan full CRUD (Upload/Edit) untuk SEMUA data (Juna, Persemaian, Pegawai, dll)
  return true;
}

function canManageSpatialData() {
  var user = getCurrentAuthUser();
  return !!(user && user.username && getRoleGroup(user.role) === 1);
}

function updateAuthUserUI(user) {
  var pill = document.getElementById("auth-user-pill");
  var profileMenu = document.getElementById("profile-menu");
  var profileName = document.getElementById("profile-name");
  var profileRole = document.getElementById("profile-role");
  var profileAvatar = document.querySelector("#profile-menu .profile-avatar");
  
  var btnSpatial = document.getElementById("btn-spatial");
  var btnTable = document.getElementById("btn-table");
  var btnSource = document.getElementById("btn-source");
  var btnExport = document.getElementById("btn-export");
  var reportMenu = document.getElementById("report-menu");

  var chkSpatial = document.getElementById("toggle-spatial");
  var drawControl = document.querySelector(".leaflet-draw, .custom-draw-control");
  
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
    
    // UI Logic based on Group
    var group = getRoleGroup(user.role);
    if (reportMenu) reportMenu.style.display = group <= 3 ? 'block' : 'none';
    if (group === 1) {
      if (btnSpatial) { btnSpatial.style.display = ''; btnSpatial.innerHTML = '&#128205; <span class="d-none-mobile">Upload Spasial</span>'; }
      if (btnTable) btnTable.style.display = '';
      if (btnSource) btnSource.style.display = '';
      if (btnExport) btnExport.style.display = '';
      if (drawControl) drawControl.style.display = '';
    } else {
      if (btnSpatial) { btnSpatial.style.display = ''; btnSpatial.innerHTML = '&#128506; <span class="d-none-mobile">Atur Polygon</span>'; }
      if (btnTable) btnTable.style.display = 'none';
      if (btnSource) btnSource.style.display = 'none';
      if (btnExport) btnExport.style.display = 'none';
      if (drawControl) drawControl.style.display = 'none';
      
      // Auto enable Tampilkan Polygon Spasial
      if (chkSpatial && !chkSpatial.checked) {
        chkSpatial.checked = true;
        if (typeof toggleSpatialPolygons === 'function') toggleSpatialPolygons();
      }
      
      // Also default on all polygons in Atur Polygon modal
      setTimeout(function() {
        document.querySelectorAll('.sp-file-item input[type="checkbox"]').forEach(function(chk) {
          if (!chk.checked) chk.click();
        });
      }, 500);
      
      // Turn off clustering
      var chkClust = document.getElementById("toggle-cluster");
      if (chkClust && chkClust.checked) {
        chkClust.checked = false;
        CLUSTER_ENABLED = false;
      }
    }
    
    // Specific Group 4 & 5 UI changes
    if (group === 4 || group === 5) {
       var f_cdk_grp = document.getElementById("f_cdk") ? document.getElementById("f_cdk").closest(".filter-group") : null;
       var f_status_grp = document.getElementById("f_status") ? document.getElementById("f_status").closest(".filter-group") : null;
       var f_kawasan_grp = document.getElementById("f_kawasan") ? document.getElementById("f_kawasan").closest(".filter-group") : null;
       var f_penyuluh_grp = document.getElementById("f_penyuluh") ? document.getElementById("f_penyuluh").closest(".filter-group") : null;
       var f_kategori_lojuna_grp = document.getElementById("f_kategori_lojuna") ? document.getElementById("f_kategori_lojuna").closest(".filter-group") : null;
       var f_pegawai_grp = document.getElementById("f_pegawai") ? document.getElementById("f_pegawai").closest(".filter-group") : null;
       var f_jabatan_grp = document.getElementById("f_jabatan") ? document.getElementById("f_jabatan").closest(".filter-group") : null;
       var f_nama_pegawai_grp = document.getElementById("f_nama_pegawai") ? document.getElementById("f_nama_pegawai").closest(".filter-group") : null;
       
       var labelBinaan = document.getElementById("binaan-filter-title");
       
       var f_binaan_kegiatan_grp = document.getElementById("f_binaan_kegiatan") ? document.getElementById("f_binaan_kegiatan").closest(".filter-group") : null;
       var f_binaan_jabatan_grp = document.getElementById("f_binaan_jabatan") ? document.getElementById("f_binaan_jabatan").closest(".filter-group") : null;
       var f_binaan_pembina_grp = document.getElementById("f_binaan_pembina") ? document.getElementById("f_binaan_pembina").closest(".filter-group") : null;
       var chk2ha = document.getElementById("toggle-pjl-polygon") ? document.getElementById("toggle-pjl-polygon").closest("label") : null;
       
       // Group 4: hide restricted filters but KEEP allowed ones (CDK, Kab, Status, Kawasan, Penyuluh)
       if (f_pegawai_grp) f_pegawai_grp.style.display = 'none';
       if (f_jabatan_grp) f_jabatan_grp.style.display = 'none';
       if (f_nama_pegawai_grp) f_nama_pegawai_grp.style.display = 'none';
       if (f_kategori_lojuna_grp) f_kategori_lojuna_grp.style.display = 'none';
       if (labelBinaan) labelBinaan.style.display = 'none';
       if (f_binaan_kegiatan_grp) f_binaan_kegiatan_grp.style.display = 'none';
       if (f_binaan_jabatan_grp) f_binaan_jabatan_grp.style.display = 'none';
       if (f_binaan_pembina_grp) f_binaan_pembina_grp.style.display = 'none';
       if (chk2ha) chk2ha.style.display = 'none';
       // f_cdk_grp, f_status_grp, f_kawasan_grp, f_penyuluh_grp remain visible
    }
  } else {
    document.body.classList.remove('rbac-group-1', 'rbac-group-2', 'rbac-group-3', 'rbac-group-4', 'rbac-no-spatial-upload');
    if (pill) pill.textContent = "";
    if (profileName) profileName.textContent = "GeoHutan";
    if (profileRole) profileRole.textContent = "Pengguna Dashboard";
    if (profileAvatar) profileAvatar.textContent = "GH";
    if (profileMenu) {
      profileMenu.style.display = "none";
      profileMenu.classList.remove("open");
    }
    if (btnTable) btnTable.style.display = 'none';
    if (btnSpatial) btnSpatial.style.display = 'none';
    if (btnSource) btnSource.style.display = 'none';
    if (btnExport) btnExport.style.display = 'none';
    if (reportMenu) reportMenu.style.display = 'none';
  }
  applyCurrentUserRoleDefaults(user);
}

function unlockDashboard(user) {
  var portal = document.getElementById("auth-portal");
  if (portal) portal.classList.add("hidden");
  document.body.classList.add("auth-unlocked");
  updateAuthUserUI(user);
  if (typeof fetchSpatialFileList === "function") fetchSpatialFileList();
  ensureBackendDplColumns();
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

function ensureBackendDplColumns() {
  var token = getAuthToken();
  if (!token || GAS_WEB_APP_URL.indexOf("script.google.com") === -1) return;
  try {
    if (sessionStorage.getItem('geohutan_dpl_columns_checked') === '1') return;
    sessionStorage.setItem('geohutan_dpl_columns_checked', '1');
  } catch (e) {}
  postAuthAction(withAuthPayload({ action: "ensureDplColumns" })).catch(function() {});
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

function toggleReportMenu(event) {
  if (event) event.stopPropagation();
  var menu = document.getElementById("report-menu");
  if (menu) menu.classList.toggle("open");
}

function closeReportMenu() {
  var menu = document.getElementById("report-menu");
  if (menu) menu.classList.remove("open");
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

function openCredentialModal() {
  closeProfileMenu();
  var modal = document.getElementById("credential-modal");
  if (modal) {
    modal.style.display = "flex";
    var form = document.getElementById("credential-form");
    if (form) form.reset();
  }
}

function closeCredentialModal() {
  var modal = document.getElementById("credential-modal");
  if (modal) modal.style.display = "none";
}

function openForgotPasswordModal() {
  closeProfileMenu();
  var modal = document.getElementById("forgot-password-modal");
  var input = document.getElementById("forgot-password-value");
  var status = document.getElementById("forgot-password-status");
  if (input) { input.type = "password"; input.value = "*****"; }
  if (status) status.textContent = "Memuat password terakhir...";
  if (modal) modal.classList.add("open");

  postAuthAction(withAuthPayload({ action: "getForgotPassword" }))
    .then(function(res) {
      if (!res.success) throw new Error(res.error || "Password belum bisa dimuat.");
      var pw = String(res.password || "");
      if (input) {
        input.dataset.password = pw;
        input.value = pw ? "*****" : "Belum terekam";
      }
      if (status) status.textContent = pw ? "Klik ikon mata untuk menampilkan password." : "Password lama belum terekam. Login atau ganti password sekali setelah update backend ini.";
    })
    .catch(function(err) {
      if (status) status.textContent = err.message || "Gagal memuat password.";
    });
}

function closeForgotPasswordModal() {
  var modal = document.getElementById("forgot-password-modal");
  if (modal) modal.classList.remove("open");
}

function toggleForgotPasswordVisibility() {
  var input = document.getElementById("forgot-password-value");
  if (!input) return;
  var pw = input.dataset.password || "";
  if (!pw) return;
  if (input.type === "password") {
    input.type = "text";
    input.value = pw;
  } else {
    input.type = "password";
    input.value = "*****";
  }
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
    
    alert("Akun berhasil diperbarui. Silakan login kembali dengan password baru.");
    closeCredentialModal();
    logoutGeoHutan();
  }).catch(function(err) {
    setAuthStatus(err.message || "Gagal memperbarui akun.", true);
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.textContent = "Simpan Perubahan"; }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  initAuthPortal();
  
  // Auto-collapse sidebar on mobile load
  if (window.innerWidth <= 950) {
    var sb = document.getElementById('sidebar');
    if (sb) sb.classList.add('sidebar-collapsed');
    var sbBtn = document.getElementById('sidebar-collapse-btn');
    if (sbBtn) sbBtn.innerHTML = '&rsaquo;';
  }
  
  // PWA: Cek apakah sudah bisa di-install (standalone mode = sudah diinstall)
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    var installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) installBtn.style.display = 'none';
  }
  
  // Credential modal close on backdrop click
  var credModal = document.getElementById('credential-modal');
  if (credModal) {
    credModal.addEventListener('click', function(e) {
      if (e.target === credModal) closeCredentialModal();
    });
  }
  var forgotModal = document.getElementById('forgot-password-modal');
  if (forgotModal) {
    forgotModal.addEventListener('click', function(e) {
      if (e.target === forgotModal) closeForgotPasswordModal();
    });
  }
  
  document.addEventListener("click", closeProfileMenu);
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") { closeProfileMenu(); closeCredentialModal(); closeForgotPasswordModal(); }
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

function toggleSidebarCollapse() {
  var sidebar = document.getElementById('sidebar');
  var btn = document.getElementById('sidebar-collapse-btn');
  if (!sidebar) return;
  sidebar.classList.toggle('sidebar-collapsed');
  if (btn) btn.innerHTML = sidebar.classList.contains('sidebar-collapsed') ? '&rsaquo;' : '&lsaquo;';
  setTimeout(function() {
    try { if (mapObj) mapObj.invalidateSize(); } catch(e) {}
  }, 260);
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

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã‚ÂºÃƒÂ¯Ã‚Â¸Ã‚Â  SPATIAL UPLOAD SYSTEM
   ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */
var SPATIAL_UPLOAD_LAYER = null;
var SPATIAL_SVG_RENDERER = null;
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
    var user = getCurrentAuthUser();
    var group = getRoleGroup(user && user.role);
    var title = m.querySelector('.spatial-modal-header span');
    if (title) title.textContent = (group === 1 ? 'Upload Polygon Spasial' : 'Atur Polygon');
    m.classList.toggle('readonly-spatial', group > 1);
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

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Handle Drop (supports folder drag via webkitGetAsEntry) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
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

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Handle Files (from input or drop) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
function handleSpatialFiles(fileList) {
  if (!canManageSpatialData()) {
    showToast('Akun ini hanya dapat mengatur tampilan polygon, bukan upload data spasial.', 'error');
    return;
  }
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
        showToast('Gagal parse: ' + job.name + (err ? ' ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ' + err : ''));
        processNext(idx + 1);
      }
    });
  }
  processNext(0);
}

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Parse single file/group to GeoJSON ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
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

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Upload GeoJSON ke Backend GAS ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
function uploadSpatialToBackendLegacy(geojson, filename, done) {
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin upload polygon spasial.', 'error');
    if (done) done();
    return;
  }
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
      showToast('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Tersimpan: ' + filename);
    } else { showToast('Gagal simpan: ' + (res.error || 'Error')); }
    if (done) done();
  }).catch(function(err) { showToast('Error upload: ' + err.message); if (done) done(); });
}

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Fetch daftar file spasial dari backend ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
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
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin upload polygon spasial.', 'error');
    if (done) done();
    return;
  }
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

function hasActiveBinaanSpatialScope() {
  var user = typeof getStoredAuthUser === 'function' ? getStoredAuthUser() : null;
  var group = getRoleGroup(user ? user.role : null);
  return (FILTER.binaan_pembina && FILTER.binaan_pembina.length > 0) ||
         (FILTER.binaan_kegiatan && FILTER.binaan_kegiatan.length > 0) ||
         (FILTER.binaan_jabatan && FILTER.binaan_jabatan.length > 0) ||
         (FILTER.luas_val !== null && FILTER.luas_val !== undefined && !isNaN(FILTER.luas_val)) ||
         group === 4 || group === 5;
}

function getActiveBinaanSpatialPoints() {
  var points = [];
  if (typeof DATA === 'undefined' || !Array.isArray(DATA.pegawaiBinaan)) return points;
  DATA.pegawaiBinaan.forEach(function(r) {
    if (!r) return;
    normalizeBinaanRow(r);
    if (!r._lat || !r._lng) return;
    if (!passFilter(r, 'pegawaiBinaan')) return;
    points.push({ lat: r._lat, lng: r._lng, row: r });
  });
  return points;
}

function getSpatialPointLat(point) {
  return Array.isArray(point) ? point[0] : point.lat;
}

function getSpatialPointLng(point) {
  return Array.isArray(point) ? point[1] : point.lng;
}

function spatialPointTouchesGeometry(point, geom) {
  if (!point || !geom || typeof turf === 'undefined') return false;
  var lat = getSpatialPointLat(point);
  var lng = getSpatialPointLng(point);
  if (!lat || !lng) return false;
  try {
    var turfFeat = turf.feature(geom);
    var fb = turf.bbox(turfFeat);
    if (lng < fb[0] || lng > fb[2] || lat < fb[1] || lat > fb[3]) return false;
    var turfPoint = turf.point([lng, lat]);

    if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      return turf.booleanPointInPolygon(turfPoint, turfFeat);
    }
    if (geom.type === 'Point' || geom.type === 'MultiPoint') {
      return turf.distance(turfPoint, turfFeat, { units: 'kilometers' }) <= 0.05;
    }
    if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
      return turf.pointToLineDistance(turfPoint, turfFeat, { units: 'kilometers' }) <= 0.05;
    }
    if (geom.type === 'GeometryCollection' && Array.isArray(geom.geometries)) {
      return geom.geometries.some(function(g) { return spatialPointTouchesGeometry(point, g); });
    }
    return true;
  } catch (e) {
    return false;
  }
}

function filterSpatialGeoJSONByPoints(gj, points) {
  var normalized = (typeof normalizeGeoJSON === 'function') ? normalizeGeoJSON(gj) : gj;
  if (!normalized || !normalized.features || !normalized.features.length || !points || !points.length) {
    return { type: 'FeatureCollection', features: [] };
  }

  var newFeatures = [];
  normalized.features.forEach(function(feature) {
    var geom = feature && feature.geometry;
    if (!geom) return;

    if (geom.type === 'MultiPolygon') {
      var matchedPolys = [];
      geom.coordinates.forEach(function(polyCoords) {
        var subGeom = { type: 'Polygon', coordinates: polyCoords };
        if (points.some(function(pt) { return spatialPointTouchesGeometry(pt, subGeom); })) {
          matchedPolys.push(polyCoords);
        }
      });
      if (matchedPolys.length > 0) {
        newFeatures.push({
          type: 'Feature',
          geometry: matchedPolys.length === 1
            ? { type: 'Polygon', coordinates: matchedPolys[0] }
            : { type: 'MultiPolygon', coordinates: matchedPolys },
          properties: feature.properties || {}
        });
      }
      return;
    }

    if (points.some(function(pt) { return spatialPointTouchesGeometry(pt, geom); })) {
      newFeatures.push(feature);
    }
  });

  return { type: 'FeatureCollection', features: newFeatures };
}

function passesCdkSpatialFilter(gj, activeCDKs, activePJLPoints, fileInfo) {
  var user = typeof getStoredAuthUser === 'function' ? getStoredAuthUser() : null;
  var group = getRoleGroup(user ? user.role : null);
  
  var hasCdkFilter = (activeCDKs && activeCDKs.length > 0) || group === 3;
  var hasPembinaFilter = hasActiveBinaanSpatialScope();
                         
  if (!hasCdkFilter && !hasPembinaFilter) return true;

  if (fileInfo && fileInfo.cdkTag && !hasPembinaFilter) {
    var fileCdkTags = fileInfo.cdkTag.toLowerCase().split(',').map(function(s) { return s.trim(); });
    if (activeCDKs && activeCDKs.length > 0) {
      var match = activeCDKs.some(function(cdk) {
        return fileCdkTags.indexOf(cdk.toLowerCase()) !== -1;
      });
      if (match) return true;
      return false;
    }
  }

  if (!activePJLPoints.length) return false;
  if (!gj || !gj.features || !gj.features.length) return false;
  try {
    var fileBbox = turf.bbox(gj);
    var anyNear = activePJLPoints.some(function(pt) {
      var lat = getSpatialPointLat(pt);
      var lng = getSpatialPointLng(pt);
      return lng >= fileBbox[0] && lng <= fileBbox[2] && lat >= fileBbox[1] && lat <= fileBbox[3];
    });
    if (!anyNear) return false;
    for (var i = 0; i < gj.features.length; i++) {
      var geom = gj.features[i].geometry;
      if (!geom) continue;
      var turfFeat = turf.feature(geom);
      var fb = turf.bbox(turfFeat);
      for (var j = 0; j < activePJLPoints.length; j++) {
        if (spatialPointTouchesGeometry(activePJLPoints[j], geom)) return true;
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
    line: { color: '#A4C639', weight: 5, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#e53935'
  },
  'Kawasan Hutan': {
    /* Updated as requested */
    polygon: { color: '#FFD700', weight: 2.5, opacity: 1, fillColor: '#38A800', fillOpacity: 0.20 },
    line: { color: '#FFD700', weight: 3.5, fillOpacity: 0, opacity: 1 },
    popupColor: '#38A800'
  },
  'Lahan Kritis': {
    polygon: { color: '#E69800', weight: 1.5, fillColor: '#E69800', fillOpacity: 0.78 },
    line: { color: '#E69800', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#E69800'
  },
  'Luasan Agroforestry': {
    polygon: { color: '#737300', weight: 2, fillColor: '#737300', fillOpacity: 0.5 },
    line: { color: '#737300', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#737300'
  },
  'Luasan Bambu': {
    polygon: { color: '#E69800', weight: 2, fillColor: '#E69800', fillOpacity: 0.5 },
    line: { color: '#E69800', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#E69800'
  },
  'Luasan Bencana (BTT)': {
    polygon: { color: '#E69800', weight: 2, fillColor: '#E69800', fillOpacity: 0.5 },
    line: { color: '#E69800', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#E69800'
  },
  'Luasan RHL': {
    polygon: { color: '#E69800', weight: 2, fillColor: '#E69800', fillOpacity: 0.5 },
    line: { color: '#E69800', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#E69800'
  },
  'Luasan CSR': {
    polygon: { color: '#E69800', weight: 2, fillColor: '#E69800', fillOpacity: 0.5 },
    line: { color: '#E69800', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#E69800'
  },
  'Luasan Jalur Permanen': {
    polygon: { color: '#228B22', weight: 2, fillColor: '#228B22', fillOpacity: 0.5 },
    line: { color: '#228B22', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#228B22'
  },
  'Luasan Aset': {
    polygon: { color: '#CCCCCC', weight: 2, fillColor: '#CCCCCC', fillOpacity: 0.5 },
    line: { color: '#CCCCCC', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#CCCCCC'
  },
  'Luasan KH Produksi': {
    polygon: { color: '#FFD966', weight: 2, fillColor: '#FFD966', fillOpacity: 0.5 },
    line: { color: '#FFD966', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#FFD966'
  },
  'Luasan KH Lindung': {
    polygon: { color: '#228B22', weight: 2, fillColor: '#228B22', fillOpacity: 0.5 },
    line: { color: '#228B22', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#228B22'
  },
  'Luasan Konversi': {
    polygon: { color: '#FFBEBE', weight: 2, fillColor: '#FFBEBE', fillOpacity: 0.5 },
    line: { color: '#FFBEBE', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#FFBEBE'
  },
  'Luasan APL': {
    polygon: { color: '#CCCCCC', weight: 2, fillColor: '#CCCCCC', fillOpacity: 0.5 },
    line: { color: '#CCCCCC', weight: 3, fillOpacity: 0, opacity: 0.95 },
    popupColor: '#CCCCCC'
  }
};

function isSpatialLineGeometry(geom) {
  return geom && (geom.type === 'LineString' || geom.type === 'MultiLineString');
}

function getSpatialFeatureStyle(feature, fileInfo) {
  var kategori = (fileInfo && fileInfo.kategori) ? fileInfo.kategori : 'Jaga Leuweung';
  var palette = SPATIAL_CATEGORY_STYLES[kategori] || SPATIAL_CATEGORY_STYLES['Jaga Leuweung'];
  var geom = feature && feature.geometry;

  /* Kuning kehijauan (#A4C639) hanya untuk garis murni tanpa isi - bukan polygon tipis */
  if (isSpatialLineGeometry(geom)) {
    return Object.assign({ dashArray: null, interactive: true }, palette.line || palette.polygon);
  }
  return Object.assign({ dashArray: null, interactive: true }, palette.polygon);
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
    if (tabs[i].innerText.trim() === tabName) {
      tabs[i].classList.add('active');
    }
  }
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

function shouldDefaultSpatialVisible(fileInfo) {
  if (!fileInfo || !fileInfo.kategori) return false;
  // ON (default aktif)
  var onList = [
    'Jaga Leuweung', 'Luasan Agroforestry', 'Luasan Bambu', 
    'Luasan Bencana (BTT)', 'Luasan CSR', 'Luasan RHL', 
    'Luasan Aset', 'Luasan Jalur Permanen', 'Luasan Konversi', 'Luasan APL'
  ];
  // OFF (default nonaktif): Lahan Kritis, Kawasan Hutan, KH Produksi, KH Lindung
  var offList = ['Lahan Kritis', 'Kawasan Hutan', 'Luasan KH Produksi', 'Luasan KH Lindung'];
  
  if (onList.indexOf(fileInfo.kategori) > -1) return true;
  if (offList.indexOf(fileInfo.kategori) > -1) return false;
  
  // Default to true for anything else unless explicitly listed
  return true;
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
          SPATIAL_VISIBLE_CACHE[f.fileId] = shouldDefaultSpatialVisible(f);
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

/* Render daftar file di modal (scroll + pagination) */
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
  var icons = {geojson:'&#128506;', json:'&#128506;', kml:'&#128205;', kmz:'&#128205;', shp:'&#128194;', zip:'&#128230;'};
  var html = pageFiles.map(function(f) {
    var ext = f.filename.split('.').pop().toLowerCase();
    var icon = icons[ext] || '&#128196;';
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

/* Render polygon ke peta dengan filter CDK (lazy + viewport) */
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
  
  var user = typeof getStoredAuthUser === 'function' ? getStoredAuthUser() : null;
  var group = getRoleGroup(user ? user.role : null);
  var hasCdkFilter = activeCDKs.length > 0 || group === 3;
  var hasPembinaFilter = hasActiveBinaanSpatialScope();

  if (hasCdkFilter || hasPembinaFilter) {
    activePJLPoints = getActiveBinaanSpatialPoints();

    // Untuk filter CDK saja, titik PJL masih boleh menjadi fallback spasial bila file belum punya CDK_Tag.
    // Untuk filter pembina/jabatan/kegiatan/luas dan role pegawai, acuan harus murni titik hutan binaan.
    if (!hasPembinaFilter && typeof DATA !== 'undefined' && Array.isArray(DATA.pjl)) {
      DATA.pjl.forEach(function(r) {
        if (!r._lat || !r._lng) return;
        if (passFilter(r, 'pjl')) {
          activePJLPoints.push({ lat: r._lat, lng: r._lng, row: r });
        }
      });
    }
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

/* Add one GeoJSON to the spatial layer with CDK spatial filter */
function addGeoJSONToSpatialLayer(gj, fileInfo, activeCDKs, activePJLPoints) {
  if (!gj || !gj.features || !SPATIAL_UPLOAD_LAYER) return null;
  
  var user = typeof getStoredAuthUser === 'function' ? getStoredAuthUser() : null;
  var group = getRoleGroup(user ? user.role : null);
  var hasCdkFilter = (activeCDKs && activeCDKs.length > 0) || group === 3;
  var hasPembinaFilter = hasActiveBinaanSpatialScope();
  var filterActive = hasCdkFilter || hasPembinaFilter;
  
  var hasCdkTagMatch = false;
  if (activeCDKs && activeCDKs.length > 0 && fileInfo && fileInfo.cdkTag) {
    var fileCdkTags = fileInfo.cdkTag.toLowerCase().split(',').map(function(s) { return s.trim(); });
    hasCdkTagMatch = activeCDKs.some(function(cdk) {
      return fileCdkTags.indexOf(cdk.toLowerCase()) !== -1;
    });
  }
  
  var useFeatureFilter = filterActive && activePJLPoints.length > 0 && !(hasCdkTagMatch && !hasPembinaFilter);
  if (fileInfo && SPATIAL_VISIBLE_CACHE[fileInfo.fileId] === false) return; // Hidden by toggle

  try {
    var filteredGj = gj;
    if (useFeatureFilter) {
      filteredGj = filterSpatialGeoJSONByPoints(gj, activePJLPoints);
      if (!filteredGj.features.length) return null;
    }

    var popupAccent = getSpatialPopupAccent(fileInfo);
    var geojsonLayer = L.geoJSON(filteredGj, {
      style: function(feature) { return getSpatialFeatureStyle(feature, fileInfo); },
      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, { icon: L.divIcon({ className: 'custom-diamond-icon', html: '<svg width="6" height="6" viewBox="0 0 100 100" style="overflow:visible;"><circle cx="50" cy="50" r="35" fill="#ef5350" stroke="#c62828" stroke-width="15"/></svg>', iconSize: [6, 6], iconAnchor: [3, 3] }) });
      },
      onEachFeature: function(feature, layer) {
        var props = feature.properties || {};
        var keys = Object.keys(props).filter(function(k) { return props[k] != null && props[k] !== ''; });
        if (!keys.length) { layer.bindPopup('<b>' + (fileInfo ? fileInfo.filename : '') + '</b>'); return; }
        var rows = keys.slice(0, 20).map(function(k) {
          return '<tr><td style="padding:2px 8px 2px 0; font-weight:600; color:#43a047; white-space:nowrap;">' + k + '</td><td style="padding:2px 0;">' + props[k] + '</td></tr>';
        }).join('');
        var html = '<div style="font-size:11px; font-family:Inter; max-height:220px; overflow-y:auto;">' +
          '<b style="font-size:12px; color:' + popupAccent + '; display:block; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">&#128196; ' + (fileInfo ? fileInfo.filename : '') + '</b>' +
          '<table>' + rows + '</table></div>';
        layer.bindPopup(html);
      }
    });
    geojsonLayer.addTo(SPATIAL_UPLOAD_LAYER);
    if (geojsonLayer.bringToBack) geojsonLayer.bringToBack();
    return geojsonLayer;
  } catch(e) { return null; }
}

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Zoom ke polygon tertentu ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
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

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Hapus polygon dari Drive, Sheet, dan peta ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
function deleteSpatialFile(fileId, filename) {
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin menghapus polygon spasial.', 'error');
    return;
  }
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
      showToast('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Polygon "' + filename + '" berhasil dihapus.');
    } else { showToast('Gagal hapus: ' + (res.error || 'Error backend')); if (itemEl) { itemEl.style.opacity = '1'; itemEl.style.pointerEvents = ''; } }
  }).catch(function(err) { showToast('Error: ' + err.message); if (itemEl) { itemEl.style.opacity = '1'; itemEl.style.pointerEvents = ''; } });
}

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Progress helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
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

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Auto-fetch saat halaman selesai dimuat ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
function initSpatialUploadSystem_() {
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
          if (type === 'pegawaiBinaan') normalizeBinaanRow(r);
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

function getDplInfoForRow(row, lat, lng) {
  row = row || {};
  var dpl = getRowDplValue(row);
  if (dpl === null) {
    lat = lat || row._lat || row.Latitude || row.latitude;
    lng = lng || row._lng || row.Longitude || row.longitude;
    requestDplForRow(row, lat, lng);
    dpl = getRowDplValue(row);
  }
  var cat = getDplCategory(dpl);
  return {
    dpl: dpl,
    value: dpl === null ? 'DPL tidak tersedia' : dpl.toLocaleString('id-ID') + ' mdpl',
    label: cat.label,
    range: cat.range,
    color: cat.color,
    statusHtml: '<span class="dpl-status-pill" style="border-color:' + cat.color + ';color:' + cat.color + ';">' + cat.label + (cat.range !== '-' ? ' (' + cat.range + ')' : '') + '</span>'
  };
}

function appendDplRows(rows, row, lat, lng) {
  var info = getDplInfoForRow(row, lat, lng);
  rows.push(['DPL', info.value]);
  rows.push(['Status DPL', info.statusHtml]);
  return rows;
}

function buildDplTooltipRowsHtml(row, lat, lng) {
  var info = getDplInfoForRow(row, lat, lng);
  return '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">DPL</span><span class="marker-tip-val">' + info.value + '</span></div>' +
    '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Status DPL</span><span class="marker-tip-val">' + info.statusHtml + '</span></div>';
}

var DPL_CACHE = {};
try {
  var stored = localStorage.getItem('GEOHUTAN_DPL_CACHE');
  if (stored) DPL_CACHE = JSON.parse(stored);
} catch (e) {}

function saveDplCache() {
  try { localStorage.setItem('GEOHUTAN_DPL_CACHE', JSON.stringify(DPL_CACHE)); } catch (e) {}
}

var DPL_PENDING = {};
var DPL_ENQUEUED = {};
var DPL_BATCH_TIMER = null;
var DPL_BATCH_QUEUE = [];
var CURRENT_DRAWER_ROW = null;
var CURRENT_DRAWER_TYPE = null;
var DPL_REMOTE_ENABLED = true;
var DPL_READOUT_CONTROL_READY = false;
var DPL_IS_FETCHING = false;
var DPL_BACKOFF_TIME = 1000;
var DPL_RATE_LIMITED_UNTIL = 0;
try {
  var rl = localStorage.getItem('GEOHUTAN_DPL_RATELIMIT');
  if (rl) DPL_RATE_LIMITED_UNTIL = parseInt(rl, 10);
} catch (e) {}

function getDplCategory(value) {
  if (value === null || value === undefined || value === '') return { label: 'DPL belum tersedia', color: '#78909c', range: '-' };
  var n = Math.round(Number(value));
  if (!isFinite(n)) return { label: 'DPL belum tersedia', color: '#78909c', range: '-' };
  if (n < 500) return { label: 'Dataran Rendah', color: '#2e7d32', range: '< 500 mdpl' };
  if (n < 1500) return { label: 'Dataran Menengah', color: '#fb8c00', range: '500 - < 1500 mdpl' };
  return { label: 'Pegunungan', color: '#d32f2f', range: '>= 1500 mdpl' };
}

function getRowDplValue(row) {
  if (!row) return null;
  var raw = row.DPL || row.dpl || row['DPL (mdpl)'] || row['DPL_mdpl'] || row['Ketinggian_DPL'] || row['Ketinggian DPL'];
  var n = toFloat(raw);
  return n === null ? null : Math.round(n);
}

function setRowDplValue(row, value) {
  if (!row || value === null || value === undefined || !isFinite(Number(value))) return;
  var dpl = Math.round(Number(value));
  var cat = getDplCategory(dpl);
  row.DPL = dpl;
  row['DPL (mdpl)'] = dpl;
  row.Status_DPL = cat.label;
  row['Status DPL'] = cat.label;
}

function getDplCacheKey(lat, lng) {
  var la = Number(lat), lo = Number(lng);
  if (!isFinite(la) || !isFinite(lo)) return '';
  return la.toFixed(5) + ',' + lo.toFixed(5);
}

function buildDplRows(row, lat, lng) {
  var dpl = getRowDplValue(row);
  if (row && dpl === null && lat && lng) {
    requestDplForRow(row, lat, lng);
    dpl = getRowDplValue(row);
  }
  var cat = getDplCategory(dpl);
  var value = dpl === null ? 'DPL tidak tersedia' : dpl.toLocaleString('id-ID') + ' mdpl';
  var status = '<span class="dpl-status-pill" style="border-color:' + cat.color + ';color:' + cat.color + ';">' + cat.label + (cat.range !== '-' ? ' (' + cat.range + ')' : '') + '</span>';
  return [['DPL', value], ['Status DPL', status]];
}

function requestDplForRow(row, lat, lng, callback) {
  var key = getDplCacheKey(lat, lng);
  if (!key) return;
  if (DPL_CACHE.hasOwnProperty(key)) {
    if (row) setRowDplValue(row, DPL_CACHE[key]);
    if (callback) callback(DPL_CACHE[key]);
    return;
  }
  if (!DPL_REMOTE_ENABLED || Date.now() < DPL_RATE_LIMITED_UNTIL) {
    // API kena limit, jangan berikan estimasi ngawur. Biarkan kosong agar tidak anomali.
    if (callback) callback(null);
    return;
  }
  if (DPL_ENQUEUED[key]) {
    // Jika sudah ada dalam antrean tapi butuh callback baru, tambahkan ke antrean baru dengan key yang sama
    // agar callback tereksekusi
    DPL_BATCH_QUEUE.push({ row: row, lat: Number(lat), lng: Number(lng), key: key, callback: callback });
    return;
  }
  DPL_ENQUEUED[key] = true;
  DPL_BATCH_QUEUE.push({ row: row, lat: Number(lat), lng: Number(lng), key: key, callback: callback });
  if (!DPL_IS_FETCHING && !DPL_BATCH_TIMER) DPL_BATCH_TIMER = setTimeout(flushDplBatch, 350);
}

function flushDplBatch() {
  DPL_BATCH_TIMER = null;
  if (DPL_IS_FETCHING) return;
  
  if (Date.now() < DPL_RATE_LIMITED_UNTIL) {
    if (DPL_BATCH_QUEUE.length) {
      DPL_BATCH_QUEUE = [];
      DPL_ENQUEUED = {};
      schedRender();
    }
    return;
  }
  if (!DPL_BATCH_QUEUE.length) return;
  DPL_IS_FETCHING = true;
  
  var batch = DPL_BATCH_QUEUE.splice(0, 90);
  var unique = [];
  var seen = {};
  
  batch.forEach(function(item) {
    delete DPL_ENQUEUED[item.key];
    if (!item.key || seen[item.key]) return;
    seen[item.key] = true;
    unique.push(item);
  });
  
  var pending = unique.filter(function(item) { return !DPL_PENDING[item.key] && !DPL_CACHE.hasOwnProperty(item.key); });
  if (!pending.length) {
    DPL_IS_FETCHING = false;
    if (DPL_BATCH_QUEUE.length) DPL_BATCH_TIMER = setTimeout(flushDplBatch, DPL_BACKOFF_TIME);
    return;
  }
  
  pending.forEach(function(item) { DPL_PENDING[item.key] = true; });
  var latParam = pending.map(function(item) { return item.lat.toFixed(5); }).join(',');
  var lngParam = pending.map(function(item) { return item.lng.toFixed(5); }).join(',');
  
  fetch('https://api.open-meteo.com/v1/elevation?latitude=' + latParam + '&longitude=' + lngParam)
    .then(function(res) {
      if (res.status === 429) {
        DPL_RATE_LIMITED_UNTIL = Date.now() + (5 * 60 * 1000); // Limit 5 menit
        try { localStorage.setItem('GEOHUTAN_DPL_RATELIMIT', DPL_RATE_LIMITED_UNTIL); } catch(e) {}
        throw new Error('Rate Limited (429)');
      }
      if (!res.ok) throw new Error('API Error ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (!data || !Array.isArray(data.elevation)) throw new Error('Invalid response');
      DPL_BACKOFF_TIME = 1000;
      pending.forEach(function(item, idx) {
        var val = Number(data.elevation[idx]);
        if (isFinite(val)) {
          var finalDpl = Math.round(val);
          DPL_CACHE[item.key] = finalDpl;
          batch.forEach(function(original) {
            if (original.key !== item.key) return;
            setRowDplValue(original.row, finalDpl);
            if (original.callback) original.callback(finalDpl);
          });
        }
      });
      saveDplCache();
      schedRender();
      updateMapDplReadout();
    })
    .catch(function(err) {
      if (err.message && err.message.indexOf('429') !== -1) {
        // Drop antrean jika terkena rate limit, jangan berikan estimasi.
        DPL_BATCH_QUEUE = [];
        DPL_ENQUEUED = {};
        schedRender();
        updateMapDplReadout();
      } else {
        DPL_BACKOFF_TIME = Math.min(DPL_BACKOFF_TIME * 2, 30000);
        batch.forEach(function(item) {
          if (!DPL_ENQUEUED[item.key] && !DPL_CACHE.hasOwnProperty(item.key)) {
            DPL_ENQUEUED[item.key] = true;
            DPL_BATCH_QUEUE.push(item);
          }
        });
      }
    })
    .finally(function() {
      DPL_IS_FETCHING = false;
      pending.forEach(function(item) { delete DPL_PENDING[item.key]; });
      if (DPL_BATCH_QUEUE.length && !DPL_BATCH_TIMER && Date.now() >= DPL_RATE_LIMITED_UNTIL) {
        DPL_BATCH_TIMER = setTimeout(flushDplBatch, DPL_BACKOFF_TIME);
      }
    });
}

function hydrateDplForVisibleRows() {
  // DPL dihitung lazy saat titik/panel/readout dibutuhkan agar tidak membanjiri layanan elevasi.
}

function updateMapDplReadout() {
  var el = document.getElementById('map-dpl-readout');
  if (!el || !mapObj) return;
  var center = mapObj.getCenter();
  if (!center) return;
  var key = getDplCacheKey(center.lat, center.lng);
  if (!key) return;
  if (DPL_CACHE.hasOwnProperty(key)) {
    var dpl = DPL_CACHE[key];
    var cat = getDplCategory(dpl);
    el.innerHTML = '<span style="color:' + cat.color + ';">DPL ' + Math.round(dpl).toLocaleString('id-ID') + ' mdpl</span> ' + cat.label;
  } else {
    el.innerHTML = '<span style="color:#78909c;">Memuat DPL...</span>';
    requestDplForRow(null, center.lat, center.lng, function(val) {
      // Pastikan posisi center belum bergeser drastis saat request kembali
      var currCenter = mapObj.getCenter();
      var currKey = getDplCacheKey(currCenter.lat, currCenter.lng);
      if (currKey !== key) return;
      
      if (val !== null) {
        var cat = getDplCategory(val);
        el.innerHTML = '<span style="color:' + cat.color + ';">DPL ' + Math.round(val).toLocaleString('id-ID') + ' mdpl</span> ' + cat.label;
      } else {
        el.textContent = 'DPL tidak tersedia';
      }
    });
  }
}

function initDplReadoutControl() {
  if (DPL_READOUT_CONTROL_READY || typeof L === 'undefined' || !mapObj) return;
  var el = document.getElementById('map-dpl-readout');
  if (!el) return;
  var DplControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      var wrap = L.DomUtil.create('div', 'leaflet-control dpl-readout-control');
      wrap.appendChild(el);
      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.disableScrollPropagation(wrap);
      return wrap;
    }
  });
  mapObj.addControl(new DplControl());
  DPL_READOUT_CONTROL_READY = true;
}

if (typeof mapObj !== 'undefined' && mapObj) {
  initDplReadoutControl();
  mapObj.on('zoomend moveend', function() {
    clearTimeout(window.__dplReadoutTimer);
    window.__dplReadoutTimer = setTimeout(updateMapDplReadout, 250);
  });
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
  appendDplRows(rows, feat, feat.Latitude || feat._lat, feat.Longitude || feat._lng);
  return buildMarkerTipPanel(title, rows, '#2e7d32');
}

function buildPjlPopupRow(label, value) {
  var v = value == null || value === '' ? '-' : value;
  return '<div class="pjl-popup-row"><span class="pjl-popup-lbl">' + label + '</span><span class="pjl-popup-val">' + v + '</span></div>';
}

function hasSheetValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function normalizeSheetKey(key) {
  return String(key || '')
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getSheetValue(row, aliases) {
  if (!row || typeof row !== 'object') return '';
  aliases = aliases || [];
  for (var i = 0; i < aliases.length; i++) {
    if (Object.prototype.hasOwnProperty.call(row, aliases[i]) && hasSheetValue(row[aliases[i]])) {
      return row[aliases[i]];
    }
  }
  var wanted = {};
  aliases.forEach(function(alias) { wanted[normalizeSheetKey(alias)] = true; });
  var keys = Object.keys(row);
  for (var j = 0; j < keys.length; j++) {
    if (wanted[normalizeSheetKey(keys[j])] && hasSheetValue(row[keys[j]])) {
      return row[keys[j]];
    }
  }
  return '';
}

function parseLuasHa(value) {
  if (!hasSheetValue(value)) return 0;
  var s = String(value).trim().replace(/\s+/g, '').replace(/[^\d,.\-]/g, '');
  if (!s) return 0;
  var lastComma = s.lastIndexOf(',');
  var lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma > -1) {
    s = s.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function getBinaanLuasRaw(row) {
  return getSheetValue(row, [
    'Luas (Ha)', 'Luasan (Ha)', 'Luas_Ha', 'Luasan_Ha',
    'Luas Ha', 'Luasan Ha', 'Luas', 'Luasan',
    'luas', 'luasan', 'luas_ha', 'luasan_ha'
  ]);
}

function getBinaanLuas(row) {
  return parseLuasHa(getBinaanLuasRaw(row));
}

function formatLuasHa(value) {
  var n = typeof value === 'number' ? value : parseLuasHa(value);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getBinaanKabupaten(row) {
  return getSheetValue(row, ['Kabupaten', 'Kabupaten/Kota', 'Kab/Kota', 'KABUPATEN', 'KAB_KOTA']) || (row && row._kab) || '';
}

function getBinaanField(row, field) {
  var aliases = {
    kecamatan: ['Kecamatan', 'KECAMATAN'],
    desa: ['Desa', 'Desa/Kelurahan', 'Desa / Kelurahan', 'DESA'],
    kegiatan: ['Kegiatan', 'KEGIATAN'],
    tahun: ['Tahun Kegiatan', 'Tahun_Kegiatan', 'TAHUN KEGIATAN'],
    pembina: ['Pembina/Pengampu', 'Pembina / Pengampu', 'Pembina', 'Pengampu'],
    unit: ['Unit Kerja', 'UNIT KERJA', 'Unit_Kerja', 'Unit'],
    jabatan: ['Jabatan', 'JABATAN', 'Nama Jabatan'],
    nip: ['NIP', 'Nip']
  };
  return getSheetValue(row, aliases[field] || [field]);
}

function normalizeBinaanRow(row) {
  if (!row || typeof row !== 'object') return row;
  var luasRaw = getBinaanLuasRaw(row);
  if (hasSheetValue(luasRaw)) {
    if (!hasSheetValue(row['Luas (Ha)'])) row['Luas (Ha)'] = luasRaw;
    if (!hasSheetValue(row['Luasan (Ha)'])) row['Luasan (Ha)'] = luasRaw;
    if (!hasSheetValue(row.Luas_Ha)) row.Luas_Ha = luasRaw;
    if (!hasSheetValue(row.Luas)) row.Luas = luasRaw;
  }
  var kab = getBinaanKabupaten(row);
  if (hasSheetValue(kab) && !hasSheetValue(row._kab)) row._kab = kab;
  var pembina = getBinaanField(row, 'pembina');
  if (hasSheetValue(pembina) && !hasSheetValue(row['Pembina/Pengampu'])) row['Pembina/Pengampu'] = pembina;
  var kegiatan = getBinaanField(row, 'kegiatan');
  if (hasSheetValue(kegiatan) && !hasSheetValue(row.Kegiatan)) row.Kegiatan = kegiatan;
  var jabatan = getBinaanField(row, 'jabatan');
  if (hasSheetValue(jabatan) && !hasSheetValue(row.Jabatan)) row.Jabatan = jabatan;
  var unit = getBinaanField(row, 'unit');
  if (hasSheetValue(unit) && !hasSheetValue(row['Unit Kerja'])) row['Unit Kerja'] = unit;
  return row;
}

/* Drawer */
function openDrawer(type, r) {
  CURRENT_DRAWER_TYPE = type;
  CURRENT_DRAWER_ROW = r;
  var dr = document.getElementById('detail-drawer');
  if (dr) {
    dr.style.display = '';
    dr.style.visibility = 'visible';
    dr.classList.remove('minimized');
  }
  var minBtn = document.getElementById('drawer-min-btn');
  if (minBtn) minBtn.innerHTML = '&minus;';

  // Auto-collapse sidebar on mobile to prevent overlapping
  if (window.innerWidth <= 950) {
    var sb = document.getElementById('sidebar');
    if (sb && !sb.classList.contains('sidebar-collapsed')) {
      sb.classList.add('sidebar-collapsed');
      var sbBtn = document.getElementById('sidebar-collapse-btn');
      if (sbBtn) sbBtn.innerHTML = '&rsaquo;';
    }
  }

  var t = document.getElementById('drawer-title');
  var c = document.getElementById('drawer-content');
  if (c) c.scrollTop = 0;
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
    var _perPhotoRow = r;
  } else if (type === 'peg' || type === 'pegawai') {
    config = [
      ['Nama', r['Nama'] || r['NAMA']],
      ['Unit Kerja', r['Unit Kerja'] || r['UNIT KERJA']],
      ['Jabatan', r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN']],
      ['Alamat', r['Alamat'] || r['ALAMAT']],
      ['Koordinat', coordText(lat, lng)]
    ];
    var _pegPhotoRow = r;
  } else if (type === 'pegb' || type === 'pegawaiBinaan') {
    normalizeBinaanRow(r);
    var kabupatenBinaan = getBinaanKabupaten(r);
    config = [
      ['Kabupaten', kabupatenBinaan],
      ['Kecamatan', getBinaanField(r, 'kecamatan')],
      ['Desa', getBinaanField(r, 'desa')],
      ['Kegiatan', getBinaanField(r, 'kegiatan')],
      ['Tahun Kegiatan', getBinaanField(r, 'tahun')],
      ['Luas (Ha)', formatLuasHa(getBinaanLuas(r)) + ' Ha'],
      ['Pembina/Pengampu', getBinaanField(r, 'pembina')],
      ['Unit Kerja', getBinaanField(r, 'unit')],
      ['Jabatan', getBinaanField(r, 'jabatan')],
      ['NIP', getBinaanField(r, 'nip')],
      ['Koordinat', coordText(lat, lng)]
    ];
    var _pegbPhotoRow = r;
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

  if (cy && cx && ['pjl', 'per', 'persemaian', 'pegb', 'pegawaiBinaan', 'pohon', 'polygon_kegiatan', 'jum', 'jumat'].indexOf(type) !== -1) {
    config = config.concat(buildDplRows(r, cy, cx));
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
    if (featId && canManageSpatialData()) {
      html += '<div class="drawer-action-row"><button class="drawer-delete-btn" onclick="deletePolygonKegiatan(\'' + featId + '\')">Hapus Kegiatan</button></div>';
    }
  }

  // Inject photo gallery for Jumat Menanam & PJL & Pegawai & Pohon
  if ((type === 'jum' || type === 'jumat') && typeof _jumPhotoRow !== 'undefined') {
    html += buildReportHubSection(_jumPhotoRow, 'juna');
  }
  if (type === 'pjl' && typeof _pjlPhotoRow !== 'undefined') {
    html += buildReportHubSection(_pjlPhotoRow, 'pjl');
  }
  if ((type === 'pegb' || type === 'pegawaiBinaan') && typeof _pegbPhotoRow !== 'undefined') {
    html += buildReportHubSection(_pegbPhotoRow, 'pegawaiBinaan');
  }
  if ((type === 'pohon' || type === 'polygon_kegiatan') && typeof _pohonPhotoRow !== 'undefined') {
    html += buildReportHubSection(_pohonPhotoRow, 'polygon');
  }
  if ((type === 'per' || type === 'persemaian') && typeof _perPhotoRow !== 'undefined') {
    html += buildReportHubSection(_perPhotoRow, 'per');
  }

  if (c) c.innerHTML = html;
  PHOTO_GALLERY.angleFilter = 'all';
  
  // Init gallery state after DOM injection
  if ((type === 'jum' || type === 'jumat') && typeof _jumPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'juna';
    PHOTO_GALLERY.row = _jumPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_jumPhotoRow, 'juna');
    PHOTO_GALLERY.idx = 0;
    WEEKLY_REPORT_STATE.context = 'juna';
    WEEKLY_REPORT_STATE.row = _jumPhotoRow;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  if (type === 'pjl' && typeof _pjlPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'pjl';
    PHOTO_GALLERY.row = _pjlPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_pjlPhotoRow, 'pjl');
    PHOTO_GALLERY.idx = 0;
    WEEKLY_REPORT_STATE.context = 'pjl';
    WEEKLY_REPORT_STATE.row = _pjlPhotoRow;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  if ((type === 'pohon' || type === 'polygon_kegiatan') && typeof _pohonPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'polygon';
    PHOTO_GALLERY.row = _pohonPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_pohonPhotoRow, 'polygon');
    PHOTO_GALLERY.idx = 0;
    WEEKLY_REPORT_STATE.context = 'polygon';
    WEEKLY_REPORT_STATE.row = _pohonPhotoRow;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  if ((type === 'pegb' || type === 'pegawaiBinaan') && typeof _pegbPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'pegawaiBinaan';
    PHOTO_GALLERY.row = _pegbPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_pegbPhotoRow, 'pegawaiBinaan');
    PHOTO_GALLERY.idx = 0;
    WEEKLY_REPORT_STATE.context = 'pegawaiBinaan';
    WEEKLY_REPORT_STATE.row = _pegbPhotoRow;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  if ((type === 'per' || type === 'persemaian') && typeof _perPhotoRow !== 'undefined') {
    PHOTO_GALLERY.context = 'per';
    PHOTO_GALLERY.row = _perPhotoRow;
    PHOTO_GALLERY.year = getCurrentPhotoYear(_perPhotoRow, 'per');
    PHOTO_GALLERY.idx = 0;
    WEEKLY_REPORT_STATE.context = 'per';
    WEEKLY_REPORT_STATE.row = _perPhotoRow;
    refreshGalleryForYear(PHOTO_GALLERY.year);
  }
  
  if (dr) {
    dr.classList.remove('minimized');
    dr.classList.add('open');
  }

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Inject AI Assistant card FIRST, then reset scroll ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  if (typeof GeoHutanAI !== 'undefined' && typeof GeoHutanAI.injectCard === 'function') {
    GeoHutanAI.injectCard(type, r);
  }
  
  // Reset scroll to top AFTER all content is injected
  setTimeout(function() {
    var c2 = document.getElementById('drawer-content');
    if (c2) c2.scrollTop = 0;
  }, 50);
}
function closeDrawer() { 
  var dr = document.getElementById('detail-drawer');
  if (dr) {
    dr.classList.remove('open', 'minimized');
    var minBtn = document.getElementById('drawer-min-btn');
    if (minBtn) minBtn.innerHTML = '&minus;';
    setTimeout(function() {
      if (!dr.classList.contains('open')) {
        dr.style.display = 'none';
        dr.style.visibility = '';
      }
    }, 320);
  }
  CURRENT_DRAWER_TYPE = null;
  CURRENT_DRAWER_ROW = null;
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

function getFriendlyBackendErrorMessage(err) {
  var msg = err && err.message ? err.message : String(err || '');
  if (/Aksi tidak dikenal:\s*saveWeeklyReport/i.test(msg) || /Aksi tidak dikenal:\s*getWeeklyReports/i.test(msg) || /Aksi tidak dikenal:\s*getAllWeeklyReports/i.test(msg)) {
    return '\u26a0\ufe0f Backend Apps Script belum memakai kode terbaru.\n\nLangkah perbaikan:\n1. Buka script.google.com\n2. Pilih project backend.gs\n3. Klik Deploy \u2192 Manage Deployments\n4. Edit deployment aktif \u2192 pilih "Latest version"\n5. Klik Deploy, lalu refresh halaman ini.';
  }
  return msg;
}

function checkBackendVersion(callback) {
  if (_backendVersionOk !== null) { if (callback) callback(_backendVersionOk); return; }
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.indexOf('script.google.com') === -1) { if (callback) callback(true); return; }
  fetch(GAS_WEB_APP_URL + '?action=getVersion')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var ok = !!(data && data.success && data.version === REQUIRED_BACKEND_VERSION && data.features && data.features.indexOf('saveWeeklyReport') !== -1);
      _backendVersionOk = ok;
      _backendVersionChecked = true;
      if (callback) callback(ok);
    })
    .catch(function() {
      _backendVersionChecked = true;
      if (callback) callback(!navigator.onLine);
    });
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
      }).bindTooltip('r ÃƒÂ¢Ã¢â‚¬Â°Ã‹â€  79.8m<br>Luas Ãƒâ€šÃ‚Â±2 Ha', {permanent: true, direction: 'center', className: 'measure-tooltip'});
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
  var reportMenu = document.getElementById('report-menu');
  if (reportMenu && !reportMenu.contains(e.target)) closeReportMenu();
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
    DATA.pegawai.map(r=>({t:'peg',r:r})), DATA.jumat.map(r=>({t:'jum',r:r})),
    DATA.pegawaiBinaan.map(r=>({t:'pegb',r:r}))
  );
  var item = allData[idx];
  if (item && item.r) {
    closeGlobalSearch();
    mapObj.setView([item.r._lat, item.r._lng], 16);
    highlightMarker(item.r._lat, item.r._lng, item.t);
    openDrawer(item.t, item.r);
  }
}

function normalizeLocalSearchText(value) {
  var s = String(value == null ? '' : value).toLowerCase();
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(e) {}
  return s.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function rowSearchDump(row) {
  if (!row || typeof row !== 'object') return '';
  return Object.keys(row).filter(function(k) { return k.charAt(0) !== '_'; }).map(function(k) {
    return row[k];
  }).join(' ');
}

function getSearchTextParts(item) {
  var r = item && item.r ? item.r : {};
  var t = item ? item.t : '';
  if (t === 'pegb') {
    return {
      title: getBinaanField(r, 'pembina') || getName(r),
      sub: [getBinaanField(r, 'kegiatan'), getBinaanKabupaten(r), getBinaanField(r, 'kecamatan'), getBinaanField(r, 'desa')].filter(Boolean).join(' - '),
      text: [
        getBinaanField(r, 'pembina'), getBinaanField(r, 'unit'), getBinaanField(r, 'jabatan'),
        getBinaanField(r, 'kegiatan'), getBinaanKabupaten(r), getBinaanField(r, 'kecamatan'),
        getBinaanField(r, 'desa'), getBinaanField(r, 'nip'), r._kab
      ].join(' ')
    };
  }
  if (t === 'per') {
    return {
      title: r['Nama Persemaian'] || r['Nama Personil Jaga leuweung'] || r['Nama Personil Jaga Leuweung'] || r['Nama'] || getName(r),
      sub: [r['Unit Kerja'], r['Kecamatan'], r['Desa/ Kelurahan'] || r['Desa/Kelurahan'] || r['Desa'], r['Status Persemaian']].filter(Boolean).join(' - '),
      text: [
        r['Nama Persemaian'], r['Nama Personil Jaga leuweung'], r['Nama Personil Jaga Leuweung'], r['Nama'],
        r['Unit Kerja'], r['Kecamatan'], r['Desa/ Kelurahan'], r['Desa/Kelurahan'], r['Desa'],
        r['Blok'], r['Status Persemaian'], r._kab
      ].join(' ')
    };
  }
  if (t === 'jum') {
    return {
      title: r['Nama Lokasi'] || r['Lokasi Penanaman'] || r['Lokasi'] || getName(r),
      sub: [r['Unit Kerja'], r['Kabupaten/Kota'] || r._kab, r['Kecamatan'], r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa']].filter(Boolean).join(' - '),
      text: [
        r['Nama Lokasi'], r['Lokasi Penanaman'], r['Lokasi'], r['Unit Kerja'], r['Kabupaten/Kota'], r._kab,
        r['Kecamatan'], r['Desa/Kelurahan'], r['Desa/ Kelurahan'], r['Desa'], r['Blok'], r['Kategori Lojuna']
      ].join(' ')
    };
  }
  if (t === 'pjl') {
    return {
      title: r['Nama Lengkap'] || r['Nama Personil Jaga leuweung'] || r['Nama Personil Jaga Leuweung'] || r['Nama Petugas'] || getName(r),
      sub: [r['Unit Kerja'], r['Penyuluh Kehutanan'], r['Kawasan Leuweung/ Gunung'], r._kab].filter(Boolean).join(' - '),
      text: [
        r['Nama Lengkap'], r['Nama Personil Jaga leuweung'], r['Nama Personil Jaga Leuweung'], r['Nama Petugas'],
        r['Penyuluh Kehutanan'], r['Unit Kerja'], r['Kawasan Leuweung/ Gunung'], r['Alamat'], r._kab
      ].join(' ')
    };
  }
  return {
    title: r['Nama'] || r['NAMA'] || getName(r),
    sub: [r['Unit Kerja'] || r['UNIT KERJA'], r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN'], r._kab].filter(Boolean).join(' - '),
    text: [r['Nama'], r['NAMA'], r['Unit Kerja'], r['UNIT KERJA'], r['Nama Jabatan'], r['Jabatan'], r['JABATAN'], r['Alamat'], r._kab].join(' ')
  };
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
  
  var qNormalized = normalizeLocalSearchText(q);
  var qTokens = qNormalized.split(' ').filter(Boolean);
  var allData = [].concat(
    DATA.pjl.map(r=>({t:'pjl',r:r})), DATA.persemaian.map(r=>({t:'per',r:r})),
    DATA.pegawai.map(r=>({t:'peg',r:r})), DATA.jumat.map(r=>({t:'jum',r:r})),
    DATA.pegawaiBinaan.map(r=>({t:'pegb',r:r}))
  );
  
  for (var i = 0; i < allData.length; i++) {
    var item = allData[i]; var r = item.r;
    if (!r || !r._lat || !r._lng) continue;
    var fType = item.t === 'per' ? 'persemaian' : (item.t === 'jum' ? 'jumat' : (item.t === 'peg' ? 'pegawai' : (item.t === 'pegb' ? 'pegawaiBinaan' : item.t)));
    if (!passFilter(r, fType)) continue;
    var meta = getSearchTextParts(item);
    var name = safe(meta.title);
    var unit = safe(meta.sub || r['Unit Kerja'] || r['UNIT KERJA']);
    var textSearch = normalizeLocalSearchText([meta.title, meta.sub, meta.text, rowSearchDump(r)].join(' '));
    
    if (qTokens.every(function(token) { return textSearch.indexOf(token) > -1; })) {
      count++;
      html += '<div class="search-res-item" onclick="flyToLocalItem(\''+item.t+'\', '+i+')">' +
              '<div class="search-res-title">'+name+'</div>' +
              '<div class="search-res-sub">'+unit+'</div>' +
              '<div class="search-res-source" style="background:'+POP_COLOR[item.t]+'">'+POP_LABEL[item.t]+'</div></div>';
      if (count >= 20) break; 
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
  
  FILTER.binaan_kegiatan = getVals('f_binaan_kegiatan');
  FILTER.binaan_jabatan = getVals('f_binaan_jabatan');
  FILTER.binaan_pembina = getVals('f_binaan_pembina');
  
  FILTER.luas_op = $('#f_luas_op').val() || '>=';
  var luasValStr = $('#f_luas_val').val();
  FILTER.luas_val = luasValStr ? parseFloat(luasValStr) : null;
  
  schedRender();
  rerenderPolygonFeaturesFromCache();
}
function resetFilter() {
  FILTER = { cdk: [], pegawaiUnit: [], kab: [], status: [], kawasan: [], jabatan: [], nama_pegawai: [], penyuluh: [], kategori_lojuna: [], binaan_kegiatan: [], binaan_jabatan: [], binaan_pembina: [], luas_op: '>=', luas_val: null };
  ['f_cdk','f_pegawai','f_kab','f_status','f_kawasan','f_jabatan', 'f_nama_pegawai', 'f_penyuluh', 'f_kategori_lojuna', 'f_binaan_kegiatan', 'f_binaan_jabatan', 'f_binaan_pembina'].forEach(function(id) {
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
  
  var luasVal = document.getElementById('f_luas_val'); if (luasVal) luasVal.value = '';
  var luasOp = document.getElementById('f_luas_op'); if (luasOp) luasOp.value = '>=';
  
  schedRender();
  rerenderPolygonFeaturesFromCache();
}
function forceRefresh() { try { mapObj.invalidateSize(); } catch(e) {} schedRender(); showToast('Tampilan disegarkan'); }

function getCDKExtended(unitKerja) {
  var u = String(unitKerja || '').toUpperCase().trim();
  if (!u) return null;
  if (u.includes('SPTH') || u.includes('SERTIFIKASI DAN PERBENIHAN')) return 'SPTH';
  if (u.includes('P2HH') || u.includes('PPPH') || u.includes('PPHH') || u.includes('PENGOLAHAN HASIL HUTAN')) return 'PPPH';
  if (u.includes('TAHURA') || u.includes('TAMAN HUTAN RAYA')) return 'TAHURA';
  // Handle 'CABANG DINAS KEHUTANAN WILAYAH I BOGOR' ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 'CDK WILAYAH I'
  var m = u.match(/CABANG\s+DINAS\s+KEHUTANAN\s+WILAYAH\s+([IVX]+|\d+)/i) ||
          u.match(/CABANG\s+DINAS\s+(?:KE)?HUT(?:ANAN)?\s+WIL(?:AYAH)?\s+([IVX]+|\d+)/i) ||
          u.match(/CDK\s*(?:WILAYAH\s*)?([IVX]+|\d+)/i);
  if (m) return 'CDK Wilayah ' + romanOrNumberToInt(m[1]);
  return getCDK(u);
}

function formatCDKChartLabel(label) {
  var s = String(label || '').trim();
  var m = s.match(/^CDK\s*(?:WILAYAH\s*)?([IVX]+|\d+)$/i);
  if (!m) return s;
  return 'CDK Wilayah ' + romanOrNumberToInt(m[1]);
}

function romanOrNumberToInt(value) {
  var s = String(value || '').trim().toUpperCase();
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  var romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  return romanMap[s] || s;
}

function normalizeFilterType(type) {
  if (type === 'per') return 'persemaian';
  if (type === 'peg') return 'pegawai';
  if (type === 'jum') return 'jumat';
  if (type === 'pegb') return 'pegawaiBinaan';
  return type;
}

function filterHasValue(selectedValues, value) {
  if (!selectedValues || !selectedValues.length) return true;
  var target = String(value || '').trim().toLowerCase();
  return selectedValues.some(function(v) {
    return String(v || '').trim().toLowerCase() === target;
  });
}

function passFilter(r, type) {
  type = normalizeFilterType(type);
  if (!r || typeof r !== 'object') return false;
  
  // RBAC Group Logic
  if (typeof getStoredAuthUser === 'function') {
    var user = getStoredAuthUser();
    if (user && user.username) {
      var group = getRoleGroup(user.role);
      if (group === 3) {
        var rUnit = String(getRowUnit(r, type)).toLowerCase().trim();
        var uUnit = String(getCurrentUserUnit(user)).toLowerCase().trim();
        var rCdk = getCDKExtended(rUnit);
        var uCdk = getCDKExtended(uUnit);
        if (uCdk && rCdk && uCdk !== rCdk) {
          return false;
        } else if (uUnit && rUnit && uUnit !== rUnit && (!uCdk || !rCdk)) {
          return false;
        }
      } else if (group === 4) {
        if (type !== 'pegawai' && type !== 'pegawaiBinaan') {
          var rUnit2 = String(getRowUnit(r, type)).toLowerCase().trim();
          var uUnit2 = String(getCurrentUserUnit(user)).toLowerCase().trim();
          var rCdk2 = getCDKExtended(rUnit2);
          var uCdk2 = getCDKExtended(uUnit2);
          if (uCdk2 && rCdk2 && uCdk2 !== rCdk2) {
            return false;
          } else if (uUnit2 && rUnit2 && uUnit2 !== rUnit2 && (!uCdk2 || !rCdk2)) {
            return false;
          }
        } else {
          if (!isOwnPegawaiRecord(r, type, user)) return false;
        }
      } else if (group === 5) {
        if (type === 'pegawai' || type === 'pegawaiBinaan') {
          if (!isOwnPegawaiRecord(r, type, user)) return false;
        } else {
          var rUnit3 = String(getRowUnit(r, type)).toLowerCase().trim();
          var uUnit3 = String(getCurrentUserUnit(user)).toLowerCase().trim();
          var rCdk3 = getCDKExtended(rUnit3);
          var uCdk3 = getCDKExtended(uUnit3);
          if (uCdk3 && rCdk3 && uCdk3 !== rCdk3) {
            return false;
          } else if (uUnit3 && rUnit3 && uUnit3 !== rUnit3 && (!uCdk3 || !rCdk3)) {
            return false;
          }
        }
      }
    }
  }

  if (type === 'pegawaiBinaan') normalizeBinaanRow(r);
  var unitKerja = String(getRowUnit(r, type)).trim();
  var cdk = getCDKExtended(unitKerja); 
  var kab = String(r._kab || '');
  
  if (FILTER.cdk && FILTER.cdk.length > 0 && !FILTER.cdk.includes(cdk)) return false;
  if (FILTER.kab && FILTER.kab.length > 0 && !filterHasValue(FILTER.kab, kab)) return false;
  
  if (type === 'pegawai') {
    if (FILTER.pegawaiUnit && FILTER.pegawaiUnit.length > 0 && !FILTER.pegawaiUnit.includes(unitKerja)) return false;
    var jabatan = String(r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN'] || '').trim();
    if (FILTER.jabatan && FILTER.jabatan.length > 0 && !FILTER.jabatan.includes(jabatan)) return false;
    var nama_peg = String(r['Nama'] || r['NAMA'] || '').trim();
    if (FILTER.nama_pegawai && FILTER.nama_pegawai.length > 0 && !FILTER.nama_pegawai.includes(nama_peg)) return false;
  }
  
  if (type === 'pegawaiBinaan') {
    normalizeBinaanRow(r);
    if (!filterHasValue(FILTER.binaan_kegiatan, getBinaanField(r, 'kegiatan'))) return false;
    if (!filterHasValue(FILTER.binaan_jabatan, getBinaanField(r, 'jabatan'))) return false;
    if (!filterHasValue(FILTER.binaan_pembina, getBinaanField(r, 'pembina'))) return false;
    
    if (FILTER.luas_val !== null && !isNaN(FILTER.luas_val)) {
      var luas = getBinaanLuas(r);
      if (FILTER.luas_op === '>=' && !(luas >= FILTER.luas_val)) return false;
      if (FILTER.luas_op === '>' && !(luas > FILTER.luas_val)) return false;
      if (FILTER.luas_op === '<=' && !(luas <= FILTER.luas_val)) return false;
      if (FILTER.luas_op === '<' && !(luas < FILTER.luas_val)) return false;
      if (FILTER.luas_op === '=' && Math.abs(luas - FILTER.luas_val) > 0.0001) return false;
    }
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
(typeof loadJawaBaratGeoJSON === 'function' ? loadJawaBaratGeoJSON() : fetch('Jawa Barattt.geojson').then(function(res) { return res.json(); })).then(gj => {
  GEO = gj;
  GEO_FEATURE_BOUNDS = null;
  ['pjl','persemaian','pegawai','jumat','pegawaiBinaan'].forEach(function(t) {
    DATA[t].forEach(function(r) {
      if (t === 'pegawaiBinaan') normalizeBinaanRow(r);
      if (r._lat && r._lng && !r._kab) r._kab = getKab(r._lat, r._lng) || (t === 'pegawaiBinaan' ? getBinaanKabupaten(r) : '');
      if (t === 'pegawaiBinaan') normalizeBinaanRow(r);
    });
  });
  fillDropdown(); schedRender();
}).catch(e => console.warn('GeoJSON:', e));

/* CSV Loader */
function loadCSV(url, type) {
  var done = false;
  var watchdog = null;
  function finish() {
    if (done) return;
    done = true;
    if (watchdog) clearTimeout(watchdog);
    onLoaded();
  }

  try {
    watchdog = setTimeout(function() {
      if (done) return;
      done = true;
      console.warn('CSV timeout:', type, url);
      onLoaded();
    }, 25000);

    var gidMatch = String(url || '').match(/[?&]gid=([^&]+)/);
    var sourceGid = gidMatch ? decodeURIComponent(gidMatch[1]) : '';
    
    // Add cache buster to bypass browser cache
    var fetchUrl = url;
    if (fetchUrl) {
      fetchUrl += (fetchUrl.indexOf('?') !== -1 ? '&' : '?') + '_cb=' + new Date().getTime();
    }
    
    Papa.parse(fetchUrl, {
      download: true, header: true, skipEmptyLines: true,
      complete: function(res) {
        try {
          var rows = Array.isArray(res.data) ? res.data : [];
          rows.forEach(function(r, idx) {
            if (!r || typeof r !== 'object') return;
            r._source_gid = sourceGid;
            r._row_idx = idx + 2;
            r._data_type = type;
            var c = getCoord(r);
            if (c) { r._lat = c.lat; r._lng = c.lng; r._kab = getKab(c.lat, c.lng); } else { r._lat = null; r._lng = null; r._kab = ''; }
            if (type === 'pegawaiBinaan') normalizeBinaanRow(r);
          });
          DATA[type] = DATA[type].concat(rows);
        } catch (err) {
          console.warn('CSV parse error:', type, err);
        }
        finish();
      },
      error: function() { finish(); }
    });
  } catch(e) {
    finish();
  }
}
function onLoaded() {
  LOADED++;
  var pct = Math.min(Math.round(LOADED / TOTAL * 100), 100);
  var loaderText = document.getElementById('loader-text');
  if (loaderText) loaderText.textContent = 'Memuat GeoHutan Jabar... ' + pct + '%';
  if (LOADED >= TOTAL) {
    fillDropdown(); schedRender();
    applyCurrentUserRoleDefaults(getCurrentAuthUser());
    hydrateDplForVisibleRows();
    updateMapDplReadout();
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
  var S = { cdk: new Set(), unit: new Set(), kab: new Set(), status: new Set(), kawasan: new Set(), jabatan: new Set(), nama_pegawai: new Set(), penyuluh: new Set(), kategori_lojuna: new Set(), binaan_kegiatan: new Set(), binaan_jabatan: new Set(), binaan_pembina: new Set() };
  ['pjl','persemaian','pegawai','jumat', 'pegawaiBinaan'].forEach(t => {
    DATA[t].forEach(r => {
      if(!r) return;
      var c = getCDKExtended(r['Unit Kerja'] || r['UNIT KERJA']); if(c) S.cdk.add(c);
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
      if(t==='pegawaiBinaan') {
        normalizeBinaanRow(r);
        var kegBinaan = getBinaanField(r, 'kegiatan');
        var jabBinaan = getBinaanField(r, 'jabatan');
        var pembinaBinaan = getBinaanField(r, 'pembina');
        if(kegBinaan) S.binaan_kegiatan.add(String(kegBinaan).trim());
        if(jabBinaan) S.binaan_jabatan.add(String(jabBinaan).trim());
        if(pembinaBinaan) S.binaan_pembina.add(String(pembinaBinaan).trim());
      }
    });
  });
  S.kategori_lojuna.add('Lokasi Juna Unggulan');
  S.kategori_lojuna.add('Lokasi Juna Biasa');
  S.kategori_lojuna.add('Lokasi Juna Permanen');
  S.cdk.add('PPPH');
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
  pop('f_binaan_kegiatan', S.binaan_kegiatan, 'Semua Kegiatan'); pop('f_binaan_jabatan', S.binaan_jabatan, 'Semua Jabatan'); pop('f_binaan_pembina', S.binaan_pembina, 'Semua Pembina');
}

var GLOBAL_POLY_COORDS = {};
/* Render Engine */
function schedRender() { clearTimeout(RTIMER); RTIMER = setTimeout(doRender, 100); }
function doRender() {
  var cnt = { pjl: 0, per: 0, peg: 0, jum: 0, pegb: 0 };
  
  if (HEATMAP_LAYER) { mapObj.removeLayer(HEATMAP_LAYER); HEATMAP_LAYER = null; }
  var heatData = [];
  var pegJumPoints = [];
  var pegNames = [];
  var jumNames = [];
  GLOBAL_POLY_COORDS = {};
  var isFilterActive = Object.values(FILTER).some(arr => arr.length > 0);

  ['pjl', 'per', 'peg', 'jum', 'pegawaiBinaan'].forEach(type => {
    var layerKey = (type === 'pegawaiBinaan') ? 'pegb' : type;
    if(LAYERS[layerKey]) mapObj.removeLayer(LAYERS[layerKey]);
    if(CLUSTER_ENABLED && typeof L.markerClusterGroup !== 'undefined') {
      LAYERS[layerKey] = L.markerClusterGroup({ disableClusteringAtZoom: 16, maxClusterRadius: 50 });
    } else {
      LAYERS[layerKey] = L.layerGroup();
    }
  });
  
  if (PJL_POLYGON_LAYER) { mapObj.removeLayer(PJL_POLYGON_LAYER); PJL_POLYGON_LAYER = null; }
  PJL_POLYGON_LAYER = L.layerGroup();

  function getShapeSvg(shape, fillCol, touchSized) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" style="overflow:visible;">';
    var stroke = 'stroke="transparent" stroke-width="15"'; // to increase click area in DOM? No, for DOM we can just use CSS padding.
    // For SVG, we just draw the shape.
    if (shape === 'square') {
        svg += '<rect x="1" y="1" width="8" height="8" fill="' + fillCol + '" />';
    } else if (shape === 'diamond') {
        svg += '<polygon points="5,1 9,5 5,9 1,5" fill="' + fillCol + '" />';
    } else if (shape === 'pentagon') {
        svg += '<polygon points="5,1 9,3.5 7.5,9 2.5,9 1,3.5" fill="' + fillCol + '" />';
    } else if (shape === 'star') {
        svg += '<polygon points="5,0 6.5,3.5 10,3.5 7,5.5 8,9 5,7 2,9 3,5.5 0,3.5 3.5,3.5" fill="' + fillCol + '" />';
    } else if (shape === 'triangle') {
        svg += '<polygon points="5,1 9,8 1,8" fill="' + fillCol + '" />';
    } else { // circle
        svg += '<circle cx="5" cy="5" r="4" fill="' + fillCol + '" />';
    }
    svg += '</svg>';
    if (touchSized) {
      svg = '<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;touch-action:manipulation;">' + svg + '</div>';
      return L.divIcon({ html: svg, className: 'leaflet-marker-lightweight marker-touch-hitbox', iconSize: [34, 34], iconAnchor: [17, 17] });
    }
    return L.divIcon({ html: svg, className: 'leaflet-marker-lightweight', iconSize: [10, 10], iconAnchor: [5, 5] });
}
  function addMarkers(arr, type, defaultIcon) {
    if (!LAYER_VISIBLE[type]) return;
    arr.forEach(function(r) {
      if (type === 'pegb') normalizeBinaanRow(r);
      if (!r || !passFilter(r, type) || !r._lat || !r._lng) return;
      cnt[type]++;
      if (HEATMAP_ENABLED) heatData.push([r._lat, r._lng, 1]);
              try {
          var name = getName(r);
          var fillCol = '#ffffff', shapeType = 'circle';
          if (type === 'pjl') { fillCol = '#43a047'; shapeType = 'circle'; } // Match legend PJL
          else if (type === 'per') { fillCol = '#82b1ff'; shapeType = 'pentagon'; }
          else if (type === 'peg') { fillCol = '#ff9800'; shapeType = 'square'; }
          else if (type === 'pegb') { fillCol = '#00bfa5'; shapeType = 'diamond'; } // Match legend PEGB
          else if (type === 'jum') {
            var kat = String(r['Kategori Lojuna'] || '').trim();
            if (kat === 'Lokasi Juna Biasa') { fillCol = '#82b1ff'; shapeType = 'triangle'; }
            else { fillCol = '#d500f9'; shapeType = 'star'; }
          }
          var mk;
          var markerUser = (typeof getCurrentAuthUser === 'function') ? getCurrentAuthUser() : null;
          var useStaffTouchMarker = !CLUSTER_ENABLED && markerUser && getRoleGroup(markerUser.role) >= 4 && (type === 'peg' || type === 'pegb');
          if (useStaffTouchMarker) {
            mk = L.marker([r._lat, r._lng], {
              icon: getShapeSvg(shapeType, fillCol, true),
              bubblingMouseEvents: false,
              keyboard: false
            });
          } else if (!CLUSTER_ENABLED) {
            mk = L.shapeMarker([r._lat, r._lng], {
              shape: shapeType,
              radius: 4.0,
              fillColor: fillCol,
              stroke: true, // Enable stroke to increase click area
              color: 'transparent',
              weight: 15, // Large invisible stroke for touch target
              opacity: 0, // Keep stroke invisible
              fillOpacity: 1
            });
          } else {
            var icon = getShapeSvg(shapeType, fillCol);
            mk = L.marker([r._lat, r._lng], { icon: icon });
          }
          
          var markerOpenHandler = (function(capturedR, capturedType) {
            var lastOpenAt = 0;
            return function(evt) {
              var now = Date.now();
              if (now - lastOpenAt < 250) return;
              lastOpenAt = now;
              if (evt && evt.originalEvent) L.DomEvent.stopPropagation(evt.originalEvent);
            mapObj.setView([capturedR._lat, capturedR._lng], 16);
            highlightMarker(capturedR._lat, capturedR._lng, capturedType);
            openDrawer(capturedType, capturedR);
            };
          })(r, type);
          mk.on('click', markerOpenHandler);
          mk.on('tap', markerOpenHandler);
        if (name && name !== 'Data tidak tersedia') {
          var hoverHTML = name;
          if (type === 'jum') {
            // Build rich thumbnail tooltip for JUM markers
            var thumbYear = getCurrentPhotoYear(r, 'juna');
            var thumbMerged = getMergedData(r, thumbYear, 'juna');
            var thumbUrl = thumbMerged.photos.length > 0 ? thumbMerged.photos[thumbMerged.photos.length - 1] : null;
            var desa = r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || r['DESA'] || '-';
            var kat2 = String(r['Kategori Lojuna'] || '').trim() || 'Lokasi Juna';
            var cdk = r['Unit Kerja'] || r._cdk || '-';
            var ket = r['Keterangan'] || '-';

            var infoHtml = '<div style="font-size:9px; color:#555; margin-top:6px; text-align:left; line-height:1.3; border-top:1px solid #eee; padding-top:4px;">' +
                           '<b>CDK:</b> ' + cdk + '<br>' +
                           '<b>Desa:</b> ' + desa + '<br>' +
                           '<div style="white-space:normal;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;"><b>Ket:</b> ' + ket + '</div>' +
                           buildDplTooltipRowsHtml(r, r._lat, r._lng) +
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
            var pjlThumb = pjlMerged.photos.length > 0 ? pjlMerged.photos[pjlMerged.photos.length - 1] : null;
            var pjlCdk = r['Unit Kerja'] || '-';
            var pjlAlamat = r['Alamat'] || '-';
            var cPen = coordText(toFloat(r['Titik Koordinat Penanaman (Y)']), toFloat(r['Titik Koordinat Penanaman (X)']));
            var cPer = coordText(toFloat(r['Titik Koordinat Persemaian (Y)']), toFloat(r['Titik Koordinat Persemaian (X)']));
            var pjlInfo = '<div class="pjl-tooltip-info">' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">CDK</span><span class="marker-tip-val">' + pjlCdk + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Alamat</span><span class="marker-tip-val">' + pjlAlamat + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Koord. Penanaman</span><span class="marker-tip-val">' + cPen + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Koord. Persemaian</span><span class="marker-tip-val">' + cPer + '</span></div>' +
              buildDplTooltipRowsHtml(r, r._lat, r._lng) +
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
              appendDplRows([
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
              ], r, r._lat, r._lng),
              '#1e88e5'
            );
          } else if (type === 'peg') {
            var pegYear = getCurrentPhotoYear(r, 'pegawai');
            var pegMerged = getMergedData(r, pegYear, 'pegawai');
            var pegThumb = pegMerged.photos.length > 0 ? pegMerged.photos[pegMerged.photos.length - 1] : null;
            var pegUnit = r['Unit Kerja'] || r['UNIT KERJA'] || '-';
            var pegJabatan = r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN'] || '-';
            var pegAlamat = r['Alamat'] || r['ALAMAT'] || '-';
            var pegInfo = '<div class="pjl-tooltip-info">' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Unit</span><span class="marker-tip-val">' + pegUnit + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Jabatan</span><span class="marker-tip-val">' + pegJabatan + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Alamat</span><span class="marker-tip-val">' + String(pegAlamat).substring(0,50) + (pegAlamat.length>50?'...':'') + '</span></div>' +
              buildDplTooltipRowsHtml(r, r._lat, r._lng) +
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
          } else if (type === 'pegb') {
            normalizeBinaanRow(r);
            var pegbYear = getCurrentPhotoYear(r, 'pegawaiBinaan');
            var pegbMerged = getMergedData(r, pegbYear, 'pegawaiBinaan');
            var pegbThumb = pegbMerged.photos.length > 0 ? pegbMerged.photos[pegbMerged.photos.length - 1] : null;
            var pegbUnit = getBinaanField(r, 'unit') || '-';
            var pegbJabatan = getBinaanField(r, 'jabatan') || '-';
            var pegbKeg = getBinaanField(r, 'kegiatan') || '-';
            var pegbKab = getBinaanKabupaten(r) || '-';
            var pegbKec = getBinaanField(r, 'kecamatan') || '-';
            var pegbDesa = getBinaanField(r, 'desa') || '-';
            var pegbPembina = getBinaanField(r, 'pembina') || '-';
            var pegbLuas = formatLuasHa(getBinaanLuas(r)) + ' Ha';
            var pegbInfo = '<div class="pjl-tooltip-info">' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Kabupaten</span><span class="marker-tip-val">' + pegbKab + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Kecamatan</span><span class="marker-tip-val">' + pegbKec + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Desa</span><span class="marker-tip-val">' + pegbDesa + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Pembina</span><span class="marker-tip-val">' + pegbPembina + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Luasan</span><span class="marker-tip-val">' + pegbLuas + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Kegiatan</span><span class="marker-tip-val">' + pegbKeg + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Unit</span><span class="marker-tip-val">' + pegbUnit + '</span></div>' +
              '<div class="pjl-tooltip-row"><span class="marker-tip-lbl">Jabatan</span><span class="marker-tip-val">' + pegbJabatan + '</span></div>' +
              buildDplTooltipRowsHtml(r, r._lat, r._lng) +
              '</div>';
            if (pegbThumb) {
              hoverHTML = '<div class="jum-tooltip-thumb pjl-tooltip-thumb" style="border-top:2px solid #00897b;">' +
                '<img src="' + pegbThumb + '" alt="foto pegawai binaan" onerror="handleDriveImageError(this);" />' +
                '<div class="jum-tooltip-thumb-name">' + name + '</div>' +
                '<div class="jum-tooltip-thumb-year" style="color:#00897b;">&#128247; ' + (pegbMerged.dates[0] ? formatDateIndo(pegbMerged.dates[0]) : 'Foto ' + pegbYear) + '</div>' +
                pegbInfo +
                '</div>';
            } else {
              hoverHTML = '<div class="jum-tooltip-no-img">' +
                '<div style="font-weight:700;font-size:11px;margin-bottom:3px;">' + name + '</div>' +
                '<div style="font-size:10px;color:#00897b;font-weight:600;">Data hutan binaan</div>' +
                pegbInfo +
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
    if(LAYER_VISIBLE[type]) {
      LAYERS[type].addTo(mapObj);
      if (!CLUSTER_ENABLED && LAYERS[type].invoke) LAYERS[type].invoke('bringToFront');
    }
  }

  // Adding polygon layer back if toggle is active
  if (PJL_POLYGON_ENABLED && PJL_POLYGON_LAYER) {
    PJL_POLYGON_LAYER.addTo(mapObj);
  }

  addMarkers(DATA.pjl, 'pjl', ICONS.pjl);
  addMarkers(DATA.persemaian, 'per', ICONS.per);
  addMarkers(DATA.pegawai, 'peg', ICONS.peg);
  addMarkers(DATA.jumat, 'jum', null);
  addMarkers(DATA.pegawaiBinaan, 'pegb', ICONS.pegb);

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
    
    var cntPegb = 0;
    var luasPegb = 0;
    DATA.pegawaiBinaan.forEach(function(r) {
      normalizeBinaanRow(r);
      if (r && passFilter(r, 'pegawaiBinaan')) {
        cntPegb++;
        var luas = getBinaanLuas(r);
        luasPegb += luas;
      }
    });
    var elPegb = document.getElementById('cnt-pegb'); if (elPegb) elPegb.textContent = cntPegb;
    var elPegbLuas = document.getElementById('cnt-pegb-luas'); if (elPegbLuas) elPegbLuas.textContent = formatLuasHa(luasPegb);
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
  var cntPegb = document.getElementById('cnt-pegb') ? parseInt(document.getElementById('cnt-pegb').textContent) || 0 : 0;
  Chart.defaults.color = '#7f8c8d'; Chart.defaults.font.family = 'Inter';
  
  mkChart('c-layer', { type: 'bar', data: { labels: ['Petugas Jaga Leuweung','Lokasi Persemaian','Pegawai Dinas Kehutanan','Jum\'at Menanam','Pegawai Wilayah Binaan'], datasets: [{ data: [cnt.pjl, cnt.per, cnt.peg, cnt.jum, cntPegb], backgroundColor: ['#43a047','#1e88e5','#fb8c00','#8e24aa','#00897b'], borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: {display:false}, ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45 } }, y: { beginAtZero: true, grid: {color:'rgba(0,0,0,0.05)'}, ticks: { font: { size: 10 } } } } } });

  var sc = {};
  DATA.persemaian.forEach(function(r) { if (!r || !passFilter(r, 'persemaian')) return; var s = String(r['Status Persemaian'] || 'Tidak Diketahui').trim() || 'Tidak Diketahui'; sc[s] = (sc[s] || 0) + 1; });
  var sk = Object.keys(sc); if (!sk.length) { sk = ['(kosong)']; sc['(kosong)'] = 0; }
  mkChart('c-status', { type: 'doughnut', data: { labels: sk, datasets: [{ data: sk.map(k=>sc[k]), backgroundColor: CLRS.slice(0, Math.max(sk.length, 1)), borderWidth:2 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } } } } });

  var cc = {};
  DATA.pjl.forEach(function(r) { if (!r || !passFilter(r, 'pjl')) return; var c = getCDK(r['Unit Kerja']) || 'Lainnya'; cc[c] = (cc[c] || 0) + 1; });
  var ck = Object.keys(cc); if (!ck.length) { ck = ['(kosong)']; cc['(kosong)'] = 0; }
  mkChart('c-cdk', { type: 'bar', data: { labels: ck.map(formatCDKChartLabel), datasets: [{ data: ck.map(k=>cc[k]), backgroundColor: '#43a047', borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: {color:'rgba(0,0,0,0.05)'}, ticks: { font: { size: 10 } } }, y: { grid: {display:false}, ticks: { font: { size: 9 } } } } } });

  // Charts for Pegawai Binaan
  var luUnit = {}, luKab = {}, cntKeg = {}, luKeg = {};
  DATA.pegawaiBinaan.forEach(function(r) {
    normalizeBinaanRow(r);
    if (!r || !passFilter(r, 'pegawaiBinaan')) return;
    var unitBinaan = getBinaanField(r, 'unit');
    var u = getCDKExtended(unitBinaan) || unitBinaan || 'Lainnya';
    var k = getBinaanKabupaten(r) || 'Lainnya';
    var keg = getBinaanField(r, 'kegiatan') || 'Lainnya';
    var luas = getBinaanLuas(r);
    
    luUnit[u] = (luUnit[u] || 0) + luas;
    luKab[k] = (luKab[k] || 0) + luas;
    cntKeg[keg] = (cntKeg[keg] || 0) + 1;
    luKeg[keg] = (luKeg[keg] || 0) + luas;
  });
  
  var lUk = Object.keys(luUnit); if (!lUk.length) { lUk = ['(kosong)']; luUnit['(kosong)'] = 0; }
  mkChart('c-binaan-unit', { type: 'bar', data: { labels: lUk.map(formatCDKChartLabel), datasets: [{ data: lUk.map(k=>luUnit[k]), backgroundColor: '#00897b', borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c) { return c.raw.toLocaleString('id-ID', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' Ha'; } } } }, scales: { x: { beginAtZero: true, grid: {color:'rgba(0,0,0,0.05)'}, ticks: { font: { size: 10 } } }, y: { grid: {display:false}, ticks: { font: { size: 9 } } } } } });
  
  var lKk = Object.keys(luKab); if (!lKk.length) { lKk = ['(kosong)']; luKab['(kosong)'] = 0; }
  mkChart('c-binaan-kab', { type: 'bar', data: { labels: lKk.map(formatCDKChartLabel), datasets: [{ data: lKk.map(k=>luKab[k]), backgroundColor: '#26a69a', borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c) { return c.raw.toLocaleString('id-ID', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' Ha'; } } } }, scales: { x: { beginAtZero: true, grid: {color:'rgba(0,0,0,0.05)'}, ticks: { font: { size: 10 } } }, y: { grid: {display:false}, ticks: { font: { size: 9 } } } } } });

  var cKk = Object.keys(cntKeg); if (!cKk.length) { cKk = ['(kosong)']; cntKeg['(kosong)'] = 0; }
  mkChart('c-binaan-kegiatan', { type: 'doughnut', data: { labels: cKk, datasets: [{ data: cKk.map(k=>cntKeg[k]), backgroundColor: ['#00897b','#4db6ac','#80cbc4','#b2dfdb','#00695c'], borderWidth:2 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } } } } });

  var lKek = Object.keys(luKeg); if (!lKek.length) { lKek = ['(kosong)']; luKeg['(kosong)'] = 0; }
  mkChart('c-binaan-luas-kegiatan', { type: 'pie', data: { labels: lKek, datasets: [{ data: lKek.map(k=>luKeg[k]), backgroundColor: ['#1b5e20','#388e3c','#4caf50','#81c784','#c8e6c9'], borderWidth:2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } }, tooltip: { callbacks: { label: function(c) { return c.label + ': ' + c.raw.toLocaleString('id-ID', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' Ha'; } } } } } });
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
  if(type === 'all' || type === 'pegawaiBinaan') allData = allData.concat(DATA.pegawaiBinaan.map(r=>({t:'pegb',r:r})));

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
function downloadFile(rows, filename, forcedFmt) {
  var fmtEl = document.querySelector('input[name="export-fmt"]:checked');
  var fmt = forcedFmt || (fmtEl ? fmtEl.value : 'csv');
  if (fmt === 'xlsx') {
    var ws = XLSX.utils.aoa_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename.replace('.csv', '.xlsx'));
  } else {
    var csv = rows.map(function(row) {
      return (row || []).map(function(cell) {
        return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
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
  else if (type === 'pegb') { dataToExport = DATA.pegawaiBinaan; filename = 'Pegawai_Wilayah_Hutan_Binaan.csv'; lbl = 'Data hutan binaan'; }
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
    { k: 'pegb', label: 'Data hutan binaan', data: DATA.pegawaiBinaan, filterType: 'pegawaiBinaan' },
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
loadCSV('https://docs.google.com/spreadsheets/d/1xrl3W7DZs8SsYZIWiLgHYvi_89V7NismK-G9YDu9NdM/export?format=csv&gid=1475147460', 'pegawaiBinaan');
loadCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vSPtxo38ft9es4Mt0xn1oqPJQCVmYZcmyYN1GKTUBYz8b4wRX34jbQa5odSjVLwvB-yxuUnDGAV9Pou/pub?gid=2039375183&single=true&output=csv', 'jumat');

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ LEAFLET DRAW & POLYGON ANALYSIS ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */
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
  
  var inPoly = { pjl: [], per: [], peg: [], pegb: [], jum: [] };
  var allData = [].concat(
    DATA.pjl.map(r=>({t:'pjl',r:r})), DATA.persemaian.map(r=>({t:'per',r:r})),
    DATA.pegawai.map(r=>({t:'peg',r:r})), DATA.pegawaiBinaan.map(r=>({t:'pegb',r:r})),
    DATA.jumat.map(r=>({t:'jum',r:r}))
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
  var cPegb = inPoly.pegb.length;
  var cJum = inPoly.jum.length;
  
  summary.innerHTML = 
    '<div style="background:#e8f5e9; padding:8px 12px; border-radius:6px; font-weight:bold; color:#2e7d32; font-size:12px;">Petugas Jaga Leuweung: '+cPjl+'</div>' +
    '<div style="background:#e3f2fd; padding:8px 12px; border-radius:6px; font-weight:bold; color:#1565c0; font-size:12px;">Persemaian Jaga Leuweung: '+cPer+'</div>' +
    '<div style="background:#fff3e0; padding:8px 12px; border-radius:6px; font-weight:bold; color:#e65100; font-size:12px;">Pegawai Kehutanan: '+cPeg+'</div>' +
    '<div style="background:#e0f7fa; padding:8px 12px; border-radius:6px; font-weight:bold; color:#006064; font-size:12px;">Pegawai Binaan: '+cPegb+'</div>' +
    '<div style="background:#f3e5f5; padding:8px 12px; border-radius:6px; font-weight:bold; color:#6a1b9a; font-size:12px;">Jum\'at Menanam: '+cJum+'</div>';
  
  var html = '';
  var allFound = [].concat(
    inPoly.pjl.map(r=>({t:'pjl',r:r})), inPoly.per.map(r=>({t:'per',r:r})),
    inPoly.peg.map(r=>({t:'peg',r:r})), inPoly.pegb.map(r=>({t:'pegb',r:r})), 
    inPoly.jum.map(r=>({t:'jum',r:r}))
  );
  
  for(var i=0; i<allFound.length; i++) {
    var item = allFound[i]; var r = item.r;
    var name = safe(r['Nama Petugas'] || r['Nama Persemaian'] || r['Nama'] || r['Lokasi'] || '');
    var unit = safe(r['Unit Kerja'] || r['UNIT KERJA']);
    var kab = safe(r._kab);
    var jabat = '-';
    var luasStr = '-';
    
    if (item.t === 'peg') jabat = safe(r['Nama Jabatan'] || r['Jabatan'] || r['JABATAN']);
    if (item.t === 'pjl') jabat = 'Petugas Lapangan';
    if (item.t === 'pegb') {
       jabat = safe(getBinaanField(r, 'jabatan'));
       luasStr = formatLuasHa(getBinaanLuas(r));
    }
    
    html += '<tr><td>'+POP_LABEL[item.t]+'</td><td>'+name+'</td><td>'+jabat+'</td><td>'+unit+'</td><td>'+kab+'</td><td>'+luasStr+'</td></tr>';
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

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¸ PHOTO GALLERY ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ JUNA PERMANEN & PJL
   ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

var PHOTO_YEARS = ['2025','2026','2027','2028','2029','2030'];
var BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var BULAN_ID_LOOKUP = BULAN_ID.reduce(function(map, name, idx) {
  map[String(name).toLowerCase()] = idx;
  return map;
}, {});

var PHOTO_GALLERY = { context: 'juna', row: null, year: '2026', idx: 0, photos: [], dates: [], years: [], angles: [], sheetCount: 0, localCount: 0, angleFilter: 'all' };
var JUM_GALLERY = PHOTO_GALLERY;
var LB_STATE = { photos: [], dates: [], years: [], angles: [], idx: 0, year: '2026', locName: '', context: 'juna' };
var WEEKLY_REPORT_STATE = { row: null, context: 'juna', reports: [], listPage: 1, listPageSize: 5, monitorType: 'weekly', monitorRows: [], monitorPage: 1, monitorPageSize: 10, detailRows: [], currentDetailReport: null, currentPhotoMeta: null, currentGpsMeta: null, weeklyGpsPromise: null, allowCameraOpen: false, weeklyMonitorFetchedAt: 0, weeklyMonitorCacheMs: 180000, weeklyMonitorLoading: false };

function invalidateWeeklyMonitorCache() {
  WEEKLY_REPORT_STATE.weeklyMonitorFetchedAt = 0;
  WEEKLY_REPORT_STATE.monitorRows = [];
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function displayPhotoAngle(angle) {
  var normalized = normalizePhotoAngle(angle);
  return normalized === 'Sudut Foto #2' ? 'Foto Tambahan' : 'Foto Utama';
}

function getPhotoContextPrefix(context) {
  if (context === 'pjl') return 'pjl';
  if (context === 'pegawai') return 'peg';
  if (context === 'pegawaiBinaan') return 'pegb';
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

/** Format tanggal ke Bahasa Indonesia, mis. 17/06/2026 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 17 Juni 2026 */
function getWibDateParts(ts) {
  var n = Number(ts);
  if (!isFinite(n)) return null;
  var d = new Date(n + (7 * 60 * 60 * 1000));
  if (isNaN(d.getTime())) return null;
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
    year: d.getUTCFullYear(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes()
  };
}

function formatWibTimestampIndo(ts, includeTime) {
  var p = getWibDateParts(ts);
  if (!p) return '';
  var out = p.day + ' ' + BULAN_ID[p.month] + ' ' + p.year;
  if (includeTime) out += ' pukul ' + String(p.hour).padStart(2, '0') + ':' + String(p.minute).padStart(2, '0');
  return out;
}

function parseIndoDateParts(value) {
  var s = String(value || '').trim();
  var m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(?:pukul|jam)?\s*(\d{1,2})[:.](\d{2})(?::(\d{2}))?)?/i);
  if (!m) return null;
  var month = BULAN_ID_LOOKUP[String(m[2] || '').toLowerCase()];
  if (month === undefined) return null;
  return {
    day: parseInt(m[1], 10),
    month: month,
    year: parseInt(m[3], 10),
    hour: m[4] ? parseInt(m[4], 10) : 0,
    minute: m[5] ? parseInt(m[5], 10) : 0
  };
}

function formatIndoDateParts(parts, includeTime) {
  if (!parts || parts.month < 0 || parts.month >= BULAN_ID.length) return '';
  var out = parts.day + ' ' + BULAN_ID[parts.month] + ' ' + parts.year;
  if (includeTime) out += ' pukul ' + String(parts.hour || 0).padStart(2, '0') + ':' + String(parts.minute || 0).padStart(2, '0');
  return out;
}

function normalizeExportDateIndo(value) {
  return formatDateIndo(value || '');
}

function formatDateIndo(dStr) {
  if (!dStr) return '';
  var s = String(dStr).trim();
  var indoParts = parseIndoDateParts(s);
  if (indoParts) return formatIndoDateParts(indoParts, /\d{1,2}[:.]\d{2}/.test(s));
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    var day = parseInt(m[1], 10);
    var monthIdx = parseInt(m[2], 10) - 1;
    var year = m[3];
    if (monthIdx >= 0 && monthIdx < 12) {
      var out = day + ' ' + BULAN_ID[monthIdx] + ' ' + year;
      if (m[4]) out += ' pukul ' + String(m[4]).padStart(2, '0') + ':' + m[5];
      return out;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && /(Z|[+-]\d{2}:?\d{2})/.test(s)) {
    var isoTs = Date.parse(s);
    if (!isNaN(isoTs)) return formatWibTimestampIndo(isoTs, true);
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (m) {
    var day2 = parseInt(m[3], 10);
    var monthIdx2 = parseInt(m[2], 10) - 1;
    if (monthIdx2 >= 0 && monthIdx2 < 12) {
      var out2 = day2 + ' ' + BULAN_ID[monthIdx2] + ' ' + m[1];
      if (m[4]) out2 += ' pukul ' + m[4] + ':' + m[5];
      return out2;
    }
  }
  var ts = Date.parse(s);
  if (!isNaN(ts)) {
    return formatWibTimestampIndo(ts, /\d{1,2}:\d{2}/.test(s));
  }
  return s;
}

/** Parse DD/MM/YYYY [HH:mm] into timestamp for sorting */
function parseExifDate(dStr) {
  if (!dStr) return 0;
  var s = String(dStr).trim();
  var indoParts = parseIndoDateParts(s);
  if (indoParts) {
    return new Date(indoParts.year, indoParts.month, indoParts.day, indoParts.hour || 0, indoParts.minute || 0).getTime();
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && /(Z|[+-]\d{2}:?\d{2})/.test(s)) {
    var isoTs = Date.parse(s);
    return isNaN(isoTs) ? 0 : isoTs;
  }
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    var h = m[4] ? parseInt(m[4], 10) : 0;
    var min = m[5] ? parseInt(m[5], 10) : 0;
    return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), h, min).getTime();
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (m) {
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      m[4] ? parseInt(m[4], 10) : 0,
      m[5] ? parseInt(m[5], 10) : 0
    ).getTime();
  }
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

function getRowAngles(r, year) {
  var angles = parsePipeField(r['Sudut_' + year] || r['Angle_' + year]);
  return angles.map(normalizePhotoAngle);
}

function normalizePhotoAngle(angle) {
  var s = String(angle || '').trim();
  if (s === 'Sudut Foto #2' || s === '2' || /#?2\b/.test(s)) return 'Sudut Foto #2';
  return 'Sudut Foto #1';
}

function getSelectedUploadAngle() {
  var el = document.querySelector('input[name="upload-angle"]:checked');
  return normalizePhotoAngle(el ? el.value : 'Sudut Foto #1');
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
    return { section: 'pjl-photo-section', timeline: 'pjl-year-timeline', carousel: 'pjl-carousel-wrap', start: 'pjl-date-start', end: 'pjl-date-end' };
  }
  if (context === 'pegawai') {
    return { section: 'peg-photo-section', timeline: 'peg-year-timeline', carousel: 'peg-carousel-wrap', start: 'peg-date-start', end: 'peg-date-end' };
  }
  if (context === 'pegawaiBinaan') {
    return { section: 'pegb-photo-section', timeline: 'pegb-year-timeline', carousel: 'pegb-carousel-wrap', start: 'pegb-date-start', end: 'pegb-date-end' };
  }
  if (context === 'polygon') {
    return { section: 'poly-photo-section', timeline: 'poly-year-timeline', carousel: 'poly-carousel-wrap', start: 'poly-date-start', end: 'poly-date-end' };
  }
  if (context === 'per') {
    return { section: 'per-photo-section', timeline: 'per-year-timeline', carousel: 'per-carousel-wrap', start: 'per-date-start', end: 'per-date-end' };
  }
  return { section: 'jum-photo-section', timeline: 'jum-year-timeline', carousel: 'jum-carousel-wrap', start: 'jum-date-start', end: 'jum-date-end' };
}

function buildPhotoSection(r, context) {
  context = context || 'juna';
  var ids = getGalleryDomIds(context);
  var title = 'Dokumentasi Foto Lokasi';
  var accent = '#8e24aa';
  if (context === 'pjl') { title = 'Dokumentasi Tanam & Pelihara Pohon '; accent = '#2e7d32'; }
  else if (context === 'pegawai') { title = 'Dokumentasi Foto Pegawai'; accent = '#fb8c00'; }
  else if (context === 'pegawaiBinaan') { title = 'Foto Hutan Binaan'; accent = '#00897b'; }
  else if (context === 'polygon') { title = 'Dokumentasi Kegiatan (Tanam & Pelihara)'; accent = '#388e3c'; }
  else if (context === 'per') { title = 'Dokumentasi Lokasi Persemaian'; accent = '#1e88e5'; }

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

  html += '<div class="photo-date-range">' +
    '<div class="photo-date-range-title">Rentang Waktu</div>' +
    '<input type="date" id="' + ids.start + '" onchange="refreshGalleryForYear(PHOTO_GALLERY.year)">' +
    '<span>s/d</span>' +
    '<input type="date" id="' + ids.end + '" onchange="refreshGalleryForYear(PHOTO_GALLERY.year)">' +
    '<button type="button" onclick="clearGalleryDateRange(\'' + context + '\')">Reset</button>' +
    '</div>';

  html += '<div class="photo-angle-filter">' +
    '<button type="button" class="active" data-angle="all" onclick="setGalleryAngleFilter(\'all\')">Semua</button>' +
    '<button type="button" data-angle="Sudut Foto #1" onclick="setGalleryAngleFilter(\'Sudut Foto #1\')">Foto Utama</button>' +
    '<button type="button" data-angle="Sudut Foto #2" onclick="setGalleryAngleFilter(\'Sudut Foto #2\')">Foto Tambahan</button>' +
    '</div>';

  html += '<div id="' + ids.carousel + '" class="jum-carousel-wrap">' +
    '<div class="jum-no-photo">' +
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
    '<span>Memuat foto...</span></div></div>';

  var deleteBtnHtml = '';
  var canUpload = canUploadPhotoForContext(context, r);

  if (context === 'polygon' && canUpload) {
    var featId = r['ID'] || r.featureId || '';
    deleteBtnHtml = '<button class="jum-upload-btn" style="background:#e53935; color:#fff; border-color:#c62828; margin-right:auto;" onclick="deletePolygonKegiatan(\'' + featId + '\')">' +
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>' +
      ' Hapus Kegiatan</button>';
  }

  html += '<div style="margin-top:10px; display:flex; justify-content:flex-end;">';
  html += deleteBtnHtml;
  if (canUpload) {
    html += '<button class="jum-upload-btn" onclick="openUploadModal(PHOTO_GALLERY.row)">' +
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
      ' Upload Foto Baru</button>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

function buildJumPhotoSection(r) { return buildPhotoSection(r, 'juna'); }

function buildReportHubSection(r, context) {
  context = context || 'juna';
  var safeContext = String(context).replace(/[^a-zA-Z0-9]/g, '');
  return '<div class="drawer-report-hub" id="report-hub-' + safeContext + '">' +
    '<div class="report-category-title">Kategori Laporan</div>' +
    '<div class="report-category-buttons">' +
      '<button type="button" onclick="showMarkerReportPanel(\'monthly\', \'' + context + '\')">Laporan 3 Bulanan</button>' +
      '<button type="button" onclick="showMarkerReportPanel(\'weekly\', \'' + context + '\')">Laporan Mingguan</button>' +
    '</div>' +
    '<div class="report-panel monthly-panel" id="report-monthly-panel-' + safeContext + '" style="display:none;">' +
      buildPhotoSection(r, context) +
    '</div>' +
    '<div class="report-panel weekly-panel" id="report-weekly-panel-' + safeContext + '" style="display:none;">' +
      buildWeeklyReportSection(context) +
    '</div>' +
  '</div>';
}

function buildWeeklyReportSection(context) {
  return '<div class="weekly-drawer-section">' +
    '<div class="weekly-drawer-title">Laporan Mingguan Hutan Binaan</div>' +
    '<div class="weekly-drawer-actions">' +
      '<button type="button" class="jum-upload-btn" onclick="openWeeklyReportModal()">Isi Laporan Mingguan</button>' +
      '<button type="button" class="jum-upload-btn secondary" onclick="loadWeeklyReportsForMarker(true)">Lihat Laporan</button>' +
    '</div>' +
    '<div id="weekly-report-list" class="weekly-report-list">' +
      '<div class="weekly-empty">Pilih Detail Laporan untuk melihat riwayat laporan mingguan titik ini.</div>' +
    '</div>' +
  '</div>';
}

function showMarkerReportPanel(panel, context) {
  context = context || PHOTO_GALLERY.context || 'juna';
  var safeContext = String(context).replace(/[^a-zA-Z0-9]/g, '');
  var monthly = document.getElementById('report-monthly-panel-' + safeContext);
  var weekly = document.getElementById('report-weekly-panel-' + safeContext);
  var hub = document.getElementById('report-hub-' + safeContext);
  if (monthly) monthly.style.display = panel === 'monthly' ? 'block' : 'none';
  if (weekly) weekly.style.display = panel === 'weekly' ? 'block' : 'none';
  if (hub) {
    hub.querySelectorAll('.report-category-buttons button').forEach(function(btn) {
      btn.classList.toggle('active', btn.textContent.toLowerCase().indexOf(panel === 'monthly' ? 'bulanan' : 'mingguan') !== -1);
    });
  }
  if (panel === 'monthly') refreshGalleryForYear(PHOTO_GALLERY.year || getCurrentPhotoYear(PHOTO_GALLERY.row, context));
  if (panel === 'weekly') loadWeeklyReportsForMarker(false);
}

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
    applyGalleryData(getMergedDataAcrossYears(r, context));
  }

  function processExtractedFolder(files) {
    var sheetPhotos = files.map(function(f) { return normalizeImageUrl(f.url); });
    var combined = [];
    files.forEach(function(f) {
      combined.push({ url: normalizeImageUrl(f.url), date: f.date, year: year, angle: 'Sudut Foto #1', timestamp: parseExifDate(f.date), isLocal: false });
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
        combined.push({ url: lNorm, date: l.date, year: year, angle: normalizePhotoAngle(l.angle || 'Sudut Foto #1'), timestamp: parseExifDate(l.date), isLocal: true });
      }
    });
    
    combined.sort(function(a, b) { return a.timestamp - b.timestamp; });
    
    var allP = [], allD = [], allY = [], allA = [], isLocMap = [];
    combined.forEach(function(c) {
      allP.push(c.url); allD.push(c.date); allY.push(year); allA.push(normalizePhotoAngle(c.angle)); isLocMap.push(c.isLocal);
    });
    
    applyGalleryData({
      photos: allP, dates: allD, years: allY, angles: allA,
      sheetCount: files.length, localCount: locals.length,
      isLocalMap: isLocMap
    });
  }

  function applyGalleryData(_merged) {
    _merged = filterGalleryByDateRange(_merged, context);
    if (PHOTO_GALLERY.angleFilter && PHOTO_GALLERY.angleFilter !== 'all') {
      var filtered = { photos: [], dates: [], years: [], angles: [], sheetCount: _merged.sheetCount, localCount: _merged.localCount, isLocalMap: [] };
      (_merged.photos || []).forEach(function(photo, idx) {
        var angle = normalizePhotoAngle((_merged.angles || [])[idx]);
        if (angle !== PHOTO_GALLERY.angleFilter) return;
        filtered.photos.push(photo);
        filtered.dates.push((_merged.dates || [])[idx] || '');
        filtered.years.push((_merged.years || [])[idx] || year);
        filtered.angles.push(angle);
        filtered.isLocalMap.push(_merged.isLocalMap ? _merged.isLocalMap[idx] : false);
      });
      _merged = filtered;
    }
    PHOTO_GALLERY.photos = _merged.photos;
    PHOTO_GALLERY.dates = _merged.dates;
    PHOTO_GALLERY.years = _merged.years || (_merged.photos || []).map(function() { return year; });
    PHOTO_GALLERY.angles = (_merged.angles || []).map(normalizePhotoAngle);
    PHOTO_GALLERY.sheetCount = _merged.sheetCount;
    PHOTO_GALLERY.localCount = _merged.localCount;
    PHOTO_GALLERY.isLocalMap = _merged.isLocalMap;
    var startIdx = 0;
    for (var si = 0; si < PHOTO_GALLERY.years.length; si++) {
      if (String(PHOTO_GALLERY.years[si]) === String(year)) { startIdx = si; break; }
    }
    PHOTO_GALLERY.idx = startIdx;

    if (_merged.photos.length === 0) {
      wrap.innerHTML = '<div class="jum-no-photo">' +
        '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
        '<span>Belum ada foto pada filter yang dipilih</span>' +
        '<span style="font-size:10px;opacity:0.6;">Tambahkan foto di Laporan 3 Bulanan atau ubah filter sudut/rentang waktu.</span>' +
        '</div>';
      return;
    }
    renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
  }
}

function parseDateInputToTs(value, endOfDay) {
  if (!value) return 0;
  var m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  return new Date(
    parseInt(m[1], 10),
    parseInt(m[2], 10) - 1,
    parseInt(m[3], 10),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0
  ).getTime();
}

function filterGalleryByDateRange(merged, context) {
  var ids = getGalleryDomIds(context || PHOTO_GALLERY.context || 'juna');
  var startEl = document.getElementById(ids.start);
  var endEl = document.getElementById(ids.end);
  var startTs = startEl ? parseDateInputToTs(startEl.value, false) : 0;
  var endTs = endEl ? parseDateInputToTs(endEl.value, true) : 0;
  if (!startTs && !endTs) return merged;
  var out = { photos: [], dates: [], years: [], angles: [], sheetCount: merged.sheetCount, localCount: merged.localCount, isLocalMap: [] };
  (merged.photos || []).forEach(function(photo, idx) {
    var ts = parseExifDate((merged.dates || [])[idx]);
    if (!ts) return;
    if (startTs && ts < startTs) return;
    if (endTs && ts > endTs) return;
    out.photos.push(photo);
    out.dates.push((merged.dates || [])[idx] || '');
    out.years.push((merged.years || [])[idx] || PHOTO_GALLERY.year || '');
    out.angles.push(normalizePhotoAngle((merged.angles || [])[idx]));
    out.isLocalMap.push(merged.isLocalMap ? merged.isLocalMap[idx] : false);
  });
  return out;
}

function clearGalleryDateRange(context) {
  var ids = getGalleryDomIds(context || PHOTO_GALLERY.context || 'juna');
  var startEl = document.getElementById(ids.start);
  var endEl = document.getElementById(ids.end);
  if (startEl) startEl.value = '';
  if (endEl) endEl.value = '';
  refreshGalleryForYear(PHOTO_GALLERY.year);
}

function setGalleryAngleFilter(angle) {
  PHOTO_GALLERY.angleFilter = angle || 'all';
  document.querySelectorAll('.photo-angle-filter button, .lightbox-angle-filter button').forEach(function(btn) {
    btn.classList.toggle('active', String(btn.getAttribute('data-angle')) === String(PHOTO_GALLERY.angleFilter));
  });
  refreshGalleryForYear(PHOTO_GALLERY.year);
  if (document.getElementById('photo-lightbox') && document.getElementById('photo-lightbox').classList.contains('open')) {
    openPhotoLightbox();
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
  var photoYear = (PHOTO_GALLERY.years || [])[idx] || PHOTO_GALLERY.year;
  var photoAngle = normalizePhotoAngle((PHOTO_GALLERY.angles || [])[idx]);
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

  var localBadge = isLocalPhoto ? '<span class="local-photo-badge" title="Foto berhasil diupload dan sedang disinkronisasi ke server global.">&#128247; Baru Upload</span>' : '';
  var deleteBtn = canUploadPhotoForContext(context, PHOTO_GALLERY.row)
    ? '<button class="car-delete-btn" onclick="event.stopPropagation();deleteCurrentCarouselPhoto()" title="Hapus foto ini">&#128465;</button>'
    : '';

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
        '<span class="photo-angle-badge">' + displayPhotoAngle(photoAngle) + '</span>' +
        '<span class="photo-year-badge">' + photoYear + '</span>' +
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
  PHOTO_GALLERY.year = (PHOTO_GALLERY.years || [])[PHOTO_GALLERY.idx] || PHOTO_GALLERY.year;
  renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
  if (document.getElementById('photo-lightbox').classList.contains('open')) {
    LB_STATE.idx = PHOTO_GALLERY.idx;
    refreshLightbox();
  }
}

function jumpCarousel(i) {
  PHOTO_GALLERY.idx = i;
  PHOTO_GALLERY.year = (PHOTO_GALLERY.years || [])[PHOTO_GALLERY.idx] || PHOTO_GALLERY.year;
  renderCarousel(PHOTO_GALLERY.photos, PHOTO_GALLERY.dates);
}

/** Change gallery year from timeline pill click */
function changeGalleryYear(year) {
  refreshGalleryForYear(year);
}

/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ FULLSCREEN LIGHTBOX ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */

/** Open fullscreen lightbox with current gallery state */
function openPhotoLightbox() {
  var photos = PHOTO_GALLERY.photos;
  if (!photos || photos.length === 0) return;
  LB_STATE.photos = photos;
  LB_STATE.dates = PHOTO_GALLERY.dates;
  LB_STATE.years = PHOTO_GALLERY.years || [];
  LB_STATE.angles = PHOTO_GALLERY.angles || [];
  LB_STATE.idx = PHOTO_GALLERY.idx;
  LB_STATE.year = (LB_STATE.years || [])[LB_STATE.idx] || PHOTO_GALLERY.year;
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
  LB_STATE.year = (LB_STATE.years || [])[LB_STATE.idx] || LB_STATE.year;
  PHOTO_GALLERY.year = LB_STATE.year;
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
  var currentYear = (LB_STATE.years || [])[idx] || LB_STATE.year;
  var rawAngle = (LB_STATE.angles || [])[idx] || '';
  var currentAngle = rawAngle === 'Laporan Mingguan' ? rawAngle : normalizePhotoAngle(rawAngle);

  // Header
  var yBadge = document.getElementById('lightbox-year-badge');
  var counter = document.getElementById('lightbox-counter');
  var stamp = document.getElementById('lightbox-timestamp');
  var locInfo = document.getElementById('lightbox-loc-info');
  var angleFilter = document.getElementById('lightbox-angle-filter');
  if (angleFilter) {
    angleFilter.style.display = (LB_STATE.context === 'weekly' || LB_STATE.context === 'single') ? 'none' : '';
    angleFilter.querySelectorAll('button').forEach(function(btn) {
      btn.classList.toggle('active', String(btn.getAttribute('data-angle') || 'all') === String(PHOTO_GALLERY.angleFilter || 'all'));
    });
  }
  if (yBadge) yBadge.textContent = LB_STATE.context === 'weekly' ? 'Laporan Mingguan' : (LB_STATE.context === 'single' ? 'Preview Foto' : ('Foto ' + currentYear + ' - ' + displayPhotoAngle(currentAngle)));
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

  // Monitoring Field Data
  var monWrap = document.getElementById('lightbox-monitoring');
  var monCont = document.getElementById('lightbox-monitoring-content');
  if (monWrap && monCont) {
    if (LB_STATE.context === 'weekly' || LB_STATE.context === 'single') {
      monWrap.style.display = 'none';
      return;
    }
    var r = PHOTO_GALLERY.row;
    var y = LB_STATE.year;
    
    var getMonVal = function(key) {
      var str = String(r[key + '_' + y] || '').trim();
      if (!str) return '';
      var arr = str.split('|').map(function(s){return s.trim();});
      var val = arr[idx] !== undefined ? arr[idx] : (arr[0] || '');
      return val === '-' ? '' : val;
    };
    
    var monData = {
      'Keragaman Jenis Tanaman': getMonVal('Tutupan'),
      'Jenis Tanaman/Pohon': getMonVal('Jenis'),
      'Kerapatan Tanaman': getMonVal('Kerapatan'),
      'Kelas Lereng': getMonVal('Lereng'),
      'Tinggi Tanaman (Cm)': getMonVal('Umur'),
      'Kondisi Hutan': getMonVal('Pengelolaan'),
      'Sumber Air': getMonVal('Ekosistem'),
      'Usulan Kegiatan Lanjutan': getMonVal('Usulan')
    };
    
    var hasAny = false;
    for (var k in monData) {
      if (monData[k] && String(monData[k]).trim() !== '') hasAny = true;
    }
    
    if (hasAny) {
      var mHtml = '';
      for (var k in monData) {
        if (monData[k] && String(monData[k]).trim() !== '') {
          mHtml += '<div style="text-align:center;"><div style="opacity:0.7; font-size:10px;">' + k + '</div><div style="font-weight:bold;">' + monData[k] + '</div></div>';
        }
      }
      monCont.innerHTML = mHtml;
      monWrap.style.display = 'block';
    } else {
      monWrap.style.display = 'none';
    }
  }
}

/** Jump lightbox to index */
function lightboxJump(i) {
  LB_STATE.idx = i;
  PHOTO_GALLERY.idx = i;
  LB_STATE.year = (LB_STATE.years || [])[i] || LB_STATE.year;
  PHOTO_GALLERY.year = LB_STATE.year;
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

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¸ LOCAL PHOTO UPLOAD & MANAGEMENT
   ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

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
  var sheetAngles = getRowAngles(r, year);
  var locals = getLocalPhotos(r, year, context);
  
  var combined = [];
  var deletedIds = getDeletedPhotoIds(r, year, context);
  
  for(var i=0; i<sheetPhotos.length; i++) {
    var url = sheetPhotos[i];
    var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    var sid = m ? m[1] : url;
    
    if (deletedIds.indexOf(sid) === -1) {
      var d = sheetDates[i] || '';
      combined.push({ url: url, date: d, year: year, angle: normalizePhotoAngle(sheetAngles[i] || 'Sudut Foto #1'), timestamp: parseExifDate(d), isLocal: false });
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
      combined.push({ url: lNorm, date: l.date, year: year, angle: normalizePhotoAngle(l.angle || 'Sudut Foto #1'), timestamp: parseExifDate(l.date), isLocal: true });
    }
  });
  
  combined.sort(function(a, b) {
    return a.timestamp - b.timestamp;
  });
  
  var allPhotos = [], allDates = [], allYears = [], allAngles = [], isLocalMap = [];
  var localCount = 0;
  
  combined.forEach(function(c) {
    allPhotos.push(c.url);
    allDates.push(c.date);
    allYears.push(c.year || year);
    allAngles.push(normalizePhotoAngle(c.angle));
    isLocalMap.push(c.isLocal);
    if(c.isLocal) localCount++;
  });
  
  return {
    photos: allPhotos,
    dates: allDates,
    years: allYears,
    angles: allAngles,
    sheetCount: sheetPhotos.length,
    localCount: localCount,
    isLocalMap: isLocalMap
  };
}

function getMergedDataAcrossYears(r, context) {
  var out = { photos: [], dates: [], years: [], angles: [], sheetCount: 0, localCount: 0, isLocalMap: [] };
  PHOTO_YEARS.forEach(function(yr) {
    var m = getMergedData(r, yr, context);
    out.photos = out.photos.concat(m.photos || []);
    out.dates = out.dates.concat(m.dates || []);
    out.years = out.years.concat(m.years || (m.photos || []).map(function() { return yr; }));
    out.angles = out.angles.concat(m.angles || (m.photos || []).map(function() { return 'Sudut Foto #1'; }));
    out.isLocalMap = out.isLocalMap.concat(m.isLocalMap || []);
    out.sheetCount += m.sheetCount || 0;
    out.localCount += m.localCount || 0;
  });
  var packed = out.photos.map(function(url, idx) {
    return {
      url: url,
      date: out.dates[idx] || '',
      year: out.years[idx] || '',
      angle: normalizePhotoAngle(out.angles[idx]),
      isLocal: !!out.isLocalMap[idx],
      timestamp: parseExifDate(out.dates[idx]) || Date.parse((out.years[idx] || '1970') + '-01-01') || 0
    };
  });
  packed.sort(function(a, b) {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return String(a.year).localeCompare(String(b.year));
  });
  out.photos = packed.map(function(x) { return x.url; });
  out.dates = packed.map(function(x) { return x.date; });
  out.years = packed.map(function(x) { return x.year; });
  out.angles = packed.map(function(x) { return x.angle; });
  out.isLocalMap = packed.map(function(x) { return x.isLocal; });
  return out;
}

/** Delete the currently viewed photo from all sources */
function deleteCurrentCarouselPhoto() {
  if (!confirm('Apakah Anda yakin ingin menghapus foto ini secara permanen dari Dashboard, Google Drive, dan Spreadsheet?')) return;
  var r = PHOTO_GALLERY.row;
  var year = (PHOTO_GALLERY.years || [])[PHOTO_GALLERY.idx] || PHOTO_GALLERY.year;
  var context = PHOTO_GALLERY.context || 'juna';
  var idx = PHOTO_GALLERY.idx;
  var targetUrl = PHOTO_GALLERY.photos[idx];
  
  var targetMatch = targetUrl.match(/id=([a-zA-Z0-9_-]+)/) || targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  var targetId = targetMatch ? targetMatch[1] : targetUrl;
  
  showToast('Menghapus foto...', 'info');
  var btn = document.querySelector('.car-delete-btn');
  if(btn) btn.style.opacity = '0.5';

  var coords = getPhotoCoords(r);
  var catStr = 'juna';
  if (context === 'pjl') catStr = 'pjl';
  else if (context === 'pegawai') catStr = 'pegawai';
  else if (context === 'pegawaiBinaan') catStr = 'pegawaibinaanformatsistem';
  else if (context === 'per') catStr = 'persemaian';
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
      var locals = getLocalPhotos(r, year, context);
      var filteredLocals = locals.filter(function(l) {
        var m1 = l.url.match(/id=([a-zA-Z0-9_-]+)/) || l.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        var id1 = m1 ? m1[1] : l.url;
        return id1 !== targetId;
      });
      saveLocalPhotosToStorage(r, year, filteredLocals, context);
      addDeletedPhotoId(r, year, targetId, context);
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
  if (!canUploadPhotoForContext(context, r)) {
    showToast('Akun ini tidak memiliki izin upload pada data tersebut.', 'error');
    return;
  }
  if (locInfo) {
    if (context === 'pjl') {
      locInfo.innerHTML = '&#128205; ' + getName(r) + ' &bull; ' + (r['Unit Kerja'] || '');
    } else if (context === 'pegawai') {
      locInfo.innerHTML = '&#128205; ' + getName(r) + ' &bull; ' + (r['Unit Kerja'] || r['UNIT KERJA'] || '');
    } else if (context === 'pegawaiBinaan') {
      locInfo.innerHTML = '&#128205; ' + getName(r) + ' &bull; ' + (r['Unit Kerja'] || r['UNIT KERJA'] || '') + ' - ' + (r['Kegiatan'] || '');
    } else if (context === 'polygon') {
      locInfo.innerHTML = '&#128205; ' + (r['Nama'] || 'Area Kegiatan') + ' &bull; ' + (r['Kegiatan'] || '');
    } else if (context === 'per') {
      locInfo.innerHTML = '&#128205; ' + (r['Nama Persemaian'] || r['Nama'] || 'Persemaian') + ' &bull; ' + (r['Unit Kerja'] || r._cdk || '');
    } else {
      locInfo.innerHTML = '&#128205; ' + getName(r) + ' &bull; ' + (r['Kabupaten/Kota'] || '');
    }
  }
  
  var modalTitle = document.querySelector('#upload-modal .modal-head h2');
  if (modalTitle) {
    if (context === 'pjl') modalTitle.textContent = 'Upload Dokumentasi Tanam & Pelihara ';
    else if (context === 'pegawai') modalTitle.textContent = 'Upload Foto Pegawai Dinas Kehutanan';
    else if (context === 'pegawaiBinaan') modalTitle.textContent = 'Upload Foto Pegawai Wilayah Binaan';
    else if (context === 'polygon') modalTitle.textContent = 'Upload Dokumentasi Kegiatan';
    else if (context === 'per') modalTitle.textContent = 'Upload Dokumentasi Persemaian';
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
  var angle1 = document.querySelector('input[name="upload-angle"][value="Sudut Foto #1"]');
  if (angle1) angle1.checked = true;
  renderUploadLastPhotoPreview();
  
  var monDiv = document.getElementById('upload-monitoring-fields');
  if (monDiv) {
    monDiv.style.display = 'block';
    resetMonitoringInputs();
  }

  m.classList.add('open');
}

function getLatestTimelinePhotoForAngle(row, context, angle) {
  var best = null;
  PHOTO_YEARS.forEach(function(yr) {
    var merged = getMergedData(row, yr, context);
    (merged.photos || []).forEach(function(photo, idx) {
      var itemAngle = normalizePhotoAngle((merged.angles || [])[idx]);
      if (angle && itemAngle !== normalizePhotoAngle(angle)) return;
      var date = (merged.dates || [])[idx] || '';
      var ts = parseExifDate(date) || Date.parse(yr + '-01-01') || 0;
      if (!best || ts >= best.ts) {
        best = { url: photo, date: date, year: yr, angle: itemAngle, ts: ts };
      }
    });
  });
  return best;
}

function renderUploadLastPhotoPreview() {
  var wrap = document.getElementById('upload-last-photo-preview');
  if (!wrap || !PHOTO_GALLERY.row) return;
  var selectedAngle = getSelectedUploadAngle();
  var latest = getLatestTimelinePhotoForAngle(PHOTO_GALLERY.row, PHOTO_GALLERY.context || 'juna', selectedAngle);
  if (!latest || !latest.url) {
    wrap.innerHTML = '<div class="upload-last-empty">Belum ada foto sebelumnya untuk ' + displayPhotoAngle(selectedAngle) + '.</div>';
    return;
  }
  wrap.innerHTML = '<div class="upload-last-title">Foto terakhir sebagai pembanding</div>' +
    '<div class="upload-last-card">' +
      '<img src="' + normalizeImageUrl(latest.url) + '" alt="Foto terakhir" onclick="openPhotoPreviewFromUrl(\'' + encodeURIComponent(normalizeImageUrl(latest.url)) + '\', \'' + encodeURIComponent(latest.date || '') + '\')" onerror="handleDriveImageError(this)">' +
      '<div><strong>' + displayPhotoAngle(latest.angle) + '</strong><span>' + (formatDateIndo(latest.date) || 'Tanggal tidak tersedia') + '</span><small>Tahun ' + escapeHtml(latest.year || '-') + '</small></div>' +
    '</div>';
}

function resetMonitoringInputs() {
  document.querySelectorAll('#upload-monitoring-fields input[type="radio"], #upload-monitoring-fields input[type="checkbox"]').forEach(function(inp) {
    inp.checked = false;
  });
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked'))
    .map(function(inp) { return inp.value; })
    .filter(Boolean)
    .join(', ');
}

function getRadioValue(name) {
  var el = document.querySelector('input[name="' + name + '"]:checked');
  return el ? el.value : '';
}

function formatUploadDate(dateObj) {
  var d = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}

function parseExifDateString(raw) {
  if (!raw) return '';
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return ('0' + raw.getDate()).slice(-2) + '/' +
      ('0' + (raw.getMonth() + 1)).slice(-2) + '/' +
      raw.getFullYear() + ' ' +
      ('0' + raw.getHours()).slice(-2) + ':' +
      ('0' + raw.getMinutes()).slice(-2);
  }
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

function getFileLastModifiedDateString(file) {
  if (!file || !file.lastModified) return '';
  var d = new Date(file.lastModified);
  if (isNaN(d.getTime())) return '';
  return ('0' + d.getDate()).slice(-2) + '/' +
    ('0' + (d.getMonth() + 1)).slice(-2) + '/' +
    d.getFullYear() + ' ' +
    ('0' + d.getHours()).slice(-2) + ':' +
    ('0' + d.getMinutes()).slice(-2);
}

function exifRationalToNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (value.numerator != null && value.denominator) return value.numerator / value.denominator;
  if (Array.isArray(value) && value.length >= 2 && value[1]) return value[0] / value[1];
  var n = parseFloat(value);
  return isNaN(n) ? null : n;
}

function exifDmsToDecimal(dms, ref) {
  if (!dms || dms.length < 3) return null;
  var deg = exifRationalToNumber(dms[0]);
  var min = exifRationalToNumber(dms[1]);
  var sec = exifRationalToNumber(dms[2]);
  if (deg == null || min == null || sec == null) return null;
  var val = deg + (min / 60) + (sec / 3600);
  ref = String(ref || '').toUpperCase();
  if (ref === 'S' || ref === 'W') val *= -1;
  return parseFloat(val.toFixed(7));
}

function getFileExifMetadata(file) {
  return new Promise(function(resolve) {
    var result = { date: getFileLastModifiedDateString(file), lat: null, lng: null };
    var settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      resolve(value || result);
    }
    var fallbackTimer = setTimeout(function() { finish(result); }, 2000);
    try {
      if (typeof EXIF === 'undefined' || !EXIF.getData) {
        clearTimeout(fallbackTimer);
        finish(result);
        return;
      }
      EXIF.getData(file, function() {
        var rawDate = EXIF.getTag(this, "DateTimeOriginal") || EXIF.getTag(this, "DateTime") || EXIF.getTag(this, "DateTimeDigitized");
        var lat = exifDmsToDecimal(EXIF.getTag(this, "GPSLatitude"), EXIF.getTag(this, "GPSLatitudeRef"));
        var lng = exifDmsToDecimal(EXIF.getTag(this, "GPSLongitude"), EXIF.getTag(this, "GPSLongitudeRef"));
        clearTimeout(fallbackTimer);
        finish({ date: parseExifDateString(rawDate) || getFileLastModifiedDateString(file), lat: lat, lng: lng });
      });
    } catch (e) {
      clearTimeout(fallbackTimer);
      finish(result);
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

function validateUploadFiles(files) {
  if (!files || files.length === 0) return "Pilih minimal satu file foto.";
  if (files.length > 2) return "Maksimal 2 foto per sesi upload.";
  var totalSize = 0;
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (f.size > 5 * 1024 * 1024) return "File " + f.name + " melebihi batas 5MB.";
    totalSize += f.size;
    if (!f.type.match(/^image\//) && !f.name.toLowerCase().match(/\.(heic|heif)$/)) {
      return "File " + f.name + " bukan format gambar yang valid.";
    }
  }
  if (totalSize > 30 * 1024 * 1024) return "Total ukuran file melebihi batas 30MB.";
  return null;
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
  var selectedAngle = getSelectedUploadAngle();
  
  var btn = document.querySelector('#upload-modal .btn-apply');
  var oldText = btn.innerHTML;
  btn.innerHTML = 'Mengekstrak EXIF...';
  btn.disabled = true;

  var files = Array.from(fileInput.files);
  var validationError = validateUploadFiles(files);
  if (validationError) {
    showToast(validationError, 'error');
    btn.innerHTML = oldText;
    btn.disabled = false;
    return;
  }

  var successCount = 0;
  var failedCount = 0;

  function uploadOne(file, index) {
    btn.innerHTML = 'Menyiapkan foto (' + (index + 1) + '/' + files.length + ')...';
    return validateSingleImageFile(file)
      .then(function(fileErr) {
        if (fileErr) throw new Error(fileErr);
        return getFileExifDate(file);
      })
      .then(function(exifDate) {
        var manualDateVal = document.getElementById('upload-datetime') ? document.getElementById('upload-datetime').value : '';
        var finalDateStr = manualDateVal ? formatUploadDate(new Date(manualDateVal)) : (exifDate || formatUploadDate(new Date()));
        return readFileAsDataUrl(file).then(function(base64Full) {
          var base64Clean = String(base64Full).split(',')[1] || '';
          btn.innerHTML = 'Mengupload (' + (index + 1) + '/' + files.length + ')...';
          var catUpload = 'juna';
          if (context === 'pjl') catUpload = 'pjl';
          else if (context === 'pegawai') catUpload = 'pegawai';
          else if (context === 'pegawaiBinaan') catUpload = 'pegawaibinaanformatsistem';
          else if (context === 'polygon') catUpload = 'polygon';
          else if (context === 'per') catUpload = 'persemaian';

          var mon = {};
          var monDiv = document.getElementById('upload-monitoring-fields');
          if (monDiv && monDiv.style.display !== 'none') {
            mon = {
              tutupan: getRadioValue('mon-tutupan'),
              jenis: getCheckedValues('mon-jenis'),
              kerapatan: getCheckedValues('mon-kerapatan'),
              lereng: getRadioValue('mon-lereng'),
              umur: getRadioValue('mon-umur'),
              pengelolaan: getRadioValue('mon-pengelolaan'),
              ekosistem: getCheckedValues('mon-ekosistem'),
              usulan: getCheckedValues('mon-usulan')
            };
          }

          var payload = {
            action: "upload",
            base64: base64Clean,
            mimeType: file.type || "image/jpeg",
            filename: file.name || '',
            lat: coords.lat,
            lng: coords.lng,
            year: year,
            date: finalDateStr,
            category: catUpload,
            angle: selectedAngle,
            rowIndex: r._row_idx || '',
            sheetGid: r._source_gid || '',
            featureId: r['ID'] || r.featureId || '',
            monitoring: mon
          };

          return fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(withAuthPayload(payload))
          }).then(function(response) {
            return response.json();
          }).then(function(data) {
            if (!data.success) throw new Error(data.error || 'Upload gagal.');
            successCount++;
            if (mon) {
              var updateMonField = function(key, newVal) {
                var current = String(r[key + '_' + year] || '').trim();
                newVal = newVal || '-';
                r[key + '_' + year] = current ? current + '|' + newVal : newVal;
              };
              updateMonField('Tutupan', mon.tutupan);
              updateMonField('Jenis', mon.jenis);
              updateMonField('Kerapatan', mon.kerapatan);
              updateMonField('Lereng', mon.lereng);
              updateMonField('Umur', mon.umur);
              updateMonField('Pengelolaan', mon.pengelolaan);
              updateMonField('Ekosistem', mon.ekosistem);
              updateMonField('Usulan', mon.usulan);
            }
            
            // Update the row data directly so it doesn't show as local
            var currentFotos = r['Foto_' + year] ? String(r['Foto_' + year]).trim() : '';
            r['Foto_' + year] = currentFotos ? currentFotos + "|" + data.url : data.url;
            var currentDates = r['Tanggal_' + year] ? String(r['Tanggal_' + year]).trim() : '';
            r['Tanggal_' + year] = currentDates ? currentDates + "|" + (data.date || finalDateStr) : (data.date || finalDateStr);
            var currentAngles = r['Sudut_' + year] ? String(r['Sudut_' + year]).trim() : '';
            r['Sudut_' + year] = currentAngles ? currentAngles + "|" + selectedAngle : selectedAngle;

            // Also keep it in localStorage just in case of page reload before Google Sheets cache expires
            var locals = getLocalPhotos(r, year, context);
            locals.push({ url: data.url, date: data.date || finalDateStr, angle: selectedAngle });
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
  renderUploadLastPhotoPreview();
}

document.querySelectorAll('input[name="upload-angle"]').forEach(function(el) {
  el.addEventListener('change', renderUploadLastPhotoPreview);
});

function openPhotoPreviewFromUrl(encodedUrl, encodedDate) {
  var url = decodeURIComponent(encodedUrl || '');
  if (!url) return;
  LB_STATE.photos = [url];
  LB_STATE.dates = [decodeURIComponent(encodedDate || '')];
  LB_STATE.years = [''];
  LB_STATE.angles = [''];
  LB_STATE.idx = 0;
  LB_STATE.year = '';
  LB_STATE.context = 'single';
  LB_STATE.locName = '';
  document.getElementById('photo-lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshLightbox();
}

function getBackendCategoryForContext(context) {
  if (context === 'pjl') return 'pjl';
  if (context === 'pegawai') return 'pegawai';
  if (context === 'pegawaiBinaan') return 'pegawaibinaanformatsistem';
  if (context === 'per') return 'persemaian';
  if (context === 'polygon') return 'polygon';
  return 'juna';
}

function parsePhotoDateToInputValue(dateStr) {
  var ts = parseExifDate(dateStr);
  if (!ts) return '';
  var d = new Date(ts);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

function getIsoDateFromInput(value) {
  if (!value) return '';
  var d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

function getWeeklyCheckedValues(name) {
  return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(function(el) { return el.value; }).join(', ');
}

function setWeeklyCheckedValues(name, value) {
  var selected = String(value || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  document.querySelectorAll('input[name="' + name + '"]').forEach(function(el) {
    el.checked = selected.indexOf(el.value) !== -1;
  });
}

function calculateWeeklyTotalBibit(text) {
  var total = 0;
  String(text || '').replace(/\((\d+)\)|\b(\d+)\b/g, function(_, a, b) {
    total += parseInt(a || b || '0', 10) || 0;
    return _;
  });
  return total;
}

function getWeeklyDraftKey() {
  var r = WEEKLY_REPORT_STATE.row || PHOTO_GALLERY.row || {};
  var context = WEEKLY_REPORT_STATE.context || PHOTO_GALLERY.context || 'juna';
  var coords = getPhotoCoords(r);
  return 'geohutan_weekly_draft_' + context + '_' + (r._row_idx || r['ID'] || r.featureId || '') + '_' + (coords.lat || '') + '_' + (coords.lng || '');
}

function getWeeklyPendingQueue() {
  try { return JSON.parse(localStorage.getItem('geohutan_weekly_pending_queue') || '[]') || []; }
  catch (e) { return []; }
}

function setWeeklyPendingQueue(queue) {
  try { localStorage.setItem('geohutan_weekly_pending_queue', JSON.stringify(queue || [])); }
  catch (e) { showToast('Penyimpanan sementara penuh. Kurangi ukuran foto lalu coba lagi.', 'error'); }
  updateWeeklyDraftStatus();
}

function updateWeeklyDraftStatus() {
  var el = document.getElementById('weekly-draft-status');
  if (!el) return;
  var count = getWeeklyPendingQueue().length;
  el.textContent = count ? count + ' draft menunggu sinyal' : 'Draft otomatis aktif';
  el.className = 'weekly-draft-status' + (count ? ' has-pending' : '');
}

function collectWeeklyFormDraft() {
  function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  return {
    reportId: val('weekly-report-id'),
    mode: val('weekly-report-mode') || 'create',
    pelaksana: val('wr-pelaksana'),
    lokasi: val('wr-lokasi'),
    waktu: val('wr-waktu'),
    tutupan: val('wr-tutupan'),
    kegiatanVegetatif: getWeeklyCheckedValues('wr-vegetatif'),
    kondisiTanaman: getWeeklyCheckedValues('wr-kondisi-tanaman'),
    kegiatanMonitoring: getWeeklyCheckedValues('wr-monitoring'),
    jenisJumlahBibit: val('wr-bibit'),
    totalBibit: val('wr-total-bibit'),
    tinggiTanaman: val('wr-tinggi-tanaman'),
    sumberBibit: val('wr-sumber-bibit'),
    kebutuhanBibitCukup: val('wr-kebutuhan-bibit'),
    kekuranganJenisJumlahBibit: val('wr-bibit-kurang'),
    kekuranganTotalBibit: val('wr-total-bibit-kurang'),
    kekuranganTinggiTanaman: val('wr-tinggi-tanaman-kurang'),
    kekuranganSumberBibit: val('wr-sumber-bibit-kurang'),
    uraian: val('wr-uraian'),
    adaGangguan: val('wr-ada-gangguan'),
    jenisGangguan: getWeeklyCheckedValues('wr-jenis-gangguan'),
    tindakLanjut: val('wr-tindak-lanjut')
  };
}

function saveWeeklyFormDraft() {
  var form = document.getElementById('weekly-report-form');
  if (!form || !document.getElementById('weekly-report-modal').classList.contains('open')) return;
  try { localStorage.setItem(getWeeklyDraftKey(), JSON.stringify(collectWeeklyFormDraft())); } catch (e) {}
  updateWeeklyDraftStatus();
}

function restoreWeeklyFormDraft() {
  var raw = '';
  try { raw = localStorage.getItem(getWeeklyDraftKey()) || ''; } catch (e) {}
  if (!raw) return;
  try {
    var d = JSON.parse(raw);
    if (!d || d.reportId) return;
    function set(id, value) { var el = document.getElementById(id); if (el && value != null) el.value = value; }
    set('wr-pelaksana', d.pelaksana);
    set('wr-lokasi', d.lokasi);
    set('wr-waktu', d.waktu);
    set('wr-tutupan', d.tutupan);
    setWeeklyCheckedValues('wr-vegetatif', d.kegiatanVegetatif);
    setWeeklyCheckedValues('wr-kondisi-tanaman', d.kondisiTanaman);
    setWeeklyCheckedValues('wr-monitoring', d.kegiatanMonitoring);
    set('wr-bibit', d.jenisJumlahBibit);
    set('wr-total-bibit', d.totalBibit || calculateWeeklyTotalBibit(d.jenisJumlahBibit));
    set('wr-tinggi-tanaman', d.tinggiTanaman);
    set('wr-sumber-bibit', d.sumberBibit);
    set('wr-kebutuhan-bibit', d.kebutuhanBibitCukup);
    set('wr-bibit-kurang', d.kekuranganJenisJumlahBibit);
    set('wr-total-bibit-kurang', d.kekuranganTotalBibit || calculateWeeklyTotalBibit(d.kekuranganJenisJumlahBibit));
    set('wr-tinggi-tanaman-kurang', d.kekuranganTinggiTanaman);
    set('wr-sumber-bibit-kurang', d.kekuranganSumberBibit);
    set('wr-uraian', d.uraian);
    set('wr-ada-gangguan', d.adaGangguan);
    setWeeklyCheckedValues('wr-jenis-gangguan', d.jenisGangguan);
    set('wr-tindak-lanjut', d.tindakLanjut);
    updateWeeklyKebutuhanBibitVisibility();
    updateWeeklyGangguanVisibility();
  } catch (e) {}
}

function clearWeeklyFormDraft() {
  try { localStorage.removeItem(getWeeklyDraftKey()); } catch (e) {}
  updateWeeklyDraftStatus();
}

function formatWeeklyGpsDate_(value) {
  var d = value instanceof Date && !isNaN(value.getTime()) ? value : new Date(value || Date.now());
  if (isNaN(d.getTime())) d = new Date();
  return ('0' + d.getDate()).slice(-2) + '/' +
    ('0' + (d.getMonth() + 1)).slice(-2) + '/' +
    d.getFullYear() + ' ' +
    ('0' + d.getHours()).slice(-2) + ':' +
    ('0' + d.getMinutes()).slice(-2);
}

function isFreshWeeklyGpsMeta(meta) {
  return !!(meta && meta.lat != null && meta.lng != null && meta.timestamp && (Date.now() - meta.timestamp) < 10 * 60 * 1000);
}

function requestWeeklyGpsLocation(silent) {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Perangkat atau browser tidak mendukung GPS lokasi.'));
  }
  if (isFreshWeeklyGpsMeta(WEEKLY_REPORT_STATE.currentGpsMeta)) {
    return Promise.resolve(WEEKLY_REPORT_STATE.currentGpsMeta);
  }
  if (WEEKLY_REPORT_STATE.weeklyGpsPromise) return WEEKLY_REPORT_STATE.weeklyGpsPromise;
  if (!silent) showToast('Mengaktifkan GPS lokasi akurat. Izinkan akses lokasi jika diminta.', 'info');
  WEEKLY_REPORT_STATE.weeklyGpsPromise = new Promise(function(resolve, reject) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      var coords = pos && pos.coords ? pos.coords : {};
      var meta = {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: pos.timestamp || Date.now(),
        date: formatWeeklyGpsDate_(pos.timestamp || Date.now()),
        source: 'GPS lokasi perangkat'
      };
      WEEKLY_REPORT_STATE.currentGpsMeta = meta;
      WEEKLY_REPORT_STATE.weeklyGpsPromise = null;
      resolve(meta);
    }, function(err) {
      WEEKLY_REPORT_STATE.weeklyGpsPromise = null;
      var msg = err && err.code === 1
        ? 'Izin lokasi ditolak. Aktifkan GPS/lokasi dan izinkan akses lokasi untuk mengambil foto laporan mingguan.'
        : 'GPS lokasi belum berhasil didapatkan. Pastikan lokasi/GPS aktif lalu coba lagi.';
      reject(new Error(msg));
    }, { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 });
  });
  return WEEKLY_REPORT_STATE.weeklyGpsPromise;
}

function prefetchWeeklyGpsLocation() {
  requestWeeklyGpsLocation(true).catch(function() {});
}

function shouldRequireWeeklyGpsBeforeCamera() {
  var ua = navigator.userAgent || '';
  var mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  var touchMobile = navigator.maxTouchPoints > 1 && window.innerWidth <= 950;
  return mobileUA || touchMobile;
}

function mergeWeeklyPhotoMetadata(exifMeta, gpsMeta) {
  exifMeta = exifMeta || {};
  var gpsOk = gpsMeta && gpsMeta.lat != null && gpsMeta.lng != null;
  return {
    date: exifMeta.date || (gpsOk && gpsMeta.date ? gpsMeta.date : ''),
    lat: gpsOk ? gpsMeta.lat : exifMeta.lat,
    lng: gpsOk ? gpsMeta.lng : exifMeta.lng,
    source: gpsOk ? 'GPS lokasi perangkat' : 'Metadata kamera/EXIF',
    accuracy: gpsOk ? gpsMeta.accuracy : '',
    exifDate: exifMeta.date || '',
    exifLat: exifMeta.lat,
    exifLng: exifMeta.lng
  };
}

function getWeeklyPhotoFinalMetadata(file) {
  return getFileExifMetadata(file).then(function(exifMeta) {
    return requestWeeklyGpsLocation(false).then(function(gpsMeta) {
      return mergeWeeklyPhotoMetadata(exifMeta, gpsMeta);
    }).catch(function(gpsErr) {
      var meta = mergeWeeklyPhotoMetadata(exifMeta, null);
      meta.gpsError = gpsErr && (gpsErr.message || String(gpsErr));
      return meta;
    });
  });
}

function renderWeeklyPhotoMetaStatus(meta, file, errorText) {
  var wrap = document.getElementById('wr-photo-meta-status');
  if (!wrap) return;
  if (!file && !errorText) {
    wrap.innerHTML = '';
    return;
  }
  var ok = meta && meta.date && meta.lat != null && meta.lng != null && !errorText;
  var thumb = file ? '<img src="' + URL.createObjectURL(file) + '" alt="Preview foto laporan">' : '';
  var source = meta && meta.source ? meta.source : '-';
  var accuracy = meta && meta.accuracy ? ' (akurasi +/- ' + Math.round(Number(meta.accuracy)) + ' m)' : '';
  wrap.className = 'weekly-photo-meta-status ' + (ok ? 'ok' : 'bad');
  wrap.innerHTML = '<div class="weekly-meta-card">' + thumb +
    '<div><strong>' + (ok ? 'Foto Ini memiliki metadata Lengkap' : 'Foto Tidak memiliki metadata Koordinat Latitude Longitude atau Tanggal Waktu') + '</strong>' +
    '<span>Latitude: ' + escapeHtml(meta && meta.lat != null ? meta.lat : '-') + '</span>' +
    '<span>Longitude: ' + escapeHtml(meta && meta.lng != null ? meta.lng : '-') + '</span>' +
    '<span>Tanggal waktu: ' + escapeHtml(meta && meta.date ? formatDateIndo(meta.date) : '-') + '</span>' +
    '<span>Sumber koordinat: ' + escapeHtml(source + accuracy) + '</span>' +
    (meta && meta.note ? '<small>' + escapeHtml(meta.note) + '</small>' : '') +
    (errorText ? '<small>' + escapeHtml(errorText) + '</small>' : '') + '</div></div>';
}

function updateWeeklyKebutuhanBibitVisibility() {
  var sel = document.getElementById('wr-kebutuhan-bibit');
  var show = sel && String(sel.value || '').toLowerCase() === 'tidak';
  var fields = document.getElementById('wr-kebutuhan-kurang-fields');
  if (fields) fields.style.display = show ? 'block' : 'none';
  if (!show) {
    ['wr-bibit-kurang', 'wr-total-bibit-kurang', 'wr-tinggi-tanaman-kurang', 'wr-sumber-bibit-kurang'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = id === 'wr-total-bibit-kurang' ? '0' : '';
    });
  }
}

function resetWeeklyReportForm() {
  var form = document.getElementById('weekly-report-form');
  if (form) form.reset();
  document.getElementById('weekly-report-id').value = '';
  document.getElementById('weekly-report-mode').value = 'create';
  var totalEl = document.getElementById('wr-total-bibit');
  if (totalEl) totalEl.value = '0';
  var totalKurangEl = document.getElementById('wr-total-bibit-kurang');
  if (totalKurangEl) totalKurangEl.value = '0';
  WEEKLY_REPORT_STATE.currentPhotoMeta = null;
  WEEKLY_REPORT_STATE.currentGpsMeta = null;
  WEEKLY_REPORT_STATE.allowCameraOpen = false;
  renderWeeklyPhotoMetaStatus(null, null);
  var oldPhoto = document.getElementById('wr-existing-photo');
  if (oldPhoto) oldPhoto.innerHTML = '';
  var user = getCurrentAuthUser();
  var pelaksana = document.getElementById('wr-pelaksana');
  if (pelaksana && user) pelaksana.value = user.nama || user.username || '';
  var waktu = document.getElementById('wr-waktu');
  if (waktu) {
    delete waktu.dataset.userEdited;
    var now = new Date();
    waktu.value = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2) + 'T' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
  }
  updateWeeklyKebutuhanBibitVisibility();
  updateWeeklyGangguanVisibility();
  updateWeeklyDraftStatus();
}

function getWeeklyLocationLabel(r, context) {
  if (!r) return '';
  if (context === 'per') return (r['Nama Persemaian'] || r['Nama'] || 'Lokasi Persemaian') + ' - ' + (r['Unit Kerja'] || r._cdk || '');
  if (context === 'polygon') return (r['Nama'] || 'Titik Kegiatan') + ' - ' + (r['Kegiatan'] || '');
  if (context === 'pegawaiBinaan') return (getBinaanKabupaten(r) || r._kab || '') + ' - ' + (getBinaanField(r, 'kegiatan') || '');
  return getName(r) + ' - ' + (r['Unit Kerja'] || r['UNIT KERJA'] || r['Kabupaten/Kota'] || r._kab || '');
}

function openWeeklyReportModal(report) {
  var r = WEEKLY_REPORT_STATE.row || PHOTO_GALLERY.row;
  if (!r) return;
  var context = WEEKLY_REPORT_STATE.context || PHOTO_GALLERY.context || 'juna';
  var modal = document.getElementById('weekly-report-modal');
  if (!modal) return;
  resetWeeklyReportForm();
  var info = document.getElementById('weekly-report-loc-info');
  if (info) info.textContent = getWeeklyLocationLabel(r, context);
  var lokasi = document.getElementById('wr-lokasi');
  if (lokasi) lokasi.value = getWeeklyLocationLabel(r, context);
  var title = document.querySelector('#weekly-report-modal .modal-head h2');
  if (title) title.textContent = report ? 'EDIT LAPORAN MINGGUAN HUTAN BINAAN' : 'FORM LAPORAN MINGGUAN HUTAN BINAAN';
  if (report) {
    document.getElementById('weekly-report-id').value = report.id || '';
    document.getElementById('weekly-report-mode').value = 'edit';
    document.getElementById('wr-pelaksana').value = report.pelaksana || '';
    document.getElementById('wr-lokasi').value = report.lokasi || '';
    document.getElementById('wr-waktu').value = parsePhotoDateToInputValue(report.waktu) || parsePhotoDateToInputValue(report.fotoTanggal) || '';
    document.getElementById('wr-tutupan').value = report.tutupan || '';
    setWeeklyCheckedValues('wr-vegetatif', report.kegiatanVegetatif);
    document.getElementById('wr-bibit').value = report.jenisJumlahBibit || '';
    document.getElementById('wr-total-bibit').value = report.totalBibit || calculateWeeklyTotalBibit(report.jenisJumlahBibit);
    document.getElementById('wr-tinggi-tanaman').value = report.tinggiTanaman || '';
    document.getElementById('wr-sumber-bibit').value = report.sumberBibit || '';
    document.getElementById('wr-kebutuhan-bibit').value = report.kebutuhanBibitCukup || '';
    document.getElementById('wr-bibit-kurang').value = report.kekuranganJenisJumlahBibit || '';
    document.getElementById('wr-total-bibit-kurang').value = report.kekuranganTotalBibit || calculateWeeklyTotalBibit(report.kekuranganJenisJumlahBibit);
    document.getElementById('wr-tinggi-tanaman-kurang').value = report.kekuranganTinggiTanaman || '';
    document.getElementById('wr-sumber-bibit-kurang').value = report.kekuranganSumberBibit || '';
    setWeeklyCheckedValues('wr-kondisi-tanaman', report.kondisiTanaman);
    setWeeklyCheckedValues('wr-monitoring', report.kegiatanMonitoring);
    document.getElementById('wr-uraian').value = report.uraian || '';
    document.getElementById('wr-ada-gangguan').value = report.adaGangguan || '';
    setWeeklyCheckedValues('wr-jenis-gangguan', report.jenisGangguan);
    document.getElementById('wr-tindak-lanjut').value = report.tindakLanjut || '';
    renderWeeklyExistingPhoto(report);
  } else {
    restoreWeeklyFormDraft();
  }
  updateWeeklyKebutuhanBibitVisibility();
  updateWeeklyGangguanVisibility();
  modal.classList.add('open');
  prefetchWeeklyGpsLocation();
  // Cek versi backend satu kali; tampilkan warning jika perlu
  checkBackendVersion(function(ok) {
    var submitBtn = document.getElementById('weekly-report-submit');
    var warningId = 'wr-backend-warning';
    var existing = document.getElementById(warningId);
    if (existing) existing.remove();
    if (!ok) {
      var warn = document.createElement('div');
      warn.id = warningId;
      warn.style.cssText = 'background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px 14px;margin:8px 0;font-size:13px;color:#856404;line-height:1.5;';
      warn.innerHTML = '<strong>\u26a0\ufe0f Backend perlu di-deploy ulang</strong><br>Kode terbaru belum aktif. Fitur Simpan Laporan tidak akan berfungsi.<br><small>Buka Apps Script &rarr; Deploy &rarr; Manage Deployments &rarr; Edit &rarr; Latest version &rarr; Deploy.</small>';
      var form = document.getElementById('weekly-report-form');
      if (form && submitBtn) form.insertBefore(warn, submitBtn.parentNode);
      if (submitBtn) { submitBtn.disabled = true; submitBtn.title = 'Backend perlu di-deploy ulang terlebih dahulu.'; }
    } else {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.title = ''; }
    }
  });
}

function renderWeeklyExistingPhoto(report) {
  var wrap = document.getElementById('wr-existing-photo');
  if (!wrap) return;
  if (!report || !report.fotoUrl) {
    wrap.innerHTML = '<div class="weekly-existing-empty">Belum ada foto tersimpan.</div>';
    return;
  }
  var img = normalizeImageUrl(report.fotoUrl);
  wrap.innerHTML = '<div class="weekly-existing-card">' +
    '<img src="' + img + '" alt="Foto laporan sebelumnya" onclick="previewWeeklyPhotoById(\'' + escapeHtml(report.id || '') + '\')" onerror="handleDriveImageError(this)">' +
    '<div><strong>Foto terakhir laporan ini</strong><span>' + (formatDateIndo(report.fotoTanggal || report.waktu) || 'Tanggal tidak tersedia') + '</span><small>Biarkan kosong jika foto tidak diganti.</small></div>' +
    '</div>';
}

function updateWeeklyGangguanVisibility() {
  var sel = document.getElementById('wr-ada-gangguan');
  var show = !sel || String(sel.value || '').toLowerCase() === 'ya';
  var fields = document.getElementById('wr-gangguan-fields');
  var tindak = document.getElementById('wr-tindak-lanjut-wrap');
  if (fields) fields.style.display = show ? '' : 'none';
  if (tindak) tindak.style.display = show ? '' : 'none';
  if (!show) {
    document.querySelectorAll('input[name="wr-jenis-gangguan"]').forEach(function(el) { el.checked = false; });
    var tl = document.getElementById('wr-tindak-lanjut');
    if (tl) tl.value = '';
  }
}

function closeWeeklyReportModal() {
  var modal = document.getElementById('weekly-report-modal');
  if (modal) modal.classList.remove('open');
}

function validateSingleImageFile(file) {
  if (!file) return Promise.resolve(null);
  if (file.size > 5 * 1024 * 1024) return Promise.resolve('Ukuran foto melebihi 5 MB.');
  if (!file.type.match(/^image\//) && !file.name.toLowerCase().match(/\.(heic|heif)$/)) return Promise.resolve('File lampiran bukan format gambar.');
  if (file.name.toLowerCase().match(/\.(heic|heif)$/)) return Promise.resolve(null);
  return new Promise(function(resolve) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    var settled = false;
    function finish(msg) {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(msg || null);
    }
    img.onload = function() { finish(null); };
    img.onerror = function() { finish('File foto rusak atau tidak dapat dibaca.'); };
    img.src = url;
    setTimeout(function() { finish('File foto tidak dapat diverifikasi.'); }, 4000);
  });
}

function buildWeeklyReportPayload(photo) {
  var r = WEEKLY_REPORT_STATE.row || PHOTO_GALLERY.row;
  var context = WEEKLY_REPORT_STATE.context || PHOTO_GALLERY.context || 'juna';
  var coords = getPhotoCoords(r);
  var bibitText = document.getElementById('wr-bibit').value || '';
  var bibitKurangText = document.getElementById('wr-bibit-kurang').value || '';
  var kebutuhan = document.getElementById('wr-kebutuhan-bibit').value || '';
  var adaGangguan = document.getElementById('wr-ada-gangguan').value || '';
  return {
    action: 'saveWeeklyReport',
    mode: document.getElementById('weekly-report-mode').value || 'create',
    reportId: document.getElementById('weekly-report-id').value || '',
    category: getBackendCategoryForContext(context),
    lat: coords.lat,
    lng: coords.lng,
    rowIndex: r._row_idx || '',
    sheetGid: r._source_gid || '',
    featureId: r['ID'] || r.featureId || '',
    photoBase64: photo.base64,
    photoMimeType: photo.mimeType,
    photoFilename: photo.filename || '',
    report: {
      pelaksana: document.getElementById('wr-pelaksana').value,
      lokasi: document.getElementById('wr-lokasi').value,
      waktu: getIsoDateFromInput(document.getElementById('wr-waktu').value),
      tutupan: document.getElementById('wr-tutupan').value,
      kegiatanVegetatif: getWeeklyCheckedValues('wr-vegetatif'),
      kondisiTanaman: getWeeklyCheckedValues('wr-kondisi-tanaman'),
      kegiatanMonitoring: getWeeklyCheckedValues('wr-monitoring'),
      jenisJumlahBibit: bibitText,
      totalBibit: calculateWeeklyTotalBibit(bibitText),
      tinggiTanaman: document.getElementById('wr-tinggi-tanaman').value,
      sumberBibit: document.getElementById('wr-sumber-bibit').value,
      kebutuhanBibitCukup: kebutuhan,
      kekuranganJenisJumlahBibit: String(kebutuhan).toLowerCase() === 'tidak' ? bibitKurangText : '',
      kekuranganTotalBibit: String(kebutuhan).toLowerCase() === 'tidak' ? calculateWeeklyTotalBibit(bibitKurangText) : '',
      kekuranganTinggiTanaman: String(kebutuhan).toLowerCase() === 'tidak' ? document.getElementById('wr-tinggi-tanaman-kurang').value : '',
      kekuranganSumberBibit: String(kebutuhan).toLowerCase() === 'tidak' ? document.getElementById('wr-sumber-bibit-kurang').value : '',
      uraian: document.getElementById('wr-uraian').value,
      adaGangguan: adaGangguan,
      jenisGangguan: String(adaGangguan).toLowerCase() === 'ya' ? getWeeklyCheckedValues('wr-jenis-gangguan') : '',
      tindakLanjut: String(adaGangguan).toLowerCase() === 'ya' ? document.getElementById('wr-tindak-lanjut').value : '',
      fotoTanggal: photo.date || photo.exifDate,
      fotoLat: photo.lat == null ? '' : photo.lat,
      fotoLng: photo.lng == null ? '' : photo.lng
    }
  };
}

function postWeeklyReportPayload(payload) {
  payload.authToken = getAuthToken();
  return fetch(GAS_WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) })
    .then(function(res) { return res.json(); })
    .then(function(res) {
      if (!res.success) throw new Error(res.error || 'Gagal menyimpan laporan.');
      return res;
    });
}

function queuePendingWeeklyPayload(payload) {
  var queue = getWeeklyPendingQueue();
  payload._queuedAt = new Date().toISOString();
  queue.push(payload);
  try {
    localStorage.setItem('geohutan_weekly_pending_queue', JSON.stringify(queue));
    updateWeeklyDraftStatus();
    return true;
  } catch (e) {
    showToast('Gagal menyimpan draft offline. Ruang penyimpanan browser penuh.', 'error');
    return false;
  }
}

function syncPendingWeeklyReports() {
  var queue = getWeeklyPendingQueue();
  if (!queue.length) {
    updateWeeklyDraftStatus();
    showToast('Tidak ada draft laporan mingguan yang menunggu.', 'success');
    return;
  }
  if (!navigator.onLine) {
    showToast('Perangkat masih offline. Draft tetap tersimpan sementara.', 'warning');
    return;
  }
  var sent = 0;
  function next() {
    if (!queue.length) {
      setWeeklyPendingQueue([]);
      if (sent) invalidateWeeklyMonitorCache();
      showToast(sent + ' draft laporan mingguan berhasil dikirim.', 'success');
      if (document.getElementById('weekly-report-list')) loadWeeklyReportsForMarker(true);
      return;
    }
    var payload = queue[0];
    postWeeklyReportPayload(payload).then(function() {
      sent++;
      queue.shift();
      setWeeklyPendingQueue(queue);
      next();
    }).catch(function(err) {
      setWeeklyPendingQueue(queue);
      showToast('Sinkronisasi berhenti: ' + getFriendlyBackendErrorMessage(err), 'error');
    });
  }
  next();
}

function submitWeeklyReport(event) {
  if (event) event.preventDefault();
  var r = WEEKLY_REPORT_STATE.row || PHOTO_GALLERY.row;
  if (!r) return;
  var btn = document.getElementById('weekly-report-submit');
  var old = btn ? btn.textContent : '';
  var fileInput = document.getElementById('wr-foto');
  var file = fileInput && fileInput.files ? fileInput.files[0] : null;
  var mode = document.getElementById('weekly-report-mode').value || 'create';
  if (fileInput && fileInput.files && fileInput.files.length > 1) {
    showToast('Maksimal 1 foto untuk laporan mingguan.', 'error');
    return;
  }
  if (!file && mode !== 'edit') {
    showToast('Foto kamera wajib dilampirkan untuk laporan mingguan baru.', 'error');
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  validateSingleImageFile(file).then(function(err) {
    if (err) throw new Error(err);
    if (!file) return { base64: '', mimeType: '', filename: '', date: '', exifDate: '', lat: '', lng: '' };
    return getWeeklyPhotoFinalMetadata(file).then(function(meta) {
      WEEKLY_REPORT_STATE.currentPhotoMeta = meta;
      var missing = [];
      if (!meta.date) missing.push('tanggal waktu');
      if (meta.lat == null || meta.lng == null) missing.push('koordinat latitude/longitude');
      var metaError = missing.length ? 'Metadata tidak lengkap: ' + missing.join(', ') : '';
      if (meta.gpsError && meta.source !== 'GPS lokasi perangkat' && missing.length) {
        metaError += (metaError ? '. ' : '') + meta.gpsError;
      } else if (meta.gpsError && meta.source !== 'GPS lokasi perangkat') {
        meta.note = 'GPS live belum tersedia, sistem memakai metadata kamera/EXIF yang lengkap.';
      }
      renderWeeklyPhotoMetaStatus(meta, file, metaError);
      if (missing.length) throw new Error('Foto Tidak memiliki metadata Koordinat Latitude Longitude atau Tanggal Waktu.');
      return readFileAsDataUrl(file).then(function(dataUrl) {
        return { base64: String(dataUrl).split(',')[1] || '', mimeType: file.type || 'image/jpeg', filename: file.name || '', date: meta.date, exifDate: meta.exifDate || meta.date, lat: meta.lat, lng: meta.lng, source: meta.source || '', accuracy: meta.accuracy || '' };
      });
    });
  }).then(function(photo) {
    var payload = withAuthPayload(buildWeeklyReportPayload(photo));
    if (!navigator.onLine) {
      if (queuePendingWeeklyPayload(payload)) {
        closeWeeklyReportModal();
        showToast('Jaringan offline. Laporan disimpan sementara dan siap dikirim saat ada sinyal.', 'warning');
      }
      return null;
    }
    return postWeeklyReportPayload(payload).then(function(res) {
      clearWeeklyFormDraft();
      closeWeeklyReportModal();
      invalidateWeeklyMonitorCache();
      showToast('Laporan mingguan berhasil disimpan.', 'success');
      loadWeeklyReportsForMarker(true);
      return res;
    }).catch(function(err) {
      var msg = err && (err.message || String(err));
      if (!navigator.onLine || err.name === 'TypeError' || /failed to fetch|network/i.test(msg)) {
        if (queuePendingWeeklyPayload(payload)) {
          closeWeeklyReportModal();
          showToast('Koneksi bermasalah. Laporan disimpan sementara untuk dikirim ulang.', 'warning');
          return null;
        }
      }
      throw err;
    });
  }).catch(function(err) {
    showToast(getFriendlyBackendErrorMessage(err), 'error');
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.textContent = old || 'Simpan Laporan'; }
  });
}

function loadWeeklyReportsForMarker(showLoading) {
  var r = WEEKLY_REPORT_STATE.row || PHOTO_GALLERY.row;
  var context = WEEKLY_REPORT_STATE.context || PHOTO_GALLERY.context || 'juna';
  var list = document.getElementById('weekly-report-list');
  if (!r || !list) return;
  if (showLoading) list.innerHTML = '<div class="weekly-empty">Memuat riwayat laporan...</div>';
  var coords = getPhotoCoords(r);
  var url = GAS_WEB_APP_URL + '?action=getWeeklyReports&category=' + encodeURIComponent(getBackendCategoryForContext(context)) +
    '&lat=' + encodeURIComponent(coords.lat) + '&lng=' + encodeURIComponent(coords.lng) +
    '&rowIndex=' + encodeURIComponent(r._row_idx || '') + '&sheetGid=' + encodeURIComponent(r._source_gid || '') +
    '&featureId=' + encodeURIComponent(r['ID'] || r.featureId || '');
  fetch(appendAuthParam(url)).then(function(res) { return res.json(); }).then(function(data) {
    if (!data.success) throw new Error(data.error || 'Gagal memuat laporan.');
    WEEKLY_REPORT_STATE.reports = data.reports || [];
    WEEKLY_REPORT_STATE.listPage = 1;
    renderWeeklyReportList();
  }).catch(function(err) {
    list.innerHTML = '<div class="weekly-empty error">' + getFriendlyBackendErrorMessage(err) + '</div>';
  });
}

function renderWeeklyReportList() {
  var list = document.getElementById('weekly-report-list');
  if (!list) return;
  var reports = WEEKLY_REPORT_STATE.reports || [];
  if (!reports.length) {
    list.innerHTML = '<div class="weekly-empty">Belum ada laporan mingguan untuk titik ini.</div>';
    return;
  }
  var pageSize = WEEKLY_REPORT_STATE.listPageSize || 5;
  var totalPages = Math.max(1, Math.ceil(reports.length / pageSize));
  WEEKLY_REPORT_STATE.listPage = Math.max(1, Math.min(totalPages, WEEKLY_REPORT_STATE.listPage || 1));
  var start = (WEEKLY_REPORT_STATE.listPage - 1) * pageSize;
  var pageRows = reports.slice(start, start + pageSize);
  var rowsHtml = pageRows.map(function(rep, localIdx) {
    var idx = start + localIdx;
    var photo = rep.fotoUrl ? '<button type="button" onclick="previewWeeklyPhoto(' + idx + ')">Lihat Foto</button>' : '';
    return '<div class="weekly-report-card">' +
      '<div class="weekly-card-head"><strong>' + escapeHtml(formatDateIndo(rep.waktu) || '-') + '</strong><span>' + escapeHtml(rep.pelaksana || '-') + '</span></div>' +
      '<p>' + escapeHtml((rep.uraian || '-').substring(0, 180)) + '</p>' +
      '<div class="weekly-report-actions">' + photo +
        '<button type="button" onclick="viewWeeklyReportDetail(' + idx + ')">Detail</button>' +
        '<button type="button" onclick="openWeeklyReportModal(WEEKLY_REPORT_STATE.reports[' + idx + '])">Edit</button>' +
        '<button type="button" class="danger" onclick="deleteWeeklyReport(\'' + (rep.id || '') + '\')">Hapus</button>' +
      '</div></div>';
  }).join('');
  var pager = totalPages > 1 ? '<div class="weekly-list-pager">' +
    '<button type="button" onclick="changeWeeklyListPage(-1)" ' + (WEEKLY_REPORT_STATE.listPage <= 1 ? 'disabled' : '') + '>Sebelumnya</button>' +
    '<span>Halaman ' + WEEKLY_REPORT_STATE.listPage + ' dari ' + totalPages + '</span>' +
    '<button type="button" onclick="changeWeeklyListPage(1)" ' + (WEEKLY_REPORT_STATE.listPage >= totalPages ? 'disabled' : '') + '>Berikutnya</button>' +
    '</div>' : '';
  list.innerHTML = rowsHtml + pager;
}

function changeWeeklyListPage(delta) {
  WEEKLY_REPORT_STATE.listPage = (WEEKLY_REPORT_STATE.listPage || 1) + delta;
  renderWeeklyReportList();
}

function viewWeeklyReportDetail(idx) {
  var rep = (WEEKLY_REPORT_STATE.reports || [])[idx];
  if (!rep) return;
  openWeeklyDetailModal(rep);
}

function closeWeeklyDetailModal() {
  var modal = document.getElementById('weekly-detail-modal');
  if (modal) modal.classList.remove('open');
}

function buildDetailKV(label, value) {
  return '<div class="weekly-detail-kv"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || '-') + '</strong></div>';
}

function openWeeklyDetailModal(rep) {
  var modal = document.getElementById('weekly-detail-modal');
  var body = document.getElementById('weekly-detail-body');
  if (!modal || !body || !rep) return;
  WEEKLY_REPORT_STATE.currentDetailReport = rep;
  var coords = getPhotoCoords(WEEKLY_REPORT_STATE.row || PHOTO_GALLERY.row || {});
  var coordLabel = rep.koordinat || ((coords.lat && coords.lng) ? coordText(coords.lat, coords.lng) : '-');
  var photoHtml = rep.fotoUrl ? '<button type="button" class="weekly-detail-photo" onclick="previewCurrentWeeklyDetailPhoto()"><img src="' + normalizeImageUrl(rep.fotoUrl) + '" alt="Foto laporan mingguan" onerror="handleDriveImageError(this)"><span>Lihat Foto</span></button>' :
    '<div class="weekly-detail-no-photo">Foto belum tersedia</div>';
  body.innerHTML = '<div class="weekly-detail-hero">' +
      '<div><span>Laporan Mingguan</span><h3>' + escapeHtml(rep.kategoriLabel || rep.category || 'Kegiatan') + '</h3><p>' + escapeHtml(rep.lokasi || rep.nama || '-') + '</p></div>' +
      '<div class="weekly-detail-date">' + escapeHtml(formatDateIndo(rep.waktu) || '-') + '</div>' +
    '</div>' +
    '<div class="weekly-detail-layout">' +
      '<div class="weekly-detail-main">' +
        '<div class="weekly-detail-grid">' +
          buildDetailKV('Nama Pegawai/Pembina', rep.pelaksana || rep.pembina || rep.namaPegawai || '-') +
          buildDetailKV('Jabatan Pegawai', rep.jabatan || '-') +
          buildDetailKV('Unit CDK/UPTD', rep.unit || '-') +
          buildDetailKV('Luas Wilayah Binaan', rep.luas || rep.luasHa || '-') +
          buildDetailKV('Koordinat', coordLabel) +
          buildDetailKV('Waktu Foto', formatDateIndo(rep.fotoTanggal) || '-') +
        '</div>' +
        '<h4>Isi Laporan</h4>' +
        '<div class="weekly-detail-grid">' +
          buildDetailKV('Kondisi Tutupan Lahan', rep.tutupan || '-') +
          buildDetailKV('Kegiatan Vegetatif', rep.kegiatanVegetatif || '-') +
          buildDetailKV('Kondisi Tanaman', rep.kondisiTanaman || '-') +
          buildDetailKV('Kegiatan Monitoring', rep.kegiatanMonitoring || '-') +
          buildDetailKV('Jenis/Jumlah Bibit', rep.jenisJumlahBibit || '-') +
          buildDetailKV('Total Bibit', rep.totalBibit || '0') +
          buildDetailKV('Tinggi Tanaman (cm)', rep.tinggiTanaman || '-') +
          buildDetailKV('Sumber Bibit', rep.sumberBibit || '-') +
          buildDetailKV('Kebutuhan Bibit Mencukupi', rep.kebutuhanBibitCukup || '-') +
          buildDetailKV('Kekurangan Jenis/Jumlah Bibit', String(rep.kebutuhanBibitCukup || '').toLowerCase() === 'tidak' ? (rep.kekuranganJenisJumlahBibit || '-') : '-') +
          buildDetailKV('Kekurangan Total Bibit', String(rep.kebutuhanBibitCukup || '').toLowerCase() === 'tidak' ? (rep.kekuranganTotalBibit || '0') : '-') +
          buildDetailKV('Kekurangan Tinggi Tanaman (cm)', String(rep.kebutuhanBibitCukup || '').toLowerCase() === 'tidak' ? (rep.kekuranganTinggiTanaman || '-') : '-') +
          buildDetailKV('Kekurangan Sumber Bibit', String(rep.kebutuhanBibitCukup || '').toLowerCase() === 'tidak' ? (rep.kekuranganSumberBibit || '-') : '-') +
          buildDetailKV('Ada Gangguan', rep.adaGangguan || '-') +
          buildDetailKV('Jenis Gangguan', String(rep.adaGangguan || '').toLowerCase() === 'tidak' ? '-' : (rep.jenisGangguan || '-')) +
        '</div>' +
        '<div class="weekly-detail-text"><span>Uraian Hasil Kegiatan</span><p>' + escapeHtml(rep.uraian || '-') + '</p></div>' +
        '<div class="weekly-detail-text"><span>Tindak Lanjut</span><p>' + escapeHtml(String(rep.adaGangguan || '').toLowerCase() === 'tidak' ? '-' : (rep.tindakLanjut || '-')) + '</p></div>' +
      '</div>' +
      '<aside class="weekly-detail-side">' + photoHtml +
        '<button type="button" class="weekly-detail-map" onclick="focusCurrentWeeklyDetailMap()">Buka Titik di Peta</button>' +
      '</aside>' +
    '</div>';
  modal.classList.add('open');
}

function previewCurrentWeeklyDetailPhoto() {
  var rep = WEEKLY_REPORT_STATE.currentDetailReport;
  if (!rep || !rep.fotoUrl) return;
  LB_STATE.photos = [normalizeImageUrl(rep.fotoUrl)];
  LB_STATE.dates = [rep.fotoTanggal || rep.waktu || ''];
  LB_STATE.years = [''];
  LB_STATE.angles = ['Laporan Mingguan'];
  LB_STATE.idx = 0;
  LB_STATE.year = '';
  LB_STATE.context = 'weekly';
  LB_STATE.locName = '<strong style="color:#fff;">Laporan Mingguan</strong><br/>' + escapeHtml(rep.lokasi || '');
  document.getElementById('photo-lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshLightbox();
}

function previewWeeklyPhotoById(reportId) {
  var idx = (WEEKLY_REPORT_STATE.reports || []).findIndex(function(rep) { return String(rep.id || '') === String(reportId || ''); });
  if (idx >= 0) previewWeeklyPhoto(idx);
}

function focusCurrentWeeklyDetailMap() {
  focusReportOnMapFromObject(WEEKLY_REPORT_STATE.currentDetailReport || {});
}

function previewWeeklyPhoto(idx) {
  var rep = (WEEKLY_REPORT_STATE.reports || [])[idx];
  if (!rep || !rep.fotoUrl) return;
  LB_STATE.photos = [normalizeImageUrl(rep.fotoUrl)];
  LB_STATE.dates = [rep.fotoTanggal || rep.waktu || ''];
  LB_STATE.years = [''];
  LB_STATE.angles = ['Laporan Mingguan'];
  LB_STATE.idx = 0;
  LB_STATE.year = '';
  LB_STATE.context = 'weekly';
  LB_STATE.locName = '<strong style="color:#fff;">Laporan Mingguan</strong><br/>' + escapeHtml(rep.lokasi || '');
  document.getElementById('photo-lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshLightbox();
}

function deleteWeeklyReport(reportId) {
  if (!reportId || !confirm('Hapus laporan mingguan ini?')) return;
  var r = WEEKLY_REPORT_STATE.row || PHOTO_GALLERY.row;
  var context = WEEKLY_REPORT_STATE.context || PHOTO_GALLERY.context || 'juna';
  var coords = getPhotoCoords(r);
  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify(withAuthPayload({
      action: 'deleteWeeklyReport',
      reportId: reportId,
      category: getBackendCategoryForContext(context),
      lat: coords.lat,
      lng: coords.lng,
      rowIndex: r._row_idx || '',
      sheetGid: r._source_gid || '',
      featureId: r['ID'] || r.featureId || ''
    }))
  }).then(function(res) { return res.json(); }).then(function(res) {
    if (!res.success) throw new Error(res.error || 'Gagal menghapus laporan.');
    invalidateWeeklyMonitorCache();
    showToast('Laporan mingguan dihapus.', 'success');
    loadWeeklyReportsForMarker(true);
  }).catch(function(err) { showToast(err.message || String(err), 'error'); });
}

var wrBibitEl = document.getElementById('wr-bibit');
if (wrBibitEl) wrBibitEl.addEventListener('input', function() {
  var totalEl = document.getElementById('wr-total-bibit');
  if (totalEl) totalEl.value = calculateWeeklyTotalBibit(this.value);
  saveWeeklyFormDraft();
});
var wrBibitKurangEl = document.getElementById('wr-bibit-kurang');
if (wrBibitKurangEl) wrBibitKurangEl.addEventListener('input', function() {
  var totalEl = document.getElementById('wr-total-bibit-kurang');
  if (totalEl) totalEl.value = calculateWeeklyTotalBibit(this.value);
  saveWeeklyFormDraft();
});
var wrWaktuEl = document.getElementById('wr-waktu');
if (wrWaktuEl) wrWaktuEl.addEventListener('input', function() { this.dataset.userEdited = '1'; saveWeeklyFormDraft(); });
var wrFotoEl = document.getElementById('wr-foto');
if (wrFotoEl) {
  wrFotoEl.addEventListener('click', function(e) {
    var input = this;
    if (!shouldRequireWeeklyGpsBeforeCamera()) {
      if (!input.files || !input.files.length) renderWeeklyPhotoMetaStatus(null, null);
      WEEKLY_REPORT_STATE.allowCameraOpen = false;
      return;
    }
    if (WEEKLY_REPORT_STATE.allowCameraOpen || isFreshWeeklyGpsMeta(WEEKLY_REPORT_STATE.currentGpsMeta)) {
      WEEKLY_REPORT_STATE.allowCameraOpen = false;
      return;
    }
    e.preventDefault();
    input.disabled = true;
    renderWeeklyPhotoMetaStatus(null, null, 'Mengambil koordinat GPS lokasi perangkat sebelum kamera dibuka...');
    requestWeeklyGpsLocation(false).then(function() {
      input.disabled = false;
      WEEKLY_REPORT_STATE.allowCameraOpen = true;
      showToast('GPS lokasi siap. Kamera akan dibuka; jika belum muncul, klik tombol foto sekali lagi.', 'success');
      setTimeout(function() {
        try { input.click(); } catch (clickErr) {}
        setTimeout(function() { WEEKLY_REPORT_STATE.allowCameraOpen = false; }, 500);
      }, 50);
    }).catch(function(err) {
      input.disabled = false;
      WEEKLY_REPORT_STATE.allowCameraOpen = false;
      var msg = err && (err.message || String(err));
      renderWeeklyPhotoMetaStatus(null, null, msg);
      showToast(msg, 'error');
    });
  });
  wrFotoEl.addEventListener('change', function() {
    var f = this.files && this.files[0];
    if (!f) {
      WEEKLY_REPORT_STATE.currentPhotoMeta = null;
      renderWeeklyPhotoMetaStatus(null, null);
      return;
    }
    getWeeklyPhotoFinalMetadata(f).then(function(meta) {
      WEEKLY_REPORT_STATE.currentPhotoMeta = meta;
      var missing = [];
      if (!meta.date) missing.push('tanggal waktu');
      if (meta.lat == null || meta.lng == null) missing.push('koordinat latitude/longitude');
      var metaError = missing.length ? 'Metadata tidak lengkap: ' + missing.join(', ') : '';
      if (meta.gpsError && meta.source !== 'GPS lokasi perangkat' && missing.length) {
        metaError += (metaError ? '. ' : '') + meta.gpsError;
      } else if (meta.gpsError && meta.source !== 'GPS lokasi perangkat') {
        meta.note = 'GPS live belum tersedia, sistem memakai metadata kamera/EXIF yang lengkap.';
      }
      renderWeeklyPhotoMetaStatus(meta, f, metaError);
      saveWeeklyFormDraft();
    });
  });
}
var wrAdaGangguanEl = document.getElementById('wr-ada-gangguan');
if (wrAdaGangguanEl) wrAdaGangguanEl.addEventListener('change', function() { updateWeeklyGangguanVisibility(); saveWeeklyFormDraft(); });
var wrKebutuhanBibitEl = document.getElementById('wr-kebutuhan-bibit');
if (wrKebutuhanBibitEl) wrKebutuhanBibitEl.addEventListener('change', function() { updateWeeklyKebutuhanBibitVisibility(); saveWeeklyFormDraft(); });
var wrFormEl = document.getElementById('weekly-report-form');
if (wrFormEl) wrFormEl.addEventListener('input', function(e) {
  if (e && e.target && e.target.id === 'wr-foto') return;
  saveWeeklyFormDraft();
});
window.addEventListener('online', function() {
  if (getWeeklyPendingQueue().length) syncPendingWeeklyReports();
});

function canAccessReportMonitor() {
  var user = getCurrentAuthUser();
  return !!(user && user.username && getRoleGroup(user.role) <= 3);
}

function normalizeReportText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function getReportAccessAliases(user) {
  user = user || getCurrentAuthUser();
  var aliases = [];
  function add(v) {
    v = normalizeReportText(v);
    if (v && aliases.indexOf(v) === -1) aliases.push(v);
  }
  add(getCurrentUserUnit(user));
  add(user && user.unit);
  var role = normalizeReportText(user && user.role);
  var m = role.match(/kepala cdk ([1-9])/);
  if (m) {
    var roman = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'][parseInt(m[1], 10)];
    add('cdk ' + m[1]);
    add('cdk wilayah ' + m[1]);
    add('cdk wilayah ' + roman);
  }
  if (role.indexOf('tahura') !== -1) add('tahura');
  if (role.indexOf('spth') !== -1) add('spth');
  if (role.indexOf('pphh') !== -1) add('pphh');
  return aliases;
}

function getReportRowUnit(row) {
  if (!row) return '';
  if (row.unit) return String(row.unit).trim();
  if (row._sourceRow) return getReportRowUnit(row._sourceRow);
  return String(row['Unit Kerja'] || row['UNIT KERJA'] || row._cdk || getBinaanField(row, 'unit') || '').trim();
}

function getReportFilterUnitValue(row) {
  var unit = getReportRowUnit(row);
  return getCDKExtended(unit) || unit;
}

function getReportRowPerson(row) {
  if (!row) return '';
  if (row.pembina || row.pelaksana || row.namaPegawai) return String(row.pembina || row.pelaksana || row.namaPegawai).trim();
  if (row._sourceRow) return getReportRowPerson(row._sourceRow);
  return String(getBinaanField(row, 'pembina') || row['Nama Lengkap'] || row['Nama Petugas'] || row['Nama'] || row['NAMA'] || '').trim();
}

function getReportRowKabupaten(row) {
  if (!row) return '';
  if (row.kabupaten) return String(row.kabupaten).trim();
  if (row._sourceRow) return getReportRowKabupaten(row._sourceRow);
  return String(getBinaanKabupaten(row) || row['Kabupaten/Kota'] || row['Kabupaten'] || row._kab || '').trim();
}

function getReportRowKegiatan(row) {
  if (!row) return '';
  if (row.kegiatan) return String(row.kegiatan).trim();
  if (row._sourceRow) return getReportRowKegiatan(row._sourceRow);
  return String(getBinaanField(row, 'kegiatan') || row['Kegiatan'] || row['Tahapan Kegiatan'] || row['Kategori Lojuna'] || '').trim();
}

function getReportRowTahun(row) {
  if (!row) return '';
  if (row.tahun) return String(row.tahun).trim();
  if (row._sourceRow) return getReportRowTahun(row._sourceRow);
  return String(getBinaanField(row, 'tahun') || row['Tahun Kegiatan'] || row['Tahun'] || '').trim();
}

function getReportRowLuas(row) {
  if (!row) return 0;
  if (row.luasHa != null) return parseLuasHa(row.luasHa);
  if (row.luas) return parseLuasHa(row.luas);
  if (row._sourceRow) return getReportRowLuas(row._sourceRow);
  return parseLuasHa(getBinaanLuasRaw(row) || row['Luas (Ha)'] || row['Luas_Ha'] || row['Luas'] || row['Luas Rencana Penanaman  (Ha)'] || row['Luas Rencana Penanaman (Ha)']);
}

function getReportDateTs(row) {
  return parseExifDate((row && (row.waktu || row.fotoTanggal || row.updatedAt)) || '');
}

function parseReportWeekValue(value) {
  var s = String(value || '').trim();
  if (!s) return null;
  var year = 0;
  var week = 0;
  var m = s.match(/^(\d{4})\s*[-\/]?\s*[WMm]?\s*(\d{1,2})$/);
  if (!m) m = s.match(/^(\d{4}).*?(\d{1,2})$/);
  if (m) {
    year = parseInt(m[1], 10);
    week = parseInt(m[2], 10);
  } else {
    m = s.match(/^(\d{1,2})$/);
    if (m) {
      year = new Date().getFullYear();
      week = parseInt(m[1], 10);
    }
  }
  if (!year || !week || week < 1 || week > 53) return null;
  return { year: year, week: week, label: year + '-M' + String(week).padStart(2, '0') };
}

function normalizeReportWeekInput(el) {
  if (!el) return;
  var parsed = parseReportWeekValue(el.value);
  if (parsed && el.type === 'week') {
    el.value = parsed.year + '-W' + String(parsed.week).padStart(2, '0');
  } else {
    el.value = parsed ? parsed.label : '';
  }
  onReportFilterChanged();
}

function getWeekInputRange(value, endOfWeek) {
  var parsed = parseReportWeekValue(value);
  if (!parsed) return 0;
  var jan4 = new Date(parsed.year, 0, 4);
  var jan4Dow = (jan4.getDay() + 6) % 7;
  var monday = new Date(parsed.year, 0, 4 - jan4Dow + ((parsed.week - 1) * 7));
  monday.setHours(endOfWeek ? 23 : 0, endOfWeek ? 59 : 0, endOfWeek ? 59 : 0, endOfWeek ? 999 : 0);
  if (endOfWeek) monday.setDate(monday.getDate() + 6);
  return monday.getTime();
}

function userCanSeeReportRow(row) {
  var user = getCurrentAuthUser();
  if (!user || !user.username) return false;
  if (getRoleGroup(user.role) <= 2) return true;
  var aliases = getReportAccessAliases(user);
  if (!aliases.length) return true;
  var rowUnit = normalizeReportText(getReportRowUnit(row));
  var rowLoc = normalizeReportText(row && (row.lokasi || row.nama || ''));
  return aliases.some(function(userUnit) {
    return !!(rowUnit && (rowUnit.indexOf(userUnit) !== -1 || userUnit.indexOf(rowUnit) !== -1)) || rowLoc.indexOf(userUnit) !== -1;
  });
}

function applyNonAdminMapDefaults_() {
  var clusterToggle = document.getElementById('toggle-cluster');
  if (clusterToggle && clusterToggle.checked) clusterToggle.checked = false;
  CLUSTER_ENABLED = false;

  AUTOPOLY_ENABLED = false;
  var autoLeg = document.getElementById('leg-autopoly');
  if (autoLeg) autoLeg.classList.add('leg-hidden');
}

function onReportFilterChanged() {
  WEEKLY_REPORT_STATE.monitorPage = 1;
  renderReportMonitorTable();
}

function openReportMonitor(type) {
  closeReportMenu();
  if (!canAccessReportMonitor()) {
    showToast('Akses laporan hanya untuk pimpinan dan admin.', 'error');
    return;
  }
  WEEKLY_REPORT_STATE.monitorType = type || 'weekly';
  WEEKLY_REPORT_STATE.monitorPage = 1;
  var modal = document.getElementById('report-monitor-modal');
  var title = document.getElementById('report-monitor-title');
  if (title) title.textContent = type === 'monthly' ? 'Monitoring Laporan 3 Bulanan' : 'Monitoring Laporan Mingguan';
  var weekStart = document.getElementById('report-week-start-filter');
  var weekEnd = document.getElementById('report-week-end-filter');
  var exportBtn = document.getElementById('report-weekly-export-btn');
  if (weekStart) weekStart.style.display = type === 'monthly' ? 'none' : '';
  if (weekEnd) weekEnd.style.display = type === 'monthly' ? 'none' : '';
  if (exportBtn) exportBtn.style.display = type === 'monthly' ? 'none' : '';
  if (type === 'monthly') {
    if (weekStart) weekStart.value = '';
    if (weekEnd) weekEnd.value = '';
  }
  if (modal) modal.classList.add('open');
  reloadReportMonitor(false);
}

function closeReportMonitor() {
  var modal = document.getElementById('report-monitor-modal');
  if (modal) modal.classList.remove('open');
}

function reloadReportMonitor(force) {
  if (WEEKLY_REPORT_STATE.monitorType === 'monthly') {
    WEEKLY_REPORT_STATE.monitorRows = buildMonthlyReportRows();
    WEEKLY_REPORT_STATE.monitorPage = 1;
    populateReportFilterOptions();
    renderReportMonitorTable();
    return;
  }
  var body = document.getElementById('report-monitor-body');
  var now = Date.now();
  var hasFreshCache = !force && (WEEKLY_REPORT_STATE.monitorRows || []).length && (now - (WEEKLY_REPORT_STATE.weeklyMonitorFetchedAt || 0) < (WEEKLY_REPORT_STATE.weeklyMonitorCacheMs || 0));
  if (hasFreshCache) {
    WEEKLY_REPORT_STATE.monitorPage = 1;
    populateReportFilterOptions();
    renderReportMonitorTable();
    return;
  }
  var renderedLocal = false;
  var localRows = buildWeeklyReportRowsFromLocalData();
  if (localRows.length) {
    WEEKLY_REPORT_STATE.monitorRows = localRows;
    WEEKLY_REPORT_STATE.monitorPage = 1;
    populateReportFilterOptions();
    renderReportMonitorTable();
    renderedLocal = true;
  }
  if (WEEKLY_REPORT_STATE.weeklyMonitorLoading) return;
  WEEKLY_REPORT_STATE.weeklyMonitorLoading = true;
  if (body && !renderedLocal) body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;">Memuat laporan mingguan...</td></tr>';
  var weeklyUrl = GAS_WEB_APP_URL + '?action=getAllWeeklyReports' + (force ? '&refresh=1' : '');
  fetch(appendAuthParam(weeklyUrl)).then(function(res) { return res.json(); }).then(function(data) {
    if (!data.success) throw new Error(data.error || 'Gagal memuat laporan mingguan.');
    WEEKLY_REPORT_STATE.monitorRows = (data.reports || []).map(enrichWeeklyMonitorRow);
    WEEKLY_REPORT_STATE.weeklyMonitorFetchedAt = Date.now();
    WEEKLY_REPORT_STATE.monitorPage = 1;
    populateReportFilterOptions();
    renderReportMonitorTable();
  }).catch(function(err) {
    if (body && !renderedLocal) body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#c62828;">' + getFriendlyBackendErrorMessage(err) + '</td></tr>';
    else if (renderedLocal && typeof showToast === 'function') showToast('Data lokal ditampilkan. Sinkronisasi laporan mingguan belum selesai.', 'warning');
  }).finally(function() {
    WEEKLY_REPORT_STATE.weeklyMonitorLoading = false;
  });
}

function enrichWeeklyMonitorRow(rep) {
  rep = rep || {};
  var coords = { lat: toFloat(rep.lat || rep.latitude), lng: toFloat(rep.lng || rep.longitude) };
  var match = null;
  if ((!rep.unit || !rep.pembina || !coords.lat || !coords.lng) && rep.category) {
    match = findReportSourceRow(rep);
  }
  if (match) {
    rep._sourceContext = match.context;
    rep._sourceRow = match.row;
    rep.unit = rep.unit || getReportRowUnit(match.row);
    rep.pembina = rep.pembina || getReportRowPerson(match.row);
    rep.jabatan = rep.jabatan || getBinaanField(match.row, 'jabatan') || match.row['Nama Jabatan'] || match.row['Jabatan'] || '';
    rep.luas = rep.luas || (getReportRowLuas(match.row) ? formatLuasHa(getReportRowLuas(match.row)) + ' Ha' : '');
    rep.kabupaten = rep.kabupaten || getReportRowKabupaten(match.row);
    rep.kecamatan = rep.kecamatan || getBinaanField(match.row, 'kecamatan') || match.row['Kecamatan'] || '';
    rep.desa = rep.desa || getBinaanField(match.row, 'desa') || match.row['Desa/Kelurahan'] || match.row['Desa/ Kelurahan'] || match.row['Desa'] || '';
    rep.kegiatan = rep.kegiatan || getReportRowKegiatan(match.row);
    rep.tahun = rep.tahun || getReportRowTahun(match.row);
    rep.dpl = rep.dpl || match.row['DPL'] || match.row['MDPL'] || '';
    var c = getPhotoCoords(match.row);
    rep.lat = rep.lat || c.lat;
    rep.lng = rep.lng || c.lng;
  }
  rep.unit = rep.unit || '';
  rep.pembina = rep.pembina || rep.pelaksana || '';
  return rep;
}

function findReportSourceRow(rep) {
  var rows = getAllMarkerRowsForReports();
  var targetCat = String(rep.category || '');
  var targetRowIndex = String(rep.rowIndex || '');
  var targetFeature = String(rep.featureId || '');
  var loc = normalizeReportText(rep.lokasi || rep.nama || '');
  var lat = toFloat(rep.lat || rep.latitude);
  var lng = toFloat(rep.lng || rep.longitude);
  for (var i = 0; i < rows.length; i++) {
    var item = rows[i];
    var r = item.row;
    if (targetCat && item.category !== targetCat) continue;
    if (targetRowIndex && String(r._row_idx || '') === targetRowIndex) return item;
    if (targetFeature && String(r['ID'] || r.featureId || '') === targetFeature) return item;
    var c = getPhotoCoords(r);
    if (lat && lng && Math.abs((c.lat || 0) - lat) < 0.00001 && Math.abs((c.lng || 0) - lng) < 0.00001) return item;
    if (loc && normalizeReportText(getWeeklyLocationLabel(r, item.context)).indexOf(loc.substring(0, 24)) !== -1) return item;
  }
  return null;
}

function getAllMarkerRowsForReports() {
  return [].concat(
    (DATA.pjl || []).map(function(r) { return { context: 'pjl', category: 'pjl', label: POP_LABEL.pjl, row: r }; }),
    (DATA.persemaian || []).map(function(r) { return { context: 'per', category: 'persemaian', label: POP_LABEL.per, row: r }; }),
    (DATA.pegawai || []).map(function(r) { return { context: 'pegawai', category: 'pegawai', label: POP_LABEL.peg, row: r }; }),
    (DATA.pegawaiBinaan || []).map(function(r) { return { context: 'pegawaiBinaan', category: 'pegawaibinaanformatsistem', label: POP_LABEL.pegb, row: r }; }),
    (DATA.jumat || []).map(function(r) { return { context: 'juna', category: 'juna', label: POP_LABEL.jum, row: r }; }),
    (POLYGON_FEATURES_CACHE || []).map(function(r) { return { context: 'polygon', category: 'polygon', label: 'Titik Kegiatan', row: r }; })
  );
}

function weeklyPipeAt(row, key, idx) {
  if (!row || row[key] == null || row[key] === '') return '';
  var parts = String(row[key]).split('|').map(function(s) { return String(s || '').trim(); });
  return parts[idx] || '';
}

function buildWeeklyReportRowsFromLocalData() {
  var rows = [];
  getAllMarkerRowsForReports().forEach(function(item) {
    var r = item.row;
    if (!r) return;
    var ids = String(r.LM_ID || r['LM_ID'] || '').split('|').map(function(s) { return String(s || '').trim(); });
    if (!ids.length) return;
    var coords = getPhotoCoords(r);
    var luasHa = getReportRowLuas(r);
    var administrasi = [
      getReportRowKabupaten(r),
      getBinaanField(r, 'kecamatan') || r['Kecamatan'] || '',
      getBinaanField(r, 'desa') || r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || ''
    ].filter(Boolean).join(', ');

    ids.forEach(function(id, idx) {
      if (!id) return;
      var category = weeklyPipeAt(r, 'LM_Kategori', idx) || item.category;
      rows.push({
        id: id,
        category: category,
        kategoriLabel: item.label,
        nama: getWeeklyLocationLabel(r, item.context),
        pelaksana: weeklyPipeAt(r, 'LM_Pelaksana', idx),
        lokasi: weeklyPipeAt(r, 'LM_Lokasi', idx) || getWeeklyLocationLabel(r, item.context),
        waktu: weeklyPipeAt(r, 'LM_Waktu', idx),
        tutupan: weeklyPipeAt(r, 'LM_Tutupan', idx),
        kegiatanVegetatif: weeklyPipeAt(r, 'LM_Kegiatan_Vegetatif', idx),
        jenisJumlahBibit: weeklyPipeAt(r, 'LM_Jenis_Jumlah_Bibit', idx),
        totalBibit: weeklyPipeAt(r, 'LM_Total_Bibit', idx),
        tinggiTanaman: weeklyPipeAt(r, 'LM_Tinggi_Tanaman_CM', idx),
        sumberBibit: weeklyPipeAt(r, 'LM_Sumber_Bibit', idx),
        kebutuhanBibitCukup: weeklyPipeAt(r, 'LM_Kebutuhan_Bibit_Cukup', idx),
        kekuranganJenisJumlahBibit: weeklyPipeAt(r, 'LM_Kekurangan_Jenis_Jumlah_Bibit', idx),
        kekuranganTotalBibit: weeklyPipeAt(r, 'LM_Kekurangan_Total_Bibit', idx),
        kekuranganTinggiTanaman: weeklyPipeAt(r, 'LM_Kekurangan_Tinggi_Tanaman_CM', idx),
        kekuranganSumberBibit: weeklyPipeAt(r, 'LM_Kekurangan_Sumber_Bibit', idx),
        kondisiTanaman: weeklyPipeAt(r, 'LM_Kondisi_Tanaman', idx),
        kegiatanMonitoring: weeklyPipeAt(r, 'LM_Kegiatan_Monitoring', idx),
        uraian: weeklyPipeAt(r, 'LM_Uraian', idx),
        adaGangguan: weeklyPipeAt(r, 'LM_Ada_Gangguan', idx),
        jenisGangguan: weeklyPipeAt(r, 'LM_Jenis_Gangguan', idx),
        tindakLanjut: weeklyPipeAt(r, 'LM_Tindak_Lanjut', idx),
        fotoUrl: weeklyPipeAt(r, 'LM_Foto_URL', idx),
        fotoTanggal: weeklyPipeAt(r, 'LM_Foto_Tanggal', idx),
        fotoLat: weeklyPipeAt(r, 'LM_Foto_Latitude', idx),
        fotoLng: weeklyPipeAt(r, 'LM_Foto_Longitude', idx),
        fotoFileId: weeklyPipeAt(r, 'LM_Foto_FileID', idx),
        updatedAt: weeklyPipeAt(r, 'LM_UpdatedAt', idx),
        updatedBy: weeklyPipeAt(r, 'LM_UpdatedBy', idx),
        rowIndex: r._row_idx || '',
        sheetGid: r._source_gid || '',
        lat: coords.lat,
        lng: coords.lng,
        unit: getReportRowUnit(r),
        pembina: getReportRowPerson(r) || weeklyPipeAt(r, 'LM_Pelaksana', idx),
        jabatan: getBinaanField(r, 'jabatan') || r['Nama Jabatan'] || r['Jabatan'] || '',
        kegiatan: getReportRowKegiatan(r),
        tahun: getReportRowTahun(r),
        kabupaten: getReportRowKabupaten(r),
        kecamatan: getBinaanField(r, 'kecamatan') || r['Kecamatan'] || '',
        desa: getBinaanField(r, 'desa') || r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || '',
        dpl: r.DPL || r.MDPL || '',
        administrasi: administrasi,
        luasHa: luasHa,
        luas: luasHa ? formatLuasHa(luasHa) + ' Ha' : (getBinaanLuasRaw(r) || ''),
        _sourceContext: item.context,
        _sourceRow: r
      });
    });
  });
  rows.sort(function(a, b) { return (parseExifDate(b.waktu) || parseExifDate(b.updatedAt) || 0) - (parseExifDate(a.waktu) || parseExifDate(a.updatedAt) || 0); });
  return rows;
}

function buildMonthlyReportRows() {
  var rows = [];
  getAllMarkerRowsForReports().forEach(function(item) {
    var r = item.row;
    if (!r) return;
    var coords = getPhotoCoords(r);
    var unit = getReportRowUnit(r);
    var person = getReportRowPerson(r);
    var luasHa = getReportRowLuas(r);
    PHOTO_YEARS.forEach(function(year) {
      var photos = getRowPhotos(r, year);
      var dates = getRowDates(r, year);
      var angles = getRowAngles(r, year);
      photos.forEach(function(url, idx) {
        var monAt = function(key) {
          var arr = parsePipeField(r[key + '_' + year] || '');
          return arr[idx] || '';
        };
        rows.push({
          category: item.category,
          kategoriLabel: item.label,
          nama: getWeeklyLocationLabel(r, item.context),
          unit: unit,
          pembina: person,
          kegiatan: getBinaanField(r, 'kegiatan') || r['Kegiatan'] || item.label,
          tahun: getReportRowTahun(r) || year,
          kabupaten: getReportRowKabupaten(r),
          kecamatan: getBinaanField(r, 'kecamatan') || r['Kecamatan'] || '',
          desa: getBinaanField(r, 'desa') || r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || '',
          dpl: r['DPL'] || r['MDPL'] || '',
          administrasi: [
            getBinaanKabupaten(r) || r['Kabupaten/Kota'] || r['Kabupaten'] || r._kab || '',
            getBinaanField(r, 'kecamatan') || r['Kecamatan'] || '',
            getBinaanField(r, 'desa') || r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || r['Desa'] || ''
          ].filter(Boolean).join(', '),
          luasHa: luasHa,
          luas: luasHa ? formatLuasHa(luasHa) + ' Ha' : '',
          lat: coords.lat,
          lng: coords.lng,
          waktu: dates[idx] || '',
          tahun: year,
          sudut: normalizePhotoAngle(angles[idx]),
          fotoUrl: url,
          tutupan: monAt('Tutupan'),
          jenis: monAt('Jenis'),
          kerapatan: monAt('Kerapatan'),
          lereng: monAt('Lereng'),
          pengelolaan: monAt('Pengelolaan'),
          usulan: monAt('Usulan'),
          _sourceContext: item.context,
          _sourceRow: r
        });
      });
    });
  });
  rows.sort(function(a, b) { return (parseExifDate(b.waktu) || 0) - (parseExifDate(a.waktu) || 0); });
  return rows;
}

function passesReportFilters(row) {
  var q = String((document.getElementById('report-search') || {}).value || '').toLowerCase();
  var cat = String((document.getElementById('report-category-filter') || {}).value || '');
  var unit = String((document.getElementById('report-unit-filter') || {}).value || '');
  var person = String((document.getElementById('report-person-filter') || {}).value || '');
  var kab = String((document.getElementById('report-kab-filter') || {}).value || '');
  var kegiatan = String((document.getElementById('report-kegiatan-filter') || {}).value || '');
  var tahun = String((document.getElementById('report-year-filter') || {}).value || '');
  var start = parseDateInputToTs(String((document.getElementById('report-start-filter') || {}).value || ''), false);
  var end = parseDateInputToTs(String((document.getElementById('report-end-filter') || {}).value || ''), true);
  var weekStart = getWeekInputRange(String((document.getElementById('report-week-start-filter') || {}).value || ''), false);
  var weekEnd = getWeekInputRange(String((document.getElementById('report-week-end-filter') || {}).value || ''), true);
  if (!userCanSeeReportRow(row)) return false;
  if (cat && row.category !== cat) return false;
  if (unit && getReportFilterUnitValue(row) !== unit) return false;
  if (person && getReportRowPerson(row) !== person) return false;
  if (kab && getReportRowKabupaten(row) !== kab) return false;
  if (kegiatan && getReportRowKegiatan(row) !== kegiatan) return false;
  if (tahun && getReportRowTahun(row) !== tahun) return false;
  var text = [row.kategoriLabel, row.nama, row.unit, row.pembina, row.pelaksana, row.lokasi, row.uraian, row.sudut, row.tahun, row.kegiatan, row.administrasi, row.kabupaten, row.kecamatan, row.desa].join(' ').toLowerCase();
  if (q && text.indexOf(q) === -1) return false;
  var ts = getReportDateTs(row);
  if ((start || end || weekStart || weekEnd) && !ts) return false;
  if (start && ts < start) return false;
  if (end && ts > end) return false;
  if (weekStart && ts < weekStart) return false;
  if (weekEnd && ts > weekEnd) return false;
  return true;
}

function populateReportFilterOptions() {
  var rows = (WEEKLY_REPORT_STATE.monitorRows || []).filter(userCanSeeReportRow);
  var unitEl = document.getElementById('report-unit-filter');
  var personEl = document.getElementById('report-person-filter');
  var kabEl = document.getElementById('report-kab-filter');
  var kegiatanEl = document.getElementById('report-kegiatan-filter');
  var yearEl = document.getElementById('report-year-filter');
  function fill(el, values, label) {
    if (!el) return;
    var current = el.value;
    var html = '<option value="">' + label + '</option>';
    values.sort(function(a, b) { return a.localeCompare(b); }).forEach(function(v) {
      html += '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>';
    });
    el.innerHTML = html;
    if (values.indexOf(current) !== -1) el.value = current;
  }
  var units = {};
  var persons = {};
  var kabs = {};
  var kegiatans = {};
  var years = {};
  rows.forEach(function(r) {
    var u = getReportFilterUnitValue(r);
    var p = getReportRowPerson(r);
    var k = getReportRowKabupaten(r);
    var kg = getReportRowKegiatan(r);
    var y = getReportRowTahun(r);
    if (u) units[u] = true;
    if (p) persons[p] = true;
    if (k) kabs[k] = true;
    if (kg) kegiatans[kg] = true;
    if (y) years[y] = true;
  });
  fill(unitEl, Object.keys(units), 'Semua Unit');
  fill(personEl, Object.keys(persons), 'Semua Pembina/Pegawai');
  fill(kabEl, Object.keys(kabs), 'Semua Kabupaten');
  fill(kegiatanEl, Object.keys(kegiatans), 'Semua Kegiatan');
  fill(yearEl, Object.keys(years), 'Semua Tahun');
}

function changeReportMonitorPage(delta) {
  WEEKLY_REPORT_STATE.monitorPage = (WEEKLY_REPORT_STATE.monitorPage || 1) + delta;
  renderReportMonitorTable();
}

function renderReportPagination(totalRows, totalPages) {
  var pager = document.getElementById('report-pagination');
  if (!pager) return;
  if (totalRows <= (WEEKLY_REPORT_STATE.monitorPageSize || 10)) {
    pager.innerHTML = '';
    return;
  }
  pager.innerHTML = '<button type="button" onclick="changeReportMonitorPage(-1)" ' + (WEEKLY_REPORT_STATE.monitorPage <= 1 ? 'disabled' : '') + '>Sebelumnya</button>' +
    '<span>Halaman ' + WEEKLY_REPORT_STATE.monitorPage + ' dari ' + totalPages + ' (' + totalRows + ' laporan)</span>' +
    '<button type="button" onclick="changeReportMonitorPage(1)" ' + (WEEKLY_REPORT_STATE.monitorPage >= totalPages ? 'disabled' : '') + '>Berikutnya</button>';
}

function focusReportOnMapFromObject(row) {
  if (!row) return;
  closeReportMonitor();
  closeWeeklyDetailModal();
  var lat = toFloat(row.lat || row.latitude);
  var lng = toFloat(row.lng || row.longitude);
  if ((!lat || !lng) && row._sourceRow) {
    var c = getPhotoCoords(row._sourceRow);
    lat = c.lat;
    lng = c.lng;
  }
  var source = row._sourceRow ? { row: row._sourceRow, context: row._sourceContext } : findReportSourceRow(row);
  if (lat && lng && typeof mapObj !== 'undefined') {
    mapObj.setView([lat, lng], 16);
    highlightMarker(lat, lng, source ? source.context : (row.category || 'jum'));
  }
  if (source && source.row) {
    var drawerType = source.context === 'juna' ? 'jum' : (source.context === 'pegawaiBinaan' ? 'pegb' : source.context);
    openDrawer(drawerType, source.row);
    setTimeout(function() { showMarkerReportPanel(WEEKLY_REPORT_STATE.monitorType === 'monthly' ? 'monthly' : 'weekly', source.context); }, 120);
  }
}

function renderReportMonitorTable() {
  var type = WEEKLY_REPORT_STATE.monitorType || 'weekly';
  var rows = (WEEKLY_REPORT_STATE.monitorRows || []).filter(passesReportFilters);
  var head = document.getElementById('report-monitor-head');
  var body = document.getElementById('report-monitor-body');
  var kpi = document.getElementById('report-kpi-row');
  if (!head || !body) return;
  var pageSize = WEEKLY_REPORT_STATE.monitorPageSize || 10;
  var totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  WEEKLY_REPORT_STATE.monitorPage = Math.max(1, Math.min(totalPages, WEEKLY_REPORT_STATE.monitorPage || 1));
  var start = (WEEKLY_REPORT_STATE.monitorPage - 1) * pageSize;
  var pageRows = rows.slice(start, start + pageSize);
  if (kpi) {
    var cats = {};
    rows.forEach(function(r) { cats[r.category || r.kategoriLabel || '-'] = true; });
    var totalLuas = rows.reduce(function(sum, r) { return sum + (getReportRowLuas(r) || 0); }, 0);
    kpi.innerHTML = '<div><strong>' + rows.length + '</strong><span>Total Laporan</span></div>' +
      '<div><strong>' + Object.keys(cats).length + '</strong><span>Kategori Aktif</span></div>' +
      '<div><strong>' + (totalLuas ? formatLuasHa(totalLuas) + ' Ha' : '-') + '</strong><span>Akumulasi Luasan</span></div>' +
      '<div><strong>' + (type === 'monthly' ? 'Bulanan' : 'Mingguan') + '</strong><span>Mode</span></div>';
  }
  if (type === 'monthly') {
    head.innerHTML = '<tr><th>Kegiatan</th><th>Lokasi & Administratif</th><th>Unit</th><th>Pembina/Pegawai</th><th>Luas</th><th>Foto</th><th>Tanggal</th><th>Aksi</th></tr>';
    body.innerHTML = pageRows.length ? pageRows.map(function(r, localIdx) {
      var idx = start + localIdx;
      return '<tr><td>' + escapeHtml(r.kategoriLabel || '-') + '<br><span class="report-muted">' + escapeHtml(r.kegiatan || '') + '</span></td><td>' + escapeHtml(r.nama || '-') + '<br><span class="report-muted">' + escapeHtml(r.administrasi || coordText(r.lat, r.lng) || '-') + '</span></td><td>' + escapeHtml(r.unit || '-') + '</td><td>' + escapeHtml(r.pembina || '-') + '</td><td>' + escapeHtml(r.luas || '-') + '</td><td>' + escapeHtml(displayPhotoAngle(r.sudut)) + '</td><td>' + escapeHtml(formatDateIndo(r.waktu) || '-') + '</td><td class="report-actions"><button type="button" onclick="previewMonthlyMonitorPhoto(' + idx + ')">Foto</button><button type="button" onclick="focusReportOnMapFromObject(WEEKLY_REPORT_STATE.detailRows[' + idx + '])">Peta</button></td></tr>';
    }).join('') : '<tr><td colspan="8" style="text-align:center;padding:24px;">Tidak ada data laporan 3 bulanan.</td></tr>';
  } else {
    head.innerHTML = '<tr><th>Kegiatan</th><th>Pelaksana</th><th>Unit</th><th>Lokasi</th><th>Waktu</th><th>Tutupan</th><th>Gangguan</th><th>Ringkasan</th><th>Aksi</th></tr>';
    body.innerHTML = pageRows.length ? pageRows.map(function(r, localIdx) {
      var idx = start + localIdx;
      return '<tr><td>' + escapeHtml(r.kategoriLabel || r.category || '-') + '</td><td>' + escapeHtml(r.pelaksana || '-') + '</td><td>' + escapeHtml(r.unit || '-') + '</td><td>' + escapeHtml(r.lokasi || r.nama || '-') + '<br><span class="report-muted">' + escapeHtml(r.luas || '') + '</span></td><td>' + escapeHtml(formatDateIndo(r.waktu) || '-') + '</td><td>' + escapeHtml(r.tutupan || '-') + '</td><td>' + escapeHtml(r.adaGangguan || '-') + '</td><td>' + escapeHtml((r.uraian || '-').substring(0, 95)) + '</td><td class="report-actions"><button type="button" onclick="openWeeklyDetailModal(WEEKLY_REPORT_STATE.detailRows[' + idx + '])">Detail</button><button type="button" onclick="focusReportOnMapFromObject(WEEKLY_REPORT_STATE.detailRows[' + idx + '])">Peta</button></td></tr>';
    }).join('') : '<tr><td colspan="9" style="text-align:center;padding:24px;">Tidak ada data laporan mingguan.</td></tr>';
  }
  WEEKLY_REPORT_STATE.detailRows = rows;
  renderReportPagination(rows.length, totalPages);
}

function getFilteredReportMonitorRows() {
  return (WEEKLY_REPORT_STATE.monitorRows || []).filter(passesReportFilters);
}

function weeklyExportValue(row, key, fallback) {
  if (!row) return fallback || '';
  var value = row[key];
  if ((value === null || value === undefined || value === '') && row._sourceRow) value = row._sourceRow[key];
  return value === null || value === undefined ? (fallback || '') : value;
}

function exportWeeklyBinaanReports() {
  if ((WEEKLY_REPORT_STATE.monitorType || 'weekly') !== 'weekly') {
    showToast('Export ini khusus Laporan Mingguan.', 'error');
    return;
  }
  var rows = getFilteredReportMonitorRows().filter(function(r) {
    return String(r.category || '').toLowerCase() === 'pegawaibinaanformatsistem';
  });
  if (!rows.length) {
    showToast('Tidak ada data hutan binaan pada filter laporan mingguan saat ini.', 'warning');
    return;
  }
  var header = [
    'No', 'Kabupaten', 'Kecamatan', 'Desa', 'Longitude', 'Latitude',
    'Kegiatan', 'Tahun Kegiatan', 'Luas (Ha)', 'Pembina/Pengampu',
    'Unit Kerja', 'Jabatan', 'DPL',
    'LM_ID', 'LM_Kategori', 'LM_Pelaksana', 'LM_Lokasi', 'LM_Waktu',
    'LM_Tutupan', 'LM_Kegiatan_Vegetatif', 'LM_Jenis_Jumlah_Bibit', 'LM_Total_Bibit',
    'LM_Tinggi_Tanaman_CM', 'LM_Sumber_Bibit', 'LM_Kebutuhan_Bibit_Cukup',
    'LM_Kekurangan_Jenis_Jumlah_Bibit', 'LM_Kekurangan_Total_Bibit',
    'LM_Kekurangan_Tinggi_Tanaman_CM', 'LM_Kekurangan_Sumber_Bibit',
    'LM_Kondisi_Tanaman', 'LM_Kegiatan_Monitoring', 'LM_Uraian',
    'LM_Ada_Gangguan', 'LM_Jenis_Gangguan', 'LM_Tindak_Lanjut',
    'LM_Foto_URL', 'LM_Foto_Tanggal', 'LM_Foto_Latitude', 'LM_Foto_Longitude',
    'LM_Foto_FileID', 'LM_UpdatedAt', 'LM_UpdatedBy'
  ];
  var aoa = [header];
  rows.forEach(function(r, idx) {
    var lat = weeklyExportValue(r, 'lat') || weeklyExportValue(r, 'latitude');
    var lng = weeklyExportValue(r, 'lng') || weeklyExportValue(r, 'longitude');
    aoa.push([
      idx + 1,
      getReportRowKabupaten(r),
      weeklyExportValue(r, 'kecamatan') || getBinaanField(r._sourceRow, 'kecamatan'),
      weeklyExportValue(r, 'desa') || getBinaanField(r._sourceRow, 'desa'),
      lng,
      lat,
      getReportRowKegiatan(r),
      getReportRowTahun(r),
      weeklyExportValue(r, 'luas') || (getReportRowLuas(r) ? formatLuasHa(getReportRowLuas(r)) : ''),
      getReportRowPerson(r),
      getReportRowUnit(r),
      weeklyExportValue(r, 'jabatan') || getBinaanField(r._sourceRow, 'jabatan'),
      weeklyExportValue(r, 'dpl') || weeklyExportValue(r, 'DPL'),
      r.id || '',
      r.kategoriLabel || r.category || '',
      r.pelaksana || '',
      r.lokasi || '',
      normalizeExportDateIndo(r.waktu),
      r.tutupan || '',
      r.kegiatanVegetatif || '',
      r.jenisJumlahBibit || '',
      r.totalBibit || '',
      r.tinggiTanaman || '',
      r.sumberBibit || '',
      r.kebutuhanBibitCukup || '',
      r.kekuranganJenisJumlahBibit || '',
      r.kekuranganTotalBibit || '',
      r.kekuranganTinggiTanaman || '',
      r.kekuranganSumberBibit || '',
      r.kondisiTanaman || '',
      r.kegiatanMonitoring || '',
      r.uraian || '',
      r.adaGangguan || '',
      r.jenisGangguan || '',
      r.tindakLanjut || '',
      r.fotoUrl || '',
      normalizeExportDateIndo(r.fotoTanggal),
      r.fotoLat || '',
      r.fotoLng || '',
      r.fotoFileId || '',
      normalizeExportDateIndo(r.updatedAt),
      r.updatedBy || ''
    ]);
  });
  var ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = header.map(function(h) {
    var w = Math.max(10, Math.min(34, String(h).length + 4));
    return { wch: w };
  });
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: header.length - 1 } }) };
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Mingguan');
  XLSX.writeFile(wb, 'Export_Laporan_Mingguan_Hutan_Binaan.xlsx');
  showToast('Export laporan mingguan hutan binaan berhasil dibuat.', 'success');
}

function previewMonthlyMonitorPhoto(idx) {
  var row = (WEEKLY_REPORT_STATE.detailRows || [])[idx];
  if (!row || !row.fotoUrl) return;
  LB_STATE.photos = [normalizeImageUrl(row.fotoUrl)];
  LB_STATE.dates = [row.waktu || ''];
  LB_STATE.years = [row.tahun || ''];
  LB_STATE.angles = [row.sudut || ''];
  LB_STATE.idx = 0;
  LB_STATE.year = row.tahun || '';
  LB_STATE.context = 'single';
  LB_STATE.locName = '<strong style="color:#fff;">' + escapeHtml(row.nama || row.kategoriLabel || 'Laporan 3 Bulanan') + '</strong><br/>' + escapeHtml(row.unit || '');
  document.getElementById('photo-lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshLightbox();
}
/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â² POLYGON KEGIATAN & POHON MARKER
   ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

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
var POLYGON_FEATURES_CACHE = [];
var POLYGON_FEATURE_RENDER_TOKEN = 0;

mapObj.addLayer(POLYGON_AREA_LAYER);
mapObj.addLayer(POHON_MARKER_LAYER);

var SVG_POHON_KECIL = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.5" fill="#00e676"/></svg>';
var ICON_POHON = L.divIcon({ html: SVG_POHON_KECIL, iconSize: [16, 16], iconAnchor: [8, 8], className: 'leaflet-marker-lightweight' });

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
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control custom-draw-control');
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
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin membuat polygon kegiatan.', 'error');
    return;
  }
  drawPohonMarker.disable();
  drawGarisKegiatan.disable();
  drawPolygonKegiatan.enable();
  showToast('Silakan gambar area polygon di peta. Klik titik awal untuk selesai.', 'info');
}

function startDrawGarisKegiatan() {
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin membuat garis kegiatan.', 'error');
    return;
  }
  drawPohonMarker.disable();
  drawPolygonKegiatan.disable();
  drawGarisKegiatan.enable();
  showToast('Silakan gambar garis (jalur/greenbelt) di peta. Klik ganda titik terakhir untuk selesai.', 'info');
}

function startDrawPohonMarker() {
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin membuat marker kegiatan.', 'error');
    return;
  }
  drawPolygonKegiatan.disable();
  drawGarisKegiatan.disable();
  drawPohonMarker.enable();
  showToast('Silakan klik lokasi di peta untuk menaruh marker pohon kegiatan.', 'info');
}

// Listen to Draw Created Event
mapObj.on(L.Draw.Event.CREATED, function (e) {
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin menyimpan hasil gambar.', 'error');
    return;
  }
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
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin membuat kegiatan.', 'error');
    return;
  }
  document.getElementById('polygon-kegiatan-modal').classList.add('open');
  document.getElementById('pg-feature-id').value = '';
  document.getElementById('pg-type').value = type;
  document.getElementById('pg-geojson').value = geojsonObj ? JSON.stringify(geojsonObj) : '';
  
  // Auto-fill
  document.getElementById('pg-lat').value = lat;
  document.getElementById('pg-lng').value = lng;
  document.getElementById('pg-kabupaten').value = getKab(lat, lng) || '';
  requestDplForRow({}, lat, lng);
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
                  '<button type="button" class="btn-icon" onclick="removeBibitRow(this)" style="color:red; font-size:16px; border:none; background:none;">ÃƒÂ¢Ã…â€œÃ¢â‚¬â€œ</button>';
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
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin menghapus kegiatan.', 'error');
    return;
  }
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
      closeDrawer();
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
  if (!canManageSpatialData()) {
    showToast('Akun ini tidak memiliki izin menyimpan kegiatan.', 'error');
    return;
  }
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
  var dplKey = getDplCacheKey(payload.latitude, payload.longitude);
  if (dplKey && DPL_CACHE.hasOwnProperty(dplKey)) {
    payload.dpl = DPL_CACHE[dplKey];
    payload.status_dpl = getDplCategory(DPL_CACHE[dplKey]).label;
  }
  
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
  if (typeof fetchSpatialFileList === 'function' && getAuthToken()) {
    fetchSpatialFileList();
  }
  fetchPolygonFeatures();
}

function fetchPolygonFeatures() {
  fetch(appendAuthParam(GAS_WEB_APP_URL + '?action=getPolygonFeatures'))
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      POLYGON_FEATURES_CACHE = Array.isArray(data.features) ? data.features : [];
      renderPolygonFeatures(POLYGON_FEATURES_CACHE);
    }
  })
  .catch(err => console.error(err));
}

function rerenderPolygonFeaturesFromCache() {
  if (Array.isArray(POLYGON_FEATURES_CACHE) && POLYGON_FEATURES_CACHE.length) {
    renderPolygonFeatures(POLYGON_FEATURES_CACHE);
  }
}

function getPolygonFeatureCdk(feat) {
  return getCDKExtended(feat && (feat.CDK_Wilayah || feat['CDK Wilayah'] || feat.cdk_wilayah || feat.Unit_Kerja || feat['Unit Kerja'] || '')) || '';
}

function polygonFeaturePoint(feat) {
  var lat = toFloat(feat && feat.Latitude);
  var lng = toFloat(feat && feat.Longitude);
  return lat && lng ? { lat: lat, lng: lng } : null;
}

function polygonFeatureMatchesBinaanMeta(feat, activeBinaanPoints) {
  if (!feat || !activeBinaanPoints || !activeBinaanPoints.length) return false;
  var fPoint = polygonFeaturePoint(feat);
  var fKab = String(feat.Kabupaten || '').trim().toLowerCase();
  var fKec = String(feat.Kecamatan || '').trim().toLowerCase();
  var fDesa = String(feat.Desa_Blok || feat.Desa || '').trim().toLowerCase();

  return activeBinaanPoints.some(function(pt) {
    var row = pt.row || {};
    if (fPoint && typeof turf !== 'undefined') {
      try {
        var dist = turf.distance(turf.point([fPoint.lng, fPoint.lat]), turf.point([pt.lng, pt.lat]), { units: 'kilometers' });
        if (dist <= 0.25) return true;
      } catch (e) {}
    }

    var bKab = String(getBinaanKabupaten(row) || '').trim().toLowerCase();
    var bKec = String(getBinaanField(row, 'kecamatan') || '').trim().toLowerCase();
    var bDesa = String(getBinaanField(row, 'desa') || '').trim().toLowerCase();
    if (fDesa && bDesa && fDesa === bDesa && (!fKec || !bKec || fKec === bKec)) return true;
    if (fKec && bKec && fKec === bKec && (!fKab || !bKab || fKab === bKab)) return true;
    if (fKab && bKab && fKab === bKab && activeBinaanPoints.length === 1) return true;
    return false;
  });
}

function polygonFeaturePassesMapFilters(feat, activeBinaanPoints, hasBinaanScope) {
  if (!feat) return false;
  var featCdk = getPolygonFeatureCdk(feat);
  if (FILTER.cdk && FILTER.cdk.length > 0 && featCdk && FILTER.cdk.indexOf(featCdk) === -1) return false;
  if (FILTER.kab && FILTER.kab.length > 0 && !filterHasValue(FILTER.kab, feat.Kabupaten || '')) return false;

  var user = typeof getStoredAuthUser === 'function' ? getStoredAuthUser() : null;
  var group = getRoleGroup(user ? user.role : null);
  if (user && user.username && group >= 3) {
    var userCdk = getCDKExtended(getCurrentUserUnit(user));
    if (userCdk && featCdk && userCdk !== featCdk) return false;
  }

  if (!hasBinaanScope) return true;
  if (!activeBinaanPoints.length) return false;
  if (feat.GeoJSON_FileID || feat.GeoJSON_URL) return true;
  return polygonFeatureMatchesBinaanMeta(feat, activeBinaanPoints);
}

function renderPolygonFeatures(features) {
  // Debug cepat biar bisa cek apakah data polygon memang ter-load dan bisa dirender.
  // (Tidak mengganggu UX karena hanya tampil toast singkat saat render dipanggil.)
  try {
    showToast('Memuat polygon/kegiatan & titik/pohon: ' + (features ? features.length : 0) + ' item...', false);
  } catch(e) {}

  var renderToken = Date.now();
  POLYGON_FEATURE_RENDER_TOKEN = renderToken;
  var activeBinaanPoints = getActiveBinaanSpatialPoints();
  var hasBinaanScope = hasActiveBinaanSpatialScope();

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
    if (!polygonFeaturePassesMapFilters(feat, activeBinaanPoints, hasBinaanScope)) return;

    var lat = toFloat(feat.Latitude);
    var lng = toFloat(feat.Longitude);
    if (lat && lng && getRowDplValue(feat) === null) requestDplForRow(feat, lat, lng);

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
        var mkHoverHtml = buildFeatureHoverTooltip(feat, 'point');
        if (mkHoverHtml) mk.bindTooltip(mkHoverHtml, {sticky: true, direction: 'top', opacity: 0.95, className: 'feature-hover-tooltip'});
        mk.featureData = feat;
        mk.on('click', function() { openDrawer('polygon_kegiatan', feat); });
        POHON_MARKER_LAYER.addLayer(mk);
      }
      return;
    }

    // Jika lat/lng valid, tampilkan marker placeholder dulu agar user lihat titiknya
    if (lat && lng && (!hasBinaanScope || !hasGeo || polygonFeatureMatchesBinaanMeta(feat, activeBinaanPoints))) {
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
          if (POLYGON_FEATURE_RENDER_TOKEN !== renderToken) return;
          if (!res || !res.success || !res.geojson) return;

          var renderGeoJSON = res.geojson;
          if (hasBinaanScope) {
            renderGeoJSON = filterSpatialGeoJSONByPoints(res.geojson, activeBinaanPoints);
            if (!renderGeoJSON.features.length) {
              clearLayersForFeatureId(featId);
              return;
            }
          }

          // Jika ternyata geojson adalah Point/Multiple points, render jadi marker, bukan polygon/line.
          var typeGeo = detectGeoType(renderGeoJSON);
          var isPoint = (typeGeo === 'Point' || typeGeo === 'MultiPoint');

          // Hapus placeholder marker lama utk featureId ini agar tidak dobel
          clearLayersForFeatureId(featId);

          if (isPoint) {
            // render point -> marker pohon cluster (atau layer polygon area)
            var pointLayer = L.geoJSON(renderGeoJSON, {
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
            addPolygonOrLineLayer(renderGeoJSON, feat, lat, lng, pop);
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













