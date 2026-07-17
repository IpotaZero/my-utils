import { RegExpDict } from "./RegExpDict";
/**
 * handlerの保持と実行。
 */
export class CallbackHandlerRegExp {
    handlers = new RegExpDict({});
    on(code, handler) {
        this.handlers.add(code, handler);
    }
    run(code, arg) {
        return this.handlers
            .getAll(code)
            .map((handler) => handler(arg))
            .every(Boolean);
    }
}
