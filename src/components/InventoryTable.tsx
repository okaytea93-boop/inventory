import { InventoryItem, InventoryFormData, CustomFieldDefinition } from '@/types/inventory';
import { Pencil, Trash2, Package, Upload, MapPin, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { QuickAddRow } from '@/components/QuickAddRow';
import { useRef, useState } from 'react';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onImageUpload: (itemId: string, imageUrl: string) => void;
  onUpdateQuantity: (itemId: string, variantId: string, newQuantity: number) => void;
  onUpdateLocation: (itemId: string, variantId: string, newLocation: string) => void;
  onUpdateSKU: (itemId: string, newSKU: string) => void;
  onUpdateTitle: (itemId: string, newTitle: string) => void;
  onAdd: (data: InventoryFormData) => void;
  onAddVariant: (itemId: string, size: string) => void;
  onDeleteVariant: (itemId: string, variantId: string) => void;
  customFields: CustomFieldDefinition[];
}

export function InventoryTable({ items, onEdit, onDelete, onImageUpload, onUpdateQuantity, onUpdateLocation, onUpdateSKU, onUpdateTitle, onAdd, onAddVariant, onDeleteVariant, customFields }: InventoryTableProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<{ itemId: string; variantId: string } | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  const [editingLocation, setEditingLocation] = useState<{ itemId: string; variantId: string } | null>(null);
  const [tempLocation, setTempLocation] = useState<string>('');
  const [editingSKU, setEditingSKU] = useState<string | null>(null);
  const [tempSKU, setTempSKU] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState<string>('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [addingVariant, setAddingVariant] = useState<string | null>(null);
  const [newVariantSize, setNewVariantSize] = useState<string>('');

  const handleImageClick = (itemId: string) => {
    fileInputRefs.current[itemId]?.click();
  };

  const handleImageChange = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(itemId, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingItemId(itemId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingItemId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingItemId(null);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(itemId, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuantityChange = (itemId: string, variantId: string, delta: number, currentQuantity: number) => {
    const newQuantity = currentQuantity + delta;
    onUpdateQuantity(itemId, variantId, newQuantity);
  };

  const startEditingQuantity = (itemId: string, variantId: string, currentQuantity: number) => {
    setEditingQuantity({ itemId, variantId });
    setTempQuantity(currentQuantity.toString());
  };

  const finishEditingQuantity = (itemId: string, variantId: string) => {
    const newQuantity = parseInt(tempQuantity) || 0;
    onUpdateQuantity(itemId, variantId, newQuantity);
    setEditingQuantity(null);
    setTempQuantity('');
  };

  const cancelEditingQuantity = () => {
    setEditingQuantity(null);
    setTempQuantity('');
  };

  const startEditingLocation = (itemId: string, variantId: string, currentLocation: string) => {
    setEditingLocation({ itemId, variantId });
    setTempLocation(currentLocation);
  };

  const finishEditingLocation = (itemId: string, variantId: string) => {
    onUpdateLocation(itemId, variantId, tempLocation);
    setEditingLocation(null);
    setTempLocation('');
  };

  const cancelEditingLocation = () => {
    setEditingLocation(null);
    setTempLocation('');
  };

  const startEditingSKU = (itemId: string, currentSKU: string) => {
    setEditingSKU(itemId);
    setTempSKU(currentSKU);
  };

  const finishEditingSKU = (itemId: string) => {
    if (tempSKU.trim()) {
      onUpdateSKU(itemId, tempSKU.trim());
    }
    setEditingSKU(null);
    setTempSKU('');
  };

  const cancelEditingSKU = () => {
    setEditingSKU(null);
    setTempSKU('');
  };

  const startEditingTitle = (itemId: string, currentTitle: string) => {
    setEditingTitle(itemId);
    setTempTitle(currentTitle);
  };

  const finishEditingTitle = (itemId: string) => {
    if (tempTitle.trim()) {
      onUpdateTitle(itemId, tempTitle.trim());
    }
    setEditingTitle(null);
    setTempTitle('');
  };

  const cancelEditingTitle = () => {
    setEditingTitle(null);
    setTempTitle('');
  };

  const handleQuickAdd = (data: InventoryFormData) => {
    onAdd(data);
    setShowQuickAdd(false);
  };

  const startAddingVariant = (itemId: string) => {
    setAddingVariant(itemId);
    setNewVariantSize('');
  };

  const finishAddingVariant = (itemId: string) => {
    if (newVariantSize.trim()) {
      onAddVariant(itemId, newVariantSize.trim());
    }
    setAddingVariant(null);
    setNewVariantSize('');
  };

  const cancelAddingVariant = () => {
    setAddingVariant(null);
    setNewVariantSize('');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">暂无库存数据</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* 移动端卡片视图 */}
      <div className="md:hidden space-y-4">
        {items.map((item) => {
          return (
            <div key={item.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="p-4 space-y-4">
                {/* 图片和基本信息 */}
                <div className="flex gap-4">
                  {/* 图片 */}
                  <input
                    ref={(el) => (fileInputRefs.current[item.id] = el)}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(item.id, e)}
                    className="hidden"
                  />
                  <div 
                    onClick={() => handleImageClick(item.id)}
                    onDragEnter={(e) => handleDragEnter(e, item.id)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, item.id)}
                    className={`relative flex-shrink-0 w-24 h-24 rounded border cursor-pointer group overflow-hidden transition-all ${
                      draggingItemId === item.id 
                        ? 'border-primary border-2 bg-primary/5' 
                        : 'border-border'
                    }`}
                  >
                    {item.imageUrl ? (
                      <>
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                          draggingItemId === item.id 
                            ? 'opacity-100' 
                            : 'opacity-0 active:opacity-100'
                        }`}>
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className={`w-full h-full bg-muted flex items-center justify-center transition-all ${
                        draggingItemId === item.id 
                          ? 'bg-primary/10' 
                          : ''
                      }`}>
                        {draggingItemId === item.id ? (
                          <Upload className="w-5 h-5 text-primary" />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 基本信息 */}
                  <div className="flex-1 min-w-0">
                    {editingSKU === item.id ? (
                      <Input
                        type="text"
                        value={tempSKU}
                        onChange={(e) => setTempSKU(e.target.value)}
                        onBlur={() => finishEditingSKU(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishEditingSKU(item.id);
                          if (e.key === 'Escape') cancelEditingSKU();
                        }}
                        className="h-6 text-xs font-mono mb-1"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEditingSKU(item.id, item.sku)}
                        className="font-mono text-xs text-muted-foreground mb-1 cursor-pointer hover:bg-muted px-2 py-0.5 rounded -mx-2"
                      >
                        {item.sku}
                      </div>
                    )}
                    {editingTitle === item.id ? (
                      <Input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={() => finishEditingTitle(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishEditingTitle(item.id);
                          if (e.key === 'Escape') cancelEditingTitle();
                        }}
                        className="h-7 text-base font-medium"
                        autoFocus
                      />
                    ) : (
                      <h3 
                        onClick={() => startEditingTitle(item.id, item.title)}
                        className="font-medium text-foreground text-base line-clamp-2 cursor-pointer hover:bg-muted px-2 py-0.5 rounded -mx-2"
                      >
                        {item.title}
                      </h3>
                    )}
                  </div>
                </div>

                {/* 尺寸变体列表 */}
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">库存明细</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startAddingVariant(item.id)}
                      className="h-6 text-xs px-2"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      添加尺寸
                    </Button>
                  </div>
                  {item.variants.map((variant) => {
                    const isEditingQty = editingQuantity?.itemId === item.id && editingQuantity?.variantId === variant.id;
                    const isEditingLoc = editingLocation?.itemId === item.id && editingLocation?.variantId === variant.id;
                    
                    return (
                      <div key={variant.id} className="py-3 px-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          {/* 尺寸 */}
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="font-mono text-base px-3 py-1 flex-shrink-0 font-semibold">
                              {variant.size}
                            </Badge>
                            {item.variants.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteVariant(item.id, variant.id)}
                                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                          
                          {/* 数量调整 */}
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-background"
                              onClick={() => handleQuantityChange(item.id, variant.id, -1, variant.quantity)}
                              disabled={variant.quantity === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            {isEditingQty ? (
                              <Input
                                type="number"
                                value={tempQuantity}
                                onChange={(e) => setTempQuantity(e.target.value)}
                                onBlur={() => finishEditingQuantity(item.id, variant.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') finishEditingQuantity(item.id, variant.id);
                                  if (e.key === 'Escape') cancelEditingQuantity();
                                }}
                                className="w-16 h-8 text-center text-base font-bold px-1"
                                autoFocus
                              />
                            ) : (
                              <div 
                                onClick={() => startEditingQuantity(item.id, variant.id, variant.quantity)}
                                className="cursor-pointer hover:bg-background px-3 py-1 rounded min-w-[2.5rem] text-center"
                              >
                                <span className="font-bold text-foreground text-lg">{variant.quantity}</span>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-background"
                              onClick={() => handleQuantityChange(item.id, variant.id, 1, variant.quantity)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* 库位 */}
                          <div className="flex items-center gap-1.5 flex-1 ml-2">
                            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            {isEditingLoc ? (
                              <Input
                                type="text"
                                value={tempLocation}
                                onChange={(e) => setTempLocation(e.target.value)}
                                onBlur={() => finishEditingLocation(item.id, variant.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') finishEditingLocation(item.id, variant.id);
                                  if (e.key === 'Escape') cancelEditingLocation();
                                }}
                                className="h-8 text-base flex-1"
                                placeholder="库位"
                                autoFocus
                              />
                            ) : (
                              <div 
                                onClick={() => startEditingLocation(item.id, variant.id, variant.location)}
                                className="cursor-pointer hover:bg-background px-2 py-1 rounded flex-1"
                              >
                                <span className="font-semibold text-foreground text-base">
                                  {variant.location || '点击添加'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );  
                  })}
                  {/* 添加新尺寸输入框 */}
                  {addingVariant === item.id && (
                    <div className="py-3 px-3 bg-primary/5 border-2 border-primary rounded-lg">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={newVariantSize}
                          onChange={(e) => setNewVariantSize(e.target.value)}
                          onBlur={() => finishAddingVariant(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishAddingVariant(item.id);
                            if (e.key === 'Escape') cancelAddingVariant();
                          }}
                          placeholder="输入尺寸，如: XL"
                          className="h-8 text-base flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelAddingVariant}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="flex-1"
                  >
                    <Pencil className="w-4 h-4 mr-1.5" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                    className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 桌面端表格视图 */}
      <div className="hidden md:block">
        {/* 快速添加按钮 */}
        {!showQuickAdd && (
          <div className="mb-4">
            <Button
              onClick={() => setShowQuickAdd(true)}
              variant="outline"
              className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              快速添加新行
            </Button>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-20">图片</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">产品名称</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">尺寸</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">库存位置</th>
                  {customFields.map((field) => (
                    <th key={field.id} className="px-4 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {showQuickAdd && (
                  <QuickAddRow
                    onAdd={handleQuickAdd}
                    onCancel={() => setShowQuickAdd(false)}
                    customFields={customFields}
                  />
                )}
                {items.map((item) => {
                  return (
                    <tr key={item.id} className="table-row">
                      <td className="px-4 py-4 align-top">
                        <input
                          ref={(el) => (fileInputRefs.current[item.id] = el)}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(item.id, e)}
                          className="hidden"
                        />
                        <div 
                          onClick={() => handleImageClick(item.id)}
                          onDragEnter={(e) => handleDragEnter(e, item.id)}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, item.id)}
                          className={`relative w-[120px] h-[120px] rounded border cursor-pointer group overflow-hidden transition-all ${
                            draggingItemId === item.id 
                              ? 'border-primary border-2 bg-primary/5 scale-110' 
                              : 'border-border'
                          }`}
                        >
                          {item.imageUrl ? (
                            <>
                              <img 
                                src={item.imageUrl} 
                                alt={item.title} 
                                className="w-full h-full object-cover"
                              />
                              <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                                draggingItemId === item.id 
                                  ? 'opacity-100' 
                                  : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                <Upload className="w-5 h-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className={`w-full h-full bg-muted flex items-center justify-center transition-all ${
                              draggingItemId === item.id 
                                ? 'bg-primary/10' 
                                : 'group-hover:bg-muted/80'
                            }`}>
                              {draggingItemId === item.id ? (
                                <Upload className="w-5 h-5 text-primary" />
                              ) : (
                                <>
                                  <Package className="w-6 h-6 text-muted-foreground group-hover:hidden" />
                                  <Upload className="w-5 h-5 text-muted-foreground hidden group-hover:block" />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {editingSKU === item.id ? (
                          <Input
                            type="text"
                            value={tempSKU}
                            onChange={(e) => setTempSKU(e.target.value)}
                            onBlur={() => finishEditingSKU(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') finishEditingSKU(item.id);
                              if (e.key === 'Escape') cancelEditingSKU();
                            }}
                            className="h-7 text-sm font-mono max-w-[150px]"
                            autoFocus
                          />
                        ) : (
                          <span 
                            onClick={() => startEditingSKU(item.id, item.sku)}
                            className="text-sm font-mono font-medium text-foreground cursor-pointer hover:bg-muted px-2 py-1 rounded inline-block"
                          >
                            {item.sku}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {editingTitle === item.id ? (
                          <Input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={() => finishEditingTitle(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') finishEditingTitle(item.id);
                              if (e.key === 'Escape') cancelEditingTitle();
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                        ) : (
                          <div 
                            onClick={() => startEditingTitle(item.id, item.title)}
                            className="text-sm text-foreground cursor-pointer hover:bg-muted px-2 py-1 rounded"
                          >
                            {item.title}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1">
                          {item.variants.map((variant) => {
                            const isEditingQty = editingQuantity?.itemId === item.id && editingQuantity?.variantId === variant.id;
                            
                            return (
                              <div key={variant.id} className="flex items-center gap-1 min-h-[28px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-foreground">{variant.size}:</span>
                                  {item.variants.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDeleteVariant(item.id, variant.id)}
                                      className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                  onClick={() => handleQuantityChange(item.id, variant.id, -1, variant.quantity)}
                                  disabled={variant.quantity === 0}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                {isEditingQty ? (
                                  <Input
                                    type="number"
                                    value={tempQuantity}
                                    onChange={(e) => setTempQuantity(e.target.value)}
                                    onBlur={() => finishEditingQuantity(item.id, variant.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEditingQuantity(item.id, variant.id);
                                      if (e.key === 'Escape') cancelEditingQuantity();
                                    }}
                                    className="w-16 h-6 text-center text-sm font-semibold px-1"
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    onClick={() => startEditingQuantity(item.id, variant.id, variant.quantity)}
                                    className="cursor-pointer hover:bg-muted px-2 rounded min-w-[2rem] text-center h-6 flex items-center justify-center"
                                  >
                                    <span className="text-sm font-semibold text-foreground">{variant.quantity}</span>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                  onClick={() => handleQuantityChange(item.id, variant.id, 1, variant.quantity)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            );
                          })}
                          {/* 添加新尺寸按钮 */}
                          {addingVariant === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={newVariantSize}
                                onChange={(e) => setNewVariantSize(e.target.value)}
                                onBlur={() => finishAddingVariant(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') finishAddingVariant(item.id);
                                  if (e.key === 'Escape') cancelAddingVariant();
                                }}
                                placeholder="输入尺寸"
                                className="h-6 text-sm w-20"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelAddingVariant}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startAddingVariant(item.id)}
                              className="h-6 text-xs px-2 hover:bg-primary/10 hover:text-primary"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              添加尺寸
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1">
                          {item.variants.map((variant) => {
                            const isEditingLoc = editingLocation?.itemId === item.id && editingLocation?.variantId === variant.id;
                            
                            return (
                              <div key={variant.id} className="min-h-[28px] flex items-center">
                                {isEditingLoc ? (
                                  <Input
                                    type="text"
                                    value={tempLocation}
                                    onChange={(e) => setTempLocation(e.target.value)}
                                    onBlur={() => finishEditingLocation(item.id, variant.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEditingLocation(item.id, variant.id);
                                      if (e.key === 'Escape') cancelEditingLocation();
                                    }}
                                    className="h-6 text-sm max-w-[150px]"
                                    placeholder="库位"
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    onClick={() => startEditingLocation(item.id, variant.id, variant.location)}
                                    className="cursor-pointer hover:bg-muted px-2 py-0.5 rounded flex-1"
                                  >
                                    <span className="text-sm text-foreground font-medium">
                                      {variant.location || '点击添加'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      {customFields.map((field) => (
                        <td key={field.id} className="px-4 py-4 align-top">
                          <Input
                            type={field.type}
                            value={(item.customFields?.[field.id] as string) || ''}
                            onChange={(e) => {
                              const updatedItem = {
                                ...item,
                                customFields: {
                                  ...item.customFields,
                                  [field.id]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                }
                              };
                              onEdit(updatedItem);
                            }}
                            placeholder={field.label}
                            className="h-7 text-sm max-w-[150px]"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="hover:bg-accent"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
