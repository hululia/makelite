// MaqueUp Lite — vanilla JS (no build), localStorage persistence

const STORAGE_KEY = 'freshkeeper_products';

const PIXEL_ICONS = [
  { id: 'cleanser', emoji: '🧼', label: 'Cleanser' },
  { id: 'toner', emoji: '💧', label: 'Toner' },
  { id: 'lotion', emoji: '🧴', label: 'Lotion' },
  { id: 'cream', emoji: '🍦', label: 'Cream' },
  { id: 'lipstick', emoji: '💄', label: 'Lipstick' },
  { id: 'serum', emoji: '🧪', label: 'Serum' },
  { id: 'banana', emoji: '🍌', label: 'Banana' },
];

const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: 'Hermès Rosy Lip Enhancer',
    category: 'cosmetic',
    expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    pao: '12M',
    createdAt: Date.now(),
    icon: 'lipstick',
    info: 'Classic Hermès lipstick with high hydration.',
    photo: 'https://picsum.photos/seed/hermes/900/650',
  },
  {
    id: '2',
    name: 'Hokkaido Fresh Milk',
    category: 'food',
    expiryDate: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    icon: 'cleanser',
    photo: 'https://picsum.photos/seed/milk/900/650',
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

function getDaysRemaining(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return 'Expires Today';
  if (days === 1) return 'Expires Tomorrow';
  if (days < 0) return 'Expired';
  return `${days} days remaining`;
}

function loadProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [...INITIAL_PRODUCTS];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [...INITIAL_PRODUCTS];
}

function saveProducts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const state = {
  view: 'dashboard',
  selectedCategory: null,
  selectedProductId: null,
  products: loadProducts(),
};

function iconEmoji(iconId) {
  return PIXEL_ICONS.find((x) => x.id === iconId)?.emoji || '✨';
}

function categoryMeta(cat) {
  if (cat === 'food') return { emoji: '🍱', label: 'Food', cls: 'gradient-food' };
  if (cat === 'cosmetic') return { emoji: '✨', label: 'Beauty', cls: 'gradient-cos' };
  return { emoji: '💊', label: 'Health', cls: 'gradient-health' };
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'shell';

  if (state.view === 'dashboard') shell.appendChild(renderDashboard());
  if (state.view === 'category') shell.appendChild(renderCategory());
  if (state.view === 'details') shell.appendChild(renderDetails());

  app.appendChild(shell);

  if (state.view === 'add') {
    document.body.appendChild(renderAddModal());
  }
}

function renderDashboard() {
  const root = document.createElement('div');
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.height = '100%';

  const header = document.createElement('div');
  header.className = 'header';

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'My Inventory';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn-icon';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', () => {
    state.view = 'add';
    render();
  });

  header.appendChild(title);
  header.appendChild(addBtn);

  const sectionCats = document.createElement('div');
  sectionCats.className = 'section';
  sectionCats.innerHTML = `<h2>Categories</h2><p class="sub">Track items by category</p>`;

  const row = document.createElement('div');
  row.className = 'row-scroll no-scrollbar';

  const categories = ['food', 'cosmetic', 'health'];
  for (const c of categories) {
    const meta = categoryMeta(c);
    const card = document.createElement('div');
    card.className = `cat ${meta.cls}`;
    const count = state.products.filter((p) => p.category === c).length;
    card.innerHTML = `
      <div class="emoji">${meta.emoji}</div>
      <div>
        <div class="name">${meta.label}</div>
        <div class="count">${count} items</div>
      </div>
    `;
    card.addEventListener('click', () => {
      state.selectedCategory = c;
      state.view = 'category';
      render();
    });
    row.appendChild(card);
  }
  sectionCats.appendChild(row);

  // expiring soon
  const exp = [...state.products]
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 8);

  const sectionExp = document.createElement('div');
  sectionExp.className = 'section';
  sectionExp.innerHTML = `<h2>Expiring Soon</h2><p class="sub">Open details to manage</p>`;

  const list = document.createElement('div');
  list.className = 'list';

  for (const item of exp) {
    const rowItem = document.createElement('div');
    rowItem.className = 'item';
    rowItem.innerHTML = `
      <div class="icon">${iconEmoji(item.icon)}</div>
      <div class="meta">
        <div class="nm">${escapeHtml(item.name)}</div>
        <div class="sm">${escapeHtml(getDaysRemaining(item.expiryDate))}</div>
      </div>
      <div class="chev">›</div>
    `;
    rowItem.addEventListener('click', () => {
      state.selectedProductId = item.id;
      state.view = 'details';
      render();
    });
    list.appendChild(rowItem);
  }

  sectionExp.appendChild(list);

  root.appendChild(header);
  root.appendChild(sectionCats);
  root.appendChild(sectionExp);
  return root;
}

