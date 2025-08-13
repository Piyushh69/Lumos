// import React, { useState, useEffect } from 'react';

// interface FlightSearchProps {
//   socket: WebSocket | null;
//   sendMessage: (message: string) => void;
//   isConnected: boolean;
// }

// interface FlightResult {
//   airline: string;
//   price: string;
//   time: string;
//   duration: string;
//   flightNumber: string;
//   route: string;
//   bookingUrl?: string;
//   stops?: number;
//   aircraft?: string;
//   source: string;
//   scraped: boolean;
// }

// const FlightSearch: React.FC<FlightSearchProps> = ({ socket, sendMessage, isConnected }) => {
//   const [origin, setOrigin] = useState('');
//   const [destination, setDestination] = useState('');
//   const [date, setDate] = useState('');
//   const [passengers, setPassengers] = useState('1');
//   const [travelClass, setTravelClass] = useState('economy');
//   const [searching, setSearching] = useState(false);
//   const [results, setResults] = useState<FlightResult[]>([]);
//   const [searchId, setSearchId] = useState('');
//   const [aiAnalysis, setAiAnalysis] = useState('');

//   // Listen for WebSocket messages
//   useEffect(() => {
//     if (socket) {
//       const handleMessage = (event: MessageEvent) => {
//         try {
//           const data = JSON.parse(event.data);

//           if (data.type === 'message' && data.agent_used === 'flight_agent') {
//             setSearching(false);

//             // Parse flight results from AI response
//             if (data.flight_results && data.flight_results.length > 0) {
//               const enhancedResults = data.flight_results.map((flight: any, index: number) => ({
//                 ...flight,
//                 bookingUrl: generateBookingUrl(flight, origin, destination, date),
//                 flightNumber: flight.flight_number || `${flight.airline.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`
//               }));
//               setResults(enhancedResults);
//             }

//             // Set AI analysis
//             if (data.ai_analysis) {
//               setAiAnalysis(data.ai_analysis);
//             }

//             // Handle screenshot if available
//             if (data.screenshot_path) {
//               console.log('Screenshot available:', data.screenshot_path);
//             }
//           }
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error);
//         }
//       };

//       socket.addEventListener('message', handleMessage);
//       return () => socket.removeEventListener('message', handleMessage);
//     }
//   }, [socket, origin, destination, date]);

//   const generateBookingUrl = (flight: any, origin: string, destination: string, date: string) => {
//     const airline = flight.airline.toLowerCase();

//     // Generate booking URLs based on airline
//     if (airline.includes('indigo')) {
//       return `https://www.goindigo.in/booking/flight-select?origin=${origin}&destination=${destination}&departure=${date}&passengers=${passengers}&class=${travelClass}`;
//     } else if (airline.includes('air india')) {
//       return `https://www.airindia.in/booking?from=${origin}&to=${destination}&date=${date}&pax=${passengers}&class=${travelClass}`;
//     } else if (airline.includes('spicejet')) {
//       return `https://www.spicejet.com/flight-booking?origin=${origin}&destination=${destination}&departure=${date}&passengers=${passengers}`;
//     } else if (airline.includes('vistara')) {
//       return `https://www.airvistara.com/booking/flight-search?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}`;
//     } else {
//       // Generic booking URL for other airlines
//       return `https://www.makemytrip.com/flight/search?itinerary=${origin}-${destination}-${date}&tripType=O&paxType=A-${passengers}_C-0_I-0&intl=false&class=${travelClass.toUpperCase()}`;
//     }
//   };

//   const handleSearch = async () => {
//     if (!origin || !destination) {
//       alert('Please enter both origin and destination');
//       return;
//     }

//     if (!isConnected) {
//       alert('AI assistant is not connected. Please wait for connection.');
//       return;
//     }

//     setSearching(true);
//     setResults([]);
//     setAiAnalysis('');

//     const currentSearchId = Date.now().toString();
//     setSearchId(currentSearchId);

//     // Format date for AI
//     const searchDate = date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

//     // Send comprehensive search request to AI
//     const searchQuery = `Search flights from ${origin} to ${destination} on ${searchDate} for ${passengers} passenger(s) in ${travelClass} class. Please provide real-time flight options with prices, timings, and booking recommendations.`;

