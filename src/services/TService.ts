import TelegramBot from 'node-telegram-bot-api'

export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;

  constructor() {
    this.bot = new TelegramBot('5933348337:AAHMtNEhcHuP0z1WjdFdniVGOGqpGQzz-N0', { polling: true });
    this.chatId = '1140940947';
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