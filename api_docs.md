# Vanta Network API Endpoints

This document describes all REST API endpoints for the **Entity Miner** and **Validator** services. Use this as a reference when integrating with the Vanta Network.

---

## Authentication

### API Key (Bearer Token)

Most endpoints require an API key. Pass it via the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

Or as a raw key:

```
Authorization: YOUR_API_KEY
```

**Entity miner host:** The gateway loads allowed keys from **`vanta_api/api_keys.json`** on the machine running `EntityMinerRestServer` (see `vanta-network/vanta_api/api_key_refresh.py`). The string you send in `Authorization` must match a `key` field in that file **exactly**. Storing the key in Hyperscaled’s database does not register it on the miner; operators must add the same value to `api_keys.json` (or rely on the refresh thread picking up edits, typically within ~15s).

### API Key Tiers

The validator uses tiered access:

| Tier | Access |
|------|--------|
| 0 | Minimal data |
| 30 | Tier 30 data |
| 50 | Tier 50 data |
| 100 | Full miner data (positions, limit orders, ledgers, checkpoint, statistics) |
| 200 | Entity management, development orders, subaccount dashboards |

An API key can access data at its tier or below. For example, tier 100 can access tiers 0, 30, 50, and 100.

### Coldkey Signatures (Entity Endpoints)

Some validator endpoints (entity registration, subaccount creation, etc.) require **coldkey signatures** instead of API keys. You sign a JSON message with your Bittensor coldkey and include the signature in the request body.

**Signature format:** Hex string (no `0x` prefix required for submission, but hex-encoded bytes).

**Message format:** JSON with sorted keys, UTF-8 encoded. Example:
```json
{"entity_coldkey": "5FxY...", "entity_hotkey": "5GhDr..."}
```

---

## Entity Miner API

The Entity Miner REST server runs on **port 8089** by default. It serves entity miners (e.g., Hyperliquid gateway) and inherits order submission endpoints from `MinerRestServer`.

**Base URL:** `http://<host>:8089`

### 1. Submit Order

**`POST /api/submit-order`**

Submit a trading signal (order) for processing. Requires API key.

