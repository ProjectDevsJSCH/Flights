import { flightInformation } from "./api";
export declare class Service {
    private securityToken;
    private minimumDepartures;
    private minimumReturns;
    private minimumValueDeparture;
    private minimumValueReturn;
    setMinimumDepartures(departuresFromRequest: flightInformation[]): void;
    setMinimumReturns(returnsFromRequest: flightInformation[]): void;
    setDataResponse(): Promise<void>;
    getData(): {
        minimumDepartures: flightInformation[];
        minimumReturns: flightInformation[];
    };
}
