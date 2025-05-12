import React from 'react';

const TableModal = ({ selectTable, setShowTableModal }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        onClick={() => setShowTableModal(false)}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Select Table</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((table) => (
          <button
            key={table}
            className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100"
            onClick={() => selectTable(table, '2')}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800 mb-1">T-{table}</div>
              <div className="text-xs text-gray-500">2 Seats</div>
            </div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[10, 11].map((table) => (
          <button
            key={table}
            className="bg-indigo-50 rounded-lg p-4 hover:bg-indigo-100"
            onClick={() => selectTable(table, '4')}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-800 mb-1">T-{table}</div>
              <div className="text-xs text-gray-500">4 Seats</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default TableModal;