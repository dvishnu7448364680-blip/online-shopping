 let cart = JSON.parse(localStorage.getItem("cart")) || [];
        document.querySelector('.cart').textContent = cart.length;

        document.querySelector('.fresh-fruits').addEventListener('click', function(event) {
            if (event.target.tagName === 'BUTTON' && event.target.id === 'cart') {
                const productDiv = event.target.closest('.freshed');
                const name = productDiv.querySelector('p').textContent;
                const grams = productDiv.querySelector('select').value;
                const price = productDiv.querySelector('p:last-of-type').textContent;
                const image = productDiv.querySelector('img').src;
                const quantity = 1;

                const item = { name, grams, price, quantity, image };
                cart.push(item);
                localStorage.setItem("cart", JSON.stringify(cart));
                document.querySelector('.cart').textContent = cart.length;
                alert('Item added to cart!');
            }
        });