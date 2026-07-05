// ==============================================================================
// 🌲 BACKEND WEB APP: GEOHUTAN JABAR (GOOGLE APPS SCRIPT)
// ==============================================================================
// PENTING: Ganti SPREADSHEET_ID di bawah ini dengan ID Spreadsheet Anda!
// ID ada di URL spreadsheet: https://docs.google.com/spreadsheets/d/ID_ADA_DISINI/edit
// ==============================================================================

var SPREADSHEET_ID = "14jmMYMOY6vl2nIdbZdO-wahixn1yN3LTLqwI-19RNtY";
var JUNA_SPREADSHEET_ID = "1p7-7pSKtNCc58eC-tXJsXNKk3QSSswI68Gl6fNsZhSE";
var UPLOAD_FOLDER_NAME = "GeoHutan_Uploads";
var SPATIAL_FOLDER_ID = "1YJGN6B0mGblMuSWLOTjgWQv9CQe9rfYr";
var SPATIAL_SHEET_NAME = "Data_Spasial";
var ACCESS_SPREADSHEET_ID = "1UvYIHbYTMqXiTVn-T7A0Ph0ekecsDkkHUdIVbjeOorE";
var ACCESS_SHEET_NAME = "Users_Akses";
var AUTH_CACHE_PREFIX = "geohutan_auth_";
var AUTH_ATTEMPT_PREFIX = "geohutan_attempt_";
var AUTH_TOKEN_TTL_SECONDS = 21600;

var ACCESS_HEADERS_ = [
  "Username",
  "PasswordHash",
  "NamaLengkap",
  "Jabatan",
  "Role",
  "Aktif",
  "LastLogin",
  "UpdatedAt",
];

var DEFAULT_ACCESS_USERS_ = [
  {
    username: "superadmingis",
    password: "Mastertrees751#",
    nama: "Super Admin GIS",
    jabatan: "Super Administrator",
    role: "admin",
  },
  {
    username: "kadishutjabar",
    password: "d15hutgis751",
    nama: "Kepala Dinas Kehutanan Provinsi Jawa Barat",
    jabatan: "Kepala Dinas",
    role: "admin",
  },
  {
    username: "KPDAS",
    password: "d15hutgis751",
    nama: "Kepala Bidang PDAS",
    jabatan: "Kepala Bidang PDAS",
    role: "user",
  },
  {
    username: "KPKSDAE",
    password: "d15hutgis751",
    nama: "Kepala Bidang PKSDAE",
    jabatan: "Kepala Bidang PKSDAE",
    role: "user",
  },
  {
    username: "KPPKH",
    password: "d15hutgis751",
    nama: "Kepala Bidang PPKH",
    jabatan: "Kepala Bidang PPKH",
    role: "user",
  },
  {
    username: "KBUPM",
    password: "d15hutgis751",
    nama: "Kepala Bidang BUPM",
    jabatan: "Kepala Bidang BUPM",
    role: "user",
  },
];

/** Folder Google Drive PJL per tahun linimasa */
var PJL_DRIVE_FOLDERS = {
  "2026": "13hX-UoxyNB5BZWTNKQ9IbmMru0-7CZ2s",
  "2027": "1B3aSMrmrEODaPNF6k4e5Rkz1WaIMGCa1",
  "2028": "1qOgMrvOjEDypalpfFqigI5SQ7tjNULTB",
  "2029": "1G0Gdau3ZFrlFwPBNPW3m0t1ERUjoVJwW",
  "2030": "18r-LQyXOWlyfHwZJ3R9O31m1NQCNEqb8",
};

// ─── Helper: Ambil atau buat folder upload ───
function getOrCreateFolder_(folderName) {
  if (!folderName || folderName.length === 0) {
    folderName = UPLOAD_FOLDER_NAME;
  }
  var iter = DriveApp.getFoldersByName(folderName);
  if (iter.hasNext()) {
    return iter.next();
  }
  return DriveApp.createFolder(folderName);
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function formatDateForSheet_(dateObj) {
  var d = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function normalizeUploadDate_(value) {
  if (!value) return formatDateForSheet_(new Date());
  if (value instanceof Date) return formatDateForSheet_(value);

  var s = String(value).trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    return ("0" + m[1]).slice(-2) + "/" + ("0" + m[2]).slice(-2) + "/" + m[3] +
      (m[4] ? " " + ("0" + m[4]).slice(-2) + ":" + m[5] : "");
  }

  m = s.match(/^(\d{4})[-:](\d{2})[-:](\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (m) {
    return m[3] + "/" + m[2] + "/" + m[1] +
      (m[4] ? " " + ("0" + m[4]).slice(-2) + ":" + m[5] : "");
  }

  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return formatDateForSheet_(parsed);
  return formatDateForSheet_(new Date());
}

function sha256Hex_(value) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ""),
    Utilities.Charset.UTF_8,
  );
  return bytes
    .map(function (b) {
      var v = b < 0 ? b + 256 : b;
      return ("0" + v.toString(16)).slice(-2);
    })
    .join("");
}

