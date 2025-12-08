import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryTreeDto } from '../../../proxy/dto/category/models';
import { ProvinceDto, WardDto } from '../../../proxy/dto/geo-dto/models';
import { JobCategoryService } from '../../../proxy/services/job/job-category.service';
import { GeoService } from '../../../core/services/Geo.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.html',
  styleUrls: ['./filter-bar.scss'],
})
export class FilterBarComponent implements OnInit, OnChanges, OnDestroy {
  // Input data từ parent (CandidateHomepage)
  @Input() categories: CategoryTreeDto[] = []; 
  @Input() provinces: ProvinceDto[] = []; 

  //  Pre-selected filters (from query params)
  @Input() selectedCategoryIds: string[] = [];
  @Input() selectedProvinceCodes: number[] = []; 
  @Input() selectedWardCodes: number[] = []; 

  // Output events
  @Output() categorySelected = new EventEmitter<string[]>(); // List of category GUIDs
  @Output() locationSelected = new EventEmitter<{ provinceIds: number[]; districtIds: number[] }>();

  // UI State
  showCategoryDropdown = false;
  showLocationDropdown = false;
  categorySearchKeyword = '';
  locationSearchKeyword = '';

  // Search results (flat list for search)
  searchResults: CategoryTreeDto[] = [];
  hasSearchResults = true; // ✅ Track if search has results
  hasLocationResults = true; // ✅ Track if location search has results

  // Location hover state (giống category)
  hoveredProvince: ProvinceDto | null = null;

  // ✅ Internal selected items (Set for faster lookup) - renamed to avoid conflict with @Input()
  internalSelectedCategoryIds: Set<string> = new Set();
  internalSelectedProvinceCodes: Set<number> = new Set(); // ✅ Sử dụng code thay vì id
  internalSelectedWardCodes: Set<number> = new Set(); // ✅ Sử dụng ward code thay vì district id

  // Hover state cho category multi-level
  hoveredLevel1Category: CategoryTreeDto | null = null;

  // Filtered data
  filteredCategories: CategoryTreeDto[] = [];
  filteredProvinces: ProvinceDto[] = [];

  // ✅ Debounce subjects
  private categorySearchSubject = new Subject<string>();
  private locationSearchSubject = new Subject<string>();

  constructor(
    private translationService: TranslationService,
    private category: JobCategoryService,
    private location: GeoService,
    private elementRef: ElementRef
  ) {
    // ✅ Setup debounce cho category search (300ms)
    this.categorySearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(keyword => {
        this.performCategorySearch(keyword);
      });

    // ✅ Setup debounce cho location search (300ms)
    this.locationSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(keyword => {
        this.performLocationSearch(keyword);
      });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnInit() {
    // ✅ Load FULL category tree và provinces ngay khi component init
    if (this.categories && this.categories.length > 0) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = [];
    }
    
    if (this.provinces && this.provinces.length > 0) {
      this.filteredProvinces = [...this.provinces];
    } else {
      this.filteredProvinces = [];
    }

    // ✅ Clear search keywords
    this.categorySearchKeyword = '';
    this.locationSearchKeyword = '';
  }

  ngOnChanges(changes: any) {
    // ✅ Update khi parent truyền data mới
    if (changes['categories'] && this.categories) {
      this.filteredCategories = [...this.categories];

      // ✅ When category tree arrives (after navigation from Home),
      // ensure parent checkboxes reflect currently selected leaf nodes.
      // If @Input selectedCategoryIds is available, sync internal set first.
      if (this.selectedCategoryIds && this.selectedCategoryIds.length > 0) {
        this.internalSelectedCategoryIds = new Set(this.selectedCategoryIds);
      }

      const ensureIds =
        this.selectedCategoryIds && this.selectedCategoryIds.length > 0
          ? this.selectedCategoryIds
          : Array.from(this.internalSelectedCategoryIds);

      ensureIds.forEach(id => this.selectParents(id));
    }
    if (changes['provinces'] && this.provinces) {
      this.filteredProvinces = [...this.provinces];
    }

    // ✅ Restore selected filters (from query params)
    if (changes['selectedCategoryIds'] && this.selectedCategoryIds) {
      // Restore selected leaf nodes
      this.internalSelectedCategoryIds = new Set(this.selectedCategoryIds);
      // ✅ Ensure parent levels (level 1, level 2) are also marked as selected
      // so that level-1 checkboxes appear checked/blue when any descendant is selected
      for (const catId of this.selectedCategoryIds) {
        this.selectParents(catId);
      }
    }

    if (changes['selectedProvinceCodes'] && this.selectedProvinceCodes) {
      this.internalSelectedProvinceCodes = new Set(this.selectedProvinceCodes);
    }

    if (changes['selectedWardCodes'] && this.selectedWardCodes) {
      this.internalSelectedWardCodes = new Set(this.selectedWardCodes);
    }
  }

