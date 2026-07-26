import { RegExpDict } from "./RegExpDict";
/**
 * handlerの保持と実行。
 */
export class CallbackHandlerRegExp {
    handlers = new RegExpDict({});
    on(code, handler) {
        this.handlers.add(code, handler);
    }
    async run(code, arg) {
        return (await Promise.all(this.handlers
            .getAll(code)
            .map((handler) => handler(arg))
            .toArray())).every(Boolean);
    }
}
