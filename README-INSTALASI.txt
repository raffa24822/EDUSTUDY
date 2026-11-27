EDUSTUDY — LOGIN SISWA TANPA EMAIL/PASSWORD
=============================================

FILE
----
index.html                 Website untuk diunggah ke ROOT repository GitHub.
database.rules.json        Firebase Realtime Database Rules.
README-INSTALASI.txt       Panduan ini.

PERUBAHAN
---------
- Siswa tidak lagi diminta email atau password.
- Siswa memakai Firebase Anonymous Authentication di belakang layar.
- Guru tetap memakai Email/Password Firebase dan teacherAccess.
- Profil siswa disimpan di /edustudy/studentProfiles/{uid}.

PENTING: BATAS LOGIN ANONIM
---------------------------
Anonymous Authentication memberi UID otomatis, tetapi username saja bukan bukti identitas.
Akun anonim secara default terikat pada sesi/perangkat/browser yang membuatnya.
Jika siswa menghapus data browser, berpindah perangkat, atau kehilangan sesi anonim,
profil tidak dapat dipulihkan hanya dengan username. Untuk login lintas perangkat secara
aman, diperlukan metode pemulihan tambahan (misalnya kode akses unik yang diterbitkan guru,
atau kredensial siswa).

USERNAME
--------
Username harus 3–24 karakter dan hanya huruf, angka, titik, garis bawah, atau tanda hubung.
Jangan memasukkan data pribadi sensitif.

FIREBASE SETUP
--------------
1. Firebase Console > Authentication > Sign-in method / Providers.
2. Aktifkan Anonymous.
3. Biarkan Email/Password tetap aktif untuk guru.
4. Authentication > Settings > Authorized domains: tambahkan domain Vercel.
5. Realtimedatabase Rules: publish database.rules.json.
6. Guru tetap harus dibuat di Authentication sebagai email internal:
   usernameguru@teachers.edustudy.id
7. Salin UID guru, lalu tambahkan:
   edustudy/teacherAccess/{UID_GURU} = true
8. Untuk login guru, gunakan username tanpa @teachers.edustudy.id dan password Firebase.

DEPLOY VERCEL
-------------
1. Ganti index.html lama di ROOT repository GitHub dengan index.html dari paket ini.
2. Commit dan tunggu deployment Vercel.
3. Pastikan domain Vercel ada di Authorized domains Firebase.

PERINGATAN KEAMANAN PENTING
---------------------------
Paket ini mengubah alur autentikasi siswa, tetapi tidak dengan sendirinya memisahkan
semua kunci jawaban dari data aplikasi bersama. Jangan gunakan untuk ujian berisiko tinggi
sebelum skema soal/kunci jawaban dipisah ke jalur yang hanya dapat dibaca guru dan
pemeriksaan jawaban dipindahkan ke backend tepercaya (misalnya Cloud Functions).
Rules harus diuji dengan Firebase Rules Emulator atau dua akun siswa dan satu akun guru.
Jangan pernah mengaktifkan akses publik .read/.write.

PENGUJIAN
---------
- Aktifkan Anonymous provider.
- Deploy.
- Buka situs pada browser bersih, buat profil siswa.
- Refresh halaman pada browser yang sama, login dengan username yang sama.
- Uji guru menggunakan akun Auth dan UID teacherAccess.
- Coba akses profil UID siswa lain: harus ditolak.
