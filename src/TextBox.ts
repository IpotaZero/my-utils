import { DigitalInput } from "@ipota/input"
import { LessThan } from "./Types"

export interface TalkConfig {
    name?: string
    /** 1文字あたりの表示に要するフレーム数（既定値: 2） */
    charInterval?: number

    canSkip?: boolean
}

export class TextBox {
    readonly box = document.createElement("div")
    private readonly name: HTMLElement
    private readonly text: HTMLElement
    private readonly option: HTMLElement

    constructor(private readonly input: DigitalInput.Reader<"ok" | "cancel" | "up" | "down" | "right" | "left">) {
        this.box.innerHTML = `
            <div class="name"></div>
            <div class="text"></div>
            <div class="option"></div>
        `
        this.name = this.box.querySelector(".name") as HTMLElement
        this.text = this.box.querySelector(".text") as HTMLElement
        this.option = this.box.querySelector(".option") as HTMLElement
        this.box.classList.add("hidden", "text-box")
    }

    hide() {
        this.box.classList.add("hidden")
    }

    *say(texts: readonly string[], config: TalkConfig = {}) {
        this.reset()
        this.box.classList.remove("hidden")

        for (const text of texts) {
            yield* this.saySingle(text, config)
            yield
        }

        this.box.classList.add("hidden")
    }

    ask<Length extends number>(options: readonly string[] & { length: Length }): Generator<void, LessThan<Length>, void>
    ask<Length extends number>(
        options: readonly string[] & { length: Length },
        { cancelable }: { cancelable: true },
    ): Generator<void, LessThan<Length> | undefined, void>
    *ask<Length extends number>(
        options: readonly string[] & { length: Length },
        { cancelable = false }: { cancelable?: boolean } = {},
    ): Generator<void, LessThan<Length> | undefined, void> {
        this.reset()
        this.box.classList.remove("hidden")
        this.option.innerHTML = options.map((option) => `<span>${option}</span>`).join("")

        let num: number | undefined = 0
        this.selectOption(num)

        while (1) {
            if (this.input.isPushed("ok")) {
                break
            } else if (cancelable && this.input.isPushed("cancel")) {
                num = undefined
                break
            } else if (this.input.isPushed("right")) {
                num += 1
                num %= options.length
                this.selectOption(num)
            } else if (this.input.isPushed("left")) {
                num += options.length - 1
                num %= options.length
                this.selectOption(num)
            }

            yield
        }

        this.box.classList.add("hidden")

        return num as LessThan<Length> | undefined
    }

    private reset() {
        this.box.classList.add("hidden")
        this.box.classList.remove("text-box--done")
        this.name.innerText = ""
        this.text.innerText = ""
        this.option.innerHTML = ""
    }

    private selectOption(num: number) {
        this.option.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"))
        this.option.querySelector(`:nth-child(${num + 1})`)?.classList.add("selected")
    }

    private *saySingle(text: string, { name = "", charInterval = 2, canSkip = true }: TalkConfig) {
        this.name.innerHTML = name
        this.text.innerHTML = ""

        this.box.classList.remove("text-box--done")
        this.box.classList.add("text-box--typing")

        yield* this.typeText(text, charInterval, canSkip)

        this.box.classList.remove("text-box--typing")
        this.box.classList.add("text-box--done")

        yield* this.wait()
    }

    /**
     * 1文字ずつ表示していく。ok入力で即時全文表示にスキップする。
     * HTMLタグ（<br>など）は分割せず1トークンとして丸ごと追加し、
     * 表示待ちフレームも消費しない（タグの途中が見えるのを防ぐ）。
     */
    private *typeText(text: string, interval: number, canSkip: boolean) {
        const tokens = text.match(/<[^>]+>|[\s\S]/g) ?? []
        let revealed = ""

        for (const token of tokens) {
            revealed += token
            this.text.innerHTML = revealed

            if (token.startsWith("<")) continue

            for (let f = 0; f < interval; f++) {
                yield

                if (
                    canSkip &&
                    (this.input.isRepeatPushed("ok", 500, 1000) || this.input.isRepeatPushed("cancel", 500, 1000))
                ) {
                    this.text.innerHTML = text
                    yield
                    return
                }
            }
        }
    }

    private *wait() {
        while (!(this.input.isRepeatPushed("ok", 500, 1000) || this.input.isRepeatPushed("cancel", 500, 1000))) yield
        yield
    }
}
