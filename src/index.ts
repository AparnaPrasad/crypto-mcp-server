import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';

const server = new McpServer({
  name: 'mcp-bitcoin-server',
  version: '1.0.0',
});

// Helper function to handle API errors
function handleApiError(error: any, operation: string): never {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      throw new Error(`${operation} failed: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error(`${operation} failed: No response from server. Please check your internet connection.`);
    } else {
      // Something else happened
      throw new Error(`${operation} failed: ${error.message}`);
    }
  } else {
    // Non-Axios error
    throw new Error(`${operation} failed: ${error.message || 'Unknown error occurred'}`);
  }
}

// Register the crypto://all resource
server.resource(
  "cryptocurrencies",
  "crypto://all",
  {
    title: "All Cryptocurrencies",
    description: "Get top 100 cryptocurrencies by market cap from CoinGecko API"
  },
  async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        },
        timeout: 10000, // 10 second timeout
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from CoinGecko API');
      }

      return {
        contents: [
          {
            uri: "crypto://all",
            text: JSON.stringify(response.data, null, 2),
            mimeType: "application/json"
          }
        ]
      };
    } catch (error) {
      handleApiError(error, 'Fetching cryptocurrencies');
    }
  }
);

// Tool: Get Bitcoin details
server.tool(
  "get_bitcoin_details",
  "Get current Bitcoin market data and statistics from CoinGecko API",
  {},
  async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false,
          ids: 'bitcoin'
        },
        timeout: 10000,
      });
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('Bitcoin data not found');
      }

      const bitcoin = response.data[0];
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(bitcoin, null, 2)
          }
        ]
      };
    } catch (error) {
      handleApiError(error, 'Fetching Bitcoin details');
    }
  }
);

// Tool: Get cryptocurrency by name
server.tool(
  "get_crypto_by_name",
  "Search for cryptocurrency data by name or symbol",
  {
    name: z.string()
      .describe("Name or symbol of the cryptocurrency to search for")
  },
  async ({ name }) => {
    try {
      if (!name || name.trim().length === 0) {
        throw new Error('Cryptocurrency name cannot be empty');
      }

      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        },
        timeout: 10000,
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from CoinGecko API');
      }

      const allCoins = response.data;
      const filteredCoins = allCoins.filter((coin: any) => 
        coin.name.toLowerCase().includes(name.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(name.toLowerCase())
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              searchTerm: name,
              count: filteredCoins.length,
              results: filteredCoins
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      handleApiError(error, `Searching for cryptocurrency "${name}"`);
    }
  }
);

// Tool: Get all cryptocurrencies
server.tool(
  "get_all_cryptos",
  "Get top 100 cryptocurrencies by market cap from CoinGecko API",
  {},
  async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        },
        timeout: 10000,
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from CoinGecko API');
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: response.data.length,
              cryptocurrencies: response.data
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      handleApiError(error, 'Fetching all cryptocurrencies');
    }
  }
);

// Prompt: Crypto market summary
server.prompt(
    "crypto_market_summary",
    "Summarize top cryptocurrencies or biggest movers",
    {
      type: z.enum(["top5", "gainers", "losers"]).describe("Choose summary type: top5, gainers, losers")
    },
    async (args: { type: "top5" | "gainers" | "losers" }, _) => {
      try {
        const { type } = args;
        
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1
          },
          timeout: 10000,
        });
    
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format from CoinGecko API');
        }

        let data;
        if (type === "top5") {
          data = response.data.slice(0, 5);
        } else if (type === "gainers") {
          data = [...response.data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5);
        } else {
          data = [...response.data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 5);
        }
    
        return {
          messages: [
            {
              role: "assistant" as const,
              content: {
                type: "text" as const,
                text: JSON.stringify({ type, data }, null, 2)
              }
            }
          ]
        };
      } catch (error) {
        handleApiError(error, `Generating ${args.type} market summary`);
      }
    }
  );

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Bitcoin server started successfully');
  } catch (error) {
    console.error('Failed to start MCP Bitcoin server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
}); 