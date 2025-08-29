import { HfInference } from '@huggingface/inference';
import { IEmbeddingService, EmbeddingConfig } from "@/types";
import { EMBEDDING_CONFIG } from "@/config";

export class HuggingFaceEmbeddingService implements IEmbeddingService {
  private client: HfInference;
  private model: string;

  constructor(config: EmbeddingConfig) {
    if (!config.huggingface?.apiKey) {
      throw new Error("Hugging Face API key is required");
    }

    this.model = config.huggingface.model || EMBEDDING_CONFIG.huggingface.model;
    
    this.client = new HfInference(config.huggingface.apiKey);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log("Generating embedding for text:", text.substring(0, 100) + "...");
      
      const embedding = await this.client.featureExtraction({
        model: this.model,
        inputs: text,
      });

      if (!embedding) {
        throw new Error("Empty embedding response from Hugging Face");
      }

      let embeddingArray: number[];
      
      if (Array.isArray(embedding)) {
        if (embedding.length > 0 && Array.isArray(embedding[0])) {
          embeddingArray = embedding[0] as number[];
        } else {
          embeddingArray = embedding as number[];
        }
      } else if (typeof embedding === 'number') {
        embeddingArray = [embedding];
      } else {
        throw new Error("Unexpected embedding response format from Hugging Face");
      }

      console.log(`Generated embedding with ${embeddingArray.length} dimensions`);
      
      if (embeddingArray.length !== EMBEDDING_CONFIG.huggingface.dimensions) {
        console.warn(`Expected ${EMBEDDING_CONFIG.huggingface.dimensions} dimensions, got ${embeddingArray.length}`);
      }

      return embeddingArray;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401')) {
        throw new Error("Invalid Hugging Face API key");
      } else if (errorMessage.includes('429')) {
        throw new Error("Rate limit exceeded for Hugging Face API");
      } else if (errorMessage.includes('503') || errorMessage.includes('loading')) {
        throw new Error("Hugging Face model is currently loading. Please try again in a few minutes.");
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        throw new Error("Model not found. Please check the model name in configuration.");
      }

      throw new Error(
        `Hugging Face embedding error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  getModelInfo(): { name: string; dimensions: number; provider: string } {
    return {
      name: this.model,
      dimensions: EMBEDDING_CONFIG.huggingface.dimensions,
      provider: "huggingface",
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.generateEmbedding("test");
      return true;
    } catch (error) {
      console.error("Hugging Face service availability check failed:", error);
      return false;
    }
  }
}
