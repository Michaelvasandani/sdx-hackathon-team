/**
 * Simulated Agent Investigations
 *
 * Pre-scripted fraud investigations that demonstrate the agent's
 * reasoning process, tool usage, and fraud detection capabilities
 */

export interface InvestigationStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'conclusion' | 'alert';
  delay: number; // milliseconds before showing this step
  content: string;
  data?: any;
  icon?: string;
}

export interface SimulatedInvestigation {
  id: string;
  name: string;
  description: string;
  ticker: string;
  fraudType: string;
  finalScore: number;
  confidence: number;
  emoji: string;
  steps: InvestigationStep[];
}

// ============================================
// INVESTIGATION 1: Wash Trading Discovery
// ============================================

export const washTradingInvestigation: SimulatedInvestigation = {
  id: 'wash-trading',
  name: 'Wash Trading Discovery',
  description: 'Agent detects coordinated self-trading to inflate volume',
  ticker: 'KARDASHIANS',
  fraudType: 'Wash Trading + Price Manipulation',
  finalScore: 34,
  confidence: 85,
  emoji: '🤖',
  steps: [
    {
      type: 'thought',
      delay: 0,
      content: '🔍 Starting investigation cycle. Scanning all markets for anomalies...',
    },
    {
      type: 'tool_call',
      delay: 1200,
      content: '🔧 Calling tool: scan_all_markets()',
      data: { tool: 'scan_all_markets', args: {} },
    },
    {
      type: 'tool_result',
      delay: 800,
      content: '📊 Scan complete: Found 3 markets with integrity scores below 80',
      data: {
        totalMarkets: 39,
        suspiciousMarkets: 3,
        markets: [
          { ticker: 'KARDASHIANS', score: 34, alerts: 3 },
          { ticker: 'CRYPTO_PUNKS', score: 48, alerts: 2 },
          { ticker: 'ELDEN_RING', score: 67, alerts: 1 },
        ],
      },
    },
    {
      type: 'thought',
      delay: 1500,
      content: '💭 KARDASHIANS has the lowest integrity score (34/100) with 3 active alerts. This warrants immediate deep investigation.',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: deep_analyze_market("KARDASHIANS")',
      data: { tool: 'deep_analyze_market', args: { ticker: 'KARDASHIANS' } },
    },
    {
      type: 'tool_result',
      delay: 900,
      content: '📊 Analysis complete: Multiple fraud signals detected',
      data: {
        ticker: 'KARDASHIANS',
        integrityScore: 34,
        riskLevel: 'critical',
        alerts: [
          { type: 'wash_trading', severity: 'critical', confidence: 75 },
          { type: 'price_manipulation', severity: 'high', confidence: 82 },
          { type: 'bot_coordination', severity: 'medium', confidence: 70 },
        ],
        signals: {
          price_index_divergence: 18,
          wash_trading_probability: 0.73,
          bot_coordination_detected: true,
        },
      },
    },
    {
      type: 'thought',
      delay: 1800,
      content: '💭 Wash trading probability is 73% - this is extremely high. Let me examine the actual trade data to confirm this pattern.',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: fetch_recent_trades("KARDASHIANS", limit: 200)',
      data: { tool: 'fetch_recent_trades', args: { ticker: 'KARDASHIANS', limit: 200 } },
    },
    {
      type: 'tool_result',
      delay: 700,
      content: '📊 Trade analysis: Highly suspicious uniformity detected',
      data: {
        ticker: 'KARDASHIANS',
        tradeCount: 174,
        uniqueSizes: 47,
        uniformityRatio: 0.73,
        dominantSize: 3.5,
        dominantSizeCount: 127,
        analysis: '127 out of 174 trades (73%) were exactly 3.5 contracts',
      },
    },
    {
      type: 'thought',
      delay: 2000,
      content: '💭 This confirms wash trading. 73% of trades being identical size is statistically impossible in organic trading. Price also increased 18% while attention index only rose 4% - suggesting artificial pump. Let me check if this is coordinated across related markets.',
    },
    {
      type: 'tool_call',
      delay: 1200,
      content: '🔧 Calling tool: compare_related_markets(["KHLOE", "KOURTNEY", "KIM"])',
      data: {
        tool: 'compare_related_markets',
        args: { tickers: ['KHLOE', 'KOURTNEY', 'KIM'] },
      },
    },
    {
      type: 'tool_result',
      delay: 800,
      content: '📊 Related markets analysis: All healthy - isolated manipulation',
      data: {
        markets: [
          { ticker: 'KHLOE', score: 92, riskLevel: 'safe' },
          { ticker: 'KOURTNEY', score: 89, riskLevel: 'safe' },
          { ticker: 'KIM', score: 91, riskLevel: 'safe' },
        ],
        allSuspicious: false,
      },
    },
    {
      type: 'thought',
      delay: 1500,
      content: '💭 Related Kardashian markets are all healthy (scores 89-92). This indicates targeted manipulation of KARDASHIANS only, not a broader cultural trend. Let me check the order book for additional evidence.',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: analyze_order_book("KARDASHIANS")',
      data: { tool: 'analyze_order_book', args: { ticker: 'KARDASHIANS' } },
    },
    {
      type: 'tool_result',
      delay: 700,
      content: '📊 Order book analysis: Bot coordination detected',
      data: {
        ticker: 'KARDASHIANS',
        suspiciousBidClusters: [{ price: 32.1, count: 7 }],
        suspiciousAskClusters: [],
        analysis: '7 bid orders clustered at exactly $32.10 - likely bot coordination',
      },
    },
    {
      type: 'conclusion',
      delay: 2000,
      content: `🎯 INVESTIGATION COMPLETE

**FRAUD DETECTED - HIGH CONFIDENCE (85%)**

Market: KARDASHIANS
Integrity Score: 34/100
Risk Level: CRITICAL

Evidence Summary:
1. **Wash Trading (Critical)**: 127 out of 174 trades (73%) were identical 3.5 contract size
   → Statistical impossibility in organic trading
   → Clear pattern of self-trading to create artificial volume

2. **Price Manipulation (High)**: Price increased 18% while attention index rose only 4%
   → Artificial pump without underlying cultural momentum
   → Price-index divergence indicates coordinated buying

3. **Bot Coordination (Medium)**: 7 orders clustered at exact same price ($32.10)
   → Unnatural order placement pattern
   → Suggests automated bot network

4. **Isolated Attack**: Related markets (KHLOE, KOURTNEY, KIM) all healthy
   → Not a genuine cultural trend
   → Targeted manipulation of single market

**ROOT CAUSE**: Coordinated pump-and-dump scheme using wash trading to inflate volume and bot networks to manipulate price.

**RECOMMENDATION**: ⛔ AVOID TRADING - High risk of sudden price collapse when manipulation stops.`,
    },
    {
      type: 'alert',
      delay: 500,
      content: '🚨 CRITICAL ALERT generated for KARDASHIANS market',
      data: {
        ticker: 'KARDASHIANS',
        alertType: 'coordinated_manipulation',
        severity: 'critical',
        confidence: 85,
        recommendation: 'AVOID_TRADING',
      },
    },
  ],
};

