'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { INVENTORY } from '@/lib/data';
import AddItemModal from './AddItemModal';

function ProductCard({ 
  item, 
  viewMode,
  onUpdateStock,
  onEdit,
  onDelete
}: { 
  item: any, 
  viewMode: 'grid' | 'list',
  onUpdateStock: (id: number, delta: number) => void,
  onEdit: (item: any) => void,
  onDelete: (id: number) => void
}) {
  const isLowStock = item.status === 'ESTOQUE BAIXO' || item.status === 'ESGOTADO';
  
  if (viewMode === 'list') {
    return (
      <div className={`bg-surface-container-lowest border rounded-xl p-3 flex items-center gap-4 group hover:bg-surface-container-low transition-all relative ${isLowStock ? 'border-2 border-error-container' : 'border-outline-variant'}`}>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)} className="p-1.5 bg-surface-container rounded-md hover:bg-secondary/10 hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 bg-surface-container rounded-md hover:bg-error/10 hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
        
        <div className="relative h-16 w-16 bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
          <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-grow min-w-0 pr-16">
          <div className="flex items-center gap-2 mb-1">
             <h4 className="text-sm font-bold truncate">{item.name}</h4>
             {isLowStock && (
               <span className="px-2 py-0.5 text-[8px] font-bold rounded uppercase bg-error/10 text-error whitespace-nowrap">
                 {item.status}
               </span>
             )}
          </div>
          <p className="text-[10px] font-mono font-medium text-outline uppercase truncate mb-1">{item.brand}{item.subcategory ? ` • ${item.subcategory}` : ''}</p>
          <div className="flex gap-4">
            <span className={`text-xs font-mono font-medium ${isLowStock ? 'text-error' : ''}`}>
              R$ {item.price.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-on-surface-variant italic">Val: {item.validity}</span>
          </div>
        </div>
        
        <div className={`flex items-center justify-between rounded-lg p-1 border flex-shrink-0 ${isLowStock ? 'bg-error-container/20 border-error-container' : 'bg-surface-container-low border-outline-variant'}`}>
          <button onClick={() => onUpdateStock(item.id, -1)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isLowStock ? 'hover:bg-error-container' : 'hover:bg-surface-variant'}`}>
            <span className={`material-symbols-outlined text-sm ${isLowStock ? 'text-error' : ''}`}>remove</span>
          </button>
          <span className={`text-sm font-mono font-medium w-6 text-center ${isLowStock ? 'text-error' : ''}`}>
            {item.stock}
          </span>
          <button onClick={() => onUpdateStock(item.id, 1)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isLowStock ? 'hover:bg-error-container' : 'hover:bg-surface-variant'}`}>
            <span className={`material-symbols-outlined text-sm ${isLowStock ? 'text-error' : ''}`}>add</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface-container-lowest border rounded-xl p-4 flex flex-col gap-3 group hover:bg-surface-container-low transition-all relative ${isLowStock ? 'border-2 border-error-container' : 'border-outline-variant'}`}>
      <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(item)} className="p-1.5 bg-surface-container/80 backdrop-blur-sm rounded-md hover:bg-secondary/10 hover:text-secondary transition-colors">
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 bg-surface-container/80 backdrop-blur-sm rounded-md hover:bg-error/10 hover:text-error transition-colors">
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>

      <div className="relative h-40 w-full bg-surface-container rounded-lg overflow-hidden flex items-center justify-center">
        <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
        <span className={`absolute top-2 right-2 px-2 py-1 text-[10px] font-bold rounded uppercase ${isLowStock ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}>
          {item.status}
        </span>
      </div>
      <div>
        <p className="text-[12px] font-mono font-medium text-outline uppercase">{item.brand}{item.subcategory ? ` • ${item.subcategory}` : ''}</p>
        <h4 className="text-base font-bold">{item.name}</h4>
        <div className="flex justify-between items-center mt-1">
          <span className={`text-sm font-mono font-medium ${isLowStock ? 'text-error' : ''}`}>
            R$ {item.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-on-surface-variant italic">Val: {item.validity}</span>
        </div>
      </div>
      <div className={`flex items-center justify-between rounded-lg p-1 border mt-auto ${isLowStock ? 'bg-error-container/20 border-error-container' : 'bg-surface-container-low border-outline-variant'}`}>
        <button onClick={() => onUpdateStock(item.id, -1)} className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${isLowStock ? 'hover:bg-error-container' : 'hover:bg-surface-variant'}`}>
          <span className={`material-symbols-outlined ${isLowStock ? 'text-error' : ''}`}>remove</span>
        </button>
        <span className={`text-xl font-mono font-medium w-8 text-center ${isLowStock ? 'text-error' : ''}`}>
          {item.stock}
        </span>
        <button onClick={() => onUpdateStock(item.id, 1)} className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${isLowStock ? 'hover:bg-error-container' : 'hover:bg-surface-variant'}`}>
          <span className={`material-symbols-outlined ${isLowStock ? 'text-error' : ''}`}>add</span>
        </button>
      </div>
    </div>
  );
}

