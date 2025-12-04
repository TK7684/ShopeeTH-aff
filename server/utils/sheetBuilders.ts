import {
    getCategoryNameList,
    getMainCategoryId,
    getMainCategorySheetTitle,
} from './categoryNames';

interface Product {
    name?: string;
    productName?: string;
    commissionRate?: number;
    sellerCommissionRate?: number;
    shopeeCommissionRate?: number;
    commission?: number;
    price?: number;
    priceMin?: number;
    priceMax?: number;
    sales?: number;
    ratingStar?: number;
    shopName?: string;
    productLink?: string;
    categoryIds?: any[];
    productCatIds?: any[];
    itemId?: any;
}

export function buildSheetRows(products: Product[]) {
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

    const rows: any[][] = [header];

    products.forEach((product) => {
        const categoriesText = getCategoryNameList(product.categoryIds || product.productCatIds || []).join(', ');

        rows.push([
            timestamp,
            product.name || product.productName || '',
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

export function buildCategoryRows(products: Product[], topLimit: number) {
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

    const map = new Map<string, Product[]>();
    products.forEach((product) => {
        const categories = Array.isArray(product.categoryIds || product.productCatIds)
            ? (product.categoryIds || product.productCatIds)
            : [];
        categories.forEach((categoryId: any) => {
            if (categoryId === undefined || categoryId === null || categoryId === '') {
                return;
            }
            const key = String(categoryId);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(product);
        });
    });

    const rows: any[][] = [header];
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
                product.name || product.productName || '',
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

export function buildCategoryTabs(products: Product[], topLimit: number) {
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

    const map = new Map<string, Product[]>();
    products.forEach((product) => {
        const mainId = getMainCategoryId(product.categoryIds || product.productCatIds || []);
        if (!mainId) return;
        const key = String(mainId);
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)!.push(product);
    });

    const tabs: any[] = [];
    const sortedCategories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

    sortedCategories.forEach(([categoryId, categoryProducts]) => {
        const sortedProducts = [...categoryProducts].sort(
            (a, b) => (b.commissionRate || 0) - (a.commissionRate || 0),
        );
        const topProducts = sortedProducts.slice(0, resolvedLimit);

        const rows: any[][] = [header];
        topProducts.forEach((product, index) => {
            rows.push([
                index + 1,
                product.name || product.productName || '',
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
