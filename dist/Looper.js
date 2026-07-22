export class Looper {
    lastRunTime = 0;
    interval;
    handlers = [];
    timeScale = 1;
    constructor(fps) {
        this.interval = 1000 / fps;
    }
    setFPS(fps) {
        this.interval = 1000 / fps;
    }
    start() {
        this.lastRunTime = performance.now();
        requestAnimationFrame(() => this.loop());
    }
    addHandler(handler) {
        this.handlers.push(handler);
    }
    loop() {
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastRunTime;
        if (this.interval - 3 <= elapsed) {
            this.handlers.forEach((h) => h((elapsed / this.interval) * this.timeScale));
            this.lastRunTime = currentTime;
        }
        requestAnimationFrame(() => this.loop());
    }
}
