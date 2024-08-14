import { SlashCommandBuilder } from "discord.js";
import { getNextExpiryGamma, getStockPrice } from "../../lib/stocks";
import { DateTime } from "luxon";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gammalevels")
        .setDescription("Display gamma levels for a ticker (if available)")
        .addStringOption(option =>
            option.setName("ticker")
                .setDescription("The ticker")
                .setRequired(true)
        ),
    async execute(interaction: any) {

        const ticker = interaction.options.getString("ticker");
        if (!ticker) {
            await interaction.reply("Please provide a ticker");
            return;
        }

        const levels = await getNextExpiryGamma(ticker);
        if (!levels) {
            await interaction.reply("No gamma levels available for this ticker atm, add it to your watchlist in Stonks and wait for the database to update");
            return;
        }

        const price = await getStockPrice(ticker);

        await interaction.reply({
            embeds: [{
                title: `Gamma levels for ${ticker} on ${DateTime.fromISO(levels.date + "T00:00:00.000Z").toFormat("dd/MM/yyyy")}`,
                fields: [{
                    name: "Spot Price",
                    value: price.toFixed(2)
                }, {
                    name: "Put Support",
                    value: levels.levels.putSupport.toFixed(2)
                }, {
                    name: "Gamma Flip",
                    value: levels.levels.gammaFlip.toFixed(2)
                }, {
                    name: "Call Resistance",
                    value: levels.levels.callResistance.toFixed(2)
                }]
            }]
        });
    },
};