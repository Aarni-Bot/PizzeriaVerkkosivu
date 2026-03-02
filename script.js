document.addEventListener('DOMContentLoaded', () => {
    localStorage.clear();
    const pizzaCards = document.querySelectorAll('.pizza-card');

    pizzaCards.forEach(card => {
        const input = card.querySelector('.pizza-quantity');
        const decBtn = card.querySelector('.decrease');
        const incBtn = card.querySelector('.increase');
        const orderBtn = card.querySelector('.order-btn');
        const pizzaName = card.querySelector('h3').innerText;

        const min = 1;
        const max = 99;

        // Vähennys
        decBtn.addEventListener('click', () => {
            let val = parseInt(input.value) || min;
            if (val > min) input.value = val - 1;
        });

        // Lisäys
        incBtn.addEventListener('click', () => {
            let val = parseInt(input.value) || min;
            if (val < max) input.value = val + 1;
        });

        input.addEventListener('input', () => {
            let val = input.value;

            if (val === "") return;

            let numVal = parseInt(val);

            if (numVal > max) {
                input.value = max;
            } 
            else if (numVal < min) {
                input.value = min;
            }
        });

        input.addEventListener('blur', () => {
            if (input.value === "" || parseInt(input.value) < min) {
                input.value = min;
            }
        });

        orderBtn.addEventListener('click', () => {
            const addedQty = parseInt(input.value) || min;
            let currentTotal = parseInt(localStorage.getItem(pizzaName)) || 0;
            
            localStorage.setItem(pizzaName, currentTotal + addedQty);
            console.log(`Tuote: ${pizzaName}, Uusi yhteismäärä: ${localStorage.getItem(pizzaName)}`);
            
            input.value = 1;
        });
    });
});
