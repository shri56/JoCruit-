declare class Database {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): Database;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionStatus(): boolean;
    ping(): Promise<boolean>;
    getStats(): any;
    createIndexes(): Promise<void>;
    seedInitialData(): Promise<void>;
}
declare const _default: Database;
export default _default;
