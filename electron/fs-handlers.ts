import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

function simpleParseYaml(text: string): Record<string, any> {
  const result: Record<string, any> = {};
  let currentKey: string | null = null;
  let inArray = false;
  let arrayValues: string[] = [];

  for (const line of text.split('\n')) {
    const arrayMatch = line.match(/^\s*-\s+(.+)$/);
    if (inArray && arrayMatch) {
      arrayValues.push(arrayMatch[1].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'));
      continue;
    }
    if (inArray && !arrayMatch) {
      if (currentKey) result[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
      currentKey = null;
    }

    const kvMatch = line.match(/^(\w[\w\s]*?):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value: any = kvMatch[2].trim();

      if (currentKey) result[currentKey] = undefined;
      inArray = false;

      if (value === '' || value === '[]') {
        currentKey = key;
        inArray = true;
        arrayValues = [];
      } else {
        const quoted = value.match(/^["'](.+)["']$/);
        result[key] = quoted ? quoted[1] : value;
        currentKey = null;
      }
    }
  }
  if (inArray && currentKey) result[currentKey] = arrayValues;
  return result;
}

function simpleStringifyYaml(obj: Record<string, any>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - "${item}"`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

function parseDiaryFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const m = raw.match(FRONTMATTER_RE);
  if (!m) return null;
  const meta = simpleParseYaml(m[1]);
  const body = m[2].trim();
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, '.md');
  const imgDir = path.join(dir, 'images', baseName);
  let images: string[] = [];
  if (fs.existsSync(imgDir)) {
    images = fs
      .readdirSync(imgDir)
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .map((f) => `images/${baseName}/${f}`);
  }
  return { filePath, meta, body, images };
}

export function registerFsHandlers() {
  ipcMain.handle('dialog:pickFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('fs:scanDiaries', async (_e, rootPath: string) => {
    const entries: any[] = [];
    function walk(dir: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) walk(full);
        else if (entry.isDirectory() && /^\d{2}$/.test(entry.name)) walk(full);
        else if (entry.isFile() && entry.name.endsWith('.md')) {
          const parsed = parseDiaryFile(full);
          if (parsed) entries.push(parsed);
        }
      }
    }
    walk(rootPath);
    return entries.sort(
      (a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''),
    );
  });

  ipcMain.handle('fs:readDiary', async (_e, filePath: string) => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const m = raw.match(FRONTMATTER_RE);
    if (!m) throw new Error('Invalid diary format: ' + filePath);
    return { meta: simpleParseYaml(m[1]), body: m[2].trim() };
  });

  ipcMain.handle(
    'fs:writeDiary',
    async (_e, filePath: string, content: string) => {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
    },
  );

  ipcMain.handle('fs:deleteDiary', async (_e, filePath: string) => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  ipcMain.handle('fs:readConfig', async (_e, rootPath: string) => {
    const configPath = path.join(rootPath, 'diary.config.json');
    if (!fs.existsSync(configPath)) {
      const def = {
        vaultPath: rootPath,
        defaultPreset: 'default',
        presets: [
          {
            name: 'default',
            params: {
              aspectRatio: 0.707,
              marginTop: 30,
              marginBottom: 25,
              marginLeft: 25,
              marginRight: 25,
              shadow: 'light',
              fontFamily: 'Noto Serif SC',
              fontSize: 16,
              lineHeight: 1.8,
              letterSpacing: 0.02,
              paragraphSpacing: 0.8,
              textColor: '#1a1a1a',
              textIndent: 2,
              bgColor: '#faf8f5',
              bgTexture: null,
              bgTextureOpacity: 0,
              imageMode: 'embed',
              floatPadding: 12,
            },
          },
        ],
        api: {
          provider: 'deepseek',
          baseUrl: 'https://api.deepseek.com',
          apiKey: '',
          model: 'deepseek-chat',
        },
        chatHistory: [],
      };
      fs.writeFileSync(configPath, JSON.stringify(def, null, 2), 'utf-8');
      return def;
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  });

  ipcMain.handle(
    'fs:writeConfig',
    async (_e, rootPath: string, config: unknown) => {
      fs.writeFileSync(
        path.join(rootPath, 'diary.config.json'),
        JSON.stringify(config, null, 2),
        'utf-8',
      );
    },
  );

  ipcMain.handle(
    'fs:copyImage',
    async (_e, src: string, destDir: string) => {
      fs.mkdirSync(destDir, { recursive: true });
      const name = path.basename(src);
      const dest = path.join(destDir, name);
      fs.copyFileSync(src, dest);
      return dest;
    },
  );
}
