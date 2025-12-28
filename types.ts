
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

export interface MangaItem {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: number;
}

export type ViewState = 'shelf' | 'book-details' | 'editor' | 'gallery';