// ============================================
// INVESTIGATION 2: Spoofing Attack
// ============================================

export const spoofingInvestigation: SimulatedInvestigation = {
  id: 'spoofing',
  name: 'Order Book Spoofing Attack',
  description: 'Agent discovers fake liquidity manipulation',
  ticker: 'ELDEN_RING',
  fraudType: 'Order Book Spoofing + Price Pump',
  finalScore: 45,
  confidence: 87,
  emoji: '🎭',
  steps: [
    {
      type: 'thought',
      delay: 0,
      content: '🔍 Investigating ELDEN_RING market after receiving low integrity score alert...',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: deep_analyze_market("ELDEN_RING")',
      data: { tool: 'deep_analyze_market', args: { ticker: 'ELDEN_RING' } },
    },
    {
      type: 'tool_result',
      delay: 800,
      content: '📊 Fraud signals detected: Spoofing and price manipulation',
      data: {
        ticker: 'ELDEN_RING',
        integrityScore: 45,
        signals: {
          spoofing_events: 12,
          price_index_divergence: 23,
        },
        alerts: [
          { type: 'spoofing', severity: 'critical' },
          { type: 'price_manipulation', severity: 'high' },
        ],
      },
    },
    {
      type: 'thought',
      delay: 1500,
      content: '💭 12 spoofing events detected - this is significant. Spoofing involves placing large orders to create false liquidity, then canceling before execution. Let me analyze the order book history.',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: analyze_order_book("ELDEN_RING")',
      data: { tool: 'analyze_order_book', args: { ticker: 'ELDEN_RING' } },
    },
    {
      type: 'tool_result',
      delay: 700,
      content: '📊 Order book shows suspicious large orders',
      data: {
        suspiciousBidClusters: [
          { price: 47.23, count: 15, totalSize: 6800 },
        ],
        analysis: '15 large bid orders (avg 453 contracts) placed at $47.23',
      },
    },
    {
      type: 'thought',
      delay: 1800,
      content: '💭 15 large orders totaling 6,800 contracts at one price point is highly suspicious. These orders likely appeared then vanished quickly to manipulate perception. Let me check price movement.',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: check_price_history("ELDEN_RING", interval: "5m", hours: 6)',
      data: { tool: 'check_price_history', args: { ticker: 'ELDEN_RING', interval: '5m', hours: 6 } },
    },
    {
      type: 'tool_result',
      delay: 800,
      content: '📊 Price increased 23% in last 6 hours',
      data: {
        priceChange: '+23%',
        volatility: '8.4%',
        analysis: 'Rapid price increase coinciding with spoofing activity',
      },
    },
    {
      type: 'thought',
      delay: 1500,
      content: '💭 Price rose 23% but attention index only increased 4%. This divergence combined with spoofing suggests manipulators used fake liquidity to drive price up.',
    },
    {
      type: 'conclusion',
      delay: 2000,
      content: `🎯 INVESTIGATION COMPLETE

**SPOOFING ATTACK DETECTED - HIGH CONFIDENCE (87%)**

Market: ELDEN_RING
Integrity Score: 45/100
Risk Level: HIGH

Evidence:
1. **Order Book Spoofing (Critical)**: 12 spoofing events detected
   → 15 large orders (6,800 contracts) placed and canceled at $47.23
   → Classic spoofing pattern to create false liquidity

2. **Price Manipulation (High)**: Price +23%, Index +4%
   → Price movement not justified by attention growth
   → Coordinated with spoofing activity

3. **Timing Analysis**: Spoof orders coincide with price spikes
   → Orders create buying pressure, then vanish
   → Leaves real traders trapped at inflated prices

**ATTACK PATTERN**: Manipulator places large fake buy orders → Creates illusion of demand → Real traders buy → Spoof orders canceled → Price crashes

**RECOMMENDATION**: ⚠️ HIGH RISK - Likely price collapse when manipulation ends`,
    },
    {
      type: 'alert',
      delay: 500,
      content: '🚨 HIGH ALERT generated for ELDEN_RING market',
    },
  ],
};

