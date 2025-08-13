// import axios from 'axios';
// import { callGemini } from '../utils/gemini';

// interface FlightSearchParams {
//   origin: string;
//   destination: string;
//   departureDate: string;
//   returnDate?: string;
//   passengers?: number;
//   class?: string;
// }

// interface FlightResult {
//   id: string;
//   airline: string;
//   flightNumber: string;
//   price: string;
//   departureTime: string;
//   arrivalTime: string;
//   duration: string;
//   stops: number;
//   bookingUrl: string;
//   source: 'serpapi' | 'scraping' | 'fallback';
// }

// // class FlightSearchService {
// //   private serpApiKey = "0a9b0abe47e6107ce612664a0e582e40fc7cc91bdd1b42181cd56b2073c83fa0";
// //   private backendUrl = 'http://localhost:8000';

// //   async searchFlights(params: FlightSearchParams): Promise<FlightResult[]> {
// //     console.log('Searching flights with params:', params);

// //     // Try SerpAPI first
// //     if (this.serpApiKey) {
// //       try {
// //         const serpResults = await this.searchWithSerpAPI(params);
// //         if (serpResults.length > 0) {
// //           console.log('SerpAPI results found:', serpResults.length);
// //           return serpResults;
// //         }
// //         else console.warn('Serp Result length is zero');
// //       } catch (error) {
// //         console.warn('SerpAPI failed:', error);
// //       }
// //     }
// //     else {console.warn('Problem with serpApi key')};

// //     // Try backend scraping
// //     try {
// //       const scrapingResults = await this.searchWithBackendScraping(params);
// //       if (scrapingResults.length > 0) {
// //         console.log('Backend scraping results found:', scrapingResults.length);
// //         return scrapingResults;
// //       }
// //     } catch (error) {
// //       console.warn('Backend scraping failed:', error);
// //     }

// //     // If all methods fail, return empty array (no fallback data)
// //     console.log('All flight search methods failed');
// //     return [];
// //   }

// //   private async searchWithSerpAPI(params: FlightSearchParams): Promise<FlightResult[]> {
    
// //     const departureId = await this.getAirportCode(params.origin);
// //     const arrivalId = await this.getAirportCode(params.destination);
    
// //     const serpParams = {
// //       engine: 'google_flights',
// //       departure_id: departureId,
// //       arrival_id: arrivalId,
// //       outbound_date: params.departureDate,
// //       return_date: params.returnDate,
// //       currency: 'INR',
// //       hl: 'en',
// //       api_key: this.serpApiKey
// //     };

// //     const response = await axios.get('https://serpapi.com/search', {
// //       params: serpParams,
// //       timeout: 10000
// //     });

// //     if (response.data.best_flights) {
// //       return this.formatSerpAPIResults(response.data.best_flights);
// //     }

// //     return [];
// //   }

// //   private async searchWithBackendScraping(params: FlightSearchParams): Promise<FlightResult[]> {
// //     const response = await axios.post(`${this.backendUrl}/api/v1/flights/search`, {
// //       origin: params.origin,
// //       destination: params.destination,
// //       date: params.departureDate,
// //       passengers: params.passengers || 1,
// //       class: params.class || 'economy'
// //     }, {
// //       timeout: 15000
// //     });

// //     if (response.data.success && response.data.flight_results) {
// //       return this.formatBackendResults(response.data.flight_results, params);
// //     }

// //     return [];
// //   }

// //   private formatSerpAPIResults(flights: any[]): FlightResult[] {
// //     return flights.map((flight, index) => ({
// //       id: `serp_${index}`,
// //       airline: flight.flights[0]?.airline || 'Unknown',
// //       flightNumber: flight.flights[0]?.flight_number || 'N/A',
// //       price: `₹${flight.price?.toLocaleString() || 'N/A'}`,
// //       departureTime: flight.flights[0]?.departure_airport?.time || 'N/A',
// //       arrivalTime: flight.flights[0]?.arrival_airport?.time || 'N/A',
// //       duration: flight.total_duration || 'N/A',
// //       stops: flight.flights?.length - 1 || 0,
// //       bookingUrl: flight.booking_token ? 
// //         `https://www.google.com/travel/flights/booking?token=${flight.booking_token}` :
// //         this.generateSkyscannerUrl(flight),
// //       source: 'serpapi'
// //     }));
// //   }

// //   private formatBackendResults(flights: any[], params: FlightSearchParams): FlightResult[] {
// //     return flights.map((flight, index) => ({
// //       id: `backend_${index}`,
// //       airline: flight.airline || 'Unknown',
// //       flightNumber: flight.flight_number || 'N/A',
// //       price: flight.price || 'N/A',
// //       departureTime: flight.departure_time || 'N/A',
// //       arrivalTime: flight.arrival_time || 'N/A',
// //       duration: flight.duration || 'N/A',
// //       stops: flight.stops || 0,
// //       bookingUrl: this.generateBookingUrl(flight, params),
// //       source: 'scraping'
// //     }));
// //   }

