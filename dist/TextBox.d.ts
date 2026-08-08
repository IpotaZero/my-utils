import { DigitalInput } from "@ipota/input";
import { LessThan } from "./Types";
export interface TalkConfig {
    name?: string;
    /** 1文字あたりの表示に要するフレーム数（既定値: 2） */
    charInterval?: number;
    canSkip?: boolean;
}
export declare class TextBox {
    private readonly input;
    readonly box: HTMLDivElement;
    private readonly name;
    private readonly text;
    private readonly option;
    constructor(input: DigitalInput.Reader<"ok" | "cancel" | "up" | "down" | "right" | "left">);
    hide(): void;
    say(texts: readonly string[], config?: TalkConfig): Generator<undefined, void, unknown>;
    ask<Length extends number>(options: readonly string[] & {
        length: Length;
    }): Generator<void, LessThan<Length>, void>;
    ask<Length extends number>(options: readonly string[] & {
        length: Length;
    }, { cancelable }: {
        cancelable: true;
    }): Generator<void, LessThan<Length> | undefined, void>;
    private reset;
    private selectOption;
    private saySingle;
    /**
     * 1文字ずつ表示していく。ok入力で即時全文表示にスキップする。
     * HTMLタグ（<br>など）は分割せず1トークンとして丸ごと追加し、
     * 表示待ちフレームも消費しない（タグの途中が見えるのを防ぐ）。
     */
    private typeText;
    private wait;
}
