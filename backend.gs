// ==============================================================================
// 🌲 BACKEND WEB APP: GEOHUTAN JABAR (GOOGLE APPS SCRIPT)
// ==============================================================================

/**
 * ⚠️ FUNGSI KHUSUS OTORISASI (JALANKAN FUNGSI INI SEKALI SAJA) ⚠️
 * Pilih fungsi "setupAI" di dropdown atas lalu klik "Jalankan".
 * Ini akan memancing Google memunculkan popup "Tinjau Izin".
 */
function setupAI() {
  UrlFetchApp.fetch("https://www.google.com");
}

var SPREADSHEET_ID = "14jmMYMOY6vl2nIdbZdO-wahixn1yN3LTLqwI-19RNtY";
var JUNA_SPREADSHEET_ID = "1p7-7pSKtNCc58eC-tXJsXNKk3QSSswI68Gl6fNsZhSE";
var PEGAWAI_SPREADSHEET_ID = "1K_rijLYh_sdVmNzSgs7TIdjVslBYeQ31";
var PEGAWAI_SHEET_NAME = "DATAPEGAWAIFORMATSISTEM";

/** Spreadsheet & Sheet Pegawai Wilayah Hutan Binaan */
var PEGAWAI_BINAAN_SPREADSHEET_ID = "1xrl3W7DZs8SsYZIWiLgHYvi_89V7NismK-G9YDu9NdM";
var PEGAWAI_BINAAN_SHEET_NAME = "DATAPEGAWAIBINAANFORMATSISTEM";

var POLYGON_SPREADSHEET_ID = "1z-hF_yyWlsWjgK6Xwu9eypIJZOX9n5l5F87WPYZPnmE";
var POLYGON_SHEET_NAME = "datapolygon_tanam_pelihara";
var POLYGON_PHOTO_FOLDER_ID = "1IqopqD0cu0mE7egxFCHAedBBNXVd-wvI";
var POLYGON_GEOJSON_FOLDER_ID = "1aN0yj7EefSsDzGgHH5w2KW7itsx8lWnj";

var PERSEMAIAN_SPREADSHEET_ID = "1Q4kzpbXWkpDRfzvUeVa2RYnwSba0BMOcv3jAUDh_9lE";

var UPLOAD_FOLDER_NAME = "GeoHutan_Uploads";
var SPATIAL_FOLDER_ID = "1YJGN6B0mGblMuSWLOTjgWQv9CQe9rfYr";
var SPATIAL_SHEET_NAME = "Data_Spasial";
var ACCESS_SPREADSHEET_ID = "1UvYIHbYTMqXiTVn-T7A0Ph0ekecsDkkHUdIVbjeOorE";
var ACCESS_SHEET_NAME = "Users_Akses";
var AUTH_CACHE_PREFIX = "geohutan_auth_";
var AUTH_ATTEMPT_PREFIX = "geohutan_attempt_";
var AUTH_TOKEN_TTL_SECONDS = 21600;
var AUTO_SEED_DEFAULT_ACCESS_USERS_ = false;

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
  "2025": "1ijQeqL5cjI0U2mfgnBZFcrdx-hoZ-ZNf",
  "2026": "13hX-UoxyNB5BZWTNKQ9IbmMru0-7CZ2s",
  "2027": "1B3aSMrmrEODaPNF6k4e5Rkz1WaIMGCa1",
  "2028": "1qOgMrvOjEDypalpfFqigI5SQ7tjNULTB",
  "2029": "1G0Gdau3ZFrlFwPBNPW3m0t1ERUjoVJwW",
  "2030": "18r-LQyXOWlyfHwZJ3R9O31m1NQCNEqb8",
};

/** Folder Google Drive Pegawai per tahun linimasa */
var PEG_DRIVE_FOLDERS = {
  "2025": "1JT1CQVg8TvFV7VZbqP-mncJ-FZ7A0yBA",
  "2026": "1tb6X5GNhuZ1JmQRwxuJ9cxDhLVAP2tLm",
  "2027": "1-D2Nw8fMyFebCYfApSDibk4cAlGvrOCb",
  "2028": "1-MGOwGFAFtHz9lLfQ0vrwCSkAvhSJHgf",
  "2029": "11SutxAecGOm3EhV69sJaAnzWQ6VkMLWj",
  "2030": "1gkI4LM7mGk39wcSEqBUAd5JUR2n7ASlU",
};

/** Folder Google Drive Pegawai Wilayah Hutan Binaan per tahun (sama dengan PEG) */
var PEG_BINAAN_DRIVE_FOLDERS = {
  "2025": "1JT1CQVg8TvFV7VZbqP-mncJ-FZ7A0yBA",
  "2026": "1tb6X5GNhuZ1JmQRwxuJ9cxDhLVAP2tLm",
  "2027": "1-D2Nw8fMyFebCYfApSDibk4cAlGvrOCb",
  "2028": "1-MGOwGFAFtHz9lLfQ0vrwCSkAvhSJHgf",
  "2029": "11SutxAecGOm3EhV69sJaAnzWQ6VkMLWj",
  "2030": "1gkI4LM7mGk39wcSEqBUAd5JUR2n7ASlU",
};

/** Folder Google Drive Persemaian per tahun linimasa */
var PER_DRIVE_FOLDERS = {
  "2025": "1XsIuOvcYW8Cea11SWtEhOu-XHEbCd3Tw",
  "2026": "1HAumKRbvYWPxtWrqP6sTjIFlDJKNLcUO",
  "2027": "11SlYV5g--9IR_KH5mQUSJLhzxTAw2glf",
  "2028": "12zrMKPOZNFeNNfdjV2x-VRcVBbap6w_B",
  "2029": "1q0JByloD7-pnfgkRx5843LHx3nofiSfd",
  "2030": "18DfAI68e71r4Dof4ZB_2KxXu4cwkyLNe",
};

/** Folder Google Drive Juna Permanen per tahun linimasa */
var JUNA_DRIVE_FOLDERS = {
  "2025": "1tGtp8AJmrtV3WHP3ejjm8xFUYlpodyqz",
  "2026": "",
  "2027": "",
  "2028": "",
  "2029": "",
  "2030": "",
};

// ─── Header kolom untuk spreadsheet polygon ───
var POLYGON_HEADERS_ = [
  "ID",
  "CDK_Wilayah",
  "Nama",
  "Kabupaten",
  "Kecamatan",
  "Desa_Blok",
  "Lokasi",
  "Kegiatan",
  "Luas_Ha",
  "Jenis_Bibit",
  "Jumlah_Bibit",
  "Latitude",
  "Longitude",
  "Keterangan",
  "Type",
  "GeoJSON_URL",
  "GeoJSON_FileID",
  "Tanggal_Input",
  "Foto_2025",
  "Tanggal_2025",
  "Foto_2026",
  "Tanggal_2026",
  "Foto_2027",
  "Tanggal_2027",
  "Foto_2028",
  "Tanggal_2028",
  "Foto_2029",
  "Tanggal_2029",
  "Foto_2030",
  "Tanggal_2030"
];

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
  if (AUTO_SEED_DEFAULT_ACCESS_USERS_) {
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
  }
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

