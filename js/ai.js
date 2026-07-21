/* ═══════════════════════════════════════════════════════════════════
   GeoHutan AI Assistant – ai.js  (v2.1)
   ─────────────────────────────────────────────────────────────────
   • Role-based access (Level 1 & Level 2 only)
   • Multi-turn chat — history percakapan dikirim ke backend
   • Jawaban LENGKAP tanpa terpotong (maxOutputTokens naik di backend)
   • Tombol 🔍 Expand untuk membaca jawaban dalam modal layar penuh
   • Render instan tanpa typewriter lambat
   • Browser cache (SessionStorage) per marker
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const GeoHutanAI = (() => {

  /* ────────────────────────────────────────────────────────────
     KONFIGURASI
  ──────────────────────────────────────────────────────────── */
  const AI_ALLOWED_ROLES_L1 = ['admin', 'kadis', 'sekdis', 'kabid pdas'];
  const AI_ALLOWED_ROLES_L2 = ['kabid ppkh', 'kabid bupm', 'kabid pksdae'];

  const HINT_QUESTIONS = [
    'Potensi lokasi ini?',
    'Ancaman utama?',
    'Rekomendasi untuk pimpinan?',
    'Tanaman apa yang cocok?',
    'Tingkat keberhasilan rehabilitasi?',
    'Prioritas kegiatan berikutnya?',
    'Risiko jika tidak ditanami?',
    'Apakah cocok untuk agroforestry?'
  ];

  const SESSION_CACHE = new Map();

  /* ── State ── */
  let _currentMarker = null;
  let _currentType   = null;
  let _lastQuestion  = null;
  let _isLoading     = false;
  let _chatHistory   = [];   // [{role:'user'|'model', parts:[{text}]}] format Gemini multi-turn
  let _cardEl        = null;

  /* ────────────────────────────────────────────────────────────
     ROLE CHECK
  ──────────────────────────────────────────────────────────── */
  function _canAccessAI() {
    try {
      const user = (typeof getCurrentAuthUser === 'function') ? getCurrentAuthUser() : null;
      if (!user) return false;
      const role = String(user.role || user.jabatan || '').toLowerCase().trim().replace(/\s+/g, ' ');
      return AI_ALLOWED_ROLES_L1.includes(role) || AI_ALLOWED_ROLES_L2.includes(role);
    } catch (e) { return false; }
  }

  function _getRoleInfo() {
    try {
      const user = (typeof getCurrentAuthUser === 'function') ? getCurrentAuthUser() : null;
      if (!user) return { role: 'unknown', level: 0, nama: '' };
      const role  = String(user.role || user.jabatan || '').toLowerCase().trim().replace(/\s+/g, ' ');
      const level = AI_ALLOWED_ROLES_L1.includes(role) ? 1 :
                    AI_ALLOWED_ROLES_L2.includes(role) ? 2 : 0;
      return { role, level, nama: user.nama || user.username || '' };
    } catch (e) { return { role: 'unknown', level: 0, nama: '' }; }
  }

  /* ────────────────────────────────────────────────────────────
     CACHE
  ──────────────────────────────────────────────────────────── */
  function _buildCacheKey(markerData, question) {
    const str  = JSON.stringify(markerData, Object.keys(markerData).sort()) + '::' + question.trim().toLowerCase();
    let hash   = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
      hash = hash >>> 0;
    }
    return 'ai_cache_v2_' + hash;
  }

  function _getCached(key) {
    try { const r = sessionStorage.getItem(key); if (r) return JSON.parse(r); } catch(e){}
    return SESSION_CACHE.get(key) || null;
  }

  function _setCache(key, data) {
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch(e){}
    SESSION_CACHE.set(key, data);
  }

  /* ────────────────────────────────────────────────────────────
     MARKDOWN → HTML (versi lengkap)
  ──────────────────────────────────────────────────────────── */
  function _markdownToHtml(text) {
    if (!text) return '';
    let html = text
      .replace(/^#{3}\s+(.+)$/gm,  '<h5>$1</h5>')
      .replace(/^#{2}\s+(.+)$/gm,  '<h5>$1</h5>')
      .replace(/^#{1}\s+(.+)$/gm,  '<h5>$1</h5>')
      .replace(/\*\*(.+?)\*\*/g,   '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,       '<em>$1</em>')
      .replace(/^[\-\*]\s+(.+)$/gm,'<li>$1</li>')
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g,    '<br>');
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
  }

  function _escapeHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function _cleanMarkerData(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const clean = {};
    Object.keys(raw).forEach(k => {
      if (!k.startsWith('_') && raw[k] != null) {
        const v = String(raw[k]).trim();
        if (v && v !== 'Data tidak tersedia' && v !== '-') clean[k] = v;
      }
    });
    return clean;
  }

  /* ────────────────────────────────────────────────────────────
     MODAL EXPAND — tampilan jawaban layar penuh
  ──────────────────────────────────────────────────────────── */
  function _ensureModalDOM() {
    if (document.getElementById('ai-expand-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'ai-expand-modal';
    modal.className = 'ai-expand-modal-overlay';
    modal.innerHTML = `
      <div class="ai-expand-modal-box" id="ai-expand-modal-box">
        <div class="ai-expand-modal-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🤖</span>
            <div>
              <div class="ai-expand-title">AI GeoHutan – Jawaban Lengkap</div>
              <div class="ai-expand-subtitle" id="ai-expand-subtitle"></div>
            </div>
          </div>
          <button class="ai-expand-close" onclick="GeoHutanAI.closeModal()" title="Tutup (Esc)">✕</button>
        </div>
        <div class="ai-expand-body" id="ai-expand-body"></div>
        <div class="ai-expand-footer">
          <span style="font-size:11px;opacity:0.5;">Tekan Esc untuk menutup</span>
          <button class="ai-expand-copy-btn" onclick="GeoHutanAI.copyAnswer()">📋 Salin Jawaban</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    // Tutup saat klik overlay
    modal.addEventListener('click', e => { if (e.target === modal) _closeModal(); });
    // Tutup saat tekan Esc
    document.addEventListener('keydown', e => { if (e.key === 'Escape') _closeModal(); });
  }

  function _openModal(question, answerHtml) {
    _ensureModalDOM();
    const modal    = document.getElementById('ai-expand-modal');
    const subtitle = document.getElementById('ai-expand-subtitle');
    const body     = document.getElementById('ai-expand-body');
    if (subtitle) subtitle.textContent = '❓ ' + question;
    if (body)     body.innerHTML = answerHtml;
    if (modal) {
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('ai-modal-visible'));
    }
  }

  function _closeModal() {
    const modal = document.getElementById('ai-expand-modal');
    if (modal) {
      modal.classList.remove('ai-modal-visible');
      setTimeout(() => { modal.style.display = 'none'; }, 250);
    }
  }

  function _copyCurrentAnswer() {
    const body = document.getElementById('ai-expand-body');
    if (!body) return;
    const text = body.innerText || body.textContent || '';
    navigator.clipboard.writeText(text)
      .then(() => { _showToast('✅ Jawaban berhasil disalin!'); })
      .catch(() => { _showToast('⚠️ Gagal menyalin'); });
  }

  function _showToast(msg) {
    let t = document.getElementById('ai-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ai-toast';
      t.className = 'ai-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('ai-toast-show');
    setTimeout(() => t.classList.remove('ai-toast-show'), 2500);
  }

  /* ────────────────────────────────────────────────────────────
     CHAT HISTORY DOM
  ──────────────────────────────────────────────────────────── */
  function _getHistoryEl() { return document.getElementById('ai-chat-history'); }

  function _appendUserBubble(question) {
    const el = _getHistoryEl();
    if (!el) return;
    const d = document.createElement('div');
    d.className = 'ai-bubble ai-bubble-user';
    d.innerHTML = `<div class="ai-bubble-label">👤 Anda</div><div>${_escapeHtml(question)}</div>`;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  function _showThinkingBubble() {
    const el = _getHistoryEl();
    if (!el) return;
    const d = document.createElement('div');
    d.className = 'ai-thinking';
    d.id = 'ai-thinking-bubble';
    d.innerHTML = `<span>🌿 AI sedang menganalisis</span><div class="ai-thinking-dots"><span></span><span></span><span></span></div>`;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  function _removeThinkingBubble() {
    const el = document.getElementById('ai-thinking-bubble');
    if (el) el.remove();
  }

  function _appendAIBubble(question, answerHtml, rawAnswer) {
    const el = _getHistoryEl();
    if (!el) return;

    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble ai-bubble-ai';

    // Tombol expand — simpan data sebagai attribute
    const expandId = 'ai-ans-' + Date.now();
    bubble.innerHTML = `
      <div class="ai-bubble-label">
        🤖 AI GeoHutan
        <button class="ai-expand-btn" onclick="GeoHutanAI.expandAnswer('${expandId}')" title="Perbesar / Lihat Penuh">
          ⛶ Perbesar
        </button>
      </div>
      <div class="ai-response-content" id="${expandId}">${answerHtml}</div>`;

    // Simpan raw untuk modal
    bubble.dataset.question = question;
    bubble.dataset.raw = rawAnswer;

    el.appendChild(bubble);

    // Animasi masuk
    requestAnimationFrame(() => bubble.classList.add('ai-bubble-visible'));
    el.scrollTop = el.scrollHeight;
  }

  function _appendErrorBubble(message) {
    const el = _getHistoryEl();
    if (!el) return;
    const d = document.createElement('div');
    d.className = 'ai-error-msg';
    d.innerHTML = `
      <div class="ai-error-icon">⚠️</div>
      <div class="ai-error-text">
        <div style="font-weight:600;margin-bottom:4px;">Gagal menghubungi AI</div>
        <div style="font-size:11px;opacity:0.8;">${_escapeHtml(message)}</div>
        <button class="ai-btn-retry" onclick="GeoHutanAI.retry()">🔄 Coba Lagi</button>
      </div>`;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  /* ────────────────────────────────────────────────────────────
     LOADING STATE
  ──────────────────────────────────────────────────────────── */
  function _setLoading(v) {
    _isLoading = v;
    const s = document.getElementById('ai-btn-send');
    const c = document.getElementById('ai-btn-clear');
    const t = document.getElementById('ai-textarea');
    if (s) { s.disabled = v; s.innerHTML = v ? '<span>⏳</span> Menganalisis...' : '<span>🚀</span> Kirim'; }
    if (c) c.disabled = v;
    if (t) t.disabled = v;
  }

  /* ────────────────────────────────────────────────────────────
     API CALL KE GOOGLE APPS SCRIPT
  ──────────────────────────────────────────────────────────── */
  async function _callAI(question, markerData, roleInfo) {
    const gasUrl = (typeof GAS_WEB_APP_URL !== 'undefined') ? GAS_WEB_APP_URL : '';
    if (!gasUrl) throw new Error('URL Apps Script tidak dikonfigurasi.');

    // Kirim history percakapan agar nyambung (multi-turn)
    const payload = {
      action:    'askAI',
      authToken: (typeof getAuthToken === 'function') ? getAuthToken() : '',
      role:      roleInfo.role,
      question:  question,
      marker:    _cleanMarkerData(markerData),
      dataType:  _currentType || 'unknown',
      history:   _chatHistory.slice(-6)  // max 6 turn terakhir (3 bolak-balik)
    };

    const resp = await fetch(gasUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status} – server tidak merespons.`);

    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'AI tidak merespons. Coba lagi.');
    return json.answer || '';
  }

  /* ────────────────────────────────────────────────────────────
     KIRIM PERTANYAAN
  ──────────────────────────────────────────────────────────── */
  async function _sendQuestion(question) {
    if (_isLoading || !question.trim()) return;
    if (!_currentMarker) { alert('Pilih marker terlebih dahulu.'); return; }

    const roleInfo = _getRoleInfo();
    if (!_canAccessAI()) return;

    _lastQuestion = question;

    // Cek cache (hanya untuk pertanyaan pertama tanpa history)
    const cacheKey = _buildCacheKey(_currentMarker, question);
    const cached   = (_chatHistory.length === 0) ? _getCached(cacheKey) : null;

    _appendUserBubble(question);

    if (cached && cached.answer) {
      const html = _markdownToHtml(cached.answer) +
        '<div class="ai-cache-badge">💾 Dari cache browser</div>';
      _appendAIBubble(question, html, cached.answer);
      _chatHistory.push({ role: 'user',  parts: [{ text: question }] });
      _chatHistory.push({ role: 'model', parts: [{ text: cached.answer }] });
      _clearInput();
      return;
    }

    _setLoading(true);
    _showThinkingBubble();

    try {
      const rawAnswer  = await _callAI(question, _currentMarker, roleInfo);
      _removeThinkingBubble();

      const answerHtml = _markdownToHtml(rawAnswer);
      _appendAIBubble(question, answerHtml, rawAnswer);

      // Update history multi-turn
      _chatHistory.push({ role: 'user',  parts: [{ text: question }] });
      _chatHistory.push({ role: 'model', parts: [{ text: rawAnswer }] });

      // Cache hanya jika fresh (history = 0)
      if (_chatHistory.length <= 2) {
        _setCache(cacheKey, { question, answer: rawAnswer, ts: Date.now() });
      }

      _clearInput();
    } catch (err) {
      _removeThinkingBubble();
      _appendErrorBubble(err.message || 'Terjadi kesalahan tidak diketahui.');
    } finally {
      _setLoading(false);
    }
  }

  function _clearInput() {
    const t = document.getElementById('ai-textarea');
    if (t) { t.value = ''; t.style.height = 'auto'; }
  }

  /* ────────────────────────────────────────────────────────────
     BUILD CARD HTML
  ──────────────────────────────────────────────────────────── */
  function _buildCardHTML(markerData, type) {
    const nama = markerData['Nama Lengkap'] || markerData['Nama'] ||
                 markerData['Unit Kerja']   || markerData['Nama Lokasi'] || '-';
    const kab  = markerData['Kabupaten']   || markerData['Kabupaten/Kota'] ||
                 markerData['_kab']        || '';
    const ctx  = `${nama}${kab ? ' · ' + kab : ''}`;

    const allHints = HINT_QUESTIONS
      .map(q => `<span class="ai-hint-chip" onclick="GeoHutanAI.useHint('${q.replace(/'/g,"\\'")}')">` + q + `</span>`)
      .join('');

    return `
    <div class="ai-assistant-card" id="ai-assistant-card">
      <div class="ai-card-header">
        <div class="ai-icon-pulse">🤖</div>
        <div class="ai-card-title">
          <h4>AI Assistant GeoHutan</h4>
          <span>Powered by Gemini · Analisis Kehutanan</span>
        </div>
        <div class="ai-badge">AI</div>
      </div>
      <div class="ai-card-body">

        <div class="ai-context-info">
          📍 <span><strong>Konteks aktif:</strong> ${_escapeHtml(ctx)}</span>
        </div>

        <div class="ai-chat-history" id="ai-chat-history"></div>

        <div class="ai-divider"></div>

        <div class="ai-hints-wrap">
          <div class="ai-hints-label">💡 Pertanyaan cepat:</div>
          <div class="ai-hints">${allHints}</div>
        </div>

        <div class="ai-input-wrapper">
          <textarea
            id="ai-textarea"
            class="ai-textarea"
            rows="3"
            placeholder="Tanyakan sesuatu mengenai lokasi ini... (Ctrl+Enter untuk kirim)"
            onkeydown="GeoHutanAI.handleKeydown(event)"
            oninput="this.style.height='auto'; this.style.height=this.scrollHeight+'px'"
          ></textarea>
        </div>

        <div class="ai-action-row">
          <button id="ai-btn-send" class="ai-btn-send" onclick="GeoHutanAI.send()">
            <span>🚀</span> Kirim
          </button>
          <button id="ai-btn-clear" class="ai-btn-clear" onclick="GeoHutanAI.clearChat()">
            🗑️ Hapus Chat
          </button>
        </div>

        <div class="ai-footer-note">
          Ctrl+Enter untuk kirim · Jawaban bersifat rekomendasi, bukan keputusan resmi
        </div>
      </div>
    </div>`;
  }

  /* ────────────────────────────────────────────────────────────
     PUBLIC API
  ──────────────────────────────────────────────────────────── */

  function injectCard(type, rowData) {
    if (!_canAccessAI()) return;

    _currentMarker = rowData || {};
    _currentType   = type   || 'unknown';
    _chatHistory   = [];

    const container = document.getElementById('drawer-content');
    if (!container) return;

    const existing = document.getElementById('ai-assistant-card');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = _buildCardHTML(_currentMarker, _currentType);
    container.appendChild(wrapper.firstElementChild);

    setTimeout(() => {
      const ta = document.getElementById('ai-textarea');
      if (ta) ta.focus();
    }, 350);
  }

  function send() {
    const t = document.getElementById('ai-textarea');
    if (!t) return;
    const q = t.value.trim();
    if (!q) { t.focus(); return; }
    _sendQuestion(q);
  }

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); send(); }
  }

  function useHint(question) {
    const t = document.getElementById('ai-textarea');
    if (t) { t.value = question; t.dispatchEvent(new Event('input')); t.focus(); }
  }

  function clearChat() {
    _chatHistory = [];
    const el = _getHistoryEl();
    if (el) { el.innerHTML = ''; el.style.opacity='0'; setTimeout(()=>{el.style.opacity='1';},200); }
    _clearInput();
  }

  function retry() {
    if (!_lastQuestion) return;
    const el = _getHistoryEl();
    if (el) {
      const last = el.lastElementChild;
      if (last && last.classList.contains('ai-error-msg')) last.remove();
      const lb = el.lastElementChild;
      if (lb && lb.classList.contains('ai-bubble-user')) lb.remove();
    }
    // Hapus last dari history juga
    if (_chatHistory.length >= 1 &&
        _chatHistory[_chatHistory.length-1].role === 'user') {
      _chatHistory.pop();
    }
    _sendQuestion(_lastQuestion);
  }

  /**
   * Buka modal expand untuk jawaban tertentu.
   * Dipanggil dari tombol ⛶ Perbesar di setiap bubble AI.
   */
  function expandAnswer(contentId) {
    const contentEl = document.getElementById(contentId);
    if (!contentEl) return;
    const bubble   = contentEl.closest('.ai-bubble-ai');
    const question = bubble ? (bubble.dataset.question || '(Pertanyaan tidak tersimpan)') : '';
    _openModal(question, contentEl.innerHTML);
  }

  function closeModal()   { _closeModal(); }
  function copyAnswer()   { _copyCurrentAnswer(); }

  return {
    injectCard,
    send,
    handleKeydown,
    useHint,
    clearChat,
    retry,
    expandAnswer,
    closeModal,
    copyAnswer,
    canAccess: _canAccessAI
  };

})();
