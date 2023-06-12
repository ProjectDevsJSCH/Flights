"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const api_1 = require("../utils/api");
const cron = __importStar(require("node-cron"));
const TService_1 = require("./TService");
const number_1 = require("../utils/number");
const date_1 = require("../utils/date");
class Service {
    constructor() {
        cron.schedule('*/30 * * * *', async () => {
            await this.setDataResponse();
        });
        this.telegramService = new TService_1.TelegramService();
        this.securityToken = '';
        this.minimumDepartures = [];
        this.minimumReturns = [];
        this.minimumValueDeparture = {};
        this.minimumValueReturn = {};
    }
    async setMinimumDepartures(departuresFromRequest) {
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
        if (Object.keys(this.minimumValueDeparture).length === 0) {
            this.minimumValueDeparture = this.minimumDepartures[0];
        }
        else {
            if (this.minimumValueDeparture.total > this.minimumDepartures[0].total) {
                await this.telegramService.sendMessage(`Nuevo vuelo de salida más barato: \n Fecha: ${(0, date_1.dateToFormat)(this.minimumDepartures[0].departure)} \n Precio: ${(0, number_1.numberToCurrency)(this.minimumDepartures[0].total)}`);
                this.minimumValueDeparture = this.minimumDepartures[0];
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
        if (Object.keys(this.minimumValueReturn).length === 0) {
            this.minimumValueReturn = this.minimumReturns[0];
        }
        else {
            if (this.minimumValueReturn.total > this.minimumReturns[0].total) {
                this.telegramService.sendMessage(`Nuevo vuelo de vuelta más barato: \n Fecha: ${(0, date_1.dateToFormat)(this.minimumReturns[0].departure)} \n Precio: ${(0, number_1.numberToCurrency)(this.minimumReturns[0].total)}`);
                this.minimumValueReturn = this.minimumReturns[0];
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
//# sourceMappingURL=WService.js.map