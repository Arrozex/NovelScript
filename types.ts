
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
  description: string;
  pages: ComicPage[];
  createdAt: number;
}

export type ViewState = 'shelf' | 'book-details' | 'editor' | 'gallery' | 'comic-reader';
