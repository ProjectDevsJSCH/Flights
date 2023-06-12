export declare class TelegramService {
    private bot;
    private chatId;
    constructor();
    sendMessage(message: string): Promise<boolean>;
}
