import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return { message: 'Hello from Chatnary', data: 'Hi' };
    // throw new Error('Not implemented');
  }
}
