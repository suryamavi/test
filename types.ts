
export interface Farmer {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface MilkRecord {
  id: string;
  farmerId: string;
  date: string; // YYYY-MM-DD
  morningLiters?: number;
  morningLactometer?: number;
  eveningLiters?: number;
  eveningLactometer?: number;
  morningAmount: number;
  eveningAmount: number;
  totalDailyAmount: number;
}

export interface Payment {
  id: string;
  farmerId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes?: string;
}

export interface LactometerRate {
  reading: number; // e.g., 20 to 40
  rate: number;    // e.g., price per liter
}

export interface LactometerRateChart {
  [reading: number]: number;
}
    