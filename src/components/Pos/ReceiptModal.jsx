import React from "react";
import { X, Printer } from "lucide-react";
import ReceiptTemplate from "./ReceiptTemplate";

const ReceiptModal = ({ show, onClose, order, onPrint }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Receipt Preview</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3 max-h-[60vh] overflow-y-auto bg-gray-50">
          <ReceiptTemplate order={order} onPrint={onPrint} />
        </div>
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-2">
            <button
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-center"
              onClick={onPrint}
            >
              <Printer className="h-5 w-5 mr-2" />
              Print & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;