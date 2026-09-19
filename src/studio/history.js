"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const study_1 = require("../model/study");
class History {
    constructor(model) {
        this.model = model;
        this.past = [];
        this.future = [];
    }
    commit(next, label) {
        if (JSON.stringify(next) === JSON.stringify(this.model))
            return;
        this.past.push({ model: (0, study_1.clone)(this.model), label });
        if (this.past.length > 80)
            this.past.shift();
        this.future = [];
        this.model = next;
    }
    undo() {
        const p = this.past.pop();
        if (p) {
            this.future.push({ model: (0, study_1.clone)(this.model), label: p.label });
            this.model = p.model;
        }
    }
    redo() {
        const p = this.future.pop();
        if (p) {
            this.past.push({ model: (0, study_1.clone)(this.model), label: p.label });
            this.model = p.model;
        }
    }
}
exports.History = History;
