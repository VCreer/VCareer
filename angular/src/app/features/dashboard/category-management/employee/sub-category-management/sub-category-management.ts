import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { TagService } from 'src/app/proxy/services/job';
import { TagViewDto } from 'src/app/proxy/dto/category';

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parentCategoryId: string;
  parentCategoryName: string;
  isActive: boolean;
  sortOrder: number;
  jobCount: number;
  tags: string[];        // Danh sách tên tag (hiện tại mock, sau này sẽ lấy từ API riêng)
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-sub-category-management',
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
  templateUrl: './sub-category-management.html',
  styleUrls: ['./sub-category-management.scss']
})
export class SubCategoryManagementComponent implements OnInit, OnDestroy {
  // Sidebar
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Parent category info
  parentCategoryId: string = '';
  parentCategoryName: string = 'Danh mục cha';

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Loading states
  isLoading = false;
  isCreating = false;
  isUpdating = false;
  isDeleting = false;

  // Data
  allCategories: SubCategory[] = [];
  filteredCategories: SubCategory[] = [];
  paginatedCategories: SubCategory[] = [];

  // Search & Filter
  searchKeyword = '';
  filterStatus = '';
  sortField: 'name' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  statusOptions: SelectOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' }
  ];

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCategory: SubCategory | null = null;

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

  // Actions menu
  showActionsMenu: string | null = null;
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;
  private scrollListener?: () => void;
  private currentMenuButton: HTMLElement | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private jobCategoryService: JobCategoryService,
     private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.parentCategoryId = params['parentId'] || '';
      this.parentCategoryName = params['parentName'] || 'Danh mục cha';

      if (this.parentCategoryId) {
        this.loadSubCategories();
      } else {
        this.router.navigate(['/employee/category-management']);
      }
    });

    this.setupSidebarObserver();
  }

  ngOnDestroy(): void {
    this.removeScrollListener();
    if (this.sidebarCheckInterval) clearInterval(this.sidebarCheckInterval);
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }

  // Sidebar responsive
  private setupSidebarObserver(): void {
    this.checkSidebarState();
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.resizeObserver = new ResizeObserver(() => this.checkSidebarState());
      this.resizeObserver.observe(sidebar);
      sidebar.addEventListener('mouseenter', () => this.checkSidebarState());
      sidebar.addEventListener('mouseleave', () => this.checkSidebarState());
    }
    this.sidebarCheckInterval = setInterval(() => this.checkSidebarState(), 100);
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const isExpanded = sidebar.classList.contains('show') ||
        sidebar.classList.contains('sidebar-expanded') ||
        window.getComputedStyle(sidebar).width !== '72px';
      this.sidebarWidth = isExpanded ? 280 : 72;
    }
  }

  getPageMarginLeft(): string { return `${this.sidebarWidth}px`; }
  getPageWidth(): string { return `calc(100% - ${this.sidebarWidth}px)`; }
  getBreadcrumbLeft(): string { return `${this.sidebarWidth}px`; }
  getBreadcrumbWidth(): string { return `calc(100% - ${this.sidebarWidth}px)`; }
  getContentMaxWidth(): string { return `calc(100% - 32px)`; }

  @HostListener('window:resize') onResize() { this.checkSidebarState(); this.updateMenuPosition(); }
  @HostListener('window:scroll') onScroll() { this.updateMenuPosition(); }

