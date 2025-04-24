# Xion Validator Logo Worker

A Cloudflare Worker that fetches and serves validator logos for the Xion network. This service provides a simple API for frontends to retrieve validator images based on their Keybase identities.

## Usage

Make a GET request to the worker with a `chain-id` parameter:

```
GET /?chain-id=xion-mainnet-1
```

### Supported Chain IDs

- `xion-mainnet-1`
- `xion-testnet-2`

### Response Format

```json
{
	"chainId": "xion-mainnet-1",
	"validators": {
		"xionvaloper1...": "https://keybase.io/.../picture.jpg",
		"xionvaloper2...": "https://keybase.io/.../picture.jpg"
	},
	"timestamp": "2024-03-21T12:00:00.000Z"
}
```

### Error Responses

The API returns appropriate HTTP status codes with JSON error messages:

```json
{
	"error": "Error message",
	"message": "Detailed error description"
}
```

## Features

- Fetches validator logos from Keybase based on validator identities
- Supports both mainnet and testnet
- Cached responses (1 hour)
- Consistent JSON response format
- Error handling with meaningful messages

## Development

```bash
# Install dependencies
pnpm install

# Start development server
wrangler dev

# Deploy to Cloudflare
wrangler deploy
```
