import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReceiptTemplate from "./components/Pos/ReceiptTemplate";
import axios from "./api/axios";

const EnhancedPOSSystemWithReceipt = () => {
  const [formData, setFormData] = useState({
    orderNo: "0",
    custId: "",
    custName: "",
    flat: "",
    address: "",
    contact: "",
    delBoy: "",
    tableId: "",
    tableNo: "",
    remarks: "",
    total: 0,
    status: "Dine In", // Maps to option: 2
    prefix: "ORD",
    eDate: "",
    time: "",
    holdedOrder: "0",
  });

  const [cart, setCart] = useState([]);
  const [currentQty, setCurrentQty] = useState("1");
  const [currentItem, setCurrentItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate a random customer ID when component mounts
  useEffect(() => {
    generateRandomCustomerId();
  }, []);

  // Function to generate a random customer ID
  const generateRandomCustomerId = () => {
    const randomId = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    setFormData(prev => ({ ...prev, custId: randomId.toString() }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch latest order number
        const orderResponse = await axios.get("/order/latest");
        const latestOrderNo = orderResponse.data.data.orderNo || "0";
        setFormData((prev) => ({
          ...prev,
          orderNo: String(parseInt(latestOrderNo)),
          eDate: formatDate(new Date()),
          time: formatTime(new Date()),
        }));

        // Fetch tables
        const tablesResponse = await axios.get("/tables-seats");
        setTables(tablesResponse.data.data);

        // Fetch categories
        const categoriesResponse = await axios.get("/categories");
        const fetchedCategories = categoriesResponse.data.data.map((cat) => ({
          id: cat.Code,
          name: cat.GrpName,
        }));
        setCategories(fetchedCategories);
        setActiveCategory(fetchedCategories[0]?.name || null);

        // Fetch items
        const itemsResponse = await axios.get("/items", {
          params: { search: "", limit: 100, offset: 0 },
        });
        setItems(itemsResponse.data.data);

        // Fetch employees
        const employeesResponse = await axios.get("/employees");
        setEmployees(employeesResponse.data.data);
      } catch (err) {
        setError("Failed to fetch initial data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Effect for debounced search
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearchQuery) {
        setLoading(true);
        try {
          const response = await axios.get("/items", {
            params: { search: debouncedSearchQuery, limit: 100, offset: 0 },
          });
          setItems(response.data.data);
        } catch (err) {
          setError("Failed to fetch search results.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSearchResults();
  }, [debouncedSearchQuery]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Add item to cart
  const addToCart = useCallback(
    (item) => {
      const qty = Number(currentQty || 1);
      const existingItem = cart.find(
        (cartItem) => cartItem.itemId === item.ItemId
      );

      if (existingItem) {
        setCart((prev) =>
          prev.map((cartItem) =>
            cartItem.itemId === item.ItemId
              ? {
                  ...cartItem,
                  qty: cartItem.qty + qty,
                  amount: (cartItem.qty + qty) * cartItem.rate,
                }
              : cartItem
          )
        );
      } else {
        const newItem = {
          itemId: item.ItemId,
          slNo: cart.length + 1,
          itemCode: item.ItemCode,
          itemName: item.ItemName,
          qty,
          rate: item.Rate,
          amount: qty * item.Rate,
          cost: 0, // Adjust based on backend requirements
          vat: 5, // 5% VAT as per backend
          vatAmt: (qty * item.Rate * 0.05).toFixed(2),
          taxLedger: 0,
          arabic: "",
          notes: "",
        };
        setCart((prev) => [...prev, newItem]);
      }
      setCurrentQty("1");
      setCurrentItem(null);
    },
    [cart, currentQty]
  );

  // Update cart quantity
  const updateCartQty = useCallback((itemId, newQty) => {
    const qty = Number(newQty) || 1;
    setCart((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              qty,
              amount: qty * item.rate,
              vatAmt: (qty * item.rate * 0.05).toFixed(2),
            }
          : item
      )
    );
  }, []);

  // Apply current quantity
  const applyCurrentQtyToSelectedItem = useCallback(() => {
    if (currentItem) {
      addToCart(currentItem);
    } else if (cart.length > 0) {
      const lastItem = cart[cart.length - 1];
      updateCartQty(lastItem.itemId, currentQty);
    }
  }, [currentItem, cart, currentQty, addToCart, updateCartQty]);

  // Remove item from cart
  const removeCartItem = useCallback((itemId) => {
    setCart((prev) =>
      prev
        .filter((item) => item.itemId !== itemId)
        .map((item, index) => ({ ...item, slNo: index + 1 }))
    );
  }, []);

  // Append digits to quantity
  const appendToQty = useCallback((digit) => {
    setCurrentQty((prev) => {
      if (digit === "clear") return "1";
      if (digit === "." && !prev.includes(".")) return prev + ".";
      if (digit === "00") return prev + "00";
      return prev === "0" || prev === "1" ? String(digit) : prev + digit;
    });
  }, []);

  // Calculate totals
  const getTotal = useCallback(
    () => cart.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
    [cart]
  );
  const getTaxAmount = useCallback(
    () => (parseFloat(getTotal()) * 0.05).toFixed(2),
    [getTotal]
  );
  const getFinalTotal = useCallback(
    () => (parseFloat(getTotal()) + parseFloat(getTaxAmount())).toFixed(2),
    [getTotal, getTaxAmount]
  );

  // Clear cart
  const clearCart = useCallback(() => setCart([]), []);

  // Clear all form fields
  const clearAllFields = useCallback(() => {
    // Generate a new random customer ID
    const randomId = Math.floor(10000 + Math.random() * 90000);
    
    setFormData((prev) => ({
      ...prev,
      custId: randomId.toString(),
      custName: "",
      flat: "",
      address: "",
      contact: "",
      delBoy: "",
      tableId: "",
      tableNo: "",
      remarks: "",
      total: 0,
      status: "Dine In",
    }));
    
    clearCart();
    setCurrentQty("1");
    setCurrentItem(null);
  }, [clearCart]);

  // Select table
  const selectTable = useCallback((table) => {
    setFormData((prev) => ({
      ...prev,
      tableId: table.Id,
      tableNo: table.Code,
      selectedSeats: table.Capacity,
    }));
    setShowTableModal(false);
  }, []);

  // Format date and time
  const formatDate = (date) =>
    date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    if (searchQuery) {
      return items.filter(
        (item) =>
          item.ItemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.ItemCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return items.filter((item) =>
      activeCategory
        ? item.GrpId ===
          categories.find((cat) => cat.name === activeCategory)?.id
        : true
    );
  }, [searchQuery, items, activeCategory, categories]);

  // Handle receipt printing
  const handlePrintReceipt = useCallback(() => {
    setShowReceiptModal(true);
  }, []);

  // Handle save order
  const handleSaveOrder = useCallback(
    async (fromPrint = false) => {
      if (cart.length === 0) {
        setError("Cart is empty. Add items to save the order.");
        return;
      }

      const orderTypeMap = {
        "Dine In": 2,
        Takeaway: 3,
        Delivery: 1,
      };

      const orderData = {
        orderNo: formData.orderNo,
        status: fromPrint ? "KOT" : "NEW", // Set status based on context
        date: formData.eDate,
        time: formData.time,
        option: orderTypeMap[formData.status],
        custId: formData.custId || "0",
        custName: formData.custName || "",
        flatNo: formData.flat || "",
        address: formData.address || "",
        contact: formData.contact || "",
        deliveryBoyId: formData.delBoy || "0",
        tableId: formData.tableId || "0",
        tableNo: formData.tableNo || "",
        remarks: formData.remarks || "",
        total: parseFloat(getFinalTotal()),
        prefix: formData.prefix,
        items: cart.map((item) => ({
          slNo: item.slNo,
          itemCode: item.itemCode,
          itemName: item.itemName,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
          cost: item.cost,
          vat: item.vat,
          vatAmt: item.vatAmt,
          taxLedger: item.taxLedger,
          arabic: item.arabic,
          notes: item.notes,
        })),
        holdedOrder: formData.holdedOrder,
      };

      setLoading(true);
      try {
        const response = await axios.post("/orders", orderData);
        setCart([]);
        // Generate a new random customer ID
        const randomId = Math.floor(10000 + Math.random() * 90000);
        
        setFormData((prev) => ({
          ...prev,
          orderNo: String(parseInt(prev.orderNo) + 1),
          custId: randomId.toString(),
          custName: "",
          flat: "",
          address: "",
          contact: "",
          delBoy: "",
          tableId: "",
          tableNo: "",
          remarks: "",
          total: 0,
          status: "Dine In",
          eDate: formatDate(new Date()),
          time: formatTime(new Date()),
          holdedOrder: "0",
        }));
        setShowReceiptModal(false);
        alert("Order saved successfully!");
        return response.data.data.orderNo;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to save order.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [cart, formData, getFinalTotal]
  );

  // Handle category click
  const handleCategoryClick = useCallback(
    async (categoryName) => {
      setActiveCategory(categoryName);
      setSearchQuery("");
      setLoading(true);
      try {
        const grpId = categories.find((cat) => cat.name === categoryName)?.id;
        const response = await axios.get("/items", {
          params: { search: "", limit: 100, offset: 0, grpId },
        });
        setItems(response.data.data);
      } catch (err) {
        setError("Failed to fetch items for category.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [categories]
  );

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

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
          <div className="bg-white p-4 rounded-xl shadow-md mb-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-blue-800">
                Order Information
              </h2>
              <div className="flex space-x-2">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  Order #{formData.orderNo}
                </div>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium"
                  onClick={clearAllFields}
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Customer ID
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  value={formData.custId}
                  readOnly
                  placeholder="Auto-generated"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Customer Name
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.custName}
                  onChange={(e) =>
                    handleInputChange("custName", e.target.value)
                  }
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contact No
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.contact}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Flat No
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.flat}
                  onChange={(e) => handleInputChange("flat", e.target.value)}
                  placeholder="Flat #"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Address
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assigned Staff
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
            </div>
            
            {/* Table selection - Only show when Dine In is selected */}
            {formData.status === "Dine In" && (
              <div className="mt-4 flex items-center space-x-4">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center"
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
                      value={formData.selectedSeats || "--"}
                      readOnly
                      placeholder="--"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="bg-white rounded-xl shadow-md mb-4 border-l-4 border-blue-500">
            <div className="bg-blue-50 p-3 flex justify-between items-center">
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
                className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 flex items-center"
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      S.No
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Rate
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr key={item.itemId} className="hover:bg-blue-50">
                      <td className="px-3 py-2">{item.slNo}</td>
                      <td className="px-3 py-2">{item.itemName}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1">
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l-lg hover:bg-gray-300"
                            onClick={() =>
                              updateCartQty(item.itemId, item.qty - 1)
                            }
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
                            className="w-12 p-1 border border-gray-300 text-center text-sm focus:ring-2 focus:ring-blue-500"
                            value={item.qty}
                            onChange={(e) =>
                              updateCartQty(item.itemId, e.target.value)
                            }
                            min="1"
                          />
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r-lg hover:bg-gray-300"
                            onClick={() =>
                              updateCartQty(item.itemId, item.qty + 1)
                            }
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
                      <td className="px-3 py-2">AED {item.rate.toFixed(2)}</td>
                      <td className="px-3 py-2 font-medium">
                        AED {item.amount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeCartItem(item.itemId)}
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
                        <div className="flex flex-col items-center">
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
  strokeWidth={2}
  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
/>
                          </svg>
                          <p>Your cart is empty</p>
                          <p className="text-xs mt-1">
                            Add items from the menu to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div className="p-4 border-t border-gray-200">
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Remarks
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Add any special instructions or notes here..."
                  rows="2"
                />
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">AED {getTotal()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">VAT (5%)</span>
                <span className="font-medium">AED {getTaxAmount()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-3 border-t pt-3">
                <span className="text-blue-900">Total</span>
                <span className="text-blue-900">AED {getFinalTotal()}</span>
              </div>
            </div>

            {/* Order Type and Action Buttons */}
            <div className="p-4 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Order Type:</label>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.status === "Dine In"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => handleInputChange("status", "Dine In")}
                    >
                      Dine In
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.status === "Takeaway"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => handleInputChange("status", "Takeaway")}
                    >
                      Takeaway
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.status === "Delivery"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => handleInputChange("status", "Delivery")}
                    >
                      Delivery
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 flex items-center justify-center"
                  onClick={() => handleSaveOrder()}
                  disabled={cart.length === 0 || loading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  {loading ? "Saving..." : "Save Order"}
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 flex items-center justify-center"
                  onClick={handlePrintReceipt}
                  disabled={cart.length === 0 || loading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
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
        </div>

        {/* Right Section - Menu and Numpad */}
        <div className="w-full md:w-1/2 p-4 overflow-auto bg-white">
          {/* Search and Filter */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search for menu items..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
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
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setSearchQuery("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 hover:text-gray-500"
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

          {/* Categories */}
          <div className="mb-4 overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${
                    activeCategory === category.name
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {searchQuery ? "Search Results" : `${activeCategory || "All"} Menu Items`}
            </h3>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : filteredMenuItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.ItemId}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setCurrentItem(item);
                      setTimeout(applyCurrentQtyToSelectedItem, 10);
                    }}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">
                      {item.ItemName}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">{item.ItemCode}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-600">
                        AED {item.Rate.toFixed(2)}
                      </span>
                      <button
                        className="bg-blue-100 text-blue-600 p-1 rounded-full hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <p className="text-center">
                  {searchQuery
                    ? `No items found matching "${searchQuery}"`
                    : "No items found in this category"}
                </p>
              </div>
            )}
          </div>

          {/* Number Pad for Quantity */}
          <div className="bg-gray-100 p-4 rounded-xl shadow-inner">
            <div className="mb-3 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Quantity</h3>
              <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xl">
                {currentQty}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="bg-white text-gray-800 p-3 rounded-lg shadow text-lg font-medium hover:bg-gray-50 active:bg-gray-100"
                  onClick={() => appendToQty(num)}
                >
                  {num}
                </button>
              ))}
              <button
                className="bg-white text-gray-800 p-3 rounded-lg shadow text-lg font-medium hover:bg-gray-50 active:bg-gray-100"
                onClick={() => appendToQty(".")}
              >
                .
              </button>
              <button
                className="bg-white text-gray-800 p-3 rounded-lg shadow text-lg font-medium hover:bg-gray-50 active:bg-gray-100"
                onClick={() => appendToQty(0)}
              >
                0
              </button>
              <button
                className="bg-white text-gray-800 p-3 rounded-lg shadow text-lg font-medium hover:bg-gray-50 active:bg-gray-100"
                onClick={() => appendToQty("00")}
              >
                00
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                className="bg-red-500 text-white p-3 rounded-lg shadow text-lg font-medium hover:bg-red-600 active:bg-red-700"
                onClick={() => appendToQty("clear")}
              >
                Clear
              </button>
              <button
                className="bg-green-500 text-white p-3 rounded-lg shadow text-lg font-medium hover:bg-green-600 active:bg-green-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Select Table</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
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
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.Id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      table.Status === "Occupied"
                        ? "bg-red-50 border-red-300"
                        : "bg-green-50 border-green-300 hover:bg-green-100"
                    }`}
                    onClick={() => {
                      if (table.Status !== "Occupied") {
                        selectTable(table);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-800">
                        Table {table.Code}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          table.Status === "Occupied"
                            ? "bg-red-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {table.Status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Capacity: {table.Capacity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Receipt Preview</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
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
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <ReceiptTemplate
                orderData={{
                  orderNo: formData.orderNo,
                  customerName: formData.custName || "Walk-in Customer",
                  orderType: formData.status,
                  tableNo: formData.tableNo || "N/A",
                  date: formData.eDate,
                  time: formData.time,
                  items: cart,
                  subtotal: getTotal(),
                  tax: getTaxAmount(),
                  total: getFinalTotal(),
                  remarks: formData.remarks,
                }}
              />
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 flex items-center justify-center"
                onClick={() => {
                  window.print();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
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
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 flex items-center justify-center"
                onClick={() => handleSaveOrder(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">{error}</div>
          <button
            className="ml-4 text-white hover:text-gray-200"
            onClick={() => setError(null)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
        </div>
      )}
    </div>
  );
};

export default EnhancedPOSSystemWithReceipt;