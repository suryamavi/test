
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Farmer, MilkRecord, Payment, LactometerRateChart } from '../types';

interface DairyContextType {
  farmers: Farmer[];
  milkRecords: MilkRecord[];
  payments: Payment[];
  lactometerRates: LactometerRateChart;
  addFarmer: (farmer: Omit<Farmer, 'id'>) => void;
  deleteFarmer: (farmerId: string) => void;
  addMilkRecord: (record: Omit<MilkRecord, 'id' | 'morningAmount' | 'eveningAmount' | 'totalDailyAmount'>) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  deleteMilkRecord: (recordId: string) => void;
  deletePayment: (paymentId: string) => void;
  updateLactometerRate: (reading: number, rate: number) => void;
  getLactometerRate: (reading: number) => number;
  getFarmerBalance: (farmerId: string) => number;
  getRecordsForFarmer: (farmerId: string) => { milkRecords: MilkRecord[], payments: Payment[] };
  getAllTransactions: () => Array<{ id: string, originalType: 'milk' | 'payment', date: string, farmerName: string, amount: number, details: string }>;
  isLoading: boolean;
}

const DairyContext = createContext<DairyContextType | undefined>(undefined);

// Simple ID generator
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialLactometerRates: LactometerRateChart = {};
for (let i = 20; i <= 40; i++) {
    initialLactometerRates[i] = 30; // Default rate
}

export const DairyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lactometerRates, setLactometerRates] = useState<LactometerRateChart>(initialLactometerRates);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedFarmers = localStorage.getItem('dairyFarmers');
      if (storedFarmers) setFarmers(JSON.parse(storedFarmers));

      const storedMilkRecords = localStorage.getItem('dairyMilkRecords');
      if (storedMilkRecords) setMilkRecords(JSON.parse(storedMilkRecords));

      const storedPayments = localStorage.getItem('dairyPayments');
      if (storedPayments) setPayments(JSON.parse(storedPayments));
      
      const storedLactometerRates = localStorage.getItem('dairyLactometerRates');
      if (storedLactometerRates) setLactometerRates(JSON.parse(storedLactometerRates));
      else setLactometerRates(initialLactometerRates);

    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('dairyFarmers', JSON.stringify(farmers));
  }, [farmers, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('dairyMilkRecords', JSON.stringify(milkRecords));
  }, [milkRecords, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('dairyPayments', JSON.stringify(payments));
  }, [payments, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('dairyLactometerRates', JSON.stringify(lactometerRates));
  }, [lactometerRates, isLoading]);

  const getLactometerRate = useCallback((reading: number): number => {
    return lactometerRates[Math.round(reading)] || 0; // Default to 0 if rate not found
  }, [lactometerRates]);

  const addFarmer = (farmerData: Omit<Farmer, 'id'>) => {
    const newFarmer: Farmer = { ...farmerData, id: generateId() };
    setFarmers(prev => [...prev, newFarmer]);
  };

  const deleteFarmer = (farmerId: string) => {
    // console.log('DairyContext: Deleting farmer', farmerId);
    setFarmers(prev => prev.filter(f => f.id !== farmerId));
    setMilkRecords(prev => prev.filter(mr => mr.farmerId !== farmerId));
    setPayments(prev => prev.filter(p => p.farmerId !== farmerId));
    // Alert moved to FarmersListPage
  };

  const addMilkRecord = (recordData: Omit<MilkRecord, 'id' | 'morningAmount' | 'eveningAmount' | 'totalDailyAmount'>) => {
    const morningAmount = (recordData.morningLiters || 0) * getLactometerRate(recordData.morningLactometer || 0);
    const eveningAmount = (recordData.eveningLiters || 0) * getLactometerRate(recordData.eveningLactometer || 0);
    const totalDailyAmount = morningAmount + eveningAmount;

    const newRecord: MilkRecord = {
      ...recordData,
      id: generateId(),
      morningAmount,
      eveningAmount,
      totalDailyAmount,
    };
    setMilkRecords(prev => [...prev, newRecord]);
  };

  const addPayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = { ...paymentData, id: generateId() };
    setPayments(prev => [...prev, newPayment]);
  };
  
  const deleteMilkRecord = (recordId: string) => {
    // console.log('DairyContext: Deleting milk record', recordId);
    setMilkRecords(prev => prev.filter(mr => mr.id !== recordId));
  };

  const deletePayment = (paymentId: string) => {
    // console.log('DairyContext: Deleting payment', paymentId);
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  const updateLactometerRate = (reading: number, rate: number) => {
    setLactometerRates(prev => ({ ...prev, [reading]: rate }));
  };

  const getFarmerBalance = useCallback((farmerId: string): number => {
    // console.log('DairyContext: Calculating farmer balance for', farmerId, 'Milk Records:', milkRecords.length, 'Payments:', payments.length);
    const totalMilkValue = milkRecords
      .filter(r => r.farmerId === farmerId)
      .reduce((sum, r) => sum + r.totalDailyAmount, 0);
    const totalPaymentsMade = payments
      .filter(p => p.farmerId === farmerId)
      .reduce((sum, p) => sum + p.amount, 0);
    return totalMilkValue - totalPaymentsMade;
  }, [milkRecords, payments]);

  const getRecordsForFarmer = useCallback((farmerId: string) => {
    return {
      milkRecords: milkRecords.filter(r => r.farmerId === farmerId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      payments: payments.filter(p => p.farmerId === farmerId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [milkRecords, payments]);
  
  const getAllTransactions = useCallback(() => {
    const transactions: Array<{ id: string, originalType: 'milk' | 'payment', date: string, farmerName: string, amount: number, details: string }> = [];
    milkRecords.forEach(mr => {
        const farmer = farmers.find(f => f.id === mr.farmerId);
        transactions.push({
            id: mr.id,
            originalType: 'milk',
            date: mr.date,
            farmerName: farmer?.name || 'Unknown Farmer',
            amount: mr.totalDailyAmount,
            details: `Morning: ${mr.morningLiters || 0}L @ ${mr.morningLactometer || 0} (Rs. ${mr.morningAmount.toFixed(2)}), Evening: ${mr.eveningLiters || 0}L @ ${mr.eveningLactometer || 0} (Rs. ${mr.eveningAmount.toFixed(2)})`
        });
    });
    payments.forEach(p => {
        const farmer = farmers.find(f => f.id === p.farmerId);
        transactions.push({
            id: p.id,
            originalType: 'payment',
            date: p.date,
            farmerName: farmer?.name || 'Unknown Farmer',
            amount: -p.amount, 
            details: `Payment made. Notes: ${p.notes || 'N/A'}`
        });
    });
    return transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [milkRecords, payments, farmers]);


  return (
    <DairyContext.Provider value={{ 
        farmers, milkRecords, payments, lactometerRates, 
        addFarmer, deleteFarmer,
        addMilkRecord, addPayment, 
        deleteMilkRecord, deletePayment,
        updateLactometerRate, 
        getLactometerRate, getFarmerBalance, getRecordsForFarmer,
        getAllTransactions, isLoading 
    }}>
      {children}
    </DairyContext.Provider>
  );
};

export const useDairyContext = (): DairyContextType => {
  const context = useContext(DairyContext);
  if (context === undefined) {
    throw new Error('useDairyContext must be used within a DairyProvider');
  }
  return context;
};