**Request (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order_uuid` | string | No | UUID for the order. Auto-generated if omitted. |
| `trade_pair` | string | Yes | Trade pair ID (e.g., `"BTC/USD"`, `"BTCUSD"`) or `{"trade_pair_id": "BTCUSD"}` |
| `order_type` | string | Yes | `"LONG"`, `"SHORT"`, or `"FLAT"` |
| `leverage` | float | Cond.* | Position size as multiplier of account. Exactly one of `leverage`, `value`, or `quantity` required. |
| `value` | float | Cond.* | Position size in USD notional. |
| `quantity` | float | Cond.* | Position size in base currency units. |
| `execution_type` | string | No | `"MARKET"` (default) or `"LIMIT"` |
| `limit_price` | float | Cond. | Required for LIMIT orders. |
| `stop_loss` | float | No | Stop-loss price. |
| `take_profit` | float | No | Take-profit price. |
| `trailing_stop` | object | No | `{"trailing_percent": 0.05}` or `{"trailing_value": 100}` |
| `bracket_orders` | array | No | Array of `{stop_loss, take_profit, trailing_percent?, trailing_value?}` |
| `subaccount_id` | string | No | Subaccount ID for entity miners. |

**Response (200 OK):**
```json
{
  "success": true,
  "order_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "order_json": "...",
  "error_message": "",
  "processing_time": 1.23,
  "message": "Order successfully processed by Taoshi validator"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid request: missing required field 'trade_pair'"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized access"
}
```

---

### 2. Order Status

**`GET /api/order-status/<order_uuid>`**

Query the status of a previously submitted order. Requires API key.

**Response (200 OK - completed):**
```json
{
  "order_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "completed",
  "details": { ... }
}
```

**Response (200 OK - failed):**
```json
{
  "order_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "failed",
  "details": { ... }
}
```

**Response (404 Not Found):**
```json
{
  "order_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "not_found",
  "message": "Order not found in processed or failed signals"
}
```

---

### 3. Dashboard (per HL Address)

**`GET /api/hl/<hl_address>/dashboard`**

Return cached dashboard data for a Hyperliquid address. **No API key required.** Data is populated via WebSocket from the validator.

`<hl_address>`: Hyperliquid/EVM address (e.g., `0x1234567890abcdef1234567890abcdef12345678`).

**Response (200 OK):**
```json
{
  "timestamp_ms": 1234567890123,
  "synthetic_hotkey": "entity_hotkey_0",
  "hl_address": "0x1234...",
  ...dashboard fields...
}
```

**Response (404 Not Found):**
```json
{
  "status": "no_data",
  "hl_address": "0x1234..."
}
```

---

### 4. Order Events (per HL Address)

**`GET /api/hl/<hl_address>/events?since=<ms>`**

Return order events (accepted/rejected) for an HL address. **No API key required.**

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `since` | int | Optional. Only return events with `timestamp_ms` greater than this value. |

**Response (200 OK):**
```json
{
  "hl_address": "0x1234...",
  "events": [
    {
      "timestamp_ms": 1234567890123,
      "hl_address": "0x1234...",
      "trade_pair": "BTC/USD",
      "order_type": "LONG",
      "status": "accepted",
      "error_message": "",
      "fill_hash": "0x...",
      "synthetic_hotkey": "entity_hotkey_0"
    }
  ],
  "count": 1
}
```

---

### 5. SSE Real-Time Stream (per HL Address)

**`GET /api/hl/<hl_address>/stream`**

Server-Sent Events stream for real-time dashboard and order event updates. **No API key required.** Clients receive `data:` lines with JSON payloads.

**Event types:**
- `{"type": "dashboard", "data": {...}}` — Dashboard update
- `{"type": "event", "data": {...}}` — Order event (accepted/rejected)

Heartbeat: `: heartbeat` lines sent every 30 seconds when idle.

---

### 6. Create Subaccount (Standard)

**`POST /api/create-subaccount`**

Create a standard subaccount (crypto or forex). Requires API key. Proxies to the validator.

**Request (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset_class` | string | Yes | `"crypto"` or `"forex"` |
| `account_size` | float | Yes | Account size in USD. Must be > 0. |
| `admin` | bool | No | Default `false`. Admin subaccounts get different treatment. |

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "...",
  "subaccount": {
    "subaccount_id": 0,
    "subaccount_uuid": "uuid-string",
    "synthetic_hotkey": "5xxx_0",
    "account_size": 10000.0,
    "asset_class": "crypto"
  }
}
```

**Response (400/404/500):**
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

### 7. Create HL-Linked Subaccount

**`POST /api/create-hl-subaccount`**

Create a subaccount linked to a Hyperliquid address. Requires API key. Proxies to the validator.

**Request (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hl_address` | string | Yes | Hyperliquid address (`0x` + 40 hex chars) |
| `account_size` | float | Yes | Account size in USD. Must be > 0. |
| `payout_address` | string | No | EVM address for USDC payouts (`0x` + 40 hex) |
| `admin` | bool | No | Default `false`. |

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "...",
  "subaccount": {
    "subaccount_id": 0,
    "subaccount_uuid": "uuid-string",
    "synthetic_hotkey": "entity_hotkey_0",
    "account_size": 10000.0,
    "asset_class": "crypto",
    ...
  }
}
```

---

### 8. Health Check

**`GET /api/health`**

Health check for the entity miner gateway.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "EntityMinerRestServer",
  "ws_connected": true,
  "hl_addresses_tracked": 5,
  "dashboard_cache_size": 5,
  "sse_subscribers": 2,
  "timestamp": 1234567890.123
}
```

---

## Validator REST API

The Validator REST server runs on **port 48888** by default.

**Base URL:** `http://127.0.0.1:48888` (configurable via `ValiConfig`)

---

### Miner Position Endpoints

#### GET /miner-positions

All miner positions. Requires API key. Tier-based access.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `tier` | string | `"0"`, `"30"`, `"50"`, or `"100"`. Default `"100"`. |

**Response:** Gzip-compressed JSON. `Content-Encoding: gzip`.

**Response (401/403/404):** `{"error": "..."}`

---

#### GET /miner-positions/<minerid>

Positions for a single miner.

**Response (200 OK):** Dashboard-formatted position data for the miner.

**Response (404):** `{"error": "Miner ID ... not found", "positions": []}`

---

#### GET /miner-hotkeys

List of miner hotkeys with at least one position.

**Response (200 OK):** `["5GhDr...", "5xyz..."]`

**Response (404):** `{"error": "No miner hotkeys found"}`

---

### Ledger Endpoints

#### GET /emissions-ledger/<minerid>

Emissions ledger for a miner.

**Response (200 OK):** Ledger data (structure depends on debt ledger format).

---

#### GET /debt-ledger/<minerid>

Debt ledger for a specific miner.

---

#### GET /perf-ledger/<minerid>

