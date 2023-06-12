import { flightInformation } from "../utils/api";
export declare class Service {
    private securityToken;
    private minimumDepartures;
    private minimumReturns;
    private minimumValueDeparture;
    private minimumValueReturn;
    private telegramService;
    constructor();
    setMinimumDepartures(departuresFromRequest: flightInformation[]): Promise<void>;
    setMinimumReturns(returnsFromRequest: flightInformation[]): void;
    setDataResponse(): Promise<void>;
    getData(): {
        minimumDepartures: flightInformation[];
        minimumReturns: flightInformation[];
    };
}
