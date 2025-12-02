export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text?: string;
  imageUrl?: string;
  originalImageUrl?: string; // To show what was uploaded
  isThinking?: boolean;
  timestamp: number;
}

export interface ImageFile {
  file?: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastImage?: ImageFile; // Context for this session
  updatedAt: number;
}