document.addEventListener('DOMContentLoaded', () => {
    const CART_KEY   = 'pizzanyt_cart';
    const PRICES_KEY = 'pizzanyt_prices';
    const loadCart   = () => { try { return JSON.parse(localStorage.getItem(CART_KEY))   || {}; } catch { return {}; } };
    const saveCart   = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
    // Hintataulukko tallennetaan erikseen, jotta ostoskorissa voidaan laskea summa
    const loadPrices = () => { try { return JSON.parse(localStorage.getItem(PRICES_KEY)) || {}; } catch { return {}; } };
    const savePrices = (p) => localStorage.setItem(PRICES_KEY, JSON.stringify(p));
    const cart       = loadCart();
    const cartPrices = loadPrices();

    const userCartKey    = (u) => 'pizzanyt_cart_'   + u;
    const userPricesKey  = (u) => 'pizzanyt_prices_' + u;
    const loadUserCart   = (u) => { try { return JSON.parse(localStorage.getItem(userCartKey(u)))   || {}; } catch { return {}; } };
    const loadUserPrices = (u) => { try { return JSON.parse(localStorage.getItem(userPricesKey(u))) || {}; } catch { return {}; } };
    const saveUserCart   = (u, c) => localStorage.setItem(userCartKey(u),   JSON.stringify(c));
    const saveUserPrices = (u, p) => localStorage.setItem(userPricesKey(u), JSON.stringify(p));

    // Yhdistetään kaksi koria ja lisätään  niiden määrät yhteen
    const mergeCarts = (base, incoming) => {
        const merged = Object.assign({}, base);
        Object.entries(incoming).forEach(([k, v]) => { merged[k] = (merged[k] || 0) + v; });
        return merged;
    };

    // Ladataan kirjautuneen käyttäjän kori heti käynnistyessä, jos käyttäjä on jo sisällä
    const currentUser = localStorage.getItem('pizzanyt_loggedin');
    if (currentUser) {
        const userCart   = loadUserCart(currentUser);
        const userPrices = loadUserPrices(currentUser);
        // Yhdistetään mahdollinen kirjautumaton kori käyttäjän koriin
        const guestCart  = loadCart();
        const merged     = mergeCarts(userCart, guestCart);
        Object.keys(cart).forEach(k => delete cart[k]);
        Object.assign(cart, merged);
        Object.assign(cartPrices, userPrices, loadPrices());
        // Tallennetaan yhdistetty kori käyttäjälle ja tyhjennetään vieraskori
        saveUserCart(currentUser, cart);
        saveUserPrices(currentUser, cartPrices);
        saveCart(cart);
        savePrices(cartPrices);
    }

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

    // Tallennetaan kori oikeaan paikkaan: käyttäjäkohtaisesti jos kirjautunut
    const persistCart = () => {
        saveCart(cart);
        savePrices(cartPrices);
        const u = localStorage.getItem('pizzanyt_loggedin');
        if (u) {
            saveUserCart(u, cart);
            saveUserPrices(u, cartPrices);
        }
    };

    //Ostoskori paneelin sisällön luonti
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
                <div class="cart-total"><span>Yhteensä (€)</span><span>${items.reduce((s, [name, qty]) => s + (cartPrices[name] || 0) * qty, 0).toFixed(2).replace('.', ',')} €</span></div>
                <button class="checkout-btn">Tilaa nyt</button>
            </div>` : ''}
        `;

        document.getElementById('close-cart').onclick = closeCart;

        // kaikki muutos napit korissa ostoskorissa
        panel.querySelectorAll('.edit-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                const name   = btn.dataset.name;
                const change = parseInt(btn.dataset.change);
                cart[name] = (cart[name] || 0) + change;
                if (cart[name] <= 0) delete cart[name];
                persistCart();
                updateCount();
                renderPanel();
            });
        });

        // Ei yhdistä mihinkään tekee vaan viestin että voi näyttää että toimii
        const checkoutBtn = panel.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                showToast('Tilauksesi on vastaanotettu!');
                Object.keys(cart).forEach(k => delete cart[k]);
                persistCart();
                updateCount();
                closeCart();
            });
        }
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
        // Haetaan hinta kortista ja tallennetaan data-attribuuttiin myöhempää käyttöä varten
        const priceEl   = card.querySelector('.pizza-price');
        const priceText = priceEl ? priceEl.textContent.trim() : '';
        const priceNum  = parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
        if (priceNum > 0) orderBtn.dataset.price = priceNum;

        decBtn.addEventListener('click', () => { if (parseInt(qtyInput.value) > 1) qtyInput.value--; });
        incBtn.addEventListener('click', () => { if (parseInt(qtyInput.value) < 99) qtyInput.value++; });
        qtyInput.addEventListener('input', () => {
            const v = parseInt(qtyInput.value);
            if (v > 99)            qtyInput.value = 99;
            if (v < 1 || isNaN(v)) qtyInput.value = 1;
        });

        //ku lisäät koriin pizzan
        orderBtn.addEventListener('click', () => {
            // Estetään tuplapainallus kesken animaation
            if (orderBtn.dataset.busy) return;
            orderBtn.dataset.busy = '1';
            const qty = parseInt(qtyInput.value) || 1;
            cart[name] = (cart[name] || 0) + qty;
            // Tallennetaan hinta ostoskoriin nimellä, jos ei ole vielä
            if (priceNum > 0) cartPrices[name] = priceNum;
            persistCart();
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
            // Tallennetaan kori käyttäjälle ennen uloskirjautumista
            const u = localStorage.getItem('pizzanyt_loggedin');
            if (u) {
                saveUserCart(u, cart);
                saveUserPrices(u, cartPrices);
            }
            // Tyhjennetään aktiivinen (jaettu) kori, jotta seuraava käyttäjä alkaa puhtaalta pöydältä
            Object.keys(cart).forEach(k => delete cart[k]);
            saveCart(cart);
            savePrices({});
            updateCount();
            // Poistetaan nimi ja muut näkyvistä, mutta pysyy local storagessa
            localStorage.removeItem('pizzanyt_loggedin');
            if (loginLi) loginLi.style.display = '';
            if (userLi)  userLi.style.display  = 'none';
            showToast('Kirjauduit ulos.');
        });
    }
});