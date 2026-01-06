import { SmartSeeder } from './utils/smart-seed';
import { TestContext, API_URL } from './test-context';

describe('Notification E2E', () => {
  const context = new TestContext();
  const seeder = new SmartSeeder(API_URL);

  beforeAll(async () => {
    await context.setup();
  });

  afterAll(async () => {
    await context.teardown();
  });

  it('should send Welcome notification on Signup', async () => {
    const user = await seeder.createUser();

    // Wait for async processing
    await new Promise((r) => setTimeout(r, 5000));

    // Verify MongoDB Notification
    const notification = await context
      .getMongoCollection('notifications')
      .findOne({
        userId: user.id,
        message: { $regex: /Welcome to our platform/ },
      });

    console.log('[Notification Test] Found notification:', notification);
    expect(notification).not.toBeNull();
    expect(notification.message).toContain(user.email);
  }, 30000);
});