  // ============================================
  // CATEGORY DROPDOWN METHODS
  // ============================================

  toggleCategoryDropdown() {
    this.showCategoryDropdown = !this.showCategoryDropdown;
     
    if (this.showCategoryDropdown) {
      this.showLocationDropdown = false; // Close location dropdown
      
      // ✅ ALWAYS reload data khi mở dropdown để đảm bảo có data mới nhất
      // Ngay cả khi categories rỗng, vẫn cần clear search để show empty state
      if (this.categories && this.categories.length > 0) {
        this.filteredCategories = [...this.categories];
      } else {
        this.filteredCategories = [];
      }
      
      // ✅ Clear search to show tree (luôn clear để hiển thị tree view)
      this.categorySearchKeyword = '';
      this.searchResults = [];
      this.hoveredLevel1Category = null; // Reset hover state
    }
  }

  /**
   * Hover vào category cấp 1 → Hiển thị cấp 2 và cấp 3 bên cạnh
   */
  onCategoryLevel1Hover(category: CategoryTreeDto) {
    this.hoveredLevel1Category = category;
  }

  /**
   * ✅ NEW: Search categories - Trigger debounce
   * User gõ → Đẩy vào subject → Chờ 300ms → Call API
   */
  onCategorySearch() {
    const keyword = this.categorySearchKeyword.trim();

    if (!keyword) {
      // ✅ Xóa hết search → Trở về FULL category tree
      this.searchResults = [];
      this.filteredCategories = [...this.categories];
      this.hasSearchResults = true;
      return;
    }

    // ✅ Có keyword → Xóa tree, chỉ hiển thị search results
    this.filteredCategories = []; // ← Ẩn tree khi đang search
    this.searchResults = []; // Reset search results cũ

    // ✅ Đẩy keyword vào subject → Debounce sẽ xử lý
    this.categorySearchSubject.next(keyword);
  }

  /**
   * ✅ NEW: Perform category search - Call API
   */
  private performCategorySearch(keyword: string) {
    this.category.searchCategories(keyword).subscribe({
      next: results => {
        this.searchResults = results;
        this.hasSearchResults = results.length > 0;
      },
      error: error => {
        console.error('❌ Category search error:', error);
        this.searchResults = [];
        this.hasSearchResults = false;
      },
    });
  }

  /**
   * ✅ FIX #2: Toggle checkbox với cascade logic
   * - Check parent → check tất cả children
   * - Check child → check parent và tất cả siblings
   * - Uncheck: Nếu bỏ hết children → bỏ parent
   */
  toggleCategorySelection(categoryId: string, event: Event) {
    event.stopPropagation();

    if (this.internalSelectedCategoryIds.has(categoryId)) {
      // Uncheck: Bỏ category này và tất cả children
      this.unselectCategoryAndChildren(categoryId);
      // Check xem có cần bỏ parent không
      this.checkAndUnselectParents(categoryId);
    } else {
      // Check: Chọn category này, tất cả children, và parents
      this.selectCategoryAndChildren(categoryId);
      this.selectParents(categoryId);
    }
  }

  /**
   * ✅ FIX #2: Select category và tất cả children
   */
  private selectCategoryAndChildren(categoryId: string) {
    this.internalSelectedCategoryIds.add(categoryId);

    const category = this.findCategoryById(categoryId);
    if (category && category.children) {
      category.children.forEach(child => {
        this.selectCategoryAndChildren(child.categoryId);
      });
    }
  }

  /**
   * ✅ FIX #2: Unselect category và tất cả children
   */
  private unselectCategoryAndChildren(categoryId: string) {
    this.internalSelectedCategoryIds.delete(categoryId);

    const category = this.findCategoryById(categoryId);
    if (category && category.children) {
      category.children.forEach(child => {
        this.unselectCategoryAndChildren(child.categoryId);
      });
    }
  }

  /**
   * ✅ FIX #2: Select tất cả parents của category
   */
  private selectParents(categoryId: string) {
    const parents = this.findParentChain(categoryId);
    parents.forEach(parentId => {
      this.internalSelectedCategoryIds.add(parentId);
    });
  }

