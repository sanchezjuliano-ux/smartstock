'use client';

import Image from 'next/image';
import { PROFILES } from '@/lib/data';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { saveSharedData, subscribeSharedData } from '@/lib/sync';

export default function LoginView({ onLogin }: { onLogin: (profile: any) => void }) {
  const [profiles, setProfiles] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('virtual_pantry_profiles');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing profiles", e);
        }
      }
    }
    // Initialize default demo profiles with SaaS subscription fields
    return PROFILES.map((p, idx) => ({
      ...p,
      stripeCustomerId: `cus_demo_${p.name.toLowerCase()}`,
      planStatus: idx === 2 ? 'canceled' : 'active', // Let's make Joao canceled so the user can easily see subscription limits!
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  });

  useEffect(() => {
    saveSharedData({ profiles });
  }, [profiles]);

  useEffect(() => {
    const unsub = subscribeSharedData((data) => {
      if (data.profiles && data.profiles.length > 0) {
        setProfiles(data.profiles);
      }
    });
    return () => unsub();
  }, []);

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const renderAvatar = (imageUrl: string, name: string, sizeClass: string = "w-full h-full") => {
    const hasError = imageErrors[imageUrl] || !imageUrl || imageUrl.startsWith('blob:');
    
    if (hasError) {
      const colors = [
        'bg-teal-700 text-white',
        'bg-indigo-700 text-white',
        'bg-emerald-700 text-white',
        'bg-purple-700 text-white',
        'bg-amber-700 text-white',
        'bg-rose-700 text-white',
      ];
      const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const colorClass = colors[charCodeSum % colors.length];
      const initial = name.trim().charAt(0).toUpperCase();

      return (
        <div className={`flex items-center justify-center font-bold uppercase select-none rounded-full ${sizeClass} ${colorClass}`}>
          <span className="text-2xl md:text-3xl tracking-wider">{initial}</span>
        </div>
      );
    }

    return (
      <Image 
        src={imageUrl} 
        alt={name} 
        fill 
        className="object-cover" 
        referrerPolicy="no-referrer" 
        onError={() => {
          setImageErrors(prev => ({ ...prev, [imageUrl]: true }));
        }}
      />
    );
  };

  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryWhatsapp, setRecoveryWhatsapp] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(true);
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'sent' | 'resetting' | 'done'>('idle');
  const [recoveryLog, setRecoveryLog] = useState<string[]>([]);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetPasswordConfirmVal, setResetPasswordConfirmVal] = useState('');

  const [isAdminOverride, setIsAdminOverride] = useState(false);

  const [profileToDelete, setProfileToDelete] = useState<any>(null);
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('');
  const [deleteAdminError, setDeleteAdminError] = useState('');

  const [profileToEdit, setProfileToEdit] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editPassword, setEditPassword] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const [isAdminApprovalOpen, setIsAdminApprovalOpen] = useState(false);
  const [adminAuthPassword, setAdminAuthPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [selectedAdminForAuth, setSelectedAdminForAuth] = useState<string>('');
  const [pendingProfileToCreate, setPendingProfileToCreate] = useState<any>(null);

  const handleDeleteProfile = (profileName: string) => {
    const existingAdmins = profiles.filter((p: any) => p.role === 'admin');
    if (existingAdmins.length > 0) {
      const targetAdmin = existingAdmins.find((p: any) => p.name === selectedAdminForAuth) || existingAdmins[0];
      const expectedPassword = targetAdmin?.password || '123';
      if (deleteAdminPassword !== expectedPassword) {
        setDeleteAdminError('Senha do Administrador incorreta!');
        return;
      }
    }

    const updated = profiles.filter((p: any) => p.name !== profileName);
    setProfiles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('virtual_pantry_profiles', JSON.stringify(updated));
    }
    setProfileToDelete(null);
    setDeleteAdminPassword('');
    setDeleteAdminError('');
  };

  const handleOpenEditModal = (profile: any) => {
    setProfileToEdit(profile);
    setEditName(profile.name);
    setEditEmail(profile.email || '');
    setEditPhone(profile.phone || '');
    setEditWhatsapp(profile.whatsapp || '');
    setEditRole(profile.role || 'user');
    setEditPassword(profile.password || '123');
    setEditImagePreview(profile.image || null);
  };

  const handleSaveEditedProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !profileToEdit) return;

    const updated = profiles.map((p: any) => {
      if (p.name === profileToEdit.name) {
        return {
          ...p,
          name: editName,
          email: editEmail,
          phone: editPhone,
          whatsapp: editWhatsapp,
          role: editRole,
          password: editPassword,
          image: editImagePreview || p.image,
        };
      }
      return p;
    });

    setProfiles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('virtual_pantry_profiles', JSON.stringify(updated));
    }
    setProfileToEdit(null);
  };

  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setNewImagePreview(dataUrl);
        stopCamera();
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

  const hasAdmin = profiles.some(p => p.role === 'admin');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveNewProfile = (newProfile: any) => {
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('virtual_pantry_profiles', JSON.stringify(updated));
    }
    setIsCreatingProfile(false);
    setPendingProfileToCreate(null);
    setIsAdminApprovalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewWhatsapp('');
    setNewRole('user');
    setNewPassword('');
    setNewImagePreview(null);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProfile = {
      name: newName,
      email: newEmail,
      phone: newPhone,
      whatsapp: newWhatsapp,
      role: newRole,
      image: newImagePreview || `https://picsum.photos/seed/${encodeURIComponent(newName)}/200/200`,
      password: newPassword || '123'
    };

    const existingAdmins = profiles.filter((p: any) => p.role === 'admin');

    if (newRole === 'admin' && existingAdmins.length > 0) {
      setPendingProfileToCreate(newProfile);
      setSelectedAdminForAuth(existingAdmins[0].name);
      setAdminAuthPassword('');
      setAdminAuthError('');
      setIsAdminApprovalOpen(true);
      return;
    }

    saveNewProfile(newProfile);
  };

  const handleConfirmAdminApproval = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');

    const targetAdmin = profiles.find((p: any) => p.name === selectedAdminForAuth && p.role === 'admin');
    const expectedPassword = targetAdmin?.password || '123';

    if (adminAuthPassword !== expectedPassword) {
      setAdminAuthError('Senha do Administrador incorreta! Permissão negada.');
      return;
    }

    if (pendingProfileToCreate) {
      saveNewProfile(pendingProfileToCreate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const currentProfile = profiles.find((p: any) => p.name === selectedProfile?.name);
    const expectedPassword = currentProfile?.password || '123';

    if (password !== expectedPassword) {
      setLoginError('Senha incorreta! Por favor, verifique e tente novamente.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const loggedProfile = currentProfile || selectedProfile;
      const finalProfile = {
        ...loggedProfile,
        role: 'admin'
      };
      
      onLogin(finalProfile);
    }, 1000);
  };

  const handleOpenRecovery = () => {
    if (!selectedProfile) return;
    
    const email = selectedProfile.email || 
      (selectedProfile.name === 'Administrador' ? 'admin@despensavirtual.com' : 
       selectedProfile.name === 'Maria' ? 'maria@despensavirtual.com' : 
       selectedProfile.name === 'João' ? 'joao@despensavirtual.com' : 
       `${selectedProfile.name.toLowerCase().replace(/\s+/g, '')}@despensavirtual.com`);
       
    const whatsapp = selectedProfile.whatsapp || 
      (selectedProfile.name === 'Administrador' ? '+5511988887777' : 
       selectedProfile.name === 'Maria' ? '+5511977776666' : 
       selectedProfile.name === 'João' ? '+5511966665555' : 
       '+5511999999999');

    setRecoveryEmail(email);
    setRecoveryWhatsapp(whatsapp);
    setSendViaEmail(true);
    setSendViaWhatsapp(true);
    setRecoveryStatus('idle');
    setRecoveryLog([]);
    setResetPasswordVal('');
    setResetPasswordConfirmVal('');
    setIsRecoveryOpen(true);
  };

  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendViaEmail && !sendViaWhatsapp) {
      alert("Por favor, selecione pelo menos uma opção de envio (E-mail ou WhatsApp).");
      return;
    }
    
    setRecoveryStatus('sending');
    setRecoveryLog([]);
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    setRecoveryLog(prev => [...prev, "🔒 Gerando token de segurança criptografado..."]);
    await sleep(800);
    
    if (sendViaEmail) {
      setRecoveryLog(prev => [...prev, "📧 Conectando ao servidor de envio de e-mails..."]);
      await sleep(600);
      setRecoveryLog(prev => [...prev, `✉️ Enviando link de redefinição para ${recoveryEmail}...`]);
      await sleep(1000);
      setRecoveryLog(prev => [...prev, "✅ E-mail enviado com sucesso!"]);
    }
    
    if (sendViaWhatsapp) {
      setRecoveryLog(prev => [...prev, "💬 Conectando à API do WhatsApp..."]);
      await sleep(600);
      setRecoveryLog(prev => [...prev, `📲 Enviando mensagem com link para ${recoveryWhatsapp}...`]);
      await sleep(1000);
      setRecoveryLog(prev => [...prev, "✅ Mensagem de WhatsApp enviada!"]);
    }

    await sleep(400);
    setRecoveryStatus('sent');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordVal) return;
    if (resetPasswordVal !== resetPasswordConfirmVal) {
      alert("As senhas não coincidem!");
      return;
    }

    const updatedProfiles = profiles.map((p: any) => {
      if (p.name === selectedProfile.name) {
        return { ...p, password: resetPasswordVal };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    setRecoveryStatus('done');
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant shadow-lg rounded-xl overflow-hidden z-10 relative">
        <div className="p-8 text-center space-y-2 border-b border-outline-variant relative">
          {(selectedProfile || isCreatingProfile) && (
            <button
              onClick={() => {
                if (isCreatingProfile) {
                  setIsCreatingProfile(false);
                } else {
                  setSelectedProfile(null);
                  setPassword('');
                  setLoginError('');
                }
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface cursor-pointer z-20"
              title="Voltar"
            >
              <span className="material-symbols-outlined font-bold text-xl">arrow_back</span>
            </button>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Despensa Virtual</h1>
          <p className="text-on-surface-variant">
            {isCreatingProfile ? 'Adicione um novo membro' : selectedProfile ? 'Acesse o seu perfil' : 'Quem está gerenciando a despensa agora?'}
          </p>
        </div>

        {isCreatingProfile ? (
          <div className="p-8 md:p-12 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex flex-col items-center max-w-sm mx-auto">
              <form className="w-full space-y-6" onSubmit={handleCreateProfile}>
                <div className="flex flex-col items-center gap-2 w-full">
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
                      className="w-24 h-24 rounded-full border-2 border-dashed border-outline-variant hover:border-secondary transition-colors cursor-pointer relative overflow-hidden flex items-center justify-center bg-surface-container-high"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {newImagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={newImagePreview} alt="Preview" className="w-full h-full object-cover" />
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
                      <span className="text-[10px] font-mono font-medium text-on-surface-variant uppercase tracking-wider mt-1">Adicionar Foto</span>
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
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Digite o nome"
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Tipo de Perfil
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewRole('user')}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        newRole === 'user'
                          ? 'bg-secondary/15 border-secondary text-secondary shadow-sm'
                          : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      Usuário Padrão
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('admin')}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        newRole === 'admin'
                          ? 'bg-primary/15 border-primary text-primary shadow-sm'
                          : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                      Administrador
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
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
                      value={newWhatsapp}
                      onChange={(e) => setNewWhatsapp(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all text-sm font-mono"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    type="submit"
                    className="w-full bg-secondary text-on-secondary py-3 rounded-lg text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center h-12 cursor-pointer"
                  >
                    Salvar Perfil
                  </button>
                  <button
                    type="button"
                    className="w-full text-on-surface-variant hover:text-on-surface py-2 text-xs font-mono font-medium transition-colors uppercase"
                    onClick={() => {
                      setIsCreatingProfile(false);
                      setNewImagePreview(null);
                      setNewName('');
                      setNewEmail('');
                      setNewPhone('');
                      setNewWhatsapp('');
                      setNewPassword('');
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : !selectedProfile ? (
          <div className="p-8 md:p-12 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {profiles.map((profile) => (
                <div
                  key={profile.name}
                  className="group relative flex flex-col items-center gap-4 transition-all duration-300 outline-none"
                >
                  <div className="absolute -top-2 inset-x-0 z-20 flex justify-between items-center px-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(profile);
                      }}
                      className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-secondary text-on-surface-variant hover:text-on-secondary border border-outline-variant flex items-center justify-center transition-all duration-200 shadow-sm opacity-80 hover:opacity-100 group-hover:scale-110 cursor-pointer"
                      title={`Editar perfil de ${profile.name}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileToDelete(profile);
                        setDeleteAdminPassword('');
                        setDeleteAdminError('');
                      }}
                      className="w-8 h-8 rounded-full bg-error/10 hover:bg-error text-error hover:text-on-error border border-error/20 flex items-center justify-center transition-all duration-200 shadow-sm opacity-80 hover:opacity-100 group-hover:scale-110 cursor-pointer"
                      title={`Excluir perfil de ${profile.name}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfile(profile);
                      setIsAdminOverride(profile.role === 'admin');
                    }}
                    className="flex flex-col items-center gap-4 cursor-pointer outline-none w-full mt-3"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-outline-variant group-hover:border-secondary transition-all p-1 group-hover:scale-105">
                        <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-high relative flex items-center justify-center">
                          {renderAvatar(profile.image, profile.name)}
                        </div>
                      </div>
                      {profile.role === 'admin' && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-sm font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">shield</span>
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-semibold group-hover:text-secondary transition-colors">{profile.name}</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-12 pt-8 border-t border-outline-variant flex justify-center">
              <button 
                className="flex items-center gap-2 text-on-surface-variant hover:text-secondary text-sm font-mono font-medium transition-colors uppercase"
                onClick={() => setIsCreatingProfile(true)}
              >
                <span className="material-symbols-outlined">add_circle</span>
                Adicionar Perfil
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 md:p-12 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex flex-col items-center max-w-sm mx-auto">
              <div className="w-20 h-20 rounded-full border-2 border-secondary p-1 mb-6">
                <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-high relative flex items-center justify-center">
                  {renderAvatar(selectedProfile.image, selectedProfile.name)}
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-1">Olá, {selectedProfile.name}!</h2>
              <p className="text-sm text-on-surface-variant mb-8 text-center">Digite sua senha para acessar a Despensa Virtual.</p>
              
              <form className="w-full space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError('');
                      }}
                      placeholder="••••••••"
                      className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary flex items-center justify-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-error/10 border border-error/20 text-error text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                    <span className="font-medium">{loginError}</span>
                  </div>
                )}

                <div className="flex justify-end -mt-3">
                  <button
                    type="button"
                    onClick={handleOpenRecovery}
                    className="text-xs font-semibold text-secondary hover:underline transition-all cursor-pointer font-mono"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-secondary text-on-secondary py-3 rounded-lg text-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center h-12"
                  >
                    {isLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Entrar'}
                  </button>
                  <button
                    type="button"
                    className="w-full text-on-surface-variant hover:text-on-surface py-2 text-xs font-mono font-medium transition-colors uppercase"
                    onClick={() => {
                      setSelectedProfile(null);
                      setIsAdminOverride(false);
                      setPassword('');
                      setLoginError('');
                    }}
                  >
                    Alterar Perfil
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isRecoveryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (recoveryStatus !== 'sending') {
                  setIsRecoveryOpen(false);
                }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-outline-variant w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">lock_reset</span>
                  <h3 className="text-lg font-bold text-on-surface">Recuperação de Senha</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(false)}
                  disabled={recoveryStatus === 'sending'}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                {recoveryStatus === 'idle' && (
                  <form onSubmit={handleSendRecovery} className="space-y-4">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Escolha os canais para envio do link seguro de alteração de senha para o perfil <strong className="text-on-surface">{selectedProfile?.name}</strong>.
                    </p>

                    <div className="space-y-3 pt-2">
                      {/* Email Option */}
                      <div className="p-3.5 border border-outline-variant/60 rounded-xl bg-surface-container-low flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendViaEmail}
                            onChange={(e) => setSendViaEmail(e.target.checked)}
                            className="w-4 h-4 text-secondary border-outline rounded focus:ring-secondary cursor-pointer accent-secondary"
                          />
                          <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[16px] text-secondary">mail</span>
                            Enviar por E-mail
                          </div>
                        </label>
                        {sendViaEmail && (
                          <input
                            type="email"
                            required
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="seuemail@exemplo.com"
                            className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-sm outline-none transition-all"
                          />
                        )}
                      </div>

                      {/* WhatsApp Option */}
                      <div className="p-3.5 border border-outline-variant/60 rounded-xl bg-surface-container-low flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendViaWhatsapp}
                            onChange={(e) => setSendViaWhatsapp(e.target.checked)}
                            className="w-4 h-4 text-secondary border-outline rounded focus:ring-secondary cursor-pointer accent-secondary"
                          />
                          <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[16px] text-green-600">chat</span>
                            Enviar por WhatsApp
                          </div>
                        </label>
                        {sendViaWhatsapp && (
                          <input
                            type="text"
                            required
                            value={recoveryWhatsapp}
                            onChange={(e) => setRecoveryWhatsapp(e.target.value)}
                            placeholder="+55 (11) 99999-9999"
                            className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-sm outline-none transition-all"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-secondary text-on-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity active:scale-[0.98] cursor-pointer mt-4"
                    >
                      Enviar Link de Recuperação
                    </button>
                  </form>
                )}

                {recoveryStatus === 'sending' && (
                  <div className="py-6 flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-secondary animate-spin">sync</span>
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-secondary">Enviando Link...</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Por favor, aguarde enquanto processamos o seu envio seguro.</p>
                    </div>

                    <div className="w-full bg-surface-container-high/40 rounded-xl p-4 font-mono text-[10px] text-on-surface-variant space-y-1.5 border border-outline-variant/40 max-h-36 overflow-y-auto">
                      {recoveryLog.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recoveryStatus === 'sent' && (
                  <div className="space-y-4 py-2">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-green-600">Envio Concluído!</h4>
                      <p className="text-xs text-on-surface-variant">
                        O link para alteração de senha foi disparado com sucesso.
                      </p>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-2.5">
                      <div className="text-xs font-bold text-on-surface uppercase tracking-wide border-b border-outline-variant/40 pb-1.5">
                        Resumo do Envio
                      </div>
                      {sendViaEmail && (
                        <div className="flex justify-between text-xs gap-4">
                          <span className="text-on-surface-variant shrink-0">E-mail:</span>
                          <span className="font-mono font-medium text-on-surface truncate">{recoveryEmail}</span>
                        </div>
                      )}
                      {sendViaWhatsapp && (
                        <div className="flex justify-between text-xs gap-4">
                          <span className="text-on-surface-variant shrink-0">WhatsApp:</span>
                          <span className="font-mono font-medium text-on-surface truncate">{recoveryWhatsapp}</span>
                        </div>
                      )}
                    </div>

                    {/* Simulation Shortcut */}
                    <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-xl space-y-2 text-center">
                      <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Simulação do Link Recebido</p>
                      <p className="text-[11px] text-on-surface-variant">Para testar o fluxo de ponta a ponta sem sair da tela, clique para acessar o link de redefinição:</p>
                      <button
                        type="button"
                        onClick={() => setRecoveryStatus('resetting')}
                        className="w-full bg-secondary/15 hover:bg-secondary/25 text-secondary py-2.5 rounded-lg text-xs font-bold transition-colors active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">link</span>
                        Redefinir Senha Agora
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRecoveryOpen(false)}
                      className="w-full bg-surface border border-outline-variant text-on-surface py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-container transition-colors active:scale-[0.98] cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                )}

                {recoveryStatus === 'resetting' && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Defina uma nova senha de acesso para o perfil <strong className="text-on-surface">{selectedProfile?.name}</strong>.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase block">Nova Senha</label>
                        <input
                          type="password"
                          required
                          value={resetPasswordVal}
                          onChange={(e) => setResetPasswordVal(e.target.value)}
                          placeholder="Digite a nova senha"
                          className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-sm outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase block">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          required
                          value={resetPasswordConfirmVal}
                          onChange={(e) => setResetPasswordConfirmVal(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-sm outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-secondary text-on-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity active:scale-[0.98] cursor-pointer mt-4"
                    >
                      Salvar Nova Senha
                    </button>
                  </form>
                )}

                {recoveryStatus === 'done' && (
                  <div className="space-y-4 py-2">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-3xl">vpn_key</span>
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-green-600">Senha Alterada!</h4>
                      <p className="text-xs text-on-surface-variant">
                        Sua senha foi redefinida com sucesso. Você já pode fazer login usando a nova senha.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRecoveryOpen(false)}
                      className="w-full bg-secondary text-on-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity active:scale-[0.98] cursor-pointer"
                    >
                      Voltar ao Login
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Profile Deletion */}
      <AnimatePresence>
        {profileToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setProfileToDelete(null);
                setDeleteAdminPassword('');
                setDeleteAdminError('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-outline-variant w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Excluir Perfil?</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Tem certeza que deseja excluir o perfil de <strong className="text-on-surface">{profileToDelete.name}</strong>?
                </p>
              </div>

              {profiles.some((p: any) => p.role === 'admin') && (
                <div className="text-left space-y-1">
                  <label className="text-[11px] font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Senha do Administrador
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={deleteAdminPassword}
                    onChange={(e) => {
                      setDeleteAdminPassword(e.target.value);
                      setDeleteAdminError('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-outline-variant focus:border-error focus:ring-1 focus:ring-error rounded-lg px-3 py-2 text-sm outline-none font-mono"
                  />
                </div>
              )}

              {deleteAdminError && (
                <div className="p-2.5 bg-error/10 border border-error/20 text-error text-xs rounded-lg flex items-center gap-1.5 text-left">
                  <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                  <span className="font-medium">{deleteAdminError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileToDelete(null);
                    setDeleteAdminPassword('');
                    setDeleteAdminError('');
                  }}
                  className="flex-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(profileToDelete.name)}
                  className="flex-1 bg-error hover:bg-error/90 text-on-error py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Authorization Modal for New Admin Creation */}
      <AnimatePresence>
        {isAdminApprovalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminApprovalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-outline-variant w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Autorização de Administrador</h3>
                  <p className="text-xs text-on-surface-variant">Aprovação necessária para novo Administrador</p>
                </div>
              </div>

              <form onSubmit={handleConfirmAdminApproval} className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Para autorizar o cadastro do novo Administrador <strong className="text-on-surface">{pendingProfileToCreate?.name}</strong>, selecione o Administrador atual e insira sua senha:
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Administrador Responsável
                  </label>
                  <select
                    value={selectedAdminForAuth}
                    onChange={(e) => setSelectedAdminForAuth(e.target.value)}
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2.5 text-sm outline-none font-medium"
                  >
                    {profiles.filter((p: any) => p.role === 'admin').map((admin: any) => (
                      <option key={admin.name} value={admin.name}>
                        {admin.name} ({admin.email || 'Admin'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Senha do Administrador
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={adminAuthPassword}
                    onChange={(e) => {
                      setAdminAuthPassword(e.target.value);
                      setAdminAuthError('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-4 py-3 text-sm outline-none font-mono"
                  />
                </div>

                {adminAuthError && (
                  <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                    <span className="font-medium">{adminAuthError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminApprovalOpen(false)}
                    className="flex-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-on-primary py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Autorizar & Cadastrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {profileToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileToEdit(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-outline-variant w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">edit</span>
                  <h3 className="text-lg font-bold text-on-surface">Editar Perfil</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileToEdit(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveEditedProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2.5 text-sm outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2.5 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Tipo de Perfil
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditRole('user')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        editRole === 'user'
                          ? 'bg-secondary/15 border-secondary text-secondary'
                          : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      Usuário Padrão
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole('admin')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        editRole === 'admin'
                          ? 'bg-primary/15 border-primary text-primary'
                          : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                      Administrador
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-on-surface-variant block uppercase tracking-wider">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-surface border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setProfileToEdit(null)}
                    className="flex-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
