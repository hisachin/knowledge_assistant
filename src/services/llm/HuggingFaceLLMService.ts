import { ILLMService, IStreamingLLMService, LLMResponse } from './ILLMService';
import { InferenceClient } from '@huggingface/inference';

export class HuggingFaceLLMService implements ILLMService, IStreamingLLMService {
  private client: InferenceClient;
  private model: string;
  private fallbackModels: string[];

  constructor(apiKey: string) {
    this.client = new InferenceClient(apiKey);
    this.model = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B';
    this.fallbackModels = [
      'meta-llama/Llama-2-7b-chat-hf'
    ];
  }

  private async tryModel(modelName: string, messages: Array<{ role: string; content: string }>, stream: boolean = false) {
    try {
      console.log(`Trying model: ${modelName}`);
      
      if (stream) {
        return { success: true, response: null };
      }
      
      const response = await this.client.chatCompletion({
        model: modelName,
        messages: messages,
        provider: "auto",
        parameters: {
          max_tokens: 500,
          temperature: 0.6,
        },
      });
      
      return { success: true, response };
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error);
      return { success: false, error };
    }
  }

  async generateAnswer(query: string, context: string): Promise<LLMResponse> {
    try {
      console.log('Generating answer for query:', query);
      console.log('Context:', context);
      
      const messages = [
        {
          role: "system",
          content: "You are a helpful assistant. Answer based only on the provided documentation context. If the answer is not in the context, say you don't know.",
        },
        {
          role: "user",
          content: `Question: ${query}\n\nDocumentation Context:\n${context}`,
        },
      ];

      let result = await this.tryModel(this.model, messages, false);
      
      if (!result.success) {
        console.log('Primary model failed, trying fallback models...');
        for (const fallbackModel of this.fallbackModels) {
          result = await this.tryModel(fallbackModel, messages, false);
          if (result.success) {
            console.log(`Fallback model ${fallbackModel} succeeded`);
            break;
          }
        }
      }

      if (!result.success || !result.response || !result.response.choices || !result.response.choices[0]?.message?.content) {
        throw new Error('All models failed to generate a response');
      }

      const fullAnswer = result.response.choices[0].message.content;
      console.log('Generated answer:', fullAnswer);

      const sources = this.extractSourcesFromContext(context);

      return {
        answer: this.cleanAnswer(fullAnswer),
        sources,
      };

    } catch (error) {
      console.error('LLM service error:', error);
      return {
        answer: 'Sorry, I encountered an error while processing your question. Please try again.',
        sources: [],
      };
    }
  }

  generateStreamingAnswer(query: string, context: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    
    return new ReadableStream({
      start: async (controller) => {
        try {
          console.log('Starting streaming answer generation for query:', query);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'partial', 
            data: {
              answer: '',
              sources: [],
              isComplete: false,
            }
          })}\n\n`));

          const messages = [
            {
              role: "system",
              content: "You are a helpful assistant. Answer based only on the provided documentation context. If the answer is not in the context, say you don't know.",
            },
            {
              role: "user",
              content: `Question: ${query}\n\nDocumentation Context:\n${context}`,
            },
          ];

          let fullAnswer = '';
          
          try {
            console.log('Attempting streaming response with primary model...');
            
            const stream = this.client.chatCompletionStream({
              provider: "auto",
              model: this.model,
              messages: messages,
              parameters: {
                max_tokens: 500,
                temperature: 0.6,
              },
            });
            
            console.log('Received streaming response, processing...');
            
            for await (const chunk of stream) {
              if (chunk.choices && chunk.choices.length > 0) {
                const newContent = chunk.choices[0].delta.content;
                if (newContent) {
                  fullAnswer += newContent;
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'partial', 
                    data: {
                      answer: fullAnswer,
                      sources: this.extractSourcesFromContext(context),
                      isComplete: false,
                    }
                  })}\n\n`));
                }
              }
            }
            
          } catch (streamingError) {
            console.warn('Streaming with primary model failed:', streamingError);
            
            try {
              const result = await this.tryModel(this.model, messages, false);
              if (result.success && result.response && result.response.choices && result.response.choices[0]?.message?.content) {
                fullAnswer = result.response.choices[0].message.content;
                console.log('Primary model succeeded with non-streaming response');
              }
            } catch (primaryError) {
              console.warn('Primary model failed completely:', primaryError);
            }
          }

          if (!fullAnswer.trim()) {
            console.log('Primary model failed, trying fallback models...');
            for (const fallbackModel of this.fallbackModels) {
              try {
                const result = await this.tryModel(fallbackModel, messages, false);
                if (result.success && result.response && result.response.choices && result.response.choices[0]?.message?.content) {
                  fullAnswer = result.response.choices[0].message.content;
                  console.log(`Fallback model ${fallbackModel} succeeded`);
                  break;
                }
              } catch (fallbackError) {
                console.warn(`Fallback model ${fallbackModel} failed:`, fallbackError);
              }
            }
          }

          if (!fullAnswer.trim()) {
            throw new Error('All models failed to generate a response');
          }

          if (fullAnswer && !fullAnswer.includes('\n')) {
            console.log('Simulating streaming for better UX');
            const characters = fullAnswer.split('');
            let currentAnswer = '';
            
            for (let i = 0; i < characters.length; i++) {
              currentAnswer += characters[i];
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'partial', 
                data: {
                  answer: currentAnswer,
                  sources: this.extractSourcesFromContext(context),
                  isComplete: false,
                }
              })}\n\n`));
              
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            data: {
              answer: this.cleanAnswer(fullAnswer),
              sources: this.extractSourcesFromContext(context),
              isComplete: true,
            }
          })}\n\n`));

          controller.close();
          
        } catch (error) {
          console.error('Streaming LLM service error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: 'Sorry, I encountered an error while processing your question. Please try again.'
          })}\n\n`));
          controller.close();
        }
      },
    });
  }

  private extractSourcesFromContext(context: string): Array<{ title: string; url: string }> {
    const sources: Array<{ title: string; url: string }> = [];
    const docBlocks = context.split('\n---\n');
    
    for (const block of docBlocks) {
      const titleMatch = block.match(/\[Title: (.+?)\]/);
      const urlMatch = block.match(/\[URL: (.+?)\]/);
      
      if (titleMatch && urlMatch) {
        sources.push({
          title: titleMatch[1].trim(),
          url: urlMatch[1].trim(),
        });
      }
    }
    
    return sources;
  }

  private cleanAnswer(answer: string): string {
    return answer.trim();
  }
}