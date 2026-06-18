const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Mengamankan URL dan default ke index.html jika akses root '/'
    let safeUrl = req.url === '/' ? 'index.html' : decodeURIComponent(req.url);
    if (safeUrl.indexOf('..') !== -1) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid request path');
        return;
    }
    safeUrl = safeUrl.replace(/^\/+/, '');

    // Otomatis menggabungkan lokasi folder proyek Anda dengan file yang diminta browser
    let fullPath = path.join(__dirname, safeUrl);
    let extName = path.extname(fullPath).toLowerCase();

    // Mapping tipe file agar CSS, JS, Gambar, dan Font terbaca dengan benar di dashboard
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    let contentType = mimeTypes[extName] || 'application/octet-stream';

    // Membaca file dari folder C:\dahsboard-dishut\... secara otomatis
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Halaman atau file tidak ditemukan');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Error server: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server Dashboard Dinas Kehutanan aktif!`);
    console.log(`Buka browser dan akses -> http://localhost:${PORT}`);
});
