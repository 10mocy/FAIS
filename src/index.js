import discord from 'discord.js'
const client = new discord.Client()
const pkg = require('../package.json')

require('dotenv').config()

const main = () => {
  if (!process.env.BOT_TOKEN) throw new Error('❌ BOTトークンが入力されていません。')
  if (!process.env.CHANNEL_ID) throw new Error('❌ チャンネルIDが入力されていません。')

  client.login(process.env.BOT_TOKEN).catch(err => console.error(err))

  client.on('ready', () => {
    console.log('✔ 準備完了')
    client.user.setActivity(`FAIS v${pkg.version}`)
  })

  client.on('message', msg => {
    if (msg.author.id === client.user.id) return
    if (msg.channel.type !== 'text') return

    if (msg.content.match(/(https?|ftp)(:\/\/[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+)/)) return
    if (msg.channel.id !== process.env.CHANNEL_ID) return

    if (msg.attachments.size) return

    console.log(`📤 メッセージID ${msg.id} を転送中`)
    msg.author.send(`#${msg.channel.name} で投稿するためには、画像等の添付が必要です。\n\n**__元のメッセージ__**\n\`\`\`${msg.content}\`\`\``)
    .then(() => console.log(`✔ 転送完了(${msg.id})`))
    .catch(err => console.error(err))

    console.log(`🗑️ メッセージID ${msg.id} を削除中`)
    msg.delete()
      .then(() => console.log(`✔ 削除完了(${msg.id})`))
      .catch(err => console.error(err))
  })

  client.on('message', msg => {
    if (msg.author.id === client.user.id) return
    if (msg.channel.type !== 'text') return

    if (msg.channel.id === process.env.CHANNEL_ID) return
    
    const inviteLink = msg.content.match(/\/invite (.+)/)
    if(inviteLink) {
      console.log(`🗑️ メッセージID ${msg.id} を削除中`)
      msg.delete()
        .then(() => console.log(`✔ 削除完了(${msg.id})`))
        .catch(err => console.error(err))
        
      msg.channel.send(`https://discord.gg/${inviteLink[1]}`)
      return
    }

    if(!msg.content.match(/discord.gg\/(.+)/)) return

    console.log('📤 通告中')
    msg.author.send(`**__${msg.guild.name} での招待リンクの投稿は許可されていません。\nこの行為は記録され、管理者に通告されました。(管理番号: \`${msg.id}\`)__**`)
    .then(() => console.log(`✔ 通告完了(${msg.id})`))
    .catch(err => console.error(err))

    console.log(`🗑️ メッセージID ${msg.id} を削除中`)
    msg.delete()
      .then(() => console.log(`✔ 削除完了(${msg.id})`))
      .catch(err => console.error(err))
  })

  client.on('error', err => console.error(err))
}

main()
