export type GammaReport = {
    ticker: string
    date: string
    levels: {
        callResistance: number
        gammaFlip: number
        putSupport: number,
        spotPrice: number
    },
    data:
    {
        strike: number
        dexProfile: number
        gexProfile: number
        callGEX: number
        putGEX: number
    }[]

}