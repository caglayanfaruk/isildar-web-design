/*
  # Ürün detay sayfası için eksik tabloları tamamla

  1. Yeni Tablolar
    - `product_translations` - Ürün çevirileri için ayrı tablo
    - `category_translations` - Kategori çevirileri için ayrı tablo
    - `product_specifications` - Detaylı teknik özellikler
    - `product_features` - Ürün özellikleri listesi
    - `product_applications` - Kullanım alanları
    - `product_certifications` - Sertifikalar ve belgeler

  2. Mevcut Tabloları Güncelle
    - `products` tablosuna eksik alanlar ekle
    - `product_variants` tablosunu güçlendir
    - `product_documents` tablosunu iyileştir

  3. Güvenlik
    - Tüm tablolar için RLS etkin
    - Public okuma izinleri
*/

-- Product translations table
CREATE TABLE IF NOT EXISTS product_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  language_code varchar(5) NOT NULL,
  name text NOT NULL,
  short_description text,
  long_description text,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, language_code)
);

ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product translations"
  ON product_translations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage product translations"
  ON product_translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Category translations table
CREATE TABLE IF NOT EXISTS category_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  language_code varchar(5) NOT NULL,
  name text NOT NULL,
  description text,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, language_code)
);

ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read category translations"
  ON category_translations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage category translations"
  ON category_translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Product specifications table
CREATE TABLE IF NOT EXISTS product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  spec_key varchar(100) NOT NULL,
  spec_value text NOT NULL,
  spec_unit varchar(20),
  display_order integer DEFAULT 0,
  is_highlighted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, spec_key)
);

ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product specifications"
  ON product_specifications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage product specifications"
  ON product_specifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Product features table
CREATE TABLE IF NOT EXISTS product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  language_code varchar(5) DEFAULT 'tr',
  feature_text text NOT NULL,
  icon varchar(50),
  display_order integer DEFAULT 0,
  is_highlighted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product features"
  ON product_features
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage product features"
  ON product_features
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Product applications table
CREATE TABLE IF NOT EXISTS product_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  language_code varchar(5) DEFAULT 'tr',
  application_text text NOT NULL,
  icon varchar(50),
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product applications"
  ON product_applications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage product applications"
  ON product_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Product certifications table
CREATE TABLE IF NOT EXISTS product_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  certification_name varchar(100) NOT NULL,
  certification_code varchar(50),
  issuing_authority varchar(100),
  issue_date date,
  expiry_date date,
  certificate_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product certifications"
  ON product_certifications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage product certifications"
  ON product_certifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add missing columns to products table
DO $$
BEGIN
  -- Add brand column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE products ADD COLUMN brand varchar(100);
  END IF;

  -- Add model column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'model'
  ) THEN
    ALTER TABLE products ADD COLUMN model varchar(100);
  END IF;

  -- Add warranty_period column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'warranty_period'
  ) THEN
    ALTER TABLE products ADD COLUMN warranty_period integer DEFAULT 24;
  END IF;

  -- Add min_order_quantity column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'min_order_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN min_order_quantity integer DEFAULT 1;
  END IF;

  -- Add lead_time_days column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'lead_time_days'
  ) THEN
    ALTER TABLE products ADD COLUMN lead_time_days integer DEFAULT 0;
  END IF;

  -- Add is_customizable column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_customizable'
  ) THEN
    ALTER TABLE products ADD COLUMN is_customizable boolean DEFAULT false;
  END IF;

  -- Add energy_class column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'energy_class'
  ) THEN
    ALTER TABLE products ADD COLUMN energy_class varchar(10);
  END IF;

  -- Add certifications column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE products ADD COLUMN certifications jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add technical_specs column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'technical_specs'
  ) THEN
    ALTER TABLE products ADD COLUMN technical_specs jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add installation_notes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'installation_notes'
  ) THEN
    ALTER TABLE products ADD COLUMN installation_notes text;
  END IF;

  -- Add maintenance_notes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'maintenance_notes'
  ) THEN
    ALTER TABLE products ADD COLUMN maintenance_notes text;
  END IF;
END $$;

