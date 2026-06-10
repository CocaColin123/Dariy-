import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5678;

const DATA_DIR = process.env.DIARY_VAULT_PATH || path.join(__dirname, 'data');
const DIST_DIR = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.ico': 'image/x-icon',
};

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath)) return false;
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': mime, 'Content-Length': content.length });
  res.end(content);
  return true;
}

function serveSPA(res) {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(indexPath, 'utf-8'));
  } else {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('前端尚未构建，请运行 npm run build');
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function parseFrontmatter(raw) {
  const clean = raw.replace(/^﻿/, '');
  const m = clean.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith('[')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^"(.*)"$/, '$1')).filter(Boolean);
    }
    meta[kv[1]] = val;
  }
  return { meta, body: m[2].trim() };
}

function stringifyFrontmatter(meta, body) {
  const lines = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(x => `"${x}"`).join(', ')}]`);
    else lines.push(`${k}: "${v}"`);
  }
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

function scanDiaries(dir) {
  const entries = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) walk(full);
      else if (entry.isDirectory() && /^\d{2}$/.test(entry.name)) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const raw = fs.readFileSync(full, 'utf-8');
        const parsed = parseFrontmatter(raw);
        if (!parsed) continue;
        const baseName = path.basename(full, '.md');
        const imgDir = path.join(path.dirname(full), 'images', baseName);
        let images = [];
        if (fs.existsSync(imgDir)) {
          const relDir = path.relative(DATA_DIR, imgDir).replace(/\\/g, '/');
          images = fs.readdirSync(imgDir)
            .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
            .map(f => `${relDir.replace(/\\/g, '/')}/${f}`);
        }
        entries.push({ filePath: full, meta: parsed.meta, body: parsed.body, images });
      }
    }
  }
  walk(dir);
  return entries.sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));
}

function listImages() {
  const imagesDir = path.join(DATA_DIR, '..', '..', 'images');
  const dirs = [];
  const files = [];
  function walk(d, basePath) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        dirs.push(basePath ? `${basePath}/${entry.name}` : entry.name);
        walk(path.join(d, entry.name), basePath ? `${basePath}/${entry.name}` : entry.name);
      } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(entry.name)) {
        files.push({ path: basePath ? `${basePath}/${entry.name}` : entry.name, name: entry.name });
      }
    }
  }
  walk(imagesDir, '');
  return { dirs, files };
}

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
  });
}

function send(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(JSON.stringify(data));
}

function sendError(res, msg, status = 400) { send(res, { error: msg }, status); }

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(); return; }

  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname.replace(/^\/api\/?/, '');

  // API 路由
  if (req.url.startsWith('/api/')) {
    // --- Config ---
  if (req.method === 'GET' && p === 'config') {
    const configPath = path.join(DATA_DIR, 'diary.config.json');
    if (!fs.existsSync(configPath)) {
      const def = {
        vaultPath: DATA_DIR,
        defaultPreset: 'default',
        presets: [{ name: 'default', params: { aspectRatio: 0.707, marginTop: 20, marginBottom: 20, marginLeft: 22, marginRight: 22, shadow: 'light', fontFamily: 'Noto Serif SC', fontSize: 24, lineHeight: 1.9, letterSpacing: 0.02, paragraphSpacing: 0.8, textColor: '#151515', textIndent: 0, bgColor: '#fbf7f0', bgTexture: null, bgTextureOpacity: 0, imageMode: 'embed', floatPadding: 12 } }],
        api: { provider: 'deepseek', baseUrl: 'https://api.deepseek.com', apiKey: 'sk-d30ebd164e8a4747a1f3992fa52d48f7', model: 'deepseek-chat', maxTokens: 4096, temperature: 0.7, topP: 0.9 },
        chatHistory: [],
      };
      writeJson(configPath, def);
      send(res, def);
    } else {
      send(res, readJson(configPath));
    }
    return;
  }

  if (req.method === 'PUT' && p === 'config') {
    const body = await parseBody(req);
    const configPath = path.join(DATA_DIR, 'diary.config.json');
    writeJson(configPath, body);
    send(res, { ok: true });
    return;
  }

  // --- Diaries ---
  if (req.method === 'GET' && p === 'diaries') {
    send(res, scanDiaries(DATA_DIR));
    return;
  }

  if (req.method === 'DELETE' && p.startsWith('diaries/')) {
    let relPath = decodeURIComponent(p.slice('diaries/'.length));
    if (relPath.startsWith(DATA_DIR)) relPath = relPath.slice(DATA_DIR.length).replace(/^[\\/]+/, '');
    const filePath = path.join(DATA_DIR, relPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    send(res, { ok: true });
    return;
  }

  // --- Single diary (raw md content) ---
  if (req.method === 'GET' && p.startsWith('diary/')) {
    let relPath = decodeURIComponent(p.slice('diary/'.length));
    if (relPath.startsWith(DATA_DIR)) relPath = relPath.slice(DATA_DIR.length).replace(/^[\\/]+/, '');
    const filePath = path.join(DATA_DIR, relPath);
    if (!fs.existsSync(filePath)) { sendError(res, 'Not found', 404); return; }
    send(res, { raw: fs.readFileSync(filePath, 'utf-8') });
    return;
  }

  if (req.method === 'PUT' && p.startsWith('diary/')) {
    const body = await parseBody(req);
    let relPath = decodeURIComponent(p.slice('diary/'.length));
    // Strip DATA_DIR if accidentally sent as absolute path
    if (relPath.startsWith(DATA_DIR)) relPath = relPath.slice(DATA_DIR.length).replace(/^[\\/]+/, '');
    const filePath = path.join(DATA_DIR, relPath);
    const md = stringifyFrontmatter(body.meta, body.body);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, md, 'utf-8');
    send(res, { ok: true });
    return;
  }

  // --- Images ---
  if (req.method === 'GET' && p === 'images') {
    send(res, listImages());
    return;
  }

  if (req.method === 'POST' && p === 'copy-image') {
    const body = await parseBody(req);
    const destDir = path.dirname(body.dest);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(body.src, body.dest);
    send(res, { ok: true, dest: body.dest });
    return;
  }

  // Upload raw binary file — used by the image picker
  if (req.method === 'POST' && p === 'upload') {
    const dest = url.searchParams.get('dest');
    if (!dest) { sendError(res, 'Missing dest param', 400); return; }
    const destPath = path.resolve(DATA_DIR, '..', dest);
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, buffer);
      console.log(`[upload] saved ${buffer.length} bytes → ${destPath}`);
      send(res, { ok: true, dest });
    });
    req.on('error', (err) => { console.error('[upload] error', err); sendError(res, err.message, 500); });
    return;
  }

  // Delete an image file
  if (req.method === 'POST' && p === 'delete-image') {
    const body = await parseBody(req);
    if (!body || !body.path) { sendError(res, 'Missing path', 400); return; }
    const fullPath = path.join(DATA_DIR, body.path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      const dir = path.dirname(fullPath);
      try { if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir); } catch {}
      send(res, { ok: true });
    } else {
      sendError(res, 'Not found', 404);
    }
    return;
  }

  // --- DeepSeek proxy ---
  if (req.method === 'POST' && p === 'deepseek') {
    const body = await parseBody(req);
    try {
      let messages, temperature, extra = {};
      if (body.messages) {
        // Chat mode: multi-turn conversation
        messages = body.messages;
        temperature = body.temperature || 0.5;
      } else {
        // Extract mode: system prompt + user text
        messages = [{ role: 'system', content: body.prompt }, { role: 'user', content: body.text }];
        temperature = 0.3;
      }
      const dsRes = await fetch(`${body.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${body.apiKey}` },
        body: JSON.stringify({ model: body.model, messages, temperature, max_tokens: body.maxTokens || 4096, top_p: body.topP || 0.9, ...extra }),
      });
      const text = await dsRes.text();
      if (!dsRes.ok) {
        console.error('[deepseek] API error', dsRes.status, text.slice(0, 300));
        sendError(res, `DeepSeek ${dsRes.status}: ${text.slice(0, 200)}`, dsRes.status);
        return;
      }
      send(res, JSON.parse(text));
    } catch (err) {
      console.error('[deepseek] fetch error', err);
      sendError(res, err.message, 502);
    }
    return;
  }
  } // /api 路由结束

  // Serve data directory files (images)
  if (url.pathname.startsWith('/data/') && url.pathname.length > 6) {
    const dataFilePath = path.join(DATA_DIR, decodeURIComponent(url.pathname.slice(1).replace(/^\/?data\//, '')));
    if (serveStatic(res, dataFilePath)) return;
  }

  // 静态文件 + SPA fallback
  const staticPath = path.join(DIST_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  if (serveStatic(res, staticPath)) return;
  serveSPA(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`📓 Diary Vault API → http://localhost:${PORT}`);
  console.log(`   工作区: ${DATA_DIR}`);
  console.log(`   (仅本机可访问)`);
});