function getRoleGroup_(role) {
  var r = String(role || "").toLowerCase().trim().replace(/\s+/g, " ");
  r = r.replace(/\bcdk\s*([1-9])\b/g, "cdk $1");
  var g1 = ["admin", "kadis", "sekdis", "kabid pdas"];
  var g2 = ["kabid ppkh", "kabid bupm", "kabid pksdae"];
  var g3 = [
    "kepala tahura", "kepala spth", "kepala pphh",
    "kepala cdk 1", "kepala cdk 2", "kepala cdk 3", "kepala cdk 4", "kepala cdk 5",
    "kepala cdk 6", "kepala cdk 7", "kepala cdk 8", "kepala cdk 9",
    "pegwai madya", "pegawai madya"
  ];
  if (g1.indexOf(r) !== -1) return 1;
  if (g2.indexOf(r) !== -1) return 2;
  if (g3.indexOf(r) !== -1) return 3;
  return 4;
}

function getAuthContext_(payload) {
  var username = requireAuth_(payload);
  var user = findAccessUser_(username);
  if (!user || !isActiveUserRow_(user.row)) throw new Error("Akun tidak aktif.");
  return {
    username: String(user.row[0] || ""),
    nip: String(user.row[0] || ""),
    role: String(user.row[4] || "user"),
    group: getRoleGroup_(user.row[4])
  };
}

function canUploadCategory_(auth, category) {
  category = String(category || "juna");
  if (!auth) return false;
  if (auth.group === 1) return true;
  if (auth.group === 2) return false;
  if (auth.group === 3) {
    return category === "juna" || category === "pegawai" || category === "pegawaibinaanformatsistem";
  }
  return category === "pegawai" || category === "pegawaibinaanformatsistem";
}

function requireAdminMutation_(auth) {
  if (!auth || auth.group !== 1) throw new Error("Akun ini tidak memiliki izin mengubah data spasial/polygon.");
}

function findNipColumnIndex_(headers) {
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || "").trim().toLowerCase();
    if (h === "nip") return i;
  }
  return -1;
}

