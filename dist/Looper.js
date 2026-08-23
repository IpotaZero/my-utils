export class Looper {
    lastRunTime = 0;
    interval;
    handlers = [];
    renderHandlers = [];
    timeScale = 1;
    /**
     * 1回のrAFで追いつくhandler呼び出しの最大回数。
     * タブのバックグラウンド化・省電力モードなどで極端にelapsedが伸びた場合に、
     * handlerを延々と連続実行してしまう(スパイラルオブデス)のを防ぐための上限。
     */
    maxCatchUpSteps = 5;
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
    /**
     * 描画以外の更新処理を登録する。
     * ディスプレイのリフレッシュレートに関わらず、固定fps相当のペースで実行される
     * (rAFの間隔が長い場合、帳尻を合わせるため1回のrAFで複数回呼ばれることがある)。
     */
    addHandler(handler) {
        this.handlers.push(handler);
    }
    /**
     * 描画処理を登録する。ロジック(addHandler)とは異なり、rAFが呼ばれるたびに必ず1回だけ実行される。
     * ディスプレイのリフレッシュレートが低下してロジックの実行回数が変わっても、描画が余分に走ることはない。
     */
    addRenderHandler(handler) {
        this.renderHandlers.push(handler);
    }
    loop() {
        const currentTime = performance.now();
        let elapsed = currentTime - this.lastRunTime;
        let steps = 0;
        while (this.interval - 3 <= elapsed && steps < this.maxCatchUpSteps) {
            this.handlers.forEach((h) => h(this.timeScale));
            this.lastRunTime += this.interval;
            elapsed -= this.interval;
            steps++;
        }
        // 追いつききれないほど遅延していた場合は諦めて基準時刻をリセットする
        if (steps === this.maxCatchUpSteps) {
            this.lastRunTime = currentTime;
        }
        this.renderHandlers.forEach((h) => h());
        requestAnimationFrame(() => this.loop());
    }
}
