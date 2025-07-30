# BuschGPT MCP Server

This is a Model Context Protocol (MCP) server that provides access to the BuschGPT service. BuschGPT is a specialized GPT service with access to technical manuals and specification sheets for Busch products.

## Features

- **Authentication Management**: Handles OAuth2 client credentials flow with automatic token refresh
- **Query Interface**: Provides a simple `buschgpt_query` tool for interacting with the service
- **Error Handling**: Comprehensive error handling for network requests and authentication
- **MCP Compliance**: Fully compliant with the Model Context Protocol specification

## Installation

### Docker Deployment (Recommended)

1. Clone this repository
2. Set up environment variables:
   ```bash
   make dev-setup
   # or manually: cp .env.docker.example .env
   ```
3. Edit `.env` with your actual credentials
4. Start the service:
   ```bash
   make up
   # or: docker-compose up -d
   ```

### Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see Configuration section)
4. Build the project:
   ```bash
   npm run build
   ```

## Configuration

Create a `.env` file in the project root with the following environment variables:

```env
STATWORX_AUTH_SERVER=your_auth_server_url
STATWORX_CLIENT_ID=your_client_id
STATWORX_CLIENT_SECRET=your_client_secret
```

These variables are required for authentication with the BuschGPT service.

## Usage

### Running with Docker (Recommended)

1. Set up environment variables:
   ```bash
   cp .env.docker.example .env
   # Edit .env with your actual credentials
   ```

2. Start the service:
   ```bash
   docker-compose up -d
   ```

3. View logs:
   ```bash
   docker-compose logs -f buschgpt-mcp-server
   ```

4. Stop the service:
   ```bash
   docker-compose down
   ```

### Using Makefile Commands

For easier Docker management, use the provided Makefile:

```bash
make dev-setup    # Set up development environment
make build        # Build Docker image
make up           # Start the service
make logs         # View logs
make down         # Stop the service
make restart      # Restart the service
make health       # Check service health
make clean        # Clean up Docker resources
```

### Running Locally (Development)

Start the MCP server locally:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Using with MCP Clients

The server provides one tool:

- **`buschgpt_query`**: Query the BuschGPT service for technical information
  - **Input**: `query` (string) - The question or query to send to BuschGPT
  - **Output**: Text response from BuschGPT

Example query:
```
"Can you list similar product codes to F4HF7CS1610110? And how much do these products weigh?"
```

### Customizing Tool Description

To modify the tool description visible to MCP clients, edit the description in the `ListToolsRequestSchema` handler in `src/index.ts`. Look for the comment:

```typescript
// 🔧 TOOL DESCRIPTION - CUSTOMIZE THIS SECTION 🔧
```

## Architecture

The server consists of several key components:

1. **Authentication Manager**: Handles OAuth2 token lifecycle
2. **Request Handler**: Processes MCP tool calls and forwards to BuschGPT
3. **Error Handling**: Provides meaningful error messages for various failure scenarios

## Development

### Project Structure

```
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript output
├── logs/                 # Docker container logs
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── Dockerfile           # Docker image configuration
├── docker-compose.yaml  # Docker Compose configuration
├── Makefile            # Docker management commands
├── .dockerignore       # Docker build ignore patterns
├── .env.example        # Local environment template
├── .env.docker.example # Docker environment template
└── README.md           # This file
```

### Available Scripts

**Docker Commands (via Makefile):**
- `make up` - Start the service with Docker
- `make down` - Stop the service
- `make logs` - View real-time logs
- `make restart` - Restart the service
- `make build` - Build Docker image
- `make clean` - Clean up Docker resources
- `make health` - Check service health
- `make dev-setup` - Set up development environment

**Local Development:**
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Run with development auto-reload
- `npm run clean` - Remove build directory

## Error Handling

The server handles various error conditions:

- **Authentication Failures**: Invalid credentials or expired tokens
- **Network Errors**: Connection issues with BuschGPT service
- **Invalid Requests**: Missing or malformed query parameters
- **Service Errors**: BuschGPT service unavailability

## License

MIT License