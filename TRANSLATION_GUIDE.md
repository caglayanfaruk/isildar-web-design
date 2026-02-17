# 🌍 Birleşik Çeviri Sistemi Kullanım Kılavuzu

## 📋 Genel Bakış

Artık **TEK BİR ÇEVİRİ SİSTEMİ** var. Her şey `translations` tablosunda saklanıyor.

**Nasıl Çalışır:**
1. ✅ Admin panelde her şeyi **SADECE TÜRKÇE** girersiniz
2. ✅ Kullanıcı başka dil seçtiğinde **otomatik Google Translate** ile çevrilir
3. ✅ Çeviri **veritabanına kaydedilir** (API kredisi sadece ilk seferde kullanılır)
4. ✅ Sonraki kullanımlarda **veritabanından** çekilir (hızlı + ücretsiz)

---

## 🎯 KULLANIM ÖRNEKLERİ

### 1️⃣ STATİK İÇERİK (Header, Footer, Sayfa Başlıkları)

```typescript
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('contact.title', 'İletişim')}</h1>
      <p>{t('contact.subtitle', 'Bizimle iletişime geçin')}</p>
    </div>
  );
}
```

**Türkçe çevirileri veritabanına ekleme:**
```sql
INSERT INTO translations (language_code, translation_key, translation_value, source_text, translation_type)
VALUES
('tr', 'contact.title', 'İletişim', 'İletişim', 'static'),
('tr', 'contact.subtitle', 'Bizimle iletişime geçin', 'Bizimle iletişime geçin', 'static');
```

---

### 2️⃣ DİNAMİK İÇERİK (Kategoriler)

**Frontend - Kategori Listesi:**

```typescript
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';

function CategoryList() {
  const { currentLanguage } = useTranslation();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, [currentLanguage]);

  const loadCategories = async () => {
    // 1. Türkçe kategorileri çek
    const { data: rawCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    // 2. Çevirileri uygula
    const translatedCategories = await Promise.all(
      rawCategories.map(async (cat) => {
        const translatedName = await translate(
          cat.name, // Türkçe ad
          currentLanguage,
          `category.${cat.id}.name`, // Unique key
          { type: 'category' }
        );

        const translatedDesc = await translate(
          cat.description || '',
          currentLanguage,
          `category.${cat.id}.description`,
          { type: 'category' }
        );

        return {
          ...cat,
          name: translatedName,
          description: translatedDesc
        };
      })
    );

    setCategories(translatedCategories);
  };

  return (
    <div>
      {categories.map(cat => (
        <div key={cat.id}>
          <h3>{cat.name}</h3>
          <p>{cat.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### 3️⃣ DİNAMİK İÇERİK (Ürünler)

**Frontend - Ürün Listesi:**

```typescript
import { useTranslation } from '../hooks/useTranslation';
import { translate } from '../services/unifiedTranslationService';

