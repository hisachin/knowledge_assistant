# Chatbot Knowledge Base

An AI-powered knowledge base system built with Next.js, PostgreSQL, and vector embeddings. Transform any website into searchable knowledge using semantic similarity search and AI-powered question answering.

## 🚀 Features

- **Smart URL Ingestion**: Automatically fetch, clean, and process content from public URLs
- **AI-Powered Embeddings**: Generate vector embeddings using OpenAI or Hugging Face models
- **Semantic Search**: Find relevant information using vector similarity search
- **Intelligent Chunking**: Smart text chunking with paragraph and sentence awareness
- **AI Question Answering**: Generate intelligent answers using LLM services
- **Streaming Responses**: Real-time streaming of AI-generated answers
- **Content Reranking**: Advanced reranking for better relevance
- **Modern UI**: Built with Next.js 15, TypeScript, Tailwind CSS, and ShadCN UI
- **Scalable Architecture**: Clean architecture with proper separation of concerns

## 🏗️ Architecture

This project follows **Clean Architecture** principles and **SOLID** design patterns:

```
src/
├── app/                    # Next.js App Router (Pages & API Routes)
│   ├── api/               # API endpoints for ingestion, querying, and management
│   ├── dashboard/         # Knowledge base management interface
│   ├── ingest/           # URL ingestion interface
│   └── query/            # AI-powered question answering interface
├── components/            # React Components (UI components and layout)
├── lib/                   # Core utilities (Database, Config)
├── services/              # Business logic services
│   ├── chunking/         # Text chunking algorithms
│   ├── context/          # Context building and filtering
│   ├── embedding/        # Vector embedding services
│   ├── llm/              # Large language model services
│   ├── reranking/        # Content reranking services
│   ├── repositories/     # Data access layer
│   └── scraping/         # Web content extraction
├── hooks/                 # Custom React hooks for state management
├── types/                 # TypeScript type definitions
└── config/                # Application configuration
```

### Design Patterns Used

- **Factory Pattern**: For creating embedding and LLM services
- **Repository Pattern**: For data access abstraction
- **Strategy Pattern**: For different embedding providers and chunking strategies
- **Singleton Pattern**: For database connections
- **Observer Pattern**: For streaming updates and status notifications

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: ShadCN UI with custom components
- **Database**: PostgreSQL with pgvector extension for vector similarity
- **AI Services**: OpenAI API, Hugging Face Inference API
- **LLM Models**: DeepSeek, Llama-2, and other Hugging Face models
- **Web Scraping**: Cheerio for HTML parsing, Axios for HTTP requests
- **Architecture**: Clean Architecture, SOLID Principles, TypeScript interfaces

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- OpenAI API key (or Hugging Face API key)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/hisachin/knowledge_assistant
cd knowledge_assistant
npm install
```

### 2. Set up Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatbot_kb

# Embedding Service Configuration
EMBEDDING_MODEL_PROVIDER=huggingface

# Hugging Face Configuration
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL=BAAI/bge-small-en-v1.5

# OpenAI Configuration (Alternative)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=text-embedding-3-small
```

### 3. Start Database

```bash
docker-compose up -d
```

This will start PostgreSQL with pgvector extension.

### 4. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Usage

### Ingest Content

1. Go to `/ingest` page
2. Enter a public URL
3. Click "Ingest URL"
4. Watch the processing progress with real-time updates
5. Content is automatically chunked, embedded, and stored

### Query Knowledge Base

1. Go to `/query` page
2. Type your question
3. Get AI-generated answers with streaming responses
4. View relevant sources with similarity scores
5. Copy answers or provide feedback

### Manage Sources

1. Go to `/dashboard` page
2. View all ingested sources with statistics
3. Monitor chunk counts and content length
4. Delete sources if needed
5. Track ingestion history

## 🔧 Configuration

### Embedding Models

**Hugging Face (Default)**
- Model: `BAAI/bge-small-en-v1.5`
- Dimensions: 384
- Quality: High performance, multilingual support

**OpenAI (Alternative)**
- Model: `text-embedding-3-small`
- Dimensions: 1536
- Quality: Excellent, but requires API credits

### LLM Models

**Primary Models**
- DeepSeek-R1-Distill-Qwen-1.5B (default)
- Llama-2-7b-chat-hf (fallback)

### Chunking Settings

- Default chunk size: 1000 characters
- Default overlap: 200 characters
- Preserves paragraphs and sentences
- Configurable chunking strategies

## 🗄️ Database Schema

```sql
-- Sources table
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chunks table with vector support
CREATE TABLE chunks (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES sources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384), -- Supports both OpenAI (1536) and Hugging Face (384) dimensions
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 API Endpoints

### POST `/api/ingest`
Ingest a URL into the knowledge base.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "message": "URL successfully ingested",
  "data": {
    "sourceId": 1,
    "chunksCount": 15,
    "title": "Article Title",
    "isUpdate": false
  }
}
```

### POST `/api/query`
Get a simple answer from the knowledge base.

**Request:**
```json
{
  "query": "What is the main topic?"
}
```

### POST `/api/query/stream`
Get streaming AI-generated answers with real-time updates.

**Request:**
```json
{
  "query": "Explain the key concepts"
}
```

**Response:** Server-Sent Events (SSE) stream with:
- Status updates
- Partial answers
- Final complete response
- Source information

### GET `/api/sources`
Retrieve all ingested sources with metadata.

### DELETE `/api/sources/[id]`
Delete a source and all associated chunks.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Docker

```bash
docker build -t knowledge-assistant .
docker run -p 3000:3000 knowledge-assistant
```

## 🚀 Performance Features

- Streaming responses for better UX
- Efficient vector similarity search
- Smart content chunking
- Database connection pooling
- Optimized embedding generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [ShadCN UI](https://ui.shadcn.com/) - Beautiful UI components
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
- [OpenAI](https://openai.com/) - AI embeddings
- [Hugging Face](https://huggingface.co/) - Open source AI models
- [DeepSeek](https://www.deepseek.com/) - Advanced language models

## 👨‍💻 Author

**Sachin** - [@hisachin](https://github.com/hisachin)

## 📞 Support

- Create an issue on [GitHub](https://github.com/hisachin/knowledge_assistant)
- Check the documentation
- Review the code examples

---

Built with ❤️ by [@hisachin](https://github.com/hisachin) using modern web technologies and clean architecture principles.
