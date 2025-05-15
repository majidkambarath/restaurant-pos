import React from "react";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";

const Cart = ({ cart, updateCartQty, removeCartItem, clearCart, getTotal, getTaxAmount, getFinalTotal }) => {
  return (
    <div className="bg-white rounded-lg shadow-md mb-3 border-l-4 border-indigo-500">
      <div className="bg-indigo-50 p-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-indigo-800 flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Cart Items
        </h2>
        <button
          onClick={clearCart}
          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 flex items-center"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Cart
        </button>
      </div>
      <div className="overflow-auto max-h-48">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cart.map((item) => (
              <tr key={item.itemId} className="hover:bg-indigo-50">
                <td className="px-2 py-2">{item.slNo}</td>
                <td className="px-2 py-2">{item.itemName}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center space-x-1">
                    <button
                      className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"
                      onClick={() => updateCartQty(item.itemId, item.qty - 1)}
                      disabled={item.qty <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="text"
                      className="w-10 p-1 border border-gray-300 text-center text-sm focus:ring-2 focus:ring-indigo-500"
                      value={item.qty}
                      onChange={(e) => updateCartQty(item.itemId, e.target.value)}
                      min="1"
                    />
                    <button
                      className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"
                      onClick={() => updateCartQty(item.itemId, item.qty + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-2">AED {item.rate.toFixed(2)}</td>
                <td className="px-2 py-2 font-medium">AED {item.amount.toFixed(2)}</td>
                <td className="px-2 py-2">
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeCartItem(item.itemId)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {cart.length === 0 && (
              <tr>
                <td colSpan="6" className="px-2 py-6 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <ShoppingCart className="h-8 w-8 text-gray-400 mb-2" />
                    <p>Your cart is empty</p>
                    <p className="text-xs mt-1">Add items to continue</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {cart.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">AED {getTotal()}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">VAT (5%):</span>
            <span className="font-medium">AED {getTaxAmount()}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-1">
            <span className="text-indigo-800">Total:</span>
            <span className="text-indigo-800">AED {getFinalTotal()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;