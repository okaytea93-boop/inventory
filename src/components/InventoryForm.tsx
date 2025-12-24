import { useState, useEffect } from 'react';
import { InventoryItem, InventoryFormData, SizeVariant } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Upload, X } from 'lucide-react';

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryFormData) => void;
  editingItem?: InventoryItem | null;
}

interface VariantFormData {
  size: string;
  inStock: boolean;
  quantity: number;
  location: string;
}

export function InventoryForm({ isOpen, onClose, onSubmit, editingItem }: InventoryFormProps) {
  const [sku, setSku] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [variants, setVariants] = useState<VariantFormData[]>([
    { size: '', inStock: true, quantity: 0, location: '' }
  ]);

  useEffect(() => {
    if (editingItem) {
      setSku(editingItem.sku);
      setTitle(editingItem.title);
      setImageUrl(editingItem.imageUrl || '');
      setImageFile(null);
      setVariants(editingItem.variants.map(v => ({
        size: v.size,
        inStock: v.inStock,
        quantity: v.quantity,
        location: v.location,
      })));
    } else {
      setSku('');
      setTitle('');
      setImageUrl('');
      setImageFile(null);
      setVariants([{ size: '', inStock: true, quantity: 0, location: '' }]);
    }
  }, [editingItem, isOpen]);

  const processImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setImageFile(null);
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', inStock: true, quantity: 0, location: '' }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: keyof VariantFormData, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证至少有一个有效的尺寸变体
    const validVariants = variants.filter(v => v.size.trim() !== '');
    if (validVariants.length === 0) {
      return;
    }

    const formData: InventoryFormData = {
      sku,
      title,
      imageUrl: imageUrl || undefined,
      variants: validVariants.map((v, index) => ({
        id: editingItem?.variants[index]?.id || `${Date.now()}-${index}`,
        size: v.size,
        inStock: v.inStock,
        quantity: v.quantity,
        location: v.location,
      })),
    };

    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? '编辑库存' : '添加库存'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* SKU和产品名称 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-001"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">产品名称 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="产品名称"
                  required
                />
              </div>
            </div>

            {/* 图片上传 */}
            <div className="grid gap-2">
              <Label>产品图片</Label>
              <div className="space-y-2">
                {imageUrl ? (
                  <div className="relative w-32 h-32 rounded-lg border border-border overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt="产品预览" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${
                      isDragging ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="text-sm text-foreground mb-1">
                      {isDragging ? '松开以上传图片' : '拖拽图片到此处'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">或</p>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>点击选择图片</span>
                      </Button>
                    </label>
                    <div className="mt-3 pt-3 border-t border-border">
                      <Input
                        type="url"
                        placeholder="或输入图片URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 尺寸变体 */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>尺寸变体 *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加尺寸
                </Button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {variants.map((variant, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        尺寸 {index + 1}
                      </span>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                          className="h-6 px-2 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">尺寸</Label>
                        <Input
                          value={variant.size}
                          onChange={(e) => updateVariant(index, 'size', e.target.value)}
                          placeholder="M / L / XL"
                          required
                          className="h-9"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">数量</Label>
                        <Input
                          type="number"
                          min="0"
                          value={variant.quantity}
                          onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                          required
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">库位</Label>
                        <Input
                          value={variant.location}
                          onChange={(e) => updateVariant(index, 'location', e.target.value)}
                          placeholder="A1-B2"
                          required={variant.quantity > 0}
                          className="h-9"
                        />
                      </div>
                      <div className="flex items-end pb-1">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={variant.inStock}
                            onCheckedChange={(checked) => updateVariant(index, 'inStock', checked)}
                          />
                          <Label className="text-xs">有货</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">
              {editingItem ? '更新' : '添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
