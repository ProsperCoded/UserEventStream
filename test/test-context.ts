import { Client } from 'pg';
import mongoose from 'mongoose';

export const API_URL = 'http://localhost:3000';
export const POSTGRES_CONN =
  'postgres://user:password@localhost:5433/user_event_stream';
export const MONGO_URI =
  'mongodb://user:password@localhost:27017/user_event_stream?authSource=admin';

export class TestContext {
  private pgClient!: Client;
  private isConnected = false;

  async setup() {
    this.pgClient = new Client({ connectionString: POSTGRES_CONN });
    await this.pgClient.connect();
    await mongoose.connect(MONGO_URI);
    this.isConnected = true;
  }

  async teardown() {
    if (this.isConnected) {
      await this.pgClient.end();
      await mongoose.disconnect();
      this.isConnected = false;
    }
  }

  async queryPostgres(query: string, params?: any[]) {
    return this.pgClient.query(query, params);
  }

  getMongoCollection(name: string) {
    return mongoose.connection.db.collection(name);
  }
}
