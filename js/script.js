// 1. Inisialisasi Data & Format Mata Uang
let cart = JSON.parse(localStorage.getItem('partilahCart')) || [];

const formatRupiah = (num) => {
    return 'Rp. ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ',-';
};

// 2. Logika Utama Tombol Detail (Membuka Modal, Slider, & Hitung Harga)
document.querySelectorAll('.btnDetail').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const parent = this.closest('.card');
        const nama = parent.querySelector('.modalNama').innerText;
        const hargaText = parent.querySelector('.harga').innerText;
        const deskripsi = parent.querySelector('.deskripsi') ? parent.querySelector('.deskripsi').innerHTML : '';
        const gambarUtama = parent.querySelector('img').src;
        
        // Ambil harga angka untuk kalkulasi
        const hargaPerItem = parseInt(hargaText.replace(/[^0-9]/g, ''), 10);

        // --- A. UPDATE KONTEN MODAL ---
        document.querySelector('.modalTitle').innerText = nama;
        document.querySelector('.modalDeskripsi').innerHTML = deskripsi;
        document.querySelector('.modalHarga').innerText = hargaText;

        // --- B. BANGUN SLIDER GAMBAR ---
        const imagesData = this.getAttribute('data-images');
        let imagesArray = [gambarUtama];
        if (imagesData) {
            const tambahan = imagesData.split(',');
            imagesArray = imagesArray.concat(tambahan.map(img => img.trim()));
        }

        const carouselInner = document.getElementById('carouselInnerContent');
        carouselInner.innerHTML = ''; 
        imagesArray.forEach((imgSrc, index) => {
            const activeClass = index === 0 ? 'active' : '';
            carouselInner.innerHTML += `
                <div class="carousel-item ${activeClass}">
                    <img src="${imgSrc}" class="d-block w-100 rounded" alt="Product" style="height: 350px; object-fit: contain; background: #f8f9fa;">
                </div>
            `;
        });

        // Sembunyikan panah jika gambar cuma 1
        const controls = document.querySelectorAll('#productCarousel button');
        controls.forEach(ctrl => ctrl.style.display = imagesArray.length > 1 ? 'block' : 'none');

        // --- C. RESET & KALKULASI HARGA ---
        const qtyInput = document.querySelector('#quantity');
        qtyInput.value = 1;
        document.querySelector('.modalTotal').textContent = formatRupiah(hargaPerItem);

        // Update total saat quantity diubah
        qtyInput.onchange = function() {
            document.querySelector('.modalTotal').textContent = formatRupiah(hargaPerItem * parseInt(this.value));
        };

        // --- D. LOGIKA TAMBAH KE KERANJANG ---
        const btnBeli = document.querySelector('.btnBeli');
        btnBeli.onclick = function(event) {
            event.preventDefault();
            const newItem = {
                judul: nama,
                gambar: gambarUtama,
                hargaSatuan: hargaPerItem,
                jumlah: parseInt(qtyInput.value),
                totalItemPrice: hargaPerItem * parseInt(qtyInput.value),
                catatan: document.querySelector('#note').value
            };

            cart.push(newItem);
            updateCartUI();
            
            // Tutup modal detail, buka modal keranjang
            const modalDetail = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
            modalDetail.hide();
            
            setTimeout(() => {
                const modalCart = new bootstrap.Modal(document.getElementById('cartModal'));
                modalCart.show();
            }, 500);

            // Reset catatan
            document.querySelector('#note').value = "";
        };

        // Munculkan Modal
        const myModal = new bootstrap.Modal(document.getElementById('exampleModal'));
        myModal.show();
    });
});

// 3. Fungsi Update UI Keranjang
function updateCartUI() {
    const cartList = document.querySelector('#cartItemsList');
    const cartTotalPrice = document.querySelector('#cartTotalPrice');
    const cartCount = document.querySelector('#cartCount');
    const shippingSelect = document.querySelector('#shipping');
    
    if(!cartList) return;

    cartList.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.totalItemPrice;
        cartList.innerHTML += `
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <img src="${item.gambar}" style="width: 50px; height: 50px; object-fit: cover;" class="rounded me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-0" style="font-size: 0.9rem;">${item.judul}</h6>
                    <small>${item.jumlah} x ${formatRupiah(item.hargaSatuan)}</small>
                </div>
                <div class="fw-bold me-3" style="font-size: 0.85rem;">${formatRupiah(item.totalItemPrice)}</div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${index})">
                    Hapus
                </button>
            </div>
        `;
    });

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-center text-muted">Keranjang Anda kosong.</p>';
    }

    let ongkir = 0;
    if (shippingSelect && cart.length > 0) {
        const shippingPrices = { "REGULER": 10000, "EKONOMI": 6000 };
        ongkir = shippingPrices[shippingSelect.value] || 0;
    }

    cartTotalPrice.textContent = formatRupiah(subtotal + ongkir);
    cartCount.textContent = cart.length;
    
    localStorage.setItem('partilahCart', JSON.stringify(cart));
    if (typeof feather !== 'undefined') feather.replace();
}

