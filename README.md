# ENS MCP Server

MCP Server for Ethereum Name Service (ENS), enabling Claude to interact with the ENS system to resolve names, check availability, retrieve records, and more.

npm package: https://www.npmjs.com/package/mcp-server-ens
## Tools

### resolve-name
Resolve an ENS name to an Ethereum address
- **Required inputs:**
    - `name` (string): The ENS name to resolve (e.g., 'vitalik.eth')
- **Returns:** The corresponding Ethereum address or an error message

### reverse-lookup
Get the ENS name for an Ethereum address
- **Required inputs:**
    - `address` (string): The Ethereum address to look up
- **Returns:** The corresponding ENS name or an indication that no name was found

### get-text-record
Get a text record for an ENS name
- **Required inputs:**
    - `name` (string): The ENS name to query
    - `key` (string): The record key to look up (e.g., 'email', 'url', 'avatar', 'description', 'twitter', etc.)
- **Returns:** The value of the specified text record or indication that no record was found

### check-availability
Check if an ENS name is available for registration
- **Required inputs:**
    - `name` (string): The ENS name to check
- **Returns:** Availability status and owner information if registered

### get-all-records
Get all available information for an ENS name
- **Required inputs:**
    - `name` (string): The ENS name to query
- **Returns:** Comprehensive information including resolver address, text records, addresses, content hash, ownership, and expiration details

### get-subdomains
Get subdomains for an ENS name
- **Required inputs:**
    - `name` (string): The ENS name to query for subdomains
- **Returns:** List of subdomains with their owner information

### get-name-history
Get the history of an ENS name
- **Required inputs:**
    - `name` (string): The ENS name to check history for
- **Returns:** Historical events related to the name, including transfers, resolver changes, and registration events

### get-registration-price
Get the price to register an ENS name
- **Required inputs:**
    - `name` (string): The ENS name to check price for
- **Optional inputs:**
    - `duration` (number, default: 1): Registration duration in years
- **Returns:** Registration price breakdown including base price, premium, and total

## Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Access to Ethereum RPC providers (public or private)

### Installation

1. Clone the repository or create a new project:
```bash
git clone https://github.com/JustaName-id/ens-mcp-server
```

2. Install dependencies:
```bash
npm i
```

3. Configure Ethereum providers:
   Create a `.env` file in the project root with the following (optional):
```
PROVIDER_URL=https://your-provider-url.com,https://your-backup-provider.com
```

If no providers are specified, the server will use these defaults:
- https://eth.drpc.org
- https://eth.llamarpc.com
- https://ethereum.publicnode.com
- https://rpc.ankr.com/eth

## Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

### Using npx
```json
{
  "mcpServers": {
    "ens": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-server-ens"
      ],
      "env": {
        "PROVIDER_URL": "https://your-provider-url.com,https://your-backup-provider.com"
      }
    }
  }
}
```

### Using local script
```json
{
  "mcpServers": {
    "ens": {
      "command": "node",
      "args": [
        "/path/to/your/server.js"
      ],
      "env": {
        "PROVIDER_URL": "https://your-provider-url.com,https://your-backup-provider.com"
      }
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add ens -- npx -y mcp-server-ens
```

With custom providers:
```bash
claude mcp add ens -e PROVIDER_URL="https://your-provider-url.com" -- npx -y mcp-server-ens
```

Verify it's connected:
```bash
claude mcp list
```

## Error Handling

The server implements robust error handling for various scenarios:
- Network errors connecting to Ethereum providers
- Invalid ENS names or Ethereum addresses
- ENS-specific errors
- General operational errors

All errors are normalized into user-friendly messages while preserving technical details for debugging.

## Publishing

To publish as an npm package:
```bash
npm publish --access public
```

## Troubleshooting

If you encounter errors:
- Verify your Ethereum providers are working and accessible
- Check that the ENS names you're querying are formatted correctly
- Ensure you have the latest version of the ENS libraries
- Try using multiple providers by comma-separating them in the PROVIDER_URL environment variable

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.