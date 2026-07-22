'use client';

import { HISTORY_ITEMS } from '@/lib/data';
import { useState, useRef, useEffect } from 'react';
import ActiveShoppingSession from './ActiveShoppingSession';
import ExportModal from './ExportModal';

export default function HistoryChatView({ historyItems = HISTORY_ITEMS, setHistoryItems, inventory = [], setInventory }: { historyItems?: any[], setHistoryItems?: (items: any[]) => void, inventory?: any[], setInventory?: (inv: any[]) => void }) {
  const [activeShoppingId, setActiveShoppingId] = useState<number | null>(null);
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportData, setExportData] = useState<{title: string, items: any[], total: number, date: string} | null>(null);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Olá! Sou seu Assistente da Despensa Virtual. Vi que você tem **Peito de Frango**, **Creme de Leite** e **Cogumelos** que vencem em 2 dias. Quer uma sugestão de receita ou dicas de armazenamento?',
      time: '10:45',
      suggestions: ['Dê-me uma receita', 'Dicas de congelamento', 'O que mais vai vencer?']
    },
    {
      id: 2,
      sender: 'user',
      text: 'Sim, sugira uma receita rápida com esses ingredientes para o jantar de hoje.',
      time: '10:46'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = now.getTime();
    
    const newUserMsg = {
      id: id,
      sender: 'user',
      text,
      time: timeString
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newAiMsg = {
        id: id + 1,
        sender: 'ai',
        text: 'Excelente escolha! Para o Strogonoff rápido: doure o frango, adicione os cogumelos fatiados e finalize com o creme de leite. Gostaria que eu adicionasse Arroz à sua lista de compras para acompanhar?',
        time: aiTime,
        suggestions: ['Sim, por favor', 'Não precisa', 'Adicione batata palha também']
      };
      setMessages(prev => [...prev, newAiMsg]);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <section className="lg:col-span-7 space-y-6">
        {activeShoppingId !== null ? (
          <ActiveShoppingSession 
            item={historyItems.find(i => i.id === activeShoppingId)} 
            inventory={inventory || []} 
            setInventory={setInventory || (() => {})} 
            historyItems={historyItems || []}
            setHistoryItems={setHistoryItems || (() => {})} 
            onClose={() => setActiveShoppingId(null)} 
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-on-surface">Histórico de Compras</h3>
              <span className="text-[12px] font-mono font-medium text-on-surface-variant uppercase">Últimos 30 dias</span>
            </div>

            <div className="space-y-4">
              {historyItems.map((item, index) => (
                <div key={item.id} className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:bg-surface-container-low transition-colors group ${index === 2 ? 'opacity-80' : ''}`}>
                  <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-outline-variant">
                        <span className="material-symbols-outlined text-secondary">{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{item.store}</h4>
                        <p className="text-[12px] font-mono font-medium text-on-surface-variant uppercase">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-bold text-on-surface">R$ {item.amount.toFixed(2).replace('.', ',')}</p>
                      <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">{item.store === 'Fechamento Automático' ? 'PRONTO PARA ENVIO' : 'CONCLUÍDO'}</span>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] font-mono font-medium text-on-surface-variant uppercase">Itens em Destaque</span>
                      <p className="text-sm text-on-surface truncate">{item.items}</p>
                    </div>
                    <div className="flex justify-end items-center gap-4">
                      <button 
                        onClick={() => {
                          const exportItems = item.items.split(',').map((name: string) => {
                            const cleanName = name.trim();
                            const invItem = inventory.find(i => i.name.toLowerCase() === cleanName.toLowerCase());
                            return {
                              name: cleanName,
                              brand: invItem?.brand || 'Outros',
                              price: invItem?.price || (item.amount / item.count),
                              quantityNeeded: 1
                            };
                          });
                          setExportData({
                            title: `Compra - ${item.store}`,
                            items: exportItems,
                            total: item.amount,
                            date: item.date
                          });
                          setIsExportOpen(true);
                        }}
                        className="flex items-center gap-1 text-[12px] font-mono font-bold text-secondary hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">share</span>
                        Exportar
                      </button>
                      <button onClick={() => setActiveShoppingId(item.id)} className="flex items-center gap-1 text-[12px] font-mono font-medium text-primary hover:underline cursor-pointer">
                        Ver todos ({item.count} itens)
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="lg:col-span-5 lg:sticky lg:top-24 h-[600px] flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-fixed">smart_toy</span>
            </div>
            <div>
              <h4 className="font-bold text-base">Assistente IA</h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Online</span>
              </div>
            </div>
          </div>
          <button className="hover:bg-on-primary-fixed p-1 rounded-full transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.sender === 'ai' ? (
                <div>
                  <div className="flex gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">smart_toy</span>
                    </div>
                    <div className="space-y-1">
                      <div className="bg-surface-container-low p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-outline-variant shadow-sm text-sm">
                        {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono pl-1">{msg.time}</span>
                    </div>
                  </div>
                  {msg.suggestions && (
                    <div className="flex flex-wrap gap-2 pl-11 mt-3 animate-in fade-in slide-in-from-bottom-2">
                      {msg.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(suggestion)}
                          className="bg-surface border border-outline-variant hover:bg-secondary-container/10 hover:border-secondary px-3 py-1.5 rounded-full text-[11px] font-bold text-on-surface-variant transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3 max-w-[90%] ml-auto flex-row-reverse animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mt-1">
                    <span className="material-symbols-outlined text-white text-sm">person</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="bg-primary text-on-primary p-3 rounded-tl-xl rounded-br-xl rounded-bl-xl shadow-md text-sm text-left inline-block">
                      {msg.text}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-on-surface-variant font-mono pr-1">{msg.time}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 max-w-[90%] animate-in fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center mt-1">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">smart_toy</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-outline-variant w-16 h-10 flex items-center justify-center">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pergunte sobre receitas ou estoque..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:bg-surface-variant disabled:text-outline transition-all"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
          <div className="flex items-center gap-4 mt-3 pl-1">
            <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">image</span>
              <span className="text-[12px] font-mono font-medium">Anexar Nota</span>
            </button>
            <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">mic</span>
              <span className="text-[12px] font-mono font-medium">Voz</span>
            </button>
          </div>
        </div>
      </section>

      {exportData && (
        <ExportModal 
          isOpen={isExportOpen}
          onClose={() => {
            setIsExportOpen(false);
            setExportData(null);
          }}
          title={exportData.title}
          items={exportData.items}
          total={exportData.total}
          date={exportData.date}
        />
      )}
    </div>
  );
}
