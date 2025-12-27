import fetch from 'node-fetch';

const API_KEY = 'd67abc22-bb7d-41e8-b8fe-676c55a823c9';
const QUERY = 'laptop';

async function testCanopy() {
    console.log(`Testing CanopyAPI with query: "${QUERY}"...`);

    try {
        const response = await fetch(`https://rest.canopyapi.co/api/amazon/search?searchTerm=${QUERY}&domain=US`, {
            method: 'GET',
            headers: {
                'API-KEY': API_KEY,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response Body:', text);
            return;
        }

        const data = await response.json();
        console.log('--- Connection Successful! ---');
        console.log('Response Structure Sample:');

        // Navigate deep to find products based on documentation
        // data.data.amazonProductSearchResults.productResults.results
        const products = data?.data?.amazonProductSearchResults?.productResults?.results;

        if (Array.isArray(products) && products.length > 0) {
            const p = products[0];
            console.log('First Product Raw Data:');
            console.log(JSON.stringify(p, null, 2));
            console.log(`\nTotal results in this page: ${products.length}`);
        } else {
            console.warn('No products found in the expected path (data.amazonProductSearchResults.productResults.results).');
            console.log('Full Data Keys:', Object.keys(data || {}));
            if (data?.data) console.log('Data Keys:', Object.keys(data.data));
        }

    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

testCanopy();
