import React from "react";
import { CreditCard, Plus } from "lucide-react";

const OrderInfo = ({ formData, handleInputChange, setShowTableModal, employees }) => {
  return (
    <div className="bg-white p-3 rounded-lg shadow-md mb-3 border-l-4 border-indigo-500">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-indigo-800">Order Information</h2>
        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
          Order #{formData.orderNo}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Customer ID</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.custId}
            onChange={(e) => handleInputChange("custId", e.target.value)}
            placeholder="Enter customer ID"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.custName}
            onChange={(e) => handleInputChange("custName", e.target.value)}
            placeholder="Enter customer name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contact No</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.contact}
            onChange={(e) => handleInputChange("contact", e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Flat No</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.flat}
            onChange={(e) => handleInputChange("flat", e.target.value)}
            placeholder="Flat #"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="Enter address"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Staff</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.delBoy}
            onChange={(e) => handleInputChange("delBoy", e.target.value)}
          >
            <option value="">Select Staff</option>
            {employees.map((emp) => (
              <option key={emp.Code} value={emp.Code}>
                {emp.EmpName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-600 flex items-center"
            onClick={() => setShowTableModal(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Select Table
          </button>
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
              value={formData.selectedSeats || "--"}
              readOnly
              placeholder="--"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInfo;