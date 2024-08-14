import { SlashCommandBuilder } from "discord.js";
import { getStockPrice } from "../../lib/stocks";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stockprice")
        .setDescription("Display price for a ticker (if available)")
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

        const price = await getStockPrice(ticker);
        if (price == 0) {
            await interaction.reply("No data available for this ticker atm, add it to your watchlist in Stonks and wait for the database to update");
            return;
        }

        await interaction.reply({
            content: `Price for ${ticker} is ${price.toFixed(2)} (Delayed 15 mins)`,
        });
    }
};