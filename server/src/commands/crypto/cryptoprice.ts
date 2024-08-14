import { SlashCommandBuilder } from "discord.js";
import { getCryptoPrice } from "../../lib/crypto";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cryptoprice")
        .setDescription("Display USDT price for a cryptocurrency (if available)")
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

        const price = await getCryptoPrice(ticker);
        if (price == 0) {
            await interaction.reply("No data available for this ticker atm");
            return;
        }

        await interaction.reply({
            content: `Price for ${ticker} is ${price.toFixed(2)} (Delayed 15 mins)`,
        });
    }
};