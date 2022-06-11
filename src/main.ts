import { config } from 'dotenv';
import { Client } from 'discord.js';
import TelegramBot from 'node-telegram-bot-api';
import http from 'http';

config({ path: `.env.local` });

function sendMessageToChat(message: string) {
  bot.sendMessage(process.env.TG_CHAT_ID, message, {
    disable_notification: true,
  });
}

function requestListener(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': 2,
  });

  response.write('OK');
  response.end();
}

// TELEGRAM
const bot = new TelegramBot(process.env.TG_TOKEN, { polling: true });

// DISCORD
const client = new Client();
client.login(process.env.TOKEN);

// HTTP HELTH CHECK
const server = http.createServer(requestListener);
server.listen(8080);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// TODO: if user start playing World Of Tanks, and plays for 5 minutes then send notification (not afk)
// TODO: clean messages after some time

client.on('voiceStateUpdate', async (before, after) => {
  const isTargetChannelAfter =
    after.channelID.toString() === process.env.DISCORD_VOICE_CHAT_ID.toString();
  const isTargetChannelBefore =
    before.channelID.toString() ===
    process.env.DISCORD_VOICE_CHAT_ID.toString();

  const isTheSameUser = after.id === before.id;
  const streamingChanged = after.streaming !== before.streaming;

  const isTheSameChannel = before.channelID === after.channelID;
  const hasNoChannelAfter = after.channelID === null;
  const hasNoChannelBefore = before.channelID === null;

  const hasOneJoinedUser = after.channel?.members.size === 1;
  const hasNoUsersLeft = before.channel?.members.size === 0;

  // triggers when channel has no left users after user left
  if (hasNoUsersLeft && hasNoChannelAfter && isTargetChannelBefore) {
    sendMessageToChat(
      [
        `${after.member.displayName} left ${before.channel.name}`,
        `no users left`,
      ].join('\n'),
    );
  }

  // triggers only users joins empty channel
  if (hasOneJoinedUser && isTargetChannelAfter && hasNoChannelBefore) {
    sendMessageToChat(
      [`${after.member.displayName} joined ${after.channel.name}`].join('\n'),
    );
  }

  const userStreamingStatusChanged = isTheSameUser && streamingChanged;
  const streamingHappeningInTheSameChannel =
    isTheSameChannel && isTargetChannelAfter;
  const streamingStopsInTargetChannel =
    hasNoChannelAfter && isTargetChannelBefore;

  // triggers when user streaming activity changes
  if (
    userStreamingStatusChanged &&
    (streamingHappeningInTheSameChannel || streamingStopsInTargetChannel)
  ) {
    const game = after.member.presence?.activities
      .map((act) => act.name)
      .join(', ');

    const streamStatus = after.streaming
      ? 'Started streaming 🔴'
      : 'Ended streaming 😴';
    const gameStatus = after.streaming ? `🎮 ${game || 'Unknown game'}` : '';

    sendMessageToChat(
      [`${after.member.displayName} ${streamStatus} `, gameStatus].join('\n'),
    );
  }
});
