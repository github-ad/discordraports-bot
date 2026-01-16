import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

/* ================== REJESTRACJA KOMEND ================== */
const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Wyślij panel składania raportów LSPD"),

  new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Nadaj blacklistę użytkownikowi")
    .addUserOption(o =>
      o.setName("kto")
        .setDescription("Osoba objęta blacklistą")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("za_co")
        .setDescription("Powód nadania blacklisty")
        .setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Rejestracja komend slash...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("✅ Komendy zarejestrowane!");
  } catch (err) {
    console.error(err);
  }
})();

/* ================== BOT READY ================== */
client.once("ready", async () => {
  console.log("🚓 LSPD Report Bot ONLINE");

  try {
    const channel = await client.channels.fetch(process.env.PANEL_CHANNEL_ID);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_report_modal")
        .setLabel("📄 ZŁÓŻ RAPORT")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      content: "**Los Santos Police Department – Axon Records**\nKliknij przycisk, aby złożyć raport z interwencji.",
      components: [row]
    });

    console.log("✅ Panel wysłany!");
  } catch (err) {
    console.error("Błąd wysyłania panelu:", err);
  }
});

/* ================== INTERACTION HANDLER ================== */
client.on("interactionCreate", async interaction => {

  /* ===== KOMENDA /blacklist ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "blacklist") {

    const user = interaction.options.getUser("kto");
    const reason = interaction.options.getString("za_co");

    // Embed DM
    const dmEmbed = new EmbedBuilder()
      .setTitle("🚫 Blacklista – Los Santos Police Department")
      .setColor(15158332)
      .setDescription(
        `Zostałeś/aś objęty/a **blacklistą LSPD**.\n\n**Powód:**\n${reason}`
      )
      .setFooter({ text: "Los Santos Police Department" })
      .setTimestamp();

    let dmStatus = "📩 Wiadomość DM wysłana.";

    try {
      await user.send({ embeds: [dmEmbed] });
    } catch {
      dmStatus = "⚠️ Nie udało się wysłać DM (zablokowane lub wyłączone).";
    }

    await interaction.reply({
      content:
        `✅ **Blacklista nadana**\n` +
        `👤 Osoba: ${user}\n` +
        `📝 Powód: ${reason}\n\n${dmStatus}`,
      ephemeral: true
    });
  }

  /* ===== PRZYCISK PANELU ===== */
  if (interaction.isButton() && interaction.customId === "open_report_modal") {

    const modal = new ModalBuilder()
      .setCustomId("lspd_report_modal")
      .setTitle("LSPD – Raport Interwencji");

    const fields = [
      ["name", "Imię i nazwisko funkcjonariusza"],
      ["badge", "Numer odznaki"],
      ["case", "Numer raportu"],
      ["report", "Link do raportu"],
      ["bodycam", "Link do nagrania Bodycam"]
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

  /* ===== SUBMIT MODALA ===== */
  if (interaction.isModalSubmit() && interaction.customId === "lspd_report_modal") {

    const data = Object.fromEntries(
      ["name","badge","case","report","bodycam"]
        .map(id => [id, interaction.fields.getTextInputValue(id)])
    );

    const forum = await interaction.guild.channels.fetch(process.env.FORUM_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle(`Interwencja: ${data.case}`)
      .setColor(3447003)
      .addFields(
        { name: "Funkcjonariusz:", value: data.name, inline: true },
        { name: "Odznaka:", value: data.badge, inline: true },
        { name: "Axon Records – Report:", value: `[OTWÓRZ LINK](${data.report})` },
        { name: "Axon Evidence Body 3 Video:", value: `[OTWÓRZ LINK](${data.bodycam})` }
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
});

client.login(process.env.TOKEN);
