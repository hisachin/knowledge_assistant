export interface Source {
  id?: number;
  url: string;
  title?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Chunk {
  id?: number;
  sourceId: number;
  content: string;
  embedding?: number[];
  chunkIndex: number;
  createdAt?: Date;
}

export interface Query {
  id?: number;
  text: string;
  embedding?: number[];
  results?: QueryResult[];
  createdAt?: Date;
}

export interface QueryResult {
  chunkId: number;
  sourceId: number;
  content: string;
  similarity: number;
  sourceUrl: string;
  sourceTitle?: string;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{ title: string; url: string }>;
  chunksUsed: number;
  qualityMetrics?: {
    totalChunks: number;
    filteredChunks: number;
    estimatedTokens: number;
    averageQualityScore: number;
  };
}

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  getModelInfo(): { name: string; dimensions: number; provider: string };
  isAvailable(): Promise<boolean>;
}

export interface IScrapingService {
  scrapeUrl(url: string): Promise<ScrapedContent>;
  isValidUrl(url: string): boolean;
  getSupportedDomains(): string[];
}

export interface IChunkingService {
  chunkText(text: string, options?: ChunkingOptions): Promise<TextChunk[]>;
  getOptimalChunkSize(): number;
}

export interface ISourceRepository {
  create(source: Source): Promise<Source>;
  findById(id: number): Promise<Source | null>;
  findByUrl(url: string): Promise<Source | null>;
  findAll(): Promise<Source[]>;
  update(id: number, source: Partial<Source>): Promise<Source | null>;
  delete(id: number): Promise<boolean>;
  exists(url: string): Promise<boolean>;
}

export interface IChunkRepository {
  create(chunk: Chunk): Promise<Chunk>;
  findById(id: number): Promise<Chunk | null>;
  findBySourceId(sourceId: number): Promise<Chunk[]>;
  findSimilar(embedding: number[], limit: number): Promise<ChunkWithSimilarity[]>;
  update(id: number, chunk: Partial<Chunk>): Promise<Chunk | null>;
  delete(id: number): Promise<boolean>;
  deleteBySourceId(sourceId: number): Promise<boolean>;
  countBySourceId(sourceId: number): Promise<number>;
}

export interface ChunkWithSimilarity extends Chunk {
  sourceUrl: string;
  sourceTitle?: string;
  similarity: number;
}

export interface ScrapedContent {
  url: string;
  title: string;
  description: string;
  content: string;
  metadata: {
    language?: string;
    author?: string;
    publishedDate?: string;
    wordCount: number;
  };
}

export interface TextChunk {
  content: string;
  index: number;
  startPosition: number;
  endPosition: number;
  metadata?: {
    paragraphIndex?: number;
    sentenceIndex?: number;
  };
}

export interface ChunkingOptions {
  maxChunkSize?: number;
  overlapSize?: number;
  preserveParagraphs?: boolean;
  preserveSentences?: boolean;
}

export interface EmbeddingConfig {
  provider: 'openai' | 'huggingface';
  openai?: {
    apiKey: string;
    model?: string;
  };
  huggingface?: {
    apiKey: string;
    model: string;
    endpoint?: string;
  };
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Status = 'idle' | 'loading' | 'success' | 'error';
export type EmbeddingProvider = 'openai' | 'huggingface';
export type ChunkingStrategy = 'fixed-size' | 'paragraph-aware' | 'sentence-aware';
