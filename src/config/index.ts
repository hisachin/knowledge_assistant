export const APP_CONFIG = {
  name: 'Chatbot Knowledge Base',
  description: 'AI-powered knowledge base with vector search',
  version: '1.0.0',
} as const;

export const DB_CONFIG = {
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
} as const;

export const EMBEDDING_CONFIG = {
  defaultProvider: 'huggingface' as const,
  openai: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
  huggingface: {
    model: 'BAAI/bge-small-en-v1.5',
    dimensions: 384,
  },
} as const;

export const CHUNKING_CONFIG = {
  defaultChunkSize: 1000,
  defaultOverlap: 200,
  maxChunkSize: 2000,
  minChunkSize: 100,
} as const;

export const API_CONFIG = {
  maxUrlLength: 2048,
  maxContentLength: 1000000,
  rateLimit: {
    requests: 100,
    windowMs: 15 * 60 * 1000,
  },
} as const;

export const UI_CONFIG = {
  maxResults: 10,
  defaultPageSize: 20,
  debounceDelay: 300,
} as const;

export const getEmbeddingConfig = () => ({
  provider: (process.env.EMBEDDING_MODEL_PROVIDER as 'openai' | 'huggingface') || 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || EMBEDDING_CONFIG.openai.model,
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: process.env.HUGGINGFACE_MODEL || EMBEDDING_CONFIG.huggingface.model,
    endpoint: process.env.HUGGINGFACE_ENDPOINT,
  },
});

export const getDatabaseConfig = () => ({
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatbot_kb',
  ...DB_CONFIG,
});
