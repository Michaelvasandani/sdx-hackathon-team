/**
 * Investigation Agent
 *
 * OpenAI-powered conversational agent that explains fraud detection results
 * in natural language
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MarketContext {
  ticker: string;
  name: string;
  category: string;
  integrityScore: number;
  riskLevel: string;
  signals: {
    price_index_divergence: number;
    spoofing_events: number;
    wash_trading_probability: number;
    bot_coordination_detected: boolean;
    funding_anomaly_score: number;
    correlation_break_score: number;
  };
  alerts: Array<{
    type: string;
    severity: string;
    confidence: number;
    description: string;
    evidence: any;
  }>;
}

const SYSTEM_PROMPT = `You are an expert fraud detection analyst for cryptocurrency and attention markets. Your role is to explain market integrity scores and fraud detection signals in clear, accessible language.

You have access to detailed fraud detection analysis including:
- Integrity scores (0-100, where 100 is perfectly safe)
- Six fraud detection signals:
  1. Price-Index Divergence (30% weight): Detects price manipulation without attention growth
  2. Order Book Spoofing (25% weight): Detects fake liquidity
  3. Wash Trading (20% weight): Detects self-trading to inflate volume
  4. Bot Coordination (10% weight): Detects coordinated bot networks
  5. Funding Rate Anomalies (10% weight): Detects unnatural positioning
  6. Correlation Breaks (5% weight): Detects isolated manipulation

When explaining:
- Use clear, non-technical language when possible
- Explain the significance of each signal in context
- Be direct about risks without being alarmist
- Provide actionable insights (e.g., "monitor closely", "avoid trading")
- Reference specific evidence from the analysis
- Compare to typical patterns in healthy markets

If asked about a specific alert, explain:
- What the alert means in plain English
- Why it was triggered (the evidence)
- How confident the detection is
- What it suggests about market manipulation

Be concise but thorough. Focus on what matters to traders making decisions.`;

export async function investigateMarket(
  marketContext: MarketContext,
  userQuestion: string
): Promise<string> {
  try {
    const contextMessage = `Market Context:
- Ticker: ${marketContext.ticker} (${marketContext.name})
- Category: ${marketContext.category}
- Integrity Score: ${marketContext.integrityScore}/100
- Risk Level: ${marketContext.riskLevel.toUpperCase()}

Fraud Detection Signals:
- Price-Index Divergence: ${marketContext.signals.price_index_divergence.toFixed(1)}% (weight: 30%)
- Order Book Spoofing: ${marketContext.signals.spoofing_events} events (weight: 25%)
- Wash Trading Probability: ${(marketContext.signals.wash_trading_probability * 100).toFixed(1)}% (weight: 20%)
- Bot Coordination: ${marketContext.signals.bot_coordination_detected ? 'DETECTED' : 'Not detected'} (weight: 10%)
- Funding Anomaly Score: ${marketContext.signals.funding_anomaly_score.toFixed(1)} (weight: 10%)
- Correlation Break Score: ${marketContext.signals.correlation_break_score.toFixed(1)} (weight: 5%)

Active Alerts (${marketContext.alerts.length}):
${marketContext.alerts.length > 0
  ? marketContext.alerts.map((alert, i) =>
      `${i + 1}. ${alert.type.replace(/_/g, ' ').toUpperCase()} - ${alert.severity} severity (${alert.confidence.toFixed(0)}% confidence)
   Description: ${alert.description}`
    ).join('\n\n')
  : 'No active alerts - market appears healthy'
}

User Question: ${userQuestion}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate response';
  } catch (error) {
    console.error('Investigation agent error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate investigation response'
    );
  }
}

export async function investigateGeneralQuestion(userQuestion: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuestion },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate response';
  } catch (error) {
    console.error('Investigation agent error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate investigation response'
    );
  }
}
