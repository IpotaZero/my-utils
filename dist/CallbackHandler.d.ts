/**
 * handlerの保持と実行。
 */
export declare class CallbackHandler<Code extends string, Arg> {
    private readonly handlers;
    on(code: Code, handler: (arg: Arg) => void): void;
    run(code: Code, arg: Arg): true | void | Promise<boolean>;
}
