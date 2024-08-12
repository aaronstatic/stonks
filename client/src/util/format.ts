export function formatLargeNumber(num: number, decimals: number = 2): string {
    if (num > 1000000000000 || num < -1000000000000) {
        return (num / 1000000000000).toFixed(decimals) + "T";
    } else if (num > 1000000000 || num < -1000000000) {
        return (num / 1000000000).toFixed(decimals) + "B";
    } else if (num > 1000000 || num < -1000000) {
        return (num / 1000000).toFixed(decimals) + "M";
    } else if (num > 1000 || num < -1000) {
        return (num / 1000).toFixed(decimals) + "K";
    } else {
        return num.toFixed(decimals);
    }
}