import { IEmbeddingService, EmbeddingConfig } from '../../types';
import { OpenAIEmbeddingService } from './OpenAIEmbeddingService';
import { HuggingFaceEmbeddingService } from './HuggingFaceEmbeddingService';
import { EMBEDDING_CONFIG } from '../../config';

export class EmbeddingServiceFactory {
  public static create(config: EmbeddingConfig): IEmbeddingService {
    switch (config.provider) {
      case 'openai':
        return new OpenAIEmbeddingService(config);
      case 'huggingface':
        return new HuggingFaceEmbeddingService(config);
      default:
        throw new Error(`Unsupported embedding provider: ${config.provider}`);
    }
  }

  public static createFromEnv(): IEmbeddingService {
    const provider = (process.env.EMBEDDING_MODEL_PROVIDER as 'openai' | 'huggingface') || 'huggingface';
    
    const config: EmbeddingConfig = {
      provider,
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || EMBEDDING_CONFIG.openai.model,
      },
      huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY || '',
        model: process.env.HUGGINGFACE_MODEL || EMBEDDING_CONFIG.huggingface.model,
        endpoint: process.env.HUGGINGFACE_ENDPOINT,
      },
    };

    console.log(`Creating embedding service for provider: ${provider}`);
    console.log(`OpenAI API Key: ${config.openai?.apiKey ? 'Set' : 'Not set'}`);
    console.log(`Hugging Face API Key: ${config.huggingface?.apiKey ? 'Set' : 'Not set'}`);

    return this.create(config);
  }

  public static validateConfig(config: EmbeddingConfig): boolean {
    switch (config.provider) {
      case 'openai':
        return !!(config.openai?.apiKey);
      case 'huggingface':
        return !!(config.huggingface?.apiKey);
      default:
        return false;
    }
  }
}
