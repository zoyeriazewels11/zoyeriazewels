const PHONE = "919016645235";

// Products loaded from DB (fallback to static if server not running)
let products = [];

async function loadProducts() {
  try {
    const res = await fetch(`${API}/products.php`);
    if (res.ok) {
      products = await res.json();
      products = products.map(p => ({ ...p, img: p.image_url }));
    }
  } catch {
    products = staticProducts;
  }
  renderProducts();
}

// Static fallback (shown when server is offline)
const staticProducts = [
  { id:1, name:'Gold Necklace Set',      meta:'22K Gold · Bridal Collection', badge:'Bestseller', img:'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600' },
  { id:2, name:'Diamond Solitaire Ring', meta:'18K White Gold · Diamond',     badge:'New',        img:'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600' },
  { id:3, name:'Gold Bangle Set',        meta:'22K Gold · Set of 4',          badge:null,         img:'https://images.unsplash.com/photo-1630018548696-e45e2e1c1bc5?w=600' },
  { id:4, name:'Silver Jhumka Earrings', meta:'Pure Silver · Handcrafted',    badge:null,         img:'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600' },
  { id:5, name:'Antique Maang Tikka',    meta:'Oxidised Silver · Kundan',     badge:'Limited',    img:'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600' },
  { id:6, name:'Gold Chain Bracelet',    meta:'22K Gold · Floral Pattern',    badge:null,         img:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600' }
];

// ── Render Products ──────────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = products.map(p => `
    <div class="card">
      <div class="card-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy"/>
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ""}
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="card-meta">${p.meta}</p>
        <div class="card-actions">
          <button class="btn-cart" onclick="addToCart(${p.id})">Add to Cart</button>
          <a class="btn-inquire-card" href="${waLink(p.name)}" target="_blank">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
              <path d="M20.52 3.48A11.93 11.93 0 0012.01 0C5.38 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.19-1.62A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.48-8.52zm-8.51 18.4a9.93 9.93 0 01-5.08-1.39l-.36-.22-3.68.97.98-3.59-.24-.37a9.93 9.93 0 01-1.52-5.3C2.11 6.48 6.49 2.1 12.01 2.1c2.65 0 5.14 1.03 7.02 2.91a9.87 9.87 0 012.9 7.01c0 5.52-4.39 9.86-9.92 9.86zm5.46-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.19-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46s1.06 2.85 1.21 3.05c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.73 2.02-1.43.25-.7.25-1.3.17-1.43-.07-.13-.27-.2-.57-.35z"/>
            </svg>
            Inquire
          </a>
        </div>
      </div>
    </div>
  `).join("");
}

// ── WhatsApp Link ────────────────────────────────────────────────
function waLink(productName) {
  const msg = encodeURIComponent(
    `Namaste! 🙏\nMujhe *${productName}* ke baare mein inquiry karni hai.\nKripya details aur price share karein.`
  );
  return `https://wa.me/${PHONE}?text=${msg}`;
}

// ── Cart (DB-backed when logged in) ──────────────────────────────
let cart = [];

function getToken() { return localStorage.getItem('zoyeria_token'); }
function getUser()  { const u = localStorage.getItem('zoyeria_user'); return u ? JSON.parse(u) : null; }

async function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const token = getToken();
  if (token) {
    // Save to DB
    try {
      await fetch(`${API}/cart.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ product_id: id })
      });
    } catch { /* server offline, use local */ }
  }

  if (!cart.find(x => x.id === id)) cart.push(p);
  updateCartUI();
  openCart();

  // Also log inquiry to DB
  const user = getUser();
  saveInquiryToDB(p, user);
}

async function saveInquiryToDB(p, user) {
  try {
    await fetch(`${API}/inquiry.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: p.id,
        product_name: p.name,
        user_id: user?.id || null,
        phone: user?.phone || null
      })
    });
  } catch { /* server offline */ }
}

async function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API}/cart.php/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch { /* offline */ }
  }
  updateCartUI();
}

// Load cart from DB on login
async function loadCartFromDB() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API}/cart.php`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const items = await res.json();
      cart = items.map(p => ({ ...p, img: p.image_url }));
      updateCartUI();
    }
  } catch { /* server offline */ }
}

function updateCartUI() {
  document.getElementById("cartCount").textContent = cart.length;
  const itemsEl = document.getElementById("cartItems");
  const footerEl = document.getElementById("cartFooter");

  if (cart.length === 0) {
    itemsEl.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    footerEl.style.display = "none";
    return;
  }

  itemsEl.innerHTML = cart.map(p => `
    <div class="cart-item">
      <img src="${p.img}" alt="${p.name}"/>
      <div class="ci-info">
        <h4>${p.name}</h4>
        <p>${p.meta}</p>
        <button class="ci-remove" onclick="removeFromCart(${p.id})">Remove</button>
      </div>
    </div>
  `).join("");

  footerEl.style.display = "block";

  // Build WhatsApp message with all cart items
  const itemsList = cart.map((p, i) => `${i + 1}. ${p.name} (${p.meta})`).join("\n");
  const msg = encodeURIComponent(
    `Namaste! 🙏\nMujhe in products ki inquiry karni hai:\n\n${itemsList}\n\nKripya details aur price share karein.`
  );
  document.getElementById("waCartBtn").href = `https://wa.me/${PHONE}?text=${msg}`;
}

