'use client';

import { useState, useEffect, useRef } from 'react';
import LoginView from '@/components/LoginView';
import InventoryView from '@/components/InventoryView';
import AutoListsView from '@/components/AutoListsView';
import HistoryChatView from '@/components/HistoryChatView';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';
import AddItemModal from '@/components/AddItemModal';
import { INVENTORY, HISTORY_ITEMS, PROFILES } from '@/lib/data';
import { saveSharedData, subscribeSharedData } from '@/lib/sync';
import Image from 'next/image';

const SHARED_USER = {
  name: 'Despensa Compartilhada',
  role: 'admin',
  image: 'https://picsum.photos/seed/pantry/200/200'
};

export default function ShoppingListView() {
  const [mounted, setMounted] = useState(false);
  const [user] = useState<any>(SHARED_USER);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'lists'>('inventory');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  
  // Inventory State
  const [inventory, setInventory] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('virtual_pantry_inventory');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return INVENTORY;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('virtual_pantry_categories');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return [];
  });
  const [customSubcategories, setCustomSubcategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('virtual_pantry_subcategories');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return [];
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  
  // Advanced Filters
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'low_or_out' | 'in_stock' | 'expiring'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name_asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Modal State for Add Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'manual'|'barcode'|'photo'|null>('manual');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // History State
  const [historyItems, setHistoryItems] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('virtual_pantry_history');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return HISTORY_ITEMS;
  });

  // Real-time state setter wrappers
  const handleSetInventory = (newInvOrFn: any) => {
    setInventory((prev) => {
      const next = typeof newInvOrFn === 'function' ? newInvOrFn(prev) : newInvOrFn;
      saveSharedData({ inventory: next });
      return next;
    });
  };

  const handleSetCustomCategories = (newCatOrFn: any) => {
    setCustomCategories((prev) => {
      const next = typeof newCatOrFn === 'function' ? newCatOrFn(prev) : newCatOrFn;
      saveSharedData({ categories: next });
      return next;
    });
  };

  const handleSetCustomSubcategories = (newSubOrFn: any) => {
    setCustomSubcategories((prev) => {
      const next = typeof newSubOrFn === 'function' ? newSubOrFn(prev) : newSubOrFn;
      saveSharedData({ subcategories: next });
      return next;
    });
  };

  const handleSetHistoryItems = (newHistOrFn: any) => {
    setHistoryItems((prev) => {
      const next = typeof newHistOrFn === 'function' ? newHistOrFn(prev) : newHistOrFn;
      saveSharedData({ history: next });
      return next;
    });
  };

  // Real-Time Cloud Firestore Sync Listener
  useEffect(() => {
    const unsub = subscribeSharedData((data) => {
      if (data.inventory !== undefined && Array.isArray(data.inventory)) {
        setInventory(data.inventory);
      }
      if (data.categories !== undefined && Array.isArray(data.categories)) {
        setCustomCategories(data.categories);
      }
      if (data.subcategories !== undefined && Array.isArray(data.subcategories)) {
        setCustomSubcategories(data.subcategories);
      }
      if (data.history !== undefined && Array.isArray(data.history)) {
        setHistoryItems(data.history);
      }
    });
    return () => unsub();
  }, []);

  const activeFiltersCount = (stockFilter !== 'all' ? 1 : 0) + (selectedCategoryFilter !== '' ? 1 : 0) + (sortBy !== 'name_asc' ? 1 : 0);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium opacity-75 font-mono">Carregando Despensa Virtual...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest">
        <div className="p-6 font-bold text-2xl tracking-tight">Despensa Virtual</div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'inventory' ? 'bg-primary-container text-on-primary-container font-semibold' : 'hover:bg-surface-container text-on-surface-variant font-medium'}`}>
            <span className="material-symbols-outlined">kitchen</span>
            <span>Despensa</span>
          </button>
          <button onClick={() => setActiveTab('lists')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'lists' ? 'bg-primary-container text-on-primary-container font-semibold' : 'hover:bg-surface-container text-on-surface-variant font-medium'}`}>
            <span className="material-symbols-outlined">list_alt</span>
            <span>Listas</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'history' ? 'bg-primary-container text-on-primary-container font-semibold' : 'hover:bg-surface-container text-on-surface-variant font-medium'}`}>
            <span className="material-symbols-outlined">history</span>
            <span>Compras</span>
          </button>
        </nav>
        <div className="p-4 border-t border-outline-variant/50">
           <button onClick={() => { setEditingItem(null); setModalMode('manual'); setIsModalOpen(true); }} className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 mb-4">
             <span className="material-symbols-outlined">add</span>
             Adicionar Item
           </button>

           <div className="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl">
             <div className="h-9 w-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
               <span className="material-symbols-outlined text-lg">kitchen</span>
             </div>
             <div className="overflow-hidden">
               <div className="text-xs font-semibold truncate">Despensa Compartilhada</div>
               <div className="text-[10px] text-on-surface-variant truncate">Acesso Livre & Direto</div>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="flex-none p-4 md:px-8 border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-10 flex items-center gap-4">
          <div className="font-bold text-xl md:text-2xl tracking-tight md:hidden">Despensa Virtual</div>
          <div className="flex-grow flex items-center justify-center max-w-2xl mx-auto">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              type="text" 
              placeholder="Buscar itens, marcas, categorias..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/20"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-none relative">
           <button 
             onClick={() => setIsFilterOpen(!isFilterOpen)} 
             className={`p-2.5 rounded-full transition-all flex items-center justify-center relative cursor-pointer ${isFilterOpen || activeFiltersCount > 0 ? 'bg-primary-container text-on-primary-container ring-2 ring-primary/20' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`} 
             title="Filtrar e ordenar itens"
           >
              <span className="material-symbols-outlined text-[20px]">production_quantity_limits</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-surface shadow-sm">
                  {activeFiltersCount}
                </span>
              )}
           </button>

           {/* Advanced Filters Dropdown */}
           {isFilterOpen && (
             <>
               <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
               <div className="absolute right-0 top-full mt-2 z-40 w-80 bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200 text-on-surface">
                 
                 {/* Title & Clear */}
                 <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                   <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
                     <span className="text-xs font-bold uppercase tracking-wider">Filtros & Ordenação</span>
                   </div>
                   {activeFiltersCount > 0 && (
                     <button 
                       onClick={() => {
                         setStockFilter('all');
                         setSelectedCategoryFilter('');
                         setSortBy('name_asc');
                         setShowLowStockOnly(false);
                       }}
                       className="text-[10px] font-bold text-secondary hover:underline uppercase tracking-wide cursor-pointer"
                     >
                       Limpar
                     </button>
                   )}
                 </div>

                 {/* Stock Status Filter */}
                 <div className="space-y-1.5">
                   <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block text-left">Status do Estoque</span>
                   <div className="grid grid-cols-2 gap-1.5">
                     {[
                       { value: 'all', label: 'Todos os Itens', icon: 'inventory' },
                       { value: 'low', label: 'Estoque Baixo', icon: 'warning' },
                       { value: 'out', label: 'Esgotado', icon: 'block' },
                       { value: 'low_or_out', label: 'Abaixo do Mín.', icon: 'error' },
                       { value: 'in_stock', label: 'Em Estoque', icon: 'check_circle' },
                       { value: 'expiring', label: 'Vencendo', icon: 'calendar_today' },
                     ].map((opt) => (
                       <button
                         key={opt.value}
                         onClick={() => {
                           setStockFilter(opt.value as any);
                           setShowLowStockOnly(opt.value === 'low' || opt.value === 'low_or_out');
                         }}
                         className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left text-[11px] font-medium transition-all cursor-pointer ${
                           stockFilter === opt.value
                             ? 'bg-primary/10 border-primary text-primary font-bold'
                             : 'border-outline-variant/60 hover:bg-surface-container-high'
                         }`}
                       >
                         <span className="material-symbols-outlined text-[14px]">{opt.icon}</span>
                         <span className="truncate">{opt.label}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Category Filter */}
                 <div className="space-y-1.5">
                   <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block text-left">Categoria</span>
                   <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {(() => {
                        const rawList = ['Despensa', 'Higiene', 'Limpeza', ...customCategories, ...inventory.map((i: any) => i.category).filter(Boolean)];
                        const distinct: string[] = [];
                        const seen = new Set<string>();
                        for (const cat of rawList) {
                          if (!cat) continue;
                          const trimmed = String(cat).trim();
                          const lower = trimmed.toLowerCase();
                          if (!seen.has(lower)) {
                            seen.add(lower);
                            distinct.push(trimmed);
                          }
                        }
                        const opts = [{ value: '', label: 'Todas' }, ...distinct.map(cat => ({ value: cat, label: cat }))];
                        return opts.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSelectedCategoryFilter(opt.value)}
                            className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              selectedCategoryFilter === opt.value
                                ? 'bg-secondary text-on-secondary border-secondary'
                                : 'border-outline-variant/60 hover:bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ));
                      })()}
                    </div>
                 </div>

                 {/* Sorting */}
                 <div className="space-y-1.5">
                   <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block text-left">Ordenação</span>
                   <div className="grid grid-cols-2 gap-1.5">
                     {[
                       { value: 'name_asc', label: 'Nome A-Z', icon: 'sort_by_alpha' },
                       { value: 'name_desc', label: 'Nome Z-A', icon: 'sort_by_alpha' },
                       { value: 'price_asc', label: 'Menor Preço', icon: 'arrow_downward' },
                       { value: 'price_desc', label: 'Maior Preço', icon: 'arrow_upward' },
                       { value: 'stock_asc', label: 'Menor Estoque', icon: 'trending_down' },
                       { value: 'stock_desc', label: 'Maior Estoque', icon: 'trending_up' },
                     ].map((opt) => (
                       <button
                         key={opt.value}
                         onClick={() => setSortBy(opt.value as any)}
                         className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-left text-[10px] font-medium transition-all cursor-pointer ${
                           sortBy === opt.value
                             ? 'bg-secondary/10 border-secondary text-secondary font-bold'
                             : 'border-outline-variant/60 hover:bg-surface-container-high'
                         }`}
                       >
                         <span className="material-symbols-outlined text-[13px]">{opt.icon}</span>
                         <span className="truncate">{opt.label}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Done Button */}
                 <button
                   onClick={() => setIsFilterOpen(false)}
                   className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-bold uppercase py-2.5 rounded-xl transition-colors active:scale-98 cursor-pointer text-center mt-1"
                 >
                   Fechar
                 </button>

               </div>
             </>
           )}

            <div className="md:hidden flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold">
               <span className="material-symbols-outlined text-[16px]">kitchen</span>
               <span>Despensa</span>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto p-4 md:p-8 pb-32 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Simple version: no subscription warning banners */}

          {activeTab === 'inventory' ? (
            <InventoryView 
              user={user}
              inventory={inventory}
              setInventory={handleSetInventory}
              searchQuery={searchQuery}
              showLowStockOnly={showLowStockOnly}
              setShowLowStockOnly={setShowLowStockOnly}
              customCategories={customCategories}
              setCustomCategories={handleSetCustomCategories}
              customSubcategories={customSubcategories}
              setCustomSubcategories={handleSetCustomSubcategories}
              selectedCategoryFilter={selectedCategoryFilter}
              setIsModalOpen={setIsModalOpen}
              setModalMode={setModalMode}
              setSelectedFile={setSelectedFile}
              setEditingItem={setEditingItem}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              sortBy={sortBy}
              onClearFilters={() => {
                setStockFilter('all');
                setSelectedCategoryFilter('');
                setSortBy('name_asc');
                setShowLowStockOnly(false);
                setSearchQuery('');
              }}
            />
          ) : activeTab === 'lists' ? (
            <AutoListsView 
              inventory={inventory} 
              setInventory={handleSetInventory}
              historyItems={historyItems}
              setHistoryItems={handleSetHistoryItems}
              setActiveTab={setActiveTab}
              user={user}
              customCategories={customCategories}
              setCustomCategories={handleSetCustomCategories}
              customSubcategories={customSubcategories}
              setCustomSubcategories={handleSetCustomSubcategories}
            />
          ) : (
            <HistoryChatView 
              historyItems={historyItems}
              setHistoryItems={handleSetHistoryItems}
              inventory={inventory}
              setInventory={handleSetInventory}
            />
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant px-6 py-3 flex items-center justify-center z-20">
        <div className="flex items-center gap-4 relative">
          <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'inventory' ? 'text-primary' : 'text-outline hover:text-on-surface'}`}>
            <div className={`px-4 py-1 rounded-full ${activeTab === 'inventory' ? 'bg-primary-container text-on-primary-container' : 'bg-transparent'}`}>
              <span className="material-symbols-outlined text-2xl">kitchen</span>
            </div>
            <span className="text-[10px] font-bold tracking-wide">Despensa</span>
          </button>

          <button onClick={() => setActiveTab('lists')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'lists' ? 'text-primary' : 'text-outline hover:text-on-surface'}`}>
            <div className={`px-4 py-1 rounded-full ${activeTab === 'lists' ? 'bg-primary-container text-on-primary-container' : 'bg-transparent'}`}>
              <span className="material-symbols-outlined text-2xl">list_alt</span>
            </div>
            <span className="text-[10px] font-bold tracking-wide">Listas</span>
          </button>
          
          <div className="relative -top-8 px-2">
             <button onClick={() => { setEditingItem(null); setModalMode('manual'); setIsModalOpen(true); }} className="h-14 w-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0">
               <span className="material-symbols-outlined text-3xl">add</span>
             </button>
          </div>

          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'history' ? 'text-primary' : 'text-outline hover:text-on-surface'}`}>
            <div className={`px-4 py-1 rounded-full ${activeTab === 'history' ? 'bg-primary-container text-on-primary-container' : 'bg-transparent'}`}>
              <span className="material-symbols-outlined text-2xl">history</span>
            </div>
            <span className="text-[10px] font-bold tracking-wide">Compras</span>
          </button>
        </div>
      </div>

      <AddItemModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); setSelectedFile(null); }}
        mode={modalMode}
        setMode={setModalMode}
        imageFile={selectedFile}
        setImageFile={setSelectedFile}
        inventory={inventory}
        setInventory={handleSetInventory}
        editingItem={editingItem}
        customCategories={customCategories}
        setCustomCategories={handleSetCustomCategories}
        customSubcategories={customSubcategories}
        setCustomSubcategories={handleSetCustomSubcategories}
        user={user}
      />
    </div>
  </div>
  );
}
