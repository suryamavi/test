
import React, { useMemo } from 'react';
import { useDairyContext } from '../contexts/DairyContext';
import { jsPDF } from 'jspdf';
import autoTable, { CellInput } from 'jspdf-autotable';

interface FarmerSummary {
  id: string;
  name: string;
  totalMilkValue: number;
  totalPayments: number;
  balance: number;
}

const SummaryReportPage: React.FC = () => {
  // console.log('SummaryReportPage: Rendering/Re-rendering');
  const { farmers, milkRecords, payments, getFarmerBalance } = useDairyContext();

  const summaryData = useMemo<FarmerSummary[]>(() => {
    // console.log('SummaryReportPage: Recalculating summaryData. Farmers:', farmers.length, 'MilkRecords:', milkRecords.length, 'Payments:', payments.length);
    if (!farmers || farmers.length === 0) {
      return [];
    }
    return farmers.map(farmer => {
      // getFarmerBalance is used here. It's a useCallback from context that depends on milkRecords and payments.
      // If milkRecords or payments change, getFarmerBalance gets a new identity.
      // The useMemo for summaryData also depends on farmers, milkRecords, payments directly.
      const balance = getFarmerBalance(farmer.id); 
      
      // For totalMilkValue and totalPayments, we calculate them directly here for the summary,
      // as getFarmerBalance only provides the final balance.
      const totalMilkValue = milkRecords
        .filter(mr => mr.farmerId === farmer.id)
        .reduce((sum, mr) => sum + mr.totalDailyAmount, 0);
      
      const totalPayments = payments
        .filter(p => p.farmerId === farmer.id)
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        id: farmer.id,
        name: farmer.name,
        totalMilkValue,
        totalPayments,
        balance, // This comes from getFarmerBalance
      };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [farmers, milkRecords, payments, getFarmerBalance]); // Keep getFarmerBalance in deps as it's directly used and its identity change matters.

  const overallTotals = useMemo(() => {
    const totalMilk = summaryData.reduce((sum, s) => sum + s.totalMilkValue, 0);
    const totalPaid = summaryData.reduce((sum, s) => sum + s.totalPayments, 0);
    const totalBalance = summaryData.reduce((sum, s) => sum + s.balance, 0); // sum of individual balances
    return { totalMilk, totalPaid, totalBalance };
  }, [summaryData]);

  const downloadCSV = () => {
    if (summaryData.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["Farmer Name", "Total Milk (Rs.)", "Total Payments (Rs.)", "Balance (Rs.)"];
    const csvRows = summaryData.map(row => [
      `"${row.name}"`,
      row.totalMilkValue.toFixed(2),
      row.totalPayments.toFixed(2),
      row.balance.toFixed(2)
    ].join(','));
    
    csvRows.push(''); 
    csvRows.push([
        `"Overall Totals"`,
        overallTotals.totalMilk.toFixed(2),
        overallTotals.totalPaid.toFixed(2),
        overallTotals.totalBalance.toFixed(2)
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `farmer_summary_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (summaryData.length === 0) {
      alert("No data to export.");
      return;
    }
  
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Farmer Summary Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
  
    const tableHeaders = [["Farmer Name", "Total Milk (Rs.)", "Total Payments (Rs.)", "Balance (Rs.)"]];
    const tableBody: CellInput[][] = summaryData.map(row => [
      row.name,
      row.totalMilkValue.toFixed(2),
      row.totalPayments.toFixed(2),
      row.balance.toFixed(2)
    ]);

    tableBody.push([
        { content: 'Overall Totals', colSpan: 1, styles: { fontStyle: 'bold', halign: 'left' } },
        { content: overallTotals.totalMilk.toFixed(2), styles: { fontStyle: 'bold', halign: 'right'} },
        { content: overallTotals.totalPaid.toFixed(2), styles: { fontStyle: 'bold', halign: 'right'} },
        { content: overallTotals.totalBalance.toFixed(2), styles: { fontStyle: 'bold', halign: 'right'} }
    ]);
  
    autoTable(doc, {
      startY: 38,
      head: tableHeaders,
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 136, 229], textColor: [255,255,255], fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 'auto' }, 
        1: { halign: 'right', cellWidth: 40 }, 
        2: { halign: 'right', cellWidth: 40 }, 
        3: { halign: 'right', cellWidth: 40 }, 
      },
      didDrawPage: (data) => {
        // Optional: Add footer or page numbers
      },
      didParseCell: function (data) {
        if (data.column.index === 3 && data.cell.section === 'body' && data.row.index < summaryData.length) { 
            const balance = parseFloat(String(data.cell.raw));
            if (!isNaN(balance) && balance < 0) {
                data.cell.styles.textColor = [255, 0, 0];
            }
        }
        if (data.row.index === summaryData.length && data.cell.section === 'body') { 
            if (data.cell.styles) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = '#f0f0f0'; 
              if(data.column.index === 0) data.cell.styles.halign = 'left';
            }
            if (data.column.index === 3) {
                const overallBalanceVal = parseFloat(String(data.cell.raw));
                if (!isNaN(overallBalanceVal) && overallBalanceVal < 0) {
                     data.cell.styles.textColor = [255, 0, 0];
                } else if (!isNaN(overallBalanceVal)) {
                     data.cell.styles.textColor = [0, 128, 0]; 
                }
            }
        }
      }
    });
  
    doc.save(`farmer_summary_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sky-800">Farmer Summary Report</h1>
        <div className="flex space-x-3">
            <button 
                onClick={downloadCSV} 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                disabled={summaryData.length === 0}
                aria-label="Export summary report as CSV"
            >
                Export as CSV
            </button>
            <button 
                onClick={downloadPDF} 
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                disabled={summaryData.length === 0}
                aria-label="Export summary report as PDF"
            >
                Export as PDF
            </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        {summaryData.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No farmer data available to generate a summary report. Add farmers and their records first.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer Name</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Milk (Rs.)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payments (Rs.)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance (Rs.)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryData.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{row.totalMilkValue.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{row.totalPayments.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                    <td className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase">Overall Totals:</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-700">{overallTotals.totalMilk.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-700">{overallTotals.totalPaid.toFixed(2)}</td>
                    <td className={`px-6 py-3 text-right text-sm font-bold ${overallTotals.totalBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {overallTotals.totalBalance.toFixed(2)}
                    </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryReportPage;
