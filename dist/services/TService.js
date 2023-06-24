"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
class TelegramService {
    constructor() {
        this.bot = new node_telegram_bot_api_1.default('5933348337:AAHMtNEhcHuP0z1WjdFdniVGOGqpGQzz-N0', { polling: true });
        this.chatId = '1140940947';
    }
    async sendMessage(message) {
        try {
            await this.bot.sendMessage(this.chatId, message);
        }
        catch (error) {
            console.log('error', error);
            return false;
        }
        return true;
    }
}
exports.TelegramService = TelegramService;
//# sourceMappingURL=TService.js.map