function getOrCreateAccessSheet_() {
  var ss = SpreadsheetApp.openById(ACCESS_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(ACCESS_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(ACCESS_SHEET_NAME);

  var lastCol = sheet.getLastColumn();
  if (lastCol < ACCESS_HEADERS_.length) {
    sheet.getRange(1, 1, 1, ACCESS_HEADERS_.length).setValues([ACCESS_HEADERS_]);
  }

  var data = sheet.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) existing[String(data[i][0]).toLowerCase()] = true;
  }

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  DEFAULT_ACCESS_USERS_.forEach(function (u) {
    if (!existing[String(u.username).toLowerCase()]) {
      sheet.appendRow([
        u.username,
        sha256Hex_(u.password),
        u.nama,
        u.jabatan,
        u.role,
        true,
        "",
        now,
      ]);
    }
  });
  return sheet;
}

function getAccessRows_() {
  var sheet = getOrCreateAccessSheet_();
  var data = sheet.getDataRange().getValues();
  return { sheet: sheet, rows: data };
}

function findAccessUser_(username) {
  var lookup = String(username || "").trim().toLowerCase();
  var ctx = getAccessRows_();
  for (var i = 1; i < ctx.rows.length; i++) {
    if (String(ctx.rows[i][0] || "").trim().toLowerCase() === lookup) {
      return { sheet: ctx.sheet, rowIndex: i + 1, row: ctx.rows[i] };
    }
  }
  return null;
}

function isActiveUserRow_(row) {
  var active = row[5];
  return active === true || String(active).toLowerCase() === "true" || String(active) === "1";
}

function validateCredentialInput_(username, password) {
  username = String(username || "").trim();
  password = String(password || "");
  if (!/^[A-Za-z0-9._-]{4,40}$/.test(username)) {
    throw new Error("Username harus 4-40 karakter dan hanya huruf, angka, titik, garis bawah, atau strip.");
  }
  if (password.length < 8 || password.length > 72) {
    throw new Error("Password harus 8-72 karakter.");
  }
}

function issueAuthToken_(username) {
  var token = Utilities.getUuid() + "." + Utilities.getUuid();
  CacheService.getScriptCache().put(AUTH_CACHE_PREFIX + token, username, AUTH_TOKEN_TTL_SECONDS);
  return token;
}

function verifyAuthToken_(token) {
  token = String(token || "");
  if (!token) return "";
  return CacheService.getScriptCache().get(AUTH_CACHE_PREFIX + token) || "";
}

function requireAuth_(payload) {
  var token = payload && (payload.authToken || payload.token);
  var username = verifyAuthToken_(token);
  if (!username) throw new Error("Sesi login tidak valid atau sudah kedaluwarsa.");
  return username;
}

function loginAccessUser_(data) {
  var username = String(data.username || "").trim();
  var password = String(data.password || "");
  validateCredentialInput_(username, password);

  var attemptKey = AUTH_ATTEMPT_PREFIX + username.toLowerCase();
  var cache = CacheService.getScriptCache();
  var attempts = Number(cache.get(attemptKey) || 0);
  if (attempts >= 8) {
    return jsonOutput_({ success: false, error: "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi." });
  }

  var user = findAccessUser_(username);
  var hash = sha256Hex_(password);
  if (!user || !isActiveUserRow_(user.row) || String(user.row[1]) !== hash) {
    cache.put(attemptKey, String(attempts + 1), 600);
    return jsonOutput_({ success: false, error: "Username atau password tidak sesuai." });
  }

  cache.remove(attemptKey);
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  user.sheet.getRange(user.rowIndex, 7).setValue(now);
  var token = issueAuthToken_(String(user.row[0]));
  return jsonOutput_({
    success: true,
    token: token,
    expiresIn: AUTH_TOKEN_TTL_SECONDS,
    user: {
      username: String(user.row[0]),
      nama: String(user.row[2] || ""),
      jabatan: String(user.row[3] || ""),
      role: String(user.row[4] || "user"),
      lastLogin: now,
    },
  });
}

