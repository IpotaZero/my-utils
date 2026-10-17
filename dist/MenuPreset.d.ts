import type { Menu, MenuOptionBox, MenuSoundPattern } from "./Menu";
export declare namespace MenuPreset {
    const buildConfirmBox: (menu: Menu, onConfirm: () => void, { title, elementId, confirmSound, confirmLabel, }?: {
        title?: string;
        elementId?: string;
        confirmSound?: MenuSoundPattern;
        confirmLabel?: string;
    }) => MenuOptionBox;
}
