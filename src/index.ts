require('dotenv').config();

import Discord from 'discord.js';
import moment from 'moment';

import * as Shovel from './helpers/shovel-db';

class FAISBot {
  private token: string;
  private watchChannelId: string;

  private bot: Discord.Client;
  private shovel: Shovel.DB;

  constructor(token: string | undefined, chId: string | undefined) {
    if (!token) {
      throw new ReferenceError('トークンが入力されていません。');
    }
    if (!chId) {
      throw new ReferenceError('監視するチャンネルのIDが入力されていません。');
    }

    this.token = token;
    this.bot = new Discord.Client();
    this.shovel = new Shovel.DB('mongodb://localhost:27017', 'fais');

    this.watchChannelId = chId;
  }

  public async start(): Promise<void> {
    this.bot.login(this.token);
    this.shovel.start();

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
      this.handleInviteCommand(msg);

      this.handleShovelCommand(msg);

      this.handleSystemCommand(msg);
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

  private handleInviteCommand(msg: Discord.Message): void {
    const inviteLinkCmd = msg.content.match(/\/invite (.+)/);
    if (inviteLinkCmd) {
      this.deleteMessage(msg);
      msg.channel
        .send(`https://discord.gg/${inviteLinkCmd[1]}`)
        .catch(err => console.error(err));
    }
  }

  private handleSystemCommand(msg: Discord.Message): void {
    const systemCmd = msg.content.match(/^!fais (\S+)(.*)$/);
    if (!systemCmd) return;

    const args = systemCmd[2].replace(/\s+/g, ' ').split(' ');
    args.shift();

    if (systemCmd[1] === 'findWord') {
      if (args.length !== 1) {
        msg.channel.send('引数が不正です / 使用例 : `!fais findWord <単語>`');
        return;
      }

      this.shovel
        .findWord({ word: args[0] })
        .then((word: Shovel.Word | undefined) => {
          if (word) {
            msg.channel.send({
              embed: {
                title: `「${args[0]}」の照会結果`,
                color: parseInt('0x53eb34', 16),
                fields: [
                  {
                    name: 'よみ',
                    value: word.yomi || '(読まない)',
                    inline: false
                  },
                  {
                    name: '単語登録者',
                    value: word.userTag || '不明',
                    inline: true
                  },
                  {
                    name: '登録日',
                    value: `${moment
                      .unix(word.timestamp ? word.timestamp : 0)
                      .format('YYYY/MM/DD HH:mm:ss')}`,
                    inline: true
                  },
                  {
                    name: '登録時のメッセージ',
                    value: word.messageUri
                      ? `https://discordapp.com/channels/${word.messageUri}`
                      : '不明',
                    inline: false
                  }
                ]
              }
            });
          } else {
            msg.channel.send({
              embed: {
                title: `${args[0]}の照会結果`,
                color: parseInt('0xeb4034', 16),
                description: `「${args[0]}」は辞書に登録されていません`
              }
            });
          }
        });
    }
  }

  private handleShovelCommand(msg: Discord.Message): void {
    const shovelCmd = msg.content.match(
      /^!sh[gr]? (?:(add|delete)_word|([ad])w) (\S+)(?: (\S+))?$/
    );
    if (!shovelCmd) return;

    if (shovelCmd[1] == 'add' || shovelCmd[2] == 'a') {
      msg.react('📝');

      this.shovel
        .addWord({
          word: shovelCmd[3],
          yomi: shovelCmd[4],
          userTag: msg.author.tag,
          userId: msg.author.id,
          messageUri: `${msg.guild.id}/${msg.channel.id}/${msg.id}`
        })
        .then(() => {
          console.log(`success 単語データ登録完了 ${shovelCmd[3]}`);
          msg.react('✅');
        })
        .catch(err => {
          console.error(`error ${err}`);
          msg.react('❎');
        });
    } else if (shovelCmd[1] == 'delete' || shovelCmd[2] == 'd') {
      msg.react('🗑️');

      this.shovel
        .removeWord({ word: shovelCmd[3] })
        .then(() => {
          console.log(`success 単語データ削除完了 ${shovelCmd[3]}`);
          msg.react('✅');
        })
        .catch(err => {
          console.error(`error ${err}`);
          msg.react('❎');
        });
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