export interface flightInformation {
    total: number;
    departure: string;
}
export declare function getFlightData(securityToken?: string): Promise<{
    securityToken: string;
    isExpired: boolean;
    data: {
        departureFlights: flightInformation[];
        returnFlights: flightInformation[];
    };
}>;
