import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config()

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log("🚓 LSPD Report Bot ONLINE");
});

client.on("interactionCreate", async interaction => {

  // KLIKNIĘCIE PRZYCISKU
  if (interaction.isButton()) {
    if (interaction.customId === "open_report_modal") {

      const modal = new ModalBuilder()
        .setCustomId("lspd_report_modal")
        .setTitle("LSPD – Raport Interwencji");

      const fields = [
        ["name", "Imię i nazwisko funkcjonariusza"],
        ["badge", "Numer odznaki"],
        ["case", "Numer sprawy (CAD)"],
        ["report", "Link do raportu (Google Docs)"],
        ["bodycam", "Link do bodycam (Media Fire)"]
      ].map(([id, label]) =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      modal.addComponents(...fields);
      return interaction.showModal(modal);
    }
  }

  // WYSŁANIE FORMULARZA
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "lspd_report_modal") {

      const data = Object.fromEntries(
        ["name","badge","unit","case","report","bodycam"]
          .map(id => [id, interaction.fields.getTextInputValue(id)])
      );

      const forum = await interaction.guild.channels.fetch(
        process.env.FORUM_CHANNEL_ID
      );

      const embed = new EmbedBuilder()
        .setTitle(`📄 Raport ${data.case}`)
        .setColor(3447003)
        .addFields(
          { name: "Funkcjonariusz", value: data.name, inline: true },
          { name: "Odznaka", value: data.badge, inline: true },
          { name: "Raport", value: `[OTWÓRZ RAPORT](${data.report})` },
          { name: "Bodycam", value: `[OTWÓRZ NAGRANIE](${data.bodycam})` }
        )
        .setFooter({ text: "Los Santos Police Department" })
        .setTimestamp();

      await forum.threads.create({
        name: `Sprawa ${data.case}`,
        message: { embeds: [embed] }
      });

      await interaction.reply({
        content: "✅ Raport został poprawnie zarejestrowany w systemie LSPD.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
