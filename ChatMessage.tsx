import React from 'react';
import { Message } from './types';
import { Download, Shirt, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `rechange-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isUser) {
    return (
      <div className="d-flex w-100 justify-content-end mb-4 group">
        <div className="d-flex flex-column align-items-end" style={{ maxWidth: '85%' }}>
             {message.originalImageUrl && (
                <div className="position-relative overflow-hidden rounded-3 border border-white border-opacity-25 mb-2 shadow-sm" style={{ width: '150px' }}>
                   <div className="position-absolute top-0 start-0 bg-brand-gradient text-white px-2 py-1" style={{ fontSize: '9px', fontWeight: 'bold' }}>SOURCE</div>
                   <img src={message.originalImageUrl} alt="Input" className="w-100 h-auto" />
                </div>
             )}
             <div className="bg-brand-gradient text-white px-4 py-2 rounded-4 rounded-tr-none shadow-md text-break fw-medium" style={{fontSize: '0.95rem'}}>
               {message.text}
             </div>
        </div>
      </div>
    );
  }

  // Model Message
  return (
    <div className="d-flex w-100 justify-content-start mb-5">
      <div className="d-flex gap-3 w-100">
        <div className="flex-shrink-0">
            <div className="d-flex align-items-center justify-content-center bg-dark border border-secondary rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }}>
                <Shirt size={20} className="text-white" />
            </div>
        </div>

        <div className="d-flex flex-column gap-3 w-100" style={{ maxWidth: '750px' }}>
          {message.text && (
            <div className="p-3 bg-dark bg-opacity-50 border border-secondary rounded-4 rounded-tl-none text-light text-opacity-90" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              {message.text}
            </div>
          )}

          {message.isThinking && (
             <div className="d-flex align-items-center gap-2 text-secondary small text-uppercase fw-bold ps-2">
                <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                <span className="text-gradient-brand">Crafting Magic...</span>
             </div>
          )}

          {/* Generated Result */}
          {message.imageUrl && (
            <div className="position-relative rounded-4 overflow-hidden border border-secondary shadow-lg bg-black mt-1">
               {/* Header overlay */}
               <div className="position-absolute top-0 start-0 p-3 z-1">
                   <div className="badge bg-black bg-opacity-50 backdrop-blur border border-white border-opacity-10 text-white d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
                      <Sparkles size={12} className="text-info" /> 
                      <span className="fw-normal">Generated</span>
                   </div>
               </div>
               
               <img src={message.imageUrl} alt="Generated" className="w-100 h-auto object-contain" style={{ maxHeight: '600px' }} />
               
               {/* Footer Overlay */}
               <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-gradient-to-t d-flex justify-content-end" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                 <button 
                  onClick={() => handleDownload(message.imageUrl!)}
                  className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-2 rounded-pill px-4"
                 >
                   <Download size={14} /> SAVE IMAGE
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};