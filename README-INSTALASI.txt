EDUSTUDY - PERBAIKAN LOGIN SISWA

ISI PAKET
- index.html: versi EDUSTUDY dengan perbaikan alur login siswa.

PERBAIKAN
1. Menghapus ketergantungan login/registrasi pada elemen studentClass yang tidak ada di halaman.
2. Jika kelas tidak disediakan, profil menggunakan nilai "Belum ditentukan".
3. Setelah login/registrasi anonim, aplikasi menginisialisasi koneksi Realtime Database sebelum membuka dashboard.
4. Menambahkan pesan error yang lebih jelas dan mencegah klik ganda saat proses autentikasi berlangsung.
5. Mempertahankan desain dan fitur lain dari file HTML sumber.

CARA MEMASANG
1. Cadangkan index.html lama di repository GitHub.
2. Ekstrak ZIP ini.
3. Ganti file index.html di root repository dengan index.html dari paket.
4. Commit dan push ke GitHub; tunggu deployment Vercel selesai.
5. Di Firebase Console > Authentication > Sign-in method, aktifkan Anonymous untuk siswa. Tetap aktifkan Email/Password untuk guru.
6. Pastikan domain Vercel sudah ditambahkan di Authentication > Settings > Authorized domains.

ALUR SISWA
- Siswa baru: masukkan username, pilih avatar, lalu klik "Buat Akun Siswa Baru".
- Siswa yang sudah mendaftar di browser/perangkat yang sama: masukkan username, pilih avatar, lalu klik "Masuk sebagai Siswa".
- Firebase Anonymous Authentication terikat pada sesi/perangkat. Username saja tidak dapat memulihkan profil di perangkat lain.

CATATAN KEAMANAN
Rules database yang lama tidak diubah oleh paket ini. Jika node edustudy/database berisi kunci jawaban, aturan .read = auth != null membuat data tersebut dapat dibaca oleh seluruh pengguna yang sudah login, termasuk siswa. Pisahkan kunci jawaban ke lokasi khusus guru dan lakukan penilaian di backend tepercaya sebelum memakai untuk ujian penting.

PEMERIKSAAN
JavaScript inline telah diperiksa dengan node --check. Ini bukan pengujian live terhadap Firebase atau Vercel.
