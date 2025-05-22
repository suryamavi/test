import React, { useState } from 'react';
import { useDairyContext } from '../contexts/DairyContext';

const LactometerRatesPage: React.FC = () => {
  const { lactometerRates, updateLactometerRate } = useDairyContext();
  
  const [currentRates, setCurrentRates] = useState<{ [reading: number]: string }>(() => {
    const initial: { [reading: number]: string } = {};
    Object.entries(lactometerRates).forEach(([reading, rate]) => {
      initial[Number(reading)] = rate.toString();
    });
    return initial;
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string, reading: number | null } | null>(null);


  const handleRateChange = (reading: number, value: string) => {
    setCurrentRates(prev => ({ ...prev, [reading]: value }));
    setMessage(null); // Clear message on change
  };

  const handleSaveRate = (reading: number) => {
    const rateValue = parseFloat(currentRates[reading]);
    if (!isNaN(rateValue) && rateValue >=0) {
      updateLactometerRate(reading, rateValue);
      setMessage({type: 'success', text: `Rate for reading ${reading} updated to ${rateValue}.`, reading: reading});
      console.log(`Rate for reading ${reading} updated to ${rateValue}.`);
    } else {
      setMessage({type: 'error', text: "Invalid rate. Please enter a positive number.", reading: reading});
      console.warn(`Invalid rate value for reading ${reading}.`);
      // Revert to stored value if invalid
      setCurrentRates(prev => ({...prev, [reading]: (lactometerRates[reading] || '0').toString()}));
    }
    setTimeout(() => setMessage(null), 4000);
  };
  
  const readings = Array.from({ length: 21 }, (_, i) => 20 + i); // 20 to 40

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-sky-800">Lactometer Rate Configuration</h1>
      <p className="text-gray-600">Set the rate (Price per Liter) for each lactometer reading point (20 to 40).</p>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {readings.map(reading => (
            <div key={reading} className="p-4 border border-gray-200 rounded-lg">
              <label htmlFor={`rate-${reading}`} className="block text-sm font-medium text-gray-700">
                Reading: <span className="font-bold text-sky-600">{reading}</span>
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  Rs.
                </span>
                <input 
                  type="number" 
                  step="0.01"
                  id={`rate-${reading}`} 
                  value={currentRates[reading] || lactometerRates[reading]?.toString() || '0'}
                  onChange={(e) => handleRateChange(reading, e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-sky-500 focus:border-sky-500 sm:text-sm border-gray-300"
                />
              </div>
               <button 
                onClick={() => handleSaveRate(reading)}
                className="mt-2 w-full text-xs bg-sky-500 hover:bg-sky-600 text-white py-1 px-2 rounded-md transition duration-150"
              >
                Save Rate for {reading}
              </button>
              {message && message.reading === reading && (
                <p className={`mt-2 text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message.text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 p-4 bg-sky-50 rounded-lg border border-sky-200">
        <h3 className="text-md font-semibold text-sky-700">Note:</h3>
        <p className="text-sm text-gray-600">
          The "Calculated Amount" for milk collection will be: Liters × Rate (for the given Lactometer Reading).
          If a specific reading does not have a rate, it might default to 0 or a pre-set value. Ensure all relevant readings have appropriate rates.
        </p>
      </div>
    </div>
  );
};

export default LactometerRatesPage;