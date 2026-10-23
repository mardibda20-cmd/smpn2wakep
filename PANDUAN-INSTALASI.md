# Panduan Instalasi — Absen Siswa + LMS (GitHub Pages + Apps Script)

## A. Pasang backend (di browser)
1. Buka Google Sheet database → **Ekstensi → Apps Script**.
2. Hapus semua file lama (code.gs, setup.gs, Index.html, Style.html, Script.html).
3. Buat satu file **Kode.gs**, tempel isi `Kode.gs` yang baru (v2.9).
4. **Buat database otomatis**: di bagian atas editor, pilih fungsi **`buatDatabase`** → klik **Run** → beri izin.
   - Tidak perlu mengisi `SPREADSHEET_ID` (biarkan `''`).
   - Jika script ditempel dari **Ekstensi → Apps Script** pada Google Sheet Anda, Sheet itulah yang dipakai. Jika script dibuat sendiri di script.google.com, sebuah Google Sheet baru dibuat otomatis; alamatnya tertulis di **Execution log**.
   - Yang dibuat: Data_Siswa, Absensi_Murid, Data_Guru, Akun, Pelanggaran, Prestasi, Hari_Libur, dan **6 sheet LMS** (LMS_Info, LMS_Materi, LMS_Tugas, LMS_Kuis, LMS_Kumpul, LMS_Hasil), lengkap dengan judul kolom. Data yang sudah ada **tidak diubah**, aman dijalankan berulang.
   - Pada instalasi pertama, **Execution log** juga menampilkan **username & password admin awal**. Catat, buat akun admin baru di menu Kelola Akun, lalu hapus akun awal.
5. Cek Google Sheet: harus ada semua tab di atas. Jika log menampilkan tanda silang merah, kirim screenshot-nya.
6. **Deploy → New deployment → Web app**: *Execute as* = **Me**, *Who has access* = **Anyone** → Deploy.
   **Jika sebelumnya sudah pernah deploy** (update ke v2.9): **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. URL `/exec` tetap sama.
7. Salin URL berakhiran `/exec`, uji di browser dengan menambah `?action=ping` → harus muncul `"API aktif"` dan `"versi":"2.9"`.

## B. Isi konfigurasi frontend
Ekstrak ZIP. Buka `js/config.js`, tempel URL `/exec` di `GAS_URL`. Pastikan `kota` hanya nama kota (contoh `'Kolami'`).

## C. Folder kerja Git
Folder hasil ekstrak ZIP, yaitu **`absen-smpn2-walea`**, adalah folder tempat `git init` dijalankan.
Isinya harus langsung terlihat: `index.html`, `css\`, `js\`. Jangan masuk lebih dalam, jangan naik satu level.
Jangan memasukkan `Kode.gs` ke folder ini (file backend hanya untuk Apps Script).

## D. Push ke GitHub (dari terminal, JANGAN upload via web)
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
Password saat push = **Personal Access Token** (scope `repo`), bukan password akun.

## E. Aktifkan Pages
Repo → **Settings → Pages** → Deploy from a branch → **main** / **(root)** → Save. Centang **Enforce HTTPS**.
Situs: `https://USERNAME.github.io/NAMA-REPO/`

## F. Update
```
git add .
git commit -m "Perubahan"
git push
```
Jika backend (Kode.gs) diubah: **Deploy → Manage deployments → Edit → New version**.
Jika tampilan lama masih muncul: tekan **Ctrl+Shift+R**.

---

## G. Cara memakai LMS

**Guru/Admin** → menu **LMS Kelas**: tab Pengumuman, Materi, Tugas, Kuis, Nilai.
- Pilih **kelas tujuan** (satu kelas atau *Semua kelas*). Semua guru dapat membuat untuk semua kelas; hanya pembuat atau admin yang dapat mengubah/menghapus.
- **Materi & Tugas**: tempel tautan Google Drive / YouTube. Atur akses tautan "Siapa saja yang memiliki link".
- **Tugas**: tenggat bersifat opsional. Tombol **Nilai** menampilkan jawaban siswa, isi nilai 0-100 dan catatan.
- **Kuis**: soal pilihan ganda (2-4 pilihan, satu kunci). Penilaian otomatis, siswa hanya bisa mengerjakan satu kali. Ubah status ke *Tutup* untuk menghentikan kuis.
- **Nilai**: rekap rata-rata tugas, kuis, dan nilai akhir per siswa.

**Siswa** → halaman login, tab **Siswa**:
- **NIS** = NIS siswa di Data Siswa.
- **PIN** = tanggal lahir format **DDMMYYYY** (contoh lahir 15 April 2012 → `15042012`).
- Pastikan **Tanggal Lahir** siswa sudah terisi di menu Data Siswa; kalau kosong, siswa tidak bisa masuk.
- Salah PIN 5 kali → login dikunci 10 menit.
- Siswa hanya melihat menu **Belajar** (pengumuman, materi, tugas, kuis, nilai) dan tidak dapat membuka data siswa lain.

**Catatan keamanan**: PIN berupa tanggal lahir mudah ditebak oleh orang yang mengenal siswa. Jangan menyimpan data rahasia di materi/tugas. Jika perlu PIN yang lebih kuat, mintalah fitur PIN khusus per siswa.
