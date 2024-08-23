import { SlashCommandBuilder, Attachment } from "discord.js";
import db from "../../lib/mongo";
import { getHolding, getHoldingByTicker } from "../../lib/holdings";
import holdingReport from "../../report/holding";
import { getLastBuyDate, getStockDetails, getStockPrice } from "../../lib/stocks";
import { getLastOptionBuyDate, getOptionByParams, getOptionPrice, parseOptionName } from "../../lib/options";
import { DateTime } from "luxon";

import { Canvas } from "canvas";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("position")
        .setDescription("Display one of your positions")
        .addStringOption(option =>
            option.setName("ticker")
                .setDescription("The ticker of the position you want to display")
                .setRequired(true)
        ),
    async execute(interaction: any) {
        const user = await db.collection("users").findOne({ id: interaction.user.id });
        if (!user) {
            await interaction.reply({ content: "You have not logged into Stonks yet. Please visit https://stonks.aaronstatic.com/ to login.", ephemeral: true });
            return;
        }

        const enteredTicker = interaction.options.getString("ticker");
        let ticker = enteredTicker;
        if (!ticker) {
            await interaction.reply({ content: "Please provide a ticker", ephemeral: true });
            return;
        }

        let price = 0;
        let underlyingPrice = 0;
        let lastBuy = "";
        const owner = user._id.toString();

        let holding = await getHoldingByTicker(owner, ticker);
        let holdingType = "Stock";

        if (!holding) {
            const optionParams = parseOptionName(ticker);
            if (optionParams) {
                const option = await getOptionByParams(owner, optionParams);
                if (option) {
                    holdingType = "Option";
                    holding = await getHolding(option.holding);
                    ticker = option._id.toString();
                    underlyingPrice = await getStockPrice(holding.ticker);
                    price = await getOptionPrice(option._id.toString());
                    lastBuy = await getLastOptionBuyDate(owner, ticker);
                }
            }
            if (!holding) {
                await interaction.reply({ content: "You do not have a position with that ticker", ephemeral: true });
                return;
            }
        } else {
            price = await getStockPrice(holding.ticker);
            lastBuy = await getLastBuyDate(owner, holding.ticker);
        }

        const report = await holdingReport(owner, {
            ticker,
            type: holdingType
        });

        if (!report) {
            await interaction.reply({ content: "There was an error fetching the report", ephemeral: true });
            return;
        }

        if (report.openQuantity === 0) {
            await interaction.reply({ content: "You have no open positions for this ticker", ephemeral: true });
            return;
        }

        let averageOpenPrice = report.averageOpenPrice;
        if (holdingType == "Option") {
            averageOpenPrice = report.averageOpenPrice / 100;
        }
        const cost = report.openQuantity * averageOpenPrice;
        const value = report.openQuantity * price;
        let unrealized = value - cost;
        if (holdingType == "Option") {
            unrealized = unrealized * 100;
        }

        let name = enteredTicker;
        let displayName = enteredTicker;
        if (holdingType != "Option") {
            if (holding.name) {
                name = holding.name;
            } else if (holding.type == "Stock") {
                const details = await getStockDetails(ticker);
                if (details) {
                    name = details.name;
                }
            }
            displayName = `${name} [${holding.ticker}]`;
            if (name === "") {
                displayName = holding.ticker;
            }
        }

        let plpercent = (unrealized / cost) * 100;
        if (holdingType == "Option") {
            plpercent = ((unrealized / 100) / cost) * 100;
        }

        const width = 375;
        const height = 94;

        const canvas = new Canvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#292d33";
        ctx.fillRect(0, 0, width, height);

        ctx.font = "12px Roboto";
        ctx.fillStyle = "#858b94";
        ctx.fillText(displayName, 10, 25);

        ctx.font = "22px Roboto";
        ctx.fillStyle = "#58b15b";
        if (plpercent < 0) {
            ctx.fillStyle = "#f04f43";
        }
        ctx.fillText(`${unrealized.toFixed(2)} ${holding.currency} (${plpercent.toFixed(2)}%)`, 10, 55);

        ctx.font = "10px Roboto";
        ctx.fillStyle = "#858b94";
        const lineText = `Avg ${averageOpenPrice.toFixed(2)} ${holding.currency} / Last ${price.toFixed(2)} ${holding.currency}`;
        ctx.fillText(lineText, 10, 75);

        await interaction.reply({
            files: [{
                attachment: canvas.toBuffer(),
                name: "chart.png"
            }]
        });
    },
};