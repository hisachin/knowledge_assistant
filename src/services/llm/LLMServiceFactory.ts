import { ILLMService, IStreamingLLMService } from './ILLMService';
import { HuggingFaceLLMService } from './HuggingFaceLLMService';

export class LLMServiceFactory {
  static createFromEnv(): ILLMService {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is required');
    }
    
    return new HuggingFaceLLMService(apiKey);
  }

  static createStreamingFromEnv(): IStreamingLLMService {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is required');
    }
    
    return new HuggingFaceLLMService(apiKey);
  }
}
