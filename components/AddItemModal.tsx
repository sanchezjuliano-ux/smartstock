'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  mode: 'barcode' | 'photo' | 'manual' | null;
  setImageFile?: (file: File | null) => void;
  setMode?: (mode: 'barcode' | 'photo' | 'manual' | null) => void;
  customCategories?: string[];
  setCustomCategories?: any;
  editingItem?: any;
  inventory?: any[];
  setInventory?: (inventory: any[]) => void;
  user?: any;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  src: HTMLImageElement | HTMLVideoElement,
  targetWidth: number,
  targetHeight: number
) {
  const srcWidth = (src as HTMLVideoElement).videoWidth || (src as HTMLImageElement).naturalWidth || src.width;
  const srcHeight = (src as HTMLVideoElement).videoHeight || (src as HTMLImageElement).naturalHeight || src.height;

  if (!srcWidth || !srcHeight) {
    ctx.drawImage(src, 0, 0, targetWidth, targetHeight);
    return;
  }

  const srcAspect = srcWidth / srcHeight;
  const targetAspect = targetWidth / targetHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = srcWidth;
  let sHeight = srcHeight;

  if (srcAspect > targetAspect) {
    sWidth = srcHeight * targetAspect;
    sx = (srcWidth - sWidth) / 2;
  } else {
    sHeight = srcWidth / targetAspect;
    sy = (srcHeight - sHeight) / 2;
  }

  ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
}

