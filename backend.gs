// ==============================================================================
// 🌲 BACKEND WEB APP: GEOHUTAN JABAR (GOOGLE APPS SCRIPT)
// ==============================================================================
// PENTING: Ganti SPREADSHEET_ID di bawah ini dengan ID Spreadsheet Anda!
// ID ada di URL spreadsheet: https://docs.google.com/spreadsheets/d/ID_ADA_DISINI/edit
// ==============================================================================

var SPREADSHEET_ID = "1p7-7pSKtNCc58eC-tXJsXNKk3QSSswI68Gl6fNsZhSE";
var UPLOAD_FOLDER_NAME = "GeoHutan_Uploads";

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

// ─── Helper: Cari sheet yang punya kolom Foto_2026 ───
function findSheetWithColumns_(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var lastCol = sheets[i].getLastColumn();
    if (lastCol === 0) continue;
    var head = sheets[i].getRange(1, 1, 1, lastCol).getValues()[0];
    for (var j = 0; j < head.length; j++) {
      if (String(head[j]).trim() === "Foto_2026") return sheets[i];
    }
  }
  return null;
}

// ─── Helper: Update baris di Spreadsheet berdasarkan koordinat ───
function updateRowData_(sheet, reqLat, reqLng, year, newUrl, newDate) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Cari indeks kolom koordinat (cek berbagai variasi nama header)
  var yIdx = -1,
    xIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).trim().toLowerCase();
    if (
      hdr.indexOf("titik koordinat") !== -1 &&
      (hdr.indexOf("(y)") !== -1 || hdr.indexOf("y)") !== -1)
    )
      yIdx = h;
    if (
      hdr.indexOf("titik koordinat") !== -1 &&
      (hdr.indexOf("(x)") !== -1 || hdr.indexOf("x)") !== -1)
    )
      xIdx = h;
  }

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
  var yIdx = -1,
    xIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).trim().toLowerCase();
    if (
      hdr.indexOf("titik koordinat") !== -1 &&
      (hdr.indexOf("(y)") !== -1 || hdr.indexOf("y)") !== -1)
    )
      yIdx = h;
    if (
      hdr.indexOf("titik koordinat") !== -1 &&
      (hdr.indexOf("(x)") !== -1 || hdr.indexOf("x)") !== -1)
    )
      xIdx = h;
  }

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

      var fotosArr = currentFotos.split("|").map(function(s){return s.trim();}).filter(function(s){return s !== "";});
      var tglsArr = currentTgls.split("|").map(function(s){return s.trim();}).filter(function(s){return s !== "";});

      var targetMatch = targetUrl.match(/id=([a-zA-Z0-9_-]+)/) || targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      var targetId = targetMatch ? targetMatch[1] : targetUrl;

      var delIdx = -1;
      for (var j = 0; j < fotosArr.length; j++) {
        var cMatch = fotosArr[j].match(/id=([a-zA-Z0-9_-]+)/) || fotosArr[j].match(/\/d\/([a-zA-Z0-9_-]+)/);
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
//  doPost: Menerima request POST dari Dashboard (Upload Foto)
// ═══════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === "upload") {
      var base64Data = data.base64;
      var mimeType = data.mimeType || "image/jpeg";
      var reqLat = parseFloat(data.lat);
      var reqLng = parseFloat(data.lng);
      var year = String(data.year);
      var date = String(data.date);
      var filename = "Juna_" + year + "_" + new Date().getTime() + ".jpg";

      // 1. Simpan foto ke Google Drive sesuai tahun
      var folderName = "Juna Permanen Tahun " + year;
      var folder = getOrCreateFolder_(folderName);
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mimeType, filename);
      var file = folder.createFile(blob);

      // Set sharing: ANYONE_WITH_LINK dengan VIEW permission
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        Logger.log("File sharing berhasil: " + file.getId());
      } catch(shareErr) {
        Logger.log("Warning: File sharing gagal (mungkin workspace restriction): " + shareErr.toString());
      }

      // Gunakan /uc?export=view format yang paling reliable
      var imgUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
      Logger.log("Image URL created: " + imgUrl);

      // 2. Update Spreadsheet
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var targetSheet = findSheetWithColumns_(ss);
      if (!targetSheet) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: "Tidak menemukan tab Sheet yang memiliki kolom 'Foto_2026'.",
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
    } else if (data.action === "delete") {
      var reqLatDel = parseFloat(data.lat);
      var reqLngDel = parseFloat(data.lng);
      var yearDel = String(data.year);
      var urlToDelete = String(data.url);

      // Extract ID to delete from Google Drive
      var targetMatch = urlToDelete.match(/id=([a-zA-Z0-9_-]+)/) || urlToDelete.match(/\/d\/([a-zA-Z0-9_-]+)/);
      var fileId = targetMatch ? targetMatch[1] : null;

      // 1. Trash from Drive
      if (fileId) {
        try {
          var f = DriveApp.getFileById(fileId);
          f.setTrashed(true);
          Logger.log("File ditrash: " + fileId);
        } catch(delErr) {
          Logger.log("Gagal men-trash file: " + delErr.toString());
        }
      }

      // 2. Remove from Spreadsheet
      var ssDel = SpreadsheetApp.openById(SPREADSHEET_ID);
      var targetSheetDel = findSheetWithColumns_(ssDel);
      if (!targetSheetDel) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            error: "Tidak menemukan tab Sheet yang sesuai.",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      deleteRowData_(targetSheetDel, reqLatDel, reqLngDel, yearDel, urlToDelete);

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          deletedId: fileId,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: "Aksi tidak dikenal: " + (data.action || "kosong"),
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

// ═══════════════════════════════════════════════════════════
//  doGet: Menerima request GET dari Dashboard (Ekstrak Folder)
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "";

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
          } catch(shareErr) {
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
