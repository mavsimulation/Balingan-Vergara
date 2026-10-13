// =====================================================
// 1. PRODUCT DATA (hard-coded, allowed by the exam)
// =====================================================
// Each product points to its own image in the assets/images folder.
// If your files are .png, change the extension here.
const products = [
  { id: 1, name: "Classic Burger", price: 55, image: "assets/images/classic-burger.jpg", alt: "Classic burger with beef patty, lettuce and tomato" },
  { id: 2, name: "Cheeseburger", price: 65, image: "assets/images/cheeseburger.jpg", alt: "Cheeseburger with melted cheese" },
  { id: 3, name: "Ham Sandwich", price: 40, image: "assets/images/ham-sandwich.jpg", alt: "Ham sandwich on bread" },
  { id: 4, name: "French Fries (Regular)", price: 45, image: "assets/images/french-fries.jpg", alt: "Regular serving of French fries" },
  { id: 5, name: "Nachos", price: 50, image: "assets/images/nachos.jpg", alt: "Nachos with cheese and toppings" },
  { id: 6, name: "Soda (Can)", price: 25, image: "assets/images/soda.jpg", alt: "Canned soda drink" }
];

// =====================================================
// 2. APPLICATION STATE (stored in memory, no database)
// =====================================================
let cart = [];              // each item: { id, name, price, qty }
let transactionCounter = 1; // used for the transaction number
let isPaid = false;         // true after a successful payment

// =====================================================
// 3. HTML ELEMENTS (IDs must match index.html)
// =====================================================
const productList = document.getElementById("productList");
const cartBody = document.getElementById("cartBody");
const emptyCart = document.getElementById("emptyCart");
const totalAmountEl = document.getElementById("totalAmount");
const cartMessage = document.getElementById("cartMessage");
const cashInput = document.getElementById("cashInput");
const payBtn = document.getElementById("payBtn");
const paymentMessage = document.getElementById("paymentMessage");
const changeDisplay = document.getElementById("changeDisplay");
const receiptPanel = document.getElementById("receiptPanel");
const receiptContent = document.getElementById("receiptContent");
const newTransactionBtn = document.getElementById("newTransactionBtn");

// =====================================================
// 4. HELPER FUNCTIONS
// =====================================================

// Formats a number as Philippine peso, e.g. 1234 -> "₱1,234.00"
function formatPeso(amount) {
  return "₱" + amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Shows a message. type is "success" or "error"
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + type;
}

function clearMessage(element) {
  element.textContent = "";
  element.className = "message";
}

// Adds up (price x quantity) of every item in the cart
function getTotal() {
  let total = 0;
  for (const item of cart) {
    total += item.price * item.qty;
  }
  return total;
}

// Stops cart changes after payment so the receipt stays correct
function isLocked() {
  if (isPaid) {
    showMessage(cartMessage, "Transaction is complete. Click New Transaction to start again.", "error");
    return true;
  }
  return false;
}

// =====================================================
// 5. DISPLAY PRODUCTS (Step 1: Browse Products)
// =====================================================
function renderProducts() {
  productList.innerHTML = "";

  products.forEach(function (product) {
    const card = document.createElement("div");
    card.className = "product-card";
    // If the image file is missing, onerror shows which file to add
    card.innerHTML = `
      <div class="product-media" data-file="${product.image}">
        <img src="${product.image}" alt="${product.alt}"
             onerror="this.parentElement.classList.add('missing'); this.remove();">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="price">${formatPeso(product.price)}</p>
        <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
      </div>
    `;
    productList.appendChild(card);
  });
}

// =====================================================
// 6. CART FUNCTIONS (Step 2: Add to Cart)
// =====================================================
function addToCart(productId) {
  if (isLocked()) return;

  const product = products.find(function (p) { return p.id === productId; });
  const existingItem = cart.find(function (item) { return item.id === productId; });

  if (existingItem) {
    existingItem.qty++; // already in cart: just add 1
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
  }

  showMessage(cartMessage, product.name + " added to cart.", "success");
  clearMessage(paymentMessage);
  renderCart();
}

function increaseQty(productId) {
  if (isLocked()) return;

  const item = cart.find(function (i) { return i.id === productId; });
  item.qty++;
  clearMessage(cartMessage);
  renderCart();
}

function decreaseQty(productId) {
  if (isLocked()) return;

  const item = cart.find(function (i) { return i.id === productId; });
  item.qty--;

  // If quantity reaches 0, the item is removed from the cart
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }

  clearMessage(cartMessage);
  renderCart();
}

function removeFromCart(productId) {
  if (isLocked()) return;

  const item = cart.find(function (i) { return i.id === productId; });
  cart = cart.filter(function (i) { return i.id !== productId; });

  showMessage(cartMessage, item.name + " removed from cart.", "success");
  renderCart();
}