// 4. Logika Pencarian
const searchInput = document.querySelector('#searchInput');
if(searchInput){
    searchInput.addEventListener('keyup', function (e) {
        let searchText = e.target.value.toLowerCase();
        let allCards = document.querySelectorAll('#productList .col');
        allCards.forEach(card => {
            let productName = card.querySelector('.modalNama').textContent.toLowerCase();
            card.style.display = productName.includes(searchText) ? "" : "none";
        });
    });
}

// 5. Fungsi Hapus Item
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

// 6. Update Ongkir
const shippingElem = document.querySelector('#shipping');
if(shippingElem) shippingElem.addEventListener('change', updateCartUI);

// 7. Checkout WhatsApp
const checkoutBtn = document.querySelector('#checkoutWA');
if(checkoutBtn){
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) return alert("Keranjang belanja masih kosong!");
        
        const nama = document.querySelector('#name').value.trim();
        const phone = document.querySelector('#phone').value.trim();
        const address = document.querySelector('#address').value.trim();
        const kurir = document.querySelector('#shipping').value;

        if (!nama || !phone || !address) {
            alert("Harap lengkapi Nama, No HP, dan Alamat Pengiriman!");
            return;
        }

        if (kurir === "empty" || !kurir) {
            alert("Pilih Jasa Pengiriman terlebih dahulu!");
            return;
        }

        let pesanText = `*PESANAN BARU - PARTILAH SHOP*%0A`;
        pesanText += `-------------------------------------------%0A`;
        let totalBelanja = 0;

        cart.forEach((item, i) => {
            pesanText += `*${i+1}. ${item.judul}*%0A`;
            pesanText += `   Jml: ${item.jumlah} x ${formatRupiah(item.hargaSatuan)}%0A`;
            if(item.catatan) pesanText += `   Catatan: _${item.catatan}_%0A`;
            totalBelanja += item.totalItemPrice;
        });

        const shippingPrices = { "REGULER": 10000, "EKONOMI": 6000 };
        let biayaOngkir = shippingPrices[kurir] || 0;

        pesanText += `-------------------------------------------%0A`;
        pesanText += `*Subtotal:* ${formatRupiah(totalBelanja)}%0A`;
        pesanText += `*Kurir:* ${kurir} (${formatRupiah(biayaOngkir)})%0A`;
        pesanText += `*TOTAL BAYAR:* ${formatRupiah(totalBelanja + biayaOngkir)}%0A`;
        pesanText += `-------------------------------------------%0A`;
        pesanText += `*Data Pengiriman:*%0A`;
        pesanText += `Nama: ${nama}%0A`;
        pesanText += `No.HP: ${phone}%0A`;
        pesanText += `Alamat: ${address}%0A`;

        window.open(`https://api.whatsapp.com/send?phone=6285778080060&text=${pesanText}`, '_blank');
    });
}

document.addEventListener('DOMContentLoaded', updateCartUI);


// cek resi
// 1. DATA MASTER KURIR (Ubah/Tambah di sini saja)
// const daftarKurir = {
//     "spx": { nama: "SPX (Shopee Express)", url: "https://spx.co.id/track/" },
//     "jne": { nama: "JNE", url: "https://www.jne.co.id/id/tracking/track" },
//     "jnt": { nama: "J&T Express", url: "https://www.jet.co.id/track" },
//     "sicepat": { nama: "SiCepat", url: "https://www.sicepat.com/check-resi" },
//     "tiki": { nama: "TIKI", url: "https://www.tiki.id/id/tracking" }
// };

