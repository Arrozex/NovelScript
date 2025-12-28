
export interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  chapters: Chapter[];
  createdAt: number;
}

export interface ComicPage {
  id: string;
  imageUrl: string;
  createdAt: number;
}

export interface ComicBook {
  id: string;
  title: string;
  description: string; // 漫畫也加個簡介
  coverImage: string;
  pages: ComicPage[];
  createdAt: number;
}

// 已廢棄舊的 MangaItem，改用 ComicBook

export type ViewState = 'shelf' | 'book-details' | 'editor' | 'gallery' | 'comic-reader';
