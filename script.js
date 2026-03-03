document.addEventListener('DOMContentLoaded', () => {
    localStorage.clear();
    const pizzaCards = document.querySelectorAll('.pizza-card');
    const cartQuantities = document.querySelectorAll('.cart-quantity');
    const cartIcons = document.querySelectorAll('.cart-icon');

    const cartPanel = document.createElement('div');
    cartPanel.id = 'cart-panel';
    cartPanel.style = "position: fixed; right: -400px; top: 0; width: 350px; height: 100%; background: white; box-shadow: -2px 0 10px rgba(0,0,0,0.2); transition: 0.3s; z-index: 1000; padding: 20px; overflow-y: auto; font-family: sans-serif;";
    document.body.appendChild(cartPanel);

    const updateCartDisplay = () => {
        let totalItems = 0;
        for (let i = 0; i < localStorage.length; i++) {
            totalItems += parseInt(localStorage.getItem(localStorage.key(i))) || 0;
        }
        cartQuantities.forEach(el => el.innerText = totalItems);
    };

    const renderPanelContent = () => {
        cartPanel.innerHTML = `<h2>Ostoskori</h2><button id="close-cart" style="float:right">Sulje</button>`;
        
        if (localStorage.length === 0) {
            cartPanel.innerHTML += "<p>Kori on tyhjä.</p>";
        } else {
            for (let i = 0; i < localStorage.length; i++) {
                const name = localStorage.key(i);
                const qty = localStorage.getItem(name);
                
                const itemDiv = document.createElement('div');
                itemDiv.style = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;";
                itemDiv.innerHTML = `
                    <span><strong>${name}</strong></span>
                    <div>
                        <button class="edit-qty" data-name="${name}" data-change="-1">-</button>
                        <span style="margin: 0 10px">${qty}</span>
                        <button class="edit-qty" data-name="${name}" data-change="1">+</button>
                    </div>
                `;
                cartPanel.appendChild(itemDiv);
            }
        }

        document.getElementById('close-cart').onclick = () => cartPanel.style.right = '-400px';
        
        cartPanel.querySelectorAll('.edit-qty').forEach(btn => {
            btn.onclick = (e) => {
                const name = e.target.dataset.name;
                const change = parseInt(e.target.dataset.change);
                let currentQty = parseInt(localStorage.getItem(name));
                let newQty = currentQty + change;

                if (newQty <= 0) {
                    localStorage.removeItem(name);
                } else {
                    localStorage.setItem(name, newQty);
                }
                updateCartDisplay();
                renderPanelContent();
            };
        });
    };

    const togglePanel = () => {
        renderPanelContent();
        cartPanel.style.right = cartPanel.style.right === '0px' ? '-400px' : '0px';
    };

    cartIcons.forEach(icon => icon.addEventListener('click', togglePanel));

    pizzaCards.forEach(card => {
        const input = card.querySelector('.pizza-quantity');
        const decBtn = card.querySelector('.decrease');
        const incBtn = card.querySelector('.increase');
        const orderBtn = card.querySelector('.order-btn');
        const pizzaName = card.querySelector('h3').innerText;

        decBtn.onclick = () => { 
            if (input.value > 1) input.value--; 
        };
        incBtn.onclick = () => { 
            if (input.value < 99) input.value++;             
        };

        input.addEventListener('change', () => {
            if (parseInt(input.value) > 99) input.value = 99;
            if (parseInt(input.value) < 1 || isNaN(parseInt(input.value))) input.value = 1;
        });
        
        orderBtn.addEventListener('click', () => {
            const addedQty = parseInt(input.value) || 1;
            let currentTotal = parseInt(localStorage.getItem(pizzaName)) || 0;
            localStorage.setItem(pizzaName, currentTotal + addedQty);
            updateCartDisplay();
            input.value = 1;
        });
    });

    updateCartDisplay();
});
