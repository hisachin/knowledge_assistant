'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIngestion } from '@/hooks/useIngestion';

export default function IngestPage() {
  const [url, setUrl] = useState('');
  const { ingestUrl, status, progress, error, isUpdate } = useIngestion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      await ingestUrl(url.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Ingest Knowledge</h1>
        <p className="text-muted-foreground">
          Add new content to your knowledge base by providing a public URL
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>URL Ingestion</CardTitle>
                  <CardDescription>
          Enter a public URL to fetch, process, and add to your knowledge base. 
          If the URL already exists, the content will be updated with the latest version.
        </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                Website URL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === 'loading'}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!url.trim() || status === 'loading'}
              className="w-full"
            >
              {status === 'loading' ? 'Processing...' : 'Ingest URL'}
            </Button>
          </form>

          {status !== 'idle' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                <span className="text-sm font-medium capitalize">
                  {status === 'loading' ? 'Processing' : status}
                </span>
                {status === 'loading' && (
                  <Badge variant="secondary">In Progress</Badge>
                )}
              </div>

              {status === 'loading' && progress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {status === 'error' && error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {status === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    ✅ {isUpdate ? 'Content updated successfully! The knowledge base has been refreshed with the latest content.' : 'Successfully ingested! The content has been added to your knowledge base.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Content Fetching</p>
              <p className="text-sm text-muted-foreground">
                We fetch the content from the provided URL and extract the main text content.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Text Processing</p>
              <p className="text-sm text-muted-foreground">
                The content is cleaned, chunked into smaller pieces, and prepared for embedding.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-medium">AI Embedding</p>
              <p className="text-sm text-muted-foreground">
                Each chunk is converted to a vector embedding for semantic search capabilities.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
            <div>
              <p className="font-medium">Storage</p>
              <p className="text-sm text-muted-foreground">
                The processed content and embeddings are stored in the database for future queries.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
