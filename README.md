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

POLYGON_API_KEY="A valid Polygon.io API key with Stocks Starter and Options Starter subscription"
BYBIT_API_KEY="A ByBit API key if you want to sync transactions from ByBit"
BYBIT_API_SECRET="A ByBit Secret if you want to sync transactions from ByBit"
BYBIT_ACCOUNT="A Stonks Account ID to sync transactions from ByBit"
BYBIT_OWNER="A Stonks Owner ID to sync transactions from ByBit"
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
DISCORD_GUILD_ID="Server/guild id to authenticate users against"

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

