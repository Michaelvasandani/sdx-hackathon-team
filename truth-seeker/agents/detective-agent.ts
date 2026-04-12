/**
 * Detective Agent - Autonomous Fraud Investigation
 *
 * This agent runs continuously, monitoring markets and investigating
 * suspicious activity using LLM-powered reasoning and tool orchestration.
 */

import { openai } from '../lib/openai/client';
import { fetchAllMarketsData, MarketAnalysisData } from './fraud-detection/data-fetcher';
import { analyzeSingleMarket } from './fraud-detection/fraud-detection-agent';
import { forumAPI } from '../lib/forum-api/client';

// ============================================
// TYPES
// ============================================

export interface InvestigationUpdate {
  type: 'thought' | 'tool_call' | 'finding' | 'alert';
  timestamp: Date;
  content: string;
  data?: any;
}

export interface Investigation {
  id: string;
  ticker: string;
  status: 'active' | 'completed';
  startedAt: Date;
  updates: InvestigationUpdate[];
  conclusion?: string;
  alertLevel?: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// INVESTIGATION TOOLS
// ============================================

/**
 * Tools that the LLM can call during investigation
 */
const INVESTIGATION_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'scan_all_markets',
      description: 'Scan all Forum markets for anomalies using fraud detection algorithms. Returns markets with suspicious activity.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'deep_analyze_market',
      description: 'Run comprehensive fraud analysis on a specific market ticker. Returns detailed integrity score and fraud signals.',
      parameters: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Market ticker symbol (e.g., DRAKE, FORTNITE)',
          },
        },
        required: ['ticker'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'fetch_recent_trades',
      description: 'Get recent trade history for a market to analyze trading patterns and volume',
      parameters: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Market ticker symbol',
          },
          limit: {
            type: 'number',
            description: 'Number of trades to fetch (default 100)',
          },
        },
        required: ['ticker'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_order_book',
      description: 'Examine current order book to detect spoofing, clustering, or fake liquidity',
      parameters: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Market ticker symbol',
          },
        },
        required: ['ticker'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_price_history',
      description: 'Analyze historical price movements and volatility patterns',
      parameters: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Market ticker symbol',
          },
          interval: {
            type: 'string',
            enum: ['1m', '5m', '1h', '1d'],
            description: 'Candlestick interval',
          },
          hours: {
            type: 'number',
            description: 'How many hours back to analyze',
          },
        },
        required: ['ticker', 'interval'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compare_related_markets',
      description: 'Check if multiple related markets show similar anomalies (coordinated manipulation)',
      parameters: {
        type: 'object',
        properties: {
          tickers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of ticker symbols to compare',
          },
        },
        required: ['tickers'],
      },
    },
  },
];

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

