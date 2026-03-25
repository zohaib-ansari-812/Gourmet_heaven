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

// Global variables
    let cart = [];
    let currentPage = 'home-page';
    let selectedTable = null;
    let selectedPaymentMethod = null;
    let currentSlide = 0;
    let currentTestimonial = 0;
    let currentUser = null;
    
    // Restaurant data
    let orders = [];
    let reservations = [];
    let tables = [];
    let customers = [];
    
    // Staff credentials
    const staffCredentials = {
        "zohaib": { password: "zohaib123", name: "Zohaib" },
        "keshav": { password: "keshav123", name: "Keshav" },
        "pallavi": { password: "pallavi123", name: "Pallavi" },
        "muskan": { password: "muskan123", name: "Muskan" },
        "khushal": { password: "khushal123", name: "Khushal" },
        "devansh": { password: "devansh123", name: "Devansh" }
    };
    
    // Initialize the page
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize tables (6 tables of various sizes)
        initializeTables();
        
        // Set up event listeners
        document.getElementById('reservationForm').addEventListener('submit', handleReservation);
        document.getElementById('staffLoginForm').addEventListener('submit', handleStaffLogin);
        document.getElementById('customerLoginForm').addEventListener('submit', handleCustomerLogin);
        document.getElementById('customerRegisterForm').addEventListener('submit', handleCustomerRegister);
        
        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Set minimum date for reservation to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('reservation-date').min = today;
        
        // Initialize home page slider
        initSlider();
        initTestimonials();
        
        // Show home page by default
        showPage('home-page');
        
        // Check if user is logged in from localStorage
        checkLoggedInUser();
    });
    
    // Check if user is logged in from localStorage
    function checkLoggedInUser() {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            currentUser = JSON.parse(loggedInUser);
            updateNavForLoggedInUser();
        }
    }
    
    // Update nav for logged in user
    function updateNavForLoggedInUser() {
        const authToggle = document.querySelector('.auth-toggle');
        if (authToggle) {
            authToggle.innerHTML = `
                <button class="auth-btn" onclick="customerLogout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
                <span style="padding: 8px 15px; color: white;">Hi, ${currentUser.name.split(' ')[0]}</span>
            `;
        }
    }
    
    // Initialize restaurant tables
    function initializeTables() {
        tables = [
            { id: 1, capacity: 2, occupied: false },
            { id: 2, capacity: 2, occupied: false },
            { id: 3, capacity: 4, occupied: false },
            { id: 4, capacity: 4, occupied: false },
            { id: 5, capacity: 6, occupied: false },
            { id: 6, capacity: 8, occupied: false }
        ];
    }
    
    // Initialize home page slider
    function initSlider() {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            updateSlider();
        }, 5000);
    }
    
    function updateSlider() {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        
        slides.forEach((slide, index) => {
            if (index === currentSlide) {
                slide.classList.add('active');
                dots[index].classList.add('active');
            } else {
                slide.classList.remove('active');
                dots[index].classList.remove('active');
            }
        });
    }
    
    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
    }
    
    // Initialize testimonials slider
    function initTestimonials() {
        const testimonials = document.querySelectorAll('.testimonial');
        const dots = document.querySelectorAll('.testimonial-dot');
        
        setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            updateTestimonials();
        }, 6000);
    }
    
    function updateTestimonials() {
        const testimonials = document.querySelectorAll('.testimonial');
        const dots = document.querySelectorAll('.testimonial-dot');
        
        testimonials.forEach((testimonial, index) => {
            if (index === currentTestimonial) {
                testimonial.classList.add('active');
                dots[index].classList.add('active');
            } else {
                testimonial.classList.remove('active');
                dots[index].classList.remove('active');
            }
        });
    }
    
    function goToTestimonial(index) {
        currentTestimonial = index;
        updateTestimonials();
    }
    
    // Show specific page
    function showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-container, .auth-container').forEach(page => {
            page.classList.add('hidden');
        });
        
        // Show selected page
        document.getElementById(pageId).classList.remove('hidden');
        currentPage = pageId;
        
        // Update active nav link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if ((pageId === 'home-page' && link.getAttribute('href') === '#home') ||
                (pageId === 'menu-page' && link.getAttribute('href') === '#menu') ||
                (pageId === 'order-page' && link.getAttribute('href') === '#order') ||
                (pageId === 'booking-page' && link.getAttribute('href') === '#booking') ||
                (pageId === 'my-orders-page' && link.getAttribute('href') === '#my-orders') ||
                (pageId === 'staff-login-page' && link.getAttribute('href') === '#staff-login') ||
                (pageId === 'login-page' && link.getAttribute('href') === '#login') ||
                (pageId === 'register-page' && link.getAttribute('href') === '#register')) {
                link.classList.add('active');
            }
        });
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // If showing menu page, animate items
        if (pageId === 'menu-page') {
            animateMenuItems();
        }
        
        // If showing booking page, update tables
        if (pageId === 'booking-page') {
            updateTablesDisplay();
        }
        
        // If showing staff dashboard, update dashboard
        if (pageId === 'staff-dashboard') {
            updateStaffDashboard();
        }
        
        // If showing my orders page, update orders list
        if (pageId === 'my-orders-page') {
            updateOrdersList();
        }
        
        // Close mobile menu if open
        document.querySelector('.nav-links').classList.remove('active');
    }
    
    // Toggle mobile menu
    function toggleMenu() {
        document.querySelector('.nav-links').classList.toggle('active');
    }
    
    // Scroll to section
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Filter menu items
    function filterMenu(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Show/hide menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            if (category === 'all') {
                item.style.display = 'block';
            } else if (category === 'veg') {
                item.style.display = item.dataset.category.includes('veg') ? 'block' : 'none';
            } else if (category === 'nonveg') {
                item.style.display = item.dataset.category.includes('nonveg') ? 'block' : 'none';
            } else {
                item.style.display = item.dataset.category.includes(category) ? 'block' : 'none';
            }
        });
    }
    
    // Animate menu items
    function animateMenuItems() {
        const items = document.querySelectorAll('.menu-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
            }, 100);
        });
    }
    
    // Add item to cart
    function addToCart(name, price, image) {
        if (!currentUser) {
            showNotification('warning', 'Please login to add items to cart');
            showPage('login-page');
            return;
        }
        
        // Check if item already exists in cart
        const existingItem = cart.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name: name,
                price: price,
                image: image,
                quantity: 1
            });
        }
        
        updateCart();
        
        // Show success notification
        showNotification('success', `${name} added to cart!`);
    }
    
    // Update cart display
    function updateCart() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty. Browse our <a href="#" onclick="showPage(\'menu-page\')">menu</a> to add items.</p>';
            cartTotalElement.textContent = '0.00';
            checkoutBtn.disabled = true;
            return;
        }
        
        let cartHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-img">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div>
                            <div class="cart-item-name">${item.name}</div>
                            <div>₹${item.price.toFixed(2)} each</div>
                        </div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                        </div>
                        <div class="remove-item" onclick="removeItem(${index})">
                            <i class="fas fa-trash"></i>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = cartHTML;
        cartTotalElement.textContent = total.toFixed(2);
        checkoutBtn.disabled = false;
    }
    
    // Update item quantity
    function updateQuantity(index, change) {
        const newQuantity = cart[index].quantity + change;
        
        if (newQuantity < 1) {
            removeItem(index);
        } else {
            cart[index].quantity = newQuantity;
            updateCart();
        }
    }
    
    // Remove item from cart
    function removeItem(index) {
        const itemName = cart[index].name;
        cart.splice(index, 1);
        updateCart();
        showNotification('warning', `${itemName} removed from cart`);
    }
    
    // Select payment method
    function selectPaymentMethod(method) {
        selectedPaymentMethod = method;
        
        // Update UI
        document.querySelectorAll('.payment-option').forEach(option => {
            option.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        
        // Enable checkout button
        document.getElementById('checkout-btn').disabled = false;
    }
    
    // Proceed to checkout
    function proceedToCheckout() {
        if (cart.length === 0) return;
        if (!selectedPaymentMethod) {
            showNotification('warning', 'Please select a payment method');
            return;
        }
        
        // Create order
        const orderId = Math.floor(1000 + Math.random() * 9000);
        const orderTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const orderDate = new Date();
        
        const order = {
            id: orderId,
            date: orderDate,
            items: [...cart],
            total: orderTotal,
            paymentMethod: selectedPaymentMethod,
            status: 'pending',
            customerId: currentUser ? currentUser.id : null
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
                    <span>${item.name} × ${item.quantity}</span>
                    <span>₹${itemTotal.toFixed(2)}</span>
                </div>
            `;
        });
        
        orderSummary.innerHTML = orderHTML;
        document.getElementById('order-total').textContent = orderTotal.toFixed(2);
        
        // Clear cart
        cart = [];
        updateCart();
        selectedPaymentMethod = null;
        
        // Show confirmation page
        showPage('confirmation-page');
        
        // Show success notification
        showNotification('success', `Order #${orderId} confirmed! Total: ₹${orderTotal.toFixed(2)}`);
    }
    
    // Format payment method for display
    function formatPaymentMethod(method) {
        switch(method) {
            case 'credit-card': return 'Credit Card';
            case 'debit-card': return 'Debit Card';
            case 'cash': return 'Cash';
            case 'upi': return 'UPI';
            default: return method;
        }
    }
    
    // Update tables display for booking page
    function updateTablesDisplay() {
        const tablesGrid = document.getElementById('tables-grid');
        tablesGrid.innerHTML = '';
        
        tables.forEach(table => {
            const tableItem = document.createElement('div');
            tableItem.className = `table-item ${table.occupied ? 'occupied' : ''}`;
            tableItem.innerHTML = `
                <i class="fas fa-utensils"></i>
                <p>Table ${table.id}</p>
                <small>${table.capacity} ${table.capacity === 1 ? 'person' : 'people'}</small>
            `;
            
            if (!table.occupied) {
                tableItem.onclick = () => selectTable(table.id);
            }
            
            tablesGrid.appendChild(tableItem);
        });
    }
    
    // Select table for reservation
    function selectTable(tableId) {
        const table = tables.find(t => t.id === tableId);
        
        if (!table || table.occupied) {
            showNotification('warning', 'This table is not available');
            return;
        }
        
        // Deselect any previously selected table
        document.querySelectorAll('.table-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select the clicked table
        event.currentTarget.classList.add('selected');
        selectedTable = tableId;
    }
    
    // Handle reservation
    function handleReservation(e) {
        e.preventDefault();
        const name = document.getElementById('reservation-name').value;
        const phone = document.getElementById('reservation-phone').value;
        const date = document.getElementById('reservation-date').value;
        const time = document.getElementById('reservation-time').value;
        const guests = document.getElementById('reservation-guests').value;
        const requests = document.getElementById('special-requests').value;
        
        if (!name || !phone || !date || !time || !guests) {
            showNotification('warning', 'Please fill in all required fields');
            return;
        }
        
        if (!selectedTable) {
            showNotification('warning', 'Please select a table');
            return;
        }
        
        // Create reservation
        const reservationId = Math.floor(2000 + Math.random() * 9000);
        const reservationDate = new Date(date + ' ' + time);
        
        const reservation = {
            id: reservationId,
            name: name,
            phone: phone,
            date: reservationDate,
            time: formatTime(time),
            guests: parseInt(guests),
            table: selectedTable,
            requests: requests || 'None',
            status: 'pending',
            customerId: currentUser ? currentUser.id : null
        };
        
        // Mark table as occupied
        const table = tables.find(t => t.id === selectedTable);
        if (table) table.occupied = true;
        
        reservations.unshift(reservation); // Add to beginning of array
        
        // Reset form
        e.target.reset();
        selectedTable = null;
        
        // Show success notification
        showNotification('success', `Table booked successfully! Reservation #${reservationId}`);
        
        // Show home page after booking
        showPage('home-page');
    }
    
    // Handle staff login
    function handleStaffLogin(e) {
        e.preventDefault();
        const username = document.getElementById('staff-username').value.toLowerCase();
        const password = document.getElementById('staff-password').value;
        
        if (staffCredentials[username] && staffCredentials[username].password === password) {
            // Successful login
            document.getElementById('staff-name').textContent = staffCredentials[username].name;
            showPage('staff-dashboard');
        } else {
            showNotification('danger', 'Invalid staff credentials');
        }
    }
    
    // Handle customer login
    function handleCustomerLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Make API request to backend
        fetch('https://gourmetheaven-production.up.railway.app/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    token: data.token
                };
                localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
                localStorage.setItem('authToken', data.token);
                updateNavForLoggedInUser();
                showPage('home-page');
                showNotification('success', 'Logged in successfully!');
                // Clear form
                document.getElementById('customerLoginForm').reset();
            } else {
                showNotification('danger', data.message || 'Invalid email or password');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showNotification('danger', 'Error connecting to server');
        });
    }
    
    // Handle customer registration
    function handleCustomerRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            showNotification('danger', 'Passwords do not match');
            return;
        }
        
        // Make API request to backend
        fetch('https://gourmetheaven-production.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    phone: data.user.phone,
                    token: data.token
                };
                localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
                localStorage.setItem('authToken', data.token);
                updateNavForLoggedInUser();
                
                // Reset form
                e.target.reset();
                
                showPage('home-page');
                showNotification('success', 'Registration successful! Welcome to Gourmet Haven.');
            } else {
                showNotification('danger', data.message || 'Registration failed');
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            showNotification('danger', 'Error connecting to server');
        });
    }
    
    // Customer logout
    function customerLogout() {
        currentUser = null;
        localStorage.removeItem('loggedInUser');
        document.querySelector('.auth-toggle').innerHTML = `
            <button class="auth-btn" onclick="showPage('login-page')">Login</button>
            <button class="auth-btn" onclick="showPage('register-page')">Register</button>
        `;
        showPage('home-page');
        showNotification('info', 'Logged out successfully');
    }
    
    // Staff logout
    function staffLogout() {
        showPage('staff-login-page');
        document.getElementById('staffLoginForm').reset();
    }
    
    // Update staff dashboard
    function updateStaffDashboard() {
        // Count pending orders
        const pendingOrders = orders.filter(order => order.status === 'pending');
        document.getElementById('pending-orders-count').textContent = pendingOrders.length;
        
        // Count active reservations (today's reservations)
        const today = new Date().toISOString().split('T')[0];
        const activeReservations = reservations.filter(reservation => 
            new Date(reservation.date).toISOString().split('T')[0] === today
        );
        document.getElementById('active-reservations-count').textContent = activeReservations.length;
        
        // Count available tables
        const availableTables = tables.filter(table => !table.occupied).length;
        document.getElementById('available-tables-count').textContent = availableTables;
        
        // Update pending orders list
        const ordersList = document.getElementById('staff-pending-orders');
        if (pendingOrders.length === 0) {
            ordersList.innerHTML = '<p class="empty-message">No pending orders at this time</p>';
        } else {
            ordersList.innerHTML = '';
            pendingOrders.forEach(order => {
                const orderItem = document.createElement('div');
                orderItem.className = 'order-list-item';
                orderItem.innerHTML = `
                    <div class="order-list-header">
                        <div>
                            <span class="order-id">Order #${order.id}</span>
                            <span class="order-time">${formatDate(order.date)} at ${formatTime(order.date.toLocaleTimeString())}</span>
                        </div>
                        <span class="order-status status-pending">Pending</span>
                    </div>
                    <div class="order-details">
                        <div class="order-items-list">
                            ${order.items.map(item => `
                                <div class="order-item-line">
                                    <span class="order-item-name">${item.name}</span>
                                    <span class="order-item-quantity">× ${item.quantity}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-actions">
                            <button class="order-action-btn complete" onclick="updateOrderStatus(${order.id}, 'preparing')">
                                <i class="fas fa-utensils"></i> Start Preparing
                            </button>
                            <button class="order-action-btn cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
                `;
                ordersList.appendChild(orderItem);
            });
        }
        
        // Update active reservations list
        const reservationsList = document.getElementById('staff-active-reservations');
        if (activeReservations.length === 0) {
            reservationsList.innerHTML = '<p class="empty-message">No active reservations at this time</p>';
        } else {
            reservationsList.innerHTML = '';
            activeReservations.forEach(reservation => {
                const reservationItem = document.createElement('div');
                reservationItem.className = 'reservation-list-item';
                
                let statusClass = 'status-pending';
                if (reservation.status === 'confirmed') statusClass = 'status-confirmed';
                if (reservation.status === 'seated') statusClass = 'status-completed';
                if (reservation.status === 'cancelled') statusClass = 'status-cancelled';
                
                reservationItem.innerHTML = `
                    <div class="reservation-list-header">
                        <div>
                            <span class="reservation-id">Reservation #${reservation.id}</span>
                            <span class="reservation-time">${formatDate(reservation.date)} at ${reservation.time}</span>
                        </div>
                        <span class="reservation-status ${statusClass}">${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}</span>
                    </div>
                    <div class="reservation-details">
                        <div class="reservation-info">
                            <div class="reservation-detail">
                                <span class="reservation-label">Name:</span>
                                <span class="reservation-value">${reservation.name}</span>
                            </div>
                            <div class="reservation-detail">
                                <span class="reservation-label">Guests:</span>
                                <span class="reservation-value">${reservation.guests} ${reservation.guests === 1 ? 'person' : 'people'}</span>
                            </div>
                            <div class="reservation-detail">
                                <span class="reservation-label">Table:</span>
                                <span class="reservation-value">Table ${reservation.table}</span>
                            </div>
                        </div>
                        <div class="reservation-actions">
                            ${reservation.status === 'pending' ? `
                                <button class="reservation-action-btn complete" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">
                                    <i class="fas fa-check"></i> Confirm
                                </button>
                                <button class="reservation-action-btn cancel" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            ` : ''}
                            ${reservation.status === 'confirmed' ? `
                                <button class="reservation-action-btn complete" onclick="updateReservationStatus(${reservation.id}, 'seated')">
                                    <i class="fas fa-chair"></i> Mark as Seated
                                </button>
                                <button class="reservation-action-btn cancel" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            ` : ''}
                            ${reservation.status === 'seated' ? `
                                <button class="reservation-action-btn complete" onclick="markReservationComplete(${reservation.id})">
                                    <i class="fas fa-check-circle"></i> Mark Complete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                reservationsList.appendChild(reservationItem);
            });
        }
    }
    
    // Update order status (staff)
    function updateOrderStatus(orderId, status) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            showNotification('success', `Order #${orderId} status updated to ${status}`);
            
            // If cancelled, make sure to update the dashboard
            updateStaffDashboard();
        }
    }
    
    // Update reservation status (staff)
    function updateReservationStatus(reservationId, status) {
        const reservation = reservations.find(r => r.id === reservationId);
        if (reservation) {
            reservation.status = status;
            
            // If cancelled, mark table as available
            if (status === 'cancelled') {
                const table = tables.find(t => t.id === reservation.table);
                if (table) table.occupied = false;
            }
            
            showNotification('success', `Reservation #${reservationId} status updated to ${status}`);
            updateStaffDashboard();
        }
    }
    
    // Mark reservation as complete (staff)
    function markReservationComplete(reservationId) {
        const reservation = reservations.find(r => r.id === reservationId);
        if (reservation) {
            // Mark table as available
            const table = tables.find(t => t.id === reservation.table);
            if (table) table.occupied = false;
            
            // Remove reservation from active list
            reservations = reservations.filter(r => r.id !== reservationId);
            
            showNotification('success', `Reservation #${reservationId} marked as complete`);
            updateStaffDashboard();
        }
    }
    
    // Update orders list for customer view
    function updateOrdersList() {
        const ordersList = document.getElementById('orders-list');
        
        if (!currentUser) {
            ordersList.innerHTML = `
                <div class="order-card">
                    <p>Please <a href="#" onclick="showPage('login-page')">login</a> to view your orders.</p>
                </div>
            `;
            return;
        }
        
        const customerOrders = orders.filter(order => order.customerId === currentUser.id);
        
        if (customerOrders.length === 0) {
            ordersList.innerHTML = '<p class="empty-message">You haven\'t placed any orders yet. <a href="#" onclick="showPage(\'menu-page\')">Browse our menu</a> to get started.</p>';
            return;
        }
        
        ordersList.innerHTML = '';
        
        customerOrders.forEach(order => {
            let statusClass = 'status-pending';
            let statusText = 'Pending';
            
            if (order.status === 'preparing') {
                statusClass = 'status-preparing';
                statusText = 'Preparing';
            } else if (order.status === 'ready') {
                statusClass = 'status-ready';
                statusText = 'Ready';
            } else if (order.status === 'completed') {
                statusClass = 'status-completed';
                statusText = 'Completed';
            } else if (order.status === 'cancelled') {
                statusClass = 'status-cancelled';
                statusText = 'Cancelled';
            }
            
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <span class="order-id">Order #${order.id}</span>
                        <span class="order-date">${formatDate(order.date)} at ${formatTime(order.date.toLocaleTimeString())}</span>
                    </div>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-details">
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item-summary">
                                <div class="order-item-img">
                                    <img src="${item.image}" alt="${item.name}">
                                </div>
                                <div>
                                    <div class="order-item-name">${item.name}</div>
                                    <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-summary-side">
                        <div class="order-total-summary">Total: ₹${order.total.toFixed(2)}</div>
                        <div class="order-payment-method">Payment: ${formatPaymentMethod(order.paymentMethod)}</div>
                        <div class="order-actions">
                            ${order.status === 'ready' ? `
                                <button class="order-action-btn primary" onclick="completeOrder(${order.id})">
                                    <i class="fas fa-check"></i> Order Received
                                </button>
                            ` : ''}
                            ${order.status === 'completed' || order.status === 'cancelled' ? `
                                <button class="order-action-btn secondary" onclick="reorderItems(${order.id})">
                                    <i class="fas fa-redo"></i> Reorder
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            ordersList.appendChild(orderCard);
        });
    }
    
    // Complete order (customer marks as received)
    function completeOrder(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'completed';
            updateOrdersList();
            showNotification('success', `Order #${orderId} marked as received`);
        }
    }
    
    // Reorder items from a previous order
    function reorderItems(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.items.forEach(item => {
                addToCart(item.name, item.price, item.image);
            });
            showPage('order-page');
            showNotification('info', 'Items from your previous order have been added to your cart');
        }
    }
    
    // Format date for display
    function formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Format time for display
    function formatTime(timeString) {
        // Handle both "HH:MM:SS" and "HH:MM" formats
        const timeParts = timeString.split(':');
        let hour = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour || 12; // Convert 0 to 12
        return `${hour}:${minutes} ${ampm}`;
    }
    
    // Show notification
    function showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i> ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Get appropriate icon for notification type
    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'info': return 'info-circle';
            case 'danger': return 'times-circle';
            default: return 'info-circle';
        }
    }

    // ============== API BASE URL ==============
const API_BASE_URL = 'https://gourmetheaven-production.up.railway.app/api';

// ============== AUTH FUNCTIONS ==============

// Login form submit handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showNotification('success', 'Login successful!');
            showPage('home-page');
        } else {
            showNotification('danger', data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('danger', 'Network error. Please try again.');
    }
});

