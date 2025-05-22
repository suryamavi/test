
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FarmersListPage from './pages/FarmersListPage';
import MilkEntryPage from './pages/MilkEntryPage';
import LactometerRatesPage from './pages/LactometerRatesPage';
import ReportsPage from './pages/ReportsPage';
import SummaryReportPage from './pages/SummaryReportPage'; // Import new page
import { useDairyContext } from './contexts/DairyContext';

const App: React.FC = () => {
  const { isLoading } = useDairyContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-xl font-semibold text-sky-700">Loading Dairy Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<FarmersListPage />} />
          <Route path="/entry" element={<MilkEntryPage />} />
          <Route path="/entry/:farmerId" element={<MilkEntryPage />} />
          <Route path="/rates" element={<LactometerRatesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/summary-report" element={<SummaryReportPage />} /> {/* Add new route */}
        </Routes>
      </main>
      <footer className="bg-sky-800 text-center text-white py-3 text-sm">
        Dairy Collection Manager &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
