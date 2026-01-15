import { Controller, Query, Sse, Post, Body, Get } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';

@Controller('notifications')
export class NotificationController {
    constructor(private eventEmitter: EventEmitter2) { }

    @Sse('sse')
    sse(@Query('userId') userId: string): Observable<MessageEvent> {
        return fromEvent(this.eventEmitter, 'system.notification').pipe(
            // filter event by userId
            filter((event: any) => event.userId === userId),

            // mapping to SSE format
            map((event: any) => {
                const { type, userId, ...payload } = event;
                return {
                    data: JSON.stringify({
                        type,
                        payload,
                        timestamp: new Date().toISOString()
                    })
                } as MessageEvent
            })
        );
    }

    @Public()
    @Post('test-emit')
    testEmit(@Body() body: { userId: string; type: string; status: string; message: string }) {
        const { userId, type, status, message } = body;

        this.eventEmitter.emit('system.notification', {
            type: type || 'DOCUMENT_PROCESSED',
            userId: userId || 'test-user-001',
            fileId: `test-file-${Date.now()}`,
            projectId: 'test-project-001',
            status: status || 'DONE',
            message: message || 'Test notification',
        });

        return {
            success: true,
            message: 'Test notification emitted',
            data: { userId, type, status }
        };
    }
}
