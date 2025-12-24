import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { loadInventoryData, saveInventoryData, ensureUserRow } from "./lib/inventoryApi";
import { InventoryItem, InventoryFormData, CustomFieldDefinition } from "./types/inventory";
import { StatCard } from "./components/StatCard";
import { InventoryTable } from "./components/InventoryTable";
import { InventoryForm } from "./components/InventoryForm";
import { CSVImportDialog } from "./components/CSVImportDialog";
import { CustomFieldsManager } from "./components/CustomFieldsManager";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Package, AlertTriangle, MapPin, Plus, Search, Upload, Download, Settings, LogOut } from "lucide-react";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";

function App() {
  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Data
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // UX
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Refs
  const hasLoadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  const storageKey = useMemo(() => {
    return user?.id ? `inventory_cache_${user.id}` : "inventory_cache_guest";
  }, [user?.id]);

  const writeCache = useCallback(
    (nextItems: InventoryItem[], nextFields: CustomFieldDefinition[]) => {
      if (!user?.id) return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            inventory: nextItems ?? [],
            custom_fields: nextFields ?? [],
            cached_at: new Date().toISOString(),
          })
        );
      } catch {}
    },
    [storageKey, user?.id]
  );

  const readCache = useCallback(() => {
    if (!user?.id) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        inventory: (parsed.inventory as InventoryItem[]) ?? [],
        custom_fields: (parsed.custom_fields as CustomFieldDefinition[]) ?? [],
      };
    } catch {
      return null;
    }
  }, [storageKey, user?.id]);

  const saveNow = useCallback(
    async (reason?: string) => {
      if (!user?.id || !hasLoadedRef.current) return;
      if (!dirtyRef.current) return;

      // 立刻清掉定时器，避免重复保存
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      try {
        setIsSaving(true);
        await saveInventoryData(user.id, items, customFields);
        dirtyRef.current = false;
        // console.log("✅ saved", reason);
      } catch (e: any) {
        toast({
          title: "保存失败",
          description: e?.message || "无法保存数据，请检查网络",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, items, customFields, toast]
  );

  const scheduleSave = useCallback(
    (ms = 300) => {
      if (!user?.id || !hasLoadedRef.current) return;
      dirtyRef.current = true;

      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        void saveNow("debounced");
      }, ms);
    },
    [saveNow, user?.id]
  );

  const loadUserData = useCallback(
    async (userId: string) => {
      try {
        // 1) 先用缓存秒开（减少“空白/卡”）
        const cached = readCache();
        if (cached) {
          setItems(cached.inventory);
          setCustomFields(cached.custom_fields);
        }

        // 2) 确保行存在
        await ensureUserRow(userId);

        // 3) 再从 Supabase 拉最新
        const remote = await loadInventoryData(userId);
        setItems(remote.inventory ?? []);
        setCustomFields(remote.custom_fields ?? []);

        // 4) 写回缓存
        writeCache(remote.inventory ?? [], remote.custom_fields ?? []);
        hasLoadedRef.current = true;
        dirtyRef.current = false;
      } catch (e: any) {
        toast({
          title: "加载失败",
          description: e?.message || "无法加载数据",
          variant: "destructive",
        });
      }
    },
    [readCache, toast, writeCache]
  );

  // Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        void loadUserData(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        hasLoadedRef.current = false;
        void loadUserData(session.user.id);
      } else {
        setUser(null);
        setItems([]);
        setCustomFields([]);
        hasLoadedRef.current = false;
        dirtyRef.current = false;
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // whenever data changes: write cache immediately + schedule save
  useEffect(() => {
    if (!user?.id || !hasLoadedRef.current) return;
    writeCache(items, customFields);
    scheduleSave(300);
  }, [items, customFields, scheduleSave, user?.id, writeCache]);

  // Try flush when leaving page / tab hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void saveNow("visibility");
      }
    };
    const onBeforeUnload = () => {
      // 尽力保存（浏览器不保证一定完成，但比不做强）
      void saveNow("beforeunload");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [saveNow]);

  // Auth actions
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "登录成功", description: "欢迎回来！" });
    } catch (e: any) {
      toast({ title: "登录失败", description: e?.message || "请检查邮箱和密码", variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({ title: "注册成功", description: "注册成功，已可直接登录使用" });
    } catch (e: any) {
      toast({ title: "注册失败", description: e?.message || "请重试", variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "已退出登录", description: "再见！" });
  };

  // Derived
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.variants.some((v) => v.size.toLowerCase().includes(q) || v.location.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const allVariants = items.flatMap((i) => i.variants);
    const lowStockItems = allVariants.filter((v) => v.quantity > 0 && v.quantity < 10).length;
    const totalQuantity = allVariants.reduce((sum, v) => sum + v.quantity, 0);
    const uniqueLocations = new Set(allVariants.map((v) => v.location).filter(Boolean)).size;
    return { totalItems, lowStockItems, totalQuantity, uniqueLocations };
  }, [items]);

  // Mutations (关键动作：改完立刻 saveNow，避免刷新丢)
  const handleAddItem = (data: InventoryFormData) => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      ...data,
      customFields: data.customFields || {},
    };
    setItems((prev) => [...prev, newItem]);
    toast({ title: "添加成功", description: `已添加库存: ${data.title} (${data.variants.length} 个尺寸)` });
    // 关键动作：立刻保存
    setTimeout(() => void saveNow("addItem"), 0);
  };

  const handleEditItem = (data: InventoryFormData) => {
    if (!editingItem) return;
    setItems((prev) => prev.map((it) => (it.id === editingItem.id ? { ...it, ...data } : it)));
    toast({ title: "更新成功", description: `已更新库存: ${data.title}` });
    setEditingItem(null);
    setTimeout(() => void saveNow("editItem"), 0);
  };

  const handleDeleteItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "删除成功", description: `已删除库存: ${it?.title}`, variant: "destructive" });
    setTimeout(() => void saveNow("deleteItem"), 0);
  };

  const handleImageUpload = (itemId: string, imageUrl: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, imageUrl } : it)));
    scheduleSave(300);
  };

  const handleUpdateQuantity = (itemId: string, variantId: string, newQuantity: number) => {
    const quantity = Math.max(0, newQuantity);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          variants: item.variants.map((v) =>
            v.id === variantId ? { ...v, quantity, inStock: quantity > 0 } : v
          ),
        };
      })
    );
    // 输入类：debounce 保存就行
    scheduleSave(250);
  };

  const handleUpdateLocation = (itemId: string, variantId: string, newLocation: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          variants: item.variants.map((v) => (v.id === variantId ? { ...v, location: newLocation } : v)),
        };
      })
    );
    scheduleSave(250);
  };

  const handleUpdateSKU = (itemId: string, newSKU: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, sku: newSKU } : it)));
    scheduleSave(250);
  };

  const handleUpdateTitle = (itemId: string, newTitle: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, title: newTitle } : it)));
    scheduleSave(250);
  };

  const handleAddVariant = (itemId: string, size: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newVariant = {
          id: `${itemId}-${Date.now()}`,
          size,
          quantity: 0,
          inStock: false,
          location: "",
        };
        return { ...item, variants: [...item.variants, newVariant] };
      })
    );
    toast({ title: "添加成功", description: `已添加尺寸: ${size}` });
    setTimeout(() => void saveNow("addVariant"), 0);
  };

  const handleDeleteVariant = (itemId: string, variantId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.variants.length <= 1) {
          toast({ title: "无法删除", description: "产品至少需要保留一个尺寸", variant: "destructive" });
          return item;
        }
        const variant = item.variants.find((v) => v.id === variantId);
        toast({ title: "删除成功", description: `已删除尺寸: ${variant?.size}` });
        return { ...item, variants: item.variants.filter((v) => v.id !== variantId) };
      })
    );
    setTimeout(() => void saveNow("deleteVariant"), 0);
  };

  const openEditForm = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };
  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleCSVImport = (importedItems: Omit<InventoryItem, "id">[]) => {
    const newItems = importedItems.map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
    }));
    setItems((prev) => [...prev, ...newItems]);
    const totalVariants = newItems.reduce((sum, it) => sum + it.variants.length, 0);
    toast({ title: "导入成功", description: `成功导入 ${newItems.length} 个产品，共 ${totalVariants} 个尺寸变体` });
    setTimeout(() => void saveNow("csvImport"), 0);
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast({ title: "无数据", description: "当前没有数据可以导出", variant: "destructive" });
      return;
    }
    const headers = "SKU,TITLE,SIZE,IN STOCK,QUANTITY,LOCATION,IMAGE_URL";
    const rows = items.flatMap((item) =>
      item.variants.map(
        (variant) =>
          `${item.sku},${item.title},${variant.size},${variant.inStock},${variant.quantity},${variant.location},${item.imageUrl || ""}`
      )
    );
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);

    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${timestamp}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "导出成功", description: `已导出 ${items.length} 个产品的数据` });
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Package className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">库存管理系统</h1>
            <p className="text-muted-foreground">登录以管理您的库存数据</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex gap-2 mb-6">
              <Button
                variant={authMode === "signin" ? "default" : "outline"}
                onClick={() => setAuthMode("signin")}
                className="flex-1"
              >
                登录
              </Button>
              <Button
                variant={authMode === "signup" ? "default" : "outline"}
                onClick={() => setAuthMode("signup")}
                className="flex-1"
              >
                注册
              </Button>
            </div>

            <form onSubmit={authMode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={authLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={authLoading}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? "处理中..." : authMode === "signin" ? "登录" : "注册"}
              </Button>
            </form>
          </div>

          <Toaster />
        </div>
      </div>
    );
  }

  // Main
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 animate-fade-in flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">库存管理系统</h1>
            <p className="text-muted-foreground">
              {user.email}
              {isSaving && <span className="ml-2 text-xs text-primary">● 保存中...</span>}
              {!isSaving && hasLoadedRef.current && !dirtyRef.current && (
                <span className="ml-2 text-xs text-muted-foreground">已保存</span>
              )}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="总库存项" value={stats.totalItems} icon={Package} description="所有产品类型" />
          <StatCard title="库存偏低" value={stats.lowStockItems} icon={AlertTriangle} description="需要补货" />
          <StatCard title="总数量" value={stats.totalQuantity} icon={Package} description="所有产品总和" />
          <StatCard title="库位数量" value={stats.uniqueLocations} icon={MapPin} description="使用中的库位" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="搜索 SKU、名称、尺寸或库位..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCSVImportOpen(true)} variant="outline" className="sm:w-auto">
            <Upload className="w-4 h-4 mr-2" />
            导入CSV
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            导出CSV
          </Button>
          <Button onClick={() => setIsCustomFieldsOpen(true)} variant="outline" className="sm:w-auto">
            <Settings className="w-4 h-4 mr-2" />
            自定义字段
          </Button>
          <Button onClick={openAddForm} className="sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            添加库存
          </Button>
        </div>

        <InventoryTable
          items={filteredItems}
          onEdit={openEditForm}
          onDelete={handleDeleteItem}
          onImageUpload={handleImageUpload}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateLocation={handleUpdateLocation}
          onUpdateSKU={handleUpdateSKU}
          onUpdateTitle={handleUpdateTitle}
          onAdd={handleAddItem}
          onAddVariant={handleAddVariant}
          onDeleteVariant={handleDeleteVariant}
          customFields={customFields}
        />

        <InventoryForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSubmit={editingItem ? handleEditItem : handleAddItem}
          editingItem={editingItem}
        />

        <CSVImportDialog isOpen={isCSVImportOpen} onClose={() => setIsCSVImportOpen(false)} onImport={handleCSVImport} />

        <CustomFieldsManager
          isOpen={isCustomFieldsOpen}
          onClose={() => {
            setIsCustomFieldsOpen(false);
            // 关闭也算关键动作：立刻保存一次，避免你刚改完就刷新
            setTimeout(() => void saveNow("customFieldsClose"), 0);
          }}
          fields={customFields}
          onUpdateFields={(next) => {
            setCustomFields(next);
            setTimeout(() => void saveNow("customFieldsUpdate"), 0);
          }}
        />

        <Toaster />
      </div>
    </div>
  );
}

export default App;
