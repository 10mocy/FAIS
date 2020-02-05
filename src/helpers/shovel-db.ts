import Mongo from 'mongodb';
import moment from 'moment';

export type Word = {
  _id?: Mongo.ObjectId;
  word: string;
  yomi: string;
  userTag: string | undefined;
  userId: string | undefined;
  messageUri: string | undefined;
  timestamp?: number;
};

export class DB {
  private db!: Mongo.Db;

  private dbUri: string;
  private dbName: string;

  /**
   * Database settings.
   * @param dbUri database connection query. e.g. mongodb://localhost:27017
   * @param dbName database name.
   */
  constructor(dbUri: string, dbName: string) {
    this.dbUri = dbUri;
    this.dbName = dbName;
  }

  public async start(): Promise<void> {
    await Mongo.MongoClient.connect(this.dbUri, {
      useUnifiedTopology: true
    })
      .then(mongo => {
        this.db = mongo.db(this.dbName);
        return;
      })
      .catch(err => {
        throw err;
      });
  }

  public async addWord(obj: Word): Promise<void> {
    this.db
      .collection<Word>('words')
      .insertOne({
        word: obj.word,
        yomi: obj.yomi,
        userTag: obj.userTag,
        userId: obj.userId,
        messageUri: obj.messageUri,
        timestamp: moment().unix()
      })
      .then(() => {
        return;
      })
      .catch(err => {
        throw err;
      });
  }

  public async removeWord(obj: { word: string }): Promise<void> {
    this.db
      .collection<Word>('words')
      .deleteMany({ word: obj.word })
      .then(() => {
        return;
      })
      .catch(err => {
        throw err;
      });
  }

  public async findWord(obj: { word: string }): Promise<Word | undefined> {
    const words = await this.db
      .collection<Word>('words')
      .find({ word: obj.word })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray()
      .catch(err => {
        throw err;
      });

    if (words.length === 1) {
      return words[0];
    } else {
      return;
    }
  }

  public async countWords(): Promise<number> {
    const distinct = await this.db.collection<Word>('words').distinct('word');
    return distinct.length;
  }
}
