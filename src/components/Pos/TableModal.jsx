import React from "react";
import { X } from "lucide-react";

const TableModal = ({ show, onClose, tables, selectTable }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Select Table</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3 max-h-80 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {tables.map((table) => {
              const isOccupied = false; // Replace with backend logic
              return (
                <div
                  key={table.Code}
                  className={`border rounded-lg p-3 text-center cursor-pointer ${
                    isOccupied ? "bg-red-50 border-red-200 cursor-not-allowed" : "bg-white border-gray-200 hover:border-indigo-400"
                  }`}
                  onClick={() => !isOccupied && selectTable(table)}
                >
                  <div className="text-base font-semibold text-gray-800 mb-1">Table {table.Code}</div>
                  <div className="text-xs text-gray-500">Capacity: {table.Capacity} seats</div>
                  <div
                    className={`text-xs mt-1 font-medium rounded-full px-2 py-1 ${
                      isOccupied ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isOccupied ? "Occupied" : "Available"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg w-full"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableModal;