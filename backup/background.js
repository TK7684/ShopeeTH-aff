const APP_ID = "15307710043";
const SECRET = "RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI";
const ENDPOINT = "https://open-api.affiliate.shopee.co.th/graphql";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getOffer") {
    getShopeeOffer(msg.shopId, msg.itemId).then(sendResponse);
    return true;
  }
});

async function getShopeeOffer(shopId, itemId) {
  const query = `
  {
    productOfferV2(shopId: ${shopId}, itemId: ${itemId}, limit: 1) {
      nodes {
        itemId
        commissionRate
        sellerCommissionRate
        shopeeCommissionRate
        commission
        price
        sales
        priceMax
        priceMin
        productCatIds
        ratingStar
        priceDiscountRate
        imageUrl
        productName
        shopId
        shopName
        shopType
        productLink
        offerLink
        periodStartTime
        periodEndTime
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
  `;

  const payload = JSON.stringify({ query: query });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signString = APP_ID + timestamp + payload + SECRET;
  const signature = await sha256(signString);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: payload
    });
    return await res.json();
  } catch (e) {
    return { error: e.toString() };
  }
}

// SHA256 (web crypto api)
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
