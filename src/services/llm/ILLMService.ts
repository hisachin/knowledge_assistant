export interface ILLMService {
  generateAnswer(query: string, context: string): Promise<{
    answer: string;
    sources: Array<{ title: string; url: string }>;
  }>;
}

export interface IStreamingLLMService {
  generateStreamingAnswer(query: string, context: string): ReadableStream<Uint8Array>;
}

export interface LLMResponse {
  answer: string;
  sources: Array<{ title: string; url: string }>;
}

export interface StreamingChunk {
  type: 'partial' | 'complete' | 'error';
  data?: {
    answer: string;
    sources: Array<{ title: string; url: string }>;
    isComplete: boolean;
  };
  error?: string;
}
