import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InventoryFormData, CustomFieldDefinition } from '@/types/inventory';
import { Plus, Check, X, Upload, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickAddRowProps {
  onAdd: (data: InventoryFormData) => void;
  onCancel: () => void;
  customFields: CustomFieldDefinition[];
}

export function QuickAddRow({ onAdd, onCancel, customFields }: QuickAddRowProps) {
  const [sku, setSku] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sizes, setSizes] = useState<Array<{ size: string; quantity: string; location: string }>>([
    { size: '', quantity: '0', location: '' }
  ]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleAddSize = () => {
    setSizes([...sizes, { size: '', quantity: '0', location: '' }]);
  };

  const handleRemoveSize = (index: number) => {
    if (sizes.length > 1) {
      setSizes(sizes.filter((_, i) => i !== index));
    }
  };

  const handleSizeChange = (index: number, field: 'size' | 'quantity' | 'location', value: string) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // 验证必填字段
    if (!sku.trim()) {
      toast({
        title: '验证错误',
        description: 'SKU 不能为空',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: '验证错误',
        description: '产品名称不能为空',
        variant: 'destructive',
      });
      return;
    }

    // 验证至少有一个尺寸
    const validSizes = sizes.filter(s => s.size.trim());
    if (validSizes.length === 0) {
      toast({
        title: '验证错误',
        description: '至少需要一个尺寸',
        variant: 'destructive',
      });
      return;
    }

    // 构建数据
    const formData: InventoryFormData = {
      sku: sku.trim(),
      title: title.trim(),
      imageUrl: imageUrl || undefined,
      variants: validSizes.map((s, index) => ({
        id: `temp-${index}`,
        size: s.size.trim(),
        quantity: parseInt(s.quantity) || 0,
        inStock: (parseInt(s.quantity) || 0) > 0,
        location: s.location.trim(),
      })),
      customFields: customFieldValues,
    };

    onAdd(formData);
  };

  return (
    <tr className="bg-primary/5 border-2 border-primary animate-fade-in">
      {/* 图片上传 */}
      <td className="px-4 py-4 align-top">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="quick-add-image"
        />
        <label
          htmlFor="quick-add-image"
          className="relative w-[120px] h-[120px] rounded border-2 border-dashed border-primary cursor-pointer group overflow-hidden flex items-center justify-center bg-muted/50 hover:bg-muted transition-all"
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="预览" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Package className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">上传图片</span>
            </div>
          )}
        </label>
      </td>

      {/* SKU */}
      <td className="px-4 py-4 align-top">
        <Input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU-XXX"
          className="h-7 text-sm font-mono"
        />
      </td>

      {/* 产品名称 */}
      <td className="px-4 py-4 align-top">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入产品名称"
          className="h-7 text-sm"
        />
      </td>

      {/* 尺寸 */}
      <td className="px-4 py-4 align-top">
        <div className="space-y-2">
          {sizes.map((size, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                value={size.size}
                onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                placeholder="尺寸"
                className="h-7 text-sm w-20"
              />
              <Input
                type="number"
                value={size.quantity}
                onChange={(e) => handleSizeChange(index, 'quantity', e.target.value)}
                placeholder="数量"
                className="h-7 text-sm w-20"
                min="0"
              />
              {sizes.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleRemoveSize(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSize}
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            添加尺寸
          </Button>
        </div>
      </td>

      {/* 库位 */}
      <td className="px-4 py-4 align-top">
        <div className="space-y-2">
          {sizes.map((size, index) => (
            <Input
              key={index}
              type="text"
              value={size.location}
              onChange={(e) => handleSizeChange(index, 'location', e.target.value)}
              placeholder="库位"
              className="h-7 text-sm"
            />
          ))}
        </div>
      </td>

      {/* 自定义字段 */}
      {customFields.map((field) => (
        <td key={field.id} className="px-4 py-4 align-top">
          <Input
            type={field.type}
            value={customFieldValues[field.id] || ''}
            onChange={(e) => setCustomFieldValues({
              ...customFieldValues,
              [field.id]: e.target.value
            })}
            placeholder={field.label}
            className="h-7 text-sm"
          />
        </td>
      ))}

      {/* 操作按钮 */}
      <td className="px-4 py-4 align-top">
        <div className="flex justify-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            className="hover:bg-primary/90"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
