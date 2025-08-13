export interface TravelRequest {
  id: number;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  purpose: string;
  trip_type?: 'one-way' | 'round-trip';
  status: 'pending' | 'approved' | 'rejected';
}

export interface FlightOption {
  airline: string;
  flight_number: string;
  departure: string;
  arrival: string;
  price: string;
  duration: string;
  stops: number;
  booking_link?: string;
}