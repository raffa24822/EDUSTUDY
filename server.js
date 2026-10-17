'use strict';
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const TEACHER_USERNAME = process.env.TEACHER_USERNAME;
const TEACHER_PASSWORD_HASH = process.env.TEACHER_PASSWORD_HASH;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'edustudy.json');
if (!JWT_SECRET || JWT_SECRET.length < 32) { console.error('Set JWT_SECRET to a random secret of at least 32 characters.'); process.exit(1); }
if (!TEACHER_USERNAME || !TEACHER_PASSWORD_HASH) { console.error('Set TEACHER_USERNAME and TEACHER_PASSWORD_HASH; never hardcode teacher credentials.'); process.exit(1); }
fs.mkdirSync(DATA_DIR, { recursive: true });
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '2mb', strict: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.static(__dirname, { index: 'index.html', dotfiles: 'deny', etag: true, maxAge: '1h' }));

const ALLOWED = new Set(['ping','subjects','users','results','tasks','materials','submissions']);
let db = Object.create(null);
try { if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { console.error('Database file invalid; refusing to overwrite it.', e.message); process.exit(1); }
let writeChain = Promise.resolve();
function persist() {
  writeChain = writeChain.then(async () => {
    const tmp = DB_FILE + '.tmp';
    await fs.promises.writeFile(tmp, JSON.stringify(db), { mode: 0o600 });
    await fs.promises.rename(tmp, DB_FILE);
  });
  return writeChain;
}
function isTeacher(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try { const claims = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'], issuer: 'edustudy' }); if (claims.role !== 'teacher') throw new Error('role'); req.teacher = claims; return next(); }
  catch (_) { return res.status(401).json({ error: 'Autentikasi guru diperlukan.' }); }
}
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'EDUSTUDY', timestamp: new Date().toISOString() }));
app.post(['/api/teacher/login', '/api/teacher-login'], rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false }), async (req, res) => {
  const username = String(req.body?.username || '').slice(0, 100);
  const password = String(req.body?.password || '');
  const usernameOK = username === TEACHER_USERNAME;
  let passwordOK = false;
  try { passwordOK = await bcrypt.compare(password, TEACHER_PASSWORD_HASH); } catch (_) {}
  if (!usernameOK || !passwordOK) return res.status(401).json({ error: 'Username atau password tidak valid.' });
  const token = jwt.sign({ sub: TEACHER_USERNAME, role: 'teacher' }, JWT_SECRET, { algorithm: 'HS256', issuer: 'edustudy', expiresIn: '8h' });
  return res.json({ token, expiresIn: 28800, username: TEACHER_USERNAME });
});
// Firebase-REST-like shape required by the existing HTML: /asts_kelas10/<key>.json
app.get('/asts_kelas10/:key.json', (req, res) => {
  const key = req.params.key;
  if (!ALLOWED.has(key)) return res.status(404).json({ error: 'Data tidak ditemukan.' });
  // Student-facing content is readable; account lists/results/submissions are private to authenticated teachers.
  if (['users','results','submissions'].includes(key)) return isTeacher(req, res, () => res.json(db[key] ?? null));
  return res.set('Cache-Control', 'no-store').json(db[key] ?? null);
});
app.put('/asts_kelas10/:key.json', (req, res, next) => req.params.key === 'ping' ? next() : isTeacher(req, res, next), async (req, res) => {
  const key = req.params.key;
  if (!ALLOWED.has(key)) return res.status(404).json({ error: 'Data tidak ditemukan.' });
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Format data tidak valid.' });
  const bytes = Buffer.byteLength(JSON.stringify(req.body));
  if (bytes > 2 * 1024 * 1024) return res.status(413).json({ error: 'Ukuran data melebihi batas 2 MB.' });
  db[key] = req.body;
  try { await persist(); res.set('Cache-Control','no-store').json(db[key]); }
  catch (_) { res.status(500).json({ error: 'Data gagal disimpan.' }); }
});
app.delete('/asts_kelas10/:key.json', isTeacher, async (req, res) => {
  const key = req.params.key;
  if (!ALLOWED.has(key)) return res.status(404).json({ error: 'Data tidak ditemukan.' });
  delete db[key]; try { await persist(); res.json({ ok: true }); } catch (_) { res.status(500).json({ error: 'Data gagal dihapus.' }); }
});
app.use((err, _req, res, _next) => { if (err instanceof SyntaxError) return res.status(400).json({ error: 'JSON tidak valid.' }); console.error('Request failed:', err.message); return res.status(500).json({ error: 'Terjadi kesalahan server.' }); });
app.listen(PORT, '0.0.0.0', () => console.log(`EDUSTUDY listening on ${PORT}`));
