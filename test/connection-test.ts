import { Client } from 'pg';
import mongoose from 'mongoose';

const POSTGRES_CONN =
  'postgres://user:password@localhost:5433/user_event_stream';
const MONGO_URI =
  'mongodb://user:password@localhost:27017/user_event_stream?authSource=admin';

async function testPostgres() {
  console.log('\n🔍 Testing PostgreSQL Connection...');
  console.log('Connection String:', POSTGRES_CONN);

  const client = new Client({ connectionString: POSTGRES_CONN });

  try {
    await client.connect();
    console.log('✅ PostgreSQL connected successfully!');

    const result = await client.query('SELECT version()');
    console.log('PostgreSQL Version:', result.rows[0].version);

    const dbResult = await client.query('SELECT current_database()');
    console.log('Current Database:', dbResult.rows[0].current_database);

    await client.end();
  } catch (error: any) {
    console.error('❌ PostgreSQL connection failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
    throw error;
  }
}

async function testMongo() {
  console.log('\n🔍 Testing MongoDB Connection...');
  console.log('Connection String:', MONGO_URI);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully!');

    const admin = mongoose.connection.db.admin();
    const info = await admin.serverInfo();
    console.log('MongoDB Version:', info.version);

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
    throw error;
  }
}

async function testAPI() {
  console.log('\n🔍 Testing Producer API...');
  const axios = require('axios');

  try {
    const response = await axios.get('http://localhost:3000');
    console.log('✅ API is responding!');
    console.log('Response:', response.data);
  } catch (error: any) {
    console.error('❌ API connection failed:');
    console.error('Error Message:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Make sure docker-compose is running!');
    }
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 Database & API Connection Test Suite');
  console.log('='.repeat(60));

  try {
    await testPostgres();
    await testMongo();
    await testAPI();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All connection tests passed!');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Connection tests failed!');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

runTests();