function renderCategory() {
  const cat = state.selectedCategory;
  const meta = categoryMeta(cat);

  const root = document.createElement('div');
  root.style.height = '100%';
  root.style.display = 'flex';
  root.style.flexDirection = 'column';

  const header = document.createElement('div');
  header.className = 'header';

  const back = document.createElement('button');
  back.className = 'btn-icon';
  back.textContent = '‹';
  back.addEventListener('click', () => {
    state.view = 'dashboard';
    render();
  });

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = meta.label;

  const spacer = document.createElement('div');
  spacer.style.width = '42px';

  header.appendChild(back);
  header.appendChild(title);
  header.appendChild(spacer);

  const section = document.createElement('div');
  section.className = 'section';
  section.innerHTML = `<p class="sub">${meta.emoji} ${meta.label} items</p>`;

  const list = document.createElement('div');
  list.className = 'list';

  const items = state.products.filter((p) => p.category === cat);
  for (const item of items) {
    const rowItem = document.createElement('div');
    rowItem.className = 'item';
    rowItem.innerHTML = `
      <div class="icon">${iconEmoji(item.icon)}</div>
      <div class="meta">
        <div class="nm">${escapeHtml(item.name)}</div>
        <div class="sm">${escapeHtml(item.expiryDate)}</div>
      </div>
      <div class="chev">›</div>
    `;
    rowItem.addEventListener('click', () => {
      state.selectedProductId = item.id;
      state.view = 'details';
      render();
    });
    list.appendChild(rowItem);
  }

  section.appendChild(list);
  root.appendChild(header);
  root.appendChild(section);
  return root;
}

function renderDetails() {
  const item = state.products.find((p) => p.id === state.selectedProductId);
  if (!item) {
    state.view = 'dashboard';
    return renderDashboard();
  }

  const root = document.createElement('div');
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.height = '100%';

  const hero = document.createElement('div');
  hero.className = 'details-hero';
  hero.innerHTML = `<img src="${escapeAttr(item.photo || 'https://picsum.photos/seed/placeholder/900/650')}" alt="" />`;

  const back = document.createElement('button');
  back.className = 'btn-icon details-back';
  back.textContent = '‹';
  back.addEventListener('click', () => {
    state.view = state.selectedCategory ? 'category' : 'dashboard';
    render();
  });
  hero.appendChild(back);

  const sheet = document.createElement('div');
  sheet.className = 'details-sheet';

  const top = document.createElement('div');
  top.style.display = 'flex';
  top.style.justifyContent = 'space-between';
  top.style.alignItems = 'flex-start';
  top.style.gap = '12px';

  const left = document.createElement('div');
  left.innerHTML = `
    <div style="font-weight:900;font-size:20px">${escapeHtml(item.name)}</div>
    <div style="color:#6e6e73;font-weight:900;font-size:11px;letter-spacing:2px;margin-top:4px">${escapeHtml(item.category.toUpperCase())}</div>
  `;

  const del = document.createElement('button');
  del.className = 'btn btn-danger';
  del.textContent = 'Delete';
  del.addEventListener('click', () => {
    state.products = state.products.filter((p) => p.id !== item.id);
    saveProducts(state.products);
    state.view = 'dashboard';
    state.selectedProductId = null;
    render();
  });

  top.appendChild(left);
  top.appendChild(del);

  const kv = document.createElement('div');
  kv.className = 'kv';
  kv.innerHTML = `
    <div class="box">
      <div class="lbl">EXPIRY DATE</div>
      <div class="val">${escapeHtml(item.expiryDate)}</div>
      <div class="val2">${escapeHtml(getDaysRemaining(item.expiryDate))}</div>
    </div>
    <div class="box">
      <div class="lbl">BATCH / PAO</div>
      <div class="val">${escapeHtml(item.batchNumber || 'None')} / ${escapeHtml(item.pao || 'N/A')}</div>
    </div>
  `;

  const notesTitle = document.createElement('div');
  notesTitle.style.fontWeight = '900';
  notesTitle.style.margin = '6px 0 8px';
  notesTitle.textContent = 'Notes';

  const notes = document.createElement('div');
  notes.style.color = '#5a5a5f';
  notes.style.lineHeight = '1.45';
  notes.textContent = item.info || 'No extra notes.';

  sheet.appendChild(top);
  sheet.appendChild(kv);
  sheet.appendChild(notesTitle);
  sheet.appendChild(notes);

  root.appendChild(hero);
  root.appendChild(sheet);
  return root;
}

