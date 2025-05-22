import React, { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmationChallengeText: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmationChallengeText,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel"
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    setIsConfirmed(inputValue.trim().toLowerCase() === confirmationChallengeText.trim().toLowerCase());
  }, [inputValue, confirmationChallengeText]);

  useEffect(() => {
    // Reset input when modal is closed or opened
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      onClose(); // Close modal after confirmation
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
        aria-labelledby="confirmation-modal-title"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <h2 id="confirmation-modal-title" className="text-xl font-semibold text-sky-700 mb-4">{title}</h2>
        <div className="text-sm text-gray-700 mb-4">
          {message}
        </div>
        <div className="mb-4">
          <label htmlFor="confirmationInput" className="block text-sm font-medium text-gray-700">
            To confirm, type "<span className="font-bold text-red-600">{confirmationChallengeText}</span>" below:
          </label>
          <input
            type="text"
            id="confirmationInput"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            aria-describedby="confirmation-help-text"
          />
          <p id="confirmation-help-text" className="sr-only">Type the exact challenge text to enable confirmation.</p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md shadow-sm transition-colors duration-150"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors duration-150 ${
              isConfirmed ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
            }`}
            aria-disabled={!isConfirmed}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
