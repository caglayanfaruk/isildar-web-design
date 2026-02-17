/*
  # Add Static UI Translations

  1. Purpose
    - Add Turkish source text for all static UI elements
    - These will be auto-translated to other languages on demand
    - Covers: Homepage, About, Contact, Quote pages

  2. Translation Categories
    - ui.homepage: Homepage static texts
    - ui.about: About page static texts
    - ui.contact: Contact page static texts
    - ui.quote: Quote page static texts
    - ui.common: Common UI elements (buttons, labels, etc.)

  3. Usage
    - Admin doesn't need to manage these
    - Frontend uses t() function from useTranslation
    - Auto-translation happens on first use per language
*/

-- ============================================================================
-- HOMEPAGE TRANSLATIONS
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, source_text, translation_type, auto_translated, context) VALUES
('tr', 'ui.homepage.categories_title', 'Ürün Kategorilerimiz', 'Ürün Kategorilerimiz', 'ui', false, 'homepage'),
('tr', 'ui.homepage.categories_subtitle', 'Her ihtiyaca uygun, kaliteli ve modern aydınlatma ürünleri ile yaşam ve çalışma alanlarınız için en iyi çözümler', 'Her ihtiyaca uygun, kaliteli ve modern aydınlatma ürünleri ile yaşam ve çalışma alanlarınız için en iyi çözümler', 'ui', false, 'homepage'),
('tr', 'ui.homepage.view_products', 'Ürünleri Görüntüle', 'Ürünleri Görüntüle', 'ui', false, 'homepage'),
('tr', 'ui.homepage.explore_category', 'Kategoriyi Keşfet', 'Kategoriyi Keşfet', 'ui', false, 'homepage'),
('tr', 'ui.homepage.products_count', 'ürün', 'ürün', 'ui', false, 'homepage')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text;

-- ============================================================================
-- ABOUT PAGE TRANSLATIONS
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, source_text, translation_type, auto_translated, context) VALUES
('tr', 'ui.about.title', 'Hakkımızda', 'Hakkımızda', 'ui', false, 'about'),
('tr', 'ui.about.subtitle', '1972''den bu yana aydınlatma sektöründe öncü, kaliteli ürünler ve yenilikçi çözümlerle büyüyen bir marka', '1972''den bu yana aydınlatma sektöründe öncü, kaliteli ürünler ve yenilikçi çözümlerle büyüyen bir marka', 'ui', false, 'about'),
('tr', 'ui.about.years_experience', '53 Yıllık Güven ve Deneyim', '53 Yıllık Güven ve Deneyim', 'ui', false, 'about'),
('tr', 'ui.about.our_story', 'Hikayemiz', 'Hikayemiz', 'ui', false, 'about'),
('tr', 'ui.about.factory_title', 'IŞILDAR Fabrika', 'IŞILDAR Fabrika', 'ui', false, 'about'),
('tr', 'ui.about.factory_subtitle', 'Modern Üretim Tesisi', 'Modern Üretim Tesisi', 'ui', false, 'about'),
('tr', 'ui.about.factory_description', '16.000 m² kapalı alanda son teknoloji ile üretim', '16.000 m² kapalı alanda son teknoloji ile üretim', 'ui', false, 'about'),
('tr', 'ui.about.history', 'Tarihçemiz', 'Tarihçemiz', 'ui', false, 'about'),
('tr', 'ui.about.history_description', '53 yıllık yolculuğumuzun önemli dönüm noktaları', '53 yıllık yolculuğumuzun önemli dönüm noktaları', 'ui', false, 'about'),
('tr', 'ui.about.values', 'Değerlerimiz', 'Değerlerimiz', 'ui', false, 'about'),
('tr', 'ui.about.values_description', 'Bizi yönlendiren ilkeler ve hedefler', 'Bizi yönlendiren ilkeler ve hedefler', 'ui', false, 'about'),
('tr', 'ui.about.certificates', 'Sertifikalarımız', 'Sertifikalarımız', 'ui', false, 'about'),
('tr', 'ui.about.certificates_description', 'Kalite ve güvenilirliğimizin kanıtı', 'Kalite ve güvenilirliğimizin kanıtı', 'ui', false, 'about'),
('tr', 'ui.about.team', 'Ekibimiz', 'Ekibimiz', 'ui', false, 'about'),
('tr', 'ui.about.team_description', 'Deneyimli ve uzman kadromuzla hizmetinizdeyiz', 'Deneyimli ve uzman kadromuzla hizmetinizdeyiz', 'ui', false, 'about')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text;

-- ============================================================================
-- CONTACT PAGE TRANSLATIONS
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, source_text, translation_type, auto_translated, context) VALUES
('tr', 'ui.contact.title', 'İletişim', 'İletişim', 'ui', false, 'contact'),
('tr', 'ui.contact.subtitle', 'Bizimle iletişime geçin', 'Bizimle iletişime geçin', 'ui', false, 'contact'),
('tr', 'ui.contact.form_title', 'Mesaj Gönderin', 'Mesaj Gönderin', 'ui', false, 'contact'),
('tr', 'ui.contact.name', 'Ad Soyad', 'Ad Soyad', 'ui', false, 'contact'),
('tr', 'ui.contact.email', 'E-posta', 'E-posta', 'ui', false, 'contact'),
('tr', 'ui.contact.phone', 'Telefon', 'Telefon', 'ui', false, 'contact'),
('tr', 'ui.contact.company', 'Şirket', 'Şirket', 'ui', false, 'contact'),
('tr', 'ui.contact.subject', 'Konu', 'Konu', 'ui', false, 'contact'),
('tr', 'ui.contact.message', 'Mesajınız', 'Mesajınız', 'ui', false, 'contact'),
('tr', 'ui.contact.send', 'Gönder', 'Gönder', 'ui', false, 'contact'),
('tr', 'ui.contact.sending', 'Gönderiliyor...', 'Gönderiliyor...', 'ui', false, 'contact'),
('tr', 'ui.contact.success', 'Mesajınız başarıyla gönderildi!', 'Mesajınız başarıyla gönderildi!', 'ui', false, 'contact'),
('tr', 'ui.contact.error', 'Mesaj gönderilirken hata oluştu', 'Mesaj gönderilirken hata oluştu', 'ui', false, 'contact'),
('tr', 'ui.contact.address', 'Adres', 'Adres', 'ui', false, 'contact'),
('tr', 'ui.contact.working_hours', 'Çalışma Saatleri', 'Çalışma Saatleri', 'ui', false, 'contact'),
('tr', 'ui.contact.info_title', 'İletişim Bilgileri', 'İletişim Bilgileri', 'ui', false, 'contact')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text;