//     sendMessage(searchQuery);

//     // Fallback timeout in case AI doesn't respond
//     setTimeout(() => {
//       if (searching) {
//         setSearching(false);
//         // Provide fallback data if AI doesn't respond
//         const fallbackResults: FlightResult[] = [
//           {
//             airline: 'IndiGo',
//             price: '₹8,500',
//             time: '08:30 AM',
//             duration: '2h 15m',
//             flightNumber: '6E-234',
//             route: `${origin} → ${destination}`,
//             stops: 0,
//             aircraft: 'A320',
//             source: 'Fallback Data',
//             scraped: false,
//             bookingUrl: generateBookingUrl({ airline: 'IndiGo' }, origin, destination, searchDate)
//           },
//           {
//             airline: 'Air India',
//             price: '₹12,200',
//             time: '02:15 PM',
//             duration: '2h 30m',
//             flightNumber: 'AI-131',
//             route: `${origin} → ${destination}`,
//             stops: 0,
//             aircraft: 'A321',
//             source: 'Fallback Data',
//             scraped: false,
//             bookingUrl: generateBookingUrl({ airline: 'Air India' }, origin, destination, searchDate)
//           },
//           {
//             airline: 'SpiceJet',
//             price: '₹7,800',
//             time: '06:45 PM',
//             duration: '2h 20m',
//             flightNumber: 'SG-8194',
//             route: `${origin} → ${destination}`,
//             stops: 0,
//             aircraft: 'B737',
//             source: 'Fallback Data',
//             scraped: false,
//             bookingUrl: generateBookingUrl({ airline: 'SpiceJet' }, origin, destination, searchDate)
//           }
//         ];
//         setResults(fallbackResults);
//         setAiAnalysis('Using cached flight data. For real-time prices and availability, please click "Book Now" on your preferred flight.');
//       }
//     }, 10000); // 10 second timeout
//   };

//   const handleBookFlight = (flight: FlightResult) => {
//     if (flight.bookingUrl) {
//       // Open booking URL in new tab
//       window.open(flight.bookingUrl, '_blank', 'noopener,noreferrer');

//       // Send booking analytics to AI
//       if (isConnected) {
//         sendMessage(`User selected ${flight.airline} flight ${flight.flightNumber} for ${flight.price} from ${origin} to ${destination}`);
//       }
//     } else {
//       alert('Booking URL not available for this flight. Please visit the airline website directly.');
//     }
//   };

//   const getFlightStatusColor = (flight: FlightResult) => {
//     if (flight.scraped) {
//       return '#10b981'; // Green for live data
//     } else {
//       return '#f59e0b'; // Orange for fallback data
//     }
//   };

//   return (
//     <div className="flight-search">
//       <div className="page-header">
//         <h1>Flight Search</h1>
//         <p>Real-time flight search with intelligent recommendations</p>
//         {isConnected && (
//           <div className="ai-status">
//             <span className="status-dot connected"></span>
//             AI Assistant Connected
//           </div>
//         )}
//       </div>

//       {/* Search Form */}
//       <div className="search-form">
//         <div className="form-grid">
//           <div className="form-group">
//             <label className="form-label">From</label>
//             <input
//               type="text"
//               className="form-input"
//               placeholder="Delhi, Mumbai, Bangalore..."
//               value={origin}
//               onChange={(e) => setOrigin(e.target.value)}
//               list="airports-from"
//             />
//             <datalist id="airports-from">
//               <option value="Delhi">Delhi (DEL)</option>
//               <option value="Mumbai">Mumbai (BOM)</option>
//               <option value="Bangalore">Bangalore (BLR)</option>
//               <option value="Chennai">Chennai (MAA)</option>
//               <option value="Kolkata">Kolkata (CCU)</option>
//               <option value="Hyderabad">Hyderabad (HYD)</option>
//               <option value="Pune">Pune (PNQ)</option>
//             </datalist>
//           </div>

