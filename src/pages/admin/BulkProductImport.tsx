import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { saveAndTranslate } from '../../services/unifiedTranslationService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface ImportRow {
  row: number;
  data: any;
  status: 'pending' | 'success' | 'error';
  message?: string;
  productId?: string;
}

const BulkProductImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState<ImportRow[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      {
        // Temel Bilgiler (Sadece Türkçe - Diğer diller otomatik çevrilecek)
        'SKU (*)': 'PROD-001',
        'Ürün Adı (*)': 'Örnek LED Panel 60x60',
        'Kısa Açıklama': 'Yüksek verimli sıva altı LED panel',
        'Detaylı Açıklama': 'Bu ürün ofisler, okullar ve hastaneler için ideal aydınlatma çözümüdür.',

        // Kategori ve Durum
        'Kategori': 'LED Aydınlatma',
        'Ürün Türü': 'simple',
        'Durum': 'active',
        'Öne Çıkan': 'Hayır',
        'Marka': 'IŞILDAR',
        'Model': 'LED-2210',

        // Attribute'lar (Otomatik tanımlanır ve filtrelerde kullanılır)
        'Duy Tipi': 'E27',
        'IP Sınıfı': 'IP44',
        'Renk': 'Beyaz',
        'Güç': '40W',
        'Voltaj': '220V',
        'Işık Rengi': 'Gün Işığı',
        'Beam Açısı': '120°',
        'CRI': '>80',
        'Lümen': '3200',

        // Teknik Özellikler (Detaylı spesifikasyonlar)
        'Spesifikasyonlar': 'Çalışma Sıcaklığı:-20°C / +40°C;Frekans:50-60Hz',
        'Özellikler': 'Enerji tasarruflu;Uzun ömürlü;Çevre dostu',
        'Kullanım Alanları': 'Ev;Ofis;Mağaza',
        'Sertifikalar': 'CE:CE Sertifikası;TSE:TSE Belgesi',

        // Lojistik
        'Boyutlar': '110x110x70 mm',
        'Ağırlık (kg)': '0.5',
        'Kolı Hacım (m³)': '0.002',
        'Shrink Hacım': '0.001',
        'Shrink Ölçüsü': 'cm',
        'Kutu Adedi': '10',
        'Kolı Adedi': '100',
        'Paket Adedi': '50',
        'Paket Ağırlığı (kg)': '25',

        // Diğer
        'Garanti Süresi (ay)': '24',
        'Min. Sipariş Miktarı': '10',
        'Teslim Süresi (gün)': '7',
        'Özelleştirilebilir': 'Evet',
        'Enerji Sınıfı': 'A++',

        // SEO
        'Meta Başlık': 'Örnek Ürün - IŞILDAR',
        'Meta Açıklama': 'Örnek ürün açıklaması',

        // Görseller (media ID'leri veya dosya adları, virgülle ayrılmış)
        'Görseller': 'image1.jpg,image2.jpg,image3.jpg',
        'Ana Görsel': 'image1.jpg',

        // Varyantlar (varsa) - Alan adları otomatik oluşturulur/eşleştirilir
        'Varyant': 'Hayır',
        'Varyant SKU': '',
        'Varyant Özellikler': 'Renk:Beyaz;Güç:40W',
        'Varyant Barkod': '8690000000000',
        'Varyant Fiyat': '150',
        // Özel Varyant Alanları (Otomatik oluşturulur)
        'Koli İçi Adet': '10',
        'Koli Ağırlığı': '5.5',
        'Koli Hacmi': '0.05',
        'Shrink İçi Adet': '50',
        'Palet Adedi': '200',

        // Dökümanlar
        'Doküman Adları': 'Kullanım Kılavuzu;Teknik Şartname',
        'Doküman Tipleri': 'manual;datasheet',
        'Doküman Dosyaları': 'manual.pdf;datasheet.pdf'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');

    // Kolon genişliklerini ayarla
    const colWidths = Object.keys(template[0]).map(key => ({
      wch: Math.max(key.length, 20)
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'urun-import-sablonu.xlsx');
    toast.success('Şablon indirildi');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Lütfen Excel dosyası (.xlsx veya .xls) seçin');
        return;
      }
      setFile(selectedFile);
      setResults([]);
      setShowResults(false);
    }
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const parseValue = (value: any, defaultValue: any = null): any => {
    if (value === undefined || value === null || value === '') return defaultValue;
    return value;
  };

  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    return str === 'evet' || str === 'yes' || str === 'true' || str === '1';
  };

  const parseNumber = (value: any, defaultValue: number | null = null): number | null => {
    if (value === undefined || value === null || value === '') return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  const parseListItems = (value: any): string[] => {
    if (!value) return [];
    const str = String(value);
    // Hem virgül hem noktalı virgül desteği
    const separator = str.includes(';') ? ';' : ',';
    return str.split(separator).map(s => s.trim()).filter(s => s);
  };

  const parseKeyValuePairs = (value: any): Record<string, string> => {
    if (!value) return {};
    const result: Record<string, string> = {};
    const pairs = String(value).split(';').map(s => s.trim()).filter(s => s);
    pairs.forEach(pair => {
      const [key, val] = pair.split(':').map(s => s.trim());
      if (key && val) {
        result[key] = val;
      }
    });
    return result;
  };

  const findOrCreateMedia = async (filename: string): Promise<string | null> => {
    if (!filename) return null;

    try {
      // Önce media'da dosya adına göre ara
      const { data, error } = await supabase
        .from('media')
        .select('id')
        .or(`filename.eq.${filename},original_name.eq.${filename}`)
        .maybeSingle();

      if (error) {
        console.error('Media lookup error:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error finding media:', error);
      return null;
    }
  };

  const findOrCreateAttribute = async (
    attributeName: string,
    attributeValue: string
  ): Promise<{ attributeId: string; valueId: string } | null> => {
    if (!attributeName || !attributeValue) return null;

    try {
      const trimmedName = attributeName.trim();
      const trimmedValue = attributeValue.trim();

      // Attribute key oluştur
      const attrKey = trimmedName
        .toLowerCase()
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      // Attribute'u bul veya oluştur
      let { data: attribute } = await supabase
        .from('product_attributes')
        .select('id')
        .eq('slug', attrKey)
        .maybeSingle();

      if (!attribute) {
        // Varyant attribute'ları belirle (Güç, Renk, Işık Rengi, Duy Tipi gibi)
        const variantAttributeNames = ['güç', 'renk', 'isik_rengi', 'işık_rengi', 'duy_tipi', 'beden', 'boyut', 'cesit', 'çeşit', 'model', 'tip'];
        const isVariantAttr = variantAttributeNames.some(name => attrKey.includes(name));

        // Yeni attribute oluştur
        const { data: newAttr, error: attrError } = await supabase
          .from('product_attributes')
          .insert({
            slug: attrKey,
            name: trimmedName,
            type: 'select',
            scope: isVariantAttr ? 'variant' : 'product',
            is_filterable: true,
            is_active: true,
            sort_order: 0
          })
          .select('id')
          .single();

        if (attrError || !newAttr) {
          console.error('Attribute creation error:', attrError);
          return null;
        }

        attribute = newAttr;
        console.log(`✅ Yeni attribute oluşturuldu: ${trimmedName} (${attrKey})`);
      }

      // Attribute değerini bul veya oluştur
      let { data: attrValue } = await supabase
        .from('product_attribute_values')
        .select('id')
        .eq('attribute_id', attribute.id)
        .eq('value', trimmedValue)
        .maybeSingle();

      if (!attrValue) {
        // Yeni değer oluştur
        const { data: newValue, error: valueError } = await supabase
          .from('product_attribute_values')
          .insert({
            attribute_id: attribute.id,
            value: trimmedValue,
            sort_order: 0
          })
          .select('id')
          .single();

        if (valueError || !newValue) {
          console.error('Attribute value creation error:', valueError);
          return null;
        }

        attrValue = newValue;
        console.log(`✅ Yeni attribute değeri: ${trimmedName} = ${trimmedValue}`);
      }

      return {
        attributeId: attribute.id,
        valueId: attrValue.id
      };
    } catch (error) {
      console.error('Error in findOrCreateAttribute:', error);
      return null;
    }
  };

  const findOrCreateVariantField = async (
    categoryId: string,
    fieldName: string,
    fieldType: string = 'text'
  ): Promise<string | null> => {
    if (!categoryId || !fieldName) return null;

    try {
      const trimmedName = fieldName.trim();

      // Field key oluştur (URL-safe)
      const fieldKey = trimmedName
        .toLowerCase()
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      // Kategorinin mevcut variant_fields'larını al
      const { data: category } = await supabase
        .from('categories')
        .select('variant_fields')
        .eq('id', categoryId)
        .single();

      const variantFields = category?.variant_fields?.fields || [];

      // Alan zaten var mı kontrol et
      const existingField = variantFields.find(
        (f: any) => f.field_key === fieldKey || f.field_label === trimmedName
      );

      if (existingField) {
        return existingField.field_key;
      }

      // Yeni alan ekle
      const newField = {
        field_key: fieldKey,
        field_label: trimmedName,
        field_type: fieldType,
        is_required: false,
        default_value: '',
        options: [],
        sort_order: variantFields.length
      };

      const updatedFields = [...variantFields, newField];

      // Kategoriyi güncelle
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          variant_fields: { fields: updatedFields }
        })
        .eq('id', categoryId);

      if (updateError) {
        console.error('Variant field update error:', updateError);
        return null;
      }

      console.log(`✅ Yeni varyant alanı oluşturuldu: ${trimmedName} (${fieldKey})`);
      return fieldKey;
    } catch (error) {
      console.error('Error in findOrCreateVariantField:', error);
      return null;
    }
  };

  const findOrCreateCategory = async (categoryName: string): Promise<string | null> => {
    if (!categoryName) return null;

    try {
      const trimmedName = categoryName.trim();

      // Slug oluştur
      const slug = trimmedName
        .toLowerCase()
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Önce slug ile ara
      let { data, error } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Category lookup error:', error);
        return null;
      }

      if (data) {
        return data.id;
      }

      // Kategori yoksa, çevirileri kontrol et
      const { data: translations } = await supabase
        .from('translations')
        .select('translation_key')
        .eq('language_code', 'tr')
        .like('translation_key', 'category.%.name')
        .ilike('translation_value', trimmedName);

      if (translations && translations.length > 0) {
        // translation_key'den category slug'ı çıkar: category.{slug}.name
        const existingSlug = translations[0].translation_key.split('.')[1];

        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', existingSlug)
          .maybeSingle();

        if (existingCategory) {
          return existingCategory.id;
        }
      }

      // Kategori bulunamadı, yeni oluştur
      const { data: newCategory, error: insertError } = await supabase
        .from('categories')
        .insert({
          slug,
          parent_id: null,
          is_active: true,
          sort_order: 0
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Category insert error:', insertError);
        return null;
      }

      // Kategori çevirisini kaydet (6 dilde)
      await saveAndTranslate(
        trimmedName,
        `category.${slug}.name`,
        'category',
        ['en', 'fr', 'de', 'ar', 'ru']
      );

      console.log(`✅ Yeni kategori oluşturuldu: ${trimmedName} (${slug})`);
      return newCategory.id;
    } catch (error) {
      console.error('Error in findOrCreateCategory:', error);
      return null;
    }
  };

  const importProduct = async (row: any, rowNumber: number): Promise<ImportRow> => {
    try {
      const sku = parseValue(row['SKU (*)']);
      if (!sku) {
        return {
          row: rowNumber,
          data: row,
          status: 'error',
          message: 'SKU zorunludur'
        };
      }

      // Yeni format: 'Ürün Adı (*)' - Sadece Türkçe
      const productName = parseValue(row['Ürün Adı (*)']) || parseValue(row['Ürün Adı']);
      if (!productName) {
        return {
          row: rowNumber,
          data: row,
          status: 'error',
          message: 'Ürün adı zorunludur'
        };
      }

      // Kategori bul veya oluştur
      const categoryName = parseValue(row['Kategori']) || parseValue(row['Kategori Adı']);
      let categoryId = null;
      if (categoryName) {
        categoryId = await findOrCreateCategory(categoryName);
        if (categoryId) {
          console.log(`✅ Kategori eşleştirildi: ${categoryName} (ID: ${categoryId})`);
        } else {
          console.warn(`⚠️ Kategori oluşturulamadı: ${categoryName}`);
        }
      }

      // Slug oluştur (ürün adından veya SKU'dan)
      const slugBase = productName || sku;
      const slug = slugBase
        .toLowerCase()
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ı/g, 'i')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Ürün verisini hazırla
      const productData = {
        sku: sku.trim(),
        slug,
        category_id: categoryId,
        product_type: parseValue(row['Ürün Türü'], 'simple'),
        status: parseValue(row['Durum'], 'active'),
        featured: parseBoolean(row['Öne Çıkan']),
        sort_order: 0,
        brand: parseValue(row['Marka']),
        model: parseValue(row['Model']),
        dimensions: parseValue(row['Boyutlar']),
        weight: parseNumber(row['Ağırlık (kg)']),
        shrink_volume: parseNumber(row['Shrink Hacım']),
        shrink_measurement: parseValue(row['Shrink Ölçüsü']),
        quantity_per_box: parseNumber(row['Kutu Adedi']),
        quantity_per_shrink: parseNumber(row['Kolı Adedi']),
        warranty_period: parseNumber(row['Garanti Süresi (ay)'], 24),
        min_order_quantity: parseNumber(row['Min. Sipariş Miktarı'], 1),
        lead_time_days: parseNumber(row['Teslim Süresi (gün)'], 0),
        is_customizable: parseBoolean(row['Özelleştirilebilir']),
        energy_class: parseValue(row['Enerji Sınıfı']),
        meta_title: parseValue(row['Meta Başlık']),
        meta_description: parseValue(row['Meta Açıklama'])
      };

      // Önce mevcut ürünü kontrol et
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .maybeSingle();

      let productId: string;

      if (existingProduct) {
        // Güncelle
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', existingProduct.id);

        if (updateError) throw updateError;
        productId = existingProduct.id;
      } else {
        // Yeni ekle
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert([productData])
          .select('id')
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      // Türkçe çevirileri kaydet ve otomatik olarak diğer dillere çevir
      const turkishShortDesc = parseValue(row['Kısa Açıklama']);
      const turkishLongDesc = parseValue(row['Detaylı Açıklama']);

      // Ürün adını kaydet ve çevir
      if (productName) {
        await saveAndTranslate(
          productName,
          `product.${productId}.name`,
          'product',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (turkishShortDesc) {
        await saveAndTranslate(
          turkishShortDesc,
          `product.${productId}.short_desc`,
          'product',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      if (turkishLongDesc) {
        await saveAndTranslate(
          turkishLongDesc,
          `product.${productId}.long_desc`,
          'product',
          ['en', 'fr', 'de', 'ar', 'ru']
        );
      }

      // Attribute'ları kaydet (hem basit hem varyantlı ürünler için)
      await supabase.from('product_attribute_assignments').delete().eq('product_id', productId);

      // Attribute kolonlarını otomatik algıla
      const commonAttributeFields = ['Duy Tipi', 'IP Sınıfı', 'Renk', 'Malzeme', 'Güç', 'Voltaj', 'Işık Rengi', 'Açı', 'Beam Açısı', 'CRI', 'Lümen'];
      const productAttributes = [];

      for (const fieldName of commonAttributeFields) {
        const fieldValue = parseValue(row[fieldName]);
        if (fieldValue) {
          const result = await findOrCreateAttribute(fieldName, String(fieldValue));
          if (result) {
            productAttributes.push({
              product_id: productId,
              attribute_id: result.attributeId,
              attribute_value_id: result.valueId
            });
          }
        }
      }

      // Excel'deki diğer attribute kolonlarını da kontrol et (Attribute: prefix ile)
      for (const key in row) {
        if (key.startsWith('Attribute:') || key.startsWith('Özellik:')) {
          const attrName = key.replace(/^(Attribute|Özellik):\s*/, '').trim();
          const attrValue = parseValue(row[key]);
          if (attrValue) {
            const result = await findOrCreateAttribute(attrName, String(attrValue));
            if (result) {
              productAttributes.push({
                product_id: productId,
                attribute_id: result.attributeId,
                attribute_value_id: result.valueId
              });
            }
          }
        }
      }

      if (productAttributes.length > 0) {
        await supabase.from('product_attribute_assignments').insert(productAttributes);
      }

      // Spesifikasyonları kaydet (teknik detaylar için)
      await supabase.from('product_specifications').delete().eq('product_id', productId);
      const specs = parseKeyValuePairs(row['Spesifikasyonlar']);
      const specInserts = Object.entries(specs).map(([key, value], index) => ({
        product_id: productId,
        spec_key: key,
        spec_value: value,
        display_order: index
      }));
      if (specInserts.length > 0) {
        await supabase.from('product_specifications').insert(specInserts);
      }

      // Özellikleri kaydet
      await supabase.from('product_features').delete().eq('product_id', productId);
      const features = parseListItems(row['Özellikler']);
      const featureInserts = features.map((feature, index) => ({
        product_id: productId,
        feature_text: feature,
        language_code: 'tr',
        display_order: index
      }));
      if (featureInserts.length > 0) {
        await supabase.from('product_features').insert(featureInserts);
      }

      // Kullanım alanlarını kaydet
      await supabase.from('product_applications').delete().eq('product_id', productId);
      const applications = parseListItems(row['Kullanım Alanları']);
      const appInserts = applications.map((app, index) => ({
        product_id: productId,
        application_text: app,
        language_code: 'tr',
        display_order: index
      }));
      if (appInserts.length > 0) {
        await supabase.from('product_applications').insert(appInserts);
      }

      // Sertifikaları kaydet
      await supabase.from('product_certifications').delete().eq('product_id', productId);
      const certifications = parseKeyValuePairs(row['Sertifikalar']);
      const certInserts = Object.entries(certifications).map(([code, name], index) => ({
        product_id: productId,
        certification_code: code,
        certification_name: name,
        display_order: index,
        is_active: true
      }));
      if (certInserts.length > 0) {
        await supabase.from('product_certifications').insert(certInserts);
      }

      // Görselleri bağla
      const imageFilenames = parseListItems(row['Görseller']);
      const primaryImageFilename = parseValue(row['Ana Görsel']);

      if (imageFilenames.length > 0) {
        await supabase.from('product_images').delete().eq('product_id', productId);

        for (let i = 0; i < imageFilenames.length; i++) {
          const filename = imageFilenames[i];
          const mediaId = await findOrCreateMedia(filename);

          if (mediaId) {
            await supabase.from('product_images').insert({
              product_id: productId,
              media_id: mediaId,
              is_primary: filename === primaryImageFilename,
              sort_order: i
            });
          }
        }
      }

      // Varyant varsa ekle
      const isVariant = parseBoolean(row['Varyant']);
      if (isVariant && productData.product_type === 'variant') {
        const variantSKU = parseValue(row['Varyant SKU']);
        if (variantSKU) {
          // Varyant özel alanlarını topla (Excel'deki tüm kolonlardan)
          const customFields: any = {};
          const variantFieldPrefix = ['Koli', 'Shrink', 'Palet', 'Paket'];

          // Excel'deki özel alanları bul
          for (const key in row) {
            const shouldInclude = variantFieldPrefix.some(prefix => key.startsWith(prefix));
            if (shouldInclude && row[key]) {
              const fieldValue = parseValue(row[key]);
              if (fieldValue !== null && fieldValue !== '') {
                // Alan adını kategoriye ekle (eğer kategori varsa)
                if (categoryId) {
                  const fieldType = typeof fieldValue === 'number' ? 'number' : 'text';
                  await findOrCreateVariantField(categoryId, key, fieldType);
                }
                customFields[key] = fieldValue;
              }
            }
          }

          // Varyant Özellikler kolonundaki değerleri de ekle
          const variantProps = parseKeyValuePairs(row['Varyant Özellikler']);
          Object.assign(customFields, variantProps);

          const variantData = {
            product_id: productId,
            sku: variantSKU,
            barcode: parseValue(row['Varyant Barkod']),
            price: parseNumber(row['Varyant Fiyat']),
            is_default: true,
            is_active: true,
            sort_order: 0,
            custom_fields: customFields
          };

          const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .upsert(variantData, { onConflict: 'sku' })
            .select('id')
            .single();

          if (!variantError && variant) {
            // Varyant görsellerini ekle
            const variantImages = parseListItems(row['Varyant Görseller']);
            if (variantImages.length > 0) {
              await supabase.from('product_variant_media').delete().eq('variant_id', variant.id);

              for (let i = 0; i < variantImages.length; i++) {
                const mediaId = await findOrCreateMedia(variantImages[i]);
                if (mediaId) {
                  await supabase.from('product_variant_media').insert({
                    variant_id: variant.id,
                    media_id: mediaId,
                    is_primary: i === 0,
                    sort_order: i
                  });
                }
              }
            }
          }
        }
      }

      let message = existingProduct ? 'Ürün güncellendi' : 'Ürün eklendi';
      if (categoryName && categoryId) {
        message += ` (Kategori: ${categoryName})`;
      }

      return {
        row: rowNumber,
        data: row,
        status: 'success',
        message,
        productId
      };

    } catch (error: any) {
      console.error('Import error:', error);
      return {
        row: rowNumber,
        data: row,
        status: 'error',
        message: error.message || 'Bilinmeyen hata'
      };
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const loadingToast = toast.loading('Ürünler dışa aktarılıyor...');

    try {
      // Tüm ürünleri çek
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(slug),
          images:product_images(media:media(filename)),
          specifications:product_specifications(*),
          features:product_features(*),
          applications:product_applications(*),
          certifications:product_certifications(*),
          attributes:product_attribute_assignments(
            attribute:product_attributes(name),
            value:product_attribute_values(value)
          ),
          variants:product_variants(
            *,
            media:product_variant_media(media:media(filename))
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exportData: any[] = [];

      for (const product of products || []) {
        // Ürün çevirilerini translations tablosundan al
        const { data: productTranslations } = await supabase
          .from('translations')
          .select('translation_key, language_code, translation_value')
          .in('translation_key', [
            `product.${product.id}.name`,
            `product.${product.id}.short_desc`,
            `product.${product.id}.long_desc`
          ]);

        const getTranslation = (key: string, lang: string) => {
          return productTranslations?.find(
            t => t.translation_key.endsWith(key) && t.language_code === lang
          )?.translation_value || '';
        };

        const trName = getTranslation('.name', 'tr');
        const trShortDesc = getTranslation('.short_desc', 'tr');
        const trLongDesc = getTranslation('.long_desc', 'tr');

        // Kategori adını al
        let categoryName = '';
        if (product.category?.slug) {
          const { data: catTranslation } = await supabase
            .from('translations')
            .select('translation_value')
            .eq('translation_key', `category.${product.category.slug}.name`)
            .eq('language_code', 'tr')
            .maybeSingle();
          categoryName = catTranslation?.translation_value || product.category.slug;
        }

        const specs = product.specifications?.map((s: any) => `${s.spec_key}:${s.spec_value}`).join(';') || '';
        const features = product.features?.filter((f: any) => f.language_code === 'tr').map((f: any) => f.feature_text).join(';') || '';
        const apps = product.applications?.filter((a: any) => a.language_code === 'tr').map((a: any) => a.application_text).join(';') || '';
        const certs = product.certifications?.map((c: any) => `${c.certification_code}:${c.certification_name}`).join(';') || '';
        const images = product.images?.map((i: any) => i.media?.filename).filter(Boolean).join(',') || '';
        const primaryImage = product.images?.find((i: any) => i.is_primary)?.media?.filename || '';

        // Attribute'ları topla
        const attributeData: any = {};
        if (product.attributes) {
          for (const attr of product.attributes) {
            if (attr.attribute?.name && attr.value?.value) {
              attributeData[attr.attribute.name] = attr.value.value;
            }
          }
        }

        // Ana ürün satırı (sadece Türkçe - import'ta otomatik çevrilir)
        const baseRow = {
          'SKU (*)': product.sku,
          'Ürün Adı (*)': trName || product.sku,
          'Kısa Açıklama': trShortDesc || '',
          'Detaylı Açıklama': trLongDesc || '',
          'Kategori': categoryName,
          'Ürün Türü': product.product_type,
          'Durum': product.status,
          'Öne Çıkan': product.featured ? 'Evet' : 'Hayır',
          'Marka': product.brand || '',
          'Model': product.model || '',

          // Attribute'ları ekle
          'Duy Tipi': attributeData['Duy Tipi'] || '',
          'IP Sınıfı': attributeData['IP Sınıfı'] || '',
          'Renk': attributeData['Renk'] || '',
          'Güç': attributeData['Güç'] || '',
          'Voltaj': attributeData['Voltaj'] || '',
          'Işık Rengi': attributeData['Işık Rengi'] || '',
          'Beam Açısı': attributeData['Beam Açısı'] || '',
          'CRI': attributeData['CRI'] || '',
          'Lümen': attributeData['Lümen'] || '',
          'Malzeme': attributeData['Malzeme'] || '',
          'Açı': attributeData['Açı'] || '',

          'Spesifikasyonlar': specs,
          'Özellikler': features,
          'Kullanım Alanları': apps,
          'Sertifikalar': certs,
          'Boyutlar': product.dimensions || '',
          'Ağırlık (kg)': product.weight || '',
          'Kolı Hacım (m³)': '',
          'Shrink Hacım': product.shrink_volume || '',
          'Shrink Ölçüsü': product.shrink_measurement || '',
          'Kutu Adedi': product.quantity_per_box || '',
          'Kolı Adedi': product.quantity_per_shrink || '',
          'Paket Adedi': '',
          'Paket Ağırlığı (kg)': '',
          'Garanti Süresi (ay)': product.warranty_period || 24,
          'Min. Sipariş Miktarı': product.min_order_quantity || 1,
          'Teslim Süresi (gün)': product.lead_time_days || 0,
          'Özelleştirilebilir': product.is_customizable ? 'Evet' : 'Hayır',
          'Enerji Sınıfı': product.energy_class || '',
          'Meta Başlık': product.meta_title || '',
          'Meta Açıklama': product.meta_description || '',
          'Görseller': images,
          'Ana Görsel': primaryImage,
          'Varyant': 'Hayır',
          'Varyant SKU': '',
          'Varyant Özellikler': '',
          'Varyant Barkod': '',
          'Varyant Fiyat': '',
          'Varyant Ağırlık': '',
          'Varyant Boyutlar': '',
          'Varyant Kutu Adedi': '',
          'Varyant Kolı Adedi': '',
          'Varyant Paket Hacım': '',
          'Varyant Paket Ağırlık': '',
          'Varyant Görseller': '',
          'Doküman Adları': '',
          'Doküman Tipleri': '',
          'Doküman Dosyaları': ''
        };

        // Varyantları ekle
        if (product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            const variantImages = variant.media?.map((m: any) => m.media?.filename).filter(Boolean).join(',') || '';

            // Custom fields'ı ayrı kolonlara ayır
            const variantRow: any = {
              ...baseRow,
              'Varyant': 'Evet',
              'Varyant SKU': variant.sku,
              'Varyant Barkod': variant.barcode || '',
              'Varyant Fiyat': variant.price || ''
            };

            // Custom fields'ları kolonlara ekle
            if (variant.custom_fields) {
              Object.entries(variant.custom_fields).forEach(([key, value]) => {
                variantRow[key] = value;
              });
            }

            exportData.push(variantRow);
          }
        } else {
          exportData.push(baseRow);
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');

      // Kolon genişliklerini ayarla
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 20)
      }));
      worksheet['!cols'] = colWidths;

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `urunler-export-${timestamp}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success(`${exportData.length} satır başarıyla dışa aktarıldı!`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.dismiss(loadingToast);
      toast.error('Dışa aktarma sırasında hata: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Lütfen önce bir dosya seçin');
      return;
    }

    setImporting(true);
    setResults([]);
    setShowResults(true);

    try {
      const data = await parseExcel(file);

      if (data.length === 0) {
        toast.error('Excel dosyası boş');
        setImporting(false);
        return;
      }

      const loadingToast = toast.loading(`${data.length} ürün import ediliyor...`);

      const importResults: ImportRow[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const result = await importProduct(row, i + 2); // +2 çünkü Excel'de header var
        importResults.push(result);
        setResults([...importResults]); // Her satırdan sonra güncelle
      }

      const successCount = importResults.filter(r => r.status === 'success').length;
      const errorCount = importResults.filter(r => r.status === 'error').length;

      toast.dismiss(loadingToast);

      if (errorCount === 0) {
        toast.success(`${successCount} ürün başarıyla import edildi!`);
      } else {
        toast.error(`${successCount} başarılı, ${errorCount} hata`);
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Import sırasında hata: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toplu Ürün İmport</h1>
          <p className="text-gray-600 mt-1">Excel dosyası ile toplu ürün ekleme ve güncelleme</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Önemli Bilgiler:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Önce şablonu indirin ve doldurun</li>
              <li>SKU alanı zorunludur ve benzersiz olmalıdır</li>
              <li>Mevcut SKU'lar güncellenir, yeni SKU'lar eklenir</li>
              <li>Görseller önceden media kütüphanesine yüklenmiş olmalıdır</li>
              <li>Kategori slug'ları mevcut kategorilerle eşleşmelidir</li>
              <li>Varyantlı ürünler için 'Ürün Türü' alanını 'variant' olarak ayarlayın</li>
              <li>Çoklu değerler için noktalı virgül (;) kullanın</li>
              <li>Anahtar-değer çiftleri için iki nokta (:) kullanın</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Template Download & Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Şablonu İndir</h3>
              <p className="text-gray-600">
                Örnek verilerle birlikte hazırlanmış Excel şablonunu indirin
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Boş Şablon İndir</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tüm Ürünleri Dışa Aktar</h3>
              <p className="text-gray-600">
                Mevcut tüm ürünleri varyantlarıyla birlikte Excel'e aktarın
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>{exporting ? 'Dışa Aktarılıyor...' : 'Ürünleri Dışa Aktar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Excel Dosyasını Yükle</h3>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-12 h-12 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResults([]);
                  setShowResults(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Excel dosyasını seçin veya sürükleyin
              </p>
              <p className="text-xs text-gray-500">.xlsx veya .xls formatında</p>
            </button>
          )}
        </div>

        {file && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg flex items-center space-x-2 transition-colors text-lg font-medium"
            >
              <Upload className="w-5 h-5" />
              <span>{importing ? 'İçe Aktarılıyor...' : 'İçe Aktar'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {showResults && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Import Sonuçları</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">{successCount} Başarılı</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-600">{errorCount} Hata</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : result.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Satır {result.row}: {result.data['SKU (*)'] || 'Bilinmeyen'}
                    </p>
                    {result.message && (
                      <p className="text-xs text-gray-600 mt-0.5">{result.message}</p>
                    )}
                  </div>
                </div>
                {result.status === 'success' && result.productId && (
                  <a
                    href={`/admin/products/${result.productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Görüntüle →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkProductImport;