// =====================================================
// 7. DISPLAY CART / ORDER SUMMARY (Step 3: Review Order)
// Called every time the cart changes, so subtotals and
// the total are always recomputed automatically.
// =====================================================
function renderCart() {
  // The total may have changed, so any old payment error is no longer correct
  clearMessage(paymentMessage);

  cartBody.innerHTML = "";

  cart.forEach(function (item) {
    const subtotal = item.price * item.qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img class="cart-thumb" src="${item.image}" alt="${item.name}">
      <div>
        <p class="cart-name">${item.name}</p>
        <p class="cart-unit">${formatPeso(item.price)} each</p>
        <div class="qty-controls">
          <button class="qty-btn" onclick="decreaseQty(${item.id})">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="increaseQty(${item.id})">+</button>
        </div>
      </div>
      <div class="cart-right">
        <p class="cart-subtotal">${formatPeso(subtotal)}</p>
        <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    `;
    cartBody.appendChild(row);
  });

  // Show "Cart is empty" only when there are no items
  emptyCart.style.display = cart.length === 0 ? "block" : "none";
  totalAmountEl.textContent = formatPeso(getTotal());
}

// =====================================================
// 8. PAYMENT (Steps 4-6: Enter, Validate & Compute, Confirm)
// =====================================================
function processPayment() {
  if (isLocked()) return;

  const total = getTotal();
  const cashText = cashInput.value.trim();

  // Rule 1: cart must not be empty
  if (cart.length === 0) {
    showMessage(paymentMessage, "Cart is empty. Please add at least one product before payment.", "error");
    return;
  }

  // Rule 2: blank input (the browser also gives "" for non-numeric input in a number field)
  if (cashText === "") {
    showMessage(paymentMessage, "Please enter a valid payment amount.", "error");
    return;
  }

  const cash = Number(cashText);

  // Rule 3: non-numeric or negative
  if (isNaN(cash) || cash < 0) {
    showMessage(paymentMessage, "Please enter a valid payment amount.", "error");
    return;
  }

  // Rule 4: insufficient
  if (cash < total) {
    showMessage(paymentMessage, "Insufficient payment. Please enter at least " + formatPeso(total) + ".", "error");
    return;
  }

  // Valid payment: Change = Amount Paid - Total Amount
  // (rounded to 2 decimal places to avoid decimal errors)
  const change = Math.round((cash - total) * 100) / 100;

  isPaid = true;
  cashInput.disabled = true;
  payBtn.disabled = true;

  showMessage(paymentMessage, "Payment successful! Change: " + formatPeso(change), "success");
  changeDisplay.textContent = formatPeso(change);
  clearMessage(cartMessage);
  generateReceipt(total, cash, change);
  transactionCounter++;
}

// =====================================================
// 9. RECEIPT (Step 7)
// =====================================================
function generateReceipt(total, cash, change) {
  const transactionNumber = "TXN-" + String(transactionCounter).padStart(4, "0");
  const dateTime = new Date().toLocaleString("en-PH");

  let itemRows = "";
  cart.forEach(function (item) {
    itemRows += `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${formatPeso(item.price)}</td>
        <td>${formatPeso(item.price * item.qty)}</td>
      </tr>
    `;
  });

  receiptContent.innerHTML = `
    <p class="receipt-title">CAMPUS SNACK BAR</p>
    <p class="receipt-sub">Official Digital Receipt</p>
    <div class="receipt-meta">
      <p><span>Transaction No.</span><strong>${transactionNumber}</strong></p>
      <p><span>Date &amp; Time</span><span>${dateTime}</span></p>
    </div>

    <table class="receipt-table">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="receipt-totals">
      <p class="grand"><span>Total Amount:</span><span>${formatPeso(total)}</span></p>
      <p><span>Cash Received:</span><span>${formatPeso(cash)}</span></p>
      <p><span>Change:</span><span>${formatPeso(change)}</span></p>
    </div>

    <p class="receipt-thanks">Thank you for your purchase!</p>
  `;

  receiptPanel.classList.remove("hidden");
  receiptPanel.scrollIntoView({ behavior: "smooth" });
}

// =====================================================
// 10. NEW TRANSACTION (clears cart, payment, receipt, messages)
// =====================================================
function newTransaction() {
  cart = [];
  isPaid = false;

  cashInput.value = "";
  cashInput.disabled = false;
  changeDisplay.textContent = formatPeso(0);
  payBtn.disabled = false;

  clearMessage(cartMessage);
  clearMessage(paymentMessage);

  receiptContent.innerHTML = "";
  receiptPanel.classList.add("hidden");

  renderCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =====================================================
// 11. EVENT LISTENERS AND STARTUP
// =====================================================
payBtn.addEventListener("click", processPayment);
newTransactionBtn.addEventListener("click", newTransaction);

// Keyboard support: pressing Enter in the cash field also pays
cashInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    processPayment();
  }
});

renderProducts();
renderCart();
