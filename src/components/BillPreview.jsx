import './BillPreview.css';

export default function BillPreview({ 
  invoice, 
  cartItems, 
  subtotal, 
  discount, 
  total, 
  cashier = "Default Cashier",
  shopName = "ඉල්ලෝඩියා ගෙන්ස්ටයිල්",
  footerLine1 = "භාතික පාසල අංශය, ප්‍රවාහනය",
  footerLine2 = "0775720535",
  footerLine3 = "Thank you! Visit again."
}) {
  // Format date exactly as in the image: "6/2/26, 11:14 AM"
  const now = new Date();
  const formattedDate = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear().toString().slice(-2)}, ${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;

  return (
    <div className="bill-preview">
      <div className="bill-line">{formattedDate}</div>
      <div className="bill-shop">{shopName}</div>
      <div className="bill-divider">---</div>
      
      <div className="bill-info">
        <div>Invoice : {invoice}</div>
        <div>Date    : {formattedDate}</div>
        <div>Cashier : {cashier}</div>
      </div>
      
      <div className="bill-divider">---</div>
      
      <div className="bill-items">
        {cartItems.map(item => (
          <div key={item.id} className="bill-item">
            <span className="item-name">
              {item.name} x{item.quantity}
            </span>
            <span className="item-price">LKR {item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <div className="bill-divider">---</div>
      
      <div className="bill-totals">
        <div className="total-line">
          <span>Subtotal :</span>
          <span>LKR {subtotal.toFixed(2)}</span>
        </div>
        <div className="total-line">
          <span>Discount :</span>
          <span>LKR {discount.toFixed(2)}</span>
        </div>
        <div className="total-line grand-total">
          <span>TOTAL    :</span>
          <span>LKR {total.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="bill-divider">---</div>
      
      <div className="bill-footer">
        <div>{footerLine1}</div>
        <div>{footerLine2}</div>
        <div>{footerLine3}</div>
      </div>
      
      <button className="btn-print" onClick={() => window.print()}>Print Bill</button>
    </div>
  );
}