import { DigitalInput } from "@ipota/input";
type Handler = (command: Command) => void;
export declare class Command {
    private readonly input;
    readonly container: HTMLDivElement;
    private index;
    private currentBranch;
    private history;
    private buttonFamily;
    private ch;
    constructor(html: string, input: DigitalInput.Reader<"ok" | "cancel" | "up" | "down">);
    getElement<C extends typeof HTMLElement>(query: string, cls: C): InstanceType<C>;
    getIndex(): number;
    update(): void;
    on(id: string, handler: Handler): void;
    onLeft(id: string, handler: Handler): void;
    onBack(handler: Handler): void;
    back(depth?: number): void;
    private initButtonFamily;
    private getCurrentButtons;
    private move;
    private _back;
    private select;
    private goto;
    private updateClass;
}
export {};
