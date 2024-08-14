import { SlashCommandBuilder } from "discord.js";
import db from "../../lib/mongo";
import { getHoldingByTicker } from "../../lib/holdings";
import holdingReport from "../../report/holding";
import { getStockDetails } from "../../lib/stocks";

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
            await interaction.reply("You have not logged into Stonks yet. Please visit https://stonks.aaronstatic.com/ to login.");
            return;
        }

        const ticker = interaction.options.getString("ticker");
        if (!ticker) {
            await interaction.reply("Please provide a ticker");
            return;
        }

        const holding = await getHoldingByTicker(user._id.toString(), ticker);
        if (!holdingReport) {
            await interaction.reply("You do not have a position with that ticker");
            return;
        }

        const report = await holdingReport(user._id.toString(), {
            ticker,
            type: holding.type
        });

        if (!report) {
            await interaction.reply("There was an error fetching the report");
            return;
        }

        if (report.openQuantity === 0) {
            await interaction.reply("You have no open positions for this ticker");
            return;
        }

        let name = "";
        if (holding.name) {
            name = holding.name;
        } else if (holding.type == "Stock") {
            const details = await getStockDetails(ticker);
            if (details) {
                name = details.name;
            }
        }
        let displayName = `${name} [${holding.ticker}]`;
        if (name === "") {
            displayName = holding.ticker;
        }

        const plpercent = (report.unrealized / report.cost) * 100;

        await interaction.reply({
            embeds: [{
                title: `Position in ${displayName}`,
                fields: [{
                    name: "Avg Open Price",
                    value: report.averageOpenPrice.toFixed(2) + " " + holding.currency
                }, {
                    name: "Quantity",
                    value: report.openQuantity
                }, {
                    name: "Unrealized P&L",
                    value: `${report.unrealized.toFixed(2)} ${user.currency} (${plpercent.toFixed(2)}%)`
                }]
            }]
        });
    },
};