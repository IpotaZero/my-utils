export namespace GenUtils {
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
    export function* parallel(gens: Generator[]): Generator<void, void, unknown> {
        while (true) {
            const results = gens.map((g) => g.next())
            if (results.every((r) => r.done)) break
            yield
        }
    }

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
    export function* race(gens: Generator[]): Generator<void, number, unknown> {
        while (true) {
            const results = gens.map((g) => g.next())
            const doneIndex = results.findIndex((r) => r.done)
            if (doneIndex !== -1) return doneIndex
            yield
        }
    }

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
    export function* waitFrames(n: number): Generator<void, void, unknown> {
        yield* Array(n)
    }

    /**
     * ジェネレータを n 回繰り返す。
     *
     * @example
     * yield* repeat(3, () => this.attackPattern())
     */
    export function* repeat(
        n: number,
        gen: (index: number) => Iterable<void, void, unknown>,
    ): Generator<void, void, unknown> {
        for (let i = 0; i < n; i++) {
            yield* gen(i)
        }
    }

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
    export function* sequence(gens: Generator<void, void, unknown>[]): Generator<void, void, unknown> {
        for (const gen of gens) {
            yield* gen
        }
    }

    export function* waitForPromise<T>(promise: Promise<T>): Generator<void, T, void> {
        let state: { ok: true; value: T } | { ok: false; error: unknown } | undefined

        promise.then(
            (value) => {
                state = { ok: true, value }
            },
            (error) => {
                state = { ok: false, error }
            },
        )

        while (state === undefined) yield

        if (!state.ok) throw state.error
        return state.value
    }
}
