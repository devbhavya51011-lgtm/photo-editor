import React from 'react';
import { Message } from '../types';
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
      <div className="flex w-full justify-end mb-8 group">
        <div className="flex max-w-[90%] sm:max-w-[80%] flex-col items-end gap-3">
             {message.originalImageUrl && (
                <div className="relative group/img overflow-hidden rounded-2xl border border-zinc-800 w-32 sm:w-48 shadow-2xl transition-transform hover:scale-[1.02] cursor-help">
                   <div className="absolute top-0 left-0 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-3 py-1.5 z-10 tracking-wider">SOURCE</div>
                   <img src={message.originalImageUrl} alt="Input" className="w-full h-auto object-cover opacity-90 group-hover/img:opacity-100 transition-opacity" />
                </div>
             )}
             <div className="bg-zinc-800 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm text-sm sm:text-base leading-relaxed border border-zinc-700/50">
               {message.text}
             </div>
        </div>
      </div>
    );
  }

  // Model Message
  return (
    <div className="flex w-full justify-start mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex w-full gap-4 sm:gap-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
          <Shirt size={14} className="text-zinc-300" />
        </div>

        <div className="flex flex-col items-start gap-4 w-full max-w-3xl">
          {message.text && (
            <div className="text-zinc-300 text-sm sm:text-base leading-7 tracking-wide font-light">
              {message.text}
            </div>
          )}

          {message.isThinking && (
             <div className="flex items-center gap-3 text-zinc-500 text-xs uppercase tracking-widest font-semibold px-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                Crafting...
             </div>
          )}

          {/* Generated Result */}
          {message.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black/40 w-full group mt-2">
               {/* Header overlay */}
               <div className="absolute top-4 left-4 flex gap-2 z-10">
                   <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles size={10} className="text-indigo-400" /> Generated
                   </div>
               </div>
               
               <img src={message.imageUrl} alt="Generated" className="w-full h-auto object-contain max-h-[600px]" />
               
               {/* Footer Overlay */}
               <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex justify-end">
                 <button 
                  onClick={() => handleDownload(message.imageUrl!)}
                  className="bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xl transform transition-transform active:scale-95"
                 >
                   <Download size={14} /> DOWNLOAD
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};