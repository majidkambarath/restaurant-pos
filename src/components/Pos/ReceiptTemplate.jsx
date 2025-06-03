import React, { useRef, memo, useEffect } from "react";

const ReceiptTemplate = ({ order, restaurant }) => {
  const printRef = useRef();
console.log(order)
  // Auto-print functionality when component mounts
  useEffect(() => {
    printDirectToConnectedDevice();
  }, []);

  const printDirectToConnectedDevice = () => {
    const content = printRef.current;

    // Direct printing to connected device without preview
    const printContent = document.createElement("iframe");
    printContent.style.position = "absolute";
    printContent.style.top = "-9999px";
    printContent.style.left = "-9999px";
    printContent.style.width = "80mm";
    document.body.appendChild(printContent);

    printContent.contentDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Receipt</title>
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
            /* Override any browser print settings */
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
        <body>${content.innerHTML}</body>
      </html>
    `);

    printContent.contentDocument.close();

    // Start printing process
    setTimeout(() => {
      printContent.contentWindow.focus();
      printContent.contentWindow.print();

      // Remove the iframe after printing
      setTimeout(() => {
        document.body.removeChild(printContent);
      }, 1000);
    }, 500);
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
    restaurant?.name || localStorage.getItem("restaurantName") || "Restaurant";
  const restaurantAddress =
    restaurant?.address || localStorage.getItem("restaurantAddress") || "";

  // Capitalize order status for display
  const orderStatus = order?.status || "Dine-In";
  const formattedStatus = orderStatus
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const orderTitle = `${formattedStatus} Order`;

  return (
    <div className="flex flex-col space-y-4 mt-3">
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
          <div className="info">Table No: {order?.tableNo || "N/A"}</div>
        )}

        <div className="divider"></div>

        <div className="item-row" style={{ fontWeight: "bold" }}>
          <div className="item-sl">Sl</div>
          <div className="item-code">Code</div>
          <div className="item-name">Item</div>
          <div className="item-qty">Qty</div>
        </div>

        <div className="divider"></div>

        {order?.items &&
          order.items.map((item, index) => (
            <div key={`item-${index}`} className="item-row">
              <div className="item-sl">{index + 1}</div>
              <div className="item-code">{item.itemCode || "N/A"}</div>
              <div className="item-name">{item.itemName || "Unknown Item"}</div>
              <div className="item-qty">{item.qty || 1}</div>
            </div>
          ))}

        <div className="divider"></div>

        {order?.remark && (
          <div className="remarks">Special Instructions: {order.remark}</div>
        )}
      </div>
    </div>
  );
};

export default memo(ReceiptTemplate);