// Add these variables to your existing JavaScript
let selectedDeliveryOption = 'pickup';
let selectedBranch = 1;
let branches = [
    {
        id: 1,
        name: "Downtown Branch",
        address: "123 Main Street, Downtown",
        deliveryZones: [
            { min: 0, max: 5, fee: 0 },
            { min: 5, max: 10, fee: 0 },
            { min: 10, max: 15, fee: 50 },
            { min: 15, max: 20, fee: 80 }
        ]
    },
    {
        id: 2,
        name: "Uptown Branch",
        address: "456 Central Avenue, Uptown",
        deliveryZones: [
            { min: 0, max: 5, fee: 0 },
            { min: 5, max: 10, fee: 0 },
            { min: 10, max: 15, fee: 50 }
        ]
    },
    {
        id: 3,
        name: "Westside Branch",
        address: "789 Riverside Drive, Westside",
        deliveryZones: [
            { min: 0, max: 5, fee: 0 },
            { min: 5, max: 10, fee: 0 },
            { min: 10, max: 15, fee: 40 },
            { min: 15, max: 20, fee: 70 }
        ]
    }
];

// Add these functions to your existing JavaScript
function selectDeliveryOption(option) {
    selectedDeliveryOption = option;
    
    // Update UI
    document.querySelectorAll('.delivery-option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.delivery-details').forEach(detail => {
        detail.classList.remove('active');
    });
    document.getElementById(`${option}-details`).classList.add('active');
    
    // Update delivery fee display
    calculateDeliveryFee();
}

function selectBranch(branchId) {
    selectedBranch = branchId;
    
    // Update UI
    document.querySelectorAll('.branch-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Update delivery fee display
    calculateDeliveryFee();
}

function calculateDeliveryFee() {
    const distanceInput = document.getElementById('delivery-distance');
    const distance = parseFloat(distanceInput.value) || 0;
    const branch = branches.find(b => b.id === selectedBranch);
    
    let deliveryFee = 0;
    let isFreeDelivery = false;
    
    if (selectedDeliveryOption === 'delivery') {
        // Find the appropriate delivery zone
        const zone = branch.deliveryZones.find(z => distance >= z.min && distance <= z.max);
        deliveryFee = zone ? zone.fee : 100; // Default fee if beyond all zones
        
        // Check if free delivery applies
        isFreeDelivery = deliveryFee === 0 && distance <= 10;
    }
    
    // Update UI
    document.getElementById('delivery-fee-amount').textContent = deliveryFee;
    document.getElementById('free-delivery-text').style.display = isFreeDelivery ? 'inline' : 'none';
    
    // Update estimated delivery time
    const baseTime = 30;
    const additionalTime = Math.floor(distance / 5) * 5;
    document.getElementById('delivery-time').textContent = `${baseTime + additionalTime}-${baseTime + additionalTime + 15} minutes`;
    
    return deliveryFee;
}

// Update the proceedToCheckout function to include delivery info
function proceedToCheckout() {
    if (cart.length === 0) return;
    if (!selectedPaymentMethod) {
        showNotification('warning', 'Please select a payment method');
        return;
    }
    
    // Validate delivery details if delivery option selected
    if (selectedDeliveryOption === 'delivery') {
        const address = document.getElementById('delivery-address').value;
        const distance = document.getElementById('delivery-distance').value;
        
        if (!address || !distance) {
            showNotification('warning', 'Please enter your delivery address and distance');
            return;
        }
    }
    
    // Calculate delivery fee
    const deliveryFee = selectedDeliveryOption === 'delivery' ? calculateDeliveryFee() : 0;
    
    // Create order
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const orderTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0) + deliveryFee;
    const orderDate = new Date();
    
    const order = {
        id: orderId,
        date: orderDate,
        items: [...cart],
        total: orderTotal,
        paymentMethod: selectedPaymentMethod,
        status: 'pending',
        customerId: currentUser ? currentUser.id : null,
        deliveryOption: selectedDeliveryOption,
        branchId: selectedBranch,
        deliveryAddress: selectedDeliveryOption === 'delivery' ? document.getElementById('delivery-address').value : null,
        deliveryDistance: selectedDeliveryOption === 'delivery' ? parseFloat(document.getElementById('delivery-distance').value) : null,
        deliveryFee: deliveryFee,
        deliveryInstructions: selectedDeliveryOption === 'delivery' ? document.getElementById('delivery-instructions').value : null
    };
    
    orders.unshift(order); // Add to beginning of array
    
    // Update confirmation page
    document.getElementById('confirm-order-id').textContent = `#${orderId}`;
    document.getElementById('confirm-order-date').textContent = formatDate(orderDate) + ' at ' + formatTime(orderDate.toLocaleTimeString());
    document.getElementById('confirm-payment-method').textContent = formatPaymentMethod(selectedPaymentMethod);
    
    // Update order summary
    const orderSummary = document.getElementById('order-summary-items');
    let orderHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        orderHTML += `
            <div class="order-item">
                <span>₹{item.name} × ₹{item.quantity}</span>
                <span>₹{itemTotal.toFixed(2)}</span>
            </div>
        `;
    });
    
    // Add delivery fee if applicable
    if (deliveryFee > 0) {
        orderHTML += `
            <div class="order-item">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
        `;
    }
    
    orderSummary.innerHTML = orderHTML;
    document.getElementById('order-total').textContent = orderTotal.toFixed(2);
    
    // Clear cart
    cart = [];
    updateCart();
    selectedPaymentMethod = null;
    
    // Show confirmation page
    showPage('confirmation-page');
    
    // Show success notification
    showNotification('success', `Order #${orderId} confirmed! Total: ${orderTotal.toFixed(2)}`);
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(pageId).classList.add('active');
    
    // If showing order page, initialize delivery functionality
    if (pageId === 'order-page') {
        initializeDeliveryOptions();
    }
    
    // Update UI elements based on the current page
    updatePageSpecificUI(pageId);
}

function initializeDeliveryOptions() {
    // Set up delivery distance input listener
    const distanceInput = document.getElementById('delivery-distance');
    if (distanceInput) {
        distanceInput.addEventListener('input', calculateDeliveryFee);
    }
    
    // Initialize delivery option to pickup
    selectDeliveryOption('pickup');
    selectBranch(1);
}

// Add event listener for distance input to auto-calculate fee
document.getElementById('delivery-distance')?.addEventListener('input', calculateDeliveryFee);
function scrollToContact() {
    const contactSection = document.getElementById('contact');
    contactSection.scrollIntoView({ behavior: 'smooth' });
}