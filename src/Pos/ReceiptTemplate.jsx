import React, { useRef, memo } from 'react';

const ReceiptTemplate = ({ order, onPrint }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 10px;
              width: 80mm;
              font-size: 12px;
              color: #000;
            }
            .receipt { padding: 5px; }
            .header { text-align: center; margin-bottom: 10px; }
            .business-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
            .info { margin-bottom: 5px; font-size: 11px; }
            .title { font-weight: bold; text-align: center; margin: 5px 0; font-size: 13px; }
            .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .item-name { flex: 2; }
            .item-qty { flex: 1; text-align: center; }
            .item-price { flex: 1; text-align: right; }
            .totals { margin-top: 10px; text-align: right; }
            .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-label { text-align: left; }
            .total-value { text-align: right; font-weight: bold; }
            .grand-total { font-weight: bold; font-size: 13px; }
            .footer { margin-top: 15px; text-align: center; font-size: 10px; }
            @media print { body { width: 80mm; margin: 0; padding: 0; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
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

  const totals = React.useMemo(() => {
    const subtotal = order.cart.reduce((sum, item) => sum + item.amount, 0);
    const vatRate = 0.05;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;
    const discount = 0.04;
    const grandTotal = Math.round((total - discount) * 100) / 100;
    return {
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      discount: discount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  }, [order.cart]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Receipt Preview</h3>
        <div
          ref={printRef}
          className="receipt bg-white p-4 border border-gray-200 rounded-lg"
          style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', maxWidth: '300px', margin: '0 auto' }}
        >
          <div className="header">
            <div className="business-name">FOODVISTA RESTAURANT</div>
            <div className="info">SONAPUR, DUBAI - UAE</div>
            <div className="info">Phone: {order.contactNo || 'N/A'}</div>
            <div className="info">TRN: 100000000000001</div>
          </div>
          <div className="title">TAX INVOICE</div>
          <div className="info">Date: {currentDate}</div>
          <div className="info">Invoice #: {order.orderNo || '1.0'}</div>
          <div className="info">Customer: {order.customerName || 'WALK-IN CUSTOMER'}</div>
          <div className="divider"></div>
          <div className="item-row" style={{ fontWeight: 'bold' }}>
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
              <div className="total-value">AED {totals.subtotal}</div>
            </div>
            <div className="total-row">
              <div className="total-label">VAT Amount:</div>
              <div className="total-value">AED {totals.vatAmount}</div>
            </div>
            <div className="total-row">
              <div className="total-label">Total (Incl. VAT):</div>
              <div className="total-value">AED {totals.total}</div>
            </div>
            <div className="total-row">
              <div className="total-label">Discount:</div>
              <div className="total-value">AED {totals.discount}</div>
            </div>
            <div className="total-row grand-total">
              <div className="total-label">Grand Total:</div>
              <div className="total-value">AED {totals.grandTotal}</div>
            </div>
          </div>
          <div className="footer">
            <p>Thank you for your business!</p>
            {order.orderType === 'Dine In' && <p>Table: {order.tableNo || 'N/A'}</p>}
            {order.remarks && <p>Note: {order.remarks}</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-600 flex items-center"
          >
            <svg
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

export default memo(ReceiptTemplate);