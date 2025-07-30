import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';


const server = new McpServer({
  name: 'mcp-bitcoin-server',
  version: '1.0.0',
});

// Register the crypto://all resource
server.resource(
  "cryptocurrencies",
  "crypto://all",
  {
    title: "All Cryptocurrencies",
    description: "Get top 100 cryptocurrencies by market cap from CoinGecko API"
  },
  async () => {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false
      },
    });
    return {
      contents: [
        {
          uri: "crypto://all",
          text: JSON.stringify(response.data, null, 2),
          mimeType: "application/json"
        }
      ]
    };
  }
);

// Tool: Get Bitcoin details
server.tool(
  "get_bitcoin_details",
  "Get current Bitcoin market data and statistics from CoinGecko API",
  {},
  async () => {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
        ids: 'bitcoin'
      },
    });
    const bitcoin = response.data[0];
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(bitcoin, null, 2)
        }
      ]
    };
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
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false
      },
    });
    
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
  }
);

// Tool: Get all cryptocurrencies
server.tool(
  "get_all_cryptos",
  "Get top 100 cryptocurrencies by market cap from CoinGecko API",
  {},
  async () => {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false
      },
    });
    
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
      const { type } = args;
      
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1
        }
      });
  
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
    }
  );

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main(); 