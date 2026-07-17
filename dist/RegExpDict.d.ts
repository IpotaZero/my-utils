export declare class RegExpDict<T, S extends string = string> {
    private readonly dict;
    private readonly regExpCache;
    constructor(dict: Record<S, T>);
    get(key: string): T | undefined;
    getAll(key: string): Generator<T, void, void>;
    getKeys(): S[];
    getValues(): T[];
    add(reg: S, value: T): void;
    private getRegExp;
}
