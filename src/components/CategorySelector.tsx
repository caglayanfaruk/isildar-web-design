import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Category } from '../lib/supabase';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  translations?: {
    name: string;
  };
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onChange: (categoryIds: string[], primaryId?: string) => void;
  currentLanguage?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryIds,
  onChange,
  currentLanguage = 'tr'
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryWithChildren[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | undefined>(
    selectedCategoryIds[0]
  );

  useEffect(() => {
    buildHierarchy();
  }, [categories]);

  const buildHierarchy = () => {
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      if (!category) return;

      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent && parent.children) {
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    setHierarchicalCategories(rootCategories);
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedIds(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    let newSelected: string[];

    if (selectedCategoryIds.includes(categoryId)) {
      newSelected = selectedCategoryIds.filter(id => id !== categoryId);

      if (primaryCategoryId === categoryId && newSelected.length > 0) {
        setPrimaryCategoryId(newSelected[0]);
        onChange(newSelected, newSelected[0]);
      } else if (newSelected.length === 0) {
        setPrimaryCategoryId(undefined);
        onChange(newSelected, undefined);
      } else {
        onChange(newSelected, primaryCategoryId);
      }
    } else {
      newSelected = [...selectedCategoryIds, categoryId];

      if (!primaryCategoryId) {
        setPrimaryCategoryId(categoryId);
        onChange(newSelected, categoryId);
      } else {
        onChange(newSelected, primaryCategoryId);
      }
    }
  };

  const setPrimary = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrimaryCategoryId(categoryId);
    onChange(selectedCategoryIds, categoryId);
  };

  const renderCategory = (category: CategoryWithChildren, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);
    const isSelected = selectedCategoryIds.includes(category.id);
    const isPrimary = primaryCategoryId === category.id;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 rounded cursor-pointer ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
              className="mr-1 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-5 mr-1"></span>
          )}

          <div
            onClick={() => toggleCategory(category.id)}
            className="flex-1 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                {category.translations?.name || category.slug}
              </span>
            </div>

            {isSelected && (
              <button
                type="button"
                onClick={(e) => setPrimary(category.id, e)}
                className={`ml-2 px-2 py-1 text-xs rounded ${
                  isPrimary
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-yellow-400 hover:text-white'
                }`}
                title={isPrimary ? 'Ana kategori' : 'Ana kategori yap'}
              >
                {isPrimary ? 'Ana' : 'Ana Yap'}
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
      {hierarchicalCategories.length > 0 ? (
        <div className="p-2">
          {hierarchicalCategories.map(category => renderCategory(category))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 text-sm">
          Kategori bulunamadı
        </div>
      )}

      {selectedCategoryIds.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-xs text-gray-600 mb-1">
            Seçili kategoriler: {selectedCategoryIds.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategoryIds.map(id => {
              const category = categories.find(c => c.id === id);
              if (!category) return null;

              return (
                <span
                  key={id}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                    primaryCategoryId === id
                      ? 'bg-yellow-500 text-white'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {category.translations?.name || category.slug}
                  {primaryCategoryId === id && (
                    <span className="ml-1 text-xs">(Ana)</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
