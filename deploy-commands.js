import { REST, Routes, SlashCommandBuilder } = from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Wyślij panel składania raportów (LSPD)")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

rest.put(
  Routes.applicationGuildCommands(
    process.env.CLIENT_ID,
    process.env.GUILD_ID
  ),
  { body: commands }
);
