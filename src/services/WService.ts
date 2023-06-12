import { flightInformation, getFlightData } from "../utils/api";

import * as cron from 'node-cron';
import { TelegramService } from "./TService";
import { numberToCurrency } from "../utils/number";
import { dateToFormat } from "../utils/date";

export class Service {
  private securityToken;
  private minimumDepartures: flightInformation[];
  private minimumReturns: flightInformation[];
  private minimumValueDeparture: flightInformation;
  private minimumValueReturn: flightInformation;
  private telegramService: TelegramService;

  constructor() {
    // cron.schedule('*/5 * * * * *', async () => {
    //cron each 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.setDataResponse();
    });

    this.telegramService = new TelegramService();
    this.securityToken = '';
    this.minimumDepartures = [];
    this.minimumReturns = [];
    this.minimumValueDeparture = {} as flightInformation;
    this.minimumValueReturn = {} as flightInformation;
  }

  public async setMinimumDepartures(
    departuresFromRequest: flightInformation[],
  ): Promise<void> {
    if (this.minimumDepartures.length === 0) this.minimumDepartures = departuresFromRequest;
    else {
      //compare this.minimumDepartures with minimumDepartures by day and the lowest price and store in this.minimumDepartures
      this.minimumDepartures.forEach((md: flightInformation) => {
        const minimumFlight = departuresFromRequest.find((dfr: flightInformation) => {
          return dfr.departure === md.departure;
        });
			
        if (minimumFlight && minimumFlight.total < md.total) {
          md.total = minimumFlight.total;
        }
      })
    }

    this.minimumDepartures = this.minimumDepartures.sort((a: flightInformation, b: flightInformation) => {
      return a.total - b.total;
    });
		
    // check if minimumValueDeparture must be updated
    if (Object.keys(this.minimumValueDeparture).length === 0) {
      this.minimumValueDeparture = this.minimumDepartures[0];
    } else {
      if (this.minimumValueDeparture.total > this.minimumDepartures[0].total) {
        await this.telegramService.sendMessage(`Nuevo vuelo de salida más barato: \n Fecha: ${dateToFormat(this.minimumDepartures[0].departure)} \n Precio: ${numberToCurrency(this.minimumDepartures[0].total)}`);

        this.minimumValueDeparture = this.minimumDepartures[0];
      }
    }
  }
  
  public setMinimumReturns(
    returnsFromRequest: flightInformation[],
  ): void {
    if (this.minimumReturns.length === 0) this.minimumReturns = returnsFromRequest;
    else {
    //compare this.minimumReturns with minimumReturns by day the lowest price and store in this.minimumReturns
      this.minimumReturns.forEach((mr: flightInformation) => {
        const minimumFlight = returnsFromRequest.find((rfr: flightInformation) => {
          return rfr.departure === mr.departure;
        });
			
        if (minimumFlight && minimumFlight.total < mr.total) {
          mr.total = minimumFlight.total;
        }
      });
    }

    this.minimumReturns = this.minimumReturns.sort((a: flightInformation, b: flightInformation) => {
      return a.total - b.total;
    });

    // check if minimumValueReturn must be updated
    if (Object.keys(this.minimumValueReturn).length === 0) {
      this.minimumValueReturn = this.minimumReturns[0];
    } else {
      if (this.minimumValueReturn.total > this.minimumReturns[0].total) {
        this.telegramService.sendMessage(`Nuevo vuelo de vuelta más barato: \n Fecha: ${dateToFormat(this.minimumReturns[0].departure)} \n Precio: ${numberToCurrency(this.minimumReturns[0].total)}`);
        this.minimumValueReturn = this.minimumReturns[0];
      }
    }
  }

  public async setDataResponse(): Promise<void> {
    const {
      securityToken,
      isExpired,
      data
    } = await getFlightData(this.securityToken);

    this.securityToken = securityToken;
	
    if (isExpired) {
      this.securityToken = '';
			
      console.log('Token expired');

      this.setDataResponse();

      return;
    }

    this.setMinimumDepartures(data.departureFlights);
    this.setMinimumReturns(data.returnFlights);
  } 		

  public getData(): {
    minimumDepartures: flightInformation[],
    minimumReturns: flightInformation[],
  } {
    return {
      minimumDepartures: this.minimumDepartures,
      minimumReturns: this.minimumReturns,
    }
  }
}