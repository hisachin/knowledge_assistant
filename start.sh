#!/bin/bash

echo "🚀 Starting Chatbot Knowledge Base..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp env.template .env.local
    echo "⚠️  Please edit .env.local and add your API keys before continuing."
echo "   - For Hugging Face (default): Add your HUGGINGFACE_API_KEY"
echo "   - For OpenAI: Add your OPENAI_API_KEY and set EMBEDDING_MODEL_PROVIDER=openai"
    echo ""
    read -p "Press Enter after you've configured your API keys..."
fi

# Start PostgreSQL with pgvector
echo "🗄️  Starting PostgreSQL with pgvector..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is accessible
if ! docker exec chatbot-kb-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "❌ Database is not ready. Please check Docker logs: docker-compose logs postgres"
    exit 1
fi

echo "✅ Database is ready!"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting Next.js development server..."
echo "📱 Open http://localhost:3000 in your browser"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev
