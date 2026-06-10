const BASE = 'http://localhost:5678/api';
const REQUEST_TIMEOUT_MS = 90000;

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}/${path}`, {
      ...init,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`${path}: request timed out`);
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

async function get<T = any>(path: string): Promise<T> {
  return request<T>(path);
}

async function put(path: string, data: any) {
  return request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function del(path: string) {
  return request(path, { method: 'DELETE' });
}

async function post(path: string, data: any) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export const api = {
  // Config
  readConfig: () => get('config'),
  writeConfig: (cfg: any) => put('config', cfg),

  // Diaries
  scanDiaries: () => get<any[]>('diaries'),
  readDiaryRaw: (filePath: string) => get<{ raw: string }>(`diary/${encodeURIComponent(filePath)}`),
  writeDiary: (filePath: string, meta: any, body: string) =>
    put(`diary/${encodeURIComponent(filePath)}`, { meta, body }),
  deleteDiary: (filePath: string) => del(`diaries/${encodeURIComponent(filePath)}`),

  // Images
  listImages: () => get('images'),
  copyImage: (src: string, dest: string) => post('copy-image', { src, dest }),
  uploadImage: async (file: File, dest: string) => {
    const buffer = await file.arrayBuffer();
    const res = await fetch(`${BASE}/upload?dest=${encodeURIComponent(dest)}`, { method: 'POST', body: buffer });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
  deleteImage: async (imgPath: string) => post('delete-image', { path: imgPath.replace(/\\/g, '/') }),

  // DeepSeek
  deepseekCall: (params: { apiKey: string; baseUrl: string; model: string; prompt: string; text: string }) =>
    post('deepseek', params),
  deepseekChat: (params: { apiKey: string; baseUrl: string; model: string; messages: { role: string; content: string }[] }) =>
    post('deepseek', params),
};
