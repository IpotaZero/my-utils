export declare class Looper {
    private lastRunTime;
    private interval;
    private handlers;
    timeScale: number;
    constructor(fps: number);
    setFPS(fps: number): void;
    start(): void;
    addHandler(handler: (timeScale: number) => void): void;
    private loop;
}
