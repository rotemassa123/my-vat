import { Injectable } from '@nestjs/common';
import { Connection, ClientSession } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class TransactionsProvider {
    constructor(@InjectConnection() private readonly connection: Connection) {}

    async executeTransaction<T>(operation: (session: ClientSession) => Promise<T>): Promise<T> {
        const session: ClientSession = await this.connection.startSession();
        session.startTransaction();

        try {
            const result = await operation(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
