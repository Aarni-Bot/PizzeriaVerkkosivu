document.addEventListener('DOMContentLoaded', () => {
    const CART_KEY  = 'pizzanyt_cart';
    const loadCart  = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; } };
    const saveCart  = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
    var PRICES_KEY = 'pizzanyt_prices';
    const loadPrices = () => { try { return JSON.parse(localStorage.getItem(PRICES_KEY)) || {}; } catch { return {}; } };
    const savePrices = (p) => localStorage.setItem(PRICES_KEY, JSON.stringify(p));
    let cart       = loadCart();
    let cartPrices = loadPrices();
    const cartBadges = document.querySelectorAll('.cart-quantity');
    const toast      = document.getElementById('toast');
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    document.body.appendChild(overlay);

    const panel = document.createElement('div');
    panel.id = 'cart-panel';
    document.body.appendChild(panel);

    let toastTimer;
    const showToast = (msg) => {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    };
    window.showToastGlobal = showToast;

    const updateCount = () => {
        cart = loadCart();
        const total = Object.values(cart).reduce((s, v) => s + v, 0);
        cartBadges.forEach(el => el.textContent = total);
    };

    const FANTASIA_PREFIX = '__fantasia__';
    const PIZZA_PREFIX    = '__pizza__';

    const renderCartItem = (name, qty) => {
        const price = cartPrices[name] || 0;
        const lineTotal = (price * qty).toFixed(2).replace('.', ',');

        if (name.startsWith(FANTASIA_PREFIX)) {
            try {
                const data = JSON.parse(name.slice(FANTASIA_PREFIX.length));
                const isGluten = data.pohja === 'Gluteeniton';
                const badges = [];
                if (data.koko === 'Iso') badges.push({ text: 'Iso', cls: 'fb-size' });
                if (isGluten) badges.push({ text: 'Gluteeniton', cls: 'fb-gluten' });
                badges.push({ text: data.kastike, cls: 'fb-sauce' });
                if (data.taytteet && data.taytteet.length) {
                    data.taytteet.forEach(t => badges.push({ text: t, cls: 'fb-topping' }));
                }
                const label = 'Fantasia Pizza' + (data.koko === 'Iso' ? ' (Iso)' : '');
                return `
                    <div class="cart-item fantasia-cart-item">
                        <div class="fantasia-cart-top">
                            <span class="cart-item-name">${label}</span>
                            <div class="cart-item-controls">
                                <button class="edit-qty" data-name="${name.replace(/"/g,'&quot;')}" data-change="-1">&#8722;</button>
                                <span class="cart-item-qty">${qty}</span>
                                <button class="edit-qty" data-name="${name.replace(/"/g,'&quot;')}" data-change="1">+</button>
                            </div>
                        </div>
                        <div class="fantasia-badges">
                            ${badges.map(b => `<span class="fantasia-badge ${b.cls}">${b.text}</span>`).join('')}
                        </div>
                        <div class="cart-item-price">${lineTotal} €</div>
                    </div>`;
            } catch(e) { }
        }

        if (name.startsWith(PIZZA_PREFIX)) {
            try {
                const data = JSON.parse(name.slice(PIZZA_PREFIX.length));
                const badges = [];
                if (data.koko === 'Iso') badges.push({ text: 'Iso', cls: 'fb-size' });
                if (data.gluteeniton) badges.push({ text: 'Gluteeniton', cls: 'fb-gluten' });
                if (data.extras && data.extras.length) {
                    data.extras.forEach(e => badges.push({ text: e, cls: 'fb-topping' }));
                }
                const displayName = data.base + (data.koko === 'Iso' ? ' (Iso)' : '');
                return `
                    <div class="cart-item fantasia-cart-item">
                        <div class="fantasia-cart-top">
                            <span class="cart-item-name">${displayName}</span>
                            <div class="cart-item-controls">
                                <button class="edit-qty" data-name="${name.replace(/"/g,'&quot;')}" data-change="-1">&#8722;</button>
                                <span class="cart-item-qty">${qty}</span>
                                <button class="edit-qty" data-name="${name.replace(/"/g,'&quot;')}" data-change="1">+</button>
                            </div>
                        </div>
                        ${badges.length > 0 ? `<div class="fantasia-badges">${badges.map(b => `<span class="fantasia-badge ${b.cls}">${b.text}</span>`).join('')}</div>` : ''}
                        <div class="cart-item-price">${lineTotal} €</div>
                    </div>`;
            } catch(e) { }
        }

        return `
            <div class="cart-item">
                <span class="cart-item-name">${name}</span>
                <div class="cart-item-controls">
                    <button class="edit-qty" data-name="${name.replace(/"/g,'&quot;')}" data-change="-1">&#8722;</button>
                    <span class="cart-item-qty">${qty}</span>
                    <button class="edit-qty" data-name="${name.replace(/"/g,'&quot;')}" data-change="1">+</button>
                </div>
                <div class="cart-item-price">${lineTotal} €</div>
            </div>`;
    };

    const renderPanel = () => {
        cart = loadCart();
        cartPrices = loadPrices();
        const items = Object.entries(cart);
        const totalItems = items.reduce((s, [, q]) => s + q, 0);

        const itemsHtml = items.map(([name, qty]) => renderCartItem(name, qty)).join('');

        panel.innerHTML = `
            <div class="cart-header">
                <h2>Ostoskori</h2>
                <button id="close-cart">Sulje</button>
            </div>
            <div class="cart-body">
                ${items.length === 0
                    ? '<div class="cart-empty"><p>Korisi on tyhjä.<br>Lisää herkullisia pizzoja!</p></div>'
                    : itemsHtml}
            </div>
            ${items.length > 0 ? `
            <div class="cart-footer">
                <div class="cart-total"><span>Yhteensä (kpl)</span><span>${totalItems} kpl</span></div>
                <div class="cart-total"><span>Yhteensä (€)</span><span>${items.reduce((s,[n,q])=>s+(cartPrices[n]||0)*q,0).toFixed(2).replace('.',',')} €</span></div>
                <button class="checkout-btn">Tilaa nyt</button>
            </div>` : ''}
        `;

        document.getElementById('close-cart').onclick = closeCart;

        panel.querySelectorAll('.edit-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                const name   = btn.dataset.name;
                const change = parseInt(btn.dataset.change);
                cart[name] = (cart[name] || 0) + change;
                if (cart[name] <= 0) delete cart[name];
                saveCart(cart);
                updateCount();
                renderPanel();
            });
        });

        const checkoutBtn = panel.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const loggedIn = localStorage.getItem('pizzanyt_loggedin');
                if (!loggedIn) {
                    panel.querySelector('.cart-footer').insertAdjacentHTML('afterbegin',
                        '<div class="cart-login-notice">Sinun täytyy <a href="login.html">kirjautua sisään</a> tilataksesi.</div>'
                    );
                    return;
                }
                openCheckoutModal();
            });
        }
    };

    const coOverlay = document.createElement('div');
    coOverlay.id = 'checkout-modal-overlay';
    document.body.appendChild(coOverlay);

    const coModal = document.createElement('div');
    coModal.id = 'checkout-modal';
    document.body.appendChild(coModal);

    const closeCheckoutModal = () => { coModal.classList.remove('active'); coOverlay.classList.remove('active'); };
    coOverlay.addEventListener('click', closeCheckoutModal);

    const openCheckoutModal = () => {
        const totalEur = Object.entries(cart)
            .reduce((s, [name, qty]) => s + (cartPrices[name] || 0) * qty, 0)
            .toFixed(2).replace('.', ',');
        coModal.innerHTML = `
            <div class="co-header">
                <h2>Tilauksen viimeistely</h2>
                <button class="co-close-btn" id="co-close">&#10005;</button>
            </div>
            <div class="co-body" id="co-body">
                <p class="co-step-label">Valitse toimitustapa</p>
                <div class="co-delivery-options">
                    <button class="co-option-btn" id="co-pickup">
                        <span class="co-option-title">Nouto</span>
                        <span class="co-option-sub">Aleksis Kiven tie 15, 04200 Kerava</span>
                    </button>
                    <button class="co-option-btn" id="co-delivery">
                        <span class="co-option-title">Kuljetus</span>
                        <span class="co-option-sub">Toimitus mahdollinen 20km säteellä</span>
                    </button>
                </div>
                <div class="co-address-wrap" id="co-address-wrap" style="display:none;">
                    <label class="co-label" for="co-address-input">Toimitusosoite</label>
                    <input class="co-input" id="co-address-input" type="text" placeholder="Katuosoite, kaupunki" autocomplete="street-address">
                    <div class="co-address-error" id="co-address-error"></div>
                </div>
                <button class="co-confirm-btn" id="co-confirm" style="display:none;">Vahvista tilaus</button>
            </div>
        `;

        coModal.classList.add('active');
        coOverlay.classList.add('active');

        document.getElementById('co-close').addEventListener('click', closeCheckoutModal);

        let selectedMethod = null;
        const pickupBtn   = document.getElementById('co-pickup');
        const deliveryBtn = document.getElementById('co-delivery');
        const addressWrap = document.getElementById('co-address-wrap');
        const confirmBtn  = document.getElementById('co-confirm');
        const addressErr  = document.getElementById('co-address-error');

        const selectMethod = (method) => {
            selectedMethod = method;
            pickupBtn.classList.toggle('co-option-btn--active',   method === 'pickup');
            deliveryBtn.classList.toggle('co-option-btn--active', method === 'delivery');
            addressWrap.style.display = method === 'delivery' ? 'flex' : 'none';
            confirmBtn.style.display  = 'block';
            addressErr.textContent    = '';
        };

        pickupBtn.addEventListener('click',   () => selectMethod('pickup'));
        deliveryBtn.addEventListener('click', () => selectMethod('delivery'));

        const calculateLengthToAdress = (address) => {
            const apiKey = '69ae74e043cd5168620268qvma49b6e';
            const shopAddress = 'Aleksis Kiven tie 15, 04200 Kerava';

            const urlCustomer = `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${apiKey}`;
            const urlShop = `https://geocode.maps.co/search?q=${encodeURIComponent(shopAddress)}&api_key=${apiKey}`;

            return Promise.all([
                fetch(urlCustomer).then(r => r.json()),
                fetch(urlShop).then(r => r.json())
            ])
            .then(([customerData, shopData]) => {
                if (!customerData[0] || !shopData[0]) {
                    console.error('Osoitetta ei löytynyt');
                    return null;
                }

                const lat1 = parseFloat(shopData[0].lat);
                const lon1 = parseFloat(shopData[0].lon);
                const lat2 = parseFloat(customerData[0].lat);
                const lon2 = parseFloat(customerData[0].lon);

                const toRad = d => d * Math.PI / 180;
                const R = 6371;

                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);

                const a =
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);

                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const dist = R * c;

                console.log('Etäisyys kilometreinä:', dist.toFixed(2));
                return dist;
            })
            .catch(error => {
                console.error('Virhe kutsussa:', error);
                return null;
            });
        };

        confirmBtn.addEventListener('click', () => {
            const glutenFree = Object.keys(cart).some(name => {
                if (name.startsWith(FANTASIA_PREFIX)) {
                    try { return JSON.parse(name.slice(FANTASIA_PREFIX.length)).pohja === 'Gluteeniton'; } catch(e) { return false; }
                }
                if (name.startsWith(PIZZA_PREFIX)) {
                    try { return JSON.parse(name.slice(PIZZA_PREFIX.length)).gluteeniton === true; } catch(e) { return false; }
                }
                return name.includes("Gluteeniton");
            });

            let ingredientMinutes = 0;
            let pizzaCount = 0;
            Object.entries(cart).forEach(([name, qty]) => {
                pizzaCount += qty;
                let ingredients = 0;
                if (name.startsWith(FANTASIA_PREFIX)) {
                    try {
                        const d = JSON.parse(name.slice(FANTASIA_PREFIX.length));
                        ingredients = d.taytteet ? d.taytteet.length : 0;
                    } catch(e) {}
                } else if (name.startsWith(PIZZA_PREFIX)) {
                    try {
                        const d = JSON.parse(name.slice(PIZZA_PREFIX.length));
                        ingredients = d.extras ? d.extras.length : 0;
                    } catch(e) {}
                }
                ingredientMinutes += ingredients * qty;
            });

            const basePrepTime = (10 * pizzaCount) + ingredientMinutes + (glutenFree ? 3 : 0);

            if (selectedMethod === 'pickup') {
                const now = new Date();
                now.setMinutes(now.getMinutes() + basePrepTime);
                finaliseOrder(selectedMethod, '', now);
                return;
            }
            if (selectedMethod === 'delivery') {
                const addr = document.getElementById('co-address-input').value.trim();
                if (!addr) { addressErr.textContent = 'Syötä toimitusosoite.'; return; }

                calculateLengthToAdress(addr).then(distance => {
                    if (distance === null) {
                        addressErr.textContent = 'Osoitetta ei löydetty. Tarkista osoite.';
                        return;
                    }

                    console.log(distance);

                    if (distance > 20.0) {
                        addressErr.textContent = 'Emme toimita yli 20 km:n päähän. Hae tilaus ravintolasta: Aleksis Kiven tie 15, Kerava.';
                        return;
                    }

                    const now = new Date();
                    let deliveryExtra;

                    if (distance > 10.0) {
                        deliveryExtra = 20;
                        console.log("20min delivery extra");
                    } else if (distance > 3.0) {
                        deliveryExtra = 10;
                        console.log("10min delivery extra");
                    } else {
                        deliveryExtra = 5;
                        console.log("5min delivery extra");
                    }

                    now.setMinutes(now.getMinutes() + basePrepTime + deliveryExtra);

                    finaliseOrder(selectedMethod, addr, now);
                });
            }
        });

        const finaliseOrder = (method, addrVal, now) => {
            const timeStr  = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            const isDelivery = method === 'delivery';
            console.log(addrVal);

            document.getElementById('co-body').innerHTML = `
                <div class="co-success">
                    <div class="co-success-icon">✓</div>
                    <h3>Tilaus vastaanotettu!</h3>
                    <p class="co-success-method">${isDelivery ? 'Kuljetus osoitteeseen' : 'Nouda pizzasi osoitteesta: Aleksis Kiven tie 15, Kerava'}</p>
                    ${isDelivery ? '<p class="co-success-addr">' + addrVal + '</p>' : ''}
                    <div class="co-success-time">
                        <span class="co-time-label">${isDelivery ? 'Arvioitu toimitusaika' : 'Arvioitu valmistumisaika'}</span>
                        <span class="co-time-value">${timeStr}</span>
                    </div>
                    <p class="co-success-total">Yhteensä <strong>${totalEur} €</strong></p>
                    <button class="co-done-btn" id="co-done">Sulje</button>
                </div>
            `;

            Object.keys(cart).forEach(k => delete cart[k]);
            saveCart(cart);
            updateCount();
            closeCart();

            document.getElementById('co-done').addEventListener('click', closeCheckoutModal);
        };
    };

    const fantasiaBtn = document.querySelector('.sbmit');

    if (fantasiaBtn) {
        fantasiaBtn.addEventListener('click', () => {

            const kokoEl    = document.querySelector('input[name="fantasiakoko"]:checked');
            const pohjaEl   = document.querySelector('input[name="pohja"]:checked');
            const kastikeEl = document.querySelector('input[name="kastike"]:checked');

            if (!kokoEl || !pohjaEl || !kastikeEl) {
                showToast("Valitse koko, pohja ja kastike!");
                return;
            }

            const kokoText    = kokoEl.parentElement.innerText.trim();
            const pohjaText   = pohjaEl.parentElement.innerText.trim();
            const kastikeText = kastikeEl.parentElement.innerText.trim();

            const selectedTaytteet = [];
            document.querySelectorAll('select.täyte').forEach(sel => {
                if (parseInt(sel.value) > 0) {
                    const amount = parseInt(sel.value) === 2 ? ' x2' : '';
                    selectedTaytteet.push(sel.dataset.name + amount);
                }
            });

            if (selectedTaytteet.length === 0) {
                showToast("Valitse ainakin yksi täyte!");
                return;
            }

            const isGluten = pohjaText.includes("Gluteeniton");
            const isIso    = kokoText.includes("Iso");

            const data = {
                koko:     isIso ? 'Iso' : 'Normaali',
                pohja:    isGluten ? 'Gluteeniton' : 'Normaali',
                kastike:  kastikeText,
                taytteet: selectedTaytteet
            };

            const cartKey = FANTASIA_PREFIX + JSON.stringify(data);

            let price = isIso ? 14.90 : 11.90;
            selectedTaytteet.forEach(t => { price += t.includes('x2') ? 2.0 : 1.0; });
            if (isGluten) price += 2.0;

            cart[cartKey] = (cart[cartKey] || 0) + 1;
            cartPrices[cartKey] = price;

            saveCart(cart);
            savePrices(cartPrices);
            updateCount();

            const label = (isGluten ? 'Gluteeniton ' : '') + 'Fantasia Pizza' + (isIso ? ' (Iso)' : '');
            showToast(label + ' lisätty koriin!');
        });
    }

    const openCart  = () => { renderPanel(); panel.style.right = '0px'; overlay.classList.add('active'); };
    const closeCart = () => { panel.style.right = '-420px'; overlay.classList.remove('active'); };

    document.querySelectorAll('.cart-link').forEach(el =>
        el.addEventListener('click', e => { e.preventDefault(); openCart(); })
    );
    overlay.addEventListener('click', closeCart);

    document.querySelectorAll('a[href="login.html"]').forEach(link => {
        link.addEventListener('click', () => {
            localStorage.setItem('pizzanyt_paluusivu', window.location.href);
        });
    });

    document.querySelectorAll('.extras-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const info     = btn.closest('.pizza-info');
            const extPanel = info.querySelector('.extras-panel');
            const isOpen   = extPanel.style.display !== 'none';
            extPanel.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen ? '+ Lisää täytteitä' : '− Piilota täytteet';
            btn.classList.toggle('extras-toggle-btn--open', !isOpen);
        });
    });

    document.querySelectorAll('.pizza-card').forEach(card => {
        const qtyInput  = card.querySelector('.pizza-quantity');
        const decBtn    = card.querySelector('.decrease');
        const incBtn    = card.querySelector('.increase');
        const orderBtn  = card.querySelector('.order-btn');
        if (!qtyInput || !orderBtn) return;

        if (decBtn) decBtn.addEventListener('click', () => { if (parseInt(qtyInput.value) > 1) qtyInput.value--; });
        if (incBtn) incBtn.addEventListener('click', () => { if (parseInt(qtyInput.value) < 99) qtyInput.value++; });

        qtyInput.addEventListener('input', () => {
            const v = parseInt(qtyInput.value);
            if (v > 99) qtyInput.value = 99;
            if (v < 1 || isNaN(v)) qtyInput.value = 1;
        });

        orderBtn.addEventListener('click', () => {
            if (orderBtn.dataset.busy) return;

            const sizeChips    = card.querySelectorAll('.size-chip');
            let selectedSize   = 'Normaali';
            sizeChips.forEach(chip => { if (chip.classList.contains('size-chip--active')) selectedSize = chip.dataset.size; });

            const baseName  = card.querySelector('h3').textContent.trim();
            const priceEl   = card.querySelector('.pizza-price');
            const basePrice = parseFloat(priceEl.dataset.basePrice || priceEl.textContent.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;

            const glutenCb  = card.querySelector('input[name="gluteeniton"]');
            const isGluten  = glutenCb && glutenCb.checked;

            const extraBoxes = card.querySelectorAll('.extra-cb:checked');
            const extraNames = [];
            let extraPrice   = 0;
            extraBoxes.forEach(cb => {
                extraNames.push(cb.dataset.name);
                extraPrice += parseFloat(cb.dataset.price) || 0;
            });

            const sizeExtra  = selectedSize === 'Iso' ? 3.0 : 0;
            const glutenExtra= isGluten ? 2.0 : 0;
            const totalPrice = basePrice + extraPrice + sizeExtra + glutenExtra;

            const data = {
                base:        baseName,
                koko:        selectedSize,
                gluteeniton: isGluten,
                extras:      extraNames
            };
            const cartKey = PIZZA_PREFIX + JSON.stringify(data);

            orderBtn.dataset.busy = '1';

            const qty = parseInt(qtyInput.value) || 1;

            cart[cartKey] = (cart[cartKey] || 0) + qty;
            cartPrices[cartKey] = totalPrice;

            saveCart(cart);
            savePrices(cartPrices);
            updateCount();

            qtyInput.value = 1;

            extraBoxes.forEach(cb => { cb.checked = false; cb.closest('.extra-chip').classList.remove('extra-chip--checked'); });
            if (glutenCb) {
                glutenCb.checked = false;
                const gc = glutenCb.closest('.gluten-chip');
                if (gc) gc.classList.remove('gluten-chip--checked');
            }

            sizeChips.forEach(chip => { chip.classList.toggle('size-chip--active', chip.dataset.size === 'Normaali'); });

            const extrasPanel = card.querySelector('.extras-panel');
            const toggleBtn   = card.querySelector('.extras-toggle-btn');
            if (extrasPanel) extrasPanel.style.display = 'none';
            if (toggleBtn)   { toggleBtn.textContent = '+ Lisää täytteitä'; toggleBtn.classList.remove('extras-toggle-btn--open'); }

            const recalcPrice = () => {
                priceEl.textContent = basePrice.toFixed(2).replace('.', ',') + ' €';
            };
            recalcPrice();

            const displayName = (isGluten ? 'Gluteeniton ' : '') + baseName + (selectedSize === 'Iso' ? ' (Iso)' : '');
            showToast(qty + 'x ' + displayName + ' lisätty koriin!');

            const origText = orderBtn.textContent;
            orderBtn.textContent = 'Lisätty!';
            orderBtn.style.background = '#27ae60';
            orderBtn.style.color = '#fff';

            setTimeout(() => {
                orderBtn.textContent = origText;
                orderBtn.style.background = '';
                orderBtn.style.color = '';
                delete orderBtn.dataset.busy;
            }, 1500);
        });
    });

    updateCount();

    const loggedIn   = localStorage.getItem('pizzanyt_loggedin');
    const loginLi    = document.getElementById('nav-login-li');
    const userLi     = document.getElementById('nav-user-info');
    const usernameEl = document.getElementById('nav-username');
    const logoutBtn  = document.getElementById('nav-logout-btn');

    if (loggedIn) {
        if (loginLi)    loginLi.style.display    = 'none';
        if (userLi)     userLi.style.display     = 'flex';
        if (usernameEl) usernameEl.textContent   = loggedIn;
    } else {
        if (loginLi) loginLi.style.display = '';
        if (userLi)  userLi.style.display  = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('pizzanyt_loggedin');
            if (loginLi) loginLi.style.display = '';
            if (userLi)  userLi.style.display  = 'none';
            showToast('Kirjauduit ulos.');
        });
    }
});

