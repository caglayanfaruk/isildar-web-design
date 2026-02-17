# Supabase Storage Kurulumu

Ürün görsellerinin yüklenmesi için Supabase Storage'ı manuel olarak kurmanız gerekmektedir.

## Adımlar

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard

2. **Projenizi seçin**

3. **Storage bölümüne gidin** (sol menüden)

4. **Yeni bucket oluşturun**:
   - Bucket adı: `media`
   - Public bucket: ✓ (İşaretli olmalı)
   - Create bucket butonuna tıklayın

5. **Bucket ayarlarını kontrol edin**:
   - Bucket'ın public olduğundan emin olun
   - File size limit: İhtiyacınıza göre ayarlayın (örn: 5MB)

## Test

Storage kurulumunu test etmek için:

1. Admin panele gidin
2. Bir ürünü düzenleyin (veya yeni ürün oluşturun ve kaydedin)
3. "Görseller" tab'ına gidin
4. Görsel yükleme alanına tıklayın ve bir görsel seçin
5. Görsel başarıyla yüklenirse, önizlemede görünecektir

## Sorun Giderme

Eğer görsel yüklenirken hata alırsanız:

1. Storage bucket'ının public olduğunu kontrol edin
2. RLS (Row Level Security) politikalarının doğru kurulduğunu kontrol edin
3. Browser console'da detaylı hata mesajlarını inceleyin

## RLS Politikaları

Storage için gerekli RLS politikaları otomatik olarak oluşturulmamaktadır. Gerekirse Supabase Dashboard'dan manuel olarak ekleyin:

```sql
-- Public okuma erişimi
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'media' );

-- Authenticated kullanıcılar yükleme yapabilir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'media' );

-- Authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'media' );

-- Authenticated kullanıcılar silebilir
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'media' );
```