// ============================================
// INVESTIGATION 3: Multi-Signal Fraud
// ============================================

export const multiSignalInvestigation: SimulatedInvestigation = {
  id: 'multi-signal',
  name: 'Sophisticated Multi-Signal Attack',
  description: 'Agent detects coordinated fraud across multiple vectors',
  ticker: 'CRYPTO_PUNKS',
  fraudType: 'Wash Trading + Spoofing + Bot Coordination',
  finalScore: 28,
  confidence: 92,
  emoji: '🎯',
  steps: [
    {
      type: 'thought',
      delay: 0,
      content: '🔍 CRYPTO_PUNKS flagged with critically low score. Multiple fraud signals present...',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: deep_analyze_market("CRYPTO_PUNKS")',
      data: { tool: 'deep_analyze_market', args: { ticker: 'CRYPTO_PUNKS' } },
    },
    {
      type: 'tool_result',
      delay: 800,
      content: '📊 CRITICAL: Multiple fraud vectors detected simultaneously',
      data: {
        ticker: 'CRYPTO_PUNKS',
        integrityScore: 28,
        riskLevel: 'critical',
        signals: {
          wash_trading_probability: 0.68,
          spoofing_events: 8,
          bot_coordination_detected: true,
          price_index_divergence: 31,
        },
        alerts: 4,
      },
    },
    {
      type: 'thought',
      delay: 1800,
      content: '💭 This is a sophisticated attack - 4 different fraud signals active. The combination of wash trading (68%), spoofing (8 events), bot coordination, and 31% price divergence suggests a well-coordinated manipulation operation. Let me gather evidence for each vector.',
    },
    {
      type: 'tool_call',
      delay: 1200,
      content: '🔧 Calling tool: fetch_recent_trades("CRYPTO_PUNKS", limit: 250)',
      data: { tool: 'fetch_recent_trades', args: { ticker: 'CRYPTO_PUNKS', limit: 250 } },
    },
    {
      type: 'tool_result',
      delay: 700,
      content: '📊 Trade analysis: Severe wash trading detected',
      data: {
        tradeCount: 203,
        uniqueSizes: 65,
        uniformityRatio: 0.68,
        dominantSize: 4.2,
        dominantSizeCount: 138,
      },
    },
    {
      type: 'thought',
      delay: 1600,
      content: '💭 138 out of 203 trades (68%) are exactly 4.2 contracts. Combined with bot coordination signals, this is likely automated wash trading software. Now checking order book.',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: analyze_order_book("CRYPTO_PUNKS")',
      data: { tool: 'analyze_order_book', args: { ticker: 'CRYPTO_PUNKS' } },
    },
    {
      type: 'tool_result',
      delay: 700,
      content: '📊 Order book: Bot clustering + spoofing evidence',
      data: {
        suspiciousBidClusters: [
          { price: 89.45, count: 11 },
          { price: 89.40, count: 9 },
        ],
        suspiciousAskClusters: [
          { price: 89.50, count: 8 },
        ],
        analysis: '28 orders clustered at 3 near-identical price points',
      },
    },
    {
      type: 'thought',
      delay: 1700,
      content: '💭 28 orders spread across just 3 price points ($89.40-$89.50) is textbook bot coordination. The bots are creating artificial walls. Combined with the 8 spoofing events, manipulators are controlling both sides of the order book.',
    },
    {
      type: 'tool_call',
      delay: 1100,
      content: '🔧 Calling tool: check_price_history("CRYPTO_PUNKS", interval: "1h", hours: 24)',
      data: { tool: 'check_price_history', args: { ticker: 'CRYPTO_PUNKS', interval: '1h', hours: 24 } },
    },
    {
      type: 'tool_result',
      delay: 800,
      content: '📊 Price increased 31% with abnormal volatility',
      data: {
        priceChange: '+31%',
        volatility: '12.7%',
        indexChange: '+6%',
        divergence: '25%',
      },
    },
    {
      type: 'conclusion',
      delay: 2200,
      content: `🎯 INVESTIGATION COMPLETE

**SOPHISTICATED MULTI-VECTOR ATTACK - VERY HIGH CONFIDENCE (92%)**

Market: CRYPTO_PUNKS
Integrity Score: 28/100
Risk Level: ⛔ CRITICAL

Evidence - Multi-Layered Manipulation:

1. **Automated Wash Trading (68%)**
   → 138/203 trades identical size (4.2 contracts)
   → Likely automated wash trading bots
   → Purpose: Inflate volume to appear liquid

2. **Order Book Spoofing (8 events)**
   → Large orders placed then canceled
   → Creates false liquidity perception
   → Manipulates trader decision-making

3. **Bot Network Coordination**
   → 28 orders clustered at 3 price points ($89.40-$89.50)
   → Creating artificial price walls
   → Controlling market spread

4. **Price Manipulation (+31%)**
   → Price rose 31% vs index +6% (25% divergence)
   → Coordinated pump not justified by fundamentals
   → High risk of imminent collapse

**ATTACK SOPHISTICATION**: This is a professional manipulation operation using multiple techniques simultaneously. The coordination between wash trading bots, order book spoofing, and price pumping indicates organized fraud.

**RECOMMENDATION**: ⛔ DO NOT TRADE - Extremely high risk. This market is under active manipulation by sophisticated actors. Expect sudden price collapse.`,
    },
    {
      type: 'alert',
      delay: 500,
      content: '🚨 CRITICAL ALERT: Multi-vector fraud attack detected on CRYPTO_PUNKS',
    },
  ],
};