// Register form submit handler
document.getElementById('customerRegisterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        phone: document.getElementById('register-phone').value,
        password: document.getElementById('register-password').value
    };
    
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (userData.password !== confirmPassword) {
        showNotification('danger', 'Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showNotification('success', 'Registration successful!');
            showPage('home-page');
        } else {
            showNotification('danger', data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('danger', 'Network error. Please try again.');
    }
});

// ============== API CALLS WITH AUTH ==============

// Fetch with auth token
async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options
    });
    
    return response.json();
}

// Get user profile
async function getUserProfile() {
    try {
        const data = await fetchWithAuth('/auth/me');
        console.log('User profile:', data);
        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// ============== LOGOUT FUNCTION ==============

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showNotification('info', 'Logged out successfully');
    updateNavForLoggedInUser();
    showPage('home-page');
}

// ============== CHECK LOGIN STATUS ==============

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        updateNavForLoggedInUser();
    }
});

// Update navigation for logged in user
function updateNavForLoggedInUser() {
    const authToggle = document.querySelector('.auth-toggle');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (authToggle && isLoggedIn()) {
        authToggle.innerHTML = `
            <span style="padding: 8px 15px; color: white;">Hi, ${user.name?.split(' ')[0] || 'User'}</span>
            <button class="auth-btn" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    } else {
        authToggle.innerHTML = `
            <button class="auth-btn" onclick="showPage('login-page')">Login</button>
            <button class="auth-btn" onclick="showPage('register-page')">Register</button>
        `;
    }
}

// ============== PROTECTED PAGES ==============

function showPage(pageId) {
    // Check if page requires authentication
    const protectedPages = ['my-orders-page', 'order-page', 'booking-page'];
    
    if (protectedPages.includes(pageId) && !isLoggedIn()) {
        showNotification('warning', 'Please login first');
        pageId = 'login-page';
    }
    
    // Hide all pages
    document.querySelectorAll('.page-container, .auth-container').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show selected page
    document.getElementById(pageId)?.classList.remove('hidden');
    currentPage = pageId;
    
    // Update active nav link
    updateActiveNavLink(pageId);
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Close mobile menu
    document.querySelector('.nav-links')?.classList.remove('active');
}

// ============== UPDATE ACTIVE NAV LINK ==============
function updateActiveNavLink(pageId) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current page link
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if ((pageId === 'home-page' && href === '#home') ||
            (pageId === 'menu-page' && href === '#menu') ||
            (pageId === 'order-page' && href === '#order') ||
            (pageId === 'booking-page' && href === '#booking') ||
            (pageId === 'my-orders-page' && href === '#my-orders') ||
            (pageId === 'staff-login-page' && href === '#staff-login') ||
            (pageId === 'login-page' && href === '#login') ||
            (pageId === 'register-page' && href === '#register')) {
            link.classList.add('active');
        }
    });
}

// ============== NOTIFICATION FUNCTION ==============

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i> ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    return {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle',
        danger: 'times-circle'
    }[type] || 'info-circle';
}

// ============== ORDER FUNCTIONS ==============

// Place order
async function placeOrder(orderData) {
    try {
        const data = await fetchWithAuth('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        if (data.success) {
            showNotification('success', 'Order placed successfully!');
            return data;
        } else {
            showNotification('danger', data.message);
        }
    } catch (error) {
        console.error('Order error:', error);
        showNotification('danger', 'Failed to place order');
    }
}

// Get my orders
async function getMyOrders() {
    try {
        const data = await fetchWithAuth('/orders/my-orders');
        return data;
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}