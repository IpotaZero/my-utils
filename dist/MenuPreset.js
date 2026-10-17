export var MenuPreset;
(function (MenuPreset) {
    MenuPreset.buildConfirmBox = (menu, onConfirm, { title = "ほんとに?", elementId = "yes-no", confirmSound, confirmLabel = "はい", } = {}) => ({
        elementId,
        title,
        options: () => [
            [
                {
                    type: "select",
                    label: confirmLabel,
                    sound: confirmSound,
                    onSelect: () => {
                        onConfirm();
                    },
                },
            ],
            [
                {
                    type: "select",
                    label: "いいえ",
                    sound: "cancel",
                    onSelect: () => {
                        menu.back(1);
                    },
                },
            ],
        ],
    });
})(MenuPreset || (MenuPreset = {}));
