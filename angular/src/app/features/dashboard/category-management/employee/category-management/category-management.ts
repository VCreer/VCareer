import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  GenericModalComponent,
  SelectOption
} from '../../../../../shared/components';
import { 
  CategoryUpdateCreateDto,
  CategoryTreeDto
} from 'src/app/proxy/dto/category';
import { JobCategoryService } from 'src/app/proxy/services/job'; 

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  isActive: boolean;
  sortOrder: number;
  jobCount: number;
  subCategories: Category[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent,
    SelectFieldComponent,
    PaginationComponent,
    GenericModalComponent
  ],
  templateUrl: './category-management.html',
  styleUrls: ['./category-management.scss']
})
export class CategoryManagementComponent implements OnInit, OnDestroy {
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Loading state
  isLoading = false;
  isCreating = false;
  isUpdating = false;
  isDeleting = false;

  // Categories data
  allCategories: Category[] = [];
  filteredCategories: Category[] = [];
  paginatedCategories: Category[] = [];

  // Search & Filter
  searchKeyword = '';
  filterStatus = '';
  sortField: 'name' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Filter options
  statusOptions: SelectOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' }
  ];

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCategory: Category | null = null;

  // Forms
  createForm: CategoryUpdateCreateDto = {
    name: '',
    slug: '',
    description: '',
    parentId: null,
    sortOrder: 0,
    isActive: true
  };

  editForm: CategoryUpdateCreateDto = {
    name: '',
    slug: '',
    description: '',
    parentId: null,
    sortOrder: 0,
    isActive: true
  };

  // Actions Menu
  showActionsMenu: string | null = null;
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;
  private scrollListener?: () => void;
  private currentMenuCategoryId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  constructor(
    private router: Router,
    private jobCategoryService: JobCategoryService
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkSidebarState();
      });
      this.resizeObserver.observe(sidebar);
      
      sidebar.addEventListener('mouseenter', () => this.checkSidebarState());
      sidebar.addEventListener('mouseleave', () => this.checkSidebarState());
    }
    
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 50);

    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.removeScrollListener();
    this.removeClickOutsideListener();
    
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    this.checkSidebarState();
    this.updateMenuPosition();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.updateMenuPosition();
  }

  // Sidebar responsive
  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const isExpanded = sidebar.classList.contains('show') || 
                       sidebar.classList.contains('sidebar-expanded') ||
                       window.getComputedStyle(sidebar).width !== '72px';
      this.sidebarWidth = isExpanded ? 280 : 72;
    }
  }

  getPageMarginLeft(): string {
    return `${this.sidebarWidth}px`;
  }

  getPageWidth(): string {
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getBreadcrumbLeft(): string {
    return `${this.sidebarWidth}px`;
  }

  getBreadcrumbWidth(): string {
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    const padding = 32;
    return `calc(100% - ${padding}px)`;
  }

  // Load data
  loadCategories(): void {
    this.isLoading = true;
    this.jobCategoryService.getCategoryTree()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: CategoryTreeDto[]) => {
          this.allCategories = this.mapTreeDtoToCategory(response);
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.showToastMessage('Không thể tải danh sách danh mục', 'error');
        }
      });
  }

  // Map CategoryTreeDto to Category
  private mapTreeDtoToCategory(treeDtos: CategoryTreeDto[]): Category[] {
    return treeDtos.map(dto => ({
      id: dto.categoryId || '',
      name: dto.categoryName || '',
      description: dto.description,
      slug: dto.slug,
      parentCategoryId: undefined,
      parentCategoryName: undefined,
      isActive: true,
      sortOrder: 0,
      jobCount: dto.jobCount || 0,
      subCategories: dto.children ? this.mapTreeDtoToCategory(dto.children) : [],
      createdAt: undefined,
      updatedAt: undefined
    }));
  }

  // Filter & Sort
  applyFilters(): void {
    let filtered = [...this.allCategories];

    // Search
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = this.searchInCategories(filtered, keyword);
    }

    // Status filter
    if (this.filterStatus) {
      filtered = filtered.filter(cat => {
        if (this.filterStatus === 'active') return cat.isActive;
        if (this.filterStatus === 'inactive') return !cat.isActive;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (this.sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredCategories = filtered;
    this.updatePagination();
  }

  private searchInCategories(categories: Category[], keyword: string): Category[] {
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(keyword) ||
      (cat.description && cat.description.toLowerCase().includes(keyword))
    );
  }

  onSort(field: 'name'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCategories = this.filteredCategories.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // CRUD Operations
  onCreateCategory(): void {
    this.createForm = {
      name: '',
      slug: '',
      description: '',
      parentId: null,
      sortOrder: 0,
      isActive: true
    };
    this.isCreating = false;
    this.showCreateModal = true;
  }

  onManageSubCategories(category: Category): void {
    this.closeActionsMenu();
    this.router.navigate(['/employee/category-management/sub-categories'], {
      queryParams: { parentId: category.id, parentName: category.name }
    });
  }

  onConfirmCreate(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isCreating) {
      return;
    }

    if (!this.createForm.name?.trim()) {
      this.showToastMessage('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    this.isCreating = true;

    if (!this.createForm.slug) {
      this.createForm.slug = this.generateSlug(this.createForm.name);
    }

    this.jobCategoryService.createCategory(this.createForm)
      .pipe(finalize(() => this.isCreating = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Tạo danh mục thành công', 'success');
          this.showCreateModal = false;
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.showToastMessage(
            error?.error?.error?.message || 'Không thể tạo danh mục',
            'error'
          );
        }
      });
  }

  onEditCategory(category: Category): void {
    this.selectedCategory = category;
    this.editForm = {
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentCategoryId || null,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    };
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onConfirmEdit(): void {
    if (!this.selectedCategory || !this.editForm.name?.trim()) {
      this.showToastMessage('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    if (this.isUpdating) {
      return;
    }

    this.isUpdating = true;

    if (!this.editForm.slug) {
      this.editForm.slug = this.generateSlug(this.editForm.name);
    }

    this.jobCategoryService.updateCategory(this.selectedCategory.id, this.editForm)
      .pipe(finalize(() => this.isUpdating = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Cập nhật danh mục thành công', 'success');
          this.showEditModal = false;
          this.selectedCategory = null;
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.showToastMessage(
            error?.error?.error?.message || 'Không thể cập nhật danh mục',
            'error'
          );
        }
      });
  }

  onDeleteCategory(category: Category): void {
    this.selectedCategory = category;
    this.showDeleteModal = true;
    this.closeActionsMenu();
  }

  onConfirmDelete(): void {
    if (!this.selectedCategory) return;

    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    this.jobCategoryService.deleteCategory(this.selectedCategory.id)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Xóa danh mục thành công', 'success');
          this.showDeleteModal = false;
          this.selectedCategory = null;
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.showToastMessage(
            error?.error?.error?.message || 'Không thể xóa danh mục',
            'error'
          );
        }
      });
  }

  onToggleActive(category: Category): void {
    this.closeActionsMenu();
    
    const wasActive = category.isActive;
    
    const updateDto: CategoryUpdateCreateDto = {
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentCategoryId || null,
      sortOrder: category.sortOrder,
      isActive: !category.isActive
    };

    this.jobCategoryService.updateCategory(category.id, updateDto)
      .subscribe({
        next: () => {
          this.showToastMessage(
            wasActive ? 'Đã tắt danh mục' : 'Đã bật danh mục',
            'success'
          );
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error toggling category status:', error);
          this.showToastMessage(
            error?.error?.error?.message || 'Không thể thay đổi trạng thái danh mục',
            'error'
          );
        }
      });
  }

  // Actions Menu
  toggleActionsMenu(categoryId: string, event: MouseEvent): void {
    event.stopPropagation();
    
    if (this.showActionsMenu === categoryId) {
      this.closeActionsMenu();
      return;
    }

    this.currentMenuCategoryId = categoryId;
    this.currentMenuButton = event.currentTarget as HTMLElement;
    this.showActionsMenu = categoryId;
    this.updateMenuPosition();
    this.addScrollListener();
    this.addClickOutsideListener();
  }

  closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuCategoryId = null;
    this.currentMenuButton = null;
    this.menuPosition = null;
    this.removeScrollListener();
    this.removeClickOutsideListener();
  }

  private clickOutsideListener?: (event: MouseEvent) => void;

  private addClickOutsideListener(): void {
    this.removeClickOutsideListener();
    this.clickOutsideListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menu = document.querySelector('.actions-menu');
      const button = this.currentMenuButton;
      
      if (menu && button && !menu.contains(target) && !button.contains(target)) {
        this.closeActionsMenu();
      }
    };
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideListener!, true);
    }, 0);
  }

  private removeClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
      this.clickOutsideListener = undefined;
    }
  }

  private updateMenuPosition(): void {
    if (!this.currentMenuButton || !this.showActionsMenu) return;

    const buttonRect = this.currentMenuButton.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200;
    const menuHeight = 200;
    const padding = 16;

    let left = buttonRect.right + 8;
    let top = buttonRect.top;
    let maxWidth = menuWidth;

    if (left + menuWidth > viewportWidth - padding) {
      left = buttonRect.left - menuWidth - 8;
    }

    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const sidebarRect = sidebar.getBoundingClientRect();
      if (left < sidebarRect.right + padding) {
        left = sidebarRect.right + padding;
        maxWidth = viewportWidth - left - padding;
      }
    }

    if (left + menuWidth > viewportWidth - 300) {
      maxWidth = viewportWidth - left - 300;
    }

    if (top + menuHeight > viewportHeight - padding) {
      top = viewportHeight - menuHeight - padding;
    }

    this.menuPosition = { top, left, maxWidth };
  }

  private addScrollListener(): void {
    this.removeScrollListener();
    this.scrollListener = () => {
      this.updateMenuPosition();
    };
    window.addEventListener('scroll', this.scrollListener, true);
  }

  private removeScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = undefined;
    }
  }

  // Toast
  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onCloseToast(): void {
    this.showToast = false;
  }

  // Format helpers
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get sub-category names for a category
  getSubCategoryNames(categoryId: string): string[] {
    const category = this.allCategories.find(cat => cat.id === categoryId);
    if (category && category.subCategories) {
      return category.subCategories.map(sub => sub.name);
    }
    return [];
  }

  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}