// ============================================
// INVESTIGATION 4: Healthy Market (Control)
// ============================================

export const healthyMarketInvestigation: SimulatedInvestigation = {
  id: 'healthy',
  name: 'Healthy Market Verification',
  description: 'Agent confirms organic market activity with no fraud signals',
  ticker: 'TAYLOR_SWIFT',
  fraudType: 'None - Healthy Market',
  finalScore: 96,
  confidence: 95,
  emoji: '✅',
  steps: [
    {
      type: 'thought',
      delay: 0,
      content: '🔍 Verifying TAYLOR_SWIFT market integrity as part of routine scan...',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: deep_analyze_market("TAYLOR_SWIFT")',
      data: { tool: 'deep_analyze_market', args: { ticker: 'TAYLOR_SWIFT' } },
    },
    {
      type: 'tool_result',
      delay: 800,
      content: '📊 Analysis: Excellent integrity score, no alerts',
      data: {
        ticker: 'TAYLOR_SWIFT',
        integrityScore: 96,
        riskLevel: 'safe',
        alerts: [],
        signals: {
          price_index_divergence: 2,
          spoofing_events: 0,
          wash_trading_probability: 0.08,
          bot_coordination_detected: false,
        },
      },
    },
    {
      type: 'thought',
      delay: 1500,
      content: '💭 Score of 96/100 is excellent with zero active alerts. All fraud signals are within normal ranges. Let me verify the trade distribution is organic.',
    },
    {
      type: 'tool_call',
      delay: 1000,
      content: '🔧 Calling tool: fetch_recent_trades("TAYLOR_SWIFT", limit: 150)',
      data: { tool: 'fetch_recent_trades', args: { ticker: 'TAYLOR_SWIFT', limit: 150 } },
    },
    {
      type: 'tool_result',
      delay: 700,
      content: '📊 Trade distribution: Healthy organic pattern',
      data: {
        tradeCount: 147,
        uniqueSizes: 112,
        uniformityRatio: 0.24,
        analysis: 'Normal trade size distribution - no repetitive patterns',
      },
    },
    {
      type: 'thought',
      delay: 1400,
      content: '💭 112 unique trade sizes out of 147 trades (76% variety) is exactly what we expect in organic trading. Uniformity ratio of 0.24 is well below the 0.6 wash trading threshold. Price alignment looks good too.',
    },
    {
      type: 'conclusion',
      delay: 1800,
      content: `🎯 VERIFICATION COMPLETE

**HEALTHY MARKET CONFIRMED - HIGH CONFIDENCE (95%)**

Market: TAYLOR_SWIFT
Integrity Score: 96/100
Risk Level: ✅ SAFE

Analysis:
1. **Organic Trading (✓)**: 76% trade size variety
   → Natural distribution, no wash trading
   → Uniformity ratio 0.24 (safe threshold: <0.6)

2. **Price-Index Alignment (✓)**: 2% divergence
   → Price movement matches attention growth
   → No artificial manipulation detected

3. **Order Book Health (✓)**: No spoofing
   → Zero fake liquidity events
   → Organic order placement patterns

4. **Bot Activity (✓)**: None detected
   → No coordinated bot networks
   → Natural market participant behavior

**MARKET STATUS**: This market shows all signs of healthy, organic trading activity. Price movements are justified by cultural attention metrics. No fraud signals detected.

**RECOMMENDATION**: ✅ SAFE TO TRADE - Normal market conditions`,
    },
  ],
};

// ============================================
// EXPORT ALL INVESTIGATIONS
// ============================================

export const ALL_INVESTIGATIONS: SimulatedInvestigation[] = [
  washTradingInvestigation,
  spoofingInvestigation,
  multiSignalInvestigation,
  healthyMarketInvestigation,
];

export const INVESTIGATIONS_BY_ID: Record<string, SimulatedInvestigation> = {
  'wash-trading': washTradingInvestigation,
  'spoofing': spoofingInvestigation,
  'multi-signal': multiSignalInvestigation,
  'healthy': healthyMarketInvestigation,
};
