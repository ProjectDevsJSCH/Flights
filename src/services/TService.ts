import TelegramBot from 'node-telegram-bot-api'

export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: true });
    this.chatId = process.env.CHAT_ID;
  }

  public async sendMessage(
    message: string,
  ): Promise<boolean> {
    try {
      await this.bot.sendMessage(this.chatId, message);
    } catch (error) {
      console.log('error', error);

      return false;
    }
    
    return true;
  }
}
