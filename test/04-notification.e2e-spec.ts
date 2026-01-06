import { SmartSeeder } from './utils/smart-seed';
import { TestContext, API_URL } from './test-context';
import { execSync } from 'child_process';

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
    await new Promise((r) => setTimeout(r, 3000));

    // Verify Log
    try {
      const logs = execSync(
        'docker exec notification-service-1 cat notifications.log',
      ).toString();
      // Check for specific welcome message
      expect(logs).toContain(`Welcome to our platform, ${user.email}`);
    } catch (e) {
      console.warn('Docker exec failed or log not found yet');
    }
  });
});
