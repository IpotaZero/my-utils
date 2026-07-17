export class RegExpDict {
    dict;
    regExpCache;
    constructor(dict) {
        this.dict = dict;
        this.regExpCache = {};
    }
    get(key) {
        for (const [reg, value] of Object.entries(this.dict)) {
            if (this.getRegExp(reg).test(key)) {
                return value;
            }
        }
    }
    *getAll(key) {
        for (const [reg, value] of Object.entries(this.dict)) {
            if (this.getRegExp(reg).test(key)) {
                yield value;
            }
        }
    }
    getKeys() {
        return Object.keys(this.dict);
    }
    getValues() {
        return Object.values(this.dict);
    }
    add(reg, value) {
        this.dict[reg] = value;
    }
    getRegExp(reg) {
        if (!this.regExpCache[reg]) {
            this.regExpCache[reg] = new RegExp(`^${reg}$`);
        }
        return this.regExpCache[reg];
    }
}
