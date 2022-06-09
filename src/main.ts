import { config } from 'dotenv';
import { Client } from 'discord.js';
import TelegramBot from 'node-telegram-bot-api';
import http from 'http';

config({ path: `.env.local` });

const bot = new TelegramBot(process.env.TG_TOKEN, { polling: true });
const client = new Client();
const server = http.createServer(requestListener);

client.login(process.env.TOKEN);

function sendMessageToChat(message: string) {
  bot.sendMessage(process.env.TG_CHAT_ID, message, {
    disable_notification: true,
  });
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('voiceStateUpdate', async (before, after) => {
  if (
    after.channelID.toString() !== process.env.DISCORD_VOICE_CHAT_ID.toString()
  ) {
    return;
  }

  // TODO: if user start playing World Of Tanks, and plays for 5 minutes then send notification (not afk)
  // TODO: clean messages after some time

  if (after.channel?.members.size === 1) {
    sendMessageToChat(
      [`${after.member.displayName} joined ${after.channel.name}`].join('\n'),
    );
  }

  if (before.channel?.members.size === 0 && after.channelID === null) {
    sendMessageToChat(
      [
        `${after.member.displayName} left ${before.channel.name}`,
        `no users left`,
      ].join('\n'),
    );
  }

  if (
    after.id === before.id &&
    after.streaming !== before.streaming &&
    (before.channelID === after.channelID || after.channelID === null)
  ) {
    const game = after.member.presence?.activities
      .map((act) => act.name)
      .join(', ');

    sendMessageToChat(
      [
        `${after.member.displayName} ${
          after.streaming ? 'Started streaming 🔴' : 'Ended streaming 😴'
        } `,
        after.streaming ? `🎮 ${game || 'Unknown game'}` : '',
      ].join('\n'),
    );
  }
});

function requestListener(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': 2,
  });

  response.write('OK');
  response.end();
}

server.listen(8080);
