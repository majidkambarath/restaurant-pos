import React, { useEffect } from "react";
import PropTypes from "prop-types";

// Helper function to split text into lines of given width
const wrapText = (text, maxLen) => {
  const lines = [];
  let current = "";
  text.split(" ").forEach((word) => {
    if ((current + word).length > maxLen) {
      lines.push(current.trim());
      current = word + " ";
    } else {
      current += word + " ";
    }
  });
  if (current.trim()) lines.push(current.trim());
  return lines;
};

const openPrintableReceipt = ({
  order,
  newItems,
  updatedItems,
  restaurant,
}) => {
  const allItems = [...newItems, ...updatedItems];
  // Aggregate quantities for duplicate items based on itemCode
  const aggregatedItems = allItems.reduce((acc, item) => {
    const existingItem = acc.find((i) => i.itemCode === item.itemCode);
    if (existingItem) {
      existingItem.qty += item.qty || 1;
      existingItem.amount = existingItem.qty * existingItem.rate; // Recalculate amount if rate exists
    } else {
      acc.push({
        ...item,
        qty: item.qty || 1,
        amount: (item.qty || 1) * (item.rate || 0),
      });
    }
    return acc;
  }, []);

  const date = order?.date || new Date().toLocaleDateString();
  const time = order?.time || new Date().toLocaleTimeString();
  // Fetch delBoy from order.delBoy or fall back to localStorage userName
  const delBoy =
    order?.delBoy === "N/A" ? localStorage.getItem("userName") : order?.delBoy;

  // Define column widths in characters (80mm thermal font)
  const COL_WIDTH = {
    item: 18, // ~18 characters
    qty: 5, // ~5 characters
  };

  const renderItemRows = () => {
    return aggregatedItems
      .map((item, index) => {
        const itemLines = wrapText(item.itemName || "Unnamed", COL_WIDTH.item);
        const qtyText = `${item.qty || 1}`; // Show total aggregated qty
        const qtyLines = wrapText(qtyText, COL_WIDTH.qty);

        const maxLines = Math.max(itemLines.length, qtyLines.length);

        let rowHtml = "";
        for (let i = 0; i < maxLines; i++) {
          rowHtml += `
          <div class="item-row">
            <div class="item-slno"><strong>${
              item.slNo || index + 1
            }</strong></div>
            <div class="item-name"><strong>${itemLines[i] || ""}</strong></div>
            <div class="item-qty"><strong>${qtyLines[i] || ""}</strong></div>
          </div>
        `;
        }
        return rowHtml;
      })
      .join("");
  };

  const receiptHtml = `
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>KOT Receipt</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          max-width: 80mm;
          margin: 0;
          padding: 10px;
          color: #000;
          background: #fff;
        }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .info { text-align: center; margin: 2px 0; }
        .header-row, .item-row {
          display: flex;
          font-size: 14px;
          font-weight: bold;
          line-height: 1.3;
        }
        .item-slno {
          width: 20%;
          word-break: break-word;
        }
        .item-name {
          width: 60%;
          word-break: break-word;
        }
        .item-qty {
          width: 20%;
          text-align: right;
        }
        .remarks {
          font-size: 14px;
          font-weight: bold;
          margin-top: 10px;
        }
        .print-button {
          display: block;
          margin: 10px auto;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: bold;
        }
        @media print {
          .print-button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="center">${(
        restaurant?.name || "Restaurant"
      ).toUpperCase()}</div>
      <div class="info">${restaurant?.address || ""}</div>
      <div class="info">${date} | ${time}</div>
      <div class="info">Order: ${order?.status || "KOT"} - ${
    order?.tokenNo || "N/A"
  }</div>

      ${
        order?.status === "Dine-In"
          ? `<div class="info">Table: ${order?.tableNo || "N/A"} | Seats: ${
              order?.selectedSeats || "N/A"
            }</div>`
          : ""
      }
      ${
        order?.status === "Delivery" || order?.status === "Takeaway"
          ? `<div class="info">Customer: ${order?.custName || "N/A"}<br>${
              order?.flat || ""
            } ${order?.contact || ""}</div>`
          : ""
      }
      ${delBoy ? `<div class="info">Staff: ${delBoy}</div>` : ""}

      <div class="divider"></div>
      <div class="header-row">
        <div class="item-slno">S.No</div>
        <div class="item-name">Item</div>
        <div class="item-qty">Qty</div>
      </div>
      <div class="divider"></div>
      ${renderItemRows()}
      <div class="divider"></div>

      ${
        order?.remarks
          ? `<div class="remarks">Remarks: ${order.remarks}</div>`
          : ""
      }

      <button class="print-button" onclick="window.print()">Print Receipt</button>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked. Please allow pop-ups.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
};

const ReceiptTemplate = ({ order, newItems, updatedItems, restaurant }) => {
  useEffect(() => {
    openPrintableReceipt({ order, newItems, updatedItems, restaurant });
  }, []);

  return null;
};

ReceiptTemplate.propTypes = {
  order: PropTypes.shape({
    date: PropTypes.string,
    time: PropTypes.string,
    status: PropTypes.string,
    delBoy: PropTypes.string,
    tableNo: PropTypes.string,
    tokenNo: PropTypes.number,
    remarks: PropTypes.string,
    selectedSeats: PropTypes.string,
    custName: PropTypes.string,
    flat: PropTypes.string,
    contact: PropTypes.string,
  }).isRequired,
  newItems: PropTypes.arrayOf(
    PropTypes.shape({
      itemCode: PropTypes.string,
      itemName: PropTypes.string,
      qty: PropTypes.number,
      originalQty: PropTypes.number,
    })
  ).isRequired,
  updatedItems: PropTypes.arrayOf(
    PropTypes.shape({
      itemCode: PropTypes.string,
      itemName: PropTypes.string,
      qty: PropTypes.number,
      originalQty: PropTypes.number,
    })
  ).isRequired,
  restaurant: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
};

export default ReceiptTemplate;
