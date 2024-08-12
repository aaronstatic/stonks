import { DefaultApi } from 'finnhub-ts'
const finnhub = new DefaultApi({
    apiKey: process.env.FINNHUB_API_KEY,
    isJsonMime: (input) => {
        try {
            JSON.parse(input)
            return true
        } catch (error) { }
        return false
    },
});

export default finnhub;