import discord from 'discord.js'
const client = new discord.Client()

require('dotenv').config()

const main = () => {
  if (!process.env.BOT_TOKEN) throw new Error('❌ BOTトークンが入力されていません。')
  if (!process.env.CHANNEL_ID) throw new Error('❌ チャンネルIDが入力されていません。')

  client.login(process.env.BOT_TOKEN).catch(err => console.error(err))

  client.on('ready', () => {
    console.log('✔ 準備完了')
    client.user.setActivity('無駄話', { type: 'WATCHING' })
  })

  client.on('message', msg => {
    if (msg.author.id === client.user.id) return
    if (msg.channel.type !== 'text') return
    if (msg.channel.id !== process.env.CHANNEL_ID) return

    if (msg.attachments.size) return

    console.log(`🗑️ メッセージID ${msg.id} を削除中`)
    msg.delete()
      .then(() => console.log(`✔ 削除完了(${msg.id})`))
      .catch(err => console.error(err))
  })

  client.on('error', err => console.error(err))
}

main()
