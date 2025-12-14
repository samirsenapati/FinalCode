'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Image, FileText, Film, Music, X, Copy, Check, Loader2, Trash2 } from 'lucide-react';

interface UploadedAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: string;
  url: string;
  uploadedAt: Date;
}

interface AssetUploaderProps {
  onAssetUploaded?: (asset: UploadedAsset) => void;
  maxFileSize?: number;
}

const FILE_TYPE_ICONS = {
  image: { icon: Image, color: 'text-green-400' },
  video: { icon: Film, color: 'text-purple-400' },
  audio: { icon: Music, color: 'text-blue-400' },
  document: { icon: FileText, color: 'text-orange-400' },
};

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetUploader({ onAssetUploaded, maxFileSize = 10 * 1024 * 1024 }: AssetUploaderProps) {
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${formatFileSize(maxFileSize)}`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const objectUrl = URL.createObjectURL(file);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setUploadProgress(100);

      const newAsset: UploadedAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: getFileType(file.type),
        size: formatFileSize(file.size),
        url: objectUrl,
        uploadedAt: new Date(),
      };

      setAssets(prev => [newAsset, ...prev]);
      onAssetUploaded?.(newAsset);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      setError('Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [maxFileSize, onAssetUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const copyUrl = async (asset: UploadedAsset) => {
    await navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  return (
    <div className="flex flex-col h-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          mx-3 mt-3 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
          ${isDragOver 
            ? 'border-[#58a6ff] bg-[#58a6ff]/10' 
            : 'border-[#30363d] hover:border-[#6e7681] hover:bg-[#161b22]'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin" />
              <div className="text-sm text-[#c9d1d9]">Uploading... {uploadProgress}%</div>
              <div className="w-full bg-[#21262d] rounded-full h-1.5">
                <div
                  className="bg-[#58a6ff] h-1.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#6e7681]" />
              <div className="text-sm text-[#c9d1d9]">
                Drop files here or <span className="text-[#58a6ff]">browse</span>
              </div>
              <div className="text-xs text-[#6e7681]">
                Max {formatFileSize(maxFileSize)} per file
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mt-3">
        {assets.length === 0 ? (
          <div className="px-3 py-8 text-center text-[#6e7681] text-sm">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No assets uploaded</p>
            <p className="text-xs mt-1">Upload images, videos, or documents</p>
          </div>
        ) : (
          <div className="px-3 space-y-2">
            {assets.map(asset => {
              const { icon: Icon, color } = FILE_TYPE_ICONS[asset.type];
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-2 bg-[#0d1117] border border-[#21262d] rounded-lg group"
                >
                  {asset.type === 'image' ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className={`w-10 h-10 flex items-center justify-center bg-[#161b22] rounded ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#c9d1d9] truncate">{asset.name}</div>
                    <div className="text-xs text-[#6e7681]">{asset.size}</div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyUrl(asset)}
                      className="p-1.5 hover:bg-[#21262d] rounded"
                      title="Copy URL"
                    >
                      {copiedId === asset.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#8b949e]" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
