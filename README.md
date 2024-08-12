# stonks
Tracks stock/crypto/options portfolios

# Dev Setup

`cd client`
`npm install`
`cd ../server`
`npm install`

# .env

For server to run, you need a `server/.env` file or environment variables as follows

```
PORT=9333
MONGO_DB="stonks"
USER_COLLECTION="users"
DEFAULT_USER="Temporary user ID until account management is implemented"
POLYGON_API_KEY="A valid Polygon.io API key with Stocks Starter and Options Starter subscription"
BYBIT_API_KEY="A ByBit API key if you want to sync DEFAULT_USER transactions from ByBit"
BYBIT_API_SECRET="A ByBit Secret if you want to sync DEFAULT_USER transactions from ByBit"
BYBIT_ACCOUNT="A ByBit Account ID if you want to sync DEFAULT_USER transactions from ByBit"
BYBIT_OWNER="A ByBit Owner ID if you want to sync DEFAULT_USER transactions from ByBit"
MAIN_CURRENCY="AUD"
FINNHUB_API_KEY="A Finnhub API Key"

LOGO_PATH="<Root folder>/client/public/logos"
LOGO_DIST_PATH="<Root folder>/client/dist/logos"

GAMMA_PATH="<Root folder>/client/public/gamma"
GAMMA_DIST_PATH="<Root folder>/client/dist/gamma"

PUSHOVER_USER="A Pushover API key for phone notifications"
PUSHOVER_TOKEN="A Pushover Token for phone notifications"

DISCORD_API_KEY="A discord API key for the discord bot"
DISCORD_APP_ID="A discord APP ID for the discord bot"
DISCORD_PUBLIC_KEY="A discord Public key for the discord bot"
DISCORD_BOT_TOKEN="A discord bot token for the discord bot"

SSL_CERT="-----BEGIN CERTIFICATE-----
An SSL Cert for HTTPS websocket
-----END CERTIFICATE-----
"
SSL_KEY="-----BEGIN PRIVATE KEY-----
An SSL Private key for HTTPS websocket
-----END PRIVATE KEY-----"
```

# Dev testing
`cd server`
`npm run dev`

`cd client`
`npm run dev`

# Running update tasks
`cd server`
`npm run tasks`

