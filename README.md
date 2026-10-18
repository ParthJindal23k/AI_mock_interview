# AI Mock Interview

An adaptive, AI-powered mock interview platform. Candidates pick a role and tech stack, answer questions by voice on camera, and get scored, personalized feedback after every answer. Question difficulty adapts to how well they are doing, and answers are graded with retrieval-augmented context from past interviews.

**Live demo:** https://ai-mock-interview-nu-virid.vercel.app

## Features

- **Adaptive interviews** — questions are generated one at a time; difficulty moves between easy, medium, and hard based on recent scores.
- **AI evaluation and feedback** — every answer gets a 1–10 score, strengths, weaknesses, actionable feedback, and topics to study.
- **RAG-assisted grading** — the evaluator sees reference answers to similar questions retrieved from a pgvector knowledge base that grows with every interview.
- **Voice and video** — speech-to-text answers, text-to-speech questions, and a webcam view for a realistic setting.
- **Interview history and insights** — a dashboard of past interviews with status, difficulty, and ratings, plus a detailed per-question feedback report and an end-of-interview summary.
- **Secure by default** — Clerk authentication on every non-public route, and every session lookup is scoped to its owner.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, Framer Motion |
| Auth | Clerk |
| Database | PostgreSQL (Neon) with Drizzle ORM |
| Vector database | pgvector (HNSW index, cosine similarity) |
| Workflow orchestration | LangGraph (`StateGraph`) |
| LLM | `openai/gpt-oss-120b` via Groq |
| Embeddings | Google `gemini-embedding-001` (768 dimensions) |

## Architecture

### Interview workflow (LangGraph)

The interview is a LangGraph `StateGraph` with five nodes. A conditional entry edge picks the branch for each request, and a second conditional edge decides whether to ask another question or finish.

```mermaid
flowchart LR
    START((START)) -->|action = start| GQ[generateQuestion]
    START -->|action = answer| EA[evaluateAnswer]
    START -->|action = end| GS[generateSummary]
    EA --> GF[generateFeedback] --> AD[adjustDifficulty]
    AD -->|more questions| GQ
    AD -->|limit reached| GS
    GQ --> END1((END))
    GS --> END2((END))
```

| Node | What it does |
| --- | --- |
| `generateQuestion` | Generates one question at the current difficulty, avoiding topics already covered; stores it and embeds it into the knowledge base |
| `evaluateAnswer` | Retrieves similar past questions from pgvector, then scores the answer against the model answer plus retrieved references |
| `generateFeedback` | Writes actionable feedback and study topics, and saves the full answer record |
| `adjustDifficulty` | Raises difficulty when the last two scores average 8+, lowers it at 4 or below, and checks the question limit |
| `generateSummary` | Summarizes strengths, weaknesses, and recommendations; computes the overall rating from the actual scores |

**Human-in-the-loop on serverless:** the graph runs once per HTTP request and pauses after `generateQuestion` to wait for the candidate. Between requests the full graph state is persisted in `interview_session.session_state`, so any serverless instance can resume the interview.

### Retrieval-augmented grading (pgvector)

1. When a question is generated, the question text is embedded and stored in `answer_embedding` together with its model answer.
2. When the candidate answers, the current question's embedding is used to find the 3 most similar past questions (cosine similarity above 0.75, served by an HNSW index).
3. Their model answers, and any candidate answers that scored 8+, are passed to the evaluator as additional grading references.
4. High-scoring candidate answers are added back to the knowledge base, so grading context improves over time.

Retrieval matches **question to question** rather than answer to answer, so a wrong answer can't pull in other wrong answers as references.

### Data model

| Table | Purpose |
| --- | --- |
| `interview_session` | One row per interview: role, difficulty, status, persisted graph state, summary, rating |
| `interview_question` | Each generated question with its expected answer, difficulty, and topic |
| `interview_answer` | Each answer with score, strengths, weaknesses, feedback, and retrieved context |
| `answer_embedding` | RAG knowledge base: question embedding (`vector(768)`) plus a reference answer |

## Project Structure

```
app/
  (auth)/                      Clerk sign-in and sign-up pages
  api/interview/create         Create a session and generate the first question
  api/interview/submit         Run the answer branch of the graph
  api/interview/end            End early and generate the summary
  api/interviews               Interview history for the current user
  dashboard/                   Dashboard, interview setup, live interview, feedback pages
components/                    Landing page and UI components
lib/
  langgraph/                   Graph state, nodes, and workflow
  langchain/                   LLM client and prompt chains
  rag/                         Embeddings and pgvector retrieval
  auth.ts                      Current user and session-ownership helpers
utils/
  schema.ts                    Drizzle schema
  db.ts                        Database client
scripts/enable-pgvector.ts     Enables the pgvector extension
proxy.ts                       Clerk route protection
```

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database with pgvector support (Neon, Supabase, and Vercel Postgres all include it)
- API keys for [Clerk](https://dashboard.clerk.com), [Groq](https://console.groq.com), and [Google AI Studio](https://aistudio.google.com)

### Setup

```bash
git clone https://github.com/ParthJindal23k/AI_mock_interview.git
cd AI_mock_interview
npm install
```

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgres://user:password@host/db?sslmode=require
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...

# Optional
INTERVIEW_QUESTION_COUNT=5      # questions per interview (default 5)
GROQ_MODEL=openai/gpt-oss-120b  # override the LLM
ENABLE_RAG=false                # turn off retrieval-augmented grading
```

Enable pgvector, create the tables, and start the app:

```bash
npm run db:setup
npm run dev
```

Open http://localhost:3000.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run db:setup` | Enable pgvector and push the schema |
| `npm run db:push` | Push schema changes |
| `npm run db:studio` | Open Drizzle Studio |

## Deployment (Vercel)

1. Import the repository into Vercel.
2. Add every variable from `.env` under **Settings → Environment Variables**.
3. Run `npm run db:setup` once against the production database if it is not the one you used locally.
4. Deploy. AI routes set `maxDuration = 60` because one answer submission makes several LLM calls.

## Design Decisions

- **pgvector instead of a separate vector database** — interview data already lives in Postgres, so embeddings sit next to the rows they describe: no second service, no data syncing between systems. pgvector's HNSW index easily handles this scale, and a dedicated vector database would add cost and latency without a benefit here.
- **A persistent database instead of an in-memory vector store** — serverless functions don't keep memory or disk between requests, so an in-memory index (FAISS, Chroma, a LangChain in-memory store) would lose the knowledge base on every invocation.
- **Graph state in Postgres instead of a LangGraph checkpointer** — the in-memory saver doesn't survive across serverless requests, and each session already has a database row, so the state is stored there and resumed on the next request.
- **Computed rating instead of an LLM-generated rating** — the LLM writes the narrative summary, but the overall rating is the average of the per-question scores so the two always agree.