function assertOwnRowIfRequired_(headers, rowValues, options) {
  options = options || {};
  if (!options.requireOwnNip) return;
  var nipIdx = findNipColumnIndex_(headers);
  if (nipIdx === -1) throw new Error("Kolom NIP tidak ditemukan untuk validasi hak akses.");
  var rowNip = String(rowValues[nipIdx] || "").trim();
  var authNip = String(options.authNip || "").trim();
  if (!authNip || rowNip !== authNip) {
    throw new Error("Akun ini hanya dapat mengubah data miliknya sendiri.");
  }
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
      nip: String(user.row[0]),
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

// ─── Helper: Indeks kolom koordinat (Juna / PJL / Pegawai) ───
function findCoordColumnIndices_(headers) {
  var yIdx = -1,
    xIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).trim().toLowerCase();
    // Pegawai: latitude / longitude
    if (yIdx === -1 && (hdr === "latitude" || hdr === "lat")) yIdx = h;
    if (xIdx === -1 && (hdr === "longitude" || hdr === "lng" || hdr === "lon")) xIdx = h;
    // Juna/PJL: Titik Koordinat (Y) / (X)
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
  if (category === "juna") return JUNA_SPREADSHEET_ID;
  if (category === "pegawai") return PEGAWAI_SPREADSHEET_ID;
  if (category === "pegawaibinaanformatsistem") return PEGAWAI_BINAAN_SPREADSHEET_ID;
  if (category === "polygon") return POLYGON_SPREADSHEET_ID;
  if (category === "per" || category === "persemaian") return PERSEMAIAN_SPREADSHEET_ID;
  return SPREADSHEET_ID;
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

/** Cari tab sheet berdasarkan koordinat + kategori */
function findSheetByCoordinates_(ss, reqLat, reqLng, category, options) {
  options = options || {};
  var preferredSheet = getSheetByGid_(ss, options.sheetGid);

  // Untuk pegawai: pakai sheet DATAPEGAWAIFORMATSISTEM langsung
  if (category === "pegawai") {
    var pegSheet = ss.getSheetByName(PEGAWAI_SHEET_NAME);
    if (!pegSheet) pegSheet = ss.getSheets()[0];
    return pegSheet;
  }

  // Untuk pegawai binaan: pakai sheet DATAPEGAWAIBINAANFORMATSISTEM langsung
  if (category === "pegawaibinaanformatsistem") {
    var binaanSheet = ss.getSheetByName(PEGAWAI_BINAAN_SHEET_NAME);
    if (!binaanSheet) binaanSheet = ss.getSheets()[0];
    return binaanSheet;
  }

  var sheets = preferredSheet ? [preferredSheet] : ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (!preferredSheet && !sheetHasPhotoColumns_(sheet)) continue;
    var sheetName = String(sheet.getName());
    var isPjlTab = /^CDK\d+_?FORMATSISTEM$/i.test(sheetName);
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
  if (category === "pegawai") {
    var pegFolderId = PEG_DRIVE_FOLDERS[String(year)];
    if (!pegFolderId) {
      throw new Error("Folder Drive Pegawai untuk tahun " + year + " belum dikonfigurasi.");
    }
    return DriveApp.getFolderById(pegFolderId);
  }
  if (category === "pegawaibinaanformatsistem") {
    var binaanFolderId = PEG_BINAAN_DRIVE_FOLDERS[String(year)];
    if (!binaanFolderId) {
      throw new Error("Folder Drive Pegawai Binaan untuk tahun " + year + " belum dikonfigurasi.");
    }
    return DriveApp.getFolderById(binaanFolderId);
  }
  if (category === "polygon") {
    return DriveApp.getFolderById(POLYGON_PHOTO_FOLDER_ID);
  }
  if (category === "per" || category === "persemaian") {
    var perFolderId = PER_DRIVE_FOLDERS[String(year)];
    if (!perFolderId) {
      throw new Error("Folder Drive Persemaian untuk tahun " + year + " belum dikonfigurasi.");
    }
    return DriveApp.getFolderById(perFolderId);
  }
  // Default: Juna Permanen - use JUNA_DRIVE_FOLDERS if configured
  var junaFolderId = JUNA_DRIVE_FOLDERS[String(year)];
  if (junaFolderId) {
    return DriveApp.getFolderById(junaFolderId);
  }
  return getOrCreateFolder_("Juna Permanen Tahun " + year);
}

// ─── Helper: Update baris di Spreadsheet berdasarkan koordinat ───
function updateRowData_(sheet, reqLat, reqLng, year, newUrl, newDate, options) {
  options = options || {};
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var coordIdx = findCoordColumnIndices_(headers);
  var yIdx = coordIdx.yIdx;
  var xIdx = coordIdx.xIdx;

  var photoCols = ensurePhotoColumns_(sheet, year);
  var fotoColIdx = photoCols.fotoColIdx;
  var tglColIdx = photoCols.tglColIdx;

  if (xIdx === -1 || yIdx === -1) {
    throw new Error(
      "Kolom koordinat tidak ditemukan di Sheet.",
    );
  }

  var monMap = {};
  if (options.monitoring) {
    monMap["Tutupan_" + year] = options.monitoring.tutupan || "";
    monMap["Jenis_" + year] = options.monitoring.jenis || "";
    monMap["Kerapatan_" + year] = options.monitoring.kerapatan || "";
    monMap["Lereng_" + year] = options.monitoring.lereng || "";
    monMap["Umur_" + year] = options.monitoring.umur || "";
    monMap["Pengelolaan_" + year] = options.monitoring.pengelolaan || "";
    monMap["Ekosistem_" + year] = options.monitoring.ekosistem || "";
    monMap["Usulan_" + year] = options.monitoring.usulan || "";
  }
  
  var monitoringColIdx = {};
  
  if (options.monitoring) {
    for (var field in monMap) {
      var idx = -1;
      for (var h = 0; h < headers.length; h++) {
        if (String(headers[h]).trim() === field) {
          idx = h; break;
        }
      }
      if (idx === -1) {
        var nextCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, nextCol).setValue(field);
        idx = nextCol - 1;
        headers[idx] = field;
      }
      monitoringColIdx[field] = idx;
    }
  }

  function appendToRow_(rowNumber, rowValues) {
    assertOwnRowIfRequired_(headers, rowValues, options);

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
    
    if (options.monitoring) {
      for (var field in monitoringColIdx) {
        var curVal = rowValues[monitoringColIdx[field]] ? String(rowValues[monitoringColIdx[field]]).trim() : "";
        var appendVal = monMap[field] || "-";
        var nextVal = curVal ? curVal + "|" + appendVal : appendVal;
        sheet.getRange(rowNumber, monitoringColIdx[field] + 1).setValue(nextVal);
      }
    }
    
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
      "Kolom koordinat tidak ditemukan di Sheet.",
    );
  }

  var startRow = 1;
  var endRow = data.length - 1;
  var rowIndex = parseInt(options.rowIndex || 0, 10);
  if (rowIndex && rowIndex >= 2 && rowIndex <= data.length) {
    startRow = rowIndex - 1;
    endRow = rowIndex - 1;
  }

  for (var i = startRow; i <= endRow; i++) {
    var rawLat = String(data[i][yIdx]).replace(",", ".");
    var rawLng = String(data[i][xIdx]).replace(",", ".");
    var sheetLat = parseFloat(rawLat) || 0;
    var sheetLng = parseFloat(rawLng) || 0;

    if (
      Math.abs(sheetLat - reqLat) < 0.0025 &&
      Math.abs(sheetLng - reqLng) < 0.0025
    ) {
      assertOwnRowIfRequired_(headers, data[i], options);
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

        var monMapKeys = ["Tutupan_", "Jenis_", "Kerapatan_", "Lereng_", "Umur_", "Pengelolaan_", "Ekosistem_", "Usulan_"];
        for (var m = 0; m < monMapKeys.length; m++) {
           var mIdx = -1;
           for(var mh = 0; mh < headers.length; mh++) {
             if (String(headers[mh]).trim() === monMapKeys[m] + year) { mIdx = mh; break; }
           }
           if (mIdx !== -1) {
             var mStr = String(data[i][mIdx] || "").trim();
             if (mStr) {
               var mArr = mStr.split("|").map(function(s){return s.trim();});
               if (delIdx < mArr.length) {
                  mArr.splice(delIdx, 1);
                  sheet.getRange(i + 1, mIdx + 1).setValue(mArr.join("|"));
               }
             }
           }
        }
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

  if (lastCol < 6) {
    sheet
      .getRange(1, 5, 1, 2)
      .setValues([["Ukuran_KB", "CDK_Tag"]]);
  }

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
//  Helper: Ambil atau buat sheet Polygon Kegiatan
// ═══════════════════════════════════════════════════════════
function getOrCreatePolygonSheet_() {
  var ss = SpreadsheetApp.openById(POLYGON_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(POLYGON_SHEET_NAME);
  if (!sheet) {
    // Cek jika ada sheet default "Sheet1" dan rename
    var defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet) {
      defaultSheet.setName(POLYGON_SHEET_NAME);
      sheet = defaultSheet;
    } else {
      sheet = ss.insertSheet(POLYGON_SHEET_NAME);
    }
    // Set header row
    sheet.getRange(1, 1, 1, POLYGON_HEADERS_.length).setValues([POLYGON_HEADERS_]);
    // Format header row
    sheet.getRange(1, 1, 1, POLYGON_HEADERS_.length)
      .setBackground("#2e7d32")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    // Pastikan header ada
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      sheet.getRange(1, 1, 1, POLYGON_HEADERS_.length).setValues([POLYGON_HEADERS_]);
    }
  }
  return sheet;
}

// ─── Helper: Update foto polygon berdasarkan ID row ───
function updatePolygonPhotoById_(featureId, year, newUrl, newDate, options) {
  options = options || {};
  var sheet = getOrCreatePolygonSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idIdx = -1, fotoIdx = -1, tglIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).trim();
    if (hdr === "ID") idIdx = h;
    if (hdr === "Foto_" + year) fotoIdx = h;
    if (hdr === "Tanggal_" + year) tglIdx = h;
  }

  // Jika kolom foto/tanggal belum ada, buat
  if (fotoIdx === -1) {
    var nextCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, nextCol).setValue("Foto_" + year);
    fotoIdx = nextCol - 1;
    nextCol++;
    sheet.getRange(1, nextCol).setValue("Tanggal_" + year);
    tglIdx = nextCol - 1;
  }
  
  var monMap = {};
  if (options.monitoring) {
    monMap["Tutupan_" + year] = options.monitoring.tutupan || "";
    monMap["Jenis_" + year] = options.monitoring.jenis || "";
    monMap["Kerapatan_" + year] = options.monitoring.kerapatan || "";
    monMap["Lereng_" + year] = options.monitoring.lereng || "";
    monMap["Umur_" + year] = options.monitoring.umur || "";
    monMap["Pengelolaan_" + year] = options.monitoring.pengelolaan || "";
    monMap["Ekosistem_" + year] = options.monitoring.ekosistem || "";
    monMap["Usulan_" + year] = options.monitoring.usulan || "";
  }
  
  var monitoringColIdx = {};
  if (options.monitoring) {
    for (var field in monMap) {
      var idx = -1;
      for (var mh = 0; mh < headers.length; mh++) {
        if (String(headers[mh]).trim() === field) {
          idx = mh; break;
        }
      }
      if (idx === -1) {
        var nCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, nCol).setValue(field);
        idx = nCol - 1;
        headers[idx] = field;
      }
      monitoringColIdx[field] = idx;
    }
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim() === String(featureId).trim()) {
      var curFotos = String(data[i][fotoIdx] || "").trim();
      var curTgls = String(data[i][tglIdx] || "").trim();
      var newFotos = curFotos ? curFotos + "|" + newUrl : newUrl;
      var newTgls = curTgls ? curTgls + "|" + newDate : newDate;
      sheet.getRange(i + 1, fotoIdx + 1).setValue(newFotos);
      sheet.getRange(i + 1, tglIdx + 1).setValue(newTgls);
      
      if (options.monitoring) {
        for (var field in monitoringColIdx) {
          var curVal = String(data[i][monitoringColIdx[field]] || "").trim();
          var appendVal = monMap[field] || "-";
          var nextVal = curVal ? curVal + "|" + appendVal : appendVal;
          sheet.getRange(i + 1, monitoringColIdx[field] + 1).setValue(nextVal);
        }
      }
      return true;
    }
  }
  throw new Error("Feature ID " + featureId + " tidak ditemukan.");
}