function CategorySection({ 
  title, 
  icon, 
  items, 
  viewMode,
  onUpdateStock,
  onEdit,
  onDelete
}: { 
  title: string, 
  icon: string, 
  items: any[], 
  viewMode: 'grid' | 'list',
  onUpdateStock: (id: number, delta: number) => void,
  onEdit: (item: any) => void,
  onDelete: (id: number) => void
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 mt-8 first:mt-0">
      <div className="flex items-center justify-between border-b border-outline-variant pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">{icon}</span>
          <h3 className="text-xl font-semibold">{title}</h3>
          <span className="px-2 py-0.5 bg-surface-container text-[10px] font-mono rounded uppercase">{items.length} ITENS</span>
        </div>
        <button className="text-[12px] font-mono font-medium text-secondary hover:underline">VER TUDO</button>
      </div>
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" : "flex flex-col gap-2"}>
        {items.map(item => (
          <ProductCard 
            key={item.id} 
            item={item} 
            viewMode={viewMode} 
            onUpdateStock={onUpdateStock} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </section>
  );
}

export default function InventoryView({ 
  user,
  inventory = INVENTORY,
  setInventory = () => {},
  searchQuery = '', 
  showLowStockOnly = false,
  setShowLowStockOnly = () => {},
  customCategories = [],
  setCustomCategories = () => {},
  selectedCategoryFilter = '',
  setIsModalOpen,
  setModalMode,
  setSelectedFile,
  setEditingItem,
  stockFilter = 'all',
  setStockFilter = () => {},
  sortBy = 'name_asc',
  onClearFilters
}: { 
  user?: any,
  inventory?: any[],
  setInventory?: (inventory: any[]) => void,
  searchQuery?: string, 
  showLowStockOnly?: boolean,
  setShowLowStockOnly?: (show: boolean) => void,
  customCategories?: string[],
  setCustomCategories?: (categories: string[]) => void,
  selectedCategoryFilter?: string,
  setIsModalOpen?: (isOpen: boolean) => void,
  setModalMode?: (mode: 'barcode' | 'photo' | 'manual' | null) => void,
  setSelectedFile?: (file: File | null) => void,
  setEditingItem?: (item: any) => void,
  stockFilter?: 'all' | 'low' | 'out' | 'low_or_out' | 'in_stock' | 'expiring',
  setStockFilter?: (filter: any) => void,
  sortBy?: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc',
  onClearFilters?: () => void
}) {
  const handleUpdateStock = (id: number, delta: number) => {
    setInventory(inventory.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stock + delta);
        const newStatus = newStock <= item.minStock ? (newStock === 0 ? 'ESGOTADO' : 'ESTOQUE BAIXO') : 'EM ESTOQUE';
        
        const updateInfo = (newStock === 0 && item.stock !== 0 && user) 
          ? { 
              zeroedBy: user.name, 
              zeroedByInitials: user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
              zeroedAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            } 
          : {};

        return { ...item, stock: newStock, status: newStatus, ...updateInfo };
      }
      return item;
    }));
  };

  const handleEdit = (item: any) => {
    if (setEditingItem && setIsModalOpen && setModalMode) {
      setEditingItem(item);
      setModalMode('manual');
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja realmente excluir este produto?")) {
      setInventory(inventory.filter(i => i.id !== id));
    }
  };

  const filterItems = (items: any[]) => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = item.status === 'ESTOQUE BAIXO';
      } else if (stockFilter === 'out') {
        matchesStock = item.status === 'ESGOTADO';
      } else if (stockFilter === 'low_or_out') {
        matchesStock = item.status === 'ESTOQUE BAIXO' || item.status === 'ESGOTADO';
      } else if (stockFilter === 'in_stock') {
        matchesStock = item.status === 'EM ESTOQUE';
      } else if (stockFilter === 'expiring') {
        if (item.validity && item.validity !== '-') {
          const parts = item.validity.split('/');
          if (parts.length === 2) {
            const m = parseInt(parts[0], 10);
            let y = parseInt(parts[1], 10);
            if (y < 100) y += 2000;
            const itemDate = new Date(y, m - 1, 1);
            const currentDate = new Date(2026, 6, 19); // local time July 2026
            const diffTime = itemDate.getTime() - currentDate.getTime();
            const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);
            matchesStock = diffMonths <= 6; // expired or within 6 months
          } else {
            matchesStock = false;
          }
        } else {
          matchesStock = false;
        }
      } else {
        matchesStock = showLowStockOnly ? (item.status === 'ESTOQUE BAIXO' || item.status === 'ESGOTADO') : true;
      }
      
      const matchesCategory = selectedCategoryFilter === '' || item.category === selectedCategoryFilter;
      return matchesSearch && matchesStock && matchesCategory;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'price_asc') {
        return a.price - b.price;
      } else if (sortBy === 'price_desc') {
        return b.price - a.price;
      } else if (sortBy === 'stock_asc') {
        return a.stock - b.stock;
      } else if (sortBy === 'stock_desc') {
        return b.stock - a.stock;
      }
      return 0;
    });

    return filtered;
  };

  // Currently we use a static INVENTORY, if we want custom categories to be populated with items, 
  // we would need a global state for items too. For this prototype, custom categories will just be empty initially.
  // We will just filter the built-in ones.
  const despensa = filterItems(inventory.filter(i => i.category === 'Despensa'));
  const higiene = filterItems(inventory.filter(i => i.category === 'Higiene'));
  const limpeza = filterItems(inventory.filter(i => i.category === 'Limpeza'));

  const totalFilteredCount = despensa.length + higiene.length + limpeza.length + 
    customCategories.reduce((acc, cat) => acc + filterItems(inventory.filter(i => i.category === cat)).length, 0);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'barcode' | 'photo') => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile?.(e.target.files[0]);
      setModalMode?.(mode);
      setIsModalOpen?.(true);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !customCategories.includes(newCategoryName.trim())) {
      setCustomCategories([...customCategories, newCategoryName.trim()]);
      setNewCategoryName('');
      setNewSubcategoryName('');
      setIsCategoryModalOpen(false);
    }
  };

  // Dashboard calculation variables
  const totalUnique = inventory.length;
  const totalUnits = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalValue = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.stock || 0)), 0);
  const criticalItemsCount = inventory.filter(item => item.status === 'ESTOQUE BAIXO' || item.status === 'ESGOTADO').length;
  
  const expiringSoonCount = inventory.filter(item => {
    if (item.validity && item.validity !== '-') {
      const parts = item.validity.split('/');
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10);
        let y = parseInt(parts[1], 10);
        if (y < 100) y += 2000;
        const itemDate = new Date(y, m - 1, 1);
        const currentDate = new Date(2026, 6, 19); // Local time July 19, 2026
        const diffTime = itemDate.getTime() - currentDate.getTime();
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);
        return diffMonths <= 6;
      }
    }
    return false;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Inventário Geral</h2>
          <p className="text-on-surface-variant">Gerencie os itens da sua casa com facilidade.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline rounded-lg text-[12px] font-mono font-medium hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">category</span>
            <span className="hidden sm:inline">NOVA CATEGORIA</span>
          </button>
          
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant ml-2 mr-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-outline hover:bg-surface-variant'}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-outline hover:bg-surface-variant'}`}
              title="List View"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={barcodeInputRef}
            onChange={(e) => handleFileChange(e, 'barcode')}
          />
          <button 
            onClick={() => barcodeInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-outline rounded-lg text-[12px] font-mono font-medium hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
            CÓDIGO DE BARRAS
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={photoInputRef}
            onChange={(e) => handleFileChange(e, 'photo')}
          />
          <button 
            onClick={() => photoInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-outline rounded-lg text-[12px] font-mono font-medium hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            FOTO
          </button>
        </div>
      </div>

      {/* Dashboard KPI Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric Card 1: Total Items */}
        <div 
          onClick={() => {
            if (setStockFilter && setShowLowStockOnly) {
              setStockFilter('all');
              setShowLowStockOnly(false);
            }
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/40 ${
            stockFilter === 'all' ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant/60'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block text-left">Total Estocado</span>
            <div className="text-3xl font-extrabold tracking-tight font-sans text-left">{totalUnique} <span className="text-xs font-medium text-outline">itens</span></div>
            <span className="text-[11px] text-outline block text-left">{totalUnits} unidades em estoque</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
          </div>
        </div>

        {/* Metric Card 2: Critical Stock */}
        <div 
          onClick={() => {
            if (setStockFilter && setShowLowStockOnly) {
              setStockFilter('low_or_out');
              setShowLowStockOnly(true);
            }
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm bg-surface-container-lowest hover:bg-surface-container-low hover:border-error/40 ${
            stockFilter === 'low_or_out' ? 'border-error ring-1 ring-error/20 bg-error/5' : 'border-outline-variant/60'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block text-left">Estoque Crítico</span>
            <div className="text-3xl font-extrabold tracking-tight font-sans text-error text-left">{criticalItemsCount}</div>
            <span className="text-[11px] text-outline block text-left">Itens abaixo do mínimo</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${criticalItemsCount > 0 ? 'bg-error/10 text-error animate-pulse' : 'bg-secondary/10 text-secondary'}`}>
            <span className="material-symbols-outlined text-2xl">{criticalItemsCount > 0 ? 'warning' : 'check_circle'}</span>
          </div>
        </div>

        {/* Metric Card 3: Expiring soon */}
        <div 
          onClick={() => {
            if (setStockFilter && setShowLowStockOnly) {
              setStockFilter('expiring');
              setShowLowStockOnly(false);
            }
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm bg-surface-container-lowest hover:bg-surface-container-low hover:border-amber-500/40 ${
            stockFilter === 'expiring' ? 'border-amber-500 ring-1 ring-amber-500/20 bg-amber-50/20' : 'border-outline-variant/60'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block text-left">Vencimento Próximo</span>
            <div className="text-3xl font-extrabold tracking-tight font-sans text-amber-600 text-left">{expiringSoonCount} <span className="text-xs font-medium text-outline">itens</span></div>
            <span className="text-[11px] text-outline block text-left">Vencendo nos prox. 6 meses</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${expiringSoonCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-secondary/10 text-secondary'}`}>
            <span className="material-symbols-outlined text-2xl">running_with_errors</span>
          </div>
        </div>

        {/* Metric Card 4: Total Valuation */}
        <div 
          className="p-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between shadow-sm select-none"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block text-left">Valor Estimado</span>
            <div className="text-2xl font-extrabold tracking-tight font-sans text-emerald-600 text-left">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <span className="text-[11px] text-outline block text-left">Total investido na despensa</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
        </div>
      </div>

      {totalFilteredCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-container-low border border-outline-variant/60 rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center text-outline-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-on-surface">Nenhum item encontrado</h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Nenhum item da despensa corresponde aos filtros ou termos de pesquisa selecionados atualmente.
            </p>
          </div>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity active:scale-[0.98] cursor-pointer"
            >
              Limpar Filtros e Busca
            </button>
          )}
        </div>
      ) : (
        <>
          <CategorySection title="Despensa" icon="kitchen" items={despensa} viewMode={viewMode} onUpdateStock={handleUpdateStock} onDelete={handleDelete} onEdit={handleEdit} />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CategorySection title="Higiene" icon="sanitizer" items={higiene} viewMode={viewMode} onUpdateStock={handleUpdateStock} onDelete={handleDelete} onEdit={handleEdit} />
            <CategorySection title="Limpeza" icon="cleaning_services" items={limpeza} viewMode={viewMode} onUpdateStock={handleUpdateStock} onDelete={handleDelete} onEdit={handleEdit} />
            {customCategories.map(cat => (
               <CategorySection key={cat} title={cat} icon="category" items={filterItems(inventory.filter(i => i.category === cat))} viewMode={viewMode} onUpdateStock={handleUpdateStock} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </div>
        </>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-6 shadow-xl border border-outline-variant space-y-4">
            <h3 className="text-xl font-bold">Nova Categoria</h3>
            
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Nome da Categoria</label>
              <input 
                type="text" 
                placeholder="Ex: Congelados, Orgânicos..." 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/50"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Subcategoria Inicial (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ex: Polpas de fruta, Carnes..." 
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => {
                  setNewCategoryName('');
                  setNewSubcategoryName('');
                  setIsCategoryModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all"
              >
                Criar Categoria
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
