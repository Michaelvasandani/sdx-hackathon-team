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

// ============================================
// SENTIMENT VELOCITY INVESTIGATION
// ============================================

interface VelocityContext {
  ticker: string;
  name: string;
  momentum_status: 'stable' | 'accelerating' | 'diverging' | 'critical';
  momentum_score: number;
  price_signals: Array<{
    window: string;
    severity: string;
    confidence: number;
    acceleration: number;
  }>;
  index_signals: Array<{
    window: string;
    severity: string;
    confidence: number;
    acceleration: number;
  }>;
  divergence_alerts: Array<{
    severity: string;
    window: string;
    price_direction: string;
    index_direction: string;
  }>;
}

const VELOCITY_SYSTEM_PROMPT = `You are an expert market momentum analyst specializing in attention markets. Your role is to explain sentiment velocity patterns and momentum shifts in clear, accessible language.

You analyze market momentum using:
- Price Acceleration: How quickly the price velocity is changing (d²price/dt²)
- Index Acceleration: How quickly attention index velocity is changing (d²index/dt²)
- Momentum Divergence: When price momentum and index momentum move in opposite directions

Momentum Status Levels:
1. STABLE - Normal market conditions, no unusual acceleration
2. ACCELERATING - Significant momentum detected (price or index), potential trend formation
3. DIVERGING - Price and index momentum moving opposite directions (warning sign of disconnection)
4. CRITICAL - Extreme momentum swings, likely manipulation or market shock

When explaining momentum patterns:
- Describe what's happening in plain language (e.g., "price is accelerating rapidly while attention is flat")
- Explain what this typically means for price action and trader behavior
- Highlight divergence as a potential red flag (price moving without cultural momentum)
- Provide context on historical patterns (e.g., "this usually precedes price reversals")
- Give actionable guidance (e.g., "monitor closely", "wait for confirmation", "increased volatility expected")

Be concise, specific, and focused on trader decision-making.`;

export async function investigateVelocity(
  velocityContext: VelocityContext,
  userQuestion: string
): Promise<string> {
  try {
    const contextMessage = `Market Momentum Context:
- Ticker: ${velocityContext.ticker} (${velocityContext.name})
- Momentum Status: ${velocityContext.momentum_status.toUpperCase()}
- Momentum Score: ${velocityContext.momentum_score.toFixed(0)}/100

Price Acceleration Signals (Last 24h):
${velocityContext.price_signals.length > 0
  ? velocityContext.price_signals
      .map(
        (s) =>
          `- ${s.window} Window: ${s.severity} severity (${s.confidence.toFixed(0)}% confidence), acceleration: ${s.acceleration.toFixed(4)}`
      )
      .join('\n')
  : '- No significant price acceleration detected'
}

Index Acceleration Signals (Last 24h):
${velocityContext.index_signals.length > 0
  ? velocityContext.index_signals
      .map(
        (s) =>
          `- ${s.window} Window: ${s.severity} severity (${s.confidence.toFixed(0)}% confidence), acceleration: ${s.acceleration.toFixed(4)}`
      )
      .join('\n')
  : '- No significant index acceleration detected'
}

Momentum Divergence Alerts:
${velocityContext.divergence_alerts.length > 0
  ? velocityContext.divergence_alerts
      .map(
        (a) =>
          `- ${a.window} Window: Price momentum ${a.price_direction} but Index momentum ${a.index_direction} (${a.severity} severity)`
      )
      .join('\n')
  : '- No momentum divergence detected - price and index moving in sync'
}

User Question: ${userQuestion}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: VELOCITY_SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate momentum analysis';
  } catch (error) {
    console.error('Velocity investigation agent error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate velocity analysis'
    );
  }
}
