import { useState } from 'react';
import { CustomFieldDefinition } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomFieldsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  fields: CustomFieldDefinition[];
  onUpdateFields: (fields: CustomFieldDefinition[]) => void;
}

export function CustomFieldsManager({ isOpen, onClose, fields, onUpdateFields }: CustomFieldsManagerProps) {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number'>('text');
  const { toast } = useToast();

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: '错误',
        description: '请输入字段名称',
        variant: 'destructive',
      });
      return;
    }

    const fieldId = newFieldName.toLowerCase().replace(/\s+/g, '_');
    
    if (fields.some(f => f.id === fieldId)) {
      toast({
        title: '错误',
        description: '该字段已存在',
        variant: 'destructive',
      });
      return;
    }

    const newField: CustomFieldDefinition = {
      id: fieldId,
      label: newFieldName.trim(),
      type: newFieldType,
    };

    onUpdateFields([...fields, newField]);
    setNewFieldName('');
    setNewFieldType('text');
    
    toast({
      title: '添加成功',
      description: `已添加自定义字段: ${newField.label}`,
    });
  };

  const handleDeleteField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    onUpdateFields(fields.filter(f => f.id !== fieldId));
    
    toast({
      title: '删除成功',
      description: `已删除字段: ${field?.label}`,
      variant: 'destructive',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            管理自定义字段
          </DialogTitle>
          <DialogDescription>
            添加或删除产品的自定义字段，如供应商、成本、备注等
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 添加新字段 */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-sm">添加新字段</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label htmlFor="fieldName">字段名称</Label>
                <Input
                  id="fieldName"
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="例如: 供应商"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddField();
                  }}
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="fieldType">字段类型</Label>
                <Select value={newFieldType} onValueChange={(value: 'text' | 'number') => setNewFieldType(value)}>
                  <SelectTrigger id="fieldType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文本</SelectItem>
                    <SelectItem value="number">数字</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end md:col-span-1">
                <Button onClick={handleAddField} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>
            </div>
          </div>

          {/* 现有字段列表 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">当前字段 ({fields.length})</h3>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无自定义字段
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-sm">{field.label}</div>
                        <div className="text-xs text-muted-foreground">
                          类型: {field.type === 'text' ? '文本' : '数字'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