// ─── Helper: Delete foto polygon berdasarkan ID row ───
function deletePolygonPhotoById_(featureId, year, targetUrl) {
  var sheet = getOrCreatePolygonSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idIdx = -1, fotoIdx = -1, tglIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).trim();
    if (hdr === "ID") idIdx = h;
    if (hdr === "Foto_" + year) fotoIdx = h;
    if (hdr === "Tanggal_" + year) tglIdx = h;
  }

  if (fotoIdx === -1 || tglIdx === -1) throw new Error("Kolom foto tahun " + year + " tidak ditemukan.");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim() === String(featureId).trim()) {
      var fotosArr = String(data[i][fotoIdx] || "").split("|").map(function(s){return s.trim();}).filter(Boolean);
      var tglsArr = String(data[i][tglIdx] || "").split("|").map(function(s){return s.trim();}).filter(Boolean);

      var targetMatch = targetUrl.match(/id=([a-zA-Z0-9_-]+)/) || targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      var targetId = targetMatch ? targetMatch[1] : targetUrl;

      var delIdx = -1;
      for (var j = 0; j < fotosArr.length; j++) {
        var cMatch = fotosArr[j].match(/id=([a-zA-Z0-9_-]+)/) || fotosArr[j].match(/\/d\/([a-zA-Z0-9_-]+)/);
        var cId = cMatch ? cMatch[1] : fotosArr[j];
        if (cId === targetId) { delIdx = j; break; }
      }

      if (delIdx !== -1) {
        fotosArr.splice(delIdx, 1);
        if (delIdx < tglsArr.length) tglsArr.splice(delIdx, 1);
        sheet.getRange(i + 1, fotoIdx + 1).setValue(fotosArr.join("|"));
        sheet.getRange(i + 1, tglIdx + 1).setValue(tglsArr.join("|"));

        var monMapKeys = ["Tutupan_", "Jenis_", "Kerapatan_", "Lereng_", "Umur_", "Pengelolaan_", "Ekosistem_", "Usulan_"];
        for (var m = 0; m < monMapKeys.length; m++) {
           var mIdx = -1;
           for(var mh = 0; mh < headers.length; mh++) {
             if (String(headers[mh]).trim() === monMapKeys[m] + year) { mIdx = mh; break; }
           }
           if (mIdx !== -1) {
             var mStr = String(data[i][mIdx] || "").trim();
             if (mStr) {
               var mArr = mStr.split("|").map(function(s){return s.trim();});
               if (delIdx < mArr.length) {
                  mArr.splice(delIdx, 1);
                  sheet.getRange(i + 1, mIdx + 1).setValue(mArr.join("|"));
               }
             }
           }
        }
        return true;
      }
      throw new Error("URL Foto tidak ditemukan.");
    }
  }
  throw new Error("Feature ID tidak ditemukan.");
}

