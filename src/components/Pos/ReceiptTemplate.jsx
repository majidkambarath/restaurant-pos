import React, { useRef, memo, useEffect } from 'react';

const ReceiptTemplate = ({ orderData, onPrint }) => {
  const printRef = useRef();
  
  // Auto-print functionality when component mounts
  useEffect(() => {
    // Automatically print to connected device when component loads
    printDirectToConnectedDevice();
  }, []);

  const printDirectToConnectedDevice = () => {
    const content = printRef.current;
    
    // Direct printing to connected device without preview
    const printContent = document.createElement('iframe');
    printContent.style.position = 'absolute';
    printContent.style.top = '-9999px';
    printContent.style.left = '-9999px';
    document.body.appendChild(printContent);
    
    printContent.contentDocument.write(`
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
    
    printContent.contentDocument.close();
    
    // Start printing process
    setTimeout(() => {
      printContent.contentWindow.focus();
      printContent.contentWindow.print();
      
      // Remove the iframe after printing
      setTimeout(() => {
        document.body.removeChild(printContent);
        if (onPrint) onPrint();
      }, 1000);
    }, 500);
  };

  const currentDate = orderData?.date || new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col space-y-4">
      <div 
        ref={printRef}
        className="receipt bg-white p-4 border border-gray-200 rounded-lg hidden"
        style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', maxWidth: '300px', margin: '0 auto' }}
      >
        <div className="header">
          <div className="business-name">FOODVISTA RESTAURANT</div>
          <div className="info">SONAPUR, DUBAI - UAE</div>
          <div className="info">Phone: {orderData?.contactNo || 'N/A'}</div>
          <div className="info">TRN: 100000000000001</div>
        </div>
        <div className="title">TAX INVOICE</div>
        <div className="info">Date: {currentDate}</div>
        <div className="info">Time: {orderData?.time || 'N/A'}</div>
        <div className="info">Invoice #: {orderData?.orderNo || '1.0'}</div>
        <div className="info">Customer: {orderData?.customerName || 'WALK-IN CUSTOMER'}</div>
        <div className="divider"></div>
        <div className="item-row" style={{ fontWeight: 'bold' }}>
          <div className="item-name">Item</div>
          <div className="item-qty">Qty</div>
          <div className="item-price">Price (AED)</div>
        </div>
        <div className="divider"></div>
        {orderData?.items && orderData?.items.map((item, index) => (
          <div key={`item-${index}`} className="item-row">
            <div className="item-name">{item.name || item.itemName || 'Unknown Item'}</div>
            <div className="item-qty">{item.qty || 1}</div>
            <div className="item-price">{(item.price || item.amount || 0).toFixed(2)}</div>
          </div>
        ))}
        <div className="divider"></div>
        <div className="totals">
          <div className="total-row">
            <div className="total-label">Subtotal (Excl. VAT):</div>
            <div className="total-value">AED {(orderData?.subtotal || 0)}</div>
          </div>
          <div className="total-row">
            <div className="total-label">VAT Amount:</div>
            <div className="total-value">AED {(orderData?.tax || 0)}</div>
          </div>
          <div className="total-row grand-total">
            <div className="total-label">Grand Total:</div>
            <div className="total-value">AED {(orderData?.total || 0)}</div>
          </div>
        </div>
        <div className="footer">
          <p>Thank you for your business!</p>
          {orderData?.orderType === 'Dine In' && <p>Table: {orderData?.tableNo || 'N/A'}</p>}
          {orderData?.remarks && <p>Note: {orderData?.remarks}</p>}
        </div>
      </div>
    </div>
  );
};

export default memo(ReceiptTemplate);