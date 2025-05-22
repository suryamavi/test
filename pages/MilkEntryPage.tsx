import React, { useState, useEffect } from 'react';
import { useDairyContext } from '../contexts/DairyContext';
import { useParams, useNavigate } from 'react-router-dom';
import type { Farmer, MilkRecord, Payment } from '../types';

const MilkEntryPage: React.FC = () => {
  const { farmers, addMilkRecord, addPayment, getFarmerBalance, getRecordsForFarmer, milkRecords, payments } = useDairyContext();
  const { farmerId: routeFarmerId } = useParams<{ farmerId: string }>();
  const navigate = useNavigate();

  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(routeFarmerId || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [morningLiters, setMorningLiters] = useState<string>('');
  const [morningLactometer, setMorningLactometer] = useState<string>('');
  const [eveningLiters, setEveningLiters] = useState<string>('');
  const [eveningLactometer, setEveningLactometer] = useState<string>('');
  
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const [farmerHistory, setFarmerHistory] = useState<{ milkRecords: MilkRecord[], payments: Payment[] } | null>(null);
  const [formMessage, setFormMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


  useEffect(() => {
    if (routeFarmerId) {
        setSelectedFarmerId(routeFarmerId);
    }
  }, [routeFarmerId]);

  useEffect(() => {
    if (selectedFarmerId) {
      setFarmerHistory(getRecordsForFarmer(selectedFarmerId));
    } else {
      setFarmerHistory(null);
    }
  }, [selectedFarmerId, getRecordsForFarmer, milkRecords, payments]);


  const handleMilkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!selectedFarmerId || !date) {
      setFormMessage({type: 'error', text: "Please select a farmer and date."});
      console.warn("MilkEntryPage: Farmer or date not selected for milk entry.");
      return;
    }
    if (!morningLiters && !eveningLiters) {
        setFormMessage({type: 'error', text: "Please enter at least morning or evening milk quantity."});
        console.warn("MilkEntryPage: No milk quantity entered.");
        return;
    }

    addMilkRecord({
      farmerId: selectedFarmerId,
      date,
      morningLiters: morningLiters ? parseFloat(morningLiters) : undefined,
      morningLactometer: morningLactometer ? parseFloat(morningLactometer) : undefined,
      eveningLiters: eveningLiters ? parseFloat(eveningLiters) : undefined,
      eveningLactometer: eveningLactometer ? parseFloat(eveningLactometer) : undefined,
    });
    setFormMessage({type: 'success', text: 'Milk record added successfully!'});
    console.log('Milk record added successfully!');
    // Clear form
    setMorningLiters(''); setMorningLactometer(''); setEveningLiters(''); setEveningLactometer('');
    // Optionally clear message after a few seconds
    setTimeout(() => setFormMessage(null), 3000);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!selectedFarmerId || !date || !paymentAmount) {
      setFormMessage({type: 'error', text: "Please select farmer, date, and enter payment amount."});
      console.warn("MilkEntryPage: Farmer, date, or payment amount missing.");
      return;
    }
    addPayment({
      farmerId: selectedFarmerId,
      date,
      amount: parseFloat(paymentAmount),
      notes: paymentNotes,
    });
    setFormMessage({type: 'success', text: 'Payment recorded successfully!'});
    console.log('Payment recorded successfully!');
    setPaymentAmount(''); setPaymentNotes('');
    setTimeout(() => setFormMessage(null), 3000);
  };
  
  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-sky-800">Milk & Payment Entry</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <label htmlFor="farmer-select" className="block text-sm font-medium text-gray-700 mb-1">Select Farmer</label>
        <select 
          id="farmer-select" 
          value={selectedFarmerId} 
          onChange={e => {
            setSelectedFarmerId(e.target.value);
            setFormMessage(null); // Clear message on farmer change
            if (e.target.value) navigate(`/entry/${e.target.value}`, { replace: true });
            else navigate('/entry', {replace: true});
          }}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="">-- Select a Farmer --</option>
          {farmers.map(farmer => (
            <option key={farmer.id} value={farmer.id}>{farmer.name} ({farmer.address})</option>
          ))}
        </select>
      </div>

      {selectedFarmer && (
        <div className="mt-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
            <h3 className="text-lg font-semibold text-sky-700">{selectedFarmer.name}</h3>
            <p className="text-sm text-gray-600">Current Balance: 
                <span className={`font-bold ${getFarmerBalance(selectedFarmer.id) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     Rs. {getFarmerBalance(selectedFarmer.id).toFixed(2)}
                </span>
            </p>
        </div>
      )}
      
      {formMessage && (
        <div className={`p-3 rounded-md text-sm ${formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {formMessage.text}
        </div>
      )}

      {selectedFarmerId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Milk Entry Form */}
          <form onSubmit={handleMilkSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-sky-700">Record Milk Collection</h2>
            <div>
              <label htmlFor="date-milk" className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" id="date-milk" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-medium text-gray-700 px-1">Morning</legend>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="morningLiters" className="block text-xs font-medium text-gray-700">Liters</label>
                        <input type="number" step="0.1" id="morningLiters" value={morningLiters} onChange={e => setMorningLiters(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="morningLactometer" className="block text-xs font-medium text-gray-700">Lactometer</label>
                        <input type="number" step="0.1" id="morningLactometer" value={morningLactometer} onChange={e => setMorningLactometer(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                    </div>
                </div>
            </fieldset>
            <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-medium text-gray-700 px-1">Evening</legend>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="eveningLiters" className="block text-xs font-medium text-gray-700">Liters</label>
                        <input type="number" step="0.1" id="eveningLiters" value={eveningLiters} onChange={e => setEveningLiters(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="eveningLactometer" className="block text-xs font-medium text-gray-700">Lactometer</label>
                        <input type="number" step="0.1" id="eveningLactometer" value={eveningLactometer} onChange={e => setEveningLactometer(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                    </div>
                </div>
            </fieldset>
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md">Add Milk Record</button>
          </form>

          {/* Payment Form */}
          <form onSubmit={handlePaymentSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-sky-700">Record Payment</h2>
             <div>
              <label htmlFor="date-payment" className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" id="date-payment" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">Amount (Rs.)</label>
              <input type="number" step="0.01" id="paymentAmount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
              <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea id="paymentNotes" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"></textarea>
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md">Record Payment</button>
          </form>
        </div>
      )}

      {farmerHistory && (farmerHistory.milkRecords.length > 0 || farmerHistory.payments.length > 0) && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-sky-700 mb-4">Transaction History for {selectedFarmer?.name}</h3>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {farmerHistory.milkRecords.map(mr => (
                  <tr key={mr.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{mr.date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-500">Milk</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                        M: {mr.morningLiters || 0}L @{mr.morningLactometer || 0} (Rs.{mr.morningAmount.toFixed(2)})<br/>
                        E: {mr.eveningLiters || 0}L @{mr.eveningLactometer || 0} (Rs.{mr.eveningAmount.toFixed(2)})
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{mr.totalDailyAmount.toFixed(2)}</td>
                  </tr>
                ))}
                {farmerHistory.payments.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{p.date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-500">Payment</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{p.notes || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 text-right">-{p.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkEntryPage;