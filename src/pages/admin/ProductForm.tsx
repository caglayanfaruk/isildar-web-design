import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  Image,
  Star,
  Package,
  Settings,
  TrendingUp,
  ArrowLeft,
  FileText,
  Upload,
  Sparkles
} from 'lucide-react';
import { supabase, Category, ProductAttribute } from '../../lib/supabase';
import { saveAndTranslate } from '../../services/unifiedTranslationService';
import toast from 'react-hot-toast';
import CategorySelector from '../../components/CategorySelector';
import VariantManager from '../../components/product-form/VariantManager';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ImageFile {
  file: File;
  preview: string;
  isPrimary: boolean;
}

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('tr');
  const [variantFields, setVariantFields] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'variants' | 'specs' | 'documents' | 'seo'>('basic');
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | undefined>();
  const [variants, setVariants] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<Array<{id?: string, spec_key: string, spec_value: string, spec_unit: string}>>([]);
  const [features, setFeatures] = useState<Array<{id?: string, feature_text: string}>>([]);
  const [applications, setApplications] = useState<Array<{id?: string, application_text: string, description: string}>>([]);
  const [certifications, setCertifications] = useState<Array<{id?: string, certification_code: string, certification_name: string}>>([]);
  const [documents, setDocuments] = useState<Array<{id?: string, name: string, document_type: string, file?: File, file_url?: string}>>([]);
  const [aiGenerating, setAiGenerating] = useState<{short: boolean, long: boolean}>({ short: false, long: false });
  const [availableFilters, setAvailableFilters] = useState<any[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{[groupId: string]: string[]}>({});
  const [attributeValues, setAttributeValues] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<{[attributeId: string]: string}>({});

  const [formData, setFormData] = useState({
    sku: '',
    parent_id: '',
    product_type: 'simple' as 'simple' | 'variant' | 'grouped',
    status: 'active',
    featured: false,
    sort_order: 0,
    specifications: {},
    features: [] as string[],
    applications: [] as string[],
    dimensions: '',
    weight: 0,
    shrink_volume: 0,
    shrink_measurement: '',
    quantity_per_box: 0,
    quantity_per_shrink: 0,
    brand: '',
    model: '',
    warranty_period: 24,
    min_order_quantity: 1,
    lead_time_days: 0,
    is_customizable: false,
    energy_class: '',
    certifications: [] as string[],
    technical_specs: {},
    installation_notes: '',
    maintenance_notes: '',
    meta_title: '',
    meta_description: '',
    translations: {
      name: '',
      description: '',
      short_description: ''
    }
  });

  useEffect(() => {
    loadCategories();
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  useEffect(() => {
    loadAttributes(selectedCategoryIds);
    loadVariantFieldsFromAttributes(selectedCategoryIds);
  }, [selectedCategoryIds]);

  useEffect(() => {
    loadFiltersForCategories(selectedCategoryIds);
  }, [selectedCategoryIds, currentLanguage]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Ürün çevirilerini unified translations tablosundan al
      const { data: translations } = await supabase
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_code', 'tr')
        .in('translation_key', [
          `product.${productId}.name`,
          `product.${productId}.short_desc`,
          `product.${productId}.long_desc`
        ]);

      const translationMap: any = {
        name: '',
        description: '',
        short_description: ''
      };

      translations?.forEach(t => {
        if (t.translation_key.endsWith('.name')) {
          translationMap.name = t.translation_value;
        } else if (t.translation_key.endsWith('.short_desc')) {
          translationMap.short_description = t.translation_value;
        } else if (t.translation_key.endsWith('.long_desc')) {
          translationMap.description = t.translation_value;
        }
      });

      setFormData({
        sku: product.sku,
        parent_id: product.parent_id || '',
        product_type: product.product_type,
        status: product.status,
        featured: product.featured,
        sort_order: product.sort_order,
        specifications: product.specifications || {},
        features: product.features || [],
        applications: product.applications || [],
        dimensions: product.dimensions || '',
        weight: product.weight || 0,
        shrink_volume: product.shrink_volume || 0,
        shrink_measurement: product.shrink_measurement || '',
        quantity_per_box: product.quantity_per_box || 0,
        quantity_per_shrink: product.quantity_per_shrink || 0,
        brand: product.brand || '',
        model: product.model || '',
        warranty_period: product.warranty_period || 24,
        min_order_quantity: product.min_order_quantity || 1,
        lead_time_days: product.lead_time_days || 0,
        is_customizable: product.is_customizable || false,
        energy_class: product.energy_class || '',
        certifications: product.certifications || [],
        technical_specs: product.technical_specs || {},
        installation_notes: product.installation_notes || '',
        maintenance_notes: product.maintenance_notes || '',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        translations: {
          name: translationMap.name || '',
          description: translationMap.description || '',
          short_description: translationMap.short_description || ''
        }
      });

      const { data: productCategories } = await supabase
        .from('product_categories')
        .select('category_id, is_primary')
        .eq('product_id', productId)
        .order('sort_order');

      if (productCategories && productCategories.length > 0) {
        const categoryIds = productCategories.map(pc => pc.category_id);
        const primary = productCategories.find(pc => pc.is_primary);
        setSelectedCategoryIds(categoryIds);
        setPrimaryCategoryId(primary?.category_id);
      }

      const { data: images } = await supabase
        .from('product_images')
        .select('*, media(*)')
        .eq('product_id', productId)
        .order('sort_order');

      setExistingImages(images || []);

      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (variantsData && variantsData.length > 0) {
        const variantsWithMedia = await Promise.all(
          variantsData.map(async (v: any) => {
            const { data: mediaData } = await supabase
              .from('product_variant_media')
              .select(`
                media_id,
                alt_text,
                is_primary,
                sort_order,
                media:media_id (
                  id,
                  url,
                  filename,
                  original_name
                )
              `)
              .eq('variant_id', v.id)
              .order('sort_order');

            const { data: variantAttrs } = await supabase
              .from('product_variant_attributes')
              .select('attribute_id, attribute_value_id')
              .eq('variant_id', v.id);

            const attrFields: Record<string, string> = {};
            if (variantAttrs) {
              variantAttrs.forEach((va: any) => {
                attrFields[va.attribute_id] = va.attribute_value_id;
              });
            }

            return {
              id: v.id,
              sku: v.sku,
              barcode: v.barcode || '',
              price: v.price || 0,
              box_pieces: v.box_pieces || 0,
              package_pieces: v.package_pieces || 0,
              package_volume: v.package_volume || 0,
              package_weight: v.package_weight || 0,
              custom_fields: { ...(v.custom_fields || {}), ...attrFields },
              is_default: v.is_default,
              is_active: v.is_active,
              media: mediaData || []
            };
          })
        );
        setVariants(variantsWithMedia);
      }

      const { data: specsData } = await supabase
        .from('product_specifications')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (specsData) setSpecifications(specsData);

      const { data: productAttributes } = await supabase
        .from('product_attribute_assignments')
        .select('attribute_id, attribute_value_id')
        .eq('product_id', productId);

      if (productAttributes) {
        const attrMap: {[key: string]: string} = {};
        productAttributes.forEach(pa => {
          attrMap[pa.attribute_id] = pa.attribute_value_id;
        });
        setSelectedAttributes(attrMap);
      }

      const { data: featuresData } = await supabase
        .from('product_features')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (featuresData) setFeatures(featuresData);

      const { data: appsData } = await supabase
        .from('product_applications')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (appsData) setApplications(appsData);

      const { data: certsData } = await supabase
        .from('product_certifications')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (certsData) setCertifications(certsData);

      const { data: docsData } = await supabase
        .from('product_documents')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (docsData) setDocuments(docsData);

      const { data: filterValues } = await supabase
        .from('product_filter_values')
        .select('filter_option_id, product_filter_options(filter_group_id)')
        .eq('product_id', productId);

      if (filterValues) {
        const filterMap: {[groupId: string]: string[]} = {};
        filterValues.forEach((fv: any) => {
          const groupId = fv.product_filter_options?.filter_group_id;
          if (groupId) {
            if (!filterMap[groupId]) filterMap[groupId] = [];
            filterMap[groupId].push(fv.filter_option_id);
          }
        });
        setSelectedFilters(filterMap);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      const categoriesWithTranslations = await Promise.all(
        (data || []).map(async (category) => {
          const { data: translations } = await supabase
            .from('translations')
            .select('*')
            .eq('language_code', currentLanguage)
            .eq('translation_key', `category.${category.slug}.name`);

          return {
            ...category,
            translations: {
              name: translations?.[0]?.translation_value || category.slug
            }
          };
        })
      );

      setCategories(categoriesWithTranslations);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAttributes = async (categoryIds: string[] = []) => {
    try {
      let attributesData: any[] = [];

      if (categoryIds.length > 0) {
        const { data: categoryAttrs, error: catError } = await supabase
          .from('category_attributes')
          .select(`
            attribute_id,
            is_required,
            sort_order,
            product_attributes (*)
          `)
          .in('category_id', categoryIds);

        if (catError) throw catError;

        const uniqueAttrs = new Map();
        categoryAttrs?.forEach((ca: any) => {
          if (ca.product_attributes && !uniqueAttrs.has(ca.attribute_id)) {
            uniqueAttrs.set(ca.attribute_id, {
              ...ca.product_attributes,
              is_required: ca.is_required,
              category_sort_order: ca.sort_order
            });
          }
        });

        attributesData = Array.from(uniqueAttrs.values());
      }

      const { data: valuesData, error: valuesError } = await supabase
        .from('product_attribute_values')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (valuesError) throw valuesError;

      setAttributes(attributesData);
      setAttributeValues(valuesData || []);
    } catch (error) {
      console.error('Error loading attributes:', error);
    }
  };

  const loadVariantFieldsFromAttributes = async (categoryIds: string[] = []) => {
    try {
      if (categoryIds.length === 0) {
        setVariantFields([]);
        return;
      }

      let variantAttributesData: any[] = [];

      const { data: categoryAttrs, error: catError } = await supabase
        .from('category_attributes')
        .select(`
          attribute_id,
          is_required,
          sort_order,
          product_attributes!inner (
            id,
            name,
            type,
            scope,
            is_active
          )
        `)
        .in('category_id', categoryIds)
        .in('product_attributes.scope', ['variant', 'both'])
        .eq('product_attributes.is_active', true);

      if (catError) {
        console.error('Error loading variant attributes:', catError);
        setVariantFields([]);
        return;
      }

      const uniqueAttrs = new Map();
      categoryAttrs?.forEach((ca: any) => {
        if (ca.product_attributes && !uniqueAttrs.has(ca.attribute_id)) {
          uniqueAttrs.set(ca.attribute_id, {
            ...ca.product_attributes,
            is_required: ca.is_required,
            sort_order: ca.sort_order
          });
        }
      });

      variantAttributesData = Array.from(uniqueAttrs.values());

      const { data: allValues } = await supabase
        .from('product_attribute_values')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      const convertedFields = variantAttributesData.map((attr: any) => {
        const attrValues = allValues?.filter((v: any) => v.attribute_id === attr.id) || [];

        return {
          key: attr.id,
          label_tr: attr.name,
          label_en: attr.name,
          type: attr.type === 'number' ? 'number' : 'select',
          required: attr.is_required || false,
          attribute_type: attr.type,
          values: attrValues.map((v: any) => ({
            id: v.id,
            value: v.value,
            display_value: v.display_value || v.value
          }))
        };
      });

      console.log('Loaded variant fields from attributes:', convertedFields);
      setVariantFields(convertedFields);
    } catch (error) {
      console.error('Error loading variant fields from attributes:', error);
      setVariantFields([]);
    }
  };

  const loadFiltersForCategories = async (categoryIds: string[]) => {
    if (categoryIds.length === 0) {
      setAvailableFilters([]);
      return;
    }

    try {
      const { data: filterGroups, error } = await supabase
        .from('product_filter_groups')
        .select(`
          *,
          options:product_filter_options(
            id,
            name,
            slug,
            order,
            translations:product_filter_translations(language_code, name)
          )
        `)
        .or(`category_id.is.null,category_id.in.(${categoryIds.join(',')})`)
        .eq('visible', true)
        .eq('show_in_filters', true)
        .order('order');

      if (error) throw error;

      const filtersWithTranslations = filterGroups?.map(group => ({
        ...group,
        options: group.options?.map((opt: any) => ({
          ...opt,
          displayName: opt.translations?.find((t: any) => t.language_code === currentLanguage)?.name || opt.name
        }))
      })) || [];

      setAvailableFilters(filtersWithTranslations);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newImages.push({
        file,
        preview,
        isPrimary: selectedImages.length === 0 && existingImages.length === 0 && i === 0
      });
    }

    setSelectedImages([...selectedImages, ...newImages]);
    e.target.value = '';
  };

  const handleSetPrimaryImage = (index: number) => {
    setSelectedImages(selectedImages.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const handleSetExistingPrimaryImage = (imageId: string) => {
    setExistingImages(existingImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(selectedImages[index].preview);
    const newImages = selectedImages.filter((_, i) => i !== index);

    if (newImages.length > 0 && selectedImages[index].isPrimary) {
      newImages[0].isPrimary = true;
    }

    setSelectedImages(newImages);
  };

  const handleRemoveExistingImage = async (imageId: string) => {
    if (!confirm('Bu görseli silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setExistingImages(existingImages.filter(img => img.id !== imageId));
      toast.success('Görsel silindi');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Görsel silinirken hata oluştu');
    }
  };

  const handleGenerateAIContent = async (type: 'short' | 'long') => {
    if (!formData.translations.name) {
      toast.error('Lütfen önce ürün adını girin');
      return;
    }

    setAiGenerating(prev => ({ ...prev, [type]: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            productName: formData.translations.name,
            type: type,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI içerik üretimi başarısız');
      }

      const { content } = await response.json();

      setFormData({
        ...formData,
        translations: {
          ...formData.translations,
          [type === 'short' ? 'short_description' : 'description']: content
        }
      });

      toast.success(`${type === 'short' ? 'Kısa' : 'Detaylı'} açıklama AI ile oluşturuldu`);
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'AI içerik üretimi sırasında hata oluştu');
    } finally {
      setAiGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Eğer slug yoksa, SKU'dan slug oluştur
      let slug = formData.translations.name
        ? formData.translations.name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : formData.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const productData = {
        sku: formData.sku,
        slug: slug,
        category_id: primaryCategoryId || null,
        parent_id: formData.parent_id || null,
        product_type: formData.product_type,
        status: formData.status,
        featured: formData.featured,
        sort_order: formData.sort_order,
        specifications: formData.specifications,
        features: formData.features,
        applications: formData.applications,
        dimensions: formData.dimensions,
        weight: formData.weight || null,
        shrink_volume: formData.shrink_volume || null,
        shrink_measurement: formData.shrink_measurement,
        quantity_per_box: formData.quantity_per_box || null,
        quantity_per_shrink: formData.quantity_per_shrink || null,
        brand: formData.brand,
        model: formData.model,
        warranty_period: formData.warranty_period,
        min_order_quantity: formData.min_order_quantity,
        lead_time_days: formData.lead_time_days,
        is_customizable: formData.is_customizable,
        energy_class: formData.energy_class,
        certifications: formData.certifications,
        technical_specs: formData.technical_specs,
        installation_notes: formData.installation_notes,
        maintenance_notes: formData.maintenance_notes,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description
      };

      let productId = id;

      if (id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      if (productId) {
        // Otomatik çeviri: Türkçe metinleri tüm dillere çevir ve kaydet
        if (formData.translations.name) {
          await saveAndTranslate(
            formData.translations.name,
            `product.${productId}.name`,
            'product',
            ['en', 'fr', 'de', 'ar', 'ru']
          );
        }

        if (formData.translations.short_description) {
          await saveAndTranslate(
            formData.translations.short_description,
            `product.${productId}.short_desc`,
            'product',
            ['en', 'fr', 'de', 'ar', 'ru']
          );
        }

        if (formData.translations.description) {
          await saveAndTranslate(
            formData.translations.description,
            `product.${productId}.long_desc`,
            'product',
            ['en', 'fr', 'de', 'ar', 'ru']
          );
        }
      }

      if (selectedImages.length > 0 && productId) {
        let sortOrder = existingImages.length;

        for (const imageData of selectedImages) {
          const fileExt = imageData.file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, imageData.file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

          const { data: mediaData, error: mediaError } = await supabase
            .from('media')
            .insert([{
              filename: fileName,
              original_name: imageData.file.name,
              mime_type: imageData.file.type,
              size_bytes: imageData.file.size,
              url: publicUrl,
              folder: 'products'
            }])
            .select()
            .single();

          if (mediaError) throw mediaError;

          const { error: linkError } = await supabase
            .from('product_images')
            .insert([{
              product_id: productId,
              media_id: mediaData.id,
              is_primary: imageData.isPrimary,
              sort_order: sortOrder++
            }]);

          if (linkError) throw linkError;

          URL.revokeObjectURL(imageData.preview);
        }

        setSelectedImages([]);
      }

      if (existingImages.length > 0 && productId) {
        for (const img of existingImages) {
          await supabase
            .from('product_images')
            .update({ is_primary: img.is_primary })
            .eq('id', img.id);
        }
      }

      if (productId && selectedCategoryIds.length > 0) {
        await supabase
          .from('product_categories')
          .delete()
          .eq('product_id', productId);

        const categoryInserts = selectedCategoryIds.map((categoryId, index) => ({
          product_id: productId,
          category_id: categoryId,
          is_primary: categoryId === primaryCategoryId,
          sort_order: index
        }));

        const { error: categoriesError } = await supabase
          .from('product_categories')
          .insert(categoryInserts);

        if (categoriesError) throw categoriesError;
      }

      if (productId && variants.length > 0 && formData.product_type === 'variant') {
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId);

        const variantInserts = variants.map((v: any, index: number) => {
          let variantSku = v.sku;
          if (!variantSku && formData.sku) {
            variantSku = `${formData.sku}-V${index + 1}`;
          }

          return {
            product_id: productId,
            sku: variantSku,
            barcode: v.barcode || null,
            price: v.price || null,
            box_pieces: v.box_pieces || null,
            package_pieces: v.package_pieces || null,
            package_volume: v.package_volume || null,
            package_weight: v.package_weight || null,
            custom_fields: v.custom_fields || {},
            is_default: v.is_default || false,
            is_active: v.is_active !== false,
            sort_order: index
          };
        });

        const { data: insertedVariants, error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantInserts)
          .select('id, sku');

        if (variantsError) throw variantsError;

        if (insertedVariants) {
          for (let i = 0; i < insertedVariants.length; i++) {
            const variant = insertedVariants[i];
            const variantData = variants[i];

            if (variantData.custom_fields && Object.keys(variantData.custom_fields).length > 0) {
              const attributeInserts = Object.entries(variantData.custom_fields)
                .filter(([, valueId]) => valueId)
                .map(([attributeId, valueId]) => ({
                  variant_id: variant.id,
                  attribute_id: attributeId,
                  attribute_value_id: valueId as string
                }));

              if (attributeInserts.length > 0) {
                const { error: attrError } = await supabase
                  .from('product_variant_attributes')
                  .insert(attributeInserts);

                if (attrError) {
                  console.error('Error inserting variant attributes:', attrError);
                }
              }
            }

            if (variantData.media && variantData.media.length > 0) {
              const mediaInserts = variantData.media.map((m: any) => ({
                variant_id: variant.id,
                media_id: m.media_id,
                alt_text: m.alt_text || null,
                is_primary: m.is_primary || false,
                sort_order: m.sort_order || 0
              }));

              const { error: mediaError } = await supabase
                .from('product_variant_media')
                .insert(mediaInserts);

              if (mediaError) {
                console.error('Error inserting variant media:', mediaError);
              }
            }
          }
        }
      }

      if (productId) {
        await supabase.from('product_specifications').delete().eq('product_id', productId);
        await supabase.from('product_features').delete().eq('product_id', productId);
        await supabase.from('product_applications').delete().eq('product_id', productId);
        await supabase.from('product_certifications').delete().eq('product_id', productId);
        await supabase.from('product_documents').delete().eq('product_id', productId);

        if (specifications.length > 0) {
          const specsInserts = specifications.filter(s => s.spec_key && s.spec_value).map((s, i) => ({
            product_id: productId,
            spec_key: s.spec_key,
            spec_value: s.spec_value,
            spec_unit: s.spec_unit || null,
            display_order: i,
            is_highlighted: false
          }));
          if (specsInserts.length > 0) {
            await supabase.from('product_specifications').insert(specsInserts);
          }
        }

        await supabase
          .from('product_attribute_assignments')
          .delete()
          .eq('product_id', productId);

        const attributeInserts = Object.entries(selectedAttributes)
          .filter(([, valueId]) => valueId)
          .map(([attributeId, valueId]) => ({
            product_id: productId,
            attribute_id: attributeId,
            attribute_value_id: valueId
          }));

        if (attributeInserts.length > 0) {
          await supabase.from('product_attribute_assignments').insert(attributeInserts);
        }

        if (features.length > 0) {
          const featuresInserts = features.filter(f => f.feature_text).map((f, i) => ({
            product_id: productId,
            feature_text: f.feature_text,
            language_code: currentLanguage,
            display_order: i,
            is_highlighted: false
          }));
          if (featuresInserts.length > 0) {
            await supabase.from('product_features').insert(featuresInserts);
          }
        }

        if (applications.length > 0) {
          const appsInserts = applications.filter(a => a.application_text).map((a, i) => ({
            product_id: productId,
            application_text: a.application_text,
            language_code: currentLanguage,
            display_order: i
          }));
          if (appsInserts.length > 0) {
            await supabase.from('product_applications').insert(appsInserts);
          }
        }

        if (certifications.length > 0) {
          const certsInserts = certifications.filter(c => c.certification_code && c.certification_name).map((c, i) => ({
            product_id: productId,
            certification_code: c.certification_code,
            certification_name: c.certification_name,
            display_order: i,
            is_active: true
          }));
          if (certsInserts.length > 0) {
            await supabase.from('product_certifications').insert(certsInserts);
          }
        }

        if (documents.length > 0) {
          for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            if (!doc.name) continue;

            let fileUrl = doc.file_url;

            if (doc.file) {
              const fileExt = doc.file.name.split('.').pop();
              const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
              const filePath = `documents/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, doc.file);

              if (uploadError) {
                console.error('Document upload error:', uploadError);
                continue;
              }

              const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

              fileUrl = publicUrl;
            }

            if (fileUrl) {
              await supabase.from('product_documents').insert([{
                product_id: productId,
                name: doc.name,
                document_type: doc.document_type,
                file_url: fileUrl,
                file_type: doc.file?.type || 'application/pdf',
                file_size: doc.file?.size || 0,
                language_code: currentLanguage,
                sort_order: i,
                is_public: true
              }]);
            }
          }
        }
      }

      // Filtreleri güncelle
      if (productId) {
        await syncProductFilters(productId);
      }

      toast.success(id ? 'Urun basariyla guncellendi!' : 'Yeni urun basariyla eklendi!');
      if (!id && productId) {
        navigate(`/admin/products/${productId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const syncProductFilters = async (productId: string) => {
    try {
      console.log('Syncing filters for product:', productId);

      await supabase
        .from('product_filter_values')
        .delete()
        .eq('product_id', productId);

      const filterInserts: any[] = [];
      Object.entries(selectedFilters).forEach(([groupId, optionIds]) => {
        optionIds.forEach(optionId => {
          filterInserts.push({
            product_id: productId,
            filter_option_id: optionId
          });
        });
      });

      if (filterInserts.length > 0) {
        await supabase
          .from('product_filter_values')
          .insert(filterInserts);
      }

      console.log('Filters synced:', filterInserts.length);
    } catch (error) {
      console.error('Error syncing filters:', error);
    }
  };

  if (loading && id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const allImages = [...existingImages, ...selectedImages];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h1>
            <p className="text-gray-600 mt-1">Tüm bilgileri doldurun ve kaydet butonuna tıklayın</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tr">🇹🇷 Türkçe</option>
            <option value="en">🇺🇸 English</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'basic', name: 'Genel Bakış', icon: Package },
              { id: 'images', name: 'Görseller', icon: Image },
              ...(formData.product_type === 'variant' ? [{ id: 'variants', name: 'Varyantlar', icon: Settings }] : []),
              { id: 'specs', name: 'Teknik Özellikler', icon: Settings },
              { id: 'documents', name: 'Dökümanlar', icon: FileText },
              { id: 'seo', name: 'SEO', icon: TrendingUp }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Temel Ürün Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün Adı ({currentLanguage.toUpperCase()}) *
                    </label>
                    <input
                      type="text"
                      value={formData.translations.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          name: e.target.value
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!!id}
                      required
                    />
                    {id && <p className="text-xs text-gray-500 mt-1">SKU düzenlenemez</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategoriler (Çoklu Seçim)
                    </label>
                    <CategorySelector
                      categories={categories}
                      selectedCategoryIds={selectedCategoryIds}
                      onChange={async (categoryIds, primary) => {
                        setSelectedCategoryIds(categoryIds);
                        setPrimaryCategoryId(primary);
                      }}
                      currentLanguage={currentLanguage}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün Türü
                    </label>
                    <select
                      value={formData.product_type}
                      onChange={(e) => setFormData({ ...formData, product_type: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simple">Basit Ürün</option>
                      <option value="variant">Varyantlı Ürün</option>
                      <option value="grouped">Gruplu Ürün</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marka
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="IŞILDAR"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="LED-2210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durum
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                      <option value="draft">Taslak</option>
                      <option value="archived">Arşiv</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıra Numarası
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Küçük numara önce görünür</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm font-medium text-gray-700">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>Öne Çıkan Ürün</span>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_customizable"
                      checked={formData.is_customizable}
                      onChange={(e) => setFormData({ ...formData, is_customizable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_customizable" className="ml-2 block text-sm font-medium text-gray-700">
                      Özelleştirilebilir
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ürün Açıklamaları</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Kısa Açıklama ({currentLanguage.toUpperCase()})
                      </label>
                      <button
                        type="button"
                        onClick={() => handleGenerateAIContent('short')}
                        disabled={aiGenerating.short || !formData.translations.name}
                        className="flex items-center space-x-1 text-xs bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{aiGenerating.short ? 'Üretiliyor...' : 'AI ile Oluştur'}</span>
                      </button>
                    </div>
                    <textarea
                      value={formData.translations.short_description}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          short_description: e.target.value
                        }
                      })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ürünün kısa açıklaması..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Detaylı Açıklama ({currentLanguage.toUpperCase()})
                      </label>
                      <button
                        type="button"
                        onClick={() => handleGenerateAIContent('long')}
                        disabled={aiGenerating.long || !formData.translations.name}
                        className="flex items-center space-x-1 text-xs bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{aiGenerating.long ? 'Üretiliyor...' : 'AI ile Oluştur'}</span>
                      </button>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={formData.translations.description}
                        onChange={(value) => setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            description: value
                          }
                        })}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link'],
                            ['clean']
                          ]
                        }}
                        placeholder="Ürünün detaylı açıklaması..."
                        style={{ height: '250px', marginBottom: '50px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {formData.product_type === 'simple' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paketleme / Lojistik</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kutu Adet
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantity_per_box || ''}
                        onChange={(e) => setFormData({ ...formData, quantity_per_box: parseInt(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Koli Adet
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantity_per_shrink || ''}
                        onChange={(e) => setFormData({ ...formData, quantity_per_shrink: parseInt(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Koli Hacim (m3)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.shrink_volume || ''}
                        onChange={(e) => setFormData({ ...formData, shrink_volume: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Koli Agirlik (kg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.weight || ''}
                        onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ürün Görselleri</h3>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <Image className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Görsel Seç
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Birden fazla görsel seçebilirsiniz. Kaydederken yüklenecek.
                  </span>
                </label>
              </div>

              {allImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                      <img
                        src={img.media?.url || img.url}
                        alt={img.alt_text || 'Product image'}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSetExistingPrimaryImage(img.id)}
                            className={`p-2 rounded-full ${
                              img.is_primary
                                ? 'bg-yellow-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${img.is_primary ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(img.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {img.is_primary && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Ana Görsel
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative group border rounded-lg overflow-hidden">
                      <img
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className={`p-2 rounded-full ${
                              img.isPrimary
                                ? 'bg-yellow-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${img.isPrimary ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Ana Görsel
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Yeni
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {allImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                  <p>Henüz görsel seçilmedi</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'variants' && formData.product_type === 'variant' && (
            <VariantManager
              variants={variants}
              onChange={setVariants}
              variantFields={variantFields}
            />
          )}

          {activeTab === 'specs' && (
            <div className="space-y-6">
              {selectedCategoryIds.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-yellow-50">
                  <p className="text-gray-700 font-medium">Önce bir kategori seçin</p>
                  <p className="text-sm text-gray-500 mt-1">Kategoriye özel özellikler otomatik yüklenecektir</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ürün Özellikleri</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Ürünün genel özellikleri (IP sınıfı, garanti, kullanım alanı gibi)
                  </p>

                  {(() => {
                    const productAttrs = attributes.filter(a => a.scope === 'product' || a.scope === 'both');

                    if (productAttrs.length === 0) {
                      return (
                        <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-sm">Bu kategori için ürün özelliği tanımlanmamış</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {productAttrs.map(attr => {
                          const attrValues = attributeValues.filter(v => v.attribute_id === attr.id);
                          const isTextType = attr.type === 'text' || attr.type === 'number';

                          if (attrValues.length === 0 && !isTextType) {
                            return (
                              <div key={attr.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  {attr.name}
                                  {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                  type="text"
                                  placeholder="Değer girin..."
                                  value={selectedAttributes[attr.id] || ''}
                                  onChange={(e) => {
                                    setSelectedAttributes({
                                      ...selectedAttributes,
                                      [attr.id]: e.target.value
                                    });
                                  }}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            );
                          }

                          if (isTextType && attrValues.length === 0) {
                            return (
                              <div key={attr.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  {attr.name}
                                  {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                  type={attr.type === 'number' ? 'number' : 'text'}
                                  placeholder={`${attr.name} girin...`}
                                  value={selectedAttributes[attr.id] || ''}
                                  onChange={(e) => {
                                    setSelectedAttributes({
                                      ...selectedAttributes,
                                      [attr.id]: e.target.value
                                    });
                                  }}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  required={attr.is_required}
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={attr.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                {attr.name}
                                {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <select
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                value={selectedAttributes[attr.id] || ''}
                                onChange={(e) => {
                                  setSelectedAttributes({
                                    ...selectedAttributes,
                                    [attr.id]: e.target.value
                                  });
                                }}
                                required={attr.is_required}
                              >
                                <option value="">Seçiniz...</option>
                                {attrValues.map(val => (
                                  <option key={val.id} value={val.id}>
                                    {val.display_value || val.value}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Öne Çıkan Özellikler</h3>
                  <button
                    type="button"
                    onClick={() => setFeatures([...features, { feature_text: '' }])}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Özellik Ekle</span>
                  </button>
                </div>

                {features.length > 0 && (
                  <div className="space-y-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Özellik açıklaması"
                          value={feature.feature_text}
                          onChange={(e) => {
                            const newFeatures = [...features];
                            newFeatures[index].feature_text = e.target.value;
                            setFeatures(newFeatures);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => setFeatures(features.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Kullanım Alanları</h3>
                  <button
                    type="button"
                    onClick={() => setApplications([...applications, { application_text: '', description: '' }])}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Alan Ekle</span>
                  </button>
                </div>

                {applications.length > 0 && (
                  <div className="space-y-2">
                    {applications.map((app, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Kullanım alanı"
                          value={app.application_text}
                          onChange={(e) => {
                            const newApps = [...applications];
                            newApps[index].application_text = e.target.value;
                            setApplications(newApps);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => setApplications(applications.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sertifikalar</h3>
                  <button
                    type="button"
                    onClick={() => setCertifications([...certifications, { certification_code: '', certification_name: '' }])}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sertifika Ekle</span>
                  </button>
                </div>

                {certifications.length > 0 && (
                  <div className="space-y-2">
                    {certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Kod (ör: CE)"
                          value={cert.certification_code}
                          onChange={(e) => {
                            const newCerts = [...certifications];
                            newCerts[index].certification_code = e.target.value;
                            setCertifications(newCerts);
                          }}
                          className="w-32 border border-gray-300 rounded-lg px-3 py-2"
                        />
                        <input
                          type="text"
                          placeholder="Sertifika adı"
                          value={cert.certification_name}
                          onChange={(e) => {
                            const newCerts = [...certifications];
                            newCerts[index].certification_name = e.target.value;
                            setCertifications(newCerts);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ürün Dökümanları</h3>
                <button
                  type="button"
                  onClick={() => setDocuments([...documents, { name: '', document_type: 'manual' }])}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Döküman Ekle</span>
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Henüz döküman eklenmedi</p>
                  <p className="text-sm text-gray-500 mt-1">Kullanım kılavuzu, teknik döküman, sertifika ekleyebilirsiniz</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Döküman {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Döküman Adı *
                          </label>
                          <input
                            type="text"
                            value={doc.name}
                            onChange={(e) => {
                              const newDocs = [...documents];
                              newDocs[index].name = e.target.value;
                              setDocuments(newDocs);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Kullanım Kılavuzu"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Döküman Tipi
                          </label>
                          <select
                            value={doc.document_type}
                            onChange={(e) => {
                              const newDocs = [...documents];
                              newDocs[index].document_type = e.target.value;
                              setDocuments(newDocs);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="manual">Kullanım Kılavuzu</option>
                            <option value="datasheet">Teknik Döküman</option>
                            <option value="certificate">Sertifika</option>
                            <option value="warranty">Garanti Belgesi</option>
                            <option value="installation">Kurulum Kılavuzu</option>
                            <option value="other">Diğer</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dosya {doc.file_url && '(Yüklü)'}
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const newDocs = [...documents];
                                  newDocs[index].file = file;
                                  setDocuments(newDocs);
                                }
                              }}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                            />
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 flex items-center space-x-1"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-sm">Görüntüle</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Optimizasyonu</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Başlık
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_title.length}/60 karakter</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Açıklama
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length}/160 karakter</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Kaydediliyor...' : 'Kaydet ve Tamamla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
