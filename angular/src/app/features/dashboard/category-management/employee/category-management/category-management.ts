import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  GenericModalComponent,
  SelectOption
} from '../../../../../shared/components';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
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

  parentCategoryOptions: SelectOption[] = [
    { value: '', label: 'Tất cả danh mục cha' },
    { value: 'none', label: 'Không có danh mục cha' }
  ];

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCategory: Category | null = null;
  isCreating = false;

  // Forms
  createForm = {
    name: '',
    isActive: true
  };

  editForm = {
    name: '',
    isActive: true
  };

  // Actions Menu
  showActionsMenu: string | null = null;
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;
  private scrollListener?: () => void;
  private currentMenuCategoryId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  constructor(private router: Router) {}

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
    this.updateParentCategoryOptions();
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
    // TODO: Call API to load categories
    // Mock data for now
    this.allCategories = [
      {
        id: '1',
        name: 'Công nghệ thông tin',
        description: 'Danh mục về công nghệ thông tin',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Kế toán',
        description: 'Danh mục về kế toán',
        isActive: true,
        displayOrder: 2,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        id: '3',
        name: 'Marketing',
        description: 'Danh mục về marketing',
        parentCategoryId: '1',
        parentCategoryName: 'Công nghệ thông tin',
        isActive: true,
        displayOrder: 3,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      }
    ];
    this.applyFilters();
  }

  updateParentCategoryOptions(): void {
    // Add all categories as parent options
    const parentOptions: SelectOption[] = [
      { value: '', label: 'Tất cả danh mục cha' },
      { value: 'none', label: 'Không có danh mục cha' }
    ];
    
    this.allCategories.forEach(cat => {
      parentOptions.push({ value: cat.id, label: cat.name });
    });
    
    this.parentCategoryOptions = parentOptions;
  }

  // Filter & Sort
  applyFilters(): void {
    let filtered = [...this.allCategories];

    // Only show categories without parent (main categories)
    filtered = filtered.filter(cat => !cat.parentCategoryId);

    // Search
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(keyword)
      );
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
      isActive: true
    };
    this.isCreating = false;
    this.showCreateModal = true;
  }

  onManageSubCategories(category: Category): void {
    this.closeActionsMenu();
    // Navigate to sub-category management with parent category ID
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

    if (!this.createForm.name.trim()) {
      this.showToastMessage('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    this.isCreating = true;

    // TODO: Call API to create category
    const newCategory: Category = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: this.createForm.name,
      isActive: this.createForm.isActive,
      displayOrder: this.allCategories.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.allCategories.push(newCategory);
    this.updateParentCategoryOptions();
    this.applyFilters();
    this.showToastMessage('Tạo danh mục thành công', 'success');
    this.showCreateModal = false;
    this.isCreating = false;
  }

  onEditCategory(category: Category): void {
    this.selectedCategory = category;
    this.editForm = {
      name: category.name,
      isActive: category.isActive
    };
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onConfirmEdit(): void {
    if (!this.selectedCategory || !this.editForm.name.trim()) {
      this.showToastMessage('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    // TODO: Call API to update category
    const index = this.allCategories.findIndex(c => c.id === this.selectedCategory!.id);
    if (index > -1) {
      this.allCategories[index] = {
        ...this.allCategories[index],
        name: this.editForm.name,
        isActive: this.editForm.isActive,
        updatedAt: new Date()
      };
    }

    this.updateParentCategoryOptions();
    this.applyFilters();
    this.showToastMessage('Cập nhật danh mục thành công', 'success');
    this.showEditModal = false;
    this.selectedCategory = null;
  }

  onDeleteCategory(category: Category): void {
    this.selectedCategory = category;
    this.showDeleteModal = true;
    this.closeActionsMenu();
  }

  onConfirmDelete(): void {
    if (!this.selectedCategory) return;

    // TODO: Call API to delete category
    const index = this.allCategories.findIndex(c => c.id === this.selectedCategory!.id);
    if (index > -1) {
      this.allCategories.splice(index, 1);
    }

    this.updateParentCategoryOptions();
    this.applyFilters();
    this.showToastMessage('Xóa danh mục thành công', 'success');
    this.showDeleteModal = false;
    this.selectedCategory = null;
  }

  onToggleActive(category: Category): void {
    this.closeActionsMenu();
    
    const wasActive = category.isActive;
    
    // TODO: Call API to toggle active status
    const index = this.allCategories.findIndex(c => c.id === category.id);
    if (index > -1) {
      this.allCategories[index] = {
        ...this.allCategories[index],
        isActive: !this.allCategories[index].isActive,
        updatedAt: new Date()
      };
    }

    this.updateParentCategoryOptions();
    this.applyFilters();
    this.showToastMessage(
      wasActive ? 'Đã tắt danh mục' : 'Đã bật danh mục',
      'success'
    );
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

    // Adjust for viewport
    if (left + menuWidth > viewportWidth - padding) {
      left = buttonRect.left - menuWidth - 8;
    }

    // Adjust for sidebar
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const sidebarRect = sidebar.getBoundingClientRect();
      if (left < sidebarRect.right + padding) {
        left = sidebarRect.right + padding;
        maxWidth = viewportWidth - left - padding;
      }
    }

    // Adjust for DevTools (if open)
    if (left + menuWidth > viewportWidth - 300) {
      maxWidth = viewportWidth - left - 300;
    }

    // Adjust for bottom
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
    return this.allCategories
      .filter(cat => cat.parentCategoryId === categoryId)
      .map(cat => cat.name);
  }

  // Getter methods for filtered options
  get parentCategoryOptionsForCreate(): SelectOption[] {
    return this.parentCategoryOptions.filter(opt => opt.value !== '' && opt.value !== 'none');
  }

  get parentCategoryOptionsForEdit(): SelectOption[] {
    return this.parentCategoryOptions.filter(opt => 
      opt.value !== '' && 
      opt.value !== 'none' && 
      opt.value !== this.selectedCategory?.id
    );
  }
}