function renderAddModal() {
  // remove any existing modal
  const existing = document.querySelector('.modal-backdrop');
  if (existing) existing.remove();

  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const head = document.createElement('div');
  head.className = 'modal-head';
  head.innerHTML = `<button class="btn btn-ghost">Cancel</button><h3>Add Item</h3><button class="btn btn-primary">Save</button>`;

  const [btnCancel, , btnSave] = head.children;

  btnCancel.addEventListener('click', () => {
    state.view = 'dashboard';
    bd.remove();
    render();
  });

  const form = document.createElement('div');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '10px';

  const inpName = document.createElement('input');
  inpName.className = 'input';
  inpName.placeholder = 'Product Name';

  const inpDate = document.createElement('input');
  inpDate.className = 'input';
  inpDate.type = 'date';

  const selCat = document.createElement('select');
  selCat.className = 'input';
  selCat.innerHTML = `
    <option value="cosmetic">cosmetic</option>
    <option value="food">food</option>
    <option value="health">health</option>
  `;

  const inpBatch = document.createElement('input');
  inpBatch.className = 'input';
  inpBatch.placeholder = 'Batch Number (optional)';

  const inpPao = document.createElement('input');
  inpPao.className = 'input';
  inpPao.placeholder = 'PAO (e.g. 12M)';

  const inpPhoto = document.createElement('input');
  inpPhoto.className = 'input';
  inpPhoto.placeholder = 'Image URL (optional)';

  const selIcon = document.createElement('select');
  selIcon.className = 'input';
  selIcon.innerHTML = PIXEL_ICONS.map((x) => `<option value="${x.id}">${x.emoji} ${x.label}</option>`).join('');

  const taInfo = document.createElement('textarea');
  taInfo.className = 'input';
  taInfo.placeholder = 'Notes';

  form.appendChild(inpName);
  form.appendChild(inpDate);
  form.appendChild(selCat);
  form.appendChild(inpBatch);
  form.appendChild(inpPao);
  form.appendChild(inpPhoto);
  form.appendChild(selIcon);
  form.appendChild(taInfo);

  btnSave.addEventListener('click', () => {
    const name = inpName.value.trim();
    const expiryDate = inpDate.value;
    const category = selCat.value;
    if (!name || !expiryDate) {
      alert('Please fill Name and Date');
      return;
    }

    const photo = inpPhoto.value.trim() || `https://picsum.photos/seed/${encodeURIComponent(name)}/900/650`;

    const p = {
      id: uid(),
      name,
      category,
      expiryDate,
      batchNumber: inpBatch.value.trim() || undefined,
      pao: inpPao.value.trim() || undefined,
      createdAt: Date.now(),
      photo,
      icon: selIcon.value,
      info: taInfo.value.trim() || undefined,
    };

    state.products = [...state.products, p];
    saveProducts(state.products);
    state.view = 'dashboard';
    bd.remove();
    render();
  });

  modal.appendChild(head);
  modal.appendChild(form);
  bd.appendChild(modal);
  bd.addEventListener('click', (e) => {
    if (e.target === bd) {
      state.view = 'dashboard';
      bd.remove();
      render();
    }
  });

  return bd;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}

// initial render
saveProducts(state.products);
render();
