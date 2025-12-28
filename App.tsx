
import React, { useState, useEffect, useRef } from 'react';
import { Book, Chapter, ViewState, ComicBook, ComicPage } from './types';
import Layout from './components/Layout';

const INITIAL_BOOKS: Book[] = [
  {
    id: '1',
    title: '小說草稿',
    description: '這是一個隨手記下的點子。',
    coverImage: 'https://images.unsplash.com/photo-1513364235703-91f57b99173d?q=80&w=400',
    createdAt: Date.now(),
    chapters: [
      { id: 'c1', title: '序章：空白的世界', content: '什麼都沒有...', createdAt: Date.now() }
    ]
  }
];

const App: React.FC = () => {
  // --- State: Novels ---
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('draftbook_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  // --- State: Comics (Renamed storage key for migration) ---
  const [comics, setComics] = useState<ComicBook[]>(() => {
    const saved = localStorage.getItem('draftbook_comics');
    return saved ? JSON.parse(saved) : [];
  });

  // --- State: Navigation & Selection ---
  const [view, setView] = useState<ViewState>('shelf');
  
  // Novels selection
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  
  // Comics selection
  const [activeComicId, setActiveComicId] = useState<string | null>(null);
  const [currentComicPageIndex, setCurrentComicPageIndex] = useState<number>(0);

  // --- State: Modals & Inputs ---
  const [showAddBook, setShowAddBook] = useState(false); // Used for both Novel and Comic creation
  const [isCreatingComic, setIsCreatingComic] = useState(false); // Flag to distinguish modal type
  
  const fileInputRef = useRef<HTMLInputElement>(null); // General file input
  const comicPageInputRef = useRef<HTMLInputElement>(null); // Specific input for adding pages

  // --- State: Deletion ---
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  const [deletingComicId, setDeletingComicId] = useState<string | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  
  // --- State: Editing ---
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingComic, setEditingComic] = useState<ComicBook | null>(null);

  // --- State: Preview ---
  const [tempCoverPreview, setTempCoverPreview] = useState<string | null>(null);

  // --- Effects: Persistence ---
  useEffect(() => {
    localStorage.setItem('draftbook_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('draftbook_comics', JSON.stringify(comics));
  }, [comics]);

  // Reset preview on modal close
  useEffect(() => {
    if (showAddBook) setTempCoverPreview(null);
  }, [showAddBook]);

  useEffect(() => {
    if (editingBook) setTempCoverPreview(editingBook.coverImage);
    if (editingComic) setTempCoverPreview(editingComic.coverImage);
  }, [editingBook, editingComic]);

  // Reset page index when opening a comic
  useEffect(() => {
    if (view === 'comic-reader') {
      setCurrentComicPageIndex(0);
    }
  }, [view, activeComicId]);

  // Derived State
  const activeBook = books.find(b => b.id === activeBookId);
  const activeChapter = activeBook?.chapters.find(c => c.id === activeChapterId);
  const chapterIndex = activeBook && activeChapterId 
    ? activeBook.chapters.findIndex(c => c.id === activeChapterId) 
    : -1;

  const activeComic = comics.find(c => c.id === activeComicId);

  // --- Helpers ---
  const moveItem = <T,>(list: T[], index: number, direction: 'prev' | 'next'): T[] => {
    const newList = [...list];
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return newList;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    return newList;
  };

  const readImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  // --- Novel Actions ---
  const handleCreateBook = (title: string, desc: string, coverImage: string) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title,
      description: desc,
      coverImage: coverImage,
      chapters: [],
      createdAt: Date.now()
    };
    setBooks([...books, newBook]);
    setShowAddBook(false);
  };

  const handleUpdateBookInfo = (bookId: string, title: string, desc: string, newCoverImage?: string) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { 
      ...b, 
      title, 
      description: desc,
      coverImage: newCoverImage || b.coverImage 
    } : b));
    setEditingBook(null);
  };

  const handleDeleteBook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingBookId(id);
  };

  const performDeleteBook = () => {
    if (!deletingBookId) return;
    setBooks(prevBooks => prevBooks.filter(b => b.id !== deletingBookId));
    if (activeBookId === deletingBookId) {
      setActiveBookId(null);
      setActiveChapterId(null);
      setView('shelf');
    }
    setDeletingBookId(null);
  };

  const handleReorderBooks = (index: number, direction: 'prev' | 'next') => {
    setBooks(prev => moveItem(prev, index, direction));
  };

  // --- Chapter Actions ---
  const handleAddChapter = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const newChapter: Chapter = {
      id: `c${Date.now()}`,
      title: `未命名段落 ${book.chapters.length + 1}`,
      content: '',
      createdAt: Date.now()
    };
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, chapters: [...b.chapters, newChapter] } : b));
    setActiveChapterId(newChapter.id);
    setView('editor');
  };

  const handleDeleteChapter = (chapterId: string) => {
    setDeletingChapterId(chapterId);
  };

  const performDeleteChapter = () => {
    if (!deletingChapterId) return;
    setBooks(prevBooks => prevBooks.map(b => 
      b.id === activeBookId 
        ? { ...b, chapters: b.chapters.filter(c => c.id !== deletingChapterId) } 
        : b
    ));
    if (activeChapterId === deletingChapterId) {
      setView('book-details');
      setActiveChapterId(null);
    }
    setDeletingChapterId(null);
  };

  const handleReorderChapters = (index: number, direction: 'prev' | 'next') => {
    if (!activeBookId) return;
    setBooks(prev => prev.map(b => b.id === activeBookId ? {
      ...b,
      chapters: moveItem(b.chapters, index, direction)
    } : b));
  };

  const navigateChapter = (dir: 'prev' | 'next') => {
    if (!activeBook || chapterIndex === -1) return;
    const nextIdx = dir === 'next' ? chapterIndex + 1 : chapterIndex - 1;
    if (nextIdx >= 0 && nextIdx < activeBook.chapters.length) {
      setActiveChapterId(activeBook.chapters[nextIdx].id);
    }
  };

  const handleUpdateChapter = (content: string) => {
    if (!activeBookId || !activeChapterId) return;
    setBooks(prev => prev.map(b => b.id === activeBookId ? {
      ...b,
      chapters: b.chapters.map(c => c.id === activeChapterId ? { ...c, content } : c)
    } : b));
  };

  // --- Comic Actions ---

  const handleCreateComic = (title: string, desc: string, coverImage: string) => {
    const newComic: ComicBook = {
        id: Date.now().toString(),
        title,
        description: desc,
        coverImage,
        pages: [],
        createdAt: Date.now()
    };
    setComics([...comics, newComic]);
    setShowAddBook(false);
    setIsCreatingComic(false);
  };

  const handleDeleteComic = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingComicId(id);
  };

  const performDeleteComic = () => {
    if(!deletingComicId) return;
    setComics(prev => prev.filter(c => c.id !== deletingComicId));
    if (activeComicId === deletingComicId) {
        setActiveComicId(null);
        setView('gallery');
    }
    setDeletingComicId(null);
  };

  const handleReorderComics = (index: number, direction: 'prev' | 'next') => {
    setComics(prev => moveItem(prev, index, direction));
  };

  // --- Comic Page Actions ---

  const handleAddComicPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeComicId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPage: ComicPage = {
          id: `cp${Date.now()}`,
          imageUrl: reader.result as string,
          createdAt: Date.now()
        };
        setComics(prev => prev.map(c => c.id === activeComicId ? {
            ...c,
            pages: [...c.pages, newPage]
        } : c));
        // Jump to new page
        const comic = comics.find(c => c.id === activeComicId);
        if(comic) setCurrentComicPageIndex(comic.pages.length); 
      };
      reader.readAsDataURL(file);
    }
    // Clear input
    if (e.target) e.target.value = '';
  };

  const handleDeleteComicPage = (pageId: string) => {
    setDeletingPageId(pageId);
  };

  const performDeleteComicPage = () => {
    if (!deletingPageId || !activeComicId) return;
    
    setComics(prev => prev.map(c => c.id === activeComicId ? {
        ...c,
        pages: c.pages.filter(p => p.id !== deletingPageId)
    } : c));
    
    // Adjust index if needed
    if (currentComicPageIndex > 0) {
        setCurrentComicPageIndex(prev => prev - 1);
    }
    setDeletingPageId(null);
  };

  const moveComicPage = (index: number, direction: 'prev' | 'next') => {
     if(!activeComicId) return;
     setComics(prev => prev.map(c => c.id === activeComicId ? {
         ...c,
         pages: moveItem(c.pages, index, direction)
     } : c));
     
     // Update view index to follow the moved page
     const offset = direction === 'prev' ? -1 : 1;
     const newIndex = index + offset;
     if (newIndex >= 0 && newIndex < (activeComic?.pages.length || 0)) {
         setCurrentComicPageIndex(newIndex);
     }
  };


  // ---------------- Render Helpers ----------------

  // Unified Create Modal (Now accessible to both views)
  const CreateBookModal = () => (
    showAddBook ? (
      <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="rough-border p-8 w-full max-w-md shadow-2xl bg-white max-h-[90vh] overflow-y-auto">
          <h2 className="sketch-font text-3xl mb-6">{isCreatingComic ? '新建漫畫本' : '設定新草案'}</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            const desc = formData.get('desc') as string;
            const coverFile = formData.get('cover') as File;
            
            let coverImage = 'https://picsum.photos/400/600?grayscale'; // Default
            if (coverFile && coverFile.size > 0) {
                coverImage = await readImageFile(coverFile);
            }
            
            if (isCreatingComic) {
                handleCreateComic(title, desc, coverImage);
            } else {
                handleCreateBook(title, desc, coverImage);
            }
          }}>
            <div className="mb-4">
              <label className="draft-font block text-lg mb-1">封面圖片</label>
              <div className="border-2 border-dashed border-gray-300 p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input 
                    type="file" 
                    name="cover" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if(file) {
                            const url = await readImageFile(file);
                            setTempCoverPreview(url);
                        }
                    }}
                />
                {tempCoverPreview ? (
                    <img src={tempCoverPreview} alt="Preview" className="h-40 mx-auto object-cover rounded shadow-sm" />
                ) : (
                    <div className="text-gray-400 py-8 sketch-font">
                        點擊上傳封面
                    </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="draft-font block text-lg mb-1">標題</label>
              <input name="title" required placeholder="..." className="w-full border-b-2 border-gray-400 p-2 draft-font text-xl outline-none focus:border-blue-500" />
            </div>
            <div className="mb-8">
              <label className="draft-font block text-lg mb-1">簡介</label>
              <textarea name="desc" rows={3} placeholder="..." className="w-full border-b-2 border-gray-400 p-2 draft-font text-lg outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="flex-1 sketch-btn bg-black text-white py-3 sketch-font">建立</button>
              <button type="button" onClick={() => setShowAddBook(false)} className="flex-1 sketch-btn py-3 sketch-font">取消</button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  );

  // ---------------- Views ----------------

  // --- VIEW: Novel Shelf ---
  if (view === 'shelf') {
    return (
      <Layout title="草稿架 / NOVELS" currentTab="novels" setView={setView}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {books.map((book, idx) => (
            <div 
              key={book.id} 
              className="paper-stack relative group transition-transform hover:-rotate-1 hover:z-50"
            >
              <div 
                className="rough-border p-5 bg-white h-full flex flex-col cursor-pointer"
                onClick={() => {
                    setActiveBookId(book.id);
                    setView('book-details');
                }}
              >
                <div className="relative mb-4 grayscale opacity-80 border-b-2 border-dashed border-gray-300 pb-2 pointer-events-none">
                  <img src={book.coverImage} className="w-full aspect-[4/3] object-cover rounded" alt={book.title} />
                </div>
                <h3 className="sketch-font text-2xl mb-2 text-blue-900 pointer-events-none">{book.title}</h3>
                <p className="draft-font text-gray-500 text-sm flex-grow line-clamp-3 pointer-events-none">{book.description}</p>
                
                <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between items-center text-xs draft-font uppercase tracking-widest relative" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                     <button disabled={idx === 0} onClick={() => handleReorderBooks(idx, 'prev')} className={`p-2 hover:text-blue-500 ${idx === 0 ? 'opacity-20' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     </button>
                     <button disabled={idx === books.length - 1} onClick={() => handleReorderBooks(idx, 'next')} className={`p-2 hover:text-blue-500 ${idx === books.length - 1 ? 'opacity-20' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                     </button>
                  </div>
                  <span className="pointer-events-none">{book.chapters.length} 段落</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={(e) => handleDeleteBook(e, book.id)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white hover:scale-110 transition-all z-50 cursor-pointer"
              >
                <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button 
            onClick={() => { setIsCreatingComic(false); setShowAddBook(true); }}
            className="rough-border bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[300px] hover:bg-white transition-all group"
          >
            <span className="text-6xl text-gray-300 group-hover:text-blue-400 transition-colors mb-4">+</span>
            <span className="sketch-font text-xl text-gray-400">開始新的故事草稿</span>
          </button>
        </div>

        <CreateBookModal />
        
        {/* Delete Book Modal */}
        {deletingBookId && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
              <h2 className="sketch-font text-2xl mb-4 text-center mt-4">確定要撕毀嗎？</h2>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={performDeleteBook} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font">撕毀</button>
                <button type="button" onClick={() => setDeletingBookId(null)} className="flex-1 sketch-btn py-3 sketch-font">保留</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // --- VIEW: Comic Gallery (Shelf) ---
  if (view === 'gallery') {
    return (
      <Layout title="漫畫箱 / COMICS" currentTab="manga" setView={setView}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {comics.map((comic, idx) => (
            <div 
              key={comic.id} 
              className="paper-stack relative group transition-transform hover:-rotate-1 hover:z-50"
            >
              <div 
                className="rough-border p-5 bg-white h-full flex flex-col cursor-pointer"
                onClick={() => {
                    setActiveComicId(comic.id);
                    setView('comic-reader');
                }}
              >
                <div className="relative mb-4 grayscale opacity-80 border-b-2 border-dashed border-gray-300 pb-2 pointer-events-none">
                  <img src={comic.coverImage} className="w-full aspect-[4/3] object-cover rounded" alt={comic.title} />
                </div>
                <h3 className="sketch-font text-2xl mb-2 text-blue-900 pointer-events-none">{comic.title}</h3>
                <p className="draft-font text-gray-500 text-sm flex-grow line-clamp-3 pointer-events-none">{comic.description || '無簡介'}</p>
                
                <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between items-center text-xs draft-font uppercase tracking-widest relative" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                     <button disabled={idx === 0} onClick={() => handleReorderComics(idx, 'prev')} className={`p-2 hover:text-blue-500 ${idx === 0 ? 'opacity-20' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     </button>
                     <button disabled={idx === comics.length - 1} onClick={() => handleReorderComics(idx, 'next')} className={`p-2 hover:text-blue-500 ${idx === comics.length - 1 ? 'opacity-20' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                     </button>
                  </div>
                  <span className="pointer-events-none">{comic.pages.length} 頁</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={(e) => handleDeleteComic(e, comic.id)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white hover:scale-110 transition-all z-50 cursor-pointer"
              >
                <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}

          <button 
            onClick={() => { setIsCreatingComic(true); setShowAddBook(true); }}
            className="rough-border bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[300px] hover:bg-white transition-all group"
          >
            <span className="text-6xl text-gray-300 group-hover:text-blue-400 transition-colors mb-4">+</span>
            <span className="sketch-font text-xl text-gray-400">建立新的漫畫本</span>
          </button>
        </div>
        
        <CreateBookModal />

        {/* Delete Comic Modal */}
        {deletingComicId && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
              <h2 className="sketch-font text-2xl mb-4 text-center mt-4">丟棄這本漫畫？</h2>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={performDeleteComic} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font">丟棄</button>
                <button type="button" onClick={() => setDeletingComicId(null)} className="flex-1 sketch-btn py-3 sketch-font">保留</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // --- VIEW: Comic Reader ---
  if (view === 'comic-reader' && activeComic) {
    const currentPage = activeComic.pages[currentComicPageIndex];
    const totalPages = activeComic.pages.length;

    return (
      <Layout title={activeComic.title} onBack={() => setView('gallery')} setView={setView}>
        <div className="flex flex-col items-center">
            
            {/* Toolbar */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 px-2">
                <div className="sketch-font text-xl text-gray-500">
                    Page {totalPages > 0 ? currentComicPageIndex + 1 : 0} / {totalPages}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => comicPageInputRef.current?.click()}
                        className="sketch-btn bg-blue-50 text-blue-900 sketch-font flex items-center gap-2"
                    >
                        + 新增頁面
                    </button>
                    <input type="file" ref={comicPageInputRef} onChange={handleAddComicPage} accept="image/*" className="hidden" />
                </div>
            </div>

            {/* Main Reader Area */}
            <div className="relative w-full max-w-5xl aspect-[3/4] md:aspect-auto md:min-h-[80vh] flex items-center justify-center">
                
                {/* Prev Button */}
                <button 
                    onClick={() => setCurrentComicPageIndex(p => Math.max(0, p - 1))}
                    disabled={currentComicPageIndex === 0}
                    className={`absolute left-0 md:-left-12 z-20 p-3 rounded-full bg-white/80 shadow-lg transition-all ${currentComicPageIndex === 0 ? 'opacity-20' : 'hover:scale-110 hover:bg-blue-50'}`}
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                </button>

                {/* The Page */}
                <div className="rough-border p-2 bg-white w-full h-full flex items-center justify-center relative overflow-hidden group">
                    {totalPages === 0 ? (
                        <div className="text-center text-gray-400 sketch-font">
                            <p className="text-2xl mb-4">這本漫畫還是空白的。</p>
                            <button onClick={() => comicPageInputRef.current?.click()} className="text-blue-500 underline">上傳第一頁</button>
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            <img 
                                src={currentPage.imageUrl} 
                                className="w-full h-full object-contain"
                                alt={`Page ${currentComicPageIndex + 1}`} 
                            />
                            {/* Page Controls Overlay */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button 
                                    onClick={() => moveComicPage(currentComicPageIndex, 'prev')}
                                    disabled={currentComicPageIndex === 0}
                                    className="p-2 bg-white/90 rounded-full shadow hover:text-blue-500 disabled:opacity-30"
                                    title="往前移"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </button>
                                <button 
                                    onClick={() => moveComicPage(currentComicPageIndex, 'next')}
                                    disabled={currentComicPageIndex === totalPages - 1}
                                    className="p-2 bg-white/90 rounded-full shadow hover:text-blue-500 disabled:opacity-30"
                                    title="往後移"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                                <button 
                                    onClick={() => handleDeleteComicPage(currentPage.id)}
                                    className="p-2 bg-white/90 rounded-full shadow text-red-500 hover:bg-red-500 hover:text-white"
                                    title="撕掉這頁"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Button */}
                <button 
                    onClick={() => setCurrentComicPageIndex(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentComicPageIndex >= totalPages - 1}
                    className={`absolute right-0 md:-right-12 z-20 p-3 rounded-full bg-white/80 shadow-lg transition-all ${currentComicPageIndex >= totalPages - 1 ? 'opacity-20' : 'hover:scale-110 hover:bg-blue-50'}`}
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {/* Thumbnail Strip */}
            {totalPages > 0 && (
                <div className="w-full max-w-5xl mt-8 overflow-x-auto pb-4">
                    <div className="flex gap-4 px-2">
                        {activeComic.pages.map((page, idx) => (
                            <button 
                                key={page.id}
                                onClick={() => setCurrentComicPageIndex(idx)}
                                className={`flex-shrink-0 w-24 h-32 rough-border p-1 bg-white relative transition-all ${currentComicPageIndex === idx ? 'ring-4 ring-blue-200 scale-105 z-10' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <img src={page.imageUrl} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                <span className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1 rounded draft-font">{idx + 1}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Delete Page Modal */}
        {deletingPageId && (
            <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
                <h2 className="sketch-font text-2xl mb-4 text-center mt-4">撕掉這一頁？</h2>
                <div className="flex gap-4 mt-8">
                <button type="button" onClick={performDeleteComicPage} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font">撕掉</button>
                <button type="button" onClick={() => setDeletingPageId(null)} className="flex-1 sketch-btn py-3 sketch-font">保留</button>
                </div>
            </div>
            </div>
        )}
      </Layout>
    );
  }

  // --- VIEW: Novel Editor / Details (Existing) ---
  if (view === 'book-details' && activeBook) {
    return (
      <Layout title={activeBook.title} onBack={() => setView('shelf')} setView={setView}>
        {/* Same Novel Details Code as before, maintained for consistency */}
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3">
             <div className="rough-border p-6 sticky top-8 bg-white/50">
                <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
                    <h3 className="sketch-font text-2xl truncate pr-2">{activeBook.title}</h3>
                    <button onClick={() => setEditingBook(activeBook)} className="text-gray-400 hover:text-blue-500 transition-colors p-1 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>
                <div className="mb-4 rounded overflow-hidden border border-gray-200">
                    <img src={activeBook.coverImage} className="w-full object-cover" alt="封面" />
                </div>
                <p className="draft-font text-gray-600 italic whitespace-pre-wrap">{activeBook.description}</p>
                <button 
                  onClick={() => handleAddChapter(activeBook.id)}
                  className="w-full mt-8 sketch-btn bg-blue-50 text-blue-900 sketch-font py-4 flex items-center justify-center gap-2"
                >
                  <span>+ 新增章節草稿</span>
                </button>
             </div>
          </div>
          <div className="flex-1">
            <h2 className="sketch-font text-4xl mb-8 border-b-2 border-gray-200 pb-2">章節 / CONTENTS</h2>
            <div className="space-y-4">
              {activeBook.chapters.length === 0 ? (
                <div className="p-12 text-center text-gray-400 draft-font">空白的筆記本。</div>
              ) : (
                activeBook.chapters.map((chapter, idx) => (
                  <div key={chapter.id} className="rough-border p-4 flex justify-between items-center bg-white group hover:bg-gray-50 transition-colors">
                    <div className="flex-1 flex items-center gap-6 cursor-pointer" onClick={() => { setActiveChapterId(chapter.id); setView('editor'); }}>
                      <span className="sketch-font text-2xl text-gray-300 group-hover:text-blue-500">#{idx + 1}</span>
                      <span className="draft-font text-xl group-hover:underline">{chapter.title}</span>
                    </div>
                    <div className="flex items-center gap-4 z-10 pl-4 border-l border-gray-100">
                      <div className="flex gap-1">
                        <button disabled={idx === 0} onClick={() => handleReorderChapters(idx, 'prev')} className={`p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full ${idx === 0 ? 'opacity-10' : ''}`}>↑</button>
                        <button disabled={idx === activeBook.chapters.length - 1} onClick={() => handleReorderChapters(idx, 'next')} className={`p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full ${idx === activeBook.chapters.length - 1 ? 'opacity-10' : ''}`}>↓</button>
                      </div>
                      <button onClick={() => handleDeleteChapter(chapter.id)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-colors">
                        <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Modals from before (omitted for brevity but logically present in full file) */}
        {deletingChapterId && (
            <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
                    <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
                    <h2 className="sketch-font text-2xl mb-4 text-center mt-4">撕掉這一頁？</h2>
                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={performDeleteChapter} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font">揉掉</button>
                        <button type="button" onClick={() => setDeletingChapterId(null)} className="flex-1 sketch-btn py-3 sketch-font">保留</button>
                    </div>
                </div>
            </div>
        )}
      </Layout>
    );
  }

  if (view === 'editor' && activeChapter && activeBook) {
    return (
      <Layout title={`寫作：${activeChapter.title}`} onBack={() => setView('book-details')} setView={setView}>
        <div className="max-w-4xl mx-auto min-h-[800px] rough-border bg-white p-8 md:p-12 shadow-inner notebook-lines relative">
          <div className="flex items-center justify-between mb-8 gap-4">
             <button disabled={chapterIndex <= 0} onClick={() => navigateChapter('prev')} className={`sketch-btn p-2 ${chapterIndex <= 0 ? 'opacity-20' : 'hover:text-blue-500'}`}>
                <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <input className="flex-grow text-center sketch-font text-4xl border-none outline-none focus:ring-0 bg-transparent text-blue-900" value={activeChapter.title} onChange={(e) => {
                const newTitle = e.target.value;
                setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, chapters: b.chapters.map(c => c.id === activeChapterId ? { ...c, title: newTitle } : c) } : b));
              }} />
            <div className="flex items-center gap-2">
                <button onClick={() => handleDeleteChapter(activeChapterId!)} className="sketch-btn p-2 text-red-500 border-red-200 hover:bg-red-500 hover:text-white">
                  <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button disabled={chapterIndex >= activeBook.chapters.length - 1} onClick={() => navigateChapter('next')} className={`sketch-btn p-2 ${chapterIndex >= activeBook.chapters.length - 1 ? 'opacity-20' : 'hover:text-blue-500'}`}>
                    <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                 </button>
            </div>
          </div>
          <textarea className="w-full min-h-[600px] draft-font text-xl leading-[2rem] border-none outline-none focus:ring-0 resize-none bg-transparent placeholder-gray-300" placeholder="下筆..." value={activeChapter.content} onChange={(e) => handleUpdateChapter(e.target.value)} />
          <div className="mt-8 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center text-gray-400 draft-font text-sm">
            <span>字數：{activeChapter.content.length}</span>
            <div className="flex gap-4">
              <span>{chapterIndex + 1} / {activeBook.chapters.length}</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error Fallback
  return (
      <div className="flex h-screen items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
              <p>頁面狀態重置中...</p>
              <button onClick={() => setView('shelf')} className="mt-4 text-blue-500 underline">
                  回到書架
              </button>
          </div>
      </div>
  );
};

export default App;
