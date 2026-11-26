# EDUSTUDY Cloud

Versi EDUSTUDY yang disiapkan untuk berjalan dari satu server Render dengan penyimpanan bersama di Supabase. HP, laptop, dan perangkat lain membuka aplikasi yang sama dan membaca/menyimpan data dari database cloud yang sama.

## Isi paket

- `public/index.html` — aplikasi EDUSTUDY asli, dipertahankan dan ditambahkan koneksi cloud.
- `server.js` — API Node.js untuk autentikasi dan sinkronisasi.
- `schema.sql` — tabel Supabase dan kebijakan akses.
- `render.yaml` — konfigurasi deploy Render.

## A. Siapkan Supabase

1. Buka project Supabase milik EDUSTUDY.
2. Buka **SQL Editor** → **New query**.
3. Buka file `schema.sql` dari paket ini, salin seluruh isinya ke SQL Editor, lalu tekan **Run**.
4. Buka **Project Settings → API Keys**.
5. Salin **Project URL** dan **Secret key** (pada tampilan lama disebut `service_role`).
6. Secret key hanya dimasukkan ke Environment Render. Jangan tempel di file HTML, GitHub, atau chat. Jangan pernah membagikannya.

> Publishable/anon key yang sudah diberikan sebelumnya tidak dipakai oleh server ini. Backend membutuhkan Secret/service-role key karena hanya server yang boleh mengakses tabel. Key tersebut memiliki hak tinggi dan wajib dirahasiakan.

## B. Unggah ke GitHub

1. Ekstrak ZIP ini di perangkat.
2. Buka https://github.com dan buat repository baru, misalnya `edustudy-cloud`.
3. Unggah semua isi folder hasil ekstrak ke repository (pastikan `package.json`, `server.js`, `schema.sql`, `render.yaml`, dan folder `public` berada di root repository).
4. Pastikan repository berisi `public/index.html`, bukan file HTML yang tersimpan di dalam folder tambahan lain.

## C. Deploy ke Render

1. Buka https://render.com dan login menggunakan GitHub.
2. Pilih **New + → Blueprint** (atau buat **Web Service** dari repository).
3. Pilih repository `edustudy-cloud`. Jika memakai Blueprint, Render akan membaca `render.yaml`.
4. Tunggu proses build selesai.
5. Buka **Render → EDUSTUDY service → Environment** dan isi:

| Environment variable | Isi |
|---|---|
| `SUPABASE_URL` | `https://ypphblzsaohqbmmluive.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret/service-role key dari Supabase (rahasia) |
| `JWT_SECRET` | Buat string acak panjang minimal 32 karakter |
| `TEACHER_USERNAME` | Username guru yang akan dipakai untuk login |
| `TEACHER_PASSWORD` | Password baru yang kuat, minimal 12 karakter |

6. Tekan **Save, Rebuild, and Deploy**.
7. Setelah status Live, buka alamat `https://nama-service.onrender.com`.
8. Buka `https://nama-service.onrender.com/api/health`. Pastikan `ok: true` dan `databaseConfigured: true`.

## D. Urutan penggunaan pertama kali

1. Buka web EDUSTUDY yang sudah Live.
2. Masuk ke tab **Login Guru** menggunakan nilai `TEACHER_USERNAME` dan `TEACHER_PASSWORD` yang disetel di Render.
3. Login guru pertama kali akan mengirim data awal dari browser tersebut ke Supabase. Jika ada data lama yang ingin dipertahankan, lakukan login pertama dari perangkat/browser yang memiliki data EDUSTUDY paling lengkap.
4. Setelah data awal tersimpan, siswa dapat masuk menggunakan username, kelas, dan password minimal 8 karakter. Saat pertama kali memakai username, siswa membuat password; pada penggunaan berikutnya harus memakai password yang sama.
5. Buka web dari HP/laptop lain. Data diambil dari Supabase yang sama. Perubahan dashboard diperiksa otomatis setiap sekitar 8 detik.

## Catatan penting

- Jangan commit file `.env` atau Secret/service-role key ke GitHub.
- Render Free dapat mengalami sleep saat tidak digunakan; kunjungan pertama setelah tidur mungkin perlu menunggu server aktif. Supabase tetap menyimpan data.
- Penyimpanan sinkron ini memakai satu dokumen JSON untuk mempertahankan struktur aplikasi lama. Untuk penggunaan sekolah skala besar, selanjutnya sebaiknya dipisah menjadi tabel per data dan ditambah backup/riwayat perubahan.
- Aplikasi lama masih menghitung dan menampilkan kunci jawaban kuis di sisi browser. Karena itu, walaupun akses database dan hak tulis API sudah dibatasi, soal/ujian yang sangat rahasia atau berisiko tinggi sebaiknya belum digunakan sebelum mesin penilaian dipindahkan sepenuhnya ke server.
- File materi/foto yang dimasukkan sebagai data URL ikut tersimpan dalam dokumen database. Untuk banyak file besar, tahap berikutnya sebaiknya memindahkannya ke Supabase Storage.
