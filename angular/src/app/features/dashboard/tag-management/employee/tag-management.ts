import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  GenericModalComponent,
  SelectOption
} from '../../../../shared/components';

export interface Tag {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Category info
  categoryId: string = '';
  categoryName: string = '';

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Tags data
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
  selectedTag: Tag | null = null;
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
  private currentMenuTagId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get category info from query params
    this.route.queryParams.subscribe(params => {
      this.categoryId = params['categoryId'] || '';
      this.categoryName = params['categoryName'] || 'Danh mục';
    });

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

    this.loadTags();
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
  loadTags(): void {
    // TODO: Call API to load tags by categoryId
    // Mock data for now
    this.allTags = [
      {
        id: '1',
        name: 'Tag 1',
        categoryId: this.categoryId,
        categoryName: this.categoryName,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Tag 2',
        categoryId: this.categoryId,
        categoryName: this.categoryName,
        isActive: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];
    this.applyFilters();
  }

  // Filter & Sort
  applyFilters(): void {
    let filtered = [...this.allTags];

    // Filter by category
    if (this.categoryId) {
      filtered = filtered.filter(tag => tag.categoryId === this.categoryId);
    }

    // Search
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(tag =>
        tag.name.toLowerCase().includes(keyword)
      );
    }

    // Status filter
    if (this.filterStatus) {
      filtered = filtered.filter(tag => {
        if (this.filterStatus === 'active') return tag.isActive;
        if (this.filterStatus === 'inactive') return !tag.isActive;
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

    this.filteredTags = filtered;
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
    this.totalPages = Math.ceil(this.filteredTags.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTags = this.filteredTags.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // CRUD Operations
  onCreateTag(): void {
    this.createForm = {
      name: '',
      isActive: true
    };
    this.isCreating = false;
    this.showCreateModal = true;
  }

  onConfirmCreate(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isCreating) {
      return;
    }

    if (!this.createForm.name.trim()) {
      this.showToastMessage('Vui lòng nhập tên tag', 'error');
      return;
    }

    this.isCreating = true;

    // TODO: Call API to create tag
    const newTag: Tag = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: this.createForm.name,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      isActive: this.createForm.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.allTags.push(newTag);
    this.applyFilters();
    this.showToastMessage('Tạo tag thành công', 'success');
    this.showCreateModal = false;
    this.isCreating = false;
  }

  onEditTag(tag: Tag): void {
    this.selectedTag = tag;
    this.editForm = {
      name: tag.name,
      isActive: tag.isActive
    };
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onConfirmEdit(): void {
    if (!this.selectedTag || !this.editForm.name.trim()) {
      this.showToastMessage('Vui lòng nhập tên tag', 'error');
      return;
    }

    // TODO: Call API to update tag
    const index = this.allTags.findIndex(t => t.id === this.selectedTag!.id);
    if (index > -1) {
      this.allTags[index] = {
        ...this.allTags[index],
        name: this.editForm.name,
        isActive: this.editForm.isActive,
        updatedAt: new Date()
      };
    }

    this.applyFilters();
    this.showToastMessage('Cập nhật tag thành công', 'success');
    this.showEditModal = false;
    this.selectedTag = null;
  }

  onDeleteTag(tag: Tag): void {
    this.selectedTag = tag;
    this.showDeleteModal = true;
    this.closeActionsMenu();
  }

  onConfirmDelete(): void {
    if (!this.selectedTag) return;

    // TODO: Call API to delete tag
    const index = this.allTags.findIndex(t => t.id === this.selectedTag!.id);
    if (index > -1) {
      this.allTags.splice(index, 1);
    }

    this.applyFilters();
    this.showToastMessage('Xóa tag thành công', 'success');
    this.showDeleteModal = false;
    this.selectedTag = null;
  }

  onToggleActive(tag: Tag): void {
    this.closeActionsMenu();
    
    const wasActive = tag.isActive;
    
    // TODO: Call API to toggle active status
    const index = this.allTags.findIndex(t => t.id === tag.id);
    if (index > -1) {
      this.allTags[index] = {
        ...this.allTags[index],
        isActive: !this.allTags[index].isActive,
        updatedAt: new Date()
      };
    }

    this.applyFilters();
    this.showToastMessage(
      wasActive ? 'Đã tắt tag' : 'Đã bật tag',
      'success'
    );
  }

  // Actions Menu
  toggleActionsMenu(tagId: string, event: MouseEvent): void {
    event.stopPropagation();
    
    if (this.showActionsMenu === tagId) {
      this.closeActionsMenu();
      return;
    }

    this.currentMenuTagId = tagId;
    this.currentMenuButton = event.currentTarget as HTMLElement;
    this.showActionsMenu = tagId;
    this.updateMenuPosition();
    this.addScrollListener();
    this.addClickOutsideListener();
  }

  closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuTagId = null;
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

  // Navigation
  onBackToCategory(): void {
    this.router.navigate(['/employee/category-management/sub-categories'], {
      queryParams: { parentId: this.categoryId, parentName: this.categoryName }
    });
  }
}

