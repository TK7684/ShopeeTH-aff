// Mapping of Shopee main category IDs to human-readable Thai names.
// NOTE: This is a starter list; update it as you learn more IDs from your data.
// Unknown IDs will fall back to "หมวดหมู่ไม่ทราบ (ID)".

const MAIN_CATEGORY_MAP = {
  // Food & Beverages
  100629: 'อาหารและเครื่องดื่ม',
  // Beauty & Personal Care
  100630: 'ความงามและของใช้ส่วนตัว',
  // Home & Living / Household
  100636: 'ของใช้ในบ้าน',
  // Fashion (Shoes / Clothing)
  100637: 'แฟชั่นและรองเท้า',
  // Electronics / Mobiles & Gadgets
  100013: 'โทรศัพท์และอุปกรณ์เสริม',
};

function normalizeId(id) {
  if (id === undefined || id === null) return null;
  const n = Number(id);
  return Number.isFinite(n) ? String(n) : String(id);
}

export function getCategoryName(id) {
  const key = normalizeId(id);
  if (!key) return null;
  if (Object.prototype.hasOwnProperty.call(MAIN_CATEGORY_MAP, key)) {
    return MAIN_CATEGORY_MAP[key];
  }
  return `หมวดหมู่ไม่ทราบ (${key})`;
}

export function getCategoryNameList(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  return ids
    .map((id) => getCategoryName(id))
    .filter((name, index, arr) => name && arr.indexOf(name) === index);
}

export function getMainCategoryId(categoryIds) {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) return null;
  const first = normalizeId(categoryIds[0]);
  return first || null;
}

export function getMainCategorySheetTitle(categoryId) {
  const key = normalizeId(categoryId);
  if (!key) return 'Category_Unknown';
  // User requested to show just the number of the category
  return String(key);
}