function changeAccessCredentials_(data) {
  var oldUsername = String(data.oldUsername || "").trim();
  var oldPassword = String(data.oldPassword || "");
  var newUsername = String(data.newUsername || "").trim();
  var newPassword = String(data.newPassword || "");
  validateCredentialInput_(oldUsername, oldPassword);
  validateCredentialInput_(newUsername, newPassword);

  var user = findAccessUser_(oldUsername);
  if (!user || !isActiveUserRow_(user.row) || String(user.row[1]) !== sha256Hex_(oldPassword)) {
    return jsonOutput_({ success: false, error: "Username atau password lama tidak sesuai." });
  }

  var existing = findAccessUser_(newUsername);
  if (existing && existing.rowIndex !== user.rowIndex) {
    return jsonOutput_({ success: false, error: "Username baru sudah digunakan akun lain." });
  }

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  user.sheet.getRange(user.rowIndex, 1, 1, 8).setValues([[
    newUsername,
    sha256Hex_(newPassword),
    user.row[2],
    user.row[3],
    user.row[4],
    true,
    user.row[6],
    now,
  ]]);
  return jsonOutput_({ success: true, message: "Username dan password berhasil diperbarui." });
}

// ─── Helper: Cari sheet Juna (bukan tab CDK PJL) yang punya kolom Foto_2026 ───
function findSheetWithColumns_(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = String(sheets[i].getName());
    if (/^CDK\d+_FORMATSISTEM$/i.test(sheetName)) continue;
    var lastCol = sheets[i].getLastColumn();
    if (lastCol === 0) continue;
    var head = sheets[i].getRange(1, 1, 1, lastCol).getValues()[0];
    for (var j = 0; j < head.length; j++) {
      if (String(head[j]).trim() === "Foto_2026") return sheets[i];
    }
  }
  return null;
}

// ─── Helper: Indeks kolom koordinat (Juna / PJL) ───
function findCoordColumnIndices_(headers) {
  var yIdx = -1,
    xIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).trim().toLowerCase();
    if (
      yIdx === -1 &&
      hdr.indexOf("titik koordinat") !== -1 &&
      (hdr.indexOf("(y)") !== -1 || hdr.indexOf(" y)") !== -1)
    )
      yIdx = h;
    if (
      xIdx === -1 &&
      hdr.indexOf("titik koordinat") !== -1 &&
      (hdr.indexOf("(x)") !== -1 || hdr.indexOf(" x)") !== -1)
    )
      xIdx = h;
  }
  return { yIdx: yIdx, xIdx: xIdx };
}

function getSpreadsheetIdForCategory_(category) {
  return category === "juna" ? JUNA_SPREADSHEET_ID : SPREADSHEET_ID;
}

function getSheetByGid_(ss, gid) {
  if (!gid && gid !== 0) return null;
  var target = String(gid);
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === target) return sheets[i];
  }
  return null;
}

function ensurePhotoColumns_(sheet, year) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var fotoColIdx = -1;
  var tglColIdx = -1;

  for (var h = 0; h < headers.length; h++) {
    if (String(headers[h]).trim() === "Foto_" + year) fotoColIdx = h;
    if (String(headers[h]).trim() === "Tanggal_" + year) tglColIdx = h;
  }

  if (fotoColIdx === -1) {
    fotoColIdx = lastCol;
    sheet.getRange(1, fotoColIdx + 1).setValue("Foto_" + year);
    lastCol++;
  }

  if (tglColIdx === -1) {
    tglColIdx = lastCol;
    sheet.getRange(1, tglColIdx + 1).setValue("Tanggal_" + year);
  }

  return { fotoColIdx: fotoColIdx, tglColIdx: tglColIdx };
}

function normalizePhotoDate_(value) {
  var s = String(value || "").trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2})?$/.test(s)) {
    var parts = s.split(/\s+/);
    var dmy = parts[0].split("/");
    var out = ("0" + dmy[0]).slice(-2) + "/" + ("0" + dmy[1]).slice(-2) + "/" + dmy[2];
    if (parts[1]) out += " " + parts[1];
    return out;
  }
  if (/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{1,2}:\d{2})?/.test(s)) {
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
    return m[3] + "/" + m[2] + "/" + m[1] + (m[4] ? " " + ("0" + m[4]).slice(-2) + ":" + m[5] : "");
  }
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function sheetHasPhotoColumns_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return false;
  var head = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var j = 0; j < head.length; j++) {
    if (String(head[j]).trim() === "Foto_2026") return true;
  }
  return false;
}