//           <div className="form-group">
//             <label className="form-label">To</label>
//             <input
//               type="text"
//               className="form-input"
//               placeholder="Delhi, Mumbai, Bangalore..."
//               value={destination}
//               onChange={(e) => setDestination(e.target.value)}
//               list="airports-to"
//             />
//             <datalist id="airports-to">
//               <option value="Delhi">Delhi (DEL)</option>
//               <option value="Mumbai">Mumbai (BOM)</option>
//               <option value="Bangalore">Bangalore (BLR)</option>
//               <option value="Chennai">Chennai (MAA)</option>
//               <option value="Kolkata">Kolkata (CCU)</option>
//               <option value="Hyderabad">Hyderabad (HYD)</option>
//               <option value="Pune">Pune (PNQ)</option>
//             </datalist>
//           </div>

//           <div className="form-group">
//             <label className="form-label">Departure Date</label>
//             <input
//               type="date"
//               className="form-input"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               min={new Date().toISOString().split('T')[0]}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Passengers</label>
//             <select
//               className="form-input"
//               value={passengers}
//               onChange={(e) => setPassengers(e.target.value)}
//             >
//               {[1,2,3,4,5,6,7,8,9].map(num => (
//                 <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
//               ))}
//             </select>
//           </div>

//           <div className="form-group">
//             <label className="form-label">Class</label>
//             <select
//               className="form-input"
//               value={travelClass}
//               onChange={(e) => setTravelClass(e.target.value)}
//             >
//               <option value="economy">Economy</option>
//               <option value="premium-economy">Premium Economy</option>
//               <option value="business">Business</option>
//               <option value="first">First Class</option>
//             </select>
//           </div>
//         </div>

//         <div className="search-actions">
//           <button
//             className="btn btn-primary search-btn"
//             onClick={handleSearch}
//             disabled={searching || !isConnected}
//           >
//             {searching ? (
//               <>
//                 <div className="spinner-small"></div>
//                 Searching...
//               </>
//             ) : (
//               'Search Flights'
//             )}
//           </button>

//           {!isConnected && (
//             <p className="connection-warning">
//               ⚠️ AI assistant disconnected. Reconnecting...
//             </p>
//           )}
//         </div>
//       </div>

//       {/* AI Analysis */}
//       {aiAnalysis && (
//         <div className="ai-analysis">
//           <h3>🤖 AI Travel Insights</h3>
//           <p>{aiAnalysis}</p>
//         </div>
//       )}

//       {/* Flight Results */}
//       {results.length > 0 && (
//         <div className="flight-results">
//           <div className="results-header">
//             <h2>Flight Options</h2>
//             <p>{results.length} flights found for {origin} → {destination}</p>
//           </div>

//           <div className="flights-grid">
//             {results.map((flight, index) => (
//               <div key={index} className="flight-card">
//                 <div className="flight-header">
//                   <div className="airline-info">
//                     <h3>{flight.airline}</h3>
//                     <span className="flight-number">{flight.flightNumber}</span>
//                   </div>
//                   <div
//                     className="data-source"
//                     style={{ color: getFlightStatusColor(flight) }}
//                   >
//                     {flight.scraped ? '🟢 Live Data' : '🟡 Cached Data'}
//                   </div>
//                 </div>

//                 <div className="flight-details">
//                   <div className="time-info">
//                     <div className="departure">
//                       <span className="time">{flight.time}</span>
//                       <span className="airport">{origin}</span>
//                     </div>
//                     <div className="duration">
//                       <span className="duration-text">{flight.duration}</span>
//                       <div className="flight-line">
//                         <div className="line"></div>
//                         <div className="plane">✈️</div>
//                       </div>
//                       {flight.stops !== undefined && (
//                         <span className="stops">
//                           {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
//                         </span>
//                       )}
//                     </div>
//                     <div className="arrival">
//                       <span className="time">
//                         {/* Calculate arrival time */}
//                         {(() => {
//                           const [hours, minutes] = flight.time.split(/[:\s]/);
//                           const [durationHours, durationMinutes] = flight.duration.match(/\d+/g) || ['2', '0'];
//                           const departureTime = new Date();
//                           departureTime.setHours(parseInt(hours) + (flight.time.includes('PM') && hours !== '12' ? 12 : 0));
//                           departureTime.setMinutes(parseInt(minutes));
//                           departureTime.setHours(departureTime.getHours() + parseInt(durationHours));
//                           departureTime.setMinutes(departureTime.getMinutes() + parseInt(durationMinutes));
//                           return departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
//                         })()}
//                       </span>
//                       <span className="airport">{destination}</span>
//                     </div>
//                   </div>

