# MCP Bitcoin Server

A Model Context Protocol (MCP) server that provides Bitcoin and cryptocurrency data from the CoinGecko API.

## Features

- **All Cryptocurrencies Resource**: Get the top 100 cryptocurrencies by market cap via `crypto://all`
- **Bitcoin Details Tool**: Get comprehensive Bitcoin market data including price, market cap, volume, and historical data
- **Cryptocurrency Search Tool**: Search for any cryptocurrency by name or symbol
- **Crypto Market Summary Prompt**: Get quick summaries of top cryptocurrencies, biggest gainers, or losers
- **Real-time Data**: All data is fetched in real-time from CoinGecko API

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-bitcoin
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Development Mode
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```
This opens the MCP inspector in your localhost
```

## MCP Resources

The server provides one resource:

### All Cryptocurrencies
- **URI**: `crypto://all`
- **Description**: Top 100 cryptocurrencies by market cap
- **Data**: List of cryptocurrencies with key market metrics including:
  - Name and symbol
  - Current price
  - Market cap and rank
  - 24h price change percentage
  - Total volume
  - Image URL

## MCP Tools

The server provides the following tools:

### Get Bitcoin Details
- **Name**: `get_bitcoin_details`
- **Description**: Get current Bitcoin market data and statistics
- **Parameters**: None
- **Returns**: Detailed Bitcoin market data

### Get Cryptocurrency by Name
- **Name**: `get_crypto_by_name`
- **Description**: Search for cryptocurrency data by name or symbol
- **Parameters**: 
  - `name` (string): Name or symbol of the cryptocurrency
- **Returns**: Filtered results matching the search term

### Get All Cryptocurrencies
- **Name**: `get_all_cryptos`
- **Description**: Get top 100 cryptocurrencies by market cap
- **Parameters**: None
- **Returns**: All top cryptocurrencies with market data

## MCP Prompts

The server provides the following prompt:

### Crypto Market Summary
- **Name**: `crypto_market_summary`
- **Description**: Summarize top cryptocurrencies or biggest movers
- **Parameters**: 
  - `type` (enum): Choose summary type:
    - `"top5"` - Top 5 cryptocurrencies by market cap
    - `"gainers"` - Top 5 biggest gainers in 24h
    - `"losers"` - Top 5 biggest losers in 24h
- **Returns**: Summary data with selected cryptocurrency information

## API Data Structure

The server returns data in the following format:

```typescript
interface BitcoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}
```

## Data Source

All cryptocurrency data is sourced from the [CoinGecko API](https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&id=bitcoin), which provides real-time market data for thousands of cryptocurrencies.

## MCP Server Implementation

This server uses the official MCP SDK with the following structure:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'mcp-bitcoin-server',
  version: '1.0.0',
});

// Register resources, tools, and prompts
server.resource("cryptocurrencies", "crypto://all", {...});
server.tool("get_bitcoin_details", "...", {}, async () => {...});
server.prompt("crypto_market_summary", "...", {...}, async (args) => {...});

// Connect to transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Available Scripts
- `npm run build`: Build the TypeScript project
- `npm run start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run clean`: Clean the build directory

## Dependencies

- `@modelcontextprotocol/sdk`: Latest MCP SDK for server implementation
- `axios`: HTTP client for API requests
- `zod`: Schema validation for MCP resources, tools, and prompts