// //   private generateBookingUrl(flight: any, params: FlightSearchParams): string {
// //     // Generate booking URL based on airline
// //     const airline = flight.airline?.toLowerCase();
    
// //     if (airline?.includes('indigo')) {
// //       return `https://www.goindigo.in/booking/flight-select?from=${params.origin}&to=${params.destination}&date=${params.departureDate}`;
// //     } else if (airline?.includes('air india')) {
// //       return `https://www.airindia.in/booking?from=${params.origin}&to=${params.destination}&date=${params.departureDate}`;
// //     } else if (airline?.includes('spicejet')) {
// //       return `https://www.spicejet.com/booking?from=${params.origin}&to=${params.destination}&date=${params.departureDate}`;
// //     }
    
// //     return this.generateSkyscannerUrl({ origin: params.origin, destination: params.destination, date: params.departureDate });
// //   }

// //   private generateSkyscannerUrl(params: any): string {
// //     const origin = this.getAirportCode(params.origin || 'DEL');
// //     const destination = this.getAirportCode(params.destination || 'BOM');
// //     const date = params.date || new Date().toISOString().split('T')[0];
    
// //     return `https://www.skyscanner.co.in/transport/flights/${origin}/${destination}/${date.replace(/-/g, '')}/?adultsv2=1&children=0&adultsv2=1&childrenv2=&infants=0&cabinclass=economy`;
// //   }

// //   private async getAirportCode(cityName: string): Promise<string> {
// //   const airportCodes: { [key: string]: string } = {
// //     'delhi': 'DEL',
// //     'mumbai': 'BOM',
// //     'bangalore': 'BLR',
// //     'chennai': 'MAA',
// //     'kolkata': 'CCU',
// //     'hyderabad': 'HYD',
// //     'pune': 'PNQ',
// //     'ahmedabad': 'AMD',
// //     'goa': 'GOI',
// //     'kochi': 'COK',
// //     'jaipur': 'JAI',
// //     'lucknow': 'LKO',
// //     'chandigarh': 'IXC',
// //     'bhubaneswar': 'BBI',
// //     'indore': 'IDR'
// //   };

// //   const normalizedCity = cityName.toLowerCase();

// //   if (airportCodes[normalizedCity]) {
// //     return airportCodes[normalizedCity];
// //   }

// //   // Use Gemini for unknown cities
// //   try {
// //     const response = await callGemini(
// //       `Analyze the city name "${cityName}" and return ONLY its IATA airport code in uppercase. 
// //       Example responses: DEL, BOM, BLR. No other text.`,
// //       { temperature: 0.1 } // Lower temperature for precise answers
// //     );

// //     const iataMatch = response.text.match(/[A-Z]{3}/);
// //     if (iataMatch) {
// //       return iataMatch[0];
// //     }
    
// //     return normalizedCity.slice(0, 3).toUpperCase();
    
// //   } catch (error) {
// //     console.error('Gemini IATA lookup failed:', error);
// //     return 'XXX';
// //   }
// // }
// // }

// class FlightSearchService {
//   private backendUrl = 'http://localhost:8000';

//   async searchFlights(params: FlightSearchParams): Promise<FlightResult[]> {
//     console.log('🔍 Searching flights via backend:', params);

//     try {
//       // Only use backend - remove SerpAPI direct calls
//       const response = await axios.post(`${this.backendUrl}/api/v1/flights/search`, {
//         origin: params.origin,
//         destination: params.destination,
//         date: params.departureDate,
//         passengers: params.passengers || 1,
//         class: params.class || 'economy'
//       }, {
//         timeout: 15000
//       });

//       if (response.data.success && response.data.flight_results) {
//         console.log('✅ Backend results found:', response.data.flight_results.length);
//         return response.data.flight_results;
//       } else {
//         console.log('❌ Backend search failed:', response.data.error);
//         return [];
//       }
//     } catch (error) {
//       console.error('❌ Flight search failed:', error);
//       return [];
//     }
//   }

// }

// export const flightService = new FlightSearchService();
// export type { FlightResult, FlightSearchParams };

import api from './api';

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  date: string;
  passengers?: number;
}

export interface FlightResult {
  id: string;
  airline: string;
  price: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: number;
  bookingUrl: string;
  source: string;
}

export const searchFlights = async (request: FlightSearchRequest): Promise<FlightResult[]> => {
  try {
    const response = await api.post('/api/v1/flights/search', request);
    
    if (response.data.success) {
      return response.data.flight_results || [];
    } else {
      throw new Error(response.data.error || 'Flight search failed');
    }
  } catch (error: any) {
    console.error('Flight search error:', error);
    throw new Error(error.response?.data?.error || error.message || 'Flight search failed');
  }
};
export const flightService = {
  searchFlights
};

export default flightService;