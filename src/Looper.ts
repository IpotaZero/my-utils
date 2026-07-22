export class Looper {
    private lastRunTime = 0
    private interval: number

    private handlers: (() => void)[] = []

    constructor(fps: number) {
        this.interval = 1000 / fps
    }

    setFPS(fps: number) {
        this.interval = 1000 / fps
    }

    start() {
        this.lastRunTime = performance.now()
        requestAnimationFrame(() => this.loop())
    }

    addHandler(handler: () => void) {
        this.handlers.push(handler)
    }

    private loop() {
        const currentTime = performance.now()

        const elapsed = currentTime - this.lastRunTime

        if (this.interval - 3 <= elapsed) {
            this.handlers.forEach((h) => h())
            this.lastRunTime = currentTime
        }

        requestAnimationFrame(() => this.loop())
    }
}