/** Cari tab sheet berdasarkan koordinat + kategori (juna | pjl) */
function findSheetByCoordinates_(ss, reqLat, reqLng, category, options) {
  options = options || {};
  var preferredSheet = getSheetByGid_(ss, options.sheetGid);
  var sheets = preferredSheet ? [preferredSheet] : ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (!preferredSheet && !sheetHasPhotoColumns_(sheet)) continue;
    var sheetName = String(sheet.getName());
    var isPjlTab = /^CDK\d+_FORMATSISTEM$/i.test(sheetName);
    if (category === "pjl" && !isPjlTab) continue;
    if (category === "juna" && isPjlTab) continue;

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    var headers = data[0];
    var coords = findCoordColumnIndices_(headers);
    if (coords.yIdx === -1 || coords.xIdx === -1) continue;
    if (preferredSheet && options.rowIndex) return sheet;

    for (var r = 1; r < data.length; r++) {
      var rawLat = String(data[r][coords.yIdx]).replace(",", ".");
      var rawLng = String(data[r][coords.xIdx]).replace(",", ".");
      var sheetLat = parseFloat(rawLat) || 0;
      var sheetLng = parseFloat(rawLng) || 0;
      if (Math.abs(sheetLat - reqLat) < 0.0015 && Math.abs(sheetLng - reqLng) < 0.0015) {
        return sheet;
      }
    }
  }
  return null;
}

function getUploadFolder_(category, year) {
  if (category === "pjl") {
    var folderId = PJL_DRIVE_FOLDERS[String(year)];
    if (!folderId) {
      throw new Error("Folder Drive PJL untuk tahun " + year + " belum dikonfigurasi.");
    }
    return DriveApp.getFolderById(folderId);
  }
  return getOrCreateFolder_("Juna Permanen Tahun " + year);
}

// ─── Helper: Update baris di Spreadsheet berdasarkan koordinat ───
function updateRowData_(sheet, reqLat, reqLng, year, newUrl, newDate, options) {
  options = options || {};
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Cari indeks kolom koordinat (cek berbagai variasi nama header)
  var coordIdx = findCoordColumnIndices_(headers);
  var yIdx = coordIdx.yIdx;
  var xIdx = coordIdx.xIdx;

  var photoCols = ensurePhotoColumns_(sheet, year);
  var fotoColIdx = photoCols.fotoColIdx;
  var tglColIdx = photoCols.tglColIdx;

  if (xIdx === -1 || yIdx === -1) {
    throw new Error(
      "Kolom Titik Koordinat (X) atau (Y) tidak ditemukan di Sheet.",
    );
  }

  function appendToRow_(rowNumber, rowValues) {
    var currentFotos = rowValues[fotoColIdx]
      ? String(rowValues[fotoColIdx]).trim()
      : "";
    var currentTgls = rowValues[tglColIdx]
      ? String(rowValues[tglColIdx]).trim()
      : "";

    var nextFotos = currentFotos ? currentFotos + "|" + newUrl : newUrl;
    var nextTgls = currentTgls ? currentTgls + "|" + newDate : newDate;

    sheet.getRange(rowNumber, fotoColIdx + 1).setValue(nextFotos);
    sheet.getRange(rowNumber, tglColIdx + 1).setValue(nextTgls);
    return true;
  }

  var rowIndex = parseInt(options.rowIndex || 0, 10);
  if (rowIndex && rowIndex >= 2 && rowIndex <= sheet.getLastRow()) {
    var directRow = sheet.getRange(rowIndex, 1, 1, Math.max(sheet.getLastColumn(), tglColIdx + 1)).getValues()[0];
    var dLat = parseFloat(String(directRow[yIdx]).replace(",", ".")) || 0;
    var dLng = parseFloat(String(directRow[xIdx]).replace(",", ".")) || 0;
    if (Math.abs(dLat - reqLat) < 0.0025 && Math.abs(dLng - reqLng) < 0.0025) {
      return appendToRow_(rowIndex, directRow);
    }
  }

  // Cari baris yang cocok berdasarkan koordinat (toleransi pembulatan CSV/Sheet)
  for (var i = 1; i < data.length; i++) {
    var rawLat = String(data[i][yIdx]).replace(",", ".");
    var rawLng = String(data[i][xIdx]).replace(",", ".");
    var sheetLat = parseFloat(rawLat) || 0;
    var sheetLng = parseFloat(rawLng) || 0;

    if (
      Math.abs(sheetLat - reqLat) < 0.0025 &&
      Math.abs(sheetLng - reqLng) < 0.0025
    ) {
      return appendToRow_(i + 1, data[i]);
    }
  }
  throw new Error(
    "Data lokasi tidak ditemukan. Koordinat: " + reqLat + ", " + reqLng,
  );
}

