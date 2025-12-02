import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, ImagePlus, X, Loader2, 
  Menu, Grid, MessageSquare, Plus, Trash2,
  ExternalLink, History, Shirt, ChevronRight
} from 'lucide-react';
// Imports from root folder
import { generateEditedImage, fileToBase64, extractBase64FromDataUrl } from './geminiService';
import { Message, ImageFile, GalleryItem, ChatSession } from './types';
import { ChatMessage } from './ChatMessage';

const App: React.FC = () => {
  // --- State ---
  const [currentView, setCurrentView] = useState<'chat' | 'gallery'>('chat');
  const [sidebarVisible, setSidebarVisible] = useState(false); // Mobile toggle
  
  // Sessions & History
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'default',
      title: 'New Project',
      messages: [{
        id: 'welcome',
        role: 'model',
        text: "Welcome to ReChange. I'm powered by the advanced Nano Banana model. Upload an image to start transforming your fashion or photos instantly.",
        timestamp: Date.now()
      }],
      updatedAt: Date.now()
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Active Chat State
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Derived State
  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  // --- Effects ---

  // Auto-scroll
  useEffect(() => {
    if (currentView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  // --- Handlers ---

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Untitled Project',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setCurrentView('chat');
    setSelectedImage(null); 
    setSidebarVisible(false);
  };

  const switchSession = (id: string) => {
    setCurrentSessionId(id);
    setCurrentView('chat');
    setSidebarVisible(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id && newSessions.length > 0) {
      setCurrentSessionId(newSessions[0].id);
    } else if (newSessions.length === 0) {
      createNewSession();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        setSelectedImage({ file, previewUrl, base64, mimeType: file.type });
      } catch (error) {
        console.error("Error processing file", error);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    if (selectedImage?.previewUrl && selectedImage.file) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
  };

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s));
  };

  const handleSend = async () => {
    let imageToUse = selectedImage;
    if (!imageToUse && currentSession.lastImage) {
      imageToUse = currentSession.lastImage;
    }

    if (!inputText.trim() && !imageToUse) return;

    if (!imageToUse) {
        const tempId = Date.now().toString();
        const userMsg: Message = { id: tempId, role: 'user', text: inputText, timestamp: Date.now() };
        updateSession(currentSessionId, { messages: [...currentSession.messages, userMsg] });
        setInputText('');
        
        setTimeout(() => {
           const botMsg: Message = { 
               id: (Date.now() + 1).toString(), 
               role: 'model', 
               text: "I need an image to start working. Please upload one first.", 
               timestamp: Date.now() 
           };
           updateSession(currentSessionId, { messages: [...currentSession.messages, userMsg, botMsg] });
        }, 600);
        return;
    }

    const prompt = inputText;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: prompt,
      originalImageUrl: selectedImage ? selectedImage.previewUrl : undefined,
      timestamp: Date.now()
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    let newTitle = currentSession.title;
    if (currentSession.messages.length <= 1) {
        newTitle = prompt.slice(0, 25) || "Image Edit";
    }

    updateSession(currentSessionId, { messages: updatedMessages, title: newTitle });
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const { text, imageUrl } = await generateEditedImage(
        prompt || "Enhance this image",
        imageToUse.base64,
        imageToUse.mimeType
      );

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text || "Here is your result.",
        imageUrl: imageUrl || undefined,
        timestamp: Date.now()
      };

      let nextImageContext: ImageFile | undefined = currentSession.lastImage;
      if (imageUrl) {
          const rawBase64 = extractBase64FromDataUrl(imageUrl);
          nextImageContext = {
              base64: rawBase64,
              mimeType: 'image/png',
              previewUrl: imageUrl
          };
          setGallery(prev => [{
              id: Date.now().toString(),
              imageUrl: imageUrl!,
              prompt: prompt,
              timestamp: Date.now()
          }, ...prev]);
      } else if (selectedImage) {
          nextImageContext = selectedImage;
      }

      updateSession(currentSessionId, { 
          messages: [...updatedMessages, modelMsg], 
          lastImage: nextImageContext 
      });

    } catch (error) {
      console.error(error);
      updateSession(currentSessionId, { 
          messages: [...updatedMessages, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "Something went wrong. Please try again.",
            timestamp: Date.now()
          }] 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Render ---

  return (
    <div className="container-fluid h-100 p-0 overflow-hidden">
      <div className="row h-100 g-0">
        
        {/* Sidebar */}
        <div className={`col-lg-3 col-xl-2 border-end border-premium bg-black d-flex flex-column transition-all 
            ${sidebarVisible ? 'position-fixed h-100 w-75 z-3 shadow-lg' : 'd-none d-lg-flex'}`}
            style={{top: 0, left: 0}}
        >
            {/* Header */}
            <div className="p-4 border-bottom border-premium d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-brand-gradient rounded p-2 text-white shadow-sm">
                        <Shirt size={20} fill="currentColor" strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="fw-bold text-white lh-1 text-gradient-brand" style={{letterSpacing: '-0.5px', fontSize: '1.1rem'}}>ReChange</div>
                        <small className="text-secondary" style={{fontSize: '9px', letterSpacing: '1px'}}>BY BHAVYA TAMBOLI</small>
                    </div>
                </div>
                <button className="btn btn-link text-secondary p-0 d-lg-none" onClick={() => setSidebarVisible(false)}>
                    <X size={24} />
                </button>
            </div>

            <div className="p-3">
                <button onClick={createNewSession} className="btn btn-brand w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold rounded-3 shadow-sm">
                    <Plus size={18} /> New Project
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-grow-1 overflow-auto px-3 custom-scrollbar">
                <div className="text-uppercase text-secondary fw-bold mb-2 ps-2 mt-2" style={{fontSize: '10px', letterSpacing: '1px'}}>Recent Edits</div>
                <div className="d-flex flex-column gap-1">
                    {sessions.map(session => (
                        <div 
                            key={session.id}
                            onClick={() => switchSession(session.id)}
                            className={`sidebar-link cursor-pointer ${currentSessionId === session.id ? 'active' : ''}`}
                        >
                            <MessageSquare size={16} className={currentSessionId === session.id ? 'text-primary' : 'text-secondary'} />
                            <span className="text-truncate flex-grow-1 text-sm fw-medium">{session.title}</span>
                            {sessions.length > 1 && (
                                <Trash2 size={14} className="text-danger opacity-50 hover-opacity-100" onClick={(e) => deleteSession(e, session.id)} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Menu */}
            <div className="p-3 border-top border-premium bg-glass mt-auto">
                <button 
                    onClick={() => { setCurrentView('gallery'); setSidebarVisible(false); }}
                    className={`btn w-100 d-flex align-items-center gap-2 text-start ${currentView === 'gallery' ? 'btn-dark border-premium text-white' : 'btn-link text-secondary text-decoration-none'}`}
                >
                    <Grid size={18} /> Gallery
                </button>
                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-premium text-secondary" style={{fontSize: '10px'}}>
                    <span>v2.5 Nano Banana</span>
                    <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25">FREE</span>
                </div>
            </div>
        </div>
        
        {/* Main Content */}
        <div className="col-12 col-lg-9 col-xl-10 d-flex flex-column h-100 position-relative bg-body">
            
            {/* Overlay for mobile sidebar */}
            {sidebarVisible && <div className="position-fixed inset-0 bg-black opacity-75 z-2 d-lg-none" onClick={() => setSidebarVisible(false)}></div>}

            {/* Navbar */}
            <header className="d-flex align-items-center justify-content-between px-3 px-lg-4 py-3 border-bottom border-premium bg-glass sticky-top z-1 backdrop-blur">
                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-link text-secondary p-0 d-lg-none" onClick={() => setSidebarVisible(true)}>
                        <Menu size={24} />
                    </button>
                    <h5 className="m-0 text-white fs-6 fw-semibold">{currentView === 'gallery' ? 'Saved Gallery' : currentSession.title}</h5>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <div className="d-none d-sm-flex align-items-center gap-2 px-3 py-1 rounded-pill border border-secondary bg-dark shadow-sm">
                        <span className="position-relative d-flex h-2 w-2">
                          <span className="animate-ping position-absolute d-inline-flex h-100 w-100 rounded-circle bg-success opacity-75"></span>
                          <span className="position-relative d-inline-flex rounded-circle bg-success" style={{width: '8px', height: '8px'}}></span>
                        </span>
                        <span className="text-white fw-bold" style={{fontSize: '10px', letterSpacing: '0.5px'}}>ONLINE</span>
                    </div>
                </div>
            </header>

            {/* View: Gallery */}
            {currentView === 'gallery' && (
                <div className="flex-grow-1 overflow-auto p-4 custom-scrollbar">
                    <h2 className="text-white mb-4 d-flex align-items-center gap-2 fw-light">
                        <Grid size={24} className="text-primary" /> Your <span className="text-brand-gradient fw-bold">Creations</span>
                    </h2>
                    {gallery.length === 0 ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-50 border border-dashed border-secondary rounded-4 bg-dark bg-opacity-25 text-secondary">
                            <p className="mb-2">No masterpieces yet.</p>
                            <button onClick={() => setCurrentView('chat')} className="btn btn-link text-primary text-decoration-none fw-bold">Start Creating</button>
                        </div>
                    ) : (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                            {gallery.map(item => (
                                <div key={item.id} className="col">
                                    <div className="gallery-item h-100 shadow-lg">
                                        <img src={item.imageUrl} alt={item.prompt} className="w-100 h-100 object-fit-cover" />
                                        <div className="gallery-overlay">
                                            <p className="text-white small text-truncate mb-2">{item.prompt}</p>
                                            <a 
                                                href={item.imageUrl} 
                                                download={`rechange-gallery-${item.id}.png`}
                                                className="btn btn-brand btn-sm w-100 fw-bold"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* View: Chat */}
            {currentView === 'chat' && (
                <div className="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
                    {/* Chat Area */}
                    <div className="flex-grow-1 overflow-auto p-3 p-lg-5 custom-scrollbar">
                        <div className="container" style={{maxWidth: '800px'}}>
                            {messages.length === 0 && (
                                <div className="d-flex flex-column align-items-center justify-content-center text-secondary opacity-50 mt-5 pt-5">
                                    <div className="p-4 rounded-circle bg-dark border border-secondary mb-3 shadow-lg">
                                        <ImagePlus size={48} className="text-secondary" />
                                    </div>
                                    <p className="fw-medium text-uppercase tracking-wider fs-7">Upload. Prompt. <span className="text-brand-gradient fw-bold">ReChange.</span></p>
                                </div>
                            )}

                            {messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}

                            {isLoading && (
                                <div className="d-flex align-items-center gap-3 text-secondary mb-5 ps-2">
                                    <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                                    <small className="text-uppercase fw-bold text-brand-gradient" style={{fontSize: '10px', letterSpacing: '1px'}}>Transforming Pixels...</small>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 p-lg-4 bg-glass border-top border-premium">
                        <div className="container" style={{maxWidth: '800px'}}>
                            {/* Context Indicator */}
                            {!selectedImage && currentSession.lastImage && (
                                <div className="d-inline-flex align-items-center gap-2 px-3 py-1 mb-2 rounded-pill bg-primary bg-opacity-10 border border-primary border-opacity-25 text-info fw-bold shadow-sm" style={{fontSize: '10px'}}>
                                    <History size={12} /> EDITING PREVIOUS IMAGE
                                </div>
                            )}

                            {/* Image Preview */}
                            {selectedImage && (
                                <div className="mb-3 position-relative d-inline-block animate-fade-in-up">
                                    <div className="border border-secondary rounded-3 overflow-hidden shadow-lg" style={{width: '80px', height: '80px'}}>
                                        <img src={selectedImage.previewUrl} alt="Preview" className="w-100 h-100 object-fit-cover" />
                                    </div>
                                    <button 
                                        onClick={handleRemoveImage}
                                        className="btn btn-danger btn-sm rounded-circle position-absolute top-0 start-100 translate-middle p-1 shadow-sm border border-white"
                                        style={{width: '24px', height: '24px', lineHeight: 1}}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Main Input */}
                            <div className="chat-input-container d-flex align-items-end p-2 ps-3 gap-2">
                                <button 
                                    className={`btn btn-link p-0 text-decoration-none btn-upload mb-1 ${selectedImage ? 'text-brand-gradient' : 'text-secondary'}`} 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    title="Upload Image"
                                >
                                    <Plus size={26} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="d-none" 
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                
                                <textarea 
                                    ref={textAreaRef}
                                    className="form-control form-control-plaintext bg-transparent text-white py-3 fw-light" 
                                    placeholder={selectedImage ? "Describe your changes..." : (currentSession.lastImage ? "Refine the previous result..." : "Upload an image to start...")}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    style={{maxHeight: '120px'}}
                                    disabled={isLoading}
                                />

                                <button 
                                    className={`btn rounded-circle p-2 mb-1 d-flex align-items-center justify-content-center transition-all ${(!inputText.trim() && !selectedImage && !currentSession.lastImage) || isLoading ? 'btn-secondary disabled opacity-50' : 'btn-brand shadow-lg'}`}
                                    onClick={handleSend}
                                    disabled={isLoading}
                                    style={{width: '42px', height: '42px'}}
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} fill="currentColor" />}
                                </button>
                            </div>
                            <div className="text-center mt-2 opacity-50">
                                <small className="text-secondary fw-medium" style={{fontSize: '9px', letterSpacing: '0.5px'}}>ReChange By Bhavya Tamboli</small>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;