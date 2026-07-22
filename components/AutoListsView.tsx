'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import ExportModal from './ExportModal';

let nextListId = 10000;

export default function AutoListsView({ 
  inventory,
  setInventory,
  historyItems,
  setHistoryItems,
  setActiveTab,
  user,
  customCategories = [],
  setCustomCategories
}: { 
  inventory: any[],
  setInventory?: (inv: any[]) => void,
  historyItems: any[],
  setHistoryItems: (items: any[]) => void,
  setActiveTab: (tab: 'inventory' | 'history' | 'lists') => void,
  user?: any,
  customCategories?: string[],
  setCustomCategories?: any
}) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Adding item states
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addTab, setAddTab] = useState<'existing' | 'new'>('existing');
  
  // Existing item form state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [existingQty, setExistingQty] = useState<number>(1);
  
  // New item form state
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('Despensa');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState(1);

  // Inline custom category states
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const handleCreateCategoryInline = () => {
    if (newCatInput.trim()) {
      const trimmed = newCatInput.trim();
      if (setCustomCategories) {
        setCustomCategories((prev: string[]) => {
          if (!prev.includes(trimmed)) {
            return [...prev, trimmed];
          }
          return prev;
        });
      }
      setNewCategory(trimmed);
      setNewCatInput('');
      setIsAddingCustomCategory(false);
    }
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Advanced camera and AI scanning state
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'barcode' | 'photo' | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraMode, setCameraMode] = useState<'barcode' | 'photo' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (selectedMode: 'barcode' | 'photo') => {
    setCameraMode(selectedMode);
    setIsCameraActive(true);
    setCameraError(null);
    
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
    } catch (err: any) {
      console.error("Erro ao acessar a câmera principal, tentando fallback...", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setCameraStream(stream);
      } catch (errFallback) {
        setCameraError("Não foi possível acessar a câmera do dispositivo. Verifique as permissões de acesso.");
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCameraMode(null);
  };

  const toggleCameraFacing = async () => {
    if (!cameraMode) return;
    const newFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(newFacingMode);
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const constraints = {
        video: {
          facingMode: { exact: newFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode },
          audio: false
        });
        setCameraStream(stream);
      } catch (e) {
        console.error("Erro ao alternar câmera", e);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_capture_${cameraMode}.jpg`, { type: "image/jpeg" });
            setImageFile(file);
            setMode(cameraMode || 'photo');
            stopCamera();
          }
        }, 'image/jpeg', 0.85);
      }
    }
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>, selectedMode: 'barcode' | 'photo') => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setMode(selectedMode);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setIsAddingItem(false);
    stopCamera();
    setIsProcessing(false);
    setImagePreview(null);
    setImageFile(null);
    setMode(null);
    setNewName('');
    setNewBrand('');
    setNewCategory('Despensa');
    setNewSubcategory('');
    setIsAddingCustomCategory(false);
    setNewCatInput('');
    setNewPrice('');
    setNewQty(1);
    setExistingQty(1);
  };

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraActive, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (isAddingItem && imageFile) {
      const url = URL.createObjectURL(imageFile);
      
      const setupTimer = setTimeout(() => {
        setImagePreview(url);
        setIsProcessing(true);
      }, 0);
      
      // Simulate AI processing / barcode reading
      const timer = setTimeout(() => {
        setIsProcessing(false);
        if (mode === 'barcode') {
          setNewName('Café Especial');
          setNewBrand('Marca Exemplo');
          setNewCategory('Despensa');
          setNewPrice('19.90');
          setNewQty(2);
        } else if (mode === 'photo') {
          setNewName('Sabão em Pó');
          setNewBrand('Marca Limpeza');
          setNewCategory('Limpeza');
          setNewPrice('25.50');
          setNewQty(1);
        }
      }, 2000);
      
      return () => {
        clearTimeout(setupTimer);
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      };
    }
  }, [isAddingItem, imageFile, mode]);

  const listItems = useMemo(() => {
    return inventory.filter(item => 
      item.status === 'ESTOQUE BAIXO' || 
      item.status === 'ESGOTADO' || 
      item.stock < item.minStock ||
      item.isForcedReplenish === true
    ).map(item => ({
      ...item,
      quantityNeeded: item.isForcedReplenish 
        ? (item.forcedQty || 1) 
        : Math.max(1, item.minStock - item.stock + 1)
    }));
  }, [inventory]);

  // Existing items in the pantry that are NOT currently in the list
  const existingAvailableItems = useMemo(() => {
    return inventory.filter(item => !listItems.some(li => li.id === item.id));
  }, [inventory, listItems]);

  const handleOpenAddModal = () => {
    setIsAddingItem(true);
    if (existingAvailableItems.length > 0) {
      setSelectedItemId(String(existingAvailableItems[0].id));
    } else {
      setSelectedItemId('');
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  const handleCheckout = () => {
    const selectedItems = listItems.filter(item => checkedItems[item.id] !== false);
    if (selectedItems.length === 0) {
      alert("Selecione pelo menos um item para concluir.");
      return;
    }

    if (setInventory) {
      const updatedInventory = inventory.map(item => {
        const selectedItem = selectedItems.find(i => i.id === item.id);
        if (selectedItem) {
          const newStock = item.stock + selectedItem.quantityNeeded;
          return {
            ...item,
            stock: newStock,
            status: 'EM ESTOQUE',
            isForcedReplenish: false,
            forcedQty: undefined,
            zeroedBy: undefined,
            zeroedAt: undefined,
            zeroedByInitials: undefined
          };
        }
        return item;
      });
      setInventory(updatedInventory);
    }

    const newItem = {
      id: nextListId++,
      store: 'Fechamento Automático',
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      amount: checkedValue,
      items: selectedItems.map(i => i.name).join(', '),
      count: selectedItems.length,
      icon: 'shopping_cart'
    };

    setHistoryItems([newItem, ...historyItems]);
    setActiveTab('history');
  };

  const handleAddExisting = () => {
    if (!selectedItemId) {
      alert("Selecione um item.");
      return;
    }
    
    if (setInventory) {
      const updated = inventory.map(item => {
        if (String(item.id) === selectedItemId) {
          return {
            ...item,
            isForcedReplenish: true,
            forcedQty: existingQty,
            zeroedBy: user?.name || 'Maria',
            zeroedByInitials: (user?.name || 'Maria').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
            zeroedAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          };
        }
        return item;
      });
      setInventory(updated);
    }
    
    resetForm();
  };

  const handleAddNew = () => {
    if (!newName.trim()) {
      alert("Por favor, digite o nome do item.");
      return;
    }
    
    if (setInventory) {
      const nextId = Math.max(...inventory.map(i => typeof i.id === 'number' ? i.id : 0), 100) + 1;
      const price = parseFloat(newPrice) || 5.00;
      
      const newItem = {
        id: nextId,
        name: newName.trim(),
        brand: newBrand.trim() || 'Outros',
        category: newCategory,
        subcategory: newSubcategory.trim(),
        price: price,
        validity: '-',
        stock: 0,
        minStock: 2,
        status: 'ESGOTADO',
        isForcedReplenish: true,
        forcedQty: newQty,
        image: imagePreview || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200&h=200',
        minPrice: price.toFixed(2),
        avgPrice: price.toFixed(2),
        zeroedBy: user?.name || 'Maria',
        zeroedByInitials: (user?.name || 'Maria').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
        zeroedAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      
      setInventory([...inventory, newItem]);
    }
    
    resetForm();
  };

  const totalValue = listItems.reduce((acc, curr) => acc + (curr.price * curr.quantityNeeded), 0);
  const checkedValue = listItems.reduce((acc, curr) => checkedItems[curr.id] !== false ? acc + (curr.price * curr.quantityNeeded) : acc, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Listas de Reposição</h2>
          <p className="text-on-surface-variant">Itens gerados automaticamente baseados no seu estoque e consumo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Automatic Replenishment based on inventory */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 md:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/30">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">shopping_cart</span>
                  Lista Inteligente
                </h3>
                <button 
                  type="button"
                  id="btn-add-smartlist-item"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors active:scale-95 cursor-pointer border border-primary/20"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  Adicionar Item
                </button>
                <button 
                  type="button"
                  disabled={listItems.length === 0}
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-secondary/10 hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed text-secondary text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors active:scale-95 cursor-pointer border border-secondary/20"
                >
                  <span className="material-symbols-outlined text-[15px]">share</span>
                  Exportar Lista
                </button>
              </div>
              <p className="text-sm text-on-surface-variant mt-1.5">
                {listItems.length} itens do estoque
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-on-surface-variant">Valor Estimado</div>
              <div className="font-mono font-bold text-lg text-primary">
                R$ {totalValue.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          <div className="p-0 flex-grow">
            {listItems.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
                <p>Seu estoque está em dia!</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/50">
                {listItems.map((item) => (
                  <div key={item.id} className={`flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors ${checkedItems[item.id] === false ? 'opacity-60' : ''}`}>
                    <button 
                      onClick={() => toggleCheck(item.id)}
                      className="flex-shrink-0 text-primary transition-transform active:scale-90"
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {checkedItems[item.id] !== false ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                    </button>
                    
                    <div className="flex-grow min-w-0">
                      <h4 className={`font-bold truncate ${checkedItems[item.id] === false ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {item.name}
                      </h4>
                      <div className="text-xs font-mono text-outline uppercase truncate mt-0.5 flex items-center gap-1.5">
                        <span>{item.brand}</span>
                        <span>•</span>
                        <span>Sugerido: {item.quantityNeeded} un</span>
                        {item.isForcedReplenish && (
                          <span className="bg-secondary/10 text-secondary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">MANUAL</span>
                        )}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-surface-container/60 px-2 py-0.5 rounded-full border border-outline-variant/30 text-[10px]">
                          <span className="material-symbols-outlined text-[12px] text-primary">person</span>
                          <span>Indicado por: <strong className="text-on-surface">{item.zeroedBy || 'Maria'}</strong></span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-container/60 px-2 py-0.5 rounded-full border border-outline-variant/30 text-[10px]">
                          <span className="material-symbols-outlined text-[12px] text-secondary">calendar_month</span>
                          <span>Em: <strong className="text-on-surface font-mono">{item.zeroedAt || '19/07/2026 10:15'}</strong></span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-sm">
                        R$ {(item.price * item.quantityNeeded).toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        (R$ {item.price.toFixed(2).replace('.', ',')} / un)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {listItems.length > 0 && (
            <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant flex items-center justify-between mt-auto">
              <div className="text-sm font-medium">
                <span className="text-on-surface-variant">Marcados: </span>
                <span className="font-bold">R$ {checkedValue.toFixed(2).replace('.', ',')}</span>
              </div>
              <button onClick={handleCheckout} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold shadow hover:shadow-md transition-all active:scale-95 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Adicionar Item na Lista */}
      <AnimatePresence>
        {isAddingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={!isProcessing ? resetForm : undefined}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-outline-variant w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
                <h3 className="text-lg font-bold">Adicionar Item à Lista</h3>
                <button 
                  onClick={resetForm}
                  disabled={isProcessing}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Segmented Tabs */}
              <div className="px-6 pt-4">
                <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl">
                  <button
                    type="button"
                    disabled={isProcessing || isCameraActive}
                    onClick={() => setAddTab('existing')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${addTab === 'existing' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'} disabled:opacity-50`}
                  >
                    Do Estoque
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing || isCameraActive}
                    onClick={() => setAddTab('new')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${addTab === 'new' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'} disabled:opacity-50`}
                  >
                    Novo Item (Fora do Estoque)
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-grow overflow-y-auto">
                {addTab === 'existing' ? (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Selecione um item já cadastrado na despensa para incluí-lo na sua lista de reposição inteligente.
                    </p>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Produto</label>
                      {existingAvailableItems.length === 0 ? (
                        <p className="text-sm text-error font-medium p-3 bg-error/5 rounded-xl border border-error/10">
                          Todos os itens cadastrados já estão na lista!
                        </p>
                      ) : (
                        <select
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none text-sm transition-all focus:border-primary"
                        >
                          {existingAvailableItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.brand}) — Atual: {item.stock} un
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Quantidade Necessária</label>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => setExistingQty(Math.max(1, existingQty - 1))}
                          className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <input
                          type="number"
                          value={existingQty}
                          onChange={(e) => setExistingQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-center font-bold font-mono outline-none text-sm focus:border-primary"
                        />
                        <button 
                          type="button"
                          onClick={() => setExistingQty(existingQty + 1)}
                          className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Cadastre um item novo temporário que será adicionado à sua despensa de forma definitiva assim que a compra for concluída.
                    </p>

                    {/* Camera & Scanning Interface */}
                    {isCameraActive ? (
                      <div className="rounded-xl overflow-hidden border border-outline-variant relative h-52 bg-black flex flex-col items-center justify-center">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        
                        {cameraMode === 'barcode' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-4/5 h-10 border-2 border-dashed border-primary/60 rounded-lg relative flex items-center justify-center bg-primary/5">
                              <div className="absolute w-full h-0.5 bg-error shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                            </div>
                            <p className="text-[10px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-2 uppercase tracking-wider font-mono">
                              Aponte para o Código de Barras
                            </p>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-1/2 h-1/2 border-2 border-dashed border-secondary/60 rounded-lg relative bg-secondary/5" />
                            <p className="text-[10px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-2 uppercase tracking-wider font-mono">
                              Centralize o Produto
                            </p>
                          </div>
                        )}

                        {/* Camera Control Overlay */}
                        <div className="absolute bottom-3 left-0 right-0 px-4 flex justify-between items-center z-10">
                          <button 
                            type="button"
                            onClick={toggleCameraFacing}
                            className="w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-90 transition-transform"
                            title="Alternar Câmera"
                          >
                            <span className="material-symbols-outlined text-sm">sync</span>
                          </button>

                          <button 
                            type="button"
                            onClick={capturePhoto}
                            className="w-12 h-12 rounded-full bg-white border-4 border-neutral-300 flex items-center justify-center hover:bg-neutral-100 active:scale-90 transition-transform"
                            title="Capturar Foto"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary" />
                          </button>

                          <button 
                            type="button"
                            onClick={stopCamera}
                            className="w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-90 transition-transform"
                            title="Cancelar"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>

                        {cameraError && (
                          <div className="absolute inset-0 bg-surface p-4 flex flex-col items-center justify-center text-center gap-2 z-20">
                            <span className="material-symbols-outlined text-error text-3xl">videocam_off</span>
                            <p className="text-xs font-semibold text-on-surface">{cameraError}</p>
                            <button 
                              type="button"
                              onClick={stopCamera}
                              className="bg-primary text-on-primary px-3 py-1.5 rounded-xl text-[10px] font-bold"
                            >
                              Voltar
                            </button>
                          </div>
                        )}
                      </div>
                    ) : !imagePreview ? (
                      <div className="p-4 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container flex flex-col items-center justify-center gap-3 text-center">
                        <div className="flex flex-col gap-0.5 items-center">
                          <span className="material-symbols-outlined text-3xl text-on-surface-variant">add_a_photo</span>
                          <p className="text-xs font-medium text-on-surface-variant">Deseja escanear o produto ou tirar uma foto?</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 w-full max-w-[340px]">
                          <button 
                            type="button"
                            onClick={() => startCamera('barcode')}
                            className="flex flex-col items-center justify-center p-2.5 border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-xl text-[11px] font-bold transition-all text-primary cursor-pointer active:scale-95"
                          >
                            <span className="material-symbols-outlined mb-1 text-lg">barcode_scanner</span>
                            Ler Código de Barras
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => startCamera('photo')}
                            className="flex flex-col items-center justify-center p-2.5 border-2 border-secondary/20 bg-secondary/5 hover:bg-secondary/10 rounded-xl text-[11px] font-bold transition-all text-secondary cursor-pointer active:scale-95"
                          >
                            <span className="material-symbols-outlined mb-1 text-lg">photo_camera</span>
                            Tirar Foto
                          </button>

                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            ref={barcodeInputRef}
                            onChange={(e) => handleLocalFileChange(e, 'barcode')}
                          />
                          <button 
                            type="button"
                            onClick={() => barcodeInputRef.current?.click()}
                            className="col-span-1 flex items-center justify-center gap-1 p-2 border border-outline-variant rounded-xl text-[10px] font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">upload_file</span>
                            Código (Arquivo)
                          </button>

                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            ref={photoInputRef}
                            onChange={(e) => handleLocalFileChange(e, 'photo')}
                          />
                          <button 
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="col-span-1 flex items-center justify-center gap-1 p-2 border border-outline-variant rounded-xl text-[10px] font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">image</span>
                            Foto (Arquivo)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-outline-variant relative h-36 bg-surface-container flex items-center justify-center">
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                            <span className="material-symbols-outlined animate-spin mb-1 text-xl">sync</span>
                            <span className="text-[10px] font-mono uppercase tracking-wider">Analisando inteligência artificial...</span>
                          </div>
                        )}
                        {!isProcessing && (
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setImageFile(null);
                            }}
                            className="absolute top-2 right-2 bg-black/75 hover:bg-black/90 text-white rounded-full p-1 shadow-lg transition-colors flex items-center justify-center z-10 active:scale-95"
                            title="Remover Imagem"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Nome do Produto</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Pão de Alho 400g"
                        className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none text-sm transition-all focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Marca</label>
                        <input
                          type="text"
                          value={newBrand}
                          onChange={(e) => setNewBrand(e.target.value)}
                          placeholder="Ex: Santa Massa"
                          className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none text-sm transition-all focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Preço Estimado</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="Ex: 14.90"
                          className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none text-sm transition-all focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Categoria</label>
                          <button
                            type="button"
                            onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                            className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">add</span>
                            {isAddingCustomCategory ? 'Cancelar' : 'Nova Categoria'}
                          </button>
                        </div>
                        
                        {isAddingCustomCategory ? (
                          <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200">
                            <input
                              type="text"
                              placeholder="Nova Categoria"
                              value={newCatInput}
                              onChange={(e) => setNewCatInput(e.target.value)}
                              className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-3 py-2 outline-none text-sm"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleCreateCategoryInline}
                              className="px-3 bg-secondary text-on-secondary rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all active:scale-95"
                            >
                              Ok
                            </button>
                          </div>
                        ) : (
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none text-sm transition-all focus:border-primary"
                          >
                            <option value="Despensa">Despensa</option>
                            <option value="Limpeza">Limpeza</option>
                            <option value="Higiene">Higiene</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Frios">Frios</option>
                            {customCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Subcategoria (Opcional)</label>
                        <input
                          type="text"
                          value={newSubcategory}
                          onChange={(e) => setNewSubcategory(e.target.value)}
                          placeholder="Ex: Laticínios, Enlatados..."
                          className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none text-sm transition-all focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-bold text-on-surface-variant uppercase block">Quantidade</label>
                        <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden bg-surface-container h-[46px]">
                          <button 
                            type="button" 
                            onClick={() => setNewQty(Math.max(1, newQty - 1))} 
                            className="p-2 hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <input 
                            type="number" 
                            value={newQty}
                            onChange={e => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full text-center bg-transparent text-sm focus:outline-none font-mono font-bold"
                          />
                          <button 
                            type="button" 
                            onClick={() => setNewQty(newQty + 1)} 
                            className="p-2 hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-outline-variant bg-surface-container-low/50 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isProcessing}
                  className="flex-1 bg-surface border border-outline-variant text-on-surface py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-container transition-colors active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addTab === 'existing' ? handleAddExisting : handleAddNew}
                  disabled={isProcessing || (addTab === 'existing' && existingAvailableItems.length === 0)}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Lista de Compras Inteligente"
        items={listItems}
        total={totalValue}
        date={new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      />
    </div>
  );
}
