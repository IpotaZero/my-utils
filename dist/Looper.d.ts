export declare class Looper {
    private lastRunTime;
    private interval;
    private handlers;
    private renderHandlers;
    timeScale: number;
    /**
     * 1回のrAFで追いつくhandler呼び出しの最大回数。
     * タブのバックグラウンド化・省電力モードなどで極端にelapsedが伸びた場合に、
     * handlerを延々と連続実行してしまう(スパイラルオブデス)のを防ぐための上限。
     */
    private readonly maxCatchUpSteps;
    constructor(fps: number);
    setFPS(fps: number): void;
    start(): void;
    /**
     * 描画以外の更新処理を登録する。
     * ディスプレイのリフレッシュレートに関わらず、固定fps相当のペースで実行される
     * (rAFの間隔が長い場合、帳尻を合わせるため1回のrAFで複数回呼ばれることがある)。
     */
    addHandler(handler: (timeScale: number) => void): void;
    /**
     * 描画処理を登録する。ロジック(addHandler)とは異なり、rAFが呼ばれるたびに必ず1回だけ実行される。
     * ディスプレイのリフレッシュレートが低下してロジックの実行回数が変わっても、描画が余分に走ることはない。
     */
    addRenderHandler(handler: () => void): void;
    private loop;
}
