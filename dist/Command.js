import { CallbackHandlerRegExp } from ".";
export class Command {
    input;
    container = document.createElement("div");
    index = 0;
    currentBranch = "unused-id";
    history = [];
    buttonFamily = {};
    ch = new CallbackHandlerRegExp();
    constructor(html, input) {
        this.input = input;
        this.container.className = "command hidden";
        this.container.innerHTML = html;
        this.initButtonFamily();
        this.goto("first");
        requestAnimationFrame(() => {
            this.container.classList.remove("hidden");
        });
    }
    getElement(query, cls) {
        const e = this.container.querySelector(query);
        if (!e) {
            throw new Error("");
        }
        if (!(e instanceof cls)) {
            throw new Error("");
        }
        return e;
    }
    getIndex() {
        return this.index;
    }
    update() {
        this.move();
        if (this.input.isPushed("cancel")) {
            this._back();
        }
        else if (this.input.isPushed("ok")) {
            this.select();
        }
    }
    on(id, handler) {
        this.ch.on(`on-enter-${id}`, handler);
    }
    onLeft(id, handler) {
        this.ch.on(`on-left-${id}`, handler);
    }
    onBack(handler) {
        this.ch.on("on-back", handler);
    }
    back(depth = 1) {
        for (let i = 0; i < depth; i++) {
            this._back();
        }
    }
    // --- Private Methods ---
    initButtonFamily() {
        this.container.querySelectorAll(".buttons").forEach((buttons) => {
            this.buttonFamily[buttons.id] = Array.from(buttons.querySelectorAll("button"));
        });
    }
    getCurrentButtons() {
        return this.buttonFamily[this.currentBranch];
    }
    move() {
        const currentButtons = this.getCurrentButtons();
        if (!currentButtons)
            return;
        if (this.input.isPushed("up")) {
            this.index = (this.index + currentButtons.length - 1) % currentButtons.length;
            this.updateClass();
        }
        else if (this.input.isPushed("down")) {
            this.index = (this.index + 1) % currentButtons.length;
            this.updateClass();
        }
    }
    _back() {
        if (this.history.length === 1) {
            this.ch.run("on-back", this);
            return;
        }
        if (this.history.length === 0)
            throw new Error("空");
        this.history.pop();
        const prevId = this.history.pop();
        const buttons = this.buttonFamily[prevId];
        const index = Math.max(buttons.findIndex((b) => b.dataset["link"] === this.currentBranch), 0);
        this.goto(prevId);
        this.index = index;
        this.updateClass();
    }
    select() {
        const currentButtons = this.getCurrentButtons();
        if (!currentButtons)
            return;
        if (currentButtons[this.index].disabled)
            return;
        const link = currentButtons[this.index]?.dataset["link"];
        if (link) {
            this.goto(link);
        }
    }
    goto(id) {
        this.ch.run(`on-left-${this.currentBranch}`, this);
        this.currentBranch = id;
        this.ch.run(`on-enter-${this.currentBranch}`, this);
        if (this.buttonFamily[id]) {
            this.index = 0;
            this.history.push(id);
            this.updateClass();
        }
    }
    updateClass() {
        const currentButtons = this.getCurrentButtons();
        if (!currentButtons)
            return;
        this.container.querySelectorAll("button").forEach((b, i) => {
            b.classList.remove("selected");
        });
        currentButtons[this.index]?.classList.add("selected");
    }
}
