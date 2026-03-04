document.addEventListener('DOMContentLoaded', () => {
    const CART_KEY  = 'pizzanyt_cart';
    const loadCart  = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; } };
    const saveCart  = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
    const PRICES_KEY = 'pizzanyt_prices';
    const loadPrices = () => { try { return JSON.parse(localStorage.getItem(PRICES_KEY)) || {}; } catch { return {}; } };
    const savePrices = (p) => localStorage.setItem(PRICES_KEY, JSON.stringify(p));
    const cart       = loadCart();
    const cartPrices = loadPrices();

    const cartBadges = document.querySelectorAll('.cart-quantity');
    const toast      = document.getElementById('toast');

    // Ostoskoripaneeli ja tummennus luodaan tässä, koska ne ei ole oikeesti missään sivussa
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    document.body.appendChild(overlay);

    const panel = document.createElement('div');
    panel.id = 'cart-panel';
    document.body.appendChild(panel);

    //Ilmoitus joka pongahtaa ylös
    let toastTimer;
    const showToast = (msg) => {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    };
    //globaaliksi aliohjelmaksi, jotta login.html:än sisäinen js voi kutsua tätä
    window.showToastGlobal = showToast;

    // Ostoskorissa olevien pizzojen määrä
    const updateCount = () => {
        const total = Object.values(cart).reduce((s, v) => s + v, 0);
        cartBadges.forEach(el => el.textContent = total);
    };


    //Ostoskori paneelin sisältö
    const renderPanel = () => {
        const items = Object.entries(cart);
        const total = items.reduce((s, [, q]) => s + q, 0);
        panel.innerHTML = `
            <div class="cart-header">
                <h2>Ostoskori</h2>
                <button id="close-cart">Sulje</button>
            </div>
            <div class="cart-body">
                ${items.length === 0
                    ? '<div class="cart-empty"><p>Korisi on tyhjä.<br>Lisää herkullisia pizzoja!</p></div>'
                    : items.map(([name, qty]) => `
                        <div class="cart-item">
                            <span class="cart-item-name">${name}</span>
                            <div class="cart-item-controls">
                                <button class="edit-qty" data-name="${name}" data-change="-1">&#8722;</button>
                                <span class="cart-item-qty">${qty}</span>
                                <button class="edit-qty" data-name="${name}" data-change="1">+</button>
                            </div>
                        </div>`).join('')}
            </div>
            ${items.length > 0 ? `
            <div class="cart-footer">
                <div class="cart-total"><span>Yhteensä (kpl)</span><span>${total} kpl</span></div>
                <div class="cart-total"><span>Yhteensä (€)</span><span>${items.reduce((s,[n,q])=>s+(cartPrices[n]||0)*q,0).toFixed(2).replace('.',',')} €</span></div>
                <button class="checkout-btn">Tilaa nyt</button>
            </div>` : ''}
        `;

        document.getElementById('close-cart').onclick = closeCart;

        // Muutos napit korissa ostoskori paneelissa
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

        // Ei yhdistä mihinkään tekee vaan viestin että voi näyttää että toimii
        const checkoutBtn = panel.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => openCheckoutModal());
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

    //Tilaus viimeistely 
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
                        <span class="co-option-sub">Valmis ~10 min</span>
                    </button>
                    <button class="co-option-btn" id="co-delivery">
                        <span class="co-option-title">Kuljetus</span>
                        <span class="co-option-sub">Ilmainen · ~35 min</span>
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

        confirmBtn.addEventListener('click', () => {
            if (selectedMethod === 'delivery') {
                const addr = document.getElementById('co-address-input').value.trim();
                if (!addr) { addressErr.textContent = 'Syötä toimitusosoite.'; return; }
            }
            const now = new Date();
            now.setMinutes(now.getMinutes() + (selectedMethod === 'pickup' ? 20 : 35));
            const timeStr    = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            const isDelivery = selectedMethod === 'delivery';
            const addrVal    = isDelivery ? document.getElementById('co-address-input').value.trim() : '';
            //Tilaus viimeistely valmis
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
        });
    };

    const openCart  = () => { renderPanel(); panel.style.right = '0px'; overlay.classList.add('active'); };
    const closeCart = () => { panel.style.right = '-420px'; overlay.classList.remove('active'); };

    document.querySelectorAll('.cart-link').forEach(el =>
        el.addEventListener('click', e => { e.preventDefault(); openCart(); })
    );
    overlay.addEventListener('click', closeCart);

    // halusin lisää silleen että kun oot kirjautunut niin se palaa sille sivulle jossa olit joten tässä tallennetaan nykyinen sivu sinne paluuta varten
    document.querySelectorAll('a[href="login.html"]').forEach(link => {
        link.addEventListener('click', () => {
            localStorage.setItem('pizzanyt_paluusivu', window.location.href);
        });
    });

    //ruokalistan pizza kortit
    document.querySelectorAll('.pizza-card').forEach(card => {
        const qtyInput  = card.querySelector('.pizza-quantity');
        const decBtn    = card.querySelector('.decrease');
        const incBtn    = card.querySelector('.increase');
        const orderBtn  = card.querySelector('.order-btn');
        if (!qtyInput || !orderBtn) return;
        const name = card.querySelector('h3').textContent.trim();

        decBtn.addEventListener('click', () => { if (parseInt(qtyInput.value) > 1) qtyInput.value--; });
        incBtn.addEventListener('click', () => { if (parseInt(qtyInput.value) < 99) qtyInput.value++; });
        qtyInput.addEventListener('input', () => {
            const v = parseInt(qtyInput.value);
            if (v > 99)            qtyInput.value = 99;
            if (v < 1 || isNaN(v)) qtyInput.value = 1;
        });

        //ku lisäät koriin pizzan
        const priceEl  = card.querySelector('.pizza-price');
        const priceNum = parseFloat((priceEl ? priceEl.textContent : '').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
        orderBtn.addEventListener('click', () => {
            if (orderBtn.dataset.busy) return;
            orderBtn.dataset.busy = '1';
            const qty = parseInt(qtyInput.value) || 1;
            cart[name] = (cart[name] || 0) + qty;
            if (priceNum > 0) cartPrices[name] = priceNum;
            saveCart(cart);
            savePrices(cartPrices);
            updateCount();
            qtyInput.value = 1;
            showToast(qty + 'x ' + name + ' lisätty koriin!');
            const origText = orderBtn.textContent;
            orderBtn.textContent      = 'Lisätty!';
            orderBtn.style.background = '#27ae60';
            orderBtn.style.color      = '#fff';
            setTimeout(() => {
                orderBtn.textContent      = origText;
                orderBtn.style.background = '';
                orderBtn.style.color      = '';
                delete orderBtn.dataset.busy;
            }, 1500);
        });
    });

    updateCount();

    //  Kirjautumis paikka navigaatiossa
    const loggedIn   = localStorage.getItem('pizzanyt_loggedin');
    const loginLi    = document.getElementById('nav-login-li');
    const userLi     = document.getElementById('nav-user-info');
    const usernameEl = document.getElementById('nav-username');
    const logoutBtn  = document.getElementById('nav-logout-btn');

    if (loggedIn) {
        // Nimi ja uloskirjautumisnappi näkyviin
        if (loginLi)    loginLi.style.display    = 'none';
        if (userLi)     userLi.style.display     = 'flex';
        if (usernameEl) usernameEl.textContent   = loggedIn;
    } else {
        // kirjaudu-nappi näkyviin
        if (loginLi) loginLi.style.display = '';
        if (userLi)  userLi.style.display  = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Poistetaan nimi ja muut näkyvistä, mutta pysyy local storagessa
            localStorage.removeItem('pizzanyt_loggedin');
            if (loginLi) loginLi.style.display = '';
            if (userLi)  userLi.style.display  = 'none';
            showToast('Kirjauduit ulos.');
        });
    }
});