-- Insert sample product translations
INSERT INTO product_translations (product_id, language_code, name, short_description, long_description) 
SELECT 
  p.id,
  'tr',
  CASE 
    WHEN p.sku = '2210' THEN '110x110x70 Buat (8 çıkışlı contali)'
    WHEN p.sku = '2211' THEN '110x180x70 Buat (10 çıkışlı contali)'
    WHEN p.sku = '2212' THEN '180x270x100 Buat (14 çıkışlı contali)'
    WHEN p.sku = '2223' THEN '180x270x100 Şeffaf Kapak (14 çıkışlı contali)'
    WHEN p.sku = '2213' THEN 'Ø 90 Yuvarlak Buat'
    WHEN p.sku = 'LED-001' THEN 'LED Panel 60x60 40W'
    WHEN p.sku = 'LED-002' THEN 'LED Panel 30x30 20W'
    WHEN p.sku = 'AP-001' THEN 'Tekli Anahtar Premium'
    WHEN p.sku = 'AP-002' THEN 'İkili Dimmer Anahtar'
    WHEN p.sku = 'BT-001' THEN 'Endüstriyel LED Bant Armatür 36W'
    WHEN p.sku = 'BT-002' THEN 'Ofis LED Bant Armatür 18W'
    WHEN p.sku = 'BA-001' THEN 'Bahçe Direği LED 12W'
    WHEN p.sku = 'BA-002' THEN 'Zemin Spot LED 6W'
    WHEN p.sku = 'DA-001' THEN 'Modern Duvar Aplik LED 8W'
    ELSE p.sku
  END,
  CASE 
    WHEN p.sku = '2210' THEN 'Kompakt boyutlarda 8 çıkışlı buat conta'
    WHEN p.sku = '2211' THEN 'Orta boyutlarda 10 çıkışlı buat conta'
    WHEN p.sku = '2212' THEN 'Büyük boyutlarda 14 çıkışlı buat conta'
    WHEN p.sku = '2223' THEN 'Şeffaf kapaklı 14 çıkışlı buat conta'
    WHEN p.sku = '2213' THEN 'Yuvarlak tasarımlı özel buat conta'
    WHEN p.sku = 'LED-001' THEN 'Yüksek kaliteli LED panel 60x60'
    WHEN p.sku = 'LED-002' THEN 'Kompakt LED panel 30x30'
    WHEN p.sku = 'AP-001' THEN 'Premium kaliteli tekli anahtar'
    WHEN p.sku = 'AP-002' THEN 'Dimmer özellikli ikili anahtar'
    WHEN p.sku = 'BT-001' THEN 'Endüstriyel kullanım için LED bant armatür'
    WHEN p.sku = 'BT-002' THEN 'Ofis kullanımı için kompakt LED bant'
    WHEN p.sku = 'BA-001' THEN 'Su geçirmez bahçe direği'
    WHEN p.sku = 'BA-002' THEN 'Paslanmaz çelik zemin spot'
    WHEN p.sku = 'DA-001' THEN 'Modern tasarımlı duvar aplik'
    ELSE 'Kaliteli aydınlatma ürünü'
  END,
  CASE 
    WHEN p.sku = '2210' THEN 'IŞILDAR 2210 model buat conta, 8 çıkışlı tasarımı ile küçük ve orta ölçekli projelerde ideal kullanım sağlar. Yüksek kaliteli ABS plastik malzemeden üretilmiş olup, IP44 koruma sınıfına sahiptir. Kolay montaj imkanı ve uzun ömürlü kullanım için tasarlanmıştır.'
    WHEN p.sku = '2211' THEN 'IŞILDAR 2211 model buat conta, 10 çıkışlı genişletilmiş tasarımı ile daha fazla bağlantı noktası gereken projeler için geliştirilmiştir. Dayanıklı yapısı ve kaliteli malzemesi ile uzun yıllar güvenle kullanılabilir.'
    WHEN p.sku = '2212' THEN 'IŞILDAR 2212 model buat conta, 14 çıkışlı büyük kapasiteli tasarımı ile yoğun elektrik bağlantısı gereken büyük projeler için ideal çözümdür. Endüstriyel kullanım için özel olarak tasarlanmıştır.'
    WHEN p.sku = '2223' THEN 'IŞILDAR 2223 model şeffaf kapaklı buat conta, 14 çıkışlı tasarımı ile modern estetik sunar. İçeriği görülebilir şeffaf kapağı sayesinde prestijli projelerde tercih edilir.'
    WHEN p.sku = '2213' THEN 'IŞILDAR 2213 model yuvarlak buat conta, farklı estetik tercihler için özel tasarlanmış alternatif çözümdür. Kompakt boyutu ve estetik görünümü ile dekoratif projelerde kullanılır.'
    WHEN p.sku = 'LED-001' THEN 'IŞILDAR LED Panel 60x60, 40W güç tüketimi ile yüksek verimlilik sağlar. Ofis ve ticari alanlar için ideal olan bu panel, homojen ışık dağılımı ve uzun ömür sunar. A++ enerji sınıfı ile enerji tasarrufu sağlar.'
    WHEN p.sku = 'LED-002' THEN 'IŞILDAR LED Panel 30x30, 20W güç tüketimi ile kompakt alanlar için ideal çözümdür. Sıcak beyaz ışığı ile rahat ve konforlu aydınlatma sağlar. Ev ve küçük ofisler için mükemmel seçimdir.'
    WHEN p.sku = 'AP-001' THEN 'IŞILDAR Premium Tekli Anahtar, yüksek kaliteli ABS plastikten üretilmiştir. Modern tasarımı ve uzun ömürlü kullanımı ile ev ve ofis uygulamaları için ideal seçimdir. CE sertifikalı güvenilir üründür.'
    WHEN p.sku = 'AP-002' THEN 'IŞILDAR İkili Dimmer Anahtar, ışık şiddeti ayarlama özelliği ile enerji tasarrufu sağlar. Modern tasarımı ve kullanım kolaylığı ile konforlu aydınlatma kontrolü sunar.'
    WHEN p.sku = 'BT-001' THEN 'IŞILDAR Endüstriyel LED Bant Armatür, 36W yüksek güç ile geniş alanları etkili şekilde aydınlatır. IP65 koruma sınıfı ile su geçirmez özelliğe sahiptir. Fabrika ve depo alanları için ideal çözümdür.'
    WHEN p.sku = 'BT-002' THEN 'IŞILDAR Ofis LED Bant Armatür, 18W kompakt güç ile ofis ve ticari alanlar için tasarlanmıştır. Enerji tasarruflu ve modern tasarımı ile çalışma alanlarında konforlu aydınlatma sağlar.'
    WHEN p.sku = 'BA-001' THEN 'IŞILDAR Bahçe Direği, 12W LED teknolojisi ile dış mekan aydınlatması sağlar. Su geçirmez IP65 koruma sınıfı ile her türlü hava koşuluna dayanıklıdır. Bahçe ve park alanları için ideal seçimdir.'
    WHEN p.sku = 'BA-002' THEN 'IŞILDAR Zemin Spot, 6W LED güç ile bahçe yolu ve peyzaj aydınlatması sağlar. Paslanmaz çelik gövdesi ile uzun ömürlü kullanım sunar. Dekoratif aydınlatma uygulamaları için mükemmeldir.'
    WHEN p.sku = 'DA-001' THEN 'IŞILDAR Modern Duvar Aplik, 8W LED güç ile yukarı-aşağı ışık dağılımı sağlar. Ayarlanabilir açısı ile vurgu aydınlatma imkanı sunar. Modern tasarımı ile dekoratif aydınlatma çözümü sağlar.'
    ELSE 'IŞILDAR kalitesi ile üretilmiş güvenilir aydınlatma ürünü.'
  END
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_translations pt 
  WHERE pt.product_id = p.id AND pt.language_code = 'tr'
);

