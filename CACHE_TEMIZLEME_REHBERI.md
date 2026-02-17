# Cache Temizleme Rehberi

## Sorun: Eski Versiyon Görünüyor

Eğer bilgisayarınızda eski site versiyonunu görüyorsanız, aşağıdaki yöntemleri sırayla deneyin:

## Yöntem 1: Site İçi Cache Temizleme (EN KOLAY)

1. Tarayıcınızda sitenin URL'sine `/clear-cache.html` ekleyin
   - Örnek: `https://siteniz.com/clear-cache.html`
2. Sayfa otomatik olarak tüm cache'i temizleyecek ve ana sayfaya yönlendirecek

## Yöntem 2: Hard Refresh (HIZLI)

### Chrome, Firefox, Edge:
- **Windows/Linux:** `Ctrl + F5` veya `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### Safari:
- **Mac:** `Cmd + Option + E` (cache temizle) ardından `Cmd + R`

## Yöntem 3: Tarayıcı Cache Temizleme (KAPSAMLI)

### Chrome:
1. `Ctrl + Shift + Delete` (Windows) veya `Cmd + Shift + Delete` (Mac)
2. "Önbelleğe alınmış resimler ve dosyalar" seçeneğini işaretleyin
3. "Tüm zamanlar" seçin
4. "Verileri temizle"

### Firefox:
1. `Ctrl + Shift + Delete` (Windows) veya `Cmd + Shift + Delete` (Mac)
2. "Önbellek" seçeneğini işaretleyin
3. "Tüm geçmiş" seçin
4. "Şimdi temizle"

### Safari:
1. Safari > Ayarlar > Gelişmiş
2. "Menü çubuğunda Geliştirme menüsünü göster" seçeneğini aktifleştirin
3. Geliştirme > Boş Önbellekler

### Edge:
1. `Ctrl + Shift + Delete` (Windows) veya `Cmd + Shift + Delete` (Mac)
2. "Önbelleğe alınmış resimler ve dosyalar" seçin
3. "Her zaman" seçin
4. "Şimdi temizle"

## Yöntem 4: Gizli Mod Testi

Tarayıcınızın gizli/özel modunda siteyi açın:
- **Chrome:** `Ctrl + Shift + N` (Windows) veya `Cmd + Shift + N` (Mac)
- **Firefox:** `Ctrl + Shift + P` (Windows) veya `Cmd + Shift + P` (Mac)
- **Safari:** `Cmd + Shift + N`
- **Edge:** `Ctrl + Shift + N` (Windows) veya `Cmd + Shift + N` (Mac)

Gizli modda güncel versiyon görünüyorsa, kesinlikle cache sorunudur.

## Yöntem 5: Farklı Tarayıcı Deneyin

Chrome kullanıyorsanız Firefox deneyin veya tersi. Bu şekilde cache sorunundan emin olabilirsiniz.

## Teknik Detaylar (Geliştiriciler İçin)

### Yapılan Değişiklikler:

1. **CSS ile Bolt Badge Gizleme**
   - `src/index.css` dosyasına Bolt.new badge'ini gizleyen kurallar eklendi

2. **Güçlü Cache Önleme**
   - `index.html`: Service worker ve cache temizleme script'i eklendi
   - `public/_headers`: Daha sıkı cache kontrol direktifleri
   - `vite.config.ts`: Her build'de yeni hash oluşturma

3. **Gelişmiş Cache Temizleme Sayfası**
   - `clear-cache.html`: LocalStorage, SessionStorage, Cookies, Service Workers, Cache Storage ve IndexedDB'yi temizler

4. **Version Tag**
   - Her build'de yeni bir version numarası eklenir

### Cache Stratejisi:
- HTML/CSS/JS dosyaları: Cache yok
- Hash'li asset'ler (`[name].[hash].[ext]`): 1 yıl cache (immutable)
- Service Worker: Otomatik temizleme

## Önizleme vs Canlı Site Farklılığı

Bolt.new önizlemesi ile canlı site arasında fark olmasının nedenleri:

1. **Farklı Deploy Zamanları:** Önizleme her kaydettiğinizde güncellenir, canlı site sadece deploy ettiğinizde
2. **CDN Cache:** Canlı sitede CDN cache olabilir (Netlify, Vercel, vb.)
3. **Browser Cache:** Tarayıcı cache'i canlı siteyi daha agresif cacheliyordur

### Çözüm:
- Canlı siteye her deploy sonrası `/clear-cache.html` sayfasını ziyaret edin
- Veya Hard Refresh yapın (Ctrl+Shift+R)
