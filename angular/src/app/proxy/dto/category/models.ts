
export interface CategoryTreeDto {
  categoryId?: string;
  categoryName?: string;
  slug?: string;
  description?: string;
  jobCount: number;
  children: CategoryTreeDto[];
  fullPath?: string;
  isLeaf: boolean;
}

export interface CategoryUpdateCreateDto {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface TagCreateDto {
  names: string[];
  categoryId?: string;
}

export interface TagUpdateDto {
  tagId: number;
  newName?: string;
}