// ═══════════════════════════════════════════════════════════
// Helper: Delete baris di Spreadsheet berdasarkan koordinat
function deleteRowData_(sheet, reqLat, reqLng, year, targetUrl, options) {
  options = options || {};
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Cari indeks kolom koordinat (cek berbagai variasi nama header)
  var coordIdx = findCoordColumnIndices_(headers);
  var yIdx = coordIdx.yIdx;
  var xIdx = coordIdx.xIdx;

  var fotoColIdx = -1,
    tglColIdx = -1;
  for (var h2 = 0; h2 < headers.length; h2++) {
    if (String(headers[h2]).trim() === "Foto_" + year) fotoColIdx = h2;
    if (String(headers[h2]).trim() === "Tanggal_" + year) tglColIdx = h2;
  }

  if (fotoColIdx === -1 || tglColIdx === -1) {
    throw new Error(
      "Kolom Foto_" +
        year +
        " atau Tanggal_" +
        year +
        " tidak ditemukan di Sheet.",
    );
  }
  if (xIdx === -1 || yIdx === -1) {
    throw new Error(
      "Kolom Titik Koordinat (X) atau (Y) tidak ditemukan di Sheet.",
    );
  }

  var startRow = 1;
  var endRow = data.length - 1;
  var rowIndex = parseInt(options.rowIndex || 0, 10);
  if (rowIndex && rowIndex >= 2 && rowIndex <= data.length) {
    startRow = rowIndex - 1;
    endRow = rowIndex - 1;
  }

  // Cari baris yang cocok berdasarkan koordinat (toleransi pembulatan CSV/Sheet)
  for (var i = startRow; i <= endRow; i++) {
    var rawLat = String(data[i][yIdx]).replace(",", ".");
    var rawLng = String(data[i][xIdx]).replace(",", ".");
    var sheetLat = parseFloat(rawLat) || 0;
    var sheetLng = parseFloat(rawLng) || 0;

    if (
      Math.abs(sheetLat - reqLat) < 0.0025 &&
      Math.abs(sheetLng - reqLng) < 0.0025
    ) {
      // MATCH FOUND!
      var currentFotos = data[i][fotoColIdx]
        ? String(data[i][fotoColIdx]).trim()
        : "";
      var currentTgls = data[i][tglColIdx]
        ? String(data[i][tglColIdx]).trim()
        : "";

      var fotosArr = currentFotos
        .split("|")
        .map(function (s) {
          return s.trim();
        })
        .filter(function (s) {
          return s !== "";
        });
      var tglsArr = currentTgls
        .split("|")
        .map(function (s) {
          return s.trim();
        })
        .filter(function (s) {
          return s !== "";
        });

      var targetMatch =
        targetUrl.match(/id=([a-zA-Z0-9_-]+)/) ||
        targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      var targetId = targetMatch ? targetMatch[1] : targetUrl;

      var delIdx = -1;
      for (var j = 0; j < fotosArr.length; j++) {
        var cMatch =
          fotosArr[j].match(/id=([a-zA-Z0-9_-]+)/) ||
          fotosArr[j].match(/\/d\/([a-zA-Z0-9_-]+)/);
        var cId = cMatch ? cMatch[1] : fotosArr[j];
        if (cId === targetId) {
          delIdx = j;
          break;
        }
      }

      if (delIdx !== -1) {
        fotosArr.splice(delIdx, 1);
        if (delIdx < tglsArr.length) {
          tglsArr.splice(delIdx, 1);
        }
        sheet.getRange(i + 1, fotoColIdx + 1).setValue(fotosArr.join("|"));
        sheet.getRange(i + 1, tglColIdx + 1).setValue(tglsArr.join("|"));
        return true;
      } else {
        throw new Error("URL Foto tidak ditemukan di baris ini.");
      }
    }
  }
  throw new Error(
    "Data lokasi tidak ditemukan. Koordinat: " + reqLat + ", " + reqLng,
  );
}

