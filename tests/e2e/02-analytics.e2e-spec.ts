import { SmartSeeder } from '../../scripts/smart-seed';
import { TestContext, API_URL } from './test-context';

describe('Analytics E2E', () => {
  const context = new TestContext();
  const seeder = new SmartSeeder(API_URL);

  beforeAll(async () => {
    await context.setup();
  }, 60000);

  afterAll(async () => {
    await context.teardown();
  });

  it('should track Daily Active Users (DAU)', async () => {
    // Create 50 users and login
    const users = await seeder.createManyUsers(50);

    // Login all of them
    await Promise.all(users.map((u) => seeder.login(u.email, u.password)));

    // Allow Kafka processing time
    await new Promise((r) => setTimeout(r, 8000));

    // Verify MongoDB DAU count
    const today = new Date().toISOString().split('T')[0];
    const dailyActivity = await context
      .getMongoCollection('dailyactivities')
      .findOne({ date: today });

    expect(dailyActivity).toBeDefined();
    // activeUserIds should track unique users.
    // Since we created >1 users, expect >1.
    // Ideally expect >= 50, but existing users might be there.
    expect(dailyActivity.activeUserIds.length).toBeGreaterThanOrEqual(50);
  }, 120000);
});
