'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (updatedUser: any) => void;
  onLogout?: () => void;
}

export default function ProfileSettingsModal({ isOpen, onClose, user, onUpdate, onLogout }: ProfileSettingsModalProps) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [role, setRole] = useState(user?.role || 'user');
  const [password, setPassword] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(user?.image || null);

  // SaaS Subscription States
  const [stripeCustomerId, setStripeCustomerId] = useState(user?.stripeCustomerId || '');
  const [planStatus, setPlanStatus] = useState<string>(user?.planStatus || 'trialling');
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string>(() => {
    if (user?.subscriptionEndsAt) {
      return user.subscriptionEndsAt.split('T')[0];
    }
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    return defaultDate.toISOString().split('T')[0];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const constraints = {
        video: { facingMode: 'user' },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
    } catch (err) {
      console.error("Erro ao acessar a câmera frontal, tentando fallback...", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setCameraStream(stream);
      } catch (errFallback) {
        alert("Não foi possível acessar a câmera do dispositivo.");
        setIsCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setImagePreview(url);
            stopCamera();
          }
        }, 'image/jpeg', 0.85);
      }
    }
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

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdate({
      ...user,
      name,
      email,
      phone,
      whatsapp,
      role,
      image: imagePreview || user.image,
      password: password ? password : (user.password || '123'),
      stripeCustomerId: stripeCustomerId || null,
      planStatus,
      subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt).toISOString() : null,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Editar Perfil</h2>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container-high">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form className="p-6 space-y-6 max-h-[70vh] overflow-y-auto" onSubmit={handleSave}>
            <div className="flex flex-col items-center gap-3 w-full">
              {isCameraActive ? (
                <div className="w-24 h-24 rounded-full border-2 border-primary relative overflow-hidden bg-black flex items-center justify-center shadow-lg">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              ) : (
                <div 
                  className="w-24 h-24 rounded-full border-2 border-outline-variant hover:border-secondary transition-colors cursor-pointer relative overflow-hidden flex items-center justify-center bg-surface-container-high group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white">edit</span>
                      </div>
                    </>
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-3xl">add_a_photo</span>
                  )}
                </div>
              )}

              {isCameraActive ? (
                <div className="flex gap-2 mt-1 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="inline-flex items-center gap-1.5 bg-primary text-on-primary hover:opacity-90 text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    Tirar Foto
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 bg-error/10 border border-error/20 text-error hover:bg-error/20 text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 mt-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">upload_file</span>
                      Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                      Câmera
                    </button>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-on-surface-variant uppercase tracking-wider mt-1 cursor-pointer animate-fade-in" onClick={() => fileInputRef.current?.click()}>Alterar Foto</span>
                </div>
              )}

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                Nome
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                Tipo de Perfil
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm appearance-none"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                Nova Senha (Opcional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm font-mono"
              />
            </div>

            {/* SaaS Subscription Panel */}
            <div className="border-t border-outline-variant pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">workspace_premium</span>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-secondary">Assinatura SaaS (Comercial)</h3>
              </div>

              <div className="space-y-3 bg-surface-container-low border border-outline-variant rounded-xl p-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-on-surface-variant block uppercase tracking-wider">
                    Stripe Customer ID
                  </label>
                  <input
                    type="text"
                    value={stripeCustomerId}
                    onChange={(e) => setStripeCustomerId(e.target.value)}
                    placeholder="cus_H1k2L3m4N5..."
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 outline-none transition-all text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant block uppercase tracking-wider">
                      Status do Plano
                    </label>
                    <select
                      value={planStatus}
                      onChange={(e) => setPlanStatus(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-2 py-2 outline-none transition-all text-xs appearance-none"
                    >
                      <option value="active">Ativo (active)</option>
                      <option value="trialling">Período de Testes (trialling)</option>
                      <option value="canceled">Cancelado (canceled)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant block uppercase tracking-wider">
                      Expira Em
                    </label>
                    <input
                      type="date"
                      value={subscriptionEndsAt}
                      onChange={(e) => setSubscriptionEndsAt(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-2 py-1.5 outline-none transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-on-surface-variant/75 flex items-start gap-1">
                  <span className="material-symbols-outlined text-[13px] text-secondary mt-0.5">info</span>
                  <span>O back-end (Firestore rules e Middleware) exige status <b>active</b> ou <b>trialling</b> para liberar as operações de estoque.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 text-on-surface-variant hover:bg-surface-container-high py-3 rounded-lg text-sm font-mono font-medium transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-secondary text-on-secondary py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Salvar
                </button>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Deseja realmente sair da sua conta?")) {
                      onLogout();
                    }
                  }}
                  className="w-full mt-2 bg-error/10 hover:bg-error/20 text-error py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-error/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Sair desta Conta
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
