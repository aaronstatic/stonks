export function calculateDCF(netCashFlow: number, discountRate: number, growthRate: number, period: number): number {
    let dcfValue = 0;

    for (let year = 1; year <= period; year++) {
        const cashFlow = netCashFlow * Math.pow(1 + growthRate, year);
        const discountedCashFlow = cashFlow / Math.pow(1 + discountRate, year);
        dcfValue += discountedCashFlow;
    }

    const terminalValue = (netCashFlow * Math.pow(1 + growthRate, period + 1)) / (discountRate - growthRate);
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, period);
    dcfValue += discountedTerminalValue;

    return dcfValue;
}

export function findImpliedRate(currentValue: number, netCashFlow: number, period: number, outstandingShares: number, isGrowthRate: boolean = true): number {
    let low = -0.5; // Adjusted lower bound
    let high = 1; // Broader upper bound
    const tolerance = 1e-6;
    const maxIterations = 1000;

    console.log(`findImpliedRate(${currentValue}, ${netCashFlow}, ${period}, ${outstandingShares}, ${isGrowthRate})`);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        const mid = (low + high) / 2;
        const intrinsicValue = calculateDCF(netCashFlow, 0.15, mid, period);
        const sharePrice = intrinsicValue / outstandingShares;
        const diff = sharePrice - currentValue;

        if (Math.abs(diff) < tolerance) {
            return mid;
        }

        if (diff > 0) {
            high = mid;
        } else {
            low = mid;
        }

        // Debug prints to trace the process
        if (iteration > 990)
            console.log(`Iteration ${iteration}: low = ${low}, high = ${high}, mid = ${mid}, share_price = ${sharePrice}, diff = ${diff}`);
    }

    return 0;
}