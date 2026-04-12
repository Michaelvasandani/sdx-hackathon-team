# Forum Market API Reference

> **Base URL:** `https://api.forum.market/v1`
>
> **Auth headers** (required on private endpoints):
> ```
> FORUM-ACCESS-KEY: <your-api-key>
> FORUM-ACCESS-SIGN: <hmac-signature>
> FORUM-ACCESS-TIMESTAMP: <unix-timestamp>
> ```

---

## REST API

---

### Exchange

---

#### `GET` Get server time

Returns the current server time. Use this to measure clock skew for HMAC signature generation.
```bash
curl --request GET \
  --url https://api.forum.market/v1/time
```

**Example Output (200):**
```json
{
  "epoch": 1740441600,
  "iso": "2026-02-25T00:00:00.000Z"
}
```

---

#### `GET` Get exchange status

Returns the current exchange operational status and maintenance windows.
```bash
curl --request GET \
  --url https://api.forum.market/v1/exchange/status
```

**Example Output (200):**
```json
{
  "inMaintenance": false,
  "currentWindow": {
    "declaredAt": "2026-02-24T12:00:00.000Z",
    "startTime": "2026-02-25T00:00:00.000Z",
    "endTime": "2026-02-25T02:00:00.000Z",
    "reason": "Scheduled maintenance"
  },
  "nextWindow": {
    "declaredAt": "2026-02-24T12:00:00.000Z",
    "startTime": "2026-02-25T00:00:00.000Z",
    "endTime": "2026-02-25T02:00:00.000Z",
    "reason": "Scheduled maintenance"
  }
}
```

---

### Markets

---

#### `GET` List all markets

Returns all available markets with their current ticker data. Pagination will be added as the number of markets grows.
```bash
curl --request GET \
  --url https://api.forum.market/v1/markets
```

**Example Output (200):**
```json
[
  {
    "ticker": "OPENAI",
    "name": "OpenAI",
    "index": "OPENAI-IDX",
    "category": "tech",
    "subCategory": "Artificial intelligence",
    "live": true,
    "lastPrice": 10550,
    "bestBid": 10500,
    "bestAsk": 10600,
    "openInterest": 1234,
    "volumePastDay": 500000,
    "highPastDay": 11000,
    "lowPastDay": 10000,
    "changePercentPastDay": 2.5,
    "changePastDay": 250,
    "lastFunding": "2026-02-25T08:00:00.000Z",
    "movingFundingRate": 0.0001,
    "lastSettledFundingRate": 0.0001,
    "cumFunding": 0.0023
  }
]
```

---

#### `GET` Get market

Returns details for a specific market, including current prices and statistics.
```bash
curl --request GET \
  --url https://api.forum.market/v1/markets/{ticker}
```

**Example Output (200):** *(same shape as a single item from List all markets)*

---

### Market Data

---

#### `GET` Get order book

Returns the current order book snapshot for a market. Use sequence numbers with WebSocket `book_updates` channel for real-time updates.
```bash
curl --request GET \
  --url https://api.forum.market/v1/markets/{ticker}/book
```

---

#### `GET` Get recent trades

Returns recent public trades for a market. A trade occurs at the price of the maker (resting) order.
```bash
curl --request GET \
  --url 'https://api.forum.market/v1/markets/{ticker}/trades?limit=100'
```

---

#### `GET` Get candlestick data

Returns OHLCV candlestick data for a market within a time range.
```bash
curl --request GET \
  --url 'https://api.forum.market/v1/markets/{ticker}/candles?limit=2500'
```

---

### Indices

---

#### `GET` Get index details

Returns the current attention index value with source breakdown. Forum's indices aggregate attention metrics from social, search, and streaming data to derive the underlying value for contracts.
```bash
curl --request GET \
  --url https://api.forum.market/v1/indices/{name}
```

---

#### `GET` Get index history

Returns historical index values within a time range.
```bash
curl --request GET \
  --url https://api.forum.market/v1/indices/{name}/history
```

---

### Funding

---

#### `GET` Get current funding rate

Returns the last and estimated next funding rate as well as last price, index value, and next funding time for a market.
```bash
curl --request GET \
  --url https://api.forum.market/v1/markets/{ticker}/funding-rate
```

---

#### `GET` Get funding rate history

Returns historical funding rates within a time range.
```bash
curl --request GET \
  --url https://api.forum.market/v1/markets/{ticker}/funding-history
```

---

### Orders

---

#### `GET` List open orders

Returns open orders with optional filtering. Requires read permission.
```bash
curl --request GET \
  --url 'https://api.forum.market/v1/orders?limit=100' \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

#### `POST` Place an order

Place a new order in a market. Requires trade permission.
```bash
curl --request POST \
  --url https://api.forum.market/v1/orders \
  --header 'Content-Type: application/json' \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>' \
  --data '{
    "ticker": "OPENAI",
    "side": "buy",
    "qty": 10,
    "orderType": "limit"
  }'
```

---

#### `DELETE` Cancel all open orders

Cancel all open orders, optionally filtered by market ticker. Requires trade permission.
```bash
curl --request DELETE \
  --url https://api.forum.market/v1/orders \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

