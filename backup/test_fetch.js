import { fetchAllPages } from './fetchProducts.js';

console.log('Starting test fetch...');
fetchAllPages(null, { saveToFile: true })
    .then(products => {
        console.log('Fetch complete. Products:', products.length);
    })
    .catch(err => {
        console.error('Fetch failed:', err);
    });