//                   {flight.aircraft && (
//                     <div className="aircraft-info">
//                       <span>Aircraft: {flight.aircraft}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flight-footer">
//                   <div className="price-section">
//                     <span className="price">{flight.price}</span>
//                     <span className="price-note">per person</span>
//                   </div>

//                   <button
//                     className="btn btn-success book-btn"
//                     onClick={() => handleBookFlight(flight)}
//                   >
//                     📅 Book Now
//                   </button>
//                 </div>

//                 <div className="source-info">
//                   <small>Source: {flight.source}</small>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {searching && (
//         <div className="searching-indicator">
//           <div className="spinner"></div>
//           <h3>Searching for the best flights...</h3>
//           <p>Analyzing real-time prices and availability</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FlightSearch;

// import React, { useState } from 'react';
// // import { flightService, FlightResult, FlightSearchParams } from '../services/FlightService';
// import flightService, { FlightSearchRequest, FlightResult } from '../services/FlightService';

// interface FlightSearchProps {
//   socket: WebSocket | null;
//   sendMessage: (message: string) => void;
//   isConnected: boolean;
// }

// const FlightSearch: React.FC<FlightSearchProps> = ({ socket, sendMessage, isConnected }) => {
//   const [searchParams, setSearchParams] = useState<FlightSearchParams>({
//     origin: '',
//     destination: '',
//     departureDate: '',
//     passengers: 1,
//     class: 'economy'
//   });

//   const [flights, setFlights] = useState<FlightResult[]>([]);
//   const [searching, setSearching] = useState(false);
//   const [searchFailed, setSearchFailed] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   const handleInputChange = (field: keyof FlightSearchParams, value: string | number) => {
//     setSearchParams(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const handleSearch = async () => {
//     if (!searchParams.origin || !searchParams.destination) {
//       alert('Please enter both origin and destination');
//       return;
//     }

//     setSearching(true);
//     setSearchFailed(false);
//     setErrorMessage('');
//     setFlights([]);

//     try {
//       // Send AI message for logging
//       if (isConnected) {
//         sendMessage(`Searching flights from ${searchParams.origin} to ${searchParams.destination} on ${searchParams.departureDate}`);
//       }

//       const results = await flightService.searchFlights(searchParams);

//       if (results.length > 0) {
//         setFlights(results);
//         setSearchFailed(false);
//       } else {
//         setSearchFailed(true);
//         setErrorMessage('No flights found. Our flight search services are currently unavailable.');
//       }
//     } catch (error) {
//       console.error('Flight search error:', error);
//       setSearchFailed(true);
//       setErrorMessage('Flight search services are temporarily unavailable. Please try again later.');
//     } finally {
//       setSearching(false);
//     }
//   };

//   const handleSelectFlight = (flight: FlightResult) => {
//     // Log selection with AI
//     if (isConnected) {
//       sendMessage(`User selected ${flight.airline} flight ${flight.flightNumber} for ₹${flight.price}`);
//     }

//     // Open booking URL
//     window.open(flight.bookingUrl, '_blank', 'noopener,noreferrer');
//   };

//   const openSkyscanner = () => {
//     const skyscannerUrl = `https://www.skyscanner.co.in/transport/flights/${searchParams.origin}/${searchParams.destination}/${searchParams.departureDate?.replace(/-/g, '')}/?adults=${searchParams.passengers}&children=0&adultsv2=${searchParams.passengers}&childrenv2=&infants=0&cabinclass=${searchParams.class}&rtn=0`;
//     window.open(skyscannerUrl, '_blank', 'noopener,noreferrer');
//   };

