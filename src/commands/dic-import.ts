import * as Shovel from './../helpers/shovel-db';

import * as fs from 'fs';
import * as readline from 'readline';
import * as iconv from 'iconv-lite';

const main = async (): Promise<void> => {
  const db = new Shovel.DB('mongodb://localhost:27017', 'fais');
  console.log(db);
  await db.start();

  const stream = fs
    .createReadStream(process.argv[2])
    .pipe(iconv.decodeStream('UTF-16 LE'));
  const reader = readline.createInterface({ input: stream });

  reader.on('line', (data: string) => {
    const word = data.split(', ');
    db.addWord({
      word: word[0],
      yomi: word[1],
      userTag: undefined,
      userId: undefined,
      messageUri: undefined
    })
      .then(() => console.log(`success 単語データ登録完了 ${word[0]}`))
      .catch(err => {
        throw err;
      });
  });
};

main();
