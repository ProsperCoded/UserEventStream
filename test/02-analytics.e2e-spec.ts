import { SmartSeeder } from './utils/smart-seed';
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
    void (await Promise.all(
      users.map((u) => seeder.login(u.email, u.password)),
    ));

    // Allow Kafka processing time
    await new Promise((r) => setTimeout(r, 10000));

    // Verify MongoDB DAU count
    const today = new Date().toISOString().split('T')[0];
    const dailyActivity = await context
      .getMongoCollection('dailyactivities')
      .findOne({ date: today });

    console.log(
      `[Analytics Test] Checking DAU for ${today}. Found:`,
      dailyActivity ? 'Record exists' : 'NULL',
    );
    if (dailyActivity) {
      console.log(
        `[Analytics Test] Active User Count: ${dailyActivity.activeUserIds.length}`,
      );
    } else {
      // List all activities to see if we have the wrong date
      const allActivities = await context
        .getMongoCollection('dailyactivities')
        .find({})
        .toArray();
      console.log(
        '[Analytics Test] All Daily Activities:',
        JSON.stringify(allActivities, null, 2),
      );
    }

    expect(dailyActivity).not.toBeNull();
    // activeUserIds should track unique users.
    // Since we created >1 users, expect >1.
    // Ideally expect >= 50, but existing users might be there.
    expect(dailyActivity!.activeUserIds.length).toBeGreaterThanOrEqual(50);
  }, 120000);
});
