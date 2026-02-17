import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VariantField {
  key: string;
  label_tr: string;
  label_en: string;
  type: 'text' | 'number';
  unit?: string;
  required?: boolean;
}

interface CategoryVariantFieldsEditorProps {
  fields: VariantField[];
  onChange: (fields: VariantField[]) => void;
}

const CategoryVariantFieldsEditor: React.FC<CategoryVariantFieldsEditorProps> = ({ fields, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('variant_field_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const addField = () => {
    onChange([...fields, {
      key: '',
      label_tr: '',
      label_en: '',
      type: 'text',
      required: false
    }]);
    setEditingIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<VariantField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  const applyTemplate = (template: any) => {
    onChange(template.fields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Varyant Alanları</h3>
          <p className="text-sm text-gray-600">Bu kategorideki ürün varyantlarında gösterilecek alanları tanımlayın</p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Alan Ekle</span>
        </button>
      </div>

      {templates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Hızlı Şablonlar</h4>
          <div className="flex gap-2 flex-wrap">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className="bg-white hover:bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm border border-blue-300"
                title={template.description}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p>Henüz varyant alanı tanımlanmadı</p>
          <p className="text-sm mt-2">Üstteki butonu kullanarak alan ekleyin veya hazır şablon seçin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alan Kodu (Key) *
                  </label>
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => updateField(index, { key: e.target.value })}
                    placeholder="power, lumen, vb."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Türkçe Etiket *
                  </label>
                  <input
                    type="text"
                    value={field.label_tr}
                    onChange={(e) => updateField(index, { label_tr: e.target.value })}
                    placeholder="Güç"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    İngilizce Etiket *
                  </label>
                  <input
                    type="text"
                    value={field.label_en}
                    onChange={(e) => updateField(index, { label_en: e.target.value })}
                    placeholder="Power"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tip
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value as 'text' | 'number' })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="text">Metin</option>
                    <option value="number">Sayı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Birim (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={field.unit || ''}
                    onChange={(e) => updateField(index, { unit: e.target.value })}
                    placeholder="W, kg, m³"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={field.required || false}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-gray-700">Zorunlu Alan</span>
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    title="Yukarı Taşı"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    title="Aşağı Taşı"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
        <p className="text-sm text-yellow-800">
          <strong>Not:</strong> Bu alanlar sadece bu kategorideki ürünlerin varyantlarında gösterilecektir.
          Mevcut varyantların custom_fields değerlerini bu alanlara göre güncellemeniz gerekebilir.
        </p>
      </div>
    </div>
  );
};

export default CategoryVariantFieldsEditor;
