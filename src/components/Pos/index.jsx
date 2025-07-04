import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useReducer,
} from "react";
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

// State Reducer
const initialState = {
  formData: {
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
  },
  cart: [],
  newItems: [],
  updatedItems: [],
};

const posReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FORM":
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case "SET_CART":
      return { ...state, cart: action.payload };
    case "SET_NEW_ITEMS":
      return { ...state, newItems: action.payload };
    case "SET_UPDATED_ITEMS":
      return { ...state, updatedItems: action.payload };
    case "CLEAR_ALL":
      return {
        ...initialState,
        formData: {
          ...initialState.formData,
          orderNo: action.payload.orderNo,
          eDate: action.payload.eDate,
          time: action.payload.time,
        },
      };
    default:
      return state;
  }
};

// Custom Hook for Debounced Search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Reusable Modal Component
const Modal = React.memo(({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-lg max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <svg
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
        {children}
      </div>
    </div>
  );
});

const EnhancedPOSSystemWithReceipt = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(posReducer, initialState);
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: localStorage.getItem("restaurantName") || "Restaurant",
    trn: localStorage.getItem("restaurantTRN") || "",
    phone: localStorage.getItem("restaurantPhone") || "",
    address: localStorage.getItem("restaurantAddress") || "",
  });
  const [selectedCartItemId, setSelectedCartItemId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
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
  const [error, setError] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedCustomerSearchQuery = useDebounce(customerSearchQuery, 500);

  // Memoized Format Functions
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

  // Memoized Total Calculations
  const getTotal = useMemo(
    () => state.cart.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
    [state.cart]
  );
  const getTaxAmount = useMemo(
    () => (parseFloat(getTotal) * TAX_RATE).toFixed(2),
    [getTotal]
  );
  const getFinalTotal = useMemo(
    () => (parseFloat(getTotal) + parseFloat(getTaxAmount)).toFixed(2),
    [getTotal, getTaxAmount]
  );

  // Handlers
  const handleLogout = useCallback(() => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.setItem("isLoggedIn", "false");
    navigate("/");
  }, [navigate]);

  const generateRandomCustomerId = useCallback(() => {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    dispatch({ type: "UPDATE_FORM", payload: { custId: randomId.toString() } });
  }, []);

  const handleInputChange = useCallback((field, value) => {
    dispatch({ type: "UPDATE_FORM", payload: { [field]: value } });
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
    (item, qty = 1) => {
      const newCartItem = {
        itemId: item.ItemId,
        slNo: state.cart.length + 1,
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
        isNew: true,
      };

      dispatch({
        type: "SET_CART",
        payload: state.cart.some((cartItem) => cartItem.itemId === item.ItemId)
          ? state.cart.map((cartItem) =>
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
            )
          : [...state.cart, newCartItem],
      });

      dispatch({
        type: "SET_NEW_ITEMS",
        payload: state.newItems.some(
          (newItem) => newItem.itemId === item.ItemId
        )
          ? state.newItems.map((newItem) =>
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
            )
          : [
              ...state.newItems,
              { ...newCartItem, slNo: state.newItems.length + 1 },
            ],
      });

      setSelectedCartItemId(null);
    },
    [state.cart, state.newItems]
  );

  const updateCartQty = useCallback(
    (itemId, newQty, originalQty = null) => {
      const qty = Math.max(1, Number(newQty));
      dispatch({
        type: "SET_CART",
        payload: state.cart.map((item) =>
          item.itemId === itemId
            ? {
                ...item,
                qty,
                amount: qty * item.rate,
                vatAmt: (qty * item.rate * TAX_RATE).toFixed(2),
                originalQty:
                  originalQty !== null
                    ? item.originalQty || item.qty
                    : item.originalQty,
              }
            : item
        ),
      });

      if (originalQty !== null) {
        dispatch({
          type: "SET_UPDATED_ITEMS",
          payload: state.updatedItems.some(
            (updatedItem) => updatedItem.itemId === itemId
          )
            ? state.updatedItems.map((updatedItem) =>
                updatedItem.itemId === itemId
                  ? {
                      ...updatedItem,
                      qty,
                      amount: qty * updatedItem.rate,
                      vatAmt: (qty * updatedItem.rate * TAX_RATE).toFixed(2),
                      originalQty: updatedItem.originalQty || originalQty,
                    }
                  : updatedItem
              )
            : [
                ...state.updatedItems,
                {
                  ...state.cart.find((item) => item.itemId === itemId),
                  qty,
                  amount:
                    qty *
                    state.cart.find((item) => item.itemId === itemId).rate,
                  vatAmt: (
                    qty *
                    state.cart.find((item) => item.itemId === itemId).rate *
                    TAX_RATE
                  ).toFixed(2),
                  originalQty,
                  slNo: state.updatedItems.length + 1,
                },
              ],
        });
      } else {
        dispatch({
          type: "SET_NEW_ITEMS",
          payload: state.newItems.map((item) =>
            item.itemId === itemId
              ? {
                  ...item,
                  qty,
                  amount: qty * item.rate,
                  vatAmt: (qty * item.rate * TAX_RATE).toFixed(2),
                }
              : item
          ),
        });
      }
    },
    [state.cart, state.newItems, state.updatedItems]
  );

  const removeCartItem = useCallback(
    (itemId) => {
      const updatedCart = state.cart
        .filter((item) => item.itemId !== itemId)
        .map((item, index) => ({ ...item, slNo: index + 1 }));
      dispatch({ type: "SET_CART", payload: updatedCart });
      dispatch({
        type: "SET_NEW_ITEMS",
        payload: state.newItems
          .filter((item) => item.itemId !== itemId)
          .map((item, index) => ({ ...item, slNo: index + 1 })),
      });
      dispatch({
        type: "SET_UPDATED_ITEMS",
        payload: state.updatedItems
          .filter((item) => item.itemId !== itemId)
          .map((item, index) => ({ ...item, slNo: index + 1 })),
      });

      if (state.formData.holdedOrder !== "0" && updatedCart.length === 0) {
        setPendingOrders((prev) =>
          prev.filter((order) => order.OrderNo !== state.formData.holdedOrder)
        );
        dispatch({ type: "UPDATE_FORM", payload: { holdedOrder: "0" } });
      }
    },
    [state.cart, state.newItems, state.updatedItems, state.formData.holdedOrder]
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "SET_CART", payload: [] });
    dispatch({ type: "SET_NEW_ITEMS", payload: [] });
    dispatch({ type: "SET_UPDATED_ITEMS", payload: [] });
    if (state.formData.holdedOrder !== "0") {
      setPendingOrders((prev) =>
        prev.filter((order) => order.OrderNo !== state.formData.holdedOrder)
      );
      dispatch({ type: "UPDATE_FORM", payload: { holdedOrder: "0" } });
    }
  }, [state.formData.holdedOrder]);

  const clearAllFields = useCallback(() => {
    generateRandomCustomerId();
    dispatch({
      type: "CLEAR_ALL",
      payload: {
        orderNo: String(parseInt(state.formData.orderNo) + 1),
        eDate: formatDate(new Date()),
        time: formatTime(new Date()),
      },
    });
    setSelectedCartItemId(null);
  }, [
    generateRandomCustomerId,
    formatDate,
    formatTime,
    state.formData.orderNo,
  ]);

  const handleTableSelect = useCallback(
    (table) => {
      if (table.Status === "OCCUPIED" && state.formData.holdedOrder === "0") {
        setError(
          "This table is occupied. Please select a KOT order or another table."
        );
        return;
      }
      setSelectedTable(table);
      setShowTableModal(false);
      setShowSeatModal(true);
    },
    [state.formData.holdedOrder]
  );

  const handleSeatSelect = useCallback(
    (seat) => {
      if (seat.Status === 1 && state.formData.holdedOrder === "0") {
        setError(
          "This seat is already occupied. Please select a KOT order or another seat."
        );
        return;
      }
      dispatch({
        type: "UPDATE_FORM",
        payload: {
          tableId: selectedTable.TableID,
          tableNo: selectedTable.Code,
          selectedSeats: state.formData.selectedSeats.includes(seat.SeatName)
            ? state.formData.selectedSeats.filter(
                (name) => name !== seat.SeatName
              )
            : [...state.formData.selectedSeats, seat.SeatName],
        },
      });
    },
    [selectedTable, state.formData.holdedOrder, state.formData.selectedSeats]
  );

  const confirmSeatSelection = useCallback(() => {
    if (state.formData.selectedSeats.length === 0) {
      setError("Please select at least one seat.");
      return;
    }
    setShowSeatModal(false);
  }, [state.formData.selectedSeats]);

  const selectCustomer = useCallback((customer) => {
    const address = customer.Add1 || customer.Add2 || customer.Add3 || "";
    dispatch({
      type: "UPDATE_FORM",
      payload: {
        custId: customer.CustCode,
        custName: customer.CustName,
        contact: customer.ContactNo,
        flat: customer.Add1 || customer.Add2 || "",
        address,
      },
    });
    setShowCustomerModal(false);
    setCustomerSearchQuery("");
  }, []);

  const selectPendingOrder = useCallback(
    (order) => {
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
        isNew: false,
        originalQty: item.Qty,
      }));

      const seatNames =
        order.tableInfo?.seats
          ?.filter((seat) => seat.Status === 1)
          .map((seat) => seat.SeatName) || [];

      dispatch({
        type: "UPDATE_FORM",
        payload: {
          orderNo: String(order.OrderNo),
          custId: String(order.CustId),
          custName: order.CustName,
          flat: order.Flat || "",
          address: order.Address || "",
          contact: order.Contact || "",
          delBoy: String(order.DelBoy || "0"),
          tableId: String(order.tableInfo?.TableId || "0"),
          tableNo: order.tableInfo?.TableCode || order.TableNo || "",
          selectedSeats: seatNames,
          remarks: order.OrderRemarks || "",
          total: getFinalTotal,
          status:
            REVERSE_ORDER_TYPE_MAP[order.Options] || order.Status || "Dine-In",
          prefix: order.Prefix || "ORD",
          eDate: formatDate(new Date(order.EDate)),
          time: order.Time,
          holdedOrder: String(order.OrderNo),
        },
      });

      dispatch({ type: "SET_CART", payload: existingItems });
      dispatch({ type: "SET_NEW_ITEMS", payload: [] });
      dispatch({ type: "SET_UPDATED_ITEMS", payload: [] });
      setSelectedCartItemId(null);
      setShowKOTModal(false);
    },
    [formatDate, getFinalTotal]
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

  const handleSaveOrder = useCallback(async () => {
    if (state.cart.length === 0) {
      setError("Cart is empty. Add items to save the order.");
      return;
    }
    if (
      state.formData.status === "Dine-In" &&
      state.formData.selectedSeats.length === 0
    ) {
      setError("Please select at least one seat for Dine-In orders.");
      return;
    }

    const orderData = {
      orderNo: state.formData.orderNo,
      status: state.formData.holdedOrder === "0" ? "NEW" : "UPDATED",
      date: state.formData.eDate,
      time: state.formData.time,
      option: ORDER_TYPE_MAP[state.formData.status],
      custId: state.formData.status === "Takeaway" ? "0" : state.formData.custId || "0",
      custName: state.formData.status === "Takeaway" ? "" : state.formData.custName || "",
      flatNo: state.formData.status === "Takeaway" ? "" : state.formData.flat || "",
      address: state.formData.status === "Takeaway" ? "" : state.formData.address || "",
      contact: state.formData.status === "Takeaway" ? "" : state.formData.contact || "",
      deliveryBoyId: state.formData.delBoy || "0",
      tableId: state.formData.tableId || "0",
      tableNo: state.formData.tableNo || "",
      selectedSeats: state.formData.selectedSeats,
      remarks: state.formData.remarks || "",
      total: parseFloat(getFinalTotal),
      prefix: state.formData.prefix,
      items: state.cart.map((item) => ({
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
        originalQty: item.originalQty || item.qty,
      })),
      holdedOrder: state.formData.holdedOrder,
      tokenNo: tokenCounts[state.formData.status]?.nextToken || 1,
    };

    setLoading(true);
    try {
      await axios.post("/orders", orderData);
      setShowReceiptModal(true);

      const [
        orderResponse,
        customersResponse,
        pendingOrdersResponse,
        tokenCountsResponse,
        tablesResponse,
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

      dispatch({
        type: "UPDATE_FORM",
        payload: {
          orderNo: String(parseInt(orderResponse.data.data.orderNo || "0") + 1),
          eDate: formatDate(new Date()),
          time: formatTime(new Date()),
        },
      });
      setTables(tablesResponse.data.data);
      setCustomers(customersResponse.data.data);
      setPendingOrders(pendingOrdersResponse.data.data);
      setTokenCounts(tokenCountsResponse.data.data);
      setTimeout(() => {
        clearAllFields();
        setShowReceiptModal(false);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save order.");
    } finally {
      setLoading(false);
    }
  }, [
    state.cart,
    state.formData,
    getFinalTotal,
    tokenCounts,
    clearAllFields,
    formatDate,
    formatTime,
  ]);

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

  // Effects
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

        dispatch({
          type: "UPDATE_FORM",
          payload: {
            orderNo: String(
              parseInt(orderResponse.data.data.orderNo || "0") + 1
            ),
            eDate: formatDate(new Date()),
            time: formatTime(new Date()),
          },
        });
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

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-sm">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <svg
            className="h-6 w-6 text-blue-200"
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
          <h1 className="text-xl font-bold">{restaurantSettings.name} POS</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg
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
              <p className="text-sm font-medium">{formatDate(currentTime)}</p>
              <p className="text-xs text-blue-200">{formatTime(currentTime)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-full hover:bg-blue-500 transition-colors"
            title="Settings"
          >
            <svg
              className="h-5 w-5"
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
            className="p-2 rounded-full hover:bg-blue-500 transition-colors"
            title="Logout"
          >
            <svg
              className="h-5 w-5"
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
          <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-medium">
            Active
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-72px)] max-w-[1280px] mx-auto">
        <div className="w-full md:w-1/2 p-4 overflow-auto bg-gray-50">
          <div className="bg-white p-5 rounded-lg shadow-md mb-4 border-l-4 border-blue-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Order Information
              </h2>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                onClick={clearAllFields}
              >
                Clear All
              </button>
            </div>
            <div className="mb-4">
              <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                {["Dine-In", "Takeaway", "Delivery"].map((type) => (
                  <button
                    key={type}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                      state.formData.status === type
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      handleInputChange("status", type);
                      if (type !== "Takeaway") generateRandomCustomerId();
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <span className="inline-block bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                  Order #{state.formData.orderNo}
                </span>
              </div>
              {state.formData.status === "Delivery" && (
                <div className="flex items-end">
                  <button
                    className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700"
                    onClick={() => setShowCustomerModal(true)}
                  >
                    Select Customer
                  </button>
                </div>
              )}
              {(state.formData.status === "Delivery" ||
                state.formData.status === "Takeaway") && (
                <>
                  <div>
                    <input
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      value={state.formData.custId}
                      readOnly
                      placeholder="Customer ID"
                    />
                  </div>
                  <div>
                    <input
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      value={state.formData.custName}
                      onChange={(e) =>
                        handleInputChange("custName", e.target.value)
                      }
                      placeholder="Customer Name"
                    />
                  </div>
                  <div>
                    <input
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      value={state.formData.contact}
                      onChange={(e) =>
                        handleInputChange("contact", e.target.value)
                      }
                      placeholder="Contact No"
                    />
                  </div>
                  <div>
                    <input
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      value={state.formData.flat}
                      onChange={(e) =>
                        handleInputChange("flat", e.target.value)
                      }
                      placeholder="Flat No"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      value={state.formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="Address"
                    />
                  </div>
                </>
              )}
              {state.formData.status === "Delivery" && (
                <div>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    value={state.formData.delBoy}
                    onChange={(e) =>
                      handleInputChange("delBoy", e.target.value)
                    }
                  >
                    <option value="">Select Staff</option>
                    {employees.map((emp) => (
                      <option key={emp.Code} value={emp.Code}>
                        {emp.EmpName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {state.formData.status === "Dine-In" && (
                <div className="sm:col-span-2">
                  <div className="flex items-center space-x-3">
                    <button
                      className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700"
                      onClick={() => setShowTableModal(true)}
                    >
                      Select Table
                    </button>
                    <div className="flex-1">
                      <input
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50"
                        value={state.formData.tableNo}
                        readOnly
                        placeholder="Table No"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50"
                        value={state.formData.selectedSeats.join(", ")}
                        readOnly
                        placeholder="Selected Seats"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md mb-4">
            <div className="bg-blue-50 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Cart Items
              </h2>
              <button
                onClick={clearCart}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
              >
                Clear All
              </button>
            </div>
            <div className="overflow-auto max-h-64">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.cart.map((item,i) => (
                    <tr
                      key={item.itemId}
                      className={`hover:bg-blue-50 ${
                        selectedCartItemId === item.itemId ? "bg-blue-100" : ""
                      }`}
                      onClick={() => setSelectedCartItemId(item.itemId)}
                    >
                      <td className="px-4 py-3">{item.slNo}</td>
                      <td className="px-4 py-3">{item.itemName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l-md hover:bg-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQty(
                                item.itemId,
                                item.qty - 1,
                                item.originalQty || item.qty
                              );
                            }}
                            disabled={item.qty <= 1}
                          >
                            <svg
                              className="h-4 w-4"
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
                            className="w-12 text-center bg-gray-100 border-t border-b border-gray-200 text-sm"
                            value={item.qty}
                            onChange={(e) =>
                              updateCartQty(
                                item.itemId,
                                e.target.value,
                                item.originalQty || item.qty
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            min="1"
                          />
                          <button
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r-md hover:bg-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQty(
                                item.itemId,
                                item.qty + 1,
                                item.originalQty || item.qty
                              );
                            }}
                          >
                            <svg
                              className="h-4 w-4"
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
                      <td className="px-4 py-3">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCartItem(item.itemId);
                          }}
                        >
                          <svg
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
                  {state.cart.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-3 text-center text-gray-500"
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
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Subtotal:
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {getTotal} AED
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    VAT ({TAX_RATE * 100}%):
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {getTaxAmount} AED
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-lg font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {getFinalTotal} AED
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <textarea
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={state.formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  rows="3"
                  placeholder="Add any special instructions here..."
                ></textarea>
              </div>
              <div className="mt-4">
                <button
                  className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400"
                  onClick={handleSaveOrder}
                  disabled={state.cart.length === 0 || loading}
                >
                  {loading ? "Saving..." : "Save Order"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-4 overflow-auto bg-gray-200">
          <div className="bg-white p-5 rounded-lg shadow-md mb-4">
            <div className="relative mb-4">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Search items by name or code..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-3 h-5 w-5 text-gray-400"
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
                  onClick={() => handleSearch("")}
                >
                  <svg
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
            <div className="flex overflow-x-auto py-1 space-x-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-3 rounded-lg text-sm ${
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

          <div className="bg-white p-5 rounded-lg shadow-md mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Menu Items{" "}
              {loading && (
                <span className="text-sm text-blue-600">Loading...</span>
              )}
            </h2>
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.ItemId}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                  onClick={() => addToCart(item)}
                >
                  <div className="font-medium text-sm text-gray-800 mb-2 truncate">
                    {item.ItemName}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">{item.ItemCode}</div>
                    <div className="font-bold text-blue-700 text-sm">
                      {item.Rate.toFixed(2)} AED
                    </div>
                  </div>
                </div>
              ))}
              {filteredMenuItems.length === 0 && !loading && (
                <div className="col-span-3 text-center py-4 text-gray-500 text-sm">
                  No items found.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="bg-blue-50 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Pending KOT Orders
              </h2>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                onClick={() => setShowKOTModal(true)}
              >
                View All KOT
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {pendingOrders.map((order) => (
                  <button
                    key={order.OrderNo}
                    className="p-4 rounded-lg border border-blue-200 hover:bg-blue-50"
                    onClick={() => selectPendingOrder(order)}
                  >
                    <div className="text-lg font-bold text-blue-800 mb-2">
                      T{order.TableNo}
                    </div>
                    <div className="text-sm text-gray-600">
                      Order #{order.OrderNo}
                    </div>
                    <div className="text-sm font-bold text-blue-700">
                      {order.Total.toFixed(2)} AED
                    </div>
                  </button>
                ))}
                {pendingOrders.length === 0 && !loading && (
                  <div className="col-span-2 text-center py-4 text-gray-500 text-sm">
                    No pending orders found.
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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
          {tables.map((table) => (
            <button
              key={table.TableId}
              className={`p-4 rounded-lg border-2 ${
                table.Status === "OCCUPIED"
                  ? "border-red-300 bg-red-50"
                  : "border-green-300 bg-green-50 hover:bg-green-100"
              }`}
              onClick={() => handleTableSelect(table)}
              disabled={
                table.Status === "OCCUPIED" &&
                state.formData.holdedOrder === "0"
              }
            >
              <div className="text-lg font-bold mb-2">T{table.Code}</div>
              <div className="text-sm">{table.Status}</div>
              <div className="text-sm">{table.Capacity} seats</div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showSeatModal}
        onClose={() => setShowSeatModal(false)}
        title={`Select Seats for Table ${selectedTable?.Code}`}
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
          {selectedTable?.seats?.map((seat) => (
            <button
              key={seat.SeatId}
              className={`p-4 rounded-lg border-2 ${
                seat.Status === 1
                  ? "border-red-300 bg-red-50"
                  : state.formData.selectedSeats.includes(seat.SeatName)
                  ? "border-blue-300 bg-blue-100"
                  : "border-green-300 bg-green-50 hover:bg-green-100"
              }`}
              onClick={() => handleSeatSelect(seat)}
              disabled={seat.Status === 1 && state.formData.holdedOrder === "0"}
            >
              <div className="text-lg font-bold mb-2">{seat.SeatName}</div>
              <div className="text-sm">
                {seat.Status === 1 ? "Occupied" : "Available"}
              </div>
            </button>
          ))}
          <div className="col-span-full mt-4">
            <button
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700"
              onClick={confirmSeatSelection}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select a Customer"
      >
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Search customers by name or phone..."
            value={customerSearchQuery}
            onChange={(e) => handleCustomerSearch(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-gray-400"
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
          {customerSearchQuery && (
            <button
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              onClick={() => handleCustomerSearch("")}
            >
              <svg
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.CustCode}
              className="p-4 rounded-lg border border-blue-200 hover:bg-blue-50"
              onClick={() => selectCustomer(customer)}
            >
              <div className="text-lg font-bold mb-2">{customer.CustName}</div>
              <div className="text-sm text-gray-600">{customer.ContactNo}</div>
              <div className="text-sm text-gray-500">
                {customer.Add1 ||
                  customer.Add2 ||
                  customer.Add3 ||
                  "No address"}
              </div>
            </button>
          ))}
          {filteredCustomers.length === 0 && !loading && (
            <div className="col-span-2 text-center py-4 text-gray-500 text-sm">
              No customers found.
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Restaurant Settings"
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              value={restaurantSettings.name}
              onChange={(e) => handleSettingsChange("name", e.target.value)}
              placeholder="Restaurant Name"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              value={restaurantSettings.trn}
              onChange={(e) => handleSettingsChange("trn", e.target.value)}
              placeholder="TRN Number"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              value={restaurantSettings.phone}
              onChange={(e) => handleSettingsChange("phone", e.target.value)}
              placeholder="Phone Number"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              value={restaurantSettings.address}
              onChange={(e) => handleSettingsChange("address", e.target.value)}
              placeholder="Address"
            />
          </div>
          <button
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700"
            onClick={saveSettings}
          >
            Save Settings
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      >
        <ReceiptTemplate
          order={{
            orderNo: state.formData.orderNo,
            date: state.formData.eDate,
            time: state.formData.time,
            status: state.formData.status,
            custId: state.formData.custId,
            custName: state.formData.custName,
            contact: state.formData.contact,
            flat: state.formData.flat,
            address: state.formData.address,
            tableNo: state.formData.tableNo,
            delBoy:
              employees.find(
                (emp) =>
                  emp.Code?.toString() === state.formData.delBoy.toString()
              )?.EmpName || "N/A",
            selectedSeats: state.formData.selectedSeats.join(", ") || "N/A",
            remarks: state.formData.remarks,
            prefix: state.formData.prefix,
            tokenNo: tokenCounts[state.formData.status]?.nextToken || 1,
          }}
          items={state.cart}
          newItems={state.newItems}
          updatedItems={state.updatedItems}
          restaurant={restaurantSettings}
        />
      </Modal>

      <Modal
        isOpen={showKOTModal}
        onClose={() => setShowKOTModal(false)}
        title="Pending KOT Orders"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {pendingOrders.map((order) => (
            <button
              key={order.OrderNo}
              className="p-4 rounded-lg border border-blue-200 hover:bg-blue-50"
              onClick={() => selectPendingOrder(order)}
            >
              <div className="text-lg font-bold text-blue-800 mb-2">
                T{order.TableNo}
              </div>
              <div className="text-sm text-gray-600">
                Order #{order.OrderNo}
              </div>
              <div className="text-sm font-bold text-blue-700">
                {order.Total.toFixed(2)} AED
              </div>
            </button>
          ))}
          {pendingOrders.length === 0 && !loading && (
            <div className="col-span-2 text-center py-4 text-gray-500 text-sm">
              No pending KOT orders found.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedPOSSystemWithReceipt;