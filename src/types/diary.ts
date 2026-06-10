export interface PageParams {
  aspectRatio: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  shadow: 'none' | 'light' | 'heavy';
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textColor: string;
  textIndent: number;
  bgColor: string;
  bgTexture: string | null;
  bgTextureOpacity: number;
  imageMode: 'embed' | 'float';
  floatPadding: number;
}

export interface Preset {
  name: string;
  params: PageParams;
}

export interface ApiConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface DiaryConfig {
  vaultPath: string;
  defaultPreset: string;
  presets: Preset[];
  api: ApiConfig;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  passwordHash?: string;
}

export interface DiaryMeta {
  date: string;
  title: string;
  location?: string;
  tags?: string[];
  preset?: string;
  layoutOverride?: 'lead' | 'lead_text' | 'quote' | 'wide' | 'standard' | 'poster' | 'poster_square' | 'poster_circle' | 'editorial' | 'photo_stack';
  coverImageIndex?: number;
  locked?: boolean;
}

export interface DiaryEntry {
  filePath: string;
  meta: DiaryMeta;
  body: string;
  images: string[];
}

export interface ImagePosition {
  x?: number;
  y?: number;
  w?: number;
}
