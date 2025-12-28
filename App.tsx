import React, { useState, useEffect, useRef } from 'react';
import { Book, Chapter, ViewState, MangaItem } from './types';
import Layout from './components/Layout';

const INITIAL_BOOKS: Book[] = [
  {
    id: '1',
    title: '草稿',
    description: '這是一個隨手記下的點子。',
    coverImage: 'https://images.unsplash.com/photo-1513364235703-91f57b99173d?q=80&w=400',
    createdAt: Date.now(),
    chapters: [
      { id: 'c1', title: '序章：空白的世界', content: '什麼都沒有...', createdAt: Date.now() }
    ]
  }
];

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('draftbook_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });
  
  const [mangaItems, setMangaItems] = useState<MangaItem[]>(() => {
    const saved = localStorage.getItem('draftbook_manga');
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<ViewState>('shelf');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⭐ 新增：刪除狀態管理
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  const [deletingMangaId, setDeletingMangaId] = useState<string | null>(null);
  
  // ⭐ 新增：編輯書籍狀態
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // ⭐ 新增：暫存封面預覽 (用於新增/編輯 Modal)
  const [tempCoverPreview, setTempCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('draftbook_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('draftbook_manga', JSON.stringify(mangaItems));
  }, [mangaItems]);

  // 重置預覽狀態當 Modal 關閉/開啟時
  useEffect(() => {
    if (showAddBook) setTempCoverPreview(null);
  }, [showAddBook]);

  useEffect(() => {
    if (editingBook) setTempCoverPreview(editingBook.coverImage);
  }, [editingBook]);

  const activeBook = books.find(b => b.id === activeBookId);
  const activeChapter = activeBook?.chapters.find(c => c.id === activeChapterId);
  const chapterIndex = activeBook && activeChapterId 
    ? activeBook.chapters.findIndex(c => c.id === activeChapterId) 
    : -1;

  useEffect(() => {
    if ((view === 'book-details' || view === 'editor') && !activeBook) {
      setActiveBookId(null);
      setActiveChapterId(null);
      setView('shelf');
    }
  }, [view, activeBook]);


  const moveItem = <T,>(list: T[], index: number, direction: 'prev' | 'next'): T[] => {
    const newList = [...list];
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return newList;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    return newList;
  };

  // 輔助函式：讀取圖片
  const readImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

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

  // --- 書本編輯邏輯 ---
  const handleUpdateBookInfo = (bookId: string, title: string, desc: string, newCoverImage?: string) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { 
      ...b, 
      title, 
      description: desc,
      coverImage: newCoverImage || b.coverImage 
    } : b));
    setEditingBook(null);
  };

  // --- 書本刪除邏輯 ---
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

  // --- 章節刪除邏輯 ---
  const handleDeleteChapter = (chapterId: string) => {
    // 這裡只設定狀態，不刪除
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItem: MangaItem = {
          id: Date.now().toString(),
          title: file.name.split('.')[0] || '未命名草稿',
          imageUrl: reader.result as string,
          createdAt: Date.now()
        };
        setMangaItems(prev => [newItem, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- 漫畫刪除邏輯 ---
  const handleDeleteManga = (id: string) => {
    setDeletingMangaId(id);
  };

  const performDeleteManga = () => {
    if (!deletingMangaId) return;
    setMangaItems(prevItems => prevItems.filter(item => item.id !== deletingMangaId));
    setDeletingMangaId(null);
  };

  const handleReorderManga = (index: number, direction: 'prev' | 'next') => {
    setMangaItems(prev => moveItem(prev, index, direction));
  };

  // ---------------- Views ----------------

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
                     <button 
                       type="button"
                       disabled={idx === 0}
                       onClick={() => handleReorderBooks(idx, 'prev')}
                       className={`p-2 hover:text-blue-500 hover:scale-110 transition-transform ${idx === 0 ? 'opacity-20' : ''}`}
                     >
                        <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     </button>
                     <button 
                       type="button"
                       disabled={idx === books.length - 1}
                       onClick={() => handleReorderBooks(idx, 'next')}
                       className={`p-2 hover:text-blue-500 hover:scale-110 transition-transform ${idx === books.length - 1 ? 'opacity-20' : ''}`}
                     >
                        <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                     </button>
                  </div>
                  <span className="pointer-events-none">{book.chapters.length} 段落</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={(e) => handleDeleteBook(e, book.id)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white hover:scale-110 transition-all z-50 cursor-pointer"
                title="刪除這本小說"
              >
                <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button 
            onClick={() => setShowAddBook(true)}
            className="rough-border bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[300px] hover:bg-white transition-all group"
          >
            <span className="text-6xl text-gray-300 group-hover:text-blue-400 transition-colors mb-4">+</span>
            <span className="sketch-font text-xl text-gray-400">開始新的故事草稿</span>
          </button>
        </div>

        {showAddBook && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="rough-border p-8 w-full max-w-md shadow-2xl bg-white max-h-[90vh] overflow-y-auto">
              <h2 className="sketch-font text-3xl mb-6">設定新草案</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const desc = formData.get('desc') as string;
                const coverFile = formData.get('cover') as File;
                
                let coverImage = 'https://picsum.photos/400/600?grayscale'; // 預設圖
                if (coverFile && coverFile.size > 0) {
                    coverImage = await readImageFile(coverFile);
                }
                
                handleCreateBook(title, desc, coverImage);
              }}>
                <div className="mb-4">
                  <label className="draft-font block text-lg mb-1">封面圖片 (上傳)</label>
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
                            點擊上傳封面<br/>
                            <span className="text-sm">(或使用預設)</span>
                        </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="draft-font block text-lg mb-1">作品名稱</label>
                  <input name="title" required placeholder="..." className="w-full border-b-2 border-gray-400 p-2 draft-font text-xl outline-none focus:border-blue-500" />
                </div>
                <div className="mb-8">
                  <label className="draft-font block text-lg mb-1">簡介</label>
                  <textarea name="desc" required rows={3} placeholder="..." className="w-full border-b-2 border-gray-400 p-2 draft-font text-lg outline-none focus:border-blue-500 resize-none" />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 sketch-btn bg-black text-white py-3 sketch-font">確定</button>
                  <button type="button" onClick={() => setShowAddBook(false)} className="flex-1 sketch-btn py-3 sketch-font">取消</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 書本刪除 Modal */}
        {deletingBookId && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
              <h2 className="sketch-font text-2xl mb-4 text-center mt-4">確定要撕毀嗎？</h2>
              <p className="draft-font text-lg text-gray-600 mb-8 text-center">這本故事將會永遠消失，<br/>就像被橡皮擦擦掉一樣。</p>
              <div className="flex gap-4">
                <button type="button" onClick={performDeleteBook} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font hover:bg-red-600 hover:border-red-800">撕毀</button>
                <button type="button" onClick={() => setDeletingBookId(null)} className="flex-1 sketch-btn py-3 sketch-font hover:bg-gray-100">保留</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  if (view === 'gallery') {
    return (
      <Layout title="漫畫箱 / SKETCHES" currentTab="manga" setView={setView}>
        <div className="mb-8 flex justify-end">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="sketch-btn bg-blue-50 text-blue-900 sketch-font flex items-center gap-2"
          >
            <span>上傳新草圖</span>
            <span className="text-xl">+</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mangaItems.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-300 sketch-font text-2xl">
              還沒有任何上傳的草圖...
            </div>
          ) : (
            mangaItems.map((item, idx) => (
              <div key={item.id} className="rough-border p-2 bg-white relative group">
                <div className="absolute top-2 left-2 right-2 flex justify-between z-20 pointer-events-none">
                   <div className="flex gap-1 pointer-events-auto">
                      <button 
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorderManga(idx, 'prev')}
                        className={`bg-white/90 border border-gray-200 p-1 rounded hover:text-blue-500 ${idx === 0 ? 'opacity-20' : ''}`}
                      >←</button>
                      <button 
                        type="button"
                        disabled={idx === mangaItems.length - 1}
                        onClick={() => handleReorderManga(idx, 'next')}
                        className={`bg-white/90 border border-gray-200 p-1 rounded hover:text-blue-500 ${idx === mangaItems.length - 1 ? 'opacity-20' : ''}`}
                      >→</button>
                   </div>
                   <button 
                    type="button"
                    onClick={() => handleDeleteManga(item.id)}
                    className="bg-white border-2 border-red-500 text-red-500 p-1.5 rounded-full hover:bg-red-500 hover:text-white shadow-sm pointer-events-auto transition-colors"
                    title="刪除草圖"
                  >
                    <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="overflow-hidden mb-2">
                  <img src={item.imageUrl} className="w-full aspect-square object-contain" alt={item.title} />
                </div>
                <p className="draft-font text-xs text-center text-gray-400 truncate px-2">{item.title}</p>
              </div>
            ))
          )}
        </div>

        {/* 漫畫刪除 Modal */}
        {deletingMangaId && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
              <h2 className="sketch-font text-2xl mb-4 text-center mt-4">丟棄這張草圖？</h2>
              <p className="draft-font text-lg text-gray-600 mb-8 text-center">丟進垃圾桶的紙團，<br/>可能找不回來了喔？</p>
              <div className="flex gap-4">
                <button type="button" onClick={performDeleteManga} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font hover:bg-red-600 hover:border-red-800">丟棄</button>
                <button type="button" onClick={() => setDeletingMangaId(null)} className="flex-1 sketch-btn py-3 sketch-font hover:bg-gray-100">保留</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  if (view === 'book-details' && activeBook) {
    return (
      <Layout title={activeBook.title} onBack={() => setView('shelf')} setView={setView}>
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3">
             <div className="rough-border p-6 sticky top-8 bg-white/50">
                <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
                    <h3 className="sketch-font text-2xl truncate pr-2">{activeBook.title}</h3>
                    <button 
                        onClick={() => setEditingBook(activeBook)}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 flex-shrink-0"
                        title="編輯標題與簡介"
                    >
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
                  <div 
                    key={chapter.id}
                    className="rough-border p-4 flex justify-between items-center bg-white group hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="flex-1 flex items-center gap-6 cursor-pointer"
                      onClick={() => {
                        setActiveChapterId(chapter.id);
                        setView('editor');
                      }}
                    >
                      <span className="sketch-font text-2xl text-gray-300 group-hover:text-blue-500">#{idx + 1}</span>
                      <span className="draft-font text-xl group-hover:underline">{chapter.title}</span>
                    </div>

                    <div className="flex items-center gap-4 z-10 pl-4 border-l border-gray-100">
                      <div className="flex gap-1">
                        <button 
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorderChapters(idx, 'prev')}
                          className={`p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors ${idx === 0 ? 'opacity-10' : ''}`}
                          title="向上移動"
                        >
                           <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button 
                          type="button"
                          disabled={idx === activeBook.chapters.length - 1}
                          onClick={() => handleReorderChapters(idx, 'next')}
                          className={`p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors ${idx === activeBook.chapters.length - 1 ? 'opacity-10' : ''}`}
                           title="向下移動"
                        >
                           <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                        title="刪除此章節"
                      >
                        <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 章節刪除 Modal (列表頁用) */}
        {deletingChapterId && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
              <h2 className="sketch-font text-2xl mb-4 text-center mt-4">撕掉這一頁？</h2>
              <p className="draft-font text-lg text-gray-600 mb-8 text-center">寫好的內容將無法復原，<br/>確定要揉掉嗎？</p>
              <div className="flex gap-4">
                <button type="button" onClick={performDeleteChapter} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font hover:bg-red-600 hover:border-red-800">揉掉</button>
                <button type="button" onClick={() => setDeletingChapterId(null)} className="flex-1 sketch-btn py-3 sketch-font hover:bg-gray-100">保留</button>
              </div>
            </div>
          </div>
        )}

        {/* 編輯書籍 Modal */}
        {editingBook && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-md shadow-2xl bg-white max-h-[90vh] overflow-y-auto">
              <h2 className="sketch-font text-3xl mb-6">修改草案設定</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const desc = formData.get('desc') as string;
                const coverFile = formData.get('cover') as File;

                let newCoverImage = undefined;
                if (coverFile && coverFile.size > 0) {
                    newCoverImage = await readImageFile(coverFile);
                }

                handleUpdateBookInfo(editingBook.id, title, desc, newCoverImage);
              }}>
                <div className="mb-4">
                  <label className="draft-font block text-lg mb-1">封面圖片 (點擊更換)</label>
                  <div className="border-2 border-dashed border-gray-300 p-2 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                    <input 
                        type="file" 
                        name="cover" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if(file) {
                                const url = await readImageFile(file);
                                setTempCoverPreview(url);
                            }
                        }}
                    />
                    {tempCoverPreview ? (
                        <div className="relative">
                            <img src={tempCoverPreview} alt="Preview" className="h-40 mx-auto object-cover rounded shadow-sm opacity-100 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/50 text-white px-2 py-1 rounded draft-font">更換</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 py-8 sketch-font">
                            上傳新封面
                        </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="draft-font block text-lg mb-1">作品名稱</label>
                  <input 
                    name="title" 
                    defaultValue={editingBook.title} 
                    required 
                    className="w-full border-b-2 border-gray-400 p-2 draft-font text-xl outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="mb-8">
                  <label className="draft-font block text-lg mb-1">簡介</label>
                  <textarea 
                    name="desc" 
                    defaultValue={editingBook.description} 
                    required 
                    rows={3} 
                    className="w-full border-b-2 border-gray-400 p-2 draft-font text-lg outline-none focus:border-blue-500 resize-none" 
                  />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 sketch-btn bg-black text-white py-3 sketch-font">儲存修改</button>
                  <button type="button" onClick={() => setEditingBook(null)} className="flex-1 sketch-btn py-3 sketch-font">取消</button>
                </div>
              </form>
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
             <button 
                type="button"
                disabled={chapterIndex <= 0}
                onClick={() => navigateChapter('prev')}
                className={`sketch-btn p-2 ${chapterIndex <= 0 ? 'opacity-20' : 'hover:text-blue-500'}`}
                title="上一章"
             >
                <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
             </button>

             <input 
              className="flex-grow text-center sketch-font text-4xl border-none outline-none focus:ring-0 bg-transparent text-blue-900"
              value={activeChapter.title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setBooks(prev => prev.map(b => b.id === activeBookId ? {
                  ...b,
                  chapters: b.chapters.map(c => c.id === activeChapterId ? { ...c, title: newTitle } : c)
                } : b));
              }}
            />

            <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => handleDeleteChapter(activeChapterId!)}
                  className="sketch-btn p-2 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                  title="刪除此章節"
                >
                  <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <button 
                    type="button"
                    disabled={chapterIndex >= activeBook.chapters.length - 1}
                    onClick={() => navigateChapter('next')}
                    className={`sketch-btn p-2 ${chapterIndex >= activeBook.chapters.length - 1 ? 'opacity-20' : 'hover:text-blue-500'}`}
                    title="下一章"
                 >
                    <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                 </button>
            </div>
          </div>

          <textarea 
            className="w-full min-h-[600px] draft-font text-xl leading-[2rem] border-none outline-none focus:ring-0 resize-none bg-transparent placeholder-gray-300"
            placeholder="下筆..."
            value={activeChapter.content}
            onChange={(e) => handleUpdateChapter(e.target.value)}
          />

          <div className="mt-8 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center text-gray-400 draft-font text-sm">
            <span>字數：{activeChapter.content.length}</span>
            <div className="flex gap-4">
              <span>{chapterIndex + 1} / {activeBook.chapters.length}</span>
            </div>
          </div>
        </div>

        {/* 章節刪除 Modal (編輯頁用) */}
        {deletingChapterId && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="rough-border p-8 w-full max-w-sm shadow-2xl bg-white relative">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center sketch-font text-4xl shadow-lg -rotate-12 border-2 border-black">!</div>
              <h2 className="sketch-font text-2xl mb-4 text-center mt-4">撕掉這一頁？</h2>
              <p className="draft-font text-lg text-gray-600 mb-8 text-center">寫好的內容將無法復原，<br/>確定要揉掉嗎？</p>
              <div className="flex gap-4">
                <button type="button" onClick={performDeleteChapter} className="flex-1 sketch-btn bg-red-500 text-white py-3 sketch-font hover:bg-red-600 hover:border-red-800">揉掉</button>
                <button type="button" onClick={() => setDeletingChapterId(null)} className="flex-1 sketch-btn py-3 sketch-font hover:bg-gray-100">保留</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // Fallback
  if (view === 'book-details' && !activeBook) {
     return null; 
  }

  return (
      <div className="flex h-screen items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
              <p>頁面載入錯誤或找不到內容。</p>
              <button onClick={() => setView('shelf')} className="mt-4 text-blue-500 underline">
                  回到書架
              </button>
          </div>
      </div>
  );
};

export default App;