export declare namespace GenUtils {
    /**
     * 複数のジェネレータを同時に進める
     *
     * 全ジェネレータが終了するまで yield し続ける。
     *
     * @example
     * yield* parallel([
     *     this.attackA(),
     *     this.attackB(),
     * ])
     */
    function parallel(gens: Generator[]): Generator<void, void, unknown>;
    /**
     * 複数のジェネレータを同時に進める。
     * いずれか1つが終了した時点で全体を終了し、
     * 最初に終了したジェネレータのインデックスを返す。
     *
     * @example
     * // タイムアウトつきの攻撃パターン
     * const winner = yield* race([
     *     this.attackPattern(),
     *     waitFrames(300),   // 300f経ったら強制終了
     * ])
     * if (winner === 1) {
     *     // タイムアウトで終了した場合の処理
     * }
     */
    function race(gens: Generator[]): Generator<void, number, unknown>;
    /**
     * n フレーム待つジェネレータ。
     * parallel / race と組み合わせて使うと便利。
     *
     * @example
     * yield* race(
     *     this.attackPattern(),
     *     waitFrames(240),
     * )
     */
    function waitFrames(n: number): Generator<void, void, unknown>;
    /**
     * ジェネレータを n 回繰り返す。
     *
     * @example
     * yield* repeat(3, () => this.attackPattern())
     */
    function repeat(n: number, gen: (index: number) => Iterable<void, void, unknown>): Generator<void, void, unknown>;
    /**
     * ジェネレータのリストを順番に実行する。
     * 配列で渡せるので、動的にパターンを組み立てるときに便利。
     *
     * @example
     * yield* sequence([
     *     this.phase1(),
     *     this.phase2(),
     *     this.phase3(),
     * ])
     */
    function sequence(gens: Generator<void, void, unknown>[]): Generator<void, void, unknown>;
    function waitForPromise<T>(promise: Promise<T>): Generator<void, T, void>;
}
