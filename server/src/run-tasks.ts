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
import db from "./lib/mongo";
import { ObjectId } from "mongodb";
import updateGainers from "./task/update-gainers";
import updateStrategies from "./task/update-strategies";
import { DateTime } from "luxon";

let tasks: { [name: string]: BaseTask } = {
    updateCalendar,
    updateGainers,
    updateGEX,
    updateGamma,
    updateExchangeRates,
    updateHoldings,
    updateStocks,
    updateCrypto,
    updateBybit,
    updateHistory,
    updateIndices,
    updateOptions,
    updateStrategies
};

let tasksToRun = [];

if (process.argv.length > 2) {
    tasksToRun = process.argv.slice(2);
} else {
    tasksToRun = Object.keys(tasks);
}

const run = async () => {
    console.log("Running tasks");
    const now = DateTime.now().toUTC();
    //set minute to closest 15min
    const minute = now.minute;
    let newMinute = minute;
    if (minute < 15) {
        newMinute = 0;
    } else if (minute < 30) {
        newMinute = 15;
    } else if (minute < 45) {
        newMinute = 30;
    } else {
        newMinute = 45;
    }
    now.set({ minute: newMinute });
    for (let taskName of tasksToRun) {
        const task = tasks[taskName];
        console.log(`Running task ${task.name}`);
        const result = await task(now);
        if (!result) {
            console.log(`Task ${task.name} failed`);
        }
    }
    process.exit(0);
}

run();