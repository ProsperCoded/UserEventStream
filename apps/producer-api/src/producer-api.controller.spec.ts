import { Test, TestingModule } from '@nestjs/testing';
import { ProducerApiController } from './producer-api.controller';
import { ProducerApiService } from './producer-api.service';

describe('ProducerApiController', () => {
  let producerApiController: ProducerApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProducerApiController],
      providers: [ProducerApiService],
    }).compile();

    producerApiController = app.get<ProducerApiController>(ProducerApiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(producerApiController.getHello()).toBe('Hello World!');
    });
  });
});