-- ============================================================================
-- QUOTE PAGE TRANSLATIONS
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, source_text, translation_type, auto_translated, context) VALUES
('tr', 'ui.quote.title', 'Teklif İsteyin', 'Teklif İsteyin', 'ui', false, 'quote'),
('tr', 'ui.quote.subtitle', 'Ürünlerimiz hakkında detaylı teklif alın', 'Ürünlerimiz hakkında detaylı teklif alın', 'ui', false, 'quote'),
('tr', 'ui.quote.personal_info', 'Kişisel Bilgiler', 'Kişisel Bilgiler', 'ui', false, 'quote'),
('tr', 'ui.quote.contact_info', 'İletişim Bilgileri', 'İletişim Bilgileri', 'ui', false, 'quote'),
('tr', 'ui.quote.product_selection', 'Ürün Seçimi', 'Ürün Seçimi', 'ui', false, 'quote'),
('tr', 'ui.quote.add_product', 'Ürün Ekle', 'Ürün Ekle', 'ui', false, 'quote'),
('tr', 'ui.quote.category', 'Kategori', 'Kategori', 'ui', false, 'quote'),
('tr', 'ui.quote.product', 'Ürün', 'Ürün', 'ui', false, 'quote'),
('tr', 'ui.quote.quantity', 'Miktar', 'Miktar', 'ui', false, 'quote'),
('tr', 'ui.quote.notes', 'Notlar', 'Notlar', 'ui', false, 'quote'),
('tr', 'ui.quote.remove', 'Kaldır', 'Kaldır', 'ui', false, 'quote'),
('tr', 'ui.quote.submit', 'Teklif İste', 'Teklif İste', 'ui', false, 'quote'),
('tr', 'ui.quote.submitting', 'Gönderiliyor...', 'Gönderiliyor...', 'ui', false, 'quote'),
('tr', 'ui.quote.success', 'Teklif talebiniz alındı!', 'Teklif talebiniz alındı!', 'ui', false, 'quote'),
('tr', 'ui.quote.error', 'Teklif gönderilirken hata oluştu', 'Teklif gönderilirken hata oluştu', 'ui', false, 'quote'),
('tr', 'ui.quote.select_category', 'Kategori seçin', 'Kategori seçin', 'ui', false, 'quote'),
('tr', 'ui.quote.select_product', 'Ürün seçin', 'Ürün seçin', 'ui', false, 'quote'),
('tr', 'ui.quote.search_product', 'Ürün ara...', 'Ürün ara...', 'ui', false, 'quote')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text;

-- ============================================================================
-- COMMON UI TRANSLATIONS
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, source_text, translation_type, auto_translated, context) VALUES
('tr', 'ui.common.home', 'Ana Sayfa', 'Ana Sayfa', 'ui', false, 'common'),
('tr', 'ui.common.products', 'Ürünler', 'Ürünler', 'ui', false, 'common'),
('tr', 'ui.common.about', 'Hakkımızda', 'Hakkımızda', 'ui', false, 'common'),
('tr', 'ui.common.contact', 'İletişim', 'İletişim', 'ui', false, 'common'),
('tr', 'ui.common.quote', 'Teklif Al', 'Teklif Al', 'ui', false, 'common'),
('tr', 'ui.common.news', 'Haberler', 'Haberler', 'ui', false, 'common'),
('tr', 'ui.common.projects', 'Projelerimiz', 'Projelerimiz', 'ui', false, 'common'),
('tr', 'ui.common.references', 'Referanslarımız', 'Referanslarımız', 'ui', false, 'common'),
('tr', 'ui.common.search', 'Ara', 'Ara', 'ui', false, 'common'),
('tr', 'ui.common.filter', 'Filtrele', 'Filtrele', 'ui', false, 'common'),
('tr', 'ui.common.sort', 'Sırala', 'Sırala', 'ui', false, 'common'),
('tr', 'ui.common.view_more', 'Daha Fazla', 'Daha Fazla', 'ui', false, 'common'),
('tr', 'ui.common.view_details', 'Detayları Gör', 'Detayları Gör', 'ui', false, 'common'),
('tr', 'ui.common.back', 'Geri', 'Geri', 'ui', false, 'common'),
('tr', 'ui.common.close', 'Kapat', 'Kapat', 'ui', false, 'common'),
('tr', 'ui.common.save', 'Kaydet', 'Kaydet', 'ui', false, 'common'),
('tr', 'ui.common.cancel', 'İptal', 'İptal', 'ui', false, 'common'),
('tr', 'ui.common.loading', 'Yükleniyor...', 'Yükleniyor...', 'ui', false, 'common'),
('tr', 'ui.common.no_results', 'Sonuç bulunamadı', 'Sonuç bulunamadı', 'ui', false, 'common'),
('tr', 'ui.common.error', 'Hata oluştu', 'Hata oluştu', 'ui', false, 'common')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text;
