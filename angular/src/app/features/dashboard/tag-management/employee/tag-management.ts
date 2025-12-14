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
} from '../../../../shared/components';
import {
  TagCreateDto,
  TagUpdateDto,
  TagViewDto
} from 'src/app/proxy/dto/category/models';
import { TagService } from 'src/app/proxy/services/job';

export interface Tag {
  id: number;
  name: string;
  isActive: boolean;
  categoryId: string;
}

@Component({
  selector: 'app-tag-management',
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
  templateUrl: './tag-management.html',
  styleUrls: ['./tag-management.scss']
})
export class TagManagementComponent implements OnInit, OnDestroy {
  // Sidebar
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Context từ query params
  categoryId: string = '';
  categoryName: string = 'Danh mục con';

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
  allTags: Tag[] = [];
  filteredTags: Tag[] = [];
  paginatedTags: Tag[] = [];

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
  selectedTag: Tag | null = null;

  // Forms
  createForm = { name: '' };
  editForm = { name: '' };

  // Actions menu
  showActionsMenu: number | null = null;
  menuPosition: { top: number; left: number } | null = null;
  private currentMenuButton: HTMLElement | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.categoryId = params['categoryId'] || '';
      this.categoryName = params['categoryName'] || 'Danh mục con';

      if (!this.categoryId) {
        this.showToastMessage('Không tìm thấy danh mục con', 'error');
        this.router.navigate(['/employee/category-management']);
        return;
      }

      this.loadTags();
    });

    this.setupSidebarObserver();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) clearInterval(this.sidebarCheckInterval);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.removeClickOutsideListener();
  }

  // Sidebar responsive
  private setupSidebarObserver(): void {
    this.checkSidebarState();
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.resizeObserver = new ResizeObserver(() => this.checkSidebarState());
      this.resizeObserver.observe(sidebar);
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

  // Load tags theo categoryId
  private loadTags(): void {
    this.isLoading = true;
    this.tagService.getTagsByCategoryId(this.categoryId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (tags: TagViewDto[]) => {
          this.allTags = tags.map(t => ({
            id: t.id,
            name: t.name || '(Không có tên)',
            isActive: true,
            categoryId: t.categoryId || this.categoryId
          }));
          this.applyFilters();
        },
        error: () => {
          this.showToastMessage('Không thể tải danh sách tag', 'error');
          this.allTags = [];
          this.applyFilters();
        }
      });
  }

  // Filter & Sort
  applyFilters(): void {
    let result = [...this.allTags];

    if (this.searchKeyword.trim()) {
      const kw = this.searchKeyword.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(kw));
    }

    if (this.filterStatus) {
      const active = this.filterStatus === 'active';
      result = result.filter(t => t.isActive === active);
    }

    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredTags = result;
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
    this.totalPages = Math.ceil(this.filteredTags.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedTags = this.filteredTags.slice(start, start + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  // CRUD Tag
  onCreateTag(): void {
    this.createForm = { name: '' };
    this.showCreateModal = true;
  }

  onConfirmCreate(): void {
    const name = this.createForm.name.trim();
    if (!name) {
      this.showToastMessage('Vui lòng nhập tên tag', 'error');
      return;
    }
    if (this.isCreating) return;

    this.isCreating = true;
    const dto: TagCreateDto = {
      names: [name],
      categoryId: this.categoryId
    };

    this.tagService.createTags(dto)
      .pipe(finalize(() => this.isCreating = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Tạo tag thành công', 'success');
          this.showCreateModal = false;
          this.loadTags();
        },
        error: (err) => {
          const errorMsg = err?.error?.error?.message || 'Tạo tag thất bại';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onEditTag(tag: Tag): void {
    this.selectedTag = tag;
    this.editForm = { name: tag.name };
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onConfirmEdit(): void {
    if (!this.selectedTag || this.isUpdating) return;
    const newName = this.editForm.name.trim();
    if (!newName) {
      this.showToastMessage('Tên tag không được để trống', 'error');
      return;
    }

    this.isUpdating = true;
    const dto: TagUpdateDto = {
      tagId: this.selectedTag.id,
      newName: newName
    };

    this.tagService.updateTag(dto)
      .pipe(finalize(() => this.isUpdating = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Cập nhật tag thành công', 'success');
          this.showEditModal = false;
          this.loadTags();
        },
        error: (err) => {
          const errorMsg = err?.error?.error?.message || 'Cập nhật thất bại';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onDeleteTag(tag: Tag): void {
    this.selectedTag = tag;
    this.showDeleteModal = true;
    this.closeActionsMenu();
  }

  onConfirmDelete(): void {
    if (!this.selectedTag || this.isDeleting) return;

    this.isDeleting = true;
    this.tagService.deleteTags([this.selectedTag.id])
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Xóa tag thành công', 'success');
          this.showDeleteModal = false;
          this.selectedTag = null;
          this.loadTags();
        },
        error: (err) => {
          const errorMsg = err?.error?.error?.message || 'Xóa tag thất bại';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onToggleActive(tag: Tag): void {
    this.showToastMessage('Chức năng bật/tắt tag đang được phát triển', 'info');
    this.closeActionsMenu();
  }

  // Navigation
  onBackToCategory(): void {
    const parentId = this.route.snapshot.queryParams['parentId'];
    const parentName = this.route.snapshot.queryParams['parentName'];
    this.router.navigate(['/employee/sub-category-management'], {
      queryParams: { parentId, parentName }
    });
  }

  // Actions menu
  toggleActionsMenu(tagId: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.showActionsMenu === tagId) {
      this.closeActionsMenu();
      return;
    }
    this.currentMenuButton = event.currentTarget as HTMLElement;
    this.showActionsMenu = tagId;
    this.updateMenuPosition();
    this.addClickOutsideListener();
  }

  closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.menuPosition = null;
    this.currentMenuButton = null;
    this.removeClickOutsideListener();
  }

  private updateMenuPosition(): void {
    if (!this.currentMenuButton) return;
    const rect = this.currentMenuButton.getBoundingClientRect();
    let left = rect.right + 8;
    let top = rect.top;

    if (left + 220 > window.innerWidth) left = rect.left - 228;
    if (left < this.sidebarWidth + 16) left = this.sidebarWidth + 16;
    if (top + 180 > window.innerHeight) top = window.innerHeight - 196;

    this.menuPosition = { top, left };
  }

  private addClickOutsideListener(): void {
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside, true);
    }, 0);
  }

  private handleClickOutside = () => this.closeActionsMenu();
  
  private removeClickOutsideListener(): void {
    document.removeEventListener('click', this.handleClickOutside, true);
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
}