// ============================================
// LMS — Learning Management System (guru/admin + siswa)
// Dimuat setelah app.js; memakai helper global: $, esc, api, toast, mkSection, siswa, isAktif, urutKelas, empty, hapusFn, done, USER
// ============================================
(function () {
  'use strict';
  const LBL = { info: 'Pengumuman', materi: 'Materi', tugas: 'Tugas', kuis: 'Kuis' };
  const TABS_G = [['info', 'Pengumuman', 'megaphone'], ['materi', 'Materi', 'journal-text'], ['tugas', 'Tugas', 'clipboard-check'], ['kuis', 'Kuis', 'patch-question'], ['nilai', 'Nilai', 'bar-chart-line']];
  const TABS_S = TABS_G.map(t => t.slice());
  let tabG = 'info', tabS = 'info', data = [], form = { jenis: '', id: null }, BEL = null, qUid = 0;
  let quiz = null;   // { id, end, timer, jml, selesai }

  const safeUrl = u => /^https?:\/\/\S+$/i.test(String(u || '')) ? String(u) : '';
  const link = (u, t) => safeUrl(u) ? `<a class="btn btn-soft btn-sm" href="${esc(safeUrl(u))}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> ${t || 'Buka tautan'}</a>` : '';
  const waktu = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : (s ? esc(s) : '-'); };
  const kelasChip = k => `<span class="chip">${k === 'Semua' ? 'Semua kelas' : esc(k)}</span>`;
  const teks = s => `<div class="lms-teks">${esc(s)}</div>`;
  const kelasList = () => [...new Set((typeof siswa !== 'undefined' ? siswa : []).map(s => s.kelas))].sort(urutKelas);
  const nilaiBadge = n => n === '' || n === null || n === undefined ? '-' : `<b>${esc(n)}</b>`;
  function modal(id, size, inner, staticBd) {
    const d = document.createElement('div'); d.className = 'modal fade'; d.id = id; d.tabIndex = -1;
    if (staticBd) { d.setAttribute('data-bs-backdrop', 'static'); d.setAttribute('data-bs-keyboard', 'false'); }
    d.innerHTML = `<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}"><div class="modal-content sis-scope">${inner}</div></div>`;
    document.body.appendChild(d); return d;
  }
  const show = id => bootstrap.Modal.getOrCreateInstance($(id)).show();
  const hide = id => { const m = bootstrap.Modal.getInstance($(id)); if (m) m.hide(); };
  const tabsHTML = (id, tabs, cur) => tabs.map(t => `<button class="pill-tab${t[0] === cur ? ' active' : ''}" data-t="${t[0]}"><i class="bi bi-${t[2]}"></i> ${t[1]}</button>`).join('');

  // =========================================================
  // GURU / ADMIN
  // =========================================================
  function mkGuru() {
    mkSection('lms', `
      <div class="sis-card">
        <div class="sis-title">LMS &mdash; Pembelajaran Daring</div>
        <div class="sis-sub">Bagikan pengumuman, materi, tugas, dan kuis pilihan ganda. Siswa masuk dari halaman login dengan NIS dan PIN (tanggal lahir DDMMYYYY).</div>
        <div class="row g-3 mt-1"><div class="col-12 col-md-4"><label class="form-label" for="lmsKelas">Kelas</label><select id="lmsKelas" class="form-select"></select></div></div>
        <div class="d-flex gap-2 flex-wrap mt-3" id="lmsTabs">${tabsHTML('lmsTabs', TABS_G, tabG)}</div>
      </div>
      <div class="sis-card" id="lmsPane"></div>`);
    $('section-lms').classList.add('sis-scope');
    $('lmsTabs').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tabG = b.dataset.t; document.querySelectorAll('#lmsTabs [data-t]').forEach(x => x.classList.toggle('active', x === b)); renderG(); };
    $('lmsKelas').onchange = renderG;
    $('lmsPane').addEventListener('click', onPane);

    modal('mdlLms', 'modal-lg modal-fullscreen-sm-down', `
      <div class="modal-header"><h5 class="modal-title fw-bold" id="lmsFormTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button></div>
      <form id="lmsForm" novalidate><div class="modal-body" id="lmsFormBody"></div>
      <div class="modal-footer"><button type="button" class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button type="submit" class="btn btn-sky"><i class="bi bi-check2-circle"></i> Simpan</button></div></form>`);
    $('lmsForm').onsubmit = submitForm;
    $('lmsFormBody').addEventListener('click', e => {
      if (e.target.closest('#qAdd')) addQ(); const r = e.target.closest('[data-rmq]');
      if (r) { r.closest('.qb').remove(); renumQ(); }
    });

    modal('mdlLmsKumpul', 'modal-xl modal-fullscreen-lg-down', `
      <div class="modal-header"><div><h5 class="modal-title fw-bold" id="kmpJudul"></h5><div class="small text-muted" id="kmpSub"></div></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button></div>
      <div class="modal-body" id="kmpBody"></div>`);
    $('kmpBody').addEventListener('click', e => {
      const b = e.target.closest('[data-nilai]'); if (!b) return; const tr = b.closest('tr');
      api('lmsNilai', [{ id: b.dataset.nilai, nilai: tr.querySelector('.k-n').value, catatan: tr.querySelector('.k-c').value }], r => toast(r.message, r.success ? 'success' : 'danger'), false);
    });
    modal('mdlLmsHasil', 'modal-lg modal-fullscreen-md-down', `
      <div class="modal-header"><div><h5 class="modal-title fw-bold" id="hslJudul"></h5><div class="small text-muted" id="hslSub"></div></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button></div>
      <div class="modal-body" id="hslBody"></div>`);
  }
  function kelasOpsiG() {
    const sel = $('lmsKelas'), cur = sel.value;
    sel.innerHTML = '<option value="Semua">Semua Kelas</option>' + kelasList().map(k => `<option>${esc(k)}</option>`).join('');
    if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
  }
  function loadLms() { kelasOpsiG(); renderG(); }
  function renderG() {
    const pane = $('lmsPane');
    if (tabG === 'nilai') return loadNilai();
    pane.innerHTML = '<div class="text-muted small">Memuat...</div>';
    api('lmsList', [{ jenis: tabG, kelas: $('lmsKelas').value }], r => {
      if (!r.success) { pane.innerHTML = ''; return toast(r.message, 'danger'); }
      data = r.data;
      const head = { info: ['Tanggal', 'Kelas', 'Judul', 'Isi'], materi: ['Tanggal', 'Kelas', 'Mapel', 'Judul', 'Tautan'], tugas: ['Tanggal', 'Kelas', 'Mapel', 'Judul', 'Tenggat', 'Terkumpul'], kuis: ['Tanggal', 'Kelas', 'Mapel', 'Judul', 'Durasi / Soal', 'Status', 'Selesai'] }[tabG];
      const row = x => {
        const c = { info: [waktu(x.tgl), kelasChip(x.kelas), `<b>${esc(x.judul)}</b>`, `<span class="lms-clip">${esc(x.isi)}</span>`],
          materi: [waktu(x.tgl), kelasChip(x.kelas), esc(x.mapel), `<b>${esc(x.judul)}</b>`, link(x.url) || '-'],
          tugas: [waktu(x.tgl), kelasChip(x.kelas), esc(x.mapel), `<b>${esc(x.judul)}</b>`, x.tenggat ? waktu(x.tenggat) : 'Tanpa tenggat', `<b>${x.n}</b> siswa`],
          kuis: [waktu(x.tgl), kelasChip(x.kelas), esc(x.mapel), `<b>${esc(x.judul)}</b>`, `${esc(x.durasi)} mnt / ${x.nSoal} soal`, `<span class="badge text-bg-${x.status === 'Aktif' ? 'success' : 'secondary'}">${esc(x.status)}</span>`, `<b>${x.n}</b> siswa`] }[tabG];
        const ex = tabG === 'tugas' ? `<button class="btn btn-soft btn-sm" data-act="kumpul" data-id="${esc(x.id)}"><i class="bi bi-card-checklist"></i> Nilai</button> `
          : tabG === 'kuis' ? `<button class="btn btn-soft btn-sm" data-act="hasil" data-id="${esc(x.id)}"><i class="bi bi-list-check"></i> Hasil</button> ` : '';
        return `<tr>${c.map(v => `<td>${v}</td>`).join('')}<td class="text-end text-nowrap">${ex}<button class="ico-btn2" data-act="edit" data-id="${esc(x.id)}" title="Ubah" aria-label="Ubah"><i class="bi bi-pencil"></i></button>
          <button class="ico-btn2 del" data-act="hapus" data-id="${esc(x.id)}" title="Hapus" aria-label="Hapus"><i class="bi bi-trash3"></i></button></td></tr>`;
      };
      pane.innerHTML = `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><div class="sis-title fs-5">${LBL[tabG]}</div>
        <button class="btn btn-sky" data-act="tambah"><i class="bi bi-plus-lg"></i> Tambah ${LBL[tabG]}</button></div>
        <div class="table-responsive"><table class="table sis-table mb-0" style="min-width:760px"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}<th></th></tr></thead>
        <tbody>${data.length ? data.map(row).join('') : `<tr><td colspan="${head.length + 1}" class="text-center text-muted py-4">Belum ada ${LBL[tabG].toLowerCase()}.</td></tr>`}</tbody></table></div>`;
    }, false);
  }
  function onPane(e) {
    const b = e.target.closest('button[data-act]'); if (!b) return; const a = b.dataset.act, id = b.dataset.id, x = data.find(v => v.id === id);
    if (a === 'tambah') return bukaForm(tabG, null);
    if (!x) return;
    if (a === 'edit') bukaForm(tabG, x);
    if (a === 'kumpul') bukaKumpul(id);
    if (a === 'hasil') bukaHasil(id);
    if (a === 'hapus') {
      hapusFn = () => api('lmsHapus', [{ jenis: tabG, id }], r => { done(r); if (r.success) renderG(); });
      $('hapusTeks').textContent = `Hapus ${LBL[tabG].toLowerCase()} "${x.judul}"?` + (tabG === 'tugas' ? ' Semua jawaban & nilai siswa pada tugas ini ikut terhapus.' : tabG === 'kuis' ? ' Semua hasil siswa pada kuis ini ikut terhapus.' : '');
      show('mdlHapus');
    }
  }

  // ---- Form tambah/ubah
  function field(id, label, input, col) { return `<div class="${col || 'col-12'}"><label class="form-label" for="${id}">${label}</label>${input}</div>`; }
  function bukaForm(jenis, x) {
    form = { jenis, id: x ? x.id : null }; qUid = 0;
    $('lmsFormTitle').textContent = (x ? 'Ubah ' : 'Tambah ') + LBL[jenis];
    const kls = '<option value="Semua">Semua kelas</option>' + kelasList().map(k => `<option>${esc(k)}</option>`).join('');
    let h = field('lf_kelas', 'Kelas tujuan <span class="text-danger">*</span>', `<select id="lf_kelas" class="form-select">${kls}</select>`, jenis === 'info' ? 'col-12' : 'col-12 col-md-5');
    if (jenis !== 'info') h += field('lf_mapel', 'Mata pelajaran <span class="text-danger">*</span>', '<input id="lf_mapel" class="form-control" maxlength="60" placeholder="Contoh: Matematika" required>', 'col-12 col-md-7');
    h += field('lf_judul', 'Judul <span class="text-danger">*</span>', '<input id="lf_judul" class="form-control" maxlength="150" required>');
    if (jenis !== 'kuis') h += field('lf_isi', jenis === 'info' ? 'Isi pengumuman <span class="text-danger">*</span>' : jenis === 'tugas' ? 'Instruksi tugas' : 'Deskripsi materi', '<textarea id="lf_isi" class="form-control" rows="4" maxlength="3000"></textarea>');
    if (jenis === 'materi' || jenis === 'tugas') h += field('lf_url', 'Tautan (Google Drive / YouTube / lainnya)', '<input id="lf_url" class="form-control" type="url" maxlength="500" placeholder="https://...">') + '<div class="col-12 small text-muted mt-n2">Pastikan akses tautan diatur "Siapa saja yang memiliki link" agar siswa bisa membukanya.</div>';
    if (jenis === 'tugas') h += field('lf_tenggat', 'Tenggat pengumpulan (opsional)', '<input id="lf_tenggat" class="form-control" type="datetime-local">', 'col-12 col-md-6');
    if (jenis === 'kuis') h += field('lf_durasi', 'Durasi (menit) <span class="text-danger">*</span>', '<input id="lf_durasi" class="form-control" type="number" min="1" max="180" value="30" required>', 'col-6 col-md-3')
      + field('lf_status', 'Status', '<select id="lf_status" class="form-select"><option>Aktif</option><option>Tutup</option></select>', 'col-6 col-md-3')
      + `<div class="col-12"><div class="d-flex justify-content-between align-items-center mb-2"><label class="form-label mb-0">Soal pilihan ganda</label><button type="button" class="btn btn-soft btn-sm" id="qAdd"><i class="bi bi-plus-lg"></i> Tambah soal</button></div><div id="qList"></div><small class="text-muted">Isi minimal 2 pilihan dan pilih satu kunci jawaban (tombol bulat). Pilihan kosong diabaikan. Siswa hanya dapat mengerjakan satu kali.</small></div>`;
    $('lmsFormBody').innerHTML = `<div class="row g-3">${h}</div>`;
    const set = (id, v) => { if ($(id)) $(id).value = v == null ? '' : v; };
    if (x) {
      set('lf_kelas', x.kelas); set('lf_mapel', x.mapel); set('lf_judul', x.judul); set('lf_isi', x.isi); set('lf_url', x.url); set('lf_tenggat', x.tenggat); set('lf_durasi', x.durasi); set('lf_status', x.status);
      if (jenis === 'kuis') { let s = []; try { s = JSON.parse(x.soal); } catch (e) {} s.forEach(addQ); }
    } else if (jenis === 'kuis') addQ();
    if ($('lf_kelas') && !x) { const k = $('lmsKelas').value; if ([...$('lf_kelas').options].some(o => o.value === k)) $('lf_kelas').value = k; }
    show('mdlLms');
  }
  function addQ(s) {
    const uid = ++qUid, d = document.createElement('div'); d.className = 'qb';
    d.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-2"><b class="qn"></b><button type="button" class="btn btn-soft btn-sm" data-rmq title="Hapus soal"><i class="bi bi-trash3"></i></button></div>
      <textarea class="form-control mb-2 q-q" rows="2" maxlength="500" placeholder="Tulis pertanyaan"></textarea>
      ${[0, 1, 2, 3].map(i => `<div class="input-group mb-1"><span class="input-group-text"><input class="form-check-input mt-0 q-k" type="radio" name="qk${uid}" value="${i}" aria-label="Kunci ${'ABCD'[i]}"><span class="ms-2">${'ABCD'[i]}</span></span><input class="form-control q-o" maxlength="200" placeholder="Pilihan ${'ABCD'[i]}"></div>`).join('')}`;
    $('qList').appendChild(d);
    if (s && s.q) { d.querySelector('.q-q').value = s.q; d.querySelectorAll('.q-o').forEach((el, i) => { el.value = s.o[i] || ''; }); const r = d.querySelectorAll('.q-k')[s.k]; if (r) r.checked = true; }
    renumQ();
  }
  const renumQ = () => document.querySelectorAll('#qList .qb .qn').forEach((el, i) => { el.textContent = 'Soal ' + (i + 1); });
  function kumpulSoal() {
    const out = [], bl = [...document.querySelectorAll('#qList .qb')];
    for (let i = 0; i < bl.length; i++) {
      const q = bl[i].querySelector('.q-q').value.trim(), os = [...bl[i].querySelectorAll('.q-o')].map(e => e.value.trim()), kr = bl[i].querySelector('.q-k:checked');
      const idx = os.map((t, j) => t ? j : -1).filter(j => j >= 0), k = kr ? idx.indexOf(+kr.value) : -1;
      if (!q || idx.length < 2 || k < 0) { toast('Soal ' + (i + 1) + ' belum lengkap: isi pertanyaan, minimal 2 pilihan, dan pilih kunci jawaban pada pilihan yang terisi.', 'warning'); return null; }
      out.push({ q, o: idx.map(j => os[j]), k });
    }
    if (!out.length) { toast('Tambahkan minimal 1 soal.', 'warning'); return null; }
    return out;
  }
  function submitForm(e) {
    e.preventDefault(); const j = form.jenis, v = id => $(id) ? $(id).value.trim() : '';
    const f = { id: form.id || '', kelas: v('lf_kelas'), judul: v('lf_judul') };
    if (!f.judul) return toast('Judul wajib diisi.', 'warning');
    if (j !== 'kuis') f.isi = v('lf_isi');
    if (j !== 'info') { f.mapel = v('lf_mapel'); if (!f.mapel) return toast('Mata pelajaran wajib diisi.', 'warning'); }
    if (j === 'materi' || j === 'tugas') f.url = v('lf_url');
    if (j === 'tugas') f.tenggat = v('lf_tenggat');
    if (j === 'kuis') { f.durasi = v('lf_durasi'); f.status = v('lf_status'); f.soal = kumpulSoal(); if (!f.soal) return; }
    api('lmsSimpan', [{ jenis: j, f }], r => { toast(r.message, r.success ? 'success' : 'danger'); if (r.success) { hide('mdlLms'); renderG(); } });
  }

  // ---- Pengumpulan tugas & penilaian
  const belumHTML = a => a.length ? `<div class="mt-3"><b class="small">Belum mengumpulkan / mengerjakan (${a.length})</b><div class="d-flex flex-wrap gap-1 mt-1">${a.map(s => `<span class="chip" title="${esc(s.kelas)}">${esc(s.nama)} <small>(${esc(s.kelas)})</small></span>`).join('')}</div></div>` : '<div class="mt-3 small text-success"><i class="bi bi-check-circle-fill"></i> Semua siswa sudah selesai.</div>';
  function bukaKumpul(id) {
    $('kmpJudul').textContent = 'Pengumpulan Tugas'; $('kmpSub').textContent = ''; $('kmpBody').innerHTML = '<div class="text-muted small">Memuat...</div>'; show('mdlLmsKumpul');
    api('lmsKumpulList', [{ tugasId: id }], r => {
      if (!r.success) { hide('mdlLmsKumpul'); return toast(r.message, 'danger'); }
      const d = r.data; $('kmpJudul').textContent = d.tugas.judul; $('kmpSub').textContent = `${d.tugas.mapel} • ${d.tugas.kelas === 'Semua' ? 'Semua kelas' : 'Kelas ' + d.tugas.kelas}${d.tugas.tenggat ? ' • Tenggat ' + String(waktu(d.tugas.tenggat)) : ''}`;
      $('kmpBody').innerHTML = `<div class="table-responsive"><table class="table sis-table mb-0" style="min-width:860px"><thead><tr><th>Siswa</th><th>Dikumpulkan</th><th>Jawaban</th><th style="width:100px">Nilai</th><th>Catatan</th><th></th></tr></thead><tbody>`
        + (d.kumpul.length ? d.kumpul.map(k => `<tr><td><b>${esc(k.nama)}</b><div class="small text-muted">${esc(k.kelas)}</div></td><td class="small">${waktu(k.waktu)}</td>
          <td>${k.jawaban ? teks(k.jawaban) : ''}${link(k.url, 'Buka hasil kerja')}</td>
          <td><input class="form-control k-n" type="number" min="0" max="100" value="${esc(k.nilai)}" placeholder="0-100"></td>
          <td><input class="form-control k-c" maxlength="500" value="${esc(k.catatan)}" placeholder="Catatan untuk siswa"></td>
          <td><button class="btn btn-sky btn-sm" data-nilai="${esc(k.id)}"><i class="bi bi-check2"></i> Simpan</button></td></tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted py-4">Belum ada yang mengumpulkan.</td></tr>')
        + `</tbody></table></div>` + belumHTML(d.belum);
    }, false);
  }
  function bukaHasil(id) {
    $('hslJudul').textContent = 'Hasil Kuis'; $('hslSub').textContent = ''; $('hslBody').innerHTML = '<div class="text-muted small">Memuat...</div>'; show('mdlLmsHasil');
    api('lmsHasilKuis', [{ kuisId: id }], r => {
      if (!r.success) { hide('mdlLmsHasil'); return toast(r.message, 'danger'); }
      const d = r.data, sk = d.hasil.map(h => Number(h.skor) || 0), rata = sk.length ? Math.round(sk.reduce((a, b) => a + b, 0) / sk.length * 10) / 10 : '-';
      $('hslJudul').textContent = d.kuis.judul; $('hslSub').textContent = `${d.kuis.mapel} • ${d.hasil.length} siswa selesai • Rata-rata ${rata}`;
      $('hslBody').innerHTML = `<div class="table-responsive"><table class="table sis-table mb-0" style="min-width:560px"><thead><tr><th>Siswa</th><th>Kelas</th><th>Benar</th><th>Skor</th><th>Waktu selesai</th></tr></thead><tbody>`
        + (d.hasil.length ? d.hasil.map(h => `<tr><td><b>${esc(h.nama)}</b></td><td>${esc(h.kelas)}</td><td>${esc(h.benar)} / ${esc(h.total)}</td><td><b>${esc(h.skor)}</b></td><td class="small">${waktu(h.waktu)}</td></tr>`).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada yang mengerjakan.</td></tr>')
        + `</tbody></table></div>` + belumHTML(d.belum);
    }, false);
  }
  function loadNilai() {
    const pane = $('lmsPane'); pane.innerHTML = '<div class="text-muted small">Memuat...</div>';
    api('lmsRekapNilai', [{ kelas: $('lmsKelas').value }], r => {
      if (!r.success) { pane.innerHTML = ''; return toast(r.message, 'danger'); }
      const n = v => v === null ? '-' : `<b>${v}</b>`;
      pane.innerHTML = `<div class="sis-title fs-5 mb-1">Rekap Nilai</div><div class="sis-sub mb-3">Nilai akhir = rata-rata dari rata-rata nilai tugas (yang sudah dinilai) dan rata-rata skor kuis.</div>
        <div class="table-responsive"><table class="table sis-table mb-0" style="min-width:760px"><thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Tugas dinilai</th><th>Rata&sup2; Tugas</th><th>Kuis selesai</th><th>Rata&sup2; Kuis</th><th>Nilai Akhir</th></tr></thead><tbody>`
        + (r.data.length ? r.data.map((x, i) => `<tr><td>${i + 1}</td><td><b>${esc(x.nama)}</b></td><td>${esc(x.kelas)}</td><td>${x.tugasN} / ${x.tugasTotal}</td><td>${n(x.tugasAvg)}</td><td>${x.kuisN} / ${x.kuisTotal}</td><td>${n(x.kuisAvg)}</td><td>${n(x.akhir)}</td></tr>`).join('') : '<tr><td colspan="8" class="text-center text-muted py-4">Tidak ada siswa.</td></tr>')
        + `</tbody></table></div>`;
    }, false);
  }

  // =========================================================
  // SISWA
  // =========================================================
  function mkSiswa() {
    mkSection('belajar', `
      <div class="sis-card">
        <div class="sis-title">Belajar</div>
        <div class="sis-sub" id="belSub">Memuat...</div>
        <div class="d-flex gap-2 flex-wrap mt-3" id="belTabs">${tabsHTML('belTabs', TABS_S, tabS)}</div>
      </div>
      <div id="belPane"></div>`);
    $('section-belajar').classList.add('sis-scope');
    $('belTabs').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tabS = b.dataset.t; document.querySelectorAll('#belTabs [data-t]').forEach(x => x.classList.toggle('active', x === b)); renderS(); };
    $('belPane').addEventListener('click', onBel);

    modal('mdlBelTugas', 'modal-lg modal-fullscreen-sm-down', `
      <div class="modal-header"><h5 class="modal-title fw-bold" id="btJudul"></h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button></div>
      <div class="modal-body"><div id="btInfo" class="mb-3"></div>
        <label class="form-label" for="btJawab">Jawaban</label><textarea id="btJawab" class="form-control mb-3" rows="5" maxlength="3000" placeholder="Tulis jawaban di sini"></textarea>
        <label class="form-label" for="btUrl">Tautan hasil kerja (opsional)</label><input id="btUrl" class="form-control" type="url" maxlength="500" placeholder="https://drive.google.com/...">
        <small class="text-muted d-block mt-1">Jika mengunggah ke Google Drive, atur akses "Siapa saja yang memiliki link".</small></div>
      <div class="modal-footer"><button type="button" class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button type="button" class="btn btn-sky" id="btKirim"><i class="bi bi-send-fill"></i> Kumpulkan</button></div>`);
    $('btKirim').onclick = () => {
      const id = $('btKirim').dataset.id;
      api('lmsKumpul', [{ tugasId: id, jawaban: $('btJawab').value, url: $('btUrl').value }], r => { toast(r.message, r.success ? 'success' : 'danger'); if (r.success) { hide('mdlBelTugas'); loadBelajar(); } });
    };

    modal('mdlKuis', 'modal-lg modal-fullscreen-sm-down', `
      <div class="modal-header"><div><h5 class="modal-title fw-bold" id="kzJudul"></h5><div class="small text-muted" id="kzSub"></div></div><div class="kz-timer d-none" id="kzTimer">00:00</div></div>
      <div class="modal-body" id="kzBody"></div>
      <div class="modal-footer" id="kzFoot"></div>`, true);
  }
  function loadBelajar() {
    api('lmsSiswaBoot', [{}], r => {
      if (!r.success) return toast(r.message, 'danger');
      BEL = r.data; $('belSub').innerHTML = `<b>${esc(BEL.nama)}</b> &bull; Kelas ${esc(BEL.kelas)}`; renderS();
    }, false);
  }
  const empS = t => `<div class="sis-card text-center text-muted">${t}</div>`;
  function renderS() {
    const pane = $('belPane'); if (!BEL) return pane.innerHTML = empS('Memuat...');
    let h = '';
    if (tabS === 'info') h = BEL.info.length ? BEL.info.map(x => `<div class="sis-card lms-item"><div class="d-flex justify-content-between flex-wrap gap-2"><b>${esc(x.judul)}</b><small class="text-muted">${waktu(x.tgl)} &bull; ${esc(x.pembuat)}</small></div>${teks(x.isi)}</div>`).join('') : empS('Belum ada pengumuman.');
    if (tabS === 'materi') h = BEL.materi.length ? BEL.materi.map(x => `<div class="sis-card lms-item"><div class="d-flex justify-content-between flex-wrap gap-2"><div><span class="chip">${esc(x.mapel)}</span> <b class="ms-1">${esc(x.judul)}</b></div><small class="text-muted">${waktu(x.tgl)} &bull; ${esc(x.pembuat)}</small></div>${x.isi ? teks(x.isi) : ''}<div class="mt-2">${link(x.url, 'Buka materi')}</div></div>`).join('') : empS('Belum ada materi.');
    if (tabS === 'tugas') h = BEL.tugas.length ? BEL.tugas.map(x => {
      const s = x.sub, dinilai = s && s.nilai !== '', st = dinilai ? `<span class="badge text-bg-success">Nilai ${esc(s.nilai)}</span>` : s ? '<span class="badge text-bg-info">Sudah dikumpulkan</span>' : x.tutup ? '<span class="badge text-bg-danger">Tenggat lewat</span>' : '<span class="badge text-bg-warning">Belum dikumpulkan</span>';
      const aksi = dinilai || (x.tutup) ? '' : `<button class="btn btn-sky btn-sm" data-act="tugas" data-id="${esc(x.id)}"><i class="bi bi-pencil-square"></i> ${s ? 'Ubah jawaban' : 'Kerjakan & kumpulkan'}</button>`;
      return `<div class="sis-card lms-item"><div class="d-flex justify-content-between flex-wrap gap-2"><div><span class="chip">${esc(x.mapel)}</span> <b class="ms-1">${esc(x.judul)}</b></div>${st}</div>
        <div class="small text-muted mb-2">Tenggat: ${x.tenggat ? waktu(x.tenggat) : 'tanpa tenggat'} &bull; ${esc(x.pembuat)}</div>${x.isi ? teks(x.isi) : ''}
        <div class="d-flex gap-2 flex-wrap mt-2">${link(x.url, 'Lampiran tugas')}${aksi}</div>
        ${s ? `<div class="lms-sub mt-3"><div class="small text-muted">Jawaban Anda (${waktu(s.waktu)})</div>${s.jawaban ? teks(s.jawaban) : ''}${link(s.url, 'Hasil kerja')}${s.catatan ? `<div class="mt-2"><b class="small">Catatan guru:</b> ${esc(s.catatan)}</div>` : ''}</div>` : ''}</div>`;
    }).join('') : empS('Belum ada tugas.');
    if (tabS === 'kuis') h = BEL.kuis.length ? BEL.kuis.map(x => {
      const hs = x.hasil, st = hs ? `<span class="badge text-bg-success">Skor ${esc(hs.skor)}</span>` : x.status === 'Aktif' ? '<span class="badge text-bg-warning">Belum dikerjakan</span>' : '<span class="badge text-bg-secondary">Ditutup</span>';
      return `<div class="sis-card lms-item"><div class="d-flex justify-content-between flex-wrap gap-2"><div><span class="chip">${esc(x.mapel)}</span> <b class="ms-1">${esc(x.judul)}</b></div>${st}</div>
        <div class="small text-muted mb-2">${x.nSoal} soal pilihan ganda &bull; ${esc(x.durasi)} menit &bull; ${esc(x.pembuat)}</div>
        ${hs ? `<div>Benar <b>${esc(hs.benar)}</b> dari <b>${esc(hs.total)}</b> soal &bull; selesai ${waktu(hs.waktu)}</div>` : x.status === 'Aktif' ? `<button class="btn btn-sky btn-sm" data-act="kuis" data-id="${esc(x.id)}"><i class="bi bi-play-fill"></i> Mulai kuis</button>` : ''}</div>`;
    }).join('') : empS('Belum ada kuis.');
    if (tabS === 'nilai') {
      const tg = BEL.tugas.filter(x => x.sub && x.sub.nilai !== ''), ku = BEL.kuis.filter(x => x.hasil);
      const avg = a => a.length ? Math.round(a.reduce((p, q) => p + q, 0) / a.length * 10) / 10 : null, a = avg(tg.map(x => Number(x.sub.nilai))), b = avg(ku.map(x => Number(x.hasil.skor))), ab = [a, b].filter(v => v !== null);
      h = `<div class="sis-stats"><div class="sis-stat">Rata&sup2; Tugas<b>${a === null ? '-' : a}</b></div><div class="sis-stat">Rata&sup2; Kuis<b>${b === null ? '-' : b}</b></div><div class="sis-stat ok">Nilai Akhir<b>${ab.length ? avg(ab) : '-'}</b></div></div>
        <div class="sis-card p-0"><div class="table-responsive"><table class="table sis-table mb-0" style="min-width:520px"><thead><tr><th>Jenis</th><th>Mapel</th><th>Judul</th><th>Nilai</th></tr></thead><tbody>`
        + (tg.length || ku.length ? tg.map(x => `<tr><td>Tugas</td><td>${esc(x.mapel)}</td><td>${esc(x.judul)}</td><td>${nilaiBadge(x.sub.nilai)}</td></tr>`).join('') + ku.map(x => `<tr><td>Kuis</td><td>${esc(x.mapel)}</td><td>${esc(x.judul)}</td><td>${nilaiBadge(x.hasil.skor)}</td></tr>`).join('') : '<tr><td colspan="4" class="text-center text-muted py-4">Belum ada nilai.</td></tr>')
        + `</tbody></table></div></div>`;
    }
    pane.innerHTML = h;
  }
  function onBel(e) {
    const b = e.target.closest('button[data-act]'); if (!b || !BEL) return; const id = b.dataset.id;
    if (b.dataset.act === 'tugas') {
      const x = BEL.tugas.find(v => v.id === id); if (!x) return;
      $('btJudul').textContent = x.judul; $('btKirim').dataset.id = id;
      $('btInfo').innerHTML = `<div class="small text-muted mb-1">${esc(x.mapel)} &bull; Tenggat: ${x.tenggat ? waktu(x.tenggat) : 'tanpa tenggat'}</div>${x.isi ? teks(x.isi) : ''}${link(x.url, 'Lampiran tugas')}`;
      $('btJawab').value = x.sub ? x.sub.jawaban : ''; $('btUrl').value = x.sub ? x.sub.url : ''; show('mdlBelTugas');
    }
    if (b.dataset.act === 'kuis') { const x = BEL.kuis.find(v => v.id === id); if (x) bukaKuis(x); }
  }

  // ---- Kuis (siswa)
  function bukaKuis(x) {
    quiz = { id: x.id, selesai: false, jml: x.nSoal };
    $('kzJudul').textContent = x.judul; $('kzSub').textContent = `${x.mapel} • ${x.nSoal} soal • ${x.durasi} menit`; $('kzTimer').classList.add('d-none');
    $('kzBody').innerHTML = `<p>Kuis hanya dapat dikerjakan <b>satu kali</b>. Waktu mulai berjalan setelah Anda menekan tombol Mulai dan tetap berjalan walau halaman ditutup. Pastikan koneksi internet stabil.</p>
      <ul class="small text-muted"><li>Durasi: ${esc(x.durasi)} menit</li><li>Jumlah soal: ${x.nSoal}</li><li>Jawaban akan dikirim otomatis saat waktu habis.</li></ul>`;
    $('kzFoot').innerHTML = '<button type="button" class="btn btn-soft" data-bs-dismiss="modal">Batal</button><button type="button" class="btn btn-sky" id="kzMulai"><i class="bi bi-play-fill"></i> Mulai sekarang</button>';
    $('kzMulai').onclick = mulaiKuis; show('mdlKuis');
  }
  function mulaiKuis() {
    api('lmsKuisMulai', [{ kuisId: quiz.id }], r => {
      if (!r.success) { toast(r.message, 'danger'); hide('mdlKuis'); return loadBelajar(); }
      const d = r.data; quiz.jml = d.soal.length; quiz.end = Date.now() + d.sisa * 1000;
      $('kzBody').innerHTML = d.soal.map((s, i) => `<div class="qs"><div class="mb-2"><b>${i + 1}.</b> <span class="lms-teks d-inline">${esc(s.q)}</span></div>
        ${s.o.map((o, j) => `<label class="qo"><input class="form-check-input" type="radio" name="jw${i}" value="${j}"><span><b>${'ABCDE'[j]}.</b> ${esc(o)}</span></label>`).join('')}</div>`).join('');
      $('kzFoot').innerHTML = '<span class="me-auto small text-muted" id="kzProg">0 / ' + quiz.jml + ' terjawab</span><button type="button" class="btn btn-sky" id="kzKirim"><i class="bi bi-send-fill"></i> Kirim jawaban</button>';
      $('kzBody').onchange = () => { $('kzProg').textContent = document.querySelectorAll('#kzBody .qs input:checked').length + ' / ' + quiz.jml + ' terjawab'; };
      $('kzKirim').onclick = () => { const k = document.querySelectorAll('#kzBody .qs input:checked').length; if (k < quiz.jml && !confirm((quiz.jml - k) + ' soal belum dijawab. Kirim sekarang?')) return; kirimKuis(); };
      $('kzTimer').classList.remove('d-none'); tickKuis(); clearInterval(quiz.timer); quiz.timer = setInterval(tickKuis, 1000);
    }, false);
  }
  function tickKuis() {
    if (!quiz || quiz.selesai) return; const s = Math.max(0, Math.ceil((quiz.end - Date.now()) / 1000));
    $('kzTimer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); $('kzTimer').classList.toggle('kz-low', s <= 60);
    if (s <= 0) { toast('Waktu habis. Jawaban dikirim otomatis.', 'warning'); kirimKuis(); }
  }
  function kirimKuis() {
    if (!quiz || quiz.selesai) return; quiz.selesai = true; clearInterval(quiz.timer);
    const jw = []; for (let i = 0; i < quiz.jml; i++) { const c = document.querySelector(`#kzBody input[name="jw${i}"]:checked`); jw.push(c ? +c.value : -1); }
    api('lmsKuisKirim', [{ kuisId: quiz.id, jawaban: jw }], r => {
      if (!r.success) { quiz.selesai = false; toast(r.message, 'danger'); if (/sudah mengerjakan/i.test(r.message)) { hide('mdlKuis'); loadBelajar(); } else { quiz.timer = setInterval(tickKuis, 1000); } return; }
      $('kzTimer').classList.add('d-none'); const d = r.data;
      $('kzBody').innerHTML = `<div class="text-center py-4"><div class="kz-skor">${esc(d.skor)}</div><div class="text-muted">Benar ${esc(d.benar)} dari ${esc(d.total)} soal</div>${d.terlambat ? '<div class="text-danger mt-2">Waktu pengerjaan terlampaui; nilai 0 tercatat.</div>' : ''}</div>`;
      $('kzFoot').innerHTML = '<button type="button" class="btn btn-sky" id="kzTutup">Selesai</button>'; $('kzTutup').onclick = () => { hide('mdlKuis'); loadBelajar(); };
    }, false, () => { quiz.selesai = false; quiz.timer = setInterval(tickKuis, 1000); });
  }

  // ---- Daftarkan ke aplikasi
  // Dipanggil saat logout: bersihkan data pengguna sebelumnya agar tidak terlihat oleh pengguna berikutnya
  window.lmsReset = function () {
    BEL = null; data = []; if (quiz) { clearInterval(quiz.timer); quiz = null; }
    ['belPane', 'lmsPane'].forEach(i => { if ($(i)) $(i).innerHTML = ''; }); if ($('belSub')) $('belSub').textContent = 'Memuat...';
    ['mdlLms', 'mdlLmsKumpul', 'mdlLmsHasil', 'mdlBelTugas', 'mdlKuis'].forEach(hide);
  };
  LOAD.lms = loadLms; LOAD.belajar = loadBelajar;
  mkGuru(); mkSiswa();
})();
