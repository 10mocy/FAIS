import * as Shovel from './../helpers/shovel-db';

const main = async (): Promise<void> => {
  if (process.argv.length !== 7) {
    console.error('引数が足りません');
    return process.exit(-1);
  }

  const db = new Shovel.DB('mongodb://localhost:27017', 'fais');
  await db.start().then(() => {
    db.addWord({
      word: process.argv[2],
      yomi: process.argv[3],
      userTag: process.argv[4],
      userId: process.argv[5],
      messageUri: process.argv[6]
    })
      .then(() => {
        console.log(`success 単語データ登録完了 ${process.argv[2]}`);
      })
      .catch(err => {
        throw err;
      });
  });
};

main();