function ProductList() {
  const { currentLanguage } = useTranslation();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, [currentLanguage]);

  const loadProducts = async () => {
    // 1. Türkçe ürünleri çek
    const { data: rawProducts } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    // 2. Çevirileri uygula
    const translatedProducts = await Promise.all(
      rawProducts.map(async (prod) => {
        const translatedName = await translate(
          prod.name,
          currentLanguage,
          `product.${prod.id}.name`,
          { type: 'product' }
        );

        const translatedShortDesc = await translate(
          prod.short_description || '',
          currentLanguage,
          `product.${prod.id}.short_desc`,
          { type: 'product' }
        );

        return {
          ...prod,
          name: translatedName,
          short_description: translatedShortDesc
        };
      })
    );

    setProducts(translatedProducts);
  };

  return (
    <div>
      {products.map(prod => (
        <div key={prod.id}>
          <h3>{prod.name}</h3>
          <p>{prod.short_description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### 4️⃣ ADMİN PANEL - KATEGORİ OLUŞTURMA

**Admin Panelde Kategori Kaydederken:**

```typescript
import { saveAndTranslate } from '../services/unifiedTranslationService';

async function handleSaveCategory(formData: any) {
  // 1. Kategoriyi Türkçe olarak kaydet
  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      name: formData.name, // TÜRKÇE
      description: formData.description, // TÜRKÇE
      slug: formData.slug,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;

  // 2. Tüm dillere otomatik çevir ve kaydet
  await saveAndTranslate(
    formData.name,
    `category.${category.id}.name`,
    'category',
    ['en', 'fr', 'de', 'ar', 'ru'] // Desteklenen diller
  );

  await saveAndTranslate(
    formData.description,
    `category.${category.id}.description`,
    'category',
    ['en', 'fr', 'de', 'ar', 'ru']
  );

  toast.success('Kategori kaydedildi ve tüm dillere çevrildi!');
}
```

---

### 5️⃣ ADMİN PANEL - ÜRÜN OLUŞTURMA

**Admin Panelde Ürün Kaydederken:**

```typescript
import { saveAndTranslate } from '../services/unifiedTranslationService';

async function handleSaveProduct(formData: any) {
  // 1. Ürünü Türkçe olarak kaydet
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      sku: formData.sku,
      name: formData.name, // TÜRKÇE
      short_description: formData.short_description, // TÜRKÇE
      long_description: formData.long_description, // TÜRKÇE
      category_id: formData.category_id,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;

  // 2. Tüm dillere otomatik çevir ve kaydet
  await saveAndTranslate(
    formData.name,
    `product.${product.id}.name`,
    'product',
    ['en', 'fr', 'de', 'ar', 'ru']
  );

  await saveAndTranslate(
    formData.short_description,
    `product.${product.id}.short_desc`,
    'product',
    ['en', 'fr', 'de', 'ar', 'ru']
  );

  await saveAndTranslate(
    formData.long_description,
    `product.${product.id}.long_desc`,
    'product',
    ['en', 'fr', 'de', 'ar', 'ru']
  );

  toast.success('Ürün kaydedildi ve tüm dillere çevrildi!');
}
```

---

### 6️⃣ TOPLU ÇEVİRİ (Performans İçin)

**Çok sayıda öğeyi aynı anda çevirmek için:**

```typescript
import { translateBatch } from '../services/unifiedTranslationService';

async function loadCategoriesOptimized() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true);

  // Toplu çeviri için hazırla
  const items = categories.flatMap(cat => [
    { key: `category.${cat.id}.name`, text: cat.name },
    { key: `category.${cat.id}.description`, text: cat.description || '' }
  ]);

  // Tek seferde hepsini çevir
  const translations = await translateBatch(items, currentLanguage, 'category');

  // Çevirileri uygula
  const translatedCategories = categories.map(cat => ({
    ...cat,
    name: translations.get(`category.${cat.id}.name`) || cat.name,
    description: translations.get(`category.${cat.id}.description`) || cat.description
  }));

  setCategories(translatedCategories);
}
```

---

## 🔑 ÖNEMLİ NOTLAR

### ✅ DOĞRU Kullanım

```typescript
// ✅ Her öğe için unique key kullan
await translate('Aydınlatma', 'en', 'category.123.name');

// ✅ Türkçe metni kaynak olarak sakla
await saveAndTranslate('LED Panel', 'product.456.name', 'product');

// ✅ Toplu işlemler için translateBatch kullan
await translateBatch(items, 'en', 'category');
```

### ❌ YANLIŞ Kullanım

```typescript
// ❌ Aynı key'i farklı metinler için kullanma
await translate('Aydınlatma', 'en', 'category.name'); // YANLIŞ
await translate('Elektrik', 'en', 'category.name'); // ÇELİŞİR!

// ❌ Her seferinde API'ye gönderme (veritabanından çek)
// Bu otomatik yapılıyor, endişelenmeyin!
```

---

## 📊 VERİTABANI YAPISI

```sql
translations table:
├── language_code (tr, en, fr, de, ar, ru)
├── translation_key (category.123.name, product.456.name)
├── translation_value (çevrilmiş metin)
├── source_text (orijinal Türkçe metin)
├── translation_type (static, category, product, filter)
├── auto_translated (true/false)
├── last_updated (timestamp)
└── context (ek bilgi)
```

---

## 🚀 PERFORMANS İPUÇLARI

1. **Cache Kullanımı:** İlk çağrıdan sonra cache'den gelir (çok hızlı)
2. **Toplu Çeviri:** Çok öğe varsa `translateBatch` kullanın (50 öğe/batch)
3. **Lazy Loading:** Sadece görünen öğeleri çevirin
4. **Pre-translation:** Admin panelde kaydettiğinizde tüm dillere çevirin

---

## 🎨 ÖZELLEŞTİRME

### Desteklenen dilleri değiştir:

```typescript
// unifiedTranslationService.ts içinde
const DEFAULT_LANGUAGES = ['en', 'fr', 'de', 'ar', 'ru', 'es', 'it'];
```

### Batch boyutunu ayarla:

```typescript
// unifiedTranslationService.ts içinde
const batchSize = 50; // API limitine göre ayarlayın
```

---

## 🐛 SORUN GİDERME

### Çeviri görünmüyor?
1. `console.log(currentLanguage)` ile dili kontrol edin
2. Veritabanında `translation_key` doğru mu?
3. Cache temizleyin: `clearTranslationCache()`

### API kredisi çok hızlı tükeniyor?
1. Aynı metni farklı key'lerle mi çeviriyorsunuz?
2. Cache çalışıyor mu kontrol edin
3. `translateBatch` kullanın

### Çeviri yavaş?
1. `translateBatch` kullanın
2. Loading state ekleyin
3. Lazy loading yapın

---

## 📞 DESTEK

Sorun yaşarsanız:
1. Console'da hata var mı kontrol edin
2. `translations` tablosunu Supabase'den kontrol edin
3. Network tab'inde API çağrılarını kontrol edin
