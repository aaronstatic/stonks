import { RestClientV5 } from "bybit-api";

const bybit = new RestClientV5({
    key: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET,
    testnet: false
});

export default bybit;