export class TextBox {
    input;
    box = document.createElement("div");
    name;
    text;
    option;
    constructor(input) {
        this.input = input;
        this.box.innerHTML = `
            <div class="name"></div>
            <div class="text"></div>
            <div class="option"></div>
        `;
        this.name = this.box.querySelector(".name");
        this.text = this.box.querySelector(".text");
        this.option = this.box.querySelector(".option");
        this.box.classList.add("hidden", "text-box");
    }
    hide() {
        this.box.classList.add("hidden");
    }
    *say(texts, config = {}) {
        this.reset();
        this.box.classList.remove("hidden");
        for (const text of texts) {
            yield* this.saySingle(text, config);
            yield;
        }
        this.box.classList.add("hidden");
    }
    *ask(options, { cancelable = false } = {}) {
        this.reset();
        this.box.classList.remove("hidden");
        this.option.innerHTML = options.map((option) => `<span>${option}</span>`).join("");
        let num = 0;
        this.selectOption(num);
        while (1) {
            if (this.input.isPushed("ok")) {
                break;
            }
            else if (cancelable && this.input.isPushed("cancel")) {
                num = undefined;
                break;
            }
            else if (this.input.isPushed("right")) {
                num += 1;
                num %= options.length;
                this.selectOption(num);
            }
            else if (this.input.isPushed("left")) {
                num += options.length - 1;
                num %= options.length;
                this.selectOption(num);
            }
            yield;
        }
        this.box.classList.add("hidden");
        return num;
    }
    reset() {
        this.box.classList.add("hidden");
        this.box.classList.remove("text-box--done");
        this.name.innerText = "";
        this.text.innerText = "";
        this.option.innerHTML = "";
    }
    selectOption(num) {
        this.option.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));
        this.option.querySelector(`:nth-child(${num + 1})`)?.classList.add("selected");
    }
    *saySingle(text, { name = "", charInterval = 2, canSkip = true }) {
        this.name.innerHTML = name;
        this.text.innerHTML = "";
        this.box.classList.remove("text-box--done");
        this.box.classList.add("text-box--typing");
        yield* this.typeText(text, charInterval, canSkip);
        this.box.classList.remove("text-box--typing");
        this.box.classList.add("text-box--done");
        yield* this.wait();
    }
    /**
     * 1文字ずつ表示していく。ok入力で即時全文表示にスキップする。
     * HTMLタグ（<br>など）は分割せず1トークンとして丸ごと追加し、
     * 表示待ちフレームも消費しない（タグの途中が見えるのを防ぐ）。
     */
    *typeText(text, interval, canSkip) {
        const tokens = text.match(/<[^>]+>|[\s\S]/g) ?? [];
        let revealed = "";
        for (const token of tokens) {
            revealed += token;
            this.text.innerHTML = revealed;
            if (token.startsWith("<"))
                continue;
            for (let f = 0; f < interval; f++) {
                yield;
                if (canSkip &&
                    (this.input.isRepeatPushed("ok", 500, 1000) || this.input.isRepeatPushed("cancel", 500, 1000))) {
                    this.text.innerHTML = text;
                    yield;
                    return;
                }
            }
        }
    }
    *wait() {
        while (!(this.input.isRepeatPushed("ok", 500, 1000) || this.input.isRepeatPushed("cancel", 500, 1000)))
            yield;
        yield;
    }
}
