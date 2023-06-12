"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const WService_1 = require("./services/WService");
const service = new WService_1.Service();
const DEFAULT_PORT = 8080;
const PORT_NUMBER = process.env.PORT || DEFAULT_PORT;
const app = (0, express_1.default)();
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.send('Alive');
});
app.get('/last', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.send(service.getData());
});
app.listen(PORT_NUMBER, () => console.log('Server running on por', PORT_NUMBER, new Date()));
module.exports = app;
//# sourceMappingURL=index.js.map