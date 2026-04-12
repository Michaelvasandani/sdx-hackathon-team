# Detective Agent Architecture

## Why This Is Actually an Agent (Not Just an LLM Wrapper)

### The Problem with Most "AI Agents"
Many projects claim to be "AI agents" but are really just:
- Hardcoded rules that call an LLM to explain results
- Chatbots that answer questions but don't take action
- APIs with LLM-generated responses

**Truth Seeker's Detective Agent is different** - it has true autonomy, decision-making, and action-taking capabilities.

---

## Agent Loop Architecture

```
┌─────────────────────────────────────────────────────┐
│           DETECTIVE AGENT CORE                      │
│                                                     │
│   1. OBSERVE                                        │
│      ↓                                              │
│   2. THINK (LLM decides what to investigate)        │
│      ↓                                              │
│   3. INVESTIGATE (LLM chooses tools)                │
│      ↓                                              │
│   4. SYNTHESIZE (LLM analyzes evidence)             │
│      ↓                                              │
│   5. ACT (Generate alerts & recommendations)        │
│      ↓                                              │
│   6. REPEAT                                         │
└─────────────────────────────────────────────────────┘
```

###  1. OBSERVE
Agent scans environment for anomalies:
```typescript
// Agent starts investigation cycle
const investigation = await agent.runInvestigationCycle();

// LLM receives initial context
"Begin your investigation. Scan all markets and investigate any suspicious activity you find."
```

### 2. THINK (LLM Reasoning)
GPT-4 decides autonomously what to do:
```
Agent: "I should start by scanning all markets to identify any suspicious patterns.
Let me use the scan_all_markets tool to get an overview."
```

### 3. INVESTIGATE (Tool Orchestration)
Agent calls investigation tools based on LLM decisions:

**Available Tools (6):**
1. `scan_all_markets()` - Quick fraud check across all markets
2. `deep_analyze_market(ticker)` - Run all 6 algorithms on specific market
3. `fetch_recent_trades(ticker)` - Analyze trade patterns
4. `analyze_order_book(ticker)` - Check for spoofing and clustering
5. `check_price_history(ticker)` - Historical price/volatility analysis
6. `compare_related_markets(tickers[])` - Cross-market correlation

**Example Tool Call Flow:**
```typescript
// LLM decides: "I found KARDASHIANS has low score, let me investigate"
→ deep_analyze_market("KARDASHIANS")
→ fetch_recent_trades("KARDASHIANS")
→ analyze_order_book("KARDASHIANS")
→ compare_related_markets(["KHLOE", "KOURTNEY", "KIM"])
```

### 4. SYNTHESIZE (Evidence Analysis)
LLM combines results from multiple tools:
```
Agent: "Based on the evidence:
- Order book shows 73% wash trading (repetitive 3.5 contract trades)
- Price moved +18% but index only +4% (manipulation)
- Related markets (KHLOE, KOURTNEY) are healthy, so this is isolated
- Confidence: 85% - This is coordinated manipulation"
```

### 5. ACT (Generate Alerts)
Agent produces actionable output:
```typescript
{
  type: 'alert',
  ticker: 'KARDASHIANS',
  severity: 'critical',
  confidence: 85,
  recommendation: 'AVOID TRADING',
  evidence: { /* tool results */ }
}
```

### 6. REPEAT
Agent runs continuously (every 30 seconds) or on-demand

---

## Real Agent Characteristics

| Characteristic | How Truth Seeker Implements It |
|----------------|--------------------------------|
| **Autonomy** | Agent runs investigation loops without human prompts. Can be set to run continuously every N seconds. |
| **Perception** | Observes Forum markets via API, detects anomalies using fraud algorithms |
| **Reasoning** | GPT-4 decides which markets to investigate and synthesizes evidence from multiple sources |
| **Tool Use** | Dynamically calls 6 investigation tools based on LLM decisions (not hardcoded paths) |
| **Learning** | Builds investigation history, can reference past fraud patterns |
| **Action** | Generates fraud alerts, assigns confidence levels, provides recommendations |
| **Communication** | Streams investigation updates in real-time via Server-Sent Events |

---

## Code Architecture

### 1. Detective Agent Core
**File:** `agents/detective-agent.ts`

```typescript
export class DetectiveAgent {
  async runInvestigationCycle(): Promise<Investigation[]> {
    // 1. OBSERVE: Initial prompt
    const messages = [
      { role: 'system', content: DETECTIVE_SYSTEM_PROMPT },
      { role: 'user', content: 'Begin your investigation...' }
    ];

    // 2-4. THINK, INVESTIGATE, SYNTHESIZE: LLM loop
    while (iterationCount < maxIterations) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        tools: INVESTIGATION_TOOLS,
        tool_choice: 'auto',
      });

      // If LLM wants to call tools
      if (response.tool_calls) {
        for (const toolCall of response.tool_calls) {
          const result = await executeTool(toolCall.name, toolCall.args);
          messages.push({ role: 'tool', content: result });
        }
      } else {
        break; // Investigation complete
      }
    }

    // 5. ACT: Final conclusion
    const conclusion = await llm.generateSummary(messages);
    return conclusion;
  }
}
```

### 2. Investigation Tools
**File:** `agents/detective-agent.ts`

Tools reuse existing fraud detection infrastructure:
```typescript
async function executeTool(toolName: string, args: any) {
  switch (toolName) {
    case 'scan_all_markets':
      // Uses existing fraud-detection-agent.ts
      const marketsData = await fetchAllMarketsData();
      const results = await Promise.all(
        marketsData.map(market => analyzeSingleMarket(market))
      );
      return results.filter(r => r.score < 80);

    case 'deep_analyze_market':
      // Uses existing algorithms/*
      return await analyzeSingleMarket(marketData);

    case 'fetch_recent_trades':
      // Uses existing forum-api/client.ts
      return await forumAPI.getRecentTrades(ticker);

    // ... more tools
  }
}
```

