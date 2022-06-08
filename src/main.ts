import { config } from 'dotenv';
import { REST } from '@discordjs/rest';
import { Client, Intents } from 'discord.js';
import { Routes } from 'discord-api-types/v9';
import TelegramBot from 'node-telegram-bot-api';

config({ path: `.env.local` });

const bot = new TelegramBot(process.env.TG_TOKEN, { polling: true });

// let chatId: number | undefined;

// bot.onText(/\/echo (.+)/, (msg, match) => {
//   // 'msg' is the received Message from Telegram
//   // 'match' is the result of executing the regexp above on the text content
//   // of the message

//   chatId = msg.chat.id;
//   console.log(chatId);
//   const resp = match[1]; // the captured "whatever"

//   // // send back the matched "whatever" to the chat
//   // bot.sendMessage(chatId, resp);
// });

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_PRESENCES,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.on('voiceStateUpdate', async (before, after) => {
  // const membersBefore = before.channel?.members;
  // const membersAfter = after.channel?.members;

  // TODO: if user start playing World Of Tanks, and plays for 5 minutes then send notification (not afk)

  if (after.channel?.members.size === 1) {
    bot.sendMessage(
      process.env.TG_CHAT_ID,
      [`${after.member.displayName} joined ${after.channel.name}`].join('\n'),
    );
  }

  if (before.channel?.members.size === 0 && after.channelId === null) {
    bot.sendMessage(
      process.env.TG_CHAT_ID,
      [
        `${after.member.displayName} left ${before.channel.name}`,
        `no users left`,
      ].join('\n'),
    );
  }

  if (
    after.id === before.id &&
    after.streaming !== before.streaming &&
    before.channelId === after.channelId
  ) {
    const game = after.member.presence?.activities
      .map((act) => act.name)
      .join(', ');

    bot.sendMessage(
      process.env.TG_CHAT_ID,
      [
        `${after.member.displayName} ${after.streaming ? '🔴' : '😴'} `,
        after.streaming ? `🎮 ${game || '✨'}` : '',
      ].join('\n'),
    );
  }

  // console.log(
  //   'before',
  //   before.member?.displayName,
  //   before.channel?.name,
  //   membersBefore?.map((member) => member.displayName),
  // );
  // console.log(
  //   'after',
  //   before.member?.displayName,
  //   before.channel?.name,
  //   membersAfter?.map((member) => member.displayName),
  // );
});

client.login(process.env.TOKEN);