document.querySelectorAll('.pizza-card').forEach(card => {
    const sizeChips = card.querySelectorAll('.size-chip');
    const priceEl   = card.querySelector('.pizza-price');

    if (priceEl && !priceEl.dataset.basePrice) {
        priceEl.dataset.basePrice = parseFloat(priceEl.textContent.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
    }

    const recalc = () => {
        if (!priceEl) return;
        const base     = parseFloat(priceEl.dataset.basePrice) || 0;
        const isIso    = card.querySelector('.size-chip--active')?.dataset.size === 'Iso';
        const isGluten = card.querySelector('input[name="gluteeniton"]')?.checked;
        const extras   = Array.from(card.querySelectorAll('.extra-cb:checked'))
                              .reduce((s, cb) => s + (parseFloat(cb.dataset.price) || 0), 0);
        priceEl.textContent = (base + (isIso ? 3 : 0) + (isGluten ? 2 : 0) + extras).toFixed(2).replace('.', ',') + ' €';
    };

    sizeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            sizeChips.forEach(c => c.classList.remove('size-chip--active'));
            chip.classList.add('size-chip--active');
            recalc();
        });
    });

    const glutenCb = card.querySelector('input[name="gluteeniton"]');
    if (glutenCb) {
        glutenCb.addEventListener('change', () => {
            const gc = glutenCb.closest('.gluten-chip');
            if (gc) gc.classList.toggle('gluten-chip--checked', glutenCb.checked);
            recalc();
        });
    }

    card.querySelectorAll('.extra-cb').forEach(cb => {
        cb.addEventListener('change', () => {
            cb.closest('.extra-chip').classList.toggle('extra-chip--checked', cb.checked);
            recalc();
        });
    });
});

const form = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');

if (reviewsList) {
    let reviews = JSON.parse(localStorage.getItem('reviews')) || [];

    function displayReviews() {
        reviewsList.innerHTML = '';
        reviews.slice().reverse().forEach(review => {
            const reviewDiv = document.createElement('div');
            reviewDiv.classList.add('review-card');
            reviewDiv.innerHTML = `
              <div class="review-header">
                <div class="review-email">${review.email}</div>
                <div class="review-rating">${'★'.repeat(review.rating)}</div>
              </div>
              <div class="review-text">${review.text}</div>
            `;
            reviewsList.appendChild(reviewDiv);
        });
    }

    displayReviews();

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const rating = parseInt(document.getElementById('rating').value);
            const text = document.getElementById('text').value;

            const newReview = { email, rating, text };

            reviews.push(newReview);
            localStorage.setItem('reviews', JSON.stringify(reviews));

            displayReviews();

            form.reset();
        });
    }
}