import { flightInformation, getFlightData } from "./api";

export class Service {
  private securityToken = '';
  private minimumDepartures: flightInformation[] = [];
  private minimumReturns: flightInformation[] = [];
  private minimumValueDeparture = 0;
  private minimumValueReturn = 0;

  public setMinimumDepartures(
    departuresFromRequest: flightInformation[],
  ): void {
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
    if (this.minimumValueDeparture === 0) {
      this.minimumValueDeparture = this.minimumDepartures[0].total;
    } else {
      if (this.minimumValueDeparture > this.minimumDepartures[0].total) {
        // Send message to the user
        this.minimumValueDeparture = this.minimumDepartures[0].total;
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
    if (this.minimumValueReturn === 0) {
      this.minimumValueReturn = this.minimumReturns[0].total;
    } else {
      if (this.minimumValueReturn > this.minimumReturns[0].total) {
        // Send message to the user
        this.minimumValueReturn = this.minimumReturns[0].total;
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