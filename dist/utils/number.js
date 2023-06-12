"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToCurrency = void 0;
function numberToCurrency(number) {
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    });
    return formatter.format(number);
}
exports.numberToCurrency = numberToCurrency;
//# sourceMappingURL=number.js.map