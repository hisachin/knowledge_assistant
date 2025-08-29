import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          AI-Powered Knowledge Base
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transform any website into searchable knowledge. Use AI to find answers instantly from your ingested content.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/ingest">
            <Button size="lg">Start Ingesting</Button>
          </Link>
          <Link href="/query">
            <Button variant="outline" size="lg">Try Query</Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Smart Ingestion</CardTitle>
            <CardDescription>
              Automatically extract and process content from any public URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our AI-powered system fetches, cleans, and chunks content intelligently, 
              preserving context while optimizing for search.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vector Search</CardTitle>
            <CardDescription>
              Find relevant information using semantic similarity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced vector embeddings enable you to find answers even when 
              the exact words don&apos;t match your query.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Management</CardTitle>
            <CardDescription>
              Organize and manage your knowledge sources efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track all ingested sources, manage content, and maintain 
              a clean, organized knowledge base.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Ready to get started?</h2>
        <div className="flex justify-center space-x-4">
          <Link href="/ingest">
            <Button>Ingest Your First URL</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">View Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
