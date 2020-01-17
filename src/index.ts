require('dotenv').config();

import Discord from 'discord.js';

class FAISBot {
  private token!: string;
  private watchChannelId!: string;

  private bot: Discord.Client;

  constructor(token: string | undefined, chId: string | undefined) {
    if (!token) {
      throw new ReferenceError('トークンが入力されていません。');
    }
    if (!chId) {
      throw new ReferenceError('監視するチャンネルのIDが入力されていません。');
    }

    this.token = token;
    this.bot = new Discord.Client();

    this.watchChannelId = chId;
  }

  public start(): void {
    this.bot.login(this.token);

    this.handleReady();
    this.handleError();
    this.handleMessage();
  }

  private handleReady(): void {
    this.bot.on('ready', () => {
      console.log('success 準備完了');
      this.bot.user.setActivity(
        `FAIS w/ NeiRo.WORK v${process.env.npm_package_version}`
      );
    });
  }

  private handleError(): void {
    this.bot.on('error', err => console.error(`error ${err}`));
  }

  private handleMessage(): void {
    this.bot.on('message', msg => {
      if (msg.author.id === this.bot.user.id) return;
      if (msg.channel.type !== 'text') return;

      this.handleChat(msg);
      this.handleInviteLink(msg);
      this.handleCommand(msg);
    });
  }

  private handleChat(msg: Discord.Message): void {
    if (msg.channel.id !== this.watchChannelId) return;
    if (!(msg.channel instanceof Discord.TextChannel)) return;

    if (msg.content.match(/https?(:\/\/[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+)/))
      return;

    if (msg.attachments.size) return;

    msg.author
      .send(
        `#${msg.channel.name} に投稿するためには、画像等の添付が必要です。\n\n**__元のメッセージ__**\n\`\`\`${msg.content}\`\`\``
      )
      .then(() => console.log(`info 転送完了 ${msg.id}`))
      .catch(err => console.error(err));

    this.deleteMessage(msg);
  }

  private handleInviteLink(msg: Discord.Message): void {
    if (msg.channel.id === this.watchChannelId) return;

    if (!msg.content.match(/discord.gg\/(.+)/)) return;

    this.deleteMessage(msg);

    msg.author
      .send(
        `**__${msg.guild.name} での招待リンクの投稿は許可されていません。__**\n\n**__元のメッセージ__**\n\`\`\`${msg.content}\`\`\``
      )
      .then(() => console.log(`info 通知完了 ${msg.id}`))
      .catch(err => console.error(err));
  }

  private handleCommand(msg: Discord.Message): void {
    const inviteLinkCmd = msg.content.match(/\/invite (.+)/);
    if (inviteLinkCmd) {
      this.deleteMessage(msg);
      msg.channel
        .send(`https://discord.gg/${inviteLinkCmd[1]}`)
        .catch(err => console.error(err));
    }
  }

  private deleteMessage(msg: Discord.Message): void {
    msg
      .delete()
      .then(() => console.log(`info 削除完了 ${msg.id}`))
      .catch(err => console.error(err));
  }
}

const fais = new FAISBot(process.env.BOT_TOKEN, process.env.CHANNEL_ID);
fais.start();
