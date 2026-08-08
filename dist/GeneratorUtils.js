export var GenUtils;
(function (GenUtils) {
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
    function* parallel(gens) {
        while (true) {
            const results = gens.map((g) => g.next());
            if (results.every((r) => r.done))
                break;
            yield;
        }
    }
    GenUtils.parallel = parallel;
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
    function* race(gens) {
        while (true) {
            const results = gens.map((g) => g.next());
            const doneIndex = results.findIndex((r) => r.done);
            if (doneIndex !== -1)
                return doneIndex;
            yield;
        }
    }
    GenUtils.race = race;
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
    function* waitFrames(n) {
        yield* Array(n);
    }
    GenUtils.waitFrames = waitFrames;
    /**
     * ジェネレータを n 回繰り返す。
     *
     * @example
     * yield* repeat(3, () => this.attackPattern())
     */
    function* repeat(n, gen) {
        for (let i = 0; i < n; i++) {
            yield* gen(i);
        }
    }
    GenUtils.repeat = repeat;
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
    function* sequence(gens) {
        for (const gen of gens) {
            yield* gen;
        }
    }
    GenUtils.sequence = sequence;
})(GenUtils || (GenUtils = {}));
