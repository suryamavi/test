import React, { useState, useMemo } from 'react';
import { useDairyContext } from '../contexts/DairyContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ConfirmationModal from '../components/ConfirmationModal'; // Import the modal

type ReportType = 'all' | 'farmer' | 'customRange' | 'monthly';

interface ReportRow {
  id: string;
  originalType: 'milk' | 'payment';
  displayType: string; 
  date: string;
  farmer: string;
  details: string;
  amount: number;
}

const ReportsPage: React.FC = () => {
  const { 
    farmers, 
    milkRecords,
    payments,
    getAllTransactions, 
    getRecordsForFarmer, 
    getFarmerBalance,
    deleteMilkRecord,
    deletePayment
  } = useDairyContext();

  const [reportType, setReportType] = useState<ReportType>('all');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); 

  // State for Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, originalType: 'milk' | 'payment', name: string } | null>(null);


  const reportData: ReportRow[] = useMemo(() => {
    const mapTransactionToReportRow = (
      t: ReturnType<typeof getAllTransactions>[0] 
    ): ReportRow => ({
      id: t.id,
      originalType: t.originalType,
      displayType: t.originalType === 'milk' ? 'Milk Collection' : 'Payment',
      date: t.date,
      farmer: t.farmerName, 
      details: t.details,
      amount: t.amount,
    });

    switch (reportType) {
      case 'farmer':
        if (!selectedFarmerId) return [];
        const farmerDetails = getRecordsForFarmer(selectedFarmerId);
        const currentFarmer = farmers.find(f => f.id === selectedFarmerId);
        const farmerName = currentFarmer?.name || 'Unknown Farmer';
        
        const farmerMilkRows: ReportRow[] = farmerDetails.milkRecords.map(mr => ({
            id: mr.id,
            originalType: 'milk',
            displayType: 'Milk Collection',
            date: mr.date,
            farmer: farmerName,
            details: `M: ${mr.morningLiters || 0}L@${mr.morningLactometer||0} (Rs.${mr.morningAmount.toFixed(2)}), E: ${mr.eveningLiters||0}L@${mr.eveningLactometer||0} (Rs.${mr.eveningAmount.toFixed(2)})`,
            amount: mr.totalDailyAmount,
        }));
        const farmerPaymentRows: ReportRow[] = farmerDetails.payments.map(p => ({
            id: p.id,
            originalType: 'payment',
            displayType: 'Payment',
            date: p.date,
            farmer: farmerName,
            details: p.notes || 'N/A',
            amount: -p.amount, 
        }));
        return [...farmerMilkRows, ...farmerPaymentRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      case 'customRange':
        const rangeStart = new Date(startDate);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999);
        return getAllTransactions()
          .filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= rangeStart && transactionDate <= rangeEnd;
          })
          .map(mapTransactionToReportRow);

      case 'monthly':
        return getAllTransactions()
          .filter(t => t.date.startsWith(selectedMonth))
          .map(mapTransactionToReportRow);
      
      case 'all':
      default:
        return getAllTransactions().map(mapTransactionToReportRow);
    }
  }, [
    reportType, selectedFarmerId, startDate, endDate, selectedMonth, 
    farmers, milkRecords, payments, 
    getAllTransactions, getRecordsForFarmer
  ]);

  const handleDeleteRequest = (transactionId: string, transactionOriginalType: 'milk' | 'payment', farmerName: string, date: string) => {
    const typeName = transactionOriginalType === 'milk' ? 'milk record' : 'payment';
    setItemToDelete({ id: transactionId, originalType: transactionOriginalType, name: `transaction for ${farmerName} on ${date} (Type: ${typeName})`});
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    const { id, originalType, name } = itemToDelete;
    const typeName = originalType === 'milk' ? 'milk record' : 'payment';
    console.log(`ReportsPage: Confirmed delete for ID ${id}, type ${typeName}`);
    
    if (originalType === 'milk') {
      deleteMilkRecord(id);
    } else {
      deletePayment(id);
    }
    
    console.log(`ReportsPage: ${typeName} with ID ${id} (associated with ${name}) deleted.`);
    // No alert needed here as the modal confirms action.
    
    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };


  const downloadCSV = () => {
    if (reportData.length === 0) {
      // Consider replacing alert with an in-app notification if alerts are blocked
      console.warn("Attempted to download CSV with no data.");
      return;
    }
    const headers = ["Type", "Date", "Farmer", "Details", "Amount (Rs.)"];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        `"${row.displayType}"`,
        `"${row.date}"`,
        `"${row.farmer}"`,
        `"${row.details.replace(/"/g, '""')}"`, 
        row.amount.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dairy_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (reportData.length === 0) {
      console.warn("Attempted to download PDF with no data.");
      return;
    }
  
    const doc = new jsPDF();
    
    const reportTitleText = `Dairy Report: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;
    let specificCriteria = "";
    if (reportType === 'farmer' && selectedFarmerId) {
      const farmerName = farmers.find(f => f.id === selectedFarmerId)?.name;
      specificCriteria = `Farmer: ${farmerName || 'Unknown'}`;
    } else if (reportType === 'customRange') {
      specificCriteria = `Date Range: ${startDate} to ${endDate}`;
    } else if (reportType === 'monthly') {
      specificCriteria = `Month: ${selectedMonth}`;
    }
  
    doc.setFontSize(16);
    doc.text(reportTitleText, 14, 22);
    if (specificCriteria) {
      doc.setFontSize(11);
      doc.text(specificCriteria, 14, 30);
    }
  
    const tableHeaders = [["Type", "Date", "Farmer", "Details", "Amount (Rs.)"]];
    const tableBody = reportData.map(row => [
      row.displayType,
      row.date,
      row.farmer,
      row.details.length > 70 ? row.details.substring(0, 67) + "..." : row.details,
      row.amount.toFixed(2)
    ]);
  
    autoTable(doc, {
      startY: specificCriteria ? 38 : 32,
      head: tableHeaders,
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 136, 229], textColor: [255,255,255], fontSize:9 },
      columnStyles: {
        0: { cellWidth: 30 }, 
        1: { cellWidth: 20 }, 
        2: { cellWidth: 35 }, 
        3: { cellWidth: 'auto' }, 
        4: { cellWidth: 25, halign: 'right' }, 
      },
      didParseCell: function (data) {
        if (data.column.index === 4 && data.cell.section === 'body') {
            const amount = parseFloat(String(data.cell.raw)); 
            if (!isNaN(amount) && amount < 0) { 
                data.cell.styles.textColor = [255, 0, 0]; 
            }
        }
    }
    });
  
    doc.save(`dairy_report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const selectedFarmerForBalance = farmers.find(f => f.id === selectedFarmerId);

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-sky-800">Reports</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">Report Type</label>
            <select 
              id="reportType" 
              value={reportType} 
              onChange={e => setReportType(e.target.value as ReportType)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="all">All Transactions</option>
              <option value="farmer">Individual Farmer Report</option>
              <option value="customRange">Custom Date Range</option>
              <option value="monthly">Monthly Summary</option>
            </select>
          </div>

          {reportType === 'farmer' && (
            <div>
              <label htmlFor="farmer-select-report" className="block text-sm font-medium text-gray-700">Select Farmer</label>
              <select 
                id="farmer-select-report" 
                value={selectedFarmerId} 
                onChange={e => setSelectedFarmerId(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value="">-- Select Farmer --</option>
                {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              {selectedFarmerId && selectedFarmerForBalance && ( 
                  <p className="mt-2 text-sm text-gray-600">Current Balance: 
                      <span className={`font-bold ${getFarmerBalance(selectedFarmerForBalance.id) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Rs. {getFarmerBalance(selectedFarmerForBalance.id).toFixed(2)}
                      </span>
                  </p>
              )}
            </div>
          )}

          {reportType === 'customRange' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
            </div>
          )}

          {reportType === 'monthly' && (
            <div>
              <label htmlFor="monthly-month" className="block text-sm font-medium text-gray-700">Select Month</label>
              <input type="month" id="monthly-month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
          )}
          <div className="flex space-x-3 pt-2">
              <button 
                  onClick={downloadCSV} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                  disabled={reportData.length === 0}
                  aria-label="Export report data as CSV"
              >
                  Export as CSV
              </button>
              <button 
                  onClick={downloadPDF} 
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                  disabled={reportData.length === 0}
                  aria-label="Export report data as PDF"
              >
                  Export as PDF
              </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-sky-700 mb-4">Report Data</h2>
          {reportData.length === 0 ? (
            <p className="text-gray-500">No data available for the selected criteria. Select filters above to generate a report.</p>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Rs.)</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((row) => (
                    <tr key={row.id} className={reportData.indexOf(row) % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{row.displayType}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{row.farmer}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate" title={row.details}>{row.details}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-semibold ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteRequest(row.id, row.originalType, row.farmer, row.date)}
                          className="text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors duration-150"
                          title={`Delete this ${row.originalType === 'milk' ? 'milk entry' : 'payment'}`}
                          aria-label={`Delete ${row.originalType} transaction for ${row.farmer} on ${row.date}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {itemToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          message={
            <p>
              Are you sure you want to delete this item: <strong className="text-red-600">{itemToDelete.name}</strong>?
              <br /> This action cannot be undone.
            </p>
          }
          confirmationChallengeText="DELETE"
        />
      )}
    </>
  );
};

export default ReportsPage;