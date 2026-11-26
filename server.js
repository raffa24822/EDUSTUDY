'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET', 'TEACHER_USERNAME', 'TEACHER_PASSWORD'];
for (const name of required) if (!process.env[name]) console.warn(`[EDUSTUDY] Environment ${name} belum diisi.`);
const app = express();
const PORT = process.env.PORT || 3000;
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const jwtSecret = process.env.JWT_SECRET || 'CHANGE_THIS_BEFORE_DEPLOYMENT';
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: true, maxAge: '1h' }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });

function dbReady(res) {
  if (!supabase) { res.status(503).json({ error: 'Server belum dikonfigurasi. Periksa environment Supabase di Render.' }); return false; }
  return true;
}
function sign(payload) { return jwt.sign(payload, jwtSecret, { expiresIn: '7d', issuer: 'edustudy' }); }
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Silakan login kembali.' });
  try { req.user = jwt.verify(token, jwtSecret, { issuer: 'edustudy' }); next(); }
  catch { return res.status(401).json({ error: 'Sesi tidak valid atau sudah berakhir. Silakan login kembali.' }); }
}
function requireTeacher(req, res, next) {
  if (req.user?.role !== 'teacher') return res.status(403).json({ error: 'Akses khusus guru.' });
  next();
}
async function getState() {
  const { data, error } = await supabase.from('edustudy_state').select('state,updated_at').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data || null;
}
async function setState(state) {
  const { data, error } = await supabase.from('edustudy_state').upsert({ id: 1, state, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('updated_at').single();
  if (error) throw error;
  return data;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'EDUSTUDY Cloud API', databaseConfigured: !!supabase }));

app.post('/api/auth/student', authLimiter, async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const username = String(req.body.username || '').trim();
    const className = String(req.body.className || '').trim();
    const password = String(req.body.password || '');
    const avatar = String(req.body.avatar || '🧑‍🚀').slice(0, 12);
    if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(username)) return res.status(400).json({ error: 'Username harus 3–24 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau strip.' });
    if (!className || password.length < 8 || password.length > 100) return res.status(400).json({ error: 'Pilih kelas dan gunakan password minimal 8 karakter.' });
    const normalized = username.toLowerCase();
    let { data: user, error } = await supabase.from('edustudy_users').select('*').eq('username_normalized', normalized).maybeSingle();
    if (error) throw error;
    if (user) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid || user.class_name !== className) return res.status(401).json({ error: 'Username, kelas, atau password tidak sesuai.' });
    } else {
      const password_hash = await bcrypt.hash(password, 12);
      const inserted = await supabase.from('edustudy_users').insert({ username, username_normalized: normalized, class_name: className, password_hash, role: 'student' }).select('*').single();
      if (inserted.error) {
        if (inserted.error.code === '23505') return res.status(409).json({ error: 'Username sudah digunakan. Silakan login dengan password yang telah dibuat.' });
        throw inserted.error;
      }
      user = inserted.data;
    }
    const stateRow = await getState();
    if (!stateRow) return res.status(503).json({ error: 'Database EDUSTUDY belum diinisialisasi. Minta guru login terlebih dahulu untuk menyiapkan data awal.' });
    const state = stateRow.state || {};
    state.students = Array.isArray(state.students) ? state.students : [];
    let student = state.students.find(s => String(s.usn || '').toLowerCase() === normalized);
    const nowStr = 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    if (!student) {
      student = { id: user.id, usn: user.username, studentClass: user.class_name, avatar, lastLogin: nowStr, status: 'Aktif', scores: [] };
      state.students.unshift(student);
    } else {
      student.id = user.id; student.avatar = avatar; student.lastLogin = nowStr; student.status = 'Aktif';
    }
    await setState(state);
    const token = sign({ sub: user.id, role: 'student', username: user.username, className: user.class_name });
    res.json({ token, user: { id: user.id, role: 'student', usn: user.username, studentClass: user.class_name, avatar } });
  } catch (e) { console.error('student auth:', e); res.status(500).json({ error: 'Gagal memproses login siswa. Periksa konfigurasi database.' }); }
});

app.post('/api/auth/teacher', authLimiter, (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const expectedUser = process.env.TEACHER_USERNAME || '';
  const expectedPass = process.env.TEACHER_PASSWORD || '';
  if (!expectedUser || !expectedPass || username.toLowerCase() !== expectedUser.toLowerCase() || password !== expectedPass) {
    return res.status(401).json({ error: 'Username atau password guru tidak valid. Periksa akun guru di Environment Render.' });
  }
  const token = sign({ sub: 'edustudy-teacher', role: 'teacher', username: expectedUser });
  res.json({ token, user: { id: 'edustudy-teacher', role: 'teacher', usn: expectedUser, avatar: '👨‍🏫' } });
});

app.get('/api/state', requireAuth, async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const row = await getState();
    if (!row) return res.json({ state: null, updatedAt: null });
    const state = structuredClone(row.state || {});
    // Siswa hanya menerima profilnya sendiri; guru menerima seluruh daftar akun.
    if (req.user.role === 'student') state.students = (state.students || []).filter(s => s.id === req.user.sub);
    res.set('Cache-Control', 'no-store').json({ state, updatedAt: row.updated_at });
  } catch (e) { console.error('get state:', e); res.status(500).json({ error: 'Gagal mengambil data EDUSTUDY.' }); }
});

app.put('/api/state', requireAuth, requireTeacher, async (req, res) => {
  if (!dbReady(res)) return;
  try {
    if (!req.body.state || typeof req.body.state !== 'object' || Array.isArray(req.body.state)) return res.status(400).json({ error: 'Format data tidak valid.' });
    const updated = await setState(req.body.state);
    res.json({ ok: true, updatedAt: updated.updated_at });
  } catch (e) { console.error('put state:', e); res.status(500).json({ error: 'Gagal menyimpan data ke Supabase.' }); }
});

app.patch('/api/student/profile', requireAuth, async (req, res) => {
  if (!dbReady(res)) return;
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Endpoint khusus siswa.' });
  try {
    const row = await getState();
    if (!row) return res.status(404).json({ error: 'Data EDUSTUDY belum tersedia.' });
    const state = row.state || {};
    const students = Array.isArray(state.students) ? state.students : [];
    const idx = students.findIndex(s => s.id === req.user.sub);
    if (idx < 0) return res.status(404).json({ error: 'Profil siswa tidak ditemukan.' });
    const incoming = req.body.student || {};
    // Hanya kolom milik siswa yang boleh berubah; identitas dan konten guru tidak dapat ditimpa.
    const current = students[idx];
    current.avatar = String(incoming.avatar || current.avatar || '🎓').slice(0, 12);
    current.lastLogin = String(incoming.lastLogin || current.lastLogin || '').slice(0, 100);
    current.status = incoming.status === 'Offline' ? 'Offline' : 'Aktif';
    if (Array.isArray(incoming.scores)) current.scores = incoming.scores.slice(0, 500);
    if (Array.isArray(incoming.violationEvents)) current.violationEvents = incoming.violationEvents.slice(-500);
    state.students = students;
    const updated = await setState(state);
    res.json({ ok: true, updatedAt: updated.updated_at });
  } catch (e) { console.error('student profile:', e); res.status(500).json({ error: 'Gagal menyimpan profil dan nilai siswa.' }); }
});

app.get(/.*/, (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`EDUSTUDY server berjalan pada port ${PORT}`));
