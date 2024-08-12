import dotenv from "dotenv";
dotenv.config();

import updateStocks from "./task/update-stocks";
import updateBybit from "./task/update-bybit";
import updateCrypto from "./task/update-crypto";
import { BaseTask } from "./type/task";
import updateExchangeRates from "./task/update-exchangerates";
import updateHoldings from "./task/update-holdings";
import updateCalendar from "./task/update-calendar";
import updateOptions from "./task/update-options";
import updateHistory from "./task/update-history";
import updateIndices from "./task/update-indices";
import updateGEX from "./task/update-gex";
import updateGamma from "./task/update-gamma";

let tasks: { [name: string]: BaseTask } = {
    updateCalendar,
    updateExchangeRates,
    updateHoldings,
    updateStocks,
    updateCrypto,
    updateBybit,
    updateHistory,
    updateIndices,
    updateOptions,
    updateGEX,
    updateGamma
};

let tasksToRun = [];

if (process.argv.length > 2) {
    tasksToRun = process.argv.slice(2);
} else {
    tasksToRun = Object.keys(tasks);
}

const run = async () => {
    console.log("Running tasks");
    for (let taskName of tasksToRun) {
        const task = tasks[taskName];
        console.log(`Running task ${task.name}`);
        const result = await task();
        if (!result) {
            console.log(`Task ${task.name} failed`);
        }
    }
    process.exit(0);
}

run();