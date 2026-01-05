import { Client } from 'pg';
import mongoose from 'mongoose';

export const API_URL = 'http://localhost:3000';
export const POSTGRES_CONN =
  'postgres://user:password@localhost:5432/user_event_stream';
export const MONGO_URI =
  'mongodb://user:password@localhost:27017/user_event_stream';

export class TestContext {
  pgClient: Client;

  async setup() {
    this.pgClient = new Client({ connectionString: POSTGRES_CONN });
    await this.pgClient.connect();
    await mongoose.connect(MONGO_URI);
  }

  async teardown() {
    await this.pgClient.end();
    await mongoose.disconnect();
  }

  getMongoCollection(name: string) {
    return mongoose.connection.db.collection(name);
  }
}
