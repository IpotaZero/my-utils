// レイヤーの表示/非表示切り替えにかけるフェード時間(ms)
const TRANSITION_MS = 100;
// 触れてから離すまでにこの距離(px)以上動いたら、タップではなくなぞり(ホバー)とみなす
const TAP_TOLERANCE_PX = 10;
export class Menu {
    root;
    input;
    se;
    container = document.createElement("div");
    cursor = { row: 0, col: 0 };
    // カーソルのスタック
    history = [];
    // MenuOptionBoxと、評価済みのoptionsをセットで保持する
    layerStack;
    hidesStack = [];
    showsStack = [];
    optionElements = [];
    scrollRows = [];
    // 触れ始めの位置。指が動きすぎた(=タップではなくホバー目的のなぞり)場合や複数指の場合はundefined
    tapStart;
    onBack = () => { };
    constructor(baseHtml, root, input, se) {
        this.root = root;
        this.input = input;
        this.se = se;
        this.container.className = "menu";
        this.container.innerHTML = baseHtml;
        this.container.addEventListener("click", (e) => this.handleContainerClick(e));
        this.container.addEventListener("mouseover", (e) => this.handleContainerHover(e));
        // タッチではmouseoverが指の移動に追従して発火しないので、touchイベントでホバー相当(指が乗っている選択肢へのカーソル移動)を扱う
        this.container.addEventListener("touchstart", (e) => this.handleContainerTouchStart(e), { passive: true });
        this.container.addEventListener("touchmove", (e) => this.handleContainerTouchMove(e), { passive: true });
        this.container.addEventListener("touchend", (e) => this.handleContainerTouchEnd(e), { passive: false });
        this.container.addEventListener("touchcancel", () => (this.tapStart = undefined), { passive: true });
        // 初期状態ではoptionsは空配列。直後のrender(true)で評価される
        this.layerStack = [{ box: this.root, options: [] }];
        this.cursor = root.initialCursor?.() ?? { row: 0, col: 0 };
        this.render(true);
    }
    update() {
        if (this.input.isRepeatPushed("up", 50, 500)) {
            if (this.moveRow(-1))
                this.se.playCursor();
        }
        else if (this.input.isRepeatPushed("down", 50, 500)) {
            if (this.moveRow(1))
                this.se.playCursor();
        }
        else if (this.input.isRepeatPushed("left", 50, 500)) {
            if (this.moveCol(-1))
                this.se.playCursor();
        }
        else if (this.input.isRepeatPushed("right", 50, 500)) {
            if (this.moveCol(1))
                this.se.playCursor();
        }
        else if (this.input.isPushed("ok")) {
            this.select();
        }
        else if (this.input.isPushed("cancel")) {
            this.se.playCancel();
            this.back(1);
        }
        this.updateDisabledClasses();
    }
    // タップ/ホバー操作用。containerに1つだけ張ったリスナーからイベント委譲で呼ばれる
    findOptionCell(target) {
        const optionEl = target?.closest(".option");
        if (!optionEl)
            return undefined;
        for (let r = 0; r < this.optionElements.length; r++) {
            const c = this.optionElements[r]?.indexOf(optionEl) ?? -1;
            if (c !== -1)
                return { row: r, col: c };
        }
        return undefined;
    }
    // 現在のレイヤーのスクロールインジケーターなら、上(-1)か下(1)を返す
    findScrollDiff(target) {
        const indicatorEl = target?.closest(".menu-scroll-indicator");
        if (!indicatorEl)
            return undefined;
        if (indicatorEl === this.scrollRows[0])
            return -1;
        if (indicatorEl === this.scrollRows.at(-1))
            return 1;
        return undefined;
    }
    // 選択肢なら選択、スクロールインジケーターなら1行スクロールする
    activate(target) {
        const cell = this.findOptionCell(target);
        if (cell) {
            this.moveCursorTo(cell.row, cell.col);
            this.select();
            return;
        }
        const scrollDiff = this.findScrollDiff(target);
        if (scrollDiff && this.scrollBy(scrollDiff))
            this.se.playCursor();
    }
    handleContainerClick(e) {
        this.activate(e.target);
    }
    handleContainerHover(e) {
        const cell = this.findOptionCell(e.target);
        if (!cell)
            return;
        this.moveCursorTo(cell.row, cell.col);
    }
    // touchイベントのtargetは触れ始めた要素に固定されるので、指の現在位置から選択肢を引き直す
    findOptionCellAtTouch(touch) {
        if (!touch)
            return undefined;
        return this.findOptionCell(document.elementFromPoint(touch.clientX, touch.clientY));
    }
    hoverTouch(touch) {
        const cell = this.findOptionCellAtTouch(touch);
        if (!cell)
            return;
        this.moveCursorTo(cell.row, cell.col);
    }
    handleContainerTouchStart(e) {
        const touch = e.touches[0];
        this.tapStart = e.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : undefined;
        this.hoverTouch(touch);
    }
    handleContainerTouchMove(e) {
        const touch = e.touches[0];
        if (this.tapStart && touch) {
            const moved = Math.hypot(touch.clientX - this.tapStart.x, touch.clientY - this.tapStart.y);
            if (moved > TAP_TOLERANCE_PX)
                this.tapStart = undefined;
        }
        this.hoverTouch(touch);
    }
    // ほとんど動かさずに離した(タップ)場合のみ、指の位置にある選択肢の選択やインジケーターのスクロールを行う。
    // touchendをpreventDefaultするので、この後に疑似clickは発火しない
    handleContainerTouchEnd(e) {
        e.preventDefault();
        const isTap = this.tapStart !== undefined;
        this.tapStart = undefined;
        const touch = e.changedTouches[0];
        if (!isTap || !touch)
            return;
        this.activate(document.elementFromPoint(touch.clientX, touch.clientY));
    }
    // 既にカーソルが乗っている場合は何もしない(選択枠再描画やonFocus再発火を防ぐ)
    moveCursorTo(row, col) {
        if (this.cursor.row === row && this.cursor.col === col)
            return;
        this.cursor = { row, col };
        this.updateSelectedClass();
        this.getCurrentOption()?.onFocus?.();
    }
    playSound(sound) {
        switch (sound) {
            case "cancel":
                this.se.playCancel();
                break;
            case "none":
                break;
            default:
                this.se.playOk();
        }
    }
    select() {
        const option = this.getCurrentOption();
        if (!option || option.disabled?.()) {
            this.se.playDisable();
            return;
        }
        this.playSound(option.sound);
        if (option.type === "select") {
            option.onSelect();
            return;
        }
        this.pushSubMenu(option.subMenu(), { hides: option.hides, shows: option.shows });
    }
    updateDisabledClasses() {
        // 関数呼び出しではなく、固定化されたoptions配列を参照する
        this.getCurrentLayer().options.forEach((row, r) => {
            row.forEach((option, c) => {
                this.optionElements[r]?.[c]?.classList.toggle("disabled", option.disabled?.() ?? false);
            });
        });
    }
    updateSelectedClass() {
        this.container.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));
        this.optionElements[this.cursor.row]?.[this.cursor.col]?.classList.add("selected");
    }
    getCurrentLayer() {
        return this.layerStack.at(-1);
    }
    getCurrentOption() {
        return this.getCurrentLayer().options[this.cursor.row]?.[this.cursor.col];
    }
    getElement(elementId) {
        const el = this.container.querySelector(`#${elementId}`);
        if (!el) {
            throw new Error(`要素が見つかりません: ${elementId}`);
        }
        return el;
    }
    // 要素ID -> 隠すならtrue、表示するならfalse、をまとめて切り替える。
    // 入れ替えのときに隠す要素を薄れさせていると、その間も場所を取って新しい要素を押しのけてしまうし、
    // 薄れるのを待ってから出すと切り替えがもたつく。なので入れ替えでは古い要素をすぐ消し、新しい要素だけをフェードインさせる。
    // 隠すだけのとき(サブメニューを閉じて、下に残っていた親が見えるだけのとき)は、押しのけるものがないのでフェードアウトさせる
    applyVisibility(changes) {
        const hiding = [...changes].filter(([, hidden]) => hidden).map(([id]) => this.getElement(id));
        const showing = [...changes].filter(([, hidden]) => !hidden).map(([id]) => this.getElement(id));
        hiding.forEach((el) => (showing.length > 0 ? this.hideNow(el) : this.fadeOut(el)));
        showing.forEach((el) => this.fadeIn(el));
    }
    // 切り替えの途中で逆向きの切り替えが来ることがある(すばやい操作をしたとき)。
    // 予約しておいた続きが新しい切り替えを上書きしないよう、最後に望まれた状態をdatasetに覚えておき、続きの前に確かめる
    hideNow(el) {
        el.dataset.menuHidden = "true";
        el.style.transition = "none";
        el.style.opacity = "0";
        el.classList.add("fadeout");
    }
    fadeOut(el) {
        el.dataset.menuHidden = "true";
        el.style.transition = `opacity ${TRANSITION_MS}ms ease-out`;
        el.style.opacity = "0";
        window.setTimeout(() => {
            if (el.dataset.menuHidden === "true")
                el.classList.add("fadeout");
        }, TRANSITION_MS);
    }
    fadeIn(el) {
        el.dataset.menuHidden = "false";
        el.style.transition = `opacity ${TRANSITION_MS}ms ease-out`;
        el.classList.remove("fadeout");
        el.style.opacity = "0";
        // fadeoutを外した直後の同フレームでopacityを上げるとtransitionが飛ぶことがあるので次フレームにする
        requestAnimationFrame(() => {
            if (el.dataset.menuHidden === "false")
                el.style.opacity = "1";
        });
    }
    // 現在のカーソル位置に選択肢が存在するか
    isCursorValid() {
        return !!this.getCurrentLayer().options[this.cursor.row]?.[this.cursor.col];
    }
    correctCursor() {
        let safety = 10;
        while (!this.isCursorValid()) {
            this.moveCol(-1);
            safety--;
            if (safety <= 0) {
                throw new Error("空行である");
            }
        }
    }
    // カーソルが動いたらtrue、行が1つしかなく動かなかったらfalseを返す
    moveRow(diff) {
        const options = this.getCurrentLayer().options;
        if (options.length === 0)
            return false;
        return this.moveToRow((this.cursor.row + diff + options.length) % options.length);
    }
    moveToRow(row) {
        if (row === this.cursor.row)
            return false;
        const layer = this.getCurrentLayer();
        this.cursor = { row, col: this.clampCol(row, this.cursor.col) };
        this.updateSelectedClass();
        this.updateScrollContainer(layer, this.cursor.row, this.scrollRows);
        this.getCurrentOption()?.onFocus?.();
        return true;
    }
    // 表示範囲がdiff行(-1か1)ずれる位置までカーソルを動かす。
    // 表示範囲の端でカーソルが中央に届いていないときは、カーソルが中央の行まで一気に動く。
    // 全行が表示されている場合や、カーソルが動かなかった場合はfalseを返す
    scrollBy(diff) {
        const layer = this.getCurrentLayer();
        const count = visibleRowCount(layer);
        if (count === undefined)
            return false;
        const centerRow = calculateScrollTop(layer, this.cursor.row) + diff + Math.floor((count - 1) / 2);
        return this.moveToRow(diff > 0 ? Math.max(this.cursor.row + 1, centerRow) : Math.min(this.cursor.row - 1, centerRow));
    }
    // カーソルが動いたらtrue、列が1つしかなく動かなかったらfalseを返す
    moveCol(diff) {
        const row = this.getCurrentLayer().options[this.cursor.row];
        if (!row)
            return false;
        const col = (this.cursor.col + diff + row.length) % row.length;
        if (col === this.cursor.col)
            return false;
        this.cursor = { row: this.cursor.row, col };
        this.updateSelectedClass();
        this.getCurrentOption()?.onFocus?.();
        return true;
    }
    clampCol(row, col) {
        const options = this.getCurrentLayer().options[row];
        if (!options)
            throw new Error();
        return Math.min(col, options.length - 1);
    }
    backToRoot() {
        this.back(this.history.length);
    }
    isRoot() {
        return this.history.length === 0;
    }
    pushSubMenu(subMenu, { hides = [], shows = [] } = {}) {
        this.applyVisibility(new Map([
            ...hides.map((id) => [id, true]),
            ...shows.map((id) => [id, false]),
            [subMenu.elementId, false],
        ]));
        this.history.push(this.cursor);
        this.hidesStack.push(hides);
        this.showsStack.push(shows);
        this.layerStack.push({ box: subMenu, options: [] });
        this.cursor = subMenu.initialCursor?.() ?? { row: 0, col: 0 };
        this.render();
    }
    back(depth) {
        // 何層も戻るときは、途中の層で表示してすぐ隠すような要素があるので、最後の状態だけをまとめて切り替える
        const changes = new Map();
        for (let i = 0; i < depth; i++) {
            if (this.layerStack.length <= 1) {
                this.applyVisibility(changes);
                this.onBack();
                return;
            }
            const current = this.layerStack.pop();
            changes.set(current.box.elementId, true);
            this.hidesStack.pop().forEach((id) => changes.set(id, false));
            this.showsStack.pop().forEach((id) => changes.set(id, true));
            this.cursor = this.history.pop();
        }
        this.applyVisibility(changes);
        this.render();
    }
    render(first) {
        this.layerStack.forEach((layer, i) => {
            // renderのタイミングで内部状態（options）を固定する
            layer.options = layer.box.options();
            const isCurrent = i === this.layerStack.length - 1;
            const cursorForMenu = isCurrent ? this.cursor : this.history[i];
            this.renderMenuLayer(layer, cursorForMenu, {
                updateOptionElements: isCurrent,
            });
        });
        this.updateSelectedClass();
        if (!first) {
            this.getCurrentOption()?.onFocus?.();
        }
        this.correctCursor();
    }
    /**
     * menuStack（操作対象）に積まない、プレビュー表示用などの静的なMenuOptionBoxを描画する。
     * カーソル移動や選択操作の内部状態は更新・汚染しない。
     */
    renderPreviewBox(box) {
        const layer = {
            box,
            options: box.options(),
        };
        // updateOptionElements: false により操作用DOMのキャッシュ(optionElements/scrollRows)を上書きせずに描画する
        this.renderMenuLayer(layer, { row: 0, col: 0 }, { updateOptionElements: false });
    }
    renderMenuLayer(layer, cursor, { updateOptionElements = false } = {}) {
        const boxElement = this.getElement(layer.box.elementId);
        boxElement.innerHTML = "";
        if (updateOptionElements) {
            this.optionElements = [];
        }
        if (layer.box.title) {
            const title = document.createElement("span");
            title.className = "menu-title";
            title.textContent = layer.box.title;
            boxElement.appendChild(title);
        }
        const scrollContainer = document.createElement("div");
        scrollContainer.className = "menu-scroll-container";
        boxElement.appendChild(scrollContainer);
        scrollContainer.appendChild(createScrollIndicator("up"));
        // 固定化された選択肢を使用する
        const allRows = layer.options;
        allRows.forEach((row, r) => {
            const rowElements = [];
            const rowEl = document.createElement("div");
            rowEl.className = "option-row";
            row.forEach((option) => {
                const optionEl = createOptionElement(option);
                rowEl.appendChild(optionEl);
                rowElements.push(optionEl);
            });
            scrollContainer.appendChild(rowEl);
            if (updateOptionElements) {
                this.optionElements[r] = rowElements;
            }
        });
        scrollContainer.appendChild(createScrollIndicator("down"));
        const rows = Array.from(scrollContainer.children);
        if (updateOptionElements) {
            this.scrollRows = rows;
        }
        this.updateScrollContainer(layer, cursor.row, rows);
    }
    updateScrollContainer(layer, cursorRow, rows) {
        const maxVisibleRows = layer.box.maxVisibleRows;
        if (!maxVisibleRows)
            return;
        const totalRows = layer.options.length;
        if (totalRows <= maxVisibleRows)
            return;
        const scrollTop = calculateScrollTop(layer, cursorRow);
        // いったん全部隠す
        rows.forEach((row) => {
            row.classList.add("hidden");
        });
        // maxVisibleRowsだけ表示する
        rows.slice(1 + scrollTop, 1 + scrollTop + maxVisibleRows).forEach((row) => {
            row.classList.remove("hidden");
        });
        // 上のインジケータを表示すべきなら一番上に表示されている選択肢と入れ替える
        if (0 < scrollTop) {
            rows[0]?.classList.remove("hidden");
            rows[1 + scrollTop]?.classList.add("hidden");
        }
        // 下も同様
        if (scrollTop < totalRows - maxVisibleRows) {
            rows.at(-1)?.classList.remove("hidden");
            rows[scrollTop + maxVisibleRows]?.classList.add("hidden");
        }
    }
}
function visibleRowCount(layer) {
    const maxVisibleRows = layer.box.maxVisibleRows;
    if (maxVisibleRows === undefined)
        return undefined;
    const totalRows = layer.options.length;
    if (totalRows <= maxVisibleRows)
        return undefined;
    return maxVisibleRows;
}
function calculateScrollTop(layer, cursorRow) {
    const count = visibleRowCount(layer);
    if (count === undefined)
        return 0;
    const totalRows = layer.options.length;
    const maxScrollTop = Math.max(0, totalRows - count);
    const centered = cursorRow - Math.floor((count - 1) / 2);
    return Math.min(Math.max(centered, 0), maxScrollTop);
}
function createOptionElement(option) {
    const optionEl = document.createElement("span");
    optionEl.className = "option";
    if (option.disabled?.()) {
        optionEl.classList.add("disabled");
    }
    // 矢印(::before)をラベルとは別要素にして絶対配置することで、
    // 矢印の有無でラベルの表示位置(特に中央揃え時)がずれないようにする
    const labelEl = document.createElement("span");
    labelEl.className = "option-label";
    if (option.label instanceof HTMLElement) {
        labelEl.appendChild(option.label);
    }
    else {
        labelEl.innerHTML = option.label;
    }
    optionEl.appendChild(labelEl);
    return optionEl;
}
/**
 * 疑似スクロールの▲▼インジケーターを作る。
 */
function createScrollIndicator(direction) {
    const el = document.createElement("div");
    el.className = `menu-scroll-indicator menu-scroll-indicator-${direction} hidden`;
    el.textContent = direction === "up" ? "▲" : "▼";
    return el;
}
