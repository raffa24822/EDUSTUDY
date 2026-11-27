EDUSTUDY - PAKET DEPLOYMENT VERCEL + FIREBASE
============================================

ISI PAKET
---------
- index.html              Website EDUSTUDY yang telah dihubungkan ke Firebase Auth + Realtime Database.
- database.rules.json     Aturan akses database berbasis autentikasi dan peran guru.

PENTING SEBELUM DIPAKAI
-----------------------
1. File ini sudah berisi konfigurasi web Firebase proyek edustudy-d18c4.
2. Firebase Web API key memang digunakan oleh aplikasi browser. Keamanan data TIDAK bergantung pada menyembunyikan API key, tetapi pada Authentication dan Security Rules.
3. Jangan pernah menaruh Service Account Private Key, password Google, atau kredensial Admin SDK di index.html atau GitHub.
4. Sistem ini memakai username sebagai alias email internal:
   - Siswa: username@students.edustudy.id
   - Guru : username@teachers.edustudy.id
   Jadi pengguna tetap memasukkan username di halaman EDUSTUDY, bukan alamat email.

A. SETTING FIREBASE AUTHENTICATION
----------------------------------
1. Firebase Console > Authentication > Settings > Authorized domains.
2. Pastikan domain berikut ditambahkan:
   - edustudyes.vercel.app
   - localhost (untuk pengujian lokal bila diperlukan)
3. Authentication > Sign-in method: Email/Password harus Enabled.

B. PASANG DATABASE SECURITY RULES
----------------------------------
1. Firebase Console > Realtime Database > Rules.
2. Ganti seluruh rules dengan isi file database.rules.json.
3. Klik Publish.
4. Jangan gunakan rules publik seperti .read: true atau .write: true.

C. BUAT AKUN GURU ADMIN PERTAMA (WAJIB SEBELUM SISWA)
------------------------------------------------------
Akun guru tidak dapat mendaftarkan dirinya sendiri dari halaman publik.
Buat secara manual melalui Firebase Console:

1. Authentication > Users > Add user.
2. Email harus memakai format: usernameguru@teachers.edustudy.id
   Contoh: admin@teachers.edustudy.id
3. Buat password kuat dan simpan secara aman.
4. Setelah akun dibuat, salin UID akun guru tersebut dari daftar Users.
5. Buka Realtime Database > Data.
6. Buat node:
   edustudy
     teacherAccess
       UID_GURU: true
   Contoh bentuk data:
   "teacherAccess": {
     "UID_GURU_DARI_AUTH": true
   }
   Letakkan teacherAccess sebagai anak langsung dari root edustudy.
7. Login ke EDUSTUDY menggunakan username guru (bagian sebelum @teachers...) dan password.
8. Login guru pertama akan membuat data awal EDUSTUDY di /edustudy/database.

CATATAN: teacherAccess adalah daftar izin guru. Rules menolak perubahan teacherAccess dari browser publik. Perubahan daftar ini hanya dilakukan administrator melalui Firebase Console atau Admin SDK.

D. AKUN SISWA
--------------
1. Setelah admin/guru berhasil login pertama kali dan database awal sudah dibuat,
   siswa dapat memilih Login Siswa.
2. Isi username, password minimal 6 karakter, pilih kelas dan avatar.
3. Klik "Buat Akun Siswa Baru" untuk registrasi pertama.
4. Login berikutnya gunakan username dan password yang sama.
5. Profil/nilai siswa disimpan di /edustudy/studentProfiles/UID_AUTH masing-masing.
   Siswa hanya dapat membaca/menulis profilnya sendiri; guru yang diizinkan dapat melihat semua profil.

E. DEPLOY KE VERCEL MELALUI GITHUB
----------------------------------
1. Buat repository GitHub baru, misalnya edustudy.
2. Upload index.html dari paket ini ke root repository. Nama harus persis index.html.
3. Commit perubahan.
4. Vercel > Add New > Project > Import repository edustudy.
5. Framework Preset: Other.
6. Build Command: kosongkan.
7. Output Directory: . (root) atau kosong sesuai tampilan Vercel.
8. Deploy.
9. Pastikan domain edustudyes.vercel.app sudah masuk Authorized domains Firebase.

F. STRUKTUR DATA
----------------
/edustudy/database        Data materi, soal, pengumuman dan data bersama; hanya guru terotorisasi yang dapat menulis.
/edustudy/studentProfiles  Profil dan nilai pribadi; siswa hanya dapat mengakses UID sendiri, guru dapat membaca semua.
/edustudy/teacherAccess    Daftar UID guru yang diberi izin oleh administrator.

G. BATASAN DAN PEMERIKSAAN
--------------------------
- File sudah diperbarui untuk autentikasi Firebase, pemisahan profil siswa, dan sinkronisasi real-time.
- Pengujian sintaks JavaScript lokal telah dilakukan. Login/deployment nyata tetap harus diuji di proyek Firebase/Vercel milik pemilik akun.
- Akun guru pertama, rules, authorized domain, dan deployment Vercel memerlukan tindakan pemilik proyek.
- API key Firebase web bukan password admin. Jangan pernah menambahkan Service Account key ke file frontend.
- Lakukan backup database sebelum migrasi atau perubahan rules besar.
