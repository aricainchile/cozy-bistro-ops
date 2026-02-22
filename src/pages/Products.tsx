import { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";

const categories = [
  "Todos", "Carne", "Pollo", "Cerdo", "Pulpo", "Acompañamientos",
  "Cocktail", "Jugos", "Destilados", "Vinos", "Cervezas", "Sándwich", "Té", "Café",
];

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount?: number;
  category: string;
  image: string;
}

const sampleProducts: Product[] = [
  { id: 1, name: "Lomo a lo Pobre", description: "Lomo vetado con papas fritas, cebolla y huevo", price: 14500, category: "Carne", image: "🥩" },
  { id: 2, name: "Bife Chorizo", description: "Corte premium 350g con guarnición", price: 16800, category: "Carne", image: "🥩" },
  { id: 3, name: "Pollo Asado", description: "Medio pollo asado con ensalada", price: 9800, category: "Pollo", image: "🍗" },
  { id: 4, name: "Pollo a la Plancha", description: "Pechuga a la plancha con verduras", price: 8900, category: "Pollo", image: "🍗" },
  { id: 5, name: "Costillar de Cerdo", description: "Costillar BBQ con papas rústicas", price: 13500, category: "Cerdo", image: "🍖" },
  { id: 6, name: "Pulpo al Olivo", description: "Pulpo grillado con salsa de aceitunas", price: 18500, discount: 10, category: "Pulpo", image: "🐙" },
  { id: 7, name: "Papas Fritas", description: "Porción de papas fritas crocantes", price: 3500, category: "Acompañamientos", image: "🍟" },
  { id: 8, name: "Ensalada César", description: "Lechuga, crutones, parmesano", price: 5200, category: "Acompañamientos", image: "🥗" },
  { id: 9, name: "Pisco Sour", description: "Pisco, limón, azúcar, clara de huevo", price: 5500, category: "Cocktail", image: "🍸" },
  { id: 10, name: "Mojito", description: "Ron, menta, limón, soda", price: 5800, category: "Cocktail", image: "🍹" },
  { id: 11, name: "Jugo Natural", description: "Naranja, piña o frutilla", price: 3200, category: "Jugos", image: "🧃" },
  { id: 12, name: "Whisky Johnnie Walker", description: "Black Label, trago doble", price: 7500, category: "Destilados", image: "🥃" },
  { id: 13, name: "Vino Carmenere", description: "Reserva, copa o botella", price: 4500, category: "Vinos", image: "🍷" },
  { id: 14, name: "Cerveza Artesanal", description: "IPA, Lager o Stout 500ml", price: 4200, category: "Cervezas", image: "🍺" },
  { id: 15, name: "Sándwich Lomito", description: "Lomo, tomate, palta, mayo", price: 7800, category: "Sándwich", image: "🥪" },
  { id: 16, name: "Café Espresso", description: "Espresso doble", price: 2500, category: "Café", image: "☕" },
];

const Products = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = sampleProducts.filter((p) => {
    const matchCat = activeCategory === "Todos" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;

  return (
    <div className="space-y-6">
      {/* Search + Add */}
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
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Agregar Producto
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat
                ? "gradient-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="glass-card-hover overflow-hidden">
            <div className="h-32 bg-secondary flex items-center justify-center text-5xl">
              {product.image}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-display font-semibold text-foreground text-sm">{product.name}</h4>
                {product.discount && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">
                    -{product.discount}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  {product.discount ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(product.price * (1 - product.discount / 100))}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
                  )}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {product.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
