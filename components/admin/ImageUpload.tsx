'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
}

export default function ImageUpload({ 
  value, 
  onChange, 
  folder = 'uploads',
  label = 'Image',
  aspectRatio = 'video'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          toast.error('Storage bucket "public" not configured. See setup instructions.');
          console.error('Storage bucket not found. Please create a "public" bucket in Supabase Storage with public access.');
        } else {
          throw uploadError;
        }
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className={`w-48 ${aspectClasses[aspectRatio]} object-cover rounded-lg border border-gray-800`}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id={`image-upload-${folder}`}
          />
          <label
            htmlFor={`image-upload-${folder}`}
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#d4a017] transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400">Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={20} className="text-gray-400" />
                <span className="text-gray-400">Upload image</span>
              </>
            )}
          </label>
          
          <span className="text-gray-500 text-sm self-center">or</span>
          
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm"
            placeholder="Paste image URL"
          />
        </div>
      )}
    </div>
  );
}

