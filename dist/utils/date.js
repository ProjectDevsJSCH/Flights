"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateToFormat = void 0;
function dateToFormat(date) {
    const formatter = new Intl.DateTimeFormat('es-CO', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    return formatter.format(new Date(date));
}
exports.dateToFormat = dateToFormat;
//# sourceMappingURL=date.js.map