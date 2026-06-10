import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('diaryApi', {
  scanDiaries: (rootPath: string) => ipcRenderer.invoke('fs:scanDiaries', rootPath),
  readDiary: (filePath: string) => ipcRenderer.invoke('fs:readDiary', filePath),
  writeDiary: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeDiary', filePath, content),
  deleteDiary: (filePath: string) => ipcRenderer.invoke('fs:deleteDiary', filePath),
  readConfig: (rootPath: string) => ipcRenderer.invoke('fs:readConfig', rootPath),
  writeConfig: (rootPath: string, config: unknown) =>
    ipcRenderer.invoke('fs:writeConfig', rootPath, config),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  deepseekCall: (params: {
    apiKey: string;
    baseUrl: string;
    model: string;
    prompt: string;
    text: string;
  }) => ipcRenderer.invoke('ai:deepseek', params),
  copyImage: (src: string, destDir: string) =>
    ipcRenderer.invoke('fs:copyImage', src, destDir),
});
