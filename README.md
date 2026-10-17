# EDUSTUDY deployment bundle

## Files
- `index.html`: standalone EDUSTUDY frontend.
- `server.js`: Express API with security headers, rate limits, teacher-token protected writes, protected account/result reads, and JSON persistence.
- `render.yaml`: Render web service + persistent disk configuration.
- `.env.example`: environment variable names only. Do not commit real credentials.

## Run locally in VS Code
1. Install Node.js 20+.
2. Open this folder in VS Code and run `npm install`.
3. Create a bcrypt hash for a long unique teacher password:
   `node -e "const b=require('bcryptjs'); b.hash(process.argv[1],12).then(console.log)" 'YOUR_LONG_UNIQUE_PASSWORD'`
4. Set `JWT_SECRET`, `TEACHER_USERNAME`, and `TEACHER_PASSWORD_HASH` in your terminal environment. Never put these secrets in `index.html` or GitHub.
5. Run `npm start` and open `http://localhost:3000`.

## Deploy to Render
1. Push this project to a **private** GitHub repository.
2. Create a Render Web Service from the repository; `render.yaml` supplies the service and persistent disk.
3. Set `TEACHER_USERNAME` and `TEACHER_PASSWORD_HASH` in Render Environment. Render generates `JWT_SECRET`; keep it secret.
4. Keep the disk mounted and backups enabled. Do not store student data in GitHub.

## Important integration/security notes
- This server implements `/health`, `/api/teacher/login`, and a Firebase-REST-like `/asts_kelas10/<key>.json` endpoint expected by the current HTML. The HTML's existing teacher sign-in flow must be wired to call `/api/teacher/login` and place the returned token in `sessionStorage.portal_teacher_token` before cloud writes; do not treat the UI's current login as server authentication until this integration is completed and tested.
- This starter uses a single configured teacher account and JSON-file storage. For multiple teachers, student-specific permissions, robust concurrency, audit logs, backups, and higher traffic, migrate to PostgreSQL and per-account authorization before production.
- Content endpoints are readable to students; `users`, `results`, and `submissions` require a valid teacher token. Never put real passwords or password hashes in shared student-readable records.
- `index.html` still includes existing local-storage features from the legacy app. Local storage is not a secure place for teacher passwords or sensitive student data. This bundle is a deployment starting point, not a guarantee that the app cannot be breached or suspended. Use HTTPS, unique credentials, least-privilege hosting, backups, moderation/contact details, and comply with Render/GitHub policies.
- Public deployment does not guarantee instant delivery by itself. The frontend's sync polling/event logic and teacher-login token integration must be browser-tested against the deployed API before relying on live updates.
