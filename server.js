const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    // Mengamankan URL dan default ke index.html jika akses root '/'
    let safeUrl = parsedUrl.pathname === '/' ? 'index.html' : decodeURIComponent(parsedUrl.pathname);
    if (safeUrl.indexOf('..') !== -1) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid request path');
        return;
    }
    safeUrl = safeUrl.replace(/^\/+/, '');

    // Otomatis menggabungkan lokasi folder proyek Anda dengan file yang diminta browser
    let fullPath = path.join(__dirname, safeUrl);
    let extName = path.extname(fullPath).toLowerCase();

    // Mapping tipe file agar CSS, JS, Gambar, dan Font terbaca dengan benar di dashboard
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.geojson': 'application/geo+json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    let contentType = mimeTypes[extName] || 'application/octet-stream';
    const headers = { 'Content-Type': contentType };
    if (path.basename(fullPath) === 'service-worker.js') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (extName === '.html' || extName === '.geojson') {
        headers['Cache-Control'] = 'no-cache';
    }

    // Membaca file dari folder C:\dahsboard-dishut\... secara otomatis
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Halaman atau file tidak ditemukan');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Error server: ${err.code}`);
            }
        } else {
            res.writeHead(200, headers);
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server Dashboard Dinas Kehutanan aktif!`);
    console.log(`Buka browser dan akses -> http://localhost:${PORT}`);
});
