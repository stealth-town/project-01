

export class DummyService {
    constructor() {
        console.log('DummyService initialized');
    }

    /**
     * Simulates fetching some data asynchronously
     */
    async getDummyData(): Promise<{ message: string; timestamp: string }> {
        // Simulate async operation
        await this.delay(100);

        return {
            message: 'This is dummy data',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Simulates processing a request with some input
     */
    async processDummyRequest(input: string): Promise<{
        processed: boolean;
        input: string;
        output: string
    }> {
        // Simulate async processing
        await this.delay(200);

        const output = input ? input.toUpperCase() : 'NO INPUT PROVIDED';

        return {
            processed: true,
            input: input || '',
            output
        };
    }

    /**
     * Helper method for simulating async delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}