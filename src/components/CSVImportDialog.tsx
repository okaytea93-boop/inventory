import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, FileText, AlertCircle, Download } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface CSVImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Omit<InventoryItem, 'id'>[]) => void;
}

export function CSVImportDialog({ isOpen, onClose, onImport }: CSVImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('请选择CSV文件');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const parseCSV = (text: string): Omit<InventoryItem, 'id'>[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV文件为空或格式不正确');
    }

    // 跳过表头
    const dataLines = lines.slice(1);
    const itemsMap = new Map<string, Omit<InventoryItem, 'id'>>();

    dataLines.forEach((line, index) => {
      try {
        // 处理CSV的引号包裹字段
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        fields.push(current.trim());

        if (fields.length < 6) {
          console.warn(`第 ${index + 2} 行格式不正确，已跳过`);
          return;
        }

        const [sku, title, sizeStr, inStockStr, quantityStr, location, imageUrl] = fields;

        // 解析尺寸（支持逗号分隔的多个尺寸）
        const sizes = sizeStr.split(',').map(s => s.trim()).filter(s => s);

        // 解析库存状态
        const inStock = inStockStr.toLowerCase() === 'true' || inStockStr === '1';

        // 解析数量
        const quantity = parseInt(quantityStr) || 0;

        const skuKey = sku.trim();
        
        // 如果SKU已存在，添加到variants，否则创建新项
        if (itemsMap.has(skuKey)) {
          const existingItem = itemsMap.get(skuKey)!;
          sizes.forEach(size => {
            existingItem.variants.push({
              id: `${Date.now()}-${Math.random()}`,
              size,
              inStock,
              quantity,
              location: location.trim(),
            });
          });
        } else {
          // 创建新的库存项
          const newItem: Omit<InventoryItem, 'id'> = {
            sku: skuKey,
            title: title.trim(),
            imageUrl: imageUrl?.trim() || undefined,
            variants: sizes.map(size => ({
              id: `${Date.now()}-${Math.random()}`,
              size,
              inStock,
              quantity,
              location: location.trim(),
            })),
          };
          itemsMap.set(skuKey, newItem);
        }
      } catch (err) {
        console.error(`解析第 ${index + 2} 行时出错:`, err);
      }
    });

    return Array.from(itemsMap.values());
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('请先选择文件');
      return;
    }

    try {
      const text = await selectedFile.text();
      const items = parseCSV(text);

      if (items.length === 0) {
        setError('未找到有效数据');
        return;
      }

      onImport(items);
      setSelectedFile(null);
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    onClose();
  };

  const downloadTemplate = () => {
    // 创建CSV模板内容
    const csvContent = [
      'SKU,TITLE,SIZE,IN STOCK,QUANTITY,LOCATION,IMAGE_URL',
      'SKU-001,经典白色T恤,"M,L,XL",true,50,A1-B2,https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      'SKU-002,蓝色牛仔裤,30,true,15,A2-C1,https://images.unsplash.com/photo-1542272454315-7957f89e2ebc',
      'SKU-002,蓝色牛仔裤,32,true,20,A2-C2,',
      'SKU-003,黑色运动鞋,42,false,0,B1-A1,https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    ].join('\n');

    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>导入CSV文件</DialogTitle>
          <DialogDescription>
            上传CSV文件批量导入库存数据。相同SKU的行将自动合并为多个尺寸变体。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 下载模板按钮 */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              下载CSV模板
            </Button>
          </div>
          {/* 文件选择区域 */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">{selectedFile.name}</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  点击选择CSV文件
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  选择文件
                </Button>
              </div>
            )}
          </div>

          {/* 格式说明 */}
          <div className="bg-muted/50 rounded-lg p-4 text-xs space-y-2">
            <p className="font-semibold text-foreground">CSV格式要求：</p>
            <div className="font-mono text-muted-foreground space-y-1">
              <p>SKU,TITLE,SIZE,IN STOCK,QUANTITY,LOCATION,IMAGE_URL</p>
              <p>SKU-001,产品名称,"M,L,XL",true,50,A1-B2,https://...</p>
            </div>
            <p className="text-muted-foreground mt-2">
              • 尺寸字段可以包含多个值，用逗号分隔<br />
              • IN STOCK 字段: true/false 或 1/0<br />
              • IMAGE_URL 为可选字段<br />
              • 相同SKU的多行会自动合并为一个产品的多个尺寸变体
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button type="button" onClick={handleImport} disabled={!selectedFile}>
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
