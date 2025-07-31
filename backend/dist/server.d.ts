declare class Server {
    private app;
    private port;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    start(): Promise<void>;
    private gracefulShutdown;
}
declare const server: Server;
export default server;