Performance ledger for a miner.

---

#### GET /debt-ledger

All debt ledger summaries. Returns gzip-compressed JSON.

---

#### GET /penalty-ledger/<minerid>

Penalty ledger for a miner.

---

### Statistics Endpoints

#### GET /validator-checkpoint

Full validator checkpoint. **Requires tier 100.** Returns gzip-compressed JSON.

---

#### GET /statistics

Validator checkpoint statistics.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `checkpoints` | string | `"true"` (default) or `"false"` to omit checkpoints. |

**Response:** Gzip-compressed when available, or JSON.

---

#### GET /statistics/<minerid>/

Statistics for a single miner.

**Query parameters:** `checkpoints` — same as `/statistics`.

---

#### GET /eliminations

Elimination data.

---

### Trading Endpoints

#### GET /limit-orders/<minerid>

Limit orders for a miner.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Comma-separated: `unfilled`, `filled`, `cancelled`. |

**Response (200 OK):** `{ "unfilled": [...], "filled": [...], "cancelled": [...] }` (or subset based on filter)

---

#### GET /orders/<minerid>

All orders for a miner grouped by status. **Requires tier 100.**

**Query parameters:** `status` — same as `/limit-orders/<minerid>`.

**Response (200 OK):**
```json
{
  "unfilled": [...],
  "filled": [...],
  "cancelled": [...]
}
```

---

#### GET /trade-pairs

Allowed trade pairs and max leverage. **No authentication required.**

**Response (200 OK):**
```json
{
  "allowed_trade_pairs": [
    {
      "trade_pair_id": "BTCUSD",
      "trade_pair": "BTC/USD",
      "trade_pair_category": "crypto",
      "max_leverage": 0.5
    }
  ],
  "allowed_trade_pair_ids": ["BTCUSD", ...],
  "total_trade_pairs": 38,
  "timestamp": 1234567890123
}
```

---

#### POST /asset-selection

Process asset selection request. Requires coldkey signature.

**Request (JSON):**
```json
{
  "asset_selection": ["BTCUSD", "ETHUSD"],
  "miner_coldkey": "5FxY...",
  "miner_hotkey": "5GhDr...",
  "signature": "hex-string",
  "version": "2.0.0"
}
```

---

#### GET /miner-selections

All miner asset selections. Requires API key.

**Response (200 OK):**
```json
{
  "miner_selections": { ... },
  "total_miners": 10,
  "timestamp": 1234567890123
}
```

---

#### POST /development/order

Process development orders (testing). **Requires tier 200.**

Uses fixed hotkey `DEVELOPMENT`. Supports MARKET, LIMIT, BRACKET, LIMIT_CANCEL.

**Request (JSON):**
```json
{
  "execution_type": "MARKET",
  "trade_pair_id": "BTCUSD",
  "order_type": "LONG",
  "leverage": 1.0,
  "limit_price": 50000.0,
  "order_uuid": "optional-uuid"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "execution_type": "MARKET",
  "order_uuid": "uuid",
  "order": { ... }
}
```

---

### Account Management

#### POST /miner-account/rebuild/<hotkey>

Rebuild miner account state from position history. **Requires tier 200.**

**Request (JSON):**
```json
{
  "open_ms_after": 1700000000000,
  "preview": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `open_ms_after` | int | Optional. Only include positions opened after this timestamp (ms). |
| `preview` | bool | Default `true`. If `true`, returns computed state without persisting. |

**Response (200 OK):**
```json
{
  "status": "success",
  "preview": true,
  "position_count": 5,
  "original_account": { ... },
  "rebuilt_account": { ... }
}
```

---

### Collateral Endpoints

#### POST /collateral/deposit

Process collateral deposit with encoded extrinsic.

**Request (JSON):**
```json
{
  "extrinsic": "hex-string",
  "version": "2.0.0"
}
```

**Note:** `version` (or `ptncli_version`) must meet `vanta-cli` minimum. Outdated versions are rejected.

---

#### POST /collateral/query-withdraw

Query potential slashed amount for a withdrawal.

**Request (JSON):**
```json
{
  "amount": 1000.0,
  "miner_hotkey": "5GhDr...",
  "version": "2.0.0"
}
```

---

#### POST /collateral/withdraw

Process collateral withdrawal. Requires signed message from coldkey.

**Request (JSON):**
```json
{
  "amount": 1000.0,
  "miner_coldkey": "5FxY...",
  "miner_hotkey": "5GhDr...",
  "nonce": "uuid",
  "timestamp": 1234567890,
  "signature": "hex-string",
  "version": "2.0.0"
}
```

Message to sign (JSON, sorted keys): `{"amount", "miner_coldkey", "miner_hotkey", "nonce", "timestamp"}`.

---

#### GET /collateral/

All collateral data. Requires API key.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `hotkey` | string | Filter to a specific miner. |
| `most_recent` | string | `"true"` to return only most recent record per miner. |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "hotkey1": [{"account_size": 1000.0, "account_size_theta": 10.0, "update_time_ms": 1234567890000, "valid_date_timestamp": 1234567890000}]
  },
  "miner_count": 5,
  "total_records": 25,
  "timestamp": 1234567890123
}
```

