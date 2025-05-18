import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReceiptTemplate from "./ReceiptTemplate";
import axios from "../../api/axios";

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
    status: "Dine-In",
    prefix: "ORD",
    eDate: "",
    time: "",
    holdedOrder: "0",
  });
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: localStorage.getItem("restaurantName") || "Restaurant",
    trn: localStorage.getItem("restaurantTRN") || "",
    phone: localStorage.getItem("restaurantPhone") || "",
    address: localStorage.getItem("restaurantAddress") || "",
  });
  const [cart, setCart] = useState([]);
  const [currentQty, setCurrentQty] = useState("1");
  const [currentItem, setCurrentItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.setItem("isLoggedIn", "false");
    window.location.href = "/login"; // Redirect to login page
  }, []);

  // Generate random customer ID
  useEffect(() => {
    generateRandomCustomerId();
  }, []);

  const generateRandomCustomerId = () => {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    setFormData((prev) => ({ ...prev, custId: randomId.toString() }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const orderResponse = await axios.get("/order/latest");
        const latestOrderNo = orderResponse.data.data.orderNo || "0";
        setFormData((prev) => ({
          ...prev,
          orderNo: String(parseInt(latestOrderNo)),
          eDate: formatDate(new Date()),
          time: formatTime(new Date()),
        }));

        const tablesResponse = await axios.get("/tables-seats");
        setTables(tablesResponse.data.data);

        const categoriesResponse = await axios.get("/categories");
        const fetchedCategories = categoriesResponse.data.data.map((cat) => ({
          id: cat.Code,
          name: cat.GrpName,
        }));
        setCategories(fetchedCategories);
        setActiveCategory(fetchedCategories[0]?.name || null);

        const itemsResponse = await axios.get("/items", {
          params: { search: "", limit: 100, offset: 0 },
        });
        setItems(itemsResponse.data.data);

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

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSettingsChange = useCallback((field, value) => {
    setRestaurantSettings((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveSettings = useCallback(() => {
    localStorage.setItem("restaurantName", restaurantSettings.name);
    localStorage.setItem("restaurantTRN", restaurantSettings.trn);
    localStorage.setItem("restaurantPhone", restaurantSettings.phone);
    localStorage.setItem("restaurantAddress", restaurantSettings.address);
    setShowSettingsModal(false);
  }, [restaurantSettings]);

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
          cost: 0,
          vat: 5,
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

  const applyCurrentQtyToSelectedItem = useCallback(() => {
    if (currentItem) {
      addToCart(currentItem);
    } else if (cart.length > 0) {
      const lastItem = cart[cart.length - 1];
      updateCartQty(lastItem.itemId, currentQty);
    }
  }, [currentItem, cart, currentQty, addToCart, updateCartQty]);

  const removeCartItem = useCallback((itemId) => {
    setCart((prev) =>
      prev
        .filter((item) => item.itemId !== itemId)
        .map((item, index) => ({ ...item, slNo: index + 1 }))
    );
  }, []);

  const appendToQty = useCallback((digit) => {
    setCurrentQty((prev) => {
      if (digit === "clear") return "1";
      if (digit === "." && !prev.includes(".")) return prev + ".";
      if (digit === "00") return prev + "00";
      return prev === "0" || prev === "1" ? String(digit) : prev + digit;
    });
  }, []);

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

  const clearCart = useCallback(() => setCart([]), []);

  const clearAllFields = useCallback(() => {
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
      status: "Dine-In",
    }));
    clearCart();
    setCurrentQty("1");
    setCurrentItem(null);
  }, [clearCart]);

  const selectTable = useCallback((table) => {
    setFormData((prev) => ({
      ...prev,
      tableId: table.tableId,
      tableNo: table.Code,
      selectedSeats: table.Capacity,
    }));
    setShowTableModal(false);
  }, []);

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

  const handlePrintReceipt = useCallback(() => {
    setShowReceiptModal(true);
  }, []);

  const handleQuickPrint = useCallback(async () => {
    if (cart.length === 0) {
      setError("Cart is empty. Add items to print.");
      return;
    }
    await handleSaveOrder(true);
    window.print();
    setShowReceiptModal(false);
  }, [cart, handleSaveOrder]);

  const handleSaveOrder = useCallback(
    async (fromPrint = false) => {
      if (cart.length === 0) {
        setError("Cart is empty. Add items to save the order.");
        return;
      }

      const orderTypeMap = {
        "Dine-In": 2,
        Takeaway: 3,
        Delivery: 1,
      };

      const orderData = {
        orderNo: formData.orderNo,
        status: fromPrint ? "KOT" : "NEW",
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
          status: "Dine-In",
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
          <h1 className="text-2xl font-bold tracking-wide">
            {restaurantSettings.name} POS
          </h1>
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
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-full hover:bg-blue-600 transition-colors"
            title="Settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-blue-600 transition-colors"
            title="Logout"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
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
            {formData.status === "Dine-In" && (
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
                            type="number"
                            className="w-10 text-center bg-gray-100 border-t border-b border-gray-200"
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
                      <td className="px-3 py-2">{item.rate.toFixed(2)}</td>
                      <td className="px-3 py-2">{item.amount.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeCartItem(item.itemId)}
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Cart is empty. Add items to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals and Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Subtotal:
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {getTotal()} AED
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    VAT (5%):
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {getTaxAmount()} AED
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
                  <span className="text-base font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-base font-bold text-blue-700">
                    {getFinalTotal()} AED
                  </span>
                </div>
              </div>

              {/* Order Type Selection */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Order Type
                </label>
                <div className="flex space-x-3">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm flex-1 flex items-center justify-center ${
                      formData.status === "Dine-In"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => handleInputChange("status", "Dine-In")}
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
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Dine-In
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm flex-1 flex items-center justify-center ${
                      formData.status === "Takeaway"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => handleInputChange("status", "Takeaway")}
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    Takeaway
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm flex-1 flex items-center justify-center ${
                      formData.status === "Delivery"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => handleInputChange("status", "Delivery")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                      />
                    </svg>
                    Delivery
                  </button>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Special Instructions
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  rows="2"
                  placeholder="Add any special instructions here..."
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex-1 hover:bg-green-700 flex items-center justify-center"
                  onClick={() => handleSaveOrder(false)}
                  disabled={cart.length === 0 || loading}
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {loading ? "Saving..." : "Save Order"}
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex-1 hover:bg-blue-700 flex items-center justify-center"
                  onClick={handlePrintReceipt}
                  disabled={cart.length === 0 || loading}
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Menu and Calculator */}
        <div className="w-full md:w-1/2 p-4 overflow-auto bg-gray-200">
          {/* Search and Category Filter */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-4">
            <div className="relative mb-4">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search items by name or code..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchQuery && (
                <button
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => handleSearch("")}
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

            {/* Category Pills */}
            <div className="flex overflow-x-auto py-2 space-x-2 hide-scrollbar">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    activeCategory === category.name
                      ? "bg-blue-600 text-white"
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
          <div className="bg-white p-4 rounded-xl shadow-md mb-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Menu Items
              {loading && (
                <span className="ml-2 text-sm text-blue-600">Loading...</span>
              )}
            </h2>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.ItemId}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                  onClick={() => {
                    setCurrentItem(item);
                    addToCart(item);
                  }}
                >
                  <div className="font-medium text-sm text-gray-800 mb-1 truncate">
                    {item.ItemName}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">{item.ItemCode}</div>
                    <div className="font-bold text-blue-700 text-sm">
                      {item.Rate.toFixed(2)} AED
                    </div>
                  </div>
                </div>
              ))}
              {filteredMenuItems.length === 0 && !loading && (
                <div className="col-span-3 text-center py-4 text-gray-500">
                  No items found. Try a different search or category.
                </div>
              )}
            </div>
          </div>

          {/* Number Pad for Quantity */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-blue-800">
                Quantity Input
              </h2>
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-lg font-bold">
                {currentQty}
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "00"].map((num) => (
                <button
                  key={num}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg text-lg transition-colors"
                  onClick={() => appendToQty(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center transition-colors"
                onClick={() => appendToQty("clear")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Clear
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center transition-colors"
                onClick={applyCurrentQtyToSelectedItem}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-1"
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
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Selection Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-white/40 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800">
                Select a Table
              </h2>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-gray-500 hover:text-gray-700"
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
              {tables.map((table) => (
                <button
                  key={table.Id}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors ${
                    table.Status === "OCCUPIED"
                      ? "border-red-300 bg-red-50"
                      : "border-green-300 bg-green-50 hover:border-green-400"
                  }`}
                  onClick={() => selectTable(table)}
                  disabled={table.Status === "OCCUPIED"}
                >
                  <div className="text-2xl font-bold mb-1">T{table.Code}</div>
                  <div className="text-xs uppercase font-medium mb-1">
                    {table.Status}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{table.Capacity}</span> seats
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-white/40 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800">
                Restaurant Settings
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={restaurantSettings.name}
                  onChange={(e) => handleSettingsChange("name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TRN Number
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={restaurantSettings.trn}
                  onChange={(e) => handleSettingsChange("trn", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={restaurantSettings.phone}
                  onChange={(e) =>
                    handleSettingsChange("phone", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={restaurantSettings.address}
                  onChange={(e) =>
                    handleSettingsChange("address", e.target.value)
                  }
                  rows="2"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm flex-1"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex-1"
                  onClick={saveSettings}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-white/40 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800">
                Preview Receipt
              </h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <ReceiptTemplate
                order={{
                  orderNo: formData.orderNo,
                  date: formData.eDate,
                  time: formData.time,
                  status: formData.status,
                  tableNo: formData.tableNo,
                  custName: formData.custName,
                  custId: formData.custId,
                  items: cart,
                  subTotal: getTotal(),
                  taxAmount: getTaxAmount(),
                  totalAmount: getFinalTotal(),
                }}
                restaurant={restaurantSettings}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center"
                onClick={() => window.print()}
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center"
                onClick={() => handleSaveOrder(true)}
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save & Print
              </button>
              <button
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center"
                onClick={handleQuickPrint}
                disabled={cart.length === 0 || loading}
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Quick Print
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm flex items-center justify-center"
                onClick={() => setShowReceiptModal(false)}
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
                Cancel
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