// // 2. FUNGSI UNTUK MENGISI DROPDOWN SECARA OTOMATIS
// function renderKurirOptions() {
//     const selector = document.getElementById('kurirSelector');
//     if (!selector) return;

//     // Tambahkan opsi default
//     let optionsHtml = '<option value="" disabled selected>-- Pilih Kurir --</option>';

//     // Loop data dari object daftarKurir
//     Object.keys(daftarKurir).forEach(key => {
//         optionsHtml += `<option value="${key}">${daftarKurir[key].nama}</option>`;
//     });

//     selector.innerHTML = optionsHtml;
// }

// // 3. FUNGSI LACAK PAKET (DINAMIS)
// function lacakPaket() {
//     const kurirKey = document.getElementById('kurirSelector').value;
//     const resi = document.getElementById('resiNumber').value.trim();

//     if (!kurirKey) {
//         alert("Silakan pilih kurir terlebih dahulu!");
//         return;
//     }
//     if (!resi) {
//         alert("Silakan masukkan nomor resi!");
//         return;
//     }

//     const kurirTerpilih = daftarKurir[kurirKey];
//     let finalUrl = kurirTerpilih.url;

//     // Logika khusus SPX: Link langsung ke hasil (Deep Link)
//     // Untuk kurir lain biasanya hanya diarahkan ke halaman tracking utama
//     if (kurirKey === "spx") {
//         finalUrl += resi;
//     }

//     // Buka link di tab baru
//     window.open(finalUrl, '_blank');
// }

// // JALANKAN SAAT HALAMAN DIMUAT
// document.addEventListener('DOMContentLoaded', renderKurirOptions);



// SCRIPT REVIEW
/* ================================================================
   TOKOPEDIA-STYLE REVIEW SECTION — script.js
   ================================================================ */

// ── State ──────────────────────────────────────────────────────
let selectedStar  = 0;
let currentFilter = 'all';
let currentPage   = 1;
let helpfulState  = {};    // { reviewId: true/false }
let uploadedPhotos = [];

const REVIEWS_PER_PAGE = 4;

// ── Hint teks rating ───────────────────────────────────────────
const RATING_HINTS = {
  1: '😞 Sangat tidak puas',
  2: '😐 Kurang memuaskan',
  3: '😊 Cukup memuaskan',
  4: '😄 Puas dengan produk ini',
  5: '🤩 Sangat puas! Produk luar biasa!'
};

// Avatar warna acak
const AVATAR_COLORS = [
  '#03AC0E','#FF7100','#2196F3','#9C27B0',
  '#E91E63','#00BCD4','#FF5722','#607D8B'
];

