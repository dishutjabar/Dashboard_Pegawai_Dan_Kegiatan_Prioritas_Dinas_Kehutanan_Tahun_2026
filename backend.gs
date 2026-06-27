// ==============================================================================
// 🌲 BACKEND WEB APP: GEOHUTAN JABAR (GOOGLE APPS SCRIPT)
// ==============================================================================
// PENTING: Ganti SPREADSHEET_ID di bawah ini dengan ID Spreadsheet Anda!
// ID ada di URL spreadsheet: https://docs.google.com/spreadsheets/d/ID_ADA_DISINI/edit
// ==============================================================================

var SPREADSHEET_ID = "14jmMYMOY6vl2nIdbZdO-wahixn1yN3LTLqwI-19RNtY";
var UPLOAD_FOLDER_NAME = "GeoHutan_Uploads";
var SPATIAL_FOLDER_NAME = "IT_dokumentasi_spasial";
var SPATIAL_SHEET_NAME = "Data_Spasial";

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
function findSheetByCoordinates_(ss, reqLat, reqLng, category) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (!sheetHasPhotoColumns_(sheet)) continue;
    var sheetName = String(sheet.getName());
    var isPjlTab = /^CDK\d+_FORMATSISTEM$/i.test(sheetName);
    if (category === "pjl" && !isPjlTab) continue;
    if (category === "juna" && isPjlTab) continue;

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    var headers = data[0];
    var coords = findCoordColumnIndices_(headers);
    if (coords.yIdx === -1 || coords.xIdx === -1) continue;

    for (var r = 1; r < data.length; r++) {
      var rawLat = String(data[r][coords.yIdx]).replace(",", ".");
      var rawLng = String(data[r][coords.xIdx]).replace(",", ".");
      var sheetLat = parseFloat(rawLat) || 0;
      var sheetLng = parseFloat(rawLng) || 0;
      if (
        Math.abs(sheetLat - reqLat) < 0.001 &&
        Math.abs(sheetLng - reqLng) < 0.001
      ) {
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
function updateRowData_(sheet, reqLat, reqLng, year, newUrl, newDate) {
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

  // Cari baris yang cocok berdasarkan koordinat (toleransi 0.001)
  for (var i = 1; i < data.length; i++) {
    var rawLat = String(data[i][yIdx]).replace(",", ".");
    var rawLng = String(data[i][xIdx]).replace(",", ".");
    var sheetLat = parseFloat(rawLat) || 0;
    var sheetLng = parseFloat(rawLng) || 0;

    if (
      Math.abs(sheetLat - reqLat) < 0.001 &&
      Math.abs(sheetLng - reqLng) < 0.001
    ) {
      // MATCH FOUND!
      var currentFotos = data[i][fotoColIdx]
        ? String(data[i][fotoColIdx]).trim()
        : "";
      var currentTgls = data[i][tglColIdx]
        ? String(data[i][tglColIdx]).trim()
        : "";

      var nextFotos = currentFotos ? currentFotos + "|" + newUrl : newUrl;
      var nextTgls = currentTgls ? currentTgls + "|" + newDate : newDate;

      sheet.getRange(i + 1, fotoColIdx + 1).setValue(nextFotos);
      sheet.getRange(i + 1, tglColIdx + 1).setValue(nextTgls);

      return true;
    }
  }
  throw new Error(
    "Data lokasi tidak ditemukan. Koordinat: " + reqLat + ", " + reqLng,
  );
}

// ═══════════════════════════════════════════════════════════
// Helper: Delete baris di Spreadsheet berdasarkan koordinat
function deleteRowData_(sheet, reqLat, reqLng, year, targetUrl) {
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

  // Cari baris yang cocok berdasarkan koordinat (toleransi 0.001)
  for (var i = 1; i < data.length; i++) {
    var rawLat = String(data[i][yIdx]).replace(",", ".");
    var rawLng = String(data[i][xIdx]).replace(",", ".");
    var sheetLat = parseFloat(rawLat) || 0;
    var sheetLng = parseFloat(rawLng) || 0;

    if (
      Math.abs(sheetLat - reqLat) < 0.001 &&
      Math.abs(sheetLng - reqLng) < 0.001
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
}

// ═══════════════════════════════════════════════════════════
//  doPost: Menerima request POST dari Dashboard (Upload Foto + Spasial)
// ═══════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ─── ACTION: upload foto ───
    if (data.action === "upload") {
      var base64Data = data.base64;
      var mimeType = data.mimeType || "image/jpeg";
      var reqLat = parseFloat(data.lat);
      var reqLng = parseFloat(data.lng);
      var year = String(data.year);
      var date = String(data.date);
      var category = String(data.category || "juna");
      var filename =
        (category === "pjl" ? "PJL_" : "Juna_") +
        year +
        "_" +
        new Date().getTime() +
        ".jpg";

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
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var targetSheet = findSheetByCoordinates_(ss, reqLat, reqLng, category);
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

      updateRowData_(targetSheet, reqLat, reqLng, year, imgUrl, date);

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

      var ssDel = SpreadsheetApp.openById(SPREADSHEET_ID);
      var targetSheetDel = findSheetByCoordinates_(
        ssDel,
        reqLatDel,
        reqLngDel,
        categoryDel,
      );
      if (!targetSheetDel) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: "Tidak menemukan tab Sheet yang sesuai untuk koordinat ini.",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      deleteRowData_(
        targetSheetDel,
        reqLatDel,
        reqLngDel,
        yearDel,
        urlToDelete,
      );

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
      var ssSp = SpreadsheetApp.openById(SPREADSHEET_ID);
      var spFolder = getOrCreateFolder_(SPATIAL_FOLDER_NAME);
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
      ]);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          fileId: spFile.getId(),
          url: spFileUrl,
          filename: spFileName,
          uploaded: now,
          sizeKB: sizeKB,
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
          if (rows[i][6] !== "" && rows[i][7] !== "" && rows[i][8] !== "" && rows[i][9] !== "") {
            bbox = {
              west: Number(rows[i][6]),
              south: Number(rows[i][7]),
              east: Number(rows[i][8]),
              north: Number(rows[i][9]),
            };
          }

          files.push({
            fileId: fileId,
            filename: filename,
            url: url,
            uploaded: uploaded,
            sizeKB: sizeKB,
            cdkTag: cdkTag,
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
