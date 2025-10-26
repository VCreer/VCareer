import type { BookType } from '../../books/book-type.enum';

export interface CreateUpdateBookDto {
  name: string;
  type: BookType;
  publishDate: string;
  price: number;
}
