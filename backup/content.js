// == Inject Google Font Sarabun ==
function injectSarabunFont() {
  if (!document.getElementById('sai-sarabun-font')) {
    const link = document.createElement('link');
    link.id = 'sai-sarabun-font';
    link.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
}

// == Extract Shopee shopId / itemId from URL ==
function extractIdsFromUrl() {
  const match = window.location.pathname.match(/-i\.(\d+)\.(\d+)(?:$|\?|\/)/);
  if (match) return { shopId: match[1], itemId: match[2] };
  const alt = window.location.pathname.match(/\/product\/(\d+)\/(\d+)/);
  if (alt) return { shopId: alt[1], itemId: alt[2] };
  return null;
}

// == Create sticky sidebar (right) ==
function createSidebarBox(html = "<b>กำลังดึงข้อมูล Affiliate...</b>") {
  // Remove old box if exists
  const old = document.getElementById("sai-aff-sidebar");
  if (old) old.remove();

  // Container
  const box = document.createElement("div");
  box.id = "sai-aff-sidebar";
  box.className = "sai-aff-fixed-sidebar";
  box.innerHTML = html;
  document.body.appendChild(box);

  // Sticky sidebar style
  Object.assign(box.style, {
    position: "fixed",
    top: "72px",
    right: "32px",
    zIndex: 2147483647, // สูงสุดไปเลย
    minWidth: "350px",
    maxWidth: "90vw",
    background: "#fff",
    borderRadius: "1.2rem",
    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.11)",
    border: "1.5px solid #eee",
    fontFamily: "'Sarabun', sans-serif",
    fontSize: "16px",
    color: "#222",
    padding: "38px 28px 26px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    transition: "box-shadow .22s, right .22s",
  });

  // Close Button (ใหญ่ ชัด click ง่าย)
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="15" fill="#F3F4F6"/><path d="M20 10L10 20M10 10l10 10" stroke="#B0B3B9" stroke-width="2.3" stroke-linecap="round"/></svg>`;
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "14px",
    right: "15px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0",
    margin: "0",
    zIndex: "999999999",
    outline: "none"
  });
  closeBtn.setAttribute("aria-label", "ปิด");
  closeBtn.onmouseenter = () => { closeBtn.style.opacity = 0.7; };
  closeBtn.onmouseleave = () => { closeBtn.style.opacity = 1; };
  closeBtn.onclick = () => { box.style.display = "none"; };
  box.appendChild(closeBtn);

  return box;
}

// == Modern Result HTML with Emoji & Divider (ลบลิงก์สินค้า) ==
function createResultHTML(data) {
  if (!data || !data.productOfferV2 || !data.productOfferV2.nodes || data.productOfferV2.nodes.length === 0) {
    return "<b>ไม่พบข้อมูล Affiliate</b>";
  }
  const node = data.productOfferV2.nodes[0];
  function pct(x) {
    if (typeof x === "number") return (x * 100).toFixed(2) + "%";
    if (typeof x === "string" && !isNaN(Number(x))) return (parseFloat(x) * 100).toFixed(2) + "%";
    return "-";
  }
  // สร้างแต่ละแถว
  const rows = [
    { label: '💰 ค่าคอมมิชชันรวม', value: pct(node.commissionRate) },
    { label: '🏬 คอมมิชชันร้านค้า', value: pct(node.sellerCommissionRate), highlight: true },
    { label: '🛒 คอมมิชชัน Shopee', value: pct(node.shopeeCommissionRate) },
    { label: '📦 ค่าคอมเฉลี่ย/ชิ้น', value: Number(node.commission).toLocaleString() },
    { label: '🏷️ ราคาปกติ', value: Number(node.price).toLocaleString() },
    { label: '⬆️ ราคาสูงสุด', value: Number(node.priceMax).toLocaleString() },
    { label: '⬇️ ราคาต่ำสุด', value: Number(node.priceMin).toLocaleString() },
    // { label: '🔗 ลิงก์สินค้า', value: `<a href="${node.productLink}" target="_blank" style="color:#1976d2;text-decoration:underline;font-weight:600;">เปิดดูสินค้า</a>` },
  ];

  // Render
  return `
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div style="font-size:1.32rem;font-weight:700;color:#FF6A00;letter-spacing:-0.5px;margin-bottom:-8px;">
        Shopee Affiliate <span style="font-size:1.12rem;font-weight:400;color:#8B8B95;">เฉพาะลูกศิษย์ <br> Shopee Aff Killer</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:0;">
        ${rows.map((row, i) => `
          <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding: ${row.highlight ? '16px 0 16px 0' : '10px 0'};
            ${row.highlight ? 'background:linear-gradient(90deg,#FFF3EC,#FFF);font-weight:700;font-size:1.18rem;color:#FF6A00;border-radius:12px;margin-bottom:10px;' : ''}
          ">
            <span style="display:flex;align-items:center;gap:5px;">${row.label}</span>
            <span>${row.value}</span>
          </div>
          ${i !== rows.length-1 ? '<div style="height:1px;background:#F2F2F6;width:100%;margin:0;"></div>' : ''}
        `).join('')}
      </div>
    </div>
    <style>
      #sai-aff-sidebar, #sai-aff-sidebar * {
        font-family: 'Sarabun',sans-serif !important;
      }
      #sai-aff-sidebar a:hover {
        color:#FF6A00;
        text-decoration:underline;
      }
      #sai-aff-sidebar button[aria-label="ปิด"]:focus { outline: 2px solid #FF6A00; }
      @media (max-width: 480px) {
        #sai-aff-sidebar {
          min-width: unset !important;
          right: 0 !important;
          left: unset !important;
          width: 98vw !important;
          border-radius: 0.6rem !important;
          padding: 22px 4vw 20px 4vw !important;
        }
      }
    </style>
  `;
}

// == Main function ==
(function main() {
  injectSarabunFont();

  function tryInject() {
    const ids = extractIdsFromUrl();
    if (!ids) {
      createSidebarBox("<b style='color:red'>กรุณาเปิดหน้าสินค้า <br> เพื่อใช้งานระบบ</b>");
      return;
    }
    const box = createSidebarBox();
    try {
      chrome.runtime.sendMessage(
        { action: "getOffer", shopId: ids.shopId, itemId: ids.itemId },
        (response) => {
          if (!response) {
            box.innerHTML = '<span style="color:red">Error: ไม่ได้รับ response จาก background</span>';
            return;
          }
          if (response.error) {
            box.innerHTML = `<span style="color:red">Error: ${response.error}</span>`;
            return;
          }
          let data = response.data || null;
          box.innerHTML = createResultHTML(data);
          // re-add close btn (สำรอง)
          const closeBtn = box.querySelector('button[aria-label="ปิด"]');
          if (closeBtn) closeBtn.onclick = () => { box.style.display = "none"; };
        }
      );
    } catch (e) {
      box.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
    }
  }

  tryInject();
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(tryInject, 600);
    }
  }, 800);
})();