async function executeTool(toolName: string, args: any): Promise<any> {
  try {
    switch (toolName) {
      case 'scan_all_markets': {
        const marketsData = await fetchAllMarketsData();
        const results = await Promise.all(
          marketsData.map(async (market) => {
            const analysis = await analyzeSingleMarket(market);
            return {
              ticker: analysis.ticker,
              score: analysis.integrityScore.score,
              riskLevel: analysis.integrityScore.riskLevel,
              alertCount: analysis.alerts.length,
              topAlert: analysis.alerts[0],
            };
          })
        );

        // Return only markets with issues
        const suspicious = results.filter(r => r.score < 80);
        return {
          totalMarkets: results.length,
          suspiciousMarkets: suspicious.length,
          markets: suspicious.sort((a, b) => a.score - b.score),
        };
      }

      case 'deep_analyze_market': {
        const marketsData = await fetchAllMarketsData();
        const marketData = marketsData.find(m => m.ticker === args.ticker);
        if (!marketData) {
          return { error: `Market ${args.ticker} not found` };
        }
        const analysis = await analyzeSingleMarket(marketData);
        return {
          ticker: analysis.ticker,
          name: analysis.name,
          integrityScore: analysis.integrityScore,
          alerts: analysis.alerts,
          currentPrice: marketData.market.lastPrice,
          currentIndex: marketData.market.lastIndexValue,
          volume24h: marketData.market.volumePastDay,
        };
      }

      case 'fetch_recent_trades': {
        const limit = args.limit || 100;
        const trades = await forumAPI.getRecentTrades(args.ticker, limit);

        // Analyze trade patterns
        const sizes = trades.map(t => t.size);
        const sizeSet = new Set(sizes);
        const uniqueSizes = sizeSet.size;
        const totalTrades = trades.length;

        return {
          ticker: args.ticker,
          tradeCount: totalTrades,
          uniqueSizes,
          uniformityRatio: (totalTrades - uniqueSizes) / totalTrades,
          recentTrades: trades.slice(0, 10), // First 10 for context
        };
      }

      case 'analyze_order_book': {
        const orderBook = await forumAPI.getOrderBook(args.ticker);

        // Count price clustering
        const bidPrices = orderBook.bids.map(b => b.price);
        const askPrices = orderBook.asks.map(b => b.price);

        const bidClusters: Record<number, number> = {};
        const askClusters: Record<number, number> = {};

        bidPrices.forEach(p => { bidClusters[p] = (bidClusters[p] || 0) + 1; });
        askPrices.forEach(p => { askClusters[p] = (askClusters[p] || 0) + 1; });

        const suspiciousBidClusters = Object.entries(bidClusters)
          .filter(([, count]) => count >= 5)
          .map(([price, count]) => ({ price: parseFloat(price), count }));

        const suspiciousAskClusters = Object.entries(askClusters)
          .filter(([, count]) => count >= 5)
          .map(([price, count]) => ({ price: parseFloat(price), count }));

        return {
          ticker: args.ticker,
          bidLevels: orderBook.bids.length,
          askLevels: orderBook.asks.length,
          suspiciousBidClusters,
          suspiciousAskClusters,
          topBids: orderBook.bids.slice(0, 5),
          topAsks: orderBook.asks.slice(0, 5),
        };
      }

      case 'check_price_history': {
        const { ticker, interval, hours } = args;
        const now = new Date();
        const start = new Date(now.getTime() - (hours || 24) * 60 * 60 * 1000);

        const candles = await forumAPI.getCandlesticks(
          ticker,
          interval,
          start.toISOString(),
          now.toISOString()
        );

        if (candles.length === 0) {
          return { error: 'No price history available' };
        }

        const firstPrice = candles[0].close;
        const lastPrice = candles[candles.length - 1].close;
        const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

        const volatility = candles.reduce((sum, c) => {
          return sum + Math.abs((c.high - c.low) / c.open);
        }, 0) / candles.length;

        return {
          ticker,
          candleCount: candles.length,
          priceChange: priceChange.toFixed(2) + '%',
          volatility: (volatility * 100).toFixed(2) + '%',
          firstPrice,
          lastPrice,
          recentCandles: candles.slice(-5),
        };
      }

      case 'compare_related_markets': {
        const { tickers } = args;
        const marketsData = await fetchAllMarketsData();

        const analyses = await Promise.all(
          tickers.map(async (ticker: string) => {
            const marketData = marketsData.find(m => m.ticker === ticker);
            if (!marketData) return null;
            const analysis = await analyzeSingleMarket(marketData);
            return {
              ticker,
              score: analysis.integrityScore.score,
              riskLevel: analysis.integrityScore.riskLevel,
              alerts: analysis.alerts.length,
            };
          })
        );

        return {
          markets: analyses.filter(a => a !== null),
          allSuspicious: analyses.every(a => a && a.score < 80),
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// DETECTIVE AGENT
// ============================================

const DETECTIVE_SYSTEM_PROMPT = `You are a forensic market integrity detective analyzing Forum's attention markets.

Your job is to:
1. Continuously monitor markets for suspicious activity
2. Investigate anomalies by choosing appropriate tools
3. Synthesize evidence to determine if fraud is occurring
4. Provide clear, confident conclusions with supporting evidence

When investigating:
- Start by scanning all markets to identify anomalies
- For suspicious markets, use deep analysis and multiple tools to gather evidence
- Look for patterns: wash trading, spoofing, bot coordination, price manipulation
- Cross-reference multiple data sources (trades, order book, price history)
- Be skeptical but thorough - not all anomalies are fraud

Your conclusions should:
- State confidence level (low/medium/high/critical)
- Cite specific evidence from tools
- Explain why the pattern is suspicious
- Provide actionable recommendations

Think step-by-step and explain your reasoning as you investigate.`;

export class DetectiveAgent {
  private activeInvestigations: Map<string, Investigation> = new Map();
  private investigationCallbacks: ((update: InvestigationUpdate) => void)[] = [];

  /**
   * Subscribe to investigation updates
   */
  onUpdate(callback: (update: InvestigationUpdate) => void) {
    this.investigationCallbacks.push(callback);
  }

  private emitUpdate(update: InvestigationUpdate) {
    this.investigationCallbacks.forEach(cb => cb(update));
  }

  /**
   * Run a single investigation cycle
   */
  async runInvestigationCycle(): Promise<Investigation[]> {
    const investigationId = `inv_${Date.now()}`;

    this.emitUpdate({
      type: 'thought',
      timestamp: new Date(),
      content: '🔍 Starting new investigation cycle. Scanning all markets for anomalies...',
    });

    try {
      // Initial LLM prompt
      const messages: any[] = [
        {
          role: 'system',
          content: DETECTIVE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: 'Begin your investigation. Scan all markets and investigate any suspicious activity you find.',
        },
      ];

      let iterationCount = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (iterationCount < maxIterations) {
        iterationCount++;

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages,
          tools: INVESTIGATION_TOOLS,
          tool_choice: 'auto',
          temperature: 0.7,
        });

        const message = response.choices[0].message;
        messages.push(message);

        // If LLM is thinking/responding
        if (message.content) {
          this.emitUpdate({
            type: 'thought',
            timestamp: new Date(),
            content: message.content,
          });
        }

        // If LLM wants to call tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            this.emitUpdate({
              type: 'tool_call',
              timestamp: new Date(),
              content: `🔧 Calling tool: ${toolName}`,
              data: toolArgs,
            });

            // Execute tool
            const toolResult = await executeTool(toolName, toolArgs);

            this.emitUpdate({
              type: 'tool_call',
              timestamp: new Date(),
              content: `✓ Tool result received`,
              data: toolResult,
            });

            // Add tool result to conversation
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }
        } else {
          // No more tools to call - investigation complete
          break;
        }
      }

      // Get final conclusion
      messages.push({
        role: 'user',
        content: 'Based on your investigation, provide a final summary of your findings and any fraud alerts.',
      });

      const conclusionResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
      });

      const conclusion = conclusionResponse.choices[0].message.content || 'Investigation complete';

      this.emitUpdate({
        type: 'finding',
        timestamp: new Date(),
        content: conclusion,
      });

      return Array.from(this.activeInvestigations.values());
    } catch (error) {
      this.emitUpdate({
        type: 'alert',
        timestamp: new Date(),
        content: `❌ Investigation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return [];
    }
  }

  /**
   * Start continuous monitoring (runs investigation every 30 seconds)
   */
  async startMonitoring(intervalSeconds: number = 30) {
    console.log('🕵️ Detective Agent monitoring started');

    // Run first investigation immediately
    await this.runInvestigationCycle();

    // Then run every N seconds
    setInterval(async () => {
      await this.runInvestigationCycle();
    }, intervalSeconds * 1000);
  }
}

// Singleton instance
export const detectiveAgent = new DetectiveAgent();
