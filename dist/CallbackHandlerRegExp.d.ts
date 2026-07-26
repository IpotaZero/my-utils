/**
 * handlerの保持と実行。
 */
export declare class CallbackHandlerRegExp<Code extends string, Arg> {
    private readonly handlers;
    on(code: Code, handler: (arg: Arg) => Promise<boolean> | void): void;
    run(code: Code, arg: Arg): Promise<boolean>;
}
