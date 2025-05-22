import React, { useState } from 'react';
import { useDairyContext } from '../contexts/DairyContext';
import type { Farmer } from '../types';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal'; // Import the modal

const FarmerForm: React.FC<{ onAddFarmer: (farmer: Omit<Farmer, 'id'>) => void, onClose: () => void }> = ({ onAddFarmer, onClose }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone) {
        // Consider replacing alert with an in-app notification if alerts are blocked
        console.warn("Farmer form validation: All fields are required."); 
        return;
    }
    onAddFarmer({ name, address, phone });
    setName(''); setAddress(''); setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold text-sky-700 mb-4">Add New Farmer</h2>
            <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Add Farmer</button>
            </div>
        </form>
    </div>
  );
};


const FarmersListPage: React.FC = () => {
  const { farmers, addFarmer, getFarmerBalance, deleteFarmer } = useDairyContext();
  const [showForm, setShowForm] = useState(false);

  // State for Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [farmerToDelete, setFarmerToDelete] = useState<{ id: string, name: string } | null>(null);


  const handleDeleteRequest = (farmerId: string, farmerName: string) => {
    console.log(`FarmersListPage: handleDeleteRequest called for ID ${farmerId}, Name: ${farmerName}`);
    setFarmerToDelete({ id: farmerId, name: farmerName });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!farmerToDelete) return;

    console.log(`FarmersListPage: Confirmation received. Proceeding with delete for farmer ID ${farmerToDelete.id}`);
    deleteFarmer(farmerToDelete.id);
    console.log(`FarmersListPage: Farmer ${farmerToDelete.name} (ID: ${farmerToDelete.id}) and all associated records deleted.`);
    
    setIsConfirmModalOpen(false);
    setFarmerToDelete(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-sky-800">Farmers Summary</h1>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
            aria-label="Add New Farmer"
          >
            Add New Farmer
          </button>
        </div>

        {showForm && <FarmerForm onAddFarmer={addFarmer} onClose={() => setShowForm(false)} />}

        {farmers.length === 0 ? (
          <p className="text-gray-600 text-center py-10">No farmers added yet. Click "Add New Farmer" to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmers.map(farmer => (
              <div key={farmer.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-sky-700">{farmer.name}</h2>
                  <p className="text-sm text-gray-600">{farmer.address}</p>
                  <p className="text-sm text-gray-500 mb-2">{farmer.phone}</p>
                  <p className="text-lg font-medium">
                    Balance: <span className={`font-bold ${getFarmerBalance(farmer.id) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rs. {getFarmerBalance(farmer.id).toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="mt-4 flex justify-between items-center space-x-2">
                  <Link 
                    to={`/entry/${farmer.id}`} 
                    className="text-sm text-sky-600 hover:text-sky-800 font-medium py-1 px-2 rounded hover:bg-sky-100 transition-colors"
                    aria-label={`Add milk or payment for ${farmer.name}`}
                  >
                    Add Milk/Payment &rarr;
                  </Link>
                  <button
                    onClick={() => handleDeleteRequest(farmer.id, farmer.name)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium py-1 px-2 rounded hover:bg-red-100 transition-colors"
                    aria-label={`Delete farmer ${farmer.name}`}
                  >
                    Delete Farmer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {farmerToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setFarmerToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Confirm Farmer Deletion"
          message={
            <p>
              Are you sure you want to delete farmer <strong className="text-red-600">{farmerToDelete.name}</strong>?
              <br /> This will also delete all their milk and payment records.
              <br /> This action cannot be undone.
            </p>
          }
          confirmationChallengeText="DELETE FARMER"
        />
      )}
    </>
  );
};

export default FarmersListPage;