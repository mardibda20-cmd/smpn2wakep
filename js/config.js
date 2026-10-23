// Tempel URL Web App Apps Script (berakhiran /exec) di antara tanda kutip
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEfH0MgVgkJSuPTJdGbQT8k7MQ2lpKEe5RGf42BONtQiGtvvjzo_Sw2uT3D7sjI6_Z/exec';

// Identitas sekolah untuk Kartu Pelajar (ubah sesuai kebutuhan; alamat boleh dikosongkan)
const SEKOLAH = {
  pemda:  'PEMERINTAH KABUPATEN TOJO UNA-UNA',
  dinas:  'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  nama:   'SMP NEGERI 2 WALEA KEPULAUAN',
  alamat: 'Desa Kolami Kec. Walea Kepulauan Kab. Tojo Una-Una',          // contoh: 'Jl. ..., Desa ..., Kec. ..., Kab. ...'
  kota:   'Kolami',          // hanya nama kota; tanggal cetak ditambahkan otomatis pada tanda tangan ("Kolami, 23 Oktober 2026")
  kepala: 'KURNIA, S.Pd',          // nama Kepala Sekolah (beserta gelar)
  nipKepala: '198312252008042005',
  logo:   'https://res.cloudinary.com/twobznku/image/upload/f_auto/q_auto/logo_ddyozf.png'
};
