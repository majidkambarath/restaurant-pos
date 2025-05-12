import React, { useRef } from "react";

const ReceiptTemplate = ({ order, onPrint }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 10px;
              width: 80mm; /* Standard receipt width */
              font-size: 12px;
              color: #000;
            }
            .receipt {
              padding: 5px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .business-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .info {
              margin-bottom: 5px;
              font-size: 11px;
            }
            .title {
              font-weight: bold;
              text-align: center;
              margin: 5px 0;
              font-size: 13px;
            }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 5px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .item-name {
              flex: 2;
            }
            .item-qty {
              flex: 1;
              text-align: center;
            }
            .item-price {
              flex: 1;
              text-align: right;
            }
            .totals {
              margin-top: 10px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .total-label {
              text-align: left;
            }
            .total-value {
              text-align: right;
              font-weight: bold;
            }
            .grand-total {
              font-weight: bold;
              font-size: 13px;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 10px;
            }
            @media print {
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    if (onPrint) onPrint();
  };

  // Calculate totals
  const subtotal = order.cart.reduce((sum, item) => sum + item.amount, 0);
  const vatRate = 0.05; // 5% VAT
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;
  const discount = 0.04; // Example discount amount
  const grandTotal = Math.round((total - discount) * 100) / 100;

  // Current date formatted
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Preview and Print Button */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Receipt Preview
        </h3>

        {/* Receipt Preview */}
        <div
          ref={printRef}
          className="receipt bg-white p-4 border border-gray-200 rounded-lg"
          style={{
            fontFamily: "Courier New, monospace",
            fontSize: "12px",
            maxWidth: "300px",
            margin: "0 auto",
          }}
        >
          <div className="header">
            <div className="business-name">FOODVISTA RESTAURANT</div>
            <div className="info">SONAPUR, DUBAI - UAE</div>
            <div className="info">Phone: {order.contactNo || "N/A"}</div>
            <div className="info">TRN: 100000000000001</div>
          </div>

          <div className="title">TAX INVOICE</div>

          <div className="info">Date: {currentDate}</div>
          <div className="info">Invoice #: {order.orderNo || "1.0"}</div>
          <div className="info">
            Customer: {order.customerName || "WALK-IN CUSTOMER"}
          </div>

          <div className="divider"></div>

          <div className="item-row" style={{ fontWeight: "bold" }}>
            <div className="item-name">Item</div>
            <div className="item-qty">Qty</div>
            <div className="item-price">Price (AED)</div>
          </div>

          <div className="divider"></div>

          {order.cart.map((item, index) => (
            <div key={index} className="item-row">
              <div className="item-name">{item.name}</div>
              <div className="item-qty">{item.qty}</div>
              <div className="item-price">{item.amount.toFixed(2)}</div>
            </div>
          ))}

          <div className="divider"></div>

          <div className="totals">
            <div className="total-row">
              <div className="total-label">Subtotal (Excl. VAT):</div>
              <div className="total-value">AED {subtotal.toFixed(2)}</div>
            </div>
            <div className="total-row">
              <div className="total-label">VAT Amount:</div>
              <div className="total-value">AED {vatAmount.toFixed(2)}</div>
            </div>
            <div className="total-row">
              <div className="total-label">Total (Incl. VAT):</div>
              <div className="total-value">AED {total.toFixed(2)}</div>
            </div>
            <div className="total-row">
              <div className="total-label">Discount:</div>
              <div className="total-value">AED {discount.toFixed(2)}</div>
            </div>
            <div className="total-row grand-total">
              <div className="total-label">Grand Total:</div>
              <div className="total-value">AED {grandTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="footer">
            <p>Thank you for your business!</p>
            {order.orderType === "Dine In" && (
              <p>Table: {order.tableNo || "N/A"}</p>
            )}
            {order.remarks && <p>Note: {order.remarks}</p>}
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

// Modified POS System Component with Print Receipt functionality
const EnhancedPOSSystemWithReceipt = () => {
  const [formData, setFormData] = React.useState({
    orderNo: "1",
    customerName: "",
    address: "",
    flatNo: "",
    contactNo: "",
    orderTakenBy: "",
    tableNo: "",
    selectedSeats: "",
    orderType: "Dine In",
    remarks: "",
  });

  const [cart, setCart] = React.useState([]);
  const [currentQty, setCurrentQty] = React.useState("1");
  const [currentItem, setCurrentItem] = React.useState(null);
  const [activeCategory, setActiveCategory] = React.useState("BURGER");
  const [showTableModal, setShowTableModal] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuCategories = [
    { id: 1, name: "BURGER", color: "bg-blue-600" },
    { id: 2, name: "CHICKEN BURGER", color: "bg-indigo-600" },
    { id: 3, name: "PIZZA", color: "bg-red-600" },
    { id: 4, name: "DRINKS", color: "bg-teal-600" },
    { id: 5, name: "SIDES", color: "bg-green-600" },
    { id: 6, name: "DESSERTS", color: "bg-pink-600" },
  ];

  const menuItems = {
    BURGER: [
      { id: 1, name: "Classic Burger", price: 5.99 },
      { id: 2, name: "Cheese Burger", price: 6.99 },
      { id: 3, name: "Veggie Burger", price: 5.49 },
    ],
    "CHICKEN BURGER": [
      { id: 4, name: "Grilled Chicken", price: 7.99 },
      { id: 5, name: "Spicy Chicken", price: 8.49 },
      { id: 6, name: "BBQ Chicken", price: 8.99 },
    ],
    PIZZA: [
      { id: 7, name: "Margherita", price: 9.99 },
      { id: 8, name: "Pepperoni", price: 11.99 },
      { id: 9, name: "Vegetarian", price: 10.99 },
    ],
    DRINKS: [
      { id: 10, name: "Cola", price: 1.99 },
      { id: 11, name: "Lemonade", price: 1.49 },
      { id: 12, name: "Water", price: 0.99 },
    ],
    SIDES: [
      { id: 13, name: "French Fries", price: 2.99 },
      { id: 14, name: "Onion Rings", price: 3.49 },
      { id: 15, name: "Coleslaw", price: 1.99 },
    ],
    DESSERTS: [
      { id: 16, name: "Chocolate Cake", price: 4.99 },
      { id: 17, name: "Ice Cream", price: 3.49 },
      { id: 18, name: "Apple Pie", price: 3.99 },
    ],
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addToCart = (item) => {
    const qty = Number(currentQty || 1);
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      const updatedCart = cart.map((cartItem) =>
        cartItem.id === item.id
          ? {
              ...cartItem,
              qty: cartItem.qty + qty,
              amount: (cartItem.qty + qty) * cartItem.rate,
            }
          : cartItem
      );
      setCart(updatedCart);
    } else {
      const newItem = {
        id: item.id,
        slNo: cart.length + 1,
        name: item.name,
        qty,
        rate: item.price,
        amount: qty * item.price,
      };
      setCart([...cart, newItem]);
    }
    setCurrentQty("1");
    setCurrentItem(null);
  };

  const updateCartQty = (itemId, newQty) => {
    const qty = Number(newQty) || 1;
    const updatedCart = cart.map((item) =>
      item.id === itemId ? { ...item, qty, amount: qty * item.rate } : item
    );
    setCart(updatedCart);
  };

  const applyCurrentQtyToSelectedItem = () => {
    if (currentItem) {
      addToCart(currentItem);
    } else if (cart.length > 0) {
      // Apply to last added item if no specific item is selected
      const lastItem = cart[cart.length - 1];
      updateCartQty(lastItem.id, currentQty);
    }
  };

  const removeCartItem = (itemId) => {
    const updatedCart = cart
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({ ...item, slNo: index + 1 }));
    setCart(updatedCart);
  };

  const appendToQty = (digit) => {
    if (digit === "clear") {
      setCurrentQty("1");
    } else if (digit === ".") {
      if (!currentQty.includes(".")) setCurrentQty((prev) => prev + ".");
    } else if (digit === "00") {
      setCurrentQty((prev) => prev + "00");
    } else {
      setCurrentQty((prev) =>
        prev === "0" || prev === "1" ? String(digit) : prev + digit
      );
    }
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.amount, 0).toFixed(2);
  const getTaxAmount = () => (parseFloat(getTotal()) * 0.05).toFixed(2);
  const getFinalTotal = () =>
    (parseFloat(getTotal()) + parseFloat(getTaxAmount())).toFixed(2);

  const clearCart = () => setCart([]);

  const selectTable = (table, seats) => {
    setFormData((prev) => ({ ...prev, tableNo: table, selectedSeats: seats }));
    setShowTableModal(false);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredMenuItems = searchQuery
    ? Object.values(menuItems)
        .flat()
        .filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : menuItems[activeCategory];

  const handlePrintReceipt = () => {
    setShowReceiptModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h1 className="text-2xl font-bold tracking-wide">FoodVista POS</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium">{formatDate(currentTime)}</p>
              <p className="text-sm text-blue-200">{formatTime(currentTime)}</p>
            </div>
          </div>
          <div className="bg-blue-800 px-3 py-1 rounded-full text-sm">
            Active
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-72px)]">
        {/* Left Section - Order Details and Cart */}
        <div className="w-full md:w-1/2 p-4 overflow-auto bg-gray-100">
          {/* Order Information */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-4 border-l-4 border-blue-500 transition-all hover:shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-blue-800">
                Order Information
              </h2>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                Order #{formData.orderNo}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <input
                    className="w-full p-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.customerName}
                    onChange={(e) =>
                      handleInputChange("customerName", e.target.value)
                    }
                    placeholder="Enter customer name"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
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
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contact No
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.contactNo}
                  onChange={(e) =>
                    handleInputChange("contactNo", e.target.value)
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Address
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Flat No
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.flatNo}
                  onChange={(e) => handleInputChange("flatNo", e.target.value)}
                  placeholder="Flat #"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Order Taken By
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.orderTakenBy}
                  onChange={(e) =>
                    handleInputChange("orderTakenBy", e.target.value)
                  }
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
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:from-blue-600 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
                onClick={() => setShowTableModal(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Table No
                  </label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    value={formData.tableNo}
                    readOnly
                    placeholder="--"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Seats
                  </label>
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

          {/* Cart Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-blue-500 transition-all hover:shadow-lg mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-blue-800 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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
                className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear All
              </button>
            </div>
            <div className="overflow-auto max-h-56">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50 transition-all"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.slNo}
                      </td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1">
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l-lg hover:bg-gray-300 transition-all"
                            onClick={() => updateCartQty(item.id, item.qty - 1)}
                            disabled={item.qty <= 1}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <input
                            type="text"
                            className="w-12 p-1 border border-gray-300 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={item.qty}
                            onChange={(e) =>
                              updateCartQty(item.id, e.target.value)
                            }
                            min="1"
                          />
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r-lg hover:bg-gray-300 transition-all"
                            onClick={() => updateCartQty(item.id, item.qty + 1)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
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
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">${item.rate.toFixed(2)}</td>
                      <td className="px-3 py-2 font-medium">
                        ${item.amount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="text-red-500 hover:text-red-700 transition-all"
                          onClick={() => removeCartItem(item.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
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
                  <span className="font-medium">${getTotal()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">VAT (5%):</span>
                  <span className="font-medium">${getTaxAmount()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1 pb-2 border-b border-gray-300">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium">$0.04</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-1">
                  <span className="text-blue-800">Total:</span>
                  <span className="text-blue-800">${getFinalTotal()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Order Type & Notes Section */}
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500 transition-all hover:shadow-lg">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Order Type
                </label>
                <div className="flex space-x-2">
                  {["Dine In", "Takeaway", "Delivery"].map((type) => (
                    <button
                      key={type}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        formData.orderType === type
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => handleInputChange("orderType", type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Remarks
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Add any special instructions here..."
                  rows="2"
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                onClick={handlePrintReceipt}
                disabled={cart.length === 0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print Receipt
              </button>
              <button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                disabled={cart.length === 0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Complete Order
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Menu Items */}
        <div className="w-full md:w-1/2 bg-gray-50 p-4 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                className="w-full p-3 pl-10 pr-4 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                type="text"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-3 text-gray-400"
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
              {searchQuery && (
                <button
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Menu Categories */}
          {!searchQuery && (
            <div className="mb-4 overflow-x-auto">
              <div className="flex space-x-2 min-w-max">
                {menuCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      activeCategory === category.name
                        ? `${category.color} text-white`
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveCategory(category.name)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenuItems &&
                filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500 flex flex-col justify-between"
                    onClick={() => {
                      setCurrentItem(item);
                      addToCart(item);
                    }}
                  >
                    <div className="mb-2">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                    </div>
                    <div className="text-blue-600 font-medium">
                      ${item.price.toFixed(2)}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Quantity Keypad */}
          <div className="mt-4 bg-white rounded-xl p-3 shadow-md">
            <div className="flex mb-2 items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700">Quantity</h3>
                <p className="text-xs text-gray-500">
                  Select quantity for item
                </p>
              </div>
              <div className="bg-blue-100 text-blue-800 rounded-lg px-4 py-2 text-lg font-bold">
                {currentQty}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "00"].map((num) => (
                <button
                  key={num}
                  className="bg-gray-100 rounded-lg p-3 text-center text-gray-800 hover:bg-gray-200 transition-all"
                  onClick={() => appendToQty(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                className="bg-red-100 text-red-700 rounded-lg p-3 text-center hover:bg-red-200 transition-all font-medium"
                onClick={() => appendToQty("clear")}
              >
                Clear
              </button>
              <button
                className="bg-green-100 text-green-700 rounded-lg p-3 text-center hover:bg-green-200 transition-all font-medium"
                onClick={applyCurrentQtyToSelectedItem}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Selection Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-white/40 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowTableModal(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Select Table
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((table) => (
                <button
                  key={table}
                  className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-all"
                  onClick={() => selectTable(table, "2")}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-800 mb-1">
                      T-{table}
                    </div>
                    <div className="text-xs text-gray-500">2 Seats</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[10, 11].map((table) => (
                <button
                  key={table}
                  className="bg-indigo-50 rounded-lg p-4 hover:bg-indigo-100 transition-all"
                  onClick={() => selectTable(table, "4")}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-800 mb-1">
                      T-{table}
                    </div>
                    <div className="text-xs text-gray-500">4 Seats</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-white/40 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-auto">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowReceiptModal(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Receipt</h2>

            <ReceiptTemplate
              order={{
                orderNo: formData.orderNo,
                customerName: formData.customerName,
                contactNo: formData.contactNo,
                tableNo: formData.tableNo,
                orderType: formData.orderType,
                remarks: formData.remarks,
                cart: cart,
              }}
              onPrint={() => setShowReceiptModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPOSSystemWithReceipt;