// ═══════════════════════════════════════════════════════════
//  doPost: Menerima request POST dari Dashboard
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
          nip: String(sessionUser.row[0]),
          nama: String(sessionUser.row[2] || ""),
          jabatan: String(sessionUser.row[3] || ""),
          role: String(sessionUser.row[4] || "user"),
        },
      });
    }

    var auth = getAuthContext_(data);

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
      var featureId = data.featureId || "";

      if (!canUploadCategory_(auth, category)) {
        return jsonOutput_({ success: false, error: "Akun ini tidak memiliki izin upload pada kategori ini." });
      }

      var prefix = "Juna_";
      if (category === "pjl") prefix = "PJL_";
      else if (category === "pegawai") prefix = "Peg_";
      else if (category === "pegawaibinaanformatsistem") prefix = "PegBinaan_";
      else if (category === "polygon") prefix = "Poly_";
      else if (category === "per" || category === "persemaian") prefix = "Per_";

      var filename = prefix + year + "_" + new Date().getTime() + ".jpg";

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

        if (category === "polygon") {
          // Update spreadsheet polygon berdasarkan featureId
          if (!featureId) throw new Error("featureId diperlukan untuk upload foto polygon.");
          requireAdminMutation_(auth);
          updatePolygonPhotoById_(featureId, year, imgUrl, date, {
            monitoring: data.monitoring
          });
        } else {
          var ss = SpreadsheetApp.openById(getSpreadsheetIdForCategory_(category));
          var targetSheet;
          if (category === "pegawai") {
            targetSheet = ss.getSheetByName(PEGAWAI_SHEET_NAME);
          } else if (category === "pegawaibinaanformatsistem") {
            targetSheet = ss.getSheetByName(PEGAWAI_BINAAN_SHEET_NAME);
          } else {
            targetSheet = findSheetByCoordinates_(ss, reqLat, reqLng, category, {
              sheetGid: sheetGid,
              rowIndex: rowIndex,
            });
          }
          if (!targetSheet) {
            try { file.setTrashed(true); } catch(trashErr) {}
            return jsonOutput_({
              success: false,
              error: "Tidak menemukan sheet untuk koordinat " + reqLat + ", " + reqLng + " (kategori: " + category + ").",
            });
          }
          updateRowData_(targetSheet, reqLat, reqLng, year, imgUrl, date, {
            rowIndex: rowIndex,
            authNip: auth.nip,
            requireOwnNip: auth.group >= 3 && (category === "pegawai" || category === "pegawaibinaanformatsistem"),
            monitoring: data.monitoring
          });
        }
      } catch (rowErr) {
        try { file.setTrashed(true); } catch (trashErr) {}
        throw rowErr;
      } finally {
        try { writeLock.releaseLock(); } catch (releaseErr) {}
      }

      return jsonOutput_({
        success: true,
        url: imgUrl,
        date: date,
      });

    // ─── ACTION: delete foto ───
    } else if (data.action === "delete") {
      var reqLatDel = parseFloat(data.lat);
      var reqLngDel = parseFloat(data.lng);
      var yearDel = String(data.year);
      var urlToDelete = String(data.url);
      var categoryDel = String(data.category || "juna");
      var rowIndexDel = data.rowIndex ? parseInt(data.rowIndex, 10) : 0;
      var sheetGidDel = data.sheetGid || "";
      var featureIdDel = data.featureId || "";

      if (!canUploadCategory_(auth, categoryDel)) {
        return jsonOutput_({ success: false, error: "Akun ini tidak memiliki izin menghapus foto pada kategori ini." });
      }

      var deleteLock = LockService.getScriptLock();
      try {
        deleteLock.waitLock(30000);

        if (categoryDel === "polygon") {
          requireAdminMutation_(auth);
          if (!featureIdDel) throw new Error("featureId diperlukan.");
          deletePolygonPhotoById_(featureIdDel, yearDel, urlToDelete);
        } else {
          var ssDel = SpreadsheetApp.openById(getSpreadsheetIdForCategory_(categoryDel));
          var targetSheetDel;
          if (categoryDel === "pegawai") {
            targetSheetDel = ssDel.getSheetByName(PEGAWAI_SHEET_NAME);
          } else if (categoryDel === "pegawaibinaanformatsistem") {
            targetSheetDel = ssDel.getSheetByName(PEGAWAI_BINAAN_SHEET_NAME);
          } else {
            targetSheetDel = findSheetByCoordinates_(
              ssDel,
              reqLatDel,
              reqLngDel,
              categoryDel,
              { sheetGid: sheetGidDel, rowIndex: rowIndexDel },
            );
          }
          if (!targetSheetDel) {
            return jsonOutput_({
              success: false,
              error: "Tidak menemukan tab Sheet yang sesuai untuk koordinat ini.",
            });
          }
          deleteRowData_(
            targetSheetDel,
            reqLatDel,
            reqLngDel,
            yearDel,
            urlToDelete,
            {
              rowIndex: rowIndexDel,
              authNip: auth.nip,
              requireOwnNip: auth.group >= 3 && (categoryDel === "pegawai" || categoryDel === "pegawaibinaanformatsistem")
            },
          );
        }
      } finally {
        try { deleteLock.releaseLock(); } catch (releaseDelErr) {}
      }

      var targetMatchDel =
        urlToDelete.match(/id=([a-zA-Z0-9_-]+)/) ||
        urlToDelete.match(/\/d\/([a-zA-Z0-9_-]+)/);
      var fileIdDel = targetMatchDel ? targetMatchDel[1] : null;

      if (fileIdDel) {
        try {
          var fDel = DriveApp.getFileById(fileIdDel);
          fDel.setTrashed(true);
        } catch (delErr) {
          Logger.log("Gagal men-trash file: " + delErr.toString());
        }
      }

      return jsonOutput_({
        success: true,
        deletedId: fileIdDel,
      });

    // ─── ACTION: simpan data polygon / marker pohon ───
    } else if (data.action === "savePolygonFeature") {
      requireAdminMutation_(auth);
      var sheet = getOrCreatePolygonSheet_();
      var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");

      // Buat unique ID
      var featureId = "F_" + new Date().getTime();

      // Simpan GeoJSON jika ada
      var geojsonUrl = "";
      var geojsonFileId = "";
      if (data.geojson) {
        try {
          var gjFolder = DriveApp.getFolderById(POLYGON_GEOJSON_FOLDER_ID);
          var gjFileName = "polygon_" + featureId + ".geojson";
          var gjBlob = Utilities.newBlob(JSON.stringify(data.geojson), "application/geo+json", gjFileName);
          var gjFile = gjFolder.createFile(gjBlob);
          try {
            gjFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch(e) {}
          geojsonUrl = "https://drive.google.com/uc?export=download&id=" + gjFile.getId();
          geojsonFileId = gjFile.getId();
        } catch(gjErr) {
          Logger.log("GeoJSON save error: " + gjErr.toString());
        }
      }

      var newRow = [
        featureId,
        String(data.cdk_wilayah || ""),
        String(data.nama || ""),
        String(data.kabupaten || ""),
        String(data.kecamatan || ""),
        String(data.desa_blok || ""),
        String(data.lokasi || ""),
        String(data.kegiatan || ""),
        String(data.luas || ""),
        String(data.jenis_bibit || ""),
        String(data.jumlah_bibit || ""),
String(data.latitude || ""),
        String(data.longitude || ""),

        String(data.keterangan || ""),
        String(data.type || "polygon"),
        geojsonUrl,
        geojsonFileId,
        now,
        "", "", "", "", "", "", "", "", "", ""  // Foto_2026..Tanggal_2030
      ];

      sheet.appendRow(newRow);

      return jsonOutput_({
        success: true,
        featureId: featureId,
        geojsonUrl: geojsonUrl,
        tanggal: now,
      });

    // ─── ACTION: hapus data polygon / marker pohon ───
    } else if (data.action === "deletePolygonFeature") {
      requireAdminMutation_(auth);
      var sheetPoly = getOrCreatePolygonSheet_();
      var rowsPoly = sheetPoly.getDataRange().getValues();
      var featureIdDel = data.featureId;
      var rowIndexDel = -1;
      var geojsonFileId = "";
      var fileIdsToTrash = [];
      var headersPolyDel = rowsPoly[0] || [];
      var idIdxDel = 0;
      var geojsonIdxDel = 16;
      var photoIndices = [];

      for (var hp = 0; hp < headersPolyDel.length; hp++) {
        var hdrDel = String(headersPolyDel[hp]).trim();
        if (hdrDel === "ID") idIdxDel = hp;
        if (hdrDel === "GeoJSON_FileID") geojsonIdxDel = hp;
        if (/^Foto_20\d{2}$/.test(hdrDel)) photoIndices.push(hp);
      }
      if (photoIndices.length === 0) photoIndices = [18, 20, 22, 24, 26];

      // Cari baris berdasarkan ID
      for (var r = 1; r < rowsPoly.length; r++) {
        if (String(rowsPoly[r][idIdxDel]).trim() === String(featureIdDel).trim()) {
          rowIndexDel = r + 1; // 1-based index
          geojsonFileId = rowsPoly[r][geojsonIdxDel];
          for (var i = 0; i < photoIndices.length; i++) {
             var photoStr = rowsPoly[r][photoIndices[i]];
             if (photoStr) {
               var urls = String(photoStr).split(/[|,]/);
               for (var j = 0; j < urls.length; j++) {
                 var match = urls[j].match(/id=([a-zA-Z0-9_-]+)/) || urls[j].match(/\/d\/([a-zA-Z0-9_-]+)/);
                 if (match) fileIdsToTrash.push(match[1]);
               }
             }
          }
          break;
        }
      }

      if (rowIndexDel !== -1) {
        if (geojsonFileId) fileIdsToTrash.push(geojsonFileId);
        
        // Trash all associated files
        for (var k = 0; k < fileIdsToTrash.length; k++) {
          try {
            DriveApp.getFileById(fileIdsToTrash[k]).setTrashed(true);
          } catch(e) {}
        }
        
        sheetPoly.deleteRow(rowIndexDel);
        return jsonOutput_({ success: true, message: "Kegiatan dan file terkait berhasil dihapus." });
      } else {
        return jsonOutput_({ success: false, error: "Kegiatan tidak ditemukan." });
      }

    // ─── ACTION: ambil semua data polygon / marker pohon ───
    } else if (data.action === "getPolygonFeatures") {
      var sheetPoly = getOrCreatePolygonSheet_();
      var rowsPoly = sheetPoly.getDataRange().getValues();
      var headersPoly = rowsPoly[0];
      var features = [];

      for (var pi = 1; pi < rowsPoly.length; pi++) {
        if (!rowsPoly[pi][0]) continue;
        var feat = {};
        for (var pj = 0; pj < headersPoly.length; pj++) {
          feat[String(headersPoly[pj]).trim()] = rowsPoly[pi][pj];
        }
        features.push(feat);
      }

      return jsonOutput_({ success: true, features: features });

    // ─── ACTION: delete polygon / marker pohon ───
    } else if (data.action === "deletePolygonFeature") {
      requireAdminMutation_(auth);
      var delFeatId = String(data.featureId || "");
      if (!delFeatId) return jsonOutput_({ success: false, error: "featureId kosong." });

      var delSheet = getOrCreatePolygonSheet_();
      var delRows = delSheet.getDataRange().getValues();
      var delHeaders = delRows[0];
      var delIdIdx = -1;
      for (var dh = 0; dh < delHeaders.length; dh++) {
        if (String(delHeaders[dh]).trim() === "ID") { delIdIdx = dh; break; }
      }

      var gjFileIdToDel = "";
      for (var di = 1; di < delRows.length; di++) {
        if (String(delRows[di][delIdIdx]).trim() === delFeatId) {
          // Ambil GeoJSON FileID utk trash
          var gjIdx = -1;
          for (var djj = 0; djj < delHeaders.length; djj++) {
            if (String(delHeaders[djj]).trim() === "GeoJSON_FileID") { gjIdx = djj; break; }
          }
          if (gjIdx !== -1) gjFileIdToDel = String(delRows[di][gjIdx] || "");
          delSheet.deleteRow(di + 1);
          break;
        }
      }

      if (gjFileIdToDel) {
        try { DriveApp.getFileById(gjFileIdToDel).setTrashed(true); } catch(e) {}
      }

      return jsonOutput_({ success: true, deletedId: delFeatId });

    // ─── ACTION: upload polygon spasial ───
    } else if (data.action === "uploadSpatial") {
      requireAdminMutation_(auth);
      var geoJsonStr = data.geojson;
      var spFileName = String(
        data.filename || "spasial_" + new Date().getTime() + ".geojson",
      );
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
      var spFileUrl =
        "https://drive.google.com/uc?export=download&id=" + spFile.getId();
      var nowSp = Utilities.formatDate(
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
        nowSp,
        sizeKB,
        cdkTag,
        data.bbox_w || "",
        data.bbox_s || "",
        data.bbox_e || "",
        data.bbox_n || "",
        kategori,
      ]);
      return jsonOutput_({
        success: true,
        fileId: spFile.getId(),
        url: spFileUrl,
        filename: spFileName,
        uploaded: nowSp,
        sizeKB: sizeKB,
        kategori: kategori,
        bbox: {
          west: data.bbox_w || "",
          south: data.bbox_s || "",
          east: data.bbox_e || "",
          north: data.bbox_n || ""
        },
      });

    // ─── ACTION: delete polygon spasial ───
    } else if (data.action === "deleteSpatial") {
      requireAdminMutation_(auth);
      var delFileId = String(data.fileId || "");
      if (!delFileId) {
        return jsonOutput_({
          success: false,
          error: "fileId kosong",
        });
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
      return jsonOutput_({
        success: true,
        deletedId: delFileId,
      });

    // ─── ACTION: AI Assistant (Gemini) ───
    } else if (data.action === "askAI") {
      return handleAskAI_(data);

    } else {
      return jsonOutput_({
        success: false,
        error: "Aksi tidak dikenal: " + (data.action || "kosong"),
      });
    }
  } catch (err) {
    return jsonOutput_({
      success: false,
      error: err.toString(),
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  doGet: Menerima request GET dari Dashboard
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "";
  if (
    action === "getSpatialFiles" ||
    action === "getSpatialGeoJSON" ||
    action === "getFolder" ||
    action === "getPolygonFeatures"
  ) {
    try {
      requireAuth_(params);
    } catch (authErr) {
      return jsonOutput_({ success: false, error: authErr.toString() });
    }
  }

  if (action === "getPolygonFeatures") {
    try {
      var sheetPG = getOrCreatePolygonSheet_();
      var rowsPG = sheetPG.getDataRange().getValues();
      var headersPG = rowsPG[0];
      var featuresPG = [];
      for (var pgi = 1; pgi < rowsPG.length; pgi++) {
        if (!rowsPG[pgi][0]) continue;
        var featPG = {};
        for (var pgj = 0; pgj < headersPG.length; pgj++) {
          featPG[String(headersPG[pgj]).trim()] = rowsPG[pgi][pgj];
        }
        featuresPG.push(featPG);
      }
      return jsonOutput_({ success: true, features: featuresPG });
    } catch (err) {
      return jsonOutput_({ success: false, error: err.toString() });
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
      return jsonOutput_({ success: true, files: files });
    } catch (err) {
      return jsonOutput_({ success: false, error: err.toString() });
    }
  }

  if (action === "getSpatialGeoJSON") {
    try {
      var geoFileId = String(params.fileId || "");
      if (!geoFileId) {
        return jsonOutput_({ success: false, error: "fileId kosong" });
      }
      var geoFile = DriveApp.getFileById(geoFileId);
      var geoContent = geoFile.getBlob().getDataAsString();
      return jsonOutput_({ success: true, geojson: JSON.parse(geoContent) });
    } catch (err) {
      return jsonOutput_({ success: false, error: err.toString() });
    }
  }

  if (action === "getFolder") {
    try {
      var folderId = params.folderId;
      if (!folderId) {
        return jsonOutput_({
          success: false,
          error: "folderId tidak disediakan.",
        });
      }

      var folder = DriveApp.getFolderById(folderId);
      var files = folder.getFiles();
      var results = [];

      while (files.hasNext()) {
        var f = files.next();
        var mime = f.getMimeType();
        if (mime && mime.indexOf("image") !== -1) {
          try {
            f.setSharing(
              DriveApp.Access.ANYONE_WITH_LINK,
              DriveApp.Permission.VIEW,
            );
          } catch (shareErr) {}
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

      results.sort(function (a, b) {
        return b.rawDate - a.rawDate;
      });

      return jsonOutput_({
        success: true,
        files: results,
      });
    } catch (err) {
      return jsonOutput_({
        success: false,
        error: err.toString(),
      });
    }
  }

  // Default response
  return jsonOutput_({
    success: true,
    message: "Backend GeoHutan Aktif! Siap menerima API Request.",
  });
}

// ═══════════════════════════════════════════════════════════
// 🤖 AI ASSISTANT — Gemini API Handler
// ═══════════════════════════════════════════════════════════

/** API Key Gemini (RAHASIA – hanya di server, tidak pernah dikirim ke client) */
var GEMINI_API_KEY = "AQ.Ab8RN6IeqRLkpAc8Wk19dQ4DLdZMDw1udftpg3VWrPLgiu-ofQ";
var GEMINI_MODEL   = "gemini-flash-latest";
var GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/"
                   + GEMINI_MODEL + ":generateContent";

/** Role yang boleh mengakses AI */
var AI_ALLOWED_ROLES_ = [
  "admin", "kadis", "sekdis", "kabid pdas",
  "kabid ppkh", "kabid bupm", "kabid pksdae"
];

/**
 * Memvalidasi role dan memanggil Gemini untuk analisis kehutanan.
 * @param {Object} data - payload dari request POST
 */
function handleAskAI_(data) {
  try {
    // ── 1. Validasi session token ──
    var sessionUsername = verifyAuthToken_(data.authToken || data.token || "");
    if (!sessionUsername) {
      return jsonOutput_({ success: false, error: "Sesi tidak valid. Silakan login ulang." });
    }

    // ── 2. Validasi role ──
    var requestedRole = String(data.role || "").toLowerCase().trim().replace(/\s+/g, " ");
    var isAllowed = AI_ALLOWED_ROLES_.some(function(r) { return r === requestedRole; });
    if (!isAllowed) {
      return jsonOutput_({
        success: false,
        error: "Akses AI Assistant tidak diizinkan untuk role: " + requestedRole
      });
    }

    // ── 3. Ambil pertanyaan & data marker ──
    var question   = String(data.question || "").trim();
    var markerData = data.marker || {};
    var dataType   = String(data.dataType || "unknown");

    if (!question) {
      return jsonOutput_({ success: false, error: "Pertanyaan tidak boleh kosong." });
    }

    // ── 4. Bangun konteks marker sebagai string ──
    var markerContext = buildMarkerContext_(markerData, dataType);

    // ── 5. Bangun system prompt ──
    var systemPrompt = buildSystemPrompt_();

    // ── 6. Ambil history percakapan multi-turn dari frontend ──
    var history = [];
    if (Array.isArray(data.history)) {
      // Validasi format: [{role:'user'|'model', parts:[{text}]}]
      history = data.history.filter(function(h) {
        return h && (h.role === 'user' || h.role === 'model') &&
               Array.isArray(h.parts) && h.parts.length > 0;
      });
    }

    // ── 7. Bangun user prompt dengan konteks marker (hanya di pesan pertama) ──
    var userPrompt;
    if (history.length === 0) {
      // Pesan pertama: sertakan konteks marker lengkap
      userPrompt = buildUserPrompt_(question, markerContext, dataType);
    } else {
      // Pesan lanjutan: cukup kirim pertanyaan saja, konteks sudah ada di history
      userPrompt = question;
    }

    // ── 8. Panggil Gemini API dengan history multi-turn ──
    var answer = callGeminiAPI_(systemPrompt, userPrompt, history);

    return jsonOutput_({ success: true, answer: answer });

  } catch (err) {
    Logger.log("handleAskAI_ error: " + err.toString());
    return jsonOutput_({
      success: false,
      error: "Terjadi kesalahan pada server AI: " + err.message
    });
  }
}

/**
 * Mengkonversi object marker menjadi teks konteks terstruktur untuk AI.
 */
function buildMarkerContext_(markerData, dataType) {
  if (!markerData || typeof markerData !== "object") return "Data marker tidak tersedia.";

  var labelMap = {
    "pjl":             "Petugas Jaga Leuweung",
    "per":             "Lokasi Persemaian Jaga Leuweung",
    "persemaian":      "Lokasi Persemaian Jaga Leuweung",
    "peg":             "Pegawai Dinas Kehutanan",
    "pegawai":         "Pegawai Dinas Kehutanan",
    "pegb":            "Pegawai Wilayah Hutan Binaan",
    "pegawaiBinaan":   "Pegawai Wilayah Hutan Binaan",
    "jum":             "Lokasi Juna Permanen (Jum'at Menanam)",
    "jumat":           "Lokasi Juna Permanen (Jum'at Menanam)",
    "pohon":           "Area/Titik Kegiatan Tanam & Pelihara",
    "polygon_kegiatan":"Area/Titik Kegiatan Tanam & Pelihara"
  };

  var label = labelMap[dataType] || "Data Kegiatan Kehutanan";

  var lines = [];
  lines.push("=== DATA " + label.toUpperCase() + " ===");
  lines.push("");

  var keys = Object.keys(markerData);
  keys.forEach(function(k) {
    var v = markerData[k];
    if (v !== null && v !== undefined && String(v).trim() !== "" && String(v).trim() !== "-") {
      lines.push("• " + k + ": " + String(v).trim());
    }
  });

  if (lines.length <= 2) {
    lines.push("(Data atribut tidak tersedia secara lengkap)");
  }

  lines.push("");
  lines.push("=== END DATA ===");
  return lines.join("\n");
}

/**
 * System prompt sebagai ahli kehutanan Indonesia.
 */
function buildSystemPrompt_() {
  return [
    "Anda adalah AI GeoHutan — asisten resmi Dinas Kehutanan Provinsi Jawa Barat.",
    "",
    "PERAN ANDA:",
    "Anda adalah pakar multidisiplin dengan keahlian mendalam di bidang:",
    "- Ahli Kehutanan Indonesia dan Hukum Kehutanan",
    "- Ahli Rehabilitasi Hutan dan Lahan (RHL)",
    "- Ahli Konservasi Sumber Daya Alam dan Ekosistem",
    "- Ahli Pengelolaan Daerah Aliran Sungai (DAS)",
    "- Ahli Agroforestry dan Perhutanan Sosial",
    "- Ahli Pengelolaan Tahura dan Kawasan Konservasi",
    "- Ahli Kebijakan Kehutanan Provinsi Jawa Barat",
    "- Ahli GIS dan Analisis Spasial Kehutanan",
    "- Ahli Lingkungan dan Adaptasi Perubahan Iklim",
    "- Ahli Mitigasi Bencana dan Pemulihan Lahan Kritis",
    "",
    "PRIORITAS ANALISIS:",
    "1. Perhutanan Sosial dan pemberdayaan masyarakat",
    "2. Prinsip kehutanan berkelanjutan",
    "3. Konservasi biodiversitas",
    "4. Rehabilitasi hutan dan pemulihan ekosistem",
    "5. Pengelolaan DAS terpadu",
    "6. Perlindungan hutan dan pencegahan kebakaran",
    "7. Agroforestry dan ketahanan pangan",
    "8. Adaptasi dan mitigasi perubahan iklim",
    "9. Mitigasi bencana alam (longsor, banjir)",
    "10. Pemulihan lahan kritis",
    "",
    "ATURAN JAWABAN:",
    "- SELALU gunakan data marker/lokasi sebagai dasar utama analisis.",
    "- JANGAN menjawab pertanyaan di luar konteks kehutanan.",
    "- Jika data tidak lengkap, sebutkan secara jujur dan sebutkan data tambahan yang diperlukan.",
    "- Gunakan bahasa Indonesia formal dan profesional.",
    "- Berikan jawaban terstruktur dalam format berikut:",
    "",
    "FORMAT JAWABAN WAJIB:",
    "## 📍 Ringkasan Lokasi",
    "Deskripsi singkat lokasi berdasarkan data.",
    "",
    "## 🔍 Analisis Kondisi",
    "Analisis kondisi lapangan berdasarkan data yang tersedia.",
    "",
    "## 🌱 Potensi",
    "Potensi pengembangan dan pemanfaatan lokasi.",
    "",
    "## ⚠️ Ancaman & Risiko",
    "Identifikasi ancaman dan risiko utama.",
    "",
    "## 🛠️ Rekomendasi Teknis",
    "Rekomendasi teknis operasional yang spesifik.",
    "",
    "## 🎯 Rekomendasi Kebijakan",
    "Rekomendasi strategis untuk pimpinan Dinas Kehutanan.",
    "",
    "## 📊 Tingkat Keyakinan Analisis",
    "Tingkat keyakinan: [Tinggi/Sedang/Rendah] — alasan singkat.",
    "",
    "Gunakan bullet points (- atau •) untuk poin-poin dalam setiap seksi.",
    "Buat analisis yang SPESIFIK terhadap lokasi, BUKAN generik."
  ].join("\n");
}

/**
 * User prompt dengan konteks marker dan pertanyaan pengguna.
 */
function buildUserPrompt_(question, markerContext, dataType) {
  return [
    "KONTEKS DATA MARKER YANG DIKLIK OLEH PIMPINAN:",
    "",
    markerContext,
    "",
    "PERTANYAAN DARI PIMPINAN:",
    question,
    "",
    "Catatan: Jawab berdasarkan konteks data di atas. Jika ada data spasial seperti",
    "koordinat, luas, DAS, atau kawasan hutan — gunakan untuk memperkaya analisis.",
    "Jenis data: " + dataType
  ].join("\n");
}

/**
 * Memanggil Gemini API dan mengembalikan teks jawaban.
 * Mendukung multi-turn conversation (history).
 * @param {string} systemPrompt
 * @param {string} userPrompt  - pesan terbaru dari user
 * @param {Array}  history     - array history [{role, parts:[{text}]}]
 * @returns {string} jawaban AI
 */
function callGeminiAPI_(systemPrompt, userPrompt, history) {
  // Susun contents: history lama + pesan baru dari user
  var contents = [];
  if (Array.isArray(history) && history.length > 0) {
    contents = history;
  }
  contents = contents.concat([{
    role: "user",
    parts: [{ text: userPrompt }]
  }]);

  var payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: contents,
    generationConfig: {
      temperature:     0.7,
      topK:            40,
      topP:            0.95,
      maxOutputTokens: 8192,   // ← dinaikkan agar jawaban tidak terpotong
      candidateCount:  1
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ]
  };

  var options = {
    method:      "post",
    contentType: "application/json",
    headers: {
      "x-goog-api-key": GEMINI_API_KEY
    },
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(GEMINI_API_URL, options);
  var statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    var errText = response.getContentText();
    Logger.log("Gemini API error " + statusCode + ": " + errText);
    throw new Error("Gemini API gagal (HTTP " + statusCode + "). " +
                    "Periksa konfigurasi API key atau coba beberapa saat lagi.");
  }

  var json = JSON.parse(response.getContentText());

  // Ekstrak teks dari response Gemini
  try {
    var candidates = json.candidates || [];
    if (candidates.length === 0) {
      throw new Error("Tidak ada respons dari model AI.");
    }
    var candidate = candidates[0];
    var content   = candidate.content || {};
    var parts     = content.parts || [];
    if (parts.length === 0) {
      // Cek finish reason
      var reason = candidate.finishReason || "UNKNOWN";
      throw new Error("Model AI tidak menghasilkan teks (finishReason: " + reason + ").");
    }
    var text = parts.map(function(p) { return p.text || ""; }).join("").trim();
    if (!text) throw new Error("Respons AI kosong.");
    return text;
  } catch (parseErr) {
    Logger.log("Parse Gemini response error: " + parseErr.toString());
    Logger.log("Raw response: " + response.getContentText().substring(0, 500));
    throw new Error("Gagal memproses respons AI: " + parseErr.message);
  }
}
