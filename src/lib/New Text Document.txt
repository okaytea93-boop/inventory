// src/lib/inventoryApi.ts
import { supabase } from "./supabase";
import type { InventoryItem, CustomFieldDefinition } from "../types/inventory";

export type InventoryData = {
  inventory: InventoryItem[];
  custom_fields: CustomFieldDefinition[];
  updated_at?: string | null;
};

const TABLE = "inventory_data";

/**
 * 读取用户库存（没有记录就返回空）
 */
export async function loadInventoryData(userId: string): Promise<InventoryData> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("inventory, custom_fields, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { inventory: [], custom_fields: [], updated_at: null };
  }

  return {
    inventory: (data.inventory as InventoryItem[]) ?? [],
    custom_fields: (data.custom_fields as CustomFieldDefinition[]) ?? [],
    updated_at: (data.updated_at as string | null) ?? null,
  };
}

/**
 * 确保用户有一行（不会覆盖已有数据）
 * 用 upsert + ignoreDuplicates，避免 insert 抛重复键错误
 */
export async function ensureUserRow(userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        inventory: [],
        custom_fields: [],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: true,
      }
    );

  if (error) throw error;
}

/**
 * 保存用户库存（upsert）
 */
export async function saveInventoryData(
  userId: string,
  inventory: InventoryItem[],
  customFields: CustomFieldDefinition[]
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        inventory: inventory ?? [],
        custom_fields: customFields ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}
