"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const api_1 = require("./api");
class Service {
    constructor() {
        this.securityToken = '';
        this.minimumDepartures = [];
        this.minimumReturns = [];
        this.minimumValueDeparture = 0;
        this.minimumValueReturn = 0;
    }
    setMinimumDepartures(departuresFromRequest) {
        if (this.minimumDepartures.length === 0)
            this.minimumDepartures = departuresFromRequest;
        else {
            this.minimumDepartures.forEach((md) => {
                const minimumFlight = departuresFromRequest.find((dfr) => {
                    return dfr.departure === md.departure;
                });
                if (minimumFlight && minimumFlight.total < md.total) {
                    md.total = minimumFlight.total;
                }
            });
        }
        this.minimumDepartures = this.minimumDepartures.sort((a, b) => {
            return a.total - b.total;
        });
        if (this.minimumValueDeparture === 0) {
            this.minimumValueDeparture = this.minimumDepartures[0].total;
        }
        else {
            if (this.minimumValueDeparture > this.minimumDepartures[0].total) {
                this.minimumValueDeparture = this.minimumDepartures[0].total;
            }
        }
    }
    setMinimumReturns(returnsFromRequest) {
        if (this.minimumReturns.length === 0)
            this.minimumReturns = returnsFromRequest;
        else {
            this.minimumReturns.forEach((mr) => {
                const minimumFlight = returnsFromRequest.find((rfr) => {
                    return rfr.departure === mr.departure;
                });
                if (minimumFlight && minimumFlight.total < mr.total) {
                    mr.total = minimumFlight.total;
                }
            });
        }
        this.minimumReturns = this.minimumReturns.sort((a, b) => {
            return a.total - b.total;
        });
        if (this.minimumValueReturn === 0) {
            this.minimumValueReturn = this.minimumReturns[0].total;
        }
        else {
            if (this.minimumValueReturn > this.minimumReturns[0].total) {
                this.minimumValueReturn = this.minimumReturns[0].total;
            }
        }
    }
    async setDataResponse() {
        const { securityToken, isExpired, data } = await (0, api_1.getFlightData)(this.securityToken);
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
    getData() {
        return {
            minimumDepartures: this.minimumDepartures,
            minimumReturns: this.minimumReturns,
        };
    }
}
exports.Service = Service;
//# sourceMappingURL=service.js.map