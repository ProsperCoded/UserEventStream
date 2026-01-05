import { SmartSeeder } from '../../scripts/smart-seed';
import { TestContext, API_URL } from './test-context';
import { faker } from '@faker-js/faker';

describe('Fraud Detection E2E', () => {
  const context = new TestContext();
  const seeder = new SmartSeeder(API_URL);

  beforeAll(async () => {
    await context.setup();
  });

  afterAll(async () => {
    await context.teardown();
  });

  it('Scenario: Password Change -> IP Change -> Login (Compromised Account)', async () => {
    const user = await seeder.createUser();
    const newPass = faker.internet.password();

    // 1. Change Password
    await seeder.changePassword(user.id, newPass);
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Login from new IP
    const newIp = faker.internet.ipv4();
    try {
      await seeder.login(user.email, newPass, newIp);
    } catch (e) {}

    await new Promise((r) => setTimeout(r, 5000));

    // Verify Fraud Report (Score 30)
    const report = await context.getMongoCollection('fraudreports').findOne({
      userId: user.id,
      reason: { $regex: /PasswordReset->IpChange->Login/ },
    });
    expect(report).toBeDefined();
    expect(report.riskScore).toBeGreaterThanOrEqual(30);
  });

  it('Scenario: Brute Force', async () => {
    const user = await seeder.createUser();
    const ip = faker.internet.ipv4();

    // 5 Failed Logins
    for (let i = 0; i < 5; i++) {
      try {
        await seeder.login(user.email, 'wrongpass', ip);
      } catch (e) {}
    }

    await new Promise((r) => setTimeout(r, 5000));

    // Verify Fraud Report (Score 40)
    const report = await context.getMongoCollection('fraudreports').findOne({
      userId: user.id,
      reason: { $regex: /Brute Force/ },
    });
    expect(report).toBeDefined();
    expect(report.riskScore).toBeGreaterThanOrEqual(40);
  });
});