  /**
   * ✅ FIX #2: Check và unselect parents nếu không còn children nào được chọn
   */
  private checkAndUnselectParents(categoryId: string) {
    const parents = this.findParentChain(categoryId);

    for (const parentId of parents) {
      const parent = this.findCategoryById(parentId);
      if (parent && parent.children) {
        // Kiểm tra xem có children nào còn được chọn không
        const hasSelectedChildren = parent.children.some(child =>
          this.internalSelectedCategoryIds.has(child.categoryId)
        );

        if (!hasSelectedChildren) {
          this.internalSelectedCategoryIds.delete(parentId);
        }
      }
    }
  }

  /**
   * ✅ FIX #2: Tìm chain parents của 1 category
   */
  private findParentChain(categoryId: string): string[] {
    const parents: string[] = [];

    // Tìm trong level 2 (parent là level 1)
    for (const level1 of this.categories) {
      for (const level2 of level1.children || []) {
        if (level2.categoryId === categoryId) {
          parents.push(level1.categoryId);
          return parents;
        }

        // Tìm trong level 3 (parent là level 2 và level 1)
        for (const level3 of level2.children || []) {
          if (level3.categoryId === categoryId) {
            parents.push(level2.categoryId, level1.categoryId);
            return parents;
          }
        }
      }
    }

    return parents;
  }

  /**
   * ✅ Check if có đang search không
   * Chỉ cần có keyword là đang search (bất kể có kết quả hay không)
   */
  isSearching(): boolean {
    return this.categorySearchKeyword.trim().length > 0;
  }

