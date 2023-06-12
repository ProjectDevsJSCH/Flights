import axios from 'axios';

export interface flightInformation {
  total: number,
  departure: string
}

function extractTotals (
  data: any
): flightInformation {
  const [mainFares] = data.infoFares;
  let totalTaxes = 0;

  mainFares.fareAdult.applicableTaxes.forEach((tax: any) => {
    totalTaxes += tax.taxAmount;
  });
	
  const fare = mainFares.fareAdult.fareAmount;
  const vat = 8797;
  const webFee = 46300;
  const total = fare + totalTaxes + vat + webFee;

  return {total, departure: data.departureDate};
}

export async function getFlightData(
  securityToken = '',
): Promise<{
    securityToken: string,
    isExpired: boolean,
    data: {
      departureFlights: flightInformation[],
      returnFlights: flightInformation[]
    }
  }> {	
  const baseUrl = 'https://routes-api.wingo.com/v1/getInformationFlightsMonthly';

  const params = {
    origin: 'BOG',
    originStartDate: '2023-08-03',
    originEndDate: '2023-08-05',
    originDaysBefore: '0',
    originDaysAfter: '4',
    destination: 'MDE',
    destinationStartDate: '2023-08-06',
    destinationEndDate: '2023-08-08',
    destinationDaysBefore: '0',
    destinationDaysAfter: '4',
    currency: 'COP',
    adultNumber: '1',
    childNumber: '0',
    infantNumber: '0',
    flightType: '0',
    iataNumber: '',
    userAgent: 'IBE',
    promoCode: '',
    currentCurrency: 'undefined',
    multiCurrency: 'false',
    languageId: '2',
    originAirportsName: '',
    destinationAirportsName: '',
    isMultiAirport: 'false',
    origin1: '',
    destination1: '',
    isDifferentAirport: 'false',
  }

  const urlEndpoint = `${baseUrl}?securityToken=${securityToken}&origin=${params.origin}&originStartDate=${params.originStartDate}&originEndDate=${params.originEndDate}&originDaysBefore=${params.originDaysBefore}&originDaysAfter=${params.originDaysAfter}&destination=${params.destination}&destinationStartDate=${params.destinationStartDate}&destinationEndDate=${params.destinationEndDate}&destinationDaysBefore=${params.destinationDaysBefore}&destinationDaysAfter=${params.destinationDaysAfter}&currency=${params.currency}&adultNumber=${params.adultNumber}&childNumber=${params.childNumber}&infantNumber=${params.infantNumber}&flightType=${params.flightType}&iataNumber=${params.iataNumber}&userAgent=${params.userAgent}&promoCode=${params.promoCode}&currentCurrency=${params.currentCurrency}&multiCurrency=${params.multiCurrency}&languageId=${params.languageId}&originAirportsName=${params.originAirportsName}&destinationAirportsName=${params.destinationAirportsName}&isMultiAirport=${params.isMultiAirport}&origin1=${params.origin1}&destination1=${params.destination1}&isDifferentAirport=${params.isDifferentAirport}`;
  const response = await axios.get(urlEndpoint);
  const vuelosVuelta = response.data.response.vueloVuelta;
  const vuelosIda = response.data.response.vueloIda;

  const departureFlights = [];
  const returnFlights = [];

  vuelosIda.forEach((vueloIda: any) => {
    vueloIda.infoVuelo.vuelos.forEach((vuelo: any) => {
      const {total, departure} = extractTotals(vuelo);

      departureFlights.push({total, departure});
    });
  });

  vuelosVuelta.forEach((vueloVuelta: any) => {
    vueloVuelta.infoVuelo.vuelos.forEach((vuelo: any) => {
      const {
        total, 
        departure
      } = extractTotals(vuelo);

      returnFlights.push({total, departure});
    });
  });
	
  console.log({vuelosSalida: departureFlights, vuelosRegreso: returnFlights});
  console.log({securityToken});

  return {
    securityToken: response.data.response.token,
    isExpired: response.data.response.vueloVuelta[0].infoVuelo.vuelos.length === 0,
    data: { departureFlights, returnFlights },
  }
}