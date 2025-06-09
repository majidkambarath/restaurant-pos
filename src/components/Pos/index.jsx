import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReceiptTemplate from "./ReceiptTemplate";
import axios from "../../api/axios";

// Constants
const TAX_RATE = 0.05;
const ORDER_TYPE_MAP = {
  "Dine-In": 2,
  Takeaway: 3,
  Delivery: 1,
};
const REVERSE_ORDER_TYPE_MAP = Object.fromEntries(
  Object.entries(ORDER_TYPE_MAP).map(([key, value]) => [value, key])
);

// Custom hook for debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Reusable Modal Component
const Modal = React.memo(
  ({ isOpen, onClose, title, children, hide = false }) => {
    if (!isOpen) return null;
    return (
      <div
        className={`fixed inset-0 bg-white/50 flex items-center justify-center z-50 ${
          hide ? "hidden" : ""
        }`}
      >
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
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
          {children}
        </div>
      </div>
    );
  }
);

const EnhancedPOSSystemWithReceipt = () => {
  const navigate = useNavigate();
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
    selectedSeats: [],
  });
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: localStorage.getItem("restaurantName") || "Restaurant",
    trn: localStorage.getItem("restaurantTRN") || "",
    phone: localStorage.getItem("restaurantPhone") || "",
    address: localStorage.getItem("restaurantAddress") || "",
  });
  const [cart, setCart] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [currentQty, setCurrentQty] = useState("1");
  const [selectedCartItemId, setSelectedCartItemId] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tokenCounts, setTokenCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedCustomerSearchQuery = useDebounce(customerSearchQuery, 500);

  // Memoized format functions
  const formatDate = useCallback(
    (date) =>
      date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-"),
    []
  );
  const formatTime = useCallback(
    (date) =>
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    []
  );

  // Memoized total calculations
  const getTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
    [cart]
  );
  const getTaxAmount = useMemo(
    () => (parseFloat(getTotal) * TAX_RATE).toFixed(2),
    [getTotal]
  );
  const getFinalTotal = useMemo(
    () => (parseFloat(getTotal) + parseFloat(getTaxAmount)).toFixed(2),
    [getTotal, getTaxAmount]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.setItem("isLoggedIn", "false");
    navigate("/");
  }, [navigate]);

  const generateRandomCustomerId = useCallback(() => {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    setFormData((prev) => ({ ...prev, custId: randomId.toString() }));
  }, []);

  useEffect(() => {
    generateRandomCustomerId();
  }, [generateRandomCustomerId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [
          orderResponse,
          tablesResponse,
          categoriesResponse,
          itemsResponse,
          employeesResponse,
          customersResponse,
          pendingOrdersResponse,
          tokenCountsResponse,
        ] = await Promise.all([
          axios
            .get("/order/latest")
            .catch(() => ({ data: { data: { orderNo: "0" } } })),
          axios.get("/tables-seats").catch(() => ({ data: { data: [] } })),
          axios.get("/categories").catch(() => ({ data: { data: [] } })),
          axios
            .get("/items", { params: { search: "", limit: 100, offset: 0 } })
            .catch(() => ({ data: { data: [] } })),
          axios.get("/employees").catch(() => ({ data: { data: [] } })),
          axios
            .get("/customers", {
              params: { search: "", limit: 100, offset: 0 },
            })
            .catch(() => ({ data: { data: [] } })),
          axios.get("/pending").catch(() => ({ data: { data: [] } })),
          axios.get("/token-counts").catch(() => ({ data: { data: {} } })),
        ]);

        setFormData((prev) => ({
          ...prev,
          orderNo: String(parseInt(orderResponse.data.data.orderNo || "0") + 1),
          eDate: formatDate(new Date()),
          time: formatTime(new Date()),
        }));
        setTables(tablesResponse.data.data);
        setCategories(
          categoriesResponse.data.data.map((cat) => ({
            id: cat.Code,
            name: cat.GrpName,
          }))
        );
        setActiveCategory(categoriesResponse.data.data[0]?.GrpName || null);
        setItems(itemsResponse.data.data);
        setEmployees(employeesResponse.data.data);
        setCustomers(customersResponse.data.data);
        setPendingOrders(pendingOrdersResponse.data.data);
        setTokenCounts(tokenCountsResponse.data.data);
      } catch (err) {
        setError("Failed to fetch initial data.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [formatDate, formatTime]);

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
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSearchResults();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const fetchCustomerSearchResults = async () => {
      if (debouncedCustomerSearchQuery) {
        setLoading(true);
        try {
          const response = await axios.get("/customers", {
            params: {
              search: debouncedCustomerSearchQuery,
              limit: 100,
              offset: 0,
            },
          });
          setCustomers(response.data.data);
        } catch (err) {
          setError("Failed to fetch customer search results.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCustomerSearchResults();
  }, [debouncedCustomerSearchQuery]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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
      const qty = Number(currentQty) || 1;
      const newCartItem = {
        itemId: item.ItemId,
        slNo: cart.length + 1,
        itemCode: item.ItemCode,
        itemName: item.ItemName,
        qty,
        rate: item.Rate,
        amount: qty * item.Rate,
        cost: 0,
        vat: TAX_RATE * 100,
        vatAmt: (qty * item.Rate * TAX_RATE).toFixed(2),
        taxLedger: 0,
        arabic: "",
        notes: "",
      };

      setCart((prev) => {
        const existingItem = prev.find(
          (cartItem) => cartItem.itemId === item.ItemId
        );
        if (existingItem) {
          return prev.map((cartItem) =>
            cartItem.itemId === item.ItemId
              ? {
                  ...cartItem,
                  qty: cartItem.qty + qty,
                  amount: (cartItem.qty + qty) * cartItem.rate,
                  vatAmt: (
                    (cartItem.qty + qty) *
                    cartItem.rate *
                    TAX_RATE
                  ).toFixed(2),
                }
              : cartItem
          );
        }
        return [...prev, newCartItem];
      });

      setNewItems((prev) => {
        const existingNewItem = prev.find(
          (newItem) => newItem.itemId === item.ItemId
        );
        if (existingNewItem) {
          return prev.map((newItem) =>
            newItem.itemId === item.ItemId
              ? {
                  ...newItem,
                  qty: newItem.qty + qty,
                  amount: (newItem.qty + qty) * newItem.rate,
                  vatAmt: (
                    (newItem.qty + qty) *
                    newItem.rate *
                    TAX_RATE
                  ).toFixed(2),
                }
              : newItem
          );
        }
        return [...prev, { ...newCartItem, slNo: prev.length + 1 }];
      });

      setCurrentQty("1");
      setCurrentItem(null);
      setSelectedCartItemId(null);
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
              vatAmt: (qty * item.rate * TAX_RATE).toFixed(2),
            }
          : item
      )
    );

    setNewItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              qty,
              amount: qty * item.rate,
              vatAmt: (qty * item.rate * TAX_RATE).toFixed(2),
            }
          : item
      )
    );

    setCurrentQty("1");
    setSelectedCartItemId(null);
  }, []);

  const applyCurrentQtyToSelectedItem = useCallback(() => {
    if (selectedCartItemId) {
      updateCartQty(selectedCartItemId, currentQty);
    } else if (currentItem) {
      addToCart(currentItem);
    } else if (cart.length > 0) {
      const lastItem = cart[cart.length - 1];
      updateCartQty(lastItem.itemId, currentQty);
    }
  }, [
    selectedCartItemId,
    currentQty,
    currentItem,
    cart,
    addToCart,
    updateCartQty,
  ]);

  const removeCartItem = useCallback((itemId) => {
    setCart((prev) =>
      prev
        .filter((item) => item.itemId !== itemId)
        .map((item, index) => ({ ...item, slNo: index + 1 }))
    );
    setNewItems((prev) =>
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

  const clearCart = useCallback(() => {
    setCart([]);
    setNewItems([]);
  }, []);

  const clearAllFields = useCallback(() => {
    generateRandomCustomerId();
    setFormData({
      orderNo: String(parseInt(formData.orderNo) + 1),
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
      eDate: formatDate(new Date()),
      time: formatTime(new Date()),
      holdedOrder: "0",
      selectedSeats: [],
    });
    clearCart();
    setCurrentQty("1");
    setCurrentItem(null);
    setSelectedCartItemId(null);
  }, [
    formData.orderNo,
    generateRandomCustomerId,
    formatDate,
    formatTime,
    clearCart,
  ]);

  const handleTableSelect = useCallback(
    (table) => {
      if (table.Status === "OCCUPIED" && formData.holdedOrder === "0") {
        setError(
          "This table is occupied. Please select a KOT order or another table."
        );
        return;
      }
      setSelectedTable(table);
      setShowTableModal(false);
      setShowSeatModal(true);
    },
    [formData.holdedOrder]
  );

  const handleSeatSelect = useCallback(
    (seat) => {
      if (seat.Status === 1 && formData.holdedOrder === "0") {
        setError(
          "This seat is already occupied. Please select a KOT order or another seat."
        );
        return;
      }
      setFormData((prev) => ({
        ...prev,
        tableId: selectedTable.TableId,
        tableNo: selectedTable.Code,
        selectedSeats: prev.selectedSeats.includes(seat.SeatId)
          ? prev.selectedSeats.filter((id) => id !== seat.SeatId)
          : [...prev.selectedSeats, seat.SeatId],
      }));
      const data = selectedSeats;
      console.log(data);
    },
    [selectedTable, formData.holdedOrder]
  );

  const confirmSeatSelection = useCallback(() => {
    if (formData.selectedSeats.length === 0) {
      setError("Please select at least one seat.");
      return;
    }
    console.log(formData.selectedSeats[0]);
    setShowSeatModal(false);
  }, [formData.selectedSeats]);

  const selectCustomer = useCallback((customer) => {
    const address = customer.Add1 || customer.Add2 || customer.Add3 || "";
    setFormData((prev) => ({
      ...prev,
      custId: customer.CustCode,
      custName: customer.CustName,
      contact: customer.ContactNo,
      flat: customer.Add1 || customer.Add2 || "",
      address,
    }));
    setShowCustomerModal(false);
    setCustomerSearchQuery("");
  }, []);

  const selectPendingOrder = useCallback(
    (order) => {
      setFormData({
        orderNo: String(order.OrderNo),
        custId: String(order.CustId),
        custName: order.CustName,
        flat: order.Flat || "",
        address: order.Address || "",
        contact: order.Contact || "",
        delBoy: String(order.DelBoy || "0"),
        tableId: String(order.tableInfo?.TableId || "0"),
        tableNo: order.tableInfo?.TableCode || order.TableNo || "",
        selectedSeats:
          order.tableInfo?.seats
            ?.filter((seat) => seat.Status === 1)
            .map((seat) => seat.SeatId) || [],
        remarks: order.OrderRemarks || "",
        total: order.Total || 0,
        status:
          REVERSE_ORDER_TYPE_MAP[order.Options] || order.Status || "Dine-In",
        prefix: order.Prefix || "ORD",
        eDate: formatDate(new Date(order.EDate)),
        time: order.Time,
        holdedOrder: String(order.OrderNo),
      });

      const existingItems = order.orderDetails.map((item, index) => ({
        itemId: item.ItemCode || `temp-${index}`,
        slNo: item.SlNo,
        itemCode: item.ItemCode,
        itemName: item.ItemName,
        qty: item.Qty,
        rate: item.Rate,
        amount: item.Amount,
        cost: item.Cost,
        vat: TAX_RATE * 100,
        vatAmt: item.VatAmt,
        taxLedger: item.TaxLedger || "0",
        arabic: "",
        notes: item.OrderDetailNotes || "",
      }));
      setCart(existingItems);
      setNewItems([]);
      setCurrentQty("1");
      setCurrentItem(null);
      setSelectedCartItemId(null);
      setShowKOTModal(false);
    },
    [formatDate]
  );

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

  const filteredCustomers = useMemo(() => {
    if (customerSearchQuery) {
      return customers.filter(
        (customer) =>
          customer.CustName.toLowerCase().includes(
            customerSearchQuery.toLowerCase()
          ) || customer.ContactNo.includes(customerSearchQuery)
      );
    }
    return customers;
  }, [customerSearchQuery, customers]);

  const handleSaveOrder = useCallback(async () => {
    if (cart.length === 0) {
      setError("Cart is empty. Add items to save the order.");
      return;
    }
    if (formData.status === "Dine-In" && formData.selectedSeats.length === 0) {
      setError("Please select at least one seat for Dine-In orders.");
      return;
    }

    const orderData = {
      orderNo: formData.orderNo,
      status: formData.holdedOrder === "0" ? "NEW" : "UPDATED",
      date: formData.eDate,
      time: formData.time,
      option: ORDER_TYPE_MAP[formData.status],
      custId: formData.custId || "0",
      custName: formData.custName || "",
      flatNo: formData.flat || "",
      address: formData.address || "",
      contact: formData.contact || "",
      deliveryBoyId: formData.delBoy || "0",
      tableId: formData.tableId || "0",
      tableNo: formData.tableNo || "",
      selectedSeats: formData.selectedSeats,
      remarks: formData.remarks || "",
      total: parseFloat(getFinalTotal),
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
      tokenNo: tokenCounts[formData.status]?.nextToken || 1,
    };

    setLoading(true);
    try {
      await axios.post("/orders", orderData);
      setShowReceiptModal(true);

      const newItemsTotal = newItems
        .reduce((sum, item) => sum + item.amount, 0)
        .toFixed(2);
      const newItemsTaxAmount = (parseFloat(newItemsTotal) * TAX_RATE).toFixed(
        2
      );
      const newItemsFinalTotal = (
        parseFloat(newItemsTotal) + parseFloat(newItemsTaxAmount)
      ).toFixed(2);

      const [
        orderResponse,
        customersResponse,
        pendingOrdersResponse,
        tokenCountsResponse,
      ] = await Promise.all([
        axios
          .get("/order/latest")
          .catch(() => ({ data: { data: { orderNo: "0" } } })),
        axios
          .get("/customers", { params: { search: "", limit: 100, offset: 0 } })
          .catch(() => ({ data: { data: [] } })),
        axios.get("/pending").catch(() => ({ data: { data: [] } })),
        axios.get("/token-counts").catch(() => ({ data: { data: {} } })),
        axios.get("/tables-seats").catch(() => ({ data: { data: [] } })),
      ]);

      setFormData((prev) => ({
        ...prev,
        orderNo: String(parseInt(orderResponse.data.data.orderNo || "0") + 1),
        holdedOrder: "0",
        selectedSeats: [],
      }));
      setCustomers(customersResponse.data.data);
      setPendingOrders(pendingOrdersResponse.data.data);
      setTokenCounts(tokenCountsResponse.data.data);
      setTables(tablesResponse.data.data);

      setTimeout(() => {
        clearAllFields();
        setShowReceiptModal(false);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save order.");
    } finally {
      setLoading(false);
    }
  }, [cart, newItems, formData, getFinalTotal, tokenCounts, clearAllFields]);

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
      } finally {
        setLoading(false);
      }
    },
    [categories]
  );

  const handleSearch = useCallback((query) => setSearchQuery(query), []);
  const handleCustomerSearch = useCallback(
    (query) => setCustomerSearchQuery(query),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
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
              aria-hidden="true"
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
            aria-label="Open settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
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
            aria-label="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
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

      <div className="flex flex-col md:flex-row h-[calc(100vh-72px)]">
        <div className="w-full md:w-1/2 p-4 overflow-auto bg-gray-100">
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
                  aria-label="Clear all fields"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1"
                  htmlFor="custId"
                >
                  Customer ID
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="custId"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    value={formData.custId}
                    readOnly
                    placeholder="Auto-generated"
                    aria-readonly="true"
                  />
                  <button
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center"
                    onClick={() => setShowCustomerModal(true)}
                    aria-label="Search customers"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search
                  </button>
                </div>
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1"
                  htmlFor="custName"
                >
                  Customer Name
                </label>
                <input
                  id="custName"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.custName}
                  onChange={(e) =>
                    handleInputChange("custName", e.target.value)
                  }
                  placeholder="Enter customer name"
                  aria-required="true"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1"
                  htmlFor="contact"
                >
                  Contact No
                </label>
                <input
                  id="contact"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.contact}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1"
                  htmlFor="flat"
                >
                  Flat No
                </label>
                <input
                  id="flat"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.flat}
                  onChange={(e) => handleInputChange("flat", e.target.value)}
                  placeholder="Flat #"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  className="block text-xs font-medium text-gray-600 mb-1"
                  htmlFor="address"
                >
                  Address
                </label>
                <input
                  id="address"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1"
                  htmlFor="delBoy"
                >
                  Assigned Staff
                </label>
                <select
                  id="delBoy"
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

            {formData.status === "Dine-In" && (
              <div className="mt-4 flex items-center space-x-4">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center"
                  onClick={() => setShowTableModal(true)}
                  aria-label="Select table"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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
                    <label
                      className="block text-xs font-medium text-gray-600 mb-1"
                      htmlFor="tableNo"
                    >
                      Table No
                    </label>
                    <input
                      id="tableNo"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      value={formData.tableNo}
                      readOnly
                      placeholder="--"
                      aria-readonly="true"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      className="block text-xs font-medium text-gray-600 mb-1"
                      htmlFor="selectedSeats"
                    >
                      Selected Seats
                    </label>
                    <input
                      id="selectedSeats"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          selectedSeats: Array.from(
                            e.target.selectedOptions,
                            (option) => option.value
                          ),
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      value={formData.selectedSeats}
                      readOnly
                      placeholder="--"
                      aria-readonly="true"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md mb-4 border-l-4 border-blue-500">
            <div className="bg-blue-50 p-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-blue-800 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
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
                aria-label="Clear cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
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
                    <tr
                      key={item.itemId}
                      className={`hover:bg-blue-50 cursor-pointer ${
                        selectedCartItemId === item.itemId ? "bg-blue-100" : ""
                      }`}
                      onClick={() => {
                        setSelectedCartItemId(item.itemId);
                        setCurrentQty(String(item.qty));
                        setCurrentItem(null);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedCartItemId(item.itemId);
                          setCurrentQty(String(item.qty));
                          setCurrentItem(null);
                        }
                      }}
                    >
                      <td className="px-3 py-2">{item.slNo}</td>
                      <td className="px-3 py-2">{item.itemName}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1">
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l-lg hover:bg-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQty(item.itemId, item.qty - 1);
                            }}
                            disabled={item.qty <= 1}
                            aria-label={`Decrease quantity for ${item.itemName}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
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
                            onClick={(e) => e.stopPropagation()}
                            min="1"
                            aria-label={`Quantity for ${item.itemName}`}
                          />
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r-lg hover:bg-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQty(item.itemId, item.qty + 1);
                            }}
                            aria-label={`Increase quantity for ${item.itemName}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCartItem(item.itemId);
                          }}
                          aria-label={`Remove ${item.itemName} from cart`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
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

            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Subtotal:
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {getTotal} AED
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    VAT ({TAX_RATE * 100}%):
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {getTaxAmount} AED
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
                  <span className="text-base font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-base font-bold text-blue-700">
                    {getFinalTotal} AED
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label
                  className="block text-xs font-medium text-gray-600 mb-2"
                  htmlFor="orderType"
                >
                  Order Type
                </label>
                <div className="flex space-x-3">
                  {["Dine-In", "Takeaway", "Delivery"].map((type) => (
                    <button
                      key={type}
                      className={`px-4 py-2 rounded-lg text-sm flex-1 flex items-center justify-center ${
                        formData.status === type
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => handleInputChange("status", type)}
                      aria-label={`Select ${type} order type`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            type === "Dine-In"
                              ? "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              : type === "Takeaway"
                              ? "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              : "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                          }
                        />
                      </svg>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label
                  className="block text-xs font-medium text-gray-600 mb-2"
                  htmlFor="remarks"
                >
                  Special Instructions
                </label>
                <textarea
                  id="remarks"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  rows="2"
                  placeholder="Add any special instructions here..."
                  aria-label="Special instructions"
                ></textarea>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex-1 hover:bg-green-700 flex items-center justify-center disabled:bg-gray-400"
                  onClick={handleSaveOrder}
                  disabled={
                    cart.length === 0 || newItems.length === 0 || loading
                  }
                  aria-label="Save order"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-4 overflow-auto bg-gray-200">
          <div className="bg-white p-4 rounded-xl shadow-md mb-4">
            <div className="relative mb-4">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search items by name or code..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search items"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
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
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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
                  aria-label={`Select category ${category.name}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md mb-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
                    setSelectedCartItemId(null);
                    addToCart(item);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setCurrentItem(item);
                      setSelectedCartItemId(null);
                      addToCart(item);
                    }
                  }}
                  aria-label={`Add ${item.ItemName} to cart`}
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

          <div className="bg-white rounded-xl shadow-md flex flex-col md:flex-row">
            <div className="md:w-1/2 p-4">
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-blue-800">
                  Quantity
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
                    aria-label={`Add ${num} to quantity`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center transition-colors"
                  onClick={() => appendToQty("clear")}
                  aria-label="Clear quantity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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
                  aria-label="Apply quantity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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

            <div className="md:w-1/2 p-4 border-l border-gray-200">
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-blue-800">
                  KOT Addition
                </h2>
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 flex items-center"
                  onClick={() => setShowKOTModal(true)}
                  aria-label="View pending KOT orders"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View KOT
                </button>
              </div>
              <div className="p-4">
                {modalLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {pendingOrders.map((order) => (
                      <button
                        key={order.OrderNo}
                        className="p-4 rounded-lg border-2 flex flex-col items-start justify-center hover:bg-blue-50 transition-colors border-blue-200"
                        onClick={() => selectPendingOrder(order)}
                        aria-label={`Select order ${order.OrderNo}`}
                      >
                        <div className="text-xl font-bold text-blue-800 mb-1">
                          T{order.TableNo}
                        </div>
                        <div className="text-sm text-gray-600">
                          Order #{order.OrderNo}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.CustName}
                        </div>
                        <div className="text-sm font-bold text-blue-700">
                          {order.Total.toFixed(2)} AED
                        </div>
                      </button>
                    ))}
                    {pendingOrders.length === 0 && !loading && (
                      <div className="col-span-2 text-center py-4 text-gray-500">
                        No pending orders found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title="Select a Table"
      >
        {modalLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
            {tables.map((table) => (
              <button
                key={table.TableId}
                className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors ${
                  table.Status === "OCCUPIED"
                    ? "border-red-300 bg-red-50"
                    : "border-green-300 bg-green-50 hover:border-green-400"
                }`}
                onClick={() => handleTableSelect(table)}
                disabled={
                  table.Status === "OCCUPIED" && formData.holdedOrder === "0"
                }
                aria-label={`Select table ${table.Code}`}
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
        )}
      </Modal>

      <Modal
        isOpen={showSeatModal}
        onClose={() => setShowSeatModal(false)}
        title={`Select Seats for Table ${selectedTable?.Code}`}
      >
        {modalLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
            {selectedTable?.seats?.map((seat) => (
              <button
                key={seat.SeatId}
                className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors ${
                  seat.Status === 1
                    ? "border-red-300 bg-red-50"
                    : formData.selectedSeats.includes(seat.SeatId)
                    ? "border-blue-300 bg-blue-100"
                    : "border-green-300 bg-green-50 hover:border-green-400"
                }`}
                onClick={() => handleSeatSelect(seat)}
                disabled={seat.Status === 1 && formData.holdedOrder === "0"}
                aria-label={`Select seat ${seat.SeatName}`}
              >
                <div className="text-xl font-bold mb-1">{seat.SeatName}</div>
                <div className="text-xs uppercase font-medium">
                  {seat.Status === 1 ? "Occupied" : "Available"}
                </div>
              </button>
            ))}
            <div className="col-span-full mt-4">
              <button
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                onClick={confirmSeatSelection}
                aria-label="Confirm seat selection"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select a Customer"
      >
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Search customers by name or phone..."
            value={customerSearchQuery}
            onChange={(e) => handleCustomerSearch(e.target.value)}
            aria-label="Search customers"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {customerSearchQuery && (
            <button
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              onClick={() => handleCustomerSearch("")}
              aria-label="Clear customer search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
        {modalLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.CustCode}
                className="p-4 rounded-lg border-2 flex flex-col items-start justify-center hover:bg-blue-50 transition-colors border-blue-200"
                onClick={() => selectCustomer(customer)}
                aria-label={`Select customer ${customer.CustName}`}
              >
                <div className="text-lg font-bold mb-1">
                  {customer.CustName}
                </div>
                <div className="text-sm text-gray-600">
                  {customer.ContactNo}
                </div>
                <div className="text-sm text-gray-500">
                  {customer.Add1 ||
                    customer.Add2 ||
                    customer.Add3 ||
                    "No address"}
                </div>
              </button>
            ))}
            {filteredCustomers.length === 0 && !loading && (
              <div className="col-span-3 text-center py-4 text-gray-500">
                No customers found. Try a different search.
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Restaurant Settings"
      >
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="restaurantName"
            >
              Restaurant Name
            </label>
            <input
              id="restaurantName"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={restaurantSettings.name}
              onChange={(e) => handleSettingsChange("name", e.target.value)}
              aria-required="true"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="trn"
            >
              TRN Number
            </label>
            <input
              id="trn"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={restaurantSettings.trn}
              onChange={(e) => handleSettingsChange("trn", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="phone"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={restaurantSettings.phone}
              onChange={(e) => handleSettingsChange("phone", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="restaurantAddress"
            >
              Address
            </label>
            <input
              id="restaurantAddress"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={restaurantSettings.address}
              onChange={(e) => handleSettingsChange("address", e.target.value)}
            />
          </div>
          <button
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={saveSettings}
            aria-label="Save settings"
          >
            Save Settings
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        hide={true}
      >
        <div className="print-only">
          <ReceiptTemplate
            order={{
              orderNo: formData.orderNo,
              date: formData.eDate,
              time: formData.time,
              status: formData.status,
              custId: formData.custId,
              custName: formData.custName,
              contact: formData.contact,
              flat: formData.flat,
              address: formData.address,
              tableNo: formData.tableNo,
              delBoy:
                employees.find(
                  (emp) => emp.Code?.toString() === formData.delBoy.toString()
                )?.EmpName || "--",
              selectedSeats: formData?.selectedSeats
                .map(
                  (seatId) =>
                    tables
                      .find((t) => t.TableId === formData.tableId)
                      ?.seats.find((s) => s.SeatId === seatId)?.SeatName
                )
                .filter(Boolean)
                .join(", "),
              remarks: formData.remarks,
              prefix: formData.prefix,
              tokenNo: tokenCounts[formData.status]?.nextToken || 1,
            }}
            items={cart}
            newItems={newItems}
            restaurantSettings={restaurantSettings}
          />
        </div>
      </Modal>

      <Modal
        isOpen={showKOTModal}
        onClose={() => setShowKOTModal(false)}
        title="Pending KOT Orders"
      >
        {modalLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {pendingOrders.map((order) => (
              <button
                key={order.OrderNo}
                className="p-4 rounded-lg border-2 flex flex-col items-start justify-center hover:bg-blue-50 transition-colors border-blue-200"
                onClick={() => selectPendingOrder(order)}
                aria-label={`Select KOT order ${order.OrderNo}`}
              >
                <div className="text-lg font-bold text-blue-800 mb-1">
                  T{order.TableNo}
                </div>
                <div className="text-sm text-gray-600">
                  Order #{order.OrderNo}
                </div>
                <div className="text-sm text-gray-600">{order.CustName}</div>
                <div className="text-sm font-bold text-blue-700">
                  {order.Total.toFixed(2)} AED
                </div>
              </button>
            ))}
            {pendingOrders.length === 0 && !loading && (
              <div className="col-span-3 text-center py-4 text-gray-500">
                No pending KOT orders found.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedPOSSystemWithReceipt;
