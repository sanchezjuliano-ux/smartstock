'use client';

import { useState, useEffect, useMemo } from 'react';
import ExportModal from './ExportModal';

interface ActiveShoppingSessionProps {
  item: any;
  inventory: any[];
  setInventory: (inv: any[]) => void;
  setHistoryItems: (items: any[]) => void;
  onClose: () => void;
  historyItems: any[];
}

export default function ActiveShoppingSession({ item, inventory, setInventory, historyItems, setHistoryItems, onClose }: ActiveShoppingSessionProps) {
  const [storeName, setStoreName] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    // Initialize cart items from the comma-separated string
    const names = item.items.split(',').map((s: string) => s.trim()).filter(Boolean);
    const initialItems = names.map((name: string) => {
      // Find in inventory to get current price as a base, or mock
      const invItem = inventory.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
      const basePrice = invItem ? invItem.price : (Math.random() * 20 + 5).toFixed(2);
      
      return {
        id: Math.random().toString(),
        name,
        inCart: false,
        price: '',
        quantity: 1,
        avgPrice: invItem && invItem.avgPrice ? invItem.avgPrice : (parseFloat(basePrice) * 1.05).toFixed(2),
        minPrice: invItem && invItem.minPrice ? invItem.minPrice : (parseFloat(basePrice) * 0.9).toFixed(2),
        invId: invItem ? invItem.id : null
      };
    });
    setTimeout(() => {
      setCartItems(initialItems);
      
      // Set store name if it's already a real store, otherwise leave blank for "Fechamento Automático"
      if (item.store !== 'Fechamento Automático') {
        setStoreName(item.store);
      }
    }, 0);
  }, [item, inventory]);

  const totalValue = useMemo(() => {
    return cartItems.reduce((acc, curr) => {
      if (curr.inCart) {
        const p = parseFloat(curr.price) || 0;
        const q = parseInt(curr.quantity) || 0;
        return acc + (p * q);
      }
      return acc;
    }, 0);
  }, [cartItems]);

  const updateItem = (id: string, field: string, value: any) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleFinish = () => {
    // Update Inventory
    if (setInventory) {
      // 1. Update existing inventory items
      const updatedExisting = inventory.map(invItem => {
        const purchasedItem = cartItems.find(c => c.inCart && (c.invId === invItem.id || c.name.toLowerCase() === invItem.name.toLowerCase()));
        if (purchasedItem) {
          const qty = parseInt(purchasedItem.quantity) || 0;
          const price = parseFloat(purchasedItem.price) || invItem.price;
          
          const oldMin = parseFloat(invItem.minPrice) || price;
          const oldAvg = parseFloat(invItem.avgPrice) || price;
          
          return {
            ...invItem,
            stock: invItem.stock + qty,
            status: 'EM ESTOQUE',
            price: price, // update to latest price
            minPrice: Math.min(oldMin, price).toFixed(2),
            avgPrice: ((oldAvg + price) / 2).toFixed(2),
            isForcedReplenish: false,
            forcedQty: undefined
          };
        }
        return invItem;
      });

      // 2. Add brand-new items (not found in current inventory)
      const newItemsInCart = cartItems.filter(c => 
        c.inCart && 
        !inventory.some(invItem => invItem.id === c.invId || invItem.name.toLowerCase() === c.name.toLowerCase())
      );

      const nextIdBase = Math.max(...inventory.map(i => typeof i.id === 'number' ? i.id : 0), 100) + 1;
      const addedItems = newItemsInCart.map((cItem, idx) => {
        const price = parseFloat(cItem.price) || 5.00; // fallback if empty
        return {
          id: nextIdBase + idx,
          name: cItem.name,
          brand: 'Outros',
          category: 'Despensa',
          price: price,
          validity: '-',
          stock: parseInt(cItem.quantity) || 1,
          minStock: 2,
          status: 'EM ESTOQUE',
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200&h=200',
          minPrice: price.toFixed(2),
          avgPrice: price.toFixed(2)
        };
      });

      setInventory([...updatedExisting, ...addedItems]);
    }

    // Update History
    if (setHistoryItems && historyItems) {
      setHistoryItems(historyItems.map((hItem: any) => {
        if (hItem.id === item.id) {
          return {
            ...hItem,
            store: storeName || 'Supermercado',
            amount: totalValue,
            date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(' de ', ' ').replace('.', ''),
            items: cartItems.filter(c => c.inCart).map(c => c.name).join(', '),
            count: cartItems.filter(c => c.inCart).length,
            icon: 'shopping_bag' // Change icon to indicate completed purchase
          };
        }
        return hItem;
      }));
    }
    
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <h3 className="text-xl font-bold text-on-surface">Modo de Compras</h3>
        </div>
        <button 
          onClick={() => setIsExportOpen(true)}
          className="inline-flex items-center gap-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold px-3 py-1.5 rounded-xl border border-secondary/20 transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">share</span>
          Exportar Lista
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h4 className="text-sm font-mono font-bold text-on-surface-variant uppercase">Dados da Compra</h4>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-on-surface">Estabelecimento</label>
          <input 
            type="text" 
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            placeholder="Ex: Supermercado Extra"
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-mono font-bold text-on-surface-variant uppercase">Itens da Lista</h4>
          <span className="bg-primary/10 text-primary text-[12px] font-bold px-3 py-1 rounded-full">
            {cartItems.filter(i => i.inCart).length} de {cartItems.length} no carrinho
          </span>
        </div>

        {cartItems.map((cItem) => (
          <div key={cItem.id} className={`bg-surface-container-lowest border ${cItem.inCart ? 'border-primary' : 'border-outline-variant'} rounded-xl p-5 flex flex-col gap-4 transition-colors`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => updateItem(cItem.id, 'inCart', !cItem.inCart)}
                  className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${cItem.inCart ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant bg-surface'}`}
                >
                  {cItem.inCart && <span className="material-symbols-outlined text-[16px]">check</span>}
                </button>
                <h5 className={`font-bold text-base ${cItem.inCart ? 'line-through text-on-surface-variant opacity-70' : 'text-on-surface'}`}>{cItem.name}</h5>
              </div>
              <button 
                onClick={() => removeItem(cItem.id)}
                className="text-on-surface-variant hover:text-error hover:bg-error-container p-1 rounded-md transition-colors flex items-center justify-center"
                title="Remover da lista"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-surface-container-low p-3 rounded-lg flex flex-col items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Preço Médio</span>
                <span className="text-sm font-bold">R$ {cItem.avgPrice.replace('.', ',')}</span>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg flex flex-col items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Menor Preço</span>
                <span className="text-sm font-bold text-secondary">R$ {cItem.minPrice.replace('.', ',')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase">Preço Atual (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={cItem.price}
                  onChange={e => {
                    updateItem(cItem.id, 'price', e.target.value);
                    if (e.target.value && !cItem.inCart) {
                      updateItem(cItem.id, 'inCart', true);
                    } else if (!e.target.value && cItem.inCart) {
                      updateItem(cItem.id, 'inCart', false);
                    }
                  }}
                  placeholder="0,00"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase">Quantidade</label>
                <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-container">
                  <button onClick={() => updateItem(cItem.id, 'quantity', Math.max(1, cItem.quantity - 1))} className="p-2 hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined text-sm">remove</span></button>
                  <input 
                    type="number" 
                    value={cItem.quantity}
                    onChange={e => updateItem(cItem.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full text-center bg-transparent text-sm focus:outline-none font-mono font-bold"
                  />
                  <button onClick={() => updateItem(cItem.id, 'quantity', cItem.quantity + 1)} className="p-2 hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined text-sm">add</span></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 mt-8 bg-surface-container-highest border border-outline-variant rounded-xl p-6 shadow-lg z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-mono font-medium text-on-surface-variant uppercase">Total da Compra</span>
          <span className="text-3xl font-bold text-primary">R$ {totalValue.toFixed(2).replace('.', ',')}</span>
        </div>
        <button 
          onClick={handleFinish}
          disabled={cartItems.filter(c => c.inCart).length === 0}
          className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined">done_all</span>
          Compra Realizada
        </button>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={storeName ? `Modo de Compras - ${storeName}` : "Modo de Compras"}
        items={cartItems.map(c => ({
          name: c.name,
          brand: inventory.find(i => i.name.toLowerCase() === c.name.toLowerCase())?.brand || 'Outros',
          price: parseFloat(c.price) || parseFloat(c.avgPrice) || 5.0,
          quantityNeeded: c.quantity
        }))}
        total={cartItems.reduce((acc, c) => acc + ((parseFloat(c.price) || parseFloat(c.avgPrice) || 5.0) * c.quantity), 0)}
        date={new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      />
    </div>
  );
}
