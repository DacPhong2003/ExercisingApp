/* Chọn hồ sơ (đơn giản): mỗi hồ sơ có dữ liệu riêng trong Firestore. Mật khẩu là tuỳ chọn và chỉ để tránh bấm nhầm. */
(function () {
  'use strict';
  var KEY = 'sotap.cur', NAME = 'sotap.curname';
  var cfg = window.SOTAP_FIREBASE || {};
  var configured = !!(cfg.apiKey && cfg.projectId && String(cfg.apiKey).indexOf('DAN_') !== 0 && String(cfg.projectId).indexOf('DAN_') !== 0);
  var pid = '', curName = '';
  try { pid = localStorage.getItem(KEY) || ''; curName = localStorage.getItem(NAME) || ''; } catch (e) {}
  window.SOTAP_PFX = pid ? 'p:' + pid + ':' : '';
  window.SOTAP_GUEST = !pid;

  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function setPointer(id, name) { try { localStorage.setItem(KEY, id); localStorage.setItem(NAME, name || ''); } catch (e) {} }
  function clearPointer() { try { localStorage.removeItem(KEY); localStorage.removeItem(NAME); } catch (e) {} }

  if (!window.firebase || !configured) {
    window.claude = { use: function () { return Promise.resolve(null); } };
    if (window.SOTAP_GUEST) {
      document.addEventListener('DOMContentLoaded', function () {
        var d = document.createElement('div'); d.id = 'picker';
        d.innerHTML = '<div class="pkw"><h1>Sổ Tập</h1><p class="pkmsg">' + (!window.firebase ? 'Không tải được thư viện Firebase. Kiểm tra mạng rồi mở lại app.' : 'Chưa cấu hình Firebase. Mở tệp firebase-config.js, dán thông tin dự án của bạn vào (xem README), rồi tải lại trang.') + '</p></div>';
        document.body.appendChild(d);
      });
    }
    return;
  }

  firebase.initializeApp(cfg);
  var fs = firebase.firestore();
  try { fs.settings({ ignoreUndefinedProperties: true, experimentalAutoDetectLongPolling: true }); } catch (e) {}
  /* lưu tạm trong máy: mất mạng ở phòng tập vẫn ghi được, có mạng lại thì tự đẩy lên */
  try { var pp = fs.enablePersistence && fs.enablePersistence({ synchronizeTabs: true }); if (pp && pp.catch) pp.catch(function () {}); } catch (e) {}

  /* ---- đã chọn hồ sơ: nối app với dữ liệu của hồ sơ đó ---- */
  if (pid) {
    var root = fs.collection('profiles').doc(pid);
    var shim = {
      collection: function (n) { return root.collection(n); },
      doc: function (path) { var p = path.split('/'); return root.collection(p[0]).doc(p[1]); }
    };
    window.claude = { use: function (n) { return n === 'db' ? Promise.resolve(shim) : Promise.resolve(null); } };
    window.SOTAP_ACCOUNT = { name: curName || 'Hồ sơ', uid: pid, leave: function () { clearPointer(); location.hash = ''; location.reload(); } };
    return;
  }

  /* ---- chưa chọn hồ sơ: màn chọn hồ sơ ---- */
  window.claude = { use: function () { return Promise.resolve(null); } };
  var st = { screen: 'list', list: null, err: '', pick: null, arm: false, note: '' };
  var root0;

  function rnd(n) { var a = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function hashPw(pw, salt) {
    var data = new TextEncoder().encode(salt + ':' + pw);
    if (window.crypto && crypto.subtle) return crypto.subtle.digest('SHA-256', data).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
    var h = 5381; for (var i = 0; i < data.length; i++) h = ((h * 33) ^ data[i]) >>> 0;
    return Promise.resolve('x' + h.toString(16));
  }
  function initial(n) { var m = String(n).trim().match(/\S/); return m ? m[0].toUpperCase() : '?'; }
  function errText(e) {
    var c = e && e.code || '';
    if (c === 'unavailable') return 'Không có mạng. Kiểm tra kết nối rồi thử lại.';
    if (c === 'permission-denied') return 'Firestore từ chối: kiểm tra phần Rules trong README.';
    return 'Có lỗi: ' + (c || (e && e.message) || 'không rõ');
  }
  function render() {
    var h = '<div class="pkw"><h1>Sổ Tập</h1>';
    if (st.screen === 'list') {
      h += '<p class="pksub">Chọn hồ sơ</p>';
      if (st.list === null) h += '<p class="pkmsg">Đang tải danh sách…</p>';
      else if (st.list === false) h += '<p class="pkmsg warn">' + esc(st.err) + '</p><button type="button" class="pkb" data-pk="reload">Thử lại</button>';
      else {
        if (!st.list.length) h += '<p class="pkmsg">Chưa có hồ sơ nào. Tạo hồ sơ đầu tiên của bạn.</p>';
        st.list.forEach(function (p, i) { h += '<button type="button" class="pkp" data-pk="pick" data-i="' + i + '"><span class="pka">' + esc(initial(p.name)) + '</span><span class="pkn">' + esc(p.name) + (p.hash ? ' <span class="pkl" aria-label="có mật khẩu">🔒</span>' : '') + '</span><span class="pkg">›</span></button>'; });
        if (st.note) h += '<p class="pkmsg">' + esc(st.note) + '</p>';
      }
      h += '<button type="button" class="pkb pri" data-pk="new">+ Tạo hồ sơ mới</button>';
    } else if (st.screen === 'pw') {
      h += '<div class="pkc"><span class="pka big">' + esc(initial(st.pick.name)) + '</span><b>' + esc(st.pick.name) + '</b></div>';
      if (st.pick.hash) h += '<label for="pkPw">Mật khẩu</label><input type="password" id="pkPw" autocomplete="off" enterkeyhint="go">';
      h += '<p class="pkmsg warn" id="pkErr" role="status">' + esc(st.err) + '</p>';
      h += '<button type="button" class="pkb pri" data-pk="enter">Vào</button><button type="button" class="pkb" data-pk="back">Chọn hồ sơ khác</button>';
      h += '<button type="button" class="pkb del' + (st.arm ? ' arm' : '') + '" data-pk="del">' + (st.arm ? 'Chạm lại để xoá hồ sơ này' : 'Xoá hồ sơ này') + '</button>';
    } else if (st.screen === 'new') {
      h += '<p class="pksub">Tạo hồ sơ mới</p><label for="pkNm">Tên hồ sơ</label><input id="pkNm" autocomplete="off" maxlength="24" placeholder="VD: Phong">';
      h += '<label for="pkPw">Mật khẩu (không bắt buộc)</label><input type="password" id="pkPw" autocomplete="new-password" placeholder="Để trống nếu không cần">';
      h += '<p class="pkmsg">Mật khẩu chỉ để tránh bấm nhầm hồ sơ của nhau. Quên mật khẩu thì không lấy lại được.</p>';
      h += '<p class="pkmsg warn" id="pkErr" role="status">' + esc(st.err) + '</p><button type="button" class="pkb pri" data-pk="create">Tạo và vào</button><button type="button" class="pkb" data-pk="back">Quay lại</button>';
    }
    root0.innerHTML = h + '</div>';
    var f = root0.querySelector('#pkNm') || root0.querySelector('#pkPw');
    if (f && st.screen !== 'list') f.focus();
  }
  function showErr(m) { st.err = m; var e = $('#pkErr'); if (e) e.textContent = m; }
  function setBusy(sel, on, label) {
    var b = root0.querySelector(sel); if (!b) return;
    if (on) { b.setAttribute('data-l', b.textContent); b.textContent = label; b.disabled = true; }
    else { b.textContent = b.getAttribute('data-l') || b.textContent; b.disabled = false; }
  }
  function loadList() {
    st.list = null; st.err = ''; st.note = ''; render();
    var gone = false, tm = setTimeout(function () { if (!gone) { gone = true; fallback({ code: 'unavailable' }); } }, 12000);
    function fill(snap, note) {
      var arr = []; snap.docs.forEach(function (d) { var v = d.data(); if (v && v.name) arr.push({ id: d.id, name: v.name, hash: v.hash || '', salt: v.salt || '' }); });
      arr.sort(function (a, b) { return a.name.localeCompare(b.name, 'vi'); });
      st.list = arr; st.note = note || ''; render();
    }
    function fallback(e) {
      fs.collection('profiles').get({ source: 'cache' }).then(function (snap) {
        if (snap.docs.length) fill(snap, 'Đang hiện danh sách lưu trong máy vì chưa kết nối được.');
        else { st.list = false; st.err = errText(e); render(); }
      }, function () { st.list = false; st.err = errText(e); render(); });
    }
    fs.collection('profiles').get({ source: 'server' }).then(function (snap) {
      if (gone) return; gone = true; clearTimeout(tm); fill(snap);
    }, function (e) { if (gone) return; gone = true; clearTimeout(tm); fallback(e); });
  }
  function enter(id, name) { setPointer(id, name); location.hash = ''; location.reload(); }
  function tryEnter() {
    var p = st.pick;
    if (!p.hash) return enter(p.id, p.name);
    var pw = ($('#pkPw') || {}).value || '';
    if (!pw) { showErr('Nhập mật khẩu.'); return; }
    hashPw(pw, p.salt).then(function (h) { if (h === p.hash) enter(p.id, p.name); else showErr('Sai mật khẩu.'); });
  }
  function create() {
    var nm = (($('#pkNm') || {}).value || '').trim(), pw = ($('#pkPw') || {}).value || '';
    if (nm.length < 2) { showErr('Tên cần ít nhất 2 ký tự.'); return; }
    var exists = (st.list || []).some(function (p) { return p.name.toLowerCase() === nm.toLowerCase(); });
    if (exists) { showErr('Đã có hồ sơ tên này. Chọn tên khác.'); return; }
    showErr(''); setBusy('[data-pk="create"]', true, 'Đang tạo…');
    var ref = fs.collection('profiles').doc(), salt = pw ? rnd(8) : '';
    (pw ? hashPw(pw, salt) : Promise.resolve('')).then(function (h) {
      var doc = { name: nm, salt: salt, hash: h, createdAt: new Date().toISOString() };
      var done = false, t = setTimeout(function () { if (!done) { done = true; setBusy('[data-pk="create"]', false); showErr('Không có mạng nên chưa tạo được. Thử lại khi có mạng.'); } }, 10000);
      return ref.set(doc).then(function () { if (done) return; done = true; clearTimeout(t); enter(ref.id, nm); });
    }).catch(function (e) { setBusy('[data-pk="create"]', false); showErr(errText(e)); });
  }
  function del() {
    var p = st.pick;
    if (p.hash) { var pw = ($('#pkPw') || {}).value || ''; if (!pw) { showErr('Nhập mật khẩu của hồ sơ để xoá.'); return; } }
    if (!st.arm) { st.arm = true; var b = root0.querySelector('[data-pk="del"]'); if (b) { b.textContent = 'Chạm lại để xoá hồ sơ này'; b.classList.add('arm'); } setTimeout(function () { if (st.arm && st.screen === 'pw') { st.arm = false; var b2 = root0.querySelector('[data-pk="del"]'); if (b2) { b2.textContent = 'Xoá hồ sơ này'; b2.classList.remove('arm'); } } }, 3000); return; }
    (p.hash ? hashPw(($('#pkPw') || {}).value, p.salt) : Promise.resolve('')).then(function (h) {
      if (p.hash && h !== p.hash) { st.arm = false; showErr('Sai mật khẩu.'); render(); return; }
      return fs.collection('profiles').doc(p.id).delete().then(function () { st.screen = 'list'; st.pick = null; st.arm = false; loadList(); }, function (e) { showErr(errText(e)); });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    root0 = document.createElement('div'); root0.id = 'picker'; document.body.appendChild(root0);
    root0.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-pk]') : null;
      if (!b || b.disabled) return;
      var a = b.getAttribute('data-pk');
      if (a === 'pick') { st.pick = st.list[+b.getAttribute('data-i')]; st.err = ''; st.arm = false; if (!st.pick.hash) { enter(st.pick.id, st.pick.name); return; } st.screen = 'pw'; render(); }
      else if (a === 'new') { st.screen = 'new'; st.err = ''; st.pick = null; render(); }
      else if (a === 'back') { st.screen = 'list'; st.err = ''; st.pick = null; st.arm = false; render(); }
      else if (a === 'reload') loadList();
      else if (a === 'enter') tryEnter();
      else if (a === 'create') create();
      else if (a === 'del') del();
    });
    root0.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var b = root0.querySelector('[data-pk="enter"],[data-pk="create"]');
      if (b && !b.disabled) b.click();
    });
    loadList();
  });
})();
