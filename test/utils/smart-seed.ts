import axios from 'axios';
import { faker } from '@faker-js/faker';

export class SmartSeeder {
  constructor(private apiUrl: string) {}

  async createUser(email?: string) {
    const userEmail = email || faker.internet.email();
    const password = faker.internet.password();
    try {
      const res = await axios.post(`${this.apiUrl}/users`, {
        email: userEmail,
        password,
      });
      return { id: res.data.id, email: userEmail, password };
    } catch (e: any) {
      console.error('Create User API Error:', e.response?.data || e.message);
      throw e;
    }
  }

  async createManyUsers(count: number) {
    const users = [];
    // Use Promise.all for speed? Or sequential to avoid overloading dev machine/Postgres pool?
    // Sequential for safer ordering in logs.
    for (let i = 0; i < count; i++) {
      users.push(await this.createUser());
    }
    return users;
  }

  async login(email: string, password: string, ip = '127.0.0.1') {
    try {
      const res = await axios.post(`${this.apiUrl}/users/login`, {
        email,
        password,
        ip,
        userAgent: faker.internet.userAgent(),
      });
      return res.data;
    } catch (e: any) {
      throw e; // Check caller for handling 401/404
    }
  }

  async simulateActivity(user: any, eventCount: number) {
    // Simulate login -> some actions? API currently only supports login/logout/changePassword.
    // We can login/logout multiple times?
    const ip = faker.internet.ipv4();
    await this.login(user.email, user.password, ip);
    // Logout?
    // await this.logout(user.id);
  }

  async logout(userId: string) {
    await axios.post(`${this.apiUrl}/users/${userId}/logout`);
  }

  async changePassword(userId: string, newPassword: string) {
    await axios.patch(`${this.apiUrl}/users/${userId}/password`, {
      password: newPassword,
    });
  }
}
