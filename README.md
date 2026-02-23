# GPT Visualizer

Ask questions about your CSV data and get answers with charts. Upload a CSV, type a question, and see text answers plus bar, line, pie, and histogram visualizations.

## Requirements

- Node.js 22+
- npm

## Environment variables

Create a `.env` file in the project root (or set these in your deployment environment):

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your [OpenRouter](https://openrouter.ai) API key for LLM requests. |
| `OPENROUTER_MODEL` | No | Model ID (e.g. `anthropic/claude-3.5-sonnet`). Defaults to `anthropic/claude-3.5-sonnet` if not set. |

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the development server at `http://localhost:3000`:

```bash
npm run dev
```

## Production

Build the application:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run Nuxt typecheck

See [Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment) for deployment options.
