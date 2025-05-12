import React from 'react';

const CartTable = ({ cart, updateCartQty, removeCartItem, clearCart, totals }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-blue-500">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 flex justify-between items-center">
      <h2 className="text-lg font-semibold text-blue-800 flex items-center">
        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        Cart Items
      </h2>
      <button
        onClick={clearCart}
        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 flex items-center"
      >
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear All
      </button>
    </div>
    <div className="overflow-auto max-h-56">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cart.map((item) => (
            <tr key={item.id} className="hover:bg-blue-50">
              <td className="px-3 py-2 whitespace-nowrap">{item.slNo}</td>
              <td className="px-3 py-2">{item.name}</td>
              <td className="px-3 py-2">
                <div className="flex items-center space-x-1">
                  <button
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l-lg hover:bg-gray-300"
                    onClick={() => updateCartQty(item.id, item.qty - 1)}
                    disabled={item.qty <= 1}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    className="w-12 p-1 border border-gray-300 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.qty}
                    onChange={(e) => updateCartQty(item.id, e.target.value)}
                    min="1"
                  />
                  <button
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r-lg hover:bg-gray-300"
                    onClick={() => updateCartQty(item.id, item.qty + 1)}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </td>
              <td className="px-3 py-2">${item.rate.toFixed(2)}</td>
              <td className="px-3 py-2 font-medium">${item.amount.toFixed(2)}</td>
              <td className="px-3 py-2">
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeCartItem(item.id)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
          {cart.length === 0 && (
            <tr>
              <td colSpan="6" className="px-3 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="h-10 w-10 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
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
          <span className="font-medium">${totals.subtotal}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">VAT (5%):</span>
          <span className="font-medium">${totals.vat}</span>
        </div>
        <div className="flex justify-between text-sm mb-1 pb-2 border-b border-gray-300">
          <span className="text-gray-600">Discount:</span>
          <span className="font-medium">${totals.discount}</span>
        </div>
        <div className="flex justify-between text-base font-semibold pt-1">
          <span className="text-blue-800">Total:</span>
          <span className="text-blue-800">${totals.grandTotal}</span>
        </div>
      </div>
    )}
  </div>
);

export default CartTable;