// ═══════════════════════════════════════════════════════════
// Helper: Ambil atau buat sheet Data_Spasial
// ═══════════════════════════════════════════════════════════
var SPATIAL_HEADERS_ = [
  "FileID",
  "Nama",
  "URL_GeoJSON",
  "Diunggah",
  "Ukuran_KB",
  "CDK_Tag",
  "BBox_W",
  "BBox_S",
  "BBox_E",
  "BBox_N",
  "Kategori",
];

function getOrCreateSpatialSheet_(ss) {
  var sheet = ss.getSheetByName(SPATIAL_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SPATIAL_SHEET_NAME);
    sheet.appendRow(SPATIAL_HEADERS_);
  } else {
    ensureSpatialSheetHeaders_(sheet);
  }
  return sheet;
}

function ensureSpatialSheetHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  var headers =
    lastCol > 0
      ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
      : [];

  // Sheet lama mungkin hanya punya 4 kolom (FileID–Diunggah).
  if (lastCol < 6) {
    sheet
      .getRange(1, 5, 1, 2)
      .setValues([["Ukuran_KB", "CDK_Tag"]]);
  }

  // getRange(row, col, numRows, numColumns) — bukan indeks kolom akhir.
  if (!headers[6] || String(headers[6]).indexOf("BBox") === -1) {
    sheet
      .getRange(1, 7, 1, 4)
      .setValues([["BBox_W", "BBox_S", "BBox_E", "BBox_N"]]);
  }

  for (var i = 0; i < SPATIAL_HEADERS_.length; i++) {
    if (String(headers[i] || "").trim() !== SPATIAL_HEADERS_[i]) {
      sheet.getRange(1, i + 1).setValue(SPATIAL_HEADERS_[i]);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  doPost: Menerima request POST dari Dashboard (Upload Foto + Spasial)
// ═══════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === "login") {
      return loginAccessUser_(data);
    }
    if (data.action === "changeCredentials") {
      return changeAccessCredentials_(data);
    }
    if (data.action === "logout") {
      var logoutToken = String(data.authToken || data.token || "");
      if (logoutToken) CacheService.getScriptCache().remove(AUTH_CACHE_PREFIX + logoutToken);
      return jsonOutput_({ success: true });
    }
    if (data.action === "verifySession") {
      var sessionUsername = verifyAuthToken_(data.authToken || data.token);
      if (!sessionUsername) return jsonOutput_({ success: false, error: "Sesi tidak valid." });
      var sessionUser = findAccessUser_(sessionUsername);
      if (!sessionUser || !isActiveUserRow_(sessionUser.row)) {
        return jsonOutput_({ success: false, error: "Akun tidak aktif." });
      }
      return jsonOutput_({
        success: true,
        user: {
          username: String(sessionUser.row[0]),
          nama: String(sessionUser.row[2] || ""),
          jabatan: String(sessionUser.row[3] || ""),
          role: String(sessionUser.row[4] || "user"),
        },
      });
    }

    requireAuth_(data);

    // ─── ACTION: upload foto ───
    if (data.action === "upload") {
      var base64Data = data.base64;
      var mimeType = data.mimeType || "image/jpeg";
      var reqLat = parseFloat(data.lat);
      var reqLng = parseFloat(data.lng);
      var year = String(data.year);
      var date = normalizeUploadDate_(data.date);
      var category = String(data.category || "juna");
      var rowIndex = data.rowIndex ? parseInt(data.rowIndex, 10) : 0;
      var sheetGid = data.sheetGid || "";
      var filename =
        (category === "pjl" ? "PJL_" : "Juna_") +
        year +
        "_" +
        new Date().getTime() +
        ".jpg";

      var ss = SpreadsheetApp.openById(getSpreadsheetIdForCategory_(category));
      var targetSheet = findSheetByCoordinates_(ss, reqLat, reqLng, category, {
        sheetGid: sheetGid,
        rowIndex: rowIndex,
      });
      if (!targetSheet) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error:
              "Tidak menemukan baris lokasi di spreadsheet untuk koordinat " +
              reqLat +
              ", " +
              reqLng +
              " (kategori: " +
              category +
              ").",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var folder = getUploadFolder_(category, year);
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mimeType, filename);
      var file = folder.createFile(blob);

      try {
        file.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK,
          DriveApp.Permission.VIEW,
        );
      } catch (shareErr) {
        Logger.log("Warning sharing: " + shareErr.toString());
      }

      var imgUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
      var writeLock = LockService.getScriptLock();
      try {
        writeLock.waitLock(30000);
        updateRowData_(targetSheet, reqLat, reqLng, year, imgUrl, date, {
          rowIndex: rowIndex,
        });
      } catch (rowErr) {
        try {
          file.setTrashed(true);
        } catch (trashErr) {}
        throw rowErr;
      } finally {
        try {
          writeLock.releaseLock();
        } catch (releaseErr) {}
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          url: imgUrl,
          date: date,
        }),
      ).setMimeType(ContentService.MimeType.JSON);

      // ─── ACTION: delete foto ───
    } else if (data.action === "delete") {
      var reqLatDel = parseFloat(data.lat);
      var reqLngDel = parseFloat(data.lng);
      var yearDel = String(data.year);
      var urlToDelete = String(data.url);
      var categoryDel = String(data.category || "juna");
      var rowIndexDel = data.rowIndex ? parseInt(data.rowIndex, 10) : 0;
      var sheetGidDel = data.sheetGid || "";

      var ssDel = SpreadsheetApp.openById(getSpreadsheetIdForCategory_(categoryDel));
      var targetSheetDel = findSheetByCoordinates_(
        ssDel,
        reqLatDel,
        reqLngDel,
        categoryDel,
        { sheetGid: sheetGidDel, rowIndex: rowIndexDel },
      );
      if (!targetSheetDel) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
          error: "Tidak menemukan tab Sheet yang sesuai untuk koordinat ini.",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var deleteLock = LockService.getScriptLock();
      try {
        deleteLock.waitLock(30000);
        deleteRowData_(
          targetSheetDel,
          reqLatDel,
          reqLngDel,
          yearDel,
          urlToDelete,
          { rowIndex: rowIndexDel },
        );
      } finally {
        try {
          deleteLock.releaseLock();
        } catch (releaseDelErr) {}
      }

      var targetMatch =
        urlToDelete.match(/id=([a-zA-Z0-9_-]+)/) ||
        urlToDelete.match(/\/d\/([a-zA-Z0-9_-]+)/);
      var fileId = targetMatch ? targetMatch[1] : null;

      if (fileId) {
        try {
          var f = DriveApp.getFileById(fileId);
          f.setTrashed(true);
        } catch (delErr) {
          Logger.log("Gagal men-trash file: " + delErr.toString());
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          deletedId: fileId,
        }),
      ).setMimeType(ContentService.MimeType.JSON);

      // ─── ACTION: upload polygon spasial ───
    } else if (data.action === "uploadSpatial") {
      var geoJsonStr = data.geojson;
      var spFileName = String(
        data.filename || "spasial_" + new Date().getTime() + ".geojson",
      );
      // Pastikan ekstensi .geojson
      if (!String(spFileName).toLowerCase().endsWith(".geojson")) {
        spFileName = String(spFileName).replace(/\.[^.]+$/, "") + ".geojson";
      }
      var cdkTag = String(data.cdk_tag || "");
      var kategori = String(data.kategori || "Jaga Leuweung");
      var ssSp = SpreadsheetApp.openById(SPREADSHEET_ID);
      var spFolder = DriveApp.getFolderById(SPATIAL_FOLDER_ID);
      var spBlob = Utilities.newBlob(
        geoJsonStr,
        "application/geo+json",
        spFileName,
      );
      var spFile = spFolder.createFile(spBlob);
      try {
        spFile.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK,
          DriveApp.Permission.VIEW,
        );
      } catch (e) {}
      // Frontend membutuhkan akses via fetch, yang rawan CORS.
      // Jadi kita kirim url berbasis /uc?export=download tetapi untuk render kita
      // akan menghindari fetch langsung (dengan menggunakan geojson langsung saat upload lokal).
      // Untuk jaga-jaga, tetap simpan url ini.
      var spFileUrl =
        "https://drive.google.com/uc?export=download&id=" + spFile.getId();
      var now = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "dd/MM/yyyy HH:mm",
      );
      var sizeKB = Math.round((geoJsonStr.length / 1024) * 10) / 10;
      var spatialSheet = getOrCreateSpatialSheet_(ssSp);
      spatialSheet.appendRow([
        spFile.getId(),
        spFileName,
        spFileUrl,
        now,
        sizeKB,
        cdkTag,
        data.bbox_w || "",
        data.bbox_s || "",
        data.bbox_e || "",
        data.bbox_n || "",
        kategori,
      ]);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          fileId: spFile.getId(),
          url: spFileUrl,
          filename: spFileName,
          uploaded: now,
          sizeKB: sizeKB,
          kategori: kategori,
          bbox: {
            west: data.bbox_w || "",
            south: data.bbox_s || "",
            east: data.bbox_e || "",
            north: data.bbox_n || ""
          },
        }),
      ).setMimeType(ContentService.MimeType.JSON);

      // ─── ACTION: delete polygon spasial ───
    } else if (data.action === "deleteSpatial") {
      var delFileId = String(data.fileId || "");
      if (!delFileId) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: "fileId kosong",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }
      try {
        DriveApp.getFileById(delFileId).setTrashed(true);
      } catch (e) {}
      var ssDelSp = SpreadsheetApp.openById(SPREADSHEET_ID);
      var spSheetDel = getOrCreateSpatialSheet_(ssDelSp);
      var spRows = spSheetDel.getDataRange().getValues();
      for (var ri = 1; ri < spRows.length; ri++) {
        if (String(spRows[ri][0]) === delFileId) {
          spSheetDel.deleteRow(ri + 1);
          break;
        }
      }
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          deletedId: delFileId,
        }),
      ).setMimeType(ContentService.MimeType.JSON);

      // ─── Aksi tidak dikenal ───
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Aksi tidak dikenal: " + (data.action || "kosong"),
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: err.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════
//  doGet: Menerima request GET dari Dashboard (Ekstrak Folder)
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "";
  if (
    action === "getSpatialFiles" ||
    action === "getSpatialGeoJSON" ||
    action === "getFolder"
  ) {
    try {
      requireAuth_(params);
    } catch (authErr) {
      return jsonOutput_({ success: false, error: authErr.toString() });
    }
  }

  if (action === "getSpatialFiles") {
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = getOrCreateSpatialSheet_(ss);
      var rows = sheet.getDataRange().getValues();
      var files = [];
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0]) {
          var fileId = String(rows[i][0]);
          var filename = String(rows[i][1]);
          var url = String(rows[i][2]);
          var uploaded = String(rows[i][3]);
          var sizeKB = rows[i][4];
          var cdkTag = String(rows[i][5] || "");
          var bbox = null;
          if (rows[i][6] && rows[i][7] && rows[i][8] && rows[i][9]) {
            bbox = {
              west: Number(rows[i][6]),
              south: Number(rows[i][7]),
              east: Number(rows[i][8]),
              north: Number(rows[i][9]),
            };
          }
          var kategori = String(rows[i][10] || "Jaga Leuweung");

          files.push({
            fileId: fileId,
            filename: filename,
            url: url,
            uploaded: uploaded,
            sizeKB: sizeKB,
            cdkTag: cdkTag,
            kategori: kategori,
            bbox: bbox,
          });
        }
      }
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, files: files }),
      ).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: err.toString() }),
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === "getSpatialGeoJSON") {
    try {
      var geoFileId = String(params.fileId || "");
      if (!geoFileId) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, error: "fileId kosong" }),
        ).setMimeType(ContentService.MimeType.JSON);
      }
      var geoFile = DriveApp.getFileById(geoFileId);
      var geoContent = geoFile.getBlob().getDataAsString();
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, geojson: JSON.parse(geoContent) }),
      ).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: err.toString() }),
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === "getFolder") {
    try {
      var folderId = params.folderId;
      if (!folderId) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: "folderId tidak disediakan.",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var folder = DriveApp.getFolderById(folderId);
      var files = folder.getFiles();
      var results = [];

      while (files.hasNext()) {
        var f = files.next();
        var mime = f.getMimeType();
        // Hanya ambil file gambar
        if (mime && mime.indexOf("image") !== -1) {
          try {
            f.setSharing(
              DriveApp.Access.ANYONE_WITH_LINK,
              DriveApp.Permission.VIEW,
            );
          } catch (shareErr) {
            // Abaikan jika diblokir
          }
          var d = f.getDateCreated();
          var dStr =
            ("0" + d.getDate()).slice(-2) +
            "/" +
            ("0" + (d.getMonth() + 1)).slice(-2) +
            "/" +
            d.getFullYear();
          results.push({
            url: "https://drive.google.com/uc?export=view&id=" + f.getId(),
            date: dStr,
            rawDate: d.getTime(),
          });
        }
      }

      // Urutkan terbaru ke terlama
      results.sort(function (a, b) {
        return b.rawDate - a.rawDate;
      });

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          files: results,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: err.toString(),
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Default response (health check)
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: "Backend GeoHutan Aktif! Siap menerima API Request.",
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}
