export enum Feature {
  IMAGE_GENERATION = 'Image Generation',
  FILE_ANALYSIS = 'File Analysis',
}

export enum PowerMode {
  THINK = 'think',
  PRO2 = 'pro2',
  SUPER = 'super',
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  sender: MessageSender;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  isLoading?: boolean;
  isThinking?: boolean;
  isSuperThinking?: boolean;
  sources?: GroundingChunk[];
  color?: string;
  thinkingType?: PowerMode | string;
  isWelcomeMessage?: boolean;
}

export interface User {
  name: string;
  email: string;
}

export interface Usage {
  count: number;
  timestamp: number;
}
