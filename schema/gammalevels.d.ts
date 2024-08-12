export default interface GammaLevels {
    date: string;
    ticker: string;
    levels: {
        spotPrice: number;
        callResistance: number;
        gammaFlip: number;
        putSupport: number;
    }
}