-- Insert category translations
INSERT INTO category_translations (category_id, language_code, name, description)
SELECT 
  c.id,
  'tr',
  CASE 
    WHEN c.slug = 'anahtar-priz-grubu' THEN 'Anahtar Priz Grubu'
    WHEN c.slug = 'bant-tipi-armaturler' THEN 'Bant Tipi Armatürler'
    WHEN c.slug = 'led-urunler' THEN 'LED''li Ürünler'
    WHEN c.slug = 'dekoratif-led-panel' THEN 'Dekoratif LED Panel'
    WHEN c.slug = 'tavan-glop-armaturleri' THEN 'Tavan Glop Armatürleri'
    WHEN c.slug = 'duvar-aplikleri' THEN 'Duvar Aplikleri'
    WHEN c.slug = 'sarkit-armaturleri' THEN 'Sarkıt Armatürleri'
    WHEN c.slug = 'bahce-armaturleri' THEN 'Bahçe Armatürleri'
    WHEN c.slug = 'sensorlu-tavan' THEN 'Sensörlü Tavan'
    WHEN c.slug = 'sensorlu-duvar' THEN 'Sensörlü Duvar'
    WHEN c.slug = 'panolar-sigorta' THEN 'Panolar-Sigorta Kutuları ve Plastik Elektrik Malzemeleri'
    ELSE c.slug
  END,
  CASE 
    WHEN c.slug = 'anahtar-priz-grubu' THEN 'Kaliteli anahtar ve priz çeşitleri'
    WHEN c.slug = 'bant-tipi-armaturler' THEN 'Endüstriyel ve yüksek tavan aydınlatma çözümleri'
    WHEN c.slug = 'led-urunler' THEN 'Enerji tasarruflu LED aydınlatma ürünleri'
    WHEN c.slug = 'dekoratif-led-panel' THEN 'Modern ve şık LED panel çerçeve çözümleri'
    WHEN c.slug = 'tavan-glop-armaturleri' THEN 'Tavan montajlı glop armatür çeşitleri'
    WHEN c.slug = 'duvar-aplikleri' THEN 'Duvar montajlı aydınlatma armatürleri'
    WHEN c.slug = 'sarkit-armaturleri' THEN 'Asma tip sarkıt aydınlatma armatürleri'
    WHEN c.slug = 'bahce-armaturleri' THEN 'Dış mekan ve bahçe aydınlatma ürünleri'
    WHEN c.slug = 'sensorlu-tavan' THEN 'Hareket sensörlü tavan aydınlatma sistemleri'
    WHEN c.slug = 'sensorlu-duvar' THEN 'Sensörlü duvar aplikleri ve acil çıkış yönlendirme'
    WHEN c.slug = 'panolar-sigorta' THEN 'Elektrik panoları ve plastik elektrik malzemeleri'
    ELSE c.description
  END