---

#### GET /collateral/balance/<miner_address>

Collateral balance for a miner. Requires API key.

**Response (200 OK):**
```json
{
  "miner_address": "5GhDr...",
  "balance_theta": 100.5
}
```

---

### Entity Management Endpoints

#### POST /entity/register

Register a new entity.

**Request (JSON):**
```json
{
  "entity_hotkey": "5GhDr...",
  "entity_coldkey": "5FxY...",
  "signature": "hex-string",
  "version": "2.0.0"
}
```

Message to sign: `{"entity_coldkey", "entity_hotkey"}` (sorted keys).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "...",
  "entity_hotkey": "5GhDr..."
}
```

---

#### POST /entity/create-subaccount

Create a standard subaccount.

**Request (JSON):**
```json
{
  "entity_hotkey": "5GhDr...",
  "entity_coldkey": "5FxY...",
  "account_size": 25000,
  "asset_class": "crypto",
  "admin": false,
  "signature": "hex-string",
  "version": "2.0.0"
}
```

Message to sign: `{"account_size", "admin", "asset_class", "entity_coldkey", "entity_hotkey"}`.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "...",
  "subaccount": {
    "subaccount_id": 0,
    "subaccount_uuid": "uuid",
    "synthetic_hotkey": "entity_hotkey_0",
    "account_size": 25000,
    "asset_class": "crypto",
    "status": "..."
  }
}
```

---

#### POST /entity/create-hl-subaccount

Create an HL-linked subaccount.

**Request (JSON):**
```json
{
  "entity_hotkey": "5GhDr...",
  "entity_coldkey": "5FxY...",
  "account_size": 25000,
  "hl_address": "0x1234567890abcdef1234567890abcdef12345678",
  "payout_address": "0xAbCd1234567890abcdef1234567890abcdef12",
  "admin": false,
  "signature": "hex-string",
  "version": "2.0.0"
}
```

Message to sign: `{"account_size", "admin", "entity_coldkey", "entity_hotkey", "hl_address"}` (+ `payout_address` if provided).

**Response (200 OK):** Same structure as `create-subaccount` with `subaccount` object.

---

#### GET /entity/<entity_hotkey>

Get entity data. **Requires tier 200.**

**Response (200 OK):**
```json
{
  "status": "success",
  "entity": { ... }
}
```

---

#### GET /entities

Get all registered entities. **Requires tier 200.**

**Response (200 OK):**
```json
{
  "status": "success",
  "entities": [ ... ],
  "entity_count": 10,
  "timestamp": 1234567890123
}
```

---

#### POST /entity/subaccount/eliminate

Eliminate a subaccount. **Requires tier 200.**

**Request (JSON):**
```json
{
  "entity_hotkey": "5GhDr...",
  "subaccount_id": 0,
  "reason": "manual_elimination"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "..."
}
```

---

#### GET /entity/subaccount/<synthetic_hotkey>

Subaccount dashboard. **Requires tier 200.** Supports `If-None-Match` (ETag) for caching.

**Response (200 OK):**
```json
{
  "status": "success",
  "dashboard": {
    "subaccount_info": { ... },
    "challenge_period": { ... },
    "ledger": { ... },
    "positions": [ ... ],
    "statistics": { ... },
    "elimination": { ... }
  },
  "timestamp": 1234567890123
}
```

---

#### GET /v2/entity/subaccount/<synthetic_hotkey>

V2 subaccount dashboard with configurable sections. **Requires tier 200.**

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `positions_time_ms` | int | Timestamp filter for positions. |
| `limit_orders_time_ms` | int | Timestamp filter for limit orders. |
| `checkpoints_time_ms` | int | Timestamp filter for checkpoints. |
| `daily_returns_time_ms` | int | Timestamp filter for daily returns. |

---

#### POST /entity/subaccount/payout

