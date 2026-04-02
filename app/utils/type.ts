export type Message = {
  id: string;
  role: 'bot' | 'user';
  content: string;
  rawText: string;
  timestamp: Date;
  quickReplies?: string[];
  rated?: 'up' | 'down' | null;
};

export type KnowledgeEntry = {
  keywords: string[];
  response: { content: string; quickReplies?: string[] };
};
