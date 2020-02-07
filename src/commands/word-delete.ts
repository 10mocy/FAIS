import * as Shovel from './../helpers/shovel-db';

const main = async (): Promise<void> => {
  if (process.argv.length !== 3) {
    console.error('引数が足りません');
    return process.exit(-1);
  }

  const db = new Shovel.DB('mongodb://localhost:27017', 'fais');
  await db.start().then(() => {
    db.removeWord({
      word: process.argv[2]
    })
      .then(() => {
        console.log(`success 単語データ削除完了 ${process.argv[2]}`);
      })
      .catch(err => {
        throw err;
      });
  });
};

main();
