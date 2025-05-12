import React from 'react';

const OrderInformation = ({ formData, handleInputChange, setShowTableModal }) => (
  <div className="bg-white p-4 rounded-xl shadow-md mb-4 border-l-4 border-blue-500">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-lg font-semibold text-blue-800">Order Information</h2>
      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
        Order #{formData.orderNo}
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
        <div className="relative">
          <input
            className="w-full p-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            placeholder="Enter customer name"
          />
          <svg
            className="h-4 w-4 absolute left-2 top-2.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Contact No</label>
        <input
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.contactNo}
          onChange={(e) => handleInputChange('contactNo', e.target.value)}
          placeholder="Enter phone number"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
        <input
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Enter address"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Flat No</label>
        <input
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.flatNo}
          onChange={(e) => handleInputChange('flatNo', e.target.value)}
          placeholder="Flat #"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Order Taken By</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.orderTakenBy}
          onChange={(e) => handleInputChange('orderTakenBy', e.target.value)}
        >
          <option value="">Select Staff</option>
          <option value="Staff 1">John Doe</option>
          <option value="Staff 2">Jane Smith</option>
          <option value="Staff 3">Robert Johnson</option>
        </select>
      </div>
    </div>
    <div className="mt-4 flex items-center space-x-4">
      <button
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm hover:shadow-md flex items-center"
        onClick={() => setShowTableModal(true)}
      >
        <svg
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Select Table
      </button>
      <div className="flex-1 flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Table No</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            value={formData.tableNo}
            readOnly
            placeholder="--"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Seats</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            value={formData.selectedSeats}
            readOnly
            placeholder="--"
          />
        </div>
      </div>
    </div>
  </div>
);

export default OrderInformation;