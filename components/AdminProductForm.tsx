'use client';

import React, { useState } from 'react';
import { createProduct, updateProduct, Product, ColorVariation } from '@/lib/supabase';
import { Plus, X, Upload, Image as ImageIcon, Trash2, Check } from 'lucide-react';

interface AdminProductFormProps {
  existingProduct?: Product;
  onSuccess: () => void;
  onCancel?: () => void;
}

const PRESET_COLORS = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Lime', hex: '#00FF00' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Beige', hex: '#F5F5DC' },
];

export default function AdminProductForm({ existingProduct, onSuccess, onCancel }: AdminProductFormProps) {
  const [title, setTitle] = useState(existingProduct?.title || '');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [price, setPrice] = useState(existingProduct?.price.toString() || '');
  const [selectedColors, setSelectedColors] = useState<Array<{ name: string; hex: string }>>(
    existingProduct?.variations?.map(v => ({ name: v.name, hex: v.hex })) || []
  );
  const [colorImages, setColorImages] = useState<Record<string, File[]>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const toggleColor = (color: { name: string; hex: string }) => {
    const exists = selectedColors.find(c => c.hex === color.hex);
    if (exists) {
      setSelectedColors(selectedColors.filter(c => c.hex !== color.hex));
      const newColorImages = { ...colorImages };
      delete newColorImages[color.name];
      setColorImages(newColorImages);
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleImageSelect = (colorName: string, files: FileList | null) => {
    if (!files) return;
    
    const filesArray = Array.from(files);
    setColorImages(prev => ({
      ...prev,
      [colorName]: [...(prev[colorName] || []), ...filesArray]
    }));
  };

  const removeImage = (colorName: string, index: number) => {
    setColorImages(prev => ({
      ...prev,
      [colorName]: prev[colorName].filter((_, i) => i !== index)
    }));
  };

  const uploadImagesForColor = async (productId: string, colorName: string, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('productId', productId);
    formData.append('colorName', colorName);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload images for ${colorName}: ${error}`);
    }

    const result = await response.json();
    return result.paths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedColors.length === 0) {
      alert('Please select at least one color');
      return;
    }

    // Validate that each color has at least one image
    for (const color of selectedColors) {
      if (!colorImages[color.name] || colorImages[color.name].length === 0) {
        alert(`Please upload at least one image for ${color.name}`);
        return;
      }
    }

    setUploading(true);

    try {
      // Step 1: Create product first (to get ID)
      const tempProduct = await createProduct({
        title,
        description,
        price: parseFloat(price),
        variations: [], // Will update after uploading images
      });

      const productId = tempProduct.id;

      // Step 2: Upload images for each color
      const variations: ColorVariation[] = [];

      for (const color of selectedColors) {
        setUploadProgress(prev => ({ ...prev, [color.name]: 0 }));
        
        const files = colorImages[color.name];
        const imagePaths = await uploadImagesForColor(productId, color.name, files);
        
        variations.push({
          name: color.name,
          hex: color.hex,
          images: imagePaths,
        });

        setUploadProgress(prev => ({ ...prev, [color.name]: 100 }));
      }

      // Step 3: Update product with variations
      await updateProduct(productId, { variations });

      alert('Product created successfully!');
      onSuccess();
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setSelectedColors([]);
      setColorImages({});
      setUploadProgress({});

    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please try again. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Product Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nike Air Max"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Stylish running shoes with premium comfort..."
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price ($) *
        </label>
        <input
          type="number"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="99.99"
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Colors * ({selectedColors.length} selected)
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-3">
          {PRESET_COLORS.map((color) => {
            const isSelected = selectedColors.some(c => c.hex === color.hex);
            return (
              <button
                key={color.hex}
                type="button"
                onClick={() => toggleColor(color)}
                className={`relative h-16 rounded-lg border-2 transition-all ${
                  isSelected ? 'border-blue-600 ring-2 ring-blue-200 scale-105' : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check size={24} className="text-white drop-shadow-lg" style={{
                      filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
                    }} />
                  </div>
                )}
                <span className="absolute -bottom-6 left-0 right-0 text-xs text-gray-600 text-center truncate px-1">
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Upload for Each Selected Color */}
      {selectedColors.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Upload Images for Each Color</h3>
          
          {selectedColors.map((color) => (
            <div key={color.hex} className="border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: color.hex }}
                ></div>
                <h4 className="font-semibold text-gray-900">{color.name}</h4>
                {uploadProgress[color.name] !== undefined && uploadProgress[color.name] < 100 && (
                  <span className="text-sm text-blue-600">Uploading {uploadProgress[color.name]}%</span>
                )}
              </div>

              {/* Image Preview */}
              {colorImages[color.name] && colorImages[color.name].length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {colorImages[color.name].map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`${color.name} ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(color.name, index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition">
                <Upload size={20} className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  Upload Images for {color.name}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleImageSelect(color.name, e.target.files)}
                  className="hidden"
                />
              </label>
              
              <p className="text-xs text-gray-500 mt-2">
                Accepted: JPG, PNG, WebP • Multiple images allowed
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={uploading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Creating Product...
            </span>
          ) : (
            'Create Product'
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}