import { useState, useMemo } from "react";
import { X, ChevronRight, LayoutGrid } from "lucide-react";

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

  const selectedL1Node = useMemo(
    () => categoryTree.find(n => n.fullPath === activeL1) ?? categoryTree[0] ?? null,
    [categoryTree, activeL1]
  );

  if (!open) return null;

  const handleSelectLeaf = (fullPath: string) => {
    onSelectCategory(fullPath);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
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

        {/* Body: L1 sidebar + L2/L3 content */}
        <div className="flex flex-1 min-h-0">

          {/* L1 sidebar */}
          <div className="w-28 sm:w-36 flex-shrink-0 border-r border-border overflow-y-auto py-2 bg-muted/30">
            {/* All option */}
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

          {/* Right: L2 sections with L3 cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {selectedL1Node ? (
              selectedL1Node.children.length > 0 ? (
                <>
                  {/* Clickable L1 itself to show all in this category */}
                  <button
                    onClick={() => handleSelectLeaf(selectedL1Node.fullPath)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span>All in <span className="font-medium text-foreground">{selectedL1Node.name}</span></span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  {selectedL1Node.children.map(l2 => (
                    <div key={l2.fullPath}>
                      {/* L2 header */}
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

                      {/* L3 cards */}
                      {l2.children.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2.5">
                          {l2.children.map(l3 => (
                            <CategoryCard
                              key={l3.fullPath}
                              node={l3}
                              image={categoryImages[l3.fullPath]}
                              count={productCountByCategory[l3.fullPath]}
                              onClick={() => handleSelectLeaf(l3.fullPath)}
                            />
                          ))}
                        </div>
                      ) : (
                        /* L2 has no children — show L2 itself as a card */
                        <div className="grid grid-cols-3 gap-2.5">
                          <CategoryCard
                            node={l2}
                            image={categoryImages[l2.fullPath]}
                            count={productCountByCategory[l2.fullPath]}
                            onClick={() => handleSelectLeaf(l2.fullPath)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                /* L1 has no children — just one big card */
                <div className="flex items-center justify-center h-full">
                  <button
                    onClick={() => handleSelectLeaf(selectedL1Node.fullPath)}
                    className="flex flex-col items-center gap-2 p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-muted transition-all"
                  >
                    <span className="text-lg font-semibold">{selectedL1Node.name}</span>
                    {productCountByCategory[selectedL1Node.fullPath] ? (
                      <span className="text-sm text-muted-foreground">
                        {productCountByCategory[selectedL1Node.fullPath]} products
                      </span>
                    ) : null}
                  </button>
                </div>
              )
            ) : (
              /* No L1 selected – show all L1 as a grid */
              <div className="grid grid-cols-3 gap-2.5">
                {categoryTree.map(node => (
                  <CategoryCard
                    key={node.fullPath}
                    node={node}
                    image={categoryImages[node.fullPath]}
                    count={productCountByCategory[node.fullPath]}
                    onClick={() => setActiveL1(node.fullPath)}
                  />
                ))}
              </div>
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
}

function CategoryCard({ node, image, count, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl border border-border hover:border-primary/50 bg-background hover:bg-muted/40 transition-all overflow-hidden text-left group"
    >
      {/* Image area */}
      <div className="w-full aspect-square bg-muted/60 flex items-center justify-center overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={node.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={e => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-2 py-2">
        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {node.name}
        </p>
        {count ? (
          <p className="text-[10px] text-muted-foreground mt-0.5">{count}</p>
        ) : null}
      </div>
    </button>
  );
}
