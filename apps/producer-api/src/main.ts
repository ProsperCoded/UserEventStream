import { NestFactory } from '@nestjs/core';
import { ProducerApiModule } from './producer-api.module';

async function bootstrap() {
  const app = await NestFactory.create(ProducerApiModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
