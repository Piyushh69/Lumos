// import React, { useState } from 'react';

// const FlightSearch: React.FC = () => {
//   const [origin, setOrigin] = useState('');
//   const [destination, setDestination] = useState('');
//   const [date, setDate] = useState('');
//   const [searching, setSearching] = useState(false);
//   const [results, setResults] = useState<any[]>([]);

//   const handleSearch = async () => {
//     if (!origin || !destination) {
//       alert('Please enter both origin and destination');
//       return;
//     }

//     setSearching(true);
    
//     setTimeout(() => {
//       setResults([
//         { airline: 'IndiGo', price: '₹8,500', time: '08:30 AM', duration: '2h 15m' },
//         { airline: 'Air India', price: '₹12,200', time: '02:15 PM', duration: '2h 30m' },
//         { airline: 'SpiceJet', price: '₹7,800', time: '06:45 PM', duration: '2h 20m' }
//       ]);
//       setSearching(false);
//     }, 2000);
//   };

//   return (
//     <div>
//       <h2 style={{marginBottom: '20px'}}>Flight Search</h2>
      
//       <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px'}}>
//         <div className="form-group">
//           <label className="form-label">From</label>
//           <input 
//             type="text" 
//             className="form-input"
//             placeholder="Delhi"
//             value={origin}
//             onChange={(e) => setOrigin(e.target.value)}
//           />
//         </div>
        
//         <div className="form-group">
//           <label className="form-label">To</label>
//           <input 
//             type="text" 
//             className="form-input"
//             placeholder="Mumbai"
//             value={destination}
//             onChange={(e) => setDestination(e.target.value)}
//           />
//         </div>
        
//         <div className="form-group">
//           <label className="form-label">Date</label>
//           <input 
//             type="date" 
//             className="form-input"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//           />
//         </div>
//       </div>

//       <button 
//         className="btn btn-primary" 
//         onClick={handleSearch}
//         disabled={searching}
//       >
//         {searching ? 'Searching...' : 'Search Flights'}
//       </button>

//       {results.length > 0 && (
//         <div style={{marginTop: '30px'}}>
//           <h3>Flight Results</h3>
//           <div className="stats-grid">
//             {results.map((flight, index) => (
//               <div key={index} className="stat-card">
//                 <h4>{flight.airline}</h4>
//                 <div className="stat-number" style={{fontSize: '1.5rem'}}>{flight.price}</div>
//                 <p>Departure: {flight.time}</p>
//                 <p>Duration: {flight.duration}</p>
//                 <button className="btn btn-secondary" style={{marginTop: '10px'}}>
//                   Select Flight
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // export default FlightSearch;
export {}