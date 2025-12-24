export interface SizeVariant {
  id: string;
  size: string;
  inStock: boolean;
  quantity: number;
  location: string;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number';
}

export interface InventoryItem {
  id: string;
  sku: string;
  title: string;
  imageUrl?: string;
  variants: SizeVariant[];
  customFields?: Record<string, string | number>;
}

export type InventoryFormData = Omit<InventoryItem, 'id'>;
