/**
 * handlerの保持と実行。
 */
export class CallbackHandler {
    handlers = {};
    on(code, handler) {
        this.handlers[code] = handler;
    }
    run(code, arg) {
        const handler = this.handlers[code];
        if (!handler)
            return true;
        return handler?.(arg);
    }
}
