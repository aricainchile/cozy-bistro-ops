import { useState, useEffect, useRef } from "react";
import { Search, Plus, Edit2, Trash2, X, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount: number | null;
  category_id: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

const Products = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Product dialog
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDiscount, setFormDiscount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("📦");
  const [savingCat, setSavingCat] = useState(false);

  // Delete confirm
  const [deleteProduct, setDeleteProduct] = useState<string | null>(null);
  const [deleteCat, setDeleteCat] = useState<string | null>(null);

  const fetchData = async () => {
    const [catRes, prodRes] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("*").order("name"),
    ]);
    if (catRes.data) setCategories(catRes.data as Category[]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const ch = supabase
      .channel("products_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Filtered products
  const filtered = products.filter((p) => {
    const matchCat = activeCategory === "all" || p.category_id === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryName = (catId: string | null) => {
    if (!catId) return "Sin categoría";
    return categories.find((c) => c.id === catId)?.name ?? "Sin categoría";
  };

  const getCategoryIcon = (catId: string | null) => {
    if (!catId) return "📦";
    return categories.find((c) => c.id === catId)?.icon ?? "📦";
  };

  const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;

  // ========= Product CRUD =========
  const openCreateProduct = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormDiscount("");
    setFormCategory("");
    setFormImageFile(null);
    setFormImagePreview(null);
    setProductDialog(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDesc(p.description ?? "");
    setFormPrice(String(p.price));
    setFormDiscount(p.discount ? String(p.discount) : "");
    setFormCategory(p.category_id ?? "");
    setFormImageFile(null);
    setFormImagePreview(p.image_url);
    setProductDialog(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Error al subir imagen"); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveProduct = async () => {
    if (!formName.trim()) { toast.error("Nombre es obligatorio"); return; }
    const price = parseInt(formPrice);
    if (!price || price < 0) { toast.error("Precio inválido"); return; }

    setSaving(true);
    let imageUrl = editingProduct?.image_url ?? null;

    if (formImageFile) {
      const uploaded = await uploadImage(formImageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const payload = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      price,
      discount: formDiscount ? parseInt(formDiscount) : 0,
      category_id: formCategory || null,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (error) toast.error("Error al actualizar producto");
      else { toast.success(`${formName} actualizado`); setProductDialog(false); }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) toast.error("Error al crear producto");
      else { toast.success(`${formName} creado`); setProductDialog(false); }
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Error al eliminar producto");
    else toast.success("Producto eliminado");
    setDeleteProduct(null);
  };

  // ========= Category CRUD =========
  const openCreateCat = () => {
    setEditingCat(null);
    setCatName("");
    setCatIcon("📦");
    setCatDialog(true);
  };

  const openEditCat = (c: Category) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatIcon(c.icon);
    setCatDialog(true);
  };

  const handleSaveCat = async () => {
    if (!catName.trim()) { toast.error("Nombre es obligatorio"); return; }
    setSavingCat(true);

    if (editingCat) {
      const { error } = await supabase.from("categories").update({ name: catName.trim(), icon: catIcon }).eq("id", editingCat.id);
      if (error) toast.error(error.message.includes("unique") ? "Categoría ya existe" : "Error al actualizar");
      else { toast.success(`Categoría actualizada`); setCatDialog(false); }
    } else {
      const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1;
      const { error } = await supabase.from("categories").insert({ name: catName.trim(), icon: catIcon, sort_order: nextOrder });
      if (error) toast.error(error.message.includes("unique") ? "Categoría ya existe" : "Error al crear");
      else { toast.success(`Categoría creada`); setCatDialog(false); }
    }
    setSavingCat(false);
  };

  const handleDeleteCat = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error("Error al eliminar categoría");
    else toast.success("Categoría eliminada");
    setDeleteCat(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormImageFile(file);
    setFormImagePreview(URL.createObjectURL(file));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={openCreateCat} className="text-sm">
              <Plus className="w-4 h-4" /> Categoría
            </Button>
            <Button onClick={openCreateProduct} className="text-sm">
              <Plus className="w-4 h-4" /> Producto
            </Button>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeCategory === "all"
              ? "gradient-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <div key={cat.id} className="relative group">
            <button
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
            {isAdmin && (
              <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}
                  className="p-0.5 rounded bg-secondary/90 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteCat(cat.id); }}
                  className="p-0.5 rounded bg-destructive/20 hover:bg-destructive/40 text-destructive transition-colors"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="glass-card-hover overflow-hidden relative group">
            {/* Admin actions */}
            {isAdmin && (
              <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditProduct(product)}
                  className="p-1.5 rounded bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteProduct(product.id)}
                  className="p-1.5 rounded bg-destructive/20 hover:bg-destructive/40 text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Image */}
            <div className="h-36 bg-secondary flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{getCategoryIcon(product.category_id)}</span>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-display font-semibold text-foreground text-sm">{product.name}</h4>
                {product.discount && product.discount > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">
                    -{product.discount}%
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  {product.discount && product.discount > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(Math.round(product.price * (1 - product.discount / 100)))}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
                  )}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {getCategoryName(product.category_id)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* ===== Product Dialog ===== */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? `Editar ${editingProduct.name}` : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica los datos del producto." : "Completa los datos para crear un nuevo producto."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Image upload */}
            <div className="space-y-2">
              <Label>Imagen</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
              >
                {formImagePreview ? (
                  <img src={formImagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImagePlus className="w-8 h-8 mb-1" />
                    <span className="text-xs">Subir imagen</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-name">Nombre</Label>
              <Input id="prod-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nombre del producto" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-desc">Descripción</Label>
              <Textarea id="prod-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Descripción breve" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-price">Precio ($)</Label>
                <Input id="prod-price" type="number" min={0} value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-discount">Descuento (%)</Label>
                <Input id="prod-discount" type="number" min={0} max={100} value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveProduct} disabled={saving}>
              {saving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Category Dialog ===== */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            <DialogDescription>
              {editingCat ? "Modifica los datos de la categoría." : "Crea una nueva categoría para tus productos."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icono (emoji)</Label>
              <Input id="cat-icon" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className="text-center text-2xl" maxLength={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input id="cat-name" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nombre de la categoría" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCat} disabled={savingCat}>
              {savingCat ? "Guardando..." : editingCat ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Product Confirm ===== */}
      <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteProduct && handleDeleteProduct(deleteProduct)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Category Confirm ===== */}
      <Dialog open={!!deleteCat} onOpenChange={() => setDeleteCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Categoría</DialogTitle>
            <DialogDescription>Los productos de esta categoría quedarán sin categoría. ¿Continuar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCat(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteCat && handleDeleteCat(deleteCat)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