private loadSubCategories(): void {
  this.isLoading = true;
  this.jobCategoryService.getCategoryTree()
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (tree: CategoryTreeDto[]) => {
        const parent = this.findCategoryById(tree, this.parentCategoryId);
        if (parent?.children) {
          this.allCategories = parent.children.map(child => ({
            id: child.categoryId || '',
            name: child.categoryName || '',
            description: child.description,
            slug: child.slug,
            parentCategoryId: this.parentCategoryId,
            parentCategoryName: this.parentCategoryName,
            isActive: true,
            sortOrder: 0,
            jobCount: child.jobCount || 0,
            tags: [], // ✅ Khởi tạo mảng rỗng
            createdAt: undefined,
            updatedAt: undefined
          }));
          
          // ✅ THÊM: Load tags cho từng category
          this.allCategories.forEach(cat => {
            this.loadTagsForCategory(cat.id);
          });
        } else {
          this.allCategories = [];
        }
        this.applyFilters();
      },
      error: () => {
        this.showToastMessage('Không thể tải danh sách danh mục con', 'error');
      }
    });
}

  // Tìm category trong cây
  private findCategoryById(nodes: CategoryTreeDto[], id: string): CategoryTreeDto | null {
    for (const node of nodes) {
      if (node.categoryId === id) return node;
      if (node.children?.length) {
        const found = this.findCategoryById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

 // ✅ GIỮ NGUYÊN - hàm này đã đúng
getTagNames(categoryId: string): string[] {
  const cat = this.allCategories.find(c => c.id === categoryId);
  return cat?.tags || [];
}

  // Filter & Sort
  applyFilters(): void {
    let result = [...this.allCategories];

    if (this.searchKeyword.trim()) {
      const kw = this.searchKeyword.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(kw) ||
        c.description?.toLowerCase().includes(kw)
      );
    }

    if (this.filterStatus) {
      const active = this.filterStatus === 'active';
      result = result.filter(c => c.isActive === active);
    }

    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredCategories = result;
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

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedCategories = this.filteredCategories.slice(start, start + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // CRUD
  onCreateCategory(): void {
    this.createForm = {
      name: '',
      slug: '',
      description: '',
      parentId: this.parentCategoryId,
      sortOrder: 0,
      isActive: true
    };
    this.showCreateModal = true;
  }

  onConfirmCreate(): void {
    if (this.isCreating || !this.createForm.name?.trim()) {
      this.showToastMessage('Vui lòng nhập tên danh mục con', 'error');
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
          this.showToastMessage('Tạo danh mục con thành công', 'success');
          this.showCreateModal = false;
          this.loadSubCategories();
        },
        error: () => this.showToastMessage('Không thể tạo danh mục con', 'error')
      });
  }

  onEditCategory(cat: SubCategory): void {
    this.selectedCategory = cat;
    this.editForm = { ...cat, parentId: cat.parentCategoryId };
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onConfirmEdit(): void {
    if (this.isUpdating || !this.editForm.name?.trim() || !this.selectedCategory) return;

    this.isUpdating = true;
    if (!this.editForm.slug) {
      this.editForm.slug = this.generateSlug(this.editForm.name);
    }

    this.jobCategoryService.updateCategory(this.selectedCategory.id, this.editForm)
      .pipe(finalize(() => this.isUpdating = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Cập nhật thành công', 'success');
          this.showEditModal = false;
          this.loadSubCategories();
        },
        error: () => this.showToastMessage('Cập nhật thất bại', 'error')
      });
  }

  onDeleteCategory(cat: SubCategory): void {
    this.selectedCategory = cat;
    this.showDeleteModal = true;
    this.closeActionsMenu();
  }

  onConfirmDelete(): void {
    if (!this.selectedCategory || this.isDeleting) return;
    this.isDeleting = true;

    this.jobCategoryService.deleteCategory(this.selectedCategory.id)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Xóa thành công', 'success');
          this.showDeleteModal = false;
          this.loadSubCategories();
        },
        error: () => this.showToastMessage('Xóa thất bại', 'error')
      });
  }
private loadTagsForCategory(categoryId: string): void {
  this.tagService.getTagsByCategoryId(categoryId).subscribe({
    next: (tags: TagViewDto[]) => {
      const category = this.allCategories.find(c => c.id === categoryId);
      if (category) {
        category.tags = tags.map(t => t.name || '');
      }
    },
    error: (err) => {
      console.error('Error loading tags for category:', categoryId, err);
    }
  });
}

  onToggleActive(cat: SubCategory): void {
    const updateDto: CategoryUpdateCreateDto = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parentId: cat.parentCategoryId,
      sortOrder: cat.sortOrder,
      isActive: !cat.isActive
    };

    this.jobCategoryService.updateCategory(cat.id, updateDto).subscribe({
      next: () => {
        this.showToastMessage(cat.isActive ? 'Đã tắt' : 'Đã bật', 'success');
        this.loadSubCategories();
      },
      error: () => this.showToastMessage('Thao tác thất bại', 'error')
    });
    this.closeActionsMenu();
  }

  onManageTags(cat: SubCategory): void {
    this.closeActionsMenu();
    this.router.navigate(['/employee/tag-management'], {
      queryParams: { categoryId: cat.id, categoryName: cat.name }
    });
  }

  onBackToParent(): void {
    this.router.navigate(['/employee/category-management']);
  }

  // Actions menu
  toggleActionsMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.showActionsMenu === id) {
      this.closeActionsMenu();
      return;
    }
    this.currentMenuButton = event.currentTarget as HTMLElement;
    this.showActionsMenu = id;
    this.updateMenuPosition();
    this.addClickOutsideListener();
    this.addScrollListener();
  }

  closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.menuPosition = null;
    this.currentMenuButton = null;
    this.removeClickOutsideListener();
    this.removeScrollListener();
  }

  private updateMenuPosition(): void {
    if (!this.currentMenuButton) return;
    const rect = this.currentMenuButton.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = rect.right + 8;
    let top = rect.top;
    let maxWidth = 220;

    if (left + 220 > viewportWidth - 16) {
      left = rect.left - 228;
    }
    if (left < this.sidebarWidth + 16) {
      left = this.sidebarWidth + 16;
    }
    if (top + 200 > viewportHeight) {
      top = viewportHeight - 216;
    }

    this.menuPosition = { top, left, maxWidth };
  }

  private addClickOutsideListener(): void {
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside, true);
    }, 0);
  }

  private handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.actions-menu') && !target.closest('.actions-menu-btn')) {
      this.closeActionsMenu();
    }
  };

  private removeClickOutsideListener(): void {
    document.removeEventListener('click', this.handleClickOutside, true);
  }

  private addScrollListener(): void {
    this.scrollListener = () => this.updateMenuPosition();
    window.addEventListener('scroll', this.scrollListener, true);
  }

  private removeScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = undefined;
    }
  }

  // Toast
  showToastMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  onCloseToast(): void {
    this.showToast = false;
  }

  // Utils
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}