//   return (
//     <div className="flight-search">
//       <div className="page-header">
//         <h1>✈️ AI Flight Search</h1>
//         <p>Find the best flights with real-time data and AI assistance</p>
//       </div>

//       {/* Search Form */}
//       <div className="search-form">
//         <div className="form-grid">
//           <div className="form-group">
//             <label>From</label>
//             <input
//               type="text"
//               placeholder="Delhi, Mumbai, Bangalore..."
//               value={searchParams.origin}
//               onChange={(e) => handleInputChange('origin', e.target.value)}
//               className="form-input"
//             />
//           </div>

//           <div className="form-group">
//             <label>To</label>
//             <input
//               type="text"
//               placeholder="Mumbai, Chennai, Hyderabad..."
//               value={searchParams.destination}
//               onChange={(e) => handleInputChange('destination', e.target.value)}
//               className="form-input"
//             />
//           </div>

//           <div className="form-group">
//             <label>Departure Date</label>
//             <input
//               type="date"
//               value={searchParams.departureDate}
//               onChange={(e) => handleInputChange('departureDate', e.target.value)}
//               className="form-input"
//               min={new Date().toISOString().split('T')[0]}
//             />
//           </div>

//           <div className="form-group">
//             <label>Passengers</label>
//             <select
//               value={searchParams.passengers}
//               onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
//               className="form-input"
//             >
//               {[1,2,3,4,5,6].map(num => (
//                 <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
//               ))}
//             </select>
//           </div>

//           <div className="form-group">
//             <label>Class</label>
//             <select
//               value={searchParams.class}
//               onChange={(e) => handleInputChange('class', e.target.value)}
//               className="form-input"
//             >
//               <option value="economy">Economy</option>
//               <option value="business">Business</option>
//               <option value="first">First Class</option>
//             </select>
//           </div>
//         </div>

//         <div className="search-actions">
//           <button
//             className="btn btn-primary"
//             onClick={handleSearch}
//             disabled={searching || !searchParams.origin || !searchParams.destination}
//           >
//             {searching ? '🔍 Searching...' : '🔍 Search Flights'}
//           </button>
//         </div>
//       </div>

//       {/* Search Results */}
//       {searching && (
//         <div className="search-status">
//           <div className="spinner"></div>
//           <p>Searching for the best flights...</p>
//           <small>Checking multiple sources for real-time prices</small>
//         </div>
//       )}

//       {searchFailed && (
//         <div className="search-failed">
//           <div className="error-message">
//             <h3>🚫 Flight Search Unavailable</h3>
//             <p>{errorMessage}</p>
//             <p>Our real-time flight search is temporarily unavailable. You can search directly on Skyscanner:</p>

//             <button className="btn btn-skyscanner" onClick={openSkyscanner}>
//               🔗 Search on Skyscanner
//             </button>
//           </div>
//         </div>
//       )}

//       {flights.length > 0 && (
//         <div className="flight-results">
//           <div className="results-header">
//             <h3>✈️ Available Flights</h3>
//             <p>Found {flights.length} flights • Real-time prices</p>
//           </div>

//           <div className="flights-list">
//             {flights.map((flight, index) => (
//               <div key={flight.id} className="flight-card">
//                 <div className="flight-info">
//                   <div className="airline-section">
//                     <h4>{flight.airline}</h4>
//                     <span className="flight-number">{flight.flightNumber}</span>
//                     <span className={`source-badge ${flight.source}`}>
//                       {flight.source === 'serpapi' ? 'Live Data' :
//                        flight.source === 'scraping' ? 'Real-time' : 'Cached'}
//                     </span>
//                   </div>

//                   <div className="time-section">
//                     <div className="time-info">
//                       <span className="time">{flight.departureTime}</span>
//                       <span className="airport">{searchParams.origin}</span>
//                     </div>
//                     <div className="flight-path">
//                       <span className="duration">{flight.duration}</span>
//                       <div className="path-line">
//                         {flight.stops === 0 ? (
//                           <span className="direct">Direct</span>
//                         ) : (
//                           <span className="stops">{flight.stops} stop{flight.stops > 1 ? 's' : ''}</span>
//                         )}
//                       </div>
//                     </div>
//                     <div className="time-info">
//                       <span className="time">{flight.arrivalTime}</span>
//                       <span className="airport">{searchParams.destination}</span>
//                     </div>
//                   </div>

