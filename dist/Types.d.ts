export type LessThan<N extends number, Acc extends unknown[] = []> = Acc["length"] extends N ? never : Acc["length"] | LessThan<N, [...Acc, unknown]>;
export type NumberKeys<O> = TypedKeys<number, O>;
export type TypedKeys<T, O> = {
    [K in keyof O]: O[K] extends T ? K : never;
}[keyof O];
