import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronRight, LayoutGrid, Check, Search } from "lucide-react";

const CAT_SEPARATOR = " > ";

interface CategoryNode {
  name: string;
  fullPath: string;
  children: CategoryNode[];
}

interface CategoryBrowserModalProps {
  open: boolean;
  onClose: () => void;
  categoryTree: CategoryNode[];
  initialL1: string | null;
  productCountByCategory: Record<string, number>;
  categoryImages: Record<string, string>;
  onSelectCategory: (fullPath: string) => void;
}

function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const n of list) {
      result.push(n);
      if (n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

export function CategoryBrowserModal({
  open,
  onClose,
  categoryTree,
  initialL1,
  productCountByCategory,
  categoryImages,
  onSelectCategory,
}: CategoryBrowserModalProps) {
  const [activeL1, setActiveL1] = useState<string | null>(initialL1);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveL1(initialL1);
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open, initialL1]);

  const selectedL1Node = useMemo(
    () => categoryTree.find(n => n.fullPath === activeL1) ?? categoryTree[0] ?? null,
    [categoryTree, activeL1]
  );

  const allNodes = useMemo(() => flattenTree(categoryTree), [categoryTree]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return allNodes.filter(n => n.name.toLowerCase().includes(q) || n.fullPath.toLowerCase().includes(q));
  }, [search, allNodes]);

  if (!open) return null;

  const handleSelectLeaf = (fullPath: string) => {
    onSelectCategory(fullPath);
    onClose();
  };

  const isSearching = searchResults !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full sm:max-w-3xl max-h-[88vh] sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold">All Categories</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full pl-8 pr-8 py-2 text-sm bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors placeholder:text-muted-foreground"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* L1 sidebar — hidden while searching */}
          {!isSearching && (
            <div className="w-28 sm:w-36 flex-shrink-0 border-r border-border overflow-y-auto py-2 bg-muted/30">
              <button
                onClick={() => handleSelectLeaf("All")}
                className={`w-full text-center px-2 py-3 text-xs font-medium transition-colors leading-snug ${
                  activeL1 === null
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <LayoutGrid className="h-4 w-4 mx-auto mb-1 opacity-70" />
                All
              </button>

              {categoryTree.map(node => (
                <button
                  key={node.fullPath}
                  onClick={() => setActiveL1(node.fullPath)}
                  className={`w-full text-center px-2 py-3 text-xs font-medium transition-colors leading-snug border-l-2 ${
                    activeL1 === node.fullPath
                      ? "border-primary text-foreground font-semibold bg-background"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {node.name}
                </button>
              ))}
            </div>
          )}

          {/* Right panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* ── Search results ── */}
            {isSearching ? (
              searchResults!.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {searchResults!.length} {searchResults!.length === 1 ? "category" : "categories"} found
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {searchResults!.map(node => (
                      <CategoryCard
                        key={node.fullPath}
                        node={node}
                        image={categoryImages[node.fullPath]}
                        count={productCountByCategory[node.fullPath]}
                        onClick={() => handleSelectLeaf(node.fullPath)}
                        subtitle={node.fullPath.includes(CAT_SEPARATOR)
                          ? node.fullPath.slice(0, node.fullPath.lastIndexOf(CAT_SEPARATOR))
                          : undefined}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                  <Search className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No categories match <span className="font-medium text-foreground">"{search}"</span></p>
                  <button
                    onClick={() => setSearch("")}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )
            ) : selectedL1Node && selectedL1Node.children.length > 0 ? (
              /* ── Hierarchical view ── */
              <>
                <button
                  onClick={() => handleSelectLeaf(selectedL1Node.fullPath)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>All in <span className="font-medium text-foreground">{selectedL1Node.name}</span></span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                {selectedL1Node.children.map(l2 => (
                  <div key={l2.fullPath}>
                    <button
                      onClick={() => handleSelectLeaf(l2.fullPath)}
                      className="flex items-center gap-1 mb-3 group"
                    >
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {l2.name}
                      </h3>
                      {productCountByCategory[l2.fullPath] ? (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({productCountByCategory[l2.fullPath]})
                        </span>
                      ) : null}
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary ml-0.5 transition-colors" />
                    </button>

                    <div className="grid grid-cols-3 gap-2.5">
                      {l2.children.length > 0
                        ? l2.children.map(l3 => (
                            <CategoryCard
                              key={l3.fullPath}
                              node={l3}
                              image={categoryImages[l3.fullPath]}
                              count={productCountByCategory[l3.fullPath]}
                              onClick={() => handleSelectLeaf(l3.fullPath)}
                            />
                          ))
                        : (
                            <CategoryCard
                              node={l2}
                              image={categoryImages[l2.fullPath]}
                              count={productCountByCategory[l2.fullPath]}
                              onClick={() => handleSelectLeaf(l2.fullPath)}
                            />
                          )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              /* ── Flat / no-children view — full image grid ── */
              <>
                {selectedL1Node && (
                  <button
                    onClick={() => handleSelectLeaf(selectedL1Node.fullPath)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span>Show all in <span className="font-medium text-foreground">{selectedL1Node.name}</span></span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="grid grid-cols-3 gap-2.5">
                  {categoryTree.map(node => (
                    <CategoryCard
                      key={node.fullPath}
                      node={node}
                      image={categoryImages[node.fullPath]}
                      count={productCountByCategory[node.fullPath]}
                      onClick={() => handleSelectLeaf(node.fullPath)}
                      selected={selectedL1Node?.fullPath === node.fullPath}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  node: CategoryNode;
  image?: string;
  count?: number;
  onClick: () => void;
  selected?: boolean;
  subtitle?: string;
}

function CategoryCard({ node, image, count, onClick, selected, subtitle }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col rounded-xl border bg-background transition-all overflow-hidden text-left group ${
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      {selected && (
        <span className="absolute top-1.5 right-1.5 z-10 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow">
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
        </span>
      )}

      <div className="w-full aspect-square bg-muted/60 flex items-center justify-center overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={node.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="px-2 py-2">
        <p className={`text-xs font-medium leading-snug line-clamp-2 transition-colors ${selected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
          {node.name}
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{subtitle}</p>
        )}
        {count ? (
          <p className="text-[10px] text-muted-foreground mt-0.5">{count}</p>
        ) : null}
      </div>
    </button>
  );
}