// ── Data Ulasan ────────────────────────────────────────────────
const INITIAL_REVIEWS = [
  {
    id: 1,
    name: 'Budi Santoso',
    avatar: 'BS',
    rating: 5,
    date: '12 Jan 2024',
    location: 'Jakarta',
    verified: true,
    text: 'Produk bagus banget! Kualitas suara jernih, bass kencang, nyaman dipakai seharian. Baterai juga tahan lama, bisa sampai 20 jam lebih. Sangat worth it untuk harganya. Packing aman dan pengiriman cepat. Recommended banget!',
    variant: 'Warna: Hitam | Tipe: Bluetooth 5.0',
    images: ['🎧','🎵','📦'],
    helpful: 24,
    reply: 'Terima kasih atas ulasannya, Kak Budi! Senang mendengar Kakak puas dengan produknya. Jika ada pertanyaan atau butuh bantuan, jangan ragu untuk menghubungi kami ya! 😊🙏'
  },
  {
    id: 2,
    name: 'Dewi Rahayu',
    avatar: 'DR',
    rating: 5,
    date: '8 Jan 2024',
    location: 'Surabaya',
    verified: true,
    text: 'Headphone terbaik di kelasnya! Noise cancelling-nya ngeri banget, bisa fokus kerja tanpa gangguan. Desainnya juga keren dan elegan. Highly recommended untuk yang kerja WFH!',
    variant: 'Warna: Putih | Tipe: ANC Edition',
    images: ['💎','🏠'],
    helpful: 18,
    reply: null
  },
  {
    id: 3,
    name: 'Ricky Pratama',
    avatar: 'RP',
    rating: 4,
    date: '5 Jan 2024',
    location: 'Bandung',
    verified: true,
    text: 'Secara keseluruhan produk sangat memuaskan. Suara jernih dan bass nendang. Hanya saja packaging bisa lebih rapi sedikit. Tapi untuk produknya sendiri, tidak ada komplain sama sekali!',
    variant: 'Warna: Hitam | Tipe: Bluetooth 5.0',
    images: [],
    helpful: 9,
    reply: 'Terima kasih masukannya, Kak Ricky! Kami akan terus meningkatkan kualitas packaging kami ke depannya. 🙏'
  },
  {
    id: 4,
    name: 'Siti Nurhaliza',
    avatar: 'SN',
    rating: 5,
    date: '2 Jan 2024',
    location: 'Medan',
    verified: false,
    text: 'Keren banget! Udah lama nyari headphone berkualitas dengan harga terjangkau, akhirnya ketemu. Suaranya detail banget, earcup-nya empuk, tidak panas meski dipakai berjam-jam.',
    variant: 'Warna: Navy Blue | Tipe: Bluetooth 5.0',
    images: ['🔵','🎶','✨'],
    helpful: 31,
    reply: null
  },
  {
    id: 5,
    name: 'Andi Wijaya',
    avatar: 'AW',
    rating: 3,
    date: '28 Des 2023',
    location: 'Yogyakarta',
    verified: true,
    text: 'Produk oke, tapi ada sedikit delay suara saat digunakan untuk gaming. Untuk dengerin musik sih enak banget. Mungkin akan lebih cocok untuk pengguna kasual.',
    variant: 'Warna: Hitam | Tipe: Bluetooth 5.0',
    images: [],
    helpful: 5,
    reply: 'Halo Kak Andi, untuk gaming memang disarankan pakai mode wired ya supaya zero latency. Semoga membantu! 😊'
  },
  {
    id: 6,
    name: 'Fajar Nugroho',
    avatar: 'FN',
    rating: 5,
    date: '20 Des 2023',
    location: 'Makassar',
    verified: true,
    text: 'Top banget! Gak nyesel beli di sini. Harga bersaing, produk ori, pengiriman super cepat. ANC-nya benar-benar membantu saat di tempat ramai. Suaranya sesuai selera. Udah jadi daily driver saya!',
    variant: 'Warna: Merah | Tipe: ANC Edition',
    images: ['❤️','🎧'],
    helpful: 42,
    reply: null
  },
  {
    id: 7,
    name: 'Yuni Astuti',
    avatar: 'YA',
    rating: 4,
    date: '15 Des 2023',
    location: 'Semarang',
    verified: true,
    text: 'Produknya mantap, sesuai deskripsi. Baterai awet, suara bagus. Minus satu bintang karena tidak ada case penyimpanan di dalam box. Tapi overall sangat puas!',
    variant: 'Warna: Putih | Tipe: Bluetooth 5.0',
    images: ['📦'],
    helpful: 7,
    reply: 'Terima kasih ulasannya, Kak Yuni! Case penyimpanan tersedia terpisah di toko kami ya. Maaf atas ketidaknyamanannya 🙏'
  },
  {
    id: 8,
    name: 'Hendra Kusuma',
    avatar: 'HK',
    rating: 5,
    date: '10 Des 2023',
    location: 'Palembang',
    verified: false,
    text: 'Luar biasa! Awalnya ragu beli online tapi ternyata produk 100% original. Suaranya sangat memuaskan, build quality premium. Seller juga responsif dan baik. Pasti repeat order!',
    variant: 'Warna: Hitam | Tipe: ANC Edition',
    images: ['🌟','🎧','👍'],
    helpful: 15,
    reply: null
  }
];

// Mutable copy
let allReviews = INITIAL_REVIEWS.map(r => ({ ...r }));

// ── Rating Summary Data ────────────────────────────────────────
const RATING_DATA = { 5: 98, 4: 29, 3: 9, 2: 4, 1: 2 };
const TOTAL_REVIEWS = Object.values(RATING_DATA).reduce((a,b) => a+b, 0);

// ================================================================
// INISIALISASI
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  buildSummaryStars();
  buildRatingBars();
  renderReviews();
  renderPagination();
  initTextareaCounter();
  animateBarsOnLoad();
});

// ── Build Summary Stars ────────────────────────────────────────
function buildSummaryStars() {
  const container = document.getElementById('summaryStars');
  if (!container) return;
  for (let i = 1; i <= 5; i++) {
    const span = document.createElement('span');
    span.className = 'star-icon';
    span.textContent = i <= 4 ? '⭐' : '✨';
    container.appendChild(span);
  }
}

