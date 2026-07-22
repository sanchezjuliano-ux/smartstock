'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: any[];
  total: number;
  date: string;
}

export default function ExportModal({ isOpen, onClose, title, items, total, date }: ExportModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Format list to clean text
  const getFormattedText = () => {
    let text = `📝 *${title}*\n📅 ${date}\n\n`;
    items.forEach(item => {
      const qty = item.quantityNeeded || item.quantity || 1;
      const price = item.price || 0;
      const subtotal = (price * qty).toFixed(2).replace('.', ',');
      text += `• ${item.name} (${item.brand || 'Outros'}) - ${qty} un. | R$ ${subtotal}\n`;
    });
    text += `\n💰 *Total Estimado: R$ ${total.toFixed(2).replace('.', ',')}*`;
    return text;
  };

  // 1. Export as PNG Image
  const handleExportImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const itemHeight = 44;
    const headerHeight = 120;
    const footerHeight = 110;
    
    canvas.width = 640;
    canvas.height = headerHeight + (items.length * itemHeight) + footerHeight + (padding * 2);

    // Rounded rectangle helper
    const drawRoundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Draw outer background (aesthetic soft gray)
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw main container card
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;
    drawRoundRect(padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2), 24);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // reset shadow

    // Stroke border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const textX = padding + 32;

    // Header Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(title, textX, padding + 54);

    // Header Subtitle (Date)
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 13px font-mono, system-ui, sans-serif';
    ctx.fillText(`📅 ${date.toUpperCase()}`, textX, padding + 82);

    // Header Divider
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(textX, padding + 102);
    ctx.lineTo(canvas.width - padding - 32, padding + 102);
    ctx.stroke();

    // Draw Items
    let currentY = padding + headerHeight + 20;
    
    items.forEach((item, index) => {
      const qty = item.quantityNeeded || item.quantity || 1;
      const price = item.price || 0;
      const subtotal = (price * qty).toFixed(2).replace('.', ',');

      // Checkbox circle
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(textX + 10, currentY - 5, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Item Name
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      const nameText = item.name.length > 30 ? item.name.substring(0, 28) + '...' : item.name;
      ctx.fillText(nameText, textX + 28, currentY);

      // Item Brand
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(item.brand || 'Outros', textX + 28, currentY + 14);

      // Quantity badge background
      ctx.fillStyle = '#f3f4f6';
      drawRoundRect(canvas.width - padding - 180, currentY - 14, 45, 20, 6);
      ctx.fill();

      // Quantity text
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${qty} un`, canvas.width - padding - 157, currentY);
      ctx.textAlign = 'left'; // reset text align

      // Price / Subtotal
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 14px font-mono, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`R$ ${subtotal}`, canvas.width - padding - 32, currentY + 2);
      ctx.textAlign = 'left'; // reset text align

      currentY += itemHeight;
    });

    // Footer Divider
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(textX, currentY - 10);
    ctx.lineTo(canvas.width - padding - 32, currentY - 10);
    ctx.stroke();

    // Draw Footer Total
    ctx.fillStyle = '#4b5563';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('TOTAL DA LISTA:', textX, currentY + 24);

    ctx.fillStyle = '#6200ee'; // Primary color
    ctx.font = 'bold 24px font-mono, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`R$ ${total.toFixed(2).replace('.', ',')}`, canvas.width - padding - 32, currentY + 26);
    ctx.textAlign = 'left'; // reset

    // watermark
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 10px system-ui, -apple-system, sans-serif';
    ctx.fillText('Gerado por Despensa Virtual', textX, currentY + 50);

    // Download PNG
    try {
      const link = document.createElement('a');
      link.download = `lista-de-compras-${date.replace(/[\s•,:/]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem", err);
      alert("Não foi possível gerar a imagem devido a restrições de permissão ou de sandbox do navegador.");
    }
  };

  // 2. Export as PDF / Print Format
  const handleExportPDF = () => {
    const itemsHtml = items.map(item => {
      const qty = item.quantityNeeded || item.quantity || 1;
      const price = item.price || 0;
      const subtotal = (price * qty).toFixed(2).replace('.', ',');
      return `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">
            <div style="font-weight: bold; font-size: 14px; color: #111827;">${item.name}</div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 500;">${item.brand || 'Outros'}</div>
          </td>
          <td style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151; font-weight: bold; font-size: 14px;">
            ${qty}
          </td>
          <td style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827; font-family: monospace; font-size: 14px;">
            R$ ${subtotal}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
              padding: 40px; 
              color: #111827; 
              background: #ffffff; 
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              border-bottom: 3px solid #6200ee; 
              padding-bottom: 24px; 
              margin-bottom: 30px; 
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title { 
              font-size: 28px; 
              font-weight: 800; 
              margin: 0; 
              color: #111827;
              letter-spacing: -0.025em;
            }
            .meta { 
              font-size: 13px; 
              color: #6b7280; 
              margin-top: 6px; 
              font-family: monospace;
            }
            .brand {
              font-weight: bold;
              color: #6200ee;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.1em;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
            }
            th { 
              padding: 12px; 
              border-bottom: 2px solid #e5e7eb; 
              text-align: left; 
              font-size: 11px; 
              text-transform: uppercase; 
              color: #4b5563; 
              font-weight: bold; 
              letter-spacing: 0.05em;
            }
            .total-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 15px;
              font-weight: bold;
              color: #4b5563;
            }
            .total-value {
              font-size: 24px;
              font-weight: 800;
              color: #6200ee;
              font-family: monospace;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <span class="brand">Despensa Virtual</span>
              <h1 class="title">${title}</h1>
              <div class="meta">Criada em: ${date}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 60%;">PRODUTO</th>
                <th style="text-align: center; width: 15%;">QTD</th>
                <th style="text-align: right; width: 25%;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-card">
            <span class="total-label">VALOR TOTAL ESTIMADO</span>
            <span class="total-value">R$ ${total.toFixed(2).replace('.', ',')}</span>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `;

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        }, 500);
      } else {
        throw new Error("Could not access iframe document");
      }
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF diretamente. Por favor, tente novamente ou use as opções de copiar link e WhatsApp.");
    }
  };

  // 3. Copy Shareable link to Clipboard
  const handleCopyLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const listData = {
      title,
      items: items.map(i => ({
        name: i.name,
        brand: i.brand || '',
        quantity: i.quantityNeeded || i.quantity || 1,
        price: i.price || 0
      })),
      total,
      date
    };
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(listData))));
      const shareUrl = `${baseUrl}?shared_list=${encoded}`;
      
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar o link.");
    }
  };

  // 4. Send via WhatsApp
  const handleSendWhatsApp = () => {
    const text = getFormattedText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // 5. Send via Email
  const handleSendEmail = () => {
    const subject = `${title} - Despensa Virtual`;
    const text = getFormattedText().replace(/\*/g, ''); // remove bold markdown
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface-container-lowest border border-outline-variant w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/40">
          <div>
            <h3 className="text-lg font-bold">Exportar & Compartilhar</h3>
            <p className="text-xs text-on-surface-variant">Escolha como deseja exportar sua lista de compras</p>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection (PDF, Image, Link) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono text-outline uppercase tracking-wider">Formatos de Exportação</h4>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={handleExportImage}
                className="flex flex-col items-center justify-center p-3 border border-outline-variant rounded-xl bg-surface hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer text-center group"
              >
                <span className="material-symbols-outlined text-2xl text-secondary mb-1 group-hover:scale-110 transition-transform">image</span>
                <span className="text-[11px] font-bold">Imagem (PNG)</span>
              </button>

              <button 
                onClick={handleExportPDF}
                className="flex flex-col items-center justify-center p-3 border border-outline-variant rounded-xl bg-surface hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer text-center group"
              >
                <span className="material-symbols-outlined text-2xl text-error mb-1 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                <span className="text-[11px] font-bold">Gerar PDF</span>
              </button>

              <button 
                onClick={handleCopyLink}
                className={`flex flex-col items-center justify-center p-3 border border-outline-variant rounded-xl bg-surface hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer text-center group ${copiedLink ? 'border-primary bg-primary/5' : ''}`}
              >
                <span className={`material-symbols-outlined text-2xl mb-1 group-hover:scale-110 transition-transform ${copiedLink ? 'text-primary' : 'text-primary'}`}>
                  {copiedLink ? 'task_alt' : 'link'}
                </span>
                <span className="text-[11px] font-bold">{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* Social Sending Integrations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono text-outline uppercase tracking-wider">Enviar / Compartilhar</h4>
            <div className="space-y-2">
              <button 
                onClick={handleSendWhatsApp}
                className="w-full flex items-center justify-between p-3.5 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-left cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold">WhatsApp</div>
                    <div className="text-xs text-on-surface-variant">Enviar mensagem direta formatada</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
              </button>

              <button 
                onClick={handleSendEmail}
                className="w-full flex items-center justify-between p-3.5 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-left cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold">E-mail</div>
                    <div className="text-xs text-on-surface-variant">Enviar por correio eletrônico</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
              </button>

              <button 
                onClick={async () => {
                  let text = `${title}\n${date}\n\n`;
                  items.forEach(item => {
                    const qty = item.quantityNeeded || item.quantity || 1;
                    text += `• ${item.name}: Qtd ${qty}\n`;
                  });
                  text += `\nTotal Estimado: R$ ${total.toFixed(2).replace('.', ',')}`;

                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: title,
                        text: text,
                      });
                    } catch (err) {
                      console.log("Erro ao compartilhar", err);
                    }
                  } else {
                    navigator.clipboard.writeText(text);
                    alert("Texto da lista copiado para compartilhamento!");
                  }
                }}
                className="w-full flex items-center justify-between p-3.5 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-left cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-500/10 text-purple-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold">Outros Aplicativos</div>
                    <div className="text-xs text-on-surface-variant">Usar compartilhamento nativo do sistema</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
