import OpenAI from 'openai';
import { IEmbeddingService, EmbeddingConfig } from '@/types';
import { EMBEDDING_CONFIG } from '@/config';

export class OpenAIEmbeddingService implements IEmbeddingService {
  private client: OpenAI;
  private model: string;

  constructor(config: EmbeddingConfig) {
    if (!config.openai?.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });

    this.model = config.openai.model || EMBEDDING_CONFIG.openai.model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('Failed to generate embedding');
      }

      return embedding;
    } catch (error) {
      throw new Error(`OpenAI embedding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getModelInfo(): { name: string; dimensions: number; provider: string } {
    return {
      name: this.model,
      dimensions: EMBEDDING_CONFIG.openai.dimensions,
      provider: 'openai',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
