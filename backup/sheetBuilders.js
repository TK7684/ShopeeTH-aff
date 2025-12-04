import {
    getCategoryNameList,
    getMainCategoryId,
    getMainCategorySheetTitle,
} from './categoryNames.js';

export function buildSheetRows(products) {
    const timestamp = new Date().toISOString();
    const header = [
        'Run Timestamp',
        'Product Name',
        'Commission Rate (%)',
        'Seller Commission (%)',
        'Shopee Commission (%)',
        'Commission (THB)',
        'Price (THB)',
        'Price Min',
        'Price Max',
        'Sales',
        'Rating',
        'Shop Name',
        'Product Link',
        'Categories (ชื่อหมวดหมู่)',
    ];

    const rows = [header];

    products.forEach((product) => {
        const categoriesText = getCategoryNameList(product.categoryIds).join(', ');

        rows.push([
            timestamp,
            product.name,
            ((product.commissionRate || 0) * 100).toFixed(2),
            ((product.sellerCommissionRate || 0) * 100).toFixed(2),
            ((product.shopeeCommissionRate || 0) * 100).toFixed(2),
            product.commission || 0,
            product.price || 0,
            product.priceMin || 0,
            product.priceMax || 0,
            product.sales || 0,
            product.ratingStar || 0,
            product.shopName || '',
            product.productLink || '',
            categoriesText,
        ]);
    });

    return rows;
}

export function buildCategoryRows(products, topLimit) {
    const resolvedLimit = Number.isFinite(topLimit) && topLimit > 0 ? topLimit : 1;
    const header = [
        'Category ID',
        'Rank',
        'Product Name',
        'Commission Rate (%)',
        'Commission (THB)',
        'Price (THB)',
        'Sales',
        'Rating',
        'Product Link',
    ];

    const map = new Map();
    products.forEach((product) => {
        const categories = Array.isArray(product.categoryIds) ? product.categoryIds : [];
        categories.forEach((categoryId) => {
            if (categoryId === undefined || categoryId === null || categoryId === '') {
                return;
            }
            const key = String(categoryId);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(product);
        });
    });

    const rows = [header];
    const sortedCategories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

    sortedCategories.forEach(([categoryId, categoryProducts]) => {
        const sortedProducts = [...categoryProducts].sort(
            (a, b) => (b.commissionRate || 0) - (a.commissionRate || 0),
        );
        const topProducts = sortedProducts.slice(0, resolvedLimit);
        topProducts.forEach((product, index) => {
            rows.push([
                categoryId,
                index + 1,
                product.name,
                ((product.commissionRate || 0) * 100).toFixed(2),
                product.commission || 0,
                product.price || 0,
                product.sales || 0,
                product.ratingStar || 0,
                product.productLink || '',
            ]);
        });
    });

    return rows;
}

export function buildCategoryTabs(products, topLimit) {
    const resolvedLimit = Number.isFinite(topLimit) && topLimit > 0 ? topLimit : 20;
    const header = [
        'Rank',
        'Product Name',
        'Commission Rate (%)',
        'Commission (THB)',
        'Price (THB)',
        'Sales',
        'Rating',
        'Shop Name',
        'Product Link',
    ];

    const map = new Map();
    products.forEach((product) => {
        const mainId = getMainCategoryId(product.categoryIds);
        if (!mainId) return;
        const key = String(mainId);
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(product);
    });

    const tabs = [];
    const sortedCategories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

    sortedCategories.forEach(([categoryId, categoryProducts]) => {
        const sortedProducts = [...categoryProducts].sort(
            (a, b) => (b.commissionRate || 0) - (a.commissionRate || 0),
        );
        const topProducts = sortedProducts.slice(0, resolvedLimit);

        const rows = [header];
        topProducts.forEach((product, index) => {
            rows.push([
                index + 1,
                product.name,
                ((product.commissionRate || 0) * 100).toFixed(2),
                product.commission || 0,
                product.price || 0,
                product.sales || 0,
                product.ratingStar || 0,
                product.shopName || '',
                product.productLink || '',
            ]);
        });

        const sheetTitle = getMainCategorySheetTitle(categoryId);
        tabs.push({
            sheetTitle,
            range: `${sheetTitle}!A1`,
            values: rows,
        });
    });

    return tabs;
}
