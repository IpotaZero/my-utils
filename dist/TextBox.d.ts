import type { DigitalInput } from "@ipota/input";
import type { LessThan } from "@ipota/my-utils";
export interface TalkConfig {
    name?: string;
    /** 1文字あたりの表示に要するフレーム数（既定値: 2） */
    charInterval?: number;
    canSkip?: boolean;
}
export type AskSelectResult<Length extends number> = {
    type: "select";
    index: LessThan<Length>;
};
export type AskCancelResult = {
    type: "cancel";
};
export type AskTimeoutResult = {
    type: "timeout";
};
export interface AskOptions {
    /** 質問タイトル・メッセージ（例: "ほんとに？"） */
    title?: string;
    /** キャンセル操作 (cancelキー) を許可するか */
    cancelable?: boolean;
    /** タイムアウトまでのフレーム数 (未指定の場合は無制限) */
    timeoutFrame?: number;
}
export type AskResult<Length extends number, O extends AskOptions> = AskSelectResult<Length> | (O["cancelable"] extends true ? AskCancelResult : never) | (O["timeoutFrame"] extends number ? AskTimeoutResult : never);
export declare class TextBox {
    private readonly input;
    private readonly playSe;
    readonly box: HTMLDivElement;
    private readonly name;
    private readonly text;
    private readonly option;
    private readonly timer;
    private boxClickPending;
    constructor(input: DigitalInput.Reader<"ok" | "cancel" | "up" | "down" | "right" | "left">, playSe: () => void);
    private isOkPushed;
    dispose(): void;
    get isShowing(): boolean;
    hide(): void;
    say(texts: readonly string[], config?: TalkConfig): Generator<undefined, void, unknown>;
    /**
     * 選択肢を表示して入力を待つ
     */
    ask<Length extends number, O extends AskOptions = AskOptions>(options: readonly string[] & {
        length: Length;
    }, { cancelable, title, timeoutFrame }?: O): Generator<void, AskResult<Length, O>, void>;
    private never;
    /**
     * ユーザーのキー選択入力を待つジェネレータ
     */
    private waitSelection;
    private waitCancel;
    /**
     * タイムアウトゲージを描画しながら時間をカウントするジェネレータ
     */
    private waitTimer;
    private reset;
    private selectOption;
    private saySingle;
    private typeText;
    private wait;
    /**
     * テキストボックスを表示し、fadeIn アニメーションを再発火させる
     */
    private show;
}
