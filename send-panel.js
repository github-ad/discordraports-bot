import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import dotenv from "dotenv";
dotenv.config();


const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  const channel = await client.channels.fetch(
    process.env.PANEL_CHANNEL_ID
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open_report_modal")
      .setLabel("📄 ZŁÓŻ RAPORT")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({
    content: "**Los Santos Police Department – Axon Records**\nKliknij przycisk poniżej, aby złożyć raport z interwencji.",
    components: [row]
  });

  console.log("Panel wysłany");
  process.exit();
});

client.login(process.env.TOKEN);
