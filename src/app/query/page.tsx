'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStreamingQuery } from '@/hooks/useStreamingQuery';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, StopCircle, Sparkles, ExternalLink, Copy, Star } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; url: string }>;
}

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { searchQuery, results, status, error, isStreaming, progress, stopStreaming } = useStreamingQuery();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isStreaming && results.answer) {
      setIsTyping(true);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content !== results.answer) {
          lastMessage.content = results.answer;
          return [...newMessages];
        }
        return prev;
      });
    } else if (!isStreaming && status === 'success') {
      setIsTyping(false);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = results.answer;
          lastMessage.sources = results.sources;
          return [...newMessages];
        }
        return prev;
      });
    }
  }, [isStreaming, results.answer, status, results.sources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isStreaming) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: query.trim(),
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setQuery('');
      setIsTyping(true);

      try {
        await searchQuery(query.trim());
      } catch (error) {
        console.error('Search query failed:', error);
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFeedback = (messageId: string, feedback: 'helpful' | 'not-helpful') => {
    console.log(`Feedback for message ${messageId}: ${feedback}`);
    
    const button = document.querySelector(`[data-feedback="${messageId}-${feedback}"]`);
    if (button) {
      button.classList.add('bg-green-100', 'text-green-700');
      setTimeout(() => {
        button.classList.remove('bg-green-100', 'text-green-700');
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border rounded-xl shadow-sm">
          <div className="px-4 pt-4 pb-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Welcome to your AI Assistant</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Ask me anything about your knowledge base. I'll search through your documents and provide detailed answers.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.id}-${message.content.length}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-2xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground ml-3' 
                          : 'bg-muted text-muted-foreground mr-3'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50'
                        }`}>
                          {message.role === 'user' ? (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          ) : (
                            <div className="space-y-3">
                              <div className="prose prose-sm max-w-none">
                                {message.content && (
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                )}
                              </div>

                              {message.sources && message.sources.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-sm">Sources:</h4>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {message.sources.slice(0, 3).map((source, index) => (
                                      <a 
                                        key={index} 
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-background border rounded-lg p-3 flex items-center justify-between hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate text-foreground">{source.title}</p>
                                          <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                                        </div>
                                        <div className="flex items-center space-x-1 ml-2">
                                          <Star className="w-3 h-3 text-muted-foreground fill-current" />
                                          <span className="text-xs text-muted-foreground">{index + 1}</span>
                                        </div>
                                      </a>
                                    ))}
                                    {message.sources.length > 3 && (
                                      <Button variant="outline" size="sm" className="h-auto py-2">
                                        +{message.sources.length - 3} More
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {message.role === 'assistant' && message.content && (
                                <div className="flex items-center justify-between pt-3 border-t">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-muted-foreground">Was this helpful?</span>
                                      <div className="flex space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700"
                                          onClick={() => handleFeedback(message.id, 'helpful')}
                                          data-feedback={`${message.id}-helpful`}
                                        >
                                          👍
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-red-700"
                                          onClick={() => handleFeedback(message.id, 'not-helpful')}
                                          data-feedback={`${message.id}-not-helpful`}
                                        >
                                          👎
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(message.content)}>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className={`text-xs text-muted-foreground mt-2 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="flex max-w-2xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-3">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="inline-block rounded-2xl px-4 py-3 bg-muted/50">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-muted-foreground">{progress || 'Processing your question...'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 max-w-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-destructive/20 rounded-full flex items-center justify-center">
                          <span className="text-destructive text-xs">!</span>
                        </div>
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t bg-muted/30 p-3 rounded-b-xl">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask follow up question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isStreaming}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-0 bg-background focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    Enter
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={!query.trim() || isStreaming}
                  className="px-6 py-3 rounded-xl font-medium"
                >
                  {isStreaming ? (
                    <StopCircle className="w-5 h-5" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
              
              {isStreaming && (
                <div className="mt-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopStreaming}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Stop generating
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
