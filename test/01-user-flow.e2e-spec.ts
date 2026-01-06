import { SmartSeeder } from './utils/smart-seed';
import { TestContext, API_URL } from './test-context';

describe('User Flow E2E', () => {
  const context = new TestContext();
  const seeder = new SmartSeeder(API_URL);

  beforeAll(async () => {
    await context.setup();
  });

  afterAll(async () => {
    await context.teardown();
  });

  it('should allow user signup and data persistence', async () => {
    const user = await seeder.createUser();

    // Verify Postgres
    const res = await context.pgClient.query(
      'SELECT * FROM users WHERE id = $1',
      [user.id],
    );
    expect(res.rows[0].email).toBe(user.email);
  });

  it('should allow login and session tracking', async () => {
    const user = await seeder.createUser();
    const loginRes = await seeder.login(user.email, user.password);
    expect(loginRes.userId).toBe(user.id);
  });
});