function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function toggleCart() {
  const open = document.getElementById("cartDrawer").classList.contains("open");
  if (open) {
    document.getElementById("cartDrawer").classList.remove("open");
    document.getElementById("cartOverlay").classList.remove("open");
    document.body.style.overflow = "";
  } else {
    openCart();
  }
}

// ── API Base ─────────────────────────────────────────────────────
const API = '/zoyeria-jewels/api';

// ── Search ───────────────────────────────────────────────────────
function toggleSearch() {
  const bar = document.getElementById('searchBar');
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) {
    document.getElementById('searchInput').focus();
  } else {
    document.getElementById('searchInput').value = '';
    searchProducts('');
  }
}

function searchProducts(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('.card').forEach((card, i) => {
    const p = products[i];
    if (!p) return;
    const match = !q || p.name.toLowerCase().includes(q) || p.meta.toLowerCase().includes(q);
    card.classList.toggle('hidden', !match);
  });
}

// ── 3-dot Menu ───────────────────────────────────────────────────
function toggleDotsMenu() {
  document.getElementById('dotsMenu').classList.toggle('open');
}

// Close dots menu on outside click
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.dots-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('dotsMenu').classList.remove('open');
  }
});

// ── Auth Modal ───────────────────────────────────────────────────
function toggleAuthModal() {
  document.getElementById('authModal').classList.toggle('open');
  document.getElementById('authMsg').textContent = '';
  document.getElementById('dotsMenu').classList.remove('open');
}

function closeModalOnOverlay(e) {
  if (e.target.id === 'authModal') toggleAuthModal();
}

function switchToRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'flex';
  document.getElementById('authTitle').textContent = 'Register';
  document.getElementById('authSubtitle').textContent = 'Join the Zoyeria family';
  document.getElementById('authMsg').textContent = '';
}

function switchToLogin() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'flex';
  document.getElementById('authTitle').textContent = 'Login';
  document.getElementById('authSubtitle').textContent = 'Welcome back to Zoyeria Jewels';
  document.getElementById('authMsg').textContent = '';
}

function setAuthMsg(msg, type) {
  const el = document.getElementById('authMsg');
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}

// ── Session ──────────────────────────────────────────────────────
function saveSession(token, user) {
  localStorage.setItem('zoyeria_token', token);
  localStorage.setItem('zoyeria_user', JSON.stringify(user));
  updateHeaderUser(user);
  loadCartFromDB(); // load user's saved cart from DB
}

function updateHeaderUser(user) {
  if (!user) {
    document.getElementById('userGreet').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'flex';
    document.getElementById('dotsLoginLink').style.display = 'block';
    document.getElementById('dotsLogout').style.display = 'none';
    document.getElementById('dotsAdmin').style.display = 'none';
    return;
  }
  const firstName = user.name.split(' ')[0];
  const greet = document.getElementById('userGreet');
  greet.textContent = `Hi, ${firstName}`;
  greet.style.display = 'inline';
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('dotsLoginLink').style.display = 'none';
  document.getElementById('dotsLogout').style.display = 'block';
  // Show admin panel link if admin
  document.getElementById('dotsAdmin').style.display = user.isAdmin ? 'block' : 'none';
}

function logout() {
  localStorage.removeItem('zoyeria_token');
  localStorage.removeItem('zoyeria_user');
  updateHeaderUser(null);
  document.getElementById('dotsMenu').classList.remove('open');
}

// ── Login Submit ─────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;

  try {
    const res = await fetch(`${API}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return setAuthMsg(data.error || 'Login failed', 'error');
    saveSession(data.token, data.user);
    toggleAuthModal();
  } catch {
    setAuthMsg('Cannot connect to server. Is it running?', 'error');
  }
});

// ── Register Submit ──────────────────────────────────────────────
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name     = document.getElementById('regName').value;
  const email    = document.getElementById('regEmail').value;
  const password = document.getElementById('regPass').value;

  try {
    const res = await fetch(`${API}/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) return setAuthMsg(data.error || 'Registration failed', 'error');
    setAuthMsg('Registered! Please login.', 'success');
    setTimeout(switchToLogin, 1200);
  } catch {
    setAuthMsg('Cannot connect to server. Is it running?', 'error');
  }
});

// ── Restore session on load ──────────────────────────────────────
const savedUser = localStorage.getItem('zoyeria_user');
if (savedUser) updateHeaderUser(JSON.parse(savedUser));

// ── Init ─────────────────────────────────────────────────────────
loadProducts();
loadCartFromDB();