  /**
   * Tìm category theo ID trong tree HOẶC searchResults
   */
  private findCategoryById(id: string): CategoryTreeDto | null {
    // ✅ Tìm trong searchResults trước (nếu đang search)
    if (this.searchResults.length > 0) {
      const result = this.searchResults.find(cat => cat.categoryId === id);
      if (result) return result;
    }

    // ✅ Tìm trong tree đầy đủ
    for (const cat of this.categories) {
      if (cat.categoryId === id) return cat;
      if (cat.children) {
        for (const child of cat.children) {
          if (child.categoryId === id) return child;
          if (child.children) {
            for (const grandchild of child.children) {
              if (grandchild.categoryId === id) return grandchild;
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Check if category is selected
   */
  isCategorySelected(categoryId: string): boolean {
    return this.internalSelectedCategoryIds.has(categoryId);
  }

  /**
   * Bỏ chọn tất cả categories
   */
  clearAllCategories() {
    this.internalSelectedCategoryIds.clear();
  }

  /**
   * Apply category filter
   * ✅ Chỉ emit leaf node IDs
   */
  applyCategoryFilter() {
    const leafIds = Array.from(this.internalSelectedCategoryIds).filter(id => {
      const category = this.findCategoryById(id);
      return category?.isLeaf === true;
    });
    this.categorySelected.emit(leafIds);
    this.showCategoryDropdown = false;
  }

  // ============================================
  // LOCATION DROPDOWN METHODS - REWRITTEN FROM SCRATCH
  // ============================================

  /**
   * Toggle location dropdown (giống category)
   */
  toggleLocationDropdown() {
    this.showLocationDropdown = !this.showLocationDropdown;

    if (this.showLocationDropdown) {
      this.showCategoryDropdown = false; // Đóng category dropdown

      // Load full province list khi mở dropdown
      if (this.provinces.length > 0) {
        this.filteredProvinces = [...this.provinces];
        this.locationSearchKeyword = '';
      }
    }
  }

  /**
   * Hover province → Show districts
   */
  onProvinceHover(province: ProvinceDto) {
    this.hoveredProvince = province;
  }

  /**
   * ✅ NEW: Search locations - Trigger debounce
   * User gõ → Đẩy vào subject → Chờ 300ms → Call API
   */
  onLocationSearch() {
    const keyword = this.locationSearchKeyword.trim();

    if (!keyword) {
      // Không có keyword → Show tất cả
      this.filteredProvinces = [...this.provinces];
      this.hasLocationResults = true;
      return;
    }

    // ✅ Đẩy keyword vào subject → Debounce sẽ xử lý
    this.locationSearchSubject.next(keyword);
  }

  /**
   * ✅ NEW: Perform location search - Filter trong danh sách provinces có sẵn
   * Vì ProvinceDto từ geo-dto có cấu trúc khác, ta sẽ filter trong danh sách đã có
   */
  private performLocationSearch(keyword: string) {
    if (!this.provinces || this.provinces.length === 0) {
      this.filteredProvinces = [];
      this.hasLocationResults = false;
      return;
    }

    const lowerKeyword = keyword.toLowerCase();
    const filtered = this.provinces.filter(province => {
      // Tìm trong tên province
      if (province.name?.toLowerCase().includes(lowerKeyword)) {
        return true;
      }
      // Tìm trong tên wards
      if (province.wards) {
        return province.wards.some(ward => 
          ward.name?.toLowerCase().includes(lowerKeyword)
        );
      }
      return false;
    });

    this.filteredProvinces = filtered;
    this.hasLocationResults = filtered.length > 0;
  }

  /**
   * Toggle province selection (với cascade logic) - ✅ Sử dụng code thay vì id
   */
  toggleProvinceSelection(provinceCode: number, event: Event) {
    event.stopPropagation();

    const province = this.provinces.find(p => p.code === provinceCode);
    if (!province) return;

    if (this.internalSelectedProvinceCodes.has(provinceCode)) {
      // Uncheck province → Uncheck all wards
      this.internalSelectedProvinceCodes.delete(provinceCode);
      if (province.wards) {
        province.wards.forEach(ward => {
          if (ward.code) {
            this.internalSelectedWardCodes.delete(ward.code);
          }
        });
      }
    } else {
      // Check province → Check all wards
      this.internalSelectedProvinceCodes.add(provinceCode);
      if (province.wards) {
        province.wards.forEach(ward => {
          if (ward.code) {
            this.internalSelectedWardCodes.add(ward.code);
          }
        });
      }
    }
  }

  /**
   * Toggle ward selection (với cascade logic) - ✅ Sử dụng code thay vì id
   */
  toggleDistrictSelection(provinceCode: number, wardCode: number, event: Event) {
    event.stopPropagation();

    const province = this.provinces.find(p => p.code === provinceCode);
    if (!province) return;

    if (this.internalSelectedWardCodes.has(wardCode)) {
      // Uncheck ward
      this.internalSelectedWardCodes.delete(wardCode);

      // Nếu không còn ward nào được chọn → Uncheck province
      const hasOtherWards = province.wards?.some(
        w => w.code !== wardCode && w.code && this.internalSelectedWardCodes.has(w.code)
      );
      if (!hasOtherWards) {
        this.internalSelectedProvinceCodes.delete(provinceCode);
      }
    } else {
      // Check ward → Auto check province
      this.internalSelectedWardCodes.add(wardCode);
      this.internalSelectedProvinceCodes.add(provinceCode);
    }
  }

  /**
   * Check if province is selected - ✅ Sử dụng code
   */
  isProvinceSelected(provinceCode: number | undefined): boolean {
    if (!provinceCode) return false;
    return this.internalSelectedProvinceCodes.has(provinceCode);
  }

  /**
   * Check if ward is selected - ✅ Sử dụng code
   */
  isDistrictSelected(wardCode: number | undefined): boolean {
    if (!wardCode) return false;
    return this.internalSelectedWardCodes.has(wardCode);
  }

  /**
   * Clear all location selections
   */
  clearAllLocations() {
    this.internalSelectedProvinceCodes.clear();
    this.internalSelectedWardCodes.clear();
  }

  /**
   * Apply location filter - ✅ Emit codes thay vì ids
   */
  applyLocationFilter() {
    this.locationSelected.emit({
      provinceIds: Array.from(this.internalSelectedProvinceCodes), // ✅ Vẫn dùng provinceIds cho backward compatibility
      districtIds: Array.from(this.internalSelectedWardCodes), // ✅ Vẫn dùng districtIds cho backward compatibility
    });
    this.showLocationDropdown = false;
  }

  /**
   * Close all dropdowns
   */
  closeDropdowns() {
    this.showCategoryDropdown = false;
    this.showLocationDropdown = false;
  }

  /**
   * Đóng dropdown khi click ra ngoài
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.showCategoryDropdown || this.showLocationDropdown) {
      const clickedInside = this.elementRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.closeDropdowns();
      }
    }
  }

  /**
   * Get category count text for display
   */
  getCategoryCountText(): string {
    const count = this.internalSelectedCategoryIds.size;
    return count > 0 ? ` (${count})` : '';
  }

  /**
   * Get location count text for display
   */
  getLocationCountText(): string {
    const provinceCount = this.internalSelectedProvinceCodes.size;
    const wardCount = this.internalSelectedWardCodes.size;
    const totalCount = provinceCount + wardCount;
    return totalCount > 0 ? ` (${totalCount})` : '';
    }

  /**
   * ✅ Cleanup subscriptions khi component bị destroy
   */
  ngOnDestroy() {
    this.categorySearchSubject.complete();
    this.locationSearchSubject.complete();
  }
}