Calculate subaccount payout. **Requires tier 200.**

**Request (JSON):**
```json
{
  "subaccount_uuid": "uuid-string",
  "start_time_ms": 1234567890000,
  "end_time_ms": 1234567890999
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "hotkey": "entity_hotkey_0",
    "total_checkpoints": 10,
    "checkpoints": [ ... ],
    "payout": 1234.56
  },
  "timestamp": 1234567890123
}
```

---

#### POST /entity/set-endpoint

Set entity miner endpoint URL. Uses coldkey signature (no API key).

**Request (JSON):**
```json
{
  "entity_hotkey": "5GhDr...",
  "entity_coldkey": "5FxY...",
  "endpoint_url": "https://my-gateway.example.com",
  "signature": "hex-string"
}
```

Message to sign: `{"endpoint_url", "entity_coldkey", "entity_hotkey"}`.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "...",
  "entity_hotkey": "5GhDr...",
  "endpoint_url": "https://my-gateway.example.com"
}
```

---

#### GET /entity/endpoint

Look up entity endpoint URL. **No authentication required.**

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `hl_address` | string | Hyperliquid address. |
| `subaccount` | string | Synthetic hotkey (e.g., `entity_hotkey_0`). |

Exactly one of `hl_address` or `subaccount` required.

**Response (200 OK):**
```json
{
  "endpoint_url": "https://...",
  "hl_address": "0x...",
  "subaccount": null
}
```

**Response (404):** `{"error": "No endpoint URL found for the given address", "hl_address": "...", "subaccount": "..."}`

---

### Public HL Trader Endpoints (No Auth)

#### GET /hl-traders/<hl_address>

Look up Hyperliquid trader by HL address. **No authentication required.**

**Response (200 OK):**
```json
{
  "status": "success",
  "synthetic_hotkey": "entity_hotkey_0",
  "hl_address": "0x1234...",
  "account_size": 10000,
  "payout_address": "0xAbCd...",
  "positions": [ ... ],
  "drawdown": {
    "instant": 0.05,
    "daily": 0.02,
    "ledger_max_drawdown": 0.08
  },
  "challenge_progress": {
    "in_challenge_period": true,
    "bucket": "SUBACCOUNT_CHALLENGE",
    "start_time_ms": 1230000000000,
    "elapsed_time_ms": 864000000,
    "time_progress_percent": 11.11,
    "current_return": 1.06,
    "returns_percent": 6.0,
    "target_return_percent": 10.0,
    "returns_progress_percent": 60.0,
    "challenge_completion_percent": 60.0,
    "drawdown_percent": 1.85,
    "drawdown_limit_percent": 5.0,
    "drawdown_usage_percent": 37.0
  },
  "timestamp": 1234567890123
}
```

---

#### GET /hl-traders/<hl_address>/limits

Trading limits for an HL subaccount. **No authentication required.**

**Response (200 OK):**
```json
{
  "status": "success",
  "hl_address": "0x1234...",
  "account_size": 10000,
  "max_position_per_pair_usd": 5000,
  "max_portfolio_usd": 50000,
  "in_challenge_period": false,
  "timestamp": 1234567890123
}
```

---

## Address Formats

| Type | Format | Example |
|------|--------|---------|
| HL/EVM address | `0x` + 40 hex characters | `0x1234567890abcdef1234567890abcdef12345678` |
| SS58 (Bittensor) | Base58-encoded | `5GhDr...`, `5FxY...` |

---

## Error Responses

Most errors return JSON with an `error` key:

```json
{
  "error": "Error message"
}
```

HTTP status codes:
- **400** — Bad request (invalid params, missing fields)
- **401** — Unauthorized (invalid/missing API key or signature)
- **403** — Forbidden (insufficient tier)
- **404** — Not found
- **500** — Internal server error
- **503** — Service unavailable (e.g., entity management or collateral not available)

---

## vanta-cli Version Requirement

Endpoints that accept `version` or `ptncli_version` (collateral, asset selection, entity registration, etc.) enforce a minimum `vanta-cli` version. Outdated versions receive:

```json
{
  "error": "Your vanta-cli version X.Y.Z is outdated and no longer supported. Please upgrade to vanta-cli >= 2.0.0: pip install --upgrade git+https://github.com/taoshidev/vanta-cli.git"
}
```

---

## Default Ports

| Service | Default Port |
|---------|--------------|
| Entity Miner REST | 8089 |
| Validator REST | 48888 |
| Validator WebSocket | 8765 |
