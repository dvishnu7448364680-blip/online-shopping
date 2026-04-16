const STORAGE_KEY = 'cart';
 
function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        console.warn('failed to parse cart', e);
        return [];
    }
}


function sanitizeCart(data) {
    if (!Array.isArray(data)) return [];
    return data
        .filter(i => i && typeof i === 'object' && i.id != null)
        .map(i => ({
            id: i.id,
            name: i.name || 'Unnamed product',
            price: Number(i.price) || 0,
            weight: i.weight || '',
            image: i.image || '',
            quantity: Number(i.quantity) || 0
        }))
        .filter(i => i.quantity > 0);

}

function saveCart(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeCart(data)));
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const badge = document.querySelector('.cart');
    if (badge) badge.textContent = totalItems;
}

function weightMultiplier(weight) {
    switch (weight) {
        case '500g': return 2;
        case '1kg':  return 4;
        default:      return 1;
    }
}

function parsePrice(text) {
    return Number(String(text).replace(/[^0-9.]/g, '')) || 0;
}

let cart = sanitizeCart(loadCart());

// ---------------------------------------------------------------------------
// page initialization

document.addEventListener('DOMContentLoaded', () => {
    // ensure any corrupted entries are cleaned up each time
    cart = sanitizeCart(cart);
    renderCartPage();
    bindProductButtons();
    updateCartCount();
});

// ---------------------------------------------------------------------------
// cart-page rendering

function renderCartPage() {
    const cartDisplay = document.getElementById('cartItemsDisplay');
    const cartSummary = document.getElementById('cartSummary');

    if (!cartDisplay) return; // not on cart page

    if (cart.length === 0) {
        cartDisplay.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-shopping-cart" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <p>Your cart is empty</p>
                <div class="empty-cart-btn">
                    <a href="fresh_vegetables.html">Start Shopping</a>
                </div>
            </div>
        `;
        if (cartSummary) cartSummary.innerHTML = '';
        return;
    }

    cartDisplay.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        const imgSrc = item.image && item.image.length ? item.image : 'photo/title logo/f2d_logo.png';
        return `
            <div class="cart-item">
                <img src="${imgSrc}" alt="${item.name}">
                <div class="item-details">
                    <p class="item-name">${item.name || 'Unnamed product'}</p>
                    ${item.weight ? `<p class="item-weight">Weight: ${item.weight}</p>` : ''}
                    <p class="item-price">Price: ₹${item.price != null ? item.price : '0.00'}</p>
                    <p class="item-total">Total: ₹${itemTotal.toFixed(2)}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="decrementQuantity(${item.id}, '${item.weight}')">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="incrementQuantity(${item.id}, '${item.weight}')">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id}, '${item.weight}')">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (cartSummary) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartSummary.innerHTML = `
            <div class="summary-row">
                <span>Subtotal (${itemCount} items):</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>Free</span>
            </div>
            <div class="summary-row">
                <span>Tax:</span>
                <span>₹${(total * 0.05).toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span>₹${(total * 1.05).toFixed(2)}</span>
            </div>
        `;
    }
}

function removeFromCart(productId, weight) {
    cart = cart.filter(item => !(item.id === productId && item.weight === weight));
    saveCart(cart);
    renderCartPage();
    updateCartCount();
}

function incrementQuantity(productId, weight) {
    const item = cart.find(i => i.id === productId && i.weight === weight);
    if (item) {
        item.quantity += 1;
        saveCart(cart);
        renderCartPage();
        updateCartCount();
    }
}

function decrementQuantity(productId, weight) {
    const item = cart.find(i => i.id === productId && i.weight === weight);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        saveCart(cart);
        renderCartPage();
        updateCartCount();
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert('Proceeding to checkout with ' + cart.reduce((sum, item) => sum + item.quantity, 0) + ' items.\nTotal: ₹' + (total * 1.05).toFixed(2));
}

// ---------------------------------------------------------------------------
// product-list page: bind "+" buttons and handle weight selection

function bindProductButtons() {
    const products = document.querySelectorAll('.fresh-fruits .freshed');
    products.forEach((el, idx) => {
        const productId = idx + 1;
        el.dataset.productId = productId;

        const nameEl = el.querySelector('p');
        const name = nameEl ? nameEl.innerText.trim() : 'Product ' + productId;

        const select = el.querySelector('select');
        const priceEl = el.querySelector('#price')
                     || el.querySelector('.product-price')
                     || el.querySelector('p:nth-of-type(2)');
        const basePrice = priceEl ? parsePrice(priceEl.textContent) : 0;

        if (select && priceEl) {
            select.addEventListener('change', () => {
                const mult = weightMultiplier(select.value);
                priceEl.textContent = '₹' + (basePrice * mult).toFixed(2);
            });
        }

        const btn = el.querySelector('button');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const weight = select ? select.value : '250g';
            const mult = weightMultiplier(weight);
            const selectedPrice = basePrice * mult;

            const existing = cart.find(i => i.id === productId && i.weight === weight);
            const imgSrc = el.querySelector('img')?.src || '';

            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name,
                    price: selectedPrice,
                    weight,
                    image: imgSrc,
                    quantity: 1
                });
            }

            saveCart(cart);
            updateCartCount();
            alert(`${name} (${weight}) added to cart`);
        });
    });
}

// end of scriptcart.js
