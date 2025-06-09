import React, { useRef, memo, useEffect, useState } from "react";
import PropTypes from "prop-types";

const ReceiptTemplate = ({ order, items, newItems, restaurant }) => {
  console.log(order)
  const printRef = useRef();
  const [hasPrintAttempted, setHasPrintAttempted] = useState(false);
  const printTimeoutRef = useRef(null);

  // Auto-print when component mounts, but only once
  useEffect(() => {
    if (!hasPrintAttempted) {
      setHasPrintAttempted(true);
      printDirectToConnectedDevice();
    }
    
    // Cleanup function to clear timeout on unmount
    return () => {
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only runs once on mount

  const printDirectToConnectedDevice = () => {
    // Prevent multiple print attempts
    if (hasPrintAttempted) return;
    
    const content = printRef.current;

    // Direct printing to connected device without preview
    const printContent = document.createElement("iframe");
    printContent.style.position = "absolute";
    printContent.style.top = "-9999px";
    printContent.style.left = "-9999px";
    printContent.style.width = "80mm";
    document.body.appendChild(printContent);

    // Use newItems for printing
    const itemRows = newItems
      .map(
        (item, index) => `
        <div class="item-row">
          <div class="item-sl">${index + 1}</div>
          <div class="item-code">${item.itemCode || "N/A"}</div>
          <div class="item-name">${item.itemName || "Unknown Item"}</div>
          <div class="item-qty">${item.qty || 1}</div>
        </div>
      `
      )
      .join("");

    printContent.contentDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print KOT Receipt</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: 80mm auto !important;
              margin: 0mm !important;
            }
            html, body {
              font-family: 'Courier New', monospace;
              margin: 0 !important;
              padding: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              font-size: 12px;
              color: #000;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              box-sizing: border-box;
            }
            .receipt { 
              padding: 5px; 
              width: 80mm !important;
              max-width: 80mm !important;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .business-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
            .info { margin-bottom: 5px; font-size: 11px; }
            .title { font-weight: bold; text-align: center; margin: 5px 0; font-size: 13px; }
            .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
            .item-row { display: flex; justify-content: flex-start; margin: 3px 0; font-size: 14px; }
            .item-sl { flex: 0 0 25px; text-align: left; padding-left: 5px; }
            .item-code { flex: 0 0 80px; padding-left: 0; }
            .item-name { flex: 2; padding-left: 0; }
            .item-qty { flex: 0 0 30px; text-align: center; }
            .remarks { margin-top: 15px; text-align: left; font-size: 12px; font-weight: bold; }
            @media print {
              @page {
                size: 80mm auto !important;
                margin: 0mm !important;
              }
              html, body {
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .receipt {
                width: 80mm !important;
                max-width: 80mm !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="business-name">${
                (restaurant?.name || "Restaurant").toUpperCase()
              }</div>
              <div class="info">${
                restaurant?.address || ""
              }</div>
            </div>
            <div class="title">${
              order?.status
                ? order.status.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) + " Order"
                : "KOT Order"
            }</div>
            <div class="info -ml-1">Date: ${
              order?.date ||
              new Date().toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
              })
            }</div>
            <div class="info">Time: ${order?.time || "N/A"}</div>
            <div class="info">Order #${
              order?.status
                ? order.status.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
                : "KOT"
            } - ${order?.tokenNo || "N/A"}</div>
            ${
              (order?.status === "Delivery" || order?.status === "Dine-In")
                ? `<div class="info">Staff: ${order?.delBoy || "N/A"}</div>`
                : ""
            }
            ${
              order?.status === "Dine-In"
                ? `<div class="info">Table No: ${order?.tableNo || "N/A"} - ${order?.selectedSeats || "N/A"}</div>`
                : ""
            }
            <div class="divider"></div>
            <div class="item-row" style="font-weight: bold;">
              <div class="item-sl">Sl</div>
              <div class="item-code">Code</div>
              <div class="item-name">Item</div>
              <div class="item-qty">Qty</div>
            </div>
            <div class="divider"></div>
            ${itemRows}
            <div class="divider"></div>
            ${
              order?.remarks
                ? `<div class="remarks">Special Instructions: ${order.remarks}</div>`
                : ""
            }
          </div>
        </body>
      </html>
    `);

    printContent.contentDocument.close();

    // Start printing process with better control
    printTimeoutRef.current = setTimeout(() => {
      try {
        printContent.contentWindow.focus();
        printContent.contentWindow.print();
      } catch (error) {
        console.log("Print dialog was cancelled or failed");
      }

      // Remove the iframe after printing attempt
      setTimeout(() => {
        try {
          if (document.body.contains(printContent)) {
            document.body.removeChild(printContent);
          }
        } catch (error) {
          console.log("Error removing print iframe");
        }
      }, 1000);
    }, 100); // Reduced timeout for faster response
  };

  const currentDate =
    order?.date ||
    new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });

  // Ensure restaurant data is properly handled
  const restaurantName =
    restaurant?.name || "Restaurant";
  const restaurantAddress =
    restaurant?.address || "";

  // Capitalize order status for display
  const orderStatus = order?.status || "Dine-In";
  const formattedStatus = orderStatus
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const orderTitle = `${formattedStatus} Order`;

  return (
    <div className="hidden"> {/* Hide the component from view */}
      <div
        ref={printRef}
        className="receipt bg-white p-4 border border-gray-200 rounded-lg"
        style={{
          fontFamily: "Courier New, monospace",
          fontSize: "12px",
          width: "80mm",
          margin: "0 auto",
        }}
      >
        <div className="header">
          <div className="business-name">{restaurantName.toUpperCase()}</div>
          <div className="info">{restaurantAddress}</div>
        </div>

        <div className="title">{orderTitle}</div>

        <div className="info -ml-1">Date: {currentDate}</div>
        <div className="info">Time: {order?.time || "N/A"}</div>
        <div className="info">
          Order #{formattedStatus} - {order?.tokenNo || "N/A"}
        </div>
        {(orderStatus === "Delivery" || orderStatus === "Dine-In") && (
          <div className="info">Staff: {order?.delBoy || "N/A"}</div>
        )}
        {orderStatus === "Dine-In" && (
          <div className="info">Table No: {order?.tableNo || "N/A"} - {order?.selectedSeats || "N/A"} </div>
        )}

        <div className="divider"></div>

        <div className="item-row" style={{ fontWeight: "bold" }}>
          <div className="item-sl">Sl</div>
          <div className="item-code">Code</div>
          <div className="item-name">Item</div>
          <div className="item-qty">Qty</div>
        </div>

        <div className="divider"></div>

        {newItems && newItems.length > 0
          ? newItems.map((item, index) => (
              <div key={`item-${index}`} className="item-row">
                <div className="item-sl">{index + 1}</div>
                <div className="item-code">{item.itemCode || "N/A"}</div>
                <div className="item-name">{item.itemName || "Unknown Item"}</div>
                <div className="item-qty">{item.qty || 1}</div>
              </div>
            ))
          : items.map((item, index) => ( // Fallback to items if newItems is empty
              <div key={`item-${index}`} className="item-row">
                <div className="item-sl">{index + 1}</div>
                <div className="item-code">{item.itemCode || "N/A"}</div>
                <div className="item-name">{item.itemName || "Unknown Item"}</div>
                <div className="item-qty">{item.qty || 1}</div>
              </div>
            ))}

        <div className="divider"></div>

        {order?.remarks && (
          <div className="remarks">Special Instructions: {order.remarks}</div>
        )}
      </div>
    </div>
  );
};

ReceiptTemplate.propTypes = {
  order: PropTypes.shape({
    orderNo: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    status: PropTypes.string,
    delBoy: PropTypes.string,
    tableNo: PropTypes.string,
    tokenNo: PropTypes.number,
    remarks: PropTypes.string,
  }).isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.string,
      slNo: PropTypes.number,
      itemCode: PropTypes.string,
      itemName: PropTypes.string,
      qty: PropTypes.number,
    })
  ).isRequired,
  newItems: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.string,
      slNo: PropTypes.number,
      itemCode: PropTypes.string,
      itemName: PropTypes.string,
      qty: PropTypes.number,
    })
  ).isRequired,
  restaurant: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
};

export default memo(ReceiptTemplate);