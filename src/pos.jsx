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
        setFormData((prev) => ({
          ...prev,
          orderNo: String(parseInt(prev.orderNo) + 1),
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
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                Order #{formData.orderNo}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Customer ID
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.custId}
                  onChange={(e) => handleInputChange("custId", e.target.value)}
                  placeholder="Enter customer ID"
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Printer
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.pr}
                  onChange={(e) => handleInputChange("pr", e.target.value)}
                >
                  <option value="Printer1">Printer1</option>
                  <option value="Printer2">Printer2</option>
                </select>
              </div>
            </div>
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
                  <span className="font-medium">AED {getTotal()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">VAT (5%):</span>
                  <span className="font-medium">AED {getTaxAmount()}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-1">
                  <span className="text-blue-800">Total:</span>
                  <span className="text-blue-800">AED {getFinalTotal()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Order Type & Notes */}
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Order Type
                </label>
                <div className="flex space-x-2">
                  {["Dine In", "Takeaway", "Delivery"].map((type) => (
                    <button
                      key={type}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                        formData.status === type
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => handleInputChange("status", type)}
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
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Add special instructions..."
                  rows="2"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="bg-green-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-600 flex items-center justify-center"
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
                Complete & Print
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center"
                onClick={() => handleSaveOrder(false)}
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Order
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Menu Items and Numpad */}
        <div className="w-full md:w-1/2 p-4 overflow-hidden bg-white border-l border-gray-200">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for items..."
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
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-4 overflow-x-auto ">
            <div className="flex space-x-2 min-w-max">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                    activeCategory === category.name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : activeCategory || "All Items"}
            </h3>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-600">No items found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try a different search term or category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.ItemId}
                    className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500 flex flex-col justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
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
                        {item.ItemName}{" "}
                      </h3>
                    </div>
                    <div className="text-blue-600 font-medium">
                      AED {item.Rate.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Numpad */}
          <div className="bg-gray-100 rounded-xl shadow-inner p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Quantity Control
              </h3>
              <div className="bg-white rounded-lg px-4 py-2 text-xl font-bold text-blue-700 min-w-20 text-center">
                {currentQty}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, "00", "."].map((num) => (
                <button
                  key={num}
                  className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-lg"
                  onClick={() => appendToQty(num)}
                >
                  {num}
                </button>
              ))}
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg"
                onClick={() => appendToQty("clear")}
              >
                C
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg col-span-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Select Table
              </h2>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables.map((table) => {
                  const isOccupied = false; // Replace with backend logic if available
                  return (
                    <div
                      key={table.Code}
                      className={`border rounded-lg p-4 text-center cursor-pointer ${
                        isOccupied
                          ? "bg-red-50 border-red-200 cursor-not-allowed"
                          : "bg-white border-gray-200 hover:border-blue-400"
                      }`}
                      onClick={() => !isOccupied && selectTable(table)}
                    >
                      <div className="text-lg font-semibold text-gray-800 mb-1">
                        Table {table.Code}
                      </div>
                      <div className="text-sm text-gray-500">
                        Capacity: {table.Capacity} seats
                      </div>
                      <div
                        className={`text-sm mt-2 font-medium rounded-full px-2 py-1 ${
                          isOccupied
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isOccupied ? "Occupied" : "Available"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg"
                  onClick={() => setShowTableModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Receipt Preview
              </h2>
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
            <div className="p-4 max-h-[70vh] overflow-y-auto bg-gray-50">
              <ReceiptTemplate
                order={{
                  orderNo: formData.orderNo,
                  customerName: formData.custName || "WALK-IN CUSTOMER",
                  contactNo: formData.contact,
                  orderType: formData.status,
                  tableNo: formData.tableNo,
                  cart: cart,
                  remarks: formData.remarks,
                }}
                onPrint={() => handleSaveOrder(true)}
              />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg mr-2"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center"
                  onClick={() => handleSaveOrder(true)}
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
                  Print & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPOSSystemWithReceipt;
