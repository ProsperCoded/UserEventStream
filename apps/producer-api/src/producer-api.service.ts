import { Injectable } from '@nestjs/common';

@Injectable()
export class ProducerApiService {
  getHello(): string {
    return 'Hello World!';
  }
}