### 3. Real-Time Streaming
**File:** `app/api/agent/investigate/route.ts`

Server-Sent Events stream investigation to browser:
```typescript
export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to agent updates
      detectiveAgent.onUpdate((update) => {
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
      });

      // Start investigation
      detectiveAgent.runInvestigationCycle();
    }
  });

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### 4. Live Dashboard
**File:** `app/agent/page.tsx`

React component that displays agent reasoning in real-time:
```typescript
const eventSource = new EventSource('/api/agent/investigate');

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);

  switch (update.type) {
    case 'thought':
      // Show agent's reasoning
      display(`💭 ${update.content}`);
      break;
    case 'tool_call':
      // Show which tool agent chose
      display(`🔧 Calling: ${update.tool}`);
      break;
    case 'finding':
      // Show agent's conclusion
      display(`🎯 ${update.content}`);
      break;
  }
};
```

---

## Comparison: Agent vs. Non-Agent Implementations

### ❌ NON-AGENT (What we had before)
```
User clicks "Analyze Market"
  ↓
Run hardcoded fraud algorithms (price-index, wash trading, etc.)
  ↓
Calculate score using fixed weights
  ↓
Call LLM to explain the results
  ↓
Show chat interface for user questions
```

**Problems:**
- No autonomy (requires user click)
- No decision-making (hardcoded execution path)
- LLM only used for explanation, not investigation
- Can't adapt investigation based on findings

### ✅ AGENT (What we have now)
```
Agent starts investigation autonomously
  ↓
LLM decides: "I should scan all markets"
  ↓
Agent calls scan_all_markets() tool
  ↓
LLM sees results: "KARDASHIANS score is low, investigate"
  ↓
LLM decides: "Check order book for spoofing"
  ↓
Agent calls analyze_order_book("KARDASHIANS")
  ↓
LLM sees results: "Suspicious clustering found, check trades"
  ↓
Agent calls fetch_recent_trades("KARDASHIANS")
  ↓
LLM synthesizes evidence from all tools
  ↓
Agent generates fraud alert with 85% confidence
```

**Benefits:**
- ✅ Autonomous operation
- ✅ LLM drives investigation flow
- ✅ Adapts based on findings
- ✅ Synthesizes multi-source evidence
- ✅ Takes action (alerts/recommendations)

---

## Demo Flow

### How to Experience the Agent

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Navigate to http://localhost:3000/agent**

3. **Click "Start Investigation"**

4. **Watch the agent work in real-time:**
   - See the agent's thoughts as it reasons about what to do
   - Watch it call investigation tools
   - See evidence being gathered
   - Read the agent's final fraud conclusions

### What You'll See

```
🔍 Starting new investigation cycle. Scanning all markets for anomalies...

💭 I should start by scanning all Forum markets to identify any with low
   integrity scores that warrant deeper investigation.

🔧 Calling tool: scan_all_markets

✓ Tool result received
   Data: { totalMarkets: 39, suspiciousMarkets: 3, markets: [...] }

💭 I found 3 markets with integrity scores below 80. The most concerning is
   KARDASHIANS with a score of 34. Let me investigate this market in detail.

🔧 Calling tool: deep_analyze_market
   Arguments: { ticker: "KARDASHIANS" }

✓ Tool result received

💭 KARDASHIANS shows multiple fraud signals:
   - Wash trading probability: 73%
   - Price-index divergence: +14%

   Let me check the recent trades to confirm wash trading pattern.

🔧 Calling tool: fetch_recent_trades
   Arguments: { ticker: "KARDASHIANS", limit: 100 }

✓ Tool result received
   Data: { uniformityRatio: 0.73, ... }

💭 Confirmed: 73% of trades are exactly 3.5 contracts. This is highly
   suspicious. Let me compare with related markets to see if this is
   coordinated across the family.

🔧 Calling tool: compare_related_markets
   Arguments: { tickers: ["KHLOE", "KOURTNEY", "KIM"] }

✓ Tool result received

🎯 INVESTIGATION COMPLETE

Based on comprehensive analysis, KARDASHIANS market shows strong evidence
of manipulation:

**FRAUD DETECTED - HIGH CONFIDENCE (85%)**

Evidence:
1. Wash Trading: 73% of 174 trades in last 2 hours were identical size (3.5 contracts)
2. Price Manipulation: Price +18% but attention index only +4%
3. Isolated Pattern: Related markets (KHLOE, KOURTNEY, KIM) all healthy - suggests targeted manipulation
4. Order Book Clustering: 7 orders at exact same price point

**RECOMMENDATION: AVOID TRADING**
This market is likely experiencing coordinated pump-and-dump activity.
```

---

## Why This Matters for Hackathon Judges

### Traditional "AI" Projects:
- Call OpenAI API to generate text ❌
- Hardcoded logic with LLM explanations ❌
- Chatbots that answer questions ❌

### Truth Seeker Detective Agent:
- **Autonomous investigation** - Runs without prompts ✅
- **LLM decision-making** - GPT-4 chooses tools and strategy ✅
- **Tool orchestration** - Dynamic function calling ✅
- **Evidence synthesis** - Combines multi-source data ✅
- **Actionable output** - Fraud alerts with confidence levels ✅
- **Real-time visibility** - Watch agent think via SSE stream ✅

This is a **real agentic system**, not just an LLM wrapper.
