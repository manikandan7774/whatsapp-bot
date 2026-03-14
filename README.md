# WhatsApp Bot

Multi-tenant WhatsApp chatbot powered by **Groq LLM** (Llama 3.1) with **RAG** (Supabase vector search + HuggingFace embeddings).

## Folder Structure

```
whatsapp-bot/
├── server_new.js                 # Entry point (Express server)
├── customers/customers.js        # Customer registry & lookup
├── services/
│   ├── aiService.js              # Groq LLM integration
│   └── whatsappService.js        # WhatsApp Cloud API
├── rag/
│   ├── embed.js                  # HuggingFace embedding generation (all-MiniLM-L6-v2)
│   └── retrieveDocs.js           # Supabase vector similarity search
├── knowledge/                    # Customer knowledge files (1 JSON per customer)
│   ├── gym_a.json
│   └── gym_b.json
├── db/supabaseClient.js          # Supabase client
├── memory/conversationMemory.js  # Conversation cache (future use)
└── ingestion/insertKnowledge.js  # CLI tool for knowledge ingestion
```

## Supabase Setup

Run the following SQL in your Supabase SQL Editor to set up the vector DB:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Drop existing function and table (clean reset)
drop function if exists match_documents;
drop table if exists documents;

-- Documents table
create table if not exists documents (
  id bigserial primary key,
  customer_id text not null,
  content text not null,
  embedding vector(384) not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_documents_customer_id on documents(customer_id);
create index if not exists idx_documents_embedding on documents
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Vector similarity search function
create or replace function match_documents (
  query_embedding vector(384),
  match_customer text,
  match_count int default 3
)
returns table (
  id bigint,
  customer_id text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.customer_id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.customer_id = match_customer
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` or create `.env` with:
   ```
   PORT=3000
   VERIFY_TOKEN=your_verify_token
   ACCESS_TOKEN=your_whatsapp_access_token
   PHONE_NUMBER_ID=your_phone_number_id
   GROQ_API_KEY=your_groq_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

3. **Set up Supabase**
   Run the SQL from the [Supabase Setup](#supabase-setup) section in your Supabase SQL Editor.

4. **Ingest knowledge for a customer**
   ```bash
   # Ingest a specific customer
   node ingestion/insertKnowledge.js gym_a

   # Ingest all customers
   node ingestion/insertKnowledge.js --all
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Expose via ngrok** (for WhatsApp webhook)
   ```bash
   ngrok http 3000
   ```
   Then set the ngrok URL as your webhook in the [Meta Developer Dashboard](https://developers.facebook.com/).

## How It Works

1. WhatsApp sends a message to `POST /webhook`
2. Server identifies the customer by `phone_number_id`
3. User query is embedded (HuggingFace all-MiniLM-L6-v2) and matched against Supabase vector DB (RAG)
4. Retrieved docs + customer context are sent to Groq LLM
5. AI reply is sent back to the user via WhatsApp Cloud API

## Onboarding a New Customer

1. Create a knowledge file: `knowledge/<customer_id>.json`
   ```json
   {
     "customerId": "new_gym",
     "documents": [
       { "content": "Your knowledge text here", "metadata": { "category": "pricing" } }
     ]
   }
   ```
2. Add the customer to `customers/customers.js`
3. Ingest: `node ingestion/insertKnowledge.js new_gym`
4. Done! The bot will now answer questions for this customer.
# whatsapp-bot
# whatsapp-bot
