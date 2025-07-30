import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import jwt from "jsonwebtoken";

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface BuschGPTResponse {
  content: string;
}

class BuschGPTMCPServer {
  private server: Server;
  private token: string | null = null;
  private authServer: string;
  private clientId: string;
  private clientSecret: string;
  private chatUrl = "https://dev-buschgpt.az-x1n3.com/ext/api/chat/invoke";

  constructor() {
    // Load environment variables
    this.authServer = process.env.STATWORX_AUTH_SERVER || "";
    this.clientId = process.env.STATWORX_CLIENT_ID || "";
    this.clientSecret = process.env.STATWORX_CLIENT_SECRET || "";

    if (!this.authServer || !this.clientId || !this.clientSecret) {
      throw new Error(
        "Missing required environment variables: STATWORX_AUTH_SERVER, STATWORX_CLIENT_ID, STATWORX_CLIENT_SECRET"
      );
    }

    this.server = new Server(
      {
        name: "buschgpt-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "buschgpt_query",
            description: 
              // 🔧 TOOL DESCRIPTION - CUSTOMIZE THIS SECTION 🔧
              // This is where you can modify the tool description that will be visible to MCP clients
              "Query the BuschGPT service for technical information about Busch products. " +
              "BuschGPT has access to technical manuals and specification sheets, and can help with " +
              "product codes, weights, specifications, and technical documentation. " +
              "Ideal for finding similar products, technical details, and product information.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The question or query to send to BuschGPT",
                },
              },
              required: ["query"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "buschgpt_query") {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const query = request.params.arguments?.query;
      if (!query || typeof query !== "string") {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Query parameter is required and must be a string"
        );
      }

      try {
        const response = await this.invokeQuery(query);
        return {
          content: [
            {
              type: "text",
              text: response,
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to query BuschGPT: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async getBuschGPTAuthToken(): Promise<string> {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const data = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    try {
      const response = await axios.post<AuthTokenResponse>(
        this.authServer,
        data,
        { headers }
      );

      if (response.status === 200 && response.data.access_token) {
        return response.data.access_token;
      } else {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Authentication request failed: ${error.response?.data || error.message}`);
      }
      throw error;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const expTimestamp = decoded.exp;
      const expDate = new Date(expTimestamp * 1000);
      return expDate < new Date();
    } catch {
      return true;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.token || this.isTokenExpired(this.token)) {
      this.token = await this.getBuschGPTAuthToken();
    }
  }

  private async invokeQuery(query: string): Promise<string> {
    await this.ensureValidToken();

    const payload = {
      message: {
        role: "user",
        content: query,
        streaming: false,
        createdAt: Date.now() / 1000,
      },
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };

    try {
      const response = await axios.post<BuschGPTResponse>(
        this.chatUrl,
        payload,
        { headers }
      );

      if (response.status === 200 && response.data.content) {
        return response.data.content;
      } else {
        throw new Error(`BuschGPT request failed: ${response.statusText}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`BuschGPT request failed: ${error.response?.data || error.message}`);
      }
      throw error;
    }
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("BuschGPT MCP server running on stdio");
  }
}

// Start the server
const server = new BuschGPTMCPServer();
server.run().catch(console.error);