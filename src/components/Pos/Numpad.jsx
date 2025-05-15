import React from "react";
import { Check } from "lucide-react";

const Numpad = ({ currentQty, appendToQty, applyCurrentQtyToSelectedItem }) => {
  return (
    <div className="bg-gray-100 rounded-lg shadow-inner p-3 mt-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Quantity</h3>
        <div className="bg-white rounded-lg px-3 py-1 text-lg font-bold text-indigo-700 min-w-16 text-center">
          {currentQty}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, "00", "."].map((num) => (
          <button
            key={num}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-2 rounded-lg"
            onClick={() => appendToQty(num)}
          >
            {num}
          </button>
        ))}
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg"
          onClick={() => appendToQty("clear")}
        >
          C
        </button>
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg col-span-2"
          onClick={applyCurrentQtyToSelectedItem}
        >
          <Check className="h-4 w-4 inline mr-1" />
          Apply
        </button>
      </div>
    </div>
  );
};

export default Numpad;