# Trend Alpha Agent

> Detect emerging internet trends before Forum prices them in.

Built for the **SDxUCSD Agent Hackathon** — Forum (YC W26) track.

---

## What it does

Scans Google Trends, Reddit, and optionally news sources to detect topics with early momentum. Compares that momentum against simulated Forum market prices to surface **mispriced attention** — then outputs `LONG / WATCH / SHORT` with a plain-English explanation.

---

## Architecture

```
Data Sources          Scoring Engine       LLM Layer          Output
─────────────         ──────────────       ─────────          ──────
Google Trends   ──►   scorer.py      ──►   summarizer.py ──►  LONG / WATCH / SHORT
Reddit          ──►   (weighted       ──►   (GPT / Claude      + explanation
News (opt.)     ──►    formula)            / fallback)
Forum stub      ──►   recommender.py
```

---

## Setup

```bash
# 1. Clone and enter the project
cd trend-alpha-agent

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and add your API keys

# 5. Run the terminal demo
python scripts/run_agent_once.py

# 6. Or start the API server
uvicorn app.main:app --reload
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /topics` | List tracked topics |
| `GET /signals` | Run full agent, return ranked results |
| `GET /signals/{topic}` | Run agent for a single topic |
| `GET /signals?topics=X&topics=Y` | Custom topic list |
| `GET /signals?use_news=true` | Include news signal |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_PROVIDER` | No | `openai` or `anthropic` (default: anthropic) |
| `ANTHROPIC_API_KEY` | For LLM | Claude API key |
| `OPENAI_API_KEY` | For LLM | OpenAI API key |
| `REDDIT_CLIENT_ID` | Yes | Reddit app client ID |
| `REDDIT_CLIENT_SECRET` | Yes | Reddit app client secret |
| `REDDIT_USER_AGENT` | No | Defaults to `trend-alpha-agent/0.1` |
| `NEWS_API_KEY` | No | NewsAPI key for news signal |

---

## Scoring Formula

```
combined_score = 0.35 × google_growth
               + 0.35 × reddit_growth
               + 0.20 × acceleration
               + 0.10 × cross_platform_confirmation

mispricing_score = combined_score - forum_price
```

- **LONG**: combined_score ≥ 75 AND mispricing ≥ 15
- **SHORT**: combined_score ≤ 30 AND mispricing ≤ -10
- **WATCH**: everything else

---

## Demo

```bash
python scripts/run_agent_once.py --topics "AI agents" "Claude" "GPT-5"
```

---

## Tests

```bash
pytest tests/
```