//                   <div className="price-section">
//                     <div className="price">{flight.price}</div>
//                     <button
//                       className="btn btn-select"
//                       onClick={() => handleSelectFlight(flight)}
//                     >
//                       Select Flight →
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="search-alternatives">
//             <p>Want more options?</p>
//             <button className="btn btn-secondary" onClick={openSkyscanner}>
//               🔗 View more on Skyscanner
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FlightSearch;
import React, { useState, useEffect } from 'react';
import { flightService, FlightSearchRequest, FlightResult } from '../services/FlightService';

interface FlightSearchProps {
  socket?: WebSocket | null;
  sendMessage?: (message: string) => void;
  isConnected?: boolean;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  tripType?: 'one-way' | 'round-trip';
}

interface FlightSearchState {
  loading: boolean;
  error: string;
  flights: FlightResult[];
  searchPerformed: boolean;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ socket, sendMessage, isConnected }) => {
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'one-way'
  });

  const [searchState, setSearchState] = useState<FlightSearchState>({
    loading: false,
    error: '',
    flights: [],
    searchPerformed: false
  });

  const popularRoutes = [
    { from: 'Delhi', to: 'Mumbai', code: 'DEL-BOM' },
    { from: 'Bangalore', to: 'Chennai', code: 'BLR-MAA' },
    { from: 'Mumbai', to: 'Goa', code: 'BOM-GOI' },
    { from: 'Delhi', to: 'Bangalore', code: 'DEL-BLR' }
  ];

  const handleInputChange = (field: keyof FlightSearchParams, value: string | number) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      setSearchState(prev => ({
        ...prev,
        error: 'Please fill in all required fields'
      }));
      return;
    }

    setSearchState(prev => ({
      ...prev,
      loading: true,
      error: '',
      searchPerformed: false
    }));

    try {
      const searchRequest: FlightSearchRequest = {
        origin: searchParams.origin,
        destination: searchParams.destination,
        date: searchParams.departureDate,
        passengers: searchParams.passengers || 1
      };

      const results = await flightService.searchFlights(searchRequest);
      
      setSearchState(prev => ({
        ...prev,
        loading: false,
        flights: results,
        searchPerformed: true,
        error: results.length === 0 ? 'No flights found for your search criteria' : ''
      }));

      if (sendMessage && isConnected && socket) {
        sendMessage(`Searched flights from ${searchParams.origin} to ${searchParams.destination} on ${searchParams.departureDate}. Found ${results.length} options.`);
      }

    } catch (error: any) {
      console.error('Flight search error:', error);
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to search flights. Please try again.',
        searchPerformed: true
      }));
    }
  };

  const handleQuickSearch = (route: typeof popularRoutes[0]) => {
    setSearchParams(prev => ({
      ...prev,
      origin: route.from,
      destination: route.to
    }));
  };

  const formatPrice = (price: string) => {
    if (price.includes('₹')) return price;
    return `₹${price}`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="flight-search">
      <div className="search-header">
        <h2>🛫 Flight Search</h2>
        <p>Find the best flights for your business travel</p>
      </div>

      {/* Search Form */}
      <div className="search-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Trip Type</label>
            <select 
              value={searchParams.tripType}
              onChange={(e) => handleInputChange('tripType', e.target.value as 'one-way' | 'round-trip')}
            >
              <option value="one-way">One Way</option>
              <option value="round-trip">Round Trip</option>
            </select>
          </div>
          <div className="form-group">
            <label>Passengers</label>
            <select 
              value={searchParams.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
            >
              {[1,2,3,4,5,6,7,8,9].map(num => (
                <option key={num} value={num}>{num} Passenger{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>From *</label>
            <input
              type="text"
              placeholder="Origin city"
              value={searchParams.origin}
              onChange={(e) => handleInputChange('origin', e.target.value)}
              list="cities"
            />
          </div>
          <div className="form-group">
            <label>To *</label>
            <input
              type="text"
              placeholder="Destination city"
              value={searchParams.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              list="cities"
            />
          </div>
          <div className="form-group">
            <label>Departure Date *</label>
            <input
              type="date"
              value={searchParams.departureDate}
              onChange={(e) => handleInputChange('departureDate', e.target.value)}
              min={getTomorrowDate()}
            />
          </div>
          {searchParams.tripType === 'round-trip' && (
            <div className="form-group">
              <label>Return Date</label>
              <input
                type="date"
                value={searchParams.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                min={searchParams.departureDate || getTomorrowDate()}
              />
            </div>
          )}
        </div>

        <div className="search-actions">
          <button 
            className="btn-select"
            onClick={handleSearch}
            disabled={searchState.loading}
          >
            {searchState.loading ? '🔍 Searching...' : '🔍 Search Flights'}
          </button>
        </div>
      </div>

      {/* Quick Search Options */}
      <div className="quick-routes">
        <h3>Popular Routes</h3>
        <div className="route-buttons">
          {popularRoutes.map((route, index) => (
            <button
              key={index}
              className="route-button"
              onClick={() => handleQuickSearch(route)}
            >
              {route.from} → {route.to}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {searchState.error && (
        <div className="search-failed">
          <div className="error-message">
            <h3>⚠️ {searchState.error}</h3>
          </div>
        </div>
      )}

      {/* Loading State */}
      {searchState.loading && (
        <div className="search-status">
          <div className="loading-spinner"></div>
          <p>Searching for the best flights...</p>
        </div>
      )}

      {/* Search Results */}
      {searchState.searchPerformed && searchState.flights.length > 0 && (
        <div className="flight-results">
          <div className="results-header">
            <h3>✈️ Available Flights ({searchState.flights.length} found)</h3>
          </div>
          <div className="flights-list">
            {searchState.flights.map((flight, index) => (
              <div key={flight.id || index} className="flight-card">
                <div className="flight-info">
                  <div className="airline-section">
                    <h4>{flight.airline}</h4>
                    <span className="flight-number">Flight {flight.id}</span>
                    <span className={`source-badge ${flight.source === 'serpapi' ? 'serpapi' : 'scraping'}`}>
                      {flight.source}
                    </span>
                  </div>
                  
                  <div className="time-section">
                    <div className="time-info">
                      <span className="time">{flight.departure_time}</span>
                      <span className="airport">{searchParams.origin}</span>
                    </div>
                    <div className="flight-path">
                      <span className="duration">{flight.duration}</span>
                      <div className="path-line">
                        {flight.stops === 0 ? (
                          <span className="direct">Direct</span>
                        ) : (
                          <span className="stops">{flight.stops} stop{flight.stops > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="time-info">
                      <span className="time">{flight.arrival_time}</span>
                      <span className="airport">{searchParams.destination}</span>
                    </div>
                  </div>

                  <div className="price-section">
                    <div className="price">{formatPrice(flight.price)}</div>
                    <button 
                      className="btn-select"
                      onClick={() => window.open(flight.bookingUrl, '_blank')}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="search-alternatives">
            <p>Can't find what you're looking for?</p>
            <button 
              className="btn-skyscanner"
              onClick={() => window.open(`https://www.skyscanner.co.in/transport/flights/${searchParams.origin}/${searchParams.destination}/${searchParams.departureDate}`, '_blank')}
            >
              Search on Skyscanner
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchState.searchPerformed && searchState.flights.length === 0 && !searchState.loading && !searchState.error && (
        <div className="search-status">
          <h3>No flights found</h3>
          <p>Try adjusting your search criteria or check back later.</p>
        </div>
      )}

      {/* City suggestions datalist */}
      <datalist id="cities">
        <option value="Delhi" />
        <option value="Mumbai" />
        <option value="Bangalore" />
        <option value="Chennai" />
        <option value="Hyderabad" />
        <option value="Kolkata" />
        <option value="Pune" />
        <option value="Ahmedabad" />
        <option value="Goa" />
        <option value="Kochi" />
        <option value="Jaipur" />
      </datalist>
    </div>
  );
};

export default FlightSearch;