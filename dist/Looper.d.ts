export declare class Looper {
    private lastRunTime;
    private interval;
    private handlers;
    constructor(fps: number);
    setFPS(fps: number): void;
    start(): void;
    addHandler(handler: () => void): void;
    private loop;
}
