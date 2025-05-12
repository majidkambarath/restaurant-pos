import React from 'react';

const Keypad = ({ currentQty, appendToQty, applyCurrentQtyToSelectedItem }) => (
  <div className="mt-4 bg-white rounded-xl p-3 shadow-md">
    <div className="flex mb-2 items-center">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-700">Quantity</h3>
        <p className="text-xs text-gray-500">Select quantity for item</p>
      </div>
      <div className="bg-blue-100 text-blue-800 rounded-lg px-4 py-2 text-lg font-bold">
        {currentQty}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '00'].map((num) => (
        <button
          key={num}
          className="bg-gray-100 rounded-lg p-3 text-center text-gray-800 hover:bg-gray-200"
          onClick={() => appendToQty(num)}
        >
          {num}
        </button>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2 mt-2">
      <button
        className="bg-red-100 text-red-700 rounded-lg p-3 text-center hover:bg-red-200 font-medium"
        onClick={() => appendToQty('clear')}
      >
        Clear
      </button>
      <button
        className="bg-green-100 text-green-700 rounded-lg p-3 text-center hover:bg-green-200 font-medium"
        onClick={applyCurrentQtyToSelectedItem}
      >
        Apply
      </button>
    </div>
  </div>
);

export default Keypad;