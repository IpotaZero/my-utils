import type { DigitalInput } from "@ipota/input";
export type MenuSoundPattern = "ok" | "cancel" | "none";
type BaseMenuOption = {
    label: string | HTMLElement;
    /** カーソルがこの選択肢に乗った時に発火 */
    onFocus?: () => void;
    /** この選択肢が有効か。毎フレーム呼ばれる */
    disabled?: () => boolean;
    /** この選択肢を選択した時に鳴らす音。省略時はokを鳴らす */
    sound?: MenuSoundPattern;
};
type MenuOption_Select = BaseMenuOption & {
    type: "select";
    /** この選択肢を選択した時に発火 */
    onSelect: () => void;
};
type MenuOption_Submenu = BaseMenuOption & {
    type: "submenu";
    /** この選択肢を選択した時に隠す要素のid */
    hides: string[];
    /** この選択肢を選択した時に表示する要素のid。本当にこれを使わないと絶対に実装できないって場合以外は使ってはいけない。 */
    shows?: string[];
    /** この選択肢を選択した時に開くサブメニュー */
    subMenu: () => MenuOptionBox;
};
export type MenuOption = MenuOption_Select | MenuOption_Submenu;
export type MenuOptionBox = {
    elementId: string;
    options: () => MenuOption[][];
    title?: string;
    maxVisibleRows?: number;
    initialCursor?: () => MenuCursor;
};
/**Menuで使うアクション（DigitalInput用） */
export type ActionMenu = "ok" | "cancel" | "up" | "down" | "left" | "right";
/** 現在選択中の位置。row=何行目、col=行の中の何列目 */
export type MenuCursor = {
    row: number;
    col: number;
};
type MenuInput = DigitalInput.Reader<ActionMenu>;
export declare class Menu {
    private readonly root;
    private readonly input;
    private readonly se;
    readonly container: HTMLDivElement;
    private cursor;
    private history;
    private layerStack;
    private hidesStack;
    private showsStack;
    private optionElements;
    private scrollRows;
    private tapStart;
    onBack: () => void;
    constructor(baseHtml: string, root: MenuOptionBox, input: MenuInput, se: Readonly<{
        playCursor: () => void;
        playOk: () => void;
        playCancel: () => void;
        playDisable: () => void;
    }>);
    update(): void;
    private findOptionCell;
    private findScrollDiff;
    private activate;
    private handleContainerClick;
    private handleContainerHover;
    private findOptionCellAtTouch;
    private hoverTouch;
    private handleContainerTouchStart;
    private handleContainerTouchMove;
    private handleContainerTouchEnd;
    private moveCursorTo;
    private playSound;
    private select;
    private updateDisabledClasses;
    private updateSelectedClass;
    private getCurrentLayer;
    private getCurrentOption;
    private getElement;
    private applyVisibility;
    private hideNow;
    private fadeOut;
    private fadeIn;
    private isCursorValid;
    private correctCursor;
    moveRow(diff: number): boolean;
    private moveToRow;
    private scrollBy;
    moveCol(diff: number): boolean;
    private clampCol;
    backToRoot(): void;
    isRoot(): boolean;
    pushSubMenu(subMenu: MenuOptionBox, { hides, shows }?: {
        hides?: string[];
        shows?: string[];
    }): void;
    back(depth: number): void;
    render(first?: boolean): void;
    /**
     * menuStack（操作対象）に積まない、プレビュー表示用などの静的なMenuOptionBoxを描画する。
     * カーソル移動や選択操作の内部状態は更新・汚染しない。
     */
    renderPreviewBox(box: MenuOptionBox): void;
    private renderMenuLayer;
    private updateScrollContainer;
}
export {};
