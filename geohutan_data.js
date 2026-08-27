
window.getGeoHutanData = function() {
  // Extract data from DATA global object in app-core.js
  var mapData = [];
  var pembinaData = [];
  
  if (window.DATA && window.DATA.pegawaiBinaan) {
    // Generate mapData dynamically or use static mapping if needed
    // The dashboard already has static fallback for mapData, we can just supply pembinaData
  }
  
  // Actually, we can return the exact structure the dashboard expects
  return {
    mapData: null, // Let dashboard use its own static mapData
    pembinaData: window.DATA && window.DATA.pegawaiBinaan ? window.DATA.pegawaiBinaan.map(function(r, i) {
      return {
        no: i + 1,
        nama: r['Nama Pembina/Pegawai'] || r['Nama'] || 'Anonim',
        cdk: r['Instansi / Unit Kerja'] || r['Unit'] || 'N/A',
        lokasi: (r['Desa/Kelurahan'] || r['Desa/ Kelurahan'] || '') + ', ' + (r['Kecamatan'] || ''),
        luas: r['Luas (Ha)'] || 0,
        mingguan: sourceHasWeeklyReport(r) ? 1 : 0,
        linimasa: sourceHasMonthlyPhoto(r) ? 1 : 0
      };
    }) : null
  };
};

window.closePimpinanDashboard = function() {
  var container = document.getElementById('pimpinan-dashboard-container');
  if (container) container.style.display = 'none';
};