// ── Build Rating Bars ─────────────────────────────────────────
function buildRatingBars() {
  const container = document.getElementById('ratingBars');
  if (!container) return;

  [5,4,3,2,1].forEach(star => {
    const count = RATING_DATA[star] || 0;
    const pct   = Math.round((count / TOTAL_REVIEWS) * 100);

    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span class="label">⭐ ${star}</span>
      <div class="bar-track" title="${count} ulasan">
        <div class="bar-fill" data-pct="${pct}" style="width:0%"></div>
      </div>
      <span class="count">${count}</span>
    `;
    // Klik bar untuk filter
    row.querySelector('.bar-track').addEventListener('click', () => {
      const btn = document.querySelector(`.filter-btn[data-filter="${star}"]`);
      if (btn) filterReviews(btn, String(star));
    });
    container.appendChild(row);
  });
}

// Animasi bar setelah halaman load
function animateBarsOnLoad() {
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(fill => {
      fill.style.width = fill.dataset.pct + '%';
    });
  }, 200);
}

// ================================================================
// RENDER REVIEWS
// ================================================================
function getFilteredReviews() {
  let list = [...allReviews];

  if (currentFilter === 'photo') {
    list = list.filter(r => r.images && r.images.length > 0);
  } else if (currentFilter === 'reply') {
    list = list.filter(r => r.reply);
  } else if (['1','2','3','4','5'].includes(currentFilter)) {
    list = list.filter(r => r.rating === parseInt(currentFilter));
  }
  return list;
}

function getSortedReviews(list) {
  const val = document.getElementById('sortSelect')?.value || 'newest';
  const copy = [...list];
  switch (val) {
    case 'oldest':  return copy.reverse();
    case 'highest': return copy.sort((a,b) => b.rating - a.rating);
    case 'lowest':  return copy.sort((a,b) => a.rating - b.rating);
    case 'helpful': return copy.sort((a,b) => (b.helpful + (helpfulState[b.id]?1:0)) - (a.helpful + (helpfulState[a.id]?1:0)));
    default:        return copy; // newest = original order
  }
}

function renderReviews() {
  const container = document.getElementById('reviewsList');
  if (!container) return;
  container.innerHTML = '';

  const filtered = getSortedReviews(getFilteredReviews());
  const total = filtered.length;
  const start = (currentPage - 1) * REVIEWS_PER_PAGE;
  const page  = filtered.slice(start, start + REVIEWS_PER_PAGE);

  if (total === 0) {
    container.innerHTML = `
      <div class="no-review-msg">
        <span class="no-icon">🔍</span>
        Belum ada ulasan dengan filter ini.
      </div>`;
    renderPagination(0);
    return;
  }

  page.forEach((review, idx) => {
    const el = buildReviewElement(review, idx);
    container.appendChild(el);
  });

  renderPagination(total);
}

function buildReviewElement(review, idx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'review-item';
  wrapper.style.animationDelay = `${idx * 0.07}s`;

  const isHelpful = helpfulState[review.id] || false;
  const helpfulCount = review.helpful + (isHelpful ? 1 : 0);
  const avatarColor = AVATAR_COLORS[review.id % AVATAR_COLORS.length];

  // Stars HTML
  const stars = Array.from({length:5}, (_,i) =>
    `<span class="s">${i < review.rating ? '⭐' : '☆'}</span>`
  ).join('');

  // Images HTML
  const imagesHTML = review.images && review.images.length > 0
    ? `<div class="review-images">
        ${review.images.map(img => `
          <div class="review-img-thumb"
               onclick="openLightbox('${img}', '${review.name} — foto produk')">
            ${img}
          </div>`).join('')}
       </div>`
    : '';

  // Reply HTML
  const replyHTML = review.reply
    ? `<div class="seller-reply">
         <div class="seller-label">🏪 Balasan Penjual</div>
         <p>${review.reply}</p>
       </div>`
    : '';

  // Verified badge
  const verifiedHTML = review.verified
    ? `<span class="verified-badge">✔ Pembeli Terverifikasi</span>`
    : '';

  // Text dengan read more jika panjang
  const maxLen = 150;
  const shortText = review.text.length > maxLen
    ? review.text.slice(0, maxLen) + '...'
    : review.text;
  const textHTML = review.text.length > maxLen
    ? `<div class="review-text" id="rt-${review.id}">${shortText}</div>
       <button class="read-more-btn" onclick="toggleReadMore(${review.id}, this)">Lihat selengkapnya ▾</button>`
    : `<div class="review-text">${review.text}</div>`;

  wrapper.innerHTML = `
    <div class="review-top">
      <div class="avatar" style="background:${avatarColor}">${review.avatar}</div>
      <div class="reviewer-info">
        <div class="reviewer-name">${review.name}</div>
        <div class="reviewer-meta">
          <span>📍 ${review.location}</span>
          <span>· ${review.date}</span>
          ${verifiedHTML}
        </div>
      </div>
    </div>

    <div class="review-stars">${stars}</div>
    ${textHTML}
    <span class="variant-tag">🏷 ${review.variant}</span>
    ${imagesHTML}

    <div class="review-actions">
      <button class="helpful-btn ${isHelpful ? 'active' : ''}"
              onclick="toggleHelpful(${review.id}, this)">
        👍 Membantu (${helpfulCount})
      </button>
      <button class="report-btn" onclick="reportReview(${review.id})">Laporkan</button>
    </div>

    ${replyHTML}
  `;
  return wrapper;
}

// Read More toggle
function toggleReadMore(id, btn) {
  const review = allReviews.find(r => r.id === id);
  if (!review) return;
  const el = document.getElementById(`rt-${id}`);
  if (!el) return;

  if (btn.dataset.expanded === 'true') {
    const maxLen = 150;
    el.textContent = review.text.slice(0, maxLen) + '...';
    btn.textContent = 'Lihat selengkapnya ▾';
    btn.dataset.expanded = 'false';
  } else {
    el.textContent = review.text;
    btn.textContent = 'Sembunyikan ▴';
    btn.dataset.expanded = 'true';
  }
}

// ================================================================
// PAGINATION
// ================================================================
function renderPagination(total) {
  const container = document.getElementById('pagination');
  if (!container) return;
  container.innerHTML = '';
  if (!total) return;

  const pages = Math.ceil(total / REVIEWS_PER_PAGE);
  if (pages <= 1) return;

  // Prev
  const prev = makePageBtn('‹', currentPage === 1, () => {
    currentPage--; renderReviews(); scrollToReviews();
  });
  container.appendChild(prev);

  // Page numbers
  for (let i = 1; i <= pages; i++) {
    const btn = makePageBtn(String(i), false, () => {
      currentPage = i; renderReviews(); scrollToReviews();
    });
    if (i === currentPage) btn.classList.add('active');
    container.appendChild(btn);
  }

  // Next
  const next = makePageBtn('›', currentPage === pages, () => {
    currentPage++; renderReviews(); scrollToReviews();
  });
  container.appendChild(next);
}

function makePageBtn(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.className = 'page-btn';
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}

function scrollToReviews() {
  document.getElementById('reviewsList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ================================================================
// FILTER & SORT
// ================================================================
function filterReviews(btn, filter) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = filter;
  currentPage = 1;
  renderReviews();
}

function sortReviews(val) {
  currentPage = 1;
  renderReviews();
}

// ================================================================
// HELPFUL / REPORT
// ================================================================
function toggleHelpful(id, btn) {
  const review = allReviews.find(r => r.id === id);
  if (!review) return;

  helpfulState[id] = !helpfulState[id];
  const count = review.helpful + (helpfulState[id] ? 1 : 0);

  btn.classList.toggle('active', helpfulState[id]);
  btn.innerHTML = `👍 Membantu (${count})`;

  showToast(helpfulState[id] ? '👍 Terima kasih atas penilaianmu!' : '✅ Penilaian dibatalkan', 'success');
}

function reportReview(id) {
  showToast('🚩 Ulasan telah dilaporkan. Terima kasih!', '');
}

// ================================================================
// STAR PICKER
// ================================================================
function selectStar(val) {
  selectedStar = val;
  const hints = {
    1: '😞 Sangat tidak puas',
    2: '😐 Kurang memuaskan',
    3: '😊 Cukup memuaskan',
    4: '😄 Puas dengan produk ini',
    5: '🤩 Sangat puas! Produk luar biasa!'
  };
  document.getElementById('ratingHint').textContent = hints[val] || '';

  document.querySelectorAll('.star-picker span').forEach(s => {
    const v = parseInt(s.dataset.val);
    s.classList.toggle('selected', v <= val);
  });
}

// Star hover effect
document.addEventListener('DOMContentLoaded', () => {
  const stars = document.querySelectorAll('.star-picker span');
  stars.forEach(s => {
    s.addEventListener('mouseenter', () => {
      const hv = parseInt(s.dataset.val);
      stars.forEach(ss => ss.classList.toggle('selected', parseInt(ss.dataset.val) <= hv));
    });
    s.addEventListener('mouseleave', () => {
      stars.forEach(ss => ss.classList.toggle('selected', parseInt(ss.dataset.val) <= selectedStar));
    });
  });
});

// ================================================================
// TEXTAREA COUNTER
// ================================================================
function initTextareaCounter() {
  const ta    = document.getElementById('reviewText');
  const count = document.getElementById('charCount');
  if (!ta || !count) return;

  ta.addEventListener('input', () => {
    count.textContent = ta.value.length;
    if (ta.value.length > 450) {
      count.style.color = '#e53935';
    } else {
      count.style.color = '';
    }
  });
}

// ================================================================
// PHOTO UPLOAD
// ================================================================
function triggerUpload() {
  document.getElementById('photoInput')?.click();
}

function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  const row = document.getElementById('photoPreviewRow');
  if (!row) return;

  const emojis = ['🖼','📷','🌟','✨','🎯'];
  files.forEach((file, i) => {
    if (uploadedPhotos.length >= 5) {
      showToast('⚠️ Maksimal 5 foto', '');
      return;
    }
    const id = Date.now() + i;
    uploadedPhotos.push({ id, name: file.name });

    const thumb = document.createElement('div');
    thumb.className = 'preview-thumb';
    thumb.id = `ph-${id}`;
    thumb.innerHTML = `
      ${emojis[uploadedPhotos.length % emojis.length]}
      <button class="remove-photo" onclick="removePhoto(${id})">✕</button>
    `;
    row.appendChild(thumb);
  });

  showToast(`📷 ${files.length} foto ditambahkan`, 'success');
  // reset input
  event.target.value = '';
}

function removePhoto(id) {
  uploadedPhotos = uploadedPhotos.filter(p => p.id !== id);
  document.getElementById(`ph-${id}`)?.remove();
  showToast('🗑 Foto dihapus', '');
}

// ================================================================
// SUBMIT REVIEW
// ================================================================
function submitReview() {
  const text = document.getElementById('reviewText')?.value.trim() || '';

  if (selectedStar === 0) {
    showToast('⭐ Pilih rating terlebih dahulu!', 'error');
    return;
  }
  if (text.length < 10) {
    showToast('✏️ Ulasan minimal 10 karakter ya!', 'error');
    return;
  }

  // Build new review
  const names  = ['Kamu', 'Reviewer Baru'];
  const initials = 'KM';
  const newReview = {
    id:       Date.now(),
    name:     'Kamu',
    avatar:   initials,
    rating:   selectedStar,
    date:     new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }),
    location: 'Indonesia',
    verified: true,
    text,
    variant:  'Warna: Hitam | Tipe: Bluetooth 5.0',
    images:   uploadedPhotos.map(() => '📷'),
    helpful:  0,
    reply:    null
  };

  allReviews.unshift(newReview);
  currentFilter = 'all';
  currentPage   = 1;

  // Reset form
  selectedStar = 0;
  document.querySelectorAll('.star-picker span').forEach(s => s.classList.remove('selected'));
  document.getElementById('reviewText').value = '';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('ratingHint').textContent = 'Pilih bintang untuk memberi rating';
  document.getElementById('photoPreviewRow').innerHTML = '';
  uploadedPhotos = [];

  // Reset filter buttons
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');

  renderReviews();
  showToast('🎉 Ulasanmu berhasil dikirim! Terima kasih!', 'success');
  scrollToReviews();
}

// ================================================================
// LIGHTBOX
// ================================================================
function openLightbox(emoji, caption) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  document.getElementById('lightboxEmoji').textContent = emoji;
  document.getElementById('lightboxCaption').textContent = caption;
  lb.classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
}

// ESC to close lightbox
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// ================================================================
// TOAST
// ================================================================
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast${type ? ' ' + type : ''} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}
