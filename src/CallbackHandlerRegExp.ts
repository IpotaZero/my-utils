import { RegExpDict } from "./RegExpDict"

/**
 * handlerの保持と実行。
 */
export class CallbackHandlerRegExp<Code extends string, Arg> {
    private readonly handlers = new RegExpDict<(arg: Arg) => Promise<boolean> | void>({})

    on(code: Code, handler: (arg: Arg) => void) {
        this.handlers.add(code, handler)
    }

    run(code: Code, arg: Arg) {
        return this.handlers
            .getAll(code)
            .map((handler) => handler(arg))
            .every(Boolean)
    }
}
