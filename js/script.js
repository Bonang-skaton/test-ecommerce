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

// --- LOGIKA UTAMA: SPLASH SCREEN & RENDER PRODUK ---
window.addEventListener('load', () => {
  const splash = document.getElementById('splash-screen');
  
  // 1. Matikan scrollbody
  document.body.classList.add('stop-scroll');

  // 2. Render produk otomatis di background (Fungsi render Anda)
  if (typeof renderSemuaProduk === 'function') {
    renderSemuaProduk();
  } else {
    console.warn("Fungsi renderSemuaProduk belum didefinisikan.");
  }

  // 3. Sembunyikan splash screen setelah 3 detik
  setTimeout(() => {
    if (splash) {
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      
      // Nyalakan kembali scroll body
      document.body.classList.remove('stop-scroll');
    }
  }, 4000); // Durasi loading
});

// review 
const verifiedReviews = [
    {
        id: 1,
        productName: "Sarung Nusantara SAN 004",
        user: "Bpk. Haji Ahmad",
        rating: 5,
        comment: "Sarungnya adem, pas buat sholat tarawih. Terverifikasi!",
        img: "images/sarung-san-004-grey.png",
        date: "2026-02-27"
    },
    {
        id: 2,
        productName: "Susu SR12 GoMilku Gold",
        user: "Siti Maryam",
        rating: 5,
        comment: "Susu kambingnya enak, tidak bau prengus. Pengiriman Jabodetabek cuma sehari.",
        img: "images/gomilk-gold.png",
        date: "2026-02-26"
    },
    {
      id: 3,
        productName: "Susu SR12 GoMilku Gold",
        user: "Siti Maryam",
        rating: 5,
        comment: "Susu kambingnya enak, tidak bau prengus. Pengiriman Jabodetabek cuma sehari.",
        img: "images/gomilk-gold.png",
        date: "2026-02-26"  
    },
    {
        id: 4,
        productName: "Susu SR12 GoMilku Gold",
        user: "Siti Maryam",
        rating: 5,
        comment: "Susu kambingnya enak, tidak bau prengus. Pengiriman Jabodetabek cuma sehari.",
        img: "images/gomilk-gold.png",
        date: "2026-02-26" 
    }






    // Tambahkan review lain di sini setelah Anda kurasi
];

// logika review
function loadAllReviews() {
    const globalContainer = document.getElementById('globalReviewList');
    globalContainer.innerHTML = ""; 

    verifiedReviews.forEach(rev => {
        const stars = "★".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
        
        const reviewHTML = `
            <div class="card mb-3 border-0 border-bottom">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                        <img src="https://ui-avatars.com/api/?name=${rev.user}" class="rounded-circle me-2" width="40">
                        <div>
                            <h6 class="mb-0 fw-bold">${rev.user} <span class="badge bg-success" style="font-size: 8px;">Terverifikasi</span></h6>
                            <small class="text-warning">${stars}</small>
                        </div>
                    </div>
                    <p class="small mb-1"><strong>Produk:</strong> ${rev.productName}</p>
                    <p class="text-secondary small italic">"${rev.comment}"</p>
                    <small class="text-muted" style="font-size: 10px;">${rev.date}</small>
                </div>
            </div>
        `;
        globalContainer.innerHTML += reviewHTML;
    });
}

// Panggil fungsi saat web dimuat
document.addEventListener('DOMContentLoaded', loadAllReviews);



// untuk kirim review ke wa
// Variable global untuk menyimpan nama produk yang sedang dilihat
let currentProduct = "";

// 1. Fungsi saat tombol "Detail" diklik (di kartu produk)
document.querySelectorAll('.btnDetail').forEach(btn => {
    btn.addEventListener('click', function() {
        const card = this.closest('.card');
        currentProduct = card.querySelector('.modalNama').innerText; // Simpan nama produk
        
        // Update isi Modal Detail
        document.getElementById('detailTitle').innerText = currentProduct;
        document.getElementById('detailImage').src = card.querySelector('img').src;
        document.getElementById('detailDesc').innerHTML = card.querySelector('.deskripsi').innerHTML;

        // Tampilkan Modal Detail (Manual Trigger jika data-bs-toggle tidak dipakai)
        const detailModal = new bootstrap.Modal(document.getElementById('productDetailModal'));
        detailModal.show();
    });
});

// 2. Fungsi Kirim Review ke WhatsApp
function submitToWA() {
    // Ambil elemen input
    const nameInput = document.getElementById('revName');
    const textInput = document.getElementById('revText');
    const starInput = document.querySelector('input[name="starRating"]:checked');
    
    // Validasi input
    if (!nameInput.value.trim()) {
        alert("Silakan masukkan nama Anda.");
        return;
    }
    if (!starInput) {
        alert("Silakan pilih bintang penilaian.");
        return;
    }
    if (!textInput.value.trim()) {
        alert("Silakan tulis ulasan Anda.");
        return;
    }

    // Persiapan data
    const name = nameInput.value;
    const comment = textInput.value;
    const rating = starInput.value;
    const starsEmoji = "⭐".repeat(rating);
    const noWA = "6285778080060"; // GANTI DENGAN NOMOR ANDA (Gunakan kode negara 62)

    // Format Pesan
    const pesan = `*REVIEW PEMBELI - PARTILAHSHOP*%0A` +
                  `------------------------------%0A` +
                  `*Produk:* ${currentProduct}%0A` +
                  `*Nama:* ${name}%0A` +
                  `*Rating:* ${starsEmoji} (${rating}/5)%0A` +
                  `*Ulasan:* ${comment}%0A` +
                  `------------------------------%0A` +
                  `_Review dikirim dari website PartilahShop_`;

    // Eksekusi buka WhatsApp
    window.open(`https://wa.me/${noWA}?text=${pesan}`, '_blank');
}