export default function AddItemModal({ 
  isOpen, 
  onClose, 
  imageFile, 
  mode, 
  setImageFile, 
  setMode, 
  customCategories = [],
  setCustomCategories,
  editingItem,
  inventory,
  setInventory,
  user
}: AddItemModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (videoRef.current && setMode) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawImageCover(ctx, video, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(dataUrl);
        setMode(cameraMode || 'photo');
        stopCamera();
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
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

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>, selectedMode: 'barcode' | 'photo') => {
    if (e.target.files && e.target.files[0] && setMode) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const raw = reader.result as string;
        const img = new document.defaultView!.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawImageCover(ctx, img, 400, 400);
            setImagePreview(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            setImagePreview(raw);
          }
        };
        img.onerror = () => setImagePreview(raw);
        img.src = raw;
      };
      reader.readAsDataURL(file);
      setMode(selectedMode);
      e.target.value = '';
    }
  };
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Despensa',
    subcategory: '',
    price: '',
    validity: '',
    stock: '1'
  });

  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const handleCreateCategoryInline = () => {
    if (newCatInput.trim()) {
      const trimmed = newCatInput.trim();
      if (setCustomCategories && !customCategories.includes(trimmed)) {
        setCustomCategories((prev: string[]) => [...prev, trimmed]);
      }
      setFormData(prev => ({ ...prev, category: trimmed }));
      setNewCatInput('');
      setIsAddingCustomCategory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setIsAddingCustomCategory(false);
        setNewCatInput('');
        if (editingItem) {
          setFormData({
            name: editingItem.name || '',
            brand: editingItem.brand || '',
            category: editingItem.category || 'Despensa',
            subcategory: editingItem.subcategory || '',
            price: editingItem.price ? editingItem.price.toString() : '',
            validity: editingItem.validity || '',
            stock: editingItem.stock ? editingItem.stock.toString() : '1'
          });
          if (editingItem.image) {
            setImagePreview(editingItem.image);
          }
        } else {
          setFormData({
            name: '',
            brand: '',
            category: 'Despensa',
            subcategory: '',
            price: '',
            validity: '',
            stock: '1'
          });
          setImagePreview(null);
        }
      }, 0);
    }
  }, [isOpen, editingItem]);

  useEffect(() => {
    if (isOpen && imageFile && !editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const raw = reader.result as string;
        const img = new document.defaultView!.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawImageCover(ctx, img, 400, 400);
            setImagePreview(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            setImagePreview(raw);
          }
        };
        img.onerror = () => setImagePreview(raw);
        img.src = raw;
      };
      reader.readAsDataURL(imageFile);
      setIsProcessing(true);
      
      // Simulate AI processing / barcode reading
      const timer = setTimeout(() => {
        setIsProcessing(false);
        if (mode === 'barcode') {
          setFormData({
            name: 'Café Especial',
            brand: 'Marca Exemplo',
            category: 'Despensa',
            price: '19.90',
            validity: '12/25',
            stock: '2'
          });
        } else if (mode === 'photo') {
          setFormData({
            name: 'Sabão em Pó',
            brand: 'Marca Limpeza',
            category: 'Limpeza',
            price: '25.50',
            validity: '08/26',
            stock: '1'
          });
        }
      }, 2000);
      
      return () => {
        clearTimeout(setupTimer);
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      };
    }
  }, [isOpen, imageFile, mode, editingItem]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={!isProcessing ? handleClose : undefined}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">{editingItem ? 'Editar Item' : 'Adicionar Item'}</h2>
            <button 
              onClick={handleClose} 
              disabled={isProcessing}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container-high disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="overflow-y-auto p-6">
            {isCameraActive ? (
              <div className="mb-6 rounded-xl overflow-hidden border border-outline-variant relative h-64 bg-black flex flex-col items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Scanning Lasers / Frames */}
                {cameraMode === 'barcode' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-4/5 h-12 border-2 border-dashed border-primary/60 rounded-lg relative flex items-center justify-center bg-primary/5">
                      <div className="absolute w-full h-0.5 bg-error shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                    </div>
                    <p className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-3 uppercase tracking-wider">
                      Aponte para o Código de Barras
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-2/3 h-2/3 border-2 border-dashed border-secondary/60 rounded-lg relative bg-secondary/5" />
                    <p className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-3 uppercase tracking-wider">
                      Centralize o Produto
                    </p>
                  </div>
                )}

                {/* Camera Control Overlay */}
                <div className="absolute bottom-3 left-0 right-0 px-4 flex justify-between items-center z-10">
                  <button 
                    type="button"
                    onClick={toggleCameraFacing}
                    className="w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-90 transition-transform"
                    title="Alternar Câmera"
                  >
                    <span className="material-symbols-outlined text-lg">sync</span>
                  </button>

                  <button 
                    type="button"
                    onClick={capturePhoto}
                    className="w-14 h-14 rounded-full bg-white border-4 border-neutral-300 flex items-center justify-center hover:bg-neutral-100 active:scale-90 transition-transform"
                    title="Capturar Foto"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary" />
                  </button>

                  <button 
                    type="button"
                    onClick={stopCamera}
                    className="w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-90 transition-transform"
                    title="Cancelar"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-surface p-6 flex flex-col items-center justify-center text-center gap-3 z-20">
                    <span className="material-symbols-outlined text-error text-4xl">videocam_off</span>
                    <p className="text-sm font-semibold text-on-surface">{cameraError}</p>
                    <button 
                      type="button"
                      onClick={stopCamera}
                      className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Voltar
                    </button>
                  </div>
                )}
              </div>
            ) : !imagePreview ? (
              <div className="mb-6 p-5 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex flex-col gap-1 items-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">add_a_photo</span>
                  <p className="text-sm font-medium text-on-surface-variant">Deseja adicionar uma foto ou código de barras?</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full max-w-[340px]">
                  <button 
                    type="button"
                    onClick={() => startCamera('barcode')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-xl text-xs font-bold transition-all text-primary"
                  >
                    <span className="material-symbols-outlined mb-1 text-xl">barcode_scanner</span>
                    Câmera ao Vivo
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => startCamera('photo')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-secondary/20 bg-secondary/5 hover:bg-secondary/10 rounded-xl text-xs font-bold transition-all text-secondary"
                  >
                    <span className="material-symbols-outlined mb-1 text-xl">photo_camera</span>
                    Tirar Foto ao Vivo
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
                    className="col-span-1 flex items-center justify-center gap-2 p-2.5 border border-outline-variant rounded-xl text-[11px] font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Enviar Código (Arquivo)
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
                    className="col-span-1 flex items-center justify-center gap-2 p-2.5 border border-outline-variant rounded-xl text-[11px] font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">image</span>
                    Enviar Foto (Arquivo)
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-xl overflow-hidden border border-outline-variant relative h-48 bg-surface-container flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                    <span className="material-symbols-outlined animate-spin mb-2">sync</span>
                    <span className="text-sm font-mono uppercase tracking-wider">Analisando imagem...</span>
                  </div>
                )}
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      if (setImageFile) setImageFile(null);
                    }}
                    className="absolute top-2 right-2 bg-black/75 hover:bg-black/90 text-white rounded-full p-1.5 shadow-lg transition-colors flex items-center justify-center z-10 active:scale-95"
                    title="Remover Imagem"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
              </div>
            )}

            {/* No planStatus warnings - simple version */}

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={isProcessing}
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    disabled={isProcessing}
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm disabled:opacity-50"
                  />
                </div>
                    <div className="space-y-1 col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                      Categoria
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                      className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      {isAddingCustomCategory ? 'Cancelar' : 'Nova Categoria'}
                    </button>
                  </div>
                  
                  {isAddingCustomCategory ? (
                    <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200">
                      <input
                        type="text"
                        placeholder="Nome da nova categoria"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        className="flex-1 bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategoryInline}
                        className="px-4 bg-secondary text-on-secondary rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all active:scale-95"
                      >
                        Adicionar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        disabled={isProcessing}
                        className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm appearance-none disabled:opacity-50"
                      >
                        <option value="Despensa">Despensa</option>
                        <option value="Limpeza">Limpeza</option>
                        <option value="Higiene">Higiene</option>
                        {customCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Subcategoria (Opcional)
                  </label>
                  <input
                    type="text"
                    list="subcategories-datalist"
                    placeholder="Ex: Laticínios, Enlatados..."
                    value={formData.subcategory || ''}
                    onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                    disabled={isProcessing}
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm disabled:opacity-50"
                  />
                  <datalist id="subcategories-datalist">
                    {Array.from(new Set((inventory || []).map((i: any) => i.subcategory).filter(Boolean))).map((sub: any) => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Preço (R$)
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    disabled={isProcessing}
                    placeholder="0.00"
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm font-mono disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Validade
                  </label>
                  <input
                    type="text"
                    value={formData.validity}
                    onChange={(e) => setFormData({...formData, validity: e.target.value})}
                    disabled={isProcessing}
                    placeholder="MM/AA"
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm font-mono disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-1 col-span-2">
                   <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Estoque Inicial
                  </label>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      disabled={isProcessing || parseInt(formData.stock) <= 1}
                      onClick={() => setFormData({...formData, stock: String(parseInt(formData.stock) - 1)})}
                      className="w-12 h-12 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <input
                      type="text"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      disabled={isProcessing}
                      className="flex-1 bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-center font-bold text-lg font-mono disabled:opacity-50"
                    />
                     <button 
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setFormData({...formData, stock: String(parseInt(formData.stock) + 1)})}
                      className="w-12 h-12 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="p-6 border-t border-outline-variant bg-surface-container-lowest">
            <button
              type="button"
              onClick={() => {
                if (inventory && setInventory) {
                  const selectedCat = formData.category?.trim() || 'Despensa';
                  if (selectedCat && !['Despensa', 'Limpeza', 'Higiene'].includes(selectedCat)) {
                    if (setCustomCategories && !customCategories.includes(selectedCat)) {
                      setCustomCategories((prev: string[]) => [...prev, selectedCat]);
                    }
                  }

                  if (editingItem) {
                    setInventory(inventory.map(item => {
                      if (item.id === editingItem.id) {
                        const newStock = parseInt(formData.stock) || 0;
                        const newStatus = newStock <= item.minStock ? (newStock === 0 ? 'ESGOTADO' : 'ESTOQUE BAIXO') : 'EM ESTOQUE';
                        const updateInfo = (newStock === 0 && item.stock !== 0)
                          ? {
                              zeroedBy: user?.name || 'Maria',
                              zeroedByInitials: (user?.name || 'Maria').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                              zeroedAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            }
                          : {};
                        return {
                          ...item,
                          name: formData.name,
                          brand: formData.brand,
                          category: formData.category,
                          subcategory: formData.subcategory,
                          price: parseFloat(formData.price) || 0,
                          validity: formData.validity,
                          stock: newStock,
                          status: newStatus,
                          image: imagePreview || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200&h=200',
                          ...updateInfo
                        };
                      }
                      return item;
                    }));
                  } else {
                    const newId = Math.max(...inventory.map((i: any) => i.id), 0) + 1;
                    const newStock = parseInt(formData.stock) !== undefined ? (parseInt(formData.stock) || 0) : 1;
                    const minStock = 1;
                    const newStatus = newStock <= minStock ? (newStock === 0 ? 'ESGOTADO' : 'ESTOQUE BAIXO') : 'EM ESTOQUE';
                    const updateInfo = (newStock === 0)
                      ? {
                          zeroedBy: user?.name || 'Maria',
                          zeroedByInitials: (user?.name || 'Maria').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                          zeroedAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        }
                      : {};
                    setInventory([...inventory, {
                      id: newId,
                      name: formData.name || 'Novo Item',
                      brand: formData.brand || '-',
                      category: formData.category || 'Despensa',
                      subcategory: formData.subcategory || '',
                      price: parseFloat(formData.price) || 0,
                      validity: formData.validity || '-',
                      stock: newStock,
                      minStock: minStock,
                      status: newStatus,
                      image: imagePreview || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200&h=200',
                      ...updateInfo
                    }]);
                  }
                }
                handleClose();
              }}
              disabled={isProcessing}
              className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 bg-secondary text-on-secondary hover:opacity-90 active:scale-[0.98] cursor-pointer"
            >
              Salvar Item
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
