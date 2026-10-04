import { GenUtils } from "@ipota/functions";
// --- 3. TextBox クラス ---
export class TextBox {
    input;
    playSe;
    box = document.createElement("div");
    name;
    text;
    option;
    timer;
    // boxをクリック/タップした瞬間を、「ok」が1回押されたのと同じ扱いにするためのフラグ
    boxClickPending = false;
    constructor(input, playSe) {
        this.input = input;
        this.playSe = playSe;
        this.box.innerHTML = `
            <div class="name"></div>
            <div class="text"></div>
            <div class="option"></div>
            <div class="timer-bar"><div class="timer-fill"></div></div>
        `;
        this.name = this.box.querySelector(".name");
        this.text = this.box.querySelector(".text");
        this.option = this.box.querySelector(".option");
        this.timer = this.box.querySelector(".timer-fill");
        this.box.classList.add("hidden", "text-box");
        this.box.addEventListener("click", () => {
            this.boxClickPending = true;
        });
    }
    // 「ok」が押されたか(boxのクリック待ちも1回分の押下として合成する)
    isOkPushed() {
        if (this.input.isRepeatPushed("ok", 50, 500))
            return true;
        if (this.boxClickPending) {
            this.boxClickPending = false;
            return true;
        }
        return false;
    }
    dispose() {
        this.box.remove();
    }
    // テキスト表示中かどうか(自爆操作の抑制などに使う)
    get isShowing() {
        return !this.box.classList.contains("hidden");
    }
    hide() {
        this.box.classList.add("hidden");
    }
    *say(texts, config = {}) {
        this.reset();
        this.show();
        for (const text of texts) {
            yield* this.saySingle(text, config);
            yield;
        }
        this.box.classList.add("hidden");
        yield;
    }
    /**
     * 選択肢を表示して入力を待つ
     */
    *ask(options, { cancelable = false, title, timeoutFrame } = {}) {
        this.reset();
        this.show();
        // タイトルが指定されていればテキスト領域にセット
        if (title) {
            this.text.innerHTML = title;
        }
        this.option.innerHTML = options.map((opt) => `<span>${opt}</span>`).join("");
        // 1. 競争させるジェネレータのオブジェクトを作成
        const tasks = {
            selection: this.waitSelection(options),
            cancel: cancelable ? this.waitCancel() : this.never(),
            timeout: timeoutFrame ? this.waitTimer(timeoutFrame) : this.never(),
        };
        // 2. GenUtils.race で最初に完了した方の結果を取得
        const result = yield* GenUtils.race(tasks);
        this.box.classList.add("hidden");
        if (result.key === "selection") {
            return result.value;
        }
        else if (result.key === "cancel") {
            return { type: "cancel" };
        }
        else if (result.key === "timeout") {
            return { type: "timeout" };
        }
        throw new Error();
    }
    *never() {
        while (true)
            yield;
    }
    /**
     * ユーザーのキー選択入力を待つジェネレータ
     */
    *waitSelection(options) {
        let index = 0;
        this.selectOption(index);
        yield;
        while (true) {
            if (this.isOkPushed()) {
                this.playSe();
                return { type: "select", index: index };
            }
            if (this.input.isPushed("right")) {
                this.playSe();
                index = (index + 1) % options.length;
                this.selectOption(index);
            }
            else if (this.input.isPushed("left")) {
                this.playSe();
                index = (index + options.length - 1) % options.length;
                this.selectOption(index);
            }
            yield;
        }
    }
    *waitCancel() {
        while (!this.input.isPushed("cancel"))
            yield;
        yield;
        return { type: "cancel" };
    }
    /**
     * タイムアウトゲージを描画しながら時間をカウントするジェネレータ
     */
    *waitTimer(frames) {
        const timerBar = this.box.querySelector(".timer-bar");
        if (timerBar)
            timerBar.classList.remove("hidden");
        for (let f = 0; f < frames; f++) {
            const ratio = (frames - f) / frames;
            this.timer.style.width = `${ratio * 100}%`;
            yield;
        }
        this.playSe();
        return { type: "timeout" };
    }
    reset() {
        this.box.classList.add("hidden");
        this.box.classList.remove("text-box--done");
        this.name.innerText = "";
        this.name.classList.add("hidden");
        this.text.innerText = "";
        this.option.innerHTML = "";
        this.timer.style.width = "100%";
        const timerBar = this.box.querySelector(".timer-bar");
        if (timerBar)
            timerBar.classList.add("hidden");
    }
    selectOption(num) {
        this.option.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));
        this.option.querySelector(`:nth-child(${num + 1})`)?.classList.add("selected");
    }
    *saySingle(text, { name = "", charInterval = 2, canSkip = true }) {
        this.name.innerHTML = name;
        this.name.classList.toggle("hidden", name === "");
        this.text.innerHTML = "";
        this.box.classList.remove("text-box--done");
        this.box.classList.add("text-box--typing");
        yield* this.typeText(text, charInterval, canSkip);
        this.box.classList.remove("text-box--typing");
        this.box.classList.add("text-box--done");
        yield* this.wait();
    }
    *typeText(text, interval, canSkip) {
        const tokens = text.match(/<[^>]+>|[\s\S]/g) ?? [];
        let revealed = "";
        for (const token of tokens) {
            revealed += token;
            this.text.innerHTML = revealed;
            if (token.startsWith("<"))
                continue;
            if (token.trim() !== "") {
                this.playSe();
            }
            for (let f = 0; f < interval; f++) {
                yield;
                if (canSkip && (this.isOkPushed() || this.input.isPushed("cancel"))) {
                    this.text.innerHTML = text;
                    yield;
                    return;
                }
            }
        }
    }
    *wait() {
        while (!(this.isOkPushed() || this.input.isPushed("cancel")))
            yield;
        yield;
    }
    /**
     * テキストボックスを表示し、fadeIn アニメーションを再発火させる
     */
    show() {
        this.box.classList.remove("hidden");
        // CSS アニメーションを一度リセットして強制リフロー（再描画）を起こす
        this.box.style.animation = "none";
        void this.box.offsetWidth; // 強制リフロー
        this.box.style.animation = "";
    }
}
