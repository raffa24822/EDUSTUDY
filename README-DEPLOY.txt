EDUSTUDY — ABOUT CREATOR DNA

ISI FILE: index.html + api/ + package.json
Deploy folder ini sebagai project Vercel (folder root).

WAJIB SET ENVIRONMENT VARIABLES DI VERCEL:
1. CREATOR_PAGE_PASSWORD = belajar123
2. CREATOR_SESSION_SECRET = string acak panjang minimal 32 karakter
3. FIREBASE_DATABASE_URL = https://edustudy-d18c4-default-rtdb.asia-southeast1.firebasedatabase.app
4. FIREBASE_STORAGE_BUCKET = edustudy-d18c4.firebasestorage.app
5. FIREBASE_SERVICE_ACCOUNT = seluruh JSON service account Firebase (satu baris/minified).

Buat service account dari Firebase Console > Project settings > Service accounts > Generate new private key. Simpan JSON hanya di Vercel Environment Variables. JANGAN taruh file JSON private key di frontend atau GitHub.

Firebase Admin SDK perlu izin ke Realtime Database dan Storage. Pastikan bucket Storage sudah dibuat/aktif dan billing/plan Google Cloud mendukung penggunaan Storage jika diminta.

Untuk upload media langsung ke Storage, set CORS bucket menggunakan cors.json (misalnya: gcloud storage buckets update gs://edustudy-d18c4.firebasestorage.app --cors-file=cors.json). Sesuaikan origin dengan domain Vercel milikmu.

Setelah environment variables diisi, lakukan redeploy Vercel. URL halaman: /?about-creator=1

CATATAN: file frontend saja tidak cukup untuk melindungi password. API serverless di folder /api melakukan validasi password dan mengelola konten. Upload foto/video dibatasi 100 MB dari frontend. File media yang diunggah dibuat public agar dapat dilihat pengunjung. Jangan unggah media privat.
