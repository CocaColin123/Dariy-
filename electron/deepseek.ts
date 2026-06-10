import { ipcMain } from 'electron';

export function registerDeepSeekHandler() {
  ipcMain.handle(
    'ai:deepseek',
    async (
      _e,
      params: {
        apiKey: string;
        baseUrl: string;
        model: string;
        prompt: string;
        text: string;
      },
    ) => {
      const url = `${params.baseUrl}/v1/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${params.apiKey}`,
        },
        body: JSON.stringify({
          model: params.model,
          messages: [
            { role: 'system', content: params.prompt },
            { role: 'user', content: params.text },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`DeepSeek API: ${res.status} ${errBody}`);
      }
      return res.json();
    },
  );
}