#### `GET` Get order by ID

Returns an order by its exchange-assigned ID. Requires read permission.
```bash
curl --request GET \
  --url https://api.forum.market/v1/orders/{orderId} \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

#### `DELETE` Cancel order by ID

Cancel an open order by its exchange-assigned ID. Requires trade permission.
```bash
curl --request DELETE \
  --url https://api.forum.market/v1/orders/{orderId} \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

#### `GET` Get order by client order ID

Returns an order by its client-provided ID. Requires read permission.
```bash
curl --request GET \
  --url https://api.forum.market/v1/orders/client/{clientOrderId} \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

#### `DELETE` Cancel order by client order ID

Cancel an open order by its client-provided ID. Requires trade permission.
```bash
curl --request DELETE \
  --url https://api.forum.market/v1/orders/client/{clientOrderId} \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

#### `POST` Place multiple orders

Place up to 10 orders in a single request. Each order is processed independently. Requires trade permission.
```bash
curl --request POST \
  --url https://api.forum.market/v1/orders/batch \
  --header 'Content-Type: application/json' \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>' \
  --data '{
    "orders": [
      {
        "ticker": "OPENAI",
        "side": "buy",
        "qty": 10,
        "orderType": "limit",
        "price": 10050,
        "timeInForce": "goodTillCancel",
        "clientOrderId": "my-order-001",
        "postOnly": false,
        "reduceOnly": false,
        "selfTradePreventionMode": "cr"
      }
    ]
  }'
```

---

#### `DELETE` Cancel multiple orders

Cancel up to 20 orders in a single request. Each cancellation is processed independently. Requires trade permission.
```bash
curl --request DELETE \
  --url https://api.forum.market/v1/orders/batch \
  --header 'Content-Type: application/json' \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>' \
  --data '{
    "orderIds": [123, 456, 789]
  }'
```

---

### Fills

---

#### `GET` List fills

Returns trade executions (fills) for the authenticated user. Requires read permission.
```bash
curl --request GET \
  --url 'https://api.forum.market/v1/fills?limit=100' \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

### Positions

---

#### `GET` List all positions

Returns all open positions for the authenticated user. Requires read permission.
```bash
curl --request GET \
  --url https://api.forum.market/v1/positions \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

#### `GET` Get position by ticker

Returns the position for a specific market. Requires read permission.
```bash
curl --request GET \
  --url https://api.forum.market/v1/positions/{ticker} \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

### Account

---

#### `GET` Get account summary

Returns account summary including balances, margin, PnL, and account health status. Requires read permission.
```bash
curl --request GET \
  --url https://api.forum.market/v1/account \
  --header 'FORUM-ACCESS-KEY: <api-key>' \
  --header 'FORUM-ACCESS-SIGN: <api-key>' \
  --header 'FORUM-ACCESS-TIMESTAMP: <api-key>'
```

---

## WebSocket Channels

> **WebSocket URL:** `wss://api.forum.market/ws/v1`

---

### Control Commands

---

#### `WSS` Subscribe

Subscribe to one or more channels for the specified tickers. Subscriptions are additive — they do not replace existing subscriptions.

---

#### `WSS` Unsubscribe

Unsubscribe from one or more channels for the specified tickers.

---

#### `WSS` List subscriptions

List all current subscriptions on this connection.

---

#### `WSS` Auth

Authenticate the connection for private channel access using HMAC-SHA256. The signature signs: `timestamp + "GET" + "/ws/v1"`.

---

#### `WSS` Logout

Log out the authenticated user and remove all private channel subscriptions.

---

#### `WSS` Errors

General error responses sent when a command fails validation or cannot be processed.

---

### Public Channels

---

#### `WSS` Book updates

Real-time order book updates. On subscribe, the server sends a full book snapshot, then incremental updates.

---

#### `WSS` Ticker updates

Level 1 market data updates including last price, best bid/ask, volume, funding rates, and index data.

---

#### `WSS` Trades

Real-time public trade feed. Each message represents a single executed trade.

---

#### `WSS` Index updates

Live attention index value updates, including changes to underlying metrics.

---

#### `WSS` Funding events

Funding events. Emitted daily when funding occurs.

---

#### `WSS` Candle updates 1m

Live 1-minute candlestick updates. The `active` field indicates whether the candle is still open.

---

#### `WSS` Candle updates 5m

Live 5-minute candlestick updates. The `active` field indicates whether the candle is still open.

---

#### `WSS` Candle updates 1d

Live 1-day candlestick updates. The `active` field indicates whether the candle is still open.

---

#### `WSS` Heartbeat

Application-level heartbeat. Emitted every 1 second per subscribed ticker. Useful for low-volume markets to confirm the connection and server are alive.

---

### Private Channels (Auth Required)

---

#### `WSS` User orders

Real-time order lifecycle updates for the authenticated user. Streams all order state transitions (resting, partially filled, filled, cancelled).

---

#### `WSS` User fills

Real-time trade execution notifications for the authenticated user.

---

#### `WSS` User positions

Real-time position updates for the authenticated user. Includes `prevQty` to track position size changes.

---

#### `WSS` User account

Real-time account margin and PnL updates for the authenticated user.