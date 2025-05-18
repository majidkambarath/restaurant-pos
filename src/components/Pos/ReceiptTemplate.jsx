import React, { useRef, memo, useEffect } from "react";

const ReceiptTemplate = ({ order, restaurant }) => {
  const printRef = useRef();

  // Auto-print functionality when component mounts
  useEffect(() => {
    // Automatically print to connected device when component loads
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
            .item-row { display: flex; justify-content: flex-start; margin: 3px 0; }
            .item-sl { flex: 0 0 25px; text-align: left; padding-left: 5px; }
            .item-name { flex: 2; padding-left: 0; }
            .item-qty { flex: 0 0 30px; text-align: center; }
            .item-price { flex: 1; text-align: right; }
            .totals { margin-top: 10px; text-align: right; }
            .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-label { text-align: left; }
            .total-value { text-align: right; font-weight: bold; }
            .grand-total { font-weight: bold; font-size: 13px; }
            .footer { margin-top: 15px; text-align: center; font-size: 10px; }
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
  const restaurantTRN =
    restaurant?.trn || localStorage.getItem("restaurantTRN") || "";
  const restaurantPhone =
    restaurant?.phone || localStorage.getItem("restaurantPhone") || "";
  const restaurantAddress =
    restaurant?.address || localStorage.getItem("restaurantAddress") || "";

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
          <div className="info">Phone: {restaurantPhone || "N/A"}</div>
          {restaurantTRN && <div className="info">TRN: {restaurantTRN}</div>}
        </div>

        <div className="title">TAX INVOICE</div>

        <div className="info -ml-1">Date: {currentDate}</div>
        <div className="info">Time: {order?.time || "N/A"}</div>
        <div className="info">Invoice #: {order?.orderNo || "N/A"}</div>
        <div className="info">
          Customer: {order?.custName || "WALK-IN CUSTOMER"}
        </div>

        <div className="divider"></div>

        <div className="item-row" style={{ fontWeight: "bold" }}>
          <div className="item-sl">Sl</div>
          <div className="item-name">Item</div>
          <div className="item-qty">Qty</div>
          <div className="item-price">Price (AED)</div>
        </div>

        <div className="divider"></div>

        {order?.items &&
          order.items.map((item, index) => (
            <div key={`item-${index}`} className="item-row">
              <div className="item-sl">{index + 1}</div>
              <div className="item-name">
                {item.name || item.itemName || "Unknown Item"}
              </div>
              <div className="item-qty">{item.qty || 1}</div>
              <div className="item-price">
                {parseFloat(item.price || item.amount || 0).toFixed(2)}
              </div>
            </div>
          ))}

        <div className="divider"></div>

        <div className="totals">
          <div className="total-row">
            <div className="total-label">Subtotal (Excl. VAT):</div>
            <div className="total-value">
              AED {parseFloat(order?.subTotal || 0).toFixed(2)}
            </div>
          </div>
          <div className="total-row">
            <div className="total-label">VAT Amount:</div>
            <div className="total-value">
              AED {parseFloat(order?.taxAmount || 0).toFixed(2)}
            </div>
          </div>
          <div className="total-row grand-total">
            <div className="total-label">Grand Total:</div>
            <div className="total-value">
              AED {parseFloat(order?.totalAmount || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default memo(ReceiptTemplate);
