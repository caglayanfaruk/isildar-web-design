import React from 'react';
import { Plus, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import ImageUploadSelector from '../admin/ImageUploadSelector';

interface VariantField {
  key: string;
  label_tr: string;
  label_en: string;
  type: 'text' | 'number' | 'select';
  unit?: string;
  required?: boolean;
  attribute_type?: string;
  values?: Array<{
    id: string;
    value: string;
    display_value: string;
  }>;
}

interface VariantMedia {
  media_id: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  media?: {
    id: string;
    url: string;
    filename: string;
    original_name: string;
  };
}

interface Variant {
  id?: string;
  sku: string;
  box_pieces?: number;
  package_pieces?: number;
  package_volume?: number;
  package_weight?: number;
  custom_fields: Record<string, any>;
  is_default: boolean;
  is_active: boolean;
  media?: VariantMedia[];
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  variantFields?: VariantField[];
}

const VariantManager: React.FC<VariantManagerProps> = ({ variants, onChange, variantFields = [] }) => {
  const [expandedVariants, setExpandedVariants] = React.useState<Set<number>>(new Set());

  const toggleVariantExpand = (index: number) => {
    const newExpanded = new Set(expandedVariants);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedVariants(newExpanded);
  };

  const addVariant = () => {
    const emptyCustomFields: Record<string, any> = {
      adi: ''
    };
    variantFields.forEach(field => {
      if (field.key !== 'adi') {
        emptyCustomFields[field.key] = field.type === 'number' ? 0 : '';
      }
    });

    onChange([...variants, {
      sku: '',
      custom_fields: emptyCustomFields,
      is_default: variants.length === 0,
      is_active: true,
      media: []
    }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;

    if (field === 'is_default' && value) {
      newVariants.forEach((v, i) => {
        if (i !== index) v.is_default = false;
      });
    }

    onChange(newVariants);
  };

  const updateCustomField = (index: number, fieldKey: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index].custom_fields = {
      ...newVariants[index].custom_fields,
      [fieldKey]: value
    };
    onChange(newVariants);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const addVariantMedia = (variantIndex: number, mediaIds: string[]) => {
    const newVariants = [...variants];
    const currentMedia = newVariants[variantIndex].media || [];
    const maxSortOrder = currentMedia.length > 0
      ? Math.max(...currentMedia.map(m => m.sort_order))
      : -1;

    const newMedia = mediaIds.map((mediaId, idx) => ({
      media_id: mediaId,
      is_primary: currentMedia.length === 0 && idx === 0,
      sort_order: maxSortOrder + idx + 1
    }));

    newVariants[variantIndex].media = [...currentMedia, ...newMedia];
    onChange(newVariants);
  };

  const removeVariantMedia = (variantIndex: number, mediaIndex: number) => {
    const newVariants = [...variants];
    const media = [...(newVariants[variantIndex].media || [])];
    const wasPrimary = media[mediaIndex].is_primary;
    media.splice(mediaIndex, 1);

    if (wasPrimary && media.length > 0) {
      media[0].is_primary = true;
    }

    newVariants[variantIndex].media = media;
    onChange(newVariants);
  };

  const setPrimaryVariantMedia = (variantIndex: number, mediaIndex: number) => {
    const newVariants = [...variants];
    const media = newVariants[variantIndex].media || [];
    media.forEach((m, i) => {
      m.is_primary = i === mediaIndex;
    });
    newVariants[variantIndex].media = media;
    onChange(newVariants);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ürün Varyantları</h3>
          {variantFields.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ Önce bir kategori seçin - varyant alanları kategoriye göre belirlenir
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Varyant Ekle</span>
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p>Henüz varyant eklenmedi</p>
          <p className="text-sm mt-2">Farklı renk, beden veya özelliklerle varyant oluşturun</p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Varyant {index + 1}</span>
                  {variant.is_default && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Varsayılan</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Varyant Adı (Variant Name) *
                  </label>
                  <input
                    type="text"
                    value={variant.custom_fields?.adi ?? ''}
                    onChange={(e) => updateCustomField(index, 'adi', e.target.value)}
                    placeholder="örn: Beyaz, 10W, 4000K"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    KOD (Code) *
                  </label>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kutu Adet <span className="text-gray-500 text-xs">(Box Pieces)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variant.box_pieces || ''}
                    onChange={(e) => updateVariant(index, 'box_pieces', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Koli Adet <span className="text-gray-500 text-xs">(Package Pieces)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variant.package_pieces || ''}
                    onChange={(e) => updateVariant(index, 'package_pieces', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Koli Hacim <span className="text-gray-500 text-xs">(m3)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={variant.package_volume || ''}
                    onChange={(e) => updateVariant(index, 'package_volume', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Koli Agirlik <span className="text-gray-500 text-xs">(kg)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.package_weight || ''}
                    onChange={(e) => updateVariant(index, 'package_weight', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>

                {variantFields.length === 0 && (
                  <div className="col-span-full">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-amber-800">
                        Bu kategori için varyant alanları tanımlanmamış.
                        <br />
                        <span className="font-semibold">Kategori Yönetimi</span> sayfasından kategoriye varyant alanları ekleyebilirsiniz.
                      </p>
                    </div>
                  </div>
                )}

                {variantFields.filter(f => f.key !== 'adi').map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label_tr}
                      {field.label_en && (
                        <span className="text-gray-500 text-xs ml-1">({field.label_en})</span>
                      )}
                      {field.unit && (
                        <span className="text-gray-500 text-xs ml-1">{field.unit}</span>
                      )}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'select' && field.values && field.values.length > 0 ? (
                      <select
                        value={variant.custom_fields?.[field.key] ?? ''}
                        onChange={(e) => updateCustomField(index, field.key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        required={field.required}
                      >
                        <option value="">Seçiniz...</option>
                        {field.values.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.display_value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        step={field.type === 'number' ? '0.01' : undefined}
                        value={variant.custom_fields?.[field.key] ?? ''}
                        onChange={(e) => {
                          const value = field.type === 'number'
                            ? parseFloat(e.target.value) || 0
                            : e.target.value;
                          updateCustomField(index, field.key, value);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={variant.is_default}
                      onChange={(e) => updateVariant(index, 'is_default', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm">Varsayılan Varyant</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={variant.is_active}
                      onChange={(e) => updateVariant(index, 'is_active', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm">Aktif</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => toggleVariantExpand(index)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{expandedVariants.has(index) ? 'Resimleri Gizle' : 'Resimleri Yönet'}</span>
                  <span className="text-gray-500">({variant.media?.length || 0})</span>
                </button>
              </div>

              {expandedVariants.has(index) && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Varyant Görselleri</h4>

                  {/* Show existing media with images */}
                  {variant.media && variant.media.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-4 gap-3">
                        {variant.media.map((media, mediaIdx) => media.media && (
                          <div key={mediaIdx} className="relative group">
                            <img
                              src={media.media.url}
                              alt={media.alt_text || media.media.filename}
                              className={`w-full h-32 object-cover rounded-lg border-2 ${
                                media.is_primary ? 'border-blue-500' : 'border-gray-200'
                              }`}
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button
                                type="button"
                                onClick={() => setPrimaryVariantMedia(index, mediaIdx)}
                                className={`p-1 rounded ${
                                  media.is_primary
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/90 text-gray-700 hover:bg-blue-100'
                                }`}
                                title={media.is_primary ? 'Ana görsel' : 'Ana görsel yap'}
                              >
                                <Star className="w-4 h-4" fill={media.is_primary ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariantMedia(index, mediaIdx)}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {media.is_primary && (
                              <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                Ana Görsel
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <ImageUploadSelector
                    selectedIds={variant.media?.map(m => m.media_id) || []}
                    onSelect={(ids) => addVariantMedia(index, ids)}
                    onRemove={(id) => {
                      const mediaIndex = variant.media?.findIndex(m => m.media_id === id);
                      if (mediaIndex !== undefined && mediaIndex >= 0) {
                        removeVariantMedia(index, mediaIndex);
                      }
                    }}
                    multiple={true}
                    hideSelectedPreview={true}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VariantManager;