FROM categories c
WHERE NOT EXISTS (
  SELECT 1 FROM category_translations ct 
  WHERE ct.category_id = c.id AND ct.language_code = 'tr'
);

-- Insert product specifications
INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_unit, display_order, is_highlighted)
SELECT 
  p.id,
  spec.key,
  spec.value,
  spec.unit,
  spec.order_num,
  spec.highlighted
FROM products p
CROSS JOIN (
  VALUES 
    ('material', 'ABS Plastik', '', 1, true),
    ('voltage', '250V', 'AC', 2, true),
    ('protection', 'IP44', '', 3, true),
    ('temperature_range', '-20°C / +60°C', '', 4, false),
    ('certification', 'CE, TSE, ROHS', '', 5, true),
    ('warranty', '24', 'ay', 6, false)
) AS spec(key, value, unit, order_num, highlighted)
WHERE NOT EXISTS (
  SELECT 1 FROM product_specifications ps 
  WHERE ps.product_id = p.id AND ps.spec_key = spec.key
);

-- Insert product features
INSERT INTO product_features (product_id, language_code, feature_text, icon, display_order, is_highlighted)
SELECT 
  p.id,
  'tr',
  feature.text,
  feature.icon,
  feature.order_num,
  feature.highlighted
FROM products p
CROSS JOIN (
  VALUES 
    ('Yüksek kaliteli plastik malzeme', 'shield', 1, true),
    ('Kolay montaj sistemi', 'wrench', 2, true),
    ('Uzun ömürlü kullanım', 'clock', 3, false),
    ('CE ve TSE sertifikalı', 'award', 4, true),
    ('Çevre dostu üretim', 'leaf', 5, false),
    ('IP44 koruma sınıfı', 'shield-check', 6, true)
) AS feature(text, icon, order_num, highlighted)
WHERE NOT EXISTS (
  SELECT 1 FROM product_features pf 
  WHERE pf.product_id = p.id AND pf.feature_text = feature.text
);

-- Insert product applications
INSERT INTO product_applications (product_id, language_code, application_text, icon, display_order)
SELECT 
  p.id,
  'tr',
  app.text,
  app.icon,
  app.order_num
FROM products p
CROSS JOIN (
  VALUES 
    ('Endüstriyel tesisler', 'factory', 1),
    ('Ticari binalar', 'building', 2),
    ('Konut projeleri', 'home', 3),
    ('Ofis binaları', 'briefcase', 4),
    ('Alışveriş merkezleri', 'shopping-bag', 5),
    ('Fabrika tesisatları', 'cog', 6)
) AS app(text, icon, order_num)
WHERE NOT EXISTS (
  SELECT 1 FROM product_applications pa 
  WHERE pa.product_id = p.id AND pa.application_text = app.text
);

-- Insert product certifications
INSERT INTO product_certifications (product_id, certification_name, certification_code, issuing_authority, display_order, is_active)
SELECT 
  p.id,
  cert.name,
  cert.code,
  cert.authority,
  cert.order_num,
  true
FROM products p
CROSS JOIN (
  VALUES 
    ('CE Uygunluk Belgesi', 'CE', 'Avrupa Birliği', 1),
    ('TSE Belgesi', 'TSE', 'Türk Standartları Enstitüsü', 2),
    ('ROHS Uygunluk', 'ROHS', 'Avrupa Birliği', 3),
    ('ISO 9001 Kalite', 'ISO9001', 'ISO', 4)
) AS cert(name, code, authority, order_num)
WHERE NOT EXISTS (
  SELECT 1 FROM product_certifications pc 
  WHERE pc.product_id = p.id AND pc.certification_code = cert.code
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_translations_product_lang ON product_translations(product_id, language_code);
CREATE INDEX IF NOT EXISTS idx_category_translations_category_lang ON category_translations(category_id, language_code);
CREATE INDEX IF NOT EXISTS idx_product_specifications_product ON product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_product ON product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_product_applications_product ON product_applications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_certifications_product ON product_certifications(product_id);